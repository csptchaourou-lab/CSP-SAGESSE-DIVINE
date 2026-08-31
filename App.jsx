
import React, { useState, useMemo, useContext, createContext, useRef, useEffect } from "react";
import {
  School, Users, GraduationCap, Wallet, MessageSquare, Megaphone,
  LayoutDashboard, UserCircle2, ClipboardList, CalendarClock,
  ChevronRight, Plus, Pencil, Trash2, Send, Stamp, BadgeCheck,
  LogOut, ShieldCheck, KeyRound, Bell, CircleUserRound,
  FileText, Inbox, CheckCircle2, XCircle, ArrowLeft, RefreshCw, Settings
} from "lucide-react";

const SUPABASE_URL = "https://skzllfgegrzqbglinepy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNremxsZmdlZ3J6cWJnbGluZXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjkzNjMsImV4cCI6MjEwMzQwNTM2M30.FA-ZxnJ1HH1kcoGPG4f9OsfQ7WfAGsqnLsu7xlAD0OU";

async function pgFetch(chemin, options = {}) {
  const reponse = await fetch(`${SUPABASE_URL}/rest/v1${chemin}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
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
const pgSelect = (table, requete = "") => pgFetch(`/${table}?select=*${requete}`, { method: "GET" });
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
  return pgFetch(`/${table}`, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(lignes) });
};
const pgDeleteIn = (table, colonne, valeurs) => {
  if (!valeurs || valeurs.length === 0) return Promise.resolve();
  const liste = valeurs.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(",");
  return pgFetch(`/${table}?${colonne}=in.(${liste})`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
};
const pgDeleteToutes = (table, colonneCle) => pgFetch(`/${table}?${colonneCle}=not.is.null`, { method: "DELETE", headers: { Prefer: "return=minimal" } });

const LOGO_CSP_BASE64 = "";
const ECOLE_INIT = { nom: "Complexe Scolaire Protestant", sigle: "CSP « Sagesse Divine »", quartier: "Kèra", commune: "Tchaourou", departement: "Borgou", directeur: "Past. A. S. Boko", telephone: "97 00 00 00", telephoneDirecteur: "97 11 22 33", email: "contact@csp-sagessedivine.bj", devise: "Excellence Réelle", logoUrl: LOGO_CSP_BASE64 };
const CLASSES_INIT = ["Maternelle 1", "Maternelle 2", "CI", "CP", "CE1", "CE2", "CM1", "CM2", "Kponjè"];
const CODES_INIT = { directeur: "1234", enseignant: "5678", secretaire: "9012" };
const CODES_CLASSES_INIT = {
  "Maternelle 1": "1001",
  "Maternelle 2": "1002",
  "CI": "1003",
  "CP": "1004",
  "CE1": "1005",
  "CE2": "1006",
  "CM1": "1111",
  "CM2": "2222",
  "Kponjè": "3333"
};
const ANNEE_INIT = "2026-2027";
const FRAIS_TYPES_INIT = [{ libelle: "Inscription", montant: 25000 }, { libelle: "Écolage", montant: 90000 }, { libelle: "Cantine", montant: 20000 }, { libelle: "T-shirt", montant: 5000 }, { libelle: "Uniforme", montant: 15000 }];
const EcoleContext = createContext(null);
function useEcole() { return useContext(EcoleContext); }
const MATIERES_INIT = [{ nom: "Communication orale", coef: 1 }, { nom: "Expression écrite", coef: 2 }, { nom: "Lecture", coef: 2 }, { nom: "Dictée", coef: 1 }, { nom: "EST", coef: 1 }];
const MATIERES_PAR_CLASSE_INIT = { CM1: MATIERES_INIT, CM2: MATIERES_INIT, CE2: MATIERES_INIT, CE1: MATIERES_INIT, CP: MATIERES_INIT, CI: MATIERES_INIT, "Kponjè": MATIERES_INIT };
// NETTOYAGE DOUBLONS
function dedupFraisParLibelle(a){const m=new Map();(a||[]).forEach(f=>{const k=(f.libelle||'').trim();if(!k)return;if(!m.has(k))m.set(k,{...f});});return Array.from(m.values());}
function dedupMatieresParNom(a){const s=new Set();const r=[];(a||[]).forEach(m=>{const k=(m.nom||'').toLowerCase().trim();if(!k||s.has(k))return;s.add(k);r.push(m);});return r;}
const SEUILS_MENTION = [{ max: 5, mention: "Médiocre" }, { max: 9, mention: "Insuffisant" }, { max: 11, mention: "Passable" }, { max: 13, mention: "Assez Bien" }, { max: 15, mention: "Bien" }, { max: 18, mention: "Très Bien" }, { max: 20, mention: "Excellent" }];
function mentionPour(moyenne) { const seuil = SEUILS_MENTION.find((s) => moyenne <= s.max); return seuil ? seuil.mention : "Excellent"; }
function ageDepuis(dateNaissance) { if (!dateNaissance) return null; const naissance = new Date(dateNaissance); if (isNaN(naissance)) return null; const aujourdhui = new Date(); let age = aujourdhui.getFullYear() - naissance.getFullYear(); const pasEncoreAnniversaire = aujourdhui.getMonth() < naissance.getMonth() || (aujourdhui.getMonth() === naissance.getMonth() && aujourdhui.getDate() < naissance.getDate()); if (pasEncoreAnniversaire) age -= 1; return age >= 0 ? age : null; }
function formatDateFr() { const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]; const d = new Date(); return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`; }
function genererCodeEleve() { const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let suffixe = ""; for (let i = 0; i < 4; i++) { suffixe += caracteres[Math.floor(Math.random() * caracteres.length)]; } return `CSP${suffixe}`; }
const ELEVES_INIT = [];
const PERSONNEL_INIT = [{ nom: "Past. A. S. Boko", poste: "Directeur", telephone: "97 11 22 33", classe: "—" }, { nom: "Mme Houssou", poste: "Enseignante", telephone: "96 22 33 44", classe: "CM1" }, { nom: "Mlle Dossou", poste: "Secrétaire", telephone: "95 33 44 55", classe: "—" }];
const DEMANDES_INIT = [];
const ANNONCES_INIT = [{ titre: "Congés de Noël", texte: "Les congés de Noël débutent le 20 décembre.", date: "24 août 2026" }];
const ROLES = [{ id: "directeur", label: "Espace Administratif", icon: ShieldCheck, desc: "Vue d'ensemble et administration" }, { id: "enseignant", label: "Enseignant", icon: GraduationCap, desc: "Notes et absences de sa classe" }, { id: "secretaire", label: "Secrétaire", icon: ClipboardList, desc: "Inscriptions et frais scolaires" }, { id: "parent", label: "Espace Parent", icon: CircleUserRound, desc: "Suivi de mon enfant" }];
function Embleme({ logoUrl, taille = 56, iconTaille = 26 }) { if (logoUrl) { return (<img src={logoUrl} alt="Logo" className="rounded-full object-cover" style={{ width: taille, height: taille, background: "#1B2A4A" }} onError={(e) => { e.target.style.display = "none"; }} />); } return (<div className="flex items-center justify-center rounded-full" style={{ width: taille, height: taille, background: "#1B2A4A" }}><School size={iconTaille} color="#C9A227" /></div>); }
function Cachet() { return (<div className="pointer-events-none absolute -right-3 -top-3 rotate-12 opacity-90"><div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-dashed" style={{ borderColor: "#C9A227", color: "#C9A227" }}><Stamp size={22} /></div></div>); }
function Badge({ children, tone = "or" }) { const tones = { or: { bg: "#FBF0D2", fg: "#8A6D14", ring: "#C9A227" }, vert: { bg: "#E4EEE3", fg: "#2F5233", ring: "#2F5233" }, ardoise: { bg: "#E6EAF2", fg: "#1B2A4A", ring: "#1B2A4A" } }; const t = tones[tone]; return (<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-semibold" style={{ background: t.bg, color: t.fg, boxShadow: `inset 0 0 0 1px ${t.ring}33` }}>{children}</span>); }
function Panel({ title, icon: Icon, actions, children }) { return (<div className="rounded-2xl border bg-white/80 shadow-sm" style={{ borderColor: "#E7DEC8" }}><div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "#EFE7D4" }}><div className="flex items-center gap-2">{Icon && <Icon size={17} style={{ color: "#1B2A4A" }} />}<h3 className="font-serif text-[15px] tracking-wide" style={{ color: "#1B2A4A" }}>{title}</h3></div>{actions}</div><div className="p-5">{children}</div></div>); }
function Stat({ label, value, tone }) { const tones = { ardoise: "#1B2A4A", or: "#8A6D14", vert: "#2F5233" }; return (<div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm ring-1" style={{ ringColor: "#EFE7D4" }}><div className="text-[12px] uppercase tracking-wider" style={{ color: "#9A8B67" }}>{label}</div><div className="font-serif text-2xl" style={{ color: tones[tone] || "#1B2A4A" }}>{value}</div></div>); }
function Btn({ children, onClick, variant = "primary", icon: Icon, small }) { const base = "inline-flex items-center gap-1.5 rounded-lg font-medium transition"; const size = small ? "px-2.5 py-1 text-[13px]" : "px-3.5 py-2 text-[15px]"; const styles = { primary: { background: "#1B2A4A", color: "#FAF6EE" }, gold: { background: "#C9A227", color: "#2B2118" }, ghost: { background: "transparent", color: "#1B2A4A", boxShadow: "inset 0 0 0 1px #1B2A4A55" }, danger: { background: "transparent", color: "#8A2E2E", boxShadow: "inset 0 0 0 1px #8A2E2E55" } }; return (<button onClick={onClick} className={`${base} ${size} hover:opacity-90 active:scale-[0.98]`} style={styles[variant]}>{Icon && <Icon size={small ? 13 : 15} />}{children}</button>); }
function Connexion({ onEntrer, onInscription, eleves }) {
  const [choix, setChoix] = useState(null); const [code, setCode] = useState(""); const [erreur, setErreur] = useState(""); const { ecole, codes, codesClasses } = useEcole(); const zoneCodeRef = useRef(null);
  useEffect(() => { if (choix && zoneCodeRef.current) { zoneCodeRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); } }, [choix]);
  const valider = () => {
    const saisie = code.trim(); if (!saisie) { setErreur("Merci de saisir ton code d'accès."); return; }
    if (choix === "parent") { const enfant = eleves.find((e) => e.id.toLowerCase() === saisie.toLowerCase()); if (!enfant) { setErreur("Ce code élève est introuvable. Vérifie-le auprès du secrétariat."); return; } setErreur(""); onEntrer("parent", enfant.id); return; }
    if (saisie === codes[choix]) { setErreur(""); onEntrer(choix); return; }
    const entryClasse = Object.entries(codesClasses || {}).find(([cls, c]) => String(c).trim() === saisie);
    if (entryClasse) { setErreur(""); onEntrer("enseignant", entryClasse[0]); return; }
    setErreur("Code incorrect."); return;
  };
  return (
    <div className="min-h-screen w-full" style={{ background: "#FAF6EE" }}>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-12 sm:justify-center sm:py-16">
        <div className="mb-8 mt-4 text-center sm:mb-10 sm:mt-0">
          <div className="mx-auto mb-4"><Embleme logoUrl={ecole.logoUrl} taille={56} iconTaille={26} /></div>
          <p className="text-[13px] uppercase tracking-[0.2em]" style={{ color: "#9A8B67" }}>École Connectée</p>
          <h1 className="mt-1 font-serif text-3xl" style={{ color: "#1B2A4A" }}>{ecole.nom}</h1>
          <p className="font-serif text-lg italic" style={{ color: "#8A6D14" }}>{ecole.sigle}</p>
          <p className="mt-1 text-[15px]" style={{ color: "#5C5240" }}>{ecole.quartier} — {ecole.commune}, {ecole.departement}</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {ROLES.map((r) => { const Icon = r.icon; const actif = choix === r.id; return (<button key={r.id} onClick={() => { setChoix(r.id); setCode(""); setErreur(""); }} className="group relative overflow-hidden rounded-2xl border p-5 text-left transition" style={{ borderColor: actif ? "#C9A227" : "#E7DEC8", background: actif ? "#FFFDF6" : "#FFFFFFAA", boxShadow: actif ? "0 0 0 2px #C9A22755" : "none" }}>{actif && <Cachet />}<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#1B2A4A" }}><Icon size={18} color="#C9A227" /></div><div className="font-serif text-lg" style={{ color: "#1B2A4A" }}>{r.label}</div><div className="mt-0.5 text-[15px]" style={{ color: "#5C5240" }}>{r.desc}</div></button>); })}
        </div>
        {choix && (<div ref={zoneCodeRef} className="mt-6 w-full max-w-md scroll-mt-8"><div className="flex items-center gap-2 rounded-xl border bg-white/80 px-4 py-3" style={{ borderColor: erreur ? "#8A2E2E" : "#E7DEC8" }}><KeyRound size={16} style={{ color: "#9A8B67" }} /><input autoFocus value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") valider(); }} placeholder={choix === "parent" ? "Code élève (ex. CSP0142)" : "Code d'accès"} className="w-full bg-transparent text-[15px] outline-none" style={{ color: "#2B2118" }} /><Btn variant="gold" onClick={valider}>Entrer<ChevronRight size={14} /></Btn></div>{erreur && <p className="mt-1.5 px-1 text-[13px]" style={{ color: "#8A2E2E" }}>{erreur}</p>}</div>)}
        <div className="mt-8 flex flex-col items-center gap-3"><button onClick={onInscription} className="flex items-center gap-2 rounded-full border px-4 py-2 text-[15px] font-medium transition hover:opacity-80" style={{ borderColor: "#C9A227", color: "#8A6D14", background: "#FFFDF6" }}><FileText size={14} />Inscrire mon enfant en ligne</button></div>
      </div>
    </div>
  );
}
function InscriptionEnLigne({ onRetour, onSoumettre }) {
  const { ecole, classes } = useEcole(); const [envoye, setEnvoye] = useState(false); const [form, setForm] = useState({ prenom: "", nom: "", sexe: "", naissance: "", classeSouhaitee: classes[0], parrainNom: "", parrainTelephone: "", message: "" });
  const champ = (cle) => (e) => setForm({ ...form, [cle]: e.target.value }); const age = useMemo(() => ageDepuis(form.naissance), [form.naissance]); const valide = form.prenom.trim() && form.nom.trim() && form.sexe && form.naissance && form.parrainNom.trim() && form.parrainTelephone.trim();
  const soumettre = () => { if (!valide) return; onSoumettre({ id: `DEM-${Math.floor(1000 + Math.random() * 9000)}`, ...form, age, origine: "en_ligne", date: "aujourd'hui", statut: "en_attente" }); setEnvoye(true); };
  if (envoye) { return (<div className="flex min-h-screen items-center justify-center px-6" style={{ background: "#FAF6EE" }}><div className="max-w-md rounded-2xl border bg-white/80 p-8 text-center shadow-sm" style={{ borderColor: "#E7DEC8" }}><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "#E4EEE3" }}><CheckCircle2 size={26} style={{ color: "#2F5233" }} /></div><h2 className="font-serif text-xl" style={{ color: "#1B2A4A" }}>Demande envoyée</h2><p className="mt-2 text-[15px]" style={{ color: "#5C5240" }}>La demande a bien été transmise.</p><div className="mt-6"><Btn variant="primary" icon={ArrowLeft} onClick={onRetour}>Retour à l'accueil</Btn></div></div></div>); }
  return (<div className="min-h-screen w-full" style={{ background: "#FAF6EE" }}><div className="mx-auto max-w-2xl px-6 py-12"><button onClick={onRetour} className="mb-6 flex items-center gap-1.5 text-[15px]" style={{ color: "#8A6D14" }}><ArrowLeft size={14} /> Retour</button><div className="mb-6 text-center"><p className="text-[13px] uppercase tracking-[0.2em]" style={{ color: "#9A8B67" }}>Inscription en ligne</p><h1 className="mt-1 font-serif text-2xl" style={{ color: "#1B2A4A" }}>{ecole.sigle}</h1></div><Panel title="Informations de l'enfant" icon={FileText}><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Champ label="Prénom" value={form.prenom} onChange={champ("prenom")} /><Champ label="Nom" value={form.nom} onChange={champ("nom")} /><div><label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Sexe</label><div className="flex gap-2">{[{ v: "F", l: "Féminin" }, { v: "M", l: "Masculin" }].map((opt) => (<button key={opt.v} type="button" onClick={() => setForm({ ...form, sexe: opt.v })} className="flex-1 rounded-lg border px-3 py-2 text-[15px] transition" style={{ borderColor: form.sexe === opt.v ? "#C9A227" : "#E7DEC8", background: form.sexe === opt.v ? "#FBF0D2" : "transparent", color: form.sexe === opt.v ? "#8A6D14" : "#5C5240", fontWeight: form.sexe === opt.v ? 600 : 400 }}>{opt.l}</button>))}</div></div><div><label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Date de naissance</label><div className="flex items-center gap-2"><input type="date" value={form.naissance} onChange={champ("naissance")} className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{ borderColor: "#E7DEC8" }} />{age !== null && <Badge tone="ardoise">{age} ans</Badge>}</div></div><div><label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe souhaitée</label><select value={form.classeSouhaitee} onChange={champ("classeSouhaitee")} className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{ borderColor: "#E7DEC8" }}>{classes.map((c) => <option key={c} value={c}>{c}</option>)}</select></div></div></Panel><div className="h-4" /><Panel title="Coordonnées du parrain" icon={UserCircle2}><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Champ label="Nom du parrain" value={form.parrainNom} onChange={champ("parrainNom")} /><Champ label="Numéro du parrain" value={form.parrainTelephone} onChange={champ("parrainTelephone")} placeholder="9x xx xx xx" /></div><div className="mt-3"><label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Message (optionnel)</label><textarea value={form.message} onChange={champ("message")} rows={3} className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{ borderColor: "#E7DEC8" }} placeholder="Précision..." /></div></Panel><div className="mt-5 flex items-center justify-between"><div className="ml-auto"><Btn variant="gold" icon={Send} onClick={soumettre}>Soumettre</Btn></div></div></div></div>);
}
function Champ({ label, value, onChange, placeholder }) { return (<div><label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>{label}</label><input value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{ borderColor: "#E7DEC8" }} /></div>); }
function Coquille({ role, roleLabel, onQuitter, children, nav, actif, setActif }) {
  const { ecole } = useEcole();
  return (<div className="min-h-screen w-full" style={{ background: "#FAF6EE" }}><header className="sticky top-0 z-10 border-b backdrop-blur" style={{ borderColor: "#E7DEC8", background: "#FAF6EEEE" }}><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-2.5"><div className="shrink-0"><Embleme logoUrl={ecole.logoUrl} taille={32} iconTaille={15} /></div><div className="min-w-0"><div className="truncate font-serif text-[15px] leading-none" style={{ color: "#1B2A4A" }}>{ecole.sigle}</div><div className="text-[12px]" style={{ color: "#9A8B67" }}>{ecole.commune}</div></div></div><div className="flex shrink-0 items-center gap-3"><Badge tone="ardoise"><UserCircle2 size={12} /><span className="max-w-[38vw] truncate sm:max-w-none">{roleLabel}</span></Badge><button onClick={onQuitter} className="flex shrink-0 items-center gap-1 text-[13px]" style={{ color: "#8A2E2E" }}><LogOut size={13} /> Quitter</button></div></div></header><div className="sticky top-[57px] z-10 border-b sm:hidden" style={{ borderColor: "#E7DEC8", background: "#FAF6EEEE" }}><div className="flex gap-1.5 overflow-x-auto px-4 py-2" style={{ WebkitOverflowScrolling: "touch" }}>{nav.map((n) => { const Icon = n.icon; const isActif = actif === n.id; return (<button key={n.id} onClick={() => setActif(n.id)} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition" style={{ background: isActif ? "#1B2A4A" : "transparent", color: isActif ? "#FAF6EE" : "#3E3625", boxShadow: isActif ? "none" : "inset 0 0 0 1px #E7DEC8" }}><Icon size={13} />{n.label}</button>); })}</div></div><div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 sm:flex-row sm:px-6 sm:py-6"><nav className="hidden w-52 shrink-0 sm:block"><div className="sticky top-20 space-y-1">{nav.map((n) => { const Icon = n.icon; const isActif = actif === n.id; return (<button key={n.id} onClick={() => setActif(n.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[15px] transition" style={{ background: isActif ? "#1B2A4A" : "transparent", color: isActif ? "#FAF6EE" : "#3E3625" }}><Icon size={15} />{n.label}</button>); })}</div></nav><main className="min-w-0 flex-1 space-y-5 pb-16 sm:pb-0">{children}</main></div></div>);
}

// ===== ESPACE ENSEIGNANT CORRIGE - FILTRE ROBUSTE =====

function EspaceEnseignant({ eleves, setEleves, classeInitiale }) {
  const { matieresParClasse, setMatieresParClasse, annonces, fraisTypes, messagesInternes, classes, personnel } = useEcole();
  const [onglet, setOnglet] = useState("classe");
  const [enseignantActif, setEnseignantActif] = useState(null);
  const [classeChoisie, setClasseChoisie] = useState(classeInitiale||"CM1");
  useEffect(()=>{ if(classeInitiale) setClasseChoisie(classeInitiale); }, [classeInitiale]);
  
  const enseignants = (personnel||[]).filter(p=> (p.poste||"").toLowerCase().includes("enseign"));
  const maClasse = enseignantActif ? (enseignantActif.classe||classeChoisie||"CM1") : (classeChoisie||classeInitiale||"CM1");
  
  const mesEleves = eleves.filter((e) => (e.classe || "").toString().trim().toUpperCase() === maClasse.toUpperCase());
  const matieresBrutes = matieresParClasse[maClasse] || matieresParClasse[maClasse.toUpperCase()] || matieresParClasse["CM1"] || []; const matieres = dedupMatieresParNom(matieresBrutes);
  const [nouvelleNote, setNouvelleNote] = useState({});
  const [saisieRapide, setSaisieRapide] = useState({});
  const [confirmation, setConfirmation] = useState(null);
  const champNouvelleNote = (eleveId, cle, valeur) => { setNouvelleNote((prev) => ({ ...prev, [eleveId]: { evaluation: "Évaluation 2", mois: "Septembre", ...prev[eleveId], [cle]: valeur } })); };
  const champSaisieRapide = (eleveId, matiere, valeur) => { setSaisieRapide((prev) => ({ ...prev, [eleveId]: { ...(prev[eleveId] || {}), [matiere]: valeur } })); };
  const enregistrerNotesMatieres = (eleveId, nomEleve) => {
    const session = nouvelleNote[eleveId] || { evaluation: "Évaluation 2", mois: "Septembre" };
    const valeurs = saisieRapide[eleveId] || {};
    const aRemplir = Object.entries(valeurs).filter(([, v]) => v !== "" && !isNaN(parseFloat(v)));
    if (aRemplir.length === 0) return;
    const dateSaisie = formatDateFr();
    setEleves((prev) => prev.map((el) => el.id === eleveId ? { ...el, notes: [...el.notes, ...aRemplir.map(([matiere, v]) => ({ evaluation: session.evaluation, mois: session.mois, matiere, note20: parseFloat(v), dateSaisie }))] } : el));
    setSaisieRapide((prev) => ({ ...prev, [eleveId]: {} }));
    setConfirmation(`${aRemplir.length} note(s) pour ${nomEleve}`);
  };
  const [appreciationSaisie, setAppreciationSaisie] = useState({});
  const envoyerAppreciation = (eleveId, nomEleve) => { const texte = (appreciationSaisie[eleveId] || "").trim(); if (!texte) return; setEleves((prev) => prev.map((el) => el.id === eleveId ? { ...el, messages: [...el.messages, { auteur: enseignantActif? enseignantActif.nom : "Enseignant(e) "+maClasse, texte, date: "aujourd'hui" }] } : el)); setAppreciationSaisie((prev) => ({ ...prev, [eleveId]: "" })); setConfirmation(`Appréciation envoyée à ${nomEleve}`); };
  const corrigerNote = (eleveId, index, val, nomEleve) => { if (val === "") return; const nb = parseFloat(val); if (isNaN(nb)) return; setEleves((prev) => prev.map((el) => el.id === eleveId ? { ...el, notes: el.notes.map((n, i) => i === index ? { ...n, note20: nb, dateSaisie: formatDateFr() } : n) } : el)); setConfirmation(`Note corrigée pour ${nomEleve}`); };
  const supprimerNote = (eleveId, index) => { setEleves((prev) => prev.map((el) => el.id === eleveId ? { ...el, notes: el.notes.filter((_, i) => i !== index) } : el)); };
  const [nouvelleMatiere, setNouvelleMatiere] = useState({ nom: "", coef: 1 });
  const ajouterMatiere = () => { if (!nouvelleMatiere.nom.trim()) return; setMatieresParClasse((prev) => ({ ...prev, [maClasse]: [...(prev[maClasse] || []), { nom: nouvelleMatiere.nom.trim(), coef: Number(nouvelleMatiere.coef) || 1 }] })); setNouvelleMatiere({ nom: "", coef: 1 }); };
  const modifierMatiere = (index, cle, valeur) => { setMatieresParClasse((prev) => ({ ...prev, [maClasse]: (prev[maClasse] || []).map((m, i) => i === index ? { ...m, [cle]: cle === "coef" ? Number(valeur) || 1 : valeur } : m) })); };
  const supprimerMatiere = (index) => { setMatieresParClasse((prev) => ({ ...prev, [maClasse]: (prev[maClasse] || []).filter((_, i) => i !== index) })); };
  const TYPES_ABSENCE = ["Absence", "Retard", "Permissionnaire", "Malade", "Sans motif"];
  const [nouvelleAbsence, setNouvelleAbsence] = useState({});
  const champNouvelleAbsence = (eleveId, cle, valeur) => { setNouvelleAbsence((prev) => ({ ...prev, [eleveId]: { type: "Absence", motif: "", date: formatDateFr(), ...prev[eleveId], [cle]: valeur } })); };
  const ajouterAbsence = (eleveId, nomEleve) => { const a = nouvelleAbsence[eleveId]; if (!a || !a.type) return; setEleves((prev) => prev.map((el) => el.id === eleveId ? { ...el, absences: [...el.absences, { date: a.date||formatDateFr(), type: a.type, motif: a.motif||"" }] } : el)); setNouvelleAbsence((prev)=>({ ...prev, [eleveId]: { type: "Absence", motif: "", date: formatDateFr() } })); setConfirmation(`Absence ajoutée pour ${nomEleve}`); };

  const nav = [{ id: "classe", label: "Ma classe", icon: Users }, { id: "notes", label: "Notes & corrections", icon: ClipboardList }, { id: "absences", label: "Absences", icon: CalendarClock }, { id: "matieres", label: "Matières", icon: FileText }, { id: "annonces", label: "Annonces & messages", icon: Megaphone }];

  if(!enseignantActif && !classeInitiale){
    return (
      <Coquille role="enseignant" roleLabel="Enseignant - Choisis ton identité" nav={nav} actif={onglet} setActif={setOnglet} onQuitter={() => {}}>
        <Panel title="Qui es-tu ? Sélectionne ton nom pour aller dans ta classe" icon={GraduationCap}>
          <p className="mb-3 text-[13px]" style={{color:"#9A8B67"}}>Le directeur a créé les enseignants dans Personnel. Choisis ton nom, tu iras direct dans ta classe. Ou tape directement le code de ta classe (ex: 1111 pour CM1).</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {enseignants.length===0 && <p style={{color:"#9A8B67"}}>Aucun enseignant créé. Va dans Espace Administratif > Personnel.</p>}
            {enseignants.map((ens,i)=>(
              <button key={i} onClick={()=>{ setEnseignantActif(ens); setClasseChoisie(ens.classe||"CM1"); }} className="rounded-xl border p-4 text-left hover:shadow-md transition" style={{borderColor:"#E7DEC8", background:"white"}}>
                <div className="font-medium" style={{color:"#1B2A4A"}}>{ens.nom}</div>
                <div className="text-[13px]" style={{color:"#5C5240"}}>Classe: <b>{ens.classe}</b> - {ens.poste}</div>
                <div className="text-[12px]" style={{color:"#9A8B67"}}>{ens.telephone}</div>
                <div className="mt-2"><Badge tone="or">Entrer dans {ens.classe}</Badge></div>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-lg p-3" style={{background:"#F1ECDD"}}>
            <div className="text-[13px] font-medium" style={{color:"#5C5240"}}>Ou choisis directement une classe :</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {classes.map(c=><button key={c} onClick={()=>{ setClasseChoisie(c); setEnseignantActif({nom:"Enseignant invité", classe:c, poste:"Enseignant"}); }} className="rounded-full px-3 py-1 text-[13px] border" style={{background: classeChoisie===c?"#1B2A4A":"white", color: classeChoisie===c?"#FAF6EE":"#1B2A4A", borderColor:"#E7DEC8"}}>{c}</button>)}
            </div>
          </div>
        </Panel>
      </Coquille>
    );
  }

  return (
    <Coquille role="enseignant" roleLabel={`Enseignant: ${enseignantActif? enseignantActif.nom : "Classe "+maClasse} - Classe ${maClasse}`} nav={nav} actif={onglet} setActif={setOnglet} onQuitter={() => {}}>
      {confirmation && <div className="mb-3 rounded-lg px-4 py-2 text-[13px] flex justify-between" style={{background:"#E6F4EA", color:"#2F5233"}}><span>{confirmation}</span><button onClick={()=>setConfirmation(null)} className="underline">Fermer</button></div>}
      <div className="mb-3 flex justify-between items-center">
        <div className="text-[13px]" style={{color:"#5C5240"}}>Connecté: <b>{enseignantActif? enseignantActif.nom : "Enseignant "+maClasse}</b> - Classe <b>{maClasse}</b> - {mesEleves.length} élèves {classeInitiale? `(Code direct: ${classeInitiale})`:""}</div>
        <Btn small variant="ghost" onClick={()=>{ setEnseignantActif(null); }}>Changer classe</Btn>
      </div>
      {onglet === "classe" && (<Panel title={`Classe ${maClasse} - ${mesEleves.length} élève(s)`} icon={Users}><div className="space-y-3">{mesEleves.length===0 && <p style={{color:"#9A8B67"}}>Aucun élève dans {maClasse}.</p>}{mesEleves.map((e)=> (<div key={e.id} className="rounded-xl border p-3 flex justify-between" style={{borderColor:"#E7DEC8"}}><div><div className="font-medium">{e.prenom} {e.nom} - {e.id}</div><div className="text-[12px]" style={{color:"#9A8B67"}}>Parrain: {e.parent?.nom} - {e.parent?.telephone}</div></div><Badge>{e.classe}</Badge></div>))}</div></Panel>)}
      {onglet === "notes" && (<Panel title={`Notes - Classe ${maClasse}`} icon={ClipboardList}><div className="space-y-4">{matieres.length===0 && <p style={{color:"#9A8B67"}}>Aucune matière pour {maClasse}.</p>}{mesEleves.map((e)=> { const nn = nouvelleNote[e.id] || {}; const sr = saisieRapide[e.id] || {}; return (<div key={e.id} className="rounded-xl border p-4" style={{borderColor:"#E7DEC8"}}><div className="flex justify-between"><div className="font-medium">{e.prenom} {e.nom} - {e.id}</div><Badge>{e.notes.length} notes</Badge></div><div className="mt-3 grid grid-cols-2 gap-2"><div><label className="text-[12px]">Évaluation</label><select value={nn.evaluation||"Évaluation 2"} onChange={(ev)=>champNouvelleNote(e.id,"evaluation",ev.target.value)} className="w-full rounded border px-2 py-1 text-[13px]"><option>Évaluation 1</option><option>Évaluation 2</option><option>Devoir</option><option>Composition</option></select></div><div><label className="text-[12px]">Mois</label><select value={nn.mois||"Septembre"} onChange={(ev)=>champNouvelleNote(e.id,"mois",ev.target.value)} className="w-full rounded border px-2 py-1 text-[13px]"><option>Septembre</option><option>Octobre</option><option>Novembre</option><option>Décembre</option><option>Janvier</option><option>Février</option><option>Mars</option><option>Avril</option><option>Mai</option><option>Juin</option></select></div></div><div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">{matieres.map((m)=> (<div key={m.nom}><label className="text-[12px]">{m.nom} (coef {m.coef})</label><input value={sr[m.nom]||""} onChange={(ev)=>champSaisieRapide(e.id,m.nom,ev.target.value)} placeholder="/20" className="w-full rounded border px-2 py-1 text-[13px]" /></div>))}</div><div className="mt-3 flex justify-between"><Btn small variant="gold" onClick={()=>enregistrerNotesMatieres(e.id, `${e.prenom} ${e.nom}`)}>Enregistrer notes</Btn></div></div>); })}</div></Panel>)}
      {onglet === "absences" && (<Panel title={`Absences - Classe ${maClasse}`} icon={CalendarClock}><div className="space-y-3">{mesEleves.map((e)=>{ const na = nouvelleAbsence[e.id]||{type:"Absence", motif:"", date:formatDateFr()}; return (<div key={e.id} className="rounded-lg border p-3" style={{borderColor:"#E7DEC8"}}><div className="font-medium text-[14px]">{e.prenom} {e.nom} - {e.id}</div><div className="mt-2 grid grid-cols-3 gap-2"><select value={na.type} onChange={(ev)=>champNouvelleAbsence(e.id,"type",ev.target.value)} className="rounded border px-2 py-1 text-[13px]"><option>Absence</option><option>Retard</option><option>Permissionnaire</option><option>Malade</option><option>Sans motif</option></select><input value={na.motif} onChange={(ev)=>champNouvelleAbsence(e.id,"motif",ev.target.value)} placeholder="Motif" className="rounded border px-2 py-1 text-[13px]" /><input value={na.date} onChange={(ev)=>champNouvelleAbsence(e.id,"date",ev.target.value)} className="rounded border px-2 py-1 text-[13px]" /></div><div className="mt-2"><Btn small variant="ghost" onClick={()=>ajouterAbsence(e.id, `${e.prenom} ${e.nom}`)}>Ajouter absence</Btn></div></div>); })}</div></Panel>)}
      {onglet === "matieres" && (<Panel title={`Matières - Classe ${maClasse}`} icon={FileText}><div className="mb-4 space-y-2">{matieres.map((m, i) => (<div key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}}><input defaultValue={m.nom} onBlur={(e)=>modifierMatiere(i,"nom",e.target.value)} className="flex-1 rounded border px-2 py-1 text-[14px]" /><span className="text-[12px]">Coef</span><input type="number" defaultValue={m.coef} onBlur={(e)=>modifierMatiere(i,"coef",e.target.value)} className="w-12 rounded border text-center" /><Trash2 size={14} className="cursor-pointer" style={{color:"#8A2E2E"}} onClick={()=>supprimerMatiere(i)} /></div>))}</div><div className="flex gap-2 rounded-lg p-3" style={{background:"#F1ECDD"}}><input value={nouvelleMatiere.nom} onChange={(e)=>setNouvelleMatiere({...nouvelleMatiere, nom:e.target.value})} placeholder="Nouvelle matière" className="flex-1 rounded border px-2 py-2 text-[14px]" /><input type="number" min={1} max={5} value={nouvelleMatiere.coef} onChange={(e)=>setNouvelleMatiere({...nouvelleMatiere, coef:e.target.value})} className="w-14 rounded border px-2 py-2 text-center" /><Btn variant="gold" small onClick={ajouterMatiere}>Ajouter</Btn></div></Panel>)}
      {onglet === "annonces" && (<Panel title="Annonces & messages de la direction" icon={Megaphone}><div className="space-y-3">{annonces.map((a,i)=>(<div key={i} className="rounded-lg border px-4 py-3" style={{borderColor:"#E7DEC8"}}><div className="font-medium">{a.titre}</div><p className="text-[14px]">{a.texte}</p><small>{a.date}</small></div>))}</div><div className="mt-6"><div className="font-medium mb-2">Messages internes</div><div className="space-y-2">{messagesInternes.filter(m=> m.destinataire==="tous" || m.destinataire==="enseignant" ).map((m,i)=>(<div key={i} className="rounded-lg border px-3 py-2" style={{borderColor:"#C9A227", background:"#FFFDF6"}}><Badge tone="or">{m.destinataire}</Badge><p className="mt-1 text-[14px]">{m.texte}</p></div>))}</div></div></Panel>)}
    </Coquille>
  );
}


function EspaceSecretaire({ eleves, setEleves, demandes, setDemandes, annonces, setAnnonces }) {
  const { classes, fraisTypes } = useEcole();
  const [onglet, setOnglet] = useState("frais");
  const [confirmationInscription, setConfirmationInscription] = useState(null);
  const [nouvelleAnnonce, setNouvelleAnnonce] = useState("");
  const [form, setForm] = useState({ prenom: "", nom: "", sexe: "", naissance: "", classe: classes[0], parrainNom: "", parrainTelephone: "" });
  const champ = (cle) => (e) => setForm({ ...form, [cle]: e.target.value });
  const age = useMemo(() => ageDepuis(form.naissance), [form.naissance]);
  const valide = form.prenom.trim() && form.nom.trim() && form.sexe && form.naissance && form.parrainNom.trim() && form.parrainTelephone.trim();
  const soumettreInscription = () => { if (!valide) return; setDemandes((prev) => [{ id: `DEM-${Math.floor(1000 + Math.random() * 9000)}`, prenom: form.prenom, nom: form.nom, sexe: form.sexe, naissance: form.naissance, age, classeSouhaitee: form.classe, parrainNom: form.parrainNom, parrainTelephone: form.parrainTelephone, message: "", origine: "secretariat", date: "aujourd'hui", statut: "en_attente" }, ...prev]); setConfirmationInscription(`${form.prenom} ${form.nom}`); setForm({ prenom: "", nom: "", sexe: "", naissance: "", classe: classes[0], parrainNom: "", parrainTelephone: "" }); };
  const [montantsSaisis, setMontantsSaisis] = useState({}); const [modePaiementSaisi, setModePaiementSaisi] = useState({}); const [confirmationPaiement, setConfirmationPaiement] = useState(null);
  const champMontant = (eleveId, libelle, valeur) => { setMontantsSaisis((prev) => ({ ...prev, [eleveId]: { ...(prev[eleveId] || {}), [libelle]: valeur } })); };
  const totalSaisiPour = (eleveId) => { const montants = montantsSaisis[eleveId] || {}; return Object.values(montants).reduce((s, v) => s + (parseFloat(v) || 0), 0); };
  const enregistrerPaiement = (eleve) => { const montants = montantsSaisis[eleve.id] || {}; const mode = modePaiementSaisi[eleve.id] || "Espèces"; const total = totalSaisiPour(eleve.id); if (total <= 0) return; setEleves((prev) => prev.map((e) => e.id === eleve.id ? { ...e, frais: e.frais.length ? e.frais.map((f) => { const ajout = parseFloat(montants[f.libelle]) || 0; if (ajout <= 0) return f; return { ...f, paye: f.paye + ajout, mode, datePaiement: "aujourd'hui" }; }) : fraisTypes.map(ft => ({ libelle: ft.libelle, du: ft.montant, paye: parseFloat(montants[ft.libelle])||0, mode, datePaiement: "aujourd'hui" })) } : e)); setConfirmationPaiement(`${total.toLocaleString("fr-FR")} F pour ${eleve.prenom} ${eleve.nom} (${mode}).`); setMontantsSaisis((prev) => ({ ...prev, [eleve.id]: {} })); };
  const nav = [{ id: "inscriptions", label: "Inscriptions", icon: ClipboardList }, { id: "frais", label: "Frais scolaires", icon: Wallet }, { id: "annonces", label: "Annonces", icon: Megaphone }];
  return (<Coquille role="secretaire" roleLabel="Secrétaire" nav={nav} actif={onglet} setActif={setOnglet} onQuitter={() => {}}>{onglet === "inscriptions" && (<><Panel title="Inscrire un enfant" icon={FileText}><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Champ label="Prénom" value={form.prenom} onChange={champ("prenom")} /><Champ label="Nom" value={form.nom} onChange={champ("nom")} /><div><label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Sexe</label><div className="flex gap-2">{[{ v: "F", l: "Féminin" }, { v: "M", l: "Masculin" }].map((opt) => (<button key={opt.v} type="button" onClick={() => setForm({ ...form, sexe: opt.v })} className="flex-1 rounded-lg border px-3 py-2 text-[15px] transition" style={{ borderColor: form.sexe === opt.v ? "#C9A227" : "#E7DEC8", background: form.sexe === opt.v ? "#FBF0D2" : "transparent" }}>{opt.l}</button>))}</div></div><div><label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Date naissance</label><input type="date" value={form.naissance} onChange={champ("naissance")} className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{ borderColor: "#E7DEC8" }} /></div><div><label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe</label><select value={form.classe} onChange={champ("classe")} className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{ borderColor: "#E7DEC8" }}>{classes.map((c) => <option key={c} value={c}>{c}</option>)}</select></div><Champ label="Nom parrain" value={form.parrainNom} onChange={champ("parrainNom")} /><Champ label="Tél parrain" value={form.parrainTelephone} onChange={champ("parrainTelephone")} /></div><div className="mt-4 flex justify-end"><Btn variant="gold" icon={Plus} onClick={soumettreInscription}>Transmettre</Btn></div>{confirmationInscription && <p className="mt-2 text-[13px]" style={{color:"#2F5233"}}>Transmis pour {confirmationInscription}</p>}</Panel></>)}{onglet === "frais" && (<Panel title="Frais scolaires" icon={Wallet}>{confirmationPaiement && (<div className="mb-4 rounded-lg px-3 py-2.5 text-[15px]" style={{ background: "#E4EEE3", color: "#2F5233" }}>{confirmationPaiement}</div>)}<div className="space-y-4">{eleves.map((e) => { const fraisBruts = e.frais && e.frais.length ? e.frais : fraisTypes.map(ft=>({libelle:ft.libelle, du:ft.montant, paye:0})); const fraisAffiches = dedupFraisParLibelle(fraisBruts); const du = fraisAffiches.reduce((a, f) => a + f.du, 0); const paye = fraisAffiches.reduce((a, f) => a + f.paye, 0); const reste = du - paye; const totalSaisi = totalSaisiPour(e.id); return (<div key={e.id} className="rounded-lg border p-4" style={{ borderColor: "#E7DEC8" }}><div className="mb-2 flex items-center justify-between"><span className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{e.prenom} {e.nom} - {e.classe}</span><Badge tone={reste === 0 ? "vert" : "or"}>{reste === 0 ? "Soldé" : `Reste ${reste.toLocaleString()} F`}</Badge></div><div className="space-y-2">{fraisAffiches.map((f, i) => { const valeurSaisie = (montantsSaisis[e.id] || {})[f.libelle] || ""; return (<div key={i} className="flex items-center justify-between gap-2 rounded border px-2.5 py-2 text-[13px]" style={{ borderColor: "#E7DEC8" }}><span>{f.libelle}: {f.paye}/{f.du} F</span><input type="number" value={valeurSaisie} onChange={(ev) => champMontant(e.id, f.libelle, ev.target.value)} placeholder="Montant" className="w-24 rounded border px-2 py-1 text-right outline-none" style={{ borderColor: "#E7DEC8" }} /></div>); })}</div><div className="mt-3 flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}><span>Total: {totalSaisi} F</span><Btn variant="gold" small onClick={() => enregistrerPaiement(e)}>Enregistrer</Btn></div></div>); })}</div></Panel>)}{onglet === "annonces" && (<Panel title="Annonces" icon={Megaphone}><div className="mb-4 flex gap-2"><input value={nouvelleAnnonce} onChange={(e) => setNouvelleAnnonce(e.target.value)} placeholder="Nouvelle annonce" className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{ borderColor: "#E7DEC8" }} /><Btn variant="primary" icon={Plus} onClick={() => { if (!nouvelleAnnonce.trim()) return; setAnnonces([{ titre: nouvelleAnnonce, texte: nouvelleAnnonce, date: "aujourd'hui" }, ...annonces]); setNouvelleAnnonce(""); }}>Publier</Btn></div><div className="space-y-2">{annonces.map((a, i) => (<div key={i} className="rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}><div className="font-medium" style={{ color: "#1B2A4A" }}>{a.titre}</div><p style={{ color: "#5C5240" }}>{a.texte}</p></div>))}</div></Panel>)}</Coquille>);
}
function EspaceParent({ eleves, setEleves, eleveId, personnel }) {
  const { setMessagesParents, annonces, fraisTypes } = useEcole();
  const [onglet, setOnglet] = useState("notes"); const [message, setMessage] = useState(""); const enfant = eleves.find((e) => e.id === eleveId) || eleves[0];
  if (!enfant) return <div className="p-8">Aucun élève trouvé. Code {eleveId} introuvable.</div>;
  const enseignantClasse = useMemo(() => personnel.find((p) => (p.classe||"").toString().trim().toUpperCase() === (enfant.classe||"").toString().trim().toUpperCase()), [personnel, enfant.classe]);
  const nav = [{ id: "notes", label: "Notes", icon: ClipboardList }, { id: "absences", label: "Absences", icon: CalendarClock }, { id: "frais", label: "Frais", icon: Wallet }, { id: "annonces", label: "Annonces", icon: Megaphone }, { id: "messages", label: "Messages", icon: MessageSquare }];
  const moyenne = useMemo(() => { if (!enfant.notes.length) return null; const total = enfant.notes.reduce((s, n) => s + n.note20, 0); return Math.round((total / enfant.notes.length) * 10) / 10; }, [enfant]);
  return (<Coquille role="parent" roleLabel={`Parent de ${enfant.prenom} ${enfant.nom}`} nav={nav} actif={onglet} setActif={setOnglet} onQuitter={() => {}}><Panel title="Profil" icon={UserCircle2}><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-serif" style={{ background: "#1B2A4A", color: "#C9A227" }}>{enfant.prenom[0]}{enfant.nom[0]}</div><div className="grid flex-1 grid-cols-2 gap-2 text-[15px] sm:grid-cols-4"><div><div className="text-[13px]" style={{ color: "#9A8B67" }}>Classe</div><div style={{ color: "#1B2A4A" }} className="font-medium">{enfant.classe}</div></div><div><div className="text-[13px]" style={{ color: "#9A8B67" }}>Code</div><div className="font-mono text-[13px]" style={{ color: "#1B2A4A" }}>{enfant.id}</div></div><div><div className="text-[13px]" style={{ color: "#9A8B67" }}>Enseignant</div><div style={{ color: "#1B2A4A" }}>{enseignantClasse?.nom || enfant.enseignant || "—"}</div></div><div><div className="text-[13px]" style={{ color: "#9A8B67" }}>Moyenne</div><div style={{ color: "#1B2A4A" }}>{moyenne ? `${moyenne}/20 - ${mentionPour(moyenne)}` : "—"}</div></div></div></div></Panel>{onglet === "notes" && (<Panel title="Notes" icon={ClipboardList}><div className="space-y-3">{enfant.notes.length === 0 && <p style={{ color: "#9A8B67" }}>Aucune note.</p>}{enfant.notes.map((n, i) => (<div key={i} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "#E7DEC8" }}><div><div className="font-serif text-[16px]" style={{ color: "#1B2A4A" }}>{n.matiere}</div><div className="mt-1 flex gap-1.5"><Badge tone="or">{n.evaluation}</Badge><Badge tone="vert">{n.mois}</Badge></div><div className="mt-1 text-[12px]" style={{ color: "#9A8B67" }}>{n.dateSaisie}</div></div><div className="flex h-14 w-16 items-center justify-center rounded-full font-serif" style={{ background: "#F6D24A", color: "#5C4A00" }}>{n.note20}/20</div></div>))}</div></Panel>)}{onglet === "absences" && (<Panel title="Absences" icon={CalendarClock}><div className="space-y-2">{enfant.absences.length === 0 && <p style={{ color: "#9A8B67" }}>Aucune absence.</p>}{enfant.absences.map((a, i) => (<div key={i} className="rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}><Badge tone="or">{a.type}</Badge> <span style={{ color: "#9A8B67" }}>{a.date}</span><p style={{ color: "#5C5240" }}>{a.motif}</p></div>))}</div></Panel>)}{onglet === "frais" && (<Panel title="Frais" icon={Wallet}><div className="space-y-2">{(enfant.frais.length ? enfant.frais : fraisTypes.map(ft=>({libelle:ft.libelle, du:ft.montant, paye:0}))).map((f, i) => (<div key={i} className="flex items-center justify-between rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}><span style={{ color: "#1B2A4A" }}>{f.libelle}</span><div className="flex items-center gap-3"><span style={{ color: "#5C5240" }}>{f.paye}/{f.du} F</span><Badge tone={f.paye >= f.du ? "vert" : "or"}>{f.paye >= f.du ? "Soldé" : "Reste"}</Badge></div></div>))}</div></Panel>)}{onglet === "annonces" && (<Panel title="Annonces de l'école" icon={Megaphone}><div className="space-y-2">{annonces.length===0 && <p style={{color:"#9A8B67"}}>Aucune annonce.</p>}{annonces.map((a,i)=>(<div key={i} className="rounded-lg border px-4 py-3" style={{borderColor:"#E7DEC8"}}><div className="font-medium" style={{color:"#1B2A4A"}}>{a.titre}</div><div className="text-[13px]" style={{color:"#9A8B67"}}>{a.date}</div><p className="mt-1" style={{color:"#5C5240"}}>{a.texte}</p></div>))}</div></Panel>)}{onglet === "messages" && (<Panel title="Messages" icon={MessageSquare}><div className="mb-3 space-y-2">{enfant.messages.map((m, i) => (<div key={i} className="rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}><div className="flex justify-between text-[13px]" style={{ color: "#9A8B67" }}><span style={{ color: "#1B2A4A" }}>{m.auteur}</span>{m.date}</div><p style={{ color: "#3E3625" }}>{m.texte}</p></div>))}</div><div className="flex gap-2"><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message à l'administration..." className="w-full rounded-lg border px-3 py-2 outline-none" style={{ borderColor: "#E7DEC8" }} /><Btn variant="primary" icon={Send} onClick={() => { if (!message.trim()) return; setEleves((prev) => prev.map((e) => e.id === enfant.id ? { ...e, messages: [...e.messages, { auteur: "Vous", texte: message, date: "aujourd'hui" }] } : e)); setMessagesParents((prev) => [{ eleveId: enfant.id, nomEleve: `${enfant.prenom} ${enfant.nom}`, classe: enfant.classe, texte: message, date: "aujourd'hui", lu: false }, ...prev]); setMessage(""); }}>Envoyer</Btn></div></Panel>)}</Coquille>);
}

function EspaceDirecteur({ eleves, personnel, setPersonnel, annonces, setAnnonces, demandes, setDemandes, setEleves }) {
  const { ecole, setEcole, classes, setClasses, fraisTypes, setFraisTypes, anneeScolaire, setAnneeScolaire, codes, setCodes, matieresParClasse, setMatieresParClasse, messagesInternes, setMessagesInternes, anneesArchivees, setAnneesArchivees, messagesParents, setMessagesParents } = useEcole();
  const [onglet, setOnglet] = useState("dashboard");
  const [msgInterne, setMsgInterne] = useState({ dest: "tous", texte: "" });
  const [annoncePub, setAnnoncePub] = useState({ titre: "", texte: "" });
  const [editEcole, setEditEcole] = useState(ecole);
  useEffect(()=>{ setEditEcole(ecole); }, [ecole]);
  const [nouvelleClasse, setNouvelleClasse] = useState("");
  const [nouveauFrais, setNouveauFrais] = useState({ libelle:"", montant:"" });
  const [nouveauPersonnel, setNouveauPersonnel] = useState({ nom:"", poste:"Enseignant", telephone:"", classe:"CM1" });
  const [classeMatiereActive, setClasseMatiereActive] = useState("CM1");
  const [nouvelleMatiere, setNouvelleMatiere] = useState({ nom:"", coef:1 });

  const envoyerMessageInterne = () => {
    if(!msgInterne.texte.trim()) return;
    setMessagesInternes(prev=>[{ destinataire: msgInterne.dest, texte: msgInterne.texte.trim(), date: formatDateFr() }, ...prev]);
    setMsgInterne({ dest: "tous", texte: "" });
  };
  const envoyerAnnoncePublique = () => {
    if(!annoncePub.titre.trim() || !annoncePub.texte.trim()) return;
    setAnnonces(prev=>[{ titre: annoncePub.titre.trim(), texte: annoncePub.texte.trim(), date: formatDateFr() }, ...prev]);
    setAnnoncePub({ titre:"", texte:"" });
  };

  const nav = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "inscriptions", label: "Inscriptions (Directeur)", icon: Inbox },
    { id: "messages_parents", label: "Messages Parents → Dir", icon: MessageSquare },
    { id: "messages_internes", label: "Messages Internes", icon: Users },
    { id: "annonces_pub", label: "Annonces Publiques", icon: Megaphone },
    { id: "classes", label: "Classes", icon: School },
    { id: "matieres", label: "Matières par classe", icon: FileText },
    { id: "frais", label: "Frais", icon: Wallet },
    { id: "personnel", label: "Personnel", icon: Users },
    { id: "parametres", label: "Paramètres", icon: Settings }
  ];

  return (
    <Coquille role="directeur" roleLabel="Espace Administratif" nav={nav} actif={onglet} setActif={setOnglet} onQuitter={() => {}}>
      {onglet === "dashboard" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Élèves" value={eleves.length} tone="ardoise" />
            <Stat label="Classes" value={classes.length} tone="ardoise" />
            <Stat label="Annonces" value={annonces.length} tone="or" />
            <Stat label="Demandes en attente" value={demandes.filter(d=>d.statut==="en_attente").length} tone="or" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Messages Parents" value={messagesParents.filter(m=>!m.lu).length} tone="or" />
            <Stat label="Messages Internes" value={messagesInternes.length} tone="ardoise" />
            <Stat label="Personnel" value={personnel.length} tone="vert" />
          </div>
          <Panel title="Infos École" icon={ShieldCheck}><div className="text-[15px]">{ecole.sigle} - {ecole.commune} - Année {anneeScolaire}</div><div className="text-[13px] mt-1" style={{color:"#9A8B67"}}>{ecole.quartier} - {ecole.directeur}</div></Panel>
        </>
      )}

      {onglet === "inscriptions" && (
        <Panel title="Inscriptions en ligne - Validation Directeur UNIQUEMENT" icon={Inbox}>
          <p className="mb-4 text-[13px]" style={{color:"#9A8B67"}}>Seul le directeur valide ici. Après validation, code CSP auto-généré. Visible uniquement directeur.</p>
          <div className="space-y-3">
            {demandes.length===0 && <p style={{color:"#9A8B67"}}>Aucune demande.</p>}
            {demandes.map((d,i)=>(
              <div key={i} className="rounded-xl border p-4" style={{borderColor:"#E7DEC8", background: d.statut==="en_attente"?"#FFFDF6":"white"}}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-[15px]" style={{color:"#1B2A4A"}}>{d.prenom} {d.nom} {d.age?`(${d.age} ans)`: ""}</div>
                    <div className="text-[13px]" style={{color:"#5C5240"}}>Classe: <b>{d.classeSouhaitee}</b> - {d.sexe} - Né(e) {d.naissance}</div>
                    <div className="text-[13px]" style={{color:"#9A8B67"}}>Parrain: {d.parrainNom} ({d.parrainTelephone}) - {d.date} - {d.origine}</div>
                    {d.message && <div className="mt-1 text-[13px] italic" style={{color:"#5C5240"}}>"{d.message}"</div>}
                  </div>
                  <div className="flex gap-2">
                    {d.statut==="en_attente" && <>
                      <Btn small variant="gold" onClick={()=>{
                        const code=genererCodeEleve();
                        setDemandes(prev=>prev.map(x=>x.id===d.id?{...x,statut:"validee"}:x));
                        setEleves(prev=>[...prev,{
                          id:code, prenom:d.prenom, nom:d.nom, sexe:d.sexe, naissance:d.naissance,
                          classe:d.classeSouhaitee, notes:[], absences:[],
                          frais:fraisTypes.map(f=>({libelle:f.libelle, du:f.montant, paye:0})),
                          messages:[], parent:{nom:d.parrainNom, telephone:d.parrainTelephone}, enseignant:"À affecter"
                        }]);
                      }}>Valider & Créer {`{code}`}</Btn>
                      <Btn small variant="ghost" onClick={()=>setDemandes(prev=>prev.map(x=>x.id===d.id?{...x,statut:"refusee"}:x))}>Refuser</Btn>
                    </>}
                    {d.statut!=="en_attente" && <Badge tone={d.statut==="validee"?"vert":"ardoise"}>{d.statut}</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "messages_parents" && (
        <Panel title="Messages des Parrains / Parents → Directeur SEULEMENT" icon={MessageSquare}>
          <p className="mb-3 text-[13px]" style={{color:"#9A8B67"}}>Ces messages sont envoyés par les parents depuis leur espace et ne sont visibles QUE par le directeur ici. Pas par les enseignants ni secrétaire.</p>
          <div className="space-y-3">
            {messagesParents.length===0 && <p style={{color:"#9A8B67"}}>Aucun message de parents.</p>}
            {messagesParents.map((m,i)=>(
              <div key={i} className="rounded-lg border p-4" style={{borderColor:"#C9A227", background:"#FFFDF6"}}>
                <div className="flex justify-between">
                  <div className="font-medium text-[14px]" style={{color:"#1B2A4A"}}>{m.nomEleve} - Classe {m.classe} - ID {m.eleveId}</div>
                  <span className="text-[12px]" style={{color:"#9A8B67"}}>{m.date}</span>
                </div>
                <p className="mt-2 text-[15px]" style={{color:"#3E3625"}}>{m.texte}</p>
                <div className="mt-3 flex gap-2">
                  <Btn small variant="ghost" onClick={()=>{ setMessagesParents(prev=>prev.map((x,idx)=> idx===i? {...x, lu:true}:x)); }}>Marquer lu</Btn>
                  <Btn small variant="ghost" onClick={()=>setMessagesParents(prev=>prev.filter((_,idx)=>idx!==i))}>Supprimer</Btn>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "messages_internes" && (
        <>
          <Panel title="Envoyer message interne → Tout le personnel" icon={MessageSquare}>
            <div className="space-y-3">
              <select value={msgInterne.dest} onChange={(e)=>setMsgInterne({...msgInterne, dest:e.target.value})} className="rounded-lg border px-3 py-2 text-[15px] w-full" style={{borderColor:"#E7DEC8"}}>
                <option value="tous">Tout le personnel (enseignants + secrétaire)</option>
                <option value="enseignant">Tous les enseignants uniquement</option>
                <option value="secretaire">Secrétaire uniquement</option>
                {personnel.map((p,i)=><option key={i} value={p.nom}>{p.nom} - {p.poste} - {p.classe}</option>)}
              </select>
              <textarea value={msgInterne.texte} onChange={(e)=>setMsgInterne({...msgInterne, texte:e.target.value})} rows={3} placeholder="Message interne pour le personnel..." className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{borderColor:"#E7DEC8"}} />
              <div className="flex justify-end"><Btn variant="gold" icon={Send} onClick={envoyerMessageInterne}>Envoyer au personnel</Btn></div>
              <p className="text-[12px]" style={{color:"#9A8B67"}}>Ce message apparaîtra dans l'onglet Annonces & messages de chaque enseignant et dans le tableau de bord du personnel.</p>
            </div>
          </Panel>
          <Panel title="Historique messages internes" icon={Users}>
            <div className="space-y-2">
              {messagesInternes.map((m,i)=>(
                <div key={i} className="flex justify-between rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}}>
                  <div><Badge tone="or">{m.destinataire}</Badge><p className="mt-1 text-[14px]">{m.texte}</p><p className="text-[12px]" style={{color:"#9A8B67"}}>{m.date}</p></div>
                  <Trash2 size={14} className="cursor-pointer" style={{color:"#8A2E2E"}} onClick={()=>setMessagesInternes(prev=>prev.filter((_,idx)=>idx!==i))} />
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {onglet === "annonces_pub" && (
        <>
          <Panel title="Publier annonce publique → Personnel + TOUS les Parents" icon={Megaphone}>
            <div className="space-y-3">
              <Champ label="Titre" value={annoncePub.titre} onChange={(e)=>setAnnoncePub({...annoncePub, titre:e.target.value})} placeholder="Ex: Réunion parents" />
              <div><label className="mb-1 block text-[13px] font-medium" style={{color:"#5C5240"}}>Contenu</label><textarea value={annoncePub.texte} onChange={(e)=>setAnnoncePub({...annoncePub, texte:e.target.value})} rows={3} placeholder="Cette annonce sera visible par tout le personnel ET tous les parents dans leur espace Annonces..." className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{borderColor:"#E7DEC8"}} /></div>
              <div className="flex justify-end"><Btn variant="gold" icon={Send} onClick={envoyerAnnoncePublique}>Publier pour tous</Btn></div>
            </div>
          </Panel>
          <Panel title="Annonces publiques publiées" icon={Megaphone}>
            <div className="space-y-2">{annonces.map((a,i)=>(<div key={i} className="rounded-lg border px-4 py-3 flex justify-between" style={{borderColor:"#E7DEC8"}}><div><div className="font-medium">{a.titre}</div><p className="text-[14px]">{a.texte}</p><small>{a.date}</small></div><Trash2 size={14} className="cursor-pointer" style={{color:"#8A2E2E"}} onClick={()=>setAnnonces(prev=>prev.filter((_,idx)=>idx!==i))} /></div>))}</div>
          </Panel>
        </>
      )}

      {onglet === "classes" && (
        <Panel title="Classes - Ajouter / Supprimer" icon={School}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-4">
            {classes.map((c,i)=>(<div key={i} className="rounded-lg border px-3 py-2 flex justify-between" style={{borderColor:"#E7DEC8"}}><span>{c}</span><div className="flex gap-2"><Badge>{eleves.filter(e=>(e.classe||"").toUpperCase()===c.toUpperCase()).length}</Badge><Trash2 size={12} className="cursor-pointer" style={{color:"#8A2E2E"}} onClick={()=>{ if(confirm(`Supprimer ${c}?`)) setClasses(prev=>prev.filter(x=>x!==c)); }}/></div></div>))}
          </div>
          <div className="flex gap-2 rounded-lg p-3" style={{background:"#F1ECDD"}}>
            <input value={nouvelleClasse} onChange={(e)=>setNouvelleClasse(e.target.value)} placeholder="Nouvelle classe ex: Kponjè" className="flex-1 rounded border px-3 py-2 text-[15px]" />
            <Btn variant="gold" icon={Plus} onClick={()=>{ if(!nouvelleClasse.trim()) return; setClasses(prev=>[...prev, nouvelleClasse.trim()]); setNouvelleClasse(""); }}>Ajouter</Btn>
          </div>
        </Panel>
      )}

      {onglet === "matieres" && (
        <Panel title="Matières par Classe - Gestion complète" icon={FileText}>
          <div className="mb-4 flex flex-wrap gap-2">{classes.map(c=><button key={c} onClick={()=>setClasseMatiereActive(c)} className="rounded-full px-3 py-1 text-[13px] border" style={{background: classeMatiereActive===c?"#1B2A4A":"white", color: classeMatiereActive===c?"#FAF6EE":"#1B2A4A", borderColor:"#E7DEC8"}}>{c}</button>)}</div>
          <div className="mb-2 font-medium">Classe {classeMatiereActive}: {(matieresParClasse[classeMatiereActive]||[]).length} matières</div>
          <div className="space-y-2 mb-4">
            {(matieresParClasse[classeMatiereActive]||[]).map((m,i)=>(
              <div key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}}>
                <input defaultValue={m.nom} onBlur={(e)=>{ const v=e.target.value.trim(); if(!v) return; setMatieresParClasse(prev=>({ ...prev, [classeMatiereActive]: prev[classeMatiereActive].map((x,idx)=> idx===i? {...x, nom:v}:x) })); }} className="flex-1 rounded border px-2 py-1 text-[14px]" />
                <span className="text-[12px]">Coef</span>
                <input type="number" defaultValue={m.coef} onBlur={(e)=>{ const v=Number(e.target.value)||1; setMatieresParClasse(prev=>({ ...prev, [classeMatiereActive]: prev[classeMatiereActive].map((x,idx)=> idx===i? {...x, coef:v}:x) })); }} className="w-12 rounded border text-center" />
                <Trash2 size={14} className="cursor-pointer" style={{color:"#8A2E2E"}} onClick={()=>{ setMatieresParClasse(prev=>({ ...prev, [classeMatiereActive]: prev[classeMatiereActive].filter((_,idx)=>idx!==i) })); }} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 rounded-lg p-3" style={{background:"#F1ECDD"}}>
            <input value={nouvelleMatiere.nom} onChange={(e)=>setNouvelleMatiere({...nouvelleMatiere, nom:e.target.value})} placeholder="Nouvelle matière" className="flex-1 rounded border px-2 py-2 text-[14px]" />
            <input type="number" min={1} max={5} value={nouvelleMatiere.coef} onChange={(e)=>setNouvelleMatiere({...nouvelleMatiere, coef:e.target.value})} className="w-14 rounded border px-2 py-2 text-center" />
            <Btn variant="gold" small onClick={()=>{ if(!nouvelleMatiere.nom.trim()) return; setMatieresParClasse(prev=>({ ...prev, [classeMatiereActive]: [...(prev[classeMatiereActive]||[]), { nom: nouvelleMatiere.nom.trim(), coef:Number(nouvelleMatiere.coef)||1 }] })); setNouvelleMatiere({nom:"", coef:1}); }}>Ajouter</Btn>
          </div>
        </Panel>
      )}

      {onglet === "frais" && (
        <Panel title="Frais Scolaires - Édition complète" icon={Wallet}>
          <div className="space-y-2 mb-4">{fraisTypes.map((f,i)=>(<div key={i} className="flex gap-2 rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}}><input defaultValue={f.libelle} onBlur={(e)=>{ const v=e.target.value.trim(); if(!v) return; setFraisTypes(prev=>prev.map((x,idx)=> idx===i? {...x, libelle:v}:x)); }} className="flex-1 rounded border px-2 py-1 text-[14px]" /><input type="number" defaultValue={f.montant} onBlur={(e)=>{ const v=Number(e.target.value)||0; setFraisTypes(prev=>prev.map((x,idx)=> idx===i? {...x, montant:v}:x)); }} className="w-24 rounded border px-2 py-1 text-right text-[14px]" /><Trash2 size={14} className="cursor-pointer" style={{color:"#8A2E2E"}} onClick={()=>setFraisTypes(prev=>prev.filter((_,idx)=>idx!==i))} /></div>))}</div>
          <div className="flex gap-2 rounded-lg p-3" style={{background:"#F1ECDD"}}><input value={nouveauFrais.libelle} onChange={(e)=>setNouveauFrais({...nouveauFrais, libelle:e.target.value})} placeholder="Libellé" className="flex-1 rounded border px-2 py-2 text-[14px]" /><input type="number" value={nouveauFrais.montant} onChange={(e)=>setNouveauFrais({...nouveauFrais, montant:e.target.value})} placeholder="Montant" className="w-28 rounded border px-2 py-2 text-[14px]" /><Btn variant="gold" small onClick={()=>{ if(!nouveauFrais.libelle.trim()) return; setFraisTypes(prev=>[...prev, { libelle:nouveauFrais.libelle.trim(), montant:Number(nouveauFrais.montant)||0 }]); setNouveauFrais({libelle:"", montant:""}); }}>Ajouter</Btn></div>
        </Panel>
      )}

      {onglet === "personnel" && (
        <Panel title="Personnel" icon={Users}>
          <div className="space-y-2 mb-4">{personnel.map((p,i)=>(<div key={i} className="rounded-lg border px-3 py-2 flex justify-between" style={{borderColor:"#E7DEC8"}}><span className="text-[14px]"><b>{p.nom}</b> - {p.poste} - {p.classe} - {p.telephone}</span><Trash2 size={14} className="cursor-pointer" style={{color:"#8A2E2E"}} onClick={()=>setPersonnel(prev=>prev.filter((_,idx)=>idx!==i))} /></div>))}</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg p-3" style={{background:"#F1ECDD"}}>
            <input value={nouveauPersonnel.nom} onChange={(e)=>setNouveauPersonnel({...nouveauPersonnel, nom:e.target.value})} placeholder="Nom" className="rounded border px-2 py-2 text-[14px]" />
            <select value={nouveauPersonnel.poste} onChange={(e)=>setNouveauPersonnel({...nouveauPersonnel, poste:e.target.value})} className="rounded border px-2 py-2 text-[14px]"><option>Directeur</option><option>Enseignant</option><option>Secrétaire</option><option>Surveillant</option></select>
            <input value={nouveauPersonnel.telephone} onChange={(e)=>setNouveauPersonnel({...nouveauPersonnel, telephone:e.target.value})} placeholder="Téléphone" className="rounded border px-2 py-2 text-[14px]" />
            <select value={nouveauPersonnel.classe} onChange={(e)=>setNouveauPersonnel({...nouveauPersonnel, classe:e.target.value})} className="rounded border px-2 py-2 text-[14px]">{classes.map(c=><option key={c} value={c}>{c}</option>)}<option value="—">—</option></select>
            <div className="col-span-2 flex justify-end"><Btn variant="gold" small onClick={()=>{ if(!nouveauPersonnel.nom.trim()) return; setPersonnel(prev=>[...prev, nouveauPersonnel]); setNouveauPersonnel({nom:"", poste:"Enseignant", telephone:"", classe:"CM1"}); }}>Ajouter personnel</Btn></div>
          </div>
        </Panel>
      )}

      {onglet === "parametres" && (
        <div className="space-y-5">
          <Panel title="Informations École - Modifiable" icon={School}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Champ label="Nom école" value={editEcole.nom} onChange={(e)=>setEditEcole({...editEcole, nom:e.target.value})} />
              <Champ label="Sigle" value={editEcole.sigle} onChange={(e)=>setEditEcole({...editEcole, sigle:e.target.value})} />
              <Champ label="Quartier" value={editEcole.quartier} onChange={(e)=>setEditEcole({...editEcole, quartier:e.target.value})} />
              <Champ label="Commune" value={editEcole.commune} onChange={(e)=>setEditEcole({...editEcole, commune:e.target.value})} />
              <Champ label="Département" value={editEcole.departement} onChange={(e)=>setEditEcole({...editEcole, departement:e.target.value})} />
              <Champ label="Directeur" value={editEcole.directeur} onChange={(e)=>setEditEcole({...editEcole, directeur:e.target.value})} />
              <Champ label="Tél école" value={editEcole.telephone} onChange={(e)=>setEditEcole({...editEcole, telephone:e.target.value})} />
              <Champ label="Tél directeur" value={editEcole.telephoneDirecteur} onChange={(e)=>setEditEcole({...editEcole, telephoneDirecteur:e.target.value})} />
              <Champ label="Email" value={editEcole.email} onChange={(e)=>setEditEcole({...editEcole, email:e.target.value})} />
              <Champ label="Devise" value={editEcole.devise} onChange={(e)=>setEditEcole({...editEcole, devise:e.target.value})} />
            </div>
            <div className="mt-4 flex justify-end"><Btn variant="gold" icon={BadgeCheck} onClick={()=>setEcole(editEcole)}>Enregistrer infos</Btn></div>
          </Panel>
          
          <Panel title="Codes d'accès - Directeur, Enseignant général, Secrétaire + Codes par CLASSE (chaque classe a son code)" icon={KeyRound}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Champ label="Code Directeur" value={codes.directeur} onChange={(e)=>setCodes({...codes, directeur:e.target.value})} />
              <Champ label="Code Enseignant GÉNÉRAL (5678)" value={codes.enseignant} onChange={(e)=>setCodes({...codes, enseignant:e.target.value})} />
              <Champ label="Code Secrétaire" value={codes.secretaire} onChange={(e)=>setCodes({...codes, secretaire:e.target.value})} />
            </div>
            <div className="mt-6">
              <div className="font-medium text-[15px] mb-2" style={{color:"#1B2A4A"}}>Codes par classe - Chaque enseignant tape le code de SA classe pour aller direct dans sa classe</div>
              <p className="text-[12px] mb-3" style={{color:"#9A8B67"}}>Exemple: CM1 = 1111, CM2 = 2222, CE2 = 1006. L'enseignant de CM1 tape 1111 et arrive direct en CM1.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {classes.map((cls)=>(
                  <div key={cls} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}}>
                    <span className="w-28 text-[13px] font-medium" style={{color:"#1B2A4A"}}>{cls}</span>
                    <input value={codesClasses[cls]||""} onChange={(e)=>setCodesClasses(prev=>({...prev, [cls]: e.target.value}))} placeholder="Code" className="flex-1 rounded border px-2 py-1 text-[14px] font-mono" />
                    <Badge tone="or">{(eleves.filter(ev=> (ev.classe||"").toUpperCase()===cls.toUpperCase()).length)} élèves</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[12px]" style={{color:"#5C5240"}}>Partage: Dis à l'enseignant de CM1: "Va sur le lien, clique Enseignant, tape code <b>{codesClasses['CM1']||'1111'}</b>". Il arrivera direct dans CM1.</div>
            </div>
            <div className="mt-6"><Champ label="Année scolaire" value={anneeScolaire} onChange={(e)=>setAnneeScolaire(e.target.value)} /></div>
          </Panel>

        </div>
      )}
    </Coquille>
  );
}


// ===== SYNCHRO SUPABASE CORRIGEE =====
async function chargerToutesLesDonnees() {
  const [ecoleRows, codesRows, classesRows, matieresRows, personnelRows, elevesRows, notesRows, absencesRows, fraisTypesRows, fraisEleveRows, annoncesRows, messagesEleveRows, messagesParentsRows, messagesInternesRows, demandesRows, anneesRows] = await Promise.all([pgSelect("ecole", "&id=eq.1"), pgSelect("codes_acces"), pgSelect("classes", "&order=ordre"), pgSelect("matieres"), pgSelect("personnel"), pgSelect("eleves"), pgSelect("notes"), pgSelect("absences"), pgSelect("frais_types"), pgSelect("frais_eleve"), pgSelect("annonces", "&order=cree_le.desc"), pgSelect("messages_eleve"), pgSelect("messages_parents", "&order=cree_le.desc"), pgSelect("messages_internes", "&order=cree_le.desc"), pgSelect("demandes_inscription"), pgSelect("annees_archivees")]);
  const ecoleRow = (ecoleRows || [])[0];
  const ecole = ecoleRow ? { nom: ecoleRow.nom, sigle: ecoleRow.sigle, quartier: ecoleRow.quartier, commune: ecoleRow.commune, departement: ecoleRow.departement, directeur: ecoleRow.directeur, telephone: ecoleRow.telephone, telephoneDirecteur: ecoleRow.telephone_directeur, email: ecoleRow.email, devise: ecoleRow.devise, logoUrl: ecoleRow.logo_url } : ECOLE_INIT;
  const anneeScolaire = ecoleRow?.annee_scolaire || ANNEE_INIT;
  const codes = { directeur: "1234", enseignant: "5678", secretaire: "9012" }; (codesRows || []).forEach((c) => { codes[c.role] = c.code; });
    const codesClasses = {};
  (codesClassesRows||[]).forEach(r=>{ codesClasses[r.classe]=r.code; });
  // Si vide, utiliser init
  if(Object.keys(codesClasses).length===0){ Object.assign(codesClasses, CODES_CLASSES_INIT); }
const classes = (classesRows || []).map((c) => c.nom); if (classes.length === 0) classes.push(...CLASSES_INIT);
  const matieresParClasse = {}; (matieresRows || []).forEach((m) => { if (!matieresParClasse[m.classe]) matieresParClasse[m.classe] = []; matieresParClasse[m.classe].push({ nom: m.nom, coef: m.coefficient }); });
  const personnel = (personnelRows || []).map((p) => ({ nom: p.nom, poste: p.poste, classe: p.classe, telephone: p.telephone }));
  const fraisTypes = (fraisTypesRows || []).map((f) => ({ libelle: f.libelle, montant: Number(f.montant) }));
  const eleves = (elevesRows || []).map((e) => ({ id: e.id, prenom: e.prenom, nom: e.nom, sexe: e.sexe, naissance: e.naissance, classe: e.classe, enseignant: e.enseignant, parent: { nom: e.parrain_nom, telephone: e.parrain_telephone }, notes: (notesRows || []).filter((n) => n.eleve_id === e.id).map((n) => ({ matiere: n.matiere, evaluation: n.evaluation, mois: n.mois, note20: Number(n.note20), dateSaisie: n.date_saisie })), absences: (absencesRows || []).filter((a) => a.eleve_id === e.id).map((a) => ({ date: a.date, type: a.type, motif: a.motif })), frais: (fraisEleveRows || []).filter((f) => f.eleve_id === e.id).map((f) => ({ libelle: f.libelle, du: Number(f.du), paye: Number(f.paye), mode: f.mode, datePaiement: f.date_paiement })), messages: (messagesEleveRows || []).filter((m) => m.eleve_id === e.id).map((m) => ({ auteur: m.auteur, texte: m.texte, date: m.date })) }));
  const annonces = (annoncesRows || []).map((a) => ({ titre: a.titre, texte: a.texte, date: a.date }));
  const messagesInternes = (messagesInternesRows || []).map((m) => ({ destinataire: m.destinataire, texte: m.texte, date: m.date }));
  const messagesParents = (messagesParentsRows || []).map((m) => ({ eleveId: m.eleve_id, nomEleve: m.nom_eleve, classe: m.classe, texte: m.texte, date: m.date, lu: m.lu }));
  const demandes = (demandesRows || []).map((d) => ({ id: d.id, prenom: d.prenom, nom: d.nom, sexe: d.sexe, naissance: d.naissance, age: d.age, classeSouhaitee: d.classe_souhaitee, parrainNom: d.parrain_nom, parrainTelephone: d.parrain_telephone, message: d.message, origine: d.origine, date: d.date, statut: d.statut }));
  const anneesArchivees = (anneesRows || []).map((a) => ({ annee: a.annee, dateArchivage: a.date_archivage, eleves: a.donnees }));
  return { ecole, anneeScolaire, codes, codesClasses, classes, matieresParClasse, personnel, fraisTypes, eleves, annonces, messagesInternes, messagesParents, demandes, anneesArchivees };
}
async function syncEcole(ecole, anneeScolaire) { if (!ecole) return; await pgUpsert("ecole", [{ id: 1, nom: ecole.nom, sigle: ecole.sigle, quartier: ecole.quartier, commune: ecole.commune, departement: ecole.departement, directeur: ecole.directeur, telephone: ecole.telephone, telephone_directeur: ecole.telephoneDirecteur, email: ecole.email, devise: ecole.devise, logo_url: ecole.logoUrl, annee_scolaire: anneeScolaire }], "id"); }
async function syncCodes(codes) { const lignes = Object.entries(codes || {}).map(([role, code]) => ({ role, code })); await pgUpsert("codes_acces", lignes, "role"); }
// CORRECTION CRITIQUE : parenthèse manquante qui cassait tout

async function syncCodesClasses(codesClasses) {
  if(!codesClasses) return;
  const lignes = Object.entries(codesClasses).map(([classe, code])=>({ classe, code }));
  await pgDeleteToutes("codes_classes", "classe");
  if(lignes.length) await pgInsert("codes_classes", lignes);
}

async function syncClasses(classes) {
  const noms = classes || [];
  await pgUpsert("classes", noms.map((nom, i) => ({ nom, ordre: i })), "nom");
  const existantes = (await pgSelect("classes")) || [];
  const aSupprimer = existantes.map((r) => r.nom).filter((n) => !noms.includes(n));
  await pgDeleteIn("classes", "nom", aSupprimer);
}
async function syncMatieresParClasse(matieresParClasse) { const lignes = Object.entries(matieresParClasse || {}).flatMap(([classe, liste]) => (liste || []).map((m) => ({ classe, nom: m.nom, coefficient: m.coef }))); await pgDeleteToutes("matieres", "id"); await pgInsert("matieres", lignes); }
async function syncPersonnel(personnel) { await pgDeleteToutes("personnel", "id"); await pgInsert("personnel", (personnel || []).map((p) => ({ nom: p.nom ?? null, poste: p.poste ?? null, classe: p.classe ?? null, telephone: p.telephone ?? null }))); }
async function syncFraisTypes(fraisTypes) { await pgDeleteToutes("frais_types", "id"); await pgInsert("frais_types", (fraisTypes || []).map((f) => ({ libelle: f.libelle ?? null, montant: f.montant ?? 0 }))); }
async function syncAnnonces(annonces) { await pgDeleteToutes("annonces", "id"); await pgInsert("annonces", [...(annonces || [])].reverse().map((a) => ({ titre: a.titre ?? null, texte: a.texte ?? null, date: a.date ?? null }))); }
async function syncMessagesInternes(messagesInternes) { await pgDeleteToutes("messages_internes", "id"); await pgInsert("messages_internes", [...(messagesInternes || [])].reverse().map((m) => ({ destinataire: m.destinataire ?? null, texte: m.texte ?? null, date: m.date ?? null }))); }
async function syncMessagesParents(messagesParents) { await pgDeleteToutes("messages_parents", "id"); await pgInsert("messages_parents", [...(messagesParents || [])].reverse().map((m) => ({ eleve_id: m.eleveId ?? null, nom_eleve: m.nomEleve ?? null, classe: m.classe ?? null, texte: m.texte ?? null, date: m.date ?? null, lu: m.lu ?? false }))); }
async function syncDemandes(demandes) { const lignes = (demandes || []).map((d) => ({ id: d.id, prenom: d.prenom, nom: d.nom, sexe: d.sexe ?? null, naissance: d.naissance ?? null, age: d.age ?? null, classe_souhaitee: d.classeSouhaitee ?? null, parrain_nom: d.parrainNom ?? null, parrain_telephone: d.parrainTelephone ?? null, message: d.message ?? null, origine: d.origine ?? null, date: d.date ?? null, statut: d.statut ?? null })); await pgUpsert("demandes_inscription", lignes, "id"); const existantes = (await pgSelect("demandes_inscription")) || []; const idsActuels = (demandes || []).map((d) => d.id); const aSupprimer = existantes.map((r) => r.id).filter((id) => !idsActuels.includes(id)); await pgDeleteIn("demandes_inscription", "id", aSupprimer); }
async function syncAnneesArchivees(anneesArchivees) { await pgDeleteToutes("annees_archivees", "id"); await pgInsert("annees_archivees", (anneesArchivees || []).map((a) => ({ annee: a.annee, date_archivage: a.dateArchivage, donnees: a.eleves }))); }
async function syncEleves(eleves) {
  const liste = eleves || []; const ids = liste.map((e) => e.id);
  await pgUpsert("eleves", liste.map((e) => ({ id: e.id, prenom: e.prenom, nom: e.nom, sexe: e.sexe ?? null, naissance: e.naissance ?? null, classe: e.classe ?? null, enseignant: e.enseignant ?? null, parrain_nom: e.parent?.nom ?? null, parrain_telephone: e.parent?.telephone ?? null })), "id");
  const existants = (await pgSelect("eleves")) || []; const aSupprimer = existants.map((r) => r.id).filter((id) => !ids.includes(id)); await pgDeleteIn("eleves", "id", aSupprimer);
  const filtreIds = ids.length ? ids : ["__aucun__"]; await pgDeleteIn("notes", "eleve_id", filtreIds); await pgDeleteIn("absences", "eleve_id", filtreIds); await pgDeleteIn("frais_eleve", "eleve_id", filtreIds); await pgDeleteIn("messages_eleve", "eleve_id", filtreIds);
  await pgInsert("notes", liste.flatMap((e) => (e.notes || []).map((n) => ({ eleve_id: e.id, matiere: n.matiere ?? null, evaluation: n.evaluation ?? null, mois: n.mois ?? null, note20: n.note20 ?? null, date_saisie: n.dateSaisie ?? null }))));
  await pgInsert("absences", liste.flatMap((e) => (e.absences || []).map((a) => ({ eleve_id: e.id, date: a.date ?? null, type: a.type ?? null, motif: a.motif ?? null }))));
  await pgInsert("frais_eleve", liste.flatMap((e) => (e.frais || []).map((f) => ({ eleve_id: e.id, libelle: f.libelle ?? null, du: f.du ?? 0, paye: f.paye ?? 0, mode: f.mode ?? null, date_paiement: f.datePaiement ?? null }))));
  await pgInsert("messages_eleve", liste.flatMap((e) => (e.messages || []).map((m) => ({ eleve_id: e.id, auteur: m.auteur ?? null, texte: m.texte ?? null, date: m.date ?? null }))));
}
export default function EcoleConnecteeCSP() {
  const [role, setRole] = useState(null); const [eleveIdActif, setEleveIdActif] = useState(null); const [vue, setVue] = useState("connexion"); const [eleves, setEleves] = useState(ELEVES_INIT); const [personnel, setPersonnel] = useState(PERSONNEL_INIT); const [annonces, setAnnonces] = useState(ANNONCES_INIT); const [demandes, setDemandes] = useState(DEMANDES_INIT); const [ecole, setEcole] = useState(ECOLE_INIT); const [classes, setClasses] = useState(CLASSES_INIT); const [codes, setCodes] = useState(CODES_INIT);
  const [codesClasses, setCodesClasses] = useState(CODES_CLASSES_INIT); const [anneeScolaire, setAnneeScolaire] = useState(ANNEE_INIT); const [fraisTypes, setFraisTypes] = useState(FRAIS_TYPES_INIT); const [matieresParClasse, setMatieresParClasse] = useState(MATIERES_PAR_CLASSE_INIT); const [messagesInternes, setMessagesInternes] = useState([]); const [anneesArchivees, setAnneesArchivees] = useState([]); const [messagesParents, setMessagesParents] = useState([]);
  const [chargement, setChargement] = useState(true); const [erreurChargement, setErreurChargement] = useState(null); const pretPourSync = useRef(false);
  useEffect(() => { let annule = false; chargerToutesLesDonnees().then((d) => { if (annule) return; setEcole(d.ecole); setAnneeScolaire(d.anneeScolaire); setCodes(d.codes); setCodesClasses(d.codesClasses||CODES_CLASSES_INIT); setClasses(d.classes); setMatieresParClasse(d.matieresParClasse); setPersonnel(d.personnel.length ? d.personnel : PERSONNEL_INIT); setFraisTypes(d.fraisTypes.length ? d.fraisTypes : FRAIS_TYPES_INIT); setEleves(d.eleves); setAnnonces(d.annonces); setMessagesInternes(d.messagesInternes); setMessagesParents(d.messagesParents); setDemandes(d.demandes); setAnneesArchivees(d.anneesArchivees); }).catch((err) => { if (!annule) setErreurChargement(err.message); }).finally(() => { if (annule) return; setChargement(false); setTimeout(() => { pretPourSync.current = true; }, 0); }); return () => { annule = true; }; }, []);
  const [erreurSync, setErreurSync] = useState(null); const avecSuivi = (promesse) => promesse.catch((err) => setErreurSync(err.message || String(err)));
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncEcole(ecole, anneeScolaire)); }, [ecole, anneeScolaire]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncCodes(codes)); }, [codes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncCodesClasses(codesClasses)); }, [codesClasses]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncClasses(classes)); }, [classes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncMatieresParClasse(matieresParClasse)); }, [matieresParClasse]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncPersonnel(personnel)); }, [personnel]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncFraisTypes(fraisTypes)); }, [fraisTypes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncEleves(eleves)); }, [eleves]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncAnnonces(annonces)); }, [annonces]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncMessagesInternes(messagesInternes)); }, [messagesInternes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncMessagesParents(messagesParents)); }, [messagesParents]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncDemandes(demandes)); }, [demandes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncAnneesArchivees(anneesArchivees)); }, [anneesArchivees]);
  if (chargement) { return (<div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#FAF6EE" }}><div className="text-center"><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "#1B2A4A", borderTopColor: "transparent" }} /><p className="font-serif text-lg" style={{ color: "#1B2A4A" }}>Connexion base...</p>{erreurChargement && (<p className="mt-2 max-w-sm text-[13px]" style={{ color: "#8A2E2E" }}>Erreur: {erreurChargement}</p>)}</div></div>); }
  const contexteEcole = { ecole, setEcole, classes, setClasses, codes, setCodes, codesClasses, setCodesClasses, anneeScolaire, setAnneeScolaire, fraisTypes, setFraisTypes, matieresParClasse, setMatieresParClasse, messagesInternes, setMessagesInternes, anneesArchivees, setAnneesArchivees, messagesParents, setMessagesParents, annonces };
  const [classeEnseignantActive, setClasseEnseignantActive] = useState(null);
  const entrer = (roleChoisi, extra) => { setRole(roleChoisi); if (roleChoisi === "parent") setEleveIdActif(extra); if (roleChoisi === "enseignant" && extra && typeof extra === "string" && classes.includes(extra)) { setClasseEnseignantActive(extra); } else if (roleChoisi === "enseignant") { setClasseEnseignantActive(null); } };
  if (vue === "inscription") { return (<EcoleContext.Provider value={contexteEcole}><InscriptionEnLigne onRetour={() => setVue("connexion")} onSoumettre={(demande) => setDemandes((prev) => [demande, ...prev])} /></EcoleContext.Provider>); }
  if (!role) { return (<EcoleContext.Provider value={contexteEcole}><Connexion onEntrer={entrer} onInscription={() => setVue("inscription")} eleves={eleves} /></EcoleContext.Provider>); }
  const sortir = () => { setRole(null); setEleveIdActif(null); };
  const Ecran = { directeur: (<EspaceDirecteur eleves={eleves} personnel={personnel} setPersonnel={setPersonnel} annonces={annonces} setAnnonces={setAnnonces} demandes={demandes} setDemandes={setDemandes} setEleves={setEleves} />), enseignant: <EspaceEnseignant eleves={eleves} setEleves={setEleves} classeInitiale={classeEnseignantActive} />, secretaire: (<EspaceSecretaire eleves={eleves} setEleves={setEleves} demandes={demandes} setDemandes={setDemandes} annonces={annonces} setAnnonces={setAnnonces} />), parent: <EspaceParent eleves={eleves} setEleves={setEleves} eleveId={eleveIdActif} personnel={personnel} /> }[role];
  return (<EcoleContext.Provider value={contexteEcole}><div>{erreurSync && (<div className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between gap-2 px-4 py-2 text-[13px]" style={{ background: "#8A2E2E", color: "#FFFFFF" }}><span>⚠ Sauvegarde: {erreurSync}</span><button onClick={() => setErreurSync(null)} className="shrink-0 underline">Fermer</button></div>)}<div className="fixed bottom-4 right-4 z-20"><button onClick={sortir} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] shadow-md" style={{ background: "#1B2A4A", color: "#FAF6EE" }}><LogOut size={12} /> Changer de rôle</button></div>{Ecran}</div></EcoleContext.Provider>);
}
