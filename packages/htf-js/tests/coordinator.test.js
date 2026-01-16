/**
 * Tests for coordinator module
 */
"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");

require("./setup.js");
const {
  TimeframeState,
  SimpleHTFCoordinator,
  HierarConstraintCoordinator,
} = HTF;

describe("TimeframeState", () => {
  it("should initialize with provided values", () => {
    const state = new TimeframeState({
      name: "test",
      role: "HTF",
      features: { mean: 10 },
      signal: 1,
    });
    assert.strictEqual(state.name, "test");
    assert.strictEqual(state.role, "HTF");
    assert.deepStrictEqual(state.features, { mean: 10 });
    assert.strictEqual(state.signal, 1);
  });

  it("should handle empty features", () => {
    const state = new TimeframeState({ name: "test" });
    assert.deepStrictEqual(state.features, {});
  });
});

describe("SimpleHTFCoordinator", () => {
  it("should gate LTF signals based on HTF signals", () => {
    const coord = new SimpleHTFCoordinator();
    const states = {
      htf1: new TimeframeState({ name: "htf1", role: "HTF", signal: 1 }),
      ltf1: new TimeframeState({ name: "ltf1", role: "LTF", signal: 1 }),
    };

    const result = coord.update(states, {});

    assert.strictEqual(result.htf_allow, true);
    assert.strictEqual(result.ltf_gated.ltf1, 1);
  });

  it("should block LTF when HTF is false", () => {
    const coord = new SimpleHTFCoordinator();
    const states = {
      htf1: new TimeframeState({ name: "htf1", role: "HTF", signal: 0 }),
      ltf1: new TimeframeState({ name: "ltf1", role: "LTF", signal: 1 }),
    };

    const result = coord.update(states, {});

    assert.strictEqual(result.htf_allow, false);
    assert.strictEqual(result.ltf_gated.ltf1, 0);
    assert.strictEqual(result.ltf_raw.ltf1, 1);
  });

  it("should allow all LTF when no HTF states", () => {
    const coord = new SimpleHTFCoordinator();
    const states = {
      ltf1: new TimeframeState({ name: "ltf1", role: "LTF", signal: 1 }),
      ltf2: new TimeframeState({ name: "ltf2", role: "LTF", signal: 1 }),
    };

    const result = coord.update(states, {});

    assert.strictEqual(result.htf_allow, true);
  });

  it("should handle empty states", () => {
    const coord = new SimpleHTFCoordinator();
    const result = coord.update({}, {});

    assert.strictEqual(result.htf_allow, true);
  });
});

describe("HierarConstraintCoordinator", () => {
  it("should initialize with order", () => {
    const coord = new HierarConstraintCoordinator({
      order: ["fast", "mid", "slow"],
    });

    assert.deepStrictEqual(coord.order, ["fast", "mid", "slow"]);
  });

  it("should respect hierarchical order in gating", () => {
    const coord = new HierarConstraintCoordinator({
      order: ["parent", "child"],
    });

    const states = {
      parent: new TimeframeState({ name: "parent", signal: 0 }),
      child: new TimeframeState({ name: "child", signal: 1 }),
    };

    const result = coord.update(states, {});

    // Child should be blocked because parent is false
    assert.strictEqual(result.allow_map.parent, true);
    assert.strictEqual(result.allow_map.child, false);
    assert.strictEqual(result.gated_map.child, 0);
  });

  it("should allow child when parent is true", () => {
    const coord = new HierarConstraintCoordinator({
      order: ["parent", "child"],
    });

    const states = {
      parent: new TimeframeState({ name: "parent", signal: 1 }),
      child: new TimeframeState({ name: "child", signal: 1 }),
    };

    const result = coord.update(states, {});

    assert.strictEqual(result.allow_map.child, true);
    assert.strictEqual(result.gated_map.child, 1);
  });

  it("should preserve raw signals", () => {
    const coord = new HierarConstraintCoordinator({
      order: ["parent", "child"],
    });

    const states = {
      parent: new TimeframeState({ name: "parent", signal: 0 }),
      child: new TimeframeState({ name: "child", signal: 1 }),
    };

    const result = coord.update(states, {});

    assert.strictEqual(result.raw_map.parent, 0);
    assert.strictEqual(result.raw_map.child, 1);
  });
});
