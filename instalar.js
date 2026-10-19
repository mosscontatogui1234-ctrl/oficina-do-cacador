'use strict';
/* Só no site (celular): guarda o app pra funcionar sem internet, avisa de versão nova e ajuda a instalar */
(function () {
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
  const tinhaControle = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // versão nova: recarrega uma vez (só se já estava rodando uma versão antiga)
  let recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!tinhaControle || recarregou) return;
    recarregou = true;
    try { sessionStorage.setItem('oficina-atualizou', '1'); } catch (e) {}
    location.reload();
  });
  window.addEventListener('load', () => {
    try { if (sessionStorage.getItem('oficina-atualizou')) { sessionStorage.removeItem('oficina-atualizou'); setTimeout(() => typeof aviso === 'function' && aviso('App atualizado!'), 800); } } catch (e) {}
  });

  // ---------- botão de instalar ----------
  const instalado = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (instalado) return;
  let pedido = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedido = e; desenhar(); });
  window.addEventListener('appinstalled', () => { pedido = null; fechar(); });

  const ua = navigator.userAgent;
  const iphone = /iPhone|iPad|iPod/.test(ua);
  const dentroDeOutroApp = /WhatsApp|Instagram|FBAN|FBAV|; wv\)/.test(ua);
  function fechar() { const b = document.getElementById('instalar-faixa'); if (b) b.remove(); try { sessionStorage.setItem('oficina-sem-faixa', '1'); } catch (e) {} }
  function desenhar() {
    try { if (sessionStorage.getItem('oficina-sem-faixa')) return; } catch (e) {}
    if (!matchMedia('(max-width: 760px)').matches) return;
    let b = document.getElementById('instalar-faixa');
    if (!b) { b = document.createElement('div'); b.id = 'instalar-faixa'; document.body.appendChild(b); }
    let acao;
    if (dentroDeOutroApp && /Android/.test(ua)) acao = '<a class="btn ouro" href="intent://' + location.host + location.pathname + '#Intent;scheme=https;package=com.android.chrome;end">Abrir no Chrome</a>';
    else if (pedido) acao = '<button class="btn ouro" id="instalar-sim">Instalar</button>';
    else if (iphone) acao = '<span class="s">Toque em Compartilhar <b>⎋</b> e depois em <b>Adicionar à Tela de Início</b></span>';
    else acao = '<span class="s">No Chrome: toque em <b>⋮</b> e depois em <b>Instalar app</b></span>';
    b.innerHTML = '<img src="icones/icone-192.png"><div class="grow"><b>Oficina do Caçador</b><br><span class="s">Instale no celular pra abrir como app, até sem internet.</span><div style="margin-top:8px">' + acao + '</div></div><button class="x" id="instalar-nao" title="Agora não">×</button>';
    const sim = document.getElementById('instalar-sim');
    if (sim) sim.onclick = async () => { pedido.prompt(); const r = await pedido.userChoice; if (r.outcome === 'accepted') fechar(); };
    document.getElementById('instalar-nao').onclick = fechar;
  }
  // se o navegador não oferecer o botão em 3 s, mostra o passo a passo
  setTimeout(desenhar, 3000);
  const st = document.createElement('style');
  st.textContent = '#instalar-faixa{position:fixed;left:10px;right:10px;bottom:calc(72px + env(safe-area-inset-bottom));z-index:60;display:flex;gap:12px;align-items:flex-start;padding:12px 12px 12px 14px;border:1px solid #c9a65a88;border-radius:10px;background:#0e1115f5;box-shadow:0 10px 30px #000c;font-size:13.5px;line-height:1.4}' +
    '#instalar-faixa img{width:44px;height:44px;border-radius:10px;flex:none}#instalar-faixa b{color:var(--gold2)}#instalar-faixa .x{font-size:22px;color:var(--dim);padding:0 4px}#instalar-faixa a.btn{text-decoration:none}';
  document.head.appendChild(st);
})();
