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
        'Dominik Barański buduje systemy gier w Unity i C#: wielowątkowy silnik symulacji w grze na Androida z ponad 15 000 pobrań oraz AI przeciwników, pathfinding, widoczność i proceduralne lochy w zespołowym projekcie 2D, a do tego systemy rozgrywki ze stażu w Rubens Games.',

      // ---------- index.html: hero ----------
      'index.hero.lead':
        'Buduję systemy gier w Unity i C#, dbając o wydajność i testowalność kodu. Moja praca obejmuje zarówno wielowątkowy silnik symulacji w grze na Androida z ponad 15 000 pobrań w Google Play, jak i AI przeciwników, pathfinding, system widoczności oraz generator lochów w zespołowym projekcie 2D. Na stażu w Rubens Games budowałem też systemy rozgrywki w zespole studia, razem z artystami studia. Szukam pracy jako Unity developer.',
      'index.hero.stack': 'Unity · C# · Burst / Job System · shadery URP · Android',
      'index.hero.cta': 'Zobacz projekty',

      // ---------- index.html: projects ----------
      'index.section.projects': 'Projekty',
      // The card meta line is one span per segment (index.html); the segments that read the same in
      // both languages (Android, Unity versions, solo, PC) have no key.
      'index.project.gol.meta4': '15 000+ pobrań w Google Play',
      'index.project.gol.body':
        'Symulator gry w życie, który na telefonie musi poradzić sobie z setkami tysięcy żywych komórek. Najważniejsza praca kryje się w silniku: obliczenia na bitach w Burst i Job System, wątek symulacji, który nie blokuje renderowania, i renderowanie, którego koszt zależy od ekranu, a nie od wielkości wzorca.',
      'index.project.gol.cta': 'Zobacz, jak działa silnik →',
      'index.project.grave.meta3': 'zespół 4 osób',
      'index.project.grave.meta4': 'praca inżynierska',
      'index.project.grave.body':
        'Survival horror 2D z widokiem z góry, zrobiony w 4-osobowym zespole. Cztery z systemów, które do niego zbudowałem: pathfinding A* o ograniczonym koszcie na klatkę, maska światła renderowana przez drugą kamerę i własne shadery, generator lochów z seeda pokryty 48 testami jednostkowymi i AI przeciwników składane z wymiennych komponentów.',
      'index.project.grave.cta': 'Zobacz systemy →',
      'index.project.lp.meta3': 'zespół studia',
      'index.project.lp.meta4': 'staż w Rubens Games',
      'index.project.lp.body':
        'Gra z widokiem z pierwszej osoby o kontroli bezpieczeństwa na lotnisku, tworzona przez zespół studia Rubens Games, w którym byłem na stażu. Trzy systemy, które do niej zbudowałem: fizyka walizki działająca tylko w trakcie jej kontroli, skaner rentgenowski kolorujący przedmioty według materiału za pomocą warstw i renderer features URP, bez kodu renderowania, oraz koło interakcji, którego opcje zależą od stanowiska, na którym jest pasażer.',
      'index.project.lp.cta': 'Zobacz, jak działają →',

      // ---------- index.html: contact ----------
      'index.section.contact': 'Kontakt',
      'index.contact.lead': 'Chętnie omówię kod tych projektów na rozmowie.',
      'index.contact.email.label': 'E-mail:',
      'index.contact.linkedin.label': 'LinkedIn:',
      'index.contact.github.label': 'GitHub:',

      // ---------- index.html: redesigned hero / cards (2026-09) ----------
      'index.hero.kicker': 'Szukam pracy jako Unity developer',
      'index.hero.intro': 'Buduję systemy gier w Unity i C#, dbając o wydajność i testowalność kodu.',
      'index.hero.email': 'Napisz do mnie',
      'index.hero.stat1.value': '15\u00a0000+',
      'index.hero.stat1.label': 'pobrań w Google Play',
      'index.hero.stat1.tag': 'Game of Life · solo',
      'index.hero.stat2.label': 'testów jednostkowych mojego generatora lochów',
      'index.hero.stat2.tag': 'Grave · zespół 4 osób',
      'index.hero.stat3.label': 'staż w zespole studia',
      'index.hero.stat3.tag': 'Luggage Please · lipiec–wrzesień 2024',
      'index.projects.note': 'Każde studium przypadku omawia problem, działanie systemu i kod, który za nim stoi.',
      'index.project.systems': 'Systemy, które zbudowałem',
      'index.project.gol.alt': 'Universal Turing Machine: 252 tys. żywych komórek, mocno oddalona na ekranie telefonu i narysowana jako jedna tekstura gęstości.',
      'index.project.gol.media': 'Widok gęstości · 252 tys. komórek',
      'index.project.gol.summary': 'Symulator gry w życie, który na telefonie musi poradzić sobie z setkami tysięcy żywych komórek.',
      'index.project.gol.sys1': 'Silnik symulacji, który przelicza tylko to, co się zmieniło (Burst, Job System)',
      'index.project.gol.sys2': 'Wątek symulacji, który nie blokuje renderowania',
      'index.project.gol.sys3': 'Renderowanie, którego koszt zależy od ekranu, a nie od wielkości wzorca',
      'index.project.gol.sys4': 'Testy, które uruchamiają silnik z wersji sklepowej poza Unity i porównują każdą generację z prostą wersją wzorcową',
      'index.project.grave.alt': 'Grave z góry: pomieszczenie w lochu oświetlone tylko w stożku widzenia gracza.',
      'index.project.grave.media': 'System widoczności',
      'index.project.grave.summary': 'Survival horror 2D z widokiem z góry, w którym gracz widzi tylko to, do czego dociera światło. Powstał w 4-osobowym zespole, a ja zbudowałem systemy, które generują loch, ukrywają go i prowadzą po nim przeciwników.',
      'index.project.grave.sys1': 'Generator lochów z seeda pokryty 48 testami jednostkowymi',
      'index.project.grave.sys2': 'Światło i linia wzroku: widać tylko to, co widzi gracz (druga kamera, własne shadery)',
      'index.project.grave.sys3': 'A* z limitem kosztu jednego wyszukiwania',
      'index.project.grave.sys4': 'AI przeciwników składane z wymiennych komponentów',
      'index.project.lp.alt': 'Luggage Please: ekran skanera rentgenowskiego z zawartością walizki pokolorowaną według materiału.',
      'index.project.lp.media': 'Skaner rentgenowski',
      'index.project.lp.summary': 'Gra z widokiem z pierwszej osoby o kontroli bezpieczeństwa na lotnisku, tworzona przez zespół studia Rubens Games. Na stażu zbudowałem trzy jej systemy, do których podpinają się grafika i kod NPC studia.',
      'index.project.lp.sys1': 'Fizyka walizki działająca tylko w trakcie jej kontroli',
      'index.project.lp.sys2': 'Skaner rentgenowski kolorujący przedmioty według materiału, zbudowany z renderer features URP: nowy przedmiot nie wymaga kodu',
      'index.project.lp.sys3': 'Kołowe menu akcji, którego opcje zmieniają się przy każdym stanowisku, oddzielone od logiki pasażerów',

      // ---------- Shared case-study UI (game-of-life.html, grave.html) ----------
      'case.skip': 'Przejdź do treści',
      'case.back': '← Wszystkie projekty',
      'case.lang.aria': 'EN, przełącz na angielski',
      'case.keynums': 'Najważniejsze liczby',
      'case.glance': 'W skrócie',
      'case.toc': 'Systemy na tej stronie',
      'case.scrub.hint': 'Przewijaj, żeby odtworzyć nagranie krok po kroku',
      'case.scrub.hint.touch': 'Przesuń w górę, żeby odtworzyć nagranie krok po kroku',
      'case.scrub.skip': 'Pomiń nagranie ↓',
      'case.top.email': 'E-mail',
      'case.rail.aria': 'Części tej strony',
      'case.rail.top': 'Przegląd',
      'case.video.pause': 'Zatrzymaj wideo',
      'case.video.play': 'Odtwórz wideo',
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
        'Projekt solo. Repozytorium jest prywatne, ale fragmenty kodu widać powyżej, a resztę chętnie pokażę na rozmowie.',
      'case.foot.grave': 'Projekt zespołowy (4 osoby). Pokazuję tylko systemy, które zbudowałem sam.',
      'case.foot.lp':
        'Projekt studia, niepubliczny. Kod pokazuję za zgodą Rubens Games, a resztę chętnie omówię na rozmowie.',
      'case.meta.gol.title': 'Game of Life — studium przypadku — Dominik Barański',
      'case.meta.gol.description':
        'Symulator gry w życie na Androida zbudowany tak, by radzić sobie z wzorcami liczącymi setki tysięcy żywych komórek: bitowo-równoległy silnik na Burst/Job System, zweryfikowany poza Unity. 15 000+ pobrań w Google Play.',
      'case.meta.grave.title': 'Grave — studium przypadku — Dominik Barański',
      'case.meta.grave.description':
        'Systemy zbudowane do gry Grave, survival horroru 2D z widokiem z góry, zrobionego w 4-osobowym zespole w Unity 6: generator lochów oparty na seedzie, pokryty 48 testami jednostkowymi, maska światła renderowana przez drugą kamerę i własne shadery, pathfinding A* oraz AI przeciwników złożone z komponentów.',
      'case.meta.lp.title': 'Luggage Please — studium przypadku — Dominik Barański',
      'case.meta.lp.description':
        'Systemy zbudowane podczas stażu w Rubens Games: fizyka walizki i przedmiotów, skaner rentgenowski złożony z warstw i renderer features URP oraz kontekstowe koło interakcji.',

      // ---------- game-of-life.html: intro ----------
      'gol.tagline':
        'Symulator automatu komórkowego na Androida, zbudowany tak, żeby telefon radził sobie z wzorcami liczącymi setki tysięcy żywych komórek.',
      'gol.intro':
        'Gra w życie Conwaya na nieograniczonej planszy: gracz rysuje komórki palcem i patrzy, jak ewoluują. Reguły mieszczą się w trzech linijkach (poniżej). Cała trudność techniczna polega na tym, żeby telefon nadążał z ich stosowaniem, gdy żywych komórek są setki tysięcy.',
      'gol.hero.caption':
        'Universal Turing Machine: 252 tys. żywych komórek, ~240 generacji na sekundę na Pixelu 6 Pro. Przy takim oddaleniu cały widok to jedna tekstura gęstości.',

      // ---------- game-of-life.html: key numbers ----------
      'gol.kn1.value': '15 000+',
      'gol.kn1.label': 'Pobrań w Google Play',
      'gol.kn1.ctx': 'Strona gry w Google Play; projekt solo.',
      'gol.kn2.value': '64 → 141 gen./s',
      'gol.kn2.label': '2,2× więcej generacji na sekundę przy wysokiej prędkości',
      'gol.kn2.ctx':
        'Losowy wzorzec z 275 tys. komórek na Pixelu 6 Pro, po tym, jak główny wątek przestał odtwarzać każdą generację osobno (system 2).',
      'gol.kn3.value': '~50 µs vs 1035 µs',
      'gol.kn3.label': '~20× szybsze wyszukiwanie widocznych komórek, niezależne od rozmiaru wzorca',
      'gol.kn3.ctx':
        'Benchmark poza Unity, widok 200×200 komórek i 316 tys. żywych komórek poza ekranem: zapytanie po chunkach vs stare pełne skanowanie (system 3).',

      // ---------- game-of-life.html: at a glance ----------
      'gol.glance.role.t': 'Rola',
      'gol.glance.role.d': 'solo (silnik, rozgrywka, UI i publikacja w sklepie)',
      'gol.glance.time.t': 'Okres',
      'gol.glance.time.d': '02.2025 – obecnie; w Google Play od 08.2025, aktualizowana po premierze',
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
      // wprowadzenie dla osób, które nie znają gry
      'gol.primer.title': 'Gra w życie w 30 sekund',
      'gol.primer.lead':
        'Siatka komórek, każda żywa albo martwa. W każdym kroku, zwanym generacją, wszystkie komórki zmieniają się naraz, a każda patrzy tylko na swoich ośmiu sąsiadów:',
      'gol.primer.r1': '<b>Narodziny:</b> martwa komórka z dokładnie 3 żywymi sąsiadami ożywa.',
      'gol.primer.r2': '<b>Przetrwanie:</b> żywa komórka z 2 lub 3 żywymi sąsiadami żyje dalej.',
      'gol.primer.r3':
        '<b>Śmierć:</b> każda inna żywa komórka umiera, z samotności (0–1 sąsiadów) albo z tłoku (4 i więcej).',
      'gol.primer.end':
        'Z tych trzech reguł powstają kształty, które wędrują po planszy, działa, które je wystrzeliwują, i wzorce tak duże, że wykonują obliczenia jak maszyna Turinga z filmu.',
      'gol.rail.1': 'Silnik',
      'gol.rail.2': 'Wątki',
      'gol.rail.3': 'Renderowanie',
      'gol.rail.4': 'Testy',
      'gol.sys1.title': 'Silnik, który liczy tylko to, co się zmienia',
      'gol.sys1.problem':
        'Prosta symulacja w każdej generacji odwiedza każdą żywą komórkę, więc jej koszt rośnie razem z całym wzorcem. Na telefonie przy dużych wzorcach symulacja zaczyna się dławić, nawet gdy większość planszy się nie zmienia.',
      'gol.sys1.how':
        'Plansza jest podzielona na chunki 64×64 zapisane jako maski bitowe. Każdy krok przelicza tylko chunki zmienione w poprzednim kroku i ich sąsiadów, licząc żywych sąsiadów 64 komórek naraz arytmetyką bitową. Cały pipeline, a nie tylko rdzeń obliczeń, działa jako joby Burst na pamięci natywnej: na gęstym losowym wzorcu cztery wątki robocze dają 1,96 raza więcej generacji na sekundę niż jeden (pomiar na telefonie).',
      'gol.sys1.what':
        'Profilowanie na urządzeniu docelowym: zrównoleglenie samego rdzenia obliczeń dało wyraźny zysk w edytorze, a na telefonie żadnej mierzalnej różnicy, bo prawdziwym wąskim gardłem było szeregowe zbieranie danych wokół niego. Do tego dyscyplinę alokacji na gorącej ścieżce: usunięcie dwóch tymczasowych NativeArray na chunk zlikwidowało około 6000 natywnych par alokacja/zwolnienie na generację przy mniej więcej 3000 chunków, a po rozgrzaniu sam solver nic nie alokuje w kolejnych generacjach.',
      'gol.sys1.code.aria':
        'Fragment kodu z BitmaskGenerationSolver.cs, metoda Step: budowa zbioru kandydatów i planowanie łańcucha jobów Burst',
      // nagrania z edytora (js/gol-footage.js rysuje licznik i panel bitów sam, w obu językach)
      'gol.footage.label': 'Na nagraniu',
      'gol.footage.kernel': 'Wewnątrz jednego kroku',
      'gol.f1.s1.t': 'Prawdziwy silnik, jedna generacja na klatkę',
      'gol.f1.s1.b':
        'Wzorzec linecrosser (Dave Greene, 2018) liczony przez solver gry, nagrany w edytorze. Każda klatka nagrania to jedna generacja, a licznik pokazuje dla niej liczby z silnika.',
      'gol.f1.s2.t': 'Chunki 64×64',
      'gol.f1.s2.b':
        'Kamera się oddala. Plansza dzieli się na chunki 64×64: chunk to 64 wiersze, a każdy wiersz to jedna liczba 64-bitowa, jeden bit na komórkę. Szare kontury oznaczają 143 chunki z żywymi komórkami.',
      'gol.f1.s3.t': 'Przeliczane jest tylko to, co się zmieniło',
      'gol.f1.s3.b':
        'Żółte kontury: chunki przeliczane w tej generacji, czyli te, które zmieniły się w poprzedniej, razem z sąsiadami, także pustymi. Żółte wypełnienie: chunki, które faktycznie się zmieniły. Na krok przeliczanych jest około 35 chunków; ponad sto ze 143 zajętych śpi i nic nie kosztuje.',
      'gol.f2.s1.t': 'Stop-klatka na jednym kroku',
      'gol.f2.s1.b':
        'Gra zatrzymuje się w generacji 399, z chunkami oznaczonymi jak w nagraniu powyżej.',
      'gol.f2.s2.t': 'Zbieranie sąsiedztwa',
      'gol.f2.s2.b':
        'Kamera zbliża się do chunka, który następny krok przeliczy, i do chunków wokół niego. <code>GatherJob</code> kopiuje do jednego płaskiego bufora tylko to, czego potrzebuje jądro: chunk i jego sąsiadów z lewej i prawej w całości, a z trzech chunków nad nim i trzech pod nim tylko graniczący wiersz. To 198 słów 64-bitowych zamiast 576 dla pełnego bloku 3×3: o dwie trzecie mniej zapisów do pamięci na chunk, czyli około 9 MB mniej na generację przy 3000 chunków.',
      'gol.f2.s3.t': '64 komórki naraz',
      'gol.f2.s3.b':
        'Jeden wiersz (żółta linia), w panelu bit po bicie, dla 16 z jego 64 kolumn. Trzy wywołania <code>AddBits</code> liczą sąsiadów wszystkich 64 komórek naraz, z przesuniętych kopii wierszy r − 1, r + 1 i r. Liczby sąsiadów zajmują trzy słowa, po jednym na każdy bit liczby (płaszczyzny bitowe), więc reguły Conwaya to dwie maski: „dokładnie 2” i „dokładnie 3”. W ostatnim wierszu panelu żółte się rodzą, a czerwone giną.',
      'gol.f2.s4.t': 'Cały chunk',
      'gol.f2.s4.b':
        'Ta sama arytmetyka przechodzi przez wszystkie 64 wiersze chunka. W grze działa równolegle dla wszystkich chunków-kandydatów, jako job Burst.',
      'gol.f2.s5.t': 'Delta',
      'gol.f2.s5.b':
        'Narodziny i śmierci wynikają z dwóch operacji na bitach w każdym wierszu, „nowy AND NOT stary” i „stary AND NOT nowy”, po 64 komórki naraz, bez pętli po komórkach: narodziny na żółto, śmierci na czerwono. Narzędzie nagrywające porównało prześledzony wiersz z wynikiem silnika i przy jakiejkolwiek różnicy nie wyeksportowałoby nagrania.',
      'gol.f1.aria':
        'Nagranie silnika: wzorzec liczony jest generacja po generacji, plansza dzieli się na chunki, a chunki przeliczane i zmienione w każdej generacji się podświetlają. Przewijanie je odtwarza; kroki obok opisują każdy etap.',
      'gol.f2.aria':
        'Nagranie jednego kroku jądra: gra się zatrzymuje, kamera zbliża się do jednego chunka, podświetla się sąsiedztwo, które czyta, a jeden wiersz jest pokazany bit po bicie, gdy liczeni są sąsiedzi i stosowane reguły. Przewijanie je odtwarza; kroki obok opisują każdy etap.',
      'gol.f2.code.aria':
        'Fragment kodu z BitmaskKernel.cs, metoda Compute: przesuwane okno trzech wierszy, przesunięte słowa sąsiadów, trzy kroki sumatora do trzech płaszczyzn bitowych i reguły jako dwie maski',

      // ---------- game-of-life.html: system 2 ----------
      'gol.sys2.title': 'Symulacja w wątku w tle, z dwoma sposobami przekazywania wyników',
      'gol.sys2.problem':
        'Symulacja nie może blokować renderowania ani obsługi dotyku. Przy niskiej prędkości każda generacja musi też osobno trafić do głównego wątku, bo napędza animacje narodzin i śmierci komórek oraz wibracje. Przy wysokiej prędkości to przekazywanie generacja po generacji stało się wąskim gardłem i szybszy silnik zaczął pogarszać płynność.',
      'gol.sys2.how':
        'Poniżej prędkości, przy której animacje i tak się wyłączają, zmiany każdej generacji (narodzone i obumarłe komórki) trafiają do bufora pierścieniowego, czyli kolejki o stałym rozmiarze, która ponownie używa swoich slotów. Dzięki temu wątek obliczeniowy może liczyć z wyprzedzeniem. Powyżej tej prędkości nie ma czego animować, więc wątek obliczeniowy sam kopiuje całe zmienione chunki do wyświetlanego stanu, a główny wątek tylko renderuje.',
      'gol.sys2.what':
        'Bezpieczną wielowątkowość wokół API Unity, które działa tylko na głównym wątku: model producent–konsument z jawną dyscypliną locków. Dwa locki, jeden chroniący stan planszy, a drugi liczniki, z których powstaje widok gęstości przy dużym oddaleniu (system 3), są zawsze brane w tej samej kolejności, co wyklucza zakleszczenie. Do tego wytropienie nieintuicyjnej regresji: przejście na kopiowanie całych chunków podniosło tempo losowego wzorca z 275 tys. komórek z 64 do 141 generacji na sekundę na Pixelu 6 Pro.',
      'gol.f3.s1.t': 'Wzorzec, który nie śpi',
      'gol.f3.s1.b':
        'Nagranie z edytora, jak powyżej. Oryginalna maszyna Turinga Paula Rendella, około 36 tys. komórek (nie uniwersalna z 252 tys. z filmu na górze strony): prawie każdy chunk zmienia się w każdej generacji, około 315 z 327. Pomijanie uśpionych chunków tu nie pomoże, więc liczy się druga część rozwiązania: praca poza głównym wątkiem.',
      'gol.f3.s2.t': 'Wolno: bufor pierścieniowy',
      'gol.f3.s2.b':
        'Przy 4 generacjach na sekundę kamera się zbliża. U dołu jest 128 slotów bufora pierścieniowego, jeden słupek na generację (jego wysokość to liczba zmienionych komórek). Wątek obliczeniowy wypełnia je z wyprzedzeniem (żółte), najwyżej 100 generacji do przodu; główny wątek pobiera po jednej (biały kursor) i odtwarza ją z animacjami narodzin i śmierci. Sloty, limit i zmiany każdej generacji pochodzą z gry; tempo, w jakim pasek zapełnia się na początku, ustawia nagranie, bo to ono samo wywołuje kolejne kroki silnika.',
      'gol.f3.s3.t': 'Przyspieszanie',
      'gol.f3.s3.b':
        'Tempo rośnie do 10 generacji na sekundę. To najwyższe tempo, przy którym gra jeszcze animuje; powyżej animacje i tak się wyłączają.',
      'gol.f3.s4.t': 'Szybko: całe chunki, bezpośrednio',
      'gol.f3.s4.b':
        'Powyżej 10 bufor zostaje opróżniony i odłożony, a każdy zmieniony chunk przechodzi w całości: 64 wiersze, 512 bajtów, kopiowane przez wątek obliczeniowy do wyświetlanego stanu (żółte wypełnienie), a główny wątek tylko renderuje. Przy 60 generacjach na sekundę nagranie (30 kl./s) dostaje dwie generacje na klatkę, czyli około 630 kopii chunków (315 KB). Gdyby przekazywać listy komórek, ta sama zmiana oznaczałaby około 54 tys. komórek do wyciągnięcia z bitów i odtworzenia w głównym wątku.',
      'gol.f3.aria':
        'Nagranie dwóch ścieżek przekazywania wyników: ruchliwy wzorzec przy 4 generacjach na sekundę z buforem pierścieniowym narysowanym u dołu, potem przyspieszenie powyżej 10, gdzie całe zmienione chunki są kopiowane bezpośrednio. Przewijanie je odtwarza; kroki obok opisują każdy etap.',
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
        'Który wątek co robi na każdej ścieżce.',

      // ---------- game-of-life.html: system 3 ----------
      'gol.sys3.title': 'Koszt renderowania zależny od ekranu, a nie od wzorca',
      'gol.sys3.problem':
        'Po oddaleniu na ekranie mogą być setki tysięcy komórek, a w Unity każdy kafelek Tilemapy kosztuje osobno. Nawet ustalenie, które komórki są widoczne, wymagało kiedyś przejrzenia wszystkich żywych komórek. Gra zwalniała wraz ze wzrostem wzorca, także przez tę jego część, której nie było widać.',
      'gol.sys3.how':
        'Żywe komórki są przechowywane w strukturze chunków z maskami bitowymi, która odpowiada na pytanie „co jest w tym prostokącie kamery” w czasie proporcjonalnym do widocznego obszaru. Z bliska Tilemapa dostaje tylko zmiany z każdej generacji. Przy dużym oddaleniu zastępuje ją jeden quad z teksturą gęstości komórek (jeden bajt na teksel), rysowany własnym shaderem w jednym draw callu. Przełączanie ma histerezę, czyli osobne progi wejścia i wyjścia, żeby widok nie migotał między trybami.',
      'gol.sys3.what':
        'Optymalizację renderowania w Unity (draw calle, ograniczenia wbudowanego komponentu, przełączanie poziomu szczegółowości, czyli LOD) i dobór struktur danych do zapytań, na które muszą odpowiadać. W benchmarku poza Unity zapytanie o widoczne komórki zajmuje stale ~50 µs, bez względu na to, ile komórek jest poza ekranem. Stare pełne skanowanie dochodziło do 1035 µs przy 316 tys. żywych komórek.',
      'gol.sys3.caption':
        'Jeden ciągły zoom szczypnięciem na Pixelu 6 Pro przy zatrzymanej symulacji, więc mierzone jest samo renderowanie. W trakcie oddalania, od 13 komórek aż po Universal Turing Machine z 252 tys. komórek, Tilemapę zastępuje widok gęstości na jednym quadzie, a licznik FPS gry nie spada poniżej 56 (limit to 60).',

      // ---------- game-of-life.html: system 4 ----------
      'gol.sys4.title': 'Kod silnika weryfikowany poza Unity',
      'gol.sys4.problem':
        'Błąd w stanowym silniku operującym na bitach nie powoduje awarii. Daje wiarygodnie wyglądający, ale błędny wzorzec, często dopiero wiele generacji później, więc patrząc na ekran, nie da się go wyłapać.',
      'gol.sys4.how':
        'Konsolowy harness .NET kompiluje te same pliki źródłowe solvera, które trafiają do wersji w sklepie, a mały shim zastępuje kolekcje, Jobs i Burst z Unity. Każda generacja każdego scenariusza (glidery przekraczające granice chunków i wchodzące w ujemne współrzędne, pusta plansza) jest porównywana komórka po komórce z naiwną implementacją referencyjną. Cały przebieg daje też jeden hash wzorcowy, który każdy refaktor niezmieniający działania musi odtworzyć bajt w bajt. Kompilacja wszystkich pięciu jobów kompilatorem Burst pod ARM64, uruchamiana bez edytora, zawiera kontrolę negatywną: kod, który musi się nie skompilować. Dzięki temu czysty wynik naprawdę coś dowodzi.',
      'gol.sys4.what':
        'Dyscyplinę testowania logiki silnika wykraczającą poza to, co oferuje edytor: testy różnicowe, które wskazują generację, w której błąd pojawia się po raz pierwszy, hash wzorcowy, dzięki któremu „ten refaktor niczego nie zmienił” staje się faktem, oraz sprawdzenie Burst, o którym kontrola negatywna dowodzi, że naprawdę potrafi wykryć błąd. Wszystko działa z linii poleceń.',
      'gol.diag4.aria':
        'Te same pliki solvera, które trafiają do sklepu, zasilają build Android do sklepu i harness testowy .NET, który porównuje każdą generację z naiwną implementacją referencyjną i sprowadza każdy przebieg do jednego hasha wzorcowego. Kompilacja Burst uruchamiana bez edytora buduje te same pięć jobów pod ARM64, z kontrolą negatywną, która musi się nie skompilować.',
      'gol.diag4.source': 'To samo źródło solvera',
      'gol.diag4.sourceSub': 'pliki wydanego solvera',
      'gol.diag4.android': 'Build Android do sklepu',
      'gol.diag4.androidSub': 'gra w sklepie',
      'gol.diag4.harness': 'Harness testowy .NET',
      'gol.diag4.harnessSub': 'kompiluje wydany solver',
      'gol.diag4.naive': 'Porównanie z referencją',
      'gol.diag4.cellByCell': 'komórka po komórce',
      'gol.diag4.hash': 'Hash wzorcowy',
      'gol.diag4.hashSub': 'bajt w bajt',
      // gol.diag4.probe is no longer on game-of-life.html (replaced by gol.diag4.headless);
      // kept for later use.
      'gol.diag4.probe': 'BurstProbe: kompilacja ARM64',
      'gol.diag4.headless': 'Kompilacja Burst bez edytora (ARM64)',
      'gol.diag4.negative': 'Kontrola negatywna',
      'gol.diag4.cap':
        'Obie gałęzie kompilują te same pliki, więc testy nigdy nie są nieaktualną kopią silnika.',

      // ---------- game-of-life.html: takeaway ----------
      'gol.takeaway':
        'Mierzyć trzeba na urządzeniu docelowym, a nie w edytorze: w tym projekcie edytor wskazał niewłaściwe wąskie gardło.',
      'gol.also.label': 'Również w kodzie (poza wersją sklepową)',
      'gol.also.body':
        'HashLife (algorytm Gospera) to drugi silnik, który zapamiętuje i ponownie wykorzystuje wyniki w drzewie czwórkowym, dzięki czemu powtarzalne wzorce przeskakują tysiące generacji w jednym kroku. Ma budżet pamięci skalowany do RAM-u urządzenia i testy względem implementacji brute-force.',

      // ---------- grave.html: intro ----------
      'grave.tagline':
        'Systemy, które zbudowałem do gry 2D z widokiem z góry w Unity 6: proceduralne lochy, widoczność, pathfinding i AI przeciwników.',
      'grave.intro':
        'Grave to survival horror 2D z widokiem z góry, w którym gracz widzi tylko to, co obejmuje jego pole widzenia i co oświetlają źródła światła. Powstał w 4-osobowym zespole jako projekt inżynierski.',
      'grave.meta.ogImageAlt':
        'Pomieszczenie lochu w Grave widziane z góry: filary rzucają ostre cienie w stożku widzenia gracza, a na granicy światła stoi przeciwnik.',
      'grave.hero.caption':
        'Oświetlone pomieszczenie lochu widziane z góry: filary rzucają ostre cienie w stożku widzenia gracza, a wszystko poza światłem ginie w ciemności.',

      // ---------- grave.html: key numbers ----------
      'grave.kn1.label': 'Automatyczne testy jednostkowe (Unity EditMode)',
      'grave.kn1.ctx':
        'Wszystkie dotyczą generatora lochów, który działa bez sceny; wiele z nich sprawdza dziesiątki lub setki seedów.',
      'grave.kn2.value': '4000',
      'grave.kn2.label': 'Dozwolona liczba kroków wyszukiwania na jedną trasę przeciwnika (A*)',
      'grave.kn2.ctx':
        'Limit projektowy, a nie wynik benchmarku: po jego przekroczeniu wyszukiwanie zwraca najlepszą częściową ścieżkę, zamiast wydłużać klatkę.',
      'grave.kn3.label': 'Czas klatki po profilowaniu',
      'grave.kn3.ctx':
        'Pomiar w edytorze, po jednej serii optymalizacji: rzadsze próbkowanie promieni poza stożkiem widzenia, ponowne użycie buforów A* i kilka innych poprawek.',

      // ---------- grave.html: at a glance ----------
      'grave.glance.team.t': 'Zespół',
      'grave.glance.team.d': '4 osoby (praca inżynierska)',
      'grave.glance.covered.t': 'Opisuję tu',
      'grave.glance.covered.d':
        'proceduralne generowanie lochów, system widoczności, pathfinding A* i AI przeciwników: cztery najważniejsze z systemów, które zbudowałem w tej grze',
      'grave.glance.time.t': 'Okres',
      'grave.glance.time.d': 'ukończony 08.2026',
      'grave.glance.engine.t': 'Silnik',
      'grave.glance.platform.t': 'Platforma',
      'grave.glance.status.t': 'Status',
      'grave.glance.status.d': 'projekt inżynierski, Collegium Da Vinci, 2026',
      'grave.glance.tech.t': 'Kluczowe technologie (w tych systemach)',
      'grave.glance.tech.d':
        'C#, Physics2D, własne shadery URP (HLSL), RenderTexture, assembly definitions, Unity Test Framework (48 testów EditMode)',
      'grave.glance.code.t': 'Kod',
      'grave.glance.code.link': 'repozytorium zespołu na GitHubie',
      'grave.glance.code.d': '; przy każdym systemie poniżej jest link do jego folderu',

      // ---------- grave.html: systems on this page ----------
      'grave.toc1.skills': 'A* · kopiec binarny · limit kosztu wyszukiwania',
      'grave.toc2.skills': 'RenderTexture · własne shadery URP · raycasting',
      'grave.toc3.skills': 'Algorytmy grafowe · determinizm · testy jednostkowe',
      'grave.toc4.skills': 'Kompozycja · interfejsy · budżet aktualizacji AI',

      // ---------- grave.html: system 1 ----------
      'grave.sys1.title': 'A* z limitem kosztu jednego wyszukiwania',
      'grave.sys1.problem':
        'Przeciwnicy gonią gracza po wygenerowanym lochu, czyli po siatce 40 000 komórek (200×200), a żadne pojedyncze wyszukiwanie ścieżki nie może powodować przycięć. Najgorszy przypadek to cel nieosiągalny: zwykły A* przeszukuje wtedy całą mapę, zanim uzna, że ścieżki nie ma.',
      'grave.sys1.how':
        'Collidery poziomu są próbkowane do płaskiej siatki przechodniości. Gdy przeszkoda zostaje zniszczona, ponownie próbkowany jest tylko jej obszar, ale etykiety regionów są celowo przebudowywane w całości, bo otwarcie jednej komórki może połączyć dwa całe regiony. Flood fill dzieli siatkę na spójne regiony, więc nieosiągalny cel odpada w O(1), zanim wyszukiwanie w ogóle ruszy. Wyszukiwanie korzysta z kopca binarnego, czyli kolejki priorytetowej, która zwraca najtańszy węzeł w O(log n). Bufory są używane ponownie między wyszukiwaniami, a zamiast je czyścić, unieważnia się je numerem wersji nadawanym każdemu wyszukiwaniu. Liczba odwiedzonych węzłów ma limit, a po jego przekroczeniu zwracana jest najlepsza częściowa ścieżka, więc gra się nie zawiesza.',
      'grave.sys1.what':
        'Przerobienie podręcznikowego algorytmu tak, żeby koszt jednego wyszukiwania miał górny limit nawet w najgorszym przypadku, a przygotowanie zależało od przeszukanego obszaru, a nie od rozmiaru mapy. Liczbę wyszukiwań na klatkę ogranicza co innego: każdy przeciwnik przelicza ścieżkę co pewien czas albo gdy cel się przesunie, nieudane wyszukiwanie odczekuje przed kolejną próbą, a budżet aktualizacji z systemu 4 usypia dalekich przeciwników.',
      'grave.sys1.code.aria':
        'Fragment kodu z AStarPathfinder.cs, metoda FindPath: odrzucenie celu po regionie, pętla wyszukiwania na kopcu, limit węzłów i awaryjny zwrot częściowej ścieżki',

      // ---------- grave.html: system 2 ----------
      'grave.sys2.title': 'System widoczności: maska światła renderowana przez drugą kamerę i własne shadery',
      'grave.sys2.problem':
        'Wszystko poza linią wzroku gracza, łącznie z przeciwnikami, musi być ukryte, a światło z kilku źródeł (stożek widzenia gracza, lampy) ma się płynnie łączyć. Wcześniejsza wersja opierała się na stencil bufferze, który przechowuje dla każdego piksela prostą flagę widoczne/niewidoczne. Sprite’y urywały się ostro na granicy światła, a nakładające się światła nie mieszały się ze sobą.',
      'grave.sys2.how':
        'Stożek widzenia gracza i każda lampa korzystają z jednego wspólnego buildera meshy. Tam, gdzie sąsiednie promienie się nie zgadzają (jeden trafia, drugi nie, albo ich odległości skaczą), wyszukiwanie binarne między nimi znajduje dokładną krawędź, więc kontury pozostają ostre bez dokładania promieni. Druga kamera renderuje te meshe do RenderTexture z blendingiem typu max, więc nakładające się światła dają jaśniejszą z dwóch wartości, zamiast się sumować. Maska trzyma poziom światła w kanale alfa, a jego kolor w RGB, więc jedna tekstura jednocześnie przyciemnia i barwi scenę, a shadery sprite’ów ukrywają wszystko, do czego nie dociera żadne światło.',
      'grave.sys2.what':
        'Pracę z renderowaniem w Unity poza gotowymi komponentami: dodatkowa kamera, warstwy renderowania, RenderTexture, tryby blendingu i własne shadery URP, a także wymianę architektury, gdy poprzednia wyczerpała swoje możliwości. Do tego profilowanie: stożek rzucał kiedyś pełne koło promieni w pełnej gęstości tylko po to, żeby narysować mały krąg wokół gracza, a rzadsze próbkowanie tego kręgu było częścią serii poprawek, która skróciła klatkę z ~30 ms do ~12 ms (pomiar w edytorze).',
      'grave.sys2.code.file': 'VisionMaskWriter.shader · SpriteFovMasked.shader',
      'grave.sys2.code.aria':
        'Fragmenty shaderów: blending typu max w shaderze zapisującym maskę i shader sprite’ów, który wygasza je według maski widoczności',
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
      'grave.rail.1': 'Generator lochów',
      'grave.rail.2': 'Widoczność',
      'grave.rail.3': 'Pathfinding A*',
      'grave.rail.4': 'AI przeciwników',
      'grave.sys3.title': 'Generator lochów: z seeda, walidowany, przetestowany',
      'grave.sys3.problem':
        'Każda rozgrywka potrzebuje nowego lochu, który zawsze jest w pełni spójny, bez nieosiągalnych pokoi i bez drzwi prowadzących w skałę. Musi też być powtarzalny: ten sam seed ma dać identyczny loch na każdym komputerze, żeby poziom dało się odtworzyć, debugować i testować na podstawie samego seeda.',
      'grave.sys3.how':
        'Generator to pipeline w czystym C#, w osobnym assembly, bez zależności od scen i MonoBehaviour. Rozmieszcza pokoje i łączy je minimalnym drzewem rozpinającym zbudowanym algorytmem Kruskala z Union-Find, co daje najtańszy zestaw korytarzy łączący wszystkie pokoje. Kilka dodatkowych krawędzi tworzy pętle. Potem pipeline wycina pokoje i korytarze, w tym ślepe wnęki w korytarzach, waliduje wynik, a gdy walidacja się nie powiedzie, ponawia próbę z seedem wyprowadzonym z pierwotnego. Deterministyczny generator liczb losowych daje każdemu etapowi osobny, niezależny strumień, więc zmiana jednego etapu nie przetasowuje pozostałych. Analiza grafu znajduje punkty artykulacji (przewężenia), czyli komórki, których zablokowanie rozcięłoby loch na dwie części, więc nie stawia się na nich niczego, co blokuje przejście.',
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
        '<code>EnemyBase</code> wyszukuje swoje komponenty po interfejsach i nie wie, jakie klasy za nimi stoją. Odpytuje wszystkie podpięte detektory, a każdy z nich może potwierdzić obecność gracza. Słuch to osobny kanał zasilany przez szynę zdarzeń hałasu: usłyszany hałas każe przeciwnikowi sprawdzić miejsce, ale nie oznacza wykrycia, bo to tylko podejrzenie. AI każdego przeciwnika działa z jedną z trzech częstotliwości, zależnie od odległości od gracza: co klatkę w pierścieniu liczonym od zasięgu zmysłów danego przeciwnika, dalej co interwał z losowym rozrzutem, a za linią uśpienia wcale; tam przeciwnik zwalnia też zapamiętaną ścieżkę. Rozrzut sprawia, że grupy nie aktualizują się w tej samej klatce.',
      'grave.sys4.what':
        'Kompozycję zamiast dziedziczenia w praktyce. „Ślepy” typ przeciwnika, <code>BlindListenerEnemy</code>, to podklasa, której jedyną realną treścią jest <code>[RequireComponent(typeof(SoundPlayerDetector))]</code>: ślepota oznacza po prostu, że jego prefab nie ma <code>VisionPlayerDetector</code>. Ten typ doszedł bez żadnych zmian w <code>EnemyBase</code>. Do tego budżetowanie kosztu AI na dużym poziomie bez pogorszenia reakcji przeciwników w pobliżu gracza.',
      'grave.diag4.senses': 'ZMYSŁY',
      'grave.diag4.stateMachine': 'maszyna stanów',
      'grave.diag4.sight': 'Wykrycie: wzrok',
      'grave.diag4.hearing': 'Słuch: tylko podejrzenie',
      'grave.diag4.movement':
        '<tspan x="350" dy="0">Ruch (A* lub bezpośredni):</tspan><tspan x="350" dy="17">to nie zmysł</tspan>',
      'grave.diag4.blindLabel': 'Typ ślepy: bez wzroku',
      'grave.diag4.noSight': 'Brak komponentu wzroku',
      'grave.diag4.blind':
        'Typ ślepy: ten sam hub bez szprychy wzroku.',
      'grave.diag4hub.aria':
        "EnemyBase stoi w środku huba. Przez interfejsy odpytuje dwa komponenty zmysłów, z których każdy łączy się z konkretnym punktem na krawędzi huba: IPlayerDetector, implementowany przez VisionPlayerDetector, odpowiada za wzrok, a INoiseSensor, implementowany przez SoundPlayerDetector i zasilany z NoiseEvents, za słuch, który wzbudza tylko podejrzenie, a nie wykrycie. Osobna, przerywana szprycha prowadzi w dół do IMovementStrategy, implementowanego przez PathfindingMovement albo SimpleDirectMovement — ruch nie jest zmysłem. Panel z boku, połączony z hubem własną linią, pokazuje ten sam hub bez szprychy wzroku: ślepy typ przeciwnika.",
      'grave.diag4ringsWide.aria':
        'Koncentryczne pierścienie wokół gracza, z legendą obok. Najbardziej wewnętrzny krąg jest aktualizowany co klatkę, a jego promień to zasięg zmysłów plus margines. Środkowy pas aktualizuje się co interwał, z losowym rozrzutem. Zewnętrzny pas jest uśpiony i zwalnia zapamiętaną ścieżkę. Dwa bliskie okręgi na granicy uśpienia oznaczają histerezę — linia wybudzenia leży tuż wewnątrz linii uśpienia — a dolny próg bezpieczeństwa gwarantuje, że przeciwnik, który mógłby jeszcze wyczuć gracza, nigdy nie zostanie uśpiony.',
      'grave.diag4ringsTall.aria':
        'Koncentryczne pierścienie wokół gracza, z legendą pod spodem. Najbardziej wewnętrzny krąg jest aktualizowany co klatkę, a jego promień to zasięg zmysłów plus margines. Środkowy pas aktualizuje się co interwał, z losowym rozrzutem. Zewnętrzny pas jest uśpiony i zwalnia zapamiętaną ścieżkę. Dwa bliskie okręgi na granicy uśpienia oznaczają histerezę — linia wybudzenia leży tuż wewnątrz linii uśpienia — a dolny próg bezpieczeństwa gwarantuje, że przeciwnik, który mógłby jeszcze wyczuć gracza, nigdy nie zostanie uśpiony.',
      'grave.diag4.part1': 'Zmysły jako komponenty za interfejsami: hub, nie pipeline',
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

      // ---------- grave.html: footage (one recorded chapter per system, in page order;
      // grave.f<system>.s<stage>.t/.b are the steps beside the pinned game view) ----------
      'grave.footage.label': 'Na nagraniu',
      // system 1: generator
      'grave.f1.s1.t': 'Działki pokoi',
      'grave.f1.s1.b':
        'Plansza 200×200 komórek. Najpierw działka huba (niebieska), potem kolejne pokoje; fioletowe to skarbce. Cały loch wynika z seeda i ustawień.',
      'grave.f1.s2.t': 'Drzewo rozpinające',
      'grave.f1.s2.b':
        'Algorytm Kruskala łączy pokoje najkrótszymi krawędziami (odległość Manhattan), aż każdy pokój jest osiągalny.',
      'grave.f1.s3.t': 'Pętle i skarbce',
      'grave.f1.s3.b':
        'Część odrzuconych krawędzi wraca jako dodatkowe przejścia, więc loch ma obejścia zamiast samych ślepych zaułków. Każdy skarbiec dostaje jedno połączenie.',
      'grave.f1.s4.t': 'Pokoje, korytarze, drzwi',
      'grave.f1.s4.b':
        'Pokoje wycinane są w kolejności ułożenia, z nieregularnymi obrysami. Korytarze kopane są wzdłuż połączeń, a przejścia do pokoi stają się drzwiami (bursztynowe). Graf połączeń gaśnie, bo zrobił swoje.',
      'grave.f1.s5.t': 'Role i wnętrza',
      'grave.f1.s5.b':
        'Role przydzielane są po przejściu grafu pokoi: hub, skarbce, wyjście (zielone) i pokój z kluczem do wyjścia. Dopiero potem filary, przegrody i gruz, bo etap wnętrz czyta role.',
      'grave.f1.s6.t': 'Przewężenia',
      'grave.f1.s6.b': 'Wąskie gardła lochu (czerwone), zaznaczane dla dalszych systemów.',
      'grave.f1.s7.t': 'Ten sam loch w grze',
      'grave.f1.s7.b':
        'Schemat przechodzi w grafikę gry, a kamera zjeżdża do gracza w hubie. Nagrania pozostałych trzech systemów powstały w innej sali tego samego lochu, wśród filarów z kroku „Role i wnętrza”.',
      'grave.f1.aria':
        'Nagranie generatora lochów: pusta plansza wypełnia się etap po etapie, a potem zamienia w samą grę. Przewijanie je odtwarza; kroki obok opisują każdy etap.',
      // system 2: widoczność
      'grave.f2.s1.t': 'Sala z kolumnadą',
      'grave.f2.s1.b': 'Przeciwnik patroluje przejście między dwoma rzędami filarów. Zapamiętaj, gdzie jest.',
      'grave.f2.s2.t': 'Światło gaśnie',
      'grave.f2.s2.b': 'Zostaje tylko to, co widzi gracz. Przeciwnik i szczury znikają, choć nadal tam są.',
      'grave.f2.s3.t': 'Wejście',
      'grave.f2.s3.b': 'Gracz wchodzi na kolumnadę. Za każdym filarem zostaje klin cienia.',
      'grave.f2.s4.t': 'Promienie',
      'grave.f2.s4.b':
        'Stop-klatka. 166 promieni: w stożku co 1°, wokół gracza co 4°, bo tam gęstość nie jest potrzebna. Kolor końca promienia mówi, co go zatrzymało: bursztynowy to filar, niebieski inna przeszkoda, jasny oznacza pełny zasięg.',
      'grave.f2.s5.t': 'Krawędzie',
      'grave.f2.s5.b':
        'Krawędź filara w powiększeniu: kąt w poprzek, odległość w górę. Sąsiednie promienie się nie zgadzają (jeden trafia w przeszkodę, a drugi nie, albo ich odległości różnią się o ponad 0,5), więc gra 4 razy dzieli kąt na pół: z 1° do 1/16°. Białe punkty to wyniki wszystkich 11 wyszukiwań.',
      'grave.f2.s6.t': 'Bez bisekcji',
      'grave.f2.s6.b':
        'Test: ten sam widok zbudowany kodem gry, ale z promieniem co 4° i bez bisekcji. Niebieskie to cień tam, gdzie gra widzi światło, czerwone odwrotnie. Jasna linia to prawdziwa krawędź.',
      'grave.f2.s7.t': 'Z bisekcją',
      'grave.f2.s7.b':
        'Te same 93 promienie i 4 kroki bisekcji na każdej z 11 krawędzi: błąd prawie znika kosztem 44 dodatkowych rzutów. Taką dokładność bez bisekcji dałoby dopiero 400 promieni w samym stożku.',
      'grave.f2.s8.t': 'Maska',
      'grave.f2.s8.b':
        'Końce promieni tworzą wachlarz trójkątów, budowany w LateUpdate, gdy wszystko już się ruszyło. Druga kamera rysuje go do tekstury: alfa to siła światła, RGB jego barwa. Koniec zasięgu wygasa płynnie.',
      'grave.f2.s9.t': 'Bez maski na sprite’ach',
      'grave.f2.s9.b':
        'Maskę czytają dwie rzeczy: nakładka ciemności i shadery sprite’ów. Bez maski na sprite’ach sama ciemność przyciemnia je tylko do 1/3: przeciwnik za filarem prześwituje, a z nim skrzynia, beczki i szkło.',
      'grave.f2.s10.t': 'Bez ciemności',
      'grave.f2.s10.b':
        'Odwrotnie: bez ciemności podłoga jest jasna, a z przeciwnika widać tylko skrawek w świetle, w obrysie wachlarza. Sprite sam czyta maskę, piksel po pikselu.',
      'grave.f2.s11.t': 'Za filarami',
      'grave.f2.s11.b':
        'Gra rusza. Przeciwnik jest cięty dokładnie po krawędzi maski: widać go tylko w szczelinach.',
      'grave.f2.s12.t': 'Na żywo',
      'grave.f2.s12.b':
        'To samo w każdej klatce, po ruchu gracza. Pod graczem: promienie · krawędzie · rzuty w tej klatce i czas budowy meshu (mediana z 9 klatek, mierzona w edytorze). Białe punkty skaczą, bo krawędzie szukane są od nowa.',
      'grave.f2.s13.t': 'Przeciwnik',
      'grave.f2.s13.b':
        'Szkło chrzęści pod butem. Tu przeciwnik ma wyłączone zmysły; w następnym nagraniu usłyszy krok i pobiegnie tam, skąd dobiegł, trasą wyznaczoną przez A*.',
      'grave.f2.aria':
        'Nagranie systemu widoczności: sala z filarami, jej promienie, krawędzie i maska światła narysowane na zatrzymanej grze, a potem gra toczy się dalej. Przewijanie je odtwarza; kroki obok opisują każdy etap.',
      // system 3: A*
      'grave.f3.s1.t': 'Krok na szkle',
      'grave.f3.s1.b':
        'Gracz przestępuje z nogi na nogę na szkle. Stop-klatka: hałas trafia szyną zdarzeń do każdego słuchacza. Ślepy przeciwnik go słyszy, bo jest w zasięgu, a beczki, inaczej niż filary, dźwięku nie blokują.',
      'grave.f3.s2.t': 'Siatka',
      'grave.f3.s2.b':
        'Przeciwnik nie widzi sali, tylko siatkę: dla środka każdej komórki jedno zapytanie o przeszkody, z pominięciem wyzwalaczy. Szkło drogi nie zamyka, beczki tak, choć dźwięk przez nie przechodzi.',
      'grave.f3.s3.t': 'A*',
      'grave.f3.s3.b':
        'A* bierze z kolejki (obrysy z liczbą f) komórkę o najmniejszym f = g + h: koszt dojścia plus odległość oktylna do celu. Rozwija każdą tańszą niż trasa, więc przy objeździe także te za przeciwnikiem. Pod graczem: liczba rozwiniętych komórek i budżet.',
      'grave.f3.s4.t': 'Trasa',
      'grave.f3.s4.b':
        'Cel zdjęty z kolejki kończy szukanie. Trasę czyta się wstecz po strzałkach poprzedników, od celu do przeciwnika. Po wyczerpaniu budżetu przeciwnik dostałby trasę do komórki najbliższej celu, zamiast stanąć.',
      'grave.f3.s5.t': 'Bez ścinania rogów',
      'grave.f3.s5.b':
        'Krok po skosie jest dozwolony tylko wtedy, gdy obie sąsiednie komórki są wolne. Przy beczce jedna nie jest, więc trasa robi dwa kroki proste i przeciwnik nie przenika przez narożnik.',
      'grave.f3.s6.t': 'Za dźwiękiem',
      'grave.f3.s6.b':
        'Gra toczy się dalej. Gracz zakrada się poza szkło. Przeciwnik obiega beczki trasą (bursztynową), przeliczaną kilka razy na sekundę.',
      'grave.f3.s7.t': 'Tam, skąd dobiegł dźwięk',
      'grave.f3.s7.b':
        'Słuch daje miejsce dźwięku, nie gracza. Przeciwnik dobiega do szkła, rozgląda się i wraca na patrol, a gracz jest już poza przerywanym okręgiem, w którym przeciwnik wyczułby go nawet w ciszy.',
      'grave.f3.aria':
        'Nagranie pathfindingu A*: ślepy przeciwnik słyszy krok, zatrzymana gra pokazuje jego wyszukiwanie i trasę, a potem przeciwnik ją przebiega. Przewijanie je odtwarza; kroki obok opisują każdy etap.',
      // system 4: AI
      'grave.f4.s1.t': 'Krok, który słychać',
      'grave.f4.s1.b':
        'Gracz idzie zwykłym krokiem, nie skrada się. Przeciwnik wracający na patrol słyszy go i zawraca („?”), a trasę do miejsca dźwięku znowu wyznacza A*. Zwróć uwagę na przerywany okrąg wokół przeciwnika.',
      'grave.f4.s2.t': 'Wykryty',
      'grave.f4.s2.b':
        'Gdy gracz jest w okręgu, dźwięk nie jest już potrzebny: przeciwnik go wykrywa i rusza w pościg („!”). Gracz rzuca się do ucieczki biegiem.',
      'grave.f4.s3.t': 'Jeden z wielu',
      'grave.f4.s3.b':
        'Stop-klatka, a kamera odjeżdża: gra rozpływa się w plan lochu z nagrania generatora. Przeciwnik, który właśnie ruszył w pościg, jest na nim jednym z wielu.',
      'grave.f4.s4.t': 'Kto naprawdę się aktualizuje',
      'grave.f4.s4.b':
        'Każdy przeciwnik ma znacznik zależny od tego, co gra z nim robi. Pełny znacznik: AI aktualizuje się co klatkę. Obrys z bladym środkiem: co interwał, 0,35 s z rozrzutem. Pusty: wcale, bo uśpiony. Liczby: ilu przeciwników jest w każdej grupie.',
      'grave.f4.s5.t': 'Pierścienie liczone od gracza',
      'grave.f4.s5.b':
        'Pierścień pełnego tempa wynika z komponentów: ślepy nie ma wzroku, więc jego pierścień jest mniejszy niż widzącego. Za linią uśpienia AI nie działa; linia wybudzenia leży tuż wewnątrz niej (histereza).',
      'grave.f4.s6.t': 'Ile to kosztuje',
      'grave.f4.s6.b':
        'Licznik: ile aktualizacji AI było w ostatniej sekundzie, a obok ile byłoby, gdyby każdy przeciwnik aktualizował się co klatkę. Niżej wyszukiwania A*: każde płaci za odwiedzone komórki (stempel zamiast czyszczenia siatki), nie za całą mapę.',
      'grave.f4.s7.t': 'Ucieczka na mapie',
      'grave.f4.s7.b':
        'Gra toczy się dalej. Gracz ucieka poza zasięg wykrycia, ale przeciwnik wciąż słyszy bieg (cienki okrąg: jak daleko niosą się kroki), więc zostaje w pierścieniu pełnej częstotliwości.',
      'grave.f4.s8.t': 'Co to daje w grze',
      'grave.f4.s8.b':
        'Gdy gracz zwalnia do marszu, jego kroki przestają docierać do przeciwnika. Poza pierścieniem i poza zasięgiem słuchu przechodzi na aktualizacje co interwał. Blisko gracza nikt nie jest przez to głupszy, a cały loch kosztuje ułamek tego, co bez budżetu.',
      'grave.f4.aria':
        'Nagranie AI przeciwników: przeciwnik słyszy i goni gracza, potem kamera wznosi się nad cały loch i oznacza, jak często aktualizowany jest każdy przeciwnik. Przewijanie je odtwarza; kroki obok opisują każdy etap.',

      // ---------- grave.html: takeaway ----------
      'grave.takeaway':
        'Łączy je jedna zasada: luźne powiązanie przez dane. Generator nic nie wie o pathfindingu, widoczności ani AI. Tworzy układ, z którego powstają collidery czytane zarówno przez siatkę A*, jak i przez promienie światła. Tworzy też listę przewężeń i wnęk w korytarzach. Korzysta z niej rozmieszczanie przeciwników, osobny krok, który napisałem i który uruchamia się po zbudowaniu lochu: zasadzki trafiają do wnęk, a strażnicy stają obok przewężeń, nigdy na nich. AI z kolei sięga do pathfindingu wyłącznie przez wąskie interfejsy, więc systemy współpracują, choć żaden nie zależy od kodu pozostałych.',

      // ---------- luggage-please.html: intro ----------
      'lp.tagline':
        'Systemy, które zbudowałem na stażu w Rubens Games: fizyka walizki, skaner rentgenowski złożony z renderer features URP i kontekstowe koło interakcji.',
      'lp.intro':
        'Luggage Please to gra z widokiem z pierwszej osoby o kontroli bezpieczeństwa na lotnisku, tworzona przez zespół studia Rubens Games, w którym byłem na stażu; grafika jest autorstwa studia.',
      'lp.hero.alt':
        'Zbudowany przeze mnie skaner rentgenowski: przedmioty w walizce pokolorowane według kategorii materiału.',
      'lp.hero.credit': 'Zbudowany przeze mnie skaner rentgenowski koloruje przedmioty według materiału na żywo.',
      'lp.meta.ogImageAlt':
        'Grafika tytułowa Luggage Please na czarnym tle: rysunkowa otwarta walizka ze złożonymi ubraniami i gumową kaczką, a wokół niej złota rybka, pistolet, nóż i otwarta książka; pod spodem tytuł gry.',

      // ---------- luggage-please.html: at a glance ----------
      'lp.glance.team.t': 'Zespół',
      'lp.glance.team.d': 'zespół studia Rubens Games (staż); grafika od artystów studia',
      'lp.glance.time.t': 'Okres',
      'lp.glance.time.d': '07.2024 – 09.2024 (staż)',
      'lp.glance.engine.t': 'Silnik',
      'lp.glance.platform.t': 'Platforma',
      'lp.glance.status.d': 'projekt ze stażu (lipiec–wrzesień 2024), niewydany',
      'lp.glance.tech.t': 'Kluczowe technologie (w tych systemach)',
      'lp.glance.tech.d':
        'C#, fizyka Rigidbody, zapytania fizyczne (OverlapBox), URP Renderer Features (RenderObjects), Shader Graph, culling mask, RenderTexture, uGUI',
      'lp.glance.code.t': 'Kod',
      'lp.glance.code.d':
        'projekt studia, niepubliczny; cały pokazany tu kod napisałem sam w czasie stażu, a pokazuję go za zgodą Rubens Games',

      // ---------- luggage-please.html: systems on this page ----------
      'lp.toc1.skills': 'Siły Rigidbody · zapytania fizyczne · przełączanie w tryb kinematyczny',
      'lp.toc2.skills': 'URP RenderObjects · culling mask · RenderTexture',
      'lp.toc3.skills': 'uGUI · UI oddzielone od logiki gry · korutyny',

      // ---------- luggage-please.html: system 1 ----------
      'lp.rail.1': 'Fizyka walizki',
      'lp.rail.2': 'Skaner rentgenowski',
      'lp.rail.3': 'Koło akcji',
      'lp.sys1.title': 'Fizyka walizki działająca tylko w trakcie kontroli',
      'lp.sys1.problem':
        'Spakowana walizka musi zachowywać się jak jeden solidny obiekt, gdy gracz ją niesie, rzuca albo wysyła przez skaner. Na stanowisku kontroli ta sama walizka ma się otworzyć i zamienić w luźne przedmioty, które gracz może podnieść, obrócić i spakować z powrotem, a wieko nie może się zamknąć przez wystający przedmiot.',
      'lp.sys1.how':
        'Przedmioty są symulowane tylko wtedy, gdy walizka leży otwarta na stanowisku kontroli. Gdy kontrola się kończy, <code>OverlapBox</code> obejmujący walizkę ustala, które przedmioty są w środku; stają się one kinematycznymi dziećmi walizki, więc zamkniętą walizkę można nieść, rzucić i prześwietlić jak jedno ciało, a to, co leży na zewnątrz, zostaje na miejscu. Chwycony przedmiot jest przesuwany do kursora siłami, a nie teleportowany, więc nadal odpycha sąsiednie przedmioty. Wieko jest animowane, a nie symulowane, więc zamiast czekać na zdarzenia kolizji, podczas zamykania co klatkę uruchamia wokół siebie <code>OverlapBox</code> i otwiera się z powrotem, jeśli na drodze jest przedmiot.',
      'lp.sys1.what':
        'Decydowanie, kiedy nie symulować: fizyka działa tylko wtedy, gdy przedmiotów można dotknąć, z dwoma wyraźnymi punktami przełączenia, a zapytania fizyczne służą za logikę gry tam, gdzie zdarzenia kolizji nie pomogą.',
      'lp.sys1.caption':
        'Otwarta walizka w trakcie kontroli: każdy przedmiot w środku jest osobnym obiektem fizycznym, który można chwycić, obrócić i spakować z powrotem.',
      'lp.sys1.code.aria':
        'Fragment kodu z Assets/Scripts/Inspection/Luggage Animator.cs, metoda CheckCollisions: OverlapBox wokół collidera wieka, ograniczony maską do warstw przedmiotów, przy trafieniu otwiera wieko z powrotem',

      // ---------- luggage-please.html: system 2 ----------
      'lp.sys2.title': 'Skaner rentgenowski zbudowany z warstw i renderer features URP',
      'lp.sys2.problem':
        'Skaner pokazuje na żywo prześwietlony obraz walizki przejeżdżającej przez maszynę. Przedmioty mają kolory według kategorii materiału (metal, organiczne, inne), żeby gracz mógł wypatrzyć podejrzaną zawartość. Modele przedmiotów przygotowali artyści studia, a część z nich łączy kilka materiałów, więc kolorowanie nie może opierać się na kodzie pisanym osobno dla każdego przedmiotu.',
      'lp.sys2.how':
        'Kolor jest przypisany do części modelu, a nie do całego przedmiotu: każda część leży na jednej z czterech warstw rentgena, więc model, który artyści zbudowali z kilku materiałów, po prostu ma części na różnych warstwach. Każda warstwa ma własny renderer feature URP typu RenderObjects (dodatkowy przebieg renderowania ustawiany w assecie renderera), który rysuje obiekty z tej warstwy materiałem nadpisującym. Wszystkie cztery materiały nadpisujące korzystają z jednego shadera fresnela, który zrobiłem w Shader Graph; każdy ma własny kolor. Efekt fresnela rozjaśnia powierzchnie ustawione bokiem do kamery, więc przedmioty wyglądają jak świecące kontury.',
      'lp.sys2.what':
        'Na tyle dobrą znajomość mechanizmów rozszerzania URP, żeby rozwiązać problem renderowania bez własnego kodu renderującego, oraz rozwiązanie, które skaluje się razem z zawartością gry: skaner obsługuje 27 prefabów przedmiotów, a nowy przedmiot, nawet z kilku materiałów, potrzebuje tylko właściwych warstw w prefabie.',
      'lp.sys2.caption':
        'Ekran konsoli skanera: przedmioty organiczne, np. owoce, świecą na żółto, metalowe na pomarańczowo, a cała reszta, łącznie ze skorupą walizki, na turkusowo.',
      // Horizontal pipeline: one key per line of text, in reading order (b2c "Culling mask:",
      // b3a "4 × RenderObjects" and b4a "RenderTexture" read the same in both languages).
      'lp.diag2.b1a': 'Części modeli przedmiotów',
      'lp.diag2.b1b': '4 warstwy:',
      'lp.diag2.b1c': 'inne · metal ·',
      'lp.diag2.b1d': 'organiczne · skorupa walizki',
      'lp.diag2.b2a': 'Kamera skanera',
      'lp.diag2.b2b': '(ortograficzna)',
      'lp.diag2.b2d': 'tylko warstwy rentgena',
      'lp.diag2.b2e': '→ Podąża za walizką',
      'lp.diag2.b3b': 'Materiał nadpisujący',
      'lp.diag2.b3c': 'na warstwę',
      'lp.diag2.b3d': 'Jeden shader fresnela,',
      'lp.diag2.b3e': '4 kolory',
      'lp.diag2.b5a': 'Materiał ekranu',
      'lp.diag2.b5b': 'konsoli',
      'lp.diag2.cap':
        'Pięć etapów od warstw przedmiotu do ekranu skanera; każdy z nich to konfiguracja, a nie kod pisany dla pojedynczego przedmiotu.',
      'lp.diag2.aria':
        'Pięcioetapowy pipeline, od lewej do prawej. Pierwszy: części modeli przedmiotów leżą na czterech warstwach rentgena — inne, metal, organiczne, skorupa walizki. Drugi: ortograficzna kamera skanera z culling mask ustawioną tylko na warstwy rentgena podąża za walizką. Trzeci: cztery renderer features typu RenderObjects rysują obiekty z osobnym materiałem nadpisującym dla każdej warstwy — jeden shader fresnela w czterech kolorach. Czwarty: wynik trafia do RenderTexture. Piąty: ta tekstura jest materiałem ekranu konsoli.',

      // ---------- luggage-please.html: system 3 ----------
      'lp.sys3.title': 'Koło interakcji, którego opcje zależą od stanowiska pasażera',
      'lp.sys3.problem':
        'Dostępne akcje zależą od tego, na którym etapie kontroli jest pasażer: to, co ma sens w kolejce, jest nie na miejscu przy bramce z wykrywaczem metalu. Wybór akcji ma być szybki i nie może wyrywać gracza z widoku gry do pełnoekranowego menu.',
      'lp.sys3.how':
        'Kod NPC buduje listę identyfikatorów opcji na podstawie bieżącego stanu pasażera (przy którym stanowisku jest, czy jego bagaż leży na wadze) i przekazuje ją kołu. Koło, zbudowane w czystym uGUI, włącza tylko te gotowe segmenty, które są na liście, i rozkłada je równo na okręgu, bez względu na ich liczbę. Wywołująca korutyna czeka, aż gracz wybierze opcję albo zamknie koło, i wtedy uruchamia odpowiednią akcję.',
      'lp.sys3.what':
        'Komponent UI oddzielony od logiki gry: koło nic nie wie o regułach lotniska, które w całości zostają w kodzie NPC. Samo zarządza też trybem sterowania w OnEnable/OnDisable: otwarcie zamraża rozglądanie się i ruch oraz odblokowuje kursor, a zamknięcie przywraca poprzedni stan, więc kod, który je otwiera, nie musi o tym pamiętać.',
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
        'Wszystkie trzy systemy są zbudowane tak, żeby mogła się do nich podłączyć praca innych osób: nowy model przedmiotu pojawia się w skanerze w kolorze swojej kategorii, gdy tylko jego części trafią na właściwe warstwy, a koło pokazuje te opcje, których identyfikatory przekaże mu wywołujący. Kompromis, na który zwróciłbym uwagę: sprawdzanie, czy coś blokuje wieko, używa jako maski fizyki tych samych warstw przedmiotów co rentgen, więc przedmiot bez swojej warstwy ani nie pojawiłby się w skanerze, ani nie zablokowałby wieka.',
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
