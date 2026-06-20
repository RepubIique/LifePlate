export type NotesSelection = { start: number; end: number };

export type NotesInlineSegment =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string };

export function clampNotesSelection(text: string, selection: NotesSelection): NotesSelection {
  const len = text.length;
  return {
    start: Math.max(0, Math.min(selection.start, len)),
    end: Math.max(0, Math.min(selection.end, len)),
  };
}

export function wrapNotesSelection(
  text: string,
  selection: NotesSelection,
  wrapper: string,
  maxLength: number,
): { text: string; selection: NotesSelection } {
  const { start, end } = clampNotesSelection(text, selection);
  const selected = text.slice(start, end);
  const wrapped = selected ? `${wrapper}${selected}${wrapper}` : `${wrapper}${wrapper}`;
  const before = text.slice(0, start);
  const after = text.slice(end);
  const nextText = (before + wrapped + after).slice(0, maxLength);

  if (!selected) {
    const cursor = Math.min(before.length + wrapper.length, nextText.length);
    return { text: nextText, selection: { start: cursor, end: cursor } };
  }

  const innerStart = before.length + wrapper.length;
  const innerEnd = Math.min(innerStart + selected.length, nextText.length);
  return { text: nextText, selection: { start: innerStart, end: innerEnd } };
}

export function applyNotesFormat(
  text: string,
  selection: NotesSelection,
  format: "bold" | "italic",
  maxLength: number,
): { text: string; selection: NotesSelection } {
  return wrapNotesSelection(text, selection, format === "bold" ? "**" : "*", maxLength);
}

export function applyBulletPrefix(
  text: string,
  selection: NotesSelection,
  maxLength: number,
): { text: string; selection: NotesSelection } {
  const { start, end } = clampNotesSelection(text, selection);
  const lineStart = text.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lineEnd = text.indexOf("\n", end);
  const blockEnd = lineEnd === -1 ? text.length : lineEnd;
  const block = text.slice(lineStart, blockEnd);

  const lines = block.split("\n");
  const allBulleted = lines.every((line) => line === "" || line.startsWith("- "));
  const nextLines = lines.map((line) => {
    if (!line) return line;
    if (allBulleted) return line.startsWith("- ") ? line.slice(2) : line;
    return line.startsWith("- ") ? line : `- ${line}`;
  });
  const nextBlock = nextLines.join("\n");
  const before = text.slice(0, lineStart);
  const after = text.slice(blockEnd);
  const nextText = (before + nextBlock + after).slice(0, maxLength);
  const cursor = Math.min(lineStart + nextBlock.length, nextText.length);
  return { text: nextText, selection: { start: cursor, end: cursor } };
}

export function parseInlineNotes(text: string): NotesInlineSegment[] {
  const segments: NotesInlineSegment[] = [];
  let i = 0;

  while (i < text.length) {
    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        segments.push({ kind: "bold", text: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    if (text[i] === "*" && text[i + 1] !== "*") {
      const end = text.indexOf("*", i + 1);
      if (end !== -1 && text[end + 1] !== "*") {
        segments.push({ kind: "italic", text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    let j = i + 1;
    while (j < text.length && text[j] !== "*" && !text.startsWith("**", j)) {
      j += 1;
    }
    segments.push({ kind: "text", text: text.slice(i, j) });
    i = j;
  }

  return segments.length ? segments : [{ kind: "text", text: "" }];
}
