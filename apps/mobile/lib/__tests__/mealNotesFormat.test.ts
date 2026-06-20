import assert from "node:assert/strict";
import test from "node:test";
import {
  applyBulletPrefix,
  applyNotesFormat,
  parseInlineNotes,
  wrapNotesSelection,
} from "../mealNotesFormat";

test("wrapNotesSelection wraps selected text in markers", () => {
  const result = wrapNotesSelection("hello world", { start: 0, end: 5 }, "**", 500);
  assert.equal(result.text, "**hello** world");
  assert.deepEqual(result.selection, { start: 2, end: 7 });
});

test("applyNotesFormat inserts empty markers at cursor", () => {
  const result = applyNotesFormat("hello", { start: 5, end: 5 }, "italic", 500);
  assert.equal(result.text, "hello**");
  assert.equal(result.selection.start, 6);
});

test("applyBulletPrefix adds bullets to selected lines", () => {
  const result = applyBulletPrefix("line one\nline two", { start: 0, end: 16 }, 500);
  assert.equal(result.text, "- line one\n- line two");
});

test("applyBulletPrefix removes bullets when all lines are bulleted", () => {
  const result = applyBulletPrefix("- line one\n- line two", { start: 0, end: 22 }, 500);
  assert.equal(result.text, "line one\nline two");
});

test("parseInlineNotes parses bold and italic segments", () => {
  assert.deepEqual(parseInlineNotes("**bold** and *italic*"), [
    { kind: "bold", text: "bold" },
    { kind: "text", text: " and " },
    { kind: "italic", text: "italic" },
  ]);
});
