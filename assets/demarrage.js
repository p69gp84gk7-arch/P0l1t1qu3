/* Démarrage : charge les données puis lance l'application. */
(async function () {
  const boite = document.getElementById("chargement"), texte = document.getElementById("chargementTexte");
  try {
    const { json, origine } = await chargerDonnees();
    const D = construireModele(json);
    lancerApplication(D);
    const maj = D.PARAM.derniere_maj ? String(D.PARAM.derniere_maj).slice(0, 16).replace(" ", " à ") : null;
    const lien = window.CONFIG && window.CONFIG.SHEET_URL ? ` <a href="${window.CONFIG.SHEET_URL}" target="_blank" rel="noopener">Voir le tableur</a>.` : "";
    document.getElementById("etatDonnees").innerHTML = (origine === "sheet"
      ? "Données lues en direct dans le Google Sheet"
      : "Données de secours (copie enregistrée avec l’application)") + (maj ? `, dernière mise à jour : ${maj}.` : ".") + lien;
    boite.hidden = true;
  } catch (e) {
    console.error(e);
    texte.textContent = "Impossible de charger les données. Vérifiez votre connexion puis rechargez la page.";
    boite.classList.add("erreur");
  }
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
