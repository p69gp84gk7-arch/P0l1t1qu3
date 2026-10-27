// Patrimoine déclaré des candidats aux présidentielles 2017 et 2022 (onglet « patrimoine »).
// Les déclarations des candidats ont été retirées du site de la HATVP après chaque élection :
// les montants viennent donc de la presse, qui les a relevés le jour de la publication.
// Patrimoine = biens déclarés (immobilier, comptes, placements, véhicules…), dettes = capital restant dû.
// Pour 2027, l'onglet est rempli par le script Apps Script dès que la HATVP publie les déclarations.

export const ENTETE_PATRIMOINE = ["election", "cle", "nom", "patrimoine", "dettes", "fortune_estimee", "total", "rang_publie", "source", "lien", "commentaire"];

const S22 = "Déclarations publiées par la HATVP le 8 mars 2022 (situation déclarée par chaque candidat, sans contrôle). Montants relevés par Business Cool le 10 mars 2022 : biens hors comptes des conjoints ; dettes = capital restant dû.";
const L22 = "https://business-cool.com/decryptage/analyse/fortune-candidats-presidentielle/";
const S17 = "Déclarations publiées par la HATVP le 22 mars 2017, retirées depuis. Totaux additionnés à partir du détail publié par Public Sénat, complété par France 24, Le JDD et la-loi-pinel.com ; les éléments que la presse n’a pas chiffrés manquent, ce sont donc des minimums.";
const L17 = "https://www.publicsenat.fr/actualites/non-classe/transparence-le-detail-du-patrimoine-des-onze-candidats-a-la-presidentielle-57652";

// [cle, nom, patrimoine (biens), dettes, fortune estimée hors déclaration, commentaire]
const A2022 = [
  ["lr", "Valérie Pécresse", 6187432, 984798, 2200000, "Fortune estimée : 2,2 M€ sur le compte de sa SARL Saint Damien, que Business Cool laisse hors de la fortune personnelle. France 24 indique 9,7 M€ en comptant les biens du couple."],
  ["zemmour", "Éric Zemmour", 4874364, 633330, null, ""],
  ["nda", "Nicolas Dupont-Aignan", 2223383, 193543, null, ""],
  ["lepen", "Marine Le Pen", 2005980, 10869681, null, "Dettes : dont un prêt de 10,69 M€ (MKB Bank) contracté pour la campagne."],
  ["melenchon", "Jean-Luc Mélenchon", 1465236, 99145, null, ""],
  ["ps", "Anne Hidalgo", 843519, 207628, null, ""],
  ["lassalle", "Jean Lassalle", 835266, 202632, null, ""],
  ["macron", "Emmanuel Macron", 522576, 122515, null, ""],
  ["eelv", "Yannick Jadot", 411760, 0, null, ""],
  ["roussel", "Fabien Roussel", 318484, 98902, null, ""],
  ["arthaud", "Nathalie Arthaud", 218888, 0, null, ""],
  ["poutou", "Philippe Poutou", 121589, 0, null, ""],
];

// [cle, nom, patrimoine (somme des montants publiés), dettes (null : non publiées), commentaire]
const A2017 = [
  ["nda", "Nicolas Dupont-Aignan", 2354000, null, "Immobilier 2 329 000 € (appartement à Paris 1 300 000 €, maison dans l’Essonne 255 000 €, appartements reçus par donation) ; sculpture 25 000 €. Comptes et dettes non chiffrés par la presse."],
  ["asselineau", "François Asselineau", 1568752, null, "65 % d’un appartement à Paris estimé 1 500 000 € (975 000 €), appartements en Polynésie 276 000 €, 75 % d’une maison dans la Nièvre (75 000 €), parking 15 000 € ; assurances-vie 242 493 € ; comptes courants à découvert (−14 741 €)."],
  ["melenchon", "Jean-Luc Mélenchon", 1131000, null, "Appartement à Paris 837 000 €, maison près de Montargis 190 000 € ; comptes 104 000 €. Prêts de 248 000 € (2014) et 40 000 € (2004) : capital restant dû non publié."],
  ["lr", "François Fillon", 974888, 80000, "Manoir de Beaucé (Sarthe) 750 000 € ; épargne d’environ 100 000 € ; montres 27 000 € ; société 2F Conseil 97 888 € ; véhicules non chiffrés. Dettes : prêt de 50 000 € de Marc Ladreit de Lacharrière et 30 000 € de prêts familiaux."],
  ["lassalle", "Jean Lassalle", 735000, 150000, "Immobilier d’un peu plus de 700 000 € (appartement 110 000 €, maisons de 320 000 € et 160 000 € détenues à 50 %, terrain agricole 115 000 €) ; véhicules 30 000 €. Dette d’un peu moins de 150 000 €."],
  ["lepen", "Marine Le Pen", 615000, 3600000, "Biens immobiliers et parts de SCI 609 800 € ; compte courant 5 200 €. Dettes : environ 3,6 M€ restant dus, dont deux prêts de Cotelec pour la campagne."],
  ["cheminade", "Jacques Cheminade", 512090, null, "Appartement à Paris 420 700 € ; dépôts-ventes 54 090 € ; collection d’objets préhistoriques et précolombiens 18 000 € ; PEA 15 400 € ; compte-titres 3 900 €."],
  ["ps", "Benoît Hamon", 487435, 598000, "Sa part de l’immobilier détenu avec sa compagne 471 000 € (821 000 € en tout) ; comptes et livrets 14 435 € ; voiture 2 000 €. Dettes : 598 000 € restant dus sur un emprunt commun de 680 000 €."],
  ["macron", "Emmanuel Macron", 337000, 300000, "Aucun bien immobilier ; comptes et épargne d’environ 337 000 € (dont livrets 60 000 € et assurance-vie 90 000 €). Dettes : 246 000 € restant dus sur un prêt de 350 000 € et près de 54 000 € dus au Trésor public."],
  ["arthaud", "Nathalie Arthaud", 269253, null, "Appartement à Pantin 248 700 € ; épargne 6 053 € ; voiture 14 500 €. Prêt immobilier de 2009 : montant restant dû non publié."],
  ["poutou", "Philippe Poutou", 31665, null, "Quatre comptes bancaires 22 665 € ; voiture d’environ 9 000 €. Pas d’immobilier."],
];

export const LIGNES_PATRIMOINE = [
  ...A2017.map(([cle, nom, p, d, com]) => ["2017", cle, nom, p, d, null, p, null, S17, L17, com]),
  ...A2022.map(([cle, nom, p, d, f, com]) => ["2022", cle, nom, p, d, f, p + (f || 0), null, S22, L22, com]),
];
