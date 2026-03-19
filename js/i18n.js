(function () {
  const STORAGE_KEY = 'lang';

  const translations = {
    en: {
      'index.subtitle': 'Game Programmer Portfolio',
      'index.nav.home': 'Home',
      'index.nav.projects': 'Projects',
      'index.nav.github': 'GitHub',
      'index.nav.linkedin': 'LinkedIn',
      'index.nav.contact': 'Contact',
      'index.hero.line1': 'Game programmer',
      'index.hero.line2': 'building mechanics players remember.',
      'index.hero.lead':
        'Unity &amp; C# — gameplay, systems and tools. I focus on clarity, performance and feel.',
      'index.hero.cta': 'View my work',
      'index.hero.photoHint': 'Photo coming soon',
      'index.section.projects': 'Selected projects',
      'index.role.luggage': 'Game Mechanics',
      'index.role.gol': 'Game Programming',
      'index.footer.developedBy': 'Developed by Dominik Barański',
      'index.footer.githubProfile': 'My GitHub Profile',
      'index.footer.linkedin': 'LinkedIn',

      'luggage.desc':
        'At Rubens Games I programmed and integrated several mechanics for <strong>Luggage Please</strong> (<strong>Unity</strong>).<br/>Below are the three most important ones I created. Art assets were provided by the studio.',
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

      'luggage.back': '← Back to Portfolio Home',
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
      'gol.back': '← Back to Portfolio Home',
      'gol.footer.developedBy': 'Developed by Dominik Barański.',
      'gol.footer.githubProfile': 'My GitHub Profile',
    },
    pl: {
      'index.subtitle': 'Portfolio programisty gier',
      'index.nav.home': 'Start',
      'index.nav.projects': 'Projekty',
      'index.nav.github': 'GitHub',
      'index.nav.linkedin': 'LinkedIn',
      'index.nav.contact': 'Kontakt',
      'index.hero.line1': 'Programista gier',
      'index.hero.line2': 'mechaniki, które widać w rozgrywce.',
      'index.hero.lead':
        'Unity i C# — gameplay, systemy i narzędzia. Stawiam na czytelność, wydajność i „feel”.',
      'index.hero.cta': 'Zobacz projekty',
      'index.hero.photoHint': 'Zdjęcie wkrótce',
      'index.section.projects': 'Wybrane projekty',
      'index.role.luggage': 'Mechaniki gry',
      'index.role.gol': 'Programowanie gier',
      'index.footer.developedBy': 'Zrobione przez Dominika Barańskiego',
      'index.footer.githubProfile': 'Mój profil GitHub',
      'index.footer.linkedin': 'LinkedIn',

      'luggage.desc':
        'W Rubens Games zaprogramowałem i zintegrowałem kilka mechanik do <strong>Luggage Please</strong> (<strong>Unity</strong>).<br/>Poniżej trzy najważniejsze, które stworzyłem. Grafiki dostarczyło studio.',
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

      'luggage.back': '← Wróć do strony głównej portfolio',
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
      'gol.back': '← Wróć do strony głównej portfolio',
      'gol.footer.developedBy': 'Opracowane przez Dominika Barańskiego.',
      'gol.footer.githubProfile': 'Mój profil GitHub',
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

