import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Smartphone, FileText, ClipboardList, Calculator, LogOut, Users, Save, Cloud, CheckCircle, AlertCircle, Loader2, Bell } from 'lucide-react';
import { User } from '../types';
import { APP_NAME } from '../constants';
import StorageService from '../services/storage';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOpen, setIsOpen }) => {
  const isAdmin = user.role === 'admin';
  const [backupStatus, setBackupStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Listen for backup events
    const handleBackupStart = () => setBackupStatus('syncing');
    const handleBackupSuccess = () => {
        setBackupStatus('success');
        setTimeout(() => setBackupStatus('idle'), 3000);
    };
    const handleBackupError = () => {
        setBackupStatus('error');
        setTimeout(() => setBackupStatus('idle'), 5000);
    };

    window.addEventListener('mm_backup_start', handleBackupStart);
    window.addEventListener('mm_backup_success', handleBackupSuccess);
    window.addEventListener('mm_backup_error', handleBackupError);

    return () => {
        window.removeEventListener('mm_backup_start', handleBackupStart);
        window.removeEventListener('mm_backup_success', handleBackupSuccess);
        window.removeEventListener('mm_backup_error', handleBackupError);
    };
  }, []);

  const allLinks = [
    { id: 'dashboard', to: '/', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'compatibility', to: '/compatibility', label: 'توافقات القطع', icon: Smartphone },
    { id: 'requests', to: '/requests', label: 'طلبات الصيانة', icon: FileText },
    { id: 'notes', to: '/notes', label: 'ملاحظات الريسبشن', icon: ClipboardList },
    { id: 'follow-ups', to: '/follow-ups', label: 'متابعة الفروع', icon: Users },
    { id: 'notifications', to: '/notifications', label: 'التبليغات', icon: Bell },
    { id: 'calculators', to: '/calculators', label: 'الحاسبات', icon: Calculator },
  ];

  const visibleLinks = allLinks.filter(link => {
    if (link.id === 'dashboard') return true;
    if (isAdmin) return true;
    return user.permissions?.includes(link.id);
  });

  const adminLinks = [];
  if (isAdmin) {
    adminLinks.push({ to: '/users', label: 'إدارة المستخدمين', icon: Users });
    adminLinks.push({ to: '/backup', label: 'النسخ الاحتياطي', icon: Save });
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 right-0 h-full bg-primary text-white w-64 z-30 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        md:translate-x-0 md:static no-print flex flex-col
      `}>
        <div className="p-6 text-center border-b border-gray-700">
          <div className="flex justify-center mb-4">
             {/* Styled M Logo */}
             <div className="w-20 h-20 bg-gradient-to-br from-secondary to-yellow-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-all border-2 border-primary overflow-hidden">
                 {StorageService.getSettings().companyLogo ? (
                     <img src={StorageService.getSettings().companyLogo} alt="Logo" className="w-full h-full object-cover" />
                 ) : (
                     <span className="text-5xl font-black text-primary font-sans">
                         {(StorageService.getSettings().companyName || APP_NAME).charAt(0)}
                     </span>
                 )}
             </div>
          </div>
          <h2 className="text-lg font-bold text-secondary mt-2">{StorageService.getSettings().companyName || APP_NAME}</h2>
        </div>

        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">{user.fullName}</p>
              <p className="text-xs text-gray-400">{isAdmin ? 'مدير النظام' : 'مشغل'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {visibleLinks.map((link) => (
              <li key={link.to}>
                <NavLink 
                  to={link.to}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-6 py-3 transition-colors
                    ${isActive ? 'bg-secondary text-primary font-bold' : 'hover:bg-gray-700 text-gray-100'}
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
            
            {adminLinks.length > 0 && (
               <li className="px-6 py-2 text-xs font-bold text-gray-500 uppercase mt-4">إدارة النظام</li>
            )}

            {adminLinks.map((link) => (
              <li key={link.to}>
                <NavLink 
                  to={link.to}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-6 py-3 transition-colors
                    ${isActive ? 'bg-secondary text-primary font-bold' : 'hover:bg-gray-700 text-gray-100'}
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-4 px-2">
              <span className="flex items-center gap-1">
                  <Cloud size={12} /> النسخ السحابي
              </span>
              {backupStatus === 'idle' && <span className="text-gray-500">جاهز</span>}
              {backupStatus === 'syncing' && <span className="text-blue-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> جاري الرفع...</span>}
              {backupStatus === 'success' && <span className="text-green-400 flex items-center gap-1"><CheckCircle size={10}/> تم بنجاح</span>}
              {backupStatus === 'error' && <span className="text-red-400 flex items-center gap-1"><AlertCircle size={10}/> فشل</span>}
          </div>

          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-gray-800 rounded transition-colors"
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;