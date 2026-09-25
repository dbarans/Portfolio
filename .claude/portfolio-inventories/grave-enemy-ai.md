# Inwentarz: System AI wrogów — projekt Grave (`C:\Projects\Unity\engineering-project`)

Źródło: project-extractor, 2026-09-25. Zakres: `Assets/Scripts/Enemy/*`, interfejsy w `Assets/Scripts/Interfaces/`, `Assets/Scripts/ENEMY_NOTES.md`, punkty integracji z Sound/Saving/Generation. A*, Vision i generator lochu — tylko jako „skąd AI korzysta” (osobne inwentarze: `grave.md`).
Status: właściciel zaproponował sprawdzenie, czy ten system jest wart pokazania w portfolio — decyzja należy do curatora.

---

### Maszyna stanów `EnemyBase` (rdzeń AI)
- Co robi: Centralny automat stanów sterujący każdym wrogiem — patrol, pościg, sprawdzanie ostatniej pozycji/hałasu, wędrowanie, powrót na posterunek.
- Implementacja: `EnemyState` (enum: `Idle, FollowPlayer, InvestigateLastKnown, ReturnToPatrol, InvestigateNoise, WanderNearLastPosition, SearchAhead` — kolejność ma znaczenie, bo zapisywana jako `int` w save'ach). Cała logika przejść w `UpdateStateMachine()` (`EnemyBase.cs:517-691`), wołanej raz na klatkę lub raz na throttlowany tick z `Update()` (`:331-352`).
- Typ: architektura ogólna (framework AI dla wszystkich typów wrogów). Mechanizm.
- Kluczowe miejsca: `UpdateStateMachine()` (switch po `currentState`); `EndInvestigation()` (~866-878, decyzja „co dalej po utracie gracza”). Strukturalny (diagram stanów).
- Testy: brak (jedyne testy w projekcie dotyczą generatora lochu).

### Percepcja wzrokowa (detekcja gracza)
- Co robi: Wykrywa gracza na podstawie zasięgu, stożka kąta i linii wzroku (`Physics2D.Linecast`).
- Implementacja: `VisionPlayerDetector : IPlayerDetector`. Kierunek stożka z `IFacingProvider` (np. `SkullGuyAnimationDriver`), inaczej z ruchu wroga.
- Typ: mechanizm (percepcja przez interfejs wpięty w ogólny mechanizm detekcji `EnemyBase`).
- Kluczowe miejsca: `IsPlayerDetected(Transform)` (`VisionPlayerDetector.cs:66-87`).
- Nietypowe: świadomie NIE czyta rotacji wizualnej sprite'a (ma wypieczony offset graficzny) — współdzielony jest sam kąt przez `IFacingProvider`, żeby stożek wykrywania nigdy nie rozjechał się z animacją (`ENEMY_NOTES.md:379`).

### Percepcja słuchowa i szyna hałasu
- Co robi: Wrogowie „słyszą” hałas (kroki, rzucone przedmioty) — to podejrzenie, nie potwierdzona detekcja.
- Implementacja: statyczna szyna zdarzeń `NoiseEvents.Emit(pos, radius)` / `NoiseEvents.NoiseEmitted`; emitenci: `PlayerNoiseEmitter`, `NoiseProjectile` (rzucany kamień jako dywersja). Po stronie wroga `SoundPlayerDetector : INoiseSensor` — celowo osobny interfejs niż `IPlayerDetector` (hałas ≠ detekcja), filtr po zasięgu i linecaście przez blokery. `NoiseEvents.ResetSubscribers` czyści subskrybentów przy starcie Play (zabezpieczenie przy wyłączonym domain reload).
- Typ: mechanizm/architektura (event bus + rozdzielenie „słuch = podejrzenie” vs „wzrok = detekcja”); promienie hałasu to parametry.
- Kluczowe miejsca: `SoundPlayerDetector.OnNoiseEmitted()` (`:41-51`); `NoiseEvents.Emit/ResetSubscribers` (`:23-37`).
- Iteracja: pierwsza wersja `SoundPlayerDetector` implementowała `IPlayerDetector` (pełna detekcja na dowolny ruch) — zrefaktoryzowana na `INoiseSensor` + nowy stan `InvestigateNoise` (`ENEMY_NOTES.md:297`).

### Ukrywanie gracza — priorytet detekcji
- `IPlayerConcealment.IsConcealed` (implementacja `PlayerHiding`) sprawdzane jako pierwszy warunek w `EnemyBase.IsPlayerDetected()` — jawnie udokumentowana hierarchia: ukrycie > zawsze-wykryj z bliska > detektory (`EnemyBase.cs:1158-1191`). Mechanika stealth wpięta w ogólny mechanizm.

### Pamięć ostatniej znanej pozycji i „overshoot”
- Po utracie gracza wróg idzie kawałek dalej wzdłuż wektora wróg→gracz (żeby wyjść zza rogu), cofając się do surowej pozycji, jeśli przesunięty punkt jest w ścianie albo trasa nie jest lokalnie czysta (`IsRouteLocallyClear` — własna walidacja geometrii, nie A*). `GetInvestigateTargetPosition()` (`:1131-1149`). Mechanika + parametr.

### `InvestigateNoise` — śledzenie tropu dźwiękowego
- Świeży hałas w trakcie stanu przesuwa cel i resetuje timer — wróg podąża za „tropem”, nie za jednym punktem (`UpdateStateMachine`, case `InvestigateNoise`, `:603-622`). Mechanika.

### Zachowanie po utracie celu + deterministyczna „osobowość” wroga
- Co robi: Po nieudanym śledztwie wróg wraca na patrol/posterunek albo błądzi wokół miejsca utraty tropu — wybór per-wróg.
- Implementacja: `PostInvestigateBehavior` (`ReturnToPatrol / WanderNearLastPosition / Randomized`); `Randomized` NIE używa `UnityEngine.Random`, tylko deterministycznego hasha pozycji posterunku (`PersonalityRoll(salt)`, bit-mixer w stylu Murmur, `EnemyBase.cs:842-858`) — wynik identyczny między klatkami, po zapisie/wczytaniu i po restarcie sceny, ale różny dla sąsiednich wrogów (sól + mieszanie bitów).
  ```csharp
  uint h = (uint)(x * 73856093 ^ y * 19349663 ^ salt * 83492791);
  h ^= h >> 16; h *= 0x7feb352du; h ^= h >> 15; h *= 0x846ca68bu; h ^= h >> 16;
  return (h & 0xFFFFFF) / (float)0x1000000;
  ```
- Typ: mechanizm (deterministyczne losowanie z ziarna pozycji) + parametry (`guardChance`, `wanderAfterLosingChance` per prefab).
- Motywacja (GU-0088): „every waypoint-less enemy used to behave identically... A dungeon full of one prefab therefore read as one enemy copy-pasted” (`ENEMY_NOTES.md:119-122`).

### `SearchAhead` — przeszukiwanie korytarza w kierunku ucieczki
- Co robi: Zamiast błądzić w miejscu, wróg kontynuuje ruch w kierunku, w którym faktycznie biegł (próbkowany z realnego przemieszczenia co ≥0.2 j., nie z jednej klatki), na skrzyżowaniach losuje odgałęzienie, po pierwszym wyborze zwalnia do chodu.
- Implementacja: `UpdateTravelDirection()` (`:359-370`); `BeginSearchAhead()`/`AdvanceSearchStep()`/`IsPassageOpen()` (`:894-990`) — sonduje 4 kierunki (nigdy wstecz), 3 próbki w głąb na kierunek (futryna/filar nie czyta się jako przejście); `PickSearchBranch()` losuje spośród otwartych; limit `maxSearchJunctions`. Lekka nawigacja „po omacku” niezależna od A*, oparta na `IWalkabilityProbe`.
- Typ: mechanika, proceduralnie zaawansowana.
- Kluczowe miejsce: `AdvanceSearchStep()` (~920-955).
- Iteracja: zastąpiło losowe błądzenie, bo to „still read as an enemy that had given up” (`ENEMY_NOTES.md:173-197`); losowe błądzenie zostało jako fallback.
- Gizmo w grze (linia do kolejnego kroku).

### Naprawa „zamarzania” na progu (coarse-grid arrival bug)
- Progi dotarcia do celu nigdy nie są ciaśniejsze niż to, co siatka nawigacyjna może dostarczyć: `EffectiveArrivalThreshold = max(investigateArrivalThreshold, sampleSize*0.75)` i analogiczne (`:1007-1017`), rozmiar komórki z `IWalkabilityProbe.WalkableSampleSize`.
- Udokumentowany bug: siatka `cellSize=2` dawała odchylenie do 1.41 j. od celu przy progu 0.35 — próg niespełnialny, wróg stał w miejscu w nieskończoność (`ENEMY_NOTES.md:199-231`). Mechanizm/bugfix.

### Wędrowanie z walidacją celu
- `PickRandomWanderTarget()` — pełny promień, potem 0.5×, 0.25× (`:1047-1081`); `IsWanderCandidateUsable()` wymaga `IsWalkable` + `IsRouteLocallyClear()` (linia prosta próbkowana co pół komórki), bo wróg „tours the map on what was supposed to be idle pottering” (`ENEMY_NOTES.md:236-246`). Mechanika + mała heurystyka.

### Wydajność AI: throttling + parkowanie („culling”)
- Co robi: Wrogowie daleko od gracza tickują rzadziej; bardzo daleko — całkowicie „zamarzają” (bez maszyny stanów, bez A*, bez ruchu).
- Implementacja: `ShouldTickThisFrame()` (`:420-440`) — pełna częstotliwość w promieniu najszerszego sensora + margines lub przy świeżym hałasie; poza tym tick co `throttledTickInterval` z jitterem (grupa wrogów się nie synchronizuje). `UpdateCulling()` (`:382-412`) parkuje wroga poza `cullDistance` z podłogą bezpieczeństwa (`Mathf.Max(cullDistance, full + 4f)`, `:299` — parkowanie nigdy nie usypia wroga zdolnego wykryć gracza) i histerezą 10%. Parkowanie woła `IPathStatusProvider.ReleaseCachedPath()` (czyści i `TrimExcess()` trasy A*). `tickSpeedScale` kompensuje ruch za dłuższy tick; reset timerów przy wybudzeniu (bez „teleportacji”).
- Typ: architektura ogólna (budżetowanie AI), mechanizm.
- Kontekst: „each one still runs the full state machine and a full A* search (up to 4000 nodes) several times a second... on the far side of a 200x200 map” (`ENEMY_NOTES.md:253-267`). Pomiar w notatkach: **~30 ms → ~12 ms/klatkę w edytorze** po optymalizacji `FieldOfView` i cache'owaniu buforów A* per siatka (`ENEMY_NOTES.md:300`) — zmiana w Vision/Pathfinding, wywołana obciążeniem od AI.

### Guard vs Wander dla wrogów bez tras patrolu
- Posterunek (`homePosition`) persystowany w save (`EnemySaveState.homePos`), bo wróg spawnowany proceduralnie dostaje pozycję z save'a dopiero po `Awake` (`ENEMY_NOTES.md:136-139`). Mechanika.

### Audio AI (pomruk idle, alert „raz na polowanie”, kroki)
- `UpdateIdleAudio()` — pomruk co 4–6 s, brama zasięgu zsynchronizowana z opadaniem głośności w `SoundBank`; żyje na `EnemyBase`, nie jako komponent, bo osobny komponent łatwo pominąć na nowym proceduralnie spawnowanym typie (`ENEMY_NOTES.md:5-19`).
- `UpdateAlertAudio()` — zatrzask `hasAlertedThisHunt`: alert raz na cały pościg (bugfix: gracz chowający się co 1.5 s był „szczekany” za każdym razem, `ENEMY_NOTES.md:29-40`).
- `EnemyFootstepAudio` — kadencja kroków skalowana prędkością, wygaszana przy parkowaniu.
- Typ: głównie mechanika/parametry.

### Wstrzykiwanie gracza dla wrogów spawnowanych proceduralnie
- Prefab nie może trzymać referencji do sceny → `EnemyBase.SetPlayer(Transform)` wołane przez `DungeonPopulator` zaraz po `Instantiate`; fallback w `Start()` dla wrogów odtwarzanych z save'a (`EnemyBase.cs:253-329`). Architektura (punkt spięcia AI z generatorem i zapisem).

### Typy wrogów: dziedziczenie + kompozycja
- `EnemyBase` wspólny (dziedziczenie dla tożsamości/zapisu), percepcja/ruch/walka/animacja jako komponenty (kompozycja).
  - `SkullGuyEnemy : EnemyBase` — tylko override `OnDeath()`; reszta to komponenty na prefabie.
  - `BlindListenerEnemy : EnemyBase` — `[RequireComponent(SoundPlayerDetector)]`, brak `VisionPlayerDetector`; „ślepota” = brak jednego komponentu, dodany **bez zmiany linii w `EnemyBase`**.
  - Ruch: `IMovementStrategy` (`SimpleDirectMovement` lub `PathfindingMovement`, Strategy pattern) — wróg nie wie nic o A*.
  - Detekcja: `GetComponents<IPlayerDetector>()` — dowolna liczba detektorów, wynik OR.
- Brak ScriptableObject-ów per typ wroga — konfiguracja to pola `[SerializeField]` per prefab.
- Narzędzie `Editor/BlindListenerEnemySetup.cs` (untracked) klonuje prefab i podmienia komponent; bug pierwszej wersji z kolejnością `DestroyImmediate` vs `[RequireComponent]` (`ENEMY_NOTES.md:302`).

### Walka wręcz i interakcja z otoczeniem
- `EnemyMeleeAttack` — komponent współdzielony (refaktor z podklasy do komponentu, `ENEMY_NOTES.md:299`), event `AttackStarted` dla animacji, obrażenia po opóźnieniu z ponownym sprawdzeniem zasięgu.
- `EnemyBarrelAttacker`, `EnemyDoorAttacker` — wróg rozbija beczki i wyłamuje/otwiera drzwi blokujące trasę; cache lookupu komponentu w callbackach kolizji, cooldown przełączania drzwi.
- Typ: mechanika + parametry (obrażenia, interwały).

### Animacja sterowana stanem AI (`SkullGuyAnimationDriver`)
- Mapuje (stan, ruch) na klipy własnego odtwarzacza klatkowego (`SpriteFrameAnimator`, nie Unity `Animator`), skaluje fps chodu do prędkości (brak ślizgania stóp), implementuje `IFacingProvider` — ten sam kąt jest rysowany i czytany przez detekcję. Wczesne wyjście przy parkowaniu. Prezentacja z elementem architektury.

### Zdrowie, śmierć, łupy
- Zdrowie w `EnemyBase`; po śmierci zwłoki-kontener z łupem. Dezaktywacja zamiast `Destroy`, bo zniszczony wróg wyrejestrowałby się z rejestru zapisu — dezaktywacja pozwala zapisać `alive=false` (`EnemyBase.cs:1366-1371`). Mechanika.

### Zapis/odczyt stanu AI
- `EnemySaveable : ISaveableComponent` (Newtonsoft JSON) → `CaptureSaveState()/RestoreSaveState()`. Stany przejściowe mapowane przy odczycie na `ReturnToPatrol` (ich prywatne cele nie są zapisywane — „indistinguishable to the player”, `:1499-1533`). Nowe wartości enumów zawsze dopisywane na końcu (kompatybilność starych zapisów). Architektura.

### Rozmieszczanie wrogów w wygenerowanym lochu
- Pokoje: `DungeonPopulator.SpawnEnemies()` (`:674-694`) — liczba z `RoomContentSettings.EnemyCountFor(depth, random)` (część ułamkowa losowana), prefab ruletką wagową filtrowaną po `minDepth`; hub nigdy nie dostaje wrogów.
- Korytarze: `SpawnCorridorAmbushes()` (`:1367-1407`) konsumuje wynik generatora — `layout.Alcoves` (zasadzki w alkowach) i `layout.Chokepoints`; wróg stoi **obok** chokepointu, nigdy **na** nim (`TryFindGuardPost`) — „beside it, they have to decide whether getting through is worth being seen”. Głębokość korytarza pożyczana od najbliższego pokoju; strefa buforowa wokół huba.
- `RoomContentSettings` (ScriptableObject) oddziela „czy loch dobrze wygląda” (layout) od „czy warto go grać” (zawartość).
- Typ: integracja AI × generator (mechanika + ScriptableObject z wagami).

### Debug/gizma AI
- `GizmoDebugSettings : ScriptableObject` (`[Flags] enum GizmoRanges`) — jeden asset przełącza gizma zasięgów wszystkich komponentów AI (wzrok, słuch, zawsze-wykryj, pomruk, posterunek, sweep). Narzędzie edytorowe.

### Testy
- Brak testów automatycznych AI.

---

## Liczby (wybrane — reszta to parametry tuningu)
- `detectionMemoryDuration = 1.5 s`; A* budżet `maxExploredNodes = 4000`; mapa 200×200.
- Throttling: `throttledTickInterval = 0.35 s` (jitter ×0.85–1.15), `cullDistance = 60` (podłoga `full + 4`, histereza ×0.9).
- Pomiar: **~30 ms → ~12 ms/klatkę w edytorze** (`ENEMY_NOTES.md:300`, optymalizacja FOV + bufory A*, wywołana obciążeniem AI).
- Bug zamarzania: odchylenie do 1.41 j. przy `cellSize=2` vs próg 0.35 → próg podniesiony do 0.7.
- Pozostałe wartości (zasięgi, obrażenia, szanse, interwały) to parametry per prefab — pełna tabela w oryginalnym wyniku extractora nie jest potrzebna do case study.

---

## Podsumowanie architektury AI
AI zbudowane wokół abstrakcyjnej `EnemyBase`: maszyna stanów (7 stanów, w tym proceduralny sweep korytarza `SearchAhead` i powrót po pościgu z deterministycznie hashowaną „osobowością”), plus warstwa wydajności (throttling + culling z podłogą bezpieczeństwa i histerezą). Percepcja w pełni skomponowana z wymiennych komponentów za interfejsami (`IPlayerDetector` — wzrok, `INoiseSensor` — słuch, `IPlayerConcealment` — ukrywanie); wróg pyta każdy detektor i bierze OR, dzięki czemu drugi typ wroga (`BlindListenerEnemy`) doszedł bez zmiany `EnemyBase`. Integracja wąska i jednokierunkowa: z A* przez `IMovementStrategy`/`IPathStatusProvider`/`IWalkabilityProbe` (w tym naprawa zamarzania przy grubej siatce), z wizją przez `IFacingProvider`, z generatorem przez gotowe listy alkowów/chokepointów i wstrzyknięcie gracza po `Instantiate`. `ENEMY_NOTES.md` dokumentuje iteracyjny rozwój (tickety GU-0032…GU-0088, liczby, opisy „co było źle i dlaczego”).

Autorstwo: notatki pokazują pracę 4-osobowego zespołu na ticketach i scenach nazwanych po członkach (`Dominik.unity`, `Maks.unity`, `Bartek 01.unity`), ale nie przypisują wprost fragmentów AI konkretnym osobom.

Braki: zero testów automatycznych AI; brak ScriptableObject-owej konfiguracji per typ wroga.
