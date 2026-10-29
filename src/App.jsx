// @ts-nocheck
import React, { useState, useMemo, useContext, createContext, useRef, useEffect } from "react";
import {
  School, Users, GraduationCap, Wallet, MessageSquare, Megaphone,
  LayoutDashboard, UserCircle2, ClipboardList, CalendarClock,
  ChevronRight, Plus, Pencil, Trash2, Send, Award,
  LogOut, ShieldCheck, KeyRound, Bell, User,
  FileText, Inbox, CheckCircle2, XCircle, ArrowLeft, RefreshCw, Settings, Image
} from "lucide-react";

/* ------------------------------------------------------------------
   CONNEXION SUPABASE — projet "CSP-SAGESSE DIVINE-TCHAOUROU"
   Appels directs à l'API REST (PostgREST) via fetch — aucune librairie
   externe requise, uniquement des fonctions déjà natives du navigateur.
------------------------------------------------------------------- */
/* Clés intégrées pour synchronisation automatique - Projet mwuquiyudypkxdxksihc */
// Accepte les 2 formes de noms (avec ou sans underscore) pour faciliter la config mobile Vercel
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITESUPABASEURL ||
  "";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITESUPABASEANONKEY ||
  "";
const SUPABASE_CONFIGURE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
/** Version affichée page d'accueil — change à chaque correctif pour vérifier le déploiement */
const APP_VERSION = "2026-10-29-v38";

const CLE_STOCKAGE_LOCAL = "csp_sagesse_divine_donnees";
const CLE_ELEVES_SUPPRIMES = "csp_sagesse_divine_eleves_supprimes";

function lireStockageLocal() {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE_LOCAL);
    if (!brut) return null;
    return JSON.parse(brut);
  } catch (e) {
    console.warn("Stockage local illisible:", e);
    return null;
  }
}

function ecrireStockageLocal(donnees) {
  try {
    localStorage.setItem(CLE_STOCKAGE_LOCAL, JSON.stringify(donnees));
  } catch (e) {
    console.warn("Impossible d'enregistrer en local:", e);
  }
}

/** IDs d'élèves supprimés — mémoire + localStorage + sessionStorage (ne jamais réafficher). */
let __cspBansMemoire = [];

function lireElevesSupprimes() {
  const acc = new Set((__cspBansMemoire || []).map(String));
  try {
    const brut = localStorage.getItem(CLE_ELEVES_SUPPRIMES);
    if (brut) {
      const arr = JSON.parse(brut);
      if (Array.isArray(arr)) arr.forEach((id) => acc.add(String(id)));
    }
  } catch (e) {}
  try {
    const brut2 = sessionStorage.getItem(CLE_ELEVES_SUPPRIMES);
    if (brut2) {
      const arr2 = JSON.parse(brut2);
      if (Array.isArray(arr2)) arr2.forEach((id) => acc.add(String(id)));
    }
  } catch (e) {}
  try {
    if (typeof window !== "undefined" && Array.isArray(window.__cspElevesASupprimer)) {
      window.__cspElevesASupprimer.forEach((id) => acc.add(String(id)));
    }
  } catch (e) {}
  return [...acc].filter(Boolean);
}

function ecrireElevesSupprimes(ids) {
  const uniques = [...new Set((ids || []).map(String).filter(Boolean))];
  __cspBansMemoire = uniques;
  try { localStorage.setItem(CLE_ELEVES_SUPPRIMES, JSON.stringify(uniques)); } catch (e) {}
  try { sessionStorage.setItem(CLE_ELEVES_SUPPRIMES, JSON.stringify(uniques)); } catch (e) {}
  try { if (typeof window !== "undefined") window.__cspElevesASupprimer = uniques; } catch (e) {}
}

function marquerElevesSupprimes(idsAjout) {
  const ids = [...new Set([...lireElevesSupprimes(), ...(idsAjout || []).map(String)])];
  ecrireElevesSupprimes(ids);
  return ids;
}

/** Liste noire conservée : un élève supprimé ne revient plus à l'écran. */
function retirerElevesSupprimesConfirmes(_idsConfirmes) {
  return;
}

function filtrerElevesNonSupprimes(liste) {
  const bans = new Set(lireElevesSupprimes().map(String));
  if (!bans.size) return liste || [];
  return (liste || []).filter((e) => e && !bans.has(String(e.id)));
}

const CLE_JOURNAL = "csp_sagesse_divine_journal";
const CLE_ROLES_BLOQUES = "csp_sagesse_divine_roles_bloques";
const CLE_SITES = "csp_sagesse_divine_sites";
const CLE_ARCHIVES_SUPPR = "csp_sagesse_divine_archives_suppr";

function lireJournal() {
  try {
    const a = JSON.parse(localStorage.getItem(CLE_JOURNAL) || "[]");
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function ecrireJournalLocal(liste) {
  try { localStorage.setItem(CLE_JOURNAL, JSON.stringify((liste || []).slice(0, 300))); } catch (e) {}
}
/** Journal d'activité : connexions, actions, tentatives refusées (visible Fondateur/Directeur). */
function journaliser(texte, role = "système", extra = {}) {
  try {
    const prev = lireJournal();
    const entry = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      date: new Date().toISOString(),
      texte: String(texte || ""),
      role: String(role || "système"),
      espace: String((extra && extra.espace) || ""),
      detail: String((extra && extra.detail) || ""),
      reussi: extra && extra.reussi === false ? false : true,
      appareil: String((extra && extra.appareil) || (typeof navigator !== "undefined" ? (navigator.userAgent || "").slice(0, 60) : "")),
    };
    prev.unshift(entry);
    const coupe = prev.slice(0, 300);
    ecrireJournalLocal(coupe);
    try {
      if (typeof pgUpsert === "function" && typeof SUPABASE_CONFIGURE !== "undefined" && SUPABASE_CONFIGURE) {
        pgUpsert("codes_acces", [{ role: "_journal", code: JSON.stringify(coupe.slice(0, 120)) }], "role").catch(() => {});
      }
    } catch (e2) {}
  } catch (e) {}
}

/** true = plateforme ouverte pour tous ; false = seule le fondateur peut se connecter */
function lirePlateformeActive() {
  try {
    if (typeof window !== "undefined" && window.__cspPlateformeActive === false) return false;
    if (typeof window !== "undefined" && window.__cspPlateformeActive === true) return true;
  } catch (e) {}
  try {
    const v = localStorage.getItem(CLE_PLATEFORME);
    if (v === null || v === undefined || v === "") return true;
    return v !== "0" && v !== "false";
  } catch (e) { return true; }
}
function ecrirePlateformeActive(active) {
  const ouverte = !!active;
  try { if (typeof window !== "undefined") window.__cspPlateformeActive = ouverte; } catch (e) {}
  try { localStorage.setItem(CLE_PLATEFORME, ouverte ? "1" : "0"); } catch (e) {}
  try {
    if (typeof pgUpsert === "function" && typeof SUPABASE_CONFIGURE !== "undefined" && SUPABASE_CONFIGURE) {
      const row = { role: "_plateforme", code: ouverte ? "1" : "0" };
      pgUpsert("codes_acces", [row], "role").catch(() => {
        try { pgInsert("codes_acces", [row]).catch(() => {}); } catch (e2) {}
      });
    }
  } catch (e) {}
}


/** Impression / PDF des dépenses filtrées (mois, trimestre, année). */

function telechargerCSV(nomFichier, lignes) {
  try {
    const contenu = (lignes || []).join("\n");
    const blob = new Blob(["\ufeff" + contenu], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomFichier || "export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) { console.warn(e); alert("Export impossible."); }
}
function lireCalendrierScolaire() {
  try {
    const a = JSON.parse(localStorage.getItem("csp_sagesse_divine_calendrier") || "[]");
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function ecrireCalendrierScolaire(liste) {
  try { localStorage.setItem("csp_sagesse_divine_calendrier", JSON.stringify((liste || []).slice(0, 400))); } catch (e) {}
  try {
    if (typeof pgUpsert === "function" && typeof SUPABASE_CONFIGURE !== "undefined" && SUPABASE_CONFIGURE) {
      pgUpsert("codes_acces", [{ role: "_calendrier", code: JSON.stringify((liste || []).slice(0, 250)) }], "role").catch(() => {});
    }
  } catch (e) {}
}
function lireBulletinsValides() {
  try {
    const o = JSON.parse(localStorage.getItem("csp_sagesse_divine_bulletins_valides") || "{}");
    return o && typeof o === "object" ? o : {};
  } catch (e) { return {}; }
}
function ecrireBulletinsValides(o) {
  try { localStorage.setItem("csp_sagesse_divine_bulletins_valides", JSON.stringify(o || {})); } catch (e) {}
  try {
    if (typeof pgUpsert === "function" && typeof SUPABASE_CONFIGURE !== "undefined" && SUPABASE_CONFIGURE) {
      pgUpsert("codes_acces", [{ role: "_bulletins_valides", code: JSON.stringify(o || {}) }], "role").catch(() => {});
    }
  } catch (e) {}
}
function bulletinEstValide(eleveId) {
  const e = lireBulletinsValides()[String(eleveId || "")];
  return !!(e && e.valide);
}
function lireMessageMaintenance() {
  try { return localStorage.getItem("csp_sagesse_divine_msg_maintenance") || ""; } catch (e) { return ""; }
}
function ecrireMessageMaintenance(t) {
  try { localStorage.setItem("csp_sagesse_divine_msg_maintenance", String(t || "")); } catch (e) {}
  try {
    if (typeof pgUpsert === "function" && typeof SUPABASE_CONFIGURE !== "undefined" && SUPABASE_CONFIGURE) {
      pgUpsert("codes_acces", [{ role: "_msg_maintenance", code: String(t || "") }], "role").catch(() => {});
    }
  } catch (e) {}
}
function lireDevoirs() {
  try {
    const a = JSON.parse(localStorage.getItem("csp_sagesse_divine_devoirs") || "[]");
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function ecrireDevoirs(liste) {
  try { localStorage.setItem("csp_sagesse_divine_devoirs", JSON.stringify((liste || []).slice(0, 500))); } catch (e) {}
  try {
    if (typeof pgUpsert === "function" && typeof SUPABASE_CONFIGURE !== "undefined" && SUPABASE_CONFIGURE) {
      pgUpsert("codes_acces", [{ role: "_devoirs", code: JSON.stringify((liste || []).slice(0, 200)) }], "role").catch(() => {});
    }
  } catch (e) {}
}

function imprimerDepensesRapport(liste, titre, ecole) {
  try {
    const rows = Array.isArray(liste) ? liste.slice() : [];
    rows.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
    const tot = rows.reduce((s, d) => s + (Number(d.montant) || 0), 0);
    let html = "<table border=\"1\" cellpadding=\"6\" cellspacing=\"0\" style=\"border-collapse:collapse;width:100%;font-size:13px\">";
    html += "<tr style=\"background:#F1ECDD\"><th>Date</th><th>Libellé</th><th>Montant (FCFA)</th><th>Note</th></tr>";
    rows.forEach((d) => {
      html += "<tr><td>" + (d.date || "") + "</td><td>" + (d.libelle || d.nom || "") + "</td><td>" + (Number(d.montant) || 0).toLocaleString("fr-FR") + "</td><td>" + (d.note || "") + "</td></tr>";
    });
    html += "</table>";
    html += "<p style=\"margin-top:16px;font-weight:bold\">Total : " + tot.toLocaleString("fr-FR") + " FCFA — " + rows.length + " dépense(s)</p>";
    const win = window.open("", "_blank");
    if (!win) { alert("Autorisez les pop-ups pour imprimer / télécharger"); return; }
    const nomEcole = (ecole && (ecole.nom || ecole.sigle)) || "École";
    win.document.write("<!DOCTYPE html><html><head><title>" + titre + "</title><meta charset=\"utf-8\"/></head>");
    win.document.write("<body style=\"font-family:Georgia,serif;padding:20px;color:#1B2A4A\">");
    win.document.write("<h1>" + titre + "</h1>");
    win.document.write("<p>" + nomEcole + " — Édité le " + new Date().toLocaleDateString("fr-FR") + "</p>");
    win.document.write(rows.length ? html : "<p>Aucune dépense pour cette période.</p>");
    win.document.write("<p style=\"margin-top:24px\"><button onclick=\"window.print()\">Imprimer / enregistrer en PDF</button></p>");
    win.document.write("</body></html>");
    win.document.close();
  } catch (err) {
    console.warn(err);
    alert("Impossible d'ouvrir l'impression");
  }
}
function moisDepense(d) {
  const s = String((d && (d.date || d.cree_le)) || "");
  return s.length >= 7 ? s.slice(0, 7) : "";
}
function moisDansTrimestreScolaire(ym, t) {
  // ym = "2026-10" ; t = 1|2|3 (année scolaire sept→juin)
  if (!ym || ym.length < 7) return false;
  const m = parseInt(ym.slice(5, 7), 10);
  if (t === 1) return m === 9 || m === 10 || m === 11;
  if (t === 2) return m === 12 || m === 1 || m === 2;
  if (t === 3) return m === 3 || m === 4 || m === 5 || m === 6;
  return false;
}

function formaterDateJournal(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso || "");
    return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch (e) { return String(iso || ""); }
}
function lireRolesBloques() {
  try {
    const o = JSON.parse(localStorage.getItem(CLE_ROLES_BLOQUES) || "{}");
    return o && typeof o === "object" ? o : {};
  } catch (e) { return {}; }
}
function ecrireRolesBloques(o) {
  try { localStorage.setItem(CLE_ROLES_BLOQUES, JSON.stringify(o || {})); } catch (e) {}
}
function lireSites() {
  try {
    const a = JSON.parse(localStorage.getItem(CLE_SITES) || "[]");
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function ecrireSites(a) {
  try { localStorage.setItem(CLE_SITES, JSON.stringify(a || [])); } catch (e) {}
}
function lireArchivesSupprimes() {
  try {
    const a = JSON.parse(localStorage.getItem(CLE_ARCHIVES_SUPPR) || "[]");
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function archiverEleveSupprime(eleve) {
  if (!eleve || !eleve.id) return;
  try {
    const prev = lireArchivesSupprimes().filter((e) => String(e.id) !== String(eleve.id));
    prev.unshift({ ...eleve, _archiveLe: new Date().toISOString() });
    localStorage.setItem(CLE_ARCHIVES_SUPPR, JSON.stringify(prev.slice(0, 100)));
  } catch (e) {}
}
function retirerArchiveSupprime(id) {
  try {
    const next = lireArchivesSupprimes().filter((e) => String(e.id) !== String(id));
    localStorage.setItem(CLE_ARCHIVES_SUPPR, JSON.stringify(next));
  } catch (e) {}
}
function telechargerTexte(nomFichier, contenu, mime = "text/csv;charset=utf-8") {
  try {
    const blob = new Blob([contenu], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (e) {
    console.warn("téléchargement", e);
    window.alert("Impossible de télécharger le fichier sur cet appareil.");
  }
}

const CLE_DEPENSES = "csp_sagesse_divine_depenses";
function lireDepenses() {
  try {
    const a = JSON.parse(localStorage.getItem(CLE_DEPENSES) || "[]");
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function ecrireDepenses(liste) {
  try { localStorage.setItem(CLE_DEPENSES, JSON.stringify(liste || [])); } catch (e) {}
}

async function syncDepenses(depenses) {
  if (!SUPABASE_CONFIGURE) return;
  try {
    const locales = depenses || [];
    const remote = (await pgSelect("depenses")) || [];
    const setLocal = new Set(locales.map((d) => String(d.id)));
    const setRemote = new Set(remote.map((d) => String(d.id)));
    // Supprimer en base ce qui n'est plus en local
    const aSuppr = remote.filter((r) => !setLocal.has(String(r.id))).map((r) => r.id).filter(Boolean);
    if (aSuppr.length) {
      try { await pgDeleteIn("depenses", "id", aSuppr); } catch (e) { console.warn("suppr depenses", e); }
    }
    // Upsert toutes les lignes locales
    if (locales.length) {
      await pgUpsert("depenses", locales.map((d) => ({
        id: String(d.id),
        libelle: d.libelle || null,
        montant: Number(d.montant) || 0,
        date: d.date || null,
        note: d.note || null,
      })), "id");
    }
  } catch (e) {
    console.warn("syncDepenses:", e);
  }
}
async function chargerDepensesRemote() {
  if (!SUPABASE_CONFIGURE) return lireDepenses();
  try {
    const rows = (await pgSelect("depenses", "&order=date.desc")) || [];
    const liste = rows.map((r) => ({
      id: String(r.id),
      libelle: r.libelle || "",
      montant: Number(r.montant) || 0,
      date: r.date || "",
      note: r.note || "",
    }));
    ecrireDepenses(liste);
    return liste;
  } catch (e) {
    console.warn("chargerDepensesRemote:", e);
    return lireDepenses();
  }
}

function trierElevesAlpha(liste) {
  return [...(liste || [])].sort((a, b) => {
    const na = ((a.nom || "") + " " + (a.prenom || "")).trim().toLowerCase();
    const nb = ((b.nom || "") + " " + (b.prenom || "")).trim().toLowerCase();
    return na.localeCompare(nb, "fr");
  });
}
function texteListeClasse(elevesClasse, classe) {
  const tries = trierElevesAlpha(elevesClasse);
  const lignes = ["Classe " + classe + " — " + tries.length + " élève(s)", ""];
  tries.forEach((e, i) => {
    lignes.push((i + 1) + ". " + (e.nom || "") + " " + (e.prenom || "") + " — code " + (e.id || "") + " — classe " + (e.classe || classe));
  });
  return lignes.join("\n");
}


function normaliserSexe(s) {
  const raw = String(s == null ? "" : s).trim();
  if (!raw) return "";
  const x = raw.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "");
  if (!x) return "";
  // Codes courts
  if (x === "M" || x === "1" || x === "H") return "M";
  if (x === "F" || x === "2" || x === "0") return "F";
  // Libellés
  if (x.startsWith("MASC") || x.startsWith("GARC") || x === "GARCON" || x === "HOMME" || x === "BOY" || x === "MALE") return "M";
  if (x.startsWith("FEM") || x.startsWith("FILL") || x === "FEMME" || x === "GIRL" || x === "FEMALE") return "F";
  // Premier caractère si M/F seul au début
  if (x[0] === "M" && !x.startsWith("ME")) return "M";
  if (x[0] === "F") return "F";
  return "";
}

/** Remplit le sexe manquant sur les élèves à partir des demandes validées (même nom/prénom/naissance ou code). */
function completerSexesDepuisDemandes(eleves, demandes) {
  const dems = (demandes || []).filter((d) => d && (d.sexe || d.sexe === 0));
  if (!dems.length) return eleves || [];
  return (eleves || []).map((e) => {
    if (normaliserSexe(e.sexe)) return e;
    const parCode = dems.find((d) => d.codeEleve && String(d.codeEleve) === String(e.id));
    const parIdentite = dems.find((d) =>
      String(d.prenom || "").trim().toLowerCase() === String(e.prenom || "").trim().toLowerCase()
      && String(d.nom || "").trim().toLowerCase() === String(e.nom || "").trim().toLowerCase()
      && (!d.naissance || !e.naissance || String(d.naissance) === String(e.naissance))
    );
    const d = parCode || parIdentite;
    if (d && d.sexe) return { ...e, sexe: d.sexe };
    return e;
  });
}
function elevesParSexe(eleves, sexeCode) {
  return trierElevesAlpha((eleves || []).filter((e) => normaliserSexe(e.sexe) === sexeCode));
}
function texteListeSexe(eleves, sexeCode) {
  const label = sexeCode === "M" ? "Garçons" : "Filles";
  const tries = elevesParSexe(eleves, sexeCode);
  const lignes = [
    "Liste des " + label + " — " + tries.length + " élève(s) — ordre alphabétique (nom)",
    "",
  ];
  tries.forEach((e, i) => {
    lignes.push((i + 1) + ". " + (e.nom || "") + " " + (e.prenom || "") + " — code " + (e.id || "") + " — classe " + (e.classe || ""));
  });
  return lignes.join("\n");
}
function imprimerListeSexe(eleves, sexeCode, ecole) {
  const label = sexeCode === "M" ? "Garçons" : "Filles";
  const tries = elevesParSexe(eleves, sexeCode);
  const win = window.open("", "_blank");
  if (!win) { alert("Autorise les popups pour imprimer"); return; }
  const cards = tries.map((e, i) =>
    "<div style=\"border:2px solid #ccc;border-radius:12px;padding:12px 16px;margin:8px 0\">" +
    "<div style=\"font-size:12px;color:#666\">N° " + (i + 1) + "</div>" +
    "<div style=\"font-size:20px;font-weight:700\">" + echapperHtml(e.nom || "—") + "</div>" +
    "<div style=\"font-size:16px\">" + echapperHtml(e.prenom || "") + "</div>" +
    "<div style=\"margin-top:6px;font-size:14px\">" +
    "<b>" + echapperHtml(String(e.id || "")) + "</b> — " + echapperHtml(e.classe || "") +
    "</div></div>"
  ).join("");
  win.document.write("<!DOCTYPE html><html><head><title>Liste des " + label + "</title>" +
    "<style>body{font-family:Arial,sans-serif;padding:20px;color:#1B2A4A} h1{font-size:20px}</style></head><body>" +
    "<h1>" + echapperHtml((ecole && ecole.sigle) || "École") + " — Liste des " + label + "</h1>" +
    "<p><b>Effectif :</b> " + tries.length + " &nbsp;|&nbsp; " + new Date().toLocaleDateString("fr-FR") + "</p>" +
    (cards || "<p>Aucun élève</p>") +
    "<script>window.print()</script></body></html>");
  win.document.close();
}
function copierTexteListe(texte) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texte).then(() => alert("Liste copiée !")).catch(() => prompt("Copiez :", texte));
  } else prompt("Copiez :", texte);
}
function texteListeTousEleves(eleves) {
  const tries = trierElevesAlpha(eleves);
  const lignes = ["Liste des élèves — " + tries.length + " élève(s) — ordre alphabétique (nom)", ""];
  tries.forEach((e, i) => {
    lignes.push((i + 1) + ". " + (e.nom || "") + " " + (e.prenom || "") + " — code " + (e.id || "") + " — classe " + (e.classe || ""));
  });
  return lignes.join("\n");
}
function imprimerListeTousEleves(eleves, ecole) {
  const tries = trierElevesAlpha(eleves);
  const win = window.open("", "_blank");
  if (!win) { alert("Autorise les popups pour imprimer"); return; }
  const cards = tries.map((e, i) =>
    "<div style=\"border:2px solid #ccc;border-radius:12px;padding:14px 16px;margin:10px 0\">" +
    "<div style=\"font-size:13px;color:#666\">N° " + (i + 1) + "</div>" +
    "<div style=\"font-size:22px;font-weight:700;margin-top:4px\">" + echapperHtml(e.nom || "—") + "</div>" +
    "<div style=\"font-size:17px;color:#444\">" + echapperHtml(e.prenom || "") + "</div>" +
    "<div style=\"margin-top:8px;font-size:15px\">" +
    "<span style=\"background:#EEF2FF;padding:4px 10px;border-radius:6px;font-family:monospace;font-weight:700\">" + echapperHtml(String(e.id || "")) + "</span> " +
    "<span style=\"background:#F1ECDD;padding:4px 10px;border-radius:6px;font-weight:600\">" + echapperHtml(e.classe || "") + "</span>" +
    "</div></div>"
  ).join("");
  win.document.write("<!DOCTYPE html><html><head><title>Liste des élèves</title>" +
    "<style>body{font-family:Arial,sans-serif;padding:20px;color:#1B2A4A} h1{font-size:20px}</style>" +
    "</head><body>" +
    "<h1>" + echapperHtml((ecole && ecole.sigle) || "École") + " — Liste des élèves (ordre alphabétique)</h1>" +
    "<p style=\"font-size:16px\"><b>Effectif :</b> " + tries.length + " &nbsp;|&nbsp; " + new Date().toLocaleDateString("fr-FR") + "</p>" +
    (cards || "<p>Aucun élève</p>") +
    "<script>window.print()</script></body></html>");
  win.document.close();
}

function imprimerListeClasse(elevesClasse, classe, ecole) {
  const tries = trierElevesAlpha(elevesClasse);
  const win = window.open("", "_blank");
  if (!win) { alert("Autorise les popups pour imprimer"); return; }
  const cards = tries.map((e, i) =>
    "<div style=\"border:2px solid #ccc;border-radius:12px;padding:14px 16px;margin:10px 0\">" +
    "<div style=\"font-size:13px;color:#666\">N° " + (i + 1) + "</div>" +
    "<div style=\"font-size:22px;font-weight:700;margin-top:4px\">" + echapperHtml(e.nom || "—") + "</div>" +
    "<div style=\"font-size:17px;color:#444\">" + echapperHtml(e.prenom || "") + "</div>" +
    "<div style=\"margin-top:8px;font-size:15px\">" +
    "<span style=\"background:#EEF2FF;padding:4px 10px;border-radius:6px;font-family:monospace;font-weight:700\">" + echapperHtml(String(e.id || "")) + "</span> " +
    "<span style=\"background:#F1ECDD;padding:4px 10px;border-radius:6px;font-weight:600\">" + echapperHtml(e.classe || classe) + "</span>" +
    "</div></div>"
  ).join("");
  win.document.write("<!DOCTYPE html><html><head><title>Liste " + echapperHtml(classe) + "</title>" +
    "<style>body{font-family:Arial,sans-serif;padding:20px;color:#1B2A4A} h1{font-size:20px}</style>" +
    "</head><body>" +
    "<h1>" + echapperHtml((ecole && ecole.sigle) || "École") + " — Liste de classe</h1>" +
    "<p style=\"font-size:16px\"><b>Classe :</b> " + echapperHtml(classe) + " &nbsp;|&nbsp; <b>Effectif :</b> " + tries.length + " &nbsp;|&nbsp; " + new Date().toLocaleDateString("fr-FR") + "</p>" +
    (cards || "<p>Aucun élève</p>") +
    "<script>window.print()</script></body></html>");
  win.document.close();
}

/** Neutralise < > & " ' pour insertion dans HTML (bulletin, reçu, listes). */
function echapperHtml(valeur) {
  return String(valeur ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function exporterDonneesCSV(eleves) {
  const sep = ";";
  const lignes = ["id;prenom;nom;classe;sexe;naissance;parrain;telephone;frais_dus;frais_payes;frais_restants;nb_notes;nb_absences"];
  (eleves || []).forEach((e) => {
    const frais = e.frais || [];
    const dus = frais.reduce((s, f) => s + (Number(f.du) || 0), 0);
    const payes = frais.reduce((s, f) => s + (Number(f.paye) || 0), 0);
    const rest = frais.reduce((s, f) => s + Math.max(0, (Number(f.du) || 0) - (Number(f.paye) || 0)), 0);
    const row = [
      e.id, e.prenom, e.nom, e.classe, e.sexe || "", e.naissance || "",
      (e.parent && e.parent.nom) || "", (e.parent && e.parent.telephone) || "",
      dus, payes, rest, (e.notes || []).length, (e.absences || []).length,
    ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(sep);
    lignes.push(row);
  });
  const notesLignes = ["eleve_id;prenom;nom;classe;matiere;evaluation;mois;note20;date"];
  (eleves || []).forEach((e) => {
    (e.notes || []).forEach((n) => {
      notesLignes.push([
        e.id, e.prenom, e.nom, e.classe, n.matiere, n.evaluation, n.mois, n.note20, n.dateSaisie || "",
      ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(sep));
    });
  });
  const fraisLignes = ["eleve_id;prenom;nom;classe;libelle;du;paye;reste;mode;date"];
  (eleves || []).forEach((e) => {
    (e.frais || []).forEach((f) => {
      fraisLignes.push([
        e.id, e.prenom, e.nom, e.classe, f.libelle, f.du, f.paye,
        Math.max(0, (Number(f.du) || 0) - (Number(f.paye) || 0)),
        f.mode || "", f.datePaiement || "",
      ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(sep));
    });
  });
  const stamp = new Date().toISOString().slice(0, 10);
  telechargerTexte(`eleves_${stamp}.csv`, lignes.join("\n"));
  setTimeout(() => telechargerTexte(`notes_${stamp}.csv`, notesLignes.join("\n")), 400);
  setTimeout(() => telechargerTexte(`frais_${stamp}.csv`, fraisLignes.join("\n")), 800);
  journaliser("Export CSV élèves + notes + frais", "fondateur");
}

/* ------------------------------------------------------------------
   SESSION SÉCURISÉE
   Le code saisi est vérifié CÔTÉ SERVEUR (fonction SQL csp_login).
   Le navigateur reçoit uniquement un jeton temporaire (en mémoire, jamais stocké)
   et ne télécharge plus jamais les codes d'accès.
------------------------------------------------------------------- */
let __cspSession = null;

function definirSession(s) {
  __cspSession = s && s.token
    ? { token: s.token, role: s.role, eleve_id: s.eleve_id || null, classe: s.classe || null }
    : null;
}
function lireSession() { return __cspSession; }

async function appelRpc(nom, corps) {
  const reponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nom}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(__cspSession ? { "x-csp-session": __cspSession.token } : {}),
    },
    body: JSON.stringify(corps || {}),
  });
  const texte = await reponse.text();
  let data = null;
  try { data = texte ? JSON.parse(texte) : null; } catch (e) {}
  if (!reponse.ok) throw new Error(`${reponse.status} — ${(data && (data.message || data.hint)) || texte}`);
  return data;
}

async function connexionServeur(role, code) {
  if (!SUPABASE_CONFIGURE) throw new Error("Serveur non configuré");
  const r = await appelRpc("csp_login", { p_role: role, p_code: code });
  if (!r || !r.ok) {
    const e = new Error((r && r.erreur) || "ERREUR");
    e.code = r && r.erreur;
    throw e;
  }
  return r;
}

/** true = session valable, false = expirée/invalide, null = réseau indisponible */
async function pingSession() {
  if (!__cspSession) return false;
  try {
    const r = await appelRpc("csp_ping");
    return !!(r && r.ok);
  } catch (e) {
    return null;
  }
}

async function deconnexionServeur() {
  try {
    if (__cspSession) {
      await Promise.race([
        appelRpc("csp_logout"),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    }
  } catch (e) {}
  __cspSession = null;
  try { if (typeof window !== "undefined") window.__cspSession = null; } catch (e) {}
}

/** Lecture protégée : sans session, on ne contacte même pas la base (résultat vide). */
const pgProtege = (table, requete = "") => (__cspSession ? pgSelect(table, requete) : Promise.resolve([]));

/** Qui a le droit d'ÉCRIRE dans quelle table (doit rester cohérent avec les règles RLS du script SQL). */
const ROLES_ECRITURE = {
  ecole: ["fondateur", "directeur"],
  codes: ["fondateur", "directeur"],
  classes: ["fondateur", "directeur"],
  matieres: ["fondateur", "directeur"],
  personnel: ["fondateur", "directeur"],
  fraisTypes: ["fondateur", "directeur"],
  emploi: ["fondateur", "directeur"],
  annees: ["fondateur", "directeur"],
  depenses: ["fondateur", "directeur"],
  annonces: ["fondateur", "directeur", "secretaire"],
  demandes: ["fondateur", "directeur", "secretaire"],
  elevesSuppr: ["fondateur", "directeur", "secretaire"],
  eleves: ["fondateur", "directeur", "secretaire", "enseignant", "parent"],
  messagesInternes: ["fondateur", "directeur", "secretaire", "enseignant"],
  messagesParents: ["fondateur", "directeur", "secretaire", "enseignant", "parent"],
};
function roleAutorise(role, table) {
  const liste = ROLES_ECRITURE[table];
  return !!role && Array.isArray(liste) && liste.includes(role);
}

/** Efface les données personnelles gardées sur l'appareil (élèves, finances…). */
function effacerDonneesLocales() {
  try { localStorage.removeItem(CLE_STOCKAGE_LOCAL); } catch (e) {}
  try { localStorage.removeItem(CLE_DEPENSES); } catch (e) {}
}
// Au démarrage : plus aucune donnée sensible ne reste sur l'appareil d'une session précédente
if (SUPABASE_CONFIGURE) effacerDonneesLocales();

/** Dépôt d'une demande d'inscription par un parent NON connecté (insertion seule autorisée). */
function genererIdDemande() {
  let rnd = String(Math.floor(100000 + Math.random() * 900000));
  try { rnd = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)); } catch (e) {}
  return "DEM-" + Date.now().toString(36).toUpperCase() + "-" + rnd;
}

async function insererDemandePublique(d) {
  const payload = [{
    id: d.id || genererIdDemande(),
    prenom: d.prenom, nom: d.nom, sexe: d.sexe ?? null, naissance: d.naissance ?? null,
    age: d.age ?? null, classe_souhaitee: d.classeSouhaitee ?? null, parrain_nom: d.parrainNom ?? null,
    parrain_telephone: d.parrainTelephone ?? null,
    message: d.message ?? null, origine: d.origine ?? "en_ligne",
    date: d.date ?? null, statut: d.statut ?? "en_attente",
  }];
  let dernierErr = null;
  for (let essai = 0; essai < 3; essai++) {
    try {
      if (essai > 0) payload[0].id = genererIdDemande(); // nouvel id si conflit de clé
      await pgInsert("demandes_inscription", payload);
      d.id = payload[0].id;
      return d;
    } catch (e) {
      dernierErr = e;
      const msg = String((e && e.message) || e);
      // Conflit id / doublon → réessayer avec un nouvel id
      if (/23505|duplicate|conflict|409/i.test(msg) && essai < 2) continue;
      throw e;
    }
  }
  throw dernierErr || new Error("Échec insertion demande");
}

async function pgFetch(chemin, options = {}) {
  if (!SUPABASE_CONFIGURE) throw new Error("Supabase non configuré - mode local");
  // Pas d'AbortController: sur mobile le réseau est lent et coupait les sauvegardes ("signal is aborted")
  const reponse = await fetch(`${SUPABASE_URL}/rest/v1${chemin}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.headers?.Prefer || "",
      ...(__cspSession ? { "x-csp-session": __cspSession.token } : {}),
      ...(options.headers || {}),
    },
  });
  if (!reponse.ok) {
    const texte = await reponse.text().catch(() => "");
    throw new Error(`${reponse.status} ${reponse.statusText} — ${texte}`);
  }
  if (reponse.status === 204) return null;
  const brut = await reponse.text();
  return brut ? JSON.parse(brut) : null;
}

const pgSelect = (table, requete = "") => pgFetch(`/${table}?select=*${requete}`, {
  method: "GET",
  headers: { Prefer: "count=exact", Range: "0-9999" },
});

const pgUpsert = (table, lignes, onConflict) => {
  if (!lignes || lignes.length === 0) return Promise.resolve();
  const qs = onConflict ? `?on_conflict=${onConflict}` : "";
  return pgFetch(`/${table}${qs}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(lignes),
  });
};

const pgInsert = (table, lignes) => {
  if (!lignes || lignes.length === 0) return Promise.resolve();
  return pgFetch(`/${table}`, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(lignes),
  });
};

const pgDeleteIn = async (table, colonne, valeurs) => {
  if (!valeurs || valeurs.length === 0) return;
  for (const v of valeurs) {
    const raw = String(v);
    try {
      await pgFetch(`/${table}?${colonne}=eq.${encodeURIComponent(raw)}`, {
        method: "DELETE", headers: { Prefer: "return=minimal" },
      });
    } catch (e1) {
      try {
        const liste = `"${raw.replace(/"/g, "")}"`;
        await pgFetch(`/${table}?${colonne}=in.(${liste})`, {
          method: "DELETE", headers: { Prefer: "return=minimal" },
        });
      } catch (e2) {
        console.warn("pgDeleteIn", table, colonne, raw, e2);
      }
    }
  }
};

const pgDeleteToutes = (table, colonneCle) =>
  pgFetch(`/${table}?${colonneCle}=not.is.null`, { method: "DELETE", headers: { Prefer: "return=minimal" } });

/* ------------------------------------------------------------------
   DONNÉES DE DÉMONSTRATION
------------------------------------------------------------------- */

const LOGO_CSP_BASE64 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' rx='16' fill='%231B2A4A'/%3E%3Ctext x='64' y='72' text-anchor='middle' font-family='serif' font-size='28' font-weight='700' fill='%23C9A227'%3ECSP%3C/text%3E%3C/svg%3E";

const ECOLE_INIT = {
  nom: "Complexe Scolaire Protestant",
  sigle: "CSP « Sagesse Divine »",
  quartier: "Kèra, à côté du Temple EPMB Cité de Paix",
  commune: "Tchaourou",
  departement: "Borgou",
  directeur: "Past. A. S. Boko",
  telephone: "97 00 00 00",
  telephoneDirecteur: "97 11 22 33",
  email: "contact@csp-sagessedivine.bj",
  devise: "Excellence Réelle",
  logoUrl: LOGO_CSP_BASE64,
  lienReunion: "",
  whatsappEcole: "",
};

/** Fusionne les infos école : ne remplace JAMAIS une valeur utile par une chaîne vide. */
function signatureEcole(e) {
  if (!e) return "";
  return [e.nom, e.sigle, e.quartier, e.commune, e.departement, e.directeur, e.telephone, e.telephoneDirecteur, e.email, e.devise, e.logoUrl, e.lienReunion].map((x) => String(x || "").trim()).join("|");
}
function ecoleIdentique(a, b) {
  return signatureEcole(a) === signatureEcole(b);
}
function fusionnerEcole(remote, base = ECOLE_INIT) {
  const r = remote && typeof remote === "object" ? remote : {};
  const b = base && typeof base === "object" ? base : {};
  const pick = (...cles) => {
    for (const k of cles) {
      const v = r[k];
      if (v != null && String(v).trim() !== "") return typeof v === "string" ? v.trim() : v;
    }
    for (const k of cles) {
      const v = b[k];
      if (v != null && String(v).trim() !== "") return typeof v === "string" ? v.trim() : v;
    }
    return "";
  };
  return {
    nom: pick("nom"),
    sigle: pick("sigle"),
    quartier: pick("quartier"),
    commune: pick("commune"),
    departement: pick("departement"),
    directeur: pick("directeur"),
    telephone: pick("telephone"),
    telephoneDirecteur: pick("telephoneDirecteur", "telephone_directeur"),
    email: pick("email"),
    devise: pick("devise"),
    logoUrl: pick("logoUrl", "logo_url") || b.logoUrl || (typeof LOGO_CSP_BASE64 !== "undefined" ? LOGO_CSP_BASE64 : ""),
    lienReunion: pick("lienReunion", "lien_reunion"),
    whatsappEcole: pick("whatsappEcole", "whatsapp_ecole"),
  };
}



const CLASSES_INIT = ["Maternelle 1", "Maternelle 2", "CI", "CP", "CE1", "CE2", "CM1", "CM2"];

/* Codes d'accès du personnel — modifiables par le Directeur dans Paramètres.
   Le code d'un parent, lui, est le code élève (CSPxxxx) généré à la validation :
   il n'est jamais montré au parent automatiquement, le Directeur le communique lui-même. */
const CLASSES_PAR_DEFAUT_CODES = ["6ème A","6ème B","5ème A","5ème B","4ème A","4ème B","3ème A","3ème B","Seconde A","Première A","Terminale A"];
const CODES_ENSEIGNANTS_DEFAUT = {};
CLASSES_PAR_DEFAUT_CODES.forEach((c,i)=>{ CODES_ENSEIGNANTS_DEFAUT[c] = `ENS-${c.replace(/[^A-Z0-9]/gi,"").toUpperCase()}-${1000+i*111}`; });
// Codes simples (secours) — aussi à mettre en base codes_acces / fonction csp_login
/** Code pour ouvrir le groupe « Espace personnel de l'école » (avant les codes par rôle). */
const CODE_GROUPE_PERSONNEL_DEFAUT = "Jesus1";

const CODES_INIT = {
  fondateur: "0000",
  directeur: "1234",
  enseignant: "5678",
  secretaire: "9012",
  enseignants: CODES_ENSEIGNANTS_DEFAUT,
};

const ANNEE_INIT = "2026-2027";

/* Catalogue des frais de l'année en cours — modifiable par le Directeur.
   Sert de modèle appliqué automatiquement à chaque nouvel élève inscrit. */
const FRAIS_TYPES_INIT = [
  { libelle: "Inscription", montant: 25000 },
  { libelle: "Écolage", montant: 90000 },
  { libelle: "Cantine", montant: 20000 },
  { libelle: "T-shirt", montant: 5000 },
  { libelle: "Uniforme", montant: 15000 },
];

/* Contexte global : identité de l'école, classes, frais, année scolaire,
   matières par classe et codes d'accès — partagés depuis n'importe quel écran. */
const EcoleContext = createContext(null);
function useEcole() {
  return useContext(EcoleContext);
}

const MATIERES_INIT = [
  { nom: "Communication orale", coef: 1 },
  { nom: "Expression écrite", coef: 2 },
  { nom: "Lecture", coef: 2 },
  { nom: "Dictée", coef: 1 },
  { nom: "EST", coef: 1 },
];

/* Matières définies par classe — chaque classe a son propre programme.
   Dès qu'un élève est inscrit dans une classe, ce sont ces matières qui
   apparaissent automatiquement sur sa page de notes. */

/** Classe maternelle : évaluation TS / S / PS (pas de note /20 ni coefficient). */
function estClasseMaternelle(classe) {
  const c = String(classe || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return c.includes("maternelle") || c.includes("prescolaire") || c.includes("pre-scolaire") || /^\s*mat\s*[12]\b/.test(c);
}

/** Conversion niveau maternelle <-> note20 (stockage unique pour la sync). */
const NIVEAUX_MATERNELLE = [
  { code: "TS", label: "TS — Travail satisfaisant", note20: 18, emoji: "☺" },
  { code: "S", label: "S — Satisfaisant", note20: 14, emoji: "😐" },
  { code: "PS", label: "PS — Peu satisfaisant", note20: 8, emoji: "D" },
];
function note20VersNiveau(n) {
  if (n == null || n === "") return "";
  if (typeof n === "string" && ["TS", "S", "PS"].includes(n.toUpperCase())) return n.toUpperCase();
  const v = Number(n);
  if (isNaN(v)) return "";
  if (v >= 16) return "TS";
  if (v >= 11) return "S";
  return "PS";
}
function niveauVersNote20(code) {
  const c = String(code || "").toUpperCase();
  const f = NIVEAUX_MATERNELLE.find((x) => x.code === c);
  return f ? f.note20 : null;
}

/** Barème : CI, CP, CE1, CE2, CM1, CM2 → sur 10 ; collège/lycée → sur 20 ; maternelle → TS/S/PS. */
function baremesParDefaut() {
  const o = {};
  const primaire = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"];
  const liste = (typeof CLASSES_INIT !== "undefined" && CLASSES_INIT.length) ? CLASSES_INIT : [...primaire, "PS", "MS", "GS"];
  liste.forEach((cl) => {
    const c = String(cl || "");
    if (estClasseMaternelle(c)) o[c] = "niveaux";
    else {
      const base = c.toUpperCase().replace(/\s+/g, " ").trim().split(/[\s\-\/]/)[0] || "";
      o[c] = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"].includes(base) ? 10 : 20;
    }
  });
  return o;
}
function lireBaremes() {
  try {
    if (typeof window !== "undefined" && window.__cspBaremes && typeof window.__cspBaremes === "object") {
      return { ...baremesParDefaut(), ...window.__cspBaremes };
    }
  } catch (e) {}
  try {
    const brut = localStorage.getItem(CLE_BAREMES);
    if (brut) {
      const o = JSON.parse(brut);
      if (o && typeof o === "object") {
        try { if (typeof window !== "undefined") window.__cspBaremes = o; } catch (e2) {}
        return { ...baremesParDefaut(), ...o };
      }
    }
  } catch (e) {}
  return baremesParDefaut();
}
function ecrireBaremes(o) {
  try { if (typeof window !== "undefined") window.__cspBaremes = o || {}; } catch (e) {}
  try { localStorage.setItem(CLE_BAREMES, JSON.stringify(o || {})); } catch (e) {}
  try {
    if (typeof pgUpsert === "function" && typeof SUPABASE_CONFIGURE !== "undefined" && SUPABASE_CONFIGURE) {
      pgUpsert("codes_acces", [{ role: "_baremes", code: JSON.stringify(o || {}) }], "role").catch(() => {});
    }
  } catch (e) {}
}
/** true = évaluation TS/S/PS (maternelle type niveaux) */
function estEvaluationNiveaux(classe) {
  const baremes = lireBaremes();
  const c = String(classe || "").trim();
  const v = baremes[c] != null ? baremes[c] : baremes[c.toUpperCase()];
  if (v === "niveaux" || v === "TS" || v === "niveau") return true;
  if (v === 10 || v === 20 || v === "10" || v === "20" || (typeof v === "number" && v > 0)) return false;
  return estClasseMaternelle(classe);
}
/** Note maximale pour une classe (10, 20, ou autre nombre). null si niveaux. */
function noteSurMax(classe) {
  if (estEvaluationNiveaux(classe)) return null;
  const baremes = lireBaremes();
  const c = String(classe || "").trim();
  let v = baremes[c];
  if (v == null) {
    const base = c.toUpperCase().replace(/\s+/g, " ").trim().split(/[\s\-\/]/)[0] || "";
    v = baremes[base];
  }
  if (v === 10 || v === "10") return 10;
  if (v === 20 || v === "20") return 20;
  const n = Number(v);
  if (!isNaN(n) && n > 0) return n;
  // défaut historique
  const base = String(classe || "").toUpperCase().replace(/\s+/g, " ").trim().split(/[\s\-\/]/)[0] || "";
  if (["CI", "CP", "CE1", "CE2", "CM1", "CM2"].includes(base)) return 10;
  return 20;
}

/** Affiche une note avec le bon dénominateur (/10 primaire, /20 sinon). */
function formatNoteAffichee(note, classe) {
  if (note == null || note === "") return "—";
  if (estEvaluationNiveaux(classe)) {
    const niv = note20VersNiveau(note);
    return niv || String(note);
  }
  const max = noteSurMax(classe) || 20;
  return String(note) + "/" + max;
}

/** Mention en respectant le barème de la classe. */
/** Moyenne d'un élève (notes note20). null si aucune note. */
function moyenneEleve(eleve) {
  const notes = (eleve && eleve.notes) || [];
  const vals = notes.map((n) => Number(n && n.note20)).filter((v) => !isNaN(v));
  if (!vals.length) return null;
  const total = vals.reduce((s, v) => s + v, 0);
  return Math.round((total / vals.length) * 10) / 10;
}

/** Classement d'une classe : 1er, 2e… (égalité de moyenne = même rang). */
function classementClasse(eleves, classe) {
  const cible = normaliserClasse(classe);
  const liste = (eleves || []).filter((e) => e && normaliserClasse(e.classe) === cible);
  const rows = liste.map((e) => ({ eleve: e, moyenne: moyenneEleve(e) }));
  rows.sort((a, b) => {
    if (a.moyenne == null && b.moyenne == null) {
      return String(a.eleve.nom || "").localeCompare(String(b.eleve.nom || ""), "fr");
    }
    if (a.moyenne == null) return 1;
    if (b.moyenne == null) return -1;
    if (b.moyenne !== a.moyenne) return b.moyenne - a.moyenne;
    return String(a.eleve.nom || "").localeCompare(String(b.eleve.nom || ""), "fr");
  });
  let rang = 0;
  let prev = null;
  return rows.map((row, idx) => {
    if (row.moyenne == null) return { ...row, rang: null };
    if (prev === null || row.moyenne !== prev) rang = idx + 1;
    prev = row.moyenne;
    return { ...row, rang };
  });
}

/** Rang d'un élève dans sa classe (null si pas de notes / pas trouvé). */
function rangEleveDansClasse(eleves, eleve) {
  if (!eleve || !eleve.id) return null;
  const cl = classementClasse(eleves, eleve.classe);
  const f = cl.find((r) => String(r.eleve.id) === String(eleve.id));
  return f ? f.rang : null;
}

function ordinalRang(n) {
  if (n == null || n < 1) return "—";
  if (n === 1) return "1er";
  return n + "e";
}

function imprimerClassementClasse(classe, eleves, ecole) {
  const rows = classementClasse(eleves, classe);
  const maxN = noteSurMax(classe) || 20;
  const win = window.open("", "_blank");
  if (!win) { alert("Autorisez les pop-ups pour imprimer."); return; }
  const nomEcole = (ecole && (ecole.nom || ecole.nomComplet)) || "École";
  const lignes = rows.map((r) => {
    const e = r.eleve;
    const moy = r.moyenne != null ? r.moyenne + "/" + maxN : "—";
    const rg = r.rang != null ? ordinalRang(r.rang) : "—";
    return "<tr><td>" + echapperHtml(rg) + "</td><td>" + echapperHtml((e.nom || "") + " " + (e.prenom || "")) +
      "</td><td>" + echapperHtml(String(e.id || "")) + "</td><td>" + echapperHtml(moy) + "</td></tr>";
  }).join("");
  win.document.write("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Classement " + echapperHtml(classe) +
    "</title><style>body{font-family:serif;padding:24px;color:#1B2A4A}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:13px}th{background:#1B2A4A;color:#fff}</style></head><body>" +
    "<h1>" + echapperHtml(nomEcole) + "</h1><h2>Classement — classe " + echapperHtml(classe) + "</h2>" +
    "<p style='font-size:12px'>Moyenne sur " + maxN + " · " + new Date().toLocaleDateString("fr-FR") + "</p>" +
    "<table><thead><tr><th>Rang</th><th>Nom</th><th>Code</th><th>Moyenne</th></tr></thead><tbody>" +
    lignes + "</tbody></table></body></html>");
  win.document.close();
  try { win.focus(); win.print(); } catch (e) {}
}


function mentionPourNote(note, classe) {
  if (estEvaluationNiveaux(classe)) return libelleNiveau(note) || "";
  const v = Number(note);
  if (isNaN(v)) return "";
  const max = noteSurMax(classe) || 20;
  // Ramener sur 20 pour les seuils de mention
  const sur20 = max === 20 ? v : (v / max) * 20;
  return mentionPour(sur20);
}
function libelleNiveau(codeOuNote) {
  const code = note20VersNiveau(codeOuNote);
  const f = NIVEAUX_MATERNELLE.find((x) => x.code === code);
  return f ? `${f.emoji} ${f.code}` : (codeOuNote != null && codeOuNote !== "" ? String(codeOuNote) : "—");
}

const MATIERES_MATERNELLE_INIT = [
  { nom: "Éducation pour la santé", coef: 1 },
  { nom: "Éducation à des réflexes de santé", coef: 1 },
  { nom: "Éducation du mouvement", coef: 1 },
  { nom: "Gestuelle", coef: 1 },
  { nom: "Rythmique", coef: 1 },
  { nom: "Observation", coef: 1 },
  { nom: "Éducation sensorielle", coef: 1 },
  { nom: "Pré-lecture", coef: 1 },
  { nom: "Pré-écriture", coef: 1 },
  { nom: "Pré-mathématique", coef: 1 },
  { nom: "Expression plastique", coef: 1 },
  { nom: "Expression émotionnelle", coef: 1 },
  { nom: "Langage", coef: 1 },
  { nom: "Conte", coef: 1 },
  { nom: "Comptine", coef: 1 },
  { nom: "Poésie", coef: 1 },
  { nom: "Chant", coef: 1 },
];

const MATIERES_PAR_CLASSE_INIT = {
  "Maternelle 1": MATIERES_MATERNELLE_INIT,
  "Maternelle 2": MATIERES_MATERNELLE_INIT,
  CM1: MATIERES_INIT,
};

const EMPLOI_INIT = {
  "CM1": [
    { jour: "Lundi", creneau: "08h-10h", matiere: "Lecture", enseignant: "" },
  ]
};

function genererBulletinPDF(enfant, ecole, moyenne) {
  const win = window.open("", "_blank");
  if (!win) { alert("Autorise les popups pour télécharger le bulletin"); return; }
  const maxN = estEvaluationNiveaux(enfant && enfant.classe) ? null : (noteSurMax(enfant && enfant.classe) || 20);
  const libNote = (n) => {
    if (estEvaluationNiveaux(enfant && enfant.classe)) return libelleNiveau(n.niveau || n.note20) || String(n.note20 ?? "");
    return `${n.note20}/${maxN}`;
  };
  // Une seule ligne par matière + évaluation + mois (évite les doublons sur le PDF)
  const notesUniques = Array.from(new Map(
    dedupeNotes(enfant.notes || []).map((n) => {
      const k = `${String(n.matiere || "").trim().toLowerCase()}||${String(n.evaluation || "").trim().toLowerCase()}||${String(n.mois || "").trim().toLowerCase()}`;
      return [k, n];
    })
  ).values());
  const groupes = grouperNotesParEvaluation(notesUniques);
  let notesHtml = "";
  if (!groupes.length) {
    notesHtml = "<p>Aucune note</p>";
  } else {
    groupes.forEach((grp) => {
      const rows = grp.liste.map((n) =>
        `<tr><td>${n.matiere || ""}</td><td>${n.mois || ""}</td><td>${libNote(n)}</td><td>${mentionPourNote(n.note20, enfant.classe)}</td></tr>`
      ).join("");
      notesHtml += `<h4 style="margin:14px 0 6px;color:#1B2A4A">${grp.evaluation}${grp.moy != null ? (maxN ? ` — moyenne ${grp.moy}/${maxN}` : ` — bilan ${libelleNiveau(grp.moy) || grp.moy}`) : ""}</h4>
        <table><tr><th>Matière</th><th>Mois</th><th>Note</th><th>Mention</th></tr>${rows}</table>`;
    });
  }
  const moyCalc = notesUniques.length
    ? Math.round((notesUniques.reduce((s, n) => s + Number(n.note20 || 0), 0) / notesUniques.length) * 10) / 10
    : moyenne;
  const fraisUniques = Array.from(new Map(
    (enfant.frais || []).map((f) => [String(f.libelle || "").trim().toLowerCase(), f])
  ).values());
  const fraisRows = fraisUniques.map((f) =>
    `<tr><td>${f.libelle}</td><td>${f.du} F</td><td>${f.paye} F</td><td>${Math.max(0, Number(f.du) - Number(f.paye))} F</td></tr>`
  ).join("");
  const absUniques = Array.from(new Map(
    (enfant.absences || []).map((a) => [`${a.date}||${a.type}||${a.motif || ""}`, a])
  ).values());
  const abs = absUniques.map((a) =>
    `<tr><td>${a.date}</td><td>${a.type}</td><td>${a.motif || ""}</td></tr>`
  ).join("") || "<tr><td colspan=3>Aucune</td></tr>";
  win.document.write(`
    <html><head><title>Bulletin ${echapperHtml(enfant.prenom)} ${echapperHtml(enfant.nom)}</title>
    <style>body{font-family:Arial;padding:20px;color:#1B2A4A} h1{color:#1B2A4A} table{width:100%;border-collapse:collapse;margin:10px 0} th,td{border:1px solid #ccc;padding:8px;text-align:left} th{background:#1B2A4A;color:white} .header{text-align:center;margin-bottom:20px;border-bottom:2px solid #C9A227;padding-bottom:15px}</style>
    </head><body>
    <div class="header"><h1>${echapperHtml(ecole.sigle || "")} - ${echapperHtml(ecole.nom || "")}</h1><p>${echapperHtml(ecole.quartier || "")} - ${echapperHtml(ecole.commune || "")}, ${echapperHtml(ecole.departement || "")}</p><h2>Bulletin Scolaire${ecole.devise ? " - " + echapperHtml(ecole.devise) : ""}</h2><p>Élève: <b>${echapperHtml(enfant.prenom)} ${echapperHtml(enfant.nom)}</b> | Classe: ${echapperHtml(enfant.classe)} | Code: ${echapperHtml(enfant.id)} | Naissance: ${echapperHtml(enfant.naissance || "—")}</p>${enfant.decision ? `<p style="margin-top:8px;padding:8px;background:#F8F4EA;border:1px solid #C9A227"><b>Décision de fin d'année :</b> ${echapperHtml(enfant.decision)}</p>` : ""}</div>
    <h3>Notes et évaluations</h3>
    ${notesHtml}
    <p><strong>Moyenne / bilan: ${moyCalc != null ? (maxN ? moyCalc + "/" + maxN : (libelleNiveau(moyCalc) || moyCalc)) : "—"} - ${moyCalc != null ? mentionPourNote(moyCalc, enfant.classe) : "Non calculée"}</strong></p>
    <h3>Absences</h3><table><tr><th>Date</th><th>Type</th><th>Motif</th></tr>${abs}</table>
    <h3>Situation financière</h3><table><tr><th>Frais</th><th>Dû</th><th>Payé</th><th>Reste</th></tr>${fraisRows || "<tr><td colspan=4>Aucun frais</td></tr>"}</table>
    <br><p style="text-align:right">Fait à ${echapperHtml(ecole.commune || "")}, le ${new Date().toLocaleDateString("fr-FR")}</p><p style="text-align:right">Le Directeur<br>${echapperHtml(ecole.directeur || "")}<br><br>___________________<br>Signature & Cachet</p>
    <script>window.print()</script></body></html>
  `);
  win.document.close();
}

/** Reçu de paiement — même principe que le bulletin : ouverture + impression / enregistrement PDF. */
function genererRecuPaiement({ ecole, eleve, lignes, mode, modeSaisie, totalMouvement }) {
  const now = new Date();
  const numRecu = "RECU-" + now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "-" + String(eleve.id || "").replace(/[^A-Za-z0-9]/g, "").slice(-6) + "-" + String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0");
  const rows = (lignes || []).map((l) =>
    "<tr><td>" + echapperHtml(l.libelle || "") + "</td>" +
    "<td style='text-align:right'>" + Number(l.ancien || 0).toLocaleString("fr-FR") + " F</td>" +
    "<td style='text-align:right'>" + Number(l.mouvement || 0).toLocaleString("fr-FR") + " F</td>" +
    "<td style='text-align:right'><b>" + Number(l.nouveau || 0).toLocaleString("fr-FR") + " F</b></td>" +
    "<td style='text-align:right'>" + Number(l.reste || 0).toLocaleString("fr-FR") + " F</td></tr>"
  ).join("");
  const titre = modeSaisie === "corriger" ? "REÇU — CORRECTION DE PAIEMENT" : "REÇU DE PAIEMENT";
  const html = "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>" + numRecu + "</title>" +
    "<style>body{font-family:Georgia,serif;padding:24px;color:#1B2A4A;max-width:720px;margin:0 auto}" +
    "h1{font-size:20px;margin:0 0 4px;text-align:center}h2{font-size:16px;margin:12px 0 8px;text-align:center;color:#8A6D14}" +
    ".meta{font-size:13px;text-align:center;color:#5C5240;margin-bottom:16px}" +
    "table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}" +
    "th,td{border:1px solid #E7DEC8;padding:8px}th{background:#F8F4EA;text-align:left}" +
    ".box{border:1px solid #E7DEC8;border-radius:8px;padding:12px;margin-top:12px}" +
    ".total{font-size:16px;font-weight:bold;margin-top:12px;text-align:right}" +
    ".foot{margin-top:28px;display:flex;justify-content:space-between;font-size:13px}" +
    "@media print{.noprint{display:none}}</style></head><body>" +
    "<h1>" + ((ecole && ecole.nom) || "École") + "</h1>" +
    "<div class='meta'>" + ((ecole && ecole.sigle) || "") + " · " + ((ecole && ecole.quartier) || "") + " · " + ((ecole && ecole.commune) || "") +
    "<br/>Tél. " + ((ecole && ecole.telephone) || "—") + " · " + ((ecole && ecole.email) || "") + "</div>" +
    "<h2>" + titre + "</h2>" +
    "<div class='meta'>N° <b>" + numRecu + "</b><br/>Date : " + now.toLocaleString("fr-FR") + "</div>" +
    "<div class='box'><div><b>Élève :</b> " + echapperHtml(eleve.prenom || "") + " " + echapperHtml(eleve.nom || "") + "</div>" +
    "<div><b>Code :</b> " + (eleve.id || "—") + " · <b>Classe :</b> " + (eleve.classe || "—") + "</div>" +
    "<div><b>Parent / parrain :</b> " + ((eleve.parent && eleve.parent.nom) || "—") + " · " + ((eleve.parent && eleve.parent.telephone) || "") + "</div>" +
    "<div><b>Mode de paiement :</b> " + (mode || "—") + "</div></div>" +
    "<table><thead><tr><th>Rubrique</th><th>Payé avant</th><th>Ce mouvement</th><th>Payé après</th><th>Reste</th></tr></thead>" +
    "<tbody>" + (rows || "<tr><td colspan='5'>Aucune ligne</td></tr>") + "</tbody></table>" +
    "<div class='total'>Total de ce reçu : " + Number(totalMouvement || 0).toLocaleString("fr-FR") + " FCFA</div>" +
    "<p style='font-size:12px;color:#5C5240;margin-top:12px'>Ce reçu atteste de l'enregistrement du paiement dans le système de l'école. Conservez-le comme preuve.</p>" +
    "<div class='foot'><div>Secrétariat<br/><br/>_________________<br/>Signature</div>" +
    "<div style='text-align:right'>Direction<br/>" + ((ecole && ecole.directeur) || "") + "<br/><br/>_________________<br/>Signature & cachet</div></div>" +
    "<p class='noprint' style='text-align:center;margin-top:20px'><button onclick='window.print()' style='padding:10px 18px;font-size:14px;cursor:pointer'>Imprimer / Enregistrer en PDF</button></p>" +
    "<script>setTimeout(function(){ try{ window.print(); }catch(e){} }, 500);</script></body></html>";

  // 1) Même méthode que le bulletin : ouvrir une page puis Imprimer / PDF
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    // 2) Si bloqué : téléchargement direct du fichier HTML (comme un fichier)
    try {
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = numRecu + ".html";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    } catch (e) {
      alert("Impossible d'ouvrir le reçu. Réessaie ou autorise l'ouverture de page pour ce site.");
    }
  }
  try { journaliser("Reçu émis " + numRecu + " — " + echapperHtml(eleve.prenom || "") + " " + (eleve.nom || ""), "secretaire"); } catch (e) {}
}

function EmploiForm({ classe }) {
  const { emploiDuTemps, setEmploiDuTemps } = useEcole();
  const [form, setForm] = React.useState({ jour: "Lundi", creneau: "08h-10h", matiere: "", enseignant: "" });
  const jours = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  return (
    <div className="mt-2 flex flex-wrap gap-2 rounded-lg px-3 py-2" style={{background:"#F1ECDD"}}>
      <select value={form.jour} onChange={e=>setForm({...form, jour:e.target.value})} className="rounded border px-2 py-1 text-[13px]" style={{borderColor:"#E7DEC8"}}>
        {jours.map(j=><option key={j} value={j}>{j}</option>)}
      </select>
      <input value={form.creneau} onChange={e=>setForm({...form, creneau:e.target.value})} placeholder="08h-10h" className="w-20 rounded border px-2 py-1 text-[13px]" style={{borderColor:"#E7DEC8"}}/>
      <input value={form.matiere} onChange={e=>setForm({...form, matiere:e.target.value})} placeholder="Matière" className="flex-1 min-w-[90px] rounded border px-2 py-1 text-[13px]" style={{borderColor:"#E7DEC8"}}/>
      <input value={form.enseignant} onChange={e=>setForm({...form, enseignant:e.target.value})} placeholder="Enseignant (optionnel)" className="w-28 rounded border px-2 py-1 text-[13px]" style={{borderColor:"#E7DEC8"}}/>
      <button onClick={()=>{
        if(!form.matiere.trim()) return;
        setEmploiDuTemps(prev=>({...prev, [classe]: [...(prev[classe]||[]), {...form, matiere:form.matiere.trim()}] }));
        setForm({ jour: "Lundi", creneau: "08h-10h", matiere: "", enseignant: "" });
      }} className="rounded-full px-3 py-1 text-[12px] font-bold" style={{background:"#1B2A4A", color:"#FAF6EE"}}>+ Ajouter</button>
    </div>
  );
}



const SEUILS_MENTION = [
  { max: 5, mention: "Médiocre" },
  { max: 9, mention: "Insuffisant" },
  { max: 11, mention: "Passable" },
  { max: 13, mention: "Assez Bien" },
  { max: 15, mention: "Bien" },
  { max: 18, mention: "Très Bien" },
  { max: 20, mention: "Excellent" },
];

function mentionPour(moyenne) {
  const seuil = SEUILS_MENTION.find((s) => moyenne <= s.max);
  return seuil ? seuil.mention : "Excellent";
}

function ageDepuis(dateNaissance) {
  if (!dateNaissance) return null;
  const naissance = new Date(dateNaissance);
  if (isNaN(naissance)) return null;
  const aujourdhui = new Date();
  let age = aujourdhui.getFullYear() - naissance.getFullYear();
  const pasEncoreAnniversaire =
    aujourdhui.getMonth() < naissance.getMonth() ||
    (aujourdhui.getMonth() === naissance.getMonth() && aujourdhui.getDate() < naissance.getDate());
  if (pasEncoreAnniversaire) age -= 1;
  return age >= 0 ? age : null;
}

/* Code élève : toujours préfixé CSP, suivi de 4 caractères mélangeant
   chiffres et lettres (majuscules) — plus difficile à deviner qu'une
   simple suite de 4 chiffres. Ex. CSP7K2B. */
/* Formate la date du jour en français, ex. "26 août 2026" — utilisé pour
   horodater automatiquement la saisie d'une note. */

/** Regroupe les notes par nom d'évaluation (puis mois) pour affichage pliable */
function grouperNotesParEvaluation(notes) {
  const map = new Map();
  (notes || []).forEach((n, indexOriginal) => {
    const ev = (n.evaluation || "Sans titre").trim() || "Sans titre";
    if (!map.has(ev)) map.set(ev, []);
    map.get(ev).push({ ...n, indexOriginal });
  });
  return Array.from(map.entries()).map(([evaluation, liste]) => {
    const mois = [...new Set(liste.map((x) => x.mois).filter(Boolean))];
    const moy = liste.length
      ? Math.round((liste.reduce((s, x) => s + Number(x.note20 || 0), 0) / liste.length) * 10) / 10
      : null;
    return { evaluation, mois, liste, moy };
  });
}


/** Liste des propositions de passage (survit à la clôture d'année). */
function lirePassages() {
  try {
    const a = JSON.parse(localStorage.getItem("csp_sagesse_divine_passages") || "[]");
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function ecrirePassages(liste) {
  try { localStorage.setItem("csp_sagesse_divine_passages", JSON.stringify((liste || []).slice(0, 2000))); } catch (e) {}
  try {
    if (typeof pgUpsert === "function" && typeof SUPABASE_CONFIGURE !== "undefined" && SUPABASE_CONFIGURE) {
      pgUpsert("codes_acces", [{ role: "_passages", code: JSON.stringify((liste || []).slice(0, 1500)) }], "role").catch(() => {});
    }
  } catch (e) {}
}

/** Valide des passages : nouveau code élève + classe supérieure. Ancien code invalidé. */
function appliquerValidationPassages(propositions, elevesPrev) {
  const prev = Array.isArray(elevesPrev) ? elevesPrev : [];
  const codesPris = prev.map((e) => e && e.id).filter(Boolean);
  const anciensIds = [];
  const map = new Map(prev.map((e) => [String(e.id), { ...e }]));
  const resultats = [];
  (propositions || []).forEach((p) => {
    const ancienId = String(p.eleveId || p.code || "");
    if (!ancienId) return;
    const nouveauCode = genererCodeEleve(codesPris);
    codesPris.push(nouveauCode);
    const existant = map.get(ancienId);
    const base = existant || {
      id: ancienId,
      nom: p.nom,
      prenom: p.prenom,
      sexe: p.sexe,
      naissance: p.naissance,
      parent: p.parent,
      frais: [],
      messages: [],
    };
    map.delete(ancienId);
    anciensIds.push(ancienId);
    map.set(String(nouveauCode), {
      ...base,
      id: nouveauCode,
      code: nouveauCode,
      classe: p.versClasse || base.classe,
      decision: "passe",
      notes: [],
      absences: [],
      messages: [],
      // frais: repartir à zéro pour la nouvelle année / classe
      frais: [],
      ancienCode: ancienId,
    });
    resultats.push({
      ...p,
      statut: "valide",
      dateValidation: new Date().toISOString(),
      ancienCode: ancienId,
      nouveauCode,
      eleveId: nouveauCode,
      code: nouveauCode,
    });
  });
  // Invalider les anciens codes (liste noire + suppression base au prochain sync)
  try {
    const bans = [...new Set([...(lireElevesSupprimes() || []).map(String), ...anciensIds])];
    ecrireElevesSupprimes(bans);
  } catch (e) {}
  return { eleves: Array.from(map.values()), resultats, anciensIds };
}

function proposerPassage(eleve, classes) {
  if (!eleve || !eleve.id) return null;
  const vers = classeSuivante(classes, eleve.classe) || eleve.classe;
  return {
    id: "pass-" + String(eleve.id),
    eleveId: eleve.id,
    nom: eleve.nom || "",
    prenom: eleve.prenom || "",
    code: eleve.code || eleve.id || "",
    deClasse: eleve.classe || "",
    versClasse: vers,
    sexe: eleve.sexe || null,
    naissance: eleve.naissance || null,
    parent: eleve.parent || null,
    statut: "propose", // propose | valide | refuse
    proposePar: "enseignant",
    dateProposition: new Date().toISOString(),
  };
}

function classeSuivante(classes, classeActuelle) {
  const i = (classes || []).indexOf(classeActuelle);
  if (i < 0 || i >= classes.length - 1) return null;
  return classes[i + 1];
}

function horodatageMsg() {
  try {
    return new Date().toLocaleString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch (e) {
    return String(Date.now());
  }
}

function formatDateFr() {
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const d = new Date();
  return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
}


/** Recherche un élève par code (id), en local puis en base — pour l'espace Parent. */
async function trouverEleveParCode(codeSaisi, elevesLocaux = []) {
  const brut = String(codeSaisi || "").trim();
  if (!brut) return null;
  const variantes = [...new Set([
    brut,
    brut.toUpperCase(),
    brut.toLowerCase(),
    brut.replace(/\s+/g, ""),
    brut.toUpperCase().replace(/\s+/g, ""),
  ])];
  // 1) Instantané : mémoire locale
  for (const v of variantes) {
    const local = (elevesLocaux || []).find((e) => e && String(e.id || "").toLowerCase() === v.toLowerCase());
    if (local) return local;
  }
  if (!SUPABASE_CONFIGURE) return null;
  // 2) Base : une seule requête, délai max 2,5 s (pas de lenteur sur code faux)
  const v = variantes[0];
  try {
    const requete = pgSelect("eleves", "&id=eq." + encodeURIComponent(v));
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 2500));
    const rows = await Promise.race([requete, timeout]);
    if (rows && rows.length && rows[0] && rows[0].id) {
      const r = rows[0];
      return {
        id: r.id,
        prenom: r.prenom,
        nom: r.nom,
        classe: r.classe,
        sexe: r.sexe,
        naissance: r.naissance,
        enseignant: r.enseignant,
        decision: r.decision,
        parent: r.parrain_nom ? { nom: r.parrain_nom, telephone: r.parrain_tel } : null,
        photoUrl: r.photo_url || null,
        notes: [],
        absences: [],
        frais: [],
        messages: [],
        accesParentBloque: !!r.acces_parent_bloque,
      };
    }
  } catch (e) {
    console.warn("trouverEleveParCode", v, e);
  }
  return null;
}


function genererCodeEleve(codesExistants = []) {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I pour éviter les confusions
  const pris = new Set((codesExistants || []).map((c) => String(c || "").toUpperCase()));
  const aleatoire = (n) => {
    let s = "";
    try {
      const tab = new Uint32Array(n);
      crypto.getRandomValues(tab); // aléatoire cryptographique (32 est un diviseur de 2^32 : pas de biais)
      for (let i = 0; i < n; i++) s += caracteres[tab[i] % caracteres.length];
    } catch (e) {
      s = "";
      for (let i = 0; i < n; i++) s += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    return s;
  };
  for (let essai = 0; essai < 80; essai++) {
    const code = `CSP${aleatoire(8)}`; // 8 caractères : impossible à deviner
    if (!pris.has(code.toUpperCase())) return code;
  }
  return `CSP${aleatoire(8)}`;
}

/** Génère un code enseignant pour une classe. */
function genererCodeEnseignantClasse(classe) {
  const base = String(classe || "CLASSE").replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "CLASSE";
  return `ENS-${base}-${1000 + Math.floor(Math.random() * 9000)}`;
}

/** Garantit un code non vide pour chaque classe. */
function completerCodesEnseignants(codesObj, listeClasses) {
  const c = { ...(codesObj || {}) };
  let map = c.enseignants;
  if (typeof map === "string") {
    try { map = JSON.parse(map); } catch (e) { map = {}; }
  }
  map = { ...(map && typeof map === "object" ? map : {}) };
  (listeClasses || []).forEach((cls) => {
    if (!map[cls] || !String(map[cls]).trim()) map[cls] = genererCodeEnseignantClasse(cls);
  });
  c.enseignants = map;
  return c;
}

const ELEVES_INIT = [
  {
    id: "CSP0142",
    nom: "Adjovi",
    prenom: "Grâce",
    classe: "CM1",
    naissance: "12/04/2015",
    notes: [
      { evaluation: "Évaluation 1", mois: "Septembre", matiere: "Expression écrite", note20: 16, dateSaisie: "13 août 2026" },
      { evaluation: "Évaluation 1", mois: "Septembre", matiere: "Lecture", note20: 14, dateSaisie: "13 août 2026" },
      { evaluation: "Devoir 1", mois: "Octobre", matiere: "Dictée", note20: 12, dateSaisie: "14 août 2026" },
    ],
    absences: [
      { date: "11 août 2026", type: "Permissionnaire", motif: "Cérémonie familiale" },
      { date: "02 sept. 2026", type: "Malade", motif: "Paludisme" },
    ],
    frais: [
      { libelle: "Inscription", du: 25000, paye: 25000 },
      { libelle: "Écolage", du: 90000, paye: 60000 },
      { libelle: "Cantine", du: 20000, paye: 10000 },
      { libelle: "Uniforme", du: 15000, paye: 15000 },
    ],
    messages: [
      { auteur: "École", texte: "Réunion de parents le 5 septembre à 9h.", date: "30 août 2026" },
    ],
    parent: { nom: "M. et Mme Adjovi", telephone: "97 00 00 00" },
    enseignant: "Mme Houssou",
  },
  {
    id: "CSP0198",
    nom: "Toko",
    prenom: "Emmanuel",
    classe: "CM1",
    naissance: "03/11/2014",
    notes: [
      { evaluation: "Évaluation 1", mois: "Septembre", matiere: "Expression écrite", note20: 10, dateSaisie: "13 août 2026" },
      { evaluation: "Évaluation 1", mois: "Septembre", matiere: "Lecture", note20: 9, dateSaisie: "13 août 2026" },
    ],
    absences: [],
    frais: [
      { libelle: "Inscription", du: 25000, paye: 25000 },
      { libelle: "Écolage", du: 90000, paye: 30000 },
    ],
    messages: [],
    parent: { nom: "M. Toko", telephone: "96 00 00 00" },
    enseignant: "Mme Houssou",
  },
];

const PERSONNEL_INIT = [
  { nom: "Past. A. S. Boko", poste: "Directeur", telephone: "97 11 22 33", classe: "—" },
  { nom: "Mme Houssou", poste: "Enseignante", telephone: "96 22 33 44", classe: "CM1" },
  { nom: "Mlle Dossou", poste: "Secrétaire", telephone: "95 33 44 55", classe: "—" },
];

const DEMANDES_INIT = [
  {
    id: "DEM-0007",
    prenom: "Nadège",
    nom: "Kora",
    sexe: "F",
    naissance: "2016-02-18",
    classeSouhaitee: "CE1",
    parrainNom: "Mme Kora",
    parrainTelephone: "94 55 66 77",
    message: "Nous déménageons à Tchaourou ce mois-ci.",
    origine: "en_ligne",
    date: "23 août 2026",
    statut: "en_attente",
  },
];

const ANNONCES_INIT = [
  { titre: "Congés de Noël", texte: "Les congés de Noël débutent le 20 décembre.", date: "24 août 2026" },
  { titre: "Réunion des parents", texte: "Réunion générale le 5 septembre à 9h.", date: "22 août 2026" },
];

/* ------------------------------------------------------------------
   PALETTE — voir plan de design
   Ardoise #1B2A4A · Or #C9A227 · Papier #FAF6EE · Encre #2B2118 · Vert #2F5233
------------------------------------------------------------------- */

const ROLES = [
  { id: "fondateur", label: "Espace Fondateur", sub: "Contrôle total", icon: ShieldCheck, desc: "Codes & archives" },
  { id: "directeur", label: "Espace Administratif", sub: "Direction", icon: ShieldCheck, desc: "Gestion" },
  { id: "enseignant", label: "Enseignant", sub: "Ma classe", icon: GraduationCap, desc: "Notes" },
  { id: "secretaire", label: "Secrétaire", sub: "Inscriptions", icon: ClipboardList, desc: "Frais" },
  { id: "parent", label: "Espace Parent", sub: "Mon enfant", icon: User, desc: "Suivi" },
];

const CLE_PHOTOS_ELEVES = "csp_sagesse_divine_photos_eleves";
function lirePhotosEleves() {
  try {
    const o = JSON.parse(localStorage.getItem(CLE_PHOTOS_ELEVES) || "{}");
    return o && typeof o === "object" && !Array.isArray(o) ? o : {};
  } catch (e) { return {}; }
}
function ecrirePhotoEleve(id, dataUrl) {
  try {
    const o = lirePhotosEleves();
    const k = String(id);
    if (dataUrl) o[k] = dataUrl;
    else delete o[k];
    localStorage.setItem(CLE_PHOTOS_ELEVES, JSON.stringify(o));
  } catch (e) {}
}
function appliquerPhotosLocales(liste) {
  const photos = lirePhotosEleves();
  return (liste || []).map((e) => {
    if (!e || !e.id) return e;
    const fromState = e.photoUrl || null;
    const fromStore = photos[String(e.id)] || null;
    const photoUrl = fromState || fromStore || null;
    if (fromState && fromState !== fromStore) ecrirePhotoEleve(e.id, fromState);
    return { ...e, photoUrl: photoUrl || null };
  });
}
function compresserPhotoEleve(fichier) {
  return new Promise((resolve, reject) => {
    try {
      const lecteur = new FileReader();
      lecteur.onload = () => {
        // IMPORTANT: ne pas utiliser new Image() — "Image" est l'icône lucide-react
        const img = document.createElement("img");
        img.onload = () => {
          const max = 96;
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (!w || !h) { reject(new Error("dimensions")); return; }
          if (w > max || h > max) {
            if (w > h) { h = Math.round(h * max / w); w = max; }
            else { w = Math.round(w * max / h); h = max; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("canvas")); return; }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.55));
        };
        img.onerror = () => reject(new Error("img"));
        img.src = String(lecteur.result || "");
      };
      lecteur.onerror = () => reject(new Error("file"));
      lecteur.readAsDataURL(fichier);
    } catch (e) { reject(e); }
  });
}
/** Envoie la photo en base (colonne photo_url). Échoue silencieusement si la colonne n'existe pas. */
async function sauvegarderPhotoEleveEnBase(eleveId, dataUrl) {
  if (!SUPABASE_CONFIGURE || !eleveId || !dataUrl) return false;
  try {
    await pgFetch(`/eleves?id=eq.${encodeURIComponent(String(eleveId))}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal", "Content-Type": "application/json" },
      body: JSON.stringify({ photo_url: dataUrl }),
    });
    return true;
  } catch (e) {
    console.warn("Photo non enregistrée en base (ajoute la colonne photo_url) :", e);
    return false;
  }
}
function Embleme({ logoUrl, taille = 56, iconTaille = 26 }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo de l'école"
        className="rounded-full object-cover"
        style={{ width: taille, height: taille, background: "#1B2A4A" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  return (
    <div className="flex items-center justify-center rounded-full" style={{ width: taille, height: taille, background: "#1B2A4A" }}>
      <School size={iconTaille} color="#C9A227" />
    </div>
  );
}

function Cachet() {
  return (
    <div className="pointer-events-none absolute -right-3 -top-3 rotate-12 opacity-90">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-dashed"
           style={{ borderColor: "#C9A227", color: "#C9A227" }}>
        <Award size={22} />
      </div>
    </div>
  );
}

function Badge({ children, tone = "or" }) {
  const tones = {
    or: { bg: "linear-gradient(135deg, #FEF3C7, #FBBF24)", fg: "#78350F", ring: "#D97706" },
    vert: { bg: "linear-gradient(135deg, #BBF7D0, #22C55E)", fg: "#14532D", ring: "#16A34A" },
    ardoise: { bg: "linear-gradient(135deg, #E8EEF7, #94A3B8)", fg: "#1B2A4A", ring: "#1B2A4A" },
  };
  const t = tones[tone] || tones.or;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-bold shadow-sm"
      style={{ background: t.bg, color: t.fg, boxShadow: `inset 0 0 0 1px ${t.ring}55` }}
    >
      {children}
    </span>
  );
}

function Panel({ title, icon: Icon, actions, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border shadow-md" style={{ borderColor: "#E8D5B5", background: "linear-gradient(180deg, #FFFDF9 0%, #FFFFFF 100%)" }}>
      <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "#BBF7D0", background: "linear-gradient(90deg, #14532D 0%, #16A34A 50%, #CA8A04 100%)" }}>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={17} style={{ color: "#FEF3C7" }} />}
          <h3 className="font-serif text-[15px] font-semibold tracking-wide" style={{ color: "#FFFBEB" }}>{title}</h3>
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const tones = { ardoise: "#1B2A4A", or: "#B45309", vert: "#14532D" };
  const bg = {
    ardoise: "linear-gradient(145deg, #EEF2FF 0%, #94A3B8 100%)",
    or: "linear-gradient(145deg, #FFFBEB 0%, #FBBF24 100%)",
    vert: "linear-gradient(145deg, #F0FDF4 0%, #22C55E 100%)",
  };
  return (
    <div className="rounded-2xl px-4 py-3.5 shadow-md border" style={{ background: bg[tone] || bg.or, borderColor: "#E7D5B8" }}>
      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#78716C" }}>{label}</div>
      <div className="mt-1 font-serif text-2xl font-bold" style={{ color: tones[tone] || "#92400E" }}>{value}</div>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", icon: Icon, small }) {
  const base = "inline-flex items-center gap-1.5 rounded-xl font-semibold transition shadow-sm";
  const size = small ? "px-2.5 py-1 text-[13px]" : "px-3.5 py-2 text-[15px]";
  const styles = {
    primary: { background: "linear-gradient(135deg, #14532D 0%, #16A34A 100%)", color: "#F0FDF4" },
    gold: { background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", color: "#1C1917" },
    ghost: { background: "rgba(255,255,255,0.95)", color: "#14532D", boxShadow: "inset 0 0 0 1.5px #16A34A88" },
    danger: { background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)", color: "#FFFFFF" },
  };
  return (
    <button onClick={onClick} className={`${base} ${size} hover:brightness-110 active:scale-[0.98]`} style={styles[variant] || styles.primary}>
      {Icon && <Icon size={small ? 13 : 15} />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------
   ÉCRAN DE CONNEXION
------------------------------------------------------------------- */

function Connexion({ onEntrer, onInscription, eleves, setEleves, annonces = [], rolesBloques = {} }) {
  const [choix, setChoix] = useState(null);
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [groupePersonnel, setGroupePersonnel] = useState(false);
  const [accesPersonnelOk, setAccesPersonnelOk] = useState(false);
  const [codeGroupePersonnel, setCodeGroupePersonnel] = useState("");
  const [erreurGroupe, setErreurGroupe] = useState("");
  const { ecole, codes, classes } = useEcole();
  const codeGroupeAttendu = String(
    (codes && (codes.groupe_personnel || codes.groupePersonnel)) || CODE_GROUPE_PERSONNEL_DEFAUT
  ).trim();
  const zoneCodeRef = useRef(null);
  const ROLES_PERSONNEL = ROLES.filter((r) => r.id !== "parent");
  const ROLE_PARENT = ROLES.find((r) => r.id === "parent");

  useEffect(() => {
    if (choix && zoneCodeRef.current) {
      zoneCodeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [choix]);

  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    if (enCours) return;
    const saisie = code.trim();
    if (!saisie) { setErreur("Merci de saisir ton code d'accès."); return; }
    if (!choix) { setErreur("Choisissez d'abord un espace."); return; }
    if (choix !== "parent" && rolesBloques && rolesBloques[choix]) {
      setErreur("Code incorrect.");
      return;
    }
    // Plateforme fermée par le fondateur : seul le fondateur entre
    if (choix !== "fondateur" && !lirePlateformeActive()) {
      const msgM = lireMessageMaintenance();
      setErreur(msgM ? msgM : "Code incorrect.");
      try { journaliser("Accès refusé — plateforme fermée", choix, { espace: choix, reussi: false, detail: "plateforme déconnectée" }); } catch (e) {}
      return;
    }
    setEnCours(true);
    setErreur("");

    const entrerLocal = (role, extra) => {
      try {
        definirSession({
          ok: true,
          role,
          token: "local-" + role + "-" + Date.now(),
          eleve_id: role === "parent" ? extra : null,
          classe: role === "enseignant" ? extra : null,
        });
      } catch (e) {}
      try {
        const det = role === "parent" ? ("élève " + (extra || "")) : (role === "enseignant" ? ("classe " + (extra || "")) : "");
        journaliser("Connexion réussie — " + role + (det ? " (" + det + ")" : ""), role, { espace: role, reussi: true, detail: det });
      } catch (e) {}
      onEntrer(role, extra);
    };

    const essayerCodesLocaux = async () => {
      // Parent : code = id élève (local OU base Supabase)
      if (choix === "parent") {
        const enfant = await trouverEleveParCode(saisie, eleves || []);
        if (enfant && enfant.id) {
          if (enfant.accesParentBloque) {
            setErreur("Accès temporairement suspendu. Contactez l'école.");
            return false;
          }
          // Injecte l'élève pour éviter la page blanche si la liste n'est pas encore chargée
          try {
            if (typeof setEleves === "function") {
              setEleves((prev) => {
                const liste = Array.isArray(prev) ? prev : [];
                if (liste.some((e) => String(e.id).toLowerCase() === String(enfant.id).toLowerCase())) return liste;
                return [...liste, { ...enfant, notes: enfant.notes || [], absences: enfant.absences || [], frais: enfant.frais || [], messages: enfant.messages || [] }];
              });
            }
          } catch (e) {}
          entrerLocal("parent", enfant.id);
          return true;
        }
        return false;
      }
      // Enseignant : code général ou code par classe
      if (choix === "enseignant") {
        let map = (codes && codes.enseignants) || CODES_INIT.enseignants || {};
        if (typeof map === "string") {
          try { map = JSON.parse(map); } catch (e) { map = {}; }
        }
        const classeTrouvee = Object.keys(map || {}).find((cls) => String(map[cls] || "").trim() === saisie);
        if (classeTrouvee) {
          if (rolesBloques && rolesBloques.enseignant) {
            setErreur("Code incorrect.");
            return false;
          }
          if (rolesBloques && rolesBloques.enseignants && rolesBloques.enseignants[classeTrouvee]) {
            setErreur("Code incorrect.");
            return false;
          }
          entrerLocal("enseignant", classeTrouvee);
          return true;
        }
        const codeEns = String((codes && codes.enseignant) || CODES_INIT.enseignant || "").trim();
        if (saisie === codeEns) {
          if (rolesBloques && rolesBloques.enseignant) {
            setErreur("Code incorrect.");
            return false;
          }
          entrerLocal("enseignant", (classes && classes[0]) || "CI");
          return true;
        }
        return false;
      }
      // Fondateur / directeur / secrétaire : code actuel (Paramètres / base), sinon défaut
      const codeActuel = String((codes && codes[choix]) || "").trim();
      const codeDefaut = String((CODES_INIT && CODES_INIT[choix]) || "").trim();
      // Uniquement les codes venant de la base (ou CODES_INIT si la base n'a pas encore répondu)
      const attendu = codeActuel || codeDefaut;
      if (attendu && saisie === attendu) { entrerLocal(choix); return true; }
      return false;
    };

    try {
      // Connexion basée sur la base de données (Supabase)
      if (SUPABASE_CONFIGURE) {
        // Parent : chercher l'élève en base (rapide)
        if (choix === "parent") {
          try {
            const enfant = await trouverEleveParCode(saisie, eleves || []);
            if (enfant && enfant.id) {
              if (enfant.accesParentBloque) {
                setErreur("Accès temporairement suspendu. Contactez l'école.");
                return;
              }
              try {
                if (typeof setEleves === "function") {
                  setEleves((prev) => {
                    const liste = Array.isArray(prev) ? prev : [];
                    if (liste.some((e) => String(e.id).toLowerCase() === String(enfant.id).toLowerCase())) return liste;
                    return [...liste, { ...enfant, notes: enfant.notes || [], absences: enfant.absences || [], frais: enfant.frais || [], messages: enfant.messages || [] }];
                  });
                }
              } catch (e) {}
              entrerLocal("parent", enfant.id);
              return;
            }
            setErreur("Code incorrect.");
            try { journaliser("Tentative refusée — parent", "parent", { espace: "parent", reussi: false, detail: "code incorrect" }); } catch (e) {}
            return;
          } catch (e) {
            setErreur("Code incorrect.");
            return;
          }
        }

        // Staff : vérifier d'abord les codes déjà chargés depuis la base, puis RPC serveur
        if (await essayerCodesLocaux()) return;

        try {
          const requete = connexionServeur(choix, saisie);
          const timeout = new Promise((_, rej) =>
            setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), 3000)
          );
          const s = await Promise.race([requete, timeout]);
          definirSession(s);
          try {
            journaliser("Connexion réussie (base) — " + s.role, s.role, { espace: s.role, reussi: true, detail: s.eleve_id || s.classe || "" });
          } catch (e) {}
          onEntrer(s.role, s.role === "parent" ? s.eleve_id : s.role === "enseignant" ? s.classe : undefined);
          return;
        } catch (eServeur) {
          const c = eServeur && eServeur.code;
          if (c === "TROP_DE_TENTATIVES") {
            setErreur("Trop de tentatives. Réessayez plus tard.");
            return;
          }
          setErreur("Code incorrect.");
          try { journaliser("Tentative refusée — espace " + choix, choix, { espace: choix, reussi: false, detail: "code incorrect" }); } catch (e) {}
          return;
        }
      }

      // Sans Supabase configuré uniquement
      if (await essayerCodesLocaux()) return;
      setErreur("Code incorrect.");
    } catch (e) {
      setErreur("Code incorrect.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(160deg, #0B1F3A 0%, #1E3A8A 45%, #1D4ED8 100%)" }}>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-12 sm:justify-center sm:py-16">
        <div className="mb-8 mt-4 text-center sm:mb-10 sm:mt-0">
          <div className="mx-auto mb-4">
            <Embleme
              logoUrl={(ecole && ecole.logoUrl) || ECOLE_INIT.logoUrl || (typeof LOGO_CSP_BASE64 !== "undefined" ? LOGO_CSP_BASE64 : "")}
              taille={64}
              iconTaille={28}
            />
          </div>
          <p className="text-[13px] uppercase tracking-[0.25em] font-semibold" style={{ color: "#FDE68A" }}>École Connectée</p>
          <h1 className="mt-1 font-serif text-3xl font-bold" style={{ color: "#F8FAFC" }}>
            {(ecole && ecole.nom) || ECOLE_INIT.nom || "Complexe Scolaire Protestant"}
          </h1>
          <p className="font-serif text-lg italic" style={{ color: "#FDE68A" }}>
            {(ecole && ecole.sigle) || ECOLE_INIT.sigle || "CSP « Sagesse Divine »"}
          </p>
          {(ecole && ecole.devise) || ECOLE_INIT.devise ? (
            <p className="mt-1 text-[14px] font-medium" style={{ color: "#BFDBFE" }}>
              « {(ecole && ecole.devise) || ECOLE_INIT.devise} »
            </p>
          ) : null}
          <p className="mt-1 text-[15px]" style={{ color: "#E2E8F0" }}>
            {[
              (ecole && ecole.quartier) || ECOLE_INIT.quartier || "",
              [((ecole && ecole.commune) || ECOLE_INIT.commune || ""), ((ecole && ecole.departement) || ECOLE_INIT.departement || "")].filter(Boolean).join(", "),
            ].filter(Boolean).join(" — ") || "Tchaourou"}
          </p>
          <p className="mt-1.5 text-[15px]" style={{ color: "#A5F3FC" }}>
            {((ecole && ecole.directeur) || ECOLE_INIT.directeur) && (
              <>Directeur : {(ecole && ecole.directeur) || ECOLE_INIT.directeur}</>
            )}
            {((ecole && ecole.directeur) || ECOLE_INIT.directeur) && ((ecole && ecole.telephoneDirecteur) || ECOLE_INIT.telephoneDirecteur) && " · "}
            {((ecole && ecole.telephoneDirecteur) || ECOLE_INIT.telephoneDirecteur) && (
              <>Tél. {(ecole && ecole.telephoneDirecteur) || ECOLE_INIT.telephoneDirecteur}</>
            )}
          </p>
          <p className="mt-0.5 text-[14px]" style={{ color: "#93C5FD" }}>
            {(ecole && ecole.telephone) || ECOLE_INIT.telephone ? <>École : {(ecole && ecole.telephone) || ECOLE_INIT.telephone}</> : null}
            {((ecole && ecole.telephone) || ECOLE_INIT.telephone) && ((ecole && ecole.email) || ECOLE_INIT.email) && " · "}
            {(ecole && ecole.email) || ECOLE_INIT.email || ""}
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Groupe 1 : personnel de l'école — code groupe puis codes par rôle */}
          <button
            type="button"
            onClick={() => {
              if (groupePersonnel) {
                setGroupePersonnel(false);
                setAccesPersonnelOk(false);
                setCodeGroupePersonnel("");
                setErreurGroupe("");
                setChoix(null);
                setCode("");
                setErreur("");
              } else {
                setGroupePersonnel(true);
                setErreurGroupe("");
              }
            }}
            className="group relative overflow-hidden rounded-2xl border p-5 text-left transition sm:col-span-2"
            style={{
              borderColor: groupePersonnel ? "#1D4ED8" : "#E7DEC8",
              background: groupePersonnel ? "#EFF6FF" : "#FFFFFFEE",
              boxShadow: groupePersonnel ? "0 0 0 2px #1D4ED855" : "0 4px 14px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg,#1E3A8A,#1D4ED8)" }}>
              <ShieldCheck size={20} color="#FDE68A" />
            </div>
            <div className="font-serif text-xl font-bold" style={{ color: "#1E3A8A" }}>Espace personnel de l&apos;école</div>
            <div className="mt-1 text-[15px]" style={{ color: "#475569" }}>
              Fondateur · Administratif · Secrétaire · Enseignant
            </div>
            <div className="mt-2 text-[13px] font-semibold" style={{ color: "#1D4ED8" }}>
              {groupePersonnel
                ? (accesPersonnelOk ? "Masquer les espaces ▲" : "Saisir le code du personnel ▼")
                : "Appuyer — code personnel requis ▼"}
            </div>
          </button>

          {groupePersonnel && !accesPersonnelOk && (
            <div className="sm:col-span-2 rounded-2xl border p-4" style={{ borderColor: "#1D4ED8", background: "#EFF6FF" }}>
              <p className="mb-2 text-[14px] font-semibold" style={{ color: "#1E3A8A" }}>
                Code d&apos;accès — Espace personnel de l&apos;école
              </p>
              <p className="mb-3 text-[13px]" style={{ color: "#475569" }}>
                Ce code ouvre la liste des espaces. Chaque espace demandera ensuite son propre code (inchangé).
              </p>
              <input
                type="password"
                value={codeGroupePersonnel}
                onChange={(e) => { setCodeGroupePersonnel(e.target.value); setErreurGroupe(""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const ok = String(codeGroupePersonnel || "").trim() === codeGroupeAttendu;
                    if (ok) { setAccesPersonnelOk(true); setErreurGroupe(""); setCodeGroupePersonnel(""); }
                    else { setErreurGroupe("Code incorrect."); setAccesPersonnelOk(false); }
                  }
                }}
                placeholder="Code du personnel"
                className="mb-2 w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                style={{ borderColor: "#93C5FD" }}
                autoComplete="off"
              />
              {erreurGroupe ? (
                <p className="mb-2 text-[13px] font-semibold" style={{ color: "#B91C1C" }}>{erreurGroupe}</p>
              ) : null}
              <Btn
                variant="primary"
                onClick={() => {
                  const ok = String(codeGroupePersonnel || "").trim() === codeGroupeAttendu;
                  if (ok) { setAccesPersonnelOk(true); setErreurGroupe(""); setCodeGroupePersonnel(""); }
                  else { setErreurGroupe("Code incorrect."); setAccesPersonnelOk(false); }
                }}
              >
                Valider et voir les espaces
              </Btn>
            </div>
          )}

          {groupePersonnel && accesPersonnelOk && ROLES_PERSONNEL.map((r) => {
            const Icon = r.icon;
            const actif = choix === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => { setChoix(r.id); setCode(""); setErreur(""); }}
                className="group relative overflow-hidden rounded-2xl border p-5 text-left transition"
                style={{
                  borderColor: actif ? "#16A34A" : "#BBF7D0",
                  background: actif ? "#F0FDF4" : "#FFFFFF",
                  boxShadow: actif ? "0 0 0 2px #16A34A55" : "none",
                }}
              >
                {actif && <Cachet />}
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg,#14532D,#16A34A)" }}>
                  <Icon size={18} color="#FEF3C7" />
                </div>
                <div className="font-serif text-lg" style={{ color: "#14532D" }}>{r.label}</div>
                <div className="mt-0.5 text-[15px]" style={{ color: "#57534E" }}>{r.desc}</div>
              </button>
            );
          })}

          {/* Groupe 2 : parents à part */}
          {ROLE_PARENT && (
            <button
              type="button"
              onClick={() => {
                setGroupePersonnel(false);
                setAccesPersonnelOk(false);
                setCodeGroupePersonnel("");
                setErreurGroupe("");
                setChoix("parent");
                setCode("");
                setErreur("");
              }}
              className="group relative overflow-hidden rounded-2xl border p-5 text-left transition sm:col-span-2"
              style={{
                borderColor: choix === "parent" ? "#D97706" : "#FDE68A",
                background: choix === "parent" ? "#FFFBEB" : "#FFFFFFEE",
                boxShadow: choix === "parent" ? "0 0 0 2px #D9770655" : "0 4px 14px rgba(0,0,0,0.06)",
              }}
            >
              {choix === "parent" && <Cachet />}
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg,#B45309,#F59E0B)" }}>
                <User size={20} color="#FFFBEB" />
              </div>
              <div className="font-serif text-xl font-bold" style={{ color: "#92400E" }}>{ROLE_PARENT.label}</div>
              <div className="mt-1 text-[15px]" style={{ color: "#78716C" }}>
                Suivi de l&apos;enfant — notes, frais, absences (code élève)
              </div>
            </button>
          )}
        </div>

        {choix && (
          <div ref={zoneCodeRef} className="mt-6 w-full max-w-md scroll-mt-8">
            <div className="flex items-center gap-2 rounded-xl border bg-white/90 px-4 py-3 shadow-md"
                 style={{ borderColor: erreur ? "#DC2626" : "#CBD5E1" }}>
              <KeyRound size={16} style={{ color: "#64748B" }} />
              <input
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") valider(); }}
                placeholder={choix === "parent" ? "Code élève reçu de l'école" : "Code d'accès"}
                className="w-full bg-transparent text-[15px] outline-none"
                style={{ color: "#1C1917" }}
              />
              <Btn variant="gold" onClick={valider}>Entrer<ChevronRight size={14} /></Btn>
            </div>
            {erreur && <p className="mt-1.5 px-1 text-[13px] font-semibold" style={{ color: "#DC2626" }}>{erreur}</p>}
            {choix === "parent" && !erreur && (
              <p className="mt-1.5 px-1 text-[13px] font-semibold" style={{ color: "#E2E8F0" }}>
                Saisissez le code élève communiqué par le secrétariat après validation de l&apos;inscription.
              </p>
            )}
            {choix !== "parent" && !erreur && (
              <p className="mt-1.5 px-1 text-[13px] font-semibold" style={{ color: "#E2E8F0" }}>
                Saisissez votre code d&apos;accès personnel (fourni par la direction).
              </p>
            )}
          </div>
        )}

        {/* Messages publics (annonces du Directeur) — visibles sans connexion */}
        <div className="mt-8 w-full max-w-2xl">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Megaphone size={18} color="#FDE68A" />
            <h2 className="font-serif text-lg font-bold" style={{ color: "#FDE68A" }}>Messages publics de l&apos;école</h2>
          </div>
          {!(annonces && annonces.length) ? (
            <p className="rounded-xl border px-4 py-3 text-center text-[14px]" style={{ borderColor: "rgba(255,255,255,0.25)", color: "#E2E8F0", background: "rgba(255,255,255,0.08)" }}>
              Aucun message public pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {(annonces || []).slice(0, 8).map((a, i) => (
                <div key={i} className="rounded-xl border px-4 py-3 shadow-md" style={{ borderColor: "rgba(253,230,138,0.4)", background: "rgba(255,255,255,0.95)" }}>
                  <div className="font-bold text-[16px]" style={{ color: "#1E3A8A" }}>{a.titre || "Annonce"}</div>
                  <p className="mt-1 text-[14px] font-medium" style={{ color: "#334155" }}>{a.texte}</p>
                  {a.date && <div className="mt-1.5 text-[12px]" style={{ color: "#64748B" }}>{a.date}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inscription tout en bas */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t pt-8" style={{ borderColor: "rgba(255,255,255,0.25)" }}>
          <button
            type="button"
            onClick={onInscription}
            className="flex items-center gap-2 rounded-full border px-5 py-2.5 text-[15px] font-semibold transition hover:opacity-90"
            style={{ borderColor: "#FDE68A", color: "#78350F", background: "#FEF3C7" }}
          >
            <FileText size={14} />
            Inscrire mon enfant en ligne
          </button>
          <button
            type="button"
            onClick={() => {
              const lien = (ecole && ecole.lienReunion) ? String(ecole.lienReunion).trim() : "";
              const defaut = "https://meet.jit.si/CSP-Sagesse-Divine-Tchaourou";
              const url = lien || defaut;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[15px] font-semibold transition hover:opacity-90"
            style={{ borderColor: "#7DD3FC", color: "#0C4A6E", background: "#E0F2FE" }}
          >
            <Users size={14} />
            Réunion en ligne
          </button>

          {!SUPABASE_CONFIGURE && (
            <p className="max-w-md text-center text-[12px] font-semibold" style={{ color: "#FECACA" }}>
              Mode local : les données restent sur cet appareil uniquement. Pour partager notes, frais et messages entre téléphones, configurez Supabase (variables Vercel).
            </p>
          )}
          <p className="mt-4 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Version {APP_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   INSCRIPTION EN LIGNE (accès public, sans connexion)
------------------------------------------------------------------- */

function InscriptionEnLigne({ onRetour, onSoumettre }) {
  const { ecole, classes } = useEcole();
  const [envoye, setEnvoye] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [dernierEnvoye, setDernierEnvoye] = useState(null);
  const [nbEnvoyes, setNbEnvoyes] = useState(0);
  const [form, setForm] = useState({
    prenom: "", nom: "", sexe: "", naissance: "", classeSouhaitee: (classes && classes[0]) || "",
    parrainNom: "", parrainTelephone: "", message: "",
  });

  const champ = (cle) => (e) => setForm({ ...form, [cle]: e.target.value });
  const age = useMemo(() => ageDepuis(form.naissance), [form.naissance]);

  const valide = form.prenom.trim() && form.nom.trim() && form.sexe && form.naissance
    && form.parrainNom.trim() && form.parrainTelephone.trim();

  const soumettre = async () => {
    if (!valide || enCours) return;
    setEnCours(true);
    try {
      const demande = {
        id: genererIdDemande(),
        ...form,
        age,
        origine: "en_ligne",
        date: new Date().toLocaleString("fr-FR"),
        statut: "en_attente",
      };
      await onSoumettre(demande);
      setDernierEnvoye({ prenom: form.prenom, nom: form.nom, telephone: form.parrainTelephone });
      setNbEnvoyes((n) => n + 1);
      setEnvoye(true);
    } catch (e) {
      const detail = String((e && e.message) || e || "");
      window.alert(
        "L'envoi a échoué.\n\n" +
        (detail ? ("Détail : " + detail.slice(0, 220) + "\n\n") : "") +
        "Vérifiez Internet et réessayez. Vous pouvez envoyer plusieurs enfants l'un après l'autre."
      );
    } finally {
      setEnCours(false);
    }
  };

  const autreEnfant = () => {
    // Garde les infos parent, vide l'enfant
    setForm((f) => ({
      ...f,
      prenom: "",
      nom: "",
      sexe: "",
      naissance: "",
      classeSouhaitee: (classes && classes[0]) || f.classeSouhaitee || "",
      message: "",
    }));
    setEnvoye(false);
    setDernierEnvoye(null);
  };

  if (envoye) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "#FAF6EE" }}>
        <div className="max-w-md rounded-2xl border bg-white/80 p-8 text-center shadow-sm" style={{ borderColor: "#E7DEC8" }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "#E4EEE3" }}>
            <CheckCircle2 size={26} style={{ color: "#2F5233" }} />
          </div>
          <h2 className="font-serif text-xl" style={{ color: "#1B2A4A" }}>Demande envoyée</h2>
          <p className="mt-2 text-[15px]" style={{ color: "#5C5240" }}>
            La demande d&apos;inscription de <strong>{(dernierEnvoye && dernierEnvoye.prenom) || form.prenom} {(dernierEnvoye && dernierEnvoye.nom) || form.nom}</strong> a bien été transmise au secrétariat de {(ecole && ecole.sigle) || "l'école"}.
            Contact au {(dernierEnvoye && dernierEnvoye.telephone) || form.parrainTelephone}.
          </p>
          {nbEnvoyes > 1 && (
            <p className="mt-2 text-[13px] font-semibold" style={{ color: "#2F5233" }}>
              {nbEnvoyes} demandes envoyées depuis cet appareil.
            </p>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <Btn variant="gold" icon={Plus} onClick={autreEnfant}>Inscrire un autre enfant</Btn>
            <Btn variant="primary" icon={ArrowLeft} onClick={onRetour}>Retour à l&apos;accueil</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#FAF6EE" }}>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <button onClick={onRetour} className="mb-6 flex items-center gap-1.5 text-[15px]" style={{ color: "#8A6D14" }}>
          <ArrowLeft size={14} /> Retour
        </button>

        <div className="mb-6 text-center">
          <p className="text-[13px] uppercase tracking-[0.2em]" style={{ color: "#9A8B67" }}>Inscription en ligne</p>
          <h1 className="mt-1 font-serif text-2xl" style={{ color: "#1B2A4A" }}>{ecole.sigle}</h1>
          <p className="mt-1 text-[15px]" style={{ color: "#5C5240" }}>
            Remplissez ce formulaire depuis chez vous — le secrétariat examinera votre demande.
            Vous pouvez inscrire plusieurs enfants : après chaque envoi, cliquez sur « Inscrire un autre enfant ».
          </p>
        </div>

        <Panel title="Informations de l'enfant" icon={FileText}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Champ label="Prénom de l'enfant" value={form.prenom} onChange={champ("prenom")} />
            <Champ label="Nom de l'enfant" value={form.nom} onChange={champ("nom")} />
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Sexe</label>
              <div className="flex gap-2">
                {[{ v: "F", l: "Féminin" }, { v: "M", l: "Masculin" }].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setForm({ ...form, sexe: opt.v })}
                    className="flex-1 rounded-lg border px-3 py-2 text-[15px] transition"
                    style={{
                      borderColor: form.sexe === opt.v ? "#C9A227" : "#E7DEC8",
                      background: form.sexe === opt.v ? "#FBF0D2" : "transparent",
                      color: form.sexe === opt.v ? "#8A6D14" : "#5C5240",
                      fontWeight: form.sexe === opt.v ? 600 : 400,
                    }}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Date de naissance</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={form.naissance}
                  onChange={champ("naissance")}
                  className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                  style={{ borderColor: "#E7DEC8" }}
                />
                {age !== null && <Badge tone="ardoise">{age} an{age > 1 ? "s" : ""}</Badge>}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe souhaitée</label>
              <select
                value={form.classeSouhaitee}
                onChange={champ("classeSouhaitee")}
                className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                style={{ borderColor: "#E7DEC8" }}
              >
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </Panel>

        <div className="h-4" />

        <Panel title="Coordonnées du parrain" icon={UserCircle2}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Champ label="Nom du parrain" value={form.parrainNom} onChange={champ("parrainNom")} />
            <Champ label="Numéro du parrain" value={form.parrainTelephone} onChange={champ("parrainTelephone")} placeholder="9x xx xx xx" />
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Message (optionnel)</label>
            <textarea
              value={form.message}
              onChange={champ("message")}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
              placeholder="Une précision à transmettre au secrétariat ?"
            />
          </div>
        </Panel>

        <div className="mt-5 flex items-center justify-between">
          {!valide && <p className="text-[13px]" style={{ color: "#8A2E2E" }}>Merci de remplir les champs obligatoires.</p>}
          <div className="ml-auto">
            <Btn variant="gold" icon={Send} onClick={soumettre} disabled={enCours || !valide}>Soumettre la demande</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Champ({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
        style={{ borderColor: "#E7DEC8" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   MISE EN PAGE COMMUNE
------------------------------------------------------------------- */

function Coquille({ role, roleLabel, onQuitter, children, nav, actif, setActif }) {
  const { ecole } = useEcole();
  const [actualisation, setActualisation] = useState(false);
  const actualiser = () => {
    setActualisation(true);
    window.setTimeout(() => window.location.reload(), 180);
  };
  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(165deg, #ECFDF5 0%, #D1FAE5 35%, #FFFBEB 100%)" }}>
      <header className="sticky top-0 z-10 border-b backdrop-blur-md shadow-sm"
              style={{ borderColor: "#7DD3FC", background: "linear-gradient(90deg, #0284C7 0%, #0EA5E9 45%, #38BDF8 100%)" }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button onClick={actualiser} disabled={actualisation} className="flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1.5 text-[13px] font-semibold transition hover:opacity-80" style={{ borderColor: "#E7DEC8", color: "#1B2A4A", background: "#FFFFFFAA" }} title="Actualiser les informations">
              <RefreshCw size={14} className={actualisation ? "animate-spin" : ""} /> <span className="hidden sm:inline">Actualiser</span>
            </button>
            <div className="shrink-0">
              <Embleme logoUrl={(ecole && ecole.logoUrl) || ECOLE_INIT.logoUrl} taille={32} iconTaille={15} />
            </div>
            <div className="min-w-0">
              <div className="truncate font-serif text-[15px] font-semibold leading-none" style={{ color: "#FFFFFF" }}>{ecole.sigle}</div>
              <div className="text-[12px]" style={{ color: "#E0F2FE" }}>{ecole.commune}</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Badge tone="or"><UserCircle2 size={12} /><span className="max-w-[38vw] truncate sm:max-w-none">{roleLabel}</span></Badge>
            <button onClick={onQuitter} className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold" style={{ color: "#FECACA", background: "rgba(255,255,255,0.1)" }}>
              <LogOut size={13} /> Quitter
            </button>
          </div>
        </div>
      </header>

      {/* Navigation mobile : onglets horizontaux défilants */}
      <div className="sticky top-[57px] z-10 border-b sm:hidden" style={{ borderColor: "#C7D2E5", background: "rgba(248,250,252,0.95)" }}>
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2" style={{ WebkitOverflowScrolling: "touch" }}>
          {nav.map((n) => {
            const Icon = n.icon;
            const isActif = actif === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setActif(n.id)}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition"
                style={{
                  background: isActif ? "linear-gradient(135deg, #16A34A, #14532D)" : "rgba(255,255,255,0.95)",
                  color: isActif ? "#F8FAFC" : "#334155",
                  boxShadow: isActif ? "0 2px 8px rgba(11,31,58,0.25)" : "inset 0 0 0 1px #CBD5E1",
                }}
              >
                <Icon size={13} />
                {n.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 sm:flex-row sm:px-6 sm:py-6">
        {/* Navigation desktop : barre latérale */}
        <nav className="hidden w-52 shrink-0 sm:block">
          <div className="sticky top-20 space-y-1">
            {nav.map((n) => {
              const Icon = n.icon;
              const isActif = actif === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setActif(n.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[15px] transition"
                  style={{
                    background: isActif ? "linear-gradient(135deg, #16A34A, #B45309)" : "transparent",
                    color: isActif ? "#F8FAFC" : "#334155",
                    boxShadow: isActif ? "0 2px 10px rgba(11,31,58,0.2)" : "none",
                  }}
                >
                  <Icon size={15} />
                  {n.label}
                </button>
              );
            })}
          </div>
        </nav>
        <main className="min-w-0 flex-1 space-y-5 pb-16 sm:pb-0">{children}</main>
      </div>
    </div>
  );
}
function EspaceFondateur({ demandes=[], setDemandes, eleves=[], personnel=[], setPersonnel, annonces=[], setAnnonces, setEleves, ecole={}, setEcole, classes=[], setClasses, fraisTypes=[], setFraisTypes, anneeScolaire="", setAnneeScolaire, codes={}, setCodes, matieresParClasse={}, setMatieresParClasse, onQuitter }) {
  return (
    <EspaceDirecteur
      eleves={eleves} personnel={personnel} setPersonnel={setPersonnel || (() => {})} annonces={annonces} setAnnonces={setAnnonces}
      demandes={demandes} setDemandes={setDemandes} setEleves={setEleves}
      isFondateur={true} ecole={ecole} setEcole={setEcole} classes={classes} setClasses={setClasses}
      fraisTypes={fraisTypes} setFraisTypes={setFraisTypes} anneeScolaire={anneeScolaire} setAnneeScolaire={setAnneeScolaire}
      codes={codes} setCodes={setCodes} matieresParClasse={matieresParClasse} setMatieresParClasse={setMatieresParClasse}
      onQuitter={onQuitter}
    />
  );
}
 
/* ------------------------------------------------------------------
   ESPACE DIRECTEUR
------------------------------------------------------------------- */



/** Situation financière : bilan par classe et par rubrique de frais (scolarité, uniforme, inscription…). */
function PanneauSituationFinanciere({ eleves = [], classes = [], fraisTypes = [] }) {
  const [rubrique, setRubrique] = useState("toutes");
  const [classeFiltre, setClasseFiltre] = useState("toutes");
  const [recherche, setRecherche] = useState("");

  const rubriques = useMemo(() => {
    const set = new Set();
    (fraisTypes || []).forEach((f) => { if (f && f.libelle) set.add(String(f.libelle)); });
    (eleves || []).forEach((e) => {
      (e.frais || []).forEach((f) => { if (f && f.libelle) set.add(String(f.libelle)); });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [eleves, fraisTypes]);

  const classesListe = (classes && classes.length) ? classes : Array.from(new Set((eleves || []).map((e) => e.classe).filter(Boolean)));

  const matchRubrique = (lib, rub) => {
    if (!rub || rub === "toutes") return true;
    return String(lib || "").trim().toLowerCase() === String(rub).trim().toLowerCase();
  };

  const lignes = useMemo(() => {
    const q = String(recherche || "").trim().toLowerCase();
    const out = [];
    (eleves || []).forEach((e) => {
      if (!e) return;
      if (classeFiltre !== "toutes" && e.classe !== classeFiltre) return;
      if (q) {
        const blob = `${e.nom || ""} ${e.prenom || ""} ${e.code || ""}`.toLowerCase();
        if (!blob.includes(q)) return;
      }
      const frais = e.frais || [];
      if (rubrique === "toutes") {
        const du = frais.reduce((s, f) => s + (Number(f.du) || 0), 0);
        const paye = frais.reduce((s, f) => s + (Number(f.paye) || 0), 0);
        const reste = Math.max(0, du - paye);
        out.push({ eleve: e, libelle: "Total toutes rubriques", du, paye, reste, detail: frais });
      } else {
        const f = frais.find((x) => matchRubrique(x.libelle, rubrique));
        const du = f ? (Number(f.du) || 0) : 0;
        const paye = f ? (Number(f.paye) || 0) : 0;
        const reste = Math.max(0, du - paye);
        // inclure aussi ceux qui n'ont pas encore la ligne de frais (reste = montant type si connu)
        let duFinal = du;
        if (!f) {
          const type = (fraisTypes || []).find((t) => matchRubrique(t.libelle, rubrique) && (!t.classe || t.classe === e.classe));
          if (type) duFinal = Number(type.montant) || 0;
        }
        const resteFinal = Math.max(0, duFinal - paye);
        out.push({ eleve: e, libelle: rubrique, du: duFinal, paye, reste: resteFinal, detail: f ? [f] : [] });
      }
    });
    out.sort((a, b) => {
      const ca = String(a.eleve.classe || "").localeCompare(String(b.eleve.classe || ""), "fr");
      if (ca !== 0) return ca;
      return String(a.eleve.nom || "").localeCompare(String(b.eleve.nom || ""), "fr");
    });
    return out;
  }, [eleves, classeFiltre, rubrique, recherche, fraisTypes]);

  const totaux = useMemo(() => {
    return lignes.reduce((acc, l) => {
      acc.du += l.du;
      acc.paye += l.paye;
      acc.reste += l.reste;
      if (l.reste <= 0 && l.du > 0) acc.soldes += 1;
      if (l.reste > 0) acc.impayes += 1;
      return acc;
    }, { du: 0, paye: 0, reste: 0, soldes: 0, impayes: 0 });
  }, [lignes]);

  const parClasse = useMemo(() => {
    const map = {};
    lignes.forEach((l) => {
      const c = l.eleve.classe || "?";
      if (!map[c]) map[c] = { classe: c, du: 0, paye: 0, reste: 0, n: 0, soldes: 0, impayes: 0, eleves: [] };
      map[c].du += l.du;
      map[c].paye += l.paye;
      map[c].reste += l.reste;
      map[c].n += 1;
      if (l.reste <= 0 && l.du > 0) map[c].soldes += 1;
      if (l.reste > 0) map[c].impayes += 1;
      map[c].eleves.push(l);
    });
    return Object.values(map).sort((a, b) => String(a.classe).localeCompare(String(b.classe), "fr"));
  }, [lignes]);

  const imprimer = () => {
    try {
      let html = "";
      parClasse.forEach((cl) => {
        html += `<h3 style="margin:16px 0 8px;color:#1B2A4A">${cl.classe} — Dû ${cl.du.toLocaleString("fr-FR")} · Payé ${cl.paye.toLocaleString("fr-FR")} · Reste ${cl.reste.toLocaleString("fr-FR")} FCFA</h3>`;
        html += `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px"><tr style="background:#F1ECDD"><th>Nom</th><th>Prénom</th><th>Code</th><th>Rubrique</th><th>Dû</th><th>Payé</th><th>Reste</th></tr>`;
        cl.eleves.forEach((l) => {
          html += `<tr><td>${l.eleve.nom || ""}</td><td>${l.eleve.prenom || ""}</td><td>${l.eleve.code || ""}</td><td>${l.libelle}</td><td>${l.du.toLocaleString("fr-FR")}</td><td>${l.paye.toLocaleString("fr-FR")}</td><td>${l.reste.toLocaleString("fr-FR")}</td></tr>`;
        });
        html += `</table>`;
      });
      const win = window.open("", "_blank");
      if (!win) { alert("Autorisez les pop-ups"); return; }
      const titre = "Situation financière" + (rubrique !== "toutes" ? " — " + rubrique : "") + (classeFiltre !== "toutes" ? " — " + classeFiltre : "");
      win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${titre}</title></head><body style="font-family:Georgia,serif;padding:16px;color:#1B2A4A"><h1>${titre}</h1><p>Édité le ${new Date().toLocaleString("fr-FR")}</p>${html || "<p>Aucune donnée</p>"}<p style="margin-top:20px"><button onclick="window.print()">Imprimer / PDF</button></p></body></html>`);
      win.document.close();
    } catch (e) { console.warn(e); alert("Impression impossible"); }
  };

  return (
    <div>
      <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>
        Bilan des frais scolaires par classe et par rubrique (inscription, écolage/scolarité, uniforme, cantine…).
        Mis à jour automatiquement quand un paiement est enregistré.
      </p>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-[12px] font-medium" style={{ color: "#5C5240" }}>Rubrique de frais</label>
          <select value={rubrique} onChange={(e) => setRubrique(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-[14px]" style={{ borderColor: "#E7DEC8" }}>
            <option value="toutes">Toutes les rubriques (total)</option>
            {rubriques.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium" style={{ color: "#5C5240" }}>Classe</label>
          <select value={classeFiltre} onChange={(e) => setClasseFiltre(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-[14px]" style={{ borderColor: "#E7DEC8" }}>
            <option value="toutes">Toutes les classes</option>
            {classesListe.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium" style={{ color: "#5C5240" }}>Recherche élève</label>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom, prénom, code…" className="w-full rounded-lg border px-3 py-2 text-[14px]" style={{ borderColor: "#E7DEC8" }} />
        </div>
        <div className="flex items-end">
          <Btn variant="ghost" icon={FileText} onClick={imprimer}>Imprimer / PDF</Btn>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="rounded-xl border p-3" style={{ borderColor: "#E7DEC8", background: "#FAF6EE" }}>
          <div className="text-[11px]" style={{ color: "#9A8B67" }}>Total dû</div>
          <div className="font-serif text-lg font-bold" style={{ color: "#1B2A4A" }}>{totaux.du.toLocaleString("fr-FR")} F</div>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}>
          <div className="text-[11px]" style={{ color: "#14532D" }}>Total payé</div>
          <div className="font-serif text-lg font-bold" style={{ color: "#14532D" }}>{totaux.paye.toLocaleString("fr-FR")} F</div>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
          <div className="text-[11px]" style={{ color: "#991B1B" }}>Reste à collecter</div>
          <div className="font-serif text-lg font-bold" style={{ color: "#991B1B" }}>{totaux.reste.toLocaleString("fr-FR")} F</div>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "#E7DEC8", background: "#FFFFFF" }}>
          <div className="text-[11px]" style={{ color: "#5C5240" }}>Soldés</div>
          <div className="font-serif text-lg font-bold" style={{ color: "#14532D" }}>{totaux.soldes}</div>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "#E7DEC8", background: "#FFFFFF" }}>
          <div className="text-[11px]" style={{ color: "#5C5240" }}>Impayés</div>
          <div className="font-serif text-lg font-bold" style={{ color: "#991B1B" }}>{totaux.impayes}</div>
        </div>
      </div>

      <div className="space-y-4">
        {parClasse.map((cl) => (
          <div key={cl.classe} className="rounded-xl border overflow-hidden" style={{ borderColor: "#E7DEC8" }}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2" style={{ background: "#1B2A4A", color: "#FAF6EE" }}>
              <span className="font-bold">Classe {cl.classe}</span>
              <span className="text-[12px]">
                Payé {cl.paye.toLocaleString("fr-FR")} / {cl.du.toLocaleString("fr-FR")} F · Reste {cl.reste.toLocaleString("fr-FR")} F · {cl.impayes} impayé(s) · {cl.soldes} soldé(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr style={{ background: "#F1ECDD", color: "#5C5240" }}>
                    <th className="px-2 py-1.5">Nom</th>
                    <th className="px-2 py-1.5">Prénom</th>
                    <th className="px-2 py-1.5">Code</th>
                    <th className="px-2 py-1.5">Rubrique</th>
                    <th className="px-2 py-1.5">Dû</th>
                    <th className="px-2 py-1.5">Payé</th>
                    <th className="px-2 py-1.5">Reste</th>
                    <th className="px-2 py-1.5">État</th>
                  </tr>
                </thead>
                <tbody>
                  {cl.eleves.map((l) => {
                    const solde = l.reste <= 0 && l.du > 0;
                    const rien = l.du <= 0 && l.paye <= 0;
                    return (
                      <tr key={l.eleve.id + "-" + l.libelle} style={{ borderTop: "1px solid #E7DEC8", background: solde ? "#F0FDF4" : (l.reste > 0 ? "#FFFBEB" : "#FFFFFF") }}>
                        <td className="px-2 py-1.5 font-semibold">{l.eleve.nom}</td>
                        <td className="px-2 py-1.5">{l.eleve.prenom}</td>
                        <td className="px-2 py-1.5" style={{ color: "#9A8B67" }}>{l.eleve.code || "—"}</td>
                        <td className="px-2 py-1.5">{l.libelle}</td>
                        <td className="px-2 py-1.5">{l.du.toLocaleString("fr-FR")}</td>
                        <td className="px-2 py-1.5" style={{ color: "#14532D", fontWeight: 600 }}>{l.paye.toLocaleString("fr-FR")}</td>
                        <td className="px-2 py-1.5" style={{ color: l.reste > 0 ? "#991B1B" : "#14532D", fontWeight: 600 }}>{l.reste.toLocaleString("fr-FR")}</td>
                        <td className="px-2 py-1.5">
                          {rien ? <span style={{ color: "#9A8B67" }}>Non initié</span> : solde ? <span style={{ color: "#14532D", fontWeight: 700 }}>Soldé</span> : <span style={{ color: "#92400E", fontWeight: 700 }}>Impayé</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {parClasse.length === 0 && (
          <p className="text-[14px]" style={{ color: "#9A8B67" }}>Aucun élève pour ce filtre.</p>
        )}
      </div>
    </div>
  );
}

function PanneauEffectifsSexe({ eleves, ecole, setEleves, demandes = [] }) {
  const listeEleves = Array.isArray(eleves) ? eleves : [];
  const garcons = elevesParSexe(listeEleves, "M");
  const filles = elevesParSexe(listeEleves, "F");
  const nonRenseigne = listeEleves.filter((e) => !normaliserSexe(e && e.sexe));
  const total = listeEleves.length;
  const Bloc = ({ titre, liste, sexeCode, couleur }) => (
    <div className="rounded-xl border p-4" style={{ borderColor: "#E7DEC8", background: couleur }}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-bold text-[17px]" style={{ color: "#1B2A4A" }}>{titre}</div>
          <div className="text-[13px]" style={{ color: "#5C5240" }}>{liste.length} élève{liste.length > 1 ? "s" : ""} {total ? `(${total ? Math.round((liste.length / total) * 100) : 0} %)` : ""}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="gold" small icon={ClipboardList} onClick={() => copierTexteListe(texteListeSexe(listeEleves, sexeCode))}>Copier</Btn>
          <Btn variant="ghost" small icon={FileText} onClick={() => imprimerListeSexe(listeEleves, sexeCode, ecole)}>Imprimer</Btn>
        </div>
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {liste.length === 0 && <p className="text-[13px]" style={{ color: "#9A8B67" }}>Aucun nom pour ce sexe.</p>}
        {liste.map((e, i) => (
          <div key={e.id} className="rounded-lg border bg-white px-3 py-1.5 text-[14px]" style={{ borderColor: "#E7DEC8" }}>
            <span className="font-bold">{e.nom}</span> {e.prenom}
            <span className="ml-2 text-[12px]" style={{ color: "#9A8B67" }}>{e.classe} · {e.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
  const corrigerDepuisDemandes = () => {
    if (typeof setEleves !== "function") return;
    const avant = (eleves || []).filter((e) => !normaliserSexe(e.sexe)).length;
    setEleves((prev) => completerSexesDepuisDemandes(prev, demandes || []));
    const apresEstime = Math.max(0, avant); // message simple
    alert("Correction lancée : les sexes présents sur les demandes d'inscription sont recopiés sur les fiches élèves. Vérifiez les totaux ci-dessous.");
    try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400); } catch (err) {}
  };
  return (
    <div className="space-y-4">
      {nonRenseigne.length > 0 && typeof setEleves === "function" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "#FCD34D", background: "#FFFBEB" }}>
          <span className="text-[13px] font-semibold" style={{ color: "#92400E" }}>
            {nonRenseigne.length} élève(s) sans sexe reconnu.
          </span>
          <Btn variant="gold" small onClick={corrigerDepuisDemandes}>Recopier les sexes depuis les inscriptions</Btn>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl p-3 text-center" style={{ background: "#DBEAFE" }}>
          <div className="text-[12px]" style={{ color: "#1E40AF" }}>Effectif total</div>
          <div className="text-2xl font-bold" style={{ color: "#1D4ED8" }}>{total}</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "#E0F2FE" }}>
          <div className="text-[12px]" style={{ color: "#075985" }}>Garçons</div>
          <div className="text-2xl font-bold" style={{ color: "#0284C7" }}>{garcons.length}</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "#FCE7F3" }}>
          <div className="text-[12px]" style={{ color: "#9D174D" }}>Filles</div>
          <div className="text-2xl font-bold" style={{ color: "#DB2777" }}>{filles.length}</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "#F1F5F9" }}>
          <div className="text-[12px]" style={{ color: "#475569" }}>Sexe non renseigné</div>
          <div className="text-2xl font-bold" style={{ color: "#64748B" }}>{nonRenseigne.length}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Bloc titre="Liste des garçons" liste={garcons} sexeCode="M" couleur="#EFF6FF" />
        <Bloc titre="Liste des filles" liste={filles} sexeCode="F" couleur="#FDF2F8" />
      </div>
      {nonRenseigne.length > 0 && (
        <div className="rounded-xl border p-3" style={{ borderColor: "#FCD34D", background: "#FFFBEB" }}>
          <p className="mb-2 text-[13px] font-semibold" style={{ color: "#92400E" }}>
            {nonRenseigne.length} élève(s) sans sexe reconnu — ils ne sont pas comptés dans garçons/filles :
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto text-[13px]" style={{ color: "#5C5240" }}>
            {nonRenseigne.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white px-2 py-1" style={{ borderColor: "#FDE68A" }}>
                <span>{e.nom} {e.prenom} — {e.classe} — « {String(e.sexe ?? "") || "(vide)"} »</span>
                {typeof setEleves === "function" && (
                  <span className="flex gap-1">
                    <button type="button" className="rounded px-2 py-0.5 text-[12px] font-bold text-white" style={{ background: "#0284C7" }}
                      onClick={() => setEleves((prev) => prev.map((x) => x.id === e.id ? { ...x, sexe: "M" } : x))}>Garçon</button>
                    <button type="button" className="rounded px-2 py-0.5 text-[12px] font-bold text-white" style={{ background: "#DB2777" }}
                      onClick={() => setEleves((prev) => prev.map((x) => x.id === e.id ? { ...x, sexe: "F" } : x))}>Fille</button>
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px]" style={{ color: "#9A8B67" }}>
            Corrigez le sexe dans Bibliothèque (modifier la demande) ou réinscrivez avec Masculin/Féminin.
          </p>
        </div>
      )}
    </div>
  );
}


function PanneauEvaluation({ eleves, classes, classeFixe, ecole }) {
  const [classeSel, setClasseSel] = useState(classeFixe || (classes && classes[0]) || "CI");
  const [detailId, setDetailId] = useState(null);
  useEffect(() => {
    if (classeFixe) setClasseSel(classeFixe);
  }, [classeFixe]);
  const classeActive = classeFixe || classeSel;
  const rows = useMemo(() => classementClasse(eleves, classeActive), [eleves, classeActive]);
  const maxN = noteSurMax(classeActive) || 20;
  const detail = detailId ? (eleves || []).find((e) => String(e.id) === String(detailId)) : null;
  const listeClasses = classeFixe ? [classeFixe] : (classes || []);

  return (
    <Panel title="Évaluation & classement" icon={GraduationCap}>
      <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>
        Ordre des élèves selon la moyenne des notes. Cliquez un élève pour le détail par matière. Impression de la liste possible.
      </p>
      {!classeFixe && (
        <div className="mb-3 flex flex-wrap gap-2">
          {listeClasses.map((c) => (
            <button key={c} type="button" onClick={() => { setClasseSel(c); setDetailId(null); }}
              className="rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{ background: classeActive === c ? "#1B2A4A" : "#F3EDE0", color: classeActive === c ? "#FAF6EE" : "#5C5240" }}>
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <Btn variant="gold" small onClick={() => imprimerClassementClasse(classeActive, eleves, ecole)}>
          Imprimer le classement — {classeActive}
        </Btn>
      </div>
      {rows.length === 0 && (
        <p className="text-[13px]" style={{ color: "#9A8B67" }}>Aucun élève dans cette classe.</p>
      )}
      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {rows.map((r) => {
          const e = r.eleve;
          const actif = String(detailId) === String(e.id);
          return (
            <div key={e.id}>
              <button type="button" onClick={() => setDetailId(actif ? null : e.id)}
                className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-left"
                style={{ background: actif ? "#E8F0FE" : "#FAF6EE", border: "1px solid #E5D9C0" }}>
                <span className="font-semibold" style={{ color: "#1B2A4A", minWidth: 48 }}>
                  {r.rang != null ? ordinalRang(r.rang) : "—"}
                </span>
                <span className="flex-1 font-semibold" style={{ color: "#1B2A4A" }}>
                  {(e.nom || "").toUpperCase()} {(e.prenom || "")}
                </span>
                <span className="text-[12px]" style={{ color: "#5C5240" }}>{e.id}</span>
                <span className="font-serif" style={{ color: "#C9A227" }}>
                  {r.moyenne != null ? `${r.moyenne}/${maxN}` : "Pas de note"}
                </span>
              </button>
              {actif && detail && (
                <div className="mt-1 mb-2 rounded-xl px-3 py-2" style={{ background: "#FFF", border: "1px solid #E5D9C0" }}>
                  <p className="mb-2 text-[12px] font-semibold" style={{ color: "#5C5240" }}>Notes par matière</p>
                  {(detail.notes || []).length === 0 && (
                    <p className="text-[12px]" style={{ color: "#9A8B67" }}>Aucune note enregistrée.</p>
                  )}
                  <ul className="space-y-1">
                    {(detail.notes || []).map((n, idx) => (
                      <li key={idx} className="flex justify-between text-[13px]" style={{ color: "#1B2A4A" }}>
                        <span>{n.matiere || n.domaine || "—"}</span>
                        <span className="font-semibold">
                          {n.note20 != null ? `${n.note20}/${noteSurMax(detail.classe) || 20}` : (n.niveau || "—")}
                          {n.date ? ` · ${n.date}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function EspaceDirecteur({ eleves=[], personnel=[], setPersonnel, annonces=[], setAnnonces, demandes=[], setDemandes, setEleves, isFondateur=false, ecole={}, setEcole, classes=["CI","CP","CE1","CE2","CM1","CM2"], setClasses, fraisTypes=[], setFraisTypes, anneeScolaire="", setAnneeScolaire, codes={}, setCodes, matieresParClasse={}, setMatieresParClasse, onQuitter }) {
  const [onglet, setOnglet] = useState("dashboard");
  const [classeVue, setClasseVue] = useState((classes && classes[0]) || "CI");
  const [rechercheListe, setRechercheListe] = useState("");
  const [filtreAbsClasse, setFiltreAbsClasse] = useState("toutes");
  const [filtreAbsType, setFiltreAbsType] = useState("tous");
  const [rechercheAbs, setRechercheAbs] = useState("");
  const [nouvelleAbsDir, setNouvelleAbsDir] = useState({ eleveId: "", type: "Absence", date: "", motif: "" });

  const { depenses: depensesCtx, setDepenses } = useEcole() || {};
  const depenses = Array.isArray(depensesCtx) ? depensesCtx : [];
  const [depForm, setDepForm] = useState({ libelle: "", montant: "", date: new Date().toISOString().slice(0, 10), note: "" });
  const [depEditId, setDepEditId] = useState(null);
  const ajouterDepense = () => {
    const libelle = (depForm.libelle || "").trim();
    const montant = Number(depForm.montant);
    if (!libelle || !(montant > 0)) { alert("Saisissez un libellé et un montant valide."); return; }
    const date = depForm.date || new Date().toISOString().slice(0, 10);
    const note = (depForm.note || "").trim();
    let next;
    if (depEditId) {
      next = (depenses || []).map((d) => d.id === depEditId ? { ...d, libelle, montant, date, note } : d);
      journaliser(`Modification dépense ${montant} F — ${libelle}`, "directeur");
      setDepEditId(null);
    } else {
      next = [{ id: "dep-" + Date.now(), libelle, montant, date, note }, ...(depenses || [])];
      journaliser(`Dépense ${montant} F — ${libelle}`, "directeur");
    }
    setDepenses(next);
    ecrireDepenses(next);
    setDepForm({ libelle: "", montant: "", date: new Date().toISOString().slice(0, 10), note: "" });
  };
  const commencerModifierDepense = (d) => {
    if (!d) return;
    setDepEditId(d.id);
    setDepForm({
      libelle: d.libelle || "",
      montant: d.montant != null ? String(d.montant) : "",
      date: d.date || new Date().toISOString().slice(0, 10),
      note: d.note || "",
    });
  };
  const annulerModifierDepense = () => {
    setDepEditId(null);
    setDepForm({ libelle: "", montant: "", date: new Date().toISOString().slice(0, 10), note: "" });
  };
  const supprimerDepense = (id) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    const next = (depenses || []).filter((d) => d.id !== id);
    setDepenses(next);
    ecrireDepenses(next);
    if (depEditId === id) {
      setDepEditId(null);
      setDepForm({ libelle: "", montant: "", date: new Date().toISOString().slice(0, 10), note: "" });
    }
  };
  const [nouvelleAnnonce, setNouvelleAnnonce] = useState("");
  const [annonceEnEdition, setAnnonceEnEdition] = useState(null);
  const [confirmationValidation, setConfirmationValidation] = useState(null);
  const [rechercheBibliotheque, setRechercheBibliotheque] = useState("");
  const [filtreBibliotheque, setFiltreBibliotheque] = useState("en_attente");
  const modifierAnnonce = (index, cle, valeur) => {
    setAnnonces((prev) => prev.map((a, i) => i === index ? { ...a, [cle]: valeur } : a));
  };
  const supprimerAnnonce = (index) => {
    setAnnonces((prev) => prev.filter((_, i) => i !== index));
  };

  const stats = useMemo(() => {
    const total = eleves.length;
    const dus = eleves.reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + (Number(f.du) || 0), 0), 0);
    const payes = eleves.reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + (Number(f.paye) || 0), 0), 0);
    // Reste = somme des restes par frais (ne jamais négatif par ligne)
    const reste = eleves.reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + Math.max(0, (Number(f.du) || 0) - (Number(f.paye) || 0)), 0), 0);
    const totalDepenses = (depenses || []).reduce((s, d) => s + (Number(d.montant) || 0), 0);
    // Disponible = collecté moins dépenses (peut être négatif si dépenses > encaissements)
    const disponible = payes - totalDepenses;
    return { total, dus, payes, reste, totalDepenses, disponible };
  }, [eleves, depenses]);

  const enAttente = demandes.filter((d) => d.statut === "en_attente").length;

  const valider = (demande) => {
    if (demande.statut === "validee") {
      window.alert("Cette demande est déjà validée" + (demande.codeEleve ? (" — code " + demande.codeEleve) : ""));
      return;
    }
    const codeGenere = genererCodeEleve((eleves || []).map((e) => e.id));
    // Marquer VALIDÉE (ne plus laisser « en attente ») + créer l'élève
    setDemandes((prev) => prev.map((d) => d.id === demande.id
      ? { ...d, statut: "validee", codeEleve: codeGenere }
      : d));
    setEleves((prev) => {
      const existe = prev.some((e) =>
        e.prenom === demande.prenom && e.nom === demande.nom && e.naissance === demande.naissance
      );
      if (existe) return prev;
      return [
        ...prev,
        {
          id: codeGenere,
          nom: demande.nom,
          prenom: demande.prenom,
          sexe: demande.sexe || null,
          classe: demande.classeSouhaitee,
          naissance: demande.naissance,
          notes: [],
          absences: [],
          frais: fraisTypes.filter((f) => !f.classe || f.classe === demande.classeSouhaitee).map((f) => ({ libelle: f.libelle, du: f.montant, paye: 0 })),
          messages: [],
          parent: { nom: demande.parrainNom, telephone: demande.parrainTelephone },
          enseignant: "À affecter",
        },
      ];
    });
    setConfirmationValidation({ nom: `${demande.prenom} ${demande.nom}`, code: codeGenere });
    journaliser(`Validation inscription ${demande.prenom} ${demande.nom} → code ${codeGenere}`, "directeur");
  };

  const refuser = (demande) => {
    setDemandes((prev) => prev.map((d) => d.id === demande.id ? { ...d, statut: "refusee" } : d));
  };
  const modifierDemande = (demande) => {
    if (!demande) return;
    // Toutes les infos de la demande sont modifiables (pas seulement nom/classe)
    const newPrenom = prompt("Prénom de l'élève :", demande.prenom || "");
    if (newPrenom === null) return;
    const newNom = prompt("Nom de l'élève :", demande.nom || "");
    if (newNom === null) return;
    const newSexe = prompt("Sexe (M ou F) :", demande.sexe || "");
    if (newSexe === null) return;
    const newNaissance = prompt("Date de naissance (ex. 12/05/2018) :", demande.naissance || "");
    if (newNaissance === null) return;
    const classeActuelle = demande.classeSouhaitee || demande.classe || "";
    const newClasse = prompt("Classe :", classeActuelle);
    if (newClasse === null) return;
    const newParrain = prompt("Nom du parent / tuteur :", demande.parrainNom || "");
    if (newParrain === null) return;
    const newTel = prompt("Téléphone du parent / tuteur :", demande.parrainTelephone || "");
    if (newTel === null) return;
    const newMsg = prompt("Message / remarque :", demande.message || "");
    if (newMsg === null) return;

    const prenom = newPrenom.trim() || demande.prenom || "";
    const nom = newNom.trim() || demande.nom || "";
    const sexe = (newSexe || "").trim() || demande.sexe || "";
    const naissance = (newNaissance || "").trim() || demande.naissance || "";
    const classe = newClasse.trim() || classeActuelle;
    const parrainNom = newParrain.trim() || demande.parrainNom || "";
    const parrainTelephone = newTel.trim() || demande.parrainTelephone || "";
    const message = newMsg.trim();

    setDemandes((prev) => prev.map((d) => String(d.id) === String(demande.id) ? {
      ...d,
      prenom,
      nom,
      sexe,
      naissance,
      classeSouhaitee: classe,
      parrainNom,
      parrainTelephone,
      message,
    } : d));

    // Si déjà validée → mettre à jour aussi la fiche élève liée
    const codeLie = demande.codeEleve || null;
    setEleves((prev) => prev.map((e) => {
      const lie = codeLie && String(e.id) === String(codeLie);
      if (!lie) return e;
      return {
        ...e,
        prenom,
        nom,
        sexe,
        naissance,
        classe,
        parent: {
          ...(e.parent || {}),
          nom: parrainNom,
          telephone: parrainTelephone,
        },
      };
    }));

    try {
      setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400);
    } catch (err) {}
    journaliser(`Modification demande ${prenom} ${nom} — classe ${classe}`, "directeur");
    alert("Modifications enregistrées :\n• " + prenom + " " + nom + "\n• Naissance : " + (naissance || "—") + "\n• Classe : " + classe + "\n• Parent : " + parrainNom + " (" + parrainTelephone + ")");
  };

const supprimerDemande = (demande) => {
  if(!confirm("Supprimer définitivement " + demande.nom + " ? Même si Validée, elle sera effacée.")) return;
  setDemandes((prev) => prev.filter((d) => d.id !== demande.id));
};

  // --- Classes : ajout, édition en ligne, suppression ---
  const [nouvelleClasse, setNouvelleClasse] = useState("");
  const [classeEnEdition, setClasseEnEdition] = useState(null); // index en cours d'édition

  const ajouterClasse = () => {
    const nom = nouvelleClasse.trim();
    if (!nom || classes.includes(nom)) return;
    setClasses((prev) => [...prev, nom]);
    setNouvelleClasse("");
  };

  const renommerClasse = (index, nouveauNom) => {
    const nom = nouveauNom.trim();
    if (!nom) return;
    const ancienNom = classes[index];
    setClasses((prev) => prev.map((c, i) => (i === index ? nom : c)));
    setEleves((prev) => prev.map((e) => e.classe === ancienNom ? { ...e, classe: nom } : e));
    if (ancienNom !== nom) {
      setMatieresParClasse((prev) => {
        const { [ancienNom]: anciennesMatieres, ...reste } = prev;
        return anciennesMatieres ? { ...reste, [nom]: anciennesMatieres } : prev;
      });
    }
  };

  const [classeASupprimer, setClasseASupprimer] = useState(null); // index en attente de confirmation

  const supprimerClasse = (index) => {
    const nomClasse = classes[index];
    const nbEleves = eleves.filter((e) => e.classe === nomClasse).length;
    if (nbEleves > 0 && classeASupprimer !== index) {
      setClasseASupprimer(index);
      return;
    }
    setClasses((prev) => prev.filter((_, i) => i !== index));
    setClasseASupprimer(null);
  };

  // --- Matières par classe : une section par classe, chacune avec son propre ajout/édition/suppression ---
  const [nouvellesMatieresParClasse, setNouvellesMatieresParClasse] = useState({}); // { [classe]: { nom, coef } }

  const champNouvelleMatiere = (classe, cle, valeur) => {
    setNouvellesMatieresParClasse((prev) => ({
      ...prev,
      [classe]: { nom: "", coef: 1, ...prev[classe], [cle]: valeur },
    }));
  };

  const ajouterMatiereClasse = (classe) => {
    const saisie = nouvellesMatieresParClasse[classe] || { nom: "", coef: 1 };
    const nom = saisie.nom.trim();
    if (!nom) return;
    setMatieresParClasse((prev) => {
      const liste = prev[classe] || [];
      if (liste.some((m) => String(m.nom || "").trim().toLowerCase() === nom.toLowerCase())) return prev;
      return dedupeMatieresParClasse({
        ...prev,
        [classe]: [...liste, { nom, coef: Number(saisie.coef) || 1 }],
      });
    });
    setNouvellesMatieresParClasse((prev) => ({ ...prev, [classe]: { nom: "", coef: 1 } }));
  };

  const modifierMatiereClasse = (classe, index, cle, valeur) => {
    setMatieresParClasse((prev) => ({
      ...prev,
      [classe]: (prev[classe] || []).map((m, i) => i === index ? { ...m, [cle]: cle === "coef" ? Number(valeur) || 1 : valeur } : m),
    }));
  };

  const supprimerMatiereClasse = (classe, index) => {
    setMatieresParClasse((prev) => ({
      ...prev,
      [classe]: (prev[classe] || []).filter((_, i) => i !== index),
    }));
  };

  // --- Frais scolaires : catalogue de l'année en cours ---
  const [nouveauFrais, setNouveauFrais] = useState({ libelle: "", montant: "", classe: "toutes" });

  const ajouterFrais = () => {
    if (!nouveauFrais.libelle.trim()) return;
    const nouveau = { libelle: nouveauFrais.libelle.trim(), montant: Number(nouveauFrais.montant) || 0, classe: nouveauFrais.classe === "toutes" ? null : nouveauFrais.classe };
    if (fraisTypes.some((f) => f.libelle.trim().toLowerCase() === nouveau.libelle.toLowerCase() && (f.classe || null) === nouveau.classe)) return;
    setFraisTypes((prev) => [...prev, nouveau]);
    setEleves((prev) => prev.map((e) => (nouveau.classe && e.classe !== nouveau.classe) || (e.frais || []).find((ff) => ff.libelle === nouveau.libelle) ? e : { ...e, frais: [...(e.frais || []), { libelle: nouveau.libelle, du: nouveau.montant, paye: 0, mode: null, datePaiement: null }] }));
    setNouveauFrais({ libelle: "", montant: "", classe: "toutes" });
  };

  const modifierFrais = (index, cle, valeur) => {
    const ancienne = fraisTypes[index];
    const nouvelleVal = cle === "montant" ? Number(valeur) || 0 : (cle === "classe" && valeur === "toutes" ? null : valeur);
    setFraisTypes((prev) => prev.map((f, i) => i === index ? { ...f, [cle]: nouvelleVal } : f));
    if (!ancienne) return;
    // Propager le montant aux élèves concernés (même libellé + classe)
    if (cle === "montant") {
      setEleves((prev) => prev.map((e) => {
        const concerne = !ancienne.classe || ancienne.classe === e.classe;
        if (!concerne) return e;
        return {
          ...e,
          frais: (e.frais || []).map((ff) => ff.libelle === ancienne.libelle ? { ...ff, du: Number(valeur) || 0 } : ff),
        };
      }));
    }
  };

  const supprimerFrais = (index) => {
    const rubrique = fraisTypes[index];
    const libelle = (rubrique?.libelle || "").trim().toLowerCase();
    const classeCible = rubrique?.classe || null;
    setFraisTypes((prev) => prev.filter((_, i) => i !== index));
    if (libelle) {
      setEleves((prev) => prev.map((e) => {
        if (classeCible && e.classe !== classeCible) return e;
        return {
          ...e,
          frais: (e.frais || []).filter((f) => String(f.libelle || "").trim().toLowerCase() !== libelle),
        };
      }));
    }
  };

  // --- Personnel : ajout, édition, suppression ---
  const [personnelEnEdition, setPersonnelEnEdition] = useState(null);
  const [baremesTick, setBaremesTick] = useState(0);
  const [calTick, setCalTick] = useState(0);
  const [bullTick, setBullTick] = useState(0);
  const [passagesTick, setPassagesTick] = useState(0);
  const [nouvelEvtCal, setNouvelEvtCal] = useState({ titre: "", dateDebut: "", dateFin: "", type: "evenement", classe: "toutes" });
  const [filtreBullClasse, setFiltreBullClasse] = useState("toutes");
  const [filtreActivite, setFiltreActivite] = useState("tous");
  const [activiteTick, setActiviteTick] = useState(0);
  const [plateformeActiveEtat, setPlateformeActiveEtat] = useState(() => lirePlateformeActive());
  const baremesActuels = useMemo(() => lireBaremes(), [baremesTick, classes]);
  const definirBaremeClasse = (classe, valeur) => {
    if (!classe) return;
    const o = { ...lireBaremes(), [classe]: valeur };
    try { if (typeof window !== "undefined") window.__cspBaremes = o; } catch (e) {}
    ecrireBaremes(o);
    setBaremesTick((t) => t + 1);
  };
  const basculerPlateforme = (ouvrir) => {
    if (!isFondateur) return;
    const msg = ouvrir
      ? "Reconnecter la plateforme ?\n\nEnseignants, parents, secrétaire et directeur pourront à nouveau se connecter."
      : "Déconnecter toute la plateforme ?\n\nSeul le Fondateur restera connecté.\nLes autres seront refusés à la connexion (message vacances si renseigné).";
    if (!window.confirm(msg)) return;
    ecrirePlateformeActive(ouvrir);
    setPlateformeActiveEtat(ouvrir);
    try {
      journaliser(ouvrir ? "Plateforme reconnectée" : "Plateforme déconnectée", "fondateur", { reussi: true, detail: ouvrir ? "ouverte" : "fermée" });
    } catch (e) {}
    setActiviteTick((t) => t + 1);
    try {
      window.alert(ouvrir
        ? "Plateforme reconnectée. Les autres rôles peuvent à nouveau entrer."
        : "Plateforme fermée. Sur les autres téléphones, l'effet s'applique après actualisation (quelques secondes). Vous seul (Fondateur) continuez.");
    } catch (e) {}
  };
  const [rolesBloquesEtat, setRolesBloquesEtat] = useState(() => lireRolesBloques());
  const basculerBlocageRole = (role) => {
    setRolesBloquesEtat((prev) => {
      const next = { ...(prev || {}) };
      next[role] = !next[role];
      ecrireRolesBloques(next);
      try { journaliser((next[role] ? "Blocage" : "Déblocage") + " rôle " + role, "fondateur"); } catch (e) {}
      return next;
    });
  };
  const basculerBlocageEnseignantClasse = (classe) => {
    if (!classe) return;
    setRolesBloquesEtat((prev) => {
      const next = { ...(prev || {}), enseignants: { ...((prev && prev.enseignants) || {}) } };
      next.enseignants[classe] = !next.enseignants[classe];
      ecrireRolesBloques(next);
      try { journaliser((next.enseignants[classe] ? "Blocage" : "Déblocage") + " enseignant " + classe, "fondateur"); } catch (e) {}
      return next;
    });
  };
  const changerCodeRoleFondateur = (role) => {
    const actuel = String((codes && codes[role]) || "").trim();
    const saisie = window.prompt(
      "Nouveau code pour « " + role + " » (laissez vide pour annuler) :",
      actuel
    );
    if (saisie == null) return;
    const v = String(saisie).trim();
    if (!v) return;
    if (v.length < 4) { window.alert("Code trop court (min. 4 caractères)."); return; }
    try { if (typeof window !== "undefined" && window.__cspMarquerEcoleEdit) window.__cspMarquerEcoleEdit(); } catch (e) {}
    setCodes((prev) => {
      const next = { ...(prev || {}), [role]: v };
      return next;
    });
    window.alert("Code « " + role + " » mis à jour. L'ancien code ne fonctionnera plus après synchronisation.");
  };
  const changerCodeEnseignantClasse = (classe) => {
    if (!classe) return;
    let map = (codes && codes.enseignants) || {};
    if (typeof map === "string") { try { map = JSON.parse(map); } catch (e) { map = {}; } }
    const actuel = String(map[classe] || "").trim();
    const saisie = window.prompt("Nouveau code enseignant pour la classe « " + classe + " » :", actuel);
    if (saisie == null) return;
    const v = String(saisie).trim();
    if (!v) return;
    setCodes((prev) => {
      let ens = (prev && prev.enseignants) || {};
      if (typeof ens === "string") { try { ens = JSON.parse(ens); } catch (e) { ens = {}; } }
      return { ...(prev || {}), enseignants: { ...ens, [classe]: v } };
    });
    window.alert("Code enseignant « " + classe + " » mis à jour.");
  };
  const [nouveauPersonnel, setNouveauPersonnel] = useState({ nom: "", poste: "Enseignant", classe: "—", telephone: "" });

  const ajouterPersonnel = () => {
    if (!nouveauPersonnel.nom.trim()) return;
    const nom = nouveauPersonnel.nom.trim();
    const deja = personnel.some((p) =>
      String(p.nom || "").trim().toLowerCase() === nom.toLowerCase()
      && String(p.poste || "") === String(nouveauPersonnel.poste || "")
      && String(p.classe || "") === String(nouveauPersonnel.classe || "")
    );
    if (deja) return;
    setPersonnel((prev) => dedupePersonnel([...prev, { ...nouveauPersonnel, nom }]));
    setNouveauPersonnel({ nom: "", poste: "Enseignant", classe: "—", telephone: "" });
  };

  const modifierPersonnel = (index, cle, valeur) => {
    setPersonnel((prev) => prev.map((p, i) => i === index ? { ...p, [cle]: valeur } : p));
  };

  const supprimerPersonnel = (index) => {
    setPersonnel((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Paramètres de l'école : identité et codes d'accès modifiables ---
  const champEcole = (cle) => (e) => {
    try { if (typeof window !== "undefined" && window.__cspMarquerEcoleEdit) window.__cspMarquerEcoleEdit(); } catch (err) {}
    setEcole({ ...ecole, [cle]: e.target.value });
  };
  const champCode = (role) => (e) => setCodes({ ...codes, [role]: e.target.value });

  // --- Messagerie administrative : diffusion à tout le personnel ou à une personne précise ---
  const { messagesInternes, setMessagesInternes, anneesArchivees, setAnneesArchivees, emploiDuTemps, setEmploiDuTemps } = useEcole();
  const [nouveauMessageInterne, setNouveauMessageInterne] = useState({ destinataire: "tous", texte: "" });

  const envoyerMessageInterne = () => {
    if (!nouveauMessageInterne.texte.trim()) return;
    setMessagesInternes((prev) => [
      { destinataire: nouveauMessageInterne.destinataire, texte: nouveauMessageInterne.texte.trim(), date: horodatageMsg() },
      ...prev,
    ]);
    setNouveauMessageInterne({ ...nouveauMessageInterne, texte: "" });
  };

  const [messageInterneEnEdition, setMessageInterneEnEdition] = useState(null);
  const modifierMessageInterne = (index, texte) => {
    if (!texte.trim()) return;
    setMessagesInternes((prev) => prev.map((m, i) => i === index ? { ...m, texte: texte.trim() } : m));
  };
  const supprimerMessageInterne = (index) => {
    setMessagesInternes((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Suivi pédagogique : vérifier à distance si chaque enseignant saisit bien notes/absences ---
  const { messagesParents, setMessagesParents } = useEcole();
  const suiviParClasse = useMemo(() => classes.map((c) => {
    const eleveClasse = eleves.filter((e) => e.classe === c);
    const enseignant = personnel.find((p) => p.classe === c && (p.poste === "Enseignant" || p.poste === "Enseignante"));
    const totalNotes = eleveClasse.reduce((s, e) => s + (e.notes || []).length, 0);
    const totalAbsences = eleveClasse.reduce((s, e) => s + (e.absences || []).length, 0);
    const toutesNotes = eleveClasse.flatMap((e) => e.notes || []);
    const derniereSaisie = toutesNotes.length ? toutesNotes[toutesNotes.length - 1].dateSaisie : null;
    return { classe: c, enseignant, nbEleves: eleveClasse.length, totalNotes, totalAbsences, derniereSaisie };
  }), [classes, eleves, personnel]);

  // --- Messages reçus des parents ---
  const [reponseParent, setReponseParent] = useState({}); // { [index]: texte }
  const marquerLu = (index) => {
    setMessagesParents((prev) => prev.map((m, i) => i === index ? { ...m, lu: true } : m));
  };
  const supprimerMessageParent = (index) => {
    const m = messagesParents[index];
    if (!m) return;
    if (!window.confirm("Supprimer ce message du parent ?")) return;
    setMessagesParents((prev) => prev.filter((_, i) => i !== index));
  };
  const repondreParent = (index, msg) => {
    const texte = (reponseParent[index] || "").trim();
    if (!texte) return;
    const date = horodatageMsg();
    if (!msg.eleveId) {
      window.alert("Impossible de répondre : élève non identifié. Demandez au parent de renvoyer le message.");
      return;
    }
    // Un seul exemplaire : conversation élève (parent le voit) — pas de doublon dans messagesParents
    setEleves((prev) => prev.map((e) => e.id === msg.eleveId
      ? { ...e, messages: [...(e.messages || []), { auteur: "Administration", texte, date }] }
      : e));
    setMessagesParents((prev) => prev.map((m, i) => i === index ? { ...m, lu: true } : m));
    setReponseParent((prev) => ({ ...prev, [index]: "" }));
  };

  // Écrire un message au parent sans attendre un message de sa part
  const [msgAdminEleveId, setMsgAdminEleveId] = useState("");
  const [msgAdminTexte, setMsgAdminTexte] = useState("");
  const envoyerMessageAuParent = () => {
    const texte = msgAdminTexte.trim();
    if (!msgAdminEleveId || !texte) return;
    const eleve = eleves.find((e) => e.id === msgAdminEleveId);
    if (!eleve) return;
    const date = horodatageMsg();
    // Un seul message (pas de copie dans messagesParents)
    setEleves((prev) => prev.map((e) => e.id === msgAdminEleveId
      ? { ...e, messages: [...(e.messages || []), { auteur: "Administration", texte, date }] }
      : e));
    setMsgAdminTexte("");
    try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400); } catch (err) {}
  };
  const supprimerMessageAdmin = (eleveId, date, texte, auteur) => {
    if (!window.confirm("Supprimer ce message envoyé au parent ? Il disparaîtra aussi de l'espace parent.")) return;
    const cible = { auteur, texte, date };
    marquerMessageSupprime(eleveId, cible);
    setEleves((prev) => prev.map((e) => {
      if (String(e.id) !== String(eleveId)) return e;
      return {
        ...e,
        messages: filtrerMessagesEleve(eleveId, (e.messages || []).filter((m) => !(
          String(m.auteur || "") === String(auteur || "")
          && String(m.date || "") === String(date || "")
          && String(m.texte || "") === String(texte || "")
        ))),
      };
    }));
    supprimerMessageEnBase(eleveId, cible).then(() => {
      try { if (window.__cspFlushEleves) window.__cspFlushEleves(); } catch (err) {}
    }).catch(() => {
      try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400); } catch (err) {}
    });
  };
  const modifierMessageAdmin = (eleveId, date, texte, auteur) => {
    const nouveau = window.prompt("Modifier le message :", texte || "");
    if (nouveau === null) return;
    const t = nouveau.trim();
    if (!t) return;
    const ancien = { auteur, texte, date };
    marquerMessageSupprime(eleveId, ancien); // l'ancienne version ne doit plus revenir de la base
    supprimerMessageEnBase(eleveId, ancien).catch(() => {});
    const dateN = horodatageMsg();
    setEleves((prev) => prev.map((e) => {
      if (String(e.id) !== String(eleveId)) return e;
      return {
        ...e,
        messages: filtrerMessagesEleve(eleveId, (e.messages || []).map((m) => (
          String(m.auteur || "") === String(auteur || "")
          && String(m.date || "") === String(date || "")
          && String(m.texte || "") === String(texte || "")
        ) ? { ...m, texte: t, date: dateN } : m)),
      };
    }));
    try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400); } catch (err) {}
  };

  // --- Suppression d'un élève (directeur / fondateur) — y compris déjà validé ---
  const supprimerEleve = (eleve) => {
    const msg = `Supprimer définitivement ${eleve.prenom} ${eleve.nom} (${eleve.id}) ?\n\nNotes, absences, frais et messages de cet élève seront effacés de l'année en cours.`;
    if (!window.confirm(msg)) return;
    const idSuppr = String(eleve.id);
    archiverEleveSupprime(eleve);
    marquerElevesSupprimes([idSuppr]);
    journaliser(`Suppression élève ${eleve.prenom || ""} ${eleve.nom || ""} (${idSuppr})`, "directeur");
    setEleves((prev) => {
      const next = (prev || []).filter((e) => String(e.id) !== idSuppr);
      try {
        const cache = lireStockageLocal() || {};
        ecrireStockageLocal({ ...cache, eleves: next, sauvegardeLe: new Date().toISOString() });
      } catch (e) {}
      return next;
    });
    // Flag pour forcer le sync suppression (liste noire déjà en localStorage)
    try {
      if (typeof window !== "undefined") {
        window.__cspElevesASupprimer = [...new Set([...(window.__cspElevesASupprimer || []).map(String), idSuppr])];
        window.__cspForceSyncSuppression = Date.now();
      }
    } catch (e) {}
  };

  // --- Clôture de l'année scolaire : archive les résultats, ouvre une nouvelle année vierge ---
  const [nouvelleAnneeLabel, setNouvelleAnneeLabel] = useState("");
  const [confirmationCloture, setConfirmationCloture] = useState(null);
  const [demandeConfirmationCloture, setDemandeConfirmationCloture] = useState(false);
  const [erreurCloture, setErreurCloture] = useState("");

  const demarrerCloture = () => {
    const label = nouvelleAnneeLabel.trim();
    if (!label) { setErreurCloture("Indique d'abord le nom de la nouvelle année (ex. 2027-2028)."); return; }
    setErreurCloture("");
    setDemandeConfirmationCloture(true);
  };

  const cloturerAnnee = () => {
    const label = nouvelleAnneeLabel.trim();
    if (!label) return;
    const ancienne = anneeScolaire;
    const snapshotEleves = eleves.map((e) => ({ ...e, notes: [...(e.notes || [])], absences: [...(e.absences || [])], frais: [...(e.frais || [])], messages: [...(e.messages || [])], decision: e.decision || null }));
    const archivesNext = [{ annee: ancienne, eleves: snapshotEleves, dateArchivage: horodatageMsg() }, ...(anneesArchivees || [])];
    setAnneesArchivees(archivesNext);
    // Nouvelle année = tout vide (réinscriptions, notes, frais payés à reprendre)
    if (typeof window !== "undefined") {
      try { window.__cspAnneeVierge = true; window.__cspAnneeViergeDepuis = Date.now(); } catch (e) {}
    }
    setEleves([]);
    setMessagesParents([]);
    setDemandes([]);
    setAnnonces([]);
    setMessagesInternes([]);
    setConfirmationCloture({ ancienneAnnee: ancienne, nouvelleAnnee: label, nbEleves: snapshotEleves.length });
    setAnneeScolaire(label);
    setNouvelleAnneeLabel("");
    setDemandeConfirmationCloture(false);
    // Envoi immédiat en base (archive + vidage élèves / messages / demandes / annonces)
    try {
      if (typeof SUPABASE_CONFIGURE !== "undefined" && SUPABASE_CONFIGURE) {
        Promise.all([
          syncAnneesArchivees(archivesNext),
          syncEleves([], { vider: true }),
          syncMessagesParents([]),
          syncDemandes([]),
          syncAnnonces([]),
          syncMessagesInternes([]),
        ]).then(() => {
          try { if (typeof window !== "undefined" && window.__cspFlushEleves) window.__cspFlushEleves(); } catch (e2) {}
        }).catch((err) => {
          console.warn("Clôture année — sync base:", err);
          try { alert("Clôture enregistrée ici, mais l'envoi vers la base a échoué. Vérifiez Internet."); } catch (e3) {}
        });
      }
    } catch (err) {
      console.warn("Clôture année — sync base:", err);
    }
    try { journaliser("Clôture année " + ancienne + " → " + label, isFondateur ? "fondateur" : "directeur", { detail: String(snapshotEleves.length) + " élèves archivés" }); } catch (e) {}
    // Les propositions de passage (_passages) ne sont PAS effacées : validation possible en nouvelle année.
    try { alert("Année clôturée. Les propositions de passage restent disponibles dans « Validation de passage »."); } catch (e) {}
  };


  const [rechercheElevesDir, setRechercheElevesDir] = useState("");

  const basculerBlocageEleve = (eleve) => {
    if (!eleve || !eleve.id) return;
    const seraBloque = !eleve.accesParentBloque;
    const msg = seraBloque
      ? ("Bloquer temporairement l'accès parent pour " + (eleve.prenom || "") + " " + (eleve.nom || "") + " ?\n\nLe parent qui saisit le code verra un message d'accès suspendu.")
      : ("Débloquer l'accès parent pour " + (eleve.prenom || "") + " " + (eleve.nom || "") + " ?");
    if (!window.confirm(msg)) return;
    setEleves((prev) => (prev || []).map((e) =>
      String(e.id) === String(eleve.id) ? { ...e, accesParentBloque: seraBloque } : e
    ));
    try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400); } catch (err) {}
    try { journaliser((seraBloque ? "Blocage" : "Déblocage") + " accès parent " + (eleve.id || ""), isFondateur ? "fondateur" : "directeur"); } catch (err) {}
  };

  /** Modifier la fiche d'un élève déjà inscrit (même hors Bibliothèque). */
  const modifierEleve = (eleve) => {
    if (!eleve) return;
    const newPrenom = prompt("Prénom de l'élève :", eleve.prenom || "");
    if (newPrenom === null) return;
    const newNom = prompt("Nom de famille :", eleve.nom || "");
    if (newNom === null) return;
    const newSexe = prompt("Sexe (M ou F) :", eleve.sexe || "");
    if (newSexe === null) return;
    const newNaissance = prompt("Date de naissance (AAAA-MM-JJ) :", eleve.naissance || "");
    if (newNaissance === null) return;
    const newClasse = prompt("Classe :", eleve.classe || "");
    if (newClasse === null) return;
    const newParrain = prompt("Nom du parent / tuteur :", (eleve.parent && eleve.parent.nom) || "");
    if (newParrain === null) return;
    const newTel = prompt("Téléphone du parent :", (eleve.parent && eleve.parent.telephone) || "");
    if (newTel === null) return;

    const prenom = newPrenom.trim() || eleve.prenom || "";
    const nom = newNom.trim() || eleve.nom || "";
    const sexe = (newSexe || "").trim() || eleve.sexe || "";
    const naissance = (newNaissance || "").trim() || eleve.naissance || "";
    const classe = newClasse.trim() || eleve.classe || "";
    const parrainNom = newParrain.trim() || (eleve.parent && eleve.parent.nom) || "";
    const parrainTelephone = newTel.trim() || (eleve.parent && eleve.parent.telephone) || "";

    setEleves((prev) => prev.map((e) => String(e.id) === String(eleve.id) ? {
      ...e,
      prenom,
      nom,
      sexe,
      naissance,
      classe,
      parent: { ...(e.parent || {}), nom: parrainNom, telephone: parrainTelephone },
    } : e));

    // Mettre à jour la demande liée en Bibliothèque si elle existe (code élève)
    setDemandes((prev) => (prev || []).map((d) => {
      const lie = d.codeEleve && String(d.codeEleve) === String(eleve.id);
      const memeNom = !d.codeEleve && String(d.prenom || "").toLowerCase() === String(eleve.prenom || "").toLowerCase()
        && String(d.nom || "").toLowerCase() === String(eleve.nom || "").toLowerCase();
      if (!lie && !memeNom) return d;
      return {
        ...d,
        prenom,
        nom,
        sexe,
        naissance,
        classeSouhaitee: classe,
        parrainNom,
        parrainTelephone,
      };
    }));

    try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400); } catch (err) {}
    journaliser(`Modification élève ${prenom} ${nom} (${eleve.id}) — classe ${classe}`, "directeur");
    alert("Fiche élève mise à jour :\\n• " + prenom + " " + nom + "\\n• Code : " + eleve.id + "\\n• Classe : " + classe + "\\n• Parent : " + parrainNom + " (" + parrainTelephone + ")");
  };

  const nav = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "bibliotheque", label: "Bibliothèque", icon: Inbox },
    { id: "vueClasse", label: "Vue par Classe", icon: School },
    { id: "listesClasse", label: "Listes de classe", icon: ClipboardList },
    { id: "bilanClasses", label: "Bilan par classe", icon: Wallet },
    { id: "depenses", label: "Dépenses", icon: Wallet },
    { id: "situationFinanciere", label: "Situation financière", icon: Wallet },
    { id: "eleves", label: "Élèves", icon: GraduationCap },
    { id: "effectifs", label: "Garçons / Filles", icon: Users },
    { id: "absences", label: "Absences", icon: CalendarClock },
    { id: "infoParents", label: "Info parents", icon: User },
    { id: "suivi", label: "Suivi pédagogique", icon: CheckCircle2 },
    { id: "bulletins", label: "Validation bulletins", icon: FileText },
    { id: "passages", label: "Validation de passage", icon: GraduationCap },
    { id: "evaluation", label: "Évaluation & rangs", icon: GraduationCap },
    { id: "calendrier", label: "Calendrier scolaire", icon: CalendarClock },
    { id: "classes", label: "Classes", icon: School },
    { id: "matieres", label: "Matières", icon: FileText },
    { id: "emploi", label: "Emploi du temps", icon: CalendarClock },
    { id: "frais", label: "Frais scolaires", icon: Wallet },
    { id: "annee", label: "Année scolaire", icon: CalendarClock },
    { id: "personnel", label: "Personnel", icon: Users },
    { id: "messagePublic", label: "Message Public", icon: Megaphone },
    { id: "messageInterne", label: "Message Interne", icon: MessageSquare },
    { id: "messagesParents", label: "Messages parents", icon: MessageSquare },
    { id: "activite", label: "Qui s'est connecté", icon: ClipboardList },
    { id: "parametres", label: "Paramètres", icon: Settings },
  ];

  return (
    <Coquille role="directeur" roleLabel={isFondateur ? "Espace Fondateur" : "Espace Administratif"} nav={nav} actif={onglet} setActif={setOnglet}
              onQuitter={onQuitter || (() => {})}>
      {onglet === "dashboard" && (
        <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Élèves inscrits" value={(eleves && eleves.length) ? stats.total : "…"} tone="ardoise" />
            <Stat label="Classes actives" value={(classes && classes.length) ? classes.length : "…"} tone="ardoise" />
            <Stat label="Demandes en attente" value={enAttente} tone="or" />
            <Stat label="Frais dus" value={`${stats.dus.toLocaleString("fr-FR")} F`} tone="or" />
            <Stat label="Frais collectés" value={`${stats.payes.toLocaleString("fr-FR")} F`} tone="vert" />
            <Stat label="Frais restants" value={`${stats.reste.toLocaleString("fr-FR")} F`} tone="or" />
            <Stat label="Dépenses" value={`${(stats.totalDepenses || 0).toLocaleString("fr-FR")} F`} tone="or" />
            <Stat label="Net (collecté − dépenses)" value={`${(stats.disponible || 0).toLocaleString("fr-FR")} F`} tone={(stats.disponible || 0) >= 0 ? "vert" : "or"} />
          </div>
          <p className="mt-2 text-[13px]" style={{ color: "#5C5240" }}>
            Les <b>dépenses</b> enregistrées dans l&apos;onglet Dépenses sont déduites du montant collecté.
            Net = frais collectés − dépenses.
          </p>
          <Panel title="Identité de l'établissement" icon={ShieldCheck}
                 actions={<Btn variant="ghost" icon={Settings} small onClick={() => setOnglet("parametres")}>Modifier</Btn>}>
            <div className="grid grid-cols-2 gap-3 text-[15px] sm:grid-cols-3" style={{ color: "#3E3625" }}>
              <div><span style={{ color: "#9A8B67" }}>Nom : </span>{ecole.nom}</div>
              <div><span style={{ color: "#9A8B67" }}>Année scolaire : </span>{anneeScolaire}</div>
              <div><span style={{ color: "#9A8B67" }}>Quartier : </span>{ecole.quartier}</div>
              <div><span style={{ color: "#9A8B67" }}>Commune : </span>{ecole.commune}</div>
              <div><span style={{ color: "#9A8B67" }}>Département : </span>{ecole.departement}</div>
              <div><span style={{ color: "#9A8B67" }}>Directeur : </span>{ecole.directeur}</div>
              <div><span style={{ color: "#9A8B67" }}>Téléphone : </span>{ecole.telephone}</div>
            </div>
          </Panel>
        </>
      )}


            {onglet === "situationFinanciere" && (
        <Panel title="Situation financière — frais scolaires" icon={Wallet}>
          <PanneauSituationFinanciere eleves={eleves || []} classes={classes || []} fraisTypes={fraisTypes || []} />
        </Panel>
      )}

{onglet === "eleves" && (
        <Panel title="Liste des élèves" icon={GraduationCap}
               actions={
                 <div className="flex flex-wrap items-center gap-2">
                   <Badge tone="ardoise">{eleves.length} inscrit{eleves.length > 1 ? "s" : ""}</Badge>
                   <Btn variant="gold" small icon={ClipboardList} onClick={() => {
                     const t = texteListeTousEleves(eleves);
                     if (navigator.clipboard && navigator.clipboard.writeText) {
                       navigator.clipboard.writeText(t).then(() => alert("Liste copiée !")).catch(() => prompt("Copiez :", t));
                     } else prompt("Copiez :", t);
                   }}>Copier</Btn>
                   <Btn variant="ghost" small icon={FileText} onClick={() => imprimerListeTousEleves(eleves, ecole)}>Imprimer</Btn>
                 </div>
               }>
          <p className="mb-3 text-[14px] font-semibold" style={{ color: "#5C5240" }}>
            Ici se trouvent <b>tous les élèves inscrits</b> (même s&apos;ils n&apos;apparaissent plus dans la Bibliothèque).
            Recherchez par nom, modifiez les infos ou supprimez. Ordre alphabétique (nom de famille).
          </p>
          <div className="mb-3">
            <input
              type="search"
              value={rechercheElevesDir}
              onChange={(ev) => setRechercheElevesDir(ev.target.value)}
              placeholder="Rechercher un élève (nom, prénom, code, classe, parent…)"
              className="w-full rounded-lg border px-3 py-2.5 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8", background: "#FFFEFA" }}
            />
          </div>
          <div className="space-y-2">
            {eleves.length === 0 && <p className="text-[14px]" style={{ color: "#9A8B67" }}>Aucun élève pour le moment.</p>}
            {trierElevesAlpha(eleves)
              .filter((e) => {
                const q = (rechercheElevesDir || "").trim().toLowerCase();
                if (!q) return true;
                const blob = `${e.prenom || ""} ${e.nom || ""} ${e.id || ""} ${e.classe || ""} ${(e.parent && e.parent.nom) || ""} ${(e.parent && e.parent.telephone) || ""} ${e.sexe || ""}`.toLowerCase();
                return blob.includes(q);
              })
              .map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex min-w-0 items-center gap-3">
                  {(() => {
                    const ph = e.photoUrl || lirePhotosEleves()[String(e.id)] || null;
                    return ph ? (
                      <img src={ph} alt="" className="h-12 w-12 rounded-full object-cover" style={{ border: "2px solid #0EA5E9" }} />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full text-[13px] font-bold" style={{ background: "#E0F2FE", color: "#0369A1" }}>
                        {(e.prenom || "?")[0]}{(e.nom || "?")[0]}
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <div className="font-bold text-[16px]" style={{ color: "#1B2A4A" }}>
                      {e.prenom} {e.nom}
                      {e.accesParentBloque && (
                        <span className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: "#FEE2E2", color: "#991B1B" }}>Bloqué parent</span>
                      )}
                    </div>
                    <div className="text-[13px]" style={{ color: "#5C5240" }}>{e.classe} · code {e.id} · {(e.notes || []).length} notes · {(e.frais || []).length} frais</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-semibold" style={{ background: "#0EA5E9", color: "#fff" }}>
                    <Image size={13} /> Photo
                    <input type="file" accept="image/*" className="hidden" onChange={(ev) => {
                      const fichier = ev.target.files && ev.target.files[0];
                      if (!fichier) return;
                      compresserPhotoEleve(fichier).then(async (dataUrl) => {
                        ecrirePhotoEleve(e.id, dataUrl);
                        setEleves((prev) => {
                          const next = prev.map((x) => String(x.id) === String(e.id) ? { ...x, photoUrl: dataUrl } : x);
                          try {
                            const cache = lireStockageLocal() || {};
                            ecrireStockageLocal({ ...cache, eleves: next, sauvegardeLe: new Date().toISOString() });
                          } catch (err) {}
                          return next;
                        });
                        const okBase = await sauvegarderPhotoEleveEnBase(e.id, dataUrl);
                        try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 600); } catch (err) {}
                        if (!okBase) {
                          alert("Photo enregistrée sur cet appareil. Pour la partager aux parents, exécute dans Supabase :\nALTER TABLE eleves ADD COLUMN IF NOT EXISTS photo_url text;");
                        }
                      }).catch((err) => alert("Impossible de charger cette photo: " + (err && err.message ? err.message : "erreur")));
                      ev.target.value = "";
                    }} />
                  </label>
                  <Btn variant="ghost" small icon={Pencil} onClick={() => modifierEleve(e)}>Modifier</Btn>
                  {(isFondateur || true) && (
                    <Btn
                      variant={e.accesParentBloque ? "gold" : "ghost"}
                      small
                      icon={ShieldCheck}
                      onClick={() => basculerBlocageEleve(e)}
                    >
                      {e.accesParentBloque ? "Débloquer" : "Bloquer"}
                    </Btn>
                  )}
                  <Btn variant="danger" small icon={Trash2} onClick={() => supprimerEleve(e)}>Supprimer</Btn>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}


      {onglet === "effectifs" && (
        <Panel title="Effectifs — Garçons et filles" icon={Users}>
          <p className="mb-3 text-[14px]" style={{ color: "#5C5240" }}>
            Nombre et listes par sexe pour tout l&apos;établissement. Boutons Copier et Imprimer sur chaque liste.
          </p>
          {!(eleves && eleves.length) ? (
            <p className="rounded-xl border px-4 py-6 text-center text-[15px]" style={{ borderColor: "#E7DEC8", color: "#9A8B67" }}>
              Aucun élève chargé pour le moment. Actualisez la page ou vérifiez la connexion à la base.
            </p>
          ) : (
            <PanneauEffectifsSexe eleves={eleves || []} ecole={ecole || {}} setEleves={setEleves} demandes={demandes || []} />
          )}
        </Panel>
      )}

      {onglet === "absences" && (
        <Panel title="Module Absences — gestion école" icon={CalendarClock}>
          <p className="mb-3 text-[14px]" style={{ color: "#5C5240" }}>
            Vue globale des absences et retards. Les enseignants saisissent aussi depuis leur espace classe.
            Types : Absence, Retard, Permissionnaire, Malade, Sans motif.
          </p>

          {(() => {
            const TYPES = ["Absence", "Retard", "Permissionnaire", "Malade", "Sans motif"];
            // Liste plate de toutes les absences
            const lignes = [];
            (eleves || []).forEach((e) => {
              filtrerAbsencesEleve(e.id, e.absences || []).forEach((a, idx) => {
                lignes.push({
                  eleveId: e.id,
                  prenom: e.prenom,
                  nom: e.nom,
                  classe: e.classe,
                  index: idx,
                  date: a.date,
                  type: a.type || "Absence",
                  motif: a.motif || "",
                  cle: cleAbsObj(a),
                });
              });
            });
            // Tri date décroissante
            lignes.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
            const q = (rechercheAbs || "").trim().toLowerCase();
            const filtrees = lignes.filter((l) => {
              if (filtreAbsClasse !== "toutes" && l.classe !== filtreAbsClasse) return false;
              if (filtreAbsType !== "tous" && String(l.type).toLowerCase() !== String(filtreAbsType).toLowerCase()) return false;
              if (q) {
                const blob = `${l.nom} ${l.prenom} ${l.eleveId} ${l.motif}`.toLowerCase();
                if (!blob.includes(q)) return false;
              }
              return true;
            });
            const nbRetards = filtrees.filter((l) => String(l.type).toLowerCase().includes("retard")).length;
            const nbAbs = filtrees.length - nbRetards;

            const ajouterAbsDir = () => {
              const { eleveId, type, date, motif } = nouvelleAbsDir;
              if (!eleveId || !(date || "").trim()) {
                alert("Choisis un élève et une date.");
                return;
              }
              const nouvelle = {
                date: (typeof normaliserDateAbs === "function" ? normaliserDateAbs(date) : null) || date.trim(),
                type: (type || "Absence").trim(),
                motif: (motif || "").trim(),
              };
              const cle = cleAbsObj(nouvelle);
              let deja = false;
              setEleves((prev) => prev.map((el) => {
                if (String(el.id) !== String(eleveId)) return el;
                const existantes = dedupeAbsences(el.absences || []);
                if (existantes.some((x) => cleAbsObj(x) === cle)) {
                  deja = true;
                  return { ...el, absences: existantes };
                }
                return { ...el, absences: [...existantes, nouvelle] };
              }));
              if (deja) alert("Cette absence est déjà enregistrée.");
              else {
                setNouvelleAbsDir({ eleveId: "", type: "Absence", date: "", motif: "" });
                try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400); } catch (err) {}
              }
            };

            const supprimerAbsDir = (eleveId, absObj) => {
              if (!confirm("Supprimer cette absence / ce retard ?")) return;
              setEleves((prev) => prev.map((el) => {
                if (String(el.id) !== String(eleveId)) return el;
                marquerAbsenceSupprimee(eleveId, absObj);
                const next = (el.absences || []).filter((a) => cleAbsObj(a) !== cleAbsObj(absObj));
                return { ...el, absences: filtrerAbsencesEleve(eleveId, next) };
              }));
              try {
                if (typeof supprimerAbsenceEnBase === "function") {
                  supprimerAbsenceEnBase(eleveId, absObj).then(() => {
                    try { if (window.__cspFlushEleves) window.__cspFlushEleves(); } catch (e) {}
                  }).catch(() => {});
                } else {
                  setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400);
                }
              } catch (e) {}
            };

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl p-3 text-center" style={{ background: "#FEE2E2" }}>
                    <div className="text-[12px] font-medium" style={{ color: "#991B1B" }}>Total (filtre)</div>
                    <div className="text-xl font-bold" style={{ color: "#B91C1C" }}>{filtrees.length}</div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: "#FEF3C7" }}>
                    <div className="text-[12px] font-medium" style={{ color: "#92400E" }}>Absences</div>
                    <div className="text-xl font-bold" style={{ color: "#B45309" }}>{nbAbs}</div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: "#DBEAFE" }}>
                    <div className="text-[12px] font-medium" style={{ color: "#1E40AF" }}>Retards</div>
                    <div className="text-xl font-bold" style={{ color: "#1D4ED8" }}>{nbRetards}</div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: "#E0E7FF" }}>
                    <div className="text-[12px] font-medium" style={{ color: "#3730A3" }}>Élèves concernés</div>
                    <div className="text-xl font-bold" style={{ color: "#4338CA" }}>{new Set(filtrees.map((l) => l.eleveId)).size}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-end rounded-xl border p-3" style={{ borderColor: "#E7DEC8", background: "#FAF6EE" }}>
                  <div>
                    <div className="text-[12px] mb-1" style={{ color: "#5C5240" }}>Classe</div>
                    <select value={filtreAbsClasse} onChange={(ev) => setFiltreAbsClasse(ev.target.value)}
                      className="rounded-lg border px-2 py-2 text-[14px]" style={{ borderColor: "#E7DEC8" }}>
                      <option value="toutes">Toutes</option>
                      {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="text-[12px] mb-1" style={{ color: "#5C5240" }}>Type</div>
                    <select value={filtreAbsType} onChange={(ev) => setFiltreAbsType(ev.target.value)}
                      className="rounded-lg border px-2 py-2 text-[14px]" style={{ borderColor: "#E7DEC8" }}>
                      <option value="tous">Tous</option>
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="min-w-[12rem] flex-1">
                    <div className="text-[12px] mb-1" style={{ color: "#5C5240" }}>Recherche</div>
                    <input type="search" value={rechercheAbs} onChange={(ev) => setRechercheAbs(ev.target.value)}
                      placeholder="Nom, prénom, code…"
                      className="w-full rounded-lg border px-3 py-2 text-[14px]" style={{ borderColor: "#E7DEC8" }} />
                  </div>
                </div>

                <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: "#E7DEC8" }}>
                  <div className="font-bold text-[15px]" style={{ color: "#1B2A4A" }}>Enregistrer une absence / un retard</div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <select value={nouvelleAbsDir.eleveId} onChange={(ev) => setNouvelleAbsDir({ ...nouvelleAbsDir, eleveId: ev.target.value })}
                      className="rounded-lg border px-2 py-2 text-[14px]" style={{ borderColor: "#E7DEC8" }}>
                      <option value="">Élève…</option>
                      {trierElevesAlpha(eleves).map((e) => (
                        <option key={e.id} value={e.id}>{e.nom} {e.prenom} — {e.classe}</option>
                      ))}
                    </select>
                    <select value={nouvelleAbsDir.type} onChange={(ev) => setNouvelleAbsDir({ ...nouvelleAbsDir, type: ev.target.value })}
                      className="rounded-lg border px-2 py-2 text-[14px]" style={{ borderColor: "#E7DEC8" }}>
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="date" value={nouvelleAbsDir.date} onChange={(ev) => setNouvelleAbsDir({ ...nouvelleAbsDir, date: ev.target.value })}
                      className="rounded-lg border px-2 py-2 text-[14px]" style={{ borderColor: "#E7DEC8" }} />
                    <input type="text" value={nouvelleAbsDir.motif} onChange={(ev) => setNouvelleAbsDir({ ...nouvelleAbsDir, motif: ev.target.value })}
                      placeholder="Motif (optionnel)"
                      className="rounded-lg border px-2 py-2 text-[14px]" style={{ borderColor: "#E7DEC8" }} />
                    <Btn variant="gold" icon={Plus} onClick={ajouterAbsDir}>Ajouter</Btn>
                  </div>
                </div>

                <div className="space-y-2">
                  {filtrees.length === 0 && (
                    <p className="text-[14px] text-center py-6" style={{ color: "#9A8B67" }}>Aucune absence pour ce filtre.</p>
                  )}
                  {filtrees.map((l, i) => (
                    <div key={`${l.eleveId}-${l.cle}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5"
                         style={{ borderColor: "#E7DEC8", background: String(l.type).toLowerCase().includes("retard") ? "#EFF6FF" : "#FFF7ED" }}>
                      <div className="min-w-0">
                        <div className="font-bold" style={{ color: "#1B2A4A" }}>{l.nom} {l.prenom}</div>
                        <div className="text-[13px]" style={{ color: "#5C5240" }}>
                          {l.classe} · code {l.eleveId} · {l.date}
                          {l.motif ? ` — ${l.motif}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={String(l.type).toLowerCase().includes("retard") ? "ardoise" : "or"}>{l.type}</Badge>
                        <Btn variant="danger" small icon={Trash2} onClick={() => supprimerAbsDir(l.eleveId, { date: l.date, type: l.type, motif: l.motif })}>Suppr.</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </Panel>
      )}

      {onglet === "infoParents" && (
        <Panel title="Informations parents — suivi complet" icon={User}>
          <div className="space-y-4">{trierElevesAlpha(eleves).map((e) => { const moy = (e.notes || []).length ? Math.round(((e.notes || []).reduce((s, n) => s + Number(n.note20 || 0), 0) / (e.notes || []).length) * 10) / 10 : null; return <div key={e.id} className="rounded-xl border p-4" style={{ borderColor: "#E7DEC8" }}><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-bold text-[17px]" style={{ color: "#1B2A4A" }}>{e.prenom} {e.nom} — {e.classe}</div><Btn variant="gold" icon={FileText} small onClick={() => genererBulletinPDF(e, ecole, moy)}>Télécharger le bulletin</Btn></div><div className="mt-3 grid grid-cols-2 gap-2 text-[14px] sm:grid-cols-4"><div><b>Moyenne</b><br />{moy === null ? "—" : `${moy}/${noteSurMax(e.classe) || 20}`}</div><div><b>Notes</b><br />{(e.notes || []).length}</div><div><b>Absences/retards</b><br />{(e.absences || []).length}</div><div><b>Frais restant</b><br />{(e.frais || []).reduce((s, f) => s + Math.max(0, Number(f.du) - Number(f.paye)), 0).toLocaleString("fr-FR")} FCFA</div></div><div className="mt-2 text-[14px]" style={{ color: "#5C5240" }}>Messages : {(e.messages || []).length ? (e.messages || []).map((m) => m.texte).join(" · ") : "Aucun message"}</div></div>; })}</div>
          {anneesArchivees.length > 0 && <div className="mt-5 rounded-xl p-4" style={{ background: "#F1ECDD" }}><div className="mb-2 font-bold text-[16px]" style={{ color: "#1B2A4A" }}>Archives des années précédentes</div>{anneesArchivees.map((a, i) => <details key={i} className="mb-2 rounded border px-3 py-2" style={{ borderColor: "#E7DEC8" }}><summary className="cursor-pointer font-semibold">Année {a.annee} — {a.eleves.length} élèves</summary><div className="mt-2 space-y-1 text-[14px]">{trierElevesAlpha(a.eleves).map((e) => <div key={e.id}>{e.prenom} {e.nom} — {e.classe} — {e.notes?.length || 0} notes</div>)}</div></details>)}</div>}
        </Panel>
      )}

      {onglet === "vueClasse" && (
        <Panel title="Vue par Classe - Toutes les infos Parents" icon={School}>
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {classes.map((cl)=><button key={cl} onClick={()=>setClasseVue(cl)} className={`px-3 py-1.5 rounded-full text-[13px] ${classeVue===cl?"bg-[#1B2A4A] text-white":"bg-[#F1ECDD]"}`}>{cl}</button>)}
          </div>
          {(() => {
            const elevesClasse = trierElevesAlpha(eleves.filter((e)=>e.classe===classeVue));
            const totalPaye = elevesClasse.reduce((s,e)=>s+(e.frais||[]).reduce((a,f)=>a+(Number(f.paye)||0),0),0);
            const totalDu = elevesClasse.reduce((s,e)=>s+(e.frais||[]).reduce((a,f)=>a+(Number(f.du)||0),0),0);
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg p-3" style={{background:"#F1ECDD"}}>Élèves: <b>{elevesClasse.length}</b></div>
                  <div className="rounded-lg p-3" style={{background:"#E4EEE3"}}>Notes: <b>{elevesClasse.reduce((s,e)=>s+(e.notes || []).length,0)}</b></div>
                  <div className="rounded-lg p-3" style={{background:"#DBEAFE"}}>Collecté: <b>{totalPaye.toLocaleString("fr-FR")} F</b></div>
                  <div className="rounded-lg p-3" style={{background:"#FEE2E2"}}>Reste: <b>{Math.max(0, totalDu - totalPaye).toLocaleString("fr-FR")} F</b></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Btn variant="gold" small icon={ClipboardList} onClick={() => {
                    const t = texteListeClasse(elevesClasse, classeVue);
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(t).then(() => alert("Liste copiée !")).catch(() => { prompt("Copiez la liste :", t); });
                    } else { prompt("Copiez la liste :", t); }
                  }}>Copier la liste</Btn>
                  <Btn variant="ghost" small icon={FileText} onClick={() => imprimerListeClasse(elevesClasse, classeVue, ecole)}>Imprimer la liste</Btn>
                </div>
                {elevesClasse.map((e)=><div key={e.id} className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{borderColor:"#E7DEC8", background:"white"}}>
  <div>
    <div className="font-bold" style={{color:"#1B2A4A"}}>{e.prenom} {e.nom} <span className="font-mono text-[11px]" style={{color:"#9A8B67"}}>{e.id}</span></div>
    <div className="text-[13px]" style={{color:"#5C5240"}}>Classe actuelle: {e.classe} | Notes: {(e.notes || []).length} | Absences: {(e.absences || []).length}</div>
  </div>
  <div className="flex items-center gap-2">
    <select value={e.classe} onChange={(ev)=>{
      const nc=ev.target.value; if(!nc||nc===e.classe) return;
      if(!confirm(`Déplacer ${e.prenom} ${e.nom} de ${e.classe} vers ${nc}?`)) return;
      setEleves(prev=> prev.map(el=> el.id===e.id ? {...el, classe: nc} : el));
    }} className="rounded-full border px-3 py-1.5 text-[13px]" style={{borderColor:"#B8D4FF"}}>
      {classes.map(c=><option key={c} value={c}>{c}</option>)}
    </select>
    <span className="text-[11px] px-2 py-1 rounded-full" style={{background:"#EEF6FF"}}>↔️ Changer classe</span>
  </div>
</div>)}
              </div>
            );
          })()}
        </Panel>
      )}

      
      {onglet === "listesClasse" && (
        <Panel title="Listes de classe — copier / imprimer" icon={ClipboardList}>
          <p className="mb-3 text-[14px]" style={{ color: "#5C5240" }}>
            Choisis une classe pour afficher la liste des élèves, la copier ou l&apos;imprimer.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {classes.map((cl) => (
              <button key={cl} type="button" onClick={() => setClasseVue(cl)}
                className="rounded-full px-3 py-1.5 text-[13px] font-semibold"
                style={{ background: classeVue === cl ? "#1B2A4A" : "#F1ECDD", color: classeVue === cl ? "#fff" : "#1B2A4A" }}>
                {cl} ({eleves.filter((e) => e.classe === cl).length})
              </button>
            ))}
          </div>
          {(() => {
            const q = (rechercheListe || "").trim().toLowerCase();
            const elevesClasse = trierElevesAlpha(eleves.filter((e) => e.classe === classeVue)).filter((e) => {
              if (!q) return true;
              const blob = `${e.nom || ""} ${e.prenom || ""} ${e.id || ""}`.toLowerCase();
              return blob.includes(q);
            });
            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-serif text-xl font-bold" style={{ color: "#1B2A4A" }}>Classe {classeVue} — {elevesClasse.length} élève(s)</div>
                  <div className="flex flex-wrap gap-2">
                    <Btn variant="gold" icon={ClipboardList} onClick={() => {
                      const t = texteListeClasse(elevesClasse, classeVue);
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(t).then(() => alert("Liste copiée dans le presse-papiers.")).catch(() => prompt("Copiez :", t));
                      } else prompt("Copiez :", t);
                    }}>Copier la liste</Btn>
                    <Btn variant="ghost" icon={FileText} onClick={() => imprimerListeClasse(elevesClasse, classeVue, ecole)}>Imprimer</Btn>
                  </div>
                </div>
                <input
                  type="search"
                  value={rechercheListe}
                  onChange={(ev) => setRechercheListe(ev.target.value)}
                  placeholder="Rechercher un élève (nom, prénom ou code)…"
                  className="w-full rounded-xl border-2 px-4 py-3 text-[16px] outline-none"
                  style={{ borderColor: "#E7DEC8", background: "#FAF6EE" }}
                />
                {elevesClasse.length === 0 && (
                  <p className="text-center text-[16px] py-6" style={{ color: "#9A8B67" }}>Aucun élève trouvé</p>
                )}
                <div className="space-y-3">
                  {elevesClasse.map((e, i) => (
                    <div key={e.id} className="rounded-2xl border-2 px-4 py-4" style={{ borderColor: "#E7DEC8", background: "#FFFFFF" }}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold" style={{ background: "#1B2A4A", color: "#FAF6EE" }}>{i + 1}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-serif text-[22px] font-bold leading-tight" style={{ color: "#1B2A4A" }}>{e.nom || "—"}</div>
                          <div className="mt-0.5 text-[17px]" style={{ color: "#5C5240" }}>{e.prenom || ""}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[15px]">
                            <span className="rounded-lg px-2.5 py-1 font-mono font-bold" style={{ background: "#EEF2FF", color: "#1B2A4A" }}>{e.id}</span>
                            <span className="rounded-lg px-2.5 py-1 font-semibold" style={{ background: "#F1ECDD", color: "#5C5240" }}>{e.classe || classeVue}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </Panel>
      )}

      {onglet === "bilanClasses" && (
        <Panel title="Bilan financier par classe" icon={Wallet}>
          <p className="mb-3 text-[14px]" style={{ color: "#5C5240" }}>
            Pour chaque classe : montant dû, collecté et reste à collecter.
          </p>
          <div className="space-y-2">
            {classes.map((cl) => {
              const liste = eleves.filter((e) => e.classe === cl);
              const du = liste.reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + (Number(f.du) || 0), 0), 0);
              const paye = liste.reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + (Number(f.paye) || 0), 0), 0);
              const reste = Math.max(0, du - paye);
              const pct = du > 0 ? Math.round((paye / du) * 100) : 0;
              return (
                <div key={cl} className="rounded-xl border p-4" style={{ borderColor: "#E7DEC8" }}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-serif text-lg font-bold" style={{ color: "#1B2A4A" }}>{cl}</div>
                    <Badge tone={reste === 0 && du > 0 ? "vert" : "or"}>{liste.length} élève{liste.length > 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[13px]">
                    <div className="rounded-lg p-2" style={{ background: "#FEF3C7" }}>
                      <div style={{ color: "#92400E" }}>Dû</div>
                      <div className="font-bold text-[15px]" style={{ color: "#78350F" }}>{du.toLocaleString("fr-FR")} F</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: "#D1FAE5" }}>
                      <div style={{ color: "#065F46" }}>Collecté</div>
                      <div className="font-bold text-[15px]" style={{ color: "#047857" }}>{paye.toLocaleString("fr-FR")} F</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: "#FEE2E2" }}>
                      <div style={{ color: "#991B1B" }}>Reste</div>
                      <div className="font-bold text-[15px]" style={{ color: "#B91C1C" }}>{reste.toLocaleString("fr-FR")} F</div>
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "#E7DEC8" }}>
                    <div className="h-full rounded-full" style={{ width: pct + "%", background: pct >= 100 ? "#16A34A" : "#0EA5E9" }} />
                  </div>
                  <div className="mt-1 text-right text-[12px]" style={{ color: "#64748B" }}>{pct} % collecté</div>
                </div>
              );
            })}
          </div>
          {(() => {
            const duT = eleves.reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + (Number(f.du) || 0), 0), 0);
            const payeT = eleves.reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + (Number(f.paye) || 0), 0), 0);
            return (
              <div className="mt-4 rounded-xl p-4" style={{ background: "#1B2A4A", color: "#FAF6EE" }}>
                <div className="font-serif text-lg">Total école</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[14px]">
                  <div>Dû<br /><b>{duT.toLocaleString("fr-FR")} F</b></div>
                  <div>Collecté<br /><b style={{ color: "#86EFAC" }}>{payeT.toLocaleString("fr-FR")} F</b></div>
                  <div>Reste<br /><b style={{ color: "#FDE68A" }}>{Math.max(0, duT - payeT).toLocaleString("fr-FR")} F</b></div>
                </div>
              </div>
            );
          })()}
        </Panel>
      )}

      {onglet === "depenses" && (
        <Panel title="Dépenses de l&apos;école" icon={Wallet}>
          <p className="mb-3 text-[14px]" style={{ color: "#5C5240" }}>
            Enregistre les dépenses (montant + date). Synchronisées en base ; bouton pour imprimer / PDF par mois.
          </p>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Champ label="Libellé de la dépense" value={depForm.libelle} onChange={(e) => setDepForm({ ...depForm, libelle: e.target.value })} placeholder="Ex. Fournitures, électricité…" />
            <Champ label="Montant (FCFA)" value={depForm.montant} onChange={(e) => setDepForm({ ...depForm, montant: e.target.value })} placeholder="Ex. 15000" />
            <Champ label="Date" value={depForm.date} onChange={(e) => setDepForm({ ...depForm, date: e.target.value })} type="date" />
            <Champ label="Note (optionnel)" value={depForm.note} onChange={(e) => setDepForm({ ...depForm, note: e.target.value })} placeholder="Précision…" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn variant="gold" icon={depEditId ? Pencil : Plus} onClick={ajouterDepense}>
              {depEditId ? "Mettre à jour la dépense" : "Enregistrer la dépense"}
            </Btn>
            {depEditId && <Btn variant="ghost" onClick={annulerModifierDepense}>Annuler</Btn>}
            <div className="w-full mt-3 rounded-xl border p-3" style={{ borderColor: "#E7DEC8", background: "#FAF6EE" }}>
              <p className="mb-2 text-[13px] font-bold" style={{ color: "#1B2A4A" }}>Télécharger / imprimer les dépenses</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium" style={{ color: "#5C5240" }}>Reçu du mois</label>
                  <div className="flex flex-wrap gap-2">
                    <select
                      id="dep-mois-select"
                      className="rounded-lg border px-2 py-1.5 text-[13px]"
                      style={{ borderColor: "#E7DEC8" }}
                      defaultValue=""
                    >
                      <option value="">Choisir le mois…</option>
                      {Array.from(new Set((depenses || []).map((d) => moisDepense(d)).filter(Boolean))).sort().reverse().map((ym) => (
                        <option key={ym} value={ym}>{ym}</option>
                      ))}
                    </select>
                    <Btn variant="ghost" small icon={FileText} onClick={() => {
                      const el = document.getElementById("dep-mois-select");
                      const ym = el && el.value;
                      if (!ym) { alert("Choisissez d'abord un mois."); return; }
                      const liste = (depenses || []).filter((d) => moisDepense(d) === ym);
                      imprimerDepensesRapport(liste, "Dépenses du mois " + ym, ecole);
                    }}>Télécharger le mois</Btn>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium" style={{ color: "#5C5240" }}>Reçu du trimestre</label>
                  <div className="flex flex-wrap gap-2">
                    <select
                      id="dep-trim-select"
                      className="rounded-lg border px-2 py-1.5 text-[13px]"
                      style={{ borderColor: "#E7DEC8" }}
                      defaultValue="1"
                    >
                      <option value="1">1er trim. (sept.–nov.)</option>
                      <option value="2">2e trim. (déc.–févr.)</option>
                      <option value="3">3e trim. (mars–juin)</option>
                    </select>
                    <Btn variant="ghost" small icon={FileText} onClick={() => {
                      const el = document.getElementById("dep-trim-select");
                      const t = parseInt(el && el.value, 10) || 1;
                      const labels = { 1: "1er trimestre (septembre–novembre)", 2: "2e trimestre (décembre–février)", 3: "3e trimestre (mars–juin)" };
                      const liste = (depenses || []).filter((d) => moisDansTrimestreScolaire(moisDepense(d), t));
                      imprimerDepensesRapport(liste, "Dépenses — " + labels[t], ecole);
                    }}>Télécharger le trimestre</Btn>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium" style={{ color: "#5C5240" }}>Reçu annuel</label>
                  <Btn variant="ghost" small icon={FileText} onClick={() => {
                    imprimerDepensesRapport(depenses || [], "Dépenses — année complète", ecole);
                  }}>Télécharger l&apos;année</Btn>
                </div>
              </div>
              <p className="mt-2 text-[11px]" style={{ color: "#9A8B67" }}>
                Trimestres scolaires : 1er = sept.–nov. · 2e = déc.–févr. · 3e = mars–juin. Utilisez Imprimer → Enregistrer en PDF dans le navigateur.
              </p>
            </div>
          </div>
          {depEditId && (
            <p className="mt-2 text-[13px]" style={{ color: "#0F766E" }}>Modification en cours — change les champs puis clique « Mettre à jour ».</p>
          )}
          <div className="mt-4 rounded-xl p-3" style={{ background: "#FEF3C7" }}>
            <div className="text-[13px]" style={{ color: "#92400E" }}>Total des dépenses enregistrées</div>
            <div className="font-serif text-2xl font-bold" style={{ color: "#78350F" }}>
              {(depenses || []).reduce((s, d) => s + (Number(d.montant) || 0), 0).toLocaleString("fr-FR")} FCFA
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {(depenses || []).length === 0 && (
              <p className="text-[14px]" style={{ color: "#9A8B67" }}>Aucune dépense pour le moment.</p>
            )}
            {(depenses || []).map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: depEditId === d.id ? "#0F766E" : "#E7DEC8", background: depEditId === d.id ? "#F0FDFA" : undefined }}>
                <div>
                  <div className="font-bold" style={{ color: "#1B2A4A" }}>{d.libelle}</div>
                  <div className="text-[13px]" style={{ color: "#5C5240" }}>{d.date}{d.note ? ` — ${d.note}` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: "#B45309" }}>{Number(d.montant).toLocaleString("fr-FR")} F</span>
                  <Btn variant="ghost" small icon={Pencil} onClick={() => commencerModifierDepense(d)}>Modifier</Btn>
                  <Btn variant="danger" small icon={Trash2} onClick={() => supprimerDepense(d.id)}>Suppr.</Btn>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

{onglet === "bibliotheque" && (
        <Panel title="Bibliothèque des demandes d'inscription" icon={Inbox}>
          <p className="mb-3 text-[13px]" style={{ color: "#9A8B67" }}>
            Demandes d&apos;inscription (en attente, validées, refusées). Pour un enfant <b>déjà inscrit</b> dont la demande n&apos;est plus ici, allez dans l&apos;onglet <b>Élèves</b> : recherche + bouton Modifier.
          </p>
          {confirmationValidation && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[15px]"
                 style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} />
                {confirmationValidation.nom} inscrit(e) — code élève :{" "}
                <span className="font-mono font-semibold">{confirmationValidation.code}</span>
              </span>
              <button onClick={() => setConfirmationValidation(null)} className="text-[13px] underline underline-offset-2">Fermer</button>
            </div>
          )}
          {confirmationValidation && (
            <p className="mb-4 -mt-2 text-[13px]" style={{ color: "#9A8B67" }}>
              Ce code n'est pas transmis automatiquement au parent — communique-le toi-même une fois prêt. Retrouve tous les codes à tout moment dans l'onglet Classes.
            </p>
          )}
          <div className="mb-3">
            <input
              type="search"
              value={rechercheBibliotheque}
              onChange={(ev) => setRechercheBibliotheque(ev.target.value)}
              placeholder="Rechercher un enfant (nom, prénom, parent, téléphone, classe…)"
              className="w-full rounded-lg border px-3 py-2.5 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8", background: "#FFFEFA" }}
            />
          </div>
          {(() => {
            const nAtt = demandes.filter((d) => (d.statut || "en_attente") === "en_attente").length;
            const nVal = demandes.filter((d) => d.statut === "validee").length;
            const nRef = demandes.filter((d) => d.statut === "refusee").length;
            const chips = [
              { id: "en_attente", label: "En cours", n: nAtt, bg: "#FEF3C7", fg: "#92400E" },
              { id: "validee", label: "Validées", n: nVal, bg: "#D1FAE5", fg: "#14532D" },
              { id: "refusee", label: "Refusées", n: nRef, bg: "#FEE2E2", fg: "#991B1B" },
              { id: "toutes", label: "Toutes", n: demandes.length, bg: "#E0F2FE", fg: "#0C4A6E" },
            ];
            return (
              <div className="mb-4 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <button key={c.id} type="button" onClick={() => setFiltreBibliotheque(c.id)}
                    className="rounded-full px-3 py-1.5 text-[13px] font-bold transition"
                    style={{
                      background: filtreBibliotheque === c.id ? c.bg : "#FFFFFF",
                      color: c.fg,
                      boxShadow: filtreBibliotheque === c.id ? `inset 0 0 0 2px ${c.fg}55` : "inset 0 0 0 1px #E7DEC8",
                    }}>{c.label} ({c.n})</button>
                ))}
              </div>
            );
          })()}
          <div className="space-y-3">
            {demandes.length === 0 && (
              <p className="text-[15px]" style={{ color: "#9A8B67" }}>Aucune demande reçue pour le moment.</p>
            )}
            {demandes.length > 0 && (rechercheBibliotheque || "").trim() && demandes.filter((d) => {
                const q = (rechercheBibliotheque || "").trim().toLowerCase();
                const blob = `${d.prenom || ""} ${d.nom || ""} ${d.parrainNom || ""} ${d.parrainTelephone || ""} ${d.classeSouhaitee || d.classe || ""} ${d.codeEleve || ""}`.toLowerCase();
                return blob.includes(q);
              }).length === 0 && (
              <p className="text-[15px]" style={{ color: "#9A8B67" }}>Aucun résultat pour « {(rechercheBibliotheque || "").trim()} ».</p>
            )}
            {demandes
              .filter((d) => {
                const st = d.statut || "en_attente";
                if (filtreBibliotheque !== "toutes" && st !== filtreBibliotheque) return false;
                const q = (rechercheBibliotheque || "").trim().toLowerCase();
                if (!q) return true;
                const blob = `${d.prenom || ""} ${d.nom || ""} ${d.parrainNom || ""} ${d.parrainTelephone || ""} ${d.classeSouhaitee || d.classe || ""} ${d.codeEleve || ""} ${d.statut || ""}`.toLowerCase();
                return blob.includes(q);
              })
              .map((d) => (
              <div key={d.id} className="rounded-lg border p-4" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>
                      {d.prenom} {d.nom} <span className="font-normal" style={{ color: "#9A8B67" }}>({d.sexe === "F" ? "Féminin" : d.sexe === "M" ? "Masculin" : "—"}{d.age != null ? `, ${d.age} ans` : ""})</span>
                    </div>
                    <div className="mt-0.5 text-[13px]" style={{ color: "#5C5240" }}>
                      Né(e) : {d.naissance || "—"} · Sexe : {d.sexe || "—"} · Classe : {d.classeSouhaitee || d.classe || "—"} · Parent : {d.parrainNom || "—"} ({d.parrainTelephone || "—"}) · {d.origine === "secretariat" ? "secrétariat" : "en ligne"}
                    </div>
                    {d.message && <p className="mt-1 text-[13px] italic" style={{ color: "#9A8B67" }}>« {d.message} »</p>}
                  </div>
                  {d.statut === "en_attente" && <Badge tone="or">En attente</Badge>}
                  {d.statut === "validee" && (
                    <>
                      <Badge tone="vert"><CheckCircle2 size={12} />Validée</Badge>
                      {d.codeEleve && <Badge tone="ardoise">Code {d.codeEleve}</Badge>}
                    </>
                  )}
                  {d.statut === "refusee" && <Badge tone="ardoise"><XCircle size={12} />Refusée</Badge>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.statut === "en_attente" && (
                    <>
                      <Btn variant="gold" icon={CheckCircle2} small onClick={() => valider(d)}>Valider l'inscription</Btn>
                      <Btn variant="danger" icon={XCircle} small onClick={() => refuser(d)}>Refuser</Btn>
                    </>
                  )}
                  {d.statut !== "en_attente" && (
                    <Btn variant="ghost" icon={RefreshCw} small onClick={() => setDemandes(prev => prev.map(x => x.id===d.id ? {...x, statut: "en_attente"} : x))}>↩️ Annuler validation</Btn>
                  )}
                  <Btn variant="ghost" icon={Pencil} small onClick={() => modifierDemande(d)}>✏️ Modifier</Btn>
                  <Btn variant="danger" icon={Trash2} small onClick={() => supprimerDemande(d)}>🗑️ Supprimer (même Validée)</Btn>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "suivi" && (
        <Panel title="Suivi pédagogique" icon={CheckCircle2}>
          <p className="mb-4 text-[13px]" style={{ color: "#9A8B67" }}>
            Vérifie à tout moment, depuis chez toi, si chaque enseignant transmet bien les notes et absences à ses élèves — sans avoir besoin de l'appeler.
          </p>
          <div className="space-y-2">
            {suiviParClasse.map((s) => (
              <div key={s.classe} className="rounded-lg border px-4 py-3" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-serif text-[16px]" style={{ color: "#1B2A4A" }}>{s.classe}</span>
                    <span className="ml-2 text-[13px]" style={{ color: "#9A8B67" }}>
                      {s.enseignant ? s.enseignant.nom : "Aucun enseignant affecté"}
                    </span>
                  </div>
                  <Badge tone={s.nbEleves === 0 ? "ardoise" : s.totalNotes > 0 ? "vert" : "or"}>
                    {s.nbEleves === 0 ? "Aucun élève" : s.totalNotes > 0 ? "Actif" : "Aucune note saisie"}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[13px]" style={{ color: "#5C5240" }}>
                  <div>{s.nbEleves} élève{s.nbEleves > 1 ? "s" : ""}</div>
                  <div>{s.totalNotes} note{s.totalNotes > 1 ? "s" : ""} saisie{s.totalNotes > 1 ? "s" : ""}</div>
                  <div>{s.totalAbsences} absence{s.totalAbsences > 1 ? "s" : ""}</div>
                </div>
                {s.derniereSaisie && (
                  <div className="mt-1 text-[12px]" style={{ color: "#9A8B67" }}>Dernière note saisie le {s.derniereSaisie}</div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}


      {onglet === "bulletins" && (
        <Panel title="Validation formelle des bulletins" icon={FileText}>
          <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>
            Validez un bulletin pour autoriser le parent à le télécharger. Tant qu&apos;il n&apos;est pas validé, le parent voit « En attente de validation ».
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe</label>
            <select value={filtreBullClasse} onChange={(e) => setFiltreBullClasse(e.target.value)} className="rounded-lg border px-2 py-1 text-[13px]" style={{ borderColor: "#E7DEC8" }}>
              <option value="toutes">Toutes</option>
              {(classes || []).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Btn variant="ghost" small onClick={() => setBullTick((t) => t + 1)}>Actualiser</Btn>
          </div>
          <div className="space-y-2 max-h-[65vh] overflow-y-auto">
            {void bullTick}
            {(eleves || [])
              .filter((e) => e && (filtreBullClasse === "toutes" || e.classe === filtreBullClasse))
              .sort((a, b) => String(a.nom || "").localeCompare(String(b.nom || ""), "fr"))
              .map((e) => {
                const v = lireBulletinsValides()[String(e.id)] || {};
                const valide = !!v.valide;
                const nbNotes = (e.notes || []).length;
                return (
                  <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2" style={{ borderColor: valide ? "#BBF7D0" : "#E7DEC8", background: valide ? "#F0FDF4" : "#FFFFFF" }}>
                    <div>
                      <p className="text-[14px] font-semibold" style={{ color: "#1B2A4A" }}>{e.nom} {e.prenom} <span className="font-normal" style={{ color: "#9A8B67" }}>({e.classe})</span></p>
                      <p className="text-[12px]" style={{ color: "#5C5240" }}>
                        {nbNotes} note(s)
                        {valide ? ` · Validé le ${v.date || "—"} par ${v.par || "direction"}` : " · Non validé"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Btn variant="ghost" small onClick={() => {
                        const moyenne = nbNotes ? Math.round(((e.notes || []).reduce((s, n) => s + (Number(n.note20) || 0), 0) / nbNotes) * 10) / 10 : null;
                        genererBulletinPDF(e, ecole, moyenne);
                      }}>Aperçu PDF</Btn>
                      {valide ? (
                        <Btn variant="danger" small onClick={() => {
                          const o = { ...lireBulletinsValides() };
                          delete o[String(e.id)];
                          ecrireBulletinsValides(o);
                          setBullTick((t) => t + 1);
                          try { journaliser("Bulletin invalidé: " + e.prenom + " " + e.nom, isFondateur ? "fondateur" : "directeur"); } catch (err) {}
                        }}>Retirer validation</Btn>
                      ) : (
                        <Btn variant="gold" small onClick={() => {
                          if (nbNotes === 0 && !window.confirm("Aucune note pour cet élève. Valider quand même ?")) return;
                          const o = { ...lireBulletinsValides(), [String(e.id)]: { valide: true, date: new Date().toLocaleDateString("fr-FR"), par: isFondateur ? "Fondateur" : "Directeur" } };
                          ecrireBulletinsValides(o);
                          setBullTick((t) => t + 1);
                          try { journaliser("Bulletin validé: " + e.prenom + " " + e.nom, isFondateur ? "fondateur" : "directeur"); } catch (err) {}
                        }}>Valider le bulletin</Btn>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </Panel>
      )}

      
      {onglet === "passages" && (
        <Panel title="Validation de passage — classes supérieures" icon={GraduationCap}>
          <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>
            Les enseignants proposent le passage. À la validation : classe supérieure <b>et nouveau code élève</b> (l&apos;ancien code parent ne fonctionne plus).
            Cette liste <b>reste après la clôture d&apos;année</b> jusqu&apos;à validation.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <Btn variant="ghost" small onClick={() => setPassagesTick((t) => t + 1)}>Actualiser</Btn>
            <Btn variant="gold" small onClick={() => {
              const liste = lirePassages().filter((p) => p.statut === "propose");
              if (!liste.length) { alert("Aucune proposition en attente."); return; }
              if (!window.confirm("Valider le passage de " + liste.length + " élève(s) ?\n\nChaque élève recevra un NOUVEAU code d'accès parent. L'ancien code ne fonctionnera plus.")) return;
              let recap = [];
              setEleves((prev) => {
                const { eleves, resultats } = appliquerValidationPassages(liste, prev);
                const autres = lirePassages().filter((p) => p.statut !== "propose");
                ecrirePassages([...resultats, ...autres]);
                recap = resultats.map((r) => (r.prenom || "") + " " + (r.nom || "") + " : " + (r.ancienCode || "") + " → " + (r.nouveauCode || ""));
                return eleves;
              });
              try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 500); } catch (e) {}
              setPassagesTick((t) => t + 1);
              try { journaliser("Validation passage + nouveaux codes: " + liste.length + " élèves", isFondateur ? "fondateur" : "directeur"); } catch (e) {}
              alert(liste.length + " passage(s) validé(s) avec nouveaux codes.\n\n" + recap.slice(0, 15).join("\n") + (recap.length > 15 ? "\n…" : ""));
            }}>Valider tous les passages en attente</Btn>
          </div>
          {void passagesTick}
          <div className="space-y-2 max-h-[65vh] overflow-y-auto">
            {lirePassages().length === 0 && (
              <p className="text-[13px]" style={{ color: "#9A8B67" }}>Aucune proposition. L&apos;enseignant propose le passage depuis sa classe (bouton « Proposer passage »).</p>
            )}
            {lirePassages().sort((a, b) => String(a.nom || "").localeCompare(String(b.nom || ""), "fr")).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2" style={{
                borderColor: p.statut === "valide" ? "#BBF7D0" : (p.statut === "refuse" ? "#FECACA" : "#FDE68A"),
                background: p.statut === "valide" ? "#F0FDF4" : (p.statut === "refuse" ? "#FEF2F2" : "#FFFBEB"),
              }}>
                <div>
                  <p className="font-semibold" style={{ color: "#1B2A4A" }}>{p.nom} {p.prenom} <span style={{ color: "#9A8B67" }}>({p.code})</span></p>
                  <p className="text-[12px]" style={{ color: "#5C5240" }}>
                    {p.deClasse} → <b>{p.versClasse}</b> · {p.statut === "propose" ? "En attente" : p.statut === "valide" ? "Validé" : "Refusé"}
                    {p.statut === "valide" && (p.ancienCode || p.nouveauCode) ? (
                      <span> · Code {p.ancienCode || "?"} → <b>{p.nouveauCode || p.code}</b></span>
                    ) : null}
                  </p>
                </div>
                {p.statut === "propose" && (
                  <div className="flex gap-1">
                    <Btn variant="gold" small onClick={() => {
                      if (!window.confirm("Valider le passage de " + (p.prenom || "") + " " + (p.nom || "") + " ?\nUn nouveau code sera attribué ; l'ancien ne marchera plus.")) return;
                      let nouveauAffiche = "";
                      setEleves((prev) => {
                        const { eleves, resultats } = appliquerValidationPassages([p], prev);
                        const r = resultats[0];
                        if (r) {
                          nouveauAffiche = r.nouveauCode || "";
                          ecrirePassages(lirePassages().map((x) => x.id === p.id ? r : x));
                        }
                        return eleves;
                      });
                      try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400); } catch (e) {}
                      setPassagesTick((t) => t + 1);
                      try { journaliser("Passage validé + nouveau code " + (p.prenom || "") + " " + (p.nom || ""), isFondateur ? "fondateur" : "directeur"); } catch (e) {}
                      alert("Passage validé.\nAncien code : " + (p.eleveId || p.code) + "\nNouveau code : " + nouveauAffiche + "\n\nCommuniquez le nouveau code au parent.");
                    }}>Valider</Btn>
                    <Btn variant="danger" small onClick={() => {
                      ecrirePassages(lirePassages().map((x) => x.id === p.id ? { ...x, statut: "refuse" } : x));
                      setPassagesTick((t) => t + 1);
                    }}>Refuser</Btn>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

{onglet === "evaluation" && (
        <PanneauEvaluation eleves={eleves} classes={classes} ecole={ecole} />
      )}
      {onglet === "calendrier" && (
        <Panel title="Calendrier scolaire" icon={CalendarClock}>
          <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>
            Examens, réunions, vacances, fêtes… Visible aussi pour les enseignants et les parents.
          </p>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Champ label="Titre" value={nouvelEvtCal.titre} onChange={(e) => setNouvelEvtCal({ ...nouvelEvtCal, titre: e.target.value })} placeholder="Ex. Composition 1er trimestre" />
            <Champ label="Date début" value={nouvelEvtCal.dateDebut} onChange={(e) => setNouvelEvtCal({ ...nouvelEvtCal, dateDebut: e.target.value })} type="date" />
            <Champ label="Date fin (optionnel)" value={nouvelEvtCal.dateFin} onChange={(e) => setNouvelEvtCal({ ...nouvelEvtCal, dateFin: e.target.value })} type="date" />
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Type</label>
              <select value={nouvelEvtCal.type} onChange={(e) => setNouvelEvtCal({ ...nouvelEvtCal, type: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-[15px]" style={{ borderColor: "#E7DEC8" }}>
                <option value="examen">Examen / composition</option>
                <option value="reunion">Réunion</option>
                <option value="vacances">Vacances</option>
                <option value="ferie">Jour férié</option>
                <option value="evenement">Autre événement</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Concerne</label>
              <select value={nouvelEvtCal.classe} onChange={(e) => setNouvelEvtCal({ ...nouvelEvtCal, classe: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-[15px]" style={{ borderColor: "#E7DEC8" }}>
                <option value="toutes">Toute l&apos;école</option>
                {(classes || []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <Btn variant="gold" icon={Plus} onClick={() => {
                if (!nouvelEvtCal.titre.trim() || !nouvelEvtCal.dateDebut) { alert("Titre et date de début obligatoires"); return; }
                const ev = { id: "cal-" + Date.now(), ...nouvelEvtCal, titre: nouvelEvtCal.titre.trim() };
                ecrireCalendrierScolaire([ev, ...lireCalendrierScolaire()]);
                setNouvelEvtCal({ titre: "", dateDebut: "", dateFin: "", type: "evenement", classe: "toutes" });
                setCalTick((t) => t + 1);
                try { journaliser("Calendrier: " + ev.titre, isFondateur ? "fondateur" : "directeur"); } catch (err) {}
              }}>Ajouter</Btn>
            </div>
          </div>
          <div className="space-y-2">
            {void calTick}
            {lireCalendrierScolaire().sort((a, b) => String(a.dateDebut || "").localeCompare(String(b.dateDebut || ""))).map((ev) => {
              const couleurs = { examen: "#FEF3C7", reunion: "#DBEAFE", vacances: "#D1FAE5", ferie: "#FCE7F3", evenement: "#F1ECDD" };
              return (
                <div key={ev.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "#E7DEC8", background: couleurs[ev.type] || "#FAF6EE" }}>
                  <div>
                    <p className="font-semibold" style={{ color: "#1B2A4A" }}>{ev.titre}</p>
                    <p className="text-[12px]" style={{ color: "#5C5240" }}>
                      {ev.dateDebut}{ev.dateFin ? " → " + ev.dateFin : ""} · {ev.type} · {ev.classe === "toutes" ? "Toute l'école" : ev.classe}
                    </p>
                  </div>
                  <Btn variant="danger" small onClick={() => {
                    ecrireCalendrierScolaire(lireCalendrierScolaire().filter((x) => x.id !== ev.id));
                    setCalTick((t) => t + 1);
                  }}>Suppr.</Btn>
                </div>
              );
            })}
            {lireCalendrierScolaire().length === 0 && (
              <p className="text-[13px]" style={{ color: "#9A8B67" }}>Aucun événement. Ajoutez examens, vacances, réunions…</p>
            )}
          </div>
        </Panel>
      )}

      {onglet === "classes" && (
        <Panel title="Gestion des classes" icon={School}>
          <div className="mb-5 rounded-xl border p-4" style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}>
            <p className="mb-1 text-[15px] font-bold" style={{ color: "#14532D" }}>Barème des notes (par classe)</p>
            <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>
              Choisissez pour chaque classe : notation sur 10, sur 20, ou niveaux maternelle (TS / S / PS). Les enseignants saisissent selon ce barème ; les parents voient le même.
            </p>
            <div className="space-y-2">
              {(classes || []).map((cl) => {
                const v = baremesActuels[cl];
                const sel = v === "niveaux" || v === "TS" ? "niveaux" : String(v === 10 || v === "10" ? 10 : v === 20 || v === "20" ? 20 : (Number(v) || (estClasseMaternelle(cl) ? "niveaux" : 10)));
                return (
                  <div key={cl} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2" style={{ borderColor: "#E7DEC8" }}>
                    <span className="text-[14px] font-semibold" style={{ color: "#1B2A4A" }}>{cl}</span>
                    <select
                      value={sel}
                      onChange={(e) => {
                        const x = e.target.value;
                        definirBaremeClasse(cl, x === "niveaux" ? "niveaux" : Number(x));
                      }}
                      className="rounded-lg border px-3 py-1.5 text-[14px]"
                      style={{ borderColor: "#E7DEC8" }}
                    >
                      <option value="10">Sur 10</option>
                      <option value="20">Sur 20</option>
                      <option value="niveaux">Niveaux (TS / S / PS)</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {classes.map((c, i) => {
              const inscrits = eleves.filter((e) => e.classe === c);
              return (
                <div key={i} className="rounded-lg border px-3 py-2 text-[15px]" style={{ borderColor: "#E7DEC8" }}>
                  <div className="flex items-center justify-between gap-2">
                    {classeEnEdition === i ? (
                      <input
                        autoFocus
                        defaultValue={c}
                        onBlur={(ev) => { renommerClasse(i, ev.target.value); setClasseEnEdition(null); }}
                        onKeyDown={(ev) => { if (ev.key === "Enter") ev.target.blur(); }}
                        className="min-w-0 flex-1 rounded border px-2 py-1 outline-none"
                        style={{ borderColor: "#C9A227", color: "#1B2A4A" }}
                      />
                    ) : (
                      <span style={{ color: "#1B2A4A" }} className="font-medium">{c}</span>
                    )}
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone="ardoise">{inscrits.length} inscrit{inscrits.length > 1 ? "s" : ""}</Badge>
                      <Pencil size={14} className="cursor-pointer hover:opacity-70" style={{ color: "#9A8B67" }}
                              onClick={() => setClasseEnEdition(i)} />
                      <Trash2 size={14} className="cursor-pointer hover:opacity-70"
                              style={{ color: "#8A2E2E" }}
                              onClick={() => supprimerClasse(i)} />
                    </div>
                  </div>
                  {inscrits.length > 0 && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-[13px]" style={{ color: "#9A8B67" }}>Voir les codes élèves</summary>
                      <div className="mt-1 space-y-0.5">
                        {inscrits.map((e) => (
                          <div key={e.id} className="flex items-center justify-between text-[13px]">
                            <span style={{ color: "#5C5240" }}>{e.prenom} {e.nom}</span>
                            <span className="font-mono" style={{ color: "#1B2A4A" }}>{e.id}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {classeASupprimer === i && (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[13px]" style={{ background: "#FBEAEA" }}>
                      <span style={{ color: "#8A2E2E" }}>{inscrits.length} élève(s) dans cette classe. Supprimer quand même ?</span>
                      <div className="flex shrink-0 gap-2">
                        <button onClick={() => supprimerClasse(i)} className="font-medium underline" style={{ color: "#8A2E2E" }}>Oui, supprimer</button>
                        <button onClick={() => setClasseASupprimer(null)} style={{ color: "#5C5240" }}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
            <input
              value={nouvelleClasse}
              onChange={(e) => setNouvelleClasse(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") ajouterClasse(); }}
              placeholder="Ex. 6ème, CI bis, Maternelle 3..."
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <Btn variant="gold" icon={Plus} onClick={ajouterClasse}>Ajouter</Btn>
          </div>
          <p className="mt-2 text-[13px]" style={{ color: "#9A8B67" }}>Clique sur le crayon pour renommer une classe, ou sur la corbeille pour la supprimer. Le champ ci-dessus reste libre pour ajouter d'autres niveaux à tout moment. Déplie « Voir les codes élèves » pour retrouver le code à communiquer à chaque parent.</p>
        </Panel>
      )}

      {onglet === "matieres" && (
        <Panel title="Matières par classe" icon={FileText}>
          <p className="mb-4 text-[13px]" style={{ color: "#9A8B67" }}>
            Chaque classe a sa propre liste de matières. Ouvre une classe, ajoute ses matières — elles s&apos;afficheront automatiquement pour chaque élève.
            En <b>Maternelle</b>, pas de coefficient : évaluation <b>TS / S / PS</b> (comme la fiche d&apos;observation). Au primaire (CI à CM2), notes sur 10.
          </p>
          <div className="space-y-3">
            {classes.map((c) => {
              const matieresClasse = matieresParClasse[c] || [];
              const saisie = nouvellesMatieresParClasse[c] || { nom: "", coef: 1 };
              return (
                <details key={c} className="rounded-lg border px-4 py-3" style={{ borderColor: "#E7DEC8" }} open={matieresClasse.length > 0}>
                  <summary className="flex cursor-pointer items-center justify-between">
                    <span className="font-serif text-[16px]" style={{ color: "#1B2A4A" }}>{c}</span>
                    <Badge tone={matieresClasse.length > 0 ? "vert" : "ardoise"}>
                      {matieresClasse.length} matière{matieresClasse.length > 1 ? "s" : ""}
                    </Badge>
                  </summary>

                  <div className="mt-3 space-y-2">
                    {matieresClasse.length === 0 && (
                      <p className="text-[13px]" style={{ color: "#9A8B67" }}>Aucune matière définie pour {c} — ajoute la première ci-dessous.</p>
                    )}
                    {matieresClasse.map((m, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
                           style={{ borderColor: "#E7DEC8" }}>
                        <input
                          defaultValue={m.nom}
                          onBlur={(ev) => modifierMatiereClasse(c, i, "nom", ev.target.value)}
                          className="min-w-0 flex-1 rounded border px-2 py-1 text-[15px] outline-none"
                          style={{ borderColor: "#E7DEC8", color: "#1B2A4A" }}
                        />
                        {!estClasseMaternelle(c) ? (
                          <div className="flex items-center gap-1 text-[13px]" style={{ color: "#9A8B67" }}>
                            Coef.
                            <input
                              type="number" min={1} max={5} defaultValue={m.coef}
                              onBlur={(ev) => modifierMatiereClasse(c, i, "coef", ev.target.value)}
                              className="w-12 rounded border px-1 py-1 text-center outline-none"
                              style={{ borderColor: "#E7DEC8" }}
                            />
                          </div>
                        ) : (
                          <span className="text-[12px] font-semibold" style={{ color: "#0F766E" }}>TS/S/PS</span>
                        )}
                        <Trash2 size={15} className="cursor-pointer" style={{ color: "#8A2E2E" }}
                                onClick={() => supprimerMatiereClasse(c, i)} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
                    <input
                      value={saisie.nom}
                      onChange={(ev) => champNouvelleMatiere(c, "nom", ev.target.value)}
                      placeholder={`Nouvelle matière pour ${c}`}
                      className="min-w-0 flex-1 rounded border px-2 py-1.5 text-[15px] outline-none"
                      style={{ borderColor: "#E7DEC8" }}
                    />
                    {!estClasseMaternelle(c) && (
                      <div className="flex items-center gap-1 text-[13px]" style={{ color: "#5C5240" }}>
                        Coef.
                        <input
                          type="number" min={1} max={5}
                          value={saisie.coef}
                          onChange={(ev) => champNouvelleMatiere(c, "coef", ev.target.value)}
                          className="w-12 rounded border px-1 py-1.5 text-center outline-none"
                          style={{ borderColor: "#E7DEC8" }}
                        />
                      </div>
                    )}
                    <Btn variant="gold" icon={Plus} small onClick={() => ajouterMatiereClasse(c)}>Ajouter à {c}</Btn>
                  </div>
                </details>
              );
            })}
          </div>
        </Panel>
      )}

      {onglet === "emploi" && (
        <Panel title="Emploi du temps - Gestion par classe" icon={CalendarClock}>
          <p className="mb-3 text-[13px]" style={{color:"#9A8B67"}}>Crée ou modifie l'emploi du temps. Chaque matière ajoutée par l'enseignant apparaît aussi ici automatiquement (même base Supabase). Visible instantanément par parents et enseignants.</p>
          <div className="space-y-4">
            {classes.map(c=>{
              const emploiClasse = (emploiDuTemps && emploiDuTemps[c]) || [];
              return (
                <details key={c} className="rounded-lg border px-4 py-3" style={{borderColor:"#E7DEC8"}} open>
                  <summary className="flex justify-between cursor-pointer"><span className="font-medium" style={{color:"#1B2A4A"}}>{c}</span><span className="text-[13px] px-2 py-0.5 rounded-full" style={{background: emploiClasse.length?"#E4EEE3":"#F1ECDD"}}>{emploiClasse.length} créneaux</span></summary>
                  <div className="mt-3 space-y-2">
                    {emploiClasse.map((e,i)=>(
                      <div key={i} className="flex gap-2 items-center rounded border px-2 py-1.5 text-[13px]" style={{borderColor:"#E7DEC8"}}>
                        <span className="font-medium" style={{color:"#1B2A4A"}}>{e.jour}</span>
                        <span style={{color:"#9A8B67"}}>{e.creneau}</span>
                        <span style={{color:"#1B2A4A"}}>{e.matiere}</span>
                        <span className="text-[11px]" style={{color:"#5C5240"}}>{e.enseignant}</span>
                        <button onClick={()=>{ setEmploiDuTemps(prev=>({...prev, [c]: (prev[c]||[]).filter((_,idx)=>idx!==i)})); }} className="ml-auto text-[11px] px-1.5 py-0.5 rounded" style={{background:"#FBEAEA", color:"#8A2E2E"}}>Supprimer</button>
                      </div>
                    ))}
                    <EmploiForm classe={c} />
                  </div>
                </details>
              );
            })}
          </div>
        </Panel>
      )}

      {onglet === "frais" && (
        <Panel title="Frais scolaires" icon={Wallet}
               actions={<Badge tone="ardoise">Année {anneeScolaire}</Badge>}>
          <p className="mb-3 text-[13px]" style={{ color: "#9A8B67" }}>
            Ce catalogue s'applique automatiquement à chaque nouvel élève validé pour l'année {anneeScolaire}. Pour démarrer une nouvelle année scolaire (avec archivage des résultats), utilise l'onglet « Année scolaire ».
          </p>
          <div className="mb-4 space-y-2">
            {fraisTypes.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "#E7DEC8" }}>
                <input
                  defaultValue={f.libelle}
                  onBlur={(ev) => modifierFrais(i, "libelle", ev.target.value)}
                  className="min-w-0 flex-1 rounded border px-2 py-1 text-[15px] outline-none"
                  style={{ borderColor: "#E7DEC8", color: "#1B2A4A" }}
                />
                <select value={f.classe || "toutes"} onChange={(ev) => modifierFrais(i, "classe", ev.target.value === "toutes" ? null : ev.target.value)} className="rounded border px-2 py-1 text-[13px]" style={{ borderColor: "#E7DEC8" }}>
                  <option value="toutes">Toutes les classes</option>
                  {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex items-center gap-1 text-[13px]" style={{ color: "#9A8B67" }}>
                  Montant
                  <input
                    type="number" min={0} defaultValue={f.montant}
                    onBlur={(ev) => modifierFrais(i, "montant", ev.target.value)}
                    className="w-24 rounded border px-2 py-1 text-right outline-none"
                    style={{ borderColor: "#E7DEC8" }}
                  />
                  F
                </div>
                <Trash2 size={15} className="cursor-pointer" style={{ color: "#8A2E2E" }}
                        onClick={() => supprimerFrais(i)} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
            <input
              value={nouveauFrais.libelle}
              onChange={(e) => setNouveauFrais({ ...nouveauFrais, libelle: e.target.value })}
              placeholder="Ex. Cantine, Transport, Sortie pédagogique..."
              className="min-w-0 flex-1 rounded border px-2 py-1.5 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <select value={nouveauFrais.classe} onChange={(e) => setNouveauFrais({ ...nouveauFrais, classe: e.target.value })} className="rounded border px-2 py-1.5 text-[15px]" style={{ borderColor: "#E7DEC8" }}>
              <option value="toutes">Toutes les classes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="number" min={0}
              value={nouveauFrais.montant}
              onChange={(e) => setNouveauFrais({ ...nouveauFrais, montant: e.target.value })}
              placeholder="Montant"
              className="w-24 rounded border px-2 py-1.5 text-right text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <Btn variant="gold" icon={Plus} small onClick={ajouterFrais}>Ajouter</Btn>
          </div>
        </Panel>
      )}

      {onglet === "annee" && (
        <Panel title="Année scolaire" icon={CalendarClock}>
          <div className="mb-4 rounded-lg border px-4 py-3" style={{ borderColor: "#E7DEC8" }}>
            <div className="text-[13px]" style={{ color: "#9A8B67" }}>Année en cours</div>
            <div className="font-serif text-xl" style={{ color: "#1B2A4A" }}>{anneeScolaire}</div>
          </div>

          {confirmationCloture && (
            <div className="mb-4 rounded-lg px-3 py-2.5 text-[15px]" style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <CheckCircle2 size={15} className="mr-1 inline" />
              Année {confirmationCloture.ancienneAnnee} archivée ({confirmationCloture.nbEleves} élève{confirmationCloture.nbEleves > 1 ? "s" : ""}) — nouvelle année {confirmationCloture.nouvelleAnnee} démarrée, dossiers vierges.
            </div>
          )}

          <div className="rounded-lg p-4" style={{ background: "#F1ECDD" }}>
            <p className="mb-2 text-[15px]" style={{ color: "#3E3625" }}>
              Clôturer l'année en cours archive les notes, absences et frais de tous les élèves (consultables ensuite ci-dessous), puis ouvre une nouvelle année scolaire : chaque élève garde sa fiche (nom, classe, parrain) mais repart avec des notes, absences et frais vierges, calculés sur le catalogue de frais actuel.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={nouvelleAnneeLabel}
                onChange={(e) => { setNouvelleAnneeLabel(e.target.value); setErreurCloture(""); setDemandeConfirmationCloture(false); }}
                placeholder="Ex. 2027-2028"
                className="w-40 rounded-lg border px-3 py-2 text-[15px] outline-none"
                style={{ borderColor: erreurCloture ? "#8A2E2E" : "#E7DEC8" }}
              />
              {!demandeConfirmationCloture ? (
                <Btn variant="gold" icon={RefreshCw} onClick={demarrerCloture}>Clôturer et démarrer cette nouvelle année</Btn>
              ) : (
                <>
                  <span className="text-[13px] font-medium" style={{ color: "#8A2E2E" }}>Confirmer la clôture de {anneeScolaire} ?</span>
                  <Btn variant="danger" small onClick={cloturerAnnee}>Oui, clôturer</Btn>
                  <Btn variant="ghost" small onClick={() => setDemandeConfirmationCloture(false)}>Annuler</Btn>
                </>
              )}
            </div>
            {erreurCloture && <p className="mt-1.5 text-[13px]" style={{ color: "#8A2E2E" }}>{erreurCloture}</p>}
          </div>

          {anneesArchivees.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-2 text-[13px] font-medium uppercase tracking-wide" style={{ color: "#9A8B67" }}>Années archivées</h4>
              <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>
                Vous pouvez consulter, modifier les infos d&apos;un élève, ou supprimer toute une année archivée.
              </p>
              <div className="space-y-3">
                {anneesArchivees.map((arch, i) => (
                  <details key={i} className="rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}>
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-[15px]">
                      <span className="font-medium" style={{ color: "#1B2A4A" }}>{arch.annee}</span>
                      <span className="flex items-center gap-2">
                        <Badge tone="ardoise">{arch.eleves.length} élève{arch.eleves.length > 1 ? "s" : ""}</Badge>
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-[12px] font-bold"
                          style={{ background: "#8A2E2E", color: "#fff" }}
                          onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            if (!window.confirm(`Supprimer définitivement l'année archivée ${arch.annee} et toutes ses données ?`)) return;
                            setAnneesArchivees((prev) => prev.filter((_, j) => j !== i));
                          }}
                        >
                          Supprimer l&apos;année
                        </button>
                      </span>
                    </summary>
                    <div className="mt-2 space-y-2">
                      {arch.eleves.map((e, ei) => {
                        const notes = e.notes || [];
                        const frais = e.frais || [];
                        const absences = e.absences || [];
                        const moy = notes.length ? Math.round((notes.reduce((s, n) => s + Number(n.note20 || 0), 0) / notes.length) * 10) / 10 : null;
                        return (
                          <details key={e.id || ei} className="rounded-lg border px-3 py-2" style={{ borderColor: "#E7DEC8" }}>
                            <summary className="flex cursor-pointer items-center justify-between text-[14px] font-semibold" style={{ color: "#1B2A4A" }}>
                              <span>{e.prenom} {e.nom} — {e.classe} ({e.id})</span>
                              <span>{moy !== null ? `Moy. ${moy}/${noteSurMax(e.classe) || 20}` : "Sans note"}</span>
                            </summary>
                            <div className="mt-2 space-y-2 text-[13px]" style={{ color: "#5C5240" }}>
                              <div className="flex flex-wrap gap-2">
                                <Btn variant="ghost" small onClick={() => {
                                  const prenom = window.prompt("Prénom", e.prenom);
                                  if (prenom === null) return;
                                  const nom = window.prompt("Nom", e.nom);
                                  if (nom === null) return;
                                  const classe = window.prompt("Classe", e.classe);
                                  if (classe === null) return;
                                  setAnneesArchivees((prev) => prev.map((a, j) => j !== i ? a : {
                                    ...a,
                                    eleves: a.eleves.map((el, k) => k !== ei ? el : { ...el, prenom, nom, classe }),
                                  }));
                                }}>Modifier identité</Btn>
                                <Btn variant="ghost" small onClick={() => {
                                  const noteTxt = window.prompt("Ajouter une note (matière;évaluation;mois;note)", "Maths;Évaluation 1;Septembre;8");
                                  if (!noteTxt) return;
                                  const parts = noteTxt.split(";").map((x) => x.trim());
                                  if (parts.length < 4) { window.alert("Format: matière;évaluation;mois;note"); return; }
                                  const note20 = parseFloat(parts[3]);
                                  if (isNaN(note20)) return;
                                  setAnneesArchivees((prev) => prev.map((a, j) => j !== i ? a : {
                                    ...a,
                                    eleves: a.eleves.map((el, k) => k !== ei ? el : {
                                      ...el,
                                      notes: [...(el.notes || []), { matiere: parts[0], evaluation: parts[1], mois: parts[2], note20 }],
                                    }),
                                  }));
                                }}>Ajouter note</Btn>
                                <Btn variant="danger" small onClick={() => {
                                  if (!window.confirm(`Retirer ${e.prenom} ${e.nom} de l'archive ${arch.annee} ?`)) return;
                                  setAnneesArchivees((prev) => prev.map((a, j) => j !== i ? a : {
                                    ...a,
                                    eleves: a.eleves.filter((_, k) => k !== ei),
                                  }));
                                }}>Retirer élève</Btn>
                              </div>
                              <div><b>Notes ({notes.length})</b>
                                {notes.length === 0 ? <div>—</div> : notes.map((n, ni) => (
                                  <div key={ni} className="flex items-center justify-between gap-2">
                                    <span>{n.matiere} — {n.evaluation} ({n.mois}) : {n.note20}/{noteSurMax(e.classe) || 20}</span>
                                    <button type="button" className="text-[12px] underline" style={{ color: "#8A2E2E" }} onClick={() => {
                                      setAnneesArchivees((prev) => prev.map((a, j) => j !== i ? a : {
                                        ...a,
                                        eleves: a.eleves.map((el, k) => k !== ei ? el : {
                                          ...el,
                                          notes: (el.notes || []).filter((_, x) => x !== ni),
                                        }),
                                      }));
                                    }}>suppr.</button>
                                  </div>
                                ))}
                              </div>
                              <div><b>Absences ({absences.length})</b>
                                {absences.length === 0 ? <div>—</div> : absences.map((a, ai) => (
                                  <div key={ai}>{a.date} — {a.type} {a.motif ? `(${a.motif})` : ""}</div>
                                ))}
                              </div>
                              <div><b>Frais</b>
                                {frais.length === 0 ? <div>—</div> : frais.map((f, fi) => (
                                  <div key={fi} className="flex items-center justify-between gap-2">
                                    <span>{f.libelle} : dû {Number(f.du||0).toLocaleString("fr-FR")} F / payé {Number(f.paye||0).toLocaleString("fr-FR")} F</span>
                                    <button type="button" className="text-[12px] underline" style={{ color: "#1B2A4A" }} onClick={() => {
                                      const paye = window.prompt("Montant payé (FCFA)", String(f.paye || 0));
                                      if (paye === null) return;
                                      const n = parseFloat(paye);
                                      if (isNaN(n)) return;
                                      setAnneesArchivees((prev) => prev.map((a, j) => j !== i ? a : {
                                        ...a,
                                        eleves: a.eleves.map((el, k) => k !== ei ? el : {
                                          ...el,
                                          frais: (el.frais || []).map((ff, x) => x !== fi ? ff : { ...ff, paye: n }),
                                        }),
                                      }));
                                    }}>modif. payé</button>
                                  </div>
                                ))}
                              </div>
                              {e.decision && <div><b>Décision :</b> {e.decision}</div>}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}

      {onglet === "personnel" && (
        <Panel title="Informations du personnel" icon={Users}>
          {isFondateur && (
            <div className="mb-5 rounded-xl border p-4" style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
              <p className="mb-1 text-[15px] font-bold" style={{ color: "#991B1B" }}>Contrôle des accès (Fondateur uniquement)</p>
              <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>
                Bloquer = la personne ne peut plus entrer (le code est refusé). Débloquer = accès rétabli. Chaque classe peut avoir son propre code enseignant (synchronisé en base).
              </p>
              <div className="space-y-2">
                {[
                  { id: "directeur", label: "Directeur / Administratif" },
                  { id: "secretaire", label: "Secrétaire" },
                  { id: "enseignant", label: "Tous les enseignants (global)" },
                ].map((r) => {
                  const bloque = !!(rolesBloquesEtat && rolesBloquesEtat[r.id]);
                  return (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2" style={{ borderColor: "#E7DEC8" }}>
                      <div>
                        <span className="text-[14px] font-semibold" style={{ color: "#1B2A4A" }}>{r.label}</span>
                        {bloque && <span className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: "#FEE2E2", color: "#991B1B" }}>Bloqué</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Btn variant={bloque ? "gold" : "danger"} small onClick={() => basculerBlocageRole(r.id)}>
                          {bloque ? "Débloquer" : "Bloquer"}
                        </Btn>
                        <Btn variant="ghost" small onClick={() => changerCodeRoleFondateur(r.id)}>Changer le code</Btn>
                      </div>
                    </div>
                  );
                })}
                <p className="mt-2 text-[13px] font-semibold" style={{ color: "#1B2A4A" }}>Enseignants par classe</p>
                {(classes || []).map((cls) => {
                  const bloque = !!(rolesBloquesEtat && rolesBloquesEtat.enseignants && rolesBloquesEtat.enseignants[cls]);
                  let codeEns = "";
                  try {
                    let map = (codes && codes.enseignants) || {};
                    if (typeof map === "string") map = JSON.parse(map);
                    codeEns = String((map && map[cls]) || "").trim();
                  } catch (e) {}
                  return (
                    <div key={cls} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2" style={{ borderColor: "#E7DEC8" }}>
                      <div>
                        <span className="text-[14px] font-semibold" style={{ color: "#1B2A4A" }}>{cls}</span>
                        <span className="ml-2 text-[12px]" style={{ color: "#9A8B67" }}>{codeEns ? ("code : " + codeEns) : "pas de code"}</span>
                        {bloque && <span className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: "#FEE2E2", color: "#991B1B" }}>Bloqué</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Btn variant={bloque ? "gold" : "danger"} small onClick={() => basculerBlocageEnseignantClasse(cls)}>
                          {bloque ? "Débloquer" : "Bloquer"}
                        </Btn>
                        <Btn variant="ghost" small onClick={() => changerCodeEnseignantClasse(cls)}>Changer le code</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mb-4 space-y-2">
            {personnel.map((p, i) => (
              <div key={i} className="rounded-lg border p-3" style={{ borderColor: "#E7DEC8" }}>
                {personnelEnEdition === i ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Champ label="Nom" value={p.nom} onChange={(e) => modifierPersonnel(i, "nom", e.target.value)} />
                    <div>
                      <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Poste</label>
                      <select
                        value={p.poste}
                        onChange={(e) => modifierPersonnel(i, "poste", e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                        style={{ borderColor: "#E7DEC8" }}
                      >
                        <option>Directeur</option>
                        <option>Enseignant</option>
                        <option>Enseignante</option>
                        <option>Secrétaire</option>
                        <option>Gestionnaire</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe affectée</label>
                      <select
                        value={p.classe}
                        onChange={(e) => modifierPersonnel(i, "classe", e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                        style={{ borderColor: "#E7DEC8" }}
                      >
                        <option value="—">— (aucune)</option>
                        {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <Champ label="Téléphone" value={p.telephone} onChange={(e) => modifierPersonnel(i, "telephone", e.target.value)} />
                    <div className="flex items-end">
                      <Btn variant="gold" small onClick={() => setPersonnelEnEdition(null)}>Terminer</Btn>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[15px]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "#E6EAF2" }}>
                        <UserCircle2 size={16} style={{ color: "#1B2A4A" }} />
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: "#1B2A4A" }}>{p.nom}</div>
                        <div className="text-[13px]" style={{ color: "#9A8B67" }}>{p.poste} — {p.classe}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px]" style={{ color: "#5C5240" }}>{p.telephone}</span>
                      <Pencil size={14} className="cursor-pointer" style={{ color: "#9A8B67" }} onClick={() => setPersonnelEnEdition(i)} />
                      <Trash2 size={14} className="cursor-pointer" style={{ color: "#8A2E2E" }} onClick={() => supprimerPersonnel(i)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 rounded-lg p-3 sm:grid-cols-2" style={{ background: "#F1ECDD" }}>
            <Champ label="Nom" value={nouveauPersonnel.nom} onChange={(e) => setNouveauPersonnel({ ...nouveauPersonnel, nom: e.target.value })} />
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Poste</label>
              <select
                value={nouveauPersonnel.poste}
                onChange={(e) => setNouveauPersonnel({ ...nouveauPersonnel, poste: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                style={{ borderColor: "#E7DEC8" }}
              >
                <option>Enseignant</option>
                <option>Enseignante</option>
                <option>Secrétaire</option>
                <option>Gestionnaire</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe affectée</label>
              <select
                value={nouveauPersonnel.classe}
                onChange={(e) => setNouveauPersonnel({ ...nouveauPersonnel, classe: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                style={{ borderColor: "#E7DEC8" }}
              >
                <option value="—">— (aucune)</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Champ label="Téléphone" value={nouveauPersonnel.telephone} onChange={(e) => setNouveauPersonnel({ ...nouveauPersonnel, telephone: e.target.value })} />
            <div className="sm:col-span-2">
              <Btn variant="gold" icon={Plus} onClick={ajouterPersonnel}>Ajouter ce membre du personnel</Btn>
            </div>
          </div>
          <p className="mt-2 text-[13px]" style={{ color: "#9A8B67" }}>
            Si un enseignant est remplacé ou change de classe, clique sur le crayon pour modifier sa fiche directement — sa nouvelle classe sera reflétée automatiquement dans l'espace Parent.
          </p>
        </Panel>
      )}

      {(onglet === "annonces" || onglet === "messagePublic") && (
        <Panel title="Publier une annonce" icon={Megaphone}>
          <div className="mb-4 flex gap-2">
            <input
              value={nouvelleAnnonce}
              onChange={(e) => setNouvelleAnnonce(e.target.value)}
              placeholder="Ex. Congés de Noël le 20 décembre"
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <Btn variant="primary" icon={Plus} onClick={() => {
              if (!nouvelleAnnonce.trim()) return;
              setAnnonces([{ titre: nouvelleAnnonce, texte: nouvelleAnnonce, date: horodatageMsg() }, ...annonces]);
              setNouvelleAnnonce("");
            }}>Publier</Btn>
          </div>
          <div className="space-y-2">
            {annonces.map((a, i) => (
              <div key={i} className="rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}>
                {annonceEnEdition === i ? (
                  <div className="space-y-2">
                    <input
                      defaultValue={a.titre}
                      onBlur={(ev) => modifierAnnonce(i, "titre", ev.target.value)}
                      className="w-full rounded border px-2 py-1 text-[15px] font-medium outline-none"
                      style={{ borderColor: "#C9A227", color: "#1B2A4A" }}
                    />
                    <textarea
                      defaultValue={a.texte}
                      onBlur={(ev) => modifierAnnonce(i, "texte", ev.target.value)}
                      rows={2}
                      className="w-full rounded border px-2 py-1 text-[15px] outline-none"
                      style={{ borderColor: "#C9A227", color: "#5C5240" }}
                    />
                    <Btn variant="gold" small onClick={() => setAnnonceEnEdition(null)}>Terminer</Btn>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{a.titre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px]" style={{ color: "#9A8B67" }}>{a.date}</span>
                        <Pencil size={13} className="cursor-pointer" style={{ color: "#9A8B67" }} onClick={() => setAnnonceEnEdition(i)} />
                        <Trash2 size={13} className="cursor-pointer" style={{ color: "#8A2E2E" }} onClick={() => supprimerAnnonce(i)} />
                      </div>
                    </div>
                    <p className="mt-1 text-[15px]" style={{ color: "#5C5240" }}>{a.texte}</p>
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[13px]" style={{ color: "#9A8B67" }}>Ces annonces sont aussi visibles et modifiables depuis l'espace Secrétaire — tous les parents les voient au même endroit.</p>
        </Panel>
      )}

      {onglet === "emploi" && (
        <Panel title="Emplois du temps des classes" icon={CalendarClock}>
          <div className="space-y-3">
            {classes.map((classe) => {
              const emploiClasse = (emploiDuTemps && emploiDuTemps[classe]) || [];
              return (
                <details key={classe} className="rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}} open>
                  <summary className="cursor-pointer font-medium" style={{color:"#1B2A4A"}}>{classe} — {emploiClasse.length} créneau{emploiClasse.length > 1 ? "x" : ""}</summary>
                  <div className="mt-2 space-y-1">
                    {emploiClasse.length === 0 && <p className="text-[13px]" style={{color:"#9A8B67"}}>Aucun emploi du temps publié.</p>}
                    {emploiClasse.map((cours, index) => (
                      <div key={`${cours.jour}-${cours.creneau}-${index}`} className="flex justify-between rounded border px-2 py-1 text-[13px]" style={{borderColor:"#E7DEC8"}}>
                        <span>{cours.jour} · {cours.creneau} · {cours.matiere}</span>
                        <span style={{color:"#5C5240"}}>{cours.enseignant}</span>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </Panel>
      )}

      
      {onglet === "calendrier" && (
        <Panel title="Calendrier scolaire" icon={CalendarClock}>
          <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>Examens, vacances et événements de l&apos;école.</p>
          <div className="space-y-2">
            {lireCalendrierScolaire()
              .filter((ev) => !ev.classe || ev.classe === "toutes" || ev.classe === enfant.classe)
              .sort((a, b) => String(a.dateDebut || "").localeCompare(String(b.dateDebut || "")))
              .map((ev) => (
                <div key={ev.id} className="rounded-lg border px-3 py-2" style={{ borderColor: "#E7DEC8", background: "#FAF6EE" }}>
                  <p className="font-semibold" style={{ color: "#1B2A4A" }}>{ev.titre}</p>
                  <p className="text-[12px]" style={{ color: "#5C5240" }}>
                    {ev.dateDebut}{ev.dateFin ? " → " + ev.dateFin : ""} · {ev.type}
                    {ev.classe && ev.classe !== "toutes" ? " · " + ev.classe : ""}
                  </p>
                </div>
              ))}
            {lireCalendrierScolaire().filter((ev) => !ev.classe || ev.classe === "toutes" || ev.classe === enfant.classe).length === 0 && (
              <p className="text-[13px]" style={{ color: "#9A8B67" }}>Aucun événement pour le moment.</p>
            )}
          </div>
        </Panel>
      )}

      {onglet === "bulletin" && (
        <Panel title="Bulletin scolaire PDF" icon={FileText}>
          <div className="rounded-lg p-4" style={{background:"#F1ECDD"}}>
            <p className="text-[15px]" style={{color:"#3E3625"}}>Bulletin de <b>{enfant.prenom} {enfant.nom}</b> - Classe {enfant.classe}</p>
            <p className="text-[13px] mt-1" style={{color:"#5C5240"}}>Moyenne: {moyenne || 0}/{noteSurMax(enfant.classe) || 20} - {moyenne ? mentionPourNote(moyenne, enfant.classe) : ""} - {(enfant.notes || []).length} notes - {(enfant.absences || []).length} absences</p>
            <div className="mt-3 flex gap-2">
              <button onClick={()=>genererBulletinPDF(enfant, ecole, moyenne)} className="flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold" style={{background:"#1B2A4A", color:"#FAF6EE"}}><FileText size={16}/> 📄 Télécharger bulletin PDF</button>
            </div>
            <p className="text-[12px] mt-2" style={{color:"#9A8B67"}}>Le PDF s'ouvre et tu peux l'imprimer ou l'enregistrer. Il contient notes, absences, frais et signature directeur.</p>
          </div>
        </Panel>
      )}

      {(onglet === "messages" || onglet === "messageInterne") && (
        <Panel title="Messagerie administrative" icon={MessageSquare}>
          <div className="mb-4 rounded-lg p-3" style={{ background: "#F1ECDD" }}>
            <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Destinataire</label>
            <select
              value={nouveauMessageInterne.destinataire}
              onChange={(e) => setNouveauMessageInterne({ ...nouveauMessageInterne, destinataire: e.target.value })}
              className="mb-2 w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            >
              <option value="tous">Tout le personnel</option>
              {personnel.map((p, i) => (
                <option key={i} value={p.nom}>{p.nom} ({p.poste})</option>
              ))}
            </select>
            <textarea
              value={nouveauMessageInterne.texte}
              onChange={(e) => setNouveauMessageInterne({ ...nouveauMessageInterne, texte: e.target.value })}
              rows={3}
              placeholder="Écris ton message ici..."
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <div className="mt-2 flex justify-end">
              <Btn variant="gold" icon={Send} onClick={envoyerMessageInterne}>Envoyer</Btn>
            </div>
          </div>

          <div className="space-y-2">
            {messagesInternes.length === 0 && <p className="text-[15px]" style={{ color: "#9A8B67" }}>Aucun message envoyé pour le moment.</p>}
            {messagesInternes.map((m, i) => (
              <div key={i} className="rounded-lg border px-4 py-2.5 text-[15px]" style={{ borderColor: "#E7DEC8" }}>
                {messageInterneEnEdition === i ? (
                  <div className="space-y-2">
                    <textarea
                      defaultValue={m.texte}
                      onBlur={(ev) => modifierMessageInterne(i, ev.target.value)}
                      rows={2}
                      className="w-full rounded border px-2 py-1 text-[15px] outline-none"
                      style={{ borderColor: "#C9A227", color: "#3E3625" }}
                    />
                    <Btn variant="gold" small onClick={() => setMessageInterneEnEdition(null)}>Terminer</Btn>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Badge tone={m.destinataire === "tous" ? "or" : "ardoise"}>
                        {m.destinataire === "tous" ? "Tout le personnel" : m.destinataire}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px]" style={{ color: "#9A8B67" }}>{m.date}</span>
                        <Pencil size={13} className="cursor-pointer" style={{ color: "#9A8B67" }} onClick={() => setMessageInterneEnEdition(i)} />
                        <Trash2 size={13} className="cursor-pointer" style={{ color: "#8A2E2E" }} onClick={() => supprimerMessageInterne(i)} />
                      </div>
                    </div>
                    <p className="mt-1" style={{ color: "#5C5240" }}>{m.texte}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "messagesParents" && (
        <Panel title="Messages parents" icon={MessageSquare}>
          <p className="mb-4 text-[14px] font-semibold" style={{ color: "#5C5240" }}>
            Messages des parents, réponses de l&apos;administration, et envoi d&apos;un message vers un parent.
          </p>

          <div className="mb-5 rounded-xl border p-4" style={{ borderColor: "#E7DEC8", background: "#FBF8F0" }}>
            <div className="mb-2 font-bold text-[15px]" style={{ color: "#1B2A4A" }}>Écrire au parent</div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={msgAdminEleveId}
                onChange={(e) => setMsgAdminEleveId(e.target.value)}
                className="rounded-lg border px-3 py-2 text-[15px] outline-none sm:w-1/3"
                style={{ borderColor: "#E7DEC8" }}
              >
                <option value="">Choisir un élève…</option>
                {trierElevesAlpha(eleves).map((e) => (
                  <option key={e.id} value={e.id}>{e.prenom} {e.nom} — {e.classe}</option>
                ))}
              </select>
              <input
                value={msgAdminTexte}
                onChange={(e) => setMsgAdminTexte(e.target.value)}
                placeholder="Votre message pour le parent…"
                className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-[15px] outline-none"
                style={{ borderColor: "#E7DEC8" }}
              />
              <Btn variant="gold" icon={Send} onClick={envoyerMessageAuParent}>Envoyer</Btn>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 text-[13px] font-medium uppercase tracking-wide" style={{ color: "#9A8B67" }}>Messages envoyés aux parents (visibles aussi chez le parent)</div>
            <div className="space-y-2">
              {(() => {
                const vus = new Set();
                const lignes = [];
                eleves.forEach((e) => {
                  (e.messages || []).filter((m) => m.auteur === "Administration" || m.auteur === "Enseignant(e)").forEach((m) => {
                    const k = `${e.id}||${m.auteur}||${m.texte}||${m.date}`;
                    if (vus.has(k)) return;
                    vus.add(k);
                    lignes.push(
                      <div key={k} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2 text-[14px]" style={{ borderColor: "#DDEDE3", background: "#F3FAF5" }}>
                        <div className="min-w-0 flex-1">
                          <b>{e.prenom} {e.nom}</b> ({e.classe}) — <span style={{ color: "#2F5233" }}>{m.auteur}</span>
                          <div className="mt-0.5" style={{ color: "#1B2A4A" }}>{m.texte}</div>
                          <span className="text-[12px]" style={{ color: "#9A8B67" }}>{m.date}</span>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Btn variant="ghost" small icon={Pencil} onClick={() => modifierMessageAdmin(e.id, m.date, m.texte, m.auteur)}>Modifier</Btn>
                          <Btn variant="danger" small icon={Trash2} onClick={() => supprimerMessageAdmin(e.id, m.date, m.texte, m.auteur)}>Suppr.</Btn>
                        </div>
                      </div>
                    );
                  });
                });
                return lignes;
              })()}
              {eleves.every((e) => !(e.messages || []).some((m) => m.auteur === "Administration" || m.auteur === "Enseignant(e)")) && (
                <p className="text-[14px]" style={{ color: "#9A8B67" }}>Aucun message admin / enseignant envoyé pour le moment.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[13px] font-medium uppercase tracking-wide" style={{ color: "#9A8B67" }}>Messages reçus des parents</div>
            {messagesParents.filter((m) => !m.deAdmin).length === 0 && <p className="text-[15px]" style={{ color: "#9A8B67" }}>Aucun message reçu pour le moment.</p>}
            {messagesParents.filter((m) => !m.deAdmin).map((m) => {
              const idx = messagesParents.indexOf(m);
              return (
              <div key={m.id || `${m.eleveId}-${m.date}-${m.texte}`} className="rounded-lg border px-4 py-3" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{m.nomEleve}</span>
                    <Badge tone="ardoise">{m.classe}</Badge>
                    {m.lu ? <Badge tone="vert">Lu</Badge> : <Badge tone="or">Non lu</Badge>}
                  </div>
                  <span className="text-[13px]" style={{ color: "#9A8B67" }}>{m.date}</span>
                </div>
                <p className="mt-1.5 text-[15px] font-semibold" style={{ color: "#5C5240" }}>{m.texte}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {!m.lu && <Btn variant="ghost" small onClick={() => marquerLu(idx)}>Marquer comme lu</Btn>}
                  <input
                    value={reponseParent[idx] || ""}
                    onChange={(ev) => setReponseParent((prev) => ({ ...prev, [idx]: ev.target.value }))}
                    placeholder="Répondre à ce parent..."
                    className="min-w-0 flex-1 rounded border px-2 py-1.5 text-[13px] outline-none"
                    style={{ borderColor: "#E7DEC8" }}
                  />
                  <Btn variant="gold" icon={Send} small onClick={() => repondreParent(idx, m)}>Répondre</Btn>
                  <Btn variant="danger" small onClick={() => supprimerMessageParent(idx)}>Supprimer</Btn>
                </div>
              </div>
            );})}
          </div>
        </Panel>
      )}

      {onglet === "activite" && (
        <Panel title="Journal d'activité et connexions" icon={ClipboardList}
               actions={
                 <div className="flex flex-wrap gap-2">
                   <Btn variant="ghost" small icon={RefreshCw} onClick={() => { try { setPlateformeActiveEtat(lirePlateformeActive()); setActiviteTick((t) => t + 1); } catch (e) {} }}>Actualiser</Btn>
                   <Btn variant="ghost" small icon={FileText} onClick={() => {
                     const liste = lireJournal();
                     let html = "<table border=\"1\" cellpadding=\"5\" style=\"border-collapse:collapse;width:100%;font-size:12px\"><tr><th>Date</th><th>Texte</th><th>Rôle</th><th>OK</th></tr>";
                     liste.slice(0, 200).forEach((e) => {
                       html += "<tr><td>" + formaterDateJournal(e.date) + "</td><td>" + (e.texte || "") + "</td><td>" + (e.role || "") + "</td><td>" + (e.reussi === false ? "Non" : "Oui") + "</td></tr>";
                     });
                     html += "</table>";
                     const win = window.open("", "_blank");
                     if (!win) { alert("Autorisez les pop-ups"); return; }
                     win.document.write("<html><head><title>Journal activité</title></head><body style=\"font-family:sans-serif;padding:16px\"><h1>Journal d'activité</h1>" + html + "<p><button onclick=\"window.print()\">Imprimer / PDF</button></p></body></html>");
                     win.document.close();
                   }}>Export PDF journal</Btn>
                   {isFondateur && (
                     <Btn variant="danger" small onClick={() => {
                       if (!window.confirm("Effacer tout le journal d'activité sur cet appareil ?")) return;
                       ecrireJournalLocal([]);
                       try { journaliser("Journal effacé par le fondateur", "fondateur", { reussi: true }); } catch (e) {}
                       setActiviteTick((t) => t + 1);
                     }}>Effacer le journal</Btn>
                   )}
                 </div>
               }>
          {isFondateur && (
            <div className="mb-4 rounded-xl border p-4" style={{ borderColor: plateformeActiveEtat ? "#BBF7D0" : "#FECACA", background: plateformeActiveEtat ? "#F0FDF4" : "#FEF2F2" }}>
              <p className="text-[15px] font-bold" style={{ color: plateformeActiveEtat ? "#14532D" : "#991B1B" }}>
                {plateformeActiveEtat ? "Plateforme ouverte (contrôle Fondateur uniquement)" : "Plateforme fermée — seul le Fondateur peut entrer"}
              </p>
              <p className="mt-1 mb-3 text-[13px]" style={{ color: "#5C5240" }}>
                {plateformeActiveEtat
                  ? "Parents, enseignants, secrétaire et directeur peuvent se connecter normalement."
                  : "Les autres rôles voient « Code incorrect » et ne peuvent pas utiliser la plateforme (idéal pour les vacances ou la maintenance). Vous seul restez connecté."}
              </p>
              <div className="flex flex-wrap gap-2">
                {plateformeActiveEtat ? (
                  <Btn variant="danger" onClick={() => basculerPlateforme(false)}>Déconnecter toute la plateforme</Btn>
                ) : (
                  <Btn variant="gold" onClick={() => basculerPlateforme(true)}>Reconnecter la plateforme</Btn>
                )}
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-[12px] font-medium" style={{ color: "#5C5240" }}>Message maintenance (affiché si plateforme fermée)</label>
                <input
                  type="text"
                  defaultValue={lireMessageMaintenance()}
                  id="msg-maintenance-input"
                  placeholder="Ex. Vacances jusqu'au 15 septembre"
                  className="mb-2 w-full rounded-lg border px-3 py-2 text-[13px]"
                  style={{ borderColor: "#E7DEC8" }}
                />
                <Btn variant="ghost" small onClick={() => {
                  const el = document.getElementById("msg-maintenance-input");
                  ecrireMessageMaintenance(el ? el.value : "");
                  alert("Message enregistré.");
                }}>Enregistrer le message</Btn>
              </div>
            </div>
          )}
          <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>
            Liste des personnes qui se sont connectées (ou dont la tentative a été refusée), avec la date et l&apos;heure.
            Synchronisé entre appareils lorsque la base est joignable.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {["tous", "ok", "refuse", "parent", "enseignant", "secretaire", "directeur", "fondateur"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltreActivite(f)}
                className="rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{
                  background: filtreActivite === f ? "#1B2A4A" : "#F1ECDD",
                  color: filtreActivite === f ? "#FAF6EE" : "#5C5240",
                }}
              >
                {f === "tous" ? "Tous" : f === "ok" ? "Réussies" : f === "refuse" ? "Refusées" : f}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {(() => {
              void activiteTick;
              const liste = lireJournal();
              const filtree = liste.filter((e) => {
                if (!e) return false;
                if (filtreActivite === "ok") return e.reussi !== false;
                if (filtreActivite === "refuse") return e.reussi === false;
                if (["parent", "enseignant", "secretaire", "directeur", "fondateur"].includes(filtreActivite)) {
                  return String(e.role || "").toLowerCase() === filtreActivite || String(e.espace || "").toLowerCase() === filtreActivite;
                }
                return true;
              });
              if (!filtree.length) {
                return <p className="text-[14px]" style={{ color: "#9A8B67" }}>Aucune entrée pour ce filtre. Les prochaines connexions apparaîtront ici.</p>;
              }
              return filtree.slice(0, 200).map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg border px-3 py-2 text-[14px]"
                  style={{
                    borderColor: e.reussi === false ? "#FECACA" : "#E7DEC8",
                    background: e.reussi === false ? "#FEF2F2" : "#FFFFFF",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-semibold" style={{ color: e.reussi === false ? "#991B1B" : "#1B2A4A" }}>
                      {e.reussi === false ? "Refus — " : ""}{e.texte}
                    </span>
                    <span className="text-[12px]" style={{ color: "#9A8B67" }}>{formaterDateJournal(e.date)}</span>
                  </div>
                  <div className="mt-1 text-[12px]" style={{ color: "#5C5240" }}>
                    Rôle : <b>{e.role || "—"}</b>
                    {e.espace ? <> · Espace : <b>{e.espace}</b></> : null}
                    {e.detail ? <> · {e.detail}</> : null}
                  </div>
                </div>
              ));
            })()}
          </div>
        </Panel>
      )}

      {onglet === "parametres" && (
        <>
          <Panel title="Paramètres de l'établissement" icon={Settings}>
            <div className="mb-4 flex items-center gap-4">
              <Embleme logoUrl={ecole.logoUrl} taille={64} iconTaille={28} />
              <div className="flex-1">
                <label className="mb-2 inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-semibold transition hover:opacity-80" style={{ background: "#1B2A4A", color: "#FAF6EE" }}>
                  <Image size={15} /> Choisir une photo dans la galerie
                  <input type="file" accept="image/*" className="hidden" onChange={(ev) => {
                    const fichier = ev.target.files?.[0];
                    if (!fichier) return;
                    const lecteur = new FileReader();
                    lecteur.onload = () => setEcole((prev) => ({ ...prev, logoUrl: String(lecteur.result || "") }));
                    lecteur.readAsDataURL(fichier);
                  }} />
                </label>
                <Champ label="Lien (URL) du logo de l'école" value={ecole.logoUrl} onChange={champEcole("logoUrl")} placeholder="https://... (image hébergée en ligne)" />
                <p className="mt-1 text-[13px]" style={{ color: "#9A8B67" }}>
                  Vous pouvez choisir une photo directement depuis la galerie. Le lien est seulement une option pour une image déjà hébergée en ligne.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Champ label="Nom complet de l'école" value={ecole.nom} onChange={champEcole("nom")} />
              <Champ label="Sigle / Nom commercial" value={ecole.sigle} onChange={champEcole("sigle")} />
              <Champ label="Quartier" value={ecole.quartier} onChange={champEcole("quartier")} />
              <Champ label="Commune" value={ecole.commune} onChange={champEcole("commune")} />
              <Champ label="Département" value={ecole.departement} onChange={champEcole("departement")} />
              <Champ label="Nom du directeur" value={ecole.directeur} onChange={champEcole("directeur")} />
              <Champ label="Téléphone de l'école" value={ecole.telephone} onChange={champEcole("telephone")} />
              <Champ label="Téléphone du directeur (affiché en page de garde)" value={ecole.telephoneDirecteur} onChange={champEcole("telephoneDirecteur")} />
              <Champ label="Email de l'école" value={ecole.email} onChange={champEcole("email")} />
              <Champ label="Devise de l'école" value={ecole.devise} onChange={champEcole("devise")} />
              <Champ label="Lien réunion en ligne (Zoom, Meet, Jitsi…)" value={ecole.lienReunion || ""} onChange={champEcole("lienReunion")} placeholder="https://meet.jit.si/CSP-Sagesse-Divine" />
            </div>
            <p className="mt-3 text-[13px]" style={{ color: "#9A8B67" }}>Chaque champ s'enregistre automatiquement dès que tu quittes la case — ces informations apparaissent sur l'écran de connexion et la page d'inscription en ligne.</p>
          </Panel>

          <div className="h-4" />

          <Panel title="Codes d'accès du personnel" icon={KeyRound}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {isFondateur ? (
                <Champ label="Code Fondateur (seul Fondateur)" value={codes.fondateur} onChange={champCode("fondateur")} />
              ) : (
                <div className="rounded-lg border px-3 py-2 text-[13px] flex items-center" style={{borderColor:"#E7DEC8", background:"#F1ECDD", color:"#9A8B67"}}>🔒 Code Fondateur caché — seul Fondateur peut le modifier</div>
              )}
              <Champ label="Code Directeur" value={codes.directeur} onChange={champCode("directeur")} />
              <Champ label="Code Secrétaire" value={codes.secretaire} onChange={champCode("secretaire")} />
            </div>
            <div className="mt-5">
              <h4 className="font-serif text-[15px] font-semibold" style={{color:"#1B2A4A"}}>Codes Enseignants — 1 code par classe</h4>
              <p className="mt-1 text-[13px]" style={{color:"#9A8B67"}}>Chaque enseignant ne voit QUE sa classe. Clique « Générer » ou tape un code, puis donne-le à l&apos;enseignant. À la connexion, il choisit « Enseignant » et saisit ce code.</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {classes.map((cls)=>(
                  <div key={cls} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2" style={{borderColor:"#E7DEC8"}}>
                    <div className="min-w-[84px] text-[13px] font-semibold" style={{color:"#1B2A4A"}}>{cls}</div>
                    <input value={(codes.enseignants && codes.enseignants[cls]) || ""} onChange={(e)=>{ const v=e.target.value; setCodes((prev)=>({ ...prev, enseignants:{ ...(prev.enseignants||{}), [cls]: v } })); }} className="flex-1 bg-transparent text-[13px] font-mono outline-none" placeholder="ENS-..." style={{color:"#2B2118"}} />
                    <button onClick={()=>{ const nouveau="ENS-"+cls.replace(/[^A-Z0-9]/gi,"").toUpperCase()+"-"+Math.floor(1000+Math.random()*9000); setCodes((prev)=>({ ...prev, enseignants:{ ...(prev.enseignants||{}), [cls]: nouveau } })); }} className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{background:"#C9A227", color:"#1B2A4A"}}>Générer</button>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[13px]" style={{ color: "#9A8B67" }}>Code Parent = code élève CSPxxxx. Code Enseignant = code de sa classe uniquement.</p>
          </Panel>

          {isFondateur && (
            <Panel title="⚠️ Zone Fondateur — 7 pouvoirs" icon={ShieldCheck}>
              <p className="mb-3 text-[13px]" style={{color:"#8A2E2E"}}>
                Contrôle total : codes, suppressions, journal, exports, blocage des rôles, restauration, stats et sites.
              </p>

              {/* 1. Journal */}
              <div className="mb-4 rounded-lg border p-3" style={{borderColor:"#E7DEC8"}}>
                <div className="font-medium text-[15px]" style={{color:"#1B2A4A"}}>1. Journal d&apos;activité</div>
                <p className="text-[12px] mt-1 mb-2" style={{color:"#5C5240"}}>Dernières actions (paiements, validations, suppressions, exports)…</p>
                <div className="max-h-40 overflow-y-auto space-y-1 text-[12px]" style={{color:"#3E3625"}}>
                  {(typeof window !== "undefined" ? lireJournal() : []).slice(0, 40).map((j) => (
                    <div key={j.id} className="rounded px-2 py-1" style={{background:"#F8F4EA"}}>
                      <span style={{color:"#9A8B67"}}>{(j.date || "").slice(0, 19).replace("T", " ")}</span>
                      {" · "}<b>{j.role}</b>{" — "}{j.texte}
                    </div>
                  ))}
                  {lireJournal().length === 0 && <span style={{color:"#9A8B67"}}>Aucune entrée pour l&apos;instant.</span>}
                </div>
                <button type="button" className="mt-2 rounded px-2 py-1 text-[12px] font-bold" style={{background:"#1B2A4A", color:"#FAF6EE"}}
                  onClick={() => { if (confirm("Effacer tout le journal ?")) { try { localStorage.setItem(CLE_JOURNAL, "[]"); } catch (e) {} journaliser("Journal effacé", "fondateur"); setCodes((c) => ({ ...c })); } }}>
                  Vider le journal
                </button>
              </div>

              {/* 2. Réinit codes */}
              <div className="mb-4 rounded-lg border p-3" style={{borderColor:"#E7DEC8"}}>
                <div className="font-medium text-[15px]" style={{color:"#1B2A4A"}}>2. Réinitialiser un code (1 clic)</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ["directeur", "Directeur"],
                    ["secretaire", "Secrétaire"],
                    ["enseignant", "Enseignant (générique)"],
                  ].map(([role, label]) => (
                    <button key={role} type="button" className="rounded px-2 py-1 text-[12px] font-bold" style={{background:"#C9A227", color:"#1B2A4A"}}
                      onClick={() => {
                        const n = String(1000 + Math.floor(Math.random() * 9000));
                        if (!confirm(`Nouveau code ${label} : ${n} ?`)) return;
                        setCodes((prev) => ({ ...prev, [role]: n }));
                        journaliser(`Réinit code ${label} → ${n}`, "fondateur");
                        window.alert(`Code ${label} : ${n}`);
                      }}>
                      Réinit. {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Export */}
              <div className="mb-4 rounded-lg border p-3" style={{borderColor:"#E7DEC8"}}>
                <div className="font-medium text-[15px]" style={{color:"#1B2A4A"}}>3. Exporter les données (CSV)</div>
                <p className="text-[12px] mt-1 mb-2" style={{color:"#5C5240"}}>Télécharge 3 fichiers : élèves, notes, frais.</p>
                <button type="button" className="rounded px-3 py-1.5 text-[13px] font-bold" style={{background:"#1B2A4A", color:"#C9A227"}}
                  onClick={() => exporterDonneesCSV(eleves)}>
                  Exporter CSV
                </button>
              </div>

              {/* 4. Bloquer rôles */}
              <div className="mb-4 rounded-lg border p-3" style={{borderColor:"#E7DEC8"}}>
                <div className="font-medium text-[15px]" style={{color:"#1B2A4A"}}>4. Bloquer un rôle temporairement</div>
                <p className="text-[12px] mt-1 mb-2" style={{color:"#5C5240"}}>Empêche la connexion (sauf Fondateur).</p>
                <div className="flex flex-wrap gap-2">
                  {["directeur", "secretaire", "enseignant"].map((role) => {
                    const bloq = !!(lireRolesBloques()[role]);
                    return (
                      <button key={role} type="button"
                        className="rounded px-2 py-1 text-[12px] font-bold"
                        style={{ background: bloq ? "#8A2E2E" : "#E4EEE3", color: bloq ? "#fff" : "#2F5233" }}
                        onClick={() => {
                          const cur = lireRolesBloques();
                          const next = { ...cur, [role]: !cur[role] };
                          ecrireRolesBloques(next);
                          journaliser(`${next[role] ? "Blocage" : "Déblocage"} rôle ${role}`, "fondateur");
                          setCodes((c) => ({ ...c }));
                        }}>
                        {bloq ? "Débloquer" : "Bloquer"} {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Restaurer élève */}
              <div className="mb-4 rounded-lg border p-3" style={{borderColor:"#E7DEC8"}}>
                <div className="font-medium text-[15px]" style={{color:"#1B2A4A"}}>5. Restaurer un élève supprimé</div>
                <p className="text-[12px] mt-1 mb-2" style={{color:"#5C5240"}}>Archive locale après suppression — restauration possible ici.</p>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {lireArchivesSupprimes().length === 0 && <span className="text-[12px]" style={{color:"#9A8B67"}}>Aucune archive.</span>}
                  {lireArchivesSupprimes().slice(0, 20).map((e) => (
                    <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded px-2 py-1 text-[12px]" style={{background:"#F8F4EA"}}>
                      <span>{e.prenom} {e.nom} ({e.id}) — {e.classe}</span>
                      <button type="button" className="rounded px-2 py-0.5 font-bold" style={{background:"#2F5233", color:"#fff"}}
                        onClick={() => {
                          if (!confirm(`Restaurer ${e.prenom} ${e.nom} ?`)) return;
                          const id = String(e.id);
                          const restants = lireElevesSupprimes().filter((x) => String(x) !== id);
                          ecrireElevesSupprimes(restants);
                          retirerArchiveSupprime(id);
                          const { _archiveLe, ...propre } = e;
                          setEleves((prev) => prev.some((x) => String(x.id) === id) ? prev : [...prev, { ...propre, absences: propre.absences || [], notes: propre.notes || [], frais: propre.frais || [], messages: propre.messages || [] }]);
                          journaliser(`Restauration élève ${e.prenom} ${e.nom} (${id})`, "fondateur");
                          setCodes((c) => ({ ...c }));
                        }}>
                        Restaurer
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Stats avancées */}
              <div className="mb-4 rounded-lg border p-3" style={{borderColor:"#E7DEC8"}}>
                <div className="font-medium text-[15px]" style={{color:"#1B2A4A"}}>6. Statistiques avancées</div>
                {(() => {
                  const dus = (eleves || []).reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + (Number(f.du) || 0), 0), 0);
                  const payes = (eleves || []).reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + (Number(f.paye) || 0), 0), 0);
                  const reste = (eleves || []).reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + Math.max(0, (Number(f.du) || 0) - (Number(f.paye) || 0)), 0), 0);
                  const taux = dus > 0 ? Math.round((payes / dus) * 1000) / 10 : 0;
                  const parMois = {};
                  (eleves || []).forEach((e) => {
                    (e.frais || []).forEach((f) => {
                      if (!f.datePaiement && !f.payeLe) return;
                      const raw = String(f.payeLe || f.datePaiement);
                      const d = new Date(raw);
                      const cle = !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : raw.slice(0, 7);
                      parMois[cle] = (parMois[cle] || 0) + (Number(f.paye) || 0);
                    });
                  });
                  const mois = Object.keys(parMois).sort().slice(-6);
                  return (
                    <div className="mt-2 text-[13px]" style={{color:"#3E3625"}}>
                      <div>Taux de recouvrement : <b>{taux} %</b></div>
                      <div>Dus {dus.toLocaleString("fr-FR")} F · Payés {payes.toLocaleString("fr-FR")} F · Reste {reste.toLocaleString("fr-FR")} F</div>
                      <div className="mt-2 font-medium">Encaissements récents (par mois approx.)</div>
                      {mois.length === 0 && <div style={{color:"#9A8B67"}}>Pas encore de dates de paiement exploitables.</div>}
                      {mois.map((m) => (
                        <div key={m}>{m} : {parMois[m].toLocaleString("fr-FR")} F</div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* 7. Multi-sites */}
              <div className="mb-4 rounded-lg border p-3" style={{borderColor:"#E7DEC8"}}>
                <div className="font-medium text-[15px]" style={{color:"#1B2A4A"}}>7. Sites / antennes (multi-écoles)</div>
                <p className="text-[12px] mt-1 mb-2" style={{color:"#5C5240"}}>Liste des sites (préparation multi-établissements). Données élèves restent sur la base actuelle.</p>
                <div className="space-y-1 mb-2">
                  {lireSites().map((s, i) => (
                    <div key={i} className="flex justify-between gap-2 text-[12px] rounded px-2 py-1" style={{background:"#F8F4EA"}}>
                      <span><b>{s.nom}</b> — {s.adresse || "—"} ({s.responsable || "—"})</span>
                      <button type="button" className="text-[11px] font-bold" style={{color:"#8A2E2E"}}
                        onClick={() => { const next = lireSites().filter((_, j) => j !== i); ecrireSites(next); journaliser(`Site retiré: ${s.nom}`, "fondateur"); setCodes((c) => ({ ...c })); }}>
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="rounded px-2 py-1 text-[12px] font-bold" style={{background:"#C9A227", color:"#1B2A4A"}}
                  onClick={() => {
                    const nom = prompt("Nom du site / antenne :");
                    if (!nom || !nom.trim()) return;
                    const adresse = prompt("Adresse :") || "";
                    const responsable = prompt("Responsable :") || "";
                    const next = [...lireSites(), { nom: nom.trim(), adresse, responsable }];
                    ecrireSites(next);
                    journaliser(`Site ajouté: ${nom.trim()}`, "fondateur");
                    setCodes((c) => ({ ...c }));
                  }}>
                  Ajouter un site
                </button>
              </div>

              {/* Suppressions massives (existant) */}
              <div className="rounded-lg border p-3" style={{borderColor:"#F6C0C0", background:"#FBEAEA"}}>
                <div className="font-medium text-[14px]" style={{color:"#8A2E2E"}}>Suppressions massives</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => { if (confirm("FONDATEUR: Supprimer TOUS les élèves ?")) { (eleves || []).forEach(archiverEleveSupprime); marquerElevesSupprimes((eleves || []).map((e) => e.id)); setEleves([]); journaliser("Suppression TOUS les élèves", "fondateur"); } }} className="rounded px-2 py-1 text-[12px] font-bold" style={{background:"#8A2E2E", color:"white"}}>Supprimer tous élèves</button>
                  <button type="button" onClick={() => { if (confirm("FONDATEUR: Supprimer tout le personnel ?")) { setPersonnel([]); journaliser("Suppression tout le personnel", "fondateur"); } }} className="rounded px-2 py-1 text-[12px]" style={{border:"1px solid #8A2E2E", color:"#8A2E2E"}}>Supprimer tout personnel</button>
                  <button type="button" onClick={() => { if (confirm("FONDATEUR: Supprimer toutes les demandes ?")) { setDemandes([]); journaliser("Suppression toutes les demandes", "fondateur"); } }} className="rounded px-2 py-1 text-[12px]" style={{border:"1px solid #8A2E2E", color:"#8A2E2E"}}>Supprimer demandes</button>
                </div>
              </div>
            </Panel>
          )}
        </>
      )}
    </Coquille>
  );
}

/* ------------------------------------------------------------------
   ESPACE ENSEIGNANT
------------------------------------------------------------------- */

function EspaceEnseignant({ eleves, setEleves, annonces=[], classeAssignee, onQuitter }) {
  const { matieresParClasse, setMatieresParClasse, classes, messagesInternes, setMessagesInternes, emploiDuTemps, setEmploiDuTemps, annonces: annoncesCtx, fraisTypes, ecole } = useEcole();
  const annoncesAffichees = (annonces && annonces.length) ? annonces : (annoncesCtx || []);
  const [onglet, setOnglet] = useState("classe");
  const [maClasse, setMaClasse] = useState(classeAssignee || classes[0] || "CM1");
  const [baremeEnsTick, setBaremeEnsTick] = useState(0);
  useEffect(() => {
    if (classeAssignee && classes.includes(classeAssignee)) setMaClasse(classeAssignee);
  }, [classeAssignee]);
  useEffect(() => {
    if (classes.length > 0 && !classes.includes(maClasse)) setMaClasse(classes[0]);
  }, [classes, maClasse]);
  const normaliserClasse = (c) => String(c || "").trim().toLowerCase().replace(/\s+/g, " ");
  const [rechercheEleveClasse, setRechercheEleveClasse] = useState("");
  const mesElevesTous = trierElevesAlpha(
    eleves
      .filter((e) => normaliserClasse(e.classe) === normaliserClasse(maClasse))
      .map((e) => ({ ...e, absences: filtrerAbsencesEleve(e.id, e.absences || []), notes: dedupeNotes(e.notes || []), messages: e.messages || [], frais: e.frais || [] }))
  );
  const qEleve = (rechercheEleveClasse || "").trim().toLowerCase();
  const mesEleves = !qEleve
    ? mesElevesTous
    : mesElevesTous.filter((e) => (`${e.prenom || ""} ${e.nom || ""} ${e.id || ""}`).toLowerCase().includes(qEleve));
    const matieresBrutes = matieresParClasse[maClasse] || matieresParClasse[Object.keys(matieresParClasse || {}).find((k) => normaliserClasse(k) === normaliserClasse(maClasse))] || [];
  const matieres = dedupeMatieresParClasse({ x: matieresBrutes }).x || [];

  // Préremplir les domaines maternelle si la classe n'a encore aucune matière
  useEffect(() => {
    if (!estEvaluationNiveaux(maClasse)) return;
    const existantes = matieresParClasse[maClasse] || [];
    if (existantes.length > 0) return;
    setMatieresParClasse((prev) => {
      if ((prev[maClasse] || []).length) return prev;
      return { ...prev, [maClasse]: MATIERES_MATERNELLE_INIT.map((m) => ({ ...m })) };
    });
  }, [maClasse]);


  // --- Notes : ajout, correction, suppression ---
  const [nouvelleNote, setNouvelleNote] = useState({}); // { [eleveId]: { evaluation, mois } } — session de saisie partagée pour toutes les matières
  const [saisieRapide, setSaisieRapide] = useState({}); // { [eleveId]: { [matiere]: valeur } }
  const [confirmation, setConfirmation] = useState(null); // message de confirmation temporaire
  const [cleActualisation, setCleActualisation] = useState(0); // force le rafraîchissement visuel de la page

  const champNouvelleNote = (eleveId, cle, valeur) => {
    setNouvelleNote((prev) => ({
      ...prev,
      [eleveId]: { evaluation: "Évaluation 1", mois: "Septembre", ...prev[eleveId], [cle]: valeur },
    }));
  };

  const champSaisieRapide = (eleveId, matiere, valeur) => {
    setSaisieRapide((prev) => ({
      ...prev,
      [eleveId]: { ...(prev[eleveId] || {}), [matiere]: valeur },
    }));
  };

  const enregistrerNotesMatieres = (eleveId, nomEleve) => {
    const session = nouvelleNote[eleveId] || { evaluation: "Évaluation 1", mois: "Septembre" };
    const valeurs = saisieRapide[eleveId] || {};
    const modeMat = estEvaluationNiveaux(maClasse);
    const aRemplir = Object.entries(valeurs).filter(([, v]) => {
      if (v === "" || v == null) return false;
      if (modeMat) return ["TS", "S", "PS"].includes(String(v).toUpperCase()) || !isNaN(parseFloat(v));
      return !isNaN(parseFloat(v));
    });
    if (aRemplir.length === 0) return;
    const dateSaisie = formatDateFr();
    setEleves((prev) => {
      const next = prev.map((el) => {
        if (el.id !== eleveId) return el;
        const ajouts = aRemplir.map(([matiere, v]) => {
          const raw = String(v).toUpperCase();
          let note20;
          let niveau = null;
          if (modeMat && ["TS", "S", "PS"].includes(raw)) {
            niveau = raw;
            note20 = niveauVersNote20(raw);
          } else {
            note20 = parseFloat(v);
            if (modeMat) niveau = note20VersNiveau(note20);
          }
          return {
            evaluation: session.evaluation, mois: session.mois, matiere, note20, niveau, dateSaisie,
          };
        });
        // Remplace la note du même créneau au lieu d'empiler (évite multiplication chez le parent)
        const fusion = dedupeNotes([...(el.notes || []), ...ajouts]);
        return { ...el, notes: fusion };
      });
      try {
        const cache = lireStockageLocal() || {};
        ecrireStockageLocal({ ...cache, eleves: next, sauvegardeLe: new Date().toISOString() });
      } catch (e) {}
      return next;
    });
    try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400); } catch (e) {}
    setSaisieRapide((prev) => ({ ...prev, [eleveId]: {} }));
    setConfirmation(`${aRemplir.length} ${modeMat ? "appréciation(s) TS/S/PS" : "note(s)"} — ${session.evaluation} — pour ${nomEleve} (${eleveId}).`);
  };

  // --- Appréciation envoyée au parent, à propos de l'évolution de l'enfant ---
  const [appreciationSaisie, setAppreciationSaisie] = useState({}); // { [eleveId]: texte }

  const envoyerAppreciation = (eleveId, nomEleve) => {
    const texte = (appreciationSaisie[eleveId] || "").trim();
    if (!texte) return;
    const dateApp = horodatageMsg();
    setEleves((prev) => prev.map((el) => el.id === eleveId ? { ...el, messages: [...(el.messages || []), { auteur: "Enseignant(e)", texte, date: dateApp }] } : el));
    setMessagesInternes((prev) => [{ destinataire: "directeur", texte: "Appreciation " + maClasse + " pour " + nomEleve + ": " + texte, date: dateApp }, ...prev]);
    setAppreciationSaisie((prev) => ({ ...prev, [eleveId]: "" }));
    setConfirmation("Appreciation envoyee a Parent (" + maClasse + ") + Directeur");
  };

  const corrigerNote = (eleveId, index, val, nomEleve) => {
    if (val === "") return;
    const nb = parseFloat(val);
    if (isNaN(nb)) return;
    setEleves((prev) => prev.map((el) => el.id === eleveId
      ? { ...el, notes: el.notes.map((n, i) => i === index ? { ...n, note20: nb, dateSaisie: formatDateFr() } : n) }
      : el));
    setConfirmation(`Note corrigée pour ${nomEleve}`);
  };

  const supprimerNote = (eleveId, index) => {
    if (!window.confirm("Supprimer cette note / appréciation ?")) return;
    let cible = null;
    setEleves((prev) => prev.map((el) => {
      if (String(el.id) !== String(eleveId)) return el;
      const liste = el.notes || [];
      cible = liste[index];
      if (!cible) return el;
      marquerNoteSupprimee(eleveId, cible);
      const next = liste.filter((_, i) => i !== index).filter((n) => cleNoteObj(n) !== cleNoteObj(cible));
      return { ...el, notes: filtrerNotesEleve(eleveId, next) };
    }));
    setConfirmation("Note supprimée — ne reviendra plus après actualisation.");
    try {
      setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 300);
    } catch (e) {}
  };

  const passerClasseSuperieure = (eleve) => {
    const suiv = classeSuivante(classes, eleve.classe);
    if (!suiv) {
      window.alert("Pas de classe supérieure configurée après « " + eleve.classe + " ».");
      return;
    }
    if (!window.confirm(`Faire passer ${eleve.prenom} ${eleve.nom} de ${eleve.classe} vers ${suiv} ?\n\nNotes, absences et frais de l'ancienne classe seront effacés. Nouvelle fiche vide pour ${suiv}.`)) return;
    const decision = `Passé en classe supérieure : ${eleve.classe} → ${suiv}`;
    setEleves((prev) => prev.map((el) => {
      if (el.id !== eleve.id) return el;
      const nouveauxFrais = Array.from(new Map(
        (fraisTypes || [])
          .filter((f) => !f.classe || f.classe === suiv)
          .map((f) => [String(f.libelle || "").trim().toLowerCase(), { libelle: f.libelle, du: f.montant, paye: 0, mode: null, datePaiement: null }])
      ).values());
      return {
        ...el,
        classe: suiv,
        notes: [],
        absences: [],
        frais: nouveauxFrais,
        decision,
        messages: [{ auteur: "Administration", texte: decision, date: horodatageMsg() }],
      };
    }));
    setConfirmation(`${eleve.prenom} ${eleve.nom} passe en ${suiv} (fiche remise à zéro)`);
  };

  const doublerClasse = (eleve) => {
    if (!window.confirm(`Confirmer que ${eleve.prenom} ${eleve.nom} double la classe ${eleve.classe} ?\n\nLes notes/absences/frais de cette année seront effacés pour la nouvelle année dans cette classe.`)) return;
    const decision = `Double la classe ${eleve.classe}`;
    setEleves((prev) => prev.map((el) => {
      if (el.id !== eleve.id) return el;
      const nouveauxFrais = Array.from(new Map(
        (fraisTypes || [])
          .filter((f) => !f.classe || f.classe === eleve.classe)
          .map((f) => [String(f.libelle || "").trim().toLowerCase(), { libelle: f.libelle, du: f.montant, paye: 0, mode: null, datePaiement: null }])
      ).values());
      return {
        ...el,
        notes: [],
        absences: [],
        frais: nouveauxFrais,
        decision,
        messages: [{ auteur: "Administration", texte: decision, date: horodatageMsg() }],
      };
    }));
    setConfirmation(`${eleve.prenom} ${eleve.nom} : doublement de ${eleve.classe} enregistré`);
  };

  const actualiserPage = () => {
    setConfirmation(null);
    setCleActualisation((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Matières de la classe : ajout, modification, suppression ---
  const [nouvelleMatiere, setNouvelleMatiere] = useState({ nom: "", coef: 1 });

  const ajouterMatiere = () => {
    const nom = nouvelleMatiere.nom.trim();
    if (!nom) return;
    setMatieresParClasse((prev) => {
      const liste = prev[maClasse] || [];
      if (liste.some((m) => String(m.nom || "").trim().toLowerCase() === nom.toLowerCase())) return prev;
      return dedupeMatieresParClasse({
        ...prev,
        [maClasse]: [...liste, { nom, coef: Number(nouvelleMatiere.coef) || 1 }],
      });
    });
    setNouvelleMatiere({ nom: "", coef: 1 });
  };

  const modifierMatiere = (index, cle, valeur) => {
    setMatieresParClasse((prev) => ({
      ...prev,
      [maClasse]: (prev[maClasse] || []).map((m, i) => i === index ? { ...m, [cle]: cle === "coef" ? Number(valeur) || 1 : valeur } : m),
    }));
  };

  const supprimerMatiere = (index) => {
    setMatieresParClasse((prev) => ({
      ...prev,
      [maClasse]: (prev[maClasse] || []).filter((_, i) => i !== index),
    }));
  };

  // --- Absences : ajout, suppression ---
  const TYPES_ABSENCE = ["Absence", "Retard", "Permissionnaire", "Malade", "Sans motif"];
  const [nouvelleAbsence, setNouvelleAbsence] = useState({}); // { [eleveId]: { type, date, motif } }

  const champNouvelleAbsence = (eleveId, cle, valeur) => {
    setNouvelleAbsence((prev) => ({
      ...prev,
      [eleveId]: { type: TYPES_ABSENCE[0], date: "", motif: "", ...prev[eleveId], [cle]: valeur },
    }));
  };

  const ajouterAbsence = (eleveId, nomEleve) => {
    const a = nouvelleAbsence[eleveId];
    if (!a || !a.date?.trim()) {
      setConfirmation("Choisis une date avant d'ajouter l'absence.");
      return;
    }
    const nouvelle = {
      date: normaliserDateAbs(a.date) || a.date.trim(),
      type: (a.type || TYPES_ABSENCE[0]).trim(),
      motif: (a.motif || "").trim(),
    };
    const cle = cleAbsObj(nouvelle);
    let deja = false;
    setEleves((prev) => prev.map((el) => {
      if (el.id !== eleveId) return el;
      const existantes = dedupeAbsences(el.absences || []);
      if (existantes.some((x) => cleAbsObj(x) === cle)) {
        deja = true;
        return { ...el, absences: existantes };
      }
      return { ...el, absences: [...existantes, nouvelle] };
    }));
    setNouvelleAbsence((prev) => ({ ...prev, [eleveId]: { type: TYPES_ABSENCE[0], date: "", motif: "" } }));
    if (deja) {
      setConfirmation("Cette absence est déjà enregistrée.");
    } else {
      setConfirmation(`${nouvelle.type} enregistrée pour ${nomEleve} le ${nouvelle.date}`);
      try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 400); } catch (e) {}
    }
  };

  const supprimerAbsence = (eleveId, index) => {
    let cible = null;
    setEleves((prev) => prev.map((el) => {
      if (String(el.id) !== String(eleveId)) return el;
      const liste = el.absences || [];
      cible = liste[index];
      if (!cible) return el;
      const cle = cleAbsObj(cible);
      marquerAbsenceSupprimee(eleveId, cible);
      const next = liste.filter((a) => cleAbsObj(a) !== cle);
      return { ...el, absences: filtrerAbsencesEleve(eleveId, next) };
    }));
    if (cible) {
      // DELETE immédiat en base + sync
      supprimerAbsenceEnBase(eleveId, cible).then(() => {
        try { if (window.__cspFlushEleves) window.__cspFlushEleves(); } catch (e) {}
      }).catch(() => {
        try { if (window.__cspFlushEleves) window.__cspFlushEleves(); } catch (e) {}
      });
    }
    try { setTimeout(() => { if (window.__cspFlushEleves) window.__cspFlushEleves(); }, 500); } catch (e) {}
  };

  const nav = [
    { id: "classe", label: "Ma classe", icon: Users },
    { id: "notes", label: "Notes & corrections", icon: ClipboardList },
    { id: "evaluation", label: "Évaluation & rangs", icon: GraduationCap },
    { id: "absences", label: "Appel & absences", icon: CalendarClock },
    { id: "devoirs", label: "Cahier de textes", icon: FileText },
    { id: "matieres", label: "Matières", icon: FileText },
    { id: "emploi", label: "Emploi du temps", icon: CalendarClock },
    { id: "calendrier", label: "Calendrier", icon: CalendarClock },
    { id: "annonces", label: "Annonces", icon: Megaphone },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ];
  const [devoirsTick, setDevoirsTick] = useState(0);
  const [nouveauDevoir, setNouveauDevoir] = useState({ titre: "", detail: "", pourLe: "" });
  const elevesSansNote = useMemo(() => {
    return (eleves || []).filter((e) => e && e.classe === maClasse && !(e.notes || []).length);
  }, [eleves, maClasse]);

  return (
    <Coquille role="enseignant" roleLabel={`Enseignant · ${maClasse}`} nav={nav} actif={onglet} setActif={setOnglet}
              onQuitter={onQuitter || (() => {})}>
      {onglet === "evaluation" && (
        <PanneauEvaluation eleves={eleves} classes={classes} classeFixe={maClasse} ecole={ecole} />
      )}
      {onglet === "classe" && (
        <Panel title={`Classe ${maClasse}`} icon={Users}>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
            <label className="text-[13px] font-medium" style={{ color: "#5C5240" }}>Choisir une classe :</label>
            <select value={maClasse} onChange={(ev) => { setMaClasse(ev.target.value); setRechercheEleveClasse(""); }} className="rounded border px-2 py-1.5 text-[14px] outline-none" style={{ borderColor: "#E7DEC8" }}>
              {classes.map((classe) => <option key={classe} value={classe}>{classe}</option>)}
            </select>
            {classeAssignee && (
              <span className="text-[12px] font-semibold" style={{ color: "#9A8B67" }}>
                (code lié à {classeAssignee} — tu peux changer de classe ci-dessus)
              </span>
            )}
          </div>
          <div className="mb-4">
            <input
              type="search"
              value={rechercheEleveClasse}
              onChange={(ev) => setRechercheEleveClasse(ev.target.value)}
              placeholder="Rechercher un eleve (nom, prenom ou code)..."
              className="w-full rounded-lg border px-3 py-2.5 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8", background: "#FFFEFA" }}
            />
            {qEleve ? <p className="mt-1 text-[12px]" style={{ color: "#9A8B67" }}>{mesEleves.length} resultat(s)</p> : null}
          </div>
          <div className="space-y-2">
            {mesEleves.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-2.5"
                   style={{ borderColor: "#E7DEC8" }}>
                <div>
                  <div className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{e.prenom} {e.nom}</div>
                  <div className="text-[13px]" style={{ color: "#9A8B67" }}>Code {e.id}
                    {classeSuivante(classes, e.classe) ? (" · Passage → " + classeSuivante(classes, e.classe)) : " · Dernière classe"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                <Badge tone={(e.absences || []).length ? "or" : "vert"}>
                  {(e.absences || []).length} absence{(e.absences || []).length > 1 ? "s" : ""}
                </Badge>
                {classeSuivante(classes, e.classe) && (
                  <Btn variant="gold" small onClick={() => {
                    const prop = proposerPassage(e, classes);
                    if (!prop) return;
                    const exist = lirePassages().filter((p) => String(p.eleveId) !== String(e.id) && p.id !== prop.id);
                    ecrirePassages([prop, ...exist]);
                    setEleves((prev) => (prev || []).map((x) => String(x.id) === String(e.id) ? { ...x, decision: "passe" } : x));
                    try { journaliser("Proposition passage " + e.prenom + " " + e.nom + " → " + prop.versClasse, "enseignant"); } catch (err) {}
                    alert("Passage proposé : " + e.prenom + " " + e.nom + " → " + prop.versClasse + "\nEn attente de validation direction.");
                  }}>Proposer passage</Btn>
                )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Btn variant="gold" small onClick={() => passerClasseSuperieure(e)}>Passer en classe supérieure</Btn>
                  <Btn variant="ghost" small onClick={() => doublerClasse(e)}>Doubler</Btn>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "absences" && (
        <Panel title="Présences, absences et retards" icon={CalendarClock}
               actions={<Btn variant="ghost" icon={RefreshCw} small onClick={actualiserPage}>Actualiser</Btn>}>
          <div className="mb-4 rounded-xl border p-3" style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}>
            <p className="mb-2 text-[14px] font-bold" style={{ color: "#14532D" }}>Appel rapide — aujourd&apos;hui</p>
            <p className="mb-2 text-[12px]" style={{ color: "#5C5240" }}>Marquez les absents d&apos;un clic. Les présents n&apos;ont rien à saisir.</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {(eleves || []).filter((e) => e && e.classe === maClasse).sort((a, b) => String(a.nom || "").localeCompare(String(b.nom || ""), "fr")).map((e) => (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-[13px]" style={{ border: "1px solid #E7DEC8" }}>
                  <span className="font-semibold" style={{ color: "#1B2A4A" }}>{e.nom} {e.prenom}</span>
                  <div className="flex gap-1">
                    <Btn variant="danger" small onClick={() => {
                      const auj = new Date().toISOString().slice(0, 10);
                      const abs = { id: "abs-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), type: "Absence", date: auj, motif: "Appel du jour", dateSaisie: formatDateFr() };
                      setEleves((prev) => (prev || []).map((el) => el.id === e.id ? { ...el, absences: dedupeAbsences([...(el.absences || []), abs]) } : el));
                      try { journaliser("Appel: absence " + e.prenom + " " + e.nom, "enseignant", { detail: maClasse }); } catch (err) {}
                    }}>Absent</Btn>
                    <Btn variant="ghost" small onClick={() => {
                      const auj = new Date().toISOString().slice(0, 10);
                      const abs = { id: "ret-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), type: "Retard", date: auj, motif: "Appel du jour", dateSaisie: formatDateFr() };
                      setEleves((prev) => (prev || []).map((el) => el.id === e.id ? { ...el, absences: dedupeAbsences([...(el.absences || []), abs]) } : el));
                    }}>Retard</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {confirmation && (
            <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-[15px]"
                 style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <CheckCircle2 size={15} />{confirmation}
            </div>
          )}
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
            <label className="text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe :</label>
            <select value={maClasse} onChange={(ev) => { setMaClasse(ev.target.value); setRechercheEleveClasse(""); }} className="rounded border px-2 py-1.5 text-[14px] outline-none" style={{ borderColor: "#E7DEC8" }}>
              {classes.map((classe) => <option key={classe} value={classe}>{classe}</option>)}
            </select>
            <span className="text-[12px]" style={{ color: "#9A8B67" }}>{mesEleves.length} élève{mesEleves.length > 1 ? "s" : ""}</span>
          </div>
          <div className="mb-4">
            <input
              type="search"
              value={rechercheEleveClasse}
              onChange={(ev) => setRechercheEleveClasse(ev.target.value)}
              placeholder="Rechercher un eleve (nom, prenom ou code)..."
              className="w-full rounded-lg border px-3 py-2.5 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8", background: "#FFFEFA" }}
            />
            {qEleve ? <p className="mt-1 text-[12px]" style={{ color: "#9A8B67" }}>{mesEleves.length} resultat(s)</p> : null}
          </div>
          <div className="space-y-5">
            {mesEleves.length === 0 && (
              <p className="text-[15px]" style={{ color: "#9A8B67" }}>
                Aucun élève dans la classe « {maClasse} ». Vérifie le nom de la classe ou change de classe ci-dessus.
              </p>
            )}
            {mesEleves.map((e) => {
              const na = nouvelleAbsence[e.id] || { type: TYPES_ABSENCE[0], date: "", motif: "" };
              return (
                <div key={e.id} className="rounded-lg border p-4" style={{ borderColor: "#E7DEC8" }}>
                  <div className="mb-3 font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{e.prenom} {e.nom}</div>

                  {(e.absences || []).length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {(e.absences || []).map((a, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-[13px]"
                             style={{ borderColor: "#E7DEC8" }}>
                          <Badge tone={a.type === "Sans motif" ? "or" : "vert"}>{a.type}</Badge>
                          <span style={{ color: "#9A8B67" }}>{a.date}</span>
                          {a.motif && <span style={{ color: "#5C5240" }}>— {a.motif}</span>}
                          <Trash2 size={13} className="ml-auto cursor-pointer" style={{ color: "#8A2E2E" }}
                                  onClick={() => supprimerAbsence(e.id, i)} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 rounded-md px-2.5 py-2" style={{ background: "#F1ECDD" }}>
                    <select
                      value={na.type}
                      onChange={(ev) => champNouvelleAbsence(e.id, "type", ev.target.value)}
                      className="rounded border px-1.5 py-1 text-[13px] outline-none"
                      style={{ borderColor: "#E7DEC8" }}
                    >
                      {TYPES_ABSENCE.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                      type="date"
                      value={na.date}
                      onChange={(ev) => champNouvelleAbsence(e.id, "date", ev.target.value)}
                      className="rounded border px-1.5 py-1 text-[13px] outline-none"
                      style={{ borderColor: "#E7DEC8" }}
                    />
                    <input
                      value={na.motif}
                      onChange={(ev) => champNouvelleAbsence(e.id, "motif", ev.target.value)}
                      placeholder="Motif (optionnel)"
                      className="min-w-0 flex-1 rounded border px-1.5 py-1 text-[13px] outline-none"
                      style={{ borderColor: "#E7DEC8" }}
                    />
                    <Btn variant="gold" icon={Plus} small onClick={() => ajouterAbsence(e.id, `${e.prenom} ${e.nom}`)}>Ajouter</Btn>
                  </div>
                </div>
              );
            })}
            <p className="text-[13px]" style={{ color: "#9A8B67" }}>Choisis le type (Absence, Retard, Permissionnaire, Malade, Sans motif), la date, un motif si besoin, puis « Ajouter ». Ça apparaît aussitôt dans l'espace Parent.</p>
          </div>
        </Panel>
      )}

      {onglet === "notes" && (
        <Panel title="Notes & corrections" icon={ClipboardList}
               actions={<Btn variant="ghost" icon={RefreshCw} small onClick={actualiserPage}>Actualiser</Btn>}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}>
            <span className="text-[13px] font-semibold" style={{ color: "#14532D" }} key={"b-"+baremeEnsTick}>
              Barème de la classe {maClasse} :{" "}
              {estEvaluationNiveaux(maClasse) ? "Niveaux TS / S / PS" : ("sur " + (noteSurMax(maClasse) || 20))}
            </span>
            <select
              value={estEvaluationNiveaux(maClasse) ? "niveaux" : String(noteSurMax(maClasse) || 20)}
              onChange={(e) => {
                const x = e.target.value;
                const o = { ...lireBaremes(), [maClasse]: x === "niveaux" ? "niveaux" : Number(x) };
                ecrireBaremes(o);
                setBaremeEnsTick((t) => t + 1);
              }}
              className="rounded-lg border px-2 py-1 text-[13px]"
              style={{ borderColor: "#E7DEC8" }}
              title="Modifier le barème de cette classe"
            >
              <option value="10">Sur 10</option>
              <option value="20">Sur 20</option>
              <option value="niveaux">Niveaux (TS / S / PS)</option>
            </select>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
            <label className="text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe :</label>
            <select value={maClasse} onChange={(ev) => { setMaClasse(ev.target.value); setRechercheEleveClasse(""); }} className="rounded border px-2 py-1.5 text-[14px] outline-none" style={{ borderColor: "#E7DEC8" }}>
              {classes.map((classe) => <option key={classe} value={classe}>{classe}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <input type="search" value={rechercheEleveClasse} onChange={(ev) => setRechercheEleveClasse(ev.target.value)}
              placeholder="Rechercher un eleve (nom, prenom ou code)..."
              className="w-full rounded-lg border px-3 py-2.5 text-[15px] outline-none" style={{ borderColor: "#E7DEC8", background: "#FFFEFA" }} />
          </div>
          {(() => { const moyennes = mesEleves.map((e) => ({ nom: `${e.prenom} ${e.nom}`, moyenne: (e.notes || []).length ? (e.notes || []).reduce((s, n) => s + Number(n.note20 || 0), 0) / (e.notes || []).length : null })).filter((x) => x.moyenne !== null); const forte = moyennes.length ? moyennes.reduce((a, b) => a.moyenne > b.moyenne ? a : b) : null; const faible = moyennes.length ? moyennes.reduce((a, b) => a.moyenne < b.moyenne ? a : b) : null; return <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2"><div className="rounded-xl px-4 py-3 font-bold" style={{ background: "#DDEDE3", color: "#173526" }}>Plus forte moyenne<br /><span className="text-[17px]">{forte ? `${forte.nom} — ${forte.moyenne.toFixed(1)}/${noteSurMax(maClasse) || 20}` : "Pas encore de notes"}</span></div><div className="rounded-xl px-4 py-3 font-bold" style={{ background: "#F3DED6", color: "#7E352A" }}>Plus faible moyenne<br /><span className="text-[17px]">{faible ? `${faible.nom} — ${faible.moyenne.toFixed(1)}/${noteSurMax(maClasse) || 20}` : "Pas encore de notes"}</span></div></div>; })()}
          {confirmation && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[15px]"
                 style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <span className="flex items-center gap-2"><CheckCircle2 size={15} />{confirmation}</span>
              <button onClick={actualiserPage} className="flex items-center gap-1 text-[13px] font-medium underline underline-offset-2">
                <RefreshCw size={12} /> Actualiser la page
              </button>
            </div>
          )}
          <div key={cleActualisation} className="space-y-5">
            {matieres.length === 0 && (
              <p className="text-[15px]" style={{ color: "#9A8B67" }}>
                Aucune matière n&apos;est encore configurée pour {maClasse}.
                {estEvaluationNiveaux(maClasse)
                  ? " En maternelle, configure les domaines (sante, geste, pre-lecture…) puis saisis TS / S / PS."
                  : " Ajoute-les dans l onglet Matieres — elles apparaîtront ici pour saisir les notes (sur 10 en primaire, sur 20 sinon)."}
              </p>
            )}
            {mesEleves.map((e) => {
              const nn = nouvelleNote[e.id] || { evaluation: "Évaluation 1", mois: "Septembre" };
              const valeursSaisie = saisieRapide[e.id] || {};
              const nomEleve = `${e.prenom} ${e.nom}`;
              return (
                <div key={e.id} className="rounded-lg border p-4" style={{ borderColor: "#E7DEC8" }}>
                  <div className="mb-3 font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{nomEleve}</div>

                  {/* Notes regroupées par évaluation (pliable) */}
                  {(e.notes || []).length > 0 && (
                    <div className="mb-3 space-y-2">
                      {grouperNotesParEvaluation(e.notes || []).map((grp) => (
                        <details key={grp.evaluation} className="rounded-md border" style={{ borderColor: "#E7DEC8" }}>
                          <summary className="cursor-pointer px-3 py-2 font-semibold text-[14px]" style={{ color: "#1B2A4A", background: "#F8F4EA" }}>
                            {grp.evaluation}
                            <span className="ml-2 text-[12px] font-normal" style={{ color: "#9A8B67" }}>
                              {grp.mois.join(", ")} · {grp.liste.length} note{grp.liste.length > 1 ? "s" : ""}
                              {grp.moy != null ? (estEvaluationNiveaux(maClasse) ? ` · bilan ${libelleNiveau(grp.moy)}` : ` · moy. ${grp.moy}/${noteSurMax(maClasse) || 20}`) : ""}
                            </span>
                          </summary>
                          <div className="space-y-1.5 border-t px-2.5 py-2" style={{ borderColor: "#E7DEC8" }}>
                            {grp.liste.map((n) => (
                              <div key={n.indexOriginal} className="flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-[13px]"
                                   style={{ borderColor: "#E7DEC8" }}>
                                <span className="font-medium" style={{ color: "#1B2A4A" }}>{n.matiere}</span>
                                <span style={{ color: "#9A8B67" }}>{n.mois}</span>
                                <input
                                  type="number" min={0} max={noteSurMax(maClasse) || 20} defaultValue={n.note20}
                                  className="ml-auto w-14 rounded border px-1 text-center outline-none"
                                  style={{ borderColor: "#E7DEC8" }}
                                  onBlur={(ev) => corrigerNote(e.id, n.indexOriginal, ev.target.value, nomEleve)}
                                />
                                <span style={{ color: "#9A8B67" }}>/{noteSurMax(maClasse) || 20}</span>
                                <Trash2 size={13} className="cursor-pointer" style={{ color: "#8A2E2E" }}
                                        onClick={() => supprimerNote(e.id, n.indexOriginal)} />
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}

                  {/* Toutes les matières de la classe, prêtes à remplir */}
                  {matieres.length > 0 && (
                    <div className="rounded-md p-2.5" style={{ background: "#F1ECDD" }}>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <input
                          value={nn.evaluation}
                          onChange={(ev) => champNouvelleNote(e.id, "evaluation", ev.target.value)}
                          placeholder="Évaluation"
                          className="w-32 rounded border px-1.5 py-1 text-[13px] outline-none"
                          style={{ borderColor: "#E7DEC8" }}
                        />
                        <input
                          value={nn.mois}
                          onChange={(ev) => champNouvelleNote(e.id, "mois", ev.target.value)}
                          placeholder="Mois"
                          className="w-24 rounded border px-1.5 py-1 text-[13px] outline-none"
                          style={{ borderColor: "#E7DEC8" }}
                        />
                        <span className="text-[12px]" style={{ color: "#9A8B67" }}>— s'applique à toutes les matières remplies ci-dessous</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {matieres.map((m) => (
                          <div key={m.nom} className="flex items-center justify-between gap-2 rounded border bg-white px-2.5 py-1.5"
                               style={{ borderColor: "#E7DEC8" }}>
                            <span className="text-[13px]" style={{ color: "#1B2A4A" }}>{m.nom}</span>
                            {estEvaluationNiveaux(maClasse) ? (
                              <select
                                value={valeursSaisie[m.nom] || ""}
                                onChange={(ev) => champSaisieRapide(e.id, m.nom, ev.target.value)}
                                className="rounded border px-1.5 py-1 text-[13px] outline-none"
                                style={{ borderColor: "#E7DEC8", minWidth: "7rem" }}
                              >
                                <option value="">—</option>
                                <option value="TS">☺ TS</option>
                                <option value="S">😐 S</option>
                                <option value="PS">D PS</option>
                              </select>
                            ) : (
                              <input
                                type="number" min={0} max={noteSurMax(maClasse) || 20}
                                value={valeursSaisie[m.nom] || ""}
                                onChange={(ev) => champSaisieRapide(e.id, m.nom, ev.target.value)}
                                placeholder={"/" + (noteSurMax(maClasse) || 20)}
                                className="w-16 rounded border px-1.5 py-1 text-center text-[13px] outline-none"
                                style={{ borderColor: "#E7DEC8" }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Btn variant="gold" icon={Plus} small onClick={() => enregistrerNotesMatieres(e.id, nomEleve)}>
                          {estEvaluationNiveaux(maClasse) ? "Enregistrer les appréciations" : "Enregistrer ces notes"}
                        </Btn>
                      </div>
                    </div>
                  )}

                  {/* Appréciation envoyée au parent, sur l'évolution de l'enfant */}
                  <div className="mt-3 rounded-md p-2.5" style={{ background: "#EFE9F5" }}>
                    <label className="mb-1 block text-[12px] font-medium" style={{ color: "#5C5240" }}>
                      Appréciation à envoyer au parent (évolution de l'enfant)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <textarea
                        value={appreciationSaisie[e.id] || ""}
                        onChange={(ev) => setAppreciationSaisie((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                        rows={2}
                        placeholder={`Ex. ${e.prenom} progresse bien en lecture ce mois-ci, encore un effort en dictée...`}
                        className="min-w-0 flex-1 rounded border px-2 py-1.5 text-[13px] outline-none"
                        style={{ borderColor: "#E7DEC8" }}
                      />
                      <Btn variant="primary" icon={Send} small onClick={() => envoyerAppreciation(e.id, nomEleve)}>Envoyer au parent</Btn>
                    </div>
                    {(e.messages || []).length > 0 && (
                      <p className="mt-1.5 text-[12px]" style={{ color: "#9A8B67" }}>
                        Dernier message envoyé : « {(e.messages || [])[(e.messages || []).length - 1]?.texte} » — {(e.messages || [])[(e.messages || []).length - 1]?.date}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <p className="text-[13px]" style={{ color: "#9A8B67" }}>Modifie une note existante directement dans son champ, ou ajoute une nouvelle évaluation ci-dessous. Le bouton « Actualiser » en haut rafraîchit la page une fois la saisie terminée.</p>
          </div>
        </Panel>
      )}

      {onglet === "devoirs" && (
        <Panel title={"Cahier de textes — " + maClasse} icon={FileText}>
          <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>
            Devoirs et leçons pour votre classe. Visible aussi côté parent (liste ci-dessous synchronisée sur l&apos;appareil / base).
          </p>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Champ label="Titre" value={nouveauDevoir.titre} onChange={(e) => setNouveauDevoir({ ...nouveauDevoir, titre: e.target.value })} placeholder="Ex. Exercices page 12" />
            <Champ label="Pour le" value={nouveauDevoir.pourLe} onChange={(e) => setNouveauDevoir({ ...nouveauDevoir, pourLe: e.target.value })} type="date" />
            <Champ label="Détail" value={nouveauDevoir.detail} onChange={(e) => setNouveauDevoir({ ...nouveauDevoir, detail: e.target.value })} placeholder="Consignes…" />
          </div>
          <Btn variant="gold" icon={Plus} onClick={() => {
            if (!nouveauDevoir.titre.trim()) { alert("Indiquez un titre"); return; }
            const d = { id: "dev-" + Date.now(), classe: maClasse, titre: nouveauDevoir.titre.trim(), detail: nouveauDevoir.detail || "", pourLe: nouveauDevoir.pourLe || "", creeLe: new Date().toISOString() };
            ecrireDevoirs([d, ...lireDevoirs()]);
            setNouveauDevoir({ titre: "", detail: "", pourLe: "" });
            setDevoirsTick((t) => t + 1);
          }}>Ajouter le devoir</Btn>
          <div className="mt-4 space-y-2">
            {lireDevoirs().filter((d) => d.classe === maClasse).map((d) => (
              <div key={d.id + String(devoirsTick)} className="rounded-lg border p-3" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold" style={{ color: "#1B2A4A" }}>{d.titre}</p>
                    <p className="text-[12px]" style={{ color: "#9A8B67" }}>Pour le {d.pourLe || "—"}</p>
                    {d.detail ? <p className="mt-1 text-[13px]" style={{ color: "#5C5240" }}>{d.detail}</p> : null}
                  </div>
                  <Btn variant="danger" small onClick={() => { ecrireDevoirs(lireDevoirs().filter((x) => x.id !== d.id)); setDevoirsTick((t) => t + 1); }}>Suppr.</Btn>
                </div>
              </div>
            ))}
            {lireDevoirs().filter((d) => d.classe === maClasse).length === 0 && (
              <p className="text-[13px]" style={{ color: "#9A8B67" }}>Aucun devoir pour cette classe.</p>
            )}
          </div>
        </Panel>
      )}

      {onglet === "matieres" && (
        <Panel title={`Matières de la classe ${maClasse}`} icon={FileText}>
          <div className="mb-4 space-y-2">
            {matieres.map((m, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
                   style={{ borderColor: "#E7DEC8" }}>
                <input
                  defaultValue={m.nom}
                  onBlur={(ev) => modifierMatiere(i, "nom", ev.target.value)}
                  className="min-w-0 flex-1 rounded border px-2 py-1 text-[15px] outline-none"
                  style={{ borderColor: "#E7DEC8", color: "#1B2A4A" }}
                />
                <div className="flex items-center gap-1 text-[13px]" style={{ color: "#9A8B67" }}>
                  Coef.
                  <input
                    type="number" min={1} max={5} defaultValue={m.coef}
                    onBlur={(ev) => modifierMatiere(i, "coef", ev.target.value)}
                    className="w-12 rounded border px-1 py-1 text-center outline-none"
                    style={{ borderColor: "#E7DEC8" }}
                  />
                </div>
                <Trash2 size={15} className="cursor-pointer" style={{ color: "#8A2E2E" }}
                        onClick={() => supprimerMatiere(i)} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
            <input
              value={nouvelleMatiere.nom}
              onChange={(ev) => setNouvelleMatiere({ ...nouvelleMatiere, nom: ev.target.value })}
              placeholder="Nom de la nouvelle matière"
              className="min-w-0 flex-1 rounded border px-2 py-1.5 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <div className="flex items-center gap-1 text-[13px]" style={{ color: "#5C5240" }}>
              Coef.
              <input
                type="number" min={1} max={5}
                value={nouvelleMatiere.coef}
                onChange={(ev) => setNouvelleMatiere({ ...nouvelleMatiere, coef: ev.target.value })}
                className="w-12 rounded border px-1 py-1.5 text-center outline-none"
                style={{ borderColor: "#E7DEC8" }}
              />
            </div>
            <Btn variant="gold" icon={Plus} small onClick={ajouterMatiere}>Ajouter la matière</Btn>
          </div>
        </Panel>
      )}

      {onglet === "emploi" && (
        <Panel title={`Emploi du temps — ${maClasse}`} icon={CalendarClock}>
          <p className="mb-3 text-[14px] font-semibold" style={{ color: "#5C5240" }}>
            Ajoute, modifie ou supprime les créneaux de ta classe. Les parents et le directeur voient les changements automatiquement.
          </p>
          <div className="space-y-2 mb-3">
            {((emploiDuTemps && emploiDuTemps[maClasse]) || []).length === 0 && (
              <p className="text-[14px] font-medium" style={{ color: "#9A8B67" }}>Aucun créneau pour le moment.</p>
            )}
            {((emploiDuTemps && emploiDuTemps[maClasse]) || []).map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-[14px] font-semibold" style={{ borderColor: "#E7DEC8" }}>
                <span style={{ color: "#1B2A4A" }}>{c.jour}</span>
                <span style={{ color: "#9A8B67" }}>{c.creneau}</span>
                <span style={{ color: "#1B2A4A" }}>{c.matiere}</span>
                <span className="text-[13px]" style={{ color: "#5C5240" }}>{c.enseignant}</span>
                <button
                  onClick={() => setEmploiDuTemps((prev) => ({
                    ...prev,
                    [maClasse]: (prev[maClasse] || []).filter((_, idx) => idx !== i),
                  }))}
                  className="ml-auto rounded px-2 py-0.5 text-[12px] font-bold"
                  style={{ background: "#FBEAEA", color: "#8A2E2E" }}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
          <EmploiForm classe={maClasse} />
          <details className="mt-4 rounded-xl border px-4 py-3" style={{ borderColor: "#E7DEC8" }}>
            <summary className="cursor-pointer font-bold text-[15px]" style={{ color: "#1B2A4A" }}>Voir les autres classes (lecture seule)</summary>
            <div className="mt-2 space-y-2">
              {classes.filter((c) => c !== maClasse).map((classe) => {
                const cours = (emploiDuTemps && emploiDuTemps[classe]) || [];
                return (
                  <div key={classe} className="rounded-lg border px-3 py-2" style={{ borderColor: "#E7DEC8" }}>
                    <div className="font-bold text-[14px]" style={{ color: "#1B2A4A" }}>{classe} ({cours.length})</div>
                    {cours.length === 0 ? (
                      <p className="text-[13px]" style={{ color: "#9A8B67" }}>Aucun créneau.</p>
                    ) : cours.map((c, i) => (
                      <div key={i} className="text-[13px] font-medium" style={{ color: "#5C5240" }}>
                        {c.jour} · {c.creneau} · {c.matiere} {c.enseignant ? `— ${c.enseignant}` : ""}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </details>
        </Panel>
      )}

      {onglet === "calendrier" && (
        <Panel title="Calendrier scolaire" icon={CalendarClock}>
          <div className="space-y-2">
            {lireCalendrierScolaire()
              .filter((ev) => !ev.classe || ev.classe === "toutes" || ev.classe === maClasse)
              .sort((a, b) => String(a.dateDebut || "").localeCompare(String(b.dateDebut || "")))
              .map((ev) => (
                <div key={ev.id} className="rounded-lg border px-3 py-2" style={{ borderColor: "#E7DEC8", background: "#FAF6EE" }}>
                  <p className="font-semibold" style={{ color: "#1B2A4A" }}>{ev.titre}</p>
                  <p className="text-[12px]" style={{ color: "#5C5240" }}>{ev.dateDebut}{ev.dateFin ? " → " + ev.dateFin : ""} · {ev.type}</p>
                </div>
              ))}
            {lireCalendrierScolaire().filter((ev) => !ev.classe || ev.classe === "toutes" || ev.classe === maClasse).length === 0 && (
              <p className="text-[13px]" style={{ color: "#9A8B67" }}>Aucun événement.</p>
            )}
          </div>
        </Panel>
      )}

{onglet === "annonces" && (
        <Panel title="Annonces publiques de l’école" icon={Megaphone}>
          {(() => {
            const liste = annoncesAffichees || [];
            if (liste.length === 0) return <p className="text-[14px] font-semibold" style={{ color: "#9A8B67" }}>Aucune annonce pour le moment. Dès que le Directeur ou la Secrétaire publie, elle apparaît ici.</p>;
            return (
              <div className="space-y-2">
                {liste.map((a, i) => (
                  <div key={i} className="rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}>
                    <div className="font-bold text-[16px]" style={{ color: "#1B2A4A" }}>{a.titre}</div>
                    <p className="mt-1 text-[15px] font-semibold" style={{ color: "#3E3625" }}>{a.texte}</p>
                    <div className="text-[13px] font-medium" style={{ color: "#9A8B67" }}>{a.date}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </Panel>
      )}

      {onglet === "messages" && (
        <Panel title="Messages internes du Directeur" icon={MessageSquare}>
          <p className="mb-3 text-[13px] font-semibold" style={{ color: "#9A8B67" }}>
            Uniquement les messages envoyés par l’administration au personnel. Les notifications de paiement n’apparaissent pas ici.
          </p>
          {(() => {
            const msgs = (messagesInternes || []).filter((m) => {
              const t = (m.texte || "").toLowerCase();
              if (t.startsWith("paiement secretaire") || t.startsWith("paiement ")) return false;
              if (m.destinataire === "directeur" && t.includes("appreciation")) return false;
              return m.destinataire === "tous" || m.destinataire === "enseignant" || (m.destinataire || "").toLowerCase().includes("enseign");
            });
            if (msgs.length === 0) return <p className="text-[14px] font-medium" style={{ color: "#9A8B67" }}>Aucun message interne pour le moment.</p>;
            return (
              <div className="space-y-2">
                {msgs.map((m, i) => (
                  <div key={i} className="rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}>
                    <Badge tone={m.destinataire === "tous" ? "or" : "ardoise"}>
                      {m.destinataire === "tous" ? "Tout le personnel" : m.destinataire}
                    </Badge>
                    <p className="mt-1 text-[15px] font-semibold" style={{ color: "#3E3625" }}>{m.texte}</p>
                    <div className="text-[12px] font-medium" style={{ color: "#9A8B67" }}>{m.date}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </Panel>
      )}
    </Coquille>
  );
}

/* ------------------------------------------------------------------
   ESPACE SECRÉTAIRE
------------------------------------------------------------------- */

const MODES_PAIEMENT = ["Espèces", "Orange Money", "MTN MoMo", "Wave", "Virement"];

function EspaceSecretaire({ eleves, setEleves, demandes, setDemandes, annonces, setAnnonces, onQuitter }) {
  const { classes, fraisTypes, messagesInternes, setMessagesInternes, ecole } = useEcole();
  const [onglet, setOnglet] = useState("frais");
  const [rechercheSec, setRechercheSec] = useState("");
  const [confirmationInscription, setConfirmationInscription] = useState(null);
  const [nouvelleAnnonce, setNouvelleAnnonce] = useState("");
  const [classeAnnuaire, setClasseAnnuaire] = useState((classes && classes[0]) || "CI");
  const [rechercheAnnuaire, setRechercheAnnuaire] = useState("");

  // --- Inscription (enfant amené en personne au secrétariat) ---
  // La demande part vers la Bibliothèque du Directeur : la secrétaire ne
  // génère et ne voit jamais le code élève — seul le Directeur valide et le communique.
  const [form, setForm] = useState({ prenom: "", nom: "", sexe: "", naissance: "", classe: classes[0], parrainNom: "", parrainTelephone: "" });
  const champ = (cle) => (e) => setForm({ ...form, [cle]: e.target.value });
  const age = useMemo(() => ageDepuis(form.naissance), [form.naissance]);
  const valide = form.prenom.trim() && form.nom.trim() && form.sexe && form.naissance && form.parrainNom.trim() && form.parrainTelephone.trim();

  const soumettreInscription = () => {
    if (!valide) return;
    setDemandes((prev) => [
      {
        id: `DEM-${Math.floor(1000 + Math.random() * 9000)}`,
        prenom: form.prenom,
        nom: form.nom,
        sexe: form.sexe,
        naissance: form.naissance,
        age,
        classeSouhaitee: form.classe,
        parrainNom: form.parrainNom,
        parrainTelephone: form.parrainTelephone,
        message: "",
        origine: "secretariat",
        date: horodatageMsg(),
        statut: "en_attente",
      },
      ...prev,
    ]);
    setConfirmationInscription(`${form.prenom} ${form.nom}`);
    setForm({ prenom: "", nom: "", sexe: "", naissance: "", classe: classes[0], parrainNom: "", parrainTelephone: "" });
  };

  // --- Enregistrement d'un paiement : répartition sur plusieurs rubriques en une fois ---
  const [montantsSaisis, setMontantsSaisis] = useState({}); // { [eleveId]: { [libelle]: montant } }
  const [modePaiementSaisi, setModePaiementSaisi] = useState({}); // { [eleveId]: mode }
  const [modeSaisieFrais, setModeSaisieFrais] = useState({}); // { [eleveId]: "ajouter" | "corriger" }
  const [confirmationPaiement, setConfirmationPaiement] = useState(null);
  const [classeFraisActive, setClasseFraisActive] = useState(null); // null = liste des classes
  const [rechercheEleveFrais, setRechercheEleveFrais] = useState("");

  const champMontant = (eleveId, libelle, valeur) => {
    setMontantsSaisis((prev) => ({
      ...prev,
      [eleveId]: { ...(prev[eleveId] || {}), [libelle]: valeur },
    }));
  };

  const totalSaisiPour = (eleveId) => {
    const montants = montantsSaisis[eleveId] || {};
    return Object.values(montants).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  };

  const enregistrerPaiement = (eleve) => {
    const montants = montantsSaisis[eleve.id] || {};
    const mode = modePaiementSaisi[eleve.id] || MODES_PAIEMENT[0];
    const modeSaisie = modeSaisieFrais[eleve.id] || "ajouter";
    const saisies = Object.entries(montants).filter(([, v]) => v !== "" && v != null && !isNaN(parseFloat(v)));
    if (!saisies.length) return;
    let resume = [];
    let lignesRecu = [];
    let totalMouvement = 0;
    setEleves((prev) => prev.map((e) => {
      if (e.id !== eleve.id) return e;
      const maintenant = new Date().toISOString();
      let fraisNext = (e.frais || []).map((f) => {
          if (!(f.libelle in montants) || montants[f.libelle] === "" || montants[f.libelle] == null) return f;
          const val = parseFloat(montants[f.libelle]);
          if (isNaN(val)) return f;
          const ancien = Number(f.paye) || 0;
          let nouveau;
          if (modeSaisie === "corriger") {
            nouveau = Math.max(0, val);
          } else {
            nouveau = Math.max(0, ancien + val);
          }
          if (nouveau === ancien) return f;
          const mouvement = nouveau - ancien;
          totalMouvement += mouvement;
          resume.push(`${f.libelle}: ${ancien} → ${nouveau} F`);
          lignesRecu.push({
            libelle: f.libelle,
            ancien,
            mouvement,
            nouveau,
            reste: Math.max(0, (Number(f.du) || 0) - nouveau),
          });
          return { ...f, paye: nouveau, mode, datePaiement: maintenant, payeLe: maintenant };
        });
      // Rubriques saisies absentes de la fiche → les créer
      Object.entries(montants).forEach(([lib, valBrut]) => {
        if (valBrut === "" || valBrut == null || isNaN(parseFloat(valBrut))) return;
        if (fraisNext.some((f) => f.libelle === lib)) return;
        const val = parseFloat(valBrut);
        const nouveau = Math.max(0, val);
        totalMouvement += nouveau;
        resume.push(`${lib}: 0 → ${nouveau} F`);
        lignesRecu.push({ libelle: lib, ancien: 0, mouvement: nouveau, nouveau, reste: 0 });
        fraisNext = [...fraisNext, { libelle: lib, du: nouveau, paye: nouveau, mode, datePaiement: maintenant, payeLe: maintenant }];
      });
      return { ...e, frais: fraisNext };
    }));
    if (!resume.length) {
      setConfirmationPaiement("Aucune modification (mêmes montants).");
      return;
    }
    const texteMsg = modeSaisie === "corriger"
      ? `Correction frais Secretaire: ${eleve.prenom} ${eleve.nom} (${eleve.classe}) — ${resume.join(" ; ")} (${mode})`
      : `Paiement Secretaire: ${eleve.prenom} ${eleve.nom} (${eleve.classe}) — ${resume.join(" ; ")} (${mode})`;
    setMessagesInternes((prev) => [{ destinataire: "directeur", texte: texteMsg, date: horodatageMsg() }, ...prev]);
    setConfirmationPaiement((modeSaisie === "corriger" ? "Correction enregistrée — " : "Paiement enregistré — ") + resume.join(" · ") + " — Reçu disponible");
    setMontantsSaisis((prev) => ({ ...prev, [eleve.id]: {} }));
    journaliser(`${modeSaisie === "corriger" ? "Correction" : "Paiement"} frais ${eleve.prenom} ${eleve.nom}: ${resume.join(" ; ")}`, "secretaire");
    // Priorité sync : éviter qu'un ancien montant distant écrase la saisie
    try {
      if (typeof window !== "undefined") {
        window.__cspFraisPriorite = window.__cspFraisPriorite || {};
        window.__cspFraisPriorite[String(eleve.id)] = Date.now();
      }
    } catch (e) {}
    // Forcer l'envoi vers Supabase rapidement (parent voit le montant)
    setTimeout(() => {
      try {
        if (typeof window !== "undefined" && typeof window.__cspFlushEleves === "function") {
          window.__cspFlushEleves();
        }
      } catch (e) {}
    }, 300);
    try {
      genererRecuPaiement({
        ecole: ecole || {},
        eleve,
        lignes: lignesRecu,
        mode,
        modeSaisie,
        totalMouvement,
      });
    } catch (err) {
      console.warn("reçu", err);
    }
  };

  const nav = [
    { id: "inscriptions", label: "Nouvelle inscription (comme en ligne)", icon: ClipboardList },
    { id: "frais", label: "Encaisser frais (auto-sync Parent/Directeur)", icon: Wallet },
    { id: "situationFinanciere", label: "Situation financière", icon: Wallet },
    { id: "annuaire", label: "Annuaire (listes de classe)", icon: Users },
    { id: "effectifs", label: "Garçons / Filles", icon: Users },
    { id: "annonces", label: "Annonces (lecture)", icon: Megaphone },
    { id: "messages", label: "Messages parents (lecture seule)", icon: MessageSquare },
    { id: "messagesInternes", label: "Messages internes", icon: MessageSquare },
  ];

  return (
    <Coquille role="secretaire" roleLabel="Secrétaire" nav={nav} actif={onglet} setActif={setOnglet}
              onQuitter={onQuitter || (() => {})}>
      {(() => {
        const dus = eleves.reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + (Number(f.du) || 0), 0), 0);
        const collectes = eleves.reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + (Number(f.paye) || 0), 0), 0);
        const reste = eleves.reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + Math.max(0, (Number(f.du) || 0) - (Number(f.paye) || 0)), 0), 0);
        return (
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl p-3 text-center" style={{ background: "#FEF3C7" }}>
              <div className="text-[12px] font-medium" style={{ color: "#92400E" }}>Dû</div>
              <div className="text-[15px] font-bold" style={{ color: "#78350F" }}>{dus.toLocaleString("fr-FR")} F</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "#D1FAE5" }}>
              <div className="text-[12px] font-medium" style={{ color: "#065F46" }}>Collecté</div>
              <div className="text-[15px] font-bold" style={{ color: "#047857" }}>{collectes.toLocaleString("fr-FR")} F</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "#FEE2E2" }}>
              <div className="text-[12px] font-medium" style={{ color: "#991B1B" }}>Reste à collecter</div>
              <div className="text-[15px] font-bold" style={{ color: "#B91C1C" }}>{reste.toLocaleString("fr-FR")} F</div>
            </div>
          </div>
        );
      })()}
      {onglet === "inscriptions" && (
        <>
          {confirmationInscription && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[15px]"
                 style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} />
                Demande transmise au Directeur pour {confirmationInscription} — en attente de validation.
              </span>
              <button onClick={() => setConfirmationInscription(null)} className="text-[13px] underline underline-offset-2">Fermer</button>
            </div>
          )}

          <Panel title="Inscrire un enfant (venu en personne au secrétariat)" icon={FileText}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Champ label="Prénom de l'enfant" value={form.prenom} onChange={champ("prenom")} />
              <Champ label="Nom de l'enfant" value={form.nom} onChange={champ("nom")} />
              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Sexe</label>
                <div className="flex gap-2">
                  {[{ v: "F", l: "Féminin" }, { v: "M", l: "Masculin" }].map((opt) => (
                    <button key={opt.v} type="button" onClick={() => setForm({ ...form, sexe: opt.v })}
                            className="flex-1 rounded-lg border px-3 py-2 text-[15px] transition"
                            style={{
                              borderColor: form.sexe === opt.v ? "#C9A227" : "#E7DEC8",
                              background: form.sexe === opt.v ? "#FBF0D2" : "transparent",
                              color: form.sexe === opt.v ? "#8A6D14" : "#5C5240",
                            }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Date de naissance</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={form.naissance} onChange={champ("naissance")}
                         className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{ borderColor: "#E7DEC8" }} />
                  {age !== null && <Badge tone="ardoise">{age} an{age > 1 ? "s" : ""}</Badge>}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe souhaitée</label>
                <select value={form.classe} onChange={champ("classe")}
                        className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{ borderColor: "#E7DEC8" }}>
                  {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Champ label="Nom du parrain" value={form.parrainNom} onChange={champ("parrainNom")} />
              <Champ label="Numéro du parrain" value={form.parrainTelephone} onChange={champ("parrainTelephone")} placeholder="9x xx xx xx" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              {!valide && <p className="text-[13px]" style={{ color: "#8A2E2E" }}>Merci de remplir tous les champs.</p>}
              <div className="ml-auto"><Btn variant="gold" icon={Plus} onClick={soumettreInscription}>Transmettre au Directeur</Btn></div>
            </div>
            <p className="mt-3 text-[13px]" style={{ color: "#9A8B67" }}>
              Que l'inscription soit faite ici ou en ligne par le parent, elle part toujours dans la Bibliothèque du Directeur pour validation — la secrétaire ne génère pas et ne voit pas le code élève : seul le Directeur le valide et le communique à qui de droit.
            </p>
          </Panel>

          <div className="h-4" />

          <Panel title="Demandes en cours" icon={Inbox}>
            <div className="space-y-2">
              {demandes.length === 0 && <p className="text-[15px]" style={{ color: "#9A8B67" }}>Aucune demande pour le moment.</p>}
              {demandes.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-[15px]"
                     style={{ borderColor: "#E7DEC8" }}>
                  <div>
                    <span style={{ color: "#1B2A4A" }} className="font-medium">{d.prenom} {d.nom}</span>
                    <span className="ml-2 text-[13px]" style={{ color: "#9A8B67" }}>{d.classeSouhaitee} · {d.origine === "secretariat" ? "saisie au secrétariat" : "en ligne"}</span>
                  </div>
                  {d.statut === "en_attente" && <Badge tone="or">En attente</Badge>}
                  {d.statut === "validee" && <Badge tone="vert">Validée</Badge>}
                  {d.statut === "refusee" && <Badge tone="ardoise">Refusée</Badge>}
                </div>
              ))}
            </div>
          </Panel>

          <div className="h-4" />

          <Panel title="Élèves inscrits" icon={ClipboardList}>
            <div className="space-y-2">
              {trierElevesAlpha(eleves).map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-[15px]"
                     style={{ borderColor: "#E7DEC8" }}>
                  <span style={{ color: "#1B2A4A" }} className="font-medium">{e.prenom} {e.nom}</span>
                  <Badge tone="ardoise">{e.classe}</Badge>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {onglet === "emploi" && (
        <Panel title="Emploi du temps - Gestion par classe" icon={CalendarClock}>
          <p className="mb-3 text-[13px]" style={{color:"#9A8B67"}}>Crée ou modifie l'emploi du temps. Chaque matière ajoutée par l'enseignant apparaît aussi ici automatiquement (même base Supabase). Visible instantanément par parents et enseignants.</p>
          <div className="space-y-4">
            {classes.map(c=>{
              const emploiClasse = (emploiDuTemps && emploiDuTemps[c]) || [];
              return (
                <details key={c} className="rounded-lg border px-4 py-3" style={{borderColor:"#E7DEC8"}} open>
                  <summary className="flex justify-between cursor-pointer"><span className="font-medium" style={{color:"#1B2A4A"}}>{c}</span><span className="text-[13px] px-2 py-0.5 rounded-full" style={{background: emploiClasse.length?"#E4EEE3":"#F1ECDD"}}>{emploiClasse.length} créneaux</span></summary>
                  <div className="mt-3 space-y-2">
                    {emploiClasse.map((e,i)=>(
                      <div key={i} className="flex gap-2 items-center rounded border px-2 py-1.5 text-[13px]" style={{borderColor:"#E7DEC8"}}>
                        <span className="font-medium" style={{color:"#1B2A4A"}}>{e.jour}</span>
                        <span style={{color:"#9A8B67"}}>{e.creneau}</span>
                        <span style={{color:"#1B2A4A"}}>{e.matiere}</span>
                        <span className="text-[11px]" style={{color:"#5C5240"}}>{e.enseignant}</span>
                        <button onClick={()=>{ setEmploiDuTemps(prev=>({...prev, [c]: (prev[c]||[]).filter((_,idx)=>idx!==i)})); }} className="ml-auto text-[11px] px-1.5 py-0.5 rounded" style={{background:"#FBEAEA", color:"#8A2E2E"}}>Supprimer</button>
                      </div>
                    ))}
                    <EmploiForm classe={c} />
                  </div>
                </details>
              );
            })}
          </div>
        </Panel>
      )}

      
            {onglet === "situationFinanciere" && (
        <Panel title="Situation financière — frais scolaires" icon={Wallet}>
          <PanneauSituationFinanciere eleves={eleves || []} classes={classes || []} fraisTypes={fraisTypes || []} />
        </Panel>
      )}

{onglet === "annuaire" && (
        <Panel title="Annuaire — listes de classe" icon={Users}>
          <div className="mb-3">
            <Champ label="Recherche rapide (nom, prénom, code, téléphone)" value={rechercheSec || ""} onChange={(e) => setRechercheSec(e.target.value)} placeholder="Taper pour filtrer…" />
          </div>
          <p className="mb-3 text-[14px]" style={{ color: "#5C5240" }}>
            Liste alphabétique (par nom) de chaque classe, avec le <b>code élève</b>. Tu peux copier ou imprimer.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {classes.map((cl) => {
              const n = eleves.filter((e) => e.classe === cl).length;
              return (
                <button key={cl} type="button" onClick={() => setClasseAnnuaire(cl)}
                  className="rounded-full px-3 py-1.5 text-[13px] font-semibold"
                  style={{ background: classeAnnuaire === cl ? "#0F766E" : "#CCFBF1", color: classeAnnuaire === cl ? "#fff" : "#115E59" }}>
                  {cl} ({n})
                </button>
              );
            })}
          </div>
          {(() => {
            const q = (rechercheAnnuaire || "").trim().toLowerCase();
            const elevesClasse = trierElevesAlpha(eleves.filter((e) => e.classe === classeAnnuaire)).filter((e) => {
              if (!q) return true;
              const blob = `${e.nom || ""} ${e.prenom || ""} ${e.id || ""}`.toLowerCase();
              return blob.includes(q);
            });
            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-serif text-xl font-bold" style={{ color: "#134E4A" }}>
                    Classe {classeAnnuaire} — {elevesClasse.length} élève(s)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Btn variant="gold" icon={ClipboardList} onClick={() => {
                      const t = texteListeClasse(elevesClasse, classeAnnuaire);
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(t).then(() => alert("Liste copiée !")).catch(() => prompt("Copiez :", t));
                      } else prompt("Copiez :", t);
                    }}>Copier la liste</Btn>
                    <Btn variant="ghost" icon={FileText} onClick={() => imprimerListeClasse(elevesClasse, classeAnnuaire, ecole)}>Imprimer</Btn>
                  </div>
                </div>
                <input
                  type="search"
                  value={rechercheAnnuaire}
                  onChange={(ev) => setRechercheAnnuaire(ev.target.value)}
                  placeholder="Rechercher un élève (nom, prénom ou code)…"
                  className="w-full rounded-xl border-2 px-4 py-3 text-[16px] outline-none"
                  style={{ borderColor: "#99F6E4", background: "#F0FDFA" }}
                />
                {elevesClasse.length === 0 && (
                  <p className="text-center text-[16px] py-6" style={{ color: "#9A8B67" }}>Aucun élève trouvé</p>
                )}
                <div className="space-y-3">
                  {elevesClasse.map((e, i) => (
                    <div key={e.id} className="rounded-2xl border-2 px-4 py-4" style={{ borderColor: "#99F6E4", background: "#F0FDFA" }}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold" style={{ background: "#0F766E", color: "#fff" }}>{i + 1}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-serif text-[22px] font-bold leading-tight" style={{ color: "#134E4A" }}>{e.nom || "—"}</div>
                          <div className="mt-0.5 text-[17px]" style={{ color: "#115E59" }}>{e.prenom || ""}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[15px]">
                            <span className="rounded-lg px-2.5 py-1 font-mono font-bold" style={{ background: "#CCFBF1", color: "#0F766E" }}>{e.id}</span>
                            <span className="rounded-lg px-2.5 py-1 font-semibold" style={{ background: "#FEF3C7", color: "#92400E" }}>{e.classe || classeAnnuaire}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </Panel>
      )}

{onglet === "effectifs" && (
        <Panel title="Garçons / Filles" icon={Users}>
          <PanneauEffectifsSexe eleves={eleves || []} ecole={ecole || {}} setEleves={setEleves} demandes={demandes || []} />
        </Panel>
      )}

      {onglet === "frais" && (
        <Panel title="Frais scolaires — par classe" icon={Wallet}>
          <div className="mb-4 rounded-xl border p-3" style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
            <p className="mb-1 text-[14px] font-bold" style={{ color: "#991B1B" }}>Relance frais impayés</p>
            <p className="mb-2 text-[12px]" style={{ color: "#5C5240" }}>Élèves avec un reste à payer &gt; 0</p>
            <div className="max-h-40 space-y-1 overflow-y-auto text-[13px]">
              {(eleves || []).filter((e) => {
                const reste = (e.frais || []).reduce((s, f) => s + Math.max(0, (Number(f.du) || 0) - (Number(f.paye) || 0)), 0);
                return reste > 0;
              }).slice(0, 30).map((e) => {
                const reste = (e.frais || []).reduce((s, f) => s + Math.max(0, (Number(f.du) || 0) - (Number(f.paye) || 0)), 0);
                return (
                  <div key={e.id} className="flex flex-wrap justify-between gap-1 rounded bg-white px-2 py-1" style={{ border: "1px solid #FECACA" }}>
                    <span>{e.nom} {e.prenom} ({e.classe})</span>
                    <span className="font-bold">{reste.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                );
              })}
            </div>
            <Btn variant="ghost" small className="mt-2" onClick={() => {
              const lignes = (eleves || []).filter((e) => (e.frais || []).reduce((s, f) => s + Math.max(0, (Number(f.du) || 0) - (Number(f.paye) || 0)), 0) > 0)
                .map((e) => {
                  const reste = (e.frais || []).reduce((s, f) => s + Math.max(0, (Number(f.du) || 0) - (Number(f.paye) || 0)), 0);
                  return e.prenom + " " + e.nom + " (" + e.classe + ") — reste " + reste.toLocaleString("fr-FR") + " FCFA";
                });
              const texte = "Relance frais scolaires — CSP Sagesse Divine\n\n" + lignes.join("\n");
              try { navigator.clipboard.writeText(texte); alert("Liste copiée — collez-la dans WhatsApp ou un message."); }
              catch (err) { alert(texte); }
            }}>Copier la liste de relance</Btn>
          </div>
          {confirmationPaiement && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[15px] font-semibold"
                 style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <span className="flex items-center gap-2"><CheckCircle2 size={15} />{confirmationPaiement}</span>
              <button onClick={() => setConfirmationPaiement(null)} className="text-[13px] font-bold underline underline-offset-2">Fermer</button>
            </div>
          )}
          {!classeFraisActive ? (
            <>
              <p className="mb-3 text-[14px] font-semibold" style={{ color: "#5C5240" }}>
                Choisis une classe pour voir les élèves et enregistrer les paiements.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {classes.map((c) => {
                  const elevesClasse = trierElevesAlpha(eleves.filter((e) => e.classe === c));
                  const resteTotal = elevesClasse.reduce((s, e) => s + (e.frais || []).reduce((a, f) => a + Math.max(0, (Number(f.du)||0) - (Number(f.paye)||0)), 0), 0);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setClasseFraisActive(c)}
                      className="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition hover:opacity-90"
                      style={{ borderColor: "#E7DEC8", background: "#FFFDF6" }}
                    >
                      <div>
                        <div className="font-bold text-[16px]" style={{ color: "#1B2A4A" }}>{c}</div>
                        <div className="text-[13px] font-semibold" style={{ color: "#9A8B67" }}>{elevesClasse.length} élève{elevesClasse.length > 1 ? "s" : ""}</div>
                      </div>
                      <Badge tone={resteTotal === 0 ? "vert" : "or"}>
                        {resteTotal === 0 ? "Soldé" : `Reste ${resteTotal.toLocaleString("fr-FR")} F`}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => { setClasseFraisActive(null); setRechercheEleveFrais(""); }} className="flex items-center gap-1 text-[14px] font-bold" style={{ color: "#8A6D14" }}>
                  <ArrowLeft size={14} /> Toutes les classes
                </button>
                <span className="font-bold text-[17px]" style={{ color: "#1B2A4A" }}>{classeFraisActive}</span>
                <Badge tone="ardoise">{trierElevesAlpha(eleves.filter((e) => e.classe === classeFraisActive)).length} élève(s)</Badge>
              </div>
              <div className="mb-3">
                <input
                  type="search"
                  value={rechercheEleveFrais}
                  onChange={(ev) => setRechercheEleveFrais(ev.target.value)}
                  placeholder="Rechercher un eleve (nom, prenom ou code)..."
                  className="w-full rounded-lg border px-3 py-2.5 text-[15px] outline-none"
                  style={{ borderColor: "#E7DEC8", background: "#FFFEFA" }}
                />
              </div>
              <div className="space-y-4">
                {eleves.filter((e) => {
                  if (e.classe !== classeFraisActive) return false;
                  const q = (rechercheEleveFrais || "").trim().toLowerCase();
                  if (!q) return true;
                  return (`${e.prenom || ""} ${e.nom || ""} ${e.id || ""}`).toLowerCase().includes(q);
                }).length === 0 && (
                  <p className="text-[14px] font-semibold" style={{ color: "#9A8B67" }}>
                    {(rechercheEleveFrais || "").trim() ? "Aucun eleve ne correspond a la recherche." : "Aucun eleve dans cette classe."}
                  </p>
                )}
                {eleves.filter((e) => {
                  if (e.classe !== classeFraisActive) return false;
                  const q = (rechercheEleveFrais || "").trim().toLowerCase();
                  if (!q) return true;
                  return (`${e.prenom || ""} ${e.nom || ""} ${e.id || ""}`).toLowerCase().includes(q);
                }).map((e) => {
                  const du = (e.frais || []).reduce((a, f) => a + (Number(f.du)||0), 0);
                  const paye = (e.frais || []).reduce((a, f) => a + (Number(f.paye)||0), 0);
                  const reste = du - paye;
                  const mode = modePaiementSaisi[e.id] || MODES_PAIEMENT[0];
                  const totalSaisi = totalSaisiPour(e.id);
                  return (
                    <div key={e.id} className="rounded-lg border p-4" style={{ borderColor: "#E7DEC8" }}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-bold text-[16px]" style={{ color: "#1B2A4A" }}>{e.prenom} {e.nom}</span>
                        <Badge tone={reste === 0 ? "vert" : "or"}>{reste === 0 ? "Soldé" : `Reste ${reste.toLocaleString("fr-FR")} F`}</Badge>
                      </div>
                      <div className="space-y-2">
                        {(e.frais || []).map((f, i) => {
                          const soldee = f.paye >= f.du;
                          const resteFrais = Math.max(0, f.du - f.paye);
                          const valeurSaisie = (montantsSaisis[e.id] || {})[f.libelle] || "";
                          return (
                            <div key={i} className="rounded-2xl border p-3 text-[14px]" style={{ borderColor: "#E7DEC8" }}>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="font-serif text-lg font-bold" style={{ color: "#1B2A4A" }}>{f.libelle}</span>
                                <span className="rounded-full px-2.5 py-1 text-[13px] font-bold" style={{ background: soldee ? "#E4EEE3" : "#F3E0D9", color: soldee ? "#2F5233" : "#A84B3A" }}>
                                  Reste {resteFrais.toLocaleString("fr-FR")} FCFA
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <div className="rounded-xl px-3 py-2.5 font-bold" style={{ background: "#F3DED6", color: "#A84B3A" }}>
                                  DÛ<br /><span className="font-serif text-xl">{Number(f.du).toLocaleString("fr-FR")} FCFA</span>
                                </div>
                                <div className="rounded-xl px-3 py-2.5 font-bold" style={{ background: "#DDEDE3", color: "#173526" }}>
                                  PAYÉ<br /><span className="font-serif text-xl">{Number(f.paye).toLocaleString("fr-FR")} FCFA</span>
                                </div>
                              </div>
                              {f.mode && <div className="mt-2 text-[13px] font-semibold" style={{ color: "#5C5240" }}>Dernier paiement : {f.mode} ({f.datePaiement})</div>}
                              <input
                                type="number" min={0}
                                value={valeurSaisie}
                                onChange={(ev) => champMontant(e.id, f.libelle, ev.target.value)}
                                placeholder={(modeSaisieFrais[e.id] || "ajouter") === "corriger" ? "Nouveau total payé" : (soldee ? "Complément éventuel" : "Montant à ajouter")}
                                className="mt-2 w-32 rounded border px-2 py-1 text-right font-semibold outline-none"
                                style={{ borderColor: "#E7DEC8" }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      {(() => {
                        const modeSaisie = modeSaisieFrais[e.id] || "ajouter";
                        const aUneSaisie = Object.values(montantsSaisis[e.id] || {}).some((v) => v !== "" && v != null && !isNaN(parseFloat(v)));
                        if (!aUneSaisie && reste <= 0 && modeSaisie === "ajouter") return null;
                        return (
                        <div className="mt-3 space-y-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setModeSaisieFrais((prev) => ({ ...prev, [e.id]: "ajouter" }))}
                              className="rounded-full px-3 py-1 text-[12px] font-bold"
                              style={{ background: modeSaisie === "ajouter" ? "#1B2A4A" : "#FFFFFF", color: modeSaisie === "ajouter" ? "#FAF6EE" : "#1B2A4A", boxShadow: "inset 0 0 0 1px #1B2A4A55" }}>
                              Ajouter un versement
                            </button>
                            <button type="button" onClick={() => setModeSaisieFrais((prev) => ({ ...prev, [e.id]: "corriger" }))}
                              className="rounded-full px-3 py-1 text-[12px] font-bold"
                              style={{ background: modeSaisie === "corriger" ? "#8A6D14" : "#FFFFFF", color: modeSaisie === "corriger" ? "#FAF6EE" : "#8A6D14", boxShadow: "inset 0 0 0 1px #C9A22788" }}>
                              Corriger le total payé
                            </button>
                          </div>
                          <p className="text-[12px] font-semibold" style={{ color: "#5C5240" }}>
                            {modeSaisie === "corriger"
                              ? "Saisis le nouveau montant TOTAL déjà payé (ex. 15000 pour remplacer 20000)."
                              : "Saisis le montant à ajouter. Pour baisser, utilise « Corriger le total payé »."}
                          </p>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: "#5C5240" }}>
                              {modeSaisie === "corriger" ? "Nouveau total payé saisi :" : "Total à ajouter :"}
                              <span className="font-serif text-base font-bold" style={{ color: totalSaisi !== 0 ? "#2F5233" : "#9A8B67" }}>
                                {totalSaisi.toLocaleString("fr-FR")} F
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={mode}
                                onChange={(ev) => setModePaiementSaisi((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                                className="rounded border px-2 py-1.5 text-[13px] font-semibold outline-none"
                                style={{ borderColor: "#E7DEC8" }}
                              >
                                {MODES_PAIEMENT.map((m) => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <Btn variant="gold" small onClick={() => enregistrerPaiement(e)}>
                                {modeSaisie === "corriger" ? "Enregistrer la correction" : "Enregistrer ce paiement"}
                              </Btn>
                            </div>
                          </div>
                        </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <p className="mt-3 text-[13px] font-semibold" style={{ color: "#9A8B67" }}>
            Le paiement est visible immédiatement chez le parent et le directeur.
          </p>
        </Panel>
      )}

      {(onglet === "annonces" || onglet === "messagePublic") && (
        <Panel title="Publier une annonce" icon={Megaphone}>
          <div className="mb-4 flex gap-2">
            <input
              value={nouvelleAnnonce}
              onChange={(e) => setNouvelleAnnonce(e.target.value)}
              placeholder="Ex. La cantine sera fermée demain"
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <Btn variant="primary" icon={Plus} onClick={() => {
              if (!nouvelleAnnonce.trim()) return;
              setAnnonces([{ titre: nouvelleAnnonce, texte: nouvelleAnnonce, date: horodatageMsg() }, ...annonces]);
              setNouvelleAnnonce("");
            }}>Publier</Btn>
          </div>
          <div className="space-y-2">
            {annonces.map((a, i) => (
              <div key={i} className="rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{a.titre}</span>
                  <span className="text-[13px]" style={{ color: "#9A8B67" }}>{a.date}</span>
                </div>
                <p className="mt-1 text-[15px]" style={{ color: "#5C5240" }}>{a.texte}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[13px]" style={{ color: "#9A8B67" }}>Ces annonces sont partagées avec celles du Directeur — tous les parents les voient au même endroit.</p>
        </Panel>
      )}

      {onglet === "messages" && (
        <Panel title="Messages parents (lecture seule)" icon={MessageSquare}>
          <p className="mb-3 text-[13px]" style={{color:"#8A2E2E"}}>Secrétaire voit seulement, ne peut pas répondre. Seul Directeur/Fondateur répond.</p>
          <MessagesParentsLectureSeule />
        </Panel>
      )}
      {onglet === "messagesInternes" && (
        <Panel title="Messages internes" icon={MessageSquare}>
          {messagesInternes.length === 0 && <p className="text-[14px]" style={{ color: "#9A8B67" }}>Aucun message pour le moment.</p>}
          <div className="space-y-2">{messagesInternes.map((m, i) => <div key={i} className="rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}><Badge tone={m.destinataire === "tous" ? "or" : "ardoise"}>{m.destinataire === "tous" ? "Tout le personnel" : m.destinataire}</Badge><p className="mt-1 text-[14px]" style={{ color: "#5C5240" }}>{m.texte}</p><div className="text-[12px]" style={{ color: "#9A8B67" }}>{m.date}</div></div>)}</div>
        </Panel>
      )}
    </Coquille>
  );
}

function MessagesParentsLectureSeule(){
  const { messagesParents } = useEcole();
  if(!messagesParents || messagesParents.length===0) return <p className="text-[14px]" style={{color:"#9A8B67"}}>Aucun message parent pour le moment.</p>;
  return (
    <div className="space-y-2">
      {messagesParents.map((m,i)=>(
        <div key={i} className="rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}}>
          <div className="flex justify-between text-[13px]"><span className="font-medium" style={{color:"#1B2A4A"}}>{m.nomEleve} - {m.classe}</span><span style={{color:"#9A8B67"}}>{m.date}</span></div>
          <p className="mt-1 text-[14px]" style={{color:"#3E3625"}}>{m.texte}</p>
          <div className="mt-1"><span className="text-[11px] px-2 py-0.5 rounded-full" style={{background: m.lu ? "#E4EEE3" : "#FBF0D2"}}>{m.lu ? "Lu" : "Non lu"}</span></div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------
   ESPACE PARENT
------------------------------------------------------------------- */

function EspaceParent({ eleves, setEleves, eleveId, personnel, onQuitter }) {
  const ctx = useEcole() || {};
  const setMessagesParents = ctx.setMessagesParents || (() => {});
  const setMessagesInternes = ctx.setMessagesInternes || (() => {});
  const annonces = ctx.annonces || [];
  const anneesArchivees = ctx.anneesArchivees || [];
  const emploiDuTemps = ctx.emploiDuTemps || {};
  const ecole = ctx.ecole || {};
  const [onglet, setOnglet] = useState("notes");
  const [message, setMessage] = useState("");
  const enfant = (eleves || []).find((e) => e && String(e.id || "").toLowerCase() === String(eleveId || "").toLowerCase()) || null;

  // Hooks AVANT tout return — obligatoire React (sinon page blanche)
  const enseignantClasse = useMemo(
    () => (personnel || []).find((p) => enfant && p.classe === enfant.classe && (p.poste === "Enseignant" || p.poste === "Enseignante")),
    [personnel, enfant]
  );
  const moyenne = useMemo(() => moyenneEleve(enfant), [enfant]);
  const rangClasse = useMemo(() => {
    if (!enfant) return null;
    return rangEleveDansClasse(eleves, enfant);
  }, [enfant, eleves]);
  const effectifClasse = useMemo(() => {
    if (!enfant || !enfant.classe) return 0;
    const c = normaliserClasse(enfant.classe);
    return (eleves || []).filter((e) => e && normaliserClasse(e.classe) === c).length;
  }, [enfant, eleves]);
  const parentMaternelle = estEvaluationNiveaux(enfant && enfant.classe);
  const nav = [
    { id: "notes", label: "Notes", icon: ClipboardList },
    { id: "absences", label: "Absences", icon: CalendarClock },
    { id: "frais", label: "Frais", icon: Wallet },
    { id: "emploi", label: "Emploi du temps", icon: CalendarClock },
    { id: "annonces", label: "Annonces", icon: Megaphone },
    { id: "calendrier", label: "Calendrier", icon: CalendarClock },
    { id: "bulletin", label: "Bulletin PDF", icon: FileText },
    { id: "messages", label: "Message Directeur", icon: MessageSquare },
  ];

  if (enfant && enfant.accesParentBloque) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6" style={{ background: "#FAF6EE" }}>
        <div className="max-w-md rounded-2xl border p-6 text-center" style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
          <p className="text-[17px] font-bold" style={{ color: "#991B1B" }}>Accès suspendu</p>
          <p className="mt-2 text-[15px]" style={{ color: "#5C5240" }}>
            La consultation des informations de cet élève est temporairement bloquée par la direction.
            Contactez l&apos;école.
          </p>
          <button type="button" onClick={onQuitter} className="mt-4 rounded-full px-5 py-2 text-[14px] font-bold text-white" style={{ background: "#1B2A4A" }}>
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  if (!enfant) {
    const chargementPossible = !(eleves && eleves.length);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6" style={{ background: "#FAF6EE" }}>
        <p className="max-w-md text-center text-[16px] font-semibold" style={{ color: "#1B2A4A" }}>
          {chargementPossible
            ? "Chargement des données de l'élève…"
            : (<>Aucun élève trouvé pour le code <span className="font-mono">{eleveId || "—"}</span>.</>)}
        </p>
        <p className="max-w-md text-center text-[14px]" style={{ color: "#5C5240" }}>
          {chargementPossible
            ? "Patientez quelques secondes. Si la page reste vide, revenez à l'accueil."
            : "Vérifiez le code auprès de l'école."}
        </p>
        <button type="button" onClick={onQuitter} className="mt-2 rounded-full px-5 py-2 text-[14px] font-bold text-white" style={{ background: "#1B2A4A" }}>
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

return (
    <Coquille role="parent" roleLabel={`Parent de ${enfant.prenom} ${enfant.nom}`} nav={nav} actif={onglet} setActif={setOnglet}
              onQuitter={onQuitter || (() => {})}>
      <Panel title="Profil de l'élève" icon={UserCircle2}>
        <div className="flex items-center gap-4">
          {(() => {
            const photo = enfant.photoUrl || (lirePhotosEleves()[String(enfant.id)] || null);
            return photo ? (
              <img src={photo} alt="" className="h-20 w-20 rounded-full object-cover shadow-md" style={{ border: "3px solid #0EA5E9" }} />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-serif shadow-md"
                   style={{ background: "linear-gradient(135deg,#0EA5E9,#0284C7)", color: "#FFFFFF" }}>
                {(enfant.prenom || "?")[0]}{(enfant.nom || "?")[0]}
              </div>
            );
          })()}
          <div className="grid flex-1 grid-cols-2 gap-2 text-[15px] sm:grid-cols-4">
            <div><div className="text-[13px]" style={{ color: "#9A8B67" }}>Classe</div><div style={{ color: "#1B2A4A" }} className="font-medium">{enfant.classe}</div>{enfant.decision && <div className="mt-1 text-[12px] font-semibold" style={{ color: "#2F5233" }}>{enfant.decision}</div>}</div>
            <div><div className="text-[13px]" style={{ color: "#9A8B67" }}>Code élève</div><div className="font-mono text-[13px]" style={{ color: "#1B2A4A" }}>{enfant.id}</div></div>
            <div><div className="text-[13px]" style={{ color: "#9A8B67" }}>Naissance</div><div style={{ color: "#1B2A4A" }}>{enfant.naissance}</div></div>
            <div>
              <div className="text-[13px]" style={{ color: "#9A8B67" }}>Enseignant(e)</div>
              <div style={{ color: "#1B2A4A" }}>{enseignantClasse?.nom || enfant.enseignant}</div>
              {enseignantClasse?.telephone && <div className="text-[13px]" style={{ color: "#5C5240" }}>{enseignantClasse.telephone}</div>}
            </div>
          </div>
        </div>
      </Panel>

      {onglet === "notes" && (
        <>
          {(enfant.notes || []).length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-3 rounded-2xl p-5" style={{ background: "#1B2A4A" }}>
              <div>
                <div className="text-[11px] uppercase tracking-wider" style={{ color: "#9FB0CC" }}>
                  {parentMaternelle ? "Appréciations" : "Total des points"}
                </div>
                <div className="font-serif text-xl" style={{ color: "#FAF6EE" }}>
                  {parentMaternelle
                    ? `${(enfant.notes || []).length} domaine${(enfant.notes || []).length > 1 ? "s" : ""}`
                    : `${(enfant.notes || []).reduce((s, n) => s + (Number(n.note20) || 0), 0)} / ${((enfant.notes || []).length) * (noteSurMax(enfant.classe) || 20)}`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[11px] uppercase tracking-wider" style={{ color: "#9FB0CC" }}>
                  {parentMaternelle ? "Bilan global" : "Moyenne"}
                </div>
                <div className="font-serif text-xl" style={{ color: "#C9A227" }}>
                  {parentMaternelle ? libelleNiveau(moyenne) : `${moyenne}/${noteSurMax(enfant.classe) || 20}`}
                </div>
                <div className="text-[12px]" style={{ color: "#C9A227" }}>
                  {parentMaternelle ? "TS / S / PS" : mentionPour(moyenne)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider" style={{ color: "#9FB0CC" }}>Rang dans la classe</div>
                <div className="font-serif text-xl" style={{ color: "#FAF6EE" }}>
                  {rangClasse != null ? ordinalRang(rangClasse) : "—"}
                </div>
                <div className="text-[12px]" style={{ color: "#9FB0CC" }}>
                  {effectifClasse > 0 ? `sur ${effectifClasse} élève${effectifClasse > 1 ? "s" : ""}` : ""}
                </div>
              </div>
            </div>
          )}
          <Panel title={parentMaternelle ? "Évaluation maternelle (TS / S / PS)" : "Historique des notes"} icon={ClipboardList}>
            <p className="mb-3 text-[13px] font-semibold" style={{ color: "#5C5240" }}>
              {parentMaternelle
                ? "☺ TS = Travail satisfaisant · 😐 S = Satisfaisant · D PS = Peu satisfaisant — par rapport à l'enfant lui-même."
                : "Cliquez sur chaque évaluation pour ouvrir ou fermer les notes."}
            </p>
            <div className="space-y-2">
              {(enfant.notes || []).length === 0 && <p className="text-[15px] font-semibold" style={{ color: "#9A8B67" }}>Aucune note enregistrée pour l&apos;instant. Dès que l&apos;enseignant saisit une note, elle apparaît ici.</p>}
              {grouperNotesParEvaluation(enfant.notes).map((grp) => (
                <details key={grp.evaluation} className="rounded-xl border" style={{ borderColor: "#E7DEC8" }}>
                  <summary className="cursor-pointer px-4 py-3 font-bold text-[16px]" style={{ color: "#1B2A4A", background: "#F8F4EA" }}>
                    {grp.evaluation}
                    <span className="ml-2 text-[13px] font-semibold" style={{ color: "#9A8B67" }}>
                      {grp.mois.join(" · ")} · {grp.liste.length} matière{grp.liste.length > 1 ? "s" : ""}
                      {grp.moy != null ? (parentMaternelle ? ` · bilan ${libelleNiveau(grp.moy)}` : ` · moyenne ${grp.moy}/${noteSurMax(enfant.classe) || 20}`) : ""}
                    </span>
                  </summary>
                  <div className="space-y-2 border-t px-3 py-3" style={{ borderColor: "#E7DEC8" }}>
                    {grp.liste.map((n, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: "#E7DEC8" }}>
                        <div>
                          <div className="font-bold text-[16px]" style={{ color: "#1B2A4A" }}>{n.matiere}</div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <Badge tone="vert">{n.mois}</Badge>
                          </div>
                          <div className="mt-1.5 text-[13px]" style={{ color: "#5C5240" }}>
                            {parentMaternelle ? libelleNiveau(n.niveau || n.note20) : mentionPour(n.note20)}
                          </div>
                          {n.dateSaisie && <div className="mt-0.5 text-[12px]" style={{ color: "#9A8B67" }}>Saisi le {n.dateSaisie}</div>}
                        </div>
                        <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-full font-serif text-base"
                             style={{ background: "#F6D24A", color: "#5C4A00" }}>
                          {parentMaternelle ? libelleNiveau(n.niveau || n.note20) : `${n.note20}/${noteSurMax(enfant.classe) || 20}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </Panel>
        </>
      )}

      {onglet === "absences" && (
        <Panel title="Absences et retards" icon={CalendarClock}>
          <div className="space-y-2">
            {filtrerAbsencesEleve(enfant.id, enfant.absences || []).length === 0 && <p className="text-[15px] font-semibold" style={{ color: "#9A8B67" }}>Aucune absence ni retard enregistré.</p>}
            {filtrerAbsencesEleve(enfant.id, enfant.absences || []).map((a, i) => (
              <div key={i} className="rounded-lg border px-4 py-2.5 text-[15px]" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex items-center justify-between">
                  <Badge tone={a.type === "Sans motif" ? "or" : "vert"}>{a.type}</Badge>
                  <span className="text-[13px]" style={{ color: "#9A8B67" }}>{a.date}</span>
                </div>
                <p className="mt-1" style={{ color: "#5C5240" }}>{a.motif}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "frais" && (
        <Panel title="Situation financière" icon={Wallet}
               actions={
                 <Btn variant="gold" small onClick={() => {
                   const frais = enfant.frais || [];
                   const lignes = frais.map((f) => ({
                     libelle: f.libelle,
                     ancien: 0,
                     mouvement: Number(f.paye) || 0,
                     nouveau: Number(f.paye) || 0,
                     reste: Math.max(0, (Number(f.du) || 0) - (Number(f.paye) || 0)),
                   }));
                   const total = lignes.reduce((s, l) => s + l.nouveau, 0);
                   genererRecuPaiement({
                     ecole: ecole || {},
                     eleve: enfant,
                     lignes,
                     mode: "Situation globale",
                     modeSaisie: "ajouter",
                     totalMouvement: total,
                   });
                 }}>Télécharger reçu</Btn>
               }>
          <div className="space-y-2">
            {(enfant.frais || []).map((f, i) => (
              <div key={i} className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "#DCD7C8", background: "#FFFFFFCC" }}>
                <div className="mb-3 flex items-center justify-between gap-3"><span className="font-serif text-xl font-bold" style={{ color: "#1B2A4A" }}>{f.libelle}</span><span className="rounded-full px-3 py-1 text-[15px] font-bold" style={{ background: f.paye >= f.du ? "#E4EEE3" : "#F3E0D9", color: f.paye >= f.du ? "#2F5233" : "#A84B3A" }}>Reste {(Math.max(0, f.du - f.paye)).toLocaleString("fr-FR")} FCFA</span></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl px-4 py-4" style={{ background: "#F3DED6", color: "#A84B3A" }}><div className="text-[16px] font-bold uppercase">DÛ</div><div className="mt-1 font-serif text-2xl font-bold">{Number(f.du).toLocaleString("fr-FR")} FCFA</div></div>
                  <div className="rounded-2xl px-4 py-4" style={{ background: "#DDEDE3", color: "#173526" }}><div className="text-[16px] font-bold uppercase">PAYÉ</div><div className="mt-1 font-serif text-2xl font-bold">{Number(f.paye).toLocaleString("fr-FR")} FCFA</div></div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "emploi" && (
        <Panel title="Emploi du temps de la classe" icon={CalendarClock}>
          {(() => {
            const emploiClasse = (emploiDuTemps && emploiDuTemps[enfant.classe]) || [];
            if(emploiClasse.length===0) return <p className="text-[15px]" style={{color:"#9A8B67"}}>Aucun emploi du temps publié pour {enfant.classe} pour le moment.</p>;
            const jours = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
            return (
              <div className="space-y-3">
                {jours.map(j=>{
                  const coursJour = emploiClasse.filter(e=>e.jour===j);
                  if(coursJour.length===0) return null;
                  return (
                    <div key={j} className="rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}}>
                      <div className="font-medium text-[14px] mb-1" style={{color:"#1B2A4A"}}>{j}</div>
                      <div className="space-y-1">
                        {coursJour.map((c,i)=><div key={i} className="flex justify-between text-[13px]"><span>{c.creneau} - {c.matiere}</span><span style={{color:"#5C5240"}}>{c.enseignant}</span></div>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Panel>
      )}

      {onglet === "bulletin" && (
        <Panel title="Bulletin scolaire PDF" icon={FileText}>
          <div className="rounded-lg p-4" style={{background:"#F1ECDD"}}>
            <p className="text-[15px]" style={{color:"#3E3625"}}>Bulletin de <b>{enfant.prenom} {enfant.nom}</b> - Classe {enfant.classe}</p>
            <p className="text-[13px] mt-1" style={{color:"#5C5240"}}>Moyenne: {moyenne || 0}/{noteSurMax(enfant.classe) || 20} - {moyenne ? mentionPourNote(moyenne, enfant.classe) : ""} - {(enfant.notes || []).length} notes - {(enfant.absences || []).length} absences</p>
            {bulletinEstValide(enfant.id) ? (
              <div className="mt-3">
                <p className="mb-2 text-[13px] font-semibold" style={{ color: "#14532D" }}>Bulletin validé par la direction — téléchargement autorisé.</p>
                <button onClick={() => genererBulletinPDF(enfant, ecole, moyenne)} className="flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold" style={{background:"#1B2A4A", color:"#FAF6EE"}}>
                  <FileText size={16}/> Télécharger bulletin PDF
                </button>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border px-3 py-2" style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
                <p className="text-[14px] font-semibold" style={{ color: "#92400E" }}>En attente de validation</p>
                <p className="text-[13px]" style={{ color: "#5C5240" }}>
                  La direction n&apos;a pas encore validé ce bulletin. Les notes restent visibles dans l&apos;onglet Notes ; le PDF sera disponible après validation.
                </p>
              </div>
            )}
          </div>
        </Panel>
      )}

      {onglet === "calendrier" && (
        <Panel title="Calendrier scolaire" icon={CalendarClock}>
          <p className="mb-3 text-[13px]" style={{ color: "#5C5240" }}>Examens, vacances et événements de l&apos;école.</p>
          <div className="space-y-2">
            {lireCalendrierScolaire()
              .filter((ev) => !ev.classe || ev.classe === "toutes" || ev.classe === enfant.classe)
              .sort((a, b) => String(a.dateDebut || "").localeCompare(String(b.dateDebut || "")))
              .map((ev) => (
                <div key={ev.id} className="rounded-lg border px-3 py-2" style={{ borderColor: "#E7DEC8", background: "#FAF6EE" }}>
                  <p className="font-semibold" style={{ color: "#1B2A4A" }}>{ev.titre}</p>
                  <p className="text-[12px]" style={{ color: "#5C5240" }}>
                    {ev.dateDebut}{ev.dateFin ? " → " + ev.dateFin : ""} · {ev.type}
                  </p>
                </div>
              ))}
            {lireCalendrierScolaire().filter((ev) => !ev.classe || ev.classe === "toutes" || ev.classe === enfant.classe).length === 0 && (
              <p className="text-[13px]" style={{ color: "#9A8B67" }}>Aucun événement pour le moment.</p>
            )}
          </div>
        </Panel>
      )}

      {onglet === "effectifs" && (
        <Panel title="Effectifs — Garçons et filles" icon={Users}>
          <p className="mb-3 text-[14px]" style={{ color: "#5C5240" }}>
            Nombre et listes par sexe pour tout l&apos;établissement. Boutons Copier et Imprimer sur chaque liste.
          </p>
          {!(eleves && eleves.length) ? (
            <p className="rounded-xl border px-4 py-6 text-center text-[15px]" style={{ borderColor: "#E7DEC8", color: "#9A8B67" }}>
              Aucun élève chargé pour le moment. Actualisez la page ou vérifiez la connexion à la base.
            </p>
          ) : (
            <PanneauEffectifsSexe eleves={eleves || []} ecole={ecole || {}} setEleves={setEleves} demandes={demandes || []} />
          )}
        </Panel>
      )}

      {onglet === "annonces" && (
        <Panel title="Annonces publiques de l’école" icon={Megaphone}>
          <div className="mb-4 rounded-xl border p-3" style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}>
            <p className="mb-2 text-[14px] font-bold" style={{ color: "#14532D" }}>Cahier de textes — {enfant.classe}</p>
            {lireDevoirs().filter((d) => d.classe === enfant.classe).length === 0 ? (
              <p className="text-[13px]" style={{ color: "#5C5240" }}>Aucun devoir publié pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {lireDevoirs().filter((d) => d.classe === enfant.classe).slice(0, 15).map((d) => (
                  <div key={d.id} className="rounded-lg bg-white px-3 py-2 text-[13px]" style={{ border: "1px solid #E7DEC8" }}>
                    <b>{d.titre}</b>
                    <span className="ml-2" style={{ color: "#9A8B67" }}>pour le {d.pourLe || "—"}</span>
                    {d.detail ? <p className="mt-1" style={{ color: "#5C5240" }}>{d.detail}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
          {(!(annonces && annonces.length)) && <p className="text-[15px] font-semibold" style={{ color: "#9A8B67" }}>Aucune annonce publiée pour le moment.</p>}
          <div className="space-y-2">{(annonces || []).map((a, i) => <div key={i} className="rounded-xl border px-4 py-3" style={{ borderColor: "#E7DEC8" }}><div className="font-bold text-[17px]" style={{ color: "#1B2A4A" }}>{a.titre}</div><p className="mt-1 text-[15px] font-semibold" style={{ color: "#3E3625" }}>{a.texte}</p><div className="mt-1 text-[13px] font-medium" style={{ color: "#9A8B67" }}>{a.date}</div></div>)}</div>
        </Panel>
      )}

      {(onglet === "messages" || onglet === "messageInterne") && (
        <Panel title="Messages avec l'administration" icon={MessageSquare}>
          <div className="mb-3 space-y-2">
            {Array.from(new Map((enfant.messages || []).map((m) => [`${m.auteur}||${m.texte}||${m.date}`, m])).values()).map((m, i) => {
              const auteur = String(m.auteur || "").toLowerCase();
              const estParent = auteur.includes("parent") || auteur.includes("parrain") || auteur.includes("tuteur")
                || auteur === "vous" || auteur.includes("famille");
              // Parent / parrain = vert clair ; administration = beige actuel
              const bg = estParent ? "#DCFCE7" : "#F1ECDD";
              const border = estParent ? "#86EFAC" : "#E7DEC8";
              const titreColor = estParent ? "#14532D" : "#1B2A4A";
              return (
              <div key={i} className="rounded-lg border px-3 py-2 text-[15px]" style={{ background: bg, borderColor: border }}>
                <div className="flex items-center justify-between text-[13px]" style={{ color: "#9A8B67" }}>
                  <span className="font-medium" style={{ color: titreColor }}>{m.auteur || (estParent ? "Parent" : "Administration")}</span>
                  <span>{m.date}</span>
                </div>
                <p style={{ color: "#3E3625" }}>{m.texte}</p>
              </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrire un message à l'administration..."
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <Btn variant="primary" icon={Send} onClick={() => {
              if (!message.trim()) return;
              const dateMsg = horodatageMsg();
              setEleves((prev) => prev.map((e) => e.id === enfant.id
                ? { ...e, messages: [...(e.messages || []), { auteur: "Vous", texte: message, date: dateMsg }] }
                : e));
              setMessagesParents((prev) => [
                { eleveId: enfant.id, nomEleve: `${enfant.prenom} ${enfant.nom}`, classe: enfant.classe, texte: message, date: dateMsg, lu: false },
                ...prev,
              ]);
              setMessage("");
            }}>Envoyer</Btn>
          </div>
        </Panel>
      )}
    </Coquille>
  );
}

/* ------------------------------------------------------------------
   APPLICATION
------------------------------------------------------------------- */

/* ------------------------------------------------------------------
   SYNCHRONISATION SUPABASE
   Au chargement : on lit toutes les tables et on reconstruit les
   formes utilisées par l'application. Ensuite, à chaque changement
   d'un état (eleves, classes, personnel...), on répercute automat-
   iquement la modification vers Supabase — aucun autre composant
   n'a besoin d'être modifié pour ça.
------------------------------------------------------------------- */

const ID_MIN_UUID = "00000000-0000-0000-0000-000000000000";

async function chargerToutesLesDonnees() {
  const [
    ecoleRows, codesRows, classesRows, matieresRows, personnelRows, elevesRows,
    notesRows, absencesRows, fraisTypesRows, fraisEleveRows, annoncesRows,
    messagesEleveRows, messagesParentsRows, messagesInternesRows, demandesRows, anneesRows, emploiRows,
  ] = await Promise.all([
    pgSelect("ecole", "&id=eq.1"),
    pgSelect("codes_acces"), // public avant login : codes dispo dès l'accueil
    pgSelect("classes", "&order=ordre"),
    pgProtege("matieres"),
    pgProtege("personnel"),
    pgProtege("eleves"),
    pgProtege("notes"),
    pgProtege("absences"),
    pgSelect("frais_types"),
    pgProtege("frais_eleve"),
    pgSelect("annonces", "&order=cree_le.desc"),
    pgProtege("messages_eleve"),
    pgProtege("messages_parents", "&order=cree_le.desc"),
    pgProtege("messages_internes", "&order=cree_le.desc"),
    pgProtege("demandes_inscription"),
    pgProtege("annees_archivees"),
    pgProtege("emploi_du_temps", "&order=classe,jour,creneau"),
  ]);

  const ecoleRow = (ecoleRows || [])[0];
  const ecole = fusionnerEcole(ecoleRow);
  const anneeScolaire = ecoleRow?.annee_scolaire || ANNEE_INIT;

  const classesInitialesCodes = ["6ème A","6ème B","5ème A","5ème B","4ème A","4ème B","3ème A","3ème B","Seconde A","Première A","Terminale A"];
  const codesEnseignantsInitiauxLoad = {};
  classesInitialesCodes.forEach((c,i)=>{ codesEnseignantsInitiauxLoad[c] = `ENS-${c.replace(/[^A-Z0-9]/gi,"").toUpperCase()}-${1000+i*111}`; });
  const codes = { directeur: "", enseignant: "", secretaire: "", fondateur: "", enseignants: {} };
  (codesRows || []).forEach((c) => {
    if (c.role === "enseignants") {
      try {
        const parsed = typeof c.code === "string" ? JSON.parse(c.code) : c.code;
        if (parsed && typeof parsed === "object") codes.enseignants = { ...codes.enseignants, ...parsed };
      } catch (e) {
        console.warn("Codes enseignants illisibles:", e);
      }
    } else if (c.role === "_roles_bloques") {
      try {
        const o = typeof c.code === "string" ? JSON.parse(c.code) : c.code;
        if (o && typeof o === "object") {
          try { localStorage.setItem(CLE_ROLES_BLOQUES, JSON.stringify(o)); } catch (e2) {}
        }
      } catch (e) {
        console.warn("roles_bloques illisibles:", e);
      }
    } else if (c.role === "_baremes") {
      try {
        const o = typeof c.code === "string" ? JSON.parse(c.code) : c.code;
        if (o && typeof o === "object") {
          try { localStorage.setItem(CLE_BAREMES, JSON.stringify(o)); } catch (e2) {}
          try { if (typeof window !== "undefined") window.__cspBaremes = o; } catch (e3) {}
        }
      } catch (e) {
        console.warn("baremes illisibles:", e);
      }
    } else if (c.role === "_calendrier") {
      try {
        const a = typeof c.code === "string" ? JSON.parse(c.code) : c.code;
        if (Array.isArray(a)) {
          try { localStorage.setItem("csp_sagesse_divine_calendrier", JSON.stringify(a)); } catch (e2) {}
        }
      } catch (e) {}
    } else if (c.role === "_bulletins_valides") {
      try {
        const o = typeof c.code === "string" ? JSON.parse(c.code) : c.code;
        if (o && typeof o === "object") {
          try { localStorage.setItem("csp_sagesse_divine_bulletins_valides", JSON.stringify(o)); } catch (e2) {}
        }
      } catch (e) {}
    } else if (c.role === "_passages") {
      try {
        const a = typeof c.code === "string" ? JSON.parse(c.code) : c.code;
        if (Array.isArray(a)) {
          try { localStorage.setItem("csp_sagesse_divine_passages", JSON.stringify(a)); } catch (e2) {}
        }
      } catch (e) {}
    } else if (c.role === "_plateforme") {
      try {
        const active = String(c.code || "1") === "1" || String(c.code || "") === "true";
        try { if (typeof window !== "undefined") window.__cspPlateformeActive = active; } catch (e3) {}
        try { localStorage.setItem(CLE_PLATEFORME, active ? "1" : "0"); } catch (e2) {}
      } catch (e) {}
    } else if (c.role === "_journal") {
      try {
        const a = typeof c.code === "string" ? JSON.parse(c.code) : c.code;
        if (Array.isArray(a) && a.length) {
          const local = lireJournal();
          const map = new Map();
          [...a, ...local].forEach((e) => { if (e && e.id) map.set(String(e.id), e); });
          const fusion = Array.from(map.values()).sort((x, y) => String(y.date || "").localeCompare(String(x.date || "")));
          ecrireJournalLocal(fusion.slice(0, 300));
        }
      } catch (e) {
        console.warn("journal illisible:", e);
      }
    } else if (c.role && typeof c.code === "string" && !String(c.role).startsWith("_")) {
      codes[c.role] = c.code;
    }
  });

  const classes = (classesRows || []).map((c) => c.nom);
  if (classes.length === 0) classes.push(...CLASSES_INIT);
  Object.assign(codes, completerCodesEnseignants(codes, classes));

  const matieresParClasseBrut = {};
  (matieresRows || []).forEach((m) => {
    if (!matieresParClasseBrut[m.classe]) matieresParClasseBrut[m.classe] = [];
    matieresParClasseBrut[m.classe].push({ nom: m.nom, coef: m.coefficient });
  });
  const matieresParClasse = dedupeMatieresParClasse(matieresParClasseBrut);

  const personnel = dedupePersonnel((personnelRows || []).map((p) => ({
    nom: p.nom, poste: p.poste, classe: p.classe, telephone: p.telephone,
  })));

  const fraisTypes = dedupeFraisTypes((fraisTypesRows || []).map((f) => ({
    libelle: f.libelle, montant: Number(f.montant), classe: f.classe || null,
  })));

  const eleves = (elevesRows || []).map((e) => ({
    id: e.id, prenom: e.prenom, nom: e.nom, sexe: e.sexe, naissance: e.naissance,
    photoUrl: e.photo_url || e.photoUrl || null,
    classe: e.classe, enseignant: e.enseignant,
    accesParentBloque: !!(e.acces_parent_bloque || e.accesParentBloque),
    parent: { nom: e.parrain_nom, telephone: e.parrain_telephone },
    notes: filtrerNotesEleve(e.id, (notesRows || []).filter((n) => n.eleve_id === e.id).map((n) => ({
      matiere: n.matiere, evaluation: n.evaluation, mois: n.mois, note20: Number(n.note20), niveau: n.niveau || null, dateSaisie: n.date_saisie,
    }))),
    absences: filtrerAbsencesEleve(e.id, (absencesRows || []).filter((a) => a.eleve_id === e.id).map((a) => ({
      date: normaliserDateAbs(a.date) || a.date, type: a.type, motif: a.motif || "",
    }))),
    frais: (() => {
      const depuisBaseBrut = (fraisEleveRows || []).filter((f) => f.eleve_id === e.id).map((f) => ({
        libelle: f.libelle, du: Number(f.du), paye: Number(f.paye), mode: f.mode, datePaiement: f.date_paiement, payeLe: f.date_paiement || null,
      }));
      const depuisBaseMap = new Map();
      const tsLoad = (f) => {
        if (f.payeLe) { const t = Date.parse(f.payeLe); if (!isNaN(t)) return t; }
        if (f.datePaiement) { const t = Date.parse(f.datePaiement); if (!isNaN(t)) return t; }
        return 0;
      };
      depuisBaseBrut.forEach((f) => {
        const k = String(f.libelle || "").trim().toLowerCase();
        const prev = depuisBaseMap.get(k);
        if (!prev) { depuisBaseMap.set(k, f); return; }
        const tP = tsLoad(prev), tF = tsLoad(f);
        // Plus récent gagne ; si égalité, garder les deux champs du plus bas paye seulement si on corrige...
        // À égalité sans date: garder le dernier lu (souvent le PATCH le plus récent en base)
        if (tF >= tP) depuisBaseMap.set(k, f);
      });
      const depuisBase = Array.from(depuisBaseMap.values());
      const depuisCatalogue = fraisTypes
        .filter((type) => (!type.classe || type.classe === e.classe)
          && !depuisBase.some((f) => String(f.libelle || "").trim().toLowerCase() === String(type.libelle || "").trim().toLowerCase()))
        .map((type) => ({ libelle: type.libelle, du: type.montant, paye: 0, mode: null, datePaiement: null }));
      return [...depuisBase, ...depuisCatalogue];
    })(),
    messages: filtrerMessagesEleve(e.id, (messagesEleveRows || []).filter((m) => m.eleve_id === e.id).map((m) => ({
      auteur: m.auteur, texte: m.texte, date: m.date,
    }))),
    decision: (() => {
      if (e.decision) return e.decision;
      const msgs = (messagesEleveRows || []).filter((m) => m.eleve_id === e.id && m.auteur === "Administration");
      const d = msgs.find((m) => /passé en classe|double la classe|Passé en|Double /i.test(m.texte || ""));
      return d ? d.texte : null;
    })(),
  }));

  const annonces = (annoncesRows || []).map((a) => ({ titre: a.titre, texte: a.texte, date: a.date }));

  const messagesInternes = (messagesInternesRows || []).map((m) => ({
    destinataire: m.destinataire, texte: m.texte, date: m.date,
  }));

  const messagesParents = (messagesParentsRows || []).map((m) => ({
    id: m.id, eleveId: m.eleve_id, nomEleve: m.nom_eleve, classe: m.classe, texte: m.texte, date: m.date, lu: m.lu === true,
  }));

  const demandes = (demandesRows || []).map((d) => ({
    id: d.id, prenom: d.prenom, nom: d.nom, sexe: d.sexe, naissance: d.naissance, age: d.age,
    classeSouhaitee: d.classe_souhaitee, parrainNom: d.parrain_nom, parrainTelephone: d.parrain_telephone,
    message: d.message, origine: d.origine, date: d.date, statut: d.statut,
    codeEleve: d.code_eleve || d.codeEleve || null,
  }));

  const anneesArchivees = (anneesRows || []).map((a) => ({
    annee: a.annee, dateArchivage: a.date_archivage, eleves: a.donnees,
  }));

  const emploiDuTemps = {};
  (emploiRows || []).forEach((e)=>{
    if(!emploiDuTemps[e.classe]) emploiDuTemps[e.classe]=[];
    emploiDuTemps[e.classe].push({ jour:e.jour, creneau:e.creneau, matiere:e.matiere, enseignant:e.enseignant });
  });

  return {
    ecole, anneeScolaire, codes, classes, matieresParClasse, emploiDuTemps, personnel, fraisTypes,
    eleves, annonces, messagesInternes, messagesParents, demandes, anneesArchivees,
  };
}

async function syncEcole(ecole, anneeScolaire) {
  if (!ecole) return;
  await pgUpsert("ecole", [{
    id: 1, nom: ecole.nom, sigle: ecole.sigle, quartier: ecole.quartier, commune: ecole.commune,
    departement: ecole.departement, directeur: ecole.directeur, telephone: ecole.telephone,
    telephone_directeur: ecole.telephoneDirecteur, email: ecole.email, devise: ecole.devise,
    logo_url: ecole.logoUrl, lien_reunion: ecole.lienReunion || null, whatsapp_ecole: ecole.whatsappEcole || null, annee_scolaire: anneeScolaire,
  }], "id");
}

async function syncCodes(codes) {
  const c = codes || {};
  const lignes = [];
  // Rôles simples (chaînes) + codes enseignants par classe (sérialisés en JSON)
  Object.entries(c).forEach(([role, code]) => {
    if (role === "enseignants") {
      lignes.push({ role: "enseignants", code: typeof code === "object" ? JSON.stringify(code || {}) : String(code || "{}") });
    } else if (typeof code === "string" || typeof code === "number") {
      lignes.push({ role, code: String(code) });
    }
  });
  await pgUpsert("codes_acces", lignes, "role");
}

async function syncClasses(classes) {
  const noms = classes || [];
  await pgUpsert("classes", noms.map((nom, i) => ({ nom, ordre: i })), "nom");
  const existantes = (await pgSelect("classes")) || [];
  const aSupprimer = existantes.map((r) => r.nom).filter((n) => !noms.includes(n));
  await pgDeleteIn("classes", "nom", aSupprimer);
}

async function syncMatieresParClasse(matieresParClasse) {
  const propres = dedupeMatieresParClasse(matieresParClasse);
  const lignes = Object.entries(propres || {}).flatMap(([classe, liste]) =>
    (liste || []).map((m) => ({
      classe: String(m.classe || classe || "").trim(),
      nom: String(m.nom || "").trim(),
      coefficient: Number(m.coef) || 1,
    })).filter((x) => x.classe && x.nom)
  );
  // Ne jamais vider toute la table si la liste locale est vide (évite disparition après synchro)
  if (!lignes.length) return;
  let existantes = [];
  try { existantes = (await pgSelect("matieres")) || []; } catch (e) { existantes = []; }
  const cle = (r) => (String(r.classe || "").trim().toLowerCase() + "||" + String(r.nom || "").trim().toLowerCase());
  const voulu = new Set(lignes.map(cle));
  // Insérer d'abord les nouvelles (pas de trou si l'insert échoue après un delete global)
  const existCle = new Set((existantes || []).map(cle));
  const aAjouter = lignes.filter((l) => !existCle.has(cle(l)));
  if (aAjouter.length) await pgInsert("matieres", aAjouter);
  // Mettre à jour les coefficients : supprimer + réinsérer les lignes déjà présentes avec coef différent
  const coefMap = Object.fromEntries(lignes.map((l) => [cle(l), l.coefficient]));
  const aRafraichir = (existantes || []).filter((r) => {
    const k = cle(r);
    return voulu.has(k) && Number(r.coefficient) !== Number(coefMap[k]);
  });
  if (aRafraichir.length) {
    const ids = aRafraichir.map((r) => r.id).filter(Boolean);
    if (ids.length) await pgDeleteIn("matieres", "id", ids);
    await pgInsert("matieres", aRafraichir.map((r) => ({
      classe: r.classe,
      nom: r.nom,
      coefficient: coefMap[cle(r)] || 1,
    })));
  }
  // Supprimer seulement ce qui n'est plus dans la liste locale
  const aSupprimer = (existantes || []).filter((r) => !voulu.has(cle(r))).map((r) => r.id).filter(Boolean);
  if (aSupprimer.length) await pgDeleteIn("matieres", "id", aSupprimer);
}

function dedupePersonnel(liste) {
  return Array.from(new Map((liste || []).map((p) => {
    const cle = `${String(p.nom || "").trim().toLowerCase()}|${String(p.poste || "").trim().toLowerCase()}|${String(p.classe || "").trim().toLowerCase()}`;
    return [cle, { nom: p.nom ?? null, poste: p.poste ?? null, classe: p.classe ?? null, telephone: p.telephone ?? null }];
  })).values());
}

function dedupeFraisTypes(liste) {
  return Array.from(new Map((liste || []).map((f) => {
    const cle = `${String(f.libelle || "").trim().toLowerCase()}::${f.classe || "toutes"}`;
    return [cle, { libelle: f.libelle, montant: Number(f.montant) || 0, classe: f.classe || null }];
  })).values());
}

/** Une seule entrée par (classe + nom de matière), sans doublons. */
function dedupeMatieresParClasse(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([classe, liste]) => {
    const map = new Map();
    (liste || []).forEach((m) => {
      if (!m) return;
      const nom = String(m.nom || "").trim();
      if (!nom) return;
      const cle = nom.toLowerCase();
      const coef = Number(m.coef != null ? m.coef : m.coefficient) || 1;
      // garder le dernier coef saisi
      map.set(cle, { nom, coef });
    });
    out[classe] = Array.from(map.values());
  });
  return out;
}

async function syncPersonnel(personnel) {
  const uniques = dedupePersonnel(personnel);
  if (!(uniques || []).length) return; // ne pas vider la base par erreur
  await pgDeleteToutes("personnel", "id");
  await pgInsert("personnel", uniques);
}

async function syncFraisTypes(fraisTypes) {
  const uniques = dedupeFraisTypes(fraisTypes);
  if (!(uniques || []).length) return; // ne pas vider la base par erreur
  await pgDeleteToutes("frais_types", "id");
  await pgInsert("frais_types", uniques.map((f) => ({ libelle: f.libelle ?? null, montant: f.montant ?? 0, classe: f.classe ?? null })));
}

function empreinteAnnonce(a) {
  return `${a.titre || ""}||${a.texte || ""}||${a.date || ""}`;
}

/** Fusion sans tout effacer : on ajoute le nouveau, on ne supprime que si la liste locale est volontairement plus courte et non vide. */
async function syncAnnonces(annonces) {
  const locales = annonces || [];
  const remote = (await pgSelect("annonces", "&order=cree_le.desc")) || [];
  const cle = empreinteAnnonce;
  const setLocal = new Set(locales.map(cle));
  const setRemote = new Set(remote.map(cle));
  const aInserer = locales.filter((a) => !setRemote.has(cle(a)));
  if (aInserer.length) {
    await pgInsert("annonces", aInserer.map((a) => ({
      titre: a.titre ?? null, texte: a.texte ?? null, date: a.date ?? null,
    })));
  }
  const idsASupprimer = remote.filter((r) => !setLocal.has(cle(r))).map((r) => r.id).filter(Boolean);
  if (idsASupprimer.length) {
    await pgDeleteIn("annonces", "id", idsASupprimer);
  }
}

async function syncMessagesInternes(messagesInternes) {
  const locales = messagesInternes || [];
  const remote = (await pgSelect("messages_internes")) || [];
  const cle = (m) => `${m.destinataire || ""}||${m.texte || ""}||${m.date || ""}`;
  const setLocal = new Set(locales.map(cle));
  const setRemote = new Set(remote.map(cle));
  const aInserer = locales.filter((m) => !setRemote.has(cle(m)));
  if (aInserer.length) {
    await pgInsert("messages_internes", aInserer.map((m) => ({
      destinataire: m.destinataire ?? null, texte: m.texte ?? null, date: m.date ?? null,
    })));
  }
  const idsASupprimer = remote.filter((r) => !setLocal.has(cle(r))).map((r) => r.id).filter(Boolean);
  if (idsASupprimer.length) {
    await pgDeleteIn("messages_internes", "id", idsASupprimer);
  }
}

async function syncMessagesParents(messagesParents) {
  const locales = messagesParents || [];
  const remote = (await pgSelect("messages_parents")) || [];
  const cle = (m) => `${m.eleve_id || m.eleveId || ""}||${m.texte || ""}||${m.date || ""}`;
  const setLocal = new Set(locales.map(cle));
  const setRemote = new Set(remote.map(cle));
  // Nouveaux messages
  const aInserer = locales.filter((m) => !setRemote.has(cle(m)));
  if (aInserer.length) {
    await pgInsert("messages_parents", aInserer.map((m) => ({
      eleve_id: m.eleveId ?? null, nom_eleve: m.nomEleve ?? null, classe: m.classe ?? null,
      texte: m.texte ?? null, date: m.date ?? null, lu: m.lu === true,
    })));
  }
  // Mettre à jour le statut lu en base
  for (const m of locales) {
    const r = remote.find((x) => cle(x) === cle(m));
    if (r && r.id != null && Boolean(r.lu) !== Boolean(m.lu)) {
      try {
        await pgFetch(`/messages_parents?id=eq.${r.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ lu: m.lu === true }),
        });
      } catch (e) {
        console.warn("Maj lu message parent", e);
      }
    }
  }
  // Suppressions
  const idsASupprimer = remote.filter((r) => !setLocal.has(cle(r))).map((r) => r.id).filter(Boolean);
  if (idsASupprimer.length) {
    await pgDeleteIn("messages_parents", "id", idsASupprimer);
  }
}

async function syncDemandes(demandes) {
  const lignes = (demandes || []).map((d) => ({
    id: d.id, prenom: d.prenom, nom: d.nom, sexe: d.sexe ?? null, naissance: d.naissance ?? null,
    age: d.age ?? null, classe_souhaitee: d.classeSouhaitee ?? null, parrain_nom: d.parrainNom ?? null,
    parrain_telephone: d.parrainTelephone ?? null,
    message: d.message ?? null, origine: d.origine ?? null,
    date: d.date ?? null, statut: d.statut ?? null,
    code_eleve: d.codeEleve ?? null,
  }));
  await pgUpsert("demandes_inscription", lignes, "id");
  const existantes = (await pgSelect("demandes_inscription")) || [];
  const idsActuels = (demandes || []).map((d) => d.id);
  const aSupprimer = existantes.map((r) => r.id).filter((id) => !idsActuels.includes(id));
  await pgDeleteIn("demandes_inscription", "id", aSupprimer);
}

async function syncEmploiDuTemps(emploiDuTemps) {
  await pgDeleteToutes("emploi_du_temps", "id");
  const lignes = Object.entries(emploiDuTemps || {}).flatMap(([classe, liste]) =>
    (liste || []).map(e=>({ classe, jour:e.jour, creneau:e.creneau, matiere:e.matiere, enseignant:e.enseignant }))
  );
  await pgInsert("emploi_du_temps", lignes);
}

async function syncAnneesArchivees(anneesArchivees) {
  await pgDeleteToutes("annees_archivees", "id");
  await pgInsert("annees_archivees", (anneesArchivees || []).map((a) => ({
    annee: a.annee, date_archivage: a.dateArchivage, donnees: a.eleves,
  })));
}


function normaliserDateAbs(d) {
  if (!d) return "";
  const s = String(d).trim();
  const m = s.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  try {
    const t = Date.parse(s);
    if (!isNaN(t)) {
      const x = new Date(t);
      return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
    }
  } catch (e) {}
  return s;
}
function dedupeAbsences(liste) {
  const map = new Map();
  (liste || []).forEach((a) => {
    if (!a) return;
    const norm = {
      date: normaliserDateAbs(a.date) || a.date || "",
      type: String(a.type || "").trim(),
      motif: String(a.motif || "").trim(),
    };
    map.set(cleAbsObj(norm), norm);
  });
  return Array.from(map.values());
}
/** Identité d'une note = matière + évaluation + mois (sans la valeur). */
function cleNoteObj(n) {
  return `${String(n.matiere || "").trim().toLowerCase()}||${String(n.evaluation || "").trim().toLowerCase()}||${String(n.mois || "").trim().toLowerCase()}`;
}
function dedupeNotes(liste) {
  const map = new Map();
  (liste || []).forEach((n) => {
    if (!n) return;
    const k = cleNoteObj(n);
    if (!k || k === "||") return;
    const prev = map.get(k);
    const tNew = Date.parse(n.dateSaisie || n.date_saisie || "") || 0;
    const tPrev = prev ? (Date.parse(prev.dateSaisie || prev.date_saisie || "") || 0) : -1;
    if (!prev || tNew >= tPrev) {
      map.set(k, {
        matiere: String(n.matiere || "").trim(),
        evaluation: String(n.evaluation || "").trim(),
        mois: String(n.mois || "").trim(),
        note20: Number(n.note20),
        niveau: n.niveau || null,
        dateSaisie: n.dateSaisie || n.date_saisie || null,
      });
    }
  });
  return Array.from(map.values());
}

const CLE_NOTES_SUPPRIMEES = "csp_sagesse_divine_notes_supprimees";
function cleNoteGlobale(eleveId, n) {
  return `${String(eleveId)}||${cleNoteObj(n)}`;
}
function lireNotesSupprimees() {
  try {
    const a = JSON.parse(localStorage.getItem(CLE_NOTES_SUPPRIMEES) || "[]");
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function ecrireNotesSupprimees(ids) {
  try { localStorage.setItem(CLE_NOTES_SUPPRIMEES, JSON.stringify([...(new Set(ids || []))].slice(-800))); } catch (e) {}
}
function marquerNoteSupprimee(eleveId, n) {
  const k = cleNoteGlobale(eleveId, n);
  ecrireNotesSupprimees([...lireNotesSupprimees(), k]);
  return k;
}
function estNoteSupprimee(eleveId, n) {
  return lireNotesSupprimees().includes(cleNoteGlobale(eleveId, n));
}
function filtrerNotesEleve(eleveId, liste) {
  return dedupeNotes((liste || []).filter((n) => !estNoteSupprimee(eleveId, n)));
}

function cleAbsObj(a) {
  return `${normaliserDateAbs(a && a.date)}||${String((a && a.type) || "").trim()}||${String((a && a.motif) || "").trim()}`;
}

const CLE_MSG_SUPPRIMEES = "csp_sagesse_divine_msg_supprimees";
function cleMsgGlobale(eleveId, m) {
  return `${String(eleveId)}||${String((m && m.auteur) || "")}||${String((m && m.texte) || "")}||${String((m && m.date) || "")}`;
}
function lireMessagesSupprimes() {
  try {
    const a = JSON.parse(localStorage.getItem(CLE_MSG_SUPPRIMEES) || "[]");
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function ecrireMessagesSupprimes(ids) {
  try { localStorage.setItem(CLE_MSG_SUPPRIMEES, JSON.stringify([...new Set(ids || [])].slice(-800))); } catch (e) {}
}
function marquerMessageSupprime(eleveId, m) {
  const k = cleMsgGlobale(eleveId, m);
  ecrireMessagesSupprimes([...lireMessagesSupprimes(), k]);
  return k;
}
function estMessageSupprime(eleveId, m) {
  return lireMessagesSupprimes().includes(cleMsgGlobale(eleveId, m));
}
function filtrerMessagesEleve(eleveId, liste) {
  return (liste || []).filter((m) => m && !estMessageSupprime(eleveId, m));
}
async function supprimerMessageEnBase(eleveId, m) {
  if (!SUPABASE_CONFIGURE || !eleveId || !m) return;
  try {
    const rows = (await pgSelect("messages_eleve")) || [];
    const ids = rows
      .filter((r) => String(r.eleve_id) === String(eleveId))
      .filter((r) =>
        String(r.auteur || "") === String(m.auteur || "")
        && String(r.texte || "") === String(m.texte || "")
        && String(r.date || "") === String(m.date || "")
      )
      .map((r) => r.id)
      .filter(Boolean);
    if (ids.length) await pgDeleteIn("messages_eleve", "id", ids);
  } catch (e) { console.warn("suppr message base", e); }
}
function cleMsgObj(m) {
  return `${m.auteur || ""}||${m.texte || ""}||${m.date || ""}||${(m.texte || "").length}`;
}
function cleFraisObj(f) {
  return String(f.libelle || "").trim().toLowerCase();
}

const CLE_ABS_SUPPRIMEES = "csp_sagesse_divine_abs_supprimees";

function lireAbsencesSupprimees() {
  try {
    const a = JSON.parse(localStorage.getItem(CLE_ABS_SUPPRIMEES) || "[]");
    return Array.isArray(a) ? a.map(String) : [];
  } catch (e) { return []; }
}
function ecrireAbsencesSupprimees(ids) {
  try {
    localStorage.setItem(CLE_ABS_SUPPRIMEES, JSON.stringify([...new Set((ids || []).map(String))].slice(0, 500)));
  } catch (e) {}
}
/** Clé globale élève + date + type + motif */
function cleAbsGlobale(eleveId, a) {
  return `${String(eleveId)}||${cleAbsObj(a || {})}`;
}
function marquerAbsenceSupprimee(eleveId, a) {
  const k = cleAbsGlobale(eleveId, a);
  ecrireAbsencesSupprimees([...lireAbsencesSupprimees(), k]);
  return k;
}
function estAbsenceSupprimee(eleveId, a) {
  return lireAbsencesSupprimees().includes(cleAbsGlobale(eleveId, a));
}
function filtrerAbsencesEleve(eleveId, liste) {
  return dedupeAbsences(liste || []).filter((a) => !estAbsenceSupprimee(eleveId, a));
}
/** DELETE immédiat en base (toutes variantes de date) */
async function supprimerAbsenceEnBase(eleveId, a) {
  if (!SUPABASE_CONFIGURE || !eleveId || !a) return;
  const dateN = normaliserDateAbs(a.date) || a.date;
  const type = String(a.type || "").trim();
  const motif = String(a.motif || "").trim();
  try {
    const rows = (await pgSelect("absences")) || [];
    const ids = rows
      .filter((r) => String(r.eleve_id) === String(eleveId))
      .filter((r) => {
        const sameDate = normaliserDateAbs(r.date) === normaliserDateAbs(dateN);
        const sameType = String(r.type || "").trim() === type;
        const sameMotif = String(r.motif || "").trim() === motif;
        return sameDate && sameType && sameMotif;
      })
      .map((r) => r.id)
      .filter(Boolean);
    if (ids.length) await pgDeleteIn("absences", "id", ids);
    // Secours : filtre PostgREST
    try {
      const eid = encodeURIComponent(String(eleveId));
      const d = encodeURIComponent(String(dateN));
      await pgFetch(`/absences?eleve_id=eq.${eid}&date=eq.${d}`, {
        method: "DELETE", headers: { Prefer: "return=minimal" },
      });
    } catch (e2) {}
  } catch (e) {
    console.warn("supprimerAbsenceEnBase", e);
  }
}


/** Fusionne local + distant pour ne pas perdre une saisie pas encore en base */

/** Fusionne deux listes d'élèves en gardant le maximum d'infos (notes, absences, frais). */
function fusionnerListesEleves(a, b) {
  return fusionnerEleves(a || [], b || []);
}

function fusionnerEleves(locaux, distants) {
  const bans = new Set(lireElevesSupprimes().map(String));
  const map = new Map();
  // Ne jamais réinjecter un ID explicitement supprimé (ni depuis la base, ni depuis le cache)
  (distants || []).forEach((e) => {
    if (e && !bans.has(String(e.id))) map.set(e.id, { ...e });
  });
  (locaux || []).forEach((loc) => {
    if (!loc || bans.has(String(loc.id))) return;
    const d = map.get(loc.id);
    if (!d) {
      map.set(loc.id, loc);
      return;
    }
    const notes = filtrerNotesEleve(loc.id, [...(d.notes || []), ...(loc.notes || [])]);
    const absences = filtrerAbsencesEleve(loc.id, [...(d.absences || []), ...(loc.absences || [])]);
    const messages = filtrerMessagesEleve(loc.id, Array.from(new Map([...(d.messages || []), ...(loc.messages || [])].map((m) => [cleMsgObj(m), m])).values()));
    const fraisMap = new Map();
    const tsFrais = (f) => {
      if (!f) return 0;
      if (f.payeLe) { const t = Date.parse(f.payeLe); if (!isNaN(t)) return t; }
      if (f.datePaiement) { const t = Date.parse(f.datePaiement); if (!isNaN(t)) return t; }
      return 0;
    };
    let prioriteLocale = false;
    try {
      const prio = (typeof window !== "undefined" && window.__cspFraisPriorite) || {};
      const tPrio = Number(prio[String(loc.id)]) || 0;
      prioriteLocale = tPrio && (Date.now() - tPrio < 60000);
    } catch (e) {}
    // Distant puis local : local (secrétaire) gagne si plus récent OU priorité juste après saisie
    [...(d.frais || []), ...(loc.frais || [])].forEach((f) => {
      const k = cleFraisObj(f);
      const prev = fraisMap.get(k);
      if (!prev) { fraisMap.set(k, { ...f }); return; }
      const tPrev = tsFrais(prev);
      const tNew = tsFrais(f);
      const du = Math.max(Number(prev.du) || 0, Number(f.du) || 0);
      if (prioriteLocale && (loc.frais || []).some((lf) => cleFraisObj(lf) === k)) {
        // Garder la version locale pour cette rubrique pendant 60s après saisie
        const locF = (loc.frais || []).find((lf) => cleFraisObj(lf) === k);
        if (locF) {
          fraisMap.set(k, { ...prev, ...locF, du: Math.max(du, Number(locF.du) || 0), paye: Number(locF.paye) || 0 });
          return;
        }
      }
      if (tNew > tPrev) {
        fraisMap.set(k, { ...prev, ...f, du, paye: Number(f.paye) || 0 });
      } else if (tPrev > tNew) {
        fraisMap.set(k, { ...f, ...prev, du, paye: Number(prev.paye) || 0 });
      } else {
        fraisMap.set(k, {
          ...prev, ...f, du,
          paye: Number(f.paye) || 0,
          mode: f.mode != null ? f.mode : prev.mode,
          datePaiement: f.datePaiement || prev.datePaiement,
          payeLe: f.payeLe || prev.payeLe,
        });
      }
    });
    const frais = Array.from(fraisMap.values());
    map.set(loc.id, { ...d, ...loc, notes, absences, messages, frais, photoUrl: loc.photoUrl || d.photoUrl || null, parent: loc.parent || d.parent, decision: loc.decision || d.decision || null });
  });
  // Ne jamais réinjecter un élève explicitement supprimé
  return filtrerElevesNonSupprimes(Array.from(map.values()));
}

async function syncEleves(eleves, options = {}) {
  // Toujours exclure les IDs bannis (suppression volontaire)
  const bansActuels = new Set([
    ...(options.supprimerIds || []).map(String).filter(Boolean),
    ...lireElevesSupprimes().map(String),
  ]);
  const liste = (eleves || []).filter((e) => e && !bansActuels.has(String(e.id)));
  const ids = liste.map((e) => e.id);

  // 1) SUPPRESSION D'ABORD (avant tout upsert — sinon l'élève est réécrit en base)
  const aSupprimerExplicit = [...bansActuels];
  if (aSupprimerExplicit.length) {
    try {
      await pgDeleteIn("notes", "eleve_id", aSupprimerExplicit);
      await pgDeleteIn("absences", "eleve_id", aSupprimerExplicit);
      await pgDeleteIn("frais_eleve", "eleve_id", aSupprimerExplicit);
      await pgDeleteIn("messages_eleve", "eleve_id", aSupprimerExplicit);
      await pgDeleteIn("eleves", "id", aSupprimerExplicit);
      // Vérifier réellement en base avant de retirer de la liste noire
      try {
        const encore = (await pgSelect("eleves")) || [];
        const encoreSet = new Set(encore.map((r) => String(r.id)));
        const confirmes = aSupprimerExplicit.filter((id) => !encoreSet.has(String(id)));
        if (confirmes.length) retirerElevesSupprimesConfirmes(confirmes);
        // Les IDs encore présents restent bannis → retentative au prochain sync
      } catch (eVerif) {
        console.warn("Vérif suppression eleves:", eVerif);
      }
    } catch (errDel) {
      console.warn("Suppression eleves (non bloquant):", errDel);
    }
  }

  // Liste vide : uniquement si clôture d'année (options.vider === true)
  if (!liste.length) {
    if (!options.vider) return;
    try {
      const existants = (await pgSelect("eleves")) || [];
      const tous = existants.map((r) => r.id);
      if (tous.length) {
        await pgDeleteIn("notes", "eleve_id", tous);
        await pgDeleteIn("absences", "eleve_id", tous);
        await pgDeleteIn("frais_eleve", "eleve_id", tous);
        await pgDeleteIn("messages_eleve", "eleve_id", tous);
        await pgDeleteIn("eleves", "id", tous);
      }
    } catch (e) { console.warn("vidage eleves", e); }
    return;
  }

  try {
    try {
      await pgUpsert("eleves", liste.map((e) => ({
        id: e.id, prenom: e.prenom, nom: e.nom, sexe: e.sexe ?? null, naissance: e.naissance ?? null,
        classe: e.classe ?? null, enseignant: e.enseignant ?? null,
        decision: e.decision ?? null,
        parrain_nom: e.parent?.nom ?? null,
        parrain_telephone: e.parent?.telephone ?? null,
        photo_url: e.photoUrl || null,
        acces_parent_bloque: e.accesParentBloque ? true : false,
      })), "id");
    } catch (errPh) {
      await pgUpsert("eleves", liste.map((e) => ({
        id: e.id, prenom: e.prenom, nom: e.nom, sexe: e.sexe ?? null, naissance: e.naissance ?? null,
        classe: e.classe ?? null, enseignant: e.enseignant ?? null,
        decision: e.decision ?? null,
        parrain_nom: e.parent?.nom ?? null,
        parrain_telephone: e.parent?.telephone ?? null,
      })), "id");
      console.warn("eleves sans photo_url", errPh);
    }
  } catch (errEleves) {
    console.warn("Upsert eleves (non bloquant):", errEleves);
  }

  // Notes / absences / frais : fusion par élève — on ajoute le manquant, on met à jour sans vider les autres appareils
  const notesRemote = (await pgSelect("notes")) || [];
  const absRemote = (await pgSelect("absences")) || [];
  const fraisRemote = (await pgSelect("frais_eleve")) || [];
  const msgRemote = (await pgSelect("messages_eleve")) || [];

  // Clé note SANS note20 → une seule ligne par matière/évaluation/mois
  const cleNote = (n) => `${n.eleve_id || n.eleveId}||${String(n.matiere||"").trim().toLowerCase()}||${String(n.evaluation||"").trim().toLowerCase()}||${String(n.mois||"").trim().toLowerCase()}`;
  const cleAbs = (a) => `${a.eleve_id || a.eleveId}||${normaliserDateAbs(a.date)}||${String(a.type || "").trim()}||${String(a.motif || "").trim()}`;
  const cleMsg = (m) => `${m.eleve_id || m.eleveId}||${m.auteur || ""}||${m.texte}||${m.date}`;
  const cleFraisLib = (f) => `${f.eleve_id || f.eleveId}||${String(f.libelle || "").trim().toLowerCase()}`;

  const notesLoc = liste.flatMap((e) => dedupeNotes(e.notes || []).map((n) => ({
    eleve_id: e.id, matiere: n.matiere ?? null, evaluation: n.evaluation ?? null,
    mois: n.mois ?? null, note20: Number(n.note20) || 0, date_saisie: n.dateSaisie ?? null,
  })));
  const absLoc = liste.flatMap((e) => filtrerAbsencesEleve(e.id, e.absences || []).map((a) => ({
    eleve_id: e.id,
    date: normaliserDateAbs(a.date) || a.date || null,
    type: a.type ? String(a.type).trim() : null,
    motif: a.motif ? String(a.motif).trim() : "",
  })));
  const fraisLoc = liste.flatMap((e) => (e.frais || []).map((f) => ({
    eleve_id: e.id, libelle: f.libelle ?? null, du: Number(f.du) || 0, paye: Number(f.paye) || 0,
    mode: f.mode ?? null,
    date_paiement: f.payeLe || f.datePaiement || null,
  })));
  const msgLoc = liste.flatMap((e) => (e.messages || []).map((m) => ({
    eleve_id: e.id, auteur: m.auteur ?? null, texte: m.texte ?? null, date: m.date ?? null,
  })));

  const setA = new Set(absRemote.map(cleAbs));
  const setM = new Set(msgRemote.map(cleMsg));

  const remoteNotesParCle = new Map();
  (notesRemote || []).forEach((r) => {
    const k = cleNote(r);
    if (!remoteNotesParCle.has(k)) remoteNotesParCle.set(k, r);
  });
  const notesAInserer = [];
  const notesAMaj = [];
  const notesVues = new Set();
  notesLoc.forEach((n) => {
    const k = cleNote(n);
    if (notesVues.has(k)) return;
    notesVues.add(k);
    // Ne jamais réinsérer une note volontairement supprimée
    if (estNoteSupprimee(n.eleve_id || n.eleveId, n)) return;
    const r = remoteNotesParCle.get(k);
    if (!r) notesAInserer.push(n);
    else if (Number(r.note20) !== Number(n.note20) || String(r.date_saisie || "") !== String(n.date_saisie || "")) {
      notesAMaj.push({ id: r.id, ...n });
    }
  });
  const idsNotesDoublons = [];
  const vusRN = new Map();
  (notesRemote || []).forEach((r) => {
    if (!ids.includes(r.eleve_id)) return;
    const k = cleNote(r);
    if (vusRN.has(k)) { if (r.id) idsNotesDoublons.push(r.id); }
    else vusRN.set(k, r.id);
  });

  const absNew = absLoc.filter((a) => {
    if (setA.has(cleAbs(a))) return false;
    if (estAbsenceSupprimee(a.eleve_id, a)) return false;
    return true;
  });
  const msgNew = msgLoc.filter((m) => {
    if (setM.has(cleMsg(m))) return false;
    if (estMessageSupprime(m.eleve_id || m.eleveId, m)) return false;
    return true;
  });
  // Supprimer en base les messages absents en local ou volontairement effacés
  const setMsgLoc = new Set(msgLoc.map(cleMsg));
  const idsMsgASuppr = (msgRemote || []).filter((r) => {
    if (estMessageSupprime(r.eleve_id, r)) return true;
    if (ids.includes(r.eleve_id) && !setMsgLoc.has(cleMsg(r))) return true;
    return false;
  }).map((r) => r.id).filter(Boolean);

  const remoteFraisParCle = new Map();
  (fraisRemote || []).forEach((r) => remoteFraisParCle.set(cleFraisLib(r), r));
  const fraisAInserer = [];
  const fraisAMaj = [];
  fraisLoc.forEach((f) => {
    const r = remoteFraisParCle.get(cleFraisLib(f));
    if (!r) {
      fraisAInserer.push(f);
    } else if (
      Number(r.paye) !== Number(f.paye) ||
      Number(r.du) !== Number(f.du) ||
      (r.mode || null) !== (f.mode || null) ||
      String(r.date_paiement || "") !== String(f.date_paiement || "")
    ) {
      fraisAMaj.push({ id: r.id, ...f });
    }
  });

  if (notesAInserer.length) await pgInsert("notes", notesAInserer);
  for (const n of notesAMaj) {
    try {
      await pgFetch(`/notes?id=eq.${encodeURIComponent(String(n.id))}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          note20: Number(n.note20) || 0,
          date_saisie: n.date_saisie || null,
          matiere: n.matiere,
          evaluation: n.evaluation,
          mois: n.mois,
        }),
      });
    } catch (errN) { console.warn("Maj note", errN); }
  }
  if (idsNotesDoublons.length) {
    try { await pgDeleteIn("notes", "id", [...new Set(idsNotesDoublons)]); } catch (e) { console.warn("suppr notes doublons", e); }
  }
  if (absNew.length) await pgInsert("absences", absNew);
  if (fraisAInserer.length) await pgInsert("frais_eleve", fraisAInserer);
  for (const f of fraisAMaj) {
    const corps = {
      du: Number(f.du) || 0,
      paye: Number(f.paye) || 0,
      mode: f.mode || null,
      date_paiement: f.date_paiement || f.datePaiement || null,
      libelle: f.libelle,
      eleve_id: f.eleve_id,
    };
    let ok = false;
    // 1) PATCH par id ligne
    if (f.id != null && f.id !== "") {
      try {
        await pgFetch(`/frais_eleve?id=eq.${encodeURIComponent(String(f.id))}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(corps),
        });
        ok = true;
      } catch (err1) {
        console.warn("Maj frais par id", err1);
      }
    }
    // 2) PATCH par eleve_id + libelle (plus fiable multi-appareils)
    if (!ok && f.eleve_id && f.libelle) {
      try {
        const lib = encodeURIComponent(String(f.libelle));
        const eid = encodeURIComponent(String(f.eleve_id));
        await pgFetch(`/frais_eleve?eleve_id=eq.${eid}&libelle=eq.${lib}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(corps),
        });
        ok = true;
      } catch (err2) {
        console.warn("Maj frais par eleve+libelle", err2);
      }
    }
    // 3) INSERT si aucune ligne à mettre à jour
    if (!ok) {
      try {
        await pgInsert("frais_eleve", [{
          eleve_id: f.eleve_id, libelle: f.libelle, du: corps.du, paye: corps.paye, mode: corps.mode,
          date_paiement: corps.date_paiement,
        }]);
      } catch (err3) {
        console.warn("Insert frais secours", err3);
      }
    }
  }
  // Supprimer les doublons frais (même élève + même libellé) pour éviter qu'un ancien montant réapparaisse
  try {
    const fraisApres = (await pgSelect("frais_eleve")) || [];
    const parCle = new Map();
    const doublons = [];
    fraisApres.forEach((r) => {
      if (!ids.includes(r.eleve_id)) return;
      const k = `${r.eleve_id}||${String(r.libelle || "").trim().toLowerCase()}`;
      const prev = parCle.get(k);
      if (!prev) { parCle.set(k, r); return; }
      const tPrev = Date.parse(prev.date_paiement || "") || 0;
      const tR = Date.parse(r.date_paiement || "") || 0;
      if (tR >= tPrev) {
        doublons.push(prev.id);
        parCle.set(k, r);
      } else {
        doublons.push(r.id);
      }
    });
    const idsDoublons = doublons.filter(Boolean);
    if (idsDoublons.length) await pgDeleteIn("frais_eleve", "id", idsDoublons);
  } catch (e) { console.warn("nettoyage doublons frais", e); }
  // Supprimer en base les frais qui n'existent plus localement (suppression admin)
  const localFraisCles = new Set(fraisLoc.map(cleFraisLib));
  const idsFraisASuppr = (fraisRemote || [])
    .filter((r) => ids.includes(r.eleve_id) && !localFraisCles.has(cleFraisLib(r)))
    .map((r) => r.id)
    .filter(Boolean);
  if (idsFraisASuppr.length) {
    try { await pgDeleteIn("frais_eleve", "id", idsFraisASuppr); } catch (e) { console.warn("suppr frais", e); }
  }
  // Idem notes / absences / messages retirés localement
  const localNotes = new Set(notesLoc.map(cleNote));
  const idsNotesASuppr = (notesRemote || []).filter((r) => {
    if (!ids.includes(r.eleve_id) && !ids.includes(String(r.eleve_id))) {
      // aussi supprimer si bannie même hors liste courante d'élèves sync
    }
    const bannie = estNoteSupprimee(r.eleve_id, r);
    const plusEnLocal = ids.includes(r.eleve_id) && !localNotes.has(cleNote(r));
    return bannie || plusEnLocal;
  }).map((r) => r.id).filter(Boolean);
  if (idsNotesASuppr.length) {
    try { await pgDeleteIn("notes", "id", [...new Set(idsNotesASuppr)]); } catch (e) { console.warn("suppr notes", e); }
  }
  const localAbs = new Set(absLoc.map(cleAbs));
  const idsAbsASuppr = [];
  const vusAbs = new Map();
  (absRemote || []).forEach((r) => {
    if (!ids.includes(r.eleve_id)) return;
    const k = cleAbs(r);
    const bannie = estAbsenceSupprimee(r.eleve_id, r);
    const absenteLocal = !localAbs.has(k);
    if (bannie || absenteLocal) {
      if (r.id) idsAbsASuppr.push(r.id);
      return;
    }
    // Doublons : garder la première
    if (vusAbs.has(k)) {
      if (r.id) idsAbsASuppr.push(r.id);
    } else {
      vusAbs.set(k, r.id);
    }
  });
  if (idsAbsASuppr.length) {
    try { await pgDeleteIn("absences", "id", [...new Set(idsAbsASuppr)]); } catch (e) { console.warn("suppr abs", e); }
  }
  if (msgNew.length) await pgInsert("messages_eleve", msgNew);
  if (typeof idsMsgASuppr !== "undefined" && idsMsgASuppr.length) {
    try { await pgDeleteIn("messages_eleve", "id", [...new Set(idsMsgASuppr)]); } catch (e) { console.warn("suppr messages", e); }
  }
}


async function chargerDonneesPartagees() {
  const [classesRows, fraisRows, annoncesRows, messagesRows] = await Promise.all([
    pgSelect("classes", "&order=ordre"),
    pgSelect("frais_types"),
    pgSelect("annonces", "&order=cree_le.desc"),
    pgSelect("messages_internes", "&order=cree_le.desc"),
  ]);
  return {
    classes: (classesRows || []).map((row) => row.nom),
    fraisTypes: (fraisRows || []).map((row) => ({ libelle: row.libelle, montant: Number(row.montant), classe: row.classe || null })),
    annonces: (annoncesRows || []).map((row) => ({ titre: row.titre, texte: row.texte, date: row.date })),
    messagesInternes: (messagesRows || []).map((row) => ({ destinataire: row.destinataire, texte: row.texte, date: row.date })),
  };
}


export default function EcoleConnecteeCSP() {
  const [role, setRole] = useState(null);
  const [eleveIdActif, setEleveIdActif] = useState(null);
  const [classeEnseignantActive, setClasseEnseignantActive] = useState(null);
  const [vue, setVue] = useState("connexion");
  // Rôle courant accessible dans les effets (écriture autorisée seulement selon le rôle)
  const roleRef = useRef(null);
  roleRef.current = role;
  const rechargerBaseRef = useRef(() => {});
  // Avec Supabase: ne pas démarrer depuis localStorage (sinon chaque téléphone écrase la base)
  const sauvegardeInitiale = useMemo(() => (SUPABASE_CONFIGURE ? null : lireStockageLocal()), []);
  const [eleves, setEleves] = useState(sauvegardeInitiale?.eleves || (SUPABASE_CONFIGURE ? [] : ELEVES_INIT));
  const [personnel, setPersonnel] = useState(sauvegardeInitiale?.personnel || (SUPABASE_CONFIGURE ? [] : PERSONNEL_INIT));
  const [annonces, setAnnonces] = useState(sauvegardeInitiale?.annonces || (SUPABASE_CONFIGURE ? [] : ANNONCES_INIT));
  const [demandes, setDemandes] = useState(sauvegardeInitiale?.demandes || (SUPABASE_CONFIGURE ? [] : DEMANDES_INIT));
  const [ecole, setEcole] = useState(() => fusionnerEcole(sauvegardeInitiale?.ecole));
  const [classes, setClasses] = useState(sauvegardeInitiale?.classes || (SUPABASE_CONFIGURE ? [] : CLASSES_INIT));
  const [codes, setCodes] = useState(() => completerCodesEnseignants(sauvegardeInitiale?.codes || CODES_INIT, sauvegardeInitiale?.classes || CLASSES_INIT));
  const [anneeScolaire, setAnneeScolaire] = useState(sauvegardeInitiale?.anneeScolaire || ANNEE_INIT);
  const [fraisTypes, setFraisTypes] = useState(sauvegardeInitiale?.fraisTypes || (SUPABASE_CONFIGURE ? [] : FRAIS_TYPES_INIT));
  const [matieresParClasse, setMatieresParClasse] = useState(sauvegardeInitiale?.matieresParClasse || (SUPABASE_CONFIGURE ? {} : MATIERES_PAR_CLASSE_INIT));
  const [emploiDuTemps, setEmploiDuTemps] = useState(sauvegardeInitiale?.emploiDuTemps || (SUPABASE_CONFIGURE ? {} : EMPLOI_INIT));
  const [messagesInternes, setMessagesInternes] = useState(sauvegardeInitiale?.messagesInternes || []);
  const [anneesArchivees, setAnneesArchivees] = useState(sauvegardeInitiale?.anneesArchivees || []);
  const [messagesParents, setMessagesParents] = useState(sauvegardeInitiale?.messagesParents || []);
  const [depenses, setDepenses] = useState(() => lireDepenses());
  const [erreurSync, setErreurSync] = useState(null);

  // --- Chargement initial depuis Supabase ---
  const [chargement, setChargement] = useState(SUPABASE_CONFIGURE);
  const [erreurChargement, setErreurChargement] = useState(null);
  const [basePrete, setBasePrete] = useState(!SUPABASE_CONFIGURE);
  const pretPourSync = useRef(false);
  // Surveillance fermeture plateforme (indépendante du sync données)
  useEffect(() => {
    const verifier = () => {
      try {
        const roleActuel = roleRef.current;
        if (!roleActuel || roleActuel === "fondateur") return;
        if (!lirePlateformeActive()) {
          try { window.alert((lireMessageMaintenance() || "La plateforme est temporairement fermée par le Fondateur.") + "\n\nVous allez être déconnecté."); } catch (e) {}
          try { __cspSession = null; } catch (e) {}
          try {
            roleRef.current = null;
            setRole(null);
            setEleveIdActif(null);
            setClasseEnseignantActive(null);
            setChargement(false);
          } catch (e) {}
        }
      } catch (e) {}
    };
    const id = setInterval(verifier, 4000);
    verifier();
    return () => clearInterval(id);
  }, []);
  const ecoleUserEditRef = useRef(false);
  const ecoleChargeeRef = useRef(false); // une fois chargée depuis la base, plus de bascule auto
  const annoncesChargeesRef = useRef(false); // messages publics stabilisés
  try { if (typeof window !== "undefined") window.__cspMarquerEcoleEdit = () => { ecoleUserEditRef.current = true; }; } catch (e) {}
  const partageSnapshot = useRef("");
  // Empêche d'écrire vers Supabase quand on vient de LIRE la base (sinon un téléphone efface l'autre)
  const sourceRemoteRef = useRef(false);
  const elevesRef = useRef(eleves);
  elevesRef.current = eleves;
  const flushElevesRef = useRef(() => {});
  const anneeViergeRef = useRef(false);
  const elevesASupprimerRef = useRef([]);

  // Sync dépenses multi-appareils
  useEffect(() => {
    if (!SUPABASE_CONFIGURE || !pretPourSync.current) return;
    if (sourceRemoteRef.current) return;
    if (!roleAutorise(roleRef.current, "depenses")) return;
    const t = setTimeout(() => { syncDepenses(depenses).catch(() => {}); }, 600);
    return () => clearTimeout(t);
  }, [depenses]);


  useEffect(() => {
    setCodes((prev) => {
      const next = completerCodesEnseignants(prev, classes);
      const prevMap = (prev && prev.enseignants) || {};
      const nextMap = next.enseignants || {};
      const changed = (classes || []).some((cls) => !prevMap[cls] || prevMap[cls] !== nextMap[cls]);
      return changed ? next : prev;
    });
  }, [classes]);


  useEffect(() => {
    if (!SUPABASE_CONFIGURE) {
      // Mode local : données conservées dans le navigateur (même téléphone)
      setChargement(false);
      pretPourSync.current = false;
      return;
    }
    let annule = false;
    let essais = 0;

    const appliquerDepuisBase = (d) => {
        sourceRemoteRef.current = true;
        // Fusion stable : ne jamais écraser une info utile par du vide (évite les bascules d'affichage)
        setEcole((prev) => {
          // Verrou : après 1er chargement utile, ne plus changer sauf édition Paramètres
          if (ecoleChargeeRef.current && !ecoleUserEditRef.current) return prev;
          const remote = d.ecole;
          const remoteOk = remote && (String(remote.nom || "").trim() || String(remote.directeur || "").trim());
          if (!remoteOk) return prev && prev.nom ? prev : fusionnerEcole(null);
          const next = fusionnerEcole(remote, prev && prev.nom ? prev : ECOLE_INIT);
          ecoleChargeeRef.current = true;
          return ecoleIdentique(prev, next) ? prev : next;
        });
        setAnneeScolaire((prev) => (d.anneeScolaire && String(d.anneeScolaire).trim()) ? d.anneeScolaire : (prev || ANNEE_INIT));
        {
          const classesOk = (d.classes && d.classes.length) ? d.classes : null;
          setClasses((prev) => classesOk || (prev && prev.length ? prev : CLASSES_INIT));
          setCodes((prev) => {
            const remote = d.codes || {};
            const aDuContenu = ["fondateur", "directeur", "secretaire", "enseignant"].some(
              (r) => remote[r] && String(remote[r]).trim()
            ) || (remote.enseignants && typeof remote.enseignants === "object" && Object.keys(remote.enseignants).length);
            const base = aDuContenu ? remote : (prev || CODES_INIT);
            const cls = classesOk || CLASSES_INIT;
            return completerCodesEnseignants(base, cls);
          });
        }
        setMatieresParClasse((prev) => {
          if (d.matieresParClasse && Object.keys(d.matieresParClasse).length) {
            return dedupeMatieresParClasse(d.matieresParClasse);
          }
          return (prev && Object.keys(prev).length) ? prev : MATIERES_PAR_CLASSE_INIT;
        });
        setPersonnel((prev) => (d.personnel && d.personnel.length ? dedupePersonnel(d.personnel) : prev));
        setFraisTypes((prev) => (d.fraisTypes && d.fraisTypes.length) ? dedupeFraisTypes(d.fraisTypes) : (prev && prev.length ? prev : FRAIS_TYPES_INIT));
        {
          const cacheLocal = SUPABASE_CONFIGURE ? (lireStockageLocal()?.eleves || []) : [];
          setEleves((prev) => {
            let liste = [];
            if (d.eleves && d.eleves.length && (prev && prev.length || cacheLocal.length)) {
              liste = filtrerElevesNonSupprimes(fusionnerEleves(prev && prev.length ? prev : cacheLocal, d.eleves));
            } else if (d.eleves && d.eleves.length) {
              liste = filtrerElevesNonSupprimes(d.eleves);
            } else if (prev && prev.length) {
              liste = filtrerElevesNonSupprimes(prev);
            } else if (cacheLocal.length) {
              liste = filtrerElevesNonSupprimes(cacheLocal);
            } else {
              liste = SUPABASE_CONFIGURE ? [] : ELEVES_INIT;
            }
            const avecSexe = completerSexesDepuisDemandes(liste, d.demandes || []);
            return appliquerPhotosLocales(avecSexe);
          });
        }
        setAnnonces((prev) => {
          if (d.annonces && d.annonces.length) {
            annoncesChargeesRef.current = true;
            return d.annonces;
          }
          // Ne jamais vider si on a déjà des annonces affichées
          if (annoncesChargeesRef.current && prev && prev.length) return prev;
          if (prev && prev.length) return prev;
          return prev || [];
        });
        setMessagesInternes((prev) => (d.messagesInternes && d.messagesInternes.length) ? d.messagesInternes : prev);
        setMessagesParents((prev) => (d.messagesParents && d.messagesParents.length) ? d.messagesParents : prev);
        setDemandes((prev) => (d.demandes && d.demandes.length) ? d.demandes : prev);
        setAnneesArchivees((prev) => (d.anneesArchivees && d.anneesArchivees.length) ? d.anneesArchivees : prev);
        if (d.emploiDuTemps && Object.keys(d.emploiDuTemps).length) {
          setEmploiDuTemps(d.emploiDuTemps);
        }
        // Dépenses partagées (table Supabase depenses)
        chargerDepensesRemote().then((liste) => {
          if (liste && liste.length) setDepenses(liste);
        }).catch(() => {});
        partageSnapshot.current = JSON.stringify(d);
        setBasePrete(true);
        setChargement(false);
        setErreurChargement(null);
        setTimeout(() => { sourceRemoteRef.current = false; flushElevesRef.current(); }, 900);
        setTimeout(() => { pretPourSync.current = true; }, 1200);
    };

    let dejaOuvert = false;
    const ouvrirSansBase = (raison) => {
      if (annule || dejaOuvert) return;
      dejaOuvert = true;
      console.warn("Ouverture sans réponse base:", raison);
      sourceRemoteRef.current = true;
      try {
        const cache = lireStockageLocal() || {};
        if (cache.eleves && cache.eleves.length) {
          setEleves(appliquerPhotosLocales(filtrerElevesNonSupprimes(cache.eleves)));
        }
        if (cache.ecole) setEcole((prev) => { if (ecoleChargeeRef.current) return prev; return fusionnerEcole(cache.ecole); });
        else setEcole((prev) => { if (ecoleChargeeRef.current && prev && prev.nom) return prev; return fusionnerEcole(null); });
        if (cache.classes && cache.classes.length) setClasses(cache.classes);
        if (cache.annonces && cache.annonces.length) setAnnonces(cache.annonces);
        if (cache.demandes) setDemandes(cache.demandes);
        if (cache.annonces && cache.annonces.length) { annoncesChargeesRef.current = true; setAnnonces(cache.annonces); }
      } catch (e) {}
      setErreurChargement(raison || "Base lente ou inaccessible — mode secours local");
      setBasePrete(true);
      setChargement(false);
      setTimeout(() => { sourceRemoteRef.current = false; }, 500);
      setTimeout(() => { pretPourSync.current = true; }, 1500);
    };

    const tenterChargement = () => {
      if (annule) return;
      essais += 1;
      // Timeout 5s par essai
      const avecTimeout = Promise.race([
        chargerToutesLesDonnees(),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Délai dépassé (5s)")), 5000)),
      ]);
      avecTimeout
        .then((d) => {
          if (annule) return;
          appliquerDepuisBase(d);
        })
        .catch((err) => {
          if (annule) return;
          console.warn("Supabase indisponible (essai " + essais + "):", err);
          setErreurChargement(
            "Connexion à la base… essai " + essais + " — " + String(err.message || err)
          );
          if (essais >= 2) {
            ouvrirSansBase("Impossible de joindre la base après " + essais + " essais. Vérifiez Supabase / variables Vercel.");
            return;
          }
          setTimeout(tenterChargement, 1500);
        });
    };

    // Après connexion : recharge TOUTES les données avec le jeton (selon les droits du rôle)
    rechargerBaseRef.current = () => {
      sourceRemoteRef.current = true;
      setErreurChargement(null);
      // Pas de setChargement(true) ici : évite l'écran « Connexion à la base… » à chaque changement d'espace
      chargerToutesLesDonnees()
        .then((d) => {
          appliquerDepuisBase(d);
          setChargement(false);
        })
        .catch((err) => {
          console.warn("Chargement après connexion impossible", err);
          setErreurChargement(String((err && err.message) || err));
          sourceRemoteRef.current = false;
          setChargement(false);
        });
    };

    // Au bout de 5s max, ouvrir l'accueil (base lente / pause Supabase)
    const limite = setTimeout(() => {
      if (annule) return;
      ouvrirSansBase("Connexion trop longue — affichage de l'accueil. Vous pouvez vous connecter ; les données se chargeront ensuite.");
    }, 5000);

    tenterChargement();

    return () => { annule = true; try { clearTimeout(limite); } catch (e) {} };
  }, []);

  useEffect(() => {
    // Cache local uniquement hors conflit multi-appareils (mode offline / secours)
    if (SUPABASE_CONFIGURE && sourceRemoteRef.current) return;
    ecrireStockageLocal({
      eleves: filtrerElevesNonSupprimes(eleves), personnel, annonces, demandes, ecole, classes,
      anneeScolaire, fraisTypes, matieresParClasse, emploiDuTemps,
      messagesInternes, anneesArchivees, messagesParents,
    });
  }, [eleves, personnel, annonces, demandes, ecole, classes, codes, anneeScolaire, fraisTypes, matieresParClasse, emploiDuTemps, messagesInternes, anneesArchivees, messagesParents]);

  useEffect(() => {
    if (!SUPABASE_CONFIGURE) return;
    let annule = false;
    const actualiser = async () => {
      try {
        // Sans connexion (écran d'accueil) : rien à actualiser
        if (!roleRef.current || !lireSession() || !pretPourSync.current) return;
        // Plateforme fermée : déconnecter tous sauf fondateur
        if (roleRef.current !== "fondateur" && !lirePlateformeActive()) {
          try {
            window.alert("La plateforme a été fermée par le Fondateur. Vous allez être déconnecté.");
          } catch (e) {}
          try { __cspSession = null; } catch (e) {}
          try { roleRef.current = null; setRole(null); setEleveIdActif(null); setClasseEnseignantActive(null); setChargement(false); } catch (e) {}
          return;
        }
        const etat = await pingSession();
        if (annule) return;
        if (etat === false) {
          // Session expirée côté serveur : retour à l'accueil
          window.alert("Votre session a expiré. Veuillez vous reconnecter.");
          effacerDonneesLocales();
          definirSession(null);
          window.location.reload();
          return;
        }
        const d = await chargerToutesLesDonnees();
        if (annule) return;
        const snapshot = JSON.stringify(d);
        if (snapshot === partageSnapshot.current) return;
        partageSnapshot.current = snapshot;
        // Lecture seule: ne pas renvoyer ces données vers Supabase
        sourceRemoteRef.current = true;
        setEcole((prev) => {
          // Verrou : après 1er chargement utile, ne plus changer sauf édition Paramètres
          if (ecoleChargeeRef.current && !ecoleUserEditRef.current) return prev;
          const remote = d.ecole;
          const remoteOk = remote && (String(remote.nom || "").trim() || String(remote.directeur || "").trim());
          if (!remoteOk) return prev && prev.nom ? prev : fusionnerEcole(null);
          const next = fusionnerEcole(remote, prev && prev.nom ? prev : ECOLE_INIT);
          ecoleChargeeRef.current = true;
          return ecoleIdentique(prev, next) ? prev : next;
        });
        setClasses((prev) => (d.classes && d.classes.length ? d.classes : prev));
        setAnneeScolaire((prev) => (d.anneeScolaire && String(d.anneeScolaire).trim()) ? d.anneeScolaire : prev);
        setCodes((prev) => {
          const remote = d.codes || {};
          const aDuContenu = ["fondateur", "directeur", "secretaire", "enseignant"].some(
            (r) => remote[r] && String(remote[r]).trim()
          );
          if (!aDuContenu) return prev;
          return completerCodesEnseignants(remote, (d.classes && d.classes.length) ? d.classes : CLASSES_INIT);
        });
        chargerDepensesRemote().then((liste) => {
          if (liste && liste.length > 0) setDepenses(liste);
        }).catch(() => {});
        setFraisTypes((prev) => (d.fraisTypes && d.fraisTypes.length ? dedupeFraisTypes(d.fraisTypes) : prev));
        if (d.eleves.length) {
          setEleves((prev) => {
            // Après clôture d'année : garder la liste vide jusqu'aux nouvelles inscriptions
            if ((!prev || prev.length === 0) && (anneeViergeRef.current || (typeof window !== "undefined" && window.__cspAnneeVierge))) {
              // Garde vide seulement ~2 minutes après clôture, puis accepte la base
              const t0 = (typeof window !== "undefined" && window.__cspAnneeViergeDepuis) ? window.__cspAnneeViergeDepuis : 0;
              if (t0 && Date.now() - t0 < 120000) return prev || [];
              anneeViergeRef.current = false;
              try { window.__cspAnneeVierge = false; } catch (e) {}
            }
            if ((!prev || prev.length === 0) && d.eleves.length) {
              // Si local vide sans clôture, accepter la base (autre appareil)
              return appliquerPhotosLocales(filtrerElevesNonSupprimes(fusionnerEleves(prev, d.eleves)));
            }
            return appliquerPhotosLocales(filtrerElevesNonSupprimes(fusionnerEleves(prev, d.eleves)));
          });
        }
        setPersonnel((prev) => (d.personnel && d.personnel.length ? dedupePersonnel(d.personnel) : prev));
        setEmploiDuTemps((prev) => (d.emploiDuTemps && Object.keys(d.emploiDuTemps).length ? d.emploiDuTemps : prev));
        setAnneesArchivees((prev) => (d.anneesArchivees && d.anneesArchivees.length) ? d.anneesArchivees : prev);
        setAnnonces((prev) => {
          if (d.annonces && d.annonces.length) {
            annoncesChargeesRef.current = true;
            return d.annonces;
          }
          // Ne jamais vider si on a déjà des annonces affichées
          if (annoncesChargeesRef.current && prev && prev.length) return prev;
          if (prev && prev.length) return prev;
          return prev || [];
        });
        setMessagesInternes((prev) => (d.messagesInternes && d.messagesInternes.length) ? d.messagesInternes : prev);
        setMessagesParents((prev) => {
          const remote = d.messagesParents || [];
          if (!prev.length) return remote;
          const cle = (m) => `${m.eleveId || ""}||${m.texte || ""}||${m.date || ""}`;
          const map = new Map();
          remote.forEach((m) => map.set(cle(m), m));
          prev.forEach((m) => {
            const k = cle(m);
            const r = map.get(k);
            if (!r) map.set(k, m);
            else if (m.lu && !r.lu) map.set(k, { ...r, ...m, lu: true });
            else if (m.lu || r.lu) map.set(k, { ...r, lu: true });
          });
          return Array.from(map.values());
        });
        setDemandes((prev) => {
          const remote = d.demandes || [];
          if (!remote.length && !prev.length) return prev;
          const map = new Map(remote.map((x) => [x.id, x]));
          (prev || []).forEach((p) => {
            if (p.statut === "validee" || p.statut === "refusee") {
              const r = map.get(p.id);
              map.set(p.id, { ...(r || {}), ...p, statut: p.statut, codeEleve: p.codeEleve || (r && r.codeEleve) });
            }
          });
          return Array.from(map.values());
        });
        if (Object.keys(d.matieresParClasse || {}).length) setMatieresParClasse((prev) => {
          const remote = dedupeMatieresParClasse(d.matieresParClasse || {});
          if (remote && Object.keys(remote).length) return remote;
          return (prev && Object.keys(prev).length) ? prev : remote;
        });
        setTimeout(() => { sourceRemoteRef.current = false; flushElevesRef.current(); }, 900);
      } catch (err) {
        console.warn("Actualisation partagée indisponible", err);
      }
    };
    const intervalle = window.setInterval(actualiser, 4000);
    // Quand on revient sur l'onglet / le téléphone : recharger tout de suite
    const onVis = () => {
      try {
        if (document.visibilityState === "visible") {
          try { if (window.__cspFlushEleves) window.__cspFlushEleves(); } catch (e2) {}
          actualiser();
        }
      } catch (e) {}
    };
    const onFocus = () => {
      try {
        if (window.__cspFlushEleves) window.__cspFlushEleves();
        actualiser();
      } catch (e) {}
    };
    const onOnline = () => {
      try {
        if (window.__cspFlushEleves) window.__cspFlushEleves();
        actualiser();
      } catch (e) {}
    };
    try {
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("focus", onFocus);
      window.addEventListener("online", onOnline);
    } catch (e) {}
    return () => {
      annule = true;
      window.clearInterval(intervalle);
      try {
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("online", onOnline);
      } catch (e) {}
    };
  }, []);

  // --- Synchronisation automatique : seulement si Supabase configuré ---
  const avecSuivi = (promesse) => {
    if (!SUPABASE_CONFIGURE) return;
    promesse.catch((err) => {
      const m = (err.message || String(err)).toLowerCase();
      // Abandon / réseau : souvent temporaire sur mobile — ne pas bloquer l'utilisateur
      if (
        m.includes('abort') ||
        m.includes('non configuré') ||
        m.includes('failed to fetch') ||
        m.includes('network') ||
        m.includes('404') ||
        m.includes('not_found') ||
        !navigator.onLine
      ) {
        console.warn('Sync différée ou hors ligne', err);
        return;
      }
      setErreurSync(err.message || String(err));
    });
  };

  // Si une saisie a eu lieu pendant un rechargement base, on envoie dès que le verrou tombe
  flushElevesRef.current = () => {
    if (!SUPABASE_CONFIGURE) return;
    if (!roleAutorise(roleRef.current, "eleves")) return;
    const supprimerIds = lireElevesSupprimes();
    const e = filtrerElevesNonSupprimes(elevesRef.current || []);
    const viderAnnee = !!(typeof window !== "undefined" && window.__cspAnneeVierge);
    if (e.length || supprimerIds.length) {
      avecSuivi(syncEleves(e, { supprimerIds }));
    } else if (viderAnnee) {
      avecSuivi(syncEleves([], { vider: true }));
    }
  };
  try {
    if (typeof window !== "undefined") {
      window.__cspFlushEleves = () => flushElevesRef.current();
    }
  } catch (e) {}

  const peutEcrire = (table) => pretPourSync.current && SUPABASE_CONFIGURE && !sourceRemoteRef.current && roleAutorise(roleRef.current, table);

  useEffect(() => {
    // N'écrit l'école en base QUE si l'utilisateur a modifié Paramètres (évite Boko/Agani en boucle)
    if (!peutEcrire("ecole")) return;
    if (!ecoleUserEditRef.current) return;
    const t = setTimeout(() => {
      avecSuivi(syncEcole(ecole, anneeScolaire));
    }, 600);
    return () => clearTimeout(t);
  }, [ecole, anneeScolaire]);
  useEffect(() => { if (peutEcrire("codes")) avecSuivi(syncCodes(codes)); }, [codes]);
  useEffect(() => { if (peutEcrire("classes")) avecSuivi(syncClasses(classes)); }, [classes]);
  useEffect(() => {
    if (!peutEcrire("matieres")) return;
    const t = setTimeout(() => { avecSuivi(syncMatieresParClasse(matieresParClasse)); }, 800);
    return () => clearTimeout(t);
  }, [matieresParClasse]);
  useEffect(() => { if (peutEcrire("personnel")) avecSuivi(syncPersonnel(personnel)); }, [personnel]);
  useEffect(() => { if (peutEcrire("fraisTypes")) avecSuivi(syncFraisTypes(fraisTypes)); }, [fraisTypes]);
  const elevesLenRef = useRef((eleves || []).length);
  useEffect(() => {
    elevesRef.current = eleves;
    // Secours local : les infos de TOUS les élèves restent sur le téléphone même si le réseau coupe
    try {
      const prev = lireStockageLocal() || {};
      ecrireStockageLocal({ ...prev, eleves: eleves || [], sauvegardeLe: new Date().toISOString() });
    } catch (e) {}
    if ((eleves || []).length > 0) {
      anneeViergeRef.current = false;
      try { if (typeof window !== "undefined") window.__cspAnneeVierge = false; } catch (e) {}
    }
    if (!pretPourSync.current || !SUPABASE_CONFIGURE) return;
    if (!roleAutorise(roleRef.current, "eleves")) return;
    const prevLen = elevesLenRef.current;
    const curLen = (eleves || []).length;
    elevesLenRef.current = curLen;
    const vider = prevLen > 0 && curLen === 0;
    if (vider) anneeViergeRef.current = true;
    const t = setTimeout(() => {
      let supprimerIds = [];
      try {
        const fromWin = (typeof window !== "undefined" && window.__cspElevesASupprimer) ? window.__cspElevesASupprimer : [];
        supprimerIds = [...new Set([...fromWin, ...lireElevesSupprimes()].map(String).filter(Boolean))];
      } catch (e) {}
      const listePropre = filtrerElevesNonSupprimes(elevesRef.current || []);
      // Les suppressions passent même si pretPourSync pas encore prêt
      if (!SUPABASE_CONFIGURE) return;
      if (!pretPourSync.current && !supprimerIds.length && !vider) return;
      avecSuivi(syncEleves(listePropre, { vider, supprimerIds }));
    }, sourceRemoteRef.current ? 600 : 200);
    return () => clearTimeout(t);
  }, [eleves]);
  useEffect(() => {
    if (!peutEcrire("annonces")) return;
    const t = setTimeout(() => avecSuivi(syncAnnonces(annonces)), 250);
    return () => clearTimeout(t);
  }, [annonces]);
  useEffect(() => { if (peutEcrire("messagesInternes")) avecSuivi(syncMessagesInternes(messagesInternes)); }, [messagesInternes]);
  useEffect(() => { if (peutEcrire("messagesParents")) avecSuivi(syncMessagesParents(messagesParents)); }, [messagesParents]);
  useEffect(() => { if (peutEcrire("demandes")) avecSuivi(syncDemandes(demandes)); }, [demandes]);
  useEffect(() => { if (peutEcrire("annees")) avecSuivi(syncAnneesArchivees(anneesArchivees)); }, [anneesArchivees]);
  useEffect(() => { if (peutEcrire("emploi")) avecSuivi(syncEmploiDuTemps(emploiDuTemps)); }, [emploiDuTemps]);

  // Retente les suppressions d'élèves tant qu'elles ne sont pas confirmées en base
  useEffect(() => {
    if (!SUPABASE_CONFIGURE) return undefined;
    const id = setInterval(() => {
      if (!roleAutorise(roleRef.current, "elevesSuppr")) return;
      const bans = lireElevesSupprimes();
      if (!bans.length) return;
      const e = filtrerElevesNonSupprimes(elevesRef.current || []);
      avecSuivi(syncEleves(e, { supprimerIds: bans }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Tant que Supabase n'a pas répondu une fois : pas d'écran de connexion "ancien / démo"
  if (SUPABASE_CONFIGURE && !basePrete) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-6" style={{ background: "linear-gradient(165deg, #DBEAFE, #D1FAE5)" }}>
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "#1B2A4A", borderTopColor: "transparent" }} />
          <p className="font-serif text-lg" style={{ color: "#1B2A4A" }}>Connexion à la base de données…</p>
          <p className="mt-2 text-[14px]" style={{ color: "#5C5240" }}>
            Chargement des données de l&apos;école. Si ça dure plus de 5 secondes, l&apos;accueil s&apos;ouvre tout seul.
          </p>
          {erreurChargement && (
            <p className="mt-3 text-[13px]" style={{ color: "#8A2E2E" }}>
              {erreurChargement}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              try {
                const cache = lireStockageLocal() || {};
                if (cache.eleves && cache.eleves.length) {
                  setEleves(appliquerPhotosLocales(filtrerElevesNonSupprimes(cache.eleves)));
                }
                if (cache.ecole) setEcole((prev) => { if (ecoleChargeeRef.current) return prev; return fusionnerEcole(cache.ecole); });
                else setEcole((prev) => { if (ecoleChargeeRef.current && prev && prev.nom) return prev; return fusionnerEcole(null); });
                if (cache.annonces && cache.annonces.length) setAnnonces(cache.annonces);
              } catch (e) {
                try { setEcole((prev) => { if (ecoleChargeeRef.current && prev && prev.nom) return prev; return fusionnerEcole(null); }); } catch (e2) {}
              }
              setBasePrete(true);
              setChargement(false);
              setTimeout(() => { pretPourSync.current = true; }, 500);
            }}
            className="mt-5 rounded-full px-6 py-3 text-[15px] font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg,#0284C7,#0EA5E9)" }}
          >
            Afficher l&apos;accueil maintenant
          </button>
          <p className="mt-3 text-[12px]" style={{ color: "#9A8B67" }}>
            Si la base ne répond pas : Internet, projet Supabase (pas en pause), variables Vercel VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY, puis Redeploy.
          </p>
        </div>
      </div>
    );
  }

  if (chargement) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#FAF6EE" }}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "#1B2A4A", borderTopColor: "transparent" }} />
          <p className="font-serif text-lg" style={{ color: "#1B2A4A" }}>Connexion à la base de données...</p>
          {erreurChargement && (
            <p className="mt-2 max-w-sm text-[13px]" style={{ color: "#8A2E2E" }}>
              {erreurChargement}
            </p>
          )}
        </div>
      </div>
    );
  }

  const contexteEcole = {
    ecole, setEcole, classes, setClasses,
    codes, setCodes, anneeScolaire, setAnneeScolaire,
    fraisTypes, setFraisTypes, matieresParClasse, setMatieresParClasse,
    emploiDuTemps, setEmploiDuTemps,
    messagesInternes, setMessagesInternes, anneesArchivees, setAnneesArchivees,
    messagesParents, setMessagesParents,
    annonces, setAnnonces,
    depenses, setDepenses,
  };

  const entrer = (roleChoisi, extra) => {
    // Refuser l'entrée si plateforme fermée (sauf fondateur)
    if (roleChoisi !== "fondateur" && !lirePlateformeActive()) {
      try {
        window.alert(lireMessageMaintenance() || "La plateforme est temporairement fermée par le Fondateur.");
      } catch (e) {}
      return;
    }
    // Entrée dans un espace : pas d'écran « Connexion base » (données déjà en mémoire)
    roleRef.current = roleChoisi;
    setRole(roleChoisi);
    if (roleChoisi === "parent") setEleveIdActif(extra);
    if (roleChoisi === "enseignant" && extra) setClasseEnseignantActive(extra);
    setChargement(false);
    // Rafraîchissement discret en arrière-plan (sans bloquer l'écran)
    try {
      if (typeof rechargerBaseRef.current === "function") {
        // Ne pas couper pretPourSync brutalement : recharger sans spinner plein écran
        sourceRemoteRef.current = true;
        chargerToutesLesDonnees()
          .then((d) => { try { appliquerDepuisBase(d); } catch (e) {} })
          .catch(() => {})
          .finally(() => {
            try { sourceRemoteRef.current = false; setChargement(false); } catch (e) {}
          });
      }
    } catch (e) {
      setChargement(false);
    }
  };

  if (vue === "inscription") {
    return (
      <EcoleContext.Provider value={contexteEcole}>
        <InscriptionEnLigne
          onRetour={() => setVue("connexion")}
          onSoumettre={async (demande) => {
            if (SUPABASE_CONFIGURE) await insererDemandePublique(demande);
            setDemandes((prev) => [demande, ...prev]);
          }}
        />
      </EcoleContext.Provider>
    );
  }

  if (!role) {
    return (
      <EcoleContext.Provider value={contexteEcole}>
        <Connexion onEntrer={entrer} onInscription={() => setVue("inscription")} eleves={eleves} setEleves={setEleves} annonces={annonces} rolesBloques={lireRolesBloques()} />
      </EcoleContext.Provider>
    );
  }

  const sortir = async () => {
    // Retour accueil SANS recharger toute la page ni réafficher « Connexion à la base… »
    try { flushElevesRef.current(); } catch (e) {}
    try {
      await Promise.race([
        deconnexionServeur(),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch (e) {
      console.warn("sortir", e);
    }
    try { __cspSession = null; } catch (e) {}
    // On garde basePrete = true et les données déjà chargées (annonces, école, etc.)
    try {
      roleRef.current = null;
      setRole(null);
      setEleveIdActif(null);
      setClasseEnseignantActive(null);
      setChargement(false);
    } catch (e) {}
  };

  const Ecran = {
    fondateur: (
      <EspaceFondateur demandes={demandes} setDemandes={setDemandes} eleves={eleves} personnel={personnel} setPersonnel={setPersonnel} annonces={annonces} setAnnonces={setAnnonces} setEleves={setEleves} ecole={ecole} setEcole={setEcole} classes={classes} setClasses={setClasses} fraisTypes={fraisTypes} setFraisTypes={setFraisTypes} anneeScolaire={anneeScolaire} setAnneeScolaire={setAnneeScolaire} codes={codes} setCodes={setCodes} matieresParClasse={matieresParClasse} setMatieresParClasse={setMatieresParClasse} onQuitter={sortir} />
    ),
    directeur: (
      <EspaceDirecteur
        eleves={eleves}
        personnel={personnel}
        setPersonnel={setPersonnel}
        annonces={annonces}
        setAnnonces={setAnnonces}
        demandes={demandes}
        setDemandes={setDemandes}
        setEleves={setEleves}
        ecole={ecole}
        setEcole={setEcole}
        classes={classes}
        setClasses={setClasses}
        fraisTypes={fraisTypes}
        setFraisTypes={setFraisTypes}
        anneeScolaire={anneeScolaire}
        setAnneeScolaire={setAnneeScolaire}
        codes={codes}
        setCodes={setCodes}
        matieresParClasse={matieresParClasse}
        setMatieresParClasse={setMatieresParClasse}
        onQuitter={sortir}
      />
    ),
    enseignant: <EspaceEnseignant eleves={eleves} setEleves={setEleves} annonces={annonces} classeAssignee={classeEnseignantActive} onQuitter={sortir} />,
    secretaire: (
      <EspaceSecretaire
        eleves={eleves}
        setEleves={setEleves}
        demandes={demandes}
        setDemandes={setDemandes}
        annonces={annonces}
        setAnnonces={setAnnonces}
        onQuitter={sortir}
      />
    ),
    parent: <EspaceParent eleves={eleves} setEleves={setEleves} eleveId={eleveIdActif} personnel={personnel} annonces={annonces} onQuitter={sortir} />,
  }[role];

  return (
    <EcoleContext.Provider value={contexteEcole}>
      <div>
        {erreurSync && (
          <div className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between gap-2 px-4 py-2 text-[13px]"
               style={{ background: "#8A2E2E", color: "#FFFFFF" }}>
            <span>⚠ Échec de sauvegarde vers la base de données : {erreurSync}</span>
            <button onClick={() => setErreurSync(null)} className="shrink-0 underline">Fermer</button>
          </div>
        )}
        <div className="fixed bottom-4 right-4 z-20">
          <button onClick={sortir}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] shadow-md"
                  style={{ background: "#1B2A4A", color: "#FAF6EE" }}>
            <LogOut size={12} /> Changer de rôle
          </button>
        </div>
        {Ecran}
      </div>
    </EcoleContext.Provider>
  );
}
