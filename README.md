# NQF & Jordanian Accreditation Dashboard

لوحة تفاعلية ثابتة قابلة للنشر على GitHub Pages.

## طريقة الرفع على GitHub
1. أنشئ Repository جديد باسم مثل: `nqf-accreditation-dashboard`.
2. ارفع الملفات: `index.html`, `style.css`, `app.js`, `README.md`.
3. من GitHub: Settings → Pages.
4. اختر Branch: `main` ثم `/root` ثم Save.
5. سيظهر رابط الموقع خلال دقائق.

## التحديث
- البيانات موجودة داخل `app.js` في المتغير `programs`.
- لاحقاً يمكن تحويلها إلى ملف `data.json` أو ربطها بـ Google Sheets / GitHub Actions.

## التطوير المقترح
- إضافة Login وصلاحيات.
- إضافة شاشة إدخال وتعديل حالة NQF والاعتماد.
- إضافة قاعدة بيانات Supabase أو Firebase.
- إضافة GitHub Actions لتحديث البيانات تلقائياً من Excel.
