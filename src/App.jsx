import { useState, useEffect } from 'react';

const ECOLE_INIT = { nom:"Complexe Scolaire Protestant", sigle:"CSP « Sagesse Divine »", quartier:"Kèra", commune:"Tchaourou" };
function genererCode(){ const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return `CSP${s}`; }

export default function App(){
  const [ongletTop,setOngletTop]=useState('tableau'); // tableau, bibliotheque, vuepar
  const [ongletFond,setOngletFond]=useState('dashboard');
  const [role,setRole]=useState('fondateur'); // direct fondateur pour voir
  const [code,setCode]=useState('0000');

  const [demandes,setDemandes]=useState(()=>JSON.parse(localStorage.getItem('csp_demandes')||'[]'));
  const [eleves,setEleves]=useState(()=>JSON.parse(localStorage.getItem('csp_eleves')||'[{"id":"CSP0142","prenom":"Grâce","nom":"Adjovi"},{"id":"CSP0198","prenom":"Emmanuel","nom":"Toko"},{"id":"CSP2JH6","prenom":"Nadège","nom":"Kora"}]'));
  const [codesEleves,setCodesEleves]=useState(()=>JSON.parse(localStorage.getItem('csp_codes')||'["CSP0142","CSP0198","CSP2JH6"]'));
  const [classes,setClasses]=useState(()=>JSON.parse(localStorage.getItem('csp_classes')||'["M1","M2","CI","CP","CE1","CE2","CM1","CM2"]'));
  const [codesStaff,setCodesStaff]=useState(()=>JSON.parse(localStorage.getItem('csp_codes_staff')||'{"fondateur":"0000","admin":"1234","enseignant":"5678","secretaire":"9012"}'));

  useEffect(()=>localStorage.setItem('csp_demandes',JSON.stringify(demandes)),[demandes]);
  useEffect(()=>localStorage.setItem('csp_eleves',JSON.stringify(eleves)),[eleves]);
  useEffect(()=>localStorage.setItem('csp_codes',JSON.stringify(codesEleves)),[codesEleves]);

  // Calculs comme sur ta photo
  const nbEleves = eleves.length;
  const nbClasses = classes.length;
  const fraisDus = 420000; // exemple comme ta photo 420 000 F - tu pourras calculer vrai total après
  const demandesAttente = demandes.filter(d=>d.statut==='en_attente').length;

  return (
    <div className="min-h-screen" style={{background:'#FAF6EE'}}>
      {/* Header page de garde - identité école */}
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <div className="flex gap-3 items-center"><div className="w-10 h-10 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white font-bold text-sm">CSP</div><div><p className="text-[10px] tracking-[0.2em] font-bold text-[#1B2A4A]">COMPLEXE SCOLAIRE PROTESTANT</p><p className="text-xs font-bold text-[#8A6D1B]">CSP « Sagesse Divine » - {ECOLE_INIT.quartier}, {ECOLE_INIT.commune}</p></div></div>
        <button onClick={()=>setRole(null)} className="text-[11px] px-3 py-1 bg-gray-100 rounded-full">Quitter</button>
      </header>

      {/* Espace Fondateur - Pouvoir Total */}
      <div className="max-w-5xl mx-auto p-3">
        <div className="mt-2 mb-3">
          <h1 className="text-[15px] font-bold flex items-center gap-2">🛡️ Fondateur - Pouvoir Total <span className="px-2 py-0.5 bg-[#8A2E2E] text-white rounded-full text-[9px]">SUPER ADMIN</span></h1>
          <p className="text-[11px] text-gray-500">Joue tous les rôles Directeur + voit code de tout le monde + peut supprimer Directeur</p>
        </div>

        {/* Onglets principaux du fondateur (dashboard, codes, etc) */}
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            {id:'dashboard', label:'Tableau de bord & Codes'},
            {id:'eleves', label:'Élèves'},
            {id:'directeur', label:'Directeur (supprimer)'},
            {id:'codes', label:'Codes - Modif/Création'},
          ].map(t=><button key={t.id} onClick={()=>setOngletFond(t.id)} className={`px-3 py-1.5 rounded-full text-[11px] font-medium border ${ongletFond===t.id?'bg-[#1B2A4A] text-white border-[#1B2A4A]':'bg-white text-gray-700'}`}>{t.label}</button>)}
        </div>

        {/* === DASHBOARD EXACTEMENT COMME TA PHOTO === */}
        {ongletFond==='dashboard' && (
          <div>
            {/* Barre supérieure comme ta capture: Tableau de bord / Bibliothèque / Vue par */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              <button onClick={()=>setOngletTop('tableau')} className={`shrink-0 px-5 py-2.5 rounded-full text-[14px] font-medium flex items-center gap-2 border ${ongletTop==='tableau'?'bg-[#1B2A4A] text-white border-[#1B2A4A]':'bg-white text-gray-700 border-gray-200'}`}>
                <span className="text-[16px]">⊞</span> Tableau de bord
              </button>
              <button onClick={()=>setOngletTop('bibliotheque')} className={`shrink-0 px-5 py-2.5 rounded-full text-[14px] font-medium flex items-center gap-2 border ${ongletTop==='bibliotheque'?'bg-[#1B2A4A] text-white border-[#1B2A4A]':'bg-[#FFFBF2] text-[#3D2F1A] border-[#E8DDC0]'}`}>
                <span>🗄️</span> Bibliothèque
              </button>
              <button onClick={()=>setOngletTop('vuepar')} className={`shrink-0 px-5 py-2.5 rounded-full text-[14px] font-medium flex items-center gap-2 border ${ongletTop==='vuepar'?'bg-[#1B2A4A] text-white border-[#1B2A4A]':'bg-[#FFFBF2] text-[#3D2F1A] border-[#E8DDC0]'}`}>
                <span>🏫</span> Vue par classe
              </button>
            </div>

            {ongletTop==='tableau' && (
              <div className="grid grid-cols-2 gap-3">
                {/* Carte 1 - ÉLÈVES INSCRITS - comme photo */}
                <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4 shadow-sm">
                  <p className="text-[13px] tracking-wide font-medium" style={{color:'#8A7D5A'}}>ÉLÈVES INSCRITS</p>
                  <p className="text-[34px] font-serif mt-1" style={{color:'#1B2A4A'}}>{nbEleves}</p>
                </div>
                {/* Carte 2 - CLASSES ACTIVES */}
                <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4 shadow-sm">
                  <p className="text-[13px] tracking-wide font-medium" style={{color:'#8A7D5A'}}>CLASSES ACTIVES</p>
                  <p className="text-[34px] font-serif mt-1" style={{color:'#1B2A4A'}}>{nbClasses}</p>
                </div>
                {/* Carte 3 - FRAIS DUS */}
                <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4 shadow-sm">
                  <p className="text-[13px] tracking-wide font-medium" style={{color:'#8A7D5A'}}>FRAIS DUS</p>
                  <p className="text-[28px] font-serif mt-1 font-bold" style={{color:'#8A6D1B'}}>{fraisDus.toLocaleString('fr-FR')} F</p>
                </div>
                {/* Carte 4 - DEMANDES EN ATTENTE */}
                <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4 shadow-sm">
                  <p className="text-[13px] tracking-wide font-medium leading-tight" style={{color:'#8A7D5A'}}>DEMANDES EN<br/>ATTENTE</p>
                  <p className="text-[34px] font-serif mt-1 font-bold" style={{color:'#8A6D1B'}}>{demandesAttente}</p>
                </div>
              </div>
            )}

            {ongletTop==='bibliotheque' && (
              <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4">
                <h3 className="font-bold text-sm mb-3">Bibliothèque - Demandes (rôle Directeur)</h3>
                <div className="space-y-2">{demandes.length===0?<p className="text-xs text-gray-400">Aucune demande - comme sur ta photo: 0 en attente</p>:demandes.map(d=><div key={d.id} className="border rounded-lg p-2 text-xs flex justify-between"><span>{d.prenom} {d.nom} - {d.statut}</span><button onClick={()=>{const co=genererCode(); setCodesEleves([co,...codesEleves]); setEleves([...eleves,{id:co,prenom:d.prenom,nom:d.nom,classe:d.classe}]); setDemandes(demandes.map(x=>x.id===d.id?{...x,statut:'validee',codeGenere:co}:x));}} className="px-2 py-1 bg-[#1B2A4A] text-white rounded-full text-[10px]">Valider → {co?co:''} CSP2JH6</button></div>)}</div>
              </div>
            )}

            {ongletTop==='vuepar' && (
              <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4">
                <h3 className="font-bold text-sm">Vue par classe</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">{classes.map(cl=><div key={cl} className="border rounded-lg p-2 text-xs"><b>{cl}</b><br/>{eleves.filter(e=>e.classe===cl).length} élèves</div>)}</div>
              </div>
            )}

            <div className="mt-6 bg-[#1B2A4A] text-white rounded-xl p-3 text-[11px]">
              <b>Explication de ta photo:</b> C'est exactement ce layout 2x2 avec les 4 cartes. J'ai repris les couleurs de ta capture: fond beige #FAF6EE, cartes blanches bordure bleu clair #C2D3F0, labels doré #8A7D5A, chiffres bleu nuit #1B2A4A et doré foncé #8A6D1B pour les montants. Tableau de bord actif en bleu marine.
            </div>
          </div>
        )}

        {ongletFond==='eleves' && (
          <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4">
            <h3 className="font-bold text-sm">Élèves - Rôle Directeur que Fondateur joue + Supprimer TOUS (exclusif)</h3>
            <button onClick={()=>{if(confirm('Supprimer TOUS? Seul Fondateur!')){setEleves([]); setCodesEleves([]);}}} className="mt-2 px-3 py-1 bg-[#8A2E2E] text-white rounded-full text-xs">🔥 Supprimer TOUS</button>
            <div className="mt-3 space-y-1 text-xs">{eleves.map(e=><div key={e.id} className="flex justify-between border-b py-1"><span>{e.id} - {e.prenom} {e.nom}</span><button onClick={()=>{setEleves(eleves.filter(x=>x.id!==e.id));}} className="text-red-600">Suppr</button></div>)}</div>
          </div>
        )}

        {ongletFond==='directeur' && (
          <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4">
            <h3 className="font-bold text-sm">Compte Directeur - Fondateur peut supprimer (Directeur ne peut pas voir Fondateur)</h3>
            <div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs">
              <p>Directeur code: {codesStaff.admin} / {codesStaff.directeur||'DIR-2025'}</p>
              <button onClick={()=>{if(confirm('Supprimer Directeur?')){const cp={...codesStaff}; delete cp.admin; delete cp.directeur; setCodesStaff(cp);}}} className="mt-2 px-3 py-1 bg-red-700 text-white rounded-full text-xs">🗑️ SUPPRIMER DIRECTEUR</button>
            </div>
          </div>
        )}

        {ongletFond==='codes' && (
          <div className="bg-white rounded-[16px] border border-[#C2D3F0] p-4">
            <h3 className="font-bold text-sm">🔐 Codes - EXCLUSIF Fondateur</h3>
            <p className="text-[11px] text-red-600">Seul Fondateur modifie tous les codes. Directeur voit 🔒 caché</p>
            <div className="mt-3 space-y-2">{Object.entries(codesStaff).map(([r,c])=><div key={r} className="flex gap-2 items-center border rounded-lg p-2 text-xs"><span className="w-20 font-bold">{r}</span><input value={c} onChange={e=>setCodesStaff({...codesStaff,[r]:e.target.value})} className="flex-1 border rounded px-2 py-1 font-mono"/><span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full">Modifiable</span></div>)}</div>
            <div className="mt-4 flex flex-wrap gap-1">{codesEleves.map(c=><span key={c} className="px-2 py-1 bg-[#FFFBF2] border border-[#E8DDC0] rounded-full text-[11px] font-mono">{c}</span>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
