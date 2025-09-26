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
};

let DATA = [];
let ready = false;

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
}

async function search(){
  if(!ready){ return; }
  const q = (els.input.value || '').trim();
  if(!q){ els.input.focus(); return; }
  els.searching.hidden = false;
  els.notFound.hidden = true;
  clearCard();
  const hash = await sha256Hex(q);
  const std = DATA.find(s => s.nid_hash === hash);
  setTimeout(() => {
    els.searching.hidden = true;
    if(std){ renderStudent(std); }
    else { els.notFound.hidden = true; }
  }, 200);
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  els.btn.addEventListener('click', search);
  els.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') search(); });
});