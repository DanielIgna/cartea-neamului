import type { NewLang } from "./tip";

/** Türkçe. */
export const TR: NewLang = {
  ui: {
    hubTitle: "Dünyadaki Rumenler: aile ağacınız, nerede olursanız olun", diaspora: "Diaspora", home: "Ana sayfa",
    hubLead: "Romanya dışında yaşayan Rumenler ve Romanya’da kökleri olan herkes için: yaşadığınız ülkedeki topluluğun tarihi, Romanya’dan belgeleri yolculuk yapmadan nasıl alacağınız, orada hangi arşivlerin bulunduğu ve aile ağacını Romanya’daki akrabalarınızla birlikte nasıl kuracağınız.",
    hubDescription: "Göçün tarihi, yurt dışından istenen Romanya belgeleri ve arşivler: Türkiye’de ve dünyada Romanya’da kökleri olan aileler için bir rehber.",
    countries: "Avrupa ve İsrail", america: "ABD", canada: "Kanada", themes: "Özel sayfalar", states: "Eyaletler", provinces: "Eyaletler ve bölgeler", cities: "Büyük şehirler", regions: "Bölgeler",
    history: "Rumenler buraya nasıl geldi", where: "Nerede yaşıyorlar", docs: "Romanya belgeleri, buradan istenir", records: "Buradaki arşivler ve kayıtlar",
    community: "Topluluklar ve dernekler", steps: "Adım adım: uzaktan aile ağacı", related: "Ayrıca bakınız", otherLangs: "Bu sayfa başka dillerde",
    titleCountry: (w) => `${w} Romanya kökleri: belgeler ve aile ağacı | Cartea Neamului`,
    descCountry: (w) => `${w} yaşayan Rumenlerin tarihi, buradan Romanya belgelerinin nasıl istendiği, hangi arşivlerin olduğu ve aile ağacının nasıl kurulacağı.`,
    titleRegion: (w) => `${w} Rumenler: kökler, belgeler, aile ağacı | Cartea Neamului`,
    titleRegionShort: (w) => `${w} Rumenler: kökler ve belgeler | Cartea Neamului`,
    descRegion: (w, c) => `${w} Rumenler (${c}): topluluk, Romanya konsolosluğu, belgelerin buradan ve Romanya’dan nasıl istendiği ve aile ağacının nasıl kurulacağı.`,
    citiesLine: (l) => `Rumen ailelerin çoğu şu şehirlerde yaşıyor: ${l}.`,
    docsSteps: ({ where, eu }) => [
      "Önce hangi belgeye ihtiyacınız olduğunu ve nerede tutulduğunu öğrenin: doğum, evlilik ve ölüm belgelerini, kaydın yapıldığı Romanya belediyesinin nüfus müdürlüğü (starea civilă) verir; 100 yıldan eski defterler genellikle Romanya Ulusal Arşivleri’nin il (județ) şubesindedir.",
      `${where} yaşıyorsanız üç yol var: bölgenizden sorumlu Romanya konsolosluğu (randevu econsulat.ro üzerinden), Romanya’daki bir akrabanıza vereceğiniz vekâletname (konsoloslukta imzalanır) ya da eski defterler için Ulusal Arşivler’e doğrudan e-postayla başvuru.`,
      eu
        ? `Bir Romanya belgesini ${where} kullanmak için genellikle artık apostil gerekmez: Avrupa Birliği’nde nüfus belgeleri apostilsiz geçerlidir (AB Tüzüğü 2016/1191) ve isterseniz belgelere eşlik eden çok dilli bir form da alabilirsiniz.`
        : `Bir Romanya belgesini ${where} kullanmak için genellikle Romanya’da valilikçe (prefectură) verilen Lahey apostili ve yeminli tercüme gerekir.`,
      "Eski bir kayıt isterken bildiğiniz her şeyi yazın: adı (eski ya da yabancı yazılışıyla birlikte), yaklaşık yılı, o zamanki köyü ve komünü. Cartea Neamului’ndaki her yerleşim sayfası, köyün hangi belediyeye ve hangi arşive bağlı olduğunu gösterir.",
      "Romanya vatandaşıysanız yurt dışında düzenlenen belgeler (bir çocuğun doğumu, bir evlilik) konsolosluk aracılığıyla ya da Romanya’daki nüfus müdürlüğünde Romanya kayıtlarına işlenir.",
    ],
    communityText: ({ where, icr }) => [
      `${where} yaşayan Rumenler çoğunlukla kültür dernekleri, hafta sonu okulları ve çocuklar için Rumence kurslarında bir araya gelir. Kayıtlı dernekler Yurt Dışındaki Rumenler Dairesi’nin sitesinde (dprp.gov.ro) yer alır ve konsolosluk genellikle şehrinizdekileri bilir.`,
      ...(icr ? [`Rumen Kültür Enstitüsü’nün ${icr} şubesi sergiler, konserler ve bir kütüphane sunar.`] : []),
      "Aile tarihinin en iyi kaynağı yine de insanlardır: topluluğun yaşlıları ilk ailelerin hangi köylerden geldiğini ve kimin kimle akraba olduğunu hatırlar.",
    ],
    genealogySteps: [
      "Bildiklerinizi yazın: anne babanızın, büyükanne ve büyükbabalarınızın adları, tarihleri ve yerleri.",
      "Yaşlı akrabalara, Romanya’da kalanlara da sorun: ekranda eski fotoğraflarla yapılan bir görüntülü görüşme pek çok ismi geri getirir.",
      "Ailenin geldiği köyü bulun ve Cartea Neamului’nda arayın: belediyesi, arşivi ve oradaki soyadları.",
      "İhtiyacınız olan belgeleri Romanya’dan ve yaşadığınız ülkeden isteyin (yukarıya bakın).",
      "Hepsini, nerede yaşarsa yaşasın bütün ailenin tamamlayabileceği tek bir ağaçta toplayın.",
    ],
    ctaTitle: "Aile ağacınızı başlatın", ctaText: "İlk 7 gün ücretsiz, kart gerekmez. Romanya’daki ve yurt dışındaki akrabalarınızı davet edersiniz, herkes bildiğini ekler.", ctaButton: "Aile ağacını başlat →",
    fallback: "Bu sayfa henüz sizin dilinizde yok, bu yüzden İngilizce gösteriliyor.", sources: "Kaynaklar", localities: "Romanya’daki yerleşimler", names: "Rumen soyadları", guides: "Soy araştırması rehberleri",
    regionThin: "Buradaki Rumenler hakkında hâlâ bilgi topluyoruz. O zamana kadar aşağıdaki adımlar ülkenin her yerinde geçerlidir.",
  },
  x: {
    guide: (w) => `${w} yaşarken Romanya’daki atalarınızı nasıl bulursunuz`, specifics: "Bilmekte yarar var", missions: "Romanya büyükelçiliği ve konsoloslukları", faq: "Sık sorulan sorular",
    kind: { embassy: "Büyükelçilik", consular: "Konsolosluk şubesi", cg: "Başkonsolosluk", consulate: "Konsolosluk" },
    missionsNote: (d) => `${d} tarihinde resmî kaynaklardan kontrol edildi. Her konsolosluğun sorumlu olduğu bölge ve çalışma saatleri resmî sayfadadır:`,
    statsNote: "Topluluk rakamları yuvarlanmıştır; kesin verileri yayımlayan kurum:",
    price: (lei, local) => `7 ücretsiz günden sonra Basic planı yılda ${local ?? lei}${local ? ` (${lei})` : ""}.`,
    whatsapp: "Romanya’daki büyükanne ve büyükbabaya WhatsApp’tan gönderin",
    whatsappText: (u) => `Aile ağacımızı kuruyorum ve yardımınıza ihtiyacım var: anne babanızın ve büyükanne büyükbabalarınızın adları neydi, hangi köydendiler? Burada birlikte dolduralım: ${u}`,
  },
  romania: [
    "100 yıldan eski nüfus ve kilise kayıtları, illere göre",
    "Romanya konsolosluklarında randevu ve başvurular",
    "büyükelçilik ve konsoloslukların listesi ve her birinin sorumlu olduğu bölge",
    "yurt dışındaki Rumen dernekleri ve diaspora programları",
  ],
  names: {
    italia: "İtalya", spania: "İspanya", germania: "Almanya", "marea-britanie": "Birleşik Krallık", franta: "Fransa", austria: "Avusturya",
    belgia: "Belçika", irlanda: "İrlanda", olanda: "Hollanda", portugalia: "Portekiz", suedia: "İsveç", danemarca: "Danimarka",
    elvetia: "İsviçre", grecia: "Yunanistan", cipru: "Kıbrıs", israel: "İsrail", "statele-unite": "Amerika Birleşik Devletleri", canada: "Kanada",
    ucraina: "Ukrayna", norvegia: "Norveç", "republica-moldova": "Moldova", serbia: "Sırbistan", bulgaria: "Bulgaristan", turcia: "Türkiye", luxemburg: "Lüksemburg",
  },
  countries: {
    turcia: {
      where: "Türkiye’de",
      history: [
        "Türkiye ile Romanya arasındaki bağlar bugünkü sınırlardan çok daha eskidir. Dobruca yüzyıllarca Osmanlı İmparatorluğu’nun parçasıydı ve Dobruca Türkleri ile Tatarları bugün de kendi dernekleri, okulları ve bayramlarıyla Romanya’nın bir topluluğudur. Pek çok ailenin Karadeniz’in iki yakasında da akrabası vardır.",
        "Kuzey Dobruca’nın 1878’de Romanya’ya katılmasından sonra ve ardından iki savaş arası dönemde pek çok Dobrucalı Türk ve Tatar Türkiye’ye göç etti; 1936 tarihli bir Romanya–Türkiye sözleşmesi bu göçü düzenledi. Onların torunları bugün İstanbul’da, Bursa’da, Eskişehir’de ya da Ankara’da yaşıyor ve Dobruca’daki köylerin hatırasını yaşatıyor: Mecidiye, Mangalya, Babadağ ya da Kubadin.",
        "Son on yıllarda Türkiye’ye Rumenler de geldi: iş insanları, öğrenciler, Rumen–Türk ailelerdeki eşler, güney kıyısında turizmde çalışanlar. Romanya’nın İstanbul’da ve İzmir’de başkonsoloslukları, Ankara’da ise büyükelçiliği vardır.",
        "Türkiye’de dalları olan Dobrucalı bir aile için aile ağacı; Osmanlı, Romanya ve Türkiye belgelerini, Arap harfleriyle, Latin harfleriyle ve 1928’den sonra yeni Türk alfabesiyle yazılmış adlarla bir araya getirir. Türkiye’de soyadları ancak 1934’te Soyadı Kanunu ile ortaya çıktı; bu yüzden daha önceki atalar belgelerde yalnızca adları, babalarının adı ve bir lakap ya da memleketleriyle görünür.",
        "Cartea Neamului Türkçe de yayımlanıyor; böylece büyükanne ve büyükbabalar Rumence ya da Türkçe anlatabilir, İstanbul’daki ya da Köstence’deki torunlar da aynı ağacı kendi dillerinde okuyabilir.",
      ],
      records: [
        "Osmanlı ve Türkiye Cumhuriyeti arşivleri, Osmanlı Dobrucası’na ait kayıtlar dahil",
        "Türkiye’nin nüfus kaydı; Türk vatandaşları e-Devlet üzerinden kayıtlı üst soylarını görebilir",
        "Köstence ve Tulça il şubeleri: Dobrucalı ailelerin belgeleri",
      ],
      guide: [
        "Büyükanne ve büyükbabaların hatırladıklarıyla başlayın: adlar, ailenin lakabı, Dobruca’daki köy ve göç yılı. Türkiye’ye göç etmiş aileler için göç yılı ve çıkılan köy anahtardır: belgenin Romanya’da mı Türkiye’de mi olduğu bunlara bağlıdır.",
        "Dobrucalı ailelerin Romanya belgeleri Ulusal Arşivler’in Köstence ve Tulça il şubelerindedir. Türkiye’deki belgeler nüfus kayıtlarındadır; Türk vatandaşları kayıtlı üst soylarını e-Devlet üzerinden görebilir. Daha eski Osmanlı defterleri İstanbul ve Ankara’daki Devlet Arşivleri’ndedir.",
        "Bugünkü bir Rumen–Türk aile için yol alışılmış olandır: Romanya belgeleri İstanbul ve İzmir’deki başkonsolosluklar ya da Ankara’daki büyükelçilik aracılığıyla, econsulat.ro üzerinden randevuyla istenir; Türk belgelerinin Romanya’da kullanılması için apostil ve tercüme gerekir.",
      ],
      specifics: [
        "Türkiye’de soyadları ancak 1934’te ortaya çıktı. Daha önceki atalar yalnızca adları, babalarının adı ve bir lakap, meslek ya da memleketle görünür; aynı kişi Romanya belgelerinde ve Türk belgelerinde farklı adlarla geçebilir.",
        "1928’e kadar Türkçe Arap harfleriyle yazılıyordu, bu yüzden eski Osmanlı belgelerini okuyabilecek birine ihtiyaç vardır. Ağaçta adın hem eski hem bugünkü biçimini tutabilirsiniz; böylece torunlar kişiyi hangi belgede bulurlarsa bulsunlar tanır.",
      ],
      faq: [
        { q: "Atalarım Dobruca’dan Türkiye’ye göç etti. Belgelerini nerede bulurum?", a: "Göçten önceki belgeler Romanya Ulusal Arşivleri’nin Köstence ve Tulça il şubelerinde; sonrakiler Türkiye’deki nüfus kayıtlarında." },
        { q: "Büyük dedemin belgelerde neden soyadı yok?", a: "Çünkü Türkiye’de soyadları ancak 1934’te zorunlu oldu. Daha önce insanlar adlarıyla, babalarının adıyla ve bir lakap ya da memleketleriyle bilinirdi." },
        { q: "Romanya’nın Türkiye’deki konsoloslukları nerede?", a: "Romanya’nın Ankara’da büyükelçiliği, İstanbul ve İzmir’de başkonsoloslukları var; randevular econsulat.ro üzerinden alınır." },
        { q: "Ağacı Rumence yazıp Türkiye’deki akrabaların Türkçe okumasını sağlayabilir miyim?", a: "Evet. Cartea Neamului Türkçe de var: herkes siteyi kendi dilinde okur." },
        { q: "Romanya’da kullanılacak bir Türk belgesi için apostil gerekir mi?", a: "Kural olarak evet, ayrıca yeminli tercüme de gerekir. Önce belgeyi isteyen kuruma danışın." },
      ],
    },
  },
};
