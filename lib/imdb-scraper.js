// =============================================================================
// SCRAPER DO IMDb
// =============================================================================
// Estratégia: páginas de lista do IMDb são feitas em Next.js. Os dados ficam
// embutidos numa tag <script id="__NEXT_DATA__">. A gente baixa o HTML, extrai
// esse JSON e procura recursivamente o array de itens da lista.
//
// Se o IMDb mudar a estrutura, a busca recursiva ainda tende a achar o array
// certo (procura o maior array de "edges" cujos nós têm IDs começando com tt).
// =============================================================================

const TIMEOUT_MS = 15000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// -----------------------------------------------------------------------------
// fetch com timeout (usa o fetch nativo do Node 18+)
// -----------------------------------------------------------------------------
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// -----------------------------------------------------------------------------
// Acha o array de "edges" da lista dentro do __NEXT_DATA__.
// Estratégia: busca em largura por TODOS os arrays chamados "edges" cujo
// primeiro elemento tem um ID começando com "tt". Retorna o MAIOR
// (que é quase certamente a lista propriamente dita, e não uma seção lateral).
// -----------------------------------------------------------------------------
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
  // O maior array de edges com IDs tt é a lista
  return candidates.reduce((a, b) => (b.length > a.length ? b : a));
}

// -----------------------------------------------------------------------------
// Normaliza um item do __NEXT_DATA__ para o formato que o Stremio quer
// -----------------------------------------------------------------------------
function normalizeItem(rawNode) {
  const item =
    rawNode?.node?.listItem ||
    rawNode?.listItem ||
    rawNode?.node ||
    rawNode;
  if (!item) return null;

  const imdbId = item.id || item.const;
  if (!imdbId || !imdbId.startsWith('tt')) return null;

  // Tipo: filme ou série
  const titleTypeId = item.titleType?.id || item.titleType;
  const seriesTypes = new Set([
    'tvSeries',
    'tvMiniSeries',
    'tvEpisode',
    'tvSpecial',
  ]);
  const type = seriesTypes.has(titleTypeId) ? 'series' : 'movie';

  // Título: prefere o original (mais "cinéfilo")
  const title =
    item.originalTitleText?.text ||
    item.titleText?.text ||
    item.title ||
    imdbId;

  const year = item.releaseYear?.year || item.year || null;

  // Pôster: redimensiona pra um tamanho razoável
  let poster = item.primaryImage?.url || item.image?.url || null;
  if (poster && poster.includes('._V1_')) {
    poster = poster.replace(
      /\._V1_[^.]*\.(jpg|jpeg|png)/i,
      '._V1_QL75_UY414_CR0,0,280,414_.jpg'
    );
  }

  return { imdbId, type, title, year, poster };
}

// -----------------------------------------------------------------------------
// Função principal: dado um listId (ex: "ls4172161350"), retorna os itens.
// -----------------------------------------------------------------------------
async function fetchListItems(listId) {
  const url = `https://www.imdb.com/list/${listId}/?view=detail&sort=list_order,asc`;
  const res = await fetchWithTimeout(url, { headers: HEADERS });

  if (!res.ok) {
    throw new Error(`IMDb retornou status ${res.status} para ${listId}`);
  }

  const html = await res.text();

  // Extrai o JSON do __NEXT_DATA__
  const match = html.match(
    /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match) {
    throw new Error(
      `Não encontrei __NEXT_DATA__ em ${listId}. ` +
      `O IMDb pode ter mudado o layout ou a lista é privada.`
    );
  }

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch (e) {
    throw new Error(`__NEXT_DATA__ inválido em ${listId}: ${e.message}`);
  }

  const edges = findListEdges(data);
  if (edges.length === 0) {
    throw new Error(
      `Nenhum item encontrado em ${listId}. ` +
      `Lista vazia, privada, ou mudança de layout do IMDb.`
    );
  }

  const items = edges.map(normalizeItem).filter(Boolean);

  // Dedupe (caso o JSON tenha o mesmo título referenciado em mais de um lugar)
  // mantendo a primeira ocorrência (preserva ordem da lista)
  const seen = new Set();
  const unique = [];
  for (const it of items) {
    if (seen.has(it.imdbId)) continue;
    seen.add(it.imdbId);
    unique.push(it);
  }

  return unique;
}

module.exports = { fetchListItems };
