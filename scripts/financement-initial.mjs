// Financement des campagnes présidentielles (onglet « financement »).
// 2017 et 2022 : comptes arrêtés par la CNCCFP (montants « retenus par la Commission » dans ses décisions
// publiées au Journal officiel). 2027 : pas encore de compte (publication au plus tard le 2 août 2027) ;
// les lignes décrivent les ressources connues des partis.
//
// Recettes du compte = apport personnel du candidat (le plus souvent un emprunt) + versements définitifs des
// partis + dons de particuliers + autres recettes (ventes…) + contributions des partis (dépenses payées
// directement et concours en nature) + autres concours en nature.
// remboursement_etat : somme due par l'État (remboursement forfaitaire, avance de 153 000 € en 2017 et
// 200 000 € en 2022 comprise).

export const ENTETE_FINANCEMENT = ["election", "cle", "nom", "parti", "depenses", "recettes", "apport_personnel", "versements_partis",
  "contributions_partis", "dons", "autres_recettes", "concours_nature", "remboursement_etat", "preteur", "commentaire", "source", "lien"];

const S22 = "Décisions de la CNCCFP du 14 décembre 2022 (Journal officiel du 27 janvier 2023)";
const L22 = "https://www.cnccfp.fr/wp-content/uploads/2023/02/cnccfp-decisions-presidentielle-2022.pdf";
const S17 = "Décisions de la CNCCFP du 21 décembre 2017 (Journal officiel)";
const L17 = "https://cnccfp.fr/wp-content/uploads/2022/04/De%CC%81cisions_pre%CC%81sidentielle_2017.pdf";
const LCP = "https://lcp.fr/actualites/dons-banques-argent-public-d-ou-vient-l-argent-des-campagnes-presidentielles-434695";

// [cle, nom, parti, dépenses, recettes, apport, versements partis, contributions partis, dons, autres recettes, concours en nature, remboursement, prêteur, commentaire, source, lien]
const C2022 = [
  ["macron", "Emmanuel Macron", "La République en marche", 16535603, 16673510, 10725630, 566609, 4743465, 605853, 29800, 2153, 10463959,
    "Non publié par la CNCCFP.",
    "Le parti paie 4,7 M€ de dépenses (dépenses directes et concours en nature). Remboursement réduit de 100 000 € par la CNCCFP pour une irrégularité. Deux informations judiciaires (affaire McKinsey) portent sur les campagnes de 2017 et 2022.", S22, L22],
  ["lepen", "Marine Le Pen", "Rassemblement national", 10671587, 11383445, 11248882, 0, 36551, 76638, 21347, 27, 10220842,
    "Banque hongroise MKB : prêt de 10,69 M€, utilisé à hauteur de 10,49 M€ ; aucune banque française n’avait accepté de prêter.",
    "Campagne financée presque entièrement par l’emprunt, remboursé à 96 % par l’État. Une information judiciaire est ouverte depuis juillet 2024 sur des soupçons de financement illicite de cette campagne (voir l’onglet Justice).", `${S22} ; franceinfo (février 2022)`, L22],
  ["melenchon", "Jean-Luc Mélenchon", "La France insoumise (Union populaire)", 13519579, 13924466, 8059303, 1300000, 2173284, 2352347, 39532, 0, 7629786,
    "Non publié par la CNCCFP.",
    "Les formations qui le soutiennent versent 1,3 M€ et paient 2,2 M€ de dépenses ; 2,35 M€ de dons de particuliers.", S22, L22],
  ["zemmour", "Éric Zemmour", "Reconquête", 10826804, 11063135, 10085302, 0, 501103, 37215, 383197, 56318, 7804225,
    "Non publié par la CNCCFP.",
    "Reconquête paie 0,5 M€ de dépenses. Remboursement réduit de 200 000 € par la CNCCFP en raison d’irrégularités.", S22, L22],
  ["lr", "Valérie Pécresse", "Les Républicains", 13554449, 13554449, 805842, 5155300, 3375325, 4213748, 0, 4234, 785423,
    "Le lendemain du premier tour, elle se dit « endettée personnellement à hauteur de 5 millions d’euros » et lance un appel aux dons pour rembourser.",
    "Sous les 5 %, l’État ne lui rembourse que 785 423 €. Son appel aux dons rapporte 5,1 M€ selon son entourage. Les Républicains versent 5,2 M€ et paient 3,4 M€ de dépenses.", `${S22} ; Public Sénat`, "https://www.publicsenat.fr/actualites/politique/endettee-personnellement-a-hauteur-de-5-millions-d-euros-valerie-pecresse-lance-un"],
  ["eelv", "Yannick Jadot", "Europe Écologie Les Verts", 5016727, 5017327, 656261, 3049830, 2624, 1300738, 7874, 0, 651661,
    "Prêt de 3,65 M€ d’Europe Écologie Les Verts, devenu un apport définitif du parti faute d’avoir atteint 5 %.",
    "1,3 M€ de dons de particuliers ; appel aux dons après le premier tour.", S22, L22],
  ["lassalle", "Jean Lassalle", "Résistons !", 795520, 813106, 786502, 0, 2009, 0, 24595, 0, 770991, "", "Campagne financée presque entièrement par son apport personnel.", S22, L22],
  ["roussel", "Fabien Roussel", "Parti communiste français", 3880949, 3936776, 976461, 1200000, 1431008, 182545, 102394, 44369, 754886, "",
    "Le Parti communiste verse 1,2 M€ et paie 1,4 M€ de dépenses.", S22, L22],
  ["nda", "Nicolas Dupont-Aignan", "Debout la France", 857428, 864562, 737018, 0, 48367, 63133, 900, 15144, 728884, "", "", S22, L22],
  ["ps", "Anne Hidalgo", "Parti socialiste", 3709765, 3740581, 965428, 1498217, 1117728, 155827, 3381, 0, 800423, "",
    "Le Parti socialiste verse 1,5 M€ et paie 1,1 M€ de dépenses.", S22, L22],
  ["poutou", "Philippe Poutou", "Nouveau Parti anticapitaliste", 810556, 814020, 800870, 0, 13150, 0, 0, 0, 794406, "", "", S22, L22],
  ["arthaud", "Nathalie Arthaud", "Lutte ouvrière", 889844, 891903, 788745, 0, 6325, 63267, 22664, 10902, 786686, "", "", S22, L22],
];

const C2017 = [
  ["macron", "Emmanuel Macron", "En Marche", 16578781, 16702371, 10782684, 362587, 4173065, 1016758, 2, 367275, 10640794,
    "Emprunt bancaire personnel de 8 M€ annoncé en janvier 2017.",
    "En Marche paie 4,2 M€ de dépenses. Le mouvement a collecté environ 16 M€ de dons de 2016 à fin 2017, dont 48 % venant de 1 212 dons de 4 500 € et plus.", `${S17} ; Public Sénat ; Wikipédia`, L17],
  ["lepen", "Marine Le Pen", "Front national", 11542991, 11664038, 10927209, 0, 330782, 43435, 362612, 0, 10691775,
    "Prêts de deux formations politiques, dont Cotelec (micro-parti de Jean-Marie Le Pen), pour 11 795 000 € au total.",
    "La CNCCFP retire 827 017 € d’intérêts facturés par ces deux formations, qui ne correspondaient pas à une refacturation d’intérêts bancaires.", S17, L17],
  ["lr", "François Fillon", "Les Républicains", 13794601, 13794601, 2117625, 10000000, 1480507, 6600, 0, 189869, 2067625, "",
    "Les Républicains versent 10 M€ et apportent 1,5 M€ de dépenses et de concours en nature. Le remboursement de l’État (2,07 M€) est plafonné par son apport personnel.", S17, L17],
  ["melenchon", "Jean-Luc Mélenchon", "La France insoumise", 10241760, 10606340, 6395884, 0, 215758, 2898199, 895460, 201039, 6031304,
    "Prêts de deux banques coopératives (8 M€ annoncés en janvier 2017).",
    "2,9 M€ de dons de particuliers et 0,9 M€ d’autres recettes. Ces comptes ont fait l’objet d’une information judiciaire (voir l’onglet Justice).", `${S17} ; Public Sénat`, L17],
  ["ps", "Benoît Hamon", "Parti socialiste", 15008634, 15154538, 8094947, 3529036, 3337374, 160271, 10379, 22531, 7949043,
    "Crédit coopératif : prêt de 8 M€ garanti par une hypothèque sur le siège du PS, rue de Solférino.",
    "Le Parti socialiste verse 3,5 M€ et paie 3,3 M€ de dépenses.", `${S17} ; Public Sénat`, "https://www.publicsenat.fr/actualites/politique/le-ps-a-hypotheque-son-siege-rue-de-solferino-77889"],
  ["nda", "Nicolas Dupont-Aignan", "Debout la France", 1806590, 1825164, 833097, 0, 451566, 470371, 14355, 55775, 800423, "", "Debout la France apporte 0,45 M€ en nature.", S17, L17],
  ["lassalle", "Jean Lassalle", "Résistons !", 241573, 241879, 228965, 0, 0, 7310, 5604, 0, 228659, "", "", S17, L17],
  ["poutou", "Philippe Poutou", "Nouveau Parti anticapitaliste", 767723, 769455, 768275, 0, 0, 0, 1180, 0, 766543, "", "", S17, L17],
  ["asselineau", "François Asselineau", "Union populaire républicaine", 1237609, 1272714, 790244, 0, 477870, 4600, 0, 0, 755139, "", "L’UPR paie 0,48 M€ de dépenses.", S17, L17],
  ["arthaud", "Nathalie Arthaud", "Lutte ouvrière", 956121, 959286, 860884, 0, 28041, 52307, 18054, 0, 800423, "", "", S17, L17],
  ["cheminade", "Jacques Cheminade", "Solidarité et progrès", 406563, 406737, 337780, 0, 0, 40897, 953, 27107, 337606, "", "", S17, L17],
];

// 2027 : [cle, nom, parti, commentaire] (ressources des partis d'après LCP, 2026)
const C2027 = [
  ["rn", "Marine Le Pen / Jordan Bardella", "Rassemblement national", "Aide publique de 14,8 M€ en 2025, mais bilan financier négatif de 11 M€ en 2024. Faute de prêt bancaire français en 2022, le RN demande d’autoriser les prêts de particuliers pour la présidentielle."],
  ["attal", "Gabriel Attal", "Renaissance", "Budget de 21,7 M€ en 2024, le plus élevé du camp présidentiel ; le parti a vendu son siège parisien en 2025. La majorité présidentielle a reçu 11,3 M€ d’aide publique en 2025."],
  ["philippe", "Édouard Philippe", "Horizons", "1,6 M€ de ressources en 2024 ; « un petit budget, mais il peut obtenir des prêts »."],
  ["retailleau", "Bruno Retailleau", "Les Républicains", "Déficit net de 3,6 M€ en 2024 ; l’argent est « un énorme sujet de préoccupation » selon un ministre."],
  ["glucksmann", "Raphaël Glucksmann", "Place publique (allié au PS)", "Collecte de dons lors de dîners avec des chefs d’entreprise (PME et grandes entreprises). Le Parti socialiste disposait de 33,4 M€ en 2024 et a reçu 7,9 M€ d’aide publique en 2025."],
  ["melenchon", "Jean-Luc Mélenchon", "La France insoumise", "Environ 1 M€ de ressources en 2024 ; les campagnes passées ont reposé sur des emprunts et des dons de particuliers."],
  ["roussel", "Fabien Roussel", "Parti communiste français", "Parti le plus riche en 2024 avec 34,5 M€."],
];

export const LIGNES_FINANCEMENT = [
  ...C2017.map((r) => ["2017", ...r]),
  ...C2022.map((r) => ["2022", ...r]),
  ...C2027.map(([cle, nom, parti, com]) => ["2027", cle, nom, parti, null, null, null, null, null, null, null, null, null, "", com, "LCP (2026)", LCP]),
];
