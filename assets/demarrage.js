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
    boutonMiseAJour(json);
  } catch (e) {
    console.error(e);
    texte.textContent = "Impossible de charger les données. Vérifiez votre connexion puis rechargez la page.";
    boite.classList.add("erreur");
  }
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();

/* Bouton « Mettre à jour les sondages » : demande au Google Sheet de vérifier Wikipédia tout de suite,
   puis recharge la page avec les données à jour. */
function boutonMiseAJour(json) {
  const btn = document.getElementById("btnMaj"), info = document.getElementById("majInfo");
  if (!btn) return;
  const t = json.onglets.sondages_2027 || [[]], i = t[0].indexOf("fin_terrain");
  const dernier = t.slice(1).map((r) => String(r[i] || "").slice(0, 10)).filter(Boolean).sort().pop();
  const jourFr = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  let message = "";
  try { message = sessionStorage.getItem("majMessage") || ""; sessionStorage.removeItem("majMessage"); } catch (e) {}
  info.textContent = message || (dernier ? `Dernier sondage 2027 : terrain achevé le ${jourFr(dernier)}.` : "");
  btn.onclick = async () => {
    const api = (window.CONFIG && window.CONFIG.API_URL) || "";
    btn.disabled = true;
    info.textContent = api ? "Vérification des nouveaux sondages sur Wikipédia…" : "Rechargement…";
    let msg = "Données rechargées.";
    if (api) {
      try {
        const ctrl = new AbortController(), minuteur = setTimeout(() => ctrl.abort(), 60000);
        const r = await fetch(api + (api.includes("?") ? "&" : "?") + "action=maj", { cache: "no-store", signal: ctrl.signal });
        clearTimeout(minuteur);
        const res = await r.json();
        if (res && res.message) msg = res.ajoutes ? res.message : `Aucun nouveau sondage sur Wikipédia. ${res.message.startsWith("Vérification déjà") ? res.message : ""}`.trim();
      } catch (e) {
        msg = "La vérification n’a pas abouti ; données rechargées.";
      }
    }
    try { sessionStorage.setItem("majMessage", msg); } catch (e) {}
    location.reload();
  };
}
