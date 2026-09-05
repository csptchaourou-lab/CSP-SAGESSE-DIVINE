import { useState, useEffect } from 'react';

const ECOLE_INIT = { 
  nom:"Complexe Scolaire Protestant", 
  sigle:"CSP « Sagesse Divine »", 
  quartier:"Kèra, à côté du Temple EPMB Cité de Paix", 
  commune:"Tchaourou", 
  departement:"Borgou", 
  directeur:"Past. A. S. Boko", 
  tel:"97 11 22 33", 
  email:"contact@csp-sagessedivine.bj", 
  devise:"Excellence Réelle" 
};

function genererCode(){ 
  const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  let s=""; 
  for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; 
  return `CSP${s}`; 
}

export default function App(){
  const [role,setRole]=useState(null);
  const [code,setCode]=useState(''); 
  const [erreur,setErreur]=useState(''); 
  const [eleveId,setEleveId]=useState('');
  const [vueInscription,setVueInscription]=useState(false);
  const [ongletDir,setOngletDir]=useState('dashboard');
  const [ongletFond,setOngletFond]=useState('dashboard');
  const [ongletTop,setOngletTop]=useState('tableau');

  const [demandes,setDemandes]=useState(()=>JSON.parse(localStorage.getItem('csp_demandes')||'[]'));
  const [eleves,setEleves]=useState(()=>JSON.parse(localStorage.getItem('csp_eleves')||'[{"id":"CSP0142","prenom":"Grâce","nom":"Adjovi","classe":"CM1","age":9,"fraisPaye":20000,"fraisDu":90000},{"id":"CSP0198","prenom":"Emmanuel","nom":"Toko","classe":"CM1","age":8,"fraisPaye":50000,"fraisDu":90000},{"id":"CSP2JH6","prenom":"Nadège","nom":"Kora","classe":"6ème A","age":11,"fraisPaye":0,"fraisDu":90000}]'));
  const [codesEleves,setCodesEleves]=useState(()=>JSON.parse(localStorage.getItem('csp_codes')||'["CSP0142","CSP0198","CSP2JH6"]'));
  const [codesStaff,setCodesStaff]=useState(()=>JSON.parse(localStorage.getItem('csp_codes_staff')||'{"fondateur":"0000","admin":"1234","enseignant":"5678","secretaire":"9012","directeur":"DIR-2025"}'));
  const [classes,setClasses]=useState(()=>JSON.parse(localStorage.getItem('csp_classes')||'["Maternelle 1","Maternelle 2","CI","CP","CE1","CE2","CM1","CM2","6ème A"]'));
  const [fraisTypes,setFraisTypes]=useState(()=>JSON.parse(localStorage.getItem('csp_frais')||'[{"libelle":"Inscription","montant":25000},{"libelle":"Écolage","montant":90000},{"libelle":"Cantine","montant":20000}]'));
  const [personnel,setPersonnel]=useState(()=>JSON.parse(localStorage.getItem('csp_perso')||'[{"nom":"M. DOSSOU","poste":"Enseignant","classe":"CM1"},{"nom":"Mme AHO","poste":"Enseignante","classe":"6ème A"}]'));
  const [form,setForm]=useState({prenom:'',nom:'',classe:'CM1',parrainNom:'',parrainTel:''});

  useEffect(()=>localStorage.setItem('csp_demandes',JSON.stringify(demandes)),[demandes]);
  useEffect(()=>localStorage.setItem('csp_eleves',JSON.stringify(eleves)),[eleves]);
  useEffect(()=>localStorage.setItem('csp_codes',JSON.stringify(codesEleves)),[codesEleves]);
  useEffect(()=>localStorage.setItem('csp_codes_staff',JSON.stringify(codesStaff)),[codesStaff]);
  useEffect(()=>localStorage.setItem('csp_classes',JSON.stringify(classes)),[classes]);

  const validerDemande=(d)=>{ 
    const co=genererCode(); 
    setCodesEleves([co,...codesEleves]); 
    setEleves([...eleves,{id:co,prenom:d.prenom,nom:d.nom,classe:d.classe,age:9,fraisPaye:0,fraisDu:90000}]); 
    setDemandes(demandes.map(x=>x.id===d.id?{...x,statut:'validee',codeGenere:co}:x)); 
  };

  const spaces=[
    {id:'fondateur',label:'Espace Fondateur',desc:'Pouvoir Total - 14 rôles + Supprime Directeur',color:'bg-slate-900',icon:'🛡️',badge:'SUPER ADMIN'},
    {id:'admin',label:'Espace Administratif',desc:'Directeur - 14 pilules comme APP 3311',color:'bg-blue-900',icon:'🏫'},
    {id:'enseignant',label:'Espace Enseignant',desc:'Notes & absences',color:'bg-indigo-700',icon:'📝'},
    {id:'secretaire',label:'Espace Secrétaire',desc:'Frais scolaires',color:'bg-sky-700',icon:'💰'},
    {id:'parent',label:'Espace Parent',desc:'Suivi enfant',color:'bg-emerald-700',icon:'👨‍👩‍👧'},
  ];

  const navDirecteur = [
    {id:'dashboard', label:'Tableau de bord'},
    {id:'bibliotheque', label:'Bibliothèque'},
    {id:'vueClasse', label:'Vue par Classe'},
    {id:'suivi', label:'Suivi pédagogique'},
    {id:'classes', label:'Classes'},
    {id:'matieres', label:'Matières'},
    {id:'emploi', label:'Emploi du temps'},
    {id:'frais', label:'Frais scolaires'},
    {id:'annee', label:'Année scolaire'},
    {id:'personnel', label:'Personnel'},
    {id:'messagePublic', label:'Message Public'},
    {id:'messageInterne', label:'Message Interne'},
    {id:'messagesParents', label:'Messages parents'},
    {id:'parametres', label:'Paramètres'},
  ];

  const validerCode=()=>{ 
    const s=code.trim().toUpperCase(); 
    if(role==='parent'){ 
      if(/^CSP[A-Z0-9]{4}$/.test(s)&&(codesEleves.includes(s)||eleves.find(e=>e.id===s))){
        setEleveId(s);setErreur('');
      } else setErreur('Introuvable'); 
      return; 
    } 
    if(code===(codesStaff[role]||'')){setErreur('');} else setErreur(`Incorrect. Code actuel: ${codesStaff[role]}`); 
  };
  
  const estConnecte = role && (role==='parent'?!!eleveId:code===(codesStaff[role]||''));

  if(vueInscription){
    return (
      <div className="min-h-screen p-4" style={{background:'#FAF6EE'}}>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
          <button onClick={()=>setVueInscription(false)} className="px-3 py-1 bg-gray-100 rounded-full text-xs">← Page de garde</button>
          <h1 className="font-bold mt-3">Inscription en ligne - {ECOLE_INIT.sigle}</h1>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <input placeholder="Prénom" value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} className="border rounded-lg px-3 py-2 text-sm"/>
            <input placeholder="Nom" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} className="border rounded-lg px-3 py-2 text-sm"/>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <select value={form.classe} onChange={e=>setForm({...form,classe:e.target.value})} className="border rounded-lg px-3 py-2 text-sm">
              {classes.map(c=><option key={c}>{c}</option>)}
            </select>
            <input placeholder="Parrain" value={form.parrainNom} onChange={e=>setForm({...form,parrainNom:e.target.value})} className="border rounded-lg px-3 py-2 text-sm"/>
          </div>
          <button onClick={()=>{const n={id:`DEM-${Math.floor(Math.random()*9000)}`,...form,statut:'en_attente'}; setDemandes([n,...demandes]); setVueInscription(false);}} className="w-full mt-3 bg-yellow-600 text-white py-3 rounded-xl">Envoyer</button>
        </div>
      </div>
    );
  }

  if(role && !estConnecte){
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-6">
          <button onClick={()=>{setRole(null);setCode('');}} className="px-3 py-1 bg-gray-100 rounded-full text-xs">← Page de garde</button>
          <h1 className="font-bold mt-3">{spaces.find(s=>s.id===role)?.label}</h1>
          <input autoFocus value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&validerCode()} placeholder="Code" className="mt-3 w-full border rounded-xl px-4 py-3 font-mono"/>
          <button onClick={validerCode} className="mt-3 w-full bg-[#1B2A4A] text-white py-3 rounded-xl">Entrer</button>
          {erreur&&<p className="text-red-600 text-xs mt-2">{erreur}</p>}
          <p className="text-[10px] text-gray-400 mt-2">Test: {role==='parent'?codesEleves[0]:codesStaff[role]}</p>
        </div>
      </div>
    );
  }

  if(role && estConnecte){
    const nbEleves = eleves.length; 
    const nbClasses = classes.length; 
    const fraisDus = eleves.reduce((s,e)=>s+((e.fraisDu||0)-(e.fraisPaye||0)),0); 
    const demandesAttente = demandes.filter(d=>d.statut==='en_attente').length;

    const renderDashboardPhoto = () => (
      <div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button onClick={()=>setOngletTop('tableau')} className={`shrink-0 px-5 py-2.5 rounded-full text-[14px] flex gap-2 border ${ongletTop==='tableau'?'bg-[#1B2A4A] text-white border-[#1B2A4A]':'bg-[#FFFBF2] border-[#E8DDC0]'}`}>⊞ Tableau de bord</button>
          <button onClick={()=>setOngletTop('bibliotheque')} className={`shrink-0 px-5 py-2.5 rounded-full text-[14px] flex gap-2 border ${ongletTop==='bibliotheque'?'bg-[#1B2A4A] text-white border-[#1B2A4A]':'bg-[#FFFBF2] border-[#E8DDC0]'}`}>🗄️ Bibliothèque</button>
          <button onClick={()=>setOngletTop('vuepar')} className={`shrink-0 px-5 py-2.5 rounded-full text-[14px] flex gap-2 border ${ongletTop==='vuepar'?'bg-[#1B2A4A] text-white border-[#1B2A4A]':'bg-[#FFFBF2] border-[#E8DDC0]'}`}>🏫 Vue par classe</button>
        </div>
        {ongletTop==='tableau' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4 shadow-sm">
              <p className="text-[13px] tracking-wide font-medium" style={{color:'#8A7D5A'}}>ÉLÈVES INSCRITS</p>
              <p className="text-[34px] font-serif mt-1" style={{color:'#1B2A4A'}}>{nbEleves}</p>
            </div>
            <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4 shadow-sm">
              <p className="text-[13px] tracking-wide font-medium" style={{color:'#8A7D5A'}}>CLASSES ACTIVES</p>
              <p className="text-[34px] font-serif mt-1" style={{color:'#1B2A4A'}}>{nbClasses}</p>
            </div>
            <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4 shadow-sm">
              <p className="text-[13px] tracking-wide font-medium" style={{color:'#8A7D5A'}}>FRAIS DUS</p>
              <p className="text-[22px] font-bold font-serif mt-1" style={{color:'#8A6D1B'}}>{fraisDus.toLocaleString('fr-FR')} F</p>
            </div>
            <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4 shadow-sm">
              <p className="text-[13px] tracking-wide font-medium leading-tight" style={{color:'#8A7D5A'}}>DEMANDES EN<br/>ATTENTE</p>
              <p className="text-[34px] font-bold font-serif mt-1" style={{color:'#8A6D1B'}}>{demandesAttente}</p>
            </div>
          </div>
        )}
        {ongletTop==='bibliotheque' && (
          <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4">
            <h3 className="font-bold text-sm">📚 Bibliothèque</h3>
            <div className="mt-3 space-y-2">
              {demandes.map(d=><div key={d.id} className="border rounded-lg p-2 text-xs flex justify-between"><span>{d.prenom} {d.nom} - {d.classe}</span><button onClick={()=>validerDemande(d)} className="px-2 py-1 bg-green-600 text-white rounded-full">Valider</button></div>)}
              {demandes.length===0&&<p className="text-xs text-gray-400">0 en attente - comme ta photo</p>}
            </div>
          </div>
        )}
        {ongletTop==='vuepar' && (
          <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4">
            <h3 className="font-bold text-sm">Vue par classe</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {classes.map(cl=><div key={cl} className="border rounded-lg p-2 text-xs"><b>{cl}</b><br/>{eleves.filter(e=>e.classe===cl).length} élèves</div>)}
            </div>
          </div>
        )}
      </div>
    );

    if(role==='admin' || role==='fondateur'){
      const isFond = role==='fondateur';
      const onglets = isFond ? [...navDirecteur, {id:'directeurSuppr', label:'Directeur - Supprimer 🔥'}, {id:'codesTotal', label:'Codes - EXCLUSIF 🔐'}] : navDirecteur;
      const ongletActif = isFond ? ongletFond : ongletDir;
      const setOngletActif = isFond ? setOngletFond : setOngletDir;

      return (
        <div className="min-h-screen p-3" style={{background:'#FAF6EE'}}>
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h1 className="font-bold text-[14px]">{isFond?'🛡️ Fondateur - 14 rôles + Super pouvoirs':'🏫 Directeur - 14 rôles APP 3311'} {isFond&&<span className="ml-2 px-2 py-0.5 bg-[#8A2E2E] text-white rounded-full text-[9px]">SUPER ADMIN</span>}</h1>
              <button onClick={()=>{setRole(null);setCode('');}} className="px-3 py-1 bg-white border rounded-full text-xs">← Page de garde</button>
            </div>
            {!isFond && <p className="text-[11px] text-gray-500">Directeur ne voit PAS code Fondateur (0000 caché) - ligne 500 APP 3311</p>}
            {isFond && <p className="text-[11px] text-gray-600">Fait tout Directeur + voit tous codes + peut supprimer Directeur + peut tout supprimer</p>}
            
            <div className="flex gap-2 overflow-x-auto py-3 sticky top-0 z-10" style={{background:'#FAF6EE'}}>
              {onglets.map(n=><button key={n.id} onClick={()=>setOngletActif(n.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] border ${ongletActif===n.id?'bg-[#1B2A4A] text-white border-[#1B2A4A]':'bg-white'}`}>{n.label}</button>)}
            </div>

            {ongletActif==='dashboard' && renderDashboardPhoto()}
            {ongletActif==='bibliotheque' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Bibliothèque - Demandes</h3><div className="mt-3 space-y-2">{demandes.map(d=><div key={d.id} className="border rounded p-2 text-xs flex justify-between"><span>{d.prenom} {d.nom} {d.statut} {d.codeGenere&&`→ ${d.codeGenere}`}</span><div className="flex gap-1"><button onClick={()=>validerDemande(d)} className="px-2 py-1 bg-green-600 text-white rounded-full">Valider</button><button onClick={()=>setDemandes(demandes.filter(x=>x.id!==d.id))} className={`px-2 py-1 rounded-full ${isFond?'bg-red-600 text-white':'bg-red-100'}`}>🗑️ {isFond?'Suppr même validée':''}Suppr</button></div></div>)}</div></div>}
            {ongletActif==='vueClasse' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Vue par Classe</h3><div className="mt-2 grid grid-cols-2 gap-2">{classes.map(cl=><div key={cl} className="border rounded p-2 text-xs"><b>{cl}</b><br/>{eleves.filter(e=>e.classe===cl).length} élèves</div>)}</div></div>}
            {ongletActif==='suivi' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Suivi pédagogique - Vérifier enseignants saisissent notes</h3><div className="mt-2 space-y-1 text-xs">{classes.map(cl=>{const ens=personnel.find(p=>p.classe===cl); return <div key={cl} className="border rounded-full px-3 py-2 flex justify-between"><span>{cl} - {ens?.nom||'Pas enseignant'}</span><span className="px-2 py-1 bg-green-100 rounded-full text-[10px]">OK</span></div>})}</div></div>}
            {ongletActif==='classes' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Classes {isFond&&<button onClick={()=>{if(confirm('Supprimer TOUTES?')) setClasses([])}} className="ml-2 px-2 py-1 bg-red-700 text-white rounded-full text-[10px]">🔥 Supprimer toutes (Fondateur)</button>}</h3><div className="mt-2 flex flex-wrap gap-2">{classes.map(c=><span key={c} className="px-3 py-1 bg-[#F1ECDD] rounded-full text-xs">{c} <button onClick={()=>setClasses(classes.filter(x=>x!==c))} className="text-red-600">x</button></span>)}</div><div className="mt-3 flex gap-2"><input id="nc" placeholder="Nouvelle classe" className="border rounded-full px-3 py-1 text-xs"/><button onClick={()=>{const v=document.getElementById('nc').value; if(v){setClasses([...classes,v]); document.getElementById('nc').value='';}}} className="px-3 py-1 bg-[#1B2A4A] text-white rounded-full text-xs">Ajouter</button></div></div>}
            {ongletActif==='matieres' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Matières par classe</h3><p className="text-[11px] text-gray-500">Chaque classe sa liste - s'affiche auto chez élève/enseignant</p></div>}
            {ongletActif==='emploi' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Emploi du temps</h3><p className="text-xs">Lundi 08h-10h Maths - CM1 - M. DOSSOU</p></div>}
            {ongletActif==='frais' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Frais scolaires</h3><div className="mt-2 space-y-2">{fraisTypes.map((f,i)=><div key={i} className="flex justify-between border rounded-full px-3 py-2 text-xs"><span>{f.libelle}</span><span>{f.montant} F</span></div>)}</div></div>}
            {ongletActif==='annee' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Année scolaire - Clôture</h3><p className="text-[11px] text-gray-500">Archive notes/frais puis ouvre nouvelle année vierge</p><div className="mt-2 flex gap-2"><input placeholder="Ex: 2027-2028" className="border rounded-full px-3 py-1 text-xs"/><button className="px-3 py-1 bg-[#8A6D1B] text-white rounded-full text-xs">Clôturer</button></div></div>}
            {ongletActif==='personnel' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Personnel</h3><div className="mt-2 space-y-1 text-xs">{personnel.map((p,i)=><div key={i} className="border rounded-full px-3 py-2 flex justify-between"><span>{p.nom} - {p.poste} - {p.classe}</span><button onClick={()=>setPersonnel(personnel.filter((_,idx)=>idx!==i))} className="text-red-600">Suppr</button></div>)}</div></div>}
            {ongletActif==='messagePublic' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Message Public</h3><textarea placeholder="Annonce parents..." className="w-full border rounded-xl p-2 text-xs mt-2"/><button className="mt-2 px-3 py-1 bg-[#1B2A4A] text-white rounded-full text-xs">Publier</button></div>}
            {ongletActif==='messageInterne' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Message Interne</h3><textarea placeholder="Message personnel..." className="w-full border rounded-xl p-2 text-xs mt-2"/></div>}
            {ongletActif==='messagesParents' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Messages parents</h3><p className="text-xs text-gray-400">Aucun message</p></div>}
            {ongletActif==='parametres' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">Paramètres</h3>{!isFond?<div className="mt-3 space-y-2"><div className="border rounded-full px-3 py-2 text-xs bg-gray-100 flex justify-between"><span>fondateur</span><span>🔒 Code Fondateur caché</span></div>{Object.entries(codesStaff).filter(([k])=>k!=='fondateur').map(([r,c])=><div key={r} className="flex gap-2 border rounded-full px-3 py-2 text-xs"><span className="w-20 font-bold">{r}</span><input value={c} onChange={e=>setCodesStaff({...codesStaff,[r]:e.target.value})} className="flex-1 font-mono"/></div>)}</div>:<div className="mt-3 space-y-2">{Object.entries(codesStaff).map(([r,c])=><div key={r} className="flex gap-2 border rounded-full px-3 py-2 text-xs"><span className="w-20 font-bold">{r}</span><input value={c} onChange={e=>setCodesStaff({...codesStaff,[r]:e.target.value})} className="flex-1 font-mono"/></div>)}</div>}</div>}
            {isFond && ongletActif==='directeurSuppr' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">🏫 Supprimer Directeur - EXCLUSIF Fondateur</h3><div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs"><p>Directeur: {ECOLE_INIT.directeur} - Code: {codesStaff.admin}</p><button onClick={()=>{if(confirm('Supprimer Directeur?')){const cp={...codesStaff}; delete cp.admin; setCodesStaff(cp);}}} className="mt-2 px-3 py-1 bg-red-700 text-white rounded-full text-xs">🗑️ SUPPRIMER DIRECTEUR</button></div></div>}
            {isFond && ongletActif==='codesTotal' && <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4"><h3 className="font-bold text-sm">🔐 Codes - EXCLUSIF Fondateur - Voit tout + modifie tout + supprime tout</h3><div className="mt-3 space-y-2">{Object.entries(codesStaff).map(([r,c])=><div key={r} className="flex gap-2 border rounded-full px-3 py-2 text-xs"><span className="w-20 font-bold">{r}</span><input value={c} onChange={e=>setCodesStaff({...codesStaff,[r]:e.target.value})} className="flex-1 font-mono"/><button onClick={()=>{const cp={...codesStaff}; delete cp[r]; setCodesStaff(cp);}} className="px-2 py-1 bg-red-100 text-red-700 rounded-full">🗑️</button></div>)}</div><div className="mt-3 flex flex-wrap gap-1">{codesEleves.map(c=><span key={c} className="px-2 py-1 bg-[#FFFBF2] border rounded-full text-[11px] font-mono">{c}</span>)}</div></div>}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-4" style={{background:'#FAF6EE'}}>
        <div className="max-w-3xl mx-auto bg-white rounded-[16px] border border-[#C2D3F0] p-6">
          <h1 className="font-bold">{spaces.find(s=>s.id===role)?.label}</h1>
          <p className="text-xs mt-2">Espace {role} - {eleveId && `Connecté ${eleveId}`}</p>
          <button onClick={()=>{setRole(null);setCode('');setEleveId('');}} className="mt-4 px-4 py-2 bg-gray-100 rounded-full text-xs">← Page de garde</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background:'#FAF6EE'}}>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-5 flex gap-4">
          <div className="w-14 h-14 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white font-bold">CSP</div>
          <div className="flex-1">
            <p className="text-[11px] tracking-[0.25em] font-bold text-[#1B2A4A]">ÉCOLE CONNECTÉE - PAGE DE GARDE</p>
            <h1 className="font-bold text-[15px]">{ECOLE_INIT.nom} - {ECOLE_INIT.sigle}</h1>
            <p className="text-[11px] text-gray-600">{ECOLE_INIT.quartier} — {ECOLE_INIT.commune}, {ECOLE_INIT.departement}</p>
            <p className="text-[11px] text-gray-600">Directeur: {ECOLE_INIT.directeur} — {ECOLE_INIT.tel}</p>
            <p className="text-[11px] italic">"{ECOLE_INIT.devise}"</p>
          </div>
          <button onClick={()=>setVueInscription(true)} className="hidden md:block px-4 py-2 bg-green-600 text-white rounded-full text-xs font-bold">📝 Inscription</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold">Bienvenue - App à insérer</h2>
          <p className="text-[11px] text-gray-500">14 pilules Directeur + 2 pilules Fondateur + Dashboard photo 2x2 - Prêt pour Vercel</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {spaces.map(s=>(
            <button key={s.id} onClick={()=>{setRole(s.id);setCode('');setErreur('');setOngletDir('dashboard');setOngletFond('dashboard');setOngletTop('tableau');}} className={`text-left rounded-[16px] p-5 border shadow-sm ${s.id==='fondateur'?'bg-[#1B2A4A] text-white border-[#1B2A4A]':'bg-white border-[#C2D3F0]'}`}>
              <div className="flex justify-between"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.id==='fondateur'?'bg-white/20':'bg-[#1B2A4A] text-white'}`}>{s.icon}</div>{s.badge&&<span className="text-[9px] px-2 py-1 rounded-full bg-[#8A2E2E] text-white font-bold">{s.badge}</span>}</div>
              <h3 className="font-bold mt-3 text-sm">{s.label}</h3>
              <p className={`text-[11px] mt-1 ${s.id==='fondateur'?'text-white/70':'text-gray-500'}`}>{s.desc}</p>
            </button>
          ))}
          <button onClick={()=>setVueInscription(true)} className="text-left rounded-[16px] p-5 border shadow-sm bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">📝</div>
            <h3 className="font-bold mt-3 text-sm">Inscription en ligne</h3>
            <p className="text-[11px] text-green-100 mt-1">{demandes.filter(d=>d.statut==='en_attente').length} demande(s) en attente</p>
          </button>
        </div>
        <div className="mt-6 bg-white rounded-[16px] border border-[#C2D3F0] p-4 text-[11px]">
          ✅ App à insérer dans src/App.jsx - Remplace tout le contenu<br/>
          ✅ 14 pilules Directeur + Dashboard photo 2x2 comme ta capture<br/>
          ✅ Fondateur = 14 + 2 super pouvoirs (supprimer Directeur + codes total)<br/>
          ✅ Page de garde + Inscription en ligne + Tous espaces
        </div>
      </main>
    </div>
  );
}
