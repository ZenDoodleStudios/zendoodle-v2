// Netlify invokes formSubmitted only after it verifies a submission.
// Disabled until the owner connects Meta WhatsApp Business and enables it.
// No credentials or customer details are logged or returned to the browser.
export function whatsappNumber(value) {
  const input = String(value || '').trim();
  let digits = input.replace(/[^0-9]/g, '');
  if (/^(876|658)\d{7}$/.test(digits)) digits = '1' + digits;
  else if (!input.startsWith('+') && !/^1\d{10}$/.test(digits)) return null;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}
export default {
  async formSubmitted(event) {
    const data = event.data || {};
    if (data.order_kind !== 'zendoodle_web_order' || data.whatsapp_opt_in !== 'yes') return;
    if (process.env.WHATSAPP_CONFIRMATIONS_ENABLED !== 'true') return;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const template = process.env.WHATSAPP_TEMPLATE_NAME;
    const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE;
    const version = process.env.WHATSAPP_API_VERSION;
    if (!token || !/^\d+$/.test(phoneId || '') || !/^[a-z0-9_]+$/.test(template || '') || !/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(language || '') || !/^v\d+\.0$/.test(version || '')) {
      console.error('WhatsApp order confirmation skipped: incomplete configuration.');
      return;
    }
    const to = whatsappNumber(data.phone);
    const firstName = String(data.name || '').trim().split(/\s+/)[0].slice(0,80);
    if (!to || !firstName) {
      console.error('WhatsApp order confirmation skipped: invalid recipient details.');
      return;
    }
    // The approved template contains the full owner-provided message.
    // Only its first-name placeholder is supplied dynamically.
    try {
      const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
        method:'POST',
        headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify({messaging_product:'whatsapp',to,type:'template',template:{name:template,language:{code:language},components:[{type:'body',parameters:[{type:'text',text:firstName}]}]}}),
        signal:AbortSignal.timeout(10000)
      });
      if(!response.ok) { console.error(`WhatsApp order confirmation failed (${response.status}); order remains saved in Netlify Forms.`); return; }
      console.info('WhatsApp order confirmation accepted by provider.');
    } catch {
      // Do not retry blindly after a timeout: Meta may already have accepted it.
      console.error('WhatsApp confirmation could not be verified; check Meta delivery logs. Order remains saved in Netlify Forms.');
    }
  }
};
