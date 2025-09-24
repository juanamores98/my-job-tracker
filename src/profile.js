import { getCurrentUser, getUsers, saveUsers, setSettings, getSettings } from './storage.js';

export function initProfile(){
  const openBtn = document.getElementById('btn-open-profile');
  openBtn?.addEventListener('click',()=>openProfile());

  const toggleTheme = document.getElementById('toggle-theme');
  if(toggleTheme){
    const settings = getSettings();
    toggleTheme.checked = settings.theme==='dark';
    toggleTheme.addEventListener('change',()=>{
      const s = getSettings(); s.theme = toggleTheme.checked?'dark':'light'; setSettings(s);
    });
  }

  // Avatar upload and crop (simple zoom centered)
  const modal = document.getElementById('modal-profile');
  const canvas = document.getElementById('avatar-crop');
  const uploadBtn = document.getElementById('avatar-upload');
  const fileInput = document.getElementById('avatar-input');
  const zoomInput = document.getElementById('avatar-zoom');
  const ctx = canvas?.getContext('2d');
  let image = null; let zoom=1;
  function draw(){ if(!ctx||!canvas||!image) return; ctx.clearRect(0,0,canvas.width,canvas.height); const iw=image.width*zoom; const ih=image.height*zoom; const x=(canvas.width-iw)/2; const y=(canvas.height-ih)/2; ctx.drawImage(image, x, y, iw, ih); }
  uploadBtn?.addEventListener('click',()=>fileInput?.click());
  zoomInput?.addEventListener('input',()=>{ zoom = Number(zoomInput.value||'1'); draw(); });
  fileInput?.addEventListener('change',()=>{
    const f = fileInput.files?.[0]; if(!f) return;
    const img = new Image(); img.onload=()=>{ image=img; draw(); }; img.src = URL.createObjectURL(f);
  });

  // Drag & drop support
  const drop = document.getElementById('avatar-drop');
  drop?.addEventListener('dragover',(e)=>{ e.preventDefault(); drop.classList.add('drag-over'); });
  drop?.addEventListener('dragleave',()=> drop.classList.remove('drag-over'));
  drop?.addEventListener('drop',(e)=>{
    e.preventDefault(); drop.classList.remove('drag-over');
    const f = e.dataTransfer?.files?.[0]; if(!f) return;
    const img = new Image(); img.onload=()=>{ image=img; draw(); }; img.src = URL.createObjectURL(f);
  });

  const form = document.getElementById('profile-form');
  form?.addEventListener('submit',(e)=>{
    e.preventDefault();
    const user = getCurrentUser(); if(!user) return;
    const fd = new FormData(form);
    user.fullName = String(fd.get('fullName')||'');
    user.username = String(fd.get('username')||'');
    user.email = String(fd.get('email')||'');
    user.phone = String(fd.get('phone')||'');
    user.birthday = String(fd.get('birthday')||'');
    user.university = String(fd.get('university')||'');
    user.school = String(fd.get('school')||'');
    user.highSchool = String(fd.get('highSchool')||'');
    user.skills = splitTags(fd.get('skills'));
    user.studies = splitTags(fd.get('studies'));
    user.about = String(fd.get('about')||'');
    const prefs = { dark: !!fd.get('prefDark'), compact: !!fd.get('prefCompact') };
    setSettings({ ...getSettings(), theme: prefs.dark?'dark':'light', compact: prefs.compact });
    // Save avatar as data URL
    if(canvas){ try{ user.photo = canvas.toDataURL('image/png'); }catch{} }
    const users = getUsers();
    const idx = users.findIndex(u=>u.id===user.id); if(idx>=0) users[idx] = user; saveUsers(users);
    form.closest('dialog')?.close();
  });
}

function openProfile(){
  const user = getCurrentUser();
  if(!user){ return; }
  const modal = document.getElementById('modal-profile');
  const form = document.getElementById('profile-form');
  set(form,'fullName',user.fullName||'');
  set(form,'username',user.username||'');
  set(form,'email',user.email||'');
  set(form,'phone',user.phone||'');
  set(form,'birthday',user.birthday||'');
  set(form,'university',user.university||'');
  set(form,'school',user.school||'');
  set(form,'highSchool',user.highSchool||'');
  set(form,'skills',(user.skills||[]).join(', '));
  set(form,'studies',(user.studies||[]).join(', '));
  set(form,'about',user.about||'');
  const prefDark = form.querySelector('[name="prefDark"]'); if(prefDark) prefDark.checked = (getSettings().theme==='dark');
  const prefCompact = form.querySelector('[name="prefCompact"]'); if(prefCompact) prefCompact.checked = !!getSettings().compact;
  modal.showModal();
}

function set(form, name, value){ const el=form?.querySelector(`[name="${name}"]`); if(el) el.value=value; }
function splitTags(val){ return String(val||'').split(',').map(s=>s.trim()).filter(Boolean); }

