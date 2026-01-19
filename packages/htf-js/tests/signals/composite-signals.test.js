/**
 * Tests for composite signals
 */
"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

require("../setup.js");
const { SignalIntersection, SignalExternalFlag } = HTF;

describe("SignalIntersection", () => {
  it("should initialize with signal keys", () => {
    const sig = new SignalIntersection({
      signal_keys: ["a", "b", "c"],
    });
    assert.deepStrictEqual(sig.signal_keys, ["a", "b", "c"]);
  });

  it("should throw on less than 2 signal_keys", () => {
    assert.throws(() => {
      new SignalIntersection({ signal_keys: ["a"] });
    }, /signal_keys must contain at least 2 keys/);
  });

  it("should throw on empty signal_keys", () => {
    assert.throws(() => {
      new SignalIntersection({ signal_keys: [] });
    }, /signal_keys must contain at least 2 keys/);
  });

  it("should throw on duplicate signal_keys", () => {
    assert.throws(() => {
      new SignalIntersection({ signal_keys: ["a", "a", "b"] });
    }, /signal_keys must be unique/);
  });

  it("should trigger when all signals true", () => {
    const sig = new SignalIntersection({
      signal_keys: ["a", "b", "c"],
    });

    assert.strictEqual(sig.update({ a: 1, b: 1, c: 1 }), 1);
  });

  it("should not trigger when any signal false", () => {
    const sig = new SignalIntersection({
      signal_keys: ["a", "b", "c"],
    });

    assert.strictEqual(sig.update({ a: 1, b: 0, c: 1 }), 0);
    assert.strictEqual(sig.update({ a: 0, b: 1, c: 1 }), 0);
    assert.strictEqual(sig.update({ a: 1, b: 1, c: 0 }), 0);
  });

  it("should handle two signals", () => {
    const sig = new SignalIntersection({
      signal_keys: ["x", "y"],
    });

    assert.strictEqual(sig.update({ x: 1, y: 1 }), 1);
    assert.strictEqual(sig.update({ x: 1, y: 0 }), 0);
    assert.strictEqual(sig.update({ x: 0, y: 1 }), 0);
    assert.strictEqual(sig.update({ x: 0, y: 0 }), 0);
  });

  it("should handle missing keys as false", () => {
    const sig = new SignalIntersection({
      signal_keys: ["a", "b"],
    });

    assert.strictEqual(sig.update({ a: 1 }), 0); // b missing
  });

  it("should treat truthy values as true", () => {
    const sig = new SignalIntersection({
      signal_keys: ["a", "b"],
    });

    assert.strictEqual(sig.update({ a: 5, b: "yes" }), 1);
  });

  it("should reset without error", () => {
    const sig = new SignalIntersection({
      signal_keys: ["a", "b"],
    });

    sig.update({ a: 1, b: 1 });
    sig.reset();
    // No state to verify, just ensure no error
  });
});

describe("SignalExternalFlag", () => {
  it("should initialize with signal_key", () => {
    const sig = new SignalExternalFlag({ signal_key: "my_flag" });
    assert.strictEqual(sig.signal_key, "my_flag");
  });

  it("should return 1 when value equals true_value", () => {
    const sig = new SignalExternalFlag({ signal_key: "f", true_value: 1 });

    assert.strictEqual(sig.update({ f: 1 }), 1);
    assert.strictEqual(sig.update({ f: 0 }), 0);
  });

  it("should return 0 for missing key", () => {
    const sig = new SignalExternalFlag({ signal_key: "f" });

    assert.strictEqual(sig.update({}), 0);
    assert.strictEqual(sig.update({ other: 1 }), 0);
  });

  it("should use strict equality", () => {
    const sig = new SignalExternalFlag({ signal_key: "f", true_value: 1 });

    // true !== 1 in strict equality
    assert.strictEqual(sig.update({ f: true }), 0);
    assert.strictEqual(sig.update({ f: 1 }), 1);
  });

  it("should work with custom true_value", () => {
    const sig = new SignalExternalFlag({ signal_key: "f", true_value: "active" });

    assert.strictEqual(sig.update({ f: "active" }), 1);
    assert.strictEqual(sig.update({ f: "inactive" }), 0);
  });

  it("should reset without error", () => {
    const sig = new SignalExternalFlag({ signal_key: "f" });

    sig.update({ f: 1 });
    sig.reset();
  });
});

