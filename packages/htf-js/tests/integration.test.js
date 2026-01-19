/**
 * Integration tests for HTF JavaScript implementation
 */
"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

require("./setup.js");

describe("Integration: Signal Classes", () => {
  it("should chain percentile and run length signals", () => {
    const { ValueVsRollingPercentile, SignalRunLengthReached } = HTF;

    const percentileSig = new ValueVsRollingPercentile({
      value_key: "val",
      window_size: 20,
      percentile: 80,
      min_history: 5,
      comparison: "gt",
    });

    const runLengthSig = new SignalRunLengthReached({
      signal_key: "high",
      min_run_length: 3,
    });

    // Build history with moderate values
    for (let i = 0; i < 10; i++) {
      const pctResult = percentileSig.update({ val: 50 + i });
      runLengthSig.update({ high: pctResult });
    }

    // Now spike values
    let runTriggered = false;
    for (let i = 0; i < 5; i++) {
      const pctResult = percentileSig.update({ val: 100 + i * 10 });
      if (runLengthSig.update({ high: pctResult }) === 1) {
        runTriggered = true;
      }
    }

    assert.ok(runTriggered);
  });

  it("should use SignalIntersection for multiple conditions", () => {
    const { ValueVsRollingPercentile, SignalIntersection } = HTF;

    const highSig = new ValueVsRollingPercentile({
      value_key: "val",
      window_size: 10,
      percentile: 90,
      min_history: 5,
      comparison: "gt",
    });

    const lowSig = new ValueVsRollingPercentile({
      value_key: "other",
      window_size: 10,
      percentile: 10,
      min_history: 5,
      comparison: "lt",
    });

    const intersection = new SignalIntersection({
      signal_keys: ["high", "low"],
    });

    // Build history
    for (let i = 0; i < 10; i++) {
      highSig.update({ val: 50 });
      lowSig.update({ other: 50 });
    }

    // Test intersection
    const h = highSig.update({ val: 100 }); // high spike
    const l = lowSig.update({ other: 10 }); // low value

    const combo = intersection.update({ high: h, low: l });
    assert.strictEqual(combo, 1);
  });
});

describe("Integration: EMA Signals", () => {
  it("should detect EMA crossovers", () => {
    const { SignalEMAFastSlowComparison } = HTF;

    const sig = new SignalEMAFastSlowComparison({
      value_key: "val",
      ema_period_1: 3,
      ema_period_2: 10,
      prefer: "fast",
    });

    // Start with stable values
    for (let i = 0; i < 10; i++) {
      sig.update({ val: 50 });
    }

    // Now upward trend
    let triggered = false;
    for (let i = 0; i < 5; i++) {
      if (sig.update({ val: 60 + i * 5 }) === 1) {
        triggered = true;
      }
    }

    assert.ok(triggered);
  });
});

describe("Integration: Coordinator Usage", () => {
  it("should coordinate HTF and LTF timeframes", () => {
    const { TimeframeState, SimpleHTFCoordinator } = HTF;

    const coord = new SimpleHTFCoordinator();

    // HTF allows
    let states = {
      htf: new TimeframeState({ name: "htf", role: "HTF", signal: 1 }),
      ltf: new TimeframeState({ name: "ltf", role: "LTF", signal: 1 }),
    };

    let result = coord.update(states, {});
    assert.strictEqual(result.htf_allow, true);
    assert.strictEqual(result.ltf_gated.ltf, 1);

    // HTF blocks
    states = {
      htf: new TimeframeState({ name: "htf", role: "HTF", signal: 0 }),
      ltf: new TimeframeState({ name: "ltf", role: "LTF", signal: 1 }),
    };

    result = coord.update(states, {});
    assert.strictEqual(result.htf_allow, false);
    assert.strictEqual(result.ltf_gated.ltf, 0);
  });

  it("should use hierarchical coordination", () => {
    const { TimeframeState, HierarConstraintCoordinator } = HTF;

    const coord = new HierarConstraintCoordinator({
      order: ["grandparent", "parent", "child"],
    });

    // All pass
    let states = {
      grandparent: new TimeframeState({ name: "grandparent", signal: 1 }),
      parent: new TimeframeState({ name: "parent", signal: 1 }),
      child: new TimeframeState({ name: "child", signal: 1 }),
    };

    let result = coord.update(states, {});
    assert.strictEqual(result.gated_map.child, 1);

    // Parent blocks child
    states = {
      grandparent: new TimeframeState({ name: "grandparent", signal: 1 }),
      parent: new TimeframeState({ name: "parent", signal: 0 }),
      child: new TimeframeState({ name: "child", signal: 1 }),
    };

    result = coord.update(states, {});
    assert.strictEqual(result.gated_map.child, 0);
  });
});

describe("Integration: Framework Usage", () => {
  it("should create and use framework", () => {
    const { HTFFramework } = HTF;

    const mockTf = {
      name: "test",
      role: "LTF",
      on_new_record: () => {},
      features: { mean: 50 },
      signal: 1,
      reset: () => {},
    };

    const framework = new HTFFramework({
      timeframes: { test: mockTf },
    });

    const result = framework.on_new_record({ val: 100 });

    assert.ok("states" in result);
    assert.ok("test" in result.states);
  });
});

describe("Integration: Reset Behavior", () => {
  it("should reset signal state", () => {
    const { ValueVsRollingPercentile } = HTF;

    const sig = new ValueVsRollingPercentile({
      value_key: "val",
      window_size: 10,
      min_history: 3,
    });

    for (let i = 0; i < 10; i++) {
      sig.update({ val: i * 10 });
    }

    sig.reset();

    assert.strictEqual(sig.history.length, 0);
    assert.strictEqual(sig.last_threshold, null);
  });
});
