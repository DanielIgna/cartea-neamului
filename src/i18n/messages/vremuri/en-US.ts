import type { VremuriCatalog } from "./ro";
import type { DeepPartial } from "../types";

/** US English: only the words that differ from British English (en-GB.ts). */
export const enUSVremuri: DeepPartial<VremuriCatalog> = {
  Vremuri: {
    eras: {
      vechi: {
        life: {
          lume: "The world was still one of villages and kingdoms: most people worked the land, traveled little and lived by the rhythm of the Church. Wars, plague and famine often swept over them.",
        },
      },
      stapaniri: {
        life: {
          all: "The Romanian lands were divided between the great empires. Peasants lived on very little, in houses of wood or mud brick, owing labor days to the boyar and heavy taxes. The Russo-Turkish and Austro-Turkish wars passed through the villages, and plague and cholera mowed people down. There were very few schools, mostly next to monasteries.",
          ardeal: "Transylvania had passed to the Habsburgs, and Vienna governed it through the local nobility. Almost all Romanians were serfs: they worked whole days each week for the noble and could not leave the estate without permission. The union with the Church of Rome (1700) brought the first Romanian schools to Blaj, and from there came the scholars of the Transylvanian School. Toward the end of the century, after Horea’s uprising, Emperor Joseph II loosened the chains of serfdom.",
          regat: "Moldavia and Wallachia were ruled by Greek princes from the Phanar, appointed by the Sultan: they bought their thrones and got their money back through taxes laid on the peasants. The country was often occupied by the Russians or the Austrians in their wars with the Turks. Villages emptied when armies or plague came, and people fled to hide in the forests. Constantine Mavrocordatos abolished serfdom, but the labor owed to the boyar remained.",
          bucovina: "Until 1775, Bukovina was the northern part of Moldavia, with its ancient monasteries. Then Austria took it and began organizing it as a province of the empire: roads, German schools and colonies of settlers brought in from elsewhere.",
        },
      },
      tudor: {
        life: {
          all: "After 1821 the world began to stir: the first newspapers and schools in Romanian appeared, and the sons of boyars went to study in Paris. The peasants, however, lived as before, by labor dues and tithes, with the cholera of 1831 and years of drought that brought famine.",
          regat: "After Tudor Vladimirescu, native princes returned to the throne, and after the war of 1828–1829 the Russians occupied the Principalities and gave them the Organic Statutes, a kind of first constitution. The grain trade on the Danube opened up and the ports of Brăila and Galați grew, but the peasants were given more days of labor dues, not fewer.",
        },
      },
      revolutia: {
        life: {
          regat: "In 1859 Moldavia and Wallachia united under Alexandru Ioan Cuza. Cuza gave land to the peasants (1864), abolished labor dues, made primary school compulsory and free, and freed the Roma slaves. For the first time, a peasant could own his own land. In 1866 Carol I came to the throne.",
        },
      },
      inainte: {
        life: {
          regat: "Romania won its independence in the war of 1877–1878 and became a kingdom in 1881. Railways, bridges, schools and barracks were built, and Romanian wheat traveled down the Danube to the whole of Europe. The peasants, however, had too little land and worked for a share of the crop on estates run by leaseholders; their anger broke out in the uprising of 1907, crushed by the army.",
          dobrogea: "In 1878 Dobruja became part of Romania. The state brought Romanian settlers here from all over the country, built the port of Constanța and the bridge at Cernavodă (1895), and the steppe began to be plowed.",
        },
      },
      razboi1: {
        life: {
          ardeal: "The men of Transylvania were called up into the Austro-Hungarian army and sent to fight in Galicia, in Serbia and in the Italian mountains, sometimes even against Romanians from the Kingdom. When Romania entered the war in 1916, many were suspected and arrested. On December 1, 1918, at Alba Iulia, tens of thousands of people called for union with Romania.",
          bucovina: "Bukovina was a battlefield between the Russians and the Austrians, occupied and freed several times. On November 28, 1918, it united with Romania.",
          basarabia: "After the fall of Tsarist Russia in 1917, Bessarabia set up its own National Council, and on March 27, 1918, it united with Romania.",
          dobrogea: "Dobruja was occupied by the German and Bulgarian armies in the fall of 1916, and many people fled toward Moldavia or were taken hostage.",
        },
      },
      razboi2: {
        life: {
          all: "In the summer of 1940, Romania lost a third of its territory without firing a shot. Then came the war: the men at the front, first toward the east and then, after August 23, 1944, toward the west. These were years of requisitions, bombing, deportations of Jews and Roma, and people fleeing their homes. After the war the Soviet army stayed in the country, the Communists took power step by step, and the drought of 1946–1947 brought famine.",
          ardeal: "In August 1940, through the Second Vienna Award, northern Transylvania was given to Hungary. Families were split in two, with a border between them, and many Romanians from the north fled south. In the fall of 1944, the battles to free Northern Transylvania were fought right through the villages. The winter of 1945 took many Germans from Transylvania and the Banat to forced labor in the Soviet Union.",
        },
      },
      comunism: {
        life: {
          all: "The King had been forced to leave, and the Communists took everything: the factories, the banks, the land. Peasants were pushed, by force, to hand over their land and animals to the collective farm, and those who refused, branded “kulaks”, were arrested or humiliated. Many people ended up in political prisons or in the labor camps of the Danube–Black Sea Canal. At the same time, electricity reached more and more villages, and all children went to school.",
          ardeal: "The Greek Catholic Church, the church of many Romanians in Transylvania, was abolished in 1948 and its priests were arrested. For years the mountains sheltered groups of anti-Communist partisans. Collectivization changed the village forever: young people began to leave for the factories in town.",
        },
      },
      ceausescu: {
        life: {
          all: "The ’60s and ’70s brought apartment blocks, new factories and jobs in town; many young people left the village, and others commuted. You had a home, school and a job guaranteed, but not the freedom to say what you thought or to travel. Abortion was banned, so many children were born. In the ’80s, to pay off the country’s debts, Ceaușescu put everything on ration cards: lines for bread, cold homes, the electricity cut off in the evening and two hours of television a day. The Securitate was everywhere.",
          ardeal: "Transylvania and the Banat were industrialized quickly, with factories in Cluj, Brașov, Timișoara and Hunedoara. At the same time, the Saxons and the Swabians left en masse for Germany, and their villages were left half empty.",
          basarabia: "In Soviet Moldavia the villages were kolkhozes, and the towns filled with factories and with people brought in from other republics. Russian was the language you needed to get on in life. Toward the end of the ’80s people began to demand the Romanian language and the Latin alphabet.",
        },
      },
      europa: {
        life: {
          basarabia: "The Republic of Moldova has drawn closer to Europe: since 2014 its people have traveled without visas, many also hold Romanian citizenship, and the country has applied to join the European Union.",
        },
      },
    },
    events: {
      "1791-supplex-libellus": "Supplex Libellus Valachorum: the Romanians of Transylvania ask to be recognized as a nation",
      "1918-unire-basarabia": "The Great Union: Bessarabia (March 27), Bukovina (November 28) and Transylvania (December 1, at Alba Iulia) unite with Romania",
      "1940-cutremur-vrancea": "The great Vrancea earthquake (November 10)",
      "1944-august-romania": "August 23: Romania changes sides and joins the Allies; in the fall, northern Transylvania is freed",
      "1945-germanii-ardeal": "Germans from Transylvania and the Banat taken to forced labor in the Soviet Union",
      "1948-nationalizarea-fabricile": "Nationalization: factories, mines and banks pass to the state",
      "1949-colectivizarea-pamantul": "Collectivization: land and animals taken by force for the collective farms; “kulaks” arrested",
      "1949-deportarile-iulie": "The deportations of July 6 to Siberia; the villages become kolkhozes",
      "1949-canalul-dunare": "The Danube–Black Sea Canal, a labor camp for political prisoners",
      "1977-cutremurul-martie": "The earthquake of March 4: almost 1,600 dead, most of them in Bucharest",
      "1981-cartelelor-cozi": "The ration-card years: lines for bread, cold homes and the electricity cut off",
      "1989-revolutia-timisoara": "The Revolution: Timișoara (December 16), then Bucharest; Ceaușescu falls",
    },
  },
};
