# SPDX-License-Identifier: Apache-2.0
# Copyright 2025-2026 ZHU Shengling
from __future__ import annotations

from bisect import bisect_right
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from bokeh.layouts import Spacer, column, row
from bokeh.models import BoxAnnotation, ColumnDataSource, LayoutDOM
from bokeh.palettes import Category10
from bokeh.plotting import figure


@dataclass
class _TimeframeSeries:
    name: str
    timestamps: list[Any]
    values: list[Any]
    scale_signal: list[bool]
    base_signal: list[bool]


def _bokeh_is_datetime_like(x: Sequence[Any]) -> bool:
    if not x:
        return False
    x0 = x[0]
    try:
        import datetime as _dt

        if isinstance(x0, (_dt.datetime, _dt.date)):
            return True
    except Exception:
        pass

    try:
        import numpy as _np

        if isinstance(x0, _np.datetime64):
            return True
    except Exception:
        pass

    return bool(hasattr(x0, "to_pydatetime"))


def _figsize_to_pixels(figsize: tuple[int, int]) -> tuple[int, int]:
    # keep predictable sizing; 1 inch ~ 100 px
    return max(300, int(figsize[0] * 100)), max(220, int(figsize[1] * 90))


def _resolve_key(mapping_or_str: Mapping[Any, str] | str | None, tf: Any) -> str | None:
    """
    Resolve a key for the given timeframe from either a mapping or a plain string.
    """
    if mapping_or_str is None:
        return None
    if isinstance(mapping_or_str, Mapping):
        name = getattr(tf, "name", tf)
        if name in mapping_or_str:
            return mapping_or_str[name]
        if tf in mapping_or_str:
            return mapping_or_str[tf]
        return None
    return str(mapping_or_str)


def _extract_timeframe_series(
    tf: Any,
    value_key: str,
    x_key: str,
    scale_key: str | None,
    base_key: str | None,
) -> _TimeframeSeries:
    """
    Pull timestamps, values and optional signals out of a TimeframeView buffer.
    Missing signal keys default to False so downstream code can rely on list length.
    """
    timestamps: list[Any] = []
    values: list[Any] = []
    scale_flags: list[bool] = []
    base_flags: list[bool] = []

    for rec in getattr(tf, "buffer", []):
        if x_key not in rec or value_key not in rec:
            continue
        timestamps.append(rec[x_key])
        values.append(rec[value_key])

        scale_flags.append(bool(rec.get(scale_key, 0)) if scale_key else False)
        base_flags.append(bool(rec.get(base_key, 0)) if base_key else False)

    # keep lengths aligned with timestamps
    while len(scale_flags) < len(timestamps):
        scale_flags.append(False)
    while len(base_flags) < len(timestamps):
        base_flags.append(False)

    name = getattr(tf, "name", str(tf))
    return _TimeframeSeries(
        name=name,
        timestamps=timestamps,
        values=values,
        scale_signal=scale_flags,
        base_signal=base_flags,
    )


def _truthy_windows(flags: Sequence[bool], xs: Sequence[Any]) -> list[tuple[Any, Any]]:
    """
    Collapse consecutive True values into (start, end) windows.
    """
    windows: list[tuple[Any, Any]] = []
    start = None
    for idx, flag in enumerate(flags):
        if bool(flag):
            if start is None:
                start = xs[idx]
        else:
            if start is not None:
                end_val = xs[idx - 1] if idx > 0 else start
                windows.append((start, end_val))
                start = None
    if start is not None and xs:
        windows.append((start, xs[-1]))
    return windows


def _latest_bool_before(ts_list: Sequence[Any], flags: Sequence[bool], ts: Any) -> bool:
    """
    Return the most recent flag whose timestamp <= ts.
    """
    if not ts_list:
        return False
    pos = bisect_right(ts_list, ts) - 1
    if pos < 0 or pos >= len(flags):
        return False
    return bool(flags[pos])


def _latest_value_before(ts_list: Sequence[Any], vals: Sequence[Any], ts: Any) -> Any | None:
    """
    Return the most recent value whose timestamp <= ts.
    """
    if not ts_list:
        return None
    pos = bisect_right(ts_list, ts) - 1
    if pos < 0 or pos >= len(vals):
        return None
    return vals[pos]


def _build_tf_series(
    timeframes: Sequence[Any],
    scale_change_signal_map: Mapping[Any, str],
    base_signal_ltf: str | Mapping[Any, str],
    value_key_map: Mapping[Any, str] | None,
    x_key: str,
    y_key: str,
) -> tuple[list[_TimeframeSeries], _TimeframeSeries, list[_TimeframeSeries]]:
    if not timeframes:
        raise ValueError("timeframes must contain at least one timeframe")

    tf_series: list[_TimeframeSeries] = []
    n_tfs = len(timeframes)

    for idx, tf in enumerate(timeframes):
        value_key = _resolve_key(value_key_map, tf) or y_key
        scale_key = None
        base_key: str | None = None

        if idx < n_tfs - 1:
            scale_key = _resolve_key(scale_change_signal_map, tf)
            if scale_key is None:
                raise ValueError(f"Missing scale-change signal key for timeframe {getattr(tf, 'name', tf)}")
        else:
            base_key = (
                _resolve_key(base_signal_ltf, tf) if isinstance(base_signal_ltf, Mapping) else str(base_signal_ltf)
            )
            if not base_key:
                raise ValueError("base_signal_ltf must resolve to a key for the lowest timeframe")

        tf_series.append(_extract_timeframe_series(tf, value_key, x_key, scale_key, base_key))

    ltf_series = tf_series[-1]
    htf_series = tf_series[:-1]
    return tf_series, ltf_series, htf_series


def _make_color_cycle(n: int, colors: Sequence[str] | None = None) -> list[str]:
    if colors:
        cycle = list(colors)
    else:
        palette = Category10[10]
        cycle = [palette[i % len(palette)] for i in range(n or 1)]
    if len(cycle) < n:
        repeats = (n // len(cycle)) + 1
        cycle = (cycle * repeats)[:n]
    return cycle


def _build_stitched_path(tf_series: list[_TimeframeSeries]) -> dict[str, Any]:
    """
    Build a stitched, single-path representation by walking LTF timestamps and
    falling back to HTF values when HTF is not allowing LTF.
    """
    if not tf_series:
        raise ValueError("tf_series must not be empty")

    htf_series = tf_series[:-1]
    ltf_series = tf_series[-1]
    if not ltf_series.timestamps:
        raise ValueError("No data found in the lowest timeframe to plot.")

    def htf_allow(ts: Any) -> bool:
        if not htf_series:
            return True
        return all(_latest_bool_before(s.timestamps, s.scale_signal, ts) for s in htf_series)

    def htf_value(ts: Any) -> Any | None:
        for s in htf_series:
            val = _latest_value_before(s.timestamps, s.values, ts)
            if val is not None:
                return val
        return None

    x_idx: list[int] = []
    values: list[Any] = []
    ts_list: list[Any] = []
    names: list[str] = []
    base_flags: list[bool] = []
    htf_active: list[bool] = []
    boundaries: list[int] = []

    prev_name: str | None = None
    for i, ts in enumerate(ltf_series.timestamps):
        allow = htf_allow(ts)
        if allow or not htf_series:
            name = ltf_series.name
            value = ltf_series.values[i] if i < len(ltf_series.values) else None
            base = bool(ltf_series.base_signal[i]) if i < len(ltf_series.base_signal) else False
        else:
            name = htf_series[0].name
            value = htf_value(ts)
            if value is None:
                # fallback to ltf value so the plot stays continuous
                value = ltf_series.values[i] if i < len(ltf_series.values) else None
            base = False

        idx = len(x_idx)
        x_idx.append(idx)
        values.append(value)
        ts_list.append(ts)
        names.append(name)
        base_flags.append(base)
        htf_active.append(allow)

        if prev_name is not None and name != prev_name:
            boundaries.append(idx)
        prev_name = name

    return {
        "x": x_idx,
        "y": values,
        "timestamps": ts_list,
        "names": names,
        "base_flags": base_flags,
        "htf_active": htf_active,
        "boundaries": boundaries,
    }


def plot_multi_tfs_parallel_time_series(
    series_by_tf: Mapping[str, Mapping[str, Sequence[Any]]],
    *,
    x_key: str = "timestamp",
    y_key: str = "value",
    share_y: bool = False,
    signal_key: str | None = None,
    signal_style: dict[str, Any] | None = None,
    figsize: tuple[int, int] = (10, 6),
) -> LayoutDOM:
    """
    Bokeh: plot multiple timeframes stacked vertically with linked x-range and pan/zoom.
    """
    if not series_by_tf:
        raise ValueError("series_by_tf must contain at least one timeframe")

    tf_names = list(series_by_tf.keys())
    n = len(tf_names)
    width, height_total = _figsize_to_pixels(figsize)
    height_each = max(220, int(height_total / max(1, n)))

    figs: list[LayoutDOM] = []
    shared_x_range = None
    shared_y_range = None

    default_signal_style = {"color": "red", "size": 8, "marker": "circle"}
    if signal_style:
        default_signal_style.update(signal_style)
    if "s" in default_signal_style and "size" not in default_signal_style:
        default_signal_style["size"] = default_signal_style.pop("s")

    for idx, tf_name in enumerate(tf_names):
        data = series_by_tf[tf_name]
        x = list(data.get(x_key, []))
        y = list(data.get(y_key, []))

        x_axis_type = "datetime" if _bokeh_is_datetime_like(x) else "linear"
        p = figure(
            width=width,
            height=height_each,
            x_axis_type=x_axis_type,
            title=f"Timeframe: {tf_name}",
            tools="pan,xwheel_zoom,box_zoom,reset,save",
            active_drag="pan",
            active_scroll="xwheel_zoom",
        )

        if shared_x_range is None:
            shared_x_range = p.x_range
        else:
            p.x_range = shared_x_range

        if share_y:
            if shared_y_range is None:
                shared_y_range = p.y_range
            else:
                p.y_range = shared_y_range

        src = ColumnDataSource({x_key: x, y_key: y})
        p.line(x=x_key, y=y_key, source=src, line_width=2)
        p.scatter(x=x_key, y=y_key, source=src, size=4, alpha=0.9, marker="circle")

        p.grid.visible = True
        p.xaxis.axis_label = x_key if idx == n - 1 else ""
        p.yaxis.axis_label = y_key

        # signal markers
        if signal_key and signal_key in data:
            signals = list(data.get(signal_key, []))
            if len(signals) == len(x) == len(y):
                mask = [bool(v) for v in signals]
                if any(mask):
                    sig_x = [x[j] for j, keep in enumerate(mask) if keep]
                    sig_y = [y[j] for j, keep in enumerate(mask) if keep]
                    sig_src = ColumnDataSource({x_key: sig_x, y_key: sig_y})
                    marker = default_signal_style.get("marker", "circle")
                    size = default_signal_style.get("size", 8)
                    color = default_signal_style.get("color", "red")
                    scatter_kwargs = {
                        "x": x_key,
                        "y": y_key,
                        "source": sig_src,
                        "marker": marker,
                        "size": size,
                        "color": color,
                    }
                    label = default_signal_style.get("label")
                    if label:
                        scatter_kwargs["legend_label"] = label
                    p.scatter(**scatter_kwargs)
                    if label:
                        p.legend.click_policy = "hide"

        figs.append(p)

    for f in figs:
        f.sizing_mode = "scale_both"

    left_pad = int(width * 0.1)
    outer = row(
        Spacer(width=left_pad),
        column(*figs, sizing_mode="scale_both"),
        Spacer(width=left_pad),
        sizing_mode="scale_both",
    )
    return outer


def plot_multi_tfs_single_time_serie(
    timeframes: Sequence[Any],
    *,
    scale_change_signal_map: Mapping[Any, str],
    base_signal_ltf: str | Mapping[Any, str],
    value_key_map: Mapping[Any, str] | None = None,
    x_key: str = "timestamp",
    y_key: str = "value",
    figsize: tuple[int, int] = (12, 5),
    title: str | None = None,
    colors: Sequence[str] | None = None,
) -> LayoutDOM:
    """
    Bokeh: stitched single path. LTF points are drawn only when all HTFs allow;
    otherwise HTF samples are drawn on their own (coarser) timeline. Allowed LTF
    spans are shown with a light background; base signals use the LTF line color.
    """
    tf_series, ltf_series, htf_series = _build_tf_series(
        timeframes, scale_change_signal_map, base_signal_ltf, value_key_map, x_key, y_key
    )

    width, height = _figsize_to_pixels(figsize)
    x_axis_type = (
        "datetime"
        if _bokeh_is_datetime_like(ltf_series.timestamps or (htf_series[0].timestamps if htf_series else []))
        else "linear"
    )
    p = figure(
        width=int(width * 0.8),
        height=int(height * 0.8),
        x_axis_type=x_axis_type,
        title=title or "Stitched multi-timeframe series",
        tools="pan,xwheel_zoom,box_zoom,reset,save",
        active_drag="pan",
        active_scroll="xwheel_zoom",
    )
    p.sizing_mode = "scale_both"
    p.grid.visible = True
    p.xaxis.axis_label = x_key
    p.yaxis.axis_label = y_key

    color_cycle = _make_color_cycle(max(1, len(htf_series) + 1), colors)
    ltf_color = color_cycle[-1]
    htf_color = color_cycle[0] if htf_series else ltf_color

    # compute HTF windows and LTF allowed mask (all HTFs active and covering ts)
    htf_windows: dict[str, list[tuple[Any, Any]]] = {}
    for series in htf_series:
        htf_windows[series.name] = _truthy_windows(series.scale_signal, series.timestamps)

    all_active_mask: list[bool] = []
    if htf_windows:
        for ts in ltf_series.timestamps:
            active = True
            for windows in htf_windows.values():
                if not windows or not any(start <= ts <= end for start, end in windows):
                    active = False
                    break
            all_active_mask.append(active)
    else:
        all_active_mask = [True] * len(ltf_series.timestamps)

    def _mask_to_segments(
        mask: Sequence[bool], xs: Sequence[Any], ys: Sequence[Any]
    ) -> list[tuple[list[Any], list[Any]]]:
        segs: list[tuple[list[Any], list[Any]]] = []
        start_idx = None
        for idx, flag in enumerate(mask):
            if flag and start_idx is None:
                start_idx = idx
            elif not flag and start_idx is not None:
                segs.append((list(xs[start_idx:idx]), list(ys[start_idx:idx])))
                start_idx = None
        if start_idx is not None:
            segs.append((list(xs[start_idx:]), list(ys[start_idx:])))
        return segs

    # shade allowed LTF windows with light background
    ltf_windows = _truthy_windows(all_active_mask, ltf_series.timestamps)
    for start_ts, end_ts in ltf_windows:
        box = BoxAnnotation(left=start_ts, right=end_ts, fill_color="#e6f2ff", fill_alpha=0.3, line_alpha=0.0)
        p.add_layout(box)

    seen_labels: set[str] = set()

    # plot HTF segments (when not all active)
    if htf_series:
        primary_htf = htf_series[0]
        inactive_mask = [not bool(f) for f in primary_htf.scale_signal]
        htf_segments = _mask_to_segments(inactive_mask, primary_htf.timestamps, primary_htf.values)
        for xs, ys in htf_segments:
            if not xs:
                continue
            label = primary_htf.name if primary_htf.name not in seen_labels else None
            if label:
                seen_labels.add(label)
            src = ColumnDataSource({"x": xs, "y": ys})
            line_kwargs = {"x": "x", "y": "y", "source": src, "line_width": 2, "color": htf_color}
            if label:
                line_kwargs["legend_label"] = label
            p.line(**line_kwargs)
            p.scatter("x", "y", source=src, size=5, alpha=0.9, color=htf_color, marker="circle")

    # plot allowed LTF segments
    ltf_segments = _mask_to_segments(all_active_mask, ltf_series.timestamps, ltf_series.values)
    for xs, ys in ltf_segments:
        if not xs:
            continue
        label = ltf_series.name if ltf_series.name not in seen_labels else None
        if label:
            seen_labels.add(label)
        src = ColumnDataSource({"x": xs, "y": ys})
        line_kwargs = {"x": "x", "y": "y", "source": src, "line_width": 2, "color": ltf_color}
        if label:
            line_kwargs["legend_label"] = label
        p.line(**line_kwargs)
        p.scatter("x", "y", source=src, size=4, alpha=0.9, color=ltf_color, marker="circle")

    # base signals: use the LTF line color
    base_flags = ltf_series.base_signal or [False] * len(ltf_series.timestamps)
    inside_x, inside_y, outside_x, outside_y = [], [], [], []
    for idx, flag in enumerate(base_flags):
        if not flag or idx >= len(ltf_series.timestamps):
            continue
        if all_active_mask[idx]:
            inside_x.append(ltf_series.timestamps[idx])
            inside_y.append(ltf_series.values[idx])
        else:
            outside_x.append(ltf_series.timestamps[idx])
            outside_y.append(ltf_series.values[idx])

    if inside_x:
        label = "LTF base signal (HTF active)" if "LTF base signal (HTF active)" not in seen_labels else None
        if label:
            seen_labels.add(label)
        src = ColumnDataSource({"x": inside_x, "y": inside_y})
        p.scatter("x", "y", source=src, size=10, marker="circle", color=ltf_color, legend_label=label)

    if seen_labels:
        p.legend.click_policy = "hide"

    left_pad = int(width * 0.1)
    return row(Spacer(width=left_pad), p, Spacer(width=left_pad), sizing_mode="scale_both")


def plot_multi_tfs_only_ltf_time_serie(
    timeframes: Sequence[Any],
    *,
    scale_change_signal_map: Mapping[Any, str],
    base_signal_ltf: str | Mapping[Any, str],
    value_key_map: Mapping[Any, str] | None = None,
    x_key: str = "timestamp",
    y_key: str = "value",
    figsize: tuple[int, int] = (12, 4),
    title: str | None = None,
    colors: Sequence[str] | None = None,
    ltf_color: str | None = None,
) -> LayoutDOM:
    """
    Bokeh: plot only LTF series while showing HTF scale-change windows and gating.
    """
    tf_series, ltf_series, htf_series = _build_tf_series(
        timeframes, scale_change_signal_map, base_signal_ltf, value_key_map, x_key, y_key
    )
    if not ltf_series.timestamps:
        raise ValueError("No data found in the lowest timeframe to plot.")

    width, height = _figsize_to_pixels(figsize)
    x_axis_type = "datetime" if _bokeh_is_datetime_like(ltf_series.timestamps) else "linear"
    p = figure(
        width=int(width * 0.8),
        height=int(height * 0.8),
        x_axis_type=x_axis_type,
        title=title or "LTF series with HTF windows",
        tools="pan,xwheel_zoom,box_zoom,reset,save",
        active_drag="pan",
        active_scroll="xwheel_zoom",
    )
    p.sizing_mode = "scale_both"
    p.grid.visible = True
    p.xaxis.axis_label = x_key
    p.yaxis.axis_label = y_key

    color_cycle = _make_color_cycle(len(htf_series) + 1, colors)
    htf_color_map = {series.name: color_cycle[i] for i, series in enumerate(htf_series)}
    ltf_line_color = ltf_color or color_cycle[len(htf_series)]
    seen_labels: set[str] = set()

    # HTF windows
    htf_windows: dict[str, list[tuple[Any, Any]]] = {}
    for series in htf_series:
        windows = _truthy_windows(series.scale_signal, series.timestamps)
        htf_windows[series.name] = windows
        shade_color = htf_color_map.get(series.name, "gray")
        for start, end in windows:
            box = BoxAnnotation(left=start, right=end, fill_color=shade_color, fill_alpha=0.08, line_alpha=0.0)
            p.add_layout(box)
        if windows:
            label = f"{series.name} scale-change"
            if label not in seen_labels:
                # legend entries attach to renderers; add dummy line once
                dummy = p.line([], [], line_color=shade_color, line_dash="dashed", legend_label=label)
                seen_labels.add(label)
                dummy.visible = False

    ltf_src = ColumnDataSource({"x": ltf_series.timestamps, "y": ltf_series.values})
    ltf_label = ltf_series.name if ltf_series.name not in seen_labels else None
    if ltf_label:
        seen_labels.add(ltf_label)
    p.line("x", "y", source=ltf_src, line_width=2, color=ltf_line_color, legend_label=ltf_label)
    p.scatter("x", "y", source=ltf_src, size=4, color=ltf_line_color, alpha=0.9, marker="circle")

    # Determine whether all HTF windows active at each LTF timestamp
    all_active_mask: list[bool] = []
    for ts in ltf_series.timestamps:
        active = True if htf_windows else True
        for windows in htf_windows.values():
            if not windows or not any(start <= ts <= end for start, end in windows):
                active = False
                break
        all_active_mask.append(active)

    base_flags = ltf_series.base_signal or [False] * len(ltf_series.timestamps)
    inside_x: list[Any] = []
    inside_y: list[Any] = []
    outside_x: list[Any] = []
    outside_y: list[Any] = []

    for idx, flag in enumerate(base_flags):
        if idx >= len(ltf_series.timestamps):
            break
        if not flag:
            continue
        if all_active_mask[idx]:
            inside_x.append(ltf_series.timestamps[idx])
            inside_y.append(ltf_series.values[idx])
        else:
            outside_x.append(ltf_series.timestamps[idx])
            outside_y.append(ltf_series.values[idx])

    if inside_x:
        label = "LTF base signal (all HTF active)" if "LTF base signal (all HTF active)" not in seen_labels else None
        if label:
            seen_labels.add(label)
        inside_src = ColumnDataSource({"x": inside_x, "y": inside_y})
        p.scatter("x", "y", source=inside_src, size=10, color=ltf_line_color, marker="circle", legend_label=label)

    if outside_x:
        label = "LTF base signal" if "LTF base signal" not in seen_labels else None
        if label:
            seen_labels.add(label)
        outside_src = ColumnDataSource({"x": outside_x, "y": outside_y})
        p.scatter("x", "y", source=outside_src, size=9, color=ltf_line_color, marker="circle", legend_label=label)

    if seen_labels:
        p.legend.click_policy = "hide"

    left_pad = int(width * 0.1)
    return row(Spacer(width=left_pad), p, Spacer(width=left_pad), sizing_mode="scale_both")


def check_multi_tfs_single_time_serie_vs_coordinator(
    timeframes: Sequence[Any],
    *,
    scale_change_signal_map: Mapping[Any, str],
    base_signal_ltf: str | Mapping[Any, str],
    value_key_map: Mapping[Any, str] | None = None,
    x_key: str = "timestamp",
    y_key: str = "value",
    coordinator_outputs: Sequence[Mapping[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Compare plot-derived gating (all HTF signals must be true) against optional
    coordinator outputs. Returns a timeline plus mismatch diagnostics.
    """
    tf_series, ltf_series, htf_series = _build_tf_series(
        timeframes, scale_change_signal_map, base_signal_ltf, value_key_map, x_key, y_key
    )

    timeline: list[dict[str, Any]] = []
    mismatches: dict[str, list[dict[str, Any]]] = {
        "plot_not_allowed": [],
        "coordinator_unused": [],
    }

    for idx, ts in enumerate(ltf_series.timestamps):
        htf_active = {
            series.name: _latest_bool_before(series.timestamps, series.scale_signal, ts) for series in htf_series
        }
        htf_allow = all(htf_active.values()) if htf_series else True
        base_flag = bool(ltf_series.base_signal[idx]) if idx < len(ltf_series.base_signal) else False

        entry = {
            "timestamp": ts,
            "value": ltf_series.values[idx] if idx < len(ltf_series.values) else None,
            "base_signal": base_flag,
            "htf_allow": htf_allow,
            "htf_active": htf_active,
            "allowed_timeframes": [ltf_series.name] if htf_allow else [],
        }
        timeline.append(entry)

        if base_flag and not htf_allow:
            mismatches["plot_not_allowed"].append({"index": idx, "timestamp": ts})

    if coordinator_outputs:
        limit = min(len(timeline), len(coordinator_outputs))
        for idx in range(limit):
            coord = coordinator_outputs[idx]
            coord_allowed = bool(coord.get("ltf_gated", {}).get(ltf_series.name, 0))
            base_flag = timeline[idx]["base_signal"]

            if base_flag and not coord_allowed:
                mismatches["plot_not_allowed"].append({"index": idx, "timestamp": timeline[idx]["timestamp"]})
            if coord_allowed and not base_flag:
                mismatches["coordinator_unused"].append({"index": idx, "timestamp": timeline[idx]["timestamp"]})

    return {"timeline": timeline, "mismatches": mismatches}
