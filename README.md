# Listas IMDb Curadas — Addon do Stremio

Este projeto transforma suas listas públicas do IMDb em **catálogos do Stremio**, com nomes e ordem personalizados, sem o limite de 10 listas do Stremlist.

Ele expõe **22 catálogos**, um para cada lista, exatamente nesta ordem:

1. Contemporâneo
2. Faroeste
3. Máfia
4. Terror e Suspense
5. Ficção Científica e Fantasia
6. Thriller Político e Conspiração
7. Latino-Americano
8. Nacional
9. Nova Hollywood
10. Hollywood (Clássico e Film Noir)
11. Antiguidade, Religião e Idade Média
12. Nazismo
13. Japonês
14. Italiano (Neorrealismo, Pós-Guerra e Moderno)
15. Francês (Nouvelle Vague e Moderno)
16. Iraniano
17. URSS e Leste Europeu
18. Asiático
19. Africano
20. Indiano
21. Documentário
22. Mudo e vanguardas

---

## Como funciona, em uma frase

O addon lê suas listas públicas do IMDb a cada 6 horas, guarda os filmes/séries em memória, e responde aos pedidos do Stremio com os catálogos prontos. Quando você adiciona/remove um filme no IMDb, o catálogo no Stremio se atualiza na próxima vez que o cache expirar (em até 6 horas).

Não tem banco de dados, não tem login, não tem chave de API. É autocontido.

---

## O que você vai precisar

Três coisas, todas gratuitas:

1. **Uma conta no GitHub** — para guardar o código. https://github.com/signup
2. **Uma conta no Render** — para hospedar gratuitamente. https://render.com (pode logar com a conta do GitHub)
3. **O Stremio** já instalado.

Tempo total: **~15 minutos**, mesmo nunca tendo programado.

---

## Passo a passo do deploy

### Passo 1 — Subir o código pro GitHub

1. Vá em https://github.com/new
2. Em **Repository name**, coloque: `imdb-stremio-listas` (ou qualquer nome).
3. Marque como **Public**.
4. **Não** marque "Add a README file".
5. Clique em **Create repository**.
6. Na próxima tela, clique em **uploading an existing file** (link em destaque).
7. Arraste **todos os arquivos do projeto** (e a pasta `lib/` e `scripts/`) para a página. Importante: arraste o conteúdo, não a pasta inteira.
8. Em baixo, clique em **Commit changes**.

Pronto, seu código está no GitHub.

> 💡 **Dica:** Se a pasta `node_modules` aparecer no upload, **ignore ela** — não precisa subir, ela é regenerada no Render automaticamente.

### Passo 2 — Fazer o deploy no Render

1. Acesse https://dashboard.render.com/ e faça login.
2. Clique no botão azul **+ New** → **Web Service**.
3. Em **Source Code**, conecte sua conta do GitHub se ainda não conectou, e selecione o repositório `imdb-stremio-listas`.
4. Clique em **Connect**.
5. Na tela de configuração, **a maioria dos campos já vem preenchida** (porque o projeto tem um `render.yaml`). Confira:
   - **Name**: `imdb-stremio-listas` (ou o que preferir)
   - **Region**: a mais perto de você (Ohio funciona bem pro Brasil)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
6. Clique em **Create Web Service** lá no fim da página.
7. O Render vai começar o build. Espera ~3 minutos. Quando aparecer **Live** em verde no topo, está pronto.
8. **Copie a URL** que aparece no topo da página. Vai ser algo tipo:
   ```
   https://imdb-stremio-listas.onrender.com
   ```

### Passo 3 — Instalar no Stremio

A URL do **manifest** é a URL do Render + `/manifest.json`. Exemplo:

```
https://imdb-stremio-listas.onrender.com/manifest.json
```

**Para instalar:**

1. Abra o Stremio (desktop, web, ou mobile).
2. Vá em **Addons** (engrenagem no canto, ou o ícone de quebra-cabeças).
3. Clique em **Search**, **Community Addons**, ou **Add Addon**.
4. Cole a URL do manifest no campo de busca/instalação.
5. Clique em **Install**.

**Pronto.** Vá pra Discover ou Home: as 22 categorias vão aparecer.

> ⚠️ **Atenção ao primeiro acesso:** o plano grátis do Render coloca o serviço pra "dormir" depois de 15 minutos sem uso. Quando você abre o Stremio depois de muito tempo, a primeira categoria pode demorar **~30–50 segundos** pra carregar (o Render está acordando o serviço). Depois disso, todas as outras carregam em milissegundos. Se quiser eliminar essa latência, veja a seção **Hospedagem alternativa** abaixo.

---

## Como editar suas listas depois

Tudo que você precisa mudar fica no arquivo **`lib/lists.js`**. Você pode:

- **Mudar o nome** que aparece no Stremio: edite o campo `name`.
- **Mudar a ordem** dos catálogos: reordene os itens do array.
- **Adicionar uma lista nova**: copie uma linha, mude `id`, `name` e `listId`.
- **Remover uma lista**: apague a linha.

Depois de editar, é só:

1. Subir o arquivo modificado pro GitHub (ou editar direto pelo site do GitHub: clica no arquivo, no lápis, edita, "Commit").
2. O Render detecta a mudança e refaz o deploy automaticamente em ~2 minutos.
3. No Stremio, **desinstale e reinstale o addon** para ele puxar o novo manifest. (Só editar conteúdo das listas no IMDb não exige isso — só quando muda a estrutura aqui.)

---

## Adicionando sua Watchlist (`ls532356594`) depois

Se quiser incluir a watchlist como "Para Malu e Rafa assistir", abra `lib/lists.js` e adicione esta linha onde quiser na ordem:

```javascript
{ id: 'malu-rafa-assistir', name: 'Para Malu e Rafa assistir', listId: 'ls532356594' },
```

A watchlist do IMDb funciona como qualquer outra lista (ela tem um `ls...` também), desde que esteja **pública**.

---

## Estrutura do projeto (caso você queira mexer)

```
imdb-stremio-listas/
├── package.json              ← dependências e scripts
├── server.js                 ← ponto de entrada; monta o manifest
├── render.yaml               ← config de deploy do Render
├── Dockerfile                ← config opcional pra Docker (Fly.io, HF Spaces)
├── lib/
│   ├── lists.js              ← SUAS LISTAS (edite aqui)
│   ├── imdb-scraper.js       ← lê uma lista do IMDb
│   └── cache.js              ← cache em memória
└── scripts/
    └── check.js              ← teste rápido (npm run check)
```

---

## Rodar localmente (opcional, pra testar antes do deploy)

Se quiser testar na sua máquina antes de subir:

1. Instale o **Node.js 18 ou superior** (https://nodejs.org).
2. Abra o **PowerShell** ou **Prompt de Comando** na pasta do projeto.
3. Rode:
   ```bash
   npm install
   npm run check    # testa o scraper em 3 listas
   npm start        # sobe o servidor
   ```
4. No Stremio, instale o addon usando: `http://127.0.0.1:7000/manifest.json`

> ℹ️ Quando rodando localmente, só o Stremio na **mesma máquina** consegue usar o addon. Pra TV, celular, etc., precisa do deploy.

---

## Solução de problemas

**"O Render diz Build Failed"**
Quase sempre é versão de Node. Confira em **Settings → Environment** que `NODE_VERSION` é `18` ou `20`. Se quiser garantir, adicione `NODE_VERSION` = `20` em Environment Variables.

**"Os catálogos aparecem vazios no Stremio"**
- Verifique que a lista no IMDb está **pública** (https://www.imdb.com/list/lsXXX/edit → Privacy: Public).
- No painel do Render, abra **Logs** e veja se há mensagens de erro com o `listId`.
- Rode `npm run check` localmente pra ver o erro exato.

**"O Stremio diz que o addon está instalado mas não vejo as categorias na home"**
Vá em **Addons → Manage Addons** e confirma que ele está marcado como ativo. Depois, na home, role até embaixo — com 22 catálogos novos, eles podem ter ficado abaixo dos catálogos do Cinemeta.

**"Demora muito pra primeira categoria carregar"**
É o cold start do Render Free. Soluções: (a) aceitar a latência, (b) migrar pra Hugging Face Spaces (instruções abaixo), (c) usar um serviço como o cron-job.org pra fazer um ping a cada 10 min na URL do addon, mantendo-o acordado.

**"Quero atualizar o cache antes das 6 horas"**
Reinicie o serviço no Render: **Manual Deploy → Deploy latest commit**. Cache zera junto com o restart.

---

## Hospedagem alternativa: Hugging Face Spaces (sem cold start)

Se o cold start do Render incomodar, o Hugging Face Spaces tem uma free tier que dorme menos agressivamente:

1. Crie conta em https://huggingface.co/
2. **New Space** → SDK: **Docker** → Visibility: Public.
3. Conecte seu repositório do GitHub OU faça upload dos arquivos diretamente.
4. O Dockerfile já incluído no projeto será detectado automaticamente.
5. Ajuste a porta para 7860 — abra o `Dockerfile` e troque `ENV PORT=7000` por `ENV PORT=7860`. Faça o mesmo no `EXPOSE`.
6. Commit. Aguarde build. URL final: `https://SEU_USUARIO-NOME_DO_SPACE.hf.space/manifest.json`

---

## Por que esse caminho e não MDBList + AIOLists?

Esse projeto é uma **alternativa autocontida** ao caminho MDBList + AIOLists:

| Aspecto | MDBList + AIOLists | Este projeto |
|--|--|--|
| Custo | Grátis (com regra de inatividade de 120 dias) | Grátis |
| Configuração | 3 contas (IMDb, MDBList, AIOLists/ElfHosted) | 2 contas (GitHub, Render) |
| Você controla o código? | Não | **Sim** |
| Limite de listas | Sem limite | Sem limite |
| Renomear catálogos | Sim, no painel | Sim, editando `lists.js` |
| Risco de quebrar | Se MDBList ou AIOLists saírem do ar | Se o IMDb mudar o layout HTML |
| Esforço pra manter | Quase zero | Quase zero (commits raros) |

Os dois caminhos são válidos. Este aqui é mais "do it yourself", você tem o código, sem depender de serviços de terceiros entre você e o IMDb.

---

## Termos do IMDb e bom senso

O IMDb não tem API pública oficial. Este projeto faz scraping de páginas de listas **públicas** (acessíveis a qualquer um sem login). O cache de 6h existe pra evitar carga desnecessária no IMDb. **Não compartilhe a URL do seu addon publicamente** — embora ela não contenha credenciais (esse projeto não usa nenhuma), se muita gente usar a mesma instância gratuita, o Render pode te limitar.

Use com responsabilidade. Não é affiliated com o IMDb.

---

## Licença

MIT. Faça o que quiser.
