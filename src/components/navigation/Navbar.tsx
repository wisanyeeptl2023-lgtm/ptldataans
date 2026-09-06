import React from 'react';
import { Menu, LogOut, User, Activity, Hospital } from 'lucide-react';
import { UserLogin } from '../../types';

interface NavbarProps {
  currentUser: UserLogin | null;
  onToggleMenu: () => void;
  onLogout: () => void;
  activeMenuTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onToggleMenu,
  onLogout,
  activeMenuTitle
}) => {
  const userInitial = currentUser?.AN ? currentUser.AN.trim().charAt(0) : 'A';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-emerald-100 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Hamburger button + Hospital Brand */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              type="button"
              id="hamburger-toggle-btn"
              onClick={onToggleMenu}
              className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-colors"
              title="เปิด/ปิด เมนูนำทาง (Hamburger Menu)"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-200/80 text-emerald-700 shadow-xs">
                <Hospital className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base sm:text-lg font-bold text-emerald-900 leading-tight">
                  ทะเบียนผู้ป่วย งานวิสัญญี
                </h1>
                <p className="text-[10px] sm:text-xs text-emerald-600 font-medium tracking-wide uppercase">
                  โรงพยาบาลพัทลุง | Phatthalung Hospital
                </p>
              </div>
            </div>
          </div>

          {/* Center: Current view breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50/80 px-3.5 py-1.5 rounded-full border border-emerald-200/70 shadow-2xs">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">กำลังใช้งาน:</span>
            <span className="font-semibold text-emerald-900">{activeMenuTitle}</span>
          </div>

          {/* Right: Current User & Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {currentUser && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800 leading-tight">
                    {currentUser.AN}
                  </div>
                  <div className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full inline-block font-semibold mt-0.5 uppercase tracking-wide">
                    ADMIN ({currentUser.status.toUpperCase()})
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-full bg-emerald-200 border-2 border-white shadow-xs flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0"
                  title={currentUser.AN}
                >
                  {userInitial}
                </div>
              </div>
            )}

            <button
              type="button"
              id="logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:text-red-600 bg-emerald-50 hover:bg-red-50 rounded-lg transition-colors border border-emerald-200/70 hover:border-red-200"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
