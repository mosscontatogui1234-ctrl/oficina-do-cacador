'use strict';
/* Começa o app depois que todos os arquivos foram lidos */
(function iniciar() {
  try {
    prepararDados();
    prepararFontes();
    carregarUsuario();
    render();
  } catch (e) {
    document.getElementById('app').innerHTML = '<div class="carregando" style="font:14px Noto Sans;color:#ff9c86;padding:40px">Erro ao abrir: ' + esc(e.message) + '</div>';
    console.error(e);
  }
})();
