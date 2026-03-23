import React, { useState, useEffect } from 'react';
import StorageService from '../services/storage';
import { Save, Cloud, Download, Clock, Database, RefreshCw, Key, Shield, Trash2, CheckCircle, XCircle, Upload } from 'lucide-react';
import { BackupLog } from '../types';
import DeleteModal from '../components/DeleteModal';

const Settings: React.FC = () => {
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isSavingPwd, setIsSavingPwd] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  
  // Company Settings State
  const [companyName, setCompanyName] = useState('');
  const [companyPhones, setCompanyPhones] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  
  // New state for progress simulation
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');

  useEffect(() => {
    setBackups(StorageService.getBackups());
    
    const settings = StorageService.getSettings();
    if (settings.deletePassword) {
      setDeletePassword(settings.deletePassword);
    }
    setCompanyName(settings.companyName || '');
    setCompanyPhones(settings.companyPhones || '');
    setCompanyAddress(settings.companyAddress || '');
    setCompanyLogo(settings.companyLogo || '');

    // Auto Backup simulation (In a real browser, we just save to local storage often, 
    // but here we simulate creating a restore point log)
    const interval = setInterval(() => {
       StorageService.createBackup('local');
       setBackups(StorageService.getBackups());
    }, 60000 * 60); // Every hour

    return () => clearInterval(interval);
  }, []);

  const simulateProgress = (onComplete: () => void) => {
    setShowProgress(true);
    setProgress(0);
    setStatusType('info');
    setStatusMsg('جاري التحضير...');
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 20) + 10;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setProgress(100);
        setTimeout(onComplete, 500);
      } else {
        setProgress(currentProgress);
        if (currentProgress > 30 && currentProgress < 70) {
          setStatusMsg('جاري إنشاء نسخة احتياطية...');
        } else if (currentProgress >= 70) {
          setStatusMsg('جاري إنهاء العملية...');
        }
      }
    }, 400);
  };

  const handleBackup = (type: 'local' | 'cloud') => {
    simulateProgress(() => {
      try {
        const jsonStr = StorageService.createBackup(type);
        setBackups(StorageService.getBackups());
        
        if (type === 'local') {
          // Create actual file download
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `backup_million_mobile_${new Date().getTime()}.json`;
          a.click();
          URL.revokeObjectURL(url);
          
          setStatusType('success');
          setStatusMsg('✅ اكتملت النسخة الاحتياطية بنجاح');
          setTimeout(() => setShowProgress(false), 3000);
        }
      } catch (error: any) {
        setStatusType('error');
        setStatusMsg(`❌ فشل: ${error.message}`);
        setTimeout(() => setShowProgress(false), 5000);
      }
    });
  };

  const handleCloudBackup = () => {
    simulateProgress(async () => {
      setStatusMsg('جاري الرفع إلى MEGA...');
      try {
        await StorageService.triggerAutoCloudBackup(true);
        setStatusType('success');
        setStatusMsg('✅ تم الرفع إلى MEGA بنجاح');
        setBackups(StorageService.getBackups());
      } catch (error: any) {
        setStatusType('error');
        setStatusMsg(`❌ فشل الرفع: ${error.message}`);
      }
      setTimeout(() => setShowProgress(false), 4000);
    });
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

  const handleSaveCompany = () => {
    setIsSavingCompany(true);
    const settings = StorageService.getSettings();
    StorageService.saveSettings({ 
      ...settings, 
      companyName,
      companyPhones,
      companyAddress,
      companyLogo
    });
    
    if (companyName) {
      document.title = companyName;
    }

    setTimeout(() => {
      setIsSavingCompany(false);
      alert('تم حفظ بيانات الشركة بنجاح');
      window.location.reload();
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-primary mb-6">النسخ الاحتياطي والإعدادات</h1>

      {showProgress && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <span className={`font-bold ${statusType === 'error' ? 'text-red-600' : statusType === 'success' ? 'text-green-600' : 'text-blue-600'}`}>
              {statusMsg}
            </span>
            <span className="text-gray-500 font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-300 ${statusType === 'error' ? 'bg-red-600' : statusType === 'success' ? 'bg-green-600' : 'bg-blue-600'}`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            disabled={showProgress}
            className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            💾 إنشاء نسخة احتياطية محلية
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
          <div className="flex flex-col gap-3">
            <button 
               onClick={handleCloudBackup}
               disabled={showProgress}
               className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Cloud size={20} />
              ☁️ رفع نسخة احتياطية سحابية
            </button>
            <button 
               onClick={async () => {
                 setIsSyncing(true);
                 await StorageService.syncFromMega(true);
                 setIsSyncing(false);
               }}
               disabled={isSyncing || showProgress}
               className="w-full bg-white text-purple-600 border border-purple-600 font-bold py-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
              استعادة من السحابة
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
          <div className="flex items-center gap-4 mb-4">
             <div className="bg-red-100 p-3 rounded-full text-red-600">
               <Shield size={24} />
             </div>
             <div>
               <h3 className="font-bold text-lg">حماية الحذف</h3>
               <p className="text-sm text-gray-500">تعيين كلمة مرور مطلوبة قبل حذف أي بيانات</p>
             </div>
          </div>
          <div className="flex gap-2 max-w-md">
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
              className="bg-red-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Key size={18} />
              {isSavingPwd ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
          <div className="flex items-center gap-4 mb-4">
             <div className="bg-blue-100 p-3 rounded-full text-blue-600">
               <Database size={24} />
             </div>
             <div>
               <h3 className="font-bold text-lg">بيانات البرنامج والشركة</h3>
               <p className="text-sm text-gray-500">تعديل اسم البرنامج، أرقام الهواتف، العنوان، والشعار (تظهر في التطبيق والطباعة)</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">اسم البرنامج / الشركة</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">أرقام الهواتف</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary"
                value={companyPhones}
                onChange={(e) => setCompanyPhones(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">العنوان</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">شعار الشركة (Logo)</label>
              <div className="flex items-center gap-4">
                {companyLogo && (
                  <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                    <img src={companyLogo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    id="logo-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCompanyLogo(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label 
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <Upload size={16} />
                    اختر صورة الشعار
                  </label>
                  {companyLogo && (
                    <button 
                      type="button"
                      onClick={() => setCompanyLogo('')}
                      className="mr-3 text-red-500 text-sm hover:underline"
                    >
                      إزالة
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleSaveCompany}
              disabled={isSavingCompany}
              className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {isSavingCompany ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
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
               <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                 <td className="p-4 text-sm font-mono">{new Date(log.date).toLocaleString('ar-EG')}</td>
                 <td className="p-4">
                   <span className={`px-3 py-1 rounded-full text-xs font-medium ${log.type === 'local' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                     {log.type === 'local' ? 'محلي' : 'سحابي'}
                   </span>
                 </td>
                 <td className="p-4 text-sm text-gray-600">{log.size}</td>
                 <td className="p-4 text-green-600 text-sm font-bold flex items-center gap-1">
                   <CheckCircle size={16} /> تم بنجاح
                 </td>
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