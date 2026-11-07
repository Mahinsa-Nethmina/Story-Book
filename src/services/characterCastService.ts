import { CharacterVoice, Storybook, StorybookPage } from "../types";

export interface FolioCastMember {
  id: string;
  name: string;
  role: string;
  voiceName: string;
  voiceStyle: string;
  shortTitle: string;
  bio: string;
  dramaticNote: string;
  portraitImageUrl: string;
  portraitObjectPosition: string;
  portraitScale: number;
  turnsInFolio: number;
  firstTurnIdx: number;
  sampleQuote: string | null;
  appearsByDialogue: boolean;
  appearsByMention: boolean;
}

interface CuratedCharacterMeta {
  shortTitle: string;
  bio: string;
  dramaticNote: string;
  portraitObjectPosition: string;
  portraitScale: number;
  useScenePlateIdx?: number;
  aliases?: string[];
}

const CURATED_CHARACTER_BIOS: Record<string, CuratedCharacterMeta> = {
  // Book I: Pride and Prejudice (Jane Austen, 1813)
  austen_narrator: {
    shortTitle: "Omniscient Regency Chronicler",
    bio: "The poised, dryly ironic narrative voice of Jane Austen’s 1813 novel, observing the social ambitions and domestic sparring of Hertfordshire country gentry with measured wit and epigrammatic precision.",
    dramaticNote:
      "Opens the chapter with the immortal maxim on single men of good fortune before framing the morning-room exchange at Longbourn.",
    portraitObjectPosition: "50% 30%",
    portraitScale: 1.45,
    useScenePlateIdx: 1,
  },
  mrs_bennet: {
    shortTitle: "Matriarch of Longbourn Estate",
    bio: "Wife of Mr. Bennet and tireless mother of five unmarried daughters. A woman of “mean understanding, little information, and uncertain temper,” whose sole business in life is to see her girls advantageously married.",
    dramaticNote:
      "Bursts into the Longbourn morning room brimming with breathless intelligence that Netherfield Park has been let to Mr. Bingley of the north of England.",
    portraitObjectPosition: "27% 20%",
    portraitScale: 2.1,
    aliases: ["Mrs. Bennet", "his lady", "my dear Mr. Bennet"],
  },
  mr_bennet: {
    shortTitle: "Master of Longbourn · Hertfordshire Gentleman",
    bio: "A quick-witted country gentleman combining “quick parts, sarcastic humour, reserve, and caprice.” Fond of the quiet refuge of his library, he finds his chief amusement in gentlybaiting his wife’s matchmaking zeal.",
    dramaticNote:
      "Affects maddening indifference toward the arrival of Mr. Bingley while secretly preparing to pay the first formal visit to Netherfield.",
    portraitObjectPosition: "73% 20%",
    portraitScale: 2.1,
    aliases: ["Mr. Bennet", "Bennet"],
  },

  // Book II: The Hound of the Baskervilles (Arthur Conan Doyle, 1902)
  dr_watson: {
    shortTitle: "Medical Biographer & Companion at 221B",
    bio: "Dr. John H. Watson, former Army surgeon and steadfast chronicler of Sherlock Holmes’s investigations. Observant and practical, he examines Dr. Mortimer’s forgotten walking-stick in the Baker Street sitting-room.",
    dramaticNote:
      "Attempts to apply Holmes’s deductive methods to the silver-banded Penang lawyer cane inscribed “To James Mortimer, M.R.C.S., from his friends of the C.C.H.”",
    portraitObjectPosition: "28% 20%",
    portraitScale: 2.05,
    aliases: ["Dr. Watson", "Watson", "I stood upon the hearth-rug"],
  },
  sherlock_holmes: {
    shortTitle: "Consulting Detective of Baker Street",
    bio: "The razor-sharp consulting detective of 221B Baker Street. Seated at a late breakfast table with his back turned, he discerns Watson’s examination of the visitor’s stick entirely from its reflection in the polished silver coffee-pot.",
    dramaticNote:
      "Challenges Watson to reconstruct the character and habits of their unknown Devonshire visitor from the battered walking-stick alone.",
    portraitObjectPosition: "72% 20%",
    portraitScale: 2.05,
    aliases: ["Sherlock Holmes", "Holmes"],
  },

  // Book III: Alice's Adventures in Wonderland (Lewis Carroll, 1865)
  carroll_narrator: {
    shortTitle: "Golden-Afternoon Storybook Chronicler",
    bio: "The gentle, wondering voice of Lewis Carroll’s 1865 tale, following a drowsy riverbank daydream as it tips seamlessly into the upside-down logic of Wonderland.",
    dramaticNote:
      "Guides the listener from the daisy-strewn Oxfordshire riverbank down the cupboard-lined well into the lamp-lit subterranean hall.",
    portraitObjectPosition: "50% 32%",
    portraitScale: 1.45,
    useScenePlateIdx: 1,
  },
  alice: {
    shortTitle: "Curious Seven-Year-Old Daydreamer",
    bio: "An imaginative, polite, and resolutely curious child who questions the utility of books “without pictures or conversations” and follows a waistcoat-wearing rabbit straight down a deep burrow without a moment’s calculation.",
    dramaticNote:
      "Muses aloud during her long, slow descent past marmalade jars, wondering whether she will fall right through the earth to the Antipathies.",
    portraitObjectPosition: "28% 22%",
    portraitScale: 2.05,
    aliases: ["Alice"],
  },
  white_rabbit: {
    shortTitle: "Herald of the Wonderland Court",
    bio: "An anxious, impeccably dressed White Rabbit with pink eyes, a waistcoat-pocket, and a ticking pocket-watch. Forever terrified of keeping the Duchess waiting, he unwittingly lures Alice into Wonderland.",
    dramaticNote:
      "Mutters “Oh dear! Oh dear! I shall be late!” while hurrying across the sunny meadow and vanishing down the rabbit-hole.",
    portraitObjectPosition: "72% 24%",
    portraitScale: 2.05,
    aliases: ["White Rabbit", "Rabbit"],
  },

  // Book IV: The Time Machine (H. G. Wells, 1895)
  wells_narrator: {
    shortTitle: "Mr. Hillyer · Thursday-Evening Guest",
    bio: "An observant guest at the Time Traveller’s Richmond dinner table, recording the firelit smoking-room debate as their host unveils the principles of the Fourth Dimension.",
    dramaticNote:
      "Describes the incandescent silver lilies, the bubbling glasses, and the flushed intensity of the Time Traveller’s opening lecture.",
    portraitObjectPosition: "50% 28%",
    portraitScale: 1.5,
    useScenePlateIdx: 1,
  },
  time_traveller: {
    shortTitle: "Inventor & Philosopher of the Fourth Dimension",
    bio: "A brilliant, restless Victorian physicist and natural philosopher with keen grey eyes. In his firelit smoking-room, he overturns conventional Euclidean geometry by demonstrating that Time is simply the Fourth Dimension of space.",
    dramaticNote:
      "Expounds how no cube can have a real existence without duration in Time, preparing his skeptical guests for his experimental machine.",
    portraitObjectPosition: "28% 20%",
    portraitScale: 2.05,
    aliases: ["Time Traveller", "Traveller"],
  },
  filby: {
    shortTitle: "Argumentative Red-Haired Skeptic",
    bio: "“An argumentative person with red hair” among the Time Traveller’s circle of guests. Quick to bristle at speculative paradoxes, he refuses to accept a mathematical abstraction on mere assertion.",
    dramaticNote:
      "Interrupts the geometric thesis early in the smoking-room discussion, demanding tangible proof of a four-dimensional solid.",
    portraitObjectPosition: "72% 20%",
    portraitScale: 2.05,
    aliases: ["Filby"],
  },
  psychologist: {
    shortTitle: "Empirical Scholar of Consciousness",
    bio: "A calm, analytical member of the smoking-room gathering who bridges the Time Traveller’s physical postulate with the human mind’s movement of consciousness along the timeline.",
    dramaticNote:
      "Concurs that duration is indispensable to physical existence and weighs the implications of moving freely through Time.",
    portraitObjectPosition: "50% 24%",
    portraitScale: 1.75,
    useScenePlateIdx: 0,
    aliases: ["Psychologist"],
  },

  // Book V: The Adventures of Tom Sawyer (Mark Twain, 1876)
  aunt_polly: {
    shortTitle: "Mistress of the St. Petersburg Cottage",
    bio: "Tom Sawyer’s warm-hearted yet perpetually exasperated aunt in St. Petersburg, Missouri. She wears her “state pair” of spectacles for style rather than service and struggles between biblical duty and tender affection for her nephew.",
    dramaticNote:
      "Calls out across the quiet cottage, discovers Tom’s jam-stained hands in the closet, and loses her switch when he tricks her into looking behind her.",
    portraitObjectPosition: "28% 20%",
    portraitScale: 2.05,
    aliases: ["Aunt Polly", "old lady"],
  },
  twain_narrator: {
    shortTitle: "Mississippi River Town Chronicler",
    bio: "Mark Twain’s dry, affectionate storytelling voice, capturing sun-drenched 1840s Missouri boyhood, domestic comedy, and small-town human nature with unhurried warmth.",
    dramaticNote:
      "Paints Aunt Polly’s spectacle-peering search and Tom’s narrow escape over the high board-fence.",
    portraitObjectPosition: "50% 30%",
    portraitScale: 1.45,
    useScenePlateIdx: 1,
  },
  tom_sawyer: {
    shortTitle: "Chief Troublemaker of St. Petersburg",
    bio: "An endlessly inventive, nimble-footed boy with a weakness for damson jam and hooky on warm afternoons. Even when caught red-handed by the jacket, his quick tongue and theatrical diversion save him from the switch.",
    dramaticNote:
      "Emerges sheepishly from the pantry closet with jam around his mouth before shouting “Look behind you, aunt!” and vaulting the fence.",
    portraitObjectPosition: "72% 22%",
    portraitScale: 2.05,
    aliases: ["Tom Sawyer", "Tom", "TOM"],
  },
};

function normalizeSpeakerKey(raw: string): string {
  return (raw || "")
    .toLowerCase()
    .replace(/\(narrator\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function characterMatchesSpeaker(char: CharacterVoice, speakerRaw: string): boolean {
  const charNorm = normalizeSpeakerKey(char.name);
  const idNorm = normalizeSpeakerKey(char.id);
  const spkNorm = normalizeSpeakerKey(speakerRaw);
  if (!spkNorm) return false;
  if (charNorm === spkNorm || idNorm === spkNorm) return true;
  if (charNorm.includes(spkNorm) || spkNorm.includes(charNorm)) return true;
  if (
    char.role.toLowerCase().includes("narrat") &&
    spkNorm.includes("narrat")
  ) {
    return true;
  }
  return false;
}

/**
 * Resolves the list of characters appearing in the current folio (`currentPageIdx`),
 * enriched with portrait thumbnail crop coordinates, turn counts, sample quotes, and bios.
 */
export function getFolioCharacterCast(
  storybook: Storybook,
  currentPageIdx: number
): FolioCastMember[] {
  const currentPage: StorybookPage | undefined =
    storybook.pages?.[currentPageIdx] || storybook.pages?.[0];
  const characters = storybook.characters || [];
  const lines = currentPage?.dialogueLines || [];
  const fullFolioText = [
    currentPage?.narrativeText || "",
    ...lines.map((l) => `${l.speaker || ""} ${l.speakerLabel || ""} ${l.text || ""}`),
  ].join(" ");

  const charSheetUrl =
    storybook.charSheetImageUrl ||
    currentPage?.plates?.find((p) =>
      (p.plateLabel || "").toUpperCase().includes("CHARACTER")
    )?.imageUrl ||
    currentPage?.imageUrl ||
    storybook.coverImageUrl ||
    "https://www.gstatic.com/aistudio/starter-apps/audio-storybooks/illustrations/01_pride_and_prejudice_char_sheet.jpg";

  const scenePlates = currentPage?.plates || [];

  const members: FolioCastMember[] = characters.map((char, cIdx) => {
    const curated = CURATED_CHARACTER_BIOS[char.id];

    // Count spoken turns and find first turn index in this folio
    let turnsInFolio = 0;
    let firstTurnIdx = -1;
    let sampleQuote: string | null = null;

    lines.forEach((line, lIdx) => {
      const spk = line.speaker || line.speakerLabel || "";
      if (
        characterMatchesSpeaker(char, spk) ||
        (line.voiceName && line.voiceName === char.voiceName && characters.length <= 3)
      ) {
        turnsInFolio += 1;
        if (firstTurnIdx === -1) {
          firstTurnIdx = lIdx;
          sampleQuote = line.text;
        }
      }
    });

    // Check if character is mentioned in the current folio's narrative prose
    const cleanName = char.name.replace(/\s*\(.*?\)\s*/g, "").trim();
    const aliases = curated?.aliases || [cleanName];
    const appearsByMention = aliases.some(
      (alias) =>
        alias.length >= 3 &&
        fullFolioText.toLowerCase().includes(alias.toLowerCase())
    );

    const appearsByDialogue = turnsInFolio > 0;

    // Determine portrait image URL and focal position
    let portraitImageUrl = charSheetUrl;
    if (
      typeof curated?.useScenePlateIdx === "number" &&
      scenePlates[curated.useScenePlateIdx]?.imageUrl
    ) {
      portraitImageUrl = scenePlates[curated.useScenePlateIdx].imageUrl!;
    } else if (
      char.role.toLowerCase().includes("narrat") &&
      scenePlates[1]?.imageUrl
    ) {
      portraitImageUrl = scenePlates[1].imageUrl!;
    }

    const defaultPositions = ["28% 22%", "72% 22%", "50% 28%", "35% 25%"];
    const portraitObjectPosition =
      curated?.portraitObjectPosition ||
      (char.role.toLowerCase().includes("narrat")
        ? "50% 30%"
        : defaultPositions[cIdx % defaultPositions.length]);

    const portraitScale =
      curated?.portraitScale ||
      (char.role.toLowerCase().includes("narrat") ? 1.45 : 2.0);

    const shortTitle =
      curated?.shortTitle ||
      (char.role.toLowerCase().includes("narrat")
        ? `Literary Narrator · ${storybook.title}`
        : `${char.role} · ${storybook.title}`);

    const bio =
      curated?.bio ||
      `${char.description || char.name} in ${storybook.author}’s ${
        storybook.title
      }. Performed in this edition by the ${
        char.voiceName
      } voice with ${char.voiceStyle || "period dramatic inflection"}.`;

    const dramaticNote =
      curated?.dramaticNote ||
      (sampleQuote
        ? `Featured in ${
            currentPage?.folioLabel || `Folio ${currentPageIdx + 1}`
          }: ${sampleQuote.slice(0, 120)}${sampleQuote.length > 120 ? "…" : ""}`
        : `Part of the dramatic ensemble in ${storybook.title} (${
            storybook.settingFooterRight || "Opening Chapter"
          }).`);

    return {
      id: char.id,
      name: char.name,
      role: char.role,
      voiceName: char.voiceName,
      voiceStyle: char.voiceStyle,
      shortTitle,
      bio,
      dramaticNote,
      portraitImageUrl,
      portraitObjectPosition,
      portraitScale,
      turnsInFolio,
      firstTurnIdx,
      sampleQuote,
      appearsByDialogue,
      appearsByMention,
    };
  });

  // Filter to characters appearing in the current folio (either speaking or mentioned in the scene).
  // Fallback to all characters if none explicitly matched.
  const appearing = members.filter(
    (m) => m.appearsByDialogue || m.appearsByMention
  );
  const castToReturn = appearing.length > 0 ? appearing : members;

  // Sort so characters with active dialogue in this folio appear in order of their first appearance
  return [...castToReturn].sort((a, b) => {
    const aHasTurn = a.firstTurnIdx >= 0 ? 0 : 1;
    const bHasTurn = b.firstTurnIdx >= 0 ? 0 : 1;
    if (aHasTurn !== bHasTurn) return aHasTurn - bHasTurn;
    if (a.firstTurnIdx >= 0 && b.firstTurnIdx >= 0) {
      return a.firstTurnIdx - b.firstTurnIdx;
    }
    return 0;
  });
}
