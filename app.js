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

/* --- Navigation --- */
function renderNav(){
  const user = getUser();
  nav.innerHTML = '';
  if(user){
    const span = el('span',{ text: user.email, style:'margin-left:8px;color:#374151' });
    const logout = el('button',{ className:'btn-ghost', text:'Log out' });
    logout.addEventListener('click', ()=>{ clearUser(); navigateTo('/'); });
    nav.appendChild(span);
    nav.appendChild(logout);
  } else {
    const login = el('a',{ href:'#/login', className:'button', text:'Log in' });
    nav.appendChild(login);
  }
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

/* --- Views --- */

function renderSignup(){
  root.innerHTML = '';
  const card = el('div',{ className:'card' });
  const h = el('h2',{ text:'Create an account' });
  const form = el('form',{});
  const email = el('input',{ className:'form-control', placeholder:'Email', type:'email' });
  const pass = el('input',{ className:'form-control', placeholder:'Password', type:'password' });
  const submit = el('button',{ className:'button', type:'submit', text:'Sign up' });
  form.appendChild(email); form.appendChild(pass); form.appendChild(submit);
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.value, password: pass.value })
      });
      if(!res.ok) throw new Error('Signup failed');
      const data = await res.json();
      setUser(data.user);
      navigateTo('/');
    } catch(e){
      console.error(e); alert('Signup failed');
    }
  });
  card.appendChild(h); card.appendChild(form);
  root.appendChild(card);
}

function renderAdd(){
  const user = getUser();
  if(!user){ navigateTo('/login'); return; }

  root.innerHTML = '';
  const card = el('div',{ className:'card' });
  const h = el('h2',{ text:'Add Product' });
  const form = el('form',{});
  const title = el('input',{ className:'form-control', placeholder:'Product title' });
  const merchant = el('input',{ className:'form-control', placeholder:'Merchant name' });
  const image = el('input',{ className:'form-control', placeholder:'Image URL' });
  const row = el('div',{ className:'form-row' });
  const originalPrice = el('input',{ className:'form-control', placeholder:'Original price', type:'number' });
  const currentPrice = el('input',{ className:'form-control', placeholder:'Current price', type:'number' });
  row.appendChild(originalPrice); row.appendChild(currentPrice);
  const url = el('input',{ className:'form-control', placeholder:'Product URL' });
  const affiliateUrl = el('input',{ className:'form-control', placeholder:'Affiliate URL (optional)' });
  const submit = el('button',{ className:'button', type:'submit', text:'Add product' });

  form.appendChild(title); form.appendChild(merchant); form.appendChild(image); form.appendChild(row); form.appendChild(url); form.appendChild(affiliateUrl); form.appendChild(submit);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const payload = {
      title: title.value,
      merchant: merchant.value,
      image: image.value,
      originalPrice: originalPrice.value,
      currentPrice: currentPrice.value,
      url: url.value,
      affiliateUrl: affiliateUrl.value
    };
    try{
      const res = await fetch(`${API_BASE}/products`, {
        method:'POST',
        headers: {
          'Content-Type':'application/json',
          'Authorization': `Bearer ${user.token || ''}`
        },
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error('Failed to add');
      alert('Product added — our system will mark it as a deal if currentPrice < originalPrice');
      navigateTo('/');
    }catch(e){
      console.error(e);
      alert('Failed to add product');
    }
  });

  card.appendChild(h); card.appendChild(form);
  root.appendChild(card);
}

/* Initialize */
window.addEventListener('hashchange', route);
window.addEventListener('load', () => {
  // set a default placeholder if logo missing
  const logo = document.getElementById('logo');
  if(logo && logo.src.endsWith('logo.png')) { /* user should add their own */ }
  route();
});
