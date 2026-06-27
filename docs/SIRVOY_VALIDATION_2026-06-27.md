# Validering mot Sirvoy-export 2026-06-27

Kontrollen är gjord mot de två exporter som användes för felsökningen.

## Frukost

- CSV-filen innehåller totalt 48 frukostportioner.
- För 2026-06-27 anger Sirvoy `Units = 6`. Det korrekta utfallet från filen är därför 6 portioner, inte 4 och inte 8.
- Bokningen 2026-07-08–2026-07-10 har 4 portioner och kommentaren ”2 personer frukost för två dagar”. Den ska visas som 2 portioner den 9 juli och 2 portioner den 10 juli.
- En annan tvånättersbokning har 3 portioner för 4 gäster utan angiven morgon. Den ska visas med kontrollvarning och får inte fördelas automatiskt.
- En nötallergi som endast finns i Basic infos gästkommentar ska visas som en tydlig röd kostvarning.

## Städ 2026-06-27

- Tält 2: avresa från föregående bokning och ankomst för 2 gäster.
- Tält 3: avresa från föregående bokning och ankomst för 2 gäster.
- Städvyn ska därför visa två växlingar och använda 2 ankommande gäster per tält.
- Den får inte använda den avresande bokningens 4 respektive 2 gäster.

## Totalkontroller

- 82 bokningar
- 92 ACCOMM-rader / tältvistelser
- 48 frukostportioner
- 13 fikapåsar
- 79 giltiga telefonnummer
- 3 bokningar utan telefon
- inga dubbla nycklar för bokning + tält + incheckningsdatum
