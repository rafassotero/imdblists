// =============================================================================
// SERVIDOR DO ADDON — v1.1.0 (com logs detalhados)
// =============================================================================

const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

const lists = require('./lib/lists');
const { fetchListItems } = require('./lib/imdb-scraper');
const cache = require('./lib/cache');

// IMPORTANTE: enquanto debugamos, mantemos cache curto pra invalidar rápido
const CACHE_TTL_MS = 30 * 60 * 1000;        // 30 minutos
const CATALOG_PAGE_SIZE = 100;

const manifest = {
  // Bumpado de 1.0.0 -> 1.1.0 pra Stremio invalidar resposta antiga em cache
  id: 'com.usuario.imdb-listas-curadas',
  version: '1.1.0',
  name: 'Listas IMDb Curadas',
  description:
    'Catálogos de cinema curados a partir de listas públicas do IMDb.',
  logo: 'https://m.media-amazon.com/images/G/01/imdb/images/social/imdb_logo.png',

  resources: ['catalog'],
  types: ['movie', 'series'],
  idPrefixes: ['tt'],

  catalogs: lists.map((list) => ({
    type: list.type || 'movie',
    id: list.id,
    name: list.name,
    extra: [
      { name: 'skip', isRequired: false },
    ],
  })),

  behaviorHints: {
    configurable: false,
    configurationRequired: false,
  },
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  console.log(`[catalog] PEDIDO recebido: type=${type} id=${id} skip=${extra?.skip || 0}`);

  const list = lists.find((l) => l.id === id);
  if (!list) {
    console.warn(`[catalog] lista desconhecida: ${id}`);
    return { metas: [] };
  }

  const expectedType = list.type || 'movie';
  if (type !== expectedType) {
    console.log(`[catalog] tipo errado: esperado ${expectedType}, recebido ${type}`);
    return { metas: [] };
  }

  let items;
  try {
    items = await cache.getOrFetch(
      `imdb-list:${list.listId}`,
      () => fetchListItems(list.listId),
      CACHE_TTL_MS
    );
    console.log(`[catalog] ${list.id} cache retornou ${items.length} itens`);
  } catch (err) {
    console.error(`[catalog] ERRO em ${list.id} (${list.listId}):`, err.message);
    return { metas: [] };
  }

  const filtered = items.filter((it) => it.type === expectedType);
  console.log(`[catalog] ${list.id} após filtro de tipo: ${filtered.length}`);

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

  console.log(`[catalog] ${list.id} retornando ${metas.length} metas pro Stremio`);

  // Cache curto durante debug (15 min). Depois pode voltar pra 6h.
  return {
    metas,
    cacheMaxAge: 15 * 60,
    staleRevalidate: 30 * 60,
    staleError: 24 * 60 * 60,
  };
});

const PORT = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port: PORT });

console.log('================================================================');
console.log(`Listas IMDb Curadas v${manifest.version}`);
console.log(`Rodando em http://127.0.0.1:${PORT}/manifest.json`);
console.log(`${manifest.catalogs.length} catálogos configurados`);
console.log('================================================================');
