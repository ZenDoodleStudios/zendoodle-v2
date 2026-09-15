// Server-only: AIRTABLE_TOKEN is read from Netlify, never sent to the browser.
const BASE = 'app1XdNCXjmox6lTZ';
const TABLE = 'tblzqRT5VJCUZ1rQX'; // Products; the ID keeps working if renamed.
const VIEW = 'viwu754bZB9M3PKxH'; // Only records in the supplied gallery view.
const MAX_RECORDS = 2000;
const CACHE_MS = 120_000;
let cache = null;
let pending = null;

const text = value => typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
function imageUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname.endsWith('.airtableusercontent.com') || url.hostname === 'dl.airtable.com') ? url.href : null;
  } catch { return null; }
}
function publicProduct(record) {
  const f = record.fields || {};
  const name = text(f['Product Name']);
  if (!name) return null;
  let price = typeof f.Price === 'number' ? `J$${f.Price.toLocaleString('en-JM', {minimumFractionDigits:2})}` : text(f.Price);
  // Owner's confirmed price takes precedence over the old CSV promotion.
  // Remove this override once all three series prices in Airtable are J$6,000.
  if (name.startsWith('Activity Book Series')) price = 'J$6,000.00';
  return {
    id: text(record.id), name, price, category: text(f.Category) || 'Other',
    images: (Array.isArray(f.Image) ? f.Image : []).map(a => imageUrl(a.url)).filter(Boolean)
  };
}
async function fetchProducts(token) {
  const records = [];
  const seen = new Set();
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE}/${TABLE}`);
    url.searchParams.set('view', VIEW);
    url.searchParams.set('pageSize', '100');
    for (const field of ['Product Name', 'Price', 'Category', 'Image']) url.searchParams.append('fields[]', field);
    if (offset) url.searchParams.set('offset', offset);
    const response = await fetch(url, {headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error('catalogue_upstream_failed');
    const data = await response.json();
    if (!Array.isArray(data.records)) throw new Error('catalogue_invalid_response');
    records.push(...data.records);
    if (records.length > MAX_RECORDS) throw new Error('catalogue_too_large');
    offset = data.offset;
    if (offset) {
      if (typeof offset !== 'string' || seen.has(offset)) throw new Error('catalogue_invalid_offset');
      seen.add(offset);
      if (seen.size >= 20) throw new Error('catalogue_too_large');
      await new Promise(resolve => setTimeout(resolve, 220));
    }
  } while (offset);
  const products = records.map(publicProduct).filter(Boolean);
  return {products, fetchedAt:new Date().toISOString()};
}
function json(body, status=200) {
  return new Response(JSON.stringify(body), {status, headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':status===200?'public, max-age=0, s-maxage=120':'no-store',
    'X-Content-Type-Options':'nosniff',
    ...(status===405?{Allow:'GET'}:{})
  }});
}
export default async function handler(request) {
  if (request.method !== 'GET') return json({error:'Method not allowed'},405);
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return json({error:'The product gallery is temporarily unavailable.'},503);
  try {
    if (cache && Date.now()-cache.time<CACHE_MS) return json(cache.body);
    if (!pending) pending=fetchProducts(token).then(body=>{cache={body,time:Date.now()};return body;}).finally(()=>{pending=null;});
    return json(await pending);
  } catch {
    // Do not return upstream responses, headers or credentials to visitors.
    return json({error:'The product gallery is temporarily unavailable. Please try again.'},502);
  }
}
