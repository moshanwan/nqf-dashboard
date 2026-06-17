const STORAGE_KEY = "nqf-accreditation-programs-v2";
const NQF_STATUSES = ["لم يبدأ","قيد الإعداد","مستلم","مدقق","عاد للتعديل","مرسل للهيئة","مسكن"];
const ACC_STATUSES = ["لم يبدأ","قيد الإعداد","مستلم","مدقق","عاد للتعديل","مرسل للهيئة","معتمد","موقوف"];
const REVIEW_RESULTS = ["لا يوجد","مقبول","عاد للتعديل","نواقص بسيطة","نواقص جوهرية"];
const PRIORITIES = ["منخفضة","متوسطة","عالية"];
const PROGRAM_STATUSES = ["مستمر","موقوف","موقوف دائم","غير محدد"];

let programs = loadData();

function loadData(){
  const stored = localStorage.getItem(STORAGE_KEY);
  if(stored){
    try { return JSON.parse(stored); } catch(e){}
  }
  return (window.INITIAL_PROGRAMS || []).map(p => ({...p}));
}
function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
  alert("تم حفظ التعديلات على هذا المتصفح.");
}
function statusBadge(value){
  const v = value || "لم يبدأ";
  let cls = "b-empty";
  if(["مسكن","معتمد"].includes(v)) cls = "b-done";
  else if(["قيد الإعداد","مستلم","مدقق"].includes(v)) cls = "b-progress";
  else if(v === "عاد للتعديل") cls = "b-returned";
  else if(v === "مرسل للهيئة") cls = "b-sent";
  return `<span class="badge ${cls}">${escapeHtml(v)}</span>`;
}
function priorityBadge(value){
  const cls = value === "عالية" ? "b-high" : value === "منخفضة" ? "b-low" : "b-medium";
  return `<span class="badge ${cls}">${escapeHtml(value || "متوسطة")}</span>`;
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function uniqueValues(key){ return [...new Set(programs.map(p=>p[key]).filter(Boolean))].sort(); }
function fillSelect(id, values, includeBlank=false){
  const el = document.getElementById(id);
  el.innerHTML = includeBlank ? el.querySelector("option")?.outerHTML || '<option value="">الكل</option>' : "";
  values.forEach(v=>{ const o=document.createElement("option"); o.value=v; o.textContent=v; el.appendChild(o); });
}
function initialize(){
  fillSelect("collegeFilter", uniqueValues("college"), true);
  fillSelect("degreeFilter", uniqueValues("degree"), true);
  fillSelect("nqfFilter", NQF_STATUSES, true);
  fillSelect("accFilter", ACC_STATUSES, true);
  ["nqfStatus"].forEach(id=>fillSelect(id,NQF_STATUSES));
  ["accreditationStatus"].forEach(id=>fillSelect(id,ACC_STATUSES));
  ["nqfReviewResult","accreditationReviewResult"].forEach(id=>fillSelect(id,REVIEW_RESULTS));
  fillSelect("priority", PRIORITIES);
  fillSelect("programStatus", PROGRAM_STATUSES);
  document.querySelectorAll("#searchInput,#collegeFilter,#degreeFilter,#nqfFilter,#accFilter,#reportFilter").forEach(el=>el.addEventListener("input", render));
  document.getElementById("saveBtn").onclick = saveData;
  document.getElementById("addBtn").onclick = () => openDialog();
  document.getElementById("cancelEdit").onclick = () => document.getElementById("editDialog").close();
  document.getElementById("editForm").addEventListener("submit", commitDialog);
  document.getElementById("exportJsonBtn").onclick = exportJson;
  document.getElementById("exportCsvBtn").onclick = exportCsv;
  document.getElementById("importJson").addEventListener("change", importJson);
  document.getElementById("resetBtn").onclick = resetData;
  render();
}
function filteredPrograms(){
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const college = document.getElementById("collegeFilter").value;
  const degree = document.getElementById("degreeFilter").value;
  const nqf = document.getElementById("nqfFilter").value;
  const acc = document.getElementById("accFilter").value;
  const report = document.getElementById("reportFilter").value;
  return programs.filter(p=>{
    const text = [p.nameAr,p.nameEn,p.college,p.department,p.degree,p.programNo].join(" ").toLowerCase();
    if(q && !text.includes(q)) return false;
    if(college && p.college !== college) return false;
    if(degree && p.degree !== degree) return false;
    if(nqf && p.nqfStatus !== nqf) return false;
    if(acc && p.accreditationStatus !== acc) return false;
    if(report === "not-accredited" && p.accreditationStatus === "معتمد") return false;
    if(report === "acc-returned" && !(p.accreditationStatus === "عاد للتعديل" || p.accreditationReviewResult === "عاد للتعديل")) return false;
    if(report === "nqf-not-done" && p.nqfStatus === "مسكن") return false;
    if(report === "nqf-returned" && !(p.nqfStatus === "عاد للتعديل" || p.nqfReviewResult === "عاد للتعديل")) return false;
    if(report === "urgent" && p.priority !== "عالية") return false;
    return true;
  });
}
function render(){
  const rows = filteredPrograms();
  document.getElementById("resultCount").textContent = `${rows.length} نتيجة`;
  document.getElementById("totalPrograms").textContent = programs.length;
  document.getElementById("notAccredited").textContent = programs.filter(p=>p.accreditationStatus !== "معتمد").length;
  document.getElementById("accReturned").textContent = programs.filter(p=>p.accreditationStatus==="عاد للتعديل" || p.accreditationReviewResult==="عاد للتعديل").length;
  document.getElementById("nqfNotDone").textContent = programs.filter(p=>p.nqfStatus !== "مسكن").length;
  document.getElementById("nqfReturned").textContent = programs.filter(p=>p.nqfStatus==="عاد للتعديل" || p.nqfReviewResult==="عاد للتعديل").length;
  const tbody = document.querySelector("#programTable tbody");
  tbody.innerHTML = rows.map((p,i)=>`
    <tr>
      <td>${escapeHtml(p.id || i+1)}</td>
      <td><strong>${escapeHtml(p.nameAr)}</strong><br><small>${escapeHtml(p.nameEn || "")}</small></td>
      <td>${escapeHtml(p.degree)}</td>
      <td>${escapeHtml(p.college)}</td>
      <td>${escapeHtml(p.department)}</td>
      <td>${statusBadge(p.nqfStatus)}</td>
      <td>${statusBadge(p.nqfReviewResult)}</td>
      <td>${statusBadge(p.accreditationStatus)}</td>
      <td>${statusBadge(p.accreditationReviewResult)}</td>
      <td>${priorityBadge(p.priority)}</td>
      <td>${escapeHtml(p.updatedAt || "-")}</td>
      <td><button onclick="openDialog('${p.id}')">تحديث</button></td>
    </tr>`).join("");
}
function openDialog(id){
  const p = id ? programs.find(x=>x.id==id) : {
    id: String(Date.now()), nameAr:"", degree:"", college:"", department:"",
    programStatus:"مستمر", priority:"متوسطة", nqfStatus:"لم يبدأ", nqfReviewResult:"لا يوجد",
    accreditationStatus:"لم يبدأ", accreditationReviewResult:"لا يوجد"
  };
  document.getElementById("dialogTitle").textContent = id ? "تحديث برنامج" : "إضافة برنامج";
  const ids = ["editId","nameAr","degree","college","department","programStatus","priority","nqfStatus","nqfReviewResult","nqfReceivedDate","nqfReviewedDate","nqfSentDate","accreditationStatus","accreditationReviewResult","accreditationReceivedDate","accreditationReviewedDate","accreditationSentDate","owner","notes"];
  const map = {editId:"id"};
  ids.forEach(elid=>{ document.getElementById(elid).value = p[map[elid]||elid] || ""; });
  document.getElementById("editDialog").showModal();
}
function commitDialog(e){
  e.preventDefault();
  const id = document.getElementById("editId").value || String(Date.now());
  let p = programs.find(x=>x.id==id);
  if(!p){ p = {id}; programs.push(p); }
  ["nameAr","degree","college","department","programStatus","priority","nqfStatus","nqfReviewResult","nqfReceivedDate","nqfReviewedDate","nqfSentDate","accreditationStatus","accreditationReviewResult","accreditationReceivedDate","accreditationReviewedDate","accreditationSentDate","owner","notes"].forEach(k=>p[k]=document.getElementById(k).value);
  p.updatedAt = new Date().toISOString().slice(0,10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
  document.getElementById("editDialog").close();
  initialize();
}
function exportJson(){
  download("nqf-accreditation-data.json", JSON.stringify(programs,null,2), "application/json");
}
function exportCsv(){
  const headers = ["id","nameAr","degree","college","department","programStatus","nqfStatus","nqfReviewResult","nqfReceivedDate","nqfReviewedDate","nqfSentDate","accreditationStatus","accreditationReviewResult","accreditationReceivedDate","accreditationReviewedDate","accreditationSentDate","owner","priority","notes","updatedAt"];
  const csv = "\uFEFF" + [headers.join(","), ...programs.map(p=>headers.map(h=>`"${String(p[h]??"").replace(/"/g,'""')}"`).join(","))].join("\n");
  download("nqf-accreditation-report.csv", csv, "text/csv;charset=utf-8");
}
function download(name, content, type){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], {type}));
  a.download = name;
  a.click();
}
function importJson(e){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(!Array.isArray(data)) throw new Error("Invalid");
      programs = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
      initialize();
      alert("تم استيراد البيانات بنجاح.");
    }catch(err){ alert("ملف JSON غير صحيح."); }
  };
  reader.readAsText(file);
}
function resetData(){
  if(confirm("سيتم حذف التعديلات المحلية والعودة للبيانات الأصلية. هل أنت متأكد؟")){
    localStorage.removeItem(STORAGE_KEY);
    programs = (window.INITIAL_PROGRAMS || []).map(p=>({...p}));
    initialize();
  }
}
initialize();