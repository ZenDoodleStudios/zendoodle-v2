'use strict';
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const money=n=>'J$'+Number(n).toLocaleString('en-JM');
$('.menu-toggle')?.addEventListener('click',e=>{const open=e.currentTarget.getAttribute('aria-expanded')!=='true';e.currentTarget.setAttribute('aria-expanded',String(open));$('#navigation').classList.toggle('open',open)});
const chat=$('#whatsapp-form');
if(chat){const item=new URLSearchParams(location.search).get('product');if(item){chat.elements.topic.value='Product Gallery';chat.elements.message.value='I’d like to order or ask about: '+item;}const topic=new URLSearchParams(location.search).get('topic');if(topic&&[...chat.elements.topic.options].some(o=>o.value===topic))chat.elements.topic.value=topic;chat.addEventListener('submit',e=>{e.preventDefault();if(!chat.elements.name.value.trim()){chat.elements.name.setCustomValidity('Please enter your name.');chat.elements.name.reportValidity();return;}const d=new FormData(chat);location.href='https://wa.me/18768124295?text='+encodeURIComponent(`Hi ZenDoodle Studios! My name is ${d.get('name').trim()}.\n\nI’d like to chat about: ${d.get('topic')}.\n\n${d.get('message').trim()}`)});chat.elements.name.addEventListener('input',()=>chat.elements.name.setCustomValidity(''));}
const form=$('#order-form');
if(form){
 const products=[...window.ZEN_PRODUCTS,{id:'ready',name:'Ready-made items',detail:'Choose an available item below. No personalisation needed.',options:[]}], prices=window.ZEN_PRICING;let step=0,total=0;
 let readyProducts=window.ZEN_READY_SNAPSHOT.filter(window.ZEN_IS_READY),catalogueStatus='Saved catalogue. Prices and availability will be confirmed with your invoice.';
 const ready=()=>val('product')==='ready';
 const selectedReady=()=>readyProducts.find(p=>p.name===val('package'));
 const unitPrice=()=>window.ZEN_READY_PRICE(selectedReady()?.price||'');
 const notepadTypes={Adult:['Daily/Weekly Planner','To-Do-List','Notes/Lined'],Child:['Homework Planner','Study Planner','School/Activities To-Do List','Doodles & Notes']};
 const notepadDesigns={Adult:['Floral','Cute & Girly','Masculine','Minimal','Business','Custom Name'],Child:['Floral','Cute & Girly','Boys Will Be Boys','Gamer','Minimal','Custom']};
 const colourEligible=()=>!ready()&&(['child','activity','series','mini','adult','mini-adult'].includes(val('product'))||(val('product')==='notepad'&&val('notepad_audience')==='Child'));
 const route=()=>ready()?[0,2,3]:[0,1,2,3];
 const field=n=>form.elements.namedItem(n),val=n=>field(n)?.value||'';
 const product=()=>products.find(p=>p.id===val('product'));
 const setOptions=(el,arr)=>{el.replaceChildren(...arr.map(([label,value])=>new Option(label,value)));};
 function showGroup(selector,on){$$(selector).forEach(el=>{el.hidden=!on;$$('input,select,textarea',el).forEach(i=>i.disabled=!on);});}
 function configureNotepad(reset=false){
 const audience=val('notepad_audience')||'Adult';
 if(reset){setOptions(field('notepad_type'),notepadTypes[audience].map(v=>[v,v]));setOptions(field('notepad_design'),notepadDesigns[audience].map(v=>[v,v]));field('notepad_custom_notes').value='';}
 showGroup('[data-notepad-custom]',val('product')==='notepad'&&['Custom','Custom Name'].includes(val('notepad_design')));
 showGroup('[data-colour-extras]',colourEligible());
 }
 function readyOptions(preserve=false){
 const previous=val('package');
 setOptions(field('package'),[['Select an item',''],...readyProducts.map(p=>[`${p.name} — ${p.price||'Price to confirm'}`,p.name])]);
 if(preserve&&readyProducts.some(p=>p.name===previous))field('package').value=previous;
 $('#ready-status').textContent=catalogueStatus;
 }
 function configure(){const p=product(),mini=p.id.startsWith('mini');
 $('#product-detail').textContent=p.detail;$('#package-label').textContent=ready()?'Ready-made item':'Package';
 if(ready())readyOptions();else setOptions($('#package'),p.options.map(([label,price])=>[price?`${label} — ${money(price)}`:label,label]));
 setOptions($('#quantity'),(mini?[8,12,24,48]:p.id==='notepad'?[1,2,3]:[1,2,3,4,5]).map(n=>[String(n),String(n)]));
 showGroup('[data-step="1"]',!ready());
 showGroup('[data-mini]',mini);showGroup('[data-childmini]',p.id==='mini');showGroup('[data-activity]',p.id==='activity');showGroup('[data-notepad]',p.id==='notepad');showGroup('[data-series]',p.id==='series');showGroup('[data-custom-design]',!ready()&&p.id!=='series');showGroup('[data-theme-direction]',!ready()&&!['series','notepad'].includes(p.id));
 configureNotepad(!field('notepad_type').options.length);
 // The disabled controls never enter a ready-made order or its price estimate.
 if(ready())$$('input,select,textarea',$('[data-step="1"]')).forEach(el=>el.disabled=true);
 const previousTurnaround=val('turnaround');
 const turnaroundOptions=p.id==='series'?[['Standard — 2 days','series-2-days']]:ready()?[['Standard — 1 day','ready-1-day']]:[['Standard — 7 business days','standard'],['Rush — 3 days (+J$1,500 per order)','rush']];
 setOptions(field('turnaround'),turnaroundOptions);
 if(turnaroundOptions.some(o=>o[1]===previousTurnaround))field('turnaround').value=previousTurnaround;
 $('#ready-status').hidden=!ready();
 $$('.steps li')[1].hidden=ready();
 calculate();render(false);
 }
 function deliveryOptions(){
 const area=val('parish');let options=[['Select an area first','']];
 if(['Kingston (KSMA)','St. Andrew (KSMA)'].includes(area))options=[['Kingston & St. Andrew — Free (KSMA Only) · J$0','KSMA — Free']];
 else if(area==='St. Catherine — Portmore')options=[['Portmore delivery · J$600','Portmore — J$600']];
 else if(area==='St. Catherine — Spanish Town (Square)')options=[['Spanish Town (Square) · J$600','Spanish Town Square — J$600']];
 else if(area)options=[['ZipMail — Post-to-Post · J$500','ZipMail — Post-to-Post'],['Knutsford Express — up to 10 lbs · J$700','Knutsford Express — up to 10 lbs'],['Other — quote with invoice','Other']];
 setOptions(field('delivery'),options);
 }
 function deliveryCost(){return {'KSMA — Free':0,'Portmore — J$600':600,'Spanish Town Square — J$600':600,'ZipMail — Post-to-Post':500,'Knutsford Express — up to 10 lbs':700}[val('delivery')]||0;}
 function calculate(){
 const p=product(),qty=Number(val('quantity')),mini=p.id.startsWith('mini');let lines=[],pending=[];
 if(ready()){
   const item=selectedReady(),price=unitPrice();
   if(item&&price!==null)lines.push([`${qty} × ${item.name}`,price*qty]);
   else if(item)pending.push(`${item.name}: ${item.price||'price to confirm'} per item. We’ll confirm the option and price with your invoice.`);
 }else if(mini){
   const index=[8,12,24,48].indexOf(qty),kind=$('#package').selectedIndex;
   lines.push([`${qty}-book pack`,prices.mini[p.id][kind][index]]);
   if(val('size')==='large')lines.push(['Larger size',prices.large[index]]);
   if(field('pencils').checked)lines.push(['Crayons / pencils',prices.pencils[index]]);
 }else{
   let base=(p.options.find(o=>o[0]===val('package'))?.[1]||0)*qty;
   if(p.id==='notepad'&&qty===3)base*=.95;
   lines.push([`${qty} × ${p.name}`,base]);
   if(p.id==='activity'&&field('gift').checked)lines.push(['Gift packaging',prices.gift*qty]);
 }
 if(val('turnaround')==='rush')lines.push(['Rush service',prices.rush]);
 if(colourEligible())for(const [name,label,price] of [['extra_crayons','4-Pack Crayons',150],['extra_pencils','12-Pack Coloured Pencils',600],['extra_markers','8-Pack Dot Markers',650]]){
   const n=Number(val(name));if(Number.isInteger(n)&&n>0&&n<=100)lines.push([`${n} × ${label}`,n*price]);
 }
 if(val('delivery')==='Other')pending.push('Other delivery will be quoted with your official invoice and is not included here.');
 else if(val('delivery'))lines.push([val('delivery'),deliveryCost()]);
 $('#delivery-estimate').value=val('delivery')==='Other'?'To be confirmed':deliveryCost();
 total=lines.reduce((s,l)=>s+l[1],0);
 $('#summary-product').textContent=ready()?(selectedReady()?.name||p.name):p.name;
 $('#total').textContent=ready()&&!selectedReady()?'Choose an item':money(total);
 $('#total-label').textContent=ready()&&selectedReady()&&unitPrice()===null?'Priced subtotal':'Estimated total';
 $('#estimate-note').textContent=pending.join(' ');
 $('#estimate-field').value=ready()&&selectedReady()&&unitPrice()===null?`${total} (priced subtotal; product price to confirm)`:total;
 $('#price-lines').replaceChildren(...lines.map(([a,b])=>{const row=document.createElement('p'),label=document.createElement('span'),amount=document.createElement('strong');label.textContent=a;amount.textContent=money(b);row.append(label,amount);return row;}));
 }
 function validate(n){if(n===2){const digits=val('phone').replace(/[^0-9]/g,'');const valid=/^(?:1)?(?:876|658)\d{7}$/.test(digits)||(/^\+/.test(val('phone').trim())&&/^[1-9]\d{7,14}$/.test(digits));field('phone').setCustomValidity(field('whatsapp_opt_in').checked&&!valid?'Include your country code for WhatsApp, for example +1 876 812 4295.':'');}const fs=$(`[data-step="${n}"]`);for(const el of $$('input,select,textarea',fs)){if(el.disabled)continue;if(el.type==='text'&&el.required)el.setCustomValidity(el.value.trim()?'':'Please complete this field.');if(!el.checkValidity()){el.reportValidity();return false;}}return true;}
 const labels={product:'Product',package:'Package',quantity:'Quantity',size:'Size',mini_type:'Mini book type',pencils:'Crayons / pencils',gift:'Gift packaging',notepad_audience:'Notepad for',notepad_type:'Notepad type',notepad_design:'Notepad design / theme',notepad_custom_notes:'Custom design notes',extra_crayons:'4-Pack Crayons (packs)',extra_pencils:'12-Pack Coloured Pencils (packs)',extra_markers:'8-Pack Dot Markers (packs)',recipient:'Recipient / event',age:'Age',theme:'Theme',colours:'Colours',occasion:'Occasion',photo_1:'Reference photo 1',photo_2:'Reference photo 2',notes:'Special requests',name:'Your name',email:'Email',phone:'Phone / WhatsApp',parish:'Parish',delivery:'Delivery',needed_by:'Needed by',turnaround:'Turnaround',whatsapp_opt_in:'WhatsApp order updates',agreement:'Order terms accepted'};
 function cleanData(){
   const data=new FormData(form);
   for(const [key,value] of [...data.entries()]){
     if(value instanceof File){if(!value.name||!value.size)data.delete(key);}
     else if(!value.trim()||/^0(?:\.0+)?$/.test(value.trim()))data.delete(key);
     else data.set(key,value.trim());
   }
   return data;
 }
 function orderEntries(){
   const data=cleanData(),entries=[];
   for(const [key,label] of Object.entries(labels)){
     const values=data.getAll(key).map(v=>v instanceof File?v.name:v);if(!values.length)continue;
     let value=values.join(', ');
     if(key==='product')value=product().name;
     if(key==='turnaround')value=field('turnaround').selectedOptions[0]?.textContent||value;
     if(key==='whatsapp_opt_in'||key==='agreement')value='Yes';
     entries.push([label,value]);
   }
   if(total>0)entries.push([$('#total-label').textContent,money(total)]);
   if($('#estimate-note').textContent)entries.push(['To confirm',$('#estimate-note').textContent]);
   return entries;
 }
 function review(){
   const entries=orderEntries(),dl=document.createElement('dl');
   for(const [label,value]of entries){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;dl.append(dt,dd);}
   $('#review').replaceChildren(dl);
 }
 function submissionData(){
   $('#order-details').value=orderEntries().map(([label,value])=>`${label}: ${value}`).join('\n');
   return cleanData();
 }
 function render(focus=true){$$('[data-step]').forEach((el,i)=>el.hidden=i!==step);$$('.steps li').forEach((el,i)=>{el.classList.toggle('active',i<=step);if(i===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});$('#back').hidden=step===0;$('#next').hidden=step===3;$('#submit').hidden=step!==3;$('#form-error').textContent='';if(step===3)review();if(focus){const legend=$(`[data-step="${step}"] legend`);legend.tabIndex=-1;legend.focus();}}
 $('#next').addEventListener('click',()=>{if(validate(step)){step=route()[route().indexOf(step)+1];render();}});$('#back').addEventListener('click',()=>{step=route()[route().indexOf(step)-1];render();});
 form.addEventListener('input',e=>{if(e.target.type==='text')e.target.setCustomValidity('');calculate();});
 form.addEventListener('change',e=>{if(e.target.id==='product')configure();else {if(e.target.name==='parish')deliveryOptions();if(e.target.name==='notepad_audience')configureNotepad(true);if(e.target.name==='notepad_design')configureNotepad();calculate();}if(e.target.type==='file'){const file=e.target.files[0];e.target.setCustomValidity(file&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>3*1024*1024)?'Choose a JPG, PNG or WebP photo no larger than 3 MB.':'');e.target.reportValidity();}});
 form.noValidate=true;
 form.addEventListener('submit',async e=>{e.preventDefault();if(step!==3){if(validate(step)){step=route()[route().indexOf(step)+1];render();}return;}for(const n of route()){step=n;render(false);if(!validate(n))return;}step=3;render(false);if(form.dataset.preview==='true'){$('#form-error').textContent='Preview complete! Your order has not been sent. On the live website, this step sends your request to ZenDoodle Studios.';return;}if(location.protocol==='file:'||['localhost','127.0.0.1','terminal.local'].includes(location.hostname)||location.hostname.endsWith('.github.io')){$('#form-error').textContent='Email ordering is available on our Netlify-hosted website. Please use WhatsApp to contact us while viewing this copy.';return;}const btn=$('#submit');btn.disabled=true;btn.textContent='Sending your request…';try{const response=await fetch(form.action,{method:'POST',body:submissionData()});if(!response.ok)throw Error('submission');location.href='thank-you.html';}catch{ $('#form-error').textContent='Your request could not be sent. Your details are still here—please try again, or contact us on WhatsApp.';btn.disabled=false;btn.textContent='Send order request';}});
 const params=new URLSearchParams(location.search),requested=params.get('product'),requestedItem=params.get('item');
 if(products.some(p=>p.id===requested))field('product').value=requested;
 if(requestedItem)field('product').value='ready';
 const date=new Date();date.setMinutes(date.getMinutes()-date.getTimezoneOffset());field('needed_by').min=date.toISOString().slice(0,10);
 deliveryOptions();configure();
 const requestedAge=params.get('age');if(product().id==='series'&&product().options.some(o=>o[0]===requestedAge))field('package').value=requestedAge;
 if(ready()&&readyProducts.some(p=>p.name===requestedItem))field('package').value=requestedItem;
 const addon=params.get('addon');if(['crayons','pencils','markers'].includes(addon)&&colourEligible())field('extra_'+addon).value=1;
 calculate();render(false);
 async function refreshReadyProducts(){
   if(form.dataset.preview==='true'||location.protocol==='file:'||location.hostname.endsWith('.github.io'))return;
   catalogueStatus='Loading the latest products…';if(ready())$('#ready-status').textContent=catalogueStatus;
   try{
     const response=await fetch('/.netlify/functions/products',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000)});
     if(!response.ok)throw Error('catalogue');const data=await response.json();
     if(!Array.isArray(data.products)||!data.products.every(p=>typeof p.name==='string'&&typeof p.price==='string'&&typeof p.category==='string'))throw Error('catalogue');
     readyProducts=data.products.filter(window.ZEN_IS_READY);catalogueStatus=readyProducts.length?'Choose from our current product gallery.':'No ready-made items are listed right now. Please contact us.';
     if(ready()){readyOptions(true);if(requestedItem&&!val('package')&&readyProducts.some(p=>p.name===requestedItem))field('package').value=requestedItem;calculate();if(step===3)review();}
   }catch{catalogueStatus='We couldn’t refresh the products. Saved catalogue shown; prices and availability will be confirmed with your invoice.';}
   if(ready())$('#ready-status').textContent=catalogueStatus;
 }
 refreshReadyProducts();
 if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  try{Promise.resolve(document.modelContext.registerTool({name:'read_order_estimate',title:'Read order estimate',description:'Read the current product selection and estimated JMD total. Does not submit an order.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object');return {product:product().name,package:val('package'),quantity:Number(val('quantity')),estimatedTotalJMD:total,deliveryIncluded:!!val('delivery'),deliveryEstimateJMD:deliveryCost()};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 }
}
