import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import { DrugServRecord, ComplicationRecord, MasterDrug } from '../../types';
import {
  getDrugServRecords,
  addDrugServRecord,
  updateDrugServRecord,
  deleteDrugServRecord,
  getOperationRecords,
  getMasterDrugs
} from '../../services/db';
import { generateIdDrugServ } from '../../utils/dateUtils';
import { showSuccessAlert, showErrorAlert, showConfirmDialog, showLoadingAlert, closeAlert } from '../../utils/sweetalert';

export const DrugRecordView: React.FC = () => {
  const [drugRecords, setDrugRecords] = useState<DrugServRecord[]>([]);
  const [operations, setOperations] = useState<ComplicationRecord[]>([]);
  const [masterDrugs, setMasterDrugs] = useState<MasterDrug[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search filter for table
  const [searchFilterHN, setSearchFilterHN] = useState<string>('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<ComplicationRecord | null>(null);
  const [hnInput, setHnInput] = useState<string>('');
  const [selectedDrug, setSelectedDrug] = useState<string>('');
  const [customDrug, setCustomDrug] = useState<string>('');
  const [hnSearchQuery, setHnSearchQuery] = useState<string>('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [drList, operList, mDrugs] = await Promise.all([
        getDrugServRecords(),
        getOperationRecords(),
        getMasterDrugs()
      ]);
      setDrugRecords(drList);
      setOperations(operList);
      setMasterDrugs(mDrugs);
      if (mDrugs.length > 0 && !selectedDrug) {
        setSelectedDrug(mDrugs[0].drugname);
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

  const handleSelectOperation = (op: ComplicationRecord) => {
    setSelectedOperation(op);
    setHnInput(op.hn);
  };

  const handleStartEdit = (item: DrugServRecord) => {
    setEditingId(item.id || null);
    setHnInput(item.hn);
    const op = operations.find(o => o.idoper === item.idoper) || {
      hn: item.hn,
      idoper: item.idoper,
      riskroom: item.riskroom as any
    } as ComplicationRecord;
    setSelectedOperation(op);
    setSelectedDrug(item.drugname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOperation || !hnInput.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาค้นหาและเลือกรายการผู้ป่วย/หัตถการ');
      return;
    }

    const finalDrug = customDrug.trim() ? customDrug.trim() : selectedDrug;
    if (!finalDrug) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกหรือระบุชื่อยา');
      return;
    }

    showLoadingAlert('กำลังบันทึกข้อมูลยา...');

    try {
      if (editingId) {
        await updateDrugServRecord(editingId, {
          hn: hnInput.trim(),
          idoper: selectedOperation.idoper,
          riskroom: selectedOperation.riskroom,
          drugname: finalDrug
        });
        closeAlert();
        await showSuccessAlert('แก้ไขสำเร็จ', `อัปเดตข้อมูลยา "${finalDrug}" เรียบร้อยแล้ว`);
        setEditingId(null);
      } else {
        const iddrugserv = generateIdDrugServ(); // "d-yyyyMMHHmmss"
        await addDrugServRecord({
          iddrugserv,
          idoper: selectedOperation.idoper,
          riskroom: selectedOperation.riskroom,
          drugname: finalDrug,
          hn: hnInput.trim()
        });
        closeAlert();
        await showSuccessAlert(
          'บันทึกสำเร็จ',
          `บันทึกยา "${finalDrug}" แล้ว! ท่านสามารถเลือกยาอื่นต่อให้ HN: ${hnInput} ได้ทันที`
        );
      }

      // Refresh records
      const updatedList = await getDrugServRecords();
      setDrugRecords(updatedList);

      // CRITICAL REQUIREMENT:
      // "ในกรณีHNเดิม มียามากกว่า1 รายการ ต้องเลือก HNใหม่ทุกครั้ง ขอให้ปรับเป็น หลังจากบันทึกยา รายการแรกแล้ว ให้ HNดังกล่าว ยังแสดงอยู่เพื่อเลือก ยา อื่นอีก"
      setCustomDrug('');
    } catch (err: any) {
      closeAlert();
      showErrorAlert('บันทึกไม่สำเร็จ', err?.message);
    }
  };

  const handleDelete = async (item: DrugServRecord) => {
    if (!item.id) return;
    const confirmed = await showConfirmDialog(
      'ยืนยันการลบข้อมูล',
      `ต้องการลบรายการยา "${item.drugname}" ของ HN: ${item.hn} ใช่หรือไม่?`
    );
    if (confirmed) {
      showLoadingAlert('กำลังลบข้อมูลยา...');
      try {
        await deleteDrugServRecord(item.id);
        closeAlert();
        await showSuccessAlert('ลบข้อมูลสำเร็จ');
        const updatedList = await getDrugServRecords();
        setDrugRecords(updatedList);
      } catch (err: any) {
        closeAlert();
        showErrorAlert('ลบไม่สำเร็จ', err?.message);
      }
    }
  };

  // Filter operations based on HN search query
  const matchingOperations = operations.filter(op =>
    op.hn.toLowerCase().includes(hnSearchQuery.toLowerCase())
  );

  const filteredRecords = drugRecords.filter(r => {
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
                บันทึกยา
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                บันทึกรายการยาที่ใช้ในการบริการวิสัญญี (HN ยังคงแสดงอยู่หลังบันทึก)
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          id="refresh-tbldrugserv-btn"
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
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <h3 className="font-bold text-base text-slate-800">
              {editingId ? 'แก้ไขรายการยา' : 'บันทึกรายการยาใหม่'}
            </h3>
          </div>
          {selectedOperation && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                เลือก HN: {selectedOperation.hn} | ห้อง: {selectedOperation.riskroom}
              </span>
              <button
                type="button"
                id="reset-drug-op-btn"
                onClick={() => {
                  setSelectedOperation(null);
                  setHnInput('');
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
          {/* ค้นหา HN */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ค้นหาและเลือก HN / หัตถการ <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-emerald-600" />
                <input
                  type="text"
                  id="search-drug-hn-box"
                  value={hnSearchQuery}
                  onChange={e => setHnSearchQuery(e.target.value)}
                  placeholder="พิมพ์ค้นหา HN..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
                />
              </div>

              <select
                id="select-drug-operation-dropdown"
                value={selectedOperation ? selectedOperation.idoper : ''}
                onChange={e => {
                  const found = operations.find(o => o.idoper === e.target.value);
                  if (found) handleSelectOperation(found);
                }}
                required
                className="flex-1 px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 font-medium"
              >
                <option value="">-- เลือก HN/หัตถการ ({matchingOperations.length}) --</option>
                {matchingOperations.map(op => (
                  <option key={op.id || op.idoper} value={op.idoper}>
                    HN: {op.hn} | {op.riskroom} | idoper: {op.idoper}
                  </option>
                ))}
              </select>
            </div>
            {operations.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                * ยังไม่มีข้อมูลหัตถการ กรุณาบันทึกข้อมูลที่เมนู "บันทึก Complication" ก่อน
              </p>
            )}
          </div>

          {/* idoper */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัส idoper
            </label>
            <input
              type="text"
              id="tbldrug-idoper-read"
              value={selectedOperation ? selectedOperation.idoper : ''}
              readOnly
              placeholder="ดึงข้อมูลอัตโนมัติ"
              className="w-full px-3 py-2 text-xs bg-slate-100/80 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed font-mono text-[11px]"
            />
          </div>

          {/* riskroom */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ห้อง (riskroom)
            </label>
            <input
              type="text"
              id="tbldrug-riskroom-read"
              value={selectedOperation ? selectedOperation.riskroom : ''}
              readOnly
              placeholder="ดึงข้อมูลอัตโนมัติ"
              className="w-full px-3 py-2 text-xs bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 font-medium"
            />
          </div>

          {/* drugname */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อยา <span className="text-red-500">*</span>
            </label>
            <select
              id="tbldrug-name-select"
              value={selectedDrug}
              onChange={e => setSelectedDrug(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 font-medium"
            >
              {masterDrugs.map(m => (
                <option key={m.id || m.drugname} value={m.drugname}>
                  {m.drugname}
                </option>
              ))}
            </select>
          </div>

          {/* ระบุชื่อยาอื่นเพิ่มเติมถ้าไม่อยู่ใน tbldrug */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หรือ ระบุชื่อยาอื่นๆ
            </label>
            <input
              type="text"
              id="tbldrug-custom-name"
              value={customDrug}
              onChange={e => setCustomDrug(e.target.value)}
              placeholder="พิมพ์ชื่อยาเฉพาะ..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800"
            />
          </div>
        </div>

        {/* Feature Banner: Keep HN Active */}
        <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-100 flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <b>ระบบช่วยบันทึกต่อเนื่อง:</b> เมื่อบันทึกยาแล้ว ข้อมูล HN:{' '}
              <b className="text-teal-900">{hnInput || '(ยังไม่เลือก)'}</b> จะยังคงแสดงอยู่
              เพื่อให้ท่านสามารถเลือกรายการยาถัดไปต่อได้ทันที
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {editingId && (
            <button
              type="button"
              id="cancel-edit-tbldrug-btn"
              onClick={() => {
                setEditingId(null);
                setCustomDrug('');
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิกแก้ไข
            </button>
          )}
          <button
            type="submit"
            id="save-tbldrug-btn"
            disabled={!selectedOperation}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-medium rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{editingId ? 'บันทึกการแก้ไข' : 'บันทึกรายการยา'}</span>
          </button>
        </div>
      </form>

      {/* Drug Records Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 overflow-hidden">
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-emerald-600" />
            <input
              type="text"
              id="search-filter-tbldrug-hn"
              value={searchFilterHN}
              onChange={e => setSearchFilterHN(e.target.value)}
              placeholder="ค้นหาประวัติการใช้ยาจาก HN..."
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
                <th className="py-3.5 px-3">ชื่อยา (drugname)</th>
                <th className="py-3.5 px-3">ห้อง (riskroom)</th>
                <th className="py-3.5 px-3">iddrugserv</th>
                <th className="py-3.5 px-3">idoper</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    กำลังโหลดข้อมูลยา...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {searchFilterHN
                      ? `ไม่พบข้อมูลสำหรับ HN "${searchFilterHN}"`
                      : 'ยังไม่มีประวัติการบันทึกยา'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map(item => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-emerald-700 font-mono">{item.hn}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-100 font-medium">
                        {item.drugname}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        {item.riskroom}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{item.iddrugserv}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{item.idoper}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          id={`edit-drug-${item.id}`}
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`delete-drug-${item.id}`}
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
