/**
 * Tests for EMA-based signals
 */
"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");

require("../setup.js");
const { SignalEMAFastSlowComparison, SignalEMADiffVsHistoryPercentile } = HTF;

describe("SignalEMAFastSlowComparison", () => {
  it("should initialize with parameters", () => {
    const sig = new SignalEMAFastSlowComparison({
      value_key: "val",
      ema_period_1: 5,
      ema_period_2: 10,
      prefer: "fast",
    });
    assert.strictEqual(sig.value_key, "val");
    assert.strictEqual(sig.ema_period_1, 5);
    assert.strictEqual(sig.ema_period_2, 10);
    assert.strictEqual(sig.prefer, "fast");
  });

  it("should throw if ema periods are zero", () => {
    assert.throws(() => {
      new SignalEMAFastSlowComparison({
        value_key: "val",
        ema_period_1: 0,
        ema_period_2: 10,
      });
    }, /EMA periods must be > 0/);
  });

  it("should throw if ema periods are equal", () => {
    assert.throws(() => {
      new SignalEMAFastSlowComparison({
        value_key: "val",
        ema_period_1: 5,
        ema_period_2: 5,
      });
    }, /ema_period_1 and ema_period_2 must differ/);
  });

  it("should throw on invalid prefer", () => {
    assert.throws(() => {
      new SignalEMAFastSlowComparison({
        value_key: "val",
        ema_period_1: 5,
        ema_period_2: 10,
        prefer: "invalid",
      });
    }, /prefer must be 'fast' or 'slow'/);
  });

  it("should compute EMA correctly", () => {
    const sig = new SignalEMAFastSlowComparison({
      value_key: "val",
      ema_period_1: 2,
      ema_period_2: 5,
      prefer: "fast",
    });

    sig.update({ val: 10 });
    sig.update({ val: 20 });
    sig.update({ val: 30 });

    assert.ok(sig.ema_1 !== null);
    assert.ok(sig.ema_2 !== null);
  });

  it("should trigger when fast EMA > slow EMA with prefer fast", () => {
    const sig = new SignalEMAFastSlowComparison({
      value_key: "val",
      ema_period_1: 2,
      ema_period_2: 10,
      prefer: "fast",
    });

    // Build up slow EMA
    for (let i = 0; i < 10; i++) {
      sig.update({ val: 10 });
    }

    // Spike should make fast > slow
    const result = sig.update({ val: 50 });
    assert.strictEqual(result, 1);
  });

  it("should trigger when slow EMA > fast EMA with prefer slow", () => {
    const sig = new SignalEMAFastSlowComparison({
      value_key: "val",
      ema_period_1: 2,
      ema_period_2: 10,
      prefer: "slow",
    });

    // Build up slow EMA at high level
    for (let i = 0; i < 10; i++) {
      sig.update({ val: 100 });
    }

    // Drop should make slow > fast
    const result = sig.update({ val: 10 });
    assert.strictEqual(result, 1);
  });

  it("should reset state", () => {
    const sig = new SignalEMAFastSlowComparison({
      value_key: "val",
      ema_period_1: 2,
      ema_period_2: 5,
    });

    sig.update({ val: 10 });
    sig.update({ val: 20 });

    sig.reset();

    assert.strictEqual(sig.ema_1, null);
    assert.strictEqual(sig.ema_2, null);
  });
});

describe("SignalEMADiffVsHistoryPercentile", () => {
  it("should initialize with parameters", () => {
    const sig = new SignalEMADiffVsHistoryPercentile({
      value_key: "val",
      ema_period_1: 5,
      ema_period_2: 10,
      history_window: 50,
      percentile: 90,
    });
    assert.strictEqual(sig.ema_period_1, 5);
    assert.strictEqual(sig.ema_period_2, 10);
    assert.strictEqual(sig.history_window, 50);
    assert.strictEqual(sig.percentile, 90);
  });

  it("should throw if ema periods are zero", () => {
    assert.throws(() => {
      new SignalEMADiffVsHistoryPercentile({
        value_key: "val",
        ema_period_1: 0,
        ema_period_2: 5,
        history_window: 10,
      });
    }, /EMA periods must be > 0/);
  });

  it("should throw if history_window is invalid", () => {
    assert.throws(() => {
      new SignalEMADiffVsHistoryPercentile({
        value_key: "val",
        ema_period_1: 5,
        ema_period_2: 10,
        history_window: 0,
      });
    }, /history_window must be > 0/);
  });

  it("should not trigger before min_history", () => {
    const sig = new SignalEMADiffVsHistoryPercentile({
      value_key: "val",
      ema_period_1: 2,
      ema_period_2: 5,
      history_window: 20,
      min_history: 10,
    });

    for (let i = 0; i < 8; i++) {
      assert.strictEqual(sig.update({ val: 10 + i }), 0);
    }
  });

  it("should record diff history", () => {
    const sig = new SignalEMADiffVsHistoryPercentile({
      value_key: "val",
      ema_period_1: 2,
      ema_period_2: 5,
      history_window: 20,
      min_history: 1,
    });

    for (let i = 0; i < 5; i++) {
      sig.update({ val: 10 + i });
    }

    assert.ok(sig.abs_diff_history.length > 0);
  });
});
