import { initStorage } from './storage.js';
import { initAuth } from './auth.js';
import { initBoard } from './board.js';
import { initModals } from './modals.js';
import { initProfile } from './profile.js';
import { initImportExport } from './import_export.js';

function ready(fn){document.readyState!=='loading'?fn():document.addEventListener('DOMContentLoaded',fn)}

ready(()=>{
  initStorage();
  initModals();
  initAuth();
  initBoard();
  initProfile();
  initImportExport();
});

