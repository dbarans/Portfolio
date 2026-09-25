<!--
Case study: Game of Life. Najpierw EN (główna wersja strony), potem PL, ta sama struktura.
Źródło: inwentarz project-extractor (2026-09-25), niejasności sprawdzone w kodzie C:\Projects\Unity\GameOfLife.
Fakty potwierdzone przez właściciela. Wersja w sklepie = main, tag v1.11.0: wielowątkowy pipeline Burst/Job System
jest w produkcji, a HashLife (Turbo) i Lab są wyłączone (debugMode), planowane w przyszłej wersji Pro.
Linie „Materiał:” to wskazówki dla designera, nie treść do publikacji.
Tabele „Key numbers” / „Najważniejsze liczby” i „Systems on this page” / „Systemy na tej stronie”
oraz linie „Kicker:”, „Caption:” / „Podpis:” to treść dla odwiedzających.
Aria-labels (EN → PL) są zebrane na końcu sekcji PL.
-->

## EN

### Game of Life

Kicker: Android · Unity 2022.3 · solo · published on Google Play

*An Android cellular-automaton simulator built to handle patterns of hundreds of thousands of live cells on a phone.*

Conway's Game of Life on an unbounded board: the player draws cells with a finger and watches them evolve, from a handful of cells to patterns hundreds of thousands of cells large. The rules fit in four sentences. The engineering is in making them scale on a phone.

Materiał: zdjęcie hero (jeszcze nie istnieje, zrobi je właściciel): zrzut z ekranu telefonu, duży wzorzec w widoku gęstości (LOD) przy dużym oddaleniu, np. Universal Turing Machine z Pattern Booka (ok. 252 tys. komórek); najlepiej bez paneli UI zasłaniających wzorzec. Alt EN: „A Game of Life pattern of hundreds of thousands of cells, zoomed far out on a phone and drawn as a density texture.” Alt PL: „Wzorzec gry w życie liczący setki tysięcy komórek, mocno oddalony na ekranie telefonu i narysowany jako tekstura gęstości.”

**Key numbers**

| Number | Label | Context |
|---|---|---|
| **15,000+** | Downloads on Google Play | Google Play store listing; solo project. |
| **64 → 141 gen/s** | Speed-up from direct chunk copies | Random pattern of 275k live cells on a Pixel 6 Pro: per-generation replay vs whole-chunk copies (system 2). |
| **~50 µs vs 1,035 µs** | Visible-cell query | Benchmark outside Unity, a 200×200-cell view with 316k live cells off-screen: chunked query vs the old full scan (system 3). |

Materiał: wartość „64 → 141 gen/s” ma wersję PL „64 → 141 gen./s” (z kropką po skrócie). W HTML ta liczba nie ma jeszcze klucza i18n, więc trzeba go dodać (np. `gol.kn2.value`).

**At a glance**

- **Role:** solo (engine, gameplay, UI and store release)
- **Engine:** Unity 2022.3 LTS, built-in render pipeline
- **Platform:** Android (IL2CPP, ARM64)
- **Status:** published on [Google Play](https://play.google.com/store/apps/details?id=com.dbarans.gameoflife), 15,000+ downloads
- **Key tech:** C#, Burst, Job System, Native Collections, multithreading, custom shaders, Tilemap
- **Code:** private repository

**Systems on this page**

| # | System | Skills |
|---|---|---|
| 1 | An engine that only computes what changes | Burst · Job System · bit-parallel kernel |
| 2 | Simulation on a background thread, with two ways to deliver results | Multithreading · producer–consumer · lock ordering |
| 3 | Rendering cost that follows the screen, not the pattern | Rendering · LOD · custom shader |
| 4 | Engine code verified outside Unity | Differential testing · headless Burst checks |

#### 1. An engine that only computes what changes

**Problem:** A straightforward simulation visits every live cell in every generation, so its cost grows with the whole pattern. On a phone, large patterns grind down even when most of the board isn't moving.

**How it works:** The board is split into 64×64 chunks stored as bitmasks (one 64-bit integer per row, one bit per cell). Each step recomputes only the chunks next to ones that changed in the previous step, counts neighbours for 64 cells at once with bitwise arithmetic, and runs as a chain of five Burst jobs on native memory. Burst compiles a restricted subset of C# into optimised native code, and the Job System spreads that work across worker threads.

**What it shows:** Data-oriented design with Burst and the Job System, and profiling on the target device. Parallelising only the core computation gave a clear gain in the editor but no measurable difference on the phone, because the real bottleneck was the serial data gathering around it. The release build runs the whole pipeline as jobs: on a dense random pattern, four worker threads deliver 1.96× the generations per second of one (measured on a phone).

Materiał: fragment kodu: `BitmaskGenerationSolver.Step()`, linie ~351–397 wg inwentarza (budowa zbioru kandydatów + łańcuch jobów). W ~45 liniach widać główny pomysł (przeliczani są tylko sąsiedzi chunków zmienionych w poprzednim kroku) i idiomatyczny Job System (zależności `JobHandle`, rozmiar batcha liczony z liczby workerów). Jeśli za długie, wystarczy pętla kandydatów (351–365) i dwa pierwsze `Schedule`.

#### 2. Simulation on a background thread, with two ways to deliver results

**Problem:** The simulation must never stall rendering or touch input. At low speed, each generation also has to reach the main thread on its own, because it drives the birth/death animations and haptics. At high speed, that per-generation hand-off became the bottleneck, and a faster engine actually made the frame rate worse.

**How it works:** Below the speed at which animations switch off anyway, each generation's changes (born and died cells) pass through a ring buffer, a fixed-size queue that reuses its slots, so the calculation thread can run ahead of the display. Above that speed there is nothing to animate, so the calculation thread copies whole changed chunks into the displayed state itself, and the main thread only renders.

**What it shows:** Safe multithreading around Unity's main-thread-only API: a producer–consumer design with explicit lock discipline. Two locks, one guarding the board state and one guarding the counters behind the zoomed-out density view (system 3), are always taken in the same order, which rules out deadlock. It also shows tracking down a counter-intuitive regression: switching to whole-chunk copies took a 275k-cell random pattern from 64 to 141 generations per second on a Pixel 6 Pro.

Materiał: diagram. Wybrana opcja: diagram pokazuje przepływ, a „How it works” / „Jak działa” opisuje tylko to, czego na diagramie nie ma (po co bufor i skąd próg). Układ: dwa poziome tory, górny „Calculation thread / Wątek obliczeniowy”, dolny „Main thread / Główny wątek”. Ścieżka A, etykieta „Below animation threshold / Poniżej progu animacji”: na torze górnym [Burst jobs / Joby Burst] → [Delta ring buffer / Bufor pierścieniowy zmian] z dopiskiem [deltas, not snapshots / zmiany, nie migawki], na granicy torów → na torze dolnym [One generation per frame / Jedna generacja na klatkę] z dopiskiem [With animations / Z animacjami]. Ścieżka B, etykieta „Above animation threshold / Powyżej progu animacji”: na torze górnym [Burst jobs / Joby Burst] → [Copies changed chunks / Kopiuje zmienione chunki] → [Displayed cell set / Wyświetlany zbiór komórek]. Kopiowanie robi wątek obliczeniowy, NIE główny: strzałka kopiowania musi wychodzić z toru górnego (sam blok „Displayed cell set” może stać na granicy torów, bo to stan współdzielony). Na torze dolnym ścieżki B jest tylko [Renders only / Tylko renderuje] z dopiskiem [FPS independent of speed / FPS niezależny od tempa]. Długości etykiet (DM Mono ≈ 0,6 em na znak): „Delta ring buffer” 17 znaków ≈ 133 px przy 13 px, „Bufor pierścieniowy zmian” 25 znaków ≈ 195 px przy 13 px (blok ma 220 px, mieści się); „One generation per frame” 24 znaki ≈ 180 px przy 12,5 px, „Jedna generacja na klatkę” 25 znaków ≈ 188 px przy 12,5 px (blok 220 px); „deltas, not snapshots” 21 znaków ≈ 132 px przy 10,5 px, „zmiany, nie migawki” 19 znaków ≈ 120 px. Wersja „Odtwarza generację na klatkę” ma 28 znaków ≈ 210 px, czyli praktycznie bez marginesu w bloku 220 px, dlatego etykieta jest krótsza. Locków diagram nie pokazuje: ich kolejność opisuje „What it shows” / „Co to pokazuje”.

Caption: Two ways to deliver results, chosen by simulation speed: below the animation threshold the main thread replays each generation with animations; above it the calculation thread copies changed chunks itself and the main thread only renders.

#### 3. Rendering cost that follows the screen, not the pattern

**Problem:** Zoomed out, a pattern can put hundreds of thousands of cells on screen, and Unity's Tilemap pays a cost for every tile. Even finding which cells were visible used to mean scanning every live cell. The game slowed down as a pattern grew, including the parts that were off-screen.

**How it works:** Live cells are stored in a chunked bitmask structure that answers "what's inside this camera rectangle" in time proportional to the visible area. Up close, the Tilemap receives only each generation's changes. Zoomed far out, it's replaced by one quad textured with cell density (one byte per texel) and drawn by a custom shader in a single draw call. The switch uses hysteresis, with separate thresholds for entering and leaving, so the view doesn't flicker between modes.

**What it shows:** Rendering optimisation in Unity (draw calls, the limits of a built-in component, level-of-detail switching) and choosing data structures by the queries they have to answer. In a benchmark outside Unity, the on-screen query stays at ~50 µs however many cells live off-screen. The old full scan had grown to 1,035 µs at 316k live cells.

Materiał: nagranie z gry: jeden płynny pinch-zoom od pojedynczych komórek do całej bardzo dużej struktury (inwentarz sugeruje Universal Turing Machine z Pattern Booka, ok. 252 tys. komórek), z włączonym licznikiem FPS. Ma być widać moment przejścia z Tilemapy na widok gęstości i to, że obraz nie przycina. Podpis poniżej zakłada wzorzec liczący setki tysięcy komórek; jeśli nagranie pokaże mniejszy, podpis trzeba poprawić.

Caption: One continuous pinch-zoom from single cells out to a pattern of hundreds of thousands, with the FPS counter on: the tiles give way to the single-quad density view without a stutter.

#### 4. Engine code verified outside Unity

**Problem:** A bug in a stateful, bit-level engine doesn't crash anything. It produces a plausible but wrong pattern, often many generations later, so watching the screen won't catch it.

**How it works:** A .NET console harness compiles the same solver source files that ship to the store, with a small shim stubbing Unity's collections, Jobs and Burst. Every generation of every scenario (gliders crossing chunk edges and into negative coordinates, an empty board) is compared cell for cell with a naive reference. Each run also folds into a golden hash that a pure refactor must reproduce byte for byte. A headless Burst compile of all five jobs for ARM64 includes a negative control that must fail to compile, so a clean pass proves something.

**What it shows:** Testing discipline for core game logic, in three concrete techniques. Differential testing checks every generation against a brute-force reference, not just the final state, so an error shows up in the generation that caused it. A golden-hash regression check proves that a refactor changed nothing. A negative control proves that the headless Burst check is able to fail. All of it runs from the command line, without opening the editor.

Materiał: diagram. Wybrana opcja: krótkie etykiety (2–4 słowa), szczegóły zostają w prozie. Środek: [Same solver source / To samo źródło solvera] z podpisem plików `BitmaskKernel.cs`, `BitmaskGenerationSolver.cs`. Z tego samego bloku wychodzą dwie strzałki: → [Android store build / Build Android do sklepu] oraz → [.NET test harness / Harness testowy .NET] → [vs naive reference / Porównanie z referencją] i [Golden hash / Hash wzorcowy]. Obok: [BurstProbe: ARM64 compile / BurstProbe: kompilacja ARM64] z dopiskiem wyłącznie [Negative control / Kontrola negatywna] (16 znaków ≈ 96 px / 18 znaków ≈ 108 px przy 10 px, jedna linia). BurstProbe kompiluje te same pięć jobów z tego samego, wysyłanego do sklepu źródła, więc nie podpisywać go jako „osobny” ani „nie ze źródła”; może dostać trzecią strzałkę z bloku źródła. Nie rysować testów jako osobnej kopii kodu: strzałki wychodzą z tych samych plików.

Caption: Both branches compile the same files, so the tests are never a stale copy of the engine.

#### Takeaway

Measure on the target device, not in the editor: in this project the editor pointed at the wrong bottleneck.

**Also in the codebase (not in the store build):** HashLife (Gosper's algorithm), a second engine that caches and reuses results in a quadtree, so repetitive patterns jump thousands of generations in one step. It has a memory budget scaled to the device's RAM and tests against a brute-force reference, but it's switched off in the store build and planned for a future Pro version.

Materiał: aria-labels tej strony (EN i PL) są na końcu sekcji PL.

## PL

### Game of Life

Kicker: Android · Unity 2022.3 · solo · opublikowana w Google Play

*Symulator automatu komórkowego na Androida, zbudowany tak, żeby telefon radził sobie z wzorcami liczącymi setki tysięcy żywych komórek.*

Gra w życie Conwaya na nieograniczonej planszy: gracz rysuje komórki palcem i patrzy, jak ewoluują, od kilku komórek po wzorce liczące setki tysięcy. Reguły mieszczą się w czterech zdaniach. Trudność techniczna polega na tym, żeby skalowały się na telefonie.

Materiał: zdjęcie hero (jeszcze nie istnieje, zrobi je właściciel): zrzut z ekranu telefonu, duży wzorzec w widoku gęstości (LOD) przy dużym oddaleniu, np. Universal Turing Machine z Pattern Booka (ok. 252 tys. komórek); najlepiej bez paneli UI zasłaniających wzorzec. Alt EN: „A Game of Life pattern of hundreds of thousands of cells, zoomed far out on a phone and drawn as a density texture.” Alt PL: „Wzorzec gry w życie liczący setki tysięcy komórek, mocno oddalony na ekranie telefonu i narysowany jako tekstura gęstości.”

**Najważniejsze liczby**

| Liczba | Podpis | Kontekst |
|---|---|---|
| **15 000+** | Pobrań w Google Play | Strona gry w Google Play; projekt solo. |
| **64 → 141 gen./s** | Zysk z kopiowania całych chunków | Losowy wzorzec z 275 tys. żywych komórek na Pixelu 6 Pro: odtwarzanie generacja po generacji vs kopiowanie całych chunków (system 2). |
| **~50 µs vs 1035 µs** | Zapytanie o widoczne komórki | Benchmark poza Unity, widok 200×200 komórek i 316 tys. żywych komórek poza ekranem: zapytanie po chunkach vs stare pełne skanowanie (system 3). |

Materiał: wartość „64 → 141 gen/s” ma wersję PL „64 → 141 gen./s” (z kropką po skrócie). W HTML ta liczba nie ma jeszcze klucza i18n, więc trzeba go dodać (np. `gol.kn2.value`).

**W skrócie**

- **Rola:** solo (silnik, rozgrywka, UI i publikacja w sklepie)
- **Silnik:** Unity 2022.3 LTS, wbudowany render pipeline (built-in)
- **Platforma:** Android (IL2CPP, ARM64)
- **Status:** opublikowana w [Google Play](https://play.google.com/store/apps/details?id=com.dbarans.gameoflife), 15 000+ pobrań
- **Kluczowe technologie:** C#, Burst, Job System, Native Collections, wielowątkowość, własne shadery, Tilemap
- **Kod:** repozytorium prywatne

**Systemy na tej stronie**

| # | System | Umiejętności |
|---|---|---|
| 1 | Silnik, który liczy tylko to, co się zmienia | Burst · Job System · równoległe obliczenia na bitach |
| 2 | Symulacja w wątku w tle, z dwoma sposobami przekazywania wyników | Wielowątkowość · producent–konsument · kolejność locków |
| 3 | Koszt renderowania zależny od ekranu, a nie od wzorca | Renderowanie · LOD · własny shader |
| 4 | Kod silnika weryfikowany poza Unity | Testy różnicowe · Burst sprawdzany bez edytora |

#### 1. Silnik, który liczy tylko to, co się zmienia

**Problem:** Prosta symulacja w każdej generacji odwiedza każdą żywą komórkę, więc jej koszt rośnie razem z całym wzorcem. Na telefonie przy dużych wzorcach symulacja zaczyna się dławić, nawet gdy większość planszy się nie zmienia.

**Jak działa:** Plansza jest podzielona na chunki 64×64 zapisane jako maski bitowe (jedna 64-bitowa liczba na wiersz, jeden bit na komórkę). Każdy krok przelicza tylko chunki sąsiadujące z tymi, które zmieniły się w poprzednim kroku, liczy sąsiadów 64 komórek naraz arytmetyką bitową i działa jako łańcuch pięciu jobów Burst na pamięci natywnej. Burst kompiluje ograniczony podzbiór C# do zoptymalizowanego kodu natywnego, a Job System rozkłada tę pracę na wątki robocze.

**Co to pokazuje:** Projektowanie zorientowane na dane z użyciem Burst i Job System oraz profilowanie na urządzeniu docelowym. Zrównoleglenie samego rdzenia obliczeń dało wyraźny zysk w edytorze, ale na telefonie nie dało mierzalnej różnicy, bo prawdziwym wąskim gardłem było szeregowe zbieranie danych wokół niego. Wersja w sklepie uruchamia cały pipeline jako joby: na gęstym losowym wzorcu cztery wątki robocze dają 1,96 raza więcej generacji na sekundę niż jeden (pomiar na telefonie).

Materiał: fragment kodu: `BitmaskGenerationSolver.Step()`, linie ~351–397 wg inwentarza (budowa zbioru kandydatów + łańcuch jobów). W ~45 liniach widać główny pomysł (przeliczani są tylko sąsiedzi chunków zmienionych w poprzednim kroku) i idiomatyczny Job System (zależności `JobHandle`, rozmiar batcha liczony z liczby workerów). Jeśli za długie, wystarczy pętla kandydatów (351–365) i dwa pierwsze `Schedule`.

#### 2. Symulacja w wątku w tle, z dwoma sposobami przekazywania wyników

**Problem:** Symulacja nie może blokować renderowania ani obsługi dotyku. Przy niskiej prędkości każda generacja musi też osobno trafić do głównego wątku, bo napędza animacje narodzin i śmierci komórek oraz wibracje. Przy wysokiej prędkości to przekazywanie generacja po generacji stało się wąskim gardłem i szybszy silnik zaczął pogarszać płynność.

**Jak działa:** Poniżej prędkości, przy której animacje i tak się wyłączają, zmiany każdej generacji (narodzone i obumarłe komórki) trafiają do bufora pierścieniowego, czyli kolejki o stałym rozmiarze, która ponownie używa swoich slotów. Dzięki temu wątek obliczeniowy może liczyć z wyprzedzeniem. Powyżej tej prędkości nie ma czego animować, więc wątek obliczeniowy sam kopiuje całe zmienione chunki do wyświetlanego stanu, a główny wątek tylko renderuje.

**Co to pokazuje:** Bezpieczną wielowątkowość wokół API Unity, które działa tylko na głównym wątku: model producent–konsument z jawną dyscypliną locków. Dwa locki, jeden chroniący stan planszy, a drugi liczniki, z których powstaje widok gęstości przy dużym oddaleniu (system 3), są zawsze brane w tej samej kolejności, co wyklucza zakleszczenie. Do tego wytropienie nieintuicyjnej regresji: przejście na kopiowanie całych chunków podniosło tempo losowego wzorca z 275 tys. komórek z 64 do 141 generacji na sekundę na Pixelu 6 Pro.

Materiał: diagram. Wybrana opcja: diagram pokazuje przepływ, a „How it works” / „Jak działa” opisuje tylko to, czego na diagramie nie ma (po co bufor i skąd próg). Układ: dwa poziome tory, górny „Calculation thread / Wątek obliczeniowy”, dolny „Main thread / Główny wątek”. Ścieżka A, etykieta „Below animation threshold / Poniżej progu animacji”: na torze górnym [Burst jobs / Joby Burst] → [Delta ring buffer / Bufor pierścieniowy zmian] z dopiskiem [deltas, not snapshots / zmiany, nie migawki], na granicy torów → na torze dolnym [One generation per frame / Jedna generacja na klatkę] z dopiskiem [With animations / Z animacjami]. Ścieżka B, etykieta „Above animation threshold / Powyżej progu animacji”: na torze górnym [Burst jobs / Joby Burst] → [Copies changed chunks / Kopiuje zmienione chunki] → [Displayed cell set / Wyświetlany zbiór komórek]. Kopiowanie robi wątek obliczeniowy, NIE główny: strzałka kopiowania musi wychodzić z toru górnego (sam blok „Displayed cell set” może stać na granicy torów, bo to stan współdzielony). Na torze dolnym ścieżki B jest tylko [Renders only / Tylko renderuje] z dopiskiem [FPS independent of speed / FPS niezależny od tempa]. Długości etykiet (DM Mono ≈ 0,6 em na znak): „Delta ring buffer” 17 znaków ≈ 133 px przy 13 px, „Bufor pierścieniowy zmian” 25 znaków ≈ 195 px przy 13 px (blok ma 220 px, mieści się); „One generation per frame” 24 znaki ≈ 180 px przy 12,5 px, „Jedna generacja na klatkę” 25 znaków ≈ 188 px przy 12,5 px (blok 220 px); „deltas, not snapshots” 21 znaków ≈ 132 px przy 10,5 px, „zmiany, nie migawki” 19 znaków ≈ 120 px. Wersja „Odtwarza generację na klatkę” ma 28 znaków ≈ 210 px, czyli praktycznie bez marginesu w bloku 220 px, dlatego etykieta jest krótsza. Locków diagram nie pokazuje: ich kolejność opisuje „What it shows” / „Co to pokazuje”.

Podpis: Dwa sposoby przekazywania wyników, wybierane zależnie od tempa symulacji: poniżej progu animacji główny wątek odtwarza każdą generację z animacjami; powyżej niego wątek obliczeniowy sam kopiuje zmienione chunki, a główny wątek tylko renderuje.

#### 3. Koszt renderowania zależny od ekranu, a nie od wzorca

**Problem:** Po oddaleniu na ekranie mogą być setki tysięcy komórek, a w Unity każdy kafelek Tilemapy kosztuje osobno. Nawet ustalenie, które komórki są widoczne, wymagało kiedyś przejrzenia wszystkich żywych komórek. Gra zwalniała wraz ze wzrostem wzorca, także przez tę jego część, której nie było widać.

**Jak działa:** Żywe komórki są przechowywane w strukturze chunków z maskami bitowymi, która odpowiada na pytanie „co jest w tym prostokącie kamery” w czasie proporcjonalnym do widocznego obszaru. Z bliska Tilemapa dostaje tylko zmiany z każdej generacji. Przy dużym oddaleniu zastępuje ją jeden quad z teksturą gęstości komórek (jeden bajt na teksel), rysowany własnym shaderem w jednym draw callu. Przełączanie ma histerezę, czyli osobne progi wejścia i wyjścia, żeby widok nie migotał między trybami.

**Co to pokazuje:** Optymalizację renderowania w Unity (draw calle, ograniczenia wbudowanego komponentu, przełączanie poziomu szczegółowości, czyli LOD) i dobór struktur danych do zapytań, na które muszą odpowiadać. W benchmarku poza Unity zapytanie o widoczne komórki zajmuje stale ~50 µs, bez względu na to, ile komórek jest poza ekranem. Stare pełne skanowanie dochodziło do 1035 µs przy 316 tys. żywych komórek.

Materiał: nagranie z gry: jeden płynny pinch-zoom od pojedynczych komórek do całej bardzo dużej struktury (inwentarz sugeruje Universal Turing Machine z Pattern Booka, ok. 252 tys. komórek), z włączonym licznikiem FPS. Ma być widać moment przejścia z Tilemapy na widok gęstości i to, że obraz nie przycina. Podpis poniżej zakłada wzorzec liczący setki tysięcy komórek; jeśli nagranie pokaże mniejszy, podpis trzeba poprawić.

Podpis: Jeden płynny pinch-zoom od pojedynczych komórek do wzorca liczącego setki tysięcy komórek, z włączonym licznikiem FPS: kafelki ustępują widokowi gęstości na jednym quadzie bez zacięć.

#### 4. Kod silnika weryfikowany poza Unity

**Problem:** Błąd w stanowym silniku operującym na bitach nie powoduje awarii. Daje wiarygodnie wyglądający, ale błędny wzorzec, często dopiero wiele generacji później, więc patrząc na ekran, nie da się go wyłapać.

**Jak działa:** Konsolowy harness .NET kompiluje te same pliki źródłowe solvera, które trafiają do wersji w sklepie, a mały shim zastępuje kolekcje, Jobs i Burst z Unity. Każda generacja każdego scenariusza (glidery przekraczające granice chunków i wchodzące w ujemne współrzędne, pusta plansza) jest porównywana komórka po komórce z naiwną implementacją referencyjną. Cały przebieg daje też jeden hash wzorcowy, który refaktor przenoszący tylko kod musi odtworzyć bajt w bajt. Uruchamiana bez edytora kompilacja wszystkich pięciu jobów kompilatorem Burst pod ARM64 zawiera kontrolę negatywną, czyli kod, który musi się nie skompilować, więc czysty wynik faktycznie coś dowodzi.

**Co to pokazuje:** Dyscyplinę testowania kluczowej logiki gry w trzech konkretnych technikach. Testy różnicowe sprawdzają każdą generację względem implementacji brute-force, a nie tylko stan końcowy, więc błąd wychodzi w tej generacji, w której powstał. Test regresji oparty na hashu wzorcowym dowodzi, że refaktor niczego nie zmienił. Kontrola negatywna dowodzi, że sprawdzanie Burst bez edytora w ogóle potrafi zgłosić błąd. Wszystko działa z linii poleceń, bez otwierania edytora.

Materiał: diagram. Wybrana opcja: krótkie etykiety (2–4 słowa), szczegóły zostają w prozie. Środek: [Same solver source / To samo źródło solvera] z podpisem plików `BitmaskKernel.cs`, `BitmaskGenerationSolver.cs`. Z tego samego bloku wychodzą dwie strzałki: → [Android store build / Build Android do sklepu] oraz → [.NET test harness / Harness testowy .NET] → [vs naive reference / Porównanie z referencją] i [Golden hash / Hash wzorcowy]. Obok: [BurstProbe: ARM64 compile / BurstProbe: kompilacja ARM64] z dopiskiem wyłącznie [Negative control / Kontrola negatywna] (16 znaków ≈ 96 px / 18 znaków ≈ 108 px przy 10 px, jedna linia). BurstProbe kompiluje te same pięć jobów z tego samego, wysyłanego do sklepu źródła, więc nie podpisywać go jako „osobny” ani „nie ze źródła”; może dostać trzecią strzałkę z bloku źródła. Nie rysować testów jako osobnej kopii kodu: strzałki wychodzą z tych samych plików.

Podpis: Obie gałęzie kompilują te same pliki, więc testy nigdy nie są nieaktualną kopią silnika.

#### Wnioski

Mierzyć trzeba na urządzeniu docelowym, a nie w edytorze: w tym projekcie edytor wskazał niewłaściwe wąskie gardło.

**Również w kodzie (poza wersją sklepową):** HashLife (algorytm Gospera), drugi silnik, który zapamiętuje i ponownie wykorzystuje wyniki w drzewie czwórkowym, dzięki czemu powtarzalne wzorce przeskakują tysiące generacji w jednym kroku. Ma budżet pamięci skalowany do RAM-u urządzenia i testy względem implementacji brute-force, ale w wersji w sklepie jest wyłączony i czeka na przyszłą wersję Pro.

Materiał: Aria-labels (game-of-life.html), EN → PL. Teksty EN wzięte z HTML; oznaczone „(zmiana EN)” trzeba też podmienić w HTML.

- Nawigacja „Next case study” → „Następne studium przypadku”
- System 1, blok kodu: „Code excerpt from BitmaskGenerationSolver.cs, the Step method: building the candidate set and scheduling the Burst job chain” → „Fragment kodu z BitmaskGenerationSolver.cs, metoda Step: budowa zbioru kandydatów i planowanie łańcucha jobów Burst”
- System 2, diagram: „Two lanes: calculation thread above, main thread below. Below the animation threshold, a Burst-jobs box feeds a delta ring buffer straddling both lanes, and the main thread replays one generation per frame with animations. Above the threshold, a separate Burst-jobs box feeds, still inside the calculation-thread lane, a box that copies whole changed chunks; that copy reaches a displayed cell set straddling both lanes, and the main thread only renders, independent of simulation speed.” → „Dwa tory: u góry wątek obliczeniowy, na dole główny wątek. Poniżej progu animacji blok jobów Burst zasila bufor pierścieniowy zmian, leżący na granicy obu torów, a główny wątek odtwarza jedną generację na klatkę, z animacjami. Powyżej progu osobny blok jobów Burst zasila, nadal na torze wątku obliczeniowego, blok kopiujący całe zmienione chunki; kopia trafia do wyświetlanego zbioru komórek na granicy obu torów, a główny wątek tylko renderuje, niezależnie od tempa symulacji.”
- System 4, diagram (zmiana EN): „The same solver source branches into the Android store build and a .NET test harness that compares every generation against a naive reference and folds each run into a golden hash. A BurstProbe check compiles the same five jobs for ARM64, with a negative control that must fail to compile.” → „To samo źródło solvera trafia do builda Android do sklepu i do harnessu testowego .NET, który porównuje każdą generację z naiwną implementacją referencyjną i sprowadza każdy przebieg do jednego hasha wzorcowego. BurstProbe kompiluje te same pięć jobów pod ARM64, z kontrolą negatywną, która musi się nie skompilować.”
