import { exportData, importData } from './storage.js';

export function initImportExport(){
  const modal = document.getElementById('modal-import');
  document.querySelectorAll('[data-export]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const kind = btn.getAttribute('data-export');
      if(kind==='user-json') exportData('user','json');
      if(kind==='settings-json') exportData('settings','json');
      if(kind==='jobs-json') exportData('jobs','json');
      if(kind==='jobs-csv') exportData('jobs','csv');
    });
  });

  const runBtn = document.getElementById('btn-run-import');
  const fileInput = document.getElementById('import-file');
  runBtn?.addEventListener('click', async ()=>{
    const file = fileInput?.files?.[0]; if(!file) return toast('Choose a file');
    const target = modal.querySelector('input[name="importTarget"]:checked')?.value || 'user';
    try{ await importData(target, file); toast('Imported'); }catch(e){ toast('Import failed'); }
  });
}

function toast(msg){
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t);
  setTimeout(()=>t.remove(), 2000);
}

