// Oficina do Caçador — guarda o app no celular pra abrir rápido e sem internet.
// VERSAO e LISTA são preenchidas pelo montar-site.ps1.
const VERSAO = 'v1';
const CACHE = 'oficina-' + VERSAO;
const LISTA = ["./","index.html","manifest.json","instalar.js","css/celular.css","css/estilo.css","dados/amuletos.js","dados/armaduras.js","dados/armas.js","dados/conjuntos.js","dados/fontes.js","dados/habilidades.js","dados/joias.js","dados/kiranico.js","dados/locais.js","dados/monstros.js","dados/versao.js","fontes/Cinzel-500-latin-ext.woff2","fontes/Cinzel-500-latin.woff2","fontes/Cinzel-600-latin-ext.woff2","fontes/Cinzel-600-latin.woff2","fontes/Cinzel-700-latin-ext.woff2","fontes/Cinzel-700-latin.woff2","fontes/fontes.css","fontes/NotoSans-400-latin-ext.woff2","fontes/NotoSans-400-latin.woff2","fontes/NotoSans-500-latin-ext.woff2","fontes/NotoSans-500-latin.woff2","fontes/NotoSans-600-latin-ext.woff2","fontes/NotoSans-600-latin.woff2","fontes/NotoSans-700-latin-ext.woff2","fontes/NotoSans-700-latin.woff2","js/amuletos.js","js/armas.js","js/builds.js","js/calculo.js","js/escolher.js","js/iniciar.js","js/materiais.js","js/monstros.js","js/montador.js","js/nucleo.js","js/traducoes.js"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(LISTA)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('oficina-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // página: usa a guardada desta versão (tudo combina); versão nova chega pelo sw.js novo
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(c => c.match('index.html')).then(r => r || fetch(req)));
    return;
  }
  // resto: usa o guardado; se não tiver, baixa e guarda (imagens vão entrando conforme usa)
  e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }).then(r => r || fetch(req).then(resp => {
    if (resp.ok) c.put(req, resp.clone());
    return resp;
  }))));
});
