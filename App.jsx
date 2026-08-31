
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
const ANNEE_INIT = "2026-2027";
const FRAIS_TYPES_INIT = [{ libelle: "Inscription", montant: 25000 }, { libelle: "Écolage", montant: 90000 }, { libelle: "Cantine", montant: 20000 }, { libelle: "T-shirt", montant: 5000 }, { libelle: "Uniforme", montant: 15000 }];
const EcoleContext = createContext(null);
function useEcole() { return useContext(EcoleContext); }
const MATIERES_INIT = [{ nom: "Communication orale", coef: 1 }, { nom: "Expression écrite", coef: 2 }, { nom: "Lecture", coef: 2 }, { nom: "Dictée", coef: 1 }, { nom: "EST", coef: 1 }];
const MATIERES_PAR_CLASSE_INIT = { CM1: MATIERES_INIT, CM2: MATIERES_INIT, CE2: MATIERES_INIT };
const SEUILS_MENTION = [{ max: 5, mention: "Médiocre" }, { max: 9, mention: "Insuffisant" }, { max: 11, mention: "Passable" }, { max: 13, mention: "Assez Bien" }, { max: 15, mention: "Bien" }, { max: 18, mention: "Très Bien" }, { max: 20, mention: "Excellent" }];
function mentionPour(moyenne) { const seuil = SEUILS_MENTION.find((s) => moyenne <= s.max); return seuil ? seuil.mention : "Excellent"; }
function formatDateFr() { const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]; const d = new Date(); return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`; }
function genererCodeEleve() { const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let suffixe = ""; for (let i = 0; i < 4; i++) { suffixe += caracteres[Math.floor(Math.random() * caracteres.length)]; } return `CSP${suffixe}`; }
const ELEVES_INIT = [];
const PERSONNEL_INIT = [{ nom: "Past. A. S. Boko", poste: "Directeur", telephone: "97 11 22 33", classe: "—" }, { nom: "Mme Houssou", poste: "Enseignante", telephone: "96 22 33 44", classe: "CM1" }, { nom: "Mlle Dossou", poste: "Secrétaire", telephone: "95 33 44 55", classe: "—" }];
const DEMANDES_INIT = [];
const ANNONCES_INIT = [{ titre: "Congés de Noël", texte: "Les congés de Noël débutent le 20 décembre.", date: "24 août 2026" }];
const ROLES = [{ id: "directeur", label: "Espace Administratif", icon: ShieldCheck, desc: "Vue d'ensemble et administration" }, { id: "enseignant", label: "Enseignant", icon: GraduationCap, desc: "Notes et absences de sa classe" }, { id: "secretaire", label: "Secrétaire", icon: ClipboardList, desc: "Inscriptions et frais scolaires" }, { id: "parent", label: "Espace Parent", icon: CircleUserRound, desc: "Suivi de mon enfant" }];

// UI HELPERS
function Btn({ children, onClick, variant="primary", small, icon:Icon, ...props }) {
  const styles = { primary: { background:"#1B2A4A", color:"#FAF6EE" }, gold: { background:"#C9A227", color:"#1B2A4A" }, ghost: { background:"#F1ECDD", color:"#1B2A4A" }, danger: { background:"#8A2E2E", color:"#FFF" } };
  return <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg font-medium ${small ? "px-2.5 py-1 text-[13px]" : "px-3.5 py-2 text-[14px]"} `} style={styles[variant]||styles.primary} {...props}>{Icon && <Icon size={14} />}{children}</button>
}
function Champ({ label, value, onChange, type="text", placeholder }) {
  return <div className="flex flex-col gap-1"><label className="text-[13px] font-medium" style={{color:"#1B2A4A"}}>{label}</label><input type={type} value={value} onChange={onChange} placeholder={placeholder} className="rounded-lg border px-3 py-2 outline-none text-[14px]" style={{borderColor:"#E7DEC8"}} /></div>
}
function Panel({ title, icon:Icon, children }) {
  return <div className="rounded-xl border bg-white p-4 shadow-sm" style={{borderColor:"#E7DEC8"}}><div className="mb-3 flex items-center gap-2 font-semibold" style={{color:"#1B2A4A"}}>{Icon && <Icon size={18} color="#C9A227" />}{title}</div>{children}</div>
}
function Coquille({ roleLabel, nav, actif, setActif, children }) {
  return <div className="min-h-screen flex" style={{background:"#FAF6EE"}}><aside className="w-[240px] shrink-0 border-r p-4 hidden md:block" style={{background:"#1B2A4A", borderColor:"#1B2A4A"}}><div className="text-white font-bold text-[18px] mb-6">CSP Sagesse Divine<br/><span className="text-[12px] font-normal opacity-70">{roleLabel}</span></div><nav className="space-y-1">{nav.map(n=><button key={n.id} onClick={()=>setActif(n.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[14px] ${actif===n.id ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"}`}><n.icon size={16} />{n.label}</button>)}</nav></aside><main className="flex-1 p-3 sm:p-5 space-y-4 overflow-y-auto"><div className="md:hidden flex gap-2 overflow-x-auto pb-2">{nav.map(n=><button key={n.id} onClick={()=>setActif(n.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] ${actif===n.id ? "bg-[#1B2A4A] text-white" : "bg-white border"}`} style={{borderColor:"#E7DEC8"}}>{n.label}</button>)}</div>{children}</main></div>
}
function Badge({ children, tone="ardoise" }) {
  const map = { ardoise: {bg:"#E9E6DE", color:"#1B2A4A"}, vert:{bg:"#D9EAD3", color:"#1B4D2A"}, or:{bg:"#FFF3CD", color:"#8A6D00"} };
  return <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={map[tone]||map.ardoise}>{children}</span>
}
function Stat({ label, value, tone }) {
  return <div className="rounded-xl border bg-white p-3" style={{borderColor:"#E7DEC8"}}><div className="text-[12px]" style={{color:"#9A8B67"}}>{label}</div><div className="text-[22px] font-bold" style={{color:"#1B2A4A"}}>{value}</div></div>
}

// CONNEXION
function Connexion({ onEntrer, onInscription, eleves }) {
  const { codes } = useEcole();
  const [code, setCode] = useState("");
  const [roleChoisi, setRoleChoisi] = useState("directeur");
  const [codeEleve, setCodeEleve] = useState("");
  const [erreur, setErreur] = useState("");
  const entrer = () => {
    if (roleChoisi==="parent") {
      const el = eleves.find(e=>e.id.toUpperCase()===codeEleve.toUpperCase().trim());
      if (!el) { setErreur("Code élève introuvable"); return; }
      onEntrer("parent", el.id); return;
    }
    if (code===codes[roleChoisi]) { onEntrer(roleChoisi); setErreur(""); }
    else setErreur("Code incorrect");
  };
  return <div className="min-h-screen flex items-center justify-center p-4" style={{background:"#FAF6EE"}}><div className="w-full max-w-[420px] rounded-2xl border bg-white p-6 shadow-lg" style={{borderColor:"#E7DEC8"}}><div className="text-center mb-6"><div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{background:"#1B2A4A"}}><School color="#C9A227" /></div><h1 className="font-bold text-[20px]" style={{color:"#1B2A4A"}}>CSP Sagesse Divine</h1><p className="text-[13px]" style={{color:"#9A8B67"}}>Tchaourou - Kèra</p></div><div className="grid grid-cols-2 gap-2 mb-4">{ROLES.map(r=><button key={r.id} onClick={()=>setRoleChoisi(r.id)} className={`rounded-xl border p-3 text-left ${roleChoisi===r.id ? "bg-[#1B2A4A] text-white" : "bg-white"}`} style={{borderColor:"#E7DEC8"}}><r.icon size={18} /><div className="mt-1 text-[13px] font-medium">{r.label}</div><div className="text-[11px] opacity-70">{r.desc}</div></button>)}</div>{roleChoisi==="parent" ? <Champ label="Code élève (ex: CSPAB12)" value={codeEleve} onChange={e=>setCodeEleve(e.target.value)} placeholder="Entrez le code" /> : <Champ label={`Code ${roleChoisi}`} value={code} onChange={e=>setCode(e.target.value)} type="password" placeholder="1234 / 5678 / 9012" />}{erreur && <div className="mt-2 text-[13px] text-red-700">{erreur}</div>}<Btn onClick={entrer} variant="primary" icon={KeyRound} className="w-full mt-4">Entrer dans {roleChoisi}</Btn><div className="mt-4 text-center"><button onClick={onInscription} className="text-[13px] underline" style={{color:"#1B2A4A"}}>Inscription en ligne - Nouvelle demande</button></div></div></div>
}

// INSCRIPTION EN LIGNE
function InscriptionEnLigne({ onRetour, onSoumettre }) {
  const [form, setForm] = useState({ prenom:"", nom:"", sexe:"M", naissance:"", classeSouhaitee:"CP", parrainNom:"", parrainTelephone:"", message:"" });
  const envoyer = () => {
    if (!form.prenom || !form.nom || !form.classeSouhaitee) { alert("Remplissez nom, prénom et classe"); return; }
    const demande = { id:`DEM${Date.now()}`, ...form, age: "", origine:"en_ligne", date: formatDateFr(), statut:"en_attente" };
    onSoumettre(demande); alert("Demande envoyée ! L'administration va la traiter."); onRetour();
  };
  return <div className="min-h-screen p-4 flex justify-center" style={{background:"#FAF6EE"}}><div className="w-full max-w-[520px]"><button onClick={onRetour} className="mb-3 flex items-center gap-1 text-[14px]" style={{color:"#1B2A4A"}}><ArrowLeft size={16} /> Retour</button><Panel title="Inscription en ligne" icon={FileText}><div className="grid grid-cols-2 gap-3"><Champ label="Prénom" value={form.prenom} onChange={e=>setForm({...form, prenom:e.target.value})} /><Champ label="Nom" value={form.nom} onChange={e=>setForm({...form, nom:e.target.value})} /><Champ label="Sexe (M/F)" value={form.sexe} onChange={e=>setForm({...form, sexe:e.target.value})} /><Champ label="Date naissance" value={form.naissance} onChange={e=>setForm({...form, naissance:e.target.value})} type="date" /><Champ label="Classe souhaitée" value={form.classeSouhaitee} onChange={e=>setForm({...form, classeSouhaitee:e.target.value})} /><Champ label="Nom parent/tuteur" value={form.parrainNom} onChange={e=>setForm({...form, parrainNom:e.target.value})} /><Champ label="Téléphone parent" value={form.parrainTelephone} onChange={e=>setForm({...form, parrainTelephone:e.target.value})} /></div><div className="mt-3"><Champ label="Message" value={form.message} onChange={e=>setForm({...form, message:e.target.value})} placeholder="Motivation..." /></div><Btn onClick={envoyer} icon={Send} variant="gold" className="mt-4">Envoyer la demande</Btn></Panel></div></div>
}

// ESPACE DIRECTEUR COMPLET CORRIGE
function EspaceDirecteur({ eleves, personnel, setPersonnel, annonces, setAnnonces, demandes, setDemandes, setEleves }) {
  const { ecole, setEcole, classes, setClasses, fraisTypes, setFraisTypes, anneeScolaire, setAnneeScolaire, codes, setCodes, matieresParClasse, setMatieresParClasse } = useEcole();
  const [onglet, setOnglet] = useState("dashboard");
  // Forms
  const [newClasse, setNewClasse] = useState("");
  const [newMatiereClasse, setNewMatiereClasse] = useState("CM1");
  const [newMatiereNom, setNewMatiereNom] = useState("");
  const [newMatiereCoef, setNewMatiereCoef] = useState(1);
  const [newFraisLib, setNewFraisLib] = useState("");
  const [newFraisMont, setNewFraisMont] = useState("");
  const [newPersNom, setNewPersNom] = useState(""); const [newPersPoste, setNewPersPoste] = useState("Enseignant"); const [newPersClasse, setNewPersClasse] = useState("CM1"); const [newPersTel, setNewPersTel] = useState("");
  const [newAnnonceTitre, setNewAnnonceTitre] = useState(""); const [newAnnonceTexte, setNewAnnonceTexte] = useState("");

  const nav = [{ id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard }, { id: "classes", label: "Classes", icon: School }, { id: "matieres", label: "Matières", icon: FileText }, { id: "frais", label: "Frais", icon: Wallet }, { id: "personnel", label: "Personnel", icon: Users }, { id: "annonces", label: "Annonces", icon: Megaphone }, { id: "demandes", label: "Demandes", icon: Inbox }, { id: "parametres", label: "Paramètres", icon: Settings }];

  return (<Coquille roleLabel="Espace Administratif" nav={nav} actif={onglet} setActif={setOnglet}>
    {onglet==="dashboard" && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Stat label="Élèves" value={eleves.length} /><Stat label="Classes" value={classes.length} /><Stat label="Annonces" value={annonces.length} /><Stat label="Demandes en attente" value={demandes.filter(d=>d.statut==="en_attente").length} /></div>}

    {onglet==="classes" && <Panel title="Gérer les classes" icon={School}>
      <div className="flex gap-2 mb-4"><input value={newClasse} onChange={e=>setNewClasse(e.target.value)} placeholder="Nouvelle classe ex: CE1" className="flex-1 rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}} /><Btn onClick={()=>{ if(!newClasse.trim()) return; if(classes.includes(newClasse.trim())) { alert("Existe déjà"); return; } setClasses([...classes, newClasse.trim()]); setNewClasse(""); }} icon={Plus}>Ajouter</Btn></div>
      <div className="grid grid-cols-2 gap-2">{classes.map((c,i)=><div key={i} className="flex justify-between items-center rounded border px-3 py-2 bg-white"><span>{c} ({eleves.filter(e=>(e.classe||"").toUpperCase()===c.toUpperCase()).length} élèves)</span><button onClick={()=>{ if(confirm(`Supprimer ${c} ?`)) setClasses(classes.filter(x=>x!==c)); }} className="text-red-600"><Trash2 size={16}/></button></div>)}</div>
    </Panel>}

    {onglet==="matieres" && <Panel title="Matières par classe" icon={FileText}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
        <select value={newMatiereClasse} onChange={e=>setNewMatiereClasse(e.target.value)} className="rounded border px-2 py-2" style={{borderColor:"#E7DEC8"}}>{classes.map(c=><option key={c} value={c}>{c}</option>)}</select>
        <input value={newMatiereNom} onChange={e=>setNewMatiereNom(e.target.value)} placeholder="Nom matière" className="rounded border px-3 py-2" style={{borderColor:"#E7DEC8"}} />
        <input value={newMatiereCoef} onChange={e=>setNewMatiereCoef(Number(e.target.value))} type="number" min="1" max="5" placeholder="Coef" className="rounded border px-3 py-2" style={{borderColor:"#E7DEC8"}} />
        <Btn onClick={()=>{ if(!newMatiereNom.trim()) return; const liste = matieresParClasse[newMatiereClasse]||[]; if(liste.find(m=>m.nom.toLowerCase()===newMatiereNom.trim().toLowerCase())){ alert("Matière existe déjà"); return; } setMatieresParClasse({...matieresParClasse, [newMatiereClasse]: [...liste, {nom:newMatiereNom.trim(), coef:Number(newMatiereCoef)||1}]}); setNewMatiereNom(""); }} icon={Plus}>Ajouter matière</Btn>
      </div>
      <div className="space-y-3">{classes.map(c=><div key={c} className="rounded border p-3 bg-white"><div className="font-medium">{c} - {(matieresParClasse[c]||[]).length} matières</div><div className="mt-2 flex flex-wrap gap-2">{(matieresParClasse[c]||[]).map((m,i)=><span key={i} className="flex items-center gap-1 rounded-full border px-2 py-1 text-[12px]">{m.nom} (coef {m.coef}) <button onClick={()=>{ const nv = (matieresParClasse[c]||[]).filter((_,idx)=>idx!==i); setMatieresParClasse({...matieresParClasse, [c]: nv}); }} className="text-red-600"><XCircle size={12}/></button></span>)}</div></div>)}</div>
    </Panel>}

    {onglet==="frais" && <Panel title="Frais scolaires" icon={Wallet}>
      <div className="flex gap-2 mb-4 flex-wrap"><input value={newFraisLib} onChange={e=>setNewFraisLib(e.target.value)} placeholder="Libellé ex: Inscription" className="rounded border px-3 py-2 flex-1" style={{borderColor:"#E7DEC8"}} /><input value={newFraisMont} onChange={e=>setNewFraisMont(e.target.value)} type="number" placeholder="Montant" className="rounded border px-3 py-2 w-[130px]" style={{borderColor:"#E7DEC8"}} /><Btn onClick={()=>{ if(!newFraisLib.trim() || !newFraisMont) return; setFraisTypes([...fraisTypes, {libelle:newFraisLib.trim(), montant:Number(newFraisMont)}]); setNewFraisLib(""); setNewFraisMont(""); }} icon={Plus}>Ajouter frais</Btn></div>
      <div className="space-y-2">{fraisTypes.map((f,i)=><div key={i} className="flex justify-between items-center rounded border px-3 py-2 bg-white"><span>{f.libelle} - <b>{f.montant} F</b></span><div className="flex gap-2"><button onClick={()=>{ const nv = prompt(`Nouveau montant pour ${f.libelle}`, f.montant); if(nv){ setFraisTypes(fraisTypes.map((x,idx)=> idx===i ? {...x, montant:Number(nv)} : x)); } }}><Pencil size={16}/></button><button onClick={()=>{ if(confirm(`Supprimer ${f.libelle} ?`)) setFraisTypes(fraisTypes.filter((_,idx)=>idx!==i)); }} className="text-red-600"><Trash2 size={16}/></button></div></div>)}</div>
      <p className="mt-3 text-[12px]" style={{color:"#9A8B67"}}>Modifier un montant mettra automatiquement à jour le "du" des élèves (le payé est conservé).</p>
    </Panel>}

    {onglet==="personnel" && <Panel title="Personnel" icon={Users}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4"><input value={newPersNom} onChange={e=>setNewPersNom(e.target.value)} placeholder="Nom complet" className="rounded border px-3 py-2" style={{borderColor:"#E7DEC8"}} /><select value={newPersPoste} onChange={e=>setNewPersPoste(e.target.value)} className="rounded border px-2 py-2" style={{borderColor:"#E7DEC8"}}><option>Directeur</option><option>Enseignant</option><option>Secrétaire</option><option>Surveillant</option></select><select value={newPersClasse} onChange={e=>setNewPersClasse(e.target.value)} className="rounded border px-2 py-2" style={{borderColor:"#E7DEC8"}}><option>—</option>{classes.map(c=><option key={c} value={c}>{c}</option>)}</select><input value={newPersTel} onChange={e=>setNewPersTel(e.target.value)} placeholder="Téléphone" className="rounded border px-3 py-2" style={{borderColor:"#E7DEC8"}} /></div><Btn onClick={()=>{ if(!newPersNom.trim()) return; setPersonnel([...personnel, {nom:newPersNom.trim(), poste:newPersPoste, classe:newPersClasse, telephone:newPersTel}]); setNewPersNom(""); setNewPersTel(""); }} icon={Plus}>Ajouter personnel</Btn>
      <div className="mt-4 space-y-2">{personnel.map((p,i)=><div key={i} className="flex justify-between items-center rounded border px-3 py-2 bg-white"><span>{p.nom} - {p.poste} {p.classe!=="—" ? `(${p.classe})`:""} - {p.telephone}</span><button onClick={()=>{ if(confirm(`Supprimer ${p.nom} ?`)) setPersonnel(personnel.filter((_,idx)=>idx!==i)); }} className="text-red-600"><Trash2 size={16}/></button></div>)}</div>
    </Panel>}

    {onglet==="annonces" && <Panel title="Annonces" icon={Megaphone}>
      <div className="space-y-2 mb-4"><input value={newAnnonceTitre} onChange={e=>setNewAnnonceTitre(e.target.value)} placeholder="Titre de l'annonce" className="w-full rounded border px-3 py-2" style={{borderColor:"#E7DEC8"}} /><textarea value={newAnnonceTexte} onChange={e=>setNewAnnonceTexte(e.target.value)} placeholder="Texte de l'annonce..." className="w-full rounded border px-3 py-2 h-[80px]" style={{borderColor:"#E7DEC8"}} /><Btn onClick={()=>{ if(!newAnnonceTitre.trim() || !newAnnonceTexte.trim()){ alert("Titre et texte obligatoires"); return; } setAnnonces([{titre:newAnnonceTitre.trim(), texte:newAnnonceTexte.trim(), date:formatDateFr()}, ...annonces]); setNewAnnonceTitre(""); setNewAnnonceTexte(""); }} icon={Send} variant="gold">Publier annonce</Btn></div>
      <div className="space-y-2">{annonces.map((a,i)=><div key={i} className="rounded border p-3 bg-white"><div className="flex justify-between"><b>{a.titre}</b><button onClick={()=>{ if(confirm("Supprimer ?")) setAnnonces(annonces.filter((_,idx)=>idx!==i)); }} className="text-red-600"><Trash2 size={14}/></button></div><div className="text-[11px]" style={{color:"#9A8B67"}}>{a.date}</div><p className="mt-1 text-[14px]">{a.texte}</p></div>)}</div>
    </Panel>}

    {onglet==="demandes" && <Panel title="Demandes d'inscription" icon={Inbox}><div className="space-y-2">{demandes.length===0 && <p>Aucune demande</p>}{demandes.map((d,i)=><div key={i} className="rounded border p-3 flex justify-between bg-white"><span>{d.prenom} {d.nom} - {d.classeSouhaitee} - {d.statut}</span><div className="flex gap-2">{d.statut==="en_attente" && <><Btn small variant="gold" onClick={()=>{ const code=genererCodeEleve(); setDemandes(prev=>prev.map(x=>x.id===d.id?{...x,statut:"validee"}:x)); setEleves(prev=>[...prev,{id:code, prenom:d.prenom, nom:d.nom, classe:d.classeSouhaitee, naissance:d.naissance, notes:[], absences:[], frais:fraisTypes.map(f=>({libelle:f.libelle, du:f.montant, paye:0})), messages:[], parent:{nom:d.parrainNom, telephone:d.parrainTelephone}, enseignant:"À affecter"}]); }}>Valider</Btn><Btn small variant="ghost" onClick={()=>setDemandes(prev=>prev.map(x=>x.id===d.id?{...x,statut:"refusee"}:x))}>Refuser</Btn></>}</div></div>)}</div></Panel>}

    {onglet==="parametres" && <Panel title="Paramètres" icon={Settings}><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Champ label="Code Directeur" value={codes.directeur} onChange={e=>setCodes({...codes, directeur:e.target.value})} /><Champ label="Code Enseignant" value={codes.enseignant} onChange={e=>setCodes({...codes, enseignant:e.target.value})} /><Champ label="Code Secrétaire" value={codes.secretaire} onChange={e=>setCodes({...codes, secretaire:e.target.value})} /></div><div className="mt-4 grid grid-cols-2 gap-3"><Champ label="Nom école" value={ecole.nom} onChange={e=>setEcole({...ecole, nom:e.target.value})} /><Champ label="Sigle" value={ecole.sigle} onChange={e=>setEcole({...ecole, sigle:e.target.value})} /><Champ label="Année scolaire" value={anneeScolaire} onChange={e=>setAnneeScolaire(e.target.value)} /></div></Panel>}
  </Coquille>);
}

// ESPACE SECRETAIRE
function EspaceSecretaire({ eleves, setEleves, demandes, setDemandes, annonces, setAnnonces }) {
  const { classes, fraisTypes } = useEcole();
  const [onglet, setOnglet] = useState("eleves");
  const [newEleve, setNewEleve] = useState({ prenom:"", nom:"", classe:"CP", naissance:"", parrainNom:"", parrainTel:"" });
  const nav = [{id:"eleves", label:"Élèves", icon:Users}, {id:"frais", label:"Frais", icon:Wallet}, {id:"demandes", label:"Demandes", icon:Inbox}, {id:"annonces", label:"Annonces", icon:Megaphone}];
  return <Coquille roleLabel="Secrétaire" nav={nav} actif={onglet} setActif={setOnglet}>
    {onglet==="eleves" && <Panel title="Gestion élèves" icon={Users}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3"><Champ label="Prénom" value={newEleve.prenom} onChange={e=>setNewEleve({...newEleve, prenom:e.target.value})} /><Champ label="Nom" value={newEleve.nom} onChange={e=>setNewEleve({...newEleve, nom:e.target.value})} /><select value={newEleve.classe} onChange={e=>setNewEleve({...newEleve, classe:e.target.value})} className="rounded border px-2 py-2" style={{borderColor:"#E7DEC8"}}>{classes.map(c=><option key={c} value={c}>{c}</option>)}</select><Champ label="Naissance" value={newEleve.naissance} onChange={e=>setNewEleve({...newEleve, naissance:e.target.value})} type="date" /><Champ label="Parent" value={newEleve.parrainNom} onChange={e=>setNewEleve({...newEleve, parrainNom:e.target.value})} /><Champ label="Tél parent" value={newEleve.parrainTel} onChange={e=>setNewEleve({...newEleve, parrainTel:e.target.value})} /></div>
      <Btn onClick={()=>{ if(!newEleve.prenom || !newEleve.nom) return alert("Nom prénom requis"); const code=genererCodeEleve(); setEleves([...eleves, {id:code, prenom:newEleve.prenom, nom:newEleve.nom, classe:newEleve.classe, naissance:newEleve.naissance, notes:[], absences:[], frais:fraisTypes.map(f=>({libelle:f.libelle, du:f.montant, paye:0})), messages:[], parent:{nom:newEleve.parrainNom, telephone:newEleve.parrainTel}}]); setNewEleve({prenom:"", nom:"", classe:"CP", naissance:"", parrainNom:"", parrainTel:""}); }} icon={Plus}>Inscrire élève</Btn>
      <div className="mt-4 space-y-1">{eleves.map(e=><div key={e.id} className="flex justify-between border rounded px-2 py-1 bg-white"><span>{e.prenom} {e.nom} - {e.classe} - {e.id}</span><span className="text-[11px]">{e.parent?.telephone}</span></div>)}</div>
    </Panel>}
    {onglet==="frais" && <Panel title="Encaissement frais" icon={Wallet}>{eleves.map(el=><div key={el.id} className="border rounded p-2 mb-2 bg-white"><div className="font-medium">{el.prenom} {el.nom} - {el.classe}</div><div className="grid grid-cols-1 gap-1 mt-1">{(el.frais||[]).map((f,i)=><div key={i} className="flex justify-between text-[13px]"><span>{f.libelle}: {f.paye}/{f.du}</span><Btn small onClick={()=>{ const m=prompt(`Montant payé pour ${f.libelle} (actuel ${f.paye})`, f.paye); if(m!==null){ setEleves(prev=>prev.map(x=> x.id===el.id ? {...x, frais: x.frais.map((ff,idx)=> idx===i ? {...ff, paye:Number(m), datePaiement: formatDateFr()} : ff)} : x)); } }}>Payer</Btn></div>)}</div></div>)}</Panel>}
    {onglet==="demandes" && <Panel title="Demandes" icon={Inbox}>{demandes.filter(d=>d.statut==="en_attente").map((d,i)=><div key={i} className="border rounded p-2 mb-2 flex justify-between bg-white"><span>{d.prenom} {d.nom} - {d.classeSouhaitee}</span><Btn small variant="gold" onClick={()=>{ const code=genererCodeEleve(); setDemandes(prev=>prev.map(x=>x.id===d.id?{...x,statut:"validee"}:x)); setEleves(prev=>[...prev,{id:code, prenom:d.prenom, nom:d.nom, classe:d.classeSouhaitee, naissance:d.naissance, notes:[], absences:[], frais:fraisTypes.map(f=>({libelle:f.libelle, du:f.montant, paye:0})), messages:[], parent:{nom:d.parrainNom, telephone:d.parrainTelephone}}]); }}>Valider</Btn></div>)}</Panel>}
    {onglet==="annonces" && <Panel title="Annonces" icon={Megaphone}><div className="space-y-2">{annonces.map((a,i)=><div key={i} className="border rounded p-2 bg-white"><b>{a.titre}</b><p className="text-[13px]">{a.texte}</p></div>)}</div></Panel>}
  </Coquille>
}

// ESPACE ENSEIGNANT
function EspaceEnseignant({ eleves, setEleves }) {
  const { classes, matieresParClasse } = useEcole();
  const [classeChoisie, setClasseChoisie] = useState(classes[0]||"CM1");
  const [matiere, setMatiere] = useState("");
  const [evalType, setEvalType] = useState("Devoir");
  const [mois, setMois] = useState("Octobre");
  const mesEleves = eleves.filter(e=>(e.classe||"").toUpperCase()===classeChoisie.toUpperCase());
  const matieres = matieresParClasse[classeChoisie]||[];
  const nav = [{id:"notes", label:"Notes", icon:FileText}, {id:"absences", label:"Absences", icon:CalendarClock}];
  const [onglet, setOnglet] = useState("notes");
  return <Coquille roleLabel="Enseignant" nav={nav} actif={onglet} setActif={setOnglet}>
    <Panel title={`Classe ${classeChoisie}`} icon={School}><select value={classeChoisie} onChange={e=>setClasseChoisie(e.target.value)} className="rounded border px-2 py-1 mb-3" style={{borderColor:"#E7DEC8"}}>{classes.map(c=><option key={c} value={c}>{c}</option>)}</select>
    {onglet==="notes" && <div><div className="flex flex-wrap gap-2 mb-3"><select value={matiere} onChange={e=>setMatiere(e.target.value)} className="rounded border px-2 py-1" style={{borderColor:"#E7DEC8"}}><option value="">Matière</option>{matieres.map(m=><option key={m.nom} value={m.nom}>{m.nom}</option>)}</select><select value={evalType} onChange={e=>setEvalType(e.target.value)} className="rounded border px-2 py-1" style={{borderColor:"#E7DEC8"}}><option>Devoir</option><option>Composition</option><option>Interro</option></select><select value={mois} onChange={e=>setMois(e.target.value)} className="rounded border px-2 py-1" style={{borderColor:"#E7DEC8"}}><option>Octobre</option><option>Novembre</option><option>Décembre</option><option>Janvier</option><option>Février</option><option>Mars</option><option>Avril</option><option>Mai</option></select></div>
    <div className="space-y-2">{mesEleves.map(el=><div key={el.id} className="flex justify-between items-center border rounded px-2 py-2 bg-white"><span>{el.prenom} {el.nom}</span><div className="flex gap-2"><input id={`note-${el.id}`} placeholder="Note/20" type="number" min="0" max="20" className="w-[70px] rounded border px-1 py-1" style={{borderColor:"#E7DEC8"}} /><Btn small onClick={()=>{ const v=document.getElementById(`note-${el.id}`).value; if(v==="") return; if(!matiere) return alert("Choisis matière"); const note={matiere, evaluation:evalType, mois, note20:Number(v), dateSaisie:formatDateFr()}; setEleves(prev=>prev.map(x=> x.id===el.id ? {...x, notes:[...x.notes, note]} : x)); document.getElementById(`note-${el.id}`).value=""; }}>Noter</Btn></div></div>)}</div></div>}
    {onglet==="absences" && <div className="space-y-2">{mesEleves.map(el=><div key={el.id} className="flex justify-between border rounded px-2 py-2 bg-white"><span>{el.prenom} {el.nom}</span><Btn small variant="ghost" onClick={()=>{ const motif=prompt("Motif absence ?")||""; setEleves(prev=>prev.map(x=> x.id===el.id ? {...x, absences:[...x.absences, {date:formatDateFr(), type:"Absence", motif}]} : x)); }}>Marquer absent</Btn></div>)}</div>}
    </Panel>
  </Coquille>
}

// ESPACE PARENT
function EspaceParent({ eleves, setEleves, eleveId, personnel }) {
  const { annonces, classes } = useEcole();
  const enfant = eleves.find(e=>e.id===eleveId);
  const [onglet, setOnglet] = useState("notes");
  const [message, setMessage] = useState("");
  const { messagesParents, setMessagesParents } = useEcole();
  if (!enfant) return <div>Élève introuvable</div>;
  const nav = [{id:"notes", label:"Notes", icon:FileText}, {id:"frais", label:"Frais", icon:Wallet}, {id:"annonces", label:"Annonces", icon:Megaphone}, {id:"messages", label:"Messages", icon:MessageSquare}];
  const moyenne = enfant.notes.length ? (enfant.notes.reduce((s,n)=>s+Number(n.note20),0)/enfant.notes.length).toFixed(2) : "-";
  return <Coquille roleLabel={`Parent - ${enfant.prenom} ${enfant.nom}`} nav={nav} actif={onglet} setActif={setOnglet}>
    <Panel title={`Bulletin ${enfant.prenom} - ${enfant.classe}`} icon={GraduationCap}><div className="mb-2">Moyenne: <b>{moyenne}</b> {moyenne!=="-" && <Badge tone="vert">{mentionPour(Number(moyenne))}</Badge>}</div><div className="space-y-1">{enfant.notes.map((n,i)=><div key={i} className="flex justify-between border rounded px-2 py-1 text-[13px] bg-white"><span>{n.matiere} - {n.evaluation} ({n.mois})</span><b>{n.note20}/20</b></div>)}{enfant.notes.length===0 && <p className="text-[13px]" style={{color:"#9A8B67"}}>Pas encore de notes</p>}</div></Panel>
    {onglet==="frais" && <Panel title="Frais" icon={Wallet}><div className="space-y-2">{(enfant.frais||[]).map((f,i)=><div key={i} className="flex justify-between border rounded px-3 py-2 bg-white"><span>{f.libelle}</span><span>{f.paye}/{f.du} F {f.paye>=f.du ? <Badge tone="vert">Soldé</Badge> : <Badge tone="or">Reste {f.du-f.paye}</Badge>}</span></div>)}</div></Panel>}
    {onglet==="annonces" && <Panel title="Annonces école" icon={Megaphone}><div className="space-y-2">{annonces.map((a,i)=><div key={i} className="border rounded p-3 bg-white"><b>{a.titre}</b><div className="text-[11px]" style={{color:"#9A8B67"}}>{a.date}</div><p>{a.texte}</p></div>)}</div></Panel>}
    {onglet==="messages" && <Panel title="Contacter l'administration" icon={MessageSquare}><div className="space-y-2 mb-3">{enfant.messages.map((m,i)=><div key={i} className="rounded px-3 py-2" style={{background:"#F1ECDD"}}><div className="flex justify-between text-[12px]" style={{color:"#9A8B67"}}><b style={{color:"#1B2A4A"}}>{m.auteur}</b>{m.date}</div><p>{m.texte}</p></div>)}</div><div className="flex gap-2"><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Votre message..." className="flex-1 rounded border px-3 py-2" style={{borderColor:"#E7DEC8"}} /><Btn onClick={()=>{ if(!message.trim()) return; setEleves(prev=>prev.map(e=> e.id===enfant.id ? {...e, messages:[...e.messages, {auteur:"Parent", texte:message, date:formatDateFr()}]} : e)); setMessagesParents([...messagesParents, {eleveId:enfant.id, nomEleve:`${enfant.prenom} ${enfant.nom}`, classe:enfant.classe, texte:message, date:formatDateFr(), lu:false}]); setMessage(""); }} icon={Send}>Envoyer</Btn></div></Panel>}
  </Coquille>
}

// SYNC (identique)
async function chargerToutesLesDonnees() {
  try {
    const [ecoleRows, codesRows, classesRows, matieresRows, personnelRows, elevesRows, notesRows, absencesRows, fraisTypesRows, fraisEleveRows, annoncesRows, messagesEleveRows, messagesParentsRows, messagesInternesRows, demandesRows, anneesRows] = await Promise.all([pgSelect("ecole", "&id=eq.1"), pgSelect("codes_acces"), pgSelect("classes", "&order=ordre"), pgSelect("matieres"), pgSelect("personnel"), pgSelect("eleves"), pgSelect("notes"), pgSelect("absences"), pgSelect("frais_types"), pgSelect("frais_eleve"), pgSelect("annonces", "&order=cree_le.desc"), pgSelect("messages_eleve"), pgSelect("messages_parents", "&order=cree_le.desc"), pgSelect("messages_internes", "&order=cree_le.desc"), pgSelect("demandes_inscription"), pgSelect("annees_archivees")]);
    const ecoleRow = (ecoleRows || [])[0];
    const ecole = ecoleRow ? { nom: ecoleRow.nom, sigle: ecoleRow.sigle, quartier: ecoleRow.quartier, commune: ecoleRow.commune, departement: ecoleRow.departement, directeur: ecoleRow.directeur, telephone: ecoleRow.telephone, telephoneDirecteur: ecoleRow.telephone_directeur, email: ecoleRow.email, devise: ecoleRow.devise, logoUrl: ecoleRow.logo_url } : ECOLE_INIT;
    const anneeScolaire = ecoleRow?.annee_scolaire || ANNEE_INIT;
    const codes = { directeur: "1234", enseignant: "5678", secretaire: "9012" }; (codesRows || []).forEach((c) => { codes[c.role] = c.code; });
    const classes = (classesRows || []).map((c) => c.nom); if (classes.length === 0) classes.push(...CLASSES_INIT);
    const matieresParClasse = {}; (matieresRows || []).forEach((m) => { if (!matieresParClasse[m.classe]) matieresParClasse[m.classe] = []; matieresParClasse[m.classe].push({ nom: m.nom, coef: m.coefficient }); }); if (Object.keys(matieresParClasse).length===0) { Object.assign(matieresParClasse, MATIERES_PAR_CLASSE_INIT); }
    const personnel = (personnelRows || []).map((p) => ({ nom: p.nom, poste: p.poste, classe: p.classe, telephone: p.telephone }));
    const fraisTypes = (fraisTypesRows || []).map((f) => ({ libelle: f.libelle, montant: Number(f.montant) }));
    const eleves = (elevesRows || []).map((e) => ({ id: e.id, prenom: e.prenom, nom: e.nom, sexe: e.sexe, naissance: e.naissance, classe: e.classe, enseignant: e.enseignant, parent: { nom: e.parrain_nom, telephone: e.parrain_telephone }, notes: (notesRows || []).filter((n) => n.eleve_id === e.id).map((n) => ({ matiere: n.matiere, evaluation: n.evaluation, mois: n.mois, note20: Number(n.note20), dateSaisie: n.date_saisie })), absences: (absencesRows || []).filter((a) => a.eleve_id === e.id).map((a) => ({ date: a.date, type: a.type, motif: a.motif })), frais: (fraisEleveRows || []).filter((f) => f.eleve_id === e.id).map((f) => ({ libelle: f.libelle, du: Number(f.du), paye: Number(f.paye), mode: f.mode, datePaiement: f.date_paiement })), messages: (messagesEleveRows || []).filter((m) => m.eleve_id === e.id).map((m) => ({ auteur: m.auteur, texte: m.texte, date: m.date })) }));
    const annonces = (annoncesRows || []).map((a) => ({ titre: a.titre, texte: a.texte, date: a.date }));
    const messagesInternes = (messagesInternesRows || []).map((m) => ({ destinataire: m.destinataire, texte: m.texte, date: m.date }));
    const messagesParents = (messagesParentsRows || []).map((m) => ({ eleveId: m.eleve_id, nomEleve: m.nom_eleve, classe: m.classe, texte: m.texte, date: m.date, lu: m.lu }));
    const demandes = (demandesRows || []).map((d) => ({ id: d.id, prenom: d.prenom, nom: d.nom, sexe: d.sexe, naissance: d.naissance, age: d.age, classeSouhaitee: d.classe_souhaitee, parrainNom: d.parrain_nom, parrainTelephone: d.parrain_telephone, message: d.message, origine: d.origine, date: d.date, statut: d.statut }));
    const anneesArchivees = (anneesRows || []).map((a) => ({ annee: a.annee, dateArchivage: a.date_archivage, eleves: a.donnees }));
    return { ecole, anneeScolaire, codes, classes, matieresParClasse, personnel: personnel.length?personnel:PERSONNEL_INIT, fraisTypes: fraisTypes.length?fraisTypes:FRAIS_TYPES_INIT, eleves, annonces: annonces.length?annonces:ANNONCES_INIT, messagesInternes, messagesParents, demandes, anneesArchivees };
  } catch(e) { throw e; }
}
async function syncEcole(ecole, anneeScolaire) { if (!ecole) return; await pgUpsert("ecole", [{ id: 1, nom: ecole.nom, sigle: ecole.sigle, quartier: ecole.quartier, commune: ecole.commune, departement: ecole.departement, directeur: ecole.directeur, telephone: ecole.telephone, telephone_directeur: ecole.telephoneDirecteur, email: ecole.email, devise: ecole.devise, logo_url: ecole.logoUrl, annee_scolaire: anneeScolaire }], "id"); }
async function syncCodes(codes) { const lignes = Object.entries(codes || {}).map(([role, code]) => ({ role, code })); await pgUpsert("codes_acces", lignes, "role"); }
async function syncClasses(classes) { const noms = classes || []; await pgUpsert("classes", noms.map((nom, i) => ({ nom, ordre: i })), "nom"); const existantes = (await pgSelect("classes")) || []; const aSupprimer = existantes.map((r) => r.nom).filter((n) => !noms.includes(n)); await pgDeleteIn("classes", "nom", aSupprimer); }
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
  const existants = (await pgSelect("eleves")) || []; const aSupprimer = existants.map((r) => r.id).filter((id) => !ids.includes(id)); if(aSupprimer.length) await pgDeleteIn("eleves", "id", aSupprimer);
  if(ids.length){
    // On supprime tout puis réinsère pour les enfants liés
    await pgDeleteToutes("notes","id"); await pgDeleteToutes("absences","id"); await pgDeleteToutes("frais_eleve","id"); await pgDeleteToutes("messages_eleve","id");
  }
  await pgInsert("notes", liste.flatMap((e) => (e.notes || []).map((n) => ({ eleve_id: e.id, matiere: n.matiere ?? null, evaluation: n.evaluation ?? null, mois: n.mois ?? null, note20: n.note20 ?? null, date_saisie: n.dateSaisie ?? null }))));
  await pgInsert("absences", liste.flatMap((e) => (e.absences || []).map((a) => ({ eleve_id: e.id, date: a.date ?? null, type: a.type ?? null, motif: a.motif ?? null }))));
  await pgInsert("frais_eleve", liste.flatMap((e) => (e.frais || []).map((f) => ({ eleve_id: e.id, libelle: f.libelle ?? null, du: f.du ?? 0, paye: f.paye ?? 0, mode: f.mode ?? null, date_paiement: f.datePaiement ?? null }))));
  await pgInsert("messages_eleve", liste.flatMap((e) => (e.messages || []).map((m) => ({ eleve_id: e.id, auteur: m.auteur ?? null, texte: m.texte ?? null, date: m.date ?? null }))));
}

export default function EcoleConnecteeCSP() {
  const [role, setRole] = useState(null); const [eleveIdActif, setEleveIdActif] = useState(null); const [vue, setVue] = useState("connexion"); const [eleves, setEleves] = useState(ELEVES_INIT); const [personnel, setPersonnel] = useState(PERSONNEL_INIT); const [annonces, setAnnonces] = useState(ANNONCES_INIT); const [demandes, setDemandes] = useState(DEMANDES_INIT); const [ecole, setEcole] = useState(ECOLE_INIT); const [classes, setClasses] = useState(CLASSES_INIT); const [codes, setCodes] = useState(CODES_INIT); const [anneeScolaire, setAnneeScolaire] = useState(ANNEE_INIT); const [fraisTypes, setFraisTypes] = useState(FRAIS_TYPES_INIT); const [matieresParClasse, setMatieresParClasse] = useState(MATIERES_PAR_CLASSE_INIT); const [messagesInternes, setMessagesInternes] = useState([]); const [anneesArchivees, setAnneesArchivees] = useState([]); const [messagesParents, setMessagesParents] = useState([]);
  const [chargement, setChargement] = useState(true); const [erreurChargement, setErreurChargement] = useState(null); const pretPourSync = useRef(false);
  useEffect(() => { let annule = false; chargerToutesLesDonnees().then((d) => { if (annule) return; setEcole(d.ecole); setAnneeScolaire(d.anneeScolaire); setCodes(d.codes); setClasses(d.classes); setMatieresParClasse(d.matieresParClasse); setPersonnel(d.personnel); setFraisTypes(d.fraisTypes); setEleves(d.eleves); setAnnonces(d.annonces); setMessagesInternes(d.messagesInternes); setMessagesParents(d.messagesParents); setDemandes(d.demandes); setAnneesArchivees(d.anneesArchivees); }).catch((err) => { if (!annule) setErreurChargement(err.message); }).finally(() => { if (annule) return; setChargement(false); setTimeout(() => { pretPourSync.current = true; }, 0); }); return () => { annule = true; }; }, []);
  const [erreurSync, setErreurSync] = useState(null); const avecSuivi = (promesse) => promesse.catch((err) => setErreurSync(err.message || String(err)));
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncEcole(ecole, anneeScolaire)); }, [ecole, anneeScolaire]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncCodes(codes)); }, [codes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncClasses(classes)); }, [classes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncMatieresParClasse(matieresParClasse)); }, [matieresParClasse]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncPersonnel(personnel)); }, [personnel]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncFraisTypes(fraisTypes)); }, [fraisTypes]);
  useEffect(() => {
    if (!pretPourSync.current) return;
    setEleves((prev) => prev.map((e) => {
      const actuels = e.frais || [];
      const maj = fraisTypes.map((ft) => {
        const ex = actuels.find((f) => f.libelle === ft.libelle);
        return ex ? { ...ex, du: ft.montant } : { libelle: ft.libelle, du: ft.montant, paye: 0 };
      });
      return { ...e, frais: maj };
    }));
  }, [fraisTypes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncEleves(eleves)); }, [eleves]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncAnnonces(annonces)); }, [annonces]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncMessagesInternes(messagesInternes)); }, [messagesInternes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncMessagesParents(messagesParents)); }, [messagesParents]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncDemandes(demandes)); }, [demandes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncAnneesArchivees(anneesArchivees)); }, [anneesArchivees]);
  if (chargement) { return (<div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#FAF6EE" }}><div className="text-center"><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "#1B2A4A", borderTopColor: "transparent" }} /><p className="font-serif text-lg" style={{ color: "#1B2A4A" }}>Connexion base...</p>{erreurChargement && (<p className="mt-2 max-w-sm text-[13px]" style={{ color: "#8A2E2E" }}>Erreur: {erreurChargement}</p>)}</div></div>); }
  const contexteEcole = { ecole, setEcole, classes, setClasses, codes, setCodes, anneeScolaire, setAnneeScolaire, fraisTypes, setFraisTypes, matieresParClasse, setMatieresParClasse, messagesInternes, setMessagesInternes, anneesArchivees, setAnneesArchivees, messagesParents, setMessagesParents, annonces };
  const entrer = (roleChoisi, extra) => { setRole(roleChoisi); if (roleChoisi === "parent") setEleveIdActif(extra); };
  if (vue === "inscription") { return (<EcoleContext.Provider value={contexteEcole}><InscriptionEnLigne onRetour={() => setVue("connexion")} onSoumettre={(demande) => setDemandes((prev) => [demande, ...prev])} /></EcoleContext.Provider>); }
  if (!role) { return (<EcoleContext.Provider value={contexteEcole}><Connexion onEntrer={entrer} onInscription={() => setVue("inscription")} eleves={eleves} /></EcoleContext.Provider>); }
  const sortir = () => { setRole(null); setEleveIdActif(null); };
  const Ecran = { directeur: (<EspaceDirecteur eleves={eleves} personnel={personnel} setPersonnel={setPersonnel} annonces={annonces} setAnnonces={setAnnonces} demandes={demandes} setDemandes={setDemandes} setEleves={setEleves} />), enseignant: <EspaceEnseignant eleves={eleves} setEleves={setEleves} />, secretaire: (<EspaceSecretaire eleves={eleves} setEleves={setEleves} demandes={demandes} setDemandes={setDemandes} annonces={annonces} setAnnonces={setAnnonces} />), parent: <EspaceParent eleves={eleves} setEleves={setEleves} eleveId={eleveIdActif} personnel={personnel} /> }[role];
  return (<EcoleContext.Provider value={contexteEcole}><div>{erreurSync && (<div className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between gap-2 px-4 py-2 text-[13px]" style={{ background: "#8A2E2E", color: "#FFFFFF" }}><span>⚠ Sauvegarde: {erreurSync}</span><button onClick={() => setErreurSync(null)} className="shrink-0 underline">Fermer</button></div>)}<div className="fixed bottom-4 right-4 z-20"><button onClick={sortir} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] shadow-md" style={{ background: "#1B2A4A", color: "#FAF6EE" }}><LogOut size={12} /> Changer de rôle</button></div>{Ecran}</div></EcoleContext.Provider>);
}
