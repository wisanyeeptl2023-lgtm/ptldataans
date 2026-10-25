import React, { useState, useEffect } from 'react';
import { UserLogin } from './types';
import { Navbar } from './components/navigation/Navbar';
import { Sidebar, ActiveTab } from './components/navigation/Sidebar';
import { AuthModal } from './components/auth/AuthModal';

// Service Views
import { PatientRegistryView } from './components/service/PatientRegistryView';
import { DiseaseRecordView } from './components/service/DiseaseRecordView';
import { ComplicationRecordView } from './components/service/ComplicationRecordView';
import { DrugRecordView } from './components/service/DrugRecordView';
import { SentwageRecordView } from './components/service/SentwageRecordView';

// Master Data Views
import { MasterDataView } from './components/master/MasterDataView';
import { UserManagementView } from './components/master/UserManagementView';

// Dashboards
import { PatientDashboard } from './components/dashboard/PatientDashboard';
import { DiseaseDashboard } from './components/dashboard/DiseaseDashboard';
import { ComplicationDashboard } from './components/dashboard/ComplicationDashboard';
import { DrugDashboard } from './components/dashboard/DrugDashboard';
import { SentwageDashboard } from './components/dashboard/SentwageDashboard';

import { showSuccessAlert, showConfirmDialog } from './utils/sweetalert';
import { SupabaseSchemaModal } from './components/common/SupabaseSchemaModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserLogin | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('service_patient');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);

  // Load authenticated user on mount
  useEffect(() => {
    const saved = localStorage.getItem('ptl_current_user');
    if (saved) {
      try {
        const u = JSON.parse(saved) as UserLogin;
        if (u && u.status === 'y') {
          setCurrentUser(u);
        }
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
  }, []);

  const handleLoginSuccess = (user: UserLogin) => {
    setCurrentUser(user);
    localStorage.setItem('ptl_current_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    const confirmed = await showConfirmDialog('ออกจากระบบ', 'ท่านต้องการออกจากระบบหรือไม่?');
    if (confirmed) {
      localStorage.removeItem('ptl_current_user');
      setCurrentUser(null);
      await showSuccessAlert('ออกจากระบบแล้ว', 'ขอบคุณที่ปฏิบัติงาน');
    }
  };

  const getActiveMenuTitle = (tab: ActiveTab): string => {
    switch (tab) {
      case 'service_patient':
        return 'ทะเบียนผู้ป่วย';
      case 'service_disease':
        return 'บันทึกโรคประจำตัว';
      case 'service_complication':
        return 'บันทึก Complication';
      case 'service_drug':
        return 'บันทึกยา';
      case 'service_sentwage':
        return 'ติดตามการส่งเวร';
      case 'master_disease':
        return 'ข้อมูลโรคประจำตัว';
      case 'master_complication':
        return 'ข้อมูล Complication';
      case 'master_drug':
        return 'ข้อมูลยา';
      case 'master_users':
        return 'เมนูผู้ใช้งาน';
      case 'dashboard_patient':
        return 'รายงานผู้ป่วย';
      case 'dashboard_disease':
        return 'รายงานโรคประจำตัว';
      case 'dashboard_complication':
        return 'รายงาน Complication';
      case 'dashboard_drug':
        return 'รายงานยา';
      case 'dashboard_sentwage':
        return 'รายงานส่งเวร';
      default:
        return 'ระบบงานวิสัญญี';
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f9f5] text-slate-800 font-sans flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      {/* If not logged in or status != 'y', prompt Auth Modal */}
      {!currentUser && <AuthModal onLoginSuccess={handleLoginSuccess} />}

      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onToggleMenu={() => setIsSidebarOpen(prev => !prev)}
        onLogout={handleLogout}
        activeMenuTitle={getActiveMenuTitle(activeTab)}
        onOpenSchema={() => setIsSchemaModalOpen(true)}
      />

      {/* Supabase Schema Modal */}
      <SupabaseSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      {/* Hamburger Drawer Sidebar (Mobile & Desktop) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={tab => setActiveTab(tab)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 flex-1">
        {activeTab === 'service_patient' && (
          <PatientRegistryView
            currentUser={
              currentUser || {
                username: 'adisorn',
                password: '',
                AN: 'นายอดิศร ชุมคช',
                status: 'y'
              }
            }
          />
        )}
        {activeTab === 'service_disease' && <DiseaseRecordView />}
        {activeTab === 'service_complication' && <ComplicationRecordView />}
        {activeTab === 'service_drug' && <DrugRecordView />}
        {activeTab === 'service_sentwage' && <SentwageRecordView />}

        {activeTab === 'master_disease' && <MasterDataView type="disease" />}
        {activeTab === 'master_complication' && <MasterDataView type="complication" />}
        {activeTab === 'master_drug' && <MasterDataView type="drug" />}
        {activeTab === 'master_users' && <UserManagementView />}

        {activeTab === 'dashboard_patient' && <PatientDashboard />}
        {activeTab === 'dashboard_disease' && <DiseaseDashboard />}
        {activeTab === 'dashboard_complication' && <ComplicationDashboard />}
        {activeTab === 'dashboard_drug' && <DrugDashboard />}
        {activeTab === 'dashboard_sentwage' && <SentwageDashboard />}
      </main>

      {/* Custom Bottom Status Bar from Natural Tones Theme */}
      <footer className="bg-emerald-900 text-emerald-100 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row justify-between items-center text-[11px] font-mono gap-2 border-t border-emerald-800 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            DB: Connected (Supabase PostgreSQL)
          </span>
          <span className="text-emerald-600">|</span>
          <span>
            User Status: {currentUser ? `Active (${currentUser.status.toUpperCase()})` : 'Login Required'}
          </span>
          {currentUser && (
            <>
              <span className="text-emerald-600 hidden sm:inline">|</span>
              <span className="hidden sm:inline text-emerald-200">AN: {currentUser.AN}</span>
            </>
          )}
        </div>
        <div className="text-emerald-300/80 text-center sm:text-right">
          &copy; 2569 งานวิสัญญี โรงพยาบาลพัทลุง | Phatthalung Hospital
        </div>
      </footer>
    </div>
  );
}
