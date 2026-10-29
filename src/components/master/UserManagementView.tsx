import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  KeyRound,
  User
} from 'lucide-react';
import { UserLogin } from '../../types';
import { getUsers, registerUser, updateUser, deleteUser } from '../../services/db';
import { showSuccessAlert, showErrorAlert, showConfirmDialog, showLoadingAlert, closeAlert } from '../../utils/sweetalert';

export const UserManagementView: React.FC = () => {
  // PIN Verification State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // User Management State
  const [users, setUsers] = useState<UserLogin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullname, setFullname] = useState<string>(''); // AN
  const [status, setStatus] = useState<'y' | 'n'>('y');

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === 'ptlans') {
      setIsAuthenticated(true);
      setPinError('');
      loadUsers();
    } else {
      setPinError('รหัสผ่านไม่ถูกต้อง (กรุณากรอกรหัสผ่านผู้ดูแลระบบ)');
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await getUsers();
      setUsers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  const resetForm = () => {
    setEditingId(null);
    setUsername('');
    setPassword('');
    setFullname('');
    setStatus('y');
    setShowAddForm(false);
  };

  const handleStartEdit = (u: UserLogin) => {
    setEditingId(u.id || null);
    setUsername(u.username);
    setPassword(u.password || '');
    setFullname(u.AN);
    setStatus(u.status === 'y' ? 'y' : 'n');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !fullname.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    showLoadingAlert('กำลังบันทึกข้อมูลผู้ใช้งาน...');

    try {
      if (editingId) {
        await updateUser(editingId, {
          username: username.trim(),
          password: password.trim(),
          AN: fullname.trim(),
          status
        });
        closeAlert();
        await showSuccessAlert('แก้ไขสำเร็จ', `อัปเดตข้อมูลผู้ใช้ ${username} เรียบร้อยแล้ว`);
      } else {
        // Check duplication
        const exists = users.some(
          u => u.username.toLowerCase() === username.trim().toLowerCase()
        );
        if (exists) {
          closeAlert();
          showErrorAlert('ชื่อผู้ใช้นี้มีในระบบแล้ว', 'กรุณาใช้ชื่อผู้ใช้อื่น');
          return;
        }

        await registerUser({
          username: username.trim(),
          password: password.trim(),
          AN: fullname.trim(),
          status
        });
        closeAlert();
        await showSuccessAlert('บันทึกสำเร็จ', `เพิ่มผู้ใช้งาน ${fullname} เรียบร้อยแล้ว`);
      }

      resetForm();
      await loadUsers();
    } catch (err: any) {
      closeAlert();
      showErrorAlert('บันทึกไม่สำเร็จ', err?.message);
    }
  };

  const handleQuickStatusToggle = async (u: UserLogin, newStatus: 'y' | 'n') => {
    if (!u.id) return;
    showLoadingAlert('กำลังปรับปรุงสถานะสิทธิ์...');
    try {
      await updateUser(u.id, { status: newStatus });
      closeAlert();
      await showSuccessAlert(
        'ปรับสถานะสำเร็จ',
        `ผู้ใช้ ${u.AN} เปลี่ยนสถานะเป็น "${newStatus === 'y' ? 'อนุมัติ (y)' : 'ระงับสิทธิ์ (n)'}" แล้ว`
      );
      await loadUsers();
    } catch (err: any) {
      closeAlert();
      showErrorAlert('เกิดข้อผิดพลาด', err?.message);
    }
  };

  const handleDeleteUser = async (u: UserLogin) => {
    if (!u.id) return;
    if (u.username === 'adisorn') {
      showErrorAlert('ไม่อนุญาตให้ลบ', 'ไม่สามารถลบผู้ดูแลระบบหลักเริ่มต้น (adisorn) ได้');
      return;
    }

    const confirmed = await showConfirmDialog(
      'ยืนยันการลบผู้ใช้',
      `ต้องการลบผู้ใช้ ${u.AN} (${u.username}) ออกจากระบบใช่หรือไม่?`
    );
    if (confirmed) {
      showLoadingAlert('กำลังลบผู้ใช้...');
      try {
        await deleteUser(u.id);
        closeAlert();
        await showSuccessAlert('ลบผู้ใช้สำเร็จ');
        await loadUsers();
      } catch (err: any) {
        closeAlert();
        showErrorAlert('ลบไม่สำเร็จ', err?.message);
      }
    }
  };

  // If not PIN verified yet, show PIN prompt
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 shadow-sm border border-emerald-50 text-center">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <KeyRound className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">เข้าสู่เมนูผู้ใช้งาน</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          เมนูนี้ได้รับการคุ้มครอง กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อเข้าใช้งาน
        </p>

        <form onSubmit={handleVerifyPin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่านยืนยันสิทธิ์
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                id="pin-admin-input"
                value={pinInput}
                onChange={e => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
              />
            </div>
            {pinError && <p className="text-xs text-red-600 mt-1.5 font-medium">{pinError}</p>}
          </div>

          <button
            type="submit"
            id="verify-pin-btn"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            ยืนยันรหัสผ่าน
          </button>
        </form>
      </div>
    );
  }

  // Once authenticated with "ptlans", show complete User Management UI
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-6 bg-emerald-400 rounded-full shrink-0"></span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                เมนูผู้ใช้งาน
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                จัดการรายชื่อผู้ใช้งานและอนุมัติสิทธิ์การเข้าใช้ระบบ (status: y=อนุญาต, n=ไม่อนุญาต)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            className="p-2 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-100 transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            id="toggle-add-user-btn"
            onClick={() => {
              if (showAddForm && !editingId) setShowAddForm(false);
              else {
                resetForm();
                setShowAddForm(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'ซ่อนแบบฟอร์ม' : 'ลงทะเบียนผู้ใช้ใหม่'}</span>
          </button>
        </div>
      </div>

      {/* Add / Edit User Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmitUser}
          className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-base text-slate-800">
                {editingId ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'ลงทะเบียนผู้ใช้งานใหม่'}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อผู้ใช้งาน (username) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="เช่น adisorn"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสผ่าน (password) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="รหัสผ่าน"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อ-นามสกุล (AN) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullname}
                onChange={e => setFullname(e.target.value)}
                placeholder="เช่น นายอดิศร ชุมคช"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานะ (status) <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'y' | 'n')}
                className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 font-semibold"
              >
                <option value="y">y - อนุมัติใช้งานได้</option>
                <option value="n">n - ระงับสิทธิ์การใช้งาน</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingId ? 'บันทึกแก้ไข' : 'บันทึกลงทะเบียน'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 overflow-hidden">
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="font-semibold text-xs text-slate-700 flex items-center gap-2">
            <span className="w-2 h-4 bg-emerald-400 rounded-full shrink-0"></span>
            <span>รายชื่อผู้ใช้ทั้งหมด ({users.length} คน)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">ชื่อผู้ใช้ (username)</th>
                <th className="py-3.5 px-4">ชื่อ-นามสกุล (AN)</th>
                <th className="py-3.5 px-3">รหัสผ่าน</th>
                <th className="py-3.5 px-3 text-center">สถานะ (status)</th>
                <th className="py-3.5 px-4 text-center">การอนุมัติสิทธิ์</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    กำลังโหลดข้อมูลผู้ใช้งาน...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ยังไม่มีผู้ใช้งานในระบบ
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id || u.username} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold font-mono text-emerald-700">
                      @{u.username}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{u.AN}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {u.password ? '••••••••' : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {u.status === 'y' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>y (อนุมัติ)</span>
                        </span>
                      ) : u.status === 's' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>s (รออนุมัติ)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span>n (ระงับ)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {u.status !== 'y' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusToggle(u, 'y')}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-medium transition-colors shadow-xs"
                          >
                            อนุมัติ (y)
                          </button>
                        )}
                        {u.status === 'y' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusToggle(u, 'n')}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-medium transition-colors border border-red-100"
                          >
                            ระงับสิทธิ์ (n)
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(u)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
