'use strict';
(() => {
  const gallery=document.getElementById('ready-made');
  if(!gallery)return;
  const create=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  const status=create('p','muted');status.setAttribute('role','status');
  const retry=create('button','button secondary','Try Again');retry.type='button';retry.hidden=true;
  gallery.insertBefore(status,gallery.children[3]||null);status.after(retry);
  const content=create('div','live-gallery');
  // Preserve the supplied CSV catalogue as an explicitly labelled fallback.
  while(retry.nextSibling)content.append(retry.nextSibling);
  gallery.append(content);
  const isPreview=location.hostname.endsWith('.chatgpt.site')||location.protocol==='file:'||location.hostname.endsWith('.github.io');
  function action(product){
    if(product.category==='Add-ons'){
      const types={'4-Pack Crayons':'crayons','12-Pack Coloured Pencils':'pencils','Washable Dot Markers - 8 Pack':'markers'};
      if(types[product.name])return ['Add to an Order','order.html?addon='+types[product.name]];
    }
    if(product.name.startsWith('Activity Book Series')){
      const age=/Book\s*1\b/.test(product.name)?'Ages 2–3':/Book\s*2\b/.test(product.name)?'Ages 4–5':/Book\s*3\b/.test(product.name)?'Ages 6–8':null;
      if(age)return ['Personalise the Cover','order.html?product=series&age='+encodeURIComponent(age)];
    }
    return ['Ask About This Product','contact.html?product='+encodeURIComponent(product.name)];
  }
  function picture(url,name){
    const img=create('img');img.src=url;img.alt=name;img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>img.remove(),{once:true});return img;
  }
  function render(products){
    const fragment=document.createDocumentFragment();
    const groups=new Map();
    for(const product of products){const category=product.category||'Other';if(!groups.has(category))groups.set(category,[]);groups.get(category).push(product);}
    for(const [category,items]of groups){
      fragment.append(create('h2',null,category));const grid=create('div','gallery-grid');
      for(const product of items){
        const card=create('article','gallery-card');
        const images=Array.isArray(product.images)?product.images.filter(u=>typeof u==='string'&&u.startsWith('https://')):[];
        if(images.length)card.append(picture(images[0],product.name));
        card.append(create('h3',null,product.name));const price=create('p');price.append(create('strong',null,product.price||'Ask Us for a Price'));card.append(price);
        if(product.price.includes('|'))card.append(create('p','muted','Ask us about the available options.'));
        if(product.name.startsWith('Activity Book Series'))card.append(create('p',null,'Child’s name and photo on the front cover. Interior pages are not customisable.'));
        if(images.length>1){const details=create('details');details.append(create('summary',null,'More Photos'));for(const url of images.slice(1))details.append(picture(url,'Another view of '+product.name));card.append(details);}
        const [label,url]=action(product);const link=create('a',null,label+' ↗');link.href=url;card.append(link);grid.append(card);
      }
      fragment.append(grid);
    }
    if(!products.length)fragment.append(create('p',null,'New products are on their way. Contact us to discuss a custom order.'));
    content.replaceChildren(fragment);
  }
  async function load(){
    if(isPreview){status.textContent='Preview catalogue. Live product details and photos load on the Netlify website.';return;}
    status.textContent='Loading our latest products…';retry.hidden=true;
    try{
      const response=await fetch('/.netlify/functions/products',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000)});
      if(!response.ok)throw new Error('unavailable');
      const data=await response.json();
      if(!Array.isArray(data.products)||!data.products.every(p=>typeof p.name==='string'&&typeof p.price==='string'))throw new Error('invalid');
      render(data.products);status.textContent='';
    }catch{status.textContent='We couldn’t refresh the gallery. The saved catalogue is shown below; please confirm current prices and availability with us.';retry.hidden=false;}
  }
  retry.addEventListener('click',load);load();
})();
