import type { BisericaCatalog } from "./ro";

/** Français. Versets de la Bible Louis Segond 1910. */
export const frBiserica: BisericaCatalog = {
  Church: {
    meta: {
      title: "L’histoire de l’Église persécutée",
      description: "L’Église du Christ des apôtres à aujourd’hui : martyrs, réformateurs, la Bible en roumain et héros de la foi des prisons communistes.",
    },
    label: "Histoire de l’Église",
    title: "L’Église du Christ, persécutée depuis le commencement jusqu’à aujourd’hui",
    toc: "Sommaire",
    heroesChip: "Héros de la foi",
    bibleChip: "La Bible en roumain",
    filterLabel: "Que montrer",
    all: "Le monde entier",
    onlyRo: "Seulement en Roumanie",
    today: "aujourd’hui",
    ourLand: "en Roumanie",
    quoted: "« {text} »",
    heroesLabel: "Des histoires qui donnent de la force",
    heroesTitle: "Héros de la foi des prisons communistes",
    bibleLabel: "La Parole dans notre langue",
    bibleTitle: "Comment la Bible est arrivée en langue roumaine",
    influenceTitle: "Ce que la Bible a changé dans la vie des Roumains",
    endTitle: "Nous aussi, nous sommes une page de cette histoire",
    endText: "L’Église n’est pas un bâtiment ni une institution, mais tous ceux qui ont reçu le Christ, depuis Étienne jusqu’aux grands-parents qui priaient en cachette, et jusqu’à nous. La lumière est passée de main en main pendant deux mille ans, souvent au prix de la vie. Maintenant elle est entre nos mains : la garder allumée, lire la Parole et prier pour ceux qui sont persécutés aujourd’hui.",
    readJohn: "Lire l’Évangile selon Jean",
    note: "Les versets sont tirés de la Bible Louis Segond (1910). Là où il ne s’agit que d’une tradition, le texte le dit.",
    intro: "Le Seigneur Jésus n’a pas promis à ses disciples une vie facile, mais que son Église ne serait pas vaincue. De Jérusalem jusqu’à aujourd’hui, chaque fois qu’on a voulu éteindre la lumière de l’Évangile, elle s’est rallumée ailleurs. Voici quelques-uns de ceux qui ont payé leur foi de leur liberté ou de leur vie, et quelques-uns des moments où la Parole est revenue entre les mains des gens simples.",
    promise: {
      text: "Et moi, je te dis que tu es Pierre, et que sur cette pierre je bâtirai mon Église, et que les portes du séjour des morts ne prévaudront point contre elle.",
      ref: "Matthieu 16:18",
    },
    eras: {
      apostoli: {
        name: "L’Église des apôtres",
        intro: "Après la résurrection du Seigneur, quelques pêcheurs et gens simples de Galilée ont porté la bonne nouvelle à Jérusalem, puis dans tout le monde romain. La persécution a commencé presque aussitôt : d’abord de la part des chefs juifs, puis de Rome. Mais la persécution les a dispersés, et ceux qui étaient dispersés ont porté la Parole plus loin.",
        verse: {
          text: "Ceux qui avaient été dispersés allaient de lieu en lieu, annonçant la bonne nouvelle de la parole.",
          ref: "Actes 8:4",
        },
        w: {
          w1: {
            name: "Étienne, le premier martyr",
            years: "vers 34",
            place: "Jérusalem",
            text: "L’un des sept diacres de l’Église de Jérusalem. Après avoir rendu témoignage au Christ devant le sanhédrin, il fut emmené hors de la ville et lapidé. Un jeune homme nommé Saul, qui allait devenir l’apôtre Paul, assistait à sa mort.",
            quote: "Seigneur, ne leur impute pas ce péché ! (Actes 7:60)",
          },
          w2: {
            name: "Jacques, fils de Zébédée",
            years: "vers 44",
            place: "Jérusalem",
            text: "Le frère de l’apôtre Jean, le premier des douze apôtres à mourir pour le Christ : le roi Hérode Agrippa le fit mourir par l’épée (Actes 12:2).",
          },
          w3: {
            name: "Les chrétiens de Rome sous Néron",
            years: "64",
            place: "Rome",
            text: "Après le grand incendie de Rome, l’empereur Néron accusa les chrétiens. L’historien romain Tacite écrit que certains furent livrés aux bêtes, d’autres crucifiés ou brûlés comme des torches dans les jardins de l’empereur. Selon l’ancienne tradition de l’Église, les apôtres Pierre (crucifié) et Paul (décapité) moururent eux aussi à Rome à cette époque, sous Néron.",
          },
          w4: {
            name: "L’apôtre André",
            years: "Ier siècle",
            place: "Scythie Mineure (l’actuelle Dobroudja)",
            text: "Une ancienne tradition, rapportée par Origène et Eusèbe, dit qu’André, le frère de Pierre, fut envoyé prêcher l’Évangile en Scythie. C’est pourquoi les Roumains le considèrent comme leur apôtre. Nous ne savons pas avec certitude par où il est passé, mais nous savons qu’il y eut très tôt des chrétiens en Dobroudja.",
          },
          w5: {
            name: "Jean, exilé à Patmos",
            years: "vers 95",
            place: "L’île de Patmos",
            text: "Le dernier apôtre encore en vie fut exilé sur une île « à cause de la parole de Dieu et du témoignage de Jésus » (Apocalypse 1:9). C’est là qu’il reçut la révélation écrite dans le livre de l’Apocalypse.",
          },
        },
      },
      roma: {
        name: "Les martyrs sous les empereurs de Rome",
        intro: "Pendant deux cent cinquante ans, être chrétien pouvait signifier la mort. Les chrétiens refusaient d’offrir des sacrifices aux dieux et à l’empereur, c’est pourquoi on les considérait comme des ennemis de l’État. La persécution venait par vagues : tantôt locale, tantôt dans tout l’empire. La plus dure fut la dernière, sous Dioclétien.",
        verse: {
          text: "Sois fidèle jusqu’à la mort, et je te donnerai la couronne de vie.",
          ref: "Apocalypse 2:10",
        },
        w: {
          w1: {
            name: "Ignace d’Antioche",
            years: "vers 110",
            place: "Antioche → Rome",
            text: "Évêque d’Antioche, emmené enchaîné à Rome pour être livré aux bêtes. En chemin, il écrivit aux Églises sept lettres qui nous sont parvenues : il leur demande de rester unies et de ne pas essayer de le sauver de la mort.",
          },
          w2: {
            name: "Polycarpe de Smyrne",
            years: "vers 155",
            place: "Smyrne (dans l’actuelle Turquie)",
            text: "Disciple de l’apôtre Jean et vieil évêque. Quand on lui demanda de renier le Christ pour sauver sa vie, il répondit par les paroles conservées dans le récit de son martyre. Il fut brûlé sur le bûcher.",
            quote: "Voilà quatre-vingt-six ans que je le sers, et il ne m’a fait aucun mal. Comment pourrais-je blasphémer mon Roi qui m’a sauvé ?",
          },
          w3: {
            name: "Justin le martyr",
            years: "vers 165",
            place: "Rome",
            text: "Un philosophe qui trouva le Christ après avoir cherché la vérité dans toutes les écoles de son temps. Il écrivit des défenses de la foi adressées aux empereurs et fut décapité avec ses disciples.",
          },
          w4: {
            name: "Perpétue et Félicité",
            years: "203",
            place: "Carthage (dans l’actuelle Tunisie)",
            text: "Une jeune mère de bonne famille et son esclave, qui venait d’accoucher. Elles refusèrent de sacrifier aux dieux et moururent ensemble dans l’arène. Perpétue elle-même a écrit en prison le récit des jours qui précédèrent sa mort.",
          },
          w5: {
            name: "La persécution de Dèce",
            years: "250",
            place: "Tout l’empire",
            text: "L’empereur ordonna que chacun offre un sacrifice aux dieux et en reçoive un certificat. Beaucoup de chrétiens moururent, beaucoup se cachèrent, et certains cédèrent. Ensuite, l’Église dut apprendre comment accueillir de nouveau ceux qui étaient tombés.",
          },
          w6: {
            name: "Épictète et Astion",
            years: "vers 290",
            place: "Halmyris, près de Murighiol (Tulcea)",
            text: "Un prêtre et un jeune disciple, tués pour leur foi dans la forteresse romaine d’Halmyris, aux bouches du Danube. Leurs reliques ont été retrouvées par les archéologues dans la crypte de la basilique de ce lieu en 2001.",
          },
          w7: {
            name: "La Grande Persécution et les martyrs de Niculițel",
            years: "303–311",
            place: "Tout l’empire ; Niculițel (Tulcea)",
            text: "Dioclétien ordonna de démolir les églises, de brûler les Écritures et d’emprisonner le clergé. Beaucoup de chrétiens de Dobroudja moururent à cette époque. En 1971, à Niculițel, on découvrit sous une ancienne basilique une crypte contenant les ossements de quatre martyrs, avec leurs noms écrits sur le mur : Zoticos, Attalos, Kamasis et Philippos.",
          },
        },
      },
      "evul-mediu": {
        name: "Une Église libre, mais tentée",
        intro: "En 313, par l’édit de Milan, les chrétiens obtinrent le droit de pratiquer librement leur foi. L’Église échappa à l’épée de Rome, mais rencontra une autre tentation : le pouvoir. Avec le temps, beaucoup devinrent chrétiens seulement de nom, et l’Écriture resta dans une langue que le peuple ne comprenait plus. Ceux qui appelaient à revenir à la Parole furent persécutés, cette fois par ceux qui se disaient l’Église.",
        verse: {
          text: "Le ciel et la terre passeront, mais mes paroles ne passeront point.",
          ref: "Matthieu 24:35",
        },
        w: {
          w1: {
            name: "Sabas le Goth",
            years: "372",
            place: "La rivière Buzău",
            text: "Un chrétien goth qui refusa de manger de la viande sacrifiée aux idoles. Le chef goth le fit noyer dans la rivière Mousaios, l’actuelle Buzău, le 12 avril 372. À cette époque, dans le pays au nord du Danube, Ulfilas avait traduit la Bible en langue gotique.",
          },
          w2: {
            name: "Pierre Valdo et les Vaudois",
            years: "vers 1170",
            place: "Lyon, puis les Alpes",
            text: "Un riche marchand de Lyon qui donna ses biens et fit traduire l’Écriture dans la langue du peuple. Ses disciples prêchaient la Bible dans les villages. Ils furent déclarés hérétiques et pourchassés pendant des siècles, mais ils se cachèrent dans les vallées des Alpes et ont survécu jusqu’à aujourd’hui.",
          },
          w3: {
            name: "John Wycliffe",
            years: "vers 1330–1384",
            place: "Oxford, Angleterre",
            text: "Un professeur d’Oxford qui enseignait que l’Écriture est au-dessus du pape et qui voulut que la Bible soit traduite en anglais. Il mourut dans son lit, mais en 1428 l’Église fit exhumer ses ossements, les brûla et jeta les cendres dans une rivière.",
          },
          w4: {
            name: "Jan Hus",
            years: "1415",
            place: "Prague → Constance",
            text: "Prêtre et professeur à Prague, il prêchait en tchèque et appelait l’Église à revenir à l’Écriture. Il fut convoqué au concile de Constance avec la promesse qu’il pourrait repartir librement ; il fut arrêté et brûlé sur le bûcher le 6 juillet 1415, parce qu’il refusa de renier ce qu’il avait appris dans la Bible.",
          },
        },
      },
      reforma: {
        name: "La Réforme : l’Écriture dans la langue du peuple",
        intro: "Cent ans après Hus, un moine allemand redécouvrit dans l’épître aux Romains que nous sommes sauvés par la foi, comme un don de Dieu, et non par les œuvres ou par l’argent. L’imprimerie venait d’apparaître, si bien que l’Écriture pouvait enfin entrer dans les maisons. Suivirent cent ans de luttes et de persécutions, au cours desquels, hélas, les chrétiens se persécutèrent aussi entre eux.",
        verse: {
          text: "Le juste vivra par la foi.",
          ref: "Romains 1:17",
        },
        w: {
          w1: {
            name: "Martin Luther",
            years: "1483–1546",
            place: "Wittenberg, Allemagne",
            text: "Moine et professeur de théologie. Le 31 octobre 1517, il écrivit les 95 thèses contre la vente du pardon des péchés pour de l’argent. En 1521, à la diète de Worms, devant l’empereur, il refusa de retirer ses écrits, parce qu’il était lié par la Parole de Dieu. Il fut mis hors la loi ; ses amis le cachèrent au château de la Wartbourg, où il traduisit le Nouveau Testament en allemand (1522). Son enseignement se résume en trois expressions : l’Écriture seule, la grâce seule, la foi seule. Il n’était pas sans défauts : dans sa vieillesse, il écrivit contre les Juifs des paroles dures et injustes, que nous ne pouvons pas approuver.",
            quote: "Ma conscience est captive de la Parole de Dieu. Je ne peux ni ne veux rien rétracter. (Worms, 1521)",
          },
          w2: {
            name: "Felix Manz",
            years: "1527",
            place: "Zurich, Suisse",
            text: "L’un des premiers « anabaptistes », qui croyaient que le baptême est pour ceux qui croient et se repentent. Les autorités protestantes de Zurich le noyèrent dans la Limmat. Des milliers d’anabaptistes furent tués à cette époque, aussi bien par des catholiques que par des protestants.",
          },
          w3: {
            name: "William Tyndale",
            years: "1536",
            place: "Vilvorde, près de Bruxelles",
            text: "Il traduisit le Nouveau Testament du grec en anglais, bien que ce fût interdit, et l’imprima à l’étranger ; les exemplaires entraient en Angleterre en cachette. Trahi, il fut emprisonné, puis étranglé et brûlé. Sa traduction est à la racine de la Bible anglaise qui suivit.",
            quote: "Seigneur, ouvre les yeux du roi d’Angleterre !",
          },
          w4: {
            name: "Le diacre Coresi et les premiers livres roumains",
            years: "1559–1582",
            place: "Brașov, Orăștie",
            text: "À Brașov, à l’époque de la Réforme, le diacre Coresi imprima les premiers livres en langue roumaine, parmi lesquels les Évangiles (le Tétraévangile, 1561). En 1582 fut imprimée à Orăștie la Palia, les premiers livres de l’Ancien Testament en roumain. Pour la première fois, les Roumains pouvaient entendre la Parole dans leur propre langue.",
          },
          w5: {
            name: "La diète de Turda",
            years: "1568",
            place: "Turda, Transylvanie",
            text: "La diète de Transylvanie décida que chaque communauté pouvait choisir son prédicateur, « car la foi est un don de Dieu ». Ce fut l’une des premières lois de liberté religieuse en Europe. Les Roumains orthodoxes, cependant, restèrent seulement « tolérés », sans les mêmes droits.",
          },
          w6: {
            name: "Latimer et Ridley",
            years: "1555",
            place: "Oxford, Angleterre",
            text: "Deux évêques anglais brûlés sur le même bûcher sous la reine Marie Ire, qui fit mourir près de trois cents protestants. Latimer dit à son ami d’avoir du courage, car ce jour-là ils allumeraient une bougie qui ne s’éteindrait jamais.",
          },
          w7: {
            name: "Le massacre de la Saint-Barthélemy",
            years: "1572",
            place: "Paris et la France",
            text: "Dans la nuit du 24 août, des milliers de protestants français (huguenots) furent massacrés à Paris, puis dans d’autres villes. Beaucoup de ceux qui survécurent quittèrent le pays.",
          },
          w8: {
            name: "La Bible en roumain",
            years: "1648–1688",
            place: "Bălgrad (Alba Iulia), Bucarest",
            text: "En 1648 parut à Bălgrad le Nouveau Testament en roumain, et en 1688, à Bucarest, la première Bible complète en langue roumaine, avec le soutien du prince Șerban Cantacuzino.",
          },
        },
      },
      trezire: {
        name: "Réveil et mission",
        intro: "Ces siècles apportèrent des réveils spirituels dans de nombreux pays et les premiers missionnaires partis jusqu’aux extrémités de la terre, mais aussi de nouveaux martyrs, sous les Turcs, dans les colonies et dans les pays où l’Évangile arrivait pour la première fois.",
        verse: {
          text: "Jésus-Christ est le même hier, aujourd’hui, et éternellement.",
          ref: "Hébreux 13:8",
        },
        w: {
          w1: {
            name: "Constantin Brâncoveanu et ses fils",
            years: "1714",
            place: "Constantinople",
            text: "Le prince de Valachie fut destitué et emmené à Constantinople avec ses quatre fils et son conseiller Ienache. Le 15 août 1714, on leur demanda de renier leur foi pour sauver leur vie. Ils refusèrent et furent décapités, d’abord les fils, sous les yeux de leur père, puis le prince lui-même.",
          },
          w2: {
            name: "Les frères moraves de Herrnhut",
            years: "1727",
            place: "Saxe",
            text: "Descendants des hussites, réfugiés sur le domaine du comte Zinzendorf, ils commencèrent une prière qui dura sans interruption pendant cent ans et envoyèrent des missionnaires parmi les esclaves des Caraïbes, au Groenland et en Afrique.",
          },
          w3: {
            name: "Les martyrs de Chine (la révolte des Boxers)",
            years: "1900",
            place: "Nord de la Chine",
            text: "Dans le soulèvement contre les étrangers, plusieurs centaines de missionnaires et plus de trente mille chrétiens chinois furent tués. Au lieu de disparaître, l’Église de Chine a grandi au siècle suivant jusqu’à des dizaines de millions.",
          },
        },
      },
      "secolul-xx": {
        name: "Le siècle des martyrs",
        intro: "Le XXe siècle apporta les plus grandes persécutions de l’histoire : le génocide arménien, la terreur soviétique, le nazisme et, après la Seconde Guerre mondiale, le communisme imposé aussi en Roumanie. L’État athée voulait arracher la foi du cœur des gens. Il n’y parvint pas. Dans les prisons, on apprenait des versets par cœur et on se les transmettait à travers les murs.",
        verse: {
          text: "Nous sommes pressés de toute manière, mais non réduits à l’extrémité ; dans la détresse, mais non dans le désespoir ; persécutés, mais non abandonnés ; abattus, mais non perdus.",
          ref: "2 Corinthiens 4:8–9",
        },
        w: {
          w1: {
            name: "Le génocide arménien",
            years: "1915–1923",
            place: "L’Empire ottoman",
            text: "Environ un million et demi d’Arméniens, le plus ancien peuple chrétien, furent tués ou moururent pendant les déportations. Des centaines de milliers de chrétiens assyriens et grecs périrent aussi à cette époque.",
          },
          w2: {
            name: "Iosif Trifa et l’Armée du Seigneur",
            years: "1923–1948",
            place: "Sibiu, puis tout le pays",
            text: "En 1923, le prêtre Iosif Trifa lança un mouvement de réveil parmi les orthodoxes, avec la Bible, des cantiques et l’abandon de la boisson et des jurons. Les communistes l’interdirent en 1948 ; ses frères se réunirent en secret pendant des décennies. Le poète Traian Dorz et le compositeur Nicolae Moldoveanu, deux de ses frères, passèrent par les prisons (voir leurs histoires plus bas).",
          },
          w3: {
            name: "Dumitru Cornilescu",
            years: "1921–1923",
            place: "Stânca-Ștefănești, Bucarest",
            text: "Un jeune diacre orthodoxe qui traduisit la Bible dans un roumain vivant et clair (1921, révisée en 1924). En la lisant, il parvint à une foi personnelle en Christ. Il fut contraint de quitter le pays en 1923 et ne revint jamais ; il mourut en Suisse en 1975. Sa traduction est lue encore aujourd’hui par des millions de Roumains.",
          },
          w4: {
            name: "Dietrich Bonhoeffer",
            years: "1945",
            place: "Flossenbürg, Allemagne",
            text: "Un pasteur allemand qui s’opposa à Hitler et aida des Juifs à s’enfuir. Il fut emprisonné deux ans et pendu le 9 avril 1945, quelques semaines avant la fin de la guerre.",
          },
          w5: {
            name: "Les évêques gréco-catholiques",
            years: "1948–1970",
            place: "Sighet, Căldărușani, Blaj",
            text: "En 1948, les communistes supprimèrent l’Église gréco-catholique, prirent ses églises et arrêtèrent tous ses évêques. Cinq d’entre eux moururent en prison ou en résidence surveillée ; l’évêque Iuliu Hossu, qui avait lu la Déclaration d’Union à Alba Iulia le 1er décembre 1918, mourut en 1970 sans avoir jamais été libéré.",
          },
          w6: {
            name: "Richard et Sabina Wurmbrand",
            years: "1948–1964",
            place: "Văcărești, Jilava, Gherla",
            text: "Pasteur luthérien de Bucarest, juif venu au Christ. Arrêté en 1948, il passa en tout quatorze ans en prison, dont trois seul dans une cellule souterraine ; sa femme Sabina passa elle aussi par un camp de travail. Libéré en 1964 et racheté hors du pays, il écrivit « Torturé pour le Christ » et fonda une mission qui aide encore aujourd’hui les chrétiens persécutés.",
          },
          w7: {
            name: "Prêtres, pasteurs et croyants de toutes les confessions",
            years: "1948–1989",
            place: "Aiud, Gherla, Pitești, le Canal",
            text: "Des milliers de prêtres orthodoxes et gréco-catholiques, de pasteurs baptistes, pentecôtistes et adventistes et de croyants des Assemblées de frères passèrent par les prisons et les camps de travail. Le théologien Dumitru Stăniloae fut emprisonné cinq ans. Le prêtre Gheorghe Calciu passa vingt et un ans en prison, la dernière fois pour les sermons qu’il avait adressés aux jeunes en 1978. Des Bibles entraient dans le pays en cachette, grâce à des chrétiens d’Occident.",
          },
          w8: {
            name: "Timișoara, décembre 1989",
            years: "1989",
            place: "Timișoara",
            text: "La révolution commença par une chaîne de personnes de toutes les confessions, debout devant la maison du pasteur réformé László Tőkés pour qu’il ne soit pas expulsé. Sur la place, la foule criait « Dieu existe ! ».",
          },
        },
      },
      azi: {
        name: "L’Église persécutée aujourd’hui",
        intro: "La persécution ne s’est pas arrêtée. Selon Portes Ouvertes, qui suit la situation chaque année, plus de 380 millions de chrétiens, environ un sur sept, vivent aujourd’hui dans un pays où leur foi peut leur coûter leur travail, leur liberté ou leur vie : en Corée du Nord, dans certaines régions d’Afrique, au Moyen-Orient, en Asie. Et c’est justement là où c’est le plus dur que l’Église grandit aujourd’hui.",
        verse: {
          text: "Or, tous ceux qui veulent vivre pieusement en Jésus-Christ seront persécutés.",
          ref: "2 Timothée 3:12",
        },
        w: {
          w1: {
            name: "Les 21 de la plage de Libye",
            years: "2015",
            place: "Syrte, Libye",
            text: "Vingt ouvriers chrétiens coptes d’Égypte et un jeune homme du Ghana furent tués par le groupe État islamique. L’enregistrement montre beaucoup d’entre eux prononçant le nom de Jésus au dernier moment.",
          },
          w2: {
            name: "Les chrétiens du Nigeria",
            years: "aujourd’hui",
            place: "Nord et centre du Nigeria",
            text: "Des villages entiers sont attaqués et des églises incendiées presque chaque semaine. Le Nigeria est le pays où le plus grand nombre de chrétiens sont tués pour leur foi.",
          },
          w3: {
            name: "L’Église de Corée du Nord",
            years: "aujourd’hui",
            place: "Corée du Nord",
            text: "Posséder une Bible peut envoyer toute une famille dans un camp de travail. Et pourtant, des dizaines de milliers de croyants prient en secret.",
          },
          w4: {
            name: "La liberté en Roumanie",
            years: "1990–aujourd’hui",
            place: "Roumanie",
            text: "Depuis 1989, la Bible est imprimée et lue librement en Roumanie. C’est un don payé par la souffrance de ceux qui nous ont précédés, et un devoir : prier pour ceux qui traversent aujourd’hui ce qu’ils ont traversé.",
          },
        },
      },
    },
    heroesIntro: "L’histoire de l’Église n’est pas seulement une liste de souffrances. C’est aussi l’histoire de gens simples, de nos villages et de nos villes, qui ont découvert que le Christ était plus proche dans une cellule de prison qu’il ne l’avait jamais été en liberté. Leurs histoires ne sont pas là pour nous faire peur, mais pour nous donner de la force.",
    heroes: {
      wurmbrand: {
        name: "Richard Wurmbrand",
        years: "1909–2001",
        who: "Pasteur luthérien de Bucarest, juif venu au Christ. Quatorze ans dans les prisons communistes.",
        story: {
          p1: "En 1945, les communistes réunirent à Bucarest un « Congrès des cultes », où prêtres et pasteurs, l’un après l’autre, faisaient l’éloge du nouveau régime. Sabina, sa femme, lui dit : « Richard, lève-toi et lave cette honte du visage du Christ ! » Il répondit que s’il parlait, elle perdrait son mari. Sabina dit qu’elle ne voulait pas d’un lâche pour mari. Richard se leva et dit devant tous que le devoir de l’Église est d’annoncer le Christ, et non de louer ceux qui ont le pouvoir.",
          p2: "En 1948, il fut enlevé dans la rue et disparut pendant des années ; sa famille ne savait même pas s’il était encore en vie. Pendant trois ans, il fut seul dans une cellule souterraine, sans livre, sans lumière du jour, sans voir personne d’autre que les gardiens. Pour garder l’esprit clair, chaque nuit il composait un sermon et le prêchait dans sa tête, comme s’il parlait à toute une église. Il parlait avec les détenus des cellules voisines en frappant sur le mur, lettre par lettre ; c’est ainsi qu’il annonça l’Évangile à un homme dont il ne vit jamais le visage.",
          p3: "Plus tard, il raconta comment, en se répétant les paroles du Seigneur « Réjouissez-vous en ce jour-là et tressaillez d’allégresse », il se leva dans sa cellule et dansa de joie. Les gardiens crurent qu’il était devenu fou et lui apportèrent plus de nourriture.",
          p4: "Libéré en 1964 et racheté hors du pays par des chrétiens de Norvège, il ôta sa chemise devant le Sénat américain pour montrer les cicatrices de la torture. Il écrivit « Torturé pour le Christ » et fonda une mission qui aide encore aujourd’hui les chrétiens persécutés. Ce qu’il disait le plus souvent : qu’il aimait ceux qui l’avaient torturé et qu’il priait pour eux.",
        },
        lesson: "La foi n’est pas une idée que l’on perd quand on vous prend tout. Quand Wurmbrand n’eut plus rien, il découvrit qu’il avait le Christ, et que cela lui suffisait.",
        verse: {
          text: "Réjouissez-vous en ce jour-là et tressaillez d’allégresse, parce que votre récompense sera grande dans le ciel",
          ref: "Luc 6:23",
        },
      },
      moldoveanu: {
        name: "Nicolae Moldoveanu",
        years: "1922–2007",
        who: "Compositeur de l’Armée du Seigneur, « le David du cantique roumain ». Cinq ans de prison pour avoir écrit des cantiques.",
        story: {
          p1: "Il naquit à Movileni, dans le département de Tecuci (aujourd’hui Galați), et perdit son père tout petit. Élevé dans une fanfare militaire pour enfants pauvres, il vendait la moitié de sa ration de pain et tout son lait pour acheter une Bible et la revue de l’Armée du Seigneur.",
          p2: "En 1959, il fut arrêté pour « composition de chants religieux et propagande religieuse » et condamné à douze ans ; il en fit cinq. En prison, il n’avait ni crayon, ni papier, ni portées. Et pourtant il y composa trois cent cinquante cantiques, qu’il garda dans sa mémoire, note après note, et qu’il n’écrivit qu’après sa sortie.",
          p3: "Richard Wurmbrand, qui partagea sa cellule à Gherla, raconta une nuit d’hiver : ils n’avaient pas de vêtements chauds, ils dormaient sur le béton nu, et les gardiens les faisaient sans cesse se lever et se coucher sur ordre. Les autres juraient. Moldoveanu louait Dieu et, couché sur le béton, lui chanta un nouveau cantique, plein de joie et d’espérance, que l’on chante aujourd’hui dans de nombreux pays.",
          p4: "Au cours de sa vie, il écrivit plus de sept mille cantiques, beaucoup sur des paroles de Traian Dorz, que l’on chante encore dans les églises de tout le pays. Quand Wurmbrand revint en Roumanie en 1990, la première personne qu’il vit fut lui.",
        },
        lesson: "On peut t’enfermer, mais on ne peut pas t’empêcher de chanter. Ce qui a été semé dans l’obscurité se chante aujourd’hui dans des églises pleines.",
        verse: {
          text: "Nous sommes pressés de toute manière, mais non réduits à l’extrémité ; dans la détresse, mais non dans le désespoir ;",
          ref: "2 Corinthiens 4:8",
        },
      },
      dorz: {
        name: "Traian Dorz",
        years: "1914–1989",
        who: "Poète paysan de Livada Beiușului (Bihor), de l’Armée du Seigneur. Près de dix-huit ans de prisons et de colonies de travail.",
        story: {
          p1: "Enfant de paysans pauvres, il reçut en prix d’école un livre du prêtre Iosif Trifa. Il le lut, donna sa vie au Christ à quinze ans et se mit aussitôt à écrire des vers.",
          p2: "Il fut arrêté une première fois en décembre 1947, puis encore et encore : Oradea, Gherla, Deva, Periprava, le Bărăgan. En 1959, il fut condamné à seize ans de travaux forcés ; il fut libéré en 1964. Lors d’un interrogatoire, on le plaça contre un mur avec un pistolet sur la tempe, pour l’effrayer ; il raconta plus tard qu’il avait alors traversé sa propre mort et qu’il n’avait plus rien à craindre.",
          p3: "La cellule était si petite qu’il ne pouvait pas s’y tenir droit. Il n’avait pas le droit d’écrire, alors il composait ses poèmes dans sa tête et en garda plus de trois cents en mémoire, qu’il écrivit après sa libération. Sa fille lui apportait des colis que les gardiens donnaient aux chiens ; elle trouva alors un trou dans la clôture, connu d’eux deux seulement, et y laissait la nourriture pour lui.",
          p4: "Même après la prison, la Securitate le surveillait ; quand ils voyaient sa lampe allumée la nuit, ils lui criaient qu’il n’avait pas le droit d’écrire. Il continua d’écrire. Il mourut en juin 1989, six mois avant la chute du communisme ; bien que les autorités aient essayé d’empêcher les gens de venir, plus de dix mille personnes assistèrent à ses funérailles.",
        },
        lesson: "Ce que le cœur retient ne peut pas être confisqué. Les poèmes écrits en cachette, à la lumière de la lampe, se chantent aujourd’hui dans tout le pays.",
        verse: {
          text: "Sois fidèle jusqu’à la mort, et je te donnerai la couronne de vie.",
          ref: "Apocalypse 2:10",
        },
      },
    },
    bibleIntro: "Longtemps, les Roumains ont entendu les offices de l’Église en slavon, une langue que le prêtre comprenait à peine et le peuple pas du tout. La Parole de Dieu leur est parvenue dans leur langue maternelle lentement, livre après livre, en trois cents ans.",
    steps: {
      b1: {
        year: "XVe–XVIe s.",
        title: "Les premiers textes manuscrits",
        who: "Traducteurs inconnus, dans le Maramureș et le nord de la Transylvanie",
        text: "Les plus anciens fragments de la Bible en roumain sont des manuscrits : le Psautier de Schei, le Psautier de Voroneț, le Codex de Voroneț (les Actes des apôtres et les épîtres). Ils nous sont parvenus dans des copies du XVIe siècle et sont écrits dans le parler du nord. Nous ne savons pas avec certitude qui les a traduits ; certains historiens pensent qu’ils sont nés sous l’influence des hussites ou de la Réforme.",
      },
      b2: {
        year: "1561",
        title: "Le Tétraévangile de Coresi",
        who: "Le diacre Coresi, à Brașov, avec le soutien du juge saxon Hans Benkner",
        text: "Le premier livre imprimé contenant les quatre Évangiles en roumain. Suivirent l’Apôtre (1563) et le Psautier (1570). Les préfaces de ces livres disent pourquoi : tous les peuples avaient la Parole de Dieu dans leur langue, seuls les Roumains ne l’avaient pas. Ses livres parvinrent dans les églises des trois pays roumains et placèrent le parler de la Valachie et du sud de la Transylvanie au fondement de la langue littéraire d’aujourd’hui.",
      },
      b3: {
        year: "1582",
        title: "La Palia d’Orăștie",
        who: "L’évêque Mihail Tordaș et quatre autres prêtres, avec le soutien de Francisc Geszti",
        text: "La première traduction roumaine des premiers livres de l’Ancien Testament : la Genèse et l’Exode. La préface dit aux lecteurs qu’elle a été traduite pour que les Roumains aient eux aussi l’Écriture, comme les autres peuples.",
      },
      b4: {
        year: "1648",
        title: "Le Nouveau Testament de Bălgrad",
        who: "Le métropolite Simion Ștefan de Transylvanie, à Alba Iulia",
        text: "Le premier Nouveau Testament complet en roumain, traduit du grec et du latin. Dans la préface, le métropolite écrit qu’il a choisi les mots compris par les Roumains de tous les pays, car ils parlaient différemment d’une région à l’autre. C’était, ouvertement, une pensée pour l’unité de la langue.",
        quote: "Les mots doivent être comme l’argent : les bonnes pièces sont celles qui circulent dans tous les pays ; de même, les bons mots sont ceux que tout le monde comprend.",
      },
      b5: {
        year: "1688",
        title: "La Bible de Bucarest",
        who: "Commencée sous Șerban Cantacuzino, achevée sous Constantin Brâncoveanu ; traducteurs : Nicolae Milescu et les frères Radu et Șerban Greceanu",
        text: "La première Bible complète en langue roumaine. L’Ancien Testament partit de la traduction faite par le lettré moldave Nicolae Milescu, revue à Bucarest par les frères Greceanu. Pour la première fois, la Moldavie, la Valachie et la Transylvanie avaient la même Bible, dans la même langue ; elle fut la langue des livres des Roumains pendant plus de cent ans.",
      },
      b6: {
        year: "1795",
        title: "La Bible de Blaj",
        who: "Samuil Micu, de l’École transylvaine",
        text: "Traduite à nouveau, d’après la Septante, par un lettré gréco-catholique. Elle passa entre les mains de nombreuses générations de prêtres et d’instituteurs de Transylvanie.",
      },
      b7: {
        year: "1856–1858",
        title: "La Bible de Șaguna",
        who: "Le métropolite Andrei Șaguna, à Sibiu",
        text: "Une édition soigneusement préparée pour les croyants orthodoxes de Transylvanie, dans une langue plus proche de celle que parlaient les gens.",
      },
      b8: {
        year: "1921–1924",
        title: "La Bible Cornilescu",
        who: "Dumitru Cornilescu, aidé par la princesse Ralu Callimachi",
        text: "Un jeune diacre orthodoxe traduisit la Bible dans un roumain vivant et clair, que chacun peut comprendre. En la lisant, il parvint lui-même à une foi vivante en Christ. La Société biblique britannique et étrangère la reprit en 1924 et la diffusa à des centaines de milliers d’exemplaires. Il fut contraint de quitter le pays en 1923, mais sa traduction est restée la Bible que des millions de Roumains gardent à leur chevet.",
      },
      b9: {
        year: "1914–1988",
        title: "Les Bibles synodales",
        who: "L’Église orthodoxe roumaine (traductions de Gala Galaction, Vasile Radu et d’autres)",
        text: "Éditions officielles de l’Église orthodoxe, révisées plusieurs fois. L’édition de 1988, imprimée sous les communistes, n’est arrivée que dans peu de maisons ; les Bibles étaient difficiles à trouver à cette époque.",
      },
    },
    influence: {
      i1: "Le roumain écrit est né, dans une large mesure, des livres de l’Église. Les Bibles et les livres liturgiques étaient les premières lectures dans chaque région ; ils ont ainsi aidé à créer une langue commune à tous les Roumains, bien avant l’Union de 1918. Eminescu disait que l’Église et ses livres ont donné aux Roumains l’unité de leur langue.",
      i2: "Celui qui voulait lire l’Écriture devait apprendre à lire. Des écoles furent ouvertes à côté des églises, et à Blaj, en 1754, les écoles furent appelées « les sources des dons ». Longtemps, les instituteurs des villages furent les chantres de l’église.",
      i3: "Quand les gens simples purent lire eux-mêmes la Parole, des réveils naquirent : l’Armée du Seigneur, les Églises évangéliques, les cercles de prière dans les villages. La foi cessa d’appartenir seulement au prêtre et devint celle de chacun.",
      i4: "C’est pourquoi les communistes craignaient la Bible plus que bien des armes : un peuple qui lit la Parole sait ce qu’est la vérité et ne se laisse plus facilement tromper.",
    },
    bibleVerse: {
      text: "La révélation de tes paroles éclaire, elle donne de l’intelligence aux simples.",
      ref: "Psaume 119:130",
    },
    endVerses: {
      v1: {
        text: "S’ils m’ont persécuté, ils vous persécuteront aussi ; s’ils ont gardé ma parole, ils garderont aussi la vôtre.",
        ref: "Jean 15:20",
      },
      v2: {
        text: "Heureux ceux qui sont persécutés pour la justice, car le royaume des cieux est à eux !",
        ref: "Matthieu 5:10",
      },
      v3: {
        text: "Je vous ai dit ces choses, afin que vous ayez la paix en moi. Vous aurez des tribulations dans le monde ; mais prenez courage, j’ai vaincu le monde.",
        ref: "Jean 16:33",
      },
    },
  },
};
