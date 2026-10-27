// Affaires judiciaires des candidats aux présidentielles et de leurs partis (onglet « justice »).
// Situation au 27 octobre 2026. Ne figurent que des décisions de justice et des procédures ouvertes par
// la justice (enquête du parquet, information judiciaire, mise en examen) ; une simple plainte sans suite
// connue n'est pas retenue, sauf quand elle a déclenché une enquête. Toute personne non condamnée
// définitivement est présumée innocente.
//
// statut : definitive (condamnation définitive), non_definitive (appel ou pourvoi en cours ou possible),
// civile (condamnation civile ou sanction administrative), en_cours (enquête ou instruction en cours),
// relaxe, non_lieu, classee (classement sans suite).
// Montants en euros. amende_eur : amende ferme seulement (les amendes avec sursis sont dans « peine »).
// sommes_eur : dommages et intérêts, remboursements, confiscations mis à la charge de la personne ou du parti.
// candidats : « année:clé » des candidats concernés (clés de l'onglet candidats), séparés par « ; ».

export const ENTETE_JUSTICE = ["id", "candidats", "type", "nom", "affaire", "infraction", "statut", "date", "peine",
  "prison_ferme_mois", "prison_sursis_mois", "amende_eur", "ineligibilite_mois", "sommes_eur", "sommes_detail", "resume", "source", "lien"];

const LE_PEN = "2017:lepen;2022:lepen;2027:rn";
const MELENCHON = "2017:melenchon;2022:melenchon;2027:melenchon";
const ZEMMOUR = "2022:zemmour;2027:zemmour";
const W_FN = "https://fr.wikipedia.org/wiki/Affaire_des_assistants_parlementaires_du_Front_national_au_Parlement_europ%C3%A9en";
const W_ZEMMOUR = "https://fr.wikipedia.org/wiki/%C3%89ric_Zemmour#Condamnations,_relaxes_et_poursuites_judiciaires";
const W_MELENCHON = "https://fr.wikipedia.org/wiki/Jean-Luc_M%C3%A9lenchon#Affaires_judiciaires";

// [id, candidats, type, nom, affaire, infraction, statut, date, peine, ferme, sursis, amende, inéligibilité, sommes, détail des sommes, résumé, source, lien]
const A = [
  ["lepen-assistants-ue", LE_PEN, "personne", "Marine Le Pen", "Assistants parlementaires du FN au Parlement européen", "Détournement de fonds publics",
    "non_definitive", "2026-07-07", "Cour d’appel de Paris : 3 ans de prison dont 1 an ferme sous bracelet électronique, 100 000 € d’amende, 45 mois d’inéligibilité dont 30 avec sursis. Pourvoi en cassation : décision attendue avant le premier tour de 2027.",
    12, 24, 100000, 45, 330000, "Environ 330 000 € remboursés au Parlement européen en 2023 pour deux emplois d’assistants (Catherine Griset, Thierry Légier).",
    "Mise en examen en 2017. Condamnée en première instance le 31 mars 2025 (4 ans dont 2 ferme, 100 000 €, 5 ans d’inéligibilité avec exécution provisoire). La cour d’appel confirme la culpabilité et allège la peine ; les 15 mois d’inéligibilité ferme sont considérés comme déjà exécutés.",
    "Wikipédia ; Le Club des juristes ; communiqué de la cour d’appel de Paris (7 juillet 2026)", "https://www.leclubdesjuristes.com/justice/affaire-des-assistants-parlementaires-du-fn-coup-darret-a-la-candidature-de-marine-le-pen-16827/"],
  ["rn-assistants-ue", LE_PEN, "parti", "Rassemblement national (ex-Front national)", "Assistants parlementaires du FN au Parlement européen", "Complicité de détournement de fonds publics et recel (personne morale)",
    "non_definitive", "2026-07-07", "Cour d’appel de Paris : 2 M€ d’amende dont 1 M€ avec sursis, et confiscation de 1 M€ saisi pendant l’enquête. Pourvoi en cassation.",
    null, null, 1000000, null, 1000000, "1 M€ saisi en 2018 sur l’aide publique au parti, confisqué.",
    "Le tribunal a estimé le préjudice à 2,9 M€ (4,98 M€ selon le Parlement européen). Vingt-quatre personnes ont été condamnées en première instance, dont neuf eurodéputés et douze assistants.",
    "Wikipédia (récapitulatif des peines prononcées en appel)", W_FN],
  ["rn-jeanne", LE_PEN, "parti", "Rassemblement national (ex-Front national)", "Kits de campagne du micro-parti Jeanne (élections de 2012)", "Recel d’abus de biens sociaux (personne morale)",
    "definitive", "2024-06-19", "Le parti est condamné en appel (2023) à 250 000 € d’amende ; décision confirmée par la Cour de cassation en juin 2024.",
    null, null, 250000, null, null, "",
    "Marine Le Pen n’était pas poursuivie. Le micro-parti Jeanne, un prestataire (Frédéric Chatillon) et l’eurodéputé Jean-François Jalkh doivent rembourser solidairement 860 000 € de frais de campagne à l’État.",
    "Wikipédia (affaire Jeanne)", "https://fr.wikipedia.org/wiki/Affaire_Jeanne"],
  ["rn-groupe-id", "2027:rn", "parti", "Rassemblement national", "Fonds du groupe Identité et démocratie au Parlement européen (2019-2024)", "Soupçons de dépenses indues de fonds européens (4,3 M€)",
    "en_cours", "2026-06-30", "", null, null, null, null, null, "",
    "Enquête du parquet européen ouverte en juillet 2025 ; perquisitions le 30 juin 2026 en France, Espagne, Italie et Belgique, notamment chez des prestataires de communication. Aucune mise en examen annoncée.",
    "franceinfo (1er juillet 2026)", "https://www.franceinfo.fr/politique/front-national/quatre-questions-sur-la-nouvelle-affaire-qui-eclabousse-le-rn-au-parlement-europeen-autour-de-soupcons-de-detournement-de-fonds-par-un-groupe-de-partis-d-extreme-droite_8087879.html"],
  ["bardella-assistant", "2027:rn", "personne", "Jordan Bardella", "Emploi d’assistant parlementaire européen en 2015 et formations média", "Soupçons de détournement de fonds publics",
    "en_cours", "2026-07-01", "", null, null, null, null, null, "",
    "Plainte d’Anticor (janvier 2026) sur son emploi d’assistant de l’eurodéputé Jean-François Jalkh en 2015 ; enquête du parquet européen, révélée en mai 2026, sur des formations média financées par des fonds européens. Aucune mise en examen ; il conteste les faits.",
    "franceinfo (1er juillet 2026)", "https://www.franceinfo.fr/politique/front-national/quatre-questions-sur-la-nouvelle-affaire-qui-eclabousse-le-rn-au-parlement-europeen-autour-de-soupcons-de-detournement-de-fonds-par-un-groupe-de-partis-d-extreme-droite_8087879.html"],

  ["fillon-penelope", "2017:lr", "personne", "François Fillon", "Emplois fictifs de Penelope Fillon", "Détournement de fonds publics, complicité et recel d’abus de biens sociaux",
    "definitive", "2026-02-16", "4 ans de prison avec sursis, 375 000 € d’amende, 5 ans d’inéligibilité (cour d’appel, 17 juin 2025). Définitive depuis le désistement de son pourvoi le 16 février 2026.",
    null, 48, 375000, 60, 800000, "Environ 800 000 € de dommages et intérêts à l’Assemblée nationale, avec son épouse et son ancien suppléant ; remboursement engagé.",
    "Révélée en janvier 2017, pendant la campagne. Condamné en 2020 (5 ans dont 2 ferme), puis en appel en 2022 (4 ans dont 1 ferme, 10 ans d’inéligibilité) ; culpabilité confirmée par la Cour de cassation en 2024, peine refixée en 2025. Penelope Fillon : 2 ans avec sursis et 375 000 € d’amende.",
    "Wikipédia (affaire Fillon) ; France 24 ; RTS", "https://www.france24.com/fr/info-en-continu/20250617-penelopegate-fran%C3%A7ois-fillon-fix%C3%A9-sur-sa-peine"],

  ["melenchon-perquisition", MELENCHON, "personne", "Jean-Luc Mélenchon", "Perquisition au siège de La France insoumise (octobre 2018)", "Actes d’intimidation contre l’autorité judiciaire, rébellion et provocation",
    "definitive", "2019-12-09", "3 mois de prison avec sursis et 8 000 € d’amende (tribunal de Bobigny) ; pas d’appel.",
    null, 3, 8000, null, null, "", "", "Wikipédia", W_MELENCHON],
  ["melenchon-radio-france", MELENCHON, "personne", "Jean-Luc Mélenchon", "Propos contre des journalistes de Radio France (2018)", "Injure publique et diffamation",
    "non_definitive", "2022-01-11", "500 € d’amende avec sursis et 3 000 € de dommages et intérêts (tribunal de Paris, première instance ; suite non connue).",
    null, null, null, null, 3000, "3 000 € de dommages et intérêts.", "", "Wikipédia", W_MELENCHON],
  ["melenchon-combo", MELENCHON, "personne", "Jean-Luc Mélenchon et La France insoumise", "Utilisation d’une œuvre de l’artiste Combo dans des clips de campagne", "Atteinte au droit d’auteur",
    "civile", "2023-07-01", "Condamnés en appel à verser 40 000 € à l’artiste.", null, null, null, null, 40000, "40 000 € à l’artiste, avec LFI.", "", "Wikipédia", W_MELENCHON],
  ["melenchon-assistants-ue", MELENCHON, "personne", "Jean-Luc Mélenchon", "Assistants au Parlement européen", "Soupçons de détournement de fonds publics",
    "en_cours", "2026-05-26", "", null, null, null, null, null, "",
    "Information judiciaire ouverte en 2018. Les juges ont clos l’instruction en mai 2026 sans mettre en examen Jean-Luc Mélenchon ; deux anciens assistants sont témoins assistés. Le parquet doit encore prendre ses réquisitions.",
    "CNews ; Le JDD (mai 2026)", "https://www.lejdd.fr/politique/enquete-sur-les-assistants-parlementaires-de-lfi-linstruction-terminee-sans-mise-en-examen-174903"],
  ["lfi-comptes-2017", MELENCHON, "parti", "La France insoumise", "Comptes de la campagne présidentielle de 2017", "Soupçons de prêt illicite de main-d’œuvre, faux, escroquerie",
    "en_cours", "2026-05-01", "", null, null, null, null, null, "",
    "Information judiciaire ouverte en 2018 sur des prestations facturées à la campagne (L’Ère du peuple, Mediascop). Quatre mises en examen, dont l’association L’Ère du peuple et Sophia Chikirou ; Jean-Luc Mélenchon n’est pas mis en examen. Instruction close en mai 2026 : renvoi devant le tribunal ou non-lieu à venir.",
    "France 24 / AFP (1er juin 2026)", "https://www.france24.com/fr/info-en-continu/20260601-comptes-de-campagne-2017-de-lfi-fin-des-investigations-%C3%A0-paris"],

  ["zemmour-2011", ZEMMOUR, "personne", "Éric Zemmour", "Propos sur les contrôles au faciès et l’embauche (2010)", "Provocation à la discrimination raciale",
    "definitive", "2011-03-01", "Deux amendes de 1 000 € avec sursis ; pas d’appel.", null, null, null, null, 10502, "Environ 10 500 € de dommages et intérêts et de frais de justice aux associations.", "", "Wikipédia", W_ZEMMOUR],
  ["zemmour-2016-islam", ZEMMOUR, "personne", "Éric Zemmour", "Propos sur les musulmans dans « C à vous » (2016)", "Provocation à la haine religieuse",
    "definitive", "2019-09-17", "5 000 € d’amende (cour d’appel, 2018) ; pourvoi rejeté en 2019, recours rejeté par la CEDH en 2022.", null, null, 5000, null, 3001, "1 € de dommages et intérêts et 3 000 € de frais de justice.", "", "Wikipédia", W_ZEMMOUR],
  ["zemmour-convention-2019", ZEMMOUR, "personne", "Éric Zemmour", "Discours à la Convention de la droite (2019)", "Injure publique et provocation à la haine",
    "definitive", "2025-09-16", "15 000 € d’amende (cour d’appel, 2024, après une relaxe annulée par la Cour de cassation) ; pourvoi rejeté en 2025.", null, null, 15000, null, 12000, "1 000 € de dommages et intérêts et 2 000 € de frais à chacune des quatre associations.", "", "Wikipédia ; Le Club des juristes", W_ZEMMOUR],
  ["zemmour-mineurs-isoles", ZEMMOUR, "personne", "Éric Zemmour", "Propos sur les mineurs isolés étrangers sur CNews (2020)", "Complicité d’injure raciale et provocation à la haine",
    "definitive", "2025-12-02", "10 000 € d’amende ; confirmée en appel puis par la Cour de cassation.", null, null, 10000, null, null, "", "", "Wikipédia ; Le Club des juristes", W_ZEMMOUR],
  ["zemmour-ined", ZEMMOUR, "personne", "Éric Zemmour", "Accusation contre l’INED de « trafiquer les chiffres » (2021)", "Diffamation publique envers une administration",
    "definitive", "2026-01-27", "Condamnation confirmée en appel (2024) ; pourvoi rejeté en 2026.", null, null, null, null, null, "", "", "Wikipédia", W_ZEMMOUR],
  ["zemmour-hapsatou-sy", ZEMMOUR, "personne", "Éric Zemmour", "Propos visant Hapsatou Sy", "Injure à caractère raciste",
    "definitive", "2025-09-02", "4 000 € d’amende ; confirmée en appel (2024) puis par la Cour de cassation.", null, null, 4000, null, 6000, "3 000 € de dommages et intérêts et 3 000 € de frais de procédure.", "", "Wikipédia", W_ZEMMOUR],
  ["zemmour-klugman", ZEMMOUR, "personne", "Éric Zemmour", "Propos visant l’avocat Patrick Klugman (2022)", "Diffamation",
    "definitive", "2025-12-05", "Condamnation de janvier 2024 confirmée en appel puis par la Cour de cassation.", null, null, null, null, null, "", "", "Wikipédia ; Le Club des juristes", W_ZEMMOUR],
  ["zemmour-obono", ZEMMOUR, "personne", "Éric Zemmour", "Propos visant la députée Danièle Obono (2020)", "Complicité de diffamation publique",
    "definitive", "2026-06-01", "1 000 € d’amende avec sursis ; confirmée en appel (2025) puis par la Cour de cassation.", null, null, null, null, 1000, "1 000 € de dommages et intérêts.", "", "Wikipédia", W_ZEMMOUR],
  ["zemmour-petain", ZEMMOUR, "personne", "Éric Zemmour", "Propos sur Pétain et les Juifs français (2019)", "Contestation de crime contre l’humanité",
    "non_definitive", "2025-04-02", "10 000 € d’amende (cour d’appel, après deux relaxes et une cassation) ; pourvoi en cassation en cours.", null, null, 10000, null, 6005, "1 € de dommages et intérêts et 1 200 € de frais à chacune des cinq associations.", "", "Wikipédia", W_ZEMMOUR],
  ["zemmour-crepol", ZEMMOUR, "personne", "Éric Zemmour", "Propos après la mort de Thomas à Crépol (2023)", "Injure raciale",
    "non_definitive", "2025-03-26", "9 000 € d’amende (tribunal correctionnel de Paris, première instance).", null, null, 9000, null, null, "", "", "Wikipédia", W_ZEMMOUR],
  ["zemmour-clip-2021", ZEMMOUR, "personne", "Éric Zemmour et Reconquête", "Extraits de films dans le clip d’annonce de candidature (2021)", "Contrefaçon de droits d’auteur",
    "civile", "2022-03-04", "Condamnés à verser 165 000 € aux ayants droit (Gaumont, EuropaCorp, Luc Besson, François Ozon, SACD…).", null, null, null, null, 165000, "165 000 € avec le parti Reconquête et l’association Les Amis d’Éric Zemmour.", "", "Wikipédia", W_ZEMMOUR],
  ["zemmour-college", ZEMMOUR, "personne", "Éric Zemmour", "Extraits du documentaire « Le Collège d’à côté »", "Contrefaçon de droits d’auteur",
    "non_definitive", "2026-01-16", "Condamné en première instance (montant non précisé par la source).", null, null, null, null, null, "", "", "Wikipédia", W_ZEMMOUR],
  ["zemmour-crack", ZEMMOUR, "personne", "Éric Zemmour", "Propos sur les vendeurs de crack sénégalais (2021-2022)", "Provocation publique à la haine et injure publique",
    "en_cours", "2024-05-01", "", null, null, null, null, null, "", "Renvoyé devant la 17e chambre du tribunal de Paris en mai 2024.", "Wikipédia", W_ZEMMOUR],
  ["zemmour-sms", ZEMMOUR, "personne", "Éric Zemmour", "SMS de campagne envoyés à des Français identifiés comme juifs (2022)", "Enquête sur un traitement de données sensibles",
    "en_cours", "2022-04-12", "", null, null, null, null, null, "", "Enquête préliminaire du parquet de Paris ouverte en avril 2022 après une plainte de l’UEJF et de J’accuse ; la CNIL a aussi enquêté.", "Wikipédia", W_ZEMMOUR],
  ["zemmour-relaxes", ZEMMOUR, "personne", "Éric Zemmour", "Plusieurs poursuites pour ses propos (2014-2022)", "Provocation à la haine, injure, diffamation",
    "relaxe", "2025-07-01", "Relaxé notamment pour une chronique sur RTL (2016), une interview au Corriere della Sera (2018), des propos sur les personnes homosexuelles (appel, 2024), des villes comparées à l’Afghanistan (2024, confirmée en appel en 2025) et des propos sur l’immigration et la délinquance (2025).",
    null, null, null, null, null, "", "", "Wikipédia", W_ZEMMOUR],
  ["reconquete-cnil", ZEMMOUR, "parti", "Reconquête", "Collecte d’adresses électroniques (2021-2022)", "Manquements au règlement sur les données personnelles",
    "civile", "2024-01-25", "Amende de 20 000 € infligée par la CNIL.", null, null, 20000, null, null, "", "Reconquête est aussi condamné avec Éric Zemmour pour le clip de candidature (165 000 €).",
    "Wikipédia (Reconquête)", "https://fr.wikipedia.org/wiki/Reconqu%C3%AAte_(parti_politique)"],

  ["macron-mckinsey", "2017:macron;2022:macron", "parti", "En Marche / Renaissance (campagnes d’Emmanuel Macron)", "Cabinets de conseil dans les campagnes de 2017 et 2022 (« affaire McKinsey »)", "Soupçons portant sur les comptes de campagne et le favoritisme",
    "en_cours", "2025-11-06", "", null, null, null, null, null, "",
    "Deux informations judiciaires ouvertes en octobre 2022 par le parquet national financier sur l’intervention de cabinets de conseil dans les campagnes ; nouvelle perquisition chez McKinsey en novembre 2025. Emmanuel Macron, protégé par son immunité de président, n’est pas mis en cause.",
    "Consultor ; L’Essentiel de l’Éco", "https://www.consultor.fr/articles/mckinsey-a-nouveau-perquisitionne-dans-le-cadre-de-laffaire-des-campagnes-de-macron"],

  ["hidalgo-cabestan", "2022:ps", "personne", "Anne Hidalgo", "Propos visant l’architecte Jean-François Cabestan", "Diffamation",
    "definitive", "2017-03-09", "500 € d’amende avec sursis et 1 € de dommages et intérêts ; confirmée en appel le 9 mars 2017.", null, null, null, null, 1, "", "", "Wikipédia", "https://fr.wikipedia.org/wiki/Anne_Hidalgo"],
  ["hidalgo-fn", "2022:ps", "personne", "Anne Hidalgo", "Propos sur le Front national et la collaboration", "Diffamation",
    "non_definitive", "2017-03-11", "500 € d’amende avec sursis, 1 € de dommages et intérêts et 2 000 € de frais de justice (tribunal de Paris, première instance ; suite non connue).", null, null, null, null, 2001, "", "", "Wikipédia", "https://fr.wikipedia.org/wiki/Anne_Hidalgo"],
  ["hidalgo-tahiti", "2022:ps", "personne", "Anne Hidalgo", "Voyage en Polynésie française (2023)", "Soupçons de prise illégale d’intérêts et de détournement de fonds publics",
    "en_cours", "2024-03-01", "", null, null, null, null, null, "", "Enquête préliminaire du parquet national financier ouverte en novembre 2023 ; perquisitions à la mairie de Paris en mars 2024.", "Wikipédia", "https://fr.wikipedia.org/wiki/Anne_Hidalgo"],

  ["roussel-assistant", "2022:roussel;2027:roussel", "personne", "Fabien Roussel", "Emploi d’attaché parlementaire (2009-2014)", "Soupçons de détournement de fonds publics (emploi fictif)",
    "en_cours", "2022-03-11", "", null, null, null, null, null, "", "Enquête préliminaire du parquet national financier ouverte en mars 2022 ; auditionné librement en août 2022. Il conteste. Aucune poursuite annoncée à ce jour.", "Le JDD ; Europe 1", "https://www.lejdd.fr/Politique/emploi-fictif-a-lassemblee-le-chef-du-parti-communiste-fabien-roussel-a-ete-auditionne-fin-aout-4133792"],

  ["asselineau-plaintes", "2017:asselineau", "personne", "François Asselineau", "Plaintes d’anciens collaborateurs (2020)", "Harcèlement moral et sexuel, agressions sexuelles (accusations)",
    "en_cours", "2026-04-01", "", null, null, null, null, null, "", "Mis en examen en février 2021 ; non-lieu en décembre 2024, infirmé par la cour d’appel de Paris en avril 2026 : renvoyé devant le tribunal. Il conteste les faits.", "Wikipédia", "https://fr.wikipedia.org/wiki/Fran%C3%A7ois_Asselineau"],

  ["cheminade-comptes-1995", "2017:cheminade", "personne", "Jacques Cheminade", "Comptes de la campagne présidentielle de 1995", "Comptes de campagne rejetés par le Conseil constitutionnel",
    "civile", "1995-10-11", "Comptes rejetés : remboursement de l’avance de l’État (1 million de francs). Recours rejeté par la CEDH.", null, null, null, null, 171325, "171 325 € saisis par l’État en 2012 sur le remboursement de sa campagne.", "", "Wikipédia", "https://fr.wikipedia.org/wiki/Jacques_Cheminade"],
  ["cheminade-perben", "2017:cheminade", "personne", "Jacques Cheminade", "Tract comparant Dominique Perben à Pétain", "Diffamation publique",
    "definitive", "2005-02-09", "15 000 € d’amende ; confirmée par la cour d’appel de Lyon.", null, null, 15000, null, null, "", "", "Wikipédia", "https://fr.wikipedia.org/wiki/Jacques_Cheminade"],

  ["lassalle-enquete", "2017:lassalle;2022:lassalle", "personne", "Jean Lassalle", "Accusation portant sur des faits de 2010", "Enquête pour viol et agression sexuelle",
    "classee", "2024-03-29", "", null, null, null, null, null, "", "Enquête préliminaire ouverte en juillet 2023, classée sans suite le 29 mars 2024.", "Wikipédia", "https://fr.wikipedia.org/wiki/Jean_Lassalle"],

  ["philippe-covid", "2027:philippe", "personne", "Édouard Philippe", "Gestion de l’épidémie de Covid-19 (Cour de justice de la République)", "Abstention de combattre un sinistre",
    "non_lieu", "2025-07-07", "", null, null, null, null, null, "", "Témoin assisté depuis 2022 ; non-lieu prononcé le 7 juillet 2025, comme pour Agnès Buzyn et Olivier Véran.", "Le Club des juristes", "https://www.leclubdesjuristes.com/en-bref/gestion-du-covid-19-la-cjr-prononce-un-non-lieu-a-lencontre-de-edouard-philippe-agnes-buzyn-et-olivier-veran-11443/"],
];

export const LIGNES_JUSTICE = A;
