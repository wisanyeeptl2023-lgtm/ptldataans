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
  pct: 'CVT' | 'Dental' | 'ENT' | 'Eye' | 'Gen-surg' | 'Med' | 'Neuro' | 'Obs-Gyn' | 'Ortho' | 'ped' | 'plastic' | 'uro';
  tegnic: 'GA' | 'GA+EB' | 'GA+NB' | 'MAC' | 'NB' | 'SB' | 'SB+EB' | 'SB+NB' | 'TIVA' | 'NB+TIVA';
  Airway: 'ETT' | 'LMA' | 'Under mask' | 'Room air' | 'Mask c bag' | 'Tracheostomy' | 'Nasal Cannula';
  TimeOR: string; // ระยะเวลาผ่าตัด (นาที)
  CaseCode: 'Elective' | 'Elective นอกเวลา' | 'Emergency นอก' | 'Emergency ใน' | 'add on' | 'OPD' | 'Add on plus';
  disect: string; // อุณหภูมิร่างกาย (เช่น 36.5)
  PainIn: string; // 0 - 10
  PainOut: string; // 0 - 10
  TimePACU: string; // ระยะเวลาในห้องพักฟื้น (นาที)
  postopvisit: 'yes' | 'no' | 'D/C ก่อนเยี่ยม';
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
  riskroom: 'ห้องผ่าตัด' | 'ห้องพักฟื้น' | 'หอผู้ป่วย' | string;
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

export type SbarScoreOption = 'ปฏิบัติครบ' | 'ปฏิบัติไม่ครบ' | 'ไม่ปฏิบัติ' | 'NA';

export type AsaLevel = '1' | '2' | '3' | '4' | '5' | '6';

export interface SentwageRecord {
  id?: string;
  idwage: string; // รูปแบบ w-00000
  notedate: string; // วันที่ dd/mm/yyyy พ.ศ.
  hn: string; // HN ผู้ป่วย
  asa: AsaLevel | string; // ASA Physical Status ("1" - "6")
  
  // Situation
  s1: SbarScoreOption; // ชื่อ สกุล อายุ HN.
  s2: SbarScoreOption; // น้ำหนัก ส่วนสูง BMI
  s3: SbarScoreOption; // การวินิจฉัยโรค/การผ่าตัด
  s4: SbarScoreOption; // ประวัติการเจ็บป่วยปัจจุบัน
  s5: SbarScoreOption; // การยินยอมให้การรักษา

  // Background
  b1: SbarScoreOption; // ประวัติการดมยาและผ่าตัด
  b2: SbarScoreOption; // ประวัติการสูบบุหรี่ สารเสพติด/ดื่มแอลกอฮฮล์
  b3: SbarScoreOption; // ประวัติแพ้ยา/อาหาร/ยา/สมุนไพรที่ใช้เป็นประจำ
  b4: SbarScoreOption; // ประวัติการเจ็บป่วยในอดีต/โรคประจำตัวผู้ป่วยและครอบครัว
  b5: SbarScoreOption; // ระยะเวลา NPO
  b6: SbarScoreOption; // ประวัติการตั้งครรภ์
  b7: SbarScoreOption; // ยาเดิม

  // Assessment
  a1: SbarScoreOption; // ประเมินASA
  a2: SbarScoreOption; // ประเมินระบบต่างๆ
  a3: SbarScoreOption; // ประเมินผล LAB,X-ray,EKG,U/Sและอื่นๆ
  a4: SbarScoreOption; // ตาม Glide Line และส่วนประกอบของเลือด
  a5: SbarScoreOption; // V/S และอื่นๆ เช่น O2sat
  a6: SbarScoreOption; // การประเมิน Airway management
  a7: SbarScoreOption; // Anesthesia Plan

  // Recommendation
  r1: SbarScoreOption; // สรุปปัญหา/โรคประจำตัว และยาที่งด/ให้ต่อเนื่องจนถึงเข้าวันผ่าตัด
  r2: SbarScoreOption; // วางแผนการให้ยาระงับความรู้สึก
  r3: SbarScoreOption; // การติดตามอาการและผล LABที่ผิดปกติ
  r4: SbarScoreOption; // ประเมินความเสี่ยงสำคัญ เช่น difficult airway,risk aspirate เป็นต้น
  r5: SbarScoreOption; // การ Plan ICU
  r6: SbarScoreOption; // ข้อควรระวังอื่นๆ

  point: number; // คะแนนรวม
  percent: number; // ร้อยละ
  ect: string; // หมายเหตุ
  sentwage: string; // ผู้ส่งเวร (tbllogin AN status="y")
  ownercase: string; // เจ้าของcase (tbllogin AN status="y")
  createdAt?: string;
}
