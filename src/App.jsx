import { useState } from 'react';

const LOGO_CSP = "data:image/jpeg;base64,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";

export default function App() {
  const [role, setRole] = useState(null);

  const spaces = [
    { id: 'fondateur', label: 'Espace Fondateur', desc: 'Codes & archives', color: 'bg-slate-800' },
    { id: 'admin', label: 'Espace Administratif', desc: 'Gestion', color: 'bg-blue-900' },
    { id: 'enseignant', label: 'Enseignant', desc: 'Notes', color: 'bg-indigo-700' },
    { id: 'secretaire', label: 'Secrétaire', desc: 'Frais', color: 'bg-sky-700' },
    { id: 'parent', label: 'Espace Parent', desc: 'Suivi', color: 'bg-emerald-700' },
  ];

  if (role) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
          <button onClick={() => setRole(null)} className="mb-6 px-4 py-2 bg-gray-200 rounded-lg">← Retour</button>
          <h1 className="text-3xl font-bold">{spaces.find(s=>s.id===role)?.label}</h1>
          <p className="text-gray-600 mt-2">Étape 1 - Logo et header restaurés. Prêt pour étape 2.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <img src={LOGO_CSP} alt="Logo CSP" className="w-14 h-14 rounded-full object-cover bg-blue-900"
               onError={(e)=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
          <div className="w-14 h-14 bg-blue-900 rounded-full hidden items-center justify-center text-white font-bold text-xl">CSP</div>
          <div>
            <p className="text-[11px] tracking-[0.2em] text-blue-800 font-bold">ÉCOLE CONNECTÉE</p>
            <h1 className="font-bold text-slate-900 leading-tight text-[17px]">Complexe Scolaire Protestant</h1>
            <p className="text-[13px] text-yellow-600 font-bold">CSP « Sagesse Divine »</p>
            <p className="text-[10px] text-gray-600 leading-tight mt-0.5">Kéra, à côté du Temple EPMB Cité de Paix — Tchaourou, Borgou<br/>Directeur : 97 11 22 33 - contact@csp-sagessedivine.bj</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-slate-900">Bienvenue</h2>
          <p className="text-gray-600 mt-2">Choisissez votre espace de connexion</p>
          <span className="mt-3 inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">ÉTAPE 1 - Logo restauré ✅</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {spaces.map((s) => (
            <button key={s.id} onClick={() => setRole(s.id)} className="text-left bg-white rounded-2xl shadow p-6 border hover:shadow-lg transition">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-white mb-3`}>🔑</div>
              <h3 className="font-bold">{s.label}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
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
