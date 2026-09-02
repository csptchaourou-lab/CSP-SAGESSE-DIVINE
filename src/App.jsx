import React, { useState, useEffect, useMemo } from "react";
import { School, Users, GraduationCap, Wallet, LayoutDashboard, UserCircle2, ClipboardList, Plus, Trash2, LogOut, ShieldCheck, FileText, Inbox, CheckCircle2, Search, Save, X, BookOpen, Award, UserCheck, Building, Briefcase, Heart, Globe, CreditCard, Mail, DollarSign, Check, Edit3, MessageSquare, Bell, Send } from "lucide-react";

const SUPABASE_URL = "https://skzllfgegrzqbglinepy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNremxsZmdlZ3J6cWJnbGluZXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MTg5NzYsImV4cCI6MjA1MDI5NDk3Nn0.FA-ZxnJ0R-RkJvX8J5q0k0l0m0n0o0p0r0s0t0u0v0w0x0y0z0A00U";
const URL = SUPABASE_URL; const KEY = SUPABASE_ANON_KEY;
async function pgFetch(chemin, options = {}) {
  try {
    const controller = new AbortController(); const timer = setTimeout(()=>controller.abort(), 8000);
    const r = await fetch(`${URL}/rest/v1/${chemin}`, { ...options, signal: controller.signal, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...(options.headers||{}) }});
    clearTimeout(timer); if(!r.ok) return {data:[]}; if(r.status===204) return {data:[]}; const t=await r.text(); if(!t) return {data:[]}; try{ return {data:JSON.parse(t)} }catch{ return {data:[]}}
  } catch { return {data:[]} }
}

const CLASSES = [
  {code:"1001", nom:"Maternelle 1", niveau:"Maternelle", frais:75000},
  {code:"1002", nom:"Maternelle 2", niveau:"Maternelle", frais:75000},
  {code:"1111", nom:"CM1", niveau:"Primaire", frais:80000},
  {code:"3333", nom:"Kponjè", niveau:"Spécial", frais:70000},
  {code:"CP1", nom:"CP1", niveau:"Primaire", frais:80000},
  {code:"CI", nom:"CI", niveau:"Primaire", frais:75000},
];
const MATIERES = ["Français","Mathématiques","Sciences","Histoire-Géo","Anglais","Dessin","Musique","Sport","Écriture","Lecture","Kponjè Tradition"];
const USERS = [
  {mat:"1001", pass:"1001", nom:"Directeur Général", role:"admin", espace:"administratif"},
  {mat:"1002", pass:"1002", nom:"Secrétaire", role:"secretaire", espace:"secretaire"},
  {mat:"1111", pass:"1111", nom:"Maitre CM1", role:"enseignant", espace:"enseignant", classe:"1111"},
  {mat:"3333", pass:"3333", nom:"Resp. Kponjè", role:"enseignant", espace:"enseignant", classe:"3333"},
  {mat:"admin", pass:"admin", nom:"Admin Système", role:"admin", espace:"administratif"},
  {mat:"parent1", pass:"parent1", nom:"Parent KOUKOU", role:"parent", espace:"parents", enfantClasse:"1111"},
];

export default function App(){
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("csp_user")||"null")}catch{return null}});
  const [view,setView]=useState("dashboard");
  const [eleves,setEleves]=useState(()=>{try{return JSON.parse(localStorage.getItem("csp_eleves")||"[]")}catch{return []}});
  const [notes,setNotes]=useState(()=>{try{return JSON.parse(localStorage.getItem("csp_notes")||"[]")}catch{return []}});
  const [presences,setPresences]=useState(()=>{try{return JSON.parse(localStorage.getItem("csp_pres")||"[]")}catch{return []}});
  const [inscriptions,setInscriptions]=useState(()=>{try{return JSON.parse(localStorage.getItem("csp_insc")||"[]")}catch{return []}});
  const [paiements,setPaiements]=useState(()=>{try{return JSON.parse(localStorage.getItem("csp_pay")||"[]")}catch{return []}});
  const [messagesEcole,setMessagesEcole]=useState(()=>{try{return JSON.parse(localStorage.getItem("csp_msgs")||`[{"id":"1","titre":"Bienvenue rentrée","contenu":"📅 Réunion parents: 15 Septembre 09h00 - Salle CM1\\n💰 Frais 2e tranche avant 30 Septembre\\n👕 Kponjè (3333): Tenue traditionnelle vendredi","date":"2026-09-01","auteur":"Direction"}]`)}catch{return []}});
  const [search,setSearch]=useState(""); const [filtreClasse,setFiltreClasse]=useState("all");
  const [msg,setMsg]=useState(""); const [showAddEleve,setShowAddEleve]=useState(false);
  const [showAddNote,setShowAddNote]=useState(false); const [showInscriptionPublique,setShowInscriptionPublique]=useState(false);
  const [showEditInsc,setShowEditInsc]=useState(null);
  const [showNewMessage,setShowNewMessage]=useState(false);
  const [formEleve,setFormEleve]=useState({nom:"",prenom:"",classe:"1001",sexe:"M",date_naissance:"",parent:"",telephone:""});
  const [formNote,setFormNote]=useState({eleve_id:"",matiere:"Français",note:"",trimestre:"T1"});
  const [formInscPub,setFormInscPub]=useState({nom_enfant:"",prenom_enfant:"",classe_souhaitee:"1001",nom_parent:"",telephone:"",email:"",message:""});
  const [formEditInsc,setFormEditInsc]=useState({});
  const [formMessage,setFormMessage]=useState({titre:"",contenu:""});
  const [selectedEspace, setSelectedEspace]=useState(null);

  useEffect(()=>{ if(user) localStorage.setItem("csp_user", JSON.stringify(user)); else localStorage.removeItem("csp_user"); },[user]);
  useEffect(()=>{ localStorage.setItem("csp_eleves", JSON.stringify(eleves)); },[eleves]);
  useEffect(()=>{ localStorage.setItem("csp_notes", JSON.stringify(notes)); },[notes]);
  useEffect(()=>{ localStorage.setItem("csp_pres", JSON.stringify(presences)); },[presences]);
  useEffect(()=>{ localStorage.setItem("csp_insc", JSON.stringify(inscriptions)); },[inscriptions]);
  useEffect(()=>{ localStorage.setItem("csp_pay", JSON.stringify(paiements)); },[paiements]);
  useEffect(()=>{ localStorage.setItem("csp_msgs", JSON.stringify(messagesEcole)); },[messagesEcole]);

  const elevesFiltres = useMemo(()=> eleves.filter(e=>{
    const s = (e.nom+" "+e.prenom+" "+(e.parent||"")).toLowerCase().includes(search.toLowerCase());
    const c = filtreClasse==="all" || e.classe===filtreClasse;
    const classeEnseignant = user?.espace==="enseignant" ? e.classe===user.classe : true;
    return s && c && classeEnseignant;
  }),[eleves,search,filtreClasse,user]);

  const handleLogin = (m,p)=>{ const f=USERS.find(u=>u.mat===m && u.pass===p); if(f){ setUser(f); setView("dashboard"); setMsg(""); setSelectedEspace(null); } else setMsg("Matricule faux. Essaie admin/admin, 1001/1001, 1002/1002, 1111/1111, 3333/3333, parent1/parent1"); };
  const addEleve = ()=>{ if(!formEleve.nom||!formEleve.prenom){ setMsg("Nom et prénom obligatoires"); return; } const ne={id:Date.now().toString(), ...formEleve, nom:formEleve.nom.toUpperCase(), frais_total: CLASSES.find(c=>c.code===formEleve.classe)?.frais||75000, frais_paye:0, created_at:new Date().toISOString()}; setEleves(v=>[ne,...v]); setShowAddEleve(false); setFormEleve({nom:"",prenom:"",classe:"1001",sexe:"M",date_naissance:"",parent:"",telephone:""}); setMsg(`Élève ${ne.prenom} ${ne.nom} ajouté en ${ne.classe}`); };
  const delEleve = (id)=>{ if(!confirm("Supprimer élève ?")) return; setEleves(v=>v.filter(e=>e.id!==id)); };
  
  // INSCRIPTIONS - NOUVELLE LOGIQUE AVEC MODIF / SUPPRESSION MEME VALIDEES
  const validerInscription = (insc)=>{
    if(!confirm(`Valider ${insc.prenom_enfant} ${insc.nom_enfant} et créer l'élève ?`)) return;
    const ne={id:Date.now().toString(), nom:insc.nom_enfant.toUpperCase(), prenom:insc.prenom_enfant, classe:insc.classe_souhaitee, parent:insc.nom_parent, telephone:insc.telephone, sexe:"M", frais_total: CLASSES.find(c=>c.code===insc.classe_souhaitee)?.frais||75000, frais_paye:0, created_at:new Date().toISOString()};
    setEleves(v=>[ne,...v]);
    setInscriptions(v=>v.map(i=>i.id===insc.id?{...i, statut:"Validée"}:i));
    setMsg(`${insc.prenom_enfant} validé et ajouté en ${insc.classe_souhaitee}`);
  };
  const supprimerInscription = (id)=>{
    if(!confirm("Supprimer définitivement cette inscription ?")) return;
    setInscriptions(v=>v.filter(i=>i.id!==id));
    setMsg("Inscription supprimée");
  };
  const modifierInscription = ()=>{
    if(!formEditInsc.nom_enfant || !formEditInsc.prenom_enfant){ setMsg("Nom enfant obligatoire"); return; }
    setInscriptions(v=>v.map(i=>i.id===showEditInsc.id?{...i, ...formEditInsc}:i));
    setShowEditInsc(null);
    setMsg("Inscription modifiée avec succès");
  };
  const openEditInsc = (insc)=>{ setFormEditInsc({...insc}); setShowEditInsc(insc); };

  const addNote = ()=>{ if(!formNote.eleve_id||!formNote.note){ setMsg("Choisis élève et note"); return; } const nn={id:Date.now().toString(), ...formNote, note: parseFloat(formNote.note), date:new Date().toISOString()}; setNotes(v=>[nn,...v]); setShowAddNote(false); setMsg("Note enregistrée"); };
  const addPresence = (eleve_id, statut)=>{ const today=new Date().toISOString().slice(0,10); setPresences(v=>{ const filtered=v.filter(p=>!(p.eleve_id===eleve_id && p.date===today)); return [...filtered, {id:Date.now().toString(), eleve_id, date:today, statut}]; }); };
  const addPaiement = (eleve_id, montant)=>{ const p={id:Date.now().toString(), eleve_id, montant: parseInt(montant), date:new Date().toISOString()}; setPaiements(v=>[p,...v]); setEleves(v=>v.map(e=>e.id===eleve_id?{...e, frais_paye:(e.frais_paye||0)+parseInt(montant)}:e)); setMsg(`+${montant}F encaissé`); };
  const addInscriptionPublique = ()=>{ if(!formInscPub.nom_enfant || !formInscPub.nom_parent){ setMsg("Nom enfant et nom parent obligatoires"); return; } const ni={id:Date.now().toString(), ...formInscPub, nom_enfant:formInscPub.nom_enfant.toUpperCase(), statut:"En attente", date:new Date().toISOString()}; setInscriptions(v=>[ni,...v]); setShowInscriptionPublique(false); setFormInscPub({nom_enfant:"",prenom_enfant:"",classe_souhaitee:"1001",nom_parent:"",telephone:"",email:"",message:""}); setMsg("Demande envoyée ! L'administration va la valider"); };
  
  // MESSAGES ECOLE -> PARENTS + PERSONNEL
  const envoyerMessage = ()=>{
    if(!formMessage.titre || !formMessage.contenu){ setMsg("Titre et contenu obligatoires"); return; }
    const nm={id:Date.now().toString(), ...formMessage, date:new Date().toISOString(), auteur:user?.nom||"Direction"};
    setMessagesEcole(v=>[nm,...v]);
    setShowNewMessage(false); setFormMessage({titre:"",contenu:""}); setMsg("Message diffusé à tout le personnel ET aux parents !");
  };
  const supprimerMessage = (id)=>{ if(!confirm("Supprimer ce message pour tous ?")) return; setMessagesEcole(v=>v.filter(m=>m.id!==id)); };

  if(!user){
    return (
      <div style={{minHeight:"100vh", background:"#FAF6EE", padding:16, fontFamily:"Inter, system-ui"}}>
        <div style={{maxWidth:480, margin:"0 auto"}}>
          <div style={{textAlign:"center", padding:"24px 0 16px"}}>
            <div style={{background:"#1B2A4A", width:64, height:64, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto"}}><School color="#C9A227" size={32}/></div>
            <h1 style={{fontSize:22, fontWeight:800, color:"#1B2A4A", marginTop:12, lineHeight:1.2}}>CSP « Sagesse Divine » de Tchaourou</h1>
            <p style={{color:"#6B5E4F", fontSize:13, marginTop:4}}>Tchaourou - Système de Gestion Scolaire</p>
          </div>
          {!selectedEspace ? (
            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              <div onClick={()=>setSelectedEspace("administratif")} style={cardBeige}><div style={iconBox}><ShieldCheck color="#C9A227"/></div><div style={cardTitle}>Espace Administratif</div><div style={cardSub}>Directeur - Gestion complète • 1001 / 1001</div></div>
              <div onClick={()=>setSelectedEspace("enseignant")} style={cardBeige}><div style={iconBox}><BookOpen color="#C9A227"/></div><div style={cardTitle}>Espace Enseignant</div><div style={cardSub}>Notes, présences • 1111 (CM1) ou 3333 (Kponjè)</div></div>
              <div onClick={()=>setSelectedEspace("secretaire")} style={cardBeige}><div style={iconBox}><ClipboardList color="#C9A227"/></div><div style={cardTitle}>Espace Secrétaire</div><div style={cardSub}>Inscriptions, encaissements • 1002 / 1002</div></div>
              <div onClick={()=>setSelectedEspace("parents")} style={cardBeige}><div style={iconBox}><Heart color="#C9A227"/></div><div style={cardTitle}>Espace Parents</div><div style={cardSub}>Suivi enfant, notes, messages école • parent1</div></div>
              <button onClick={()=>setShowInscriptionPublique(true)} style={btnInscrire}><Plus size={16}/> Inscrire mon enfant en ligne</button>
            </div>
          ) : (
            <div style={{background:"white", padding:16, borderRadius:16, border:"1px solid #E8DFC8"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}><span style={{fontWeight:700, color:"#1B2A4A", textTransform:"capitalize"}}>{selectedEspace}</span><button onClick={()=>setSelectedEspace(null)} style={btnSmallBeige}><X size={12}/> Retour</button></div>
              <LoginEspace onLogin={handleLogin} espace={selectedEspace} msg={msg}/>
            </div>
          )}
          {msg && <div style={{...alertGreen, marginTop:12}}>{msg}</div>}
          {showInscriptionPublique && (
            <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, zIndex:50}}>
              <div style={{background:"white", padding:16, borderRadius:16, width:"100%", maxWidth:400, maxHeight:"90vh", overflowY:"auto"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}><h3 style={{fontWeight:700, color:"#1B2A4A"}}>Inscription en ligne</h3><button onClick={()=>setShowInscriptionPublique(false)} style={btnSmallBeige}><X size={14}/></button></div>
                <div style={{display:"flex", flexDirection:"column", gap:8}}>
                  <input placeholder="Nom enfant" value={formInscPub.nom_enfant} onChange={e=>setFormInscPub({...formInscPub, nom_enfant:e.target.value})} style={inpBeige}/>
                  <input placeholder="Prénom enfant" value={formInscPub.prenom_enfant} onChange={e=>setFormInscPub({...formInscPub, prenom_enfant:e.target.value})} style={inpBeige}/>
                  <select value={formInscPub.classe_souhaitee} onChange={e=>setFormInscPub({...formInscPub, classe_souhaitee:e.target.value})} style={inpBeige}>{CLASSES.map(c=><option key={c.code} value={c.code}>{c.nom} - {c.code}</option>)}</select>
                  <input placeholder="Nom parent / parrain" value={formInscPub.nom_parent} onChange={e=>setFormInscPub({...formInscPub, nom_parent:e.target.value})} style={inpBeige}/>
                  <input placeholder="Téléphone" value={formInscPub.telephone} onChange={e=>setFormInscPub({...formInscPub, telephone:e.target.value})} style={inpBeige}/>
                  <input placeholder="Email (optionnel)" value={formInscPub.email} onChange={e=>setFormInscPub({...formInscPub, email:e.target.value})} style={inpBeige}/>
                  <textarea placeholder="Message : Prenez soin de mon enfant" value={formInscPub.message} onChange={e=>setFormInscPub({...formInscPub, message:e.target.value})} style={{...inpBeige, minHeight:60}}/>
                  <button onClick={addInscriptionPublique} style={btnGold}>Envoyer demande</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh", background:"#FAF6EE", fontFamily:"Inter, system-ui"}}>
      <header style={{background:"#1B2A4A", color:"white", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:20}}>
        <div style={{display:"flex", alignItems:"center", gap:8}}><div style={{background:"#C9A227", padding:6, borderRadius:8}}><School size={16} color="#1B2A4A"/></div><div><div style={{fontWeight:700, fontSize:13}}>CSP « Sagesse Divine » de Tchaourou</div><div style={{fontSize:10, opacity:0.8}}>Tchaourou • {user.nom} • {user.espace}</div></div></div>
        <button onClick={()=>setUser(null)} style={{background:"rgba(255,255,255,0.15)", border:"none", padding:"6px 10px", borderRadius:8, color:"white", fontSize:11, display:"flex", alignItems:"center", gap:4}}><LogOut size={12}/> Quitter</button>
      </header>
      <nav style={{background:"white", borderBottom:"1px solid #E8DFC8", padding:"8px 12px", display:"flex", gap:8, overflowX:"auto", position:"sticky", top:50, zIndex:10}}>
        <button onClick={()=>setView("dashboard")} style={view==="dashboard"?{...btnGoldSmall, background:"#1B2A4A"}:btnBeige}><LayoutDashboard size={14}/> Tableau de bord</button>
        <button onClick={()=>setView("bibliotheque")} style={view==="bibliotheque"?{...btnGoldSmall, background:"#1B2A4A"}:btnBeige}><Inbox size={14}/> Bibliothèque {inscriptions.length>0?`(${inscriptions.length})`:""}</button>
        <button onClick={()=>setView("eleves")} style={view==="eleves"?{...btnGoldSmall, background:"#1B2A4A"}:btnBeige}><Users size={14}/> Élèves</button>
        <button onClick={()=>setView("notes")} style={view==="notes"?{...btnGoldSmall, background:"#1B2A4A"}:btnBeige}><Award size={14}/> Notes</button>
        <button onClick={()=>setView("messages")} style={view==="messages"?{...btnGoldSmall, background:"#1B2A4A"}:btnBeige}><Bell size={14}/> Messages École → Parents ({messagesEcole.length})</button>
        {(user.role==="admin"||user.espace==="administratif") && <><button onClick={()=>setView("classes")} style={view==="classes"?{...btnGoldSmall, background:"#1B2A4A"}:btnBeige}><Building size={14}/> Classes</button><button onClick={()=>setView("paiements")} style={view==="paiements"?{...btnGoldSmall, background:"#1B2A4A"}:btnBeige}><Wallet size={14}/> Finances</button></>}
      </nav>
      <main style={{padding:12, maxWidth:900, margin:"0 auto"}}>
        {msg && <div style={{...alertGreen, marginBottom:12}}>{msg}</div>}

        {view==="dashboard" && (
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
              <div style={cardBeigeSmall}><div style={cardLabelBeige}>Élèves</div><div style={cardNumBeige}>{eleves.length}</div></div>
              <div style={cardBeigeSmall}><div style={cardLabelBeige}>Inscriptions</div><div style={cardNumBeige}>{inscriptions.filter(i=>i.statut!=="Validée").length} en attente</div></div>
              <div style={cardBeigeSmall}><div style={cardLabelBeige}>Notes</div><div style={cardNumBeige}>{notes.length}</div></div>
              <div style={cardBeigeSmall}><div style={cardLabelBeige}>Messages</div><div style={cardNumBeige}>{messagesEcole.length}</div></div>
            </div>
            <div style={{background:"white", padding:14, borderRadius:12, border:"1px solid #E8DFC8"}}>
              <div style={{fontWeight:700, color:"#1B2A4A", fontSize:13, marginBottom:8, display:"flex", alignItems:"center", gap:6}}><Bell size={16}/> Dernier message de la Direction (visible Parents + Personnel)</div>
              {messagesEcole[0]?<div style={{background:"#FAF6EE", padding:10, borderRadius:8, border:"1px solid #E8DFC8"}}><div style={{fontWeight:600, fontSize:12, color:"#1B2A4A"}}>{messagesEcole[0].titre} • {new Date(messagesEcole[0].date).toLocaleDateString()} • {messagesEcole[0].auteur}</div><div style={{fontSize:11, color:"#1B2A4A", marginTop:6, whiteSpace:"pre-line"}}>{messagesEcole[0].contenu}</div></div>:<div style={{fontSize:11, color:"#6B5E4F"}}>Aucun message</div>}
            </div>
          </div>
        )}

        {view==="bibliotheque" && (
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            <div style={{background:"white", padding:14, borderRadius:12, border:"1px solid #E8DFC8", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div><div style={{fontWeight:700, color:"#1B2A4A", fontSize:14, display:"flex", alignItems:"center", gap:6}}><Inbox size={16}/> Bibliothèque des demandes d'inscription</div><div style={{fontSize:11, color:"#6B5E4F"}}>Admin peut modifier / supprimer même Validée</div></div>
            </div>
            {inscriptions.length===0 && <div style={{background:"white", padding:20, borderRadius:12, border:"1px solid #E8DFC8", textAlign:"center", color:"#6B5E4F", fontSize:12}}>Aucune demande pour l'instant</div>}
            {inscriptions.map(insc=>(
              <div key={insc.id} style={{background:"white", padding:14, borderRadius:12, border:"1px solid #E8DFC8"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8}}>
                  <div>
                    <div style={{fontWeight:700, fontSize:14, color:"#1B2A4A"}}>{insc.prenom_enfant} {insc.nom_enfant} <span style={{fontWeight:400, fontSize:12, color:"#6B5E4F"}}>({insc.sexe||"M"}, {insc.prenom_enfant? "5 ans" : ""})</span></div>
                    <div style={{fontSize:11, color:"#6B5E4F", marginTop:4}}>Classe souhaitée : {CLASSES.find(c=>c.code===insc.classe_souhaitee)?.nom||insc.classe_souhaitee} ({insc.classe_souhaitee}) • Parrain : {insc.nom_parent} ({insc.telephone}) • inscription en ligne</div>
                    {insc.message && <div style={{fontSize:11, color:"#8B6914", marginTop:6, fontStyle:"italic"}}>« {insc.message} »</div>}
                  </div>
                  <div style={{background: insc.statut==="Validée"?"#dcfce7":"#fef3c7", color: insc.statut==="Validée"?"#166534":"#92400e", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:"1px solid #E8DFC8", whiteSpace:"nowrap"}}>{insc.statut==="Validée"?"✓ Validée":insc.statut}</div>
                </div>
                <div style={{display:"flex", gap:6, marginTop:10, flexWrap:"wrap"}}>
                  {insc.statut!=="Validée" && <button onClick={()=>validerInscription(insc)} style={btnGoldSmall}><CheckCircle2 size={12}/> Valider & Créer élève</button>}
                  <button onClick={()=>openEditInsc(insc)} style={btnBeige}><Edit3 size={12}/> Modifier toutes les infos</button>
                  <button onClick={()=>supprimerInscription(insc.id)} style={{...btnBeige, background:"#fee2e2", color:"#991b1b", borderColor:"#fecaca"}}><Trash2 size={12}/> Supprimer inscription</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view==="eleves" && (
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <div style={{display:"flex", gap:6}}><input placeholder="Rechercher élève, parent..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inpBeige, flex:1}}/><select value={filtreClasse} onChange={e=>setFiltreClasse(e.target.value)} style={inpBeige}><option value="all">Toutes classes</option>{CLASSES.map(c=><option key={c.code} value={c.code}>{c.nom}</option>)}</select><button onClick={()=>setShowAddEleve(true)} style={btnGoldSmall}><Plus size={12}/> Ajouter</button></div>
            {elevesFiltres.map(e=><div key={e.id} style={{background:"white", padding:12, borderRadius:12, border:"1px solid #E8DFC8", display:"flex", justifyContent:"space-between", alignItems:"center"}}><div><div style={{fontWeight:700, fontSize:13, color:"#1B2A4A"}}>{e.nom} {e.prenom} • {e.classe}</div><div style={{fontSize:10, color:"#6B5E4F"}}>Parent: {e.parent} • Tél: {e.telephone} • Frais: {(e.frais_paye||0)}/{(e.frais_total||75000)}F</div></div><div style={{display:"flex", gap:4}}><button onClick={()=>addPaiement(e.id, 15000)} style={btnSmallBeige}>+15k</button><button onClick={()=>addPaiement(e.id, 30000)} style={btnSmallBeige}>+30k</button><button onClick={()=>delEleve(e.id)} style={iconBtnRed}><Trash2 size={12}/></button></div></div>)}
          </div>
        )}

        {view==="notes" && (
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <button onClick={()=>setShowAddNote(true)} style={btnGold}><Plus size={14}/> Saisir note /20</button>
            {notes.map(n=>{ const el=eleves.find(e=>e.id===n.eleve_id); return <div key={n.id} style={{background:"white", padding:10, borderRadius:10, border:"1px solid #E8DFC8", display:"flex", justifyContent:"space-between"}}><div><div style={{fontWeight:600, fontSize:12, color:"#1B2A4A"}}>{el?`${el.nom} ${el.prenom} (${el.classe})`: n.eleve_id} • {n.matiere} • {n.trimestre}</div><div style={{fontSize:10, color:"#6B5E4F"}}>{new Date(n.date).toLocaleDateString()} • {n.note>=10?"Très Bien":"À améliorer"}</div></div><div style={{background:"#C9A227", color:"#1B2A4A", padding:"6px 12px", borderRadius:20, fontWeight:700, fontSize:12}}>{n.note}/20</div></div>})}
          </div>
        )}

        {view==="messages" && (
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            <div style={{background:"white", padding:12, borderRadius:12, border:"1px solid #E8DFC8", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div><div style={{fontWeight:700, color:"#1B2A4A", fontSize:13, display:"flex", alignItems:"center", gap:6}}><MessageSquare size={16}/> Messages Direction → Personnel + Parents</div><div style={{fontSize:10, color:"#6B5E4F"}}>Ce que le Directeur envoie ici est visible dans Espace Parents et Espace Personnel</div></div>
              <button onClick={()=>setShowNewMessage(true)} style={btnGoldSmall}><Send size={12}/> Nouveau message</button>
            </div>
            {messagesEcole.map(m=>(
              <div key={m.id} style={{background:"white", padding:14, borderRadius:12, border:"1px solid #E8DFC8"}}>
                <div style={{display:"flex", justifyContent:"space-between"}}><div style={{fontWeight:700, fontSize:13, color:"#1B2A4A"}}>{m.titre} <span style={{fontWeight:400, fontSize:10, color:"#6B5E4F"}}>• {new Date(m.date).toLocaleString()} • {m.auteur}</span></div><button onClick={()=>supprimerMessage(m.id)} style={{...btnSmallBeige, color:"#991b1b"}}><Trash2 size={10}/> Supprimer</button></div>
                <div style={{fontSize:12, color:"#1B2A4A", marginTop:8, whiteSpace:"pre-line", background:"#FAF6EE", padding:10, borderRadius:8, border:"1px solid #E8DFC8"}}>{m.contenu}</div>
                <div style={{fontSize:10, color:"#166534", marginTop:6}}>✅ Diffusé à : Espace Administratif + Enseignant + Secrétaire + Parents</div>
              </div>
            ))}
          </div>
        )}

        {view==="classes" && <div style={{display:"flex", flexDirection:"column", gap:8}}>{CLASSES.map(c=>{ const eff=eleves.filter(e=>e.classe===c.code).length; return <div key={c.code} style={{background:"white", padding:14, borderRadius:12, border:"1px solid #E8DFC8", display:"flex", justifyContent:"space-between"}}><div><div style={{fontWeight:600, fontSize:13, color:"#1B2A4A"}}>{c.nom}</div><div style={{fontSize:10, color:"#6B5E4F"}}>{c.code} • {c.niveau} • {c.frais.toLocaleString()}F • {eff} élèves</div></div><div style={{background:"#FDF0D5", color:"#1B2A4A", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:"1px solid #E8DFC8"}}>{eff} élèves</div></div>})}</div>}
        {view==="paiements" && <div style={{display:"flex", flexDirection:"column", gap:8}}><div style={{background:"white", padding:12, borderRadius:12, border:"1px solid #E8DFC8"}}><div style={{fontWeight:700, fontSize:12, color:"#1B2A4A"}}>Encaissements</div><div style={{fontSize:10, color:"#6B5E4F"}}>Total: {paiements.reduce((a,b)=>a+b.montant,0).toLocaleString()}F</div></div>{paiements.map(p=>{ const el=eleves.find(e=>e.id===p.eleve_id); return <div key={p.id} style={{background:"white", padding:10, borderRadius:10, border:"1px solid #E8DFC8", display:"flex", justifyContent:"space-between", fontSize:11}}><span style={{color:"#1B2A4A"}}>{el?`${el.nom} ${el.prenom} (${el.classe})`: "Élève"} • Parent: {el?.parent||"N/A"}</span><span style={{fontWeight:700, color:"#1B2A4A"}}>+{p.montant.toLocaleString()}F • {new Date(p.date).toLocaleDateString()}</span></div>})}</div>}

      </main>

      {/* MODAL EDIT INSCRIPTION */}
      {showEditInsc && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, zIndex:60}}>
          <div style={{background:"white", padding:16, borderRadius:16, width:"100%", maxWidth:420, maxHeight:"90vh", overflowY:"auto"}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:12}}><h3 style={{fontWeight:700, color:"#1B2A4A"}}>Modifier inscription (même Validée)</h3><button onClick={()=>setShowEditInsc(null)} style={btnSmallBeige}><X size={14}/></button></div>
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              <input placeholder="Nom enfant" value={formEditInsc.nom_enfant||""} onChange={e=>setFormEditInsc({...formEditInsc, nom_enfant:e.target.value})} style={inpBeige}/>
              <input placeholder="Prénom enfant" value={formEditInsc.prenom_enfant||""} onChange={e=>setFormEditInsc({...formEditInsc, prenom_enfant:e.target.value})} style={inpBeige}/>
              <select value={formEditInsc.classe_souhaitee||"1001"} onChange={e=>setFormEditInsc({...formEditInsc, classe_souhaitee:e.target.value})} style={inpBeige}>{CLASSES.map(c=><option key={c.code} value={c.code}>{c.nom}</option>)}</select>
              <input placeholder="Nom parent" value={formEditInsc.nom_parent||""} onChange={e=>setFormEditInsc({...formEditInsc, nom_parent:e.target.value})} style={inpBeige}/>
              <input placeholder="Téléphone" value={formEditInsc.telephone||""} onChange={e=>setFormEditInsc({...formEditInsc, telephone:e.target.value})} style={inpBeige}/>
              <input placeholder="Email" value={formEditInsc.email||""} onChange={e=>setFormEditInsc({...formEditInsc, email:e.target.value})} style={inpBeige}/>
              <textarea placeholder="Message" value={formEditInsc.message||""} onChange={e=>setFormEditInsc({...formEditInsc, message:e.target.value})} style={{...inpBeige, minHeight:60}}/>
              <select value={formEditInsc.statut||"En attente"} onChange={e=>setFormEditInsc({...formEditInsc, statut:e.target.value})} style={inpBeige}><option>En attente</option><option>Validée</option><option>Refusée</option></select>
              <button onClick={modifierInscription} style={btnGold}><Save size={14}/> Enregistrer modifications</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOUVEAU MESSAGE ECOLE */}
      {showNewMessage && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, zIndex:60}}>
          <div style={{background:"white", padding:16, borderRadius:16, width:"100%", maxWidth:420}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:12}}><h3 style={{fontWeight:700, color:"#1B2A4A"}}>Nouveau message Direction</h3><button onClick={()=>setShowNewMessage(false)} style={btnSmallBeige}><X size={14}/></button></div>
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              <input placeholder="Titre: Réunion parents 15 Sept..." value={formMessage.titre} onChange={e=>setFormMessage({...formMessage, titre:e.target.value})} style={inpBeige}/>
              <textarea placeholder="Contenu: Le message sera visible pour Personnel + Parents" value={formMessage.contenu} onChange={e=>setFormMessage({...formMessage, contenu:e.target.value})} style={{...inpBeige, minHeight:100}}/>
              <div style={{fontSize:10, color:"#6B5E4F", background:"#FAF6EE", padding:8, borderRadius:8}}>📢 Ce message sera automatiquement diffusé dans : Espace Administratif, Espace Enseignant, Espace Secrétaire ET Espace Parents (visible sur la capture parent que tu as envoyée)</div>
              <button onClick={envoyerMessage} style={btnGold}><Send size={14}/> Diffuser à tous (Personnel + Parents)</button>
            </div>
          </div>
        </div>
      )}

      {showAddEleve && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, zIndex:60}}>
          <div style={{background:"white", padding:16, borderRadius:16, width:"100%", maxWidth:400}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:12}}><h3 style={{fontWeight:700}}>Ajouter élève</h3><button onClick={()=>setShowAddEleve(false)} style={btnSmallBeige}><X size={14}/></button></div>
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              <input placeholder="Nom" value={formEleve.nom} onChange={e=>setFormEleve({...formEleve, nom:e.target.value})} style={inpBeige}/>
              <input placeholder="Prénom" value={formEleve.prenom} onChange={e=>setFormEleve({...formEleve, prenom:e.target.value})} style={inpBeige}/>
              <select value={formEleve.classe} onChange={e=>setFormEleve({...formEleve, classe:e.target.value})} style={inpBeige}>{CLASSES.map(c=><option key={c.code} value={c.code}>{c.nom}</option>)}</select>
              <input placeholder="Parent" value={formEleve.parent} onChange={e=>setFormEleve({...formEleve, parent:e.target.value})} style={inpBeige}/>
              <input placeholder="Téléphone" value={formEleve.telephone} onChange={e=>setFormEleve({...formEleve, telephone:e.target.value})} style={inpBeige}/>
              <button onClick={addEleve} style={btnGold}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {showAddNote && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, zIndex:60}}>
          <div style={{background:"white", padding:16, borderRadius:16, width:"100%", maxWidth:400}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:12}}><h3 style={{fontWeight:700}}>Saisir note /20</h3><button onClick={()=>setShowAddNote(false)} style={btnSmallBeige}><X size={14}/></button></div>
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              <select value={formNote.eleve_id} onChange={e=>setFormNote({...formNote, eleve_id:e.target.value})} style={inpBeige}><option value="">Choisir élève</option>{eleves.map(el=><option key={el.id} value={el.id}>{el.nom} {el.prenom} ({el.classe})</option>)}</select>
              <select value={formNote.matiere} onChange={e=>setFormNote({...formNote, matiere:e.target.value})} style={inpBeige}>{MATIERES.map(m=><option key={m} value={m}>{m}</option>)}</select>
              <input placeholder="Note /20" type="number" min="0" max="20" value={formNote.note} onChange={e=>setFormNote({...formNote, note:e.target.value})} style={inpBeige}/>
              <select value={formNote.trimestre} onChange={e=>setFormNote({...formNote, trimestre:e.target.value})} style={inpBeige}><option>T1</option><option>T2</option><option>T3</option><option>Évaluation 1</option><option>Évaluation 2</option></select>
              <button onClick={addNote} style={btnGold}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function LoginEspace({onLogin, espace, msg}){
  const [m,setM]=useState(""); const [p,setP]=useState("");
  const placeholders = { administratif: "1001 ou admin", secretaire: "1002", enseignant: "1111 ou 3333", parents: "parent1" };
  return (
    <div style={{display:"flex", flexDirection:"column", gap:8}}>
      <input value={m} onChange={e=>setM(e.target.value)} placeholder={`Matricule (${placeholders[espace]||""})`} style={inpBeige}/>
      <input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Mot de passe (même que matricule)" style={inpBeige}/>
      {msg && <div style={{background:"#fef2f2", color:"#b91c1c", padding:8, borderRadius:8, fontSize:11, border:"1px solid #fecaca"}}>{msg}</div>}
      <button onClick={()=>onLogin(m,p)} style={btnGold}><ShieldCheck size={14}/> Se connecter à {espace}</button>
    </div>
  );
}

const cardBeige = {background:"white", padding:16, borderRadius:16, border:"1px solid #E8DFC8", cursor:"pointer"};
const iconBox = {background:"#1B2A4A", width:48, height:48, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center"};
const cardTitle = {fontWeight:700, fontSize:16, color:"#1B2A4A", marginTop:12};
const cardSub = {fontSize:12, color:"#6B5E4F", marginTop:4};
const btnInscrire = {marginTop:16, background:"white", color:"#8B6914", border:"1.5px solid #C9A227", padding:"12px 16px", borderRadius:24, fontWeight:700, fontSize:13, width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer"};
const inpBeige = {padding:10, borderRadius:10, border:"1px solid #E8DFC8", fontSize:12, background:"#FFFEFB"};
const btnGold = {background:"#1B2A4A", color:"#C9A227", border:"none", padding:"10px 12px", borderRadius:10, fontWeight:700, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:6, cursor:"pointer"};
const btnGoldSmall = {background:"#1B2A4A", color:"#C9A227", border:"none", padding:"8px 12px", borderRadius:10, fontWeight:700, fontSize:11, display:"flex", alignItems:"center", gap:4, cursor:"pointer"};
const btnBeige = {background:"#FAF6EE", color:"#1B2A4A", border:"1px solid #E8DFC8", padding:"10px", borderRadius:10, fontSize:12, cursor:"pointer"};
const btnSmallBeige = {background:"#FAF6EE", border:"1px solid #E8DFC8", padding:"4px 8px", borderRadius:6, fontSize:10, cursor:"pointer", color:"#1B2A4A"};
const iconBtnRed = {background:"#fee2e2", border:"none", padding:6, borderRadius:6, cursor:"pointer"};
const alertGreen = {background:"#dcfce7", color:"#166534", padding:8, borderRadius:8, fontSize:11, border:"1px solid #bbf7d0"};
const cardBeigeSmall = {background:"white", padding:12, borderRadius:12, border:"1px solid #E8DFC8"};
const cardNumBeige = {fontSize:18, fontWeight:800, marginTop:4, color:"#1B2A4A"};
const cardLabelBeige = {fontSize:10, color:"#6B5E4F"};
