'use strict';
/* =========================================================================
   JANELA DE ESCOLHER — arma, peça de armadura, joia, amuleto, monstro alvo
   ========================================================================= */

let J = null; // estado da janela aberta
const LIMITE_LISTA = 150;

function fecharJanela() { J = null; $('#janela').innerHTML = ''; }
ACOES.fecharJanela = (d, el, e) => { if (!e || e.target === el || el.dataset.forca) fecharJanela(); };

function abrirJanela(cfg) {
  J = Object.assign({ busca: '' }, cfg);
  desenharJanela();
  const b = $('#janela .busca'); if (b) b.focus();
}

function desenharJanela() {
  if (!J) return;
  const titulo =
    J.tipo === 'arma' ? (J.local === 'reserva' ? 'Escolher arma reserva' : 'Escolher arma') :
    J.tipo === 'peca' ? 'Escolher ' + (PECAS.find(p => p[0] === J.local) || [, , 'peça'])[2].toLowerCase() :
    J.tipo === 'joia' ? 'Escolher joia (espaço ' + J.esp.tam + ')' :
    J.tipo === 'amuleto' ? 'Escolher amuleto' : 'Qual monstro você vai caçar?';
  const temBusca = J.tipo !== 'alvo';
  $('#janela').innerHTML = '<div class="fundo-j" data-a="fecharJanela"><div class="jan' + (J.tipo === 'alvo' ? ' peq' : '') + '">' +
    '<div class="jan-topo"><div class="t"><h3>' + titulo + '</h3>' +
    (temBusca ? '<input class="busca" data-in="jbusca" placeholder="Procurar pelo nome ou habilidade…" value="' + esc(J.busca) + '">' : '<span class="grow"></span>') +
    '<button class="btn leve" data-a="fecharJanela" data-forca="1">Fechar<span class="so-pc"> (Esc)</span></button></div>' +
    '<div class="filtros">' + filtrosJanela() + '</div></div>' +
    '<div class="jan-lista">' + listaJanela() + '</div></div></div>';
}
function redesenharLista() { const l = $('#janela .jan-lista'); if (l) { l.innerHTML = listaJanela(); l.scrollTop = 0; } }
function redesenharFiltros() { const f = $('#janela .filtros'); if (f) f.innerHTML = filtrosJanela(); redesenharLista(); }
DIGITAR.jbusca = v => { J.busca = v; redesenharLista(); };
ACOES.jfiltro = d => { J[d.k] = J[d.k] === d.v && d.k !== 'tipoArma' ? '' : d.v; redesenharFiltros(); };

function chip(k, v, rotulo, img) {
  return '<button class="chip ' + (String(J[k] ?? '') === String(v) ? 'on' : '') + '" data-a="jfiltro" data-k="' + k + '" data-v="' + v + '">' + (img || '') + rotulo + '</button>';
}

function filtrosJanela() {
  if (J.tipo === 'arma') {
    return ORDEM_ARMAS.map(t => chip('tipoArma', t, TIPO_ARMA[t], icArma(t, 8, 18))).join('') +
      '<span style="width:100%"></span>' + chip('el', 'none', 'Sem elemento') + [...ELEMENTOS, ...STATUS].map(e => chip('el', e, ELEM[e].n, '<img src="' + elImg(e) + '">')).join('') +
      '<span style="width:12px"></span>' + chip('rar', '8', 'Só raridade 8');
  }
  if (J.tipo === 'peca') return chip('rank', 'high', 'Patente Alta') + chip('rank', 'low', 'Patente Baixa') + chip('rar', '8', 'Só raridade 8');
  if (J.tipo === 'amuleto') return chip('origem', 'meus', 'Meus amuletos (' + U.amuletos.length + ')') + chip('origem', 'fixos', 'Amuletos fabricáveis');
  if (J.tipo === 'joia') return '<span class="s">Joias de ' + (J.esp.tipo === 'weapon' ? 'ARMA' : 'ARMADURA') + ' de tamanho ' + J.esp.tam + ' ou menor</span>';
  return '';
}

function filtrarBusca(lista) {
  const q = semAcento(J.busca).trim().split(/\s+/).filter(Boolean);
  return q.length ? lista.filter(x => q.every(p => x.busca.includes(p))) : lista;
}
function cortar(lista, html) {
  const n = lista.length;
  return lista.slice(0, LIMITE_LISTA).map(html).join('') + (n > LIMITE_LISTA ? '<div class="mais-it">Mostrando ' + LIMITE_LISTA + ' de ' + n + '. Use a busca ou os filtros pra achar mais rápido.</div>' : '') +
    (n === 0 ? '<div class="mais-it">Nada encontrado.</div>' : '');
}
function habsTexto(skills) {
  return (skills || []).map(s => { const h = G.hab.get(s.skill ? s.skill.id : s.id); return h ? esc(h.name) + ' ' + s.level : ''; }).filter(Boolean).join(' · ');
}
function decosMini(slots, tipo) {
  return '<span class="decos">' + (slots || []).map(t => '<span class="deco e"><img src="' + imgUi('deco' + t) + '"></span>').join('') + '</span>';
}

function listaJanela() {
  const b = U.atual;
  if (J.tipo === 'arma') {
    let l = W.armas.filter(a => a.kind === J.tipoArma);
    if (J.el === 'none') l = l.filter(a => !a.elemTipo); else if (J.el) l = l.filter(a => a.elemTipo === J.el);
    if (J.rar) l = l.filter(a => a.rarity >= +J.rar);
    l = filtrarBusca(l).sort((x, y) => y.rarity - x.rarity || y.damage.raw - x.damage.raw);
    const atual = b[J.local];
    return cortar(l, a => {
      const el = textoElemento(a);
      return '<div class="it ' + (a.id === atual ? 'atual' : '') + '" data-a="equipar" data-id="' + a.id + '"><span class="ico">' + icArma(a.kind, a.rarity, 36) + '</span>' +
        '<div class="grow"><div class="n">' + esc(a.name) + ' <span class="s">· Raridade ' + a.rarity + '</span></div><div class="sk">' + (habsTexto(a.skills) || '<span class="s">sem habilidade</span>') + '</div>' +
        '<div style="width:220px;margin-top:5px">' + barraAfiacao(a, 6) + '</div></div>' +
        decosMini(a.slots) +
        '<div class="lado" style="width:90px"><b>' + a.damage.display + '</b><br>ataque</div>' +
        '<div class="lado" style="width:70px"><b style="font-size:14px">' + (a.affinity > 0 ? '+' : '') + a.affinity + '%</b><br>afinidade</div>' +
        '<div class="lado" style="width:100px">' + (el ? '<img class="ic p" src="' + elImg(el.tipo) + '" style="vertical-align:-4px"> <b style="font-size:14px">' + el.val + '</b><br>' + el.nome : '—') + '</div></div>';
    });
  }
  if (J.tipo === 'peca') {
    let l = W.armaduras.filter(p => p.kind === J.local);
    if (J.rank) l = l.filter(p => p.rank === J.rank);
    if (J.rar) l = l.filter(p => p.rarity >= +J.rar);
    l = filtrarBusca(l).sort((x, y) => y.rarity - x.rarity || y.defense.base - x.defense.base);
    const atual = b.pecas[J.local];
    return cortar(l, p => '<div class="it ' + (p.id === atual ? 'atual' : '') + '" data-a="equipar" data-id="' + p.id + '"><span class="ico"><img src="' + imgPeca(p.kind, p.rarity) + '"></span>' +
      '<div class="grow"><div class="n">' + esc(p.name) + ' <span class="s">· Raridade ' + p.rarity + '</span></div><div class="sk">' + habsTexto(p.skills) + '</div></div>' +
      decosMini(p.slots) + '<div class="lado" style="width:80px"><b>' + p.defense.base + '</b><br>defesa</div></div>');
  }
  if (J.tipo === 'joia') {
    let l = W.joias.filter(j => j.kind === J.esp.tipo && j.slot <= J.esp.tam);
    l = filtrarBusca(l).sort((x, y) => y.slot - x.slot || x.name.localeCompare(y.name));
    const atual = ((b.joias || {})[J.local] || [])[J.i];
    return (atual ? '<div class="it" data-a="equipar" data-id=""><span class="ico"><span class="x" style="font-size:22px">×</span></span><div class="grow n">Tirar a joia deste espaço</div></div>' : '') +
      cortar(l, j => '<div class="it ' + (j.id === atual ? 'atual' : '') + '" data-a="equipar" data-id="' + j.id + '"><span class="ico"><img src="' + imgUi('deco' + j.slot) + '" style="width:30px;height:30px"></span>' +
        '<div class="grow"><div class="n">' + esc(j.name) + '</div><div class="sk">' + habsTexto(j.skills) + '</div></div><div class="lado">tamanho ' + j.slot + '</div></div>');
  }
  if (J.tipo === 'amuleto') {
    const meus = J.origem !== 'fixos';
    let l = meus ? U.amuletos.map(a => Object.assign({ busca: semAcento(a.nome + ' ' + a.skills.map(s => (G.hab.get(s.id) || {}).name).join(' ')) }, a)) : G.amuletos;
    l = filtrarBusca(l);
    const atual = b.amuleto && b.amuleto.id;
    if (meus && !U.amuletos.length) return '<div class="mais-it">Você ainda não cadastrou amuletos. Vá em <b>Meus amuletos</b> pra cadastrar os que ganhou nas missões, ou veja os fabricáveis.</div>';
    return cortar(l, a => '<div class="it ' + (a.id === atual ? 'atual' : '') + '" data-a="equipar" data-id="' + a.id + '" data-meu="' + (meus ? 1 : '') + '"><span class="ico"><img src="' + imgAmuleto(a.rarity) + '"></span>' +
      '<div class="grow"><div class="n">' + esc(a.nome) + '</div><div class="sk">' + a.skills.map(s => esc((G.hab.get(s.id) || {}).name) + ' ' + s.level).join(' · ') + '</div></div>' +
      '<span class="decos">' + (a.slots || []).map(s => '<span class="deco e" title="' + (s.tipo === 'weapon' ? 'arma' : 'armadura') + '"><img src="' + imgUi('deco' + s.tam) + '"></span>').join('') + '</span></div>');
  }
  if (J.tipo === 'alvo') {
    return '<div class="brasoes" style="max-width:none;gap:12px;padding:10px">' + W.monstros.slice().sort((a, c) => a.name.localeCompare(c.name)).map(m =>
      '<button title="' + esc(m.name) + '" class="' + (m.id === b.alvo ? 'on' : '') + '" data-a="equipar" data-id="' + m.id + '" style="width:64px;height:64px;opacity:1"><img src="' + imgMon(m.id) + '" style="width:64px;height:64px"></button>').join('') + '</div>';
  }
  return '';
}

ACOES.equipar = d => {
  const b = U.atual;
  const id = d.id === '' ? null : (J.tipo === 'amuleto' ? d.id : +d.id);
  if (J.tipo === 'arma') { b[J.local] = id; T().armaTipo = J.tipoArma; }
  else if (J.tipo === 'peca') b.pecas[J.local] = id;
  else if (J.tipo === 'amuleto') b.amuleto = id ? { id, meu: !!d.meu } : null;
  else if (J.tipo === 'joia') { b.joias[J.local] = b.joias[J.local] || []; b.joias[J.local][J.i] = id; }
  else if (J.tipo === 'alvo') b.alvo = id;
  arrumarJoias(b);
  fecharJanela(); salvar(); atualizar();
};

// abrir a janela certa a partir do montador
ACOES.escolher = d => {
  const b = U.atual;
  if (d.tipo === 'arma') {
    const a = G.armas.get(b[d.local]);
    abrirJanela({ tipo: 'arma', local: d.local, tipoArma: a ? a.kind : T().armaTipo, el: '', rar: '' });
  } else if (d.tipo === 'peca') abrirJanela({ tipo: 'peca', local: d.local, rank: 'high', rar: '' });
  else if (d.tipo === 'amuleto') abrirJanela({ tipo: 'amuleto', origem: U.amuletos.length ? 'meus' : 'fixos' });
  else if (d.tipo === 'alvo') abrirJanela({ tipo: 'alvo' });
};
ACOES.joia = d => {
  const es = espacos(U.atual, d.local)[+d.i];
  if (es) abrirJanela({ tipo: 'joia', local: d.local, i: +d.i, esp: es });
};
