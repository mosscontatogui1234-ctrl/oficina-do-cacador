'use strict';
/* =========================================================================
   TRADUÇÕES dos dados em inglês (wiki/Kiranico) + arrumação dos dados de origem
   ========================================================================= */

const PEQUENO_PT = {
  'vespoid': 'Vespoidea', 'conga': 'Conga', 'blango': 'Blango', 'ceratonoth-male': 'Ceratonoth (macho)', 'ceratonoth-female': 'Ceratonoth (fêmea)',
  'dalthydon': 'Dalthydon', 'dalthydon-livestock': 'Dalthydon (rebanho)', 'bulaqchi': 'Bulaqchi', 'talioth': 'Talioth', 'baunos': 'Baunos',
  'gajios': 'Gajios', 'piragill': 'Piragill', 'harpios': 'Harpios', 'kranodath': 'Kranodath', 'comaqchi': 'Comaqchi', 'gelidron': 'Gelidron',
  'rafma': 'Rafma', 'porkeplume': 'Porkeplume', 'nerscylla-hatchling': 'Filhote de Nerscylla', 'guardian-seikret': 'Seikret Guardião',
  'omega-micros': 'Omega Micros', 'high-purrformance-barrel-puncher': 'Barril Socador (evento)'
};

// partes do corpo (para "Quebrar X" / "Entalhar X")
const PARTE_EN_PT = [
  ['Rear Power Unit', 'unidade de energia traseira'], ['Lg. Iceplate (Exposed)', 'placa de gelo grande (exposta)'], ['Abdominal Iceplate', 'placa de gelo da barriga'],
  ['Cranial Iceplate', 'placa de gelo da cabeça'], ['Tail Iceplate', 'placa de gelo da cauda'], ['Tail Hair', 'pelos da cauda'], ['Poison Spike', 'espinho venenoso'],
  ['Dorsal Fin', 'barbatana dorsal'], ['Forelegs/Hind Legs', 'patas dianteiras/traseiras'], ['Chest/Back', 'peito/costas'], ['Back/Tail', 'costas/cauda'],
  ['Left/Right Wingarm', 'braços-asa'], ['Severed Tail', 'cauda cortada'], ['Severed Part', 'parte cortada'], ['Forelegs', 'patas dianteiras'], ['Foreleg', 'pata dianteira'],
  ['Hind Legs', 'patas traseiras'], ['Hind Leg', 'pata traseira'], ['Wingarm', 'braço-asa'], ['Chainblade', 'correlâmina'], ['Wing', 'asa'], ['Head', 'cabeça'],
  ['Tail', 'cauda'], ['Horn', 'chifre'], ['Claw', 'garra'], ['Petals', 'pétalas'], ['Back', 'costas'], ['Leg', 'perna'], ['Arm', 'braço'], ['Mouth', 'boca'],
  ['Mantle', 'manto'], ['Belly', 'barriga'], ['Antenna', 'antena'], ['Chest', 'peito']
];
function partePt(s) {
  s = s.trim();
  let lado = '';
  let m = /^(Left|Right|L\.|R\.)\s+(.*)$/.exec(s); if (m) { lado = /^(Left|L\.)/.test(m[1]) ? ' esq.' : ' dir.'; s = m[2]; }
  let pos = '';
  m = /^(Front|Rear|Middle)\s+(Left|Right)?\s*(.*)$/.exec(s);
  if (m && !/Power Unit/.test(s)) { pos = { Front: ' dianteiro', Rear: ' traseiro', Middle: ' do meio' }[m[1]]; if (m[2]) lado = m[2] === 'Left' ? ' esq.' : ' dir.'; s = m[3]; }
  m = /^Gog\. Mat\. \((.*)\)$/.exec(s); if (m) return 'matéria Gogma (' + partePt(m[1].replace(/^L\./, 'Left').replace(/^R\./, 'Right')) + ')';
  const rom = (/\s+(I{1,3}|IV|V)$/.exec(s) || [''])[0]; if (rom) s = s.slice(0, -rom.length);
  const par = PARTE_EN_PT.find(([en]) => en === s);
  return (par ? par[1] : s.toLowerCase()) + pos + lado + rom;
}

// fontes: "Carves", "Break Head", "Extra Rewards (Tempered)"…
const FONTE_FIXA = {
  'Carves': 'Entalhar', 'Carving': 'Entalhar', 'Carves (Rotten)': 'Entalhar carcaça podre', 'Carving (Rotten Monster Carcass)': 'Entalhar carcaça podre',
  'Carves (Crystalized)': 'Entalhar carcaça cristalizada', 'Hunt Rewards': 'Recompensa da caçada', 'Target Rewards': 'Recompensa da caçada',
  'Wound Destruction Rewards': 'Destruir ferida', 'Wound Destroyed Reward': 'Destruir ferida', 'Wound Destroy Reward': 'Destruir ferida',
  'Tempered Wound Destruction Rewards': 'Destruir ferida (Aguerrido)', 'Extra Rewards (Tempered)': 'Recompensa extra (Aguerrido)',
  'Extra Rewards (Frenzied)': 'Recompensa extra (Frenético)', 'Extra Rewards': 'Recompensa extra', 'Special Rewards': 'Recompensa especial',
  'Investigation': 'Investigação', 'Investigations (Basic)': 'Investigação comum', 'Investigation (Basic)': 'Investigação comum',
  'Investigation (Rare)': 'Investigação rara', 'Investigation (Valuable)': 'Investigação valiosa', 'Gathered': 'Pegar do chão (o que ele derruba)',
  'Break': 'Quebrar parte', 'Gathering': 'Coleta', 'Carving Severed Tail': 'Entalhar cauda cortada', 'Carving (Severed Part)': 'Entalhar parte cortada'
};
function fontePt(s) {
  s = String(s || '').trim();
  if (FONTE_FIXA[s]) return FONTE_FIXA[s];
  // vários juntos ("Target RewardsCarvingBreaking Head")
  const pedacos = s.replace(/(?!^)(Target Rewards|Wound Destroy|Carving|Breaking |Break )/g, '|$1').split('|');
  if (pedacos.length > 1) return pedacos.map(fontePt).join(' · ');
  let m = /^Carve (.*?)( \(Rotten\))?$/.exec(s); if (m) return 'Entalhar ' + partePt(m[1]) + ' cortada' + (m[2] ? ' (podre)' : '');
  m = /^Break(?:ing)? (.*)$/.exec(s); if (m) return 'Quebrar ' + partePt(m[1]);
  return s;
}

// missões
const MISSAO_TIPO = { Assignment: 'Principal', Optional: 'Opcional', Event: 'Evento', Challenge: 'Desafio', Arena: 'Arena' };
const MISSAO_LOCAL = { Village: 'Vila', 'Gathering Hub': 'Salão de Reunião' };
const MAPA_CURTO = { Plains: 'Planícies Zéfiras', Forest: 'Floresta Escarlate', Basin: 'Bacia Oleídea', Cliffs: 'Escarpas Frígidas', Wyveria: 'Ruínas de Serperia', Hollow: 'Wounded Hollow (arena)', 'Wounded Hollow': 'Wounded Hollow (arena)' };

// o que muda no Arquiaguerrido (traduzido da Monster Hunter Wiki)
const AT_PT = {
  3: ['Os golpes de antes ficam mais rápidos e com combos novos.', 'Ganha um raio novo, de cima pra baixo, que ele usa pra levantar voo.',
    'Carregado, todo golpe físico deixa choques elétricos que explodem um pouco depois.', 'Os raios carregados criam explosões elétricas atrasadas onde acertam.',
    'Não mostra mais um ponto fraco depois do raio duplo.'],
  20: ['Os golpes de antes ficam bem mais rápidos, muitos com tempo ou jeito diferente.', 'Emenda vários golpes seguidos sem pausa, e cada um pode puxar outros.',
    'Tem golpes novos.', 'Sem estar carregado, absorve ataques de elemento nas correlâminas pra carregar mais rápido; carregado, só para se você bater com elemento nas correlâminas.',
    'Com pouca vida, começa a usar poderes de Guardião: muitos golpes passam a criar cristais (Wylkrystal), como o Arkveld Guardião.',
    'Usando os poderes de Guardião, ganha ainda mais golpes novos.', 'Depois disso, cura rápido as feridas que você não destruir logo.'],
  25: ['Os golpes de antes se movem muito mais e ficam mais agressivos.', 'Os véus de água aguentam muito mais dano.',
    'Com o véu ativo, faz ondas com mais frequência, que dão mais dano e empurram mais.', 'Tem golpes novos.'],
  26: ['Emenda os golpes com mais agressividade; o golpe de corpo pode vir duas vezes seguidas.', 'Já na terceira área usa golpes que antes eram só da área final.',
    'A névoa de gelo do tronco cria um redemoinho curto: não dá dano, mas acumula Congelamento rápido.', 'A explosão de gelo pra baixo solta uma segunda explosão de pingentes depois, que dá dano e atrapalha andar.',
    'Tem golpes novos.', 'Enrolado em estruturas, cria grupos de pingentes que explodem em volta dos jogadores.',
    'O ataque Nova carrega mais rápido e desmaia na certa se acertar; na área final, ainda solta pingentes explosivos do chão enquanto carrega.'],
  27: ['Os golpes de antes ficam mais rápidos, agressivos e com alcance maior.', 'Em chamas, solta uma aura que queima quem estiver perto o tempo todo (Adaptabilidade nível 2 anula).',
    'Só sai do estado em chamas se você forçar com dano.', 'Tem golpes novos.']
};

/* ---------- arrumar os dados de origem quando o app abre ---------- */
// materiais de monstro pequeno de Patente Baixa: a Kiranico só lista a Alta, então deduzo pelo nome
const PEQUENO_DEDUZIDO = {
  85: ['Monstros pequenos herbívoros (Ceratonoth, Dalthydon…)'], 86: ['bulaqchi'], 87: ['talioth'], 88: ['Monstros pequenos carnívoros (Talioth…)'],
  89: ['Dracoalados'], 454: ['piragill'], 456: ['kranodath'], 458: ['comaqchi'], 460: ['guardian-seikret'], 521: ['conga'], 523: ['vespoid'], 525: ['vespoid'], 559: ['dalthydon']
};
const PESCA = { 563: 1, 564: 1 };
function prepararFontes() {
  if (!W.fontes) return;
  // recompensas listadas na página do monstro que a página do material não tem (ex.: Mizutsune)
  const jaTem = new Map(Object.entries(W.fontes).map(([iid, f]) => [+iid, new Set((f.m || []).map(r => r[0]))]));
  for (const [mid, v] of Object.entries(W.versoes || {})) {
    for (const [g, linhas] of Object.entries(v.d || {})) {
      const baixa = g.startsWith('B|'), grupo = g.replace(/^B\|/, '');
      for (const [iid, chance] of linhas) {
        if (typeof iid !== 'number' || !W.fontes[iid] || jaTem.get(iid).has(+mid)) continue;
        const f = W.fontes[iid]; f.m = f.m || [];
        if (!f.m.some(r => r[0] === +mid && r[1] === grupo)) f.m.push([+mid, grupo, chance, baixa ? 'B' : 'A']);
      }
    }
  }
  for (const [iid, lista] of Object.entries(PEQUENO_DEDUZIDO)) {
    const f = W.fontes[iid]; if (!f || (f.p || []).length) continue;
    f.p = lista.map(s => [s, 'Entalhar / recompensa (Patente Baixa, deduzido pelo nome)', 0, 'B']);
  }
  for (const iid of Object.keys(PESCA)) { const f = W.fontes[iid]; if (f && !(f.o || []).length) f.o = [['Pesca', 'é de peixe — provavelmente vem pescando (as fontes não confirmam)']]; }
}
