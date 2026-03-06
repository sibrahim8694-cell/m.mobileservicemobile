export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'operator';
  password?: string;
  permissions?: string[]; // List of allowed route paths or keys
}

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  deviceName: string;
  deviceSerial: string;
  devicePassword?: string;
  problemDescription: string;
  condition: string;
  receiver: string;
  parts: { name: string; price: number }[];
  totalPrice: number;
  status: 'جديد' | 'قيد الإصلاح' | 'جاهز للاستلام' | 'تم التسليم' | 'عدم إصلاح';
  signature?: string;
  notes?: string;
}

export interface ReceptionNote {
  id: string;
  noteNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  note: string;
  taker: string;
  isCompleted: boolean;
}

export interface CompatibilityItem {
  id: string;
  type: 'screen' | 'battery' | 'cover';
  devices: string[];
  originalText: string;
}

export interface BackupLog {
  id: string;
  date: string;
  type: 'local' | 'cloud';
  size: string;
}