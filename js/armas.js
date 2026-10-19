'use strict';
/* =========================================================================
   MELHORES ARMAS — ranking por tipo e elemento (layout A)
   ========================================================================= */

// multiplicadores de afiação (físico e elemental) — Game8 / comunidade
const AFI_FIS = [0.5, 0.75, 1, 1.05, 1.2, 1.32, 1.39];
const AFI_ELE = [0.25, 0.5, 0.75, 1, 1.0625, 1.15, 1.25];
const ORDENS = [['forca', 'Força física'], ['elemento', 'Elemento'], ['ataque', 'Ataque'], ['afinidade', 'Afinidade']];

// "Força física": ataque real × afiação × efeito médio da afinidade (crítico +25%)
function forcaFisica(a) {
  const afi = a.afiMax >= 0 ? AFI_FIS[a.afiMax] : 1;
  const aff = Math.max(-100, Math.min(100, a.affinity)) / 100;
  return a.damage.raw * afi * (1 + 0.25 * aff);
}
function forcaElemento(a) {
  if (!a.elem) return 0;
  const afi = a.afiMax >= 0 ? AFI_ELE[a.afiMax] : 1;
  return a.elem.damage.display * afi;
}

function armasFiltradas() {
  const t = T();
  let l = W.armas.filter(a => a.kind === t.armaTipo);
  if (t.armaEl === 'none') l = l.filter(a => !a.elemTipo);
  else if (t.armaEl) l = l.filter(a => a.elemTipo === t.armaEl);
  const chave = { forca: forcaFisica, elemento: forcaElemento, ataque: a => a.damage.raw, afinidade: a => a.affinity }[t.armaOrdem] || forcaFisica;
  return l.map(a => ({ a, v: chave(a) })).sort((x, y) => y.v - x.v || y.a.rarity - x.a.rarity);
}

TELAS.armas = () => {
  const t = T();
  const l = armasFiltradas();
  if (!t.armaSel || !l.some(x => x.a.id === t.armaSel)) t.armaSel = l.length ? l[0].a.id : null;
  const fmtV = v => t.armaOrdem === 'afinidade' ? (v > 0 ? '+' : '') + v + '%' : fmt(v);
  const rotV = { forca: 'força', elemento: 'elemento', ataque: 'ataque real', afinidade: 'afinidade' }[t.armaOrdem];

  const esq = '<div class="esq"><div class="in" style="display:flex;align-items:center;gap:16px">' + icArma(t.armaTipo, 8, 52) +
    '<div><div class="kick">Melhores armas</div><div style="font:700 32px Cinzel;color:var(--gold3)">' + TIPO_ARMA[t.armaTipo] + '</div></div>' +
    '<span class="grow"></span><span class="s">' + l.length + ' armas</span></div>' +
    '<div class="lista in" style="--i:1" data-rola="lista-armas">' + (l.length ? l.map((x, i) => {
      const a = x.a, el = textoElemento(a);
      return '<div class="linha ' + (a.id === t.armaSel ? 'on' : '') + '" data-a="selArma" data-id="' + a.id + '"><span class="pos">' + (i + 1) + '</span>' + icArma(a.kind, a.rarity, 34) +
        '<div class="grow"><div class="n corta">' + esc(a.name) + '</div><div class="s corta">Raridade ' + a.rarity + (a.skills && a.skills.length ? ' · ' + habsTexto(a.skills) : '') + '</div></div>' +
        '<div style="width:130px">' + barraAfiacao(a, 6) + '</div>' +
        '<div class="val" style="width:70px"><b style="font-size:15px">' + a.damage.display + '</b><span class="s">ataque</span></div>' +
        '<div class="val" style="width:96px">' + (el ? '<b style="font-size:15px"><img class="ic p" src="' + elImg(el.tipo) + '" style="vertical-align:-3px"> ' + el.val + '</b><span class="s">' + el.nome + '</span>' : '<span class="s">—</span>') + '</div>' +
        '<div class="val"><b>' + fmtV(t.armaOrdem === 'afinidade' ? a.affinity : x.v) + '</b><span class="s">' + rotV + '</span></div></div>';
    }).join('') : '<div class="vazio-grande" style="margin-top:60px"><b>Nenhuma arma</b>Não existe ' + TIPO_ARMA[t.armaTipo] + ' com esse elemento.</div>') + '</div></div>';

  const a = G.armas.get(t.armaSel);
  let dir = '<div class="h2">Tipo de arma</div><div class="filtros" style="margin-bottom:16px">' + ORDEM_ARMAS.map(k => '<button class="chip ' + (k === t.armaTipo ? 'on' : '') + '" data-a="armaTipo" data-k="' + k + '" title="' + TIPO_ARMA[k] + '" style="padding:4px 8px">' + icArma(k, 8, 22) + '</button>').join('') + '</div>' +
    '<div class="h2">Elemento</div><div class="filtros" style="margin-bottom:16px"><button class="chip ' + (!t.armaEl ? 'on' : '') + '" data-a="armaEl" data-k="">Todos</button><button class="chip ' + (t.armaEl === 'none' ? 'on' : '') + '" data-a="armaEl" data-k="none">Sem elemento</button>' +
    [...ELEMENTOS, ...STATUS].map(e => '<button class="chip ' + (t.armaEl === e ? 'on' : '') + '" data-a="armaEl" data-k="' + e + '"><img src="' + elImg(e) + '">' + ELEM[e].n + '</button>').join('') + '</div>' +
    '<div class="h2">Ordenar por</div><div class="seg" style="margin-bottom:22px">' + ORDENS.map(([k, n]) => '<button class="' + (t.armaOrdem === k ? 'on' : '') + '" data-a="armaOrdem" data-k="' + k + '">' + n + '</button>').join('') + '</div>';
  if (a) dir += '<div class="cartao-pc">' + cartaoArma(a) + '</div>';
  return '<div class="corpo">' + esq + '<div class="dir in" style="--i:2" data-rola="dir-armas">' + dir + '</div></div>';
};

// cartão da arma escolhida (no PC fica na coluna da direita; no celular abre por cima)
function cartaoArma(a) {
    const el = textoElemento(a);
    return '<div class="cartao"><div style="display:flex;gap:14px;align-items:center;margin-bottom:12px">' + icArma(a.kind, a.rarity, 56) +
      '<div><div style="font:700 20px Cinzel;color:var(--gold3);line-height:1.2">' + esc(a.name) + '</div><div class="s">' + TIPO_ARMA[a.kind] + ' · Raridade ' + a.rarity + '</div></div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px"><div><div class="s">Ataque</div><div class="num" style="font-size:22px">' + a.damage.display + '</div></div>' +
      '<div><div class="s">Afinidade</div><div class="num" style="font-size:22px">' + (a.affinity > 0 ? '+' : '') + a.affinity + '%</div></div>' +
      '<div><div class="s">' + (el ? el.nome : 'Elemento') + '</div><div class="num" style="font-size:22px">' + (el ? el.val : '—') + '</div></div></div>' +
      (a.sharpness ? '<div class="s" style="margin-bottom:5px">Afiação máxima: <b style="color:' + AFIACAO_COR[a.afiMax] + '">' + AFIACAO_NOME[a.afiMax] + '</b></div>' + barraAfiacao(a) : '') +
      '<div style="display:flex;gap:6px;align-items:center;margin-top:12px"><span class="s">Espaços:</span>' + decosMini(a.slots) + '</div>' +
      ((a.skills || []).length ? '<div style="margin-top:10px">' + a.skills.map(s => { const h = G.hab.get(s.skill.id); return h ? '<div class="row" style="padding:5px 0"><img class="ic p" src="' + imgHab(h) + '"><span class="grow">' + esc(h.name) + '</span><span class="s">nível ' + s.level + '</span></div>' : ''; }).join('') + '</div>' : '') +
      '<p class="s" style="margin-top:10px;line-height:1.5">' + esc(a.description || '') + '</p>' +
      '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn ouro" data-a="usarArma" data-local="arma">Usar no Montador</button><button class="btn" data-a="usarArma" data-local="reserva">Como reserva</button></div>' +
      blocoMatsArma(a) + '</div>' +
      '<div class="aprox">"Força física" junta ataque real, afiação máxima e afinidade num número só, pra comparar armas do mesmo tipo. A calculadora completa (com habilidades) chega na Etapa 2.</div>';
}

ACOES.selArma = d => {
  T().armaSel = +d.id; salvar(); atualizar();
  if (ehCelular()) abrirCartaoCel();
};
// celular: o cartão da arma abre por cima, em tela cheia
function abrirCartaoCel() {
  const a = G.armas.get(T().armaSel);
  if (!a) return;
  const corpo = cartaoArma(a);
  $('#janela').innerHTML = '<div class="fundo-j" data-a="fecharJanela"><div class="jan peq cartao-cel"><div class="jan-topo"><div class="t"><h3>' + TIPO_ARMA[a.kind] + '</h3><span class="grow"></span>' +
    '<button class="btn leve" data-a="fecharJanela" data-forca="1">Fechar</button></div></div><div class="jan-lista" style="padding:12px">' + corpo + '</div></div></div>';
  matsVoltar = abrirCartaoCel; // "Voltar" na janela de material volta pra cá
}
ACOES.armaTipo = d => { T().armaTipo = d.k; T().armaSel = null; salvar(); atualizar(); const l = document.querySelector('[data-rola="lista-armas"]'); if (l) l.scrollTop = 0; };
ACOES.armaEl = d => { T().armaEl = d.k; T().armaSel = null; salvar(); atualizar(); const l = document.querySelector('[data-rola="lista-armas"]'); if (l) l.scrollTop = 0; };
ACOES.armaOrdem = d => { T().armaOrdem = d.k; salvar(); atualizar(); };
ACOES.usarArma = d => {
  U.atual[d.local] = T().armaSel; arrumarJoias(U.atual);
  fecharJanela();
  T().t = 'montador'; window.scrollTo(0, 0); salvar(); render(); aviso(d.local === 'arma' ? 'Arma colocada no Montador' : 'Arma reserva colocada no Montador');
};
