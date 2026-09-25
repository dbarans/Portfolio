<!--
Strona główna. Najpierw EN (główna wersja strony), potem PL, ta sama struktura.
Sekcja projektów ma 3 karty: Game of Life, Grave, Luggage Please.
Fakty i dane kontaktowe potwierdzone przez właściciela (e-mail dodany na jego prośbę). Staż w Rubens Games: lipiec–wrzesień 2024.
Stopka: tylko „© 2026 Dominik Barański”, bez lokalizacji, statusu remote i linku do CV (brak danych).
Linia meta każdej karty ma zawsze tę samą kolejność: platforma · silnik · zespół · status
(te same wartości co kicker w case study, gdzie kolejność to: platforma · silnik · zespół · kontekst).
Aria-labels (EN → PL) są na końcu sekcji PL.
-->

## EN

### Hero

**Dominik Barański: Unity developer**

I build game systems in Unity and C# with a focus on performance and testable code. My work ranges from a multithreaded simulation engine in an Android game with 15,000+ downloads on Google Play to enemy AI, pathfinding, visibility and procedural dungeons in a 2D team project. As an intern at Rubens Games, I also built gameplay systems in a studio team, alongside the studio's artists. I'm looking for a junior/mid Unity developer role.

Unity · C# · Burst / Job System · URP shaders · Android

### Projects

#### Game of Life

Android · Unity 2022.3 · solo · 15,000+ downloads on Google Play

A Game of Life simulator that has to handle hundreds of thousands of live cells on a phone. The work is in the engine: bit-level computation on Burst and the Job System, a simulation thread that doesn't block the frame, and rendering whose cost follows the screen rather than the pattern.

[See how the engine works →](game-of-life.html)

#### Grave

PC · Unity 6 URP 2D · team of 4 · engineering thesis

A top-down 2D survival horror made by a team of four. Four of the systems I built for it: A* pathfinding with a bounded per-frame cost, a light mask rendered by a second camera and custom shaders, a seeded dungeon generator covered by 48 unit tests, and enemy AI assembled from swappable components.

[See the systems →](grave.html)

#### Luggage Please

PC · Unity 2022.3 URP · studio team · internship at Rubens Games, July–September 2024

A first-person airport security game made by a studio team at Rubens Games, where I was an intern. Three systems I built for it: suitcase physics that runs only while a case is being inspected, an X-ray scanner that colours items by material using URP layers and renderer features with no rendering code, and an interaction wheel whose options follow each passenger's checkpoint.

[See how they work →](luggage-please.html)

### Contact

Happy to walk through the code behind these projects in an interview.

- Email: [baranskidominik109@gmail.com](mailto:baranskidominik109@gmail.com)
- LinkedIn: [linkedin.com/in/baranskidominik](https://www.linkedin.com/in/baranskidominik/)
- GitHub: [github.com/dbarans](https://github.com/dbarans)

### Footer

© 2026 Dominik Barański

Materiał: aria-labels strony głównej (EN i PL) są na końcu sekcji PL.

## PL

### Hero

**Dominik Barański: Unity developer**

Buduję systemy gier w Unity i C#, dbając o wydajność i testowalność kodu. Moja praca obejmuje zarówno wielowątkowy silnik symulacji w grze na Androida z ponad 15 000 pobrań w Google Play, jak i AI przeciwników, pathfinding, system widoczności oraz generator lochów w zespołowym projekcie 2D. Na stażu w Rubens Games budowałem też systemy rozgrywki w zespole studia, razem z jego grafikami. Szukam pracy jako junior/mid Unity developer.

Unity · C# · Burst / Job System · shadery URP · Android

### Projekty

#### Game of Life

Android · Unity 2022.3 · solo · 15 000+ pobrań w Google Play

Symulator gry w życie, który na telefonie musi poradzić sobie z setkami tysięcy żywych komórek. Najważniejsza praca kryje się w silniku: obliczenia na bitach w Burst i Job System, wątek symulacji, który nie blokuje renderowania, i renderowanie, którego koszt zależy od ekranu, a nie od wielkości wzorca.

[Zobacz, jak działa silnik →](game-of-life.html)

#### Grave

PC · Unity 6 URP 2D · zespół 4 osób · praca inżynierska

Survival horror 2D z widokiem z góry, zrobiony w 4-osobowym zespole. Cztery z systemów, które do niego zbudowałem: pathfinding A* o ograniczonym koszcie na klatkę, maska światła renderowana przez drugą kamerę i własne shadery, generator lochów z seeda pokryty 48 testami jednostkowymi i AI przeciwników składane z wymiennych komponentów.

[Zobacz systemy →](grave.html)

#### Luggage Please

PC · Unity 2022.3 URP · zespół studia · staż w Rubens Games, lipiec–wrzesień 2024

Gra z widokiem z pierwszej osoby o kontroli bezpieczeństwa na lotnisku, tworzona przez zespół studia Rubens Games, w którym byłem na stażu. Trzy systemy, które do niej zbudowałem: fizyka walizki działająca tylko w trakcie jej kontroli, skaner rentgenowski kolorujący przedmioty według materiału za pomocą warstw i renderer features URP, bez kodu renderowania, oraz koło interakcji, którego opcje zależą od stanowiska, na którym jest pasażer.

[Zobacz, jak działają →](luggage-please.html)

### Kontakt

Chętnie omówię kod tych projektów na rozmowie.

- E-mail: [baranskidominik109@gmail.com](mailto:baranskidominik109@gmail.com)
- LinkedIn: [linkedin.com/in/baranskidominik](https://www.linkedin.com/in/baranskidominik/)
- GitHub: [github.com/dbarans](https://github.com/dbarans)

### Stopka

© 2026 Dominik Barański

Materiał: Aria-labels (index.html), EN → PL.

- Nawigacja w nagłówku „Main” → „Menu główne”
- Przycisk języka „PL, switch to Polish” → „EN, przełącz na angielski” (już jest w i18n jako `case.lang.aria`, bez zmian)
