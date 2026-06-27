# Sirvoy-import: regler som inte får förenklas

Det finns två olika Sirvoy-exporter. De får importeras samtidigt eller var för sig och i valfri ordning.

## 1. Booking content

Identifieras av kolumnerna `Type`, `Booking no.`, `Specification`, `Room ID` och `Units`.

Den filen är källa för:

- en `tent_stays`-rad per `ACCOMM`-rad
- rätt tält via `Room ID`: 1 = Sjöbris, 2 = Naturkärnan, 3 = Lugnets yta
- incheckning och utcheckning
- vuxna per tält från `Guests`
- barn från `EXTRAS` och, när Sirvoy/Booking.com bara anger dem i text, från Basic infos `Internal note`
- exakta tilläggsantal från `Units`

**Viktigt:** Frukost och fikapåse är bokningsgemensamma antal. De ska sparas på exakt en primär `tent_stays`-rad. De får aldrig kopieras till alla tält och aldrig räknas från kolumnen `Guests`.

Vid ny import ersätts bara `tent_stays` för bokningsnummer som faktiskt finns i filen. Gör aldrig en generell radering av alla framtida vistelser.

## 2. Basic info

Identifieras av kolumnerna `Booking no.`, `Phone`, `Email` och `Number of guests`, utan kolumnen `Type`.

Den filen är källa för:

- telefon
- e-post
- språk
- namn
- adress och land

Tom telefon eller e-post får inte radera ett redan sparat fungerande värde.

## Telefonnummer

Telefon lagras i E.164-liknande format:

- Sirvoys inledande apostrof tas bort
- `00` blir `+`
- svenskt nummer med inledande `0` blir `+46` utan nollan
- internationellt landsnummer ska aldrig bytas till `+46`

## Tillval från två källor

CSV och webbens `addon_orders` hålls isär:

- `breakfast_csv_quantity`
- `breakfast_addon_quantity`
- `fikapase_csv_quantity`
- `fikapase_addon_quantity`

På `/frukost` visas summan, men även uppdelningen mellan Sirvoy CSV och webbtillägg. Det gör dubbla beställningar synliga och felsökbara.

## Städ

Städning sker på avresedagen. Vid växling samma dag ska gästantal och barn hämtas från den ankommande vistelsen i samma tält, inte från den avresande bokningen.

Sirvoy anger inte vilket tält barnen sover i på en flertältsbokning. För att inte dubblera barnen placeras bokningens barn deterministiskt på första tältet. Detta är en teknisk fördelning; ändra manuellt om gästens faktiska rumsfördelning är känd.
