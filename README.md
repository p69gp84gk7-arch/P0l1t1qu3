# Présidentielles 2017, 2022, 2027 : sondages, Assemblée, sondeurs et médias

Application web (mobile et ordinateur, installable) qui présente les sondages des présidentielles,
la popularité de l’exécutif, l’Assemblée nationale, les instituts de sondage et les médias.
Les données vivent dans un **Google Sheet** et les nouveaux sondages 2027 y sont ajoutés
**automatiquement** depuis Wikipédia.

```
Wikipédia ──(toutes les 6 h)──▶ Google Sheet ──(API JSON Apps Script)──▶ application web
                                    ▲    ▲                                    │
                 modifications à la main  │                    secours hors ligne : data/snapshot.json
                                          │
open data de l'Assemblée, GDELT, Wikipédia ──(GitHub, chaque jour)──▶ data/scrutins.json, data/tonalite.json, data/declarations.json
```

Les votes de l’Assemblée et le ton de la presse sont préparés chaque jour par une tâche GitHub
(`.github/workflows/donnees-quotidiennes.yml`) : l’open data de l’Assemblée pèse 200 Mo décompressé et GDELT
limite le nombre de requêtes, ce que le script du classeur ne peut pas absorber. Le script recopie ensuite les
deux fichiers dans le classeur ; l’application prend la version la plus récente entre le classeur et ces fichiers.

- Classeur : [Présidentielles 2017-2027 – données](https://docs.google.com/spreadsheets/d/1eobPJfulibdFjZgAsjSOJRuLU1cHX7nXv119nVJF0Ak/edit) (privé ; l’onglet LISEZ-MOI décrit chaque onglet).
- Application : `index.html` + `assets/` (HTML/CSS/JS sans étape de compilation, Chart.js).

## Mise en place (une seule fois, environ 5 minutes)

### 1. Installer le script dans le classeur

À faire **une seule fois**, sur un **ordinateur** (l’éditeur de script n’existe pas dans l’application mobile Google Sheets).
Ensuite le script se met à jour tout seul depuis GitHub (voir plus bas).

1. Activer l’API Apps Script pour son compte : ouvrir <https://script.google.com/home/usersettings>
   et mettre **« API Google Apps Script »** sur **Activé**.
2. Ouvrir le classeur, menu **Extensions > Apps Script**. Un éditeur s’ouvre dans un nouvel onglet
   avec un fichier `Code.gs` contenant `function myFunction() {}` : c’est normal.
3. Tout effacer dans `Code.gs`, puis coller le contenu de
   [`apps-script/A-COLLER-dans-Apps-Script.gs`](apps-script/A-COLLER-dans-Apps-Script.gs)
   (sur GitHub : bouton « Copy raw file » en haut à droite du fichier). Enregistrer (icône disquette).
4. Dans l’éditeur, **Paramètres du projet** (roue dentée à gauche) > cocher
   **« Afficher le fichier manifeste "appsscript.json" dans l’éditeur »**. Revenir à l’éditeur (`< >` à gauche),
   ouvrir `appsscript.json`, tout remplacer par [`apps-script/appsscript.json`](apps-script/appsscript.json), enregistrer.
5. Revenir sur l’onglet du classeur et le recharger : un menu **Sondages** apparaît à droite de « Aide ».
6. **Sondages > Mettre à jour depuis Wikipédia**. La première fois, Google demande une autorisation :
   choisir son compte, puis « Paramètres avancés » > « Accéder au projet (non sécurisé) » > « Autoriser »
   (l’avertissement s’affiche pour tout script personnel non vérifié par Google).
7. **Sondages > Activer la mise à jour automatique** : sondages toutes les 6 heures, script chaque nuit.

### Mettre le script à jour à la main (recommandé)

Avec le projet Google par défaut d’Apps Script, la mise à jour automatique décrite plus bas échoue
(« Apps Script API has not been used in project… ») : Google ne permet pas d’y activer l’API Apps Script.
Pour installer une nouvelle version du script (environ 2 minutes, sur ordinateur) :

1. Ouvrir le Sheet, menu **Extensions > Apps Script**.
2. Ouvrir https://github.com/p69gp84gk7-arch/P0l1t1qu3/blob/main/apps-script/A-COLLER-dans-Apps-Script.gs,
   bouton **Copy raw file**, puis dans l’éditeur : tout sélectionner dans `Code.gs`, coller, enregistrer.
   S’il existe d’autres fichiers `.gs` dans le projet (`Wikipedia`, `MiseAJourScript`, `Patrimoine`, `DonneesGitHub`), les supprimer
   (clic sur ⋮ à côté du nom > Supprimer) : tout le code est dans `Code.gs`.
3. **Déployer > Gérer les déploiements**, crayon, **Version : Nouvelle version**, **Déployer**. L’adresse `/exec`
   ne change pas, l’application n’a pas besoin d’être modifiée.

### Mises à jour du script : automatiques (nécessite un projet Google Cloud standard)

Chaque nuit (et à la demande via **Sondages > Mettre à jour le script depuis GitHub**), le script lit
sa dernière version dans la branche `main` de ce dépôt. Si elle a changé, il remplace son propre code
et republie l’application web à la même adresse `/exec`. Le résultat est noté dans l’onglet `journal`.

- Il suffit donc de fusionner une modification sur `main` : le classeur l’applique la nuit suivante.
- Réglages dans l’onglet `parametres` : `maj_script = non` pour suspendre, `script_branche` pour suivre une autre branche.
- Si une nouvelle version demande une autorisation supplémentaire, Google la redemande au prochain usage du menu.
- Le code exécuté vient de GitHub avec les droits de votre compte Google : seules les personnes autorisées
  à écrire sur `main` doivent pouvoir modifier ce dépôt.

### 2. Publier l’API

1. Dans l’éditeur Apps Script : **Déployer > Nouveau déploiement > Application Web**.
2. Exécuter en tant que : *moi* ; Qui a accès : *Tout le monde*. Le classeur reste privé :
   seule la sortie JSON est publique.
3. Copier l’adresse qui finit par `/exec` dans `config.js` (`API_URL`).

Pour vérifier : ouvrir l’adresse `/exec` dans un navigateur, elle doit renvoyer du JSON.

### 3. Mettre l’application en ligne

C’est un site statique : n’importe quel hébergeur convient.

- **GitHub Pages** : fusionner sur `main`, puis Settings > Pages > Source : « GitHub Actions ».
  Le workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publie le site à chaque push.
  (Sur un dépôt privé, GitHub Pages demande un compte payant.)
- Ou Netlify / Cloudflare Pages / Vercel : glisser-déposer le dossier, aucune commande de build.

Sur téléphone, « Ajouter à l’écran d’accueil » installe l’application ; la dernière version vue reste consultable hors ligne.

## Utilisation au quotidien

- **Rien à faire** pour les sondages de premier et second tour 2027 : ils arrivent seuls depuis
  Wikipédia, avec une ligne dans l’onglet `journal` à chaque passage. Le bouton **Mettre à jour les sondages**
  (onglet Sondages de l’application) lance la vérification tout de suite (au plus une fois toutes les 2 minutes).
- **Corriger ou ajouter à la main** : modifier directement le classeur. L’application affiche
  la modification au prochain chargement (le cache de l’API est vidé à chaque modification).
- **Nouveau candidat** : il apparaît dans `candidats` avec `affiche = non` ; passer à `oui`
  (et choisir une couleur) pour l’afficher dans les graphiques.
- **Patrimoine des candidats 2027** : toutes les 6 heures à partir du 1er janvier 2027, le script vérifie si la
  HATVP a publié les déclarations de patrimoine des candidats (open data). Il ajoute une ligne par candidat dans
  l’onglet `patrimoine`, avec les montants calculés depuis la version XML de la déclaration ; si seule la version
  PDF existe, la ligne porte le lien et les montants sont à saisir. Vérification immédiate : menu
  **Sondages > Vérifier les déclarations de patrimoine (HATVP)**. Suspendre : `parametres > maj_patrimoine = non`.
  La colonne `fortune_estimee` (estimation publiée par la presse d’une fortune absente de la déclaration) se remplit à la main.
- **Affaires judiciaires** (onglet `justice`, une ligne par affaire) : mise à jour à la main quand une décision tombe
  (par exemple l’arrêt de la Cour de cassation attendu pour Marine Le Pen avant le premier tour de 2027) : changer
  `statut`, `date`, `peine` et les montants. Ne retenir que des décisions et des procédures ouvertes par la justice.
- **Financement des campagnes** (onglet `financement`) : comptes 2017 et 2022 arrêtés par la CNCCFP. Pour 2027,
  les comptes seront publiés au plus tard le 2 août 2027 : remplacer alors les lignes 2027 par les montants retenus
  par la Commission (mêmes colonnes que 2022).
- **Votes de l’Assemblée** (onglets `scrutins` et `scrutins_groupes`) et **ton de la presse** (onglets `tonalite`
  et `tonalite_articles`) : rien à faire. La tâche GitHub « Données quotidiennes » tourne chaque matin (onglet
  Actions du dépôt, bouton *Run workflow* pour la lancer tout de suite) ; le script recopie ses fichiers dans le
  classeur à chaque mise à jour, ou tout de suite par le menu **Sondages > Recopier les votes de l’Assemblée et la
  tonalité de la presse**. Ces onglets sont réécrits à chaque fois : ne pas les modifier à la main.
- **Liste des candidatures 2027** (onglet `declarations` : déclarés, pressentis, retirés) : rien à faire, elle est
  relue chaque jour dans l’article Wikipédia « Candidatures à l’élection présidentielle française de 2027 ».
- **Nouvelle personnalité dans les sondages** : le script l’ajoute à `candidats` avec `affiche = non`. Pour l’afficher,
  passer `affiche` à `oui`, choisir une couleur et un parti ; `visible = oui` l’affiche aussi par défaut sur la courbe.
  Une personnalité testée dans moins de la moitié des sondages récents est listée à part sous la moyenne.
- **Fiches des candidats** (onglets `fiches`, `carrieres`, `parcours_electoral`) et **organigramme du pouvoir**
  (`institutions`, `institutions_liens`) : à la main. Une nouvelle candidature se déclare dans la colonne
  `candidatures` de `fiches` (« 2027:clé », la clé de l’onglet `candidats`) ; changer le titulaire d’une fonction
  (nouveau Premier ministre…) dans la colonne `titulaire` de `institutions`.
- **Popularité, groupes de l’Assemblée, médias, citations** : mises à jour manuelles dans les onglets correspondants.
- **Suspendre la mise à jour auto** : `parametres > maj_auto = non`.

Règles du classeur : ne pas renommer les onglets ni les en-têtes ; dates `AAAA-MM-JJ`, mois `AAAA-MM`.

## Développement

```bash
npm start   # sert l'application sur http://localhost:8000
npm test    # tests du parseur Wikipédia et de la conversion des onglets
```

| Fichier | Rôle |
|---|---|
| `assets/donnees.js` | charge l’API (ou `data/snapshot.json`) et convertit les onglets en modèle |
| `assets/app.js` | rendu des quatorze onglets de l’application |
| `apps-script/A-COLLER-dans-Apps-Script.gs` | les fichiers .gs ci-dessous réunis, à coller dans le classeur (`node scripts/assembler-apps-script.mjs`) |
| `apps-script/Code.gs` | API JSON, menu, déclencheur, écriture des nouveaux sondages |
| `apps-script/MiseAJourScript.gs` | mise à jour du script par lui-même depuis GitHub, et republication de l’application web |
| `apps-script/Patrimoine.gs` | repère les déclarations de patrimoine des candidats publiées par la HATVP et calcule les montants depuis le XML |
| `apps-script/DonneesGitHub.gs` | recopie dans le classeur les votes de l’Assemblée et le ton de la presse préparés chaque jour sur GitHub |
| `apps-script/Wikipedia.gs` | lecture des tableaux de sondages Wikipédia (fonctions pures, testées sous Node) |
| `scripts/extraire-page-originale.mjs` | extrait les données de la page d’origine (`archive/`) vers `data/snapshot.json` |
| `scripts/ajouts-medias-instituts.mjs` | médias et instituts ajoutés après l’extraction de la page d’origine |
| `scripts/financement-initial.mjs` | comptes de campagne 2017 et 2022 (décisions de la CNCCFP) et ressources des partis pour 2027 |
| `scripts/justice-initial.mjs` | affaires judiciaires des candidats et de leurs partis (situation au 27 octobre 2026, sources par affaire) |
| `scripts/patrimoine-initial.mjs` | patrimoine déclaré des candidats 2017 et 2022 (sources et méthode dans le fichier) |
| `scripts/importer-scrutins.mjs` | votes de l’Assemblée : open data officiel → `data/scrutins.json` (lancé chaque jour par GitHub) |
| `scripts/importer-tonalite.mjs` | ton des articles qui citent chaque personnalité (GDELT) → `data/tonalite.json` (chaque jour) |
| `scripts/importer-candidatures.mjs` | liste des candidatures déclarées, pressenties et retirées (Wikipédia) → `data/declarations.json` (chaque jour) |
| `scripts/candidats-initial.mjs` | fiches des candidats : biographie, carrière, résultats passés, photos Wikimedia Commons |
| `scripts/institutions-initial.mjs` | organigramme du pouvoir (Constitution de 1958) |
| `scripts/importer-wikipedia.mjs` | applique la même mise à jour Wikipédia au fichier de secours |

Mettre à jour le fichier de secours : `node scripts/importer-wikipedia.mjs`, ou le remplacer par la réponse de l’API (`curl -L "$API_URL" > data/snapshot.json`).

### Choix de calcul

- Moyenne du premier tour : dernier sondage de chaque institut sur 30 jours (45 pour les courbes).
- Sondage Wikipédia à plusieurs hypothèses : on garde celle qui teste le plus de candidats.
  « <1 % » est compté 0,5. Doublon = même institut, fin de terrain à 3 jours près.
- Patrimoine : classement sur le patrimoine déclaré (biens) plus la fortune estimée hors déclaration ; les dettes
  sont affichées à part. Montants calculés depuis le XML : immeubles à hauteur de la quote-part détenue, biens
  marqués « non conservés » exclus, dettes = capital restant dû.
- Vote par âge : part des votants = part des inscrits × participation de la tranche (sondage Ipsos « jour du vote »),
  ramenée à 100 ; la participation recalculée est comparée à la participation officielle (contrôle affiché).
- Votes de l’Assemblée : position d’un groupe = position majoritaire de ses députés (open data) ; « du côté du
  résultat » = le groupe a voté pour un texte adopté ou contre un texte rejeté. Seuls les votes sur l’ensemble d’un
  texte, les motions, les résolutions et les déclarations sont repris, pas les amendements ni les articles.
- Ton de la presse : note GDELT de chaque article (−10 à +10) ; négatif à −2 ou moins, positif à +2 ou plus.
  C’est le ton de l’article entier, pas une opinion sur la personne citée.
- Duels de second tour : moyenne des mesures des 61 derniers jours, ou des 3 dernières si le duel est rare ; duels sans mesure depuis 6 mois masqués.

## Sources

Wikipédia (CC BY-SA 4.0), Commission des sondages, instituts, EPOC Info, Ifop-Fiducial, Assemblée nationale,
Saper Vedere, Médiamétrie, ministère de l’Intérieur, Insee, HATVP (licence ouverte), CNCCFP, open data de l’Assemblée
nationale (licence ouverte), GDELT, Wikidata et Wikimedia Commons (photos sous licences libres, auteur indiqué). Détail dans le pied de page de l’application.
