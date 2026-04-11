
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ServiceRequest, User as UserType } from '../types';
import StorageService from '../services/storage';
import { DEVICE_STATUSES, STAFF_NAMES, APP_NAME, DEVICE_STATUS_OPTIONS } from '../constants';
import { Search, Printer, Edit, Save, Plus, User, Smartphone, Wrench, DollarSign, FileText, X, Eye, ArrowRight, Trash2, Calendar, Hash, LayoutGrid, Receipt, AlertCircle, Lock, PenTool, CheckCircle, RefreshCw } from 'lucide-react';
import DeleteModal from '../components/DeleteModal';

const ServiceRequests: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<ServiceRequest>>({
    customerName: '',
    customerPhone: '',
    deviceName: '',
    deviceSerial: '',
    devicePassword: '',
    problemDescription: '',
    condition: DEVICE_STATUS_OPTIONS[0],
    receiver: STAFF_NAMES[0],
    parts: [{ name: '', price: 0 }],
    status: 'جديد',
    date: new Date().toISOString().split('T')[0]
  });

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRequests();
    const stored = sessionStorage.getItem('mm_current_user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  const loadRequests = () => {
    const data = StorageService.getRequests();
    setRequests(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await StorageService.syncFromSupabase();
    loadRequests();
    setIsRefreshing(false);
  };

  const nextRequestNumber = useMemo(() => {
    if (editingId && formData.requestNumber) return formData.requestNumber;
    if (requests.length === 0) return 1;
    const nums = requests.map(r => parseInt(r.requestNumber)).filter(n => !isNaN(n));
    return nums.length > 0 ? Math.max(...nums) + 1 : 1;
  }, [requests, editingId, formData.requestNumber]);

  const handlePrint = (previewMode = false) => {
    const printContent = printRef.current;
    const settings = StorageService.getSettings();
    const companyName = settings.companyName || 'مركز الصيانة مليون موبايل';
    const companyLogo = settings.companyLogo || '';
    
    if (printContent) {
        const win = window.open('', '', 'height=850,width=1000');
        if (win) {
            win.document.write(`
                <html dir="rtl">
                <head>
                    <title>${previewMode ? 'معاينة الإيصال' : 'طباعة الإيصال'} - ${companyName}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
                    <style>
                        :root {
                            --primary-color: #2c3e50;
                            --border-color: #000;
                        }
                        body { 
                            font-family: 'Cairo', sans-serif; 
                            background: ${previewMode ? '#f5f5f5' : 'white'}; 
                            margin: 0; 
                            padding: ${previewMode ? '20px' : '0'};
                            display: flex;
                            justify-content: center;
                        }
                        .a4-page {
                            background: white;
                            width: 210mm;
                            height: 297mm; /* Fixed A4 Height */
                            padding: 10mm 15mm;
                            box-sizing: border-box;
                            position: relative;
                            box-shadow: ${previewMode ? '0 0 15px rgba(0,0,0,0.1)' : 'none'};
                            display: flex;
                            flex-direction: column;
                            border: ${previewMode ? 'none' : 'none'};
                        }
                        @media print {
                            body { background: white; padding: 0; }
                            .a4-page { box-shadow: none; width: 100%; height: 100vh; margin: 0; padding: 10mm; page-break-after: always; }
                            .no-print { display: none !important; }
                        }
                        
                        /* Logo Styles */
                        .logo-container {
                            display: flex;
                            justify-content: center;
                            margin-bottom: 15px;
                        }
                        .logo {
                            width: 80px;
                            height: 80px;
                            background-color: white;
                            border: 3px solid var(--primary-color);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 40px;
                            font-weight: 900;
                            color: var(--primary-color);
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            overflow: hidden;
                        }
                        .logo img {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }

                        /* Header Styles */
                        .header {
                            text-align: center;
                            border-bottom: 2px solid var(--primary-color);
                            padding-bottom: 10px;
                            margin-bottom: 15px;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 24px;
                            font-weight: 900;
                            color: var(--primary-color);
                            text-transform: uppercase;
                        }
                        .header-meta {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 10px;
                            font-size: 13px;
                            font-weight: bold;
                        }
                        
                        .receipt-number {
                            display: block; 
                            font-size: 16px;
                            font-weight: 800;
                        }

                        /* Content Boxes */
                        .section-title {
                            font-size: 13px;
                            font-weight: 800;
                            margin-bottom: 5px;
                            color: #000;
                            border-bottom: 1px solid #ccc;
                            padding-bottom: 2px;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        }
                        
                        .data-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 10px;
                            font-size: 13px;
                        }
                        .data-table td, .data-table th {
                            border: 1px solid #999;
                            padding: 4px 6px;
                        }
                        .data-table th {
                            background-color: #f0f0f0;
                            width: 15%; /* Adjusted width */
                            font-weight: bold;
                            color: #333;
                            white-space: nowrap;
                        }
                        .data-table td {
                            font-weight: 700;
                            color: #000;
                            font-size: 14px;
                            width: 35%; /* Equal width columns */
                        }

                        /* Problem Description */
                        .problem-box {
                            border: 1px solid #999;
                            padding: 8px;
                            min-height: 50px;
                            background: #fff;
                            font-weight: bold;
                            font-size: 13px;
                            margin-bottom: 10px;
                        }

                        /* Financials */
                        .financial-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 5px;
                        }
                        .financial-table th, .financial-table td {
                            border: 1px solid #999;
                            padding: 4px 6px;
                            text-align: center;
                            font-size: 13px;
                        }
                        .financial-table th {
                            background-color: #f0f0f0;
                        }
                        .financial-table tfoot td {
                            background-color: #f9f9f9;
                            border-top: 2px solid #000;
                        }

                        /* Footer */
                        .footer {
                            margin-top: auto;
                            padding-top: 10px;
                            border-top: 2px dashed #ccc;
                        }
                        .terms {
                            font-size: 10px;
                            text-align: justify;
                            margin-bottom: 20px;
                            line-height: 1.4;
                        }
                        .signatures {
                            display: flex;
                            justify-content: space-between;
                            padding: 0 40px;
                        }
                        .sig-box {
                            text-align: center;
                            width: 200px;
                        }
                        .sig-line {
                            border-bottom: 1px solid #000;
                            margin-top: 30px;
                            margin-bottom: 5px;
                        }
                        .sig-label { font-weight: bold; font-size: 11px; }

                    </style>
                </head>
                <body>
                    <div class="a4-page">
                        <div class="logo-container">
                             <div class="logo">
                                ${companyLogo ? `<img src="${companyLogo}" alt="Logo" />` : (companyName || 'م').charAt(0)}
                             </div>
                        </div>
                        ${printContent.innerHTML}
                    </div>
                    ${!previewMode ? `
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 800);
                    </script>
                    ` : ''}
                </body>
                </html>
            `);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const partsTotal = formData.parts?.reduce((sum, p) => sum + (Number(p.price) || 0), 0) || 0;
    const requestData: any = {
      ...formData,
      totalPrice: partsTotal,
      date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString()
    };

    if (editingId) {
      await StorageService.updateRequest({ ...requestData, id: editingId });
    } else {
      await StorageService.saveRequest(requestData);
    }

    loadRequests();
    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      deviceName: '',
      deviceSerial: '',
      devicePassword: '',
      problemDescription: '',
      condition: DEVICE_STATUS_OPTIONS[0],
      receiver: STAFF_NAMES[0],
      parts: [{ name: '', price: 0 }],
      status: 'جديد',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
  };

  const handleEdit = (req: ServiceRequest) => {
    setFormData({
        ...req,
        date: new Date(req.date).toISOString().split('T')[0]
    });
    setEditingId(req.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
      setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async (password?: string) => {
      if (!deleteModal.id) return;
      
      const settings = StorageService.getSettings();
      if (settings.deletePassword && password !== settings.deletePassword) {
          alert('كلمة المرور غير صحيحة. تم إلغاء الحذف.');
          return;
      }
      
      await StorageService.deleteRequest(deleteModal.id);
      loadRequests();
      setDeleteModal({ isOpen: false, id: null });
      if (editingId === deleteModal.id) {
          setIsFormOpen(false);
          resetForm();
      }
  };

  const handleAddPart = () => {
    setFormData({
      ...formData,
      parts: [...(formData.parts || []), { name: '', price: 0 }]
    });
  };

  const handleRemovePart = (index: number) => {
    const newParts = [...(formData.parts || [])];
    newParts.splice(index, 1);
    setFormData({ ...formData, parts: newParts });
  };

  const handlePartChange = (index: number, field: 'name' | 'price', value: string) => {
    const newParts = [...(formData.parts || [])];
    if (field === 'price') {
      newParts[index] = { ...newParts[index], price: parseFloat(value) || 0 };
    } else {
      newParts[index] = { ...newParts[index], name: value };
    }
    setFormData({ ...formData, parts: newParts });
  };

  const hasPermission = (permId: string) => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin') return true;
      return currentUser.permissions?.includes(permId);
  };

  const filteredRequests = requests.filter(r => 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.deviceSerial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-primary">إدارة طلبات الصيانة</h1>
          <p className="text-gray-500 text-sm mt-1">تسجيل ومتابعة الأجهزة</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white border border-gray-200 text-gray-700 font-bold px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden md:inline">تحديث</span>
          </button>
          {!isFormOpen && hasPermission('add_request') && (
            <button 
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="bg-primary text-secondary font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg transform hover:-translate-y-1"
            >
              <Plus size={20} />
              <span>طلب جديد</span>
            </button>
          )}
        </div>
      </div>

      {!isFormOpen ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden no-print animate-fade-in">
          <div className="p-5 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="بحث (اسم العميل، رقم الطلب، السريال)..."
                className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-500 font-bold bg-gray-100 px-3 py-1 rounded-lg">
              إجمالي الطلبات: {filteredRequests.length}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-700 text-sm font-bold border-b border-gray-200">
                <tr>
                  <th className="p-5">رقم الطلب</th>
                  <th className="p-5">العميل</th>
                  <th className="p-5">الجهاز</th>
                  <th className="p-5">الحالة</th>
                  <th className="p-5">التكلفة</th>
                  <th className="p-5">التاريخ</th>
                  <th className="p-5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-blue-50 transition-colors group">
                    <td className="p-5 font-mono text-sm text-gray-600 font-bold">{req.requestNumber}</td>
                    <td className="p-5">
                      <div className="font-bold text-gray-800">{req.customerName}</div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">{req.customerPhone}</div>
                    </td>
                    <td className="p-5 text-gray-700">{req.deviceName}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1
                        ${req.status === 'تم التسليم' ? 'bg-green-100 text-green-700' : 
                          req.status === 'قيد الإصلاح' ? 'bg-orange-100 text-orange-700' : 
                          req.status === 'جاهز للاستلام' ? 'bg-blue-100 text-blue-700' :
                          req.status === 'عدم اصلاح' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'}
                      `}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-5 font-bold text-gray-800">{req.totalPrice} د.ل</td>
                    <td className="p-5 text-sm text-gray-500">{new Date(req.date).toLocaleDateString('ar-EG')}</td>
                    <td className="p-5">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(req)} className="bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 p-2 rounded-lg shadow-sm transition-colors" title="تعديل">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => { setFormData(req); setTimeout(() => handlePrint(true), 100); }} className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 p-2 rounded-lg shadow-sm transition-colors" title="معاينة الطباعة">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => { setFormData(req); setTimeout(() => handlePrint(false), 100); }} className="bg-white border border-gray-200 text-purple-600 hover:bg-purple-50 p-2 rounded-lg shadow-sm transition-colors" title="طباعة">
                            <Printer size={18} />
                        </button>
                        <button onClick={() => handleDelete(req.id)} className="bg-white border border-gray-200 text-red-500 hover:bg-red-50 p-2 rounded-lg shadow-sm transition-colors" title="حذف">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl max-w-4xl mx-auto no-print border border-gray-200 overflow-hidden animate-fade-in">
             {/* Header */}
            <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 rounded-lg text-secondary"><Wrench size={24}/></div>
                    معلومات الجهاز
                </h2>
                <div className="flex gap-2">
                    <button type="button" onClick={() => handlePrint(false)} className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-purple-600 text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors">
                        <Printer size={16} /> طباعة
                    </button>
                    <button type="button" onClick={() => handlePrint(true)} className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors">
                        <Eye size={16} /> معاينة
                    </button>
                    <button type="button" onClick={() => { setIsFormOpen(false); resetForm(); }} className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors">
                        <X size={16} /> إغلاق
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                
                {/* Row 1: Request Number & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <Hash size={16} className="text-secondary"/> رقم الطلب
                        </label>
                        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-mono font-bold text-left" dir="ltr">
                            {nextRequestNumber}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                             <Calendar size={16} className="text-secondary"/> تاريخ الاستلام
                        </label>
                        <div className="relative">
                            <input 
                                type="date" 
                                required 
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                 {/* Row 2: Customer Info (Moved UP) */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <User size={16} className="text-secondary"/> اسم العميل
                        </label>
                        <input 
                            required 
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all placeholder-gray-300 text-lg"
                            placeholder="أدخل اسم العميل"
                            value={formData.customerName}
                            onChange={e => setFormData({...formData, customerName: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                         <input 
                            required 
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all placeholder-gray-300 font-mono dir-ltr text-right"
                            placeholder="09xxxxxxxx"
                            value={formData.customerPhone}
                            onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                        />
                     </div>
                </div>

                {/* Row 3: Device Name (Moved DOWN) */}
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <Smartphone size={16} className="text-secondary"/> اسم الجهاز
                        </label>
                        <input 
                            required 
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all placeholder-gray-300 font-bold"
                            placeholder="أدخل اسم الجهاز"
                            value={formData.deviceName}
                            onChange={e => setFormData({...formData, deviceName: e.target.value})}
                        />
                     </div>
                </div>

                {/* Row 4: Device Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <LayoutGrid size={16} className="text-gray-400"/> سريال الجهاز
                        </label>
                        <input 
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all placeholder-gray-300 font-mono text-sm"
                            placeholder="أدخل سريال الجهاز"
                            value={formData.deviceSerial}
                            onChange={e => setFormData({...formData, deviceSerial: e.target.value})}
                        />
                    </div>

                    <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                             <Lock size={16} className="text-gray-400"/> رمز القفل
                         </label>
                        <input 
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all placeholder-gray-300"
                            placeholder="Pattern / PIN"
                            value={formData.devicePassword}
                            onChange={e => setFormData({...formData, devicePassword: e.target.value})}
                        />
                    </div>
                </div>

                {/* Problem Description */}
                <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <AlertCircle size={16} className="text-primary"/> مشكلة الجهاز
                     </label>
                     <textarea 
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-secondary outline-none transition-all min-h-[100px] resize-none text-gray-700"
                        placeholder="وصف مشكلة الجهاز"
                        value={formData.problemDescription}
                        onChange={e => setFormData({...formData, problemDescription: e.target.value})}
                     />
                </div>

                {/* Parts Section - Integrated */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-bold text-gray-700 flex items-center gap-1">
                            <DollarSign size={16} className="text-green-600"/> القطع والتكلفة
                        </label>
                        <button type="button" onClick={handleAddPart} className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 font-bold transition-colors shadow-sm text-gray-600">
                            + إضافة
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {formData.parts?.map((part, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                                <input 
                                    placeholder="اسم القطعة" 
                                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors" 
                                    value={part.name}
                                    onChange={e => handlePartChange(idx, 'name', e.target.value)}
                                />
                                <div className="relative w-32">
                                     <input 
                                        type="number" 
                                        placeholder="0" 
                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-secondary transition-colors font-bold text-center" 
                                        value={part.price}
                                        onChange={e => handlePartChange(idx, 'price', e.target.value)}
                                    />
                                    <span className="absolute left-3 top-2 text-xs text-gray-400 font-bold">د.ل</span>
                                </div>
                                <button type="button" onClick={() => handleRemovePart(idx)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                             <CheckCircle size={16} className="text-blue-600"/> حالة الجهاز
                        </label>
                        <select 
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all appearance-none"
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value as any})}
                        >
                            {DEVICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <User size={16} className="text-gray-500"/> مستلم الطلب
                        </label>
                        <select 
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all appearance-none"
                            value={formData.receiver}
                            onChange={e => setFormData({...formData, receiver: e.target.value})}
                        >
                            {STAFF_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button type="submit" className="flex-1 bg-primary text-white font-bold py-4 rounded-xl hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Save size={20} /> حفظ البيانات
                    </button>
                    {editingId && (
                        <button 
                            type="button" 
                            onClick={() => handleDelete(editingId)}
                            className="px-6 bg-red-100 text-red-600 font-bold py-4 rounded-xl hover:bg-red-200 transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={20} /> حذف
                        </button>
                    )}
                    <button type="button" onClick={() => { setIsFormOpen(false); resetForm(); }} className="px-8 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors">
                        إلغاء
                    </button>
                </div>

            </form>
        </div>
      )}

      {/* Hidden Print Layout (A4 optimized) */}
      <div className="hidden">
        <div ref={printRef}>
            <div className="header">
                <h1>{StorageService.getSettings().companyName || 'مركز الصيانة مليون موبايل'}</h1>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '5px', color: '#333', textAlign: 'center' }}>
                    {StorageService.getSettings().companyPhones || 'فرع الظل 0924561111 / فرع زناته 0949291111'}
                </div>
                {StorageService.getSettings().companyAddress && (
                    <div style={{ fontSize: '12px', marginTop: '3px', color: '#555', textAlign: 'center' }}>
                        {StorageService.getSettings().companyAddress}
                    </div>
                )}
                <div className="header-meta">
                     <div className="receipt-number">إيصال استلام رقم: #{formData.requestNumber || '...'}</div>
                     <div>التاريخ: {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            </div>

            <div className="section-title">بيانات العميل والجهاز</div>
            <table className="data-table">
                <tbody>
                    <tr>
                        <th>اسم العميل</th>
                        <td>{formData.customerName}</td>
                        <th>رقم الهاتف</th>
                        <td style={{direction: 'ltr', textAlign: 'right'}}>{formData.customerPhone}</td>
                    </tr>
                    <tr>
                        <th>موديل الجهاز</th>
                        <td>{formData.deviceName}</td>
                        <th>رمز القفل</th>
                        <td>{formData.devicePassword || '-'}</td>
                    </tr>
                    <tr>
                        <th>S/N - IMEI</th>
                        <td style={{fontFamily: 'monospace'}}>{formData.deviceSerial || '-'}</td>
                        <th>حالة الجهاز</th>
                        <td>{formData.status || '-'}</td>
                    </tr>
                    <tr>
                        <th>مستلم الطلب</th>
                        <td colSpan="3" style={{ fontWeight: 'bold' }}>{formData.receiver || '-'}</td>
                    </tr>
                </tbody>
            </table>
            
            <div className="section-title">تقرير الفني</div>
            <div className="problem-box">
                {formData.problemDescription}
            </div>

            <div className="section-title">القطع والتكلفة والإجمالي</div>
            <table className="financial-table">
                <thead>
                    <tr>
                        <th style={{width: '75%'}}>البيان / نوع الخدمة</th>
                        <th>التكلفة (د.ل)</th>
                    </tr>
                </thead>
                <tbody>
                    {formData.parts?.length ? formData.parts.map((p, i) => (
                        <tr key={i}>
                            <td style={{textAlign: 'right'}}>{p.name || 'صيانة عامة'}</td>
                            <td>{p.price}</td>
                        </tr>
                    )) : <tr><td colSpan={2}>-</td></tr>}
                </tbody>
                <tfoot>
                     <tr>
                        <td style={{textAlign: 'left', fontWeight: '800', paddingLeft: '15px'}}>الإجمالي النهائي:</td>
                        <td style={{fontWeight: '900', fontSize: '15px'}}>{formData.parts?.reduce((sum, p) => sum + (Number(p.price) || 0), 0)}</td>
                     </tr>
                </tfoot>
            </table>

            <div className="footer">
                <div className="terms">
                    <strong>شروط وأحكام الصيانة:</strong><br/>
                    1. المركز غير مسؤول عن فقدان البيانات المخزنة على الجهاز (صور، أسماء، ملفات). يرجى أخذ نسخة احتياطية قبل التسليم.<br/>
                    2. الجهاز المتروك لأكثر من 15 يوماً بعد إبلاغ العميل بانتهاء الصيانة أو عدم إمكانية الإصلاح، لا يتحمل المركز مسؤولية فقدانه.<br/>
                    3. الضمان يشمل القطع المستبدلة فقط ولا يشمل سوء الاستخدام أو الكسور.<br/>
                </div>
                <div className="signatures">
                    <div className="sig-box">
                        <div className="sig-label">توقيع المستلم</div>
                        <div className="sig-line"></div>
                        <div style={{fontSize: '10px'}}>{APP_NAME}</div>
                    </div>
                    <div className="sig-box">
                        <div className="sig-label">توقيع العميل</div>
                        <div className="sig-line"></div>
                        <div style={{fontSize: '10px'}}>أوافق على الشروط والبيانات أعلاه</div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <DeleteModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        requirePassword={!!StorageService.getSettings().deletePassword}
        title="حذف طلب صيانة"
        message="هل أنت متأكد من رغبتك في حذف طلب الصيانة هذا نهائياً؟ لا يمكن التراجع عن هذه الخطوة."
      />
    </div>
  );
};

export default ServiceRequests;
