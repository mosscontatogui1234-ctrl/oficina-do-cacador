'use strict';
/* =========================================================================
   NÚCLEO — dados do jogo, dados do usuário, telas e ações
   ========================================================================= */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => Math.round(n).toLocaleString('pt-BR');
const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- nomes e cores do jogo ---------- */
const TIPO_ARMA = {
  'great-sword': 'Espada Grande', 'long-sword': 'Espada Longa', 'sword-shield': 'Espada e Escudo', 'dual-blades': 'Lâminas Duplas',
  'hammer': 'Martelo', 'hunting-horn': 'Berrante de Caça', 'lance': 'Lança', 'gunlance': 'Lançarma', 'switch-axe': 'Transmachado',
  'charge-blade': 'Lâmina Dínamo', 'insect-glaive': 'Glaive Inseto', 'light-bowgun': 'Fuzilarco Leve', 'heavy-bowgun': 'Fuzilarco Pesado', 'bow': 'Arco'
};
const ORDEM_ARMAS = Object.keys(TIPO_ARMA);
const RAR_COR = [null, '#9a9a9a', '#f6f6f6', '#80ad38', '#45ae64', '#4cbdde', '#5a5ae0', '#7a6bd8', '#db6a42'];
const ELEM = {
  fire: { n: 'Fogo', img: 'el-fogo' }, water: { n: 'Água', img: 'el-agua' }, thunder: { n: 'Raio', img: 'el-raio' },
  ice: { n: 'Gelo', img: 'el-gelo' }, dragon: { n: 'Dragão', img: 'el-dragao' },
  poison: { n: 'Veneno', img: 'st-veneno' }, sleep: { n: 'Sono', img: 'st-sono' }, paralysis: { n: 'Paralisia', img: 'st-paralisia' },
  blastblight: { n: 'Explosão', img: 'st-explosao' }, stun: { n: 'Atordoar', img: 'st-atordoar' }, exhaust: { n: 'Exaustão', img: 'st-exaustao' }
};
const ELEMENTOS = ['fire', 'water', 'thunder', 'ice', 'dragon'];
const STATUS = ['poison', 'sleep', 'paralysis', 'blastblight'];
const EFEITO = { flash: 'Bomba de Luz', noise: 'Bomba Sônica', stun: 'Atordoar', exhaust: 'Exaustão', mount: 'Montaria', sonic: 'Bomba Sônica', dung: 'Bomba de Esterco' };
const PECAS = [['head', 'Cabeça', 'Elmo'], ['chest', 'Peito', 'Peitoral'], ['arms', 'Braços', 'Braços'], ['waist', 'Cintura', 'Cintura'], ['legs', 'Pernas', 'Pernas']];
const AFIACAO = ['red', 'orange', 'yellow', 'green', 'blue', 'white', 'purple'];
const AFIACAO_NOME = ['Vermelha', 'Laranja', 'Amarela', 'Verde', 'Azul', 'Branca', 'Roxa'];
const AFIACAO_COR = ['#c8342c', '#e0812a', '#e3cc38', '#58b247', '#3a86dd', '#f4f4f4', '#9d58d8'];
const ICONE_HAB = { affinity: 'affinity', attack: 'attack', defense: 'defense', element: 'element', gathering: 'gathering', group: 'group', handicraft: 'sharpness', health: 'health', item: 'item', offense: 'empower', ranged: 'ammo', set: 'set', stamina: 'stamina', utility: 'reinforce' };
const ESPECIE = { 'amphibian': 'Anfíbio', 'bird-wyvern': 'Serpe Pássaro', 'brute-wyvern': 'Serpe Bruta', 'cephalopod': 'Cefalópode', 'construct': 'Construto', 'demi-elder': 'Semi-Ancião', 'elder-dragon': 'Dragão Ancião', 'fanged-beast': 'Fera Presa', 'flying-wyvern': 'Serpe Voadora', 'leviathan': 'Leviatã', 'machine': 'Máquina', 'temnoceran': 'Temnocerano' };

/* ---------- imagens ---------- */
const imgUi = n => 'img/ui/' + n + '.png';
const imgMon = id => 'img/em/m' + id + '.webp';
const imgRender = id => 'img/render/' + id + '.webp';
const imgHab = hab => imgUi('sk-' + (ICONE_HAB[hab && hab.icon && hab.icon.kind] || 'reinforce'));
const imgPeca = (kind, r) => imgUi('a-' + kind + '-' + Math.min(8, Math.max(1, r || 1)));
const imgAmuleto = r => imgUi('charm-' + Math.min(8, Math.max(1, r || 1)));
const icArma = (tipo, rar, tam = 38) => '<span class="arma-ic" style="width:' + tam + 'px;height:' + tam + 'px;--m:url(../img/ui/w-' + tipo + '.webp);--c:' + (RAR_COR[rar] || '#ddd') + '"></span>';
const elImg = e => imgUi((ELEM[e] || {}).img || 'sk-reinforce');
const estrelas = n => '<i class="st">' + '★'.repeat(n) + '<b class="o">' + '★'.repeat(Math.max(0, 3 - n)) + '</b></i>';

/* ---------- dados do jogo, organizados ---------- */
const G = { armas: new Map(), pecas: new Map(), joias: new Map(), hab: new Map(), mon: new Map(), amuleto: new Map(), amuletos: [], conj: new Map() };

function prepararDados() {
  for (const h of W.habilidades) {
    h.max = Math.max(1, ...h.ranks.map(r => r.level));
    G.hab.set(h.id, h);
  }
  for (const a of W.armas) {
    // afiação máxima e ataque "de verdade"
    const s = a.sharpness;
    a.afiMax = -1;
    if (s) AFIACAO.forEach((k, i) => { if (s[k] > 0) a.afiMax = i; });
    a.elem = (a.specials || []).find(x => !x.hidden) || (a.specials || [])[0] || null;
    a.elemTipo = a.elem ? (a.elem.element || a.elem.status) : null;
    a.busca = semAcento(a.name + ' ' + TIPO_ARMA[a.kind] + ' ' + ((a.series || {}).name || '') + ' ' + (a.skills || []).map(x => x.skill.name).join(' '));
    G.armas.set(a.id, a);
  }
  for (const p of W.armaduras) {
    p.busca = semAcento(p.name + ' ' + ((p.armorSet || {}).name || '') + ' ' + (p.skills || []).map(x => x.skill.name).join(' '));
    G.pecas.set(p.id, p);
  }
  for (const j of W.joias) {
    j.busca = semAcento(j.name + ' ' + j.skills.map(x => x.skill.name).join(' '));
    G.joias.set(j.id, j);
  }
  for (const c of W.amuletos) {
    for (const r of c.ranks) {
      const id = 'c' + c.id + '-' + r.level;
      const am = { id, nome: r.name, rarity: r.rarity, skills: r.skills.map(s => ({ id: s.skill.id, level: s.level })), slots: [] };
      am.busca = semAcento(am.nome + ' ' + r.skills.map(s => s.skill.name).join(' '));
      G.amuleto.set(id, am);
      G.amuletos.push(am);
    }
  }
  for (const s of W.conjuntos) G.conj.set(s.id, s);
  for (const m of W.monstros) {
    m.k = (window.KIRANICO || {})[m.id] || { hz: [], st: [], ph: [] };
    G.mon.set(m.id, m);
  }
}

/* ---------- dados do usuário (builds, amuletos, preferências) ---------- */
const CHAVE = 'oficina-cacador-v1';
const Armazem = window.OFICINA ? {
  // No programa: arquivo "dados.json" na pasta Documentos\Oficina do Caçador
  ler() { try { return JSON.parse(OFICINA.ler() || 'null'); } catch (e) { return null; } },
  gravar(d) { OFICINA.gravar(JSON.stringify(d, null, 1)).catch(() => aviso('Não consegui salvar!')); }
} : {
  // No navegador (testes): guarda no próprio navegador
  ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { return null; } },
  gravar(d) { try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) { aviso('Não consegui salvar!'); } }
};
// ao fechar o programa, grava na hora o que estiver pendente
if (window.OFICINA) OFICINA.aoFechar(() => { clearTimeout(salvarTimer); return OFICINA.gravar(JSON.stringify(U, null, 1)); });
let U, salvarTimer = null;
function buildVazia() {
  return { id: null, nome: 'Build nova', alvo: 20, arma: null, reserva: null, pecas: {}, amuleto: null, joias: {} };
}
function carregarUsuario() {
  U = Armazem.ler() || {};
  U.builds = U.builds || [];
  U.amuletos = U.amuletos || [];
  U.atual = U.atual || buildVazia();
  U.prefs = Object.assign({ anim: true }, U.prefs || {});
  U.tela = Object.assign({ t: 'montador', mon: 20, aba: 'onde', vida: 0, jog: 0, armaTipo: 'long-sword', armaEl: '', armaOrdem: 'forca', armaSel: null, buildSel: null, amSel: null }, U.tela || {});
}
function salvar() { clearTimeout(salvarTimer); salvarTimer = setTimeout(() => Armazem.gravar(U), 250); }
const T = () => U.tela;

/* ---------- telas e ações ---------- */
const TELAS = {};   // nome -> função que devolve o HTML da tela
const ACOES = {};   // data-a="nome" -> função(dataset, elemento, evento)
const DIGITAR = {}; // data-in="nome" -> função(valor, elemento)

const MENU = [['montador', 'Montador', 'Montador', 'sk-reinforce'], ['monstros', 'Monstros', 'Monstros', 'sk-gathering'], ['armas', 'Melhores armas', 'Armas', 'sk-attack'], ['builds', 'Minhas builds', 'Builds', 'sk-set'], ['amuletos', 'Meus amuletos', 'Amuletos', 'charm-6']];
function topo() {
  return '<div class="topo"><div class="logo">OFICINA DO CAÇADOR</div><div class="nav">' +
    MENU.map(([k, n, curto, ic]) => '<button data-a="ir" data-t="' + k + '" class="' + (T().t === k ? 'on' : '') + '"><img class="nav-ic" src="' + imgUi(ic) + '"><span class="nl">' + n + '</span><span class="nc">' + curto + '</span></button>').join('') +
    '</div></div>';
}

function render() {
  const t = T().t;
  document.documentElement.dataset.anim = U.prefs.anim ? '1' : '0';
  $('#app').innerHTML = topo() + (TELAS[t] ? TELAS[t]() : '');
}
// redesenha sem repetir as animações de entrada
function atualizar() {
  const a = U.prefs.anim; U.prefs.anim = false;
  const rolagens = [...document.querySelectorAll('[data-rola]')].map(e => [e.dataset.rola, e.scrollTop]);
  render();
  rolagens.forEach(([k, v]) => { const e = document.querySelector('[data-rola="' + k + '"]'); if (e) e.scrollTop = v; });
  U.prefs.anim = a;
  document.documentElement.dataset.anim = '0';
}

ACOES.ir = d => { T().t = d.t; salvar(); render(); window.scrollTo(0, 0); };
const ehCelular = () => window.matchMedia('(max-width: 760px)').matches;

let avisoTimer;
function aviso(txt) {
  $('#aviso').innerHTML = '<div>' + esc(txt) + '</div>';
  clearTimeout(avisoTimer); avisoTimer = setTimeout(() => $('#aviso').innerHTML = '', 2200);
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const f = ACOES[el.dataset.a];
  if (f) { e.preventDefault(); e.stopPropagation(); f(el.dataset, el, e); }
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-in]');
  if (el && DIGITAR[el.dataset.in]) DIGITAR[el.dataset.in](el.value, el);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#janela').innerHTML) fecharJanela();
  // jeito de programa: sem atalhos de navegador
  const campo = /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName);
  if (e.key === 'F5' || e.key === 'F12' || e.key === 'F3' || e.key === 'F7' || (e.ctrlKey && /^[rRpPuUjJdDgGhHnNtTlLeE]$/.test(e.key) && !campo) || (e.ctrlKey && /^[+=\-0]$/.test(e.key)) || (e.altKey && /Arrow(Left|Right)/.test(e.key))) e.preventDefault();
  if (e.ctrlKey && (e.key === 'f' || e.key === 'F' || e.key === 'k' || e.key === 'K')) { e.preventDefault(); const b = document.querySelector('.busca'); if (b) b.focus(); }
});
// sem zoom com Ctrl + rodinha
window.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
// arrastar um arquivo pra janela não abre ele por cima do app
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());
