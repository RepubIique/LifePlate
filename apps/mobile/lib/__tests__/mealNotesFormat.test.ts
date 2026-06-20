import assert from "node:assert/strict";
import test from "node:test";
import {
  applyBulletPrefix,
  applyNotesFormat,
  filterFriendsForMention,
  formatFriendMention,
  getActiveMentionQuery,
  insertFriendMention,
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

test("formatFriendMention builds a stable token", () => {
  assert.equal(
    formatFriendMention({ id: "11111111-1111-1111-1111-111111111111", name: "Sam" }),
    "@[Sam](11111111-1111-1111-1111-111111111111)",
  );
});

test("getActiveMentionQuery detects an in-progress mention", () => {
  assert.deepEqual(getActiveMentionQuery("Dinner with @Sa", 15), {
    query: "Sa",
    start: 12,
  });
  assert.equal(getActiveMentionQuery("Dinner with @[Sam](11111111-1111-1111-1111-111111111111)", 20), null);
});

test("insertFriendMention replaces an active mention query", () => {
  const friend = { id: "11111111-1111-1111-1111-111111111111", name: "Sam" };
  const result = insertFriendMention("Dinner with @Sa", { start: 15, end: 15 }, friend, 500);
  assert.equal(result.text, "Dinner with @[Sam](11111111-1111-1111-1111-111111111111) ");
});

test("parseInlineNotes parses friend mentions", () => {
  assert.deepEqual(
    parseInlineNotes("Dinner with @[Sam](11111111-1111-1111-1111-111111111111)!"),
    [
      { kind: "text", text: "Dinner with " },
      {
        kind: "mention",
        name: "Sam",
        friendId: "11111111-1111-1111-1111-111111111111",
      },
      { kind: "text", text: "!" },
    ],
  );
});
