import { supabase } from '../supabase';
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

// Initial seeds fallback
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

// Helper for local storage backup to ensure instant responsiveness & offline safety
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

// Seed initial system data into Supabase if empty
export const seedInitialDataIfEmpty = async () => {
  try {
    // Check users
    const { data: users, error: userErr } = await supabase.from('tbllogin').select('id').limit(1);
    if (!userErr && (!users || users.length === 0)) {
      for (const u of INITIAL_USERS) {
        await supabase.from('tbllogin').insert([u]);
      }
    }

    // Check diseases
    const { data: diseases, error: disErr } = await supabase.from('tbldisname').select('id').limit(1);
    if (!disErr && (!diseases || diseases.length === 0)) {
      await supabase.from('tbldisname').insert(INITIAL_DISEASES.map(d => ({ dis: d })));
    }

    // Check complications
    const { data: coms, error: comErr } = await supabase.from('tblcom').select('id').limit(1);
    if (!comErr && (!coms || coms.length === 0)) {
      await supabase.from('tblcom').insert(INITIAL_COMPLICATIONS.map(c => ({ Complication: c })));
    }

    // Check drugs
    const { data: drugs, error: drugErr } = await supabase.from('tbldrug').select('id').limit(1);
    if (!drugErr && (!drugs || drugs.length === 0)) {
      await supabase.from('tbldrug').insert(INITIAL_DRUGS.map(dr => ({ drugname: dr })));
    }
  } catch (error) {
    console.warn('Supabase initial seeding notice:', error);
  }
};

// ==================== tbllogin (Users) ====================
export const getUsers = async (): Promise<UserLogin[]> => {
  try {
    const { data, error } = await supabase
      .from('tbllogin')
      .select('*')
      .order('createdAt', { ascending: true });

    if (!error && data && data.length > 0) {
      setLocal('tbllogin', data);
      return data as UserLogin[];
    }
    if (error) {
      console.warn('Supabase getUsers error:', error.message);
    }
    return getLocal('tbllogin', INITIAL_USERS);
  } catch (error) {
    console.warn('Supabase fallback getUsers:', error);
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
    const { data, error } = await supabase
      .from('tbllogin')
      .insert([newUser])
      .select('id')
      .single();

    if (!error && data?.id) {
      const users = await getUsers();
      setLocal('tbllogin', [...users, { id: data.id, ...newUser }]);
      return data.id;
    }
    if (error) {
      console.warn('Supabase registerUser error:', error.message);
    }
  } catch (error) {
    console.warn('Supabase fallback registerUser:', error);
  }

  const localId = `user_${Date.now()}`;
  const users = getLocal<UserLogin>('tbllogin', INITIAL_USERS);
  setLocal('tbllogin', [...users, { id: localId, ...newUser }]);
  return localId;
};

export const updateUser = async (id: string, updates: Partial<UserLogin>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tbllogin')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.warn('Supabase updateUser error:', error.message);
    }
  } catch (error) {
    console.warn('Supabase fallback updateUser:', error);
  }
  const users = getLocal<UserLogin>('tbllogin', INITIAL_USERS);
  setLocal('tbllogin', users.map(u => u.id === id ? { ...u, ...updates } : u));
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tbllogin')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase deleteUser error:', error.message);
    }
  } catch (error) {
    console.warn('Supabase fallback deleteUser:', error);
  }
  const users = getLocal<UserLogin>('tbllogin', INITIAL_USERS);
  setLocal('tbllogin', users.filter(u => u.id !== id));
};

// ==================== tblPateint (Patient Registry) ====================
export const getPatients = async (): Promise<PatientRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('tblPateint')
      .select('*')
      .order('createdAt', { ascending: false });

    if (!error && data) {
      setLocal('tblPateint', data);
      return data as PatientRecord[];
    }
    if (error) {
      console.warn('Supabase getPatients error:', error.message);
    }
    return getLocal('tblPateint', []);
  } catch (error) {
    console.warn('Supabase fallback getPatients:', error);
    return getLocal('tblPateint', []);
  }
};

export const addPatient = async (patient: Omit<PatientRecord, 'id'>): Promise<string> => {
  const newRecord = {
    ...patient,
    createdAt: new Date().toISOString()
  };
  try {
    const { data, error } = await supabase
      .from('tblPateint')
      .insert([newRecord])
      .select('id')
      .single();

    if (!error && data?.id) {
      const records = await getPatients();
      setLocal('tblPateint', [{ id: data.id, ...newRecord }, ...records]);
      return data.id;
    }
    if (error) {
      console.warn('Supabase addPatient error:', error.message);
    }
  } catch (error) {
    console.warn('Supabase fallback addPatient:', error);
  }

  const localId = `pat_${Date.now()}`;
  const records = getLocal<PatientRecord>('tblPateint', []);
  setLocal('tblPateint', [{ id: localId, ...newRecord }, ...records]);
  return localId;
};

export const updatePatient = async (id: string, updates: Partial<PatientRecord>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tblPateint')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.warn('Supabase updatePatient error:', error.message);
    }
  } catch (error) {
    console.warn('Supabase fallback updatePatient:', error);
  }
  const records = getLocal<PatientRecord>('tblPateint', []);
  setLocal('tblPateint', records.map(r => r.id === id ? { ...r, ...updates } : r));
};

export const deletePatient = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tblPateint')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase deletePatient error:', error.message);
    }
  } catch (error) {
    console.warn('Supabase fallback deletePatient:', error);
  }
  const records = getLocal<PatientRecord>('tblPateint', []);
  setLocal('tblPateint', records.filter(r => r.id !== id));
};

// ==================== tbldis (Comorbidities) ====================
export const getDiseaseRecords = async (): Promise<DiseaseRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('tbldis')
      .select('*')
      .order('createdAt', { ascending: false });

    if (!error && data) {
      setLocal('tbldis', data);
      return data as DiseaseRecord[];
    }
    if (error) {
      console.warn('Supabase getDiseaseRecords error:', error.message);
    }
    return getLocal('tbldis', []);
  } catch (error) {
    console.warn('Supabase fallback getDiseaseRecords:', error);
    return getLocal('tbldis', []);
  }
};

export const addDiseaseRecord = async (record: Omit<DiseaseRecord, 'id'>): Promise<string> => {
  const newRec = {
    ...record,
    createdAt: new Date().toISOString()
  };
  try {
    const { data, error } = await supabase
      .from('tbldis')
      .insert([newRec])
      .select('id')
      .single();

    if (!error && data?.id) {
      const list = await getDiseaseRecords();
      setLocal('tbldis', [{ id: data.id, ...newRec }, ...list]);
      return data.id;
    }
  } catch (error) {
    console.warn('Supabase fallback addDiseaseRecord:', error);
  }

  const localId = `dis_${Date.now()}`;
  const list = getLocal<DiseaseRecord>('tbldis', []);
  setLocal('tbldis', [{ id: localId, ...newRec }, ...list]);
  return localId;
};

export const updateDiseaseRecord = async (id: string, updates: Partial<DiseaseRecord>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tbldis')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.warn('Fallback update tbldis error:', error.message);
    }
  } catch (error) {
    console.warn('Fallback update tbldis', error);
  }
  const list = getLocal<DiseaseRecord>('tbldis', []);
  setLocal('tbldis', list.map(r => r.id === id ? { ...r, ...updates } : r));
};

export const deleteDiseaseRecord = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tbldis')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Fallback delete tbldis error:', error.message);
    }
  } catch (error) {
    console.warn('Fallback delete tbldis', error);
  }
  const list = getLocal<DiseaseRecord>('tbldis', []);
  setLocal('tbldis', list.filter(r => r.id !== id));
};

// ==================== tblOperation (Complications) ====================
export const getOperationRecords = async (): Promise<ComplicationRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('tblOperation')
      .select('*')
      .order('createdAt', { ascending: false });

    if (!error && data) {
      setLocal('tblOperation', data);
      return data as ComplicationRecord[];
    }
    if (error) {
      console.warn('Supabase getOperationRecords error:', error.message);
    }
    return getLocal('tblOperation', []);
  } catch (error) {
    console.warn('Supabase fallback getOperationRecords:', error);
    return getLocal('tblOperation', []);
  }
};

export const addOperationRecord = async (record: Omit<ComplicationRecord, 'id'>): Promise<string> => {
  const newRec = {
    ...record,
    createdAt: new Date().toISOString()
  };
  try {
    const { data, error } = await supabase
      .from('tblOperation')
      .insert([newRec])
      .select('id')
      .single();

    if (!error && data?.id) {
      const list = await getOperationRecords();
      setLocal('tblOperation', [{ id: data.id, ...newRec }, ...list]);
      return data.id;
    }
  } catch (error) {
    console.warn('Supabase fallback addOperationRecord:', error);
  }

  const localId = `oper_${Date.now()}`;
  const list = getLocal<ComplicationRecord>('tblOperation', []);
  setLocal('tblOperation', [{ id: localId, ...newRec }, ...list]);
  return localId;
};

export const updateOperationRecord = async (id: string, updates: Partial<ComplicationRecord>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tblOperation')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.warn('Fallback update tblOperation error:', error.message);
    }
  } catch (error) {
    console.warn('Fallback update tblOperation', error);
  }
  const list = getLocal<ComplicationRecord>('tblOperation', []);
  setLocal('tblOperation', list.map(r => r.id === id ? { ...r, ...updates } : r));
};

export const deleteOperationRecord = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tblOperation')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Fallback delete tblOperation error:', error.message);
    }
  } catch (error) {
    console.warn('Fallback delete tblOperation', error);
  }
  const list = getLocal<ComplicationRecord>('tblOperation', []);
  setLocal('tblOperation', list.filter(r => r.id !== id));
};

// ==================== tblDrugServ (Medication Records) ====================
export const getDrugServRecords = async (): Promise<DrugServRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('tblDrugServ')
      .select('*')
      .order('createdAt', { ascending: false });

    if (!error && data) {
      setLocal('tblDrugServ', data);
      return data as DrugServRecord[];
    }
    if (error) {
      console.warn('Supabase getDrugServRecords error:', error.message);
    }
    return getLocal('tblDrugServ', []);
  } catch (error) {
    console.warn('Supabase fallback getDrugServRecords:', error);
    return getLocal('tblDrugServ', []);
  }
};

export const addDrugServRecord = async (record: Omit<DrugServRecord, 'id'>): Promise<string> => {
  const newRec = {
    ...record,
    createdAt: new Date().toISOString()
  };
  try {
    const { data, error } = await supabase
      .from('tblDrugServ')
      .insert([newRec])
      .select('id')
      .single();

    if (!error && data?.id) {
      const list = await getDrugServRecords();
      setLocal('tblDrugServ', [{ id: data.id, ...newRec }, ...list]);
      return data.id;
    }
  } catch (error) {
    console.warn('Supabase fallback addDrugServRecord:', error);
  }

  const localId = `drug_${Date.now()}`;
  const list = getLocal<DrugServRecord>('tblDrugServ', []);
  setLocal('tblDrugServ', [{ id: localId, ...newRec }, ...list]);
  return localId;
};

export const updateDrugServRecord = async (id: string, updates: Partial<DrugServRecord>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tblDrugServ')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.warn('Fallback update tblDrugServ error:', error.message);
    }
  } catch (error) {
    console.warn('Fallback update tblDrugServ', error);
  }
  const list = getLocal<DrugServRecord>('tblDrugServ', []);
  setLocal('tblDrugServ', list.map(r => r.id === id ? { ...r, ...updates } : r));
};

export const deleteDrugServRecord = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tblDrugServ')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Fallback delete tblDrugServ error:', error.message);
    }
  } catch (error) {
    console.warn('Fallback delete tblDrugServ', error);
  }
  const list = getLocal<DrugServRecord>('tblDrugServ', []);
  setLocal('tblDrugServ', list.filter(r => r.id !== id));
};

// ==================== Master Data (tbldisname, tblcom, tbldrug) ====================
export const getMasterDiseases = async (): Promise<MasterDisease[]> => {
  try {
    const { data, error } = await supabase
      .from('tbldisname')
      .select('*')
      .order('dis', { ascending: true });

    if (!error && data && data.length > 0) {
      setLocal('tbldisname', data);
      return data as MasterDisease[];
    }
  } catch (e) {
    console.warn('Supabase getMasterDiseases notice:', e);
  }
  return getLocal('tbldisname', INITIAL_DISEASES.map((d, i) => ({ id: `dis_${i}`, dis: d })));
};

export const addMasterDisease = async (dis: string): Promise<void> => {
  try {
    await supabase.from('tbldisname').insert([{ dis }]);
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDiseases();
  setLocal('tbldisname', [...items, { id: `dis_${Date.now()}`, dis }]);
};

export const updateMasterDisease = async (id: string, dis: string): Promise<void> => {
  try {
    await supabase.from('tbldisname').update({ dis }).eq('id', id);
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDiseases();
  setLocal('tbldisname', items.map(x => x.id === id ? { ...x, dis } : x));
};

export const deleteMasterDisease = async (id: string): Promise<void> => {
  try {
    await supabase.from('tbldisname').delete().eq('id', id);
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDiseases();
  setLocal('tbldisname', items.filter(x => x.id !== id));
};

// Master Complications
export const getMasterComplications = async (): Promise<MasterComplication[]> => {
  try {
    const { data, error } = await supabase
      .from('tblcom')
      .select('*')
      .order('Complication', { ascending: true });

    if (!error && data && data.length > 0) {
      setLocal('tblcom', data);
      return data as MasterComplication[];
    }
  } catch (e) {
    console.warn('Supabase getMasterComplications notice:', e);
  }
  return getLocal('tblcom', INITIAL_COMPLICATIONS.map((c, i) => ({ id: `com_${i}`, Complication: c })));
};

export const addMasterComplication = async (Complication: string): Promise<void> => {
  try {
    await supabase.from('tblcom').insert([{ Complication }]);
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterComplications();
  setLocal('tblcom', [...items, { id: `com_${Date.now()}`, Complication }]);
};

export const updateMasterComplication = async (id: string, Complication: string): Promise<void> => {
  try {
    await supabase.from('tblcom').update({ Complication }).eq('id', id);
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterComplications();
  setLocal('tblcom', items.map(x => x.id === id ? { ...x, Complication } : x));
};

export const deleteMasterComplication = async (id: string): Promise<void> => {
  try {
    await supabase.from('tblcom').delete().eq('id', id);
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterComplications();
  setLocal('tblcom', items.filter(x => x.id !== id));
};

// Master Drugs
export const getMasterDrugs = async (): Promise<MasterDrug[]> => {
  try {
    const { data, error } = await supabase
      .from('tbldrug')
      .select('*')
      .order('drugname', { ascending: true });

    if (!error && data && data.length > 0) {
      setLocal('tbldrug', data);
      return data as MasterDrug[];
    }
  } catch (e) {
    console.warn('Supabase getMasterDrugs notice:', e);
  }
  return getLocal('tbldrug', INITIAL_DRUGS.map((dr, i) => ({ id: `drug_${i}`, drugname: dr })));
};

export const addMasterDrug = async (drugname: string): Promise<void> => {
  try {
    await supabase.from('tbldrug').insert([{ drugname }]);
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDrugs();
  setLocal('tbldrug', [...items, { id: `dr_${Date.now()}`, drugname }]);
};

export const updateMasterDrug = async (id: string, drugname: string): Promise<void> => {
  try {
    await supabase.from('tbldrug').update({ drugname }).eq('id', id);
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDrugs();
  setLocal('tbldrug', items.map(x => x.id === id ? { ...x, drugname } : x));
};

export const deleteMasterDrug = async (id: string): Promise<void> => {
  try {
    await supabase.from('tbldrug').delete().eq('id', id);
  } catch (e) {
    console.warn(e);
  }
  const items = await getMasterDrugs();
  setLocal('tbldrug', items.filter(x => x.id !== id));
};
