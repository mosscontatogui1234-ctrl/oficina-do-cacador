'use strict';
/* =========================================================================
   MEUS AMULETOS — cadastrar os amuletos aleatórios ganhos nas missões
   ========================================================================= */

function amuletoNovo() { return { id: null, nome: '', rarity: 7, skills: [{ id: null, level: 1 }], slots: [] }; }
let AM = null; // amuleto sendo editado

function nomeAmuleto(a) {
  const hs = a.skills.filter(s => s.id).map(s => (G.hab.get(s.id) || {}).name + ' ' + s.level);
  return hs.length ? hs.join(' / ') : 'Amuleto sem habilidade';
}

TELAS.amuletos = () => {
  const t = T();
  if (!AM) {
    const sel = U.amuletos.find(a => a.id === t.amSel);
    AM = sel ? JSON.parse(JSON.stringify(sel)) : amuletoNovo();
  }
  const esq = '<div class="esq"><div class="in" style="display:flex;align-items:center;gap:12px"><div><div class="kick">Meus amuletos</div><div style="font:700 32px Cinzel;color:var(--gold3)">' + (U.amuletos.length ? U.amuletos.length + ' amuleto' + (U.amuletos.length > 1 ? 's' : '') : 'Nenhum ainda') + '</div></div><span class="grow"></span><button class="btn" data-a="amNovo">+ Cadastrar amuleto</button></div>' +
    '<div class="s in" style="--i:1">Os amuletos que você ganha nas missões 9★ e 10★ saem com habilidades sorteadas. Cadastre os seus aqui pra usar no Montador.</div>' +
    '<div class="lista in" style="--i:2" data-rola="lista-am">' + (U.amuletos.length ? U.amuletos.map(a => '<div class="linha ' + (a.id === AM.id ? 'on' : '') + '" data-a="amSel" data-id="' + a.id + '"><img class="ic" src="' + imgAmuleto(a.rarity) + '" style="width:40px;height:40px">' +
      '<div class="grow"><div class="n corta">' + esc(a.nome || nomeAmuleto(a)) + '</div><div class="s">Raridade ' + a.rarity + ' · ' + a.skills.map(s => esc((G.hab.get(s.id) || {}).name) + ' ' + s.level).join(' · ') + '</div></div>' +
      '<span class="decos">' + (a.slots || []).map(s => '<span class="deco e" title="' + (s.tipo === 'weapon' ? 'arma' : 'armadura') + '"><img src="' + imgUi('deco' + s.tam) + '"></span>').join('') + '</span></div>').join('')
      : '<div class="vazio-grande" style="margin-top:60px"><b>Nenhum amuleto cadastrado</b>Clique em "Cadastrar amuleto" e escolha as habilidades e os espaços que ele tem no jogo.</div>') + '</div></div>';

  const habs = W.habilidades.filter(h => h.kind === 'weapon' || h.kind === 'armor').slice().sort((a, c) => a.name.localeCompare(c.name));
  const opcoesHab = sel => '<option value="">— escolher —</option>' + habs.map(h => '<option value="' + h.id + '"' + (h.id === sel ? ' selected' : '') + '>' + esc(h.name) + ' (' + (h.kind === 'weapon' ? 'arma' : 'armadura') + ')</option>').join('');
  let dir = '<div class="h2">' + (AM.id ? 'Editar amuleto' : 'Cadastrar amuleto') + '</div>' +
    '<div class="campo"><label>Raridade</label><div class="seg">' + [5, 6, 7, 8].map(r => '<button class="' + (AM.rarity === r ? 'on' : '') + '" data-a="amRar" data-r="' + r + '"><img src="' + imgAmuleto(r) + '" style="width:18px;height:18px;vertical-align:-4px"> ' + r + '</button>').join('') + '</div></div>';
  AM.skills.forEach((s, i) => {
    const h = G.hab.get(s.id);
    dir += '<div class="campo"><label>Habilidade ' + (i + 1) + '</label><div style="display:flex;gap:8px"><select style="flex:1" data-in="amHab" data-i="' + i + '">' + opcoesHab(s.id) + '</select>' +
      '<select data-in="amNiv" data-i="' + i + '" style="width:90px">' + Array.from({ length: h ? h.max : 5 }, (_, k) => '<option value="' + (k + 1) + '"' + (s.level === k + 1 ? ' selected' : '') + '>Nível ' + (k + 1) + '</option>').join('') + '</select>' +
      (AM.skills.length > 1 ? '<button class="x" data-a="amTirarHab" data-i="' + i + '" title="Tirar">×</button>' : '') + '</div></div>';
  });
  if (AM.skills.length < 3) dir += '<button class="btn leve" data-a="amMaisHab" style="margin:-4px 0 12px">+ outra habilidade</button>';
  dir += '<div class="campo"><label>Espaços de joia</label>';
  AM.slots.forEach((s, i) => {
    dir += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><img src="' + imgUi('deco' + s.tam) + '" style="width:24px;height:24px">' +
      '<div class="seg">' + [1, 2, 3].map(n => '<button class="' + (s.tam === n ? 'on' : '') + '" data-a="amSlotTam" data-i="' + i + '" data-n="' + n + '">Tamanho ' + n + '</button>').join('') + '</div>' +
      '<div class="seg">' + [['armor', 'Armadura'], ['weapon', 'Arma']].map(([k, n]) => '<button class="' + (s.tipo === k ? 'on' : '') + '" data-a="amSlotTipo" data-i="' + i + '" data-k="' + k + '">' + n + '</button>').join('') + '</div>' +
      '<button class="x" data-a="amTirarSlot" data-i="' + i + '">×</button></div>';
  });
  if (AM.slots.length < 3) dir += '<button class="btn leve" data-a="amMaisSlot">+ espaço de joia</button>';
  dir += '</div><div class="campo"><label>Apelido (opcional)</label><input data-in="amNome" value="' + esc(AM.nome) + '" placeholder="' + esc(nomeAmuleto(AM)) + '"></div>' +
    '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn ouro" data-a="amSalvar">' + (AM.id ? 'Salvar alterações' : 'Cadastrar') + '</button>' + (AM.id ? '<button class="btn perigo" data-a="amApagar">Apagar</button>' : '') + '</div>';
  return '<div class="corpo">' + esq + '<div class="dir in" style="--i:2" data-rola="dir-am">' + dir + '</div></div>';
};

ACOES.amNovo = () => { AM = amuletoNovo(); T().amSel = null; atualizar(); };
ACOES.amSel = d => { T().amSel = d.id; AM = null; salvar(); atualizar(); };
ACOES.amRar = d => { AM.rarity = +d.r; atualizar(); };
ACOES.amMaisHab = () => { AM.skills.push({ id: null, level: 1 }); atualizar(); };
ACOES.amTirarHab = d => { AM.skills.splice(+d.i, 1); atualizar(); };
ACOES.amMaisSlot = () => { AM.slots.push({ tam: 1, tipo: 'armor' }); atualizar(); };
ACOES.amTirarSlot = d => { AM.slots.splice(+d.i, 1); atualizar(); };
ACOES.amSlotTam = d => { AM.slots[+d.i].tam = +d.n; atualizar(); };
ACOES.amSlotTipo = d => { AM.slots[+d.i].tipo = d.k; atualizar(); };
DIGITAR.amHab = (v, el) => { const s = AM.skills[+el.dataset.i]; s.id = v ? +v : null; const h = G.hab.get(s.id); if (h && s.level > h.max) s.level = h.max; atualizar(); };
DIGITAR.amNiv = (v, el) => { AM.skills[+el.dataset.i].level = +v; };
DIGITAR.amNome = v => { AM.nome = v; };
ACOES.amSalvar = () => {
  AM.skills = AM.skills.filter(s => s.id);
  if (!AM.skills.length) { AM.skills = [{ id: null, level: 1 }]; aviso('Escolha pelo menos uma habilidade'); atualizar(); return; }
  const novo = !AM.id;
  if (novo) AM.id = 'm' + novoId();
  if (!AM.nome.trim()) AM.nome = '';
  const copia = JSON.parse(JSON.stringify(AM));
  copia.nome = copia.nome || nomeAmuleto(copia);
  const i = U.amuletos.findIndex(a => a.id === AM.id);
  if (i >= 0) U.amuletos[i] = copia; else U.amuletos.unshift(copia);
  T().amSel = AM.id; AM = null;
  arrumarJoias(U.atual); salvar(); atualizar(); aviso(novo ? 'Amuleto cadastrado' : 'Amuleto atualizado');
};
ACOES.amApagar = () => {
  if (!AM.id || !confirm('Apagar este amuleto?')) return;
  U.amuletos = U.amuletos.filter(a => a.id !== AM.id);
  if (U.atual.amuleto && U.atual.amuleto.id === AM.id) U.atual.amuleto = null;
  AM = null; T().amSel = null; arrumarJoias(U.atual); salvar(); atualizar(); aviso('Amuleto apagado');
};
