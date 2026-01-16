# Hiera-TF

Languages:

- [English README](README.en.md) (current)
- [README en français](README.fr.md)
- [中文 README](README.zh-CN.md)

## 1. 项目概览

### 1.1 简介

Hiera-TF 是一个面向多时间尺度的层级信号构建与可视化框架——将上层时间尺度（HTF, Higher Timeframe）的信号折叠为最底层时间尺度（LTF, Lowest Timeframe）的"允许窗口"进行门控，并通过多视图呈现与导出支持复核与复算。

### 1.2 适用场景

- 需要同时分析细粒度与粗粒度时间序列，并让上层信号约束下层行为。
- 需要构建层级/组合信号，并观察信号在时间上的区间效果。
- 需要通过可视化快速验证信号定义、阈值与层级关系。

例如：

- 交易多周期过滤与信号解释
- 运维/传感器指标的异常分段与归因
- 实验数据的事件对齐与条件筛选
- 科研分析中的跨尺度规则检验与可复现输出

## 2. 快速开始

### 2.1 本地静态 UI

- 直接打开 `apps/ui-static/index.html`（无需构建）。
- 或在仓库根目录启动静态服务（推荐，便于加载 `packages/htf-js`）：

```powershell
python -m http.server 8000
```

打开 `http://localhost:8000/apps/ui-static/index.html`。

- 联网/依赖说明：UI 通过 CDN 加载 Plotly、XLSX 与 Google Fonts。离线时绘图/Excel 导入导出会受限（CSV 仍可用）。

### 2.2 使用 Python（安装方式、最小可运行 demo）

- 运行环境：Python 3.9+。
- 最小可运行 demo（安装后，推荐）：

```powershell
python -m pip install -e packages/htf-py
python -m htf.demos.demo_py_1
python -m htf.demos.demo_py_2
python -m htf.demos.demo_py_3
```

- 兼容旧路径（无需安装）：

```powershell
python packages/htf-py/demos/demo-py-1.py
python packages/htf-py/demos/demo-py-2.py
python packages/htf-py/demos/demo-py-3.py
```

- 直接使用源码：将 `packages/htf-py` 加入 `PYTHONPATH`，或继续使用旧 demo wrapper（会临时调整 `sys.path`）。

### 2.3 常见问题

- 浏览器文件权限/安全策略：若通过 `file://` 打开时受限，建议使用本地静态服务。
- UI 打不开或脚本 404：请确保静态服务从仓库根目录启动，或调整 `data-htf-base` 指向 `packages/htf-js/htf`。
- XLSX/Plotly 不可用：检查网络/CDN 是否可用，或改用 CSV。
- `pandas` / `bokeh` 缺失报错：这些是可选依赖，仅在导出/可视化时需要。

## 3. 背景与动机

### 3.1 要解决的问题与现有工具的不足

- 多时间尺度信号经常分散在不同脚本的 if/else 中，难以统一定义、审计与版本对比。
- 常见平台能将多时间尺度叠图展示，但难以把上层条件结构化为下层的"允许窗口"，约束关系通常隐式存在。
- 实现"跨尺度门控 + 信号组合 + 可视化 + 导出"的整个工作流往往需要大量胶水代码。

### 3.2 与常见做法的差异

- 将层级约束作为一等概念，而非临时的 gating。
- 使"层级门控掩码"可配置、可组合、可导出，并与信号依赖图（DAG）打通。
- Python 和 JS 双实现加 UI 形成信号定义、验证和可视化的闭环。

## 4. 核心概念

### 核心理念：以信号为核心

Hiera-TF 将"信号（事件/条件）"作为时间序列分析的核心分析对象：

- 将数值序列转化为触发/不触发、区间有效/无效的可解释语义。
- 更贴近决策过程：什么时候该关注/行动，以及为什么触发。

### 4.1 Timeframe / LTF / HTF

- Timeframe：一个时间尺度视图，维护滚动窗口和信号状态。
- LTF：最细粒度的底层序列。
- HTF：相对于 LTF 的粗粒度序列，可存在多个层级。

### 4.2 Feature（特征）

- 从窗口数据计算出的特征字典，可由 `FeatureModule` 或 `feature_fn` 生成。
- 信号函数只依赖 `features`，保证模块化。

### 4.3 Signal（信号）

信号通常返回 0/1，并且是有状态的计算单元。示例：

- `ValueVsRollingPercentile`：当前值与历史百分位对比，满足条件则触发。
- `SignalRunLengthReached`：基础信号连续达到 `min_run_length` 后触发，可延长尾部。
- `SignalRunInterrupted`：基础信号连续运行后被打断时触发，可延长尾部。
- `SignalIntervalBetweenMarkers`：在起始信号与结束信号之间持续输出 1；这是一个区间信号，不是离散的独立信号。

### 4.4 Coordinator（多尺度协调）

- `SimpleHTFCoordinator`：所有 HTF 信号为真时才允许 LTF。
- `HierarConstraintCoordinator`：按顺序逐级 gating，更适合多层结构。

### 4.5 Hierarchy Constraint（层级约束/组合约束）

- 用上层信号限制下层信号的“生效区间”，避免跨尺度的噪声放大。
- 可在 UI 中选择下游约束信号并进行可视化叠加。

## 5. 特性

### 5.1 可组合性

- **数据/尺度/信号/门控均可自由拼装**：同一数据可构建多时间尺度，不同尺度上的信号可按规则组合，门控约束亦可叠加复用。
- **组合关系显式化**：依赖与组合不隐藏在一次性脚本中，便于追溯与导出。

### 5.2 信号图（DAG）/ 信号树

- 信号可组织为依赖图：一个信号的输出可作为另一个的输入，形成可配置的规则链。
- 提供显式组合算子（如交集），让多条件合成更易复核、可沉淀为模板。

### 5.3 层级约束与门控

- **核心特性**：将 HTF 约束信号折叠为 LTF 的允许窗口/掩码，门控下层信号与事件。
- **复合门控**：多个层级约束可合成为一个复合约束（如交集/AND），约束本身成为可复用资产。

### 5.4 三种绘图模式

- **LTF only**：在下层序列上叠加上层允许窗口，直观显示被允许/排除的区间。
- **Parallel series**：多序列并列对照，观察不同尺度的同步与差异。
- **Stitched series**：压缩呈现门控影响，一眼理解"门控改变了什么"。

### 5.5 导出与可审计性

- 可导出：最终信号、层级约束（mask）、信号依赖链，以及关键中间量（阈值、run-length、EMA 等）。
- 强调"过程可解释、结果可审计"，便于复核与复现。

### 5.6 外部信号引入

- 支持引入外部标注/事件/专家知识作为信号节点，与内部计算信号组合并参与门控。
- 让难以公式化的经验规则也能进入可复现的分析链路。

### 5.7 可扩展性

- 信号类型与复杂模板可扩展（新增实现并注册）。
- 支持多条时间序列与多尺度结构；规模上限受数据量与性能影响，而非架构限制。

### 5.8 设计取舍与边界

- 核心库不做自动重采样/数据清洗，需要上游提供对齐数据。
- 当前强项在"依赖链 + 组合 + 门控"，并非任意形式的跨序列数值联立运算平台。

**非目标**：Hiera-TF 专注于"事件/规则信号 + 层级门控 + 可组合配置 + 可解释导出"，而非：

- 通用时频分解平台（小波/EMD 等）
- 预测/机器学习建模平台
- 完整交易执行/回测系统

## 6. 仓库结构

- `apps/ui-static`：本地静态 UI 演示与可视化（Plotly + XLSX CDN）。
- `apps/templates`：UI 的信号模板样例（可选，模板存储在浏览器本地存储中）。
- `packages/htf-py`：Python 核心库与 demos，含 Bokeh 可视化（可选）。
- `packages/htf-js`：JS 实现，定位为 UI 依赖并与 Python 对齐，内含 demos。
- `LICENSE` / `NOTICE` / `THIRD_PARTY_NOTICES`：许可与第三方声明。

## 7. 使用指南

### 7.1 使用者（UI Demo）：导入数据、配置时间序列、查看层级/信号效果

- 打开 UI，点击 Add 导入 CSV/XLSX，并映射时间列与数值列。
- 设置时间尺度（例如 5m/15m）与聚合方式。
- 在 Signals 中配置信号与依赖关系，选择下游约束信号，并从浏览器本地存储保存或导入自定义信号模板（`apps/templates` 中的模板也可以导入）。
- 在 Viz 中配置图形元素的绘制效果。

**详细教程**：请参阅 [UI 静态页面使用指南](../apps/README.md#chinese-version)，包含完整的界面布局、操作流程与信号配置说明。

### 7.2 开发者（Python）

#### 7.2.1 最小示例：构建时间序列与基础信号

```python
from htf import TimeframeConfig, TimeframeView, ValueVsRollingPercentile

signal = ValueVsRollingPercentile(value_key="TEMP", window_size=12, percentile=80, comparison="lt")
tf = TimeframeView(
    config=TimeframeConfig(name="1h", window_size=6, max_buffer=200, role="LTF"),
    signal_fn=lambda feats: signal(feats),
)

for record in records:  # record 需包含时间列与 TEMP
    tf.on_new_record(record)

print(tf.signal, tf.features)
```

#### 7.2.2 自定义信号/特征模块

- 继承 `FeatureModule` 并实现 `compute(window)`。
- 或实现一个带状态的 `__call__(features)` 类，作为 `signal_fn` 使用。

#### 7.2.3 施加层级约束与协调策略

- 使用 `HierarConstraintCoordinator(order=[...])` 按层级 gating。
- 参考 `packages/htf-py/demos/demo-py-3.py`。

#### 7.2.4 输出与可视化（可选依赖说明）

- `export_buffer_as_dataframe` / `export_signal_dataframe` 需要 `pandas`。
- `htf.viz.multi_timeframe_plot` 需要 `bokeh`。

**详细教程**：请参阅 [htf-py 配置指南](../packages/htf-py/README.md#%E4%B8%AD%E6%96%87%E7%89%88%E6%9C%AC)，包含完整的安装、项目结构、运行演示与使用示例。

### 7.3 开发者（JavaScript）

JavaScript 实现主要作为静态 UI 的依赖，并与 Python 实现保持功能对等。

#### 7.3.1 最小示例：构建时间序列与基础信号

```javascript
const HTF = require("./index.js");

// 创建时间尺度配置
const config = new HTF.TimeframeConfig({
  name: "5m-series",
  window_size: 6,
  max_buffer: 128,
  role: "LTF",
});

// 创建时间尺度视图
const timeframe = new HTF.TimeframeView({ config });

// 推送数据记录
for (const record of records) {
  timeframe.on_new_record(record);
}

console.log("features:", timeframe.features);
console.log("signal:", timeframe.signal);
```

#### 7.3.2 运行演示

```bash
node packages/htf-js/demos/demo-js-1.js
node packages/htf-js/demos/demo-js-2.js
node packages/htf-js/demos/demo-js-3.js
```

#### 7.3.3 与静态 UI 集成

静态 UI（`apps/ui-static`）通过 ES 模块加载 htf-js。从仓库根目录启动服务时：

```bash
python -m http.server 8000
# 打开 http://localhost:8000/apps/ui-static/index.html
```

**详细教程**：请参阅 [htf-js 配置指南](../packages/htf-js/README.md#%E4%B8%AD%E6%96%87%E7%89%88%E6%9C%AC)，包含完整的项目结构、运行演示与 UI 集成说明。

## 8. 路线图 / 状态

### 8.1 当前稳定性与已知限制

- 目前处于迭代期，API 与信号定义可能调整。
- 尚未发布 PyPI / npm 包，建议直接使用源码与 demos。
- UI 依赖 CDN（Plotly/XLSX/Fonts），离线场景需自行替换。
- 核心库不负责重采样或数据清洗，需要上游准备数据。

### 8.2 未来计划

- 扩充信号类的定义，基于社区反馈完善复杂信号设计。
- 使用 Python 构建时间序列相关应用（如信号交易平台）。

### 8.3 反馈与共建

欢迎提供以下方面的反馈：

- **交互逻辑**：导入数据 → 组织多尺度序列 → 定义/组合信号 → 配置门控 → 切换视图 → 导出复算，这条路径是否顺畅、哪里卡顿或需要更少点击。
- **页面 BUG**：布局错位、缩放适配、渲染延迟、浏览器差异等问题，附截图/录屏与复现步骤更佳。
- **信号定义征集**：欢迎提供你认为有价值的信号定义（交易/运维/传感器/科研均可），或尝试设计复杂信号（多条件组合 + run-length + 门控 + 外部事件 + 多尺度拼装），它们将被沉淀为可复用模板。

## 9. 许可证与免责声明

### 9.1 License

- Apache License 2.0，详见 `LICENSE` 与 `NOTICE`。

### 9.2 第三方依赖声明

- 详见 `THIRD_PARTY_NOTICES`；UI 还通过 CDN 使用 Plotly、XLSX 与 Google Fonts。

### 9.3 免责声明

- 本项目提供的信号与可视化仅用于研究/教育用途，不构成任何投资或交易建议。
