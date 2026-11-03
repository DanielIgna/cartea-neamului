# Gazetarul hărții neamului

Fișierele de aici sunt generate de `scripts/build-places.ts` și nu se editează de mână. Le folosește harta
(`/arbore/[id]/harta`) ca să găsească satele și orașele scrise în fișe.

| Fișier | Ce are | De unde vine | Licență |
| --- | --- | --- | --- |
| `ro.ts` | 3.181 comune, orașe și municipii; 13.812 sate și localități componente, cu punctul fiecăreia | `@nspot/geo-pack-romania-localities` și `@nspot/geo-pack-romania-uat` (npm): nume și coduri SIRUTA de la INS, punctele din OpenStreetMap | **ODbL 1.0** (baza de date întreagă, pentru că punctele vin din OpenStreetMap) |
| `judete.json` | contururile celor 42 de județe, simplificate la ~1 km | `@nspot/geo-pack-romania` (npm), după limitele ANCPI | CC BY 4.0 |
| `world/*.ts` | orașele de peste 1000 de locuitori din 35 de țări | `cities.json` (npm), după GeoNames | CC BY 4.0 |

Atribuiri cerute de licențe (apar și în colțul hărții):

- © OpenStreetMap contributors, https://www.openstreetmap.org/copyright (ODbL 1.0)
- Institutul Național de Statistică, nomenclatorul SIRUTA, CC BY 4.0, https://data.gov.ro/dataset/siruta_s1-2026
- Agenția Națională de Cadastru și Publicitate Imobiliară (ANCPI), limitele unităților administrativ-teritoriale, CC BY 4.0
- GeoNames, https://www.geonames.org, CC BY 4.0

`ro.ts` este o bază de date derivată din OpenStreetMap: se distribuie mai departe tot sub ODbL 1.0
(https://opendatacommons.org/licenses/odbl/1-0/). Restul codului aplicației nu e afectat de această licență.

Ce am schimbat față de sursă: am păstrat doar numele, punctul, comuna și codul SIRUTA (coordonatele rotunjite la 4 zecimale),
am adăugat numele comunelor care nu sunt și nume de sat și centrul Bucureștiului (care în SIRUTA are doar sectoare),
iar pentru străinătate am păstrat numele, punctul și regiunea.

Plăcile hărții (fundalul) vin de la serverele OpenStreetMap (https://tile.openstreetmap.org), cu atribuirea de mai sus.
