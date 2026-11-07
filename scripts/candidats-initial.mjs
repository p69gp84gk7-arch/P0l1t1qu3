// Fiches des candidats (onglet « Candidats ») : biographie, carrière, résultats aux élections passées, photo.
// Onglets du Sheet : « fiches » (une ligne par personne), « carrieres » (une ligne par fonction) et
// « parcours_electoral » (une ligne par élection).
// Naissance, lieu et photo : Wikidata et Wikimedia Commons (auteur et licence de chaque photo, relevés le
// 7 novembre 2026). Résultats : ministère de l'Intérieur, Conseil constitutionnel, Parlement européen, partis
// (primaires et congrès).

export const ENTETE_FICHES = ["personne", "nom", "candidatures", "naissance", "lieu_naissance", "parti", "resume", "photo", "photo_page", "photo_auteur", "photo_licence", "wikipedia"];
export const ENTETE_CARRIERES = ["personne", "debut", "fin", "fonction"];
export const ENTETE_PARCOURS = ["personne", "annee", "election", "tour", "score", "resultat"];

// nom : [naissance, lieu, photo, page de la photo, auteur, licence]
const WD = {
  "Nicolas Dupont-Aignan": ["1961-03-07", "15e arrondissement de Paris", "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/Nicolas_Dupont-Aignan%2C_homme_politique_fran%C3%A7ais.jpg/330px-Nicolas_Dupont-Aignan%2C_homme_politique_fran%C3%A7ais.jpg", "https://commons.wikimedia.org/wiki/File:Nicolas_Dupont-Aignan,_homme_politique_fran%C3%A7ais.jpg", "Debout la France", "CC BY-SA 4.0"],
  "Jean Lassalle": ["1955-05-03", "Lourdios-Ichère", "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Jean_Lassalle.jpg/330px-Jean_Lassalle.jpg", "https://commons.wikimedia.org/wiki/File:Jean_Lassalle.jpg", "Antoine Lamielle", "CC BY-SA 4.0"],
  "Marine Le Pen": ["1968-08-05", "Neuilly-sur-Seine", "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Marine_Le_Pen_2025_%28cropped%29.jpg/330px-Marine_Le_Pen_2025_%28cropped%29.jpg", "https://commons.wikimedia.org/wiki/File:Marine_Le_Pen_2025_(cropped).jpg", "Vox España", "CC0"],
  "Benoît Hamon": ["1967-06-26", "Saint-Renan", "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Beno%C3%AEt_Hamon_place_de_R%C3%A9publique_plan_serr%C3%A9_%28cropped%29.jpg/330px-Beno%C3%AEt_Hamon_place_de_R%C3%A9publique_plan_serr%C3%A9_%28cropped%29.jpg", "https://commons.wikimedia.org/wiki/File:Beno%C3%AEt_Hamon_place_de_R%C3%A9publique_plan_serr%C3%A9_(cropped).jpg", "Marion Germa", "CC BY-SA 4.0"],
  "Jean-Luc Mélenchon": ["1951-08-19", "Tanger", "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/Jean_Luc_M%C3%A9lenchon_en_mai_2026-_55261894422_%28cropped%29.jpg/330px-Jean_Luc_M%C3%A9lenchon_en_mai_2026-_55261894422_%28cropped%29.jpg", "https://commons.wikimedia.org/wiki/File:Jean_Luc_M%C3%A9lenchon_en_mai_2026-_55261894422_(cropped).jpg", "jlm2017.fr", "CC BY 4.0"],
  "Anne Hidalgo": ["1959-06-19", "San Fernando", "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Hidalgo2020crop.jpg/330px-Hidalgo2020crop.jpg", "https://commons.wikimedia.org/wiki/File:Hidalgo2020crop.jpg", "Jacques Paquier", "CC BY 2.0"],
  "Valérie Pécresse": ["1967-07-14", "Neuilly-sur-Seine", "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Val%C3%A9rie_P%C3%A9cresse_at_a_2024_Paralympic_Games_media_conference_in_2024_3_%28cropped%29.jpg/330px-Val%C3%A9rie_P%C3%A9cresse_at_a_2024_Paralympic_Games_media_conference_in_2024_3_%28cropped%29.jpg", "https://commons.wikimedia.org/wiki/File:Val%C3%A9rie_P%C3%A9cresse_at_a_2024_Paralympic_Games_media_conference_in_2024_3_(cropped).jpg", "Gail Leenstra", "CC BY-SA 4.0"],
  "Éric Zemmour": ["1958-08-31", "Montreuil", "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/Portrait_d%27%C3%89ric_Zemmour%2C_avril_2022.jpg/330px-Portrait_d%27%C3%89ric_Zemmour%2C_avril_2022.jpg", "https://commons.wikimedia.org/wiki/File:Portrait_d%27%C3%89ric_Zemmour,_avril_2022.jpg", "Anh De France", "CC0"],
  "Bruno Retailleau": ["1960-11-20", "Cholet", "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Bruno_Retailleau_-_Ministre_de_l%27Int%C3%A9rieur_fran%C3%A7ais_%28cropped%29.jpg/330px-Bruno_Retailleau_-_Ministre_de_l%27Int%C3%A9rieur_fran%C3%A7ais_%28cropped%29.jpg", "https://commons.wikimedia.org/wiki/File:Bruno_Retailleau_-_Ministre_de_l%27Int%C3%A9rieur_fran%C3%A7ais_(cropped).jpg", "Anthonymontardyfr", "CC BY 4.0"],
  "Jacques Cheminade": ["1941-08-20", "Buenos Aires", "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0e/Jacques_cheminade_22102209_%28cropped%29.jpg/330px-Jacques_cheminade_22102209_%28cropped%29.jpg", "https://commons.wikimedia.org/wiki/File:Jacques_cheminade_22102209_(cropped).jpg", "Fabienkhan", "CC BY-SA 2.5"],
  "Raphaël Glucksmann": ["1979-10-15", "Boulogne-Billancourt", "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/1720448398743_20240708_GLUCKSMANN_Raphael_FR_006.jpg/330px-1720448398743_20240708_GLUCKSMANN_Raphael_FR_006.jpg", "https://commons.wikimedia.org/wiki/File:1720448398743_20240708_GLUCKSMANN_Raphael_FR_006.jpg", "European Union 2024 - Source : EP", "European Parliament"],
  "David Lisnard": ["1969-02-02", "Limoges", "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/David_Lisnard_en_2026.jpg/330px-David_Lisnard_en_2026.jpg", "https://commons.wikimedia.org/wiki/File:David_Lisnard_en_2026.jpg", "Grégor Sauvagère", "CC BY-SA 4.0"],
  "François Fillon": ["1954-03-04", "Le Mans", "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Fran%C3%A7ois_Fillon_2010.jpg/330px-Fran%C3%A7ois_Fillon_2010.jpg", "https://commons.wikimedia.org/wiki/File:Fran%C3%A7ois_Fillon_2010.jpg", "Marie-Lan Nguyen", "CC BY 3.0"],
  "Nathalie Arthaud": ["1970-02-23", "Peyrins", "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Nathalie_Arthaud_%28LO%29_19-05-2024.jpg/330px-Nathalie_Arthaud_%28LO%29_19-05-2024.jpg", "https://commons.wikimedia.org/wiki/File:Nathalie_Arthaud_(LO)_19-05-2024.jpg", "Kokluts", "CC BY-SA 4.0"],
  "Yannick Jadot": ["1967-07-27", "Clacy-et-Thierret", "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/20210819_jadot.yannick_5704.jpg/330px-20210819_jadot.yannick_5704.jpg", "https://commons.wikimedia.org/wiki/File:20210819_jadot.yannick_5704.jpg", "Greenbox", "CC BY-SA 4.0"],
  "Édouard Philippe": ["1970-11-28", "Rouen", "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/Edouard_Philippe_3x4_crop.jpg/330px-Edouard_Philippe_3x4_crop.jpg", "https://commons.wikimedia.org/wiki/File:Edouard_Philippe_3x4_crop.jpg", "Wasasaq8", "CC0"],
  "Philippe Poutou": ["1967-03-14", "Villemomble", "https://upload.wikimedia.org/wikipedia/commons/1/14/Philippe_Poutou_2020_%28cropped%29.png", "https://commons.wikimedia.org/wiki/File:Philippe_Poutou_2020_(cropped).png", "Patrice CALATAYU from Bordeaux, France", "CC BY-SA 2.0"],
  "Emmanuel Macron": ["1977-12-21", "Amiens", "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Emmanuel_Macron_2025_%28cropped%29.jpg/330px-Emmanuel_Macron_2025_%28cropped%29.jpg", "https://commons.wikimedia.org/wiki/File:Emmanuel_Macron_2025_(cropped).jpg", "Nebojša Tejić", "Public domain"],
  "François Asselineau": ["1957-09-14", "Paris", "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Fran%C3%A7ois_ASSELINEAU.jpg/330px-Fran%C3%A7ois_ASSELINEAU.jpg", "https://commons.wikimedia.org/wiki/File:Fran%C3%A7ois_ASSELINEAU.jpg", "Union Populaire Républicaine", "CC BY-SA 4.0"],
  "Fabien Roussel": ["1969-04-16", "Béthune", "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Roussel_Fabien_1.jpg/330px-Roussel_Fabien_1.jpg", "https://commons.wikimedia.org/wiki/File:Roussel_Fabien_1.jpg", "Zouhair NAKARA", "CC BY-SA 4.0"],
  "Marine Tondelier": ["1986-08-23", "Bois-Bernard", "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Huma2023MarineTondelier_%28cropped%29.jpg/330px-Huma2023MarineTondelier_%28cropped%29.jpg", "https://commons.wikimedia.org/wiki/File:Huma2023MarineTondelier_(cropped).jpg", "Selbymay", "CC BY 4.0"],
  "Gabriel Attal": ["1989-03-16", "Clamart", "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Gabriel_Attal_2025_%28close_crop%29.jpg/330px-Gabriel_Attal_2025_%28close_crop%29.jpg", "https://commons.wikimedia.org/wiki/File:Gabriel_Attal_2025_(close_crop).jpg", "Ismail Aissoub", "CC BY 4.0"],
  "Jordan Bardella": ["1995-09-13", "Drancy", "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/MEP_Jordan_Bardella.jpg/330px-MEP_Jordan_Bardella.jpg", "https://commons.wikimedia.org/wiki/File:MEP_Jordan_Bardella.jpg", "European Union", "European Parliament"],
};

// [clé, nom, candidatures (« année:clé du candidat »), parti, résumé]
const PERSONNES = [
  ["macron", "Emmanuel Macron", "2017:macron;2022:macron", "Renaissance (ex-En Marche)",
    "Inspecteur des finances puis banquier d’affaires, il entre à l’Élysée comme secrétaire général adjoint de François Hollande, devient ministre de l’Économie, puis fonde En Marche en 2016. Élu président à 39 ans en 2017, réélu en 2022, il ne peut pas se représenter en 2027 (deux mandats consécutifs au plus)."],
  ["lepen", "Marine Le Pen", "2017:lepen;2022:lepen;2027:rn", "Rassemblement national",
    "Avocate, fille de Jean-Marie Le Pen, elle succède à son père à la tête du Front national en 2011 et le rebaptise Rassemblement national en 2018. Qualifiée au second tour en 2017 et 2022, elle préside le groupe RN à l’Assemblée. Sa candidature en 2027 dépend de la justice (voir l’onglet Justice) : sinon, Jordan Bardella serait le candidat du RN."],
  ["fillon", "François Fillon", "2017:lr", "Les Républicains (retiré de la vie politique)",
    "Député de la Sarthe à 27 ans, plusieurs fois ministre, il est le Premier ministre de Nicolas Sarkozy pendant tout son quinquennat (2007-2012). Large vainqueur de la primaire de la droite en 2016, il est rattrapé par l’affaire des emplois présumés fictifs de son épouse et termine troisième en 2017, puis quitte la politique."],
  ["melenchon", "Jean-Luc Mélenchon", "2017:melenchon;2022:melenchon;2027:melenchon", "La France insoumise",
    "Sénateur socialiste pendant vingt ans et ministre sous Lionel Jospin, il quitte le PS en 2008, fonde le Parti de gauche puis La France insoumise en 2016. Troisième en 2017 et en 2022 (à 420 000 voix du second tour), il prépare une quatrième candidature."],
  ["hamon", "Benoît Hamon", "2017:ps", "Génération·s (retiré de la vie politique)",
    "Ancien président du Mouvement des jeunes socialistes, ministre de l’Économie sociale puis de l’Éducation sous François Hollande, il gagne la primaire de la gauche en 2017 contre Manuel Valls mais n’obtient que 6,4 % au premier tour. Il fonde Génération·s, puis se retire de la vie politique en 2021."],
  ["nda", "Nicolas Dupont-Aignan", "2017:nda;2022:nda;2027:dupont-aignan", "Debout la France",
    "Énarque, maire de Yerres pendant plus de vingt ans et député de l’Essonne de 1997 à 2024, il quitte l’UMP en 2008 pour fonder Debout la République, devenu Debout la France, un parti souverainiste. Il s’allie à Marine Le Pen entre les deux tours de 2017."],
  ["lassalle", "Jean Lassalle", "2017:lassalle;2022:lassalle", "Résistons !",
    "Fils de bergers et technicien agricole, maire de son village de Lourdios-Ichère pendant quarante ans et député des Pyrénées-Atlantiques de 2002 à 2022, il se fait connaître par une grève de la faim en 2006 pour sauver une usine et par une marche à travers la France en 2013."],
  ["poutou", "Philippe Poutou", "2017:poutou;2022:poutou", "Nouveau Parti anticapitaliste",
    "Ouvrier à l’usine Ford de Blanquefort, près de Bordeaux, jusqu’à sa fermeture en 2019, syndicaliste CGT et porte-parole du NPA, il est candidat à trois présidentielles. Il a siégé au conseil municipal de Bordeaux de 2020 à 2022."],
  ["asselineau", "François Asselineau", "2017:asselineau", "Union populaire républicaine",
    "Énarque et inspecteur général des finances, ancien membre de cabinets ministériels, il fonde en 2007 l’Union populaire républicaine, qui prône la sortie de la France de l’Union européenne, de l’euro et de l’OTAN."],
  ["arthaud", "Nathalie Arthaud", "2017:arthaud;2022:arthaud;2027:arthaud", "Lutte ouvrière",
    "Professeure d’économie et de gestion dans un lycée de Seine-Saint-Denis, elle succède à Arlette Laguiller comme porte-parole de Lutte ouvrière en 2008. Elle se présente à chaque présidentielle depuis 2012."],
  ["cheminade", "Jacques Cheminade", "2017:cheminade", "Solidarité et progrès",
    "Ancien haut fonctionnaire, il dirige le petit parti Solidarité et progrès, proche du mouvement de l’Américain Lyndon LaRouche. Son compte de campagne de 1995 avait été rejeté par le Conseil constitutionnel."],
  ["zemmour", "Éric Zemmour", "2022:zemmour;2027:zemmour", "Reconquête",
    "Journaliste politique au Figaro, chroniqueur à la télévision et auteur d’essais à succès comme « Le Suicide français », il fonde Reconquête en décembre 2021. Il a été condamné plusieurs fois pour provocation à la haine (voir l’onglet Justice)."],
  ["pecresse", "Valérie Pécresse", "2022:lr", "Les Républicains",
    "Énarque et conseillère d’État, ancienne conseillère de Jacques Chirac, elle est ministre de l’Enseignement supérieur puis du Budget sous Nicolas Sarkozy. Présidente de la région Île-de-France depuis 2015, elle gagne le congrès des Républicains en 2021 mais ne dépasse pas 5 % en 2022."],
  ["jadot", "Yannick Jadot", "2017:eelv;2022:eelv", "Les Écologistes",
    "Ancien directeur des campagnes de Greenpeace France, député européen de 2009 à 2024 puis sénateur de Paris. Candidat en 2017, il se retire au profit de Benoît Hamon ; vainqueur de la primaire écologiste en 2021, il obtient 4,6 % en 2022."],
  ["roussel", "Fabien Roussel", "2022:roussel;2027:roussel", "Parti communiste français",
    "Journaliste puis collaborateur d’élus communistes, secrétaire national du PCF depuis 2018, il a été député du Nord de 2017 à 2024. En 2022, il est le premier candidat communiste à la présidentielle depuis 2007."],
  ["hidalgo", "Anne Hidalgo", "2022:ps", "Parti socialiste",
    "Née en Espagne, inspectrice du travail, première adjointe de Bertrand Delanoë puis maire de Paris de 2014 à 2026. Désignée candidate par les militants socialistes en 2021, elle obtient 1,7 % en 2022, le plus bas score du PS à une présidentielle."],
  ["bardella", "Jordan Bardella", "2027:rn", "Rassemblement national",
    "Entré au Front national à 16 ans, il mène la liste du RN, arrivée en tête, aux élections européennes de 2019 et de 2024. Président du parti depuis 2022, il serait le candidat du RN en 2027 si Marine Le Pen ne pouvait pas se présenter."],
  ["philippe", "Édouard Philippe", "2027:philippe", "Horizons",
    "Avocat, puis directeur chez Areva, il devient maire du Havre en 2010 et député. Venu de la droite, il est le premier Premier ministre d’Emmanuel Macron (2017-2020), puis fonde Horizons en 2021. Il a annoncé sa candidature pour 2027."],
  ["glucksmann", "Raphaël Glucksmann", "2027:glucksmann", "Place publique",
    "Essayiste et documentariste, ancien conseiller du président géorgien Mikheïl Saakachvili, il cofonde Place publique en 2018. Député européen depuis 2019, il mène la liste PS-Place publique aux européennes de 2024, arrivée troisième avec 13,8 %."],
  ["retailleau", "Bruno Retailleau", "2027:retailleau", "Les Républicains",
    "Élu de Vendée, proche de Philippe de Villiers à ses débuts, il préside le groupe LR au Sénat pendant dix ans. Ministre de l’Intérieur de septembre 2024 à octobre 2025, il est élu président des Républicains en mai 2025."],
  ["attal", "Gabriel Attal", "2027:attal", "Renaissance",
    "Ancien socialiste rallié à Emmanuel Macron, il est porte-parole du Gouvernement, ministre des Comptes publics puis de l’Éducation, avant de devenir à 34 ans le plus jeune Premier ministre de la Ve République (janvier-septembre 2024). Il dirige depuis le groupe EPR à l’Assemblée et le parti Renaissance."],
  ["lisnard", "David Lisnard", "2027:lisnard", "Nouvelle Énergie",
    "Maire de Cannes depuis 2014, réélu dès le premier tour en 2020, il a présidé l’Association des maires de France à partir de 2021. Il défend une ligne libérale de droite au sein de son parti, Nouvelle Énergie."],
  ["tondelier", "Marine Tondelier", "2027:tondelier", "Les Écologistes",
    "Conseillère municipale d’opposition à Hénin-Beaumont, ville dirigée par le RN, depuis 2014, elle devient secrétaire nationale d’Europe Écologie Les Verts (rebaptisé Les Écologistes) en décembre 2022. Elle est l’une des figures du Nouveau Front populaire en 2024."],
];

// [clé, début, fin, fonction]
export const LIGNES_CARRIERES = [
  ["macron", "2004", "2008", "Inspecteur des finances"],
  ["macron", "2008", "2012", "Banquier d’affaires chez Rothschild & Cie"],
  ["macron", "2012", "2014", "Secrétaire général adjoint de l’Élysée"],
  ["macron", "2014", "2016", "Ministre de l’Économie, de l’Industrie et du Numérique"],
  ["macron", "2016", "2016", "Fonde le mouvement En Marche (avril 2016)"],
  ["macron", "2017", "", "Président de la République (réélu en 2022)"],

  ["lepen", "1992", "1998", "Avocate au barreau de Paris"],
  ["lepen", "1998", "2021", "Conseillère régionale (Nord-Pas-de-Calais, Île-de-France, puis Hauts-de-France)"],
  ["lepen", "2004", "2017", "Députée européenne"],
  ["lepen", "2011", "2021", "Présidente du Front national, devenu Rassemblement national en 2018"],
  ["lepen", "2017", "", "Députée du Pas-de-Calais"],
  ["lepen", "2022", "", "Présidente du groupe RN à l’Assemblée nationale"],

  ["fillon", "1981", "2002", "Député de la Sarthe (avec des interruptions)"],
  ["fillon", "1993", "1995", "Ministre de l’Enseignement supérieur et de la Recherche"],
  ["fillon", "1995", "1997", "Ministre des Technologies de l’information et de La Poste"],
  ["fillon", "1998", "2002", "Président du conseil régional des Pays de la Loire"],
  ["fillon", "2002", "2005", "Ministre des Affaires sociales, puis de l’Éducation nationale"],
  ["fillon", "2005", "2007", "Sénateur de la Sarthe"],
  ["fillon", "2007", "2012", "Premier ministre"],
  ["fillon", "2012", "2017", "Député de Paris"],

  ["melenchon", "1986", "2000", "Sénateur de l’Essonne (Parti socialiste)"],
  ["melenchon", "2000", "2002", "Ministre délégué à l’Enseignement professionnel"],
  ["melenchon", "2004", "2010", "Sénateur de l’Essonne"],
  ["melenchon", "2008", "2008", "Quitte le PS, fonde le Parti de gauche (2009)"],
  ["melenchon", "2009", "2017", "Député européen"],
  ["melenchon", "2016", "2016", "Fonde La France insoumise"],
  ["melenchon", "2017", "2022", "Député des Bouches-du-Rhône, président du groupe LFI"],

  ["hamon", "1993", "1995", "Président du Mouvement des jeunes socialistes"],
  ["hamon", "2004", "2009", "Député européen"],
  ["hamon", "2008", "2012", "Porte-parole du Parti socialiste"],
  ["hamon", "2012", "2014", "Ministre délégué à l’Économie sociale et solidaire"],
  ["hamon", "2014", "2014", "Ministre de l’Éducation nationale (avril-août 2014)"],
  ["hamon", "2014", "2017", "Député des Yvelines"],
  ["hamon", "2017", "2021", "Fonde et dirige Génération·s"],

  ["nda", "1995", "2017", "Maire de Yerres (Essonne)"],
  ["nda", "1997", "2024", "Député de l’Essonne"],
  ["nda", "2008", "2008", "Fonde Debout la République, devenu Debout la France en 2014"],

  ["lassalle", "1977", "2017", "Maire de Lourdios-Ichère (Pyrénées-Atlantiques)"],
  ["lassalle", "2002", "2022", "Député des Pyrénées-Atlantiques"],
  ["lassalle", "2016", "2016", "Fonde Résistons !"],

  ["poutou", "1996", "2019", "Ouvrier à l’usine Ford de Blanquefort, délégué CGT"],
  ["poutou", "2009", "", "Militant du Nouveau Parti anticapitaliste, dont il devient l’un des porte-parole"],
  ["poutou", "2020", "2022", "Conseiller municipal de Bordeaux"],

  ["asselineau", "1985", "", "Inspecteur des finances, puis inspecteur général"],
  ["asselineau", "", "", "Membre de plusieurs cabinets ministériels dans les années 1990 et 2000"],
  ["asselineau", "2001", "2008", "Conseiller de Paris"],
  ["asselineau", "2007", "2007", "Fonde l’Union populaire républicaine"],

  ["arthaud", "", "", "Professeure d’économie-gestion en lycée"],
  ["arthaud", "2008", "", "Porte-parole de Lutte ouvrière"],
  ["arthaud", "2008", "2014", "Conseillère municipale de Vaulx-en-Velin"],

  ["cheminade", "", "", "Haut fonctionnaire, diplômé de l’ENA"],
  ["cheminade", "1996", "", "Fonde et préside Solidarité et progrès"],

  ["zemmour", "1986", "1996", "Journaliste au Quotidien de Paris, puis à InfoMatin"],
  ["zemmour", "1996", "2021", "Journaliste politique et chroniqueur au Figaro"],
  ["zemmour", "2006", "2011", "Chroniqueur de l’émission On n’est pas couché (France 2)"],
  ["zemmour", "2019", "2021", "Chroniqueur de l’émission Face à l’info (CNews)"],
  ["zemmour", "2021", "", "Fonde et préside Reconquête"],

  ["pecresse", "1998", "2002", "Conseillère à la présidence de la République (Jacques Chirac)"],
  ["pecresse", "2002", "2007", "Députée des Yvelines (de nouveau de 2012 à 2016)"],
  ["pecresse", "2007", "2011", "Ministre de l’Enseignement supérieur et de la Recherche"],
  ["pecresse", "2011", "2012", "Ministre du Budget et porte-parole du Gouvernement"],
  ["pecresse", "2015", "", "Présidente de la région Île-de-France (réélue en 2021)"],

  ["jadot", "2002", "2008", "Directeur des campagnes de Greenpeace France"],
  ["jadot", "2009", "2024", "Député européen"],
  ["jadot", "2023", "", "Sénateur de Paris"],

  ["roussel", "", "", "Journaliste, puis collaborateur de la ministre communiste Michelle Demessine et d’élus du PCF"],
  ["roussel", "2017", "2024", "Député du Nord"],
  ["roussel", "2018", "", "Secrétaire national du Parti communiste français"],

  ["hidalgo", "1984", "2001", "Inspectrice du travail, puis membre de cabinets ministériels"],
  ["hidalgo", "2001", "2014", "Première adjointe au maire de Paris"],
  ["hidalgo", "2014", "2026", "Maire de Paris"],

  ["bardella", "2015", "", "Conseiller régional d’Île-de-France"],
  ["bardella", "2019", "", "Député européen, président du groupe Patriotes pour l’Europe depuis 2024"],
  ["bardella", "2022", "", "Président du Rassemblement national (par intérim dès 2021)"],

  ["philippe", "2007", "2010", "Directeur des affaires publiques d’Areva"],
  ["philippe", "2010", "2017", "Maire du Havre"],
  ["philippe", "2012", "2017", "Député de la Seine-Maritime"],
  ["philippe", "2017", "2020", "Premier ministre"],
  ["philippe", "2020", "", "Maire du Havre"],
  ["philippe", "2021", "", "Fonde et préside Horizons"],

  ["glucksmann", "2009", "2012", "Conseiller du président géorgien Mikheïl Saakachvili"],
  ["glucksmann", "2018", "2018", "Cofonde Place publique"],
  ["glucksmann", "2019", "", "Député européen"],

  ["retailleau", "1994", "1997", "Député de la Vendée"],
  ["retailleau", "2004", "2024", "Sénateur de la Vendée"],
  ["retailleau", "2010", "2015", "Président du conseil général de la Vendée"],
  ["retailleau", "2014", "2024", "Président du groupe LR au Sénat"],
  ["retailleau", "2015", "2017", "Président de la région Pays de la Loire"],
  ["retailleau", "2024", "2025", "Ministre de l’Intérieur"],
  ["retailleau", "2025", "", "Président des Républicains"],

  ["attal", "2012", "2017", "Conseiller de la ministre de la Santé Marisol Touraine"],
  ["attal", "2017", "2018", "Député des Hauts-de-Seine"],
  ["attal", "2018", "2020", "Secrétaire d’État à l’Éducation nationale et à la Jeunesse"],
  ["attal", "2020", "2022", "Porte-parole du Gouvernement"],
  ["attal", "2022", "2023", "Ministre des Comptes publics"],
  ["attal", "2023", "2024", "Ministre de l’Éducation nationale"],
  ["attal", "2024", "2024", "Premier ministre (janvier-septembre 2024)"],
  ["attal", "2024", "", "Député des Hauts-de-Seine, président du groupe EPR, secrétaire général de Renaissance"],

  ["lisnard", "2001", "2014", "Adjoint au maire de Cannes"],
  ["lisnard", "2014", "", "Maire de Cannes"],
  ["lisnard", "2021", "2021", "Élu président de l’Association des maires de France ; fonde Nouvelle Énergie"],

  ["tondelier", "2014", "", "Conseillère municipale d’Hénin-Beaumont (opposition)"],
  ["tondelier", "2015", "2021", "Conseillère régionale des Hauts-de-France"],
  ["tondelier", "2022", "", "Secrétaire nationale des Écologistes (ex-EELV)"],
];

// [clé, année, élection, tour, score en %, résultat]
export const LIGNES_PARCOURS = [
  ["macron", "2017", "Présidentielle", "1er tour", 24.01, "1er"],
  ["macron", "2017", "Présidentielle", "2d tour", 66.1, "Élu"],
  ["macron", "2022", "Présidentielle", "1er tour", 27.85, "1er"],
  ["macron", "2022", "Présidentielle", "2d tour", 58.55, "Réélu"],

  ["lepen", "2012", "Présidentielle", "1er tour", 17.9, "3e"],
  ["lepen", "2017", "Présidentielle", "1er tour", 21.3, "2e"],
  ["lepen", "2017", "Présidentielle", "2d tour", 33.9, "Battue"],
  ["lepen", "2022", "Présidentielle", "1er tour", 23.15, "2e"],
  ["lepen", "2022", "Présidentielle", "2d tour", 41.45, "Battue"],

  ["fillon", "2016", "Primaire de la droite", "1er tour", 44.08, "1er"],
  ["fillon", "2016", "Primaire de la droite", "2d tour", 66.49, "Désigné"],
  ["fillon", "2017", "Présidentielle", "1er tour", 20.01, "3e"],

  ["melenchon", "2012", "Présidentielle", "1er tour", 11.1, "4e"],
  ["melenchon", "2017", "Présidentielle", "1er tour", 19.58, "4e"],
  ["melenchon", "2022", "Présidentielle", "1er tour", 21.95, "3e"],

  ["hamon", "2017", "Primaire de la gauche", "1er tour", 36.03, "1er"],
  ["hamon", "2017", "Primaire de la gauche", "2d tour", 58.69, "Désigné"],
  ["hamon", "2017", "Présidentielle", "1er tour", 6.36, "5e"],
  ["hamon", "2019", "Européennes (tête de liste)", "", 3.27, "8e, aucun élu"],

  ["nda", "2012", "Présidentielle", "1er tour", 1.79, "7e"],
  ["nda", "2017", "Présidentielle", "1er tour", 4.7, "6e"],
  ["nda", "2019", "Européennes (tête de liste)", "", 3.51, "7e, aucun élu"],
  ["nda", "2022", "Présidentielle", "1er tour", 2.06, "9e"],

  ["lassalle", "2017", "Présidentielle", "1er tour", 1.21, "7e"],
  ["lassalle", "2022", "Présidentielle", "1er tour", 3.13, "7e"],

  ["poutou", "2012", "Présidentielle", "1er tour", 1.15, "8e"],
  ["poutou", "2017", "Présidentielle", "1er tour", 1.09, "8e"],
  ["poutou", "2022", "Présidentielle", "1er tour", 0.77, "11e"],

  ["asselineau", "2017", "Présidentielle", "1er tour", 0.92, "9e"],
  ["asselineau", "2019", "Européennes (tête de liste)", "", 1.17, "Aucun élu"],

  ["arthaud", "2012", "Présidentielle", "1er tour", 0.56, "9e"],
  ["arthaud", "2017", "Présidentielle", "1er tour", 0.64, "10e"],
  ["arthaud", "2022", "Présidentielle", "1er tour", 0.56, "12e"],

  ["cheminade", "1995", "Présidentielle", "1er tour", 0.28, "9e"],
  ["cheminade", "2012", "Présidentielle", "1er tour", 0.25, "10e"],
  ["cheminade", "2017", "Présidentielle", "1er tour", 0.18, "11e"],

  ["zemmour", "2022", "Présidentielle", "1er tour", 7.07, "4e"],

  ["pecresse", "2015", "Régionales Île-de-France", "2d tour", 43.8, "Élue"],
  ["pecresse", "2021", "Régionales Île-de-France", "2d tour", 45.92, "Réélue"],
  ["pecresse", "2021", "Congrès des Républicains", "2d tour", 60.95, "Désignée"],
  ["pecresse", "2022", "Présidentielle", "1er tour", 4.78, "5e"],

  ["jadot", "2019", "Européennes (tête de liste)", "", 13.48, "3e"],
  ["jadot", "2021", "Primaire écologiste", "2d tour", 51.03, "Désigné"],
  ["jadot", "2022", "Présidentielle", "1er tour", 4.63, "6e"],

  ["roussel", "2022", "Présidentielle", "1er tour", 2.28, "8e"],

  ["hidalgo", "2021", "Vote des militants PS", "", 72.6, "Désignée"],
  ["hidalgo", "2022", "Présidentielle", "1er tour", 1.75, "10e"],

  ["bardella", "2019", "Européennes (tête de liste)", "", 23.34, "1er"],
  ["bardella", "2024", "Européennes (tête de liste)", "", 31.37, "1er"],

  ["glucksmann", "2019", "Européennes (tête de liste)", "", 6.19, "6e"],
  ["glucksmann", "2024", "Européennes (tête de liste)", "", 13.83, "3e"],

  ["retailleau", "2025", "Présidence des Républicains", "", 74.31, "Élu"],

  ["lisnard", "2020", "Municipales Cannes", "1er tour", 88.1, "Réélu"],
];

export const LIGNES_FICHES = PERSONNES.map(([cle, nom, cand, parti, resume]) => {
  const w = WD[nom] || [];
  return [cle, nom, cand, w[0] || "", w[1] || "", parti, resume, w[2] || "", w[3] || "", w[4] || "", w[5] || "",
    "https://fr.wikipedia.org/wiki/" + encodeURIComponent(nom.replace(/ /g, "_"))];
});
