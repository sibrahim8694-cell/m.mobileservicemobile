import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Compatibility from './pages/Compatibility';
import ServiceRequests from './pages/ServiceRequests';
import ReceptionNotes from './pages/ReceptionNotes';
import Settings from './pages/Settings';
import Calculators from './pages/Calculators';
import Users from './pages/Users';
import CustomerFollowUps from './pages/CustomerFollowUps';
import CustomerNotifications from './pages/CustomerNotifications';
import StorageService from './services/storage';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    StorageService.init();
    // Check session - in a real app check token
    const storedUser = sessionStorage.getItem('mm_current_user');
    if (storedUser) setUser(JSON.parse(storedUser));

    // Update document title
    const settings = StorageService.getSettings();
    if (settings.companyName) {
      document.title = settings.companyName;
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    sessionStorage.setItem('mm_current_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('mm_current_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans" dir="rtl">
        <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          isOpen={isSidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
          {/* Mobile Header */}
          <header className="bg-white shadow-sm p-4 flex items-center md:hidden z-10 no-print">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
              <Menu size={24} />
            </button>
            <h1 className="flex-1 text-center font-bold text-primary">{StorageService.getSettings().companyName || 'مليون موبايل'}</h1>
            <div className="w-6"></div> {/* Spacer */}
          </header>

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/compatibility" element={<Compatibility />} />
              <Route path="/new-request" element={<Navigate to="/requests" replace />} /> {/* Simplified flow */}
              <Route path="/requests" element={<ServiceRequests />} />
              <Route path="/notes" element={<ReceptionNotes />} />
              <Route path="/calculators" element={<Calculators />} />
              <Route path="/follow-ups" element={<CustomerFollowUps />} />
              <Route path="/notifications" element={<CustomerNotifications />} />
              <Route path="/backup" element={<Settings />} />
              <Route path="/users" element={user.role === 'admin' ? <Users /> : <Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;