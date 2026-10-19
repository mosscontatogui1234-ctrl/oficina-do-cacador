'use strict';
/* =========================================================================
   MONSTROS (layout A: monstro grande à esquerda, ficha em abas à direita)
   ========================================================================= */

const PARTE_PT = {
  'Head': 'Cabeça', 'Head (Crystalized)': 'Cabeça (cristalizada)', 'Neck': 'Pescoço', 'Torso': 'Tronco', 'Chest': 'Peito', 'Back': 'Costas', 'Belly': 'Barriga',
  'Tail': 'Cauda', 'Tail Tip': 'Ponta da cauda', 'Tail Hair': 'Pelos da cauda', 'Left Leg': 'Perna esquerda', 'Right Leg': 'Perna direita',
  'Foreleg': 'Pata dianteira', 'Left Foreleg': 'Pata dianteira esq.', 'Right Foreleg': 'Pata dianteira dir.', 'Hind Leg': 'Pata traseira',
  'Left Hind Leg': 'Pata traseira esq.', 'Right Hind Leg': 'Pata traseira dir.', 'Left Wing': 'Asa esquerda', 'Right Wing': 'Asa direita',
  'Left Wingarm': 'Braço-asa esquerdo', 'Right Wingarm': 'Braço-asa direito', 'L Wingarm (Crystalized)': 'Braço-asa esq. (cristalizado)', 'R Wingarm (Crystalized)': 'Braço-asa dir. (cristalizado)',
  'Left Chainblade': 'Correlâmina esquerda', 'Right Chainblade': 'Correlâmina direita', 'Left Claw': 'Garra esquerda', 'Right Claw': 'Garra direita',
  'Mouth': 'Boca', 'Nose': 'Nariz', 'Tongue': 'Língua', 'Antenna': 'Antena', 'Mantle': 'Manto', 'Membrane': 'Membrana', 'Petals': 'Pétalas', 'Stinger': 'Ferrão',
  'Dorsal Fin': 'Barbatana dorsal', 'Tentacle': 'Tentáculo', 'Rear': 'Traseira', 'Rear Power Unit': 'Unidade de energia traseira',
  'Front Left Arm': 'Braço dianteiro esq.', 'Front Right Arm': 'Braço dianteiro dir.', 'Middle Left Arm': 'Braço do meio esq.', 'Middle Right Arm': 'Braço do meio dir.',
  'Rear Left Arm': 'Braço traseiro esq.', 'Rear Right Arm': 'Braço traseiro dir.', 'Abdominal Iceplate': 'Placa de gelo da barriga',
  'Lg. Iceplate (Exposed)': 'Placa de gelo grande (exposta)', 'Lg. Iceplate (Hidden)': 'Placa de gelo grande (escondida)',
  'Veil: Foreleg (Left)': 'Véu: pata dianteira esq.', 'Veil: Foreleg (Right)': 'Véu: pata dianteira dir.', 'Veil: Head (Left)': 'Véu: cabeça esq.', 'Veil: Head (Right)': 'Véu: cabeça dir.',
  'Veil: Tail (Left)': 'Véu: cauda esq.', 'Veil: Tail (Middle)': 'Véu: cauda meio', 'Veil: Tail (Right)': 'Véu: cauda dir.', 'Veil: Torso (Left)': 'Véu: tronco esq.', 'Veil: Torso (Right)': 'Véu: tronco dir.'
};
const ESTADO_PT = { 'Wounds': 'ferida', 'Weak Point': 'ponto fraco', 'Breakable': 'quebrada', 'State_1': 'estado especial 1', 'State_2': 'estado especial 2', 'State_3': 'estado especial 3' };
const STATUS_KIRA = { Poison: 'poison', Sleep: 'sleep', Paralysis: 'paralysis', Blastblight: 'blastblight', Stun: 'stun', Exhaust: 'exhaust', Ride: 'ride' };
// Vida aproximada: medida pela comunidade no Arkveld (base 5200) e aplicada aos outros na mesma proporção.
const VIDA_VERSOES = [['Normal', 4.135, null], ['Aguerrido', 4.615, 'tempered'], ['Arquiaguerrido', 15.19, 'arch-tempered']];
const MULT_JOG = [1, 1.63, 2, 2.34];
const vidaAprox = v => Math.round(v / 100) * 100; // é estimativa: arredonda na centena

function partesDoMonstro(m) {
  // agrupa as linhas da Kiranico por parte: [{nome, base:[8 valores], estados:[{nome, v}], hp, quebra}]
  const out = [];
  let ultima = null;
  for (const r of m.k.hz || []) {
    const [parte, estado, ...v] = r;
    const vals = v.slice(0, 8);
    if (!estado) {
      if (ultima && ultima.nomeEn === parte) { out.push(ultima = { nomeEn: 'outras', nome: 'Outras partes', base: vals, estados: [] }); continue; }
      out.push(ultima = { nomeEn: parte, nome: PARTE_PT[parte] || parte, base: vals, estados: [], atordoa: v[8] > 0 });
    } else if (ultima) {
      if (estado === 'Breakable') { ultima.quebra = true; if (vals.join() !== ultima.base.join()) ultima.estados.push({ nome: 'depois de quebrar', v: vals }); }
      else ultima.estados.push({ nome: ESTADO_PT[estado] || estado, v: vals });
    }
  }
  const hp = new Map((m.k.ph || []).map(([n, h]) => [n, h]));
  for (const p of out) p.hp = hp.get(p.nomeEn) || null;
  if (!out.length) { // sem dados da Kiranico: usa a lista grátis
    for (const p of m.parts || []) {
      const x = p.multipliers || {};
      out.push({ nome: p.kind, base: ['slash', 'blunt', 'pierce', 'fire', 'water', 'thunder', 'ice', 'dragon'].map(k => Math.round((x[k] || 0) * 100)), estados: [], hp: p.health });
    }
  }
  return out;
}

function melhorElemento(m) {
  const f = fraquezasMon(m, true);
  let best = null;
  for (const e of ELEMENTOS) if ((f.lv[e] || 0) > 0 && (!best || f.lv[e] > f.lv[best])) best = e;
  return best;
}

TELAS.monstros = () => {
  const t = T();
  const m = G.mon.get(t.mon) || G.mon.get(20);
  const f = fraquezasMon(m, true);
  const best = melhorElemento(m);
  const vidaNormal = vidaAprox(m.baseHealth * VIDA_VERSOES[0][1]);
  const efeitos = (m.weaknesses || []).filter(w => w.kind === 'effect').map(w => EFEITO[w.effect] || w.effect);
  const resiste = (m.resistances || []).filter(w => w.kind === 'effect').map(w => EFEITO[w.effect] || w.effect);
  const ordenados = W.monstros.slice().sort((a, c) => a.name.localeCompare(c.name));

  const esq = '<div class="esq mon-esq"><img class="art" src="' + imgRender(m.id) + '">' +
    '<div class="in" style="position:relative;display:flex;align-items:center;gap:24px"><img class="emb" src="' + imgMon(m.id) + '" style="width:110px;height:110px"><div><div class="kick">' + (ESPECIE[m.species] || m.species) + '</div><h1 style="font-size:' + (m.name.length > 16 ? 44 : 60) + 'px">' + esc(m.name.toUpperCase()) + '</h1></div></div>' +
    '<p class="in" style="--i:1;position:relative;color:#a9a294;max-width:580px">' + esc(m.description) + '</p>' +
    '<div class="facts in" style="--i:2"><div><span class="s">Vida (aprox.)</span><b>' + fmt(vidaNormal) + '</b></div>' +
    '<div><span class="s">Fraco a</span><b style="display:flex;gap:6px;align-items:center">' + (best ? '<img src="' + elImg(best) + '" style="width:22px;height:22px">' + ELEM[best].n : '—') + '</b></div>' +
    '<div><span class="s">Habitats</span><b>' + (m.locations || []).length + '</b></div>' +
    (m.variants && m.variants.some(v => v.kind === 'arch-tempered') ? '<div><span class="s">Versões</span><b>Arquiaguerrido</b></div>' : m.variants && m.variants.length ? '<div><span class="s">Versões</span><b>Aguerrido</b></div>' : '') + '</div>' +
    '<div class="in" style="--i:3;position:relative;max-width:580px"><div class="h2" style="margin-top:6px">Fraquezas</div>' + chipsFraqueza(m, true) +
    (efeitos.length ? '<div class="s" style="margin-top:8px">Também funciona: ' + esc(efeitos.join(', ')) + '</div>' : '') +
    (resiste.length ? '<div class="s" style="margin-top:2px">Não funciona: ' + esc(resiste.join(', ')) + '</div>' : '') + '</div>' +
    '<div class="in" style="--i:4;position:relative;margin-top:auto"><div class="h2">Outros monstros</div><div class="brasoes">' +
    ordenados.map(x => '<button title="' + esc(x.name) + '" class="' + (x.id === m.id ? 'on' : '') + '" data-a="verMonstro" data-id="' + x.id + '"><img src="' + imgMon(x.id) + '"></button>').join('') + '</div></div></div>';

  if (t.aba === 'vida') t.aba = 'versoes';
  const abas = [['onde', 'Onde bater'], ['armas', 'Armas'], ['versoes', 'Versões'], ['recomp', 'Recompensas'], ['status', 'Status'], ['info', 'Informações']];
  let conteudo = '';
  if (t.aba === 'armas') conteudo = abaArmas(m);
  else if (t.aba === 'versoes') conteudo = abaVersoes(m);
  else if (t.aba === 'recomp') conteudo = abaRecompensas(m);
  else if (t.aba === 'status') conteudo = abaStatus(m);
  else if (t.aba === 'info') conteudo = abaInfo(m);
  else conteudo = abaOnde(m);

  return '<div class="corpo">' + esq + '<div class="dir larga in" style="--i:2" data-rola="dir-mon"><div class="abas">' +
    abas.map(([k, n]) => '<button data-a="abaMon" data-k="' + k + '" class="' + (t.aba === k ? 'on' : '') + '">' + n + '</button>').join('') + '</div>' + conteudo + '</div></div>';
};

function abaOnde(m) {
  const partes = partesDoMonstro(m);
  const maxHp = Math.max(1, ...partes.map(p => p.hp || 0));
  const cel = v => '<td><span class="' + (v >= 45 ? 'hi' : v < 25 ? 'lo' : '') + '">' + v + '</span></td>';
  let h = '<div class="s" style="margin-bottom:10px">Quanto maior o número, mais dano entra. <b style="color:var(--gold2)">Dourado</b> = ponto fraco (45 ou mais). A última coluna é quanto dano a parte aguenta antes de quebrar ou ferir.</div>' +
    '<table class="hz"><tr><th>Parte</th><th>Corte</th><th>Impacto</th><th>Tiro</th>' + ELEMENTOS.map(e => '<th><img src="' + elImg(e) + '" title="' + ELEM[e].n + '"></th>').join('') + '<th style="text-align:right">Vida</th></tr>';
  for (const p of partes) {
    h += '<tr><td><span class="n">' + esc(p.nome) + '</span>' + (p.quebra ? '<span class="tag">QUEBRA</span>' : '') + (p.atordoa ? '<span class="tag" style="background:#6b8fd6">ATORDOA</span>' : '') + '</td>' + p.base.map(cel).join('') +
      '<td>' + (p.hp ? '<div class="parte-hp"><i style="width:' + Math.round(p.hp / maxHp * 50) + 'px"></i>' + p.hp + '</div>' : '') + '</td></tr>';
    for (const e of p.estados) h += '<tr class="sub"><td>' + esc(e.nome) + '</td>' + e.v.map(cel).join('') + '<td></td></tr>';
  }
  return h + '</table><div class="aprox">Dados: Kiranico (jogo versão 1.040). "Estado especial" é quando a parte muda durante a luta (carregada, aberta, brilhando…).</div>';
}

/* ---------- Armas contra este monstro ---------- */
// força média de um golpe de cada tipo de arma (só serve pra pesar ataque × elemento dentro do mesmo tipo)
const MV_TIPO = {
  'great-sword': .55, 'long-sword': .3, 'sword-shield': .2, 'dual-blades': .15, 'hammer': .45, 'hunting-horn': .35, 'lance': .25,
  'gunlance': .3, 'switch-axe': .35, 'charge-blade': .3, 'insect-glaive': .25, 'light-bowgun': .15, 'heavy-bowgun': .2, 'bow': .12
};
// coluna da tabela de partes: 0 corte, 1 impacto, 2 tiro, 3..7 fogo/água/raio/gelo/dragão
const tipoGolpe = k => k === 'hammer' || k === 'hunting-horn' ? 1 : (k === 'bow' || k === 'light-bowgun' || k === 'heavy-bowgun') ? 2 : 0;
const GOLPE_NOME = ['corte', 'impacto', 'tiro'];
const COL_ELEM = { fire: 3, water: 4, thunder: 5, ice: 6, dragon: 7 };

// dano estimado de um golpe médio na melhor parte do monstro
function armasContra(m, tipo) {
  const partes = partesDoMonstro(m).filter(p => p.nomeEn !== 'outras');
  const col = tipoGolpe(tipo), mv = MV_TIPO[tipo] || .3;
  return W.armas.filter(a => a.kind === tipo).map(a => {
    const afiF = a.afiMax >= 0 ? AFI_FIS[a.afiMax] : 1, afiE = a.afiMax >= 0 ? AFI_ELE[a.afiMax] : 1;
    const aff = Math.max(-100, Math.min(100, a.affinity)) / 100;
    const bruto = a.damage.raw * mv * afiF * (1 + .25 * aff);
    const ce = a.elem && !a.elem.hidden ? COL_ELEM[a.elem.element] : undefined;
    const elem = ce != null ? a.elem.damage.display / 10 * afiE : 0;
    let melhor = { t: 0, r: 0, e: 0, p: null };
    for (const p of partes) {
      const r = bruto * p.base[col] / 100, e = ce != null ? elem * p.base[ce] / 100 : 0;
      if (r + e > melhor.t) melhor = { t: r + e, r, e, p };
    }
    return Object.assign({ a }, melhor);
  }).sort((x, y) => y.t - x.t || y.a.rarity - x.a.rarity);
}

function abaArmas(m) {
  const t = T();
  const tipo = t.recTipo || t.armaTipo || 'long-sword';
  const f = fraquezasMon(m, true);
  const l = armasContra(m, tipo).slice(0, 20);
  const topo = l.length ? l[0].t : 1;
  let h = '<div class="filtros" style="margin-bottom:6px;gap:4px;flex-wrap:nowrap">' + ORDEM_ARMAS.map(k => '<button class="chip ' + (k === tipo ? 'on' : '') + '" data-a="recTipo" data-k="' + k + '" title="' + TIPO_ARMA[k] + '" style="padding:4px 7px">' + icArma(k, 8, 22) + '</button>').join('') + '</div>' +
    '<div style="display:flex;align-items:baseline;gap:10px;margin:10px 0 4px"><span style="font:700 20px Cinzel;color:var(--gold3)">' + TIPO_ARMA[tipo] + '</span><span class="s">as 20 melhores contra ' + esc(m.name) + '</span></div>' +
    '<div class="s" style="margin-bottom:8px;display:flex;gap:14px"><span><i class="rec-leg" style="background:var(--gold)"></i>ataque</span><span><i class="rec-leg" style="background:#5fa8d8"></i>elemento</span></div>';
  if (!l.length) return h + '<div class="s">Nenhuma arma desse tipo.</div>';
  h += l.map((x, i) => {
    const a = x.a, el = textoElemento(a);
    const lvEl = el ? f.lv[el.tipo] : null;
    const st = el && STATUS.includes(el.tipo);
    const elTxt = el ? '<span class="rec-el" title="' + (lvEl != null ? 'Fraqueza dele a ' + ELEM[el.tipo].n : '') + '"><img src="' + elImg(el.tipo) + '">' + el.val + ' ' + estrelas(lvEl || 0) + '</span>' : '';
    const onde = x.p ? 'bater em <b>' + esc(x.p.nome) + '</b> (' + GOLPE_NOME[tipoGolpe(tipo)] + ' ' + x.p.base[tipoGolpe(tipo)] + ')' : '';
    return '<div class="rec">' + '<span class="pos">' + (i + 1) + '</span>' + icArma(a.kind, a.rarity, 30) +
      '<div class="grow" style="min-width:0"><div class="n corta">' + esc(a.name) + '</div><div class="s corta">Raridade ' + a.rarity + ' · ' + onde + (st && lvEl ? ' · ' + ELEM[el.tipo].n + ' funciona nele' : '') + '</div>' +
      '<div class="rec-barra"><i style="width:' + (x.r / topo * 100) + '%;background:var(--gold)"></i><i style="width:' + (x.e / topo * 100) + '%;background:#5fa8d8"></i></div></div>' +
      elTxt + '<div class="val" style="width:56px"><b style="font-size:16px">' + Math.round(x.t / topo * 100) + '</b><span class="s">nota</span></div>' +
      '<button class="btn" data-a="usarContra" data-id="' + a.id + '" title="Colocar esta arma no Montador, caçando ' + esc(m.name) + '">Usar</button></div>';
  }).join('');
  return h + '<div class="aprox">Nota 100 = a melhor arma desse tipo contra ele. A conta junta ataque, afiação máxima, afinidade, o tipo de golpe da arma (' + GOLPE_NOME[tipoGolpe(tipo)] + ') e o elemento, na parte do monstro onde cada arma rende mais. Não conta habilidades, frascos/munições nem status (veneno, paralisia…): as estrelas mostram se o status funciona nele.</div>';
}
ACOES.recTipo = d => { T().recTipo = d.k; salvar(); atualizar(); };
ACOES.usarContra = d => {
  U.atual.arma = +d.id; U.atual.alvo = T().mon; arrumarJoias(U.atual);
  T().t = 'montador'; salvar(); render(); aviso('Arma colocada no Montador');
};

function abaVida(m) {
  const t = T();
  const versoes = VIDA_VERSOES.filter(v => !v[2] || (m.variants || []).some(x => x.kind === v[2]));
  if (t.vida >= versoes.length) t.vida = 0;
  const [nome, mult] = versoes[t.vida];
  const hp = vidaAprox(m.baseHealth * mult * MULT_JOG[t.jog]);
  const maior = m.baseHealth * versoes[versoes.length - 1][1] * MULT_JOG[t.jog];
  return '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px"><div class="seg">' + versoes.map((v, i) => '<button data-a="vidaV" data-i="' + i + '" class="' + (i === t.vida ? 'on' : '') + '">' + v[0] + '</button>').join('') + '</div>' +
    '<div class="seg">' + ['Sozinho', '2 jogadores', '3 jogadores', '4 jogadores'].map((x, i) => '<button data-a="vidaJ" data-i="' + i + '" class="' + (i === t.jog ? 'on' : '') + '">' + x + '</button>').join('') + '</div></div>' +
    '<div style="display:flex;align-items:flex-end;gap:16px;margin-bottom:16px"><img src="' + imgUi('sk-health') + '" style="width:44px;height:44px"><div><div class="s">' + nome + ' · ' + (t.jog ? (t.jog + 1) + ' jogadores' : 'sozinho') + '</div><div class="hpbig">' + fmt(hp) + '</div></div></div>' +
    '<div class="hpbar"><div class="mk" style="left:20%"></div><div class="mk" style="left:15%;opacity:.5"></div></div>' +
    '<div style="display:flex;gap:24px;margin:12px 0 24px;font-size:13.5px;color:#bdb6a8;flex-wrap:wrap"><span>▮ <b style="color:var(--gold3)">Captura</b> por volta de ' + fmt(hp * .2) + ' (20%)</span><span style="opacity:.75">▮ <b style="color:var(--gold3)">Manca</b> por volta de ' + fmt(hp * .15) + ' (15%)</span></div>' +
    versoes.map((v, i) => '<div class="vr ' + (i === t.vida ? 'on' : '') + '"><span class="lb">' + v[0] + '</span><span class="bar"><i style="width:' + (m.baseHealth * v[1] * MULT_JOG[t.jog] / maior * 100) + '%"></i></span><span class="vv">' + fmt(vidaAprox(m.baseHealth * v[1] * MULT_JOG[t.jog])) + '</span></div>').join('') +
    '<div class="aprox">⚠ A Capcom não divulga a vida exata. Estes números são <b>estimativas</b>: a comunidade mediu o Arkveld (≈21.500 normal, ≈24.000 Aguerrido, ≈79.000 Arquiaguerrido) e eu apliquei a mesma proporção ao número base deste monstro (' + fmt(m.baseHealth) + '). Com mais jogadores: 2 = 163% · 3 = 200% · 4 = 234%. Captura e manca variam um pouco por monstro.</div>';
}

/* ---------- Versões: Normal / Aguerrido / Arquiaguerrido ---------- */
function linhasDrop(linhas) {
  // o mesmo item pode aparecer em vários sorteios: junta numa linha só
  const junto = new Map();
  for (const [iid, ch, q] of linhas) { const k = iid + '|' + q; if (!junto.has(k)) junto.set(k, { iid, q, ch: [] }); junto.get(k).ch.push(ch); }
  return [...junto.values()].sort((a, b) => Math.max(...b.ch) - Math.max(...a.ch)).map(({ iid, q, ch }) => {
    const chs = ch.sort((a, b) => b - a).map(c => c + '%').join(' · ');
    const nome = typeof iid === 'number' ? esc(nomeItem(iid)) : esc(iid);
    return '<div class="mat"' + (typeof iid === 'number' ? ' data-a="onde" data-id="' + iid + '" title="Onde mais conseguir' + (ch.length > 1 ? ' (aparece em ' + ch.length + ' sorteios)' : '') + '"' : '') + '>' +
      (typeof iid === 'number' ? iconeItem(iid, 22) : '<span class="it-ic" style="width:22px;height:22px"></span>') +
      '<span class="grow corta">' + nome + (q > 1 ? ' <span class="s">×' + q + '</span>' : '') + '</span><b class="mat-q">' + chs + '</b></div>';
  }).join('');
}
function abaVersoes(m) {
  const t = T();
  const versoes = VIDA_VERSOES.filter(v => !v[2] || (m.variants || []).some(x => x.kind === v[2]));
  if (t.vida >= versoes.length) t.vida = 0;
  const tipo = versoes[t.vida][2];
  const v = (W.versoes || {})[m.id] || { d: {}, q: [], at: [] };
  let h = abaVida(m) + '<div class="h2" style="margin-top:26px">O que muda</div>';
  if (!tipo) {
    h += '<p class="tip">É a versão padrão, a das missões da história. ' + (versoes.length > 1 ? 'Escolha ' + versoes.slice(1).map(x => x[0]).join(' ou ') + ' acima pra ver o que muda nas versões mais fortes.' : 'Este monstro não tem versão Aguerrida.') + ' Tudo o que ele dá está na aba Recompensas.</p>';
  } else if (tipo === 'tempered') {
    h += '<p class="tip">Versão mais forte, só em Patente Alta: tem mais vida e bate mais forte que o normal. Além das recompensas de sempre, dá estas extras:</p>';
    for (const g of ['Extra Rewards (Tempered)', 'Tempered Wound Destruction Rewards']) {
      if ((v.d[g] || []).length) h += '<div class="h2" style="margin-top:16px;font-size:12px">' + esc(fontePt(g)) + '</div>' + linhasDrop(v.d[g]);
    }
    const ms = v.q.filter(q => /Tempered/.test(q[3]) && !/Arch-Tempered/.test(q[3]));
    if (ms.length) h += '<div class="h2" style="margin-top:16px;font-size:12px">Missões com ele Aguerrido</div>' + linhasMissao(ms);
  } else {
    const txt = AT_PT[m.id] || (v.at || []).slice(1);
    h += '<p class="tip" style="margin-bottom:8px">A versão mais difícil de todas. Tem muito mais vida, bate mais forte e muda o jeito de lutar:</p>' +
      (txt.length ? '<ul class="lista-at">' + txt.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<div class="s">Sem detalhes nas fontes.</div>');
    const cert = Object.entries(W.itens || {}).find(([, i]) => i[0] === 'Certificado de ' + m.name + ' γ');
    if (cert) {
      const cid = +cert[0];
      const pecas = W.armaduras.filter(p => ((p.crafting || {}).materials || []).some(x => x.item.id === cid));
      const conj = [...new Set(pecas.map(p => (p.armorSet || {}).name).filter(Boolean))];
      if (pecas.length) h += '<div class="h2" style="margin-top:18px;font-size:12px">Equipamento <span style="text-transform:none">γ</span></div><p class="tip">A armadura <b>' + esc(conj.join(', ')) + '</b> (' + pecas.length + ' peças) precisa do ' +
        '<a class="lnk" data-a="onde" data-id="' + cid + '">' + esc(cert[1][0]) + '</a>, ligado a esta versão.</p>';
    }
  }
  return h + '<div class="aprox">Fontes: Monster Hunter Wiki (o que muda, recompensas e missões), traduzido por mim.</div>';
}
function linhasMissao(ms) {
  return '<table class="hz missoes"><tr><th>Nível</th><th>Missão <span class="s" style="text-transform:none;letter-spacing:0">(nome em inglês)</span></th><th>Tipo</th><th>Onde</th></tr>' +
    ms.map(q => {
      const area = (q[4] || '').replace(/\|/g, '').trim();
      const loc = MAPA_CURTO[area] || area;
      return '<tr><td style="white-space:nowrap"><b style="color:var(--gold3)">' + esc(q[1].replace('HR', 'Alta').replace('LR', 'Baixa')) + '</b></td><td class="n">' + esc(q[3]) + '</td><td class="s">' + (MISSAO_TIPO[q[2]] || esc(q[2])) + ' · ' + (MISSAO_LOCAL[q[0]] || esc(q[0])) + '</td><td class="s">' + esc(loc) + '</td></tr>';
    }).join('') + '</table>';
}

/* ---------- Recompensas: tudo o que o monstro dá ---------- */
const ordemGrupo = g => /^Hunt/.test(g) ? 0 : g === 'Carves' ? 1 : /^Carves \(Rotten/.test(g) ? 2 : /^Carve/.test(g) ? 3 : /^Break/.test(g) ? 4 : /^Wound/.test(g) ? 5 : /^Investigation/.test(g) ? 6 : /^Gathered/.test(g) ? 7 : 8;
function abaRecompensas(m) {
  const v = (W.versoes || {})[m.id];
  const todos = v ? Object.entries(v.d).filter(([g, l]) => l.length && !/Tempered/.test(g)) : [];
  const temBaixa = todos.some(([g]) => g.startsWith('B|'));
  const rank = temBaixa && T().recRank === 'B' ? 'B' : 'A';
  const grupos = todos.filter(([g]) => g.startsWith('B|') === (rank === 'B')).map(([g, l]) => [g.replace(/^B\|/, ''), l]).sort((a, b) => ordemGrupo(a[0]) - ordemGrupo(b[0]));
  if (!grupos.length) return '<div class="s">Sem dados de recompensas para este monstro.</div>';
  return (temBaixa ? '<div class="seg" style="margin-bottom:12px"><button class="' + (rank === 'A' ? 'on' : '') + '" data-a="recRank" data-k="A">Patente Alta</button><button class="' + (rank === 'B' ? 'on' : '') + '" data-a="recRank" data-k="B">Patente Baixa</button></div>' : '') +
    '<div class="s" style="margin-bottom:12px">Chance de cada material cair, por jeito de conseguir. Clique num material pra ver onde mais ele aparece. As recompensas extras do Aguerrido estão na aba Versões.</div>' +
    '<div class="recomp">' + grupos.map(([g, l]) => '<div class="cartao recomp-c"><div class="h2" style="font-size:12px;margin-bottom:6px">' + esc(fontePt(g)) + '</div>' + linhasDrop(l) + '</div>').join('') + '</div>' +
    '<div class="aprox">Fonte: Monster Hunter Wiki.</div>';
}

function abaStatus(m) {
  const linhas = (m.k.st || []).filter(r => STATUS_KIRA[r[0]] && r[0] !== 'Ride');
  if (!linhas.length) return '<div class="s">Sem dados de status para este monstro.</div>';
  const f = fraquezasMon(m, true);
  let h = '<div class="s" style="margin-bottom:12px">Quanto de status você precisa acumular para causar o efeito. A cada vez que funciona, o monstro fica mais resistente (coluna "sobe").</div>' +
    '<table class="hz"><tr><th>Status</th><th>Fraqueza</th><th>1ª vez</th><th>Sobe</th><th>Máximo</th><th>Dano</th></tr>';
  for (const r of linhas) {
    const k = STATUS_KIRA[r[0]];
    const mm = /(\d+)\s*\(\+(\d+)\)\s*→\s*(\d+)/.exec(r[1]) || [];
    h += '<tr><td><span style="display:flex;gap:8px;align-items:center"><img class="ic p" src="' + elImg(k) + '"><span class="n">' + ELEM[k].n + '</span></span></td><td>' + (f.lv[k] != null ? estrelas(f.lv[k]) : '<span class="s">—</span>') + '</td>' +
      '<td><b style="color:var(--gold3)">' + (mm[1] || '—') + '</b></td><td class="s">+' + (mm[2] || '0') + '</td><td class="s">' + (mm[3] || '—') + '</td><td class="s">' + (r[2] && r[2] !== '0' ? r[2] : '—') + '</td></tr>';
  }
  return h + '</table><div class="aprox">Dados: Kiranico. "Dano" = dano que o veneno ou a explosão causam.</div>';
}

function abaInfo(m) {
  const s = m.size || {};
  const cm = v => v ? fmt(v / 1) + ' cm' : '—';
  let h = '<div class="h2">Tamanho</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:22px">' +
    [['Coroa pequena', '≤ ' + cm(s.mini), 'coroa-small'], ['Média', cm(s.base), ''], ['Coroa de prata', '≥ ' + cm(s.silver), 'coroa-silver'], ['Coroa de ouro', '≥ ' + cm(s.gold), 'coroa-gold']].map(([n, v, ic]) =>
      '<div class="cartao" style="padding:10px 12px;text-align:center">' + (ic ? '<img src="' + imgUi(ic) + '" style="width:30px;height:30px;object-fit:contain">' : '<div style="height:30px"></div>') + '<div class="s">' + n + '</div><b style="color:var(--gold3)">' + v + '</b></div>').join('') + '</div>' +
    '<div class="h2">Onde encontrar</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px">' + (m.locations || []).map(l => '<span class="chip" style="cursor:default">' + esc(l.name) + '</span>').join('') + '</div>';
  if (m.features) h += '<div class="h2">Sobre ele</div><p class="tip" style="margin-bottom:22px">' + esc(m.features) + '</p>';
  if (m.tips) h += '<div class="h2">Dica do Guia de Campo <small>texto oficial do jogo</small></div><p class="tip">' + esc(m.tips) + '</p>';
  const v = (W.versoes || {})[m.id];
  if (v && v.q.length) h += '<div class="h2" style="margin-top:22px">Missões com ele <small>' + v.q.length + '</small></div>' + linhasMissao(v.q);
  return h;
}

ACOES.recRank = d => { T().recRank = d.k; salvar(); atualizar(); };
ACOES.verMonstro = d => { T().mon = +d.id; salvar(); render(); };
ACOES.abaMon = d => { T().aba = d.k; salvar(); atualizar(); };
ACOES.vidaV = d => { T().vida = +d.i; salvar(); atualizar(); };
ACOES.vidaJ = d => { T().jog = +d.i; salvar(); atualizar(); };
