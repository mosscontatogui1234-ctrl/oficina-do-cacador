'use strict';
/* =========================================================================
   MATERIAIS — o que cada arma/armadura pede e onde conseguir cada material
   Dados: W.fontes / W.pequenos / W.versoes / W.itens (dados/fontes.js)
   ========================================================================= */

const RANK_PT = { B: 'Patente Baixa', A: 'Patente Alta', M: 'Patente Mestre' };
const ITEM_COR = { white: '#e8e4dc', gray: '#9a9a9a', rose: '#e58fa6', pink: '#e58fa6', red: '#e2574c', orange: '#e8934a', yellow: '#e6cf4f', lemon: '#d9e05a', green: '#69b84f', moss: '#8aa646', emerald: '#3fb38a', sky: '#5fb8e0', blue: '#4b7fe0', ultramarine: '#5a6ae6', violet: '#9468e0', purple: '#9468e0', brown: '#a87a4f', beige: '#cdb894' };

/* ---------- item: nome, ícone ---------- */
const infoItem = id => (W.itens || {})[id] || null; // [nome pt, nome en, raridade, tipo do ícone, cor]
function nomeItem(id, reserva) { const i = infoItem(id); return i ? i[0] : (reserva || 'Item ' + id); }
function iconeItem(id, tam = 26) {
  const i = infoItem(id);
  if (!i || !i[3]) return '<span class="it-ic" style="width:' + tam + 'px;height:' + tam + 'px"></span>';
  return '<img class="it-ic" src="img/item/' + i[3] + '-' + (i[4] || 'white') + '.png" style="width:' + tam + 'px;height:' + tam + 'px" onerror="this.style.visibility=\'hidden\'">';
}

/* ---------- receitas ---------- */
function somarMats(mapa, lista, de) {
  for (const m of lista || []) {
    const x = mapa.get(m.item.id) || { id: m.item.id, nome: m.item.name, q: 0, de: new Set() };
    x.q += m.quantity; if (de) x.de.add(de); mapa.set(m.item.id, x);
  }
}
// "passo": o que custa esta arma (melhorar a partir da anterior ou fabricar)
// "zero": tudo desde o começo da árvore (para na primeira arma que dá pra fabricar direto)
function receitaArma(a, modo, mapa, de) {
  mapa = mapa || new Map();
  let z = 0, cur = a; const caminho = [];
  while (cur) {
    const c = cur.crafting || {};
    caminho.unshift(cur.name);
    const direto = c.craftable && (c.craftingMaterials || []).length;
    if (!c.previous || (modo === 'zero' && direto)) { somarMats(mapa, c.craftingMaterials, de); z += c.craftingZennyCost || 0; break; }
    somarMats(mapa, c.upgradeMaterials, de); z += c.upgradeZennyCost || 0;
    if (modo !== 'zero') break;
    cur = G.armas.get(c.previous.id);
  }
  const c = a.crafting || {};
  return { mapa, z, caminho, anterior: c.previous ? c.previous.name : null, alternativa: c.previous && c.craftable && (c.craftingMaterials || []).length ? c : null };
}
function receitaPeca(p, mapa, de) {
  mapa = mapa || new Map();
  const c = p.crafting || {};
  somarMats(mapa, c.materials, de);
  return { mapa, z: c.zennyCost || 0 };
}
const listaMats = mapa => [...mapa.values()].sort((a, b) => (infoItem(b.id) || [, , 0])[2] - (infoItem(a.id) || [, , 0])[2] || b.q - a.q);

function linhasMats(mapa, comFonte) {
  const l = listaMats(mapa);
  if (!l.length) return '<div class="s vazio" style="padding:6px 0">Nenhum material.</div>';
  return l.map(x => '<div class="mat" data-a="onde" data-id="' + x.id + '" title="Onde conseguir">' + iconeItem(x.id) +
    '<span class="grow corta">' + esc(nomeItem(x.id, x.nome)) + (comFonte ? '<span class="s corta" style="display:block">' + resumoFonte(x.id) + (x.de.size ? ' · para ' + esc([...x.de].join(', ')) : '') + '</span>' : '') + '</span>' +
    '<b class="mat-q">×' + x.q + '</b></div>').join('');
}

/* ---------- onde conseguir ---------- */
function fontesDe(id) { return (W.fontes || {})[id] || null; }
// resumo de uma linha: a melhor fonte
function resumoFonte(id) {
  const f = fontesDe(id);
  if (!f) return 'origem desconhecida';
  const mons = (f.m || []).filter(r => typeof r[0] === 'number' && !/Tempered/.test(r[1]));
  if (mons.length) {
    const nomes = [...new Set(mons.map(r => (G.mon.get(r[0]) || {}).name).filter(Boolean))];
    return nomes.slice(0, 3).join(', ') + (nomes.length > 3 ? ' +' + (nomes.length - 3) : '');
  }
  if ((f.p || []).length) return [...new Set(f.p.map(r => nomePequeno(r[0])))].slice(0, 3).join(', ');
  if ((f.c || []).length) return 'Coleta: ' + f.c.map(c => nomeLocal(c[0])).join(', ');
  if ((f.m || []).length) return 'Recompensa extra de monstro Aguerrido';
  if ((f.q || []).length) return 'Recompensa de missão';
  return 'origem desconhecida';
}
const nomeLocal = id => typeof id === 'number' ? ((W.locais.find(l => l.id === id) || {}).name || 'Mapa ' + id) : id;
function nomePequeno(slug) { return PEQUENO_PT[slug] || (W.pequenos || {})[slug] || slug; }

function janelaOnde(id, voltar) {
  const f = fontesDe(id) || {};
  const i = infoItem(id) || [nomeItem(id), '', 0];
  let h = '';
  if ((f.c || []).length) {
    h += '<div class="h2">Coleta no mapa</div>' +
      f.c.map(c => '<div class="onde-mon"><div class="grow"><div class="n">' + esc(nomeLocal(c[0])) + '</div><div class="s">Áreas ' + c[1].join(', ') + '</div></div></div>').join('') + '<div style="height:16px"></div>';
  }
  // monstros grandes, agrupados (sem repetir a mesma fonte)
  const porMon = new Map();
  for (const r of f.m || []) {
    const k = r[0]; if (!porMon.has(k)) porMon.set(k, []);
    const l = porMon.get(k); if (!l.some(x => x[1] === r[1] && x[2] === r[2] && x[3] === r[3])) l.push(r);
  }
  // os que só dão como recompensa extra de Aguerrido viram um bloco compacto
  const soExtra = [...porMon].filter(([, rs]) => rs.every(r => /Extra Rewards \(Tempered\)/.test(r[1])));
  for (const [k] of soExtra) porMon.delete(k);
  if (porMon.size) {
    h += '<div class="h2">Monstros grandes</div>';
    for (const [k, rs] of porMon) {
      const m = typeof k === 'number' ? G.mon.get(k) : null;
      rs.sort((a, b) => (a[3] === b[3] ? 0 : a[3] === 'A' ? -1 : 1) || b[2] - a[2]);
      h += '<div class="onde-mon">' + (m ? '<img class="emb" src="' + imgMon(m.id) + '" data-a="irMonstro" data-id="' + m.id + '" title="Ver ' + esc(m.name) + '">' : '<span class="emb" style="width:40px;height:40px"></span>') +
        '<div class="grow"><div class="n">' + esc(m ? m.name : k) + '</div><div class="onde-chips">' +
        rs.map(r => '<span class="fch' + (/Tempered/.test(r[1]) ? ' agu' : '') + '" title="' + RANK_PT[r[3]] + '">' + esc(fontePt(r[1])) + ' <b>' + r[2] + '%</b>' + (r[3] === 'B' ? ' <i>baixa</i>' : '') + '</span>').join('') + '</div></div></div>';
    }
  }
  if (soExtra.length) {
    const chances = [...new Set(soExtra.flatMap(([, rs]) => rs.map(r => r[2])))].sort((a, b) => a - b);
    h += '<div class="h2" style="margin-top:16px">Recompensa extra de Aguerrido <small>' + (chances.length > 1 ? chances[0] + '–' + chances[chances.length - 1] : chances[0]) + '% em qualquer um destes</small></div><div class="brasoes-mini">' +
      soExtra.map(([k]) => { const m = typeof k === 'number' ? G.mon.get(k) : null; return m ? '<img class="emb" src="' + imgMon(m.id) + '" title="' + esc(m.name) + '" data-a="irMonstro" data-id="' + m.id + '">' : '<span class="fch">' + esc(k) + '</span>'; }).join('') + '</div>';
  }
  if ((f.p || []).length) {
    const porP = new Map();
    for (const r of f.p) { if (!porP.has(r[0])) porP.set(r[0], []); porP.get(r[0]).push(r); }
    h += '<div class="h2" style="margin-top:16px">Monstros pequenos</div>';
    for (const [k, rs] of porP) h += '<div class="onde-mon"><div class="grow"><div class="n">' + esc(nomePequeno(k)) + '</div><div class="onde-chips">' +
      rs.map(r => '<span class="fch" title="' + RANK_PT[r[3]] + '">' + esc(fontePt(r[1])) + (r[2] ? ' <b>' + r[2] + '%</b>' : '') + (r[3] === 'B' && r[2] ? ' <i>baixa</i>' : '') + '</span>').join('') + '</div></div></div>';
  }
  if ((f.q || []).length) {
    h += '<div class="h2" style="margin-top:16px">Missões <small>nome em inglês</small></div><div class="onde-chips">' + f.q.map(q => '<span class="fch">' + esc(q) + '</span>').join('') + '</div>';
  }
  if ((f.o || []).length) {
    h += '<div class="h2" style="margin-top:16px">Outros</div>' + f.o.map(o => '<div class="s">' + esc(fontePt(o[0])) + ': ' + esc(o[1]) + '</div>').join('');
  }
  if (!h) h = '<div class="vazio-grande" style="margin:30px auto"><b>Origem não encontrada</b>' + (/certificate|coin|voucher/.test(i[3] || '') ?
    'Parece recompensa de missão de evento ou desafio, mas as fontes (wiki e Kiranico) não dizem qual.' : 'As fontes (wiki e Kiranico) não dizem onde conseguir este material. Pode ser troca com os povoados ou recompensa de evento.') + '</div>';

  $('#janela').innerHTML = '<div class="fundo-j" data-a="fecharJanela"><div class="jan peq">' +
    '<div class="jan-topo"><div class="t">' + (voltar ? '<button class="btn leve" data-a="matsVoltar">← Voltar</button>' : '') + iconeItem(id, 40) +
    '<div class="grow"><h3>' + esc(i[0]) + '</h3><div class="s">Raridade ' + (i[2] || '?') + ' · onde conseguir</div></div>' +
    '<button class="btn leve" data-a="fecharJanela" data-forca="1">Fechar<span class="so-pc"> (Esc)</span></button></div></div>' +
    '<div class="jan-lista" style="padding:14px 22px 20px">' + h +
    '<div class="aprox">Chance = de cair numa vez. "Aguerrido" (roxo) = só sai do monstro Aguerrido. Fontes: Monster Hunter Wiki e Kiranico.</div></div></div></div>';
}
let matsVoltar = null;
ACOES.onde = d => { janelaOnde(+d.id, !!matsVoltar); };
ACOES.matsVoltar = () => { if (matsVoltar) matsVoltar(); };
ACOES.irMonstro = d => { matsVoltar = null; fecharJanela(); T().t = 'monstros'; T().mon = +d.id; salvar(); render(); };

/* ---------- materiais da build inteira (Montador) ---------- */
function janelaMatsBuild() {
  const b = U.atual, mapa = new Map(); let z = 0;
  const modo = T().matModo || 'passo';
  for (const local of ['arma', 'reserva']) {
    const a = G.armas.get(b[local]);
    if (a) z += receitaArma(a, modo, mapa, local === 'arma' ? 'arma' : 'reserva').z;
  }
  for (const [k, rot] of PECAS) { const p = G.pecas.get(b.pecas[k]); if (p) z += receitaPeca(p, mapa, rot.toLowerCase()).z; }
  matsVoltar = janelaMatsBuild;
  $('#janela').innerHTML = '<div class="fundo-j" data-a="fecharJanela"><div class="jan peq">' +
    '<div class="jan-topo"><div class="t"><h3>Materiais da build</h3><span class="grow"></span><button class="btn leve" data-a="fecharJanela" data-forca="1">Fechar<span class="so-pc"> (Esc)</span></button></div>' +
    '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div class="seg"><button class="' + (modo === 'passo' ? 'on' : '') + '" data-a="matModoJ" data-k="passo">Armas: só o último passo</button><button class="' + (modo === 'zero' ? 'on' : '') + '" data-a="matModoJ" data-k="zero">Armas: do zero</button></div>' +
    '<span class="s">' + listaMats(mapa).length + ' materiais · ' + fmt(z) + ' z</span></div></div>' +
    '<div class="jan-lista" style="padding:10px 22px 20px">' + (mapa.size ? linhasMats(mapa, true) : '<div class="vazio-grande" style="margin:30px auto"><b>Build vazia</b>Escolha arma e armadura pra ver o que precisa farmar.</div>') +
    '<div class="aprox">Clique num material pra ver onde conseguir. O amuleto e as joias não entram na conta.</div></div></div></div>';
}
ACOES.matsBuild = () => janelaMatsBuild();
ACOES.matModoJ = d => { T().matModo = d.k; salvar(); janelaMatsBuild(); };
ACOES.matModo = d => { T().matModo = d.k; salvar(); atualizar(); if ($('#janela .cartao-cel')) abrirCartaoCel(); };
const _fecharAntes = fecharJanela;
fecharJanela = function () { matsVoltar = null; _fecharAntes(); };

/* ---------- bloco de materiais (cartão da arma / peça) ---------- */
function blocoMatsArma(a) {
  const modo = T().matModo || 'passo';
  const r = receitaArma(a, modo);
  matsVoltar = null;
  return '<div class="h2" style="margin-top:16px">Materiais<span class="acoes"><span class="seg"><button class="' + (modo === 'passo' ? 'on' : '') + '" data-a="matModo" data-k="passo">Este passo</button><button class="' + (modo === 'zero' ? 'on' : '') + '" data-a="matModo" data-k="zero">Do zero</button></span></span></div>' +
    '<div class="s" style="margin:-4px 0 6px">' + (modo === 'zero' ? (r.caminho.length > 1 ? 'Caminho: ' + r.caminho.map(esc).join(' → ') : 'Fabricar direto') : (r.anterior ? 'Melhorar a partir de ' + esc(r.anterior) : 'Fabricar direto')) + ' · ' + fmt(r.z) + ' z</div>' +
    linhasMats(r.mapa, false) +
    (modo === 'passo' && r.alternativa ? '<div class="s" style="margin-top:6px">Também dá pra fabricar direto (sem a anterior): ' + fmt(r.alternativa.craftingZennyCost) + ' z + ' + r.alternativa.craftingMaterials.map(m => esc(nomeItem(m.item.id, m.item.name)) + ' ×' + m.quantity).join(', ') + '</div>' : '');
}
