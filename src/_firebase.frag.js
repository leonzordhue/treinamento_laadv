<script>
/* â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
   â•‘          PORTAL DE TREINAMENTOS â€” LAADV â€” AKE/UFT-1.0         â•‘
   â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£
   â•‘  CONFIGURAÃ‡ÃƒO FIREBASE:                                        â•‘
   â•‘  1. Acesse https://console.firebase.google.com                 â•‘
   â•‘  2. Crie um projeto (ou use um existente)                      â•‘
   â•‘  3. VÃ¡ em Build â†’ Realtime Database â†’ Criar banco de dados     â•‘
   â•‘  4. Escolha "Iniciar no modo de teste" (ajuste as regras apÃ³s) â•‘
   â•‘  5. Clique no Ã­cone "</>" em VisÃ£o geral do projeto            â•‘
   â•‘  6. Copie os valores para FIREBASE_CONFIG abaixo               â•‘
   â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCJS2ANybznsd2CV-_P0FHahM51Tz-NU6c",
  authDomain:        "laadv-portal.firebaseapp.com",
  databaseURL:       "https://laadv-portal-default-rtdb.firebaseio.com",
  projectId:         "laadv-portal",
  storageBucket:     "laadv-portal.firebasestorage.app",
  messagingSenderId: "24953637553",
  appId:             "1:24953637553:web:5aa46c6ea59080bd7eb090"
};

const ROOT = 'laadv_portal';  // chave raiz no Firebase

/* â”€â”€ ESTADO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const S = { user: null, panel: 'inicio', subView: null };

/* â”€â”€ FIREBASE HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let db;

async function dbRead(path){
  const snap = await db.ref(`${ROOT}/${path}`).once('value');
  return snap.val();
}
async function dbSet(path, data){ await db.ref(`${ROOT}/${path}`).set(data); }
async function dbPush(path, data){ const r = db.ref(`${ROOT}/${path}`).push(); await r.set(data); return r.key; }
async function dbRemove(path){ await db.ref(`${ROOT}/${path}`).remove(); }
async function dbUpdate(path, data){ await db.ref(`${ROOT}/${path}`).update(data); }

// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: Firebase config + helpers
