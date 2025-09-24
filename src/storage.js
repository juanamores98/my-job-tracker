// High-verbosity, readable storage and schema utilities

const STORAGE_KEYS = {
  users: 'jt_users',
  currentUserId: 'jt_current_user_id',
  jobs: 'jt_jobs',
  settings: 'jt_settings'
};

export function initStorage(){
  ensureDefaults();
  applyThemeFromSettings();
}

function ensureDefaults(){
  if(!localStorage.getItem(STORAGE_KEYS.users)) localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([]));
  if(!localStorage.getItem(STORAGE_KEYS.jobs)) localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify([]));
  if(!localStorage.getItem(STORAGE_KEYS.settings)) localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ theme:'dark', compact:false }));
}

export function getSettings(){
  return safeParse(localStorage.getItem(STORAGE_KEYS.settings), { theme:'dark', compact:false });
}

export function setSettings(settings){
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  // Persist preferences also in cookies for portability
  document.cookie = `jt_theme=${encodeURIComponent(settings.theme||'dark')}; max-age=${365*24*3600}; path=/`;
  document.cookie = `jt_compact=${settings.compact?'1':'0'}; max-age=${365*24*3600}; path=/`;
  applyThemeFromSettings();
}

function applyThemeFromSettings(){
  const { theme } = getSettings();
  const settings = getSettings();
  document.documentElement.dataset.theme = settings.theme||'dark';
  document.documentElement.setAttribute('data-compact', settings.compact ? '1' : '0');
}

export function getUsers(){
  return safeParse(localStorage.getItem(STORAGE_KEYS.users), []);
}

export function saveUsers(users){
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

export function getCurrentUser(){
  const id = localStorage.getItem(STORAGE_KEYS.currentUserId);
  if(!id) return null;
  return getUsers().find(u=>u.id===id) || null;
}

export function setCurrentUser(user){
  if(user){
    localStorage.setItem(STORAGE_KEYS.currentUserId, user.id);
    // Set a cookie for session (expires in 7 days)
    document.cookie = `jt_session=${encodeURIComponent(user.id)}; max-age=${7*24*3600}; path=/`;
  }else{
    localStorage.removeItem(STORAGE_KEYS.currentUserId);
    document.cookie = 'jt_session=; Max-Age=0; path=/';
  }
}

export function getJobs(){
  return safeParse(localStorage.getItem(STORAGE_KEYS.jobs), []);
}

export function saveJobs(jobs){
  localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(jobs));
}

export function createId(prefix){
  return `${prefix}_${Math.random().toString(36).slice(2,10)}_${Date.now().toString(36)}`;
}

export const JobStatus = ['wishlist','applied','interview','rejected'];

export function assertJob(job){
  const required = ['jobName','company','status'];
  for(const k of required){ if(!job[k]) throw new Error(`Missing field: ${k}`); }
  if(!JobStatus.includes(job.status)) throw new Error('Invalid status');
}

function safeParse(str, fallback){
  try{ return str ? JSON.parse(str) : fallback; }catch{ return fallback; }
}

export function exportData(kind, format='json'){
  if(kind==='user'){
    const user = getCurrentUser();
    return downloadBlob(JSON.stringify(user||{} , null, 2), `user.${format}`, 'application/json');
  }
  if(kind==='settings'){
    const settings = getSettings();
    return downloadBlob(JSON.stringify(settings, null, 2), `settings.${format}`, 'application/json');
  }
  if(kind==='jobs'){
    const jobs = getJobs();
    if(format==='csv'){
      const csv = toJobsCSV(jobs);
      return downloadBlob(csv, 'jobs.csv', 'text/csv');
    }
    return downloadBlob(JSON.stringify(jobs, null, 2), 'jobs.json', 'application/json');
  }
}

function toJobsCSV(jobs){
  const headers = ['id','jobName','company','applyDate','salary','location','workMode','skills','studies','status','contactPhone','contactEmail','jobUrls','description'];
  const lines = [headers.join(',')];
  for(const j of jobs){
    const row = headers.map(h=>escapeCsv(cellValue(j,h)));
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

function cellValue(j,h){
  if(h==='skills'||h==='studies'){ return (j[h]||[]).join('|'); }
  if(h==='jobUrls'){ return (j[h]||[]).join('|'); }
  return j[h] ?? '';
}

function escapeCsv(v){
  const s = String(v).replaceAll('"','""');
  if(s.includes(',')||s.includes('\n')||s.includes('"')) return '"'+s+'"';
  return s;
}

function downloadBlob(content, filename, mime){
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

export function importData(kind, file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onerror = ()=>reject(new Error('Failed to read file'));
    reader.onload = ()=>{
      try{
        if(file.name.endsWith('.csv')){
          if(kind!=='jobs') throw new Error('CSV import supported only for jobs');
          const jobs = fromJobsCSV(String(reader.result));
          saveJobs(jobs);
          resolve();
        }else{
          const data = JSON.parse(String(reader.result));
          if(kind==='user'){
            const users = getUsers();
            if(data && data.id){
              const idx = users.findIndex(u=>u.id===data.id);
              if(idx>=0) users[idx]=data; else users.push(data);
              saveUsers(users); setCurrentUser(data);
            }
          }else if(kind==='settings'){
            setSettings(data||{});
          }else if(kind==='jobs'){
            saveJobs(Array.isArray(data)?data:[]);
          }
          resolve();
        }
      }catch(e){ reject(e); }
    };
    reader.readAsText(file);
  });
}

function fromJobsCSV(csv){
  const [headerLine, ...rows] = csv.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(',').map(h=>h.trim());
  return rows.map(line=>{
    const values = parseCsvLine(line);
    const obj = {};
    headers.forEach((h,i)=>{ obj[h] = values[i] ?? ''; });
    if(obj.skills) obj.skills = String(obj.skills).split('|').filter(Boolean);
    if(obj.studies) obj.studies = String(obj.studies).split('|').filter(Boolean);
    if(obj.jobUrls) obj.jobUrls = String(obj.jobUrls).split('|').filter(Boolean);
    return obj;
  });
}

function parseCsvLine(line){
  const out=[]; let cur=''; let inQ=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(inQ){
      if(ch==='"' && line[i+1]==='"'){ cur+='"'; i++; }
      else if(ch==='"'){ inQ=false; }
      else cur+=ch;
    }else{
      if(ch==='"'){ inQ=true; }
      else if(ch===','){ out.push(cur); cur=''; }
      else cur+=ch;
    }
  }
  out.push(cur);
  return out;
}

