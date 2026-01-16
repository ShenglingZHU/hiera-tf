/**
 * Tests for comparison-based signals
 */
"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");

require("../setup.js");
const {
  SignalValueVsLastTrueReference,
  SignalValueVsLastTargetForBase,
  SignalValueVsPrevious,
  SignalValueVsLastSignalRunStatistic,
} = HTF;

describe("SignalValueVsLastTrueReference", () => {
  it("should initialize with parameters", () => {
    const sig = new SignalValueVsLastTrueReference({
      value_key: "val",
      reference_signal_key: "ref",
      comparison: "lt",
    });
    assert.strictEqual(sig.value_key, "val");
    assert.strictEqual(sig.reference_signal_key, "ref");
    assert.strictEqual(sig.comparison, "lt");
  });

  it("should throw on invalid comparison", () => {
    assert.throws(() => {
      new SignalValueVsLastTrueReference({
        value_key: "val",
        reference_signal_key: "ref",
        comparison: "eq",
      });
    }, /comparison must be 'lt' or 'gt'/);
  });

  it("should not trigger before reference", () => {
    const sig = new SignalValueVsLastTrueReference({
      value_key: "val",
      reference_signal_key: "ref",
    });

    assert.strictEqual(sig.update({ val: 10, ref: 0 }), 0);
    assert.strictEqual(sig.last_reference_value, null);
  });

  it("should update anchor on reference", () => {
    const sig = new SignalValueVsLastTrueReference({
      value_key: "val",
      reference_signal_key: "ref",
    });

    sig.update({ val: 100, ref: 1 });
    assert.strictEqual(sig.last_reference_value, 100);
  });

  it("should trigger on lt comparison", () => {
    const sig = new SignalValueVsLastTrueReference({
      value_key: "val",
      reference_signal_key: "ref",
      comparison: "lt",
    });

    sig.update({ val: 100, ref: 1 });
    assert.strictEqual(sig.update({ val: 50, ref: 0 }), 1);
  });

  it("should trigger on gt comparison", () => {
    const sig = new SignalValueVsLastTrueReference({
      value_key: "val",
      reference_signal_key: "ref",
      comparison: "gt",
    });

    sig.update({ val: 100, ref: 1 });
    assert.strictEqual(sig.update({ val: 150, ref: 0 }), 1);
  });

  it("should reset state", () => {
    const sig = new SignalValueVsLastTrueReference({
      value_key: "val",
      reference_signal_key: "ref",
    });

    sig.update({ val: 100, ref: 1 });
    sig.reset();

    assert.strictEqual(sig.last_reference_value, null);
  });
});

describe("SignalValueVsLastTargetForBase", () => {
  it("should initialize with parameters", () => {
    const sig = new SignalValueVsLastTargetForBase({
      value_key: "val",
      base_signal_key: "base",
      target_signal_key: "target",
    });
    assert.strictEqual(sig.value_key, "val");
    assert.strictEqual(sig.base_signal_key, "base");
    assert.strictEqual(sig.target_signal_key, "target");
  });

  it("should update anchor on target", () => {
    const sig = new SignalValueVsLastTargetForBase({
      value_key: "val",
      base_signal_key: "base",
      target_signal_key: "target",
    });

    sig.update({ val: 100, base: 0, target: 1 });
    assert.strictEqual(sig.last_target_value, 100);
  });

  it("should trigger when base active and condition met", () => {
    const sig = new SignalValueVsLastTargetForBase({
      value_key: "val",
      base_signal_key: "base",
      target_signal_key: "target",
      comparison: "lt",
    });

    sig.update({ val: 100, base: 0, target: 1 });
    assert.strictEqual(sig.update({ val: 50, base: 1, target: 0 }), 1);
  });

  it("should not trigger when base inactive", () => {
    const sig = new SignalValueVsLastTargetForBase({
      value_key: "val",
      base_signal_key: "base",
      target_signal_key: "target",
    });

    sig.update({ val: 100, base: 0, target: 1 });
    assert.strictEqual(sig.update({ val: 50, base: 0, target: 0 }), 0);
  });

  it("should not trigger when both active", () => {
    const sig = new SignalValueVsLastTargetForBase({
      value_key: "val",
      base_signal_key: "base",
      target_signal_key: "target",
    });

    sig.update({ val: 100, base: 0, target: 1 });
    assert.strictEqual(sig.update({ val: 50, base: 1, target: 1 }), 0);
    assert.strictEqual(sig.last_target_value, 50);
  });
});

describe("SignalValueVsPrevious", () => {
  it("should not trigger on first step", () => {
    const sig = new SignalValueVsPrevious({ value_key: "val" });
    assert.strictEqual(sig.update({ val: 100 }), 0);
  });

  it("should trigger on gt", () => {
    const sig = new SignalValueVsPrevious({
      value_key: "val",
      comparison: "gt",
    });

    sig.update({ val: 10 });
    assert.strictEqual(sig.update({ val: 20 }), 1);
  });

  it("should not trigger on gt when less", () => {
    const sig = new SignalValueVsPrevious({
      value_key: "val",
      comparison: "gt",
    });

    sig.update({ val: 20 });
    assert.strictEqual(sig.update({ val: 10 }), 0);
  });

  it("should trigger on lt", () => {
    const sig = new SignalValueVsPrevious({
      value_key: "val",
      comparison: "lt",
    });

    sig.update({ val: 20 });
    assert.strictEqual(sig.update({ val: 10 }), 1);
  });

  it("should handle sequence", () => {
    const sig = new SignalValueVsPrevious({
      value_key: "val",
      comparison: "gt",
    });

    const results = [];
    [10, 15, 12, 20, 18].forEach((v) => {
      results.push(sig.update({ val: v }));
    });

    assert.deepStrictEqual(results, [0, 1, 0, 1, 0]);
  });
});

describe("SignalValueVsLastSignalRunStatistic", () => {
  it("should throw on invalid statistic", () => {
    assert.throws(() => {
      new SignalValueVsLastSignalRunStatistic({
        value_key: "val",
        signal_key: "sig",
        statistic: "invalid",
      });
    }, /statistic must be one of/);
  });

  it("should throw on invalid comparison", () => {
    assert.throws(() => {
      new SignalValueVsLastSignalRunStatistic({
        value_key: "val",
        signal_key: "sig",
        comparison: "eq",
      });
    }, /comparison must be 'gt' or 'lt'/);
  });

  it("should compute statistic after run ends", () => {
    const sig = new SignalValueVsLastSignalRunStatistic({
      value_key: "val",
      signal_key: "sig",
      statistic: "mean",
    });

    sig.update({ val: 10, sig: 1 });
    sig.update({ val: 20, sig: 1 });
    sig.update({ val: 30, sig: 1 });
    sig.update({ val: 25, sig: 0 });

    assert.strictEqual(sig.last_statistic, 20);
  });

  it("should trigger after run completes", () => {
    const sig = new SignalValueVsLastSignalRunStatistic({
      value_key: "val",
      signal_key: "sig",
      statistic: "mean",
      comparison: "gt",
    });

    sig.update({ val: 10, sig: 1 });
    sig.update({ val: 20, sig: 1 });
    sig.update({ val: 0, sig: 0 }); // mean=15

    assert.strictEqual(sig.update({ val: 20, sig: 0 }), 1); // 20 > 15
    assert.strictEqual(sig.update({ val: 10, sig: 0 }), 0); // 10 < 15
  });
});
