import React, { useEffect, useRef, useState } from "react";
import {
  ALL_CLASSIC_STORYBOOKS,
  EDITION_PALETTES,
  FAIRYTALE_COMMISSION_PROMPTS,
  GEMINI_TTS_VOICES,
  INITIAL_SHOWCASE_STORYBOOK,
  VISUAL_STYLE_PRESETS,
} from "./data/presets";
import {
  AGENTS_MD_CONTENT,
  DEFAULT_MANAGED_AGENT_ID,
  DEFAULT_MANAGED_AGENT_MODEL,
  GEMINI_API_CLI_INSTALL_CMD,
} from "./services/inlineAgentBundle";
import {
  generateStudioIllustration,
  runManagedAgentStorybook,
  synthesizeStudioPageAudio,
} from "./services/storybookAgentService";
import { downloadStorybookPdf } from "./services/folioExporter";
import {
  ALL_SINHALA_STORYBOOKS,
  SINHALA_STORY_CATEGORIES,
} from "./data/sinhalaStories";
import {
  ambientSoundEngine,
  resolveSceneAmbientProfile,
} from "./services/ambientSoundService";
import { getFolioCharacterCast } from "./services/characterCastService";
import {
  resolveVoiceProfile,
  shapeAudioForCharacterVoice,
} from "./services/characterVoiceEngine";
import {
  MarginaliaNote,
  READING_LIGHTING_MODES,
  ReadingLightingMode,
  resolveLightingPalette,
  segmentTextWithMarginalia,
} from "./services/marginaliaService";
import { DailyReadingGoalTracker } from "./components/DailyReadingGoalTracker";
import { AgentLogEntry, DialogueLine, Storybook, StorybookPalette } from "./types";

interface VisitedFolioCrumb {
  id: string;
  bookId: string;
  bookTitle: string;
  roman: string;
  pageIdx: number;
  folioCode: string;
  caption: string;
}

interface SavedCommonplaceQuote {
  id: string;
  bookId: string;
  bookTitle: string;
  author: string;
  roman: string;
  pageIdx: number;
  turnIdx: number;
  folioCode: string;
  speaker: string;
  text: string;
  savedAt: string;
}

type ReaderBodyFont = "classic-garamond" | "clean-modernist" | "typewriter-mono";

const READER_BODY_FONT_OPTIONS: { id: ReaderBodyFont; label: string }[] = [
  { id: "classic-garamond", label: "Classic Garamond" },
  { id: "clean-modernist", label: "Clean Modernist" },
  { id: "typewriter-mono", label: "Typewriter Mono" },
];

const PLAYBACK_SPEED_OPTIONS = [0.85, 1.0, 1.15, 1.25];

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const PIPELINE_STAGES = [
  {
    index: 0,
    code: "STAGE I · SANDBOX & GEMINI-API-CLI",
    title:
      "Provisioning the Managed Agent container and installing the latest release of gemini-api-cli in the workspace.",
  },
  {
    index: 1,
    code: "STAGE II · DRAMATURGY & FOLIO SPEC",
    title:
      "Adapting the literary chapter into three balanced folios of narration and dialogue turns with anonymous period character descriptions.",
  },
  {
    index: 2,
    code: "STAGE III · ARCHIVAL PLATES & DIORAMA",
    title:
      "Painting the 16:9 character reference sheet and three 1810s pen-and-ink watercolour plates on #F6F2EA cream paper.",
  },
  {
    index: 3,
    code: "STAGE IV · MULTI-VOICE PERFORMANCE",
    title:
      "Synthesizing and mastering distinct 24 kHz dialogue and narration turns with natural breath pauses and room tone.",
  },
  {
    index: 4,
    code: "STAGE V · CHAMBER SCORE & BINDING",
    title:
      "Composing the Lyria 3.5 acoustic chamber score and binding all three folios into the open-book spread.",
  },
];

const READER_KEYBOARD_SHORTCUTS = [
  {
    group: "NARRATION & FOLIO NAVIGATION",
    items: [
      {
        keys: ["Space"],
        label: "Pause or resume narration",
        detail: "Toggles multi-voice performance and synchronized paragraph ink",
      },
      {
        keys: ["→", "↓"],
        label: "Next dialogue turn or folio",
        detail: "Advances to the next spoken line, or turns to the next folio",
      },
      {
        keys: ["←", "↑"],
        label: "Previous dialogue turn or folio",
        detail: "Returns to the preceding line, or turns back to the prior folio",
      },
    ],
  },
  {
    group: "PLATES, SCORE & REFERENCE LEAVES",
    items: [
      {
        keys: ["P"],
        label: "Cycle illustration plate",
        detail: "Switches between 3D diorama, watercolour plate, and character sheet",
      },
      {
        keys: ["M"],
        label: "Toggle chamber score",
        detail: "Mutes or unmutes the background Lyria 3.5 chamber music",
      },
      {
        keys: ["A"],
        label: "Toggle ambient sound",
        detail: "Layers subtle scene sound effects mapped to the active folio",
      },
      {
        keys: ["?"],
        label: "Keyboard shortcuts leaf",
        detail: "Opens or dismisses this keyboard reference guide",
      },
      {
        keys: ["Esc"],
        label: "Close active leaf",
        detail: "Dismisses the Title Leaf, Colophon, or Shortcuts overlay",
      },
    ],
  },
];

// Persistent Audio elements stored outside #root so VDOM re-renders never interrupt playback
function getMasterAudioEl(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  const w = window as any;
  if (!w.__folioMasterAudioEl) {
    const el = new Audio();
    el.preload = "auto";
    w.__folioMasterAudioEl = el;
  }
  return w.__folioMasterAudioEl;
}

function getMusicAudioEl(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  const w = window as any;
  if (!w.__folioMusicAudioEl) {
    const el = new Audio();
    el.preload = "auto";
    el.loop = true;
    w.__folioMusicAudioEl = el;
  }
  return w.__folioMusicAudioEl;
}

// Ensures any storybook (including newly commissioned Managed Agent books) has exact startSec/endSec
function ensureBookTimeline(book: Storybook): Storybook {
  const firstTurn = book.pages?.[0]?.dialogueLines?.[0];
  if (typeof firstTurn?.startSec === "number" && typeof firstTurn?.endSec === "number") {
    return book;
  }

  const titleEnd = book.titleCardEndSec ?? 2.6;
  let cursor = titleEnd + 2.8; // 5.4s first speech start (after 2.6s title card + 2.8s page turn & pop-up unfold)

  const pages = (book.pages || []).map((page, pIdx) => {
    const folioStart = pIdx === 0 ? titleEnd : cursor;
    if (pIdx > 0) {
      cursor += 0.85; // Folio crossfade / page-turn beat before first turn on new folio
    }
    const lines = (page.dialogueLines || []).map((line) => {
      const dur = Math.max(
        1.4,
        Number(line.durationSeconds || Math.max(2.4, (line.text || "").length / 15))
      );
      const startSec = Number(cursor.toFixed(3));
      const endSec = Number((cursor + dur).toFixed(3));
      cursor = endSec + (line.isDialogue ? 0.36 : 0.48);
      return {
        ...line,
        durationSeconds: dur,
        startSec,
        endSec,
      };
    });
    const folioEnd = Number((cursor + 0.4).toFixed(3));
    cursor = folioEnd;
    return {
      ...page,
      sceneIdx: typeof page.sceneIdx === "number" ? page.sceneIdx : pIdx,
      startSec: Number(folioStart.toFixed(3)),
      endSec: folioEnd,
      dialogueLines: lines,
    };
  });

  const totalDurationSeconds = Number(Math.max(book.totalDurationSeconds || 0, cursor + 1.2).toFixed(2));
  return {
    ...book,
    titleCardEndSec: titleEnd,
    totalDurationSeconds,
    pages,
  };
}

function formatTimecode(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? "0" : ""}${rem}`;
}

export default function App() {
  // Primary folio view state:
  // "cover" = Open-Book Title & Commission Folio Spread (Home Page)
  // "crafting" = Open-Book Illuminator's Progress Spread while Managed Agent crafts the edition
  // "reader" = Open-Book Literary & Plate Spread (matches classic_novels_opening_chapters.mp4)
  const [viewMode, setViewMode] = useState<"cover" | "crafting" | "reader">("cover");
  const [isPageTurning, setIsPageTurning] = useState<boolean>(false);
  const [isRightFolioFading, setIsRightFolioFading] = useState<boolean>(false);
  const [isDioramaUnfolding, setIsDioramaUnfolding] = useState<boolean>(false);
  const [showOpeningTitleCard, setShowOpeningTitleCard] = useState<boolean>(false);
  const [showTitleCardModal, setShowTitleCardModal] = useState<boolean>(false);
  const [showAgentSpecModal, setShowAgentSpecModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Active Storybook & Classic + Sri Lankan Sinhala Library
  const [storybook, setStorybook] = useState<Storybook>(() =>
    ensureBookTimeline(INITIAL_SHOWCASE_STORYBOOK)
  );
  const [library, setLibrary] = useState<Storybook[]>(() =>
    [...ALL_CLASSIC_STORYBOOKS, ...ALL_SINHALA_STORYBOOKS].map(ensureBookTimeline)
  );
  const [coverCollectionTab, setCoverCollectionTab] = useState<"all" | "classic" | "sinhala">("all");
  const [selectedSinhalaCategoryId, setSelectedSinhalaCategoryId] = useState<string>("all");

  const [currentPageIdx, setCurrentPageIdx] = useState<number>(0);
  // activeLineIdx: -1 = pre-speech (all turns on folio in state-future 38% ink),
  // 0..N-1 = currently spoken turn in state-active 100% ink,
  // 999 = post-speech on folio (all turns on folio settled into state-past 50% ink)
  const [activeLineIdx, setActiveLineIdx] = useState<number>(-1);
  const [playbackTimeSec, setPlaybackTimeSec] = useState<number>(0);
  const [manualPlateIdx, setManualPlateIdx] = useState<number | null>(null);
  const [folioHistory, setFolioHistory] = useState<VisitedFolioCrumb[]>([]);
  const [selectedCastCharacterId, setSelectedCastCharacterId] = useState<string | null>(null);
  const [readerBodyFont, setReaderBodyFont] = useState<ReaderBodyFont>("classic-garamond");

  // Daily Reading Goal Tracker State (persisted per calendar day)
  const todayDateKey = new Date().toISOString().slice(0, 10);
  const [dailyGoalTarget, setDailyGoalTarget] = useState<number>(() => {
    if (typeof window === "undefined") return 3;
    const saved = Number(
      window.localStorage.getItem("folio_press_daily_goal_target") || "3"
    );
    return Number.isFinite(saved) && saved >= 1 && saved <= 12 ? saved : 3;
  });
  const [foliosReadToday, setFoliosReadToday] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(
        `folio_press_folios_read_${todayDateKey}`
      );
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  // Reader Enhancements State:
  const [playbackSpeed] = useState<number>(1.0);
  const [voiceVolume] = useState<number>(1.0);
  const [musicVolume] = useState<number>(0.18);
  const [ambientVolume] = useState<number>(0.75);

  // Interactive Marginalia & Period Glossary
  const [activeMarginalia, setActiveMarginalia] = useState<{
    turnIdx: number;
    note: MarginaliaNote;
  } | null>(null);

  // Commonplace Book (Bookmarks & Favorite Quotes)
  const [savedQuotes, setSavedQuotes] = useState<SavedCommonplaceQuote[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("folio_press_commonplace_quotes");
      return raw ? (JSON.parse(raw) as SavedCommonplaceQuote[]) : [];
    } catch {
      return [];
    }
  });
  const [showCommonplaceModal, setShowCommonplaceModal] = useState<boolean>(false);

  // Candlelight / Evening Sepia / Midnight Reading Mode
  const [lightingMode, setLightingMode] = useState<ReadingLightingMode>("daylight");

  // Full-Screen Plate Lightbox & Zoom Loupe
  const [showPlateLightbox, setShowPlateLightbox] = useState<boolean>(false);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);

  // Commission Folio State
  const [commissionPrompt, setCommissionPrompt] = useState<string>(
    FAIRYTALE_COMMISSION_PROMPTS[0].prompt
  );
  const [selectedPaletteKey, setSelectedPaletteKey] = useState<string>("regency");
  const [visualStyle, setVisualStyle] = useState<string>(VISUAL_STYLE_PRESETS[0].value);
  const [narratorVoice, setNarratorVoice] = useState<string>("Kore");
  const [agentName, setAgentName] = useState<string>(DEFAULT_MANAGED_AGENT_ID);
  const [modelName, setModelName] = useState<string>(DEFAULT_MANAGED_AGENT_MODEL);

  // Managed Agent Execution State
  const [isRunningAgent, setIsRunningAgent] = useState<boolean>(false);
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);
  const [activeStageLabel, setActiveStageLabel] = useState<string>("Ready");
  const [agentLogs, setAgentLogs] = useState<AgentLogEntry[]>([]);
  const [environmentId, setEnvironmentId] = useState<string | undefined>(undefined);
  const [interactionId, setInteractionId] = useState<string | undefined>(undefined);
  const [agentError, setAgentError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Audio Playback & Chamber Score State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(true);
  const [isAmbientSoundEnabled, setIsAmbientSoundEnabled] = useState<boolean>(false);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState<boolean>(false);
  const [isRegeneratingPlate, setIsRegeneratingPlate] = useState<boolean>(false);
  const [isDownloadingFolio, setIsDownloadingFolio] = useState<boolean>(false);
  const [isCopiedShareLink, setIsCopiedShareLink] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // Mutable refs for 60fps/80ms timeline loop so closures never read stale state
  const virtualClockRef = useRef<number>(0);
  const lastWallClockMsRef = useRef<number>(0);
  const currentPageIdxRef = useRef<number>(0);
  const activeLineIdxRef = useRef<number>(-1);
  const showOpeningTitleCardRef = useRef<boolean>(false);
  const lastSpokenTurnKeyRef = useRef<string>("");
  const ttsTurnAudioCacheRef = useRef<Map<string, string>>(new Map());
  const isTurnAudioPlayingRef = useRef<boolean>(false);

  const playbackSpeedRef = useRef<number>(1.0);
  const voiceVolumeRef = useRef<number>(1.0);
  playbackSpeedRef.current = playbackSpeed;
  voiceVolumeRef.current = voiceVolume;

  currentPageIdxRef.current = currentPageIdx;
  activeLineIdxRef.current = activeLineIdx;
  showOpeningTitleCardRef.current = showOpeningTitleCard;

  // Active Palette CSS Variables (with Daylight / Candlelight / Midnight lighting filter)
  const basePalette: StorybookPalette =
    viewMode === "cover"
      ? EDITION_PALETTES[selectedPaletteKey]?.palette || EDITION_PALETTES.regency.palette
      : storybook.palette || EDITION_PALETTES.regency.palette;

  const activePalette: StorybookPalette = resolveLightingPalette(
    basePalette,
    viewMode === "reader" ? lightingMode : "daylight"
  );

  const paletteCssVars = {
    "--folio-paper": activePalette.paper,
    "--folio-card": activePalette.card,
    "--folio-ink": activePalette.ink,
    "--folio-muted": activePalette.muted,
    "--folio-accent": activePalette.accent,
    "--folio-rule": activePalette.rule,
  } as React.CSSProperties;

  const currentPage = storybook.pages[currentPageIdx] || storybook.pages[0];
  const dialogueLines = currentPage?.dialogueLines || [];
  const resolvedActiveLineIdx =
    activeLineIdx >= 0 && activeLineIdx < dialogueLines.length
      ? activeLineIdx
      : activeLineIdx >= 999 && dialogueLines.length > 0
      ? dialogueLines.length - 1
      : 0;
  const activeLine = dialogueLines[resolvedActiveLineIdx] || dialogueLines[0];

  const totalScenesRoman =
    ROMAN_NUMERALS[Math.max(0, storybook.pages.length - 1)] || "III";
  const currentSceneIdx =
    typeof currentPage?.sceneIdx === "number" ? currentPage.sceneIdx : currentPageIdx;
  const currentSceneRoman = ROMAN_NUMERALS[currentSceneIdx] || "I";

  const plates =
    currentPage?.plates && currentPage.plates.length > 0
      ? currentPage.plates
      : [
          {
            plateNumberRoman: currentSceneRoman,
            plateLabel: `PLATE ${currentSceneRoman} OF ${totalScenesRoman}`,
            title: currentPage?.imageCaption || storybook.title,
            illustrationPrompt:
              currentPage?.illustrationPrompt || storybook.coverImagePrompt,
            imageUrl:
              currentPage?.dioramaUrl ||
              currentPage?.imageUrl ||
              storybook.coverImageUrl,
          },
        ];

  const resolvedPlateIdx =
    manualPlateIdx !== null
      ? Math.min(manualPlateIdx, plates.length - 1)
      : Math.min(activeLine?.plateIndex ?? 0, plates.length - 1);
  const currentPlate = plates[resolvedPlateIdx] || plates[0];

  const canonicalPlateLabel =
    currentPlate?.plateLabel &&
    currentPlate.plateLabel.startsWith("PLATE ") &&
    !currentPlate.plateLabel.endsWith("OF I")
      ? currentPlate.plateLabel
      : `PLATE ${currentSceneRoman} OF ${totalScenesRoman}`;

  // Calculate continuous chapter reading progress [0..1] for the 2px right-page footer filament
  const titleEndSec = storybook.titleCardEndSec ?? 2.6;
  const totalDurSec = storybook.totalDurationSeconds || 113.25;
  const chapterProgress = Math.max(
    0,
    Math.min(1, (playbackTimeSec - titleEndSec) / Math.max(1, totalDurSec - titleEndSec))
  );

  const activeAmbientProfile = resolveSceneAmbientProfile(storybook, currentPage);
  const folioCast = getFolioCharacterCast(storybook, currentPageIdx);
  const selectedCastMember =
    folioCast.find((m) => m.id === selectedCastCharacterId) || null;

  // Stop all active audio & timers cleanly
  const stopAllPlayback = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const masterEl = getMasterAudioEl();
    if (masterEl) {
      masterEl.pause();
    }
    const musicEl = getMusicAudioEl();
    if (musicEl) {
      musicEl.pause();
    }
    setIsPlayingAudio(false);
  };

  useEffect(() => {
    if (isAmbientSoundEnabled && viewMode === "reader") {
      ambientSoundEngine.start(activeAmbientProfile);
      ambientSoundEngine.setVolume(ambientVolume);
    } else {
      ambientSoundEngine.stop();
    }
  }, [isAmbientSoundEnabled, viewMode, activeAmbientProfile]);

  // Synchronize Audio Mixer sliders & playback speed with active audio elements
  useEffect(() => {
    const masterEl = getMasterAudioEl();
    if (masterEl) {
      masterEl.volume = Math.max(0, Math.min(1, voiceVolume));
      masterEl.playbackRate = playbackSpeed;
    }
    const musicEl = getMusicAudioEl();
    if (musicEl) {
      musicEl.volume = Math.max(0, Math.min(1, musicVolume));
    }
    ambientSoundEngine.setVolume(ambientVolume);
  }, [voiceVolume, musicVolume, ambientVolume, playbackSpeed]);

  // Persist Commonplace Book quotes to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "folio_press_commonplace_quotes",
        JSON.stringify(savedQuotes)
      );
    } catch {}
  }, [savedQuotes]);

  // Clear inline marginalia card when switching folios
  useEffect(() => {
    setActiveMarginalia(null);
  }, [currentPageIdx, storybook.id]);

  // Persist Daily Reading Goal target and today's read folios
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "folio_press_daily_goal_target",
        String(dailyGoalTarget)
      );
    } catch {}
  }, [dailyGoalTarget]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        `folio_press_folios_read_${todayDateKey}`,
        JSON.stringify(foliosReadToday)
      );
    } catch {}
  }, [foliosReadToday, todayDateKey]);

  // Extract spoken text for a dialogue turn; if Sinhala script is present, strip any English/Latin words so only Sinhala sentences speak
  const extractSpokenText = (line: DialogueLine): string => {
    const raw = (line.ttsText || line.text.replace(/[“”"]/g, "")).trim();
    if (!raw) return "";
    if (/[\u0D80-\u0DFF]/.test(raw)) {
      const sinhalaOnly = raw
        .replace(/\([^)]*[A-Za-z][^)]*\)/g, " ")
        .replace(/[A-Za-z]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return sinhalaOnly || raw;
    }
    return raw;
  };

  // Pre-fetch turn-by-turn TTS audio for books without a single masterAudioUrl (e.g., Sri Lankan Sinhala stories)
  // and shape each turn with its character's distinct Male or Female vocal profile
  const fetchAndCacheTurnTts = async (
    bookId: string,
    pageIdx: number,
    turnIdx: number,
    line: DialogueLine
  ): Promise<string | null> => {
    const voiceProfile = resolveVoiceProfile(
      line.voiceName,
      line.voiceGender,
      line.speaker || line.speakerLabel
    );
    const turnKey = `${bookId}_${pageIdx}_${turnIdx}_${voiceProfile.voiceName}_${voiceProfile.gender}`;
    if (line.audioDataUrl) return line.audioDataUrl;
    const cached = ttsTurnAudioCacheRef.current.get(turnKey);
    if (cached) return cached;

    const spokenText = extractSpokenText(line);
    if (!spokenText) return null;

    const hasSinhala = /[\u0D80-\u0DFF]/.test(spokenText);
    try {
      const resp = await fetch("/api/tts-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: spokenText,
          lang: hasSinhala ? "si" : "en",
          voiceName: voiceProfile.voiceName,
          voiceGender: voiceProfile.gender,
        }),
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data?.audioDataUrl) {
        const shapedAudioUrl = await shapeAudioForCharacterVoice(
          data.audioDataUrl as string,
          voiceProfile,
          data.provider
        );
        ttsTurnAudioCacheRef.current.set(turnKey, shapedAudioUrl);
        return shapedAudioUrl;
      }
    } catch {}
    return null;
  };

  // Preload active folio's turn TTS in background whenever a book without masterAudioUrl is opened
  useEffect(() => {
    if (storybook.masterAudioUrl) return;
    const page = storybook.pages[currentPageIdx] || storybook.pages[0];
    const lines = page?.dialogueLines || [];
    lines.forEach((line, tIdx) => {
      fetchAndCacheTurnTts(storybook.id, currentPageIdx, tIdx, line);
    });
  }, [storybook, currentPageIdx]);

  // Track folios read in the current session as a breadcrumb trail AND toward Daily Reading Goal
  useEffect(() => {
    if (viewMode !== "reader") return;
    const page = storybook.pages[currentPageIdx] || storybook.pages[0];
    if (!page) return;
    const roman = storybook.roman || "I";
    const folioCode = `${roman}.${currentPageIdx + 1}`;
    const crumbId = `${storybook.id}:${currentPageIdx}`;
    const caption = page.imageCaption || page.chapterTitle || storybook.title;

    setFoliosReadToday((prev) =>
      prev.includes(crumbId) ? prev : [...prev, crumbId]
    );

    setFolioHistory((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].id === crumbId) {
        return prev;
      }
      const next = [
        ...prev,
        {
          id: crumbId,
          bookId: storybook.id,
          bookTitle: storybook.title,
          roman,
          pageIdx: currentPageIdx,
          folioCode,
          caption,
        },
      ];
      return next.slice(-7);
    });
  }, [viewMode, storybook, currentPageIdx]);

  useEffect(() => {
    return () => {
      stopAllPlayback();
      ambientSoundEngine.stop();
    };
  }, []);

  // Automatically open a shared deep-link (?book=...&folio=...&turn=...) on initial load or popstate
  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyDeepLinkFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const bookParam = params.get("book");
      const folioParam = params.get("folio") || params.get("page");
      const turnParam = params.get("turn") || params.get("line");

      if (!bookParam && !folioParam && !turnParam) return;

      let matchedBook: Storybook | undefined = [
        ...ALL_CLASSIC_STORYBOOKS,
        ...ALL_SINHALA_STORYBOOKS,
      ].find(
        (b) =>
          b.id === bookParam ||
          (bookParam && b.id.toLowerCase().includes(bookParam.toLowerCase()))
      );

      if (!matchedBook && bookParam) {
        try {
          const cached = window.localStorage.getItem(
            `folio_press_shared_book_${bookParam}`
          );
          if (cached) {
            matchedBook = JSON.parse(cached) as Storybook;
          }
        } catch {}
      }

      const targetBook = ensureBookTimeline(
        matchedBook || INITIAL_SHOWCASE_STORYBOOK
      );
      const pages = targetBook.pages || [];
      const parsedFolio = parseInt(folioParam || "1", 10);
      const targetPageIdx = Number.isFinite(parsedFolio)
        ? Math.max(0, Math.min(parsedFolio - 1, Math.max(0, pages.length - 1)))
        : 0;

      const targetPage = pages[targetPageIdx] || pages[0];
      const lines = targetPage?.dialogueLines || [];
      const parsedTurn = parseInt(turnParam || "1", 10);
      const targetTurnIdx = Number.isFinite(parsedTurn)
        ? Math.max(0, Math.min(parsedTurn - 1, Math.max(0, lines.length - 1)))
        : 0;

      const targetLine = lines[targetTurnIdx];
      const targetSec =
        targetLine?.startSec ?? targetPage?.startSec ?? 5.4;

      setStorybook(targetBook);
      setLibrary((prev) =>
        prev.some((b) => b.id === targetBook.id) ? prev : [targetBook, ...prev]
      );
      setShowOpeningTitleCard(false);
      showOpeningTitleCardRef.current = false;
      currentPageIdxRef.current = targetPageIdx;
      activeLineIdxRef.current = targetTurnIdx;
      setCurrentPageIdx(targetPageIdx);
      setActiveLineIdx(targetTurnIdx);
      setManualPlateIdx(null);
      setViewMode("reader");
      startBookNarration(targetBook, targetSec, false);
      setStatusNote(
        `Opened Folio ${targetBook.roman || "I"}.${targetPageIdx + 1} · Turn ${
          targetTurnIdx + 1
        }`
      );
      setTimeout(() => setStatusNote(null), 3500);
    };

    applyDeepLinkFromUrl();
    window.addEventListener("popstate", applyDeepLinkFromUrl);
    return () => window.removeEventListener("popstate", applyDeepLinkFromUrl);
  }, []);

  // Synchronize audio source & start auto-narration at `startAtSec`
  const startBookNarration = (
    targetBook: Storybook,
    startAtSec: number = 0,
    withOpeningTitleCard: boolean = true
  ) => {
    const normalized = ensureBookTimeline(targetBook);
    const masterEl = getMasterAudioEl();
    const musicEl = getMusicAudioEl();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    virtualClockRef.current = startAtSec;
    lastWallClockMsRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    lastSpokenTurnKeyRef.current = "";
    setPlaybackTimeSec(startAtSec);

    const shouldShowIntroTitle = withOpeningTitleCard && startAtSec < 1.8;
    setShowOpeningTitleCard(shouldShowIntroTitle);
    showOpeningTitleCardRef.current = shouldShowIntroTitle;

    if (!shouldShowIntroTitle) {
      setIsDioramaUnfolding(true);
      setTimeout(() => setIsDioramaUnfolding(false), 1350);
    }

    // Play the mastered multi-voice + Lyria 3.5 MP4/WAV track if available
    if (normalized.masterAudioUrl && masterEl) {
      if (musicEl) musicEl.pause();
      const currentSrc = masterEl.getAttribute("data-book-src") || "";
      if (currentSrc !== normalized.masterAudioUrl) {
        masterEl.src = normalized.masterAudioUrl;
        masterEl.setAttribute("data-book-src", normalized.masterAudioUrl);
      }
      try {
        masterEl.currentTime = startAtSec;
      } catch {
        // Seek applied on loadedmetadata if not yet buffered
        masterEl.onloadedmetadata = () => {
          try {
            masterEl.currentTime = startAtSec;
          } catch {}
        };
      }
      masterEl.volume = Math.max(0, Math.min(1, voiceVolumeRef.current));
      masterEl.playbackRate = playbackSpeedRef.current;
      masterEl.play().catch(() => {
        // If browser autoplay blocks unmuted playback before gesture, virtualClockRef still drives visual highlighting
      });
    } else if (musicEl && isMusicEnabled && normalized.backgroundMusicUrl) {
      if (masterEl) masterEl.pause();
      musicEl.src = normalized.backgroundMusicUrl;
      musicEl.volume = Math.max(0, Math.min(1, musicVolume));
      musicEl.play().catch(() => {});
    }

    setIsPlayingAudio(true);
  };

  // Master 80ms timeline loop: drives Opening Title Card -> 3D Page Turn & Pop-Up Unfold ->
  // 3-State Paragraph Highlighting -> Same-Scene Right-Page Folio Crossfades
  useEffect(() => {
    if (!isPlayingAudio || viewMode !== "reader") return;

    lastWallClockMsRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();

    const intervalId = setInterval(() => {
      const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
      const dtSec = Math.min(0.25, Math.max(0, (nowMs - lastWallClockMsRef.current) / 1000));
      lastWallClockMsRef.current = nowMs;

      const masterEl = getMasterAudioEl();
      let tSec = virtualClockRef.current;

      if (
        storybook.masterAudioUrl &&
        masterEl &&
        !masterEl.paused &&
        !masterEl.ended &&
        Number.isFinite(masterEl.currentTime)
      ) {
        tSec = masterEl.currentTime;
        virtualClockRef.current = tSec;
      } else {
        // When a per-turn TTS audio clip (such as Sinhala TTS) is actively playing in masterEl,
        // pace the virtual clock so it never cuts off the spoken sentence early
        const curPages = storybook.pages || [];
        const curLines = curPages[currentPageIdxRef.current]?.dialogueLines || [];
        const curLine =
          activeLineIdxRef.current >= 0 &&
          activeLineIdxRef.current < curLines.length
            ? curLines[activeLineIdxRef.current]
            : null;
        const turnEndSec = curLine?.endSec ?? 99999;

        if (
          !storybook.masterAudioUrl &&
          isTurnAudioPlayingRef.current &&
          masterEl &&
          !masterEl.paused &&
          !masterEl.ended
        ) {
          const nextClock = virtualClockRef.current + dtSec * playbackSpeedRef.current;
          // Hold slightly before turnEndSec while the voice is still speaking
          tSec = Math.min(nextClock, Math.max(virtualClockRef.current, turnEndSec - 0.15));
          virtualClockRef.current = tSec;
        } else {
          tSec = virtualClockRef.current + dtSec * playbackSpeedRef.current;
          virtualClockRef.current = tSec;
        }
      }

      setPlaybackTimeSec(tSec);

      const totalDur = storybook.totalDurationSeconds || 113.25;
      const titleTurnStartSec = Math.max(1.45, (storybook.titleCardEndSec ?? 2.6) - 0.4);

      // 1. Opening Title Card (0.0s .. 2.2s) -> Spine-Hinged Page Turn & Pop-Up Diorama Unfold
      if (tSec < titleTurnStartSec) {
        if (!showOpeningTitleCardRef.current) {
          showOpeningTitleCardRef.current = true;
          setShowOpeningTitleCard(true);
        }
        return;
      } else if (showOpeningTitleCardRef.current) {
        showOpeningTitleCardRef.current = false;
        setShowOpeningTitleCard(false);
        setIsPageTurning(true);
        setIsDioramaUnfolding(true);
        setTimeout(() => setIsPageTurning(false), 650);
        setTimeout(() => setIsDioramaUnfolding(false), 1350);
      }

      // 2. Determine active folio index `targetPageIdx` from `pages[pIdx].startSec`
      const pages = storybook.pages || [];
      let targetPageIdx = 0;
      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const pStart = pages[pIdx].startSec ?? 0;
        if (tSec >= pStart) {
          targetPageIdx = pIdx;
        } else {
          break;
        }
      }

      if (targetPageIdx !== currentPageIdxRef.current) {
        const prevPage = pages[currentPageIdxRef.current];
        const nextPage = pages[targetPageIdx];
        const prevSceneIdx = prevPage?.sceneIdx ?? currentPageIdxRef.current;
        const nextSceneIdx = nextPage?.sceneIdx ?? targetPageIdx;

        currentPageIdxRef.current = targetPageIdx;
        setCurrentPageIdx(targetPageIdx);
        setManualPlateIdx(null);

        if (prevSceneIdx === nextSceneIdx) {
          setIsRightFolioFading(true);
          setTimeout(() => setIsRightFolioFading(false), 450);
        } else {
          setIsPageTurning(true);
          setIsDioramaUnfolding(true);
          setTimeout(() => setIsPageTurning(false), 650);
          setTimeout(() => setIsDioramaUnfolding(false), 1350);
        }
      }

      // 3. Determine active turn index `targetLineIdx` within `pages[targetPageIdx]`
      const fLines = pages[targetPageIdx]?.dialogueLines || [];
      let targetLineIdx = -1;

      if (fLines.length > 0) {
        const firstStart = fLines[0].startSec ?? 5.4;
        if (tSec >= firstStart) {
          let kActive = 0;
          for (let k = 0; k < fLines.length; k++) {
            if (tSec >= (fLines[k].startSec ?? 0)) {
              kActive = k;
            } else {
              break;
            }
          }
          const curTurn = fLines[kActive];
          if (kActive === fLines.length - 1 && tSec >= (curTurn.endSec ?? 99999)) {
            targetLineIdx = 999;
          } else {
            targetLineIdx = kActive;
          }
        }
      }

      if (targetLineIdx !== activeLineIdxRef.current) {
        activeLineIdxRef.current = targetLineIdx;
        setActiveLineIdx(targetLineIdx);

        // Speak the active turn for Sinhala storybooks and custom commissioned books
        if (
          !storybook.masterAudioUrl &&
          targetLineIdx >= 0 &&
          targetLineIdx < fLines.length
        ) {
          const turnKey = `${storybook.id}_${targetPageIdx}_${targetLineIdx}`;
          if (lastSpokenTurnKeyRef.current !== turnKey) {
            lastSpokenTurnKeyRef.current = turnKey;
            const line = fLines[targetLineIdx];

            // Pre-fetch next turn in background
            if (targetLineIdx + 1 < fLines.length) {
              fetchAndCacheTurnTts(
                storybook.id,
                targetPageIdx,
                targetLineIdx + 1,
                fLines[targetLineIdx + 1]
              );
            }

            isTurnAudioPlayingRef.current = true;
            fetchAndCacheTurnTts(
              storybook.id,
              targetPageIdx,
              targetLineIdx,
              line
            ).then((audioUrl) => {
              if (lastSpokenTurnKeyRef.current !== turnKey) return;
              if (audioUrl && masterEl) {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                masterEl.src = audioUrl;
                masterEl.setAttribute("data-book-src", turnKey);
                masterEl.volume = Math.max(0, Math.min(1, voiceVolumeRef.current));
                masterEl.playbackRate = playbackSpeedRef.current;
                masterEl.onended = () => {
                  if (lastSpokenTurnKeyRef.current === turnKey) {
                    isTurnAudioPlayingRef.current = false;
                  }
                };
                masterEl.onerror = () => {
                  isTurnAudioPlayingRef.current = false;
                };
                masterEl.play().catch(() => {
                  isTurnAudioPlayingRef.current = false;
                });
              } else {
                isTurnAudioPlayingRef.current = false;
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  try {
                    window.speechSynthesis.cancel();
                    const spokenText = extractSpokenText(line);
                    const fallbackProfile = resolveVoiceProfile(
                      line.voiceName,
                      line.voiceGender,
                      line.speaker || line.speakerLabel
                    );
                    const utter = new SpeechSynthesisUtterance(spokenText);
                    utter.lang = /[\u0D80-\u0DFF]/.test(spokenText)
                      ? "si-LK"
                      : "en-GB";
                    utter.pitch = fallbackProfile.gender === "male" ? 0.72 : 1.12;
                    utter.rate = Math.max(
                      0.6,
                      Math.min(1.6, 0.96 * playbackSpeedRef.current)
                    );
                    utter.volume = Math.max(0, Math.min(1, voiceVolumeRef.current));
                    window.speechSynthesis.speak(utter);
                  } catch {}
                }
              }
            });
          }
        }
      }

      // 4. Stop cleanly at end of chapter
      if (tSec >= totalDur) {
        stopAllPlayback();
      }
    }, 80);

    return () => clearInterval(intervalId);
  }, [isPlayingAudio, viewMode, storybook]);

  // Seek directly to a specific folio & turn (and continue auto-narrating from there)
  const seekToFolioAndTurn = (pageIdx: number, lineIdx: number) => {
    const pages = storybook.pages || [];
    const targetPage = pages[pageIdx] || pages[0];
    const lines = targetPage?.dialogueLines || [];
    const safeLineIdx = Math.max(0, Math.min(lineIdx, Math.max(0, lines.length - 1)));
    const targetLine = lines[safeLineIdx];
    const targetSec = targetLine?.startSec ?? targetPage?.startSec ?? 5.4;

    const prevSceneIdx = pages[currentPageIdx]?.sceneIdx ?? currentPageIdx;
    const nextSceneIdx = targetPage?.sceneIdx ?? pageIdx;

    setShowOpeningTitleCard(false);
    showOpeningTitleCardRef.current = false;
    setManualPlateIdx(null);

    if (pageIdx !== currentPageIdx) {
      if (prevSceneIdx === nextSceneIdx) {
        setIsRightFolioFading(true);
        setTimeout(() => setIsRightFolioFading(false), 450);
      } else {
        setIsPageTurning(true);
        setIsDioramaUnfolding(true);
        setTimeout(() => setIsPageTurning(false), 650);
        setTimeout(() => setIsDioramaUnfolding(false), 1350);
      }
    }

    currentPageIdxRef.current = pageIdx;
    activeLineIdxRef.current = safeLineIdx;
    setCurrentPageIdx(pageIdx);
    setActiveLineIdx(safeLineIdx);

    virtualClockRef.current = targetSec;
    lastWallClockMsRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    setPlaybackTimeSec(targetSec);

    const masterEl = getMasterAudioEl();
    if (storybook.masterAudioUrl && masterEl) {
      const currentSrc = masterEl.getAttribute("data-book-src") || "";
      if (currentSrc !== storybook.masterAudioUrl) {
        masterEl.src = storybook.masterAudioUrl;
        masterEl.setAttribute("data-book-src", storybook.masterAudioUrl);
      }
      try {
        masterEl.currentTime = targetSec;
      } catch {}
      masterEl.play().catch(() => {});
    }
    setIsPlayingAudio(true);
  };

  // Turn the leaf from the Title & Contents Folio directly into a bound volume AND auto-narrate!
  const handleOpenExistingBook = (book: Storybook, startFromTitleCard: boolean = true) => {
    stopAllPlayback();
    const normalized = ensureBookTimeline(book);
    setStorybook(normalized);
    setCurrentPageIdx(0);
    setActiveLineIdx(-1);
    setManualPlateIdx(null);
    setIsPageTurning(true);
    setViewMode("reader");
    setTimeout(() => {
      setIsPageTurning(false);
    }, 650);

    // Automatically begin narrating the volume from t = 0.0s (Title Card -> Page Turn -> Highlighted Narration)
    startBookNarration(normalized, startFromTitleCard ? 0 : 5.4, startFromTitleCard);
  };

  // Jump directly to a previously visited folio from the margin bar breadcrumb history
  const handleJumpToBreadcrumb = (crumb: VisitedFolioCrumb, truncateToIdx?: number) => {
    if (typeof truncateToIdx === "number") {
      setFolioHistory((prev) => prev.slice(0, truncateToIdx + 1));
    }

    if (crumb.bookId === storybook.id && viewMode === "reader") {
      seekToFolioAndTurn(crumb.pageIdx, 0);
      setStatusNote(`Returned to Folio ${crumb.folioCode} — ${crumb.caption}`);
      setTimeout(() => setStatusNote(null), 2800);
      return;
    }

    const matchedBook =
      library.find((b) => b.id === crumb.bookId) || storybook;
    const normalized = ensureBookTimeline(matchedBook);
    const targetPage = normalized.pages[crumb.pageIdx] || normalized.pages[0];
    const startSec = targetPage?.dialogueLines?.[0]?.startSec ?? targetPage?.startSec ?? 5.4;

    stopAllPlayback();
    setStorybook(normalized);
    currentPageIdxRef.current = crumb.pageIdx;
    activeLineIdxRef.current = 0;
    setCurrentPageIdx(crumb.pageIdx);
    setActiveLineIdx(0);
    setManualPlateIdx(null);
    setIsPageTurning(true);
    setViewMode("reader");
    setTimeout(() => {
      setIsPageTurning(false);
    }, 650);

    startBookNarration(normalized, startSec, false);
    setStatusNote(`Returned to ${normalized.title} · Folio ${crumb.folioCode}`);
    setTimeout(() => setStatusNote(null), 2800);
  };

  // Turn back to the Title & Commission Folio
  const handleCloseBookToCover = () => {
    stopAllPlayback();
    setShowOpeningTitleCard(false);
    setShowTitleCardModal(false);
    setShowAgentSpecModal(false);
    setShowShortcutsModal(false);
    setIsPageTurning(true);
    setViewMode("cover");
    setTimeout(() => {
      setIsPageTurning(false);
    }, 650);
  };

  // Toggle Pause / Resume Narration
  const handleToggleNarration = () => {
    const masterEl = getMasterAudioEl();
    if (isPlayingAudio) {
      stopAllPlayback();
    } else {
      const resumeSec =
        playbackTimeSec >= (storybook.totalDurationSeconds || 113) - 1
          ? 0
          : playbackTimeSec;
      if (storybook.masterAudioUrl && masterEl) {
        const currentSrc = masterEl.getAttribute("data-book-src") || "";
        if (currentSrc !== storybook.masterAudioUrl) {
          masterEl.src = storybook.masterAudioUrl;
          masterEl.setAttribute("data-book-src", storybook.masterAudioUrl);
        }
        try {
          masterEl.currentTime = resumeSec;
        } catch {}
        masterEl.play().catch(() => {});
      }
      virtualClockRef.current = resumeSec;
      lastWallClockMsRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
      setIsPlayingAudio(true);
    }
  };

  // Cycle through the current folio's plates (3D pop-up diorama -> 2D watercolour plate -> character sheet)
  const handleCyclePlate = () => {
    if (plates.length <= 1) return;
    const nextIdx = (resolvedPlateIdx + 1) % plates.length;
    setManualPlateIdx(nextIdx);
    setStatusNote(`Viewing Plate ${nextIdx + 1} of ${plates.length}`);
    setTimeout(() => setStatusNote(null), 2500);
  };

  // Toggle background Lyria 3.5 chamber music
  const handleToggleChamberMusic = () => {
    const nextEnabled = !isMusicEnabled;
    setIsMusicEnabled(nextEnabled);
    const musicEl = getMusicAudioEl();
    if (musicEl) {
      if (!nextEnabled) {
        musicEl.pause();
      } else if (isPlayingAudio && !storybook.masterAudioUrl && storybook.backgroundMusicUrl) {
        musicEl.src = storybook.backgroundMusicUrl;
        musicEl.volume = 0.16;
        musicEl.play().catch(() => {});
      }
    }
    setStatusNote(nextEnabled ? "Chamber score enabled" : "Chamber score muted");
    setTimeout(() => setStatusNote(null), 2500);
  };

  // Toggle subtle scene-mapped ambient sound effects (crackling fire, bird chirps, rain, etc.)
  const handleToggleAmbientSound = () => {
    const nextEnabled = !isAmbientSoundEnabled;
    setIsAmbientSoundEnabled(nextEnabled);
    if (nextEnabled) {
      ambientSoundEngine.start(activeAmbientProfile);
      setStatusNote(`Ambient Sound: ${activeAmbientProfile.label}`);
    } else {
      ambientSoundEngine.stop();
      setStatusNote("Ambient Sound muted");
    }
    setTimeout(() => setStatusNote(null), 3200);
  };

  // Commission a new Storybook via the Gemini Managed Agent (`antigravity-preview-09-2026` / `gemini-4-argon`)
  const handleCommissionStorybook = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    stopAllPlayback();
    setAgentError(null);
    setAgentLogs([]);
    setActiveStageIdx(0);
    setActiveStageLabel("Booting Managed Agent Sandbox");

    setIsPageTurning(true);
    setViewMode("crafting");
    setIsRunningAgent(true);
    setTimeout(() => {
      setIsPageTurning(false);
    }, 650);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await runManagedAgentStorybook({
        prompt: commissionPrompt,
        paletteKey: selectedPaletteKey,
        visualStyle,
        pageCount: 3,
        narratorVoice,
        agentName,
        modelName,
        environmentId,
        previousInteractionId: interactionId,
        sessionId: `session_${Date.now()}`,
        signal: controller.signal,
        onLog: (entry) => {
          setAgentLogs((prev) => [...prev, entry]);
        },
        onStageChange: (stageIdx, stageLabel) => {
          setActiveStageIdx(stageIdx);
          setActiveStageLabel(stageLabel);
        },
        onCreated: (id, envId) => {
          setInteractionId(id);
          if (envId) setEnvironmentId(envId);
        },
      });

      const normalized = ensureBookTimeline(result.storybook);
      setStorybook(normalized);
      setLibrary((prev) => {
        const exists = prev.some((b) => b.id === normalized.id);
        return exists ? prev : [normalized, ...prev];
      });
      setCurrentPageIdx(0);
      setActiveLineIdx(-1);
      setManualPlateIdx(null);
      setIsRunningAgent(false);
      setIsPageTurning(true);
      setViewMode("reader");
      setTimeout(() => {
        setIsPageTurning(false);
      }, 650);

      // Automatically begin narrating the newly commissioned edition!
      startBookNarration(normalized, 0, true);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setIsRunningAgent(false);
        setViewMode("cover");
        return;
      }
      setAgentError(err?.message || "Failed to run Managed Agent");
      setIsRunningAgent(false);
    }
  };

  // Synthesize real Gemini Flash TTS WAV for the current Folio
  const handleSynthesizeFolioWav = async () => {
    setIsSynthesizingAudio(true);
    setStatusNote("Synthesizing 24 kHz WAV via Gemini Flash TTS…");
    try {
      const wavDataUri = await synthesizeStudioPageAudio(
        dialogueLines,
        currentPage.narrativeText,
        narratorVoice
      );
      const masterEl = getMasterAudioEl();
      if (masterEl) {
        masterEl.src = wavDataUri;
        masterEl.setAttribute("data-book-src", wavDataUri);
        masterEl.play().catch(() => {});
      }
      setIsPlayingAudio(true);
      setStatusNote("Playing mastered 24 kHz Gemini TTS folio audio");
      setTimeout(() => setStatusNote(null), 4000);
    } catch {
      setStatusNote("Playing mastered multi-voice & Lyria 3.5 edition audio");
      handleToggleNarration();
      setTimeout(() => setStatusNote(null), 4000);
    } finally {
      setIsSynthesizingAudio(false);
    }
  };

  // Repaint current plate using `gemini-3.1-flash-lite-image`
  const handleRepaintCurrentPlate = async () => {
    setIsRegeneratingPlate(true);
    setStatusNote("Engraving 16:9 plate on #F6F2EA cream paper…");
    try {
      const newDataUrl = await generateStudioIllustration(
        `${currentPlate.illustrationPrompt}. ${storybook.visualStyle}. Flat 2D illustration on warm cream archival paper (#F6F2EA), 16:9, no text, no borders.`,
        "16:9"
      );
      const updatedPages = storybook.pages.map((p, idx) => {
        if (idx !== currentPageIdx) return p;
        const updatedPlates = (p.plates || []).map((pl, pIdx) =>
          pIdx === resolvedPlateIdx ? { ...pl, imageUrl: newDataUrl } : pl
        );
        return {
          ...p,
          imageUrl: newDataUrl,
          plates: updatedPlates,
        };
      });
      setStorybook({ ...storybook, pages: updatedPages });
      setStatusNote("Plate engraved on #F6F2EA archival paper");
      setTimeout(() => setStatusNote(null), 3500);
    } catch {
      setStatusNote("Check your API key in Settings > Secrets to engrave plates live");
      setTimeout(() => setStatusNote(null), 3500);
    } finally {
      setIsRegeneratingPlate(false);
    }
  };

  // Capture and download the current Storybook state, plates, and text as a structured archival PDF folio
  const handleDownloadFolio = async () => {
    if (isDownloadingFolio) return;
    setIsDownloadingFolio(true);
    setStatusNote("Binding archival PDF folio…");
    try {
      const filename = await downloadStorybookPdf(storybook, currentPageIdx);
      setStatusNote(`Downloaded ${filename}`);
      setTimeout(() => setStatusNote(null), 3500);
    } catch {
      setStatusNote("Could not export PDF folio");
      setTimeout(() => setStatusNote(null), 3500);
    } finally {
      setIsDownloadingFolio(false);
    }
  };

  // Trigger the specialized CSS @media print stylesheet to print the currently viewed folio
  const handlePrintFolio = () => {
    if (typeof window === "undefined") return;
    if (isPlayingAudio) {
      stopAllPlayback();
    }
    if (showOpeningTitleCard) {
      setShowOpeningTitleCard(false);
      showOpeningTitleCardRef.current = false;
    }
    setSelectedCastCharacterId(null);
    setShowShortcutsModal(false);
    setShowTitleCardModal(false);
    setShowAgentSpecModal(false);
    setStatusNote(
      `Printing Folio ${storybook.roman || "I"}.${currentPageIdx + 1}…`
    );
    setTimeout(() => {
      try {
        window.print();
      } catch {}
      setStatusNote(null);
    }, 120);
  };

  // Copy a deep-link to the current storybook, folio page, and dialogue turn to the user's clipboard
  const handleShareFolio = async () => {
    if (typeof window === "undefined") return;
    const folioNum = currentPageIdx + 1;
    const turnNum = resolvedActiveLineIdx + 1;

    try {
      const isBuiltIn = ALL_CLASSIC_STORYBOOKS.some((b) => b.id === storybook.id);
      if (!isBuiltIn) {
        window.localStorage.setItem(
          `folio_press_shared_book_${storybook.id}`,
          JSON.stringify(storybook)
        );
      }
    } catch {}

    const url = new URL(window.location.href);
    url.searchParams.set("book", storybook.id);
    url.searchParams.set("folio", String(folioNum));
    url.searchParams.set("turn", String(turnNum));
    const shareUrl = url.toString();

    try {
      window.history.replaceState(null, "", shareUrl);
    } catch {}

    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } catch {}
    }

    if (!copied) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        copied = true;
      } catch {}
    }

    setIsCopiedShareLink(true);
    setStatusNote(
      `Copied link to Folio ${storybook.roman || "I"}.${folioNum}, Turn ${turnNum}`
    );
    setTimeout(() => {
      setIsCopiedShareLink(false);
      setStatusNote(null);
    }, 3200);
  };

  // Interactive Chapter Scrubber Bar: click anywhere on the right-page footer progress rule to seek
  const handleScrubberSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSec = titleEndSec + ratio * Math.max(1, totalDurSec - titleEndSec);

    const pages = storybook.pages || [];
    let targetPageIdx = 0;
    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      if (targetSec >= (pages[pIdx].startSec ?? 0)) {
        targetPageIdx = pIdx;
      } else {
        break;
      }
    }

    const lines = pages[targetPageIdx]?.dialogueLines || [];
    let targetTurnIdx = 0;
    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      if (targetSec >= (lines[lIdx].startSec ?? 0)) {
        targetTurnIdx = lIdx;
      } else {
        break;
      }
    }

    seekToFolioAndTurn(targetPageIdx, targetTurnIdx);
    setStatusNote(
      `Scrubbed to ${formatTimecode(targetSec)} · Folio ${
        storybook.roman || "I"
      }.${targetPageIdx + 1}`
    );
    setTimeout(() => setStatusNote(null), 2400);
  };

  // Toggle saving or removing a paragraph quote in the Commonplace Book
  const handleToggleSaveQuote = (
    e: React.MouseEvent,
    pageIdx: number,
    turnIdx: number
  ) => {
    e.stopPropagation();
    const page = storybook.pages[pageIdx] || storybook.pages[0];
    const line = page?.dialogueLines?.[turnIdx];
    if (!line) return;

    const quoteId = `${storybook.id}:${pageIdx}:${turnIdx}`;
    const folioCode = `${storybook.roman || "I"}.${pageIdx + 1}`;
    const exists = savedQuotes.some((q) => q.id === quoteId);

    if (exists) {
      setSavedQuotes((prev) => prev.filter((q) => q.id !== quoteId));
      setStatusNote(`Removed Folio ${folioCode} quote from Commonplace Book`);
    } else {
      const entry: SavedCommonplaceQuote = {
        id: quoteId,
        bookId: storybook.id,
        bookTitle: storybook.title,
        author: storybook.author,
        roman: storybook.roman || "I",
        pageIdx,
        turnIdx,
        folioCode,
        speaker: line.speakerLabel || line.speaker || "Narrator",
        text: line.text,
        savedAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setSavedQuotes((prev) => [entry, ...prev]);
      setStatusNote(`Inscribed Folio ${folioCode} quote in Commonplace Book`);
    }
    setTimeout(() => setStatusNote(null), 2600);
  };

  // Jump directly to a saved quote from the Commonplace Book
  const handleJumpToSavedQuote = (quote: SavedCommonplaceQuote) => {
    setShowCommonplaceModal(false);
    if (quote.bookId === storybook.id && viewMode === "reader") {
      seekToFolioAndTurn(quote.pageIdx, quote.turnIdx);
      setStatusNote(`Opened saved passage · Folio ${quote.folioCode}`);
      setTimeout(() => setStatusNote(null), 2600);
      return;
    }

    const matchedBook =
      library.find((b) => b.id === quote.bookId) || storybook;
    const normalized = ensureBookTimeline(matchedBook);
    const targetPage = normalized.pages[quote.pageIdx] || normalized.pages[0];
    const targetLine = targetPage?.dialogueLines?.[quote.turnIdx];
    const startSec =
      targetLine?.startSec ?? targetPage?.startSec ?? 5.4;

    stopAllPlayback();
    setStorybook(normalized);
    currentPageIdxRef.current = quote.pageIdx;
    activeLineIdxRef.current = quote.turnIdx;
    setCurrentPageIdx(quote.pageIdx);
    setActiveLineIdx(quote.turnIdx);
    setManualPlateIdx(null);
    setIsPageTurning(true);
    setViewMode("reader");
    setTimeout(() => setIsPageTurning(false), 650);
    startBookNarration(normalized, startSec, false);
    setStatusNote(`Opened ${normalized.title} · Folio ${quote.folioCode}`);
    setTimeout(() => setStatusNote(null), 2800);
  };

  // Cycle Reading Lighting Mode (Daylight Cream -> Candlelight Amber -> Midnight Vellum)
  const handleCycleLightingMode = () => {
    const order: ReadingLightingMode[] = ["daylight", "candlelight", "midnight"];
    const nextIdx = (order.indexOf(lightingMode) + 1) % order.length;
    const nextMode = order[nextIdx];
    setLightingMode(nextMode);
    const modeInfo = READING_LIGHTING_MODES.find((m) => m.id === nextMode);
    setStatusNote(`Lighting: ${modeInfo?.label || nextMode}`);
    setTimeout(() => setStatusNote(null), 2400);
  };

  // Keyboard navigation in Reader mode (←/→/↑/↓ for turns & folios, Space for play/pause, P for plates, M for music, ? for shortcuts, Esc to close)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (
          showShortcutsModal ||
          showTitleCardModal ||
          showAgentSpecModal ||
          showCommonplaceModal ||
          showPlateLightbox ||
          activeMarginalia ||
          selectedCastCharacterId
        ) {
          e.preventDefault();
          setShowShortcutsModal(false);
          setShowTitleCardModal(false);
          setShowAgentSpecModal(false);
          setShowCommonplaceModal(false);
          setShowPlateLightbox(false);
          setActiveMarginalia(null);
          setSelectedCastCharacterId(null);
        }
        return;
      }

      if (viewMode !== "reader") return;

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      if (showTitleCardModal || showAgentSpecModal || showShortcutsModal) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        if (showOpeningTitleCard) {
          seekToFolioAndTurn(0, 0);
        } else if (activeLineIdx < dialogueLines.length - 1) {
          seekToFolioAndTurn(currentPageIdx, Math.max(0, activeLineIdx + 1));
        } else if (currentPageIdx < storybook.pages.length - 1) {
          seekToFolioAndTurn(currentPageIdx + 1, 0);
        }
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (activeLineIdx > 0 && activeLineIdx < 999) {
          seekToFolioAndTurn(currentPageIdx, activeLineIdx - 1);
        } else if (currentPageIdx > 0) {
          const prevLines = storybook.pages[currentPageIdx - 1]?.dialogueLines || [];
          seekToFolioAndTurn(currentPageIdx - 1, Math.max(0, prevLines.length - 1));
        }
      } else if (e.key === " ") {
        e.preventDefault();
        handleToggleNarration();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handleCyclePlate();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleToggleChamberMusic();
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleToggleAmbientSound();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    viewMode,
    activeLineIdx,
    currentPageIdx,
    dialogueLines.length,
    storybook,
    isPlayingAudio,
    isMusicEnabled,
    isAmbientSoundEnabled,
    activeAmbientProfile,
    plates.length,
    resolvedPlateIdx,
    showOpeningTitleCard,
    showTitleCardModal,
    showAgentSpecModal,
    showShortcutsModal,
    selectedCastCharacterId,
  ]);

  const formattedBookHeaderLeft = (
    storybook.bookHeaderLeft ||
    `BOOK ${storybook.roman || "I"}  ·  ${storybook.author.toUpperCase()}`
  ).replace(/\s*·\s*/g, "  ·  ");

  const latestLogs = agentLogs.slice(-6);

  return (
    <div style={paletteCssVars} className="archival-paper-surface">
      {/* ====================================================================
          STATE 1: OPEN-BOOK TITLE & COMMISSION FOLIO SPREAD (HOME PAGE)
          Uses the exact #F6F2EA cream paper, #D5CBB8 1px rules, and 52.917%
          spine geometry as the finished agent output (zero pills or boxes)
          ==================================================================== */}
      {viewMode === "cover" && (
        <div className="austen-spread-viewport">
          <div
            className={`austen-open-book ${
              isPageTurning ? "folio-page-turning" : ""
            }`}
          >
            {/* ==============================================================
                VERSO (LEFT PAGE): FINE-PRESS TITLE PAGE & TABLE OF CONTENTS
                (Typography ladder from render_title_card in render_audiobook_video.py)
                ============================================================== */}
            <div className="austen-left-page">
              <div className="austen-running-bar">
                <span>THE FOLIO &amp; VOICE PRESS</span>
                <span>MMXXVI</span>
              </div>

              <div className="folio-title-verso">
                <div className="folio-title-block">
                  <div
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "15px",
                      letterSpacing: "0.153em",
                      color: "var(--folio-accent)",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                    }}
                  >
                    AN ILLUSTRATED AUDIOBOOK LIBRARY
                  </div>

                  <h1
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "clamp(42px, 3.6vw, 62px)",
                      fontWeight: 500,
                      color: "var(--folio-ink)",
                      margin: "0 0 12px 0",
                      lineHeight: 1.06,
                    }}
                  >
                    Audio Storybooks
                  </h1>

                  <div
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "15px",
                      letterSpacing: "0.12em",
                      color: "var(--folio-muted)",
                      textTransform: "uppercase",
                      whiteSpace: "pre",
                    }}
                  >
                    ILLUSTRATED  ·  VOICED  ·  SCORED   ·   GEMINI
                  </div>

                  {/* Fine-Press Diamond Rule (y=282 in render_title_card) */}
                  <div className="folio-diamond-rule">
                    <div className="folio-diamond-rule-line" />
                    <div className="folio-diamond-rule-gem" />
                    <div className="folio-diamond-rule-line" />
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-garamond)",
                      fontStyle: "italic",
                      fontSize: "clamp(19px, 1.45vw, 25px)",
                      color: "var(--folio-ink)",
                    }}
                  >
                    Nine volumes bound — World Classics &amp; Sri Lankan Sinhala Literature (සිංහල කතා)
                  </div>
                </div>

                {/* Categorized Table of Contents: World Classics & Sri Lankan Sinhala Stories */}
                <div className="folio-contents-section">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      className="austen-turn-rubric"
                      style={{
                        color: "var(--folio-accent)",
                        marginBottom: 0,
                      }}
                    >
                      CONTENTS — CLICK ANY VOLUME TO OPEN &amp; AUTO-NARRATE
                    </div>

                    <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setCoverCollectionTab("all")}
                        className={`austen-margin-link ${
                          coverCollectionTab === "all" ? "is-active" : ""
                        }`}
                      >
                        All ({library.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverCollectionTab("classic")}
                        className={`austen-margin-link ${
                          coverCollectionTab === "classic" ? "is-active" : ""
                        }`}
                      >
                        World Classics (I–V)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverCollectionTab("sinhala")}
                        className={`austen-margin-link ${
                          coverCollectionTab === "sinhala" ? "is-active" : ""
                        }`}
                      >
                        සිංහල කතා · Sinhala (VI–IX)
                      </button>
                    </div>
                  </div>

                  {/* Sinhala Category Filter Sub-Bar when viewing Sinhala or All */}
                  {(coverCollectionTab === "sinhala" || coverCollectionTab === "all") && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                        marginBottom: "8px",
                        paddingBottom: "6px",
                        borderBottom: "1px dashed var(--folio-rule)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "10.5px",
                          letterSpacing: "0.09em",
                          color: "var(--folio-muted)",
                        }}
                      >
                        SINHALA CATEGORIES:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSinhalaCategoryId("all")}
                        className={`austen-margin-link ${
                          selectedSinhalaCategoryId === "all" ? "is-active" : ""
                        }`}
                        style={{ padding: "2px 7px", fontSize: "10.5px" }}
                      >
                        All Categories
                      </button>
                      {SINHALA_STORY_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCoverCollectionTab("sinhala");
                            setSelectedSinhalaCategoryId(cat.id);
                          }}
                          title={cat.labelEn}
                          className={`austen-margin-link ${
                            selectedSinhalaCategoryId === cat.id ? "is-active" : ""
                          }`}
                          style={{ padding: "2px 7px", fontSize: "10.5px" }}
                        >
                          {cat.labelSi}
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className="folio-contents-list"
                    style={{
                      maxHeight: "26vh",
                      overflowY: "auto",
                      paddingRight: "4px",
                    }}
                  >
                    {/* World Classics Section */}
                    {(coverCollectionTab === "all" ||
                      coverCollectionTab === "classic") &&
                      library
                        .filter(
                          (b) => !ALL_SINHALA_STORYBOOKS.some((s) => s.id === b.id)
                        )
                        .map((book, idx) => (
                          <button
                            key={book.id}
                            type="button"
                            onClick={() => handleOpenExistingBook(book, true)}
                            className="folio-contents-row"
                          >
                            <span className="folio-contents-roman">
                              {book.roman || ROMAN_NUMERALS[idx] || "I"}
                            </span>
                            <span className="folio-contents-title">{book.title}</span>
                            <span className="folio-contents-leader" />
                            <span className="folio-contents-meta">
                              {book.author}, {book.year || "1813"}
                            </span>
                          </button>
                        ))}

                    {/* Categorized Sri Lankan Sinhala Stories Section */}
                    {(coverCollectionTab === "all" ||
                      coverCollectionTab === "sinhala") &&
                      SINHALA_STORY_CATEGORIES.filter(
                        (cat) =>
                          selectedSinhalaCategoryId === "all" ||
                          cat.id === selectedSinhalaCategoryId
                      ).map((cat) => {
                        const catBooks = ALL_SINHALA_STORYBOOKS.filter((b) =>
                          cat.bookIds.includes(b.id)
                        );
                        if (catBooks.length === 0) return null;
                        return (
                          <div key={cat.id} style={{ marginTop: "6px" }}>
                            <div
                              style={{
                                fontFamily: "var(--font-cinzel)",
                                fontSize: "10.5px",
                                letterSpacing: "0.11em",
                                color: "var(--folio-accent)",
                                textTransform: "uppercase",
                                padding: "4px 0 2px",
                              }}
                            >
                              {cat.labelSi} &nbsp;—&nbsp; {cat.labelEn}
                            </div>
                            {catBooks.map((book) => (
                              <button
                                key={book.id}
                                type="button"
                                onClick={() => handleOpenExistingBook(book, true)}
                                className="folio-contents-row"
                              >
                                <span className="folio-contents-roman">
                                  {book.roman || "VI"}
                                </span>
                                <span className="folio-contents-title">
                                  {book.title}
                                </span>
                                <span className="folio-contents-leader" />
                                <span className="folio-contents-meta">
                                  {book.author}, {book.year}
                                </span>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                  </div>

                  {/* D3-Based Daily Reading Goal Arc Tracker */}
                  <DailyReadingGoalTracker
                    foliosReadToday={foliosReadToday}
                    dailyGoalTarget={dailyGoalTarget}
                    onChangeGoalTarget={(nextTarget) =>
                      setDailyGoalTarget(nextTarget)
                    }
                    onLogBonusFolio={() =>
                      setFoliosReadToday((prev) => [
                        ...prev,
                        `manual_${Date.now()}`,
                      ])
                    }
                    onResetToday={() => setFoliosReadToday([])}
                  />
                </div>
              </div>

              <div className="austen-footer-bar">
                <span>VOLUMES I – IX</span>
                <span>WORLD &amp; SRI LANKAN SINHALA LIBRARY</span>
              </div>
            </div>

            {/* ==============================================================
                RECTO (RIGHT PAGE): COMMISSION FOLIO ("BOOK VI")
                Mirrors the exact speaker band & 3-state literary body of Reader
                ============================================================== */}
            <div className="austen-right-page">
              <div className="austen-running-bar">
                <span>BOOK VI  ·  A NEW COMMISSION</span>
                <span>CHAPTER I</span>
              </div>

              <div className="austen-speaker-band">
                <div>
                  <span
                    className="austen-speaker-name"
                    style={{ color: "var(--folio-accent)" }}
                  >
                    THE AUTHOR
                  </span>
                  <span className="austen-speaker-role">
                    {"  —  Your Commission"}
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleCommissionStorybook}
                className="austen-folio-body"
              >
                {/* Turn 1: Borderless Manuscript Inscription Surface */}
                <div className="austen-turn-block state-active">
                  <label
                    htmlFor="fairytale-prompt"
                    className="austen-turn-rubric"
                    style={{ display: "block", cursor: "pointer" }}
                  >
                    INSCRIPTION
                  </label>
                  <textarea
                    id="fairytale-prompt"
                    rows={3}
                    value={commissionPrompt}
                    onChange={(e) => setCommissionPrompt(e.target.value)}
                    placeholder="Inscribe a fairytale, characters, or literary chapter for the Gemini Managed Agent to illustrate, voice, and score…"
                    className="folio-manuscript-textarea"
                  />
                </div>

                {/* Turn 2: Continuous Italic Seed Run (zero pills, zero boxes) */}
                <div className="austen-turn-block state-past">
                  <div className="austen-turn-rubric">OR BEGIN WITH</div>
                  <p className="austen-turn-text" style={{ lineHeight: 1.5 }}>
                    {FAIRYTALE_COMMISSION_PROMPTS.map((item, idx) => {
                      const isSelected = commissionPrompt === item.prompt;
                      return (
                        <React.Fragment key={item.id}>
                          {idx > 0 && (
                            <span
                              style={{
                                color: "var(--folio-muted)",
                                fontStyle: "normal",
                              }}
                            >
                              {"  ·  "}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setCommissionPrompt(item.prompt);
                              setSelectedPaletteKey(item.paletteKey);
                            }}
                            className={`folio-seed-link ${
                              isSelected ? "is-selected" : ""
                            }`}
                          >
                            {item.title}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </p>
                </div>

                {/* Turn 3: Inline Colophon Sentence & Typographic Inscription Link */}
                <div className="austen-turn-block state-active">
                  <div className="austen-turn-rubric">EDITION COLOPHON</div>
                  <p
                    className="austen-turn-text"
                    style={{
                      fontStyle: "italic",
                      fontSize: "clamp(18px, 1.2vw, 21px)",
                      color: "var(--folio-muted)",
                    }}
                  >
                    Bound in{" "}
                    <select
                      aria-label="Edition palette"
                      value={selectedPaletteKey}
                      onChange={(e) => setSelectedPaletteKey(e.target.value)}
                      className="folio-inline-select"
                    >
                      {Object.entries(EDITION_PALETTES).map(([key, info]) => (
                        <option key={key} value={key}>
                          {info.label}
                        </option>
                      ))}
                    </select>
                    {"  ·  read by "}
                    <select
                      aria-label="Primary narrator voice"
                      value={narratorVoice}
                      onChange={(e) => setNarratorVoice(e.target.value)}
                      className="folio-inline-select"
                    >
                      {GEMINI_TTS_VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    {"  ·  plates in "}
                    <select
                      aria-label="Illustration wash style"
                      value={visualStyle}
                      onChange={(e) => setVisualStyle(e.target.value)}
                      className="folio-inline-select"
                    >
                      {VISUAL_STYLE_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    .
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: "18px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleCommissionStorybook()}
                      className="folio-commission-link"
                    >
                      COMMISSION THE EDITION &nbsp;&rarr;
                    </button>
                  </div>
                </div>
              </form>

              <div className="austen-footer-bar">
                <div
                  className="austen-progress-filament"
                  style={{ width: "33.3%" }}
                />
                <span>GEMINI MANAGED AGENT</span>
                <span>FOLIO VI.1</span>
              </div>
            </div>
          </div>

          {/* Subtle Outer Margin Line below the bottom rule */}
          <div className="austen-margin-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {folioHistory.length > 0 && (
                <>
                  <span>HISTORY:</span>
                  {folioHistory.map((crumb, idx) => (
                    <React.Fragment key={`${crumb.id}_${idx}`}>
                      {idx > 0 && <span aria-hidden="true">&rsaquo;</span>}
                      <button
                        type="button"
                        onClick={() => handleJumpToBreadcrumb(crumb, idx)}
                        title={`Jump to ${crumb.bookTitle} · Folio ${crumb.folioCode} (${crumb.caption})`}
                        className="austen-margin-link"
                      >
                        {crumb.folioCode}
                      </button>
                    </React.Fragment>
                  ))}
                </>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                type="button"
                onClick={() => handleOpenExistingBook(INITIAL_SHOWCASE_STORYBOOK, true)}
                className="austen-margin-link"
              >
                OPEN &amp; AUTO-NARRATE PRIDE AND PREJUDICE (1813) &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          STATE 2: ILLUMINATOR'S OPEN FOLIO SPREAD WHILE MANAGED AGENT CRAFTS
          Uses the exact same two-page spread and 3-state paragraph ink
          ==================================================================== */}
      {viewMode === "crafting" && (
        <div className="austen-spread-viewport">
          <div
            className={`austen-open-book ${
              isPageTurning ? "folio-page-turning" : ""
            }`}
          >
            {/* LEFT PAGE: Matted 16:9 Stage Box being engraved */}
            <div className="austen-left-page">
              <div className="austen-running-bar">
                <span>BOOK VI  ·  GEMINI MANAGED AGENT</span>
                <span>MMXXVI</span>
              </div>

              <div className="austen-plate-mat">
                <div
                  className="austen-plate-stage"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "24px 28px",
                    textAlign: "center",
                    overflow: "hidden",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "12px",
                        letterSpacing: "0.153em",
                        color: "var(--folio-accent)",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      {agentName.toUpperCase()}  ·  {modelName.toUpperCase()}
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--font-garamond)",
                        fontStyle: "italic",
                        fontSize: "clamp(19px, 1.35vw, 23px)",
                        color: "var(--folio-ink)",
                        maxWidth: "560px",
                        lineHeight: 1.32,
                      }}
                    >
                      {activeStageLabel || "The plate is being engraved upon archival paper…"}
                    </div>

                    <div
                      className="folio-diamond-rule"
                      style={{ maxWidth: "240px", margin: "12px auto" }}
                    >
                      <div className="folio-diamond-rule-line" />
                      <div className="folio-diamond-rule-gem" />
                      <div className="folio-diamond-rule-line" />
                    </div>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      borderTop: "1px solid var(--folio-rule)",
                      paddingTop: "10px",
                    }}
                  >
                    {latestLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          fontFamily: "var(--font-garamond)",
                          fontSize: "14px",
                          lineHeight: 1.28,
                          color: "var(--folio-ink)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-cinzel)",
                            fontSize: "10.5px",
                            letterSpacing: "0.08em",
                            color: "var(--folio-accent)",
                            marginRight: "8px",
                          }}
                        >
                          {log.timestamp}
                        </span>
                        <span style={{ fontWeight: 500 }}>{log.title}</span>
                        {log.detail ? (
                          <span
                            style={{
                              fontStyle: "italic",
                              color: "var(--folio-muted)",
                            }}
                          >
                            {"  —  "}
                            {log.detail.replace(/\s+/g, " ").slice(0, 110)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="austen-plate-caption-row">
                  <span className="austen-plate-number">
                    {environmentId
                      ? `ENV · ${environmentId.slice(0, 10).toUpperCase()}`
                      : "SANDBOX · LIVE"}
                  </span>
                  <span className="austen-plate-caption">
                    {interactionId
                      ? `Interaction ${interactionId.slice(0, 14)}…`
                      : "Streaming from /v1beta/interactions"}
                  </span>
                </div>
              </div>

              <div className="austen-footer-bar">
                <span>ILLUSTRATED AUDIOBOOK EDITION</span>
                <span>SANDBOX · GEMINI-API-CLI</span>
              </div>
            </div>

            {/* RIGHT PAGE: 5 Pipeline Stages as 3-State Literary Paragraphs */}
            <div className="austen-right-page">
              <div className="austen-running-bar">
                <span>A NEW COMMISSION</span>
                <span>CHAPTER I</span>
              </div>

              <div className="austen-speaker-band">
                <div>
                  <span
                    className="austen-speaker-name"
                    style={{ color: "var(--folio-accent)" }}
                  >
                    THE ILLUSTRATOR
                  </span>
                  <span className="austen-speaker-role">
                    {`  —  Stage ${ROMAN_NUMERALS[activeStageIdx] || "I"} of V`}
                  </span>
                </div>
              </div>

              <div className="austen-folio-body">
                {PIPELINE_STAGES.map((st) => {
                  const turnStateClass =
                    st.index === activeStageIdx
                      ? "state-active"
                      : st.index < activeStageIdx
                      ? "state-past"
                      : "state-future";
                  return (
                    <div
                      key={st.index}
                      className={`austen-turn-block ${turnStateClass}`}
                    >
                      <div className="austen-turn-rubric">{st.code}</div>
                      <p className="austen-turn-text">{st.title}</p>
                    </div>
                  );
                })}

                {agentError && (
                  <div className="austen-turn-block state-active">
                    <div
                      className="austen-turn-rubric"
                      style={{ color: "#9E332B" }}
                    >
                      SANDBOX NOTICE
                    </div>
                    <p
                      className="austen-turn-text"
                      style={{ color: "#9E332B", fontStyle: "italic" }}
                    >
                      {agentError}
                    </p>
                  </div>
                )}
              </div>

              <div className="austen-footer-bar">
                <div
                  className="austen-progress-filament"
                  style={{ width: `${((activeStageIdx + 1) / 5) * 100}%` }}
                />
                <span>SCENE I</span>
                <span>FOLIO VI.1</span>
              </div>
            </div>
          </div>

          <div className="austen-margin-bar">
            <span>
              {environmentId
                ? `SANDBOX ${environmentId.slice(0, 12)}`
                : "PROVISIONING SANDBOX CONTAINER"}
            </span>
            <button
              type="button"
              onClick={() => abortControllerRef.current?.abort()}
              className="austen-margin-link"
            >
              CLOSE THE BOOK &amp; CANCEL
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          STATE 3: THE JANE AUSTEN TWO-PAGE OPEN FOLIO SPREAD (READER & PLAYER)
          Pixel-faithful to classic_novels_opening_chapters.mp4:
          - 0.0s .. 2.2s: Full-Frame Fine-Press Chapter Title Card with Character Sheet
          - 2.2s .. 5.4s: 3D Spine-Hinged Page Turn & Pop-Up Diorama Unfold (all turns in state-future)
          - 5.4s .. end: Real-Time Synchronized 3-State Paragraph Highlighting & Automatic Folio Crossfades
          ==================================================================== */}
      {viewMode === "reader" && (
        <div className="austen-spread-viewport">
          {showOpeningTitleCard ? (
            /* ================================================================
               STAGE A (0.0s .. 2.2s): FULL-FRAME CHAPTER TITLE CARD
               Matches render_title_card in render_audiobook_video.py
               ================================================================ */
            <div
              className="austen-opening-title-card"
              onClick={() => seekToFolioAndTurn(0, 0)}
              title="Click to turn immediately to Folio I.1"
            >
              <div className="austen-opening-title-inner">
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "15px",
                      letterSpacing: "0.153em",
                      color: "var(--folio-accent)",
                      textTransform: "uppercase",
                      marginBottom: "10px",
                    }}
                  >
                    BOOK {storybook.roman || "I"} &nbsp;·&nbsp;{" "}
                    {storybook.genreFooterLeft || "REGENCY SOCIAL SATIRE"}
                  </div>

                  <h1
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "clamp(46px, 4.1vw, 66px)",
                      fontWeight: 500,
                      color: "var(--folio-ink)",
                      margin: "0 0 8px 0",
                      lineHeight: 1.04,
                    }}
                  >
                    {storybook.title}
                  </h1>

                  <div
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "16px",
                      letterSpacing: "0.12em",
                      color: "var(--folio-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    {storybook.author} &nbsp;·&nbsp; {storybook.year || "1813"}
                  </div>

                  <div
                    className="folio-diamond-rule"
                    style={{ maxWidth: "420px", margin: "16px auto" }}
                  >
                    <div className="folio-diamond-rule-line" />
                    <div className="folio-diamond-rule-gem" />
                    <div className="folio-diamond-rule-line" />
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-garamond)",
                      fontStyle: "italic",
                      fontSize: "clamp(21px, 1.5vw, 25px)",
                      color: "var(--folio-ink)",
                    }}
                  >
                    {storybook.subtitle} &mdash;{" "}
                    {storybook.settingFooterRight || "Longbourn, Hertfordshire"}
                  </div>
                </div>

                {/* Matted 16:9 Character Reference Sheet Plate */}
                <div
                  style={{
                    backgroundColor: "var(--folio-card)",
                    border: "1px solid var(--folio-rule)",
                    padding: "14px 12px",
                    maxWidth: "740px",
                    width: "100%",
                    margin: "14px auto",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "16 / 9",
                      border: "1px solid var(--folio-rule)",
                      overflow: "hidden",
                      backgroundColor: "var(--folio-paper)",
                    }}
                  >
                    <img
                      src={
                        storybook.charSheetImageUrl ||
                        storybook.coverImageUrl ||
                        "https://www.gstatic.com/aistudio/starter-apps/audio-storybooks/illustrations/01_pride_and_prejudice_char_sheet.jpg"
                      }
                      alt={`${storybook.title} Character Reference Sheet`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "13px",
                      letterSpacing: "0.129em",
                      color: "var(--folio-muted)",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    ILLUSTRATED EDITION &nbsp;·&nbsp; GEMINI 3.8 FLASH TTS CAST &nbsp;·&nbsp; LYRIA 3.5 SCORE
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-garamond)",
                      fontStyle: "italic",
                      fontSize: "19.5px",
                      color: "var(--folio-ink)",
                    }}
                  >
                    {storybook.characters
                      .map((c) => c.name)
                      .join("   ·   ")}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================
               STAGE B & C (2.2s .. end): TWO-PAGE OPEN FOLIO SPREAD
               Left Page: 3D Pop-Up Diorama Stage (unfolds on scene open, steady across same-scene folios)
               Right Page: 3-State Synchronized Literary Narration & Dialogue Turns
               ================================================================ */
            <div
              className={`austen-open-book ${
                isPageTurning ? "folio-page-turning" : ""
              }`}
            >
              {/* ==============================================================
                  LEFT PAGE: VISUAL PLATE FOLIO
                  BOOK I · JANE AUSTEN | 1813
                  Matted 16:9 Stage: PLATE I OF III | Longbourn Morning Room
                  REGENCY SOCIAL SATIRE | LONGBOURN, HERTFORDSHIRE
                  ============================================================== */}
              <div className="austen-left-page">
                <div className="austen-running-bar">
                  <span>{formattedBookHeaderLeft}</span>
                  <span>{storybook.year || "1813"}</span>
                </div>

                {/* Centered Matted 16:9 Stage Box (#EFE9DC Card Mat + #D5CBB8 1px Rule) */}
                <div className="austen-plate-mat">
                  <div
                    className={`austen-plate-stage ${
                      isDioramaUnfolding ? "folio-diorama-unfolding" : ""
                    }`}
                    onClick={handleCyclePlate}
                    title="Click plate to cycle between 3D Pop-Up Diorama, 2D Watercolour Plate, and Character Sheet"
                  >
                    <img
                      src={
                        currentPlate?.imageDataUrl ||
                        currentPlate?.imageUrl ||
                        currentPage?.dioramaUrl ||
                        currentPage?.imageUrl ||
                        storybook.coverImageUrl
                      }
                      alt={currentPlate?.title || currentPage?.imageCaption}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxZoom(1);
                        setShowPlateLightbox(true);
                      }}
                      className="austen-plate-zoom-btn"
                      title="Inspect full-screen plate with zoom loupe"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                        <path d="M11 8v6" />
                        <path d="M8 11h6" />
                      </svg>
                      <span>Zoom Plate</span>
                    </button>
                  </div>

                  {/* Plate Caption Row inside Mat: PLATE I OF III (left, sage accent) | Longbourn Morning Room (right, italic) */}
                  <div className="austen-plate-caption-row">
                    <button
                      type="button"
                      onClick={handleCyclePlate}
                      className="austen-plate-number"
                      title="Click to cycle plate view"
                    >
                      {canonicalPlateLabel}
                    </button>
                    <span className="austen-plate-caption">
                      {currentPlate?.title || currentPage?.imageCaption}
                    </span>
                  </div>
                </div>

                {/* Left Page Running Footer: REGENCY SOCIAL SATIRE | LONGBOURN, HERTFORDSHIRE */}
                <div className="austen-footer-bar">
                  <span>
                    {storybook.genreFooterLeft || "REGENCY SOCIAL SATIRE"}
                  </span>
                  <span>
                    {storybook.settingFooterRight || "LONGBOURN, HERTFORDSHIRE"}
                  </span>
                </div>
              </div>

              {/* ==============================================================
                  RIGHT PAGE: LITERARY NARRATION & DIALOGUE FOLIO
                  PRIDE AND PREJUDICE | CHAPTER I
                  NARRATOR — Literary Narration
                  3-State EB Garamond Paragraphs with Small-Caps Speaker Rubrics
                  SCENE I | FOLIO I.1
                  ============================================================== */}
              <div
                className={`austen-right-page ${
                  isRightFolioFading ? "folio-right-page-fading" : ""
                }`}
              >
                <div className="austen-running-bar">
                  <span>{storybook.title.toUpperCase()}</span>
                  <span>{currentPage?.chapterTitle || "CHAPTER I"}</span>
                </div>

                {/* Active Speaker Subheader Band (between y=108 rule and y=166 rule) */}
                <div className="austen-speaker-band">
                  <div>
                    <span
                      className="austen-speaker-name"
                      style={{
                        color:
                          activeLineIdx >= 0 &&
                          activeLineIdx < 999 &&
                          activeLine?.isDialogue
                            ? "var(--folio-accent)"
                            : "var(--folio-muted)",
                      }}
                    >
                      {activeLineIdx >= 0 && activeLineIdx < 999
                        ? activeLine?.speakerLabel ||
                          activeLine?.speaker?.toUpperCase() ||
                          "NARRATOR"
                        : "NARRATOR"}
                    </span>
                    <span className="austen-speaker-role">
                      {"  —  "}
                      {activeLineIdx >= 0 && activeLineIdx < 999
                        ? activeLine?.voiceRoleLabel ||
                          (activeLine?.isDialogue
                            ? "Character Dialogue"
                            : "Literary Narration")
                        : "Literary Narration"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleNarration}
                    className="austen-margin-link"
                    title="Toggle synchronized audiobook narration"
                  >
                    <span>
                      {formatTimecode(playbackTimeSec)} / {formatTimecode(totalDurSec)}{" "}
                      &nbsp;·&nbsp;
                    </span>
                    {isPlayingAudio ? (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <polygon points="6 4 20 12 6 20 6 4" />
                        </svg>
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right-Page Literary Body: 3-State Paragraph Ink Highlighting + Interactive Marginalia + Quote Bookmarks */}
                <div className={`austen-folio-body font-${readerBodyFont}`}>
                  {dialogueLines.map((line, idx) => {
                    const prevSpeaker =
                      idx > 0 ? dialogueLines[idx - 1]?.speaker : null;
                    const showRubric =
                      Boolean(line.isDialogue) && line.speaker !== prevSpeaker;

                    const turnStateClass =
                      activeLineIdx === -1
                        ? "state-future"
                        : activeLineIdx === 999
                        ? "state-past"
                        : idx === activeLineIdx
                        ? "state-active"
                        : idx < activeLineIdx
                        ? "state-past"
                        : "state-future";

                    const quoteId = `${storybook.id}:${currentPageIdx}:${idx}`;
                    const isQuoteSaved = savedQuotes.some((q) => q.id === quoteId);
                    const segments = segmentTextWithMarginalia(line.text);
                    const marginaliaForTurn =
                      activeMarginalia && activeMarginalia.turnIdx === idx
                        ? activeMarginalia.note
                        : null;

                    return (
                      <div
                        key={idx}
                        onClick={() => seekToFolioAndTurn(currentPageIdx, idx)}
                        className={`austen-turn-block ${turnStateClass}`}
                        title="Click paragraph to seek narration here"
                      >
                        <button
                          type="button"
                          onClick={(e) =>
                            handleToggleSaveQuote(e, currentPageIdx, idx)
                          }
                          className={`austen-turn-bookmark-btn ${
                            isQuoteSaved ? "is-saved" : ""
                          }`}
                          title={
                            isQuoteSaved
                              ? "Saved in Commonplace Book (click to remove)"
                              : "Save passage to Commonplace Book"
                          }
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="13"
                            height="13"
                            fill={isQuoteSaved ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                          </svg>
                        </button>

                        {showRubric && (
                          <div className="austen-turn-rubric">
                            {(line.speakerLabel || line.speaker.toUpperCase()).replace(
                              /\s*\([♂♀]\s*(MALE|FEMALE)\)/gi,
                              ""
                            )}
                          </div>
                        )}
                        <p className="austen-turn-text">
                          {segments.map((seg, sIdx) =>
                            seg.note ? (
                              <span
                                key={sIdx}
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const note = seg.note!;
                                  setActiveMarginalia((prev) =>
                                    prev &&
                                    prev.turnIdx === idx &&
                                    prev.note.term === note.term
                                      ? null
                                      : { turnIdx: idx, note }
                                  );
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const note = seg.note!;
                                    setActiveMarginalia((prev) =>
                                      prev &&
                                      prev.turnIdx === idx &&
                                      prev.note.term === note.term
                                        ? null
                                        : { turnIdx: idx, note }
                                    );
                                  }
                                }}
                                className="austen-marginalia-term"
                                title={`Period Glossary: ${seg.note.term} (${seg.note.category}) — click for marginalia note`}
                              >
                                {seg.text}
                              </span>
                            ) : (
                              <React.Fragment key={sIdx}>{seg.text}</React.Fragment>
                            )
                          )}
                        </p>

                        {marginaliaForTurn && (
                          <div
                            className="austen-marginalia-card"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                justifyContent: "space-between",
                                gap: "8px",
                                marginBottom: "3px",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontFamily: "var(--font-cinzel)",
                                    fontSize: "10.5px",
                                    letterSpacing: "0.11em",
                                    color: "var(--folio-accent)",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  MARGINALIA · {marginaliaForTurn.category}
                                </span>
                                <span
                                  style={{
                                    fontFamily: "var(--font-cormorant)",
                                    fontWeight: 600,
                                    fontSize: "18px",
                                    color: "var(--folio-ink)",
                                    marginLeft: "8px",
                                  }}
                                >
                                  {marginaliaForTurn.term}
                                </span>
                                <span
                                  style={{
                                    fontFamily: "var(--font-garamond)",
                                    fontStyle: "italic",
                                    fontSize: "14px",
                                    color: "var(--folio-muted)",
                                    marginLeft: "6px",
                                  }}
                                >
                                  ({marginaliaForTurn.era})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveMarginalia(null)}
                                className="austen-margin-link"
                                style={{ padding: "1px 6px", fontSize: "10px" }}
                              >
                                &times;
                              </button>
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-garamond)",
                                fontSize: "15.5px",
                                lineHeight: 1.38,
                                color: "var(--folio-ink)",
                              }}
                            >
                              {marginaliaForTurn.definition}
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-garamond)",
                                fontStyle: "italic",
                                fontSize: "14.5px",
                                lineHeight: 1.35,
                                color: "var(--folio-muted)",
                                marginTop: "3px",
                              }}
                            >
                              {marginaliaForTurn.literaryNote}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right Page Running Footer with Interactive Chapter Scrubber Bar: SCENE I | FOLIO I.1 */}
                <div className="austen-footer-bar">
                  <div
                    className="austen-scrubber-track"
                    onClick={handleScrubberSeek}
                    title={`Click anywhere on this rule to scrub chapter timeline (${formatTimecode(
                      playbackTimeSec
                    )} / ${formatTimecode(totalDurSec)})`}
                  >
                    <div
                      className="austen-scrubber-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, chapterProgress * 100))}%`,
                      }}
                    />
                    <div
                      className="austen-scrubber-thumb"
                      style={{
                        left: `${Math.min(100, Math.max(0, chapterProgress * 100))}%`,
                      }}
                    />
                  </div>
                  <span>{currentPage?.sceneLabel || "SCENE I"}</span>
                  <span
                    onClick={() =>
                      seekToFolioAndTurn(
                        (currentPageIdx + 1) % storybook.pages.length,
                        0
                      )
                    }
                    style={{ cursor: "pointer" }}
                    title="Click to turn folio leaf"
                  >
                    {currentPage?.folioLabel ||
                      `FOLIO ${storybook.roman || "I"}.${currentPageIdx + 1}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Outer Margin Bar with User-Friendly Buttons */}
          <div className="austen-margin-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleCloseBookToCover}
                title="Return to Contents & Commission Folio"
                className="austen-margin-link"
              >
                &larr; Library
              </button>
              <button
                type="button"
                onClick={handleToggleNarration}
                title={isPlayingAudio ? "Pause Narration (Space)" : "Resume Narration (Space)"}
                className="austen-margin-link"
              >
                {isPlayingAudio ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <polygon points="6 4 20 12 6 20 6 4" />
                    </svg>
                    <span>Play</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => startBookNarration(storybook, 0, true)}
                title="Replay narration from Chapter Title Card"
                className="austen-margin-link"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Replay</span>
              </button>
              <button
                type="button"
                onClick={handleCyclePlate}
                title="Cycle Illustration Plate (P)"
                className="austen-margin-link"
              >
                Plate ({resolvedPlateIdx + 1}/{plates.length})
              </button>
              <button
                type="button"
                onClick={handleCycleLightingMode}
                title="Cycle Reading Lighting Mode: Daylight Cream / Candlelight Amber / Midnight Vellum"
                className={`austen-margin-link ${
                  lightingMode !== "daylight" ? "is-active" : ""
                }`}
              >
                <span>
                  {lightingMode === "daylight"
                    ? "Light: Day"
                    : lightingMode === "candlelight"
                    ? "Light: Candle"
                    : "Light: Night"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowCommonplaceModal(true)}
                title="Open Commonplace Book (Saved Quotes & Bookmarks)"
                className={`austen-margin-link ${
                  savedQuotes.length > 0 ? "is-active" : ""
                }`}
              >
                <span>Saved ({savedQuotes.length})</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadFolio}
                disabled={isDownloadingFolio}
                title="Download structured archival PDF of this Storybook Folio"
                className="austen-margin-link"
              >
                {isDownloadingFolio ? "PDF…" : "PDF"}
              </button>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                title="Select Reader body text typeface"
              >
                <span>Font:</span>
                <select
                  aria-label="Reader body text font"
                  value={readerBodyFont}
                  onChange={(e) =>
                    setReaderBodyFont(e.target.value as ReaderBodyFont)
                  }
                  className="austen-margin-select"
                >
                  {READER_BODY_FONT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              {statusNote && (
                <span
                  style={{
                    fontFamily: "var(--font-garamond)",
                    fontStyle: "italic",
                    textTransform: "none",
                    letterSpacing: "normal",
                    fontSize: "14px",
                    color: "var(--folio-ink)",
                  }}
                >
                  {statusNote}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() =>
                  currentPageIdx > 0 &&
                  seekToFolioAndTurn(currentPageIdx - 1, 0)
                }
                disabled={currentPageIdx === 0 && !showOpeningTitleCard}
                title="Previous Folio"
                className="austen-margin-link"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                <span>Prev</span>
              </button>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                {storybook.pages.map((p, pIdx) => (
                  <button
                    key={p.pageNumber}
                    type="button"
                    onClick={() => seekToFolioAndTurn(pIdx, 0)}
                    className={`austen-margin-link ${
                      pIdx === currentPageIdx && !showOpeningTitleCard
                        ? "is-active"
                        : ""
                    }`}
                  >
                    {`${storybook.roman || "I"}.${pIdx + 1}`}
                  </button>
                ))}
              </span>
              <button
                type="button"
                onClick={() =>
                  currentPageIdx < storybook.pages.length - 1 &&
                  seekToFolioAndTurn(currentPageIdx + 1, 0)
                }
                disabled={currentPageIdx >= storybook.pages.length - 1}
                title="Next Folio"
                className="austen-margin-link"
              >
                <span>Next</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setShowTitleCardModal(true)}
                title="View Chapter Title Leaf & Character Sheet"
                className="austen-margin-link"
              >
                Title
              </button>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(true)}
                title="Reader Keyboard Shortcuts (?)"
                className="austen-margin-link"
              >
                Shortcuts (?)
              </button>
            </div>
          </div>

          {/* Scrollable Character Cast Strip (below Reader margin bar) */}
          {folioCast.length > 0 && (
            <div
              className="austen-cast-strip"
              role="region"
              aria-label="Characters appearing in current folio"
            >
              <span className="austen-cast-label">
                CHARACTER CAST &nbsp;·&nbsp; FOLIO{" "}
                {`${storybook.roman || "I"}.${currentPageIdx + 1}`}
              </span>

              <div className="austen-cast-scroll">
                {folioCast.map((member) => {
                  const cleanMemberName = member.name
                    .replace(/\s*\(.*?\)\s*/g, "")
                    .toLowerCase();
                  const activeSpeakerRaw = (
                    activeLine?.speaker ||
                    activeLine?.speakerLabel ||
                    ""
                  ).toLowerCase();
                  const isSpeakingNow =
                    activeLineIdx >= 0 &&
                    activeLineIdx < 999 &&
                    ((cleanMemberName.length > 2 &&
                      activeSpeakerRaw.includes(cleanMemberName)) ||
                      (member.role.toLowerCase().includes("narrat") &&
                        activeSpeakerRaw.includes("narrat")));
                  const isSelected = selectedCastCharacterId === member.id;

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() =>
                        setSelectedCastCharacterId((prev) =>
                          prev === member.id ? null : member.id
                        )
                      }
                      aria-expanded={isSelected}
                      title={`View character bio for ${member.name}`}
                      className={`austen-cast-item ${
                        isSelected ? "is-selected" : ""
                      } ${isSpeakingNow ? "is-speaking" : ""}`}
                    >
                      <div className="austen-cast-portrait">
                        <div className="austen-cast-portrait-inner">
                          <img
                            src={member.portraitImageUrl}
                            alt={member.name}
                            style={{
                              objectPosition: member.portraitObjectPosition,
                              transform: `scale(${member.portraitScale})`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="austen-cast-meta">
                        <span className="austen-cast-name">{member.name}</span>
                        <span className="austen-cast-sub">
                          {isSpeakingNow
                            ? "Speaking now"
                            : member.turnsInFolio > 0
                            ? `${member.turnsInFolio} ${
                                member.turnsInFolio === 1 ? "turn" : "turns"
                              }`
                            : "In scene"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expandable Character Bio Leaf when a portrait thumbnail is clicked */}
          {selectedCastMember && (
            <div
              className="austen-cast-bio-panel"
              role="region"
              aria-label={`Character biography for ${selectedCastMember.name}`}
            >
              <div className="austen-cast-bio-inner">
                <div className="austen-cast-bio-portrait">
                  <div className="austen-cast-portrait-inner">
                    <img
                      src={selectedCastMember.portraitImageUrl}
                      alt={selectedCastMember.name}
                      style={{
                        objectPosition: selectedCastMember.portraitObjectPosition,
                        transform: `scale(${selectedCastMember.portraitScale})`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "10.5px",
                      letterSpacing: "0.125em",
                      color: "var(--folio-accent)",
                      textTransform: "uppercase",
                      marginBottom: "2px",
                    }}
                  >
                    DRAMATIS PERSONA &nbsp;·&nbsp; {selectedCastMember.role}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginBottom: "4px",
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "25px",
                        fontWeight: 500,
                        color: "var(--folio-ink)",
                        margin: 0,
                        lineHeight: 1.15,
                      }}
                    >
                      {selectedCastMember.name}
                    </h3>
                    <span
                      style={{
                        fontFamily: "var(--font-garamond)",
                        fontStyle: "italic",
                        fontSize: "16.5px",
                        color: "var(--folio-muted)",
                      }}
                    >
                      &mdash; {selectedCastMember.shortTitle}
                    </span>
                  </div>

                  <p
                    style={{
                      fontFamily: "var(--font-garamond)",
                      fontSize: "17px",
                      lineHeight: 1.42,
                      color: "var(--folio-ink)",
                      margin: "0 0 4px 0",
                    }}
                  >
                    {selectedCastMember.bio}
                  </p>

                  <div
                    style={{
                      fontFamily: "var(--font-garamond)",
                      fontStyle: "italic",
                      fontSize: "15.5px",
                      color: "var(--folio-muted)",
                      lineHeight: 1.38,
                    }}
                  >
                    In Folio {`${storybook.roman || "I"}.${currentPageIdx + 1}`}:{" "}
                    {selectedCastMember.dramaticNote}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCastCharacterId(null)}
                    className="austen-margin-link"
                  >
                    CLOSE &times;
                  </button>

                  {selectedCastMember.firstTurnIdx >= 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        seekToFolioAndTurn(
                          currentPageIdx,
                          selectedCastMember.firstTurnIdx
                        )
                      }
                      className="austen-margin-link is-active"
                      title={`Jump narration to ${selectedCastMember.name}'s first turn on this folio`}
                    >
                      HEAR IN FOLIO &rarr;
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowTitleCardModal(true)}
                    className="austen-margin-link"
                    title="Inspect full 16:9 period character reference sheet"
                  >
                    CHARACTER SHEET
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          LEAF OVERLAY 1: FINE-PRESS CHAPTER TITLE CARD & CHARACTER SHEET
          (Matches 01_pride_and_prejudice_preview_title.png / render_title_card)
          ==================================================================== */}
      {showTitleCardModal && (
        <div
          className="folio-modal-backdrop"
          onClick={() => setShowTitleCardModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(30, 27, 24, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 50,
          }}
        >
          <div
            className="folio-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--folio-paper)",
              border: "1px solid var(--folio-rule)",
              padding: "6px",
              maxWidth: "1020px",
              width: "100%",
            }}
          >
            <div
              className="folio-modal-inner"
              style={{
                border: "1px solid var(--folio-rule)",
                padding: "28px 36px",
                textAlign: "center",
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={() => setShowTitleCardModal(false)}
                className="austen-margin-link"
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "20px",
                }}
              >
                CLOSE &times;
              </button>

              <div
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "14px",
                  letterSpacing: "0.153em",
                  color: "var(--folio-accent)",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                BOOK {storybook.roman || "I"} &nbsp;·&nbsp;{" "}
                {storybook.genreFooterLeft || "REGENCY SOCIAL SATIRE"}
              </div>

              <h2
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "52px",
                  fontWeight: 500,
                  color: "var(--folio-ink)",
                  margin: "0 0 8px 0",
                }}
              >
                {storybook.title}
              </h2>

              <div
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "15px",
                  letterSpacing: "0.12em",
                  color: "var(--folio-muted)",
                  textTransform: "uppercase",
                }}
              >
                {storybook.author} &nbsp;·&nbsp; {storybook.year || "1813"}
              </div>

              <div className="folio-diamond-rule" style={{ maxWidth: "360px" }}>
                <div className="folio-diamond-rule-line" />
                <div className="folio-diamond-rule-gem" />
                <div className="folio-diamond-rule-line" />
              </div>

              <div
                style={{
                  fontFamily: "var(--font-garamond)",
                  fontStyle: "italic",
                  fontSize: "22px",
                  color: "var(--folio-ink)",
                  marginBottom: "18px",
                }}
              >
                {storybook.subtitle} &mdash;{" "}
                {storybook.settingFooterRight || "Longbourn, Hertfordshire"}
              </div>

              {/* Matted 16:9 Character Reference Sheet Plate */}
              <div
                style={{
                  backgroundColor: "var(--folio-card)",
                  border: "1px solid var(--folio-rule)",
                  padding: "14px 12px",
                  maxWidth: "680px",
                  margin: "0 auto 18px",
                }}
              >
                <div
                  style={{
                    aspectRatio: "16 / 9",
                    border: "1px solid var(--folio-rule)",
                    overflow: "hidden",
                    backgroundColor: "var(--folio-paper)",
                  }}
                >
                  <img
                    src={
                      storybook.charSheetImageUrl ||
                      storybook.coverImageUrl ||
                      "https://www.gstatic.com/aistudio/starter-apps/audio-storybooks/illustrations/01_pride_and_prejudice_char_sheet.jpg"
                    }
                    alt={`${storybook.title} Character Reference Sheet`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "12px",
                  letterSpacing: "0.129em",
                  color: "var(--folio-muted)",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                ILLUSTRATED EDITION &nbsp;·&nbsp; GEMINI FLASH TTS CAST &nbsp;·&nbsp; LYRIA 3.5 SCORE
              </div>

              <div
                style={{
                  fontFamily: "var(--font-garamond)",
                  fontStyle: "italic",
                  fontSize: "18.5px",
                  color: "var(--folio-ink)",
                }}
              >
                {storybook.characters
                  .map((c) => c.name)
                  .join("   ·   ")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          LEAF OVERLAY 2: EDITION COLOPHON & MANAGED AGENT CONFIGURATION
          ==================================================================== */}
      {showAgentSpecModal && (
        <div
          className="folio-modal-backdrop"
          onClick={() => setShowAgentSpecModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(30, 27, 24, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 50,
          }}
        >
          <div
            className="folio-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--folio-paper)",
              border: "1px solid var(--folio-rule)",
              padding: "24px 32px",
              maxWidth: "860px",
              width: "100%",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: "1px solid var(--folio-rule)",
                paddingBottom: "12px",
                marginBottom: "18px",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "12px",
                    letterSpacing: "0.129em",
                    color: "var(--folio-accent)",
                  }}
                >
                  COLOPHON &amp; GEMINI MANAGED AGENT ARCHITECTURE
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "28px",
                    fontWeight: 500,
                    margin: "4px 0 0",
                  }}
                >
                  {agentName} ({modelName}) + classic-audiobooks Pipeline
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowAgentSpecModal(false)}
                className="austen-margin-link"
              >
                CLOSE &times;
              </button>
            </div>

            <div
              className="folio-colophon-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "11px",
                    letterSpacing: "0.114em",
                    color: "var(--folio-muted)",
                    marginBottom: "4px",
                  }}
                >
                  MANAGED AGENT ID
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--folio-rule)",
                    padding: "6px 2px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--folio-ink)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "11px",
                    letterSpacing: "0.114em",
                    color: "var(--folio-muted)",
                    marginBottom: "4px",
                  }}
                >
                  AGENT MODEL (ARGON)
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--folio-rule)",
                    padding: "6px 2px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--folio-ink)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <div
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "11px",
                  letterSpacing: "0.114em",
                  color: "var(--folio-muted)",
                  marginBottom: "6px",
                }}
              >
                GEMINI-API-CLI BOOTSTRAP COMMAND IN SANDBOX
              </div>
              <pre
                style={{
                  backgroundColor: "var(--folio-card)",
                  border: "1px solid var(--folio-rule)",
                  padding: "10px 12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11.5px",
                  color: "var(--folio-muted)",
                  overflowX: "auto",
                  margin: 0,
                }}
              >
                {GEMINI_API_CLI_INSTALL_CMD}
              </pre>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "11px",
                  letterSpacing: "0.114em",
                  color: "var(--folio-muted)",
                  marginBottom: "6px",
                }}
              >
                MOUNTED /.AGENTS/AGENTS.MD &amp; CLASSIC-AUDIOBOOKS SCRIPTS
              </div>
              <pre
                style={{
                  backgroundColor: "var(--folio-card)",
                  border: "1px solid var(--folio-rule)",
                  padding: "12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11.5px",
                  color: "var(--folio-muted)",
                  whiteSpace: "pre-wrap",
                  maxHeight: "280px",
                  overflowY: "auto",
                  margin: 0,
                }}
              >
                {AGENTS_MD_CONTENT}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          LEAF OVERLAY 3: READER KEYBOARD SHORTCUTS & FOLIATION GUIDE
          ==================================================================== */}
      {showShortcutsModal && (
        <div
          className="folio-modal-backdrop"
          onClick={() => setShowShortcutsModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(30, 27, 24, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 50,
          }}
        >
          <div
            className="folio-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-leaf-title"
            style={{
              backgroundColor: "var(--folio-paper)",
              border: "1px solid var(--folio-rule)",
              padding: "6px",
              maxWidth: "680px",
              width: "100%",
            }}
          >
            <div
              className="folio-modal-inner"
              style={{
                border: "1px solid var(--folio-rule)",
                padding: "26px 32px",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  borderBottom: "1px solid var(--folio-rule)",
                  paddingBottom: "12px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "12px",
                      letterSpacing: "0.129em",
                      color: "var(--folio-accent)",
                      textTransform: "uppercase",
                    }}
                  >
                    READER&rsquo;S KEY &amp; FOLIATION GUIDE
                  </div>
                  <h2
                    id="shortcuts-leaf-title"
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "32px",
                      fontWeight: 500,
                      color: "var(--folio-ink)",
                      margin: "4px 0 0",
                    }}
                  >
                    Keyboard Shortcuts
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowShortcutsModal(false)}
                  className="austen-margin-link"
                >
                  CLOSE &times;
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "22px",
                }}
              >
                {READER_KEYBOARD_SHORTCUTS.map((section) => (
                  <div key={section.group}>
                    <div
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "11.5px",
                        letterSpacing: "0.129em",
                        color: "var(--folio-accent)",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                      }}
                    >
                      {section.group}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {section.items.map((item) => (
                        <div key={item.label}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: "10px",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-garamond)",
                                fontSize: "18.5px",
                                fontWeight: 500,
                                color: "var(--folio-ink)",
                                flexShrink: 0,
                              }}
                            >
                              {item.label}
                            </span>

                            <span className="folio-contents-leader" />

                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                flexShrink: 0,
                              }}
                            >
                              {item.keys.map((k, kIdx) => (
                                <React.Fragment key={k}>
                                  {kIdx > 0 && (
                                    <span
                                      style={{
                                        fontFamily: "var(--font-garamond)",
                                        fontStyle: "italic",
                                        fontSize: "14px",
                                        color: "var(--folio-muted)",
                                      }}
                                    >
                                      or
                                    </span>
                                  )}
                                  <kbd
                                    style={{
                                      backgroundColor: "var(--folio-card)",
                                      border: "1px solid var(--folio-rule)",
                                      padding: "2px 8px",
                                      fontFamily: "var(--font-mono)",
                                      fontSize: "12px",
                                      color: "var(--folio-ink)",
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {k}
                                  </kbd>
                                </React.Fragment>
                              ))}
                            </span>
                          </div>

                          <div
                            style={{
                              fontFamily: "var(--font-garamond)",
                              fontStyle: "italic",
                              fontSize: "15.5px",
                              color: "var(--folio-muted)",
                              marginTop: "2px",
                            }}
                          >
                            {item.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--folio-rule)",
                  marginTop: "22px",
                  paddingTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "11.5px",
                  letterSpacing: "0.114em",
                  color: "var(--folio-muted)",
                  textTransform: "uppercase",
                }}
              >
                <span>PRESS ? ANYTIME IN READER MODE</span>
                <span>ESC TO DISMISS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          LEAF OVERLAY 4: COMMONPLACE BOOK (SAVED QUOTES & BOOKMARKS)
          ==================================================================== */}
      {showCommonplaceModal && (
        <div
          className="folio-modal-backdrop"
          onClick={() => setShowCommonplaceModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(30, 27, 24, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 55,
          }}
        >
          <div
            className="folio-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--folio-paper)",
              border: "1px solid var(--folio-rule)",
              padding: "6px",
              maxWidth: "760px",
              width: "100%",
              maxHeight: "86vh",
              overflowY: "auto",
            }}
          >
            <div
              className="folio-modal-inner"
              style={{
                border: "1px solid var(--folio-rule)",
                padding: "24px 30px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  borderBottom: "1px solid var(--folio-rule)",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "11.5px",
                      letterSpacing: "0.125em",
                      color: "var(--folio-accent)",
                    }}
                  >
                    READER&rsquo;S COMMONPLACE BOOK
                  </div>
                  <h2
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "30px",
                      fontWeight: 500,
                      color: "var(--folio-ink)",
                      margin: "2px 0 0",
                    }}
                  >
                    Saved Passages &amp; Folio Ribbons ({savedQuotes.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCommonplaceModal(false)}
                  className="austen-margin-link"
                >
                  CLOSE &times;
                </button>
              </div>

              {savedQuotes.length === 0 ? (
                <p
                  style={{
                    fontFamily: "var(--font-garamond)",
                    fontStyle: "italic",
                    fontSize: "18px",
                    color: "var(--folio-muted)",
                    textAlign: "center",
                    padding: "28px 12px",
                  }}
                >
                  Hover over any paragraph in the Reader and click the ribbon icon on the right margin to inscribe your favourite passages here.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  {savedQuotes.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        backgroundColor: "var(--folio-card)",
                        border: "1px solid var(--folio-rule)",
                        padding: "12px 16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-cinzel)",
                            fontSize: "11px",
                            letterSpacing: "0.1em",
                            color: "var(--folio-accent)",
                          }}
                        >
                          {q.bookTitle} &nbsp;·&nbsp; FOLIO {q.folioCode} &nbsp;·&nbsp;{" "}
                          {q.speaker}
                        </span>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleJumpToSavedQuote(q)}
                            className="austen-margin-link is-active"
                          >
                            OPEN FOLIO &rarr;
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSavedQuotes((prev) =>
                                prev.filter((item) => item.id !== q.id)
                              )
                            }
                            className="austen-margin-link"
                            title="Remove from Commonplace Book"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                      <p
                        style={{
                          fontFamily: "var(--font-garamond)",
                          fontSize: "17.5px",
                          lineHeight: 1.42,
                          color: "var(--folio-ink)",
                          margin: 0,
                        }}
                      >
                        &ldquo;{q.text}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          LEAF OVERLAY 5: FULL-SCREEN PLATE LIGHTBOX & ZOOM LOUPE
          ==================================================================== */}
      {showPlateLightbox && (
        <div
          className="folio-modal-backdrop"
          onClick={() => setShowPlateLightbox(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(18, 16, 14, 0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 60,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--folio-paper)",
              border: "1px solid var(--folio-rule)",
              padding: "16px 20px",
              maxWidth: "1180px",
              width: "100%",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                borderBottom: "1px solid var(--folio-rule)",
                paddingBottom: "10px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "12px",
                    letterSpacing: "0.12em",
                    color: "var(--folio-accent)",
                    marginRight: "10px",
                  }}
                >
                  {canonicalPlateLabel}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-garamond)",
                    fontStyle: "italic",
                    fontSize: "19px",
                    color: "var(--folio-ink)",
                  }}
                >
                  {currentPlate?.title || currentPage?.imageCaption}
                </span>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "11px",
                    color: "var(--folio-muted)",
                  }}
                >
                  LOUPE ZOOM:
                </span>
                {[1, 1.5, 2, 2.5].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setLightboxZoom(z)}
                    className={`austen-margin-link ${
                      lightboxZoom === z ? "is-active" : ""
                    }`}
                  >
                    {z}&times;
                  </button>
                ))}
                {plates.length > 1 && (
                  <button
                    type="button"
                    onClick={handleCyclePlate}
                    className="austen-margin-link"
                  >
                    Next Plate ({resolvedPlateIdx + 1}/{plates.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPlateLightbox(false)}
                  className="austen-margin-link"
                >
                  CLOSE &times;
                </button>
              </div>
            </div>

            <div
              style={{
                overflow: "auto",
                border: "1px solid var(--folio-rule)",
                backgroundColor: "var(--folio-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                maxHeight: "76vh",
              }}
            >
              <img
                src={
                  currentPlate?.imageDataUrl ||
                  currentPlate?.imageUrl ||
                  currentPage?.dioramaUrl ||
                  currentPage?.imageUrl ||
                  storybook.coverImageUrl
                }
                alt={currentPlate?.title || currentPage?.imageCaption}
                style={{
                  width: `${lightboxZoom * 100}%`,
                  maxWidth: "none",
                  height: "auto",
                  display: "block",
                  transition: "width 220ms ease",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
