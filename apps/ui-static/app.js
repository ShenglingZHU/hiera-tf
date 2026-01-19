// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling

"use strict";

const t = (key, vars) =>
  window.i18n && typeof window.i18n.t === "function" ? window.i18n.t(key, vars) : key;

const TIME_UNITS = [
  { key: "year", labelKey: "time.year", short: "y", seconds: 31536000 },
  { key: "month", labelKey: "time.month", short: "mo", seconds: 2592000 },
  { key: "day", labelKey: "time.day", short: "d", seconds: 86400 },
  { key: "hour", labelKey: "time.hour", short: "h", seconds: 3600 },
  { key: "minute", labelKey: "time.minute", short: "m", seconds: 60 },
  { key: "second", labelKey: "time.second", short: "s", seconds: 1 },
];

const TIME_COLUMN_DEFAULTS = {
  year: ["year", "Year", "YEAR", "yyyy", "YYYY"],
  month: ["month", "Month", "MONTH", "mm", "MM"],
  day: ["day", "Day", "DAY", "dd", "DD"],
  hour: ["hour", "Hour", "HOUR", "hh", "HH"],
  minute: ["minute", "Minute", "MINUTE", "min", "MIN"],
  second: ["second", "Second", "SECOND", "sec", "SEC", "ss", "SS"],
};

const COLOR_PALETTE = [
  "#000000",
  "#ffffff",
  "#1f77b4",
  "#2ca02c",
  "#ff7f0e",
  "#d62728",
  "#9467bd",
  "#17becf",
  "#e377c2",
  "#8c564b",
  "#7f7f7f",
  "#bcbd22",
];

const HIERAR_CONSTRAINT_STYLES = [
  { value: "background", labelKey: "hierarchyConstraint.style.background" },
  { value: "solid", labelKey: "hierarchyConstraint.style.solid" },
  { value: "dashed", labelKey: "hierarchyConstraint.style.dashed" },
];

const INTERSECTION_STYLE_OPTIONS = [
  { value: "none", labelKey: "intersection.style.none" },
  { value: "background", labelKey: "intersection.style.background" },
  { value: "solid", labelKey: "intersection.style.solid" },
  { value: "dashed", labelKey: "intersection.style.dashed" },
];

const DEFAULT_HIERAR_CONSTRAINT_STYLE = "background";
const DEFAULT_HIERAR_CONSTRAINT_OPACITY = 0.2;
const DEFAULT_INTERSECTION_STYLE = "none";
const DEFAULT_INTERSECTION_COLOR = "#7f7f7f";
const PLOT_ZOOM_LIMITS = { minScale: 0.5, maxScale: 20 };
const EXTERNAL_SIGNAL_TYPE = "SignalExternalFlag";
const EXTERNAL_SIGNAL_PREFIX = "external:";

const SIGNAL_DEFS = [

  {
    type: "ValueVsRollingPercentile",
    params: [
      { name: "value_key", kind: "column", label: "value_key" },
      { name: "window_size", kind: "number", label: "window_size", default: 20 },
      { name: "percentile", kind: "number", label: "percentile", default: 50 },
      { name: "include_current", kind: "boolean", label: "include_current", default: false },
      { name: "min_history", kind: "number", label: "min_history", default: 1 },
      { name: "comparison", kind: "select", label: "comparison", options: ["gt", "lt"], default: "gt" },
    ],
  },
  {
    type: "ValueVsRollingPercentileWithThreshold",
    params: [
      { name: "value_key", kind: "column", label: "value_key" },
      { name: "window_size", kind: "number", label: "window_size", default: 20 },
      { name: "percentile", kind: "number", label: "percentile", default: 50 },
      { name: "include_current", kind: "boolean", label: "include_current", default: false },
      { name: "min_history", kind: "number", label: "min_history", default: 1 },
      { name: "comparison", kind: "select", label: "comparison", options: ["gt", "lt"], default: "gt" },
    ],
  },
  {
    type: "SignalRunLengthReached",
    params: [
      { name: "signal_key", kind: "signal", label: "signal_key" },
      { name: "target_value", kind: "text", label: "target_value", default: "1" },
      { name: "min_run_length", kind: "number", label: "min_run_length", default: 3 },
      { name: "post_run_extension", kind: "number", label: "post_run_extension", default: 0 },
    ],
  },
  {
    type: "SignalRunLengthReachedHistoryPercentile",
    params: [
      { name: "signal_key", kind: "signal", label: "signal_key" },
      { name: "target_value", kind: "text", label: "target_value", default: "1" },
      { name: "history_window", kind: "number", label: "history_window", default: 100 },
      { name: "percentile", kind: "number", label: "percentile", default: 90 },
      { name: "min_history_runs", kind: "number", label: "min_history_runs", default: 1 },
      { name: "post_run_extension", kind: "number", label: "post_run_extension", default: 0 },
      { name: "run_trace_limit", kind: "number", label: "run_trace_limit", default: "" },
    ],
  },
  {
    type: "SignalRunInterrupted",
    params: [
      { name: "signal_key", kind: "signal", label: "signal_key" },
      { name: "target_value", kind: "text", label: "target_value", default: "1" },
      { name: "min_run_length", kind: "number", label: "min_run_length", default: 3 },
      { name: "post_run_extension", kind: "number", label: "post_run_extension", default: 0 },
    ],
  },
  {
    type: "SignalRunLengthVsHistoryPercentile",
    params: [
      { name: "signal_key", kind: "signal", label: "signal_key" },
      { name: "target_value", kind: "text", label: "target_value", default: "1" },
      { name: "history_window", kind: "number", label: "history_window", default: 100 },
      { name: "percentile", kind: "number", label: "percentile", default: 90 },
      { name: "min_history_runs", kind: "number", label: "min_history_runs", default: 5 },
      { name: "post_run_extension", kind: "number", label: "post_run_extension", default: 0 },
    ],
  },
  {
    type: "SignalValueVsLastTrueReference",
    params: [
      { name: "value_key", kind: "column", label: "value_key" },
      { name: "reference_signal_key", kind: "signal", label: "reference_signal_key" },
      { name: "comparison", kind: "select", label: "comparison", options: ["lt", "gt"], default: "lt" },
    ],
  },
  {
    type: "SignalValueVsLastTargetForBase",
    params: [
      { name: "value_key", kind: "column", label: "value_key" },
      { name: "base_signal_key", kind: "signal", label: "base_signal_key" },
      { name: "target_signal_key", kind: "signal", label: "target_signal_key" },
      { name: "comparison", kind: "select", label: "comparison", options: ["lt", "gt"], default: "lt" },
    ],
  },
  {
    type: "SignalValueVsPrevious",
    params: [
      { name: "value_key", kind: "column", label: "value_key" },
      { name: "comparison", kind: "select", label: "comparison", options: ["gt", "lt"], default: "gt" },
    ],
  },
  {
    type: "SignalValueVsLastSignalRunStatistic",
    params: [
      { name: "value_key", kind: "column", label: "value_key" },
      { name: "signal_key", kind: "signal", label: "signal_key" },
      {
        name: "statistic",
        kind: "select",
        label: "statistic",
        options: ["mean", "min", "max", "median", "percentile"],
        default: "mean",
      },
      { name: "percentile", kind: "number", label: "percentile", default: 50 },
      { name: "comparison", kind: "select", label: "comparison", options: ["gt", "lt"], default: "gt" },
    ],
  },
  {
    type: "SignalEMAFastSlowComparison",
    params: [
      { name: "value_key", kind: "column", label: "value_key" },
      { name: "ema_period_1", kind: "number", label: "ema_period_1", default: 12 },
      { name: "ema_period_2", kind: "number", label: "ema_period_2", default: 26 },
      { name: "prefer", kind: "select", label: "prefer", options: ["fast", "slow"], default: "fast" },
    ],
  },
  {
    type: "SignalEMADiffVsHistoryPercentile",
    params: [
      { name: "value_key", kind: "column", label: "value_key" },
      { name: "ema_period_1", kind: "number", label: "ema_period_1", default: 12 },
      { name: "ema_period_2", kind: "number", label: "ema_period_2", default: 26 },
      { name: "history_window", kind: "number", label: "history_window", default: 50 },
      { name: "percentile", kind: "number", label: "percentile", default: 90 },
      { name: "min_history", kind: "number", label: "min_history", default: 1 },
      { name: "comparison", kind: "select", label: "comparison", options: ["gt", "lt"], default: "gt" },
      { name: "trace_limit", kind: "number", label: "trace_limit", default: "" },
    ],
  },
  {
    type: "SignalIntervalBetweenMarkers",
    params: [
      { name: "start_signal_key", kind: "signal", label: "start_signal_key" },
      { name: "end_signal_key", kind: "signal", label: "end_signal_key" },
      { name: "max_length", kind: "number", label: "max_length", default: "" },
      { name: "intervals_limit", kind: "number", label: "intervals_limit", default: "" },
    ],
  },
  {
    type: "SignalNthTargetWithinWindowAfterTrigger",
    params: [
      { name: "trigger_signal_key", kind: "signal", label: "trigger_signal_key" },
      { name: "target_signal_key", kind: "signal", label: "target_signal_key" },
      { name: "window_length", kind: "number", label: "window_length", default: 20 },
      { name: "target_index", kind: "number", label: "target_index", default: 1 },
    ],
  },
  {
    type: "SignalIntersection",
    params: [
      { name: "signal_keys", kind: "signal-list", label: "signal_keys" },
    ],
  },
  {
    type: "SignalExternalFlag",
    external: true,
    hidden: true,
    params: [
      { name: "signal_key", kind: "text", label: "signal_key" },
      { name: "true_value", kind: "text", label: "true_value", default: "1" },
    ],
  },
];

const SIGNAL_DEF_MAP = new Map(SIGNAL_DEFS.map((def) => [def.type, def]));

function formatParamLabel(param) {
  if (!param) {
    return "";
  }
  const base = param.label || param.name || "";
  if (param.kind === "signal" || param.kind === "signal-list") {
    const suffix = t("signal.dependency.suffix");
    return suffix ? `${base} ${suffix}` : base;
  }
  return base;
}

function translateOptional(key, fallback) {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

function formatSelectOptionLabel(option) {
  return translateOptional(`signal.option.${option}`, option);
}

function formatBooleanOptionLabel(value) {
  return translateOptional(`bool.${value}`, value);
}

const DEFAULT_HTF_BASE = "../../packages/htf-js/htf";
const TEMPLATE_STORAGE_KEY = "htf-signal-templates";
const TEMPLATE_STORAGE_VERSION = 1;

const HTF_SCRIPT_FILES = [
  "utils.js",
  "timeframe.js",
  "features.js",
  "signals.js",
  "coordinator.js",
  "framework.js",
  "viz/multi_timeframe_plot.js",
  "viz/index.js",
  "index.js",
];

function normalizeHtfBase(value) {
  if (!value) {
    return "";
  }
  const trimmed = String(value).trim().replace(/^["']|["']$/g, "");
  return trimmed.replace(/\/+$/, "");
}

function getHtfBase() {
  let base = "";
  if (document.documentElement && document.documentElement.dataset) {
    base = document.documentElement.dataset.htfBase || "";
  }
  if (!base && document.body && document.body.dataset) {
    base = document.body.dataset.htfBase || "";
  }
  if (!base && window.getComputedStyle && document.documentElement) {
    base = getComputedStyle(document.documentElement).getPropertyValue("--htf-base") || "";
  }
  base = normalizeHtfBase(base);
  return base || DEFAULT_HTF_BASE;
}

const HTF_BASE = getHtfBase();
const HTF_SCRIPT_SOURCES = HTF_SCRIPT_FILES.map((file) => `${HTF_BASE}/${file}`);

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-htf-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
      } else {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
      }
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.htfSrc = src;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
    document.head.appendChild(script);
  });
}

function loadHTFLibrary() {
  if (window.HTF && window.HTF.signalGraph && window.HTF.viz) {
    return Promise.resolve();
  }
  return HTF_SCRIPT_SOURCES.reduce((promise, src) => promise.then(() => loadScriptOnce(src)), Promise.resolve());
}

function createExternalSignalDraft() {
  return {
    file: null,
    fileName: "",
    fileType: "",
    rows: [],
    columns: [],
    mapping: { year: "", month: "", day: "", hour: "", minute: "", second: "" },
    signalColumn: "",
    trueValue: "1",
    error: "",
    status: "",
  };
}

const state = {
  series: [],
  activeSeriesId: null,
  plotMode: "ltf",
  hierarConstraintIntersection: {
    style: DEFAULT_INTERSECTION_STYLE,
    color: DEFAULT_INTERSECTION_COLOR,
    opacity: DEFAULT_HIERAR_CONSTRAINT_OPACITY,
    selectedSeriesIds: new Set(),
    selectionInitialized: false,
    selectionMode: "all",
  },
  hierarConstraintGateEnabled: false,
  exportState: {
    seriesId: null,
    selectedIds: new Set(),
    applyHierarConstraint: false,
    includeDependencies: false,
    includeValues: false,
    directoryHandle: null,
  },
  intersectionExportState: {
    seriesId: null,
    selectedIds: new Set(),
    includeDependencies: false,
    includeValues: false,
    directoryHandle: null,
    signalMap: new Map(),
  },
  openSeriesMenuId: null,
  openTemplateMenuName: "",
  signalPicker: {
    mode: "",
    parentId: "",
    paramName: "",
    step: "type",
    tab: "types",
    external: createExternalSignalDraft(),
  },
  templateSave: {
    mode: "create",
    originalName: "",
    seriesId: "",
    rootId: "",
  },
};

const plotZoomState = {
  initialRanges: null,
  lastRanges: null,
  pendingInitialCapture: false,
  syncing: false,
};

let signalSequence = 0;

const elements = {
  addSeries: document.getElementById("add-series"),
  seriesList: document.getElementById("series-list"),
  wizardOverlay: document.getElementById("wizard-overlay"),
  wizardTitle: document.getElementById("wizard-title"),
  wizardClose: document.getElementById("wizard-close"),
  wizardPrev: document.getElementById("wizard-prev"),
  wizardNext: document.getElementById("wizard-next"),
  wizardStatus: document.getElementById("wizard-status"),
  wizardTabs: document.querySelectorAll(".tab-btn"),
  exportOverlay: document.getElementById("export-overlay"),
  seriesMenuPortal: document.getElementById("series-menu-portal"),
  seriesMenuPopover: document.getElementById("series-menu-popover"),
  templateMenuPortal: document.getElementById("template-menu-portal"),
  templateMenuPopover: document.getElementById("template-menu-popover"),
  exportClose: document.getElementById("export-close"),
  exportSubtitle: document.getElementById("export-subtitle"),
  exportSignalList: document.getElementById("export-signal-list"),
  exportSignalEmpty: document.getElementById("export-signal-empty"),
  exportApplyHierarConstraint: document.getElementById("export-apply-hierar-constraint"),
  exportIncludeDeps: document.getElementById("export-include-deps"),
  exportIncludeValues: document.getElementById("export-include-values"),
  exportDirectory: document.getElementById("export-directory"),
  exportPickDirectory: document.getElementById("export-pick-directory"),
  exportFileName: document.getElementById("export-file-name"),
  exportFileType: document.getElementById("export-file-type"),
  exportSave: document.getElementById("export-save"),
  exportStatus: document.getElementById("export-status"),
  wizardSteps: {
    source: document.getElementById("step-source"),
    scale: document.getElementById("step-scale"),
    signals: document.getElementById("step-signals"),
    viz: document.getElementById("step-viz"),
  },
  fileInput: document.getElementById("file-input"),
  sourceUpload: document.getElementById("source-upload"),
  sourceExisting: document.getElementById("source-existing"),
  sourceExistingList: document.getElementById("source-existing-list"),
  sourcePickOther: document.getElementById("source-pick-other"),
  sourceSummary: document.getElementById("source-summary"),
  sourceFile: document.getElementById("source-file"),
  sourceColumns: document.getElementById("source-columns"),
  sourceNumeric: document.getElementById("source-numeric"),
  sourceActions: document.getElementById("source-actions"),
  sourceDelete: document.getElementById("source-delete"),
  sourceReplace: document.getElementById("source-replace"),
  sourceError: document.getElementById("source-error"),
  mapSelects: {
    year: document.getElementById("map-year"),
    month: document.getElementById("map-month"),
    day: document.getElementById("map-day"),
    hour: document.getElementById("map-hour"),
    minute: document.getElementById("map-minute"),
    second: document.getElementById("map-second"),
  },
  valueColumn: document.getElementById("value-column"),
  sourceResetMapping: document.getElementById("source-reset-mapping"),
  scaleValue: document.getElementById("scale-value"),
  scaleUnits: document.getElementById("scale-units"),
  scaleError: document.getElementById("scale-error"),
  aggregateMethod: document.getElementById("aggregate-method"),
  percentileWrap: document.getElementById("percentile-wrap"),
  aggregatePercentile: document.getElementById("aggregate-percentile"),
  signalTree: document.getElementById("signal-tree"),
  signalDetail: document.getElementById("signal-detail"),
  signalDetailEmpty: document.getElementById("signal-detail-empty"),
  signalTemplateHint: document.getElementById("signal-template-hint"),
  signalTemplateSave: document.getElementById("signal-template-save"),
  signalAdd: document.getElementById("signal-add"),
  signalBack: document.getElementById("signal-back"),
  signalPicker: document.getElementById("signal-picker"),
  signalPickerTitle: document.getElementById("signal-picker-title"),
  signalPickerTabs: document.getElementById("signal-picker-tabs"),
  signalPickerOptions: document.getElementById("signal-picker-options"),
  signalPickerActions: document.getElementById("signal-picker-actions"),
  signalTemplateImport: document.getElementById("signal-template-import"),
  signalTemplateImportInput: document.getElementById("signal-template-import-input"),
  signalTemplateStatus: document.getElementById("signal-template-status"),
  signalPickerClose: document.getElementById("signal-picker-close"),
  collapseAllSignals: document.getElementById("collapse-all-signals"),
  downSignalSelect: document.getElementById("down-signal-select"),
  downSignalNote: document.getElementById("down-signal-note"),
  signalWarning: document.getElementById("signal-warning"),
  vizElements: document.getElementById("viz-elements"),
  addVizElement: document.getElementById("add-viz-element"),
  hierarConstraintPanel: document.getElementById("hierar-constraint-panel"),
  hierarConstraintControls: document.getElementById("hierar-constraint-controls"),
  hierarConstraintNote: document.getElementById("hierar-constraint-note"),
  vizPicker: document.getElementById("viz-picker"),
  vizPickerOptions: document.getElementById("viz-picker-options"),
  vizPickerClose: document.getElementById("viz-picker-close"),
  hierarConstraintGateToggle: document.getElementById("hierar-constraint-gate-toggle"),
  intersectionWrap: document.getElementById("intersection-wrap"),
  intersectionToggle: document.getElementById("intersection-toggle"),
  intersectionOverlay: document.getElementById("intersection-overlay"),
  intersectionClose: document.getElementById("intersection-close"),
  intersectionSelectAll: document.getElementById("intersection-select-all"),
  intersectionSignalList: document.getElementById("intersection-signal-list"),
  intersectionSignalEmpty: document.getElementById("intersection-signal-empty"),
  intersectionStyleSelect: document.getElementById("intersection-style"),
  intersectionColorPicker: document.getElementById("intersection-color-picker"),
  intersectionOpacity: document.getElementById("intersection-opacity"),
  intersectionExportSeries: document.getElementById("intersection-export-series"),
  intersectionExportSignalList: document.getElementById("intersection-export-signal-list"),
  intersectionExportSignalEmpty: document.getElementById("intersection-export-signal-empty"),
  intersectionExportIncludeDeps: document.getElementById("intersection-export-include-deps"),
  intersectionExportIncludeValues: document.getElementById("intersection-export-include-values"),
  intersectionExportDirectory: document.getElementById("intersection-export-directory"),
  intersectionExportPickDirectory: document.getElementById("intersection-export-pick-directory"),
  intersectionExportFileName: document.getElementById("intersection-export-file-name"),
  intersectionExportFileType: document.getElementById("intersection-export-file-type"),
  intersectionExportSave: document.getElementById("intersection-export-save"),
  intersectionExportStatus: document.getElementById("intersection-export-status"),
  plotMode: document.getElementById("plot-mode"),
  plotModeWrap: document.getElementById("plot-mode-wrap"),
  plot: document.getElementById("plot"),
  plotEmpty: document.getElementById("plot-empty"),
  legendList: document.getElementById("legend-list"),
  templateSaveModal: document.getElementById("template-save-modal"),
  templateSaveTitle: document.getElementById("template-save-title"),
  templateSaveName: document.getElementById("template-save-name"),
  templateSaveCancel: document.getElementById("template-save-cancel"),
  templateSaveConfirm: document.getElementById("template-save-confirm"),
  templateSaveNote: document.getElementById("template-save-note"),
  toast: document.getElementById("toast"),
  toastMessage: document.getElementById("toast-message"),
  toastClose: document.getElementById("toast-close"),
};

let currentStep = "source";
let toastTimer = null;

function init() {
  elements.addSeries.addEventListener("click", () => openWizardForNew());
  elements.wizardClose.addEventListener("click", closeWizard);
  elements.wizardPrev.addEventListener("click", () => shiftStep(-1));
  elements.wizardNext.addEventListener("click", () => shiftStep(1));
  elements.seriesMenuPortal.addEventListener("click", handleSeriesMenuPortalClick);
  elements.exportClose.addEventListener("click", closeExportPanel);
  elements.exportOverlay.addEventListener("click", (event) => {
    if (event.target === elements.exportOverlay) {
      closeExportPanel();
    }
  });
  elements.exportSignalList.addEventListener("change", handleExportSignalSelection);
  elements.exportApplyHierarConstraint.addEventListener("change", () => {
    state.exportState.applyHierarConstraint = elements.exportApplyHierarConstraint.checked;
  });
  elements.exportIncludeDeps.addEventListener("change", () => {
    state.exportState.includeDependencies = elements.exportIncludeDeps.checked;
  });
  elements.exportIncludeValues.addEventListener("change", () => {
    state.exportState.includeValues = elements.exportIncludeValues.checked;
  });
  elements.exportPickDirectory.addEventListener("click", handleExportPickDirectory);
  elements.exportSave.addEventListener("click", handleExportSave);
  elements.seriesList.addEventListener("click", handleSeriesListClick);
  elements.fileInput.addEventListener("change", handleFileChange);
  if (elements.sourceExistingList) {
    elements.sourceExistingList.addEventListener("click", handleSourceExistingClick);
  }
  if (elements.sourcePickOther) {
    elements.sourcePickOther.addEventListener("click", handlePickOtherFile);
  }
  if (elements.sourceReplace) {
    elements.sourceReplace.addEventListener("click", handleReplaceFile);
  }
  if (elements.sourceDelete) {
    elements.sourceDelete.addEventListener("click", handleSourceDelete);
  }
  if (elements.sourceResetMapping) {
    elements.sourceResetMapping.addEventListener("click", handleResetMapping);
  }
  elements.aggregateMethod.addEventListener("change", handleAggregateChange);
  elements.aggregatePercentile.addEventListener("input", updateScaleFromForm);
  elements.scaleValue.addEventListener("input", updateScaleFromForm);
  elements.scaleUnits.addEventListener("change", updateScaleFromForm);
  elements.valueColumn.addEventListener("change", updateValueColumn);
  elements.signalAdd.addEventListener("click", openSignalPickerForRoot);
  elements.signalBack.addEventListener("click", handleSignalBack);
  if (elements.signalTemplateSave) {
    elements.signalTemplateSave.addEventListener("click", openTemplateSaveModal);
  }
  elements.signalPickerClose.addEventListener("click", closeSignalPicker);
  elements.signalPicker.addEventListener("click", (event) => {
    if (event.target === elements.signalPicker) {
      closeSignalPicker();
    }
  });
  if (elements.signalPickerOptions) {
    elements.signalPickerOptions.addEventListener("scroll", () => {
      if (state.openTemplateMenuName) {
        closeTemplateMenu();
      }
    });
  }
  document.addEventListener("click", handleTemplateMenuDocumentClick);
  if (elements.signalPickerTabs) {
    elements.signalPickerTabs.addEventListener("click", handleSignalPickerTabClick);
  }
  if (elements.signalTemplateImport) {
    elements.signalTemplateImport.addEventListener("click", handleTemplateImportClick);
  }
  if (elements.signalTemplateImportInput) {
    elements.signalTemplateImportInput.addEventListener("change", handleTemplateImportFiles);
  }
  if (elements.templateSaveModal) {
    elements.templateSaveModal.addEventListener("click", (event) => {
      if (event.target === elements.templateSaveModal) {
        closeTemplateSaveModal();
      }
    });
  }
  if (elements.templateSaveCancel) {
    elements.templateSaveCancel.addEventListener("click", closeTemplateSaveModal);
  }
  if (elements.templateSaveConfirm) {
    elements.templateSaveConfirm.addEventListener("click", handleTemplateSaveConfirm);
  }
  if (elements.templateSaveName) {
    elements.templateSaveName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleTemplateSaveConfirm();
      }
    });
  }
  if (elements.toastClose) {
    elements.toastClose.addEventListener("click", hideToast);
  }
  elements.collapseAllSignals.addEventListener("click", () => {
    const series = getActiveSeries();
    if (!series) {
      return;
    }
    setAllSignalsCollapsed(series, true);
    renderSignalPanel(series);
  });
  elements.downSignalSelect.addEventListener("change", () => {
    const series = getActiveSeries();
    if (!series) {
      return;
    }
    series.signals.downwardSignalId = elements.downSignalSelect.value;
    updateSignalStatus(series);
    updateWizardStatus(series);
    updateDownSignalNote(series, collectSignalNodes(series));
    renderPlot();
  });
  elements.addVizElement.addEventListener("click", openVizPicker);
  elements.vizPickerClose.addEventListener("click", closeVizPicker);
  if (elements.intersectionToggle) {
    elements.intersectionToggle.addEventListener("click", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      openIntersectionPanel();
    });
  }
  if (elements.intersectionClose) {
    elements.intersectionClose.addEventListener("click", closeIntersectionPanel);
  }
  if (elements.intersectionOverlay) {
    elements.intersectionOverlay.addEventListener("click", (event) => {
      if (event.target === elements.intersectionOverlay) {
        closeIntersectionPanel();
      }
    });
  }
  if (elements.intersectionSelectAll) {
    elements.intersectionSelectAll.addEventListener("click", handleIntersectionSelectAll);
  }
  if (elements.intersectionSignalList) {
    elements.intersectionSignalList.addEventListener("change", handleIntersectionSignalSelection);
  }
  if (elements.intersectionStyleSelect) {
    elements.intersectionStyleSelect.addEventListener("change", handleIntersectionStyleChange);
  }
  if (elements.intersectionOpacity) {
    elements.intersectionOpacity.addEventListener("input", handleIntersectionOpacityChange);
  }
  if (elements.intersectionExportSeries) {
    elements.intersectionExportSeries.addEventListener("change", handleIntersectionExportSeriesChange);
  }
  if (elements.intersectionExportSignalList) {
    elements.intersectionExportSignalList.addEventListener("change", handleIntersectionExportSignalSelection);
  }
  if (elements.intersectionExportIncludeDeps) {
    elements.intersectionExportIncludeDeps.addEventListener("change", () => {
      state.intersectionExportState.includeDependencies = elements.intersectionExportIncludeDeps.checked;
    });
  }
  if (elements.intersectionExportIncludeValues) {
    elements.intersectionExportIncludeValues.addEventListener("change", () => {
      state.intersectionExportState.includeValues = elements.intersectionExportIncludeValues.checked;
    });
  }
  if (elements.intersectionExportPickDirectory) {
    elements.intersectionExportPickDirectory.addEventListener("click", handleIntersectionExportPickDirectory);
  }
  if (elements.intersectionExportSave) {
    elements.intersectionExportSave.addEventListener("click", handleIntersectionExportSave);
  }
  if (elements.hierarConstraintGateToggle) {
    elements.hierarConstraintGateToggle.checked = Boolean(state.hierarConstraintGateEnabled);
    elements.hierarConstraintGateToggle.addEventListener("change", () => {
      state.hierarConstraintGateEnabled = elements.hierarConstraintGateToggle.checked;
      renderPlot();
    });
  }
  elements.plotMode.addEventListener("change", () => {
    state.plotMode = elements.plotMode.value;
    renderPlot();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".series-menu-wrap")) {
      closeAllSeriesMenus();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllSeriesMenus();
    }
  });

  elements.wizardTabs.forEach((tab) => {
    tab.addEventListener("click", () => setStep(tab.dataset.step));
  });

  Object.values(elements.mapSelects).forEach((select) => {
    select.addEventListener("change", updateMappingFromForm);
  });

  renderSeriesList();
  updatePlotModeOptions();
  renderPlot();
}

function refreshTemplateSaveModal() {
  if (!elements.templateSaveModal || elements.templateSaveModal.classList.contains("hidden")) {
    return;
  }
  const isRename = state.templateSave.mode === "rename";
  setTemplateSaveTitle(isRename ? t("template.save.title.rename") : t("template.save.title"));
  if (
    elements.templateSaveNote &&
    (elements.templateSaveNote.classList.contains("is-error") ||
      elements.templateSaveNote.classList.contains("is-success"))
  ) {
    return;
  }
  setTemplateSaveNote(isRename ? t("template.save.note.rename") : t("template.save.note.create"));
}

function refreshI18nUi() {
  renderSeriesList();
  updatePlotModeOptions();

  const active = getActiveSeries();
  if (elements.wizardOverlay && !elements.wizardOverlay.classList.contains("hidden")) {
    setStep(currentStep);
  } else if (active) {
    renderSourcePanel(active);
    renderScalePanel(active);
    renderSignalPanel(active);
    renderVizPanel(active);
  }

  renderPlot();

  if (elements.exportOverlay && !elements.exportOverlay.classList.contains("hidden")) {
    const series = state.series.find((item) => item.id === state.exportState.seriesId);
    if (series) {
      renderExportPanel(series);
    }
  }

  if (elements.intersectionOverlay && !elements.intersectionOverlay.classList.contains("hidden")) {
    renderIntersectionSignalList();
    renderIntersectionStyleControls();
    renderIntersectionExportPanel();
  }

  if (elements.signalPicker && !elements.signalPicker.classList.contains("hidden")) {
    if (active) {
      renderSignalPicker(active);
    }
  }

  refreshTemplateSaveModal();
}

function openWizardForNew() {
  const newSeries = createSeries();
  state.series.push(newSeries);
  state.activeSeriesId = newSeries.id;
  updateRolesAndSort();
  openWizard();
}

function openWizardForExisting(seriesId) {
  state.activeSeriesId = seriesId;
  openWizard();
}

function openWizard() {
  closeAllSeriesMenus();
  currentStep = "source";
  elements.wizardOverlay.classList.remove("hidden");
  hydrateWizardForm();
  setStep(currentStep);
}

function closeWizard() {
  elements.wizardOverlay.classList.add("hidden");
  state.activeSeriesId = null;
  renderSeriesList();
  updatePlotModeOptions();
  renderPlot();
}

function shiftStep(delta) {
  const steps = ["source", "scale", "signals", "viz"];
  const idx = Math.max(0, steps.indexOf(currentStep));
  const next = Math.min(steps.length - 1, idx + delta);
  if (idx === steps.length - 1 && delta > 0) {
    closeWizard();
    return;
  }
  setStep(steps[next]);
}

function setStep(step) {
  currentStep = step;
  Object.entries(elements.wizardSteps).forEach(([key, section]) => {
    section.classList.toggle("active", key === step);
  });
  elements.wizardTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.step === step);
  });
  elements.wizardPrev.textContent = t("wizard.footer.prev");
  elements.wizardNext.textContent = step === "viz" ? t("wizard.footer.finish") : t("wizard.footer.next");
  hydrateWizardForm();
}

function hydrateWizardForm() {
  const series = getActiveSeries();
  if (!series) {
    return;
  }

  elements.wizardTitle.textContent = series.name || t("wizard.title.series");
  renderSourcePanel(series);
  renderScalePanel(series);
  renderSignalPanel(series);
  renderVizPanel(series);
  updateWizardStatus(series);
}

function getActiveSeries() {
  return state.series.find((item) => item.id === state.activeSeriesId) || null;
}

function createSeries() {
  return {
    id: `series-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    scaleValue: "",
    scaleUnit: "",
    aggregateMethod: "mean",
    aggregatePercentile: 50,
    role: "LTF",
    source: null,
    data: [],
    externalSignals: [],
    externalSignalErrors: [],
    signals: { items: [], downwardSignalId: "", activeId: "" },
    viz: {
      elements: [],
      initialized: false,
      hierarConstraint: {
        color: "",
        style: DEFAULT_HIERAR_CONSTRAINT_STYLE,
        opacity: DEFAULT_HIERAR_CONSTRAINT_OPACITY,
      },
    },
    status: {
      source: false,
      scale: false,
      signals: false,
      viz: false,
    },
  };
}

function updateRolesAndSort() {
  state.series.sort((a, b) => scaleWeight(a) - scaleWeight(b));
  state.series.forEach((series, idx) => {
    series.role = idx === 0 ? "LTF" : "HTF";
    series.name = buildSeriesName(series);
  });
}

function scaleWeight(series) {
  const value = Number(series.scaleValue || 0);
  const unit = TIME_UNITS.find((u) => u.key === series.scaleUnit);
  if (!unit || !value) {
    return Number.POSITIVE_INFINITY;
  }
  return value * unit.seconds;
}

function buildSeriesName(series) {
  if (!series.scaleValue || !series.scaleUnit) {
    return series.role === "LTF" ? "LTF" : "HTF";
  }
  const unit = TIME_UNITS.find((u) => u.key === series.scaleUnit);
  const short = unit ? unit.short : series.scaleUnit;
  return `${series.role} · ${series.scaleValue}${short}`;
}

function renderSeriesList() {
  if (!state.series.length) {
    elements.seriesList.innerHTML =
      `<div class="series-empty"><div class="empty-title">${t("series.empty.title")}</div><div class="empty-desc">${t(
        "series.empty.desc"
      )}</div></div>`;
    updatePlotModeOptions();
    return;
  }
  const cards = state.series
    .map((series) => renderSeriesCard(series))
    .join("");
  elements.seriesList.innerHTML = cards;
  updatePlotModeOptions();
}

function renderSeriesCard(series) {
  const isIncomplete = !isSeriesComplete(series);
  const badges = [
    `<span class="badge ${series.role === "LTF" ? "ltf" : ""}">${series.role}</span>`,
  ];
  if (isIncomplete) {
    badges.push(`<span class="badge incomplete">${t("series.badge.incomplete")}</span>`);
  }
  const sourceLabel = series.source ? series.source.fileName : "-";
  const valueLabel = series.source ? series.source.valueColumn : "-";
  const unit = TIME_UNITS.find((entry) => entry.key === series.scaleUnit);
  const unitLabel = unit ? t(unit.labelKey) : series.scaleUnit;
  const scaleLabel =
    series.scaleValue && unitLabel ? `${series.scaleValue} ${unitLabel}` : t("series.scale.unset");
  return `
    <div class="series-card ${isIncomplete ? "is-incomplete" : ""}">
      <div class="series-meta">
        <div class="series-name">${series.name || t("series.defaultName")}</div>
        <div class="series-sub">${scaleLabel} · ${valueLabel || "-"} · ${sourceLabel}</div>
      </div>
      <div class="series-actions">
        <div class="series-badges">
          ${badges.join("")}
        </div>
        <div class="series-menu-wrap">
          <button class="series-menu" type="button" data-id="${series.id}">⋮</button>
        </div>
      </div>
    </div>
  `;
}

function isSeriesComplete(series) {
  return series.status.source && series.status.scale && series.status.signals && series.status.viz;
}

function handleSeriesListClick(event) {
  const menuButton = event.target.closest(".series-menu");
  if (menuButton) {
    event.stopPropagation();
    toggleSeriesMenu(menuButton);
    return;
  }

  closeAllSeriesMenus();
}

function toggleSeriesMenu(button) {
  const seriesId = button.dataset.id;
  if (!seriesId) {
    return;
  }
  if (state.openSeriesMenuId === seriesId) {
    closeSeriesMenuPortal();
    return;
  }
  closeSeriesMenuPortal();
  openSeriesMenuPortal(button, seriesId);
}

function closeAllSeriesMenus() {
  closeSeriesMenuPortal();
}

function handleSeriesMenuPortalClick(event) {
  const menuItem = event.target.closest(".series-menu-item");
  if (menuItem) {
    event.stopPropagation();
    const action = menuItem.dataset.action;
    const seriesId = menuItem.dataset.id;
    closeSeriesMenuPortal();
    handleSeriesMenuAction(action, seriesId);
    return;
  }
  if (event.target === elements.seriesMenuPortal) {
    closeSeriesMenuPortal();
  }
}

function openSeriesMenuPortal(button, seriesId) {
  if (!elements.seriesMenuPortal || !elements.seriesMenuPopover) {
    return;
  }
  elements.seriesMenuPopover.innerHTML = `
    <button class="series-menu-item" type="button" data-action="configure" data-id="${seriesId}">
      ${t("action.configure")}
    </button>
    <button class="series-menu-item" type="button" data-action="save" data-id="${seriesId}">
      ${t("action.save")}
    </button>
    <button class="series-menu-item danger" type="button" data-action="delete" data-id="${seriesId}">
      ${t("action.delete")}
    </button>
  `;
  elements.seriesMenuPortal.classList.remove("hidden");
  positionSeriesMenuPopover(button, elements.seriesMenuPopover);
  state.openSeriesMenuId = seriesId;
}

function closeSeriesMenuPortal() {
  if (!elements.seriesMenuPortal || !elements.seriesMenuPopover) {
    return;
  }
  elements.seriesMenuPortal.classList.add("hidden");
  elements.seriesMenuPopover.innerHTML = "";
  elements.seriesMenuPopover.style.left = "";
  elements.seriesMenuPopover.style.top = "";
  elements.seriesMenuPopover.style.visibility = "";
  state.openSeriesMenuId = null;
}

function positionSeriesMenuPopover(button, popover) {
  const rect = button.getBoundingClientRect();
  popover.style.visibility = "hidden";
  popover.style.left = "0px";
  popover.style.top = "0px";
  const width = popover.offsetWidth;
  const height = popover.offsetHeight;
  const margin = 8;
  let left = rect.right - width;
  if (left + width > window.innerWidth - margin) {
    left = window.innerWidth - width - margin;
  }
  if (left < margin) {
    left = margin;
  }
  let top = rect.bottom + margin;
  if (top + height > window.innerHeight - margin) {
    top = rect.top - height - margin;
  }
  if (top < margin) {
    top = margin;
  }
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  popover.style.visibility = "";
}

function handleSeriesMenuAction(action, seriesId) {
  if (!seriesId) {
    return;
  }
  if (action === "configure") {
    openWizardForExisting(seriesId);
    return;
  }
  if (action === "save") {
    openExportPanel(seriesId);
    return;
  }
  if (action === "delete") {
    deleteSeries(seriesId);
  }
}

function deleteSeries(seriesId) {
  const idx = state.series.findIndex((item) => item.id === seriesId);
  if (idx === -1) {
    return;
  }
  state.series.splice(idx, 1);
  if (state.activeSeriesId === seriesId) {
    state.activeSeriesId = null;
  }
  updateRolesAndSort();
  renderSeriesList();
  updatePlotModeOptions();
  renderPlot();
}

function openExportPanel(seriesId) {
  const series = state.series.find((item) => item.id === seriesId);
  if (!series) {
    return;
  }
  const directoryHandle = state.exportState.directoryHandle;
  state.exportState = {
    seriesId,
    selectedIds: new Set(),
    applyHierarConstraint: false,
    includeDependencies: false,
    includeValues: false,
    directoryHandle,
    signalMap: new Map(),
  };
  renderExportPanel(series);
  elements.exportOverlay.classList.remove("hidden");
}

function closeExportPanel() {
  elements.exportOverlay.classList.add("hidden");
  setExportStatus("");
}

function renderExportPanel(series) {
  const nodes = collectSignalNodes(series);
  state.exportState.signalMap = new Map(nodes.map((node) => [node.id, node]));
  state.exportState.selectedIds.clear();

  elements.exportSubtitle.textContent = series?.name ? t("export.subtitle", { name: series.name }) : "";
  elements.exportSignalList.innerHTML = "";
  if (!nodes.length) {
    elements.exportSignalEmpty.classList.remove("hidden");
  } else {
    elements.exportSignalEmpty.classList.add("hidden");
    nodes.forEach((node) => {
      const item = document.createElement("label");
      item.className = "export-signal-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.id = node.id;

      const textWrap = document.createElement("div");
      textWrap.className = "export-signal-text";
      const title = document.createElement("div");
      title.className = "export-signal-title";
      title.textContent = buildSignalAlias(node);
      const sub = document.createElement("div");
      sub.className = "export-signal-sub";
      sub.textContent = node.type || "";

      textWrap.appendChild(title);
      textWrap.appendChild(sub);
      item.appendChild(checkbox);
      item.appendChild(textWrap);
      elements.exportSignalList.appendChild(item);
    });
  }

  elements.exportApplyHierarConstraint.checked = state.exportState.applyHierarConstraint;
  elements.exportIncludeDeps.checked = state.exportState.includeDependencies;
  elements.exportIncludeValues.checked = state.exportState.includeValues;
  elements.exportDirectory.value = state.exportState.directoryHandle
    ? state.exportState.directoryHandle.name
    : t("export.directory.downloads");
  elements.exportFileName.value = buildDefaultExportName(series);
  elements.exportFileType.value = "csv";

  updateExportSaveState();
  setExportStatus("");
}

function handleExportSignalSelection(event) {
  const checkbox = event.target.closest('input[type="checkbox"][data-id]');
  if (!checkbox) {
    return;
  }
  const signalId = checkbox.dataset.id;
  if (checkbox.checked) {
    state.exportState.selectedIds.add(signalId);
  } else {
    state.exportState.selectedIds.delete(signalId);
  }
  updateExportSaveState();
}

async function handleExportPickDirectory() {
  setExportStatus("");
  if (typeof window.showDirectoryPicker !== "function") {
    setExportStatus(t("export.directory.unsupported"), "error");
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    state.exportState.directoryHandle = handle;
    elements.exportDirectory.value = handle.name || t("export.directory.selected");
    setExportStatus("");
  } catch (err) {
    if (err && err.name === "AbortError") {
      return;
    }
    setExportStatus(t("export.directory.failed"), "error");
  }
}

async function handleExportSave() {
  const series = state.series.find((item) => item.id === state.exportState.seriesId);
  if (!series) {
    setExportStatus(t("export.error.noSeries"), "error");
    return;
  }
  if (!state.exportState.selectedIds.size) {
    setExportStatus(t("export.error.noSignalsSelected"), "error");
    return;
  }
  if (!window.HTF || !window.HTF.TimeframeView || !window.HTF.TimeframeConfig) {
    setExportStatus(t("export.error.libraryNotReady"), "error");
    return;
  }

  setExportStatus(t("export.status.generating"), "");

  try {
    const selectedNodes = Array.from(state.exportState.selectedIds)
      .map((id) => state.exportState.signalMap.get(id))
      .filter(Boolean);
    const frames = collectExportFrames(series, selectedNodes, {
      applyHierarConstraint: state.exportState.applyHierarConstraint,
      includeDependencies: state.exportState.includeDependencies,
      includeValues: state.exportState.includeValues,
    });
    const merged = mergeExportFrames(frames);
    if (!merged.rows.length) {
      setExportStatus(t("export.error.noData"), "error");
      return;
    }

    const fileType = elements.exportFileType.value || "csv";
    const fileName = normalizeExportFileName(elements.exportFileName.value, fileType, series);

    if (fileType === "xlsx") {
      if (typeof XLSX === "undefined") {
        throw new Error(t("export.error.xlsxMissing"));
      }
      const blob = buildXlsxBlob(merged.rows, merged.columns);
      await saveBlobToDestination(blob, fileName, state.exportState.directoryHandle);
    } else {
      const csv = buildCsvContent(merged.rows, merged.columns);
      const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
      await saveBlobToDestination(blob, fileName, state.exportState.directoryHandle);
    }

    setExportStatus(t("export.status.saved"), "success");
  } catch (err) {
    console.error(err);
    setExportStatus(t("export.error.saveFailed"), "error");
  }
}

function updateExportSaveState() {
  elements.exportSave.disabled = state.exportState.selectedIds.size === 0;
}

function setExportStatus(message, kind = "") {
  elements.exportStatus.textContent = message || "";
  elements.exportStatus.classList.toggle("is-error", kind === "error");
  elements.exportStatus.classList.toggle("is-success", kind === "success");
}

function buildDefaultExportName(series) {
  const base = series && series.name ? series.name : t("export.defaultFileName");
  const suffix = t("export.defaultSuffix");
  return sanitizeFileName(`${base}-${suffix}`);
}

function sanitizeFileName(value) {
  const raw = String(value || "").trim();
  return raw.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/\s+/g, " ").trim();
}

function normalizeExportFileName(raw, extension, series) {
  const base = sanitizeFileName(raw || buildDefaultExportName(series)) || t("export.defaultFileName");
  const ext = String(extension || "csv").toLowerCase();
  const stripped = base.replace(/\.(csv|xlsx)$/i, "");
  return `${stripped}.${ext}`;
}

function detectExportTimeColumns(rows) {
  const keys = new Set();
  rows.forEach((row) => {
    if (!row) {
      return;
    }
    Object.keys(row).forEach((key) => {
      keys.add(key);
    });
  });
  const columns = [];
  Object.entries(TIME_COLUMN_DEFAULTS).forEach(([, aliases]) => {
    const found = aliases.find((alias) => keys.has(alias));
    if (found) {
      columns.push(found);
    }
  });
  return columns;
}

function buildRowKey(row, timeCols, index) {
  if (!timeCols.length) {
    return String(index);
  }
  return timeCols
    .map((col) => {
      const value = row ? row[col] : null;
      return value == null ? "" : String(value);
    })
    .join("|");
}

function collectExportFrames(series, nodes, options) {
  const resolvedOptions = options || {};
  const data = Array.isArray(series.data) ? series.data : [];
  const maxBuffer = Math.max(1, data.length);
  const tf = new window.HTF.TimeframeView({
    config: new window.HTF.TimeframeConfig({
      name: series.name || series.id,
      window_size: 1,
      max_buffer: maxBuffer,
      role: series.role || "LTF",
    }),
  });
  tf.buffer = data.map((point) => ({ ...point }));

  const frames = [];
  let hierarConstraintSeries = null;
  let timeframeSeries = null;
  if (resolvedOptions.applyHierarConstraint) {
    if (resolvedOptions.hierarConstraintSeries) {
      hierarConstraintSeries = resolvedOptions.hierarConstraintSeries;
    } else {
      const timeframes = [...state.series].sort((a, b) => scaleWeight(b) - scaleWeight(a));
      const signalCache = new Map();
      hierarConstraintSeries = buildHierarConstraintSeries(timeframes, signalCache);
    }
    if (resolvedOptions.timeframeSeries) {
      timeframeSeries = resolvedOptions.timeframeSeries;
    } else {
      timeframeSeries = [...state.series].sort((a, b) => scaleWeight(b) - scaleWeight(a));
    }
  }

  nodes.forEach((node) => {
    const rows = tf.export_signal_dataframe({
      signal_type: node.type,
      signal_alias: buildSignalAlias(node),
      include_dependencies: resolvedOptions.includeDependencies,
      include_values: resolvedOptions.includeValues,
      hierar_constraint_series: hierarConstraintSeries,
      timeframe_series: timeframeSeries,
      signal_graph: series.signals.items,
      signal_defs: SIGNAL_DEF_MAP,
      timestamp_key: "ts",
      current_series_id: series.id,
    });
    frames.push({
      rows,
      columns: rows.length ? Object.keys(rows[0]) : [],
      timeCols: detectExportTimeColumns(rows),
    });
  });

  return frames;
}

function buildHierarConstraintSeries(seriesList, signalCache) {
  return seriesList.map((series) => {
    const data = Array.isArray(series.data) ? series.data : [];
    const timestamps = data.map((point) => point.ts);
    let flags = null;
    const downId = series.signals ? series.signals.downwardSignalId : "";
    if (downId) {
      const outputs = getSeriesSignalOutputs(series, signalCache);
      flags = outputs.get(downId) || [];
    }
    return {
      id: series.id,
      name: series.name,
      timestamps,
      downward_flags: flags,
    };
  });
}

function buildIntersectionHierarConstraintSeries(seriesList, signalCache, selectedIds) {
  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
  return seriesList.map((series) => {
    const data = Array.isArray(series.data) ? series.data : [];
    const timestamps = data.map((point) => point.ts);
    let flags = null;
    const downId = series.signals ? series.signals.downwardSignalId : "";
    if (downId && selected.has(series.id)) {
      const outputs = getSeriesSignalOutputs(series, signalCache);
      flags = outputs.get(downId) || [];
    }
    return {
      id: series.id,
      name: series.name,
      timestamps,
      downward_flags: flags,
    };
  });
}

function buildIntersectionTimeframeSeries(seriesList, selectedIds) {
  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
  return seriesList.map((series) => {
    if (!series || !series.signals || !series.signals.downwardSignalId) {
      return series;
    }
    if (selected.has(series.id)) {
      return series;
    }
    return { ...series, signals: { ...series.signals, downwardSignalId: "" } };
  });
}

function mergeExportFrames(frames) {
  if (!frames.length) {
    return { rows: [], columns: [] };
  }
  const base = frames[0];
  const timeCols = base.timeCols || [];
  let columns = base.columns.slice();
  const rows = base.rows.map((row) => ({ ...row }));
  const indexMap = new Map();
  rows.forEach((row, idx) => {
    indexMap.set(buildRowKey(row, timeCols, idx), idx);
  });

  frames.slice(1).forEach((frame) => {
    const newCols = frame.columns.filter((col) => !columns.includes(col));
    columns = columns.concat(newCols);
    rows.forEach((row) => {
      newCols.forEach((col) => {
        if (!Object.prototype.hasOwnProperty.call(row, col)) {
          row[col] = null;
        }
      });
    });
    frame.rows.forEach((row, idx) => {
      const key = buildRowKey(row, timeCols, idx);
      if (indexMap.has(key)) {
        const target = rows[indexMap.get(key)];
        newCols.forEach((col) => {
          if (!Object.prototype.hasOwnProperty.call(target, col)) {
            target[col] = row[col] ?? null;
          }
        });
      } else {
        const newRow = {};
        columns.forEach((col) => {
          newRow[col] = Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null;
        });
        rows.push(newRow);
        indexMap.set(key, rows.length - 1);
      }
    });
  });

  return { rows, columns };
}

function buildCsvContent(rows, columns) {
  const escapeValue = (value) => {
    if (value == null) {
      return "";
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    const text = String(value);
    if (text.includes('"') || text.includes(",") || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const header = columns.map(escapeValue).join(",");
  const lines = rows.map((row) => columns.map((col) => escapeValue(row[col])).join(","));
  return [header, ...lines].join("\n");
}

function buildXlsxBlob(rows, columns) {
  const aoa = [columns.slice()];
  rows.forEach((row) => {
    aoa.push(columns.map((col) => row[col]));
  });
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, t("export.sheetName"));
  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function saveBlobToDestination(blob, fileName, directoryHandle) {
  const handle = directoryHandle !== undefined ? directoryHandle : state.exportState.directoryHandle;
  if (handle && typeof window.showDirectoryPicker === "function") {
    const fileHandle = await handle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function normalizeTimeMapping(mapping) {
  const next = { ...mapping };
  const used = new Set();
  TIME_UNITS.forEach((unit) => {
    const col = next[unit.key];
    if (!col) {
      return;
    }
    if (used.has(col)) {
      next[unit.key] = "";
      return;
    }
    used.add(col);
  });
  return next;
}

function buildTimeColumnOptions(columns, mapping, unitKey) {
  const blocked = new Set();
  for (const unit of TIME_UNITS) {
    if (unit.key === unitKey) {
      break;
    }
    const col = mapping[unit.key];
    if (col) {
      blocked.add(col);
    }
  }
  return columns.filter((col) => !blocked.has(col));
}

function buildValueColumnOptions(dataSource) {
  if (!dataSource) {
    return [];
  }
  const used = new Set(Object.values(dataSource.mapping).filter(Boolean));
  return dataSource.numericColumns.filter((col) => !used.has(col));
}

function buildExternalSignalColumnOptions(columns, mapping) {
  const used = new Set(Object.values(mapping || {}).filter(Boolean));
  return (columns || []).filter((col) => !used.has(col));
}

function normalizeExternalValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }
  const lowered = raw.toLowerCase();
  if (lowered === "true") {
    return true;
  }
  if (lowered === "false") {
    return false;
  }
  const num = Number(raw);
  if (Number.isFinite(num)) {
    return num;
  }
  return raw;
}

function formatExternalValue(value) {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

function getFileType(fileName) {
  const match = String(fileName || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!match) {
    return "";
  }
  const ext = match[1];
  if (ext === "xls") {
    return "xlsx";
  }
  if (ext === "csv" || ext === "xlsx") {
    return ext;
  }
  return ext;
}

function formatFileType(fileType) {
  return fileType ? String(fileType).toUpperCase() : "";
}

function columnsMatch(prev, next) {
  if (!Array.isArray(prev) || !Array.isArray(next)) {
    return false;
  }
  if (prev.length !== next.length) {
    return false;
  }
  const prevSet = new Set(prev);
  if (prevSet.size !== next.length) {
    return false;
  }
  return next.every((col) => prevSet.has(col));
}

function cloneSource(source) {
  if (!source) {
    return null;
  }
  return {
    fileName: source.fileName,
    fileType: source.fileType,
    rows: source.rows,
    columns: Array.isArray(source.columns) ? source.columns.slice() : [],
    numericColumns: Array.isArray(source.numericColumns) ? source.numericColumns.slice() : [],
    mapping: { ...(source.mapping || {}) },
    valueColumn: source.valueColumn || "",
  };
}

function getOtherSeriesSources(series) {
  return state.series
    .filter((item) => item.source && (!series || item.id !== series.id))
    .map((item) => ({ series: item, source: item.source }));
}

function renderSourceExistingList(series) {
  if (!elements.sourceExistingList) {
    return;
  }
  elements.sourceExistingList.innerHTML = "";
  const sources = getOtherSeriesSources(series);
  if (!sources.length) {
    elements.sourceExistingList.innerHTML = `<div class='helper-text'>${t("source.existing.empty")}</div>`;
    return;
  }
  sources.forEach((entry) => {
    const source = entry.source;
    const card = document.createElement("div");
    card.className = "source-file-card";

    const info = document.createElement("div");
    info.className = "source-file-info";

    const title = document.createElement("div");
    title.className = "source-file-title";
    const name = document.createElement("span");
    name.textContent = source.fileName || "-";
    title.appendChild(name);
    const type = document.createElement("span");
    type.className = "source-file-type";
    type.textContent = formatFileType(source.fileType || getFileType(source.fileName)) || "-";
    title.appendChild(type);
    info.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "source-file-meta";
    meta.textContent = t("source.existing.meta", { name: entry.series.name || entry.series.role || entry.series.id });
    info.appendChild(meta);

    const cols = document.createElement("div");
    cols.className = "source-file-cols";
    const columnsText =
      Array.isArray(source.columns) && source.columns.length ? source.columns.join(", ") : "-";
    cols.textContent = t("source.existing.columns", { columns: columnsText });
    info.appendChild(cols);

    const useBtn = document.createElement("button");
    useBtn.type = "button";
    useBtn.className = "btn ghost small source-use-btn";
    useBtn.textContent = t("action.use");
    useBtn.dataset.sourceSeriesId = entry.series.id;

    card.appendChild(info);
    card.appendChild(useBtn);
    elements.sourceExistingList.appendChild(card);
  });
}

function applySourceMapping(series, nextMapping) {
  if (!series || !series.source) {
    return;
  }
  series.source.mapping = normalizeTimeMapping(nextMapping);
  const valueOptions = buildValueColumnOptions(series.source);
  if (!valueOptions.includes(series.source.valueColumn)) {
    series.source.valueColumn = valueOptions[0] || "";
  }
}

function renderSourcePanel(series) {
  if (!series) {
    return;
  }
  const source = series.source;
  const otherSources = getOtherSeriesSources(series);

  if (!source && !otherSources.length) {
    elements.sourceUpload.classList.remove("hidden");
    if (elements.sourceExisting) {
      elements.sourceExisting.classList.add("hidden");
    }
    elements.sourceSummary.classList.add("hidden");
    if (elements.sourceActions) {
      elements.sourceActions.classList.add("hidden");
    }
  } else if (!source && otherSources.length) {
    elements.sourceUpload.classList.add("hidden");
    if (elements.sourceExisting) {
      elements.sourceExisting.classList.remove("hidden");
    }
    elements.sourceSummary.classList.add("hidden");
    if (elements.sourceActions) {
      elements.sourceActions.classList.add("hidden");
    }
    renderSourceExistingList(series);
  } else {
    elements.sourceUpload.classList.add("hidden");
    if (elements.sourceExisting) {
      elements.sourceExisting.classList.add("hidden");
    }
    elements.sourceSummary.classList.remove("hidden");
    if (elements.sourceActions) {
      elements.sourceActions.classList.remove("hidden");
    }
    elements.sourceFile.textContent = source.fileName;
    elements.sourceColumns.textContent = `${source.columns.length}`;
    elements.sourceNumeric.textContent = source.numericColumns.join(", ") || "-";
  }

  if (elements.sourceResetMapping) {
    elements.sourceResetMapping.disabled = !source;
  }

  const columns = source ? source.columns : [];
  const mapping = source ? source.mapping : {};
  Object.entries(elements.mapSelects).forEach(([unit, select]) => {
    const options = source ? buildTimeColumnOptions(columns, mapping, unit) : [];
    populateSelect(select, options, mapping[unit] || "");
    select.disabled = !source;
  });

  populateSelect(elements.valueColumn, source ? buildValueColumnOptions(source) : [], source ? source.valueColumn : "");
  elements.valueColumn.disabled = !source;
  updateSourceStatus(series);
}

function renderScalePanel(series) {
  elements.scaleValue.value = series.scaleValue || "";
  elements.aggregateMethod.value = series.aggregateMethod || "mean";
  elements.aggregatePercentile.value = series.aggregatePercentile ?? 50;
  elements.percentileWrap.classList.toggle("hidden", series.aggregateMethod !== "percentile");
  elements.scaleUnits.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = t("scale.selectUnit");
  elements.scaleUnits.appendChild(placeholder);
  TIME_UNITS.forEach((unit) => {
    const option = document.createElement("option");
    option.value = unit.key;
    option.textContent = t(unit.labelKey);
    elements.scaleUnits.appendChild(option);
  });
  elements.scaleUnits.value = series.scaleUnit || "";
  elements.scaleUnits.disabled = !series.source;
  updateScaleStatus(series);
}

function renderSignalPanel(series) {
  if (series && Array.isArray(series.externalSignals) && series.externalSignals.length) {
    syncExternalSignals(series);
  }
  ensureActiveSignal(series);
  const nodes = collectSignalNodes(series);
  const duplicateIds = getDuplicateSignalIds(series);
  renderSignalTree(series);
  renderSignalDetail(series);
  elements.collapseAllSignals.disabled = series.signals.items.length === 0;
  renderDownSignalControls(series, nodes);
  renderSignalWarning(duplicateIds, series);
  updateSignalStatus(series);
  updateWizardStatus(series);
}

function ensureActiveSignal(series) {
  if (!series || !series.signals) {
    return null;
  }
  const nodes = collectSignalNodes(series);
  const active = nodes.find((node) => node.id === series.signals.activeId);
  if (active) {
    return active;
  }
  const fallback = nodes[0] || null;
  series.signals.activeId = fallback ? fallback.id : "";
  return fallback;
}

function selectSignalNode(series, nodeId) {
  if (!series || !nodeId) {
    return;
  }
  if (series.signals.activeId === nodeId) {
    return;
  }
  series.signals.activeId = nodeId;
  renderSignalPanel(series);
}

function renderSignalTree(series) {
  elements.signalTree.innerHTML = "";
  if (!series.signals.items.length) {
    elements.signalTree.innerHTML = `<div class='helper-text'>${t("signal.empty")}</div>`;
    return;
  }
  const roots = [...series.signals.items].sort((a, b) => (a.order || 0) - (b.order || 0));
  roots.forEach((root) => {
    elements.signalTree.appendChild(renderSignalNode(root, series, 0));
  });
}

function renderSignalNode(node, series, depth) {
  const wrapper = document.createElement("div");
  wrapper.className = "signal-tree-node";
  wrapper.style.setProperty("--depth", depth);

  const bar = document.createElement("div");
  const isActive = series.signals.activeId === node.id;
  bar.className = `signal-bar${depth > 0 ? " is-child" : ""}${isActive ? " is-active" : ""}`;
  bar.addEventListener("click", () => selectSignalNode(series, node.id));

  const meta = document.createElement("div");
  meta.className = "signal-meta";

  const aliasInput = document.createElement("input");
  aliasInput.type = "text";
  aliasInput.className = "signal-alias-input";
  aliasInput.value = node.alias || "";
  aliasInput.addEventListener("input", (evt) => {
    node.alias = evt.target.value;
    node.aliasEdited = Boolean(evt.target.value.trim());
  });
  aliasInput.addEventListener("click", (evt) => {
    evt.stopPropagation();
  });
  aliasInput.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      aliasInput.blur();
    }
  });
  aliasInput.addEventListener("blur", () => {
    commitSignalAlias(node, series, aliasInput);
  });
  meta.appendChild(aliasInput);

  const typeLabel = document.createElement("div");
  typeLabel.className = "signal-type-text";
  typeLabel.textContent = node.type;
  meta.appendChild(typeLabel);

  const actions = document.createElement("div");
  actions.className = "signal-bar-actions";

  const children = getOrderedChildren(node);
  if (children.length) {
    const collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "btn ghost";
    collapseBtn.textContent = node.collapsed ? t("action.expand") : t("action.collapse");
    collapseBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      node.collapsed = !node.collapsed;
      renderSignalPanel(series);
    });
    actions.appendChild(collapseBtn);
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn ghost";
  deleteBtn.textContent = t("action.delete");
  deleteBtn.addEventListener("click", (evt) => {
    evt.stopPropagation();
    removeSignalNode(node.id);
  });
  actions.appendChild(deleteBtn);

  bar.appendChild(meta);
  bar.appendChild(actions);
  wrapper.appendChild(bar);

  if (!node.collapsed) {
    if (children.length) {
      const childWrap = document.createElement("div");
      childWrap.className = "signal-tree-children";
      children.forEach((child) => {
        childWrap.appendChild(renderSignalNode(child, series, depth + 1));
      });
      wrapper.appendChild(childWrap);
    }

    const summary = getNodeDependencySummary(node);
    if (summary.canAdd) {
      const action = document.createElement("div");
      action.className = "signal-dep-action";
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "btn ghost signal-dep-btn";
      addBtn.textContent = buildDependencyAddLabel(summary.count, summary.required);
      addBtn.addEventListener("click", (evt) => {
        evt.stopPropagation();
        openSignalPickerForDependency(node.id, "");
      });
      action.appendChild(addBtn);
      wrapper.appendChild(action);
    }
  }

  return wrapper;
}

function commitSignalAlias(node, series, input) {
  const next = (input.value || "").trim();
  if (!next) {
    if (isExternalSignalNode(node)) {
      const external = getExternalSignalConfig(series, node);
      node.alias = buildExternalSignalAlias(series, external || {});
    } else {
      node.alias = buildDefaultAlias(node.type, series, node.id);
    }
    node.aliasEdited = false;
  } else {
    node.alias = next;
    node.aliasEdited = true;
  }
  input.value = node.alias || "";
  renderSignalPanel(series);
  renderVizPanel(series);
}

function renderSignalDetail(series) {
  elements.signalDetail.innerHTML = "";
  const active = ensureActiveSignal(series);
  if (!active) {
    elements.signalDetailEmpty.classList.remove("hidden");
    elements.signalBack.classList.add("hidden");
    updateTemplateSaveControls(series, null, null);
    return;
  }
  elements.signalDetailEmpty.classList.add("hidden");

  const parentInfo = findSignalParent(series, active.id);
  elements.signalBack.classList.toggle("hidden", !parentInfo);
  updateTemplateSaveControls(series, active, parentInfo);

  const header = document.createElement("div");
  header.className = "signal-detail-header";
  const aliasInput = document.createElement("input");
  aliasInput.type = "text";
  aliasInput.className = "signal-detail-alias";
  aliasInput.value = active.alias || "";
  aliasInput.placeholder = buildDefaultAlias(active.type, series, active.id);
  aliasInput.addEventListener("input", (evt) => {
    active.alias = evt.target.value;
    active.aliasEdited = Boolean(evt.target.value.trim());
  });
  aliasInput.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      aliasInput.blur();
    }
  });
  aliasInput.addEventListener("blur", () => {
    commitSignalAlias(active, series, aliasInput);
  });
  const type = document.createElement("div");
  type.className = "signal-detail-type";
  type.textContent = active.type;
  header.appendChild(aliasInput);
  header.appendChild(type);
  elements.signalDetail.appendChild(header);

  if (isExternalSignalNode(active)) {
    const external = getExternalSignalConfig(series, active);
    const summary = document.createElement("div");
    summary.className = "source-summary";
    const rows = [
      { label: t("externalSignal.summary.file"), value: external ? external.fileName : "-" },
      { label: t("externalSignal.summary.column"), value: external ? external.signalColumn : "-" },
      { label: t("externalSignal.summary.trueValue"), value: external ? formatExternalValue(external.trueValue) : "-" },
      {
        label: t("externalSignal.summary.status"),
        value: external ? (external.valid ? t("externalSignal.status.valid") : t("externalSignal.status.invalid")) : "-",
      },
    ];
    rows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "summary-row";
      const label = document.createElement("span");
      label.className = "summary-label";
      label.textContent = row.label;
      const value = document.createElement("span");
      value.className = "summary-value";
      value.textContent = row.value;
      item.appendChild(label);
      item.appendChild(value);
      summary.appendChild(item);
    });
    elements.signalDetail.appendChild(summary);

    if (external && external.error) {
      const error = document.createElement("div");
      error.className = "error-box";
      error.textContent = external.error;
      elements.signalDetail.appendChild(error);
    }

    const note = document.createElement("div");
    note.className = "helper-text";
    note.textContent = t("externalSignal.detail.note");
    elements.signalDetail.appendChild(note);
    return;
  }

  const typeSelect = document.createElement("select");
  SIGNAL_DEFS.filter((item) => !item.hidden).forEach((item) => {
    const option = document.createElement("option");
    option.value = item.type;
    option.textContent = item.type;
    option.selected = item.type === active.type;
    typeSelect.appendChild(option);
  });
  typeSelect.addEventListener("change", (evt) => {
    active.type = evt.target.value;
    active.params = buildSignalParams(active.type, series);
    active.children = {};
    if (!active.aliasEdited) {
      active.alias = buildDefaultAlias(active.type, series, active.id);
    }
    renderSignalPanel(series);
    renderVizPanel(series);
  });
  elements.signalDetail.appendChild(wrapParam(t("signal.param.type"), typeSelect));

  const def = SIGNAL_DEF_MAP.get(active.type);
  if (!def) {
    return;
  }
  def.params.forEach((param) => {
    if (param.kind === "signal" || param.kind === "signal-list") {
      elements.signalDetail.appendChild(renderDependencyParam(active, series, param));
      return;
    }

    if (param.kind === "column") {
      const select = document.createElement("select");
      const options = series.source ? series.source.numericColumns : [];
      options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        option.selected = active.params[param.name] === opt;
        select.appendChild(option);
      });
      select.addEventListener("change", (evt) => {
        active.params[param.name] = evt.target.value;
        renderSignalPanel(series);
      });
      elements.signalDetail.appendChild(wrapParam(formatParamLabel(param), select));
      return;
    }

    if (param.kind === "boolean") {
      const select = document.createElement("select");
      ["true", "false"].forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = formatBooleanOptionLabel(opt);
        option.selected = String(active.params[param.name]) === opt;
        select.appendChild(option);
      });
      select.addEventListener("change", (evt) => {
        active.params[param.name] = evt.target.value === "true";
        renderSignalPanel(series);
      });
      elements.signalDetail.appendChild(wrapParam(formatParamLabel(param), select));
      return;
    }

    if (param.kind === "number") {
      const input = document.createElement("input");
      input.type = "number";
      input.value = active.params[param.name] ?? "";
      input.addEventListener("input", (evt) => {
        active.params[param.name] = evt.target.value;
      });
      input.addEventListener("change", () => {
        renderSignalPanel(series);
      });
      elements.signalDetail.appendChild(wrapParam(formatParamLabel(param), input));
      return;
    }

    if (param.kind === "select") {
      const select = document.createElement("select");
      param.options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = formatSelectOptionLabel(opt);
        option.selected = active.params[param.name] === opt;
        select.appendChild(option);
      });
      select.addEventListener("change", (evt) => {
        active.params[param.name] = evt.target.value;
        renderSignalPanel(series);
      });
      elements.signalDetail.appendChild(wrapParam(formatParamLabel(param), select));
      return;
    }

    const input = document.createElement("input");
    input.type = "text";
    input.value = active.params[param.name] ?? "";
    input.addEventListener("input", (evt) => {
      active.params[param.name] = evt.target.value;
    });
    input.addEventListener("change", () => {
      renderSignalPanel(series);
    });
    elements.signalDetail.appendChild(wrapParam(formatParamLabel(param), input));
  });
}

function renderDependencyParam(node, series, param) {
  const wrapper = document.createElement("div");
  wrapper.className = "signal-param";
  const label = document.createElement("label");
  label.textContent = formatParamLabel(param);
  wrapper.appendChild(label);

  const list = document.createElement("div");
  list.className = "signal-dep-list";
  const childList = node.children[param.name] || [];
  childList.forEach((child) => {
    list.appendChild(renderDependencyItem(child, series));
  });
  wrapper.appendChild(list);

  const requiredCount = getDependencyRequiredCount(param);
  const allowAdd = param.kind === "signal-list" || childList.length < 1;
  const needsMore = requiredCount && childList.length < requiredCount;

  if (allowAdd || needsMore) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn ghost signal-dep-btn";
    addBtn.textContent = buildDependencyAddLabel(childList.length, requiredCount);
    addBtn.addEventListener("click", () => {
      openSignalPickerForDependency(node.id, param.name);
    });
    wrapper.appendChild(addBtn);
  }

  return wrapper;
}

function renderDependencyItem(node, series) {
  const item = document.createElement("div");
  item.className = "signal-dep-item";
  const text = document.createElement("div");
  text.className = "signal-dep-text";
  const title = document.createElement("div");
  title.className = "signal-dep-title";
  title.textContent = buildSignalAlias(node);
  const sub = document.createElement("div");
  sub.className = "signal-dep-sub";
  sub.textContent = node.type;
  text.appendChild(title);
  text.appendChild(sub);
  item.appendChild(text);
  item.addEventListener("click", () => {
    selectSignalNode(series, node.id);
  });
  return item;
}

function getOrderedChildren(node) {
  const children = [];
  Object.values(node.children || {}).forEach((list) => {
    list.forEach((child) => {
      children.push(child);
    });
  });
  return children.sort((a, b) => (a.order || 0) - (b.order || 0));
}

function getNodeDependencySummary(node) {
  const def = SIGNAL_DEF_MAP.get(node.type);
  if (!def) {
    return { hasDependencies: false, required: 0, count: 0, canAdd: false };
  }
  let required = 0;
  let count = 0;
  let hasDependencies = false;
  let canAdd = false;
  def.params.forEach((param) => {
    if (param.kind !== "signal" && param.kind !== "signal-list") {
      return;
    }
    hasDependencies = true;
    const list = node.children[param.name] || [];
    count += list.length;
    const req = getDependencyRequiredCount(param);
    if (req) {
      required += req;
    }
    if (param.kind === "signal" && list.length < 1) {
      canAdd = true;
    }
    if (param.kind === "signal-list") {
      canAdd = true;
    }
  });
  return { hasDependencies, required, count, canAdd };
}

function renderVizPanel(series) {
  syncVizElements(series);
  renderVizElements(series);
  renderHierarConstraintPanel(series);
  updateVizStatus(series);
  updateWizardStatus(series);
}

function populateSelect(select, options, selected) {
  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "—";
  select.appendChild(empty);
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    if (opt === selected) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function triggerFilePicker() {
  if (elements.fileInput) {
    elements.fileInput.click();
  }
}

function handleSourceExistingClick(event) {
  const button = event.target.closest("[data-source-series-id]");
  if (!button) {
    return;
  }
  const series = getActiveSeries();
  const sourceSeriesId = button.dataset.sourceSeriesId;
  const sourceSeries = state.series.find((item) => item.id === sourceSeriesId);
  if (!series || !sourceSeries || !sourceSeries.source) {
    return;
  }
  series.source = cloneSource(sourceSeries.source);
  applySourceMapping(series, series.source.mapping);
  hideSourceError();
  updateSeriesSource(series);
  hydrateWizardForm();
}

function handlePickOtherFile() {
  triggerFilePicker();
}

function handleReplaceFile() {
  triggerFilePicker();
}

function handleSourceDelete() {
  const series = getActiveSeries();
  if (!series) {
    return;
  }
  series.source = null;
  updateSeriesSource(series);
  hideSourceError();
  hydrateWizardForm();
}

function handleResetMapping() {
  const series = getActiveSeries();
  if (!series || !series.source) {
    return;
  }
  const mapping = guessTimeMapping(series.source.columns);
  series.source.mapping = mapping;
  series.source.valueColumn = series.source.numericColumns[0] || "";
  applySourceMapping(series, series.source.mapping);
  updateSeriesSource(series);
  renderSourcePanel(series);
}

function handleFileChange(event) {
  const series = getActiveSeries();
  const file = event.target.files[0];
  if (!file || !series) {
    return;
  }
  event.target.value = "";
  const prevSource = series.source;
  readFile(file)
    .then((rows) => {
      if (!rows.length) {
        showSourceError(t("source.error.emptyOrInvalid"));
        return;
      }
      const columns = collectColumns(rows);
      const numericColumns = detectNumericColumns(rows, columns);
      if (!numericColumns.length) {
        showSourceError(t("source.error.noNumeric"));
        return;
      }
      const reuseMapping = Boolean(prevSource && columnsMatch(prevSource.columns, columns));
      const mapping = reuseMapping ? { ...prevSource.mapping } : guessTimeMapping(columns);
      const valueColumn = reuseMapping ? prevSource.valueColumn : numericColumns[0];
      if (!hasMinimumTimeMapping(mapping)) {
        const requiredUnits = [
          t("time.year"),
          t("time.month"),
          t("time.day"),
          t("time.hour"),
          t("time.minute"),
        ].join("/");
        showSourceError(t("source.error.insufficientTimeColumns", { units: requiredUnits }));
        return;
      }
      series.source = {
        fileName: file.name,
        fileType: getFileType(file.name),
        rows,
        columns,
        numericColumns,
        mapping,
        valueColumn,
      };
      applySourceMapping(series, series.source.mapping);
      hideSourceError();
      updateSeriesSource(series);
      hydrateWizardForm();
    })
    .catch(() => {
      showSourceError(t("source.error.readFailed"));
    });
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read error"));
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function collectColumns(rows) {
  const colSet = new Set();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      colSet.add(key);
    });
  });
  return Array.from(colSet);
}

function detectNumericColumns(rows, columns) {
  return columns.filter((col) => {
    let numericCount = 0;
    let total = 0;
    for (let i = 0; i < Math.min(rows.length, 50); i += 1) {
      const val = rows[i][col];
      if (val === null || val === undefined || val === "") {
        continue;
      }
      total += 1;
      if (!Number.isNaN(Number(val))) {
        numericCount += 1;
      }
    }
    return total > 0 && numericCount / total >= 0.6;
  });
}

function guessTimeMapping(columns) {
  const mapping = { year: "", month: "", day: "", hour: "", minute: "", second: "" };
  Object.entries(TIME_COLUMN_DEFAULTS).forEach(([unit, aliases]) => {
    const match = columns.find((col) => aliases.includes(col));
    if (match) {
      mapping[unit] = match;
    }
  });
  return mapping;
}

function hasMinimumTimeMapping(mapping) {
  const requiredCount = ["year", "month", "day", "hour", "minute"].filter((unit) => mapping[unit]).length;
  return requiredCount >= 3;
}

function updateMappingFromForm() {
  const series = getActiveSeries();
  if (!series || !series.source) {
    return;
  }
  const mapping = { ...series.source.mapping };
  Object.entries(elements.mapSelects).forEach(([unit, select]) => {
    mapping[unit] = select.value;
  });
  applySourceMapping(series, mapping);
  updateSeriesSource(series);
  renderSourcePanel(series);
}

function updateValueColumn() {
  const series = getActiveSeries();
  if (!series || !series.source) {
    return;
  }
  series.source.valueColumn = elements.valueColumn.value;
  updateSeriesSource(series);
}

function updateSeriesSource(series) {
  if (!series) {
    return;
  }
  updateSourceStatus(series);
  if (series.scaleValue && series.scaleUnit) {
    series.data = buildAggregatedData(series);
  } else {
    series.data = [];
  }
  syncExternalSignals(series);
  fillEmptyColumnParams(series);
  updateSignalStatus(series);
  renderSeriesList();
  if (currentStep === "signals" && series.id === state.activeSeriesId) {
    renderSignalPanel(series);
  }
  renderPlot();
}

function updateSourceStatus(series) {
  if (!series.source) {
    series.status.source = false;
    return;
  }
  const mapping = series.source.mapping;
  const mappedCount = Object.values(mapping).filter((val) => Boolean(val)).length;
  const hasValue = Boolean(series.source.valueColumn);
  series.status.source = mappedCount >= 3 && hasValue;
}

function clearExternalValues(series) {
  if (!series || !Array.isArray(series.data)) {
    return;
  }
  series.data.forEach((point) => {
    if (!point || !point.values || typeof point.values !== "object") {
      return;
    }
    Object.keys(point.values).forEach((key) => {
      if (key.startsWith(EXTERNAL_SIGNAL_PREFIX)) {
        delete point.values[key];
      }
    });
  });
}

function syncExternalSignals(series) {
  if (!series) {
    return { ok: true, errors: [] };
  }
  const externals = Array.isArray(series.externalSignals) ? series.externalSignals : [];
  if (!externals.length) {
    series.externalSignalErrors = [];
    return { ok: true, errors: [] };
  }

  clearExternalValues(series);
  const errors = new Set();
  const hasScale = Boolean(series.scaleValue && series.scaleUnit);
  const timestamps = Array.isArray(series.data)
    ? series.data
        .map((point) => (point && point.ts instanceof Date ? point.ts.getTime() : null))
        .filter((val) => Number.isFinite(val))
    : [];
  const seriesSet = new Set(timestamps);
  const seriesReady = hasScale && seriesSet.size > 0;

  externals.forEach((external) => {
    external.valid = false;
    external.error = "";
    if (!seriesReady) {
      external.error = t("externalSignal.error.seriesIncomplete");
      errors.add(external.error);
      return;
    }
    if (!external.bucketMap || !(external.bucketMap instanceof Map)) {
      external.error = t("externalSignal.error.timeMismatch");
      errors.add(external.error);
      return;
    }
    if (external.bucketMap.size !== seriesSet.size) {
      external.error = t("externalSignal.error.timeMismatch");
      errors.add(external.error);
      return;
    }
    for (const key of external.bucketMap.keys()) {
      if (!seriesSet.has(key)) {
        external.error = t("externalSignal.error.timeMismatch");
        errors.add(external.error);
        return;
      }
    }
    for (const key of seriesSet.keys()) {
      if (!external.bucketMap.has(key)) {
        external.error = t("externalSignal.error.timeMismatch");
        errors.add(external.error);
        return;
      }
    }
    const featureKey = external.featureKey;
    series.data.forEach((point) => {
      if (!point || !(point.ts instanceof Date)) {
        return;
      }
      const tsKey = point.ts.getTime();
      if (!external.bucketMap.has(tsKey)) {
        external.error = t("externalSignal.error.timeMismatch");
        errors.add(external.error);
        return;
      }
      if (!point.values || typeof point.values !== "object") {
        point.values = {};
      }
      point.values[featureKey] = external.bucketMap.get(tsKey);
    });
    if (!external.error) {
      external.valid = true;
    }
  });

  series.externalSignalErrors = Array.from(errors);
  return { ok: errors.size === 0, errors: series.externalSignalErrors };
}

function updateScaleFromForm() {
  const series = getActiveSeries();
  if (!series) {
    return;
  }
  series.scaleValue = elements.scaleValue.value;
  series.scaleUnit = elements.scaleUnits.value;
  series.aggregateMethod = elements.aggregateMethod.value;
  series.aggregatePercentile = Number(elements.aggregatePercentile.value || 50);
  elements.percentileWrap.classList.toggle("hidden", series.aggregateMethod !== "percentile");
  updateRolesAndSort();
  updateScaleStatus(series);
  renderSeriesList();
  renderPlot();
}

function handleAggregateChange() {
  updateScaleFromForm();
}

function updateScaleStatus(series) {
  const hasScale = Number(series.scaleValue) > 0 && Boolean(series.scaleUnit);
  const duplicate = isDuplicateScale(series);
  if (duplicate) {
    showScaleError(t("scale.error.duplicate"));
  } else if (hasScale) {
    hideScaleError();
  }
  series.status.scale = hasScale && !duplicate;
  if (series.status.scale) {
    series.data = buildAggregatedData(series);
  }
  syncExternalSignals(series);
}

function isDuplicateScale(series) {
  return state.series.some(
    (item) =>
      item.id !== series.id &&
      item.scaleValue &&
      item.scaleUnit &&
      item.scaleValue === series.scaleValue &&
      item.scaleUnit === series.scaleUnit
  );
}

function buildAggregatedData(series) {
  if (!series.source || !series.scaleValue || !series.scaleUnit) {
    return [];
  }
  const baseData = buildBaseData(series.source);
  return aggregateData(
    baseData,
    Number(series.scaleValue),
    series.scaleUnit,
    series.aggregateMethod,
    series.aggregatePercentile,
    series.source.valueColumn
  );
}

function buildBaseData(source) {
  if (!source) {
    return [];
  }
  const mapping = source.mapping;
  const valueCol = source.valueColumn;
  const numericCols = source.numericColumns || [];
  return source.rows
    .map((row) => {
      const ts = buildTimestamp(row, mapping);
      if (!ts) {
        return null;
      }
      const values = {};
      numericCols.forEach((col) => {
        const num = Number(row[col]);
        values[col] = Number.isFinite(num) ? num : null;
      });
      const val = values[valueCol];
      if (!isFiniteNumber(val)) {
        return null;
      }
      return { ts, value: val, values, raw: row };
    })
    .filter(Boolean);
}

function buildTimestamp(row, mapping) {
  const year = mapping.year ? Number(row[mapping.year]) : null;
  const month = mapping.month ? Number(row[mapping.month]) : 1;
  const day = mapping.day ? Number(row[mapping.day]) : 1;
  const hour = mapping.hour ? Number(row[mapping.hour]) : 0;
  const minute = mapping.minute ? Number(row[mapping.minute]) : 0;
  const second = mapping.second ? Number(row[mapping.second]) : 0;
  if (!year || !month || !day) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

function aggregateData(baseData, scaleValue, scaleUnit, method, percentile, valueKey) {
  const buckets = new Map();
  baseData.forEach((item) => {
    const bucket = getBucketTimestamp(item.ts, scaleValue, scaleUnit);
    if (!bucket) {
      return;
    }
    const key = bucket.getTime();
    if (!buckets.has(key)) {
      buckets.set(key, { ts: bucket, values: {} });
    }
    const stored = buckets.get(key);
    const values = item.values || {};
    Object.entries(values).forEach(([col, val]) => {
      if (!isFiniteNumber(val)) {
        return;
      }
      if (!stored.values[col]) {
        stored.values[col] = [];
      }
      stored.values[col].push(val);
    });
  });
  const result = Array.from(buckets.values())
    .map((bucket) => ({
      ts: bucket.ts,
      value: bucket.values[valueKey] ? aggregateValues(bucket.values[valueKey], method, percentile) : null,
      values: Object.entries(bucket.values).reduce((acc, [col, vals]) => {
        const agg = aggregateValues(vals, method, percentile);
        acc[col] = isFiniteNumber(agg) ? agg : null;
        return acc;
      }, {}),
    }))
    .filter((item) => isFiniteNumber(item.value))
    .sort((a, b) => a.ts - b.ts);
  return result;
}

function getBucketTimestamp(date, scaleValue, scaleUnit) {
  const ts = date.getTime();
  if (scaleUnit === "second") {
    const step = scaleValue * 1000;
    return new Date(Math.floor(ts / step) * step);
  }
  if (scaleUnit === "minute") {
    const step = scaleValue * 60 * 1000;
    return new Date(Math.floor(ts / step) * step);
  }
  if (scaleUnit === "hour") {
    const step = scaleValue * 60 * 60 * 1000;
    return new Date(Math.floor(ts / step) * step);
  }
  if (scaleUnit === "day") {
    const step = scaleValue * 24 * 60 * 60 * 1000;
    return new Date(Math.floor(ts / step) * step);
  }
  if (scaleUnit === "month") {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const idx = year * 12 + month;
    const start = Math.floor(idx / scaleValue) * scaleValue;
    const startYear = Math.floor(start / 12);
    const startMonth = start % 12;
    return new Date(Date.UTC(startYear, startMonth, 1));
  }
  if (scaleUnit === "year") {
    const year = date.getUTCFullYear();
    const startYear = Math.floor(year / scaleValue) * scaleValue;
    return new Date(Date.UTC(startYear, 0, 1));
  }
  return null;
}

function aggregateValues(values, method, percentile) {
  if (!values.length) {
    return null;
  }
  const nums = values.filter((v) => typeof v === "number");
  if (!nums.length) {
    return null;
  }
  switch (method) {
    case "min":
      return Math.min(...nums);
    case "max":
      return Math.max(...nums);
    case "median":
      return percentileValue(nums, 50);
    case "percentile":
      return percentileValue(nums, percentile ?? 50);
    default:
      return nums.reduce((sum, v) => sum + v, 0) / nums.length;
  }
}

function percentileValue(values, q) {
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * (q / 100);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = pos - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function toAxisNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (value instanceof Date) {
    const ts = value.getTime();
    return Number.isFinite(ts) ? ts : null;
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getAxisSpan(range) {
  if (!Array.isArray(range) || range.length < 2) {
    return null;
  }
  const start = toAxisNumber(range[0]);
  const end = toAxisNumber(range[1]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }
  return end - start;
}

function readPlotRanges(layout) {
  if (!layout) {
    return null;
  }
  const ranges = {};
  Object.keys(layout).forEach((key) => {
    if (!/^(xaxis|yaxis)\d*$/.test(key)) {
      return;
    }
    const axis = layout[key];
    if (!axis || !Array.isArray(axis.range) || axis.range.length < 2) {
      return;
    }
    ranges[key] = axis.range.slice(0, 2);
  });
  return Object.keys(ranges).length ? ranges : null;
}

function updatePlotRangesFromLayout() {
  const ranges = readPlotRanges(elements && elements.plot ? elements.plot._fullLayout : null);
  if (!ranges) {
    return;
  }
  if (plotZoomState.pendingInitialCapture || !plotZoomState.initialRanges) {
    plotZoomState.initialRanges = ranges;
    plotZoomState.pendingInitialCapture = false;
  }
  plotZoomState.lastRanges = ranges;
}

function resetPlotZoomState() {
  plotZoomState.initialRanges = null;
  plotZoomState.lastRanges = null;
  plotZoomState.pendingInitialCapture = false;
  plotZoomState.syncing = false;
}

function extractRangeUpdates(relayoutData) {
  const ranges = {};
  if (!relayoutData || typeof relayoutData !== "object") {
    return ranges;
  }
  Object.entries(relayoutData).forEach(([key, value]) => {
    const match = key.match(/^(xaxis|yaxis)(\d*)\.range\[(0|1)\]$/);
    if (match) {
      const axisKey = `${match[1]}${match[2]}`;
      const idx = Number(match[3]);
      if (!ranges[axisKey]) {
        ranges[axisKey] = [];
      }
      ranges[axisKey][idx] = value;
      return;
    }
    const rangeMatch = key.match(/^(xaxis|yaxis)(\d*)\.range$/);
    if (rangeMatch && Array.isArray(value)) {
      const axisKey = `${rangeMatch[1]}${rangeMatch[2]}`;
      ranges[axisKey] = value.slice(0, 2);
    }
  });
  return ranges;
}

function computeAnchorRatio(oldRange, newRange) {
  const oldSpan = getAxisSpan(oldRange);
  const newSpan = getAxisSpan(newRange);
  if (!Number.isFinite(oldSpan) || !Number.isFinite(newSpan) || newSpan === 0) {
    return 0.5;
  }
  if (oldSpan === newSpan) {
    return 0.5;
  }
  const oldStart = toAxisNumber(oldRange[0]);
  const newStart = toAxisNumber(newRange[0]);
  if (!Number.isFinite(oldStart) || !Number.isFinite(newStart)) {
    return 0.5;
  }
  const factor = oldSpan / newSpan;
  if (factor === 1) {
    return 0.5;
  }
  const anchor = (factor * newStart - oldStart) / (factor - 1);
  const ratio = (anchor - oldStart) / oldSpan;
  if (!Number.isFinite(ratio)) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, ratio));
}

function computePanRatio(oldRange, newRange) {
  const oldSpan = getAxisSpan(oldRange);
  const newSpan = getAxisSpan(newRange);
  if (!Number.isFinite(oldSpan) || !Number.isFinite(newSpan) || oldSpan === 0 || newSpan === 0) {
    return null;
  }
  if (Math.abs(oldSpan - newSpan) > 1e-9) {
    return null;
  }
  const oldStart = toAxisNumber(oldRange[0]);
  const newStart = toAxisNumber(newRange[0]);
  if (!Number.isFinite(oldStart) || !Number.isFinite(newStart)) {
    return null;
  }
  return (newStart - oldStart) / oldSpan;
}

function zoomRangeWithSpan(baseRange, targetSpan, anchorRatio) {
  const baseSpan = getAxisSpan(baseRange);
  const baseStart = toAxisNumber(baseRange[0]);
  if (!Number.isFinite(baseSpan) || !Number.isFinite(baseStart)) {
    return null;
  }
  const ratio = Number.isFinite(anchorRatio) ? Math.min(1, Math.max(0, anchorRatio)) : 0.5;
  const signedSpan = Math.sign(baseSpan || 1) * Math.abs(targetSpan);
  const anchorValue = baseStart + ratio * baseSpan;
  const newStart = anchorValue - ratio * signedSpan;
  const newEnd = newStart + signedSpan;
  return [newStart, newEnd];
}

function zoomRangeWithFactor(baseRange, factor, anchorRatio) {
  const baseSpan = getAxisSpan(baseRange);
  if (!Number.isFinite(baseSpan) || !Number.isFinite(factor) || factor === 0) {
    return null;
  }
  return zoomRangeWithSpan(baseRange, baseSpan / factor, anchorRatio);
}

function clampZoomRange(axisKey, oldRange, nextRange) {
  const initialRange = plotZoomState.initialRanges ? plotZoomState.initialRanges[axisKey] : null;
  if (!initialRange || !oldRange || !nextRange) {
    return null;
  }
  const initialSpan = getAxisSpan(initialRange);
  const nextSpan = getAxisSpan(nextRange);
  if (!Number.isFinite(initialSpan) || !Number.isFinite(nextSpan) || nextSpan === 0) {
    return null;
  }
  const scale = Math.abs(initialSpan / nextSpan);
  const clampedScale = Math.min(PLOT_ZOOM_LIMITS.maxScale, Math.max(PLOT_ZOOM_LIMITS.minScale, scale));
  if (Math.abs(clampedScale - scale) < 1e-6) {
    return null;
  }
  const baseSpan = getAxisSpan(oldRange);
  if (!Number.isFinite(baseSpan)) {
    return null;
  }
  const targetSpan = Math.sign(baseSpan || 1) * Math.abs(initialSpan) / clampedScale;
  const anchorRatio = computeAnchorRatio(oldRange, nextRange);
  return zoomRangeWithSpan(oldRange, targetSpan, anchorRatio);
}

function handlePlotRelayout(relayoutData) {
  if (plotZoomState.syncing || !plotZoomState.lastRanges || !plotZoomState.initialRanges) {
    return;
  }
  if (!relayoutData || typeof relayoutData !== "object") {
    return;
  }
  const hasAutorange = Object.keys(relayoutData).some((key) => key.endsWith(".autorange") && relayoutData[key]);
  if (hasAutorange) {
    return;
  }
  const rangeUpdates = extractRangeUpdates(relayoutData);
  const updatedAxes = Object.keys(rangeUpdates);
  if (!updatedAxes.length) {
    return;
  }

  const layoutUpdates = {};
  const appliedRanges = { ...rangeUpdates };

  updatedAxes.forEach((axisKey) => {
    const oldRange = plotZoomState.lastRanges[axisKey];
    const nextRange = rangeUpdates[axisKey];
    if (!oldRange || !nextRange || nextRange.length < 2) {
      return;
    }
    const clamped = clampZoomRange(axisKey, oldRange, nextRange);
    if (clamped) {
      layoutUpdates[`${axisKey}.range`] = clamped;
      appliedRanges[axisKey] = clamped;
    }
  });

  if (state.plotMode === "parallel") {
    const sourceAxis = updatedAxes.find((axisKey) => axisKey.startsWith("yaxis"));
    if (sourceAxis && plotZoomState.lastRanges[sourceAxis] && appliedRanges[sourceAxis]) {
      const oldRange = plotZoomState.lastRanges[sourceAxis];
      const newRange = appliedRanges[sourceAxis];
      const oldSpan = getAxisSpan(oldRange);
      const newSpan = getAxisSpan(newRange);
      if (Number.isFinite(oldSpan) && Number.isFinite(newSpan) && newSpan !== 0) {
        const spanDelta = Math.abs(oldSpan - newSpan);
        if (spanDelta <= 1e-9) {
          const panRatio = computePanRatio(oldRange, newRange);
          if (Number.isFinite(panRatio) && panRatio !== 0) {
            Object.keys(plotZoomState.lastRanges).forEach((axisKey) => {
              if (!axisKey.startsWith("yaxis") || axisKey === sourceAxis) {
                return;
              }
              if (appliedRanges[axisKey]) {
                return;
              }
              const baseRange = plotZoomState.lastRanges[axisKey];
              const baseSpan = getAxisSpan(baseRange);
              const baseStart = toAxisNumber(baseRange ? baseRange[0] : null);
              if (!Number.isFinite(baseSpan) || !Number.isFinite(baseStart)) {
                return;
              }
              const newStart = baseStart + panRatio * baseSpan;
              const newEnd = newStart + baseSpan;
              layoutUpdates[`${axisKey}.range`] = [newStart, newEnd];
            });
          }
        } else {
          const factor = oldSpan / newSpan;
          if (Number.isFinite(factor) && factor !== 0) {
            const anchorRatio = computeAnchorRatio(oldRange, newRange);
            Object.keys(plotZoomState.lastRanges).forEach((axisKey) => {
              if (!axisKey.startsWith("yaxis") || axisKey === sourceAxis) {
                return;
              }
              if (appliedRanges[axisKey]) {
                return;
              }
              const targetRange = zoomRangeWithFactor(plotZoomState.lastRanges[axisKey], factor, anchorRatio);
              if (!targetRange) {
                return;
              }
              const clamped = clampZoomRange(axisKey, plotZoomState.lastRanges[axisKey], targetRange);
              layoutUpdates[`${axisKey}.range`] = clamped || targetRange;
            });
          }
        }
      }
    }
  }

  if (Object.keys(layoutUpdates).length) {
    plotZoomState.syncing = true;
    const relayoutPromise = Plotly.relayout(elements.plot, layoutUpdates);
    const done = () => {
      plotZoomState.syncing = false;
    };
    if (relayoutPromise && typeof relayoutPromise.then === "function") {
      relayoutPromise.then(done).catch(done);
    } else {
      done();
    }
  }
}

function setupPlotInteractions() {
  if (!elements.plot || typeof elements.plot.on !== "function") {
    return;
  }
  if (typeof elements.plot.removeAllListeners === "function") {
    elements.plot.removeAllListeners("plotly_afterplot");
    elements.plot.removeAllListeners("plotly_relayout");
  }
  elements.plot.on("plotly_afterplot", () => {
    updatePlotRangesFromLayout();
  });
  elements.plot.on("plotly_relayout", handlePlotRelayout);
  resetPlotZoomState();
  plotZoomState.pendingInitialCapture = true;
}

function getSeriesSignalOutputs(series, cache) {
  if (window.HTF && window.HTF.signalGraph && typeof window.HTF.signalGraph.getSeriesSignalOutputs === "function") {
    return window.HTF.signalGraph.getSeriesSignalOutputs(series, cache);
  }
  return new Map();
}

function getHtfUtils() {
  return window.HTF && window.HTF.utils ? window.HTF.utils : null;
}

function normalizeFlagSeries(flags, length, fillValue) {
  const utils = getHtfUtils();
  if (utils && typeof utils.normalizeFlagSeries === "function") {
    return utils.normalizeFlagSeries(flags, length, fillValue);
  }
  const filled = Array.isArray(flags) ? flags.slice(0, length) : [];
  while (filled.length < length) {
    filled.push(fillValue);
  }
  return filled.map((val) => Boolean(val));
}

function truthyWindows(flags, xs) {
  const utils = getHtfUtils();
  if (utils && typeof utils.truthyWindows === "function") {
    return utils.truthyWindows(flags, xs);
  }
  const windows = [];
  let start = null;
  flags.forEach((flag, idx) => {
    if (flag) {
      if (start === null) {
        start = xs[idx];
      }
      return;
    }
    if (start !== null) {
      const end = idx > 0 ? xs[idx - 1] : start;
      windows.push([start, end]);
      start = null;
    }
  });
  if (start !== null && xs.length) {
    windows.push([start, xs[xs.length - 1]]);
  }
  return windows;
}

function intersectWindows(left, right) {
  const result = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    const [startA, endA] = left[i];
    const [startB, endB] = right[j];
    const start = Math.max(startA, startB);
    const end = Math.min(endA, endB);
    if (start <= end) {
      result.push([start, end]);
    }
    if (endA < endB) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return result;
}

function maskToSegments(mask, xs, ys) {
  const segments = [];
  let startIdx = null;
  mask.forEach((flag, idx) => {
    if (flag && startIdx === null) {
      startIdx = idx;
      return;
    }
    if (!flag && startIdx !== null) {
      segments.push([xs.slice(startIdx, idx), ys.slice(startIdx, idx)]);
      startIdx = null;
    }
  });
  if (startIdx !== null) {
    segments.push([xs.slice(startIdx), ys.slice(startIdx)]);
  }
  return segments;
}

function getLineElement(series) {
  return series.viz.elements.find((el) => el.type === "line") || null;
}

function getRawElement(series) {
  return series.viz.elements.find((el) => el.type === "raw") || null;
}

function getSignalElements(series) {
  return series.viz.elements.filter((el) => el.type === "signal" && el.signalId);
}

function findBaseSignalId(series) {
  const elements = getSignalElements(series);
  return elements.length ? elements[0].signalId : "";
}

function buildLineStyle(element) {
  if (!element) {
    return null;
  }
  return {
    color: element.color,
    width: element.lineWidth,
    dash: element.lineStyle === "solid" ? "solid" : element.lineStyle === "dashed" ? "dash" : "dot",
  };
}

function buildMarkerStyle(element, fallbackColor) {
  if (!element) {
    return { color: fallbackColor, size: 6, symbol: "circle" };
  }
  return {
    color: element.color || fallbackColor,
    size: element.size,
    symbol: element.marker,
  };
}

function buildSignalTracesForSeries(series, axisX, axisY, options) {
  const { outputs, excludeIds, showlegend } = options;
  const traces = [];
  const excluded = excludeIds || new Set();
  const signalElements = getSignalElements(series).filter((el) => !excluded.has(el.signalId));
  if (!signalElements.length) {
    return traces;
  }
  const data = series.data || [];
  signalElements.forEach((element) => {
    const flags = outputs.get(element.signalId) || [];
    const xs = [];
    const ys = [];
    flags.forEach((flag, idx) => {
      if (!flag) {
        return;
      }
      const point = data[idx];
      if (!point) {
        return;
      }
      xs.push(point.ts);
      ys.push(point.value);
    });
    traces.push({
      x: xs,
      y: ys,
      type: "scatter",
      mode: "markers",
      name: `${series.name} · ${element.label}`,
      marker: { color: element.color, size: element.size, symbol: element.marker },
      xaxis: axisX,
      yaxis: axisY,
      showlegend,
    });
  });
  return traces;
}

function buildTimeframeSeries(seriesList, signalCache) {
  if (!seriesList.length) {
    return { tfSeries: [], ltfSeries: null, htfSeries: [], baseSignalId: "" };
  }
  const tfSeries = seriesList.map((series, idx) => {
    const data = series.data || [];
    const timestamps = data.map((point) => point.ts);
    const values = data.map((point) => point.value);
    const outputs = getSeriesSignalOutputs(series, signalCache);
    const len = timestamps.length;
    let scaleSignal = new Array(len).fill(true);
    let baseSignal = new Array(len).fill(false);
    if (idx < seriesList.length - 1) {
      const scaleId = series.signals?.downwardSignalId;
      if (scaleId) {
        scaleSignal = normalizeFlagSeries(outputs.get(scaleId), len, false);
      }
    } else {
      const baseId = findBaseSignalId(series);
      if (baseId) {
        baseSignal = normalizeFlagSeries(outputs.get(baseId), len, false);
      }
    }
    return {
      id: series.id,
      name: series.name,
      timestamps,
      values,
      scaleSignal,
      baseSignal,
      seriesRef: series,
    };
  });
  const ltfSeries = tfSeries[tfSeries.length - 1];
  const htfSeries = tfSeries.slice(0, -1);
  const baseSignalId = ltfSeries ? findBaseSignalId(ltfSeries.seriesRef) : "";
  return { tfSeries, ltfSeries, htfSeries, baseSignalId };
}

function plotMultiTfsParallelTimeSeries(seriesList, signalCache, options) {
  if (window.HTF && window.HTF.viz && typeof window.HTF.viz.plotMultiTfsParallelTimeSeries === "function") {
    return window.HTF.viz.plotMultiTfsParallelTimeSeries(seriesList, signalCache, options);
  }
  return { traces: [], layout: {} };
}

function plotMultiTfsSingleTimeSerie(seriesList, signalCache, options) {
  if (window.HTF && window.HTF.viz && typeof window.HTF.viz.plotMultiTfsSingleTimeSerie === "function") {
    return window.HTF.viz.plotMultiTfsSingleTimeSerie(seriesList, signalCache, options);
  }
  return { traces: [], layout: {} };
}

function plotMultiTfsOnlyLtfTimeSerie(seriesList, signalCache, options) {
  if (window.HTF && window.HTF.viz && typeof window.HTF.viz.plotMultiTfsOnlyLtfTimeSerie === "function") {
    return window.HTF.viz.plotMultiTfsOnlyLtfTimeSerie(seriesList, signalCache, options);
  }
  return { traces: [], layout: {} };
}

function showSourceError(msg) {
  elements.sourceError.textContent = msg;
  elements.sourceError.classList.remove("hidden");
}

function hideSourceError() {
  elements.sourceError.classList.add("hidden");
}

function showScaleError(msg) {
  elements.scaleError.textContent = msg;
  elements.scaleError.classList.remove("hidden");
}

function hideScaleError() {
  elements.scaleError.classList.add("hidden");
}

function updateSignalStatus(series) {
  const nodes = collectSignalNodes(series);
  const duplicateIds = getDuplicateSignalIds(series);
  const hasSignals = series.signals.items.length > 0;
  const allComplete = nodes.length > 0 && nodes.every((node) => isSignalComplete(node));
  const downNode = nodes.find((node) => node.id === series.signals.downwardSignalId);
  const downOk = series.role === "LTF" ? true : Boolean(downNode && isSignalComplete(downNode));
  const externalErrors = Array.isArray(series.externalSignalErrors) ? series.externalSignalErrors : [];
  const externalOk = externalErrors.length === 0;
  const externalNodesOk = nodes.filter((node) => isExternalSignalNode(node)).every((node) => getExternalSignalConfig(series, node));
  series.status.signals = hasSignals && allComplete && duplicateIds.size === 0 && downOk && externalOk && externalNodesOk;
}

function isSignalComplete(node) {
  if (!node) {
    return false;
  }
  const def = SIGNAL_DEF_MAP.get(node.type);
  if (!def) {
    return false;
  }
  let ok = true;
  def.params.forEach((param) => {
    if (param.kind === "signal") {
      if (!node.children[param.name] || !node.children[param.name].length) {
        ok = false;
      }
    }
    if (param.kind === "signal-list") {
      if (!node.children[param.name] || node.children[param.name].length < 2) {
        ok = false;
      }
    }
    if (param.kind === "column") {
      const value = node.params ? node.params[param.name] : "";
      if (value === null || value === undefined || String(value).trim() === "") {
        ok = false;
      }
    }
  });
  if (!ok) {
    return false;
  }
  const childKeys = Object.keys(node.children || {});
  for (const key of childKeys) {
    const childList = node.children[key];
    if (Array.isArray(childList)) {
      for (const child of childList) {
        if (!isSignalComplete(child)) {
          return false;
        }
      }
    }
  }
  return true;
}

function openSignalPickerForRoot() {
  const series = getActiveSeries();
  if (!series) {
    return;
  }
  state.signalPicker = {
    mode: "root",
    parentId: "",
    paramName: "",
    step: "type",
    tab: "types",
    external: createExternalSignalDraft(),
  };
  setTemplateStatus("");
  renderSignalPicker(series);
  elements.signalPicker.classList.remove("hidden");
}

function openSignalPickerForDependency(parentId, paramName) {
  const series = getActiveSeries();
  if (!series) {
    return;
  }
  const parent = findSignalNode(series, parentId);
  if (!parent) {
    return;
  }
  let resolvedParam = paramName || "";
  let step = "type";
  if (!resolvedParam) {
    const options = getDependencyParamOptions(parent);
    if (options.length === 1) {
      resolvedParam = options[0].name;
    } else {
      step = "param";
    }
  }
  state.signalPicker = {
    mode: "dependency",
    parentId,
    paramName: resolvedParam,
    step,
    tab: "types",
    external: createExternalSignalDraft(),
  };
  renderSignalPicker(series);
  elements.signalPicker.classList.remove("hidden");
}

function closeSignalPicker() {
  elements.signalPicker.classList.add("hidden");
  setTemplateStatus("");
  closeTemplateMenu();
}

function renderSignalPicker(series) {
  elements.signalPickerOptions.innerHTML = "";
  const picker = state.signalPicker;
  const isTypeSelection = picker.step === "type";
  const allowTabs = isTypeSelection && (picker.mode === "root" || picker.mode === "dependency");
  const card = elements.signalPicker ? elements.signalPicker.querySelector(".signal-picker-card") : null;
  if (card) {
    card.classList.toggle("signal-picker-external", picker.tab === "external");
  }
  if (elements.signalPickerTabs) {
    elements.signalPickerTabs.classList.toggle("hidden", !allowTabs);
    if (allowTabs) {
      syncSignalPickerTabs();
    }
  }
  if (elements.signalPickerActions) {
    elements.signalPickerActions.classList.toggle("hidden", !(allowTabs && picker.tab === "templates"));
  }
  if (state.openTemplateMenuName && picker.tab !== "templates") {
    closeTemplateMenu();
  }
  if (picker.step === "param") {
    elements.signalPickerTitle.textContent = t("signal.picker.dependencyParam");
    const parent = findSignalNode(series, picker.parentId);
    const options = parent ? getDependencyParamOptions(parent) : [];
    if (!options.length) {
      const empty = document.createElement("div");
      empty.className = "helper-text";
      empty.textContent = t("signal.picker.dependencyEmpty");
      elements.signalPickerOptions.appendChild(empty);
      return;
    }
    options.forEach((opt) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "picker-option";
      item.textContent = opt.label;
      item.addEventListener("click", () => {
        state.signalPicker.paramName = opt.name;
        state.signalPicker.step = "type";
        renderSignalPicker(series);
      });
      elements.signalPickerOptions.appendChild(item);
    });
    return;
  }

  if (picker.tab === "external") {
    elements.signalPickerTitle.textContent = t("picker.signal.tab.external");
    renderExternalSignalPicker(series);
    return;
  }

  if (picker.tab !== "templates") {
    elements.signalPickerTitle.textContent =
      picker.mode === "dependency" ? t("signal.picker.dependencyType") : t("signal.picker.type");
    renderSignalTypePicker(series);
    return;
  }

  elements.signalPickerTitle.textContent =
    picker.mode === "dependency" ? t("signal.picker.dependencyTemplate") : t("signal.picker.template");
  renderTemplatePicker(series);
}

function syncSignalPickerTabs() {
  if (!elements.signalPickerTabs) {
    return;
  }
  const buttons = elements.signalPickerTabs.querySelectorAll(".picker-tab");
  buttons.forEach((btn) => {
    const tab = btn.dataset.tab;
    btn.classList.toggle("active", tab === state.signalPicker.tab);
  });
}

function handleSignalPickerTabClick(event) {
  const button = event.target.closest(".picker-tab");
  if (!button) {
    return;
  }
  const tab = button.dataset.tab;
  if (!tab || tab === state.signalPicker.tab) {
    return;
  }
  state.signalPicker.tab = tab;
  const series = getActiveSeries();
  if (series) {
    renderSignalPicker(series);
  }
}

function renderSignalTypePicker(series) {
  const picker = state.signalPicker;
  SIGNAL_DEFS.filter((def) => !def.hidden).forEach((def) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "picker-option";
    item.textContent = def.type;
    item.addEventListener("click", () => {
      if (picker.mode === "root") {
        addSignalRoot(def.type, series);
      } else {
        addSignalDependency(series, picker.parentId, picker.paramName, def.type);
      }
      closeSignalPicker();
    });
    elements.signalPickerOptions.appendChild(item);
  });
}

function renderExternalSignalPicker(series) {
  const draft = state.signalPicker.external || createExternalSignalDraft();
  state.signalPicker.external = draft;

  const wrapper = document.createElement("div");
  wrapper.className = "external-signal-form";

  const fileRow = document.createElement("div");
  fileRow.className = "external-signal-file";

  const fileInfo = document.createElement("div");
  fileInfo.className = "external-signal-file-info";
  const fileLabel = document.createElement("div");
  fileLabel.className = "external-signal-file-name";
  fileLabel.textContent = t("externalSignal.file.title");
  const fileName = document.createElement("div");
  fileName.textContent = draft.fileName || "-";
  const fileNote = document.createElement("div");
  fileNote.className = "helper-text";
  fileNote.textContent = t("externalSignal.file.note");
  fileInfo.appendChild(fileLabel);
  fileInfo.appendChild(fileName);
  fileInfo.appendChild(fileNote);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".csv,.xlsx";
  fileInput.className = "hidden";
  fileInput.addEventListener("change", (event) => handleExternalSignalFileChange(series, event));

  const fileBtn = document.createElement("button");
  fileBtn.type = "button";
  fileBtn.className = "btn ghost small";
  fileBtn.textContent = t("externalSignal.file.choose");
  fileBtn.addEventListener("click", () => fileInput.click());

  fileRow.appendChild(fileInfo);
  fileRow.appendChild(fileBtn);
  fileRow.appendChild(fileInput);
  wrapper.appendChild(fileRow);

  const mappingTitle = document.createElement("div");
  mappingTitle.className = "panel-title";
  mappingTitle.textContent = t("externalSignal.mapping.title");
  wrapper.appendChild(mappingTitle);

  const mappingGrid = document.createElement("div");
  mappingGrid.className = "mapping-grid";
  const mapping = draft.mapping || {};
  TIME_UNITS.forEach((unit) => {
    const label = document.createElement("label");
    const span = document.createElement("span");
    span.textContent = t(unit.labelKey);
    const select = document.createElement("select");
    const options = draft.columns ? buildTimeColumnOptions(draft.columns, mapping, unit.key) : [];
    populateSelect(select, options, mapping[unit.key] || "");
    select.disabled = !draft.columns.length;
    select.addEventListener("change", () => {
      const next = { ...(draft.mapping || {}) };
      next[unit.key] = select.value;
      draft.mapping = normalizeTimeMapping(next);
      const signalOptions = buildExternalSignalColumnOptions(draft.columns, draft.mapping);
      if (!signalOptions.includes(draft.signalColumn)) {
        draft.signalColumn = signalOptions[0] || "";
      }
      draft.error = "";
      draft.status = "";
      renderSignalPicker(series);
    });
    label.appendChild(span);
    label.appendChild(select);
    mappingGrid.appendChild(label);
  });
  wrapper.appendChild(mappingGrid);

  const signalTitle = document.createElement("div");
  signalTitle.className = "panel-title";
  signalTitle.textContent = t("externalSignal.signal.title");
  wrapper.appendChild(signalTitle);

  const signalSelect = document.createElement("select");
  signalSelect.className = "full-select";
  const signalOptions = buildExternalSignalColumnOptions(draft.columns, draft.mapping || {});
  populateSelect(signalSelect, signalOptions, draft.signalColumn || "");
  signalSelect.disabled = !draft.columns.length;
  signalSelect.addEventListener("change", () => {
    draft.signalColumn = signalSelect.value;
    draft.error = "";
    draft.status = "";
  });
  wrapper.appendChild(signalSelect);

  const trueWrap = document.createElement("label");
  trueWrap.className = "external-signal-true";
  const trueLabel = document.createElement("span");
  trueLabel.textContent = t("externalSignal.signal.trueValue");
  const trueInput = document.createElement("input");
  trueInput.type = "text";
  trueInput.className = "external-signal-true-input";
  trueInput.value = draft.trueValue ?? "1";
  trueInput.addEventListener("input", () => {
    draft.trueValue = trueInput.value;
    draft.error = "";
    draft.status = "";
  });
  trueWrap.appendChild(trueLabel);
  trueWrap.appendChild(trueInput);
  wrapper.appendChild(trueWrap);

  const trueHelper = document.createElement("div");
  trueHelper.className = "helper-text";
  trueHelper.textContent = t("externalSignal.signal.trueValue.helper");
  wrapper.appendChild(trueHelper);

  if (draft.status) {
    const status = document.createElement("div");
    status.className = "helper-text";
    status.textContent = draft.status;
    wrapper.appendChild(status);
  }

  if (draft.error) {
    const errorBox = document.createElement("div");
    errorBox.className = "error-box";
    errorBox.textContent = draft.error;
    wrapper.appendChild(errorBox);
  }

  const actions = document.createElement("div");
  actions.className = "external-signal-actions";
  const bindBtn = document.createElement("button");
  bindBtn.type = "button";
  bindBtn.className = "btn primary";
  bindBtn.textContent = t("externalSignal.action.bind");
  bindBtn.addEventListener("click", () => handleExternalSignalBind(series));
  actions.appendChild(bindBtn);
  wrapper.appendChild(actions);

  elements.signalPickerOptions.appendChild(wrapper);
}

function handleExternalSignalFileChange(series, event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file || !series) {
    return;
  }
  const draft = state.signalPicker.external || createExternalSignalDraft();
  draft.file = file;
  draft.fileName = file.name || "";
  draft.fileType = getFileType(file.name);
  draft.error = "";
  draft.status = "";
  readFile(file)
    .then((rows) => {
      if (!rows.length) {
        draft.error = t("externalSignal.error.emptyOrInvalid");
        renderSignalPicker(series);
        return;
      }
      const columns = collectColumns(rows);
      const reuse = Boolean(draft.columns && columnsMatch(draft.columns, columns));
      const rawMapping = reuse ? { ...(draft.mapping || {}) } : guessTimeMapping(columns);
      const mapping = normalizeTimeMapping(rawMapping);
      const signalOptions = buildExternalSignalColumnOptions(columns, mapping);
      const signalColumn =
        reuse && signalOptions.includes(draft.signalColumn) ? draft.signalColumn : signalOptions[0] || "";
      draft.rows = rows;
      draft.columns = columns;
      draft.mapping = mapping;
      draft.signalColumn = signalColumn;
      draft.error = "";
      draft.status = series.scaleValue && series.scaleUnit ? t("externalSignal.status.ready") : "";
      renderSignalPicker(series);
    })
    .catch(() => {
      draft.error = t("externalSignal.error.readFailed");
      renderSignalPicker(series);
    });
}

function handleExternalSignalBind(series) {
  if (!series) {
    return;
  }
  const draft = state.signalPicker.external || createExternalSignalDraft();
  const result = buildExternalSignalBinding(series, draft);
  if (result.error) {
    draft.error = result.error;
    draft.status = "";
    renderSignalPicker(series);
    return;
  }
  const external = result.binding;
  if (!series.externalSignals) {
    series.externalSignals = [];
  }
  series.externalSignals.push(external);
  if (state.signalPicker.mode === "dependency") {
    addExternalSignalDependency(series, state.signalPicker.parentId, state.signalPicker.paramName, external);
  } else {
    addExternalSignalRoot(series, external);
  }
  syncExternalSignals(series);
  renderSignalPanel(series);
  renderVizPanel(series);
  closeSignalPicker();
}

function buildExternalSignalBinding(series, draft) {
  if (!series || !series.scaleValue || !series.scaleUnit || !Array.isArray(series.data) || !series.data.length) {
    return { error: t("externalSignal.error.seriesIncomplete") };
  }
  if (!draft || !draft.fileName) {
    return { error: t("externalSignal.error.noFile") };
  }
  if (!Array.isArray(draft.rows) || !draft.rows.length) {
    return { error: t("externalSignal.error.emptyOrInvalid") };
  }
  const mapping = normalizeTimeMapping(draft.mapping || {});
  if (!hasMinimumTimeMapping(mapping)) {
    const requiredUnits = [
      t("time.year"),
      t("time.month"),
      t("time.day"),
      t("time.hour"),
      t("time.minute"),
    ].join("/");
    return { error: t("externalSignal.error.insufficientTimeColumns", { units: requiredUnits }) };
  }
  if (!draft.signalColumn) {
    return { error: t("externalSignal.error.noSignalColumn") };
  }
  const rawTrueValue = String(draft.trueValue ?? "").trim();
  if (!rawTrueValue) {
    return { error: t("externalSignal.error.trueValueRequired") };
  }
  const trueValue = normalizeExternalValue(rawTrueValue);
  const scaleValue = Number(series.scaleValue);
  const scaleUnit = series.scaleUnit;
  const bucketMap = new Map();
  for (const row of draft.rows) {
    const ts = buildTimestamp(row, mapping);
    if (!ts) {
      return { error: t("externalSignal.error.missingTimeValues") };
    }
    const bucket = getBucketTimestamp(ts, scaleValue, scaleUnit);
    if (!bucket) {
      return { error: t("externalSignal.error.scaleMismatch") };
    }
    if (bucket.getTime() !== ts.getTime()) {
      return { error: t("externalSignal.error.scaleMismatch") };
    }
    const key = bucket.getTime();
    if (bucketMap.has(key)) {
      return { error: t("externalSignal.error.duplicateTimestamps") };
    }
    bucketMap.set(key, normalizeExternalValue(row[draft.signalColumn]));
  }
  const seriesKeys = series.data
    .map((point) => (point && point.ts instanceof Date ? point.ts.getTime() : null))
    .filter((val) => Number.isFinite(val));
  const seriesSet = new Set(seriesKeys);
  if (seriesSet.size !== bucketMap.size) {
    return { error: t("externalSignal.error.timeMismatch") };
  }
  for (const key of bucketMap.keys()) {
    if (!seriesSet.has(key)) {
      return { error: t("externalSignal.error.timeMismatch") };
    }
  }
  for (const key of seriesSet.keys()) {
    if (!bucketMap.has(key)) {
      return { error: t("externalSignal.error.timeMismatch") };
    }
  }
  const id = `ext-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const featureKey = `${EXTERNAL_SIGNAL_PREFIX}${id}`;
  return {
    binding: {
      id,
      featureKey,
      fileName: draft.fileName,
      fileType: draft.fileType,
      columns: Array.isArray(draft.columns) ? draft.columns.slice() : [],
      mapping,
      signalColumn: draft.signalColumn,
      trueValue,
      bucketMap,
      valid: true,
      error: "",
    },
  };
}

function buildExternalSignalAlias(series, external) {
  const base = external && external.signalColumn ? external.signalColumn : t("signal.type.fallback");
  const existing = series ? collectSignalNodes(series).filter((node) => node.alias === base).length : 0;
  if (existing > 0) {
    return `${base} ${existing + 1}`;
  }
  return base;
}

function createExternalSignalNode(series, external) {
  const node = createSignalNode(EXTERNAL_SIGNAL_TYPE, series);
  node.externalId = external.id;
  node.params.signal_key = external.featureKey;
  node.params.true_value = external.trueValue;
  node.alias = buildExternalSignalAlias(series, external);
  node.aliasEdited = false;
  return node;
}

function addExternalSignalRoot(series, external) {
  const root = createExternalSignalNode(series, external);
  series.signals.items.push(root);
  series.signals.activeId = root.id;
}

function addExternalSignalDependency(series, parentId, paramName, external) {
  const parent = findSignalNode(series, parentId);
  if (!parent || !paramName) {
    return;
  }
  if (!parent.children[paramName]) {
    parent.children[paramName] = [];
  }
  const child = createExternalSignalNode(series, external);
  parent.children[paramName].push(child);
}

function isExternalSignalNode(node) {
  return Boolean(node && node.type === EXTERNAL_SIGNAL_TYPE);
}

function getExternalSignalConfig(series, node) {
  if (!series || !node || !node.externalId) {
    return null;
  }
  return (series.externalSignals || []).find((item) => item.id === node.externalId) || null;
}

function signalTreeHasExternal(node) {
  if (!node) {
    return false;
  }
  if (isExternalSignalNode(node)) {
    return true;
  }
  const children = node.children || {};
  return Object.values(children).some((list) => list.some((child) => signalTreeHasExternal(child)));
}

function renderTemplatePicker(series) {
  const templates = loadSignalTemplates();
  if (!templates.length) {
    const empty = document.createElement("div");
    empty.className = "helper-text";
    empty.textContent = t("template.empty");
    elements.signalPickerOptions.appendChild(empty);
    return;
  }
  if (state.openTemplateMenuName && !templates.some((tpl) => tpl.name === state.openTemplateMenuName)) {
    closeTemplateMenu();
  }
  templates.forEach((template) => {
    const row = document.createElement("div");
    row.className = "picker-option template-row";
    row.setAttribute("role", "button");
    row.tabIndex = 0;

    const textWrap = document.createElement("div");
    textWrap.className = "template-option";

    const title = document.createElement("div");
    title.className = "template-option-title";
    title.textContent = template.name;
    const sub = document.createElement("div");
    sub.className = "template-option-sub";
    sub.textContent = buildTemplateSummary(template);
    textWrap.appendChild(title);
    textWrap.appendChild(sub);

    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.className = "template-menu-btn";
    menuBtn.textContent = "⋮";
    menuBtn.setAttribute("aria-label", t("template.menu.label"));
    menuBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleTemplateMenu(template, menuBtn);
    });

    row.appendChild(textWrap);
    row.appendChild(menuBtn);
    row.addEventListener("click", (event) => {
      if (event.target.closest(".template-menu-btn")) {
        return;
      }
      handleTemplateSelection(series, template);
      closeSignalPicker();
    });
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleTemplateSelection(series, template);
        closeSignalPicker();
      }
    });

    elements.signalPickerOptions.appendChild(row);
  });
}

function toggleTemplateMenu(template, anchor) {
  if (!template || !anchor) {
    return;
  }
  if (state.openTemplateMenuName === template.name) {
    closeTemplateMenu();
    return;
  }
  openTemplateMenu(template, anchor);
}

function openTemplateMenu(template, anchor) {
  state.openTemplateMenuName = template.name;
  if (!elements.templateMenuPortal || !elements.templateMenuPopover) {
    return;
  }
  buildTemplateMenuPopover(template);
  elements.templateMenuPortal.classList.remove("hidden");
  positionTemplateMenuPopover(anchor);
}

function closeTemplateMenu() {
  if (!state.openTemplateMenuName) {
    return;
  }
  state.openTemplateMenuName = "";
  if (elements.templateMenuPortal) {
    elements.templateMenuPortal.classList.add("hidden");
  }
  if (elements.templateMenuPopover) {
    elements.templateMenuPopover.innerHTML = "";
  }
}

function handleTemplateMenuDocumentClick(event) {
  if (!state.openTemplateMenuName) {
    return;
  }
  if (event.target.closest(".template-menu-btn")) {
    return;
  }
  if (elements.templateMenuPopover && elements.templateMenuPopover.contains(event.target)) {
    return;
  }
  closeTemplateMenu();
}

function buildTemplateMenuPopover(template) {
  if (!elements.templateMenuPopover) {
    return;
  }
  elements.templateMenuPopover.innerHTML = "";
  const renameBtn = document.createElement("button");
  renameBtn.type = "button";
  renameBtn.className = "template-menu-item";
  renameBtn.textContent = t("action.rename");
  renameBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openTemplateRenameModal(template);
  });
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "template-menu-item danger";
  deleteBtn.textContent = t("action.delete");
  deleteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    handleTemplateDelete(template.name);
  });
  elements.templateMenuPopover.appendChild(renameBtn);
  elements.templateMenuPopover.appendChild(deleteBtn);
}

function positionTemplateMenuPopover(anchor) {
  if (!elements.templateMenuPopover || !anchor) {
    return;
  }
  const rect = anchor.getBoundingClientRect();
  const popover = elements.templateMenuPopover;
  const padding = 12;
  requestAnimationFrame(() => {
    const popRect = popover.getBoundingClientRect();
    let left = rect.right - popRect.width;
    if (left < padding) {
      left = padding;
    }
    if (left + popRect.width > window.innerWidth - padding) {
      left = window.innerWidth - popRect.width - padding;
    }
    let top = rect.bottom + 6;
    if (top + popRect.height > window.innerHeight - padding) {
      top = rect.top - popRect.height - 6;
    }
    if (top < padding) {
      top = padding;
    }
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  });
}

function setTemplateStatus(message, kind = "") {
  if (!elements.signalTemplateStatus) {
    return;
  }
  elements.signalTemplateStatus.textContent = message || "";
  elements.signalTemplateStatus.classList.toggle("is-error", kind === "error");
  elements.signalTemplateStatus.classList.toggle("is-success", kind === "success");
}

function loadSignalTemplates() {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return normalizeTemplateList(parsed);
    }
    if (parsed && Array.isArray(parsed.templates)) {
      return normalizeTemplateList(parsed.templates);
    }
  } catch (err) {
    console.warn("Failed to load templates", err);
  }
  return [];
}

function saveSignalTemplates(templates) {
  if (typeof localStorage === "undefined") {
    return;
  }
  const payload = {
    version: TEMPLATE_STORAGE_VERSION,
    templates: templates || [],
  };
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to save templates", err);
  }
}

function normalizeTemplateList(list, stats) {
  const normalized = [];
  (list || []).forEach((tpl) => {
    const template = normalizeTemplate(tpl, stats);
    if (template) {
      normalized.push(template);
    }
  });
  return normalized;
}

function normalizeTemplate(template, stats) {
  if (!template || typeof template !== "object") {
    return null;
  }
  const name = normalizeTemplateName(template.name);
  if (!name || !template.root || !template.root.type) {
    return null;
  }
  if (signalTreeHasExternal(template.root)) {
    if (stats) {
      stats.externalSkipped = (stats.externalSkipped || 0) + 1;
    }
    return null;
  }
  return {
    name,
    root: template.root,
    createdAt: template.createdAt || new Date().toISOString(),
    version: template.version || TEMPLATE_STORAGE_VERSION,
  };
}

function normalizeTemplateName(name) {
  const trimmed = String(name || "").trim();
  return trimmed || "";
}

function buildTemplateSummary(template) {
  const root = template && template.root ? template.root : null;
  if (!root) {
    return t("template.summary.rootNone");
  }
  const count = countTemplateNodes(root);
  return t("template.summary.root", { type: root.type || "-", count });
}

function countTemplateNodes(node) {
  if (!node) {
    return 0;
  }
  let count = 1;
  Object.values(node.children || {}).forEach((list) => {
    (list || []).forEach((child) => {
      count += countTemplateNodes(child);
    });
  });
  return count;
}

function buildTemplateFromRoot(root, name) {
  return {
    name,
    createdAt: new Date().toISOString(),
    version: TEMPLATE_STORAGE_VERSION,
    root: serializeSignalNodeForTemplate(root),
  };
}

function serializeSignalNodeForTemplate(node) {
  if (!node) {
    return null;
  }
  const def = SIGNAL_DEF_MAP.get(node.type);
  const params = {};
  if (node.params) {
    if (def) {
      def.params.forEach((param) => {
        if (param.kind === "column") {
          return;
        }
        if (Object.prototype.hasOwnProperty.call(node.params, param.name)) {
          params[param.name] = node.params[param.name];
        }
      });
    } else {
      Object.entries(node.params).forEach(([key, value]) => {
        params[key] = value;
      });
    }
  }
  const children = {};
  Object.entries(node.children || {}).forEach(([key, list]) => {
    if (!Array.isArray(list) || !list.length) {
      return;
    }
    children[key] = list.map((child) => serializeSignalNodeForTemplate(child)).filter(Boolean);
  });
  return {
    type: node.type,
    alias: node.alias || "",
    aliasEdited: Boolean(node.aliasEdited),
    params,
    children,
  };
}

function applyTemplateToSeries(series, template) {
  if (!series || !template || !template.root) {
    return;
  }
  const root = createSignalNodeFromTemplate(template.root, series);
  if (!root) {
    return;
  }
  series.signals.items.push(root);
  series.signals.activeId = root.id;
  fillEmptyColumnParams(series);
  renderSignalPanel(series);
  renderVizPanel(series);
}

function handleTemplateSelection(series, template) {
  const picker = state.signalPicker;
  if (picker.mode === "dependency") {
    addTemplateDependency(series, picker.parentId, picker.paramName, template);
    return;
  }
  applyTemplateToSeries(series, template);
}

function addTemplateDependency(series, parentId, paramName, template) {
  if (!series || !template || !template.root) {
    return;
  }
  const parent = findSignalNode(series, parentId);
  if (!parent || !paramName) {
    return;
  }
  if (!parent.children[paramName]) {
    parent.children[paramName] = [];
  }
  const child = createSignalNodeFromTemplate(template.root, series);
  if (!child) {
    return;
  }
  parent.children[paramName].push(child);
  fillEmptyColumnParams(series);
  renderSignalPanel(series);
  renderVizPanel(series);
}

function createSignalNodeFromTemplate(templateNode, series) {
  if (!templateNode || !templateNode.type) {
    return null;
  }
  if (templateNode.type === EXTERNAL_SIGNAL_TYPE) {
    return null;
  }
  const node = createSignalNode(templateNode.type, series);
  if (templateNode.alias) {
    node.alias = templateNode.alias;
  }
  if (templateNode.aliasEdited !== undefined) {
    node.aliasEdited = Boolean(templateNode.aliasEdited);
  } else if (templateNode.alias) {
    node.aliasEdited = true;
  }
  const def = SIGNAL_DEF_MAP.get(node.type);
  const params = buildSignalParams(node.type, series);
  Object.entries(templateNode.params || {}).forEach(([key, value]) => {
    if (def) {
      const paramDef = def.params.find((param) => param.name === key);
      if (paramDef && paramDef.kind === "column") {
        return;
      }
    }
    params[key] = value;
  });
  node.params = params;
  node.children = {};
  Object.entries(templateNode.children || {}).forEach(([key, list]) => {
    if (!Array.isArray(list)) {
      return;
    }
    node.children[key] = list.map((child) => createSignalNodeFromTemplate(child, series)).filter(Boolean);
  });
  return node;
}

function mergeTemplatesByName(existing, incoming, options = {}) {
  const map = new Map();
  (existing || []).forEach((tpl) => {
    const name = normalizeTemplateName(tpl.name);
    if (name) {
      map.set(name, tpl);
    }
  });
  const added = [];
  const skipped = [];
  const replaced = [];
  const replace = Boolean(options.replace);
  (incoming || []).forEach((tpl) => {
    const name = normalizeTemplateName(tpl.name);
    if (!name) {
      return;
    }
    if (map.has(name)) {
      if (replace) {
        map.set(name, tpl);
        replaced.push(name);
      } else {
        skipped.push(name);
      }
      return;
    }
    map.set(name, tpl);
    added.push(name);
  });
  return {
    templates: Array.from(map.values()),
    added,
    skipped,
    replaced,
  };
}

function updateTemplateSaveControls(series, active, parentInfo) {
  if (!elements.signalTemplateSave || !elements.signalTemplateHint) {
    return;
  }
  if (!series || !active) {
    elements.signalTemplateSave.disabled = true;
    elements.signalTemplateHint.textContent = t("template.hint.selectRoot");
    return;
  }
  const isRoot = !parentInfo;
  if (!isRoot) {
    elements.signalTemplateSave.disabled = true;
    elements.signalTemplateHint.textContent = t("template.hint.rootOnly");
    return;
  }
  if (signalTreeHasExternal(active)) {
    elements.signalTemplateSave.disabled = true;
    elements.signalTemplateHint.textContent = t("template.hint.external");
    return;
  }
  elements.signalTemplateSave.disabled = false;
  elements.signalTemplateHint.textContent = t("template.hint.reuse");
}

function setTemplateSaveTitle(text) {
  if (!elements.templateSaveTitle) {
    return;
  }
  elements.templateSaveTitle.textContent = text || t("template.save.title");
}

function openTemplateSaveModal() {
  const series = getActiveSeries();
  if (!series) {
    return;
  }
  closeTemplateMenu();
  const active = ensureActiveSignal(series);
  if (!active) {
    updateTemplateSaveControls(series, null, null);
    return;
  }
  const parentInfo = findSignalParent(series, active.id);
  if (parentInfo) {
    updateTemplateSaveControls(series, active, parentInfo);
    return;
  }
  if (signalTreeHasExternal(active)) {
    updateTemplateSaveControls(series, active, null);
    return;
  }
  state.templateSave.mode = "create";
  state.templateSave.originalName = "";
  state.templateSave.seriesId = series.id;
  state.templateSave.rootId = active.id;
  setTemplateSaveTitle(t("template.save.title"));
  if (elements.templateSaveName) {
    elements.templateSaveName.value = active.alias || active.type || "";
    elements.templateSaveName.focus();
    elements.templateSaveName.select();
  }
  setTemplateSaveNote(t("template.save.note.create"));
  if (elements.templateSaveModal) {
    elements.templateSaveModal.classList.remove("hidden");
  }
}

function openTemplateRenameModal(template) {
  if (!template || !template.name) {
    return;
  }
  closeTemplateMenu();
  state.templateSave.mode = "rename";
  state.templateSave.originalName = template.name;
  state.templateSave.seriesId = "";
  state.templateSave.rootId = "";
  setTemplateSaveTitle(t("template.save.title.rename"));
  if (elements.templateSaveName) {
    elements.templateSaveName.value = template.name;
    elements.templateSaveName.focus();
    elements.templateSaveName.select();
  }
  setTemplateSaveNote(t("template.save.note.rename"));
  if (elements.templateSaveModal) {
    elements.templateSaveModal.classList.remove("hidden");
  }
}

function closeTemplateSaveModal() {
  if (elements.templateSaveModal) {
    elements.templateSaveModal.classList.add("hidden");
  }
  state.templateSave.mode = "create";
  state.templateSave.originalName = "";
  state.templateSave.seriesId = "";
  state.templateSave.rootId = "";
  setTemplateSaveNote("");
}

function setTemplateSaveNote(message, kind = "") {
  if (!elements.templateSaveNote) {
    return;
  }
  elements.templateSaveNote.textContent = message || "";
  elements.templateSaveNote.classList.toggle("is-error", kind === "error");
  elements.templateSaveNote.classList.toggle("is-success", kind === "success");
}

function showToast(message, kind = "") {
  if (!elements.toast || !elements.toastMessage) {
    return;
  }
  elements.toastMessage.textContent = message || "";
  elements.toast.classList.remove("hidden");
  elements.toast.classList.toggle("is-success", kind === "success");
  elements.toast.classList.toggle("is-error", kind === "error");
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    hideToast();
  }, 4000);
}

function hideToast() {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  if (!elements.toast) {
    return;
  }
  elements.toast.classList.add("hidden");
  elements.toast.classList.remove("is-success", "is-error");
  if (elements.toastMessage) {
    elements.toastMessage.textContent = "";
  }
}

async function handleTemplateSaveConfirm() {
  const name = normalizeTemplateName(elements.templateSaveName ? elements.templateSaveName.value : "");
  if (!name) {
    setTemplateSaveNote(t("template.error.nameRequired"), "error");
    return;
  }
  if (state.templateSave.mode === "rename") {
    handleTemplateRenameConfirm(name);
    return;
  }
  const series = state.series.find((item) => item.id === state.templateSave.seriesId) || getActiveSeries();
  if (!series) {
    setTemplateSaveNote(t("template.error.noSeries"), "error");
    return;
  }
  const root = findSignalNode(series, state.templateSave.rootId);
  if (!root) {
    setTemplateSaveNote(t("template.error.noRoot"), "error");
    return;
  }
  if (findSignalParent(series, root.id)) {
    setTemplateSaveNote(t("template.error.rootOnly"), "error");
    return;
  }
  if (signalTreeHasExternal(root)) {
    setTemplateSaveNote(t("template.error.external"), "error");
    return;
  }

  const template = buildTemplateFromRoot(root, name);
  const existing = loadSignalTemplates();
  const merged = mergeTemplatesByName(existing, [template], { replace: true });
  saveSignalTemplates(merged.templates);

  const baseMessage = merged.replaced.length
    ? t("template.save.overwrite")
    : t("template.save.saved");
  const fileResult = await saveTemplateToFile(template);
  let message = baseMessage;
  let kind = "success";
  if (fileResult && fileResult.message) {
    message = `${baseMessage}${fileResult.message}`;
    if (fileResult.kind === "error") {
      kind = "error";
    } else if (fileResult.kind === "") {
      kind = "";
    }
  }
  closeTemplateSaveModal();
  showToast(message, kind);
  refreshSignalPicker();
}

function handleTemplateRenameConfirm(name) {
  const originalName = normalizeTemplateName(state.templateSave.originalName);
  if (!originalName) {
    setTemplateSaveNote(t("template.error.notFound"), "error");
    return;
  }
  const templates = loadSignalTemplates();
  const idx = templates.findIndex((tpl) => tpl.name === originalName);
  if (idx < 0) {
    setTemplateSaveNote(t("template.error.notFound"), "error");
    return;
  }
  if (name !== originalName && templates.some((tpl) => tpl.name === name)) {
    setTemplateSaveNote(t("template.error.nameExists"), "error");
    return;
  }
  templates[idx] = { ...templates[idx], name };
  saveSignalTemplates(templates);
  setTemplateStatus(t("template.status.renamed"), "success");
  closeTemplateSaveModal();
  closeTemplateMenu();
  refreshSignalPicker();
}

function handleTemplateDelete(name) {
  const target = normalizeTemplateName(name);
  if (!target) {
    return;
  }
  const confirmed = window.confirm(t("template.confirm.delete", { name: target }));
  if (!confirmed) {
    return;
  }
  const templates = loadSignalTemplates();
  const filtered = templates.filter((tpl) => tpl.name !== target);
  if (filtered.length === templates.length) {
    setTemplateStatus(t("template.error.notFound"), "error");
    return;
  }
  saveSignalTemplates(filtered);
  setTemplateStatus(t("template.status.deleted"), "success");
  closeTemplateMenu();
  refreshSignalPicker();
}

function handleTemplateImportClick() {
  if (!elements.signalTemplateImportInput) {
    return;
  }
  elements.signalTemplateImportInput.value = "";
  elements.signalTemplateImportInput.click();
}

function handleTemplateImportFiles(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) {
    return;
  }
  setTemplateStatus(t("template.import.loading"));
  Promise.all(files.map((file) => readTemplateFile(file))).then((results) => {
    const incoming = [];
    const failures = [];
    results.forEach((result) => {
      incoming.push(...result.templates);
      if (result.error) {
        failures.push(result.error);
      }
    });
    const stats = { externalSkipped: 0 };
    const normalized = normalizeTemplateList(incoming, stats);
    if (!normalized.length) {
      setTemplateStatus(t("template.import.none"), "error");
      return;
    }
    const existing = loadSignalTemplates();
    const merged = mergeTemplatesByName(existing, normalized, { replace: false });
    saveSignalTemplates(merged.templates);
    let message = t("template.import.added", { count: merged.added.length });
    if (merged.skipped.length) {
      message += t("template.import.skipped", { count: merged.skipped.length });
    }
    if (failures.length) {
      message += t("template.import.failed", { count: failures.length });
    }
    if (stats.externalSkipped) {
      message += t("template.import.externalSkipped", { count: stats.externalSkipped });
    }
    let kind = "success";
    if (!merged.added.length && failures.length) {
      kind = "error";
    } else if (!merged.added.length) {
      kind = "";
    }
    setTemplateStatus(`${message}${t("template.import.ending")}`, kind);
    refreshSignalPicker();
  });
}

function refreshSignalPicker() {
  if (!elements.signalPicker || elements.signalPicker.classList.contains("hidden")) {
    return;
  }
  if (state.openTemplateMenuName) {
    closeTemplateMenu();
  }
  const series = getActiveSeries();
  if (series) {
    renderSignalPicker(series);
  }
}

function readTemplateFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result || "{}");
        const templates = collectTemplatesFromPayload(parsed);
        resolve({ templates, error: "" });
      } catch (err) {
        resolve({ templates: [], error: file.name || "unknown" });
      }
    };
    reader.onerror = () => resolve({ templates: [], error: file.name || "unknown" });
    reader.readAsText(file);
  });
}

function collectTemplatesFromPayload(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload.templates && Array.isArray(payload.templates)) {
    return payload.templates;
  }
  if (payload.root && payload.name) {
    return [payload];
  }
  return [];
}

function buildTemplateFileName(name) {
  const base = sanitizeFileName(name) || t("template.file.defaultName");
  const stripped = base.replace(/\.json$/i, "");
  return `${stripped}.json`;
}

async function saveTemplateToFile(template) {
  if (!template) {
    return null;
  }
  const payload = {
    version: TEMPLATE_STORAGE_VERSION,
    templates: [template],
  };
  const json = JSON.stringify(payload, null, 2);
  const fileName = buildTemplateFileName(template.name);

  if (typeof window.showSaveFilePicker === "function") {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "JSON",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return { kind: "success", message: t("template.file.saved") };
    } catch (err) {
      if (err && err.name === "AbortError") {
        return { kind: "", message: t("template.file.cancelled") };
      }
    }
  }

  try {
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    await saveBlobToDestination(blob, fileName, null);
    return { kind: "success", message: t("template.file.downloaded") };
  } catch (err) {
    return { kind: "error", message: t("template.file.failed") };
  }
}

function getDependencyParamOptions(node) {
  const def = SIGNAL_DEF_MAP.get(node.type);
  if (!def) {
    return [];
  }
  return def.params
    .filter((param) => param.kind === "signal" || param.kind === "signal-list")
    .map((param) => {
      const list = node.children[param.name] || [];
      const requiredCount = getDependencyRequiredCount(param);
      const remaining = requiredCount ? Math.max(0, requiredCount - list.length) : 0;
      const baseLabel = formatParamLabel(param);
      let label = baseLabel;
      if (requiredCount && requiredCount > 1 && remaining > 0) {
        label = t("signal.dependency.remaining", {
          label: baseLabel,
          remaining,
          requiredCount,
        });
      } else if (param.kind === "signal" && list.length) {
        label = t("signal.dependency.added", { label: baseLabel });
      }
      return {
        name: param.name,
        label,
        kind: param.kind,
        count: list.length,
        requiredCount,
      };
    })
    .filter((param) => (param.kind === "signal" ? param.count < 1 : true));
}

function addSignalDependency(series, parentId, paramName, type) {
  if (!series) {
    return;
  }
  const parent = findSignalNode(series, parentId);
  if (!parent || !paramName) {
    return;
  }
  if (!parent.children[paramName]) {
    parent.children[paramName] = [];
  }
  const child = createSignalNode(type || SIGNAL_DEFS[0].type, series);
  parent.children[paramName].push(child);
  renderSignalPanel(series);
  renderVizPanel(series);
}

function handleSignalBack() {
  const series = getActiveSeries();
  if (!series) {
    return;
  }
  const parentInfo = findSignalParent(series, series.signals.activeId);
  if (parentInfo && parentInfo.parent) {
    series.signals.activeId = parentInfo.parent.id;
    renderSignalPanel(series);
  }
}

function addSignalRoot(type, series) {
  const targetSeries = series || getActiveSeries();
  if (!targetSeries) {
    return;
  }
  const root = createSignalNode(type || SIGNAL_DEFS[0].type, targetSeries);
  targetSeries.signals.items.push(root);
  targetSeries.signals.activeId = root.id;
  renderSignalPanel(targetSeries);
  renderVizPanel(targetSeries);
}

function buildSignalParams(type, series) {
  const def = SIGNAL_DEF_MAP.get(type);
  const params = {};
  if (def) {
    def.params.forEach((param) => {
      if (param.kind === "column") {
        params[param.name] = series && series.source ? series.source.valueColumn : "";
      } else if (param.kind === "boolean") {
        params[param.name] = param.default ?? false;
      } else if (param.kind === "number") {
        params[param.name] = param.default ?? "";
      } else if (param.kind === "select") {
        params[param.name] = param.default ?? param.options[0];
      } else if (param.kind === "text") {
        params[param.name] = param.default ?? "";
      }
    });
  }
  return params;
}

function fillEmptyColumnParams(series) {
  if (!series || !series.source || !series.source.valueColumn) {
    return;
  }
  const defaultColumn = series.source.valueColumn;
  const nodes = collectSignalNodes(series);
  nodes.forEach((node) => {
    const def = SIGNAL_DEF_MAP.get(node.type);
    if (!def) {
      return;
    }
    def.params.forEach((param) => {
      if (param.kind !== "column") {
        return;
      }
      const current = node.params ? node.params[param.name] : "";
      if (current === null || current === undefined || String(current).trim() === "") {
        if (!node.params) {
          node.params = {};
        }
        node.params[param.name] = defaultColumn;
      }
    });
  });
}

function nextSignalOrder() {
  signalSequence += 1;
  return signalSequence;
}

function createSignalNode(type, series) {
  return {
    id: `sig-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    type,
    alias: buildDefaultAlias(type, series),
    aliasEdited: false,
    order: nextSignalOrder(),
    params: buildSignalParams(type, series),
    children: {},
    collapsed: false,
  };
}

function collectSignalNodes(series) {
  const nodes = [];
  const visit = (node) => {
    if (!node) {
      return;
    }
    if (!node.children) {
      node.children = {};
    }
    if (!Number.isFinite(node.order)) {
      node.order = nextSignalOrder();
    }
    nodes.push(node);
    Object.values(node.children || {}).forEach((list) => {
      list.forEach((child) => {
        visit(child);
      });
    });
  };
  series.signals.items.forEach((root) => {
    visit(root);
  });
  return nodes;
}

function findSignalNode(series, nodeId) {
  if (!series || !nodeId) {
    return null;
  }
  let found = null;
  const visit = (node) => {
    if (!node || found) {
      return;
    }
    if (node.id === nodeId) {
      found = node;
      return;
    }
    Object.values(node.children || {}).forEach((list) => {
      list.forEach((child) => {
        visit(child);
      });
    });
  };
  series.signals.items.forEach((root) => {
    visit(root);
  });
  return found;
}

function findSignalParent(series, nodeId) {
  if (!series || !nodeId) {
    return null;
  }
  let result = null;
  const visit = (node) => {
    if (!node || result) {
      return;
    }
    Object.entries(node.children || {}).forEach(([key, list]) => {
      list.forEach((child) => {
        if (result) {
          return;
        }
        if (child.id === nodeId) {
          result = { parent: node, paramName: key };
        } else {
          visit(child);
        }
      });
    });
  };
  series.signals.items.forEach((root) => {
    visit(root);
  });
  return result;
}

function setAllSignalsCollapsed(series, collapsed) {
  collectSignalNodes(series).forEach((node) => {
    node.collapsed = collapsed;
  });
}

function buildSignalAlias(node) {
  return node.alias || node.type;
}

function buildSignalVizLabel(node) {
  return t("signal.viz.label", { name: buildSignalAlias(node) });
}

function buildDefaultAlias(type, series, skipId = "") {
  if (!series) {
    return type;
  }
  const count = collectSignalNodes(series).filter((node) => node.type === type && node.id !== skipId).length;
  return `${type} ${count + 1}`;
}

function buildSignalSignature(node) {
  const aliasKey = typeof node.alias === "string" ? node.alias.trim() : "";
  const params = {};
  Object.keys(node.params || {})
    .sort()
    .forEach((key) => {
      params[key] = node.params[key];
    });
  const children = {};
  Object.keys(node.children || {})
    .sort()
    .forEach((key) => {
      const list = node.children[key] || [];
      const childSigs = list.map((child) => buildSignalSignature(child)).sort();
      children[key] = childSigs;
    });
  return JSON.stringify({ type: node.type, alias: aliasKey, params, children });
}

function getDuplicateSignalIds(series) {
  const signatures = new Map();
  collectSignalNodes(series).forEach((node) => {
    const sig = buildSignalSignature(node);
    if (!signatures.has(sig)) {
      signatures.set(sig, []);
    }
    signatures.get(sig).push(node.id);
  });
  const duplicates = new Set();
  signatures.forEach((ids) => {
    if (ids.length > 1) {
      ids.forEach((id) => {
        duplicates.add(id);
      });
    }
  });
  return duplicates;
}

function getDependencyRequiredCount(param) {
  if (param && typeof param.requiredCount === "number") {
    return param.requiredCount;
  }
  if (param && param.kind === "signal") {
    return 1;
  }
  if (param && param.kind === "signal-list") {
    return 2;
  }
  return null;
}

function buildDependencyAddLabel(count, requiredCount) {
  if (requiredCount && requiredCount > 1 && count < requiredCount) {
    return t("signal.dependency.need", {
      remaining: requiredCount - count,
      requiredCount,
    });
  }
  if (requiredCount && count < requiredCount) {
    return t("signal.dependency.add");
  }
  return t("signal.dependency.add");
}

function populateSignalSelect(select, options, selectedId) {
  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "—";
  select.appendChild(empty);
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.id;
    option.textContent = opt.label;
    if (opt.id === selectedId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function updateDownSignalNote(series, nodes) {
  if (!nodes.length) {
    elements.downSignalNote.textContent = t("signal.down.note.noSignals");
    return;
  }
  if (series.role === "LTF") {
    elements.downSignalNote.textContent = series.signals.downwardSignalId
      ? t("signal.down.note.ltfSelected")
      : t("signal.down.note.ltfOptional");
    return;
  }
  if (!series.signals.downwardSignalId) {
    elements.downSignalNote.textContent = t("signal.down.note.select");
    return;
  }
  elements.downSignalNote.textContent = t("signal.down.note.selected");
}

function renderDownSignalControls(series, nodes) {
  const options = nodes.map((node) => ({ id: node.id, label: buildSignalAlias(node) }));
  const availableIds = new Set(options.map((opt) => opt.id));
  if (series.signals.downwardSignalId && !availableIds.has(series.signals.downwardSignalId)) {
    series.signals.downwardSignalId = "";
  }
  populateSignalSelect(elements.downSignalSelect, options, series.signals.downwardSignalId);
  elements.downSignalSelect.disabled = options.length === 0;
  updateDownSignalNote(series, nodes);
}

function renderSignalWarning(duplicateIds, series) {
  const messages = [];
  if (duplicateIds && duplicateIds.size) {
    messages.push(t("signal.warning.duplicate"));
  }
  if (series && Array.isArray(series.externalSignalErrors) && series.externalSignalErrors.length) {
    series.externalSignalErrors.forEach((msg) => {
      if (msg && !messages.includes(msg)) {
        messages.push(msg);
      }
    });
  }
  if (!messages.length) {
    elements.signalWarning.textContent = "";
    elements.signalWarning.classList.add("hidden");
    return;
  }
  elements.signalWarning.textContent = messages.join("\n");
  elements.signalWarning.classList.remove("hidden");
}

function wrapParam(labelText, input) {
  const wrapper = document.createElement("div");
  wrapper.className = "signal-param";
  const label = document.createElement("label");
  label.textContent = labelText;
  wrapper.appendChild(label);
  wrapper.appendChild(input);
  return wrapper;
}

function collectExternalIds(node, ids) {
  if (!node) {
    return;
  }
  if (node.externalId) {
    ids.add(node.externalId);
  }
  Object.values(node.children || {}).forEach((list) => {
    list.forEach((child) => {
      collectExternalIds(child, ids);
    });
  });
}

function removeSignalNode(nodeId) {
  const series = getActiveSeries();
  if (!series) {
    return;
  }
  const externalIds = new Set();
  const targetNode = findSignalNode(series, nodeId);
  if (targetNode) {
    collectExternalIds(targetNode, externalIds);
  }
  const parentInfo = findSignalParent(series, nodeId);
  const activeId = series.signals.activeId;
  const idx = series.signals.items.findIndex((item) => item.id === nodeId);
  if (idx !== -1) {
    series.signals.items.splice(idx, 1);
  } else {
    series.signals.items.forEach((root) => {
      removeSignalNodeRecursive(root, nodeId);
    });
  }
  if (series.signals.downwardSignalId === nodeId) {
    series.signals.downwardSignalId = "";
  }
  const activeNode = findSignalNode(series, activeId);
  if (!activeNode) {
    if (parentInfo && parentInfo.parent) {
      series.signals.activeId = parentInfo.parent.id;
    } else {
      const fallback = series.signals.items[0];
      series.signals.activeId = fallback ? fallback.id : "";
    }
  }
  if (externalIds.size) {
    series.externalSignals = (series.externalSignals || []).filter((item) => !externalIds.has(item.id));
    syncExternalSignals(series);
  }
  renderSignalPanel(series);
  renderVizPanel(series);
}

function removeSignalNodeRecursive(node, nodeId) {
  if (!node) {
    return;
  }
  if (!node.children) {
    return;
  }
  Object.keys(node.children).forEach((key) => {
    node.children[key] = (node.children[key] || []).filter((child) => child.id !== nodeId);
    node.children[key].forEach((child) => {
      removeSignalNodeRecursive(child, nodeId);
    });
  });
}

function syncVizElements(series) {
  const signalNodes = collectSignalNodes(series);
  updateSignalVizLabels(series, signalNodes);
  if (!series.viz.initialized) {
    const defaults = [
      createVizElement("line", getDefaultVizLabel("line")),
      createVizElement("raw", getDefaultVizLabel("raw")),
    ];
    signalNodes.forEach((node) => {
      defaults.push(createVizElement("signal", buildSignalVizLabel(node), node.id));
    });
    series.viz.elements = [...series.viz.elements, ...defaults];
    series.viz.initialized = true;
  }
  assignDefaultColors(series);
}

function updateSignalVizLabels(series, signalNodes) {
  const map = new Map(signalNodes.map((node) => [node.id, node]));
  series.viz.elements.forEach((element) => {
    if (element.type === "signal" && element.signalId && map.has(element.signalId)) {
      element.label = buildSignalVizLabel(map.get(element.signalId));
      return;
    }
    if (element.type === "line" || element.type === "raw") {
      element.label = getDefaultVizLabel(element.type);
    }
  });
}

function getDefaultVizLabel(type) {
  if (type === "line") {
    return t("viz.element.line");
  }
  if (type === "raw") {
    return t("viz.element.raw");
  }
  return "";
}

function createVizElement(type, label, signalId = "") {
  return {
    id: `viz-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    type,
    label,
    signalId,
    color: "",
    lineStyle: "solid",
    lineWidth: 2,
    marker: "circle",
    size: 6,
  };
}

function normalizeColorValue(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function collectUsedColorsByType(series, type, excludeId) {
  const used = new Set();
  if (!series || !series.viz || !Array.isArray(series.viz.elements)) {
    return used;
  }
  series.viz.elements.forEach((el) => {
    if (!el || !el.color || el.id === excludeId || el.type !== type) {
      return;
    }
    used.add(normalizeColorValue(el.color));
  });
  return used;
}

function assignDefaultColors(series) {
  series.viz.elements.forEach((element) => {
    if (!element.color) {
      element.color = pickAvailableColor(series, element.type);
    }
  });
}

function pickAvailableColor(series, type) {
  const used = collectUsedColorsByType(series, type);
  for (const color of COLOR_PALETTE) {
    if (!used.has(normalizeColorValue(color))) {
      return color;
    }
  }
  return COLOR_PALETTE[0];
}

function isColorAllowedForElement(series, element, color) {
  if (!series || !element || !element.type) {
    return true;
  }
  const normalized = normalizeColorValue(color);
  if (!normalized) {
    return true;
  }
  const used = collectUsedColorsByType(series, element.type, element.id);
  return !used.has(normalized);
}

function clampOpacity(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return DEFAULT_HIERAR_CONSTRAINT_OPACITY;
  }
  return Math.min(1, Math.max(0, num));
}

function ensureHierarConstraintConfig(series) {
  if (!series.viz.hierarConstraint) {
    series.viz.hierarConstraint = {
      color: "",
      style: DEFAULT_HIERAR_CONSTRAINT_STYLE,
      opacity: DEFAULT_HIERAR_CONSTRAINT_OPACITY,
    };
  }
  if (!series.viz.hierarConstraint.style) {
    series.viz.hierarConstraint.style = DEFAULT_HIERAR_CONSTRAINT_STYLE;
  }
  if (!isFiniteNumber(series.viz.hierarConstraint.opacity)) {
    series.viz.hierarConstraint.opacity = DEFAULT_HIERAR_CONSTRAINT_OPACITY;
  }
}

function getUsedHierarConstraintColors(excludeSeriesId, options = {}) {
  const used = new Set();
  const includeIntersection = Boolean(options.includeIntersection);
  state.series.forEach((series) => {
    if (!series || series.role === "LTF") {
      return;
    }
    if (excludeSeriesId && series.id === excludeSeriesId) {
      return;
    }
    if (!series.signals || !series.signals.downwardSignalId) {
      return;
    }
    if (series.viz && series.viz.hierarConstraint && series.viz.hierarConstraint.color) {
      used.add(normalizeColorValue(series.viz.hierarConstraint.color));
    }
  });
  if (includeIntersection && state.hierarConstraintIntersection.style !== "none") {
    used.add(normalizeColorValue(state.hierarConstraintIntersection.color));
  }
  return used;
}

function pickAvailableHierarConstraintColor(series) {
  const used = getUsedHierarConstraintColors(series ? series.id : "", { includeIntersection: true });
  for (const color of COLOR_PALETTE) {
    if (!used.has(normalizeColorValue(color))) {
      return color;
    }
  }
  return COLOR_PALETTE[0];
}

function getHierarConstraintColorOptions(series) {
  const current = series && series.viz && series.viz.hierarConstraint ? series.viz.hierarConstraint.color : "";
  const normalizedCurrent = normalizeColorValue(current);
  const used = getUsedHierarConstraintColors(series ? series.id : "", { includeIntersection: true });
  return COLOR_PALETTE.filter((color) => {
    const normalized = normalizeColorValue(color);
    return !used.has(normalized) || normalized === normalizedCurrent;
  });
}

function isHierarConstraintColorAllowed(series, color) {
  const normalized = normalizeColorValue(color);
  if (!normalized) {
    return true;
  }
  const used = getUsedHierarConstraintColors(series ? series.id : "", { includeIntersection: true });
  return !used.has(normalized);
}

function pickAvailableIntersectionColor() {
  const used = getUsedHierarConstraintColors("", { includeIntersection: false });
  for (const color of COLOR_PALETTE) {
    if (!used.has(normalizeColorValue(color))) {
      return color;
    }
  }
  return COLOR_PALETTE[0];
}

function getIntersectionColorOptions() {
  const used = getUsedHierarConstraintColors("", { includeIntersection: false });
  const options = COLOR_PALETTE.filter((color) => !used.has(normalizeColorValue(color)));
  const current = state.hierarConstraintIntersection.color;
  if (current && !options.includes(current) && !used.has(normalizeColorValue(current))) {
    options.unshift(current);
  }
  return options;
}

function ensureHierarConstraintColor(series) {
  if (!series || series.role === "LTF") {
    return;
  }
  if (!series.signals || !series.signals.downwardSignalId) {
    return;
  }
  ensureHierarConstraintConfig(series);
  if (!series.viz.hierarConstraint.color) {
    series.viz.hierarConstraint.color = pickAvailableHierarConstraintColor(series);
  }
  if (!isHierarConstraintColorAllowed(series, series.viz.hierarConstraint.color)) {
    series.viz.hierarConstraint.color = pickAvailableHierarConstraintColor(series);
  }
}

function ensureIntersectionColor() {
  if (state.hierarConstraintIntersection.style === "none") {
    return;
  }
  if (!state.hierarConstraintIntersection.color) {
    state.hierarConstraintIntersection.color = DEFAULT_INTERSECTION_COLOR;
  }
  const used = getUsedHierarConstraintColors("", { includeIntersection: false });
  if (used.has(normalizeColorValue(state.hierarConstraintIntersection.color))) {
    state.hierarConstraintIntersection.color = pickAvailableIntersectionColor();
  }
}

function renderVizElements(series) {
  elements.vizElements.innerHTML = "";
  if (!series.viz.elements.length) {
    elements.vizElements.innerHTML = `<div class='helper-text'>${t("viz.empty")}</div>`;
    return;
  }
  series.viz.elements.forEach((element) => {
    const item = document.createElement("div");
    item.className = "viz-item";
    item.draggable = true;
    item.dataset.id = element.id;

    const handle = document.createElement("div");
    handle.className = "viz-handle";
    handle.textContent = "⋮⋮";
    item.appendChild(handle);

    const content = document.createElement("div");
    content.className = "viz-content";
    item.appendChild(content);

    const title = document.createElement("div");
    title.className = "viz-title";
    title.textContent = element.label;
    content.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "viz-controls";
    content.appendChild(controls);

    const addVizField = (labelText, control) => {
      const field = document.createElement("div");
      field.className = "viz-field";

      const label = document.createElement("div");
      label.className = "viz-field-label";
      label.textContent = labelText;
      field.appendChild(label);
      field.appendChild(control);
      controls.appendChild(field);
    };

    const colorPicker = document.createElement("div");
    colorPicker.className = "viz-color-picker";

    const colorInputWrap = document.createElement("div");
    colorInputWrap.className = "viz-color-input-wrap";

    const colorPreview = document.createElement("button");
    colorPreview.type = "button";
    colorPreview.className = "viz-color-preview";
    colorInputWrap.appendChild(colorPreview);

    const colorInput = document.createElement("input");
    colorInput.type = "text";
    colorInput.className = "viz-color-input";
    colorInput.placeholder = "#RRGGBB";
    colorInput.value = element.color || "";
    colorInputWrap.appendChild(colorInput);
    colorPicker.appendChild(colorInputWrap);

    const colorOptions = document.createElement("div");
    colorOptions.className = "viz-color-options";

    const isValidHexColor = (value) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
    const syncColorPreview = (value) => {
      colorPreview.style.backgroundColor = isValidHexColor(value) ? value : "#fff";
    };

    syncColorPreview(colorInput.value);

    let closeOnOutside = null;
    const closeColorOptions = () => {
      colorPicker.classList.remove("open");
      if (closeOnOutside) {
        document.removeEventListener("click", closeOnOutside);
        closeOnOutside = null;
      }
    };

    const openColorOptions = () => {
      if (colorPicker.classList.contains("open")) {
        return;
      }
      colorPicker.classList.add("open");
      closeOnOutside = (evt) => {
        if (!colorPicker.contains(evt.target)) {
          closeColorOptions();
        }
      };
      document.addEventListener("click", closeOnOutside);
    };

    colorPreview.addEventListener("click", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (colorPicker.classList.contains("open")) {
        closeColorOptions();
      } else {
        openColorOptions();
      }
    });

    const currentColor = element.color || "";
    const rawOptions = getColorOptions(series, element);
    const options = [];
    const seen = new Set();
    if (isValidHexColor(currentColor) && !seen.has(currentColor)) {
      options.push(currentColor);
      seen.add(currentColor);
    }
    rawOptions.forEach((color) => {
      if (!seen.has(color)) {
        options.push(color);
        seen.add(color);
      }
    });

    options.forEach((color) => {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "viz-color-option";
      swatch.style.backgroundColor = color;
      swatch.title = color;
      swatch.setAttribute("aria-label", t("color.aria", { color }));
      if (currentColor === color) {
        swatch.classList.add("active");
      }
      swatch.addEventListener("click", (evt) => {
        evt.preventDefault();
        if (element.color === color) {
          closeColorOptions();
          return;
        }
        if (!isColorAllowedForElement(series, element, color)) {
          closeColorOptions();
          return;
        }
        element.color = color;
        colorInput.value = color;
        syncColorPreview(color);
        closeColorOptions();
        renderVizPanel(series);
      });
      colorOptions.appendChild(swatch);
    });
    colorPicker.appendChild(colorOptions);

    colorInput.addEventListener("input", () => {
      syncColorPreview(colorInput.value.trim());
    });

    colorInput.addEventListener("focus", () => {
      closeColorOptions();
    });

    colorInput.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        colorInput.blur();
      }
    });

    colorInput.addEventListener("focusout", (evt) => {
      if (colorPicker.classList.contains("open")) {
        return;
      }
      if (evt.relatedTarget && colorPicker.contains(evt.relatedTarget)) {
        return;
      }
      const nextValue = colorInput.value.trim();
      if (!nextValue) {
        colorInput.value = element.color || "";
        syncColorPreview(colorInput.value);
        return;
      }
      if (isValidHexColor(nextValue)) {
        if (element.color === nextValue) {
          syncColorPreview(nextValue);
          return;
        }
        if (isColorAllowedForElement(series, element, nextValue)) {
          element.color = nextValue;
          renderVizPanel(series);
        } else {
          colorInput.value = element.color || "";
          syncColorPreview(colorInput.value);
        }
      } else {
        colorInput.value = element.color || "";
        syncColorPreview(colorInput.value);
      }
    });

    addVizField(t("viz.field.color"), colorPicker);

    if (element.type === "line") {
      const lineSelect = document.createElement("select");
      [
        { value: "solid", label: t("viz.lineStyle.solid") },
        { value: "dashed", label: t("viz.lineStyle.dashed") },
        { value: "dotted", label: t("viz.lineStyle.dotted") },
      ].forEach((style) => {
        const option = document.createElement("option");
        option.value = style.value;
        option.textContent = style.label;
        option.selected = element.lineStyle === style.value;
        lineSelect.appendChild(option);
      });
      lineSelect.addEventListener("change", (evt) => {
        element.lineStyle = evt.target.value;
      });
      addVizField(t("viz.field.style"), lineSelect);

      const widthInput = document.createElement("input");
      widthInput.type = "number";
      widthInput.min = "1";
      widthInput.value = element.lineWidth;
      widthInput.addEventListener("input", (evt) => {
        element.lineWidth = Number(evt.target.value || 1);
      });
      addVizField(t("viz.field.size"), widthInput);
    } else {
      const markerSelect = document.createElement("select");
      [
        { value: "circle", label: t("viz.marker.circle") },
        { value: "square", label: t("viz.marker.square") },
        { value: "diamond", label: t("viz.marker.diamond") },
        { value: "cross", label: t("viz.marker.cross") },
      ].forEach((shape) => {
        const option = document.createElement("option");
        option.value = shape.value;
        option.textContent = shape.label;
        option.selected = element.marker === shape.value;
        markerSelect.appendChild(option);
      });
      markerSelect.addEventListener("change", (evt) => {
        element.marker = evt.target.value;
      });
      addVizField(t("viz.field.style"), markerSelect);

      const sizeInput = document.createElement("input");
      sizeInput.type = "number";
      sizeInput.min = "2";
      sizeInput.value = element.size;
      sizeInput.addEventListener("input", (evt) => {
        element.size = Number(evt.target.value || 4);
      });
      addVizField(t("viz.field.size"), sizeInput);
    }

    const footer = document.createElement("div");
    footer.className = "viz-footer";

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn ghost viz-remove";
    removeBtn.textContent = t("action.delete");
    removeBtn.addEventListener("click", () => {
      series.viz.elements = series.viz.elements.filter((el) => el.id !== element.id);
      renderVizPanel(series);
    });
    footer.appendChild(removeBtn);
    content.appendChild(footer);
    addVizDragHandlers(item, series);
    elements.vizElements.appendChild(item);
  });
}

function getDownwardSignalLabel(series) {
  if (!series || !series.signals || !series.signals.downwardSignalId) {
    return "";
  }
  const nodes = collectSignalNodes(series);
  const node = nodes.find((item) => item.id === series.signals.downwardSignalId);
  return node ? buildSignalAlias(node) : series.signals.downwardSignalId;
}

function buildHierarConstraintColorPicker(series) {
  const colorPicker = document.createElement("div");
  colorPicker.className = "viz-color-picker";

  const colorInputWrap = document.createElement("div");
  colorInputWrap.className = "viz-color-input-wrap";

  const colorPreview = document.createElement("button");
  colorPreview.type = "button";
  colorPreview.className = "viz-color-preview";
  colorInputWrap.appendChild(colorPreview);

  const colorInput = document.createElement("input");
  colorInput.type = "text";
  colorInput.className = "viz-color-input";
  colorInput.placeholder = "#RRGGBB";
  colorInput.value = series.viz.hierarConstraint.color || "";
  colorInputWrap.appendChild(colorInput);
  colorPicker.appendChild(colorInputWrap);

  const colorOptions = document.createElement("div");
  colorOptions.className = "viz-color-options";

  const isValidHexColor = (value) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
  const syncColorPreview = (value) => {
    colorPreview.style.backgroundColor = isValidHexColor(value) ? value : "#fff";
  };

  syncColorPreview(colorInput.value);

  let closeOnOutside = null;
  const closeColorOptions = () => {
    colorPicker.classList.remove("open");
    if (closeOnOutside) {
      document.removeEventListener("click", closeOnOutside);
      closeOnOutside = null;
    }
  };

  const openColorOptions = () => {
    if (colorPicker.classList.contains("open")) {
      return;
    }
    colorPicker.classList.add("open");
    closeOnOutside = (evt) => {
      if (!colorPicker.contains(evt.target)) {
        closeColorOptions();
      }
    };
    document.addEventListener("click", closeOnOutside);
  };

  colorPreview.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    if (colorPicker.classList.contains("open")) {
      closeColorOptions();
    } else {
      openColorOptions();
    }
  });

  const currentColor = series.viz.hierarConstraint.color || "";
  const rawOptions = getHierarConstraintColorOptions(series);
  const options = [];
  const seen = new Set();
  if (isValidHexColor(currentColor) && !seen.has(currentColor)) {
    options.push(currentColor);
    seen.add(currentColor);
  }
  rawOptions.forEach((color) => {
    if (!seen.has(color)) {
      options.push(color);
      seen.add(color);
    }
  });

  options.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "viz-color-option";
    swatch.style.backgroundColor = color;
    swatch.title = color;
    swatch.setAttribute("aria-label", t("color.aria", { color }));
    if (currentColor === color) {
      swatch.classList.add("active");
    }
    swatch.addEventListener("click", (evt) => {
      evt.preventDefault();
      if (series.viz.hierarConstraint.color === color) {
        closeColorOptions();
        return;
      }
      if (!isHierarConstraintColorAllowed(series, color)) {
        closeColorOptions();
        return;
      }
      series.viz.hierarConstraint.color = color;
      colorInput.value = color;
      syncColorPreview(color);
      closeColorOptions();
      renderHierarConstraintPanel(series);
      renderPlot();
    });
    colorOptions.appendChild(swatch);
  });
  colorPicker.appendChild(colorOptions);

  colorInput.addEventListener("input", () => {
    syncColorPreview(colorInput.value.trim());
  });

  colorInput.addEventListener("focus", () => {
    closeColorOptions();
  });

  colorInput.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      colorInput.blur();
    }
  });

  colorInput.addEventListener("focusout", (evt) => {
    if (colorPicker.classList.contains("open")) {
      return;
    }
    if (evt.relatedTarget && colorPicker.contains(evt.relatedTarget)) {
      return;
    }
    const nextValue = colorInput.value.trim();
    if (!nextValue) {
      colorInput.value = series.viz.hierarConstraint.color || "";
      syncColorPreview(colorInput.value);
      return;
    }
    if (isValidHexColor(nextValue)) {
      if (series.viz.hierarConstraint.color === nextValue) {
        syncColorPreview(nextValue);
        return;
      }
      if (isHierarConstraintColorAllowed(series, nextValue)) {
        series.viz.hierarConstraint.color = nextValue;
        renderHierarConstraintPanel(series);
        renderPlot();
      } else {
        colorInput.value = series.viz.hierarConstraint.color || "";
        syncColorPreview(colorInput.value);
      }
    } else {
      colorInput.value = series.viz.hierarConstraint.color || "";
      syncColorPreview(colorInput.value);
    }
  });

  return colorPicker;
}

function renderHierarConstraintPanel(series) {
  if (!elements.hierarConstraintControls || !elements.hierarConstraintNote) {
    return;
  }
  elements.hierarConstraintControls.innerHTML = "";
  elements.hierarConstraintNote.textContent = "";

  if (!series || series.role === "LTF") {
    if (elements.hierarConstraintPanel) {
      elements.hierarConstraintPanel.classList.add("hidden");
    }
    return;
  }
  if (elements.hierarConstraintPanel) {
    elements.hierarConstraintPanel.classList.remove("hidden");
  }

  if (!series.signals || !series.signals.downwardSignalId) {
    elements.hierarConstraintControls.classList.add("hidden");
    elements.hierarConstraintNote.textContent = t("hierarchyConstraint.note.selectDownSignal");
    return;
  }

  ensureHierarConstraintConfig(series);
  ensureHierarConstraintColor(series);
  elements.hierarConstraintControls.classList.remove("hidden");

  const controls = document.createElement("div");
  controls.className = "viz-controls";
  elements.hierarConstraintControls.appendChild(controls);

  const addField = (labelText, control) => {
    const field = document.createElement("div");
    field.className = "viz-field";

    const label = document.createElement("div");
    label.className = "viz-field-label";
    label.textContent = labelText;
    field.appendChild(label);
    field.appendChild(control);
    controls.appendChild(field);
  };

  addField(t("viz.field.color"), buildHierarConstraintColorPicker(series));

  const styleSelect = document.createElement("select");
  HIERAR_CONSTRAINT_STYLES.forEach((style) => {
    const option = document.createElement("option");
    option.value = style.value;
    option.textContent = t(style.labelKey);
    option.selected = series.viz.hierarConstraint.style === style.value;
    styleSelect.appendChild(option);
  });
  styleSelect.addEventListener("change", (evt) => {
    series.viz.hierarConstraint.style = evt.target.value;
    renderHierarConstraintPanel(series);
    renderPlot();
  });
  addField(t("viz.field.style"), styleSelect);

  const opacityInput = document.createElement("input");
  opacityInput.type = "number";
  opacityInput.min = "0";
  opacityInput.max = "1";
  opacityInput.step = "0.05";
  opacityInput.value = clampOpacity(series.viz.hierarConstraint.opacity);
  opacityInput.disabled = series.viz.hierarConstraint.style !== "background";
  opacityInput.addEventListener("input", (evt) => {
    series.viz.hierarConstraint.opacity = clampOpacity(evt.target.value);
    evt.target.value = series.viz.hierarConstraint.opacity;
    renderPlot();
  });
  addField(t("viz.field.opacity"), opacityInput);

  const signalLabel = getDownwardSignalLabel(series);
  if (signalLabel) {
    elements.hierarConstraintNote.textContent = t("hierarchyConstraint.note.current", { name: signalLabel });
  }
}

function getColorOptions(series, element) {
  const currentColor = normalizeColorValue(element && element.color ? element.color : "");
  const used = collectUsedColorsByType(series, element ? element.type : "", element ? element.id : "");
  return COLOR_PALETTE.filter((color) => {
    const normalized = normalizeColorValue(color);
    return !used.has(normalized) || normalized === currentColor;
  });
}

function addVizDragHandlers(item, series) {
  item.addEventListener("dragstart", () => {
    item.classList.add("dragging");
  });
  item.addEventListener("dragend", () => {
    item.classList.remove("dragging");
  });
  elements.vizElements.addEventListener("dragover", (evt) => {
    evt.preventDefault();
    const dragging = elements.vizElements.querySelector(".dragging");
    if (!dragging) {
      return;
    }
    const after = getDragAfterElement(elements.vizElements, evt.clientY);
    if (after == null) {
      elements.vizElements.appendChild(dragging);
    } else {
      elements.vizElements.insertBefore(dragging, after);
    }
  });
  elements.vizElements.addEventListener("drop", () => {
    const ids = Array.from(elements.vizElements.children)
      .filter((child) => child.classList.contains("viz-item"))
      .map((child) => child.dataset.id);
    series.viz.elements.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  });
}

function getDragAfterElement(container, y) {
  const items = [...container.querySelectorAll(".viz-item:not(.dragging)")];
  return items.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function openVizPicker() {
  const series = getActiveSeries();
  if (!series) {
    return;
  }
  const available = buildVizPickerOptions(series);
  elements.vizPickerOptions.innerHTML = "";
  available.forEach((option) => {
    const item = document.createElement("div");
    item.className = "picker-option";
    item.textContent = option.label;
    item.addEventListener("click", () => {
      series.viz.elements.push({ ...option, id: `viz-${Date.now()}-${Math.random().toString(16).slice(2, 6)}` });
      assignDefaultColors(series);
      closeVizPicker();
      renderVizPanel(series);
    });
    elements.vizPickerOptions.appendChild(item);
  });
  elements.vizPicker.classList.remove("hidden");
}

function closeVizPicker() {
  elements.vizPicker.classList.add("hidden");
}

function buildSeriesScaleLabel(series) {
  if (!series || !series.scaleValue || !series.scaleUnit) {
    return series && series.name ? series.name : t("series.scale.unset");
  }
  const unit = TIME_UNITS.find((entry) => entry.key === series.scaleUnit);
  const short = unit ? unit.short : series.scaleUnit;
  return `${series.scaleValue}${short}`;
}

function getAvailableHierarConstraintSignals(seriesList = state.series) {
  return (seriesList || [])
    .filter((series) => series && series.role !== "LTF" && series.signals?.downwardSignalId)
    .map((series) => {
      const nodes = collectSignalNodes(series);
      const node = nodes.find((item) => item.id === series.signals.downwardSignalId) || null;
      return {
        series,
        node,
        scaleLabel: buildSeriesScaleLabel(series),
        alias: node ? buildSignalAlias(node) : series.signals.downwardSignalId,
        type: node ? node.type : t("signal.type.fallback"),
      };
    });
}

function syncIntersectionSelection(availableIds) {
  const selected = state.hierarConstraintIntersection.selectedSeriesIds;
  if (!state.hierarConstraintIntersection.selectionInitialized) {
    selected.clear();
    availableIds.forEach((id) => {
      selected.add(id);
    });
    state.hierarConstraintIntersection.selectionInitialized = true;
    state.hierarConstraintIntersection.selectionMode = "all";
    return;
  }

  Array.from(selected).forEach((id) => {
    if (!availableIds.includes(id)) {
      selected.delete(id);
    }
  });

  if (state.hierarConstraintIntersection.selectionMode === "all") {
    availableIds.forEach((id) => {
      selected.add(id);
    });
  }
}

function getIntersectionSelection(seriesList = state.series) {
  const available = getAvailableHierarConstraintSignals(seriesList);
  const availableIds = available.map((entry) => entry.series.id);
  syncIntersectionSelection(availableIds);
  return {
    available,
    availableIds,
    selectedIds: state.hierarConstraintIntersection.selectedSeriesIds,
  };
}

function updateIntersectionSelectionMode(availableIds) {
  const selected = state.hierarConstraintIntersection.selectedSeriesIds;
  const allSelected = availableIds.length > 0 && availableIds.every((id) => selected.has(id));
  state.hierarConstraintIntersection.selectionMode = allSelected ? "all" : "custom";
}

function renderIntersectionSignalList() {
  if (!elements.intersectionSignalList) {
    return;
  }
  const { available, selectedIds } = getIntersectionSelection();
  elements.intersectionSignalList.innerHTML = "";
  if (elements.intersectionSignalEmpty) {
    elements.intersectionSignalEmpty.classList.toggle("hidden", available.length > 0);
  }
  if (elements.intersectionSelectAll) {
    elements.intersectionSelectAll.disabled = available.length === 0;
  }
  if (!available.length) {
    return;
  }

  available.forEach((entry) => {
    const item = document.createElement("label");
    item.className = "intersection-signal-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.id = entry.series.id;
    checkbox.checked = selectedIds.has(entry.series.id);

    const textWrap = document.createElement("div");
    textWrap.className = "intersection-signal-text";

    const title = document.createElement("div");
    title.className = "intersection-signal-title";

    const scale = document.createElement("span");
    scale.className = "intersection-signal-scale";
    scale.textContent = entry.scaleLabel || "-";

    const alias = document.createElement("span");
    alias.textContent = entry.alias || "-";

    const sub = document.createElement("div");
    sub.className = "intersection-signal-sub";
    sub.textContent = entry.type || "";

    title.appendChild(scale);
    title.appendChild(alias);
    textWrap.appendChild(title);
    textWrap.appendChild(sub);
    item.appendChild(checkbox);
    item.appendChild(textWrap);
    elements.intersectionSignalList.appendChild(item);
  });
}

function handleIntersectionSignalSelection(event) {
  const checkbox = event.target.closest('input[type="checkbox"][data-id]');
  if (!checkbox) {
    return;
  }
  const seriesId = checkbox.dataset.id;
  if (checkbox.checked) {
    state.hierarConstraintIntersection.selectedSeriesIds.add(seriesId);
  } else {
    state.hierarConstraintIntersection.selectedSeriesIds.delete(seriesId);
  }
  const availableIds = getAvailableHierarConstraintSignals().map((entry) => entry.series.id);
  updateIntersectionSelectionMode(availableIds);
  renderPlot();
}

function handleIntersectionSelectAll() {
  const availableIds = getAvailableHierarConstraintSignals().map((entry) => entry.series.id);
  state.hierarConstraintIntersection.selectionMode = "all";
  state.hierarConstraintIntersection.selectionInitialized = true;
  state.hierarConstraintIntersection.selectedSeriesIds.clear();
  availableIds.forEach((id) => {
    state.hierarConstraintIntersection.selectedSeriesIds.add(id);
  });
  renderIntersectionSignalList();
  renderPlot();
}

function isIntersectionColorAllowed(color) {
  const normalized = normalizeColorValue(color);
  if (!normalized) {
    return true;
  }
  if (normalizeColorValue(state.hierarConstraintIntersection.color) === normalized) {
    return true;
  }
  const used = getUsedHierarConstraintColors("", { includeIntersection: false });
  return !used.has(normalized);
}

function buildIntersectionColorPicker() {
  const colorPicker = document.createElement("div");
  colorPicker.className = "viz-color-picker";

  const colorInputWrap = document.createElement("div");
  colorInputWrap.className = "viz-color-input-wrap";

  const colorPreview = document.createElement("button");
  colorPreview.type = "button";
  colorPreview.className = "viz-color-preview";
  colorInputWrap.appendChild(colorPreview);

  const colorInput = document.createElement("input");
  colorInput.type = "text";
  colorInput.className = "viz-color-input";
  colorInput.placeholder = "#RRGGBB";
  colorInput.value = state.hierarConstraintIntersection.color || "";
  colorInputWrap.appendChild(colorInput);
  colorPicker.appendChild(colorInputWrap);

  const colorOptions = document.createElement("div");
  colorOptions.className = "viz-color-options";

  const isValidHexColor = (value) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
  const syncColorPreview = (value) => {
    colorPreview.style.backgroundColor = isValidHexColor(value) ? value : "#fff";
  };

  syncColorPreview(colorInput.value);

  let closeOnOutside = null;
  const closeColorOptions = () => {
    colorPicker.classList.remove("open");
    if (closeOnOutside) {
      document.removeEventListener("click", closeOnOutside);
      closeOnOutside = null;
    }
  };

  const openColorOptions = () => {
    if (colorPicker.classList.contains("open")) {
      return;
    }
    colorPicker.classList.add("open");
    closeOnOutside = (evt) => {
      if (!colorPicker.contains(evt.target)) {
        closeColorOptions();
      }
    };
    document.addEventListener("click", closeOnOutside);
  };

  colorPreview.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    if (colorPicker.classList.contains("open")) {
      closeColorOptions();
    } else {
      openColorOptions();
    }
  });

  const currentColor = state.hierarConstraintIntersection.color || "";
  const rawOptions = getIntersectionColorOptions();
  const options = [];
  const seen = new Set();
  if (isValidHexColor(currentColor) && !seen.has(currentColor)) {
    options.push(currentColor);
    seen.add(currentColor);
  }
  rawOptions.forEach((color) => {
    if (!seen.has(color)) {
      options.push(color);
      seen.add(color);
    }
  });

  options.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "viz-color-option";
    swatch.style.backgroundColor = color;
    swatch.title = color;
    swatch.setAttribute("aria-label", t("color.aria", { color }));
    if (currentColor === color) {
      swatch.classList.add("active");
    }
    swatch.addEventListener("click", (evt) => {
      evt.preventDefault();
      if (state.hierarConstraintIntersection.color === color) {
        closeColorOptions();
        return;
      }
      if (!isIntersectionColorAllowed(color)) {
        closeColorOptions();
        return;
      }
      state.hierarConstraintIntersection.color = color;
      colorInput.value = color;
      syncColorPreview(color);
      closeColorOptions();
      renderIntersectionStyleControls();
      renderPlot();
    });
    colorOptions.appendChild(swatch);
  });
  colorPicker.appendChild(colorOptions);

  colorInput.addEventListener("input", () => {
    syncColorPreview(colorInput.value.trim());
  });

  colorInput.addEventListener("focus", () => {
    closeColorOptions();
  });

  colorInput.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      colorInput.blur();
    }
  });

  colorInput.addEventListener("focusout", (evt) => {
    if (colorPicker.classList.contains("open")) {
      return;
    }
    if (evt.relatedTarget && colorPicker.contains(evt.relatedTarget)) {
      return;
    }
    const nextValue = colorInput.value.trim();
    if (!nextValue) {
      colorInput.value = state.hierarConstraintIntersection.color || "";
      syncColorPreview(colorInput.value);
      return;
    }
    if (isValidHexColor(nextValue)) {
      if (state.hierarConstraintIntersection.color === nextValue) {
        syncColorPreview(nextValue);
        return;
      }
      if (isIntersectionColorAllowed(nextValue)) {
        state.hierarConstraintIntersection.color = nextValue;
        renderIntersectionStyleControls();
        renderPlot();
      } else {
        colorInput.value = state.hierarConstraintIntersection.color || "";
        syncColorPreview(colorInput.value);
      }
    } else {
      colorInput.value = state.hierarConstraintIntersection.color || "";
      syncColorPreview(colorInput.value);
    }
  });

  return colorPicker;
}

function renderIntersectionStyleControls() {
  if (!elements.intersectionStyleSelect || !elements.intersectionOpacity || !elements.intersectionColorPicker) {
    return;
  }
  if (!elements.intersectionStyleSelect.options.length) {
    INTERSECTION_STYLE_OPTIONS.forEach((style) => {
      const option = document.createElement("option");
      option.value = style.value;
      option.textContent = t(style.labelKey);
      elements.intersectionStyleSelect.appendChild(option);
    });
  }

  ensureIntersectionColor();
  elements.intersectionStyleSelect.value = state.hierarConstraintIntersection.style;
  elements.intersectionOpacity.value = clampOpacity(state.hierarConstraintIntersection.opacity);
  elements.intersectionOpacity.disabled = state.hierarConstraintIntersection.style !== "background";
  elements.intersectionColorPicker.innerHTML = "";
  elements.intersectionColorPicker.appendChild(buildIntersectionColorPicker());
}

function handleIntersectionStyleChange(event) {
  const next = event.target.value;
  state.hierarConstraintIntersection.style = next;
  if (next !== "none" && !state.hierarConstraintIntersection.color) {
    state.hierarConstraintIntersection.color = pickAvailableIntersectionColor();
  }
  ensureIntersectionColor();
  renderIntersectionStyleControls();
  renderPlot();
}

function handleIntersectionOpacityChange() {
  const next = clampOpacity(elements.intersectionOpacity.value);
  state.hierarConstraintIntersection.opacity = next;
  elements.intersectionOpacity.value = next;
  renderPlot();
}

function openIntersectionPanel() {
  if (!elements.intersectionOverlay) {
    return;
  }
  const isOpen = !elements.intersectionOverlay.classList.contains("hidden");
  renderIntersectionSignalList();
  renderIntersectionStyleControls();
  if (!isOpen) {
    renderIntersectionExportPanel();
    elements.intersectionOverlay.classList.remove("hidden");
  }
}

function closeIntersectionPanel() {
  if (!elements.intersectionOverlay) {
    return;
  }
  elements.intersectionOverlay.classList.add("hidden");
  setIntersectionExportStatus("");
}

function syncIntersectionControls() {
  if (!elements.intersectionOverlay || elements.intersectionOverlay.classList.contains("hidden")) {
    return;
  }
  renderIntersectionSignalList();
  renderIntersectionStyleControls();
}

function renderIntersectionExportPanel() {
  if (!elements.intersectionExportSeries || !elements.intersectionExportSignalList) {
    return;
  }
  const seriesList = state.series || [];
  elements.intersectionExportSeries.innerHTML = "";
  if (!seriesList.length) {
    elements.intersectionExportSeries.disabled = true;
    elements.intersectionExportSignalList.innerHTML = "";
    state.intersectionExportState.selectedIds.clear();
    state.intersectionExportState.signalMap = new Map();
    if (elements.intersectionExportSignalEmpty) {
      elements.intersectionExportSignalEmpty.classList.remove("hidden");
    }
    updateIntersectionExportSaveState();
    return;
  }

  const currentId = state.intersectionExportState.seriesId;
  const fallbackId =
    (currentId && seriesList.find((series) => series.id === currentId)?.id) ||
    (state.activeSeriesId && seriesList.find((series) => series.id === state.activeSeriesId)?.id) ||
    seriesList[0].id;
  state.intersectionExportState.seriesId = fallbackId;

  seriesList.forEach((series) => {
    const option = document.createElement("option");
    option.value = series.id;
    option.textContent = series.name || series.id;
    if (series.id === fallbackId) {
      option.selected = true;
    }
    elements.intersectionExportSeries.appendChild(option);
  });

  elements.intersectionExportSeries.disabled = false;
  const series = seriesList.find((item) => item.id === fallbackId) || null;
  renderIntersectionExportSignalList(series);

  if (elements.intersectionExportIncludeDeps) {
    elements.intersectionExportIncludeDeps.checked = state.intersectionExportState.includeDependencies;
  }
  if (elements.intersectionExportIncludeValues) {
    elements.intersectionExportIncludeValues.checked = state.intersectionExportState.includeValues;
  }
  if (elements.intersectionExportDirectory) {
    elements.intersectionExportDirectory.value = state.intersectionExportState.directoryHandle
      ? state.intersectionExportState.directoryHandle.name
      : "Downloads";
  }
  if (elements.intersectionExportFileName && series) {
    elements.intersectionExportFileName.value = buildDefaultExportName(series);
  }
  if (elements.intersectionExportFileType) {
    elements.intersectionExportFileType.value = "csv";
  }
  updateIntersectionExportSaveState();
  setIntersectionExportStatus("");
}

function renderIntersectionExportSignalList(series) {
  if (!elements.intersectionExportSignalList) {
    return;
  }
  if (!series) {
    elements.intersectionExportSignalList.innerHTML = "";
    state.intersectionExportState.selectedIds.clear();
    state.intersectionExportState.signalMap = new Map();
    if (elements.intersectionExportSignalEmpty) {
      elements.intersectionExportSignalEmpty.classList.remove("hidden");
    }
    updateIntersectionExportSaveState();
    return;
  }
  const nodes = collectSignalNodes(series);
  state.intersectionExportState.signalMap = new Map(nodes.map((node) => [node.id, node]));
  state.intersectionExportState.selectedIds.clear();

  elements.intersectionExportSignalList.innerHTML = "";
  if (!nodes.length) {
    if (elements.intersectionExportSignalEmpty) {
      elements.intersectionExportSignalEmpty.classList.remove("hidden");
    }
  } else {
    if (elements.intersectionExportSignalEmpty) {
      elements.intersectionExportSignalEmpty.classList.add("hidden");
    }
    nodes.forEach((node) => {
      const item = document.createElement("label");
      item.className = "export-signal-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.id = node.id;

      const textWrap = document.createElement("div");
      textWrap.className = "export-signal-text";
      const title = document.createElement("div");
      title.className = "export-signal-title";
      title.textContent = buildSignalAlias(node);
      const sub = document.createElement("div");
      sub.className = "export-signal-sub";
      sub.textContent = node.type || "";

      textWrap.appendChild(title);
      textWrap.appendChild(sub);
      item.appendChild(checkbox);
      item.appendChild(textWrap);
      elements.intersectionExportSignalList.appendChild(item);
    });
  }
  updateIntersectionExportSaveState();
}

function handleIntersectionExportSeriesChange() {
  if (!elements.intersectionExportSeries) {
    return;
  }
  const seriesId = elements.intersectionExportSeries.value;
  state.intersectionExportState.seriesId = seriesId;
  const series = state.series.find((item) => item.id === seriesId) || null;
  if (series) {
    renderIntersectionExportSignalList(series);
    if (elements.intersectionExportFileName) {
      elements.intersectionExportFileName.value = buildDefaultExportName(series);
    }
  }
}

function handleIntersectionExportSignalSelection(event) {
  const checkbox = event.target.closest('input[type="checkbox"][data-id]');
  if (!checkbox) {
    return;
  }
  const signalId = checkbox.dataset.id;
  if (checkbox.checked) {
    state.intersectionExportState.selectedIds.add(signalId);
  } else {
    state.intersectionExportState.selectedIds.delete(signalId);
  }
  updateIntersectionExportSaveState();
}

async function handleIntersectionExportPickDirectory() {
  setIntersectionExportStatus("");
  if (typeof window.showDirectoryPicker !== "function") {
    setIntersectionExportStatus(t("export.directory.unsupported"), "error");
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    state.intersectionExportState.directoryHandle = handle;
    if (elements.intersectionExportDirectory) {
      elements.intersectionExportDirectory.value = handle.name || t("export.directory.selected");
    }
    setIntersectionExportStatus("");
  } catch (err) {
    if (err && err.name === "AbortError") {
      return;
    }
    setIntersectionExportStatus(t("export.directory.failed"), "error");
  }
}

async function handleIntersectionExportSave() {
  const series = state.series.find((item) => item.id === state.intersectionExportState.seriesId);
  if (!series) {
    setIntersectionExportStatus(t("export.error.noSeries"), "error");
    return;
  }
  if (!state.intersectionExportState.selectedIds.size) {
    setIntersectionExportStatus(t("export.error.noSignalsSelected"), "error");
    return;
  }
  if (!window.HTF || !window.HTF.TimeframeView || !window.HTF.TimeframeConfig) {
    setIntersectionExportStatus(t("export.error.libraryNotReady"), "error");
    return;
  }

  setIntersectionExportStatus(t("export.status.generating"), "");

  try {
    const selectedNodes = Array.from(state.intersectionExportState.selectedIds)
      .map((id) => state.intersectionExportState.signalMap.get(id))
      .filter(Boolean);
    const timeframes = [...state.series].sort((a, b) => scaleWeight(b) - scaleWeight(a));
    const signalCache = new Map();
    const { selectedIds } = getIntersectionSelection(timeframes);
    const hierarConstraintSeries = buildIntersectionHierarConstraintSeries(timeframes, signalCache, selectedIds);
    const timeframeSeries = buildIntersectionTimeframeSeries(timeframes, selectedIds);
    const frames = collectExportFrames(series, selectedNodes, {
      applyHierarConstraint: true,
      includeDependencies: state.intersectionExportState.includeDependencies,
      includeValues: state.intersectionExportState.includeValues,
      hierarConstraintSeries,
      timeframeSeries,
    });
    const merged = mergeExportFrames(frames);
    if (!merged.rows.length) {
      setIntersectionExportStatus(t("export.error.noData"), "error");
      return;
    }

    const fileType = elements.intersectionExportFileType ? elements.intersectionExportFileType.value || "csv" : "csv";
    const fileName = normalizeExportFileName(
      elements.intersectionExportFileName ? elements.intersectionExportFileName.value : "",
      fileType,
      series
    );

    if (fileType === "xlsx") {
      if (typeof XLSX === "undefined") {
        throw new Error(t("export.error.xlsxMissing"));
      }
      const blob = buildXlsxBlob(merged.rows, merged.columns);
      await saveBlobToDestination(blob, fileName);
    } else {
      const csv = buildCsvContent(merged.rows, merged.columns);
      const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
      await saveBlobToDestination(blob, fileName);
    }

    setIntersectionExportStatus(t("export.status.saved"), "success");
  } catch (err) {
    console.error(err);
    setIntersectionExportStatus(t("export.error.saveFailed"), "error");
  }
}

function updateIntersectionExportSaveState() {
  if (!elements.intersectionExportSave) {
    return;
  }
  elements.intersectionExportSave.disabled = state.intersectionExportState.selectedIds.size === 0;
}

function setIntersectionExportStatus(message, kind = "") {
  if (!elements.intersectionExportStatus) {
    return;
  }
  elements.intersectionExportStatus.textContent = message || "";
  elements.intersectionExportStatus.classList.toggle("is-error", kind === "error");
  elements.intersectionExportStatus.classList.toggle("is-success", kind === "success");
}

function buildVizPickerOptions(series) {
  const signalNodes = collectSignalNodes(series);
  const existingLabels = new Set(series.viz.elements.map((el) => el.label));
  const existingSignalIds = new Set(
    series.viz.elements.filter((el) => el.type === "signal").map((el) => el.signalId)
  );
  const options = [];
  const lineLabel = getDefaultVizLabel("line");
  const rawLabel = getDefaultVizLabel("raw");
  if (lineLabel && !existingLabels.has(lineLabel)) {
    options.push(createVizElement("line", lineLabel));
  }
  if (rawLabel && !existingLabels.has(rawLabel)) {
    options.push(createVizElement("raw", rawLabel));
  }
  signalNodes.forEach((node) => {
    if (!existingSignalIds.has(node.id)) {
      options.push(createVizElement("signal", buildSignalVizLabel(node), node.id));
    }
  });
  return options;
}

function updateVizStatus(series) {
  series.status.viz = series.viz.elements.length > 0;
}

function updateWizardStatus(series) {
  updateSourceStatus(series);
  updateScaleStatus(series);
  updateSignalStatus(series);
  updateVizStatus(series);
  const statusText = isSeriesComplete(series) ? t("wizard.status.complete") : t("wizard.status.incomplete");
  elements.wizardStatus.textContent = statusText;
}

function buildAxisMap(seriesOrder) {
  return seriesOrder.map((series, idx) => ({
    seriesId: series.id,
    orderIndex: idx,
    axisX: idx === 0 ? "x" : `x${idx + 1}`,
    axisY: idx === 0 ? "y" : `y${idx + 1}`,
    timestamps: (series.data || []).map((point) => point.ts),
  }));
}

function collectHierarConstraintWindows(series, signalCache) {
  if (!series || !series.signals || !series.signals.downwardSignalId) {
    return [];
  }
  const data = series.data || [];
  if (!data.length) {
    return [];
  }
  const outputs = getSeriesSignalOutputs(series, signalCache);
  const flags = normalizeFlagSeries(outputs.get(series.signals.downwardSignalId), data.length, false);
  const timestamps = data.map((point) => point.ts);
  return truthyWindows(flags, timestamps);
}

function mapWindowsToMask(windows, timestamps) {
  const utils = getHtfUtils();
  if (utils && typeof utils.mapWindowsToMask === "function") {
    return utils.mapWindowsToMask(windows, timestamps);
  }
  if (!timestamps || !timestamps.length) {
    return [];
  }
  if (!windows || !windows.length) {
    return new Array(timestamps.length).fill(false);
  }
  const mask = new Array(timestamps.length).fill(false);
  let winIdx = 0;
  let start = windows[0][0];
  let end = windows[0][1];
  for (let i = 0; i < timestamps.length; i += 1) {
    const ts = timestamps[i];
    while (winIdx < windows.length && ts > end) {
      winIdx += 1;
      if (winIdx < windows.length) {
        start = windows[winIdx][0];
        end = windows[winIdx][1];
      }
    }
    if (winIdx < windows.length && ts >= start && ts <= end) {
      mask[i] = true;
    }
  }
  return mask;
}

function mapWindowsToTimestamps(windows, timestamps) {
  if (!timestamps || !timestamps.length) {
    return [];
  }
  const mask = mapWindowsToMask(windows, timestamps);
  if (!mask.length) {
    return [];
  }
  return truthyWindows(mask, timestamps);
}

function buildHierarConstraintShapesForWindows(windows, axisX, axisY, config, overlayId) {
  const shapes = [];
  if (!windows.length || !config || !config.color) {
    return shapes;
  }
  const style = config.style || DEFAULT_HIERAR_CONSTRAINT_STYLE;
  const color = config.color;
  const opacity = clampOpacity(config.opacity);
  const yref = `${axisY} domain`;

  if (style === "background") {
    windows.forEach(([start, end]) => {
      shapes.push({
        type: "rect",
        xref: axisX,
        yref,
        x0: start,
        x1: end,
        y0: 0,
        y1: 1,
        fillcolor: color,
        opacity,
        line: { width: 0 },
        layer: "below",
        name: overlayId,
      });
    });
    return shapes;
  }

  const dash = style === "dashed" ? "dash" : "solid";
  windows.forEach(([start, end]) => {
    [start, end].forEach((ts) => {
      shapes.push({
        type: "line",
        xref: axisX,
        yref,
        x0: ts,
        x1: ts,
        y0: 0,
        y1: 1,
        line: { color, width: 1, dash },
        layer: "above",
        name: overlayId,
      });
    });
  });
  return shapes;
}

function computeIntersectionWindows(windowsBySeries, seriesList) {
  if (!seriesList.length) {
    return [];
  }
  let intersection = null;
  for (const series of seriesList) {
    const windows = windowsBySeries.get(series.id) || [];
    if (!windows.length) {
      return [];
    }
    if (!intersection) {
      intersection = windows;
      continue;
    }
    intersection = intersectWindows(intersection, windows);
    if (!intersection.length) {
      return [];
    }
  }
  return intersection || [];
}

function buildHierarConstraintOverlays(seriesOrder, signalCache, plotMode) {
  const overlays = { shapes: [], legendItems: [] };
  const ltfSeries = seriesOrder.find((series) => series.role === "LTF") || seriesOrder[0] || null;
  const ltfAxis = {
    seriesId: ltfSeries ? ltfSeries.id : "",
    orderIndex: 0,
    axisX: "x",
    axisY: "y",
    timestamps: ltfSeries ? (ltfSeries.data || []).map((point) => point.ts) : [],
  };
  const axisMap = plotMode === "parallel" ? buildAxisMap(seriesOrder) : [ltfAxis];
  const orderIndex = new Map(seriesOrder.map((series, idx) => [series.id, idx]));
  const nonLtf = seriesOrder.filter((series) => series.role !== "LTF" && series.signals?.downwardSignalId);
  const { selectedIds } = getIntersectionSelection(seriesOrder);
  const selectedSeries = nonLtf.filter((series) => selectedIds.has(series.id));

  const windowsBySeries = new Map();
  nonLtf.forEach((series) => {
    windowsBySeries.set(series.id, collectHierarConstraintWindows(series, signalCache));
  });

  nonLtf.forEach((series) => {
    ensureHierarConstraintConfig(series);
    ensureHierarConstraintColor(series);
    const config = series.viz.hierarConstraint;
    const windows = windowsBySeries.get(series.id) || [];
    const overlayId = `hierar-constraint-${series.id}`;
    const seriesIndex = orderIndex.get(series.id);
    const targetAxes =
      plotMode === "parallel" && seriesIndex != null
        ? axisMap.filter((axis) => axis.orderIndex >= seriesIndex)
        : axisMap;
    targetAxes.forEach((axis) => {
      const mapped = mapWindowsToTimestamps(windows, axis.timestamps);
      overlays.shapes.push(...buildHierarConstraintShapesForWindows(mapped, axis.axisX, axis.axisY, config, overlayId));
    });
    overlays.legendItems.push({
      id: overlayId,
      label: t("hierarchyConstraint.legend.downstream", { name: series.name || series.id }),
      color: config.color,
      kind: "overlay",
    });
  });

  if (state.hierarConstraintIntersection.style !== "none" && selectedSeries.length) {
    ensureIntersectionColor();
    const intersectionWindows = computeIntersectionWindows(windowsBySeries, selectedSeries);
    const overlayId = "hierar-constraint-intersection";
    const config = {
      style: state.hierarConstraintIntersection.style,
      color: state.hierarConstraintIntersection.color,
      opacity: state.hierarConstraintIntersection.opacity,
    };
    axisMap.forEach((axis) => {
      const mapped = mapWindowsToTimestamps(intersectionWindows, axis.timestamps);
      overlays.shapes.push(...buildHierarConstraintShapesForWindows(mapped, axis.axisX, axis.axisY, config, overlayId));
    });
    overlays.legendItems.push({
      id: overlayId,
      label: t("hierarchyConstraint.legend.composite"),
      color: config.color,
      kind: "overlay",
    });
  }

  return overlays;
}

function buildGateMasks(seriesList, signalCache) {
  if (!state.hierarConstraintGateEnabled) {
    return null;
  }
  const { selectedIds } = getIntersectionSelection(seriesList);
  if (!selectedIds.size) {
    return null;
  }
  if (!window.HTF || !window.HTF.HierarConstraintCoordinator) {
    return null;
  }
  const coordinator = new window.HTF.HierarConstraintCoordinator();
  if (typeof coordinator.buildGateMasksFromSeries !== "function") {
    return null;
  }
  const filtered = (seriesList || []).map((series) => {
    if (!series || !series.signals || !series.signals.downwardSignalId) {
      return series;
    }
    if (selectedIds.has(series.id)) {
      return series;
    }
    return { ...series, signals: { ...series.signals, downwardSignalId: "" } };
  });
  return coordinator.buildGateMasksFromSeries(filtered, signalCache);
}

function renderPlot() {
  if (!state.series.length) {
    elements.plotEmpty.classList.remove("hidden");
    Plotly.purge(elements.plot);
    renderLegend([], []);
    syncIntersectionControls();
    resetPlotZoomState();
    return;
  }

  const sorted = [...state.series].sort((a, b) => scaleWeight(a) - scaleWeight(b));
  const timeframes = [...sorted].sort((a, b) => scaleWeight(b) - scaleWeight(a));
  const parallelOrder = timeframes;
  const signalCache = new Map();
  const gateMasks = buildGateMasks(timeframes, signalCache);
  const plotOptions = gateMasks ? { gateMasks } : null;
  let result = { traces: [], layout: {} };

  if (state.plotMode === "parallel" && sorted.length > 1) {
    result = plotMultiTfsParallelTimeSeries(parallelOrder, signalCache, plotOptions);
  } else if (state.plotMode === "stitched" && sorted.length > 1) {
    result = plotMultiTfsSingleTimeSerie(timeframes, signalCache, plotOptions);
  } else {
    result = plotMultiTfsOnlyLtfTimeSerie(timeframes, signalCache, plotOptions);
  }

  const overlayOrder = state.plotMode === "parallel" ? parallelOrder : sorted;
  const overlays = buildHierarConstraintOverlays(overlayOrder, signalCache, state.plotMode);
  const layout = {
    margin: { l: 40, r: 20, t: 20, b: 40 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    showlegend: false,
    ...result.layout,
    dragmode: "pan",
  };
  if (overlays.shapes.length) {
    layout.shapes = [...(layout.shapes || []), ...overlays.shapes];
  }
  const traces = result.traces || [];

  elements.plotEmpty.classList.add("hidden");
  const plotPromise = Plotly.newPlot(elements.plot, traces, layout, {
    displayModeBar: false,
    responsive: true,
    scrollZoom: true,
    doubleClick: "reset",
  });
  setupPlotInteractions();
  if (plotPromise && typeof plotPromise.then === "function") {
    plotPromise.then(() => {
      updatePlotRangesFromLayout();
    });
  } else {
    updatePlotRangesFromLayout();
  }
  renderLegend(traces, overlays.legendItems);
  syncIntersectionControls();
}


function renderLegend(traces, overlayItems) {
  const legendItems = traces
    .map((trace, idx) => ({ kind: "trace", trace, idx }))
    .filter(({ trace }) => trace.showlegend !== false);
  const overlays = Array.isArray(overlayItems) ? overlayItems : [];
  overlays.forEach((item) => {
    if (item && item.label) {
      legendItems.push({ kind: "overlay", ...item });
    }
  });

  if (!legendItems.length) {
    elements.legendList.innerHTML = `<div class='legend-empty'>${t("legend.empty")}</div>`;
    return;
  }
  elements.legendList.innerHTML = "";
  legendItems.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    const dot = document.createElement("div");
    dot.className = "legend-dot";
    if (entry.kind === "trace") {
      dot.style.background = entry.trace.marker?.color || entry.trace.line?.color || "#999";
    } else {
      dot.style.background = entry.color || "#999";
    }
    const label = document.createElement("div");
    label.textContent =
      entry.kind === "trace"
        ? entry.trace.name || t("legend.traceFallback", { index: entry.idx + 1 })
        : entry.label || t("legend.overlayFallback");
    item.appendChild(dot);
    item.appendChild(label);
    if (entry.kind === "trace") {
      item.addEventListener("click", () => toggleTrace(entry.idx, item));
    } else {
      item.addEventListener("click", () => toggleOverlay(entry.id, item));
    }
    elements.legendList.appendChild(item);
  });
}

function toggleTrace(idx, item) {
  const current = elements.plot.data[idx].visible;
  const next = current === "legendonly" ? true : "legendonly";
  Plotly.restyle(elements.plot, { visible: next }, [idx]);
  item.classList.toggle("is-muted", next === "legendonly");
}

function toggleOverlay(overlayId, item) {
  if (!overlayId || !elements.plot.layout || !elements.plot.layout.shapes) {
    item.classList.toggle("is-muted");
    return;
  }
  const nextHidden = !item.classList.contains("is-muted");
  const nextVisible = !nextHidden;
  const shapes = elements.plot.layout.shapes.map((shape) => {
    if (shape.name === overlayId) {
      return { ...shape, visible: nextVisible };
    }
    return shape;
  });
  Plotly.relayout(elements.plot, { shapes });
  item.classList.toggle("is-muted", nextHidden);
}

function updatePlotModeOptions() {
  if (state.series.length <= 1) {
    elements.plotMode.value = "ltf";
    elements.plotMode.disabled = true;
    state.plotMode = "ltf";
  } else {
    elements.plotMode.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHTFLibrary()
    .then(() => {
      if (window.HTF && window.HTF.signalGraph && typeof window.HTF.signalGraph.setSignalDefs === "function") {
        window.HTF.signalGraph.setSignalDefs(SIGNAL_DEF_MAP);
      }
      if (window.HTF && window.HTF.viz && typeof window.HTF.viz.setColorPalette === "function") {
        window.HTF.viz.setColorPalette(COLOR_PALETTE);
      }
      init();
    })
    .catch((err) => {
      console.error(err);
      init();
    });
});

window.addEventListener("i18n:changed", () => {
  refreshI18nUi();
});
