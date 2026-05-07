// =============================================================================
// SCRAPER DO IMDb (v2 — com logs detalhados e fallback por regex)
// =============================================================================

const TIMEOUT_MS = 20000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function findListEdges(root) {
  const candidates = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const v of node) walk(v);
      return;
    }
    if (Array.isArray(node.edges) && node.edges.length > 0) {
      const first = node.edges[0];
      const item =
        first?.node?.listItem ||
        first?.listItem ||
        first?.node ||
        first;
      const id = item?.id || item?.const;
      if (typeof id === 'string' && id.startsWith('tt')) {
        candidates.push(node.edges);
      }
    }
    for (const k of Object.keys(node)) walk(node[k]);
  }
  walk(root);
  if (candidates.length === 0) return [];
  return candidates.reduce((a, b) => (b.length > a.length ? b : a));
}

function normalizeItem(rawNode) {
  const item =
    rawNode?.node?.listItem ||
    rawNode?.listItem ||
    rawNode?.node ||
    rawNode;
  if (!item) return null;
  const imdbId = item.id || item.const;
  if (!imdbId || !imdbId.startsWith('tt')) return null;

  const titleTypeId = item.titleType?.id || item.titleType;
  const seriesTypes = new Set(['tvSeries', 'tvMiniSeries', 'tvEpisode', 'tvSpecial']);
  const type = seriesTypes.has(titleTypeId) ? 'series' : 'movie';

  const title =
    item.originalTitleText?.text ||
    item.titleText?.text ||
    item.title ||
    imdbId;
  const year = item.releaseYear?.year || item.year || null;

  let poster = item.primaryImage?.url || item.image?.url || null;
  if (poster && poster.includes('._V1_')) {
    poster = poster.replace(
      /\._V1_[^.]*\.(jpg|jpeg|png)/i,
      '._V1_QL75_UY414_CR0,0,280,414_.jpg'
    );
  }
  return { imdbId, type, title, year, poster };
}

// Plano B — extrai IDs do HTML por regex.
function extractIdsFromHtml(html) {
  const matches = html.matchAll(/\/title\/(tt\d{7,})\//g);
  const seen = new Set();
  const ids = [];
  for (const m of matches) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      ids.push(m[1]);
    }
  }
  return ids;
}

async function fetchListItems(listId) {
  const url = `https://www.imdb.com/list/${listId}/?view=detail&sort=list_order,asc`;
  console.log(`[scraper] ${listId} fetching ${url}`);

  let res;
  try {
    res = await fetchWithTimeout(url, { headers: HEADERS });
  } catch (e) {
    console.error(`[scraper] ${listId} fetch FAILED: ${e.message}`);
    throw e;
  }

  console.log(`[scraper] ${listId} status=${res.status}`);
  if (!res.ok) {
    throw new Error(`IMDb retornou status ${res.status} para ${listId}`);
  }

  const html = await res.text();
  console.log(`[scraper] ${listId} html bytes=${html.length}`);

  // Plano A: __NEXT_DATA__
  const match = html.match(
    /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  console.log(`[scraper] ${listId} __NEXT_DATA__ presente=${!!match}`);

  if (match) {
    try {
      const data = JSON.parse(match[1]);
      const edges = findListEdges(data);
      console.log(`[scraper] ${listId} edges encontrados=${edges.length}`);
      if (edges.length > 0) {
        const items = edges.map(normalizeItem).filter(Boolean);
        const seen = new Set();
        const unique = [];
        for (const it of items) {
          if (seen.has(it.imdbId)) continue;
          seen.add(it.imdbId);
          unique.push(it);
        }
        console.log(`[scraper] ${listId} ✓ Plano A OK: ${unique.length} itens`);
        return unique;
      }
    } catch (e) {
      console.warn(`[scraper] ${listId} JSON parse erro: ${e.message}`);
    }
  }

  // Plano B: regex no HTML
  console.log(`[scraper] ${listId} tentando Plano B (regex)`);
  const ids = extractIdsFromHtml(html);
  console.log(`[scraper] ${listId} regex encontrou ${ids.length} IDs únicos`);

  if (ids.length === 0) {
    console.error(`[scraper] ${listId} NENHUM ID encontrado. Trecho do HTML:`);
    console.error(html.substring(0, 500));
    throw new Error(`Nenhum ID encontrado em ${listId} — IMDb pode estar bloqueando`);
  }

  console.log(`[scraper] ${listId} ✓ Plano B OK: ${ids.length} IDs`);
  return ids.map((id) => ({
    imdbId: id,
    type: 'movie',
    title: id,
    year: null,
    poster: null,
  }));
}

module.exports = { fetchListItems };
