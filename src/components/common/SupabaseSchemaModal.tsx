import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink, ShieldCheck, Table, Server } from 'lucide-react';
import { showSuccessAlert } from '../../utils/sweetalert';
import { SUPABASE_URL } from '../../supabase';

export const SupabaseSchemaModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- ==============================================================================
-- สคริปต์สร้างตารางฐานข้อมูล Supabase (PostgreSQL) สำหรับระบบงานวิสัญญี โรงพยาบาลพัทลุง
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

-- 6. ตาราง Master ข้อมูลพื้นฐาน
CREATE TABLE IF NOT EXISTS tbldisname (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dis TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tblcom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Complication" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tbldrug (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drugname TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) & Policies
ALTER TABLE tbllogin ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tblPateint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbldis ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tblOperation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tblDrugServ" ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbldisname ENABLE ROW LEVEL SECURITY;
ALTER TABLE tblcom ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbldrug ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all tbllogin" ON tbllogin FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tblPateint" ON "tblPateint" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tbldis" ON tbldis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tblOperation" ON "tblOperation" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tblDrugServ" ON "tblDrugServ" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tbldisname" ON tbldisname FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tblcom" ON tblcom FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all tbldrug" ON tbldrug FOR ALL USING (true) WITH CHECK (true);

-- Seed Initial Data
INSERT INTO tbllogin (username, password, "AN", status)
VALUES ('adisorn', '251108', 'นายอดิศร ชุมคช', 'y')
ON CONFLICT (username) DO NOTHING;

INSERT INTO tbldisname (dis) VALUES
('DM'), ('HT'), ('DLP'), ('Asthma'), ('COPD'), ('CKD'), ('CAD'), 
('Stroke'), ('Thyroid disease'), ('GERD'), ('Cirrhosis'), ('Epilepsy')
ON CONFLICT (dis) DO NOTHING;

INSERT INTO tblcom ("Complication") VALUES
('Difficult intubation'), ('Laryngospasm'), ('Bronchospasm'), ('Hypotension'),
('Hypertension'), ('Arrhythmia'), ('Desaturation (SpO2 < 90%)'), ('Hypothermia (< 35.5 C)'),
('Shivering'), ('PONV (คลื่นไส้อาเจียน)'), ('High spinal block'), ('Delayed emergence'),
('Dental injury'), ('Sore throat')
ON CONFLICT ("Complication") DO NOTHING;

INSERT INTO tbldrug (drugname) VALUES
('Propofol'), ('Fentanyl'), ('Morphine'), ('Pethidine'), ('Cisatracurium'),
('Rocuronium'), ('Succinylcholine'), ('Neostigmine'), ('Atropine'), ('Ephedrine'),
('Norepinephrine'), ('Nicardipine'), ('Ondansetron'), ('Dexamethasone'),
('Bupivacaine Heavy 0.5%'), ('Lidocaine 2%'), ('Tramadol'), ('Paracetamol IV')
ON CONFLICT (drugname) DO NOTHING;`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    showSuccessAlert('คัดลอกคำสั่ง SQL แล้ว', 'นำคำสั่งนี้ไป Run ใน Supabase SQL Editor ได้ทันที');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-emerald-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/60 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">โครงสร้างตาราง Supabase (SQL Schema)</h3>
              <p className="text-xs text-emerald-200">
                สคริปต์ SQL สำหรับสร้างตาราง, Primary Keys, RLS Policies และข้อมูลเริ่มต้น
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-700/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
              <Server className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-900 block">Supabase URL</span>
                <span className="text-[11px] font-mono text-emerald-800 break-all">{SUPABASE_URL}</span>
              </div>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-start gap-2.5">
              <Table className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-teal-900 block">จำนวนตารางทั้งหมด</span>
                <span className="text-xs text-teal-800">8 ตาราง (5 บริการ + 3 มาสเตอร์)</span>
              </div>
            </div>
            <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-cyan-900 block">ความปลอดภัย (RLS)</span>
                <span className="text-xs text-cyan-800">Row Level Security เปิดใช้งาน</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <Terminal className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>วิธีตั้งค่าใน Supabase:</strong> ไปที่หน้า Dashboard ของโปรเจกต์ Supabase &rarr; เมนู <strong>SQL Editor</strong> &rarr; กด <strong>New query</strong> &rarr; วางสคริปต์ด้านล่างนี้แล้วกดปุ่ม <strong>Run</strong> ระบบจะสร้างตารางและใส่ข้อมูลตั้งต้นทั้งหมดให้อัตโนมัติ
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                supabase_schema.sql
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'คัดลอกเรียบร้อย' : 'คัดลอก SQL ทั้งหมด'}
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800 shadow-inner leading-relaxed">
              {sqlScript}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href="https://supabase.com/dashboard/project/jrkrcfkivpfuvxihkshr/sql"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 hover:underline"
          >
            เปิด Supabase SQL Editor โดยตรง <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              คัดลอก SQL
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
