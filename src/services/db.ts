import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  UserLogin,
  PatientRecord,
  DiseaseRecord,
  ComplicationRecord,
  DrugServRecord,
  MasterDisease,
  MasterComplication,
  MasterDrug
} from '../types';

// Initial seeds
const INITIAL_USERS: UserLogin[] = [
  {
    username: 'adisorn',
    password: '251108',
    AN: 'นายอดิศร ชุมคช',
    status: 'y',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_DISEASES: string[] = [
  'DM',
  'HT',
  'DLP',
  'Asthma',
  'COPD',
  'CKD',
  'CAD',
  'Stroke',
  'Thyroid disease',
  'GERD',
  'Cirrhosis',
  'Epilepsy'
];

const INITIAL_COMPLICATIONS: string[] = [
  'Difficult intubation',
  'Laryngospasm',
  'Bronchospasm',
  'Hypotension',
  'Hypertension',
  'Arrhythmia',
  'Desaturation (SpO2 < 90%)',
  'Hypothermia (< 35.5 C)',
  'Shivering',
  'PONV (คลื่นไส้อาเจียน)',
  'High spinal block',
  'Delayed emergence',
  'Dental injury',
  'Sore throat'
];

const INITIAL_DRUGS: string[] = [
  'Propofol',
  'Fentanyl',
  'Morphine',
  'Pethidine',
  'Cisatracurium',
  'Rocuronium',
  'Succinylcholine',
  'Neostigmine',
  'Atropine',
  'Ephedrine',
  'Norepinephrine',
  'Nicardipine',
  'Ondansetron',
  'Dexamethasone',
  'Bupivacaine Heavy 0.5%',
  'Lidocaine 2%',
  'Tramadol',
  'Paracetamol IV'
];

// Helper for local storage backup to ensure instant responsiveness
const getLocal = <T>(key: string, fallback: T[]): T[] => {
  try {
    const raw = localStorage.getItem(`ptl_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(`ptl_${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
};

// Seed initial system data
export const seedInitialDataIfEmpty = async () => {
  try {
    // Check users
    const usersCol = collection(db, 'tbllogin');
    const userSnap = await getDocs(usersCol);
    if (userSnap.empty) {
      for (const u of INITIAL_USERS) {
        await addDoc(usersCol, u);
      }
    }

    // Check diseases
    const disCol = collection(db, 'tbldisname');
    const disSnap = await getDocs(disCol);
    if (disSnap.empty) {
      for (const d of INITIAL_DISEASES) {
        await addDoc(disCol, { dis: d });
      }
    }

    // Check complications
    const comCol = collection(db, 'tblcom');
    const comSnap = await getDocs(comCol);
    if (comSnap.empty) {
      for (const c of INITIAL_COMPLICATIONS) {
        await addDoc(comCol, { Complication: c });
      }
    }

    // Check drugs
    const drugCol = collection(db, 'tbldrug');
    const drugSnap = await getDocs(drugCol);
    if (drugSnap.empty) {
      for (const dr of INITIAL_DRUGS) {
        await addDoc(drugCol, { drugname: dr });
      }
    }
  } catch (error) {
    console.warn('Firebase initial seeding notice:', error);
  }
};

// ==================== tbllogin (Users) ====================
export const getUsers = async (): Promise<UserLogin[]> => {
  try {
    const col = collection(db, 'tbllogin');
    const snap = await getDocs(col);
    if (snap.empty) {
      return getLocal('tbllogin', INITIAL_USERS);
    }
    const items: UserLogin[] = [];
    snap.forEach(d => {
      items.push({ id: d.id, ...(d.data() as UserLogin) });
    });
    setLocal('tbllogin', items);
    return items;
  } catch (error) {
    console.warn('Firestore fallback getUsers:', error);
    return getLocal('tbllogin', INITIAL_USERS);
  }
};

export const registerUser = async (user: Omit<UserLogin, 'id'>): Promise<string> => {
  const newUser = {
    ...user,
    status: user.status || 's',
    createdAt: new Date().toISOString()
  };
  try {
    const docRef = await addDoc(collection(db, 'tbllogin'), newUser);
    const users = await getUsers();
    setLocal('tbllogin', [...users, { id: docRef.id, ...newUser }]);
    return docRef.id;
  } catch (error) {
    console.warn('Firestore fallback registerUser:', error);
    const localId = `user_${Date.now()}`;
    const users = getLocal<UserLogin>('tbllogin', INITIAL_USERS);
    setLocal('tbllogin', [...users, { id: localId, ...newUser }]);
    return localId;
  }
};

export const updateUser = async (id: string, updates: Partial<UserLogin>): Promise<void> => {
  try {
    const docRef = doc(db, 'tbllogin', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.warn('Firestore fallback updateUser:', error);
  }
  const users = getLocal<UserLogin>('tbllogin', INITIAL_USERS);
  setLocal('tbllogin', users.map(u => u.id === id ? { ...u, ...updates } : u));
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tbllogin', id));
  } catch (error) {
    console.warn('Firestore fallback deleteUser:', error);
  }
  const users = getLocal<UserLogin>('tbllogin', INITIAL_USERS);
  setLocal('tbllogin', users.filter(u => u.id !== id));
};

// ==================== tblPateint (Patient Registry) ====================
export const getPatients = async (): Promise<PatientRecord[]> => {
  try {
    const col = collection(db, 'tblPateint');
    const q = query(col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const items: PatientRecord[] = [];
    snap.forEach(d => {
      items.push({ id: d.id, ...(d.data() as PatientRecord) });
    });
    setLocal('tblPateint', items);
    return items;
  } catch (error) {
    try {
      const snap = await getDocs(collection(db, 'tblPateint'));
      const items: PatientRecord[] = [];
      snap.forEach(d => {
        items.push({ id: d.id, ...(d.data() as PatientRecord) });
      });
      setLocal('tblPateint', items);
      return items;
    } catch {
      return getLocal('tblPateint', []);
    }
  }
};

export const addPatient = async (patient: Omit<PatientRecord, 'id'>): Promise<string> => {
  const newRecord = {
    ...patient,
    createdAt: new Date().toISOString()
  };
  try {
    const docRef = await addDoc(collection(db, 'tblPateint'), newRecord);
    const records = await getPatients();
    setLocal('tblPateint', [{ id: docRef.id, ...newRecord }, ...records]);
    return docRef.id;
  } catch (error) {
    console.warn('Firestore fallback addPatient:', error);
    const localId = `pat_${Date.now()}`;
    const records = getLocal<PatientRecord>('tblPateint', []);
    setLocal('tblPateint', [{ id: localId, ...newRecord }, ...records]);
    return localId;
  }
};

export const updatePatient = async (id: string, updates: Partial<PatientRecord>): Promise<void> => {
  try {
    const docRef = doc(db, 'tblPateint', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.warn('Firestore fallback updatePatient:', error);
  }
  const records = getLocal<PatientRecord>('tblPateint', []);
  setLocal('tblPateint', records.map(r => r.id === id ? { ...r, ...updates } : r));
};

export const deletePatient = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tblPateint', id));
  } catch (error) {
    console.warn('Firestore fallback deletePatient:', error);
  }
  const records = getLocal<PatientRecord>('tblPateint', []);
  setLocal('tblPateint', records.filter(r => r.id !== id));
};

// ==================== tbldis (Comorbidities) ====================
export const getDiseaseRecords = async (): Promise<DiseaseRecord[]> => {
  try {
    const snap = await getDocs(collection(db, 'tbldis'));
    const items: DiseaseRecord[] = [];
    snap.forEach(d => {
      items.push({ id: d.id, ...(d.data() as DiseaseRecord) });
    });
    setLocal('tbldis', items);
    return items;
  } catch (error) {
    return getLocal('tbldis', []);
  }
};

export const addDiseaseRecord = async (record: Omit<DiseaseRecord, 'id'>): Promise<string> => {
  const newRec = {
    ...record,
    createdAt: new Date().toISOString()
  };
  try {
    const docRef = await addDoc(collection(db, 'tbldis'), newRec);
    const list = await getDiseaseRecords();
    setLocal('tbldis', [{ id: docRef.id, ...newRec }, ...list]);
    return docRef.id;
  } catch (error) {
    const localId = `dis_${Date.now()}`;
    const list = getLocal<DiseaseRecord>('tbldis', []);
    setLocal('tbldis', [{ id: localId, ...newRec }, ...list]);
    return localId;
  }
};

export const updateDiseaseRecord = async (id: string, updates: Partial<DiseaseRecord>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tbldis', id), updates);
  } catch (error) {
    console.warn('Fallback update tbldis', error);
  }
  const list = getLocal<DiseaseRecord>('tbldis', []);
  setLocal('tbldis', list.map(r => r.id === id ? { ...r, ...updates } : r));
};

export const deleteDiseaseRecord = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tbldis', id));
  } catch (error) {
    console.warn('Fallback delete tbldis', error);
  }
  const list = getLocal<DiseaseRecord>('tbldis', []);
  setLocal('tbldis', list.filter(r => r.id !== id));
};

// ==================== tblOperation (Complications) ====================
export const getOperationRecords = async (): Promise<ComplicationRecord[]> => {
  try {
    const snap = await getDocs(collection(db, 'tblOperation'));
    const items: ComplicationRecord[] = [];
    snap.forEach(d => {
      items.push({ id: d.id, ...(d.data() as ComplicationRecord) });
    });
    setLocal('tblOperation', items);
    return items;
  } catch (error) {
    return getLocal('tblOperation', []);
  }
};

export const addOperationRecord = async (record: Omit<ComplicationRecord, 'id'>): Promise<string> => {
  const newRec = {
    ...record,
    createdAt: new Date().toISOString()
  };
  try {
    const docRef = await addDoc(collection(db, 'tblOperation'), newRec);
    const list = await getOperationRecords();
    setLocal('tblOperation', [{ id: docRef.id, ...newRec }, ...list]);
    return docRef.id;
  } catch (error) {
    const localId = `oper_${Date.now()}`;
    const list = getLocal<ComplicationRecord>('tblOperation', []);
    setLocal('tblOperation', [{ id: localId, ...newRec }, ...list]);
    return localId;
  }
};

export const updateOperationRecord = async (id: string, updates: Partial<ComplicationRecord>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tblOperation', id), updates);
  } catch (error) {
    console.warn('Fallback update tblOperation', error);
  }
  const list = getLocal<ComplicationRecord>('tblOperation', []);
  setLocal('tblOperation', list.map(r => r.id === id ? { ...r, ...updates } : r));
};

export const deleteOperationRecord = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tblOperation', id));
  } catch (error) {
    console.warn('Fallback delete tblOperation', error);
  }
  const list = getLocal<ComplicationRecord>('tblOperation', []);
  setLocal('tblOperation', list.filter(r => r.id !== id));
};

// ==================== tblDrugServ (Medication Records) ====================
export const getDrugServRecords = async (): Promise<DrugServRecord[]> => {
  try {
    const snap = await getDocs(collection(db, 'tblDrugServ'));
    const items: DrugServRecord[] = [];
    snap.forEach(d => {
      items.push({ id: d.id, ...(d.data() as DrugServRecord) });
    });
    setLocal('tblDrugServ', items);
    return items;
  } catch (error) {
    return getLocal('tblDrugServ', []);
  }
};

export const addDrugServRecord = async (record: Omit<DrugServRecord, 'id'>): Promise<string> => {
  const newRec = {
    ...record,
    createdAt: new Date().toISOString()
  };
  try {
    const docRef = await addDoc(collection(db, 'tblDrugServ'), newRec);
    const list = await getDrugServRecords();
    setLocal('tblDrugServ', [{ id: docRef.id, ...newRec }, ...list]);
    return docRef.id;
  } catch (error) {
    const localId = `drug_${Date.now()}`;
    const list = getLocal<DrugServRecord>('tblDrugServ', []);
    setLocal('tblDrugServ', [{ id: localId, ...newRec }, ...list]);
    return localId;
  }
};

export const updateDrugServRecord = async (id: string, updates: Partial<DrugServRecord>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tblDrugServ', id), updates);
  } catch (error) {
    console.warn('Fallback update tblDrugServ', error);
  }
  const list = getLocal<DrugServRecord>('tblDrugServ', []);
  setLocal('tblDrugServ', list.map(r => r.id === id ? { ...r, ...updates } : r));
};

export const deleteDrugServRecord = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tblDrugServ', id));
  } catch (error) {
    console.warn('Fallback delete tblDrugServ', error);
  }
  const list = getLocal<DrugServRecord>('tblDrugServ', []);
  setLocal('tblDrugServ', list.filter(r => r.id !== id));
};

// ==================== Master Data (tbldisname, tblcom, tbldrug) ====================
export const getMasterDiseases = async (): Promise<MasterDisease[]> => {
  try {
    const snap = await getDocs(collection(db, 'tbldisname'));
    const items: MasterDisease[] = [];
    snap.forEach(d => items.push({ id: d.id, ...(d.data() as MasterDisease) }));
    if (items.length > 0) {
      setLocal('tbldisname', items);
      return items;
    }
  } catch (e) {
    console.warn(e);
  }
  return getLocal('tbldisname', INITIAL_DISEASES.map((d, i) => ({ id: `dis_${i}`, dis: d })));
};

export const addMasterDisease = async (dis: string): Promise<void> => {
  try {
    await addDoc(collection(db, 'tbldisname'), { dis });
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDiseases();
  setLocal('tbldisname', [...items, { id: `dis_${Date.now()}`, dis }]);
};

export const updateMasterDisease = async (id: string, dis: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tbldisname', id), { dis });
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDiseases();
  setLocal('tbldisname', items.map(x => x.id === id ? { ...x, dis } : x));
};

export const deleteMasterDisease = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tbldisname', id));
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDiseases();
  setLocal('tbldisname', items.filter(x => x.id !== id));
};

// Master Complications
export const getMasterComplications = async (): Promise<MasterComplication[]> => {
  try {
    const snap = await getDocs(collection(db, 'tblcom'));
    const items: MasterComplication[] = [];
    snap.forEach(d => items.push({ id: d.id, ...(d.data() as MasterComplication) }));
    if (items.length > 0) {
      setLocal('tblcom', items);
      return items;
    }
  } catch (e) {
    console.warn(e);
  }
  return getLocal('tblcom', INITIAL_COMPLICATIONS.map((c, i) => ({ id: `com_${i}`, Complication: c })));
};

export const addMasterComplication = async (Complication: string): Promise<void> => {
  try {
    await addDoc(collection(db, 'tblcom'), { Complication });
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterComplications();
  setLocal('tblcom', [...items, { id: `com_${Date.now()}`, Complication }]);
};

export const updateMasterComplication = async (id: string, Complication: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tblcom', id), { Complication });
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterComplications();
  setLocal('tblcom', items.map(x => x.id === id ? { ...x, Complication } : x));
};

export const deleteMasterComplication = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tblcom', id));
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterComplications();
  setLocal('tblcom', items.filter(x => x.id !== id));
};

// Master Drugs
export const getMasterDrugs = async (): Promise<MasterDrug[]> => {
  try {
    const snap = await getDocs(collection(db, 'tbldrug'));
    const items: MasterDrug[] = [];
    snap.forEach(d => items.push({ id: d.id, ...(d.data() as MasterDrug) }));
    if (items.length > 0) {
      setLocal('tbldrug', items);
      return items;
    }
  } catch (e) {
    console.warn(e);
  }
  return getLocal('tbldrug', INITIAL_DRUGS.map((dr, i) => ({ id: `drug_${i}`, drugname: dr })));
};

export const addMasterDrug = async (drugname: string): Promise<void> => {
  try {
    await addDoc(collection(db, 'tbldrug'), { drugname });
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDrugs();
  setLocal('tbldrug', [...items, { id: `dr_${Date.now()}`, drugname }]);
};

export const updateMasterDrug = async (id: string, drugname: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tbldrug', id), { drugname });
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDrugs();
  setLocal('tbldrug', items.map(x => x.id === id ? { ...x, drugname } : x));
};

export const deleteMasterDrug = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tbldrug', id));
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDrugs();
  setLocal('tbldrug', items.filter(x => x.id !== id));
};
