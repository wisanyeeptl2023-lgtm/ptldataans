import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, RefreshCw, BookOpen, Layers, Pill } from 'lucide-react';
import { MasterDisease, MasterComplication, MasterDrug } from '../../types';
import {
  getMasterDiseases,
  addMasterDisease,
  updateMasterDisease,
  deleteMasterDisease,
  getMasterComplications,
  addMasterComplication,
  updateMasterComplication,
  deleteMasterComplication,
  getMasterDrugs,
  addMasterDrug,
  updateMasterDrug,
  deleteMasterDrug
} from '../../services/db';
import { showSuccessAlert, showErrorAlert, showConfirmDialog, showLoadingAlert, closeAlert } from '../../utils/sweetalert';

interface MasterDataViewProps {
  type: 'disease' | 'complication' | 'drug';
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ type }) => {
  const [items, setItems] = useState<Array<{ id?: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const config = {
    disease: {
      title: 'ข้อมูลโรค (tbldisname)',
      desc: 'เพิ่ม ลบ แก้ไข รายชื่อโรคประจำตัว (คอลัมน์ dis)',
      label: 'ชื่อโรคประจำตัว (dis)',
      placeholder: 'เช่น เบาหวาน (DM), ความดันโลหิตสูง (HT)',
      icon: BookOpen,
      iconColor: 'bg-rose-100 text-rose-700'
    },
    complication: {
      title: 'ข้อมูล Complication (tblcom)',
      desc: 'เพิ่ม ลบ แก้ไข รายชื่อภาวะแทรกซ้อน (คอลัมน์ Complication)',
      label: 'ชื่อภาวะแทรกซ้อน (Complication)',
      placeholder: 'เช่น Difficult intubation, Hypotension',
      icon: Layers,
      iconColor: 'bg-amber-100 text-amber-700'
    },
    drug: {
      title: 'ข้อมูลยา (tbldrug)',
      desc: 'เพิ่ม ลบ แก้ไข รายชื่อยาทางวิสัญญี (คอลัมน์ drugname)',
      label: 'ชื่อยา (drugname)',
      placeholder: 'เช่น Propofol, Fentanyl, Morphine',
      icon: Pill,
      iconColor: 'bg-teal-100 text-teal-700'
    }
  }[type];

  const loadData = async () => {
    setLoading(true);
    try {
      if (type === 'disease') {
        const res = await getMasterDiseases();
        setItems(res.map(r => ({ id: r.id, name: r.dis })));
      } else if (type === 'complication') {
        const res = await getMasterComplications();
        setItems(res.map(r => ({ id: r.id, name: r.Complication })));
      } else {
        const res = await getMasterDrugs();
        setItems(res.map(r => ({ id: r.id, name: r.drugname })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setEditingId(null);
    setInputValue('');
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูล');
      return;
    }

    showLoadingAlert('กำลังบันทึกข้อมูล...');

    try {
      if (editingId) {
        if (type === 'disease') await updateMasterDisease(editingId, inputValue.trim());
        else if (type === 'complication') await updateMasterComplication(editingId, inputValue.trim());
        else await updateMasterDrug(editingId, inputValue.trim());

        closeAlert();
        await showSuccessAlert('แก้ไขสำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว');
      } else {
        if (type === 'disease') await addMasterDisease(inputValue.trim());
        else if (type === 'complication') await addMasterComplication(inputValue.trim());
        else await addMasterDrug(inputValue.trim());

        closeAlert();
        await showSuccessAlert('บันทึกสำเร็จ', 'เพิ่มรายการใหม่เรียบร้อยแล้ว');
      }

      setEditingId(null);
      setInputValue('');
      await loadData();
    } catch (err: any) {
      closeAlert();
      showErrorAlert('เกิดข้อผิดพลาด', err?.message);
    }
  };

  const handleStartEdit = (item: { id?: string; name: string }) => {
    setEditingId(item.id || null);
    setInputValue(item.name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (item: { id?: string; name: string }) => {
    if (!item.id) return;
    const confirmed = await showConfirmDialog('ยืนยันการลบ', `ต้องการลบรายการ "${item.name}" ใช่หรือไม่?`);
    if (confirmed) {
      showLoadingAlert('กำลังลบข้อมูล...');
      try {
        if (type === 'disease') await deleteMasterDisease(item.id);
        else if (type === 'complication') await deleteMasterComplication(item.id);
        else await deleteMasterDrug(item.id);

        closeAlert();
        await showSuccessAlert('ลบข้อมูลสำเร็จ');
        await loadData();
      } catch (err: any) {
        closeAlert();
        showErrorAlert('ลบไม่สำเร็จ', err?.message);
      }
    }
  };

  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-6 bg-emerald-400 rounded-full shrink-0"></span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">{config.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{config.desc}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="self-start md:self-auto p-2 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-100 transition-colors"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* Add / Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <h3 className="font-bold text-base text-slate-800">
            {editingId ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {config.label} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="master-data-input"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={config.placeholder}
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setInputValue('');
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl h-[38px] transition-colors"
              >
                ยกเลิก
              </button>
            )}
            <button
              type="submit"
              id="save-master-btn"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-sm transition-colors flex items-center gap-1.5 h-[38px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingId ? 'บันทึกแก้ไข' : 'เพิ่มข้อมูล'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Items List */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 overflow-hidden">
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="font-semibold text-xs text-slate-700 flex items-center gap-2">
            <span className="w-2 h-4 bg-emerald-400 rounded-full shrink-0"></span>
            <span>รายการทั้งหมด ({items.length} รายการ)</span>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">กำลังโหลดข้อมูล...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">ยังไม่มีข้อมูลในรายการ</div>
          ) : (
            items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 px-5 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/60">
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{item.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
