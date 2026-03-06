import React, { useState } from 'react';
import { AlertTriangle, Key, X } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => void;
  requirePassword?: boolean;
  title?: string;
  message?: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  requirePassword = false,
  title = 'تأكيد الحذف',
  message = 'هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذه الخطوة.'
}) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(requirePassword ? password : undefined);
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
          <h3 className="font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle size={20} /> {title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-600 mb-6 leading-relaxed text-sm">
            {message}
          </p>
          
          {requirePassword && (
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                <Key size={16} className="text-gray-400" /> كلمة مرور الحذف
              </label>
              <input 
                type="password" 
                required 
                autoFocus
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                placeholder="أدخل كلمة المرور لتأكيد الحذف"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          
          <div className="flex gap-3">
            <button 
              type="submit" 
              className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
            >
              تأكيد الحذف
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteModal;
