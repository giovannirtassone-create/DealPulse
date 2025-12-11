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
  const aAdd = el('a',{ href:'#/add', className:'btn-ghost', text:'Add Product' });
  nav.appendChild(aAdd);
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

async function renderDiscover(){
  root.innerHTML = '';
  const header = el('div', { className:'card' }, [
    el('h2',{ text:'Discover deals' }),
    el('p',{ text:'Products on discount or recently added.' })
  ]);
  root.appendChild(header);

  const grid = el('div',{ className:'grid cols-3', id:'productsGrid' });
  root.appendChild(grid);

  const loading = el('div',{ className:'empty', text:'Loading products...' });
  grid.appendChild(loading);

  try {
    const res = await fetch(`${API_BASE}/products`);
    const products = await res.json();
    grid.innerHTML = '';
    if(!products || products.length === 0){
      grid.appendChild(el('div',{ className:'empty', text:'No deals yet — invite merchants or add products!' }));
      return;
    }
    products.forEach(p => {
      const card = el('div',{ className:'card' });
      const img = el('img',{ src: p.image || 'assets/placeholder.png', className:'product-img' });
      const title = el('div',{ className:'p-title', text: p.title || 'Untitled' });
      const sub = el('div',{ className:'p-sub', text: p.merchant || '' });
      const priceRow = el('div',{ className:'price-row' });
      const price = el('div',{ className:'price', text:`$${(Number(p.currentPrice)||0).toFixed(2)}` });
      const off = percentOff(p.originalPrice, p.currentPrice);
      priceRow.appendChild(price);
      if(off > 0) priceRow.appendChild(el('div',{ className:'off', text: `${off}% off` }));

      const actions = el('div',{ className:'actions' });
      const buy = el('button',{ className:'button', text:'Buy' });
      buy.addEventListener('click', ()=> handleBuy(p));
      const view = el('a',{ href: p.affiliateUrl || p.url || '#', className:'btn-outline', text:'View', target:'_blank' });
      actions.appendChild(buy); actions.appendChild(view);

      card.appendChild(img); card.appendChild(title); card.appendChild(sub); card.appendChild(priceRow); card.appendChild(actions);
      grid.appendChild(card);
    });
  } catch(err){
    grid.innerHTML = '';
    grid.appendChild(el('div',{ className:'empty', text:'Failed to load products.' }));
    console.error(err);
  }
}

async function handleBuy(product){
  try{
    const res = await fetch(`${API_BASE}/create-checkout-session`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ productId: product.id })
    });
    const data = await res.json();
    if(data && data.url) window.location.href = data.url;
    else alert('Checkout URL not returned by server');
  }catch(e){
    console.error(e);
    alert('Failed to initiate checkout');
  }
}

function renderLogin(){
  root.innerHTML = '';
  const card = el('div',{ className:'card' });
  const h = el('h2',{ text:'Log in to DealPulse' });
  const form = el('form',{});
  const email = el('input',{ className:'form-control', placeholder:'Email', type:'email' });
  const pass = el('input',{ className:'form-control', placeholder:'Password', type:'password' });
  const row = el('div',{ className:'form-row' }, [
    el('button',{ className:'button', type:'submit', text:'Log in' }),
    el('a',{ href:'#/signup', className:'btn-ghost', text:'Sign up' })
  ]);
  form.appendChild(email); form.appendChild(pass); form.appendChild(row);
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.value, password: pass.value })
      });
      if(!res.ok) throw new Error('Login failed');
      const data = await res.json();
      setUser(data.user);
      navigateTo('/');
    } catch(e){
      console.error(e); alert('Login failed');
    }
  });
  card.appendChild(h); card.appendChild(form);
  root.appendChild(card);
}

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
