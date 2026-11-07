# The Folio & Voice Press — Illustrated Audio Storybooks

An autonomous, fine-press **Illustrated Audio Storybook Library & Literary Studio** built with React 19, TypeScript, Express, and the **Google Gemini API (`@google/genai`)**.

Inspired by 19th-century archival fine-press editions and traditional Sri Lankan *Puskola Potha* (palm-leaf manuscripts) & Kandyan *Sittara* art, **The Folio & Voice Press** presents dramatized audiobooks as a tactile two-page open-book folio spread with synchronized 3-state paragraph ink highlighting, multi-voice dialogue narration, 3D pop-up diorama plates, acoustic chamber scores, and an interactive literary reader.

---

## ✨ Key Features

### 1. Pre-Bound Literary Library (World Classics & Categorized Sri Lankan Sinhala Literature)
Open and auto-narrate nine complete, multi-folio illustrated editions directly from the Table of Contents:

#### 🌍 World Classics (Volumes I – V)
- **Book I — *Pride and Prejudice* (1813)** by Jane Austen · *Regency Social Satire* (Longbourn Morning Room)
- **Book II — *Alice’s Adventures in Wonderland* (1865)** by Lewis Carroll · *Victorian Literary Nonsense* (The Riverbank & The Mad Tea-Party)
- **Book III — *The Adventures of Sherlock Holmes* (1892)** by Arthur Conan Doyle · *Gaslight Detective Fiction* (221B Baker Street)
- **Book IV — *Frankenstein; or, The Modern Prometheus* (1818)** by Mary Shelley · *Romantic Gothic Science Fiction* (Ingolstadt Laboratory)
- **Book V — *Twenty Thousand Leagues Under the Seas* (1870)** by Jules Verne · *Scientific Maritime Romance* (Salon of the *Nautilus*)

#### 🇱🇰 ශ්‍රී ලාංකික සිංහල කතා · Categorized Sri Lankan Sinhala Stories (Volumes VI – IX)
Organized into three traditional Sri Lankan literary categories on the Cover Page:
- **ජනකතා · Village Folk Wisdom (Traditional Sinhala Village Folktales)**
  - **Book VI — *මහදැනමුත්තා (Mahadenamutta)*** · *එළුවා සහ මුට්ටිය · The Goat & The Clay Pot*
  - **Book VII — *අන්දරේ සීනි කෑ හැටි (Andare & The Royal Sugar)*** · *රාජවාසලේ සුදු වැලි · The White Sand of the Palace*
- **නවකතා සම්භාව්‍ය · Modern Literary Classics (20th-Century Sri Lankan Fiction)**
  - **Book VIII — *මඩොල් දූව (Madol Doova, 1947)*** by Martin Wickramasinghe · *කොග්ගල කලපුවෙන් මඩොල් දූවට · Across the Koggala Lagoon*
- **ජාතක සහ කාව්‍ය · Classical Jataka & Poetry (Classical Buddhist Poetic Literature)**
  - **Book IX — *ගුත්තිල කාව්‍යය (Guttila Jatakaya, 1470)*** by Venerable Wättäwe Thero · *සත්තන්ත්‍රී වීණාව · The Seven-Stringed Veena*

---

### 2. Fine-Press Two-Page Open-Book Reader
- **3-State Synchronized Paragraph Ink**:
  - **Upcoming Turns (`state-future`)**: Set in 38% muted ink prior to being spoken.
  - **Currently Spoken Turn (`state-active`)**: Highlighted at 100% full archival ink with small-caps speaker rubric (`MR. BENNET`, `ELIZABETH`, `මහදැනමුත්තා`, `අන්දරේ`, etc.).
  - **Completed Turns (`state-past`)**: Settles warmly into 50% ink after narration passes.
- **3D Spine-Hinged Page Turns & Pop-Up Diorama Unfolds**: Smooth perspective page-turn transitions between scenes and right-page crossfades within multi-folio scenes.
- **Interactive Chapter Scrubber Bar**: Click anywhere along the right-page footer progress rule to scrub directly to any timestamp, folio, and dialogue turn.
- **Full-Screen Plate Lightbox & Zoom Loupe (`Zoom Plate`)**: Inspect 16:9 watercolour plates, 3D pop-up dioramas, and character reference sheets at `1×`, `1.5×`, `2×`, and `2.5×` magnification.
- **Scrollable Character Cast Strip & Dramatis Personae Bios**: Displays portrait thumbnails beneath the Reader margin bar for characters appearing in the active folio, with live speaking indicators and expandable biography leaves.
- **Interactive *Marginalia* & Period Glossary**: Dotted-underline literary and cultural terms (both English period vocabulary and Sinhala cultural terms such as *පුස්කොළ පොත*, *මහදැනමුත්තා*, *අන්දරේ*, *මඩොල් දූව*, and *සත්තන්ත්‍රී වීණාව*) open an inline glossary note card when clicked.
- **Commonplace Book (`Saved`)**: Hover over any paragraph turn and click the bookmark ribbon icon to save favorite passages to your persistent Commonplace Book (`localStorage`) with one-click jump back to the exact volume, folio, and turn.
- **Daylight / Candlelight / Midnight Reading Modes (`Light: Day / Candle / Night`)**: Cycle between **Daylight Cream** (`#F6F2EA`), **Candlelight Amber** (warm evening sepia), and **Midnight Vellum** (low-glare dark mode).
- **Reader Typography Switcher (`Font:`)**: Switch body text on the fly between **Classic Garamond**, **Clean Modernist**, and **Typewriter Mono**.
- **Session Folio Breadcrumb History (`History:`)**: Jump back to any previously visited folio across volumes during your reading session.
- **Archival PDF Folio Exporter (`PDF`)**: Generates and downloads a formatted multi-page archival PDF of the active storybook, complete with plates, speaker rubrics, and colophon metadata.

---

### 3. Multi-Voice Audio, Sinhala TTS (`si-LK`), & Procedural Ambient Engine
- **Playback Speed & 3-Channel Audio Mixer (`Mixer (1×)`)**:
  - Adjust narration cadence (`0.85×`, `1.0×`, `1.15×`, `1.25×`).
  - Independently mix **Voice**, **Chamber Score**, and **Ambient Sound** volume levels in real time.
- **Sinhala (`si-LK`) & Multilingual TTS Support**:
  - **Gemini 24 kHz Native Audio TTS (`24kHz TTS` button)**: Synthesizes high-clarity 24 kHz WAV narration for Sinhala and English folios via the backend `/api/tts` endpoint.
  - **Automatic `si-LK` Utterance Detection**: Detects Sinhala Unicode (`\u0D80–\u0DFF`) in real time and configures Web Speech synthesis with `lang = "si-LK"` and native Sinhala `ttsText`.
- **Web Audio Procedural Ambient Soundscape (`Ambient`)**:
  - Zero-dependency Web Audio API synthesizer that generates scene-matched ambient backdrops (hearth fire crackle for Regency drawing rooms, riverside birdsong for *Wonderland*, rain and horse hooves on Baker Street cobbles, electrostatic lab hum for *Frankenstein*, deep-sea hydrophone resonance for the *Nautilus*, and tropical lagoon breeze & crickets for Sri Lankan folios).

---

### 4. Commission a New Edition ("Book VI" Managed Agent Pipeline)
Inscribe any fairytale, literary chapter, or original prompt on the right-hand **Commission Folio** to launch a 5-stage autonomous production pipeline:
1. **Stage I · Sandbox & `gemini-api-cli`**: Provisions the Managed Agent container and workspace.
2. **Stage II · Dramaturgy & Folio Spec**: Adapts the prompt into balanced folios of narration and character dialogue turns with period character descriptions.
3. **Stage III · Archival Plates & Diorama**: Paints a 16:9 character reference sheet and scene plates on `#F6F2EA` cream paper.
4. **Stage IV · Multi-Voice Performance**: Synthesizes distinct 24 kHz character and narrator voices.
5. **Stage V · Chamber Score & Binding**: Binds all folios, plates, and audio into the interactive open-book spread.

---

## ⌨️ Reader Keyboard Shortcuts

| Key | Action | Description |
| :--- | :--- | :--- |
| `Space` | **Pause / Play** | Toggles synchronized multi-voice narration |
| `→` or `↓` | **Next Turn / Folio** | Advances to the next dialogue turn or turns the folio page |
| `←` or `↑` | **Previous Turn / Folio** | Returns to the preceding dialogue turn or prior folio |
| `P` | **Cycle Plate** | Switches between 3D diorama, watercolour plate, and character sheet |
| `M` | **Toggle Chamber Score** | Mutes or unmutes the background chamber music |
| `A` | **Toggle Ambient Sound** | Enables or mutes the procedural Web Audio scene soundscape |
| `?` | **Shortcuts Guide** | Opens the Reader's Key & Foliation Guide modal |
| `Esc` | **Dismiss Overlay** | Closes any open modal leaf, marginalia note, or character bio |

---

## 🗂️ Project Structure

```text
├── agent/                          # Managed Agent skill & classic-audiobooks pipeline scripts
│   ├── AGENTS.md                   # System instructions mounted inside the agent workspace
│   └── .agents/skills/             # Dramaturgy, illustration, TTS, and video/folio rendering skills
├── server/
│   └── managedAgentProxy.ts        # Express proxy routes for Gemini Interactions, Image Gen, & 24kHz TTS
├── src/
│   ├── data/
│   │   ├── presets.ts              # Volumes I–V (World Classics), palettes, voices, & commission seeds
│   │   └── sinhalaStories.ts       # Volumes VI–IX (Categorized Sri Lankan Sinhala storybooks & SVG plates)
│   ├── services/
│   │   ├── ambientSoundService.ts  # Procedural Web Audio API soundscape generator
│   │   ├── characterCastService.ts # Folio character cast resolver & curated literary biographies
│   │   ├── folioExporter.ts        # Archival PDF folio generator
│   │   ├── inlineAgentBundle.ts    # Bundled agent workspace files & CLI bootstrap commands
│   │   ├── marginaliaService.ts    # Period glossary annotations & Daylight/Candlelight/Midnight palettes
│   │   └── storybookAgentService.ts# Client service for commissioning storybooks, plates, & 24kHz WAV TTS
│   ├── App.tsx                     # Main open-book spread UI (Cover, Crafting, and Reader views)
│   ├── index.css                   # Archival paper theme, typography, & open-book folio geometry
│   ├── main.tsx                    # React application entry point
│   └── types.ts                    # TypeScript interfaces for Storybooks, Folios, Plates, and Characters
├── test/                           # Node.js test suite
├── .env.example                    # Environment variable template
├── index.html                      # HTML entry point with Google Fonts (Cormorant, EB Garamond, Cinzel)
├── package.json                    # Project dependencies and scripts
├── server.ts                       # Full-stack Express + Vite middleware server (port 3000)
└── vite.config.ts                  # Vite bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** `>= 20.x` (or **Bun** `>= 1.1`)
- A **Google Gemini API Key** (`GEMINI_API_KEY`)

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd storybook-managed-agent
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and add your Gemini API key:
```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run in Development Mode
Starts the Express backend and Vite frontend on `http://localhost:3000`:
```bash
npm run dev
```

### 4. Typecheck, Test & Production Build
```bash
# Run TypeScript type checking
npm run lint

# Build production frontend bundle
npm run build

# Run unit tests
npm test
```

---

## 📜 License

Crafted for **The Folio & Voice Press (MMXXVI)**. Released under the MIT License.
