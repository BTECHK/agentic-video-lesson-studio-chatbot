// Minimal browser test page for sharing the bot with non-local testers over HTTPS.
// Text-only rendering (textContent, never innerHTML) — model output is untrusted,
// so this can never become an XSS sink. Brand-light; this is a test surface, not the
// student product (students use Telegram / Teachable).
export const WEB_CHAT_HTML = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tutor — Sample Academy</title>
<style>
  :root { --bg:#EDE8E3; --ink:#1C1C1C; --accent:#8B2635; --radius:4px; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--ink); }
  .wrap { max-width:680px; margin:0 auto; height:100dvh; display:flex; flex-direction:column; }
  header { padding:16px 20px; border-bottom:1px solid rgba(28,28,28,.12); font-weight:700; }
  header span { color:var(--accent); }
  #log { flex:1; overflow:auto; padding:20px; display:flex; flex-direction:column; gap:12px; }
  .msg { padding:10px 14px; border-radius:var(--radius); max-width:85%; white-space:pre-wrap; line-height:1.45; }
  .me { align-self:flex-end; background:var(--accent); color:#fff; }
  .bot { align-self:flex-start; background:#FDFBF9; border:1px solid rgba(28,28,28,.10); }
  form { display:flex; gap:8px; padding:14px 20px; border-top:1px solid rgba(28,28,28,.12); }
  input { flex:1; padding:11px 14px; border:1px solid rgba(28,28,28,.2); border-radius:var(--radius); font-size:16px; }
  button { padding:11px 18px; border:0; border-radius:var(--radius); background:var(--accent); color:#fff; font-weight:600; cursor:pointer; }
  button:disabled { opacity:.5; }
</style></head>
<body><div class="wrap">
  <header>Sample Academy · <span>Tutor</span> (test)</header>
  <div id="log"></div>
  <form id="f"><input id="i" autocomplete="off" placeholder="Ask about an AI tool or lesson…" /><button id="b">Send</button></form>
</div>
<script>
  const sessionId = 'web-' + Math.random().toString(36).slice(2);
  const log = document.getElementById('log'), input = document.getElementById('i'),
        form = document.getElementById('f'), btn = document.getElementById('b');
  function add(text, who){ const d=document.createElement('div'); d.className='msg '+who; d.textContent=text; log.appendChild(d); log.scrollTop=log.scrollHeight; return d; }
  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); const message=input.value.trim(); if(!message) return;
    add(message,'me'); input.value=''; btn.disabled=true;
    const thinking=add('…','bot');
    try {
      const r=await fetch('/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message,sessionId})});
      const data=await r.json();
      thinking.textContent = data.display || data.text || data.error || 'Something went wrong.';
    } catch { thinking.textContent='Network error — try again.'; }
    btn.disabled=false; input.focus();
  });
</script>
</body></html>`;
