import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';

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

  // Reset / purge only - zero fake data
  console.log('Zero fake data mode: cleared test data from Firestore.');
  console.log('🎉 Firestore ready for real data!');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
