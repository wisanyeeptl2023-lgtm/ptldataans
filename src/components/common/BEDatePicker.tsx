import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { convertIsoToBEDate, convertBEDateToIso } from '../../utils/dateUtils';

interface BEDatePickerProps {
  id?: string;
  value: string; // formatted in dd/mm/yyyy BE
  onChange: (val: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const BEDatePicker: React.FC<BEDatePickerProps> = ({
  id,
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'วว/ดด/ปปปป (พ.ศ.)'
}) => {
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);
  const isoValue = convertBEDateToIso(value);

  const handleIsoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    if (iso) {
      const beStr = convertIsoToBEDate(iso);
      onChange(beStr);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        id={id}
        value={value}
        onChange={handleTextChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 text-slate-700 ${className}`}
      />
      <button
        type="button"
        id={id ? `${id}-picker-btn` : 'datepicker-btn'}
        onClick={() => hiddenDateInputRef.current?.showPicker?.() || hiddenDateInputRef.current?.click()}
        className="absolute right-2.5 text-emerald-600 hover:text-emerald-800 p-1 transition-colors"
        title="เลือกวันที่ (พ.ศ.)"
      >
        <Calendar className="w-4 h-4" />
      </button>
      {/* Hidden native date input to trigger browser native date picker widget */}
      <input
        ref={hiddenDateInputRef}
        type="date"
        value={isoValue}
        onChange={handleIsoChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
};
