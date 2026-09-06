import React, { useState, useEffect, useMemo } from 'react';
import {
  Pill,
  BarChart3,
  Calendar,
  RefreshCw,
  PieChart as PieIcon,
  Layers,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { DrugServRecord, ComplicationRecord, PatientRecord } from '../../types';
import { getDrugServRecords, getOperationRecords, getPatients } from '../../services/db';
import { BEDatePicker } from '../common/BEDatePicker';
import { isDateInRange } from '../../utils/dateUtils';

const CHART_COLORS = [
  '#0d9488', // teal
  '#0284c7', // sky
  '#059669', // emerald
  '#e11d48', // rose
  '#f59e0b', // amber
  '#7c3aed', // violet
  '#ea580c', // orange
  '#4f46e5', // indigo
  '#10b981', // green
  '#64748b'  // slate
];

export const DrugDashboard: React.FC = () => {
  const [drugs, setDrugs] = useState<DrugServRecord[]>([]);
  const [operations, setOperations] = useState<ComplicationRecord[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [metricMode, setMetricMode] = useState<'drugname' | 'riskroom'>('drugname');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dList, opList, pList] = await Promise.all([
        getDrugServRecords(),
        getOperationRecords(),
        getPatients()
      ]);
      setDrugs(dList);
      setOperations(opList);
      setPatients(pList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Multi-table JOIN:
  // tblDrugServ -> joint tblOperation on idoper
  // tblOperation -> joint tblPateint on idpat to get operdate
  const joinedDrugRecords = useMemo(() => {
    const opMap = new Map<string, ComplicationRecord>();
    operations.forEach(op => {
      if (op.idoper) opMap.set(op.idoper, op);
    });

    const patMap = new Map<string, PatientRecord>();
    patients.forEach(p => {
      if (p.idpat) patMap.set(p.idpat, p);
    });

    return drugs.filter(dr => {
      const op = opMap.get(dr.idoper);
      let operdate = '';
      if (op) {
        const pat = patMap.get(op.idpat);
        if (pat) operdate = pat.operdate;
      }

      if (startDate || endDate) {
        if (!operdate) return true; // keep if unknown or filter
        return isDateInRange(operdate, startDate, endDate);
      }
      return true;
    });
  }, [drugs, operations, patients, startDate, endDate]);

  const totalDrugCount = joinedDrugRecords.length;

  // Breakdown by drugname
  const drugnameStats = useMemo(() => {
    if (totalDrugCount === 0) return [];
    const counts: Record<string, number> = {};

    joinedDrugRecords.forEach(r => {
      const d = r.drugname?.trim() || '(ไม่ระบุ)';
      counts[d] = (counts[d] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: ((count / totalDrugCount) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  }, [joinedDrugRecords, totalDrugCount]);

  // Breakdown by riskroom
  const riskroomStats = useMemo(() => {
    if (totalDrugCount === 0) return [];
    const counts: Record<string, number> = {};

    joinedDrugRecords.forEach(r => {
      const rm = r.riskroom?.trim() || '(ไม่ระบุ)';
      counts[rm] = (counts[rm] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: ((count / totalDrugCount) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  }, [joinedDrugRecords, totalDrugCount]);

  const activeStats = metricMode === 'drugname' ? drugnameStats : riskroomStats;

  return (
    <div className="space-y-6">
      {/* Header & Date Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-6 bg-emerald-400 rounded-full shrink-0"></span>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              รายงานยา (tblDrugServ)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              วิเคราะห์การใช้ยา (joint tblOperation ด้วย idoper และ joint tblPateint ด้วย idpat)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50/60 p-1.5 px-3 rounded-2xl border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              ช่วงเวลา operdate (พ.ศ.):
            </span>
            <div className="w-36">
              <BEDatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="จากวันที่ (พ.ศ.)"
              />
            </div>
            <span className="text-xs text-slate-400">ถึง</span>
            <div className="w-36">
              <BEDatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="ถึงวันที่ (พ.ศ.)"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-red-600 hover:text-red-800 font-medium px-1.5"
                title="ล้างตัวกรอง"
              >
                ล้าง
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={loadData}
            className="p-2 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-100 transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary metric selector */}
      <div className="bg-white p-5 rounded-3xl border border-emerald-50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">รายการยารวม:</span>
          <span className="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            {totalDrugCount} ครั้ง
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">ดูรายงานแยกตาม:</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMetricMode('drugname')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                metricMode === 'drugname'
                  ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              ชื่อยา (drugname)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('riskroom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                metricMode === 'riskroom'
                  ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              ห้องบริการ (riskroom)
            </button>
          </div>
        </div>
      </div>

      {/* Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-700 flex items-center gap-2">
              <span className="w-2 h-5 bg-emerald-400 rounded-full shrink-0"></span>
              <span>
                แผนภูมิแท่งสรุป: {metricMode === 'drugname' ? 'ชื่อยาที่ใช้' : 'ห้องบริการ'}
              </span>
            </h3>
          </div>

          <div className="w-full h-72">
            {activeStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                ไม่มีข้อมูลในช่วงเวลาที่เลือก
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    tick={{ fontSize: 10, fill: '#475569' }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} ครั้ง (${((val / totalDrugCount) * 100).toFixed(1)}%)`, 'จำนวน']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, borderColor: '#d1fae5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {activeStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-700 flex items-center gap-2">
              <span className="w-2 h-5 bg-emerald-400 rounded-full shrink-0"></span>
              <span>ตารางสรุปจำนวนนับและร้อยละ ({metricMode})</span>
            </h3>
          </div>

          <div className="overflow-y-auto max-h-72 rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">รายการ</th>
                  <th className="py-3 px-4 text-right">จำนวนนับ (ครั้ง)</th>
                  <th className="py-3 px-4 text-right">ร้อยละ (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  activeStats.map((item, idx) => (
                    <tr key={item.name} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-2.5 px-4 font-medium flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        <span>{item.name}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">
                        {item.count.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700 font-bold">
                        {item.percent}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
