import type { NewLang } from "./tip";

/** Português (europeu). */
export const PT: NewLang = {
  ui: {
    hubTitle: "Romenos pelo mundo: a árvore da família, de qualquer lugar", diaspora: "Diáspora", home: "Início",
    hubLead: "Para os romenos que vivem fora da Roménia e para quem tem raízes romenas: a história da comunidade no país onde vives, como obter documentos romenos sem viajar, que arquivos existem aí e como fazer a árvore da família com os parentes que ficaram na Roménia.",
    hubDescription: "História da emigração, documentos romenos pedidos do estrangeiro e arquivos: um guia para as famílias com raízes romenas em Portugal e no mundo.",
    countries: "Europa e Israel", america: "Estados Unidos", canada: "Canadá", themes: "Páginas especiais", states: "Estados", provinces: "Províncias e territórios", cities: "Grandes cidades", regions: "Regiões",
    history: "Como os romenos chegaram aqui", where: "Onde vivem", docs: "Documentos romenos, pedidos daqui", records: "Arquivos e registos locais",
    community: "Comunidades e associações", steps: "Passo a passo: a árvore da família, à distância", related: "Ver também", otherLangs: "Esta página noutras línguas",
    titleCountry: (w) => `Raízes romenas ${w}: registos e árvore | Cartea Neamului`,
    descCountry: (w) => `Como os romenos chegaram ${w}, como pedir documentos romenos daqui, que arquivos usar e como fazer a árvore da família com os parentes.`,
    titleRegion: (w) => `Romenos ${w}: raízes, registos e árvore | Cartea Neamului`,
    titleRegionShort: (w) => `Romenos ${w}: raízes e registos | Cartea Neamului`,
    descRegion: (w, c) => `Os romenos ${w} (${c}): a comunidade, o consulado da Roménia, onde pedir documentos daqui e da Roménia e como fazer a árvore da família.`,
    citiesLine: (l) => `A maioria das famílias romenas vive em ${l}.`,
    docsSteps: ({ where, eu }) => [
      "Descobre primeiro que documento precisas e onde está: as certidões de nascimento, casamento e óbito são emitidas pelo registo civil da câmara municipal romena onde foram registadas; os livros com mais de 100 anos estão normalmente nos Arquivos Nacionais da Roménia, no serviço do distrito (județ).",
      `Se vives ${where}, tens três caminhos: o consulado da Roménia da tua área (marcação em econsulat.ro), um parente na Roménia a quem dás uma procuração (assinada no consulado), ou um pedido direto aos Arquivos Nacionais, por e-mail, para os livros antigos.`,
      eu
        ? `Para usar uma certidão romena ${where}, normalmente já não precisas de apostila: na União Europeia os documentos de registo civil circulam sem ela (Regulamento UE 2016/1191), e podes pedir um formulário multilingue que os acompanha.`
        : `Para usar uma certidão romena ${where}, precisas normalmente da apostila da Haia, aposta na Roménia pela prefeitura, e de uma tradução certificada.`,
      "Quando pedires um registo antigo, escreve tudo o que sabes: o nome (também na forma antiga ou estrangeira), o ano aproximado, a aldeia e a comuna da época. A página de cada localidade no Cartea Neamului mostra a que câmara e a que arquivo pertence a aldeia.",
      "Se tens cidadania romena, os registos feitos no estrangeiro (o nascimento de um filho, um casamento) são transcritos nos registos romenos através do consulado ou no registo civil na Roménia.",
    ],
    communityText: ({ where, icr }) => [
      `Os romenos que vivem ${where} encontram-se sobretudo em associações culturais, escolas de fim de semana e aulas de romeno para crianças. As associações registadas estão no site do Departamento para os Romenos de Todo o Mundo (dprp.gov.ro), e o consulado conhece normalmente as da tua cidade.`,
      ...(icr ? [`O Instituto Cultural Romeno tem uma delegação em ${icr}, com exposições, concertos e uma biblioteca.`] : []),
      "As melhores fontes para a história da família continuam a ser as pessoas: os mais velhos da comunidade lembram-se de que aldeias vieram as primeiras famílias e quem é parente de quem.",
    ],
    genealogySteps: [
      "Escreve o que já sabes: os nomes, as datas e os lugares dos teus pais e avós.",
      "Pergunta aos parentes mais velhos, também aos que ficaram na Roménia: uma videochamada com as fotografias antigas no ecrã traz muitos nomes de volta.",
      "Descobre a aldeia de onde vem a família e procura-a no Cartea Neamului: a câmara, o arquivo e os apelidos de lá.",
      "Pede os documentos de que precisas, na Roménia e no país onde vives (ver acima).",
      "Põe tudo numa só árvore que toda a família pode completar, esteja onde estiver.",
    ],
    ctaTitle: "Começa a árvore da família", ctaText: "Os primeiros 7 dias são gratuitos, sem cartão. Convidas os parentes na Roménia e no estrangeiro, e cada um acrescenta o que sabe.", ctaButton: "Começar a árvore da família →",
    fallback: "Esta página ainda não está disponível na tua língua, por isso é mostrada em inglês.", sources: "Fontes", localities: "Localidades na Roménia", names: "Apelidos romenos", guides: "Guias de genealogia",
    regionThin: "Ainda estamos a reunir informação sobre os romenos daqui. Entretanto, os passos abaixo valem em todo o país.",
  },
  x: {
    guide: (w) => `Como encontrar os antepassados romenos quando vives ${w}`, specifics: "Bom saber", missions: "Embaixada e consulados da Roménia", faq: "Perguntas frequentes",
    kind: { embassy: "Embaixada", consular: "Secção consular", cg: "Consulado-Geral", consulate: "Consulado" },
    missionsNote: (d) => `Verificado em fontes oficiais a ${d}. A área de cada consulado e o horário estão na página oficial:`,
    statsNote: "Os números da comunidade estão arredondados; os dados exatos são publicados por",
    price: (lei, local) => `Depois dos 7 dias gratuitos, o plano Basic custa ${local ?? lei} por ano${local ? ` (${lei})` : ""}.`,
    whatsapp: "Envia aos avós na Roménia pelo WhatsApp",
    whatsappText: (u) => `Estou a fazer a árvore da nossa família e preciso de vós: como se chamavam os vossos pais e avós e de que aldeia eram? Completamos juntos aqui: ${u}`,
  },
  romania: [
    "registos civis e paroquiais com mais de 100 anos, por distrito",
    "marcações e pedidos nos consulados da Roménia",
    "lista das embaixadas e consulados e a área de cada um",
    "associações de romenos no estrangeiro e programas para a diáspora",
  ],
  names: {
    italia: "Itália", spania: "Espanha", germania: "Alemanha", "marea-britanie": "Reino Unido", franta: "França", austria: "Áustria",
    belgia: "Bélgica", irlanda: "Irlanda", olanda: "Países Baixos", portugalia: "Portugal", suedia: "Suécia", danemarca: "Dinamarca",
    elvetia: "Suíça", grecia: "Grécia", cipru: "Chipre", israel: "Israel", "statele-unite": "Estados Unidos", canada: "Canadá",
    ucraina: "Ucrânia", norvegia: "Noruega", "republica-moldova": "Moldávia", serbia: "Sérvia", bulgaria: "Bulgária", turcia: "Turquia", luxemburg: "Luxemburgo",
  },
  countries: {
    portugalia: {
      where: "em Portugal", size: "dezenas de milhares de romenos", icr: "Lisboa",
      history: [
        "Os romenos chegaram a Portugal sobretudo nos anos 2000, para trabalhar na construção, na agricultura e no turismo, e a comunidade fixou-se à volta de Lisboa e no Algarve. Portugal é um dos países mais tranquilos para a diáspora, e muitos romenos abriram aqui o seu próprio negócio.",
        "Tal como em Espanha e em Itália, os nomes romenos aparecem muitas vezes mal escritos nos documentos locais (sem os sinais diacríticos ou com outra ordem dos nomes), o que convém saber quando procuras um parente nos registos portugueses.",
      ],
      records: ["arquivos portugueses digitalizados"],
      stats: "população estrangeira em Portugal, por nacionalidade",
      guide: [
        "Os romenos vieram para Portugal sobretudo no início dos anos 2000, para trabalhar na construção e na agricultura, e muitos fixaram-se na zona de Lisboa e no sul. Com eles vieram também muitos moldavos da República da Moldávia, com quem partilham muitas vezes as mesmas comunidades.",
        "Os documentos romenos pedem-se na secção consular da embaixada em Lisboa, com marcação em econsulat.ro. Para os livros antigos, os Arquivos Nacionais da Roménia também respondem a pedidos enviados por e-mail, com o nome, a aldeia e o ano aproximado.",
        "Para o lado português da família, os arquivos distritais digitalizaram muitos registos paroquiais e civis, que se podem consultar gratuitamente online. Os registos paroquiais portugueses são muito antigos, e alguns recuam até ao século XVI.",
        "Muitos romenos em Portugal voltaram para casa depois da crise de 2008, e outros ficaram e criaram aqui os filhos. Nestas famílias, os parentes estão divididos entre os dois países, e uma árvore comum, preenchida por cada um na sua língua, mantém a ligação e as datas importantes de todos.",
        "Para os registos antigos da Roménia, lembra-te da regra das regiões: na Transilvânia, no Banato e na Crișana o registo civil começa em 1895, na Moldávia romena e na Valáquia em 1865. Antes disso, os únicos livros são os das paróquias, guardados nos Arquivos Nacionais ou nas próprias paróquias; para os moldavos da República da Moldávia, os livros estão normalmente nos arquivos de Chișinău.",
      ],
      specifics: [
        "Os portugueses têm normalmente vários apelidos, o primeiro da mãe e o último do pai, por exemplo Maria Silva Costa. Nos registos antigos, os apelidos podem mudar de uma geração para a outra, por isso liga as pessoas pelos pais e padrinhos, não só pelo nome.",
        "Em Portugal, as certidões pedem-se à Conservatória do Registo Civil. Também se podem pedir online, e uma certidão de nascimento portuguesa tem muitas vezes, em averbamento, o casamento e o óbito, tal como os registos romenos.",
        "Nas crianças criadas em Portugal, os nomes romenos podem ganhar formas portuguesas: Ioana passa a Joana, Ion passa a João. Põe as duas formas na árvore, para que os parentes dos dois países reconheçam a mesma pessoa.",
        "Os registos paroquiais portugueses indicam muitas vezes, no batismo, também os nomes dos avós dos dois lados, e não só dos pais. Um único assento de batismo pode assim dar três gerações, o que torna o lado português da árvore invulgarmente fácil de seguir para trás.",
      ],
      faq: [
        { q: "Onde peço os documentos romenos em Portugal?", a: "Na secção consular da embaixada em Lisboa, com marcação em econsulat.ro." },
        { q: "É preciso apostila para os documentos romenos em Portugal?", a: "Não, para os documentos públicos de registo civil entre países da União Europeia; a pedido recebes um formulário multilingue que os acompanha." },
        { q: "Onde procuro a família portuguesa do meu companheiro ou da minha companheira?", a: "Nos registos paroquiais e civis digitalizados pelos arquivos distritais portugueses, que se consultam gratuitamente online." },
        { q: "O meu filho nasceu em Portugal. Precisa de documentos romenos?", a: "Se queres que tenha a cidadania e os documentos romenos, o nascimento é transcrito nos registos romenos, através da embaixada ou no registo civil na Roménia." },
        { q: "Posso fazer a árvore noutra língua que não o romeno?", a: "Sim, em português, inglês e nas outras línguas do site. Os parentes na Roménia preenchem a mesma árvore em romeno." },
        { q: "A minha família é da República da Moldávia. Onde procuro os registos antigos?", a: "Os livros paroquiais e civis antigos da Bessarábia estão normalmente na Agência Nacional dos Arquivos da República da Moldávia, em Chișinău. Os registos mais recentes pedem-se ao registo civil." },
      ],
    },
  },
  regions: {
    "pt/lisabona": {
      name: "Lisboa", where: "em Lisboa",
      notes: [
        "Lisboa e as cidades à volta têm muitos romenos chegados no início dos anos 2000, para trabalhar na construção, na agricultura e nos serviços, ao lado de muitos moldavos da República da Moldávia. Alguns voltaram para casa depois da crise de 2008, outros ficaram e criaram aqui os filhos.",
        "Os documentos romenos pedem-se na secção consular da embaixada em Lisboa, com marcação em econsulat.ro: certidões, procurações, transcrições e passaportes.",
        "Os documentos portugueses pedem-se à Conservatória do Registo Civil. Em Lisboa fica também o Arquivo Nacional da Torre do Tombo, uma das instituições mais antigas do género na Europa, que guarda também os registos paroquiais do distrito de Lisboa, muitos deles consultáveis online, gratuitamente.",
        "Os assentos de batismo portugueses indicam muitas vezes os nomes dos avós dos dois lados, por isso um único registo pode dar três gerações. Numa família mista romeno-portuguesa, o lado português da árvore pode assim recuar, muitas vezes, alguns séculos.",
        "Para os moldavos da República da Moldávia, os livros antigos estão normalmente em Chișinău, na Agência Nacional dos Arquivos. Para quem vem da Roménia, descobre primeiro a comuna e o distrito da aldeia; os registos com menos de 100 anos estão nas câmaras municipais, e os mais antigos nos Arquivos Nacionais, por distrito.",
        "Lisboa sempre foi uma cidade de partidas e chegadas, com um porto aberto ao mundo. As famílias mistas daqui têm muitas vezes parentes no Brasil, em Angola ou noutros países de língua portuguesa, e uma árvore comum pode reuni-los a todos, cada ramo preenchido por quem o conhece.",
        "Para as crianças criadas em Lisboa, que falam melhor português do que romeno, a árvore da família é um caminho fácil para a língua dos avós: os nomes das aldeias, as alcunhas, os ofícios antigos. Cada história posta na árvore é uma lição de romeno sem manual.",
        "Se precisas com urgência de um documento da Roménia, a procuração dada a um parente lá é normalmente o caminho mais rápido: assinas na embaixada, e o parente levanta o documento na câmara e envia-to pelo correio.",
      ],
    },
  },
};
