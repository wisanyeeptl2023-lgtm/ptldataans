import { supabase } from '../supabase';
import {
  UserLogin,
  PatientRecord,
  DiseaseRecord,
  ComplicationRecord,
  DrugServRecord,
  MasterDisease,
  MasterComplication,
  MasterDrug,
  SentwageRecord,
  AsaLevel
} from '../types';
import { convertIsoToBEDate, convertBEDateToIso, getTodayBEDate } from '../utils/dateUtils';

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

// ==================== tblsentwage (Shift Handover Tracking) ====================

const INITIAL_SENTWAGES: SentwageRecord[] = [];

export const getSentwages = async (): Promise<SentwageRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('tblsentwage')
      .select('*')
      .order('idwage', { ascending: false });

    if (!error && data) {
      const normalized: SentwageRecord[] = data.map((r: any) => ({
        id: r.id || r.idwage,
        idwage: r.idwage || '',
        notedate: r.notedate
          ? (r.notedate.includes('-') ? convertIsoToBEDate(r.notedate) : r.notedate)
          : getTodayBEDate(),
        hn: r.HN ?? r.hn ?? '',
        asa: (r.ASA ?? r.asa ?? '1') as AsaLevel,
        s1: r.s1 || 'ปฏิบัติครบ',
        s2: r.s2 || 'ปฏิบัติครบ',
        s3: r.s3 || 'ปฏิบัติครบ',
        s4: r.s4 || 'ปฏิบัติครบ',
        s5: r.s5 || 'ปฏิบัติครบ',
        b1: r.b1 || 'ปฏิบัติครบ',
        b2: r.b2 || 'ปฏิบัติครบ',
        b3: r.b3 || 'ปฏิบัติครบ',
        b4: r.b4 || 'ปฏิบัติครบ',
        b5: r.b5 || 'ปฏิบัติครบ',
        b6: r.b6 || 'ปฏิบัติครบ',
        b7: r.b7 || 'ปฏิบัติครบ',
        a1: r.a1 || 'ปฏิบัติครบ',
        a2: r.a2 || 'ปฏิบัติครบ',
        a3: r.a3 || 'ปฏิบัติครบ',
        a4: r.a4 || 'ปฏิบัติครบ',
        a5: r.a5 || 'ปฏิบัติครบ',
        a6: r.a6 || 'ปฏิบัติครบ',
        a7: r.a7 || 'ปฏิบัติครบ',
        r1: r.r1 || 'ปฏิบัติครบ',
        r2: r.r2 || 'ปฏิบัติครบ',
        r3: r.r3 || 'ปฏิบัติครบ',
        r4: r.r4 || 'ปฏิบัติครบ',
        r5: r.r5 || 'ปฏิบัติครบ',
        r6: r.r6 || 'ปฏิบัติครบ',
        point: Number(r.point ?? 0),
        percent: Number(r.percent ?? 0),
        ect: r.ect || '',
        sentwage: r.sentwage || '',
        ownercase: r.ownercase || '',
        createdAt: r.createdAt || (r.notedate ? new Date(r.notedate).toISOString() : new Date().toISOString())
      }));
      setLocal('tblsentwage', normalized);
      return normalized;
    }
    if (error) {
      console.error('Supabase getSentwages error:', error.message);
    }
  } catch (error) {
    console.error('Supabase fallback getSentwages:', error);
  }
  const localList = getLocal<SentwageRecord>('tblsentwage', INITIAL_SENTWAGES);
  return localList.map(r => ({
    ...r,
    hn: r.hn || '',
    asa: (r.asa || '1') as AsaLevel
  }));
};

export const getNextIdWage = async (): Promise<string> => {
  try {
    const items = await getSentwages();
    let maxNum = 0;
    for (const item of items) {
      if (item.idwage) {
        const match = item.idwage.match(/w-(\d+)/i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
    const nextNum = maxNum + 1;
    return `w-${String(nextNum).padStart(5, '0')}`;
  } catch {
    return 'w-00001';
  }
};

export const addSentwage = async (record: Omit<SentwageRecord, 'id'>): Promise<SentwageRecord> => {
  const finalIdWage = record.idwage && record.idwage.trim().length > 0
    ? record.idwage
    : await getNextIdWage();

  // Convert Buddhist Era DD/MM/YYYY to ISO YYYY-MM-DD for PostgreSQL DATE column
  const isoDate = record.notedate && record.notedate.includes('/')
    ? convertBEDateToIso(record.notedate)
    : record.notedate;

  // Build Supabase payload - user table uses "HN" and "ASA" (uppercase) and idwage as key
  const payload: Record<string, any> = {
    idwage: finalIdWage,
    notedate: isoDate,
    HN: record.hn || '',
    ASA: String(record.asa || '1'),
    s1: record.s1 || 'ปฏิบัติครบ',
    s2: record.s2 || 'ปฏิบัติครบ',
    s3: record.s3 || 'ปฏิบัติครบ',
    s4: record.s4 || 'ปฏิบัติครบ',
    s5: record.s5 || 'ปฏิบัติครบ',
    b1: record.b1 || 'ปฏิบัติครบ',
    b2: record.b2 || 'ปฏิบัติครบ',
    b3: record.b3 || 'ปฏิบัติครบ',
    b4: record.b4 || 'ปฏิบัติครบ',
    b5: record.b5 || 'ปฏิบัติครบ',
    b6: record.b6 || 'ปฏิบัติครบ',
    b7: record.b7 || 'ปฏิบัติครบ',
    a1: record.a1 || 'ปฏิบัติครบ',
    a2: record.a2 || 'ปฏิบัติครบ',
    a3: record.a3 || 'ปฏิบัติครบ',
    a4: record.a4 || 'ปฏิบัติครบ',
    a5: record.a5 || 'ปฏิบัติครบ',
    a6: record.a6 || 'ปฏิบัติครบ',
    a7: record.a7 || 'ปฏิบัติครบ',
    r1: record.r1 || 'ปฏิบัติครบ',
    r2: record.r2 || 'ปฏิบัติครบ',
    r3: record.r3 || 'ปฏิบัติครบ',
    r4: record.r4 || 'ปฏิบัติครบ',
    r5: record.r5 || 'ปฏิบัติครบ',
    r6: record.r6 || 'ปฏิบัติครบ',
    point: Number(record.point ?? 0),
    percent: Number(record.percent ?? 0),
    ect: record.ect || '',
    sentwage: record.sentwage || '',
    ownercase: record.ownercase || ''
  };

  let { data, error } = await supabase
    .from('tblsentwage')
    .insert([payload])
    .select('*')
    .single();

  // If column error with uppercase HN/ASA, fallback to lowercase hn/asa
  if (error && (error.code === 'PGRST204' || error.message?.includes('HN') || error.message?.includes('ASA'))) {
    const fallbackPayload: Record<string, any> = { ...payload, hn: payload.HN, asa: payload.ASA };
    delete fallbackPayload.HN;
    delete fallbackPayload.ASA;
    const retry = await supabase
      .from('tblsentwage')
      .insert([fallbackPayload])
      .select('*')
      .single();
    if (!retry.error && retry.data) {
      data = retry.data;
      error = null;
    }
  }

  // If Supabase failed to insert, throw descriptive error so UI notifies the user immediately!
  if (error || !data) {
    const errText = error ? `${error.message}${error.hint ? ' (' + error.hint + ')' : ''}` : 'ไม่พบข้อมูลตอบกลับจากเซิร์ฟเวอร์';
    console.error('Supabase addSentwage error:', error);
    throw new Error(`ไม่สามารถบันทึกลงตาราง tblsentwage ได้: ${errText}`);
  }

  const created: SentwageRecord = {
    id: data.id || data.idwage,
    idwage: data.idwage,
    notedate: record.notedate,
    hn: data.HN ?? data.hn ?? record.hn,
    asa: (data.ASA ?? data.asa ?? record.asa) as AsaLevel,
    s1: data.s1,
    s2: data.s2,
    s3: data.s3,
    s4: data.s4,
    s5: data.s5,
    b1: data.b1,
    b2: data.b2,
    b3: data.b3,
    b4: data.b4,
    b5: data.b5,
    b6: data.b6,
    b7: data.b7,
    a1: data.a1,
    a2: data.a2,
    a3: data.a3,
    a4: data.a4,
    a5: data.a5,
    a6: data.a6,
    a7: data.a7,
    r1: data.r1,
    r2: data.r2,
    r3: data.r3,
    r4: data.r4,
    r5: data.r5,
    r6: data.r6,
    point: Number(data.point ?? record.point),
    percent: Number(data.percent ?? record.percent),
    ect: data.ect ?? record.ect,
    sentwage: data.sentwage ?? record.sentwage,
    ownercase: data.ownercase ?? record.ownercase
  };

  const cached = getLocal<SentwageRecord>('tblsentwage', []);
  setLocal('tblsentwage', [created, ...cached.filter(x => x.idwage !== created.idwage)]);
  return created;
};

export const updateSentwage = async (idOrIdwage: string, updates: Partial<SentwageRecord>): Promise<void> => {
  const targetIdwage = updates.idwage || idOrIdwage;

  // Convert BE date to ISO format if present
  const isoDate = updates.notedate && updates.notedate.includes('/')
    ? convertBEDateToIso(updates.notedate)
    : updates.notedate;

  const payload: Record<string, any> = {};
  if (updates.idwage !== undefined) payload.idwage = updates.idwage;
  if (isoDate !== undefined) payload.notedate = isoDate;
  if (updates.hn !== undefined) payload.HN = updates.hn;
  if (updates.asa !== undefined) payload.ASA = String(updates.asa);

  const keys: (keyof SentwageRecord)[] = [
    's1', 's2', 's3', 's4', 's5',
    'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7',
    'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
    'r1', 'r2', 'r3', 'r4', 'r5', 'r6'
  ];
  for (const k of keys) {
    if (updates[k] !== undefined) {
      payload[k] = updates[k];
    }
  }

  if (updates.point !== undefined) payload.point = Number(updates.point);
  if (updates.percent !== undefined) payload.percent = Number(updates.percent);
  if (updates.ect !== undefined) payload.ect = updates.ect;
  if (updates.sentwage !== undefined) payload.sentwage = updates.sentwage;
  if (updates.ownercase !== undefined) payload.ownercase = updates.ownercase;

  let { error } = await supabase
    .from('tblsentwage')
    .update(payload)
    .eq('idwage', targetIdwage);

  if (error && (error.code === 'PGRST204' || error.message?.includes('HN') || error.message?.includes('ASA'))) {
    const fallbackPayload = { ...payload };
    if (fallbackPayload.HN !== undefined) {
      fallbackPayload.hn = fallbackPayload.HN;
      delete fallbackPayload.HN;
    }
    if (fallbackPayload.ASA !== undefined) {
      fallbackPayload.asa = fallbackPayload.ASA;
      delete fallbackPayload.ASA;
    }
    const retry = await supabase
      .from('tblsentwage')
      .update(fallbackPayload)
      .eq('idwage', targetIdwage);
    error = retry.error;
  }

  if (error) {
    console.error('Supabase updateSentwage error:', error);
    throw new Error(`ไม่สามารถอัปเดตข้อมูลลงตาราง tblsentwage ได้: ${error.message || error.details || 'รหัส ' + error.code}`);
  }

  const items = getLocal<SentwageRecord>('tblsentwage', []);
  setLocal('tblsentwage', items.map(x => (x.idwage === targetIdwage || x.id === idOrIdwage) ? { ...x, ...updates } : x));
};

export const deleteSentwage = async (idOrIdwage: string): Promise<void> => {
  const { error } = await supabase
    .from('tblsentwage')
    .delete()
    .eq('idwage', idOrIdwage);

  if (error) {
    console.error('Supabase deleteSentwage error:', error);
    throw new Error(`ไม่สามารถลบข้อมูลจากตาราง tblsentwage ได้: ${error.message || error.details || 'รหัส ' + error.code}`);
  }

  const items = getLocal<SentwageRecord>('tblsentwage', []);
  setLocal('tblsentwage', items.filter(x => x.idwage !== idOrIdwage && x.id !== idOrIdwage));
};
