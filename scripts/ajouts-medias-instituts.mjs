// Médias et instituts ajoutés après l'extraction de la page d'origine (onglets « medias » et « instituts »).
// Un média ajouté rejoint un groupe de propriétaires déjà présent pour la même élection ; il en reprend
// les colonnes groupe et description.

// [election, propriétaire, média, type, orientation, certitude, détail, groupe, description]
// groupe et description ne servent que si le propriétaire n'a pas encore de ligne pour cette élection.
const DRAHI_2027 = ["Altice (SFR) ; i24NEWS", "A vendu BFMTV, RMC et leurs chaînes sœurs à Rodolphe Saadé en 2024, et confié Libération à une structure indépendante qu’il a financée. Garde la chaîne d’information i24NEWS."];
const BAYLET_17 = "Régionale (Toulouse) ; propriétaire Jean-Michel Baylet, ministre jusqu’en mai 2017 et ancien président du Parti radical de gauche";
const BAYLET_22 = "Régionale (Toulouse) ; famille de Jean-Michel Baylet, ancien ministre et ex-président du Parti radical de gauche";
export const AJOUTS_MEDIAS = [
  // Patrick Drahi
  ["2017", "Patrick Drahi", "BFM Business", "TV", "Centre-droit", "discuté", "Économie"],
  ["2017", "Patrick Drahi", "RMC Découverte", "TV", "Centre", "discuté", "Documentaires"],
  ["2017", "Patrick Drahi", "i24NEWS", "TV", "Centre-droit", "discuté", "Info internationale depuis Israël, en français"],
  ["2022", "Patrick Drahi", "BFM Business", "TV", "Centre-droit", "discuté", "Économie"],
  ["2022", "Patrick Drahi", "RMC Story, RMC Découverte", "TV", "Centre", "discuté", "Talk-shows et documentaires"],
  ["2022", "Patrick Drahi", "BFM régionales (Paris, Lyon, Lille…)", "TV", "Centre", "discuté", "Info locale"],
  ["2022", "Patrick Drahi", "RMC Sport", "TV", "Centre", "discuté", "Sport"],
  ["2022", "Patrick Drahi", "i24NEWS", "TV", "Centre-droit", "discuté", "Info internationale depuis Israël, en français"],
  ["2027", "Patrick Drahi", "i24NEWS", "TV", "Centre-droit", "discuté", "Info internationale depuis Israël, en français", ...DRAHI_2027],
  // anciennes chaînes de Patrick Drahi, à Rodolphe Saadé depuis 2024
  ["2027", "Rodolphe Saadé", "BFM Business", "TV", "Centre-droit", "discuté", "Économie (ex-Drahi)"],
  ["2027", "Rodolphe Saadé", "RMC Story, RMC Découverte", "TV", "Centre", "discuté", "Talk-shows et documentaires (ex-Drahi)"],
  ["2027", "Rodolphe Saadé", "BFM régionales (Paris, Lyon, Marseille…)", "TV", "Centre", "discuté", "Info locale (ex-Drahi)"],
  // La Dépêche du Midi (famille Baylet)
  ["2017", "Autres propriétaires", "La Dépêche du Midi", "Presse", "Centre-gauche", "discuté", BAYLET_17],
  ["2022", "Autres propriétaires", "La Dépêche du Midi, Midi Libre", "Presse", "Centre-gauche", "discuté", BAYLET_22],
  // autres ajouts
  ["2017", "Service public", "France Bleu", "Radio", "Centre", "discuté", "Réseau de radios locales de Radio France"],
  ["2022", "Service public", "France Bleu", "Radio", "Centre", "discuté", "Réseau de radios locales de Radio France"],
  ["2027", "Service public", "ICI (ex-France Bleu)", "Radio", "Centre", "discuté", "Réseau de radios locales de Radio France, rebaptisé ICI en 2025"],
  ["2017", "Indépendants ou associatifs", "Charlie Hebdo", "Presse", "Gauche", "discuté", "Satirique et laïque, détenu par ses dirigeants"],
  ["2022", "Indépendants ou associatifs", "Charlie Hebdo", "Presse", "Gauche", "discuté", "Satirique et laïque, détenu par ses dirigeants"],
  ["2027", "Indépendants ou associatifs", "Charlie Hebdo", "Presse", "Gauche", "discuté", "Satirique et laïque, détenu par ses dirigeants"],
  ["2027", "Indépendants ou associatifs", "Arrêt sur images", "En ligne", "Gauche", "discuté", "Critique des médias, financé par ses abonnés"],
  ["2027", "Indépendants ou associatifs", "Le Courrier de l’Ouest, Presse Océan, Le Maine libre", "Presse", "Centre", "discuté", "Régionale (groupe Ouest-France)"],
  ["2027", "Familles Baylet, Rossel, Crédit Mutuel…", "Midi Libre, L’Indépendant", "Presse", "Centre", "discuté", "Régionale (groupe La Dépêche, famille Baylet)"],
  ["2027", "Familles Baylet, Rossel, Crédit Mutuel…", "Le Télégramme", "Presse", "Centre", "discuté", "Régionale (Bretagne, famille Coudurier)"],
  ["2027", "Familles Baylet, Rossel, Crédit Mutuel…", "La Montagne, Le Berry républicain", "Presse", "Centre", "discuté", "Régionale (groupe Centre France)"],
];

// Médias renommés : [election, ancien nom, nouveau nom]
export const RENOMMAGES_MEDIAS = [
  ["2027", "Le Progrès, DNA, L’Est républicain (EBRA)", "Le Progrès, Le Dauphiné libéré, DNA, L’Est républicain, Le Républicain lorrain (EBRA)"],
];

// Colonnes de l'onglet instituts : election, nom, cle (nom de l'institut dans les sondages), etiquettes,
// milliardaire, proprietaire, dirigeants, clients, liens
export const AJOUTS_INSTITUTS = [
  ["2022", "YouGov", "YouGov", "Coté en Bourse (Royaume-Uni)", "non",
    "Groupe britannique coté à Londres, cofondé en 2000 par Stephan Shakespeare et Nadhim Zahawi.", "Équipe YouGov France.",
    "Le cabinet de conseil Datapraxis pour ses vagues d’avril 2022.", "Deux sondages présidentiels publiés pendant la campagne, réalisés en ligne sur son propre panel."],
  ["2022", "Redfield & Wilton Strategies", "Redfield & Wilton Strategies", "Indépendant (Royaume-Uni)", "non",
    "Société privée fondée à Londres en 2020 par Bruno Rodrigues.", "Bruno Rodrigues.",
    "Sondages publiés de sa propre initiative, surtout sur le Royaume-Uni et les États-Unis.", "Membre du British Polling Council. Un seul sondage sur la présidentielle française : trop peu pour juger un écart."],
  ["2022", "AtlasIntel", "AtlasIntel", "Indépendant (Brésil)", "non",
    "Institut privé fondé par Andrei Roman et Thiago Costa, basé à São Paulo.", "Andrei Roman, directeur général.",
    "Sondages publiés en Amérique latine, aux États-Unis et en Europe.", "Un seul sondage sur la présidentielle française : trop peu pour juger un écart."],
];

/** Applique les ajouts aux tableaux d'onglets (en-tête en première ligne). */
export function appliquerAjouts(T) {
  const M = T.medias, h = M[0], col = (k) => h.indexOf(k);
  for (const [y, ancien, nouveau] of RENOMMAGES_MEDIAS) {
    const r = M.find((r) => String(r[col("election")]) === y && r[col("media")] === ancien);
    if (r) r[col("media")] = nouveau;
  }
  for (const [y, prop, media, type, orientation, certitude, detail, groupe, description] of AJOUTS_MEDIAS) {
    if (M.some((r) => String(r[col("election")]) === y && r[col("media")] === media)) continue;
    let modele = M.find((r) => String(r[col("election")]) === y && r[col("proprietaire")] === prop);
    if (!modele && groupe) {
      // nouveau groupe : placé avant les indépendants et le service public de la même élection
      modele = h.map(() => null);
      Object.assign(modele, { [col("election")]: y, [col("proprietaire")]: prop, [col("groupe")]: groupe, [col("description")]: description });
      const i = M.findIndex((r) => String(r[col("election")]) === y && /^(Autres propriétaires|Indépendants|Service public)/.test(r[col("proprietaire")] || ""));
      M.splice(i < 0 ? M.length : i, 0, Object.assign([...modele], { [col("media")]: media, [col("type")]: type, [col("orientation")]: orientation, [col("certitude")]: certitude, [col("detail")]: detail }));
      continue;
    }
    if (!modele) throw new Error(`groupe introuvable : ${y} ${prop}`);
    const ligne = h.map(() => null);
    Object.assign(ligne, { [col("election")]: y, [col("proprietaire")]: prop, [col("groupe")]: modele[col("groupe")], [col("description")]: modele[col("description")],
      [col("media")]: media, [col("type")]: type, [col("orientation")]: orientation, [col("certitude")]: certitude, [col("detail")]: detail });
    // à la suite des autres médias du même groupe
    const dernier = M.reduce((j, r, i) => (String(r[col("election")]) === y && r[col("proprietaire")] === prop ? i : j), -1);
    M.splice(dernier + 1, 0, ligne);
  }
  for (const r of AJOUTS_INSTITUTS) if (!T.instituts.some((x) => String(x[0]) === r[0] && x[2] === r[2])) T.instituts.push([...r]);
  return T;
}
