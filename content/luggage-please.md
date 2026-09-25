<!--
Case study: Luggage Please. Najpierw EN (główna wersja strony), potem PL, ta sama struktura. URL: luggage-please.html.
Źródło: inwentarz project-extractor (2026-09-25, ponowna analiza zaktualizowanej kopii), niejasności sprawdzone w kodzie C:\Projects\Unity\Luggage please.
Fakty potwierdzone przez właściciela: staż w studiu Rubens Games, grafika od studia, gra nigdy niewydana (brak linku do sklepu i publicznego repo),
zgoda studia na pokazanie fragmentów kodu. Liczebność zespołu niepotwierdzona, więc nie podaję liczby, tylko „zespół studia”.
Opisuję wyłącznie 3 systemy wybrane przez właściciela. Bez tabeli „Key numbers”: projekt nie ma pomiarów, a same liczniki byłyby wypełniaczem
(jedyny mocny fakt liczbowy, 27 prefabów w skanerze, jest w prozie systemu 2).
Wszystkie media już istnieją (3 nagrania YouTube, 3 zrzuty, key art). Nagrań nie oglądałem, więc podpisy opisują zrzuty ekranu.
Linie „Materiał:” to wskazówki dla designera, nie treść do publikacji.
Tabele „Systems on this page” / „Systemy na tej stronie” oraz linie „Caption:” / „Podpis:” to treść dla odwiedzających.
-->

## EN

### Luggage Please

*Systems I built during my internship at Rubens Games: suitcase physics, an X-ray scanner made of URP renderer features, and a contextual interaction wheel.*

Luggage Please is a first-person airport security game made by a studio team at Rubens Games, where I was an intern. The studio's artists made the art. This case study covers three systems I built during the internship: suitcase and item physics, an X-ray scanner that tells materials apart, and a contextual interaction wheel for talking to passengers.

Materiał: obraz hero: `images/luggage-please/key-art.webp` (key art gry, 2388×1668; og:image: `images/luggage-please/og.jpg`). To grafika studia Rubens Games, a nie właściciela, stąd kredyt w podpisie poniżej. To grafika tytułowa, nie kadr z rozgrywki; same systemy pokazują zrzuty i nagrania w sekcjach. Alt EN: „The Luggage Please key art: a cartoon open suitcase packed with clothes and a rubber duck, surrounded by a pistol, a knife, a goldfish and an open book, above the game's title.” Alt PL: „Grafika tytułowa Luggage Please: rysunkowa otwarta walizka z ubraniami i gumową kaczką, a wokół niej pistolet, nóż, złota rybka i otwarta książka; pod spodem tytuł gry.”

Caption: Key art: Rubens Games.

**At a glance**

- **Team:** studio team at Rubens Games (internship); art by the studio's artists
- **Covered here:** three systems I built: suitcase and item physics, the X-ray scanner, the contextual interaction wheel
- **Engine:** Unity 2022.3, URP
- **Platform:** PC
- **Status:** internship project, not released
- **Key tech (in these systems):** C#, Rigidbody physics, physics queries (`OverlapBox`, `BoxCast`), URP Renderer Features (RenderObjects), culling masks, RenderTexture, uGUI, TextMeshPro
- **Code:** studio project, not public; the snippets on this page are shown with Rubens Games' permission

**Systems on this page**

| # | System | Skills |
|---|---|---|
| 1 | Suitcase physics that runs only while the case is open | Rigidbody forces · physics queries · kinematic switching |
| 2 | An X-ray scanner built from layers and URP renderer features | URP RenderObjects · culling masks · RenderTexture |
| 3 | An interaction wheel whose options follow the passenger's checkpoint | uGUI · UI separate from game logic · coroutines |

#### 1. Suitcase physics that runs only while the case is open

**Problem:** A packed suitcase has to act as one solid object when the player carries it, throws it or sends it through the scanner. On the inspection stand, the same case has to open into loose items that the player can pick up, turn over and repack, and the lid must not close through an item left sticking out.

**How it works:** Item physics runs only while the case is open for inspection. Once the lid shuts, a bounds check (`OverlapBox`) decides what ended up inside. Those items become children of the case and turn kinematic, which means they move only with their parent, and their colliders switch off. A closed case therefore moves as one body with no per-item physics, and anything left outside stays behind. While the case is open, a grabbed item is pulled toward the cursor by forces rather than teleported, so it still pushes other items aside. The right mouse button switches to rotating it, and a key restores its original orientation. Holding a key while dragging shows where the item will land: a translucent, non-colliding copy on its own layer. A URP RenderObjects feature draws it, the same technique behind the scanner in system 2. A stepped `BoxCast`, a box-shaped raycast that accounts for the item's size, lowers the copy onto the first surface below. While the lid closes, an `OverlapBox` around it runs every frame, and any item in its path sends the lid back open.

**What it shows:** Physics interaction designed around when simulation is actually needed: items simulate only while the player can touch them, and they change state at two clear points, lid open and lid shut. It also shows physics queries used as game logic. The lid is animated by rotation, not simulated, so instead of waiting for collision events it checks every frame whether anything is in its way.

Materiał: nagranie YouTube https://www.youtube.com/watch?v=j2EKQQgl6fg oraz zrzut `images/luggage-please/suitcase_preview.png` (otwarta walizka widziana z góry, z zapakowanymi przedmiotami) jako statyczny podgląd tego nagrania. Nagrania nie oglądałem, więc podpis poniżej opisuje tylko zrzut. Fragment kodu: `LuggageAnimator.CheckCollisions()`, plik `Assets/Scripts/Inspection/Luggage Animator.cs` w projekcie `C:\Projects\Unity\Luggage please` (w nazwie pliku jest spacja), linie 90–104. Skopiować dosłownie, usuwając tylko wspólne wcięcie 4 spacji i spacje na końcu linii. Na stronie podpisać fragment nazwą klasy i metody (`LuggageAnimator.CheckCollisions()`), a nie nazwą pliku. W 15 liniach widać całe sprawdzanie: `OverlapBox` wokół collidera wieka z maską warstw przedmiotów i odwrócenie animacji przy trafieniu.

Caption: An open case: while the lid is up, every item inside is its own physics object that can be grabbed, turned and repacked.

#### 2. An X-ray scanner built from layers and URP renderer features

**Problem:** The scanner shows a live see-through image of the suitcase as it rides through the machine. Items are coloured by material category (metal, organic, other), so the player can spot suspicious contents. The item models come from the studio's artists, and some combine several materials, so the colouring can't rely on code written for each item.

**How it works:** The colour separation is configuration, not C#. Every item's mesh parts sit on one of four X-ray layers: other, metal, organic, and the case shell. An orthographic scan camera sees only those layers and renders into a RenderTexture, which is shown on the console's screen model. Four RenderObjects renderer features draw those objects with an override material, one feature per layer. Renderer features are extra render passes set up in URP's renderer asset. The override material is one fresnel shader in a different colour for each category. Fresnel brightens surfaces that face sideways to the camera, so items read as glowing outlines. A short script slides the scan camera along with the case as the belt carries it through.

**What it shows:** Using URP's building blocks instead of writing rendering code: layers, a culling mask, RenderObjects features with override materials, and a RenderTexture on a screen inside the game world. The setup also scales with content. The scanner covers 27 item prefabs, and a prop made of several materials, such as a drone, shows several colours because each of its parts sits on its own layer. Adding an item takes no code, only the right layers in its prefab.

Materiał: diagram (główny materiał tej sekcji, bez fragmentu kodu), nagranie YouTube https://www.youtube.com/watch?v=g5YQQ2sDoTU oraz zrzut `images/luggage-please/xray_previev.png` (ekran konsoli z walizką w fałszywych kolorach) jako statyczny podgląd tego nagrania. Literówka „previev” jest w prawdziwej nazwie pliku, więc trzeba użyć dokładnie tej ścieżki. Diagram: pipeline od lewej do prawej, etykiety EN / PL. (1) [Item mesh parts / Części modeli przedmiotów] z dopiskiem [4 layers: other · metal · organic · case shell / 4 warstwy: inne · metal · organiczne · skorupa walizki]. (2) [Scan camera (orthographic) / Kamera skanera (ortograficzna)] z dopiskiem [Culling mask: X-ray layers only / Culling mask: tylko warstwy rentgena]; przy niej mała strzałka w bok [Follows the case / Podąża za walizką]. (3) [4 × RenderObjects] z dopiskiem [Override material per layer / Materiał nadpisujący na warstwę], a pod spodem [One fresnel shader, 4 colours / Jeden shader fresnela, 4 kolory]. (4) [RenderTexture]. (5) [Console screen material / Materiał ekranu konsoli]. Nie podpisywać renderer features jako działających „tylko w kamerze skanera”, bo tego nie zweryfikowano. Nazwy warstw i feature'ów niesie diagram, a proza wyjaśnia, po co są. Kod: celowo bez fragmentu, bo sedno sekcji to konfiguracja. Jedyny sensowny kandydat, `CameraFollowLuggage` (`Assets/Scripts/X-Ray/CameraFollowLuggage.cs`, linie 12–27), to 16 linii przesuwania kamery, które rozmyłyby przekaz. Opcjonalnie, tylko jeśli właściciel go zrobi: zrzut inspektora renderera URP z czterema feature'ami RenderObjects (filtr warstwy i materiał nadpisujący) jako dowód, że to konfiguracja. Bez niego sekcja jest kompletna.

Caption: The scanner's console screen: organic items such as the fruit show in yellow, metal in orange, and everything else, including the case shell, in teal.

#### 3. An interaction wheel whose options follow the passenger's checkpoint

**Problem:** Passengers need different actions depending on where they are in the airport flow: what makes sense in the queue is wrong at the metal detector gate. Choosing an action should be quick and shouldn't pull the player out of the game view into a full-screen menu.

**How it works:** The NPC's interaction code builds a list of option IDs from the passenger's state. Each checkpoint (queue, bag drop, metal detector gate, weighing) has its own set, and an overweight option is added only when that passenger's bag is on the scale. The wheel is built in plain uGUI. It shows only the pre-built segments whose IDs are on the list and uses trigonometry to spread them evenly around a circle, however many there are. Hovering an option shows its name in the centre. The calling coroutine waits until the player picks an option or closes the wheel, then runs the matching action.

**What it shows:** A UI component kept separate from game logic. The wheel receives a list of IDs, lays out as many segments as it gets and reports the pick, while all the airport rules stay in the NPC code. The wheel also owns its input mode in `OnEnable`/`OnDisable`: opening it freezes mouse-look and movement and frees the cursor, and closing it restores both, so no caller has to remember to.

Materiał: nagranie YouTube https://www.youtube.com/watch?v=lBOSJhvBtVM oraz zrzut `images/luggage-please/wheel_preview.png` (koło z trzema opcjami i napisem „SHOW TICKET” w środku) jako statyczny podgląd tego nagrania. Zrzut zgadza się z kodem: trzy opcje co 120°, ze środkami na 60°, 180° i 300°, dokładnie tak, jak liczy `CalculateSegmentPosition`. Fragment kodu: `DialogWheel.PositionDialogSegment()` + `CalculateSegmentPosition()`, plik `Assets/Scripts/DialogWheel/DialogWheel.cs` w projekcie `C:\Projects\Unity\Luggage please`, linie 100–123. Skopiować dosłownie, usuwając tylko wspólne wcięcie 4 spacji. W 24 liniach widać, że układ zależy wyłącznie od liczby opcji: 360° dzielone przez liczbę segmentów, a każdy segment stoi w środku swojego wycinka. Innych plików tego systemu (np. `NPC Interactions.cs`) nie pokazywać.

Caption: Three options, so each takes a third of the circle; hovering an option shows its name in the centre.

#### Takeaway

All three are built so that other people's work can plug in. The scanner and the drop preview are made of layers and URP renderer features rather than rendering code, so a new item model shows up on the scanner in its category colour once its parts are on the right layers. The wheel takes a list of option IDs from its caller and doesn't need to know why they were chosen. The layers even reach into physics: the lid's obstruction check uses the X-ray item layers as its mask, so one layer scheme serves both rendering and physics.

## PL

### Luggage Please

*Systemy, które zbudowałem na stażu w Rubens Games: fizyka walizki, skaner rentgenowski złożony z renderer features URP i kontekstowe koło interakcji.*

Luggage Please to gra z widokiem z pierwszej osoby o kontroli bezpieczeństwa na lotnisku, tworzona przez zespół studia Rubens Games, w którym byłem na stażu. Grafikę przygotowali artyści studia. Opisuję tu trzy systemy, które zbudowałem w czasie stażu: fizykę walizki i przedmiotów, skaner rentgenowski rozróżniający materiały i kontekstowe koło interakcji do rozmów z pasażerami.

Materiał: obraz hero: `images/luggage-please/key-art.webp` (key art gry, 2388×1668; og:image: `images/luggage-please/og.jpg`). To grafika studia Rubens Games, a nie właściciela, stąd kredyt w podpisie poniżej. To grafika tytułowa, nie kadr z rozgrywki; same systemy pokazują zrzuty i nagrania w sekcjach. Alt EN: „The Luggage Please key art: a cartoon open suitcase packed with clothes and a rubber duck, surrounded by a pistol, a knife, a goldfish and an open book, above the game's title.” Alt PL: „Grafika tytułowa Luggage Please: rysunkowa otwarta walizka z ubraniami i gumową kaczką, a wokół niej pistolet, nóż, złota rybka i otwarta książka; pod spodem tytuł gry.”

Podpis: Grafika: Rubens Games.

**W skrócie**

- **Zespół:** zespół studia Rubens Games (staż); grafika od artystów studia
- **Opisuję tu:** trzy zbudowane przeze mnie systemy: fizykę walizki i przedmiotów, skaner rentgenowski, kontekstowe koło interakcji
- **Silnik:** Unity 2022.3, URP
- **Platforma:** PC
- **Status:** projekt ze stażu, niewydany
- **Kluczowe technologie (w tych systemach):** C#, fizyka Rigidbody, zapytania fizyczne (`OverlapBox`, `BoxCast`), URP Renderer Features (RenderObjects), culling mask, RenderTexture, uGUI, TextMeshPro
- **Kod:** projekt studia, niepubliczny; fragmenty kodu na tej stronie pokazuję za zgodą Rubens Games

**Systemy na tej stronie**

| # | System | Umiejętności |
|---|---|---|
| 1 | Fizyka przedmiotów działająca tylko w otwartej walizce | Siły Rigidbody · zapytania fizyczne · przełączanie w tryb kinematyczny |
| 2 | Skaner rentgenowski zbudowany z warstw i renderer features URP | URP RenderObjects · culling mask · RenderTexture |
| 3 | Koło interakcji, którego opcje zależą od stanowiska pasażera | uGUI · UI oddzielone od logiki gry · korutyny |

#### 1. Fizyka przedmiotów działająca tylko w otwartej walizce

**Problem:** Spakowana walizka musi zachowywać się jak jeden solidny obiekt, gdy gracz ją niesie, rzuca albo wysyła przez skaner. Na stanowisku kontroli ta sama walizka ma się otworzyć i zamienić w luźne przedmioty, które gracz może podnieść, obrócić i spakować z powrotem, a wieko nie może się zamknąć przez wystający przedmiot.

**Jak działa:** Fizyka przedmiotów działa tylko wtedy, gdy walizka jest otwarta do kontroli. Po zamknięciu wieka sprawdzenie granic walizki (`OverlapBox`) ustala, co znalazło się w środku. Te przedmioty stają się dziećmi walizki i przechodzą w tryb kinematyczny, czyli poruszają się tylko razem z rodzicem, a ich collidery się wyłączają. Zamknięta walizka porusza się więc jak jedno ciało, bez fizyki poszczególnych przedmiotów, a to, co zostało na zewnątrz, zostaje na miejscu. Przy otwartej walizce chwycony przedmiot jest przyciągany do kursora siłami, a nie teleportowany, więc nadal odpycha inne przedmioty. Prawy przycisk myszy przełącza na obracanie, a jeden klawisz przywraca pierwotną orientację przedmiotu. Przytrzymanie klawisza podczas przeciągania pokazuje, gdzie przedmiot wyląduje: półprzezroczystą kopię bez kolizji, na osobnej warstwie. Rysuje ją renderer feature URP typu RenderObjects, czyli ta sama technika, na której opiera się skaner z systemu 2. Krokowy `BoxCast`, czyli rzut prostopadłościanu uwzględniający rozmiar przedmiotu, opuszcza kopię na pierwszą powierzchnię pod spodem. Podczas zamykania wieka co klatkę działa `OverlapBox` wokół niego, a każdy przedmiot na jego drodze sprawia, że wieko otwiera się z powrotem.

**Co to pokazuje:** Projektowanie interakcji fizycznych wokół tego, kiedy symulacja jest naprawdę potrzebna: przedmioty są symulowane tylko wtedy, gdy gracz może ich dotknąć, a stan zmieniają w dwóch wyraźnych momentach, przy otwarciu i zamknięciu wieka. Do tego zapytania fizyczne użyte jako logika gry. Wieko jest animowane obrotem, a nie symulowane, więc zamiast czekać na zdarzenia kolizji, co klatkę samo sprawdza, czy coś stoi mu na drodze.

Materiał: nagranie YouTube https://www.youtube.com/watch?v=j2EKQQgl6fg oraz zrzut `images/luggage-please/suitcase_preview.png` (otwarta walizka widziana z góry, z zapakowanymi przedmiotami) jako statyczny podgląd tego nagrania. Nagrania nie oglądałem, więc podpis poniżej opisuje tylko zrzut. Fragment kodu: `LuggageAnimator.CheckCollisions()`, plik `Assets/Scripts/Inspection/Luggage Animator.cs` w projekcie `C:\Projects\Unity\Luggage please` (w nazwie pliku jest spacja), linie 90–104. Skopiować dosłownie, usuwając tylko wspólne wcięcie 4 spacji i spacje na końcu linii. Na stronie podpisać fragment nazwą klasy i metody (`LuggageAnimator.CheckCollisions()`), a nie nazwą pliku. W 15 liniach widać całe sprawdzanie: `OverlapBox` wokół collidera wieka z maską warstw przedmiotów i odwrócenie animacji przy trafieniu.

Podpis: Otwarta walizka: dopóki wieko jest podniesione, każdy przedmiot w środku jest osobnym obiektem fizycznym, który można chwycić, obrócić i spakować z powrotem.

#### 2. Skaner rentgenowski zbudowany z warstw i renderer features URP

**Problem:** Skaner pokazuje na żywo prześwietlony obraz walizki przejeżdżającej przez maszynę. Przedmioty mają kolory według kategorii materiału (metal, organiczne, inne), żeby gracz mógł wypatrzyć podejrzaną zawartość. Modele przedmiotów przygotowali artyści studia, a część z nich łączy kilka materiałów, więc kolorowanie nie może opierać się na kodzie pisanym osobno dla każdego przedmiotu.

**Jak działa:** Podział na kolory to konfiguracja, a nie kod C#. Każda część modelu przedmiotu leży na jednej z czterech warstw rentgena: inne, metal, organiczne i skorupa walizki. Ortograficzna kamera skanera widzi tylko te warstwy i renderuje do RenderTexture, wyświetlanej na modelu ekranu konsoli. Cztery renderer features typu RenderObjects, po jednym na warstwę, rysują te obiekty z materiałem nadpisującym. Renderer features to dodatkowe przebiegi renderowania ustawiane w assecie renderera URP. Materiał nadpisujący to jeden shader fresnela w innym kolorze dla każdej kategorii. Efekt fresnela rozjaśnia powierzchnie ustawione bokiem do kamery, więc przedmioty wyglądają jak świecące kontury. Krótki skrypt przesuwa kamerę skanera razem z walizką, gdy taśma przewozi ją przez maszynę.

**Co to pokazuje:** Użycie gotowych elementów URP zamiast pisania kodu renderowania: warstwy, culling mask, renderer features RenderObjects z materiałami nadpisującymi i RenderTexture na ekranie w świecie gry. Rozwiązanie skaluje się też z zawartością. Skaner obsługuje 27 prefabów przedmiotów, a rekwizyt z kilku materiałów, np. dron, ma kilka kolorów, bo każda jego część leży na własnej warstwie. Dodanie przedmiotu nie wymaga kodu, tylko właściwych warstw w jego prefabie.

Materiał: diagram (główny materiał tej sekcji, bez fragmentu kodu), nagranie YouTube https://www.youtube.com/watch?v=g5YQQ2sDoTU oraz zrzut `images/luggage-please/xray_previev.png` (ekran konsoli z walizką w fałszywych kolorach) jako statyczny podgląd tego nagrania. Literówka „previev” jest w prawdziwej nazwie pliku, więc trzeba użyć dokładnie tej ścieżki. Diagram: pipeline od lewej do prawej, etykiety EN / PL. (1) [Item mesh parts / Części modeli przedmiotów] z dopiskiem [4 layers: other · metal · organic · case shell / 4 warstwy: inne · metal · organiczne · skorupa walizki]. (2) [Scan camera (orthographic) / Kamera skanera (ortograficzna)] z dopiskiem [Culling mask: X-ray layers only / Culling mask: tylko warstwy rentgena]; przy niej mała strzałka w bok [Follows the case / Podąża za walizką]. (3) [4 × RenderObjects] z dopiskiem [Override material per layer / Materiał nadpisujący na warstwę], a pod spodem [One fresnel shader, 4 colours / Jeden shader fresnela, 4 kolory]. (4) [RenderTexture]. (5) [Console screen material / Materiał ekranu konsoli]. Nie podpisywać renderer features jako działających „tylko w kamerze skanera”, bo tego nie zweryfikowano. Nazwy warstw i feature'ów niesie diagram, a proza wyjaśnia, po co są. Kod: celowo bez fragmentu, bo sedno sekcji to konfiguracja. Jedyny sensowny kandydat, `CameraFollowLuggage` (`Assets/Scripts/X-Ray/CameraFollowLuggage.cs`, linie 12–27), to 16 linii przesuwania kamery, które rozmyłyby przekaz. Opcjonalnie, tylko jeśli właściciel go zrobi: zrzut inspektora renderera URP z czterema feature'ami RenderObjects (filtr warstwy i materiał nadpisujący) jako dowód, że to konfiguracja. Bez niego sekcja jest kompletna.

Podpis: Ekran konsoli skanera: przedmioty organiczne, np. owoce, świecą na żółto, metalowe na pomarańczowo, a cała reszta, łącznie ze skorupą walizki, na turkusowo.

#### 3. Koło interakcji, którego opcje zależą od stanowiska pasażera

**Problem:** Pasażer potrzebuje innych akcji zależnie od tego, na jakim etapie odprawy się znajduje: to, co ma sens w kolejce, jest nie na miejscu przy bramce z wykrywaczem metalu. Wybór ma być szybki i nie może wyrywać gracza z widoku gry do pełnoekranowego menu.

**Jak działa:** Kod interakcji z NPC buduje listę identyfikatorów opcji na podstawie stanu pasażera. Każde stanowisko (kolejka, nadanie bagażu, bramka z wykrywaczem metalu, ważenie) ma własny zestaw, a opcja nadbagażu dochodzi tylko wtedy, gdy na wadze leży bagaż właśnie tego pasażera. Koło jest zbudowane w czystym uGUI. Pokazuje tylko gotowe segmenty o identyfikatorach z listy i rozkłada je równo na okręgu za pomocą trygonometrii, bez względu na ich liczbę. Po najechaniu kursorem na opcję jej nazwa pojawia się w środku. Wywołująca korutyna czeka, aż gracz wybierze opcję albo zamknie koło, i wtedy uruchamia odpowiednią akcję.

**Co to pokazuje:** Komponent UI oddzielony od logiki gry. Koło dostaje listę identyfikatorów, rozmieszcza tyle segmentów, ile otrzyma, i zwraca wybór, a wszystkie reguły lotniska zostają w kodzie NPC. Koło samo zarządza też trybem sterowania w `OnEnable`/`OnDisable`: otwarcie zamraża rozglądanie się i ruch oraz odblokowuje kursor, a zamknięcie przywraca jedno i drugie, więc żaden wywołujący nie musi o tym pamiętać.

Materiał: nagranie YouTube https://www.youtube.com/watch?v=lBOSJhvBtVM oraz zrzut `images/luggage-please/wheel_preview.png` (koło z trzema opcjami i napisem „SHOW TICKET” w środku) jako statyczny podgląd tego nagrania. Zrzut zgadza się z kodem: trzy opcje co 120°, ze środkami na 60°, 180° i 300°, dokładnie tak, jak liczy `CalculateSegmentPosition`. Fragment kodu: `DialogWheel.PositionDialogSegment()` + `CalculateSegmentPosition()`, plik `Assets/Scripts/DialogWheel/DialogWheel.cs` w projekcie `C:\Projects\Unity\Luggage please`, linie 100–123. Skopiować dosłownie, usuwając tylko wspólne wcięcie 4 spacji. W 24 liniach widać, że układ zależy wyłącznie od liczby opcji: 360° dzielone przez liczbę segmentów, a każdy segment stoi w środku swojego wycinka. Innych plików tego systemu (np. `NPC Interactions.cs`) nie pokazywać.

Podpis: Trzy opcje, więc każda zajmuje jedną trzecią okręgu; po najechaniu kursorem na opcję jej nazwa pojawia się w środku.

#### Wnioski

Wszystkie trzy systemy są zbudowane tak, żeby mogła się do nich podłączyć praca innych osób. Skaner i podgląd lądowania składają się z warstw i renderer features URP, a nie z kodu renderowania, więc nowy model przedmiotu pojawia się w skanerze w kolorze swojej kategorii, gdy tylko jego części trafią na właściwe warstwy. Koło dostaje od wywołującego listę identyfikatorów opcji i nie musi wiedzieć, skąd się wzięły. Warstwy sięgają nawet fizyki: sprawdzanie, czy coś blokuje wieko, używa warstw przedmiotów z rentgena jako maski, więc jeden układ warstw obsługuje i renderowanie, i fizykę.
