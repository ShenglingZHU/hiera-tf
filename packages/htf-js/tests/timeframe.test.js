/**
 * Tests for htf/timeframe.js - TimeframeConfig, TimeframeView, FeatureModule
 */
"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");

require("./setup.js");
const { TimeframeConfig, TimeframeView, FeatureModule } = HTF;

describe("TimeframeConfig", () => {
  it("should initialize with valid parameters", () => {
    const config = new TimeframeConfig({
      name: "test",
      window_size: 10,
      max_buffer: 100,
      role: "LTF",
    });
    assert.strictEqual(config.name, "test");
    assert.strictEqual(config.window_size, 10);
    assert.strictEqual(config.max_buffer, 100);
    assert.strictEqual(config.role, "LTF");
  });

  it("should use default values", () => {
    const config = new TimeframeConfig({ name: "test", window_size: 5 });
    assert.strictEqual(config.max_buffer, 1024);
    assert.strictEqual(config.role, "LTF");
  });

  it("should convert role to uppercase", () => {
    const config = new TimeframeConfig({
      name: "test",
      window_size: 5,
      role: "htf",
    });
    assert.strictEqual(config.role, "HTF");
  });

  it("should throw on invalid window_size", () => {
    assert.throws(() => {
      new TimeframeConfig({ name: "test", window_size: 0 });
    }, /window_size must be > 0/);
  });

  it("should throw on negative window_size", () => {
    assert.throws(() => {
      new TimeframeConfig({ name: "test", window_size: -5 });
    }, /window_size must be > 0/);
  });

  it("should throw on invalid max_buffer", () => {
    assert.throws(() => {
      new TimeframeConfig({ name: "test", window_size: 5, max_buffer: 0 });
    }, /max_buffer must be > 0/);
  });
});

describe("FeatureModule", () => {
  it("should throw on compute not implemented", () => {
    const module = new FeatureModule();
    assert.throws(() => {
      module.compute([]);
    }, /must be implemented/);
  });

  it("should have empty last_features initially", () => {
    const module = new FeatureModule();
    assert.deepStrictEqual(module.last_features, {});
  });
});

describe("TimeframeView", () => {
  let config;

  beforeEach(() => {
    config = new TimeframeConfig({ name: "test_tf", window_size: 5, role: "LTF" });
  });

  it("should initialize with config", () => {
    const view = new TimeframeView({ config });
    assert.strictEqual(view.name, "test_tf");
    assert.strictEqual(view.role, "LTF");
    assert.strictEqual(view.buffer_size, 0);
  });

  it("should have name and role properties", () => {
    const view = new TimeframeView({ config });
    assert.strictEqual(view.name, "test_tf");
    assert.strictEqual(view.role, "LTF");
  });

  it("should push records to buffer", () => {
    const view = new TimeframeView({ config });
    view.on_new_record({ val: 10 });
    view.on_new_record({ val: 20 });
    assert.strictEqual(view.buffer_size, 2);
  });

  it("should trim buffer to max_buffer", () => {
    const smallConfig = new TimeframeConfig({
      name: "test",
      window_size: 3,
      max_buffer: 5,
    });
    const view = new TimeframeView({ config: smallConfig });

    for (let i = 0; i < 10; i++) {
      view.on_new_record({ val: i });
    }

    assert.strictEqual(view.buffer_size, 5);
  });

  it("should report is_warm correctly", () => {
    const view = new TimeframeView({ config });

    for (let i = 0; i < 4; i++) {
      view.on_new_record({ val: i });
      assert.strictEqual(view.is_warm, false);
    }

    view.on_new_record({ val: 4 });
    assert.strictEqual(view.is_warm, true);
  });

  it("should reset buffer and state", () => {
    const view = new TimeframeView({ config });
    view.on_new_record({ val: 10 });
    view.on_new_record({ val: 20 });

    view.reset();

    assert.strictEqual(view.buffer_size, 0);
    assert.deepStrictEqual(view.features, {});
    assert.strictEqual(view.signal, null);
  });

  it("should use last record as default features", () => {
    const view = new TimeframeView({ config });
    view.on_new_record({ val: 10, name: "test" });

    assert.strictEqual(view.features.val, 10);
    assert.strictEqual(view.features.name, "test");
  });

  it("should use feature function when provided", () => {
    const featureFn = (window) => ({
      sum: window.reduce((s, r) => s + (r.val || 0), 0),
    });
    const view = new TimeframeView({ config, feature_fn: featureFn });

    view.on_new_record({ val: 5 });
    view.on_new_record({ val: 10 });

    assert.strictEqual(view.features.sum, 15);
  });

  it("should use signal function when provided", () => {
    const signalFn = (features) => (features.val > 10 ? 1 : 0);
    const view = new TimeframeView({ config, signal_fn: signalFn });

    view.on_new_record({ val: 5 });
    assert.strictEqual(view.signal, 0);

    view.on_new_record({ val: 20 });
    assert.strictEqual(view.signal, 1);
  });

  it("should return signal from on_new_record", () => {
    const signalFn = (features) => features.val;
    const view = new TimeframeView({ config, signal_fn: signalFn });

    const result = view.on_new_record({ val: 42 });
    assert.strictEqual(result, 42);
  });
});
