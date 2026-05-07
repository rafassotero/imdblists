// Script de teste — roda com: npm run check
// Pega a primeira lista configurada e tenta extrair os itens.
// Útil pra confirmar que o scraper está funcionando antes de fazer deploy.

const lists = require('../lib/lists');
const { fetchListItems } = require('../lib/imdb-scraper');

(async () => {
  console.log('================================================================');
  console.log('Verificação rápida do scraper');
  console.log('================================================================');

  // Testa 3 listas: a primeira, uma do meio, e a última
  const samples = [
    lists[0],
    lists[Math.floor(lists.length / 2)],
    lists[lists.length - 1],
  ];

  for (const list of samples) {
    process.stdout.write(`\n→ ${list.name} (${list.listId}) ... `);
    try {
      const t0 = Date.now();
      const items = await fetchListItems(list.listId);
      const ms = Date.now() - t0;
      console.log(`OK ${items.length} itens em ${ms}ms`);
      items.slice(0, 3).forEach((it) =>
        console.log(`    • ${it.title}${it.year ? ` (${it.year})` : ''} [${it.imdbId}]`)
      );
      if (items.length > 3) console.log(`    ... e mais ${items.length - 3}`);
    } catch (e) {
      console.log('FALHOU');
      console.log(`    ${e.message}`);
    }
  }

  console.log('\n================================================================');
  console.log('Se as 3 listas voltaram com itens, está tudo certo pra fazer deploy.');
  console.log('================================================================');
})();
