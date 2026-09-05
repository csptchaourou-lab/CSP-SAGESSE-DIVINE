import { useState, useEffect } from 'react';

function genererCodeEleve() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = ""; for(let i=0;i<4;i++) s+=caracteres[Math.floor(Math.random()*caracteres.length)];
  return `CSP${s}`;
}

export default function App() {
  const [role, setRole] = useState(null);
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [eleveId, setEleveId] = useState('');
  const [vueInscription, setVueInscription] = useState(false);
  
  const [demandes, setDemandes] = useState(()=> {
    const s = localStorage.getItem('csp_demandes'); return s ? JSON.parse(s) : [];
  });
  const [codesGeneres, setCodesGeneres] = useState(()=> {
    const s = localStorage.getItem('csp_codes'); return s ? JSON.parse(s) : ['CSP0142','CSP0198'];
  });
  const [eleves, setEleves] = useState(()=> {
    const s = localStorage.getItem('csp_eleves'); return s ? JSON.parse(s) : [
      {id:'CSP0142', nom:'Adjovi', prenom:'Grâce', classe:'CM1'},
      {id:'CSP0198', nom:'Toko', prenom:'Emmanuel', classe:'CM1'}
    ];
  });

  const [form, setForm] = useState({prenom:'', nom:'', sexe:'', naissance:'', classe:'CM1', parrainNom:'', parrainTel:'', message:''});

  const CLASSES = ["Maternelle 1","Maternelle 2","CI","CP","CE1","CE2","CM1","CM2","6ème","5ème","4ème","3ème"];
  const CODES = { fondateur:'0000', admin:'1234', enseignant:'5678', secretaire:'9012' };

  useEffect(()=>{ localStorage.setItem('csp_demandes', JSON.stringify(demandes)); },[demandes]);
  useEffect(()=>{ localStorage.setItem('csp_codes', JSON.stringify(codesGeneres)); },[codesGeneres]);
  useEffect(()=>{ localStorage.setItem('csp_eleves', JSON.stringify(eleves)); },[eleves]);

  const soumettreDemande = (e)=>{
    e.preventDefault();
    if(!form.prenom || !form.nom || !form.sexe || !form.naissance || !form.parrainNom || !form.parrainTel){ alert('Remplis tous les champs'); return; }
    const nouvelle = { id:`DEM-${Math.floor(1000+Math.random()*9000)}`, ...form, date:'aujourd\'hui', statut:'en_attente', origine:'en_ligne' };
    setDemandes([nouvelle, ...demandes]);
    setForm({prenom:'', nom:'', sexe:'', naissance:'', classe:'CM1', parrainNom:'', parrainTel:'', message:''});
    setVueInscription(false);
    alert(`Demande envoyée pour ${nouvelle.prenom} ${nouvelle.nom}. Le Directeur va te contacter au ${nouvelle.parrainTel}`);
  };

  const validerDemande = (d)=>{
    const codeEleve = genererCodeEleve();
    setCodesGeneres([codeEleve, ...codesGeneres]);
    setEleves([...eleves, {id:codeEleve, nom:d.nom, prenom:d.prenom, classe:d.classe, naissance:d.naissance}]);
    setDemandes(demandes.map(x=> x.id===d.id ? {...x, statut:'validee', codeGenere:codeEleve} : x));
    alert(`${d.prenom} ${d.nom} validé ! Code généré: ${codeEleve} - Communique-le au parent.`);
  };

  const spaces = [
    { id:'fondateur', label:'Espace Fondateur', desc:'Codes & archives', color:'bg-slate-800' },
    { id:'admin', label:'Espace Administratif', desc:'Gestion', color:'bg-blue-900' },
    { id:'enseignant', label:'Enseignant', desc:'Notes', color:'bg-indigo-700' },
    { id:'secretaire', label:'Secrétaire', desc:'Frais', color:'bg-sky-700' },
    { id:'parent', label:'Espace Parent', desc:'Suivi', color:'bg-emerald-700' },
  ];

  const validerCode = ()=>{
    const saisie = code.trim().toUpperCase();
    if(role==='parent'){
      if(/^CSP[A-Z0-9]{4}$/.test(saisie) && (codesGeneres.includes(saisie) || eleves.find(e=>e.id===saisie))){ setEleveId(saisie); setErreur(''); }
      else setErreur('Code introuvable. Essaie CSP0142 ou CSP2JH6 ou un code généré par le Directeur');
      return;
    }
    if(CODES[role]===code) setErreur(''); else setErreur(`Incorrect. Démo: ${CODES[role]}`);
  };

  const estConnecte = role && (role==='parent' ? eleveId : code===CODES[role]);

  if(vueInscription){
    return (
      <div className="min-h-screen bg-[#FAF6EE] p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 mt-6">
          <button onClick={()=>setVueInscription(false)} className="mb-4 px-4 py-2 bg-gray-200 rounded-lg">← Retour accueil</button>
          <p className="text-[11px] tracking-widest text-blue-800 font-bold">INSCRIPTION EN LIGNE</p>
          <h1 className="text-2xl font-bold text-slate-900">CSP « Sagesse Divine »</h1>
          <p className="text-sm text-gray-600">Kéra, Temple EPMB Cité de Paix — Tchaourou</p>
          <form onSubmit={soumettreDemande} className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Prénom enfant *</label><input value={form.prenom} onChange={e=>setForm({...form, prenom:e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Grâce"/></div>
              <div><label className="text-xs font-medium">Nom enfant *</label><input value={form.nom} onChange={e=>setForm({...form, nom:e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Adjovi"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Sexe *</label><select value={form.sexe} onChange={e=>setForm({...form, sexe:e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="">Choisir</option><option value="F">Féminin</option><option value="M">Masculin</option></select></div>
              <div><label className="text-xs font-medium">Naissance *</label><input type="date" value={form.naissance} onChange={e=>setForm({...form, naissance:e.target.value})} className="w-full border rounded-lg px-3 py-2"/></div>
            </div>
            <div><label className="text-xs font-medium">Classe souhaitée *</label><select value={form.classe} onChange={e=>setForm({...form, classe:e.target.value})} className="w-full border rounded-lg px-3 py-2">{CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Nom parrain *</label><input value={form.parrainNom} onChange={e=>setForm({...form, parrainNom:e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="M. Adjovi"/></div>
              <div><label className="text-xs font-medium">Tél parrain *</label><input value={form.parrainTel} onChange={e=>setForm({...form, parrainTel:e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="97 11 22 33"/></div>
            </div>
            <div><label className="text-xs font-medium">Message (optionnel)</label><textarea value={form.message} onChange={e=>setForm({...form, message:e.target.value})} rows={2} className="w-full border rounded-lg px-3 py-2" placeholder="Précision..."/></div>
            <button type="submit" className="w-full bg-yellow-600 text-white py-3 rounded-xl font-bold">📨 Soumettre la demande</button>
            <p className="text-[10px] text-gray-400 text-center">Après validation, le Directeur te donnera le code type CSP2JH6</p>
          </form>
        </div>
      </div>
    );
  }

  if(role && !estConnecte){
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <button onClick={()=>{setRole(null); setCode('');}} className="mb-6 px-4 py-2 bg-gray-200 rounded-lg">← Retour</button>
          <h1 className="text-2xl font-bold">{spaces.find(s=>s.id===role)?.label}</h1>
          <input autoFocus value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&validerCode()} placeholder={role==='parent'?'CSP2JH6':'Code'} className="mt-4 w-full border rounded-xl px-4 py-3 text-lg font-mono uppercase"/>
          {erreur && <p className="mt-2 text-sm text-red-600">{erreur}</p>}
          <button onClick={validerCode} className="mt-4 w-full bg-blue-900 text-white py-3 rounded-xl font-bold">Entrer</button>
        </div>
      </div>
    );
  }

  if(role && estConnecte){
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
          <button onClick={()=>{setRole(null); setCode(''); setEleveId('');}} className="mb-6 px-4 py-2 bg-gray-200 rounded-lg">← Quitter</button>
          <h1 className="text-2xl font-bold">{spaces.find(s=>s.id===role)?.label} {role==='parent' && eleveId}</h1>
          
          {role==='admin' && (
            <div className="mt-6">
              <h2 className="font-bold">📋 Bibliothèque des demandes ({demandes.filter(d=>d.statut==='en_attente').length} en attente)</h2>
              <div className="mt-3 space-y-2 max-h-[60vh] overflow-auto">
                {demandes.length===0 && <p className="text-sm text-gray-500">Aucune demande. Clique sur Inscription en ligne depuis l'accueil pour tester.</p>}
                {demandes.map(d=>(
                  <div key={d.id} className="border rounded-xl p-4 bg-white">
                    <div className="flex justify-between"><b>{d.prenom} {d.nom} ({d.sexe}) - {d.classe}</b><span className={`text-xs px-2 py-1 rounded-full ${d.statut==='en_attente'?'bg-yellow-100':'bg-green-100'}`}>{d.statut} {d.codeGenere && `→ ${d.codeGenere}`}</span></div>
                    <p className="text-xs text-gray-600">Né: {d.naissance} | Parrain: {d.parrainNom} {d.parrainTel} | {d.date} | {d.origine}</p>
                    {d.message && <p className="text-xs italic">"{d.message}"</p>}
                    {d.statut==='en_attente' && <div className="mt-2 flex gap-2"><button onClick={()=>validerDemande(d)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs">✅ Valider → génère CSP2JH6</button><button onClick={()=>setDemandes(demandes.map(x=> x.id===d.id ? {...x, statut:'refusee'}:x))} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs">Refuser</button></div>}
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <h2 className="font-bold">👨‍🎓 Élèves inscrits ({eleves.length})</h2>
                <div className="mt-2 flex flex-wrap gap-2">{eleves.map(e=><span key={e.id} className="px-3 py-1 bg-blue-50 border rounded-full text-xs font-mono">{e.id} - {e.prenom} {e.nom} ({e.classe})</span>)}</div>
              </div>
            </div>
          )}

          {role==='parent' && (
            <div className="mt-6 p-4 bg-green-50 rounded-xl">
              <p className="font-bold">Élève {eleveId} trouvé ✅</p>
              <p className="text-sm">Ici bientôt: notes, absences, frais, bulletin PDF</p>
            </div>
          )}

          {(role==='fondateur' || role==='enseignant' || role==='secretaire') && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p>Espace {role} connecté. Code: {code}</p>
              <p className="text-xs text-gray-500 mt-2">Prochaine étape: on ajoutera les fonctions spécifiques de chaque espace</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl">CSP</div>
            <div>
              <p className="text-[11px] tracking-[0.2em] text-blue-800 font-bold">ÉCOLE CONNECTÉE</p>
              <h1 className="font-bold text-slate-900">Complexe Scolaire Protestant</h1>
              <p className="text-[13px] text-yellow-600 font-bold">CSP « Sagesse Divine »</p>
              <p className="text-[10px] text-gray-600">Kéra, Temple EPMB Cité de Paix — Tchaourou, Borgou<br/>Directeur : 97 11 22 33 - contact@csp-sagessedivine.bj</p>
            </div>
          </div>
          <button onClick={()=>setVueInscription(true)} className="hidden md:block px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold">📝 Inscription en ligne</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold">Bienvenue</h2>
          <p className="text-gray-600 mt-2">Choisissez votre espace</p>
          <div className="mt-3 flex justify-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">ÉTAPE 3 - Inscription ✅</span>
            <button onClick={()=>setVueInscription(true)} className="md:hidden px-4 py-1 bg-green-600 text-white rounded-full text-xs">📝 Inscription en ligne</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {spaces.map((s)=>(
            <button key={s.id} onClick={()=>{setRole(s.id); setCode('');}} className="text-left bg-white rounded-2xl shadow p-6 border hover:shadow-lg">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-white mb-3`}>🔑</div>
              <h3 className="font-bold">{s.label}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </button>
          ))}
          <button onClick={()=>setVueInscription(true)} className="text-left bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow p-6 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">📝</div>
            <h3 className="font-bold">Inscription en ligne</h3>
            <p className="text-sm text-green-100">{demandes.filter(d=>d.statut==='en_attente').length} demande(s) en attente</p>
          </button>
        </div>
      </main>
    </div>
  );
}
