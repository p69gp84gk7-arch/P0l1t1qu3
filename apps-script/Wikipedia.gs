/**
 * Lecture des sondages publiés sur Wikipédia (page « Liste de sondages sur l'élection
 * présidentielle française de 2027 »), à partir du wikicode brut de la page.
 *
 * Ce fichier ne contient que des fonctions pures (aucun appel à SpreadsheetApp) :
 * il est utilisé tel quel par Apps Script et par les tests Node (tests/wikipedia.test.mjs).
 */

var WIKI_MOIS = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7,
  aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12
};

/** Nom d'institut tel qu'écrit sur Wikipédia -> nom utilisé dans le Google Sheet. */
var WIKI_INSTITUTS = [
  [/harris|toluna/i, "Harris"], [/opinion\s*way/i, "OpinionWay"], [/ifop/i, "Ifop"],
  [/elabe/i, "Elabe"], [/ipsos/i, "Ipsos"], [/odoxa/i, "Odoxa"], [/cluster\s*17/i, "Cluster17"],
  [/you\s*gov/i, "YouGov"], [/verian|kantar/i, "Verian"], [/\bcsa\b/i, "CSA"], [/\bbva\b/i, "Ipsos"]
];

function wikiSansAccents(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function wikiInstitut(nom) {
  for (var i = 0; i < WIKI_INSTITUTS.length; i++) if (WIKI_INSTITUTS[i][0].test(nom)) return WIKI_INSTITUTS[i][1];
  return String(nom).trim();
}

/** Supprime le balisage wiki courant et renvoie du texte simple. */
function wikiTexte(s) {
  s = String(s || "");
  s = s.replace(/<ref[^>]*\/>/gi, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "");
  s = s.replace(/\{\{\s*formatnum\s*:\s*([^}]*)\}\}/gi, "$1");
  s = s.replace(/\{\{\s*(?:blanc|nobr|nowrap)\s*\|([^{}]*)\}\}/gi, "$1");
  s = s.replace(/\{\{[^{}]*\}\}/g, "");
  s = s.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1");
  s = s.replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, "$1");
  s = s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/'{2,}/g, "");
  return s.replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").trim();
}

/** Coupe « attributs | contenu » au premier | qui n'est ni dans [[ ]] ni dans {{ }}. */
function wikiCoupeCellule(s) {
  var prof = 0;
  for (var i = 0; i < s.length; i++) {
    var d = s.substr(i, 2);
    if (d === "[[" || d === "{{") { prof++; i++; continue; }
    if (d === "]]" || d === "}}") { prof = Math.max(0, prof - 1); i++; continue; }
    if (s[i] === "|" && prof === 0) {
      if (s[i + 1] === "|") return null;
      return { attrs: s.slice(0, i), contenu: s.slice(i + 1) };
    }
  }
  return { attrs: "", contenu: s };
}

function wikiCellule(brut, entete) {
  var c = wikiCoupeCellule(brut) || { attrs: "", contenu: brut };
  var rs = /rowspan\s*=\s*"?(\d+)/i.exec(c.attrs), cs = /colspan\s*=\s*"?(\d+)/i.exec(c.attrs);
  return { brut: c.contenu.trim(), attrs: c.attrs, rowspan: rs ? +rs[1] : 1, colspan: cs ? +cs[1] : 1, entete: !!entete };
}

/**
 * Découpe le wikicode en tableaux. Chaque tableau garde le titre de section
 * sous lequel il se trouve (pile des titres) et ses lignes, rowspan et colspan résolus :
 * une cellule étalée sur plusieurs lignes est le même objet dans chacune.
 */
function wikiTableaux(wikicode) {
  var lignes = String(wikicode).split("\n"), titres = [], tableaux = [], t = null, ligne = null;
  function finLigne() { if (t && ligne && ligne.length) t.lignesBrutes.push(ligne); ligne = []; }
  for (var i = 0; i < lignes.length; i++) {
    var l = lignes[i], h = /^(=+)\s*(.*?)\s*\1\s*$/.exec(l);
    if (!t && h) { titres = titres.slice(0, h[1].length - 1); titres[h[1].length - 1] = h[2]; continue; }
    if (/^\s*\{\|/.test(l)) { t = { titres: titres.filter(Boolean).slice(), lignesBrutes: [] }; ligne = []; continue; }
    if (!t) continue;
    if (/^\s*\|\}/.test(l)) { finLigne(); t.lignes = wikiGrille(t.lignesBrutes); tableaux.push(t); t = null; continue; }
    if (/^\s*\|-/.test(l)) { finLigne(); continue; }
    if (/^\s*\|\+/.test(l)) continue;
    if (/^\s*!/.test(l)) { l.replace(/^\s*!/, "").split("!!").forEach(function (x) { ligne.push(wikiCellule(x, true)); }); continue; }
    if (/^\s*\|/.test(l)) { l.replace(/^\s*\|/, "").split("||").forEach(function (x) { ligne.push(wikiCellule(x, false)); }); continue; }
    // ligne de continuation : rattachée au contenu de la dernière cellule
    if (ligne && ligne.length) ligne[ligne.length - 1].brut += "\n" + l;
  }
  return tableaux;
}

function wikiGrille(lignesBrutes) {
  var attente = [], grille = [];
  lignesBrutes.forEach(function (cellules) {
    var out = [], col = 0, k = 0;
    function videAttente() {
      while (attente[col] && attente[col].reste > 0) { out[col] = attente[col].cellule; attente[col].reste--; col++; }
    }
    for (k = 0; k < cellules.length; k++) {
      videAttente();
      var c = cellules[k];
      for (var j = 0; j < c.colspan; j++) {
        out[col] = c;
        if (c.rowspan > 1) attente[col] = { reste: c.rowspan - 1, cellule: c };
        col++;
      }
    }
    videAttente();
    for (var x = col; x < attente.length; x++) if (attente[x] && attente[x].reste > 0) { out[x] = attente[x].cellule; attente[x].reste--; }
    grille.push(out);
  });
  return grille;
}

function wikiNombre(s) {
  s = wikiTexte(s).replace(/%/g, "").trim();
  if (/^<\s*1$/.test(s)) return 0.5;
  var m = /^-?\d+(?:[.,]\d+)?/.exec(s.replace(/\s/g, ""));
  return m ? parseFloat(m[0].replace(",", ".")) : null;
}

/** « 21-22 octobre », « 30 septembre-2 octobre 2026 », « 1er-3 octobre » -> AAAA-MM-JJ (dernier jour). */
function wikiDateFin(s, anneeParDefaut, reference) {
  var t = wikiSansAccents(wikiTexte(s)).replace(/1er/g, "1"), re = /(\d{1,2})\s*(?:([a-z]+)\.?)?\s*(\d{4})?/g, m, jour = null, mois = null, an = null;
  while ((m = re.exec(t))) {
    if (m[1] && (!m[2] || WIKI_MOIS[m[2]] || /^(janv|fev|sept|oct|nov|dec)/.test(m[2]))) jour = +m[1];
    if (m[2]) {
      var mm = WIKI_MOIS[m[2]];
      if (!mm) for (var k in WIKI_MOIS) if (k.indexOf(m[2]) === 0) mm = WIKI_MOIS[k];
      if (mm) mois = mm;
    }
    if (m[3]) an = +m[3];
  }
  if (!jour || !mois) return null;
  if (!an) {
    an = anneeParDefaut;
    if (!an && reference) { an = reference.getFullYear(); if (mois > reference.getMonth() + 1) an--; }
  }
  if (!an) return null;
  return an + "-" + ("0" + mois).slice(-2) + "-" + ("0" + jour).slice(-2);
}

function wikiLien(s) {
  var m = /\[(https?:\/\/[^\s\]]+)/.exec(String(s || ""));
  return m ? m[1] : null;
}

/** Valeurs d'une case : « 1,5<br><small>Ruffin</small><hr>2<br><small>Villepin</small> » -> [{v, nom}]. */
function wikiValeurs(brut) {
  return String(brut).split(/<hr\s*\/?>/i).map(function (part) {
    var morceaux = part.split(/<br\s*\/?>/i), v = wikiNombre(morceaux[0]);
    var nom = morceaux.length > 1 ? wikiTexte(morceaux.slice(1).join(" ")).replace(/\s*\([^)]*\)\s*$/, "").trim() : "";
    return { v: v, nom: nom };
  }).filter(function (x) { return x.v != null; });
}

/** Index alias -> clé, à partir de [{cle, nom, alias}] (alias séparés par ;). */
function wikiIndexAlias(candidats) {
  var idx = {};
  candidats.forEach(function (c) {
    [c.nom].concat(String(c.alias || "").split(";")).forEach(function (a) {
      a = wikiSansAccents(a || "");
      if (a) { idx[a] = c.cle; idx[a.split(" ").pop()] = idx[a.split(" ").pop()] || c.cle; }
    });
  });
  return idx;
}

function wikiCleNouvelle(nom) {
  return wikiSansAccents(nom).split(" ").pop().replace(/[^a-z0-9-]/g, "");
}

function wikiEstSondeur(c) { return c && /Sondeur/.test(c.attrs + " " + c.brut) || (c && /\[https?:/.test(c.brut)); }

/**
 * Sondages de premier tour.
 * options : { candidats: [{cle, nom, alias}], depuis: "AAAA-MM-JJ" }
 * Pour un sondage à plusieurs hypothèses, on garde celle qui teste le plus de candidats
 * (la première en cas d'égalité). Renvoie [{inst, d, n, url, s: {cle: score}, noms: {cle: nom}, inconnus: [nom]}].
 */
function wikiSondagesPremierTour(wikicode, options) {
  options = options || {};
  var alias = wikiIndexAlias(options.candidats || []), resultat = [];
  wikiTableaux(wikicode).forEach(function (t) {
    var chemin = t.titres.join(" / ");
    if (!/premier tour/i.test(chemin)) return;
    var an = /(20\d\d)/.exec(t.titres.slice(1).join(" ")), annee = an ? +an[1] : null;
    if (!annee) return;
    var entetes = t.lignes.filter(function (l) { return l.length && l.every(function (c) { return c && c.entete; }); });
    if (!entetes.length) return;
    var noms = entetes[entetes.length - 1].map(function (c) { return wikiTexte(c.brut.split(/<br\s*\/?>/i)[0]); });
    var iInst = noms.findIndex(function (n) { return /sondeur|institut/i.test(n); }),
      iDate = noms.findIndex(function (n) { return /^date/i.test(n); }),
      iN = noms.findIndex(function (n) { return /chantillon/i.test(n); });
    if (iInst < 0 || iDate < 0) return;
    var groupes = [];
    t.lignes.forEach(function (l) {
      var c = l[iInst];
      if (!c || c.entete || !wikiEstSondeur(c)) return;
      var g = groupes[groupes.length - 1];
      if (!g || g.cellule !== c) groupes.push(g = { cellule: c, lignes: [] });
      g.lignes.push(l);
    });
    groupes.forEach(function (g) {
      var hyp = g.lignes.map(function (l) {
        var s = {}, nomsCle = {}, inconnus = [];
        for (var i = 0; i < l.length; i++) {
          if (i === iInst || i === iDate || i === iN || !l[i] || (i > 0 && l[i] === l[i - 1])) continue;
          var col = noms[i] || "", estAutres = /autres|divers/i.test(col);
          wikiValeurs(l[i].brut).forEach(function (x) {
            var nom = x.nom || (estAutres ? "" : col);
            if (!nom) return;
            var cle = alias[wikiSansAccents(nom)] || alias[wikiSansAccents(nom).split(" ").pop()];
            if (!cle) { cle = wikiCleNouvelle(nom); inconnus.push(nom); }
            if (s[cle] == null) s[cle] = x.v;
            if (x.nom && wikiSansAccents(x.nom) !== wikiSansAccents(col)) nomsCle[cle] = x.nom;
          });
        }
        return { s: s, noms: nomsCle, inconnus: inconnus, nb: Object.keys(s).length };
      });
      var best = hyp.reduce(function (a, b) { return b.nb > a.nb ? b : a; }, hyp[0]);
      var l0 = g.lignes[0], d = wikiDateFin(l0[iDate] && l0[iDate].brut, annee);
      if (!d || best.nb < 3 || (options.depuis && d < options.depuis)) return;
      resultat.push({
        inst: wikiInstitut(wikiTexte(g.cellule.brut)), d: d,
        n: iN >= 0 && l0[iN] ? (parseInt(wikiTexte(l0[iN].brut).replace(/\D/g, ""), 10) || null) : null,
        url: wikiLien(g.cellule.brut), s: best.s, noms: best.noms, inconnus: best.inconnus
      });
    });
  });
  return resultat.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
}

/**
 * Sondages de second tour, section « candidats déclarés ou pressentis ».
 * Renvoie [{inst, d, a, b, va, vb, url}] avec a et b les noms affichés en tête de colonne.
 */
function wikiSondagesSecondTour(wikicode, reference) {
  var resultat = [];
  wikiTableaux(wikicode).forEach(function (t) {
    var chemin = t.titres.join(" / ");
    if (!/second tour/i.test(chemin) || !/d[ée]clar[ée]s ou pressentis/i.test(chemin)) return;
    var entetes = t.lignes.filter(function (l) { return l.length && l.every(function (c) { return c && c.entete; }); });
    if (!entetes.length) return;
    var noms = entetes[entetes.length - 1].map(function (c) { return wikiTexte(c.brut.split(/<br\s*\/?>/i)[0]); });
    var iInst = noms.findIndex(function (n) { return /sondeur|institut/i.test(n); }),
      iDate = noms.findIndex(function (n) { return /^date/i.test(n); }),
      iN = noms.findIndex(function (n) { return /chantillon/i.test(n); });
    var cols = noms.map(function (n, i) { return i; }).filter(function (i) { return i !== iInst && i !== iDate && i !== iN; }).slice(0, 2);
    if (iInst < 0 || iDate < 0 || cols.length < 2) return;
    var vus = [];
    t.lignes.forEach(function (l) {
      var c = l[iInst];
      if (!c || c.entete || !wikiEstSondeur(c) || vus.indexOf(c) >= 0) return;
      vus.push(c);
      var va = l[cols[0]] ? wikiNombre(l[cols[0]].brut) : null, vb = l[cols[1]] ? wikiNombre(l[cols[1]].brut) : null;
      var d = wikiDateFin(l[iDate] && l[iDate].brut, null, reference);
      if (va == null || vb == null || !d) return;
      resultat.push({ inst: wikiInstitut(wikiTexte(c.brut)), d: d, a: noms[cols[0]], b: noms[cols[1]], va: va, vb: vb, url: wikiLien(c.brut) });
    });
  });
  return resultat.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
}

/** Vrai si deux sondages sont le même (même institut, fins de terrain à 3 jours près). */
function wikiMemeSondage(a, b) {
  if (wikiInstitut(a.inst) !== wikiInstitut(b.inst)) return false;
  var ta = Date.parse(a.d + "T12:00:00Z"), tb = Date.parse(b.d + "T12:00:00Z");
  return Math.abs(ta - tb) <= 3 * 864e5;
}
