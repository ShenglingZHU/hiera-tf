/**
 * Tests for htf/utils.js
 */
"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");

require("./setup.js");
const { normalizeFlagSeries, truthyWindows, mapWindowsToMask } = HTF.utils;

describe("normalizeFlagSeries", () => {
  it("should return empty array for empty input with length 0", () => {
    const result = normalizeFlagSeries([], 0, false);
    assert.deepStrictEqual(result, []);
  });

  it("should fill with fillValue when flags is empty", () => {
    const result = normalizeFlagSeries([], 5, false);
    assert.deepStrictEqual(result, [false, false, false, false, false]);
  });

  it("should fill with true when fillValue is true", () => {
    const result = normalizeFlagSeries([], 3, true);
    assert.deepStrictEqual(result, [true, true, true]);
  });

  it("should truncate when flags longer than length", () => {
    const result = normalizeFlagSeries([true, true, true, true], 2, false);
    assert.deepStrictEqual(result, [true, true]);
  });

  it("should pad when flags shorter than length", () => {
    const result = normalizeFlagSeries([true, false], 5, false);
    assert.deepStrictEqual(result, [true, false, false, false, false]);
  });

  it("should convert truthy values to boolean", () => {
    const result = normalizeFlagSeries([1, 0, "yes", null], 4, false);
    assert.deepStrictEqual(result, [true, false, true, false]);
  });
});

describe("truthyWindows", () => {
  it("should return empty array for all false", () => {
    const flags = [false, false, false];
    const xs = [1, 2, 3];
    const result = truthyWindows(flags, xs);
    assert.deepStrictEqual(result, []);
  });

  it("should return single window for all true", () => {
    const flags = [true, true, true];
    const xs = [1, 2, 3];
    const result = truthyWindows(flags, xs);
    assert.deepStrictEqual(result, [[1, 3]]);
  });

  it("should extract multiple windows", () => {
    const flags = [true, true, false, true, true, true, false];
    const xs = [1, 2, 3, 4, 5, 6, 7];
    const result = truthyWindows(flags, xs);
    assert.deepStrictEqual(result, [[1, 2], [4, 6]]);
  });

  it("should handle window at end", () => {
    const flags = [false, false, true, true];
    const xs = [1, 2, 3, 4];
    const result = truthyWindows(flags, xs);
    assert.deepStrictEqual(result, [[3, 4]]);
  });

  it("should handle single true value", () => {
    const flags = [false, true, false];
    const xs = [1, 2, 3];
    const result = truthyWindows(flags, xs);
    assert.deepStrictEqual(result, [[2, 2]]);
  });
});

describe("mapWindowsToMask", () => {
  it("should return empty array for empty timestamps", () => {
    const result = mapWindowsToMask([[1, 5]], []);
    assert.deepStrictEqual(result, []);
  });

  it("should return all false for empty windows", () => {
    const result = mapWindowsToMask([], [1, 2, 3]);
    assert.deepStrictEqual(result, [false, false, false]);
  });

  it("should map single window correctly", () => {
    const windows = [[2, 4]];
    const timestamps = [1, 2, 3, 4, 5];
    const result = mapWindowsToMask(windows, timestamps);
    assert.deepStrictEqual(result, [false, true, true, true, false]);
  });

  it("should map multiple windows correctly", () => {
    const windows = [[1, 2], [4, 5]];
    const timestamps = [1, 2, 3, 4, 5];
    const result = mapWindowsToMask(windows, timestamps);
    assert.deepStrictEqual(result, [true, true, false, true, true]);
  });

  it("should handle non-overlapping windows", () => {
    const windows = [[1, 1], [5, 5]];
    const timestamps = [1, 2, 3, 4, 5];
    const result = mapWindowsToMask(windows, timestamps);
    assert.deepStrictEqual(result, [true, false, false, false, true]);
  });
});
