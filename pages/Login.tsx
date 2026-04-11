import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import StorageService from '../services/storage';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = StorageService.getUsers();
    let user = users.find(u => u.username === username && u.password === password);

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
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-secondary overflow-hidden">
                {StorageService.getSettings().companyLogo ? (
                    <img src={StorageService.getSettings().companyLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-6xl font-black text-primary font-sans">
                        {(StorageService.getSettings().companyName || 'م').charAt(0)}
                    </span>
                )}
            </div>
          </div>
          <p className="text-gray-300 text-sm mt-1 border-t border-gray-600 pt-3 inline-block px-4">{StorageService.getSettings().companyName || 'نظام إدارة مركز الصيانة'}</p>
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
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-left"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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
            <p className="mt-2">الإصدار 3.2.0 - جميع الحقوق محفوظة لـ {StorageService.getSettings().companyName || 'مركز مليون موبايل'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;