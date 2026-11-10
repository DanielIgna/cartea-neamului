/**
 * Cuvântul de la capătul călătoriei în timp, în fiecare limbă a site-ului: același text ca DEFAULT_WORD (scris de Daniel în
 * română), tradus, cu versetele din Biblia clasică a fiecărei limbi (King James, Segond 1910, Reina-Valera 1909,
 * Statenvertaling, Luther 1912, Riveduta 1927, Károli), verificate cuvânt cu cuvânt (memoria „biblii-clasice”).
 * Doar pe server: în browser ajunge numai textul limbii cititorului. Adminul îl poate schimba pe fiecare limbă (src/lib/texte.ts).
 */
import type { Locale } from "@/i18n/locales";
import { DEFAULT_WORD } from "./cuvant-final";

const EN = `## Two family lines, two books
We have gone back through the years from one person to the next, as far as their names have come down to us. But every family line, however long, leads further on, to the beginning of all families. The Bible keeps two family lines, and everyone is called to find out in which of them they are written.

## The line of Adam
> This is the book of the generations of Adam. In the day that God created man, in the likeness of God made he him. — Genesis 5:1

Genesis 5 is the first family line in the Bible: Adam, Seth, Enos and on, from father to son, and of each one it says that he lived, had sons and daughters, and then he died. It is our line too. None of us chose our parents, our village or the century we came into the world in: we were born without asking to be, descendants of Adam, and we all carry the same inheritance, sin and death.

## The line of Jesus Christ
> The book of the generation of Jesus Christ, the son of David, the son of Abraham. — Matthew 1:1

The New Testament also begins with a family line, but a different one: the line of Jesus Christ. The Son of God took on human form and lived among us.

> And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth. — John 1:14

He is the Lamb of God, who was nailed to the cross and died in my place and in yours, whoever you are. You enter His line through faith:

> But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name: Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God. — John 1:12–13

We are all born in Adam. We are all called to believe in Christ and to be born again in Him.

> Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God. — John 3:3

## The Book of Life
The book of our family keeps the names of those we love, so that we do not forget them. But there is a book that matters more than any other book: the Book of Life. In it are written those who have received the Lord Jesus Christ as the Saviour of their life. They have a heavenly calling: to live in the world holy and blameless, that is, set apart for God, to do His will and, in the end, to inherit immortality.

> And this is life eternal, that they might know thee the only true God, and Jesus Christ, whom thou hast sent. — John 17:3

## The truth that sets us free
The journey through history has shown us systems that ruled people through lies, through fear and through manipulation: communism, which took from our grandparents their land, their faith and the freedom to say what they thought, and after it ideologies of every kind, from neo-Marxism to the present day, which try to rewrite what a human being, the family and the truth are. In the Word of God there is a Truth that does not change, and this Truth is not an idea but a Person: Jesus Christ Himself.

> I am the way, the truth, and the life: no man cometh unto the Father, but by me. — John 14:6

> And ye shall know the truth, and the truth shall make you free. — John 8:32

## For our people and our land
What we received from those before us does not stop with us. Just as one generation leaves its descendants a name, land and memories, so the humility and prayer of one generation become a blessing for its people and its land.

> If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from heaven, and will forgive their sin, and will heal their land. — 2 Chronicles 7:14

## A question for you
You have seen which family you come from. But in which book is your name written?

God has left us a love letter: the Bible, His Word. We invite you to open it and read it. You can begin with the Gospel of John.

> For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16`;

const FR = `## Deux lignées, deux livres
Nous avons remonté les années de génération en génération, aussi loin que les noms nous sont parvenus. Mais toute lignée, si longue soit-elle, mène plus loin encore, au commencement de toutes les familles. La Bible garde deux lignées, et chacun est appelé à découvrir dans laquelle il est inscrit.

## La lignée d’Adam
> Voici le livre de la postérité d’Adam. Lorsque Dieu créa l’homme, il le fit à la ressemblance de Dieu. — Genèse 5:1

Genèse 5 est la première lignée de la Bible : Adam, Seth, Énosch et ainsi de suite, de père en fils, et de chacun il est dit qu’il vécut, qu’il engendra des fils et des filles, puis qu’il mourut. C’est aussi notre lignée. Aucun de nous n’a choisi ses parents, son village ni le siècle où il est venu au monde : nous sommes nés sans l’avoir voulu, descendants d’Adam, et nous portons tous le même héritage, le péché et la mort.

## La lignée de Jésus-Christ
> Généalogie de Jésus Christ, fils de David, fils d’Abraham. — Matthieu 1:1

Le Nouveau Testament commence lui aussi par une lignée, mais une autre : la lignée de Jésus-Christ. Le Fils de Dieu a pris forme humaine et a habité parmi nous.

> Et la parole a été faite chair, et elle a habité parmi nous, pleine de grâce et de vérité. — Jean 1:14

Il est l’Agneau de Dieu, qui a été cloué sur la croix et qui est mort à ma place et à la vôtre, qui que vous soyez. On entre dans Sa lignée par la foi :

> Mais à tous ceux qui l’ont reçue, à ceux qui croient en son nom, elle a donné le pouvoir de devenir enfants de Dieu, lesquels sont nés, non du sang, ni de la volonté de la chair, ni de la volonté de l’homme, mais de Dieu. — Jean 1:12–13

Nous naissons tous en Adam. Nous sommes tous appelés à croire en Christ et à naître de nouveau en Lui.

> En vérité, en vérité, je te le dis, si un homme ne naît de nouveau, il ne peut voir le royaume de Dieu. — Jean 3:3

## Le livre de vie
Le livre de notre famille garde les noms de ceux que nous aimons, pour que nous ne les oubliions pas. Mais il existe un livre qui compte plus que tout autre livre : le livre de vie. Y sont inscrits ceux qui ont reçu le Seigneur Jésus-Christ comme le Sauveur de leur vie. Ils ont une vocation céleste : vivre dans le monde saints et irréprochables, c’est-à-dire mis à part pour Dieu, faire Sa volonté et, à la fin, hériter l’immortalité.

> Or, la vie éternelle, c’est qu’ils te connaissent, toi, le seul vrai Dieu, et celui que tu as envoyé, Jésus-Christ. — Jean 17:3

## La vérité qui rend libre
Le voyage à travers l’histoire nous a montré des systèmes qui ont dominé les hommes par le mensonge, par la peur et par la manipulation : le communisme, qui a pris à nos grands-parents leur terre, leur foi et la liberté de dire ce qu’ils pensaient, et après lui des idéologies de toutes sortes, du néomarxisme jusqu’à aujourd’hui, qui tentent de réécrire ce qu’est l’homme, la famille et la vérité. Dans la Parole de Dieu, il y a une Vérité qui ne change pas, et cette Vérité n’est pas une idée, mais une Personne : Jésus-Christ Lui-même.

> Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi. — Jean 14:6

> vous connaîtrez la vérité, et la vérité vous affranchira. — Jean 8:32

## Pour notre peuple et notre pays
Ce que nous avons reçu de nos ancêtres ne s’arrête pas à nous. De même qu’une génération laisse à ses descendants un nom, une terre et des souvenirs, l’humilité et la prière d’une génération deviennent une bénédiction pour son peuple et pour son pays.

> si mon peuple sur qui est invoqué mon nom s’humilie, prie, et cherche ma face, et s’il se détourne de ses mauvaises voies, – je l’exaucerai des cieux, je lui pardonnerai son péché, et je guérirai son pays. — 2 Chroniques 7:14

## Une question pour vous
Vous avez vu de quelle famille vous venez. Mais dans quel livre votre nom est-il écrit ?

Dieu nous a laissé une lettre d’amour : la Bible, Sa Parole. Nous vous invitons à l’ouvrir et à la lire. Vous pouvez commencer par l’Évangile selon Jean.

> Car Dieu a tant aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu’il ait la vie éternelle. — Jean 3:16`;

const ES = `## Dos linajes, dos libros
Hemos bajado por los años de persona en persona, hasta donde nos han llegado los nombres. Pero todo linaje, por largo que sea, lleva más allá, al principio de todas las familias. La Biblia guarda dos linajes, y cada persona está llamada a descubrir en cuál de ellos está escrita.

## El linaje de Adán
> Este es el libro de las generaciones de Adam. El día en que crió Dios al hombre, a la semejanza de Dios lo hizo. — Génesis 5:1

Génesis 5 es el primer linaje de la Biblia: Adán, Set, Enós y así sucesivamente, de padre a hijo, y de cada uno se dice que vivió, engendró hijos e hijas, y después murió. Es también nuestro linaje. Ninguno de nosotros eligió a sus padres, su pueblo ni el siglo en que vino al mundo: nacimos sin haberlo decidido, descendientes de Adán, y todos llevamos la misma herencia, el pecado y la muerte.

## El linaje de Jesucristo
> Libro de la generación de Jesucristo, hijo de David, hijo de Abraham. — Mateo 1:1

El Nuevo Testamento también empieza con un linaje, pero con otro: el linaje de Jesucristo. El Hijo de Dios tomó forma humana y habitó entre nosotros.

> Y aquel Verbo fue hecho carne, y habitó entre nosotros (y vimos su gloria, gloria como del unigénito del Padre), lleno de gracia y de verdad. — Juan 1:14

Él es el Cordero de Dios, que fue clavado en la cruz y murió en mi lugar y en el tuyo, seas quien seas. En Su linaje se entra por la fe:

> Mas a todos los que le recibieron, dioles potestad de ser hechos hijos de Dios, a los que creen en su nombre: los cuales no son engendrados de sangre, ni de voluntad de carne, ni de voluntad de varón, sino de Dios. — Juan 1:12–13

Todos nacemos en Adán. Todos estamos llamados a creer en Cristo y a nacer de nuevo en Él.

> De cierto, de cierto te digo, que el que no naciere otra vez, no puede ver el reino de Dios. — Juan 3:3

## El libro de la vida
El libro de nuestra familia guarda los nombres de nuestros seres queridos, para que no los olvidemos. Pero hay un libro que importa más que cualquier otro libro: el libro de la vida. En él están escritos los que han recibido al Señor Jesucristo como el Salvador de su vida. Tienen un llamamiento celestial: vivir en el mundo santos e irreprensibles, es decir, apartados para Dios, hacer Su voluntad y, al final, heredar la inmortalidad.

> Esta empero es la vida eterna: que te conozcan el solo Dios verdadero, y a Jesucristo, al cual has enviado. — Juan 17:3

## La verdad que nos hace libres
El viaje por la historia nos ha mostrado sistemas que dominaron a las personas con la mentira, con el miedo y con la manipulación: el comunismo, que les quitó a nuestros abuelos la tierra, la fe y la libertad de decir lo que pensaban, y después de él ideologías de todo tipo, desde el neomarxismo hasta hoy, que intentan reescribir qué es el ser humano, la familia y la verdad. En la Palabra de Dios hay una Verdad que no cambia, y esa Verdad no es una idea, sino una Persona: el mismo Jesucristo.

> Yo soy el camino, y la verdad, y la vida; nadie viene al Padre sino por mí. — Juan 14:6

> y conoceréis la verdad, y la verdad os hará libres. — Juan 8:32

## Por nuestro pueblo y nuestra tierra
Lo que recibimos de nuestros antepasados no se detiene en nosotros. Así como una generación deja a sus descendientes un nombre, una tierra y recuerdos, la humildad y la oración de una generación se convierten en bendición para su pueblo y para su tierra.

> Si se humillare mi pueblo, sobre los cuales mi nombre es invocado, y oraren, y buscaren mi rostro, y se convirtieren de sus malos caminos; entonces yo oiré desde los cielos, y perdonaré sus pecados, y sanaré su tierra. — 2 Crónicas 7:14

## Una pregunta para ti
Has visto de qué familia vienes. Pero ¿en qué libro está escrito tu nombre?

Dios nos ha dejado una carta de amor: la Biblia, Su Palabra. Te invitamos a abrirla y leerla. Puedes empezar por el Evangelio de Juan.

> Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna. — Juan 3:16`;

const NL = `## Twee stamlijnen, twee boeken
We zijn door de jaren afgedaald van mens tot mens, zo ver als hun namen tot ons zijn gekomen. Maar elke stamlijn, hoe lang ook, leidt nog verder, naar het begin van alle geslachten. De Bijbel bewaart twee stamlijnen, en ieder mens is geroepen om te ontdekken in welke van de twee hij geschreven staat.

## De stamlijn van Adam
> Dit is het boek van Adams geslacht. Ten dage als God den mens schiep, maakte Hij hem naar de gelijkenis Gods. — Genesis 5:1

Genesis 5 is de eerste stamlijn in de Bijbel: Adam, Seth, Enos en verder, van vader op zoon, en van ieder wordt gezegd dat hij leefde, zonen en dochters kreeg en daarna stierf. Het is ook onze stamlijn. Niemand van ons heeft zijn ouders, zijn dorp of de eeuw waarin hij ter wereld kwam gekozen: we zijn geboren zonder dat het ons gevraagd werd, nakomelingen van Adam, en we dragen allemaal hetzelfde erfdeel, de zonde en de dood.

## De stamlijn van Jezus Christus
> Het boek des geslachts van Jezus Christus, den Zoon van David, den zoon van Abraham. — Mattheüs 1:1

Ook het Nieuwe Testament begint met een stamlijn, maar met een andere: het geslacht van Jezus Christus. De Zoon van God werd mens en woonde onder ons.

> En het Woord is vlees geworden, en heeft onder ons gewoond (en wij hebben Zijn heerlijkheid aanschouwd, een heerlijkheid als des Eniggeborenen van den Vader), vol van genade en waarheid. — Johannes 1:14

Hij is het Lam van God, dat aan het kruis werd genageld en stierf in mijn plaats en in de jouwe, wie je ook bent. In Zijn stamlijn kom je door het geloof:

> Maar zovelen Hem aangenomen hebben, dien heeft Hij macht gegeven kinderen Gods te worden, namelijk die in Zijn Naam geloven; Welke niet uit den bloede, noch uit den wil des vleses, noch uit den wil des mans, maar uit God geboren zijn. — Johannes 1:12–13

We worden allemaal in Adam geboren. We zijn allemaal geroepen om in Christus te geloven en opnieuw geboren te worden in Hem.

> Voorwaar, voorwaar zeg Ik u: Tenzij dat iemand wederom geboren worde, hij kan het Koninkrijk Gods niet zien. — Johannes 3:3

## Het boek des levens
Het boek van onze familie bewaart de namen van wie ons dierbaar zijn, zodat we hen niet vergeten. Maar er is een boek dat meer telt dan welk boek ook: het boek des levens. Daarin staan geschreven wie de Heere Jezus Christus hebben aangenomen als de Redder van hun leven. Zij hebben een hemelse roeping: in de wereld heilig en onberispelijk leven, dat wil zeggen apart gezet voor God, Zijn wil doen en ten slotte de onsterfelijkheid beërven.

> En dit is het eeuwige leven, dat zij U kennen, den enigen waarachtigen God, en Jezus Christus, Dien Gij gezonden hebt. — Johannes 17:3

## De waarheid die vrijmaakt
De reis door de geschiedenis heeft ons systemen laten zien die mensen beheersten door leugen, angst en manipulatie: het communisme, dat onze grootouders hun land, hun geloof en de vrijheid om te zeggen wat ze dachten afnam, en daarna allerlei ideologieën, van het neomarxisme tot vandaag, die proberen te herschrijven wat de mens, het gezin en de waarheid zijn. In het Woord van God is er een Waarheid die niet verandert, en die Waarheid is geen idee, maar een Persoon: Jezus Christus Zelf.

> Ik ben de Weg, en de Waarheid, en het Leven. Niemand komt tot den Vader, dan door Mij. — Johannes 14:6

> En zult de waarheid verstaan, en de waarheid zal u vrijmaken. — Johannes 8:32

## Voor ons volk en ons land
Wat we van onze voorouders hebben ontvangen, houdt niet bij ons op. Zoals een generatie haar nakomelingen een naam, land en herinneringen nalaat, zo worden de nederigheid en het gebed van een generatie een zegen voor haar volk en haar land.

> En Mijn volk, over dewelken Mijn Naam genoemd wordt, zich verootmoedigt en bidt, en zij Mijn aangezicht zoeken, en zich bekeren van hun boze wegen; zo zal Ik uit den hemel horen, en hun zonden vergeven, en hun land genezen. — 2 Kronieken 7:14

## Een vraag voor jou
Je hebt gezien uit welk geslacht je voortkomt. Maar in welk boek staat jouw naam geschreven?

God heeft ons een liefdesbrief nagelaten: de Bijbel, Zijn Woord. We nodigen je uit hem te openen en te lezen. Je kunt beginnen met het Evangelie naar Johannes.

> Want alzo lief heeft God de wereld gehad, dat Hij Zijn eniggeboren Zoon gegeven heeft, opdat een iegelijk die in Hem gelooft, niet verderve, maar het eeuwige leven hebbe. — Johannes 3:16`;

const DE = `## Zwei Stammlinien, zwei Bücher
Wir sind durch die Jahre von Mensch zu Mensch zurückgereist, so weit ihre Namen auf uns gekommen sind. Aber jede Stammlinie, wie lang sie auch ist, führt noch weiter, bis zum Anfang aller Geschlechter. Die Bibel bewahrt zwei Stammlinien, und jeder Mensch ist gerufen herauszufinden, in welcher von beiden er geschrieben steht.

## Die Stammlinie Adams
> Dies ist das Buch von des Menschen Geschlecht. Da Gott den Menschen schuf, machte er ihn nach dem Bilde Gottes. — 1. Mose 5,1

1. Mose 5 ist die erste Stammlinie der Bibel: Adam, Seth, Enos und weiter, vom Vater zum Sohn, und von jedem heißt es, dass er lebte, Söhne und Töchter zeugte und dann starb. Es ist auch unsere Stammlinie. Keiner von uns hat sich seine Eltern, sein Dorf oder das Jahrhundert ausgesucht, in dem er zur Welt kam: Wir wurden geboren, ohne gefragt zu werden, Nachkommen Adams, und wir alle tragen dasselbe Erbe, die Sünde und den Tod.

## Die Stammlinie Jesu Christi
> Dies ist das Buch von der Geburt Jesu Christi, der da ist ein Sohn Davids, des Sohnes Abrahams. — Matthäus 1,1

Auch das Neue Testament beginnt mit einer Stammlinie, aber mit einer anderen: der Stammlinie Jesu Christi. Der Sohn Gottes wurde Mensch und wohnte unter uns.

> Und das Wort ward Fleisch und wohnte unter uns, und wir sahen seine Herrlichkeit, eine Herrlichkeit als des eingeborenen Sohnes vom Vater, voller Gnade und Wahrheit. — Johannes 1,14

Er ist das Lamm Gottes, das ans Kreuz geschlagen wurde und an meiner Stelle und an deiner Stelle gestorben ist, wer du auch bist. In Seine Stammlinie kommst du durch den Glauben:

> Wie viele ihn aber aufnahmen, denen gab er Macht, Gottes Kinder zu werden, die an seinen Namen glauben; welche nicht von dem Geblüt noch von dem Willen des Fleisches noch von dem Willen eines Mannes, sondern von Gott geboren sind. — Johannes 1,12–13

Wir alle werden in Adam geboren. Wir alle sind gerufen, an Christus zu glauben und in Ihm von neuem geboren zu werden.

> Wahrlich, wahrlich, ich sage dir: Es sei denn, dass jemand von neuem geboren werde, so kann er das Reich Gottes nicht sehen. — Johannes 3,3

## Das Buch des Lebens
Das Buch unserer Familie bewahrt die Namen unserer Lieben, damit wir sie nicht vergessen. Aber es gibt ein Buch, das mehr zählt als jedes andere Buch: das Buch des Lebens. Darin stehen die geschrieben, die den Herrn Jesus Christus als den Retter ihres Lebens angenommen haben. Sie haben eine himmlische Berufung: in der Welt heilig und untadelig zu leben, das heißt für Gott abgesondert, Seinen Willen zu tun und am Ende die Unsterblichkeit zu erben.

> Das ist aber das ewige Leben, dass sie dich, der du allein wahrer Gott bist, und den du gesandt hast, Jesum Christum, erkennen. — Johannes 17,3

## Die Wahrheit, die frei macht
Die Reise durch die Geschichte hat uns Systeme gezeigt, die die Menschen durch Lüge, Angst und Manipulation beherrscht haben: den Kommunismus, der unseren Großeltern ihr Land, ihren Glauben und die Freiheit nahm, zu sagen, was sie dachten, und nach ihm Ideologien aller Art, vom Neomarxismus bis heute, die neu schreiben wollen, was der Mensch, die Familie und die Wahrheit sind. Im Wort Gottes gibt es eine Wahrheit, die sich nicht ändert, und diese Wahrheit ist keine Idee, sondern eine Person: Jesus Christus selbst.

> Ich bin der Weg und die Wahrheit und das Leben; niemand kommt zum Vater denn durch mich. — Johannes 14,6

> und werdet die Wahrheit erkennen; und die Wahrheit wird euch freimachen. — Johannes 8,32

## Für unser Volk und unser Land
Was wir von unseren Vorfahren empfangen haben, hört nicht bei uns auf. So wie eine Generation ihren Nachkommen einen Namen, Land und Erinnerungen hinterlässt, so werden die Demut und das Gebet einer Generation zum Segen für ihr Volk und ihr Land.

> und mein Volk sich demütigt, das nach meinem Namen genannt ist, dass sie beten und mein Angesicht suchen und sich von ihren bösen Wegen bekehren werden: so will ich vom Himmel hören und ihre Sünde vergeben und ihr Land heilen. — 2. Chronik 7,14

## Eine Frage an dich
Du hast gesehen, aus welchem Geschlecht du stammst. Aber in welchem Buch steht dein Name geschrieben?

Gott hat uns einen Liebesbrief hinterlassen: die Bibel, Sein Wort. Wir laden dich ein, sie aufzuschlagen und zu lesen. Du kannst mit dem Johannesevangelium beginnen.

> Also hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, auf dass alle, die an ihn glauben, nicht verloren werden, sondern das ewige Leben haben. — Johannes 3,16`;

const IT = `## Due linee, due libri
Siamo scesi attraverso gli anni di persona in persona, fin dove ci sono arrivati i nomi. Ma ogni linea, per quanto lunga, porta più lontano, al principio di tutte le stirpi. La Bibbia custodisce due linee, e ognuno è chiamato a scoprire in quale delle due è scritto.

## La linea di Adamo
> Questo è il libro della posterità d’Adamo. Nel giorno che Dio creò l’uomo, lo fece a somiglianza di Dio. — Genesi 5:1

Genesi 5 è la prima linea della Bibbia: Adamo, Seth, Enosh e avanti, di padre in figlio, e di ognuno si dice che visse, generò figli e figlie, e poi morì. È anche la nostra linea. Nessuno di noi ha scelto i propri genitori, il proprio paese o il secolo in cui è venuto al mondo: siamo nati senza averlo voluto, discendenti di Adamo, e portiamo tutti la stessa eredità, il peccato e la morte.

## La linea di Gesù Cristo
> Libro della generazione di Gesù Cristo, figliuolo di Davide, figliuolo di Abrahamo. — Matteo 1:1

Anche il Nuovo Testamento comincia con una linea, ma con un’altra: la stirpe di Gesù Cristo. Il Figlio di Dio ha preso forma umana e ha abitato fra noi.

> E la Parola è stata fatta carne ed ha abitato per un tempo fra noi, piena di grazia e di verità. — Giovanni 1:14

Egli è l’Agnello di Dio, che è stato inchiodato sulla croce ed è morto al posto mio e tuo, chiunque tu sia. Nella Sua linea si entra per fede:

> ma a tutti quelli che l’hanno ricevuto egli ha dato il diritto di diventar figliuoli di Dio; a quelli, cioè, che credono nel suo nome; i quali, non di sangue, nè di volontà di carne, nè di volontà d’uomo, ma son nati di Dio. — Giovanni 1:12–13

Tutti nasciamo in Adamo. Tutti siamo chiamati a credere in Cristo e a nascere di nuovo in Lui.

> In verità, in verità, io ti dico, che se alcuno non è nato di nuovo, non può vedere il regno di Dio. — Giovanni 3:3

## Il libro della vita
Il libro della nostra famiglia custodisce i nomi delle persone care, perché non le dimentichiamo. Ma c’è un libro che conta più di qualunque altro libro: il libro della vita. Vi sono scritti quelli che hanno ricevuto il Signore Gesù Cristo come il Salvatore della loro vita. Hanno una chiamata celeste: vivere nel mondo santi e irreprensibili, cioè messi da parte per Dio, fare la Sua volontà e, alla fine, ereditare l’immortalità.

> E questa è la vita eterna: che conoscano te, il solo vero Dio, e colui che tu hai mandato, Gesù Cristo. — Giovanni 17:3

## La verità che rende liberi
Il viaggio nella storia ci ha mostrato sistemi che hanno dominato gli uomini con la menzogna, con la paura e con la manipolazione: il comunismo, che ha tolto ai nostri nonni la terra, la fede e la libertà di dire ciò che pensavano, e dopo di esso ideologie di ogni genere, dal neomarxismo fino a oggi, che cercano di riscrivere che cosa sono l’uomo, la famiglia e la verità. Nella Parola di Dio c’è una Verità che non cambia, e questa Verità non è un’idea, ma una Persona: Gesù Cristo stesso.

> Io son la via, la verità, e la vita; niuno viene al Padre se non per me. — Giovanni 14:6

> e conoscerete la verità, e la verità vi farà liberi. — Giovanni 8:32

## Per il nostro popolo e la nostra terra
Ciò che abbiamo ricevuto da chi ci ha preceduto non si ferma a noi. Come una generazione lascia ai suoi discendenti un nome, una terra e dei ricordi, così l’umiltà e la preghiera di una generazione diventano benedizione per il suo popolo e per il suo paese.

> se il mio popolo, sul quale è invocato il mio nome si umilia, prega, cerca la mia faccia e si converte dalle sue vie malvage, io lo esaudirò dal cielo, gli perdonerò i suoi peccati, e guarirò il suo paese. — 2 Cronache 7:14

## Una domanda per te
Hai visto da quale stirpe vieni. Ma in quale libro è scritto il tuo nome?

Dio ci ha lasciato una lettera d’amore: la Bibbia, la Sua Parola. Ti invitiamo ad aprirla e a leggerla. Puoi cominciare dal Vangelo di Giovanni.

> Poiché Iddio ha tanto amato il mondo, che ha dato il suo unigenito Figliuolo, affinché chiunque crede in lui non perisca, ma abbia vita eterna. — Giovanni 3:16`;

const HU = `## Két ág, két könyv
Emberről emberre haladtunk vissza az években, ameddig a nevek eljutottak hozzánk. De minden ág, akármilyen hosszú, tovább vezet, minden nemzetség kezdetéig. A Biblia két ágat őriz, és minden ember arra hivatott, hogy megtudja, melyikbe van beírva.

## Ádám ága
> Ez az Ádám nemzetségének könyve. Amely napon teremté Isten az embert, Isten hasonlatosságára teremté azt. — 1Mózes 5,1

Az 1Mózes 5 a Biblia első nemzetségtáblája: Ádám, Séth, Énós és tovább, apáról fiúra, és mindegyikükről azt olvassuk, hogy élt, fiakat és leányokat nemzett, azután meghalt. Ez a mi águnk is. Egyikünk sem maga választotta a szüleit, a faluját vagy azt a századot, amelyben világra jött: anélkül születtünk, hogy megkérdeztek volna, Ádám utódaiként, és mindannyian ugyanazt az örökséget hordozzuk, a bűnt és a halált.

## Jézus Krisztus ága
> Jézus Krisztusnak, Dávid fiának, Ábrahám fiának nemzetségéről való könyv. — Máté 1,1

Az Újszövetség is egy nemzetségtáblával kezdődik, de egy másikkal: Jézus Krisztus nemzetségével. Isten Fia emberi formát öltött, és közöttünk lakott.

> És az Ige testté lett és lakozék mi közöttünk (és láttuk az ő dicsőségét, mint az Atya egyszülöttjének dicsőségét), aki teljes vala kegyelemmel és igazsággal. — János 1,14

Ő Isten Báránya, akit a keresztre szegeztek, és aki meghalt helyettem és helyetted, bárki légy is. Az Ő ágába hit által kerülsz be:

> Valakik pedig befogadák őt, hatalmat ada azoknak, hogy Isten fiaivá legyenek, azoknak, akik az ő nevében hisznek; akik nem vérből, sem a testnek akaratából, sem a férfiúnak indulatjából, hanem Istentől születtek. — János 1,12–13

Mindannyian Ádámban születünk. Mindannyian arra vagyunk hivatva, hogy higgyünk Krisztusban, és újonnan szülessünk Őbenne.

> Bizony, bizony mondom néked: ha valaki újonnan nem születik, nem láthatja az Isten országát. — János 3,3

## Az élet könyve
Családunk könyve megőrzi szeretteink nevét, hogy ne felejtsük el őket. De van egy könyv, amely minden más könyvnél többet számít: az élet könyve. Abba azok vannak beírva, akik az Úr Jézus Krisztust életük Megváltójaként fogadták el. Mennyei elhívásuk van: hogy a világban szentül és feddhetetlenül éljenek, vagyis Isten számára elkülönítve, hogy az Ő akaratát cselekedjék, és végül elnyerjék a halhatatlanságot.

> Az pedig az örök élet, hogy megismerjenek téged, az egyedül igaz Istent, és akit elküldtél, a Jézus Krisztust. — János 17,3

## Az igazság, amely szabaddá tesz
A történelmen át vezető utazás olyan rendszereket mutatott meg nekünk, amelyek hazugsággal, félelemmel és manipulációval uralkodtak az embereken: a kommunizmust, amely elvette nagyszüleinktől a földjüket, a hitüket és a szabadságot, hogy kimondják, amit gondolnak, utána pedig mindenféle ideológiákat, a neomarxizmustól napjainkig, amelyek át akarják írni, mi az ember, a család és az igazság. Isten Igéjében van egy Igazság, amely nem változik, és ez az Igazság nem egy eszme, hanem egy Személy: maga Jézus Krisztus.

> Én vagyok az út, az igazság és az élet; senki sem mehet az Atyához, hanemha én általam. — János 14,6

> És megismeritek az igazságot, és az igazság szabadokká tesz titeket. — János 8,32

## Népünkért és hazánkért
Amit elődeinktől kaptunk, nem áll meg nálunk. Ahogyan egy nemzedék nevet, földet és emlékeket hagy az utódaira, úgy válik egy nemzedék alázata és imádsága áldássá a népe és a hazája számára.

> És megalázza magát az én népem, amely nevemről neveztetik, s könyörög és keresi az én arcomat, és felhagy az ő bűnös életmódjával: én is meghallgatom őket a mennyből, megbocsátom bűneiket, és megszabadítom földjüket. — 2Krónikák 7,14

## Egy kérdés neked
Láttad, milyen nemzetségből származol. De melyik könyvbe van beírva a neved?

Isten egy szerelmes levelet hagyott ránk: a Bibliát, az Ő Igéjét. Arra hívunk, hogy nyisd ki és olvasd. Kezdheted János evangéliumával.

> Mert úgy szerette Isten e világot, hogy az ő egyszülött Fiát adta, hogy valaki hiszen ő benne, el ne vesszen, hanem örök élete legyen. — János 3,16`;

/** Textul de bază din cod, pe limbi (româna e chiar DEFAULT_WORD; engleza americană citește același text ca cea britanică). */
export const DEFAULT_WORDS: Record<Locale, string> = {
  ro: DEFAULT_WORD, "en-GB": EN, "en-US": EN, fr: FR, es: ES, nl: NL, de: DE, it: IT, hu: HU,
};
