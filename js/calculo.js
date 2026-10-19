'use strict';
/* =========================================================================
   CÁLCULO DA BUILD — soma de habilidades, bônus de conjunto/grupo, defesa
   ========================================================================= */

const LOCAIS = ['arma', 'reserva', 'head', 'chest', 'arms', 'waist', 'legs', 'amuleto'];

function pegarAmuleto(ref) {
  if (!ref) return null;
  if (ref.meu) return U.amuletos.find(a => a.id === ref.id) || null;
  return G.amuleto.get(ref.id) || null;
}

// Espaços de joia de cada parte da build: [{tam, tipo:'weapon'|'armor'}]
function espacos(b, local) {
  if (local === 'arma' || local === 'reserva') {
    const a = G.armas.get(b[local]);
    return a ? (a.slots || []).map(t => ({ tam: t, tipo: 'weapon' })) : [];
  }
  if (local === 'amuleto') {
    const am = pegarAmuleto(b.amuleto);
    return am ? (am.slots || []).map(s => ({ tam: s.tam, tipo: s.tipo })) : [];
  }
  const p = G.pecas.get(b.pecas[local]);
  return p ? (p.slots || []).map(t => ({ tam: t, tipo: 'armor' })) : [];
}

function cabeJoia(joia, esp) { return joia && esp && joia.kind === esp.tipo && joia.slot <= esp.tam; }

// Tira joias que não cabem mais (ex.: trocou a peça)
function arrumarJoias(b) {
  b.joias = b.joias || {};
  for (const l of LOCAIS) {
    const es = espacos(b, l);
    const atual = b.joias[l] || [];
    b.joias[l] = es.map((e, i) => (cabeJoia(G.joias.get(atual[i]), e) ? atual[i] : null));
  }
}

function calcularBuild(b) {
  const soma = new Map(); // id -> {lv, fontes:[]}
  const add = (id, lv, fonte) => {
    if (!id || !lv) return;
    const s = soma.get(id) || { lv: 0, fontes: [] };
    s.lv += lv; s.fontes.push(fonte + (lv > 1 ? ' (' + lv + ')' : ''));
    soma.set(id, s);
  };
  const arma = G.armas.get(b.arma);
  const reserva = G.armas.get(b.reserva);
  if (arma) for (const s of arma.skills || []) add(s.skill.id, s.level, arma.name);
  let defBase = arma ? (arma.defenseBonus || 0) : 0, defMax = defBase;
  const res = { fire: 0, water: 0, thunder: 0, ice: 0, dragon: 0 };
  for (const [k] of PECAS) {
    const p = G.pecas.get(b.pecas[k]);
    if (!p) continue;
    for (const s of p.skills || []) add(s.skill.id, s.level, p.name);
    defBase += p.defense.base; defMax += p.defense.max;
    for (const e in res) res[e] += (p.resistances || {})[e] || 0;
  }
  const am = pegarAmuleto(b.amuleto);
  if (am) for (const s of am.skills) add(s.id, s.level, am.nome);
  for (const l of LOCAIS) {
    if (l === 'reserva') continue; // joias da arma reserva só valem quando ela estiver em uso
    for (const jid of (b.joias || {})[l] || []) {
      const j = G.joias.get(jid);
      if (j) for (const s of j.skills) add(s.skill.id, s.level, j.name);
    }
  }

  const habilidades = [], bonus = [];
  for (const [id, s] of soma) {
    const h = G.hab.get(id);
    if (!h) continue;
    if (h.kind === 'set' || h.kind === 'group') {
      const ranks = h.ranks.filter(r => r.setPiecesRequired).sort((a, c) => a.setPiecesRequired - c.setPiecesRequired);
      const ativos = ranks.filter(r => r.setPiecesRequired <= s.lv);
      const prox = ranks.find(r => r.setPiecesRequired > s.lv);
      bonus.push({ h, pecas: s.lv, ativos, prox, ranks });
    } else {
      habilidades.push({ h, lv: s.lv, max: h.max, fontes: s.fontes });
    }
  }
  habilidades.sort((a, c) => Math.min(c.lv, c.max) - Math.min(a.lv, a.max) || a.h.name.localeCompare(c.h.name));
  bonus.sort((a, c) => (c.ativos.length > 0) - (a.ativos.length > 0) || c.pecas - a.pecas);

  // habilidades só da arma reserva (para mostrar à parte)
  const daReserva = [];
  if (reserva) {
    for (const s of reserva.skills || []) daReserva.push({ h: G.hab.get(s.skill.id), lv: s.level });
    for (const jid of (b.joias || {}).reserva || []) { const j = G.joias.get(jid); if (j) for (const s of j.skills) daReserva.push({ h: G.hab.get(s.skill.id), lv: s.level }); }
  }
  return { arma, reserva, am, habilidades, bonus, defBase, defMax, res, daReserva };
}

// Descrição do nível atual de uma habilidade
function descNivel(h, lv) {
  const r = h.ranks.find(x => x.level === Math.min(lv, h.max)) || h.ranks[0];
  return (r && (r.description || r.name)) || h.description || '';
}

// Números da arma
function textoElemento(a) {
  if (!a || !a.elem) return null;
  return { tipo: a.elemTipo, nome: (ELEM[a.elemTipo] || {}).n || a.elemTipo, val: a.elem.damage.display, oculto: a.elem.hidden };
}
function barraAfiacao(a, alto) {
  const s = a && a.sharpness;
  if (!s) return '';
  const tot = AFIACAO.reduce((t, k) => t + (s[k] || 0), 0) || 1;
  const base = Math.max(tot, 400);
  return '<div class="sharp" style="' + (alto ? 'height:' + alto + 'px' : '') + '">' + AFIACAO.map((k, i) => s[k] ? '<i style="width:' + (s[k] / base * 100) + '%;background:' + AFIACAO_COR[i] + '"></i>' : '').join('') + '</div>';
}
