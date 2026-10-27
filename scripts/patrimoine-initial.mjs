// Patrimoine déclaré des candidats aux présidentielles 2017 et 2022 (onglet « patrimoine »).
// Les déclarations des candidats non élus ont été retirées du site de la HATVP après chaque élection :
// les montants viennent donc de la presse, qui les a relevés le jour de la publication.
// Pour 2027, l'onglet est rempli par le script Apps Script dès que la HATVP publie les déclarations.

export const ENTETE_PATRIMOINE = ["election", "cle", "nom", "patrimoine", "dettes", "fortune_estimee", "total", "rang_publie", "source", "lien", "commentaire"];

const S22 = "Déclarations publiées par la HATVP le 8 mars 2022 (situation déclarée par chaque candidat, sans contrôle). Montants relevés par Business Cool le 10 mars 2022 : biens hors comptes des conjoints ; dettes = capital restant dû.";
const L22 = "https://business-cool.com/decryptage/analyse/fortune-candidats-presidentielle/";
const S17 = "Déclarations publiées par la HATVP le 22 mars 2017. Les totaux n’ont pas été repris par la presse : rang selon l’ordre décroissant du patrimoine déclaré relevé par le blog de Sylvain Rakotoarison ; montants partiels relevés par Le JDD, France 24 et la-loi-pinel.com.";
const L17 = "https://rakotoarison.over-blog.com/article-srb-20170322-declaration-patrimoine-candidats.html";

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

// [cle, nom, commentaire], dans l'ordre décroissant du patrimoine déclaré
const A2017 = [
  ["nda", "Nicolas Dupont-Aignan", "Immobilier : 2 329 000 € (plusieurs appartements à Paris, une maison dans l’Essonne)."],
  ["asselineau", "François Asselineau", "Immobilier : 1 326 000 €."],
  ["melenchon", "Jean-Luc Mélenchon", "Immobilier : 1 027 000 € (appartement à Paris 837 000 €, maison près de Montargis 190 000 €)."],
  ["lr", "François Fillon", "Manoir de Beaucé (Sarthe) 750 000 € ; société de conseil 2F 97 888 €."],
  ["lepen", "Marine Le Pen", "Biens immobiliers 611 832 € ; environ 3,6 M€ de prêts à rembourser, dont deux pour la campagne."],
  ["lassalle", "Jean Lassalle", "Immobilier : un peu plus de 700 000 € ; dette d’un peu moins de 150 000 €."],
  ["cheminade", "Jacques Cheminade", "Appartement à Paris 420 700 € ; collection d’objets préhistoriques et précolombiens 18 000 €."],
  ["ps", "Benoît Hamon", "46,14 % d’un appartement acheté 700 000 € (Hauts-de-Seine), appartement dans le Finistère 121 000 € ; prêt de 580 348 €."],
  ["arthaud", "Nathalie Arthaud", "Appartement à Pantin 248 700 € ; épargne inférieure à 10 000 €."],
  ["macron", "Emmanuel Macron", "Aucun bien immobilier ; livrets 60 000 € et assurance-vie 90 000 € ; environ 246 000 € de prêt immobilier et près de 54 000 € dus au Trésor public."],
  ["poutou", "Philippe Poutou", "Comptes bancaires 22 665 € ; voiture d’environ 9 000 €."],
];

export const LIGNES_PATRIMOINE = [
  ...A2017.map(([cle, nom, com], i) => ["2017", cle, nom, null, null, null, null, i + 1, S17, L17, com]),
  ...A2022.map(([cle, nom, p, d, f, com]) => ["2022", cle, nom, p, d, f, p + (f || 0), null, S22, L22, com]),
];
