import { StorybookPalette } from "../types";

export interface MarginaliaNote {
  id: string;
  term: string;
  category: string;
  era: string;
  definition: string;
  literaryNote: string;
}

export type ReadingLightingMode = "daylight" | "candlelight" | "midnight";

export const READING_LIGHTING_MODES: {
  id: ReadingLightingMode;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: "daylight",
    label: "Daylight Cream",
    shortLabel: "Daylight",
    description: "Warm 1810s #F6F2EA rag paper under natural morning casement light",
  },
  {
    id: "candlelight",
    label: "Candlelight Amber",
    shortLabel: "Candlelight",
    description: "Golden beeswax-taper amber vellum for low-glare evening reading",
  },
  {
    id: "midnight",
    label: "Midnight Vellum",
    shortLabel: "Midnight",
    description: "Deep charcoal-sepia library study mode with soft parchment ink",
  },
];

export function resolveLightingPalette(
  basePalette: StorybookPalette,
  mode: ReadingLightingMode
): StorybookPalette {
  if (mode === "candlelight") {
    return {
      paper: "#EFE1C6",
      card: "#E4D3B2",
      ink: "#261B11",
      muted: "#6E5840",
      accent: basePalette.accent,
      rule: "#CBB692",
      coverCloth: basePalette.coverCloth,
      coverSpine: basePalette.coverSpine,
    };
  }
  if (mode === "midnight") {
    return {
      paper: "#1B1916",
      card: "#25221D",
      ink: "#EAE2D3",
      muted: "#9E9484",
      accent: "#C99B52",
      rule: "#3B352D",
      coverCloth: basePalette.coverCloth,
      coverSpine: basePalette.coverSpine,
    };
  }
  return basePalette;
}

export const CURATED_MARGINALIA_GLOSSARY: MarginaliaNote[] = [
  // Book I: Pride and Prejudice
  {
    id: "truth_acknowledged",
    term: "universally acknowledged",
    category: "Literary Rhetoric",
    era: "Regency England (1813)",
    definition:
      "Jane Austen’s celebrated opening irony: stating a mercenary neighbourhood wish—that every wealthy bachelor seeks a bride—as though it were an indisputable philosophical axiom.",
    literaryNote:
      "Immediately establishes the novel’s comic tension between polite philosophical maxims and the practical anxieties of the marriage market.",
  },
  {
    id: "netherfield_park",
    term: "Netherfield Park",
    category: "Country Estate",
    era: "Hertfordshire (1813)",
    definition:
      "A substantial country seat near the village of Meryton and the Bennet family’s smaller estate at Longbourn, leased by Mr. Charles Bingley.",
    literaryNote:
      "Leasing rather than owning a country seat signals that Bingley’s fortune is newly acquired through northern trade, yet ready to be established in landed society.",
  },
  {
    id: "michaelmas",
    term: "Michaelmas",
    category: "Quarter Day",
    era: "English Legal Calendar",
    definition:
      "The Feast of St. Michael and All Angels (29 September), one of the four traditional English quarter days on which estate leases began, rents fell due, and servants were hired.",
    literaryNote:
      "Taking possession before Michaelmas means Bingley is arriving just in time for the autumn country assembly balls.",
  },
  {
    id: "chaise_and_four",
    term: "chaise and four",
    category: "Regency Equipage",
    era: "Early 19th Century",
    definition:
      "A light, closed travelling carriage drawn by four post-horses rather than a standard pair—an immediate visual marker of wealth and fashionable speed.",
    literaryNote:
      "Mrs. Bennet notes the four horses before even learning the gentleman’s name, measuring his eligibility by his equipage.",
  },
  {
    id: "four_or_five_thousand",
    term: "four or five thousand a year",
    category: "Regency Income",
    era: "1813 Pound Sterling",
    definition:
      "An annual income derived from invested capital (typically 4–5% Government Consols), placing Mr. Bingley firmly in the upper tier of the landed gentry—roughly twice Mr. Bennet’s Longbourn income.",
    literaryNote:
      "Provides concrete economic stakes for Mrs. Bennet’s exclamation: “What a fine thing for our girls!”",
  },

  // Book II: The Hound of the Baskervilles
  {
    id: "penang_lawyer",
    term: "Penang lawyer",
    category: "Victorian Material Culture",
    era: "Late Victorian (1902)",
    definition:
      "A heavy, bulbous-headed walking-stick made from the stem of a dwarf palm (Licuala acutifida) imported from Penang in Malaya; jocosely named for its usefulness in settling disputes.",
    literaryNote:
      "Its weight and worn ferrule allow Watson and Holmes to deduce that its owner is a country practitioner who walks long moorland miles.",
  },
  {
    id: "mrcs",
    term: "M.R.C.S.",
    category: "Medical Credential",
    era: "1884 / 1902",
    definition:
      "Member of the Royal College of Surgeons of England, the standard professional qualification for a practicing Victorian surgeon and physician.",
    literaryNote:
      "Establishes Dr. James Mortimer as a fellow medical man—creating an immediate professional bond with Dr. Watson.",
  },
  {
    id: "cch",
    term: "C.C.H.",
    category: "Deductive Clue",
    era: "London (1884)",
    definition:
      "Charing Cross Hospital, the central London teaching hospital near the Strand. Watson initially guesses a local hunt (“something hunt”), before Holmes deduces the hospital presentation.",
    literaryNote:
      "Demonstrates Holmes’s axiom that a minor engraving on an everyday object can unlock a complete biographical portrait.",
  },
  {
    id: "convex_coffee_pot",
    term: "coffee-pot",
    category: "Optical Deduction",
    era: "221B Baker Street",
    definition:
      "A brightly polished silver breakfast coffee-pot whose convex surface acts as a wide-angle mirror on the table before Sherlock Holmes.",
    literaryNote:
      "Explains how Holmes appeared to have “eyes in the back of his head” while Watson examined the stick behind him.",
  },

  // Book III: Alice's Adventures in Wonderland
  {
    id: "daisy_chain",
    term: "daisy-chain",
    category: "Pastoral Pastime",
    era: "Victorian Oxford (1865)",
    definition:
      "A garland woven by slitting the stems of meadow daisies and threading them together—the quintessential occupation of a sleepy English summer afternoon.",
    literaryNote:
      "Sets the languid, sun-warmed tempo of reality just before the White Rabbit shatters it with pocket-watch urgency.",
  },
  {
    id: "waistcoat_pocket",
    term: "waistcoat-pocket",
    category: "Wonderland Detail",
    era: "1865",
    definition:
      "The small fob pocket in a gentleman’s tailored vest designed to hold a timepiece on a chain.",
    literaryNote:
      "Alice takes a talking rabbit in stride, yet realizes only when it produces a watch from a waistcoat-pocket that she has never seen such a rabbit before.",
  },
  {
    id: "orange_marmalade",
    term: "ORANGE MARMALADE",
    category: "Domestic Detail",
    era: "Victorian Nursery",
    definition:
      "Bitter Seville orange preserve kept in earthenware crocks in Victorian pantries and nurseries.",
    literaryNote:
      "Even while falling down a bottomless subterranean shaft, Alice politely refrains from dropping the empty jar for fear of hurting someone underneath.",
  },
  {
    id: "antipathies",
    term: "Antipathies",
    category: "Malapropism",
    era: "1865",
    definition:
      "Alice’s charmingly muddled word for the Antipodes—Australia and New Zealand, located on the opposite side of the terrestrial globe from England.",
    literaryNote:
      "Shows Alice’s eagerness to sound learned with her schoolroom geography lessons even when nobody is listening.",
  },

  // Book IV: The Time Machine
  {
    id: "recondite",
    term: "recondite",
    category: "Philosophical Vocabulary",
    era: "Fin-de-Siècle (1895)",
    definition:
      "Abstruse, esoteric, or beyond ordinary everyday comprehension—requiring specialized scientific or philosophical inquiry.",
    literaryNote:
      "Signals that the Time Traveller’s after-dinner conversation is about to leave Victorian parlour small-talk for speculative physics.",
  },
  {
    id: "lilies_of_silver",
    term: "lilies of silver",
    category: "Art Nouveau Lighting",
    era: "1895",
    definition:
      "Early domestic incandescent electric lamps set inside decorative silver lily-shaped sconces—a hallmark of progressive technological modernity in an 1890s home.",
    literaryNote:
      "Contrasts the cosy crackling hearth with the gleaming scientific apparatus of the Time Traveller’s household.",
  },
  {
    id: "four_dimensions",
    term: "Four Dimensions",
    category: "Theoretical Physics",
    era: "1895 (Pre-Minkowski)",
    definition:
      "The postulate that any real physical body must extend not only across Length, Breadth, and Thickness, but also across Duration in Time as a fourth coordinate axis.",
    literaryNote:
      "Written ten years before Einstein’s 1905 Special Relativity and Minkowski’s 1908 spacetime formalism, Wells frames Time as a navigable dimension.",
  },

  // Book V: The Adventures of Tom Sawyer
  {
    id: "state_pair",
    term: "state pair",
    category: "Domestic Humour",
    era: "1840s Missouri (1876)",
    definition:
      "Aunt Polly’s ceremonial spectacles worn for Sunday dignity and “style” rather than optical prescription—so weak she must peer over or under them to see.",
    literaryNote:
      "Immediately characterizes Aunt Polly’s blend of harmless vanity and affectionate domestic authority.",
  },
  {
    id: "stove_lids",
    term: "stove-lids",
    category: "Frontier Simile",
    era: "19th-Century American Kitchen",
    definition:
      "Heavy circular cast-iron covers lifted from the top of a wood-burning cookstove—completely opaque.",
    literaryNote:
      "Twain’s deadpan hyperbole: Aunt Polly’s prized spectacles are as useless for spotting a hiding boy as a pair of cast-iron stove-lids.",
  },
  {
    id: "old_scratch",
    term: "Old Scratch",
    category: "Folk Idiom",
    era: "19th-Century American Vernacular",
    definition:
      "A colloquial New England and frontier American nickname for the Devil or a spirit of relentless mischief.",
    literaryNote:
      "Aunt Polly attributes Tom’s uncanny ability to outwit her to Old Scratch, even as she laughs despite herself.",
  },

  // Sri Lankan Sinhala Stories (ජනකතා, නවකතා, සහ සම්භාව්‍ය කාව්‍ය)
  {
    id: "puskola_potha",
    term: "පුස්කොළ පොත",
    category: "Sri Lankan Manuscript Tradition",
    era: "Pre-Modern Ceylon",
    definition:
      "A traditional Sri Lankan palm-leaf manuscript (ola-leaf book) inscribed with an iron stylus (panhinda) on boiled and polished talipot palm strips, blackened with resin soot and gadumba oil.",
    literaryNote:
      "In the Mahadenamutta folktales, the sage blindly follows the literal text of his inherited puskola potha without common sense.",
  },
  {
    id: "mahadenamutta_term",
    term: "මහදැනමුත්තා",
    category: "Sinhala Folk Archetype",
    era: "18th-Century Ceylon Folklore",
    definition:
      "Literally “The Great All-Knowing Grandfather”—a beloved satirical figure in Sri Lankan Sinhala folklore accompanied by five comical disciples (Polbää Muna, Kotuwa,Indikatuwa, Rabboda, and Puvakbadilla).",
    literaryNote:
      "Satirizes pedantic book-learning divorced from practical village wisdom.",
  },
  {
    id: "andare_term",
    term: "අන්දරේ",
    category: "Kandyan Court Wit",
    era: "18th-Century Kingdom of Kandy",
    definition:
      "Born in Dickwella in southern Sri Lanka, Andare served as the celebrated court jester (Kavikara Maduwa) to the Kandyan kings, renowned for his impromptu Sinhala quatrains and good-natured pranks.",
    literaryNote:
      "His wit gently punctures royal pomp while remaining beloved by both monarch and villagers.",
  },
  {
    id: "madol_doova_term",
    term: "මඩොල් දූව",
    category: "Modern Sinhala Classic",
    era: "Martin Wickramasinghe (1947)",
    definition:
      "An islet fringed with kadolana (mangrove) trees in the serene Koggala lagoon of southern Sri Lanka, immortalized by Martin Wickramasinghe in his 1947 novel.",
    literaryNote:
      "Represents youthful independence, friendship, and harmony with the coastal landscape of southern Ceylon.",
  },
  {
    id: "satthantri_veena",
    term: "සත්තන්ත්‍රී වීණාව",
    category: "Classical Musical Instrument",
    era: "Kotte Period (c. 1470)",
    definition:
      "The classical seven-stringed arched harp or lute played by the Bodhisattva musician Guttila in Venerable Wättäwe Thero’s 15th-century Sinhala poem Guttila Kavya.",
    literaryNote:
      "Playing divine melodies even after all seven strings are snapped symbolizes spiritual humility triumphing over technical arrogance.",
  },
];

export interface TextSegment {
  text: string;
  note?: MarginaliaNote;
}

/**
 * Splits a paragraph into plain text segments and annotated Marginalia glossary terms.
 */
export function segmentTextWithMarginalia(text: string): TextSegment[] {
  if (!text) return [{ text: "" }];

  // Sort terms longest-first to avoid partial sub-matches
  const sortedNotes = [...CURATED_MARGINALIA_GLOSSARY].sort(
    (a, b) => b.term.length - a.term.length
  );

  // Build a single alternation regex for all glossary terms
  const escaped = sortedNotes.map((n) =>
    n.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");

  const parts = text.split(pattern);
  const segments: TextSegment[] = [];

  for (const part of parts) {
    if (!part) continue;
    const matchedNote = sortedNotes.find(
      (n) => n.term.toLowerCase() === part.toLowerCase()
    );
    if (matchedNote) {
      segments.push({ text: part, note: matchedNote });
    } else {
      segments.push({ text: part });
    }
  }

  return segments;
}
