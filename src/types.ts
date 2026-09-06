export interface UserLogin {
  id?: string;
  username: string;
  password?: string;
  AN: string; // ชื่อ-นามสกุล
  status: 'y' | 'n' | 's'; // 'y' = approved, 'n' = disabled, 's' = pending
  createdAt?: string;
}

export interface PatientRecord {
  id?: string;
  hn: string;
  operdate: string; // dd/mm/yyyy พุทธศักราช (e.g. 06/09/2569)
  no: string; // ครั้งที่
  nocase: string; // ใบที่
  sex: 'ชาย' | 'หญิง';
  age: string; // อายุ
  ASA: '1' | '1E' | '2' | '2E' | '3' | '3E' | '4' | '4E' | '5' | '5E' | '6' | '6E';
  pct: 'CVT' | 'Dental' | 'ENT' | 'Eye' | 'Gen' | 'Neuro' | 'Obs-Gyn' | 'Ortho' | 'ped' | 'plastic' | 'uro';
  tegnic: 'EB' | 'GA' | 'GA+EB' | 'MAC' | 'NB' | 'SB' | 'SB+GA' | 'SB+EB' | 'SB+NB' | 'TIVA' | 'NB+TIVA';
  Airway: 'ETT' | 'LMA' | 'Mask' | 'Mask c bag' | 'Tracheostomy' | 'Nasal Cannula';
  TimeOR: string; // ระยะเวลาผ่าตัด (นาที)
  CaseCode: 'Elective' | 'Elective นอกเวลา' | 'Emergency นอก' | 'Emergency ใน' | 'add on';
  disect: string; // อุณหภูมิร่างกาย (เช่น 36.5)
  PainIn: string; // 0 - 10
  PainOut: string; // 0 - 10
  TimePACU: string; // ระยะเวลาในห้องพักฟื้น (นาที)
  postopvisit: 'yes' | 'no';
  AN: string; // ชื่อพยาบาลดมยา
  chknote: string; // ชื่อผู้บันทึกข้อมูล (นำมาจาก tbllogin คอลัมน์ AN ของผู้ล็อกอิน)
  idpat: string; // คำนวณ hn & ":" & operdate & ":" & no
  // Hidden optional disease columns
  โรคประจำตัว?: string;
  DM?: string;
  HT?: string;
  Asthma?: string;
  Neuro?: string;
  cs?: string;
  SHI?: string;
  MultipleTrauma?: string;
  Sepsis?: string;
  MRM?: string;
  Appendicitis?: string;
  createdAt?: string;
}

export interface DiseaseRecord {
  id?: string;
  iddis: string; // อัตโนมัติ ซ่อน
  idpat: string; // ดึงจาก tblPateint column idpat
  hn: string; // ค้นหาจาก tblPateint
  operdate: string; // ดึงจาก tblPateint column operdate แสดงผลเป็น พุทธศักราช
  dis: string; // โรคประจำตัว ดึงจาก tbldisname
  createdAt?: string;
}

export interface ComplicationRecord {
  id?: string;
  idoper: string; // รูปแบบ yyyyMMDDHHmmss
  idpat: string; // ดึงจาก tblPateint
  Complication: string; // ดึงจาก tblcom
  riskroom: 'ห้องผ่าตัด' | 'ห้องพักฟื้น';
  hn: string; // ค้นหาจาก tblPateint
  createdAt?: string;
}

export interface DrugServRecord {
  id?: string;
  iddrugserv: string; // รูปแบบ d-yyyyMMHHmmss
  idoper: string; // ดึงจาก tblOperation
  riskroom: string; // ดึงจาก tblOperation
  drugname: string; // ดึงจาก tbldrug
  hn: string; // ค้นหาจาก tblOperation
  createdAt?: string;
}

export interface MasterDisease {
  id?: string;
  dis: string;
}

export interface MasterComplication {
  id?: string;
  Complication: string;
}

export interface MasterDrug {
  id?: string;
  drugname: string;
}
