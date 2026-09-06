import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  BarChart3,
  Calendar,
  RefreshCw,
  PieChart as PieIcon,
  Layers
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
import { DiseaseRecord } from '../../types';
import { getDiseaseRecords } from '../../services/db';
import { BEDatePicker } from '../common/BEDatePicker';
import { isDateInRange } from '../../utils/dateUtils';

const CHART_COLORS = [
  '#e11d48', // rose
  '#059669', // emerald
  '#0284c7', // sky
  '#f59e0b', // amber
  '#7c3aed', // violet
  '#ea580c', // orange
  '#0d9488', // teal
  '#4f46e5', // indigo
  '#10b981', // green
  '#64748b'  // slate
];

export const DiseaseDashboard: React.FC = () => {
  const [records, setRecords] = useState<DiseaseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getDiseaseRecords();
      setRecords(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter records by operdate in Buddhist Era
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (startDate || endDate) {
        return isDateInRange(r.operdate, startDate, endDate);
      }
      return true;
    });
  }, [records, startDate, endDate]);

  const totalPatientsWithDis = filteredRecords.length;

  // Aggregate count and percentage by disease (dis)
  const diseaseStats = useMemo(() => {
    if (totalPatientsWithDis === 0) return [];
    const counts: Record<string, number> = {};

    filteredRecords.forEach(r => {
      const d = r.dis?.trim() || '(ไม่ระบุ)';
      counts[d] = (counts[d] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: ((count / totalPatientsWithDis) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords, totalPatientsWithDis]);

  return (
    <div className="space-y-6">
      {/* Header & Date Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-6 bg-emerald-400 rounded-full shrink-0"></span>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              รายงานโรคประจำตัว
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              สรุปผลจำนวนนับและร้อยละผู้รับบริการตามโรคประจำตัว ในรูปแบบตารางและกราฟ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50/60 p-1.5 px-3 rounded-2xl border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              ช่วงวันที่ทำหัตถการ (พ.ศ.):
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

      {/* Overview Stats (Natural Tones) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 hover:border-emerald-100 transition-all">
          <p className="text-sm text-slate-500 font-medium">บันทึกโรคประจำตัวทั้งหมด</p>
          <h3 className="text-3xl font-black text-emerald-600 font-mono mt-1">
            {totalPatientsWithDis.toLocaleString()}
          </h3>
          <p className="text-xs text-slate-400 mt-1">ครั้งที่ได้รับการวินิจฉัย</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 hover:border-emerald-100 transition-all">
          <p className="text-sm text-slate-500 font-medium">จำนวนชนิดโรคที่พบ</p>
          <h3 className="text-3xl font-black text-emerald-600 font-mono mt-1">
            {diseaseStats.length}
          </h3>
          <p className="text-xs text-slate-400 mt-1">โรคประจำตัวที่แตกต่างกัน</p>
        </div>
      </div>

      {/* Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-700 flex items-center gap-2">
              <span className="w-2 h-5 bg-emerald-400 rounded-full shrink-0"></span>
              <span>แผนภูมิแท่งแสดงจำนวนผู้ป่วยแยกตามโรค</span>
            </h3>
          </div>

          <div className="w-full h-72">
            {diseaseStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                ไม่มีข้อมูลในช่วงเวลาที่เลือก
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diseaseStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    tick={{ fontSize: 10, fill: '#475569' }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} ราย (${((val / totalPatientsWithDis) * 100).toFixed(1)}%)`, 'จำนวน']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, borderColor: '#d1fae5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {diseaseStats.map((_, index) => (
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
              <span>ตารางสรุปจำนวนนับและร้อยละ (dis)</span>
            </h3>
          </div>

          <div className="overflow-y-auto max-h-72 rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">โรคประจำตัว (dis)</th>
                  <th className="py-3 px-4 text-right">จำนวนนับ (ราย)</th>
                  <th className="py-3 px-4 text-right">ร้อยละ (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {diseaseStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  diseaseStats.map((item, idx) => (
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
