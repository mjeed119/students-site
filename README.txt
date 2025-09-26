تشغيل النسخة المبسطة (بدون فصول) — بحث برقم الهوية مع خصوصية (هاش)

1) تشغيل الموقع محليًا:
   cd student-performance-site-hash
   python3 -m http.server 5500
   # افتح في المتصفح: http://localhost:5500

2) تجهيز بيانات الطلاب من الإكسل:
   cd excel_to_site_hash
   pip install pandas openpyxl
   chmod +x run_export_hash.sh
   ./run_export_hash.sh
   # سيولّد/يحدّث ../student-performance-site-hash/students.json

3) في الموقع اكتب رقم الهوية ثم "بحث".
   - المكوّنات الظاهرة: الواجبات، البحوث، الأنشطة الصفية، النشاط العملي، الاختبار العملي، الاختبار النظري
   - الغياب يظهر كعدد الأيام
   - الملاحظات تظهر في قسمها

ملاحظات:
- الملف students.json لا يحتوي على رقم الهوية الصريح، بل nid_hash فقط.
- لو حاب تضيف درجات إضافية، زوّد أعمدة جديدة في الإكسل وبلغني لأحدّث المصدّر.
