# Présidentielles 2017, 2022, 2027 : sondages, Assemblée, sondeurs et médias

Application web (mobile et ordinateur, installable) qui présente les sondages des présidentielles,
la popularité de l’exécutif, l’Assemblée nationale, les instituts de sondage et les médias.
Les données vivent dans un **Google Sheet** et les nouveaux sondages 2027 y sont ajoutés
**automatiquement** depuis Wikipédia.

```
Wikipédia ──(toutes les 6 h)──▶ Google Sheet ──(API JSON Apps Script)──▶ application web
                                    ▲                                         │
                       modifications à la main                 secours hors ligne : data/snapshot.json
```

- Classeur : [Présidentielles 2017-2027 – données](https://docs.google.com/spreadsheets/d/1eobPJfulibdFjZgAsjSOJRuLU1cHX7nXv119nVJF0Ak/edit) (privé ; l’onglet LISEZ-MOI décrit chaque onglet).
- Application : `index.html` + `assets/` (HTML/CSS/JS sans étape de compilation, Chart.js).

## Mise en place (une seule fois, environ 5 minutes)

### 1. Installer le script dans le classeur

1. Ouvrir le classeur, menu **Extensions > Apps Script**.
2. Remplacer le contenu de `Code.gs` par celui de [`apps-script/Code.gs`](apps-script/Code.gs).
3. Ajouter un fichier de script nommé `Wikipedia` et y coller [`apps-script/Wikipedia.gs`](apps-script/Wikipedia.gs).
4. Dans **Paramètres du projet**, cocher « Afficher le fichier manifeste », puis remplacer
   `appsscript.json` par [`apps-script/appsscript.json`](apps-script/appsscript.json).
5. Enregistrer, recharger le classeur : un menu **Sondages** apparaît.
6. **Sondages > Mettre à jour depuis Wikipédia** (Google demande d’autoriser le script la première fois).
7. **Sondages > Activer la mise à jour automatique (toutes les 6 h)**.

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
  Wikipédia, avec une ligne dans l’onglet `journal` à chaque passage.
- **Corriger ou ajouter à la main** : modifier directement le classeur. L’application affiche
  la modification au prochain chargement (le cache de l’API est vidé à chaque modification).
- **Nouveau candidat** : il apparaît dans `candidats` avec `affiche = non` ; passer à `oui`
  (et choisir une couleur) pour l’afficher dans les graphiques.
- **Popularité, Assemblée, médias, citations** : mises à jour manuelles dans les onglets correspondants.
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
| `assets/app.js` | rendu des huit onglets de l’application |
| `apps-script/Code.gs` | API JSON, menu, déclencheur, écriture des nouveaux sondages |
| `apps-script/Wikipedia.gs` | lecture des tableaux de sondages Wikipédia (fonctions pures, testées sous Node) |
| `scripts/extraire-page-originale.mjs` | extrait les données de la page d’origine (`archive/`) vers `data/snapshot.json` |
| `scripts/importer-wikipedia.mjs` | applique la même mise à jour Wikipédia au fichier de secours |

Mettre à jour le fichier de secours : `node scripts/importer-wikipedia.mjs`, ou le remplacer par la réponse de l’API (`curl -L "$API_URL" > data/snapshot.json`).

### Choix de calcul

- Moyenne du premier tour : dernier sondage de chaque institut sur 30 jours (45 pour les courbes).
- Sondage Wikipédia à plusieurs hypothèses : on garde celle qui teste le plus de candidats.
  « <1 % » est compté 0,5. Doublon = même institut, fin de terrain à 3 jours près.
- Duels de second tour : moyenne des mesures des 61 derniers jours, ou des 3 dernières si le duel est rare ; duels sans mesure depuis 6 mois masqués.

## Sources

Wikipédia (CC BY-SA 4.0), Commission des sondages, instituts, EPOC Info, Ifop-Fiducial, Assemblée nationale,
Saper Vedere, Médiamétrie, ministère de l’Intérieur. Détail dans le pied de page de l’application.
