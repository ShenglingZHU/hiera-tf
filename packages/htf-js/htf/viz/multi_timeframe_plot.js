// SPDX-License-Identifier: Apache-2.0
// Copyright 2025-2026 ZHU Shengling
((global) => {
  "use strict";

  const HTF = global.HTF || (global.HTF = {});
  const viz = HTF.viz || (HTF.viz = {});
  const signalGraph = HTF.signalGraph || {};
  const utils = HTF.utils;

  if (!utils || typeof utils.normalizeFlagSeries !== "function" || typeof utils.truthyWindows !== "function") {
    throw new Error("HTF.utils with normalizeFlagSeries/truthyWindows is required");
  }
  const { normalizeFlagSeries, truthyWindows } = utils;

  let colorPalette = ["#000000"];

  const getFallbackColor = () => (colorPalette.length ? colorPalette[0] : "#000000");

  const setColorPalette = (palette) => {
    if (Array.isArray(palette) && palette.length) {
      colorPalette = palette.slice();
    }
  };

  const resolveGateMask = (gateMasks, seriesId) => {
    if (!gateMasks || !seriesId) {
      return null;
    }
    if (gateMasks instanceof Map) {
      return gateMasks.get(seriesId) || null;
    }
    return gateMasks[seriesId] || null;
  };

  const maskToSegments = (mask, xs, ys) => {
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
  };

  const getLineElement = (series) => (series && series.viz ? series.viz.elements.find((el) => el.type === "line") : null);

  const getRawElement = (series) => (series && series.viz ? series.viz.elements.find((el) => el.type === "raw") : null);

  const getSignalElements = (series) =>
    series && series.viz ? series.viz.elements.filter((el) => el.type === "signal" && el.signalId) : [];

  const findBaseSignalId = (series) => {
    const elements = getSignalElements(series);
    return elements.length ? elements[0].signalId : "";
  };

  const buildLineStyle = (element) => {
    if (!element) {
      return null;
    }
    return {
      color: element.color,
      width: element.lineWidth,
      dash: element.lineStyle === "solid" ? "solid" : element.lineStyle === "dashed" ? "dash" : "dot",
    };
  };

  const buildMarkerStyle = (element, fallbackColor) => {
    if (!element) {
      return { color: fallbackColor, size: 6, symbol: "circle" };
    }
    return {
      color: element.color || fallbackColor,
      size: element.size,
      symbol: element.marker,
    };
  };

  const buildSignalTracesForSeries = (series, axisX, axisY, options) => {
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
  };

  const buildSeriesTraces = (series, axisX, axisY, options) => {
    if (!series.data || !series.data.length) {
      return [];
    }
    const traces = [];
    const hasSignalElements = series.viz.elements.some((element) => element.type === "signal" && element.signalId);
    const signalOutputs = hasSignalElements
      ? signalGraph.getSeriesSignalOutputs
        ? signalGraph.getSeriesSignalOutputs(series, options ? options.signalCache : null)
        : signalGraph.computeSignalOutputs
        ? signalGraph.computeSignalOutputs(series)
        : new Map()
      : new Map();
    const baseSignalId = findBaseSignalId(series);
    const gateMask = resolveGateMask(options ? options.gateMasks : null, series.id || series.name);
    series.viz.elements.forEach((element) => {
      if (element.type === "line") {
        traces.push({
          x: series.data.map((d) => d.ts),
          y: series.data.map((d) => d.value),
          type: "scatter",
          mode: "lines",
          name: `${series.name} · line`,
          line: {
            color: element.color,
            width: element.lineWidth,
            dash:
              element.lineStyle === "solid"
                ? "solid"
                : element.lineStyle === "dashed"
                ? "dash"
                : "dot",
          },
          xaxis: axisX,
          yaxis: axisY,
        });
      }
      if (element.type === "raw") {
        traces.push({
          x: series.data.map((d) => d.ts),
          y: series.data.map((d) => d.value),
          type: "scatter",
          mode: "markers",
          name: `${series.name} · raw`,
          marker: { color: element.color, size: element.size, symbol: element.marker },
          xaxis: axisX,
          yaxis: axisY,
        });
      }
      if (element.type === "signal") {
        const output = signalOutputs.get(element.signalId) || [];
        const applyGate = gateMask && element.signalId === baseSignalId;
        const xs = [];
        const ys = [];
        output.forEach((flag, idx) => {
          if (!flag) {
            return;
          }
          if (applyGate && !gateMask[idx]) {
            return;
          }
          const point = series.data[idx];
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
        });
      }
    });
    return traces;
  };

  const buildTimeframeSeries = (seriesList, signalCache) => {
    if (!seriesList.length) {
      return { tfSeries: [], ltfSeries: null, htfSeries: [], baseSignalId: "" };
    }
    const tfSeries = seriesList.map((series, idx) => {
      const data = series.data || [];
      const timestamps = data.map((point) => point.ts);
      const values = data.map((point) => point.value);
      const outputs = signalGraph.getSeriesSignalOutputs
        ? signalGraph.getSeriesSignalOutputs(series, signalCache)
        : new Map();
      const len = timestamps.length;
      let scaleSignal = new Array(len).fill(true);
      let baseSignal = new Array(len).fill(false);
      if (idx < seriesList.length - 1) {
        const scaleId = series.signals ? series.signals.downwardSignalId : "";
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
  };

  const plotMultiTfsParallelTimeSeries = (seriesList, signalCache, options) => {
    let traces = [];
    const layout = {
      grid: { rows: seriesList.length, columns: 1, pattern: "independent" },
    };
    const opts = options || {};
    seriesList.forEach((series, idx) => {
      const axisIndex = idx + 1;
      const axisX = axisIndex === 1 ? "x" : `x${axisIndex}`;
      const axisY = axisIndex === 1 ? "y" : `y${axisIndex}`;
      traces = traces.concat(buildSeriesTraces(series, axisX, axisY, { ...opts, signalCache }));
      layout[`xaxis${axisIndex}`] = { matches: "x", showticklabels: idx === seriesList.length - 1 };
      layout[`yaxis${axisIndex}`] = { title: series.name };
    });
    return { traces, layout };
  };

  const plotMultiTfsSingleTimeSerie = (seriesList, signalCache, options) => {
    const { ltfSeries, htfSeries, baseSignalId } = buildTimeframeSeries(seriesList, signalCache);
    if (!ltfSeries || !ltfSeries.timestamps.length) {
      return { traces: [], layout: {} };
    }
    const ltf = ltfSeries.seriesRef;
    const ltfLine = getLineElement(ltf);
    const ltfRaw = getRawElement(ltf);
    const ltfLineStyle = buildLineStyle(ltfLine);
    const ltfRawStyle = buildMarkerStyle(ltfRaw, ltfLineStyle ? ltfLineStyle.color : getFallbackColor());
    const htfPrimary = htfSeries[0] || null;
    const htfLine = htfPrimary ? getLineElement(htfPrimary.seriesRef) : null;
    const htfRaw = htfPrimary ? getRawElement(htfPrimary.seriesRef) : null;
    const htfLineStyle = buildLineStyle(htfLine);
    const htfRawStyle = buildMarkerStyle(htfRaw, htfLineStyle ? htfLineStyle.color : ltfRawStyle.color);
    const traces = [];
    const shapes = [];

    const htfWindows = {};
    htfSeries.forEach((series) => {
      htfWindows[series.name] = truthyWindows(series.scaleSignal, series.timestamps);
    });

    const allActiveMask = ltfSeries.timestamps.map((ts) => {
      if (!htfSeries.length) {
        return true;
      }
      for (const series of htfSeries) {
        if (!series.timestamps.length) {
          continue;
        }
        const windows = htfWindows[series.name] || [];
        if (!windows.length || !windows.some(([start, end]) => ts >= start && ts <= end)) {
          return false;
        }
      }
      return true;
    });

    if (ltf.viz.htfWindow) {
      const activeWindows = truthyWindows(allActiveMask, ltfSeries.timestamps);
      activeWindows.forEach(([start, end]) => {
        shapes.push({
          type: "rect",
          xref: "x",
          yref: "paper",
          x0: start,
          x1: end,
          y0: 0,
          y1: 1,
          fillcolor: "#e6f2ff",
          opacity: 0.3,
          line: { width: 0 },
        });
      });
    }

    if (htfPrimary && (htfLineStyle || htfRaw) && htfPrimary.timestamps.length) {
      const inactiveMask = htfPrimary.scaleSignal.map((flag) => !flag);
      const segments = maskToSegments(inactiveMask, htfPrimary.timestamps, htfPrimary.values);
      segments.forEach(([xs, ys], idx) => {
        if (!xs.length) {
          return;
        }
        const showlegend = idx === 0;
        if (htfLineStyle) {
          traces.push({
            x: xs,
            y: ys,
            type: "scatter",
            mode: "lines",
            name: `${htfPrimary.name} · line`,
            line: htfLineStyle,
            xaxis: "x",
            yaxis: "y",
            showlegend,
          });
        }
        if (htfRaw && xs.length) {
          traces.push({
            x: xs,
            y: ys,
            type: "scatter",
            mode: "markers",
            name: `${htfPrimary.name} · raw`,
            marker: htfRawStyle,
            xaxis: "x",
            yaxis: "y",
            showlegend,
          });
        }
      });
    }

    if ((ltfLineStyle || ltfRaw) && ltfSeries.timestamps.length) {
      const segments = maskToSegments(allActiveMask, ltfSeries.timestamps, ltfSeries.values);
      segments.forEach(([xs, ys], idx) => {
        if (!xs.length) {
          return;
        }
        const showlegend = idx === 0;
        if (ltfLineStyle) {
          traces.push({
            x: xs,
            y: ys,
            type: "scatter",
            mode: "lines",
            name: `${ltfSeries.name} · line`,
            line: ltfLineStyle,
            xaxis: "x",
            yaxis: "y",
            showlegend,
          });
        }
        if (ltfRaw && xs.length) {
          traces.push({
            x: xs,
            y: ys,
            type: "scatter",
            mode: "markers",
            name: `${ltfSeries.name} · raw`,
            marker: ltfRawStyle,
            xaxis: "x",
            yaxis: "y",
            showlegend,
          });
        }
      });
    }

    const outputs = signalGraph.getSeriesSignalOutputs
      ? signalGraph.getSeriesSignalOutputs(ltf, signalCache)
      : new Map();
    const excludedSignals = new Set();
    if (baseSignalId) {
      excludedSignals.add(baseSignalId);
    }
    traces.push(...buildSignalTracesForSeries(ltf, "x", "y", { outputs, excludeIds: excludedSignals, showlegend: true }));

    if (baseSignalId) {
      const gateMask = resolveGateMask(options ? options.gateMasks : null, ltfSeries.id || ltfSeries.name);
      const gateEnabled = Array.isArray(gateMask) && gateMask.length === ltfSeries.timestamps.length;
      const baseFlags = normalizeFlagSeries(outputs.get(baseSignalId), ltfSeries.timestamps.length, false);
      const baseElement = getSignalElements(ltf).find((el) => el.signalId === baseSignalId) || null;
      const baseMarker = buildMarkerStyle(baseElement, ltfLineStyle ? ltfLineStyle.color : ltfRawStyle.color);
      const insideX = [];
      const insideY = [];
      const outsideX = [];
      const outsideY = [];
      baseFlags.forEach((flag, idx) => {
        if (!flag) {
          return;
        }
        const ts = ltfSeries.timestamps[idx];
        const val = ltfSeries.values[idx];
        if (gateEnabled ? gateMask[idx] : allActiveMask[idx]) {
          insideX.push(ts);
          insideY.push(val);
        } else if (!gateEnabled) {
          outsideX.push(ts);
          outsideY.push(val);
        }
      });
      if (insideX.length) {
        traces.push({
          x: insideX,
          y: insideY,
          type: "scatter",
          mode: "markers",
          name: `${ltfSeries.name} · ${baseElement ? baseElement.label : "base"} · HTF active`,
          marker: { ...baseMarker },
          xaxis: "x",
          yaxis: "y",
          showlegend: true,
        });
      }
      if (outsideX.length) {
        traces.push({
          x: outsideX,
          y: outsideY,
          type: "scatter",
          mode: "markers",
          name: `${ltfSeries.name} · ${baseElement ? baseElement.label : "base"}`,
          marker: { ...baseMarker },
          xaxis: "x",
          yaxis: "y",
          showlegend: false,
        });
      }
    }

    return { traces, layout: { shapes } };
  };

  const plotMultiTfsOnlyLtfTimeSerie = (seriesList, signalCache, options) => {
    const { ltfSeries, htfSeries, baseSignalId } = buildTimeframeSeries(seriesList, signalCache);
    if (!ltfSeries || !ltfSeries.timestamps.length) {
      return { traces: [], layout: {} };
    }
    const ltf = ltfSeries.seriesRef;
    const ltfLine = getLineElement(ltf);
    const ltfRaw = getRawElement(ltf);
    const ltfLineStyle = buildLineStyle(ltfLine);
    const ltfRawStyle = buildMarkerStyle(ltfRaw, ltfLineStyle ? ltfLineStyle.color : getFallbackColor());
    const traces = [];
    const shapes = [];

    if (ltfLineStyle) {
      traces.push({
        x: ltfSeries.timestamps,
        y: ltfSeries.values,
        type: "scatter",
        mode: "lines",
        name: `${ltfSeries.name} · line`,
        line: ltfLineStyle,
        xaxis: "x",
        yaxis: "y",
        showlegend: true,
      });
    }
    if (ltfRaw) {
      traces.push({
        x: ltfSeries.timestamps,
        y: ltfSeries.values,
        type: "scatter",
        mode: "markers",
        name: `${ltfSeries.name} · raw`,
        marker: ltfRawStyle,
        xaxis: "x",
        yaxis: "y",
        showlegend: true,
      });
    }

    const htfWindows = {};
    htfSeries.forEach((series) => {
      htfWindows[series.name] = truthyWindows(series.scaleSignal, series.timestamps);
    });

    if (ltf.viz.htfWindow) {
      htfSeries.forEach((series) => {
        const htfLine = getLineElement(series.seriesRef);
        const color = htfLine ? htfLine.color : getFallbackColor();
        const windows = htfWindows[series.name] || [];
        windows.forEach(([start, end]) => {
          shapes.push({
            type: "rect",
            xref: "x",
            yref: "paper",
            x0: start,
            x1: end,
            y0: 0,
            y1: 1,
            fillcolor: color,
            opacity: 0.08,
            line: { width: 0 },
          });
        });
      });
    }

    const allActiveMask = ltfSeries.timestamps.map((ts) => {
      if (!htfSeries.length) {
        return true;
      }
      for (const series of htfSeries) {
        if (!series.timestamps.length) {
          continue;
        }
        const windows = htfWindows[series.name] || [];
        if (!windows.length || !windows.some(([start, end]) => ts >= start && ts <= end)) {
          return false;
        }
      }
      return true;
    });

    const outputs = signalGraph.getSeriesSignalOutputs
      ? signalGraph.getSeriesSignalOutputs(ltf, signalCache)
      : new Map();
    const excludedSignals = new Set();
    if (baseSignalId) {
      excludedSignals.add(baseSignalId);
    }
    traces.push(...buildSignalTracesForSeries(ltf, "x", "y", { outputs, excludeIds: excludedSignals, showlegend: true }));

    if (baseSignalId) {
      const gateMask = resolveGateMask(options ? options.gateMasks : null, ltfSeries.id || ltfSeries.name);
      const gateEnabled = Array.isArray(gateMask) && gateMask.length === ltfSeries.timestamps.length;
      const baseFlags = normalizeFlagSeries(outputs.get(baseSignalId), ltfSeries.timestamps.length, false);
      const baseElement = getSignalElements(ltf).find((el) => el.signalId === baseSignalId) || null;
      const baseMarker = buildMarkerStyle(baseElement, ltfLineStyle ? ltfLineStyle.color : ltfRawStyle.color);
      const insideX = [];
      const insideY = [];
      const outsideX = [];
      const outsideY = [];
      baseFlags.forEach((flag, idx) => {
        if (!flag) {
          return;
        }
        const ts = ltfSeries.timestamps[idx];
        const val = ltfSeries.values[idx];
        if (gateEnabled ? gateMask[idx] : allActiveMask[idx]) {
          insideX.push(ts);
          insideY.push(val);
        } else if (!gateEnabled) {
          outsideX.push(ts);
          outsideY.push(val);
        }
      });
      if (insideX.length) {
        traces.push({
          x: insideX,
          y: insideY,
          type: "scatter",
          mode: "markers",
          name: `${ltfSeries.name} · ${baseElement ? baseElement.label : "base"} · HTF active`,
          marker: { ...baseMarker },
          xaxis: "x",
          yaxis: "y",
          showlegend: true,
        });
      }
      if (outsideX.length) {
        traces.push({
          x: outsideX,
          y: outsideY,
          type: "scatter",
          mode: "markers",
          name: `${ltfSeries.name} · ${baseElement ? baseElement.label : "base"}`,
          marker: { ...baseMarker },
          xaxis: "x",
          yaxis: "y",
          showlegend: true,
        });
      }
    }

    return { traces, layout: { shapes } };
  };

  viz.setColorPalette = setColorPalette;
  viz.normalizeFlagSeries = normalizeFlagSeries;
  viz.truthyWindows = truthyWindows;
  viz.maskToSegments = maskToSegments;
  viz.getLineElement = getLineElement;
  viz.getRawElement = getRawElement;
  viz.getSignalElements = getSignalElements;
  viz.findBaseSignalId = findBaseSignalId;
  viz.buildLineStyle = buildLineStyle;
  viz.buildMarkerStyle = buildMarkerStyle;
  viz.buildSignalTracesForSeries = buildSignalTracesForSeries;
  viz.buildSeriesTraces = buildSeriesTraces;
  viz.buildTimeframeSeries = buildTimeframeSeries;
  viz.plotMultiTfsParallelTimeSeries = plotMultiTfsParallelTimeSeries;
  viz.plotMultiTfsSingleTimeSerie = plotMultiTfsSingleTimeSerie;
  viz.plotMultiTfsOnlyLtfTimeSerie = plotMultiTfsOnlyLtfTimeSerie;
})(typeof window !== "undefined" ? window : globalThis);
