# htf-js

**Select Your Language / Choisissez votre langue / 选择您的语言:**

- [English](#english-version) | [Français](#version-française) | [中文](#中文版本)

---

## English Version

### JavaScript Implementation

The JavaScript implementation of the Hiera-TF hierarchical timeframe toolkit. This package is primarily used as a dependency for the static UI and provides feature parity with the Python implementation.

### Prerequisites

- **Node.js**: 18.0 or higher (required for running tests)
  - Uses built-in `node:test` module (`node --test`)
- A modern browser (for UI integration)
- npm (comes with Node.js) for running tests

### Installation

#### For Library/Demo Usage (No Dependencies Required)

This package is pure JavaScript with no build step. It's loaded directly by the static UI or can be used in Node.js scripts:

```bash
# Clone the repository (if not already cloned)
git clone <repository_url>
cd hiera-tf/packages/htf-js

# Run demos directly (no npm install needed)
node demos/demo-js-1.js
node demos/demo-js-2.js
node demos/demo-js-3.js
```

#### For Development (Required for Tests & Linting)

Install dependencies to run tests and code quality checks:

```bash
cd packages/htf-js
npm install           # Install all dependencies
npm test              # Run tests using Node.js built-in test runner
npm run check         # Check code style with Biome
npm run ci            # CI-style check (fails on style errors)
```

**Dependencies:**

- `@biomejs/biome` — Code formatter and linter

**Note:** This package is not yet published to npm.

### Project Structure

```text
htf-js/
├── index.js          # Main entry point
├── package.json      # Package configuration
├── htf/              # Core library modules
│   ├── coordinator.js
│   ├── features.js
│   ├── framework.js
│   ├── signals.js
│   ├── timeframe.js
│   ├── utils.js
│   └── viz/          # Visualization utilities
├── demos/            # Demo scripts
│   ├── demo-js-1.js  # Basic TimeframeView usage
│   ├── demo-js-2.js  # Signal configuration
│   └── demo-js-3.js  # Multi-timeframe coordination
└── tests/            # Unit tests
```

### Running Demos

To run individual demos:

```bash
# From repository root
node packages/htf-js/demos/demo-js-1.js
node packages/htf-js/demos/demo-js-2.js
node packages/htf-js/demos/demo-js-3.js
```

Or, while in the `packages/htf-js` directory:

```bash
cd packages/htf-js
node demos/demo-js-1.js
node demos/demo-js-2.js
node demos/demo-js-3.js
```

### Running Tests

```bash
npm test
```

### Usage Example

```javascript
const HTF = require("..");

// Create a timeframe configuration
const config = new HTF.TimeframeConfig({
  name: "5m-series",
  window_size: 6,
  max_buffer: 128,
  role: "LTF",
});

// Create a timeframe view
const timeframe = new HTF.TimeframeView({ config });

// Push data records
records.forEach((record) => {
  timeframe.on_new_record(record);
});

console.log("Buffer size:", timeframe.buffer_size);
console.log("Is warm (buffer >= window_size):", timeframe.is_warm);
console.log("Latest features (last record):", timeframe.features);
console.log("Latest signal (none configured):", timeframe.signal);
```

### Integration with Static UI

The static UI (`apps/ui-static`) loads the library by directly loading scripts under `packages/htf-js/htf` (IIFE-style) and exposes the API via the global `HTF` object. When serving from the repository root:

```bash
python -m http.server 8000
# Open http://localhost:8000/apps/ui-static/index.html
```

---

## Version Française

### Implementation JavaScript

Implementation JavaScript de la boîte à outils Hiera-TF pour les cadres temporels hiérarchiques. Ce package est principalement utilisé comme dépendance pour l'interface statique et offre une parité fonctionnelle avec l'implémentation Python.

### Prérequis

- **Node.js** : 18.0 ou supérieur (requis pour exécuter les tests)
  - Utilise le module intégré `node:test` (`node --test`)
- Un navigateur moderne (pour l'intégration UI)
- npm (fourni avec Node.js) pour exécuter les tests

### Installation locale

#### Pour utilisation library/démo (aucune dépendance requise)

Ce package est du JavaScript pur sans étape de build. Il est chargé directement par l'interface statique ou peut être utilisé dans des scripts Node.js :

```bash
# Cloner le dépôt (si pas encore fait)
git clone <repository_url>
cd hiera-tf/packages/htf-js

# Exécuter les démos directement (pas de npm install requis)
node demos/demo-js-1.js
node demos/demo-js-2.js
node demos/demo-js-3.js
```

#### Pour le développement (requis pour les tests et le linting)

Installez les dépendances pour exécuter les tests et les vérifications de qualité de code :

```bash
cd packages/htf-js
npm install           # Installer toutes les dépendances
npm test              # Exécuter les tests avec le test runner intégré de Node.js
npm run check         # Vérifier le style de code avec Biome
npm run ci            # Vérification de style CI (échoue sur les erreurs)
```

**Dépendances :**

- `@biomejs/biome` — Formateur et linter de code

**Note :** Ce package n'est pas encore publié sur npm.

### Structure du Projet

```text
htf-js/
├── index.js          # Point d'entrée principal
├── package.json      # Configuration du package
├── htf/              # Modules de la bibliothèque principale
│   ├── coordinator.js
│   ├── features.js
│   ├── framework.js
│   ├── signals.js
│   ├── timeframe.js
│   ├── utils.js
│   └── viz/          # Utilitaires de visualisation
├── demos/            # Scripts de démonstration
│   ├── demo-js-1.js  # Utilisation basique de TimeframeView
│   ├── demo-js-2.js  # Configuration des signaux
│   └── demo-js-3.js  # Coordination multi-cadres temporels
└── tests/            # Tests unitaires
```

### Execution des Demos

Pour exécuter les démos individuellement :

```bash
# Depuis la racine du dépôt
node packages/htf-js/demos/demo-js-1.js
node packages/htf-js/demos/demo-js-2.js
node packages/htf-js/demos/demo-js-3.js
```

Ou, en se plaçant dans le répertoire `packages/htf-js` :

```bash
cd packages/htf-js
node demos/demo-js-1.js
node demos/demo-js-2.js
node demos/demo-js-3.js
```

### Execution des Tests

```bash
npm test
```

### Exemple d'Utilisation

```javascript
const HTF = require("..");

// Create a timeframe configuration
const config = new HTF.TimeframeConfig({
  name: "5m-series",
  window_size: 6,
  max_buffer: 128,
  role: "LTF",
});

// Create a timeframe view
const timeframe = new HTF.TimeframeView({ config });

// Push data records
records.forEach((record) => {
  timeframe.on_new_record(record);
});

console.log("Buffer size:", timeframe.buffer_size);
console.log("Is warm (buffer >= window_size):", timeframe.is_warm);
console.log("Latest features (last record):", timeframe.features);
console.log("Latest signal (none configured):", timeframe.signal);
```

### Integration avec l'Interface Statique

L'interface statique (`apps/ui-static`) charge la bibliothèque en chargeant directement les scripts sous `packages/htf-js/htf` (style IIFE) et expose l'API via l'objet global `HTF`. Lors du service depuis la racine du dépôt :

```bash
python -m http.server 8000
# Ouvrir http://localhost:8000/apps/ui-static/index.html
```

---

## 中文版本

### JavaScript 实现

Hiera-TF 层级时间尺度工具包的 JavaScript 实现。此包主要作为静态 UI 的依赖使用，并与 Python 实现保持功能对等。

### 前置要求

- **Node.js**: 18.0 或更高版本（运行测试必需）
  - 使用内置 `node:test` 模块（`node --test`）
- 现代浏览器（用于 UI 集成）
- npm（随 Node.js 提供）用于运行测试

### 安装

#### 库/演示使用（无需依赖）

此包是纯 JavaScript，无需构建步骤。可由静态 UI 直接加载，也可在 Node.js 脚本中使用：

```bash
# 克隆仓库（如尚未克隆）
git clone <repository_url>
cd hiera-tf/packages/htf-js

# 直接运行演示（无需 npm install）
node demos/demo-js-1.js
node demos/demo-js-2.js
node demos/demo-js-3.js
```

#### 开发使用（测试和代码检查必需）

安装依赖以运行测试和代码质量检查：

```bash
cd packages/htf-js
npm install           # 安装所有依赖
npm test              # 使用 Node.js 内置测试运行器运行测试
npm run check         # 使用 Biome 检查代码风格
npm run ci            # CI 风格检查（遇错误则失败）

**依赖项：**
- `@biomejs/biome` — 代码格式化和检查工具

**注意：** 此包尚未发布到 npm。

### 项目结构

```text
htf-js/
├── index.js          # 主入口文件
├── package.json      # 包配置
├── htf/              # 核心库模块
│   ├── coordinator.js
│   ├── features.js
│   ├── framework.js
│   ├── signals.js
│   ├── timeframe.js
│   ├── utils.js
│   └── viz/          # 可视化工具
├── demos/            # 演示脚本
│   ├── demo-js-1.js  # TimeframeView 基础用法
│   ├── demo-js-2.js  # 信号配置
│   └── demo-js-3.js  # 多时间尺度协调
└── tests/            # 单元测试
```

### 运行演示

要运行各个演示：

```bash
# 从项目根目录
node packages/htf-js/demos/demo-js-1.js
node packages/htf-js/demos/demo-js-2.js
node packages/htf-js/demos/demo-js-3.js
```

或进入 `packages/htf-js` 目录：

```bash
cd packages/htf-js
node demos/demo-js-1.js
node demos/demo-js-2.js
node demos/demo-js-3.js
```

### 运行测试

```bash
npm test
```

### 使用示例

```javascript
const HTF = require("..");

// Create a timeframe configuration
const config = new HTF.TimeframeConfig({
  name: "5m-series",
  window_size: 6,
  max_buffer: 128,
  role: "LTF",
});

// Create a timeframe view
const timeframe = new HTF.TimeframeView({ config });

// Push data records
records.forEach((record) => {
  timeframe.on_new_record(record);
});

console.log("Buffer size:", timeframe.buffer_size);
console.log("Is warm (buffer >= window_size):", timeframe.is_warm);
console.log("Latest features (last record):", timeframe.features);
console.log("Latest signal (none configured):", timeframe.signal);
```

### 与静态 UI 集成

静态 UI（`apps/ui-static`）通过直接加载 `packages/htf-js/htf` 下的脚本（IIFE 风格）来使用该库，并将 API 暴露到全局对象 `HTF` 上。从仓库根目录启动服务时：

```bash
python -m http.server 8000
# 打开 http://localhost:8000/apps/ui-static/index.html
```
