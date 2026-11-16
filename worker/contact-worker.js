/**
 * Glen contact form handler — Cloudflare Worker + Resend.
 *
 * Receives the JSON the site's form posts, validates it, and emails it to the Glen inbox.
 * Settings (see worker/README.md):
 *   RESEND_API_KEY   secret   from resend.com
 *   TO_EMAIL         variable inbox that receives enquiries, e.g. info@glenprivatelabel.com
 *   FROM_EMAIL       variable verified Resend sender, e.g. "Glen Website <noreply@glenprivatelabel.com>"
 *   ALLOWED_ORIGINS  variable comma-separated site origins, e.g. "https://glenprivatelabel.com,https://www.glenprivatelabel.com"
 */

const MAX_BODY_BYTES = 10_000;
const MIN_FILL_MS = 2500;                      // humans take longer than this to fill the form
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const oneLine = (v, max) => clean(v, max).replace(/[\r\n]+/g, ' ');   // header-safe: blocks header injection

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const originOk = allowed.includes(origin);

    const cors = originOk ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    } : { 'Vary': 'Origin' };
    const reply = (status, body) => new Response(body === null ? null : JSON.stringify(body), {
      status, headers: { 'Content-Type': 'application/json', ...cors }
    });

    if (request.method === 'OPTIONS') return originOk ? reply(204, null) : reply(403, { ok: false });
    if (request.method !== 'POST')    return reply(405, { ok: false, error: 'method_not_allowed' });
    if (!originOk)                    return reply(403, { ok: false, error: 'origin_not_allowed' });

    const len = Number(request.headers.get('Content-Length') || 0);
    if (len > MAX_BODY_BYTES) return reply(413, { ok: false, error: 'too_large' });

    let raw;
    try { raw = await request.text(); } catch { return reply(400, { ok: false, error: 'bad_request' }); }
    if (raw.length > MAX_BODY_BYTES) return reply(413, { ok: false, error: 'too_large' });

    let d;
    try { d = JSON.parse(raw); } catch { return reply(400, { ok: false, error: 'bad_json' }); }
    if (!d || typeof d !== 'object') return reply(400, { ok: false, error: 'bad_json' });

    // Bot checks: say "ok" so bots learn nothing, but send nothing.
    if (clean(d.website, 200) !== '' || Number(d.elapsed_ms) < MIN_FILL_MS) return reply(200, { ok: true });

    const first = oneLine(d.first_name, 80);
    const last  = oneLine(d.last_name, 80);
    const email = oneLine(d.email, 160);
    const phone = oneLine(d.phone, 40);
    const cat   = oneLine(d.category, 60);
    const msg   = clean(d.message, 4000);

    if (!first)                return reply(422, { ok: false, error: 'first_name_required' });
    if (!EMAIL_RE.test(email)) return reply(422, { ok: false, error: 'email_invalid' });

    const name = [first, last].filter(Boolean).join(' ');
    const text = [
      `New website enquiry from ${name}`,
      '',
      `Name:     ${name}`,
      `Email:    ${email}`,
      `Phone:    ${phone || '-'}`,
      `Category: ${cat || '-'}`,
      '',
      'Message:',
      msg || '-',
      '',
      `Sent from: ${oneLine(d.page, 300) || origin}`
    ].join('\n');

    let res;
    try {
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.FROM_EMAIL,
          to: [env.TO_EMAIL],
          reply_to: email,                                   // "Reply" in the inbox goes straight to the prospect
          subject: `Website enquiry: ${name}${cat ? ' (' + cat + ')' : ''}`,
          text                                               // plain text only: nothing the visitor typed is rendered as HTML
        })
      });
    } catch {
      return reply(502, { ok: false, error: 'mail_unreachable' });
    }
    if (!res.ok) return reply(502, { ok: false, error: 'mail_failed' });
    return reply(200, { ok: true });
  }
};
