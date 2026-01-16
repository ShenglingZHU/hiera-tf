# Hiera-TF

Languages:

- [English README](README.en.md) (current)
- [README en français](README.fr.md)
- [中文 README](README.zh-CN.md)

## 1. Project Overview

### 1.1 Introduction

Hiera-TF is a hierarchical, multi-timeframe signal construction and visualization framework. It folds higher-timeframe (HTF) signals into "allowed windows" on the lowest timeframe (LTF) to gate downstream behavior, and provides multi-view visualization and export support for review and reproducibility.

### 1.2 Use Cases

- Scenarios that require analyzing both fine-grained and coarse-grained time series while letting higher-timeframe signals constrain lower-level actions.
- Building hierarchical/composite signals and observing the interval effects of signals over time.
- Quickly validating signal definitions, thresholds and hierarchical relationships via visualization.

Examples:

- Multi-timeframe trade filtering and signal explanation
- Anomaly segmentation and attribution for operations/sensor metrics
- Event alignment and conditional filtering in experimental data
- Cross-scale rule validation and reproducible outputs for research

## 2. Quick Start

### 2.1 Local Static UI

- Open `apps/ui-static/index.html` directly (no build required).
- Or run a static server from the repository root (recommended; easier to load `packages/htf-js`):

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/apps/ui-static/index.html`.

- Network/dependency note: the UI loads Plotly, XLSX and Google Fonts from CDNs. Offline, plotting and Excel import/export may be limited (CSV still works).

### 2.2 Using Python (install, minimal demos)

- Runtime: Python 3.9+.
- Minimal runnable demos (after installation, recommended):

```powershell
python -m pip install -e packages/htf-py
python -m htf.demos.demo_py_1
python -m htf.demos.demo_py_2
python -m htf.demos.demo_py_3
```

- Backwards-compatible run without install:

```powershell
python packages/htf-py/demos/demo-py-1.py
python packages/htf-py/demos/demo-py-2.py
python packages/htf-py/demos/demo-py-3.py
```

- Using the source directly: add `packages/htf-py` to `PYTHONPATH`, or use the provided demo wrappers (they adjust `sys.path` temporarily).

### 2.3 Troubleshooting

- Browser file/security restrictions: if opening via `file://` is restricted, use a local static server.
- UI not loading or scripts 404: ensure the static server is started from the repository root, or adjust `data-htf-base` to point to `packages/htf-js/htf`.
- XLSX/Plotly unavailable: check network/CDN availability or use CSV instead.
- `pandas` / `bokeh` missing errors: these are optional dependencies used only for certain export/visualization features.

## 3. Background & Motivation

### 3.1 Problems to Solve & Limitations of Existing Tools

- Signal logic is often scattered and hard to reuse: multi-timeframe logic frequently lives in ad-hoc if/else scripts, making unified definition, auditing and version comparison difficult.
- Multi-timeframe visualization is common, but layering does not equal hierarchical gating: platforms often show overlays but do not structure higher-level conditions as "allowed windows" for lower levels.
- Lacks an end-to-end flow: implementing cross-scale gating + signal composition + visualization + export typically requires a lot of glue code.

### 3.2 How Hiera-TF Differs

- Treats hierarchical constraints as a first-class concept rather than ad-hoc gating.
- Makes "hierarchical gating masks" configurable, composable and exportable, and links them with a signal dependency graph (DAG).
- Dual implementations in Python and JS plus a UI form a closed loop for definition, validation and visualization.

## 4. Core Concepts

### Guiding Principle: Signal-Centric

Hiera-TF treats "signals (events/conditions)" as the primary analysis unit in time series workflows:

- Convert numeric series into interpretable semantics: triggers/non-triggers and interval-valid/invalid masks.
- Closer to decision-making: when to pay attention/act and why a trigger fired.

### 4.1 Timeframe / LTF / HTF

- Timeframe: a timescale view that maintains a rolling window and signal state.
- LTF: the lowest (finest) timeframe.
- HTF: coarser timeframes relative to LTF; there can be multiple HTF levels.

### 4.2 Feature

- A feature dictionary computed from windowed data, produced by a `FeatureModule` or a `feature_fn`.
- Signal functions depend only on `features` to keep modules decoupled.

### 4.3 Signal

Signals typically return 0/1 and are stateful computation units. Examples:

- `ValueVsRollingPercentile`: compares the current value to a historical percentile and triggers when condition is met.
- `SignalRunLengthReached`: triggers after a base signal runs for `min_run_length`, can extend the tail.
- `SignalRunInterrupted`: triggers when a base signal that has been running is interrupted, can extend the tail.
- `SignalIntervalBetweenMarkers`: outputs 1 continuously between a start marker and an end marker; this is an interval signal rather than discrete independent events.

### 4.4 Coordinator (multi-timeframe coordination)

- `SimpleHTFCoordinator`: only allows LTF when all HTF signals are true.
- `HierarConstraintCoordinator`: gates level-by-level in order, better suited for multi-layer hierarchies.

### 4.5 Hierarchy Constraint (composite constraints)

- Use higher-level signals to limit the effective intervals of lower-level signals, preventing cross-scale noise amplification.
- Downstream constraint signals can be selected in the UI and overlaid for visualization.

## 5. Features

### 5.1 Composability

- Data/scale/signal/gating are freely composable: the same data can be used to create multiple timeframes, signals across scales can be combined, and gating masks can be reused.
- Compositions are explicit: dependencies and combinations are not hidden in ephemeral scripts, making tracing and exporting easier.

### 5.2 Signal Graph (DAG) / Signal Tree

- Signals can be organized as a dependency graph: the output of one signal can feed another, forming configurable rule chains.
- Explicit composition operators (e.g., intersection) make multi-condition composition easier to review and store as templates.

### 5.3 Hierarchical Constraints & Gating

- Core feature: fold HTF constraint signals into allowed-window masks for LTF, gating lower-level signals and events.
- Composite gating: constraints from multiple levels can be combined (e.g., intersection/AND), and constraints themselves become reusable assets.

### 5.4 Three Visualization Modes

- LTF only: overlay higher-level allowed windows on the lower series to show allowed/excluded intervals.
- Parallel series: juxtapose multiple series to observe synchronization and differences across scales.
- Stitched series: compressed view that highlights what gating has changed at a glance.

### 5.5 Export & Auditability

- Exportable items: final signals, hierarchical masks, signal dependency chains, and key intermediates (thresholds, run-lengths, EMA, etc.).
- Emphasizes explainability and auditability to facilitate review and reproduction.

### 5.6 External Signal Injection

- Supports introducing external labels/events/expert knowledge as signal nodes, combining them with internal computed signals and participating in gating.
- Allows hard-to-formalize expert rules to enter an auditable analysis pipeline.

### 5.7 Extensibility

- Signal types and complex templates can be extended (add implementations and register them).
- Supports multiple time series and multi-scale structures; scaling limits depend on data size and performance rather than architecture.

### 5.8 Design Choices & Boundaries

- The core library does not perform automatic resampling or data cleaning; upstream must provide aligned data.
- The strength of the project is dependency chains + composition + gating, not arbitrary cross-series numeric solvers.

**Not a goal**: Hiera-TF focuses on "event/rule signals + hierarchical gating + composable config + explainable export", and is not intended to be:

- A general time-frequency decomposition platform (wavelets/EMD, etc.)
- A predictive/machine-learning modeling platform
- A full trading execution/backtest system

## 6. Repository Layout

- `apps/ui-static`: local static UI demo and visualization (Plotly + XLSX via CDN).
- `apps/templates`: example signal templates directory for UI (optional, templates are stored in browser local storage).
- `packages/htf-py`: Python core library and demos, includes optional Bokeh visualization.
- `packages/htf-js`: JS implementation intended as a UI dependency and aligned with the Python implementation, includes demos.
- `LICENSE` / `NOTICE` / `THIRD_PARTY_NOTICES`: licensing and third-party notices.

## 7. Usage Guide

### 7.1 For UI Users (demo): import data, configure timeframes, inspect hierarchy/signals

- Open the UI, click Add to import CSV/XLSX and map time and value columns.
- Set timeframes (e.g., 5m/15m) and aggregation methods.
- Configure signals and dependencies in Signals, select downstream constraint signals, and save/load custom templates from browser local storage (templates in `apps/templates` can also be imported).
- Configure drawing options in Viz.

**Detailed tutorial**: see the [UI static page usage guide](../apps/README.md#english-version) for full interface layout, workflows and signal configuration instructions.

### 7.2 For Developers (Python)

#### 7.2.1 Minimal example: build a timeframe and a basic signal

```python
from htf import TimeframeConfig, TimeframeView, ValueVsRollingPercentile

signal = ValueVsRollingPercentile(value_key="TEMP", window_size=12, percentile=80, comparison="lt")
tf = TimeframeView(
    config=TimeframeConfig(name="1h", window_size=6, max_buffer=200, role="LTF"),
    signal_fn=lambda feats: signal(feats),
)

for record in records:  # record should include a timestamp and TEMP
    tf.on_new_record(record)

print(tf.signal, tf.features)
```

#### 7.2.2 Custom signal/feature modules

- Subclass `FeatureModule` and implement `compute(window)`.
- Or implement a stateful `__call__(features)` class and use it as `signal_fn`.

#### 7.2.3 Applying hierarchical constraints and coordination strategies

- Use `HierarConstraintCoordinator(order=[...])` to gate by level.
- See `packages/htf-py/demos/demo-py-3.py` for reference.

#### 7.2.4 Output & visualization (optional deps)

- `export_buffer_as_dataframe` / `export_signal_dataframe` require `pandas`.
- `htf.viz.multi_timeframe_plot` requires `bokeh`.

**Detailed tutorial**: see the [htf-py guide](../packages/htf-py/README.md#english-version) for full installation, structure, demos and usage examples.

### 7.3 For Developers (JavaScript)

The JavaScript implementation primarily serves the static UI and aims for feature parity with the Python implementation.

#### 7.3.1 Minimal example: build a timeframe and a basic signal

```javascript
const HTF = require("./index.js");

// Create timeframe config
const config = new HTF.TimeframeConfig({
  name: "5m-series",
  window_size: 6,
  max_buffer: 128,
  role: "LTF",
});

// Create timeframe view
const timeframe = new HTF.TimeframeView({ config });

// Push records
for (const record of records) {
  timeframe.on_new_record(record);
}

console.log("features:", timeframe.features);
console.log("signal:", timeframe.signal);
```

#### 7.3.2 Run demos

```bash
node packages/htf-js/demos/demo-js-1.js
node packages/htf-js/demos/demo-js-2.js
node packages/htf-js/demos/demo-js-3.js
```

#### 7.3.3 Integrate with the static UI

The static UI (`apps/ui-static`) loads `htf-js` as an ES module. When serving from the repo root:

```bash
python -m http.server 8000
# Open http://localhost:8000/apps/ui-static/index.html
```

**Detailed tutorial**: see the [htf-js guide](../packages/htf-js/README.md#english-version) for project layout, demos and UI integration details.

## 8. Roadmap / Status

### 8.1 Stability & Known Limitations

- The project is under active development; APIs and signal definitions may change.
- No PyPI / npm package published yet; recommended to use the source and demos directly.
- UI depends on CDN resources (Plotly/XLSX/Fonts); offline usage requires replacing those assets.
- Core library does not perform resampling or data cleaning; upstream must provide aligned data.

### 8.2 Future plans

- Expand the set of signal classes and refine complex signal designs based on community feedback.
- Build timeline-related Python applications (e.g., signal-driven trading tools).

### 8.3 Feedback & Contribution

Feedback is welcome in these areas:

- **Interaction flow**: import → organize multi-scale series → define/combine signals → configure gating → switch views → export — is this flow smooth, where are the friction points or extra clicks?
- **Bugs in the UI**: layout problems, scaling, rendering delays, browser differences — include screenshots/recordings and reproduction steps where possible.
- **Signal definitions**: share signal ideas (trading/ops/sensor/research) or designs for complex signals (multi-condition + run-length + gating + external events + multi-scale composition) to be turned into templates.

## 9. License & Disclaimer

### 9.1 License

- Apache License 2.0 — see `LICENSE` and `NOTICE`.

### 9.2 Third-party notices

- See `THIRD_PARTY_NOTICES`; the UI also uses Plotly, XLSX and Google Fonts via CDN.

### 9.3 Disclaimer

- The project's signals and visualizations are for research and educational purposes only and do not constitute investment or trading advice.
