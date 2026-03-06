import React, { useState } from 'react';
import { User } from '../types';
import StorageService from '../services/storage';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = StorageService.getUsers();
    let user = users.find(u => u.username === username && u.password === password);

    // Hardcoded fallback to guarantee access even if database is out of sync
    if (!user && username === 'admin' && password === '123456') {
      user = {
        id: '1',
        username: 'admin',
        password: '123456',
        fullName: 'مدير النظام',
        role: 'admin',
        permissions: []
      };
    }

    if (user) {
      onLogin(user);
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header / Logo Area */}
        <div className="bg-primary p-8 text-center relative">
          <div className="flex justify-center mb-4">
            {/* Styled M Logo */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-secondary">
                <span className="text-6xl font-black text-primary font-sans">M</span>
            </div>
          </div>
          <p className="text-gray-300 text-sm mt-1 border-t border-gray-600 pt-3 inline-block px-4">نظام إدارة مركز الصيانة</p>
        </div>

        {/* Form Area */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">تسجيل الدخول</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-left"
                placeholder="ادخل اسم المستخدم"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-left"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors duration-200 shadow-md"
            >
              دخول
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p className="mt-2">الإصدار 3.2.0 - جميع الحقوق محفوظة لمركز مليون موبايل</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;