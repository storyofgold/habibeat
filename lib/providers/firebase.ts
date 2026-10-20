import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { User, Product, UserRole, StockEntryRow } from '../../types';

const env = (import.meta as any).env ?? {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  throw new Error(
    'Konfigurasi Firebase kosong. Isi file .env.local (lihat .env.example) dengan config dari Firebase Console.'
  );
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Secondary app so an admin can create users without losing their own session.
// ponytail: client-side provisioning only; move to Admin SDK (Cloud Function) if
// you ever need server-enforced user creation / real account deletion.
let provisioningApp: FirebaseApp | null = getApps().find(a => a.name === 'provisioning') || null;
const getProvisioningAuth = () => {
  if (!provisioningApp) provisioningApp = initializeApp(firebaseConfig, 'provisioning');
  return getAuth(provisioningApp);
};

const toUser = (uid: string, data: any): User => ({
  id: uid,
  username: data.username,
  name: data.name,
  role: data.role as UserRole,
  isActive: data.is_active === true,
});

const entryId = (r: StockEntryRow) =>
  `${r.section}_${r.year}_${r.month}_${r.day}_${r.product_id}`;

const listUsers = async (): Promise<User[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => toUser(d.id, d.data()));
};

const listProducts = async (): Promise<Product[]> => {
  const snap = await getDocs(collection(db, 'products'));
  const items = snap.docs.map(d => ({
    id: d.id,
    name: d.data().name,
    unit: d.data().unit,
    unitPrice: Number(d.data().unit_price) || 0,
  }));
  return items.sort((a, b) => a.name.localeCompare(b.name));
};

const getEntries = async (month: number, year: number): Promise<StockEntryRow[]> => {
  const q = query(
    collection(db, 'daily_entries'),
    where('month', '==', month),
    where('year', '==', year)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as StockEntryRow);
};

const subscribeEntries = (
  month: number,
  year: number,
  cb: (row: StockEntryRow) => void
): (() => void) => {
  const q = query(
    collection(db, 'daily_entries'),
    where('month', '==', month),
    where('year', '==', year)
  );
  return onSnapshot(q, snap => {
    snap.docChanges().forEach(change => cb(change.doc.data() as StockEntryRow));
  });
};

const upsertEntry = async (row: StockEntryRow): Promise<void> => {
  // merge:true so unrelated fields are never clobbered by a stale snapshot
  await setDoc(doc(db, 'daily_entries', entryId(row)), row, { merge: true });
};

const saveProduct = async (input: {
  id?: string;
  name: string;
  unit: string;
  unit_price: number;
}): Promise<void> => {
  if (input.id) {
    await updateDoc(doc(db, 'products', input.id), {
      name: input.name,
      unit: input.unit,
      unit_price: input.unit_price,
    });
  } else {
    await addDoc(collection(db, 'products'), {
      name: input.name,
      unit: input.unit,
      unit_price: input.unit_price,
    });
  }
};

const deleteProduct = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'products', id));
};

const importProducts = async (items: { name: string; unit: string }[]): Promise<number> => {
  const batch = writeBatch(db);
  items.forEach(item => {
    batch.set(doc(collection(db, 'products')), { name: item.name, unit: item.unit, unit_price: 0 });
  });
  await batch.commit();
  return items.length;
};

const login = async (email: string, password: string): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  if (!snap.exists()) {
    await signOut(auth);
    throw new Error('Profil user tidak ditemukan. Hubungi Admin.');
  }
  const data = snap.data();
  if (data.is_active !== true) {
    await signOut(auth);
    throw new Error('Akun Anda sudah tidak aktif. Hubungi Admin.');
  }
  return toUser(cred.user.uid, data);
};

const logout = async (): Promise<void> => {
  await signOut(auth);
};

const onAuthChange = (cb: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, async fbUser => {
    if (!fbUser) {
      cb(null);
      return;
    }
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    if (!snap.exists() || snap.data().is_active !== true) {
      await signOut(auth);
      cb(null);
      return;
    }
    cb(toUser(fbUser.uid, snap.data()));
  });
};

const createUser = async (
  email: string,
  name: string,
  role: UserRole,
  password: string
): Promise<void> => {
  const provisioningAuth = getProvisioningAuth();
  const cred = await createUserWithEmailAndPassword(provisioningAuth, email, password);
  await signOut(provisioningAuth);
  await setDoc(doc(db, 'users', cred.user.uid), {
    username: email,
    name,
    role,
    is_active: true,
  });
};

const setUserActive = async (uid: string, isActive: boolean): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { is_active: isActive });
};

const deleteUser = async (uid: string): Promise<void> => {
  // ponytail: removes the Firestore profile only; the Auth account is left orphaned
  // (it can no longer access anything since rules require an active profile).
  await deleteDoc(doc(db, 'users', uid));
};

export const firebaseProvider = {
  login,
  logout,
  onAuthChange,
  listUsers,
  listProducts,
  getEntries,
  subscribeEntries,
  upsertEntry,
  saveProduct,
  deleteProduct,
  importProducts,
  createUser,
  setUserActive,
  deleteUser,
};
