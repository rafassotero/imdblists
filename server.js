// =============================================================================
// SERVIDOR DO ADDON
// =============================================================================
// Sobe um servidor HTTP usando o stremio-addon-sdk.
//
// Endpoints expostos automaticamente pelo SDK:
//   GET /manifest.json               -> descritor do addon (Stremio lê isso)
//   GET /catalog/movie/<id>.json     -> conteúdo de cada catálogo
//   GET /                            -> página de instalação
// =============================================================================

const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

const lists = require('./lib/lists');
const { fetchListItems } = require('./lib/imdb-scraper');
const cache = require('./lib/cache');

// Quanto tempo ficamos com a lista em cache antes de refazer o scrape
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;        // 6 horas
const CATALOG_PAGE_SIZE = 100;                   // itens por "página" do Stremio

// -----------------------------------------------------------------------------
// MANIFEST
// -----------------------------------------------------------------------------
const manifest = {
  id: 'com.usuario.imdb-listas-curadas',
  version: '1.0.0',
  name: 'Listas IMDb Curadas',
  description:
    'Catálogos de cinema curados a partir de listas públicas do IMDb. ' +
    'Atualiza automaticamente quando você edita as listas no IMDb.',
  logo: 'https://m.media-amazon.com/images/G/01/imdb/images/social/imdb_logo.png',

  resources: ['catalog'],
  types: ['movie', 'series'],
  idPrefixes: ['tt'],

  // Cada lista do lib/lists.js vira um catálogo no Stremio.
  // A ORDEM aqui define a ordem na home/Discover do Stremio.
  catalogs: lists.map((list) => ({
    type: list.type || 'movie',
    id: list.id,
    name: list.name,
    extra: [
      { name: 'skip', isRequired: false },
    ],
  })),

  // Diz ao Stremio que metadados detalhados podem ser buscados no Cinemeta
  behaviorHints: {
    configurable: false,
    configurationRequired: false,
  },
};

// -----------------------------------------------------------------------------
// HANDLER DE CATÁLOGO
// -----------------------------------------------------------------------------
const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  const list = lists.find((l) => l.id === id);
  if (!list) {
    console.warn(`[catalog] lista desconhecida: ${id}`);
    return { metas: [] };
  }

  // Stremio só mostra catálogo se o tipo bater
  const expectedType = list.type || 'movie';
  if (type !== expectedType) {
    return { metas: [] };
  }

  let items;
  try {
    items = await cache.getOrFetch(
      `imdb-list:${list.listId}`,
      () => fetchListItems(list.listId),
      CACHE_TTL_MS
    );
  } catch (err) {
    console.error(`[catalog] erro em ${list.id} (${list.listId}):`, err.message);
    return { metas: [] };
  }

  // Filtra só itens do tipo certo (lista pode ter misturado movie+series)
  const filtered = items.filter((it) => it.type === expectedType);

  // Paginação ("skip" do Stremio)
  const skip = parseInt(extra?.skip || '0', 10) || 0;
  const page = filtered.slice(skip, skip + CATALOG_PAGE_SIZE);

  const metas = page.map((it) => ({
    id: it.imdbId,
    type: it.type,
    name: it.title,
    poster: it.poster || undefined,
    posterShape: 'poster',
    releaseInfo: it.year ? String(it.year) : undefined,
  }));

  // O Stremio cacheia esta resposta por este tempo. Mantemos consistente
  // com o nosso TTL pra evitar invalidação fora de hora.
  return {
    metas,
    cacheMaxAge: 6 * 60 * 60,
    staleRevalidate: 24 * 60 * 60,
    staleError: 7 * 24 * 60 * 60,
  };
});

// -----------------------------------------------------------------------------
// SOBE O SERVIDOR
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), { port: PORT });

console.log('================================================================');
console.log(`Listas IMDb Curadas — addon do Stremio`);
console.log(`Rodando em http://127.0.0.1:${PORT}/manifest.json`);
console.log(`${manifest.catalogs.length} catálogos configurados`);
console.log('================================================================');
