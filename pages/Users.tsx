import React, { useState, useEffect } from 'react';
import StorageService from '../services/storage';
import { User } from '../types';
import { PERMISSIONS_LIST } from '../constants';
import { Users as UsersIcon, Plus, Trash2, Shield, User as UserIcon, Edit, Key, CheckSquare, Check, X } from 'lucide-react';
import DeleteModal from '../components/DeleteModal';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string | null, username: string }>({ isOpen: false, id: null, username: '' });
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'operator' as 'admin' | 'operator',
    permissions: [] as string[]
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(StorageService.getUsers());
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', fullName: '', role: 'operator', permissions: [] });
    setEditingUser(null);
    setIsFormOpen(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
        username: user.username,
        password: user.password || '',
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions || []
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username && formData.password && formData.fullName) {
      if (editingUser) {
        await StorageService.updateUser({
            ...editingUser,
            username: formData.username,
            password: formData.password,
            fullName: formData.fullName,
            role: editingUser.id === '1' ? 'admin' : formData.role,
            permissions: formData.permissions
        });
      } else {
        await StorageService.saveUser({
          id: '', 
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role,
          permissions: formData.permissions
        });
      }
      resetForm();
      loadUsers();
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (id === '1') {
      alert('لا يمكن حذف المدير الرئيسي للنظام');
      return;
    }
    setDeleteModal({ isOpen: true, id, username });
  };

  const confirmDelete = async (password?: string) => {
    if (!deleteModal.id) return;

    const settings = StorageService.getSettings();
    if (settings.deletePassword && password !== settings.deletePassword) {
        alert('كلمة المرور غير صحيحة. تم إلغاء الحذف.');
        return;
    }

    await StorageService.deleteUser(deleteModal.id);
    loadUsers();
    setDeleteModal({ isOpen: false, id: null, username: '' });
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => {
        const perms = prev.permissions.includes(permId)
            ? prev.permissions.filter(p => p !== permId)
            : [...prev.permissions, permId];
        return { ...prev, permissions: perms };
    });
  };

  const selectAllPermissions = () => {
      setFormData(prev => ({ ...prev, permissions: PERMISSIONS_LIST.map(p => p.id) }));
  };

  const clearAllPermissions = () => {
      setFormData(prev => ({ ...prev, permissions: [] }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <UsersIcon /> إدارة المستخدمين والصلاحيات
          </h1>
          <p className="text-gray-500 text-sm mt-1">إضافة موظفين، وتعيين أدوارهم وصلاحياتهم</p>
        </div>
        {!isFormOpen && (
            <button 
            onClick={() => { resetForm(); setIsFormOpen(true); }} 
            className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg"
            >
            <Plus size={20} /> مستخدم جديد
            </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Form Area */}
        {isFormOpen && (
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 sticky top-6">
               <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        {editingUser ? <Edit size={20} className="text-blue-500" /> : <Plus size={20} className="text-green-500" />}
                        {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
                    </h3>
                    <button onClick={resetForm} className="text-gray-400 hover:text-red-500">
                        <X size={20} />
                    </button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                   <label className="label">الاسم الكامل للموظف</label>
                   <input required className="input bg-gray-50" placeholder="مثلاً: محمد علي" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">اسم المستخدم</label>
                        <input required className="input bg-gray-50 font-mono" placeholder="username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                    </div>
                    <div>
                        <label className="label flex items-center gap-1"><Key size={14}/> كلمة المرور</label>
                        <input required className="input bg-gray-50 font-mono" placeholder="••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                 </div>
                 
                 <div>
                   <label className="label">نوع الحساب (الدور)</label>
                   <select 
                     className="input bg-gray-50" 
                     value={formData.role} 
                     onChange={e => setFormData({...formData, role: e.target.value as any})}
                     disabled={editingUser?.id === '1'}
                   >
                     <option value="operator">موظف (Operator)</option>
                     <option value="admin">مدير نظام (Admin)</option>
                   </select>
                 </div>

                 {formData.role === 'operator' && (
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                <CheckSquare size={16}/> الصلاحيات المتاحة
                            </label>
                            <div className="flex gap-2">
                                <button type="button" onClick={selectAllPermissions} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">الكل</button>
                                <button type="button" onClick={clearAllPermissions} className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">إلغاء</button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {PERMISSIONS_LIST.map(perm => (
                                <div 
                                    key={perm.id} 
                                    onClick={() => togglePermission(perm.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                                        ${formData.permissions.includes(perm.id) 
                                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                            : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}
                                    `}
                                >
                                    <span className="text-xs font-bold">{perm.label}</span>
                                    {formData.permissions.includes(perm.id) ? <Check size={16} /> : <div className="w-4 h-4 border-2 border-gray-200 rounded"></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                 )}

                 <div className="flex gap-3 pt-6">
                    <button type="submit" className="flex-1 bg-secondary text-primary font-bold py-4 rounded-xl hover:bg-yellow-500 shadow-md">
                        {editingUser ? 'تحديث البيانات' : 'حفظ الموظف'}
                    </button>
                 </div>
               </form>
            </div>
          </div>
        )}

        {/* List Area */}
        <div className={isFormOpen ? 'col-span-12 lg:col-span-8' : 'col-span-12'}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {users.map(user => (
              <div key={user.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-full h-1.5 ${user.role === 'admin' ? 'bg-secondary' : 'bg-blue-400'}`}></div>

                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl ${user.role === 'admin' ? 'bg-yellow-50 text-secondary' : 'bg-blue-50 text-blue-500'}`}>
                    {user.role === 'admin' ? <Shield size={32} /> : <UserIcon size={32} />}
                  </div>
                  
                  <div className="flex gap-1 transition-opacity">
                    <button onClick={() => handleEdit(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="تعديل">
                        <Edit size={18} />
                    </button>
                    {user.id !== '1' && (
                        <button onClick={() => handleDelete(user.id, user.username)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                            <Trash2 size={18} />
                        </button>
                    )}
                  </div>
                </div>
                
                <h3 className="font-bold text-xl text-gray-800 mb-1">{user.fullName}</h3>
                <p className="text-gray-400 text-sm font-mono dir-ltr text-right mb-4">@{user.username}</p>
                
                <div className="pt-4 border-t border-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">نوع الحساب:</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-secondary text-primary' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role === 'admin' ? 'مدير نظام' : 'موظف'}
                    </span>
                  </div>
                  
                  {user.role === 'operator' && (
                      <div>
                          <p className="text-[10px] text-gray-400 mb-2">الصلاحيات:</p>
                          <div className="flex flex-wrap gap-1">
                              {user.permissions?.length ? user.permissions.map(p => {
                                  const label = PERMISSIONS_LIST.find(pl => pl.id === p)?.label;
                                  return label ? <span key={p} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">{label}</span> : null;
                              }) : <span className="text-[9px] text-red-400 italic">لا توجد صلاحيات معينة</span>}
                          </div>
                      </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DeleteModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, username: '' })}
        onConfirm={confirmDelete}
        requirePassword={!!StorageService.getSettings().deletePassword}
        title="حذف مستخدم"
        message={`هل أنت متأكد من رغبتك في حذف المستخدم ${deleteModal.username} نهائياً؟`}
      />
    </div>
  );
};

export default Users;