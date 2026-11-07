import { CharacterVoice, Storybook, StorybookPage } from "../types";
import { resolveVoiceProfile, VoiceGender } from "./characterVoiceEngine";

export interface FolioCastMember {
  id: string;
  name: string;
  role: string;
  voiceName: string;
  voiceGender: VoiceGender;
  voiceRegisterLabel: string;
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
  portraitImageUrl?: string;
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

  // Sri Lankan Sinhala Storybooks (මහදැනමුත්තා, අන්දරේ, මඩොල් දූව, ගුත්තිල ජාතකය)
  sinhala_narrator: {
    shortTitle: "ගැමි කථකාවිය · Traditional Village Storyteller (Female)",
    bio: "The warm evening voice of the Sri Lankan village ambalama (wayside rest-house), recounting humorous folktales passed down across generations.",
    dramaticNote:
      "Introduces Mahadenamutta and his five literal-minded disciples as they walk through the village.",
    portraitImageUrl: "/src/assets/images/sinhala_mahadenamutta_plate_1794083182720.jpg",
    portraitObjectPosition: "64% 34%",
    portraitScale: 2.1,
    aliases: ["කථකාවිය", "කථකයා", "Narrator"],
  },
  village_narrator: {
    shortTitle: "ගැමි කථකාවිය · Traditional Village Storyteller (Female)",
    bio: "The warm evening voice of the Sri Lankan village ambalama (wayside rest-house), recounting humorous folktales passed down across generations.",
    dramaticNote:
      "Introduces Mahadenamutta and his five literal-minded disciples as they walk through the village.",
    portraitImageUrl: "/src/assets/images/sinhala_mahadenamutta_plate_1794083182720.jpg",
    portraitObjectPosition: "64% 34%",
    portraitScale: 2.1,
    aliases: ["කථකාවිය", "කථකයා", "Narrator"],
  },
  village_housewife: {
    shortTitle: "ගෙදර කාන්තාව · Distressed Village Housewife (Female)",
    bio: "The owner of the clay pot (muttiya) and the unfortunate goat in the village courtyard, who calls upon Mahadenamutta hoping his famed wisdom will save both.",
    dramaticNote:
      "Cries out in alarm as her goat struggles with its head trapped inside the clay pot.",
    portraitImageUrl: "/src/assets/images/sinhala_mahadenamutta_plate_1794083182720.jpg",
    portraitObjectPosition: "80% 44%",
    portraitScale: 2.2,
    aliases: ["ගෙදර කාන්තාව", "කාන්තාව", "Housewife"],
  },
  mahadenamutta: {
    shortTitle: "මහදැනමුත්තා · The Village Sage of the Ola-Leaf Book (Male)",
    bio: "A beloved archetype of Sri Lankan Sinhala folklore: an elderly, self-important sage who never makes a practical decision without consulting his inherited palm-leaf manuscript (puskola potha), leading his five disciples into comical misadventures.",
    dramaticNote:
      "Solemnly consults his puskola potha and decrees that the villager’s goat must be beheaded first and the clay pot smashed afterward.",
    portraitImageUrl: "/src/assets/images/sinhala_characters_sheet_1794083189464.jpg",
    portraitObjectPosition: "15% 22%",
    portraitScale: 2.5,
    aliases: ["මහදැනමුත්තා", "Mahadenamutta"],
  },
  polbaa_muna: {
    shortTitle: "පොල්බෑ මූණා · Chief Disciple of Mahadenamutta (Male)",
    bio: "Named “Half-Coconut Face,” he is the most earnest and literal-minded of Mahadenamutta’s five disciples, reverently carrying out his master’s absurd instructions to the letter.",
    dramaticNote:
      "Implores Mahadenamutta to open the sacred palm-leaf manuscript to rescue the goat trapped in the clay pot.",
    portraitImageUrl: "/src/assets/images/sinhala_mahadenamutta_plate_1794083182720.jpg",
    portraitObjectPosition: "18% 42%",
    portraitScale: 2.3,
    aliases: ["පොල්බෑ මූණා", "Polbää Muna"],
  },
  kandy_narrator: {
    shortTitle: "රාජසභා කථකාවිය · Chronicler of the Kandyan Court (Female)",
    bio: "The court chronicler of Senkadagala (Kandy), narrating the battle of wits between the King and his irrepressible court jester Andare.",
    dramaticNote:
      "Describes the sunlit palace courtyard where royal white sugar has been spread on a woven mat to dry.",
    portraitImageUrl: "/src/assets/images/sinhala_andare_plate_1794083184900.jpg",
    portraitObjectPosition: "78% 48%",
    portraitScale: 2.2,
    aliases: ["කථකාවිය", "කථකයා", "Court Narrator"],
  },
  andare: {
    shortTitle: "අන්දරේ · Royal Court Jester of Kandy (Male)",
    bio: "The legendary 18th-century Sinhala poet and court wit from southern Sri Lanka who served in the Kandyan King’s Kavikara Maduwa. Famous for his quick-thinking pranks, improvised verses, and fearless humour before the throne.",
    dramaticNote:
      "Turns the King’s claim that the drying palace sugar is “white courtyard sand” into an excuse for him and his son to feast upon it with both hands.",
    portraitImageUrl: "/src/assets/images/sinhala_characters_sheet_1794083189464.jpg",
    portraitObjectPosition: "37% 22%",
    portraitScale: 2.5,
    aliases: ["අන්දරේ", "Andare"],
  },
  king_of_kandy: {
    shortTitle: "මහ රජතුමා · The King of Kandy (Male)",
    bio: "The monarch of the Kandyan Kingdom, adorned in royal Mul Anduma regalia. Though he tries to outwit Andare with clever riddles, he always appreciates the jester’s sharp intellect.",
    dramaticNote:
      "Tells Andare that the white sugar drying in the palace courtyard is merely white sand, only to be outsmarted minutes later.",
    portraitImageUrl: "/src/assets/images/sinhala_andare_plate_1794083184900.jpg",
    portraitObjectPosition: "22% 26%",
    portraitScale: 2.3,
    aliases: ["රජතුමා", "මහ රජතුමා", "King"],
  },
  queen_of_kandy: {
    shortTitle: "රජ බිසව · The Queen of Kandy (Female)",
    bio: "Consort of the Kandyan monarch, watching the courtyard wit from the carved wooden balcony of the Maha Wasala palace.",
    dramaticNote:
      "Laughs in delight from the palace balcony as Andare outwits the King’s white-sand ruse.",
    portraitImageUrl: "/src/assets/images/sinhala_andare_plate_1794083184900.jpg",
    portraitObjectPosition: "52% 28%",
    portraitScale: 2.2,
    aliases: ["රජ බිසව", "බිසව", "Queen"],
  },
  upali_narrator: {
    shortTitle: "උපාලි ගිනිවැල්ල · Hero of Martin Wickramasinghe’s Madol Doova (Male)",
    bio: "The spirited, independent-minded young protagonist from a southern coastal village in Sri Lanka who rebels against stuffy schoolroom routine and sets out across Koggala lagoon to build a self-reliant life on the uninhabited island of Madol Doova.",
    dramaticNote:
      "Steers the outrigger canoe across the tranquil Koggala waters toward the mangrove-fringed island.",
    portraitImageUrl: "/src/assets/images/sinhala_characters_sheet_1794083189464.jpg",
    portraitObjectPosition: "62% 22%",
    portraitScale: 2.5,
    aliases: ["උපාලි", "Upali"],
  },
  sudu_nanda: {
    shortTitle: "සුදු නැන්දා · Upali’s Stepmother (Female)",
    bio: "Upali Ginivella’s gentle, anxious stepmother in the southern coastal village, forever worried by Upali and Jinapala’s daring escapades across the Koggala waters.",
    dramaticNote:
      "Wonders aloud where Upali and Jinapala have vanished as they slip away toward the mangrove island.",
    portraitImageUrl: "/src/assets/images/sinhala_madol_doova_plate_1794083187744.jpg",
    portraitObjectPosition: "32% 46%",
    portraitScale: 2.2,
    aliases: ["සුදු නැන්දා", "Sudu Nanda"],
  },
  jinapala: {
    shortTitle: "ජිනපාල · Loyal Companion on Madol Doova (Male)",
    bio: "Upali Ginivella’s steadfast childhood friend and partner in adventure. Practical, courageous, and resourceful, he helps transform the wild mangrove island of Madol Doova into a thriving homestead.",
    dramaticNote:
      "Dismisses the villagers’ superstitions about island ghosts and celebrates Madol Doova as their new sanctuary.",
    portraitImageUrl: "/src/assets/images/sinhala_madol_doova_plate_1794083187744.jpg",
    portraitObjectPosition: "77% 56%",
    portraitScale: 2.6,
    aliases: ["ජිනපාල", "Jinapala"],
  },
  jataka_narrator: {
    shortTitle: "කාව්‍ය කථකාවිය · Classical Jataka Reciter (Female)",
    bio: "Reciter of Venerable Wättäwe Thero’s 15th-century Sinhala poem Guttila Kavya, evoking the cadence of classical Buddhist verse.",
    dramaticNote:
      "Sets the scene beneath the royal pavilion of Udeni as the great musical contest begins.",
    portraitImageUrl: "/src/assets/images/sinhala_guttila_plate_1794083189305.jpg",
    portraitObjectPosition: "50% 28%",
    portraitScale: 1.7,
    aliases: ["කාව්‍ය කථකාවිය", "කාව්‍ය කථකයා", "Poetic Narrator"],
  },
  master_guttila: {
    shortTitle: "ගුත්තිල ඇදුරිඳු · Bodhisattva Master of the Seven-Stringed Veena (Male)",
    bio: "The supreme court musician of Udeni and hero of Wättäwe Thero’s 15th-century classical Sinhala poem Guttila Kavya. Renowned for his generosity, filial piety, and transcendent mastery of the seven-stringed veena.",
    dramaticNote:
      "Snaps the strings of his veena one by one during the royal contest, drawing forth celestial music from the bare instrument through pure spiritual grace.",
    portraitImageUrl: "/src/assets/images/sinhala_characters_sheet_1794083189464.jpg",
    portraitObjectPosition: "85% 22%",
    portraitScale: 2.5,
    aliases: ["ගුත්තිල", "Guttila"],
  },
  musila: {
    shortTitle: "මූසිල · Ambitious Veena Pupil from Ujjeni (Male)",
    bio: "A gifted but proud musician who learned every secret of the seven-stringed veena from Master Guttila, then challenged his aged teacher for equal royal honours.",
    dramaticNote:
      "Watches in astonishment as Master Guttila plays heavenly music even after snapping every string of his veena.",
    portraitImageUrl: "/src/assets/images/sinhala_guttila_plate_1794083189305.jpg",
    portraitObjectPosition: "76% 46%",
    portraitScale: 2.4,
    aliases: ["මූසිල", "Musila"],
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
    let portraitImageUrl = curated?.portraitImageUrl || charSheetUrl;
    if (
      !curated?.portraitImageUrl &&
      typeof curated?.useScenePlateIdx === "number" &&
      scenePlates[curated.useScenePlateIdx]?.imageUrl
    ) {
      portraitImageUrl = scenePlates[curated.useScenePlateIdx].imageUrl!;
    } else if (
      !curated?.portraitImageUrl &&
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

    const voiceProfile = resolveVoiceProfile(
      char.voiceName,
      char.voiceGender,
      char.name
    );

    return {
      id: char.id,
      name: char.name,
      role: char.role,
      voiceName: voiceProfile.voiceName,
      voiceGender: voiceProfile.gender,
      voiceRegisterLabel: voiceProfile.registerLabel,
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
