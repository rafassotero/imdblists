const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, '..', 'data', 'lists.seed.json');
const OUT_FILE = path.join(__dirname, '..', 'data', 'lists.generated.json');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniqById(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function cleanText(value) {
  if (!value) return '';
  return value
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractItems(html) {
  const ids = [];
  const re = /\/title\/(tt\d+)\//g;
  let match;
  while ((match = re.exec(html)) !== null) {
    ids.push({ id: match[1], index: match.index });
  }

  const unique = [];
  const seen = new Set();
  for (const entry of ids) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    unique.push(entry);
  }

  return unique.map(({ id, index }) => {
    const before = html.slice(Math.max(0, index - 2500), index + 2500);
    const nameMatch =
      before.match(/"titleText"\s*:\s*\{\s*"text"\s*:\s*"([^"]+)"/) ||
      before.match(/"originalTitleText"\s*:\s*\{\s*"text"\s*:\s*"([^"]+)"/) ||
      before.match(/alt="([^"]+)"/) ||
      before.match(/aria-label="([^"]+)"/);
    const yearMatch =
      before.match(/"releaseYear"\s*:\s*\{\s*"year"\s*:\s*(\d{4})/) ||
      before.match(/\((\d{4})\)/);

    return {
      id,
      name: cleanText(nameMatch ? nameMatch[1] : id),
      year: yearMatch ? Number(yearMatch[1]) : undefined,
      poster: `https://images.metahub.space/poster/medium/${id}/img`
    };
  });
}

function nextPageUrl(baseUrl, page) {
  const url = new URL(baseUrl);
  url.searchParams.set('sort', 'list_order,asc');
  url.searchParams.set('st_dt', '');
  url.searchParams.set('mode', 'detail');
  url.searchParams.set('page', String(page));
  return url.toString();
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} em ${url}`);
  }
  return response.text();
}

async function buildList(list) {
  console.log(`\nBaixando: ${list.name}`);
  const all = [];

  for (let page = 1; page <= 20; page += 1) {
    const url = nextPageUrl(list.url, page);
    const html = await fetchHtml(url);
    const items = extractItems(html);
    const before = all.length;
    all.push(...items);
    const unique = uniqById(all);
    all.length = 0;
    all.push(...unique);

    console.log(`  página ${page}: ${items.length} encontrados; total único: ${all.length}`);

    if (items.length === 0 || all.length === before) break;
    await sleep(1200);
  }

  return { ...list, items: all };
}

async function main() {
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  const lists = [];

  for (const list of seed.lists) {
    try {
      lists.push(await buildList(list));
    } catch (error) {
      console.error(`Erro em ${list.name}: ${error.message}`);
      lists.push({ ...list, items: [] });
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), lists }, null, 2));
  console.log(`\nArquivo gerado: ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
