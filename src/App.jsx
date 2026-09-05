import { useState, useEffect } from 'react';

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
};

function genererCode(){ const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return `CSP${s}`; }
function ageDepuis(d){ if(!d) return null; const n=new Date(d); const a=new Date(); let age=a.getFullYear()-n.getFullYear(); const m=a.getMonth()<n.getMonth()||(a.getMonth()===n.getMonth()&&a.getDate()<n.getDate()); if(m) age--; return age>=0?age:null; }

export default function App(){
  const [role,setRole]=useState(null); const [code,setCode]=useState(''); const [erreur,setErreur]=useState(''); const [eleveId,setEleveId]=useState('');
  const [vueInscription,setVueInscription]=useState(false);
  const [ongletFond,setOngletFond]=useState('dashboard');
  const [demandes,setDemandes]=useState(()=>JSON.parse(localStorage.getItem('csp_demandes')||'[]'));
  const [eleves,setEleves]=useState(()=>JSON.parse(localStorage.getItem('csp_eleves')||'[{"id":"CSP0142","nom":"Adjovi","prenom":"Grâce","classe":"CM1","age":9}]'));
  const [codes,setCodes]=useState(()=>JSON.parse(localStorage.getItem('csp_codes')||'["CSP0142"]'));
  const [classes,setClasses]=useState(()=>JSON.parse(localStorage.getItem('csp_classes')||'["Maternelle 1","Maternelle 2","CI","CP","CE1","CE2","CM1","CM2"]'));
  const [matieres,setMatieres]=useState(()=>JSON.parse(localStorage.getItem('csp_matieres')||'{"CM1":["Maths","Français"]}'));
  const [form,setForm]=useState({prenom:'',nom:'',sexe:'',naissance:'',classe:'CM1',parrainNom:'',parrainTel:'',message:''});

  useEffect(()=>localStorage.setItem('csp_demandes',JSON.stringify(demandes)),[demandes]);
  useEffect(()=>localStorage.setItem('csp_eleves',JSON.stringify(eleves)),[eleves]);
  useEffect(()=>localStorage.setItem('csp_codes',JSON.stringify(codes)),[codes]);
  useEffect(()=>localStorage.setItem('csp_classes',JSON.stringify(classes)),[classes]);
  useEffect(()=>localStorage.setItem('csp_matieres',JSON.stringify(matieres)),[matieres]);

  const CODES={fondateur:'0000',admin:'1234',enseignant:'5678',secretaire:'9012'};
  const ageForm=ageDepuis(form.naissance);

  const spacesOrdre=[
    {id:'fondateur',label:'Espace Fondateur',desc:'Super-Admin - Pouvoir Total',color:'bg-slate-900',icon:'🛡️',badge:'SUPER ADMIN'},
    {id:'admin',label:'Espace Administratif',desc:'Directeur - Gestion',color:'bg-blue-900',icon:'🏫'},
    {id:'enseignant',label:'Espace Enseignant',desc:'Notes & absences',color:'bg-indigo-700',icon:'📝'},
    {id:'secretaire',label:'Espace Secrétaire',desc:'Frais & inscriptions',color:'bg-sky-700',icon:'💰'},
    {id:'parent',label:'Espace Parent',desc:'Suivi enfant',color:'bg-emerald-700',icon:'👨‍👩‍👧'},
  ];

  const validerCode=()=>{
    const s=code.trim().toUpperCase();
    if(role==='parent'){ if(/^CSP[A-Z0-9]{4}$/.test(s)&&(codes.includes(s)||eleves.find(e=>e.id===s))){setEleveId(s);setErreur('');} else setErreur('Introuvable'); return; }
    if(CODES[role]===code) setErreur(''); else setErreur(`Incorrect: ${CODES[role]}`);
  };
  const estConnecte=role&&(role==='parent'?eleveId:code===CODES[role]);

  if(vueInscription){
    return (<div className="min-h-screen bg-[#FAF6EE] p-4"><div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6"><button onClick={()=>setVueInscription(false)} className="mb-4 px-4 py-2 bg-gray-200 rounded-lg">← Retour page de garde</button><h1 className="text-xl font-bold">Inscription - {ECOLE_INIT.sigle}</h1><p className="text-xs text-gray-500">{ECOLE_INIT.quartier} - {ECOLE_INIT.commune}</p><form onSubmit={(e)=>{e.preventDefault(); const n={id:`DEM-${Math.floor(Math.random()*9000)}`,...form,age:ageForm,date:'aujourd’hui',statut:'en_attente'}; setDemandes([n,...demandes]); setVueInscription(false); alert(`Envoyé: ${n.prenom} ${n.age}ans`);}} className="mt-4 space-y-2"><div className="grid grid-cols-2 gap-2"><input placeholder="Prénom *" value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} className="border rounded px-3 py-2"/><input placeholder="Nom *" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} className="border rounded px-3 py-2"/></div><div className="grid grid-cols-2 gap-2"><select value={form.sexe} onChange={e=>setForm({...form,sexe:e.target.value})} className="border rounded px-3 py-2"><option value="">Sexe</option><option value="F">F</option><option value="M">M</option></select><div className="flex gap-2"><input type="date" value={form.naissance} onChange={e=>setForm({...form,naissance:e.target.value})} className="border rounded px-3 py-2 w-full"/><span className="text-xs bg-blue-50 px-2 py-1 rounded-full">{ageForm?`${ageForm}ans`:''}</span></div></div><select value={form.classe} onChange={e=>setForm({...form,classe:e.target.value})} className="w-full border rounded px-3 py-2">{classes.map(c=><option key={c}>{c}</option>)}</select><div className="grid grid-cols-2 gap-2"><input placeholder="Parrain" value={form.parrainNom} onChange={e=>setForm({...form,parrainNom:e.target.value})} className="border rounded px-3 py-2"/><input placeholder="Tél" value={form.parrainTel} onChange={e=>setForm({...form,parrainTel:e.target.value})} className="border rounded px-3 py-2"/></div><button type="submit" className="w-full bg-yellow-600 text-white py-3 rounded-xl font-bold">Envoyer</button></form></div></div>);
  }

  if(role&&!estConnecte){
    return (<div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center"><div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"><button onClick={()=>{setRole(null);setCode('');}} className="mb-4 px-4 py-2 bg-gray-200 rounded-lg">← Retour</button><h1 className="text-xl font-bold">{spacesOrdre.find(s=>s.id===role)?.label}</h1><input autoFocus value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&validerCode()} placeholder={role==='parent'?'CSP2JH6':'Code'} className="mt-4 w-full border rounded-xl px-4 py-3 font-mono uppercase"/><button onClick={validerCode} className="mt-4 w-full bg-blue-900 text-white py-3 rounded-xl font-bold">Entrer</button>{erreur&&<p className="text-red-600 text-sm mt-2">{erreur}</p>}</div></div>);
  }

  if(role&&estConnecte){
    if(role==='fondateur'){
      return (
        <div className="min-h-screen p-4" style={{background:'#FAF6EE'}}>
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold flex items-center gap-2">🛡️ Fondateur - Pouvoir Total <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-800 text-white">SUPER ADMIN</span></h1><button onClick={()=>{setRole(null);setCode('');}} className="px-4 py-2 bg-gray-200 rounded-lg">← Page de garde</button></div>
            <p className="text-sm opacity-70 mb-4">Tu peux tout modifier, tout supprimer, voir tous les codes. Rôle que tu avais défini dans ton APP d'origine.</p>
            <div className="flex gap-2 my-4 flex-wrap">{["dashboard","codes","classes","matieres","eleves","demandes","finances"].map(t=><button key={t} onClick={()=>setOngletFond(t)} className={`px-3 py-1 rounded-full text-sm ${ongletFond===t?'bg-slate-900 text-white':'bg-white border'}`}>{t}</button>)}</div>
            {ongletFond==='dashboard'&&<div className="bg-white p-6 rounded-xl"><h2 className="font-bold">Dashboard Fondateur</h2><div className="grid grid-cols-3 gap-4 mt-4"><div className="p-4 bg-blue-50 rounded-xl"><p className="text-2xl font-bold">{eleves.length}</p><p className="text-xs">Élèves</p></div><div className="p-4 bg-green-50 rounded-xl"><p className="text-2xl font-bold">{demandes.length}</p><p className="text-xs">Demandes</p></div><div className="p-4 bg-yellow-50 rounded-xl"><p className="text-2xl font-bold">{codes.length}</p><p className="text-xs">Codes CSP2JH6</p></div></div><div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs"><p><b>École:</b> {ECOLE_INIT.nom} {ECOLE_INIT.sigle}</p><p><b>Devise:</b> {ECOLE_INIT.devise}</p><p><b>Directeur:</b> {ECOLE_INIT.directeur} - {ECOLE_INIT.telephoneDirecteur}</p></div></div>}
            {ongletFond==='codes'&&<div className="bg-white p-4 rounded-xl"><h2 className="font-bold mb-3">Tous les codes (y compris fondateur) - Comme dans ton APP</h2><div className="text-xs space-y-1"><p>🔐 Fondateur: {CODES.fondateur} (seul toi)</p><p>🏫 Directeur: {CODES.admin} - Past. Boko</p><p>📝 Enseignant: {CODES.enseignant}</p><p>💰 Secrétaire: {CODES.secretaire}</p></div><div className="mt-4"><p className="font-bold text-sm">Codes élèves type CSP2JH6:</p><div className="flex flex-wrap gap-2 mt-2">{codes.map(c=><span key={c} className="px-2 py-1 bg-gray-100 rounded-full font-mono text-xs">{c}</span>)}</div><button onClick={()=>{const n=genererCode(); setCodes([n,...codes]);}} className="mt-3 px-3 py-1 bg-slate-900 text-white rounded text-xs">+ Générer CSP2JH6</button></div><button onClick={()=>{if(confirm('Supprimer TOUS les codes sauf fondateur?')) setCodes(['CSP0142']);}} className="mt-4 px-3 py-1 bg-red-100 text-red-700 rounded text-xs">Supprimer tous les codes (garde fondateur)</button></div>}
            {ongletFond==='classes'&&<div className="bg-white p-4 rounded-xl"><h2 className="font-bold">Classes</h2><div className="mt-2 flex flex-wrap gap-2">{classes.map(c=><span key={c} className="px-3 py-1 bg-blue-50 rounded-full text-xs">{c}</span>)}</div><div className="flex gap-2 mt-3"><input id="newClasse" placeholder="Nouvelle classe" className="border px-2 py-1 rounded text-sm"/><button onClick={()=>{const v=document.getElementById('newClasse').value; if(v){setClasses([...classes,v]); document.getElementById('newClasse').value='';}}} className="px-3 py-1 bg-blue-900 text-white rounded text-xs">Ajouter</button></div></div>}
            {ongletFond==='matieres'&&<div className="bg-white p-4 rounded-xl"><h2 className="font-bold">Matières par classe</h2><div className="mt-3 text-xs">{Object.entries(matieres).map(([cl,mats])=><div key={cl} className="mb-2"><b>{cl}:</b> {mats.join(', ')}</div>)}</div></div>}
            {ongletFond==='eleves'&&<div className="bg-white p-4 rounded-xl"><h2 className="font-bold">Élèves ({eleves.length}) <button onClick={()=>{if(confirm('Supprimer TOUS les élèves? Irréversible!')){setEleves([]); setCodes([]);}}} className="ml-3 px-2 py-1 bg-red-600 text-white rounded text-[10px]">Supprimer TOUS</button></h2><div className="mt-3 space-y-1 text-xs">{eleves.map(e=><div key={e.id} className="flex justify-between border-b py-1"><span>{e.id} - {e.prenom} {e.nom} {e.classe} {e.age}ans</span><button onClick={()=>setEleves(eleves.filter(x=>x.id!==e.id))} className="text-red-600">Suppr</button></div>)}</div></div>}
            {ongletFond==='demandes'&&<div className="bg-white p-4 rounded-xl"><h2 className="font-bold">Demandes ({demandes.length})</h2><div className="mt-3 space-y-2">{demandes.map(d=><div key={d.id} className="border rounded p-2 text-xs flex justify-between"><span>{d.prenom} {d.nom} {d.age}ans {d.classe} - {d.statut}</span><div className="flex gap-1"><button onClick={()=>{const co=genererCode(); setCodes([co,...codes]); setEleves([...eleves,{id:co,nom:d.nom,prenom:d.prenom,classe:d.classe,age:d.age}]); setDemandes(demandes.map(x=>x.id===d.id?{...x,statut:'validee',codeGenere:co}:x));}} className="px-2 py-1 bg-green-600 text-white rounded">Valider</button><button onClick={()=>setDemandes(demandes.filter(x=>x.id!==d.id))} className="px-2 py-1 bg-red-100 rounded">Suppr</button></div></div>)}</div></div>}
            {ongletFond==='finances'&&<div className="bg-white p-4 rounded-xl"><h2 className="font-bold">Finances - Vue fondateur</h2><p className="text-xs mt-2">Total élèves: {eleves.length} - Tu peux tout voir ici comme dans ton APP d'origine</p></div>}
          </div>
        </div>
      );
    }
    return (<div className="min-h-screen bg-gray-50 p-6"><div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6"><button onClick={()=>{setRole(null);setCode('');setEleveId('');}} className="mb-4 px-4 py-2 bg-gray-200 rounded-lg">← Page de garde</button><h1 className="font-bold text-xl">{spacesOrdre.find(s=>s.id===role)?.label}</h1><p className="text-sm mt-2">Connecté {role} - Contenu à venir pour cet espace</p>{role==='parent'&&<div className="mt-4 p-4 bg-green-50 rounded-xl text-sm">Élève {eleveId} - {eleves.find(e=>e.id===eleveId)?.prenom} {eleves.find(e=>e.id===eleveId)?.classe} {eleves.find(e=>e.id===eleveId)?.age}ans</div>}</div></div>);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF6EE] to-white">
      {/* PAGE DE GARDE - IDENTITE ECOLE COMME DANS TON APP */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-start gap-4">
          <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0">CSP</div>
          <div className="flex-1">
            <p className="text-[11px] tracking-[0.25em] text-blue-800 font-bold uppercase">École Connectée</p>
            <h1 className="font-extrabold text-slate-900 text-lg leading-tight">{ECOLE_INIT.nom}</h1>
            <p className="text-[14px] text-yellow-600 font-extrabold">{ECOLE_INIT.sigle}</p>
            <div className="mt-1 text-[11px] text-gray-600 leading-snug">
              <p>{ECOLE_INIT.quartier} — {ECOLE_INIT.commune}, {ECOLE_INIT.departement}</p>
              <p>Directeur : {ECOLE_INIT.directeur} — {ECOLE_INIT.telephoneDirecteur} - {ECOLE_INIT.email}</p>
              <p className="mt-1 italic">Devise : "{ECOLE_INIT.devise}"</p>
            </div>
          </div>
          <button onClick={()=>setVueInscription(true)} className="hidden md:block px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm">📝 Inscription en ligne</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold tracking-tight">Bienvenue</h2>
          <p className="text-gray-600 mt-2">Choisissez votre espace de connexion</p>
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-blue-900 text-white rounded-full text-[11px]">Identité école sur page de garde ✅</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">Fondateur avec onglets ✅</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {spacesOrdre.map((s)=>(
            <button key={s.id} onClick={()=>{setRole(s.id);setCode('');}} className={`text-left rounded-2xl shadow p-5 border hover:shadow-lg transition ${s.id==='fondateur'?'bg-slate-900 text-white border-slate-900':'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-white`}>{s.icon}</div>
                {s.badge&&<span className="text-[9px] px-2 py-1 rounded-full bg-red-700 text-white font-bold">{s.badge}</span>}
              </div>
              <h3 className="font-bold mt-3">{s.label}</h3>
              <p className={`text-sm ${s.id==='fondateur'?'text-slate-300':'text-gray-500'}`}>{s.desc}</p>
              {s.id==='fondateur'&&<p className="text-[10px] mt-2 text-slate-400">Onglets: dashboard, codes, classes, matières, élèves, demandes, finances</p>}
            </button>
          ))}
          <button onClick={()=>setVueInscription(true)} className="text-left bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow p-5 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">📝</div>
            <h3 className="font-bold">Inscription en ligne</h3>
            <p className="text-sm text-green-100">{demandes.filter(d=>d.statut==='en_attente').length} demande(s) en attente • âge calculé auto</p>
          </button>
        </div>
      </main>
    </div>
  );
}
