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
      'index.nav.aria': 'Menu główne',
      'index.nav.contact': 'Kontakt',
      'index.nav.projects': 'Projekty',
      'index.nav.github': 'GitHub',
      'index.nav.linkedin': 'LinkedIn',
      'index.meta.title': 'Dominik Barański — programista Unity',
      'index.meta.description':
        'Dominik Barański buduje systemy gier w Unity i C#: wielowątkowy silnik symulacji w grze na Androida z ponad 15 000 pobrań oraz AI przeciwników, pathfinding, widoczność i proceduralne lochy w zespołowym projekcie 2D.',

      // ---------- index.html: hero ----------
      'index.hero.lead':
        'Buduję systemy gier w Unity i C#, dbając o wydajność i testowalność kodu. Moja praca obejmuje zarówno wielowątkowy silnik symulacji w grze na Androida z ponad 15 000 pobrań w Google Play, jak i AI przeciwników, pathfinding, system widoczności oraz generator lochów w zespołowym projekcie 2D. Na stażu w Rubens Games budowałem też systemy rozgrywki w zespole studia, razem z jego grafikami. Szukam pracy jako junior/mid Unity developer.',
      'index.hero.stack': 'Unity · C# · Burst / Job System · shadery URP · Android',
      'index.hero.cta': 'Zobacz projekty',

      // ---------- index.html: projects ----------
      'index.section.projects': 'Projekty',
      'index.project.gol.meta': 'Android · Unity 2022.3 · solo · 15 000+ pobrań w Google Play',
      'index.project.gol.body':
        'Symulator gry w życie, który na telefonie musi poradzić sobie z setkami tysięcy żywych komórek. Najważniejsza praca kryje się w silniku: obliczenia na bitach w Burst i Job System, wątek symulacji, który nie blokuje renderowania, i renderowanie, którego koszt zależy od ekranu, a nie od wielkości wzorca.',
      'index.project.gol.cta': 'Zobacz, jak działa silnik →',
      'index.project.grave.meta': 'PC · Unity 6 URP 2D · zespół 4 osób · praca inżynierska',
      'index.project.grave.body':
        'Survival horror 2D z widokiem z góry, zrobiony w 4-osobowym zespole. Cztery z systemów, które do niego zbudowałem: pathfinding A* o ograniczonym koszcie na klatkę, maska światła renderowana przez drugą kamerę i własne shadery, generator lochów z seeda pokryty 48 testami jednostkowymi i AI przeciwników składane z wymiennych komponentów.',
      'index.project.grave.cta': 'Zobacz systemy →',
      'index.project.lp.meta': 'PC · Unity 2022.3 URP · zespół studia · staż w Rubens Games, lipiec–wrzesień 2024',
      'index.project.lp.body':
        'Gra z widokiem z pierwszej osoby o kontroli bezpieczeństwa na lotnisku, tworzona przez zespół studia Rubens Games, w którym byłem na stażu. Trzy systemy, które do niej zbudowałem: fizyka walizki działająca tylko w trakcie jej kontroli, skaner rentgenowski kolorujący przedmioty według materiału za pomocą warstw i renderer features URP, bez kodu renderowania, oraz koło interakcji, którego opcje zależą od stanowiska, na którym jest pasażer.',
      'index.project.lp.cta': 'Zobacz, jak działają →',

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
      'case.next.aria': 'Następne studium przypadku',
      'case.foot.linkedin': 'LinkedIn',
      'case.foot.email': 'E-mail',
      'case.foot.repo': 'Repozytorium ↗',
      'case.kicker.gol': 'Android · Unity 2022.3 · solo · opublikowana w Google Play',
      'case.kicker.grave': 'PC · Unity 6 URP 2D · zespół 4 osób · praca inżynierska, 2026',
      'case.kicker.lp': 'PC · Unity 2022.3 URP · zespół studia · staż w Rubens Games, lipiec–wrzesień 2024',
      'case.foot.gol':
        'Projekt solo. Repozytorium jest prywatne — fragmenty kodu są powyżej, a resztę chętnie pokażę na rozmowie.',
      'case.foot.grave': 'Projekt zespołowy (4 osoby). Pokazuję tylko systemy, które zbudowałem sam.',
      'case.foot.lp':
        'Projekt studyjny, niepubliczny. Pokazuję go za zgodą Rubens Games — resztę chętnie omówię na rozmowie.',
      'case.meta.gol.title': 'Game of Life — studium przypadku — Dominik Barański',
      'case.meta.gol.description':
        'Symulator gry w życie na Androida zbudowany tak, by radzić sobie z wzorcami liczącymi setki tysięcy żywych komórek: bitowo-równoległy silnik na Burst/Job System, zweryfikowany poza Unity. 15 000+ pobrań w Google Play.',
      'case.meta.grave.title': 'Grave — studium przypadku — Dominik Barański',
      'case.meta.grave.description':
        'Systemy zbudowane do gry Grave, survival horroru 2D z widokiem z góry, zrobionego w 4-osobowym zespole w Unity 6: pathfinding A*, maska światła renderowana przez drugą kamerę i własne shadery, generator lochów oparty na seedzie, pokryty 48 testami jednostkowymi, oraz AI przeciwników złożone z komponentów.',
      'case.meta.lp.title': 'Luggage Please — studium przypadku — Dominik Barański',
      'case.meta.lp.description':
        'Systemy zbudowane podczas stażu w Rubens Games: fizyka walizki i przedmiotów, skaner rentgenowski złożony z warstw i renderer features URP oraz kontekstowe koło interakcji.',

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
      'gol.kn2.value': '64 → 141 gen./s',
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
      'gol.sys1.code.aria':
        'Fragment kodu z BitmaskGenerationSolver.cs, metoda Step: budowa zbioru kandydatów i planowanie łańcucha jobów Burst',

      // ---------- game-of-life.html: system 2 ----------
      'gol.sys2.title': 'Symulacja w wątku w tle, z dwoma sposobami przekazywania wyników',
      'gol.sys2.problem':
        'Symulacja nie może blokować renderowania ani obsługi dotyku. Przy niskiej prędkości każda generacja musi też osobno trafić do głównego wątku, bo napędza animacje narodzin i śmierci komórek oraz wibracje. Przy wysokiej prędkości to przekazywanie generacja po generacji stało się wąskim gardłem i szybszy silnik zaczął pogarszać płynność.',
      'gol.sys2.how':
        'Poniżej prędkości, przy której animacje i tak się wyłączają, zmiany każdej generacji (narodzone i obumarłe komórki) trafiają do bufora pierścieniowego, czyli kolejki o stałym rozmiarze, która ponownie używa swoich slotów. Dzięki temu wątek obliczeniowy może liczyć z wyprzedzeniem. Powyżej tej prędkości nie ma czego animować, więc wątek obliczeniowy sam kopiuje całe zmienione chunki do wyświetlanego stanu, a główny wątek tylko renderuje.',
      'gol.sys2.what':
        'Bezpieczną wielowątkowość wokół API Unity, które działa tylko na głównym wątku: model producent–konsument z jawną dyscypliną locków. Dwa locki, jeden chroniący stan planszy, a drugi liczniki, z których powstaje widok gęstości przy dużym oddaleniu (system 3), są zawsze brane w tej samej kolejności, co wyklucza zakleszczenie. Do tego wytropienie nieintuicyjnej regresji: przejście na kopiowanie całych chunków podniosło tempo losowego wzorca z 275 tys. komórek z 64 do 141 generacji na sekundę na Pixelu 6 Pro.',
      'gol.diag2.aria':
        'Dwa tory: u góry wątek obliczeniowy, na dole główny wątek. Poniżej progu animacji blok jobów Burst zasila bufor pierścieniowy zmian, leżący na granicy obu torów, a główny wątek odtwarza jedną generację na klatkę, z animacjami. Powyżej progu osobny blok jobów Burst zasila, nadal na torze wątku obliczeniowego, blok kopiujący całe zmienione chunki; kopia trafia do wyświetlanego zbioru komórek na granicy obu torów, a główny wątek tylko renderuje, niezależnie od tempa symulacji.',
      'gol.diag2.laneCalc': 'WĄTEK OBLICZENIOWY',
      'gol.diag2.laneMain': 'WĄTEK GŁÓWNY',
      'gol.diag2.pathA': 'PONIŻEJ PROGU ANIMACJI',
      'gol.diag2.pathB': 'POWYŻEJ PROGU',
      'gol.diag2.burst': 'Joby Burst',
      'gol.diag2.ring': 'Bufor pierścieniowy zmian',
      'gol.diag2.ringSub': 'zmiany, nie migawki',
      'gol.diag2.replay': 'Jedna generacja na klatkę',
      'gol.diag2.withAnim': 'Z animacjami',
      'gol.diag2.copies': 'Kopiuje zmienione chunki',
      'gol.diag2.displayed': 'Wyświetlany zbiór komórek',
      'gol.diag2.shared': 'stan współdzielony',
      'gol.diag2.renders': 'Tylko renderuje',
      'gol.diag2.fpsIndep': 'FPS niezależny od tempa',
      'gol.diag2.cap':
        'Dwa sposoby przekazywania wyników, wybierane zależnie od tempa symulacji: poniżej progu animacji główny wątek odtwarza każdą generację z animacjami; powyżej niego wątek obliczeniowy sam kopiuje zmienione chunki, a główny wątek tylko renderuje.',

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
        'Dyscyplinę testowania kluczowej logiki gry w trzech konkretnych technikach. Testy różnicowe sprawdzają każdą generację względem implementacji brute-force, a nie tylko stan końcowy, więc błąd wychodzi w tej generacji, w której powstał. Test regresji oparty na hashu wzorcowym dowodzi, że refaktor niczego nie zmienił. Kontrola negatywna dowodzi, że sprawdzanie Burst bez edytora w ogóle potrafi zgłosić błąd. Wszystko działa z linii poleceń, bez otwierania edytora.',
      'gol.diag4.aria':
        'To samo źródło solvera trafia do builda Android do sklepu i do harnessu testowego .NET, który porównuje każdą generację z naiwną implementacją referencyjną i sprowadza każdy przebieg do jednego hasha wzorcowego. BurstProbe kompiluje te same pięć jobów pod ARM64, z kontrolą negatywną, która musi się nie skompilować.',
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
      'gol.diag4.negative': 'Kontrola negatywna',
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
      'grave.sys1.code.aria':
        'Fragment kodu z AStarPathfinder.cs, metoda FindPath: odrzucenie celu po regionie, pętla wyszukiwania na kopcu, limit węzłów i awaryjny zwrot częściowej ścieżki',

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
      'grave.diag2.aria':
        "Czteroetapowy pipeline, od góry do dołu. Pierwszy: wachlarz promieni dla każdego światła znajduje krawędzie i buduje mesh za pomocą OcclusionMeshBuilder, wspólnego dla gracza i lamp. Drugi: kamera maski renderuje te meshe do RenderTexture z blendingiem typu max, więc wygrywa jaśniejsze światło; działa na warstwie VisionMask. Trzeci: wynik jest udostępniany jako globalna tekstura _VisionMask. Czwarty: nakładka ciemności i shadery sprite'ów próbkują tę teksturę, żeby przyciemnić scenę i ukryć wszystko, do czego nie dociera światło.",

      // ---------- grave.html: system 3 ----------
      'grave.sys3.title': 'Generator lochów: z seeda, walidowany, przetestowany',
      'grave.sys3.problem':
        'Każda rozgrywka potrzebuje nowego lochu, który zawsze jest w pełni spójny, bez nieosiągalnych pokoi i bez drzwi prowadzących w skałę. Musi też być powtarzalny: ten sam seed ma dać identyczny loch na każdym komputerze, żeby poziom dało się odtworzyć, debugować i testować na podstawie samego seeda.',
      'grave.sys3.how':
        'Generator to pipeline w czystym C#, w osobnym assembly, bez zależności od scen i MonoBehaviour. Rozmieszcza pokoje i łączy je minimalnym drzewem rozpinającym zbudowanym algorytmem Kruskala z Union-Find, co daje najtańszy zestaw korytarzy łączący wszystkie pokoje. Kilka dodatkowych krawędzi tworzy pętle. Potem pipeline wycina pokoje i korytarze, w tym ślepe wnęki w korytarzach, waliduje wynik, a gdy walidacja się nie powiedzie, ponawia próbę z seedem wyprowadzonym z pierwotnego. Deterministyczny generator liczb losowych daje każdemu etapowi osobny, niezależny strumień, więc zmiana jednego etapu nie przetasowuje pozostałych. Analiza grafu znajduje punkty artykulacji (przewężenia), czyli komórki, których zablokowanie rozcięłoby loch na dwie części, więc nie stawia się na nich żadnych obiektów.',
      'grave.sys3.what':
        'Zastosowanie algorytmów grafowych do realnego problemu w grze i architekturę przygotowaną do testowania. Generator nie potrzebuje sceny, więc pokrywa go 48 testów jednostkowych EditMode. Wiele z nich sprawdza dziesiątki lub setki seedów; w jednym z testów każdy z 500 losowych seedów musi przejść walidację i dać unikalny układ.',
      'grave.sys3.tests.label': 'testy:',
      'grave.sys3.code.aria':
        'Fragment kodu z RoomCorridorGenerator.cs, metoda BuildOnce: cały pipeline generowania, jeden etap na linię, każdy z własnym strumieniem losowości',

      // ---------- grave.html: system 4 ----------
      'grave.sys4.title':
        'AI przeciwników: zmysły składane z komponentów i budżet aktualizacji zależny od odległości',
      'grave.sys4.problem':
        'W wygenerowanym lochu jest wielu przeciwników. Każdy uruchamia maszynę stanów (patrol, pościg, sprawdzanie tropu) i kilka razy na sekundę pełne wyszukiwanie A*, choć większość z nich jest daleko od gracza. Typy przeciwników różnią się też tym, jak wyczuwają gracza, a dodanie nowego typu nie powinno wymagać zmian we wspólnej klasie bazowej.',
      'grave.sys4.how':
        '<code>EnemyBase</code> wyszukuje swoje komponenty po interfejsach i nie wie, jakie klasy za nimi stoją. Odpytuje wszystkie podpięte detektory, a każdy z nich może potwierdzić obecność gracza. Słuch to osobny kanał zasilany przez szynę zdarzeń hałasu: usłyszany hałas każe przeciwnikowi sprawdzić miejsce, ale nie oznacza wykrycia, bo to tylko podejrzenie. Strefy aktualizacji z diagramu są liczone od zasięgu zmysłów konkretnego przeciwnika, więc budżet dopasowuje się do jego typu. Losowy rozrzut sprawia, że grupy przeciwników nie aktualizują się w tej samej klatce, a uśpieni przeciwnicy zwalniają zapamiętane ścieżki.',
      'grave.sys4.what':
        'Kompozycję zamiast dziedziczenia w praktyce. „Ślepy” typ przeciwnika, <code>BlindListenerEnemy</code>, to podklasa, której jedyną realną treścią jest <code>[RequireComponent(typeof(SoundPlayerDetector))]</code>: ślepota oznacza po prostu, że jego prefab nie ma <code>VisionPlayerDetector</code>. Ten typ doszedł bez żadnych zmian w <code>EnemyBase</code>. Do tego budżetowanie kosztu AI na dużym poziomie bez pogorszenia reakcji przeciwników w pobliżu gracza.',
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
      'grave.diag4hub.aria':
        "EnemyBase stoi w środku huba. Przez interfejsy odpytuje dwa komponenty zmysłów, z których każdy łączy się z konkretnym punktem na krawędzi huba: IPlayerDetector, implementowany przez VisionPlayerDetector, odpowiada za wzrok, a INoiseSensor, implementowany przez SoundPlayerDetector i zasilany z NoiseEvents, za słuch, który wzbudza tylko podejrzenie, a nie wykrycie. Osobna, przerywana szprycha prowadzi w dół do IMovementStrategy, implementowanego przez PathfindingMovement albo SimpleDirectMovement — ruch nie jest zmysłem. Panel z boku, połączony z hubem własną linią, pokazuje ten sam hub bez szprychy wzroku: ślepy typ przeciwnika.",
      'grave.diag4ringsWide.aria':
        'Koncentryczne pierścienie wokół gracza, z legendą obok. Najbardziej wewnętrzny krąg jest aktualizowany co klatkę, a jego promień to zasięg zmysłów plus margines. Środkowy pas aktualizuje się co interwał, z losowym rozrzutem. Zewnętrzny pas jest uśpiony i zwalnia zapamiętaną ścieżkę. Dwa bliskie okręgi na granicy uśpienia oznaczają histerezę — linia wybudzenia leży tuż wewnątrz linii uśpienia — a dolny próg bezpieczeństwa gwarantuje, że przeciwnik, który mógłby jeszcze wyczuć gracza, nigdy nie zostanie uśpiony.',
      'grave.diag4ringsTall.aria':
        'Koncentryczne pierścienie wokół gracza, z legendą pod spodem. Najbardziej wewnętrzny krąg jest aktualizowany co klatkę, a jego promień to zasięg zmysłów plus margines. Środkowy pas aktualizuje się co interwał, z losowym rozrzutem. Zewnętrzny pas jest uśpiony i zwalnia zapamiętaną ścieżkę. Dwa bliskie okręgi na granicy uśpienia oznaczają histerezę — linia wybudzenia leży tuż wewnątrz linii uśpienia — a dolny próg bezpieczeństwa gwarantuje, że przeciwnik, który mógłby jeszcze wyczuć gracza, nigdy nie zostanie uśpiony.',
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
        'Dolny próg bezpieczeństwa sprawia, że przeciwnik, który mógłby jeszcze wyczuć gracza, nigdy nie zostaje uśpiony; histereza nie pozwala przeciwnikom na granicy przełączać się tam i z powrotem.',

      // ---------- grave.html: takeaway ----------
      'grave.takeaway':
        'Łączy je jedna zasada: luźne powiązanie przez dane. Generator nic nie wie o pathfindingu, widoczności ani AI. Tworzy układ, z którego powstają collidery czytane zarówno przez siatkę A*, jak i przez promienie światła, oraz listę przewężeń i wnęk w korytarzach, z której korzysta rozmieszczanie przeciwników: zasadzki trafiają do wnęk, a strażnicy stają obok przewężenia, nigdy na nim. AI z kolei sięga do pathfindingu wyłącznie przez wąskie interfejsy, więc systemy współpracują, nie zależąc nawzajem od swojego kodu.',

      // ---------- luggage-please.html: intro ----------
      'lp.tagline':
        'Systemy, które zbudowałem na stażu w Rubens Games: fizyka walizki, skaner rentgenowski złożony z renderer features URP i kontekstowe koło interakcji.',
      'lp.intro':
        'Luggage Please to gra z widokiem z pierwszej osoby o kontroli bezpieczeństwa na lotnisku, tworzona przez zespół studia Rubens Games, w którym byłem na stażu. Grafikę przygotowali artyści studia. Opisuję tu trzy systemy, które zbudowałem w czasie stażu: fizykę walizki i przedmiotów, skaner rentgenowski rozróżniający materiały i kontekstowe koło interakcji do rozmów z pasażerami.',
      'lp.hero.alt':
        'Grafika tytułowa Luggage Please: rysunkowa otwarta walizka z ubraniami i gumową kaczką, a wokół niej pistolet, nóż, złota rybka i otwarta książka; pod spodem tytuł gry.',
      'lp.hero.credit': 'Grafika: Rubens Games.',
      'lp.meta.ogImageAlt':
        'Grafika tytułowa Luggage Please na czarnym tle: rysunkowa otwarta walizka ze złożonymi ubraniami i gumową kaczką, a wokół niej złota rybka, pistolet, nóż i otwarta książka; pod spodem tytuł gry.',

      // ---------- luggage-please.html: at a glance ----------
      'lp.glance.team.t': 'Zespół',
      'lp.glance.team.d': 'zespół studia Rubens Games (staż); grafika od artystów studia',
      'lp.glance.covered.t': 'Opisuję tu',
      'lp.glance.covered.d':
        'trzy zbudowane przeze mnie systemy: fizykę walizki i przedmiotów, skaner rentgenowski, kontekstowe koło interakcji',
      'lp.glance.engine.t': 'Silnik',
      'lp.glance.platform.t': 'Platforma',
      'lp.glance.status.d': 'projekt ze stażu (lipiec–wrzesień 2024), niewydany',
      'lp.glance.tech.t': 'Kluczowe technologie (w tych systemach)',
      'lp.glance.tech.d':
        'C#, fizyka Rigidbody, zapytania fizyczne (OverlapBox, BoxCast), URP Renderer Features (RenderObjects), Shader Graph, culling mask, RenderTexture, uGUI, TextMeshPro',
      'lp.glance.code.t': 'Kod',
      'lp.glance.code.d':
        'projekt studia, niepubliczny; cały pokazany tu kod napisałem sam w czasie stażu, a pokazuję go za zgodą Rubens Games',

      // ---------- luggage-please.html: systems on this page ----------
      'lp.toc1.skills': 'Siły Rigidbody · zapytania fizyczne · przełączanie w tryb kinematyczny',
      'lp.toc2.skills': 'URP RenderObjects · culling mask · RenderTexture',
      'lp.toc3.skills': 'uGUI · UI oddzielone od logiki gry · korutyny',

      // ---------- luggage-please.html: system 1 ----------
      'lp.sys1.title': 'Fizyka przedmiotów działająca tylko w trakcie kontroli',
      'lp.sys1.problem':
        'Spakowana walizka musi zachowywać się jak jeden solidny obiekt, gdy gracz ją niesie, rzuca albo wysyła przez skaner. Na stanowisku kontroli ta sama walizka ma się otworzyć i zamienić w luźne przedmioty, które gracz może podnieść, obrócić i spakować z powrotem, a wieko nie może się zamknąć przez wystający przedmiot.',
      'lp.sys1.how':
        'Fizyka przedmiotów działa tylko w trakcie kontroli: włącza się, gdy gracz zaczyna kontrolę otwartej walizki. Gdy kontrola się kończy, sprawdzenie granic walizki (<code>OverlapBox</code>) ustala, które przedmioty są w środku, zanim fizyka znów się wyłączy. Te przedmioty stają się dziećmi walizki i przechodzą w tryb kinematyczny, czyli poruszają się tylko razem z rodzicem, a to, co zostało na zewnątrz, zostaje na miejscu. Dzięki temu zamknięta walizka porusza się jak jedno ciało. Chwycony przedmiot jest przyciągany do kursora siłami, a nie teleportowany, więc nadal odpycha inne przedmioty, a reset obrotu przywraca tylko jego orientację. Podczas przeciągania półprzezroczysta kopia bez kolizji pokazuje, gdzie przedmiot wyląduje: rysuje ją renderer feature URP typu RenderObjects, a krokowy <code>BoxCast</code>, czyli rzut promienia w kształcie prostopadłościanu, opuszcza ją na pierwszą powierzchnię pod spodem. Podczas zamykania wieka co klatkę działa osobny <code>OverlapBox</code> wokół niego, a każdy przedmiot na jego drodze sprawia, że wieko otwiera się z powrotem.',
      'lp.sys1.what':
        'Projektowanie interakcji fizycznych wokół tego, kiedy symulacja jest naprawdę potrzebna: przedmioty są symulowane tylko wtedy, gdy gracz może ich dotknąć, a stan zmieniają w dwóch wyraźnych momentach: na początku i na końcu kontroli. Do tego zapytania fizyczne użyte jako logika gry. Wieko jest animowane obrotem, a nie symulowane, więc zamiast czekać na zdarzenia kolizji, co klatkę samo sprawdza, czy coś stoi mu na drodze.',
      'lp.sys1.caption':
        'Otwarta walizka w trakcie kontroli: każdy przedmiot w środku jest osobnym obiektem fizycznym, który można chwycić, obrócić i spakować z powrotem.',
      'lp.sys1.code.aria':
        'Fragment kodu z Assets/Scripts/Inspection/Luggage Animator.cs, metoda CheckCollisions: OverlapBox wokół collidera wieka, ograniczony maską do warstw przedmiotów, przy trafieniu otwiera wieko z powrotem',

      // ---------- luggage-please.html: system 2 ----------
      'lp.sys2.title': 'Skaner rentgenowski zbudowany z warstw i renderer features URP',
      'lp.sys2.problem':
        'Skaner pokazuje na żywo prześwietlony obraz walizki przejeżdżającej przez maszynę. Przedmioty mają kolory według kategorii materiału (metal, organiczne, inne), żeby gracz mógł wypatrzyć podejrzaną zawartość. Modele przedmiotów przygotowali artyści studia, a część z nich łączy kilka materiałów, więc kolorowanie nie może opierać się na kodzie pisanym osobno dla każdego przedmiotu.',
      'lp.sys2.how':
        'Podział na kolory to konfiguracja, a nie kod C#. Każda część modelu przedmiotu leży na jednej z czterech warstw rentgena: inne, metal, organiczne i skorupa walizki. Ortograficzna kamera skanera widzi tylko te warstwy i renderuje do RenderTexture, wyświetlanej na modelu ekranu konsoli. Cztery renderer features typu RenderObjects, po jednym na warstwę, rysują te obiekty z materiałem nadpisującym. Renderer features to dodatkowe przebiegi renderowania ustawiane w assecie renderera URP. Wszystkie cztery materiały nadpisujące korzystają z jednego shadera fresnela, który zrobiłem w Shader Graph; każdy ma własny kolor. Efekt fresnela rozjaśnia powierzchnie ustawione bokiem do kamery, więc przedmioty wyglądają jak świecące kontury. Krótki skrypt przesuwa kamerę skanera razem z walizką, gdy taśma przewozi ją przez maszynę.',
      'lp.sys2.what':
        'Użycie gotowych elementów URP zamiast pisania kodu renderowania: warstwy, culling mask, renderer features RenderObjects z materiałami nadpisującymi i RenderTexture na ekranie w świecie gry. Rozwiązanie skaluje się też z zawartością. Skaner obsługuje 27 prefabów przedmiotów, a rekwizyt z kilku materiałów, np. dron, ma kilka kolorów, bo każda jego część leży na własnej warstwie. Dodanie przedmiotu nie wymaga kodu, tylko właściwych warstw w jego prefabie.',
      'lp.sys2.caption':
        'Ekran konsoli skanera: przedmioty organiczne, np. owoce, świecą na żółto, metalowe na pomarańczowo, a cała reszta, łącznie ze skorupą walizki, na turkusowo.',
      'lp.diag2.b1a': 'Części modeli przedmiotów',
      'lp.diag2.b1b': '4 warstwy: inne · metal · organiczne · skorupa walizki',
      'lp.diag2.b2a': 'Kamera skanera (ortograficzna)',
      'lp.diag2.b2b': 'Culling mask: tylko warstwy rentgena',
      'lp.diag2.b2c': '→ Podąża za walizką',
      'lp.diag2.b3b': 'Materiał nadpisujący na warstwę',
      'lp.diag2.b3c': 'Jeden shader fresnela, 4 kolory',
      'lp.diag2.b5a': 'Materiał ekranu konsoli',
      'lp.diag2.cap':
        'Pięć etapów od warstw przedmiotu do ekranu skanera; każdy z nich to konfiguracja, a nie kod pisany dla pojedynczego przedmiotu.',
      'lp.diag2.aria':
        'Pięcioetapowy pipeline, od góry do dołu. Pierwszy: części modeli przedmiotów leżą na czterech warstwach rentgena — inne, metal, organiczne, skorupa walizki. Drugi: ortograficzna kamera skanera z culling mask ustawioną tylko na warstwy rentgena podąża za walizką. Trzeci: cztery renderer features typu RenderObjects rysują obiekty z osobnym materiałem nadpisującym dla każdej warstwy — jeden shader fresnela w czterech kolorach. Czwarty: wynik trafia do RenderTexture. Piąty: ta tekstura jest materiałem ekranu konsoli.',

      // ---------- luggage-please.html: system 3 ----------
      'lp.sys3.title': 'Koło interakcji, którego opcje zależą od stanowiska pasażera',
      'lp.sys3.problem':
        'Pasażer potrzebuje innych akcji zależnie od tego, na jakim etapie odprawy się znajduje: to, co ma sens w kolejce, jest nie na miejscu przy bramce z wykrywaczem metalu. Wybór ma być szybki i nie może wyrywać gracza z widoku gry do pełnoekranowego menu.',
      'lp.sys3.how':
        'Kod interakcji z NPC buduje listę identyfikatorów opcji na podstawie stanu pasażera. Każde stanowisko (kolejka, nadanie bagażu, bramka z wykrywaczem metalu, ważenie) ma własny zestaw, a opcja nadbagażu dochodzi tylko wtedy, gdy na wadze leży bagaż właśnie tego pasażera. Koło jest zbudowane w czystym uGUI. Pokazuje tylko gotowe segmenty o identyfikatorach z listy i rozkłada je równo na okręgu za pomocą trygonometrii, bez względu na ich liczbę. Po najechaniu kursorem na opcję jej nazwa pojawia się w środku. Wywołująca korutyna czeka, aż gracz wybierze opcję albo zamknie koło, i wtedy uruchamia odpowiednią akcję.',
      'lp.sys3.what':
        'Komponent UI oddzielony od logiki gry. Koło dostaje listę identyfikatorów, rozmieszcza tyle segmentów, ile otrzyma, i zwraca wybór, a wszystkie reguły lotniska zostają w kodzie NPC. Koło samo zarządza też trybem sterowania w OnEnable/OnDisable: otwarcie zamraża rozglądanie się i ruch oraz odblokowuje kursor, a zamknięcie przywraca jedno i drugie, więc żaden wywołujący nie musi o tym pamiętać.',
      'lp.sys3.caption':
        'Trzy opcje, więc każda zajmuje jedną trzecią okręgu; po najechaniu kursorem na opcję jej nazwa pojawia się w środku.',
      'lp.sys3.code.aria':
        'Fragment kodu z Assets/Scripts/DialogWheel/DialogWheel.cs: ustawianie segmentu koła i obliczanie jego pozycji wyłącznie na podstawie liczby opcji',

      // ---------- luggage-please.html: video facades ----------
      'lp.video1.title': 'Fizyka walizki — Luggage Please',
      'lp.video1.label': 'Odtwórz wideo: fizyka walizki',
      'lp.video2.title': 'Skaner rentgenowski — Luggage Please',
      'lp.video2.label': 'Odtwórz wideo: skaner rentgenowski',
      'lp.video3.title': 'Koło interakcji — Luggage Please',
      'lp.video3.label': 'Odtwórz wideo: koło interakcji',
      'lp.watchYoutube': 'Obejrzyj na YouTube ↗',

      // ---------- luggage-please.html: takeaway ----------
      'lp.takeaway':
        'Wszystkie trzy systemy są zbudowane tak, żeby mogła się do nich podłączyć praca innych osób. Skaner i podgląd lądowania składają się z warstw i renderer features URP, a nie z kodu renderowania, więc nowy model przedmiotu pojawia się w skanerze w kolorze swojej kategorii, gdy tylko jego części trafią na właściwe warstwy. Koło dostaje od wywołującego listę identyfikatorów opcji i nie musi wiedzieć, skąd się wzięły. Warstwy sięgają nawet fizyki: sprawdzanie, czy coś blokuje wieko, używa warstw przedmiotów z rentgena jako maski, więc jeden układ warstw obsługuje i renderowanie, i fizykę. Ceną jest sprzężenie obu systemów: przedmiot bez warstwy rentgena nie pojawiłby się w skanerze i nie zablokowałby też wieka.',
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
