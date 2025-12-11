// app.js - Vanilla JS frontend for DealPulse
// Edit API_BASE if your backend runs elsewhere
const API_BASE = (window.DEALPULSE_API_BASE || 'http://localhost:4242');

const root = document.getElementById('view');
const nav = document.getElementById('nav');

function getUser(){
  try { return JSON.parse(localStorage.getItem('dp_user')) } catch { return null }
}
function setUser(u){ localStorage.setItem('dp_user', JSON.stringify(u)) }
function clearUser(){ localStorage.removeItem('dp_user') }

function percentOff(original, current){
  original = Number(original); current = Number(current);
  if(!original || !current) return 0;
  return Math.round(((original - current)/original)*100);
}

/* --- Helpers to create DOM elements quickly --- */
function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if(opts.className) node.className = opts.className;
  if(opts.href) node.href = opts.href;
  if(opts.src) node.src = opts.src;
  if(opts.text) node.textContent = opts.text;
  if(opts.placeholder) node.placeholder = opts.placeholder;
  if(opts.type) node.type = opts.type;
  if(opts.style) node.style = opts.style;
  if(opts.id) node.id = opts.id;
  (children || []).forEach(c => {
    if(typeof c === 'string') node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  });
  return node;
}

/* --- Routing --- */
function navigateTo(path){
  window.location.hash = `#${path}`;
  route();
}
function route(){
  const hash = location.hash.replace('#','') || '/';
  renderNav();
  if(hash.startsWith('/login')) renderLogin();
  else if(hash.startsWith('/signup')) renderSignup();
  else if(hash.startsWith('/add')) renderAdd();
  else renderDiscover();
}

/* Initialize */
window.addEventListener('hashchange', route);
window.addEventListener('load', () => {
  // set a default placeholder if logo missing
  const logo = document.getElementById('logo');
  if(logo && logo.src.endsWith('logo.png')) { /* user should add their own */ }
  route();
});
