import { useState, useEffect } from 'react';

function genererCodeEleve() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I
  let suffixe = "";
  for (let i = 0; i < 4; i++) {
    suffixe += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return `CSP${suffixe}`; // Ex: CSP2JH6, CSP7K2B
}

export default function App() {
  const [role, setRole] = useState(null);
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [eleveId, setEleveId] = useState('');
  const [codesGeneres, setCodesGeneres] = useState(()=> {
    const s = localStorage.getItem('csp_codes');
    return s ? JSON.parse(s) : ['CSP0142','CSP0198','CSP2JH6'];
  });

  useEffect(()=>{
    localStorage.setItem('csp_codes', JSON.stringify(codesGeneres));
  },[codesGeneres]);

  const CODES = { fondateur:'0000', admin:'1234', enseignant:'5678', secretaire:'9012' };
  const spaces = [
    { id:'fondateur', label:'Espace Fondateur', desc:'Codes & archives', color:'bg-slate-800' },
    { id:'admin', label:'Espace Administratif', desc:'Gestion', color:'bg-blue-900' },
    { id:'enseignant', label:'Enseignant', desc:'Notes', color:'bg-indigo-700' },
    { id:'secretaire', label:'Secrétaire', desc:'Frais', color:'bg-sky-700' },
    { id:'parent', label:'Espace Parent', desc:'Suivi', color:'bg-emerald-700' },
  ];

  const valider = () => {
    const saisie = code.trim().toUpperCase();
    if(role==='parent'){
      // accepte tout code format CSP + 4 caracteres (ex: CSP2JH6)
      const estFormatCSP = /^CSP[A-Z0-9]{4}$/.test(saisie);
      if(estFormatCSP){
        if(codesGeneres.includes(saisie)){
          setEleveId(saisie); setErreur('');
        } else {
          // Pour la démo, on accepte même un nouveau code comme CSP2JH6
          setCodesGeneres(prev=>[saisie,...prev].slice(0,20));
          setEleveId(saisie); setErreur('');
        }
      } else {
        setErreur('Format invalide. Exemple valide: CSP2JH6 ou CSP0142');
      }
      return;
    }
    if(CODES[role]===code){ setErreur(''); }
    else setErreur(`Code incorrect. Démo ${role}: ${CODES[role]}`);
  };

  const estConnecte = role && (role==='parent' ? eleveId : code===CODES[role]);

  if(role && !estConnecte){
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <button onClick={()=>{setRole(null); setCode(''); setErreur(''); setEleveId('');}} className="mb-6 px-4 py-2 bg-gray-200 rounded-lg">← Retour</button>
          <h1 className="text-2xl font-bold">{spaces.find(s=>s.id===role)?.label}</h1>
          <p className="text-sm text-gray-500 mt-1">{role==='parent'?'Code élève reçu du Directeur (ex: CSP2JH6)':'Code d\'accès'}</p>
          <input autoFocus value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&valider()}
                 placeholder={role==='parent'?'CSP2JH6':'Code'} className="mt-4 w-full border rounded-xl px-4 py-3 text-lg font-mono uppercase"/>
          {erreur && <p className="mt-2 text-sm text-red-600">{erreur}</p>}
          {!erreur && role==='parent' && <p className="mt-2 text-xs text-gray-400">Démo: tape CSP2JH6 ou CSP0142</p>}
          {!erreur && role!=='parent' && <p className="mt-2 text-xs text-gray-400">Démo: {CODES[role]}</p>}
          <button onClick={valider} className="mt-4 w-full bg-blue-900 text-white py-3 rounded-xl font-bold">Entrer</button>
        </div>
      </div>
    );
  }

  if(role && estConnecte){
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
          <button onClick={()=>{setRole(null); setCode(''); setEleveId('');}} className="mb-6 px-4 py-2 bg-gray-200 rounded-lg">← Quitter</button>
          <h1 className="text-3xl font-bold">Bienvenue {role==='parent'?eleveId:role}</h1>
          
          {role==='admin' && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="font-bold">Générateur de codes élèves (format CSP2JH6)</p>
                <p className="text-xs text-gray-600 mt-1">Seul Directeur/Fondateur voit les codes. Secrétaire et Parent ne les voient pas.</p>
                <button onClick={()=>{const n=genererCodeEleve(); setCodesGeneres(p=>[n,...p]);}} className="mt-3 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm">+ Générer nouveau code type CSP2JH6</button>
              </div>
              <div className="border rounded-xl p-4">
                <p className="font-bold text-sm mb-2">Codes élèves existants (à communiquer aux parents):</p>
                <div className="flex flex-wrap gap-2">
                  {codesGeneres.map(c=><span key={c} className="px-3 py-1 bg-gray-100 rounded-full font-mono text-sm">{c}</span>)}
                </div>
              </div>
            </div>
          )}

          {role==='parent' && (
            <div className="mt-6 p-6 bg-green-50 rounded-xl border">
              <p className="font-bold">Élève: {eleveId}</p>
              <p className="text-sm mt-2">Code validé ✅ Format CSP + 4 caractères comme CSP2JH6</p>
              <p className="text-xs text-gray-500 mt-2">Prochaine étape: on affichera ici les notes, absences, frais de {eleveId}</p>
            </div>
          )}

          {role!=='parent' && role!=='admin' && (
            <div className="mt-6 p-6 bg-blue-50 rounded-xl">
              <p>Connecté en tant que {role} avec code {code}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl">CSP</div>
          <div>
            <p className="text-[11px] tracking-[0.2em] text-blue-800 font-bold">ÉCOLE CONNECTÉE</p>
            <h1 className="font-bold text-slate-900 leading-tight">Complexe Scolaire Protestant</h1>
            <p className="text-[13px] text-yellow-600 font-bold">CSP « Sagesse Divine »</p>
            <p className="text-[10px] text-gray-600">Kéra, Temple EPMB Cité de Paix — Tchaourou, Borgou</p>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold">Bienvenue</h2>
          <p className="text-gray-600 mt-2">Choisissez votre espace - Codes type CSP2JH6</p>
          <span className="mt-3 inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">ÉTAPE 2b - Codes CSP2JH6 ✅</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {spaces.map((s)=>(
            <button key={s.id} onClick={()=>{setRole(s.id); setCode(''); setErreur('');}} className="text-left bg-white rounded-2xl shadow p-6 border hover:shadow-lg">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-white mb-3`}>🔑</div>
              <h3 className="font-bold">{s.label}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
              <p className="text-[10px] mt-2 font-mono text-gray-400">{s.id==='parent'?'Ex: CSP2JH6':`Code: ${CODES[s.id]}`}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
