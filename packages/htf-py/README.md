# htf-py

**Select Your Language / Choisissez votre langue / 选择您的语言:**

- [English](#english-version) | [Français](#version-française) | [中文](#中文版本)

---

## English Version

### Python Implementation

The Python implementation of the Hiera-TF hierarchical timeframe toolkit. This package provides the core library for building multi-timeframe signal hierarchies with optional visualization support via Bokeh.

### Prerequisites

- Python 3.9+
- pip and a Python virtual environment (e.g. `venv`) for package management; the project uses `setuptools` as the build backend via `pyproject.toml`

### Installation

#### Editable Install (Recommended for Development)

```bash
pip install -e packages/htf-py
```

#### With Optional Dependencies

```bash
# For visualization (Bokeh)
pip install -e ".[viz]"
```

### Project Structure

```text
htf-py/
├── htf/                  # Core library modules
│   ├── __init__.py
│   ├── coordinator.py    # Multi-timeframe coordinator
│   ├── features.py       # Feature computation
│   ├── framework.py      # Framework orchestration
│   ├── signals.py        # Signal definitions
│   ├── timeframe.py      # Timeframe view
│   └── viz/              # Visualization utilities (optional)
│       ├── __init__.py
│       └── multi_timeframe_plot.py
├── demos/                # Demo scripts
├── tests/                # Unit and integration tests
│   └── test_signals/     # Signal-specific tests
├── pyproject.toml        # Build configuration and dependencies
└── README.md             # Project documentation
```

### Running Demos

To run demos, use Python module execution from the repository root:

```bash
# After installation
python -m htf.demos.demo_py_1
python -m htf.demos.demo_py_2
python -m htf.demos.demo_py_3
```

Or run directly from the source:

```bash
# From repository root
python packages/htf-py/htf/demos/demo_py_1.py
python packages/htf-py/htf/demos/demo_py_2.py
python packages/htf-py/htf/demos/demo_py_3.py
```

### Running Tests

To run the tests, use the following command:

```bash
# From packages/htf-py directory
pytest
```

Or from repository root:

```bash
# Run all tests
python -m pytest packages/htf-py/tests
```

### Usage Example

Here is a simple example of how to use the Hiera-TF library in your Python code:

```python
from htf import TimeframeConfig, TimeframeView, HTFFramework

# Create a timeframe configuration
config = TimeframeConfig(name="5m-series", window_size=6, max_buffer=128, role="LTF")
timeframe = TimeframeView(config=config)

# Push data records (see demos for realistic data)
for record in records:
    timeframe.on_new_record(record)

print("Features:", timeframe.features)
print("Signal:", timeframe.signal)

# For multi-timeframe coordination:
# framework = HTFFramework(timeframes={"5m": timeframe, ...}, coordinator=...)
```

### Visualization (Optional)

If you have installed the optional visualization dependencies, you can create visualizations of your signal hierarchies. For example:

```python
from htf.viz import plot_multi_tfs_parallel_time_series

# See demos for full multi-timeframe setup
# plot_multi_tfs_parallel_time_series([timeframe1, timeframe2, ...])
```

#### Note on visualization dependency

- The visualization helpers live in `htf.viz` and depend on Bokeh. Importing `htf.viz` (or any helper that imports it) without installing the optional `viz` extras will raise an ImportError. Install the extras before using visualization features:

```bash
pip install -e ".[viz]"
```

#### Coordination workflows

There are two common ways to coordinate multiple timeframes:

- **`HTFFramework`**: high-level helper that owns `TimeframeView` instances and a `coordinator`. Call `framework.on_new_record(record)` to update all timeframes and run the coordinator automatically. Use this when timeframes share a single stream of records and you want the library to manage updates.

- **Manual coordinator usage**: update each `TimeframeView` independently (for example `tf.on_new_record(record)`), then construct `TimeframeState` objects and call `coordinator.update(states, record)`. This approach is useful when you need custom update timing (e.g. HTF updates only on boundary records), partial updates, or bespoke state composition. See the demos (for example `demos/demo-py-3.py`) for a manual-coordinator example.

### Export Utilities

To export your signal data, use the buffer export method and pandas:

```python
# Export the buffer of a TimeframeView to CSV
df = timeframe.export_buffer_as_dataframe()
df.to_csv("signals.csv", index=False)
```

---

## Version Française

### Implémentation Python

L'implémentation Python de l'outil hiérarchique Hiera-TF. Ce package fournit la bibliothèque de base pour construire des hiérarchies de signaux multi-temporels avec un support de visualisation optionnel via Bokeh.

### Prérequis

- Python 3.9+
- pip et un environnement virtuel Python (par ex. `venv`) pour la gestion des packages ; le projet utilise `setuptools` comme backend de build via `pyproject.toml`

### Installation locale

#### Installation Éditable (Recommandée pour le Développement)

```bash
pip install -e packages/htf-py
```

#### Avec Dépendances Optionnelles

```bash
# Pour la visualisation (Bokeh)
pip install -e ".[viz]"
```

### Structure du Projet

```text
htf-py/
├── htf/                  # Modules principaux
│   ├── __init__.py
│   ├── coordinator.py    # Coordinateur multi-timeframes
│   ├── features.py       # Calcul des features
│   ├── framework.py      # Orchestration du framework
│   ├── signals.py        # Définitions des signaux
│   ├── timeframe.py      # Vue timeframe
│   └── viz/              # Utilitaires de visualisation (optionnel)
│       ├── __init__.py
│       └── multi_timeframe_plot.py
├── demos/                # Scripts de démonstration
├── tests/                # Tests unitaires et d'intégration
│   └── test_signals/     # Tests spécifiques aux signaux
├── pyproject.toml        # Configuration du projet et dépendances
└── README.md             # Documentation du projet
```

### Exécution des Démos

Pour exécuter les démos, utilisez l'exécution de module Python depuis la racine du dépôt :

```bash
# Après installation
python -m htf.demos.demo_py_1
python -m htf.demos.demo_py_2
python -m htf.demos.demo_py_3
```

Ou exécutez directement depuis le code source :

```bash
# Depuis la racine du dépôt
python packages/htf-py/htf/demos/demo_py_1.py
python packages/htf-py/htf/demos/demo_py_2.py
python packages/htf-py/htf/demos/demo_py_3.py
```

### Exécution des Tests

Pour exécuter les tests, utilisez la commande suivante :

```bash
# Depuis le répertoire packages/htf-py
pytest
```

Ou depuis la racine du dépôt :

```bash
# Exécuter tous les tests
python -m pytest packages/htf-py/tests
```

### Exemple d'Utilisation

Voici un exemple simple de la façon d'utiliser la bibliothèque Hiera-TF dans votre code Python :

```python
from htf import TimeframeConfig, TimeframeView, HTFFramework

# Créez une configuration de timeframe
config = TimeframeConfig(name="5m-series", window_size=6, max_buffer=128, role="LTF")
timeframe = TimeframeView(config=config)

# Poussez des enregistrements de données (voir les démos pour des données réalistes)
for record in records:
    timeframe.on_new_record(record)

print("Caractéristiques:", timeframe.features)
print("Signal:", timeframe.signal)

# Pour la coordination multi-timeframe :
# framework = HTFFramework(timeframes={"5m": timeframe, ...}, coordinator=...)
```

### Visualisation (Optionnelle)

Si vous avez installé les dépendances de visualisation optionnelles, vous pouvez créer des visualisations de vos hiérarchies de signaux. Par exemple :

```python
from htf.viz import plot_multi_tfs_parallel_time_series

# Voir les scripts de démonstration pour une configuration complète
# plot_multi_tfs_parallel_time_series([timeframe1, timeframe2, ...])
```

#### Remarque sur la dépendance de visualisation

- Les fonctions de visualisation se trouvent dans `htf.viz` et nécessitent `Bokeh`. Importer `htf.viz` sans avoir installé l'optionnelle `viz` lèvera une ImportError. Installez l'option avant d'utiliser les fonctionnalités de visualisation :

```bash
pip install -e ".[viz]"
```

#### Flux de travail de coordination

Deux approches courantes existent pour coordonner plusieurs timeframes :

- **`HTFFramework`** : un utilitaire de haut niveau qui possède des `TimeframeView` et le `coordinator`. Appelez `framework.on_new_record(record)` pour mettre à jour tous les timeframes et exécuter automatiquement le coordinateur. À utiliser quand les timeframes partagent un flux unique de records.

- **Utilisation manuelle du coordinator** : mettez à jour chaque `TimeframeView` indépendamment (par ex. `tf.on_new_record(record)`), puis construisez des `TimeframeState` et appelez `coordinator.update(states, record)`. Utile pour des horaires de mise à jour personnalisés (par ex. mise à jour HTF uniquement sur les frontières), des mises à jour partielles, ou une composition d'état sur mesure. Voir les démos (par ex. `demos/demo-py-3.py`).

### Utilitaires d'Export

Pour exporter vos données de signaux, utilisez la méthode d'export du buffer et pandas :

```python
# Exporter le buffer d'un TimeframeView en CSV
df = timeframe.export_buffer_as_dataframe()
df.to_csv("signals.csv", index=False)
```

---

## 中文版本

### Python 实现

Hiera-TF 分层时间框架工具包的 Python 实现。此软件包提供了构建多时间框架信号层次结构的核心库，并可通过 Bokeh 提供可选的可视化支持。

### 前置要求

- Python 3.9+
- 使用 `pip` 和 Python 虚拟环境（如 `venv`）进行包管理；项目通过 `pyproject.toml` 使用 `setuptools` 作为构建后端

### 安装

#### 可编辑安装（推荐用于开发）

```bash
pip install -e packages/htf-py
```

#### 带可选依赖项的安装

```bash
# 用于可视化（Bokeh）
pip install -e ".[viz]"
```

### 项目结构

```text
htf-py/
├── htf/                  # 核心模块
│   ├── __init__.py
│   ├── coordinator.py    # 多时间尺度协调器
│   ├── features.py       # 特征计算
│   ├── framework.py      # 框架编排
│   ├── signals.py        # 信号定义
│   ├── timeframe.py      # 时间尺度视图
│   └── viz/              # 可视化工具（可选）
│       ├── __init__.py
│       └── multi_timeframe_plot.py
├── demos/                # 演示脚本
├── tests/                # 单元和集成测试
│   └── test_signals/     # 信号专项测试
├── pyproject.toml        # 项目配置与依赖
└── README.md             # 项目文档
```

### 运行演示

要运行演示，使用 Python 模块从项目根目录执行：

```bash
# 安装后
python -m htf.demos.demo_py_1
python -m htf.demos.demo_py_2
python -m htf.demos.demo_py_3
```

或直接从源码运行：

```bash
# 从项目根目录
python packages/htf-py/htf/demos/demo_py_1.py
python packages/htf-py/htf/demos/demo_py_2.py
python packages/htf-py/htf/demos/demo_py_3.py
```

### 运行测试

要运行测试，请使用以下命令：

```bash
# 从 packages/htf-py 目录
pytest
```

或从项目根目录：

```bash
# 运行所有测试
python -m pytest packages/htf-py/tests
```

### 使用示例

以下是如何在 Python 代码中使用 Hiera-TF 库的简单示例：

```python
from htf import TimeframeConfig, TimeframeView, HTFFramework

# 创建时间框架配置
config = TimeframeConfig(name="5m-series", window_size=6, max_buffer=128, role="LTF")
timeframe = TimeframeView(config=config)

# 推送数据记录（详见 demos 获取真实数据示例）
for record in records:
    timeframe.on_new_record(record)

print("特征:", timeframe.features)
print("信号:", timeframe.signal)

# 多时间框架协调可用：
# framework = HTFFramework(timeframes={"5m": timeframe, ...}, coordinator=...)
```

### 可视化（可选）

如果您安装了可选的可视化依赖项，可以使用如下方式进行信号层次结构的可视化：

```python
from htf.viz import plot_multi_tfs_parallel_time_series

# 具体多时间框架设置请参考演示脚本
# plot_multi_tfs_parallel_time_series([timeframe1, timeframe2, ...])
```

#### 关于可视化依赖的提醒

- 可视化工具位于 `htf.viz`，依赖 `Bokeh`。在未安装可选依赖 `viz`（Bokeh）时导入 `htf.viz` 会引发 ImportError。请在使用可视化功能前安装可选依赖：

```bash
pip install -e ".[viz]"
```

#### 协调工作流说明

两种常见的多时间框架协调方式：

- **`HTFFramework`**：高级封装，持有 `TimeframeView` 实例和一个 `coordinator`。调用 `framework.on_new_record(record)` 会自动更新所有时间框架并运行协调器。适用于时间框架共享单一记录流且希望库自动管理更新的场景。

- **手动使用协调器**：分别更新每个 `TimeframeView`（例如 `tf.on_new_record(record)`），然后构造 `TimeframeState` 并调用 `coordinator.update(states, record)`。当您需要自定义更新时间（例如仅在 HTF 边界更新）、部分更新或自定义状态组合时，此方法更灵活。示例见 `demos/demo-py-3.py`。

### 导出工具

要导出信号数据，可使用 TimeframeView 的 buffer 导出方法结合 pandas：

```python
# 导出 TimeframeView 的 buffer 到 CSV
df = timeframe.export_buffer_as_dataframe()
df.to_csv("signals.csv", index=False)
```
