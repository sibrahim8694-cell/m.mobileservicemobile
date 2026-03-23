
import React, { useEffect, useState } from 'react';
import { PenTool, ClipboardList, Wrench, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StorageService from '../services/storage';
import { User } from '../types';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
    </div>
    <div className={`p-4 rounded-full bg-opacity-10 ${color.bg}`}>
      <Icon className={color.text} size={32} />
    </div>
  </div>
);

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayRequests: 0,
    activeRepairs: 0,
    todayNotes: 0,
    completedToday: 0
  });

  useEffect(() => {
    const loadStats = () => {
      const requests = StorageService.getRequests();
      const notes = StorageService.getNotes();
      const today = new Date().toISOString().split('T')[0];

      const todayReqs = requests.filter(r => r.date.startsWith(today)).length;
      const active = requests.filter(r => r.status !== 'تم التسليم' && r.status !== 'جاهز للاستلام').length;
      const notesToday = notes.filter(n => n.date.startsWith(today)).length;
      const compToday = requests.filter(r => r.status === 'تم التسليم' && r.date.startsWith(today)).length;

      setStats({
        todayRequests: todayReqs,
        activeRepairs: active,
        todayNotes: notesToday,
        completedToday: compToday
      });
    };

    loadStats();
    window.addEventListener('mm_data_updated', loadStats);
    return () => window.removeEventListener('mm_data_updated', loadStats);
  }, []);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">مرحباً، {user.fullName}</h1>
        <p className="text-gray-500">نظرة عامة على نشاط المركز اليوم</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="طلبات اليوم" 
          value={stats.todayRequests} 
          icon={PenTool} 
          color={{ bg: 'bg-blue-500', text: 'text-blue-600' }} 
        />
        <StatCard 
          title="قيد الإصلاح" 
          value={stats.activeRepairs} 
          icon={Wrench} 
          color={{ bg: 'bg-orange-500', text: 'text-orange-600' }} 
        />
        <StatCard 
          title="ملاحظات اليوم" 
          value={stats.todayNotes} 
          icon={ClipboardList} 
          color={{ bg: 'bg-purple-500', text: 'text-purple-600' }} 
        />
        <StatCard 
          title="تم التسليم اليوم" 
          value={stats.completedToday} 
          icon={CheckCircle} 
          color={{ bg: 'bg-green-500', text: 'text-green-600' }} 
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 text-gray-800">تعليمات هامة</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>الرجاء التأكد من كتابة سريال الجهاز بدقة.</li>
            <li>يجب تسليم إيصال الاستلام للعميل فور تسجيل الطلب.</li>
            <li>المركز غير مسؤول عن الأجهزة بعد 15 يوماً.</li>
            <li>تأكد من النسخ الاحتياطي اليومي للبيانات.</li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-primary to-gray-800 text-white p-6 rounded-xl shadow-md flex flex-col justify-center">
          <h3 className="font-bold text-lg mb-2">{StorageService.getSettings().companyName || 'مليون موبايل'}</h3>
          <p className="opacity-80 mb-6">نظام إدارة الصيانة الاحترافي.</p>
          <div className="flex gap-4">
             <button 
               onClick={() => navigate('/requests')}
               className="bg-secondary text-primary px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors shadow-lg"
             >
               طلب جديد
             </button>
             <button 
               onClick={() => navigate('/compatibility')}
               className="bg-white bg-opacity-20 px-6 py-3 rounded-lg hover:bg-opacity-30 transition-colors border border-white border-opacity-30 backdrop-blur-sm"
             >
               البحث في التوافقات
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
