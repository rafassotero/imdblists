// Cache simples em memória com TTL.
// Como roda em uma única instância, isso é suficiente.
// Sempre que o servidor reinicia (deploy novo, sleep do Render etc.) o cache
// zera e os primeiros requests refazem o scrape.

const store = new Map();
const inflight = new Map(); // dedupe de requests concorrentes pra mesma chave

async function getOrFetch(key, fetchFn, ttlMs) {
  const now = Date.now();
  const cached = store.get(key);
  if (cached && now - cached.time < ttlMs) {
    return cached.value;
  }

  // Se já tem alguém buscando esta mesma chave, espera o resultado dele
  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = (async () => {
    try {
      const value = await fetchFn();
      store.set(key, { value, time: Date.now() });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

function clear() {
  store.clear();
}

module.exports = { getOrFetch, clear };
