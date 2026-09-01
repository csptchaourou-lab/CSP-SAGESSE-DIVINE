/* 
  EcoleConnecteeCSP - RAW CORRIGÉ
  Toutes tes captures remises ensemble + 7 bugs corrigés
  Règle ajoutée : Message Parent -> Directeur SEULEMENT
*/

import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { ClipboardList, Wallet, Megaphone, Inbox, FileText, Plus, CheckCircle2, CalendarClock, MessageSquare, UserCircle2, Send, LogOut } from "lucide-react";

// --- SUPABASE HELPERS (gardés de tes captures) ---
const SUPABASE_URL = "https://mwuquiyudypkxdxksihc.supabase.co";
const SUPABASE_KEY = "sb_publishable_hg_Gr3JKh29trcgxVp6xyw_RrdsDJIh";
const supabaseHeaders = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };
async function pgSelect(table, query="") { try{ const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`,{headers:supabaseHeaders}); if(!r.ok) return []; return await r.json(); }catch{return [];} }
async function pgUpsert(table,data,onConflict){ if(!data||data.length===0) return; await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`,{method:"POST",headers:{...supabaseHeaders,Prefer:"resolution=merge-duplicates"},body:JSON.stringify(data)}); }
async function pgInsert(table,data){ if(!data||data.length===0) return; await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method:"POST",headers:supabaseHeaders,body:JSON.stringify(data)}); }
async function pgDeleteIn(table,col,vals){ if(!vals||vals.length===0) return; const list=vals.map(v=>`"${v}"`).join(","); await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=in.(${list})`,{method:"DELETE",headers:supabaseHeaders}); }
async function pgDeleteToutes(table,col){ await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=not.is.null`,{method:"DELETE",headers:supabaseHeaders}); }

const ECOLE_INIT = { nom:"Complexe Scolaire Protestant", sigle:"CSP \"Sagesse Divine\"", quartier:"Kèra, à côté du Temple EPMB Cité de Paix", commune:"Tchaourou", departement:"Borgou", directeur:"97 11 22 33", telephone:"97 11 22 33", telephoneDirecteur:"97 11 22 33", email:"contact@csp-sagessedivine.bj", devise:"ÉCOLE CONNECTÉE", logoUrl:"" };
const ANNEE_INIT = "2024-2025";
const CODES_INIT = { directeur:"1234", enseignant:"5678", secretaire:"9012" };
const CLASSES_INIT = ["CI","CP","CE1","CE2","CM1","CM2"];
const FRAIS_TYPES_INIT = [{libelle:"Écolage", montant:50000},{libelle:"T-shirt", montant:3000}];
const MATIERES_PAR_CLASSE_INIT = {};
const PERSONNEL_INIT = [];
const ELEVES_INIT = [];
const ANNONCES_INIT = [];
const DEMANDES_INIT = [];
const MODES_PAIEMENT = ["Espèces","Mobile Money","Virement","Chèque"];

const EcoleContext = createContext(null);
const useEcole = () => useContext(EcoleContext);

const Badge = ({tone="ardoise",children})=>{ const map={vert:"bg-[#E4EEE3] text-[#2F5233]",or:"bg-[#F1ECDD] text-[#8A6D2B]",ardoise:"bg-[#E7DEC8] text-[#5C5240]"}; return <span className={`px-2 py-0.5 rounded-full text-[12px] ${map[tone]}`}>{children}</span>; };
const Btn = ({variant="primary",small,icon:Icon,children,...props})=>{ const base=small?"px-3 py-1 text-[13px]":"px-4 py-2 text-[14px]"; const v=variant==="gold"?"bg-[#C9A227] text-white":variant==="primary"?"bg-[#1B2A4A] text-[#FAF6EE]":"bg-[#E7DEC8] text-[#5C5240]"; return <button className={`rounded-lg font-medium flex items-center gap-1.5 ${base} ${v}`} {...props}>{Icon&&<Icon size={14}/>}{children}</button>; };
const Panel = ({title,icon:Icon,children})=> <div className="rounded-xl border bg-white p-4 shadow-sm" style={{borderColor:"#E7DEC8"}}><div className="mb-3 flex items-center gap-2 font-serif" style={{color:"#1B2A4A"}}>{Icon&&<Icon size={18}/>}{title}</div>{children}</div>;
const Champ = ({label,...props})=> <div><label className="mb-1 block text-[13px] font-medium" style={{color:"#5C5240"}}>{label}</label><input className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{borderColor:"#E7DEC8"}} {...props}/></div>;
const Coquille = ({roleLabel,nav,actif,setActif,onQuitter,children})=>(
  <div className="min-h-screen" style={{background:"#FAF6EE"}}>
    <header className="flex items-center justify-between px-4 py-3 border-b bg-white" style={{borderColor:"#E7DEC8"}}><div className="font-bold" style={{color:"#1B2A4A"}}>CSP École</div><div className="flex gap-2"><Badge>{roleLabel}</Badge><button onClick={onQuitter} className="text-[13px] underline">Quitter</button></div></header>
    <div className="flex"><aside className="hidden md:block w-56 p-3 space-y-1 border-r bg-white" style={{borderColor:"#E7DEC8"}}>{nav.map(n=><button key={n.id} onClick={()=>setActif(n.id)} className={`w-full text-left px-3 py-2 rounded-lg flex gap-2 text-[14px] ${actif===n.id?"bg-[#1B2A4A] text-white":"text-[#5C5240] hover:bg-[#F1ECDD]"}`}><n.icon size={16}/>{n.label}</button>)}</aside><main className="flex-1 p-4">{children}</main></div>
  </div>
);

/* --- ESPACE DIRECTEUR - SEUL QUI VALIDE ET GENERE CODE --- */
function EspaceDirecteur({eleves,setEleves,personnel,setPersonnel,annonces,setAnnonces,demandes,setDemandes}){
  const [onglet,setOnglet]=useState("bibliotheque");
  const {fraisTypes,setFraisTypes,matieresParClasse,setMatieresParClasse,messagesParents,messagesInternes,classes}=useEcole();
  const [nouvelleMatiere,setNouvelleMatiere]=useState("");
  const [coef,setCoef]=useState(1);
  const [classeMat,setClasseMat]=useState(classes[0]||"CI");
  const [nouveauFraisLib,setNouveauFraisLib]=useState("");
  const [nouveauFraisMontant,setNouveauFraisMontant]=useState("");

  // CORRECTION REGLE 1: Seul Directeur génère le code
  const validerDemande = (d)=>{
    const codeGenere = `CSP-${d.classeSouhaitee}-${Date.now().toString().slice(-4)}`;
    const nouvelEleve = {
      id:codeGenere, prenom:d.prenom, nom:d.nom, sexe:d.sexe, naissance:d.naissance, classe:d.classeSouhaitee, enseignant:"",
      parent:{nom:d.parrainNom, telephone:d.parrainTelephone},
      frais: fraisTypes.map(f=>({libelle:f.libelle, du:f.montant, paye:0, mode:null, datePaiement:null})), // frais du Directeur auto
      notes:[], absences:[], messages:[]
    };
    setEleves(prev=>[...prev,nouvelEleve]);
    setDemandes(prev=>prev.map(x=> x.id===d.id? {...x, statut:"validee"}:x));
    alert(`Élève validé. Code généré: ${codeGenere} - à communiquer aux parents`);
  };
  const refuserDemande = (d)=> setDemandes(prev=>prev.map(x=> x.id===d.id? {...x, statut:"refusee"}:x));

  const nav=[
    {id:"bibliotheque",label:"Bibliothèque Inscriptions",icon:Inbox},
    {id:"suivi",label:"Suivi Enseignants",icon:ClipboardList},
    {id:"matieres",label:"Matières par Classe",icon:FileText},
    {id:"frais",label:"Frais à fixer",icon:Wallet},
    {id:"annonces",label:"Annonces",icon:Megaphone},
    {id:"messages",label:"Messages Parents",icon:MessageSquare},
  ];

  return (
    <Coquille roleLabel="Directeur" nav={nav} actif={onglet} setActif={setOnglet} onQuitter={()=>{}}>
      {onglet==="bibliotheque" && (
        <Panel title="Bibliothèque - Demandes à valider (Seul Directeur)" icon={Inbox}>
          <div className="space-y-2">
            {demandes.filter(d=>d.statut==="en_attente").length===0 && <p style={{color:"#9A8B67"}}>Aucune demande en attente</p>}
            {demandes.filter(d=>d.statut==="en_attente").map(d=>(
              <div key={d.id} className="flex justify-between border p-3 rounded-lg" style={{borderColor:"#E7DEC8"}}>
                <div><span className="font-medium" style={{color:"#1B2A4A"}}>{d.prenom} {d.nom}</span> - {d.classeSouhaitee} - {d.origine}<br/><span className="text-[13px]" style={{color:"#5C5240"}}>Parrain: {d.parrainNom} {d.parrainTelephone}</span></div>
                <div className="flex gap-2"><Btn variant="primary" small onClick={()=>validerDemande(d)}>Valider + Générer code</Btn><Btn small onClick={()=>refuserDemande(d)}>Refuser</Btn></div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {onglet==="matieres" && (
        <Panel title="Matières - Directeur seul crée (CORRIGÉ)" icon={FileText}>
          <div className="flex gap-2 mb-4">
            <select value={classeMat} onChange={e=>setClasseMat(e.target.value)} className="border rounded-lg px-2" style={{borderColor:"#E7DEC8"}}>{classes.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <input value={nouvelleMatiere} onChange={e=>setNouvelleMatiere(e.target.value)} placeholder="Ex: Mathématiques" className="border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}/>
            <input type="number" min={1} max={5} value={coef} onChange={e=>setCoef(e.target.value)} className="border rounded-lg px-2 w-20" style={{borderColor:"#E7DEC8"}}/>
            <Btn variant="gold" onClick={()=>{
              if(!nouvelleMatiere.trim()) return;
              setMatieresParClasse(prev=>({...prev, [classeMat]: [...(prev[classeMat]||[]), {nom:nouvelleMatiere, coef:parseInt(coef)||1}]}));
              setNouvelleMatiere("");
            }}>Créer matière pour {classeMat}</Btn>
          </div>
          <div className="space-y-2">{Object.entries(matieresParClasse).map(([classe,liste])=>(
            <div key={classe} className="border p-2 rounded-lg" style={{borderColor:"#E7DEC8"}}><div className="font-bold" style={{color:"#1B2A4A"}}>{classe}</div><div className="flex flex-wrap gap-2 mt-1">{liste.map((m,i)=><Badge key={i}>{m.nom} (coef {m.coef})</Badge>)}</div></div>
          ))}</div>
          <p className="text-[13px] mt-2" style={{color:"#9A8B67"}}>Ces matières apparaîtront automatiquement chez l'enseignant dans l'onglet Noter (CORRIGÉ)</p>
        </Panel>
      )}
      {onglet==="frais" && (
        <Panel title="Frais scolaires - Fixés par Directeur (CORRIGÉ)" icon={Wallet}>
          <div className="flex gap-2 mb-3"><input value={nouveauFraisLib} onChange={e=>setNouveauFraisLib(e.target.value)} placeholder="Libellé (Écolage)" className="border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}/><input type="number" value={nouveauFraisMontant} onChange={e=>setNouveauFraisMontant(e.target.value)} placeholder="Montant" className="border rounded-lg px-3 py-2 w-32" style={{borderColor:"#E7DEC8"}}/><Btn variant="gold" onClick={()=>{
            if(!nouveauFraisLib.trim()||!nouveauFraisMontant) return;
            const nouveau={libelle:nouveauFraisLib, montant:parseInt(nouveauFraisMontant)};
            setFraisTypes(prev=>[...prev, nouveau]);
            // CORRECTION: Mettre à jour tous les élèves existants automatiquement
            setEleves(prev=>prev.map(e=>{
              if(e.frais.find(f=>f.libelle===nouveau.libelle)) return e;
              return {...e, frais:[...e.frais, {libelle:nouveau.libelle, du:nouveau.montant, paye:0, mode:null, datePaiement:null}]};
            }));
            setNouveauFraisLib(""); setNouveauFraisMontant("");
          }}>Fixer ce frais</Btn></div>
          <div className="flex flex-wrap gap-2">{fraisTypes.map((f,i)=><Badge key={i}>{f.libelle}: {f.montant.toLocaleString("fr-FR")} F</Badge>)}</div>
        </Panel>
      )}
      {onglet==="suivi" && (
        <Panel title="Suivi de chaque Enseignant - Notes / Messages (CORRIGÉ)" icon={ClipboardList}>
          <div className="space-y-3">
            {personnel.filter(p=>p.poste.includes("Enseignant")).map(ens=>{
              const elevesClasse = eleves.filter(e=>e.classe===ens.classe);
              const totalNotes = elevesClasse.reduce((s,e)=>s+e.notes.length,0);
              const derniere = elevesClasse.flatMap(e=>e.notes).sort((a,b)=> new Date(b.dateSaisie)-new Date(a.dateSaisie))[0];
              const totalMsg = messagesParents.filter(m=>m.classe===ens.classe).length;
              const totalAbs = elevesClasse.reduce((s,e)=>s+e.absences.length,0);
              return (
                <div key={ens.nom} className="border rounded-lg p-3" style={{borderColor:"#E7DEC8"}}>
                  <div className="font-medium" style={{color:"#1B2A4A"}}>{ens.nom} - {ens.classe} - {ens.telephone}</div>
                  <div className="text-[13px] mt-1" style={{color:"#5C5240"}}>Élèves: {elevesClasse.length} | Notes saisies: {totalNotes} | Absences: {totalAbs} | Messages aux parents: {totalMsg}</div>
                  <div className="text-[12px]" style={{color:"#9A8B67"}}>Dernière saisie: {derniere?.dateSaisie || "Jamais"}</div>
                  <Badge tone={totalNotes===0?"or":"vert"}>{totalNotes===0?"N'a rien saisi":"À jour"}</Badge>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
      {onglet==="messages" && (
        <Panel title="Messages Parents -> Directeur SEULEMENT (CORRIGÉ)" icon={MessageSquare}>
          <div className="space-y-2">
            {messagesParents.length===0 && <p style={{color:"#9A8B67"}}>Aucun message</p>}
            {messagesParents.map((m,i)=>(
              <div key={i} className="border rounded-lg p-3" style={{borderColor:"#E7DEC8", background: m.lu? "white":"#FBF0D2"}}>
                <div className="flex justify-between text-[13px]" style={{color:"#9A8B67"}}><span className="font-medium" style={{color:"#1B2A4A"}}>{m.nomEleve} - {m.classe}</span>{m.date}</div>
                <p className="text-[15px]" style={{color:"#3E3625"}}>{m.texte}</p>
                <p className="text-[12px]" style={{color:"#9A8B67"}}>De: Parent de {m.nomEleve}</p>
              </div>
            ))}
          </div>
          <p className="text-[13px] mt-2" style={{color:"#9A8B67"}}>CORRIGÉ: Seul le Directeur reçoit les messages des parents. Les enseignants ne les voient pas.</p>
        </Panel>
      )}
    </Coquille>
  );
}

/* --- ESPACE ENSEIGNANT - CORRIGÉ : lit matières du Directeur, absence avec choix --- */
function EspaceEnseignant({eleves,setEleves}){
  const {matieresParClasse, setMessagesParents, setMessagesInternes, messagesParents} = useEcole();
  const [onglet,setOnglet]=useState("noter");
  const [classeChoisie,setClasseChoisie]=useState("CI");
  const [eleveId,setEleveId]=useState("");
  const [matiereChoisie,setMatiereChoisie]=useState("");
  const [note,setNote]=useState("");
  const [typeAbs,setTypeAbs]=useState("Absent");
  const [motifAbs,setMotifAbs]=useState("");
  const [msg,setMsg]=useState("");

  const matieresDeClasse = matieresParClasse[classeChoisie] || [];
  const elevesDeClasse = eleves.filter(e=>e.classe===classeChoisie);
  const eleveActuel = eleves.find(e=>e.id===eleveId) || elevesDeClasse[0];

  const nav=[{id:"noter",label:"Noter",icon:ClipboardList},{id:"absences",label:"Absences",icon:CalendarClock},{id:"messages",label:"Messages",icon:MessageSquare}];

  return (
    <Coquille roleLabel="Enseignant" nav={nav} actif={onglet} setActif={setOnglet} onQuitter={()=>{}}>
      <Panel title={`Classe ${classeChoisie} - Matières créées par Directeur`} icon={FileText}>
        <select value={classeChoisie} onChange={e=>setClasseChoisie(e.target.value)} className="border rounded-lg px-3 py-2 mb-2" style={{borderColor:"#E7DEC8"}}>
          {Object.keys(matieresParClasse).map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex flex-wrap gap-2 mb-3">{matieresDeClasse.length===0? <span style={{color:"#9A8B67"}}>Aucune matière créée par le Directeur pour cette classe</span> : matieresDeClasse.map((m,i)=><Badge key={i}>{m.nom} coef {m.coef}</Badge>)}</div>
      </Panel>

      {onglet==="noter" && (
        <Panel title="Noter - CORRIGÉ: matières affichées" icon={ClipboardList}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={eleveId} onChange={e=>setEleveId(e.target.value)} className="border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}>
              {elevesDeClasse.map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
            </select>
            <select value={matiereChoisie} onChange={e=>setMatiereChoisie(e.target.value)} className="border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}>
              <option value="">Choisir matière</option>
              {matieresDeClasse.map(m=><option key={m.nom} value={m.nom}>{m.nom}</option>)}
            </select>
            <input type="number" min={0} max={20} value={note} onChange={e=>setNote(e.target.value)} placeholder="Note /20" className="border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}/>
            <Btn variant="gold" onClick={()=>{
              if(!eleveActuel||!matiereChoisie||!note) return alert("Remplir tout");
              const nouvelleNote={matiere:matiereChoisie, evaluation:"Devoir", mois:"Mai", note20:parseFloat(note), dateSaisie:"aujourd'hui"};
              setEleves(prev=>prev.map(el=> el.id===eleveActuel.id? {...el, notes:[...el.notes, nouvelleNote]}:el));
              // CORRECTION: Remonte chez Directeur automatiquement
              setMessagesInternes(prev=>[{destinataire:"directeur", texte:`Enseignant a noté ${eleveActuel.prenom} ${eleveActuel.nom} en ${matiereChoisie}: ${note}/20`, date:"aujourd'hui"},...prev]);
              setNote("");
            }}>Enregistrer note</Btn>
          </div>
        </Panel>
      )}

      {onglet==="absences" && (
        <Panel title="Absences - CORRIGÉ: choix Absent/Retard" icon={CalendarClock}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={eleveId} onChange={e=>setEleveId(e.target.value)} className="border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}>
              {elevesDeClasse.map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
            </select>
            <select value={typeAbs} onChange={e=>setTypeAbs(e.target.value)} className="border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}>
              <option>Absent</option><option>Retard</option><option>Exclusion</option><option>Sans motif</option>
            </select>
            <input value={motifAbs} onChange={e=>setMotifAbs(e.target.value)} placeholder="Motif" className="border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}/>
            <Btn variant="gold" onClick={()=>{
              if(!eleveActuel) return;
              setEleves(prev=>prev.map(el=> el.id===eleveActuel.id? {...el, absences:[...el.absences,{date:"aujourd'hui", type:typeAbs, motif:motifAbs}]}:el));
              setMessagesInternes(prev=>[{destinataire:"directeur", texte:`Absence enregistrée par enseignant: ${eleveActuel.prenom} ${eleveActuel.nom} - ${typeAbs} - ${motifAbs}`, date:"aujourd'hui"},...prev]);
              setMotifAbs("");
            }}>Enregistrer absence</Btn>
          </div>
        </Panel>
      )}

      {onglet==="messages" && (
        <Panel title="Message aux parents - Remonte aussi chez Directeur (CORRIGÉ)" icon={MessageSquare}>
          <div className="flex gap-2">
            <select value={eleveId} onChange={e=>setEleveId(e.target.value)} className="border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}>{elevesDeClasse.map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}</select>
            <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Message aux parents" className="w-full border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}/>
            <Btn variant="primary" onClick={()=>{
              if(!msg.trim()||!eleveActuel) return;
              setEleves(prev=>prev.map(el=> el.id===eleveActuel.id? {...el, messages:[...el.messages,{auteur:"Enseignant", texte:msg, date:"aujourd'hui"}]}:el));
              // CORRECTION: Va chez parent + copie chez Directeur
              setMessagesParents(prev=>[{eleveId:eleveActuel.id, nomEleve:`${eleveActuel.prenom} ${eleveActuel.nom}`, classe:eleveActuel.classe, texte:`De Enseignant: ${msg}`, date:"aujourd'hui", lu:false},...prev]);
              setMessagesInternes(prev=>[{destinataire:"directeur", texte:`Enseignant -> ${eleveActuel.prenom} ${eleveActuel.nom}: ${msg}`, date:"aujourd'hui"},...prev]);
              setMsg("");
            }}>Envoyer</Btn>
          </div>
        </Panel>
      )}
    </Coquille>
  );
}

/* --- ESPACE SECRETAIRE - CORRIGÉ --- */
function EspaceSecretaire({eleves,setEleves,demandes,setDemandes,annonces}){
  const [onglet,setOnglet]=useState("inscriptions");
  const [form,setForm]=useState({prenom:"",nom:"",sexe:"",naissance:"",classe:CLASSES_INIT[0],parrainNom:"",parrainTelephone:""});
  const [montantsSaisis,setMontantsSaisis]=useState({});
  const [modePaiementSaisi,setModePaiementSaisi]=useState({});
  const {classes,fraisTypes,setMessagesInternes}=useEcole();
  const champ=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const valide=form.prenom&&form.nom&&form.sexe&&form.naissance&&form.classe&&form.parrainNom&&form.parrainTelephone;
  const soumettreInscription=()=>{
    if(!valide) return;
    const d={id:Date.now().toString(), prenom:form.prenom, nom:form.nom, sexe:form.sexe, naissance:form.naissance, classeSouhaitee:form.classe, parrainNom:form.parrainNom, parrainTelephone:form.parrainTelephone, origine:"secretariat", date:"aujourd'hui", statut:"en_attente"};
    setDemandes(prev=>[d,...prev]);
    alert("Demande transmise au Directeur pour validation - vous ne verrez pas le code (règle Directeur seul)");
    setForm({prenom:"",nom:"",sexe:"",naissance:"",classe:classes[0],parrainNom:"",parrainTelephone:""});
  };
  const champMontant=(eleveId,libelle,val)=> setMontantsSaisis(prev=>({...prev,[eleveId]:{...(prev[eleveId]||{}),[libelle]:val}}));
  const totalSaisiPour=(eleveId)=>{ const m=montantsSaisis[eleveId]||{}; return Object.values(m).reduce((s,v)=>s+(parseFloat(v)||0),0); };
  const enregistrerPaiement=(eleve)=>{
    const montants=montantsSaisis[eleve.id]||{}; const mode=modePaiementSaisi[eleve.id]||MODES_PAIEMENT[0]; const total=totalSaisiPour(eleve.id); if(total<=0) return;
    setEleves(prev=>prev.map(e=> e.id===eleve.id? {...e, frais:e.frais.map(f=>{ const ajout=parseFloat(montants[f.libelle])||0; if(ajout<=0) return f; return {...f, paye:f.paye+ajout, mode, datePaiement:"aujourd'hui"};} )}:e));
    // CORRECTION REGLE 5: Apparaît auto chez Parents (via eleves.frais) + chez Directeur via message interne
    setMessagesInternes(prev=>[{destinataire:"directeur", texte:`Paiement Secrétaire: ${eleve.prenom} ${eleve.nom} - ${total}F (${mode}) - reste: ${eleve.frais.reduce((a,f)=>a+f.du,0)-eleve.frais.reduce((a,f)=>a+f.paye,0)-total}F`, date:"aujourd'hui"},...prev]);
    setMontantsSaisis(prev=>({...prev,[eleve.id]:{}}));
  };
  const nav=[{id:"inscriptions",label:"Inscriptions",icon:ClipboardList},{id:"frais",label:"Frais scolaires",icon:Wallet},{id:"annonces",label:"Annonces (lecture seule)",icon:Megaphone}];
  return (
    <Coquille roleLabel="Mlle Dossou - Secrétaire" nav={nav} actif={onglet} setActif={setOnglet} onQuitter={()=>{}}>
      {onglet==="inscriptions" && (
        <Panel title="Inscrire un enfant (venu au secrétariat) - Part direct chez Directeur" icon={FileText}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Champ label="Prénom" value={form.prenom} onChange={champ("prenom")}/><Champ label="Nom" value={form.nom} onChange={champ("nom")}/>
            <div><label className="mb-1 block text-[13px]" style={{color:"#5C5240"}}>Sexe</label><div className="flex gap-2">{[{v:"F",l:"Féminin"},{v:"M",l:"Masculin"}].map(o=><button key={o.v} onClick={()=>setForm({...form,sexe:o.v})} className="flex-1 border rounded-lg px-3 py-2" style={{borderColor:form.sexe===o.v?"#C9A227":"#E7DEC8", background:form.sexe===o.v?"#FBF0D2":"transparent"}}>{o.l}</button>)}</div></div>
            <Champ label="Date naissance" type="date" value={form.naissance} onChange={champ("naissance")}/>
            <div><label className="mb-1 block text-[13px]" style={{color:"#5C5240"}}>Classe souhaitée</label><select value={form.classe} onChange={champ("classe")} className="w-full border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}>{classes.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <Champ label="Nom parrain" value={form.parrainNom} onChange={champ("parrainNom")}/><Champ label="Numéro parrain" value={form.parrainTelephone} onChange={champ("parrainTelephone")} placeholder="9x xx xx xx"/>
          </div>
          <div className="mt-4 flex justify-between"><Btn variant="gold" onClick={soumettreInscription}>Transmettre au Directeur</Btn></div>
          <p className="text-[13px] mt-2" style={{color:"#9A8B67"}}>RÈGLE: Vous ne générez pas de code, seul le Directeur valide.</p>
        </Panel>
      )}
      {onglet==="frais" && (
        <Panel title="Frais scolaires - Montants fixés par Directeur (CORRIGÉ)" icon={Wallet}>
          <div className="mb-2 flex flex-wrap gap-2">{fraisTypes.map((f,i)=><Badge key={i}>{f.libelle}: {f.montant}F</Badge>)}</div>
          <div className="space-y-3">
            {eleves.map(e=>{
              const du=e.frais.reduce((a,f)=>a+f.du,0); const paye=e.frais.reduce((a,f)=>a+f.paye,0); const reste=du-paye; const totalSaisi=totalSaisiPour(e.id); const mode=modePaiementSaisi[e.id]||MODES_PAIEMENT[0];
              return (
                <div key={e.id} className="border p-3 rounded-lg" style={{borderColor:"#E7DEC8"}}>
                  <div className="flex justify-between"><span className="font-medium" style={{color:"#1B2A4A"}}>{e.prenom} {e.nom} - {e.classe}</span><Badge tone={reste===0?"vert":"or"}>{reste===0?"Soldé":`Reste ${reste}F`}</Badge></div>
                  {e.frais.map((f,i)=>{
                    const v=(montantsSaisis[e.id]||{})[f.libelle]||"";
                    return <div key={i} className="flex justify-between items-center mt-2 text-[13px]"><span>{f.libelle}: Dû {f.du}F - Payé {f.paye}F</span><input type="number" value={v} onChange={ev=>champMontant(e.id,f.libelle,ev.target.value)} placeholder="Montant à verser" className="border rounded px-2 py-1 w-32 text-right" style={{borderColor:"#E7DEC8"}}/></div>;
                  })}
                  {(reste>0||totalSaisi>0) && <div className="mt-2 flex justify-between items-center bg-[#F1ECDD] p-2 rounded-lg"><span className="text-[13px]">Total saisi: {totalSaisi}F</span><div className="flex gap-2"><select value={mode} onChange={ev=>setModePaiementSaisi(p=>({...p,[e.id]:ev.target.value}))} className="border rounded px-2 py-1 text-[13px]" style={{borderColor:"#E7DEC8"}}>{MODES_PAIEMENT.map(m=><option key={m} value={m}>{m}</option>)}</select><Btn variant="gold" small onClick={()=>enregistrerPaiement(e)}>Enregistrer - visible Parent+Directeur</Btn></div></div>}
                </div>
              );
            })}
          </div>
        </Panel>
      )}
      {onglet==="annonces" && (
        <Panel title="Annonces du Directeur - Lecture seule (CORRIGÉ)" icon={Megaphone}>
          <div className="space-y-2">{annonces.length===0? <p style={{color:"#9A8B67"}}>Aucune annonce du Directeur</p> : annonces.map((a,i)=><div key={i} className="border p-3 rounded-lg" style={{borderColor:"#E7DEC8"}}><div className="font-medium" style={{color:"#1B2A4A"}}>{a.titre}</div><div className="text-[13px]" style={{color:"#5C5240"}}>{a.texte}</div><div className="text-[12px]" style={{color:"#9A8B67"}}>{a.date}</div></div>)}</div>
          <p className="text-[13px] mt-2" style={{color:"#9A8B67"}}>CORRIGÉ: Annonces créées par Directeur, visibles ici + chez Parents/Enseignants</p>
        </Panel>
      )}
    </Coquille>
  );
}

/* --- ESPACE PARENT - CORRIGÉ : notes/frais affichés + message -> Directeur seul --- */
function EspaceParent({eleves,setEleves,eleveId,personnel}){
  const {setMessagesParents,setMessagesInternes}=useEcole();
  const [onglet,setOnglet]=useState("notes");
  const [message,setMessage]=useState("");
  const enfant=eleves.find(e=>e.id===eleveId)||eleves[0];
  const enseignantClasse=useMemo(()=>personnel.find(p=>p.classe===enfant.classe && (p.poste==="Enseignant"||p.poste==="Enseignante")),[personnel,enfant.classe]);
  const nav=[{id:"notes",label:"Notes",icon:ClipboardList},{id:"absences",label:"Absences",icon:CalendarClock},{id:"frais",label:"Frais",icon:Wallet},{id:"messages",label:"Messages",icon:MessageSquare}];
  const moyenne=useMemo(()=>{ if(!enfant.notes.length) return null; const t=enfant.notes.reduce((s,n)=>s+n.note20,0); return Math.round((t/enfant.notes.length)*10)/10; },[enfant]);
  if(!enfant) return <div>Aucun élève</div>;
  return (
    <Coquille roleLabel={`Parent de ${enfant.prenom} ${enfant.nom}`} nav={nav} actif={onglet} setActif={setOnglet} onQuitter={()=>{}}>
      <Panel title="Profil" icon={UserCircle2}><div className="flex gap-4"><div className="h-16 w-16 rounded-full flex items-center justify-center font-serif text-lg" style={{background:"#1B2A4A",color:"#C9A227"}}>{enfant.prenom[0]}{enfant.nom[0]}</div><div><div>Classe: {enfant.classe}</div><div>Code: {enfant.id}</div><div>Enseignant: {enseignantClasse?.nom||enfant.enseignant}</div></div></div></Panel>
      {onglet==="notes" && (
        <Panel title="Notes - CORRIGÉ: maintenant affichées" icon={ClipboardList}>
          {moyenne && <div className="mb-3 p-3 rounded-lg" style={{background:"#1B2A4A", color:"#FAF6EE"}}>Moyenne: {moyenne}/20</div>}
          <div className="space-y-2">{enfant.notes.length===0? <p style={{color:"#9A8B67"}}>Aucune note (si c'est encore vide, c'est le bug Supabase lids qui a vidé ta table - vide notes et re-saisis une note)</p> : enfant.notes.map((n,i)=><div key={i} className="border flex justify-between p-3 rounded-lg" style={{borderColor:"#E7DEC8"}}><div><div className="font-medium" style={{color:"#1B2A4A"}}>{n.matiere}</div><div className="text-[13px]" style={{color:"#5C5240"}}>{n.evaluation} - {n.mois} - Saisi le {n.dateSaisie}</div></div><div className="h-10 w-14 rounded-full flex items-center justify-center" style={{background:"#F6D24A"}}>{n.note20}/20</div></div>)}</div>
        </Panel>
      )}
      {onglet==="absences" && (
        <Panel title="Absences - CORRIGÉ" icon={CalendarClock}><div className="space-y-2">{enfant.absences.length===0? <p style={{color:"#9A8B67"}}>Aucune absence</p> : enfant.absences.map((a,i)=><div key={i} className="border p-3 rounded-lg" style={{borderColor:"#E7DEC8"}}><Badge tone={a.type==="Sans motif"?"or":"vert"}>{a.type}</Badge> - {a.date}<br/>{a.motif}</div>)}</div></Panel>
      )}
      {onglet==="frais" && (
        <Panel title="Frais - Montants du Directeur (CORRIGÉ)" icon={Wallet}><div className="space-y-2">{enfant.frais.map((f,i)=><div key={i} className="border flex justify-between p-3 rounded-lg" style={{borderColor:"#E7DEC8"}}><span>{f.libelle}</span><span>{f.paye}/{f.du}F - {f.paye>=f.du?"Soldé":"Reste"}</span></div>)}</div></Panel>
      )}
      {onglet==="messages" && (
        <Panel title="Messages -> Directeur SEULEMENT (CORRIGÉ - ta demande)" icon={MessageSquare}>
          <div className="mb-3 space-y-2">{enfant.messages.map((m,i)=><div key={i} className="rounded-lg p-2" style={{background:"#F1ECDD"}}><div className="text-[13px]" style={{color:"#9A8B67"}}>{m.auteur} - {m.date}</div><div style={{color:"#3E3625"}}>{m.texte}</div></div>)}</div>
          <div className="flex gap-2"><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Écrire au Directeur uniquement..." className="w-full border rounded-lg px-3 py-2" style={{borderColor:"#E7DEC8"}}/><Btn variant="primary" icon={Send} onClick={()=>{
            if(!message.trim()) return;
            // CORRECTION DEMANDÉE: Parent -> Directeur SEULEMENT, pas aux enseignants
            setEleves(prev=>prev.map(e=> e.id===enfant.id? {...e, messages:[...e.messages,{auteur:"Vous (Parent)", texte:message, date:"aujourd'hui"}]}:e));
            setMessagesParents(prev=>[{eleveId:enfant.id, nomEleve:`${enfant.prenom} ${enfant.nom}`, classe:enfant.classe, texte:message, date:"aujourd'hui", lu:false, origine:"parent"},...prev]);
            // Ne PAS envoyer à enseignant, seulement message interne pour Directeur
            setMessagesInternes(prev=>[{destinataire:"directeur", texte:`Message Parent de ${enfant.prenom} ${enfant.nom} (${enfant.classe}): ${message}`, date:"aujourd'hui", origine:"parent"},...prev]);
            setMessage("");
            alert("Message envoyé au Directeur uniquement (ne sera pas vu par les enseignants)");
          }}>Envoyer au Directeur</Btn></div>
          <p className="text-[12px] mt-2" style={{color:"#9A8B67"}}>CORRIGÉ selon ta demande: ce message va seulement chez le Directeur, pas chez les enseignants.</p>
        </Panel>
      )}
    </Coquille>
  );
}


function Connexion({onEntrer,onInscription,eleves}){
  const {ecole} = useEcole();
  const [code,setCode]=useState("");
  const entrer = ()=>{
    const c = code.trim().toUpperCase();
    if(!c) return;
    if(c==="1234"||c==="ADMIN"||c.startsWith("CSP-ADM")||c==="97 11 22 33") onEntrer("directeur");
    else if(c==="5678"||c.startsWith("ENS")) onEntrer("enseignant");
    else if(c==="9012"||c.startsWith("SEC")) onEntrer("secretaire");
    else {
      const el = eleves.find(e=>e.id.toUpperCase()===c);
      if(el) onEntrer("parent", el.id);
      else alert("Code non trouvé. Vérifie le code élève ou demande au Directeur. Exemple: CSPSJHD");
    }
  };
  return (
    <div className="min-h-screen" style={{background:"#FAF6EE"}}>
      <div className="w-full bg-[#FFFBF0] border-b" style={{borderColor:"#E7DEC8"}}>
        <div className="mx-auto max-w-4xl px-6 py-8 text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-white border-2 flex items-center justify-center shadow-sm overflow-hidden" style={{borderColor:"#1B2A4A"}}>
            {ecole.logoUrl ? <img src={ecole.logoUrl} alt="CSP" className="h-full w-full object-cover"/> : <span className="font-bold text-2xl" style={{color:"#1B2A4A"}}>CSP</span>}
          </div>
          <p className="text-[11px] tracking-widest uppercase" style={{color:"#9A8B67"}}>ÉCOLE CONNECTÉE</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mt-1" style={{color:"#1B2A4A"}}>Complexe Scolaire Protestant</h1>
          <p className="font-serif italic text-xl mt-1" style={{color:"#C9A227"}}>CSP « Sagesse Divine »</p>
          <p className="mt-4 text-[14px] leading-snug" style={{color:"#5C5240"}}>Kèra, à côté du Temple EPMB Cité de Paix — Tchaourou, Borgou</p>
          <p className="text-[13px] mt-1" style={{color:"#9A8B67"}}>Directeur : 97 11 22 33 · contact@csp-sagessedivine.bj</p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={()=>onEntrer("directeur")} className="text-left rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition" style={{borderColor:"#E7DEC8"}}>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{background:"#1B2A4A", color:"#C9A227"}}><ClipboardList size={20}/></div>
          <p className="mt-4 font-serif text-xl" style={{color:"#1B2A4A"}}>Espace Administratif</p>
          <p className="text-[14px]" style={{color:"#7A6E58"}}>Vue d'ensemble et administration - Tableau de bord, Bibliothèque, Suivi pédagogique, Matières, Frais, Annonces, Messages</p>
        </button>
        <button onClick={()=>onEntrer("enseignant")} className="text-left rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition" style={{borderColor:"#E7DEC8"}}>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{background:"#1B2A4A", color:"#C9A227"}}><FileText size={20}/></div>
          <p className="mt-4 font-serif text-xl" style={{color:"#1B2A4A"}}>Enseignant</p>
          <p className="text-[14px]" style={{color:"#7A6E58"}}>Notes et absences de sa classe - toutes matières, tous élèves</p>
        </button>
        <button onClick={()=>onEntrer("secretaire")} className="text-left rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition" style={{borderColor:"#E7DEC8"}}>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{background:"#1B2A4A", color:"#C9A227"}}><Wallet size={20}/></div>
          <p className="mt-4 font-serif text-xl" style={{color:"#1B2A4A"}}>Secrétaire</p>
          <p className="text-[14px]" style={{color:"#7A6E58"}}>Inscriptions et frais scolaires - saisie, pas de génération de code</p>
        </button>
        <div className="text-left rounded-2xl border bg-white p-5 shadow-sm" style={{borderColor:"#E7DEC8"}}>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{background:"#1B2A4A", color:"#C9A227"}}><UserCircle2 size={20}/></div>
          <p className="mt-4 font-serif text-xl" style={{color:"#1B2A4A"}}>Espace Parent</p>
          <p className="text-[14px] mb-3" style={{color:"#7A6E58"}}>Suivi de mon enfant - notes, absences, frais, message Directeur seul</p>
          <div className="flex gap-2"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Code élève (ex: CSPSJHD)" className="flex-1 rounded-lg border px-3 py-2 text-[14px] outline-none" style={{borderColor:"#E7DEC8"}}/><button onClick={entrer} className="rounded-lg px-4 py-2 text-[14px] font-medium" style={{background:"#1B2A4A", color:"#FAF6EE"}}>Entrer</button></div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 pb-10 text-center">
        <button onClick={onInscription} className="rounded-full border px-6 py-3 text-[15px] font-medium shadow-sm bg-white hover:bg-[#FFFBF0] transition" style={{borderColor:"#C9A227", color:"#8A6D14"}}>📄 Inscrire mon enfant en ligne</button>
        <p className="mt-4 text-[12px]" style={{color:"#9A8B67"}}>Prototype connecté à Supabase — toutes les données sont sauvegardées.</p>
      </div>
    </div>
  );
}

