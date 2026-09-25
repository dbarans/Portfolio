(function () {
  const STORAGE_KEY = 'lang';

  // English is the markup itself (data-i18n elements start out in English), so the 'en'
  // dictionary can stay empty — it only exists so the toggle button's own logic below always
  // finds a dictionary to switch back to. Only Polish translations are listed.
  const translations = {
    en: {},
    pl: {
      // ---------- Shared: header / nav (index.html) ----------
      'index.skip': 'Przejdź do treści',
      'index.nav.contact': 'Kontakt',
      'index.nav.projects': 'Projekty',
      'index.nav.github': 'GitHub',
      'index.nav.linkedin': 'LinkedIn',
      'index.meta.title': 'Dominik Barański — programista Unity',
      'index.meta.description':
        'Dominik Barański buduje systemy gier w Unity i C#: wielowątkowy silnik symulacji w grze na Androida z ponad 15 000 pobrań oraz AI przeciwników, pathfinding, widoczność i proceduralne lochy w zespołowym projekcie 2D.',

      // ---------- index.html: hero ----------
      'index.hero.lead':
        'Buduję systemy gier w Unity i C#, dbając o wydajność i testowalność kodu. Moja praca obejmuje zarówno wielowątkowy silnik symulacji w grze na Androida z ponad 15 000 pobrań w Google Play, jak i AI przeciwników, pathfinding, system widoczności oraz generator lochów w zespołowym projekcie 2D. Szukam pracy jako junior/mid Unity developer.',
      'index.hero.stack': 'Unity · C# · Burst / Job System · shadery URP · Android',
      'index.hero.cta': 'Zobacz projekty',

      // ---------- index.html: projects ----------
      'index.section.projects': 'Projekty',
      'index.project.gol.meta': 'Android · Unity 2022.3 · solo · opublikowana w Google Play · 15 000+ pobrań',
      'index.project.gol.body':
        'Symulator gry w życie, który na telefonie musi poradzić sobie z setkami tysięcy żywych komórek. Najważniejsza praca kryje się w silniku: obliczenia na bitach w Burst i Job System, wątek symulacji, który nie blokuje renderowania, i renderowanie, którego koszt zależy od ekranu, a nie od wielkości wzorca.',
      'index.project.gol.cta': 'Zobacz, jak działa silnik →',
      'index.project.grave.meta': 'Unity 6 · URP 2D · zespół 4 osób · praca inżynierska',
      'index.project.grave.body':
        'Survival horror 2D z widokiem z góry, zrobiony w 4-osobowym zespole. Cztery z systemów, które do niego zbudowałem: pathfinding A* o ograniczonym koszcie na klatkę, maska światła renderowana przez drugą kamerę i własne shadery, generator lochów z seeda pokryty 48 testami jednostkowymi i AI przeciwników składane z wymiennych komponentów.',
      'index.project.grave.cta': 'Zobacz systemy →',

      // ---------- index.html: contact ----------
      'index.section.contact': 'Kontakt',
      'index.contact.lead': 'Chętnie omówię kod tych projektów na rozmowie.',
      'index.contact.email.label': 'E-mail:',
      'index.contact.linkedin.label': 'LinkedIn:',
      'index.contact.github.label': 'GitHub:',

      // ---------- Shared case-study UI (game-of-life.html, grave.html) ----------
      'case.skip': 'Przejdź do treści',
      'case.back': '← Wszystkie projekty',
      'case.lang.aria': 'EN, przełącz na angielski',
      'case.keynums': 'Najważniejsze liczby',
      'case.glance': 'W skrócie',
      'case.toc': 'Systemy na tej stronie',
      'case.diagram.hint': 'Przewiń, aby zobaczyć cały diagram →',
      'case.how': 'Jak działa',
      'case.what': 'Co to pokazuje',
      'case.takeaway': 'Wnioski',
      'case.source': 'Kod',
      'case.next': 'Następny projekt',
      'case.foot.linkedin': 'LinkedIn',
      'case.foot.email': 'E-mail',
      'case.foot.repo': 'Repozytorium ↗',
      'case.kicker.gol': 'Solo · Unity 2022.3 · opublikowana w Google Play',
      'case.kicker.grave': 'Zespół 4 osób · praca inżynierska, 2026',
      'case.foot.gol':
        'Projekt solo. Repozytorium jest prywatne — fragmenty kodu są powyżej, a resztę chętnie pokażę na rozmowie.',
      'case.foot.grave': 'Projekt zespołowy (4 osoby). Pokazuję tylko systemy, które zbudowałem sam.',
      'case.meta.gol.title': 'Game of Life — studium przypadku — Dominik Barański',
      'case.meta.gol.description':
        'Symulator gry w życie na Androida zbudowany tak, by radzić sobie z wzorcami liczącymi setki tysięcy żywych komórek: bitowo-równoległy silnik na Burst/Job System, zweryfikowany poza Unity. 15 000+ pobrań w Google Play.',
      'case.meta.grave.title': 'Grave — studium przypadku — Dominik Barański',
      'case.meta.grave.description':
        'Systemy zbudowane do gry Grave, survival horroru 2D z widokiem z góry zrobionego w 4-osobowym zespole w Unity 6: pathfinding A*, maska światła renderowana przez drugą kamerę, generator lochów z 48 testami jednostkowymi i AI przeciwników z komponentów.',

      // ---------- game-of-life.html: intro ----------
      'gol.tagline':
        'Symulator automatu komórkowego na Androida, zbudowany tak, żeby telefon radził sobie z wzorcami liczącymi setki tysięcy żywych komórek.',
      'gol.intro':
        'Gra w życie Conwaya na nieograniczonej planszy: gracz rysuje komórki palcem i patrzy, jak ewoluują, od kilku komórek po wzorce liczące setki tysięcy. Reguły mieszczą się w czterech zdaniach. Trudność techniczna polega na tym, żeby skalowały się na telefonie.',
      'gol.hero.shot':
        'Ekran telefonu, niemal całkowicie oddalony widok bardzo dużego wzorca (~252 tys. komórek, np. Universal Turing Machine): tekstura gęstości wypełnia kadr, bez paneli UI zasłaniających wzorzec.',
      'gol.hero.caption':
        'Wzorzec gry w życie liczący setki tysięcy komórek, mocno oddalony na ekranie telefonu i narysowany jako tekstura gęstości.',

      // ---------- game-of-life.html: key numbers ----------
      'gol.kn1.value': '15 000+',
      'gol.kn1.label': 'Pobrań w Google Play',
      'gol.kn1.ctx': 'Strona gry w Google Play; projekt solo.',
      'gol.kn2.label': 'Zysk z kopiowania całych chunków',
      'gol.kn2.ctx':
        'Losowy wzorzec z 275 tys. żywych komórek na Pixelu 6 Pro: odtwarzanie generacja po generacji vs kopiowanie całych chunków (system 2).',
      'gol.kn3.value': '~50 µs vs 1035 µs',
      'gol.kn3.label': 'Zapytanie o widoczne komórki',
      'gol.kn3.ctx':
        'Benchmark poza Unity, widok 200×200 komórek i 316 tys. żywych komórek poza ekranem: zapytanie po chunkach vs stare pełne skanowanie (system 3).',

      // ---------- game-of-life.html: at a glance ----------
      'gol.glance.role.t': 'Rola',
      'gol.glance.role.d': 'solo (silnik, rozgrywka, UI i publikacja w sklepie)',
      'gol.glance.engine.t': 'Silnik',
      'gol.glance.engine.d': 'Unity 2022.3 LTS, wbudowany render pipeline (built-in)',
      'gol.glance.platform.t': 'Platforma',
      'gol.glance.status.d1': 'opublikowana w',
      'gol.glance.status.d2': ', 15 000+ pobrań',
      'gol.glance.tech.t': 'Kluczowe technologie',
      'gol.glance.tech.d': 'C#, Burst, Job System, Native Collections, wielowątkowość, własne shadery, Tilemap',
      'gol.glance.code.t': 'Kod',
      'gol.glance.code.d': 'repozytorium prywatne',

      // ---------- game-of-life.html: systems on this page ----------
      'gol.toc1.skills': 'Burst · Job System · równoległe obliczenia na bitach',
      'gol.toc2.skills': 'Wielowątkowość · producent–konsument · kolejność locków',
      'gol.toc3.skills': 'Renderowanie · LOD · własny shader',
      'gol.toc4.skills': 'Testy różnicowe · Burst sprawdzany bez edytora',

      // ---------- game-of-life.html: system 1 ----------
      'gol.sys1.title': 'Silnik, który liczy tylko to, co się zmienia',
      'gol.sys1.problem':
        'Prosta symulacja w każdej generacji odwiedza każdą żywą komórkę, więc jej koszt rośnie razem z całym wzorcem. Na telefonie przy dużych wzorcach symulacja zaczyna się dławić, nawet gdy większość planszy się nie zmienia.',
      'gol.sys1.how':
        'Plansza jest podzielona na chunki 64×64 zapisane jako maski bitowe (jedna 64-bitowa liczba na wiersz, jeden bit na komórkę). Każdy krok przelicza tylko chunki sąsiadujące z tymi, które zmieniły się w poprzednim kroku, liczy sąsiadów 64 komórek naraz arytmetyką bitową i działa jako łańcuch pięciu jobów Burst na pamięci natywnej. Burst kompiluje ograniczony podzbiór C# do zoptymalizowanego kodu natywnego, a Job System rozkłada tę pracę na wątki robocze.',
      'gol.sys1.what':
        'Projektowanie zorientowane na dane z użyciem Burst i Job System oraz profilowanie na urządzeniu docelowym. Zrównoleglenie samego rdzenia obliczeń dało wyraźny zysk w edytorze, ale na telefonie nie dało mierzalnej różnicy, bo prawdziwym wąskim gardłem było szeregowe zbieranie danych wokół niego. Wersja w sklepie uruchamia cały pipeline jako joby: na gęstym losowym wzorcu cztery wątki robocze dają 1,96 raza więcej generacji na sekundę niż jeden (pomiar na telefonie).',

      // ---------- game-of-life.html: system 2 ----------
      'gol.sys2.title': 'Symulacja w wątku w tle, z dwoma sposobami przekazywania wyników',
      'gol.sys2.problem':
        'Symulacja nie może blokować renderowania ani obsługi dotyku. Przy niskiej prędkości każda generacja musi też osobno trafić do głównego wątku, bo napędza animacje narodzin i śmierci komórek oraz wibracje. Przy wysokiej prędkości to przekazywanie generacja po generacji stało się wąskim gardłem i szybszy silnik zaczął pogarszać płynność.',
      'gol.sys2.how':
        'Poniżej prędkości, przy której animacje i tak się wyłączają, zmiany każdej generacji (narodzone i obumarłe komórki) trafiają do bufora pierścieniowego, czyli kolejki o stałym rozmiarze, która ponownie używa swoich slotów. Dzięki temu wątek obliczeniowy może liczyć z wyprzedzeniem. Powyżej tej prędkości nie ma czego animować, więc wątek obliczeniowy sam kopiuje całe zmienione chunki do wyświetlanego stanu, a główny wątek tylko renderuje.',
      'gol.sys2.what':
        'Bezpieczną wielowątkowość wokół API Unity, które działa tylko na głównym wątku (model producent–konsument z jawną dyscypliną locków), i wytropienie nieintuicyjnej regresji. Przejście na kopiowanie całych chunków podniosło tempo losowego wzorca z 275 tys. komórek z 64 do 141 generacji na sekundę na Pixelu 6 Pro.',
      'gol.diag2.laneCalc': 'WĄTEK OBLICZENIOWY',
      'gol.diag2.laneMain': 'WĄTEK GŁÓWNY',
      'gol.diag2.pathA': 'PONIŻEJ PROGU ANIMACJI',
      'gol.diag2.pathB': 'POWYŻEJ PROGU',
      'gol.diag2.burst': 'Joby Burst',
      'gol.diag2.ring': 'Bufor pierścieniowy delt',
      'gol.diag2.ringSub': 'delty, nie migawki',
      'gol.diag2.replay': 'Odtwarza gen./klatkę',
      'gol.diag2.withAnim': 'Z animacjami',
      'gol.diag2.copies': 'Kopiuje zmienione chunki',
      'gol.diag2.displayed': 'Wyświetlany zbiór komórek',
      'gol.diag2.shared': 'stan współdzielony',
      'gol.diag2.renders': 'Tylko renderuje',
      'gol.diag2.fpsIndep': 'FPS niezależny od tempa',
      'gol.diag2.cap':
        'Dwa locki, zawsze brane w tej samej kolejności: najpierw lodLock (liczniki gęstości LOD), potem gridLock (stan planszy). Stała kolejność wyklucza zakleszczenie.',

      // ---------- game-of-life.html: system 3 ----------
      'gol.sys3.title': 'Koszt renderowania zależny od ekranu, a nie od wzorca',
      'gol.sys3.problem':
        'Po oddaleniu na ekranie mogą być setki tysięcy komórek, a w Unity każdy kafelek Tilemapy kosztuje osobno. Nawet ustalenie, które komórki są widoczne, wymagało kiedyś przejrzenia wszystkich żywych komórek. Gra zwalniała wraz ze wzrostem wzorca, także przez tę jego część, której nie było widać.',
      'gol.sys3.how':
        'Żywe komórki są przechowywane w strukturze chunków z maskami bitowymi, która odpowiada na pytanie „co jest w tym prostokącie kamery” w czasie proporcjonalnym do widocznego obszaru. Z bliska Tilemapa dostaje tylko zmiany z każdej generacji. Przy dużym oddaleniu zastępuje ją jeden quad z teksturą gęstości komórek (jeden bajt na teksel), rysowany własnym shaderem w jednym draw callu. Przełączanie ma histerezę, czyli osobne progi wejścia i wyjścia, żeby widok nie migotał między trybami.',
      'gol.sys3.what':
        'Optymalizację renderowania w Unity (draw calle, ograniczenia wbudowanego komponentu, przełączanie poziomu szczegółowości, czyli LOD) i dobór struktur danych do zapytań, na które muszą odpowiadać. W benchmarku poza Unity zapytanie o widoczne komórki zajmuje stale ~50 µs, bez względu na to, ile komórek jest poza ekranem. Stare pełne skanowanie dochodziło do 1035 µs przy 316 tys. żywych komórek.',
      'gol.sys3.shot':
        'Jeden ciągły pinch-zoom od pojedynczych komórek do wzorca liczącego setki tysięcy (~252 tys.), z widocznym licznikiem FPS — ma być widać moment, w którym Tilemapa ustępuje widokowi gęstości na jednym quadzie, bez zacięć.',
      'gol.sys3.caption':
        'Jeden płynny pinch-zoom od pojedynczych komórek do wzorca liczącego setki tysięcy komórek, z włączonym licznikiem FPS: kafelki ustępują widokowi gęstości na jednym quadzie bez zacięć.',

      // ---------- game-of-life.html: system 4 ----------
      'gol.sys4.title': 'Kod silnika weryfikowany poza Unity',
      'gol.sys4.problem':
        'Błąd w stanowym silniku operującym na bitach nie powoduje awarii. Daje wiarygodnie wyglądający, ale błędny wzorzec, często dopiero wiele generacji później, więc patrząc na ekran, nie da się go wyłapać.',
      'gol.sys4.how':
        'Konsolowy harness .NET kompiluje te same pliki źródłowe solvera, które trafiają do wersji w sklepie, a mały shim zastępuje kolekcje, Jobs i Burst z Unity. Każda generacja każdego scenariusza (glidery przekraczające granice chunków i wchodzące w ujemne współrzędne, pusta plansza) jest porównywana komórka po komórce z naiwną implementacją referencyjną. Cały przebieg daje też jeden hash wzorcowy, który refaktor przenoszący tylko kod musi odtworzyć bajt w bajt. Uruchamiana bez edytora kompilacja wszystkich pięciu jobów kompilatorem Burst pod ARM64 zawiera kontrolę negatywną, czyli kod, który musi się nie skompilować, więc czysty wynik faktycznie coś dowodzi.',
      'gol.sys4.what':
        'Dyscyplinę testowania kluczowej logiki gry, sprawdzanej z linii poleceń bez otwierania edytora.',
      'gol.diag4.source': 'To samo źródło solvera',
      'gol.diag4.android': 'Build Android do sklepu',
      'gol.diag4.androidSub': 'gra w sklepie',
      'gol.diag4.harness': 'Harness testowy .NET',
      'gol.diag4.harnessSub': 'kompiluje wysyłany solver',
      'gol.diag4.naive': 'Porównanie z referencją',
      'gol.diag4.cellByCell': 'komórka po komórce',
      'gol.diag4.hash': 'Hash wzorcowy',
      'gol.diag4.hashSub': 'bajt w bajt',
      'gol.diag4.probe': 'BurstProbe: kompilacja ARM64',
      'gol.diag4.negative':
        '<tspan x="450" dy="0">Kontrola negatywna —</tspan><tspan x="450" dy="15">osobno, nie ze źródła</tspan>',
      'gol.diag4.cap':
        'Obie gałęzie kompilują te same pliki, więc testy nigdy nie są nieaktualną kopią silnika.',

      // ---------- game-of-life.html: takeaway ----------
      'gol.takeaway':
        'Mierzyć trzeba na urządzeniu docelowym, a nie w edytorze: w tym projekcie edytor wskazał niewłaściwe wąskie gardło.',
      'gol.also.label': 'Również w kodzie (poza wersją sklepową)',
      'gol.also.body':
        'HashLife (algorytm Gospera), drugi silnik, który zapamiętuje i ponownie wykorzystuje wyniki w drzewie czwórkowym, dzięki czemu powtarzalne wzorce przeskakują tysiące generacji w jednym kroku. Ma budżet pamięci skalowany do RAM-u urządzenia i testy względem implementacji brute-force, ale w wersji w sklepie jest wyłączony i czeka na przyszłą wersję Pro.',

      // ---------- grave.html: intro ----------
      'grave.tagline':
        'Systemy, które zbudowałem do gry 2D z widokiem z góry w Unity 6: pathfinding, widoczność, proceduralne lochy i AI przeciwników.',
      'grave.intro':
        'Grave to survival horror 2D z widokiem z góry, w którym gracz widzi tylko to, co obejmuje jego pole widzenia i co oświetlają źródła światła. Powstał w 4-osobowym zespole jako projekt inżynierski. Opisuję tu zbudowane przeze mnie systemy: pathfinding przeciwników, system widoczności, proceduralne generowanie lochów i AI przeciwników.',
      'grave.hero.shot':
        'Oświetlone pomieszczenie lochu, kamera z góry: filary rzucają ostro zarysowane cienie w stożku widzenia gracza, wszystko poza światłem pozostaje całkowicie ciemne.',
      'grave.hero.caption':
        'Oświetlone pomieszczenie lochu widziane z góry: filary rzucają ostre cienie w stożku widzenia gracza, a wszystko poza światłem ginie w ciemności.',

      // ---------- grave.html: key numbers ----------
      'grave.kn1.label': 'Testów jednostkowych EditMode',
      'grave.kn1.ctx':
        'Wszystkie dotyczą generatora lochów, który działa bez sceny; wiele z nich sprawdza dziesiątki lub setki seedów.',
      'grave.kn2.value': '4000',
      'grave.kn2.label': 'Limit węzłów na wyszukiwanie A*',
      'grave.kn2.ctx':
        'Limit projektowy, a nie wynik benchmarku: po jego przekroczeniu wyszukiwanie zwraca najlepszą częściową ścieżkę, zamiast przycinać klatkę.',
      'grave.kn3.label': 'Czas klatki po profilowaniu',
      'grave.kn3.ctx':
        'Pomiar w edytorze, po jednej serii optymalizacji: rzadsze próbkowanie promieni poza stożkiem widzenia, ponowne użycie buforów A* i kilka innych poprawek.',

      // ---------- grave.html: at a glance ----------
      'grave.glance.team.t': 'Zespół',
      'grave.glance.team.d': '4 osoby (praca inżynierska)',
      'grave.glance.covered.t': 'Opisuję tu',
      'grave.glance.covered.d':
        'zbudowane przeze mnie systemy: pathfinding A*, system widoczności, proceduralne generowanie lochów, AI przeciwników',
      'grave.glance.engine.t': 'Silnik',
      'grave.glance.platform.t': 'Platforma',
      'grave.glance.status.t': 'Status',
      'grave.glance.status.d': 'projekt inżynierski, Collegium Da Vinci, 2026',
      'grave.glance.tech.t': 'Kluczowe technologie (w tych systemach)',
      'grave.glance.tech.d':
        'C#, Physics2D, własne shadery URP (HLSL), RenderTexture, assembly definitions, Unity Test Framework (48 testów EditMode)',
      'grave.glance.code.t': 'Kod',
      'grave.glance.code.link': 'repozytorium zespołu na GitHubie',
      'grave.glance.code.d': ', każdy system poniżej linkuje do swojego folderu',

      // ---------- grave.html: systems on this page ----------
      'grave.toc1.skills': 'A* · kopiec binarny · ograniczony koszt klatki',
      'grave.toc2.skills': 'RenderTexture · własne shadery URP · raycasting',
      'grave.toc3.skills': 'Algorytmy grafowe · determinizm · testy jednostkowe',
      'grave.toc4.skills': 'Kompozycja · interfejsy · budżet aktualizacji AI',

      // ---------- grave.html: system 1 ----------
      'grave.sys1.title': 'Pathfinding A* o przewidywalnym koszcie na klatkę',
      'grave.sys1.problem':
        'Przeciwnicy gonią gracza po wygenerowanym lochu, czyli po siatce 40 000 komórek (200×200), a żadne pojedyncze wyszukiwanie ścieżki nie może powodować przycięć. Najgorszy przypadek to cel nieosiągalny: zwykły A* przeszukuje wtedy całą mapę, zanim uzna, że ścieżki nie ma.',
      'grave.sys1.how':
        'Collidery poziomu są próbkowane do płaskiej siatki, która dla każdego pola zapisuje, czy da się po nim przejść; po zniszczeniu przeszkody siatka jest aktualizowana lokalnie. Flood fill dzieli ją na spójne regiony, więc nieosiągalny cel odpada w O(1), zanim wyszukiwanie w ogóle ruszy. Wyszukiwanie korzysta z kopca binarnego, czyli kolejki priorytetowej, która zwraca najtańszy węzeł w O(log n). Bufory są używane ponownie między wyszukiwaniami, a zamiast je czyścić, unieważnia się je numerem wersji nadawanym każdemu wyszukiwaniu. Liczba odwiedzonych węzłów ma limit, a po jego przekroczeniu zwracana jest najlepsza częściowa ścieżka, więc gra się nie zawiesza.',
      'grave.sys1.what':
        'Przerobienie algorytmu z podręcznika na taki, którego koszt na klatkę jest ograniczony, przy czym przygotowanie zależy od przeszukanego obszaru, a nie od rozmiaru mapy. Ruch jest wymiennym komponentem-strategią za wąskimi interfejsami, więc logika przeciwnika nie zależy od pathfindera, a A* można zastąpić prostym ruchem bezpośrednim.',

      // ---------- grave.html: system 2 ----------
      'grave.sys2.title': 'System widoczności: maska światła renderowana przez drugą kamerę i własne shadery',
      'grave.sys2.problem':
        'Wszystko poza linią wzroku gracza, łącznie z przeciwnikami, musi być ukryte, a światło z kilku źródeł (stożek widzenia gracza, lampy) ma się płynnie łączyć. Wcześniejsza wersja opierała się na stencil buforze, który przechowuje dla każdego piksela prostą flagę widoczne/niewidoczne. Sprite’y urywały się ostro na granicy światła, a dwa światła nie łączyły się płynnie.',
      'grave.sys2.how':
        'Stożek widzenia gracza i każda lampa korzystają z jednego wspólnego buildera meshy. Tam, gdzie sąsiednie promienie trafiają w różne powierzchnie, wyszukiwanie binarne między nimi znajduje dokładną krawędź, więc kontury pozostają ostre bez dokładania promieni. Blending typu max sprawia, że nakładające się światła dają jaśniejszą z dwóch wartości, zamiast się sumować. Maska trzyma poziom światła w kanale alfa, a jego kolor w RGB, więc jedna tekstura jednocześnie przyciemnia i barwi scenę, a shadery sprite’ów ukrywają wszystko, do czego nie dociera żadne światło.',
      'grave.sys2.what':
        'Pracę z renderowaniem w Unity poza gotowymi komponentami: dodatkowa kamera, warstwy renderowania, RenderTexture, tryby blendingu i własne shadery URP, a także wymianę architektury, gdy poprzednia wyczerpała swoje możliwości. Do tego profilowanie. Stożek rzucał kiedyś pełne koło promieni w pełnej gęstości tylko po to, żeby narysować mały krąg widzenia wokół gracza. Rzadsze próbkowanie tego kręgu, razem z innymi poprawkami z tej samej serii, w tym ponownym użyciem buforów A* między wyszukiwaniami, skróciło klatkę z ~30 ms do ~12 ms (pomiar w edytorze).',
      'grave.sys2.shot':
        'Gracz przechodzi przez ciemne pomieszczenie z filarami i lampą: stożek widzenia jest zasłaniany przez filary, sprite przeciwnika płynnie znika na granicy światła, a dwa nakładające się światła łączą się bez widocznego szwu. Pokazać sam system, nie fragment rozgrywki.',
      'grave.sys2.caption':
        'Gracz przechodzi przez ciemne pomieszczenie z filarami i lampą: filary przesłaniają stożek widzenia, przeciwnik płynnie znika na granicy światła, a dwa nakładające się światła łączą się bez szwu.',
      'grave.diag2.b1a': 'Wachlarz promieni',
      'grave.diag2.b1b': 'Szukanie krawędzi → mesh',
      'grave.diag2.b2a': 'Kamera maski → RenderTexture',
      'grave.diag2.b2b': 'BlendOp Max: jaśniejsze wygrywa',
      'grave.diag2.b3a': 'Globalna tekstura _VisionMask',
      'grave.diag2.b4a': 'Nakładka ciemności',
      'grave.diag2.b4b': '+ shadery sprite’ów',
      'grave.diag2.cap': 'Cztery etapy maski, od rzucania promieni po ukrycie tego, czego nie sięga światło.',

      // ---------- grave.html: system 3 ----------
      'grave.sys3.title': 'Generator lochów: z seeda, walidowany, przetestowany',
      'grave.sys3.problem':
        'Każda rozgrywka potrzebuje nowego lochu, który zawsze jest w pełni spójny, bez nieosiągalnych pokoi i bez drzwi prowadzących w skałę. Musi też być powtarzalny: ten sam seed ma dać identyczny loch na każdym komputerze, żeby poziom dało się odtworzyć, debugować i testować na podstawie samego seeda.',
      'grave.sys3.how':
        'Generator to pipeline w czystym C#, w osobnym assembly, bez zależności od scen i MonoBehaviour. Rozmieszcza pokoje i łączy je minimalnym drzewem rozpinającym zbudowanym algorytmem Kruskala z Union-Find, co daje najtańszy zestaw korytarzy łączący wszystkie pokoje. Kilka dodatkowych krawędzi tworzy pętle. Potem pipeline wycina pokoje i korytarze, w tym ślepe wnęki w korytarzach, waliduje wynik, a gdy walidacja się nie powiedzie, ponawia próbę z seedem wyprowadzonym z pierwotnego. Deterministyczny generator liczb losowych daje każdemu etapowi osobny, niezależny strumień, więc zmiana jednego etapu nie przetasowuje pozostałych. Analiza grafu znajduje punkty artykulacji (przewężenia), czyli komórki, których zablokowanie rozcięłoby loch na dwie części, więc nie stawia się na nich żadnych obiektów.',
      'grave.sys3.what':
        'Zastosowanie algorytmów grafowych do realnego problemu w grze i architekturę przygotowaną do testowania. Generator nie potrzebuje sceny, więc pokrywa go 48 testów jednostkowych EditMode. Wiele z nich sprawdza dziesiątki lub setki seedów; w jednym z testów każdy z 500 losowych seedów musi przejść walidację i dać unikalny układ.',
      'grave.sys3.tests.label': 'testy:',

      // ---------- grave.html: system 4 ----------
      'grave.sys4.title':
        'AI przeciwników: zmysły składane z komponentów i budżet aktualizacji zależny od odległości',
      'grave.sys4.problem':
        'W wygenerowanym lochu jest wielu przeciwników. Każdy uruchamia maszynę stanów (patrol, pościg, sprawdzanie tropu) i kilka razy na sekundę pełne wyszukiwanie A*, choć większość z nich jest daleko od gracza. Typy przeciwników różnią się też tym, jak wyczuwają gracza, a dodanie nowego typu nie powinno wymagać zmian we wspólnej klasie bazowej.',
      'grave.sys4.how':
        'EnemyBase wyszukuje swoje komponenty po interfejsach i nie wie, jakie klasy za nimi stoją. Odpytuje wszystkie podpięte detektory, a każdy z nich może potwierdzić obecność gracza. Słuch to osobny kanał zasilany przez szynę zdarzeń hałasu: usłyszany hałas każe przeciwnikowi sprawdzić miejsce, ale nie oznacza wykrycia, bo to tylko podejrzenie. Strefy aktualizacji z diagramu są liczone od zasięgu zmysłów konkretnego przeciwnika, więc budżet dopasowuje się do jego typu. Losowy rozrzut sprawia, że grupy przeciwników nie aktualizują się w tej samej klatce, a uśpieni przeciwnicy zwalniają zapamiętane ścieżki.',
      'grave.sys4.what':
        'Kompozycję zamiast dziedziczenia w praktyce. „Ślepy” typ przeciwnika to podklasa licząca 16 linii, której jedyną realną treścią jest [RequireComponent(typeof(SoundPlayerDetector))]: ślepota oznacza po prostu, że jego prefab nie ma VisionPlayerDetector. Ten typ doszedł bez żadnych zmian w klasie bazowej. Do tego budżetowanie kosztu AI na dużym poziomie bez pogorszenia reakcji przeciwników w pobliżu gracza.',
      'grave.diag4.senses': 'ZMYSŁY',
      'grave.diag4.stateMachine': 'maszyna stanów',
      'grave.diag4.sight': 'Wykrycie: wzrok',
      'grave.diag4.hearing': 'Słuch: tylko podejrzenie',
      'grave.diag4.movement':
        '<tspan x="350" dy="0">Ruch: A* lub bezpośredni —</tspan><tspan x="350" dy="15">to nie zmysł</tspan>',
      'grave.diag4.blindLabel': 'Typ ślepy: bez wzroku',
      'grave.diag4.noSight': 'Brak komponentu wzroku',
      'grave.diag4.blind':
        '„Ślepy” typ przeciwnika to ten sam hub bez szprychy wzroku — dodany bez zmiany ani jednej linii we wspólnej klasie bazowej.',
      'grave.diag4.part1': 'Zmysły jako komponenty za interfejsami — hub, nie pipeline',
      'grave.diag4.part2': 'Budżet aktualizacji zależny od odległości od gracza',
      'grave.diag4.player': 'Gracz',
      'grave.diag4.zone1.t': 'Co klatkę',
      'grave.diag4.zone1.d': 'zasięg zmysłów + margines',
      'grave.diag4.zone2.t': 'Co interwał, z rozrzutem',
      'grave.diag4.zone3.t': 'Uśpiony, ścieżka zwolniona',
      'grave.diag4.safety.t': 'Dolny próg bezpieczeństwa',
      'grave.diag4.safety.d': 'nigdy w zasięgu zmysłów',
      'grave.diag4.hysteresis': 'Histereza: uśpienie / wybudzenie',
      'grave.diag4.zonecap':
        'Podłoga bezpieczeństwa gwarantuje, że nigdy nie zostanie zaparkowany przeciwnik, który mógłby wyczuć gracza; histereza nie pozwala tym na granicy przełączać się tam i z powrotem.',

      // ---------- grave.html: takeaway ----------
      'grave.takeaway':
        'Łączy je jedna zasada: luźne powiązanie przez dane. Generator nic nie wie o pathfindingu, widoczności ani AI. Tworzy układ, z którego powstają collidery czytane zarówno przez siatkę A*, jak i przez promienie światła, oraz listę przewężeń i wnęk w korytarzach, z której korzysta rozmieszczanie przeciwników: zasadzki trafiają do wnęk, a strażnicy stają obok przewężenia, nigdy na nim. AI z kolei sięga do pathfindingu wyłącznie przez wąskie interfejsy, więc systemy współpracują, nie zależąc nawzajem od swojego kodu.',
    },
  };

  const originalHtml = new WeakMap();
  const originalAttr = new WeakMap();

  const toggleBtn = document.getElementById('lang-toggle');

  const detectInitialLang = () => {
    try {
      if (navigator && navigator.language && navigator.language.toLowerCase().startsWith('pl')) {
        return 'pl';
      }
    } catch {}
    return 'en';
  };

  let currentLang = 'en';

  const applyLang = (lang) => {
    currentLang = lang;
    const dict = translations[lang];
    if (!dict) return;

    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      if (!originalHtml.has(el)) originalHtml.set(el, el.innerHTML);
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        el.innerHTML = dict[key];
      } else if (lang === 'en') {
        el.innerHTML = originalHtml.get(el);
      }
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const attr = el.getAttribute('data-i18n-attr');
      const key = el.getAttribute('data-i18n-attr-key');
      if (!attr || !key) return;
      if (!originalAttr.has(el)) originalAttr.set(el, el.getAttribute(attr));
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        el.setAttribute(attr, dict[key]);
      } else if (lang === 'en' && originalAttr.get(el) !== null) {
        el.setAttribute(attr, originalAttr.get(el));
      }
    });

    // The visible glyph ("PL" / "EN") is set here, in the same pass as the aria-label above,
    // so the two always agree — the accessible name embeds the visible text instead of
    // hiding it behind a description (WCAG 2.5.3 Label in Name). No aria-pressed: this
    // button's label already names the action ("switch to Polish/English"), not a toggle
    // state, so a pressed state would only contradict it.
    if (toggleBtn) {
      toggleBtn.textContent = lang === 'pl' ? 'EN' : 'PL';
    }
  };

  const storedLang = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  })();

  const initialLang = storedLang === 'pl' || storedLang === 'en' ? storedLang : detectInitialLang();
  applyLang(initialLang);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const nextLang = currentLang === 'pl' ? 'en' : 'pl';
      try {
        localStorage.setItem(STORAGE_KEY, nextLang);
      } catch {}
      applyLang(nextLang);
    });
  }
})();
