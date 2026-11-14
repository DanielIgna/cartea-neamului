/**
 * Cuvântul de la capătul călătoriei în timp, în fiecare limbă a site-ului: același text ca DEFAULT_WORD (scris de Daniel în
 * română), tradus, cu versetele din Biblia clasică a fiecărei limbi (King James, Segond 1910, Reina-Valera 1909,
 * Statenvertaling, Luther 1912, Riveduta 1927, Károli; în ebraică Tanahul masoretic și Noul Testament Delitzsch, bible.com 2220), verificate cuvânt cu cuvânt (memoria „biblii-clasice”).
 * Doar pe server: în browser ajunge numai textul limbii cititorului. Adminul îl poate schimba pe fiecare limbă (src/lib/texte.ts).
 */
import type { Locale } from "@/i18n/locales";
import { DEFAULT_WORD } from "./cuvant-final";

const EN = `## Two family lines, two books
We have gone back through the years from one person to the next, as far as their names have come down to us. But every family line, however long, leads further on, towards the beginning of all families. One of the oldest books in the world keeps two such lines: one at its very beginning and another at the beginning of the New Testament.

## The line of Adam
> This is the book of the generations of Adam. In the day that God created man, in the likeness of God made he him. — Genesis 5:1

Genesis 5 is one of the oldest written genealogies: Adam, Seth, Enos and on, from father to son, and of each one it says that he lived, had sons and daughters, and then he died. It looks like the family line of each of us. None of us chose our parents, our village or the century we were born into, and every story here ends the same way.

## The line of Jesus
> The book of the generation of Jesus Christ, the son of David, the son of Abraham. — Matthew 1:1

The New Testament also begins with a genealogy, but a different one: the family of Jesus of Nazareth, the man from whose birth the world counts its years. The Gospel of John says this about him:

> And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth. — John 1:14

John also writes about another kind of kinship, one that does not come from our parents:

> But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name: Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God. — John 1:12–13

Two lines, then: one we are all born into, and one Jesus speaks about to Nicodemus, a learned man of his time:

> Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God. — John 3:3

## Another book
The book of our family keeps the names of those we love, so that we do not forget them. The ancient texts also speak of another book, and of a life that is not measured in years:

> And this is life eternal, that they might know thee the only true God, and Jesus Christ, whom thou hast sent. — John 17:3

## The truth that sets us free
The journey through history has shown us systems that ruled people through lies, through fear and through manipulation: communism, which took from our grandparents their land, their faith and the freedom to say what they thought, and after it ideologies of every kind that try to rewrite what a human being, the family and truth are. For anyone looking for what stays true when times change, here are two sentences spoken two thousand years ago:

> I am the way, the truth, and the life: no man cometh unto the Father, but by me. — John 14:6

> And ye shall know the truth, and the truth shall make you free. — John 8:32

## For our people and our land
What we received from those before us does not stop with us. Just as one generation leaves its descendants a name, land and memories, so the way it lives becomes an inheritance for its people and its land.

> If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from heaven, and will forgive their sin, and will heal their land. — 2 Chronicles 7:14

## A question for you
You have seen which family you come from. But in which book is your name written?

No one can give you the answer in your place. You look for it yourself.

> For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16`;

const FR = `## Deux lignées, deux livres
Nous avons remonté les années de génération en génération, aussi loin que les noms nous sont parvenus. Mais toute lignée, si longue soit-elle, mène plus loin encore, vers le commencement de toutes les familles. L’un des plus anciens livres du monde garde deux lignées de ce genre : l’une tout au début, l’autre au début du Nouveau Testament.

## La lignée d’Adam
> Voici le livre de la postérité d’Adam. Lorsque Dieu créa l’homme, il le fit à la ressemblance de Dieu. — Genèse 5:1

Genèse 5 est l’une des plus anciennes généalogies écrites : Adam, Seth, Énosch et ainsi de suite, de père en fils, et de chacun il est dit qu’il vécut, engendra des fils et des filles, « puis il mourut ». Elle ressemble à la lignée de chacun de nous. Aucun de nous n’a choisi ses parents, son village ou le siècle de sa naissance, et chaque histoire s’y termine de la même façon.

## La lignée de Jésus
> Généalogie de Jésus Christ, fils de David, fils d’Abraham. — Matthieu 1:1

Le Nouveau Testament commence lui aussi par une généalogie, mais une autre : la famille de Jésus de Nazareth, l’homme à partir de la naissance duquel le monde compte ses années. L’Évangile selon Jean dit de lui :

> Et la parole a été faite chair, et elle a habité parmi nous, pleine de grâce et de vérité. — Jean 1:14

Jean parle aussi d’une autre sorte de parenté, qui ne vient pas de nos parents :

> Mais à tous ceux qui l’ont reçue, à ceux qui croient en son nom, elle a donné le pouvoir de devenir enfants de Dieu, lesquels sont nés, non du sang, ni de la volonté de la chair, ni de la volonté de l’homme, mais de Dieu. — Jean 1:12–13

Deux lignées, donc : celle où nous naissons tous, et celle dont Jésus parle à Nicodème, un savant de son temps :

> En vérité, en vérité, je te le dis, si un homme ne naît de nouveau, il ne peut voir le royaume de Dieu. — Jean 3:3

## Un autre livre
Le livre de notre famille garde les noms de ceux que nous aimons, pour que nous ne les oubliions pas. Les textes anciens parlent aussi d’un autre livre, et d’une vie qui ne se mesure pas en années :

> Or, la vie éternelle, c’est qu’ils te connaissent, toi, le seul vrai Dieu, et celui que tu as envoyé, Jésus-Christ. — Jean 17:3

## La vérité qui rend libre
Le voyage à travers l’histoire nous a montré des systèmes qui ont dominé les hommes par le mensonge, la peur et la manipulation : le communisme, qui a pris à nos grands-parents leur terre, leur foi et la liberté de dire ce qu’ils pensaient, puis des idéologies de toutes sortes qui cherchent à réécrire ce que sont l’homme, la famille et la vérité. Pour qui cherche ce qui reste vrai quand les temps changent, voici deux phrases prononcées il y a deux mille ans :

> Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi. — Jean 14:6

> vous connaîtrez la vérité, et la vérité vous affranchira. — Jean 8:32

## Pour notre peuple et notre pays
Ce que nous avons reçu de nos ancêtres ne s’arrête pas à nous. De même qu’une génération laisse à ses descendants un nom, une terre et des souvenirs, la façon dont elle vit devient un héritage pour son peuple et son pays.

> si mon peuple sur qui est invoqué mon nom s’humilie, prie, et cherche ma face, et s’il se détourne de ses mauvaises voies, – je l’exaucerai des cieux, je lui pardonnerai son péché, et je guérirai son pays. — 2 Chroniques 7:14

## Une question pour vous
Vous avez vu de quelle famille vous descendez. Mais dans quel livre votre nom est-il écrit ?

Personne ne peut vous donner la réponse à votre place. Vous la cherchez vous-même.

> Car Dieu a tant aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu’il ait la vie éternelle. — Jean 3:16`;

const ES = `## Dos linajes, dos libros
Hemos retrocedido en los años de una persona a otra, hasta donde nos han llegado los nombres. Pero todo linaje, por largo que sea, lleva más lejos, hacia el principio de todas las familias. Uno de los libros más antiguos del mundo guarda dos linajes así: uno al comienzo mismo y otro al comienzo del Nuevo Testamento.

## El linaje de Adán
> Este es el libro de las generaciones de Adam. El día en que crió Dios al hombre, a la semejanza de Dios lo hizo. — Génesis 5:1

Génesis 5 es una de las genealogías escritas más antiguas: Adán, Set, Enós y así sucesivamente, de padre a hijo, y de cada uno se dice que vivió, tuvo hijos e hijas, «y murió». Se parece al linaje de cada uno de nosotros. Ninguno eligió a sus padres, su pueblo ni el siglo en que nació, y cada historia de aquí termina igual.

## El linaje de Jesús
> Libro de la generación de Jesucristo, hijo de David, hijo de Abraham. — Mateo 1:1

El Nuevo Testamento también comienza con una genealogía, pero otra: la familia de Jesús de Nazaret, el hombre desde cuyo nacimiento el mundo cuenta sus años. El Evangelio de Juan dice de él:

> Y aquel Verbo fue hecho carne, y habitó entre nosotros (y vimos su gloria, gloria como del unigénito del Padre), lleno de gracia y de verdad. — Juan 1:14

Juan escribe también sobre otro tipo de parentesco, que no viene de los padres:

> Mas a todos los que le recibieron, dioles potestad de ser hechos hijos de Dios, a los que creen en su nombre: los cuales no son engendrados de sangre, ni de voluntad de carne, ni de voluntad de varón, sino de Dios. — Juan 1:12–13

Dos linajes, pues: uno en el que nacemos todos y otro del que Jesús le habla a Nicodemo, un hombre instruido de su tiempo:

> De cierto, de cierto te digo, que el que no naciere otra vez, no puede ver el reino de Dios. — Juan 3:3

## Otro libro
El libro de nuestra familia guarda los nombres de nuestros seres queridos, para que no los olvidemos. Los textos antiguos hablan también de otro libro y de una vida que no se mide en años:

> Esta empero es la vida eterna: que te conozcan el solo Dios verdadero, y a Jesucristo, al cual has enviado. — Juan 17:3

## La verdad que hace libres
El viaje por la historia nos ha mostrado sistemas que dominaron a las personas mediante la mentira, el miedo y la manipulación: el comunismo, que les quitó a nuestros abuelos la tierra, la fe y la libertad de decir lo que pensaban, y después ideologías de toda clase que intentan reescribir qué es el ser humano, la familia y la verdad. Para quien busca lo que sigue siendo verdad cuando cambian los tiempos, aquí hay dos frases dichas hace dos mil años:

> Yo soy el camino, y la verdad, y la vida; nadie viene al Padre sino por mí. — Juan 14:6

> y conoceréis la verdad, y la verdad os hará libres. — Juan 8:32

## Por nuestro pueblo y nuestra tierra
Lo que recibimos de nuestros antepasados no se detiene en nosotros. Así como una generación deja a sus descendientes un nombre, una tierra y recuerdos, la forma en que vive se convierte en herencia para su pueblo y su tierra.

> Si se humillare mi pueblo, sobre los cuales mi nombre es invocado, y oraren, y buscaren mi rostro, y se convirtieren de sus malos caminos; entonces yo oiré desde los cielos, y perdonaré sus pecados, y sanaré su tierra. — 2 Crónicas 7:14

## Una pregunta para ti
Has visto de qué familia vienes. Pero ¿en qué libro está escrito tu nombre?

Nadie puede darte la respuesta en tu lugar. La buscas tú mismo.

> Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna. — Juan 3:16`;

const NL = `## Twee geslachtslijnen, twee boeken
We zijn door de jaren teruggegaan van mens tot mens, zo ver als hun namen bewaard zijn gebleven. Maar elke geslachtslijn, hoe lang ook, leidt verder, naar het begin van alle families. Een van de oudste boeken ter wereld bewaart twee zulke lijnen: een helemaal aan het begin en een aan het begin van het Nieuwe Testament.

## De lijn van Adam
> Dit is het boek van Adams geslacht. Ten dage als God den mens schiep, maakte Hij hem naar de gelijkenis Gods. — Genesis 5:1

Genesis 5 is een van de oudste geschreven genealogieën: Adam, Seth, Enos en verder, van vader op zoon, en van ieder staat er dat hij leefde, zonen en dochters kreeg, ‘en hij stierf’. Ze lijkt op de geslachtslijn van ieder van ons. Niemand van ons koos zijn ouders, zijn dorp of de eeuw waarin hij geboren werd, en elk verhaal hier eindigt op dezelfde manier.

## De lijn van Jezus
> Het boek des geslachts van Jezus Christus, den Zoon van David, den zoon van Abraham. — Mattheüs 1:1

Het Nieuwe Testament begint ook met een genealogie, maar een andere: de familie van Jezus van Nazareth, de man vanaf wiens geboorte de wereld haar jaren telt. Het Evangelie naar Johannes zegt over hem:

> En het Woord is vlees geworden, en heeft onder ons gewoond (en wij hebben Zijn heerlijkheid aanschouwd, een heerlijkheid als des Eniggeborenen van den Vader), vol van genade en waarheid. — Johannes 1:14

Johannes schrijft ook over een ander soort verwantschap, die niet van onze ouders komt:

> Maar zovelen Hem aangenomen hebben, dien heeft Hij macht gegeven kinderen Gods te worden, namelijk die in Zijn Naam geloven; Welke niet uit den bloede, noch uit den wil des vleses, noch uit den wil des mans, maar uit God geboren zijn. — Johannes 1:12–13

Twee lijnen dus: een waarin we allemaal geboren worden, en een waarover Jezus spreekt met Nicodemus, een geleerde van zijn tijd:

> Voorwaar, voorwaar zeg Ik u: Tenzij dat iemand wederom geboren worde, hij kan het Koninkrijk Gods niet zien. — Johannes 3:3

## Een ander boek
Het boek van onze familie bewaart de namen van wie ons dierbaar is, zodat we hen niet vergeten. De oude teksten spreken ook over een ander boek, en over een leven dat niet in jaren wordt gemeten:

> En dit is het eeuwige leven, dat zij U kennen, den enigen waarachtigen God, en Jezus Christus, Dien Gij gezonden hebt. — Johannes 17:3

## De waarheid die vrijmaakt
De reis door de geschiedenis heeft ons systemen laten zien die mensen beheersten door leugens, angst en manipulatie: het communisme, dat onze grootouders hun land, hun geloof en de vrijheid om te zeggen wat ze dachten afnam, en daarna allerlei ideologieën die proberen te herschrijven wat een mens, het gezin en de waarheid zijn. Voor wie zoekt wat waar blijft als de tijden veranderen, hier twee zinnen die tweeduizend jaar geleden zijn uitgesproken:

> Ik ben de Weg, en de Waarheid, en het Leven. Niemand komt tot den Vader, dan door Mij. — Johannes 14:6

> En zult de waarheid verstaan, en de waarheid zal u vrijmaken. — Johannes 8:32

## Voor ons volk en ons land
Wat we van onze voorouders hebben ontvangen, houdt niet bij ons op. Zoals een generatie haar nakomelingen een naam, land en herinneringen nalaat, zo wordt de manier waarop zij leeft een erfenis voor haar volk en haar land.

> En Mijn volk, over dewelken Mijn Naam genoemd wordt, zich verootmoedigt en bidt, en zij Mijn aangezicht zoeken, en zich bekeren van hun boze wegen; zo zal Ik uit den hemel horen, en hun zonden vergeven, en hun land genezen. — 2 Kronieken 7:14

## Een vraag voor jou
Je hebt gezien uit welke familie je komt. Maar in welk boek staat jouw naam geschreven?

Niemand kan je het antwoord in jouw plaats geven. Je zoekt het zelf.

> Want alzo lief heeft God de wereld gehad, dat Hij Zijn eniggeboren Zoon gegeven heeft, opdat een iegelijk die in Hem gelooft, niet verderve, maar het eeuwige leven hebbe. — Johannes 3:16`;

const DE = `## Zwei Stammlinien, zwei Bücher
Wir sind durch die Jahre von Mensch zu Mensch zurückgegangen, so weit uns die Namen überliefert sind. Doch jede Stammlinie, wie lang sie auch sei, führt weiter, zum Anfang aller Familien. Eines der ältesten Bücher der Welt bewahrt zwei solche Linien: eine ganz an seinem Anfang und eine am Anfang des Neuen Testaments.

## Die Linie Adams
> Dies ist das Buch von des Menschen Geschlecht. Da Gott den Menschen schuf, machte er ihn nach dem Bilde Gottes. — 1. Mose 5,1

1. Mose 5 ist eine der ältesten geschriebenen Genealogien: Adam, Set, Enosch und weiter, vom Vater zum Sohn, und von jedem heißt es, dass er lebte, Söhne und Töchter zeugte, „und starb“. Sie gleicht der Stammlinie jedes von uns. Keiner hat seine Eltern, sein Dorf oder das Jahrhundert seiner Geburt gewählt, und jede Geschichte dort endet gleich.

## Die Linie Jesu
> Dies ist das Buch von der Geburt Jesu Christi, der da ist ein Sohn Davids, des Sohnes Abrahams. — Matthäus 1,1

Auch das Neue Testament beginnt mit einer Genealogie, aber einer anderen: der Familie Jesu von Nazareth, des Mannes, von dessen Geburt an die Welt ihre Jahre zählt. Das Johannesevangelium sagt über ihn:

> Und das Wort ward Fleisch und wohnte unter uns, und wir sahen seine Herrlichkeit, eine Herrlichkeit als des eingeborenen Sohnes vom Vater, voller Gnade und Wahrheit. — Johannes 1,14

Johannes schreibt auch von einer anderen Art von Verwandtschaft, die nicht von den Eltern kommt:

> Wie viele ihn aber aufnahmen, denen gab er Macht, Gottes Kinder zu werden, die an seinen Namen glauben; welche nicht von dem Geblüt noch von dem Willen des Fleisches noch von dem Willen eines Mannes, sondern von Gott geboren sind. — Johannes 1,12–13

Zwei Linien also: eine, in die wir alle hineingeboren werden, und eine, von der Jesus zu Nikodemus spricht, einem Gelehrten seiner Zeit:

> Wahrlich, wahrlich, ich sage dir: Es sei denn, dass jemand von neuem geboren werde, so kann er das Reich Gottes nicht sehen. — Johannes 3,3

## Ein anderes Buch
Das Buch unserer Familie bewahrt die Namen unserer Lieben, damit wir sie nicht vergessen. Die alten Texte sprechen auch von einem anderen Buch und von einem Leben, das nicht in Jahren gemessen wird:

> Das ist aber das ewige Leben, dass sie dich, der du allein wahrer Gott bist, und den du gesandt hast, Jesum Christum, erkennen. — Johannes 17,3

## Die Wahrheit, die frei macht
Die Reise durch die Geschichte hat uns Systeme gezeigt, die Menschen durch Lüge, Angst und Manipulation beherrschten: den Kommunismus, der unseren Großeltern ihr Land, ihren Glauben und die Freiheit nahm, zu sagen, was sie dachten, und nach ihm Ideologien aller Art, die umschreiben wollen, was der Mensch, die Familie und die Wahrheit sind. Für alle, die suchen, was wahr bleibt, wenn sich die Zeiten ändern, hier zwei Sätze, die vor zweitausend Jahren gesprochen wurden:

> Ich bin der Weg und die Wahrheit und das Leben; niemand kommt zum Vater denn durch mich. — Johannes 14,6

> und werdet die Wahrheit erkennen; und die Wahrheit wird euch freimachen. — Johannes 8,32

## Für unser Volk und unser Land
Was wir von den Vorfahren empfangen haben, hört nicht bei uns auf. So wie eine Generation ihren Nachkommen einen Namen, Land und Erinnerungen hinterlässt, so wird die Art, wie sie lebt, zum Erbe für ihr Volk und ihr Land.

> und mein Volk sich demütigt, das nach meinem Namen genannt ist, dass sie beten und mein Angesicht suchen und sich von ihren bösen Wegen bekehren werden: so will ich vom Himmel hören und ihre Sünde vergeben und ihr Land heilen. — 2. Chronik 7,14

## Eine Frage an dich
Du hast gesehen, aus welcher Familie du stammst. Aber in welchem Buch steht dein Name geschrieben?

Die Antwort kann dir niemand abnehmen. Du suchst sie selbst.

> Also hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, auf dass alle, die an ihn glauben, nicht verloren werden, sondern das ewige Leben haben. — Johannes 3,16`;

const IT = `## Due stirpi, due libri
Siamo risaliti negli anni di persona in persona, fin dove i nomi ci sono giunti. Ma ogni stirpe, per quanto lunga, porta più lontano, verso l’inizio di tutte le famiglie. Uno dei libri più antichi del mondo custodisce due stirpi così: una proprio all’inizio e un’altra all’inizio del Nuovo Testamento.

## La stirpe di Adamo
> Questo è il libro della posterità d’Adamo. Nel giorno che Dio creò l’uomo, lo fece a somiglianza di Dio. — Genesi 5:1

Genesi 5 è una delle più antiche genealogie scritte: Adamo, Seth, Enos e avanti, di padre in figlio, e di ciascuno si dice che visse, ebbe figli e figlie, «poi morì». Somiglia alla stirpe di ognuno di noi. Nessuno ha scelto i propri genitori, il proprio villaggio o il secolo in cui è nato, e ogni storia lì finisce allo stesso modo.

## La stirpe di Gesù
> Libro della generazione di Gesù Cristo, figliuolo di Davide, figliuolo di Abrahamo. — Matteo 1:1

Anche il Nuovo Testamento comincia con una genealogia, ma un’altra: la famiglia di Gesù di Nazaret, l’uomo dalla cui nascita il mondo conta i suoi anni. Il Vangelo di Giovanni dice di lui:

> E la Parola è stata fatta carne ed ha abitato per un tempo fra noi, piena di grazia e di verità. — Giovanni 1:14

Giovanni scrive anche di un altro tipo di parentela, che non viene dai genitori:

> ma a tutti quelli che l’hanno ricevuto egli ha dato il diritto di diventar figliuoli di Dio; a quelli, cioè, che credono nel suo nome; i quali, non di sangue, nè di volontà di carne, nè di volontà d’uomo, ma son nati di Dio. — Giovanni 1:12–13

Due stirpi, dunque: una in cui nasciamo tutti e una di cui Gesù parla a Nicodemo, un uomo dotto del suo tempo:

> In verità, in verità, io ti dico, che se alcuno non è nato di nuovo, non può vedere il regno di Dio. — Giovanni 3:3

## Un altro libro
Il libro della nostra famiglia custodisce i nomi delle persone care, perché non le dimentichiamo. I testi antichi parlano anche di un altro libro, e di una vita che non si misura in anni:

> E questa è la vita eterna: che conoscano te, il solo vero Dio, e colui che tu hai mandato, Gesù Cristo. — Giovanni 17:3

## La verità che rende liberi
Il viaggio nella storia ci ha mostrato sistemi che hanno dominato gli uomini con la menzogna, la paura e la manipolazione: il comunismo, che ha tolto ai nostri nonni la terra, la fede e la libertà di dire ciò che pensavano, e dopo di esso ideologie di ogni genere che cercano di riscrivere che cosa siano l’uomo, la famiglia e la verità. Per chi cerca ciò che resta vero quando i tempi cambiano, ecco due frasi pronunciate duemila anni fa:

> Io son la via, la verità, e la vita; niuno viene al Padre se non per me. — Giovanni 14:6

> e conoscerete la verità, e la verità vi farà liberi. — Giovanni 8:32

## Per il nostro popolo e la nostra terra
Ciò che abbiamo ricevuto dagli antenati non si ferma a noi. Come una generazione lascia ai discendenti un nome, una terra e dei ricordi, così il modo in cui vive diventa un’eredità per il suo popolo e la sua terra.

> se il mio popolo, sul quale è invocato il mio nome si umilia, prega, cerca la mia faccia e si converte dalle sue vie malvage, io lo esaudirò dal cielo, gli perdonerò i suoi peccati, e guarirò il suo paese. — 2 Cronache 7:14

## Una domanda per te
Hai visto da quale famiglia discendi. Ma in quale libro è scritto il tuo nome?

Nessuno può darti la risposta al posto tuo. La cerchi da solo.

> Poiché Iddio ha tanto amato il mondo, che ha dato il suo unigenito Figliuolo, affinché chiunque crede in lui non perisca, ma abbia vita eterna. — Giovanni 3:16`;

const HU = `## Két nemzetség, két könyv
Emberről emberre visszamentünk az években, ameddig a nevek fennmaradtak. De minden nemzetség, bármilyen hosszú, tovább vezet, minden család kezdetéig. A világ egyik legrégebbi könyve két ilyen nemzetséget őriz: az egyiket egészen az elején, a másikat az Újszövetség elején.

## Ádám nemzetsége
> Ez az Ádám nemzetségének könyve. Amely napon teremté Isten az embert, Isten hasonlatosságára teremté azt. — 1Mózes 5,1

Mózes első könyvének 5. része az egyik legrégebbi írott nemzetségtábla: Ádám, Séth, Énós és tovább, apáról fiúra, és mindegyikről azt írja, hogy élt, fiakat és leányokat nemzett, „és meghalt”. Olyan, mint bármelyikünk családfája. Egyikünk sem választotta a szüleit, a faluját vagy a századot, amelyben született, és ott minden történet ugyanúgy végződik.

## Jézus nemzetsége
> Jézus Krisztusnak, Dávid fiának, Ábrahám fiának nemzetségéről való könyv. — Máté 1,1

Az Újszövetség is egy nemzetségtáblával kezdődik, de egy másikkal: a názáreti Jézus családjával, annak az embernek a családjával, akinek születésétől számolja a világ az éveit. János evangéliuma így ír róla:

> És az Ige testté lett és lakozék mi közöttünk (és láttuk az ő dicsőségét, mint az Atya egyszülöttjének dicsőségét), aki teljes vala kegyelemmel és igazsággal. — János 1,14

János egy másfajta rokonságról is ír, amely nem a szüleinktől jön:

> Valakik pedig befogadák őt, hatalmat ada azoknak, hogy Isten fiaivá legyenek, azoknak, akik az ő nevében hisznek; akik nem vérből, sem a testnek akaratából, sem a férfiúnak indulatjából, hanem Istentől születtek. — János 1,12–13

Két nemzetség tehát: az egyik, amelybe mindannyian beleszületünk, és a másik, amelyről Jézus Nikodémusnak, kora egyik tanult emberének beszél:

> Bizony, bizony mondom néked: ha valaki újonnan nem születik, nem láthatja az Isten országát. — János 3,3

## Egy másik könyv
Családunk könyve megőrzi szeretteink nevét, hogy el ne felejtsük őket. A régi szövegek egy másik könyvről is beszélnek, és egy életről, amelyet nem években mérnek:

> Az pedig az örök élet, hogy megismerjenek téged, az egyedül igaz Istent, és akit elküldtél, a Jézus Krisztust. — János 17,3

## Az igazság, amely szabaddá tesz
Az időutazás olyan rendszereket mutatott meg, amelyek hazugsággal, félelemmel és manipulációval uralkodtak az embereken: a kommunizmust, amely elvette nagyszüleinktől a földjüket, a hitüket és a szabadságot, hogy kimondják, amit gondolnak, utána pedig mindenféle ideológiát, amely át akarja írni, mi az ember, a család és az igazság. Aki azt keresi, mi marad igaz, amikor az idők változnak, annak itt van két mondat, amelyet kétezer éve mondtak ki:

> Én vagyok az út, az igazság és az élet; senki sem mehet az Atyához, hanemha én általam. — János 14,6

> És megismeritek az igazságot, és az igazság szabadokká tesz titeket. — János 8,32

## Népünkért és hazánkért
Amit az elődeinktől kaptunk, nem áll meg nálunk. Ahogy egy nemzedék nevet, földet és emlékeket hagy utódaira, úgy válik az, ahogyan él, örökséggé népe és hazája számára.

> És megalázza magát az én népem, amely nevemről neveztetik, s könyörög és keresi az én arcomat, és felhagy az ő bűnös életmódjával: én is meghallgatom őket a mennyből, megbocsátom bűneiket, és megszabadítom földjüket. — 2Krónikák 7,14

## Egy kérdés neked
Láttad, milyen családból származol. De melyik könyvbe van beírva a neved?

A választ senki sem adhatja meg helyetted. Magad keresed.

> Mert úgy szerette Isten e világot, hogy az ő egyszülött Fiát adta, hogy valaki hiszen ő benne, el ne vesszen, hanem örök élete legyen. — János 3,16`;

const HE = `## שתי שושלות, שני ספרים
ירדנו בשנים מאדם לאדם, עד המקום שאליו הגיעו אלינו שמותיהם. אבל כל שושלת, ארוכה ככל שתהיה, מובילה הלאה, אל ראשית כל המשפחות. אחד הספרים העתיקים בעולם שומר שתי שושלות כאלה: אחת ממש בתחילתו, ואחרת בתחילת הברית החדשה.

## שושלת אדם
> זה ספר תולדת אדם ביום ברא אלהים אדם בדמות אלהים עשה אתו — בראשית ה, א

פרק ה בספר בראשית הוא אחד מספרי היוחסין הכתובים העתיקים ביותר: אדם, שת, אנוש והלאה, מאב לבן, ועל כל אחד נאמר שחי, הוליד בנים ובנות, ומת. הוא דומה לשושלת המשפחה של כל אחד מאיתנו. איש מאיתנו לא בחר את הוריו, את הכפר שלו או את המאה שבה נולד, וכל סיפור כאן נגמר באותה דרך.

## שושלת ישוע
> ספר תולדת ישוע המשיח בן־דוד בן־אברהם — מתי א, א

גם הברית החדשה נפתחת בספר יוחסין, אבל אחר: משפחתו של ישוע מנצרת, האיש שלפי לידתו רוב העולם סופר את שנותיו. הבשורה של יוחנן אומרת עליו כך:

> והדבר נהיה בשר וישכן בתוכנו ונחזה כבודו ככבוד בן יחיד לאביו רב־חסד ואמת — יוחנן א, יד

יוחנן כותב גם על קרבה מסוג אחר, שאינה באה מההורים שלנו:

> והמקבלים אתו המאמינים בשמו נתן־עז למו להיות בנים לאלהים אשר לא מדם ולא מחפץ הבשר אף לא־מחפץ גבר נולדו כי אם־מאלהים — יוחנן א, יב–יג

אם כן, שתי שושלות: אחת שבה כולנו נולדים, ואחת שעליה מדבר ישוע אל נקדימון, איש למדן בן זמנו:

> אמן אמן אני אמר לך אם־לא יולד איש מלמעלה לא־יוכל לראות את־מלכות האלהים — יוחנן ג, ג

## ספר אחר
ספר המשפחה שלנו שומר את שמות האנשים שאנחנו אוהבים, כדי שלא נשכח אותם. הטקסטים העתיקים מדברים גם על ספר אחר, ועל חיים שאינם נמדדים בשנים:

> ואלה הם חיי העולם לדעת אתך כי אתה האלהים לבדך ואת־ישוע המשיח אשר שלחת — יוחנן יז, ג

## האמת שמשחררת
המסע בהיסטוריה הראה לנו שיטות ששלטו באנשים בשקר, בפחד ובמניפולציה: הקומוניזם, שלקח מהסבים שלנו את האדמה, את האמונה ואת החופש לומר מה שחשבו, ואחריו אידאולוגיות מכל הסוגים שמנסות לכתוב מחדש מה הם האדם, המשפחה והאמת. למי שמחפש את מה שנשאר אמת כשהזמנים משתנים, הנה שני משפטים שנאמרו לפני אלפיים שנה:

> אנכי הדרך והאמת והחיים לא־יבא איש אל־האב בלתי על־ידי — יוחנן יד, ו

> וידעתם את האמת והאמת תוציאכם לחרות — יוחנן ח, לב

## למען העם והארץ שלנו
מה שקיבלנו מאלה שלפנינו לא נעצר אצלנו. כמו שדור מוריש לצאצאיו שם, אדמה וזיכרונות, כך גם הדרך שבה הוא חי הופכת לירושה לעמו ולארצו.

> ויכנעו עמי אשר נקרא־שמי עליהם ויתפללו ויבקשו פני וישבו מדרכיהם הרעים ואני אשמע מן־השמים ואסלח לחטאתם וארפא את־ארצם — דברי הימים ב ז, יד

## שאלה בשבילכם
ראיתם מאיזו משפחה אתם באים. אבל באיזה ספר כתוב השם שלכם?

איש לא יכול לתת לכם את התשובה במקומכם. מחפשים אותה בעצמכם.

> כי־אהבה רבה אהב האלהים את־העולם עד־אשר נתן את־בנו את־יחידו למען אשר לא־יאבד כל־המאמין בו כי אם־יחיה חיי עולם — יוחנן ג, טז`;

/** Textul de bază din cod, pe limbi (româna e chiar DEFAULT_WORD; engleza americană citește același text ca cea britanică). */
export const DEFAULT_WORDS: Record<Locale, string> = {
  ro: DEFAULT_WORD, "en-GB": EN, "en-US": EN, fr: FR, es: ES, nl: NL, de: DE, it: IT, hu: HU, he: HE,
};
