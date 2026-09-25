<!--
Case study: Grave. Najpierw EN (główna wersja strony), potem PL, ta sama struktura.
Źródła: inwentarze project-extractor (2026-09-25): grave.md (A*, widoczność, generator) oraz grave-enemy-ai.md (AI przeciwników).
Nie opisuję żadnych innych systemów gry ani fabuły.
Fakty i autorstwo potwierdzone przez właściciela: projekt inżynierski, zespół 4 osób. Opisane systemy
(A*, widoczność, generator lochów, całe AI przeciwników) to wybór do portfolio, a nie cały jego wkład.
Linie „Materiał:” to wskazówki dla designera, nie treść do publikacji.
Tabele „Key numbers” / „Najważniejsze liczby” i „Systems on this page” / „Systemy na tej stronie”
oraz linie „Caption:” / „Podpis:” to treść dla odwiedzających.
-->

## EN

### Grave

*Systems I built for a top-down 2D game in Unity 6: pathfinding, visibility, procedural dungeons and enemy AI.*

Grave is a top-down 2D survival horror in which the player sees only what their line of sight and light sources reach. It was made by a team of four as an engineering thesis project. This case study covers systems I built for it: enemy pathfinding, the visibility system, procedural dungeon generation and enemy AI.

Materiał: zdjęcie hero (jeszcze nie istnieje, zrobi je właściciel): oświetlone pomieszczenie lochu, w którym filary przesłaniają stożek widzenia gracza; mają być widoczne ostre cienie za filarami i ciemność poza zasięgiem światła. Alt EN: „A lit dungeon room seen from above: pillars cut sharp shadows into the player's view cone, and everything outside the light fades into darkness.” Alt PL: „Oświetlone pomieszczenie lochu widziane z góry: filary rzucają ostre cienie w stożku widzenia gracza, a wszystko poza światłem ginie w ciemności.”

**Key numbers**

| Number | Label | Context |
|---|---|---|
| **48** | EditMode unit tests | All cover the dungeon generator, which runs without a scene; many sweep dozens to hundreds of seeds. |
| **4,000** | Node cap per A* search | A design limit, not a benchmark: past it, the search returns the best partial path instead of stalling the frame. |
| **~30 → ~12 ms** | Frame time after profiling | Measured in the editor, after one profiling pass: coarser ray sampling outside the view cone, A* buffer caching and a few other fixes. |

**At a glance**

- **Team:** 4 people (engineering thesis)
- **Covered here:** systems I built: A* pathfinding, the visibility system, procedural dungeon generation, enemy AI
- **Engine:** Unity 6 (6000.3.8f1), URP 2D
- **Platform:** PC
- **Status:** engineering thesis project, Collegium Da Vinci, 2026
- **Key tech (in these systems):** C#, Physics2D, custom URP shaders (HLSL), RenderTexture, assembly definitions, Unity Test Framework (48 EditMode tests)
- **Code:** [team repository on GitHub](https://github.com/dbarans/engineering-project/tree/main), each system below links to its own source folder

**Systems on this page**

| # | System | Skills |
|---|---|---|
| 1 | A* pathfinding with a predictable frame cost | A* · binary heap · bounded frame cost |
| 2 | Visibility system: a light mask rendered by a second camera and custom shaders | RenderTexture · custom URP shaders · raycasting |
| 3 | Procedural dungeon generator: seeded, validated, tested | Graph algorithms · determinism · unit tests |
| 4 | Enemy AI: senses built from components, and an update budget based on distance | Composition · interfaces · AI update budget |

#### 1. A* pathfinding with a predictable frame cost

**Problem:** Enemies chase the player across a generated dungeon, a 40,000-cell grid (200×200), and no single path search may stall a frame. The worst case is an unreachable target: a plain A* explores the entire map before it gives up.

**How it works:** The level's colliders are sampled into a flat walkability grid, which is updated locally when an obstacle is destroyed. A flood fill splits the grid into connected regions, so an unreachable target is rejected in O(1) before any search starts. The search uses a binary heap, a priority queue that returns the cheapest node in O(log n). It reuses its buffers between searches, invalidating them with a per-search version number instead of clearing them. It also caps the number of explored nodes and returns the best partial path instead of freezing the game.

**What it shows:** Turning a textbook algorithm into one with a bounded per-frame cost, where setup scales with the area searched rather than the map size. Movement is a swappable strategy component behind small interfaces, so enemy logic doesn't depend on the pathfinder and can be switched to simple direct movement.

**Source:** [`Assets/Scripts/Pathfinding`](https://github.com/dbarans/engineering-project/tree/main/Assets/Scripts/Pathfinding)

Materiał: fragment kodu: `AStarPathfinder.FindPath(...)`, linie ~94–196 wg inwentarza. W jednej metodzie widać całe podejście: wczesne odrzucenie celu przez id regionu, pętlę na kopcu, budżet węzłów i zwrot najlepszej częściowej ścieżki. Warto przyciąć do tych czterech miejsc.

#### 2. Visibility system: a light mask rendered by a second camera and custom shaders

**Problem:** Everything outside the player's line of sight, enemies included, has to be hidden, and light from several sources (the player's view cone, lamps) must blend smoothly. An earlier version used the stencil buffer, which stores a simple on/off flag per pixel. Sprites were cut off sharply at the edge of the light, and two lights couldn't blend smoothly.

**How it works:** The player's view cone and every lamp go through one shared mesh builder. Where two neighbouring rays hit different surfaces, a binary search between them finds the exact edge, so outlines stay sharp without casting more rays. Max blending lets overlapping lights take the brighter value instead of adding up. The mask keeps light level in alpha and light colour in RGB, so one texture both dims and tints the scene, and sprite shaders hide whatever no light reaches.

**What it shows:** Working with Unity's rendering beyond ready-made components: an extra camera, render layers, a RenderTexture, blend modes and custom URP shaders, plus replacing an architecture once it hit its limits. It also shows profiling. The cone used to cast a full circle of rays at full density just to draw a small ring of vision around the player; sampling that ring more coarsely, with other fixes in the same pass including per-grid A* buffer caching, took the frame from ~30 ms to ~12 ms (measured in the editor).

**Source:** [`Assets/Scripts/Vision`](https://github.com/dbarans/engineering-project/tree/main/Assets/Scripts/Vision), [`Assets/Shaders`](https://github.com/dbarans/engineering-project/tree/main/Assets/Shaders)

Materiał: diagram, pipeline od lewej do prawej, 4 kroki (etykieta główna + dopisek, EN / PL). (1) [Ray fan per light / Wachlarz promieni] + [Edge search → mesh / Szukanie krawędzi → mesh], pod spodem `OcclusionMeshBuilder` (jeden dla gracza i lamp). (2) [Mask camera → RenderTexture / Kamera maski → RenderTexture] + [BlendOp Max: brighter wins / BlendOp Max: jaśniejsze wygrywa], pod spodem warstwa `VisionMask`. (3) [Global `_VisionMask` texture / Globalna tekstura `_VisionMask`]. (4) [Darkness overlay + sprite shaders / Nakładka ciemności + shadery sprite'ów], pod spodem `DarknessOverlay`, `SpriteFovMasked`. Proza nie powtarza tych kroków, tylko wyjaśnia, po co są.

Materiał: nagranie z gry: gracz idzie ciemnym pomieszczeniem z filarami i lampą. Ma być widać stożek widzenia zasłaniany przez przeszkody, sprite'y przeciwników płynnie znikające na granicy światła i dwa nakładające się światła bez widocznego szwu. Pokazywać sam system, nie warianty rozgrywki. Podpis poniżej opisuje dokładnie te trzy rzeczy; jeśli któraś nie trafi do nagrania, podpis trzeba poprawić.

Caption: The player crosses a dark room with pillars and a lamp: pillars cut into the view cone, an enemy fades out at the edge of the light, and two overlapping lights blend without a seam.

#### 3. Procedural dungeon generator: seeded, validated, tested

**Problem:** Every run needs a new dungeon that is always fully connected, with no unreachable rooms and no doorways leading into solid rock. It also has to be reproducible: the same seed must produce the identical dungeon on any machine, so a level can be recreated, debugged and tested from its seed alone.

**How it works:** The generator is a pure C# pipeline in its own assembly, with no dependency on scenes or MonoBehaviours. It places rooms and connects them with a minimum spanning tree built with Kruskal's algorithm and Union-Find, which gives the cheapest set of corridors linking every room. A few extra edges add loops. The pipeline then carves rooms and corridors, including dead-end corridor alcoves, validates the result, and retries with a derived seed if validation fails. A deterministic random generator gives each stage its own independent stream, so changing one stage doesn't reshuffle the others. Graph analysis finds articulation points (chokepoints), the cells that would split the dungeon in two if blocked, so props are never placed on them.

**What it shows:** Applying graph algorithms to a real game problem, and an architecture built for testing. The generator doesn't touch the engine, so 48 EditMode unit tests cover it. Many of them sweep dozens to hundreds of seeds; for example, all 500 random seeds in one test must pass validation and produce unique layouts.

**Source:** [`Assets/Scripts/Generation/Layout`](https://github.com/dbarans/engineering-project/tree/main/Assets/Scripts/Generation/Layout), tests: [`Assets/Tests/EditMode`](https://github.com/dbarans/engineering-project/tree/main/Assets/Tests/EditMode)

Materiał: fragment kodu: `RoomCorridorGenerator.BuildOnce(...)`, linie ~70–92 wg inwentarza. To 22 linie, które czyta się jak spis treści pipeline'u, a każdy etap dostaje własny strumień losowości (`random.Derive("rooms")`, `"links"`, `"corridors"`…), więc determinizm widać bez tłumaczenia.

#### 4. Enemy AI: senses built from components, and an update budget based on distance

**Problem:** A generated dungeon holds many enemies. Each one runs a state machine (patrol, chase, investigate) and a full A* search a few times a second, even though most of them are nowhere near the player. Enemy types also differ in how they sense the player, and adding a new type shouldn't mean editing a shared base class.

**How it works:** `EnemyBase` finds its components by interface and never learns which classes are behind them. It queries every attached detector, and any of them can confirm the player. Hearing is a separate channel fed by a noise event bus: a heard noise sends the enemy to check the spot but doesn't count as detection, because a noise is only a suspicion. The update zones in the diagram are sized from each enemy's own sensor range, so the budget adapts to the enemy type. Random jitter keeps groups from ticking on the same frame, and parked enemies release their cached paths.

**What it shows:** Composition over inheritance in practice. The blind enemy type is a 16-line subclass whose only real content is `[RequireComponent(typeof(SoundPlayerDetector))]`: being blind just means its prefab has no `VisionPlayerDetector`, and it was added without touching the base class. It also shows how to budget AI cost across a large level without making enemies near the player any less responsive.

**Source:** [`Assets/Scripts/Enemy`](https://github.com/dbarans/engineering-project/tree/main/Assets/Scripts/Enemy)

Materiał: diagram w dwóch częściach; strefy odległości niesie diagram, proza ich nie powtarza. (1) Hub ze szprychami, nie pipeline: w środku [`EnemyBase`: state machine / `EnemyBase`: maszyna stanów], strzałki od środka do każdego komponentu (to `EnemyBase` odpytuje komponenty przez interfejsy). Szprychy: `IPlayerDetector` → `VisionPlayerDetector` [Detection: sight / Wykrycie: wzrok]; `INoiseSensor` → `SoundPlayerDetector`, zasilany z `NoiseEvents` [Hearing: suspicion only / Słuch: tylko podejrzenie]; `IMovementStrategy` → `PathfindingMovement` (A*) albo `SimpleDirectMovement` [Movement: A* or direct / Ruch: A* lub bezpośredni]. Dwie pierwsze szprychy można zgrupować jako [Senses / Zmysły]; ruch stoi osobno, to nie zmysł. Obok mały wariant: ten sam hub bez szprychy wzroku [Blind type: no sight / Typ ślepy: bez wzroku]. (2) Koncentryczne pierścienie wokół gracza, od środka: [Every frame / Co klatkę] z dopiskiem [sensor range + margin / zasięg zmysłów + margines]; [Timed, with jitter / Co interwał, z rozrzutem]; [Parked, path released / Uśpiony, ścieżka zwolniona]. Na granicy parkowania: [Safety floor / Dolny próg bezpieczeństwa] z dopiskiem [never within sensing range / nigdy w zasięgu zmysłów] oraz dwie bliskie linie [Hysteresis: park / wake / Histereza: uśpienie / wybudzenie] (linia wybudzenia nieco wewnątrz linii parkowania).

#### Takeaway

The common thread is loose coupling through data. The generator knows nothing about pathfinding, vision or AI. It produces a layout that becomes colliders, which the A* grid and the light rays both read, and a list of chokepoints and corridor alcoves that enemy placement uses to set ambushes in the alcoves and to post guards beside a chokepoint, never on it. The AI in turn reaches pathfinding only through narrow interfaces, so the systems work together without depending on each other's code.

## PL

### Grave

*Systemy, które zbudowałem do gry 2D z widokiem z góry w Unity 6: pathfinding, widoczność, proceduralne lochy i AI przeciwników.*

Grave to survival horror 2D z widokiem z góry, w którym gracz widzi tylko to, co obejmuje jego pole widzenia i co oświetlają źródła światła. Powstał w 4-osobowym zespole jako projekt inżynierski. Opisuję tu zbudowane przeze mnie systemy: pathfinding przeciwników, system widoczności, proceduralne generowanie lochów i AI przeciwników.

Materiał: zdjęcie hero (jeszcze nie istnieje, zrobi je właściciel): oświetlone pomieszczenie lochu, w którym filary przesłaniają stożek widzenia gracza; mają być widoczne ostre cienie za filarami i ciemność poza zasięgiem światła. Alt EN: „A lit dungeon room seen from above: pillars cut sharp shadows into the player's view cone, and everything outside the light fades into darkness.” Alt PL: „Oświetlone pomieszczenie lochu widziane z góry: filary rzucają ostre cienie w stożku widzenia gracza, a wszystko poza światłem ginie w ciemności.”

**Najważniejsze liczby**

| Liczba | Podpis | Kontekst |
|---|---|---|
| **48** | Testów jednostkowych EditMode | Wszystkie dotyczą generatora lochów, który działa bez sceny; wiele z nich sprawdza dziesiątki lub setki seedów. |
| **4000** | Limit węzłów na wyszukiwanie A* | Limit projektowy, a nie wynik benchmarku: po jego przekroczeniu wyszukiwanie zwraca najlepszą częściową ścieżkę, zamiast przycinać klatkę. |
| **~30 → ~12 ms** | Czas klatki po profilowaniu | Pomiar w edytorze, po jednej serii optymalizacji: rzadsze próbkowanie promieni poza stożkiem widzenia, ponowne użycie buforów A* i kilka innych poprawek. |

**W skrócie**

- **Zespół:** 4 osoby (praca inżynierska)
- **Opisuję tu:** zbudowane przeze mnie systemy: pathfinding A*, system widoczności, proceduralne generowanie lochów, AI przeciwników
- **Silnik:** Unity 6 (6000.3.8f1), URP 2D
- **Platforma:** PC
- **Status:** projekt inżynierski, Collegium Da Vinci, 2026
- **Kluczowe technologie (w tych systemach):** C#, Physics2D, własne shadery URP (HLSL), RenderTexture, assembly definitions, Unity Test Framework (48 testów EditMode)
- **Kod:** [repozytorium zespołu na GitHubie](https://github.com/dbarans/engineering-project/tree/main), każdy system poniżej linkuje do swojego folderu

**Systemy na tej stronie**

| # | System | Umiejętności |
|---|---|---|
| 1 | Pathfinding A* o przewidywalnym koszcie na klatkę | A* · kopiec binarny · ograniczony koszt klatki |
| 2 | System widoczności: maska światła renderowana przez drugą kamerę i własne shadery | RenderTexture · własne shadery URP · raycasting |
| 3 | Generator lochów: z seeda, walidowany, przetestowany | Algorytmy grafowe · determinizm · testy jednostkowe |
| 4 | AI przeciwników: zmysły składane z komponentów i budżet aktualizacji zależny od odległości | Kompozycja · interfejsy · budżet aktualizacji AI |

#### 1. Pathfinding A* o przewidywalnym koszcie na klatkę

**Problem:** Przeciwnicy gonią gracza po wygenerowanym lochu, czyli po siatce 40 000 komórek (200×200), a żadne pojedyncze wyszukiwanie ścieżki nie może powodować przycięć. Najgorszy przypadek to cel nieosiągalny: zwykły A* przeszukuje wtedy całą mapę, zanim uzna, że ścieżki nie ma.

**Jak działa:** Collidery poziomu są próbkowane do płaskiej siatki, która dla każdego pola zapisuje, czy da się po nim przejść; po zniszczeniu przeszkody siatka jest aktualizowana lokalnie. Flood fill dzieli ją na spójne regiony, więc nieosiągalny cel odpada w O(1), zanim wyszukiwanie w ogóle ruszy. Wyszukiwanie korzysta z kopca binarnego, czyli kolejki priorytetowej, która zwraca najtańszy węzeł w O(log n). Bufory są używane ponownie między wyszukiwaniami, a zamiast je czyścić, unieważnia się je numerem wersji nadawanym każdemu wyszukiwaniu. Liczba odwiedzonych węzłów ma limit, a po jego przekroczeniu zwracana jest najlepsza częściowa ścieżka, więc gra się nie zawiesza.

**Co to pokazuje:** Przerobienie algorytmu z podręcznika na taki, którego koszt na klatkę jest ograniczony, przy czym przygotowanie zależy od przeszukanego obszaru, a nie od rozmiaru mapy. Ruch jest wymiennym komponentem-strategią za wąskimi interfejsami, więc logika przeciwnika nie zależy od pathfindera, a A* można zastąpić prostym ruchem bezpośrednim.

**Kod:** [`Assets/Scripts/Pathfinding`](https://github.com/dbarans/engineering-project/tree/main/Assets/Scripts/Pathfinding)

Materiał: fragment kodu: `AStarPathfinder.FindPath(...)`, linie ~94–196 wg inwentarza. W jednej metodzie widać całe podejście: wczesne odrzucenie celu przez id regionu, pętlę na kopcu, budżet węzłów i zwrot najlepszej częściowej ścieżki. Warto przyciąć do tych czterech miejsc.

#### 2. System widoczności: maska światła renderowana przez drugą kamerę i własne shadery

**Problem:** Wszystko poza linią wzroku gracza, łącznie z przeciwnikami, musi być ukryte, a światło z kilku źródeł (stożek widzenia gracza, lampy) ma się płynnie łączyć. Wcześniejsza wersja opierała się na stencil buforze, który przechowuje dla każdego piksela prostą flagę widoczne/niewidoczne. Sprite'y urywały się ostro na granicy światła, a dwa światła nie łączyły się płynnie.

**Jak działa:** Stożek widzenia gracza i każda lampa korzystają z jednego wspólnego buildera meshy. Tam, gdzie sąsiednie promienie trafiają w różne powierzchnie, wyszukiwanie binarne między nimi znajduje dokładną krawędź, więc kontury pozostają ostre bez dokładania promieni. Blending typu max sprawia, że nakładające się światła dają jaśniejszą z dwóch wartości, zamiast się sumować. Maska trzyma poziom światła w kanale alfa, a jego kolor w RGB, więc jedna tekstura jednocześnie przyciemnia i barwi scenę, a shadery sprite'ów ukrywają wszystko, do czego nie dociera żadne światło.

**Co to pokazuje:** Pracę z renderowaniem w Unity poza gotowymi komponentami: dodatkowa kamera, warstwy renderowania, RenderTexture, tryby blendingu i własne shadery URP, a także wymianę architektury, gdy poprzednia wyczerpała swoje możliwości. Do tego profilowanie. Stożek rzucał kiedyś pełne koło promieni w pełnej gęstości tylko po to, żeby narysować mały krąg widzenia wokół gracza. Rzadsze próbkowanie tego kręgu, razem z innymi poprawkami z tej samej serii, w tym ponownym użyciem buforów A* między wyszukiwaniami, skróciło klatkę z ~30 ms do ~12 ms (pomiar w edytorze).

**Kod:** [`Assets/Scripts/Vision`](https://github.com/dbarans/engineering-project/tree/main/Assets/Scripts/Vision), [`Assets/Shaders`](https://github.com/dbarans/engineering-project/tree/main/Assets/Shaders)

Materiał: diagram, pipeline od lewej do prawej, 4 kroki (etykieta główna + dopisek, EN / PL). (1) [Ray fan per light / Wachlarz promieni] + [Edge search → mesh / Szukanie krawędzi → mesh], pod spodem `OcclusionMeshBuilder` (jeden dla gracza i lamp). (2) [Mask camera → RenderTexture / Kamera maski → RenderTexture] + [BlendOp Max: brighter wins / BlendOp Max: jaśniejsze wygrywa], pod spodem warstwa `VisionMask`. (3) [Global `_VisionMask` texture / Globalna tekstura `_VisionMask`]. (4) [Darkness overlay + sprite shaders / Nakładka ciemności + shadery sprite'ów], pod spodem `DarknessOverlay`, `SpriteFovMasked`. Proza nie powtarza tych kroków, tylko wyjaśnia, po co są.

Materiał: nagranie z gry: gracz idzie ciemnym pomieszczeniem z filarami i lampą. Ma być widać stożek widzenia zasłaniany przez przeszkody, sprite'y przeciwników płynnie znikające na granicy światła i dwa nakładające się światła bez widocznego szwu. Pokazywać sam system, nie warianty rozgrywki. Podpis poniżej opisuje dokładnie te trzy rzeczy; jeśli któraś nie trafi do nagrania, podpis trzeba poprawić.

Podpis: Gracz przechodzi przez ciemne pomieszczenie z filarami i lampą: filary przesłaniają stożek widzenia, przeciwnik płynnie znika na granicy światła, a dwa nakładające się światła łączą się bez szwu.

#### 3. Generator lochów: z seeda, walidowany, przetestowany

**Problem:** Każda rozgrywka potrzebuje nowego lochu, który zawsze jest w pełni spójny, bez nieosiągalnych pokoi i bez drzwi prowadzących w skałę. Musi też być powtarzalny: ten sam seed ma dać identyczny loch na każdym komputerze, żeby poziom dało się odtworzyć, debugować i testować na podstawie samego seeda.

**Jak działa:** Generator to pipeline w czystym C#, w osobnym assembly, bez zależności od scen i MonoBehaviour. Rozmieszcza pokoje i łączy je minimalnym drzewem rozpinającym zbudowanym algorytmem Kruskala z Union-Find, co daje najtańszy zestaw korytarzy łączący wszystkie pokoje. Kilka dodatkowych krawędzi tworzy pętle. Potem pipeline wycina pokoje i korytarze, w tym ślepe wnęki w korytarzach, waliduje wynik, a gdy walidacja się nie powiedzie, ponawia próbę z seedem wyprowadzonym z pierwotnego. Deterministyczny generator liczb losowych daje każdemu etapowi osobny, niezależny strumień, więc zmiana jednego etapu nie przetasowuje pozostałych. Analiza grafu znajduje punkty artykulacji (przewężenia), czyli komórki, których zablokowanie rozcięłoby loch na dwie części, więc nie stawia się na nich żadnych obiektów.

**Co to pokazuje:** Zastosowanie algorytmów grafowych do realnego problemu w grze i architekturę przygotowaną do testowania. Generator nie potrzebuje sceny, więc pokrywa go 48 testów jednostkowych EditMode. Wiele z nich sprawdza dziesiątki lub setki seedów; w jednym z testów każdy z 500 losowych seedów musi przejść walidację i dać unikalny układ.

**Kod:** [`Assets/Scripts/Generation/Layout`](https://github.com/dbarans/engineering-project/tree/main/Assets/Scripts/Generation/Layout), testy: [`Assets/Tests/EditMode`](https://github.com/dbarans/engineering-project/tree/main/Assets/Tests/EditMode)

Materiał: fragment kodu: `RoomCorridorGenerator.BuildOnce(...)`, linie ~70–92 wg inwentarza. To 22 linie, które czyta się jak spis treści pipeline'u, a każdy etap dostaje własny strumień losowości (`random.Derive("rooms")`, `"links"`, `"corridors"`…), więc determinizm widać bez tłumaczenia.

#### 4. AI przeciwników: zmysły składane z komponentów i budżet aktualizacji zależny od odległości

**Problem:** W wygenerowanym lochu jest wielu przeciwników. Każdy uruchamia maszynę stanów (patrol, pościg, sprawdzanie tropu) i kilka razy na sekundę pełne wyszukiwanie A*, choć większość z nich jest daleko od gracza. Typy przeciwników różnią się też tym, jak wyczuwają gracza, a dodanie nowego typu nie powinno wymagać zmian we wspólnej klasie bazowej.

**Jak działa:** `EnemyBase` wyszukuje swoje komponenty po interfejsach i nie wie, jakie klasy za nimi stoją. Odpytuje wszystkie podpięte detektory, a każdy z nich może potwierdzić obecność gracza. Słuch to osobny kanał zasilany przez szynę zdarzeń hałasu: usłyszany hałas każe przeciwnikowi sprawdzić miejsce, ale nie oznacza wykrycia, bo to tylko podejrzenie. Strefy aktualizacji z diagramu są liczone od zasięgu zmysłów konkretnego przeciwnika, więc budżet dopasowuje się do jego typu. Losowy rozrzut sprawia, że grupy przeciwników nie aktualizują się w tej samej klatce, a uśpieni przeciwnicy zwalniają zapamiętane ścieżki.

**Co to pokazuje:** Kompozycję zamiast dziedziczenia w praktyce. „Ślepy” typ przeciwnika to podklasa licząca 16 linii, której jedyną realną treścią jest `[RequireComponent(typeof(SoundPlayerDetector))]`: ślepota oznacza po prostu, że jego prefab nie ma `VisionPlayerDetector`. Ten typ doszedł bez żadnych zmian w klasie bazowej. Do tego budżetowanie kosztu AI na dużym poziomie bez pogorszenia reakcji przeciwników w pobliżu gracza.

**Kod:** [`Assets/Scripts/Enemy`](https://github.com/dbarans/engineering-project/tree/main/Assets/Scripts/Enemy)

Materiał: diagram w dwóch częściach; strefy odległości niesie diagram, proza ich nie powtarza. (1) Hub ze szprychami, nie pipeline: w środku [`EnemyBase`: state machine / `EnemyBase`: maszyna stanów], strzałki od środka do każdego komponentu (to `EnemyBase` odpytuje komponenty przez interfejsy). Szprychy: `IPlayerDetector` → `VisionPlayerDetector` [Detection: sight / Wykrycie: wzrok]; `INoiseSensor` → `SoundPlayerDetector`, zasilany z `NoiseEvents` [Hearing: suspicion only / Słuch: tylko podejrzenie]; `IMovementStrategy` → `PathfindingMovement` (A*) albo `SimpleDirectMovement` [Movement: A* or direct / Ruch: A* lub bezpośredni]. Dwie pierwsze szprychy można zgrupować jako [Senses / Zmysły]; ruch stoi osobno, to nie zmysł. Obok mały wariant: ten sam hub bez szprychy wzroku [Blind type: no sight / Typ ślepy: bez wzroku]. (2) Koncentryczne pierścienie wokół gracza, od środka: [Every frame / Co klatkę] z dopiskiem [sensor range + margin / zasięg zmysłów + margines]; [Timed, with jitter / Co interwał, z rozrzutem]; [Parked, path released / Uśpiony, ścieżka zwolniona]. Na granicy parkowania: [Safety floor / Dolny próg bezpieczeństwa] z dopiskiem [never within sensing range / nigdy w zasięgu zmysłów] oraz dwie bliskie linie [Hysteresis: park / wake / Histereza: uśpienie / wybudzenie] (linia wybudzenia nieco wewnątrz linii parkowania).

#### Wnioski

Łączy je jedna zasada: luźne powiązanie przez dane. Generator nic nie wie o pathfindingu, widoczności ani AI. Tworzy układ, z którego powstają collidery czytane zarówno przez siatkę A*, jak i przez promienie światła, oraz listę przewężeń i wnęk w korytarzach, z której korzysta rozmieszczanie przeciwników: zasadzki trafiają do wnęk, a strażnicy stają obok przewężenia, nigdy na nim. AI z kolei sięga do pathfindingu wyłącznie przez wąskie interfejsy, więc systemy współpracują, nie zależąc nawzajem od swojego kodu.
