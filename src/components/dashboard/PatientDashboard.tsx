import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Filter,
  RefreshCw,
  Users,
  Clock,
  Activity,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { PatientRecord } from '../../types';
import { getPatients } from '../../services/db';
import { BEDatePicker } from '../common/BEDatePicker';
import { isDateInRange } from '../../utils/dateUtils';

const CHART_COLORS = [
  '#059669', // emerald
  '#0284c7', // sky
  '#f59e0b', // amber
  '#e11d48', // rose
  '#7c3aed', // violet
  '#0d9488', // teal
  '#ea580c', // orange
  '#4f46e5', // indigo
  '#10b981', // green
  '#64748b'  // slate
];

export const PatientDashboard: React.FC = () => {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedBreakdown, setSelectedBreakdown] = useState<
    'sex' | 'ASA' | 'pct' | 'tegnic' | 'Airway' | 'disect' | 'PainIn' | 'PainOut' | 'postopvisit' | 'AN' | 'chknote'
  >('tegnic');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getPatients();
      setPatients(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter patients by non-empty HN and operdate range
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      if (!p.hn || !p.hn.trim()) return false;
      if (startDate || endDate) {
        return isDateInRange(p.operdate, startDate, endDate);
      }
      return true;
    });
  }, [patients, startDate, endDate]);

  const totalCount = filteredPatients.length;

  // Averages: age, TimeOR, TimePACU
  const averages = useMemo(() => {
    if (totalCount === 0) return { age: 0, timeOR: 0, timePACU: 0 };
    let sumAge = 0, countAge = 0;
    let sumTimeOR = 0, countTimeOR = 0;
    let sumTimePACU = 0, countTimePACU = 0;

    filteredPatients.forEach(p => {
      const numAge = parseFloat(p.age);
      if (!isNaN(numAge)) {
        sumAge += numAge;
        countAge++;
      }
      const numOR = parseFloat(p.TimeOR);
      if (!isNaN(numOR)) {
        sumTimeOR += numOR;
        countTimeOR++;
      }
      const numPACU = parseFloat(p.TimePACU);
      if (!isNaN(numPACU)) {
        sumTimePACU += numPACU;
        countTimePACU++;
      }
    });

    return {
      age: countAge ? (sumAge / countAge).toFixed(1) : '0',
      timeOR: countTimeOR ? (sumTimeOR / countTimeOR).toFixed(1) : '0',
      timePACU: countTimePACU ? (sumTimePACU / countTimePACU).toFixed(1) : '0'
    };
  }, [filteredPatients, totalCount]);

  // Breakdown counts and percentages
  const breakdownData = useMemo(() => {
    if (totalCount === 0) return [];
    const counts: Record<string, number> = {};

    filteredPatients.forEach(p => {
      const val = (p[selectedBreakdown] as string) || '(ไม่ระบุ)';
      counts[val] = (counts[val] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: ((count / totalCount) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredPatients, totalCount, selectedBreakdown]);

  const breakdownLabels: Record<string, string> = {
    sex: 'เพศ (sex)',
    ASA: 'ระดับความเสี่ยง (ASA)',
    pct: 'แผนก (pct)',
    tegnic: 'วิธีระงับความรู้สึก (tegnic)',
    Airway: 'ทางเดินหายใจ (Airway)',
    disect: 'อุณหภูมิร่างกาย (disect)',
    PainIn: 'Pain In',
    PainOut: 'Pain Out',
    postopvisit: 'การเยี่ยมหลังผ่าตัด (postopvisit)',
    AN: 'ชื่อพยาบาลดมยา (AN)',
    chknote: 'ชื่อผู้บันทึกข้อมูล (chknote)'
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-6 bg-emerald-400 rounded-full shrink-0"></span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                รายงานผู้ป่วย (tblPateint)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                สรุปจำนวนนับ ร้อยละ และค่าเฉลี่ยตัวชี้วัดสำคัญทางการพยาบาลวิสัญญี
              </p>
            </div>
          </div>
        </div>

        {/* Date Filters in Buddhist Era */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50/60 p-1.5 px-3 rounded-2xl border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              ช่วงเวลา operdate:
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
                title="ล้างตัวกรองวันที่"
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

      {/* Summary KPI Cards & Averages (Natural Tones Stats Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 hover:border-emerald-100 transition-all">
          <p className="text-sm text-slate-500 font-medium">ผู้รับบริการรวม (HN)</p>
          <h3 className="text-3xl font-black text-emerald-600 font-mono mt-1">
            {totalCount.toLocaleString()}
          </h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {filteredPatients.length > 0 ? '✓ ข้อมูลพร้อมวิเคราะห์' : 'รอการบันทึก'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 hover:border-emerald-100 transition-all">
          <p className="text-sm text-slate-500 font-medium">ค่าเฉลี่ยอายุ (age)</p>
          <h3 className="text-3xl font-black text-emerald-600 font-mono mt-1">
            {averages.age}
          </h3>
          <p className="text-xs text-slate-400 mt-1">ปี (Mean Age)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 hover:border-emerald-100 transition-all">
          <p className="text-sm text-slate-500 font-medium">เวลาผ่าตัดเฉลี่ย (TimeOR)</p>
          <h3 className="text-3xl font-black text-emerald-600 font-mono mt-1">
            {averages.timeOR}
          </h3>
          <p className="text-xs text-slate-400 mt-1">นาที (ห้องผ่าตัด)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 hover:border-emerald-100 transition-all">
          <p className="text-sm text-slate-500 font-medium">เวลาพักฟื้นเฉลี่ย (TimePACU)</p>
          <h3 className="text-3xl font-black text-emerald-600 font-mono mt-1">
            {averages.timePACU}
          </h3>
          <p className="text-xs text-slate-400 mt-1">นาที (ห้องพักฟื้น)</p>
        </div>
      </div>

      {/* Breakdown Selector */}
      <div className="bg-white p-5 rounded-3xl border border-emerald-50 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>เลือกมิติข้อมูลสำหรับวิเคราะห์ (จำนวนนับ & ร้อยละ):</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(breakdownLabels) as Array<keyof typeof breakdownLabels>).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedBreakdown(key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedBreakdown === key
                    ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {breakdownLabels[key]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart & Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart View */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-700 flex items-center gap-2">
              <span className="w-2 h-5 bg-emerald-400 rounded-full shrink-0"></span>
              <span>แผนภูมิสัดส่วน: {breakdownLabels[selectedBreakdown]}</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">รวม {totalCount} ราย</span>
          </div>

          <div className="w-full h-72">
            {breakdownData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                ไม่มีข้อมูลในช่วงเวลาที่เลือก
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    tick={{ fontSize: 10, fill: '#475569' }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} ราย (${((val / totalCount) * 100).toFixed(1)}%)`, 'จำนวน']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, borderColor: '#d1fae5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {breakdownData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-700 flex items-center gap-2">
              <span className="w-2 h-5 bg-emerald-400 rounded-full shrink-0"></span>
              <span>ตารางสรุปจำนวนนับและร้อยละ</span>
            </h3>
          </div>

          <div className="overflow-y-auto max-h-72 rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">รายการ</th>
                  <th className="py-3 px-4 text-right">จำนวนนับ (ราย)</th>
                  <th className="py-3 px-4 text-right">ร้อยละ (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {breakdownData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  breakdownData.map((item, idx) => (
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
