import { User, ServiceRequest, ReceptionNote, BackupLog } from '../types';
import { supabase } from './supabase';

const KEYS = {
  USERS: 'mm_users',
  REQUESTS: 'mm_requests',
  NOTES: 'mm_notes',
  BACKUPS: 'mm_backups',
  SETTINGS: 'mm_settings'
};

const safeParse = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const StorageService = {
  init: () => {
    const currentUsers = safeParse<User[]>(KEYS.USERS, []);
    if (currentUsers.length === 0) {
      const defaultAdmin: User = {
        id: '1',
        username: 'admin',
        password: '123456',
        fullName: 'مدير النظام',
        role: 'admin',
        permissions: [] // Admin implicitly has all
      };
      localStorage.setItem(KEYS.USERS, JSON.stringify([defaultAdmin]));
    }
    if (!localStorage.getItem(KEYS.REQUESTS)) localStorage.setItem(KEYS.REQUESTS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.NOTES)) localStorage.setItem(KEYS.NOTES, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.BACKUPS)) localStorage.setItem(KEYS.BACKUPS, JSON.stringify([]));
    
    // Auto-sync listener simulation
    window.addEventListener('storage', (e) => {
        if (e.key && Object.values(KEYS).includes(e.key)) {
            console.log("Data synced from other tab/user context");
        }
    });

    // Try to sync from Supabase on init
    StorageService.syncFromSupabase();
    
    // Try to sync from MEGA on init
    StorageService.syncFromMega();
  },

  syncFromMega: async (isManual = false) => {
    try {
      console.log("Attempting to sync from MEGA...");
      const response = await fetch('/api/backup/mega/latest');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch from MEGA");
      }
      const { data } = await response.json();
      if (data) {
        if (data.users && data.users.length > 0) {
          localStorage.setItem(KEYS.USERS, JSON.stringify(data.users));
        }
        if (data.requests && data.requests.length > 0) {
          localStorage.setItem(KEYS.REQUESTS, JSON.stringify(data.requests));
        }
        if (data.notes && data.notes.length > 0) {
          localStorage.setItem(KEYS.NOTES, JSON.stringify(data.notes));
        }
        console.log("Successfully synced local data from MEGA");
        window.dispatchEvent(new Event('mm_data_updated'));
        if (isManual) {
          alert('تم استعادة النسخة الاحتياطية من MEGA بنجاح!');
          window.location.reload();
        }
      } else {
        console.log("No backup found on MEGA");
        if (isManual) {
          alert('لا توجد نسخة احتياطية على MEGA.');
        }
      }
    } catch (error: any) {
      console.error("Error syncing from MEGA:", error);
      if (isManual) {
        alert(`حدث خطأ أثناء الاستعادة: ${error.message}`);
      }
    }
  },

  syncFromSupabase: async () => {
    try {
      // Fetch users
      const { data: users, error: usersError } = await supabase.from('users').select('*');
      if (!usersError && users && users.length > 0) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      }

      // Fetch requests
      const { data: requests, error: requestsError } = await supabase.from('service_requests').select('*');
      if (!requestsError && requests && requests.length > 0) {
        localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));
      }

      // Fetch notes
      const { data: notes, error: notesError } = await supabase.from('reception_notes').select('*');
      if (!notesError && notes && notes.length > 0) {
        localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
      }
    } catch (error) {
      console.error("Error syncing from Supabase:", error);
    }
  },

  checkTables: async () => {
    const tables = ['users', 'service_requests', 'reception_notes'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        console.error(`Table ${table} check failed:`, error.message);
      } else {
        console.log(`Table ${table} is accessible.`);
      }
    }
  },

  syncToSupabase: async () => {
    try {
      const users = StorageService.getUsers();
      const requests = StorageService.getRequests();
      const notes = StorageService.getNotes();

      if (users.length > 0) {
        const { error } = await supabase.from('users').upsert(users);
        if (error) {
          console.error("Error syncing users to Supabase:", error);
          alert(`فشل ترحيل المستخدمين: ${error.message}`);
        }
      }

      if (requests.length > 0) {
        const { error } = await supabase.from('service_requests').upsert(requests);
        if (error) {
          console.error("Error syncing requests to Supabase:", error);
          alert(`فشل ترحيل طلبات الصيانة: ${error.message}`);
        }
      }

      if (notes.length > 0) {
        const { error } = await supabase.from('reception_notes').upsert(notes);
        if (error) {
          console.error("Error syncing notes to Supabase:", error);
          alert(`فشل ترحيل الملاحظات: ${error.message}`);
        }
      }
      
      console.log("Successfully synced local data to Supabase");
      return true;
    } catch (error) {
      console.error("Error syncing to Supabase:", error);
      return false;
    }
  },

  getUsers: (): User[] => {
    const users = safeParse<User[]>(KEYS.USERS, []);
    // Ensure the main admin account always exists
    if (!users.some(u => u.id === '1')) {
      const defaultAdmin: User = {
        id: '1',
        username: 'admin',
        password: '123456',
        fullName: 'مدير النظام',
        role: 'admin',
        permissions: []
      };
      users.unshift(defaultAdmin);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
    return users;
  },
  saveUser: async (user: User) => {
    const users = StorageService.getUsers();
    if (users.some(u => u.username === user.username)) {
        throw new Error("User already exists");
    }
    const newUser = { ...user, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2, 9) };
    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    
    // Sync to Supabase
    try {
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) throw error;
      console.log("User saved to Supabase successfully");
    } catch (error) {
      console.error("Error saving user to Supabase:", error);
    }

    StorageService.triggerAutoCloudBackup();
  },
  updateUser: async (updatedUser: User) => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        users[index] = updatedUser;
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        const currentUser = JSON.parse(localStorage.getItem('mm_current_user') || '{}');
        if (currentUser.id === updatedUser.id) {
            localStorage.setItem('mm_current_user', JSON.stringify(updatedUser));
        }

        // Sync to Supabase
        try {
          await supabase.from('users').update(updatedUser).eq('id', updatedUser.id);
        } catch (error) {
          console.error("Error updating user in Supabase:", error);
        }

        StorageService.triggerAutoCloudBackup();
    }
  },
  deleteUser: async (id: string) => {
    console.log(`[Storage] Deleting user with ID: ${id}`);
    const users = StorageService.getUsers();
    
    // Check if user exists before deleting
    const userExists = users.some(u => u.id === id);
    if (!userExists) {
        console.warn(`[Storage] User with ID ${id} not found in local storage.`);
        // Try to find by username if ID fails (fallback for legacy data)
        // But for now, just return or proceed with Supabase check
    }

    const newUsers = users.filter(u => u.id !== id);
    localStorage.setItem(KEYS.USERS, JSON.stringify(newUsers));
    console.log(`[Storage] User deleted locally. New count: ${newUsers.length}`);

    // Sync to Supabase
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        console.error("Error deleting user from Supabase:", error);
      } else {
        console.log("[Storage] User deleted from Supabase successfully");
      }
    } catch (error) {
      console.error("Error deleting user from Supabase:", error);
    }

    StorageService.triggerAutoCloudBackup();
  },

  getRequests: (): ServiceRequest[] => safeParse<ServiceRequest[]>(KEYS.REQUESTS, []),
  saveRequest: async (req: Omit<ServiceRequest, 'id'>) => {
    const requests = StorageService.getRequests();
    
    // Calculate sequential number
    let nextNumber = 1;
    if (requests.length > 0) {
        const numbers = requests.map(r => {
            const n = parseInt(r.requestNumber);
            return isNaN(n) ? 0 : n;
        });
        nextNumber = Math.max(...numbers) + 1;
    }

    const newReq = { 
        ...req, 
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2, 9), 
        requestNumber: nextNumber.toString() 
    };
    
    requests.push(newReq);
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));

    // Sync to Supabase
    try {
      const { error } = await supabase.from('service_requests').insert([newReq]);
      if (error) {
        console.error("Error saving request to Supabase:", error);
        alert(`فشل الحفظ في السحابة: ${error.message}`);
      } else {
        console.log("Request saved to Supabase successfully");
      }
    } catch (error: any) {
      console.error("Error saving request to Supabase:", error);
      alert(`خطأ في الاتصال بالسحابة: ${error.message}`);
    }

    StorageService.triggerAutoCloudBackup();
    return newReq;
  },
  updateRequest: async (req: ServiceRequest) => {
    const requests = StorageService.getRequests().map(r => r.id === req.id ? req : r);
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));

    // Sync to Supabase
    try {
      await supabase.from('service_requests').update(req).eq('id', req.id);
    } catch (error) {
      console.error("Error updating request in Supabase:", error);
    }

    StorageService.triggerAutoCloudBackup();
  },
  deleteRequest: async (id: string) => {
    const requests = StorageService.getRequests().filter(r => r.id !== id);
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));

    // Sync to Supabase
    try {
      await supabase.from('service_requests').delete().eq('id', id);
    } catch (error) {
      console.error("Error deleting request from Supabase:", error);
    }

    StorageService.triggerAutoCloudBackup();
  },

  getNotes: (): ReceptionNote[] => safeParse<ReceptionNote[]>(KEYS.NOTES, []),
  
  getSettings: () => safeParse<any>(KEYS.SETTINGS, { 
    deletePassword: '',
    companyName: 'مركز الصيانة مليون موبايل',
    companyPhones: 'فرع الظل 0924561111 / فرع زناته 0949291111',
    companyAddress: '',
    companyLogo: ''
  }),
  
  saveSettings: (settings: any) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  saveNote: async (note: Omit<ReceptionNote, 'id' | 'noteNumber'>) => {
    const notes = StorageService.getNotes();
    
    // Calculate sequential number for notes
    let nextNumber = 1;
    if (notes.length > 0) {
        const numbers = notes.map(n => {
            const num = parseInt(n.noteNumber || '0');
            return isNaN(num) ? 0 : num;
        });
        nextNumber = Math.max(...numbers) + 1;
    }

    const newNote = { 
        ...note, 
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2, 9),
        noteNumber: nextNumber.toString()
    };
    notes.push(newNote);
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));

    // Sync to Supabase
    try {
      const { error } = await supabase.from('reception_notes').insert([newNote]);
      if (error) {
        console.error("Error saving note to Supabase:", error);
        alert(`فشل الحفظ في السحابة: ${error.message}`);
      } else {
        console.log("Note saved to Supabase successfully");
      }
    } catch (error: any) {
      console.error("Error saving note to Supabase:", error);
      alert(`خطأ في الاتصال بالسحابة: ${error.message}`);
    }

    StorageService.triggerAutoCloudBackup();
  },
  updateNote: async (note: ReceptionNote) => {
    const notes = StorageService.getNotes().map(n => n.id === note.id ? note : n);
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));

    // Sync to Supabase
    try {
      await supabase.from('reception_notes').update(note).eq('id', note.id);
    } catch (error) {
      console.error("Error updating note in Supabase:", error);
    }

    StorageService.triggerAutoCloudBackup();
  },
  deleteNote: async (id: string) => {
    const notes = StorageService.getNotes().filter(n => n.id !== id);
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));

    // Sync to Supabase
    try {
      await supabase.from('reception_notes').delete().eq('id', id);
    } catch (error) {
      console.error("Error deleting note from Supabase:", error);
    }

    StorageService.triggerAutoCloudBackup();
  },

  getBackups: (): BackupLog[] => safeParse<BackupLog[]>(KEYS.BACKUPS, []),
  
  triggerAutoCloudBackup: async (isManual = false) => {
    if (isManual) {
      return StorageService.performCloudBackup('manual');
    }

    // Debounce auto backups to prevent spamming
    if ((window as any).mm_auto_backup_timer) {
      clearTimeout((window as any).mm_auto_backup_timer);
    }

    (window as any).mm_auto_backup_timer = setTimeout(() => {
      StorageService.performCloudBackup('auto');
    }, 5000); // 5 seconds delay
  },

  performCloudBackup: async (type: 'auto' | 'manual') => {
    console.log(`Starting ${type} cloud backup...`);
    if (type === 'manual') {
      window.dispatchEvent(new Event('mm_backup_start'));
    }
    
    const jsonString = StorageService.createBackup('cloud');
    
    try {
      const response = await fetch(`/api/backup/mega?type=${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: JSON.parse(jsonString) })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to backup to MEGA:", errorData);
        if (type === 'manual') {
          window.dispatchEvent(new Event('mm_backup_error'));
          alert(`فشل النسخ الاحتياطي: ${errorData.error || 'تأكد من إعدادات MEGA'}`);
        }
      } else {
        console.log(`Successfully backed up to MEGA (${type})`);
        if (type === 'manual') {
          window.dispatchEvent(new Event('mm_backup_success'));
          alert('تم رفع النسخة الاحتياطية إلى MEGA بنجاح!');
        }
      }
    } catch (error: any) {
      console.error("Error calling MEGA backup API:", error);
      if (type === 'manual') {
        window.dispatchEvent(new Event('mm_backup_error'));
        alert(`حدث خطأ في الاتصال: ${error.message}`);
      }
    }
  },

  createBackup: (type: 'local' | 'cloud') => {
    const data = {
      users: StorageService.getUsers(),
      requests: StorageService.getRequests(),
      notes: StorageService.getNotes(),
      timestamp: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(data);
    const size = new Blob([jsonString]).size;
    const sizeStr = (size / 1024).toFixed(2) + ' KB';

    const logs = StorageService.getBackups();
    logs.unshift({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type,
      size: sizeStr
    });
    localStorage.setItem(KEYS.BACKUPS, JSON.stringify(logs.slice(0, 10)));

    return jsonString;
  },

  clearBackupLogs: () => {
    localStorage.setItem(KEYS.BACKUPS, JSON.stringify([]));
  }
};

export default StorageService;