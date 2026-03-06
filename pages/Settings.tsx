import React, { useState, useEffect } from 'react';
import StorageService from '../services/storage';
import { Save, Cloud, Download, Clock, Database, RefreshCw, Key, Shield, Trash2 } from 'lucide-react';
import { BackupLog } from '../types';
import DeleteModal from '../components/DeleteModal';

const Settings: React.FC = () => {
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isSavingPwd, setIsSavingPwd] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    setBackups(StorageService.getBackups());
    
    const settings = StorageService.getSettings();
    if (settings.deletePassword) {
      setDeletePassword(settings.deletePassword);
    }

    // Auto Backup simulation (In a real browser, we just save to local storage often, 
    // but here we simulate creating a restore point log)
    const interval = setInterval(() => {
       StorageService.createBackup('local');
       setBackups(StorageService.getBackups());
    }, 60000 * 60); // Every hour

    return () => clearInterval(interval);
  }, []);

  const handleBackup = (type: 'local' | 'cloud') => {
    const jsonStr = StorageService.createBackup(type);
    setBackups(StorageService.getBackups());
    
    // Create actual file download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_million_mobile_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePassword = () => {
    setIsSavingPwd(true);
    const settings = StorageService.getSettings();
    StorageService.saveSettings({ ...settings, deletePassword });
    setTimeout(() => {
      setIsSavingPwd(false);
      alert('تم حفظ كلمة مرور الحذف بنجاح');
    }, 500);
  };

  const confirmClearLogs = (password?: string) => {
    const settings = StorageService.getSettings();
    if (settings.deletePassword && password !== settings.deletePassword) {
      alert('كلمة المرور غير صحيحة.');
      return;
    }
    StorageService.clearBackupLogs();
    setBackups([]);
    setDeleteModal(false);
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    try {
      const success = await StorageService.syncToSupabase();
      if (success) {
        alert('تم ترحيل البيانات إلى قاعدة البيانات بنجاح!');
      } else {
        alert('حدث خطأ أثناء ترحيل البيانات. يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ غير متوقع.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-primary mb-6">النسخ الاحتياطي والإعدادات</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
             <div className="bg-red-100 p-3 rounded-full text-red-600">
               <Shield size={24} />
             </div>
             <div>
               <h3 className="font-bold text-lg">حماية الحذف</h3>
               <p className="text-sm text-gray-500">تعيين كلمة مرور مطلوبة قبل حذف أي بيانات</p>
             </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="password" 
              placeholder="كلمة مرور الحذف (اتركها فارغة للإلغاء)" 
              className="input flex-1 bg-gray-50"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            <button 
              onClick={handleSavePassword}
              disabled={isSavingPwd}
              className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Key size={18} />
              {isSavingPwd ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
             <div className="bg-blue-100 p-3 rounded-full text-blue-600">
               <Download size={24} />
             </div>
             <div>
               <h3 className="font-bold text-lg">نسخ احتياطي محلي</h3>
               <p className="text-sm text-gray-500">حفظ البيانات كملف JSON على الجهاز</p>
             </div>
          </div>
          <button 
            onClick={() => handleBackup('local')}
            className="w-full bg-primary text-white font-bold py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            تحميل نسخة احتياطية
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
             <div className="bg-purple-100 p-3 rounded-full text-purple-600">
               <Cloud size={24} />
             </div>
             <div>
               <h3 className="font-bold text-lg">نسخ سحابي (MEGA)</h3>
               <p className="text-sm text-gray-500">رفع البيانات إلى حساب MEGA</p>
             </div>
          </div>
          <div className="flex flex-col gap-2">
            <button 
               onClick={() => StorageService.triggerAutoCloudBackup(true)}
               className="w-full bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              رفع نسخة احتياطية
            </button>
            <button 
               onClick={async () => {
                 setIsSyncing(true);
                 await StorageService.syncFromMega(true);
                 setIsSyncing(false);
               }}
               disabled={isSyncing}
               className="w-full bg-white text-purple-600 border border-purple-600 font-bold py-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
            >
              استعادة من السحابة
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Clock size={20} /> سجل العمليات
           </div>
           <button 
             onClick={() => setDeleteModal(true)}
             className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
           >
             <Trash2 size={14} /> مسح السجل
           </button>
        </div>
        <table className="w-full text-right">
           <thead className="bg-gray-100 text-gray-600 text-sm">
             <tr>
               <th className="p-4">التاريخ</th>
               <th className="p-4">النوع</th>
               <th className="p-4">الحجم</th>
               <th className="p-4">الحالة</th>
             </tr>
           </thead>
           <tbody>
             {backups.map(log => (
               <tr key={log.id} className="border-b last:border-0">
                 <td className="p-4 text-sm font-mono">{new Date(log.date).toLocaleString('ar-EG')}</td>
                 <td className="p-4">
                   <span className={`px-2 py-1 rounded text-xs ${log.type === 'local' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                     {log.type === 'local' ? 'محلي' : 'سحابي'}
                   </span>
                 </td>
                 <td className="p-4 text-sm">{log.size}</td>
                 <td className="p-4 text-green-600 text-sm font-bold">تم بنجاح</td>
               </tr>
             ))}
             {backups.length === 0 && (
               <tr>
                 <td colSpan={4} className="p-8 text-center text-gray-400">لا يوجد سجلات نسخ احتياطي</td>
               </tr>
             )}
           </tbody>
        </table>
      </div>

      <DeleteModal 
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={confirmClearLogs}
        requirePassword={!!StorageService.getSettings().deletePassword}
        title="مسح سجل العمليات"
        message="هل أنت متأكد من رغبتك في مسح سجل النسخ الاحتياطي؟"
      />
    </div>
  );
};

export default Settings;