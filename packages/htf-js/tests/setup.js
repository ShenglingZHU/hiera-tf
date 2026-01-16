/**
 * Test setup - Load all HTF modules into global scope
 */
"use strict";

// Load modules in dependency order
require("../htf/utils.js");
require("../htf/timeframe.js");
require("../htf/features.js");
require("../htf/signals.js");
require("../htf/coordinator.js");
require("../htf/framework.js");

// Export global HTF for tests
module.exports = { HTF: globalThis.HTF };
