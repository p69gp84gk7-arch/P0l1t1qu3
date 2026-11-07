// Organigramme du pouvoir en France (onglet « Informations »), d'après la Constitution du 4 octobre 1958.
// Onglets du Sheet : « institutions » (une case par organe) et « institutions_liens » (qui nomme, élit, contrôle qui).
// Les titulaires actuels sont à corriger à la main dans le Sheet quand ils changent.
// Titulaires vérifiés le 7 novembre 2026 dans l'open data de l'Assemblée nationale (Gouvernement, bureaux des assemblées).

export const ENTETE_INSTITUTIONS = ["cle", "niveau", "colonne", "ordre", "nom", "role", "designation", "mandat", "titulaire", "onglet", "couleur"];
export const ENTETE_INSTITUTIONS_LIENS = ["de", "vers", "relation", "article"];

// niveau : citoyens, pouvoirs, controle, territoires, europe ; colonne (pour « pouvoirs ») : executif, legislatif, judiciaire
export const INSTITUTIONS = [
  ["citoyens", "citoyens", "", 1, "Les citoyens", "Le peuple est souverain (article 3). Les électeurs inscrits (49 millions environ) choisissent leurs représentants et peuvent être consultés directement par référendum.",
    "Tout Français majeur inscrit sur les listes électorales.", "", "", "", "#475569"],

  ["president", "pouvoirs", "executif", 1, "Président de la République", "Chef de l’État et chef des armées. Nomme le Premier ministre, préside le Conseil des ministres, promulgue les lois, peut dissoudre l’Assemblée nationale, soumettre un texte au référendum et, en cas de crise grave, prendre les pleins pouvoirs (article 16). Négocie les traités. Il n’est pas responsable devant le Parlement.",
    "Élu au suffrage universel direct, à deux tours.", "5 ans, deux mandats consécutifs au plus", "Emmanuel Macron (depuis 2017, réélu en 2022, mandat jusqu’en mai 2027)", "sondages", "#23408E"],
  ["premier_ministre", "pouvoirs", "executif", 2, "Premier ministre", "Chef du Gouvernement : il « dirige l’action du Gouvernement » et la politique de la nation au quotidien, propose les ministres au Président, exerce le pouvoir réglementaire (décrets). Il peut engager la responsabilité du Gouvernement devant l’Assemblée (article 49, alinéa 3 : le « 49.3 »).",
    "Nommé par le Président de la République, sans vote obligatoire de l’Assemblée.", "Pas de durée fixe : jusqu’à sa démission ou une motion de censure", "Sébastien Lecornu (depuis septembre 2025)", "", "#23408E"],
  ["gouvernement", "pouvoirs", "executif", 3, "Gouvernement (ministres)", "Les ministres dirigent chacun un ministère (Intérieur, Économie, Éducation…) et préparent les projets de loi, adoptés en Conseil des ministres. Le Gouvernement est responsable devant l’Assemblée nationale.",
    "Nommés par le Président sur proposition du Premier ministre.", "Jusqu’à un remaniement ou la chute du Gouvernement", "", "", "#23408E"],
  ["administration", "pouvoirs", "executif", 4, "Administrations, préfets, armées, police", "Les services de l’État appliquent les lois et les décisions du Gouvernement. Dans chaque département, le préfet représente l’État.",
    "Fonctionnaires recrutés sur concours ; préfets nommés en Conseil des ministres.", "", "", "", "#23408E"],

  ["parlement", "pouvoirs", "legislatif", 1, "Parlement", "Vote les lois et le budget, contrôle l’action du Gouvernement et évalue les politiques publiques (article 24). Il est formé de deux chambres. Réunies en Congrès à Versailles, elles peuvent réviser la Constitution.",
    "Deux assemblées élues.", "", "", "", "#7C3AED"],
  ["assemblee", "pouvoirs", "legislatif", 2, "Assemblée nationale", "577 députés. Elle a le dernier mot sur les lois en cas de désaccord avec le Sénat, et elle seule peut renverser le Gouvernement par une motion de censure (289 voix nécessaires).",
    "Députés élus au suffrage universel direct, un par circonscription, à deux tours.", "5 ans, sauf dissolution", "Présidente : Yaël Braun-Pivet (depuis 2022, réélue en 2024)", "assemblee", "#7C3AED"],
  ["senat", "pouvoirs", "legislatif", 3, "Sénat", "348 sénateurs. Représente les collectivités territoriales, examine toutes les lois et peut les amender ; il ne peut pas renverser le Gouvernement et ne peut pas être dissous. Son président remplace le Président de la République en cas de vacance.",
    "Sénateurs élus au suffrage indirect par environ 162 000 « grands électeurs » (surtout des délégués des conseils municipaux).", "6 ans, renouvelé par moitié tous les 3 ans", "Président : Gérard Larcher (réélu en octobre 2026)", "", "#7C3AED"],

  ["justice_judiciaire", "pouvoirs", "judiciaire", 1, "Justice judiciaire", "Juge les litiges entre personnes (civil) et les infractions (pénal) : tribunaux judiciaires, cours d’appel, et au sommet la Cour de cassation, qui vérifie la bonne application du droit. Les procureurs (parquet) engagent les poursuites.",
    "Magistrats recrutés surtout par concours (École nationale de la magistrature) ; les juges du siège sont inamovibles.", "", "", "justice", "#B45309"],
  ["justice_administrative", "pouvoirs", "judiciaire", 2, "Justice administrative", "Juge les litiges avec l’administration (État, collectivités, hôpitaux…) : tribunaux administratifs, cours administratives d’appel, et au sommet le Conseil d’État, qui conseille aussi le Gouvernement sur ses projets de loi.",
    "Magistrats administratifs (concours, Institut national du service public).", "", "", "", "#B45309"],
  ["csm", "pouvoirs", "judiciaire", 3, "Conseil supérieur de la magistrature", "Garantit l’indépendance des magistrats judiciaires : il donne son avis sur leurs nominations et les sanctionne en cas de faute.",
    "Magistrats élus par leurs pairs et personnalités nommées.", "4 ans", "", "", "#B45309"],
  ["cjr", "pouvoirs", "judiciaire", 4, "Cour de justice de la République", "Juge les ministres pour les crimes et délits commis dans l’exercice de leurs fonctions.",
    "12 parlementaires (6 députés, 6 sénateurs) et 3 magistrats de la Cour de cassation.", "", "", "justice", "#B45309"],

  ["conseil_constitutionnel", "controle", "", 1, "Conseil constitutionnel", "Vérifie que les lois respectent la Constitution, avant leur promulgation ou à la demande d’un justiciable (question prioritaire de constitutionnalité). Veille à la régularité de l’élection présidentielle et proclame ses résultats ; reçoit les déclarations de patrimoine des candidats.",
    "9 membres : 3 nommés par le Président de la République, 3 par le président de l’Assemblée, 3 par le président du Sénat.", "9 ans, non renouvelable", "Président : Richard Ferrand (depuis mars 2025)", "", "#0F766E"],
  ["cour_comptes", "controle", "", 2, "Cour des comptes", "Contrôle l’usage de l’argent public par l’État, les collectivités et la Sécurité sociale, et certifie les comptes de l’État.",
    "Magistrats financiers ; le premier président est nommé en Conseil des ministres.", "", "", "", "#0F766E"],
  ["autorites", "controle", "", 3, "Autorités indépendantes", "Défenseur des droits (droits des citoyens face aux administrations), Arcom (télévision, radio, pluralisme), CNIL (données personnelles), HATVP (patrimoine et intérêts des élus), CNCCFP (comptes de campagne), Commission des sondages…",
    "Membres nommés pour un mandat fixe, ils ne reçoivent pas d’ordres du Gouvernement.", "", "", "financement", "#0F766E"],
  ["cese", "controle", "", 4, "Conseil économique, social et environnemental", "Assemblée consultative : syndicats, patronat, associations et conventions citoyennes donnent des avis au Gouvernement et au Parlement.",
    "175 membres désignés par les organisations qu’ils représentent.", "5 ans", "", "", "#0F766E"],

  ["regions", "territoires", "", 1, "Régions (18)", "Transports régionaux (TER), lycées, développement économique, formation professionnelle.",
    "Conseillers régionaux élus au suffrage universel direct (scrutin de liste).", "6 ans", "", "", "#4D7C0F"],
  ["departements", "territoires", "", 2, "Départements (101)", "Aide sociale (RSA, personnes âgées, enfance), collèges, routes départementales.",
    "Conseillers départementaux élus au suffrage universel direct, en binômes femme-homme.", "6 ans", "", "", "#4D7C0F"],
  ["communes", "territoires", "", 3, "Communes (près de 35 000) et intercommunalités", "État civil, écoles, urbanisme, voirie, police municipale ; les intercommunalités mettent en commun déchets, eau, transports…",
    "Conseillers municipaux élus au suffrage universel direct ; ils élisent le maire.", "6 ans", "", "", "#4D7C0F"],

  ["union_europeenne", "europe", "", 1, "Union européenne", "Une partie des règles appliquées en France est décidée au niveau européen (marché unique, concurrence, agriculture, commerce, monnaie pour la zone euro). Le droit européen s’impose aux lois françaises. Les lois sont proposées par la Commission européenne et adoptées par le Parlement européen et le Conseil (les ministres des États).",
    "81 députés européens élus en France au suffrage universel direct ; le Président de la République siège au Conseil européen.", "5 ans pour le Parlement européen", "", "", "#1D4ED8"],
];

export const LIENS_INSTITUTIONS = [
  ["citoyens", "president", "élisent", "art. 6"],
  ["citoyens", "assemblee", "élisent les députés", "art. 24"],
  ["citoyens", "communes", "élisent les conseils municipaux, départementaux et régionaux", "art. 72"],
  ["citoyens", "union_europeenne", "élisent les députés européens", ""],
  ["communes", "senat", "élisent les sénateurs (grands électeurs)", "art. 24"],
  ["president", "premier_ministre", "nomme", "art. 8"],
  ["premier_ministre", "gouvernement", "propose les ministres et dirige", "art. 8 et 21"],
  ["gouvernement", "administration", "dirige", "art. 20"],
  ["parlement", "assemblee", "se compose de l’Assemblée nationale et du Sénat", "art. 24"],
  ["president", "assemblee", "peut dissoudre", "art. 12"],
  ["president", "citoyens", "peut consulter par référendum", "art. 11"],
  ["president", "conseil_constitutionnel", "nomme 3 membres", "art. 56"],
  ["assemblee", "conseil_constitutionnel", "son président nomme 3 membres", "art. 56"],
  ["senat", "conseil_constitutionnel", "son président nomme 3 membres", "art. 56"],
  ["assemblee", "gouvernement", "peut renverser (motion de censure)", "art. 49"],
  ["premier_ministre", "assemblee", "peut faire adopter un texte sans vote (49.3), sauf censure", "art. 49 al. 3"],
  ["gouvernement", "parlement", "dépose des projets de loi", "art. 39"],
  ["parlement", "gouvernement", "contrôle (questions, commissions d’enquête)", "art. 24"],
  ["parlement", "president", "peut destituer (Haute Cour)", "art. 68"],
  ["conseil_constitutionnel", "parlement", "contrôle les lois votées", "art. 61"],
  ["conseil_constitutionnel", "president", "proclame l’élection", "art. 58"],
  ["cour_comptes", "gouvernement", "contrôle les dépenses", "art. 47-2"],
  ["csm", "justice_judiciaire", "nominations et discipline des magistrats", "art. 64-65"],
  ["cjr", "gouvernement", "juge les ministres", "art. 68-1"],
  ["administration", "communes", "le préfet contrôle la légalité des actes", "art. 72"],
  ["union_europeenne", "parlement", "le droit européen prime sur la loi", "art. 88-1"],
];
