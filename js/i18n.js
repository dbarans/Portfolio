(function () {
  const STORAGE_KEY = 'lang';

  const translations = {
    en: {
      'index.nav.home': 'Home',
      'index.nav.projects': 'Projects',
      'index.nav.github': 'GitHub',
      'index.nav.linkedin': 'LinkedIn',
      'index.hero.line1': '<span class="hero-name">Dominik Barański</span><span class="hero-sep"> · </span><span class="hero-role">Game programmer</span>',
      'index.hero.line2': '15,000+ downloads on Google\u00a0Play\u00a0— built solo.',
      'index.hero.lead':
        'Unity &amp; C# — a solo Android release, a survival horror built in a team of four, and mechanics shipped during a studio internship.',
      'index.hero.cta': 'View my work',
      'index.section.projects': 'Selected projects',
      'index.role.neon': 'Unity · Game Jam',
      'index.role.gothic': 'Unity · Crafting Prototype · Solo',
      'index.footer.developedBy': 'Developed by Dominik Barański',
      'index.footer.githubProfile': 'My GitHub Profile',
      'index.footer.linkedin': 'LinkedIn',
      'gp.nav.s0': 'At a glance',
      'gp.nav.s1': 'Measurements',
      'gp.nav.s2': 'Engine and code',
      'gp.nav.s3': 'Rejected alternatives',
      'gp.nav.s4': 'How it’s verified',
      'gp.s0.problem.t': 'Problem',
      'gp.s0.problem.d': 'The board has no edges: the player draws on it with a finger and can zoom out to patterns hundreds of thousands of cells wide. A straightforward simulation recomputes the whole population every generation, so a large pattern on a phone quickly stops being smooth.',
      'gp.s0.did.t': 'What I did',
      'gp.s0.did.d': 'All of it, alone: a multithreaded simulation engine (bitwise, on Burst jobs) plus a second, experimental HashLife engine, the pattern library, save slots, the tutorial and the interface. I prepared the Google Play release and keep developing it.',
      'gp.s0.result.t': 'Result',
      'gp.s0.result.d': '15,000+ downloads. A generation costs as much as the area that changes, not the number of cells — stable parts of the board cost nothing, and large patterns stay smooth on weaker phones too.',
      'gp.s0.app.t': 'In the app',
      'gp.s0.app.d': 'An infinite board you can zoom from one cell to a whole machine · a pattern library with search and favourites · save slots with previews · a tutorial that teaches by drawing · haptics · speed up to an uncapped INF mode.',
      'gp.s0.stack.t': 'Stack',
      'gp.s0.stack.d': 'Unity 2022.3 LTS · C# · IL2CPP · Burst + Job System · Android',
      'gp.s1.save.w': 'Loading a large save',
      'gp.s1.save.s': 'Pixel 6 Pro',
      'gp.s1.save.a': '4.4 s',
      'gp.s1.save.b': 'no freeze',
      'gp.s1.save.g': 'Reading the save from PlayerPrefs froze the app. Now a worker thread reads and decodes an RLE file, and the game keeps responding.',
      'gp.s1.burst.w': 'Engine after moving to Burst jobs',
      'gp.s1.burst.s': 'Unity editor, same pattern',
      'gp.s1.burst.a': '1.0×',
      'gp.s1.burst.b': '2.2–2.5×',
      'gp.s1.burst.g': 'The same pattern computes 2.2–2.5× more generations per second (about 1.6 k → 4.1 k gen/s at ~2 k cells).',
      'gp.s1.direct.w': '275k-cell soup, fast mode',
      'gp.s1.direct.s': 'Pixel 6 Pro',
      'gp.s1.direct.a': '64/s',
      'gp.s1.direct.b': '141/s',
      'gp.s1.direct.g': 'Above the animation cutoff the frame rate stops limiting simulation speed; the grid lock is held 2.1 ms per generation instead of 5.6.',
      'gp.s1.window.w': '“What’s on screen” with 316k living cells',
      'gp.s1.window.s': 'benchmark outside Unity',
      'gp.s1.window.a': '1035 µs',
      'gp.s1.window.b': '~50 µs',
      'gp.s1.window.g': 'A puffer’s growing static trail no longer slows the simulation — the cost follows the view, not the population.',
      'gp.s1.utm.w': 'Universal Turing Machine, 255k cells',
      'gp.s1.utm.s': 'Turbo (experimental), device',
      'gp.s1.utm.a': '~300/s',
      'gp.s1.utm.b': '61,440/s',
      'gp.s1.utm.g': 'Patterns built from clocks and guns can be fast-forwarded by thousands of generations per frame.',
      'gp.s1.th.what': 'What',
      'gp.s1.th.was': 'Before',
      'gp.s1.th.now': 'After',
      'gp.s1.th.gain': 'What the player gets',
      'gp.s2.e.kernel.t': 'Bit-parallel kernel',
      'gp.s2.e.kernel.d': '64×64 chunks stored as <code>ulong</code> bitmasks; neighbour counts for 64 cells at once with bitwise full-adders, compiled by Burst.',
      'gp.s2.e.pipeline.t': 'Parallel step pipeline',
      'gp.s2.e.pipeline.d': 'Gather, kernel, delta count and apply are chained <code>IJobParallelFor</code> jobs over native containers. On mobile the serial gather, not the kernel, was the real bottleneck.',
      'gp.s2.e.ring.t': 'Delta ring buffer',
      'gp.s2.e.ring.d': 'A background thread runs up to 100 generations ahead and stores born / died deltas, not snapshots. The main thread replays one per step — that is what drives the birth and death animations.',
      'gp.s2.e.direct.t': 'Direct apply at speed',
      'gp.s2.e.direct.d': 'Above 10 gen/s the calc thread publishes whole changed chunks (512 bytes each) straight into the live grid; the main thread only renders.',
      'gp.s2.e.set.t': 'Region-queryable living set',
      'gp.s2.e.set.d': 'Live cells are chunked row bitmasks, so “what’s on screen” costs O(visible cells) — never a walk over the population under the lock.',
      'gp.s2.e.lod.t': 'Far-zoom LOD',
      'gp.s2.e.lod.d': 'Zoomed out, the Tilemap is replaced by one quad with an <code>Alpha8</code> mask — one byte per cell, one draw call.',
      'gp.s2.e.hashlife.t': 'HashLife Turbo (experimental)',
      'gp.s2.e.hashlife.d': 'Gosper’s algorithm on an interned quadtree: abortable jumps, a node budget scaled to device RAM, and a collection that keeps the memo.',
      'gp.s2.e.gc.t': 'Pooling',
      'gp.s2.e.gc.d': 'Per-chunk buffers are pooled, keeping steady-state allocation near zero.',
      'gp.code.s1.t': 'Bit-parallel Life rule — 64 cells per operation',
      'gp.code.s1.d': 'The whole rule as bitwise arithmetic: each <code>ulong</code> is 64 cells of a row, the eight neighbour counts are summed with adders into three bit-planes, and “alive next generation” is a boolean expression over those planes.',
      'gp.code.s2.t': 'One step as a chain of Burst jobs',
      'gp.code.s2.d': 'Gather, kernel and delta counting chained through <code>JobHandle</code> dependencies, with the batch size sized to the worker count rather than a fixed constant.',
      'gp.code.s3.t': 'HashLife successor — Gosper’s algorithm, abortable',
      'gp.code.s3.d': 'A memoised recursion that advances the centre of a node by 2<sup>k</sup> generations. The abort check sits only on the cache-miss path — a jump made entirely of cache hits has nothing worth abandoning.',
      'gp.code.s4.t': 'Region query in O(visible cells)',
      'gp.code.s4.d': 'Picks the cheaper of probing the window’s chunk coordinates or walking the stored chunks — a tight window and the far-zoom LOD window sit at opposite extremes.',
      'gp.s3.slider.t': 'A generations-per-second slider',
      'gp.s3.slider.d': 'It promised a rate a memoising engine cannot keep: what a jump costs depends on how much of the pattern’s structure it has already learned. On a heavy pattern the slider showed a number that wasn’t happening.',
      'gp.s3.steptick.t': 'Separate “step” and “tick” controls',
      'gp.s3.steptick.d': 'Two views of one variable. On a heavy pattern the tick was dead — 5 jumps/s asked of a jump that took 3.4 s — and on a light one the adaptation silently overrode the step.',
      'gp.s3.only.t': 'HashLife as the only engine',
      'gp.s3.only.d': 'It fast-forwards periodic patterns by millions of generations, but produces no per-generation delta — so no birth / death animations or haptics — and gains nothing on chaotic soups. It stays a second, optional engine.',
      'gp.s3.chosen.t': 'What I chose',
      'gp.s3.chosen.d': 'One control, scaled in generations per frame: AUTO, 16, 256, 4 K, 64 K. The engine delivers generations per jump exactly, without predicting anything. An explicit position is an order and is never overridden; what actually happened is shown in the measurement row under it.',
      'gp.s4.diff.t': 'Differential tests',
      'gp.s4.diff.d': 'Every engine change is compared with a plain reference implementation outside Unity, over many generations — a stateful cache only goes wrong after several steps. For example 20,000 random chunks for the Burst kernel and 400,000 operations on the cell set: 0 mismatches.',
      'gp.s4.burst.t': 'Burst without the editor',
      'gp.s4.burst.d': 'All five jobs are compiled to native ARM64 with <code>bcl.exe</code> from the command line. A negative control — a managed array inside a job — must fail with BC1028, otherwise a clean result proves nothing.',
      'gp.s4.device.t': 'Measured, not estimated',
      'gp.s4.device.d': 'The numbers in section 01 come from the game’s <code>[perf]</code> line — gen/s, lock hold time, FPS — before and after a change, on the same pattern and settings.',
      'gp.diag1.c': 'The calculation thread writes each generation’s <strong>born / died delta</strong> into a lock-guarded ring buffer and may run up to 100 generations ahead; the main thread applies one delta per step. Above 10 gen/s the buffer is bypassed and changed chunks go straight into the live grid.',
      'gp.diag2.c': 'Only chunks that changed last step — plus a one-chunk halo — are recomputed, 64 cells per bitwise operation, and the delta is the XOR of each chunk’s old and new bitmask.',
      'gp.diag2.cellsPerOp': '64 cells / op',
      'gp.diag.swipe': 'Swipe to see the whole diagram →',
      'gp.skip': 'Skip to content',
      'gp.lang.aria': 'Switch to Polish (PL)',
      'gp.nav.aria': 'Sections',
      'gp.figs.aria': 'Key figures',
      'gp.figs.dl.v': '15,000+',
      'gp.figs.dl.l': 'downloads on Google Play',
      'gp.figs.burst.v': '2.2–2.5×',
      'gp.figs.burst.l': 'more generations per second after moving the engine to Burst jobs (Unity editor)',
      'gp.figs.device.v': '64 → 141/s',
      'gp.figs.device.l': 'generations per second, 275k-cell soup in fast mode on a Pixel 6 Pro',
      'gp.back': '← All projects',
      'gp.caption': '[ The field changes with the section you’re reading ]',
      'gp.meta.n': 'Project 01 of 03',
      'gp.meta.role': 'Solo&nbsp;· Unity&nbsp;/&nbsp;C#&nbsp;· released on Google Play',
      'gp.lead': 'An Android simulator where the board has no edges — and the game doesn’t slow down, because it only computes what actually moves.',
      'gp.s0.h': 'At a glance',
      'gp.callout.k': 'Next: the technical part',
      'gp.callout.p': 'Not a programmer? You already have the whole picture. Below: measurements, architecture and code.',
      'gp.s1.h': 'What changed, measured',
      'gp.s1.note': 'Before / after on the same pattern and settings; where it was measured is under each row.',
      'gp.s2.h': 'The heart of the engine: compute only what moves',
      'gp.s2.p1': 'A cell can only change if something next to it changed in the previous generation. So instead of walking the whole population, each step recomputes only the 64×64 chunks within one ring of the last step’s changes.',
      'gp.s2.p2': 'Those chunks are then advanced 64 cells per bitwise operation in parallel Burst jobs, and the born / died delta is the XOR of a chunk’s old and new bitmask. Stable regions cost nothing, however large they are.',
      'gp.s2.built': 'How the engine is built',
      'gp.s2.arch': 'Architecture',
      'gp.s2.more': 'More code — verbatim from the private repository',
      'gp.s3.h': 'What I didn’t choose, and why',
      'gp.s3.tag': 'Turbo mode speed control',
      'gp.s4.h': 'How it’s verified',
      'gp.close.p': 'The repository is private — the excerpts are above, and I’m happy to walk through the rest in an interview.',
      'gp.close.cta': 'Message me on LinkedIn',
      'index.section.more': 'More projects',
      'index.isl.rail': 'Project',
      'index.isl.count1': 'Project 01 of 03',
      'index.isl.count2': 'Project 02 of 03',
      'index.isl.count3': 'Project 03 of 03',
      'index.isl.gol.role': 'Solo · released',
      'index.isl.gol.hook': 'An edgeless board that only computes what moves.',
      'index.isl.gol.lead': 'An Android simulator: you draw living cells with your finger, and they are born and die by four simple rules. I built all of it myself — the engine, gameplay, interface and the store release.',
      'index.isl.gol.p1': 'Zoom out to hundreds of thousands of cells — still smooth on weaker phones too.',
      'index.isl.gol.p2': 'An experimental turbo mode leaps thousands of generations per frame.',
      'index.isl.gol.p3': 'A pattern library, save slots and a tutorial that teaches the rules through drawing.',
      'index.isl.gol.s1v': '15,000+',
      'index.isl.gol.s1l': 'Google Play downloads',
      'index.isl.gol.s2v': '2.2–2.5×',
      'index.isl.gol.s2l': 'faster after optimisation',
      'index.isl.gol.cta': 'How it works →',
      'index.isl.gol.deeper': 'Architecture, code excerpts, measurements and rejected approaches.',
      'index.isl.thesis.role': 'Team · defence 10.2026',
      'index.isl.thesis.title': 'Engineering thesis',
      'index.isl.thesis.hook': 'An enemy that genuinely can’t see you.',
      'index.isl.thesis.lead': 'A horror game built as a team for our degree project. My part is the enemy’s behaviour and what the player sees in the dark.',
      'index.isl.thesis.p1': 'Line of sight is computed, not faked.',
      'index.isl.thesis.p2': 'The darkness is the same information the enemy uses.',
      'index.isl.thesis.p3': 'Four project layers, so several people can write code in parallel.',
      'index.isl.thesis.s1v': 'URP',
      'index.isl.thesis.s1l': 'custom full-screen effect',
      'index.isl.thesis.s2v': 'Team',
      'index.isl.thesis.s2l': 'shared repository',
      'index.isl.thesis.cta': 'Devlog soon',
      'index.isl.thesis.deeper': 'A state diagram and a walkthrough of the mask pipeline — in preparation.',
      'index.isl.luggage.role': 'Rubens Games · commercial',
      'index.isl.luggage.hook': 'Three mechanics delivered in someone else’s codebase.',
      'index.isl.luggage.lead': 'A Rubens Games title — you check passengers’ luggage at an airport. Art and game design were the studio’s; I delivered the mechanics.',
      'index.isl.luggage.p1': 'You can’t close a suitcase if something sticks out.',
      'index.isl.luggage.p2': 'The scanner tells metal from organic matter by colour.',
      'index.isl.luggage.p3': 'The interaction menu changes its options depending on where you are.',
      'index.isl.luggage.s1v': '3 systems',
      'index.isl.luggage.s1l': 'in the studio’s game',
      'index.isl.luggage.cta': 'See details →',
      'index.isl.luggage.deeper': 'How it plugged into the existing project.',
      'index.meta.title': 'Dominik Barański — Game Programmer (Unity &amp; C#)',
      'index.meta.description':
        'Portfolio of Dominik Barański, a Unity & C# game programmer: a solo-built Android game with 15,000+ Google Play downloads, a survival horror built in a team of four, and mechanics shipped during a studio internship at Rubens Games.',
      'index.skip': 'Skip to content',
      'index.hero.card.title': 'At a glance',
      'index.hero.card.stack': 'Stack',
      'index.hero.card.released': 'Released',
      'index.hero.card.internship': 'Internship',
      'index.hero.card.profiles': 'Profiles',
      'index.contact.title': 'Contact',
      'index.contact.lead': 'I’m happy to walk through the code behind these projects in an interview.',
      'index.contact.cta': 'Message me on LinkedIn',
      'index.contact.github': 'GitHub profile',

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


      'index.isl.grave.role': 'Team of 4 · engineering project 2026',
      'index.isl.grave.hook': 'You only see what’s lit. The dungeon is new every run.',
      'index.isl.grave.lead': 'A finished 2D top-down survival horror, built by a team of four as our engineering project. I wrote three of its systems: the vision cone, the dungeon generator and A* pathfinding.',
      'index.isl.grave.p1': 'Vision cone — outside the light, monsters disappear from view.',
      'index.isl.grave.p2': 'Procedural dungeons — the same seed rebuilds the identical dungeon.',
      'index.isl.grave.p3': 'A* pathfinding — monsters chase you without stalling the game.',
      'index.isl.grave.s1v': '0 / 200',
      'index.isl.grave.s1l': 'failed generations',
      'index.isl.grave.s2v': '48 / 48',
      'index.isl.grave.s2l': 'unit tests green',
      'index.isl.grave.cta': 'See the three systems →',
      'index.isl.grave.deeper': 'A shader light mask, a seeded generator and A* — with code and diagrams.',





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
      'gol.diag2.burstCompiled': 'gather + kernel · Burst jobs',
      'gol.diag2.panel3Title': '3 · DELTA = OLD ⊕ NEW',
      'gol.diag2.born': 'born',
      'gol.diag2.died': 'died',




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
      'index.nav.home': 'Start',
      'index.nav.projects': 'Projekty',
      'index.nav.github': 'GitHub',
      'index.nav.linkedin': 'LinkedIn',
      'index.hero.line1': '<span class="hero-name">Dominik Barański</span><span class="hero-sep"> · </span><span class="hero-role">Programista gier</span>',
      'index.hero.line2': '15\u00a0000+ pobrań w\u00a0Google\u00a0Play\u00a0— gra zrobiona w\u00a0pojedynkę.',
      'index.hero.lead':
        'Unity i\u00a0C# — solowe wydanie na Androida, survival horror zrobiony w\u00a0czteroosobowym zespole i\u00a0mechaniki dowiezione na stażu w\u00a0studiu.',
      'index.hero.cta': 'Zobacz projekty',
      'index.section.projects': 'Wybrane projekty',
      'index.role.neon': 'Unity · Game Jam',
      'index.role.gothic': 'Unity · Prototyp craftingu · Solo',
      'index.footer.developedBy': 'Zrobione przez Dominika Barańskiego',
      'index.footer.githubProfile': 'Mój profil GitHub',
      'index.footer.linkedin': 'LinkedIn',
      'gp.nav.s0': 'W skrócie',
      'gp.nav.s1': 'Pomiary',
      'gp.nav.s2': 'Silnik i kod',
      'gp.nav.s3': 'Odrzucone warianty',
      'gp.nav.s4': 'Jak to sprawdzam',
      'gp.s0.problem.t': 'Problem',
      'gp.s0.problem.d': 'Plansza nie ma granic: gracz rysuje na niej palcem i może oddalić kamerę do wzorów szerokich na setki tysięcy komórek. Prosta symulacja co pokolenie przelicza całą populację, więc duży wzór na telefonie szybko przestaje być płynny.',
      'gp.s0.did.t': 'Co zrobiłem',
      'gp.s0.did.d': 'Całość zrobiłem sam: wielowątkowy silnik symulacji (bitowy, na zadaniach Burst), drugi, eksperymentalny silnik HashLife, bibliotekę wzorców, sloty zapisu, samouczek i interfejs. Przygotowałem wydanie w Google Play i nadal rozwijam grę.',
      'gp.s0.result.t': 'Efekt',
      'gp.s0.result.d': '15 000+ pobrań. Koszt pokolenia zależy od obszaru, który się zmienia, a nie od liczby komórek — stabilne fragmenty planszy nic nie kosztują, a duże wzory działają płynnie także na słabszych telefonach.',
      'gp.s0.app.t': 'W aplikacji',
      'gp.s0.app.d': 'Nieskończona plansza z przybliżaniem od jednej komórki po całą maszynę · biblioteka wzorców z wyszukiwarką i ulubionymi · sloty zapisu z podglądem · samouczek przez rysowanie · wibracje · prędkość aż po nielimitowany tryb INF.',
      'gp.s0.stack.t': 'Technologie',
      'gp.s0.stack.d': 'Unity 2022.3 LTS · C# · IL2CPP · Burst + Job System · Android',
      'gp.s1.save.w': 'Wczytywanie dużego zapisu',
      'gp.s1.save.s': 'Pixel 6 Pro',
      'gp.s1.save.a': '4,4 s',
      'gp.s1.save.b': 'bez zacięcia',
      'gp.s1.save.g': 'Odczyt zapisu z PlayerPrefs zamrażał aplikację. Teraz plik RLE czyta i dekoduje wątek roboczy, a gra cały czas reaguje.',
      'gp.s1.burst.w': 'Silnik po przejściu na zadania Burst',
      'gp.s1.burst.s': 'edytor Unity, ten sam wzór',
      'gp.s1.burst.a': '1,0×',
      'gp.s1.burst.b': '2,2–2,5×',
      'gp.s1.burst.g': 'Ten sam wzór liczy 2,2–2,5× więcej pokoleń na sekundę (ok. 1,6 tys. → 4,1 tys. gen/s przy ~2 tys. komórek).',
      'gp.s1.direct.w': 'Zupa 275 tys. komórek, tryb szybki',
      'gp.s1.direct.s': 'Pixel 6 Pro',
      'gp.s1.direct.a': '64/s',
      'gp.s1.direct.b': '141/s',
      'gp.s1.direct.g': 'Powyżej progu animacji liczba klatek na sekundę przestaje ograniczać tempo symulacji; blokada siatki jest trzymana 2,1 ms na pokolenie zamiast 5,6 ms.',
      'gp.s1.window.w': '„Co jest na ekranie” przy 316 tys. żywych komórek',
      'gp.s1.window.s': 'benchmark poza Unity',
      'gp.s1.window.a': '1035 µs',
      'gp.s1.window.b': '~50 µs',
      'gp.s1.window.g': 'Rosnący, statyczny ślad puffera nie spowalnia już symulacji — koszt zależy od widoku, a nie od populacji.',
      'gp.s1.utm.w': 'Uniwersalna Maszyna Turinga, 255 tys. komórek',
      'gp.s1.utm.s': 'Turbo (eksperymentalny), urządzenie',
      'gp.s1.utm.a': '~300/s',
      'gp.s1.utm.b': '61 440/s',
      'gp.s1.utm.g': 'Wzory zbudowane z zegarów i dział da się przewijać o tysiące pokoleń na jedną klatkę.',
      'gp.s1.th.what': 'Co',
      'gp.s1.th.was': 'Było',
      'gp.s1.th.now': 'Jest',
      'gp.s1.th.gain': 'Co z tego ma gracz',
      'gp.s2.e.kernel.t': 'Kernel bitowo-równoległy',
      'gp.s2.e.kernel.d': 'Chunki 64×64 jako maski bitowe <code>ulong</code>; liczba sąsiadów dla 64 komórek naraz, liczona bitowymi sumatorami i kompilowana przez Burst.',
      'gp.s2.e.pipeline.t': 'Równoległy potok kroku',
      'gp.s2.e.pipeline.d': 'Zbieranie sąsiadów, kernel, liczenie delty i zapis to połączone zadania <code>IJobParallelFor</code> na kontenerach natywnych. Na telefonie wąskim gardłem okazało się szeregowe zbieranie, nie sam kernel.',
      'gp.s2.e.ring.t': 'Bufor kołowy delt',
      'gp.s2.e.ring.d': 'Wątek w tle wyprzedza wyświetlanie o maks. 100 pokoleń i zapisuje delty narodzin i śmierci, a nie migawki. Wątek główny odtwarza jedną na krok — to one napędzają animacje narodzin i śmierci.',
      'gp.s2.e.direct.t': 'Bezpośredni zapis przy dużej prędkości',
      'gp.s2.e.direct.d': 'Powyżej 10 gen/s wątek obliczeniowy publikuje całe zmienione chunki (po 512 bajtów) prosto do żywej siatki; wątek główny tylko renderuje.',
      'gp.s2.e.set.t': 'Zbiór żywych komórek z zapytaniem o region',
      'gp.s2.e.set.d': 'Żywe komórki to chunkowane maski wierszy, więc „co jest na ekranie” kosztuje O(widocznych komórek) — nigdy przejście całej populacji pod blokadą.',
      'gp.s2.e.lod.t': 'LOD przy oddaleniu',
      'gp.s2.e.lod.d': 'Po oddaleniu Tilemap zastępuje jeden quad z maską <code>Alpha8</code> — jeden bajt na komórkę, jedno wywołanie rysowania.',
      'gp.s2.e.hashlife.t': 'HashLife Turbo (eksperymentalny)',
      'gp.s2.e.hashlife.d': 'Algorytm Gospera na internowanym drzewie czwórkowym: przerywalne skoki, budżet węzłów skalowany do pamięci RAM urządzenia i odśmiecanie, które zachowuje wyniki memoizacji.',
      'gp.s2.e.gc.t': 'Pule buforów',
      'gp.s2.e.gc.d': 'Bufory chunków są pulowane, więc w stanie ustalonym prawie nic się nie alokuje.',
      'gp.code.s1.t': 'Reguła gry w życie bitowo-równolegle — 64 komórki na operację',
      'gp.code.s1.d': 'Cała reguła jako arytmetyka bitowa: każdy <code>ulong</code> to 64 komórki wiersza, osiem liczników sąsiadów jest sumowanych do trzech płaszczyzn bitowych, a „żywa w następnym pokoleniu” to wyrażenie logiczne na tych płaszczyznach.',
      'gp.code.s2.t': 'Jeden krok jako łańcuch zadań Burst',
      'gp.code.s2.d': 'Zbieranie, kernel i liczenie delty połączone zależnościami <code>JobHandle</code>, z rozmiarem paczki dobranym do liczby wątków roboczych zamiast stałej.',
      'gp.code.s3.t': 'Następnik HashLife — algorytm Gospera, przerywalny',
      'gp.code.s3.d': 'Memoizowana rekurencja przesuwająca środek węzła o 2<sup>k</sup> pokoleń. Sprawdzenie przerwania jest tylko na ścieżce chybienia w cache — skok złożony z samych trafień nie ma czego porzucać.',
      'gp.code.s4.t': 'Zapytanie o region w O(widocznych komórek)',
      'gp.code.s4.d': 'Wybiera tańszą z dwóch dróg: sprawdzenie współrzędnych chunków w oknie albo przejście po zapisanych chunkach — ciasne okno i okno LOD przy oddaleniu to dwa przeciwne skrajne przypadki.',
      'gp.s3.slider.t': 'Suwak „pokoleń na sekundę”',
      'gp.s3.slider.d': 'Obiecywał tempo, którego silnik memoizujący nie umie dotrzymać: koszt skoku zależy od tego, ile struktury wzoru silnik już zapamiętał. Przy ciężkim wzorze suwak pokazywał liczbę, której nie było.',
      'gp.s3.steptick.t': 'Osobne sterowanie „krokiem” i „tickiem”',
      'gp.s3.steptick.d': 'Dwa widoki jednej zmiennej. Przy ciężkim wzorze tick był martwy — 5 skoków/s przy skoku trwającym 3,4 s — a przy lekkim adaptacja po cichu nadpisywała krok.',
      'gp.s3.only.t': 'HashLife jako jedyny silnik',
      'gp.s3.only.d': 'Przewija wzory okresowe o miliony pokoleń, ale nie daje delty pokolenie po pokoleniu — więc ani animacji narodzin i śmierci, ani wibracji — i nic nie zyskuje na chaotycznych zupach. Został drugim, opcjonalnym silnikiem.',
      'gp.s3.chosen.t': 'Co wybrałem',
      'gp.s3.chosen.d': 'Jedna kontrolka wyskalowana w pokoleniach na klatkę: AUTO, 16, 256, 4 K, 64 K. Silnik zawsze dostarcza dokładnie tyle pokoleń na skok, bez przewidywania. Jawnie wybrana pozycja jest poleceniem i nigdy nie jest nadpisywana, a to, co faktycznie się wydarzyło, pokazuje wiersz pomiaru pod spodem.',
      'gp.s4.diff.t': 'Testy różnicowe',
      'gp.s4.diff.d': 'Każda zmiana silnika jest porównywana z prostą implementacją referencyjną poza Unity, przez wiele pokoleń — stanowy cache psuje się dopiero po kilku krokach. Np. 20 000 losowych chunków dla kernela Burst i 400 000 operacji na zbiorze komórek: 0 rozbieżności.',
      'gp.s4.burst.t': 'Burst bez edytora',
      'gp.s4.burst.d': 'Każde z pięciu zadań kompiluję do natywnego kodu ARM64 narzędziem <code>bcl.exe</code> z linii poleceń. Próba negatywna — zarządzana tablica w zadaniu — musi skończyć się błędem BC1028, inaczej czysty wynik niczego nie dowodzi.',
      'gp.s4.device.t': 'Mierzone, nie szacowane',
      'gp.s4.device.d': 'Liczby z sekcji 01 pochodzą z wiersza <code>[perf]</code> w grze — gen/s, czas trzymania blokady, FPS — przed i po zmianie, na tym samym wzorze i ustawieniach.',
      'gp.diag1.c': 'Wątek obliczeniowy zapisuje <strong>deltę narodzin i śmierci</strong> każdego pokolenia do chronionego blokadą bufora kołowego i może wyprzedzać wyświetlanie o maks. 100 pokoleń; wątek główny aplikuje jedną deltę na krok. Powyżej 10 gen/s bufor jest pomijany, a zmienione chunki trafiają prosto do żywej siatki.',
      'gp.diag2.c': 'Przeliczane są tylko chunki zmienione w ostatnim kroku — z halo szerokości jednego chunka — po 64 komórki na operację bitową, a delta to XOR starej i nowej maski chunka.',
      'gp.diag2.cellsPerOp': '64 komórki / op.',
      'gp.diag.swipe': 'Przesuń, aby zobaczyć cały diagram →',
      'gp.skip': 'Przejdź do treści',
      'gp.lang.aria': 'Przełącz na angielski (EN)',
      'gp.nav.aria': 'Sekcje strony',
      'gp.figs.aria': 'Najważniejsze liczby',
      'gp.figs.dl.v': '15 000+',
      'gp.figs.dl.l': 'pobrań w Google Play',
      'gp.figs.burst.v': '2,2–2,5×',
      'gp.figs.burst.l': 'więcej pokoleń na sekundę po przeniesieniu silnika na zadania Burst (edytor Unity)',
      'gp.figs.device.v': '64 → 141/s',
      'gp.figs.device.l': 'pokoleń na sekundę, zupa 275 tys. komórek w trybie szybkim na Pixelu 6 Pro',
      'gp.back': '← Wszystkie projekty',
      'gp.caption': '[ Pole komórek zmienia się razem z czytaną sekcją ]',
      'gp.meta.n': 'Projekt 01 z 03',
      'gp.meta.role': 'Samodzielnie&nbsp;· Unity&nbsp;/&nbsp;C#&nbsp;· wydane w Google Play',
      'gp.lead': 'Symulator na Androida, w którym plansza nie ma granic — a gra nie zwalnia, bo liczy tylko to, co naprawdę się rusza.',
      'gp.s0.h': 'W skrócie',
      'gp.callout.k': 'Dalej: część techniczna',
      'gp.callout.p': 'Nie programujesz? Masz już cały obraz. Niżej: pomiary, architektura i kod.',
      'gp.s1.h': 'Co się zmieniło — w pomiarach',
      'gp.s1.note': 'Przed i po, na tym samym wzorze i ustawieniach; miejsce pomiaru pod nazwą wiersza.',
      'gp.s2.h': 'Serce silnika: liczę tylko to, co się rusza',
      'gp.s2.p1': 'Zmienić się może tylko ten fragment planszy, który sąsiaduje z czymś, co zmieniło się w poprzednim kroku. Dlatego zamiast przechodzić całą populację, każdy krok przelicza tylko chunki 64×64 w pierścieniu wokół ostatnich zmian.',
      'gp.s2.p2': 'Te chunki są potem przeliczane po 64 komórki na operację bitową w równoległych zadaniach Burst, a delta narodzin i śmierci to XOR starej i nowej maski chunka. Stabilne regiony nic nie kosztują, niezależnie od rozmiaru.',
      'gp.s2.built': 'Jak zbudowany jest silnik',
      'gp.s2.arch': 'Architektura',
      'gp.s2.more': 'Więcej kodu — dosłownie z prywatnego repozytorium',
      'gp.s3.h': 'Czego nie wybrałem i dlaczego',
      'gp.s3.tag': 'sterowanie prędkością trybu Turbo',
      'gp.s4.h': 'Jak to sprawdzam',
      'gp.close.p': 'Repozytorium jest prywatne — fragmenty kodu są powyżej, a resztę chętnie pokażę na rozmowie.',
      'gp.close.cta': 'Napisz na LinkedIn',
      'index.section.more': 'Pozostałe projekty',
      'index.isl.rail': 'Projekt',
      'index.isl.count1': 'Projekt 01 z 03',
      'index.isl.count2': 'Projekt 02 z 03',
      'index.isl.count3': 'Projekt 03 z 03',
      'index.isl.gol.role': 'Samodzielnie · wydane',
      'index.isl.gol.hook': 'Plansza bez granic, która liczy tylko to, co się rusza.',
      'index.isl.gol.lead': 'Symulator na Androida: rysujesz palcem żywe komórki, a one rodzą się i giną według czterech prostych reguł. Zrobiłem całość sam — silnik, rozgrywkę, interfejs i wydanie w sklepie.',
      'index.isl.gol.p1': 'Oddalasz kamerę do setek tysięcy komórek — nadal płynnie, także na słabszych telefonach.',
      'index.isl.gol.p2': 'Eksperymentalny tryb turbo przeskakuje tysiące pokoleń na jedną klatkę.',
      'index.isl.gol.p3': 'Biblioteka wzorców, zapisy i samouczek uczący zasad przez rysowanie.',
      'index.isl.gol.s1v': '15 000+',
      'index.isl.gol.s1l': 'pobrań w Google Play',
      'index.isl.gol.s2v': '2,2–2,5×',
      'index.isl.gol.s2l': 'szybciej po optymalizacji',
      'index.isl.gol.cta': 'Jak to działa →',
      'index.isl.gol.deeper': 'Architektura, wycinki kodu, pomiary i odrzucone warianty.',
      'index.isl.thesis.role': 'Zespół · obrona 10.2026',
      'index.isl.thesis.title': 'Praca inżynierska',
      'index.isl.thesis.hook': 'Przeciwnik, który naprawdę cię nie widzi.',
      'index.isl.thesis.lead': 'Gra grozy robiona w zespole jako projekt dyplomowy. Mój zakres to zachowanie przeciwnika i to, co gracz widzi w ciemności.',
      'index.isl.thesis.p1': 'Zasięg wzroku jest liczony, nie udawany.',
      'index.isl.thesis.p2': 'Ciemność to ta sama informacja, z której korzysta przeciwnik.',
      'index.isl.thesis.p3': 'Cztery warstwy projektu, żeby kilka osób pisało równolegle.',
      'index.isl.thesis.s1v': 'URP',
      'index.isl.thesis.s1l': 'własny efekt pełnoekranowy',
      'index.isl.thesis.s2v': 'Zespół',
      'index.isl.thesis.s2l': 'wspólne repozytorium',
      'index.isl.thesis.cta': 'Devlog wkrótce',
      'index.isl.thesis.deeper': 'Diagram stanów i przebieg potoku maski — w przygotowaniu.',
      'index.isl.luggage.role': 'Rubens Games · komercyjnie',
      'index.isl.luggage.hook': 'Trzy mechaniki dowiezione w cudzym kodzie.',
      'index.isl.luggage.lead': 'Gra studia Rubens Games — sprawdzasz bagaże pasażerów na lotnisku. Grafika i projekt gry były po stronie studia, ja dowoziłem mechaniki.',
      'index.isl.luggage.p1': 'Walizki nie zamkniesz, jeśli coś wystaje.',
      'index.isl.luggage.p2': 'Skaner odróżnia metal od organiki kolorem.',
      'index.isl.luggage.p3': 'Menu interakcji zmienia opcje zależnie od miejsca.',
      'index.isl.luggage.s1v': '3 systemy',
      'index.isl.luggage.s1l': 'w grze studia',
      'index.isl.luggage.cta': 'Zobacz szczegóły →',
      'index.isl.luggage.deeper': 'Jak wpiąłem je w istniejący projekt.',
      'index.meta.title': 'Dominik Barański — programista gier (Unity i C#)',
      'index.meta.description':
        'Portfolio Dominika Barańskiego, programisty gier w Unity i C#: samodzielnie zrobiona gra na Androida z ponad 15 000 pobrań w Google Play, survival horror zrobiony w czteroosobowym zespole i mechaniki dowiezione na stażu w Rubens Games.',
      'index.skip': 'Przejdź do treści',
      'index.hero.card.title': 'W skrócie',
      'index.hero.card.stack': 'Technologie',
      'index.hero.card.released': 'Wydana',
      'index.hero.card.internship': 'Staż',
      'index.hero.card.profiles': 'Profile',
      'index.contact.title': 'Kontakt',
      'index.contact.lead': 'Kod stojący za tymi projektami chętnie omówię na rozmowie.',
      'index.contact.cta': 'Napisz na LinkedIn',
      'index.contact.github': 'Profil GitHub',

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


      'index.isl.grave.role': 'Zespół 4 osób · projekt inżynierski 2026',
      'index.isl.grave.hook': 'Widzisz tylko to, co oświetlone. Loch jest nowy w każdej grze.',
      'index.isl.grave.lead': 'Ukończony survival horror 2D z widokiem z góry, zrobiony w czteroosobowym zespole jako projekt inżynierski. Napisałem trzy jego systemy: stożek widzenia, generator lochów i pathfinding A*.',
      'index.isl.grave.p1': 'Stożek widzenia — poza światłem potwory znikają z widoku.',
      'index.isl.grave.p2': 'Proceduralne lochy — to samo ziarno odtwarza identyczny loch.',
      'index.isl.grave.p3': 'Pathfinding A* — potwory gonią cię i nie zawieszają gry.',
      'index.isl.grave.s1v': '0 / 200',
      'index.isl.grave.s1l': 'błędnych generacji',
      'index.isl.grave.s2v': '48 / 48',
      'index.isl.grave.s2l': 'zielonych testów jednostkowych',
      'index.isl.grave.cta': 'Zobacz trzy systemy →',
      'index.isl.grave.deeper': 'Maska światła w shaderze, generator z ziarnem i A* — z kodem i diagramami.',





      'gol.diag1.title': 'Wielowątkowy potok pokoleń',
      'gol.diag1.aria':
        'Wątek obliczeniowy działający w tle zapisuje delty kolejnych pokoleń do bufora kołowego chronionego blokadą, z którego wątek główny Unity odczytuje po jednej na krok; mechanizm back-pressure pozwala wątkowi obliczeniowemu wyprzedzać wyświetlanie najwyżej o 100 pokoleń.',
      'gol.diag1.calcThread': 'WĄTEK OBLICZENIOWY',
      'gol.diag1.calcThreadSub': 'w tle · IsBackground',
      'gol.diag1.burstJob': 'równoległe zadanie Burst',
      'gol.diag1.emitsDelta': 'zapisuje deltę narodzin i śmierci',
      'gol.diag1.ringBuffer': 'BUFOR KOŁOWY DELT',
      'gol.diag1.ringBufferSub': '128 slotów · chroniony blokadą',
      'gol.diag1.filledLabel':
        '<tspan x="296" dy="0">wypełnione = obliczone,</tspan><tspan x="296" dy="13">czeka na wyświetlenie</tspan>',
      'gol.diag1.storesDeltas':
        '<tspan x="296" dy="0">przechowuje delty,</tspan><tspan x="296" dy="14">nie migawki</tspan>',
      'gol.diag1.mainThread': 'WĄTEK GŁÓWNY (UNITY)',
      'gol.diag1.mainThreadSub': 'Update() co klatkę',
      'gol.diag1.applyDelta': 'aplikuje deltę → Tilemap',
      'gol.diag1.cameraCulled': 'renderowanie w zakresie kamery',
      'gol.diag1.produce': 'zapis',
      'gol.diag1.perStep': '1 / krok',
      'gol.diag1.backpressure': 'back-pressure — obliczenia czekają, gdy wyprzedzają wyświetlanie o ≥ 100 pokoleń',

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
      'gol.diag2.burstCompiled': 'gather + kernel · zadania Burst',
      'gol.diag2.panel3Title': '3 · DELTA = STARA ⊕ NOWA',
      'gol.diag2.born': 'narodziny',
      'gol.diag2.died': 'śmierć',




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

  // A page can ship its own strings as window.I18N_PAGE = { pl: {...} } in a script loaded
  // before this one. Its markup is the English text, so English falls back to the original HTML.
  const pageStrings = window.I18N_PAGE || {};
  Object.keys(pageStrings).forEach((lang) => {
    translations[lang] = Object.assign({}, translations[lang], pageStrings[lang]);
  });
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

