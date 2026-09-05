import { useState, useEffect } from 'react';

const ECOLE_INIT = { nom:"Complexe Scolaire Protestant", sigle:"CSP « Sagesse Divine »", quartier:"Kèra, à côté du Temple EPMB Cité de Paix", commune:"Tchaourou", departement:"Borgou", directeur:"Past. A. S. Boko", telephoneDirecteur:"97 11 22 33", email:"contact@csp-sagessedivine.bj", devise:"Excellence Réelle" };
function genererCode(){ const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return `CSP${s}`; }
function ageDepuis(d){ if(!d) return null; const n=new Date(d); const a=new Date(); let age=a.getFullYear()-n.getFullYear(); const m=a.getMonth()<n.getMonth()||(a.getMonth()===n.getMonth()&&a.getDate()<n.getDate()); if(m) age--; return age>=0?age:null; }

export default function App(){
  const [role,setRole]=useState(null); const [code,setCode]=useState(''); const [erreur,setErreur]=useState(''); const [eleveId,setEleveId]=useState(''); const [vueInscription,setVueInscription]=useState(false); const [ongletFond,setOngletFond]=useState('codes');
  const [demandes,setDemandes]=useState(()=>JSON.parse(localStorage.getItem('csp_demandes')||'[]'));
  const [eleves,setEleves]=useState(()=>JSON.parse(localStorage.getItem('csp_eleves')||'[]'));
  const [codesEleves,setCodesEleves]=useState(()=>JSON.parse(localStorage.getItem('csp_codes')||'["CSP0142","CSP2JH6"]'));
  const [codesStaff,setCodesStaff]=useState(()=>JSON.parse(localStorage.getItem('csp_codes_staff')||'{"fondateur":"0000","admin":"1234","enseignant":"5678","secretaire":"9012"}'));
  const [newRole,setNewRole]=useState(''); const [newCodeVal,setNewCodeVal]=useState('');
  const [form,setForm]=useState({prenom:'',nom:'',sexe:'',naissance:'',classe:'CM1',parrainNom:'',parrainTel:''});
  useEffect(()=>localStorage.setItem('csp_demandes',JSON.stringify(demandes)),[demandes]); useEffect(()=>localStorage.setItem('csp_eleves',JSON.stringify(eleves)),[eleves]); useEffect(()=>localStorage.setItem('csp_codes',JSON.stringify(codesEleves)),[codesEleves]); useEffect(()=>localStorage.setItem('csp_codes_staff',JSON.stringify(codesStaff)),[codesStaff]);
  const ageForm=ageDepuis(form.naissance);
  const spaces=[{id:'fondateur',label:'Espace Fondateur',desc:'Super-Admin',color:'bg-slate-900',icon:'🛡️'},{id:'admin',label:'Espace Administratif',desc:'Directeur',color:'bg-blue-900',icon:'🏫'},{id:'enseignant',label:'Enseignant',desc:'Notes',color:'bg-indigo-700',icon:'📝'},{id:'secretaire',label:'Secrétaire',desc:'Frais',color:'bg-sky-700',icon:'💰'},{id:'parent',label:'Parent',desc:'Suivi',color:'bg-emerald-700',icon:'👨‍👩‍👧'}];
  const validerCode=()=>{ const s=code.trim().toUpperCase(); if(role==='parent'){ if(/^CSP[A-Z0-9]{4}$/.test(s)&&(codesEleves.includes(s)||eleves.find(e=>e.id===s))){setEleveId(s);setErreur('');} else setErreur('Introuvable'); return; } const attendu=codesStaff[role]|| (role==='admin'?codesStaff.admin:null); if(code===attendu){setErreur('');} else setErreur(`Incorrect, code actuel: ${attendu}`); };
  const estConnecte=role&&(role==='parent'?eleveId:code===(codesStaff[role]||'')) ;

  if(vueInscription){ return (<div className="min-h-screen bg-[#FAF6EE] p-4"><div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6"><button onClick={()=>setVueInscription(false)} className="mb-4 px-3 py-1 bg-gray-200 rounded">← Retour</button><h1 className="font-bold">Inscription {ageForm?`${ageForm} ans`:''}</h1><form onSubmit={(e)=>{e.preventDefault(); const n={id:`DEM-${Math.floor(Math.random()*9000)}`,...form,age:ageForm,date:'aujourd’hui',statut:'en_attente'}; setDemandes([n,...demandes]); setVueInscription(false);}} className="mt-3 space-y-2"><div className="grid grid-cols-2 gap-2"><input placeholder="Prénom" value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} className="border rounded px-2 py-2"/><input placeholder="Nom" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} className="border rounded px-2 py-2"/></div><div className="flex gap-2"><select value={form.sexe} onChange={e=>setForm({...form,sexe:e.target.value})} className="border rounded px-2 py-2"><option value="">Sexe</option><option value="F">F</option><option value="M">M</option></select><input type="date" value={form.naissance} onChange={e=>setForm({...form,naissance:e.target.value})} className="border rounded px-2 py-2 flex-1"/><span className="text-xs bg-blue-50 px-2 rounded-full flex items-center">{ageForm?`${ageForm}ans`:''}</span></div><button type="submit" className="w-full bg-yellow-600 text-white py-2 rounded-xl">Envoyer</button></form></div></div>); }
  if(role&&!estConnecte){ return (<div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center"><div className="max-w-md w-full bg-white rounded-2xl shadow p-8"><button onClick={()=>{setRole(null);setCode('');}} className="mb-4 px-3 py-1 bg-gray-200 rounded">← Retour</button><h1 className="font-bold">{spaces.find(s=>s.id===role)?.label}</h1><p className="text-xs text-gray-500">Code actuel: {role!=='parent'?codesStaff[role]:'CSP...'}</p><input autoFocus value={code} onChange={e=>setCode(e.target.value)} className="mt-3 w-full border rounded-xl px-4 py-3 font-mono uppercase"/><button onClick={validerCode} className="mt-3 w-full bg-blue-900 text-white py-3 rounded-xl font-bold">Entrer</button>{erreur&&<p className="text-red-600 text-xs mt-2">{erreur}</p>}</div></div>); }

  if(role&&estConnecte){
    if(role==='fondateur'){
      return (
        <div className="min-h-screen p-4" style={{background:'#FAF6EE'}}>
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center"><h1 className="text-xl font-bold">🛡️ Fondateur - Pouvoir Total <span className="ml-2 px-2 py-0.5 bg-red-800 text-white rounded-full text-[10px]">SUPER ADMIN</span></h1><button onClick={()=>{setRole(null);setCode('');}} className="px-3 py-1 bg-gray-200 rounded">← Page de garde</button></div>
            <div className="flex gap-2 my-4 flex-wrap">{["dashboard","codes"].map(t=><button key={t} onClick={()=>setOngletFond(t)} className={`px-3 py-1 rounded-full text-sm ${ongletFond===t?'bg-slate-900 text-white':'bg-white border'}`}>{t}</button>)}</div>
            {ongletFond==='dashboard'&&<div className="bg-white p-4 rounded-xl text-sm"><p>Élèves: {eleves.length} | Codes élèves: {codesEleves.length} | Demandes: {demandes.length}</p><p className="mt-2 text-xs text-gray-500">École: {ECOLE_INIT.nom} {ECOLE_INIT.sigle} - {ECOLE_INIT.quartier}</p></div>}
            {ongletFond==='codes'&&(
              <div className="bg-white p-5 rounded-xl">
                <h2 className="font-bold text-lg mb-1">🔑 Gestion de TOUS les codes - Pouvoir Fondateur</h2>
                <p className="text-xs text-gray-500 mb-4">Ici tu peux voir, modifier, créer, supprimer tous les codes. Seul toi as cette page.</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-sm mb-2">Codes Staff (personnel)</h3>
                    <div className="space-y-2">
                      {Object.entries(codesStaff).map(([r,c])=>(
                        <div key={r} className="flex items-center gap-2 border rounded-lg p-2">
                          <span className="w-24 text-xs font-bold uppercase">{r}</span>
                          <input value={c} onChange={e=>setCodesStaff({...codesStaff,[r]:e.target.value})} className="flex-1 border rounded px-2 py-1 font-mono text-sm"/>
                          <button onClick={()=>{ const nv=prompt(`Nouveau code pour ${r}:`, c); if(nv!==null) setCodesStaff({...codesStaff,[r]:nv}); }} className="px-2 py-1 bg-yellow-100 rounded text-xs">✏️ Modifier</button>
                          {r!=='fondateur'&&<button onClick={()=>{if(confirm(`Supprimer code ${r}?`)){ const cp={...codesStaff}; delete cp[r]; setCodesStaff(cp);}}} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">🗑️</button>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                      <p className="font-bold text-xs">+ Créer un nouveau code staff</p>
                      <div className="flex gap-2 mt-2"><input value={newRole} onChange={e=>setNewRole(e.target.value)} placeholder="Rôle ex: bibliotheque" className="border rounded px-2 py-1 text-xs flex-1"/><input value={newCodeVal} onChange={e=>setNewCodeVal(e.target.value)} placeholder="Code ex: BIB-2025" className="border rounded px-2 py-1 text-xs flex-1"/><button onClick={()=>{ if(!newRole||!newCodeVal){alert('Remplis rôle et code');return;} setCodesStaff({...codesStaff,[newRole.toLowerCase()]:newCodeVal}); setNewRole(''); setNewCodeVal(''); }} className="px-3 py-1 bg-slate-900 text-white rounded text-xs">Créer</button></div>
                      <p className="text-[10px] text-gray-500 mt-1">Ex: Rôle=bibliotheque Code=BIB-2025 → le staff pourra se connecter avec ce nouveau code.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm mb-2">Codes Élèves type CSP2JH6</h3>
                    <div className="flex flex-wrap gap-1 max-h-40 overflow-auto border rounded p-2 bg-gray-50">{codesEleves.map(c=><span key={c} className="px-2 py-1 bg-white border rounded-full font-mono text-[11px] flex items-center gap-1">{c}<button onClick={()=>{ const nv=prompt(`Modifier code ${c}:`, c); if(nv&&/^CSP[A-Z0-9]{4}$/.test(nv.toUpperCase())){ setCodesEleves(codesEleves.map(x=>x===c?nv.toUpperCase():x)); setEleves(eleves.map(e=>e.id===c?{...e,id:nv.toUpperCase()}:e)); } else if(nv) alert('Format doit être CSP + 4 caractères ex: CSP9X4A'); }} className="text-[10px]">✏️</button><button onClick={()=>{if(confirm(`Supprimer ${c}?`)){ setCodesEleves(codesEleves.filter(x=>x!==c)); setEleves(eleves.filter(e=>e.id!==c));}}} className="text-[10px] text-red-600">x</button></span>)}</div>
                    <div className="mt-3 flex gap-2"><button onClick={()=>{const n=genererCode(); setCodesEleves([n,...codesEleves]);}} className="px-3 py-1 bg-green-600 text-white rounded text-xs">+ Générer CSP2JH6</button><button onClick={()=>{if(confirm('Supprimer TOUS les codes élèves?')) setCodesEleves([]);}} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs">Supprimer tous</button></div>
                    <div className="mt-4 p-2 bg-yellow-50 rounded text-[11px]"><b>Comment ça marche?</b><br/>- Modifier: clique ✏️ sur un code élève ou staff<br/>- Créer: remplis rôle+code à gauche<br/>- Supprimer: clique 🗑️ ou x<br/>- Après modification, le staff doit utiliser le NOUVEAU code pour se connecter. C'est en temps réel.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return (<div className="min-h-screen bg-gray-50 p-6"><div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6"><button onClick={()=>{setRole(null);setCode('');setEleveId('');}} className="mb-4 px-3 py-1 bg-gray-200 rounded">← Page de garde</button><h1 className="font-bold">{spaces.find(s=>s.id===role)?.label}</h1><p className="text-sm mt-2">Connecté avec code: {role==='parent'?eleveId:codesStaff[role]}</p></div></div>);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF6EE] to-white">
      <header className="bg-white shadow-sm border-b"><div className="max-w-6xl mx-auto px-6 py-5 flex items-start gap-4"><div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl">CSP</div><div className="flex-1"><p className="text-[11px] tracking-[0.25em] text-blue-800 font-bold uppercase">École Connectée</p><h1 className="font-extrabold text-slate-900 text-lg">{ECOLE_INIT.nom}</h1><p className="text-[14px] text-yellow-600 font-extrabold">{ECOLE_INIT.sigle}</p><div className="mt-1 text-[11px] text-gray-600"><p>{ECOLE_INIT.quartier} — {ECOLE_INIT.commune}, {ECOLE_INIT.departement}</p><p>Directeur: {ECOLE_INIT.directeur} — {ECOLE_INIT.telephoneDirecteur}</p><p className="italic">"{ECOLE_INIT.devise}"</p></div></div><button onClick={()=>setVueInscription(true)} className="hidden md:block px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm">📝 Inscription</button></div></header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {spaces.map(s=><button key={s.id} onClick={()=>{setRole(s.id);setCode('');}} className={`text-left rounded-2xl shadow p-5 border ${s.id==='fondateur'?'bg-slate-900 text-white':'bg-white'}`}><div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">{s.icon}</div><h3 className="font-bold">{s.label}</h3><p className="text-sm opacity-70">{s.desc}</p><p className="text-[10px] mt-1 opacity-50">Code actuel: {s.id==='parent'?'CSP...':codesStaff[s.id]||'?'}</p></button>)}
        </div>
      </main>
    </div>
  );
}
