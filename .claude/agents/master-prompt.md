# Master prompt — budowa portfolio Unity (3 projekty)

Wklej to jako pierwszą wiadomość w głównej sesji Claude Code, uruchomionej
w katalogu repo portfolio (obok masz też dostęp do 3 folderów z kodem gier).

---

Twoim zadaniem jest zbudować portfolio gamedev (junior/mid Unity developer)
na bazie 3 istniejących projektów Unity oraz istniejącej strony portfolio
(repo: Portfolio, styl docelowy: "art tech").

Masz do dyspozycji 4 subagentów zdefiniowanych w `.claude/agents/`:
- `project-extractor` — analizuje kod jednego projektu Unity, zwraca surowy
  inwentarz systemów (bez oceny ważności)
- `portfolio-curator` — filtruje inwentarz i pisze treść case studies pod
  kątem rekrutera
- `portfolio-designer` — robi layout/styl na gotowej treści
- `portfolio-auditor` — finalny audyt całości

## Kolejność pracy (przestrzegaj ściśle)

1. **Ekstrakcja (równolegle)** — uruchom `project-extractor` osobno dla
   każdego z 3 projektów (podaj ścieżkę do każdego jako kontekst). Te trzy
   wywołania są niezależne i mogą iść równolegle, bo agent tylko czyta kod.
   Zbierz 3 surowe inwentarze.

2. **Kuracja treści (sekwencyjnie)** — dopiero gdy wszystkie 3 inwentarze
   są gotowe, przekaż je do `portfolio-curator`. Ma napisać treść case
   study dla każdego z 3 projektów + sekcję na stronę główną spinającą
   wszystkie trzy. Nie zaczynaj kolejnego kroku, dopóki curator nie skończy
   wszystkich 3 case studies.

3. **Layout (sekwencyjnie, na gotowej treści)** — `portfolio-designer`
   dostaje gotową treść od curatora i robi layout/stylowanie strony
   głównej + 3 podstron case study, w stylu "art tech" (spójnie z tym co
   już istnieje w repo Portfolio).

4. **Audyt końcowy** — `portfolio-auditor` czyta całą gotową stronę i
   sprawdza:
   - czy nie wróciły detale typu "parametr/balans gry" zamiast systemów
   - czy proporcje treści są sensowne (żadna sekcja nie dominuje bez powodu)
   - czy żargon techniczny jest wyjaśniony na tyle, żeby zrozumiał go
     rekruter bez kontekstu danej gry
   - czy każdy case study broni się w 30–60 sekund czytania

Jeśli auditor zgłosi problemy, wróć do odpowiedniego kroku (curator dla
treści, designer dla layoutu) i popraw — nie idź dalej z nierozwiązanymi
uwagami audytora.

## Ważne: istniejąca wersja portfolio nie jest punktem odniesienia

W repo Portfolio jest już wcześniejsza wersja strony (treść i/lub layout).
Nie traktuj jej jako bazy do zachowania czy rozwinięcia — właściciel jej
nie akceptuje. Każdy subagent (curator, designer, auditor) ma prawo i
obowiązek **kwestionować wszystko**, co już istnieje: strukturę, dobór
treści, styl wizualny, decyzje o tym co jest "case study" a co nie. Nie
zakładaj, że coś zostało tak zrobione celowo — oceniaj każdy element od
zera wg kryteriów z instrukcji danego subagenta (test SYSTEM vs PARAMETR,
test rekrutera 30-60 sekund, spójność stylu).

Jedyne co jest ustalone i nie podlega kwestionowaniu: ogólny kierunek
stylistyczny "art tech" (chyba że sam dojdziesz do wniosku, że nawet to
nie działa — wtedy zgłoś to wprost zamiast po cichu zmieniać).

## Zasady ogólne

- Nie modyfikuj kodu źródłowego 3 projektów gier — tylko czytaj.
- Cała praca zapisowa (Write/Edit) dzieje się wyłącznie w repo portfolio.
- Pracuj sekwencyjnie na etapach 2–4 (jeden na raz kończy pracę, zanim
  zacznie się kolejny) — to małe repo, nie trzeba worktrees.
- Zanim zaczniesz, pokaż mi krótki plan (które foldery to które projekty,
  gdzie w repo portfolio wylądują case studies) i poczekaj na moje ok.
