'use strict';
let products = [], category = 'All', query = '', savedOnly = false;
const readStorage = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const savedData = readStorage('tao-saved', []);
let saved = new Set((Array.isArray(savedData) ? savedData : []).filter(Number.isInteger));
let cart = readStorage('tao-cart', []);
if (!Array.isArray(cart)) cart = [];
cart = cart.filter(x => Number.isInteger(x.id) && Number.isInteger(x.quantity) && x.quantity > 0);
const $ = selector => document.querySelector(selector);
const money = amount => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(amount);
const escapeHTML = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stars = rating => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
let toastTimer;
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(() => $('#toast').classList.remove('visible'),2500); }
function persist() { try { localStorage.setItem('tao-saved',JSON.stringify([...saved])); localStorage.setItem('tao-cart',JSON.stringify(cart)); } catch {} updateCounts(); }
function updateCounts() { $('#saved-count').textContent=saved.size; $('#cart-count').textContent=cart.reduce((total,x)=>total+x.quantity,0); $('#saved-button').setAttribute('aria-pressed',String(savedOnly)); }
function render() {
 let list=products.filter(p=>(category==='All'||p.category===category)&&(!savedOnly||saved.has(p.id))&&(`${p.title} ${p.category} ${p.description}`).toLowerCase().includes(query.toLowerCase()));
 const sort=$('#sort').value;
 if(sort==='low')list.sort((a,b)=>a.price-b.price); if(sort==='high')list.sort((a,b)=>b.price-a.price); if(sort==='rating')list.sort((a,b)=>b.rating-a.rating);
 $('#products').innerHTML=list.map((p,i)=>`<article class="product"><div class="product-image"><button class="image-open" data-detail="${p.id}" aria-label="View ${escapeHTML(p.title)}"><img src="${p.image}" alt="${escapeHTML(p.title)} illustration" ${i>5?'loading="lazy"':''}></button>${i<3?`<span class="badge">${['THE EVERYDAY EDIT','STYLE PICK','A LITTLE LUXURY'][i]}</span>`:''}<button class="save ${saved.has(p.id)?'saved':''}" data-save="${p.id}" aria-pressed="${saved.has(p.id)}" aria-label="${saved.has(p.id)?'Unsave':'Save'} ${escapeHTML(p.title)}">${saved.has(p.id)?'♥':'♡'}</button></div><div class="product-info"><span class="product-category">${escapeHTML(p.category)}</span><button class="product-name" data-detail="${p.id}">${escapeHTML(p.title)}</button><div class="rating"><span class="stars" aria-label="${p.rating} out of 5 stars">${stars(p.rating)}</span><span>${p.rating.toFixed(1)}</span><button class="review-link" data-reviews="${p.id}" aria-label="Read ${p.reviews.length} reviews for ${escapeHTML(p.title)}">(${p.reviews.length})</button></div><div class="price-row"><span class="price">${money(p.price)}</span><button class="add" data-add="${p.id}" aria-label="Add ${escapeHTML(p.title)} to bag">+</button></div><span class="product-foot">Explore product & reviews ↗</span></div></article>`).join('');
 $('#empty').hidden=!!list.length;
 $('#results-summary').textContent=query||savedOnly||category!=='All'?`${list.length} ${savedOnly?'saved ':''}find${list.length===1?'':'s'}${query?` for “${query}”`:''}${category!=='All'?` in ${category}`:''}`:'';
 document.querySelectorAll('.tabs [data-category]').forEach(b=>{b.classList.toggle('active',b.dataset.category===category&&!savedOnly);b.setAttribute('aria-pressed',String(b.dataset.category===category&&!savedOnly));});
}
function chooseCategory(value) { category=value; savedOnly=false; render(); $('#catalog').scrollIntoView({behavior:'smooth',block:'start'}); updateCounts(); }
function toggleSave(id) { saved.has(id)?saved.delete(id):saved.add(id); persist();render();const btn=$('#product-dialog [data-save]');if(btn&&Number(btn.dataset.save)===id){btn.textContent=saved.has(id)?'♥ Saved':'♡ Save';btn.setAttribute('aria-pressed',String(saved.has(id)));} }
function addToCart(id) { const item=cart.find(x=>x.id===id); if(item)item.quantity++;else cart.push({id,quantity:1});persist();toast('Added to your shopping bag'); }
function detail(id,showReviews=false) {
 const p=products.find(x=>x.id===id);if(!p)return;
 $('#product-detail').innerHTML=`<div class="detail-top"><div class="detail-image"><img src="${p.image}" alt="${escapeHTML(p.title)} illustration"></div><div class="detail-copy"><span class="eyebrow">${escapeHTML(p.category)}</span><h2>${escapeHTML(p.title)}</h2><div class="rating"><span class="stars">${stars(p.rating)}</span><span>${p.rating.toFixed(1)} / 5 · ${p.reviews.length} reviews</span></div><p>${escapeHTML(p.description)}</p><span class="price">${money(p.price)}</span><button class="orange" data-add="${p.id}">Add to bag +</button><button data-save="${p.id}" aria-pressed="${saved.has(p.id)}">${saved.has(p.id)?'♥ Saved':'♡ Save'}</button></div></div><h3 class="review-heading" id="reviews-title">Ratings & reviews <small>(${p.reviews.length})</small></h3>${p.reviews.map(r=>`<article class="review"><strong>${escapeHTML(r.reviewerName)}</strong><span class="stars" aria-label="${r.rating} out of 5 stars">${stars(r.rating)}</span><p>${escapeHTML(r.comment)}</p><small>${new Date(r.date).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</small></article>`).join('')}`;
 $('#product-dialog').showModal();if(showReviews)$('#reviews-title').scrollIntoView({block:'start'});
}
function renderCart() {
 const items=cart.map(x=>({...x,product:products.find(p=>p.id===x.id)})).filter(x=>x.product);
 $('#cart-content').innerHTML=items.length?`${items.map(x=>`<article class="cart-item"><img src="${x.product.image}" alt="${escapeHTML(x.product.title)}"><div><h3>${escapeHTML(x.product.title)}</h3><p>${money(x.product.price)}</p><div class="quantity"><button data-quantity="${x.id}" data-change="-1" aria-label="Decrease ${escapeHTML(x.product.title)} quantity">−</button><span>${x.quantity}</span><button data-quantity="${x.id}" data-change="1" aria-label="Increase ${escapeHTML(x.product.title)} quantity">+</button></div></div><button class="remove" data-remove="${x.id}">Remove</button></article>`).join('')}<div class="cart-total"><span>Subtotal</span><span>${money(items.reduce((t,x)=>t+x.quantity*x.product.price,0))}</span></div><p class="bag-note">Your bag is saved on this device. Browse, compare, and collect your favorites here. Online ordering is not available.</p>`:`<div class="empty"><h3>Room for something wonderful</h3><p>Add a find you love to get started.</p><button class="orange" id="continue-shopping">Explore the collection</button></div>`;
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.category)chooseCategory(b.dataset.category);
 if(b.dataset.save)toggleSave(Number(b.dataset.save));
 if(b.dataset.add)addToCart(Number(b.dataset.add));
 if(b.dataset.detail)detail(Number(b.dataset.detail));
 if(b.dataset.reviews)detail(Number(b.dataset.reviews),true);
 if(b.classList.contains('close'))b.closest('dialog').close();
 if(b.dataset.quantity){const item=cart.find(x=>x.id===Number(b.dataset.quantity));if(item)item.quantity+=Number(b.dataset.change);cart=cart.filter(x=>x.quantity>0);persist();renderCart();}
 if(b.dataset.remove){cart=cart.filter(x=>x.id!==Number(b.dataset.remove));persist();renderCart();}
 if(b.id==='continue-shopping'){$('#cart-dialog').close();$('#catalog').scrollIntoView({behavior:'smooth'});}
});
$('#search').addEventListener('submit',e=>{e.preventDefault();query=$('#search-input').value.trim();category='All';savedOnly=false;render();updateCounts();$('#catalog').scrollIntoView({behavior:'smooth'});});
$('#search-input').addEventListener('input',e=>{if(!e.target.value){query='';render();}});
$('#sort').addEventListener('change',render);
$('#saved-button').addEventListener('click',()=>{savedOnly=!savedOnly;category='All';query='';$('#search-input').value='';updateCounts();render();$('#catalog').scrollIntoView({behavior:'smooth'});});
$('#cart-button').addEventListener('click',()=>{renderCart();$('#cart-dialog').showModal();});
$('#explore').addEventListener('click',()=>chooseCategory('All'));
$('#back-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
$('#reset').addEventListener('click',()=>{category='All';savedOnly=false;query='';$('#search-input').value='';render();updateCounts();});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('#year').textContent=new Date().getFullYear();
fetch('products.json').then(r=>{if(!r.ok)throw Error('Catalog unavailable');return r.json();}).then(data=>{products=data;saved=new Set([...saved].filter(id=>products.some(p=>p.id===id)));cart=cart.filter(x=>products.some(p=>p.id===x.id));persist();render();}).catch(()=>{$('#results-summary').textContent='The collection could not load. Please refresh to try again.';});
