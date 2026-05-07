const fs = require('fs');
const path = require('path');
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

const DATA_FILE = path.join(__dirname, 'data', 'lists.generated.json');
const SEED_FILE = path.join(__dirname, 'data', 'lists.seed.json');

function loadData() {
  const file = fs.existsSync(DATA_FILE) ? DATA_FILE : SEED_FILE;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return data.lists.map((list) => ({ ...list, items: Array.isArray(list.items) ? list.items : [] }));
}

const lists = loadData();

const manifest = {
  id: 'org.rafa.imdb.staticlists',
  version: '1.0.0',
  name: 'Rafa — Listas IMDb',
  description: 'Catálogos estáticos gerados a partir de listas públicas do IMDb.',
  logo: 'https://www.imdb.com/favicon.ico',
  resources: ['catalog'],
  types: ['movie'],
  idPrefixes: ['tt'],
  catalogs: lists.map((list) => ({
    type: 'movie',
    id: list.id,
    name: list.name,
    extraSupported: ['skip'],
    extraRequired: []
  }))
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id, extra }) => {
  if (type !== 'movie') return Promise.resolve({ metas: [] });
  const list = lists.find((entry) => entry.id === id);
  if (!list) return Promise.resolve({ metas: [] });

  const skip = Number(extra && extra.skip ? extra.skip : 0);
  const limit = 100;
  const items = list.items.slice(skip, skip + limit);

  const metas = items.map((item) => ({
    id: item.id,
    type: 'movie',
    name: item.name || item.id,
    poster: item.poster || `https://images.metahub.space/poster/medium/${item.id}/img`,
    posterShape: 'poster',
    releaseInfo: item.year ? String(item.year) : undefined
  }));

  return Promise.resolve({ metas });
});

const port = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port });
console.log(`Addon rodando em http://127.0.0.1:${port}/manifest.json`);
