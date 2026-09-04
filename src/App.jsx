import { useState } from 'react';

export default function App() {
  const [role, setRole] = useState(null);
  const [eleveIdActif, setEleveIdActif] = useState(null);

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
          <button onClick={() => setRole(null)} className="mb-6 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">← Retour</button>
          <h1 className="text-3xl font-bold text-slate-800">{spaces.find(s=>s.id===role)?.label}</h1>
          <p className="text-gray-600 mt-2">Bienvenue dans l'espace {role}. Cette version est la version de production déployée sur Vercel.</p>
          <div className="mt-8 p-6 bg-blue-50 rounded-xl">
            <p className="font-semibold">CSP Sagesse Divine - École Connectée</p>
            <p className="text-sm text-gray-600 mt-2">Kéra, à côté du Temple EPMB Cité de Paix - Tchaourou, Borgou</p>
            <p className="text-sm text-gray-600">Directeur : 97 11 22 33 - contact@csp-sagessedivine.bj</p>
          </div>
          {role === 'parent' && (
            <div className="mt-6">
              <label className="block text-sm font-medium">ID Élève</label>
              <input value={eleveIdActif || ''} onChange={e=>setEleveIdActif(e.target.value)} placeholder="Ex: CSP-001" className="mt-1 w-full border rounded-lg px-3 py-2"/>
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold">CSP</div>
            <div>
              <p className="text-[10px] tracking-[0.2em] text-blue-900 font-semibold">ÉCOLE CONNECTÉE</p>
              <h1 className="font-bold text-slate-800 leading-tight">Complexe Scolaire Protestant</h1>
              <p className="text-xs text-yellow-600 font-medium">CSP « Sagesse Divine »</p>
              <p className="text-[9px] text-gray-500">Kéra, à côté du Temple EPMB Cité de Paix — Tchaourou, Borgou<br/>Directeur : 97 11 22 33 - contact@csp-sagessedivine.bj</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-slate-900">Bienvenue</h2>
          <p className="text-gray-600 mt-2">Choisissez votre espace de connexion</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((s) => (
            <button key={s.id} onClick={() => setRole(s.id)} className="text-left bg-white rounded-2xl shadow hover:shadow-lg transition p-6 border">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-white mb-4`}>🔑</div>
              <h3 className="font-bold text-slate-800">{s.label}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm">✓ Production Ready - Déployé sur Vercel</span>
        </div>
      </main>
    </div>
  );
}
