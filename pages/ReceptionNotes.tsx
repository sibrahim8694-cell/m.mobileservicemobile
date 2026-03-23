
import React, { useState, useEffect, useRef } from 'react';
import StorageService from '../services/storage';
import { ReceptionNote, User as UserType } from '../types';
import { RECEPTION_TAKERS, APP_NAME } from '../constants';
import { Check, Plus, Search, User, Phone, Edit3, Clock, Printer, Trash2, Calendar, Shield, Hash, AlertTriangle, BellRing } from 'lucide-react';
import DeleteModal from '../components/DeleteModal';

const ReceptionNotes: React.FC = () => {
  const [notes, setNotes] = useState<ReceptionNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState({
    customerName: '',
    customerPhone: '',
    note: '',
    taker: RECEPTION_TAKERS[0]
  });

  const printRef = useRef<HTMLDivElement>(null);
  const [printNote, setPrintNote] = useState<ReceptionNote | null>(null);

  useEffect(() => {
    loadNotes();
    const stored = localStorage.getItem('mm_current_user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (printNote && printRef.current) {
        const settings = StorageService.getSettings();
        const companyName = settings.companyName || APP_NAME;
        const win = window.open('', '', 'height=600,width=800');
        if (win) {
            win.document.write(`
                <html dir="rtl">
                <head>
                    <title>ملاحظة - ${companyName}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Cairo', sans-serif; padding: 40px; }
                        .note-card {
                            border: 2px solid #000;
                            padding: 20px;
                            border-radius: 10px;
                            text-align: center;
                        }
                        h1 { margin-bottom: 5px; }
                        .logo-symbol { display: inline-block; width: 60px; height: 60px; background: #000; color: #d4af37; border-radius: 50%; text-align: center; line-height: 60px; font-size: 30px; font-weight: bold; overflow: hidden; }
                        .logo-symbol img { width: 100%; height: 100%; object-fit: cover; }
                        .meta { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
                        .content { 
                            text-align: right; 
                            font-size: 18px; 
                            margin: 20px 0; 
                            padding: 20px 0;
                        }
                        .footer { margin-top: 30px; display: flex; justify-content: space-between; }
                        .note-num { background: #000; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="note-card">
                        ${printRef.current.innerHTML}
                    </div>
                    <script>
                        setTimeout(() => { window.print(); window.close(); }, 500);
                    </script>
                </body>
                </html>
            `);
            win.document.close();
            setPrintNote(null);
        }
    }
  }, [printNote]);

  const loadNotes = () => {
    setNotes(StorageService.getNotes().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create Date object from selected date input, preserving current time for sorting
    const now = new Date();
    const selectedDate = new Date(date);
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    await StorageService.saveNote({
      ...newNote,
      date: selectedDate.toISOString(),
      isCompleted: false
    });
    
    setNewNote({ customerName: '', customerPhone: '', note: '', taker: RECEPTION_TAKERS[0] });
    setDate(new Date().toISOString().split('T')[0]); // Reset date to today
    loadNotes();
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

      await StorageService.deleteNote(deleteModal.id);
      loadNotes();
      setDeleteModal({ isOpen: false, id: null });
  };

  const toggleComplete = async (note: ReceptionNote) => {
    await StorageService.updateNote({ ...note, isCompleted: !note.isCompleted });
    loadNotes();
  };

  const hasPermission = (permId: string) => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin') return true;
      return currentUser.permissions?.includes(permId);
  };

  const checkIsOverdue = (dateString: string, isCompleted: boolean) => {
      if (isCompleted) return false;
      const noteTime = new Date(dateString).getTime();
      const currentTime = new Date().getTime();
      const diffInHours = (currentTime - noteTime) / (1000 * 60 * 60);
      return diffInHours > 24;
  };

  const filteredNotes = notes.filter(n => n.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
  const overdueCount = filteredNotes.filter(n => checkIsOverdue(n.date, n.isCompleted)).length;

  return (
    <div className="p-6 bg-gray-50 min-h-full">
       <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Edit3 /> ملاحظات الريسبشن
            </h1>
            <p className="text-gray-500 text-sm mt-1">سجل المتابعات والاستفسارات اليومية</p>
         </div>
         <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-3 text-gray-400" size={20} />
            <input 
                className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary shadow-sm"
                placeholder="بحث عن عميل..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
       </div>

        {overdueCount > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between text-red-700 animate-fade-in shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-full"><BellRing size={20} className="animate-pulse"/></div>
                    <span className="font-bold text-lg">تنبيه: يوجد {overdueCount} ملاحظات متأخرة لم يتم إغلاقها منذ أكثر من 24 ساعة!</span>
                </div>
                <div className="text-xs font-semibold bg-white px-3 py-1 rounded-full border border-red-100 shadow-sm">
                    يرجى المراجعة
                </div>
            </div>
        )}

       <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         {/* Form Section - Clean & Professional */}
         <div className="xl:col-span-4 order-2 xl:order-1">
           {hasPermission('add_note') ? (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
               <div className="bg-primary p-4 flex items-center justify-between">
                  <h2 className="font-bold text-white text-lg flex items-center gap-2">
                      <Plus size={20} className="text-secondary" /> ملاحظة جديدة
                  </h2>
               </div>
               
               <form onSubmit={handleAdd} className="p-6 space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">تاريخ الملاحظة</label>
                        <div className="relative">
                            <Calendar className="absolute right-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="date"
                                required 
                                className="w-full pr-10 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-secondary transition-colors outline-none font-sans"
                                value={date} 
                                onChange={e => setDate(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">اسم العميل</label>
                        <div className="relative">
                            <User className="absolute right-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                required 
                                className="w-full pr-10 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-secondary transition-colors outline-none placeholder-gray-400"
                                placeholder="الاسم" 
                                value={newNote.customerName} 
                                onChange={e => setNewNote({...newNote, customerName: e.target.value})} 
                            />
                        </div>
                    </div>
                    
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">رقم الهاتف</label>
                        <div className="relative">
                            <Phone className="absolute right-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                className="w-full pr-10 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-secondary transition-colors outline-none font-mono placeholder-gray-400"
                                placeholder="09..." 
                                value={newNote.customerPhone} 
                                onChange={e => setNewNote({...newNote, customerPhone: e.target.value})} 
                            />
                        </div>
                    </div>
                 </div>

                 <div>
                   <label className="text-xs font-bold text-gray-500 mb-1.5 block">تفاصيل الملاحظة</label>
                   <textarea 
                        required 
                        rows={4} 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-secondary transition-colors outline-none resize-none"
                        placeholder="اكتب التفاصيل هنا..." 
                        value={newNote.note} 
                        onChange={e => setNewNote({...newNote, note: e.target.value})} 
                   />
                 </div>

                 <div>
                   <label className="text-xs font-bold text-gray-500 mb-1.5 block">المسؤول (المدون)</label>
                   <div className="relative">
                       <select 
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-secondary transition-colors outline-none appearance-none"
                            value={newNote.taker} 
                            onChange={e => setNewNote({...newNote, taker: e.target.value})}
                       >
                          {RECEPTION_TAKERS.map(n => <option key={n} value={n}>{n}</option>)}
                       </select>
                       <div className="absolute left-3 top-3 pointer-events-none text-gray-500">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                       </div>
                   </div>
                 </div>

                 <button type="submit" className="w-full bg-primary text-secondary font-bold py-3 rounded-xl hover:bg-gray-800 shadow-md transform active:scale-95 transition-all flex justify-center items-center gap-2">
                   <Plus size={20} /> حفظ الملاحظة
                 </button>
               </form>
             </div>
           ) : (
             <div className="bg-gray-100 p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400 flex flex-col items-center gap-2">
               <Shield size={32} className="opacity-50" />
               <p>ليس لديك صلاحية إضافة ملاحظات</p>
             </div>
           )}
         </div>

         {/* List Section - Cards */}
         <div className="xl:col-span-8 order-1 xl:order-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {filteredNotes.map(note => {
                   const isOverdue = checkIsOverdue(note.date, note.isCompleted);
                   return (
                   <div key={note.id} 
                        className={`p-5 rounded-2xl border transition-all duration-200 relative group flex flex-col
                          ${note.isCompleted 
                            ? 'bg-gray-50 border-gray-200 opacity-60' 
                            : isOverdue 
                                ? 'bg-red-50 border-red-300 ring-1 ring-red-100' 
                                : 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-secondary'}
                        `}>
                      
                      {/* Note Number Badge */}
                      <div className="absolute top-5 left-5 flex gap-2">
                         {isOverdue && !note.isCompleted && (
                             <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm animate-pulse">
                                <AlertTriangle size={12} /> متأخرة
                             </div>
                         )}
                         <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-gray-200">
                            <Hash size={12} /> {note.noteNumber || '-'}
                         </div>
                      </div>

                      <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 shadow-sm
                                ${note.isCompleted ? 'bg-gray-200 text-gray-500' : 'bg-gradient-to-br from-primary to-gray-800 text-secondary'}
                             `}>
                               {note.customerName.charAt(0)}
                             </div>
                             <div>
                                <h3 className={`font-bold text-lg leading-tight ${note.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                  {note.customerName}
                                </h3>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                   <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : ''}`}><Clock size={12} /> {new Date(note.date).toLocaleDateString('ar-EG')}</span>
                                   <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                   <span className="font-mono">{note.customerPhone}</span>
                                </div>
                             </div>
                        </div>

                        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pl-12">
                            <button onClick={() => setPrintNote(note)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="طباعة">
                                <Printer size={18} />
                            </button>
                            <button onClick={() => handleDelete(note.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                                <Trash2 size={18} />
                            </button>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${note.isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                          {note.note}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">مدون الملاحظة</div>
                            <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{note.taker}</div>
                         </div>
                         
                         <button 
                            onClick={() => toggleComplete(note)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                            ${note.isCompleted 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-green-600 hover:text-white'}
                            `}
                        >
                            {note.isCompleted ? <><Check size={14} /> مكتملة</> : 'تحديد كمكتملة'}
                        </button>
                      </div>
                   </div>
                 );
                })}
            </div>
             
            {filteredNotes.length === 0 && (
               <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300 mt-4">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                   <Search size={32} />
                 </div>
                 <p className="text-gray-500 font-medium">لا توجد ملاحظات مسجلة</p>
               </div>
            )}
         </div>
       </div>

       {/* Hidden Print Container */}
       <div className="hidden">
            <div ref={printRef}>
                {printNote && (
                    <>
                        <div style={{textAlign: 'center', marginBottom: '10px'}}>
                            <div className="logo-symbol">
                                {StorageService.getSettings().companyLogo ? (
                                    <img src={StorageService.getSettings().companyLogo} alt="Logo" />
                                ) : (
                                    (StorageService.getSettings().companyName || 'م').charAt(0)
                                )}
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '10px', color: '#000' }}>
                                {StorageService.getSettings().companyName || APP_NAME}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '5px', color: '#333' }}>
                                {StorageService.getSettings().companyPhones || 'فرع الظل 0924561111 / فرع زناته 0949291111'}
                            </div>
                            {StorageService.getSettings().companyAddress && (
                                <div style={{ fontSize: '11px', marginTop: '3px', color: '#555' }}>
                                    {StorageService.getSettings().companyAddress}
                                </div>
                            )}
                        </div>
                        <div className="meta">
                            <div className="date">التاريخ: {new Date(printNote.date).toLocaleString('ar-EG')}</div>
                            <div className="note-num">#{printNote.noteNumber || '-'}</div>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                             <div><strong>العميل:</strong> {printNote.customerName}</div>
                             <div><strong>الهاتف:</strong> {printNote.customerPhone}</div>
                        </div>
                        <div className="content">
                            {printNote.note}
                        </div>
                        <div className="footer">
                             <div>المدون: {printNote.taker}</div>
                        </div>
                    </>
                )}
            </div>
       </div>

       <DeleteModal 
         isOpen={deleteModal.isOpen}
         onClose={() => setDeleteModal({ isOpen: false, id: null })}
         onConfirm={confirmDelete}
         requirePassword={!!StorageService.getSettings().deletePassword}
         title="حذف ملاحظة"
         message="هل أنت متأكد من رغبتك في حذف هذه الملاحظة نهائياً؟"
       />
    </div>
  );
};

export default ReceptionNotes;
