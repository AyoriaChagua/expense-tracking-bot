import assert from "node:assert/strict";
import { test } from "node:test";
import { rangeBounds, toLimaDateTime } from "./dates.ts";

// 2026-11-20 03:00 UTC is Thursday 2026-11-19 22:00 in Lima.
const thuNight = new Date("2026-11-20T03:00:00Z");

test("today starts at Lima midnight, not UTC midnight", () => {
  assert.deepEqual(rangeBounds("today", thuNight), { from: "2026-11-19 00:00", to: "2026-11-19 22:00" });
});

test("week starts on Monday", () => {
  assert.equal(rangeBounds("week", thuNight).from, "2026-11-16 00:00");
});

test("week on a Sunday goes back to the previous Monday", () => {
  assert.equal(rangeBounds("week", new Date("2026-11-22T15:00:00Z")).from, "2026-11-16 00:00");
});

test("week on a Monday starts that same day", () => {
  assert.equal(rangeBounds("week", new Date("2026-11-16T05:00:00Z")).from, "2026-11-16 00:00");
});

test("month uses Lima date when UTC is already next month", () => {
  // 2026-12-01 03:00 UTC is still 2026-11-30 in Lima.
  assert.deepEqual(rangeBounds("month", new Date("2026-12-01T03:00:00Z")), {
    from: "2026-11-01 00:00",
    to: "2026-11-30 22:00",
  });
});

test("Telegram unix date converts to Lima time", () => {
  assert.equal(toLimaDateTime(Date.UTC(2026, 10, 18, 3, 0) / 1000), "2026-11-17T22:00");
});
