# Inwentarz techniczny — Game of Life (Unity)

Źródło: project-extractor, 2026-09-25. Ścieżka projektu: `C:\Projects\Unity\GameOfLife`. Surowy przegląd — bez filtrowania pod kątem "co jest ciekawe". Dla każdego systemu podane źródło w kodzie; gdzie dokumentacja (`CLAUDE.md`, `AI_CONTEXT.md`, `PERFORMANCE.md`, `HASHLIFE_PLAN.md`, `MONETIZATION.md`, `SESSION_HANDOFF.md`) opisuje coś zweryfikowanego w źródłach, jest to zaznaczone; gdzie opisuje coś planowanego/nieukończonego, też.

---

### 1. Rdzeń symulacji Conway'a — bitmaskowy silnik z aktywną pamięcią podręczną kafli
- Co robi: Liczy kolejne generacje Game of Life. Zamiast operować na pojedynczych komórkach, dzieli nieskończoną planszę na kafle 64×64, pakuje wiersze w `ulong` (bitmaski) i liczy sąsiadów bit-równolegle dla całych 64 kolumn naraz.
- Implementacja: `BitmaskGenerationSolver.Step()` wyznacza zbiór kandydatów jako pierścień wokół kafli zmienionych w poprzednim kroku (`_lastChanged`) — krok kosztuje O(aktywnych kafli), nie O(całej populacji). Silnik trzyma stan we własnej natywnej pamięci (`NativeParallelHashMap<long,int>` + `NativeList<ulong>`), a matematyka (sąsiedztwo, "halo" 66×66, pełne sumatory bitowe) jest w `BitmaskKernel.cs` jako pięć zadań Burst/Job System: `GatherJob` → `ComputeChunksJob` → `CountDeltaJob` → `WriteDeltaJob` → `ApplyJob`, planowanych jednym wywołaniem `Schedule(count, batchSize)` na krok.
- Typ: mechanika gameplayowa (silnik symulacji) z bardzo mocnym komponentem architektonicznym (bit-parallel + Job System/Burst).
- Pliki/klasy: `Assets\Scripts\BitmaskGenerationSolver.cs`, `Assets\Scripts\BitmaskKernel.cs`, `Assets\Scripts\GenerationManager.cs` (fasada).
- Kluczowe miejsca w kodzie: `BitmaskGenerationSolver.Step()` (linie 336–520, zwłaszcza budowa kandydatów w liniach 351–365 i planowanie jobów w liniach 383–397); `BitmaskKernel.HaloWords` i komentarz o "198 zamiast 576 słów" (linie 23–43) — nietypowa, świadoma optymalizacja pamięciowa.
- Wizualny/strukturalny: strukturalny — najlepiej pokazać diagramem przepływu danych (kandydaci → gather → kernel → count/write → apply) albo krótkim fragmentem kodu z komentarzem o redukcji halo z 576 do 198 słów.
- Nietypowe rozwiązania: ręczny bit-parallel full-adder do liczenia sąsiadów zamiast pętli po bitach; ręczne zarządzanie pulą bloków pamięci (`_freeBlocks`) zamiast alokacji per-generację; batch size dobierany dynamicznie z `JobsUtility.JobWorkerCount`, bo sztywny rozmiar batcha "zjadał" zysk z równoległości na słabszym CPU telefonu (opisane i zmierzone w `MONETIZATION.md`, "Dead ends").

### 2. Warstwa danych żywych komórek — `ChunkedCellSet`
- Co robi: Przechowuje wyświetlany zbiór żywych komórek (nie ten w silniku) jako kafle 64×64 bitmask zamiast płaskiego `HashSet<Vector3Int>`, żeby zapytanie "co jest widoczne w oknie kamery" kosztowało O(widocznych komórek), a nie O(całej populacji).
- Implementacja: `Dictionary<long, Chunk>` + pula (`Stack<Chunk>`) na kafle zwalniane przy opuszczaniu przez wędrujący wzorzec (np. "puffer"), jednoelementowy cache ostatnio użytego kafla, oraz `CopyWindowTo`/`ClearWindow`/`CountWindow`, które same wybierają tańszą strategię (przeszukać komórki okna vs. przejść po zapisanych kaflach).
- Typ: architektura ogólna (warstwa danych).
- Pliki/klasy: `Assets\Scripts\ChunkedCellSet.cs`, interfejs `Assets\Scripts\ILiveCellSource.cs`.
- Kluczowe miejsca: `CopyWindowTo()` (linie 285–319, wybór strategii "spanned <= chunks.Count" w linii 298); `Chunk hint` (linie 113–129) — unikanie powtórnego lookupu w słowniku.
- Wizualny/strukturalny: strukturalny (diagram: warstwa danych + dwie ścieżki zapytań w zależności od poziomu zoomu).
- Nietypowe: zweryfikowane różnicowo poza Unity względem `HashSet<Vector3Int>` na 400 tys. losowych operacji (`PERFORMANCE.md`, sekcja "Resolved — GPS decay...").

### 3. `CellManager` — bufor generacji i dwa tryby wyświetlania
- Co robi: Centralny punkt dostępu do stanu planszy; trzyma pierścieniowy bufor delt generacji (128 slotów), obsługuje odtwarzanie generacja-po-generacji (z animacjami) oraz tryb "direct-apply" dla bardzo dużych prędkości.
- Implementacja: `GenerationDelta { generationNumber, bornCells, diedCells }` w tablicy `BUFFER_SIZE=128`; poniżej progu prędkości główny wątek odtwarza delty jedna po drugiej (animacje, wibracje), powyżej — wątek liczący pisze wprost do `livingCells` przez `ApplyChunkPublication` (kopiuje całe kafle, 512 bajtów naraz, zamiast replaya komórka-po-komórce).
- Typ: architektura ogólna (warstwa symulacji/threading), z elementami mechaniki (animacje narodzin/śmierci sterowane deltą).
- Pliki/klasy: `Assets\Scripts\CellManager.cs`.
- Kluczowe miejsca: definicja `GenerationDelta` i `gridLock`/`lodLock` (linie 31–100); `ApplyChunkPublication` (opisany w `IChunkPublication.cs` i `CLAUDE.md`).
- Wizualny/strukturalny: strukturalny — kandydat na diagram stanów/przepływu (buffered replay vs direct-apply).
- Nietypowe: dwa niezależne locki z wymuszoną kolejnością (`lodLock` zawsze przed `gridLock`) udokumentowane wprost w komentarzu jako reguła, bo złamanie kolejności groziłoby zakleszczeniem/utratą generacji.

### 4. Model współbieżności (ogólna architektura wątkowa)
- Co robi: Cała symulacja liczy się na osobnym wątku w tle (`CalculationThreadLoop`), main thread tylko wyświetla gotowe generacje.
- Implementacja: `gridLock` chroni cały stan planszy; `lodLock` osobno chroni akumulację liczników LOD (rozdzielone po zmierzeniu, że wspólny lock kosztował 2.53ms/generację zamiast 0.92ms). Wątek liczący jest `IsBackground`, zawsze zatrzymywany przez `StopCalculationThread` z `Join(1000)`.
- Typ: architektura ogólna.
- Pliki/klasy: `Assets\Scripts\CellManager.cs`, `Assets\Scripts\GameController.cs` (`CalculationThreadLoop`, `TurboCalculationThreadLoop`).
- Wizualny/strukturalny: strukturalny (diagram wątków: calc thread ↔ main thread, dwa locki, kolejność ich brania).
- Nietypowe: `Interlocked`-owe `long` zamiast `volatile double` do przenoszenia czasów przez granicę wątków (C# nie ma `volatile double`, a "torn read" dałby wynik, którego skok nigdy nie miał — udokumentowane w `CLAUDE.md`, sekcja Turbo Pace).

### 5. Diagnostyka zawieszeń głównego wątku — `MainThreadWatchdog`
- Co robi: Dev-owe narzędzie: osobny wątek wykrywa, że główny wątek przestał kończyć klatki, i loguje, w jakiej "fazie" utknął oraz czy to jest oczekiwanie na lock, czy realna praca.
- Implementacja: `Mark(phase)` zapisuje nazwę fazy (bez alokacji, `volatile string`), `Tick()` bije puls raz na klatkę; wątek watchdog co 500ms sprawdza, czy puls nie jest starszy niż próg (domyślnie 2s), i jeśli tak — loguje `stalledSec`, `gridLockWait`, `calcHoldMs`.
- Typ: narzędzie deweloperskie / diagnostyka (architektura ogólna).
- Pliki/klasy: `Assets\Scripts\MainThreadWatchdog.cs` (cały plik, 99 linii).
- Wizualny/strukturalny: strukturalny.
- Nietypowe: rozróżnia "klatka robi dużo pracy" od "wątek jest zagłodzony na locku" przez osobny licznik czasu oczekiwania na `gridLock`, bo z zewnątrz oba wyglądają identycznie.

### 6. HashLife / "Turbo" — drugi silnik symulacji (quadtree + memoizacja Gospera)
- Co robi: Alternatywny silnik używany tylko w trybie "Turbo" (INF + HashLife włączony w Settings, dev-only). Zamiast liczyć generację po generacji, buduje drzewo czwórkowe (quadtree) węzłów i memoizuje wyniki, dzięki czemu potrafi "skoczyć" o 2^k generacji niemal za darmo dla wzorców okresowych/powtarzalnych.
- Implementacja: `HashLifeNode` (niemutowalne węzły, interning w `HashLifeStore.Join`), `HashLifeSuccessor.Successor(m, jTop)` — rekurencja z dokładnie odtworzoną matematyką Gospera (9 podkwadratów, reguła paddingu `k >= jTop+3`), `HashLifeEngine.Jump()` publikuje nowy `root` jednym zapisem `volatile` (brak locka po stronie czytelników). Kod dokładnie odpowiada specyfikacji z `HASHLIFE_PLAN.md` (część B), łącznie z regułą paddingu i uzasadnieniem bezpieczeństwa.
- Typ: mechanika gameplayowa (tryb wyświetlania/przyspieszenia symulacji), architektonicznie nietypowa (drugi, odrębny silnik za wspólnym interfejsem `ILiveCellSource`).
- Pliki/klasy: `Assets\Scripts\HashLife\HashLifeEngine.cs`, `HashLifeNode.cs`, `HashLifeStore.cs`, `HashLifeSuccessor.cs`, `HashLifeMemory.cs`, `HashLifeAbort.cs`, `HashLifeCellSource.cs`.
- Kluczowe miejsca: `HashLifeEngine.Jump()` (linie 287–319) — pętla paddingu + wywołanie successora + publikacja; `IsPopulationInCentralQuarterSide` (linie 381–388) — dowód poprawności paddingu w jednym miejscu.
- Wizualny/strukturalny: strukturalny (diagram quadtree + rekurencja) — wizualnie w grze wygląda tak samo jak normalny silnik, więc "efekt" jest w liczbach (gen/s), nie w obrazie.
- Nietypowe: najbardziej zaawansowany algorytmicznie element projektu — pełna implementacja Hashlife (Golly-like) z własnym harness'em weryfikacyjnym poza Unity (punkt 25). Status: **w pełni zaimplementowane i zweryfikowane w kodzie**, ale jawnie oznaczone w dokumentacji jako "not yet measured on device for shipping" / dev-only (bramkowane `debugMode`).

### 7. Zarządzanie pamięcią HashLife
- Co robi: HashLife rośnie w węzłach bez ograniczeń — ten system pilnuje budżetu pamięci na urządzeniu i robi "kolekcję" (garbage collection węzłów) zamiast pozwolić systemowi zabić proces.
- Implementacja: `HashLifeMemory` liczy sufit węzłów z procentu RAM urządzenia (`DeviceMemoryShare`: 0.15 poniżej 10GB, 0.27 od 10GB), `HashLifeEngine.Collect()` robi `HashLifeStore.Reintern` (zachowuje memo sukcesorów, jeśli się mieści, inaczej odrzuca), a budżet rośnie, jeśli kolekcje przychodzą częściej niż co 30s.
- Typ: architektura ogólna (zarządzanie zasobami) ściśle powiązana z mechaniką Turbo.
- Pliki/klasy: `Assets\Scripts\HashLife\HashLifeMemory.cs`, `HashLifeEngine.Collect()` (linie 338–376).
- Wizualny/strukturalny: strukturalny.
- Nietypowe: reguła wzrostu budżetu oparta o "jak często", nie "ile przeżyło" — pierwsza wersja (`NodeCount > maxNodes/2`) nigdy się nie uruchamiała, bo re-internowanie jest tak skuteczne, że przeżywa zawsze mała część tabeli (opisane i zmierzone w `HASHLIFE_PLAN.md` B8 i `SESSION_HANDOFF.md`).

### 8. Renderowanie komórek (Tilemap) — `CellRenderer`
- Co robi: Rysuje żywe komórki na `Tilemap`, ograniczone do okna kamery, z animacjami narodzin (skalowanie) i śmierci (zanikanie alfa).
- Implementacja: Renderowanie różnicowe — trzyma zbiór narysowanych komórek (`renderedCells`) i podczas działania symulacji dostaje kolejkę delt (`EnqueueRenderDelta`), więc nigdy nie kopiuje całego zbioru na gorącej ścieżce. Pełne przerysowanie (`FullRedraw`) rysuje okno widoczne + margines 15% i jest throttlowane (`FullRedrawCostBudgetDivisor`), żeby ciągłe pinch-zoom nie kosztowało pełnego czyszczenia co klatkę.
- Typ: mechanika gameplayowa / prezentacyjna (rendering).
- Pliki/klasy: `Assets\Scripts\CellRenderer.cs`.
- Kluczowe miejsca: definicje pól i throttlingu LOD/redraw w liniach 1–80 (histereza `LodExitHysteresis=1.35`, budżety `LodCostBudgetDivisor`); `ApplyPendingRender` (opisany w `PERFORMANCE.md`) — batchowanie `Tilemap.SetTiles`.
- Wizualny/strukturalny: **wizualny/dynamiczny** — to jest to, co gracz faktycznie widzi (animacje narodzin/śmierci, płynność przy zoomie).
- Nietypowe: "drawn window" z marginesem zamiast dosłownego "visible window" — świadoma decyzja przeciw stroboskopowemu przerysowywaniu przy pinch-zoomie (opisana i zmierzona w `CLAUDE.md`, sekcja `CellRenderer`).

### 9. Renderowanie z dużym oddaleniem (LOD) — `CellLodRenderer` + shader
- Co robi: Poniżej progu pikseli-na-komórkę przełącza się z Tilemapy (drogiej per-tile) na jeden quad z teksturą `Alpha8` — komórki rasteryzowane jako gęstość na teksel, żeby duże wzorce (miliony komórek) dało się w ogóle wyrenderować przy dużym oddaleniu.
- Implementacja: `CellLodRenderer.cs` zarządza teksturą (do 2048×2048, więcej dzielone na teksle), fragment shader `CellLod.shader` maluje teksel wg pokrycia (gamma korekcja `CoverageGamma=0.4`, fade szczeliny między komórkami `FillFadeMinPixels/MaxPixels`). Liczniki per-teksel akumuluje `LodMaskAccumulator` (czysta arytmetyka `int[]`, bez hashowania — świadomie, bo `Dictionary<Vector3Int,bool>` "spłaszczał" różnicę FREE/PAID, patrz punkt 19).
- Typ: mechanika gameplayowa / prezentacyjna, z mocnym komponentem wydajnościowym.
- Pliki/klasy: `Assets\Scripts\CellLodRenderer.cs`, `Assets\Shaders\CellLod.shader`, `Assets\Scripts\LodMaskAccumulator.cs`.
- Wizualny/strukturalny: **wizualny/dynamiczny** — kandydat na nagranie (efekt gęstości przy oddalaniu na ogromnym wzorcu, np. Universal Turing Machine z Pattern Booka).
- Nietypowe: automatyczne dostosowanie rozdzielczości maski do RAM urządzenia (`LowMemoryDeviceMB=4096` → grubszy teksel), oraz dwie niezależne ścieżki liczące te same liczby (buforowana vs direct-apply), zweryfikowane jako identyczne przez `Tools/BitmaskVerify`.

### 10. Nakładka siatki — `GridOverlayController` + `GridOverlay.shader`
- Co robi: Opcjonalna, przełączalna siatka na planszy.
- Implementacja: jeden quad podążający za kamerą, linie rysowane proceduralnie we fragment shaderze (`fwidth` dla stałej grubości 1px niezależnie od zoomu, zanikanie przy dużym oddaleniu).
- Typ: mechanika gameplayowa (opcja wizualna), zbudowana jako mini-architektura shaderowa.
- Pliki/klasy: `Assets\Scripts\GridOverlayController.cs`, `Assets\Shaders\GridOverlay.shader`.
- Wizualny/strukturalny: wizualny (1 draw call, stały koszt niezależnie od zoomu).
- Nietypowe: siatka jest wymuszana na "ukryte" podczas samouczka i prezentacji Reguł, sterowane tym samym wzorcem trzech flag (`userEnabled`/`rulesForcingHidden`/`tutorialForcingHidden`), co licznik FPS/GPS (`StatsDisplay`).

### 11. Sterowanie dotykiem i kamerą — `TouchHandler`
- Co robi: Jeden palec rysuje/kasuje komórki, dwa palce panują i zoomują (pinch). Ma tryb ograniczonego rysowania (granice prostokąta, limit liczby komórek) na potrzeby samouczka i Laba.
- Implementacja: prosta maszyna stanów (`TouchState`: Idle/WaitingForSecondTouch/SingleTouch/MultiTouch), zdarzenie `DrawRejected` z powodem odmowy (`DrawRefusal`: poza granicami vs limit komórek) zamiast cichego ignorowania dotyku.
- Typ: mechanika gameplayowa (input).
- Pliki/klasy: `Assets\Scripts\TouchHandler.cs`.
- Kluczowe miejsca: `enum TouchState`/`enum DrawRefusal` (linie 33, 65–72); zdarzenie `DrawRejected` (linia 74).
- Wizualny/strukturalny: strukturalny (maszyna stanów) choć skutek jest wizualny (drgnięcie ramki + haptyka przy odrzuconym dotyku).
- Nietypowe: "niewidzialna ściana" (odrzucony dotyk) zawsze daje odpowiedź (nudge + wibracja) — poprawka błędu ze starego tutoriala, udokumentowana w `AI_CONTEXT.md` i `CLAUDE.md`.

### 12. Lab ("build mode") — edycja dużych wzorców ręcznie
- Co robi: Tryb modalny do budowania dużych struktur: zaznaczanie prostokątem, kopiuj/wytnij/wklej (OR/XOR/OVER), obrót/odbicie, wypełnianie/losowanie, undo/redo budżetowane w komórkach, biblioteka "stempli", zakładki miejsc (bookmarki kamery), test okresowości zaznaczenia.
- Implementacja: `LabController` — zwykła klasa C# (nie MonoBehaviour), właściciel `GameController`; operacje idą przez masowe API `CellManager` (`ApplyRegionEdit`/`ClearRegion`/`CopyRegion`/`CountRegion`), biorące `gridLock` raz na operację zamiast per-komórkę. `RegionAnalysis` uruchamia kopię zaznaczenia na `RegionLife` i wykrywa okres przez hashowanie stanu (FNV-1a 64-bit) — wykrywa still life/oscylator z okresem/umiera/nierozstrzygnięte. Cała geometria (`CellRegion`: rotacje, odbicia, przycinanie) jest wolna od typów Unity poza `Vector3Int`, więc kompiluje się i jest fuzz-testowana w `Tools/BitmaskVerify`.
- Typ: mechanika gameplayowa (dev-only, bramkowana `debugMode` — **niedostępna w wydaniu produkcyjnym**: `GameController.LabAvailable => debugMode`).
- Pliki/klasy: `Assets\Scripts\Lab\LabController.cs`, `CellRegion.cs`, `LabHistory.cs`, `RleCodec.cs`, `RegionAnalysis.cs`, `RegionLife.cs`, `SelectionOverlayController.cs`, `PasteGhostRenderer.cs`; UI: `Assets\Scripts\UI\LabToolbar.cs`, `LabStampLibrary.cs`, `LabTheme.cs`, `LabPlacesPanel.cs`, `LabIcons.cs`; shader `Assets\Shaders\SelectionOverlay.shader`.
- Kluczowe miejsca: `LabController` doc-comment (linie 1–33); `RegionAnalysis.Verdict` enum (linie 30–44).
- Wizualny/strukturalny: mieszany — budowanie (zaznaczanie, wklejanie, "marching ants") **wizualne/dynamiczne**; undo/redo i wykrywanie okresu **strukturalne**.
- Nietypowe: geometria transformacji i logika undo odseparowane od Unity, fuzz-testowane przeciw naiwnej implementacji referencyjnej poza silnikiem. UI Laba budowane w 100% w kodzie w runtime, bez wiringu w scenie i bez sprite'ów z `Resources` (ikony rasteryzowane w locie).

### 13. System samouczka (onboarding) — maszyna stanów "beat"
- Co robi: Wprowadzenie do gry w czterech "beatach" (Rules → Colony → Movement → Glider → Done), zamiast starego 11-stanowego tutoriala. Uczy rysowania, gestów (pinch/pan) i użycia Pattern Booka.
- Implementacja: `OnboardingFlow` — czysta klasa C# tykana z `GameController.Update`, nie dotyka świata bezpośrednio — każdy efekt (uruchom/pauzuj/zasiej/kamera/prędkość/otwórz książkę) wychodzi jako zdarzenie, a `GameController` je wykonuje ("it asks, the game acts" — ten sam wzorzec co `SaveSlotsTilesManager`). `OnboardingBeat` to enum zapisywany w PlayerPrefs (nigdy nie renumerować). `ColonyVerdict` diagnozuje, dlaczego narysowana kolonia wymarła. Ostatni beat rysuje strzałkę **z żywych komórek** wskazującą przycisk Pattern Booka (`OnboardingArrowShape` — czysta geometria testowana w `Tools/BitmaskVerify`; `OnboardingCellArrow` — czas i animacja).
- Typ: mechanika gameplayowa (UX/tutorial), z rygorystycznym rozdzieleniem logiki i efektów ubocznych.
- Pliki/klasy: `Assets\Scripts\Tutorial\Onboarding\OnboardingFlow.cs`, `OnboardingBeat.cs`, `ColonyVerdict.cs`, `OnboardingArrowShape.cs`, `OnboardingCellArrow.cs`; UI: `Assets\Scripts\UI\OnboardingOverlay.cs`, `OnboardingTheme.cs`, `OnboardingGestureIcon.cs`.
- Kluczowe miejsca: `OnboardingFlow.cs` doc-comment (linie 1–44) — spisuje, jakich dziewięciu błędów starego tutoriala unika i dlaczego.
- Wizualny/strukturalny: mieszany — prezentacja **wizualna/dynamiczna**; logika przejść **strukturalna** (diagram maszyny stanów).
- Nietypowe: strzałka-wskaźnik zbudowana z żywych komórek symulacji (nie z UI), celująca w `RectTransform` przycisku na overlayu. `AI_CONTEXT.md` dokumentuje dziewięć rund poprawek z testów na telefonie.

### 14. Stary `TutorialManager` (kod legacy)
- Co robi: Pierwotny, 11-stanowy tutorial. Obecnie martwy w praktyce — nic nie wywołuje `StartTutorial()`. Żyje z niego tylko `ShowRulesStandalone` (ekran Reguł z Menu).
- Implementacja: `Assets\Scripts\Tutorial\TutorialManager.cs`.
- Typ: legacy — celowo pozostawiony martwy kod, do usunięcia po przetestowaniu nowego flow.
- Wizualny/strukturalny: strukturalny.

### 15. Pattern Book (biblioteka wzorców)
- Co robi: Przegląd, wyszukiwanie, filtrowanie (All/Large/Favorites), stronicowanie i wczytywanie ponad 1600 wzorców RLE (w tym maszyny Turinga Paula Rendella, do ~12699×12652 komórek).
- Implementacja: `PatternLoader` ładuje z `Resources/patterns` (fallback `StreamingAssets/patterns.json` przez `UnityWebRequest` na Androidzie), waliduje znaki RLE, cache'uje listy per-kategoria. `PatternDataConverter` parsuje RLE → `HashSet<Vector3Int>`. Ulubione w PlayerPrefs, gwiazdka rasteryzowana w runtime (`UI/StarIcon.cs`).
- Typ: mechanika gameplayowa.
- Pliki/klasy: `Assets\Scripts\PatternBook\PatternLoader.cs`, `PatternDataConverter.cs`, `PatternListManager.cs`, `PatternGridView.cs`, `PatternListView.cs`, `PatternThumbnailCache.cs`, `PatternButtonInfo.cs`, `PatternButtonPrefab.cs`, `PatternCategory.cs`, `PatternIndexRail.cs`; `Assets\Scripts\UI\StarIcon.cs`.
- Wizualny/strukturalny: wizualny.
- Nietypowe: rozmiar wzorca (`LargePatternThreshold=300`) nie filtruje, tylko przesuwa do zakładki "Large".

### 16. Zapis/odczyt gry — pliki RLE na dysku
- Co robi: Zapisuje i wczytuje stan planszy (sloty zapisu) bez zamrażania aplikacji na dużych wzorcach.
- Implementacja: `SaveSlotStore` — statyczna klasa, jeden plik RLE na slot pod `Application.persistentDataPath`, kodowanie/dekodowanie na wątku roboczym. Zmierzony powód zmiany z PlayerPrefs: `PlayerPrefs.GetString` dużego zapisu kosztował **4370 ms** na Pixel 6 Pro (vs 287 ms parsowanie + 8 ms instalacji; zapis 1456 ms) — liczby w komentarzu w kodzie (`SaveSlotStore.cs`, linie 13–17). Zapis/odczyt cięty na kawałki między klatkami (`CellManager.SaveGameRoutine`/`LoadGameRoutine`, `CellsPerSlice=20000`), żeby pasek postępu realnie się wypełniał.
- Typ: architektura ogólna (persystencja).
- Pliki/klasy: `Assets\Scripts\SaveSlotStore.cs`, `Assets\Scripts\PlayerPrefsManager.cs`, `Assets\Scripts\UI\SaveSlotsTilesManager.cs`, `Assets\Scripts\UI\SaveSlotsManager.cs` (starszy wariant, wyjęty ze sceny).
- Wizualny/strukturalny: strukturalny.
- Nietypowe: stare zapisy czytelne (fallback na PlayerPrefs, leniwa migracja), podglądy slotów rasteryzowane w momencie zapisu (4-bitowa maska 256×256).

### 17. Turbo Pace Panel — sterowanie tempem silnika HashLife
- Co robi: Suwak/panel do sterowania tempem trybu Turbo, skalowany w "generacjach na skok" (nie w czasie), bo silnik memoizujący nie potrafi obiecać stałej prędkości w czasie.
- Implementacja: `TurboPacePanel.cs` (w 100% w kodzie), `TurboPaceLadder` (AUTO/16/256/4K/64K), sterowanie w `GameController.TurboCalculationThreadLoop` — mediana kosztu 15 ostatnich skoków (nie EWMA, bo pauzy GC zniekształcały średnią), test opłacalności podniesienia/obniżenia wykładnika, wstrzymanie decyzji tuż po kolekcji pamięci.
- Typ: mechanika gameplayowa (UI + pętla sterująca), dev-only.
- Pliki/klasy: `Assets\Scripts\UI\TurboPacePanel.cs`, `TurboPaceLadder.cs`, logika w `GameController.cs`.
- Wizualny/strukturalny: strukturalny.
- Nietypowe: dwie wcześniejsze wersje kontrolki odrzucone (opisane w `AI_CONTEXT.md`).

### 18. Wibracje / haptyka
- Co robi: Haptyczne sprzężenie zwrotne (narodziny/śmierć generacji, dotyk, przyciski UI, litery tekstu, poziom prędkości).
- Implementacja: `IVibrationManager`/`VibrationManager` z osobnymi amplitudami i czasami na typ zdarzenia; `Vibration.cs` to natywny most do Androida.
- Typ: architektura ogólna (usługa) / feedback.
- Pliki/klasy: `Assets\Scripts\Vibrations\VibrationManager.cs`, `Vibration.cs`, `Assets\Scripts\Interfaces\IVibrationManager.cs`.

### 19. Monetyzacja / poziom FREE-PAID (gating obliczeń)
- Co robi: Mechanizm (przygotowany, **nie podłączony do płatności**) na płatny poziom: silnik na wszystkich wątkach Job System zamiast jednym, plus zdjęcie limitu rozmiaru wzorca.
- Implementacja: flaga `PlayerPrefsManager.MultithreadedCalcEnabled` czytana przez `BitmaskGenerationSolver.UseParallelKernel` i `PatternLoader`. Naiwna wersja (tylko kernel zrównoleglony) **nie dała mierzalnej różnicy na urządzeniu** mimo 2.2–2.5× w edytorze — dopiero zrównoleglenie całego pipeline'u (gather/count/write/apply) dało realne ~2×.
- Typ: feature flag + logika biznesowa, **niedokończona** (brak Google Play Billing).
- Pliki/klasy: `PlayerPrefsManager.cs`, `BitmaskGenerationSolver.cs`, `PatternLoader.cs`, `SettingsManager.cs`.
- Nietypowe: "FPS trap" — szybszy silnik najpierw **pogorszył** płynność (main thread aplikował więcej generacji na klatkę), naprawione przez tryb direct-apply, który odsprzęga FPS od GPS (opisane w `MONETIZATION.md`).

### 20. Infrastruktura UI ogólnego przeznaczenia
- Co robi: Przyciski, panele, menu, ustawienia, wyświetlacz statystyk, ekran reguł, animacje tekstu.
- Implementacja: `UIButtonController`, `ButtonPanelSlider`, `MenuManager`, `SettingsManager`, `GameUIManager`, `StatsDisplay`, `RulesController`/`RuleBlockDisplay`, `AnimatedTextBlock`/`TextAnimator` (animacja pisania z haptyką na literę).
- Typ: architektura ogólna (warstwa UI).
- Wizualny: wizualny (DOTween).

### 21. Zarządzanie scenami / bootstrap
- `BootManager`/`BootSceneManager`, `SceneLoader`/`SceneNames` (stałe zamiast stringów), `WelcomeSceneController`. Architektura ogólna, strukturalny.

### 22. `GameController` — kompozytor / centralny orchestrator
- Root sceny Game — tworzy/łączy `VibrationManager`, `GenerationManager`, `GameUIManager`, `LabController`, `OnboardingFlow`; `Update()` decyduje o trybie wyświetlania (replay vs direct-apply), kamerze, Turbo. Bardzo duży plik. Kandydat na ogólny diagram architektury.

### 23. Narzędzia edytorowe budujące UI/scenę w kodzie ("Editor Setup scripts")
- Jednorazowe, idempotentne skrypty edytora z menu `Tools > Game of Life > ...`, modyfikujące scenę/prefaby programistycznie, z zabezpieczeniem przed powtórnym uruchomieniem.
- Pliki: `Assets\Editor\AddSimStatsTextSetup.cs`, `AddTurboMemoryToggleSetup.cs`, `AddTurboToggleSetup.cs`, `FixSettingsPanelHeightSetup.cs`, `LabButtonSetup.cs`, `LabSceneSetup.cs`, `MakeSettingsScrollableSetup.cs`, `PatternBookSetup.cs`, `RemoveCalcTierToggleSetup.cs`, `RemoveTurboTickSliderSetup.cs`, `SaveSlotsTilesPanelSetup.cs`.
- Rozbieżność: `CLAUDE.md` wspomina też `GridOverlaySetup.cs`, `SettingsPanelSetup.cs`, `SaveSlotsPanelSetup.cs`, `RulesPanelSetup.cs` — tych plików nie ma w `Assets\Editor`.

### 24. Narzędzia CLI do budowania
- `CliBuild.BuildAndroid` — build produkcyjny APK z CLI; `DevBuild.BuildAndroidDev` — równoległa kopia deweloperska z innym package id (`com.dbarans.gameoflife.dev`), debug keystore, ARM64-only, przywracanie ustawień w `finally`.
- Pliki: `Assets\Editor\CliBuild.cs`, `Assets\Editor\DevBuild.cs`.
- Nietypowe: zabezpieczenie przed nadpisaniem produkcyjnej instalacji i przed wysłaniem builda z kluczem debug.

### 25. Weryfikacja poza Unity — `Tools/` (konsolowe harnessy .NET)
- Co robi: Samodzielne projekty .NET (net8.0/net9.0), które kompilują **te same pliki źródłowe** z `Assets/Scripts` (przez `Shim.cs` podstawiający `UnityEngine.Vector3Int`) i testują je różnicowo względem naiwnych implementacji referencyjnych, bez Unity/Burst.
- `Tools/BitmaskVerify` — testy `ChunkedCellSet`, `LabHistory`, `CellRegion`, `RegionAnalysis`, `RegionLife`, `RleCodec`, `SaveSlotStore`, maski LOD, kształtu strzałki onboardingu, plus `Bench.cs`.
- `Tools/HashLifeVerify` — testy poprawności HashLife (still life, oscylatory, glider, R-pentomino do 1103 generacji) względem `BruteForceLife.cs`.
- `Tools/HashLifeProbe` — pomiar wydajności HashLife na prawdziwych wzorcach.
- `Tools/BurstProbe` — headless weryfikacja, że pięć jobów kompiluje się do natywnego ARM64 przez Burst (`bcl.exe`), z "negative control" (tablica zarządzana), który musi wywołać `BC1028`.
- `Tools/RLEParser` — parser/konwerter wzorców RLE.
- Typ: narzędzie deweloperskie / testowe.
- Nietypowe: `com.unity.test-framework` jest w manifeście, ale brak Edit/PlayMode Tests w `Assets` — weryfikacja idzie przez konsolowe projekty kompilujące prawdziwe pliki gry (bo Unity nie da się łatwo uruchomić z CLI).

### 26. `GameData` — minimalny współdzielony stan
- Jedno pole (`isTutorialOn`) jako `ScriptableObject`, 9 linii.

---

## Stack i liczby

**Unity:** `2022.3.62f2` (LTS). Render pipeline: **built-in** (brak `com.unity.render-pipelines.*`; jest `com.unity.feature.2d`).

**Platforma:** Android, IL2CPP, arm64-v8a, package id `com.dbarans.gameoflife` (dev: `com.dbarans.gameoflife.dev`), opublikowana na Google Play.

**Pakiety:** `com.unity.burst` 1.8.18 (`[BurstCompile]` na pięciu jobach), `com.unity.collections` 2.1.4 (`NativeParallelHashMap`, `NativeList`, `NativeArray`), `com.unity.mathematics` 1.2.6 (tranzytywnie), `com.unity.textmeshpro` 3.0.7 (font Latin-only → ASCII-only w Lab/onboardingu, ikony rasteryzowane ręcznie), `com.unity.timeline`, `com.unity.mobile.notifications`, `com.unity.mobile.android-logcat`, `com.unity.visualscripting`, `com.unity.test-framework` (obecne, jawnego użycia Timeline/VS nie znaleziono). Brak Input System — klasyczny `Input`/`Touch`. Third-party: DOTween.

**Metryki zmierzone:**

| Metryka | Wartość | Źródło | Warunki |
|---|---|---|---|
| Zysk ze zrównoleglenia kernela Burst (IJobParallelFor) | 2.18×–2.53× calc/s (np. 1614→4087 calc/s przy ~2000–2300 żywych komórek) | `PERFORMANCE.md`, Tier 2 krok 2 | in-editor, vs commit `4c56ed3`, ~42–52 aktywnych kafli |
| Koszt zapytania o okno w `ChunkedCellSet` | płasko ~50µs vs stary skan 44→1035µs (20.6× wolniej) | `PERFORMANCE.md`, "Resolved — GPS decay" | okno 200×200, populacja poza ekranem 13.5k→316k |
| Koszt renderowania na komórkę po batchowaniu `SetTiles` | ~1.6–1.75µs → ~1.0–1.07µs, płasko przy 300–400 tys. komórek/s | `PERFORMANCE.md`, "main-thread bottleneck at very large N" | populacja ~10–11 tys. |
| Koszt trzymania `lodLock` per generację | 2.53ms (LOD on) vs 0.92ms (off) | `CLAUDE.md`, "Conventions and pitfalls" | na urządzeniu |
| Direct-apply publikacja kaflowa | 64→141 gen/s, blokada locka 5.6→2.1 ms/gen | `CLAUDE.md`, "Simulation architecture" | soup 3000×3000, 275k komórek, 84k delty, Pixel 6 Pro |
| FREE vs PAID (Job System na wszystkich wątkach) | ~1.3×→~2× (wąski front), ~1.96× (gęsty soup), ~1.3× (Turing machine + LOD) | `MONETIZATION.md`, "Measured results" | urządzenie, `jobWorkers=4` |
| HashLife: gen/s vs wykładnik skoku | 2^10: 515k gen/s / 1.99ms/skok; 2^16: 310k gen/s / 211.6ms/skok | `HASHLIFE_PLAN.md`, B12 | off-device probe, Universal Turing Machine 252k komórek, sufit 3.48M węzłów |
| Budżet węzłów HashLife 4.17M vs 6.26M | 12× przepustowości (3 932 160 gen/s stabilnie) | `CLAUDE.md`, "Turbo RAM" | Pixel 6 Pro, UTM |
| Tempo Turbo: mediana vs EWMA | 105k→268k gen/s (2.55×), wykładnik 2^7 → 2^11 | `SESSION_HANDOFF.md` | replika, 70s, symulowane pauzy GC |
| Abort skoku Turbo | ~1ms na porzucenie skoku 24ms | `CLAUDE.md`, Turbo Pace | 180k komórek, 2^12 |
| Zapis dużej planszy przez PlayerPrefs | `GetString` 4370 ms (vs 287 ms parsowanie + 8 ms) | `SaveSlotStore.cs` l. 13–17 | Pixel 6 Pro |

Surowe logi `perf_*.log` to zrzuty `adb logcat` (Pixel 6 Pro, v1.11.0, IL2CPP Release arm64-v8a), np. `perf_stage3b_3000.log` l. 450: `calc/s=187 activeChunks=2596 deltaSize=493445 livingCount=690511 jobWorkers=4`.

---

## Podsumowanie architektury

Projekt zdominowany przez warstwę wydajnościową symulacji — Game of Life jako mechanika jest prosta, ale wokół niej zbudowano dwa niezależne silniki (bitmaskowy z Burst/Job System oraz HashLife/Gosper z memoizacją) za wspólnym interfejsem `ILiveCellSource`, tak by renderowanie i UI nie wiedziały, który silnik odpowiada za dane. Symulacja żyje na osobnym wątku z udokumentowanym protokołem dwóch locków (`gridLock`, `lodLock`) i deltowym przepływem danych, konsekwentnie od silnika przez `CellManager` po renderer i maskę LOD. Architektura sterowana pomiarami — niemal każda optymalizacja ma liczbę zmierzoną na urządzeniu, a nietrywialna logika (geometria Lab, HashLife, RLE, strzałka onboardingu) jest wydzielana do czystego C# i weryfikowana różnicowo w konsolowych projektach `Tools/`. Warstwy gameplayowe (Lab, onboarding, Pattern Book, zapisy, Turbo Pace) są w dużej mierze budowane w kodzie w runtime. Monetyzacja FREE/PAID i Turbo są zaimplementowane technicznie, ale niedokończone/niewysłane (brak billingu, Turbo za flagą dev).
