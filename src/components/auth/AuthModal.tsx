import React, { useState } from 'react';
import { User, Lock, UserPlus, LogIn, Hospital, ShieldCheck } from 'lucide-react';
import { UserLogin } from '../../types';
import { getUsers, registerUser } from '../../services/db';
import { showSuccessAlert, showErrorAlert, showLoadingAlert, closeAlert } from '../../utils/sweetalert';

interface AuthModalProps {
  onLoginSuccess: (user: UserLogin) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState(''); // AN
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setLoading(true);
    showLoadingAlert('กำลังตรวจสอบสิทธิ์เข้าใช้งาน...');

    try {
      const users = await getUsers();
      const matched = users.find(
        u => u.username.trim().toLowerCase() === username.trim().toLowerCase() && u.password === password
      );

      closeAlert();

      if (!matched) {
        showErrorAlert('เข้าสู่ระบบไม่สำเร็จ', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      if (matched.status !== 'y') {
        const msg = matched.status === 's'
          ? 'บัญชีผู้ใช้นี้อยู่ระหว่างรอการอนุมัติสิทธิ์เข้าใช้งาน (สถานะ: s) กรุณาติดต่อผู้ดูแลระบบ'
          : 'บัญชีผู้ใช้นี้ถูกระงับสิทธิ์การเข้าใช้งาน (สถานะ: n)';
        showErrorAlert('ไม่สามารถเข้าสู่ระบบได้', msg);
        setLoading(false);
        return;
      }

      showSuccessAlert('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ${matched.AN}`);
      onLoginSuccess(matched);
    } catch (err: any) {
      closeAlert();
      showErrorAlert('เกิดข้อผิดพลาด', err?.message || 'ไม่สามารถเข้าสู่ระบบได้');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !fullname.trim()) {
      showErrorAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    setLoading(true);
    showLoadingAlert('กำลังบันทึกข้อมูลการลงทะเบียน...');

    try {
      const users = await getUsers();
      const exists = users.some(u => u.username.trim().toLowerCase() === username.trim().toLowerCase());
      if (exists) {
        closeAlert();
        showErrorAlert('ชื่อผู้ใช้นี้มีในระบบแล้ว', 'กรุณาใช้ชื่อผู้ใช้อื่น');
        setLoading(false);
        return;
      }

      // Default status is 's' (hidden in form)
      await registerUser({
        username: username.trim(),
        password: password.trim(),
        AN: fullname.trim(),
        status: 's'
      });

      closeAlert();
      await showSuccessAlert(
        'ลงทะเบียนสำเร็จ',
        'บันทึกข้อมูลแล้ว สถานะเริ่มต้นคือ "s" (รอการอนุมัติ) จะเข้าใช้งานได้เมื่อผู้ดูแลระบบอนุมัติ status="y"'
      );

      setIsRegister(false);
      setUsername('');
      setPassword('');
      setFullname('');
    } catch (err: any) {
      closeAlert();
      showErrorAlert('ลงทะเบียนไม่สำเร็จ', err?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-emerald-50 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white text-center relative">
          <div className="mx-auto w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xs mb-3 border border-white/20 shadow-inner">
            <Hospital className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">โรงพยาบาลพัทลุง</h2>
          <p className="text-emerald-100 text-sm font-medium mt-0.5">งานวิสัญญี | ทะเบียนผู้ป่วย</p>
          <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-emerald-700/60 rounded-full text-xs font-light text-emerald-100 border border-emerald-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ระบบบันทึกและสารสนเทศวิสัญญี</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-emerald-50 bg-emerald-50/40">
          <button
            type="button"
            id="tab-login-btn"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-3 text-sm font-medium text-center transition-all flex items-center justify-center gap-2 ${
              !isRegister
                ? 'text-emerald-900 border-b-2 border-emerald-500 bg-white font-semibold'
                : 'text-slate-500 hover:text-emerald-700'
            }`}
          >
            <LogIn className="w-4 h-4" />
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            id="tab-register-btn"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-3 text-sm font-medium text-center transition-all flex items-center justify-center gap-2 ${
              isRegister
                ? 'text-emerald-900 border-b-2 border-emerald-500 bg-white font-semibold'
                : 'text-slate-500 hover:text-emerald-700'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            ลงทะเบียนผู้ใช้ใหม่
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isRegister ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อผู้ใช้งาน (username)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    id="login-username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="เช่น adisorn"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่าน (password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    id="login-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="submit-login-btn"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                เข้าสู่ระบบ
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อผู้ใช้งาน (username)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    id="register-username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="กำหนดชื่อผู้ใช้งาน (ภาษาอังกฤษหรือตัวเลข)"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่าน (password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    id="register-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="กำหนดรหัสผ่าน"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล (AN)
                </label>
                <input
                  type="text"
                  id="register-fullname"
                  value={fullname}
                  onChange={e => setFullname(e.target.value)}
                  placeholder="เช่น นางสาวสมใจ พยาบาลดมยา"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-slate-800"
                />
              </div>

              {/* Status is hidden with default 's' as requested */}
              <input type="hidden" name="status" value="s" />

              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-xs text-amber-800">
                <p className="font-semibold mb-0.5">เงื่อนไขการอนุมัติ:</p>
                <p>เมื่อลงทะเบียน ระบบจะกำหนดสถานะเริ่มต้นเป็น <b>"s" (ซ่อน)</b> และจะเข้าใช้งานได้เมื่อผู้ดูแลระบบอนุมัติสถานะเป็น <b>"y"</b> ในเมนูผู้ใช้งาน</p>
              </div>

              <button
                type="submit"
                id="submit-register-btn"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                บันทึกลงทะเบียน
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
