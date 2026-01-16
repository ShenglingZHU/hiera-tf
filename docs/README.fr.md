# Hiera-TF

Languages:

- [English README](README.en.md)
- [README en français](README.fr.md) (actuel)
- [中文 README](README.zh-CN.md)

## 1. Vue d'ensemble du projet

### 1.1 Introduction

Hiera-TF est un cadre hiérarchique de construction et de visualisation de signaux multi-échelles temporelles. Il replie les signaux de niveaux temporels supérieurs (HTF) en "fenêtres autorisées" sur l'échelle temporelle la plus fine (LTF) pour contrôler le comportement en aval, et fournit des vues multiples et des capacités d'export pour révision et reproductibilité.

### 1.2 Scénarios d'utilisation

- Analyse conjointe de séries temporelles fines et grossières, avec contraintes des signaux supérieurs sur les niveaux inférieurs.
- Construction de signaux hiérarchiques/ composites et observation de leurs effets en intervalles temporels.
- Validation rapide des définitions de signaux, des seuils et des relations hiérarchiques via la visualisation.

Exemples :

- Filtrage multi-période pour trading et explication de signaux
- Segmentation d'anomalies et attribution pour métriques opérationnelles / capteurs
- Alignement d'événements et filtrage conditionnel pour données expérimentales
- Vérification de règles inter-échelles et sorties reproductibles pour la recherche

## 2. Démarrage rapide

### 2.1 UI statique locale

- Ouvrez directement `apps/ui-static/index.html` (pas de build requis).
- Ou lancez un serveur statique depuis la racine du dépôt (recommandé ; facilite le chargement de `packages/htf-js`) :

```powershell
python -m http.server 8000
```

Ouvrez `http://localhost:8000/apps/ui-static/index.html`.

- Note réseau/dépendances : l'UI charge Plotly, XLSX et Google Fonts depuis des CDN. En mode hors-ligne, le tracé et l'import/export Excel peuvent être limités (CSV reste utilisable).

### 2.2 Utilisation avec Python (installation, demos minimales)

- Environnement : Python 3.9+.
- Démos minimales exécutables (après installation, recommandé) :

```powershell
python -m pip install -e packages/htf-py
python -m htf.demos.demo_py_1
python -m htf.demos.demo_py_2
python -m htf.demos.demo_py_3
```

- Exécution sans installation (compatibilité ascendante) :

```powershell
python packages/htf-py/demos/demo-py-1.py
python packages/htf-py/demos/demo-py-2.py
python packages/htf-py/demos/demo-py-3.py
```

- Utiliser le code source directement : ajoutez `packages/htf-py` à `PYTHONPATH`, ou utilisez les wrappers de demo fournis (ils ajustent temporairement `sys.path`).

### 2.3 Problèmes courants

- Permissions/stratégies de sécurité du navigateur : si l'ouverture via `file://` est restreinte, utilisez un serveur statique local.
- UI qui ne s'ouvre pas ou scripts 404 : démarrez le serveur statique depuis la racine du dépôt, ou ajustez `data-htf-base` pour pointer vers `packages/htf-js/htf`.
- XLSX/Plotly indisponible : vérifiez la connectivité/CDN ou utilisez CSV.
- Erreurs liées à `pandas` / `bokeh` : ce sont des dépendances optionnelles nécessaires uniquement pour certaines exportations/visualisations.

## 3. Contexte et motivation

### 3.1 Problèmes visés & limites des outils existants

- Les logiques de signaux sont souvent dispersées et difficiles à réutiliser : la logique multi-échelle vit fréquemment dans des scripts ad-hoc, ce qui complique définition unifiée, audit et comparaison de versions.
- La visualisation multi-période est courante, mais superposer des niveaux ne signifie pas contrainte hiérarchique : les plateformes montrent souvent des superpositions sans structurer les conditions supérieures en "fenêtres autorisées" pour les niveaux inférieurs.
- Absence de flux de bout en bout : mettre en œuvre le gating inter-échelles + composition de signaux + visualisation + export demande souvent beaucoup de code de colle.

### 3.2 Différences apportées par Hiera-TF

- Traite les contraintes hiérarchiques comme un concept de premier ordre plutôt que du gating ad-hoc.
- Rend les "masks" de gating hiérarchique configurables, composables et exportables, et les relie à un graphe de dépendance de signaux (DAG).
- Implémentations Python/JS et une UI forment une boucle fermée pour définition, validation et visualisation.

## 4. Concepts clés

### Principe central : centration sur le signal

Hiera-TF considère les "signaux (événements/conditions)" comme l'unité d'analyse principale :

- Convertit des séries numériques en sémantiques interprétables : déclenchements/non-déclenchements et masques d'intervalle valides/invalides.
- Plus proche du processus de décision : quand agir et pourquoi un déclencheur est apparu.

### 4.1 Timeframe / LTF / HTF

- Timeframe : vue d'une échelle temporelle qui maintient une fenêtre glissante et l'état du signal.
- LTF : échelle la plus fine.
- HTF : échelles plus grossières relatives à LTF ; plusieurs niveaux HTF peuvent exister.

### 4.2 Feature

- Dictionnaire de features calculé depuis la fenêtre, produit par un `FeatureModule` ou un `feature_fn`.
- Les fonctions de signal ne dépendent que des `features` pour assurer la modularité.

### 4.3 Signal

Les signaux retournent typiquement 0/1 et sont des unités de calcul à état. Exemples :

- `ValueVsRollingPercentile` : compare la valeur courante à un percentile historique et déclenche si la condition est satisfaite.
- `SignalRunLengthReached` : déclenche après que le signal de base a couru pendant `min_run_length`, peut étendre la queue.
- `SignalRunInterrupted` : déclenche quand un signal de base en cours est interrompu, peut étendre la queue.
- `SignalIntervalBetweenMarkers` : retourne 1 de façon continue entre un marqueur de début et un marqueur de fin ; il s'agit d'un signal d'intervalle.

### 4.4 Coordinator (coordination multi-échelle)

- `SimpleHTFCoordinator` : autorise LTF seulement si tous les signaux HTF sont vrais.
- `HierarConstraintCoordinator` : effectue le gating niveau par niveau selon l'ordre, mieux adapté pour des structures multi-niveaux.

### 4.5 Hierarchy Constraint (contraintes hiérarchiques/combinaisons)

- Utiliser des signaux d'échelle supérieure pour limiter les intervalles effectifs des signaux d'échelle inférieure, évitant l'amplification du bruit inter-échelles.
- Les signaux de contrainte en aval peuvent être sélectionnés dans l'UI et superposés pour visualisation.

## 5. Fonctionnalités

### 5.1 Composabilité

- Données/échelles/signaux/gating sont librement composables : une même donnée peut produire plusieurs timeframes, les signaux peuvent être combinés entre échelles, et les masques de gating peuvent être réutilisés.
- Les relations de composition sont explicites, facilitant le traçage et l'export.

### 5.2 Graphe de signaux (DAG) / Arbre de signaux

- Les signaux peuvent être organisés en graphe de dépendances : la sortie d'un signal alimente un autre, formant des chaînes de règles configurables.
- Des opérateurs de composition explicites (p.ex. intersection) facilitent la revue et la persistance en tant que templates.

### 5.3 Contraintes hiérarchiques & Gating

- Fonction centrale : replier les signaux de contrainte HTF en masques d'autorisation pour LTF, gateant les signaux et événements inférieurs.
- Gating composite : plusieurs niveaux de contrainte peuvent être combinés (intersection/AND) et la contrainte devient un actif réutilisable.

### 5.4 Trois modes de visualisation

- LTF only : superposition des fenêtres autorisées des niveaux supérieurs sur la série inférieure pour montrer les intervalles autorisés/exclus.
- Parallel series : séries multiples juxtaposées pour observer synchronisation et différences.
- Stitched series : vue condensée mettant en évidence ce que le gating a modifié.

### 5.5 Export & Auditabilité

- Exportable : signaux finaux, masques hiérarchiques, chaînes de dépendance des signaux, et intermédiaires clés (seuils, run-length, EMA, etc.).
- Accent sur l'explicabilité et l'auditabilité pour faciliter la revue et la reproduction.

### 5.6 Injection de signaux externes

- Supporte l'introduction d'annotations/événements/connaissances experts externes en tant que nœuds signaux, combinables avec les signaux internes et participant au gating.
- Permet aux règles empiriques difficiles à formaliser d'entrer dans une pipeline d'analyse reproductible.

### 5.7 Extensibilité

- Les types de signaux et templates complexes sont extensibles (implémentations additionnelles et enregistrement).
- Supporte plusieurs séries temporelles et structures multi-échelles ; les limites d'échelle dépendent des volumes de données et de la performance.

### 5.8 Choix de conception & limites

- La librairie cœur ne réalise pas de rééchantillonnage automatique ni de nettoyage de données ; les données alignées doivent être fournies en amont.
- Le point fort est la chaîne de dépendances + composition + gating, et non un solveur numérique général inter-séries.

**Non objectif** : Hiera-TF se concentre sur "signaux événementiels/règles + gating hiérarchique + configuration composable + export explicable", et n'a pas pour objectif d'être :

- Une plateforme générale de décomposition temps-fréquence (ondelettes/EMD, etc.)
- Une plateforme de modélisation prédictive/machine learning
- Un système complet d'exécution/ backtest pour trading

## 6. Structure du dépôt

- `apps/ui-static` : démo UI statique locale et visualisation (Plotly + XLSX via CDN).
- `apps/templates`: répertoire d'exemples de templates de signaux pour l'UI (optionnel, templates sont stockés dans le stockage local du navigateur).
- `packages/htf-py` : librairie Python cœur et demos, inclut visualisation optionnelle Bokeh.
- `packages/htf-js` : implémentation JS utilisée par l'UI et alignée avec l'implémentation Python, inclut des demos.
- `LICENSE` / `NOTICE` / `THIRD_PARTY_NOTICES` : licences et mentions tierces.

## 7. Guide d'utilisation

### 7.1 Utilisateur UI (démo) : importer des données, configurer les timeframes, visualiser hiérarchie/signaux

- Ouvrez l'UI, cliquez Add pour importer CSV/XLSX et mapper les colonnes de temps et de valeurs.
- Définissez les timeframes (p.ex. 5m/15m) et les méthodes d'agrégation.
- Dans Signals, configurez les signaux et dépendances, sélectionnez les signaux de contrainte en aval, et sauvegardez/importez des templates depuis le stockage local du navigateur (templates dans `apps/templates` peuvent aussi être importés).
- Configurez les options d'affichage dans Viz.

**Tutoriel détaillé** : consultez le [UI static page usage guide](../apps/README.md#french-version) pour la description complète de l'interface, des workflows et de la configuration des signaux.

### 7.2 Développeurs (Python)

#### 7.2.1 Exemple minimal : construire un timeframe et un signal de base

```python
from htf import TimeframeConfig, TimeframeView, ValueVsRollingPercentile

signal = ValueVsRollingPercentile(value_key="TEMP", window_size=12, percentile=80, comparison="lt")
tf = TimeframeView(
    config=TimeframeConfig(name="1h", window_size=6, max_buffer=200, role="LTF"),
    signal_fn=lambda feats: signal(feats),
)

for record in records:  # record doit inclure un timestamp et TEMP
    tf.on_new_record(record)

print(tf.signal, tf.features)
```

#### 7.2.2 Modules de signaux/features personnalisés

- Hériter de `FeatureModule` et implémenter `compute(window)`.
- Ou implémenter une classe à état `__call__(features)` et l'utiliser comme `signal_fn`.

#### 7.2.3 Appliquer des contraintes hiérarchiques et stratégies de coordination

- Utiliser `HierarConstraintCoordinator(order=[...])` pour effectuer le gating par niveau.
- Référez-vous à `packages/htf-py/demos/demo-py-3.py`.

#### 7.2.4 Sortie & visualisation (dépendances optionnelles)

- `export_buffer_as_dataframe` / `export_signal_dataframe` nécessitent `pandas`.
- `htf.viz.multi_timeframe_plot` nécessite `bokeh`.

**Tutoriel détaillé** : consultez le [htf-py guide](../packages/htf-py/README.md#version-française) pour installation complète, structure, demos et exemples d'utilisation.

### 7.3 Développeurs (JavaScript)

L'implémentation JavaScript sert principalement l'UI statique et vise la parité fonctionnelle avec l'implémentation Python.

#### 7.3.1 Exemple minimal : construire un timeframe et un signal de base

```javascript
const HTF = require("./index.js");

// Créer la config de timeframe
const config = new HTF.TimeframeConfig({
  name: "5m-series",
  window_size: 6,
  max_buffer: 128,
  role: "LTF",
});

// Créer la vue timeframe
const timeframe = new HTF.TimeframeView({ config });

// Pousser les enregistrements
for (const record of records) {
  timeframe.on_new_record(record);
}

console.log("features:", timeframe.features);
console.log("signal:", timeframe.signal);
```

#### 7.3.2 Exécuter les demos

```bash
node packages/htf-js/demos/demo-js-1.js
node packages/htf-js/demos/demo-js-2.js
node packages/htf-js/demos/demo-js-3.js
```

#### 7.3.3 Intégration avec l'UI statique

L'UI statique (`apps/ui-static`) charge `htf-js` comme module ES. Depuis la racine du dépôt :

```bash
python -m http.server 8000
# Ouvrez http://localhost:8000/apps/ui-static/index.html
```

**Tutoriel détaillé** : consultez le [htf-js guide](../packages/htf-js/README.md#version-française) pour la structure du projet, les demos et l'intégration UI.

## 8. Feuille de route / État

### 8.1 Stabilité & limitations connues

- Projet en itération; les API et définitions de signaux peuvent évoluer.
- Pas de package PyPI / npm publié; il est recommandé d'utiliser le code source et les demos.
- L'UI dépend de CDN (Plotly/XLSX/Fonts); usage hors-ligne nécessite le remplacement de ces ressources.
- La librairie cœur n'effectue pas de rééchantillonnage ni de nettoyage des données ; les données doivent être préparées en amont.

### 8.2 Plans futurs

- Étendre les classes de signaux et affiner les signaux complexes selon les retours de la communauté.
- Développer des applications Python autour des séries temporelles (p.ex. outils de trading pilotés par signaux).

### 8.3 Retour & contribution

Vos retours sont bienvenus sur :

- **Flux d'interaction** : importer → organiser multi-échelles → définir/composer signaux → configurer gating → changer de vue → exporter — est-ce fluide, où sont les points de friction ?
- **Bugs UI** : problème de mise en page, adaptation, latence de rendu, différences entre navigateurs — joindre captures/vidéos et étapes de reproduction si possible.
- **Définitions de signaux** : proposez des définitions utiles (trading/ops/capteurs/recherche) ou des signaux complexes à transformer en templates.

## 9. Licence & disclaimer

### 9.1 Licence

- Apache License 2.0 — voir `LICENSE` et `NOTICE`.

### 9.2 Mentions des tiers

- Voir `THIRD_PARTY_NOTICES` ; l'UI utilise également Plotly, XLSX et Google Fonts via CDN.

### 9.3 Disclaimer

- Les signaux et visualisations du projet sont destinés à la recherche/éducation uniquement et ne constituent pas des conseils d'investissement ou de trading.
