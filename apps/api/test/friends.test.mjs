import assert from "node:assert/strict";
import test from "node:test";
import {
  FRIEND_CODE_LENGTH,
  generateFriendCode,
  normalizeFriendCode,
} from "../dist/services/friendCodes.js";
import { friendshipPair } from "../dist/services/friendships.js";

test("generateFriendCode produces codes of expected length", () => {
  const code = generateFriendCode();
  assert.equal(code.length, FRIEND_CODE_LENGTH);
  assert.match(code, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/);
});

test("normalizeFriendCode trims and uppercases", () => {
  assert.equal(normalizeFriendCode("  abcd12  "), "ABCD12");
});

test("friendshipPair orders UUIDs consistently", () => {
  const a = "00000000-0000-0000-0000-000000000002";
  const b = "00000000-0000-0000-0000-000000000001";
  assert.deepEqual(friendshipPair(a, b), [b, a]);
  assert.deepEqual(friendshipPair(b, a), [b, a]);
});
