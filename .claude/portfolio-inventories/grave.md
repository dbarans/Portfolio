# Inwentarz techniczny — projekt „Grave” (`C:\Projects\Unity\engineering-project`)

Źródło: project-extractor, 2026-09-25. Zakres (decyzja właściciela — tylko to, co sam zrobił): **Pathfinding A\***, **Stożek widzenia / FOV**, **Proceduralne generowanie lochu** — wraz z bezpośrednią infrastrukturą. Pozostałe systemy gry (walka, ekwipunek, audio, UI) pominięte poza jednozdaniowymi punktami integracji i NIE mogą trafić do case study.

---

## OBSZAR 1 — Pathfinding A*

### PathfindingGrid — siatka nawigacyjna (struktura danych)
- **Co robi:** Buduje i utrzymuje 2D siatkę walkability nad wygenerowanym (lub ręcznym) poziomem, próbkując fizykę (`Physics2D.OverlapCircle`) w każdej komórce. Dodatkowo etykietuje spójne regiony (flood fill), co pozwala w O(1) odrzucić nieosiągalny cel bez uruchamiania wyszukiwania.
- **Implementacja:** Walkability trzymane jako płaski `bool[]` indeksowany `y*width+x` zamiast `Node[,]` — komentarz w kodzie tłumaczy to jako optymalizację pamięci/cache dla siatki 500×500 (250 000 komórek, ~10 MB oszczędności). `Node` budowany na żądanie (`GetNode`) tylko dla wywołań zewnętrznych. Region-id liczony przez BFS (`BuildRegions`). `[ExecuteAlways]` jest „load-bearing” — siatka musi istnieć w trybie edycji dla zapieczonej sceny.
- **Typ:** architektura ogólna (warstwa danych nawigacyjnych).
- **Pliki/klasy:** `Assets/Scripts/Pathfinding/PathfindingGrid.cs` (`PathfindingGrid` + `Node`).
- **Kluczowe miejsca w kodzie:**
  - `PathfindingGrid.RefreshArea(Bounds)` (~153–183) — częściowy re-sampling siatki po zniszczeniu/przesunięciu przeszkody, z pełnym re-labelowaniem regionów (jedna otwarta komórka może połączyć dwa regiony).
  - `PathfindingGrid.OnDrawGizmos()` (~380–419) — gizmo z limitem `maxGizmoCells` i próbkowaniem po stride, osobno dla komórek blokowanych i wolnych (opisany bug: stride na płaskiej tablicy row-major potrafił „wymazać” ściany przy pewnych podzielnikach szerokości).
- **Wizualny/strukturalny:** strukturalny — diagram (siatka + region-id) lub gizmo-screenshot z edytora.
- **Testy:** brak dedykowanych (zależny od `Physics2D`).

### AStarPathfinder — algorytm A* (rdzeń)
- **Co robi:** Statyczny, bezstanowy pathfinder 8-kierunkowy nad `PathfindingGrid`, z kosztem proporcjonalnym do przeszukanego obszaru, nie do rozmiaru mapy.
- **Implementacja:** Binarny kopiec min (open set) zamiast listy liniowej — O(log n) zamiast O(n) przy zdejmowaniu najlepszego węzła. Bufory (`GScore`, `Parent`, `Stamp`, `Closed`, kopiec) cache'owane per-siatka przez `ConditionalWeakTable<PathfindingGrid, Scratch>` i czyszczone przez „version stamping” (per-search id) zamiast zerowania całej tablicy — koszt setupu O(explored), nie O(width*height). Heurystyka: odległość oktalna z tie-breakiem (`HeuristicTieBreak = 1.001f`), żeby rozbić plateau równych kosztów. Budżet węzłów (`DefaultMaxExploredNodes = 4000`) — po przekroczeniu zwracana najlepsza częściowa ścieżka zamiast zawieszenia klatki. Przekątne wymagają wolnych obu sąsiadów ortogonalnych (brak cięcia rogów).
- **Typ:** mechanika gameplayowa (silnik ruchu AI), z inżynierskim, wydajnościowym podejściem.
- **Pliki/klasy:** `Assets/Scripts/Pathfinding/AStarPathfinder.cs` (statyczna klasa + `Scratch`, prywatny kopiec).
- **Kluczowe miejsca w kodzie:**
  - `AStarPathfinder.FindPath(...)` (~94–196) — wczesne odrzucenie przez region-id, pętla z kopcem, budżet węzłów, zwrot najlepszej częściowej trasy.
  - `HeapPush`/`HeapPop`/`Swap` (~268–320) — ręczny kopiec binarny z duplikatami filtrowanymi przez `Closed` zamiast decrease-key.
- **Wizualny/strukturalny:** strukturalny (diagram open/closed set, kopiec, budżet); trasa widoczna w grze przez gizmo (`PathfindingMovement.OnDrawGizmos`).
- **Testy:** brak bezpośrednich; pośrednio testy generatora sprawdzają pełną osiągalność siatki.

### PathfindingMovement — integracja ruchu AI z A*
- **Co robi:** `IMovementStrategy` używana przez wrogów: re-path co `repathInterval`, śledzenie waypointów, cooldown po nieudanym wyszukiwaniu (nieosiągalny cel nie zabija FPS), zwalnianie bufora ścieżki (`ReleaseCachedPath`) gdy wróg jest uśpiony daleko od gracza.
- **Implementacja:** Kompozycja przez interfejsy (`IMovementStrategy`, `IPathStatusProvider`, `IMovementArrivalTolerance`, `IWalkabilityProbe`) zamiast dziedziczenia — strategia ruchu jako komponent, wymienna z `SimpleDirectMovement`.
- **Typ:** mechanika gameplayowa / punkt integracji AI↔A*.
- **Pliki/klasy:** `Assets/Scripts/Movement/PathfindingMovement.cs`; interfejsy w `Assets/Scripts/Interfaces/`.
- **Kluczowe miejsce:** `PathfindingMovement.Move(Transform, Vector3, float)` (~75–108) — decyzja kiedy re-pathować.
- **Wizualny/strukturalny:** wizualny/dynamiczny (wróg omijający przeszkody, gizmo linii trasy).
- **Integracja:** `EnemyBase` trzyma `IMovementStrategy`/`IPathStatusProvider` (`GetComponent<IMovementStrategy>()`) i odpytuje `HasReachablePath` przy decyzjach AI.

---

## OBSZAR 2 — Stożek widzenia / FOV / maskowanie widoczności

### FieldOfView — stożek widzenia gracza
- **Co robi:** Generuje mesh stożka widzenia gracza metodą raycast-fan, plus opcjonalny „near-vision circle” 360° wokół gracza. Obsługuje zwężanie stożka przy celowaniu (`SetAimNarrowing`) oraz tryb trzymanego źródła światła (szerszy kąt, większy zasięg, barwienie sceny).
- **Implementacja:** Nie renderuje się bezpośrednio na ekran — buduje mesh przez współdzielony `OcclusionMeshBuilder` i rysuje go na warstwie `VisionMask` (`VisionMaskRenderer.CreateLightMeshChild`), materiałem `Custom/VisionMaskWriter`. Adaptacyjna liczba promieni: pełna rozdzielczość (`raysPerDegree`) w stożku, rzadsza (`nearCircleRaysPerDegree`) w kręgu 360° — mniej raycastów bez utraty jakości tam, gdzie gracz patrzy. Kolor/intensywność światła przez `MaterialPropertyBlock` (jeden shared material dla wielu źródeł).
- **Typ:** mechanika gameplayowa (rendering + gameplay).
- **Pliki/klasy:** `Assets/Scripts/Vision/FieldOfView.cs`.
- **Kluczowe miejsca:** `FieldOfView.BuildAngleSweep(...)` (~197–223) — adaptacyjna gęstość promieni; `FieldOfView.IsVisible(Vector2)` (~282–307) — publiczne API widoczności punktu (kąt + zasięg + `Physics2D.Linecast`).
- **Wizualny/strukturalny:** wizualny/dynamiczny — najlepszy kandydat na nagranie z gry.
- **Testy:** brak.

### OcclusionMeshBuilder — wspólny generator siatki widoczności
- **Co robi:** Rzuca jeden promień na kąt, wykrywa krawędzie sylwetek przeszkód metodą binarnego wyszukiwania (edge refinement) i składa triangle fan z UV kodującym znormalizowaną odległość i flagę regionu (miękkość krawędzi).
- **Implementacja:** Reużywany przez `FieldOfView` (gracz) i `StationaryLightSource` (lampy) — raycasting, refinement krawędzi i budowa mesha istnieją raz. Bufory reużywane między klatkami (brak alokacji per-frame).
- **Typ:** architektura ogólna — techniczne serce mechaniki FOV.
- **Pliki/klasy:** `Assets/Scripts/Vision/OcclusionMeshBuilder.cs`.
- **Kluczowe miejsce:** `OcclusionMeshBuilder.FindEdge(ViewCastInfo, ViewCastInfo)` (~150–176) — binarne wyszukiwanie krawędzi sylwetki (ostry kontur mimo skończonej liczby promieni).
- **Wizualny/strukturalny:** strukturalny — diagram promieni + refinement krawędzi.
- **Testy:** brak.

### VisionMaskRenderer — pipeline renderowania maski widoczności
- **Co robi:** Renderuje wszystkie źródła światła (stożek gracza + lampy) do jednej offscreen maski (`RenderTexture`) i publikuje ją jako globalną teksturę `_VisionMask`, konsumowaną przez overlay ciemności i maskowane sprite'y.
- **Implementacja:** Dedykowana „mask camera” jako dziecko głównej kamery, culling mask tylko warstwa `VisionMask`, `BlendOp Max` przy łączeniu świateł (nachodzące światła biorą jaśniejszy wkład). Tekstura ARGB32 — alfa = poziom oświetlenia, RGB = kolor światła, więc jeden przebieg barwi scenę bez drugiego passu oświetleniowego. Rozdzielczość maski skalowalna (`resolutionScale`) niezależnie od ekranu.
- **Typ:** architektura ogólna (custom lighting layer poza standardowym URP 2D Light).
- **Pliki/klasy:** `Assets/Scripts/Vision/VisionMaskRenderer.cs`.
- **Kluczowe miejsce:** `CreateMaskCamera(int layer)` + `EnsureMaskTexture()` (~92–173) — druga kamera renderująca tylko warstwę `VisionMask` do RT, `depth = mainCamera.depth - 1`.
- **Wizualny/strukturalny:** strukturalny/architektoniczny — diagram pipeline'u (dwie kamery → RT → shader).
- **Testy:** brak.

### Shadery i infrastruktura maski widoczności
- **Co robi:** Shadery URP realizujące custom lighting 2D bez `Light2D`: zapis maski (`VisionMaskWriter`), przyciemnianie sceny (`DarknessOverlay`), maskowanie sprite'ów (`SpriteFovMasked`), wspólny include (`VisionMask.hlsl`).
- **Implementacja:** `VisionMaskWriter.shader` — `BlendOp Max`, `Blend One One`, alfa = widoczność (smoothstep na krawędzi), RGB = kolor światła. `DarknessOverlay.shader` — pełnoekranowy quad z premultiplied-alpha (`Blend One OneMinusSrcAlpha`), przyciemnia przez alfę i dokłada kolor przez RGB po odjęciu neutralnej szarości (`min(r,g,b)`), żeby zwykły wzrok nic nie barwił. `SpriteFovMasked.shader` — sprite'y czytają maskę w screen-space i zerują alfę tam, gdzie nic nie dociera.
- **Typ:** infrastruktura renderowania (custom shader pipeline).
- **Pliki/klasy:** `Assets/Shaders/VisionMaskWriter.shader`, `DarknessOverlay.shader`, `SpriteFovMasked.shader`, `VisionMask.hlsl`.
- **Kluczowe miejsce:** `DarknessOverlay.shader::Frag` (~66–78) — `half neutral = min(light.r,min(light.g,light.b)); half3 tint = saturate((light.rgb-neutral)*_TintStrength);`.
- **Wizualny/strukturalny:** wizualny — nagranie przejścia przez ciemny korytarz.
- **Testy:** brak.

### DarknessOverlayQuad i FovMaskedSpriteRuntime — komponenty spinające
- `DarknessOverlayQuad` — czarny quad podążający za kamerą z materiałem `DarknessOverlay`. `FovMaskedSpriteRuntime` — przy starcie podmienia materiał sprite'a z wersji „widocznej w edytorze” na „maskowaną w grze”, żeby Scene View i miniaturki renderowały obiekty normalnie.
- Pliki: `Assets/Scripts/Vision/DarknessOverlayQuad.cs`, `FovMaskedSpriteRuntime.cs`.

### StationaryLightSource i HeldTorch — źródła światła zasilające maskę
- `StationaryLightSource` — stacjonarna lampa wycinająca krąg światła (współdzieli `OcclusionMeshBuilder` i `VisionMaskRenderer`); obiekty w jej zasięgu widoczne poza stożkiem gracza. `HeldTorch` — co klatkę woła `FieldOfView.SetHeldLight(...)`.
- Kompozycja przez opcjonalne `ILightIntensity`/`ILightFuel` (migotanie, paliwo) bez znajomości implementacji.
- Pliki: `Assets/Scripts/Light/StationaryLightSource.cs`, `HeldTorch.cs`, `Assets/Scripts/Interfaces/ILightIntensity.cs`, `ILightFuel.cs`.
- Wizualny/dynamiczny.

### VisionPlayerDetector — wykrywanie gracza przez wroga
- **Co robi:** Wykrywa gracza w zasięgu, w stożku kąta widzenia wroga i bez przeszkód na linii wzroku (`Physics2D.Linecast`). Odrębny, prostszy stożek — bez mesha, tylko logiczna detekcja.
- **Implementacja:** Kąt patrzenia podąża za `IFacingProvider` albo za kierunkiem ruchu AI z ograniczoną prędkością obrotu (`Mathf.MoveTowardsAngle`). Gizmo stożka sterowane `GizmoDebugSettings`.
- **Pliki/klasy:** `Assets/Scripts/Enemy/VisionPlayerDetector.cs`; `IFacingProvider.cs`; `GizmoDebugSettings.cs`.
- **Kluczowe miejsce:** `IsPlayerDetected(Transform)` (~66–87).
- **Integracja:** `EnemyBase` odpytuje `IPlayerDetector[]` (m.in. `VisionPlayerDetector`, `SoundPlayerDetector`) co klatkę.

### Ewolucja architektoniczna
Kod i `ENEMY_NOTES.md` dokumentują, że wcześniejsza wersja maskowania (`GU-0036`) używała twardego stencila (`FovStencilPrepass.shader`, `Stencil { Comp Equal }`) — widoczność 0/1, twarde urwanie sprite'ów na granicy światła, brak płynnego łączenia dwóch świateł. Obecna architektura (`VisionMaskRenderer` + `BlendOp Max` + ciągła maska alfa) jest jej następcą, opisanym w komentarzu `VisionMaskRenderer.cs`.

---

## OBSZAR 3 — Proceduralne generowanie lochu

### Architektura assembly `Grave.Generation.Layout` (fundament)
- **Co robi:** Cały algorytm layoutu (pokoje, korytarze, kształty, widoczność, metryki) żyje w osobnym assembly, bez referencji do reszty projektu, bez `MonoBehaviour` i bez dostępu do sceny — tylko `Vector2Int`/`RectInt`/`Mathf`.
- **Implementacja:** `Grave.Generation.Layout.asmdef` (`references: []`) — pozwala uruchamiać generator w testach EditMode i (wg `GENERATION_NOTES.md`) skompilować go do konsolowego `net8.0` odwołującego się tylko do `UnityEngine.CoreModule.dll`, żeby mierzyć 500 seedów bez uruchamiania Unity.
- **Typ:** architektura ogólna (separacja assembly).
- **Wizualny/strukturalny:** strukturalny — diagram granic assembly (Layout ↔ Assembly-CSharp ↔ Tests).

### DungeonLayout, Room, RoomLink — struktury danych wyjściowych
- **Co robi:** Model wygenerowanego lochu: siatka `CellType[,]`, lista `Room` (zbiór komórek, nie prostokąt), `RoomLink`, alkowy, chokepointy, komórka wyjścia.
- **Implementacja:** `Room` przechowuje realny kształt (`Cells`) — pozwala na L-kształty, pierścienie, jaskinie; `Center` to medoid (najbliższa środkowi realna komórka), nie środek bounding-boxa (który dla L-kształtu ląduje w skale). `ContentHash()` — stabilny FNV-1a hash siatki dla testów determinizmu. `ToAscii()` — debug-dump poziomu jako tekst.
- **Pliki/klasy:** `Assets/Scripts/Generation/Layout/DungeonLayout.cs`.
- **Kluczowe miejsce:** `Room.ComputeMedoid(List<Vector2Int>)` (~251–281).
- **Wizualny/strukturalny:** strukturalny.

### LayoutParams / DungeonGenerationSettings — konfiguracja (ScriptableObject)
- `LayoutParams` (struct, wejście testowalne) + `DungeonGenerationSettings` (ScriptableObject, warstwa autorska) konwertowany przez `ToParams()`. `LayoutParams.Sanitized()` wymusza spójność wartości raz, na wejściu do pipeline'u; `OnValidate()` robi to samo w inspektorze.
- Pliki: `LayoutParams.cs`, `DungeonGenerationSettings.cs`, asset `Assets/Generation/DungeonGenerationSettings.asset`.

### DeterministicRandom — deterministyczny PRNG
- **Co robi:** Odtwarzalny strumień losowości: ten sam seed = identyczny loch na dowolnej maszynie (zapis gry trzyma tylko seed, nie mapę).
- **Implementacja:** Hash seeda FNV-1a (stabilny, w przeciwieństwie do `string.GetHashCode()`), xorshift128, odrzucenie pierwszych 8 wyników (krótkie seedy nie dają skorelowanych strumieni). `Derive(salt)` — niezależny pod-strumień dla każdego etapu pipeline'u (`rooms`, `links`, `corridors`, `interiors`...), więc zmiana liczby losowań w jednym etapie nie przesuwa kolejnych. Bezalokacyjny `Hash(seed,x,y)` do losowości pozycyjnej z finalnym „avalanche” (bez ukośnych pasków w wariantach kafelków).
- **Pliki/klasy:** `Assets/Scripts/Generation/Layout/DeterministicRandom.cs`.
- **Kluczowe miejsce:** `Range(int,int)` (~108–117) — rejection sampling zamiast modulo (brak obciążenia rozkładu).
- **Testy:** `DeterministicRandomTests.cs` — 9 testów (identyczność strumieni, brak kolizji na 2000 krótkich seedach, niezależność `Derive`, granice `Range`, brak obciążenia rozkładu na 60 000 losowań, `Shuffle` jako permutacja).

### RoomCorridorGenerator — główny pipeline generacji (orkiestrator)
- **Co robi:** Algorytm „rooms & corridors z pętlami”: rozmieszczenie pokoi (rejection sampling), rezerwacja centralnego huba, MST Kruskala nad odległościami środków pokoi + część odrzuconych krawędzi jako pętle, przycinanie liczby korytarzy do huba, przypisanie ról pokoi (Hub/Normal/Treasure/Exit), wybór drzwi wyjściowych prowadzących na zewnątrz mapy, klucz w najdalszym zamkniętym skarbcu, walidacja (min. liczba pokoi + pełna osiągalność) z retry na nowym, wyprowadzonym seedzie.
- **Implementacja:** Union-Find z kompresją ścieżek i union-by-size; sortowanie krawędzi ze stabilnym tie-breakiem (`List.Sort` nie łamie determinizmu); przycinanie korytarzy huba sprawdza faktyczną spójność grafu po każdym odrzuceniu (`StaysConnected`). Drzwi wyjściowe wybierane po **najdłuższym nieprzerwanym odcinku ściany** — eksperyment na 200 seedach: pierwsza wersja dawała drzwi w rogu na 4 seedach, druga — 0.
- **Pliki/klasy:** `Assets/Scripts/Generation/Layout/RoomCorridorGenerator.cs` (~1180 linii, z prywatnym `UnionFind`).
- **Kluczowe miejsca:** `BuildOnce(...)` (~70–92) — cały pipeline: placement → links → carve rooms → outline detail → carve corridors → normalize doorways → assign roles → decorate interiors → detect chokepoints; `FindExitDoorway(...)` (~820–875).
- **Wizualny/strukturalny:** strukturalny — diagram pipeline'u (7+ etapów).
- **Testy:** `RoomCorridorGeneratorTests.cs` — 30 testów: determinizm, różne seedy → różne layouty, pełna osiągalność ze spawnu, granica mapy lita, brak nakładania pokoi, liczba pokoi w zakresie, dokładnie jeden Hub (200 seedów), drzwi zawsze przejezdne po obu stronach (sweep 40 seedów — bug występował na ~1/14 drzwi), 500 losowych seedów przechodzi walidację z unikalnymi hashami, degradacja zamiast crasha przy niemożliwych ustawieniach, reguły ról/skarbców/klucza itd.

### RoomShaper — kształtowanie pokoi i detal obrysu
- **Co robi:** Zamienia prostokątną działkę w realny kształt: L, T, pierścień wokół litego rdzenia, jaskinia (automat komórkowy), plus „perimeter notches” (fazowanie rogów, wnęki na długich ścianach).
- **Implementacja:** Wagi kształtów zależne od rozmiaru działki. `Cavern` — automat komórkowy 4-5, 4 przebiegi wygładzania, redukcja do największej spójnej składowej (wygładzanie zostawia odizolowane kieszenie). `PerimeterNotches` zwraca komórki do zamurowania, nie do wycięcia z `Room.Cells` — bug pierwszej wersji: każde wcięcie rejestrowało się jako osobne drzwi (zmierzone 47.6→65.3 drzwi/mapę).
- **Pliki/klasy:** `Assets/Scripts/Generation/Layout/RoomShaper.cs`.
- **Kluczowe miejsce:** `CarveCavern(...)` + `Smooth(...)` (~174–233).
- **Wizualny/strukturalny:** oba.

### CorridorCarver — rzeźbienie korytarzy
- **Co robi:** Korytarz między centrami pokoi: jeden lub dwa zakręty (Z zamiast L — nie da się go zobaczyć „na wylot”), zmienna szerokość (zwężenia na końcach i zakrętach, poszerzenia w segmentach 4–9 komórek), ślepe alkowy przy bokach.
- **Implementacja:** Trasa jako lista waypointów; kolizja ze strefą ochronną huba → ponowne losowanie (do 6 prób) zamiast routowania wokół. Alkowy sprawdzają `OpensOntoSomethingElse` (inaczej alkowa staje się skrótem).
- **Pliki/klasy:** `Assets/Scripts/Generation/Layout/CorridorCarver.cs`.
- **Kluczowe miejsce:** `CarveRun(...)` (~229–263).
- **Wizualny/strukturalny:** wizualny.

### DoorwayNormalizer — normalizacja szerokości przejść
- **Co robi:** Naprawia niedopasowanie korytarza o szerokości 1–3 do jednokomórkowego prefabu drzwi: zamurowuje nadmiar, komórki przy drzwiach → `Pillar` (futryny).
- **Implementacja:** Grupuje komórki graniczne w „clumpy”, odrzuca przejścia owijające róg, i **sprawdza przez `CountReachable`/`CountWalkable`, czy zamurowanie nie rozcina lochu**, cofając zmianę jeśli tak. Udokumentowany bug: korytarz biegnący wzdłuż ściany zwężany jak prawdziwe przejście zostawiał drzwi otwierające się w skałę.
- **Pliki/klasy:** `Assets/Scripts/Generation/Layout/DoorwayNormalizer.cs`.
- **Kluczowe miejsce:** `NarrowOpening(...)` (~125–197).
- **Testy:** `EveryDoorwayHasOpenGroundOnBothSides` (40 seedów) i 3 inne w `RoomCorridorGeneratorTests.cs`.

### Chokepoints — punkty artykulacji grafu
- **Co robi:** Znajduje komórki, których usunięcie rozdzieliłoby loch na dwie części. Używane do rozmieszczania wrogów (obok, nigdy na chokepoincie) i zakazu blokowania ich rekwizytami.
- **Implementacja:** Hopcroft-Tarjan (punkty artykulacji), **iteracyjny z jawnym stosem**, bo rekurencja przepełnia stos na mapie 96×96+.
- **Pliki/klasy:** `Assets/Scripts/Generation/Layout/Chokepoints.cs`.
- **Kluczowe miejsce:** `Chokepoints.Walk(...)` (~82–134).
- **Wizualny/strukturalny:** strukturalny.

### VisibilityAnalysis — pomiar widoczności pokoi (shadowcasting)
- **Co robi:** Liczy, jaki procent komórek pokoju widać z danego punktu (np. z progu) — zamienia „pokoju nie powinno się dać ogarnąć jednym rzutem oka” w testowalną liczbę.
- **Implementacja:** Rekurencyjne symetryczne shadowcasting po czterech ćwiartkach (jeśli A widzi B, to B widzi A). Na abstrakcyjnej siatce (nie raycastami), bo assembly Layout jest silnikowo-wolne i wołane tysiące razy na loch, zanim istnieje jakikolwiek collider.
- **Pliki/klasy:** `Assets/Scripts/Generation/Layout/VisibilityAnalysis.cs`.
- **Kluczowe miejsce:** `Scan(...)` (~124–171).

### RoomInteriorDecorator — feedback-loop dekoracji wnętrz
- **Co robi:** Wypełnia wnętrze pokoju strukturą blokującą wzrok (kolumnada, przepierzenia, wyspa, gruzy), **mierząc widoczność po każdej partii** (`VisibilityAnalysis`) i zatrzymując się, gdy pokój spadnie poniżej progu skalowanego rozmiarem — zamiast rozrzucać stałą liczbę przeszkód.
- **Implementacja:** Cztery wzorce (`InteriorPattern`); `Apply(...)` po każdej partii sprawdza spójność (`RoomStaysWhole`) i wycofuje partię, jeśli odcięła podłogę. `ClearPassagePlugs` naprawia filar „zatykający” jednokomórkowy korytarz (spójność zachowana inną drogą) — zmierzone: 1948 takich komórek na 200 seedach przed poprawką.
- **Pliki/klasy:** `Assets/Scripts/Generation/Layout/RoomInteriorDecorator.cs`.
- **Kluczowe miejsce:** `DecorateRoom(...)` (~100–118) — pętla propose → measure → stop early; `PlugsPassage(...)` (~376–385).
- **Wizualny/strukturalny:** wizualny (przed/po).
- **Liczby (`GENERATION_NOTES.md`, 500 seedów):** `interiorDensity` 0→1: widoczność średnia 0.887→0.693, najgorsza 0.609→0.364.

### DungeonMetrics — pomiary/statystyki layoutu
- **Co robi:** Liczby opisujące loch (pokoje/korytarze/pętle, ślepe zaułki, % otwartej podłogi, głębokość od huba, udział pokoi z alternatywną drogą, widoczność średnia/najgorsza) — żeby „ten loch jest lepszy” było sprawdzalne.
- **Implementacja:** `CountRoomsWithTwoRoutes` liczy mosty grafu pokoi (Tarjan, iteracyjny) i floodfilluje dwuspójną składową huba. `ToReport()` — raport tekstowy.
- **Pliki/klasy:** `Assets/Scripts/Generation/Layout/DungeonMetrics.cs`.
- **Kluczowe miejsce:** `FindBridges(...)` (~275–333).
- **Testy:** `DungeonMetricsTests.cs` — 9 testów.

### Testy jednostkowe generatora — podsumowanie
- **48 testów** w `Grave.Generation.Layout.Tests` (30 generator, 9 PRNG, 9 metryki), EditMode/NUnit, asmdef referencjonuje tylko `Grave.Generation.Layout` + TestRunner. Wiele testów iteruje po dziesiątkach–setkach seedów (500 w `ManySeedsAllPassValidation`, 200 w `EverySeedProducesExactlyOneHub`) — statystyczne pokrycie, nie tylko punktowe asercje.

### DungeonLayoutPreviewWindow — narzędzie edytorowe
- Okno `Tools/Dungeon/Layout Preview`: generuje loch z seeda i pokazuje ASCII-dump + raport metryk bez dotykania sceny; tryb wsadowy dla N seedów (min/max pokoi, śr. korytarze, retry rate, failure rate, czas na loch).
- Plik: `Assets/Scripts/Editor/DungeonLayoutPreviewWindow.cs`; `MeasureBatch()` (~93–121).
- Dobre do zrzutu ekranu.

### Punkt integracji: DungeonBuilder
`DungeonBuilder` (`Assets/Scripts/Generation/DungeonBuilder.cs`) generuje `DungeonLayout`, maluje go (`DungeonPainter.Paint`), odpala zdarzenie `Built` (subskrybuje `DungeonPopulator`), i **dopiero na końcu** `PathfindingGrid.Configure(...)` — kolejność krytyczna, bo siatka próbkuje fizykę po tym, jak istnieją wszystkie collidery. To jedyne miejsce, gdzie generacja, pathfinding i (pośrednio, przez ściany blokujące raycasty) widoczność się łączą.

---

## Stack i liczby

- **Silnik:** Unity `6000.3.8f1` (Unity 6).
- **Render pipeline:** URP `17.3.0`, profil 2D — system widoczności jest custom (własne shadery + RenderTexture), **nie** korzysta z URP `Light2D`.
- **Test framework:** `com.unity.test-framework 1.6.0` (NUnit, EditMode) — jedyny konsument to testy generatora.
- **Brak** Jobs/Burst/ECS w tych trzech obszarach — czysty, jednowątkowy C#.
- **Siatka A*:** komentarze odnoszą się do worst-case 500×500; shipped asset: **200×200 = 40 000 komórek**, 30 docelowych pokoi (min. 16), budżet A* `DefaultMaxExploredNodes = 4000`.
- **Testy generatora:** 48, część po 20–500 seedów.
- **`GENERATION_NOTES.md` (deklarowane przez autora):** 500 seedów bez błędów walidacji; `interiorDensity` 0→1: średnia widoczność 0.887→0.693; `PathfindingGrid.BuildGrid` — jednorazowe ~40 000 zapytań `OverlapCircle` dla 200×200.
- Brak zrzutów profilera dla tych obszarów.

---

## Podsumowanie

Wszystkie trzy obszary zbudowane wokół zasady: **abstrakcyjny model danych oddzielony od reprezentacji scenicznej**. `Grave.Generation.Layout` to osobne, silnikowo-nagie assembly produkujące `DungeonLayout` deterministycznym C# — jedyny z trzech obszarów z prawdziwym pokryciem testami (48) i uruchamialny poza edytorem. Ten sam layout jest czytany niezależnie przez dwa pozostałe systemy przez wspólną konwencję warstw fizyki: `PathfindingGrid` próbkuje `OverlapCircle` po colliderach namalowanych z layoutu, a `FieldOfView`/`OcclusionMeshBuilder` rzucają `Raycast`/`Linecast` po tych samych colliderach — generator nie wie nic o A* ani FOV, a jego ściany blokują oba automatycznie (decyzja D1 z `GENERATION_NOTES.md`). Pathfinding i wizja mają rdzeń-algorytm bez zależności od gry (`AStarPathfinder` ze scratch-buforami; `OcclusionMeshBuilder` jako współdzielony generator mesha) i cienką warstwę integracyjną przez interfejsy. System wizji ewoluował z twardego stencila na ciągłą maskę alfa z `BlendOp Max`. Punkt spięcia na poziomie sceny: `DungeonBuilder` z udokumentowaną kolejnością (layout → paint → populate → `PathfindingGrid.Configure`).
