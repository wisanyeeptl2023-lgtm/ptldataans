import React from 'react';
import {
  X,
  Users,
  HeartPulse,
  AlertTriangle,
  Pill,
  BookOpen,
  FileCheck2,
  PieChart,
  Activity,
  Shield,
  Layers,
  ChevronRight,
  ClipboardCheck
} from 'lucide-react';

export type ActiveTab =
  | 'service_patient'
  | 'service_disease'
  | 'service_complication'
  | 'service_drug'
  | 'service_sentwage'
  | 'master_disease'
  | 'master_complication'
  | 'master_drug'
  | 'master_users'
  | 'dashboard_patient'
  | 'dashboard_disease'
  | 'dashboard_complication'
  | 'dashboard_drug'
  | 'dashboard_sentwage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab
}) => {
  const handleItemClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    // On small screens, close menu on click
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const navSections = [
    {
      title: 'ข้อมูลบริการ (Services)',
      items: [
        {
          id: 'service_patient' as ActiveTab,
          label: 'ทะเบียนผู้ป่วย',
          desc: 'เพิ่ม ลบ แก้ไข ข้อมูลผู้ป่วยและหัตถการ',
          icon: Users,
          badge: 'หลัก'
        },
        {
          id: 'service_disease' as ActiveTab,
          label: 'บันทึกโรคประจำตัว',
          desc: 'บันทึกโรคประจำตัวตาม HN ผู้ป่วย',
          icon: HeartPulse
        },
        {
          id: 'service_complication' as ActiveTab,
          label: 'บันทึก Complication',
          desc: 'บันทึกภาวะแทรกซ้อนและห้องที่เกิด',
          icon: AlertTriangle
        },
        {
          id: 'service_drug' as ActiveTab,
          label: 'บันทึกยา',
          desc: 'บันทึกรายการยาที่ใช้ในวิสัญญี',
          icon: Pill
        },
        {
          id: 'service_sentwage' as ActiveTab,
          label: 'ติดตามการส่งเวร',
          desc: 'บันทึกและประเมินคุณภาพการส่งเวร (SBAR)',
          icon: ClipboardCheck,
          badge: 'SBAR'
        }
      ]
    },
    {
      title: 'ข้อมูลทั่วไป (Master Data)',
      items: [
        {
          id: 'master_disease' as ActiveTab,
          label: 'ข้อมูลโรคประจำตัว',
          desc: 'จัดการรายชื่อโรคประจำตัว',
          icon: BookOpen
        },
        {
          id: 'master_complication' as ActiveTab,
          label: 'ข้อมูล Complication',
          desc: 'จัดการรายชื่อภาวะแทรกซ้อน',
          icon: Layers
        },
        {
          id: 'master_drug' as ActiveTab,
          label: 'ข้อมูลยา',
          desc: 'จัดการรายชื่อยาทางวิสัญญี',
          icon: Pill
        },
        {
          id: 'master_users' as ActiveTab,
          label: 'เมนูผู้ใช้งาน',
          desc: 'จัดการสิทธิ์ผู้ใช้ (รหัสผ่าน: ptlans)',
          icon: Shield,
          badge: 'PIN'
        }
      ]
    },
    {
      title: 'แดชบอร์ด (Dashboards & Reports)',
      items: [
        {
          id: 'dashboard_patient' as ActiveTab,
          label: 'รายงานผู้ป่วย',
          desc: 'สถิติเพศ, ASA, เทคนิค, ค่าเฉลี่ยเวลา',
          icon: PieChart
        },
        {
          id: 'dashboard_disease' as ActiveTab,
          label: 'รายงานโรคประจำตัว',
          desc: 'สรุปจำนวนนับและร้อยละโรค',
          icon: Activity
        },
        {
          id: 'dashboard_complication' as ActiveTab,
          label: 'รายงาน Complication',
          desc: 'สรุปภาวะแทรกซ้อนร่วมกับห้อง',
          icon: FileCheck2
        },
        {
          id: 'dashboard_drug' as ActiveTab,
          label: 'รายงานยา',
          desc: 'สรุปการใช้ยาและห้องบริการ',
          icon: PieChart
        },
        {
          id: 'dashboard_sentwage' as ActiveTab,
          label: 'รายงานส่งเวร',
          desc: 'สรุปผลข้อมูล ความถี่ จำนวน และร้อยละ',
          icon: FileCheck2,
          badge: 'NEW'
        }
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        id="app-navigation-drawer"
        className="fixed inset-y-0 left-0 max-w-xs sm:max-w-sm w-full bg-white z-50 shadow-2xl flex flex-col border-r border-emerald-100 overflow-hidden transform transition-transform duration-200 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-label="เมนูหลักการใช้งาน"
      >
        {/* Drawer Header */}
        <div className="p-4 bg-white border-b border-emerald-100 flex items-center justify-between shadow-2xs">
          <div>
            <h3 className="font-bold text-base text-emerald-900 leading-tight">เมนูระบบงานวิสัญญี</h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5 uppercase tracking-wide">
              โรงพยาบาลพัทลุง | Phatthalung Hospital
            </p>
          </div>
          <button
            type="button"
            id="close-drawer-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            title="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list with smooth scroll */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {navSections.map(section => (
            <div key={section.title} className="space-y-1.5">
              <div className="px-3 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`nav-${item.id}`}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-white font-medium shadow-md'
                          : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-100/70 text-emerald-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold leading-tight truncate">{item.label}</div>
                          <div
                            className={`text-[10px] truncate mt-0.5 ${
                              isActive ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-1">
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tight ${
                              isActive
                                ? 'bg-emerald-600 text-white border border-emerald-400/40'
                                : item.badge === 'PIN'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3.5 h-3.5 ${
                            isActive ? 'text-emerald-100' : 'text-slate-300'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer footer */}
        <div className="p-3 bg-emerald-50/70 border-t border-emerald-100 text-[11px] text-slate-500 text-center font-mono">
          งานวิสัญญี โรงพยาบาลพัทลุง &copy; 2569
        </div>
      </aside>
    </>
  );
};
