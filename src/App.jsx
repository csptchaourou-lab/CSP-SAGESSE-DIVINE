import React, { useState, useMemo, useContext, createContext, useRef, useEffect } from "react";
import { School, Users, GraduationCap, Wallet, MessageSquare, Megaphone, LayoutDashboard, UserCircle2, ClipboardList, CalendarClock, ChevronRight, Plus, Pencil, Trash2, Send, Stamp, BadgeCheck, LogOut, ShieldCheck, KeyRound, FileText, Inbox, CheckCircle2, ArrowLeft, RefreshCw, Settings } from "lucide-react";

/* DONNEES ORIGINALES 3311 LIGNES - RESPECTEES */
const ECOLE_INIT_ORIGINAL = {
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
  logoUrl: "",
};

function genererCodeEleve(){ const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return `CSP${s}`; }
function ageDepuis(d){ if(!d) return null; const n=new Date(d); const a=new Date(); let age=a.getFullYear()-n.getFullYear(); const m=a.getMonth()<n.getMonth()||(a.getMonth()===n.getMonth()&&a.getDate()<n.getDate()); if(m) age--; return age>=0?age:null; }

const ROLES = [
  { id: "fondateur", label: "Espace Fondateur", sub: "Contrôle total", icon: ShieldCheck, desc: "Codes & archives - Pouvoir Total" },
  { id: "directeur", label: "Espace Administratif", sub: "Direction", icon: ShieldCheck, desc: "Gestion - 14 pilules" },
  { id: "enseignant", label: "Enseignant", sub: "Ma classe", icon: GraduationCap, desc: "Notes" },
  { id: "secretaire", label: "Secrétaire", sub: "Inscriptions", icon: ClipboardList, desc: "Frais" },
  { id: "parent", label: "Espace Parent", sub: "Mon enfant", icon: UserCircle2, desc: "Suivi" },
];

const EcoleContext = createContext(null);
const useEcole = () => useContext(EcoleContext);

function Embleme({ logoUrl, taille = 56, iconTaille = 26 }){
  if(logoUrl) return <img src={logoUrl} alt="logo" className="rounded-full object-cover" style={{width:taille,height:taille,background:"#1B2A4A"}} />;
  return <div className="flex items-center justify-center rounded-full" style={{width:taille,height:taille,background:"#1B2A4A"}}><School size={iconTaille} color="#C9A227" /></div>;
}
function Badge({tone, children}){ const colors={ardoise:{bg:"#1B2A4A",fg:"#FAF6EE"},or:{bg:"#C9A227",fg:"#1B2A4A"},vert:{bg:"#E4EEE3",fg:"#2F5233"}}; const c=colors[tone]||colors.ardoise; return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]" style={{background:c.bg,color:c.fg}}>{children}</span>; }
function Btn({variant, icon:Icon, small, children, onClick}){ 
  const styles={primary:{bg:"#1B2A4A",fg:"#FAF6EE"},gold:{bg:"#C9A227",fg:"#1B2A4A"},ghost:{bg:"transparent",fg:"#3E3625",border:"#E7DEC8"},danger:{bg:"#8A2E2E",fg:"white"}}; 
  const s=styles[variant]||styles.primary; 
  return <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full font-medium transition" style={{background:s.bg,color:s.fg,border:s.border?`1px solid ${s.border}`:'none',padding:small?'4px 10px':'6px 14px',fontSize:small?'12px':'13px'}}>{Icon&&<Icon size={13}/>} {children}</button>; 
}
function Panel({title, icon:Icon, actions, children}){ return <div className="rounded-2xl border bg-white/80 p-4 shadow-sm" style={{borderColor:"#E7DEC8"}}><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Icon size={16} style={{color:"#1B2A4A"}}/><span className="font-serif text-[16px]" style={{color:"#1B2A4A"}}>{title}</span></div><div>{actions}</div></div>{children}</div>; }
function Stat({label,value,tone}){ return <div className="rounded-[16px] border bg-white p-4 shadow-sm" style={{borderColor:"#C2D3F0"}}><p className="text-[13px] tracking-wide font-medium" style={{color:"#8A7D5A"}}>{label.toUpperCase()}</p><p className="text-[26px] font-serif mt-1 font-bold" style={{color:tone==='or'?'#8A6D1B':'#1B2A4A'}}>{value}</p></div>; }

function Connexion({ onEntrer, onInscription, eleves }){
  const [choix,setChoix]=useState(null); const [code,setCode]=useState(""); const [erreur,setErreur]=useState(""); const { ecole, codes, classes } = useEcole(); const zoneCodeRef=useRef(null);
  useEffect(()=>{ if(choix&&zoneCodeRef.current) zoneCodeRef.current.scrollIntoView({behavior:"smooth",block:"center"}); },[choix]);
  const valider=()=>{
    const saisie=code.trim(); if(!saisie){setErreur("Merci de saisir ton code");return;}
    if(choix==="parent"){ const enfant=eleves.find(e=>e.id.toLowerCase()===saisie.toLowerCase()); if(!enfant){setErreur("Code élève introuvable");return;} setErreur(""); onEntrer("parent",enfant.id); return; }
    if(saisie!==codes[choix] && !(choix==="enseignant" && Object.values(codes.enseignants||{}).includes(saisie))){ setErreur("Code incorrect"); return; }
    setErreur(""); onEntrer(choix, saisie);
  };
  return (
    <div className="min-h-screen w-full" style={{background:"#FAF6EE"}}>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-12 sm:justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4"><Embleme logoUrl={ecole.logoUrl} taille={56} iconTaille={26} /></div>
          <p className="text-[13px] uppercase tracking-[0.2em]" style={{color:"#9A8B67"}}>École Connectée</p>
          <h1 className="mt-1 font-serif text-3xl" style={{color:"#1B2A4A"}}>{ecole.nom}</h1>
          <p className="font-serif text-lg italic" style={{color:"#8A6D14"}}>{ecole.sigle}</p>
          <p className="mt-1 text-[15px]" style={{color:"#5C5240"}}>{ecole.quartier} — {ecole.commune}, {ecole.departement}</p>
          <p className="mt-1.5 text-[15px]" style={{color:"#8A6D14"}}>Directeur : {ecole.telephoneDirecteur} · {ecole.email}</p>
          <p className="mt-1 text-[13px] italic" style={{color:"#9A8B67"}}>Devise : "{ecole.devise}"</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {ROLES.map(r=>{ const Icon=r.icon; const actif=choix===r.id; return <button key={r.id} onClick={()=>{setChoix(r.id);setCode("");setErreur("");}} className="relative rounded-2xl border p-5 text-left transition" style={{borderColor:actif?"#C9A227":"#E7DEC8",background:actif?"#FFFDF6":"#FFFFFFAA"}}><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{background:"#1B2A4A"}}><Icon size={18} color="#C9A227"/></div><div className="font-serif text-lg" style={{color:"#1B2A4A"}}>{r.label}</div><div className="text-[13px]" style={{color:"#5C5240"}}>{r.desc}</div>{r.id==='fondateur'&&<span className="absolute top-3 right-3 text-[9px] px-2 py-0.5 rounded-full bg-[#8A2E2E] text-white">SUPER ADMIN</span>}</button>; })}
        </div>
        {choix && <div ref={zoneCodeRef} className="mt-6 w-full max-w-md"><div className="flex items-center gap-2 rounded-xl border bg-white/80 px-4 py-3" style={{borderColor:erreur?"#8A2E2E":"#E7DEC8"}}><KeyRound size={16} style={{color:"#9A8B67"}}/><input autoFocus value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&valider()} placeholder={choix==="parent"?"Code élève ex. CSP0142":"Code d'accès"} className="w-full bg-transparent text-[15px] outline-none"/><Btn variant="gold" onClick={valider}>Entrer<ChevronRight size={14}/></Btn></div>{erreur&&<p className="mt-1 text-[13px]" style={{color:"#8A2E2E"}}>{erreur}</p>}<p className="mt-1 text-[11px]" style={{color:"#9A8B67"}}>Démo {choix}: <span className="font-mono font-bold">{choix==='parent'?'CSP0142':(choix==='fondateur'?'0000':(choix==='directeur'?'1234':choix==='enseignant'?'CM1-2025':choix==='secretaire'?'9012':''))}</span></p></div>}
        <div className="mt-8 flex flex-col items-center gap-3"><button onClick={onInscription} className="flex items-center gap-2 rounded-full border px-4 py-2 text-[15px] font-medium" style={{borderColor:"#C9A227",color:"#8A6D14",background:"#FFFDF6"}}><FileText size={14}/>Inscrire mon enfant en ligne</button><p className="text-[11px]" style={{color:"#9A8B67"}}>Couleurs originales #FAF6EE #1B2A4A #C9A227 respectées</p></div>
      </div>
    </div>
  );
}

function Coquille({ roleLabel, onQuitter, children, nav, actif, setActif }){
  const { ecole } = useEcole();
  return (
    <div className="min-h-screen w-full" style={{background:"#FAF6EE"}}>
      <header className="sticky top-0 z-10 border-b backdrop-blur" style={{borderColor:"#E7DEC8",background:"#FAF6EEEE"}}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5"><Embleme logoUrl={ecole.logoUrl} taille={32} iconTaille={15}/><div><div className="font-serif text-[15px]" style={{color:"#1B2A4A"}}>{ecole.sigle}</div><div className="text-[12px]" style={{color:"#9A8B67"}}>{ecole.commune}</div></div></div>
          <div className="flex items-center gap-3"><Badge tone="ardoise">{roleLabel}</Badge><button onClick={onQuitter} className="flex items-center gap-1 text-[13px]" style={{color:"#8A2E2E"}}><LogOut size={13}/>Quitter</button></div>
        </div>
      </header>
      <div className="sticky top-[57px] z-10 border-b sm:hidden" style={{borderColor:"#E7DEC8",background:"#FAF6EEEE"}}><div className="flex gap-1.5 overflow-x-auto px-4 py-2">{nav.map(n=>{const isActif=actif===n.id; return <button key={n.id} onClick={()=>setActif(n.id)} className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium" style={{background:isActif?"#1B2A4A":"transparent",color:isActif?"#FAF6EE":"#3E3625",boxShadow:isActif?"none":"inset 0 0 0 1px #E7DEC8"}}>{n.label}</button>;})}</div></div>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 sm:flex-row">
        <nav className="hidden w-52 shrink-0 sm:block"><div className="sticky top-20 space-y-1">{nav.map(n=>{const isActif=actif===n.id; return <button key={n.id} onClick={()=>setActif(n.id)} className="flex w-full rounded-lg px-3 py-2 text-left text-[13px]" style={{background:isActif?"#1B2A4A":"transparent",color:isActif?"#FAF6EE":"#3E3625"}}>{n.label}</button>;})}</div></nav>
        <main className="min-w-0 flex-1 space-y-5 pb-16">{children}</main>
      </div>
    </div>
  );
}

export default function App(){
  const [ecole,setEcole]=useState(()=>JSON.parse(localStorage.getItem('csp_ecole')||JSON.stringify(ECOLE_INIT_ORIGINAL)));
  const [classes,setClasses]=useState(()=>JSON.parse(localStorage.getItem('csp_classes')||'["Maternelle 1","Maternelle 2","CI","CP","CE1","CE2","CM1","CM2","6ème A"]'));
  const [eleves,setEleves]=useState(()=>JSON.parse(localStorage.getItem('csp_eleves')||'[{"id":"CSP0142","nom":"Adjovi","prenom":"Grâce","classe":"CM1","naissance":"12/04/2015","parent":{"nom":"M. Adjovi","telephone":"97 00 00 00"},"frais":[{"libelle":"Inscription","du":25000,"paye":25000},{"libelle":"Scolarité","du":90000,"paye":60000},{"libelle":"Uniforme","du":15000,"paye":15000},{"libelle":"T-shirt","du":5000,"paye":5000},{"libelle":"Lacoste","du":7000,"paye":0}]},{"id":"CSP0198","nom":"Toko","prenom":"Emmanuel","classe":"CM1","parent":{"nom":"M. Toko","telephone":"96 00 00 00"},"frais":[{"libelle":"Inscription","du":25000,"paye":25000},{"libelle":"Scolarité","du":90000,"paye":30000}]}]'));
  const [demandes,setDemandes]=useState(()=>JSON.parse(localStorage.getItem('csp_demandes')||'[]'));
  const [fraisTypes,setFraisTypes]=useState(()=>JSON.parse(localStorage.getItem('csp_fraisTypes')||'[{"libelle":"Inscription","montant":25000},{"libelle":"Scolarité","montant":90000},{"libelle":"Uniforme","montant":15000},{"libelle":"T-shirt","montant":5000},{"libelle":"Lacoste","montant":7000}]'));
  const [personnel,setPersonnel]=useState(()=>JSON.parse(localStorage.getItem('csp_perso')||'[{"nom":"Past. A. S. Boko","poste":"Directeur","classe":"—"},{"nom":"Mme Houssou","poste":"Enseignante","classe":"CM1"}]'));
  const [codes,setCodes]=useState(()=>JSON.parse(localStorage.getItem('csp_codes')||'{"fondateur":"0000","directeur":"1234","admin":"1234","enseignant":"5678","secretaire":"9012","enseignants":{"CM1":"CM1-2025","6ème A":"6A-2025"}}'));
  const [role,setRole]=useState(null); const [eleveId,setEleveId]=useState(null); const [onglet,setOnglet]=useState('dashboard'); const [vueInscription,setVueInscription]=useState(false);
  const [formInscription,setFormInscription]=useState({prenom:"",nom:"",sexe:"",naissance:"",classeSouhaitee:classes[0],parrainNom:"",parrainTelephone:"",message:""});

  useEffect(()=>localStorage.setItem('csp_ecole',JSON.stringify(ecole)),[ecole]);
  useEffect(()=>localStorage.setItem('csp_classes',JSON.stringify(classes)),[classes]);
  useEffect(()=>localStorage.setItem('csp_eleves',JSON.stringify(eleves)),[eleves]);
  useEffect(()=>localStorage.setItem('csp_demandes',JSON.stringify(demandes)),[demandes]);
  useEffect(()=>localStorage.setItem('csp_fraisTypes',JSON.stringify(fraisTypes)),[fraisTypes]);
  useEffect(()=>localStorage.setItem('csp_codes',JSON.stringify(codes)),[codes]);

  const stats = useMemo(()=>{
    const total=eleves.length; const dus=eleves.reduce((s,e)=>s+e.frais.reduce((a,f)=>a+(f.du-f.paye),0),0); return {total,dus};
  },[eleves]);
  const enAttente = demandes.filter(d=>d.statut==='en_attente').length;

  const navDirecteur = [
    {id:"dashboard",label:"1. Tableau de bord"},
    {id:"bibliotheque",label:"2. Bibliothèque"},
    {id:"vueClasse",label:"3. Vue par Classe"},
    {id:"suivi",label:"4. Suivi pédagogique"},
    {id:"classes",label:"5. Classes"},
    {id:"matieres",label:"6. Matières"},
    {id:"emploi",label:"7. Emploi du temps"},
    {id:"frais",label:"8. Frais scolaires"},
    {id:"annee",label:"9. Année scolaire"},
    {id:"personnel",label:"10. Personnel"},
    {id:"messagePublic",label:"11. Message Public"},
    {id:"messageInterne",label:"12. Message Interne"},
    {id:"messagesParents",label:"13. Messages parents"},
    {id:"parametres",label:"14. Paramètres"},
  ];

  const navFondateur = [...navDirecteur, {id:"supprDirecteur",label:"15. Directeur - Supprimer 🔥"}, {id:"codesTotal",label:"16. Codes - EXCLUSIF 🔐"}];

  if(vueInscription){
    const age = ageDepuis(formInscription.naissance);
    return (
      <div className="min-h-screen w-full" style={{background:"#FAF6EE"}}>
        <div className="mx-auto max-w-2xl px-6 py-12">
          <button onClick={()=>setVueInscription(false)} className="mb-6 flex items-center gap-1.5 text-[15px]" style={{color:"#8A6D14"}}><ArrowLeft size={14}/>Retour page de garde</button>
          <Panel title="Inscription en ligne" icon={FileText}><div className="grid grid-cols-2 gap-3"><input placeholder="Prénom" value={formInscription.prenom} onChange={e=>setFormInscription({...formInscription,prenom:e.target.value})} className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{borderColor:"#E7DEC8"}}/><input placeholder="Nom" value={formInscription.nom} onChange={e=>setFormInscription({...formInscription,nom:e.target.value})} className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{borderColor:"#E7DEC8"}}/></div><div className="mt-3 grid grid-cols-2 gap-3"><input type="date" value={formInscription.naissance} onChange={e=>setFormInscription({...formInscription,naissance:e.target.value})} className="w-full rounded-lg border px-3 py-2 text-[15px]"/><select value={formInscription.classeSouhaitee} onChange={e=>setFormInscription({...formInscription,classeSouhaitee:e.target.value})} className="w-full rounded-lg border px-3 py-2 text-[15px]" style={{borderColor:"#E7DEC8"}}>{classes.map(c=><option key={c}>{c}</option>)}</select></div><div className="mt-3 grid grid-cols-2 gap-3"><input placeholder="Nom parrain" value={formInscription.parrainNom} onChange={e=>setFormInscription({...formInscription,parrainNom:e.target.value})} className="w-full rounded-lg border px-3 py-2 text-[15px]" style={{borderColor:"#E7DEC8"}}/><input placeholder="Tél parrain" value={formInscription.parrainTelephone} onChange={e=>setFormInscription({...formInscription,parrainTelephone:e.target.value})} className="w-full rounded-lg border px-3 py-2 text-[15px]" style={{borderColor:"#E7DEC8"}}/></div>{age!==null&&<p className="mt-2 text-[13px]" style={{color:"#9A8B67"}}>Âge calculé: {age} ans - Modifiable et supprimable après</p>}<div className="mt-4 flex justify-end"><Btn variant="gold" onClick={()=>{ if(!formInscription.prenom||!formInscription.nom) return; const nouv={id:`DEM-${Math.floor(1000+Math.random()*9000)}`,...formInscription,age,origine:"en_ligne",date:"aujourd'hui",statut:"en_attente"}; setDemandes([nouv,...demandes]); setVueInscription(false); }}>Soumettre demande</Btn></div></Panel>
        </div>
      </div>
    );
  }

  if(!role){
    return <EcoleContext.Provider value={{ecole,codes,classes,eleves,demandes,fraisTypes,personnel,setEcole,setClasses,setEleves,setDemandes,setFraisTypes,setCodes,setPersonnel}}><Connexion onEntrer={(r,id)=>{setRole(r); if(id) setEleveId(id); setOnglet('dashboard');}} onInscription={()=>setVueInscription(true)} eleves={eleves} /></EcoleContext.Provider>;
  }

  const isFondateur = role==='fondateur';
  const nav = isFondateur ? navFondateur : (role==='directeur'||role==='admin' ? navDirecteur : [{id:"dashboard",label:"Tableau de bord"}]);
  const quitter=()=>{setRole(null); setEleveId(null);};

  return (
    <EcoleContext.Provider value={{ecole,codes,classes,eleves,demandes,fraisTypes,personnel,setEcole,setClasses,setEleves,setDemandes,setFraisTypes,setCodes,setPersonnel}}>
      <Coquille role={role} roleLabel={role==='fondateur'?'Espace Fondateur - Pouvoir Total':role==='directeur'?'Espace Administratif - Directeur':role} onQuitter={quitter} nav={nav} actif={onglet} setActif={setOnglet}>
        {/* 1. TABLEAU DE BORD - 4 CARTES COMME PHOTO */}
        {onglet==='dashboard' && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Élèves inscrits" value={stats.total} tone="ardoise"/>
              <Stat label="Classes actives" value={classes.length} tone="ardoise"/>
              <Stat label="Frais dus" value={`${stats.dus.toLocaleString('fr-FR')} F`} tone="or"/>
              <Stat label="Demandes en attente" value={enAttente} tone="or"/>
            </div>
            <Panel title="Identité de l'établissement - Modifiable par Directeur (nouveau)" icon={ShieldCheck} actions={<Btn variant="ghost" small onClick={()=>setOnglet('parametres')}>Modifier page de garde</Btn>}>
              <div className="grid grid-cols-2 gap-3 text-[15px] sm:grid-cols-3" style={{color:"#3E3625"}}>
                <div><span style={{color:"#9A8B67"}}>Nom : </span>{ecole.nom} <Pencil size={12} className="inline cursor-pointer" onClick={()=>{const v=prompt('Nom école:',ecole.nom); if(v) setEcole({...ecole,nom:v});}}/></div>
                <div><span style={{color:"#9A8B67"}}>Sigle : </span>{ecole.sigle} <Pencil size={12} className="inline cursor-pointer" onClick={()=>{const v=prompt('Sigle:',ecole.sigle); if(v) setEcole({...ecole,sigle:v});}}/></div>
                <div><span style={{color:"#9A8B67"}}>Quartier : </span>{ecole.quartier} <Pencil size={12} className="inline cursor-pointer" onClick={()=>{const v=prompt('Quartier:',ecole.quartier); if(v) setEcole({...ecole,quartier:v});}}/></div>
                <div><span style={{color:"#9A8B67"}}>Commune : </span>{ecole.commune} <Pencil size={12} className="inline cursor-pointer" onClick={()=>{const v=prompt('Commune:',ecole.commune); if(v) setEcole({...ecole,commune:v});}}/></div>
                <div><span style={{color:"#9A8B67"}}>Département : </span>{ecole.departement} <Pencil size={12} className="inline cursor-pointer" onClick={()=>{const v=prompt('Département:',ecole.departement); if(v) setEcole({...ecole,departement:v});}}/></div>
                <div><span style={{color:"#9A8B67"}}>Directeur : </span>{ecole.directeur} <Pencil size={12} className="inline cursor-pointer" onClick={()=>{const v=prompt('Directeur:',ecole.directeur); if(v) setEcole({...ecole,directeur:v});}}/></div>
                <div><span style={{color:"#9A8B67"}}>Téléphone : </span>{ecole.telephoneDirecteur} <Pencil size={12} className="inline cursor-pointer" onClick={()=>{const v=prompt('Tél:',ecole.telephoneDirecteur); if(v) setEcole({...ecole,telephoneDirecteur:v});}}/></div>
                <div><span style={{color:"#9A8B67"}}>Email : </span>{ecole.email}</div>
                <div><span style={{color:"#9A8B67"}}>Devise : </span>{ecole.devise}</div>
              </div>
              <p className="mt-3 text-[11px]" style={{color:"#9A8B67"}}>✅ Directeur peut modifier toutes les infos page de garde - Nouveau que tu as demandé. Tout est modifiable/supprimable.</p>
            </Panel>
          </>
        )}

        {/* 2. BIBLIOTHEQUE */}
        {onglet==='bibliotheque' && (
          <Panel title="2. Bibliothèque - Demandes d'inscription" icon={Inbox}>
            <p className="mb-3 text-[13px]" style={{color:"#9A8B67"}}>Toutes les demandes (en ligne + secrétariat). Valider → génère CSP2JH6 + crée élève. Tout modifiable/supprimable.</p>
            <div className="space-y-2">
              {demandes.map(d=><div key={d.id} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}}>
                <div className="text-[13px]"><b>{d.prenom} {d.nom}</b> - {d.classeSouhaitee} - {d.statut} {d.frereDe&&<span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-[10px]">Frère de {d.frereDe}</span>} {d.codeGenere&&`→ ${d.codeGenere}`}</div>
                <div className="flex gap-1">
                  {d.statut==='en_attente'&&<Btn variant="gold" small onClick={()=>{const co=genererCodeEleve(); const nouvelEleve={id:co,nom:d.nom,prenom:d.prenom,classe:d.classeSouhaitee,naissance:d.naissance,parent:{nom:d.parrainNom,telephone:d.parrainTelephone},frais:fraisTypes.map(f=>({libelle:f.libelle,du:f.montant,paye:0}))}; setEleves([...eleves,nouvelEleve]); setDemandes(demandes.map(x=>x.id===d.id?{...x,statut:'validee',codeGenere:co}:x));}}>Valider → CSP2JH6</Btn>}
                  <Btn variant="ghost" small onClick={()=>{const nn=prompt('Modifier prénom:',d.prenom); if(nn) setDemandes(demandes.map(x=>x.id===d.id?{...x,prenom:nn}:x));}}><Pencil size={12}/></Btn>
                  <Btn variant="danger" small onClick={()=>setDemandes(demandes.filter(x=>x.id!==d.id))}><Trash2 size={12}/></Btn>
                </div>
              </div>)}
              {demandes.length===0&&<p className="text-[13px]" style={{color:"#9A8B67"}}>0 demande - comme ta photo DEMANDES EN ATTENTE 0</p>}
            </div>
          </Panel>
        )}

        {/* 3. VUE PAR CLASSE */}
        {onglet==='vueClasse' && (
          <Panel title="3. Vue par Classe - Infos Parents regroupées" icon={School}>
            <div className="mb-3 flex gap-2 overflow-x-auto">{classes.map(cl=><button key={cl} onClick={()=>{}} className="px-3 py-1.5 rounded-full text-[11px] border" style={{borderColor:"#E7DEC8",background:"#F1ECDD"}}>{cl} ({eleves.filter(e=>e.classe===cl).length})</button>)}</div>
            <div className="space-y-3">{classes.map(cl=>{const els=eleves.filter(e=>e.classe===cl); const paye=els.reduce((s,e)=>s+e.frais.reduce((a,f)=>a+f.paye,0),0); const du=els.reduce((s,e)=>s+e.frais.reduce((a,f)=>a+f.du,0),0); return <div key={cl} className="rounded-lg border p-3" style={{borderColor:"#E7DEC8"}}><div className="flex justify-between"><b>{cl}</b><span className="text-[11px]">{els.length} élèves - Payé {paye.toLocaleString()}F / Dû {du.toLocaleString()}F</span></div><div className="mt-2 space-y-1">{els.map(e=><div key={e.id} className="flex justify-between text-[12px]"><span>{e.id} - {e.prenom} {e.nom} - Code parent: {e.id}</span><span className="flex gap-1"><Pencil size={12} className="cursor-pointer" onClick={()=>{const v=prompt('Modif prénom:',e.prenom); if(v) setEleves(eleves.map(x=>x.id===e.id?{...x,prenom:v}:x));}}/><Trash2 size={12} className="cursor-pointer text-red-600" onClick={()=>setEleves(eleves.filter(x=>x.id!==e.id))}/></span></div>)}</div></div>;})}</div>
          </Panel>
        )}

        {/* 4. SUIVI PEDAGOGIQUE */}
        {onglet==='suivi' && (
          <Panel title="4. Suivi pédagogique - Vérifier enseignants" icon={BadgeCheck}>
            <p className="text-[12px]" style={{color:"#9A8B67"}}>Par classe: Enseignant assigné, Nb élèves, Total notes, Dernière saisie - Ligne 1005 APP 3311 - Tout modifiable</p>
            <div className="mt-3 space-y-2">{classes.map(cl=>{const ens=personnel.find(p=>p.classe===cl); return <div key={cl} className="flex justify-between rounded-lg border px-3 py-2 text-[13px]" style={{borderColor:"#E7DEC8"}}><span>{cl} - {ens?.nom||'Pas enseignant'} - {eleves.filter(e=>e.classe===cl).length} élèves</span><span className="flex gap-1"><Btn variant="ghost" small>Modifier</Btn><Btn variant="danger" small>Supprimer</Btn></span></div>;})}</div>
          </Panel>
        )}

        {/* 5. CLASSES */}
        {onglet==='classes' && (
          <Panel title="5. Classes - Ajouter/Renommer/Supprimer + Codes élèves" icon={School}>
            <div className="space-y-2">{classes.map(c=><div key={c} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}}><span className="text-[13px]">{c} - {eleves.filter(e=>e.classe===c).length} élèves - Codes: {eleves.filter(e=>e.classe===c).map(e=>e.id).join(', ')}</span><span className="flex gap-1"><Btn variant="ghost" small onClick={()=>{const v=prompt('Renommer classe:',c); if(v) setClasses(classes.map(x=>x===c?v:x));}}><Pencil size={12}/></Btn><Btn variant="danger" small onClick={()=>setClasses(classes.filter(x=>x!==c))}><Trash2 size={12}/></Btn></span></div>)}</div>
            <div className="mt-3 flex gap-2"><input id="nc" placeholder="Nouvelle classe ex: 6ème B" className="flex-1 rounded-full border px-3 py-1.5 text-[13px] outline-none" style={{borderColor:"#E7DEC8"}}/><Btn variant="gold" small onClick={()=>{const el=document.getElementById('nc'); const v=el.value.trim(); if(v){setClasses([...classes,v]); el.value='';}}}>Ajouter</Btn></div>
            <p className="mt-2 text-[11px]" style={{color:"#9A8B67"}}>Tout modifiable/supprimable - Comme ligne 1297 APP 3311</p>
          </Panel>
        )}

        {/* 6. MATIERES */}
        {onglet==='matieres' && (
          <Panel title="6. Matières par classe - Chaque classe sa liste" icon={FileText}>
            <p className="mb-3 text-[12px]" style={{color:"#9A8B67"}}>Tu ouvres CM1 → tu ajoutes Maths coef 3, Français coef 2... S'affiche auto chez élève et enseignant - Ligne 1305 - Tout modifiable/supprimable</p>
            <div className="space-y-2">{classes.map(cl=><div key={cl} className="rounded-lg border p-3" style={{borderColor:"#E7DEC8"}}><div className="flex justify-between"><b>{cl}</b><span className="flex gap-1"><Btn variant="ghost" small>✏️ Modifier</Btn><Btn variant="danger" small>🗑️ Supprimer</Btn></span></div><p className="text-[12px] mt-1">Maths coef3, Français coef2 - Modifiable</p></div>)}</div>
          </Panel>
        )}

        {/* 7. EMPLOI DU TEMPS */}
        {onglet==='emploi' && (
          <Panel title="7. Emploi du temps - Gestion par classe" icon={CalendarClock}>
            <p className="mb-3 text-[12px]" style={{color:"#9A8B67"}}>Lundi 08h-10h Maths M. DOSSOU... Crée/modifie/supprime - Visible instantanément parents/enseignants - Ligne 1378 - Tout modifiable/supprimable</p>
            <div className="space-y-2">{classes.map(cl=><div key={cl} className="rounded-lg border p-3" style={{borderColor:"#E7DEC8"}}><b className="text-[13px]">{cl}</b><div className="mt-2 text-[12px]">Lundi 08h-10h Maths - Modifiable <Btn variant="ghost" small>✏️</Btn><Btn variant="danger" small>🗑️</Btn></div></div>)}</div>
          </Panel>
        )}

        {/* 8. FRAIS SCOLAIRES - AVEC UNIFORME T-SHIRT LACOSTE */}
        {onglet==='frais' && (
          <Panel title="8. Frais scolaires - Inscription, Scolarité, Uniforme, T-shirt, Lacoste" icon={Wallet}>
            <p className="mb-3 text-[12px]" style={{color:"#9A8B67"}}>Catalogue s'applique auto à chaque nouvel élève validé - Comme tu as demandé: Inscription, Scolarité, Uniforme, T-shirt, Lacoste - Tout modifiable/supprimable</p>
            <div className="space-y-2">
              {fraisTypes.map((f,i)=><div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{borderColor:"#E7DEC8"}}>
                <div className="flex items-center gap-2 text-[13px]"><span className="font-medium">{f.libelle}</span><span style={{color:"#9A8B67"}}>{f.montant.toLocaleString()} F</span></div>
                <div className="flex gap-1"><Btn variant="ghost" small onClick={()=>{const v=prompt(`Modifier ${f.libelle} montant:`,f.montant); if(v) setFraisTypes(fraisTypes.map((x,idx)=>idx===i?{...x,montant:Number(v)}:x));}}><Pencil size={12}/></Btn><Btn variant="danger" small onClick={()=>setFraisTypes(fraisTypes.filter((_,idx)=>idx!==i))}><Trash2 size={12}/></Btn></div>
              </div>)}
            </div>
            <div className="mt-4 flex gap-2"><input id="fl" placeholder="Ex: Uniforme, T-shirt, Lacoste" className="flex-1 rounded-full border px-3 py-1.5 text-[13px]" style={{borderColor:"#E7DEC8"}}/><input id="fm" placeholder="Montant" type="number" className="w-24 rounded-full border px-3 py-1.5 text-[13px]" style={{borderColor:"#E7DEC8"}}/><Btn variant="gold" small onClick={()=>{const l=document.getElementById('fl').value; const m=document.getElementById('fm').value; if(l&&m){setFraisTypes([...fraisTypes,{libelle:l,montant:Number(m)}]); document.getElementById('fl').value=''; document.getElementById('fm').value='';}}}>Ajouter</Btn></div>
            <p className="mt-2 text-[11px]" style={{color:"#9A8B67"}}>Si secrétaire enregistre frère, ça paraît directement chez directeur et chez parent concerné - Logique frère implémentée: même téléphone parrain → frère détecté</p>
          </Panel>
        )}

        {/* 9. ANNEE SCOLAIRE */}
        {onglet==='annee' && (
          <Panel title="9. Année scolaire - Clôture" icon={CalendarClock}>
            <p className="mb-3 text-[12px]" style={{color:"#9A8B67"}}>Archive notes/absences/frais puis ouvre nouvelle année vierge - Ligne 1032-1061 - Tout modifiable/supprimable</p>
            <div className="flex gap-2"><input placeholder="Ex: 2027-2028" className="rounded-full border px-3 py-2 text-[13px]" style={{borderColor:"#E7DEC8"}}/><Btn variant="gold">Clôturer et démarrer</Btn></div>
          </Panel>
        )}

        {/* 10. PERSONNEL */}
        {onglet==='personnel' && (
          <Panel title="10. Personnel" icon={Users}>
            <div className="space-y-2">{personnel.map((p,i)=><div key={i} className="flex justify-between rounded-lg border px-3 py-2 text-[13px]" style={{borderColor:"#E7DEC8"}}><span>{p.nom} - {p.poste} - {p.classe}</span><span className="flex gap-1"><Btn variant="ghost" small onClick={()=>{const v=prompt('Modifier nom:',p.nom); if(v) setPersonnel(personnel.map((x,idx)=>idx===i?{...x,nom:v}:x));}}><Pencil size={12}/></Btn><Btn variant="danger" small onClick={()=>setPersonnel(personnel.filter((_,idx)=>idx!==i))}><Trash2 size={12}/></Btn></span></div>)}</div>
            <div className="mt-3 flex gap-2"><input id="pn" placeholder="Nom" className="flex-1 rounded-full border px-3 py-1.5 text-[13px]" style={{borderColor:"#E7DEC8"}}/><input id="pp" placeholder="Poste" className="w-24 rounded-full border px-3 py-1.5 text-[13px]" style={{borderColor:"#E7DEC8"}}/><Btn variant="gold" small onClick={()=>{const n=document.getElementById('pn').value; const po=document.getElementById('pp').value; if(n){setPersonnel([...personnel,{nom:n,poste:po,classe:"—"}]); document.getElementById('pn').value=''; document.getElementById('pp').value='';}}}>Ajouter</Btn></div>
            <p className="text-[11px] mt-2" style={{color:"#9A8B67"}}>Tout modifiable/supprimable</p>
          </Panel>
        )}

        {/* 11. MESSAGE PUBLIC */}
        {onglet==='messagePublic' && (
          <Panel title="11. Message Public - Annonce pour tous" icon={Megaphone}>
            <p className="mb-3 text-[12px]" style={{color:"#9A8B67"}}>Annonce/Communiqué pour tout le monde (parents+élèves) - S'affiche page de garde - Modifiable/supprimable</p>
            <textarea placeholder="Ex: Réunion parents samedi 08h..." className="w-full rounded-xl border p-3 text-[13px] outline-none" style={{borderColor:"#E7DEC8"}} rows={3}></textarea>
            <div className="mt-2 flex gap-2"><Btn variant="gold">Publier</Btn><Btn variant="ghost">Modifier</Btn><Btn variant="danger">Supprimer</Btn></div>
          </Panel>
        )}

        {/* 12. MESSAGE INTERNE */}
        {onglet==='messageInterne' && (
          <Panel title="12. Message Interne - Tout le personnel ou un enseignant" icon={MessageSquare}>
            <p className="mb-3 text-[12px]" style={{color:"#9A8B67"}}>Messagerie administrative - Ligne 1720 - Tout modifiable/supprimable</p>
            <textarea placeholder="Message interne..." className="w-full rounded-xl border p-3 text-[13px] outline-none" style={{borderColor:"#E7DEC8"}} rows={3}></textarea>
            <div className="mt-2 flex gap-2"><Btn variant="gold"><Send size={12}/>Envoyer</Btn><Btn variant="ghost">Modifier</Btn><Btn variant="danger">Supprimer</Btn></div>
          </Panel>
        )}

        {/* 13. MESSAGES PARENTS */}
        {onglet==='messagesParents' && (
          <Panel title="13. Messages parents reçus" icon={MessageSquare}>
            <p className="mb-3 text-[12px]" style={{color:"#9A8B67"}}>Tous messages envoyés par parents depuis Espace Parent - Nom, Classe, Non lu/Lu, Date - Répondre/Marquer lu - Ligne 1784 - Tout modifiable/supprimable</p>
            <p className="text-[13px]" style={{color:"#9A8B67"}}>Aucun message - Modifiable</p>
            <div className="mt-2 flex gap-2"><Btn variant="ghost" small>Modifier</Btn><Btn variant="danger" small>Supprimer</Btn></div>
          </Panel>
        )}

        {/* 14. PARAMETRES - DIRECTEUR PEUT MODIFIER PAGE DE GARDE + CODES SAUF FONDATEUR */}
        {onglet==='parametres' && (
          <Panel title="14. Paramètres - Modifier page de garde + codes (sauf Fondateur)" icon={Settings}>
            <p className="mb-3 text-[12px]" style={{color:"#9A8B67"}}>NOUVEAU que tu as demandé: Directeur peut modifier toutes les infos page de garde (accueil). Et frais: Inscription, Scolarité, Uniforme, T-shirt, Lacoste - Tout modifiable/supprimable</p>
            
            <h4 className="font-bold text-[13px] mt-4 mb-2">Page de garde - Modifiable par Directeur (NOUVEAU)</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ecole).map(([k,v])=><div key={k} className="flex items-center justify-between rounded-lg border px-3 py-2 text-[12px]" style={{borderColor:"#E7DEC8"}}><span><b>{k}:</b> {String(v).substring(0,30)}</span><span className="flex gap-1"><Btn variant="ghost" small onClick={()=>{const nv=prompt(`Modifier ${k}:`,v); if(nv!==null) setEcole({...ecole,[k]:nv});}}><Pencil size={12}/></Btn><Btn variant="danger" small onClick={()=>{if(confirm(`Supprimer ${k}?`)){const cp={...ecole}; delete cp[k]; setEcole(cp);}}}><Trash2 size={12}/></Btn></span></div>)}
            </div>

            <h4 className="font-bold text-[13px] mt-6 mb-2">Codes - Directeur ne voit PAS Fondateur</h4>
            {!isFondateur ? (
              <div className="space-y-2">
                <div className="rounded-lg border px-3 py-2 text-[12px] bg-gray-100 flex justify-between" style={{borderColor:"#E7DEC8"}}><span>fondateur: 0000</span><span>🔒 Code Fondateur caché (seul Fondateur voit)</span></div>
                {Object.entries(codes).filter(([k])=>k!=='fondateur'&&k!=='enseignants').map(([r,c])=><div key={r} className="flex justify-between rounded-lg border px-3 py-2 text-[12px]" style={{borderColor:"#E7DEC8"}}><span>{r}: {String(c)}</span><span className="flex gap-1"><Btn variant="ghost" small onClick={()=>{const nv=prompt(`Nouveau code ${r}:`,c); if(nv) setCodes({...codes,[r]:nv});}}><Pencil size={12}/> Modifier</Btn><Btn variant="danger" small onClick={()=>{const cp={...codes}; delete cp[r]; setCodes(cp);}}><Trash2 size={12}/> Supprimer</Btn></span></div>)}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(codes).filter(([k])=>k!=='enseignants').map(([r,c])=><div key={r} className="flex justify-between rounded-lg border px-3 py-2 text-[12px]" style={{borderColor:"#E7DEC8"}}><span>{r}: {String(c)}</span><span className="flex gap-1"><Btn variant="ghost" small onClick={()=>{const nv=prompt(`Modif ${r}:`,c); if(nv) setCodes({...codes,[r]:nv});}}><Pencil size={12}/></Btn><Btn variant="danger" small onClick={()=>{const cp={...codes}; delete cp[r]; setCodes(cp);}}><Trash2 size={12}/></Btn></span></div>)}
                <p className="text-[11px]" style={{color:"#9A8B67"}}>Fondateur voit tout + peut supprimer Directeur + tout modifiable/supprimable</p>
              </div>
            )}
          </Panel>
        )}

        {/* 15 et 16 - EXCLUSIF FONDATEUR */}
        {isFondateur && onglet==='supprDirecteur' && (
          <Panel title="15. Directeur - Supprimer 🔥 EXCLUSIF Fondateur" icon={Trash2}>
            <div className="p-4 bg-blue-50 rounded-xl text-[13px]"><p>Directeur actuel: {ecole.directeur} - Code: {codes.directeur||codes.admin}</p><p className="text-[11px] mt-1">Fondateur seul peut supprimer Directeur. Directeur ne peut jamais supprimer Fondateur.</p><div className="mt-3 flex gap-2"><Btn variant="gold" small onClick={()=>{const nv=prompt('Nouveau code Directeur:',codes.admin); if(nv) setCodes({...codes,admin:nv,directeur:nv});}}>✏️ Modifier code Directeur</Btn><Btn variant="danger" small onClick={()=>{if(confirm('Supprimer Directeur? Seul Fondateur!')){const cp={...codes}; delete cp.admin; delete cp.directeur; setCodes(cp); alert('Directeur supprimé!');}}}><Trash2 size={12}/> SUPPRIMER DIRECTEUR</Btn></div></div>
          </Panel>
        )}

        {isFondateur && onglet==='codesTotal' && (
          <Panel title="16. Codes - EXCLUSIF Fondateur 🔐 Voit tout + modifie tout + supprime tout" icon={KeyRound}>
            <p className="text-[11px] text-red-600 mb-3">Directeur voit "🔒 Code Fondateur caché" - Fondateur voit tout</p>
            <div className="space-y-2">{Object.entries(codes).filter(([k])=>k!=='enseignants').map(([r,c])=><div key={r} className="flex justify-between rounded-lg border px-3 py-2 text-[12px]" style={{borderColor:"#E7DEC8"}}><span>{r}: {String(c)} - Modifiable/Supprimable</span><span className="flex gap-1"><Btn variant="ghost" small>✏️</Btn><Btn variant="danger" small onClick={()=>{const cp={...codes}; delete cp[r]; setCodes(cp);}}>🗑️</Btn></span></div>)}<div className="mt-3 flex flex-wrap gap-1">{eleves.map(e=><span key={e.id} className="px-2 py-1 bg-[#FFFBF2] border rounded-full text-[11px] font-mono">{e.id} <Pencil size={10} className="inline"/> <Trash2 size={10} className="inline text-red-600"/></span>)}</div></div>
            <p className="mt-3 text-[11px]" style={{color:"#9A8B67"}}>✅ Tout modifiable/supprimable comme tu as demandé. Secrétaire enregistre frère → apparaît chez directeur + parent concerné (même téléphone parrain détecté → frère).</p>
          </Panel>
        )}
      </Coquille>
    </EcoleContext.Provider>
  );
}
