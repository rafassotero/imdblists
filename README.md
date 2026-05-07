# Rafa — Addon estático de listas IMDb para Stremio

Este projeto cria um addon de catálogo do Stremio com 22 listas públicas do IMDb, na ordem definida em `data/lists.seed.json`.

## Como funciona

- `data/lists.seed.json` guarda os nomes e URLs das listas do IMDb.
- `npm run build` baixa as páginas públicas do IMDb e gera `data/lists.generated.json` com os IDs `tt...` encontrados.
- `npm start` inicia o addon do Stremio.
- O manifesto fica em `/manifest.json`.

## Rodar localmente no Windows

Instale Node.js 18 ou superior. Depois, na pasta do projeto:

```bash
npm install
npm run build
npm start
```

Abra no navegador:

```text
http://127.0.0.1:7000/manifest.json
```

Para instalar no Stremio local, use:

```text
http://127.0.0.1:7000/manifest.json
```

Atenção: endereço local só funciona no mesmo computador. Para celular/TV, hospede em um serviço HTTPS.

## Hospedar de graça

Use Hugging Face Spaces com Docker:

1. Crie um Space novo.
2. Escolha SDK: Docker.
3. Envie estes arquivos.
4. O Space usará o `Dockerfile`.
5. Depois de publicado, instale no Stremio usando:

```text
https://SEU-USUARIO-SEU-SPACE.hf.space/manifest.json
```

## Atualizar as listas

Como esta é uma solução estática, novas alterações feitas no IMDb não entram automaticamente no Stremio.

Para atualizar:

```bash
npm run build
```

Depois suba novamente o arquivo `data/lists.generated.json` para a hospedagem.

## Observação importante

O IMDb não oferece uma API pública gratuita para esse uso. O script usa páginas públicas das listas. Se o IMDb mudar a estrutura das páginas, o gerador pode precisar de ajuste.
