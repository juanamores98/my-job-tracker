import { upsertJob } from './board.js';

export function initModals(){
  document.querySelectorAll('dialog .icon-button[data-close]').forEach(btn=>{
    btn.addEventListener('click',()=> btn.closest('dialog')?.close());
  });

  const addTopBtn = document.getElementById('btn-add-job');
  addTopBtn?.addEventListener('click',()=>openJobModal({ status:'wishlist' }));

  const importBtn = document.getElementById('btn-open-import');
  importBtn?.addEventListener('click',()=>document.getElementById('modal-import').showModal());
}

export function openJobModal(data){
  const modal = document.getElementById('modal-job');
  const form = document.getElementById('job-form');
  form.reset();
  // Pre-fill
  setIf(form,'jobId', data.id||'');
  setIf(form,'jobName', data.jobName||'');
  setIf(form,'company', data.company||'');
  setIf(form,'applyDate', data.applyDate||'');
  setIf(form,'salary', data.salary||'');
  setIf(form,'location', data.location||'');
  setIf(form,'workMode', data.workMode||'remote');
  setIf(form,'status', data.status||'wishlist');
  setIf(form,'skills', (data.skills||[]).join(', '));
  setIf(form,'studies', (data.studies||[]).join(', '));
  setIf(form,'contactEmail', data.contactEmail||'');
  setIf(form,'contactPhone', data.contactPhone||'');
  setIf(form,'jobUrls', (data.jobUrls||[]).join(', '));
  setIf(form,'description', data.description||'');

  modal.showModal();

  form.onsubmit = (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const job = {
      id: String(fd.get('jobId')||''),
      jobName: String(fd.get('jobName')||'').trim(),
      company: String(fd.get('company')||'').trim(),
      applyDate: String(fd.get('applyDate')||''),
      salary: Number(fd.get('salary')||'')||'',
      location: String(fd.get('location')||'').trim(),
      workMode: String(fd.get('workMode')||'remote'),
      status: String(fd.get('status')||'wishlist'),
      skills: splitTags(fd.get('skills')),
      studies: splitTags(fd.get('studies')),
      contactEmail: String(fd.get('contactEmail')||'').trim(),
      contactPhone: String(fd.get('contactPhone')||'').trim(),
      jobUrls: splitTags(fd.get('jobUrls'), ','),
      description: String(fd.get('description')||'')
    };
    if(!job.jobName || !job.company) return toast('Please fill job name and company');
    upsertJob(job);
    modal.close();
  };
}

function setIf(form, name, value){ const el=form.querySelector(`[name="${name}"]`); if(el) el.value = value; }
function splitTags(val, sep=','){ return String(val||'').split(sep).map(s=>s.trim()).filter(Boolean); }

function toast(msg){
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t);
  setTimeout(()=>t.remove(), 2000);
}

