-- ==============================================================================
-- สคริปต์สร้างตารางฐานข้อมูล Supabase (PostgreSQL) สำหรับระบบงานวิสัญญี โรงพยาบาลพัทลุง
-- คัดลอกสคริปต์นี้ไปวางและ Run ใน Supabase SQL Editor ได้ทันที
-- ==============================================================================

-- 1. ตาราง tbllogin (บัญชีผู้ใช้งานระบบวิสัญญี)
CREATE TABLE IF NOT EXISTS tbllogin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    "AN" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 's' CHECK (status IN ('y', 'n', 's')),
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตาราง tblPateint (ทะเบียนผู้ป่วยและข้อมูลระงับความรู้สึก)
CREATE TABLE IF NOT EXISTS "tblPateint" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hn TEXT NOT NULL,
    operdate TEXT NOT NULL,
    no TEXT NOT NULL,
    nocase TEXT DEFAULT '',
    sex TEXT NOT NULL,
    age TEXT NOT NULL,
    "ASA" TEXT NOT NULL,
    pct TEXT NOT NULL, -- เช่น 'CVT', 'Dental', 'ENT', 'Eye', 'Gen-surg', 'Med', 'Neuro', 'Obs-Gyn', 'Ortho', 'ped', 'plastic', 'uro'
    tegnic TEXT NOT NULL, -- เช่น 'GA', 'GA+EB', 'GA+NB', 'MAC', 'NB', 'SB', 'SB+EB', 'SB+NB', 'TIVA', 'NB+TIVA'
    "Airway" TEXT NOT NULL, -- เช่น 'ETT', 'LMA', 'Under mask', 'Room air', 'Mask c bag', 'Tracheostomy', 'Nasal Cannula'
    "TimeOR" TEXT DEFAULT '0',
    "CaseCode" TEXT NOT NULL, -- เช่น 'Elective', 'Elective นอกเวลา', 'Emergency นอก', 'Emergency ใน', 'add on', 'OPD', 'Add on plus'
    disect TEXT DEFAULT '',
    "PainIn" TEXT DEFAULT '0',
    "PainOut" TEXT DEFAULT '0',
    "TimePACU" TEXT DEFAULT '0',
    postopvisit TEXT NOT NULL DEFAULT 'no', -- เช่น 'no', 'yes', 'D/C ก่อนเยี่ยม'
    "AN" TEXT NOT NULL,
    chknote TEXT NOT NULL,
    idpat TEXT NOT NULL,
    "โรคประจำตัว" TEXT DEFAULT '',
    "DM" TEXT DEFAULT '',
    "HT" TEXT DEFAULT '',
    "Asthma" TEXT DEFAULT '',
    "Neuro" TEXT DEFAULT '',
    cs TEXT DEFAULT '',
    "SHI" TEXT DEFAULT '',
    "MultipleTrauma" TEXT DEFAULT '',
    "Sepsis" TEXT DEFAULT '',
    "MRM" TEXT DEFAULT '',
    "Appendicitis" TEXT DEFAULT '',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตาราง tbldis (บันทึกโรคประจำตัวของผู้ป่วยแต่ละราย)
CREATE TABLE IF NOT EXISTS tbldis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iddis TEXT NOT NULL,
    idpat TEXT NOT NULL,
    hn TEXT NOT NULL,
    operdate TEXT NOT NULL,
    dis TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตาราง tblOperation (บันทึกภาวะแทรกซ้อน / Complication)
CREATE TABLE IF NOT EXISTS "tblOperation" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idoper TEXT NOT NULL,
    idpat TEXT NOT NULL,
    "Complication" TEXT NOT NULL,
    riskroom TEXT NOT NULL,
    hn TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตาราง tblDrugServ (บันทึกการใช้ยา)
CREATE TABLE IF NOT EXISTS "tblDrugServ" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iddrugserv TEXT NOT NULL,
    idoper TEXT NOT NULL,
    riskroom TEXT NOT NULL,
    drugname TEXT NOT NULL,
    hn TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตาราง tblsentwage (ติดตามการส่งเวร SBAR)
CREATE TABLE IF NOT EXISTS tblsentwage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idwage TEXT NOT NULL,
    notedate TEXT NOT NULL,
    hn TEXT DEFAULT '',
    asa TEXT DEFAULT '1',
    -- Suitiation
    s1 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    s2 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    s3 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    s4 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    s5 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    -- Background
    b1 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    b2 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    b3 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    b4 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    b5 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    b6 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    b7 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    -- Assessment
    a1 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    a2 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    a3 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    a4 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    a5 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    a6 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    a7 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    -- Recommendation
    r1 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    r2 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    r3 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    r4 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    r5 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    r6 TEXT NOT NULL DEFAULT 'ปฏิบัติครบ',
    -- Calculation and Metadata
    point NUMERIC NOT NULL DEFAULT 50,
    percent NUMERIC NOT NULL DEFAULT 100,
    ect TEXT DEFAULT '',
    sentwage TEXT NOT NULL,
    ownercase TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration columns for existing tblsentwage tables if already created
ALTER TABLE tblsentwage ADD COLUMN IF NOT EXISTS "HN" TEXT DEFAULT '';
ALTER TABLE tblsentwage ADD COLUMN IF NOT EXISTS "ASA" TEXT DEFAULT '1';
ALTER TABLE tblsentwage ADD COLUMN IF NOT EXISTS hn TEXT DEFAULT '';
ALTER TABLE tblsentwage ADD COLUMN IF NOT EXISTS asa TEXT DEFAULT '1';

-- 7. ตาราง Master ข้อมูลพื้นฐาน
-- 7.1 ตาราง tbldisname (มาสเตอร์รายการโรคประจำตัว)
CREATE TABLE IF NOT EXISTS tbldisname (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dis TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7.2 ตาราง tblcom (มาสเตอร์รายการภาวะแทรกซ้อน)
CREATE TABLE IF NOT EXISTS tblcom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Complication" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7.3 ตาราง tbldrug (มาสเตอร์รายการยา)
CREATE TABLE IF NOT EXISTS tbldrug (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drugname TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- กำหนด Row Level Security (RLS) เพื่ออนุญาตให้ใช้งานผ่าน anon / publishable key ได้
-- ==============================================================================
ALTER TABLE tbllogin ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tblPateint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbldis ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tblOperation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tblDrugServ" ENABLE ROW LEVEL SECURITY;
ALTER TABLE tblsentwage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbldisname ENABLE ROW LEVEL SECURITY;
ALTER TABLE tblcom ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbldrug ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read tbllogin" ON tbllogin FOR SELECT USING (true);
CREATE POLICY "Allow anon insert tbllogin" ON tbllogin FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update tbllogin" ON tbllogin FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete tbllogin" ON tbllogin FOR DELETE USING (true);

CREATE POLICY "Allow anon all tblPateint" ON "tblPateint" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tbldis" ON tbldis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tblOperation" ON "tblOperation" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tblDrugServ" ON "tblDrugServ" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tblsentwage" ON tblsentwage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tbldisname" ON tbldisname FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tblcom" ON tblcom FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tbldrug" ON tbldrug FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- ข้อมูลเริ่มต้น (Seed Initial Data)
-- ==============================================================================
-- ผู้ดูแลระบบเริ่มต้น (admin)
INSERT INTO tbllogin (username, password, "AN", status)
VALUES ('adisorn', '251108', 'นายอดิศร ชุมคช', 'y')
ON CONFLICT (username) DO NOTHING;

-- รายการโรคประจำตัวเริ่มต้น
INSERT INTO tbldisname (dis) VALUES
('DM'), ('HT'), ('DLP'), ('Asthma'), ('COPD'), ('CKD'), ('CAD'), 
('Stroke'), ('Thyroid disease'), ('GERD'), ('Cirrhosis'), ('Epilepsy')
ON CONFLICT (dis) DO NOTHING;

-- รายการ Complication เริ่มต้น
INSERT INTO tblcom ("Complication") VALUES
('Difficult intubation'), ('Laryngospasm'), ('Bronchospasm'), ('Hypotension'),
('Hypertension'), ('Arrhythmia'), ('Desaturation (SpO2 < 90%)'), ('Hypothermia (< 35.5 C)'),
('Shivering'), ('PONV (คลื่นไส้อาเจียน)'), ('High spinal block'), ('Delayed emergence'),
('Dental injury'), ('Sore throat')
ON CONFLICT ("Complication") DO NOTHING;

-- รายการยาเริ่มต้น
INSERT INTO tbldrug (drugname) VALUES
('Propofol'), ('Fentanyl'), ('Morphine'), ('Pethidine'), ('Cisatracurium'),
('Rocuronium'), ('Succinylcholine'), ('Neostigmine'), ('Atropine'), ('Ephedrine'),
('Norepinephrine'), ('Nicardipine'), ('Ondansetron'), ('Dexamethasone'),
('Bupivacaine Heavy 0.5%'), ('Lidocaine 2%'), ('Tramadol'), ('Paracetamol IV')
ON CONFLICT (drugname) DO NOTHING;
