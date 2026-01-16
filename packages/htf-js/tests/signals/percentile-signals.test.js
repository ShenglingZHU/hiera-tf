/**
 * Tests for percentile-based signals
 */
"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");

require("../setup.js");
const {
  computePercentile,
  ValueVsRollingPercentile,
  ValueVsRollingPercentileWithThreshold,
} = HTF;

describe("computePercentile", () => {
  it("should return null for empty array", () => {
    assert.strictEqual(computePercentile([], 50), null);
  });

  it("should return value for single element", () => {
    assert.strictEqual(computePercentile([10], 50), 10);
  });

  it("should return min for percentile 0", () => {
    assert.strictEqual(computePercentile([5, 1, 9, 3], 0), 1);
  });

  it("should return max for percentile 100", () => {
    assert.strictEqual(computePercentile([5, 1, 9, 3], 100), 9);
  });

  it("should compute median for odd count", () => {
    assert.strictEqual(computePercentile([1, 2, 3, 4, 5], 50), 3);
  });

  it("should interpolate median for even count", () => {
    const result = computePercentile([1, 2, 3, 4], 50);
    assert.ok(Math.abs(result - 2.5) < 0.001);
  });

  it("should handle unsorted input", () => {
    assert.strictEqual(computePercentile([5, 1, 4, 2, 3], 50), 3);
  });
});

describe("ValueVsRollingPercentile", () => {
  it("should initialize with valid parameters", () => {
    const sig = new ValueVsRollingPercentile({
      value_key: "val",
      window_size: 10,
      percentile: 50,
      min_history: 3,
    });
    assert.strictEqual(sig.value_key, "val");
    assert.strictEqual(sig.window_size, 10);
    assert.strictEqual(sig.percentile, 50);
    assert.strictEqual(sig.min_history, 3);
  });

  it("should throw on invalid comparison", () => {
    assert.throws(() => {
      new ValueVsRollingPercentile({
        value_key: "val",
        window_size: 10,
        comparison: "invalid",
      });
    }, /comparison must be 'gt' or 'lt'/);
  });

  it("should normalize comparison to lowercase", () => {
    const sig = new ValueVsRollingPercentile({
      value_key: "val",
      window_size: 10,
      comparison: "GT",
    });
    assert.strictEqual(sig.comparison, "gt");
  });

  it("should not trigger before min_history", () => {
    const sig = new ValueVsRollingPercentile({
      value_key: "val",
      window_size: 10,
      min_history: 5,
    });

    for (let i = 0; i < 4; i++) {
      assert.strictEqual(sig.update({ val: i }), 0);
    }
  });

  it("should trigger on gt comparison", () => {
    const sig = new ValueVsRollingPercentile({
      value_key: "val",
      window_size: 10,
      percentile: 50,
      min_history: 3,
      comparison: "gt",
    });

    sig.update({ val: 1 });
    sig.update({ val: 2 });
    sig.update({ val: 3 });

    // 10 > median of [1,2,3] = 2
    assert.strictEqual(sig.update({ val: 10 }), 1);
  });

  it("should not trigger when value <= percentile", () => {
    const sig = new ValueVsRollingPercentile({
      value_key: "val",
      window_size: 10,
      percentile: 50,
      min_history: 3,
      comparison: "gt",
    });

    sig.update({ val: 1 });
    sig.update({ val: 2 });
    sig.update({ val: 3 });

    // 1 <= median of [1,2,3] = 2
    assert.strictEqual(sig.update({ val: 1 }), 0);
  });

  it("should trigger on lt comparison", () => {
    const sig = new ValueVsRollingPercentile({
      value_key: "val",
      window_size: 10,
      percentile: 50,
      min_history: 3,
      comparison: "lt",
    });

    sig.update({ val: 10 });
    sig.update({ val: 20 });
    sig.update({ val: 30 });

    // 5 < median of [10,20,30] = 20
    assert.strictEqual(sig.update({ val: 5 }), 1);
  });

  it("should trim history to window_size", () => {
    const sig = new ValueVsRollingPercentile({
      value_key: "val",
      window_size: 3,
      min_history: 1,
    });

    for (let i = 0; i < 10; i++) {
      sig.update({ val: i });
    }

    assert.strictEqual(sig.history.length, 3);
  });

  it("should reset state", () => {
    const sig = new ValueVsRollingPercentile({
      value_key: "val",
      window_size: 10,
      min_history: 1,
    });

    sig.update({ val: 1 });
    sig.update({ val: 2 });
    sig.update({ val: 3 });

    sig.reset();

    assert.strictEqual(sig.history.length, 0);
    assert.strictEqual(sig.last_threshold, null);
  });
});

describe("ValueVsRollingPercentileWithThreshold", () => {
  it("should inherit from ValueVsRollingPercentile", () => {
    const sig = new ValueVsRollingPercentileWithThreshold({
      value_key: "val",
      window_size: 10,
      min_history: 3,
    });

    assert.ok(sig instanceof ValueVsRollingPercentile);
  });

  it("should record last_threshold", () => {
    const sig = new ValueVsRollingPercentileWithThreshold({
      value_key: "val",
      window_size: 10,
      percentile: 50,
      min_history: 3,
    });

    sig.update({ val: 1 });
    sig.update({ val: 2 });
    sig.update({ val: 3 });
    sig.update({ val: 10 });

    assert.ok(sig.last_threshold !== null);
    assert.ok(Math.abs(sig.last_threshold - 2) < 0.001);
  });
});
