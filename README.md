# Wiedźmińskie RPG

Bot RPG na Discordzie z osobną postacią dla każdego użytkownika. Postacie zdobywają poziomy i korony, kupują wyposażenie, przyjmują kontrakty i wyruszają na polowania.

## Komendy

- `!wiedzmin` - utworzenie postaci (jednorazowo); profil sprawdzisz przez `!status`
- `!status` - profil, poziom, zdrowie, korony, wyposażenie, eliksiry, zatrucie i postęp zleceń
- `!szkoly` i `!szkola <nazwa|id>` - wybierz jedną z sześciu wiedźmińskich szkół (np. `!szkola wilk`)
- `!imie <nazwa>` - nazwij swoją postać
- `!misje` - informacje o losowych kontraktach dla poziomów 1-50
- `!misja` - przyjęcie losowego kontraktu dopasowanego do poziomu; trzy ostatnie zlecenia nie powtarzają się, a czas wynosi losowo 80-120% czasu bazowego
- `!polowanie [strona]` - 20 wypraw (od 2 do 30 godzin) ze statusem poziomu i poprzedniego etapu
- `!polowanie info <id>` - podgląd przeciwnika, wymaganego poziomu, czasu i łupów przed wyprawą
- `!polowanie <id>` - wyprawa z łupem i XP; kolejne etapy odblokowują się po pokonaniu bossa poprzedniej wyprawy
- `!ekwipunek` - plecak, miecz stalowy, miecz srebrny i założony pancerz
- `!sklep [strona]` i `!kup <nazwa|id> [ilość]` - uporządkowany katalog przedmiotów i zakup wielu sztuk, np. `!kup jaskolka 2`
- `!skup [strona]` i `!sprzedaj <nazwa|id|wszystko> [ilość]` - kowal skupuje materiały, trofea oraz niezałożone bronie i pancerze
- `!wyposaz <nazwa|id>`, `!mutageny`, `!zdejmijmutagen <nazwa|id>` i `!uzyj <nazwa|id> [ilość]` - sprzęt, maksymalnie sześć mutagenów i używanie wielu mikstur naraz
- `!zielarstwo` - wyślij wiedźmina na 15-minutowe zbiory; po powrocie otrzymasz zioła i XP (odnowienie zbiorów co 30 minut)
- `!zielarstwo status` - sprawdź poziom zielarstwa i czas do kolejnych zbiorów
- `!alchemia` (`!receptury`) i `!wytworz <nazwa|id> [ilość]` - katalog receptur oraz wytwarzanie wielu mikstur lub mutagenów naraz
- `!daily` (`!dzienne`) - trzy codzienne zlecenia odnawiane co 24 godziny; nagrodę odbierzesz przez `!daily odbierz <id>`
- `!arena @gracz` - wyzwij gracza z tego serwera na trzyturowy pojedynek; raz na 2 godziny pojedynek z tą samą osobą jest rankingowy, kolejne są towarzyskie
- `!arena ranking` - ranking PvP według rankingu ELO
- `!ranking [xp|pvp|wyprawy|korony]` - ranking serwera według progresji, walk PvP, ukończonych wypraw lub koron; `!top` jest skrótem do rankingu XP
- `!pomoc [1|2]` - dwustronicowa pomoc z nawigacją w kanale Discord

Nowa postać otrzymuje jednorazowo 150 koron oraz stalowy i srebrny miecz. `!wiedzmin` służy wyłącznie do utworzenia postaci; jej szczegóły wyświetla `!status`. Codzienna tablica zawiera trzy losowe zlecenia, odświeżane 24 godziny od jej utworzenia. Za każde ukończone zlecenie można odebrać 50 + 2 × poziom koron (52–150). Sklep oferuje przedmioty ogólne i rynsztunki sześciu szkół na poziomach do 50. Wymagany poziom i szkoła obowiązują przy zakupie oraz zakładaniu sprzętu. Poza aktywną wyprawą zdrowie regeneruje się w tempie 0,5 PŻ na minutę do maksimum 100 PŻ; podczas aktywności regeneracja jest wstrzymana. Zielarstwo pozwala wysłać wiedźmina na 15-minutowe zbiory, po których automatycznie wraca z 2-4 ziołami alchemicznymi i XP; ponowne zbiory są możliwe co 30 minut od rozpoczęcia. Wraz z kolejnymi poziomami (maks. 5) pojawia się szansa na korzeń mandragory, glistnik, werbenę, oko kruka i tojad. Składniki otwierają dodatkowe przepisy, m.in. Napar z mandragory do leczenia oraz eliksiry Kocie Oko, Wywar Leśny, Czarna Krew i Biała Mewa wzmacniające następne starcie. Część receptur wymaga odpowiedniego poziomu zielarstwa.

Postać ma osobne sloty na miecz stalowy i srebrny. Stalowy wybierany jest przeciw ludziom i wilkom, srebrny przeciw znanym potworom; przy przeciwniku mieszanym lub nierozpoznanym bot używa miecza o lepszych statystykach, nie sumując bonusów z obu. Starsze postacie migrują automatycznie: obecnie założony miecz trafia do właściwego slotu, a drugi jest uzupełniany z posiadanego ekwipunku, jeśli postać go ma.

Szkoła Gryfa łączy niewielkie premie do ataku i obrony z dodatkowym 0,1 PŻ regeneracji na minutę poza wyprawami. Szkoła Mantikory daje +2 do ataku, +1 do obrony i zwiększa leczenie miksturami o 5%, bez dodatkowych premii do rynsztunku. Premie szkół są widoczne przy wyborze w `!szkoly`.

Przedmioty i przepisy można wskazywać po pełnej nazwie albo ID; wielkość liter, polskie znaki i spacje nie mają znaczenia. W komendach obsługujących nazwy wystarczy też wpisać początek nazwy, np. `!sprzedaj temerska`; jeśli pasuje kilka pozycji, bot wyświetli pasujące ID do jednoznacznego wyboru. `!kup <nazwa|id> [ilość]` pozwala kupić kilka sztuk naraz, np. `!kup jaskolka 2`. Sklep grupuje wyposażenie według rodzaju i szkoły oraz porządkuje je według wymaganego poziomu. Kowal odkupuje broń i pancerze za połowę ceny sklepowej, ale nie przyjmuje aktualnie założonego sprzętu. `!sklep [strona]` pokazuje ofertę zakupową, a `!skup [strona]` ceny materiałów, trofeów i sprzętu. Oba katalogi mają osobne przyciski i menu stron; interaktywne menu działa przez 10 minut i jest przypisane do osoby, która je otworzyła.

`!uzyj <nazwa|id> [ilość]` pozwala użyć kilku mikstur jednym poleceniem, np. `!uzyj jaskolka 2`; przy leczeniu zużywana jest tylko liczba mikstur potrzebna do odzyskania zdrowia. Eliksiry bojowe można łączyć przed walką, a ich premie sumują się. Każdy z nich dodaje zatrucie zależnie od siły (25-50 pkt); maksymalny poziom to 100, a dawka przekraczająca limit nie zostanie zużyta. Mikstury leczące nie zwiększają zatrucia. Po każdej walce zatrucie spada o połowę, a poza walką dodatkowo zmniejsza się o 10 pkt na godzinę. Aktualny poziom zatrucia jest widoczny na karcie postaci.

Za ukończone kontrakty i wyprawy zdobywa się doświadczenie; porażka daje tylko 10% bazowego XP. Awans wymaga 100 XP na poziom 2, a próg rośnie o 50 XP z każdym kolejnym poziomem. Do poziomu 50 potrzeba łącznie 63 700 XP. Po osiągnięciu poziomu 50 dalsze XP nie podnosi poziomu, ale korony i łup nadal są przyznawane.

Wyprawy tworzą liniową progresję. Poziom postaci nadal musi spełniać wymagania danej lokacji, a kolejny etap wymaga zwycięstwa nad bossem z poprzedniego etapu. Bossowie na wyprawach są wytrzymalsi i zadają większe obrażenia niż przeciwnicy w kontraktach; nawet przygotowany wiedźmin może przegrać, szczególnie w końcowych etapach. Porażka nie zalicza lokacji i pozwala spróbować ponownie; zaliczone wyprawy można powtarzać. Postęp jest zapisywany na postaci.

Po każdej misji i wyprawie rozgrywana jest tekstowa walka. Raport pokazuje ciosy wiedźmina i potwora, obrażenia, zdrowie po starciu oraz zdobyte nagrody. Atak, krytyki i obrona zależą od szkoły, założonego rynsztunku i mutagenów; przegrana nie daje trofeów ani zwykłego łupu. Pojedynek PvP rozpoczyna się komendą `!arena @gracz`, wymaga przyjęcia wyzwania, a gracze wybierają ruch w tajemnicy. Pierwszy pojedynek danej pary w ciągu 2 godzin jest rankingowy: wygrany otrzymuje 10% koron przeciwnika (maksymalnie 100) i ELO, a remisy aktualizują rating bez transferu koron. Kolejne pojedynki tej pary są towarzyskie — nie zmieniają rankingu, statystyk ani koron.

Bot jest przygotowany do alphatestów na **jednym serwerze Discord**. Komendy i wyniki wypraw obsługuje na `#cwelgar`; nowi członkowie tego serwera otrzymują instrukcję utworzenia postaci komendą `!wiedzmin`. Żeby nie mieszać postaci ani wysyłać raportów na inny serwer, wymagany jest identyfikator serwera w `DISCORD_GUILD_ID`. Bot ogranicza częstotliwość komend: jedna komenda na gracza co 2 sekundy. Gdy bot zostanie dodany do skonfigurowanego serwera, publikuje informację startową na `#cwelgar` lub kanale systemowym.

## Konfiguracja Discorda

1. Utwórz aplikację i bota w [Discord Developer Portal](https://discord.com/developers/applications).
2. W ustawieniach bota włącz **Message Content Intent** i **Server Members Intent**.
3. Zaproś bota na serwer przez OAuth2, wybierając scope `bot`. Przyznaj mu uprawnienia: **View Channels**, **Send Messages**, **Read Message History** i **Embed Links**.
4. Utwórz kanał tekstowy `#cwelgar` i upewnij się, że bot może go widzieć i wysyłać w nim wiadomości.
5. Włącz tryb deweloperski w Discordzie, kliknij prawym przyciskiem swój serwer i skopiuj jego identyfikator. To wartość `DISCORD_GUILD_ID`.
6. Skopiuj token bota jako `DISCORD_TOKEN`. Traktuj go jak hasło: nie wysyłaj go innym osobom, nie umieszczaj w kodzie, README ani na GitHubie. Jeśli token wycieknie, zresetuj go w Developer Portal.

## Uruchomienie lokalne

```powershell
node --version
npm.cmd ci
$env:DISCORD_TOKEN = "<TOKEN_BOTA>"
$env:DISCORD_GUILD_ID = "<ID_SERWERA>"
npm.cmd start
```

Używaj Node.js 20 lub nowszego. Polecenia z `$env:` ustawiają zmienne tylko w bieżącym oknie PowerShell. Zastąp wartości w nawiasach własnymi danymi i nie zapisuj prawdziwego tokenu do pliku śledzonego przez Git. Zatrzymaj bota przez `Ctrl+C`.

Testy przed wdrożeniem:

```powershell
npm.cmd test
node --check rpg.js
node --check witcher-rpg.js
```

## Publikacja na GitHubie

W katalogu projektu sprawdź, że `.gitignore` wyklucza `data.json`, `data.json.bak`, `data.json.tmp` i `.env`. Nie publikuj plików z tokenem ani danych graczy. W tym projekcie `.env` nie jest automatycznie wczytywany — ustawienia dodaj jako zmienne środowiskowe na hostingu.

Po utworzeniu pustego repozytorium na GitHubie uruchom w katalogu projektu:

```powershell
git init
git add .
git status
```

Przed commitem sprawdź wynik `git status`: pliki danych, kopie zapasowe i sekrety nie mogą być staged. Następnie:

```powershell
git commit -m "Prepare Witcher RPG alpha"
git branch -M main
git remote add origin https://github.com/<TWOJ_LOGIN>/<NAZWA_REPO>.git
git push -u origin main
```

Jeśli repozytorium Git jest już skonfigurowane, nie wykonuj ponownie `git init` ani `git remote add origin`; sprawdź `git status` i użyj istniejącej konfiguracji.

## Wdrożenie na hostingu

Wybierz hosting, który obsługuje stale działające procesy Node.js (worker/background service) oraz trwały dysk lub wolumen. Nie wybieraj hostingu, który usypia proces albo usuwa lokalne pliki po restarcie bez trwałego dysku.

1. Połącz usługę hostingową z repozytorium GitHub.
2. Ustaw katalog projektu jako katalog główny, komendę instalacji `npm ci` i komendę startową `npm start`.
3. Dodaj w panelu hostingu zmienne środowiskowe `DISCORD_TOKEN` i `DISCORD_GUILD_ID`. Nie dodawaj tokenu do repozytorium ani do komendy startowej.
4. Dodaj trwały dysk/wolumen i ustaw `DATA_DIR` na jego bezwzględną ścieżkę montowania, np. ścieżkę podaną przez wybranego dostawcę. Aplikacja utworzy tam `data.json` i `data.json.bak`. Jeśli nie ustawisz `DATA_DIR`, pliki trafią do katalogu projektu — taki zapis może być nietrwały.
5. Ustaw jedną replikę/instancję i włącz automatyczne ponowne uruchomienie po awarii. Nie uruchamiaj lokalnie i na hostingu jednocześnie na tych samych danych.
6. Wdróż aplikację i sprawdź logi. Poprawny start powinien pokazać nazwę bota, serwera i kanału `#cwelgar`. Błąd konfiguracji, brak dostępu do serwera lub kanału jest wypisywany w logach.
7. Na Discordzie sprawdź `!pomoc`, `!wiedzmin` i rozpocznij testową misję.

`DATA_DIR` musi wskazywać trwały wolumen, ponieważ postacie oraz aktywne wyprawy są przechowywane w `data.json`. Bot co 15 sekund sprawdza zakończone wyprawy. Po restarcie może dokończyć aktywną wyprawę, jeśli jej czas już minął. Nie uruchamiaj więcej niż jednej instancji: plik JSON nie synchronizuje równoległych procesów.

Jeśli przenosisz istniejące postacie z komputera, zatrzymaj lokalnego bota i skopiuj dotychczasowy `data.json` (oraz, jeśli istnieje, `data.json.bak`) do katalogu na trwałym wolumenie **przed pierwszym uruchomieniem hostowanej wersji**. Nie dodawaj tych plików do GitHuba. Zachowaj lokalną kopię na wypadek pomyłki.

## Kopie zapasowe i przywracanie

Przed każdym zapisem aplikacja kopiuje poprzedni `data.json` do `data.json.bak`. Jest to kopia ostatniej wersji, a nie ochrona przed utratą całego wolumenu. Regularnie pobieraj obie kopie poza hosting. Przywracanie:

1. Zatrzymaj bota.
2. Zrób kopię aktualnych plików danych na wszelki wypadek.
3. W katalogu `DATA_DIR` przywróć `data.json.bak` jako `data.json` (zastępując uszkodzony plik).
4. Uruchom bota i sprawdź logi oraz profile graczy.

## Ograniczenia alphatestów

- Jedna skonfigurowana gildia/serwer Discord, jeden kanał gry `#cwelgar` i jedna instancja bota.
- Postacie są zapisywane po identyfikatorze użytkownika w pliku JSON; nie przenoś pliku do równolegle działającej instancji.
- Testy jednostkowe sprawdzają logikę RPG, ale nie zastępują testu na prywatnym serwerze z prawdziwym botem.
- Na alphie monitoruj logi hostingu, błędy Discord API i kopie danych. Zrób kopię przed każdą aktualizacją.

Postacie i aktywne wyprawy są zapisywane w `data.json`. Przy migracji zachowywane są identyfikatory użytkowników i dotychczasowe pola danych, ale statystyki zwierzaka nie są już używane przez bota.