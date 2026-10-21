import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import { ComplicationRecord, PatientRecord, MasterComplication } from '../../types';
import {
  getOperationRecords,
  addOperationRecord,
  updateOperationRecord,
  deleteOperationRecord,
  getPatients,
  getMasterComplications
} from '../../services/db';
import { generateIdOper } from '../../utils/dateUtils';
import { showSuccessAlert, showErrorAlert, showConfirmDialog, showLoadingAlert, closeAlert } from '../../utils/sweetalert';

export const ComplicationRecordView: React.FC = () => {
  const [complicationRecords, setComplicationRecords] = useState<ComplicationRecord[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [masterComplications, setMasterComplications] = useState<MasterComplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search filter for table
  const [searchFilterHN, setSearchFilterHN] = useState<string>('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedHN, setSelectedHN] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [selectedComplication, setSelectedComplication] = useState<string>('');
  const [customComplication, setCustomComplication] = useState<string>('');
  const [riskroom, setRiskroom] = useState<'ห้องผ่าตัด' | 'ห้องพักฟื้น' | 'หอผู้ป่วย'>('ห้องผ่าตัด');
  const [hnSearchQuery, setHnSearchQuery] = useState<string>('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [operList, patList, mComList] = await Promise.all([
        getOperationRecords(),
        getPatients(),
        getMasterComplications()
      ]);
      setComplicationRecords(operList);
      setPatients(patList);
      setMasterComplications(mComList);
      if (mComList.length > 0 && !selectedComplication) {
        setSelectedComplication(mComList[0].Complication);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSelectHN = (hnVal: string) => {
    setSelectedHN(hnVal);
    const pat = patients.find(p => p.hn === hnVal);
    setSelectedPatient(pat || null);
  };

  const handleStartEdit = (item: ComplicationRecord) => {
    setEditingId(item.id || null);
    setSelectedHN(item.hn);
    const pat = patients.find(p => p.hn === item.hn) || {
      hn: item.hn,
      idpat: item.idpat
    } as PatientRecord;
    setSelectedPatient(pat);
    setSelectedComplication(item.Complication);
    setRiskroom((item.riskroom as any) || 'ห้องผ่าตัด');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHN || !selectedPatient) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาค้นหาและเลือก HN ผู้ป่วยจากระบบ');
      return;
    }

    const finalComp = customComplication.trim() ? customComplication.trim() : selectedComplication;
    if (!finalComp) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกหรือระบุ Complication');
      return;
    }

    showLoadingAlert('กำลังบันทึกข้อมูล Complication...');

    try {
      if (editingId) {
        await updateOperationRecord(editingId, {
          hn: selectedHN,
          idpat: selectedPatient.idpat,
          Complication: finalComp,
          riskroom
        });
        closeAlert();
        await showSuccessAlert('แก้ไขสำเร็จ', `อัปเดต Complication "${finalComp}" เรียบร้อยแล้ว`);
        setEditingId(null);
      } else {
        const idoper = generateIdOper(); // "yyyyMMDDHHmmss"
        await addOperationRecord({
          idoper,
          idpat: selectedPatient.idpat,
          Complication: finalComp,
          riskroom,
          hn: selectedHN
        });
        closeAlert();
        await showSuccessAlert(
          'บันทึกสำเร็จ',
          `บันทึก "${finalComp}" แล้ว! ท่านสามารถเลือก Complication อื่นต่อให้ HN: ${selectedHN} ได้ทันที`
        );
      }

      // Refresh records
      const updatedList = await getOperationRecords();
      setComplicationRecords(updatedList);

      // CRITICAL REQUIREMENT:
      // "มีComplication มากกว่า 1 รายการ ต้องเลือก HNใหม่ทุกครั้ง ขอให้ปรับเป็น หลังจากบันทึกComplication แรกแล้ว ให้ HNดังกล่าว ยังแสดงอยู่เพื่อเลือกComplicationอื่นอีก"
      setCustomComplication('');
    } catch (err: any) {
      closeAlert();
      showErrorAlert('บันทึกไม่สำเร็จ', err?.message);
    }
  };

  const handleDelete = async (item: ComplicationRecord) => {
    if (!item.id) return;
    const confirmed = await showConfirmDialog(
      'ยืนยันการลบข้อมูล',
      `ต้องการลบ Complication "${item.Complication}" ของ HN: ${item.hn} ใช่หรือไม่?`
    );
    if (confirmed) {
      showLoadingAlert('กำลังลบข้อมูล...');
      try {
        await deleteOperationRecord(item.id);
        closeAlert();
        await showSuccessAlert('ลบข้อมูลสำเร็จ');
        const updatedList = await getOperationRecords();
        setComplicationRecords(updatedList);
      } catch (err: any) {
        closeAlert();
        showErrorAlert('ลบไม่สำเร็จ', err?.message);
      }
    }
  };

  const matchingPatients = patients.filter(p =>
    p.hn.toLowerCase().includes(hnSearchQuery.toLowerCase())
  );

  const filteredRecords = complicationRecords.filter(r => {
    if (!searchFilterHN.trim()) return true;
    return r.hn.toLowerCase().includes(searchFilterHN.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-6 bg-emerald-400 rounded-full shrink-0"></span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                บันทึก Complication
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                บันทึกภาวะแทรกซ้อนที่เกิดขึ้นในห้องผ่าตัดหรือห้องพักฟื้น (HN ยังคงแสดงอยู่หลังบันทึก)
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          id="refresh-tbloperation-btn"
          onClick={loadAll}
          className="self-start md:self-auto p-2 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-100 transition-colors"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h3 className="font-bold text-base text-slate-800">
              {editingId ? 'แก้ไขข้อมูล Complication' : 'บันทึก Complication'}
            </h3>
          </div>
          {selectedPatient && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                เลือก HN: {selectedPatient.hn}
              </span>
              <button
                type="button"
                id="reset-comp-hn-btn"
                onClick={() => {
                  setSelectedHN('');
                  setSelectedPatient(null);
                  setEditingId(null);
                }}
                className="text-xs text-slate-500 hover:text-red-600 underline"
              >
                เปลี่ยนผู้ป่วย
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ค้นหาและเลือก HN จากทะเบียนผู้ป่วย */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ค้นหาและเลือก HN จากทะเบียนผู้ป่วย <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-emerald-600" />
                <input
                  type="text"
                  id="search-comp-pat-hn"
                  value={hnSearchQuery}
                  onChange={e => setHnSearchQuery(e.target.value)}
                  placeholder="พิมพ์ค้นหา HN..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
                />
              </div>

              <select
                id="select-comp-patient-hn"
                value={selectedHN}
                onChange={e => handleSelectHN(e.target.value)}
                required
                className="flex-1 px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 font-medium"
              >
                <option value="">-- เลือก HN ผู้ป่วย ({matchingPatients.length}) --</option>
                {matchingPatients.map(p => (
                  <option key={p.id || p.idpat} value={p.hn}>
                    HN: {p.hn} | {p.operdate} | ครั้งที่ {p.no} ({p.sex} {p.age} ปี)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* idpat (ดึงจาก tblPateint column idpat) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัส idpat
            </label>
            <input
              type="text"
              id="tbloper-idpat-read"
              value={selectedPatient ? selectedPatient.idpat : ''}
              readOnly
              placeholder="ดึงจากทะเบียนอัตโนมัติ"
              className="w-full px-3 py-2 text-xs bg-slate-100/80 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed font-mono text-[11px]"
            />
          </div>

          {/* riskroom label "ห้อง" ตัวเลือก "ห้องผ่าตัด","ห้องพักฟื้น","หอผู้ป่วย" */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ห้องที่เกิดภาวะแทรกซ้อน (riskroom) <span className="text-red-500">*</span>
            </label>
            <select
              id="tbloper-riskroom-select"
              value={riskroom}
              onChange={e => setRiskroom(e.target.value as 'ห้องผ่าตัด' | 'ห้องพักฟื้น' | 'หอผู้ป่วย')}
              className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 font-medium"
            >
              <option value="ห้องผ่าตัด">ห้องผ่าตัด (OR)</option>
              <option value="ห้องพักฟื้น">ห้องพักฟื้น (PACU)</option>
              <option value="หอผู้ป่วย">หอผู้ป่วย (Ward)</option>
            </select>
          </div>

          {/* Complication (ดึงจาก sheets tblcom ให้ค้นหาได้) */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Complication <span className="text-red-500">*</span>
            </label>
            <select
              id="tbloper-complication-select"
              value={selectedComplication}
              onChange={e => setSelectedComplication(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 font-medium"
            >
              {masterComplications.map(m => (
                <option key={m.id || m.Complication} value={m.Complication}>
                  {m.Complication}
                </option>
              ))}
            </select>
          </div>

          {/* ระบุเพิ่มเติมถ้าไม่อยู่ใน master list */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หรือ ระบุ Complication อื่น
            </label>
            <input
              type="text"
              id="tbloper-custom-comp"
              value={customComplication}
              onChange={e => setCustomComplication(e.target.value)}
              placeholder="พิมพ์ภาวะแทรกซ้อนอื่น..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800"
            />
          </div>
        </div>

        {/* Feature Banner: Keep HN Active */}
        <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <b>ระบบช่วยบันทึกต่อเนื่อง:</b> เมื่อกดบันทึกแล้ว ข้อมูล HN:{' '}
              <b className="text-amber-900">{selectedHN || '(ยังไม่เลือก)'}</b> จะยังคงแสดงอยู่
              เพื่อให้สามารถเลือก Complication รายการถัดไปต่อได้ทันที
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {editingId && (
            <button
              type="button"
              id="cancel-edit-tbloper-btn"
              onClick={() => {
                setEditingId(null);
                setCustomComplication('');
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิกแก้ไข
            </button>
          )}
          <button
            type="submit"
            id="save-tbloper-btn"
            disabled={!selectedHN}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-medium rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{editingId ? 'บันทึกการแก้ไข' : 'บันทึก Complication'}</span>
          </button>
        </div>
      </form>

      {/* Complication Records Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 overflow-hidden">
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-emerald-600" />
            <input
              type="text"
              id="search-filter-tbloper-hn"
              value={searchFilterHN}
              onChange={e => setSearchFilterHN(e.target.value)}
              placeholder="ค้นหาประวัติ Complication จาก HN..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
            />
          </div>

          <div className="text-xs text-slate-500">
            พบข้อมูลทั้งหมด <span className="font-bold text-emerald-700">{filteredRecords.length}</span> รายการ
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">HN</th>
                <th className="py-3.5 px-3">ภาวะแทรกซ้อน (Complication)</th>
                <th className="py-3.5 px-3">ห้อง</th>
                <th className="py-3.5 px-3">idoper (ซ่อน/แสดง)</th>
                <th className="py-3.5 px-3">idpat</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    กำลังโหลดข้อมูล Complication...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {searchFilterHN
                      ? `ไม่พบข้อมูลสำหรับ HN "${searchFilterHN}"`
                      : 'ยังไม่มีประวัติการบันทึก Complication'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map(item => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-emerald-700 font-mono">{item.hn}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        {item.Complication}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        {item.riskroom}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{item.idoper}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{item.idpat}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          id={`edit-comp-${item.id}`}
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`delete-comp-${item.id}`}
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
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
