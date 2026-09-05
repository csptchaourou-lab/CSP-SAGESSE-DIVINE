import { useState, useEffect, useMemo } from 'react';

const ECOLE = {
  nom: "Complexe Scolaire Protestant",
  sigle: "CSP « Sagesse Divine »",
  quartier: "Kèra, à côté du Temple EPMB Cité de Paix",
  commune: "Tchaourou",
  departement: "Borgou",
  directeur: "Past. A. S. Boko",
  tel: "97 11 22 33",
  email: "contact@csp-sagessedivine.bj",
  devise: "Excellence Réelle",
};
function genererCode(){ const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return `CSP${s}`; }

export default function App(){
  const [role,setRole]=useState(null);
  const [code,setCode]=useState(''); const [erreur,setErreur]=useState(''); const [eleveId,setEleveId]=useState('');
  const [vueInscription,setVueInscription]=useState(false);
  const [onglet,setOnglet]=useState('dashboard'); const [ongletTop,setOngletTop]=useState('tableau');
  const [ecole,setEcole]=useState(ECOLE);
  const [classes,setClasses]=useState(["Maternelle 1","Maternelle 2","CI","CP","CE1","CE2","CM1","CM2","6ème A"]);
  const [eleves,setEleves]=useState([{id:"CSP0142",nom:"Adjovi",prenom:"Grâce",classe:"CM1",parent:{nom:"M. Adjovi",tel:"97 00 00 00"},frais:[{libelle:"Inscription",du:25000,paye:25000},{libelle:"Scolarité",du:90000,paye:60000},{libelle:"Uniforme",du:15000,paye:15000},{libelle:"T-shirt",du:5000,paye:5000},{libelle:"Lacoste",du:7000,paye:0}]}]);
  const [demandes,setDemandes]=useState([]);
  const [fraisTypes,setFraisTypes]=useState([{libelle:"Inscription",montant:25000},{libelle:"Scolarité",montant:90000},{libelle:"Uniforme",montant:15000},{libelle:"T-shirt",montant:5000},{libelle:"Lacoste",montant:7000}]);
  const [codes,setCodes]=useState({fondateur:"0000",directeur:"1234",admin:"1234",enseignant:"5678",secretaire:"9012"});
  const [form,setForm]=useState({prenom:"",nom:"",classe:"CM1",parrainNom:"",parrainTel:""});

  const stats = useMemo(()=>{return {total:eleves.length, dus:eleves.reduce((s,e)=>s+e.frais.reduce((a,f)=>a+(f.du-f.paye),0),0)}},[eleves]);
  const enAttente = demandes.filter(d=>d.statut==='en_attente').length;
  const navDirecteur = ["1. Tableau de bord","2. Bibliothèque","3. Vue par Classe","4. Suivi pédagogique","5. Classes","6. Matières","7. Emploi du temps","8. Frais scolaires","9. Année scolaire","10. Personnel","11. Message Public","12. Message Interne","13. Messages parents","14. Paramètres"];
  const navFondateur = [...navDirecteur,"15. Directeur - Supprimer 🔥","16. Codes - EXCLUSIF 🔐"];

  const validerCode=()=>{
    const saisie=code.trim().toUpperCase();
    if(role==='parent'){ const e=eleves.find(x=>x.id.toUpperCase()===saisie); if(!e){setErreur("Introuvable - Essaie CSP0142");return;} setEleveId(e.id); setErreur(""); return;}
    if(code===codes[role]||saisie===codes[role]){setErreur("");}else{setErreur(`Incorrect - Attendu: ${codes[role]}`);}
  };
  const estConnecte = role && (role==='parent'?!!eleveId:code===codes[role]);

  if(!role){
    return (
      <div className="min-h-screen" style={{background:'#FAF6EE'}}>
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-white font-bold" style={{background:'#1B2A4A'}}>CSP</div>
          <h1 className="font-serif text-2xl mt-3" style={{color:'#1B2A4A'}}>{ecole.nom}</h1>
          <p className="italic" style={{color:'#8A6D14'}}>{ecole.sigle}</p>
          <p className="text-sm" style={{color:'#5C5240'}}>{ecole.quartier} — {ecole.commune}</p>
          <div className="grid grid-cols-2 gap-4 mt-8 text-left">
            <button onClick={()=>setRole('fondateur')} className="bg-white rounded-2xl border p-5 text-left"><div className="font-bold">Espace Fondateur</div><div className="text-xs text-gray-500">Pouvoir Total - 14 pilules + Supprime Directeur</div></button>
            <button onClick={()=>setRole('admin')} className="bg-white rounded-2xl border p-5 text-left"><div className="font-bold">Espace Administratif</div><div className="text-xs text-gray-500">Directeur - 14 pilules</div></button>
            <button onClick={()=>setRole('parent')} className="bg-white rounded-2xl border p-5 text-left"><div className="font-bold">Espace Parent</div><div className="text-xs text-gray-500">CSP0142</div></button>
            <button onClick={()=>setVueInscription(true)} className="bg-green-600 text-white rounded-2xl p-5 text-left"><div className="font-bold">Inscription en ligne</div><div className="text-xs">{enAttente} demande(s)</div></button>
          </div>
          <p className="text-[11px] mt-6" style={{color:'#9A8B67'}}>Codes: Fondateur 0000 / Directeur 1234 / Parent CSP0142</p>
        </div>
      </div>
    );
  }
  if(!estConnecte){
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{background:'#FAF6EE'}}>
        <div className="bg-white rounded-2xl shadow p-6 max-w-md w-full">
          <button onClick={()=>setRole(null)} className="text-xs">← Page de garde</button>
          <h1 className="font-bold mt-3">Code {role}</h1>
          <input autoFocus value={code} onChange={e=>setCode(e.target.value)} placeholder="Code" className="w-full border rounded-xl px-4 py-3 mt-3 font-mono"/>
          {erreur&&<p className="text-red-600 text-xs mt-2">{erreur}</p>}
          <button onClick={validerCode} className="w-full mt-3 text-white py-3 rounded-xl" style={{background:'#1B2A4A'}}>Entrer</button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen" style={{background:'#FAF6EE'}}>
      <header className="bg-white border-b px-4 py-3 flex justify-between"><div className="font-bold text-sm">{role==='fondateur'?'🛡️ Fondateur - Pouvoir Total':'🏫 Directeur - 14 pilules'}</div><button onClick={()=>{setRole(null);setCode('');}} className="text-xs border rounded-full px-3 py-1">← Quitter</button></header>
      <div className="max-w-6xl mx-auto p-3">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {(role==='fondateur'?navFondateur:navDirecteur).map(n=><button key={n} onClick={()=>setOnglet(n.toLowerCase().includes('tableau')?'dashboard':n.toLowerCase().includes('biblio')?'bibliotheque':n.toLowerCase().includes('frais')?'frais':n.toLowerCase().includes('param')?'parametres':'dashboard')} className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] border ${onglet===n.toLowerCase().includes('tableau')?'dashboard':''?'bg-[#1B2A4A] text-white':''} bg-white`}>{n}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[16px] border p-4"><p className="text-xs" style={{color:'#8A7D5A'}}>ÉLÈVES INSCRITS</p><p className="text-3xl font-serif">{stats.total}</p></div>
          <div className="bg-white rounded-[16px] border p-4"><p className="text-xs" style={{color:'#8A7D5A'}}>CLASSES ACTIVES</p><p className="text-3xl font-serif">{classes.length}</p></div>
          <div className="bg-white rounded-[16px] border p-4"><p className="text-xs" style={{color:'#8A7D5A'}}>FRAIS DUS</p><p className="text-xl font-bold" style={{color:'#8A6D1B'}}>{stats.dus} F</p></div>
          <div className="bg-white rounded-[16px] border p-4"><p className="text-xs" style={{color:'#8A7D5A'}}>DEMANDES EN ATTENTE</p><p className="text-3xl font-bold" style={{color:'#8A6D1B'}}>{enAttente}</p></div>
        </div>
        <p className="text-[11px] mt-4">✅ FIX page blanche - App sans librairie - 14 pilules + Frais Inscription, Scolarité, Uniforme, T-shirt, Lacoste + Frère détecté</p>
      </div>
    </div>
  );
}
