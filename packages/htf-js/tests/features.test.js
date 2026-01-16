/**
 * Tests for htf/features.js - SingleFieldStatsFeature, LastRecordEchoFeature
 */
"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");

require("./setup.js");
const { SingleFieldStatsFeature, LastRecordEchoFeature } = HTF;

describe("SingleFieldStatsFeature", () => {
  it("should initialize with field_name and prefix", () => {
    const feature = new SingleFieldStatsFeature({
      field_name: "value",
      prefix: "val",
    });
    assert.strictEqual(feature.field_name, "value");
    assert.strictEqual(feature.prefix, "val");
  });

  it("should return zeros for empty window", () => {
    const feature = new SingleFieldStatsFeature({
      field_name: "value",
      prefix: "val",
    });
    const result = feature.compute([]);

    assert.strictEqual(result.val_count, 0);
    assert.strictEqual(result.val_mean, null);
    assert.strictEqual(result.val_min, null);
    assert.strictEqual(result.val_max, null);
  });

  it("should compute stats for single record", () => {
    const feature = new SingleFieldStatsFeature({
      field_name: "value",
      prefix: "val",
    });
    const result = feature.compute([{ value: 10 }]);

    assert.strictEqual(result.val_count, 1);
    assert.strictEqual(result.val_mean, 10);
    assert.strictEqual(result.val_min, 10);
    assert.strictEqual(result.val_max, 10);
  });

  it("should compute stats for multiple records", () => {
    const feature = new SingleFieldStatsFeature({
      field_name: "value",
      prefix: "val",
    });
    const records = [
      { value: 10 },
      { value: 20 },
      { value: 30 },
      { value: 40 },
      { value: 50 },
    ];
    const result = feature.compute(records);

    assert.strictEqual(result.val_count, 5);
    assert.strictEqual(result.val_mean, 30);
    assert.strictEqual(result.val_min, 10);
    assert.strictEqual(result.val_max, 50);
  });

  it("should filter non-numeric values", () => {
    const feature = new SingleFieldStatsFeature({
      field_name: "value",
      prefix: "val",
    });
    const records = [
      { value: 10 },
      { value: "string" },
      { value: 30 },
      { value: null },
      { value: 50 },
    ];
    const result = feature.compute(records);

    assert.strictEqual(result.val_count, 3);
    assert.strictEqual(result.val_mean, 30);
  });

  it("should handle missing field", () => {
    const feature = new SingleFieldStatsFeature({
      field_name: "value",
      prefix: "val",
    });
    const records = [{ value: 10 }, { other: 999 }, { value: 30 }];
    const result = feature.compute(records);

    assert.strictEqual(result.val_count, 2);
    assert.strictEqual(result.val_mean, 20);
  });

  it("should handle negative values", () => {
    const feature = new SingleFieldStatsFeature({
      field_name: "value",
      prefix: "val",
    });
    const records = [{ value: -10 }, { value: 0 }, { value: 10 }];
    const result = feature.compute(records);

    assert.strictEqual(result.val_count, 3);
    assert.strictEqual(result.val_mean, 0);
    assert.strictEqual(result.val_min, -10);
    assert.strictEqual(result.val_max, 10);
  });
});

describe("LastRecordEchoFeature", () => {
  it("should initialize with fields array", () => {
    const feature = new LastRecordEchoFeature({ fields: ["a", "b", "c"] });
    assert.deepStrictEqual(feature.fields, ["a", "b", "c"]);
  });

  it("should return nulls for empty window", () => {
    const feature = new LastRecordEchoFeature({ fields: ["a", "b"] });
    const result = feature.compute([]);

    assert.deepStrictEqual(result, { a: null, b: null });
  });

  it("should return values from last record", () => {
    const feature = new LastRecordEchoFeature({ fields: ["x", "y"] });
    const records = [
      { x: 1, y: 2 },
      { x: 10, y: 20 },
    ];
    const result = feature.compute(records);

    assert.deepStrictEqual(result, { x: 10, y: 20 });
  });

  it("should return null for missing fields", () => {
    const feature = new LastRecordEchoFeature({ fields: ["a", "b"] });
    const records = [{ a: 10 }];
    const result = feature.compute(records);

    assert.deepStrictEqual(result, { a: 10, b: null });
  });

  it("should return empty object for empty fields", () => {
    const feature = new LastRecordEchoFeature({ fields: [] });
    const result = feature.compute([{ a: 1, b: 2 }]);

    assert.deepStrictEqual(result, {});
  });

  it("should handle various value types", () => {
    const feature = new LastRecordEchoFeature({
      fields: ["int_val", "str_val", "bool_val", "null_val"],
    });
    const records = [
      {
        int_val: 42,
        str_val: "hello",
        bool_val: true,
        null_val: null,
      },
    ];
    const result = feature.compute(records);

    assert.strictEqual(result.int_val, 42);
    assert.strictEqual(result.str_val, "hello");
    assert.strictEqual(result.bool_val, true);
    assert.strictEqual(result.null_val, null);
  });
});
