import { getUsers, saveUsers, setCurrentUser, getCurrentUser, createId } from './storage.js';

export function initAuth(){
  const loginBtn = document.getElementById('btn-open-login');
  const registerBtn = document.getElementById('btn-open-register');
  const logoutBtn = document.getElementById('btn-logout');
  const modal = document.getElementById('modal-auth');
  const tabs = modal.querySelectorAll('.tab');
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');

  // Restore session from cookie if needed
  try{
    const cookieId = readCookie('jt_session');
    if(cookieId && !getCurrentUser()){
      const users = getUsers();
      const user = users.find(u=>u.id===cookieId);
      if(user) setCurrentUser(user);
    }
  }catch{}

  updateAuthUI();

  loginBtn?.addEventListener('click',()=>{ openAuth('login'); });
  registerBtn?.addEventListener('click',()=>{ openAuth('register'); });
  logoutBtn?.addEventListener('click',()=>{ setCurrentUser(null); updateAuthUI(); });

  tabs.forEach(t=>t.addEventListener('click',()=>{
    tabs.forEach(s=>s.classList.remove('active'));
    t.classList.add('active');
    const target = t.dataset.tab;
    modal.querySelectorAll('[data-panel]').forEach(p=>{
      p.classList.toggle('hidden', p.getAttribute('data-panel')!==target);
    });
  }));

  loginForm?.addEventListener('submit',(e)=>{
    e.preventDefault();
    const fd = new FormData(loginForm);
    const identifier = String(fd.get('identifier')||'').trim();
    const password = String(fd.get('password')||'');
    const users = getUsers();
    const user = users.find(u=>u.username===identifier || u.email===identifier);
    if(!user || user.password!==hash(password)) return toast('Invalid credentials');
    setCurrentUser(user); updateAuthUI(); modal.close();
  });

  registerForm?.addEventListener('submit',(e)=>{
    e.preventDefault();
    const fd = new FormData(registerForm);
    const password = String(fd.get('password')||'');
    const confirm = String(fd.get('confirmPassword')||'');
    if(password.length<6) return toast('Password too short');
    if(password!==confirm) return toast('Passwords do not match');
    const users = getUsers();
    const username = String(fd.get('username')||'').trim();
    const email = String(fd.get('email')||'').trim();
    if(users.some(u=>u.username===username)) return toast('Username already exists');
    if(users.some(u=>u.email===email)) return toast('Email already registered');
    const user = {
      id: createId('user'),
      fullName: String(fd.get('fullName')||''),
      username,
      email,
      phone: String(fd.get('phone')||''),
      birthday: String(fd.get('birthday')||''),
      password: hash(password),
      photo: '', skills:[], studies:[], university:'', school:'', highSchool:'', about:'', preferences:{ dark:true, compact:false }
    };
    users.push(user); saveUsers(users); setCurrentUser(user); updateAuthUI(); modal.close();
  });
}

function openAuth(tab){
  const modal = document.getElementById('modal-auth');
  modal.showModal();
  modal.querySelectorAll('.tab').forEach(t=>{
    const active = t.dataset.tab===tab; t.classList.toggle('active',active);
  });
  modal.querySelectorAll('[data-panel]').forEach(p=>{
    p.classList.toggle('hidden', p.getAttribute('data-panel')!==tab);
  });
}

export function updateAuthUI(){
  const authed = !!getCurrentUser();
  document.getElementById('auth-unauth')?.classList.toggle('hidden', authed);
  document.getElementById('auth-authenticated')?.classList.toggle('hidden', !authed);
}

function hash(s){
  // Simple demo hash (not secure) for local-only storage
  let h=0; for(let i=0;i<s.length;i++){ h=(h<<5)-h+s.charCodeAt(i); h|=0; }
  return String(h);
}

function toast(msg){
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t);
  setTimeout(()=>t.remove(), 2000);
}

function readCookie(name){
  const m = document.cookie.match(new RegExp('(?:^|; )'+name.replace(/[.$?*|{}()\[\]\\\/\+^]/g,'\\$&')+'=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

