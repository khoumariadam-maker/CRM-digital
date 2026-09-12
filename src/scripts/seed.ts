import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { INITIAL_SALES, INITIAL_PRODUCTS, INITIAL_CAISSES, INITIAL_EXCHANGE_RATE } from '../lib/mockData';

const firebaseConfig = {
  apiKey: "AIzaSyAZbV2rH7pUiYeCub2RaoTJniy97lhaqyA",
  appId: "1:499705643677:web:618a59e248aeaa57410a74",
  messagingSenderId: "499705643677",
  projectId: "crm-digital-d9106",
  authDomain: "crm-digital-d9106.firebaseapp.com",
  storageBucket: "crm-digital-d9106.appspot.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function cleanForFirestore(obj: Record<string, any>) {
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) {
      res[k] = v;
    }
  }
  return res;
}

async function runSeed() {
  console.log('Cleaning old mock products from Firestore...');
  const oldProdIds = ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5'];
  for (const id of oldProdIds) {
    await deleteDoc(doc(db, 'products', id)).catch(() => {});
  }
  
  const oldSaleIds = [
    'sale-up-101', 'sale-up-102', 'sale-up-103', 'sale-up-104', 'sale-up-105',
    'sale-up-106', 'sale-up-107', 'sale-up-108', 'sale-up-109', 'sale-up-110',
    'sale-up-111', 'sale-up-112', 'sale-up-113', 'sale-up-114'
  ];
  for (const id of oldSaleIds) {
    await deleteDoc(doc(db, 'sales', id)).catch(() => {});
  }

  // 1. Seed Products (Jio AI Pro as ONLY product)
  for (const p of INITIAL_PRODUCTS) {
    await setDoc(doc(db, 'products', p.id), cleanForFirestore(p), { merge: true });
  }
  console.log(`✓ Seeded ${INITIAL_PRODUCTS.length} product: Jio AI Pro @ 1400 DA`);

  // 2. Seed Sales (Jio AI Pro 1400 DA - 16 paid + 7 pending)
  for (const s of INITIAL_SALES) {
    await setDoc(doc(db, 'sales', s.id), cleanForFirestore(s), { merge: true });
  }
  console.log(`✓ Seeded ${INITIAL_SALES.length} sales for Jio AI Pro`);

  // 3. Seed Daily Caisses (Shift active with 22,345 DA BaridiMob float)
  for (const c of INITIAL_CAISSES) {
    await setDoc(doc(db, 'daily_caisses', c.id), cleanForFirestore(c), { merge: true });
  }
  console.log(`✓ Seeded active caisse shift with 22,345 DA BaridiMob float`);

  // 4. Seed Exchange Rate
  await setDoc(doc(db, 'crm_settings', 'exchange_rate'), {
    rate: INITIAL_EXCHANGE_RATE,
    updatedAt: new Date().toISOString(),
  });

  console.log('🎉 Firestore cleaned and synchronized strictly to Jio AI Pro!');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
