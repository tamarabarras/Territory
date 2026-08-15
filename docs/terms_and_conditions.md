# Opći uvjeti poslovanja — Territory

**Verzija:** 1.1  
**Datum stupanja na snagu:** 15. kolovoza 2026.  
**Zadnja izmjena:** 15. kolovoza 2026.  
**Pružatelj usluge / vlasnik projekta:** Darijan Barras (u daljnjem tekstu: „Pružatelj“)  
**Kontakt:** darijanbarras@icloud.com

Ovaj dokument uređuje uvjete korištenja projekta **Territory** (PWA aplikacija za osvajanja teritorija GPS-om; u daljnjem tekstu: „Usluga“). Tekst mora pratiti stvarne funkcionalnosti koda.

---

## 1. Definicije

1.1. **Korisnik** — osoba koja pokreće ili koristi Uslugu.  
1.2. **Lokacijski podaci** — geografske koordinate dobivene putem GPS / Geolocation API-ja uređaja.  
1.3. **Trag** — niz lokacijskih točaka koje Korisnik crta hodanjem ili demom.  
1.4. **Teritorij** — poligon na mapi koji Usluga prikazuje kao „osvojen“ prostor.  
1.5. **Prototip** — razvojna verzija bez jamstva potpune točnosti, dostupnosti ili permanentnog spremanja podataka.

---

## 2. Predmet Usluge

2.1. Territory omogućuje prikaz lokacije na interaktivnoj karti (OpenStreetMap / Leaflet), crtanje traga, detekciju zatvaranja poligona i vizualno iscrtavanje teritorija.  
2.2. Funkcija „Simuliraj rez“ lokalno demonstrira pravilo gubitka teritorija; **nije** potpuni online multiplayer.  
2.3. Kartografski podaci dolaze od treće strane (OpenStreetMap i suradnici) i podliježu njihovim uvjetima.  
2.4. Usluga je Prototip: pravila igre, točnost GPS-a i prikaz teritorija mogu odstupati od stvarnog geografskog vlasništva ili prava na zemljište. **Teritorij u igri nema nikakav pravni učinak** na stvarno vlasništvo nekretnina.

---

## 3. Prihvaćanje uvjeta

3.1. Pokretanjem Usluge ili davanjem dozvole za lokaciju Korisnik prihvaća ove Uvjete.  
3.2. Ako se ne slaže, ne smije koristiti Uslugu niti davati pristup lokaciji.

---

## 4. Lokacijski podaci i privatnost

4.1. Za praćenje traga Usluga treba pristup **lokaciji uređaja**. Bez dozvole GPS način rada ne funkcionira; Demo hod može raditi bez stvarnog GPS-a.  
4.2. U verziji 1.1 lokacijski podaci obrađuju se **lokalno u pregledniku** Korisnika radi prikaza mape i izračuna poligona. Pružatelj **ne upravlja** zasebnim poslužiteljem koji u ovoj verziji trajno pohranjuje GPS tragove.  
4.3. Ako Korisnik hosta ili koristi Uslugu preko treće strane (npr. hosting, CDN, analytics), ti pružatelji mogu vidjeti tehničke podatke (IP, zahtjevi) prema svojim politikama.  
4.4. Kad se uvede online multiplayer ili poslužiteljsko spremanje, Pružatelj će ažurirati ove Uvjete (svrha, rok čuvanja, primatelji, pravna osnova — uključujući GDPR gdje je primjenjiv).  
4.5. Korisnik može uskratiti ili povući dozvolu lokacije u postavkama sustava/preglednika.  
4.6. Preporuka: ne dijelite ekran s preciznom lokacijom s nepoznatim osobama.

---

## 5. Dopuštena i zabranjena uporaba

5.1. Usluga je namijenjena osobnoj / demonstracijskoj uporabi Prototipa.  
5.2. Zabranjeno je: zlouporaba tuđe lokacije; lažno predstavljanje stvarnih pravnih granica; napadi na infrastrukturu mape; reverse engineering radi zaobilaženja sigurnosti (osim gdje zakon dopušta); unošenje zlonamjernog koda.  
5.3. Korisnik je odgovoran za vlastitu sigurnost tijekom korištenja GPS načina (npr. hodanje u prometu).

---

## 6. Intelektualno vlasništvo

6.1. Kod i dizajn Territoryja pripadaju Pružatelju, osim open-source komponenata (Leaflet, Turf, Vite itd.) koje podliježu vlastitim licencama.  
6.2. OpenStreetMap podaci © OpenStreetMap contributors — ODbL.  
6.3. Korisnik ne stječe vlasništvo nad „osvojenim“ teritorijem u stvarnom svijetu.

---

## 7. Odricanje od jamstava

7.1. Usluga se pruža **„kakva jest“**, bez jamstva točnosti GPS-a, kartografije, detekcije petlje ili neprekidnog rada.  
7.2. GPS signal, dozvole preglednika i uvjeti HTTPS-a mogu onemogućiti rad na pojedinim uređajima.

---

## 8. Ograničenje odgovornosti

8.1. U najvećoj mjeri dopuštenoj pravom RH, Pružatelj nije odgovoran za štetu nastalu korištenjem Usluge, uključujući gubitak podataka, netočan prikaz lokacije ili ozljede nastale tijekom korištenja na terenu.  
8.2. Ako je odgovornost ipak utvrđena, ograničena je na iznos plaćen za Uslugu u prethodnih 12 mjeseci, a ako nije plaćeno — na 0 EUR, osim gdje zakon zabranjuje ograničenje.

---

## 9. Izmjene i prekid

9.1. Pružatelj može mijenjati Uslugu i ove Uvjete objavom nove verzije u `docs/terms_and_conditions.md`.  
9.2. Korisnik može prestati koristiti Uslugu u svakom trenutku; Pružatelj može obustaviti Prototip.

---

## 10. Mjerodavno pravo

10.1. Primjenjuje se pravo Republike Hrvatske.  
10.2. Sporovi: nadležni sudovi u RH, uz zaštitu potrošača gdje je imperativna.

---

## 11. Odvojivost

Nevaljanost jedne odredbe ne dira ostale.

---

*Usklađeno s kodom na checkpointu 1.1 (lokalni GPS u browseru, OSM prikaz, lokalna simulacija reza; bez serverskog multiplayera).*
