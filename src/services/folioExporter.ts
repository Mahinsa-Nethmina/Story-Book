import { Storybook } from "../types";

function hexToRgb01(hex: string, fallback: [number, number, number]): [number, number, number] {
  const clean = (hex || "").replace(/^#/, "").trim();
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return [
        Number((r / 255).toFixed(3)),
        Number((g / 255).toFixed(3)),
        Number((b / 255).toFixed(3)),
      ];
    }
  }
  return fallback;
}

function sanitizePdfText(input: string): string {
  return (input || "")
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201F]/g, '"')
    .replace(/\u2014/g, " -- ")
    .replace(/\u2013/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00B7/g, " . ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapTextToLines(text: string, maxCharsPerLine: number): string[] {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxCharsPerLine) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface RasterizedJpeg {
  bytes: Uint8Array;
  width: number;
  height: number;
}

async function rasterizeImageUrlToJpeg(
  url?: string,
  targetWidth = 640,
  targetHeight = 360
): Promise<RasterizedJpeg | null> {
  if (!url || typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = window.setTimeout(() => {
      resolve(null);
    }, 3500);

    img.onload = () => {
      window.clearTimeout(timer);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#F6F2EA";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Cover-fit into 16:9 stage
        const srcW = img.naturalWidth || targetWidth;
        const srcH = img.naturalHeight || targetHeight;
        const scale = Math.max(targetWidth / srcW, targetHeight / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const offsetX = (targetWidth - drawW) / 2;
        const offsetY = (targetHeight - drawH) / 2;
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
        const base64 = dataUrl.split(",")[1];
        if (!base64) {
          resolve(null);
          return;
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        resolve({ bytes, width: targetWidth, height: targetHeight });
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };

    img.src = url;
  });
}

function slugifyFilename(title: string): string {
  return (
    (title || "folio-storybook")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "folio-storybook"
  );
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 400);
}

/**
 * Generates and downloads a structured Fine-Press PDF document capturing the current
 * Storybook state, palette, illustrations, dramatis personae, and folio dialogue turns.
 */
export async function downloadStorybookPdf(
  storybook: Storybook,
  currentPageIdx = 0
): Promise<string> {
  const PAGE_W = 612; // 8.5 in * 72 pt
  const PAGE_H = 792; // 11 in * 72 pt
  const MARGIN_X = 48;

  const pal = storybook.palette || {
    paper: "#F6F2EA",
    card: "#EFE9DC",
    ink: "#1E1B18",
    muted: "#7A7267",
    accent: "#4A6B53",
    rule: "#D5CBB8",
  };

  const paperRgb = hexToRgb01(pal.paper, [0.965, 0.949, 0.918]);
  const cardRgb = hexToRgb01(pal.card, [0.937, 0.914, 0.863]);
  const inkRgb = hexToRgb01(pal.ink, [0.118, 0.106, 0.094]);
  const mutedRgb = hexToRgb01(pal.muted, [0.478, 0.447, 0.404]);
  const accentRgb = hexToRgb01(pal.accent, [0.29, 0.42, 0.325]);
  const ruleRgb = hexToRgb01(pal.rule, [0.835, 0.796, 0.722]);

  // Pre-rasterize cover/character sheet + each folio's primary plate
  const coverJpeg = await rasterizeImageUrlToJpeg(
    storybook.charSheetImageUrl ||
      storybook.coverImageUrl ||
      storybook.pages?.[0]?.dioramaUrl ||
      storybook.pages?.[0]?.imageUrl
  );

  const pageJpegs = await Promise.all(
    (storybook.pages || []).map((p) =>
      rasterizeImageUrlToJpeg(p.dioramaUrl || p.imageUrl || storybook.coverImageUrl)
    )
  );

  // Build PDF objects using binary chunks so byte offsets in xref are 100% exact
  const encoder = new TextEncoder();
  const objects: Array<Uint8Array[]> = [];

  const addObject = (chunks: Array<string | Uint8Array>): number => {
    const encoded = chunks.map((c) =>
      typeof c === "string" ? encoder.encode(c) : c
    );
    objects.push(encoded);
    return objects.length; // 1-based object number
  };

  // 1: Catalog (placeholder, updated at end)
  const catalogObjNum = addObject([""]);
  // 2: Pages tree (placeholder, updated at end)
  const pagesTreeObjNum = addObject([""]);
  // 3: Font F1 (Times-Roman)
  const fontRomanObj = addObject([
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>",
  ]);
  // 4: Font F2 (Times-Bold)
  const fontBoldObj = addObject([
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>",
  ]);
  // 5: Font F3 (Times-Italic)
  const fontItalicObj = addObject([
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>",
  ]);
  // 6: Font F4 (Courier)
  const fontMonoObj = addObject([
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
  ]);

  const registerJpegXObject = (jpeg: RasterizedJpeg | null): number | null => {
    if (!jpeg) return null;
    return addObject([
      `<< /Type /XObject /Subtype /Image /Width ${jpeg.width} /Height ${jpeg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.bytes.byteLength} >>\nstream\n`,
      jpeg.bytes,
      "\nendstream",
    ]);
  };

  const coverImgObj = registerJpegXObject(coverJpeg);
  const folioImgObjs = pageJpegs.map((j) => registerJpegXObject(j));

  const pageObjectNumbers: number[] = [];

  const drawArchivalPageShell = (
    headerLeft: string,
    headerRight: string,
    footerLeft: string,
    footerRight: string
  ): string[] => {
    const cmds: string[] = [];
    // Paper background
    cmds.push(`${paperRgb.join(" ")} rg`);
    cmds.push(`0 0 ${PAGE_W} ${PAGE_H} re f`);

    // Top & bottom hairline rules
    cmds.push(`${ruleRgb.join(" ")} RG 0.75 w`);
    cmds.push(`${MARGIN_X} ${PAGE_H - 42} m ${PAGE_W - MARGIN_X} ${PAGE_H - 42} l S`);
    cmds.push(`${MARGIN_X} ${PAGE_H - 68} m ${PAGE_W - MARGIN_X} ${PAGE_H - 68} l S`);
    cmds.push(`${MARGIN_X} 58 m ${PAGE_W - MARGIN_X} 58 l S`);
    cmds.push(`${MARGIN_X} 36 m ${PAGE_W - MARGIN_X} 36 l S`);

    // Running Header
    cmds.push("BT");
    cmds.push(`/F2 8.5 Tf ${mutedRgb.join(" ")} rg`);
    cmds.push(`${MARGIN_X} ${PAGE_H - 58} Td (${sanitizePdfText(headerLeft.toUpperCase())}) Tj`);
    cmds.push("ET");

    const rightHeaderClean = sanitizePdfText(headerRight.toUpperCase());
    const rightHeaderX = Math.max(
      MARGIN_X + 240,
      PAGE_W - MARGIN_X - rightHeaderClean.length * 4.8
    );
    cmds.push("BT");
    cmds.push(`/F2 8.5 Tf ${mutedRgb.join(" ")} rg`);
    cmds.push(`${rightHeaderX.toFixed(1)} ${PAGE_H - 58} Td (${rightHeaderClean}) Tj`);
    cmds.push("ET");

    // Running Footer
    cmds.push("BT");
    cmds.push(`/F2 8.5 Tf ${mutedRgb.join(" ")} rg`);
    cmds.push(`${MARGIN_X} 44 Td (${sanitizePdfText(footerLeft.toUpperCase())}) Tj`);
    cmds.push("ET");

    const rightFooterClean = sanitizePdfText(footerRight.toUpperCase());
    const rightFooterX = Math.max(
      MARGIN_X + 240,
      PAGE_W - MARGIN_X - rightFooterClean.length * 4.8
    );
    cmds.push("BT");
    cmds.push(`/F2 8.5 Tf ${mutedRgb.join(" ")} rg`);
    cmds.push(`${rightFooterX.toFixed(1)} 44 Td (${rightFooterClean}) Tj`);
    cmds.push("ET");

    return cmds;
  };

  const commitPage = (
    cmds: string[],
    imageResources: Array<{ name: string; objNum: number }> = []
  ) => {
    const streamStr = cmds.join("\n");
    const streamBytes = encoder.encode(streamStr);
    const contentObjNum = addObject([
      `<< /Length ${streamBytes.byteLength} >>\nstream\n`,
      streamBytes,
      "\nendstream",
    ]);

    const xObjDict =
      imageResources.length > 0
        ? `/XObject << ${imageResources
            .map((ir) => `/${ir.name} ${ir.objNum} 0 R`)
            .join(" ")} >>`
        : "";

    const pageObjNum = addObject([
      `<< /Type /Page /Parent ${pagesTreeObjNum} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 ${fontRomanObj} 0 R /F2 ${fontBoldObj} 0 R /F3 ${fontItalicObj} 0 R /F4 ${fontMonoObj} 0 R >> ${xObjDict} >> >>`,
    ]);
    pageObjectNumbers.push(pageObjNum);
  };

  // ============================================================================
  // PAGE 1: TITLE LEAF, CHARACTER PLATE & DRAMATIS PERSONAE
  // ============================================================================
  {
    const cmds = drawArchivalPageShell(
      `THE FOLIO & VOICE PRESS  .  BOOK ${storybook.roman || "I"}`,
      storybook.year || "1813",
      storybook.genreFooterLeft || "ILLUSTRATED LITERARY FOLIO",
      `ACTIVE READER FOLIO: ${storybook.roman || "I"}.${currentPageIdx + 1}`
    );

    let y = PAGE_H - 115;

    // Rubric
    cmds.push("BT");
    cmds.push(`/F2 10 Tf ${accentRgb.join(" ")} rg`);
    cmds.push(
      `${MARGIN_X} ${y} Td (${sanitizePdfText(
        `BOOK ${storybook.roman || "I"}  .  ${
          storybook.genreFooterLeft || "ILLUSTRATED AUDIOBOOK EDITION"
        }`
      )}) Tj`
    );
    cmds.push("ET");
    y -= 34;

    // Main Title
    const titleLines = wrapTextToLines(storybook.title, 36);
    for (const tLine of titleLines) {
      cmds.push("BT");
      cmds.push(`/F2 26 Tf ${inkRgb.join(" ")} rg`);
      cmds.push(`${MARGIN_X} ${y} Td (${sanitizePdfText(tLine)}) Tj`);
      cmds.push("ET");
      y -= 30;
    }

    // Author & Year
    cmds.push("BT");
    cmds.push(`/F2 11 Tf ${mutedRgb.join(" ")} rg`);
    cmds.push(
      `${MARGIN_X} ${y} Td (${sanitizePdfText(
        `${storybook.author.toUpperCase()}   .   ${storybook.year || "1813"}`
      )}) Tj`
    );
    cmds.push("ET");
    y -= 22;

    // Subtitle & Setting
    cmds.push("BT");
    cmds.push(`/F3 13 Tf ${inkRgb.join(" ")} rg`);
    cmds.push(
      `${MARGIN_X} ${y} Td (${sanitizePdfText(
        `${storybook.subtitle || "Chapter I"} -- ${
          storybook.settingFooterRight || "Archival Chamber Edition"
        }`
      )}) Tj`
    );
    cmds.push("ET");
    y -= 18;

    // Diamond Rule
    cmds.push(`${ruleRgb.join(" ")} RG 0.75 w`);
    cmds.push(`${MARGIN_X} ${y} m ${PAGE_W - MARGIN_X} ${y} l S`);
    y -= 20;

    // Matted 16:9 Plate Box (width = 516, height = 250)
    const matW = PAGE_W - MARGIN_X * 2;
    const matH = 248;
    const matY = y - matH;
    cmds.push(`${cardRgb.join(" ")} rg ${ruleRgb.join(" ")} RG 0.75 w`);
    cmds.push(`${MARGIN_X} ${matY} ${matW} ${matH} re B`);

    const imgResources: Array<{ name: string; objNum: number }> = [];
    if (coverImgObj !== null) {
      const pad = 10;
      const imgW = matW - pad * 2;
      const imgH = matH - 34;
      const imgX = MARGIN_X + pad;
      const imgY = matY + 24;
      cmds.push("q");
      cmds.push(`${imgW} 0 0 ${imgH} ${imgX} ${imgY} cm`);
      cmds.push("/ImCover Do");
      cmds.push("Q");
      imgResources.push({ name: "ImCover", objNum: coverImgObj });
    } else {
      const promptLines = wrapTextToLines(
        storybook.charSheetPrompt || storybook.coverImagePrompt || storybook.title,
        72
      );
      let py = matY + matH - 55;
      for (const pl of promptLines.slice(0, 5)) {
        cmds.push("BT");
        cmds.push(`/F3 10.5 Tf ${mutedRgb.join(" ")} rg`);
        cmds.push(`${MARGIN_X + 20} ${py} Td (${sanitizePdfText(pl)}) Tj`);
        cmds.push("ET");
        py -= 15;
      }
    }

    cmds.push("BT");
    cmds.push(`/F2 8.5 Tf ${accentRgb.join(" ")} rg`);
    cmds.push(
      `${MARGIN_X + 12} ${matY + 8} Td (FRONTISPIECE & CHARACTER REFERENCE SHEET) Tj`
    );
    cmds.push("ET");

    y = matY - 28;

    // Dramatis Personae / Voice Cast
    cmds.push("BT");
    cmds.push(`/F2 9.5 Tf ${accentRgb.join(" ")} rg`);
    cmds.push(`${MARGIN_X} ${y} Td (DRAMATIS PERSONAE & GEMINI TTS VOICE CAST) Tj`);
    cmds.push("ET");
    y -= 18;

    for (const char of (storybook.characters || []).slice(0, 6)) {
      const line = `${char.name} (${char.voiceName}) -- ${char.role}: ${char.voiceStyle}`;
      for (const wrapped of wrapTextToLines(line, 84)) {
        cmds.push("BT");
        cmds.push(`/F1 10.5 Tf ${inkRgb.join(" ")} rg`);
        cmds.push(`${MARGIN_X} ${y} Td (${sanitizePdfText(wrapped)}) Tj`);
        cmds.push("ET");
        y -= 14;
      }
    }

    y -= 10;
    if (storybook.musicPrompt) {
      cmds.push("BT");
      cmds.push(`/F2 9 Tf ${accentRgb.join(" ")} rg`);
      cmds.push(`${MARGIN_X} ${y} Td (LYRIA 3.5 CHAMBER SCORE DIRECTION) Tj`);
      cmds.push("ET");
      y -= 14;

      for (const mLine of wrapTextToLines(storybook.musicPrompt, 86).slice(0, 3)) {
        cmds.push("BT");
        cmds.push(`/F3 10 Tf ${mutedRgb.join(" ")} rg`);
        cmds.push(`${MARGIN_X} ${y} Td (${sanitizePdfText(mLine)}) Tj`);
        cmds.push("ET");
        y -= 13;
      }
    }

    commitPage(cmds, imgResources);
  }

  // ============================================================================
  // PAGES 2..N: INDIVIDUAL FOLIO SPREADS (PLATES + DIALOGUE & NARRATION TURNS)
  // ============================================================================
  const pages = storybook.pages || [];
  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const folioLabel =
      page.folioLabel || `FOLIO ${storybook.roman || "I"}.${pIdx + 1}`;
    const isCurrentReaderFolio = pIdx === currentPageIdx;

    const cmds = drawArchivalPageShell(
      storybook.bookHeaderLeft ||
        `BOOK ${storybook.roman || "I"}  .  ${storybook.author.toUpperCase()}`,
      `${folioLabel}${isCurrentReaderFolio ? "  [ACTIVE FOLIO]" : ""}`,
      storybook.genreFooterLeft || "ILLUSTRATED LITERARY FOLIO",
      `${storybook.settingFooterRight || storybook.title.toUpperCase()}  .  PAGE ${
        pIdx + 2
      }`
    );

    let y = PAGE_H - 92;

    // Matted 16:9 Scene Plate at top of Folio page
    const matW = PAGE_W - MARGIN_X * 2;
    const matH = 212;
    const matY = y - matH;
    cmds.push(`${cardRgb.join(" ")} rg ${ruleRgb.join(" ")} RG 0.75 w`);
    cmds.push(`${MARGIN_X} ${matY} ${matW} ${matH} re B`);

    const pageImgObj = folioImgObjs[pIdx];
    const imgResources: Array<{ name: string; objNum: number }> = [];
    const imgResName = `ImFolio${pIdx + 1}`;

    if (pageImgObj !== null && pageImgObj !== undefined) {
      const pad = 8;
      const imgW = matW - pad * 2;
      const imgH = matH - 30;
      const imgX = MARGIN_X + pad;
      const imgY = matY + 22;
      cmds.push("q");
      cmds.push(`${imgW} 0 0 ${imgH} ${imgX} ${imgY} cm`);
      cmds.push(`/${imgResName} Do`);
      cmds.push("Q");
      imgResources.push({ name: imgResName, objNum: pageImgObj });
    } else {
      const promptLines = wrapTextToLines(
        page.illustrationPrompt || page.narrativeText,
        74
      );
      let py = matY + matH - 42;
      for (const pl of promptLines.slice(0, 4)) {
        cmds.push("BT");
        cmds.push(`/F3 10 Tf ${mutedRgb.join(" ")} rg`);
        cmds.push(`${MARGIN_X + 16} ${py} Td (${sanitizePdfText(pl)}) Tj`);
        cmds.push("ET");
        py -= 14;
      }
    }

    // Plate Number & Caption row inside mat
    const plateRubric =
      page.plates?.[0]?.plateLabel ||
      `PLATE ${pIdx + 1} OF ${pages.length}`;
    cmds.push("BT");
    cmds.push(`/F2 8.5 Tf ${accentRgb.join(" ")} rg`);
    cmds.push(`${MARGIN_X + 10} ${matY + 7} Td (${sanitizePdfText(plateRubric)}) Tj`);
    cmds.push("ET");

    const captionClean = sanitizePdfText(page.imageCaption || page.chapterTitle);
    const captionX = Math.max(
      MARGIN_X + 180,
      PAGE_W - MARGIN_X - 10 - captionClean.length * 4.7
    );
    cmds.push("BT");
    cmds.push(`/F3 9.5 Tf ${mutedRgb.join(" ")} rg`);
    cmds.push(`${captionX.toFixed(1)} ${matY + 7} Td (${captionClean}) Tj`);
    cmds.push("ET");

    y = matY - 24;

    // Folio Chapter Title & Rubric
    cmds.push("BT");
    cmds.push(`/F2 10 Tf ${accentRgb.join(" ")} rg`);
    cmds.push(
      `${MARGIN_X} ${y} Td (${sanitizePdfText(
        `${folioLabel}  .  ${page.chapterTitle || "CHAPTER I"}  --  ${
          page.imageCaption || ""
        }`
      )}) Tj`
    );
    cmds.push("ET");
    y -= 10;

    cmds.push(`${ruleRgb.join(" ")} RG 0.5 w`);
    cmds.push(`${MARGIN_X} ${y} m ${PAGE_W - MARGIN_X} ${y} l S`);
    y -= 20;

    // Render Dialogue & Narration Turns
    const turns =
      page.dialogueLines && page.dialogueLines.length > 0
        ? page.dialogueLines
        : [
            {
              speaker: "Narrator",
              speakerLabel: "NARRATOR",
              voiceRoleLabel: "Literary Narration",
              isDialogue: false,
              voiceName: "Kore",
              text: page.narrativeText || "",
            },
          ];

    for (const turn of turns) {
      if (y < 95) break;

      const speakerHeader = `${
        turn.speakerLabel || turn.speaker.toUpperCase()
      }  --  ${turn.voiceRoleLabel || (turn.isDialogue ? "Character Dialogue" : "Literary Narration")} (${
        turn.voiceName || "Kore"
      })`;

      cmds.push("BT");
      cmds.push(
        `/F2 8.5 Tf ${(turn.isDialogue ? accentRgb : mutedRgb).join(" ")} rg`
      );
      cmds.push(`${MARGIN_X} ${y} Td (${sanitizePdfText(speakerHeader)}) Tj`);
      cmds.push("ET");
      y -= 15;

      const wrappedLines = wrapTextToLines(turn.text, 78);
      for (const line of wrappedLines) {
        if (y < 76) break;
        cmds.push("BT");
        cmds.push(
          `/${turn.isDialogue ? "F3" : "F1"} 12 Tf ${inkRgb.join(" ")} rg`
        );
        cmds.push(`${MARGIN_X} ${y} Td (${sanitizePdfText(line)}) Tj`);
        cmds.push("ET");
        y -= 15.5;
      }

      y -= 10;
    }

    commitPage(cmds, imgResources);
  }

  // Finalize Catalog & Pages Tree objects
  objects[catalogObjNum - 1] = [
    encoder.encode(`<< /Type /Catalog /Pages ${pagesTreeObjNum} 0 R >>`),
  ];
  objects[pagesTreeObjNum - 1] = [
    encoder.encode(
      `<< /Type /Pages /Kids [${pageObjectNumbers
        .map((n) => `${n} 0 R`)
        .join(" ")}] /Count ${pageObjectNumbers.length} >>`
    ),
  ];

  // Assemble final PDF binary with exact byte offsets
  const pdfChunks: Uint8Array[] = [];
  let byteOffset = 0;
  const pushChunk = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    pdfChunks.push(bytes);
    byteOffset += bytes.byteLength;
  };

  pushChunk("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(byteOffset);
    pushChunk(`${i + 1} 0 obj\n`);
    for (const part of objects[i]) {
      pushChunk(part);
    }
    pushChunk("\nendobj\n");
  }

  const startXref = byteOffset;
  pushChunk(`xref\n0 ${objects.length + 1}\n`);
  pushChunk("0000000000 65535 f \n");
  for (const off of offsets) {
    pushChunk(`${String(off).padStart(10, "0")} 00000 n \n`);
  }

  pushChunk(
    `trailer\n<< /Size ${
      objects.length + 1
    } /Root ${catalogObjNum} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`
  );

  const filename = `${slugifyFilename(storybook.title)}-folio.pdf`;
  const blob = new Blob(pdfChunks, { type: "application/pdf" });
  triggerBlobDownload(blob, filename);
  return filename;
}
