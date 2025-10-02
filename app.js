const els = {
  loading: document.getElementById('loading'),
  searching: document.getElementById('searching'),
  dbEmpty: document.getElementById('dbEmpty'),
  notFound: document.getElementById('notFound'),
  card: document.getElementById('card'),
  name: document.getElementById('studentName'),
  total: document.getElementById('studentTotal'),
  gradesTbody: document.querySelector('#gradesTable tbody'),
  attendanceList: document.getElementById('attendanceList'),
  notes: document.getElementById('notes'),
  input: document.getElementById('nid'),
  btn: document.getElementById('searchBtn'),
  // عناصر قسم الاعتراضات
  complaintsSection: document.getElementById('complaintsSection'),
  complaintsTableBody: document.querySelector('#complaintsTable tbody'),
  complaintsLoading: document.getElementById('complaintsLoading'),
  complaintsNone: document.getElementById('complaintsNone'),
};

let DATA = [];
let ready = false;

/* ================== إعدادات Google Sheets ================== */
const SHEET_ID   = "1olXtJQZKKml0WhOmqFPhXgTVJVIXAnjzx1d6SZnxCo8";  
const SHEET_NAME = "Form Responses 1"; // غيّره لو اسم الورقة مختلف

async function fetchSheetJSON({ sheet = SHEET_NAME, query = "select *" } = {}) {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;
  const url  = `${base}?tqx=out:json&sheet=${encodeURIComponent(sheet)}&tq=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("فشل جلب بيانات Google Sheets");
  const text = await res.text();
  return JSON.parse(text.replace(/^[^\(]+\(/, "").replace(/\);?$/, ""));
}

function gvizToObjects(gviz) {
  if (!gviz?.table?.rows) return [];
  const cols = (gviz.table.cols || []).map(c => (c && c.label) ? c.label : "COL");
  return gviz.table.rows.map(r => {
    const obj = {};
    (r.c || []).forEach((cell, i) => {
      obj[cols[i] || `COL${i}`] = (cell && (cell.v ?? cell.f)) ?? "";
    });
    return obj;
  });
}

/* =============== تحميل قاعدة بيانات الطلاب =============== */
async function loadData(){
  els.loading.hidden = false;
  try{
    const res = await fetch('students.json', {cache:'no-store'});
    DATA = await res.json();
    ready = true;
    if(Array.isArray(DATA) && DATA.length === 0){
      els.dbEmpty.hidden = false;
    }
  }catch(e){
    console.error('خطأ في تحميل البيانات', e);
    alert('تعذر تحميل بيانات الطلاب. تأكد من وجود students.json');
  }finally{
    els.loading.hidden = true;
  }
}

/* ================== أدوات البحث والعرض ================== */
async function sha256Hex(text){
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
}

function renderStudent(std){
  els.card.hidden = false;
  els.notFound.hidden = true;
  els.name.textContent = std.name;

  const order = ["الواجبات","البحوث","الأنشطة الصفية","النشاط العملي","الاختبار العملي","الاختبار النظري"];
  els.gradesTbody.innerHTML = '';
  let total = 0;

  for(const key of order){
    if(std.grades && key in std.grades){
      const val = std.grades[key];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${key}</td><td>${val}</td>`;
      els.gradesTbody.appendChild(tr);
      if(typeof val === 'number'){ total += val; }
    }
  }

  els.total.textContent = `المجموع: ${total}`;

  els.attendanceList.innerHTML = '';
  const att = std.attendance || {absent:0};
  els.attendanceList.insertAdjacentHTML('beforeend', `<li>إجمالي الغياب: ${att.absent} يوم</li>`);
  els.notes.textContent = std.notes || '—';
}

function clearCard(){
  els.card.hidden = true;
  els.gradesTbody.innerHTML = '';
  els.attendanceList.innerHTML = '';
  els.notes.textContent = '—';

  if (els.complaintsSection) {
    els.complaintsSection.hidden = true;
    els.complaintsLoading.hidden = true;
    els.complaintsNone.hidden = true;
    if (els.complaintsTableBody) els.complaintsTableBody.innerHTML = '';
  }
}

/* =============== جلب اعتراضات الطالب من الشيت =============== */
async function loadStudentComplaintsByNID(nid) {
  if (!els.complaintsSection) return;

  els.complaintsSection.hidden = false;
  els.complaintsLoading.hidden = false;
  els.complaintsNone.hidden = true;
  if (els.complaintsTableBody) els.complaintsTableBody.innerHTML = '';

  try {
    // رقم الهوية في العمود الثالث (C)
    const tq = `select * where C = '${nid}' order by A desc`;
    const g = await fetchSheetJSON({ sheet: SHEET_NAME, query: tq });
    const rows = gvizToObjects(g);

    if (!rows.length) {
      els.complaintsNone.hidden = false;
      return;
    }

    // أعمدتك: التاريخ | الاسم | رقم الهوية | وصف المشكلة
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const cells = [
        r["التاريخ"]     || r["Timestamp"] || "",
        r["الاسم"]       || "",
        r["رقم الهوية"]  || "",
        r["وصف المشكلة"] || ""
      ];
      cells.forEach(val => {
        const td = document.createElement('td');
        td.style.borderBottom = '1px solid #eee';
        td.style.padding = '8px';
        td.textContent = String(val ?? '');
        tr.appendChild(td);
      });
      els.complaintsTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    els.complaintsNone.hidden = false;
    els.complaintsNone.textContent = "تعذّر جلب الاعتراضات. تأكد من مشاركة الشيت كـ (أي شخص معه الرابط – عارض).";
  } finally {
    els.complaintsLoading.hidden = true;
  }
}

/* ================== البحث ================== */
async function search(){
  if(!ready){ return; }
  const q = (els.input.value || '').trim();
  if(!q){ els.input.focus(); return; }

  els.searching.hidden = false;
  els.notFound.hidden = true;
  clearCard();

  const hash = await sha256Hex(q);
  const std = DATA.find(s => s.nid_hash === hash);

  setTimeout(async () => {
    els.searching.hidden = true;
    if(std){
      renderStudent(std);
      try {
        await loadStudentComplaintsByNID(q); // جلب اعتراضاته
      } catch (e) {
        console.error(e);
      }
    } else {
      els.notFound.hidden = true;
    }
  }, 200);
}

/* ================== تهيئة الصفحة ================== */
window.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  els.btn.addEventListener('click', search);
  els.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') search(); });
});