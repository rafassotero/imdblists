// =============================================================================
// CONFIGURAÇÃO DAS SUAS LISTAS
// =============================================================================
// Este é o único arquivo que você precisa editar para mudar os nomes, a ordem
// ou os IDs das listas.
//
// Cada item tem 3 campos:
//   - id       : um identificador curto e único (sem espaços, sem acentos).
//                Funciona como uma "etiqueta" interna do Stremio. Pode mudar
//                se quiser, mas se mudar a versão precisa ser bumpada.
//   - name     : o nome que vai aparecer no Stremio (com acentos, espaços etc.)
//   - listId   : o ID da sua lista no IMDb (a parte "ls..." da URL).
//   - type     : (opcional) "movie" ou "series". Padrão: "movie".
//                Cada catálogo do Stremio só pode ter um tipo. Se uma lista
//                tem filmes E séries misturados, escolha o tipo predominante
//                (o outro tipo simplesmente não aparece nesse catálogo).
//
// A ORDEM dos itens neste array é a ordem em que eles aparecem no Stremio.
// =============================================================================

module.exports = [
  { id: 'contemporaneo',                name: 'Contemporâneo',                                  listId: 'ls4172161350' },
  { id: 'faroeste',                     name: 'Faroeste',                                       listId: 'ls4172319884' },
  { id: 'mafia',                        name: 'Máfia',                                          listId: 'ls4172359848' },
  { id: 'terror-suspense',              name: 'Terror e Suspense',                              listId: 'ls4172379637' },
  { id: 'ficcao-cientifica-fantasia',   name: 'Ficção Científica e Fantasia',                   listId: 'ls4172341327' },
  { id: 'thriller-politico',            name: 'Thriller Político e Conspiração',                listId: 'ls4172167109' },
  { id: 'latino-americano',             name: 'Latino-Americano',                               listId: 'ls4172377816' },
  { id: 'nacional',                     name: 'Nacional',                                       listId: 'ls4172161134' },
  { id: 'nova-hollywood',               name: 'Nova Hollywood',                                 listId: 'ls4172608376' },
  { id: 'hollywood-classico-noir',      name: 'Hollywood (Clássico e Film Noir)',               listId: 'ls4172377815' },
  { id: 'antiguidade-religiao-medieval',name: 'Antiguidade, Religião e Idade Média',            listId: 'ls4172313774' },
  { id: 'nazismo',                      name: 'Nazismo',                                        listId: 'ls4172377813' },
  { id: 'japones',                      name: 'Japonês',                                        listId: 'ls4172167483' },
  { id: 'italiano',                     name: 'Italiano (Neorrealismo, Pós-Guerra e Moderno)',  listId: 'ls4172326282' },
  { id: 'frances',                      name: 'Francês (Nouvelle Vague e Moderno)',             listId: 'ls4172377817' },
  { id: 'iraniano',                     name: 'Iraniano',                                       listId: 'ls4172360021' },
  { id: 'urss-leste-europeu',           name: 'URSS e Leste Europeu',                           listId: 'ls4172313713' },
  { id: 'asiatico',                     name: 'Asiático',                                       listId: 'ls4172378638' },
  { id: 'africano',                     name: 'Africano',                                       listId: 'ls4172360026' },
  { id: 'indiano',                      name: 'Indiano',                                        listId: 'ls4172327187' },
  { id: 'documentario',                 name: 'Documentário',                                   listId: 'ls4172390709' },
  { id: 'mudo-vanguardas',              name: 'Mudo e vanguardas',                              listId: 'ls4172332777' },
];
