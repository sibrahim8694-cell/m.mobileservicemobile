-- ==========================================
-- جداول قاعدة بيانات مليون موبايل (Supabase)
-- يرجى نسخ هذا الكود ولصقه في محرر SQL في لوحة تحكم Supabase
-- ==========================================

-- 1. جدول إدارة المستخدمين (Users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    "fullName" TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
    password TEXT,
    permissions JSONB DEFAULT '[]'::jsonb
);

-- 2. جدول طلبات الصيانة (Service Requests)
CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY,
    "requestNumber" TEXT NOT NULL,
    date TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceSerial" TEXT NOT NULL,
    "devicePassword" TEXT,
    "problemDescription" TEXT NOT NULL,
    condition TEXT NOT NULL,
    receiver TEXT NOT NULL,
    parts JSONB DEFAULT '[]'::jsonb,
    "totalPrice" NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    signature TEXT,
    notes TEXT
);

-- 3. جدول ملاحظات الريسبشن (Reception Notes)
CREATE TABLE IF NOT EXISTS reception_notes (
    id TEXT PRIMARY KEY,
    "noteNumber" TEXT NOT NULL,
    date TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    note TEXT NOT NULL,
    taker TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false
);

-- 4. جدول متابعة الفروع (Customer Follow Ups)
CREATE TABLE IF NOT EXISTS customer_follow_ups (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    branch TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerNumber" TEXT,
    "customerMobile" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- 5. جدول التبليغات (Customer Notifications)
CREATE TABLE IF NOT EXISTS customer_notifications (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "notificationContent" TEXT NOT NULL,
    status TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- ==========================================
-- إعدادات الأمان (RLS - Row Level Security)
-- ==========================================
-- للسماح للتطبيق بقراءة وكتابة البيانات بدون قيود معقدة (مناسب للمرحلة الحالية)
-- إذا أردت تفعيل الحماية، يمكنك إزالة هذه الأسطر لاحقاً

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reception_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;

-- سياسات السماح الكامل (تأكد من أن مفتاح Anon Key الخاص بك سري ولا يشارك للعامة)
DROP POLICY IF EXISTS "Allow All Operations on Users" ON users;
CREATE POLICY "Allow All Operations on Users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Operations on Service Requests" ON service_requests;
CREATE POLICY "Allow All Operations on Service Requests" ON service_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Operations on Reception Notes" ON reception_notes;
CREATE POLICY "Allow All Operations on Reception Notes" ON reception_notes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Operations on Customer Follow Ups" ON customer_follow_ups;
CREATE POLICY "Allow All Operations on Customer Follow Ups" ON customer_follow_ups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Operations on Customer Notifications" ON customer_notifications;
CREATE POLICY "Allow All Operations on Customer Notifications" ON customer_notifications FOR ALL USING (true) WITH CHECK (true);
