import { getJobs, saveJobs, createId, JobStatus } from './storage.js';
import { openJobModal } from './modals.js';

export function initBoard(){
  const board = document.getElementById('board');
  board.addEventListener('click',(e)=>{
    const t = e.target;
    if(!(t instanceof HTMLElement)) return;
    if(t.matches('[data-action="add-job"]')){
      const status = t.getAttribute('data-status')||'wishlist';
      openJobModal({ status });
    }
  });

  board.querySelectorAll('[data-dropzone]').forEach(zone=>{
    zone.addEventListener('dragover', (e)=>{ e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', ()=> zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e)=>{
      e.preventDefault(); zone.classList.remove('drag-over');
      const id = e.dataTransfer?.getData('text/plain');
      const status = zone.closest('.column')?.getAttribute('data-status');
      if(!id||!status) return;
      const jobs = getJobs();
      const job = jobs.find(j=>j.id===id);
      if(!job) return;
      job.status = status;
      saveJobs(jobs);
      renderBoard();
    });
  });

  renderBoard();
}

export function renderBoard(){
  const jobs = getJobs();
  for(const status of JobStatus){
    const col = document.querySelector(`.column[data-status="${status}"] .column-body`);
    if(!col) continue;
    col.innerHTML = '';
    for(const job of jobs.filter(j=>j.status===status)){
      col.appendChild(renderCard(job));
    }
  }
}

function renderCard(job){
  const el = document.createElement('article');
  el.className = 'card';
  el.draggable = true;
  el.addEventListener('dragstart',(e)=>{ e.dataTransfer?.setData('text/plain', job.id); });
  el.innerHTML = `
    <div class="title">${escapeHtml(job.jobName)} <span class="meta">@ ${escapeHtml(job.company)}</span></div>
    <div class="meta">
      ${job.applyDate?`<span>📅 ${escapeHtml(job.applyDate)}</span>`:''}
      ${job.salary?`<span>💰 ${escapeHtml(String(job.salary))}</span>`:''}
      ${job.location?`<span>📍 ${escapeHtml(job.location)}</span>`:''}
      ${job.workMode?`<span>🏷️ ${escapeHtml(job.workMode)}</span>`:''}
    </div>
    <div class="chips">
      ${(job.skills||[]).slice(0,5).map(s=>`<span class="chip">${escapeHtml(s)}</span>`).join('')}
    </div>
    <div class="card-actions" style="display:flex; gap:8px; margin-top:8px">
      <button class="btn tiny" data-edit>Edit</button>
      <button class="btn tiny danger" data-delete>Delete</button>
    </div>
  `;
  el.querySelector('[data-edit]')?.addEventListener('click',()=>openJobModal(job));
  el.querySelector('[data-delete]')?.addEventListener('click',()=>{
    const jobs = getJobs().filter(j=>j.id!==job.id);
    saveJobs(jobs); renderBoard();
  });
  return el;
}

export function upsertJob(data){
  const jobs = getJobs();
  const isNew = !data.id;
  const job = isNew ? { id:createId('job') } : jobs.find(j=>j.id===data.id);
  if(!job) return;
  Object.assign(job, data);
  if(isNew) jobs.push(job);
  saveJobs(jobs);
  renderBoard();
}

function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

