'use strict';
/* =========================================================================
   MONTADOR (layout A: lista à esquerda, números e habilidades à direita)
   ========================================================================= */

function fraquezasMon(m, todas) {
  const lv = {};
  for (const w of m.weaknesses || []) {
    const k = w.element || w.status;
    if (k && !w.condition) lv[k] = Math.max(lv[k] || 0, w.level);
    else if (k && lv[k] == null) lv[k] = w.level;
  }
  const els = todas ? ELEMENTOS : ELEMENTOS.filter(e => lv[e]);
  const sts = STATUS.filter(e => lv[e] != null);
  return { lv, els, sts };
}
function chipsFraqueza(m, todas) {
  const f = fraquezasMon(m, todas);
  return '<div class="wk">' + [...f.els, ...f.sts].map(e => '<span class="' + (f.lv[e] ? '' : 'off') + '"><img src="' + elImg(e) + '">' + ELEM[e].n + ' ' + estrelas(f.lv[e] || 0) + '</span>').join('') + '</div>';
}

function linhaSlot(b, local, rotulo, conteudo) {
  const es = espacos(b, local);
  const js = (b.joias || {})[local] || [];
  const tipoEsc = local === 'arma' || local === 'reserva' ? 'arma' : local === 'amuleto' ? 'amuleto' : 'peca';
  const vazio = !conteudo.nome;
  return '<div class="slot ' + (vazio ? 'vazia' : '') + '" data-a="escolher" data-tipo="' + tipoEsc + '" data-local="' + local + '">' +
    '<span class="icone">' + conteudo.icone + '</span><span class="tp s">' + rotulo + '</span>' +
    '<div class="grow"><div class="n corta">' + (vazio ? 'Escolher…' : esc(conteudo.nome) + (conteudo.extra ? ' <span class="s">· ' + conteudo.extra + '</span>' : '')) + '</div>' +
    (conteudo.sub ? '<div class="s corta">' + conteudo.sub + '</div>' : '') + '</div>' +
    '<span class="decos">' + es.map((e, i) => {
      const j = G.joias.get(js[i]);
      return '<button class="deco ' + (j ? '' : 'e') + '" data-a="joia" data-local="' + local + '" data-i="' + i + '" title="' + (j ? esc(j.name) + ' — ' + esc(habsTexto(j.skills)) : 'Espaço vazio de tamanho ' + e.tam + ' (' + (e.tipo === 'weapon' ? 'joia de arma' : 'joia de armadura') + ')') + '"><img src="' + imgUi('deco' + e.tam) + '"></button>';
    }).join('') + '</span>' +
    (vazio ? '' : '<button class="x" data-a="tirar" data-local="' + local + '" title="Tirar">×</button>') + '</div>';
}

/* ---------- layout D: "Painel de caçada" — equipamento · habilidades · alvo ---------- */
TELAS.montador = () => {
  const b = U.atual;
  arrumarJoias(b);
  const c = calcularBuild(b);
  const m = G.mon.get(b.alvo) || G.mon.get(20);
  const a = c.arma, r = c.reserva, am = c.am;
  const el = textoElemento(a);
  const salva = b.id && U.builds.some(x => x.id === b.id);

  const st = (img, rot, val, extra) => '<div class="mt-stat"><div class="s"><img src="' + img + '">' + rot + '</div><div class="num">' + val + (extra ? '<em>' + extra + '</em>' : '') + '</div></div>';
  const topoB = '<div class="mt-topo in">' +
    '<input class="nome-build" data-in="nomeBuild" value="' + esc(b.nome) + '" spellcheck="false" title="Clique para mudar o nome">' +
    st(imgUi('sk-attack'), 'Ataque', a ? a.damage.display : '—') +
    st(imgUi('sk-affinity'), 'Afinidade', a ? (a.affinity > 0 ? '+' : '') + a.affinity + '%' : '—') +
    st(el ? elImg(el.tipo) : imgUi('sk-element'), el ? el.nome : 'Elemento', el ? el.val : '—') +
    st(imgUi('defense'), 'Defesa', c.defBase || '—', c.defMax > c.defBase ? 'até ' + c.defMax : '') +
    '<div class="mt-afi">' + (a && a.sharpness ? '<div class="s">Afiação · <b style="color:' + (AFIACAO_COR[a.afiMax] || '#fff') + '">' + (AFIACAO_NOME[a.afiMax] || '—') + '</b></div>' + barraAfiacao(a) : a ? '<div class="s">Arma de longa distância<br>(sem afiação)</div>' : '') + '</div>' +
    '<span class="grow"></span>' +
    '<button class="btn leve" data-a="buildNova">+ Nova build</button>' +
    '<button class="btn" data-a="matsBuild" title="Tudo o que precisa farmar pra esta build">Materiais</button>' +
    '<button class="btn ouro" data-a="buildSalvar">' + (salva ? 'Salvar alterações' : 'Salvar') + '</button></div>';

  const linhas = [
    linhaSlot(b, 'arma', 'Arma', a ? { icone: icArma(a.kind, a.rarity), nome: a.name, extra: TIPO_ARMA[a.kind], sub: habsTexto(a.skills) } : { icone: icArma(T().armaTipo, 1) }),
    linhaSlot(b, 'reserva', 'Reserva', r ? { icone: icArma(r.kind, r.rarity), nome: r.name, extra: TIPO_ARMA[r.kind], sub: habsTexto(r.skills) } : { icone: icArma(T().armaTipo, 1) }),
    ...PECAS.map(([k, rot]) => {
      const p = G.pecas.get(b.pecas[k]);
      return linhaSlot(b, k, rot, p ? { icone: '<img src="' + imgPeca(k, p.rarity) + '">', nome: p.name, sub: habsTexto(p.skills) } : { icone: '<img src="' + imgPeca(k, 1) + '" style="opacity:.35">' });
    }),
    linhaSlot(b, 'amuleto', 'Amuleto', am ? { icone: '<img src="' + imgAmuleto(am.rarity) + '">', nome: am.nome, sub: am.skills.map(s => esc((G.hab.get(s.id) || {}).name) + ' ' + s.level).join(' · ') } : { icone: '<img src="' + imgAmuleto(1) + '" style="opacity:.35">' })
  ];
  const colEquip = '<div class="mt-equip in" style="--i:1"><div class="h2">Equipamento</div><div class="equip" data-rola="equip">' + linhas.join('') + '</div></div>';

  return topoB + '<div class="corpo">' + colEquip +
    '<div class="mt-habs in" style="--i:2" data-rola="mt-habs">' + colunaHabilidades(c) + '</div>' +
    '<div class="mt-alvo in" style="--i:3" data-rola="mt-alvo">' + colunaAlvo(m, a) + '</div></div>';
};

function colunaHabilidades(c) {
  let h = '<div class="h2">Habilidades <small>' + c.habilidades.length + '</small></div>';
  if (!c.habilidades.length) h += '<div class="s vazio" style="padding:8px 0">Escolha arma, armadura, amuleto e joias pra ver as habilidades somadas aqui.</div>';
  for (const x of c.habilidades) {
    const ef = Math.min(x.lv, x.max), sobra = x.lv - x.max;
    h += '<div class="mt-hab" title="' + esc(descNivel(x.h, ef)) + '\n\nVem de: ' + esc(x.fontes.join(', ')) + '"><img src="' + imgHab(x.h) + '"><span class="grow">' + esc(x.h.name) +
      (sobra > 0 ? ' <span class="s" style="color:#e2846a">+' + sobra + ' sobrando</span>' : '') + '</span>' +
      '<b class="mt-nv">' + ef + '/' + x.max + '</b><span class="pips">' + Array.from({ length: x.max }, (_, i) => '<i class="' + (i < ef ? 'on' : '') + '"></i>').join('') + '</span></div>';
  }
  if (c.bonus.length) {
    h += '<div class="h2" style="margin-top:22px">Bônus de conjunto e grupo</div>';
    for (const bo of c.bonus) {
      const at = bo.ativos[bo.ativos.length - 1];
      const tipo = bo.h.kind === 'set' ? 'Conjunto' : 'Grupo';
      const falta = bo.prox ? ' — com ' + bo.prox.setPiecesRequired + ' peças: ' + esc(bo.prox.name || '') : '';
      h += '<div class="row" style="' + (at ? '' : 'opacity:.45') + '" title="' + esc(at ? at.description : (bo.prox || {}).description || '') + '"><img class="ic" src="' + imgHab(bo.h) + '"><div class="grow"><div class="n">' + esc(bo.h.name) + (at && at.name ? ' <span class="s">· ' + esc(at.name) + '</span>' : '') + '</div>' +
        '<div class="s">' + tipo + ' · ' + bo.pecas + ' peça' + (bo.pecas > 1 ? 's' : '') + falta + '</div></div>' + (at ? '<span class="ok">ATIVO</span>' : '') + '</div>';
    }
  }
  if (c.daReserva.length) {
    h += '<div class="h2" style="margin-top:22px">Só com a arma reserva</div>' +
      c.daReserva.filter(x => x.h).map(x => '<div class="row" style="padding:5px 0"><img class="ic p" src="' + imgHab(x.h) + '"><span class="grow s" style="color:#bdb6a8">' + esc(x.h.name) + '</span><span class="s">' + x.lv + '</span></div>').join('');
  }
  if (c.defBase) {
    h += '<div class="h2" style="margin-top:22px">Resistências</div><div style="display:flex;gap:16px;flex-wrap:wrap">' +
      ELEMENTOS.map(e => '<span style="display:flex;gap:6px;align-items:center"><img class="ic p" src="' + elImg(e) + '"><b style="color:' + (c.res[e] < 0 ? '#e2846a' : 'var(--gold3)') + '">' + (c.res[e] > 0 ? '+' : '') + c.res[e] + '</b></span>').join('') + '</div>';
  }
  return h;
}

function colunaAlvo(m, a) {
  const tipo = a ? a.kind : T().armaTipo;
  const col = tipoGolpe(tipo);
  const ce = a && a.elem ? COL_ELEM[a.elem.element] : undefined;
  const partes = partesDoMonstro(m).filter(p => p.nomeEn !== 'outras').sort((x, y) => y.base[col] - x.base[col]).slice(0, 4);
  let h = '<img class="mt-render" src="' + imgRender(m.id) + '">' +
    '<div style="position:relative"><div style="display:flex;gap:14px;align-items:center;margin-bottom:18px">' +
    '<img class="emb alvo" src="' + imgMon(m.id) + '" style="width:76px;height:76px" data-a="escolher" data-tipo="alvo" title="Trocar o monstro alvo">' +
    '<div><div class="kick">Caçando</div><div style="font:700 30px Cinzel;color:var(--gold3);line-height:1.1">' + esc(m.name) + '</div>' +
    '<button class="btn leve" style="padding:2px 0;margin-top:2px" data-a="escolher" data-tipo="alvo">Trocar monstro</button></div></div>' +
    '<div class="h2">Fraquezas</div>' + chipsFraqueza(m, false) +
    '<div class="h2" style="margin-top:20px">Onde bater <small>' + GOLPE_NOME[col] + (ce != null ? ' · ' + ELEM[a.elem.element].n.toLowerCase() : '') + '</small></div>';
  h += partes.length ? partes.map(p => '<div class="row"><span class="grow n">' + esc(p.nome) + '</span>' +
    (ce != null ? '<span class="s" style="display:flex;gap:4px;align-items:center"><img src="' + elImg(a.elem.element) + '" style="width:16px;height:16px">' + p.base[ce] + '</span>' : '') +
    '<b class="mt-hz' + (p.base[col] >= 45 ? ' hi' : '') + '">' + p.base[col] + '</b></div>').join('') : '<div class="s">Sem dados.</div>';
  if (a) {
    const l = armasContra(m, a.kind);
    const i = l.findIndex(x => x.a.id === a.id);
    if (i >= 0 && l[0].t > 0) {
      const nota = Math.round(l[i].t / l[0].t * 100);
      h += '<div class="h2" style="margin-top:20px">Sua arma contra ele</div><div class="row"><span class="grow">Nota entre as armas do mesmo tipo</span><b class="mt-nota">' + nota + '<small>/100</small></b></div>' +
        '<div class="s" style="margin-top:4px">' + (i === 0 ? 'É a melhor desse tipo contra ' + esc(m.name) + '.' : (i + 1) + 'ª de ' + l.length + '. A melhor é <a class="lnk" data-a="trocarMelhor" data-id="' + l[0].a.id + '">' + esc(l[0].a.name) + '</a>.') + '</div>';
    }
  }
  return h + '<button class="btn" style="margin-top:20px" data-a="irMonstro" data-id="' + m.id + '">Ver ficha completa</button></div>';
}
ACOES.trocarMelhor = d => { U.atual.arma = +d.id; arrumarJoias(U.atual); salvar(); atualizar(); aviso('Arma trocada pela melhor contra este monstro'); };

DIGITAR.nomeBuild = v => { U.atual.nome = v; salvar(); };
ACOES.tirar = d => {
  const b = U.atual;
  if (d.local === 'arma' || d.local === 'reserva') b[d.local] = null;
  else if (d.local === 'amuleto') b.amuleto = null;
  else delete b.pecas[d.local];
  arrumarJoias(b); salvar(); atualizar();
};
ACOES.buildNova = () => {
  const alvo = U.atual.alvo;
  U.atual = buildVazia(); U.atual.alvo = alvo;
  salvar(); render(); aviso('Build nova começada');
};
ACOES.buildSalvar = () => {
  const b = U.atual;
  if (!b.nome.trim()) b.nome = 'Build sem nome';
  if (!b.id) b.id = novoId();
  b.editado = Date.now();
  const i = U.builds.findIndex(x => x.id === b.id);
  const copia = JSON.parse(JSON.stringify(b));
  if (i >= 0) U.builds[i] = copia; else U.builds.unshift(copia);
  salvar(); atualizar(); aviso(i >= 0 ? 'Alterações salvas' : 'Build salva em Minhas builds');
};
