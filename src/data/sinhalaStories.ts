import { Storybook, StorybookPalette } from "../types";

export const SINHALA_KANDYAN_PALETTE: StorybookPalette = {
  paper: "#F7F1E3",
  card: "#EDE3CC",
  ink: "#231B14",
  muted: "#756352",
  accent: "#9E3B24", // Kandyan Lacquer Vermilion / Gurugala Ochre
  rule: "#D4C3A3",
  coverCloth: "#6E2819",
  coverSpine: "#4A1A10",
};

export const SINHALA_LAGOON_PALETTE: StorybookPalette = {
  paper: "#F4F3EB",
  card: "#E7E5D6",
  ink: "#1A211E",
  muted: "#637069",
  accent: "#2E6B5E", // Koggala Mangrove Jade
  rule: "#C7C5B3",
  coverCloth: "#234F46",
  coverSpine: "#173630",
};

function createArchivalPlateSvgDataUri(opts: {
  bg: string;
  accent: string;
  secondary: string;
  ink: string;
  titleSi: string;
  titleEn: string;
  motif: "mahadenamutta" | "andare" | "madoldoova" | "guttila" | "charsheet";
}): string {
  const { bg, accent, secondary, ink, titleSi, titleEn, motif } = opts;

  let centerArt = "";
  if (motif === "mahadenamutta") {
    centerArt = `
      <!-- Village Ambalama & Clay Pot -->
      <path d="M220 460 L640 460 L590 360 L270 360 Z" fill="${secondary}" fill-opacity="0.22" stroke="${ink}" stroke-width="2"/>
      <line x1="295" y1="360" x2="295" y2="540" stroke="${ink}" stroke-width="3"/>
      <line x1="565" y1="360" x2="565" y2="540" stroke="${ink}" stroke-width="3"/>
      <line x1="200" y1="540" x2="1080" y2="540" stroke="${ink}" stroke-width="2"/>
      <!-- Palm Trees -->
      <path d="M1010 540 Q990 380 940 250" fill="none" stroke="${ink}" stroke-width="3"/>
      <path d="M940 250 Q880 230 850 270 M940 250 Q900 200 960 190 M940 250 Q1000 220 1030 265" fill="none" stroke="${secondary}" stroke-width="2.5"/>
      <!-- Mahadenamutta with Ola-Leaf Book & Disciples -->
      <circle cx="430" cy="415" r="24" fill="${bg}" stroke="${ink}" stroke-width="2.2"/>
      <path d="M395 540 C395 465 465 465 465 540" fill="${accent}" fill-opacity="0.2" stroke="${ink}" stroke-width="2.2"/>
      <rect x="455" y="455" width="48" height="16" fill="${bg}" stroke="${accent}" stroke-width="2"/>
      <!-- Clay Muttiya (Pot) & Goat -->
      <ellipse cx="760" cy="505" rx="46" ry="36" fill="${accent}" fill-opacity="0.32" stroke="${ink}" stroke-width="2.4"/>
      <path d="M785 480 Q825 450 845 470 Q855 505 830 540" fill="none" stroke="${ink}" stroke-width="2.2"/>
    `;
  } else if (motif === "andare") {
    centerArt = `
      <!-- Kandyan Octagonal Paththirippuwa Pavilion & Courtyard -->
      <polygon points="640,210 790,280 490,280" fill="${accent}" fill-opacity="0.22" stroke="${ink}" stroke-width="2.2"/>
      <rect x="515" y="280" width="250" height="16" fill="${secondary}" fill-opacity="0.25" stroke="${ink}" stroke-width="1.8"/>
      <line x1="545" y1="296" x2="545" y2="490" stroke="${ink}" stroke-width="2.5"/>
      <line x1="640" y1="296" x2="640" y2="490" stroke="${ink}" stroke-width="2.5"/>
      <line x1="735" y1="296" x2="735" y2="490" stroke="${ink}" stroke-width="2.5"/>
      <!-- Woven Magul Padura (Mat) with White Sugar Mound -->
      <polygon points="440,545 840,545 790,500 490,500" fill="${secondary}" fill-opacity="0.18" stroke="${ink}" stroke-width="2"/>
      <path d="M555 530 Q640 465 725 530 Z" fill="#FFFFFF" stroke="${ink}" stroke-width="2"/>
      <!-- Andare & Little Son -->
      <circle cx="420" cy="430" r="22" fill="${bg}" stroke="${ink}" stroke-width="2.2"/>
      <path d="M390 545 C390 470 450 470 450 545" fill="${accent}" fill-opacity="0.22" stroke="${ink}" stroke-width="2.2"/>
      <circle cx="860" cy="460" r="16" fill="${bg}" stroke="${ink}" stroke-width="2"/>
      <path d="M838 545 C838 492 882 492 882 545" fill="${secondary}" fill-opacity="0.22" stroke="${ink}" stroke-width="2"/>
    `;
  } else if (motif === "madoldoova") {
    centerArt = `
      <!-- Koggala Lagoon Water Ripples & Mangrove Island -->
      <path d="M180 450 Q380 310 660 350 Q880 380 1080 450 Z" fill="${accent}" fill-opacity="0.24" stroke="${ink}" stroke-width="2.2"/>
      <path d="M140 500 Q420 485 640 500 T1140 500" fill="none" stroke="${accent}" stroke-width="2"/>
      <path d="M180 545 Q460 530 680 545 T1100 545" fill="none" stroke="${ink}" stroke-width="1.6"/>
      <!-- Outrigger Oruwa Canoe with Upali & Jinapala -->
      <path d="M360 515 Q520 555 680 515 L650 490 L390 490 Z" fill="${secondary}" fill-opacity="0.35" stroke="${ink}" stroke-width="2.4"/>
      <circle cx="465" cy="450" r="16" fill="${bg}" stroke="${ink}" stroke-width="2"/>
      <circle cx="565" cy="455" r="15" fill="${bg}" stroke="${ink}" stroke-width="2"/>
      <line x1="480" y1="465" x2="430" y2="545" stroke="${ink}" stroke-width="2.2"/>
    `;
  } else if (motif === "guttila") {
    centerArt = `
      <!-- Royal Pavilion Arch & Celestial Seven-Stringed Veena -->
      <path d="M340 540 L340 280 Q640 160 940 280 L940 540" fill="none" stroke="${accent}" stroke-width="2.2"/>
      <!-- Veena Instrument -->
      <circle cx="560" cy="450" r="54" fill="${accent}" fill-opacity="0.22" stroke="${ink}" stroke-width="2.5"/>
      <circle cx="560" cy="450" r="20" fill="${bg}" stroke="${ink}" stroke-width="1.6"/>
      <path d="M598 412 L770 250 L792 272 L620 434 Z" fill="${secondary}" fill-opacity="0.28" stroke="${ink}" stroke-width="2.2"/>
      <line x1="550" y1="440" x2="775" y2="260" stroke="${ink}" stroke-width="1"/>
      <line x1="560" y1="450" x2="782" y2="266" stroke="${ink}" stroke-width="1"/>
      <line x1="570" y1="460" x2="788" y2="272" stroke="${ink}" stroke-width="1"/>
    `;
  } else {
    centerArt = `
      <!-- Two Period Figures in Three-Quarter Profile (Character Reference Sheet) -->
      <circle cx="430" cy="290" r="34" fill="${bg}" stroke="${ink}" stroke-width="2.4"/>
      <path d="M375 535 C375 375 485 375 485 535 Z" fill="${accent}" fill-opacity="0.2" stroke="${ink}" stroke-width="2.4"/>
      <circle cx="850" cy="300" r="32" fill="${bg}" stroke="${ink}" stroke-width="2.4"/>
      <path d="M798 535 C798 380 902 380 902 535 Z" fill="${secondary}" fill-opacity="0.22" stroke="${ink}" stroke-width="2.4"/>
      <line x1="260" y1="535" x2="1020" y2="535" stroke="${ink}" stroke-width="2"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <rect width="1280" height="720" fill="${bg}"/>
    <rect x="36" y="36" width="1208" height="648" fill="none" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.55"/>
    <rect x="46" y="46" width="1188" height="628" fill="none" stroke="${ink}" stroke-width="1" stroke-opacity="0.28"/>
    <!-- Kandyan Liya-Vela Corner Flourishes -->
    <circle cx="72" cy="72" r="10" fill="none" stroke="${accent}" stroke-width="1.5"/>
    <circle cx="1208" cy="72" r="10" fill="none" stroke="${accent}" stroke-width="1.5"/>
    <circle cx="72" cy="648" r="10" fill="none" stroke="${accent}" stroke-width="1.5"/>
    <circle cx="1208" cy="648" r="10" fill="none" stroke="${accent}" stroke-width="1.5"/>
    ${centerArt}
    <text x="640" y="118" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="${ink}" letter-spacing="1">${titleSi}</text>
    <text x="640" y="618" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="20" fill="${ink}" fill-opacity="0.78">${titleEn}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface SinhalaStoryCategory {
  id: string;
  labelSi: string;
  labelEn: string;
  bookIds: string[];
}

export const SINHALA_STORY_CATEGORIES: SinhalaStoryCategory[] = [
  {
    id: "janakatha",
    labelSi: "ජනකතා · Village Folk Wisdom",
    labelEn: "Traditional Sinhala Village Folktales",
    bookIds: ["06_mahadenamutta", "07_andare_sugar"],
  },
  {
    id: "navakatha",
    labelSi: "නවකතා සම්භාව්‍ය · Modern Literary Classics",
    labelEn: "20th-Century Sri Lankan Sinhala Fiction",
    bookIds: ["08_madol_doova"],
  },
  {
    id: "jataka",
    labelSi: "ජාතක සහ කාව්‍ය · Classical Jataka & Poetry",
    labelEn: "Classical Buddhist Poetic Literature",
    bookIds: ["09_guttila_jatakaya"],
  },
];

const SINHALA_MASTER_CHAR_SHEET =
  "/src/assets/images/sinhala_characters_sheet_1794083189464.jpg";

const MAHADENAMUTTA_CHAR_SHEET = SINHALA_MASTER_CHAR_SHEET;
const MAHADENAMUTTA_PLATE_1 =
  "/src/assets/images/sinhala_mahadenamutta_plate_1794083182720.jpg";

const ANDARE_CHAR_SHEET = SINHALA_MASTER_CHAR_SHEET;
const ANDARE_PLATE_1 =
  "/src/assets/images/sinhala_andare_plate_1794083184900.jpg";

const MADOL_DOOVA_CHAR_SHEET = SINHALA_MASTER_CHAR_SHEET;
const MADOL_DOOVA_PLATE_1 =
  "/src/assets/images/sinhala_madol_doova_plate_1794083187744.jpg";

const GUTTILA_CHAR_SHEET = SINHALA_MASTER_CHAR_SHEET;
const GUTTILA_PLATE_1 =
  "/src/assets/images/sinhala_guttila_plate_1794083189305.jpg";

const DEFAULT_SINHALA_MODELS = {
  orchestrator: "antigravity-preview-09-2026 (gemini-4-argon)",
  cli: "gemini-api-cli (github.com/google-gemini/gemini-api-cli)",
  writer: "gemini-4-argon (Multilingual Sinhala Literary Adapter)",
  illustrator: "gemini-3.1-flash-lite-image (Kandyan Sittara Wash)",
  narrator: "gemini-3.8-flash-tts (Multilingual Sinhala si-LK + English)",
  composer: "lyria-3.5 (Acoustic Oriental Flute & Thalampata Score)",
};

export const MAHADENAMUTTA_STORYBOOK: Storybook = {
  id: "06_mahadenamutta",
  roman: "VI",
  bookHeaderLeft: "BOOK VI  ·  SINHALA JANA KATHA",
  year: "1790",
  genreFooterLeft: "ශ්‍රී ලාංකික ජනකතා · SINHALA FOLK SATIRE",
  settingFooterRight: "SOUTHERN CEYLON VILLAGE",
  title: "මහදැනමුත්තා (Mahadenamutta)",
  subtitle: "එළුවා සහ මුට්ටිය · The Goat & The Clay Pot",
  author: "Traditional Sinhala Folktale",
  palette: SINHALA_KANDYAN_PALETTE,
  sourceType: "classic-adaptation",
  visualStyle:
    "18th-century Kandyan Sittara palm-leaf pen-and-ink linework with natural vermilion, turmeric ochre, and indigo watercolour wash on #F7F1E3 paper",
  mood: "Warm village satire, gently humorous Sinhala folk wisdom",
  musicPrompt: "Gentle Sri Lankan bamboo flute (bata nala) and soft acoustic strings",
  charSheetImageUrl: MAHADENAMUTTA_CHAR_SHEET,
  coverImagePrompt: "Mahadenamutta and his disciples inspecting the goat and clay pot",
  coverImageUrl: MAHADENAMUTTA_PLATE_1,
  backgroundMusicUrl:
    "https://www.gstatic.com/aistudio/starter-apps/audio-storybooks/music/01_pride_and_prejudice_lyria.mp3",
  titleCardEndSec: 2.6,
  totalDurationSeconds: 74.0,
  modelsUsed: DEFAULT_SINHALA_MODELS,
  characters: [
    {
      id: "sinhala_narrator",
      name: "කථකාවිය (Narrator)",
      role: "Literary Narration",
      description: "Warm Sinhala village storyteller",
      voiceName: "Kore",
      voiceGender: "female",
      voiceStyle: "warm, unhurried female Sinhala village storytelling",
    },
    {
      id: "village_housewife",
      name: "ගෙදර කාන්තාව (Village Housewife)",
      role: "Character Dialogue",
      description: "The distressed village housewife whose goat is trapped in the clay pot",
      voiceName: "Aoede",
      voiceGender: "female",
      voiceStyle: "anxious, expressive female villager",
    },
    {
      id: "mahadenamutta",
      name: "මහදැනමුත්තා (Mahadenamutta)",
      role: "Character Dialogue",
      description: "The pompous, literal-minded village sage who consults his palm-leaf book for every crisis",
      voiceName: "Charon",
      voiceGender: "male",
      voiceStyle: "deep baritone, solemn, self-important elder sage",
    },
    {
      id: "polbaa_muna",
      name: "පොල්බෑ මූණා (Polbää Muna)",
      role: "Character Dialogue",
      description: "Mahadenamutta’s most eager and gullible disciple",
      voiceName: "Puck",
      voiceGender: "male",
      voiceStyle: "lively male tenor, eager disciple",
    },
  ],
  pages: [
    {
      pageNumber: 1,
      sceneIdx: 0,
      sceneLabel: "SCENE I",
      folioLabel: "FOLIO VI.1",
      chapterTitle: "පළමු කොටස · THE CLAY POT DILEMMA",
      narrativeText:
        "එකමත් එක කාලෙක මහදැනමුත්තා සහ ඔහුගේ ගෝලයෝ පස්දෙනා ගම හරහා ගමන් කරමින් සිටියහ. ගමේ ගෙදරක එළුවෙක් මැටි මුට්ටියක් ඇතුළට ඔළුව දමාගෙන ආපසු ගන්නට බැරිව දඟලමින් සිටියේය.",
      illustrationPrompt: "Village courtyard with goat stuck in a clay muttiya pot",
      imageCaption: "එළුවා සහ මැටි මුට්ටිය · The Goat & The Clay Pot",
      imageUrl: MAHADENAMUTTA_PLATE_1,
      dioramaUrl: MAHADENAMUTTA_PLATE_1,
      plates: [
        {
          plateNumberRoman: "I",
          plateLabel: "PLATE I OF II",
          title: "එළුවා සහ මැටි මුට්ටිය · The Goat & The Clay Pot",
          illustrationPrompt: "Kandyan Sittara illustration of Mahadenamutta",
          imageUrl: MAHADENAMUTTA_PLATE_1,
        },
        {
          plateNumberRoman: "II",
          plateLabel: "CHARACTER SHEET",
          title: "මහදැනමුත්තා සහ ගෝලයෝ · Character Reference Sheet",
          illustrationPrompt: "Character sheet",
          imageUrl: MAHADENAMUTTA_CHAR_SHEET,
        },
      ],
      dialogueLines: [
        {
          speaker: "කථකාවිය (Narrator)",
          speakerLabel: "කථකාවිය · NARRATOR (♀ FEMALE)",
          voiceRoleLabel: "Female Literary Narration",
          isDialogue: false,
          voiceName: "Kore",
          voiceGender: "female",
          text: "එකමත් එක කාලෙක මහදැනමුත්තා සහ ඔහුගේ ගෝලයෝ පස්දෙනා ගම හරහා ගමන් කරමින් සිටියහ.",
          ttsText:
            "එකමත් එක කාලෙක මහදැනමුත්තා සහ ඔහුගේ ගෝලයෝ පස්දෙනා ගම හරහා ගමන් කරමින් සිටියහ.",
          durationSeconds: 7.5,
        },
        {
          speaker: "ගෙදර කාන්තාව (Village Housewife)",
          speakerLabel: "ගෙදර කාන්තාව · HOUSEWIFE",
          voiceRoleLabel: "Female Character Dialogue",
          isDialogue: true,
          voiceName: "Aoede",
          voiceGender: "female",
          text: "“අනේ මහදැනමුත්තේ, අපේ එළුවා මැටි මුට්ටිය ඇතුළට ඔළුව දමාගෙන ආපසු ගන්නට බැරිව දඟලනවා!”",
          ttsText:
            "අනේ මහදැනමුත්තේ, අපේ එළුවා මැටි මුට්ටිය ඇතුළට ඔළුව දමාගෙන ආපසු ගන්නට බැරිව දඟලනවා!",
          durationSeconds: 7.8,
        },
        {
          speaker: "පොල්බෑ මූණා (Polbää Muna)",
          speakerLabel: "පොල්බෑ මූණා · POLBÄÄ MUNA",
          voiceRoleLabel: "Male Character Dialogue",
          isDialogue: true,
          voiceName: "Puck",
          voiceGender: "male",
          text: "“ගුරුතුමනි, මේ අසරණ එළුවා මුට්ටියෙන් බේරාගන්නේ කෙසේදැයි පුස්කොළ පොත බලා වදාළ මැනවි!”",
          ttsText:
            "ගුරුතුමනි, මේ අසරණ එළුවා මුට්ටියෙන් බේරාගන්නේ කෙසේදැයි පුස්කොළ පොත බලා වදාළ මැනවි!",
          durationSeconds: 7.6,
        },
      ],
    },
    {
      pageNumber: 2,
      sceneIdx: 0,
      sceneLabel: "SCENE II",
      folioLabel: "FOLIO VI.2",
      chapterTitle: "දෙවන කොටස · THE PALM-LEAF DECREE",
      narrativeText:
        "මහදැනමුත්තා කණ්ණාඩි යුවළ පැළඳ පුස්කොළ පොත පෙරළා බැලුවේය. ඔහුගේ නුවණට අනුව මුට්ටිය බේරා ගැනීමට නම් එළුවාගේ බෙල්ල කැපිය යුතු විය!",
      illustrationPrompt: "Mahadenamutta reading the ola-leaf manuscript",
      imageCaption: "පුස්කොළ පොතේ නියෝගය · The Palm-Leaf Decree",
      imageUrl: MAHADENAMUTTA_PLATE_1,
      dioramaUrl: MAHADENAMUTTA_PLATE_1,
      plates: [
        {
          plateNumberRoman: "I",
          plateLabel: "PLATE I OF II",
          title: "පුස්කොළ පොතේ නියෝගය · The Palm-Leaf Decree",
          illustrationPrompt: "Kandyan Sittara illustration",
          imageUrl: MAHADENAMUTTA_PLATE_1,
        },
      ],
      dialogueLines: [
        {
          speaker: "මහදැනමුත්තා (Mahadenamutta)",
          speakerLabel: "මහදැනමුත්තා · MAHADENAMUTTA",
          voiceRoleLabel: "Male Character Dialogue",
          isDialogue: true,
          voiceName: "Charon",
          voiceGender: "male",
          text: "“ගෝලයෙනි, පොතේ හැටියට නම් මුලින්ම එළුවාගේ බෙල්ල කපා කඳ වෙන් කළ යුතුයි. එවිට මුට්ටියට හානියක් නොවෙයි!”",
          ttsText:
            "ගෝලයෙනි, පොතේ හැටියට නම් මුලින්ම එළුවාගේ බෙල්ල කපා කඳ වෙන් කළ යුතුයි. එවිට මුට්ටියට හානියක් නොවෙයි!",
          durationSeconds: 8.5,
        },
        {
          speaker: "කථකාවිය (Narrator)",
          speakerLabel: "කථකාවිය · NARRATOR (♀ FEMALE)",
          voiceRoleLabel: "Female Literary Narration",
          isDialogue: false,
          voiceName: "Kore",
          voiceGender: "female",
          text: "එළුවාගේ බෙල්ල කැපූ පසුත් ඔළුව මුට්ටිය ඇතුළේ හිරවී තිබුණි. ඊළඟට මහදැනමුත්තා අණ කළේ මුට්ටිය ගලකින් ගසා බිඳ දමන ලෙසයි!",
          ttsText:
            "එළුවාගේ බෙල්ල කැපූ පසුත් ඔළුව මුට්ටිය ඇතුළේ හිරවී තිබුණි. ඊළඟට මහදැනමුත්තා අණ කළේ මුට්ටිය ගලකින් ගසා බිඳ දමන ලෙසයි!",
          durationSeconds: 9.2,
        },
      ],
    },
  ],
};

export const ANDARE_SUGAR_STORYBOOK: Storybook = {
  id: "07_andare_sugar",
  roman: "VII",
  bookHeaderLeft: "BOOK VII  ·  ROYAL COURT OF KANDY",
  year: "1765",
  genreFooterLeft: "රාජසභා හාස්‍ය · KANDYAN COURT WIT",
  settingFooterRight: "MAHA WASALA, KANDY",
  title: "අන්දරේ සීනි කෑ හැටි (Andare & The Royal Sugar)",
  subtitle: "රාජවාසලේ සුදු වැලි · The White Sand of the Palace",
  author: "Sri Lankan Royal Folklore",
  palette: SINHALA_KANDYAN_PALETTE,
  sourceType: "classic-adaptation",
  visualStyle:
    "Kandyan court Sittara painting with warm vermilion, gold leaf, and sepia ink on #F7F1E3 paper",
  mood: "Playful courtly wit, affectionate father-and-son mischief",
  musicPrompt: "Playful Kandyan flute and light percussion chamber score",
  charSheetImageUrl: ANDARE_CHAR_SHEET,
  coverImagePrompt: "Andare and his son beside the mat of white sugar in the palace courtyard",
  coverImageUrl: ANDARE_PLATE_1,
  backgroundMusicUrl:
    "https://www.gstatic.com/aistudio/starter-apps/audio-storybooks/music/03_alice_in_wonderland_lyria.mp3",
  titleCardEndSec: 2.6,
  totalDurationSeconds: 76.0,
  modelsUsed: DEFAULT_SINHALA_MODELS,
  characters: [
    {
      id: "kandy_narrator",
      name: "කථකාවිය (Narrator)",
      role: "Literary Narration",
      description: "Female chronicler of the Kandyan Royal Court",
      voiceName: "Kore",
      voiceGender: "female",
      voiceStyle: "poised female courtly storytelling",
    },
    {
      id: "king_of_kandy",
      name: "මහ රජතුමා (King of Kandy)",
      role: "Character Dialogue",
      description: "The monarch of the Kandyan Kingdom",
      voiceName: "Charon",
      voiceGender: "male",
      voiceStyle: "deep baritone, regal and amused monarch",
    },
    {
      id: "andare",
      name: "අන්දරේ (Andare)",
      role: "Character Dialogue",
      description: "The legendary poet and witty court jester of the Sinhala king",
      voiceName: "Puck",
      voiceGender: "male",
      voiceStyle: "lively male tenor, quick-witted court jester",
    },
    {
      id: "queen_of_kandy",
      name: "රජ බිසව (Queen of Kandy)",
      role: "Character Dialogue",
      description: "The Queen of Kandy watching from the palace balcony",
      voiceName: "Aoede",
      voiceGender: "female",
      voiceStyle: "bright, amused royal female voice",
    },
  ],
  pages: [
    {
      pageNumber: 1,
      sceneIdx: 0,
      sceneLabel: "SCENE I",
      folioLabel: "FOLIO VII.1",
      chapterTitle: "පළමු කොටස · THE PALACE COURTYARD",
      narrativeText:
        "දිනක් රජවාසලේ මිදුලේ විශාල පැදුරක් මත සුදු සීනි අව්වේ වේලෙන්නට දමා තිබුණි. අන්දරේට මේ සීනි කන්නට ආසාවක් ඇති විය.",
      illustrationPrompt: "White sugar spread on a woven mat in the Kandyan palace courtyard",
      imageCaption: "රාජවාසලේ සීනි පැදුර · The Mat of Royal Sugar",
      imageUrl: ANDARE_PLATE_1,
      dioramaUrl: ANDARE_PLATE_1,
      plates: [
        {
          plateNumberRoman: "I",
          plateLabel: "PLATE I OF II",
          title: "රාජවාසලේ සීනි පැදුර · The Mat of Royal Sugar",
          illustrationPrompt: "Kandyan courtyard sugar mat",
          imageUrl: ANDARE_PLATE_1,
        },
        {
          plateNumberRoman: "II",
          plateLabel: "CHARACTER SHEET",
          title: "අන්දරේ සහ පුතා · Character Reference Sheet",
          illustrationPrompt: "Character sheet",
          imageUrl: ANDARE_CHAR_SHEET,
        },
      ],
      dialogueLines: [
        {
          speaker: "කථකාවිය (Narrator)",
          speakerLabel: "කථකාවිය · NARRATOR (♀ FEMALE)",
          voiceRoleLabel: "Female Literary Narration",
          isDialogue: false,
          voiceName: "Kore",
          voiceGender: "female",
          text: "දිනක් මහනුවර රජවාසලේ මිදුලේ විශාල පැදුරක් මත සුදු සීනි අව්වේ වේලෙන්නට දමා තිබුණි.",
          ttsText:
            "දිනක් මහනුවර රජවාසලේ මිදුලේ විශාල පැදුරක් මත සුදු සීනි අව්වේ වේලෙන්නට දමා තිබුණි.",
          durationSeconds: 7.5,
        },
        {
          speaker: "මහ රජතුමා (King of Kandy)",
          speakerLabel: "මහ රජතුමා · KING OF KANDY",
          voiceRoleLabel: "Male Character Dialogue",
          isDialogue: true,
          voiceName: "Charon",
          voiceGender: "male",
          text: "“අන්දරේ, ඔය පැදුරේ තිබෙන්නේ සීනි නොවෙයි, අපේ රජවාසලේ මිදුලට දමන සුදු වැලි පමණයි!”",
          ttsText:
            "අන්දරේ, ඔය පැදුරේ තිබෙන්නේ සීනි නොවෙයි, අපේ රජවාසලේ මිදුලට දමන සුදු වැලි පමණයි!",
          durationSeconds: 7.8,
        },
        {
          speaker: "අන්දරේ (Andare)",
          speakerLabel: "අන්දරේ · ANDARE",
          voiceRoleLabel: "Male Character Dialogue",
          isDialogue: true,
          voiceName: "Puck",
          voiceGender: "male",
          text: "“අනේ පුතේ, උඹේ අම්මා මැරුණා! අපි දෙන්නාම මේ සුදු වැලි කා මැරෙමු!” කියමින් අන්දරේ පුතු සමඟ දෝතින්ම සීනි කෑවේය.",
          ttsText:
            "අනේ පුතේ, උඹේ අම්මා මැරුණා! අපි දෙන්නාම මේ සුදු වැලි කා මැරෙමු! කියමින් අන්දරේ පුතු සමඟ දෝතින්ම සීනි කෑවේය.",
          durationSeconds: 8.8,
        },
        {
          speaker: "රජ බිසව (Queen of Kandy)",
          speakerLabel: "රජ බිසව · QUEEN OF KANDY",
          voiceRoleLabel: "Female Character Dialogue",
          isDialogue: true,
          voiceName: "Aoede",
          voiceGender: "female",
          text: "“මහරජතුමනි, අන්දරේගේ කපටි නුවණට නම් කිසිවෙකුටත් දිනන්නට බැහැ!”",
          ttsText:
            "මහරජතුමනි, අන්දරේගේ කපටි නුවණට නම් කිසිවෙකුටත් දිනන්නට බැහැ!",
          durationSeconds: 6.8,
        },
      ],
    },
  ],
};

export const MADOL_DOOVA_STORYBOOK: Storybook = {
  id: "08_madol_doova",
  roman: "VIII",
  bookHeaderLeft: "BOOK VIII  ·  MARTIN WICKRAMASINGHE",
  year: "1947",
  genreFooterLeft: "සිංහල නවකතා · SINHALA LITERARY CLASSIC",
  settingFooterRight: "KOGGALA LAGOON, SOUTHERN PROVINCE",
  title: "මඩොල් දූව (Madol Doova)",
  subtitle: "පළමු පරිච්ඡේදය · The Mangrove Island of Koggala",
  author: "Martin Wickramasinghe",
  palette: SINHALA_LAGOON_PALETTE,
  sourceType: "classic-adaptation",
  visualStyle:
    "Mid-century Ceylon coastal pen-and-ink & tropical mangrove watercolour wash on #F4F3EB paper",
  mood: "Sunlit coastal adventure, boyhood camaraderie, Koggala lagoon breeze",
  musicPrompt: "Gentle acoustic guitar and bamboo flute over Koggala lagoon waters",
  charSheetImageUrl: MADOL_DOOVA_CHAR_SHEET,
  coverImagePrompt: "Upali and Jinapala paddling an outrigger canoe across Koggala lagoon",
  coverImageUrl: MADOL_DOOVA_PLATE_1,
  backgroundMusicUrl:
    "https://www.gstatic.com/aistudio/starter-apps/audio-storybooks/music/05_tom_sawyer_lyria.mp3",
  titleCardEndSec: 2.6,
  totalDurationSeconds: 74.0,
  modelsUsed: DEFAULT_SINHALA_MODELS,
  characters: [
    {
      id: "upali_narrator",
      name: "උපාලි ගිනිවැල්ල (Upali Ginivella)",
      role: "First-Person Narrator",
      description: "Upali Ginivella — spirited hero and narrator of Martin Wickramasinghe’s Madol Doova",
      voiceName: "Fenrir",
      voiceGender: "male",
      voiceStyle: "spirited male baritone, adventurous southern-coast youth",
    },
    {
      id: "sudu_nanda",
      name: "සුදු නැන්දා (Sudu Nanda)",
      role: "Character Dialogue",
      description: "Upali’s gentle, worried stepmother in the coastal village",
      voiceName: "Aoede",
      voiceGender: "female",
      voiceStyle: "warm, concerned female voice",
    },
    {
      id: "jinapala",
      name: "ජිනපාල (Jinapala)",
      role: "Character Dialogue",
      description: "Upali’s loyal friend and companion on the island of Madol Doova",
      voiceName: "Orus",
      voiceGender: "male",
      voiceStyle: "steady male voice, resourceful companion",
    },
  ],
  pages: [
    {
      pageNumber: 1,
      sceneIdx: 0,
      sceneLabel: "SCENE I",
      folioLabel: "FOLIO VIII.1",
      chapterTitle: "පළමු පරිච්ඡේදය · VOYAGE TO MADOL DOOVA",
      narrativeText:
        "කොග්ගල ඔයේ නිසල ජලය මතින් අපේ කුඩා ඔරුව මඩොල් දූව දෙසට ඇදී ගියේය. කඩොලාන ගස්වලින් වැසුණු ඒ අභිරහස් දූපත අපේම රාජධානියක් කරගැනීමට ජිනපාලත් මමත් තීරණය කළෙමු.",
      illustrationPrompt: "Canoe crossing Koggala lagoon toward the mangrove island of Madol Doova",
      imageCaption: "කොග්ගල කලපුව · Crossing Koggala Lagoon",
      imageUrl: MADOL_DOOVA_PLATE_1,
      dioramaUrl: MADOL_DOOVA_PLATE_1,
      ambientSound: "woodland-stream",
      plates: [
        {
          plateNumberRoman: "I",
          plateLabel: "PLATE I OF II",
          title: "කොග්ගල කලපුව · Crossing Koggala Lagoon",
          illustrationPrompt: "Madol Doova lagoon plate",
          imageUrl: MADOL_DOOVA_PLATE_1,
        },
        {
          plateNumberRoman: "II",
          plateLabel: "CHARACTER SHEET",
          title: "උපාලි සහ ජිනපාල · Character Reference Sheet",
          illustrationPrompt: "Character sheet",
          imageUrl: MADOL_DOOVA_CHAR_SHEET,
        },
      ],
      dialogueLines: [
        {
          speaker: "සුදු නැන්දා (Sudu Nanda)",
          speakerLabel: "සුදු නැන්දා · SUDU NANDA",
          voiceRoleLabel: "Female Character Dialogue",
          isDialogue: true,
          voiceName: "Aoede",
          voiceGender: "female",
          text: "“උපාලිත් ජිනපාලත් අද උදේ පාන්දරම ඔරුව අරගෙන කොහේ ගියාදැයි සිතාගන්නවත් බැහැ!”",
          ttsText:
            "උපාලිත් ජිනපාලත් අද උදේ පාන්දරම ඔරුව අරගෙන කොහේ ගියාදැයි සිතාගන්නවත් බැහැ!",
          durationSeconds: 7.4,
        },
        {
          speaker: "උපාලි ගිනිවැල්ල (Upali Ginivella)",
          speakerLabel: "උපාලි · UPALI GINIVELLA",
          voiceRoleLabel: "Male First-Person Narration",
          isDialogue: false,
          voiceName: "Fenrir",
          voiceGender: "male",
          text: "කොග්ගල ඔයේ නිසල ජලය මතින් අපේ කුඩා ඔරුව මඩොල් දූව දෙසට ඇදී ගියේය.",
          ttsText:
            "කොග්ගල ඔයේ නිසල ජලය මතින් අපේ කුඩා ඔරුව මඩොල් දූව දෙසට ඇදී ගියේය.",
          durationSeconds: 7.6,
        },
        {
          speaker: "ජිනපාල (Jinapala)",
          speakerLabel: "ජිනපාල · JINAPALA",
          voiceRoleLabel: "Male Character Dialogue",
          isDialogue: true,
          voiceName: "Orus",
          voiceGender: "male",
          text: "“උපාලි, මේ දූපතේ හොල්මන් ඉන්නවා කියලා ගම්මු බය වුණාට, අපිට නම් මේක කදිම නිවහනක්!”",
          ttsText:
            "උපාලි, මේ දූපතේ හොල්මන් ඉන්නවා කියලා ගම්මු බය වුණාට, අපිට නම් මේක කදිම නිවහනක්!",
          durationSeconds: 8.2,
        },
      ],
    },
  ],
};

export const GUTTILA_JATAKAYA_STORYBOOK: Storybook = {
  id: "09_guttila_jatakaya",
  roman: "IX",
  bookHeaderLeft: "BOOK IX  ·  WÄTTÄWE THERO (KOTTE ERA)",
  year: "1470",
  genreFooterLeft: "සම්භාව්‍ය සිංහල කාව්‍ය · CLASSICAL SINHALA POETRY",
  settingFooterRight: "ROYAL PAVILION OF BARANAS",
  title: "ගුත්තිල කාව්‍යය (Guttila Jatakaya)",
  subtitle: "සත්තන්ත්‍රී වීණා තරගය · The Seven-Stringed Veena Duel",
  author: "Venerable Wättäwe Thero",
  palette: SINHALA_KANDYAN_PALETTE,
  sourceType: "classic-adaptation",
  visualStyle:
    "15th-century Kotte & Kandyan classical manuscript illumination with gold ochre and vermilion linework on #F7F1E3 paper",
  mood: "Celestial veena music, classical Sinhala poetic cadence",
  musicPrompt: "Classical seven-stringed veena and delicate chamber strings",
  charSheetImageUrl: GUTTILA_CHAR_SHEET,
  coverImagePrompt: "Master Guttila playing the seven-stringed veena in the royal court",
  coverImageUrl: GUTTILA_PLATE_1,
  backgroundMusicUrl:
    "https://www.gstatic.com/aistudio/starter-apps/audio-storybooks/music/04_the_time_machine_lyria.mp3",
  titleCardEndSec: 2.6,
  totalDurationSeconds: 72.0,
  modelsUsed: DEFAULT_SINHALA_MODELS,
  characters: [
    {
      id: "jataka_narrator",
      name: "කාව්‍ය කථකාවිය (Poetic Narrator)",
      role: "Classical Narration",
      description: "Female reciter of the Kotte-era Guttila Kavya",
      voiceName: "Aoede",
      voiceGender: "female",
      voiceStyle: "lyrical female soprano, classical Sinhala poetic cadence",
    },
    {
      id: "master_guttila",
      name: "ගුත්තිල ඇදුරිඳු (Master Guttila)",
      role: "Character Dialogue",
      description: "The Bodhisattva master musician of the seven-stringed veena",
      voiceName: "Charon",
      voiceGender: "male",
      voiceStyle: "deep male baritone, serene, noble, masterly",
    },
    {
      id: "musila",
      name: "මූසිල (Musila)",
      role: "Character Dialogue",
      description: "The ambitious veena pupil from Ujjeni",
      voiceName: "Puck",
      voiceGender: "male",
      voiceStyle: "proud male tenor, astonished",
    },
  ],
  pages: [
    {
      pageNumber: 1,
      sceneIdx: 0,
      sceneLabel: "SCENE I",
      folioLabel: "FOLIO IX.1",
      chapterTitle: "පළමු කොටස · THE SEVEN STRINGS",
      narrativeText:
        "ගුත්තිල ඇදුරිඳු සත්තන්ත්‍රී වීණාවේ තත් එකින් එක සිඳ දමා, තත් සිඳුණු වීණා කඳෙන් පවා දිව්‍යමය නාදයක් පැතිරවීය.",
      illustrationPrompt: "Master Guttila plucking the single remaining string of his veena",
      imageCaption: "සත්තන්ත්‍රී වීණා නාදය · The Celestial Veena",
      imageUrl: GUTTILA_PLATE_1,
      dioramaUrl: GUTTILA_PLATE_1,
      plates: [
        {
          plateNumberRoman: "I",
          plateLabel: "PLATE I OF II",
          title: "සත්තන්ත්‍රී වීණා නාදය · The Celestial Veena",
          illustrationPrompt: "Guttila veena plate",
          imageUrl: GUTTILA_PLATE_1,
        },
        {
          plateNumberRoman: "II",
          plateLabel: "CHARACTER SHEET",
          title: "ගුත්තිල සහ මූසිල · Character Reference Sheet",
          illustrationPrompt: "Character sheet",
          imageUrl: GUTTILA_CHAR_SHEET,
        },
      ],
      dialogueLines: [
        {
          speaker: "කාව්‍ය කථකාවිය (Poetic Narrator)",
          speakerLabel: "කාව්‍ය කථකාවිය · POETIC NARRATOR",
          voiceRoleLabel: "Female Classical Narration",
          isDialogue: false,
          voiceName: "Aoede",
          voiceGender: "female",
          text: "රාජසභා මණ්ඩපයේදී ගුත්තිල ඇදුරිඳු තම සත්තන්ත්‍රී වීණාව සුසර කළේය.",
          ttsText:
            "රාජසභා මණ්ඩපයේදී ගුත්තිල ඇදුරිඳු තම සත්තන්ත්‍රී වීණාව සුසර කළේය.",
          durationSeconds: 7.2,
        },
        {
          speaker: "මූසිල (Musila)",
          speakerLabel: "මූසිල · MUSILA",
          voiceRoleLabel: "Male Character Dialogue",
          isDialogue: true,
          voiceName: "Puck",
          voiceGender: "male",
          text: "“ගුරුතුමනි, අද මේ රාජ සභාවේදී මාගේ වීණා ශිල්පය ඔබට දෙවැනි නොවන බව පෙන්වමි!”",
          ttsText:
            "ගුරුතුමනි, අද මේ රාජ සභාවේදී මාගේ වීණා ශිල්පය ඔබට දෙවැනි නොවන බව පෙන්වමි!",
          durationSeconds: 7.5,
        },
        {
          speaker: "ගුත්තිල ඇදුරිඳු (Master Guttila)",
          speakerLabel: "ගුත්තිල · MASTER GUTTILA",
          voiceRoleLabel: "Male Character Dialogue",
          isDialogue: true,
          voiceName: "Charon",
          voiceGender: "male",
          text: "“සැබෑ ශිල්පය ඇත්තේ තත් හතේ පමණක් නොව, නිහතමානී හදවතේය.” එකින් එක තත් සිඳ දැමූ පසුත් වීණා කඳෙන් දිව්‍යමය සංගීතය ගලා ආවේය!",
          ttsText:
            "සැබෑ ශිල්පය ඇත්තේ තත් හතේ පමණක් නොව, නිහතමානී හදවතේය. එකින් එක තත් සිඳ දැමූ පසුත් වීණා කඳෙන් දිව්‍යමය සංගීතය ගලා ආවේය!",
          durationSeconds: 9.8,
        },
      ],
    },
  ],
};

export const ALL_SINHALA_STORYBOOKS: Storybook[] = [
  MAHADENAMUTTA_STORYBOOK,
  ANDARE_SUGAR_STORYBOOK,
  MADOL_DOOVA_STORYBOOK,
  GUTTILA_JATAKAYA_STORYBOOK,
];
