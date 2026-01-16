# Contributing

Select Your Language / Choisissez votre langue / 选择您的语言:

- [English](#english-version) | [Français](#version-française) | [中文](#中文版本)

---

## English Version

Thank you for considering contributing to Hiera-tf! This document explains how to submit new Signal classes and composite signal templates (JSON templates).

### Quick links

- Issues / PRs: Please open bug reports, enhancement suggestions, or small feature PRs.
- New Signal classes: Provide implementations in both Python and JavaScript, and add them to the repository signal implementation files (see below).
- Composite signal templates: Add your JSON file to `apps/templates` and declare which Signal classes are used in your PR description.

### Relevant files (reference implementations)

- Python Signal definitions: [packages/htf-py/htf/signals.py](packages/htf-py/htf/signals.py)
- JavaScript Signal definitions: [packages/htf-js/htf/signals.js](packages/htf-js/htf/signals.js)
- Composite signal templates directory: [apps/templates](apps/templates)

### Requirements (must follow)

- Each new Signal class must include both Python and JavaScript implementations to ensure consistent behavior across both runtimes.
- Clearly distinguish two Signal design types:
  - Value-based Signals: use `value_key`.
  - Signal-based Signals: use `signal_key` (or other signal keys).
  This distinction affects dependency management and runtime inputs.
- If a Signal depends on existing Signals (i.e., it is signal-based), you must:
  - Declare its dependencies clearly in the implementation, and
  - List the dependent Signal class names in the PR description,
  to avoid circular dependencies.
- For complex logic, add concise comments and a small runnable example showing the input `features` format and expected output.

#### Merge policy (dual-implementation requirement)

- Main rule (strict): New Signal classes must include both Python and JavaScript implementations in the same submission (add to `packages/htf-py/htf/signals.py` and `packages/htf-js/htf/signals.js`, or implement with the same class name in the respective files).
- Exception: If only one side can be provided initially, you must:
  - Mark the PR title/description with `partial: missing [python|js] implementation`, and
  - Open an Issue to track the missing implementation.
  Do not merge to main without explicit maintainer approval.

#### No look-ahead (hard requirement)

- Implementations must not read or depend on future data. Signals must compute using only the `features` available up to the current time (the window/last record provided by Timeframe). Any implementation that relies on future information will be rejected.

### Signal design conventions (important)

#### 1) Distinguish two classes of Signals

- Value-based: Use `value_key` to fetch numeric values from input `features` (e.g., price, volume), perform numeric operations, and return `0/1` (or the agreed numeric output convention).
- Signal-based: Use `signal_key` (or multiple signal keys) to read boolean/numeric results produced by other Signals and compute outputs based on those Signals' states or runtime statistics.

Note: If a Signal reads both `value_key` and `signal_key`, it is a hybrid; list all dependencies (value keys and signal keys) in the implementation and documentation.

#### 2) Python implementation conventions (based on `signals.py` style)

- Use classes or dataclasses, provide an optional `reset()` and a `__call__(features: Dict[str, Any]) -> int` method.
- Naming: Class names should use PascalCase, e.g. `MyNewSignal`.
- Parameters: Declare `value_key` or `signal_key`, window parameters, thresholds, etc., in the constructor/dataclass fields.

Example skeleton (Python)

```python
from dataclasses import dataclass
from typing import Any, Dict

@dataclass
class MyNewValueSignal:
    value_key: str
    window_size: int = 10

    def reset(self) -> None:
        # reset internal state
        pass

    def __call__(self, features: Dict[str, Any]) -> int:
        # read value from features
        val = features.get(self.value_key)
        # TODO: implement logic
        return 0  # must return 0/1 (or agreed numeric output)

@dataclass
class MyNewSignalBased:
    signal_key: str

    def reset(self) -> None:
        pass

    def __call__(self, features: Dict[str, Any]) -> int:
        base = features.get(self.signal_key)
        return 1 if base else 0
```

#### 3) JavaScript implementation conventions (based on `signals.js` style)

- Use ES5/ES6-style classes (repository uses `constructor` + `update(features)`), provide `reset()` and `update(features)`.
- Keep class names semantically consistent with Python; use `update` to run a single computation.

Example skeleton (JavaScript)

```javascript
class MyNewValueSignal {
  constructor({ value_key, window_size = 10 } = {}) {
    this.value_key = value_key;
    this.window_size = window_size;
  }

  reset() {}

  update(features) {
    const val = features ? features[this.value_key] : undefined;
    // TODO: implement logic
    return 0; // must return 0/1 (or agreed numeric output)
  }
}

class MyNewSignalBased {
  constructor({ signal_key } = {}) {
    this.signal_key = signal_key;
  }

  reset() {}

  update(features) {
    return features && features[this.signal_key] ? 1 : 0;
  }
}
```

Note: Refer to the files above for details on class names, method names, `features` input shape, and return conventions.

#### 4) Declare dependencies and avoid cycles

- For signal-based implementations, list dependent Signal class names in the PR description and ensure those dependencies exist in both Python and JS.
- Keep implementations single-responsibility and avoid heavy transformations of other Signals inside one Signal; if needed, document dependency order.
- Dependency resolution helpers exist in the repository (see `packages/htf-py/htf/timeframe.py`) to parse template/graph node dependencies and determine compute order. When submitting composite templates (JSON), list `used_signals` in template metadata or the PR description and avoid cycles; discuss special dependency rules in an Issue first.

#### 5) Tests and examples

- Tests are not mandatory but strongly recommended. Add one or two small unit tests or include a runnable example in the PR description (a small `features` input and expected output) so reviewers can quickly validate behavior.

#### 6) Adding implementations to the repository

- Python: Add classes to [packages/htf-py/htf/signals.py](packages/htf-py/htf/signals.py), keeping style consistent (dataclass or regular classes).
- JavaScript: Add classes to [packages/htf-js/htf/signals.js](packages/htf-js/htf/signals.js) and ensure export/registration matches the existing file.

### Contributing composite signal templates (JSON)

- Place JSON template files under `apps/templates/` (for example `apps/templates/my-composite-signal.json`).
- Recommended (optional): include a top-level `used_signals` array in the JSON metadata listing Signal class names used by the template. If you cannot add that field, list the dependencies in the PR description.

Example JSON

```json
{
  "name": "my-composite",
  "description": "Example composite signal template",
  "used_signals": ["SignalEMAFastSlowComparison", "SignalRunLengthReached"],
  "config": {
    "nodes": [],
    "edges": []
  }
}
```

- In the PR description, state which existing Signal classes the template depends on and which `value_key` (e.g. `close`, `volume`) or `signal_key` are required.

### PR submission suggestions

- New Signal class: open a branch including:
  - Python implementation changes in `packages/htf-py/htf/signals.py` (or add a new file and import from `signals.py`).
  - JavaScript implementation changes in `packages/htf-js/htf/signals.js`.
  - Documentation/examples in the PR description (or reference this CONTRIBUTING file).
  - (Optional) small unit tests or example data snippets.
- Composite templates: add the JSON file under `apps/templates/` and declare dependencies in the PR description.

### Review focus (what maintainers will check)

- Are Python and JS implementations semantically consistent (inputs/outputs, edge cases)?
- Are dependencies clear and free of cycles or ambiguous execution order?
- Are necessary validations present (parameter ranges, non-numeric protection, etc.)?
- Does the template clearly document used Signals, default parameters, and examples?

Thank you for your contribution!

If you are unsure about a Signal or template implementation, open an Issue describing your idea and expected behavior (include a minimal example) and maintainers will provide feedback.

---

## Version Française

Merci d'envisager de contribuer à Hiera-tf ! Ce document explique comment soumettre de nouvelles classes de Signal et des modèles de signaux composites (modèles JSON).

### Accès rapide

- Issues / PR : Merci d'ouvrir des rapports de bugs, des suggestions d'amélioration ou de petites PR de fonctionnalités.
- Nouvelles classes de Signal : Fournissez des implémentations en Python et en JavaScript, et ajoutez-les aux fichiers d'implémentation des signaux du dépôt (voir ci-dessous).
- Modèles de signaux composites : Ajoutez votre fichier JSON dans `apps/templates` et déclarez les classes de Signal utilisées dans la description de la PR.

### Fichiers pertinents (implémentations de référence)

- Définitions des Signaux Python : [packages/htf-py/htf/signals.py](packages/htf-py/htf/signals.py)
- Définitions des Signaux JavaScript : [packages/htf-js/htf/signals.js](packages/htf-js/htf/signals.js)
- Dossier des modèles de signaux composites : [apps/templates](apps/templates)

### Exigences (obligatoires)

- Chaque nouvelle classe de Signal doit fournir des implémentations Python et JavaScript pour assurer un comportement cohérent sur les deux environnements.
- Distinguez clairement deux types de conception de Signals :
  - Signals basés sur des valeurs : utilisez `value_key`.
  - Signals basés sur d'autres Signals : utilisez `signal_key` (ou d'autres clés de signal).
  Cette distinction affecte la gestion des dépendances et les entrées à l'exécution.
- Si un Signal dépend de Signals existants (c'est-à-dire s'il est signal-based), vous devez :
  - Déclarer clairement ses dépendances dans l'implémentation, et
  - Lister les noms des classes de Signal dépendantes dans la description de la PR,
  afin d'éviter les dépendances circulaires.
- Pour une logique complexe, ajoutez des commentaires concis et un petit exemple exécutable montrant le format des `features` en entrée et la sortie attendue.

#### Politique de fusion (exigence d'implémentation double)

- Règle principale (strict) : Les nouvelles classes de Signal doivent inclure les implémentations Python et JavaScript dans la même soumission (ajoutez-les dans `packages/htf-py/htf/signals.py` et `packages/htf-js/htf/signals.js`, ou implémentez avec le même nom de classe dans les fichiers respectifs).
- Exception : Si une seule implémentation peut être fournie initialement, vous devez :
  - Indiquer dans le titre/la description de la PR `partial: missing [python|js] implementation`, et
  - Ouvrir une Issue pour suivre l'implémentation manquante.
  Ne pas fusionner vers la branche principale sans approbation explicite d'un mainteneur.

#### Pas de look-ahead (exigence stricte)

- Les implémentations ne doivent pas lire ou dépendre de données futures. Les Signals doivent être calculés uniquement à partir des `features` disponibles jusqu'au moment courant (fenêtre/dernier enregistrement fourni par Timeframe). Toute implémentation reposant sur des informations futures sera rejetée.

### Conventions de conception des Signals (important)

#### 1) Distinguer deux catégories de Signals

- Basé sur la valeur : utilisez `value_key` pour récupérer des valeurs numériques dans `features` (par ex. price, volume), effectuer des opérations numériques et renvoyer `0/1` (ou la convention numérique convenue).
- Basé sur un Signal : utilisez `signal_key` (ou plusieurs clés) pour lire des résultats booléens/numériques produits par d'autres Signals et calculer la sortie en fonction de l'état ou des statistiques d'exécution de ces Signals.

Remarque : si un Signal lit à la fois `value_key` et `signal_key`, il est hybride ; listez toutes les dépendances (value keys et signal keys) dans l'implémentation et la documentation.

#### 2) Conventions d'implémentation Python (basées sur le style `signals.py`)

- Utilisez des classes ou dataclasses, fournissez une méthode optionnelle `reset()` et une méthode `__call__(features: Dict[str, Any]) -> int`.
- Nommage : noms de classes en PascalCase, ex. `MyNewSignal`.
- Paramètres : déclarez `value_key` ou `signal_key`, paramètres de fenêtre, seuils, etc., dans le constructeur/champs dataclass.

Exemple (Python)

```python
from dataclasses import dataclass
from typing import Any, Dict

@dataclass
class MyNewValueSignal:
    value_key: str
    window_size: int = 10

    def reset(self) -> None:
        # reset internal state
        pass

    def __call__(self, features: Dict[str, Any]) -> int:
        # read value from features
        val = features.get(self.value_key)
        # TODO: implement logic
        return 0  # must return 0/1 (or agreed numeric output)

@dataclass
class MyNewSignalBased:
    signal_key: str

    def reset(self) -> None:
        pass

    def __call__(self, features: Dict[str, Any]) -> int:
        base = features.get(self.signal_key)
        return 1 if base else 0
```

#### 3) Conventions d'implémentation JavaScript (basées sur le style `signals.js`)

- Utilisez des classes ES5/ES6 (le dépôt utilise `constructor` + `update(features)`), fournissez `reset()` et `update(features)`.
- Conservez des noms de classes cohérents avec Python ; utilisez `update` pour exécuter un calcul.

Exemple (JavaScript)

```javascript
class MyNewValueSignal {
  constructor({ value_key, window_size = 10 } = {}) {
    this.value_key = value_key;
    this.window_size = window_size;
  }

  reset() {}

  update(features) {
    const val = features ? features[this.value_key] : undefined;
    // TODO: implement logic
    return 0; // must return 0/1 (or agreed numeric output)
  }
}

class MyNewSignalBased {
  constructor({ signal_key } = {}) {
    this.signal_key = signal_key;
  }

  reset() {}

  update(features) {
    return features && features[this.signal_key] ? 1 : 0;
  }
}
```

Remarque : reportez-vous aux fichiers mentionnés ci-dessus pour les noms de classes, noms de méthodes, la forme de `features`, et les conventions de sortie.

#### 4) Déclaration des dépendances et évitement des cycles

- Pour les implémentations basées sur d'autres Signals, listez les noms des classes de Signal dépendantes dans la description de la PR et vérifiez qu'elles existent en Python et JS.
- Préférez la responsabilité unique et évitez les transformations complexes d'autres Signals au sein d'une seule implémentation ; si nécessaire, documentez l'ordre des dépendances.
- Des helpers de résolution d'ordonnancement existent dans le dépôt (voir `packages/htf-py/htf/timeframe.py`) pour analyser les dépendances de graphe de template et déterminer l'ordre de calcul. Lors de la soumission de templates composites (JSON), listez `used_signals` dans les métadonnées du template ou la description de la PR et évitez les cycles ; discutez d'abord des règles spéciales de dépendance dans une Issue.

#### 5) Tests et exemples

- Les tests ne sont pas obligatoires mais fortement recommandés. Ajoutez un ou deux petits tests unitaires ou incluez un exemple exécutable dans la description de la PR (un petit input `features` et la sortie attendue) afin que les reviewers puissent valider rapidement le comportement.

#### 6) Ajout des implémentations au dépôt

- Python : ajoutez les classes dans [packages/htf-py/htf/signals.py](packages/htf-py/htf/signals.py), en conservant un style cohérent (dataclass ou classes classiques).
- JavaScript : ajoutez les classes dans [packages/htf-js/htf/signals.js](packages/htf-js/htf/signals.js) et assurez-vous que l'export/l'enregistrement correspondent au fichier existant.

### Contribution de modèles de signaux composites (JSON)

- Placez les fichiers de template JSON sous `apps/templates/` (par exemple `apps/templates/my-composite-signal.json`).
- Recommandé (optionnel) : inclure un tableau `used_signals` au niveau supérieur dans les métadonnées JSON listant les noms des classes de Signal utilisées par le template. Si vous ne pouvez pas ajouter ce champ, listez les dépendances dans la description de la PR.

Exemple JSON

```json
{
  "name": "my-composite",
  "description": "Example composite signal template",
  "used_signals": ["SignalEMAFastSlowComparison", "SignalRunLengthReached"],
  "config": {
    "nodes": [],
    "edges": []
  }
}
```

- Dans la description de la PR, indiquez de quelles classes de Signal existantes dépend le template et quels `value_key` (par ex. `close`, `volume`) ou `signal_key` sont requis.

### Suggestions pour l'envoi d'une PR

- Nouvelle classe de Signal : ouvrez une branche incluant :
  - modifications Python dans `packages/htf-py/htf/signals.py` (ou ajout d'un nouveau fichier importé depuis `signals.py`).
  - modifications JavaScript dans `packages/htf-js/htf/signals.js`.
  - documentation/exemples dans la description de la PR (ou référence à ce fichier CONTRIBUTING).
  - (Optionnel) petits tests unitaires ou extraits de données d'exemple.
- Templates composites : ajoutez le fichier JSON sous `apps/templates/` et déclarez les dépendances dans la description de la PR.

### Points de revue (ce que les mainteneurs vérifieront)

- Les implémentations Python et JS sont-elles sémantiquement cohérentes (entrées/sorties, cas limites) ?
- Les dépendances sont-elles claires et exemptes de cycles ou d'un ordre d'exécution ambigu ?
- Les validations nécessaires sont-elles présentes (plages de paramètres, protection contre les valeurs non numériques, etc.) ?
- Le template documente-t-il clairement les Signals utilisés, les paramètres par défaut, et des exemples ?

Merci pour votre contribution !

Si vous avez un doute sur une implémentation de Signal ou de template, ouvrez une Issue décrivant l'idée et le comportement attendu (avec un exemple minimal) — les mainteneurs vous répondront.

---

## 中文版本

感谢你考虑为 Hiera-tf 做贡献！本文说明如何提交新的信号类（Signal）和复杂信号模板（JSON 模板）。

### 快速入口

- 日常 issue / PR：欢迎提交 bug 报告、改进建议或小功能 PR。
- 新增信号类：请同时提供 Python 与 JavaScript 两份实现，并将它们添加到代码库中的信号实现文件中（见下文）。
- 复杂信号模板：将 JSON 文件放入 `apps/templates`，并在 PR 描述中声明使用到的信号类。

### 相关文件（参考现有实现）

- Python 信号定义集合： [packages/htf-py/htf/signals.py](packages/htf-py/htf/signals.py)
- JavaScript 信号定义集合： [packages/htf-js/htf/signals.js](packages/htf-js/htf/signals.js)
- 复杂信号模板目录： [apps/templates](apps/templates)

### 总体要求（必须遵守）

- 每个新增信号类必须同时提供 Python 和 JavaScript 两个实现（以保证库在两端行为一致）。
- 明确区分两类信号的设计：
  - 基于数值的信号：使用 `value_key`。
  - 基于其它信号的信号：使用 `signal_key`（或其它信号键）。
  这一点会影响依赖管理与运行时数据输入。
- 如果信号依赖已有信号（即基于其它信号的信号），你必须：
  - 在实现中清晰声明依赖关系，并且
  - 在 PR 描述中列出依赖的信号类名，
  以避免循环依赖。
- 请为复杂逻辑添加简明注释与可运行/可复现的小示例（说明输入 `features` 的格式与期望输出）。

#### 合并政策（双端实现要求）

- 主规则（严格）：新增信号类必须在同一次提交中同时包含 Python 与 JavaScript 两端实现（分别放入 `packages/htf-py/htf/signals.py` 与 `packages/htf-js/htf/signals.js`，或在各自文件中以相同类名实现）。
- 例外：若只能先提供一端实现，你必须：
  - 在 PR 标题与描述中明确标注 `partial: missing [python|js] implementation`，并且
  - 同时打开一个 Issue 跟踪另一端的补充实现。
  在没有维护者明确批准前，不应合并到主分支。

#### 禁止 look-ahead（硬性原则）

- 所有信号实现禁止读取或依赖“未来”数据。信号必须仅基于提供到当前时间点的 `features`（由 Timeframe 提供的窗口/最后记录）进行计算。任何依赖未来信息的实现将被拒绝合并。

### 信号类设计规范（重要）

#### 1) 区分两类信号

- 值驱动（value-based）：使用 `value_key` 从输入特征（`features`）里获取数值（例如价格、volume 等），进行数值运算并返回 `0/1`（或项目既定的输出约定）。
- 信号驱动（signal-based）：使用 `signal_key`（或若干 signal keys）读取已有信号的布尔/数值结果，基于这些信号的状态或运行期统计计算输出。

注意：如果你的信号需要同时读取 `value_key` 与 `signal_key`，它是混合型；请在实现与文档里列出所有依赖（value keys 与 signal keys）。

#### 2) Python 实现约定（基于现有 `signals.py` 风格）

- 使用类或 dataclass，提供 `reset()`（可选）和 `__call__(features: Dict[str, Any]) -> int` 方法。
- 命名：类名使用大驼峰（PascalCase），如 `MyNewSignal`。
- 参数：在构造函数 / dataclass 字段中声明 `value_key` 或 `signal_key`、窗口参数、阈值等。

示例骨架（Python）

```python
from dataclasses import dataclass
from typing import Any, Dict

@dataclass
class MyNewValueSignal:
    value_key: str
    window_size: int = 10

    def reset(self) -> None:
        # reset internal state
        pass

    def __call__(self, features: Dict[str, Any]) -> int:
        # read value from features
        val = features.get(self.value_key)
        # TODO: implement logic
        return 0  # must return 0/1 (or agreed numeric output)

@dataclass
class MyNewSignalBased:
    signal_key: str

    def reset(self) -> None:
        pass

    def __call__(self, features: Dict[str, Any]) -> int:
        base = features.get(self.signal_key)
        return 1 if base else 0
```

#### 3) JavaScript 实现约定（基于现有 `signals.js` 风格）

- 使用 ES5/ES6 风格类（仓库中使用 `constructor` + `update(features)`），提供 `reset()` 与 `update(features)`。
- 命名保持与 Python 语义一致；使用 `update` 来执行一次计算。

示例骨架（JavaScript）

```javascript
class MyNewValueSignal {
  constructor({ value_key, window_size = 10 } = {}) {
    this.value_key = value_key;
    this.window_size = window_size;
  }

  reset() {}

  update(features) {
    const val = features ? features[this.value_key] : undefined;
    // TODO: implement logic
    return 0; // must return 0/1 (or agreed numeric output)
  }
}

class MyNewSignalBased {
  constructor({ signal_key } = {}) {
    this.signal_key = signal_key;
  }

  reset() {}

  update(features) {
    return features && features[this.signal_key] ? 1 : 0;
  }
}
```

备注：实现细节请参考上述两个文件（类名、方法名、`features` 输入形状与返回约定）。

#### 4) 依赖声明与避免循环

- 对于基于其它信号的实现，请在 PR 描述中明确列出依赖的信号类名，并确认这些依赖在 Python 与 JS 中都已存在。
- 实现中尽量保持单一职责，避免在一个信号内部对其它信号做复杂变形；如确有必要，请写清楚依赖顺序。
- 仓库中已有用于从模板/图结构解析节点依赖并决定计算顺序的辅助逻辑（参见 `packages/htf-py/htf/timeframe.py`）。提交复合模板（JSON）时请在模板元数据或 PR 描述中列出 `used_signals`，并避免循环依赖；如需特殊依赖解析规则，请先在 Issue 中讨论。

#### 5) 测试与示例

- 提交测试不是强制的，但强烈建议添加一两个小单元测试；或在 PR 描述中给出可运行的小示例（包含一小段 `features` 输入与期望输出），以便评审者快速验证行为一致性。

#### 6) 将实现添加到仓库

- Python：把类添加到 [packages/htf-py/htf/signals.py](packages/htf-py/htf/signals.py)，保持风格一致（dataclass 或常规类）。
- JavaScript：把类添加到 [packages/htf-js/htf/signals.js](packages/htf-js/htf/signals.js)，并确保导出/注册方式与现有文件一致。

### 贡献复杂信号模板（JSON）

- 将 JSON 模板文件放入 `apps/templates/` 目录（例如 `apps/templates/my-composite-signal.json`）。
- 建议（推荐但可选）：在 JSON 顶层元数据中包含字段 `used_signals`（数组），列出本模板用到的信号类名。若无法添加该字段，请在 PR 描述中明确列出依赖的信号。

示例 JSON

```json
{
  "name": "my-composite",
  "description": "Example composite signal template",
  "used_signals": ["SignalEMAFastSlowComparison", "SignalRunLengthReached"],
  "config": {
    "nodes": [],
    "edges": []
  }
}
```

- 在 PR 描述中说明：该模板依赖哪些已存在的信号类，以及需要哪些 `value_key`（例如 `close`、`volume`）或 `signal_key`。

### PR 提交流程建议

- 新增信号类：打开一个分支，包含：
  - `packages/htf-py/htf/signals.py` 的 Python 实现修改（或新增文件并从 `signals.py` 导入）。
  - `packages/htf-js/htf/signals.js` 的 JavaScript 实现修改。
  - PR 描述中的文档/示例（或引用本 CONTRIBUTING）。
  - （可选）简单单元测试或示例数据片段。
- 复杂模板：将 JSON 文件放入 `apps/templates/` 并在 PR 描述中注明依赖。

### 审查要点（维护者会关注）

- Python 与 JS 实现是否语义一致（输入/输出、边界条件）？
- 依赖关系是否清晰，且不存在循环或不明确的执行顺序？
- 是否包含必要的验证（参数范围、非数值保护等）？
- 模板是否清晰标注了依赖信号、默认参数与示例？

感谢你的贡献！

如果你不确定某个信号/模板的实现方式，建议先开一个 Issue 描述你的想法与预期行为（含最小示例），维护者会给出反馈与建议。
