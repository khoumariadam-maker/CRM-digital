import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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
  console.log('Seeding up-to-date data to Firestore...');

  // 1. Seed Products
  for (const p of INITIAL_PRODUCTS) {
    await setDoc(doc(db, 'products', p.id), cleanForFirestore(p), { merge: true });
  }
  console.log(`✓ Seeded ${INITIAL_PRODUCTS.length} products`);

  // 2. Seed Sales (14 confirmed paid + 7 pending)
  for (const s of INITIAL_SALES) {
    await setDoc(doc(db, 'sales', s.id), cleanForFirestore(s), { merge: true });
  }
  console.log(`✓ Seeded ${INITIAL_SALES.length} sales (14 paid totaling 22,345 DA profit + 7 pending)`);

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
  console.log(`✓ Seeded exchange rate ${INITIAL_EXCHANGE_RATE} DA/$`);

  console.log('🎉 All up-to-date data successfully synchronized to Firebase Firestore!');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
