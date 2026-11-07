import { Storybook, StorybookPage } from "../types";

export type AmbientPresetId =
  | "morning-birds"
  | "hearth-clock"
  | "rain-wind"
  | "woodland-stream"
  | "clockwork-chimes";

export interface AmbientSceneProfile {
  id: AmbientPresetId;
  label: string;
  shortTag: string;
  description: string;
}

export const AMBIENT_PROFILES: Record<AmbientPresetId, AmbientSceneProfile> = {
  "morning-birds": {
    id: "morning-birds",
    label: "Garden Songbirds & Casement Breeze",
    shortTag: "BIRDS & BREEZE",
    description: "Soft country-house garden birdsong and open-casement morning air",
  },
  "hearth-clock": {
    id: "hearth-clock",
    label: "Crackling Hearth & Mantle Clock",
    shortTag: "CRACKLING FIRE",
    description: "Warm coal-fire crackles and a measured brass pendulum tick",
  },
  "rain-wind": {
    id: "rain-wind",
    label: "Pattering Rain & Moorland Wind",
    shortTag: "RAIN & WIND",
    description: "Gentle rain on leaded glass with low sweeping moorland wind",
  },
  "woodland-stream": {
    id: "woodland-stream",
    label: "Rustling Leaves & Subterranean Draft",
    shortTag: "WOODLAND & STREAM",
    description: "Breezy meadow grass, rustling foliage, and distant woodland calls",
  },
  "clockwork-chimes": {
    id: "clockwork-chimes",
    label: "Escapement Ticks & Spun-Glass Resonance",
    shortTag: "CLOCKWORK & AIR",
    description: "Delicate horological escapement pulses and crystalline overtones",
  },
};

/**
 * Maps a Storybook and its active Folio Page's scene metadata
 * (illustrationPrompt, imageCaption, narrativeText, settingFooterRight, mood)
 * to the most fitting ambient soundscape profile.
 */
export function resolveSceneAmbientProfile(
  storybook: Storybook,
  page?: StorybookPage
): AmbientSceneProfile {
  if (page?.ambientSound && page.ambientSound in AMBIENT_PROFILES) {
    return AMBIENT_PROFILES[page.ambientSound as AmbientPresetId];
  }

  const sceneCorpus = [
    page?.imageCaption || "",
    page?.illustrationPrompt || "",
    page?.narrativeText || "",
    storybook.settingFooterRight || "",
    storybook.mood || "",
    storybook.title || "",
  ]
    .join(" ")
    .toLowerCase();

  // 1. Rain / Moor / Fog / Storm / Gothic
  if (
    /\b(rain|storm|moor|fen|mist|fog|thunder|drizzle|wet|umbrella|gothic|hound|baskerville)\b/.test(
      sceneCorpus
    )
  ) {
    return AMBIENT_PROFILES["rain-wind"];
  }

  // 2. Hearth / Fireplace / Smoking-Room / Baker Street / Study / Ember
  if (
    /\b(fire|fireplace|hearth|ember|crackl|smoking-room|study|baker street|holmes|time machine|parlour|parlor|candle|lamp)\b/.test(
      sceneCorpus
    )
  ) {
    return AMBIENT_PROFILES["hearth-clock"];
  }

  // 3. Clockwork / Nightingale / Observatory / Watch / Glass / Gear
  if (
    /\b(clock|clockmaker|watch|gear|pendulum|music box|spun-glass|observatory|astronomer|crystal)\b/.test(
      sceneCorpus
    )
  ) {
    return AMBIENT_PROFILES["clockwork-chimes"];
  }

  // 4. Woodland / Rabbit-Hole / Meadow / Hedge / Alice / Forest / Brook
  if (
    /\b(rabbit|burrow|wonderland|alice|hedge|forest|wood|tree|tunnel|brook|stream|dormouse|bramble)\b/.test(
      sceneCorpus
    )
  ) {
    return AMBIENT_PROFILES["woodland-stream"];
  }

  // 5. Default to Regency Morning Room / Garden Birds & Breeze (Longbourn, Tom Sawyer, etc.)
  return AMBIENT_PROFILES["morning-birds"];
}

class ProceduralAmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeProfileId: AmbientPresetId | null = null;
  private isRunning = false;
  private targetVolume = 0.75; // 0..1 user mixer level
  private timers: number[] = [];
  private activeNodes: AudioNode[] = [];

  public setVolume(level: number): void {
    this.targetVolume = Math.max(0, Math.min(1, level));
    if (this.masterGain && this.ctx) {
      const gainVal = Math.max(0.0001, this.targetVolume * 0.24);
      this.masterGain.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 0.08);
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createPinkNoiseBuffer(ctx: AudioContext, durationSec = 4): AudioBuffer {
    const bufferSize = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  public start(profile: AmbientSceneProfile): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (this.isRunning && this.activeProfileId === profile.id) {
      return;
    }

    this.stop();
    this.isRunning = true;
    this.activeProfileId = profile.id;

    const master = ctx.createGain();
    const targetGain = Math.max(0.001, this.targetVolume * 0.24);
    master.gain.setValueAtTime(0.001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(targetGain, ctx.currentTime + 0.8);
    master.connect(ctx.destination);
    this.masterGain = master;
    this.activeNodes.push(master);

    const noiseBuffer = this.createPinkNoiseBuffer(ctx, 5);

    if (profile.id === "hearth-clock") {
      // Warm low hearth rumble
      this.startFilteredNoiseBed(ctx, master, noiseBuffer, "lowpass", 240, 0.28);

      // Periodic fire crackle bursts
      const crackleTimer = window.setInterval(() => {
        if (!this.isRunning || !this.ctx) return;
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          const delay = Math.random() * 0.35;
          this.triggerCracklePop(ctx, master, delay);
        }
      }, 420);
      this.timers.push(crackleTimer);

      // Subtle mantle clock tick every 1.0s
      const clockTimer = window.setInterval(() => {
        if (!this.isRunning || !this.ctx) return;
        this.triggerClockTick(ctx, master, 1100, 0.025);
      }, 1000);
      this.timers.push(clockTimer);
    } else if (profile.id === "morning-birds") {
      // Gentle open-window air bed
      this.startFilteredNoiseBed(ctx, master, noiseBuffer, "bandpass", 520, 0.08);

      // Immediate subtle bird note so user hears feedback right away
      this.triggerBirdPhrase(ctx, master);

      // Periodic songbird chirps
      const birdTimer = window.setInterval(() => {
        if (!this.isRunning || !this.ctx) return;
        if (Math.random() < 0.78) {
          this.triggerBirdPhrase(ctx, master);
        }
      }, 2400);
      this.timers.push(birdTimer);
    } else if (profile.id === "rain-wind") {
      // Steady rain patter bed
      this.startFilteredNoiseBed(ctx, master, noiseBuffer, "bandpass", 1350, 0.22);
      // Deep moorland wind swell
      this.startFilteredNoiseBed(ctx, master, noiseBuffer, "lowpass", 310, 0.25);

      // Soft raindrop taps on casement glass
      const dropTimer = window.setInterval(() => {
        if (!this.isRunning || !this.ctx) return;
        this.triggerRaindrop(ctx, master);
      }, 280);
      this.timers.push(dropTimer);
    } else if (profile.id === "woodland-stream") {
      // Babbling stream + rustling leaves bed
      this.startFilteredNoiseBed(ctx, master, noiseBuffer, "bandpass", 680, 0.16);

      this.triggerBirdPhrase(ctx, master);
      const woodlandTimer = window.setInterval(() => {
        if (!this.isRunning || !this.ctx) return;
        if (Math.random() < 0.65) {
          this.triggerBirdPhrase(ctx, master);
        }
      }, 2900);
      this.timers.push(woodlandTimer);
    } else if (profile.id === "clockwork-chimes") {
      // Soft room tone
      this.startFilteredNoiseBed(ctx, master, noiseBuffer, "lowpass", 380, 0.07);

      // Double-beat escapement tick (2.5 Hz)
      const tickTimer = window.setInterval(() => {
        if (!this.isRunning || !this.ctx) return;
        this.triggerClockTick(ctx, master, 1850, 0.03);
        window.setTimeout(() => {
          if (this.isRunning && this.ctx) {
            this.triggerClockTick(ctx, master, 2250, 0.02);
          }
        }, 190);
      }, 500);
      this.timers.push(tickTimer);

      // Occasional spun-glass harmonic chime
      this.triggerGlassHarmonic(ctx, master);
      const chimeTimer = window.setInterval(() => {
        if (!this.isRunning || !this.ctx) return;
        this.triggerGlassHarmonic(ctx, master);
      }, 3600);
      this.timers.push(chimeTimer);
    }
  }

  private startFilteredNoiseBed(
    ctx: AudioContext,
    dest: AudioNode,
    buffer: AudioBuffer,
    filterType: BiquadFilterType,
    freq: number,
    gainVal: number
  ): void {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, ctx.currentTime);
    filter.Q.setValueAtTime(0.9, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start();

    this.activeNodes.push(src, filter, gain);
  }

  private triggerCracklePop(ctx: AudioContext, dest: AudioNode, delaySec: number): void {
    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(900 + Math.random() * 1600, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1600, now);

    const amp = 0.04 + Math.random() * 0.06;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(amp, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  private triggerClockTick(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    amp: number
  ): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + 0.02);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(amp, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  private triggerBirdPhrase(ctx: AudioContext, dest: AudioNode): void {
    const notes = 2 + Math.floor(Math.random() * 2);
    const baseFreq = 2100 + Math.random() * 850;

    for (let i = 0; i < notes; i++) {
      const start = ctx.currentTime + i * 0.16;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const f1 = baseFreq + (i % 2 === 0 ? 0 : 320);
      const f2 = f1 + (Math.random() > 0.4 ? 420 : -260);
      osc.frequency.setValueAtTime(f1, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1200, f2), start + 0.11);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.035, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(start);
      osc.stop(start + 0.13);
    }
  }

  private triggerRaindrop(ctx: AudioContext, dest: AudioNode): void {
    const now = ctx.currentTime + Math.random() * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const freq = 950 + Math.random() * 900;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.025);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.022, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  private triggerGlassHarmonic(ctx: AudioContext, dest: AudioNode): void {
    const scale = [1046.5, 1174.66, 1318.51, 1567.98, 1760.0];
    const freq = scale[Math.floor(Math.random() * scale.length)];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 1.45);
  }

  public stop(): void {
    this.isRunning = false;
    this.activeProfileId = null;

    for (const id of this.timers) {
      window.clearInterval(id);
      window.clearTimeout(id);
    }
    this.timers = [];

    for (const node of this.activeNodes) {
      try {
        if ("stop" in node && typeof (node as AudioScheduledSourceNode).stop === "function") {
          (node as AudioScheduledSourceNode).stop();
        }
      } catch {}
      try {
        node.disconnect();
      } catch {}
    }
    this.activeNodes = [];
    this.masterGain = null;
  }
}

export const ambientSoundEngine = new ProceduralAmbientEngine();
