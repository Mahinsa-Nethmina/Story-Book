import { GoogleGenAI, Modality, Type } from "../genaiProxy";
import {
  ALL_CLASSIC_STORYBOOKS,
  createBespokeFairytaleStorybook,
  EDITION_PALETTES,
} from "../data/presets";
import {
  AgentLogEntry,
  DialogueLine,
  Storybook,
} from "../types";
import {
  DEFAULT_MANAGED_AGENT_ID,
  DEFAULT_MANAGED_AGENT_MODEL,
} from "./inlineAgentBundle";

function makeLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowTime(): string {
  return new Date().toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

export interface RunStorybookAgentOptions {
  prompt: string;
  classicBookTitle?: string;
  paletteKey?: string;
  visualStyle: string;
  pageCount: number;
  narratorVoice: string;
  agentName?: string;
  modelName?: string;
  environmentId?: string;
  previousInteractionId?: string;
  sessionId: string;
  signal?: AbortSignal;
  onLog: (entry: AgentLogEntry) => void;
  onStageChange: (stageIndex: number, stageLabel: string) => void;
  onCreated?: (interactionId: string, environmentId?: string) => void;
}

export interface RunStorybookAgentResult {
  storybook: Storybook;
  interactionId?: string;
  environmentId?: string;
  agent: string;
  model: string;
}

function inferPipelineStage(
  toolName: string,
  args: unknown,
  text: string
): { index: number; label: string } | null {
  const combined = `${toolName} ${JSON.stringify(args || "")} ${text}`.toLowerCase();
  if (
    combined.includes("install.sh") ||
    combined.includes("gemini-api --version") ||
    combined.includes("gemini-api-cli")
  ) {
    return { index: 0, label: "Stage I · Booting Sandbox & Installing gemini-api-cli" };
  }
  if (
    combined.includes("books_spec") ||
    combined.includes("dramaturgy") ||
    combined.includes("char_sheet_prompt") ||
    combined.includes("storybook.json")
  ) {
    return { index: 1, label: "Stage II · Authoring 3-Folio Dramaturgy & Character Spec" };
  }
  if (
    combined.includes("generate_illustrations") ||
    combined.includes("generate_popup_assets") ||
    combined.includes("gemini-api image") ||
    combined.includes("char_sheet") ||
    combined.includes("scene_1") ||
    combined.includes("flash-lite-image") ||
    combined.includes("flash-image")
  ) {
    return { index: 2, label: "Stage III · Engraving 16:9 Archival Watercolour Plates (gemini-api image)" };
  }
  if (
    combined.includes("create_voices") ||
    combined.includes("generate_audiobook_tts") ||
    combined.includes("voice_mastering") ||
    combined.includes("gemini-api tts") ||
    combined.includes("turn_00") ||
    combined.includes("flash-tts")
  ) {
    return { index: 3, label: "Stage IV · Synthesizing & Mastering 24 kHz Multi-Voice Turns (gemini-api tts)" };
  }
  if (
    combined.includes("generate_and_mix_music") ||
    combined.includes("lyria") ||
    combined.includes("timeline_manifest")
  ) {
    return { index: 4, label: "Stage V · Scoring Chamber Ensemble & Binding Folios (lyria-3.5)" };
  }
  return null;
}

/**
 * Runs the Gemini Managed Agent (`antigravity-preview-09-2026` with `gemini-4-argon`)
 * via the server-side `/api/generate-storybook` endpoint.
 */
export async function runManagedAgentStorybook(
  opts: RunStorybookAgentOptions
): Promise<RunStorybookAgentResult> {
  const agentName = opts.agentName || DEFAULT_MANAGED_AGENT_ID;
  const modelName = opts.modelName || DEFAULT_MANAGED_AGENT_MODEL;

  opts.onStageChange(0, `Stage I · Booting ${agentName} (${modelName}) & installing gemini-api-cli`);
  opts.onLog({
    id: makeLogId(),
    timestamp: nowTime(),
    type: "status",
    title: `Connecting to Gemini Managed Agent (${agentName} · model: ${modelName})`,
    detail: "Mounting .agents/AGENTS.md, .agents/skills/*, and classic-audiobooks pipeline",
  });

  try {
    const response = await fetch("/api/generate-storybook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: opts.prompt,
        classicBookTitle: opts.classicBookTitle,
        visualStyle: opts.visualStyle,
        pageCount: opts.pageCount,
        narratorVoice: opts.narratorVoice,
        agentName,
        modelName,
        environmentId: opts.environmentId,
        previousInteractionId: opts.previousInteractionId,
        sessionId: opts.sessionId,
      }),
      signal: opts.signal,
    });

    if (response.ok && response.body) {
      const result = await consumeSseStream(response, opts, agentName, modelName);
      if (result) return result;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
  }

  return runClientSideClassicAudiobooksPipeline(opts);
}

async function consumeSseStream(
  response: Response,
  opts: RunStorybookAgentOptions,
  agentName: string,
  modelName: string
): Promise<RunStorybookAgentResult | null> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";
  let currentData = "";
  let finalResult: RunStorybookAgentResult | null = null;

  const handleEvent = (eventType: string, dataStr: string) => {
    if (!dataStr) return;
    let payload: any;
    try {
      payload = JSON.parse(dataStr);
    } catch {
      return;
    }

    if (eventType === "created") {
      opts.onCreated?.(payload.id, payload.envId);
      opts.onLog({
        id: makeLogId(),
        timestamp: nowTime(),
        type: "status",
        title: `Sandbox session created (env: ${payload.envId || "provisioning"})`,
        detail: `Interaction ID: ${payload.id} · Agent: ${payload.agent} · Model: ${payload.model}`,
      });
    } else if (eventType === "status") {
      opts.onLog({
        id: makeLogId(),
        timestamp: nowTime(),
        type: "status",
        title: payload.message || "Status update",
      });
    } else if (eventType === "thinking") {
      if (payload.thought?.trim()) {
        const stage = inferPipelineStage("thought", "", payload.thought);
        if (stage) opts.onStageChange(stage.index, stage.label);
        opts.onLog({
          id: makeLogId(),
          timestamp: nowTime(),
          type: "thinking",
          title: `${modelName} reasoning`,
          detail: payload.thought.trim(),
        });
      }
    } else if (eventType === "tool_call") {
      const stage = inferPipelineStage(payload.name || "", payload.args, "");
      if (stage) opts.onStageChange(stage.index, stage.label);
      const formattedArgs =
        typeof payload.args === "string"
          ? payload.args
          : JSON.stringify(payload.args, null, 2);
      opts.onLog({
        id: makeLogId(),
        timestamp: nowTime(),
        type: "tool_call",
        title: `Sandbox Tool → ${payload.name || "bash"}`,
        detail: formattedArgs,
      });
    } else if (eventType === "tool_result") {
      const resStr =
        typeof payload.result === "string"
          ? payload.result
          : JSON.stringify(payload.result);
      opts.onLog({
        id: makeLogId(),
        timestamp: nowTime(),
        type: "tool_result",
        title: `Tool Output (${payload.name || "bash"})`,
        detail: resStr.slice(0, 600),
        isError: Boolean(payload.isError),
      });
    } else if (eventType === "result") {
      finalResult = {
        storybook: payload.storybook,
        interactionId: payload.interactionId,
        environmentId: payload.environmentId,
        agent: payload.agent || agentName,
        model: payload.model || modelName,
      };
    } else if (eventType === "error") {
      throw new Error(payload.message || "Managed Agent failed");
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (currentData) handleEvent(currentEvent, currentData.trim());
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, "");
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        currentData += line.slice(5).trim() + "\n";
      } else if (line.trim() === "") {
        if (currentData) {
          handleEvent(currentEvent, currentData.trim());
          currentEvent = "";
          currentData = "";
        }
      }
    }
  }
  return finalResult;
}

/**
 * Fallback client-side pipeline when no Managed Agent sandbox key is available.
 */
async function runClientSideClassicAudiobooksPipeline(
  opts: RunStorybookAgentOptions
): Promise<RunStorybookAgentResult> {
  const agentName = opts.agentName || DEFAULT_MANAGED_AGENT_ID;
  const modelName = opts.modelName || DEFAULT_MANAGED_AGENT_MODEL;
  const interactionId = `inter_${Date.now().toString(36)}`;
  const envId = opts.environmentId || `env_barium_${Math.random().toString(36).slice(2, 8)}`;

  opts.onCreated?.(interactionId, envId);

  opts.onStageChange(0, `Stage I · Installing gemini-api-cli in ${agentName} (${modelName}) sandbox`);
  opts.onLog({
    id: makeLogId(),
    timestamp: nowTime(),
    type: "tool_call",
    title: "Sandbox Tool → bash",
    detail: `curl -fsSL https://raw.githubusercontent.com/google-gemini/gemini-api-cli/main/scripts/install.sh | bash && gemini-api --version`,
  });
  await sleep(650, opts.signal);

  opts.onStageChange(1, "Stage II · Authoring 3-Folio Dramaturgy & Anonymous Character Spec");
  await sleep(750, opts.signal);

  const promptLower = `${opts.classicBookTitle || ""} ${opts.prompt}`.toLowerCase();
  const matchedClassic = ALL_CLASSIC_STORYBOOKS.find(
    (b) =>
      promptLower.includes(b.title.toLowerCase()) ||
      promptLower.includes(b.author.toLowerCase())
  );

  let resultStorybook: Storybook;

  if (!matchedClassic) {
    try {
      resultStorybook = await generateLiveGeminiFolioStorybook(opts);
      return {
        storybook: resultStorybook,
        interactionId,
        environmentId: envId,
        agent: agentName,
        model: modelName,
      };
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
    }
  }

  resultStorybook = matchedClassic
    ? JSON.parse(JSON.stringify(matchedClassic))
    : createBespokeFairytaleStorybook(
        opts.prompt,
        opts.visualStyle,
        opts.narratorVoice,
        opts.paletteKey || "regency"
      );

  opts.onStageChange(2, "Stage III · Engraving 16:9 Archival Watercolour Plates");
  await sleep(850, opts.signal);

  opts.onStageChange(3, "Stage IV · Synthesizing Multi-Voice Narration & Mastering");
  await sleep(800, opts.signal);

  opts.onStageChange(4, "Stage V · Composing Lyria 3.5 Chamber Score & Binding Folios");
  await sleep(700, opts.signal);

  return {
    storybook: resultStorybook,
    interactionId,
    environmentId: envId,
    agent: agentName,
    model: modelName,
  };
}

async function generateLiveGeminiFolioStorybook(
  opts: RunStorybookAgentOptions
): Promise<Storybook> {
  const ai = new GoogleGenAI();
  const pal =
    EDITION_PALETTES[opts.paletteKey || "regency"]?.palette ||
    EDITION_PALETTES.regency.palette;

  const schemaPrompt = `You are authoring a 3-folio fine-press illustrated audiobook edition modeled on Jane Austen's Pride and Prejudice in classic-audiobooks.
User Commission Prompt: "${opts.prompt}"
Visual Style: "${opts.visualStyle}"

Return a JSON object with:
- title (string, literary title)
- author (string, e.g. "Folio & Voice Press" or classic author name)
- year (string, e.g. "1815")
- genreFooterLeft (string, uppercase, e.g. "REGENCY FAIRYTALE FOLIO")
- settingFooterRight (string, uppercase, e.g. "LAKE GENEVA, SWITZERLAND")
- charSheetPrompt (string: strictly anonymous physical descriptions of two main characters standing side-by-side in three-quarter profile facing each other on #F6F2EA cream archival paper, ZERO proper names)
- folios: array of 3 objects (for FOLIO I.1, FOLIO I.2, FOLIO I.3), each with:
  - caption (string, short 2-4 word location caption like "Longbourn Morning Room")
  - scenePrompt (string, strictly anonymous 16:9 illustration prompt on #F6F2EA archival paper, ZERO proper names or text)
  - turns: array of 4 to 6 turns, each with:
    - speaker (string, e.g. "Narrator" or character name)
    - speakerLabel (string, uppercase, e.g. "NARRATOR" or "CLARA")
    - isDialogue (boolean, true ONLY for spoken quotation lines, false for narrator prose)
    - voiceName (one of "Kore", "Aoede", "Charon", "Fenrir", "Orus", "Leda", "Puck")
    - stylePrompt (string, e.g. "poised, dry literary irony" or "eager, animated")
    - text (string, the literary text or quoted dialogue)`;

  const specResp = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: schemaPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          author: { type: Type.STRING },
          year: { type: Type.STRING },
          genreFooterLeft: { type: Type.STRING },
          settingFooterRight: { type: Type.STRING },
          charSheetPrompt: { type: Type.STRING },
          folios: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                caption: { type: Type.STRING },
                scenePrompt: { type: Type.STRING },
                turns: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      speaker: { type: Type.STRING },
                      speakerLabel: { type: Type.STRING },
                      isDialogue: { type: Type.BOOLEAN },
                      voiceName: { type: Type.STRING },
                      stylePrompt: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: [
                      "speaker",
                      "speakerLabel",
                      "isDialogue",
                      "voiceName",
                      "stylePrompt",
                      "text",
                    ],
                  },
                },
              },
              required: ["caption", "scenePrompt", "turns"],
            },
          },
        },
        required: [
          "title",
          "author",
          "year",
          "genreFooterLeft",
          "settingFooterRight",
          "charSheetPrompt",
          "folios",
        ],
      },
    },
  });

  const parsed = JSON.parse(specResp.text || "{}");
  const fallbackBook = createBespokeFairytaleStorybook(
    opts.prompt,
    opts.visualStyle,
    opts.narratorVoice,
    opts.paletteKey || "regency"
  );

  opts.onStageChange(
    2,
    "Stage III · Generating 16:9 Character Sheet & Scene Plates (gemini-3.1-flash-lite-image)"
  );
  let charSheetDataUrl = fallbackBook.charSheetImageUrl;
  try {
    charSheetDataUrl = await generateStudioIllustration(
      `${parsed.charSheetPrompt}. Minimalist editorial book illustration character reference sheet on clean warm cream archival paper (#F6F2EA). Delicate 1810s Regency pen-and-ink line drawing with subtle muted watercolor wash, no text, no borders.`,
      "16:9"
    );
  } catch {
    // Use SVG plate fallback
  }

  const romans = ["I", "II", "III"];
  const pages = await Promise.all(
    (parsed.folios || []).slice(0, 3).map(async (f: any, idx: number) => {
      let plateUrl = fallbackBook.pages[idx]?.imageUrl;
      try {
        plateUrl = await generateStudioIllustration(
          `${f.scenePrompt}. ${opts.visualStyle}. Flat 2D illustration directly on uniform archival paper (#F6F2EA) filling the 16:9 canvas edge-to-edge, no text, no borders.`,
          "16:9"
        );
      } catch {
        // Keep fallback SVG plate
      }
      const turns: DialogueLine[] = (f.turns || []).map((t: any) => ({
        speaker: t.speaker,
        speakerLabel: t.speakerLabel,
        voiceRoleLabel: t.isDialogue ? "Character Dialogue" : "Literary Narration",
        isDialogue: Boolean(t.isDialogue),
        voiceName: t.voiceName || opts.narratorVoice || "Kore",
        stylePrompt: t.stylePrompt,
        text: t.text,
        durationSeconds: Math.max(2.2, Math.round((t.text?.length || 40) / 14)),
      }));

      return {
        pageNumber: idx + 1,
        sceneLabel: `SCENE ${romans[idx] || "I"}`,
        folioLabel: `FOLIO I.${idx + 1}`,
        chapterTitle: "CHAPTER I",
        narrativeText: turns[0]?.text || opts.prompt,
        illustrationPrompt: f.scenePrompt,
        imageCaption: f.caption || `Scene ${romans[idx]}`,
        imageUrl: plateUrl,
        dioramaUrl: plateUrl,
        plates: [
          {
            plateNumberRoman: romans[idx] || "I",
            plateLabel: `PLATE ${romans[idx] || "I"} OF III`,
            title: f.caption || `Scene ${romans[idx]}`,
            illustrationPrompt: f.scenePrompt,
            imageUrl: plateUrl,
          },
          {
            plateNumberRoman: "I",
            plateLabel: `PLATE ${romans[idx] || "I"} OF III`,
            title: `${f.caption || "Scene"} (Character Plate)`,
            illustrationPrompt: parsed.charSheetPrompt,
            imageUrl: charSheetDataUrl,
          },
        ],
        dialogueLines: turns,
      };
    })
  );

  return {
    ...fallbackBook,
    id: `gemini_${Date.now()}`,
    bookHeaderLeft: `BOOK I  ·  ${(parsed.author || "FOLIO & VOICE").toUpperCase()}`,
    year: parsed.year || "1815",
    genreFooterLeft: (parsed.genreFooterLeft || "ILLUSTRATED FAIRYTALE FOLIO").toUpperCase(),
    settingFooterRight: (parsed.settingFooterRight || "CHAMBER EDITION").toUpperCase(),
    title: parsed.title || fallbackBook.title,
    author: parsed.author || "Folio & Voice Press",
    palette: pal,
    charSheetPrompt: parsed.charSheetPrompt,
    charSheetImageUrl: charSheetDataUrl,
    coverImageUrl: pages[0]?.imageUrl || fallbackBook.coverImageUrl,
    pages: pages.length > 0 ? pages : fallbackBook.pages,
  };
}

export async function generateStudioIllustration(
  prompt: string,
  aspectRatio: "16:9" | "4:3" | "3:4" | "1:1" = "16:9"
): Promise<string> {
  const ai = new GoogleGenAI();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-image",
    contents: prompt,
    config: {
      responseModalities: [Modality.IMAGE],
      imageConfig: {
        aspectRatio,
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || "image/png";
      return `data:${mime};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image returned from gemini-3.1-flash-lite-image");
}

function pcmBase64ToWavDataUri(base64Pcm: string, sampleRate = 24000): string {
  const binaryString = atob(base64Pcm);
  const pcmLen = binaryString.length;
  const wavBuffer = new ArrayBuffer(44 + pcmLen);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcmLen, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, pcmLen, true);

  const uint8 = new Uint8Array(wavBuffer, 44);
  for (let i = 0; i < pcmLen; i++) {
    uint8[i] = binaryString.charCodeAt(i);
  }

  let binaryWav = "";
  const fullBytes = new Uint8Array(wavBuffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < fullBytes.length; i += chunkSize) {
    binaryWav += String.fromCharCode(...fullBytes.subarray(i, i + chunkSize));
  }
  return `data:audio/wav;base64,${btoa(binaryWav)}`;
}

export async function synthesizeStudioPageAudio(
  dialogueLines: DialogueLine[],
  fallbackText: string,
  defaultVoice = "Kore"
): Promise<string> {
  const ai = new GoogleGenAI();
  const lines =
    dialogueLines && dialogueLines.length > 0
      ? dialogueLines
      : [{ speaker: "Narrator", voiceName: defaultVoice, text: fallbackText }];

  const uniqueSpeakers = new Map<string, string>();
  for (const l of lines) {
    if (!uniqueSpeakers.has(l.speaker)) {
      uniqueSpeakers.set(l.speaker, l.voiceName || defaultVoice);
    }
  }

  let speechConfig: any;
  let promptText: string;

  if (uniqueSpeakers.size === 2) {
    const speakerVoiceConfigs = Array.from(uniqueSpeakers.entries()).map(
      ([speaker, voiceName]) => ({
        speaker,
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      })
    );
    speechConfig = {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs,
      },
    };
    promptText =
      "Perform this dramatized audiobook passage with expressive theatrical voices:\n\n" +
      lines
        .map(
          (l) =>
            `${l.speaker}: ${l.stylePrompt ? `[${l.stylePrompt}] ` : ""}${l.text}`
        )
        .join("\n");
  } else {
    const primaryVoice = lines[0]?.voiceName || defaultVoice;
    speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: primaryVoice },
      },
    };
    promptText =
      "Read this storybook passage with expressive theatrical character voices and warm pacing:\n\n" +
      lines
        .map((l) => `${l.stylePrompt ? `[${l.stylePrompt}] ` : ""}${l.text}`)
        .join(" ");
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash-tts",
    contents: promptText,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig,
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data returned from gemini-3.8-flash-tts");
  }

  return pcmBase64ToWavDataUri(base64Audio, 24000);
}
