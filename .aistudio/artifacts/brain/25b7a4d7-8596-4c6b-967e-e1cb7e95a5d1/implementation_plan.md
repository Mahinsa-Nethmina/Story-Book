# Reader Keyboard Shortcuts Leaf & Footer Trigger

This plan introduces a fine-press Keyboard Shortcuts modal ("Reader's Key & Foliation Guide") in Reader mode, triggered either by a new `SHORTCUTS (?)` button in the outer footer margin bar or by pressing `?` on the keyboard, along with expanded single-key shortcuts for controlling playback, plates, and chamber music.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design and functional choices were confirmed during Phase 1 clarification:

- **Confirmed Decision 1 — Expanded Reader Shortcuts Scope**: Alongside `Space` (play/pause narration) and `← / → / ↑ / ↓` (navigate turns and folios), the Reader keyboard handler will support `?` (toggle the Keyboard Shortcuts modal), `Esc` (close any open modal leaf), `M` (toggle the Lyria 3.5 chamber score), and `P` (cycle through the current folio's illustration plates).
- **Confirmed Decision 2 — Fine-Press Archival Leaf Styling & Footer Trigger**: The modal will match the archival paper (`#F6F2EA`), double hairline border (`1px solid #D5CBB8`), Cinzel tracked headings, Cormorant Garamond display title, and JetBrains Mono keycap notation used across the edition's Title Leaf and Colophon overlays, triggered via a `SHORTCUTS (?)` button in the Reader footer margin bar.

---

## 1. Overview & Core Concept

- **What It Does**: Provides readers with an on-demand, typographically authentic reference leaf listing all keyboard commands available during dramatized audiobook playback and folio inspection, while wiring the new quick-action keys (`?`, `Esc`, `M`, `P`) into the Reader keyboard listener.
- **Target Audience / Persona**: Readers and listeners exploring illustrated literary folios who want effortless keyboard-driven control over multi-voice narration, folio turn navigation, plate inspection, and chamber music.
- **Key Value**: Makes existing and new keyboard navigation discoverable directly from the Reader footer bar without breaking the 1810s fine-press book aesthetic.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Footer Trigger**: While in Reader mode (`viewMode === "reader"`), the bottom-right margin bar (`austen-margin-bar`) displays `TITLE LEAF · COLOPHON · SHORTCUTS (?)`. Clicking `SHORTCUTS (?)` opens the Keyboard Shortcuts Leaf modal.
  2. **Keyboard Toggle (`?` & `Esc`)**: Pressing `?` (or `Shift + /`) anywhere in Reader mode (when not focused in an input) toggles the Keyboard Shortcuts modal open or closed. Pressing `Esc` closes whichever modal leaf (`Title Leaf`, `Colophon`, or `Shortcuts`) is currently open.
  3. **Direct Action Shortcuts**: Pressing `Space` pauses/resumes narration; `↓` or `→` advances to the next dialogue turn or folio; `↑` or `←` returns to the previous dialogue turn or folio; `M` toggles the background chamber score; and `P` cycles the active illustration plate on the left-hand page.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Archival fine-press editorial catalog leaf matching the existing `Title Leaf` and `Colophon` sheets.
  - *Color Palette & Mood*: Warm archival paper surface (`var(--folio-paper)`, `#F6F2EA`), subtle matted card fills (`var(--folio-card)`, `#EFE9DC`), deep charcoal ink (`var(--folio-ink)`, `#1E1B18`), muted warm stone metadata (`var(--folio-muted)`, `#7A7267`), forest sage accents (`var(--folio-accent)`, `#4A6B53`), and 1px hairline rules (`var(--folio-rule)`, `#D5CBB8`).
  - *Typography & Hierarchy*:
    - Section Kicker & Category Rubrics: `Cinzel` (`12px`, `0.129em` letter-spacing, uppercase).
    - Modal Headline: `Cormorant Garamond` (`32px`, weight `500`).
    - Shortcut Descriptions: `EB Garamond` (`18px` body prose and italic notes).
    - Keycap Notation: `JetBrains Mono` (`12px`, tabular alignment) rendered on subtle `#EFE9DC` archival card keycaps with `1px solid #D5CBB8` hairline borders.
  - *Component Styling & Layout*: Double-ruled outer/inner archival frame (`maxWidth: 680px`) organized into two balanced editorial groups (*Narration & Folio Navigation* and *Plates, Score & Reference Leaves*) with dotted typographic leaders connecting each keycap combination to its action description.
- **Interactive Feedback & Motion**: Clicking the backdrop, clicking `CLOSE ×`, or pressing `Esc` dismisses the modal immediately; pressing `M` or `P` in Reader mode updates the footer state and shows a brief italic status note confirming the action.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Unified Modal Escape & Guard Logic**
  - *Chosen Approach*: Allow `Esc` to close any active modal (`showTitleCardModal`, `showAgentSpecModal`, or `showShortcutsModal`) and allow `?` to toggle `showShortcutsModal`, while preventing navigation/playback shortcuts from firing when a modal is open or an input element is focused.
  - *Why*: Prevents accidental folio jumps or audio toggles while the user is inspecting the Colophon or reading the Shortcuts guide.
  - *Alternatives Considered*: Keeping navigation keys active behind open modals, which can disorient the user when the underlying folio changes unexpectedly.
- **Decision 2 — Editorial Keycap Presentation Over Generic Pill Badges**
  - *Chosen Approach*: Style keyboard keys using squared-off `JetBrains Mono` archival keycaps (`background: var(--folio-card)`, `border: 1px solid var(--folio-rule)`, `padding: 2px 8px`) paired with dotted leaders (`.folio-contents-leader`) rather than rounded pill badges.
  - *Why*: Preserves strict zero-pill discipline and harmonizes with the Table of Contents leader rows on the home spread.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         Reader View (App.tsx)                             │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Window Keydown Listener (useEffect)                                 │  │
│  │  • Esc        ──► Closes Title Leaf / Colophon / Shortcuts Modal    │  │
│  │  • ?          ──► Toggles showShortcutsModal                        │  │
│  │  • Space      ──► handleToggleNarration()                           │  │
│  │  • → / ↓      ──► seekToFolioAndTurn(nextTurnOrFolio)               │  │
│  │  • ← / ↑      ──► seekToFolioAndTurn(prevTurnOrFolio)               │  │
│  │  • M / m      ──► handleToggleChamberMusic()                        │  │
│  │  • P / p      ──► handleCyclePlate()                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                     │
│                                     ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Outer Footer Margin Bar (.austen-margin-bar)                        │  │
│  │  [Left Controls: Pause/Resume · Live TTS · Cycle Plate · Engrave]   │  │
│  │  [Right Controls: Prev/Next Folio · TITLE LEAF · COLOPHON ·         │  │
│  │                   SHORTCUTS (?)] ──► sets showShortcutsModal(true)  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                     │
│                                     ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Leaf Overlay 3: Keyboard Shortcuts Modal (showShortcutsModal)       │  │
│  │  • Double-bordered #F6F2EA sheet with Cinzel/Cormorant header       │  │
│  │  • Structured shortcut rows with JetBrains Mono keycaps & leaders   │  │
│  │  • Backdrop click / CLOSE × button / Esc key dismissal              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `showShortcutsModal: boolean` — Controls visibility of the Keyboard Shortcuts Leaf modal in `App`.
  - `READER_KEYBOARD_SHORTCUTS` — Structured constant array defining each shortcut's `keys` (e.g., `["Space"]`, `["→", "↓"]`, `["←", "↑"]`, `["P"]`, `["M"]`, `["?"]`, `["Esc"]`), `label`, and `detail` grouped by function.
- **Interactive Component & State Mapping**:
  - `SHORTCUTS (?)` footer button (`onClick={() => setShowShortcutsModal(true)}`): Opens the shortcuts modal leaf.
  - `handleToggleChamberMusic`: Toggles `isMusicEnabled`, pauses or resumes `getMusicAudioEl()`, and displays a brief status note (`"Chamber score enabled"` / `"Chamber score muted"`).
  - Global `keydown` listener: Checks `e.key === "Escape"` first to dismiss any open modal (`showShortcutsModal`, `showTitleCardModal`, `showAgentSpecModal`), checks `e.key === "?"` to toggle `showShortcutsModal`, and routes `m`/`M` and `p`/`P` when in Reader mode with no modal open.
