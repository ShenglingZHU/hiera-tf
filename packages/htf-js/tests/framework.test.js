/**
 * Tests for framework module
 */
"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

require("./setup.js");
const { HTFFramework } = HTF;

describe("HTFFramework", () => {
  it("should initialize with timeframes and coordinator", () => {
    const framework = new HTFFramework({
      timeframes: {},
      coordinator: null,
    });

    assert.ok(framework.timeframes !== undefined);
    assert.ok(framework.last_output !== undefined);
  });

  it("should reset all timeframes", () => {
    let resetCalled = false;
    const mockTf = {
      reset: () => {
        resetCalled = true;
      },
    };

    const framework = new HTFFramework({
      timeframes: { test: mockTf },
    });

    framework.reset();
    assert.strictEqual(resetCalled, true);
  });

  it("should call on_new_record on timeframes", () => {
    const records = [];
    const mockTf = {
      name: "test",
      role: "LTF",
      on_new_record: (record) => {
        records.push(record);
      },
      features: {},
      signal: 0,
      reset: () => {},
    };

    const framework = new HTFFramework({
      timeframes: { test: mockTf },
    });

    framework.on_new_record({ val: 100 });

    assert.strictEqual(records.length, 1);
    assert.deepStrictEqual(records[0], { val: 100 });
  });

  it("should return states from on_new_record", () => {
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
    assert.strictEqual(result.states.test.signal, 1);
  });

  it("should update last_output", () => {
    const mockTf = {
      name: "test",
      role: "LTF",
      on_new_record: () => {},
      features: {},
      signal: 0,
      reset: () => {},
    };

    const framework = new HTFFramework({
      timeframes: { test: mockTf },
    });

    framework.on_new_record({ val: 100 });

    assert.ok(framework.last_output.states !== undefined);
  });

  it("should handle empty timeframes", () => {
    const framework = new HTFFramework({
      timeframes: {},
    });

    const result = framework.on_new_record({ val: 100 });

    assert.deepStrictEqual(result.states, {});
  });
});

describe("HTFFramework Integration", () => {
  it("should coordinate multiple timeframes", () => {
    const mockHTF = {
      name: "htf",
      role: "HTF",
      on_new_record: () => {},
      features: {},
      signal: 1,
      reset: () => {},
    };

    const mockLTF = {
      name: "ltf",
      role: "LTF",
      on_new_record: () => {},
      features: {},
      signal: 1,
      reset: () => {},
    };

    const framework = new HTFFramework({
      timeframes: { htf: mockHTF, ltf: mockLTF },
      coordinator: new HTF.SimpleHTFCoordinator(),
    });

    const result = framework.on_new_record({ val: 100 });

    assert.ok("htf" in result.states);
    assert.ok("ltf" in result.states);
    assert.ok("coordination" in result);
  });
});


