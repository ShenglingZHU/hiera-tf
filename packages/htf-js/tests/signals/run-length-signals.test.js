/**
 * Tests for run-length based signals
 */
"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

require("../setup.js");
const {
  SignalRunLengthReached,
  SignalRunLengthReachedHistoryPercentile,
  SignalRunInterrupted,
  SignalRunLengthVsHistoryPercentile,
} = HTF;

describe("SignalRunLengthReached", () => {
  it("should initialize with default values", () => {
    const sig = new SignalRunLengthReached({ signal_key: "sig" });
    assert.strictEqual(sig.signal_key, "sig");
    assert.strictEqual(sig.target_value, 1);
    assert.strictEqual(sig.min_run_length, 3);
    assert.strictEqual(sig.post_run_extension, 0);
  });

  it("should not trigger before min_run_length", () => {
    const sig = new SignalRunLengthReached({
      signal_key: "sig",
      min_run_length: 3,
    });

    assert.strictEqual(sig.update({ sig: 1 }), 0);
    assert.strictEqual(sig.update({ sig: 1 }), 0);
    assert.strictEqual(sig.current_run, 2);
  });

  it("should trigger when min_run_length reached", () => {
    const sig = new SignalRunLengthReached({
      signal_key: "sig",
      min_run_length: 3,
    });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    const result = sig.update({ sig: 1 });

    assert.strictEqual(result, 1);
    assert.strictEqual(sig.active, true);
  });

  it("should stay active during run", () => {
    const sig = new SignalRunLengthReached({
      signal_key: "sig",
      min_run_length: 3,
    });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 1 });

    assert.strictEqual(sig.update({ sig: 1 }), 1);
    assert.strictEqual(sig.update({ sig: 1 }), 1);
  });

  it("should deactivate on interruption", () => {
    const sig = new SignalRunLengthReached({
      signal_key: "sig",
      min_run_length: 3,
    });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 1 });

    const result = sig.update({ sig: 0 });

    assert.strictEqual(result, 0);
    assert.strictEqual(sig.current_run, 0);
    assert.strictEqual(sig.active, false);
  });

  it("should extend signal after interruption", () => {
    const sig = new SignalRunLengthReached({
      signal_key: "sig",
      min_run_length: 3,
      post_run_extension: 2,
    });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 1 });

    assert.strictEqual(sig.update({ sig: 0 }), 1); // ext 1
    assert.strictEqual(sig.update({ sig: 0 }), 1); // ext 2
    assert.strictEqual(sig.update({ sig: 0 }), 0); // done
  });

  it("should reset state", () => {
    const sig = new SignalRunLengthReached({
      signal_key: "sig",
      min_run_length: 3,
    });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 1 });

    sig.reset();

    assert.strictEqual(sig.current_run, 0);
    assert.strictEqual(sig.active, false);
    assert.strictEqual(sig.tail_remaining, 0);
  });
});

describe("SignalRunLengthReachedHistoryPercentile", () => {
  it("should throw on invalid history_window", () => {
    assert.throws(() => {
      new SignalRunLengthReachedHistoryPercentile({
        signal_key: "sig",
        history_window: 0,
      });
    }, /history_window must be > 0/);
  });

  it("should throw on invalid percentile", () => {
    assert.throws(() => {
      new SignalRunLengthReachedHistoryPercentile({
        signal_key: "sig",
        percentile: 150,
      });
    }, /percentile must be between 0 and 100/);
  });

  it("should throw on invalid min_history_runs", () => {
    assert.throws(() => {
      new SignalRunLengthReachedHistoryPercentile({
        signal_key: "sig",
        min_history_runs: 0,
      });
    }, /min_history_runs must be >= 1/);
  });

  it("should not trigger without history", () => {
    const sig = new SignalRunLengthReachedHistoryPercentile({
      signal_key: "sig",
      min_history_runs: 3,
    });

    for (let i = 0; i < 10; i++) {
      assert.strictEqual(sig.update({ sig: 1 }), 0);
    }
  });

  it("should record run in trace", () => {
    const sig = new SignalRunLengthReachedHistoryPercentile({
      signal_key: "sig",
      min_history_runs: 1,
    });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 0 });

    assert.strictEqual(sig.run_trace.length, 1);
    assert.strictEqual(sig.run_trace[0].run_length, 3);
  });
});

describe("SignalRunInterrupted", () => {
  it("should not trigger during run", () => {
    const sig = new SignalRunInterrupted({
      signal_key: "sig",
      min_run_length: 3,
    });

    assert.strictEqual(sig.update({ sig: 1 }), 0);
    assert.strictEqual(sig.update({ sig: 1 }), 0);
    assert.strictEqual(sig.update({ sig: 1 }), 0);
  });

  it("should trigger on interruption after min_run_length", () => {
    const sig = new SignalRunInterrupted({
      signal_key: "sig",
      min_run_length: 3,
    });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 1 });

    assert.strictEqual(sig.update({ sig: 0 }), 1);
  });

  it("should not trigger if run too short", () => {
    const sig = new SignalRunInterrupted({
      signal_key: "sig",
      min_run_length: 5,
    });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 1 });

    assert.strictEqual(sig.update({ sig: 0 }), 0);
  });

  it("should extend after interruption", () => {
    const sig = new SignalRunInterrupted({
      signal_key: "sig",
      min_run_length: 3,
      post_run_extension: 2,
    });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 1 });

    assert.strictEqual(sig.update({ sig: 0 }), 1); // interruption
    assert.strictEqual(sig.update({ sig: 0 }), 1); // ext 1
    assert.strictEqual(sig.update({ sig: 0 }), 1); // ext 2
    assert.strictEqual(sig.update({ sig: 0 }), 0); // done
  });
});

describe("SignalRunLengthVsHistoryPercentile", () => {
  it("should not trigger without history", () => {
    const sig = new SignalRunLengthVsHistoryPercentile({
      signal_key: "sig",
      min_history_runs: 5,
    });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 0 });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 0 });

    // Only 2 runs in history
    for (let i = 0; i < 10; i++) {
      assert.strictEqual(sig.update({ sig: 1 }), 0);
    }
  });

  it("should trigger when exceeds percentile", () => {
    const sig = new SignalRunLengthVsHistoryPercentile({
      signal_key: "sig",
      percentile: 50,
      min_history_runs: 2,
    });

    // Build history: runs of 2, 3
    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 0 });

    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    sig.update({ sig: 0 });

    // New run should trigger when exceeding ~2.5
    sig.update({ sig: 1 });
    sig.update({ sig: 1 });
    const result = sig.update({ sig: 1 });

    assert.strictEqual(result, 1);
  });
});

