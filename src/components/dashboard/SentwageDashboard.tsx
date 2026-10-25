import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  Users,
  Search,
  ChevronDown,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { SentwageRecord, SbarScoreOption, UserLogin } from '../../types';
import { getSentwages, getUsers } from '../../services/db';
import { BEDatePicker } from '../common/BEDatePicker';
import { isDateInRange, getTodayBEDate } from '../../utils/dateUtils';
import { SBAR_ITEMS, SbarItemDef } from '../service/SentwageRecordView';

export const SentwageDashboard: React.FC = () => {
  const [records, setRecords] = useState<SentwageRecord[]>([]);
  const [users, setUsers] = useState<UserLogin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterAsa, setFilterAsa] = useState<string>('');
  const [filterSentwage, setFilterSentwage] = useState<string>('');
  const [filterOwnercase, setFilterOwnercase] = useState<string>('');
  const [filterSection, setFilterSection] = useState<'All' | 'Suitiation' | 'Background' | 'Assessment' | 'Recommendation'>('All');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allRecords, allUsers] = await Promise.all([
        getSentwages(),
        getUsers()
      ]);
      setRecords(allRecords);
      setUsers(allUsers.filter(u => u.status === 'y'));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter records by date, ASA and staff
  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      // Date filter
      if (!isDateInRange(item.notedate, startDate || undefined, endDate || undefined)) {
        return false;
      }
      // ASA filter
      if (filterAsa && String(item.asa) !== filterAsa) {
        return false;
      }
      // Sender filter
      if (filterSentwage && item.sentwage !== filterSentwage) {
        return false;
      }
      // Owner filter
      if (filterOwnercase && item.ownercase !== filterOwnercase) {
        return false;
      }
      return true;
    });
  }, [records, startDate, endDate, filterAsa, filterSentwage, filterOwnercase]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    const total = filteredRecords.length;
    if (total === 0) {
      return {
        total: 0,
        avgScore: 0,
        avgPercent: 0,
        excellentCount: 0,
        excellentPercent: 0,
        moderateCount: 0,
        moderatePercent: 0,
        poorCount: 0,
        poorPercent: 0
      };
    }

    let sumScore = 0;
    let sumPercent = 0;
    let excellent = 0;
    let moderate = 0;
    let poor = 0;

    filteredRecords.forEach(r => {
      const score = Number(r.point) || 0;
      const pct = Number(r.percent) || 0;
      sumScore += score;
      sumPercent += pct;

      if (pct >= 80) excellent++;
      else if (pct >= 60) moderate++;
      else poor++;
    });

    return {
      total,
      avgScore: Number((sumScore / total).toFixed(2)),
      avgPercent: Number((sumPercent / total).toFixed(2)),
      excellentCount: excellent,
      excellentPercent: Number(((excellent / total) * 100).toFixed(1)),
      moderateCount: moderate,
      moderatePercent: Number(((moderate / total) * 100).toFixed(1)),
      poorCount: poor,
      poorPercent: Number(((poor / total) * 100).toFixed(1))
    };
  }, [filteredRecords]);

  // Section-by-Section Statistics (Suitiation, Background, Assessment, Recommendation)
  const sectionStats = useMemo(() => {
    const sections = ['Suitiation', 'Background', 'Assessment', 'Recommendation'] as const;
    const totalRecords = filteredRecords.length;

    return sections.map(secName => {
      const itemsInSec = SBAR_ITEMS.filter(it => it.section === secName);
      if (totalRecords === 0) {
        return {
          section: secName,
          itemCount: itemsInSec.length,
          avgPercent: 0,
          fullCount: 0,
          totalResponses: 0
        };
      }

      let secEarned = 0;
      let secMax = 0;
      let secFull = 0;
      let totalItemsCount = 0;

      filteredRecords.forEach(r => {
        itemsInSec.forEach(it => {
          const val = (r[it.key] as SbarScoreOption) || 'ปฏิบัติครบ';
          totalItemsCount++;
          if (val === 'ปฏิบัติครบ') {
            secEarned += 2;
            secMax += 2;
            secFull++;
          } else if (val === 'ปฏิบัติไม่ครบ') {
            secEarned += 1;
            secMax += 2;
          } else if (val === 'ไม่ปฏิบัติ') {
            secMax += 2;
          }
          // 'NA' excluded
        });
      });

      const avgPercent = secMax > 0 ? Number(((secEarned / secMax) * 100).toFixed(2)) : 0;
      return {
        section: secName,
        itemCount: itemsInSec.length,
        avgPercent,
        fullCount: secFull,
        totalResponses: totalItemsCount
      };
    });
  }, [filteredRecords]);

  // Detailed breakdown per question item (s1-s5, b1-b7, a1-a7, r1-r6)
  // Frequency, count, and percentage
  const itemBreakdown = useMemo(() => {
    const totalRecords = filteredRecords.length;

    const filteredItems = filterSection === 'All'
      ? SBAR_ITEMS
      : SBAR_ITEMS.filter(it => it.section === filterSection);

    return filteredItems.map(itemDef => {
      let countFull = 0; // ปฏิบัติครบ (2)
      let countPartial = 0; // ปฏิบัติไม่ครบ (1)
      let countNone = 0; // ไม่ปฏิบัติ (0)
      let countNA = 0; // NA (-)

      filteredRecords.forEach(r => {
        const val = (r[itemDef.key] as SbarScoreOption) || 'ปฏิบัติครบ';
        if (val === 'ปฏิบัติครบ') countFull++;
        else if (val === 'ปฏิบัติไม่ครบ') countPartial++;
        else if (val === 'ไม่ปฏิบัติ') countNone++;
        else if (val === 'NA') countNA++;
      });

      const evaluatedCount = countFull + countPartial + countNone;
      const totalCount = totalRecords;

      // Percentages out of total records
      const pctFull = totalCount > 0 ? Number(((countFull / totalCount) * 100).toFixed(1)) : 0;
      const pctPartial = totalCount > 0 ? Number(((countPartial / totalCount) * 100).toFixed(1)) : 0;
      const pctNone = totalCount > 0 ? Number(((countNone / totalCount) * 100).toFixed(1)) : 0;
      const pctNA = totalCount > 0 ? Number(((countNA / totalCount) * 100).toFixed(1)) : 0;

      // Compliance percentage (excluding NA)
      const compliancePct = evaluatedCount > 0
        ? Number((((countFull * 2 + countPartial * 1) / (evaluatedCount * 2)) * 100).toFixed(1))
        : 100;

      return {
        key: itemDef.key,
        label: itemDef.label,
        section: itemDef.section,
        countFull,
        pctFull,
        countPartial,
        pctPartial,
        countNone,
        pctNone,
        countNA,
        pctNA,
        compliancePct
      };
    });
  }, [filteredRecords, filterSection]);

  // Staff Performance Summary
  const staffSummary = useMemo(() => {
    const stats: Record<string, { sentCount: number; ownerCount: number; sentTotalPct: number }> = {};

    filteredRecords.forEach(r => {
      if (r.sentwage) {
        if (!stats[r.sentwage]) {
          stats[r.sentwage] = { sentCount: 0, ownerCount: 0, sentTotalPct: 0 };
        }
        stats[r.sentwage].sentCount += 1;
        stats[r.sentwage].sentTotalPct += Number(r.percent) || 0;
      }

      if (r.ownercase) {
        if (!stats[r.ownercase]) {
          stats[r.ownercase] = { sentCount: 0, ownerCount: 0, sentTotalPct: 0 };
        }
        stats[r.ownercase].ownerCount += 1;
      }
    });

    return Object.entries(stats).map(([name, data]) => {
      const avgSentPct = data.sentCount > 0 ? Number((data.sentTotalPct / data.sentCount).toFixed(2)) : 0;
      return {
        name,
        sentCount: data.sentCount,
        ownerCount: data.ownerCount,
        avgSentPct
      };
    }).sort((a, b) => b.sentCount - a.sentCount);
  }, [filteredRecords]);

  // ASA Distribution Statistics (Grade 1 - 6)
  const asaStats = useMemo(() => {
    const total = filteredRecords.length;
    const counts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };

    filteredRecords.forEach(r => {
      const g = String(r.asa || '1').trim();
      if (counts[g] !== undefined) {
        counts[g]++;
      } else {
        counts['1']++;
      }
    });

    return ['1', '2', '3', '4', '5', '6'].map(grade => {
      const count = counts[grade] || 0;
      const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
      return { grade, count, pct };
    });
  }, [filteredRecords]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      'idwage',
      'notedate',
      'hn',
      'asa',
      'sentwage',
      'ownercase',
      'point',
      'percent',
      'ect',
      ...SBAR_ITEMS.map(it => `${it.key}_${it.label.replace(/,/g, ' ')}`)
    ];

    const rows = filteredRecords.map(r => [
      r.idwage,
      r.notedate,
      `"${r.hn || ''}"`,
      `"${r.asa || '1'}"`,
      `"${r.sentwage || ''}"`,
      `"${r.ownercase || ''}"`,
      r.point,
      r.percent,
      `"${(r.ect || '').replace(/"/g, '""')}"`,
      ...SBAR_ITEMS.map(it => `"${r[it.key] || 'ปฏิบัติครบ'}"`)
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายงานติดตามการส่งเวร_${getTodayBEDate().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilterAsa('');
    setFilterSentwage('');
    setFilterOwnercase('');
    setFilterSection('All');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 rounded-2xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-700/60 backdrop-blur-xs rounded-full text-xs font-semibold text-teal-100 mb-2 border border-teal-500/30">
              <BarChart3 className="w-3.5 h-3.5 text-teal-300" />
              <span>SBAR Handover Analytics & QA Report</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              รายงานส่งเวร (Handover Report & Dashboard)
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
              สรุปผลข้อมูลตามคอลัมน์และประเภทข้อมูล ความถี่ จำนวน และร้อยละ พร้อมเลือกช่วงวันที่และกรองตามผู้ส่งเวร/เจ้าของเคส
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-medium transition backdrop-blur-xs border border-white/10 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>ตัวกรองข้อมูลรายงาน (เลือกช่วงวันที่ notedate, ระดับ ASA และเจ้าหน้าที่)</span>
          </div>
          {(startDate || endDate || filterAsa || filterSentwage || filterOwnercase || filterSection !== 'All') && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {/* Start Date */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              ตั้งแต่วันที่ (notedate)
            </label>
            <BEDatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="วว/ดด/ปปปป (พ.ศ.)"
              className="text-xs py-1.5"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              ถึงวันที่ (notedate)
            </label>
            <BEDatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="วว/ดด/ปปปป (พ.ศ.)"
              className="text-xs py-1.5"
            />
          </div>

          {/* ASA Filter */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              ระดับ ASA (1 - 6)
            </label>
            <select
              value={filterAsa}
              onChange={e => setFilterAsa(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium"
            >
              <option value="">ทั้งหมด (ทุกระดับ ASA)</option>
              <option value="1">ASA 1</option>
              <option value="2">ASA 2</option>
              <option value="3">ASA 3</option>
              <option value="4">ASA 4</option>
              <option value="5">ASA 5</option>
              <option value="6">ASA 6</option>
            </select>
          </div>

          {/* Sentwage dropdown */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              ผู้ส่งเวร (sentwage)
            </label>
            <select
              value={filterSentwage}
              onChange={e => setFilterSentwage(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
            >
              <option value="">ทั้งหมด</option>
              {users.map(u => (
                <option key={`f_sent_${u.AN}`} value={u.AN}>
                  {u.AN}
                </option>
              ))}
            </select>
          </div>

          {/* Ownercase dropdown */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              เจ้าของ Case (ownercase)
            </label>
            <select
              value={filterOwnercase}
              onChange={e => setFilterOwnercase(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
            >
              <option value="">ทั้งหมด</option>
              {users.map(u => (
                <option key={`f_owner_${u.AN}`} value={u.AN}>
                  {u.AN}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Handover Card */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              จำนวนครั้งส่งเวรทั้งหมด
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-800">
              {overallStats.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">ครั้ง</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {startDate || endDate ? 'ตามช่วงวันที่ที่เลือก' : 'ข้อมูลทั้งหมดในระบบ'}
          </p>
        </div>

        {/* Average Compliance % */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ร้อยละความสมบูรณ์เฉลี่ย
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-800">
              {overallStats.avgPercent}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              (คะแนนเฉลี่ย {overallStats.avgScore})
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overallStats.avgPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Excellent Count */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              เกณฑ์ดีเยี่ยม (≥ 80%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-700">
              {overallStats.excellentCount}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {overallStats.excellentPercent}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ปฏิบัติตามมาตรฐานอย่างครบถ้วน</p>
        </div>

        {/* Needs Improvement Count */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ต้องพัฒนา/ปรับปรุง (&lt; 80%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-amber-700">
              {overallStats.moderateCount + overallStats.poorCount}
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {overallStats.total > 0
                ? Number((((overallStats.moderateCount + overallStats.poorCount) / overallStats.total) * 100).toFixed(1))
                : 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ปานกลาง {overallStats.moderateCount} เคส | ปรับปรุง {overallStats.poorCount} เคส
          </p>
        </div>
      </div>

      {/* ASA Classification Breakdown (ความถี่และร้อยละตาม ASA 1 - 6) */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span>สรุปการส่งเวรจำแนกตาม ASA Physical Status (ระดับ 1 - 6)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ความถี่ (ครั้ง) และสัดส่วนร้อยละ (%) ของผู้ป่วยแต่ละระดับ ASA ในช่วงข้อมูลที่เลือก
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
            รวม {overallStats.total} เคส
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {asaStats.map(item => (
            <div
              key={`asa_card_${item.grade}`}
              onClick={() => setFilterAsa(filterAsa === item.grade ? '' : item.grade)}
              className={`p-3 rounded-xl border transition-all cursor-pointer text-center ${
                filterAsa === item.grade
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300 shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 hover:border-purple-300 hover:bg-white'
              }`}
              title={`คลิกเพื่อกรองเฉพาะ ASA ${item.grade}`}
            >
              <div className="text-[11px] font-bold text-slate-500 uppercase">
                ASA {item.grade}
              </div>
              <div className="text-xl font-black font-mono text-purple-900 mt-1">
                {item.count} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
              </div>
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[11px] bg-purple-100 text-purple-800">
                  {item.pct}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(item.pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SBAR 4 Dimensions Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sectionStats.map(sec => (
          <div
            key={sec.section}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {sec.section}
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {sec.itemCount} ข้อ
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black font-mono text-emerald-800">
                {sec.avgPercent}%
              </span>
              <span className="text-xs text-slate-500">
                ครบถ้วน: {sec.fullCount} ครั้ง
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-500"
                style={{ width: `${Math.min(sec.avgPercent, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Analysis Table: Breakdown by Column and Data Type (Frequency, Count, Percentage) */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>สรุปผลข้อมูลตามคอลัมน์และประเภทข้อมูล (ความถี่, จำนวน, ร้อยละ)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงการกระจายตัวของตัวเลือก 4 ประเภท (ปฏิบัติครบ, ปฏิบัติไม่ครบ, ไม่ปฏิบัติ, NA) ในแต่ละหัวข้อย่อย
            </p>
          </div>

          {/* Section filter */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
            <span className="text-slate-400 text-xs shrink-0 mr-1">กรองหัวข้อ:</span>
            {(['All', 'Suitiation', 'Background', 'Assessment', 'Recommendation'] as const).map(sec => (
              <button
                key={sec}
                onClick={() => setFilterSection(sec)}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer text-xs ${
                  filterSection === sec
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sec === 'All' ? 'ทั้งหมด' : sec}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-16">รหัส</th>
                <th className="py-3 px-3 min-w-[200px]">หัวข้อการประเมิน (Column)</th>
                <th className="py-3 px-3 text-center bg-emerald-50/60 text-emerald-900 border-l border-emerald-100">
                  ปฏิบัติครบ (2 คะแนน)
                  <div className="text-[10px] font-normal text-emerald-700">จำนวน / ร้อยละ</div>
                </th>
                <th className="py-3 px-3 text-center bg-amber-50/60 text-amber-900 border-l border-amber-100">
                  ปฏิบัติไม่ครบ (1 คะแนน)
                  <div className="text-[10px] font-normal text-amber-700">จำนวน / ร้อยละ</div>
                </th>
                <th className="py-3 px-3 text-center bg-rose-50/60 text-rose-900 border-l border-rose-100">
                  ไม่ปฏิบัติ (0 คะแนน)
                  <div className="text-[10px] font-normal text-rose-700">จำนวน / ร้อยละ</div>
                </th>
                <th className="py-3 px-3 text-center bg-slate-100/60 text-slate-800 border-l border-slate-200">
                  NA (ไม่นำมาคิด)
                  <div className="text-[10px] font-normal text-slate-600">จำนวน / ร้อยละ</div>
                </th>
                <th className="py-3 px-3 text-center border-l border-slate-200 min-w-[110px]">
                  อัตราความสมบูรณ์
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {itemBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลการประเมินตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                itemBreakdown.map(item => (
                  <tr key={item.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {item.key}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 leading-tight">
                        {item.label}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        หมวด: {item.section}
                      </span>
                    </td>

                    {/* ปฏิบัติครบ */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-100 bg-emerald-50/20 font-mono">
                      <div className="font-bold text-emerald-800">
                        {item.countFull} ครั้ง
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        ({item.pctFull}%)
                      </div>
                    </td>

                    {/* ปฏิบัติไม่ครบ */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-100 bg-amber-50/20 font-mono">
                      <div className="font-bold text-amber-800">
                        {item.countPartial} ครั้ง
                      </div>
                      <div className="text-[10px] text-amber-600 font-semibold">
                        ({item.pctPartial}%)
                      </div>
                    </td>

                    {/* ไม่ปฏิบัติ */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-100 bg-rose-50/20 font-mono">
                      <div className="font-bold text-rose-800">
                        {item.countNone} ครั้ง
                      </div>
                      <div className="text-[10px] text-rose-600 font-semibold">
                        ({item.pctNone}%)
                      </div>
                    </td>

                    {/* NA */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-100 bg-slate-50/40 font-mono">
                      <div className="font-bold text-slate-700">
                        {item.countNA} ครั้ง
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        ({item.pctNA}%)
                      </div>
                    </td>

                    {/* Compliance */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-100">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                          item.compliancePct >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.compliancePct >= 60
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.compliancePct}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Activity Breakdown */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>สรุปผลการส่งเวรตามรายชื่อเจ้าหน้าที่ (tbllogin status='y')</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ความถี่การส่งเวร (ผู้ส่งเวร) และความถี่การเป็นเจ้าของเคส (เจ้าของเคส)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">ชื่อ-สกุล วิสัญญีพยาบาล (AN)</th>
                <th className="py-3 px-4 text-center">เป็นผู้ส่งเวร (ครั้ง)</th>
                <th className="py-3 px-4 text-center">คะแนนเฉลี่ยที่ประเมินได้ (%)</th>
                <th className="py-3 px-4 text-center">เป็นเจ้าของเคส (ครั้ง)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {staffSummary.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    ไม่พบข้อมูลเจ้าหน้าที่ตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                staffSummary.map((st, idx) => (
                  <tr key={st.name} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{st.name}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-700">
                      {st.sentCount}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {st.avgSentPct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-700">
                      {st.ownerCount}
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
