'use strict';
/* =========================================================================
   MINHAS BUILDS
   ========================================================================= */

function quando(ts) {
  if (!ts) return '';
  const d = Math.floor((Date.now() - ts) / 86400000);
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : 'há ' + d + ' dias';
}

TELAS.builds = () => {
  const t = T();
  if (!U.builds.length) {
    return '<div class="corpo"><div class="esq"><div class="vazio-grande in" style="margin-top:120px"><b>Nenhuma build salva ainda</b>Monte uma build no Montador e clique em <b style="display:inline;font:inherit;color:var(--gold2)">Salvar em Minhas builds</b>. Ela aparece aqui pra você abrir quando quiser.<div style="margin-top:18px"><button class="btn ouro" data-a="ir" data-t="montador">Ir para o Montador</button></div></div></div></div>';
  }
  if (!U.builds.some(b => b.id === t.buildSel)) t.buildSel = U.builds[0].id;
  const esq = '<div class="esq"><div class="in" style="display:flex;align-items:center;gap:12px"><div><div class="kick">Minhas builds</div><div style="font:700 32px Cinzel;color:var(--gold3)">' + U.builds.length + ' build' + (U.builds.length > 1 ? 's' : '') + ' salva' + (U.builds.length > 1 ? 's' : '') + '</div></div><span class="grow"></span><button class="btn" data-a="buildNovaIr">+ Nova build</button></div>' +
    '<div class="lista in" style="--i:1" data-rola="lista-builds">' + U.builds.map(b => {
      const a = G.armas.get(b.arma), m = G.mon.get(b.alvo);
      const c = calcularBuild(b);
      const top = c.habilidades.slice(0, 4).map(x => esc(x.h.name) + ' ' + Math.min(x.lv, x.max)).join(' · ');
      return '<div class="linha ' + (b.id === t.buildSel ? 'on' : '') + '" data-a="selBuild" data-id="' + b.id + '" style="padding:12px 10px">' +
        (m ? '<img class="emb" src="' + imgMon(m.id) + '" style="width:44px;height:44px">' : '') + (a ? icArma(a.kind, a.rarity, 36) : '') +
        '<div class="grow"><div class="n corta" style="font-size:16px">' + esc(b.nome) + '</div><div class="s corta">' + (a ? esc(a.name) + ' · ' : '') + (top || 'sem habilidades') + '</div></div>' +
        '<span class="s">' + quando(b.editado) + '</span></div>';
    }).join('') + '</div></div>';

  const b = U.builds.find(x => x.id === t.buildSel);
  const c = calcularBuild(b);
  const m = G.mon.get(b.alvo);
  let dir = '<div style="display:flex;gap:14px;align-items:center;margin-bottom:16px">' + (m ? '<img class="emb" src="' + imgMon(m.id) + '" style="width:60px;height:60px">' : '') +
    '<div><div class="kick">' + (m ? 'Para ' + esc(m.name) : 'Build') + '</div><div style="font:700 22px Cinzel;color:var(--gold3);line-height:1.2">' + esc(b.nome) + '</div></div></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px"><button class="btn ouro" data-a="abrirBuild">Abrir no Montador</button><button class="btn" data-a="duplicarBuild">Duplicar</button><button class="btn perigo" data-a="apagarBuild">Apagar</button></div>' +
    '<div class="h2">Equipamento</div>';
  const peca = (img, nome) => '<div class="row" style="padding:5px 0">' + img + '<span class="grow corta">' + (nome ? esc(nome) : '<span class="vazio">vazio</span>') + '</span></div>';
  dir += peca(c.arma ? icArma(c.arma.kind, c.arma.rarity, 24) : '<span style="width:24px"></span>', c.arma && c.arma.name) +
    (c.reserva ? peca(icArma(c.reserva.kind, c.reserva.rarity, 24), c.reserva.name + ' (reserva)') : '') +
    PECAS.map(([k]) => { const p = G.pecas.get(b.pecas[k]); return peca('<img class="ic" src="' + imgPeca(k, p ? p.rarity : 1) + '"' + (p ? '' : ' style="opacity:.3"') + '>', p && p.name); }).join('') +
    peca('<img class="ic" src="' + imgAmuleto(c.am ? c.am.rarity : 1) + '"' + (c.am ? '' : ' style="opacity:.3"') + '>', c.am && c.am.nome);
  dir += '<div class="h2" style="margin-top:18px">Habilidades</div>' + (c.habilidades.map(x => '<div class="row" style="padding:5px 0"><img class="ic p" src="' + imgHab(x.h) + '"><span class="grow">' + esc(x.h.name) + '</span><span class="pips">' + Array.from({ length: x.max }, (_, i) => '<i class="' + (i < Math.min(x.lv, x.max) ? 'on' : '') + '"></i>').join('') + '</span></div>').join('') || '<div class="s vazio">nenhuma</div>');
  const ativos = c.bonus.filter(x => x.ativos.length);
  if (ativos.length) dir += '<div class="h2" style="margin-top:18px">Bônus ativos</div>' + ativos.map(x => '<div class="row" style="padding:5px 0"><img class="ic p" src="' + imgHab(x.h) + '"><span class="grow">' + esc(x.h.name) + '</span><span class="ok">ATIVO</span></div>').join('');
  return '<div class="corpo">' + esq + '<div class="dir in" style="--i:2" data-rola="dir-builds">' + dir + '</div></div>';
};

const buildSel = () => U.builds.find(x => x.id === T().buildSel);
ACOES.selBuild = d => { T().buildSel = d.id; salvar(); atualizar(); };
ACOES.abrirBuild = () => { const b = buildSel(); if (!b) return; U.atual = JSON.parse(JSON.stringify(b)); T().t = 'montador'; salvar(); render(); };
ACOES.duplicarBuild = () => {
  const b = buildSel(); if (!b) return;
  const c = JSON.parse(JSON.stringify(b)); c.id = novoId(); c.nome = b.nome + ' (cópia)'; c.editado = Date.now();
  U.builds.unshift(c); T().buildSel = c.id; salvar(); atualizar(); aviso('Build duplicada');
};
ACOES.apagarBuild = () => {
  const b = buildSel(); if (!b) return;
  if (!confirm('Apagar a build "' + b.nome + '"?')) return;
  U.builds = U.builds.filter(x => x.id !== b.id);
  if (U.atual.id === b.id) U.atual.id = null;
  T().buildSel = null; salvar(); render(); aviso('Build apagada');
};
ACOES.buildNovaIr = () => { const alvo = U.atual.alvo; U.atual = buildVazia(); U.atual.alvo = alvo; T().t = 'montador'; salvar(); render(); };
