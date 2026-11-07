export type VoiceGender = "male" | "female";

export interface PrebuiltVoiceProfile {
  voiceName: string;
  gender: VoiceGender;
  registerLabel: string;
  shortBadge: string;
  description: string;
  /**
   * Pitch & vocal-tract formant ratio relative to neutral female reference (1.0).
   * Male voices < 1.0 (longer vocal tract + lower F0), Female voices >= 1.0.
   */
  pitchRatio: number;
  /**
   * Speaking duration multiplier (1.0 = original cadence, 0.96 = slightly brisker, 1.04 = measured).
   */
  durationMultiplier: number;
  /**
   * Chest resonance boost (low-frequency warmth) for male baritone/bass vs female soprano clarity.
   */
  lowBoostGain: number;
}

export const VOICE_PROFILES: Record<string, PrebuiltVoiceProfile> = {
  // ─── FEMALE VOICES ──────────────────────────────────────────────────────────
  Kore: {
    voiceName: "Kore",
    gender: "female",
    registerLabel: "Female · Warm Contralto",
    shortBadge: "♀ Female (Kore)",
    description: "Poised, warm literary contralto suited to narration and noblewomen",
    pitchRatio: 1.0,
    durationMultiplier: 1.0,
    lowBoostGain: 0.0,
  },
  Aoede: {
    voiceName: "Aoede",
    gender: "female",
    registerLabel: "Female · Expressive Soprano",
    shortBadge: "♀ Female (Aoede)",
    description: "Bright, expressive lyric soprano for spirited heroines and poetic verse",
    pitchRatio: 1.08,
    durationMultiplier: 0.97,
    lowBoostGain: -0.08,
  },
  Leda: {
    voiceName: "Leda",
    gender: "female",
    registerLabel: "Female · Youthful Lyric",
    shortBadge: "♀ Female (Leda)",
    description: "Light, youthful female voice for young heroines and whimsical dialogue",
    pitchRatio: 1.14,
    durationMultiplier: 0.95,
    lowBoostGain: -0.12,
  },
  Zephyr: {
    voiceName: "Zephyr",
    gender: "female",
    registerLabel: "Female · Gentle Mezzo",
    shortBadge: "♀ Female (Zephyr)",
    description: "Soft, reflective mezzo-soprano with airy intimacy",
    pitchRatio: 1.04,
    durationMultiplier: 0.99,
    lowBoostGain: -0.04,
  },

  // ─── MALE VOICES ────────────────────────────────────────────────────────────
  Charon: {
    voiceName: "Charon",
    gender: "male",
    registerLabel: "Male · Deep Baritone",
    shortBadge: "♂ Male (Charon)",
    description: "Authoritative, resonant deep baritone for sages, monarchs, and elders",
    pitchRatio: 0.74,
    durationMultiplier: 1.02,
    lowBoostGain: 0.28,
  },
  Fenrir: {
    voiceName: "Fenrir",
    gender: "male",
    registerLabel: "Male · Warm Baritone",
    shortBadge: "♂ Male (Fenrir)",
    description: "Natural, spirited baritone for first-person heroes and leading men",
    pitchRatio: 0.80,
    durationMultiplier: 0.99,
    lowBoostGain: 0.22,
  },
  Orus: {
    voiceName: "Orus",
    gender: "male",
    registerLabel: "Male · Steady Baritone",
    shortBadge: "♂ Male (Orus)",
    description: "Measured, grounded male voice for loyal companions and scholars",
    pitchRatio: 0.77,
    durationMultiplier: 1.0,
    lowBoostGain: 0.24,
  },
  Puck: {
    voiceName: "Puck",
    gender: "male",
    registerLabel: "Male · Lively Tenor",
    shortBadge: "♂ Male (Puck)",
    description: "Quick-witted, theatrical male tenor for court jesters, youths, and disciples",
    pitchRatio: 0.84,
    durationMultiplier: 0.96,
    lowBoostGain: 0.16,
  },
  Iapetus: {
    voiceName: "Iapetus",
    gender: "male",
    registerLabel: "Male · Resonant Bass",
    shortBadge: "♂ Male (Iapetus)",
    description: "Solemn, commanding bass-baritone for patriarchs and ancient chroniclers",
    pitchRatio: 0.71,
    durationMultiplier: 1.04,
    lowBoostGain: 0.32,
  },
};

export const FEMALE_VOICE_LIST: PrebuiltVoiceProfile[] = Object.values(
  VOICE_PROFILES
).filter((v) => v.gender === "female");

export const MALE_VOICE_LIST: PrebuiltVoiceProfile[] = Object.values(
  VOICE_PROFILES
).filter((v) => v.gender === "male");

/**
 * Infers whether a character or dialogue turn uses a Male or Female voice.
 */
export function resolveVoiceProfile(
  voiceName?: string,
  explicitGender?: VoiceGender,
  speakerName?: string
): PrebuiltVoiceProfile {
  if (voiceName && VOICE_PROFILES[voiceName]) {
    const profile = VOICE_PROFILES[voiceName];
    if (!explicitGender || profile.gender === explicitGender) {
      return profile;
    }
  }

  // Check by case-insensitive voiceName match
  if (voiceName) {
    const found = Object.values(VOICE_PROFILES).find(
      (p) => p.voiceName.toLowerCase() === voiceName.toLowerCase()
    );
    if (found && (!explicitGender || found.gender === explicitGender)) {
      return found;
    }
  }

  // Infer gender from speaker name if explicitGender is not provided
  const spk = (speakerName || "").toLowerCase();
  const inferredGender: VoiceGender =
    explicitGender ||
    (spk.includes("mrs.") ||
    spk.includes("miss") ||
    spk.includes("lady") ||
    spk.includes("alice") ||
    spk.includes("aunt") ||
    spk.includes("queen") ||
    spk.includes("බිසව") ||
    spk.includes("නැන්දා") ||
    spk.includes("කාන්තාව") ||
    spk.includes("කථකාවිය")
      ? "female"
      : spk.includes("mr.") ||
        spk.includes("holmes") ||
        spk.includes("watson") ||
        spk.includes("tom") ||
        spk.includes("මහදැනමුත්තා") ||
        spk.includes("අන්දරේ") ||
        spk.includes("රජතුමා") ||
        spk.includes("උපාලි") ||
        spk.includes("ජිනපාල") ||
        spk.includes("ගුත්තිල") ||
        spk.includes("මූසිල") ||
        spk.includes("පොල්බෑ")
      ? "male"
      : "female");

  return inferredGender === "male" ? VOICE_PROFILES.Charon : VOICE_PROFILES.Kore;
}

let sharedDecodeCtx: AudioContext | null = null;
function getDecodeAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedDecodeCtx) {
    const Ctor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctor) {
      sharedDecodeCtx = new Ctor();
    }
  }
  return sharedDecodeCtx;
}

/**
 * Performs Synchronized Overlap-Add (WSOLA) time-scale modification followed by
 * 4-point Hermite cubic formant/pitch resampling and chest-resonance filtering.
 *
 * This converts a single-voice TTS stream into distinct, natural-tempo Male
 * (Charon, Fenrir, Orus, Puck, Iapetus) and Female (Kore, Aoede, Leda, Zephyr)
 * character voices without slowing down male speech or speeding up female speech.
 */
function processChannelPitchAndFormants(
  input: Float32Array,
  sampleRate: number,
  pitchRatio: number,
  durationMultiplier: number,
  lowBoostGain: number
): Float32Array {
  // If neutral female voice (Kore: pitchRatio ~ 1.0), return clean copy
  if (
    Math.abs(pitchRatio - 1.0) < 0.015 &&
    Math.abs(durationMultiplier - 1.0) < 0.015 &&
    Math.abs(lowBoostGain) < 0.02
  ) {
    return input;
  }

  const N = input.length;
  if (N < 512) return input;

  // Step 1: WSOLA Time-Stretch by factor `stretchFactor = pitchRatio * durationMultiplier`
  // so that after resampling by `pitchRatio`, the final output length is `N * durationMultiplier`.
  const stretchFactor = Math.max(0.55, Math.min(1.65, pitchRatio * durationMultiplier));
  const stretchedLen = Math.max(256, Math.round(N * stretchFactor));

  const winSize = Math.max(256, Math.round(sampleRate * 0.036)); // 36ms window (~864 samples @ 24kHz)
  const halfWin = Math.floor(winSize / 2); // 50% Hann overlap hop
  const searchDelta = Math.max(32, Math.round(sampleRate * 0.010)); // 10ms phase-lock search tolerance
  const corrLen = Math.max(32, Math.round(sampleRate * 0.008)); // 8ms cross-correlation template

  const hann = new Float32Array(winSize);
  for (let i = 0; i < winSize; i++) {
    const s = Math.sin((Math.PI * i) / (winSize - 1));
    hann[i] = s * s; // sin^2 Hann window sums to 1.0 at 50% overlap
  }

  const stretched = new Float32Array(stretchedLen + winSize);
  const norm = new Float32Array(stretchedLen + winSize);

  let prevAnalysisIdx = 0;
  let outPos = 0;

  // Copy first window directly
  for (let i = 0; i < winSize && i < N; i++) {
    stretched[i] += input[i] * hann[i];
    norm[i] += hann[i];
  }
  outPos += halfWin;

  while (outPos + winSize < stretchedLen) {
    const nominalInPos = Math.round(outPos / stretchFactor);
    const expectedContinuation = prevAnalysisIdx + halfWin;

    // Search around nominalInPos for best phase alignment with expectedContinuation
    let bestOffset = 0;
    if (
      expectedContinuation >= 0 &&
      expectedContinuation + corrLen < N &&
      nominalInPos - searchDelta >= 0 &&
      nominalInPos + searchDelta + winSize < N
    ) {
      let bestScore = -Infinity;
      for (let d = -searchDelta; d <= searchDelta; d += 2) {
        const cand = nominalInPos + d;
        let dot = 0;
        let energy = 1e-7;
        for (let k = 0; k < corrLen; k += 2) {
          const a = input[expectedContinuation + k];
          const b = input[cand + k];
          dot += a * b;
          energy += b * b;
        }
        const score = dot / Math.sqrt(energy);
        if (score > bestScore) {
          bestScore = score;
          bestOffset = d;
        }
      }
    }

    const chosenInPos = Math.max(
      0,
      Math.min(N - winSize - 1, nominalInPos + bestOffset)
    );
    prevAnalysisIdx = chosenInPos;

    for (let i = 0; i < winSize; i++) {
      const w = hann[i];
      stretched[outPos + i] += input[chosenInPos + i] * w;
      norm[outPos + i] += w;
    }

    outPos += halfWin;
  }

  for (let i = 0; i < stretchedLen; i++) {
    if (norm[i] > 1e-4) {
      stretched[i] /= norm[i];
    }
  }

  // Step 2: 4-Point Hermite Cubic Resampling by `pitchRatio`
  // Shifts both F0 (pitch) and vocal-tract formants (F1/F2/F3) for authentic Male vs Female timbre
  const finalLen = Math.max(128, Math.floor((stretchedLen - 4) / pitchRatio));
  const resampled = new Float32Array(finalLen);

  for (let m = 0; m < finalLen; m++) {
    const srcPos = m * pitchRatio;
    const idx = Math.floor(srcPos);
    const frac = srcPos - idx;

    const y0 = stretched[Math.max(0, idx - 1)];
    const y1 = stretched[Math.max(0, Math.min(stretchedLen - 1, idx))];
    const y2 = stretched[Math.max(0, Math.min(stretchedLen - 1, idx + 1))];
    const y3 = stretched[Math.max(0, Math.min(stretchedLen - 1, idx + 2))];

    // Catmull-Rom / Hermite cubic interpolation
    const c0 = y1;
    const c1 = 0.5 * (y2 - y0);
    const c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
    const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);

    resampled[m] = ((c3 * frac + c2) * frac + c1) * frac + c0;
  }

  // Step 3: One-pole chest-resonance low-pass shelf (~175 Hz) for rich male baritone vs crisp female soprano
  if (Math.abs(lowBoostGain) > 0.01) {
    const rc = 1.0 / (2.0 * Math.PI * 175.0);
    const dt = 1.0 / sampleRate;
    const alpha = dt / (rc + dt);
    let lp = 0;
    let peak = 0;

    for (let i = 0; i < finalLen; i++) {
      lp = lp + alpha * (resampled[i] - lp);
      const val = resampled[i] + lowBoostGain * lp;
      resampled[i] = val;
      const abs = Math.abs(val);
      if (abs > peak) peak = abs;
    }

    // Soft limiter if peak exceeds 0.96
    if (peak > 0.96) {
      const scale = 0.95 / peak;
      for (let i = 0; i < finalLen; i++) {
        resampled[i] *= scale;
      }
    }
  }

  return resampled;
}

function encodeFloat32ToWavDataUrl(
  samples: Float32Array,
  sampleRate: number
): string {
  const numSamples = samples.length;
  const pcmByteLen = numSamples * 2;
  const buffer = new ArrayBuffer(44 + pcmByteLen);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + pcmByteLen, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, pcmByteLen, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Applies character-specific Male or Female vocal tract & pitch shaping to a raw TTS audio Data URL
 * when the audio comes from a single-voice fallback stream (`native-sinhala-tts`).
 */
export async function shapeAudioForCharacterVoice(
  rawAudioDataUrl: string,
  profile: PrebuiltVoiceProfile,
  provider?: string
): Promise<string> {
  // If Gemini multi-voice TTS already produced a distinct prebuilt voice, return as-is
  if (provider && provider.startsWith("gemini")) {
    return rawAudioDataUrl;
  }

  // If the profile is default neutral female (Kore), no DSP transformation needed
  if (
    Math.abs(profile.pitchRatio - 1.0) < 0.015 &&
    Math.abs(profile.durationMultiplier - 1.0) < 0.015
  ) {
    return rawAudioDataUrl;
  }

  const ctx = getDecodeAudioContext();
  if (!ctx) return rawAudioDataUrl;

  try {
    const res = await fetch(rawAudioDataUrl);
    const arrayBuf = await res.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));
    const rawChannel = audioBuf.getChannelData(0);

    const shaped = processChannelPitchAndFormants(
      rawChannel,
      audioBuf.sampleRate,
      profile.pitchRatio,
      profile.durationMultiplier,
      profile.lowBoostGain
    );

    return encodeFloat32ToWavDataUrl(shaped, audioBuf.sampleRate);
  } catch {
    return rawAudioDataUrl;
  }
}
