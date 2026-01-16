/**
 * Tests for interval-based signals
 */
"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");

require("../setup.js");
const {
  SignalIntervalBetweenMarkers,
  SignalNthTargetWithinWindowAfterTrigger,
} = HTF;

describe("SignalIntervalBetweenMarkers", () => {
  it("should initialize with parameters", () => {
    const sig = new SignalIntervalBetweenMarkers({
      start_signal_key: "start",
      end_signal_key: "end",
    });
    assert.strictEqual(sig.start_signal_key, "start");
    assert.strictEqual(sig.end_signal_key, "end");
  });

  it("should not be active initially", () => {
    const sig = new SignalIntervalBetweenMarkers({
      start_signal_key: "start",
      end_signal_key: "end",
    });

    assert.strictEqual(sig.active, false);
    assert.strictEqual(sig.current_length, 0);
  });

  it("should activate on start signal", () => {
    const sig = new SignalIntervalBetweenMarkers({
      start_signal_key: "start",
      end_signal_key: "end",
    });

    const result = sig.update({ start: 1, end: 0 });
    assert.strictEqual(result, 1);
    assert.strictEqual(sig.active, true);
  });

  it("should count length while active", () => {
    const sig = new SignalIntervalBetweenMarkers({
      start_signal_key: "start",
      end_signal_key: "end",
    });

    sig.update({ start: 1, end: 0 }); // start
    sig.update({ start: 0, end: 0 }); // continue
    sig.update({ start: 0, end: 0 }); // continue

    assert.strictEqual(sig.current_length, 3);
  });

  it("should close on end signal", () => {
    const sig = new SignalIntervalBetweenMarkers({
      start_signal_key: "start",
      end_signal_key: "end",
    });

    sig.update({ start: 1, end: 0 });
    sig.update({ start: 0, end: 0 });
    sig.update({ start: 0, end: 1 }); // end

    assert.strictEqual(sig.active, false);
    assert.strictEqual(sig.last_interval_length, 3);
    assert.strictEqual(sig.last_interval_closed_by, "end_signal");
  });

  it("should close on max_length", () => {
    const sig = new SignalIntervalBetweenMarkers({
      start_signal_key: "start",
      end_signal_key: "end",
      max_length: 2,
    });

    sig.update({ start: 1, end: 0 });
    sig.update({ start: 0, end: 0 }); // hits max

    assert.strictEqual(sig.active, false);
    assert.strictEqual(sig.last_interval_closed_by, "max_length");
  });

  it("should reset state", () => {
    const sig = new SignalIntervalBetweenMarkers({
      start_signal_key: "start",
      end_signal_key: "end",
    });

    sig.update({ start: 1, end: 0 });
    sig.update({ start: 0, end: 1 });

    sig.reset();

    assert.strictEqual(sig.step_index, 0);
    assert.strictEqual(sig.active, false);
    assert.strictEqual(sig.intervals.length, 0);
  });
});

describe("SignalNthTargetWithinWindowAfterTrigger", () => {
  it("should initialize with parameters", () => {
    const sig = new SignalNthTargetWithinWindowAfterTrigger({
      trigger_signal_key: "trig",
      target_signal_key: "tgt",
      target_index: 3,
      window_length: 10,
    });
    assert.strictEqual(sig.trigger_signal_key, "trig");
    assert.strictEqual(sig.target_signal_key, "tgt");
    assert.strictEqual(sig.target_index, 3);
    assert.strictEqual(sig.window_length, 10);
  });

  it("should throw if window_length < 1", () => {
    assert.throws(() => {
      new SignalNthTargetWithinWindowAfterTrigger({
        trigger_signal_key: "trig",
        target_signal_key: "tgt",
        target_index: 2,
        window_length: 0,
      });
    }, /window_length must be > 0/);
  });

  it("should throw if target_index < 1", () => {
    assert.throws(() => {
      new SignalNthTargetWithinWindowAfterTrigger({
        trigger_signal_key: "trig",
        target_signal_key: "tgt",
        target_index: 0,
        window_length: 10,
      });
    }, /target_index must be >= 1/);
  });

  it("should not trigger before trigger signal", () => {
    const sig = new SignalNthTargetWithinWindowAfterTrigger({
      trigger_signal_key: "trig",
      target_signal_key: "tgt",
      target_index: 2,
      window_length: 10,
    });

    sig.update({ trig: 0, tgt: 1 });
    assert.strictEqual(sig.update({ trig: 0, tgt: 1 }), 0);
  });

  it("should trigger on nth target after trigger", () => {
    const sig = new SignalNthTargetWithinWindowAfterTrigger({
      trigger_signal_key: "trig",
      target_signal_key: "tgt",
      target_index: 2,
      window_length: 10,
    });

    sig.update({ trig: 1, tgt: 0 }); // trigger
    sig.update({ trig: 0, tgt: 1 }); // target 1
    const result = sig.update({ trig: 0, tgt: 1 }); // target 2

    assert.strictEqual(result, 1);
  });

  it("should reset state", () => {
    const sig = new SignalNthTargetWithinWindowAfterTrigger({
      trigger_signal_key: "trig",
      target_signal_key: "tgt",
      target_index: 2,
      window_length: 10,
    });

    sig.update({ trig: 1, tgt: 0 });
    sig.update({ trig: 0, tgt: 1 });

    sig.reset();

    assert.strictEqual(sig.active_windows.length, 0);
    assert.strictEqual(sig.step_index, 0);
  });
});
