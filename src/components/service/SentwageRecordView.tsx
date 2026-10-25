import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Calendar,
  UserCheck,
  AlertCircle,
  FileText,
  Award,
  CheckCheck,
  X
} from 'lucide-react';
import { SentwageRecord, SbarScoreOption, UserLogin, PatientRecord, AsaLevel } from '../../types';
import {
  getSentwages,
  addSentwage,
  updateSentwage,
  deleteSentwage,
  getUsers,
  getNextIdWage,
  getPatients
} from '../../services/db';
import { getTodayBEDate } from '../../utils/dateUtils';
import { BEDatePicker } from '../common/BEDatePicker';
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
  showLoadingAlert,
  closeAlert
} from '../../utils/sweetalert';

// 25 items definitions with labels and sections
export interface SbarItemDef {
  key: keyof SentwageRecord;
  label: string;
  section: 'Suitiation' | 'Background' | 'Assessment' | 'Recommendation';
}

export const SBAR_ITEMS: SbarItemDef[] = [
  // Suitiation
  { key: 's1', label: 'ชื่อ สกุล อายุ HN.', section: 'Suitiation' },
  { key: 's2', label: 'น้ำหนัก ส่วนสูง BMI', section: 'Suitiation' },
  { key: 's3', label: 'การวินิจฉัยโรค/การผ่าตัด', section: 'Suitiation' },
  { key: 's4', label: 'ประวัติการเจ็บป่วยปัจจุบัน', section: 'Suitiation' },
  { key: 's5', label: 'การยินยอมให้การรักษา', section: 'Suitiation' },

  // Background
  { key: 'b1', label: 'ประวัติการดมยาและผ่าตัด', section: 'Background' },
  { key: 'b2', label: 'ประวัติการสูบบุหรี่ สารเสพติด/ดื่มแอลกอฮฮล์', section: 'Background' },
  { key: 'b3', label: 'ประวัติแพ้ยา/อาหาร/ยา/สมุนไพรที่ใช้เป็นประจำ', section: 'Background' },
  { key: 'b4', label: 'ประวัติการเจ็บป่วยในอดีต/โรคประจำตัวผู้ป่วยและครอบครัว', section: 'Background' },
  { key: 'b5', label: 'ระยะเวลา NPO', section: 'Background' },
  { key: 'b6', label: 'ประวัติการตั้งครรภ์', section: 'Background' },
  { key: 'b7', label: 'ยาเดิม', section: 'Background' },

  // Assessment
  { key: 'a1', label: 'ประเมินASA', section: 'Assessment' },
  { key: 'a2', label: 'ประเมินระบบต่างๆ', section: 'Assessment' },
  { key: 'a3', label: 'ประเมินผล LAB,X-ray,EKG,U/Sและอื่นๆ', section: 'Assessment' },
  { key: 'a4', label: 'ตาม Glide Line และส่วนประกอบของเลือด', section: 'Assessment' },
  { key: 'a5', label: 'V/S และอื่นๆ เช่น O2sat', section: 'Assessment' },
  { key: 'a6', label: 'การประเมิน Airway management', section: 'Assessment' },
  { key: 'a7', label: 'Anesthesia Plan', section: 'Assessment' },

  // Recommendation
  { key: 'r1', label: 'สรุปปัญหา/โรคประจำตัว และยาที่งด/ให้ต่อเนื่องจนถึงเข้าวันผ่าตัด', section: 'Recommendation' },
  { key: 'r2', label: 'วางแผนการให้ยาระงับความรู้สึก', section: 'Recommendation' },
  { key: 'r3', label: 'การติดตามอาการและผล LABที่ผิดปกติ', section: 'Recommendation' },
  { key: 'r4', label: 'ประเมินความเสี่ยงสำคัญ เช่น difficult airway,risk aspirate เป็นต้น', section: 'Recommendation' },
  { key: 'r5', label: 'การ Plan ICU', section: 'Recommendation' },
  { key: 'r6', label: 'ข้อควรระวังอื่นๆ', section: 'Recommendation' }
];

const SCORE_MAP: Record<SbarScoreOption, number> = {
  'ปฏิบัติครบ': 2,
  'ปฏิบัติไม่ครบ': 1,
  'ไม่ปฏิบัติ': 0,
  'NA': 0
};

export const calculateSbarScore = (record: Partial<SentwageRecord>): { point: number; percent: number; maxPoints: number; naCount: number } => {
  let point = 0;
  let nonNaCount = 0;
  let naCount = 0;

  SBAR_ITEMS.forEach(item => {
    const val = (record[item.key] as SbarScoreOption) || 'ปฏิบัติครบ';
    if (val === 'NA') {
      naCount += 1;
    } else {
      nonNaCount += 1;
      point += SCORE_MAP[val] ?? 0;
    }
  });

  const maxPoints = nonNaCount * 2;
  const percent = maxPoints > 0 ? Number(((point / maxPoints) * 100).toFixed(2)) : 0;

  return { point, percent, maxPoints, naCount };
};

const getDefaultSbarValues = (): Record<string, SbarScoreOption> => {
  const vals: Record<string, SbarScoreOption> = {};
  SBAR_ITEMS.forEach(item => {
    vals[item.key] = 'ปฏิบัติครบ';
  });
  return vals;
};

export const SentwageRecordView: React.FC = () => {
  const [records, setRecords] = useState<SentwageRecord[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserLogin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [nextPreviewId, setNextPreviewId] = useState<string>('w-00001');

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [idwage, setIdwage] = useState<string>('');
  const [notedate, setNotedate] = useState<string>(getTodayBEDate());
  const [hn, setHn] = useState<string>('');
  const [asa, setAsa] = useState<string>('1');
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [sbarValues, setSbarValues] = useState<Record<string, SbarScoreOption>>(getDefaultSbarValues());
  const [ect, setEct] = useState<string>('');
  const [sentwage, setSentwage] = useState<string>('');
  const [ownercase, setOwnercase] = useState<string>('');

  // Table search & filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // SBAR active tab for compact switching on mobile
  const [activeSbarSection, setActiveSbarSection] = useState<'All' | 'Suitiation' | 'Background' | 'Assessment' | 'Recommendation'>('All');

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, users, nextId, pts] = await Promise.all([
        getSentwages(),
        getUsers(),
        getNextIdWage(),
        getPatients()
      ]);
      setRecords(list);
      setPatients(pts);
      // Filter users with status = 'y'
      const validUsers = users.filter(u => u.status === 'y');
      setActiveUsers(validUsers);
      setNextPreviewId(nextId);

      // Default sentwage and ownercase to first active user if empty
      if (validUsers.length > 0) {
        if (!sentwage) setSentwage(validUsers[0].AN);
        if (!ownercase) setOwnercase(validUsers[0].AN);
      }
    } catch (err) {
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live point & percent
  const { point, percent, maxPoints, naCount } = useMemo(() => {
    return calculateSbarScore(sbarValues as Partial<SentwageRecord>);
  }, [sbarValues]);

  const handleSbarChange = (key: string, value: SbarScoreOption) => {
    setSbarValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSetAllComplete = () => {
    const allComplete: Record<string, SbarScoreOption> = {};
    SBAR_ITEMS.forEach(item => {
      allComplete[item.key] = 'ปฏิบัติครบ';
    });
    setSbarValues(allComplete);
  };

  const resetForm = async () => {
    setEditingId(null);
    setIdwage('');
    setNotedate(getTodayBEDate());
    setHn('');
    setAsa('1');
    setSbarValues(getDefaultSbarValues());
    setEct('');
    const nextId = await getNextIdWage();
    setNextPreviewId(nextId);
    if (activeUsers.length > 0) {
      setSentwage(activeUsers[0].AN);
      setOwnercase(activeUsers[0].AN);
    }
  };

  const handleStartEdit = (item: SentwageRecord) => {
    const targetKey = item.idwage || item.id || null;
    setEditingId(targetKey);
    setIdwage(item.idwage);
    setNotedate(item.notedate || getTodayBEDate());
    setHn(item.hn || '');
    setAsa(item.asa || '1');
    setEct(item.ect || '');
    setSentwage(item.sentwage || (activeUsers[0]?.AN ?? ''));
    setOwnercase(item.ownercase || (activeUsers[0]?.AN ?? ''));

    const vals: Record<string, SbarScoreOption> = {};
    SBAR_ITEMS.forEach(it => {
      vals[it.key] = (item[it.key] as SbarScoreOption) || 'ปฏิบัติครบ';
    });
    setSbarValues(vals);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notedate.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุวันที่บันทึก (พ.ศ.)');
      return;
    }

    if (!sentwage.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกผู้ส่งเวร');
      return;
    }

    if (!ownercase.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกเจ้าของ Case');
      return;
    }

    showLoadingAlert('กำลังบันทึกข้อมูล...', 'กรุณารอสักครู่ ระบบกำลังจัดเก็บข้อมูลติดตามการส่งเวรลง Supabase');

    try {
      const payload: Omit<SentwageRecord, 'id'> = {
        idwage: editingId ? idwage : '',
        notedate,
        hn: hn.trim(),
        asa: (asa || '1') as AsaLevel,
        // Situation
        s1: sbarValues.s1 || 'ปฏิบัติครบ',
        s2: sbarValues.s2 || 'ปฏิบัติครบ',
        s3: sbarValues.s3 || 'ปฏิบัติครบ',
        s4: sbarValues.s4 || 'ปฏิบัติครบ',
        s5: sbarValues.s5 || 'ปฏิบัติครบ',
        // Background
        b1: sbarValues.b1 || 'ปฏิบัติครบ',
        b2: sbarValues.b2 || 'ปฏิบัติครบ',
        b3: sbarValues.b3 || 'ปฏิบัติครบ',
        b4: sbarValues.b4 || 'ปฏิบัติครบ',
        b5: sbarValues.b5 || 'ปฏิบัติครบ',
        b6: sbarValues.b6 || 'ปฏิบัติครบ',
        b7: sbarValues.b7 || 'ปฏิบัติครบ',
        // Assessment
        a1: sbarValues.a1 || 'ปฏิบัติครบ',
        a2: sbarValues.a2 || 'ปฏิบัติครบ',
        a3: sbarValues.a3 || 'ปฏิบัติครบ',
        a4: sbarValues.a4 || 'ปฏิบัติครบ',
        a5: sbarValues.a5 || 'ปฏิบัติครบ',
        a6: sbarValues.a6 || 'ปฏิบัติครบ',
        a7: sbarValues.a7 || 'ปฏิบัติครบ',
        // Recommendation
        r1: sbarValues.r1 || 'ปฏิบัติครบ',
        r2: sbarValues.r2 || 'ปฏิบัติครบ',
        r3: sbarValues.r3 || 'ปฏิบัติครบ',
        r4: sbarValues.r4 || 'ปฏิบัติครบ',
        r5: sbarValues.r5 || 'ปฏิบัติครบ',
        r6: sbarValues.r6 || 'ปฏิบัติครบ',
        // Calculated fields
        point,
        percent,
        ect: ect.trim(),
        sentwage,
        ownercase
      };

      if (editingId) {
        await updateSentwage(editingId, payload);
        closeAlert();
        await showSuccessAlert(
          'บันทึกข้อมูลเรียบร้อย',
          `แก้ไขข้อมูลติดตามการส่งเวรรหัส ${idwage} สำเร็จ\nHN: ${hn || '-'} | ASA: ${asa} (คะแนน: ${point}/${maxPoints}, ร้อยละ: ${percent}%)`
        );
      } else {
        const created = await addSentwage(payload);
        closeAlert();
        await showSuccessAlert(
          'บันทึกข้อมูลเรียบร้อย',
          `รหัสการส่งเวร: ${created.idwage}\nHN: ${created.hn || '-'} | ASA: ${created.asa || '-'}\nคะแนน: ${created.point}/${maxPoints} (ร้อยละ ${created.percent}%)`
        );
      }

      await loadData();
      await resetForm();
    } catch (err: any) {
      closeAlert();
      console.error('Submit sentwage error:', err);
      showErrorAlert(
        'ไม่สามารถบันทึกได้',
        err?.message || 'ไม่สามารถบันทึกข้อมูลลงตาราง tblsentwage ใน Supabase ได้ กรุณาตรวจสอบการเชื่อมต่อ'
      );
    }
  };

  const handleDelete = async (item: SentwageRecord) => {
    const key = item.idwage || item.id;
    if (!key) return;

    const confirmed = await showConfirmDialog(
      'ยืนยันการลบข้อมูล?',
      `ต้องการลบรายการส่งเวรรหัส "${item.idwage}" วันที่ ${item.notedate} ใช่หรือไม่?`,
      'ตกลง',
      'ยกเลิก'
    );

    if (confirmed) {
      try {
        await deleteSentwage(key);
        await showSuccessAlert('ลบข้อมูลสำเร็จ', `ลบรายการรหัส ${item.idwage} เรียบร้อยแล้ว`);
        await loadData();
        if (editingId === key || editingId === item.idwage) {
          resetForm();
        }
      } catch (err: any) {
        console.error('Delete sentwage error:', err);
        showErrorAlert('ไม่สามารถลบข้อมูลได้', err?.message || 'ไม่สามารถลบข้อมูลจากฐานข้อมูล Supabase ได้');
      }
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch =
        !searchQuery.trim() ||
        (r.idwage && r.idwage.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.hn && r.hn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.asa && r.asa.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.sentwage && r.sentwage.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.ownercase && r.ownercase.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.ect && r.ect.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDate = !filterDate.trim() || r.notedate === filterDate;

      return matchSearch && matchDate;
    });
  }, [records, searchQuery, filterDate]);

  const sections: Array<{ id: 'Suitiation' | 'Background' | 'Assessment' | 'Recommendation'; label: string; sub: string }> = [
    { id: 'Suitiation', label: 'Suitiation (สถานการณ์)', sub: 'ข้อมูลเบื้องต้นและตัวตนผู้ป่วย' },
    { id: 'Background', label: 'Background (ภูมิหลัง/ประวัติ)', sub: 'ประวัติดมยา ประวัติเจ็บป่วย ยาเดิม และ NPO' },
    { id: 'Assessment', label: 'Assessment (การประเมินสภาพ)', sub: 'การประเมินระบบ ASA ผลตรวจ ทางเดินหายใจ และแผน' },
    { id: 'Recommendation', label: 'Recommendation (ข้อเสนอแนะ)', sub: 'แผนระงับความรู้สึก การเฝ้าระวัง และความเสี่ยง' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-700/60 backdrop-blur-xs rounded-full text-xs font-semibold text-emerald-100 mb-2 border border-emerald-500/30">
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>SBAR Clinical Handover Protocol</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              ติดตามการส่งเวร (Shift Handover Tracking)
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              ประเมินและติดตามมาตรฐานการส่งเวรทางวิสัญญีพยาบาล ครอบคลุม 4 มิติ SBAR (Suitiation, Background, Assessment, Recommendation) รวม 25 รายการ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-medium transition backdrop-blur-xs border border-white/10 cursor-pointer shadow-sm"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>โหลดข้อมูล</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left/Top Form, Right/Bottom List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card (8 cols on large screens) */}
        <div className="lg:col-span-8 space-y-5">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-7 space-y-6"
          >
            {/* Form Top Header & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${editingId ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {editingId ? 'แก้ไขข้อมูลการส่งเวร' : 'แบบบันทึกการติดตามการส่งเวร'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingId ? `กำลังแก้ไขรหัส: ${idwage}` : `รหัสส่งเวร: ${nextPreviewId} (อัตโนมัติเมื่อกดบันทึก)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSetAllComplete}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition cursor-pointer"
                  title="กำหนดให้ทุกข้อเป็นปฏิบัติครบ"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>เลือกปฏิบัติครบทั้งหมด</span>
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>ยกเลิกแก้ไข</span>
                  </button>
                )}
              </div>
            </div>

            {/* Header Basic Fields: idwage, notedate, HN, ASA, sentwage, ownercase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              {/* idwage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสการส่งเวร (idwage)
                </label>
                <input
                  type="text"
                  readOnly
                  value={editingId ? idwage : `${nextPreviewId} (อัตโนมัติ)`}
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono font-bold cursor-not-allowed"
                />
              </div>

              {/* notedate */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  วันที่ (notedate) <span className="text-rose-500">*</span>
                </label>
                <BEDatePicker
                  value={notedate}
                  onChange={setNotedate}
                  required
                />
              </div>

              {/* HN (จัดวางตำแหน่งข้างบน ต่อจาก notedate) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  HN ผู้ป่วย (HN)
                </label>
                <input
                  type="text"
                  list="hn-list-options"
                  placeholder="เช่น 670001"
                  value={hn}
                  onChange={e => {
                    const newHn = e.target.value;
                    setHn(newHn);
                    const found = patients.find(p => p.hn === newHn.trim());
                    if (found && found.ASA) {
                      const baseAsa = found.ASA.replace('E', '');
                      if (['1', '2', '3', '4', '5', '6'].includes(baseAsa)) {
                        setAsa(baseAsa);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono font-bold placeholder:font-normal placeholder:text-slate-400"
                />
                <datalist id="hn-list-options">
                  {patients.slice(0, 50).map(p => (
                    <option key={`pat_opt_${p.id || p.hn}`} value={p.hn}>
                      {p.hn} {p.sex ? `(${p.sex})` : ''} {p.age ? `อายุ ${p.age} ปี` : ''} - ASA: {p.ASA}
                    </option>
                  ))}
                </datalist>
              </div>

              {/* ASA (จัดวางตำแหน่งข้างบน ต่อจาก notedate & HN) ตัวเลือก "1","2","3","4","5","6" */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ASA (Physical Status) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={asa}
                  onChange={e => setAsa(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono font-bold"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </div>

              {/* sentwage (ผู้ส่งเวร) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ผู้ส่งเวร (sentwage) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={sentwage}
                  onChange={e => setSentwage(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                >
                  <option value="">-- เลือกผู้ส่งเวร --</option>
                  {activeUsers.map(u => (
                    <option key={`sent_${u.id || u.AN}`} value={u.AN}>
                      {u.AN}
                    </option>
                  ))}
                </select>
              </div>

              {/* ownercase (เจ้าของcase) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เจ้าของ Case (ownercase) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={ownercase}
                  onChange={e => setOwnercase(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                >
                  <option value="">-- เลือกเจ้าของเคส --</option>
                  {activeUsers.map(u => (
                    <option key={`owner_${u.id || u.AN}`} value={u.AN}>
                      {u.AN}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveSbarSection('All')}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  activeSbarSection === 'All'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด (25 ข้อ)
              </button>
              {sections.map(sec => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSbarSection(sec.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                    activeSbarSection === sec.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sec.id} ({SBAR_ITEMS.filter(it => it.section === sec.id).length})
                </button>
              ))}
            </div>

            {/* 4 SBAR Section Cards */}
            <div className="space-y-5">
              {sections.map(sec => {
                if (activeSbarSection !== 'All' && activeSbarSection !== sec.id) {
                  return null;
                }
                const itemsInSection = SBAR_ITEMS.filter(it => it.section === sec.id);

                return (
                  <div
                    key={sec.id}
                    className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white"
                  >
                    {/* Section Header */}
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        <h3 className="text-sm font-bold text-slate-800">
                          {sec.label}
                        </h3>
                        <span className="text-xs text-slate-500 hidden sm:inline">
                          — {sec.sub}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
                        {itemsInSection.length} รายการ
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="divide-y divide-slate-100">
                      {itemsInSection.map((item, idx) => {
                        const currentVal = sbarValues[item.key] || 'ปฏิบัติครบ';

                        return (
                          <div
                            key={item.key}
                            className="p-3 sm:px-4 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                          >
                            <div className="flex items-start gap-2.5 flex-1 pr-2">
                              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0 mt-0.5">
                                {item.key}
                              </span>
                              <div>
                                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                                  {item.label}
                                </span>
                              </div>
                            </div>

                            {/* Options Radio Pills */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                              {(['ปฏิบัติครบ', 'ปฏิบัติไม่ครบ', 'ไม่ปฏิบัติ', 'NA'] as SbarScoreOption[]).map(opt => {
                                const isSelected = currentVal === opt;
                                let colorClasses = 'border-slate-200 text-slate-600 hover:border-slate-300';

                                if (isSelected) {
                                  if (opt === 'ปฏิบัติครบ') colorClasses = 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs';
                                  else if (opt === 'ปฏิบัติไม่ครบ') colorClasses = 'bg-amber-500 border-amber-500 text-white font-bold shadow-xs';
                                  else if (opt === 'ไม่ปฏิบัติ') colorClasses = 'bg-rose-500 border-rose-500 text-white font-bold shadow-xs';
                                  else if (opt === 'NA') colorClasses = 'bg-slate-600 border-slate-600 text-white font-bold shadow-xs';
                                }

                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleSbarChange(item.key, opt)}
                                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${colorClasses}`}
                                  >
                                    {opt}
                                    {opt === 'ปฏิบัติครบ' && <span className="opacity-80 text-[10px] ml-1">(2)</span>}
                                    {opt === 'ปฏิบัติไม่ครบ' && <span className="opacity-80 text-[10px] ml-1">(1)</span>}
                                    {opt === 'ไม่ปฏิบัติ' && <span className="opacity-80 text-[10px] ml-1">(0)</span>}
                                    {opt === 'NA' && <span className="opacity-80 text-[10px] ml-1">(-)</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note (ect) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมายเหตุ (ect)
              </label>
              <textarea
                value={ect}
                onChange={e => setEct(e.target.value)}
                placeholder="ระบุข้อสังเกตเพิ่มเติม ปัญหาที่พบ หรือข้อมูลเฉพาะของเคสนี้ (ถ้ามี)"
                rows={2}
                className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
              />
            </div>

            {/* ผลการคำนวณคะแนนส่งเวรตามมาตรฐาน SBAR (จัดวางตำแหน่งล่างสุด) */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow-md gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs font-bold shrink-0">
                  <Award className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-xs text-emerald-100 font-medium">ผลการคำนวณคะแนนส่งเวรตามมาตรฐาน SBAR</div>
                  <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
                    <span>คะแนนรวม (point): <span className="text-xl text-yellow-300 font-mono">{point}</span> / {maxPoints}</span>
                    <span className="text-emerald-200 text-xs">({naCount} ข้อ NA)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-emerald-200 font-medium">ร้อยละความสมบูรณ์ (percent)</div>
                  <div className="text-2xl font-black font-mono tracking-tight text-white">
                    {percent.toFixed(2)}%
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-xs whitespace-nowrap ${
                  percent >= 80 ? 'bg-emerald-400 text-emerald-950' : percent >= 60 ? 'bg-amber-400 text-amber-950' : 'bg-rose-400 text-rose-950'
                }`}>
                  {percent >= 80 ? 'ดีเยี่ยม' : percent >= 60 ? 'ปานกลาง' : 'ควรปรับปรุง'}
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                ล้างฟอร์ม
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingId ? 'บันทึกการแก้ไข' : 'บันทึกการส่งเวร'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* List / History Records (4 cols on large screens) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 sm:p-5 flex flex-col h-full">
            {/* Search and Filters Header */}
            <div className="pb-3 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>รายการบันทึกส่งเวร</span>
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {filteredRecords.length} / {records.length}
                </span>
              </div>

              {/* Search text */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหารหัส, ผู้ส่งเวร, เจ้าของเคส..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                />
              </div>

              {/* Filter by date */}
              <div className="flex items-center gap-2">
                <BEDatePicker
                  value={filterDate}
                  onChange={setFilterDate}
                  placeholder="กรองตามวันที่ (พ.ศ.)"
                  className="text-xs py-1.5"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition"
                    title="ล้างตัวกรองวันที่"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* List Content */}
            <div className="pt-3 flex-1 overflow-y-auto max-h-[750px] space-y-3 pr-1">
              {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span>กำลังโหลดข้อมูลการส่งเวร...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-slate-300" />
                  <span>ไม่พบรายการบันทึกตามเงื่อนไขที่เลือก</span>
                </div>
              ) : (
                filteredRecords.map(item => {
                  const isCurrentEditing = editingId === item.idwage || editingId === item.id;
                  const itemPercent = Number(item.percent) || 0;

                  return (
                    <div
                      key={item.id || item.idwage}
                      className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                        isCurrentEditing
                          ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-300/40 shadow-xs'
                          : 'border-slate-100 bg-white hover:border-emerald-200 hover:shadow-xs'
                      }`}
                    >
                      {/* Card Top: idwage, HN, ASA & Date */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {item.idwage}
                          </span>
                          {item.hn && (
                            <span className="font-mono font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded text-[11px] border border-sky-200">
                              HN: {item.hn}
                            </span>
                          )}
                          <span className="font-mono font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded text-[11px] border border-purple-200">
                            ASA {item.asa || '1'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium whitespace-nowrap">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.notedate}
                        </span>
                      </div>

                      {/* Card Middle: Handover Staff Info */}
                      <div className="space-y-1 text-slate-700 bg-slate-50/80 p-2 rounded-lg">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">ผู้ส่งเวร:</span>
                          <span className="font-bold text-slate-800 truncate max-w-[170px]" title={item.sentwage}>
                            {item.sentwage}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">เจ้าของ Case:</span>
                          <span className="font-bold text-slate-800 truncate max-w-[170px]" title={item.ownercase}>
                            {item.ownercase}
                          </span>
                        </div>
                      </div>

                      {/* Card Score & Percent */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[11px] text-slate-500">คะแนน: </span>
                          <span className="font-bold font-mono text-slate-800">
                            {item.point}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">ร้อยละ:</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                              itemPercent >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : itemPercent >= 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {itemPercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      {item.ect && (
                        <div className="text-[11px] text-slate-600 bg-amber-50/60 border border-amber-200/50 p-1.5 rounded text-left">
                          <span className="font-semibold text-amber-900">หมายเหตุ: </span>
                          {item.ect}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-2 flex items-center justify-end gap-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition text-[11px] font-semibold cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition text-[11px] font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
