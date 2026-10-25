import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { getTodayBEDate } from '../../utils/dateUtils';

interface BEDatePickerProps {
  id?: string;
  value: string; // formatted in dd/mm/yyyy BE
  onChange: (val: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export const BEDatePicker: React.FC<BEDatePickerProps> = ({
  id,
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'วว/ดด/ปปปป (พ.ศ.)'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Parse current value or fallback to today
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return { day: d, month: m - 1, beYear: y };
      }
    }
    return null;
  }, [value]);

  const today = useMemo(() => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth(),
      beYear: now.getFullYear() + 543
    };
  }, []);

  const [viewMonth, setViewMonth] = useState<number>(parsedDate ? parsedDate.month : today.month);
  const [viewYearBE, setViewYearBE] = useState<number>(parsedDate ? parsedDate.beYear : today.beYear);

  // Sync view when opened
  useEffect(() => {
    if (isOpen) {
      if (parsedDate) {
        setViewMonth(parsedDate.month);
        setViewYearBE(parsedDate.beYear);
      } else {
        setViewMonth(today.month);
        setViewYearBE(today.beYear);
      }
    }
  }, [isOpen, parsedDate, today]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYearBE(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYearBE(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const dd = String(day).padStart(2, '0');
    const mm = String(viewMonth + 1).padStart(2, '0');
    const formatted = `${dd}/${mm}/${viewYearBE}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    onChange(getTodayBEDate());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  // Calendar calculations
  const ceYear = viewYearBE - 543;
  const firstDayOfWeek = new Date(ceYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(ceYear, viewMonth + 1, 0).getDate();

  // Year options around current view year
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    const base = today.beYear;
    for (let y = base - 10; y <= base + 5; y++) {
      years.push(y);
    }
    if (!years.includes(viewYearBE)) {
      years.push(viewYearBE);
      years.sort((a, b) => a - b);
    }
    return years;
  }, [today.beYear, viewYearBE]);

  return (
    <div ref={containerRef} className="relative flex items-center">
      <input
        type="text"
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 text-slate-700 ${className}`}
      />
      <button
        type="button"
        id={id ? `${id}-picker-btn` : 'datepicker-btn'}
        onClick={() => setIsOpen(prev => !prev)}
        className="absolute right-2.5 text-emerald-600 hover:text-emerald-800 p-1 transition-colors cursor-pointer"
        title="เลือกวันที่ (พ.ศ.)"
        aria-label="เลือกวันที่"
      >
        <Calendar className="w-4 h-4" />
      </button>

      {/* Buddhist Era Calendar Popover */}
      {isOpen && (
        <div
          className="absolute top-full mt-1.5 left-0 z-50 w-72 bg-white rounded-xl shadow-2xl border border-emerald-100 p-3 select-none animate-in fade-in zoom-in-95 duration-100"
          style={{ minWidth: '280px' }}
        >
          {/* Header Month / Year controls */}
          <div className="flex items-center justify-between gap-1 mb-2.5 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={e => setViewMonth(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {THAI_MONTHS_FULL.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYearBE}
                onChange={e => setViewYearBE(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>
                    พ.ศ. {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 mb-1">
            {THAI_DAYS_SHORT.map((day, idx) => (
              <span key={day} className={idx === 0 ? 'text-rose-500' : ''}>
                {day}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                parsedDate &&
                parsedDate.day === day &&
                parsedDate.month === viewMonth &&
                parsedDate.beYear === viewYearBE;
              const isToday =
                today.day === day &&
                today.month === viewMonth &&
                today.beYear === viewYearBE;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : isToday
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-300 hover:bg-emerald-100'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="flex items-center gap-1 text-emerald-700 font-medium hover:text-emerald-900 px-1.5 py-0.5 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3" />
              <span>วันนี้ ({getTodayBEDate()})</span>
            </button>
            <div className="flex items-center gap-1">
              {!required && value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-slate-400 hover:text-rose-600 px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  ล้าง
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
