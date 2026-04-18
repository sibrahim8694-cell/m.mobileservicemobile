import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Bell, Edit, Trash2 } from 'lucide-react';
import StorageService from '../services/storage';
import { CustomerFollowUp, User } from '../types';
import * as XLSX from 'xlsx';

const BRANCHES = ['بنغازي', 'جنزور', 'زليتن', 'مصراته', 'سبها', 'زناته'];
const STATUSES = ['تحت الصيانه', 'جاهز للاستلام', 'تم التسيلم'];

const CustomerFollowUps: React.FC = () => {
  const [followUps, setFollowUps] = useState<CustomerFollowUp[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<CustomerFollowUp>>({
    date: new Date().toISOString().split('T')[0],
    branch: 'بنغازي',
    status: 'تحت الصيانه'
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadData();
    const userStr = sessionStorage.getItem('mm_current_user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const loadData = () => {
    setFollowUps(StorageService.getFollowUps());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (formData.id) {
      await StorageService.updateFollowUp(formData as CustomerFollowUp);
    } else {
      await StorageService.saveFollowUp({
        ...(formData as Omit<CustomerFollowUp, 'id'>),
        createdBy: currentUser.fullName || currentUser.username,
        createdAt: new Date().toISOString()
      });
    }
    
    setShowForm(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      branch: 'بنغازي',
      status: 'تحت الصيانه'
    });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      await StorageService.deleteFollowUp(id);
      loadData();
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredFollowUps.map(f => ({
      'التاريخ': f.date,
      'الفرع': f.branch,
      'اسم العميل': f.customerName,
      'رقم العميل': f.customerNumber,
      'رقم الموبايل': f.customerMobile,
      'نوع الجهاز': f.deviceName || '',
      'سريال الجهاز': f.deviceSerial || '',
      'رقم الوصل': f.receiptNumber,
      'الحالة': f.status,
      'ملاحظات': f.notes,
      'المدخل': f.createdBy
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    // Add RTL support for Excel
    ws['!dir'] = 'rtl';
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "متابعة الفروع");
    XLSX.writeFile(wb, `متابعة_الفروع_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const isDelayed = (dateStr: string, status: string) => {
    if (status !== 'تحت الصيانه') return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 3;
  };

  const filteredFollowUps = followUps.filter(f => {
    const matchesSearch = 
      (f.customerName?.includes(searchTerm) || '') ||
      (f.receiptNumber?.includes(searchTerm) || '') ||
      (f.customerMobile?.includes(searchTerm) || '');
    const matchesBranch = filterBranch ? f.branch === filterBranch : true;
    const matchesStatus = filterStatus ? f.status === filterStatus : true;
    return matchesSearch && matchesBranch && matchesStatus;
  });

  const delayedCount = followUps.filter(f => isDelayed(f.date, f.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          متابعة الفروع
          {delayedCount > 0 && (
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Bell size={14} />
              {delayedCount} متأخر
            </span>
          )}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download size={20} />
            تصدير إكسل
          </button>
          <button
            onClick={() => {
              setFormData({
                date: new Date().toISOString().split('T')[0],
                branch: 'بنغازي',
                status: 'تحت الصيانه'
              });
              setShowForm(true);
            }}
            className="bg-primary hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            إضافة متابعة
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{formData.id ? 'تعديل متابعة' : 'إضافة متابعة جديدة'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
                  <select
                    required
                    value={formData.branch || ''}
                    onChange={e => setFormData({...formData, branch: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName || ''}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم العميل</label>
                  <input
                    type="text"
                    value={formData.customerNumber || ''}
                    onChange={e => setFormData({...formData, customerNumber: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الموبايل</label>
                  <input
                    type="text"
                    required
                    value={formData.customerMobile || ''}
                    onChange={e => setFormData({...formData, customerMobile: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع الجهاز</label>
                  <input
                    type="text"
                    value={formData.deviceName || ''}
                    onChange={e => setFormData({...formData, deviceName: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سريال الجهاز</label>
                  <input
                    type="text"
                    value={formData.deviceSerial || ''}
                    onChange={e => setFormData({...formData, deviceSerial: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الوصل</label>
                  <input
                    type="text"
                    required
                    value={formData.receiptNumber || ''}
                    onChange={e => setFormData({...formData, receiptNumber: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <select
                    required
                    value={formData.status || ''}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الموبايل، رقم الوصل..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div className="w-48">
          <select
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">كل الفروع</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="w-48">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">كل الحالات</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">التاريخ</th>
                <th className="p-4 font-semibold text-gray-600">الفرع</th>
                <th className="p-4 font-semibold text-gray-600">العميل</th>
                <th className="p-4 font-semibold text-gray-600">الجهاز</th>
                <th className="p-4 font-semibold text-gray-600">رقم الوصل</th>
                <th className="p-4 font-semibold text-gray-600">الحالة</th>
                <th className="p-4 font-semibold text-gray-600">المدخل</th>
                <th className="p-4 font-semibold text-gray-600 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFollowUps.map(f => (
                <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${isDelayed(f.date, f.status) ? 'bg-red-50/50' : ''}`}>
                  <td className="p-4">{f.date}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 px-2 py-1 rounded-md text-sm">{f.branch}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{f.customerName}</div>
                    <div className="text-sm text-gray-500" dir="ltr">{f.customerMobile}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{f.deviceName || '-'}</div>
                    <div className="text-sm text-gray-500 font-mono text-left" dir="ltr">{f.deviceSerial || '-'}</div>
                  </td>
                  <td className="p-4 font-mono" dir="ltr">{f.receiptNumber}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      f.status === 'تحت الصيانه' ? (isDelayed(f.date, f.status) ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700') :
                      f.status === 'جاهز للاستلام' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {f.status}
                      {isDelayed(f.date, f.status) && ' (متأخر)'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{f.createdBy}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setFormData(f);
                          setShowForm(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFollowUps.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    لا توجد سجلات مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerFollowUps;
