# Hiera-TF Time Series Console - User Guide

**Document Version**: 1.0  
**Generated Date**: 2026-01-14

**Select Your Language / Choisissez votre langue / 选择您的语言:**

- [English](#english-version) | [Français](#french-version) | [中文](#chinese-version)

---

## English Version

### Hiera-TF Time Series Console - Beginner's Guide

### 1. Platform Introduction

Hiera-TF is a multi-timeframe hierarchical signal visualization tool designed for analyzing time series data and creating, configuring, and visualizing various technical signals across different time scales. The tool supports hierarchical structure analysis from fine-grained (LTF - Lowest Time Frame) to coarse-grained (HTF - Higher Time Frame).

### 2. Interface Layout

#### 2.1 Main Interface Structure

- **Sidebar (Left)**: Displays all created time series listed from fine to coarse (LTF on top)
- **Main Area (Center)**:
  - **Plot Area**: Displays charts of time series data and signals
  - **Legend Area**: Shows descriptions of graphic elements
- **Top Toolbar**: Contains language switcher (EN/FR/CN) and plot mode selector

#### 2.2 Key Control Elements

- **Add Button**: Located at the top of the sidebar, used to add new time series
- **Plot Mode Dropdown**: Select plot mode (LTF only/Parallel series/Stitched series)
- **Composite Hierarchy Constraint Toggle**: Enable/configure intersection of multiple hierarchy constraint signals

### 3. Workflow Guide

#### Step 1: Add Time Series

1. **Click the "Add" button** in the left sidebar to open the configuration wizard

2. **The wizard contains four steps**, accessible via top tabs:

   - Source (Data source)
   - Scale (Time scale)
   - Signals (Signal configuration)
   - Viz (Visualization)

---

#### Step 2: Configure Data Source

##### 2.1 Upload Data File

- **Supported formats**: CSV or XLSX files
- **File requirements**: Must contain time columns and value columns
- Click "Choose file" button to select a local file

##### 2.2 Time Column Mapping

The system will automatically recognize column names and attempt to match time units. You need to confirm or manually specify:

- **Year**: Select the corresponding year column
- **Month**: Select the corresponding month column
- **Day**: Select the corresponding day column
- **Hour**: Select the corresponding hour column
- **Minute**: Select the corresponding minute column
- **Second**: Select the corresponding second column

**Note**: If a time unit doesn't exist in your data, leave it empty

##### 2.3 Select Value Column

Select the column containing numerical values for analysis from the dropdown menu

##### 2.4 Existing Data Files

If files have been uploaded previously, you can select from the "Used data files" list to reuse them

---

#### Step 3: Define Time Scale

##### 3.1 Scale Definition

Set the aggregation scale for the time series:

- **Numeric input**: Enter an integer (e.g., 1, 5, 15, 60)
- **Unit selection**: Choose time unit from dropdown (year/month/day/hour/minute/second)
- **Example**: Enter "15" and select "minute" to aggregate data into 15-minute timeframes

##### 3.2 Aggregation Method

Choose how to aggregate fine-grained data to the specified scale:

- **Mean**: Calculate average value within time period
- **Min**: Take minimum value within time period
- **Max**: Take maximum value within time period
- **Median**: Take median value within time period
- **Percentile**: Take specified percentile (requires additional percentile value, e.g., 50 for median)

**Important**: Each time series must have a unique scale

---

#### Step 4: Configure Signals

Signals are logical rules used to detect specific patterns or conditions in time series.

##### 4.1 Signal List Interface (Left Panel)

- Click **"Add"** button to add new signals
- Added signals display in tree structure, click to expand/collapse for details
- **Collapse all** button: Collapse all signals with one click

##### 4.2 Signal Picker

Clicking Add opens the signal picker with three tabs:

**A. Signal Types** - Built-in signal types:

1. **Comparison Signals**

   - `ValueVsRollingPercentile`: Compare value with rolling percentile
   - `ValueVsRollingPercentileWithThreshold`: Compare value with rolling percentile with threshold
   - `SignalValueVsPrevious`: Compare value with previous value

2. **EMA Signals (Exponential Moving Average)**

   - `SignalEMAFastSlowComparison`: Fast/slow EMA crossover comparison
   - `SignalEMADiffVsHistoryPercentile`: EMA difference vs. history percentile comparison

3. **Run Length Signals**

   - `SignalRunLengthReached`: Signal sustained for specified length
   - `SignalRunLengthReachedHistoryPercentile`: Run length reaches history percentile
   - `SignalRunInterrupted`: Signal run interruption detection
   - `SignalRunLengthVsHistoryPercentile`: Run length vs. history percentile comparison

4. **Interval Signals**

   - `SignalIntervalBetweenMarkers`: Interval between two markers
   - `SignalNthTargetWithinWindowAfterTrigger`: Nth target within window after trigger

5. **Composite Signals**

   - `SignalIntersection`: Intersection of multiple signals
   - `SignalValueVsLastTrueReference`: Value vs. last true reference comparison
   - `SignalValueVsLastTargetForBase`: Target comparison based on base signal
   - `SignalValueVsLastSignalRunStatistic`: Value vs. last signal run statistic comparison

**B. External Signal** - Import external data as signals

**C. Templates** - Use or import saved signal configuration templates

##### 4.3 Configure Signal Parameters (Right Panel)

After selecting a signal, the right panel displays parameter configuration interface:

**Common Parameter Types**:

- **value_key**: Select value column to analyze
- **signal_key**: Select dependent signal (shown as "signal dependency")
- **window_size / history_window**: Rolling window size
- **percentile**: Percentile value (0-100)
- **comparison**: Comparison operator (gt = greater than, lt = less than)
- **min_run_length**: Minimum run length
- **ema_period_1 / ema_period_2**: EMA period parameters

After configuration, click **"Save template"** to save as template for future use

##### 4.4 Downstream Hierarchy Constraint Signal

At the bottom of the signal list, select a signal as the **downstream hierarchy constraint signal**. This signal will filter or constrain signal activation in lower timeframes.

---

#### Step 5: Configure Visualization

##### 5.1 Graphic Elements List

- Click **"+ Add element"** to add visualization elements
- Supported element types:
  - **Line**: Draw continuous line of values or signals
  - **Scatter**: Draw discrete points
  - **Bar**: Draw bar chart
  - **Area**: Draw filled area
  - **Markers**: Display markers at signal activation points

##### 5.2 Element Configuration Options

Each graphic element can be configured with:

- **Data source**: Select column or signal to plot
- **Color**: Choose line/marker color
- **Line style**: Solid, dashed, dotted, etc.
- **Line width**: Set line thickness
- **Marker style**: Circle, square, triangle, etc.
- **Opacity**: Set transparency (0-1)

##### 5.3 Hierarchy Constraint Signal Visualization

If a downstream hierarchy constraint signal is selected, configure its display on the chart:

- **Style**:
  - `background`: Display as background area
  - `solid`: Solid border
  - `dashed`: Dashed border
- **Color and Opacity**: Customize display effect

##### 5.4 Adjust Drawing Priority

Drag items in the graphic elements list to adjust drawing order (higher items draw first, lower items draw on top)

---

#### Step 6: Complete Configuration

1. At the bottom of the wizard, status changes from "Incomplete" to "Complete"
2. Click **"Next"** button to navigate between steps, or click **"Finish"** to complete configuration
3. New time series will appear in the left sidebar list

---

## 4. Multi-Time Series Operations

### 4.1 Create Hierarchical Structure

Add multiple time series in order from fine to coarse:

- LTF (Lowest Time Frame): Fine-grained (e.g., 1 minute, 5 minutes)
- HTF (Higher Time Frame): Coarse-grained (e.g., 1 hour, 1 day)

### 4.2 Plot Mode

Choose how to display multiple time series:

- **LTF only**: Display only the finest time frame
- **Parallel series**: Display all series in independent subplots
- **Stitched series**: Stitch data from multiple timeframes together

### 4.3 Composite Hierarchy Constraint

1. Click **"Setup"** button in the plot toolbar
2. In the dialog that appears:
   - Select hierarchy constraint signals to include (multiple selection)
   - Configure plot style, color, and opacity
   - Set export options (include dependency signals, value columns, etc.)
3. Enable the toggle on the left to activate composite constraint

---

## 5. Data Export

### 5.1 Export Single Series Signals

1. Right-click a time series in the left list, select **"Export"**
2. In the export dialog:
   - **Signal Selection**: Check signals to export
   - **Export Options**:
     - Apply hierarchy constraint filter: Apply hierarchy constraint filter
     - Include dependency signals: Include dependent signals
     - Include value columns: Include original value columns
   - **Save Settings**:
     - Choose save directory
     - Enter file name
     - Select file format (CSV or XLSX)
3. Click **"Save"** to complete export

### 5.2 Export Composite Hierarchy Constraint Results

In the composite hierarchy constraint setup dialog, you can directly configure export options and save intersection results

---

## 6. Template Management

### 6.1 Save Signal Template

1. After configuring signal parameters, click **"Save template"**
2. Enter template name
3. Template will be saved to browser local storage

### 6.2 Use Templates

In the "Templates" tab of the signal picker, select saved templates to quickly create signals with the same configuration

### 6.3 Import/Export Templates

- **Import**: In the templates tab, click "Import templates" button, select JSON format template file
- **Export**: Template data is stored in browser local storage, can be exported via browser developer tools

---

## 7. Common Use Cases

### Case 1: Financial Market Trend Analysis

1. Import stock price data (containing date and closing price)
2. Create multiple timeframes: 1 minute, 5 minutes, 15 minutes, 1 hour, 1 day
3. Add EMA crossover signals to detect buy/sell opportunities
4. Use hierarchy constraints to ensure long-term trend aligns with short-term signals

### Case 2: Operations Monitoring Data Anomaly Detection

1. Import system metrics data (CPU, memory usage, etc.)
2. Create 1-minute and 10-minute timeframes
3. Use `ValueVsRollingPercentile` to detect abnormally high values
4. Use `SignalRunLengthReached` to detect sustained anomalies

### Case 3: Sensor Data Pattern Recognition

1. Import sensor-collected time series
2. Create multi-level time scales to capture patterns at different frequencies
3. Use composite signals to detect specific event sequences
4. Export labeled data for machine learning training

---

## 8. Tips and Best Practices

### 8.1 Performance Optimization

- For large datasets, recommend preprocessing and downsampling first
- Avoid creating too many fine-grained timeframes
- Set signal parameters reasonably to reduce computational burden

### 8.2 Signal Dependency Management

- Some signals depend on other signals (e.g., `SignalRunLengthReached` depends on base signal)
- Ensure dependent signals are created before being referenced
- Signal dependencies are displayed as hierarchical structure in tree list

### 8.3 Data Quality Requirements

- Time columns must be correctly parseable as datetime
- Value columns must be numeric type
- Missing values will be skipped during processing

### 8.4 Browser Compatibility

- Recommend modern browsers (Chrome, Firefox, Edge)
- JavaScript must be enabled
- Large datasets may require more memory

---

## 9. Quick Operations

| Operation | Method |
| -------------------- | ------------------------------------------------------- |
| Add time series | Click "Add" button in sidebar |
| Edit series | Right-click item -> Configure |
| Delete series | Right-click item -> Delete |
| Export data | Right-click item -> Export |
| Switch language | Click EN/FR/CN at top right |
| Collapse all signals | Click "Collapse all" in signal config page |
| Save template | Click "Save template" after configuring signals |

---

## 10. Troubleshooting

### 10.1 File upload failed

- Check that the file format is CSV or XLSX
- Confirm the file contains time and value columns
- Try testing with a simpler file structure

### 10.2 Incorrect time column mapping

- Manually adjust column mapping for each time unit
- Click "Reset mapping" to re-run automatic detection
- Ensure column names are clear and explicit

### 10.3 Signal not displayed

- Check if signal parameters are configured correctly
- Confirm visualization elements have been added
- Check if signal dependencies are satisfied

### 10.4 Chart not displayed

- Confirm at least one time series has been added
- Check if there are visualization elements
- Check browser console for errors

---

## 11. Conclusion

Hiera-TF is a powerful multi-timeframe analysis tool suitable for scenarios requiring time series data analysis at different time scales. Through this guide, you should be able to:

- Import and configure time series data
- Create multi-level timeframe hierarchical structures
- Configure various technical signals for pattern detection
- Use hierarchical constraints to ensure signal consistency across timeframes
- Visualize analysis results and export data

We recommend starting with simple single-timeframe, single-signal configurations, then gradually exploring more complex multi-level constraint and composite signal features.

For any questions, please refer to the project documentation or submit issues for feedback.

---

## French Version

### Console de séries temporelles Hiera-TF - Guide du débutant

### 1. Introduction à la plateforme

Hiera-TF est un outil de visualisation de signaux hiérarchiques multi-temporels conçu pour analyser des données de séries temporelles et créer, configurer et visualiser divers signaux techniques à travers différentes échelles de temps. L'outil prend en charge l'analyse de la structure hiérarchique, du plus fin (LTF - Lowest Time Frame) au plus grossier (HTF - Higher Time Frame).

### 2. Disposition de l'interface

#### 2.1 Structure principale de l'interface

- **Barre latérale (gauche)** : Affiche toutes les séries temporelles créées, classées de la plus fine à la plus grossière (LTF en haut)
- **Zone principale (centre)** :
  - **Zone de tracé** : Affiche les graphiques des données de séries temporelles et des signaux
  - **Zone de légende** : Montre les descriptions des éléments graphiques
- **Barre d'outils supérieure** : Contient le sélecteur de langue (EN/FR/CN) et le sélecteur de mode de tracé

#### 2.2 Éléments de contrôle clés

- **Bouton Ajouter** : Situé en haut de la barre latérale, utilisé pour ajouter de nouvelles séries temporelles
- **Menu déroulant Mode de tracé** : Sélectionner le mode de tracé (LTF uniquement / Séries parallèles / Séries cousues)
- **Basculer la contrainte de hiérarchie composite** : Activer/configurer l'intersection de plusieurs signaux de contrainte de hiérarchie

### 3. Guide de travail

#### Étape 1 : Ajouter des séries temporelles

1. **Cliquez sur le bouton "Ajouter"** dans la barre latérale gauche pour ouvrir l'assistant de configuration

2. **L'assistant contient quatre étapes**, accessibles via les onglets supérieurs :

   - Source (Source de données)
   - Échelle (Échelle temporelle)
   - Signaux (Configuration des signaux)
   - Viz (Visualisation)

---

#### Étape 2 : Configurer la source de données

##### 2.1 Télécharger le fichier de données

- **Formats pris en charge** : fichiers CSV ou XLSX
- **Exigences de fichier** : Doit contenir des colonnes de temps et des colonnes de valeur
- Cliquez sur le bouton "Choisir un fichier" pour sélectionner un fichier local

##### 2.2 Mappage des colonnes de temps

Le système reconnaîtra automatiquement les noms de colonnes et tentera d'associer les unités de temps. Vous devez confirmer ou spécifier manuellement :

- **Année** : Sélectionnez la colonne d'année correspondante
- **Mois** : Sélectionnez la colonne de mois correspondante
- **Jour** : Sélectionnez la colonne de jour correspondante
- **Heure** : Sélectionnez la colonne d'heure correspondante
- **Minute** : Sélectionnez la colonne de minute correspondante
- **Seconde** : Sélectionnez la colonne de seconde correspondante

**Remarque** : Si une unité de temps n'existe pas dans vos données, laissez-la vide

##### 2.3 Sélectionner la colonne de valeur

Sélectionnez la colonne contenant les valeurs numériques à analyser dans le menu déroulant

##### 2.4 Fichiers de données existants

Si des fichiers ont été téléchargés précédemment, vous pouvez sélectionner dans la liste "Fichiers de données utilisés" pour les réutiliser

---

#### Étape 3 : Définir l'échelle temporelle

##### 3.1 Définition de l'échelle

Définissez l'échelle d'agrégation pour les séries temporelles :

- **Saisie numérique** : Entrez un entier (par exemple, 1, 5, 15, 60)
- **Sélection d'unité** : Choisissez l'unité de temps dans le menu déroulant (année/mois/jour/heure/minute/seconde)
- **Exemple** : Entrez "15" et sélectionnez "minute" pour agréger les données en intervalles de 15 minutes

##### 3.2 Méthode d'agrégation

Choisissez comment agréger les données à grain fin à l'échelle spécifiée :

- **Moyenne** : Calculez la valeur moyenne dans la période
- **Min** : Prenez la valeur minimale dans la période
- **Max** : Prenez la valeur maximale dans la période
- **Médiane** : Prenez la valeur médiane dans la période
- **Percentile** : Prenez le percentile spécifié (nécessite une valeur de percentile supplémentaire, par exemple, 50 pour la médiane)

**Important** : Chaque série temporelle doit avoir une échelle unique

---

#### Étape 4 : Configurer les signaux

Les signaux sont des règles logiques utilisées pour détecter des modèles ou des conditions spécifiques dans les séries temporelles.

##### 4.1 Interface de liste des signaux (panneau gauche)

- Cliquez sur le bouton **"Ajouter"** pour ajouter de nouveaux signaux
- Les signaux ajoutés s'affichent dans une structure arborescente, cliquez pour développer/replier les détails
- Bouton **Tout replier** : Réduisez tous les signaux en un clic

##### 4.2 Sélecteur de signaux

En cliquant sur Ajouter, le sélecteur de signaux s'ouvre avec trois onglets :

**A. Types de signaux** - Types de signaux intégrés :

1. **Signaux de comparaison**

   - `ValueVsRollingPercentile` : Comparer la valeur avec le percentile roulant
   - `ValueVsRollingPercentileWithThreshold` : Comparer la valeur avec le percentile roulant avec seuil
   - `SignalValueVsPrevious` : Comparer la valeur avec la valeur précédente

2. **Signaux EMA (Moyenne mobile exponentielle)**

   - `SignalEMAFastSlowComparison` : Comparaison de croisement EMA rapide/lente
   - `SignalEMADiffVsHistoryPercentile` : Différence EMA vs. comparaison du percentile historique

3. **Signaux de longueur de course**

   - `SignalRunLengthReached` : Signal soutenu pendant une longueur spécifiée
   - `SignalRunLengthReachedHistoryPercentile` : La longueur de la course atteint le percentile historique
   - `SignalRunInterrupted` : Détection d'interruption de course de signal
   - `SignalRunLengthVsHistoryPercentile` : Longueur de la course vs. comparaison du percentile historique

4. **Signaux d'intervalle**

   - `SignalIntervalBetweenMarkers` : Intervalle entre deux marqueurs
   - `SignalNthTargetWithinWindowAfterTrigger` : Nth cible dans la fenêtre après le déclenchement

5. **Signaux composites**

   - `SignalIntersection` : Intersection de plusieurs signaux
   - `SignalValueVsLastTrueReference` : Valeur vs. dernière référence vraie comparaison
   - `SignalValueVsLastTargetForBase` : Comparaison de cible basée sur le signal de base
   - `SignalValueVsLastSignalRunStatistic` : Valeur vs. dernière statistique de course de signal comparaison

**B. Signal externe** - Importer des données externes en tant que signaux

**C. Modèles** - Utiliser ou importer des modèles de configuration de signal enregistrés

##### 4.3 Configurer les paramètres du signal (panneau droit)

Après avoir sélectionné un signal, le panneau droit affiche l'interface de configuration des paramètres :

**Types de paramètres courants** :

- **value_key** : Sélectionnez la colonne de valeur à analyser
- **signal_key** : Sélectionnez le signal dépendant (affiché comme "dépendance du signal")
- **window_size / history_window** : Taille de la fenêtre roulante
- **percentile** : Valeur du percentile (0-100)
- **comparison** : Opérateur de comparaison (gt = supérieur à, lt = inférieur à)
- **min_run_length** : Longueur minimale de la course
- **ema_period_1 / ema_period_2** : Paramètres de période EMA

Après configuration, cliquez sur **"Enregistrer le modèle"** pour enregistrer en tant que modèle pour une utilisation future

##### 4.4 Signal de contrainte de hiérarchie en aval

En bas de la liste des signaux, sélectionnez un signal comme **signal de contrainte de hiérarchie en aval**. Ce signal filtrera ou contraindra l'activation du signal dans des périodes de temps inférieures.

---

#### Étape 5 : Configurer la visualisation

##### 5.1 Liste des éléments graphiques

- Cliquez sur **"+ Ajouter un élément"** pour ajouter des éléments de visualisation
- Types d'éléments pris en charge :
  - **Line** : Dessiner une ligne continue de valeurs ou de signaux
  - **Scatter** : Dessiner des points discrets
  - **Bar** : Dessiner un graphique à barres
  - **Area** : Dessiner une zone remplie
  - **Markers** : Afficher des marqueurs aux points d'activation du signal

##### 5.2 Options de configuration des éléments

Chaque élément graphique peut être configuré avec :

- **Source de données** : Sélectionnez la colonne ou le signal à tracer
- **Couleur** : Choisissez la couleur de la ligne/marqueur
- **Style de ligne** : Solide, en pointillé, en tiret, etc.
- **Largeur de ligne** : Définir l'épaisseur de la ligne
- **Style de marqueur** : Cercle, carré, triangle, etc.
- **Opacité** : Définir la transparence (0-1)

##### 5.3 Visualisation du signal de contrainte de hiérarchie

Si un signal de contrainte de hiérarchie en aval est sélectionné, configurez son affichage sur le graphique :

- **Style** :
  - `background` : Afficher comme une zone de fond
  - `solid` : Bordure solide
  - `dashed` : Bordure en pointillé
- **Couleur et opacité** : Personnaliser l'effet d'affichage

##### 5.4 Ajuster la priorité de dessin

Faites glisser les éléments dans la liste des éléments graphiques pour ajuster l'ordre de dessin (les éléments supérieurs sont dessinés en premier, les éléments inférieurs sont dessinés par-dessus)

---

#### Étape 6 : Terminer la configuration

1. Au bas de l'assistant, l'état passe de "Incomplete" à "Complete"
2. Cliquez sur le bouton **"Suivant"** pour naviguer entre les étapes, ou cliquez sur **"Terminer"** pour terminer la configuration
3. Les nouvelles séries temporelles apparaîtront dans la liste de la barre latérale gauche

---

## 4. Opérations sur plusieurs séries temporelles

### 4.1 Créer une structure hiérarchique

Ajoutez plusieurs séries temporelles dans l'ordre du plus fin au plus grossier :

- LTF (Lowest Time Frame) : Granulaire (par exemple, 1 minute, 5 minutes)
- HTF (Higher Time Frame) : Grossier (par exemple, 1 heure, 1 jour)

### 4.2 Mode de tracé

Choisissez comment afficher plusieurs séries temporelles :

- **LTF uniquement** : Afficher uniquement le cadre temporel le plus fin
- **Séries parallèles** : Afficher toutes les séries dans des sous-graphiques indépendants
- **Séries cousues** : Coudre les données de plusieurs cadres temporels ensemble

### 4.3 Contrainte de hiérarchie composite

1. Cliquez sur le bouton **"Configurer"** dans la barre d'outils de tracé
2. Dans la boîte de dialogue qui apparaît :
   - Sélectionnez les signaux de contrainte de hiérarchie à inclure (sélection multiple)
   - Configurez le style de tracé, la couleur et l'opacité
   - Définissez les options d'exportation (inclure les signaux de dépendance, les colonnes de valeur, etc.)
3. Activez le commutateur à gauche pour activer la contrainte composite

---

## 5. Exportation de données

### 5.1 Exporter les signaux d'une seule série

1. Cliquez avec le bouton droit sur une série temporelle dans la liste de gauche, sélectionnez **"Exporter"**
2. Dans la boîte de dialogue d'exportation :
   - **Sélection de signal** : Cochez les signaux à exporter
   - **Options d'exportation** :
     - Appliquer le filtre de contrainte de hiérarchie : Appliquer le filtre de contrainte de hiérarchie
     - Inclure les signaux de dépendance : Inclure les signaux dépendants
     - Inclure les colonnes de valeur : Inclure les colonnes de valeur d'origine
   - **Paramètres de sauvegarde** :
     - Choisissez le répertoire de sauvegarde
     - Entrez le nom du fichier
     - Sélectionnez le format de fichier (CSV ou XLSX)
3. Cliquez sur **"Enregistrer"** pour terminer l'exportation

### 5.2 Exporter les résultats de contrainte de hiérarchie composite

Dans la boîte de dialogue de configuration de contrainte de hiérarchie composite, vous pouvez directement configurer les options d'exportation et enregistrer les résultats d'intersection

---

## 6. Gestion des modèles

### 6.1 Enregistrer le modèle de signal

1. Après avoir configuré les paramètres du signal, cliquez sur **"Enregistrer le modèle"**
2. Entrez le nom du modèle
3. Le modèle sera enregistré dans le stockage local du navigateur

### 6.2 Utiliser des modèles

Dans l'onglet "Modèles" du sélecteur de signaux, sélectionnez les modèles enregistrés pour créer rapidement des signaux avec la même configuration

### 6.3 Importer/Exporter des modèles

- **Importer** : Dans l'onglet modèles, cliquez sur le bouton "Importer des modèles", sélectionnez le fichier de modèle au format JSON
- **Exporter** : Les données du modèle sont stockées dans le stockage local du navigateur, peuvent être exportées via les outils de développement du navigateur

---

## 7. Cas d'utilisation courants

### Cas 1 : Analyse de tendance du marché financier

1. Importer des données sur les prix des actions (contenant la date et le prix de clôture)
2. Créer plusieurs cadres temporels : 1 minute, 5 minutes, 15 minutes, 1 heure, 1 jour
3. Ajouter des signaux de croisement EMA pour détecter les opportunités d'achat/vente
4. Utiliser des contraintes hiérarchiques pour s'assurer que la tendance à long terme est alignée avec les signaux à court terme

### Cas 2 : Détection d'anomalies dans les données de surveillance des opérations

1. Importer des données sur les métriques système (CPU, utilisation de la mémoire, etc.)
2. Créer des cadres temporels de 1 minute et 10 minutes
3. Utiliser `ValueVsRollingPercentile` pour détecter des valeurs anormalement élevées
4. Utiliser `SignalRunLengthReached` pour détecter des anomalies soutenues

### Cas 3 : Reconnaissance de modèles dans les données de capteurs

1. Importer des séries temporelles collectées par des capteurs
2. Créer des échelles de temps multi-niveaux pour capturer des modèles à différentes fréquences
3. Utiliser des signaux composites pour détecter des séquences d'événements spécifiques
4. Exporter des données étiquetées pour l'entraînement de modèles d'apprentissage automatique

---

## 8. Conseils et meilleures pratiques

### 8.1 Optimisation des performances

- Pour les grands ensembles de données, il est recommandé de prétraiter et de réduire d'abord l'échantillonnage
- Évitez de créer trop de cadres temporels à grain fin
- Définissez raisonnablement les paramètres des signaux pour réduire la charge de calcul

### 8.2 Gestion des dépendances des signaux

- Certains signaux dépendent d'autres signaux (par exemple, `SignalRunLengthReached` dépend du signal de base)
- Assurez-vous que les signaux dépendants sont créés avant d'être référencés
- Les dépendances des signaux sont affichées sous forme de structure hiérarchique dans la liste arborescente

### 8.3 Exigences de qualité des données

- Les colonnes de temps doivent être correctement analysables en tant que date-heure
- Les colonnes de valeur doivent être de type numérique
- Les valeurs manquantes seront ignorées pendant le traitement

### 8.4 Compatibilité des navigateurs

- Recommandé d'utiliser des navigateurs modernes (Chrome, Firefox, Edge)
- JavaScript doit être activé
- Les grands ensembles de données peuvent nécessiter plus de mémoire

---

## 9. Opérations rapides

| Opération | Méthode |
| ------------------------- | ------------------------------------------------------------------------ |
| Ajouter une série | Cliquez sur le bouton "Ajouter" dans la barre latérale |
| Modifier une série | Clic droit sur l'élément -> Configurer |
| Supprimer une série | Clic droit sur l'élément -> Supprimer |
| Exporter des données | Clic droit sur l'élément -> Exporter |
| Changer de langue | Cliquez sur EN/FR/CN en haut à droite |
| Réduire tous les signaux | Cliquez sur "Tout replier" dans la page de configuration |
| Enregistrer un modèle | Cliquez sur "Enregistrer le modèle" après avoir configuré les signaux |

---

## 10. Dépannage

### 10.1 Échec du téléchargement de fichier

- Vérifiez que le format de fichier est CSV ou XLSX
- Confirmez que le fichier contient des colonnes de temps et de valeurs
- Essayez de tester avec une structure de fichier plus simple

### 10.2 Mappage de colonne de temps incorrect

- Ajustez manuellement le mappage de colonne pour chaque unité de temps
- Cliquez sur "Reinitialiser" pour relancer la détection automatique
- Assurez-vous que les noms de colonnes sont clairs et explicites

### 10.3 Signal non affiché

- Vérifiez si les paramètres du signal sont configurés correctement
- Confirmez que les éléments de visualisation ont été ajoutés
- Vérifiez si les dépendances du signal sont satisfaites

### 10.4 Graphique non affiché

- Confirmez qu'au moins une série temporelle a été ajoutée
- Vérifiez s'il y a des éléments de visualisation
- Vérifiez la console du navigateur pour les erreurs

---

## 11. Conclusion (FR)

Hiera-TF est un puissant outil d'analyse multi-temporel adapté aux scénarios nécessitant l'analyse de données de séries temporelles à différentes échelles de temps. Grâce à ce guide, vous devriez être capable de :

- Importer et configurer des données de séries temporelles
- Créer des structures hiérarchiques de cadres temporels multi-niveaux
- Configurer divers signaux techniques pour la détection de modèles
- Utiliser les contraintes hiérarchiques pour assurer la cohérence des signaux entre les cadres temporels
- Visualiser les résultats d'analyse et exporter des données

Nous recommandons de commencer par des configurations simples à un seul cadre temporel et un seul signal, puis d'explorer progressivement les fonctionnalités de contraintes multi-niveaux et de signaux composites plus complexes.

Pour toute question, veuillez consulter la documentation du projet ou soumettre des issues pour obtenir des commentaires.

---

## Chinese Version

### Hiera-TF 时间序列控制台 - 初学者指南

### 1. 平台介绍

Hiera-TF 是一个多时间框架分层信号可视化工具，用于分析时间序列数据，在不同时间尺度上创建、配置和可视化各种技术信号。该工具支持从细粒度（LTF - 较低时间框架）到粗粒度（HTF - 较高时间框架）的层级结构分析。

### 2. 界面布局

#### 2.1 主界面结构

- **侧边栏（左侧）**：显示所有创建的时间序列，按从细到粗的顺序列出（LTF 在顶部）
- **主区域（中间）**：
  - **绘图区域**：显示时间序列数据和信号的图表
  - **图例区域**：显示图形元素的描述
- **顶部工具栏**：包含语言切换（EN/FR/CN）和绘图模式选择器

#### 2.2 关键控制元素

- **添加按钮**：位于侧边栏顶部，用于添加新时间序列
- **绘图模式下拉菜单**：选择绘图模式（仅 LTF/平行序列/拼接序列）
- **复合层次约束切换**：启用/配置多个层次约束信号的交集

### 3. 工作流程指南

#### 步骤 1：添加时间序列

1. **单击左侧边栏中的"添加"按钮**，打开配置向导

2. **向导包含四个步骤**，可通过顶部选项卡访问：

   - 数据源（Source）
   - 时间尺度（Scale）
   - 信号配置（Signals）
   - 可视化（Viz）

---

#### 步骤 2：配置数据源

##### 2.1 上传数据文件

- **支持的格式**：CSV 或 XLSX 文件
- **文件要求**：必须包含时间列和值列
- 单击"选择文件"按钮以选择本地文件

##### 2.2 时间列映射

系统将自动识别列名并尝试匹配时间单位。您需要确认或手动指定：

- **年份**：选择对应的年份列
- **月份**：选择对应的月份列
- **日期**：选择对应的日期列
- **小时**：选择对应的小时列
- **分钟**：选择对应的分钟列
- **秒**：选择对应的秒列

**注意**：如果您的数据中不存在某个时间单位，请留空

##### 2.3 选择值列

从下拉菜单中选择包含用于分析的数值的列

##### 2.4 现有数据文件

如果之前已上传文件，您可以从"已用数据文件"列表中选择以重新使用它们

---

#### 步骤 3：定义时间尺度

##### 3.1 尺度定义

设置时间序列的聚合尺度：

- **数值输入**：输入一个整数（例如，1、5、15、60）
- **单位选择**：从下拉菜单中选择时间单位（年/月/日/小时/分钟/秒）
- **示例**：输入"15"并选择"分钟"以将数据聚合为 15 分钟的时间框架

##### 3.2 聚合方法

选择如何将细粒度数据聚合到指定的尺度：

- **均值**：计算时间段内的平均值
- **最小值**：取时间段内的最小值
- **最大值**：取时间段内的最大值
- **中位数**：取时间段内的中位数
- **百分位数**：取指定的百分位数（需要额外的百分位数值，例如，中位数为 50）

**重要**：每个时间序列必须具有唯一的尺度

---

#### 步骤 4：配置信号

信号是用于检测时间序列中特定模式或条件的逻辑规则。

##### 4.1 信号列表界面（左侧面板）

- 单击 **"添加"** 按钮添加新信号
- 添加的信号以树状结构显示，单击以展开/折叠详细信息
- **一键折叠** 按钮：一键折叠所有信号

##### 4.2 信号选择器

单击添加打开信号选择器，包含三个选项卡：

**A. 信号类型** - 内置信号类型：

1. **比较信号**

   - `ValueVsRollingPercentile`：将值与滚动百分位数进行比较
   - `ValueVsRollingPercentileWithThreshold`：将值与带阈值的滚动百分位数进行比较
   - `SignalValueVsPrevious`：将值与前一个值进行比较

2. **EMA 信号（指数移动平均）**

   - `SignalEMAFastSlowComparison`：快速/慢速 EMA 交叉比较
   - `SignalEMADiffVsHistoryPercentile`：EMA 差异与历史百分位数比较

3. **运行长度信号**

   - `SignalRunLengthReached`：信号持续指定长度
   - `SignalRunLengthReachedHistoryPercentile`：运行长度达到历史百分位数
   - `SignalRunInterrupted`：信号运行中断检测
   - `SignalRunLengthVsHistoryPercentile`：运行长度与历史百分位数比较

4. **区间信号**

   - `SignalIntervalBetweenMarkers`：两个标记之间的区间
   - `SignalNthTargetWithinWindowAfterTrigger`：触发后窗口内的第 N 个目标

5. **复合信号**

   - `SignalIntersection`：多个信号的交集
   - `SignalValueVsLastTrueReference`：值与最后一个真实参考的比较
   - `SignalValueVsLastTargetForBase`：基于基准信号的目标比较
   - `SignalValueVsLastSignalRunStatistic`：值与最后一个信号运行统计的比较

**B. 外部信号** - 将外部数据导入为信号

**C. 模板** - 使用或导入保存的信号配置模板

##### 4.3 配置信号参数（右侧面板）

选择信号后，右侧面板显示参数配置界面：

**常见参数类型**：

- **value_key**：选择要分析的值列
- **signal_key**：选择依赖信号（显示为"信号依赖"）
- **window_size / history_window**：滚动窗口大小
- **percentile**：百分位数值（0-100）
- **comparison**：比较运算符（gt = 大于，lt = 小于）
- **min_run_length**：最小运行长度
- **ema_period_1 / ema_period_2**：EMA 周期参数

配置完成后，单击 **"保存模板"** 以保存为将来使用的模板

##### 4.4 下游层次约束信号

在信号列表底部，选择一个信号作为 **下游层次约束信号**。该信号将在较低时间框架中过滤或约束信号激活。

---

#### 步骤 5：配置可视化

##### 5.1 图形元素列表

- 单击 **"+ 添加图形元素"** 添加可视化元素
- 支持的元素类型：
  - **Line（线）**：绘制值或信号的连续线
  - **Scatter（散点图）**：绘制离散点
  - **Bar（柱状图）**：绘制柱状图
  - **Area（区域图）**：绘制填充区域
  - **Markers（标记）**：在信号激活点显示标记

##### 5.2 元素配置选项

可以配置每个图形元素：

- **数据源**：选择要绘制的列或信号
- **颜色**：选择线条/标记颜色
- **线条样式**：实线、虚线、点线等
- **线条宽度**：设置线条粗细
- **标记样式**：圆形、方形、三角形等
- **不透明度**：设置透明度（0-1）

##### 5.3 层次约束信号可视化

如果选择了下游层次约束信号，请配置其在图表上的显示：

- **样式**：
  - `background`：显示为背景区域
  - `solid`：实线边框
  - `dashed`：虚线边框
- **颜色和不透明度**：自定义显示效果

##### 5.4 调整绘制优先级

拖动图形元素列表中的项目以调整绘制顺序（较高的项目优先绘制，较低的项目在上面绘制）

---

#### 步骤 6：完成配置

1. 在向导底部，状态从"Incomplete"更改为"Complete"
2. 单击 **"下一步"** 按钮在步骤之间导航，或单击 **"完成"** 完成配置
3. 新时间序列将出现在左侧边栏列表中

---

## 4. 多时间序列操作

### 4.1 创建层次结构

按从细到粗的顺序添加多个时间序列：

- LTF（Lowest Time Frame）：细粒度（例如，1 分钟，5 分钟）
- HTF（Higher Time Frame）：粗粒度（例如，1 小时，1 天）

### 4.2 绘图模式

选择如何显示多个时间序列：

- **仅 LTF**：仅显示最细时间框架
- **平行序列**：在独立子图中显示所有序列
- **拼接序列**：将来自多个时间框架的序列拼接在一起

### 4.3 复合层次约束

1. 单击绘图工具栏中的 **"配置"** 按钮
2. 在出现的对话框中：
   - 选择要包含的层次约束信号（多选）
   - 配置绘图样式、颜色和不透明度
   - 设置导出选项（包括依赖信号、值列等）
3. 启用左侧的切换开关以激活复合约束

---

## 5. 数据导出

### 5.1 导出单个信号序列

1. 右键单击左侧列表中的时间序列，选择 **"导出"**
2. 在导出对话框中：
   - **信号选择**：勾选要导出的信号
   - **导出选项**：
     - 应用层次约束过滤器：应用层次约束过滤器
     - 包括依赖信号：包括依赖信号
     - 包括值列：包括原始值列
   - **保存设置**：
     - 选择保存目录
     - 输入文件名
     - 选择文件格式（CSV 或 XLSX）
3. 单击 **"保存"** 完成导出

### 5.2 导出复合层次约束结果

在复合层次约束设置对话框中，可以直接配置导出选项并保存交集结果

---

## 6. 模板管理

### 6.1 保存信号模板

1. 配置信号参数后，单击 **"保存模板"**
2. 输入模板名称
3. 模板将保存到浏览器本地存储

### 6.2 使用模板

在信号选择器的"模板"选项卡中，选择保存的模板以快速创建具有相同配置的信号

### 6.3 导入/导出模板

- **导入**：在模板选项卡中，单击"导入模板"按钮，选择 JSON 格式的模板文件
- **导出**：模板数据存储在浏览器本地存储中，可以通过浏览器开发者工具导出

---

## 7. 常见用例

### 用例 1：金融市场趋势分析

1. 导入股票价格数据（包含日期和收盘价）
2. 创建多个时间框架：1 分钟，5 分钟，15 分钟，1 小时，1 天
3. 添加 EMA 交叉信号以检测买入/卖出机会
4. 使用层次约束确保长期趋势与短期信号一致

### 用例 2：操作监控数据异常检测

1. 导入系统指标数据（CPU、内存使用等）
2. 创建 1 分钟和 10 分钟时间框架
3. 使用 `ValueVsRollingPercentile` 检测异常高值
4. 使用 `SignalRunLengthReached` 检测持续异常

### 用例 3：传感器数据模式识别

1. 导入传感器采集的时间序列
2. 创建多级时间尺度捕捉不同频率的模式
3. 使用复合信号检测特定事件序列
4. 导出标记后的数据用于机器学习训练

---

## 8. 使用技巧与注意事项

### 8.1 性能优化

- 大数据集建议先进行数据预处理和降采样
- 避免创建过多细粒度时间框架
- 合理设置信号参数以减少计算负担

### 8.2 信号依赖管理

- 某些信号依赖其他信号（如 `SignalRunLengthReached` 依赖基础信号）
- 确保依赖信号在被引用前已经创建
- 信号依赖关系在树形列表中以层级结构显示

### 8.3 数据质量要求

- 时间列必须能够正确解析为日期时间
- 数值列必须是数字类型
- 缺失值会在处理时被跳过

### 8.4 浏览器兼容性

- 推荐使用现代浏览器（Chrome、Firefox、Edge）
- 需要启用 JavaScript
- 大数据集可能需要较多内存

---

## 9. 快捷操作

| 操作 | 方法 |
| ------------------ | -------------------------------------------------- |
| 添加时间序列 | 点击侧边栏"添加"按钮 |
| 编辑时间序列 | 右键点击列表项 -> 配置 |
| 删除时间序列 | 右键点击列表项 -> 删除 |
| 导出数据 | 右键点击列表项 -> 导出 |
| 切换语言 | 点击右上角 EN/FR/CN |
| 折叠所有信号 | 在信号配置页点击"一键折叠" |
| 保存模板 | 配置完信号参数后点击"保存模板" |

---

## 10. 故障排查

### 10.1 文件上传失败

- 检查文件格式是否为 CSV 或 XLSX
- 确认文件包含时间和数值列
- 尝试使用更简单的文件结构测试

### 10.2 时间列映射不正确

- 手动调整每个时间单位的列映射
- 点击"重置映射"重新自动识别
- 确保列名清晰明确

### 10.3 信号未显示

- 检查信号参数是否配置正确
- 确认可视化元素已添加
- 查看信号依赖是否满足

### 10.4 图表不显示

- 确认至少添加了一个时间序列
- 检查是否有可视化元素
- 查看浏览器控制台是否有错误

---

## 11. 结语

Hiera-TF 是一个强大的多时间框架分析工具，适合需要在不同时间尺度上分析时间序列数据的场景。通过本指南的学习，您应该能够：

- 导入和配置时间序列数据
- 创建多级时间框架层级结构
- 配置各种技术信号进行模式检测
- 使用层级约束确保跨时间框架的信号一致性
- 可视化分析结果并导出数据

建议从简单的单时间框架、单信号配置开始，逐步探索更复杂的多层级约束和复合信号功能。

如有问题，请参考项目文档或提交 Issue 反馈。
