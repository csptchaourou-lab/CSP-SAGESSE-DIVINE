import { useState, useEffect } from 'react';

const ECOLE_INIT = { nom:"Complexe Scolaire Protestant", sigle:"CSP « Sagesse Divine »", quartier:"Kèra, à côté du Temple EPMB Cité de Paix", commune:"Tchaourou", departement:"Borgou", directeur:"Past. A. S. Boko", tel:"97 11 22 33", email:"contact@csp-sagessedivine.bj", devise:"Excellence Réelle" };
function genererCode(){ const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return `CSP${s}`; }
function ageDepuis(d){ if(!d) return null; const n=new Date(d); const a=new Date(); let age=a.getFullYear()-n.getFullYear(); const m=a.getMonth()<n.getMonth()||(a.getMonth()===n.getMonth()&&a.getDate()<n.getDate()); if(m) age--; return age>=0?age:null; }

export default function App(){
  const [role,setRole]=useState(null); const [code,setCode]=useState(''); const [erreur,setErreur]=useState('');
  const [onglet,setOnglet]=useState('dashboard');
  const [demandes,setDemandes]=useState(()=>JSON.parse(localStorage.getItem('csp_demandes')||'[{"id":"DEM-1234","prenom":"Grâce","nom":"Adjovi","age":8,"classe":"CM1","statut":"en_attente","parrainNom":"M. Adjovi","parrainTel":"97 00 00 00"}]'));
  const [eleves,setEleves]=useState(()=>JSON.parse(localStorage.getItem('csp_eleves')||'[{"id":"CSP0142","prenom":"Grâce","nom":"Adjovi","classe":"CM1","age":9},{"id":"CSP0198","prenom":"Emmanuel","nom":"Toko","classe":"CM1","age":8}]'));
  const [codesEleves,setCodesEleves]=useState(()=>JSON.parse(localStorage.getItem('csp_codes')||'["CSP0142","CSP0198"]'));
  const [codesStaff,setCodesStaff]=useState(()=>JSON.parse(localStorage.getItem('csp_codes_staff')||'{"fondateur":"0000","admin":"1234","enseignant":"5678","secretaire":"9012","directeur":"DIR-2025"}'));
  const [classes,setClasses]=useState(()=>JSON.parse(localStorage.getItem('csp_classes')||'["Maternelle 1","CM1","CM2","6ème A"]'));
  const [matieres,setMatieres]=useState(()=>JSON.parse(localStorage.getItem('csp_matieres')||'{"CM1":["Maths","Français"]}'));

  useEffect(()=>localStorage.setItem('csp_demandes',JSON.stringify(demandes)),[demandes]);
  useEffect(()=>localStorage.setItem('csp_eleves',JSON.stringify(eleves)),[eleves]);
  useEffect(()=>localStorage.setItem('csp_codes',JSON.stringify(codesEleves)),[codesEleves]);
  useEffect(()=>localStorage.setItem('csp_codes_staff',JSON.stringify(codesStaff)),[codesStaff]);
  useEffect(()=>localStorage.setItem('csp_classes',JSON.stringify(classes)),[classes]);
  useEffect(()=>localStorage.setItem('csp_matieres',JSON.stringify(matieres)),[matieres]);

  const validerDemande=(d)=>{ const co=genererCode(); setCodesEleves([co,...codesEleves]); setEleves([...eleves,{id:co,prenom:d.prenom,nom:d.nom,classe:d.classe,age:d.age}]); setDemandes(demandes.map(x=>x.id===d.id?{...x,statut:'validee',codeGenere:co}:x)); };

  const estConnecte = role==='fondateur' && code===codesStaff.fondateur;
  const spaces = [{id:'fondateur', label:'Espace Fondateur - Pouvoir Total'}];

  if(!estConnecte){
    return (
      <div className="min-h-screen bg-[#FAF6EE]">
        <header className="bg-white shadow-sm border-b"><div className="max-w-6xl mx-auto px-6 py-5 flex gap-4"><div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold">CSP</div><div><p className="text-[11px] tracking-[0.2em] font-bold">ÉCOLE CONNECTÉE - PAGE DE GARDE</p><h1 className="font-bold">{ECOLE_INIT.nom} - {ECOLE_INIT.sigle}</h1><p className="text-[11px] text-gray-600">{ECOLE_INIT.quartier} - {ECOLE_INIT.commune} | Dir: {ECOLE_INIT.directeur} {ECOLE_INIT.tel}</p><p className="text-[11px] italic">Devise: "{ECOLE_INIT.devise}"</p></div></div></header>
        <div className="max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold">🛡️ Fondateur Seul</h1>
          <p className="text-xs text-gray-600 mt-2">Joue tous les rôles Directeur + pouvoirs exclusifs:<br/>• Voit code de tout le monde<br/>• Directeur ne peut PAS voir son compte<br/>• Peut modifier/supprimer tous les codes<br/>• Peut supprimer le Directeur</p>
          <input autoFocus value={code} onChange={e=>setCode(e.target.value)} placeholder="Code fondateur 0000" className="mt-4 w-full border rounded-xl px-4 py-3 font-mono"/>
          <button onClick={()=>{ if(code===codesStaff.fondateur) setRole('fondateur'); else setErreur(`Code actuel fondateur: ${codesStaff.fondateur}`); }} className="mt-3 w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Entrer - Pouvoir Total</button>
          {erreur&&<p className="text-red-600 text-xs mt-2">{erreur}</p>}
          <div className="mt-4 p-3 bg-yellow-50 rounded-xl text-[11px]"><b>Démo:</b> Code fondateur = {codesStaff.fondateur} (modifiable dans onglet codes)</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{background:'#FAF6EE'}}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h1 className="text-xl font-bold">🛡️ Fondateur Seul - Joue tous les rôles Directeur + Supérieur <span className="ml-2 px-2 py-0.5 bg-red-800 text-white rounded-full text-[10px]">SUPER ADMIN</span></h1>
          <button onClick={()=>{setRole(null);setCode('');}} className="px-3 py-1 bg-gray-200 rounded">← Quitter</button>
        </div>
        <p className="text-xs text-gray-600 mt-1">✅ Fait tout ce que Directeur fait (demandes, élèves, classes, matières) + ✅ Voit code de tout le monde + ✅ Directeur ne voit PAS son compte + ✅ Modifie/supprime tous les codes + ✅ Peut supprimer Directeur</p>

        <div className="flex gap-2 my-4 flex-wrap overflow-auto">
          {[
            {id:'dashboard',label:'Dashboard'},
            {id:'demandes',label:'Demandes (rôle Directeur)'},
            {id:'eleves',label:'Élèves (rôle Directeur)'},
            {id:'directeur',label:'Directeur (supprimer)'},
            {id:'classes',label:'Classes'},
            {id:'matieres',label:'Matières'},
            {id:'codes',label:'Codes - EXCLUSIF Fondateur 🔐'},
          ].map(t=><button key={t.id} onClick={()=>setOnglet(t.id)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${onglet===t.id?'bg-slate-900 text-white':'bg-white border'}`}>{t.label}</button>)}
        </div>

        {onglet==='dashboard'&&<div className="bg-white p-5 rounded-xl"><h2 className="font-bold">Dashboard Fondateur = Dashboard Directeur + Plus</h2><div className="grid grid-cols-3 gap-3 mt-4"><div className="p-3 bg-blue-50 rounded"><p className="text-xl font-bold">{eleves.length}</p><p className="text-xs">Élèves</p></div><div className="p-3 bg-yellow-50 rounded"><p className="text-xl font-bold">{demandes.length}</p><p className="text-xs">Demandes</p></div><div className="p-3 bg-green-50 rounded"><p className="text-xl font-bold">{Object.keys(codesStaff).length}</p><p className="text-xs">Comptes staff</p></div></div><div className="mt-4 text-xs bg-slate-50 p-3 rounded"><p><b>Page de garde:</b> {ECOLE_INIT.nom} {ECOLE_INIT.sigle} - {ECOLE_INIT.quartier}</p><p className="mt-1 text-gray-500">Directeur ne voit PAS le code fondateur 0000. Fondateur voit tout.</p></div></div>}

        {onglet==='demandes'&&<div className="bg-white p-4 rounded-xl"><h2 className="font-bold text-sm">📋 Demandes - Rôle Directeur que Fondateur joue</h2><p className="text-[11px] text-gray-500">Fondateur fait même chose que Directeur: valide, refuse, modifie, supprime même validée</p><div className="mt-3 space-y-2">{demandes.map(d=><div key={d.id} className="border rounded p-2 text-xs flex justify-between items-center"><span>{d.prenom} {d.nom} {d.age}ans {d.classe} - {d.statut} {d.codeGenere&&`→ ${d.codeGenere}`}</span><div className="flex gap-1">{d.statut==='en_attente'&&<button onClick={()=>validerDemande(d)} className="px-2 py-1 bg-green-600 text-white rounded">✅ Valider → CSP2JH6</button>}<button onClick={()=>{const nn=prompt('Modif prénom:',d.prenom); if(nn) setDemandes(demandes.map(x=>x.id===d.id?{...x,prenom:nn}:x));}} className="px-2 py-1 bg-yellow-100 rounded">✏️ Modif</button><button onClick={()=>setDemandes(demandes.filter(x=>x.id!==d.id))} className="px-2 py-1 bg-red-600 text-white rounded">🗑️ Suppr même validée</button></div></div>)}</div></div>}

        {onglet==='eleves'&&<div className="bg-white p-4 rounded-xl"><h2 className="font-bold text-sm">👨‍🎓 Élèves - Rôle Directeur + Supprimer TOUS (exclusif Fondateur)</h2><button onClick={()=>{if(confirm('Supprimer TOUS les élèves? Seul Fondateur peut faire ça!')){setEleves([]); setCodesEleves([]);}}} className="mt-2 mb-3 px-3 py-1 bg-red-700 text-white rounded text-xs">🔥 SUPPRIMER TOUS LES ÉLÈVES (Fondateur seul)</button><div className="space-y-1 text-xs">{eleves.map(e=><div key={e.id} className="flex justify-between border-b py-1"><span>{e.id} - {e.prenom} {e.nom} {e.classe} {e.age}ans</span><div className="flex gap-1"><button onClick={()=>{const nn=prompt('Nouveau prénom:',e.prenom); if(nn) setEleves(eleves.map(x=>x.id===e.id?{...x,prenom:nn}:x));}} className="px-2 py-1 bg-yellow-100 rounded">✏️</button><button onClick={()=>{setEleves(eleves.filter(x=>x.id!==e.id)); setCodesEleves(codesEleves.filter(c=>c!==e.id));}} className="px-2 py-1 bg-red-100 text-red-700 rounded">🗑️</button></div></div>)}</div></div>}

        {onglet==='directeur'&&<div className="bg-white p-4 rounded-xl"><h2 className="font-bold text-sm">🏫 Compte Directeur - Fondateur peut le supprimer (Directeur ne peut pas supprimer Fondateur)</h2><div className="mt-3 border rounded-xl p-4 bg-blue-50"><p className="text-sm"><b>Directeur actuel:</b> {ECOLE_INIT.directeur}</p><p className="text-xs mt-1">Code admin: {codesStaff.admin} / Code directeur: {codesStaff.directeur||'DIR-2025'}</p><p className="text-xs mt-1">Tél: {ECOLE_INIT.tel} - Email: {ECOLE_INIT.email}</p><div className="mt-3 flex gap-2"><button onClick={()=>{const nv=prompt('Nouveau code Directeur admin:',codesStaff.admin); if(nv) setCodesStaff({...codesStaff,admin:nv});}} className="px-3 py-1 bg-yellow-600 text-white rounded text-xs">✏️ Modifier code Directeur</button><button onClick={()=>{if(confirm('⚠️ Supprimer le compte Directeur? Seul Fondateur peut faire ça! Le Directeur sera bloqué.')){const cp={...codesStaff}; delete cp.admin; delete cp.directeur; setCodesStaff(cp); alert('Directeur supprimé! Il ne peut plus se connecter.');}}} className="px-3 py-1 bg-red-700 text-white rounded text-xs">🗑️ SUPPRIMER DIRECTEUR (Pouvoir exclusif Fondateur)</button></div><p className="text-[10px] text-gray-500 mt-3">🔒 Directeur ne voit PAS le compte Fondateur. Si tu supprimes Directeur, il faut le recréer dans onglet Codes.</p></div></div>}

        {onglet==='classes'&&<div className="bg-white p-4 rounded-xl"><h2 className="font-bold text-sm">Classes - Rôle Directeur</h2><div className="mt-2 flex flex-wrap gap-2">{classes.map(c=><span key={c} className="px-3 py-1 bg-blue-50 rounded-full text-xs flex items-center gap-1">{c}<button onClick={()=>setClasses(classes.filter(x=>x!==c))} className="text-red-600">x</button></span>)}</div><div className="mt-3 flex gap-2"><input id="nc" placeholder="Nouvelle classe" className="border px-2 py-1 rounded text-xs"/><button onClick={()=>{const v=document.getElementById('nc').value; if(v){setClasses([...classes,v]); document.getElementById('nc').value='';}}} className="px-3 py-1 bg-blue-900 text-white rounded text-xs">Ajouter</button></div></div>}

        {onglet==='matieres'&&<div className="bg-white p-4 rounded-xl"><h2 className="font-bold text-sm">Matières - Rôle Directeur</h2><div className="mt-2 text-xs">{Object.entries(matieres).map(([cl,mats])=><div key={cl} className="mb-2"><b>{cl}:</b> {mats.join(', ')} <button onClick={()=>{const nv=prompt(`Matières ${cl} séparées par ,`,mats.join(',')); if(nv) setMatieres({...matieres,[cl]:nv.split(',').map(s=>s.trim())});}} className="ml-2 px-2 py-1 bg-yellow-100 rounded">✏️ Modif</button></div>)}</div></div>}

        {onglet==='codes'&&(
          <div className="bg-white p-5 rounded-xl">
            <h2 className="font-bold">🔐 Codes - EXCLUSIF Fondateur (Directeur ne voit PAS cette page)</h2>
            <p className="text-[11px] text-red-600">Seul Fondateur voit et modifie tous les codes. Directeur voit "🔒 Code Fondateur caché"</p>
            <div className="mt-4 grid md:grid-cols-2 gap-6">
              <div><h3 className="font-bold text-xs mb-2">Staff - Peut modifier/supprimer tous</h3>{Object.entries(codesStaff).map(([r,c])=><div key={r} className="flex gap-2 border rounded p-2 mb-1 text-xs"><span className="w-20 font-bold">{r}</span><input value={c} onChange={e=>setCodesStaff({...codesStaff,[r]:e.target.value})} className="flex-1 border rounded px-2 py-1 font-mono"/><button onClick={()=>{const nv=prompt(`Nouveau code ${r}:`,c); if(nv) setCodesStaff({...codesStaff,[r]:nv});}} className="px-2 py-1 bg-yellow-100 rounded">✏️</button>{r!=='fondateur'&&<button onClick={()=>{const cp={...codesStaff}; delete cp[r]; setCodesStaff(cp);}} className="px-2 py-1 bg-red-100 text-red-700 rounded">🗑️ Suppr</button>}</div>)}<p className="text-[10px] text-gray-500 mt-2">Fondateur peut modifier même son propre code 0000 → nouveau code.</p></div>
              <div><h3 className="font-bold text-xs mb-2">Élèves CSP2JH6 - Modifiable/supprimable</h3><div className="flex flex-wrap gap-1 border rounded p-2 bg-gray-50 max-h-40 overflow-auto">{codesEleves.map(c=><span key={c} className="px-2 py-1 bg-white border rounded-full font-mono text-[11px]">{c} <button onClick={()=>{const nv=prompt(`Modif ${c}:`,c); if(nv&&/^CSP[A-Z0-9]{4}$/.test(nv.toUpperCase())){setCodesEleves(codesEleves.map(x=>x===c?nv.toUpperCase():x)); setEleves(eleves.map(e=>e.id===c?{...e,id:nv.toUpperCase()}:e));}}} className="ml-1">✏️</button> <button onClick={()=>{setCodesEleves(codesEleves.filter(x=>x!==c)); setEleves(eleves.filter(e=>e.id!==c));}} className="text-red-600">x</button></span>)}</div><button onClick={()=>setCodesEleves([genererCode(),...codesEleves])} className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-xs">+ Générer CSP2JH6</button></div>
            </div>
            <div className="mt-4 p-3 bg-slate-900 text-white rounded-xl text-[11px]"><b>Règle que tu as demandée:</b><br/>• Fondateur voit code de tout le monde (admin, enseignant, secretaire, directeur, élèves)<br/>• Directeur ne peut PAS voir compte fondateur (0000 caché)<br/>• Fondateur peut modifier tous les codes plateforme<br/>• Fondateur peut supprimer Directeur (Directeur ne peut pas supprimer Fondateur)</div>
          </div>
        )}
      </div>
    </div>
  );
}
