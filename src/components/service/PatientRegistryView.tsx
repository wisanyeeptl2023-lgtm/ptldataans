import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Clock,
  Thermometer,
  Shield,
  FileText
} from 'lucide-react';
import { PatientRecord, UserLogin } from '../../types';
import { getPatients, addPatient, updatePatient, deletePatient, getUsers } from '../../services/db';
import { BEDatePicker } from '../common/BEDatePicker';
import { getTodayBEDate } from '../../utils/dateUtils';
import { showSuccessAlert, showErrorAlert, showConfirmDialog, showLoadingAlert, closeAlert } from '../../utils/sweetalert';

interface PatientRegistryViewProps {
  currentUser: UserLogin;
}

const ASA_OPTIONS = ['1', '1E', '2', '2E', '3', '3E', '4', '4E', '5', '5E', '6', '6E'];
const PCT_OPTIONS = ['CVT', 'Dental', 'ENT', 'Eye', 'Gen', 'Neuro', 'Obs-Gyn', 'Ortho', 'ped', 'plastic', 'uro'];
const TEGNIC_OPTIONS = ['EB', 'GA', 'GA+EB', 'MAC', 'NB', 'SB', 'SB+GA', 'SB+EB', 'SB+NB', 'TIVA', 'NB+TIVA'];
const AIRWAY_OPTIONS = ['ETT', 'LMA', 'Mask', 'Mask c bag', 'Tracheostomy', 'Nasal Cannula'];
const CASE_CODE_OPTIONS = ['Elective', 'Elective นอกเวลา', 'Emergency นอก', 'Emergency ใน', 'add on'];
const PAIN_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const PatientRegistryView: React.FC<PatientRegistryViewProps> = ({ currentUser }) => {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [nurseUsers, setNurseUsers] = useState<UserLogin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchHN, setSearchHN] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Form State
  const [hn, setHn] = useState<string>('');
  const [operdate, setOperdate] = useState<string>(getTodayBEDate());
  const [no, setNo] = useState<string>('1');
  const [nocase, setNocase] = useState<string>('1');
  const [sex, setSex] = useState<'ชาย' | 'หญิง'>('ชาย');
  const [age, setAge] = useState<string>('');
  const [asa, setAsa] = useState<PatientRecord['ASA']>('1');
  const [pct, setPct] = useState<PatientRecord['pct']>('Gen');
  const [tegnic, setTegnic] = useState<PatientRecord['tegnic']>('GA');
  const [airway, setAirway] = useState<PatientRecord['Airway']>('ETT');
  const [timeOR, setTimeOR] = useState<string>('');
  const [caseCode, setCaseCode] = useState<PatientRecord['CaseCode']>('Elective');
  const [disect, setDisect] = useState<string>('36.5');
  const [painIn, setPainIn] = useState<string>('0');
  const [painOut, setPainOut] = useState<string>('0');
  const [timePACU, setTimePACU] = useState<string>('');
  const [postopvisit, setPostopvisit] = useState<'yes' | 'no'>('no');
  const [anNurse, setAnNurse] = useState<string>(currentUser.AN || '');
  const [optionalDiseasesOpen, setOptionalDiseasesOpen] = useState<boolean>(false);
  const [chronicNote, setChronicNote] = useState<string>('');

  // Auto-calculated idpat: hn & ":" & operdate & ":" & no
  const calculatedIdpat = `${hn.trim()}:${operdate.trim()}:${no.trim()}`;

  const loadData = async () => {
    setLoading(true);
    try {
      const [patList, userList] = await Promise.all([getPatients(), getUsers()]);
      setPatients(patList);
      setNurseUsers(userList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setHn('');
    setOperdate(getTodayBEDate());
    setNo('1');
    setNocase('1');
    setSex('ชาย');
    setAge('');
    setAsa('1');
    setPct('Gen');
    setTegnic('GA');
    setAirway('ETT');
    setTimeOR('');
    setCaseCode('Elective');
    setDisect('36.5');
    setPainIn('0');
    setPainOut('0');
    setTimePACU('');
    setPostopvisit('no');
    setAnNurse(currentUser.AN || '');
    setChronicNote('');
  };

  const handleStartEdit = (p: PatientRecord) => {
    setEditingId(p.id || null);
    setHn(p.hn || '');
    setOperdate(p.operdate || getTodayBEDate());
    setNo(p.no || '1');
    setNocase(p.nocase || '1');
    setSex(p.sex || 'ชาย');
    setAge(p.age || '');
    setAsa(p.ASA || '1');
    setPct(p.pct || 'Gen');
    setTegnic(p.tegnic || 'GA');
    setAirway(p.Airway || 'ETT');
    setTimeOR(p.TimeOR || '');
    setCaseCode(p.CaseCode || 'Elective');
    setDisect(p.disect || '36.5');
    setPainIn(p.PainIn || '0');
    setPainOut(p.PainOut || '0');
    setTimePACU(p.TimePACU || '');
    setPostopvisit(p.postopvisit || 'no');
    setAnNurse(p.AN || currentUser.AN);
    setChronicNote(p.โรคประจำตัว || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hn.trim() || !operdate.trim() || !no.trim() || !nocase.trim() || !age.trim() || !timeOR.trim() || !timePACU.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
      return;
    }

    showLoadingAlert(editingId ? 'กำลังแก้ไขข้อมูลผู้ป่วย...' : 'กำลังบันทึกข้อมูลผู้ป่วย...');

    const recordData: Omit<PatientRecord, 'id'> = {
      hn: hn.trim(),
      operdate: operdate.trim(),
      no: no.trim(),
      nocase: nocase.trim(),
      sex,
      age: age.trim(),
      ASA: asa,
      pct,
      tegnic,
      Airway: airway,
      TimeOR: timeOR.trim(),
      CaseCode: caseCode,
      disect: disect.trim(),
      PainIn: painIn,
      PainOut: painOut,
      TimePACU: timePACU.trim(),
      postopvisit,
      AN: anNurse || currentUser.AN,
      chknote: currentUser.AN, // column chknote ซ่อน และนำข้อมูลจาก tbllogin คอลัมน์ AN
      idpat: calculatedIdpat,
      โรคประจำตัว: chronicNote
    };

    try {
      if (editingId) {
        await updatePatient(editingId, recordData);
        closeAlert();
        await showSuccessAlert('แก้ไขสำเร็จ', `อัปเดตข้อมูล HN: ${hn} เรียบร้อยแล้ว`);
      } else {
        await addPatient(recordData);
        closeAlert();
        await showSuccessAlert('บันทึกสำเร็จ', `เพิ่มข้อมูลผู้ป่วย HN: ${hn} เรียบร้อยแล้ว`);
      }

      await loadData();
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      closeAlert();
      showErrorAlert('บันทึกไม่สำเร็จ', err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
    }
  };

  const handleDelete = async (p: PatientRecord) => {
    if (!p.id) return;
    const confirmed = await showConfirmDialog('ยืนยันการลบข้อมูล', `ต้องการลบข้อมูล HN: ${p.hn} ครั้งที่ ${p.no} ใช่หรือไม่?`);
    if (confirmed) {
      showLoadingAlert('กำลังลบข้อมูล...');
      try {
        await deletePatient(p.id);
        closeAlert();
        await showSuccessAlert('ลบข้อมูลสำเร็จ');
        await loadData();
      } catch (err: any) {
        closeAlert();
        showErrorAlert('ลบไม่สำเร็จ', err?.message);
      }
    }
  };

  const filteredPatients = patients.filter(p => {
    if (!searchHN.trim()) return true;
    return p.hn?.toLowerCase().includes(searchHN.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-6 bg-emerald-400 rounded-full shrink-0"></span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                ทะเบียนผู้ป่วย งานวิสัญญี (tblPateint)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                บันทึก เพิ่ม ลบ แก้ไข ข้อมูลผู้ป่วยและหัตถการวิสัญญี โรงพยาบาลพัทลุง
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="refresh-patient-btn"
            onClick={loadData}
            className="p-2 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-100 transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            id="toggle-add-patient-btn"
            onClick={() => {
              if (showForm && !editingId) {
                setShowForm(false);
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'ซ่อนแบบฟอร์ม' : 'เพิ่มทะเบียนผู้ป่วยใหม่'}</span>
          </button>
        </div>
      </div>

      {/* Patient Entry / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-base text-slate-800">
                {editingId ? 'แก้ไขข้อมูลผู้ป่วย' : 'บันทึกข้อมูลผู้ป่วยใหม่'}
              </h3>
            </div>
            <div className="text-xs text-emerald-800 bg-emerald-50/80 px-3 py-1 rounded-xl border border-emerald-200 font-mono">
              idpat: <span className="font-bold">{calculatedIdpat || '(ระบุ HN, วันที่, ครั้งที่)'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* HN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="form-pat-hn"
                value={hn}
                onChange={e => setHn(e.target.value)}
                placeholder="เช่น 67001234"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800 font-medium"
              />
            </div>

            {/* วันที่ทำหัตถการ operdate */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ทำหัตถการ (พ.ศ.) <span className="text-red-500">*</span>
              </label>
              <BEDatePicker
                id="form-pat-operdate"
                value={operdate}
                onChange={setOperdate}
                required
              />
            </div>

            {/* ครั้งที่ no */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ครั้งที่ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="form-pat-no"
                value={no}
                onChange={e => setNo(e.target.value)}
                placeholder="เช่น 1"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
              />
            </div>

            {/* ใบที่ nocase */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ใบที่ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="form-pat-nocase"
                value={nocase}
                onChange={e => setNocase(e.target.value)}
                placeholder="เช่น 1"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
              />
            </div>

            {/* เพศ sex */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เพศ <span className="text-red-500">*</span>
              </label>
              <select
                id="form-pat-sex"
                value={sex}
                onChange={e => setSex(e.target.value as 'ชาย' | 'หญิง')}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
              >
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>
            </div>

            {/* อายุ age */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อายุ (ปี) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="form-pat-age"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="เช่น 45"
                min="0"
                max="130"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
              />
            </div>

            {/* ASA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ASA Class <span className="text-red-500">*</span>
              </label>
              <select
                id="form-pat-asa"
                value={asa}
                onChange={e => setAsa(e.target.value as PatientRecord['ASA'])}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800 font-medium"
              >
                {ASA_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    ASA {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* แผนก pct */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                แผนก (pct) <span className="text-red-500">*</span>
              </label>
              <select
                id="form-pat-pct"
                value={pct}
                onChange={e => setPct(e.target.value as PatientRecord['pct'])}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
              >
                {PCT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* วิธีระงับความรู้สึก tegnic */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วิธีระงับความรู้สึก <span className="text-red-500">*</span>
              </label>
              <select
                id="form-pat-tegnic"
                value={tegnic}
                onChange={e => setTegnic(e.target.value as PatientRecord['tegnic'])}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800 font-medium"
              >
                {TEGNIC_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Airway */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Airway <span className="text-red-500">*</span>
              </label>
              <select
                id="form-pat-airway"
                value={airway}
                onChange={e => setAirway(e.target.value as PatientRecord['Airway'])}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
              >
                {AIRWAY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* ระยะเวลาผ่าตัด TimeOR */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ระยะเวลาผ่าตัด (นาที) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="form-pat-timeor"
                value={timeOR}
                onChange={e => setTimeOR(e.target.value)}
                placeholder="เช่น 60"
                min="0"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* ประเภท CaseCode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ประเภท (CaseCode)
              </label>
              <select
                id="form-pat-casecode"
                value={caseCode}
                onChange={e => setCaseCode(e.target.value as PatientRecord['CaseCode'])}
                className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                {CASE_CODE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* อุณหภูมิร่างกาย disect */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อุณหภูมิร่างกาย (°C) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="form-pat-disect"
                value={disect}
                onChange={e => setDisect(e.target.value)}
                placeholder="เช่น 36.5"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* PainIn */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pain In (0-10) <span className="text-red-500">*</span>
              </label>
              <select
                id="form-pat-painin"
                value={painIn}
                onChange={e => setPainIn(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                {PAIN_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* PainOut */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pain Out (0-10) <span className="text-red-500">*</span>
              </label>
              <select
                id="form-pat-painout"
                value={painOut}
                onChange={e => setPainOut(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                {PAIN_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* ระยะเวลาในห้องพักฟื้น TimePACU */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ระยะเวลาในห้องพักฟื้น (นาที) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="form-pat-timepacu"
                value={timePACU}
                onChange={e => setTimePACU(e.target.value)}
                placeholder="เช่น 45"
                min="0"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* เยี่ยมหลังผ่าตัด postopvisit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เยี่ยมหลังผ่าตัด <span className="text-red-500">*</span>
              </label>
              <select
                id="form-pat-postop"
                value={postopvisit}
                onChange={e => setPostopvisit(e.target.value as 'yes' | 'no')}
                className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                <option value="no">no (ยังไม่ได้เยี่ยม)</option>
                <option value="yes">yes (เยี่ยมแล้ว)</option>
              </select>
            </div>

            {/* ชื่อพยาบาลดมยา AN (ค้นหา/เลือกจาก tbllogin) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อพยาบาลดมยา (AN) <span className="text-red-500">*</span>
              </label>
              <select
                id="form-pat-annurse"
                value={anNurse}
                onChange={e => setAnNurse(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800 font-medium"
              >
                {nurseUsers.map(u => (
                  <option key={u.id || u.username} value={u.AN}>
                    {u.AN} ({u.username})
                  </option>
                ))}
              </select>
            </div>

            {/* ชื่อผู้บันทึกข้อมูล chknote (ซ่อน นำมาจาก tbllogin ของผู้ใช้) */}
            <input type="hidden" name="chknote" value={currentUser.AN} />
          </div>

          {/* Hidden/Optional Disease Note Collapsible */}
          <div className="pt-2">
            <button
              type="button"
              id="toggle-optional-fields-btn"
              onClick={() => setOptionalDiseasesOpen(!optionalDiseasesOpen)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1.5"
            >
              <span>{optionalDiseasesOpen ? '▼ ซ่อนฟิลด์โรคประจำตัวเพิ่มเติม' : '▶ แสดงฟิลด์โรคประจำตัวเพิ่มเติม (บันทึกย่อ)'}</span>
            </button>
            {optionalDiseasesOpen && (
              <div className="mt-2 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บันทึกโรคประจำตัวเพิ่มเติม (เช่น DM, HT, Asthma ฯลฯ)
                </label>
                <input
                  type="text"
                  value={chronicNote}
                  onChange={e => setChronicNote(e.target.value)}
                  placeholder="ระบุโรคประจำตัวย่อ (หรือสามารถบันทึกละเอียดที่เมนู บันทึกโรคประจำตัว tbldis)"
                  className="w-full px-3 py-2 text-sm bg-white border border-emerald-100 rounded-xl text-slate-700"
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              id="cancel-pat-btn"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              id="save-pat-btn"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลผู้ป่วย'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Patient Search & Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 overflow-hidden">
        {/* Search header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-emerald-500" />
            <input
              type="text"
              id="search-patient-hn-input"
              value={searchHN}
              onChange={e => setSearchHN(e.target.value)}
              placeholder="ค้นหาประวัติข้อมูลจาก HN..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
            />
          </div>

          <div className="text-xs text-slate-500">
            พบข้อมูลทั้งหมด <span className="font-bold text-emerald-700">{filteredPatients.length}</span> รายการ
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">HN</th>
                <th className="py-3.5 px-3">วันที่ (พ.ศ.)</th>
                <th className="py-3.5 px-2 text-center">ครั้ง/ใบ</th>
                <th className="py-3.5 px-2 text-center">เพศ/อายุ</th>
                <th className="py-3.5 px-3">ASA</th>
                <th className="py-3.5 px-3">แผนก</th>
                <th className="py-3.5 px-3">วิธีระงับความรู้สึก</th>
                <th className="py-3.5 px-3">Airway</th>
                <th className="py-3.5 px-2 text-center">เวลา OR</th>
                <th className="py-3.5 px-2 text-center">Pain</th>
                <th className="py-3.5 px-3">พยาบาลดมยา (AN)</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    กำลังโหลดข้อมูลทะเบียนผู้ป่วย...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    {searchHN ? `ไม่พบข้อมูลสำหรับ HN "${searchHN}"` : 'ยังไม่มีข้อมูลในทะเบียนผู้ป่วย'}
                  </td>
                </tr>
              ) : (
                filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-emerald-700 font-mono">{p.hn}</td>
                    <td className="py-3 px-3">{p.operdate}</td>
                    <td className="py-3 px-2 text-center text-slate-600">{p.no} / {p.nocase}</td>
                    <td className="py-3 px-2 text-center text-slate-600">{p.sex} ({p.age} ปี)</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60">
                        ASA {p.ASA}
                      </span>
                    </td>
                    <td className="py-3 px-3">{p.pct}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{p.tegnic}</td>
                    <td className="py-3 px-3">{p.Airway}</td>
                    <td className="py-3 px-2 text-center text-slate-600">{p.TimeOR} น.</td>
                    <td className="py-3 px-2 text-center">
                      <span title="Pain In / Pain Out" className="text-slate-600">{p.PainIn} → {p.PainOut}</span>
                    </td>
                    <td className="py-3 px-3 truncate max-w-[120px]" title={p.AN}>
                      {p.AN}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          id={`edit-pat-${p.id}`}
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`delete-pat-${p.id}`}
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบข้อมูล"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
