(function () {
  const STORAGE_KEY = 'lang';

  const translations = {
    en: {
      'index.subtitle': 'Game Programmer Portfolio',
      'index.nav.home': 'Home',
      'index.nav.projects': 'Projects',
      'index.nav.github': 'GitHub',
      'index.nav.linkedin': 'LinkedIn',
      'index.hero.line1': 'Game programmer',
      'index.hero.line2': '10,000+ downloads on Google Play — built solo.',
      'index.hero.lead':
        'Unity &amp; C# — gameplay systems, tools, and performance work, from a solo Android release to a studio internship.',
      'index.hero.cta': 'View my work',
      'index.hero.photoHint': 'Photo coming soon',
      'index.section.projects': 'Selected projects',
      'index.role.luggage': 'Unity · Team · Internship',
      'index.role.gol': 'Unity · Android · Solo',
      'index.role.neon': 'Unity · Game Jam',
      'index.role.gothic': 'Unity · Crafting Prototype · Solo',
      'index.footer.developedBy': 'Developed by Dominik Barański',
      'index.footer.githubProfile': 'My GitHub Profile',
      'index.footer.linkedin': 'LinkedIn',

      'luggage.desc':
        'During my internship at <strong>Rubens Games</strong>, I built and integrated gameplay systems for <strong>Luggage Please</strong> in <strong>Unity</strong>.<br/>Here are three mechanics I delivered end to end. Art assets were provided by the studio.',
      'luggage.m1.title': 'Advanced Suitcase & Item Physics System',
      'luggage.m1.li1': '<strong>Dynamic item physics</strong> (activates when suitcase is open).',
      'luggage.m1.li2': '<strong>Free item manipulation</strong> (grabbing, rotating, inserting/removing).',
      'luggage.m1.li3':
        'Features for <strong>resetting item position</strong> and a <strong>visual drop indicator</strong>.',
      'luggage.m1.li4':
        '<strong>Anti-closure mechanism</strong> to prevent closing if obstructed.',

      'luggage.m2.title': 'X-Ray Scanner with Material Differentiation',
      'luggage.m2.li1': '<strong>Scans suitcase contents</strong> and displays on screen.',
      'luggage.m2.li2':
        '<strong>Color-coded distinction</strong> for metal, organic matter, and other materials.',

      'luggage.m3.title': 'Contextual Interaction Wheel',
      'luggage.m3.li1': '<strong>Intuitive menu</strong> for NPC/environment interaction.',
      'luggage.m3.li2':
        '<strong>Dynamic options</strong> based on location (e.g. different actions at X-ray vs suitcase scale).',

      'luggage.back': '← Back to home',
      'luggage.footer.developedBy':
        'Developed by Dominik Barański during internship at Rubens Games.',
      'luggage.footer.githubProfile': 'My GitHub Profile',

      'gol.desc':
        'I developed this <strong>Game of Life</strong> simulator for <strong>Android</strong> using <strong>Unity</strong>.<br/>This project is my own take on John Conway\'s famous cellular automaton — bringing it to mobile with my own features and UX.',
      'gol.li1': '<strong>Infinite world</strong> — move and explore in any direction without boundaries.',
      'gol.li2': '<strong>Built-in tutorial</strong> introducing controls and game rules.',
      'gol.li3': '<strong>Subtle vibration feedback</strong> when text appears.',
      'gol.li4': '<strong>Minimalist UI</strong> created using DOTween.',
      'gol.li5': 'Smooth <strong>multi-threaded</strong> generation calculations.',
      'gol.li6': '<strong>Tilemap-based world</strong> — only tiles within the camera\'s view are rendered.',
      'gol.li7':
        '<strong>Pattern library</strong> — large built-in collection of classic Game of Life patterns (gliders, oscillators, still lifes, and more) ready to place and experiment with.',

      'gol.playStore': 'Download on Play Store',
      'gol.github': 'View on GitHub',
      'gol.back': '← Back to home',
      'gol.footer.developedBy': 'Developed by Dominik Barański.',
      'gol.footer.githubProfile': 'My GitHub Profile',

      'gol.hero.subtitle':
        'High-performance cellular automaton engine for <b>Android</b> · <b>Unity / C#</b>',
      'gol.stat.downloads': 'Google Play downloads',
      'gol.stat.costPerGen': 'cost per generation',
      'gol.stat.kernel': 'bit-parallel kernel',
      'gol.stat.gc': 'steady-state allocations',

      'gol.overview.title': 'Overview',
      'gol.overview.lead':
        'I built this <strong>Conway\'s Game of Life</strong> simulator for <strong>Android</strong> in <strong>Unity</strong> (C#, IL2CPP) and published it on Google Play, where it now has over <strong>10,000 downloads</strong>. Under the hood is a multithreaded engine I wrote to keep large, fast-changing patterns running smoothly, even on lower-end phones.',

      'gol.engine.title': 'Engine &amp; Performance',
      'gol.engine.c1.title': 'Bit-parallel simulation kernel',
      'gol.engine.c1.body':
        'The world is partitioned into 64×64 chunks stored as <code>ulong</code> bitmasks. Neighbor counts for 64 cells at a time are computed with bitwise full-adders, compiled with <strong>Unity Burst</strong> as a parallel job.',
      'gol.engine.c2.title': 'Active-chunk tracking',
      'gol.engine.c2.body':
        'Only chunks near cells that changed last generation are recomputed — a step costs O(active region), not O(population). Stable regions cost nothing, no matter how large.',
      'gol.engine.c3.title': 'Multithreaded generation pipeline',
      'gol.engine.c3.body':
        'A background calculation thread runs up to 100 generations ahead of the display, storing per-generation deltas (born / died cells) in a lock-guarded ring buffer instead of full grid snapshots.',
      'gol.engine.c4.title': 'Delta-driven incremental rendering',
      'gol.engine.c4.body':
        'The Tilemap renderer applies only each generation\'s born and died cells, culled to the camera view — the whole living set is never copied on the hot path.',
      'gol.engine.c5.title': 'Procedural grid shader',
      'gol.engine.c5.body':
        'Grid lines are drawn in a fragment shader on a single camera-following quad: one draw call, constant cost at any zoom, with an LOD fade when zoomed out.',
      'gol.engine.c6.title': 'Object pooling',
      'gol.engine.c6.body':
        'Per-chunk buffers are pooled for near-zero steady-state GC pressure — no allocation spikes or GC hitches on mobile.',

      'gol.arch.title': 'Architecture',

      'gol.diag1.title': 'Multithreaded generation pipeline',
      'gol.diag1.aria':
        'A background calculation thread produces per-generation deltas into a lock-guarded ring buffer that the Unity main thread consumes one step at a time, with back-pressure holding the calc thread at most 100 generations ahead.',
      'gol.diag1.calcThread': 'CALCULATION THREAD',
      'gol.diag1.calcThreadSub': 'background · IsBackground',
      'gol.diag1.burstJob': 'Burst parallel job',
      'gol.diag1.emitsDelta': 'emits born / died delta',
      'gol.diag1.ringBuffer': 'DELTA RING BUFFER',
      'gol.diag1.ringBufferSub': '128 slots · lock-guarded',
      'gol.diag1.filledLabel': 'filled = calculated, waiting to display',
      'gol.diag1.storesDeltas': 'stores deltas, not snapshots',
      'gol.diag1.mainThread': 'MAIN (UNITY) THREAD',
      'gol.diag1.mainThreadSub': 'Update() @ frame rate',
      'gol.diag1.applyDelta': 'apply delta → Tilemap',
      'gol.diag1.cameraCulled': 'camera-culled render',
      'gol.diag1.produce': 'produce',
      'gol.diag1.perStep': '1 / step',
      'gol.diag1.backpressure': 'back-pressure — calc sleeps while ≥ 100 generations ahead of display',
      'gol.diag1.caption':
        'A background <strong>calculation thread</strong> runs up to 100 generations ahead of the display, writing each generation\'s <strong>born / died delta</strong> into a lock-guarded ring buffer. The Unity main thread consumes one delta per display step and applies it incrementally. Back-pressure holds the calc thread at most 100 generations ahead, so it never races away from what the player sees.',

      'gol.diag2.title': 'Active-chunk, bit-parallel engine',
      'gol.diag2.aria':
        'The world is split into 64 by 64 bitmask chunks; only chunks that changed last step plus their halo are recomputed by a Burst-compiled parallel kernel that counts 64 cells per bitwise operation, and the output is the XOR delta of each chunk\'s old and new bitmask.',
      'gol.diag2.panel1Title': '1 · ACTIVE-CHUNK CACHE',
      'gol.diag2.legendChanged': 'changed last step',
      'gol.diag2.legendCandidate': 'candidate (halo)',
      'gol.diag2.legendSkipped': 'stable → skipped',
      'gol.diag2.panel2Title': '2 · BIT-PARALLEL KERNEL',
      'gol.diag2.parallelCandidates': '× N candidates in parallel',
      'gol.diag2.neighbourSum': 'Σ 8 neighbours · bitwise full-adders',
      'gol.diag2.burstCompiled': 'IJobParallelFor · Burst-compiled',
      'gol.diag2.panel3Title': '3 · DELTA = OLD ⊕ NEW',
      'gol.diag2.born': 'born',
      'gol.diag2.died': 'died',
      'gol.diag2.caption':
        'Space is split into 64×64 chunks stored as <code>ulong</code> bitmasks. Only chunks that changed last step — plus their one-chunk halo — are recomputed, so a step costs <strong>O(active region)</strong> no matter how large the stable population is. Each chunk\'s neighbour counts are evaluated 64 cells at a time with bitwise full-adders inside a <strong>Burst</strong>-compiled parallel job, and the born / died delta is simply the XOR of a chunk\'s old and new bitmask.',

      'gol.features.title': 'Product Features',
      'gol.features.f1':
        '<strong>Infinite world</strong> — sparse storage of live cells only; pan and pinch-zoom (5×–500×) in any direction.',
      'gol.features.f2':
        '<strong>Pattern Book</strong> — classic patterns (gliders, oscillators, still lifes) loaded from RLE files with a custom parser and runtime thumbnail rasterization.',
      'gol.features.f3':
        '<strong>Save slots</strong> — with timestamps, camera state, and generated previews.',
      'gol.features.f4':
        '<strong>Interactive tutorial</strong> — teaches the rules by having the player draw and evolve patterns.',
      'gol.features.f5':
        '<strong>Haptic feedback</strong> — native Android vibration bridge with amplitude control.',
      'gol.features.f6':
        '<strong>Polished UI</strong> — animated with DOTween, adjustable simulation speed up to an uncapped INF mode.',

      'gol.links.title': 'Links',
      'gol.videoCaption': 'Gameplay recording',

      'neon.jam':
        '<strong>PogJam 2026</strong> (Collegium Da Vinci, February 2026) — <strong>48-hour</strong> team game jam; theme: <strong>neon</strong>. Prototype in <strong>Unity</strong>. I worked as a <strong>Unity developer</strong>.',
      'neon.desc':
        'You read the scene with <strong>neon lamps</strong> and a <strong>flashlight</strong>: <strong>green</strong> light tells you which <strong>creatures are friendly vs hostile</strong>; <strong>red</strong> light <strong>reveals invisible</strong> enemies. Switch light modes, aim your laser, and survive the waves.',
      'neon.li1': '<strong>Green neon</strong> — tells friend from foe among the little critters in the dark.',
      'neon.li2': '<strong>Red neon</strong> — reveals threats that stay invisible under other lights.',
      'neon.li3': '<strong>Flashlight &amp; laser</strong> — light your way and fight back when things get crowded.',
      'neon.teamTitle': 'Team',
      'neon.team.1': 'Anita Korotyniec — environment texturing',
      'neon.team.2': 'Maria Dziuba — 3D modelling &amp; texturing',
      'neon.team.3': '<strong>Dominik Barański</strong> — Unity developer',
      'neon.team.4': 'Cyprian &quot;Francuz&quot; Arquier — Unity developer, audio &amp; music',
      'neon.team.5': 'Kacper Kowalski — UI/UX',
      'neon.itch': 'Download on itch.io',
      'neon.github': 'View on GitHub',
      'neon.back': '← Back to home',
      'neon.footer.developedBy': 'NeON — team project (PogJam 2026).',
      'neon.footer.githubProfile': 'My GitHub Profile',

      'gothic.intro':
        '<strong>Gothic Smithy</strong> is a <strong>solo</strong> <strong>Unity</strong> prototype: first-person crafting with inventory, workbenches, and NPC dialogue, presented in a <strong>Gothic&nbsp;I</strong>-inspired style. Built in <strong>C#</strong> with <strong>ScriptableObject</strong>-driven items and recipes so stations and UI always reflect the same definitions, plus integrated inventory and dialogue.',
      'gothic.li1':
        '<strong>Crafting</strong> — multi-ingredient recipes, station-specific rules, validation and consumption; UI driven from the same data (<strong>ScriptableObjects</strong>).',
      'gothic.li2':
        '<strong>Feedback</strong> — crafting reflected in UI; layered SFX where it supports the flow.',
      'gothic.li3':
        '<strong>Player &amp; content</strong> — stacked inventory, optional voice lines on dialogue rows.',
      'gothic.github': 'View on GitHub',
      'gothic.back': '← Back to home',
      'gothic.footer.developedBy': 'Gothic Smithy — Unity · solo project',
      'gothic.footer.githubProfile': 'My GitHub Profile',
      'gothic.attribution':
        'Some visual and audio assets reference the <strong>Gothic</strong> series; rights remain with <strong>Piranha Bytes</strong> and <strong>THQ Nordic</strong>.',
    },
    pl: {
      'index.subtitle': 'Portfolio programisty gier',
      'index.nav.home': 'Start',
      'index.nav.projects': 'Projekty',
      'index.nav.github': 'GitHub',
      'index.nav.linkedin': 'LinkedIn',
      'index.hero.line1': 'Programista gier',
      'index.hero.line2': '10 000+ pobrań w Google Play — zbudowane samodzielnie.',
      'index.hero.lead':
        'Unity i C# — systemy gameplayowe, narzędzia i wydajność, od solowego wydania na Androida po staż w studiu.',
      'index.hero.cta': 'Zobacz projekty',
      'index.hero.photoHint': 'Zdjęcie wkrótce',
      'index.section.projects': 'Wybrane projekty',
      'index.role.luggage': 'Unity · Zespół · Staż',
      'index.role.gol': 'Unity · Android · Solo',
      'index.role.neon': 'Unity · Game Jam',
      'index.role.gothic': 'Unity · Prototyp craftingu · Solo',
      'index.footer.developedBy': 'Zrobione przez Dominika Barańskiego',
      'index.footer.githubProfile': 'Mój profil GitHub',
      'index.footer.linkedin': 'LinkedIn',

      'luggage.desc':
        'Podczas stażu w <strong>Rubens Games</strong> tworzyłem i integrowałem systemy gameplayowe do <strong>Luggage Please</strong> w <strong>Unity</strong>.<br/>Poniżej trzy mechaniki, które dowiozłem od implementacji po integrację. Assety graficzne dostarczyło studio.',
      'luggage.m1.title': 'Zaawansowany system fizyki walizki i przedmiotów',
      'luggage.m1.li1': '<strong>Dynamiczna fizyka przedmiotów</strong> (włącza się, gdy walizka jest otwarta).',
      'luggage.m1.li2':
        '<strong>Swobodna manipulacja przedmiotami</strong> (chwytanie, obracanie, wkładanie/wyjmowanie).',
      'luggage.m1.li3':
        'Funkcje do <strong>resetowania pozycji przedmiotów</strong> oraz <strong>wizualnego wskaźnika upadku</strong>.',
      'luggage.m1.li4':
        '<strong>Mechanizm anty-zamykania</strong> zapobiega domykaniu, gdy coś blokuje.',

      'luggage.m2.title': 'Skaner RTG z rozróżnieniem materiałów',
      'luggage.m2.li1': '<strong>Skanuje zawartość walizki</strong> i wyświetla ją na ekranie.',
      'luggage.m2.li2': '<strong>Kolorowe rozróżnienie</strong> dla metalu, materii organicznej i innych materiałów.',

      'luggage.m3.title': 'Kontekstowe koło interakcji',
      'luggage.m3.li1': '<strong>Intuicyjne menu</strong> do interakcji z NPC/otoczeniem.',
      'luggage.m3.li2':
        '<strong>Dynamiczne opcje</strong> zależnie od miejsca (np. inne akcje przy skanerze RTG vs. w skali walizki).',

      'luggage.back': '← Wróć na stronę główną',
      'luggage.footer.developedBy':
        'Opracowane i wykonane przez Dominika Barańskiego podczas stażu w Rubens Games.',
      'luggage.footer.githubProfile': 'Mój profil GitHub',

      'gol.desc':
        'Zaprojektowałem symulator <strong>Game of Life</strong> na <strong>Androida</strong> z wykorzystaniem <strong>Unity</strong>.<br/>To moja interpretacja słynnego automatu komórkowego Johna Conway\'a — przeniesiona na mobile z własnymi funkcjami i UX.',
      'gol.li1': '<strong>Nieskończony świat</strong> — poruszaj się i eksploruj w dowolnym kierunku bez granic.',
      'gol.li2': '<strong>Wbudowany samouczek</strong> — sterowanie i zasady gry.',
      'gol.li3': '<strong>Subtelna wibracja</strong> gdy pojawia się tekst.',
      'gol.li4': '<strong>Minimalistyczny interfejs</strong> stworzony w oparciu o DOTween.',
      'gol.li5': 'Płynne <strong>obliczenia wielowątkowe</strong> generacji.',
      'gol.li6': '<strong>Świat oparty o Tilemap</strong> — renderowane są tylko kafelki widoczne w zakresie kamery.',
      'gol.li7':
        '<strong>Biblioteka wzorów</strong> — bogata, wbudowana kolekcja klasycznych układów z Gry w życie (glidery, oscylatory, układy statyczne i inne), gotowych do wstawienia i eksperymentów.',

      'gol.playStore': 'Pobierz w Google Play',
      'gol.github': 'Zobacz na GitHub',
      'gol.back': '← Wróć na stronę główną',
      'gol.footer.developedBy': 'Opracowane przez Dominika Barańskiego.',
      'gol.footer.githubProfile': 'Mój profil GitHub',

      'gol.hero.subtitle':
        'Wydajny silnik automatu komórkowego na <b>Androida</b> · <b>Unity / C#</b>',
      'gol.stat.downloads': 'pobrań w Google Play',
      'gol.stat.costPerGen': 'koszt jednej generacji',
      'gol.stat.kernel': 'kernel bitowo-równoległy',
      'gol.stat.gc': 'alokacji w stanie ustalonym',

      'gol.overview.title': 'Przegląd',
      'gol.overview.lead':
        'Zbudowałem ten symulator <strong>Gry w życie Conwaya</strong> na <strong>Androida</strong> w <strong>Unity</strong> (C#, IL2CPP) i opublikowałem w Google Play, gdzie ma dziś ponad <strong>10 000 pobrań</strong>. Pod maską działa wielowątkowy silnik, który napisałem tak, by duże, szybko zmieniające się wzory chodziły płynnie nawet na słabszych telefonach.',

      'gol.engine.title': 'Silnik i wydajność',
      'gol.engine.c1.title': 'Bitowo-równoległy kernel symulacji',
      'gol.engine.c1.body':
        'Świat jest podzielony na chunki 64×64 przechowywane jako maski bitowe <code>ulong</code>. Liczba sąsiadów dla 64 komórek naraz jest liczona bitowymi sumatorami pełnymi, skompilowanymi z <strong>Unity Burst</strong> jako zadanie równoległe.',
      'gol.engine.c2.title': 'Śledzenie aktywnych chunków',
      'gol.engine.c2.body':
        'Przeliczane są tylko chunki w pobliżu komórek, które zmieniły się w poprzedniej generacji — krok kosztuje O(aktywnego obszaru), nie O(populacji). Stabilne regiony nic nie kosztują, niezależnie od rozmiaru.',
      'gol.engine.c3.title': 'Wielowątkowy potok generacji',
      'gol.engine.c3.body':
        'Wątek obliczeniowy działający w tle wyprzedza wyświetlanie o maksymalnie 100 generacji, zapisując delty (komórki born / died) każdej generacji w buforze kołowym chronionym blokadą zamiast pełnych migawek siatki.',
      'gol.engine.c4.title': 'Renderowanie przyrostowe oparte na delcie',
      'gol.engine.c4.body':
        'Renderer Tilemap aplikuje wyłącznie komórki born i died danej generacji, ograniczone do widoku kamery — cały zbiór żywych komórek nigdy nie jest kopiowany na ścieżce krytycznej.',
      'gol.engine.c5.title': 'Proceduralny shader siatki',
      'gol.engine.c5.body':
        'Linie siatki są rysowane w shaderze fragmentów na jednym, podążającym za kamerą quadzie: jedno wywołanie rysowania, stały koszt przy dowolnym przybliżeniu, z zanikiem LOD przy oddaleniu.',
      'gol.engine.c6.title': 'Pula obiektów',
      'gol.engine.c6.body':
        'Bufory per chunk są pulowane, dając niemal zerowe obciążenie GC w stanie ustalonym — brak skoków alokacji i przycięć GC na mobile.',

      'gol.arch.title': 'Architektura',

      'gol.diag1.title': 'Wielowątkowy potok generacji',
      'gol.diag1.aria':
        'Wątek obliczeniowy działający w tle generuje delty kolejnych generacji do buforu kołowego chronionego blokadą, z którego wątek główny Unity odczytuje po jednym kroku, z mechanizmem back-pressure trzymającym wątek obliczeniowy maksymalnie 100 generacji przed wyświetlaniem.',
      'gol.diag1.calcThread': 'WĄTEK OBLICZENIOWY',
      'gol.diag1.calcThreadSub': 'w tle · IsBackground',
      'gol.diag1.burstJob': 'równoległe zadanie Burst',
      'gol.diag1.emitsDelta': 'generuje deltę born / died',
      'gol.diag1.ringBuffer': 'BUFOR KOŁOWY DELT',
      'gol.diag1.ringBufferSub': '128 slotów · chroniony blokadą',
      'gol.diag1.filledLabel':
        '<tspan x="296" dy="0">wypełnione = obliczone,</tspan><tspan x="296" dy="13">czeka na wyświetlenie</tspan>',
      'gol.diag1.storesDeltas':
        '<tspan x="296" dy="0">przechowuje delty,</tspan><tspan x="296" dy="14">nie migawki</tspan>',
      'gol.diag1.mainThread': 'WĄTEK GŁÓWNY (UNITY)',
      'gol.diag1.mainThreadSub': 'Update() @ klatka animacji',
      'gol.diag1.applyDelta': 'aplikuje deltę → Tilemap',
      'gol.diag1.cameraCulled': 'renderowanie w zakresie kamery',
      'gol.diag1.produce': 'zapis',
      'gol.diag1.perStep': '1 / krok',
      'gol.diag1.backpressure': 'back-pressure — obliczenia wstrzymują się przy ≥ 100 generacjach przewagi nad wyświetlaniem',
      'gol.diag1.caption':
        'Działający w tle <strong>wątek obliczeniowy</strong> może wyprzedzać wyświetlanie o maksymalnie 100 generacji, zapisując deltę <strong>born / died</strong> każdej generacji do buforu kołowego chronionego blokadą. Wątek główny Unity odczytuje po jednej delcie na krok wyświetlania i aplikuje ją przyrostowo. Mechanizm back-pressure trzyma wątek obliczeniowy maksymalnie 100 generacji przed wyświetlaniem, więc nigdy nie oddala się od tego, co widzi gracz.',

      'gol.diag2.title': 'Silnik bitowo-równoległy z pamięcią aktywnych chunków',
      'gol.diag2.aria':
        'Świat jest podzielony na chunki 64 na 64 przechowywane jako maski bitowe; przeliczane są tylko chunki, które zmieniły się w poprzednim kroku, wraz z otaczającym je halo, przez skompilowany w Burst równoległy kernel liczący 64 komórki na operację bitową, a wynikiem jest delta XOR starej i nowej maski bitowej każdego chunka.',
      'gol.diag2.panel1Title': '1 · PAMIĘĆ AKTYWNYCH CHUNKÓW',
      'gol.diag2.legendChanged': 'zmieniony w ostatnim kroku',
      'gol.diag2.legendCandidate': 'kandydat (halo)',
      'gol.diag2.legendSkipped': 'stabilny → pominięty',
      'gol.diag2.panel2Title': '2 · KERNEL BITOWO-RÓWNOLEGŁY',
      'gol.diag2.parallelCandidates': '× N kandydatów równolegle',
      'gol.diag2.neighbourSum': 'Σ 8 sąsiadów · bitowe sumatory pełne',
      'gol.diag2.burstCompiled': 'IJobParallelFor · skompilowane w Burst',
      'gol.diag2.panel3Title': '3 · DELTA = STARA ⊕ NOWA',
      'gol.diag2.born': 'narodziny',
      'gol.diag2.died': 'śmierć',
      'gol.diag2.caption':
        'Przestrzeń jest podzielona na chunki 64×64 przechowywane jako maski bitowe <code>ulong</code>. Przeliczane są tylko chunki, które zmieniły się w poprzednim kroku — wraz z otaczającym je halo o szerokości jednego chunka — więc koszt kroku to <strong>O(aktywnego obszaru)</strong>, niezależnie od tego, jak duża jest stabilna populacja. Liczba sąsiadów każdego chunka jest liczona po 64 komórki naraz za pomocą bitowych sumatorów pełnych wewnątrz zadania skompilowanego w <strong>Burst</strong>, a delta born / died to po prostu XOR starej i nowej maski bitowej chunka.',

      'gol.features.title': 'Funkcje aplikacji',
      'gol.features.f1':
        '<strong>Nieskończony świat</strong> — rzadkie przechowywanie tylko żywych komórek; przesuwanie i przybliżanie (5×–500×) w dowolnym kierunku.',
      'gol.features.f2':
        '<strong>Biblioteka wzorów</strong> — klasyczne wzory (glidery, oscylatory, układy statyczne) wczytywane z plików RLE przez własny parser, z generowaniem miniatur w czasie działania.',
      'gol.features.f3':
        '<strong>Sloty zapisu</strong> — ze znacznikami czasu, stanem kamery i wygenerowanymi podglądami.',
      'gol.features.f4':
        '<strong>Interaktywny samouczek</strong> — uczy zasad, pozwalając graczowi rysować i obserwować ewolucję wzorów.',
      'gol.features.f5':
        '<strong>Wibracje</strong> — natywny mostek do wibracji na Androidzie z kontrolą amplitudy.',
      'gol.features.f6':
        '<strong>Dopracowany interfejs</strong> — animowany za pomocą DOTween, regulowana prędkość symulacji aż po nielimitowany tryb INF.',

      'gol.links.title': 'Linki',
      'gol.videoCaption': 'Nagranie z rozgrywki',

      'neon.jam':
        '<strong>PogJam 2026</strong> (Collegium Da Vinci, luty 2026) — <strong>48 godzin</strong>; temat jamu: <strong>neon</strong>. Zespołowy prototyp w <strong>Unity</strong>. Moja rola: <strong>Unity developer</strong>.',
      'neon.desc':
        'Za pomocą <strong>neonów (lamp)</strong> i <strong>latarki</strong> odczytujesz scenę: <strong>zielone</strong> światło pozwala <strong>rozróżnić duszki</strong> — <strong>które są dobre, a które złe</strong>; <strong>czerwone</strong> <strong>odsłania niewidzialnych</strong> przeciwników. Przełączaj tryby światła, celuj laserem i przetrwaj fale.',
      'neon.li1': '<strong>Zielony neon</strong> — widać, które duszki są przyjazne, a które stanowią zagrożenie.',
      'neon.li2': '<strong>Czerwony neon</strong> — ujawnia niewidzialnych wrogów.',
      'neon.li3': '<strong>Latarka i laser</strong> — doświetlasz drogę i bronisz się, gdy robi się tłoczno.',
      'neon.teamTitle': 'Zespół',
      'neon.team.1': 'Anita Korotyniec — teksturowanie środowiska',
      'neon.team.2': 'Maria Dziuba — modelowanie 3D i teksturowanie',
      'neon.team.3': '<strong>Dominik Barański</strong> — Unity developer',
      'neon.team.4': 'Cyprian „Francuz” Arquier — Unity developer, audio i muzyka',
      'neon.team.5': 'Kacper Kowalski — UI i UX',
      'neon.itch': 'Pobierz na itch.io',
      'neon.github': 'Zobacz na GitHub',
      'neon.back': '← Wróć na stronę główną',
      'neon.footer.developedBy': 'NeON — projekt zespołowy (PogJam 2026).',
      'neon.footer.githubProfile': 'Mój profil GitHub',

      'gothic.intro':
        '<strong>Gothic Smithy</strong> to <strong>samodzielny</strong> prototyp w <strong>Unity</strong>: <strong>FPP</strong>, crafting, ekwipunek, stacje i dialogi NPC, w stylistyce nawiązującej do <strong>Gothica&nbsp;I</strong>. Kod w <strong>C#</strong>: przedmioty i receptury jako <strong>ScriptableObjects</strong> — stacje i interfejs korzystają z tych samych definicji co logika, plus ekwipunek i dialogi.',
      'gothic.li1':
        '<strong>Crafting</strong> — receptury wieloskładnikowe, zasady per stacja, walidacja i zużycie; UI spięte z tymi samymi danymi (<strong>ScriptableObjects</strong>).',
      'gothic.li2':
        '<strong>Feedback</strong> — crafting widoczny w UI; warstwa SFX wspierająca przepływ.',
      'gothic.li3':
        '<strong>Gracz i treść</strong> — stacki w inventory, opcjonalny głos na linię dialogu.',
      'gothic.github': 'Zobacz na GitHub',
      'gothic.back': '← Wróć na stronę główną',
      'gothic.footer.developedBy': 'Gothic Smithy — Unity · projekt solowy',
      'gothic.footer.githubProfile': 'Mój profil GitHub',
      'gothic.attribution':
        'Część assetów wizualnych i dźwiękowych nawiązuje do serii <strong>Gothic</strong>; prawa pozostają u <strong>Piranha Bytes</strong> i <strong>THQ Nordic</strong>.',
    },
  };

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
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        el.innerHTML = dict[key];
      }
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const attr = el.getAttribute('data-i18n-attr');
      const key = el.getAttribute('data-i18n-attr-key');
      if (!attr || !key) return;
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        el.setAttribute(attr, dict[key]);
      }
    });

    if (toggleBtn) {
      toggleBtn.textContent = lang === 'pl' ? 'EN' : 'PL';
      toggleBtn.setAttribute('aria-pressed', lang === 'pl' ? 'true' : 'false');
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

