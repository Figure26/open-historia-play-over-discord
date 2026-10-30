import { createRequire as __ohRequire } from 'node:module'; const require = __ohRequire(import.meta.url);

// spikes/headless/worker-shims.js
import { parentPort } from "node:worker_threads";

// spikes/headless/node-worker.js
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Worker as NodeWorker } from "node:worker_threads";
var workerLog = [];
var HeadlessWorker = class {
  #thread;
  #listeners = { message: /* @__PURE__ */ new Set(), error: /* @__PURE__ */ new Set() };
  onmessage = null;
  onerror = null;
  constructor(url, options = {}) {
    const file = url instanceof URL || String(url).startsWith("file:") ? fileURLToPath(url) : String(url);
    if (!fs.existsSync(file)) throw new Error(`headless: no bundled worker at ${file}`);
    this.#thread = new NodeWorker(file, { name: options.name });
    this.#thread.unref();
    workerLog.push({ name: options.name || file, at: Date.now() });
    this.#thread.on("message", (data) => this.#emit("message", { data }));
    this.#thread.on("error", (error) => this.#emit("error", { message: error?.message, error }));
  }
  #emit(type, event) {
    const handler2 = type === "message" ? this.onmessage : this.onerror;
    handler2?.call(this, event);
    for (const listener of this.#listeners[type]) listener.call(this, event);
  }
  postMessage(data) {
    this.#thread.postMessage(data);
  }
  terminate() {
    this.#thread.terminate();
  }
  addEventListener(type, listener) {
    this.#listeners[type]?.add(listener);
  }
  removeEventListener(type, listener) {
    this.#listeners[type]?.delete(listener);
  }
};

// spikes/headless/worker-shims.js
var handler = null;
var listeners = /* @__PURE__ */ new Set();
globalThis.self = globalThis;
globalThis.window = globalThis;
globalThis.location = new URL(`${process.env.OH_HEADLESS_ORIGIN || "http://127.0.0.1:3999"}/`);
if (typeof globalThis.localStorage === "undefined") {
  const map = /* @__PURE__ */ new Map();
  const storage = {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.has(String(k)) ? map.get(String(k)) : null,
    setItem: (k, v) => {
      map.set(String(k), String(v));
    },
    removeItem: (k) => {
      map.delete(String(k));
    },
    clear: () => map.clear()
  };
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
}
Object.defineProperty(globalThis, "onmessage", { get: () => handler, set: (fn) => {
  handler = fn;
}, configurable: true });
globalThis.addEventListener = (type, fn) => {
  if (type === "message") listeners.add(fn);
};
globalThis.removeEventListener = (type, fn) => {
  if (type === "message") listeners.delete(fn);
};
globalThis.postMessage = (data) => parentPort.postMessage(data);
parentPort.on("message", (data) => {
  const event = { data };
  handler?.(event);
  for (const fn of listeners) fn(event);
});
globalThis.Worker = HeadlessWorker;

// src/runtime/generated/countryNames.js
var countryNames_default = {
  "CAN": "Canada",
  "USA": "United States",
  "MEX": "Mexico",
  "GTM": "Guatemala",
  "GRL": "Greenland",
  "SPM": "Saint Pierre and Miquelon",
  "BHS": "Bahamas",
  "BLZ": "Belize",
  "SLV": "El Salvador",
  "HND": "Honduras",
  "NIC": "Nicaragua",
  "CYM": "Cayman Islands",
  "CUB": "Cuba",
  "CRI": "Costa Rica",
  "PAN": "Panama",
  "JAM": "Jamaica",
  "TCA": "Turks and Caicos Islands",
  "HTI": "Haiti",
  "DOM": "Dominican Republic",
  "ABW": "Aruba",
  "CUW": "Curacao",
  "BES": "Bonaire, Sint Eustatius and Saba",
  "COL": "Colombia",
  "BMU": "Bermuda",
  "PRI": "Puerto Rico",
  "VIR": "Virgin Islands, U.S.",
  "VGB": "British Virgin Islands",
  "AIA": "Anguilla",
  "KNA": "Saint Kitts and Nevis",
  "ATG": "Antigua and Barbuda",
  "MSR": "Montserrat",
  "GLP": "Guadeloupe",
  "BLM": "Saint Barthelemy",
  "DMA": "Dominica",
  "MTQ": "Martinique",
  "VCT": "Saint Vincent and the Grenadines",
  "LCA": "Saint Lucia",
  "GRD": "Grenada",
  "BRB": "Barbados",
  "VEN": "Venezuela",
  "TTO": "Trinidad and Tobago",
  "GUY": "Guyana",
  "SUR": "Suriname",
  "GUF": "French Guiana",
  "ISL": "Iceland",
  "FRO": "Faroe Islands",
  "IRL": "Ireland",
  "IMN": "Isle of Man",
  "GBR": "United Kingdom",
  "GGY": "Guernsey",
  "JEY": "Jersey",
  "KIR": "Kiribati",
  "CPV": "Cabo Verde",
  "ESH": "Western Sahara",
  "PRT": "Portugal",
  "ESP": "Spain",
  "MAR": "Morocco",
  "SEN": "Senegal",
  "GMB": "Gambia",
  "GNB": "Guinea-Bissau",
  "SLE": "Sierra Leone",
  "MRT": "Mauritania",
  "MLI": "Mali",
  "BFA": "Burkina Faso",
  "GIN": "Guinea",
  "LBR": "Liberia",
  "CIV": "Cote d'Ivoire",
  "GHA": "Ghana",
  "TKL": "Tokelau",
  "TON": "Tonga",
  "WSM": "Samoa",
  "ASM": "American Samoa",
  "COK": "Cook Islands",
  "PYF": "French Polynesia",
  "ECU": "Ecuador",
  "PER": "Peru",
  "CHL": "Chile",
  "BOL": "Bolivia",
  "BRA": "Brazil",
  "PRY": "Paraguay",
  "ARG": "Argentina",
  "URY": "Uruguay",
  "FLK": "Falkland Islands",
  "SHN": "Saint Helena, Ascension and Tris",
  "SGS": "South Georgia and the South Sand",
  "SJM": "Svalbard and Jan Mayen",
  "ATA": "Antarctica",
  "DNK": "Denmark",
  "NOR": "Norway",
  "SWE": "Sweden",
  "ALA": "Aland Islands",
  "NLD": "Netherlands",
  "BEL": "Belgium",
  "LUX": "Luxembourg",
  "DEU": "Germany",
  "FRA": "France",
  "AND": "Andorra",
  "CHE": "Switzerland",
  "LIE": "Liechtenstein",
  "SMR": "San Marino",
  "CZE": "Czechia",
  "POL": "Poland",
  "AUT": "Austria",
  "SVN": "Slovenia",
  "ITA": "Italy",
  "HRV": "Croatia",
  "SVK": "Slovakia",
  "HUN": "Hungary",
  "BIH": "Bosnia and Herzegovina",
  "MNE": "Montenegro",
  "SRB": "Serbia",
  "XKO": "Kosovo",
  "ALB": "Albania",
  "MKD": "North Macedonia",
  "FIN": "Finland",
  "LVA": "Latvia",
  "EST": "Estonia",
  "LTU": "Lithuania",
  "BLR": "Belarus",
  "UKR": "Ukraine",
  "ROU": "Romania",
  "BGR": "Bulgaria",
  "MDA": "Moldova",
  "GEO": "Georgia",
  "TUN": "Tunisia",
  "DZA": "Algeria",
  "MLT": "Malta",
  "LBY": "Libya",
  "NER": "Niger",
  "TGO": "Togo",
  "BEN": "Benin",
  "NGA": "Nigeria",
  "STP": "Sao Tome and Principe",
  "GNQ": "Equatorial Guinea",
  "TCD": "Chad",
  "CMR": "Cameroon",
  "CAF": "Central African Republic",
  "GRC": "Greece",
  "CYP": "Cyprus",
  "ZNC": "Northern Cyprus",
  "XAD": "Akrotiri and Dhekelia",
  "EGY": "Egypt",
  "TUR": "Turkey",
  "LBN": "Lebanon",
  "SYR": "Syria",
  "ARM": "Armenia",
  "IRQ": "Iraq",
  "ISR": "Israel",
  "PSE": "Palestine",
  "JOR": "Jordan",
  "SAU": "Saudi Arabia",
  "SDN": "Sudan",
  "SSD": "South Sudan",
  "UGA": "Uganda",
  "ERI": "Eritrea",
  "DJI": "Djibouti",
  "KEN": "Kenya",
  "ETH": "Ethiopia",
  "XCA": "Caspian Sea",
  "KAZ": "Kazakhstan",
  "UZB": "Uzbekistan",
  "KGZ": "Kyrgyzstan",
  "AZE": "Azerbaijan",
  "IRN": "Iran",
  "KWT": "Kuwait",
  "BHR": "Bahrain",
  "QAT": "Qatar",
  "ARE": "United Arab Emirates",
  "TKM": "Turkmenistan",
  "AFG": "Afghanistan",
  "YEM": "Yemen",
  "OMN": "Oman",
  "SOM": "Somalia",
  "TJK": "Tajikistan",
  "Z06": "Pakistan",
  "Z02": "China",
  "Z01": "India",
  "Z04": "India",
  "PAK": "Pakistan",
  "Z03": "China",
  "Z08": "China",
  "Z09": "India",
  "Z05": "India",
  "NPL": "Nepal",
  "IND": "India",
  "MDV": "Maldives",
  "LKA": "Sri Lanka",
  "RUS": "Russia",
  "MNG": "Mongolia",
  "BTN": "Bhutan",
  "Z07": "India",
  "BGD": "Bangladesh",
  "CHN": "China",
  "MMR": "Myanmar",
  "THA": "Thailand",
  "LAO": "Laos",
  "VNM": "Vietnam",
  "KHM": "Cambodia",
  "MYS": "Malaysia",
  "TWN": "Taiwan",
  "PRK": "North Korea",
  "KOR": "South Korea",
  "PHL": "Philippines",
  "BRN": "Brunei",
  "SGP": "Singapore",
  "PLW": "Palau",
  "JPN": "Japan",
  "MNP": "Northern Mariana Islands",
  "GUM": "Guam",
  "FSM": "Micronesia",
  "MHL": "Marshall Islands",
  "NRU": "Nauru",
  "GAB": "Gabon",
  "COG": "Republic of the Congo",
  "AGO": "Angola",
  "NAM": "Namibia",
  "COD": "Democratic Republic of the Congo",
  "RWA": "Rwanda",
  "BDI": "Burundi",
  "ZMB": "Zambia",
  "ZWE": "Zimbabwe",
  "TZA": "Tanzania",
  "MWI": "Malawi",
  "MOZ": "Mozambique",
  "COM": "Comoros",
  "BWA": "Botswana",
  "ZAF": "South Africa",
  "SWZ": "Swaziland",
  "LSO": "Lesotho",
  "BVT": "Bouvet Island",
  "SYC": "Seychelles",
  "MYT": "Mayotte",
  "MDG": "Madagascar",
  "REU": "Reunion",
  "MUS": "Mauritius",
  "ATF": "French Southern Territories",
  "HMD": "Heard Island and McDonald Island",
  "IDN": "Indonesia",
  "TLS": "Timor-Leste",
  "AUS": "Australia",
  "PNG": "Papua New Guinea",
  "SLB": "Solomon Islands",
  "FJI": "Fiji",
  "VUT": "Vanuatu",
  "TUV": "Tuvalu",
  "UMI": "United States Minor Outlying Islands",
  "WLF": "Wallis and Futuna",
  "NCL": "New Caledonia",
  "NZL": "New Zealand"
};

// src/runtime/generated/officialCountryAliases.js
var officialCountryAliases_default = {
  "afghanistan": "AFG",
  "aland islands": "ALA",
  "albania": "ALB",
  "algeria": "DZA",
  "american samoa": "ASM",
  "andorra": "AND",
  "angola": "AGO",
  "anguilla": "AIA",
  "antarctica": "ATA",
  "antigua and barbuda": "ATG",
  "arab republic of egypt": "EGY",
  "argentina": "ARG",
  "argentine republic": "ARG",
  "armenia": "ARM",
  "aruba": "ABW",
  "ascension and tristan da cunha saint helena": "SHN",
  "australia": "AUS",
  "austria": "AUT",
  "azerbaijan": "AZE",
  "bahamas": "BHS",
  "bahrain": "BHR",
  "bangladesh": "BGD",
  "barbados": "BRB",
  "belarus": "BLR",
  "belgium": "BEL",
  "belize": "BLZ",
  "benin": "BEN",
  "bermuda": "BMU",
  "bhutan": "BTN",
  "bolivarian republic of venezuela": "VEN",
  "bolivia": "BOL",
  "bolivia plurinational state of": "BOL",
  "bonaire sint eustatius and saba": "BES",
  "bosnia and herzegovina": "BIH",
  "botswana": "BWA",
  "bouvet island": "BVT",
  "brazil": "BRA",
  "british indian ocean territory": "IOT",
  "british virgin islands": "VGB",
  "brunei darussalam": "BRN",
  "bulgaria": "BGR",
  "burkina faso": "BFA",
  "burundi": "BDI",
  "cabo verde": "CPV",
  "cambodia": "KHM",
  "cameroon": "CMR",
  "canada": "CAN",
  "cayman islands": "CYM",
  "central african republic": "CAF",
  "chad": "TCD",
  "chile": "CHL",
  "china": "CHN",
  "christmas island": "CXR",
  "cocos keeling islands": "CCK",
  "colombia": "COL",
  "commonwealth of dominica": "DMA",
  "commonwealth of the bahamas": "BHS",
  "commonwealth of the northern mariana islands": "MNP",
  "comoros": "COM",
  "congo": "COG",
  "congo the democratic republic of the": "COD",
  "cook islands": "COK",
  "costa rica": "CRI",
  "cote divoire": "CIV",
  "croatia": "HRV",
  "cuba": "CUB",
  "curacao": "CUW",
  "cyprus": "CYP",
  "czech republic": "CZE",
  "czechia": "CZE",
  "democratic peoples republic of korea": "PRK",
  "democratic republic of sao tome and principe": "STP",
  "democratic republic of timor leste": "TLS",
  "democratic socialist republic of sri lanka": "LKA",
  "denmark": "DNK",
  "djibouti": "DJI",
  "dominica": "DMA",
  "dominican republic": "DOM",
  "eastern republic of uruguay": "URY",
  "ecuador": "ECU",
  "egypt": "EGY",
  "el salvador": "SLV",
  "equatorial guinea": "GNQ",
  "eritrea": "ERI",
  "estonia": "EST",
  "eswatini": "SWZ",
  "ethiopia": "ETH",
  "falkland islands malvinas": "FLK",
  "faroe islands": "FRO",
  "federal democratic republic of ethiopia": "ETH",
  "federal democratic republic of nepal": "NPL",
  "federal republic of germany": "DEU",
  "federal republic of nigeria": "NGA",
  "federal republic of somalia": "SOM",
  "federated states of micronesia": "FSM",
  "federative republic of brazil": "BRA",
  "fiji": "FJI",
  "finland": "FIN",
  "france": "FRA",
  "french guiana": "GUF",
  "french polynesia": "PYF",
  "french republic": "FRA",
  "french southern territories": "ATF",
  "gabon": "GAB",
  "gabonese republic": "GAB",
  "gambia": "GMB",
  "georgia": "GEO",
  "germany": "DEU",
  "ghana": "GHA",
  "gibraltar": "GIB",
  "grand duchy of luxembourg": "LUX",
  "greece": "GRC",
  "greenland": "GRL",
  "grenada": "GRD",
  "guadeloupe": "GLP",
  "guam": "GUM",
  "guatemala": "GTM",
  "guernsey": "GGY",
  "guinea": "GIN",
  "guinea bissau": "GNB",
  "guyana": "GUY",
  "haiti": "HTI",
  "hashemite kingdom of jordan": "JOR",
  "heard island and mcdonald islands": "HMD",
  "hellenic republic": "GRC",
  "holy see vatican city state": "VAT",
  "honduras": "HND",
  "hong kong": "HKG",
  "hong kong special administrative region of china": "HKG",
  "hungary": "HUN",
  "iceland": "ISL",
  "independent state of papua new guinea": "PNG",
  "independent state of samoa": "WSM",
  "india": "IND",
  "indonesia": "IDN",
  "iran": "IRN",
  "iran islamic republic of": "IRN",
  "iraq": "IRQ",
  "ireland": "IRL",
  "islamic republic of afghanistan": "AFG",
  "islamic republic of iran": "IRN",
  "islamic republic of mauritania": "MRT",
  "islamic republic of pakistan": "PAK",
  "isle of man": "IMN",
  "israel": "ISR",
  "italian republic": "ITA",
  "italy": "ITA",
  "jamaica": "JAM",
  "japan": "JPN",
  "jersey": "JEY",
  "jordan": "JOR",
  "kazakhstan": "KAZ",
  "kenya": "KEN",
  "kingdom of bahrain": "BHR",
  "kingdom of belgium": "BEL",
  "kingdom of bhutan": "BTN",
  "kingdom of cambodia": "KHM",
  "kingdom of denmark": "DNK",
  "kingdom of eswatini": "SWZ",
  "kingdom of lesotho": "LSO",
  "kingdom of morocco": "MAR",
  "kingdom of norway": "NOR",
  "kingdom of saudi arabia": "SAU",
  "kingdom of spain": "ESP",
  "kingdom of sweden": "SWE",
  "kingdom of thailand": "THA",
  "kingdom of the netherlands": "NLD",
  "kingdom of tonga": "TON",
  "kiribati": "KIR",
  "korea democratic peoples republic of": "PRK",
  "korea republic of": "KOR",
  "kuwait": "KWT",
  "kyrgyz republic": "KGZ",
  "kyrgyzstan": "KGZ",
  "lao peoples democratic republic": "LAO",
  "laos": "LAO",
  "latvia": "LVA",
  "lebanese republic": "LBN",
  "lebanon": "LBN",
  "lesotho": "LSO",
  "liberia": "LBR",
  "libya": "LBY",
  "liechtenstein": "LIE",
  "lithuania": "LTU",
  "luxembourg": "LUX",
  "macao": "MAC",
  "macao special administrative region of china": "MAC",
  "madagascar": "MDG",
  "malawi": "MWI",
  "malaysia": "MYS",
  "maldives": "MDV",
  "mali": "MLI",
  "malta": "MLT",
  "marshall islands": "MHL",
  "martinique": "MTQ",
  "mauritania": "MRT",
  "mauritius": "MUS",
  "mayotte": "MYT",
  "mexico": "MEX",
  "micronesia federated states of": "FSM",
  "moldova": "MDA",
  "moldova republic of": "MDA",
  "monaco": "MCO",
  "mongolia": "MNG",
  "montenegro": "MNE",
  "montserrat": "MSR",
  "morocco": "MAR",
  "mozambique": "MOZ",
  "myanmar": "MMR",
  "namibia": "NAM",
  "nauru": "NRU",
  "nepal": "NPL",
  "netherlands": "NLD",
  "new caledonia": "NCL",
  "new zealand": "NZL",
  "nicaragua": "NIC",
  "niger": "NER",
  "nigeria": "NGA",
  "niue": "NIU",
  "norfolk island": "NFK",
  "north korea": "PRK",
  "north macedonia": "MKD",
  "northern mariana islands": "MNP",
  "norway": "NOR",
  "oman": "OMN",
  "pakistan": "PAK",
  "palau": "PLW",
  "palestine state of": "PSE",
  "panama": "PAN",
  "papua new guinea": "PNG",
  "paraguay": "PRY",
  "peoples democratic republic of algeria": "DZA",
  "peoples republic of bangladesh": "BGD",
  "peoples republic of china": "CHN",
  "peru": "PER",
  "philippines": "PHL",
  "pitcairn": "PCN",
  "plurinational state of bolivia": "BOL",
  "poland": "POL",
  "portugal": "PRT",
  "portuguese republic": "PRT",
  "principality of andorra": "AND",
  "principality of liechtenstein": "LIE",
  "principality of monaco": "MCO",
  "province of china taiwan": "TWN",
  "puerto rico": "PRI",
  "qatar": "QAT",
  "republic of albania": "ALB",
  "republic of angola": "AGO",
  "republic of armenia": "ARM",
  "republic of austria": "AUT",
  "republic of azerbaijan": "AZE",
  "republic of belarus": "BLR",
  "republic of benin": "BEN",
  "republic of bosnia and herzegovina": "BIH",
  "republic of botswana": "BWA",
  "republic of bulgaria": "BGR",
  "republic of burundi": "BDI",
  "republic of cabo verde": "CPV",
  "republic of cameroon": "CMR",
  "republic of chad": "TCD",
  "republic of chile": "CHL",
  "republic of colombia": "COL",
  "republic of costa rica": "CRI",
  "republic of cote divoire": "CIV",
  "republic of croatia": "HRV",
  "republic of cuba": "CUB",
  "republic of cyprus": "CYP",
  "republic of djibouti": "DJI",
  "republic of ecuador": "ECU",
  "republic of el salvador": "SLV",
  "republic of equatorial guinea": "GNQ",
  "republic of estonia": "EST",
  "republic of fiji": "FJI",
  "republic of finland": "FIN",
  "republic of ghana": "GHA",
  "republic of guatemala": "GTM",
  "republic of guinea": "GIN",
  "republic of guinea bissau": "GNB",
  "republic of guyana": "GUY",
  "republic of haiti": "HTI",
  "republic of honduras": "HND",
  "republic of iceland": "ISL",
  "republic of india": "IND",
  "republic of indonesia": "IDN",
  "republic of iraq": "IRQ",
  "republic of kazakhstan": "KAZ",
  "republic of kenya": "KEN",
  "republic of kiribati": "KIR",
  "republic of korea": "KOR",
  "republic of latvia": "LVA",
  "republic of liberia": "LBR",
  "republic of lithuania": "LTU",
  "republic of madagascar": "MDG",
  "republic of malawi": "MWI",
  "republic of maldives": "MDV",
  "republic of mali": "MLI",
  "republic of malta": "MLT",
  "republic of mauritius": "MUS",
  "republic of moldova": "MDA",
  "republic of mozambique": "MOZ",
  "republic of myanmar": "MMR",
  "republic of namibia": "NAM",
  "republic of nauru": "NRU",
  "republic of nicaragua": "NIC",
  "republic of north macedonia": "MKD",
  "republic of palau": "PLW",
  "republic of panama": "PAN",
  "republic of paraguay": "PRY",
  "republic of peru": "PER",
  "republic of poland": "POL",
  "republic of san marino": "SMR",
  "republic of senegal": "SEN",
  "republic of serbia": "SRB",
  "republic of seychelles": "SYC",
  "republic of sierra leone": "SLE",
  "republic of singapore": "SGP",
  "republic of slovenia": "SVN",
  "republic of south africa": "ZAF",
  "republic of south sudan": "SSD",
  "republic of suriname": "SUR",
  "republic of tajikistan": "TJK",
  "republic of the congo": "COG",
  "republic of the gambia": "GMB",
  "republic of the marshall islands": "MHL",
  "republic of the niger": "NER",
  "republic of the philippines": "PHL",
  "republic of the sudan": "SDN",
  "republic of trinidad and tobago": "TTO",
  "republic of tunisia": "TUN",
  "republic of turkiye": "TUR",
  "republic of uganda": "UGA",
  "republic of uzbekistan": "UZB",
  "republic of vanuatu": "VUT",
  "republic of yemen": "YEM",
  "republic of zambia": "ZMB",
  "republic of zimbabwe": "ZWE",
  "reunion": "REU",
  "romania": "ROU",
  "russian federation": "RUS",
  "rwanda": "RWA",
  "rwandese republic": "RWA",
  "saint barthelemy": "BLM",
  "saint helena ascension and tristan da cunha": "SHN",
  "saint kitts and nevis": "KNA",
  "saint lucia": "LCA",
  "saint martin french part": "MAF",
  "saint pierre and miquelon": "SPM",
  "saint vincent and the grenadines": "VCT",
  "samoa": "WSM",
  "san marino": "SMR",
  "sao tome and principe": "STP",
  "saudi arabia": "SAU",
  "senegal": "SEN",
  "serbia": "SRB",
  "seychelles": "SYC",
  "sierra leone": "SLE",
  "singapore": "SGP",
  "sint eustatius and saba bonaire": "BES",
  "sint maarten dutch part": "SXM",
  "slovak republic": "SVK",
  "slovakia": "SVK",
  "slovenia": "SVN",
  "socialist republic of viet nam": "VNM",
  "solomon islands": "SLB",
  "somalia": "SOM",
  "south africa": "ZAF",
  "south georgia and the south sandwich islands": "SGS",
  "south korea": "KOR",
  "south sudan": "SSD",
  "spain": "ESP",
  "sri lanka": "LKA",
  "state of israel": "ISR",
  "state of kuwait": "KWT",
  "state of palestine": "PSE",
  "state of qatar": "QAT",
  "sudan": "SDN",
  "sultanate of oman": "OMN",
  "suriname": "SUR",
  "svalbard and jan mayen": "SJM",
  "sweden": "SWE",
  "swiss confederation": "CHE",
  "switzerland": "CHE",
  "syria": "SYR",
  "syrian arab republic": "SYR",
  "taiwan": "TWN",
  "taiwan province of china": "TWN",
  "tajikistan": "TJK",
  "tanzania": "TZA",
  "tanzania united republic of": "TZA",
  "thailand": "THA",
  "the democratic republic of the congo": "COD",
  "the state of eritrea": "ERI",
  "the state of palestine": "PSE",
  "timor leste": "TLS",
  "togo": "TGO",
  "togolese republic": "TGO",
  "tokelau": "TKL",
  "tonga": "TON",
  "trinidad and tobago": "TTO",
  "tunisia": "TUN",
  "turkiye": "TUR",
  "turkmenistan": "TKM",
  "turks and caicos islands": "TCA",
  "tuvalu": "TUV",
  "u s virgin islands": "VIR",
  "uganda": "UGA",
  "ukraine": "UKR",
  "union of the comoros": "COM",
  "united arab emirates": "ARE",
  "united kingdom": "GBR",
  "united kingdom of great britain and northern ireland": "GBR",
  "united mexican states": "MEX",
  "united republic of tanzania": "TZA",
  "united states": "USA",
  "united states minor outlying islands": "UMI",
  "united states of america": "USA",
  "uruguay": "URY",
  "uzbekistan": "UZB",
  "vanuatu": "VUT",
  "venezuela": "VEN",
  "venezuela bolivarian republic of": "VEN",
  "viet nam": "VNM",
  "vietnam": "VNM",
  "virgin islands british": "VGB",
  "virgin islands of the united states": "VIR",
  "virgin islands u s": "VIR",
  "wallis and futuna": "WLF",
  "western sahara": "ESH",
  "yemen": "YEM",
  "zambia": "ZMB",
  "zimbabwe": "ZWE"
};

// src/runtime/ownerNames.js
var toCountryName = (token) => {
  const raw = String(token ?? "").trim();
  if (!raw) return "";
  return countryNames_default[raw] || countryNames_default[raw.toUpperCase()] || raw;
};
var ownerIdentityKey = (value) => String(value ?? "").normalize("NFD").toLowerCase().replace(/[^a-z0-9]+/g, "");
var COUNTRY_NAME_KEYS = new Set(Object.values(countryNames_default).map(ownerIdentityKey));

// src/runtime/polityIdentity.js
var normalizeString = (value) => String(value ?? "").trim();
var MEMO_LIMIT = 2e4;
var memoizedFold = (fold) => {
  const memo = /* @__PURE__ */ new Map();
  return (value) => {
    const key = typeof value === "string" ? value : String(value ?? "");
    let answer = memo.get(key);
    if (answer === void 0) {
      answer = fold(key);
      if (memo.size >= MEMO_LIMIT) memo.clear();
      memo.set(key, answer);
    }
    return answer;
  };
};
var foldIdentityText = (value) => normalizeString(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
var normalizeIdentityText = memoizedFold(foldIdentityText);
var STOCK_COUNTRY_NAMES = new Set(
  Object.values(countryNames_default).map(normalizeIdentityText).filter(Boolean)
);
var STOCK_CODES_BY_NAME = (() => {
  const out = /* @__PURE__ */ new Map();
  const add2 = (normalizedName, normalizedCode) => {
    if (!normalizedName || !normalizedCode) return;
    const list = out.get(normalizedName) || [];
    if (!list.includes(normalizedCode)) list.push(normalizedCode);
    out.set(normalizedName, list);
  };
  for (const [code, name] of Object.entries(countryNames_default)) {
    add2(
      normalizeIdentityText(name),
      normalizeString(code).toUpperCase()
    );
  }
  for (const [normalizedName, code] of Object.entries(officialCountryAliases_default)) {
    add2(
      normalizeIdentityText(normalizedName),
      normalizeString(code).toUpperCase()
    );
  }
  return out;
})();
var stockCodesForToken = (rawToken, stockName) => {
  const raw = normalizeString(rawToken).toUpperCase();
  const direct = countryNames_default[raw] ? [raw] : [];
  const byName = STOCK_CODES_BY_NAME.get(normalizeIdentityText(stockName)) || [];
  return [.../* @__PURE__ */ new Set([...direct, ...byName])];
};
var resolveStockCountryCode = (value) => {
  const raw = normalizeString(value);
  if (!raw) return null;
  const stockName = toCountryName(raw);
  const codes = stockCodesForToken(raw, stockName);
  return codes.length === 1 ? codes[0] : null;
};
var foldPolityCore = (value) => {
  let text = normalizeIdentityText(value);
  if (!text) return "";
  text = text.replace(/^the\s+/, "");
  const prefixes = [
    "federal democratic republic of ",
    "federal republic of ",
    "peoples democratic republic of ",
    "people s democratic republic of ",
    "peoples republic of ",
    "people s republic of ",
    "democratic republic of ",
    "socialist republic of ",
    "united republic of ",
    "grand duchy of ",
    "kingdom of ",
    "republic of ",
    "empire of ",
    "principality of ",
    "duchy of ",
    "sultanate of ",
    "emirate of ",
    "caliphate of ",
    "commonwealth of ",
    "federation of ",
    "confederation of "
  ];
  for (const prefix of prefixes) {
    if (text.startsWith(prefix)) {
      text = text.slice(prefix.length).trim();
      break;
    }
  }
  const suffixes = [
    " federal republic",
    " democratic republic",
    " peoples republic",
    " people s republic",
    " socialist republic",
    " grand duchy",
    " kingdom",
    " republic",
    " empire",
    " principality",
    " duchy",
    " sultanate",
    " emirate",
    " caliphate",
    " commonwealth",
    " federation",
    " confederation"
  ];
  for (const suffix of suffixes) {
    if (text.endsWith(suffix)) {
      text = text.slice(0, -suffix.length).trim();
      break;
    }
  }
  return text;
};
var polityCore = memoizedFold(foldPolityCore);

// src/runtime/politicalPressure.js
var POLITICAL_PRESSURE_STATE_VERSION = 1;
var POLITICAL_PRESSURE_AXES = Object.freeze({
  immigration: Object.freeze({ negative: "more open", positive: "more restrictive" }),
  sovereignty: Object.freeze({ negative: "deeper integration", positive: "greater national sovereignty" }),
  security: Object.freeze({ negative: "restraint/de-escalation", positive: "hardline/security-first" }),
  national_identity: Object.freeze({ negative: "cosmopolitan/pluralist", positive: "nationalist/identity-first" }),
  social_order: Object.freeze({ negative: "social liberalisation", positive: "traditional/order-first" }),
  economic_intervention: Object.freeze({ negative: "market-oriented", positive: "state intervention/redistribution" }),
  inequality: Object.freeze({ negative: "accept existing distribution", positive: "redistribution/economic equality" }),
  corruption: Object.freeze({ negative: "status quo tolerance", positive: "anti-corruption/reform demand" }),
  institutional_trust: Object.freeze({ negative: "institutional confidence", positive: "institutional distrust" }),
  regionalism: Object.freeze({ negative: "centralisation", positive: "regional autonomy/devolution" }),
  religion: Object.freeze({ negative: "secularisation", positive: "greater religious/traditional role" }),
  environment: Object.freeze({ negative: "growth/resource priority", positive: "environmental protection" }),
  authoritarianism: Object.freeze({ negative: "liberal checks/pluralism", positive: "strong executive/order" }),
  reform: Object.freeze({ negative: "institutional continuity", positive: "institutional reform/change" }),
  war_weariness: Object.freeze({ negative: "continued mobilisation/escalation", positive: "peace/de-escalation demand" }),
  economic_stress: Object.freeze({ negative: "economic confidence", positive: "economic anxiety/distress" }),
  cost_of_living: Object.freeze({ negative: "price stability", positive: "cost-of-living pressure" }),
  unemployment: Object.freeze({ negative: "labour-market confidence", positive: "employment insecurity" })
});
var ISSUE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
var MAX_ISSUES = 24;
var MAX_RECENT_SOURCES = 4;
var DEFAULT_PERSISTENCE = 0.72;
var DROP_EPSILON = 0.15;
var clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
var round1 = (value) => Math.round(Number(value) * 10) / 10;
var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
var clampPercent = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? round1(clamp(number, 0, 100)) : fallback;
};
var clampLean = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? round1(clamp(number, -100, 100)) : fallback;
};
var clampPersistence = (value, fallback = DEFAULT_PERSISTENCE) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(clamp(number, 0, 1) * 1e3) / 1e3 : fallback;
};
var normalizeIssueKey = (value) => {
  const key = clean(value).toLocaleLowerCase().replace(/[\s.]+/g, "_");
  return ISSUE_KEY_PATTERN.test(key) ? key : "";
};
var normalizeSource = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const kind = clean(value.kind || value.sourceKind || value.type).slice(0, 40);
  const id = clean(value.id || value.sourceId).slice(0, 120);
  const date = clean(value.date).slice(0, 32);
  const note = clean(value.note).slice(0, 180);
  if (!kind && !id && !date && !note) return null;
  return {
    ...kind ? { kind } : {},
    ...id ? { id } : {},
    ...date ? { date } : {},
    ...note ? { note } : {}
  };
};
var normalizeRecentSources = (value) => {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const raw of Array.isArray(value) ? value : []) {
    const source = normalizeSource(raw);
    if (!source) continue;
    const key = `${source.kind || ""}|${source.id || ""}|${source.date || ""}|${source.note || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(source);
    if (out.length >= MAX_RECENT_SOURCES) break;
  }
  return out;
};
var normalizePoliticalPressureIssue = (value) => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const out = {
    salience: clampPercent(source.salience),
    lean: clampLean(source.lean ?? source.direction),
    strain: clampPercent(source.strain),
    persistence: clampPersistence(source.persistence),
    momentum: clampLean(source.momentum)
  };
  const recentSources = normalizeRecentSources(source.recentSources || source.sources);
  if (recentSources.length) out.recentSources = recentSources;
  return out;
};
var normalizePoliticalPressureState = (value) => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const sourceIssues = source.issues && typeof source.issues === "object" && !Array.isArray(source.issues) ? source.issues : {};
  const issues = {};
  for (const [rawKey, rawIssue] of Object.entries(sourceIssues).slice(0, MAX_ISSUES)) {
    const key = normalizeIssueKey(rawKey);
    if (!key) continue;
    const issue = normalizePoliticalPressureIssue(rawIssue);
    if (issue.salience <= DROP_EPSILON && issue.strain <= DROP_EPSILON && Math.abs(issue.lean) <= DROP_EPSILON) continue;
    issues[key] = issue;
  }
  const updatedAt = clean(source.updatedAt).slice(0, 32);
  return {
    schemaVersion: POLITICAL_PRESSURE_STATE_VERSION,
    ...updatedAt ? { updatedAt } : {},
    issues
  };
};
var normalizePoliticalPressureSignal = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const issue = normalizeIssueKey(value.issue || value.key);
  if (!issue) return null;
  const salience = clampPercent(value.salience ?? value.salienceDelta ?? value.intensity, 0);
  const strain = clampPercent(value.strain ?? value.strainDelta, 0);
  const lean = clampLean(value.lean ?? (Number.isFinite(Number(value.direction)) ? Number(value.direction) * 100 : 0));
  const persistence = clampPersistence(value.persistence);
  const source = normalizeSource(value.source || {
    kind: value.sourceKind,
    id: value.sourceId,
    date: value.date,
    note: value.note
  });
  if (salience <= 0 && strain <= 0) return null;
  return {
    issue,
    salience,
    strain,
    lean,
    persistence,
    ...source ? { source } : {}
  };
};
var decayFactorForMonths = (persistence, months) => {
  if (months <= 0) return 1;
  return Math.pow(clampPersistence(persistence), months);
};
var decayIssue = (issue, months) => {
  const current = normalizePoliticalPressureIssue(issue);
  if (months <= 0) return current;
  const factor = decayFactorForMonths(current.persistence, months);
  const salience = round1(current.salience * factor);
  const strain = round1(current.strain * factor);
  const lean = salience > DROP_EPSILON ? round1(current.lean * factor) : 0;
  return {
    ...current,
    salience,
    strain,
    lean,
    momentum: round1(salience - current.salience)
  };
};
var mergeRecentSource = (existing, source) => {
  if (!source) return normalizeRecentSources(existing);
  return normalizeRecentSources([source, ...Array.isArray(existing) ? existing : []]);
};
var applySignalToIssue = (issue, signal) => {
  const current = normalizePoliticalPressureIssue(issue);
  const addedSalience = clampPercent(signal.salience);
  const nextSalience = clampPercent(current.salience + addedSalience);
  const nextStrain = clampPercent(current.strain + clampPercent(signal.strain));
  const currentWeight = Math.max(0, current.salience);
  const signalWeight = Math.max(0, addedSalience);
  const weightedLean = currentWeight + signalWeight > 0 ? (current.lean * currentWeight + clampLean(signal.lean) * signalWeight) / (currentWeight + signalWeight) : 0;
  return {
    salience: nextSalience,
    lean: clampLean(weightedLean),
    strain: nextStrain,
    persistence: Math.max(current.persistence, clampPersistence(signal.persistence)),
    momentum: round1(nextSalience - current.salience),
    ...mergeRecentSource(current.recentSources, signal.source).length ? { recentSources: mergeRecentSource(current.recentSources, signal.source) } : {}
  };
};
var advancePoliticalPressureState = (inputState, { months = 0, signals = [], updatedAt = "" } = {}) => {
  const current = normalizePoliticalPressureState(inputState);
  const nextIssues = {};
  for (const [key, issue] of Object.entries(current.issues)) {
    const decayed = decayIssue(issue, Math.max(0, Number(months) || 0));
    if (decayed.salience > DROP_EPSILON || decayed.strain > DROP_EPSILON || Math.abs(decayed.lean) > DROP_EPSILON) {
      nextIssues[key] = decayed;
    }
  }
  for (const rawSignal of Array.isArray(signals) ? signals : []) {
    const signal = normalizePoliticalPressureSignal(rawSignal);
    if (!signal) continue;
    nextIssues[signal.issue] = applySignalToIssue(nextIssues[signal.issue], signal);
  }
  const hasIssues = Object.keys(nextIssues).length > 0;
  const next = normalizePoliticalPressureState({
    schemaVersion: POLITICAL_PRESSURE_STATE_VERSION,
    ...hasIssues ? { updatedAt: clean(updatedAt) || current.updatedAt } : {},
    issues: nextIssues
  });
  return next;
};
var statesEqual = (left, right) => JSON.stringify(normalizePoliticalPressureState(left)) === JSON.stringify(normalizePoliticalPressureState(right));
var advancePoliticalPressureBatch = ({ actorsByPolity = {}, signalsByPolity = {}, months = 0, updatedAt = "" } = {}) => {
  const patchesByPolity = {};
  const polityKeys = /* @__PURE__ */ new Set([
    ...Object.keys(actorsByPolity && typeof actorsByPolity === "object" ? actorsByPolity : {}),
    ...Object.keys(signalsByPolity && typeof signalsByPolity === "object" ? signalsByPolity : {})
  ]);
  for (const polityKey of [...polityKeys].sort((a, b) => a.localeCompare(b))) {
    const actor = actorsByPolity?.[polityKey];
    if (!actor || typeof actor !== "object" || Array.isArray(actor)) continue;
    const before = normalizePoliticalPressureState(actor.politicalPressures);
    const after = advancePoliticalPressureState(before, {
      months,
      signals: signalsByPolity?.[polityKey],
      updatedAt
    });
    if (!statesEqual(before, after)) patchesByPolity[polityKey] = after;
  }
  return {
    schemaVersion: POLITICAL_PRESSURE_STATE_VERSION,
    updatedAt: clean(updatedAt),
    patchesByPolity,
    changedPolities: Object.keys(patchesByPolity).length
  };
};

// src/runtime/politicalActors.js
var POLITICAL_ACTORS_SCHEMA_VERSION = 6;
var POLITICAL_REPRESENTATIONS = Object.freeze({
  ELECTORAL: "electoral",
  COURT_FACTIONS: "court_factions",
  PARTY_STATE: "party_state",
  ELITE_FACTIONS: "elite_factions",
  MILITARY_FACTIONS: "military_factions",
  REVOLUTIONARY_FACTIONS: "revolutionary_factions",
  COLONIAL: "colonial",
  NONE: "none"
});
var POLITICAL_REPRESENTATION_SET = new Set(Object.values(POLITICAL_REPRESENTATIONS));
var POLITICAL_REGIME_CHARACTERS = Object.freeze([
  "democratic",
  "hybrid",
  "authoritarian",
  "totalitarian",
  "theocratic",
  "military",
  "colonial",
  "other"
]);
var POLITICAL_REGIME_CHARACTER_SET = new Set(POLITICAL_REGIME_CHARACTERS);
var TEXT_MEMO_LIMIT = 5e4;
var rememberedText = (fold) => {
  const memo = /* @__PURE__ */ new Map();
  return (value) => {
    if (typeof value !== "string") return fold(value);
    let answer = memo.get(value);
    if (answer === void 0) {
      answer = fold(value);
      if (memo.size >= TEXT_MEMO_LIMIT) memo.clear();
      memo.set(value, answer);
    }
    return answer;
  };
};
var clean2 = rememberedText((value) => String(value ?? "").replace(/\s+/g, " ").trim());
var lowerKey = rememberedText((text) => text.toLocaleLowerCase());
var NOT_PLAIN = /* @__PURE__ */ Symbol("not plain data");
var copyPlainData = (value, depth) => {
  if (value === null || typeof value !== "object") return typeof value === "function" ? NOT_PLAIN : value;
  if (depth > 64) return NOT_PLAIN;
  if (Array.isArray(value)) {
    const out2 = new Array(value.length);
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) continue;
      const item = copyPlainData(value[index], depth + 1);
      if (item === NOT_PLAIN) return NOT_PLAIN;
      out2[index] = item;
    }
    return out2;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return NOT_PLAIN;
  const out = {};
  for (const key of Object.keys(value)) {
    const item = copyPlainData(value[key], depth + 1);
    if (item === NOT_PLAIN) return NOT_PLAIN;
    out[key] = item;
  }
  return out;
};
var cloneActorValue = (value) => {
  if (!value || typeof value !== "object") return value;
  const copy = copyPlainData(value, 0);
  if (copy !== NOT_PLAIN) return copy;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};
var clampPercent2 = (value) => {
  if (value === null || value === void 0 || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, Math.round(number * 10) / 10));
};
var normalizeLandscapeShare = (value, { allowLabel = false } = {}) => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : { percent: value };
  const percent = clampPercent2(source.percent);
  const basis = clean2(source.basis);
  const label = allowLabel ? clean2(source.label) : "";
  if (percent == null && !label) return null;
  return {
    ...percent != null ? { percent } : {},
    ...basis ? { basis } : {},
    ...label ? { label } : {}
  };
};
var clampSignedPercent = (value) => {
  if (value === null || value === void 0 || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(-100, Math.min(100, Math.round(number * 10) / 10));
};
var POLITICAL_RESPONSE_ISSUE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
var normalizePoliticalResponseIssueKey = (value) => {
  const key = clean2(value).toLocaleLowerCase().replace(/[\s.]+/g, "_");
  return POLITICAL_RESPONSE_ISSUE_KEY_PATTERN.test(key) ? key : "";
};
var normalizePoliticalResponseIssue = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  const position = clampSignedPercent(value.position ?? value.stance);
  if (position != null) out.position = position;
  const sensitivity = clampPercent2(value.sensitivity ?? value.issueSensitivity);
  if (sensitivity != null) out.sensitivity = sensitivity;
  const strainResponse = clampSignedPercent(value.strainResponse ?? value.strainAffinity);
  if (strainResponse != null) out.strainResponse = strainResponse;
  return Object.keys(out).length ? out : null;
};
var normalizePoliticalResponseProfile = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const key of ["organization", "credibility", "inertia", "resilience"]) {
    const number = clampPercent2(value[key]);
    if (number != null) out[key] = number;
  }
  const sourceIssues = value.issues && typeof value.issues === "object" && !Array.isArray(value.issues) ? value.issues : {};
  const issues = {};
  for (const [rawKey, rawIssue] of Object.entries(sourceIssues).slice(0, 24)) {
    const key = normalizePoliticalResponseIssueKey(rawKey);
    if (!key) continue;
    const issue = normalizePoliticalResponseIssue(rawIssue);
    if (issue) issues[key] = issue;
  }
  if (Object.keys(issues).length) out.issues = issues;
  return Object.keys(out).length ? out : null;
};
var POLITICAL_DISPOSITION_DIMENSIONS = Object.freeze([
  "assertiveness",
  "riskTolerance",
  "escalationPressure",
  "compromisePressure",
  "regimeVulnerability",
  "deterrenceSensitivity",
  "opportunityPerception",
  "threatPerception"
]);
var normalizePoliticalBehavioralDisposition = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = cloneActorValue(value);
  let ownedFields = 0;
  for (const key of POLITICAL_DISPOSITION_DIMENSIONS) {
    const number = clampPercent2(value[key]);
    if (number != null) {
      out[key] = number;
      ownedFields += 1;
    } else {
      delete out[key];
    }
  }
  const updatedAt = clean2(value.updatedAt);
  if (updatedAt) out.updatedAt = updatedAt.slice(0, 32);
  else delete out.updatedAt;
  if (!ownedFields && !Object.keys(out).some((key) => key !== "updatedAt")) return null;
  return out;
};
var cleanStringArray = (value, limit = 32) => {
  const source = Array.isArray(value) ? value : clean2(value) ? [value] : [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const entry of source) {
    const text = clean2(entry);
    const key = lowerKey(text);
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
};
var normalizeMetricRecord = (value, { depth = 0, maxDepth = 3, maxKeys = 32, clampNumeric = false } = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > maxDepth) return {};
  const out = {};
  for (const [rawKey, rawValue] of Object.entries(value).slice(0, maxKeys)) {
    const key = clean2(rawKey);
    if (!key) continue;
    if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
      const nested = normalizeMetricRecord(rawValue, { depth: depth + 1, maxDepth, maxKeys, clampNumeric });
      if (Object.keys(nested).length) out[key] = nested;
      continue;
    }
    if (Array.isArray(rawValue)) {
      const list = cleanStringArray(rawValue, 16);
      if (list.length) out[key] = list;
      continue;
    }
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      const rounded = Math.round(rawValue * 10) / 10;
      out[key] = clampNumeric ? Math.max(0, Math.min(100, rounded)) : rounded;
      continue;
    }
    if (typeof rawValue === "boolean") {
      out[key] = rawValue;
      continue;
    }
    const text = clean2(rawValue);
    if (text) out[key] = text;
  }
  return out;
};
var normalizeOfficeholder = (value) => {
  if (typeof value === "string") return clean2(value);
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const name = clean2(value.name || value.id);
  if (!name) return "";
  const out = {};
  if (clean2(value.id)) out.id = clean2(value.id);
  out.name = name;
  const title = clean2(value.title || value.role);
  if (title) out.title = title;
  return out;
};
var partyTokenKey = (value) => clean2(value).toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "");
var asciiPartySlug = (value) => clean2(value).toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
var stableTextHash = (value) => {
  let hash = 2166136261;
  for (const char of String(value ?? "")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
var derivePartyId = (party, index = 0) => {
  const explicit = clean2(party?.id);
  if (explicit) return explicit;
  for (const candidate of [
    party?.shortName,
    party?.abbreviation,
    party?.name,
    ...Array.isArray(party?.aliases) ? party.aliases : []
  ]) {
    const slug = asciiPartySlug(candidate);
    if (slug) return slug;
  }
  const seed = clean2(party?.name || party?.shortName || party?.abbreviation) || `party-${index + 1}`;
  return `party-${stableTextHash(seed)}`;
};
var derivePoliticalEntityId = (value, index = 0, prefix = "bloc") => {
  const explicit = clean2(value?.id);
  if (explicit) return explicit;
  for (const candidate of [
    value?.shortName,
    value?.abbreviation,
    value?.name,
    ...Array.isArray(value?.aliases) ? value.aliases : []
  ]) {
    const slug = asciiPartySlug(candidate);
    if (slug) return slug;
  }
  const seed = clean2(value?.name || value?.shortName || value?.abbreviation) || `${prefix}-${index + 1}`;
  return `${prefix}-${stableTextHash(seed)}`;
};
var normalizePoliticalParty = (value, { index = 0 } = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const name = clean2(value.name || value.shortName || value.abbreviation || value.id);
  if (!name) return null;
  const out = cloneActorValue(value);
  out.id = derivePartyId(value, index);
  out.name = name;
  const shortName = clean2(value.shortName || value.abbreviation);
  if (shortName) out.shortName = shortName;
  else delete out.shortName;
  delete out.abbreviation;
  const aliases = cleanStringArray(value.aliases, 24).filter((alias) => partyTokenKey(alias) !== partyTokenKey(name));
  if (aliases.length) out.aliases = aliases;
  else delete out.aliases;
  const support = normalizeLandscapeShare(value.support);
  if (support) out.support = support;
  else delete out.support;
  const influence = normalizeLandscapeShare(value.influence, { allowLabel: true });
  if (influence) out.influence = influence;
  else delete out.influence;
  const politicalResponse = normalizePoliticalResponseProfile(value.politicalResponse || value.responseProfile);
  if (politicalResponse) out.politicalResponse = politicalResponse;
  else delete out.politicalResponse;
  delete out.responseProfile;
  const ideology = clean2(value.ideology);
  if (ideology) out.ideology = ideology;
  else delete out.ideology;
  const leader = normalizeOfficeholder(value.leader);
  if (leader) out.leader = leader;
  else delete out.leader;
  for (const key of ["goals", "publicPriorities", "publicForeignPolicy"]) {
    const list = cleanStringArray(value[key], 16);
    if (list.length) out[key] = list;
    else delete out[key];
  }
  for (const key of ["publicDescription", "color", "internalStrategy", "internalPressure", "privateGoal"]) {
    const text = clean2(value[key]);
    if (text) out[key] = text;
    else delete out[key];
  }
  if (value.ruling === true) out.ruling = true;
  else delete out.ruling;
  if (value.coalition === true) out.coalition = true;
  else delete out.coalition;
  return out;
};
var normalizePoliticalPowerBloc = (value, { index = 0 } = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const name = clean2(value.name || value.shortName || value.abbreviation || value.id);
  if (!name) return null;
  const out = cloneActorValue(value);
  out.id = derivePoliticalEntityId(value, index, "bloc");
  out.name = name;
  const shortName = clean2(value.shortName || value.abbreviation);
  if (shortName) out.shortName = shortName;
  else delete out.shortName;
  delete out.abbreviation;
  const aliases = cleanStringArray(value.aliases, 24).filter((alias) => partyTokenKey(alias) !== partyTokenKey(name));
  if (aliases.length) out.aliases = aliases;
  else delete out.aliases;
  const influenceSource = value?.influence && typeof value.influence === "object" && !Array.isArray(value.influence) ? { ...value.influence, ...clean2(value.influenceLabel) && !clean2(value.influence?.label) ? { label: clean2(value.influenceLabel) } : {} } : typeof value.influence === "number" ? { percent: value.influence, ...clean2(value.influenceLabel) ? { label: clean2(value.influenceLabel) } : {} } : { ...clean2(value.influenceLabel) ? { label: clean2(value.influenceLabel) } : {} };
  const influence = normalizeLandscapeShare(influenceSource, { allowLabel: true });
  if (influence) out.influence = influence;
  else delete out.influence;
  delete out.influenceLabel;
  const politicalResponse = normalizePoliticalResponseProfile(value.politicalResponse || value.responseProfile);
  if (politicalResponse) out.politicalResponse = politicalResponse;
  else delete out.politicalResponse;
  delete out.responseProfile;
  for (const key of ["kind", "ideology", "status", "publicDescription", "color", "internalStrategy", "internalPressure", "privateGoal"]) {
    const text = clean2(value[key]);
    if (text) out[key] = text;
    else delete out[key];
  }
  const leader = normalizeOfficeholder(value.leader);
  if (leader) out.leader = leader;
  else delete out.leader;
  for (const key of ["goals", "publicPriorities", "publicForeignPolicy"]) {
    const list = cleanStringArray(value[key], 16);
    if (list.length) out[key] = list;
    else delete out[key];
  }
  return out;
};
var inferPoliticalSystemType = (governmentForm) => {
  const form = clean2(governmentForm).toLocaleLowerCase();
  if (!form) return "unspecified";
  if (/absolute monarchy|absolute monarch/.test(form)) return "absolute_monarchy";
  if (/constitutional monarchy|constitutional monarch/.test(form)) return "constitutional_monarchy";
  if (/semi[- ]presidential republic/.test(form)) return "semi_presidential_republic";
  if (/parliamentary republic/.test(form)) return "parliamentary_republic";
  if (/presidential republic/.test(form)) return "presidential_republic";
  if (/one[- ]party|single[- ]party|party[- ]state/.test(form)) return "one_party_state";
  if (/military junta|military regime/.test(form)) return "military_regime";
  if (/personalist/.test(form)) return "personalist_regime";
  if (/revolutionary/.test(form)) return "revolutionary_government";
  if (/colonial|colony|protectorate|mandate/.test(form)) return "colonial_administration";
  return "unspecified";
};
var inferPoliticalRepresentation = ({ type = "", governmentForm = "", parties = [], powerBlocs = [] } = {}) => {
  const joined = `${clean2(type)} ${clean2(governmentForm)}`.toLocaleLowerCase();
  if (/absolute_monarchy|absolute monarchy|emirate|sultanate/.test(joined)) return POLITICAL_REPRESENTATIONS.COURT_FACTIONS;
  if (/one_party_state|one[- ]party|single[- ]party|party[- ]state/.test(joined)) return POLITICAL_REPRESENTATIONS.PARTY_STATE;
  if (/military_regime|military junta|military regime/.test(joined)) return POLITICAL_REPRESENTATIONS.MILITARY_FACTIONS;
  if (/revolutionary_government|revolutionary/.test(joined)) return POLITICAL_REPRESENTATIONS.REVOLUTIONARY_FACTIONS;
  if (/personalist_regime|personalist/.test(joined)) return POLITICAL_REPRESENTATIONS.ELITE_FACTIONS;
  if (/colonial_administration|colonial|colony|protectorate|mandate/.test(joined)) return POLITICAL_REPRESENTATIONS.COLONIAL;
  if (Array.isArray(parties) && parties.length) return POLITICAL_REPRESENTATIONS.ELECTORAL;
  if (Array.isArray(powerBlocs) && powerBlocs.length) return POLITICAL_REPRESENTATIONS.ELITE_FACTIONS;
  return POLITICAL_REPRESENTATIONS.NONE;
};
var normalizePoliticalSystem = (value, { government = {}, parties = [], powerBlocs = [] } = {}) => {
  const source = typeof value === "string" ? { type: value } : value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const out = cloneActorValue(source);
  const explicitType = clean2(source.type).toLocaleLowerCase().replace(/[ -]+/g, "_");
  const type = explicitType || inferPoliticalSystemType(government?.form);
  out.type = type || "unspecified";
  const explicitRepresentation = clean2(source.representation).toLocaleLowerCase().replace(/[ -]+/g, "_");
  out.representation = POLITICAL_REPRESENTATION_SET.has(explicitRepresentation) ? explicitRepresentation : inferPoliticalRepresentation({ type: out.type, governmentForm: government?.form, parties, powerBlocs });
  const regimeCharacter = clean2(source.regimeCharacter).toLocaleLowerCase().replace(/[ -]+/g, "_");
  if (POLITICAL_REGIME_CHARACTER_SET.has(regimeCharacter)) out.regimeCharacter = regimeCharacter;
  else delete out.regimeCharacter;
  for (const key of ["label", "notes"]) {
    const text = clean2(source[key]);
    if (text) out[key] = text;
    else delete out[key];
  }
  return out;
};
var partyTokens = (party) => [
  party?.id,
  party?.name,
  party?.shortName,
  ...Array.isArray(party?.aliases) ? party.aliases : []
].map(clean2).filter(Boolean);
var resolvePoliticalParty = (actorOrWorld, polityOrToken, maybeToken) => {
  const actor = maybeToken === void 0 ? actorOrWorld : getPoliticalProfile(actorOrWorld, polityOrToken);
  const token = maybeToken === void 0 ? polityOrToken : maybeToken;
  if (!actor || !Array.isArray(actor.parties)) return null;
  const target = partyTokenKey(token);
  if (!target) return null;
  return actor.parties.find(
    (party) => partyTokens(party).some((candidate) => partyTokenKey(candidate) === target)
  ) || null;
};
var normalizePartyReferenceList = (value, parties, { deriveFromFlags = null } = {}) => {
  const source = cleanStringArray(value, 32);
  const ids = [];
  const unresolvedNames = [];
  const seen = /* @__PURE__ */ new Set();
  for (const token of source) {
    const match = resolvePoliticalParty({ parties }, token);
    if (match) {
      if (!seen.has(match.id)) {
        seen.add(match.id);
        ids.push(match.id);
      }
    } else {
      const key = partyTokenKey(token);
      if (key && !seen.has(`name:${key}`)) {
        seen.add(`name:${key}`);
        unresolvedNames.push(token);
      }
    }
  }
  if (!ids.length && !unresolvedNames.length && deriveFromFlags) {
    for (const party of parties.filter((entry) => entry?.[deriveFromFlags] === true)) {
      if (!seen.has(party.id)) {
        seen.add(party.id);
        ids.push(party.id);
      }
    }
  }
  return { ids, unresolvedNames };
};
var partyDisplayNamesFromRefs = (ids, unresolvedNames, parties) => {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const id of ids) {
    const party = parties.find((entry) => entry.id === id);
    const name = clean2(party?.name || id);
    const key = partyTokenKey(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  for (const name of unresolvedNames) {
    const key = partyTokenKey(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
};
var normalizePoliticalGovernment = (value, parties = []) => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const out = cloneActorValue(source);
  for (const key of ["form", "ideology", "status", "coalitionName"]) {
    const text = clean2(source[key]);
    if (text) out[key] = text;
    else delete out[key];
  }
  const headOfState = normalizeOfficeholder(source.headOfState || source.headOfStateId);
  const headOfGovernment = normalizeOfficeholder(source.headOfGovernment || source.headOfGovernmentId);
  if (headOfState) out.headOfState = headOfState;
  else delete out.headOfState;
  if (headOfGovernment) out.headOfGovernment = headOfGovernment;
  else delete out.headOfGovernment;
  delete out.headOfStateId;
  delete out.headOfGovernmentId;
  for (const key of ["approval", "stability"]) {
    const number = clampPercent2(source[key]);
    if (number != null) out[key] = number;
    else delete out[key];
  }
  const hasExplicitRulingRefs = Object.prototype.hasOwnProperty.call(source, "rulingPartyIds") || Object.prototype.hasOwnProperty.call(source, "rulingParties") || Object.prototype.hasOwnProperty.call(source, "rulingParty");
  const hasExplicitCoalitionRefs = Object.prototype.hasOwnProperty.call(source, "coalitionPartyIds") || Object.prototype.hasOwnProperty.call(source, "coalition");
  const rulingTokens = [
    ...Array.isArray(source.rulingPartyIds) ? source.rulingPartyIds : [],
    ...Array.isArray(source.rulingParties) ? source.rulingParties : [],
    ...clean2(source.rulingParty) ? [source.rulingParty] : []
  ];
  const coalitionTokens = [
    ...Array.isArray(source.coalitionPartyIds) ? source.coalitionPartyIds : [],
    ...Array.isArray(source.coalition) ? source.coalition : []
  ];
  const ruling = normalizePartyReferenceList(rulingTokens, parties, {
    deriveFromFlags: hasExplicitRulingRefs ? null : "ruling"
  });
  const coalition = normalizePartyReferenceList(coalitionTokens, parties, {
    deriveFromFlags: hasExplicitCoalitionRefs ? null : "coalition"
  });
  out.rulingPartyIds = ruling.ids;
  out.coalitionPartyIds = coalition.ids;
  out.rulingParties = partyDisplayNamesFromRefs(ruling.ids, ruling.unresolvedNames, parties);
  out.coalition = partyDisplayNamesFromRefs(coalition.ids, coalition.unresolvedNames, parties);
  delete out.rulingParty;
  return out;
};
var REBUILT_ACTOR_FIELDS = /* @__PURE__ */ new Set([
  "government",
  "parties",
  "powerBlocs",
  "politicalSystem",
  "leader",
  "goals",
  "fears",
  "ambitions",
  "domesticPressures",
  "tags",
  "traits",
  "perceptions",
  "behavioralDisposition",
  "politicalPressures",
  "name",
  "ideology"
]);
var normalizePoliticalActorRecord = (value, fallbackPolityKey = "") => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const key of Object.keys(value)) out[key] = REBUILT_ACTOR_FIELDS.has(key) ? null : cloneActorValue(value[key]);
  const polityKey = clean2(value.polityKey || fallbackPolityKey);
  if (polityKey) out.polityKey = polityKey;
  const parties = [];
  const seenIds = /* @__PURE__ */ new Set();
  for (const [index, rawParty] of (Array.isArray(value.parties) ? value.parties : []).entries()) {
    const party = normalizePoliticalParty(rawParty, { index });
    if (!party) continue;
    let id = party.id;
    if (seenIds.has(id)) {
      id = `${id}-${stableTextHash(`${party.name}:${index}`)}`;
      party.id = id;
    }
    seenIds.add(id);
    parties.push(party);
  }
  const governmentSource = value.government && typeof value.government === "object" && !Array.isArray(value.government) ? value.government : {};
  const government = normalizePoliticalGovernment(
    governmentSource.ideology || !clean2(value.ideology) ? governmentSource : { ...governmentSource, ideology: value.ideology },
    parties
  );
  const rulingIds = new Set(government.rulingPartyIds || []);
  const coalitionIds = new Set(government.coalitionPartyIds || []);
  for (const party of parties) {
    if (rulingIds.has(party.id)) party.ruling = true;
    else delete party.ruling;
    if (coalitionIds.has(party.id)) party.coalition = true;
    else delete party.coalition;
  }
  const powerBlocs = [];
  const seenBlocIds = /* @__PURE__ */ new Set();
  for (const [index, rawBloc] of (Array.isArray(value.powerBlocs) ? value.powerBlocs : []).entries()) {
    const bloc = normalizePoliticalPowerBloc(rawBloc, { index });
    if (!bloc) continue;
    let id = bloc.id;
    if (seenBlocIds.has(id)) {
      id = `${id}-${stableTextHash(`${bloc.name}:${index}`)}`;
      bloc.id = id;
    }
    seenBlocIds.add(id);
    powerBlocs.push(bloc);
  }
  out.government = government;
  out.parties = parties;
  out.powerBlocs = powerBlocs;
  out.politicalSystem = normalizePoliticalSystem(value.politicalSystem, {
    government,
    parties,
    powerBlocs
  });
  const leader = normalizeOfficeholder(value.leader || government.headOfState);
  if (leader) out.leader = leader;
  else delete out.leader;
  for (const key of ["goals", "fears", "ambitions", "domesticPressures", "tags"]) {
    const list = cleanStringArray(value[key], key === "tags" ? 24 : 32);
    if (list.length) out[key] = list;
    else delete out[key];
  }
  for (const key of ["traits", "perceptions"]) {
    const record = normalizeMetricRecord(value[key], {
      clampNumeric: key !== "perceptions"
    });
    if (Object.keys(record).length) out[key] = record;
    else delete out[key];
  }
  const behavioralDisposition = normalizePoliticalBehavioralDisposition(value.behavioralDisposition);
  if (behavioralDisposition) out.behavioralDisposition = behavioralDisposition;
  else delete out.behavioralDisposition;
  const politicalPressures = normalizePoliticalPressureState(value.politicalPressures);
  if (Object.keys(politicalPressures.issues).length || politicalPressures.updatedAt) {
    out.politicalPressures = politicalPressures;
  } else {
    delete out.politicalPressures;
  }
  const name = clean2(value.name);
  if (name) out.name = name;
  else delete out.name;
  delete out.ideology;
  return out;
};
function normalizePoliticalActors(input) {
  const source = input && typeof input === "object" ? input : {};
  const byPolity = {};
  if (source.byPolity && typeof source.byPolity === "object" && !Array.isArray(source.byPolity)) {
    for (const [rawKey, rawActor] of Object.entries(source.byPolity)) {
      const key = clean2(rawKey);
      if (!key || !rawActor || typeof rawActor !== "object" || Array.isArray(rawActor)) continue;
      const actor = normalizePoliticalActorRecord(rawActor, key);
      if (actor) byPolity[key] = actor;
    }
  }
  return {
    schemaVersion: POLITICAL_ACTORS_SCHEMA_VERSION,
    byPolity
  };
}
function candidatesForPolity(world, key) {
  if (!key) return [];
  const out = [key];
  const override = world?.polityOverrides?.[key];
  if (override?.name) out.push(override.name);
  for (const [candidateKey, candidate] of Object.entries(world?.polityOverrides || {})) {
    if (candidateKey === key || candidate?.name === key || candidate?.aliases?.includes?.(key)) {
      out.push(candidateKey, candidate?.name, ...candidate?.aliases || []);
    }
  }
  return [...new Set(out.filter(Boolean))];
}
function ownPolityNames(world) {
  const names = new Set(Object.keys(world?.polityOverrides || {}).map(clean2));
  for (const owner of Object.values(world?.regionOwnershipOverrides || {})) names.add(clean2(owner));
  names.delete("");
  return names;
}
function getPoliticalProfile(world, polityKey) {
  const byPolity = world?.politicalActors?.byPolity;
  if (!byPolity) return null;
  const normalizeActorKey = (value) => String(value ?? "").trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "");
  for (const candidate of candidatesForPolity(world, polityKey)) {
    if (byPolity[candidate]) return byPolity[candidate];
  }
  const normalizedTargetKeys = new Set(
    candidatesForPolity(world, polityKey).map(normalizeActorKey).filter(Boolean)
  );
  for (const [actorKey, actor] of Object.entries(byPolity)) {
    if (normalizedTargetKeys.has(normalizeActorKey(actorKey))) return actor;
    if (actor?.polityKey && normalizedTargetKeys.has(normalizeActorKey(actor.polityKey))) return actor;
    if (actor?.name && normalizedTargetKeys.has(normalizeActorKey(actor.name))) return actor;
  }
  const candidates = new Set(candidatesForPolity(world, polityKey));
  for (const actor of Object.values(byPolity)) {
    if (!actor || typeof actor !== "object") continue;
    if (actor.polityKey && candidates.has(actor.polityKey)) return actor;
  }
  for (const [actorKey, actor] of Object.entries(byPolity)) {
    if (candidates.has(actorKey)) return actor;
  }
  const stockCode = resolveStockCountryCode(polityKey);
  if (stockCode) {
    const ownPolities = ownPolityNames(world);
    const requested = clean2(polityKey);
    const isOtherPolity = (token) => clean2(token) !== requested && ownPolities.has(clean2(token));
    const requestedIsOwnPolity = ownPolities.has(requested);
    for (const [actorKey, actor] of Object.entries(byPolity)) {
      if (requestedIsOwnPolity && [actorKey, actor?.polityKey].some((token) => token && isOtherPolity(token))) continue;
      const actorTokens = [actorKey, actor?.polityKey, actor?.name].filter(Boolean);
      if (actorTokens.some((token) => resolveStockCountryCode(token) === stockCode)) return actor;
    }
  }
  return null;
}

// src/runtime/politicalTraitRegistry.js
var defineTrait = (key, label, description, aliases = []) => Object.freeze({
  key,
  label,
  description,
  min: 0,
  max: 100,
  aliases: Object.freeze([...aliases]),
  editable: true
});
var POLITICAL_TRAIT_REGISTRY = Object.freeze([
  defineTrait(
    "riskTolerance",
    "Risk tolerance",
    "Willingness to accept uncertain costs and downside in pursuit of political or strategic opportunity.",
    ["risk_tolerance"]
  ),
  defineTrait(
    "recklessness",
    "Recklessness",
    "Tendency to discount downside, safeguards, institutional restraint, or second-order consequences.",
    ["reckless"]
  ),
  defineTrait(
    "caution",
    "Caution",
    "Preference for verification, delay, hedging, and risk reduction before committing to consequential action.",
    ["cautious"]
  ),
  defineTrait(
    "opportunism",
    "Opportunism",
    "Readiness to exploit openings, rival weakness, ambiguity, or temporary changes in the balance of power.",
    ["opportunistic"]
  ),
  defineTrait(
    "militarism",
    "Militarism",
    "Preference for military power, coercive instruments, readiness, prestige, and force-backed solutions.",
    ["militaristic"]
  ),
  defineTrait(
    "conciliatory",
    "Conciliatory tendency",
    "Preference for accommodation, de-escalation, negotiated settlement, and preservation of workable relationships.",
    ["conciliation"]
  ),
  defineTrait(
    "pragmatism",
    "Pragmatism",
    "Willingness to adapt means, alliances, or doctrine when practical outcomes outweigh ideological consistency.",
    ["pragmatic"]
  ),
  defineTrait(
    "paranoia",
    "Paranoia",
    "Tendency to infer hidden hostility, conspiracy, encirclement, or bad faith under ambiguous conditions.",
    ["paranoid"]
  ),
  defineTrait(
    "vindictiveness",
    "Vindictiveness",
    "Persistence in retaliation, punishment, or grievance after perceived injury, humiliation, betrayal, or defiance.",
    ["vindictive"]
  ),
  defineTrait(
    "consensusDriven",
    "Consensus driven",
    "Preference for internal coalition, elite, institutional, or cabinet consensus before major decisions.",
    ["consensus_driven", "consensus"]
  )
]);
var POLITICAL_TRAIT_KEYS = Object.freeze(POLITICAL_TRAIT_REGISTRY.map((entry) => entry.key));
var cleanKey = (value) => String(value ?? "").replace(/[^a-z0-9]+/gi, "").toLocaleLowerCase();
var aliasMap = /* @__PURE__ */ new Map();
for (const entry of POLITICAL_TRAIT_REGISTRY) {
  for (const token of [entry.key, ...entry.aliases]) aliasMap.set(cleanKey(token), entry.key);
}
var canonicalPoliticalTraitKey = (value) => aliasMap.get(cleanKey(value)) || "";

// src/runtime/politicalActorOps.js
var POLITICAL_ACTOR_OPS = Object.freeze({
  CREATE_PARTY: "create-party",
  UPDATE_PARTY: "update-party",
  SET_PARTY_SUPPORT: "set-party-support",
  SET_PARTY_INFLUENCE: "set-party-influence",
  SET_PARTY_LEADER: "set-party-leader",
  CREATE_POWER_BLOC: "create-power-bloc",
  UPDATE_POWER_BLOC: "update-power-bloc",
  SET_POWER_BLOC_INFLUENCE: "set-power-bloc-influence",
  SET_POLITICAL_PRESSURES: "set-political-pressures",
  SET_BEHAVIORAL_DISPOSITION: "set-behavioral-disposition",
  SET_POLITICAL_SYSTEM: "set-political-system",
  SET_GOVERNMENT: "set-government",
  FORM_COALITION: "form-coalition",
  LEAVE_COALITION: "leave-coalition",
  REPLACE_LEADER: "replace-leader",
  SET_STRATEGY: "set-strategy",
  SET_TRAITS: "set-traits",
  SET_PERCEPTIONS: "set-perceptions",
  REMOVE_PERCEPTION: "remove-perception"
});
var POLITICAL_ACTOR_GENERATED_OP_EXAMPLES = Object.freeze({
  [POLITICAL_ACTOR_OPS.CREATE_PARTY]: Object.freeze({
    party: Object.freeze({ id: "stable-party-id", name: "Party Name", ideology: "Political ideology" })
  }),
  [POLITICAL_ACTOR_OPS.UPDATE_PARTY]: Object.freeze({
    partyId: "stable-party-id",
    patch: Object.freeze({ ideology: "Updated ideology", publicDescription: "Public description" })
  }),
  [POLITICAL_ACTOR_OPS.SET_PARTY_SUPPORT]: Object.freeze({ partyId: "stable-party-id", percent: 42 }),
  [POLITICAL_ACTOR_OPS.SET_PARTY_INFLUENCE]: Object.freeze({ partyId: "stable-party-id", percent: 42 }),
  [POLITICAL_ACTOR_OPS.SET_PARTY_LEADER]: Object.freeze({
    partyId: "stable-party-id",
    leader: Object.freeze({ name: "Party Leader" })
  }),
  [POLITICAL_ACTOR_OPS.CREATE_POWER_BLOC]: Object.freeze({
    bloc: Object.freeze({ id: "stable-bloc-id", name: "Power Bloc", kind: "court", ideology: "Political outlook" })
  }),
  [POLITICAL_ACTOR_OPS.UPDATE_POWER_BLOC]: Object.freeze({
    blocId: "stable-bloc-id",
    patch: Object.freeze({ ideology: "Updated outlook", publicDescription: "Public description" })
  }),
  [POLITICAL_ACTOR_OPS.SET_POWER_BLOC_INFLUENCE]: Object.freeze({
    blocId: "stable-bloc-id",
    percent: 40,
    label: "strong"
  }),
  [POLITICAL_ACTOR_OPS.SET_POLITICAL_SYSTEM]: Object.freeze({
    patch: Object.freeze({
      type: "parliamentary_republic",
      representation: "electoral",
      regimeCharacter: "democratic",
      publicLabel: "Parliamentary Republic"
    })
  }),
  [POLITICAL_ACTOR_OPS.SET_GOVERNMENT]: Object.freeze({
    patch: Object.freeze({ form: "Parliamentary Republic", ideology: "social liberalism" })
  }),
  [POLITICAL_ACTOR_OPS.FORM_COALITION]: Object.freeze({
    rulingPartyIds: Object.freeze(["stable-party-id"]),
    coalitionPartyIds: Object.freeze(["coalition-party-id"]),
    coalitionName: "Governing Coalition"
  }),
  [POLITICAL_ACTOR_OPS.LEAVE_COALITION]: Object.freeze({ partyId: "stable-party-id" }),
  [POLITICAL_ACTOR_OPS.REPLACE_LEADER]: Object.freeze({
    office: "headOfGovernment",
    leader: Object.freeze({ name: "Officeholder" })
  }),
  [POLITICAL_ACTOR_OPS.SET_STRATEGY]: Object.freeze({
    patch: Object.freeze({
      goals: Object.freeze(["Goal"]),
      fears: Object.freeze(["Fear"]),
      ambitions: Object.freeze(["Ambition"]),
      domesticPressures: Object.freeze(["Domestic pressure"])
    })
  }),
  [POLITICAL_ACTOR_OPS.SET_TRAITS]: Object.freeze({
    traits: Object.freeze({ pragmatism: 70, caution: 55 })
  }),
  [POLITICAL_ACTOR_OPS.SET_PERCEPTIONS]: Object.freeze({
    perceptions: Object.freeze({
      "Other Polity": Object.freeze({ threat: 70, opportunity: 30, weakness: 40, cohesionEstimate: 65 })
    })
  }),
  [POLITICAL_ACTOR_OPS.REMOVE_PERCEPTION]: Object.freeze({ target: "Other Polity" })
});
var GENERATED_OP_NOTES = Object.freeze({
  [POLITICAL_ACTOR_OPS.CREATE_PARTY]: "party fields MUST be nested under party; do not put name/id/ideology at argsJson root",
  [POLITICAL_ACTOR_OPS.CREATE_POWER_BLOC]: "power-bloc fields MUST be nested under bloc (or powerBloc)",
  [POLITICAL_ACTOR_OPS.SET_PARTY_SUPPORT]: "use for electoral/popular support; percent is 0-100",
  [POLITICAL_ACTOR_OPS.SET_PARTY_INFLUENCE]: "use for non-electoral or party-state influence; percent is 0-100",
  [POLITICAL_ACTOR_OPS.SET_POWER_BLOC_INFLUENCE]: "percent is 0-100; label is optional",
  [POLITICAL_ACTOR_OPS.SET_GOVERNMENT]: "government fields belong inside patch; this does NOT establish governing party membership - use form-coalition for that",
  [POLITICAL_ACTOR_OPS.FORM_COALITION]: "use to establish governing party membership even for a single-party or minority government; REUSE exact existing canonical party ids when parties already exist; rulingPartyIds may contain one party and coalitionPartyIds may be empty",
  [POLITICAL_ACTOR_OPS.SET_TRAITS]: "trait keys must come from the canonical trait registry and values are 0-100",
  [POLITICAL_ACTOR_OPS.SET_PERCEPTIONS]: "perceptions are subjective beliefs keyed by target polity; common bounded metrics include threat, opportunity, weakness and cohesionEstimate"
});
var POLITICAL_ACTOR_GENERATED_ARG_GUIDANCE = [
  "Inside argsJson, encode EXACTLY one JSON object using the native shape for the chosen op:",
  ...Object.entries(POLITICAL_ACTOR_GENERATED_OP_EXAMPLES).map(([op, args]) => {
    const note = GENERATED_OP_NOTES[op] ? ` - ${GENERATED_OP_NOTES[op]}` : "";
    return `- ${op} argsJson=${JSON.stringify(args)}${note}`;
  }),
  "Dependency order inside one event: create-party/create-power-bloc first; then update/support/influence/party-leader; then form-coalition/set-government/replace-leader; then strategy/traits/perceptions. When a later op references an entity created earlier in the same event, use that create op's exact stable id.",
  "Government formation in a parliamentary party system must identify the governing force canonically. Use form-coalition to set rulingPartyIds/coalitionPartyIds; set-government plus replace-leader alone does not say which party or parties govern.",
  "When a polity already has canonical parties, government formation MUST reuse their exact existing ids. Do not create replacement/near-duplicate parties merely to populate form-coalition. create-party is only for an event that actually establishes a genuinely new party, split, merger or reorganization."
].join("\n");

// src/runtime/politicalResponse.js
var POLITICAL_RESPONSE_RESULT_VERSION = 1;
var MAX_ENTITY_MOVE_PER_TICK = 2.5;
var SCORE_LIMIT = 1.5;
var EPSILON = 0.05;
var clean3 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
var round12 = (value) => Math.round(Number(value) * 10) / 10;
var clamp2 = (value, min, max) => Math.max(min, Math.min(max, value));
var asArray = (value) => Array.isArray(value) ? value : [];
var numericPercent = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? clamp2(number, 0, 100) : null;
};
var stableHash = (value) => {
  let hash = 2166136261;
  for (const char of String(value ?? "")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};
var deterministicVariation = (seed) => 0.97 + stableHash(seed) % 601 / 1e4;
var profileMetric = (profile, key, fallback) => {
  const number = Number(profile?.[key]);
  return Number.isFinite(number) ? clamp2(number, 0, 100) : fallback;
};
var governingExposureForParty = (party) => {
  if (party?.ruling === true) return 1;
  if (party?.coalition === true) return 0.65;
  return 0;
};
var issueContribution = ({ pressure, responseIssue, entityKind, governingExposure }) => {
  const sensitivity = numericPercent(responseIssue?.sensitivity) ?? 50;
  const sensitivityFactor = sensitivity / 100;
  if (sensitivityFactor <= 0) return 0;
  const salience = numericPercent(pressure?.salience) ?? 0;
  const strain = numericPercent(pressure?.strain) ?? 0;
  const lean = clamp2(Number(pressure?.lean) || 0, -100, 100);
  const momentum = clamp2(Number(pressure?.momentum) || 0, -100, 100);
  const position = clamp2(Number(responseIssue?.position) || 0, -100, 100);
  const strainResponse = clamp2(Number(responseIssue?.strainResponse) || 0, -100, 100);
  const trendFactor = clamp2(1 + momentum / 400, 0.75, 1.25);
  const importance = salience / 100 * sensitivityFactor * trendFactor;
  const directionalFit = lean / 100 * (position / 100);
  const directional = importance * directionalFit;
  const strainMagnitude = strain / 100 * sensitivityFactor;
  const authoredStrain = strainMagnitude * (strainResponse / 100) * 0.65;
  if (entityKind !== "party") return directional + authoredStrain;
  if (governingExposure > 0) {
    return directional + authoredStrain - strainMagnitude * 0.55 * governingExposure;
  }
  const oppositionOpportunity = strainMagnitude * 0.12 * (0.5 + 0.5 * Math.max(0, directionalFit));
  return directional + authoredStrain + oppositionOpportunity;
};
var responseDeltaForEntity = ({ polityKey, entityKind, entity, pressures, updatedAt }) => {
  const profile = entity?.politicalResponse;
  const responseIssues = profile?.issues && typeof profile.issues === "object" && !Array.isArray(profile.issues) ? profile.issues : {};
  if (!Object.keys(responseIssues).length) return 0;
  let score = 0;
  let matchedIssues = 0;
  const governingExposure = entityKind === "party" ? governingExposureForParty(entity) : 0;
  for (const [issueKey, responseIssue] of Object.entries(responseIssues)) {
    const pressure = pressures?.issues?.[issueKey];
    if (!pressure) continue;
    matchedIssues += 1;
    score += issueContribution({
      pressure,
      responseIssue,
      entityKind,
      governingExposure
    });
  }
  if (!matchedIssues || Math.abs(score) <= Number.EPSILON) return 0;
  score = clamp2(score, -SCORE_LIMIT, SCORE_LIMIT);
  const organization = profileMetric(profile, "organization", 50);
  const credibility = profileMetric(profile, "credibility", 50);
  const inertia = profileMetric(profile, "inertia", 70);
  const resilience = profileMetric(profile, "resilience", 50);
  const capacityFactor = (0.75 + organization / 200) * (0.75 + credibility / 200);
  const inertiaFactor = 0.45 + (100 - inertia) / 100 * 0.55;
  const resilienceFactor = score < 0 ? 0.75 + (100 - resilience) / 100 * 0.25 : 1;
  const variation = deterministicVariation(`${polityKey}|${entityKind}|${entity.id}|${updatedAt}`);
  const delta = score * 2.2 * capacityFactor * inertiaFactor * resilienceFactor * variation;
  return round12(clamp2(delta, -MAX_ENTITY_MOVE_PER_TICK, MAX_ENTITY_MOVE_PER_TICK));
};
var rebalanceCompetitivePercentages = (entries) => {
  if (!entries.length) return [];
  const initialTotal = entries.reduce((sum, entry) => sum + entry.before, 0);
  const ceiling = Math.max(100, initialTotal);
  let next = entries.map((entry) => ({
    ...entry,
    after: round12(clamp2(entry.before + entry.directDelta, 0, 100))
  }));
  const nextTotal = next.reduce((sum, entry) => sum + entry.after, 0);
  if (nextTotal > ceiling + EPSILON && nextTotal > 0) {
    const scale = ceiling / nextTotal;
    next = next.map((entry) => ({
      ...entry,
      after: round12(clamp2(entry.after * scale, 0, 100))
    }));
  }
  return next;
};
var partyResponseForActor = ({ actor, polityKey, pressures, updatedAt }) => {
  const entries = [];
  for (const party of asArray(actor.parties)) {
    const before = numericPercent(party?.support?.percent);
    if (before == null) continue;
    entries.push({
      id: clean3(party.id),
      before,
      directDelta: responseDeltaForEntity({
        polityKey,
        entityKind: "party",
        entity: party,
        pressures,
        updatedAt
      })
    });
  }
  if (!entries.some((entry) => Math.abs(entry.directDelta) >= EPSILON)) return [];
  return rebalanceCompetitivePercentages(entries).filter((entry) => Math.abs(entry.after - entry.before) >= EPSILON).map((entry) => ({
    kind: "party",
    id: entry.id,
    from: round12(entry.before),
    to: round12(entry.after),
    delta: round12(entry.after - entry.before),
    directDelta: entry.directDelta
  }));
};
var partyInfluenceResponseForActor = ({ actor, polityKey, pressures, updatedAt }) => {
  const entries = [];
  for (const party of asArray(actor.parties)) {
    const before = numericPercent(party?.influence?.percent);
    if (before == null) continue;
    entries.push({
      id: clean3(party.id),
      before,
      directDelta: responseDeltaForEntity({
        polityKey,
        entityKind: "party",
        entity: party,
        pressures,
        updatedAt
      })
    });
  }
  if (!entries.some((entry) => Math.abs(entry.directDelta) >= EPSILON)) return [];
  return rebalanceCompetitivePercentages(entries).filter((entry) => Math.abs(entry.after - entry.before) >= EPSILON).map((entry) => ({
    kind: "party-influence",
    id: entry.id,
    from: round12(entry.before),
    to: round12(entry.after),
    delta: round12(entry.after - entry.before),
    directDelta: entry.directDelta
  }));
};
var powerBlocResponseForActor = ({ actor, polityKey, pressures, updatedAt }) => {
  const entries = [];
  for (const bloc of asArray(actor.powerBlocs)) {
    const before = numericPercent(bloc?.influence?.percent);
    if (before == null) continue;
    entries.push({
      id: clean3(bloc.id),
      before,
      directDelta: responseDeltaForEntity({
        polityKey,
        entityKind: "power-bloc",
        entity: bloc,
        pressures,
        updatedAt
      })
    });
  }
  if (!entries.some((entry) => Math.abs(entry.directDelta) >= EPSILON)) return [];
  return rebalanceCompetitivePercentages(entries).filter((entry) => Math.abs(entry.after - entry.before) >= EPSILON).map((entry) => ({
    kind: "power-bloc",
    id: entry.id,
    from: round12(entry.before),
    to: round12(entry.after),
    delta: round12(entry.after - entry.before),
    directDelta: entry.directDelta
  }));
};
var advancePoliticalResponseForActor = (inputActor, { polityKey = "", updatedAt = "" } = {}) => {
  const actor = normalizePoliticalActorRecord(inputActor, polityKey);
  if (!actor) return { polityKey: clean3(polityKey), changes: [], operations: [] };
  const key = clean3(actor.polityKey || polityKey);
  const pressures = normalizePoliticalPressureState(actor.politicalPressures);
  if (!Object.keys(pressures.issues).length) return { polityKey: key, changes: [], operations: [] };
  const tickId = clean3(updatedAt || pressures.updatedAt);
  const representation = clean3(actor?.politicalSystem?.representation);
  let changes = [];
  if (representation === POLITICAL_REPRESENTATIONS.ELECTORAL) {
    changes = partyResponseForActor({ actor, polityKey: key, pressures, updatedAt: tickId });
  } else if (representation === POLITICAL_REPRESENTATIONS.PARTY_STATE) {
    changes = asArray(actor.powerBlocs).length ? powerBlocResponseForActor({ actor, polityKey: key, pressures, updatedAt: tickId }) : partyInfluenceResponseForActor({ actor, polityKey: key, pressures, updatedAt: tickId });
  } else if (representation && representation !== POLITICAL_REPRESENTATIONS.NONE) {
    changes = powerBlocResponseForActor({ actor, polityKey: key, pressures, updatedAt: tickId });
  }
  const operations = changes.map((change) => {
    if (change.kind === "party") {
      return {
        op: POLITICAL_ACTOR_OPS.SET_PARTY_SUPPORT,
        polityKey: key,
        partyId: change.id,
        percent: change.to
      };
    }
    if (change.kind === "party-influence") {
      return {
        op: POLITICAL_ACTOR_OPS.SET_PARTY_INFLUENCE,
        polityKey: key,
        partyId: change.id,
        percent: change.to
      };
    }
    return {
      op: POLITICAL_ACTOR_OPS.SET_POWER_BLOC_INFLUENCE,
      polityKey: key,
      blocId: change.id,
      percent: change.to
    };
  });
  return { polityKey: key, changes, operations };
};
var advancePoliticalResponseBatch = ({ actorsByPolity = {}, updatedAt = "" } = {}) => {
  const source = actorsByPolity && typeof actorsByPolity === "object" && !Array.isArray(actorsByPolity) ? actorsByPolity : {};
  const operations = [];
  const changesByPolity = {};
  for (const polityKey of Object.keys(source).sort((left, right) => left.localeCompare(right))) {
    const result = advancePoliticalResponseForActor(source[polityKey], { polityKey, updatedAt });
    if (!result.changes.length) continue;
    changesByPolity[polityKey] = result.changes;
    operations.push(...result.operations);
  }
  return {
    schemaVersion: POLITICAL_RESPONSE_RESULT_VERSION,
    updatedAt: clean3(updatedAt),
    operations,
    changesByPolity,
    changedPolities: Object.keys(changesByPolity).length,
    changedEntities: operations.length
  };
};

// src/runtime/politicalDisposition.js
var POLITICAL_DISPOSITION_RESULT_VERSION = 1;
var clean4 = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
var clamp3 = (value, min, max) => Math.max(min, Math.min(max, value));
var round13 = (value) => Math.round(Number(value) * 10) / 10;
var finite = (value) => {
  if (value === null || value === void 0 || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
var metricKey = (value) => clean4(value).toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");
var traitMetricFromRecord = (record, canonicalKey) => {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  for (const [key, raw] of Object.entries(record)) {
    if (canonicalPoliticalTraitKey(key) !== canonicalKey) continue;
    const number = finite(raw);
    if (number == null) continue;
    return clamp3(number, 0, 100);
  }
  return null;
};
var add = (bucket, target, weight = 1) => {
  const score = finite(target);
  const w = finite(weight);
  if (score == null || w == null || w <= 0) return;
  bucket.total += clamp3(score, 0, 100) * w;
  bucket.weight += w;
};
var resolve = (bucket) => bucket.weight > 0 ? round13(clamp3(bucket.total / bucket.weight, 0, 100)) : null;
var makeBuckets = () => ({
  assertiveness: { total: 0, weight: 0 },
  riskTolerance: { total: 0, weight: 0 },
  escalationPressure: { total: 0, weight: 0 },
  compromisePressure: { total: 0, weight: 0 },
  regimeVulnerability: { total: 0, weight: 0 },
  deterrenceSensitivity: { total: 0, weight: 0 },
  opportunityPerception: { total: 0, weight: 0 },
  threatPerception: { total: 0, weight: 0 }
});
var pressureMagnitude = (state, key) => {
  const issue = state?.issues?.[key];
  if (!issue) return null;
  return round13(clamp3(Math.max(Number(issue.salience) || 0, Number(issue.strain) || 0), 0, 100));
};
var directionalPressure = (state, key) => {
  const issue = state?.issues?.[key];
  if (!issue) return null;
  const salience = clamp3(Number(issue.salience) || 0, 0, 100);
  const lean = clamp3(Number(issue.lean) || 0, -100, 100);
  return round13(clamp3(50 + salience * lean / 200, 0, 100));
};
var averagePressureStrain = (state) => {
  const issues = Object.values(state?.issues || {});
  if (!issues.length) return null;
  const weighted = issues.map((issue) => ({
    strain: clamp3(Number(issue?.strain) || 0, 0, 100),
    weight: Math.max(10, clamp3(Number(issue?.salience) || 0, 0, 100))
  }));
  const weight = weighted.reduce((sum, row) => sum + row.weight, 0);
  if (!weight) return null;
  return round13(weighted.reduce((sum, row) => sum + row.strain * row.weight, 0) / weight);
};
var collectPerceptionMetrics = (value, output = [], depth = 0) => {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 3) return output;
  for (const [key, raw] of Object.entries(value).slice(0, 32)) {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      collectPerceptionMetrics(raw, output, depth + 1);
      continue;
    }
    const number = finite(raw);
    if (number == null) continue;
    output.push({ key: metricKey(key), value: number });
  }
  return output;
};
var averageNamedPerception = (perceptions, aliases, { invert = false } = {}) => {
  const aliasSet = new Set(aliases.map(metricKey));
  const values = collectPerceptionMetrics(perceptions).filter((entry) => aliasSet.has(entry.key)).map((entry) => clamp3(entry.value, 0, 100));
  if (!values.length) return null;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return round13(invert ? 100 - average : average);
};
var governingSupport = (actor) => {
  const government = actor?.government && typeof actor.government === "object" ? actor.government : {};
  const ids = /* @__PURE__ */ new Set([
    ...Array.isArray(government.rulingPartyIds) ? government.rulingPartyIds : [],
    ...Array.isArray(government.coalitionPartyIds) ? government.coalitionPartyIds : []
  ]);
  if (!ids.size) return null;
  const values = (Array.isArray(actor?.parties) ? actor.parties : []).filter((party) => ids.has(party?.id)).map((party) => finite(party?.support?.percent)).filter((value) => value != null);
  if (!values.length) return null;
  return round13(clamp3(values.reduce((sum, value) => sum + value, 0), 0, 100));
};
var derivePoliticalDispositionForActor = (inputActor, { polityKey = "", updatedAt = "" } = {}) => {
  const actor = normalizePoliticalActorRecord(inputActor, polityKey);
  if (!actor) return null;
  const buckets = makeBuckets();
  const traits = actor.traits && typeof actor.traits === "object" ? actor.traits : {};
  const pressures = normalizePoliticalPressureState(actor.politicalPressures);
  const government = actor.government && typeof actor.government === "object" ? actor.government : {};
  const riskTolerance = traitMetricFromRecord(traits, "riskTolerance");
  const recklessness = traitMetricFromRecord(traits, "recklessness");
  const caution = traitMetricFromRecord(traits, "caution");
  const opportunism = traitMetricFromRecord(traits, "opportunism");
  const militarism = traitMetricFromRecord(traits, "militarism");
  const conciliatory = traitMetricFromRecord(traits, "conciliatory");
  const pragmatism = traitMetricFromRecord(traits, "pragmatism");
  const paranoia = traitMetricFromRecord(traits, "paranoia");
  const vindictiveness = traitMetricFromRecord(traits, "vindictiveness");
  const consensus = traitMetricFromRecord(traits, "consensusDriven");
  add(buckets.riskTolerance, riskTolerance, 1);
  add(buckets.riskTolerance, recklessness, 0.55);
  if (caution != null) add(buckets.riskTolerance, 100 - caution, 0.65);
  add(buckets.assertiveness, riskTolerance, 0.25);
  add(buckets.assertiveness, opportunism, 0.5);
  add(buckets.assertiveness, militarism, 0.55);
  add(buckets.assertiveness, recklessness, 0.25);
  if (conciliatory != null) add(buckets.assertiveness, 100 - conciliatory, 0.3);
  if (consensus != null) add(buckets.assertiveness, 100 - consensus, 0.2);
  add(buckets.escalationPressure, militarism, 0.45);
  add(buckets.escalationPressure, vindictiveness, 0.35);
  add(buckets.escalationPressure, paranoia, 0.25);
  add(buckets.escalationPressure, recklessness, 0.2);
  if (conciliatory != null) add(buckets.escalationPressure, 100 - conciliatory, 0.4);
  add(buckets.compromisePressure, conciliatory, 0.6);
  add(buckets.compromisePressure, pragmatism, 0.35);
  add(buckets.compromisePressure, caution, 0.4);
  add(buckets.compromisePressure, consensus, 0.35);
  if (riskTolerance != null) add(buckets.compromisePressure, 100 - riskTolerance, 0.2);
  add(buckets.deterrenceSensitivity, caution, 0.55);
  add(buckets.deterrenceSensitivity, pragmatism, 0.25);
  if (riskTolerance != null) add(buckets.deterrenceSensitivity, 100 - riskTolerance, 0.45);
  if (recklessness != null) add(buckets.deterrenceSensitivity, 100 - recklessness, 0.35);
  add(buckets.opportunityPerception, opportunism, 0.65);
  add(buckets.opportunityPerception, riskTolerance, 0.15);
  add(buckets.threatPerception, paranoia, 0.35);
  const securityDirection = directionalPressure(pressures, "security");
  const securityMagnitude = pressureMagnitude(pressures, "security");
  const warWeariness = pressureMagnitude(pressures, "war_weariness");
  const economicStress = pressureMagnitude(pressures, "economic_stress");
  const costOfLiving = pressureMagnitude(pressures, "cost_of_living");
  const unemployment = pressureMagnitude(pressures, "unemployment");
  const institutionalTrust = pressureMagnitude(pressures, "institutional_trust");
  const regionalism = pressureMagnitude(pressures, "regionalism");
  const sovereignty = pressureMagnitude(pressures, "sovereignty");
  const nationalIdentityDirection = directionalPressure(pressures, "national_identity");
  const genericStrain = averagePressureStrain(pressures);
  add(buckets.regimeVulnerability, regionalism, 0.35);
  add(buckets.regimeVulnerability, sovereignty, 0.25);
  add(buckets.threatPerception, sovereignty, 0.3);
  add(buckets.assertiveness, nationalIdentityDirection, 0.2);
  add(buckets.escalationPressure, nationalIdentityDirection, 0.25);
  add(buckets.assertiveness, securityDirection, 0.35);
  add(buckets.escalationPressure, securityDirection, 0.55);
  add(buckets.threatPerception, securityMagnitude, 0.55);
  add(buckets.deterrenceSensitivity, securityMagnitude, 0.2);
  if (warWeariness != null) {
    add(buckets.escalationPressure, 100 - warWeariness, 0.6);
    add(buckets.compromisePressure, warWeariness, 0.7);
    add(buckets.deterrenceSensitivity, warWeariness, 0.5);
  }
  const approval = finite(government.approval);
  const stability = finite(government.stability);
  if (approval != null) add(buckets.regimeVulnerability, 100 - clamp3(approval, 0, 100), 0.65);
  if (stability != null) add(buckets.regimeVulnerability, 100 - clamp3(stability, 0, 100), 0.9);
  if (genericStrain != null) add(buckets.regimeVulnerability, genericStrain, 0.45);
  add(buckets.regimeVulnerability, institutionalTrust, 0.65);
  add(buckets.regimeVulnerability, economicStress, 0.3);
  add(buckets.regimeVulnerability, costOfLiving, 0.3);
  add(buckets.regimeVulnerability, unemployment, 0.25);
  const govSupport = governingSupport(actor);
  if (govSupport != null) {
    const supportVulnerability = clamp3(120 - govSupport * 2, 0, 100);
    add(buckets.regimeVulnerability, supportVulnerability, 0.25);
  }
  const explicitThreat = averageNamedPerception(actor.perceptions, ["threat", "threatEstimate", "hostility", "hostilityEstimate"]);
  const explicitOpportunity = averageNamedPerception(actor.perceptions, ["opportunity", "opportunityEstimate", "weakness", "vulnerability"]);
  const lowCohesionOpportunity = averageNamedPerception(actor.perceptions, ["cohesionEstimate", "cohesion"], { invert: true });
  add(buckets.threatPerception, explicitThreat, 0.75);
  add(buckets.opportunityPerception, explicitOpportunity, 0.75);
  add(buckets.opportunityPerception, lowCohesionOpportunity, 0.35);
  const out = {};
  for (const [key, bucket] of Object.entries(buckets)) {
    const value = resolve(bucket);
    if (value != null) out[key] = value;
  }
  if (!Object.keys(out).length) return null;
  const date = clean4(updatedAt || pressures.updatedAt).slice(0, 32);
  if (date) out.updatedAt = date;
  return normalizePoliticalBehavioralDisposition(out);
};
var comparableDisposition = (value) => JSON.stringify(normalizePoliticalBehavioralDisposition(value));
var advancePoliticalDispositionBatch = ({ actorsByPolity = {}, updatedAt = "" } = {}) => {
  const operations = [];
  const dispositionsByPolity = {};
  const source = actorsByPolity && typeof actorsByPolity === "object" && !Array.isArray(actorsByPolity) ? actorsByPolity : {};
  for (const polityKey of Object.keys(source).sort((left, right) => left.localeCompare(right))) {
    const actor = source[polityKey];
    if (!actor || typeof actor !== "object" || Array.isArray(actor)) continue;
    const next = derivePoliticalDispositionForActor(actor, { polityKey, updatedAt });
    const before = normalizePoliticalBehavioralDisposition(actor.behavioralDisposition);
    if (comparableDisposition(before) === comparableDisposition(next)) continue;
    operations.push({
      op: POLITICAL_ACTOR_OPS.SET_BEHAVIORAL_DISPOSITION,
      polityKey,
      state: next
    });
    if (next) dispositionsByPolity[polityKey] = next;
  }
  return {
    schemaVersion: POLITICAL_DISPOSITION_RESULT_VERSION,
    updatedAt: clean4(updatedAt),
    operations,
    dispositionsByPolity,
    changedPolities: operations.length
  };
};

// src/runtime/politicalBackgroundKernel.js
var clean5 = (value) => String(value ?? "").trim();
var cloneValue = (value) => {
  if (value == null || typeof value !== "object") return value;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};
var applyEphemeralResponseOperation = (actorsByPolity, operation) => {
  const actor = actorsByPolity?.[operation?.polityKey];
  if (!actor) return false;
  if (operation.op === POLITICAL_ACTOR_OPS.SET_PARTY_SUPPORT) {
    const party = (actor.parties || []).find((entry) => entry.id === operation.partyId);
    if (!party) return false;
    party.support = { percent: operation.percent };
    return true;
  }
  if (operation.op === POLITICAL_ACTOR_OPS.SET_PARTY_INFLUENCE) {
    const party = (actor.parties || []).find((entry) => entry.id === operation.partyId);
    if (!party) return false;
    party.influence = { ...party.influence || {}, percent: operation.percent };
    return true;
  }
  if (operation.op === POLITICAL_ACTOR_OPS.SET_POWER_BLOC_INFLUENCE) {
    const bloc = (actor.powerBlocs || []).find((entry) => entry.id === operation.blocId);
    if (!bloc) return false;
    bloc.influence = { ...bloc.influence || {}, percent: operation.percent };
    return true;
  }
  return false;
};
var responseOperationKey = (operation) => {
  if (operation.op === POLITICAL_ACTOR_OPS.SET_PARTY_SUPPORT) return `${operation.polityKey}|party-support|${operation.partyId}`;
  if (operation.op === POLITICAL_ACTOR_OPS.SET_PARTY_INFLUENCE) return `${operation.polityKey}|party-influence|${operation.partyId}`;
  return `${operation.polityKey}|bloc|${operation.blocId}`;
};
var advancePoliticalBackgroundKernel = ({
  actorsByPolity = {},
  signalsByPolity = {},
  months = 0,
  updatedAt = "",
  round = 0,
  responseTicks = 0
} = {}) => {
  const actors = normalizePoliticalActors({ byPolity: cloneValue(actorsByPolity) });
  const pressure = advancePoliticalPressureBatch({
    actorsByPolity: actors.byPolity,
    signalsByPolity,
    months,
    updatedAt
  });
  for (const [polityKey, state] of Object.entries(pressure.patchesByPolity || {})) {
    const actor = actors.byPolity[polityKey];
    if (actor) actor.politicalPressures = cloneValue(state);
  }
  const finalResponseOps = /* @__PURE__ */ new Map();
  let responseChangedEntities = 0;
  let responseChangedPolities = 0;
  const ticks = Math.max(0, Math.trunc(Number(responseTicks) || 0));
  for (let tick = 0; tick < ticks; tick += 1) {
    const response = advancePoliticalResponseBatch({
      actorsByPolity: actors.byPolity,
      updatedAt: `${clean5(updatedAt)}|r${Math.max(0, Math.trunc(Number(round) || 0))}|t${tick + 1}`
    });
    if (!response.operations.length) continue;
    responseChangedEntities += response.changedEntities;
    responseChangedPolities += response.changedPolities;
    for (const operation of response.operations) {
      if (!applyEphemeralResponseOperation(actors.byPolity, operation)) continue;
      finalResponseOps.set(responseOperationKey(operation), cloneValue(operation));
    }
  }
  const disposition = advancePoliticalDispositionBatch({
    actorsByPolity: actors.byPolity,
    updatedAt
  });
  return {
    pressurePatchesByPolity: pressure.patchesByPolity || {},
    pressureChangedPolities: Number(pressure.changedPolities) || 0,
    responseOperations: [...finalResponseOps.values()],
    responseChangedEntities,
    responseChangedPolities,
    dispositionOperations: disposition.operations || [],
    dispositionChangedPolities: Number(disposition.changedPolities) || 0
  };
};

// src/runtime/politicalBackgroundWorker.js
self.onmessage = (event) => {
  const id = Number(event?.data?.id);
  try {
    const result = advancePoliticalBackgroundKernel(event?.data?.payload || {});
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error?.message || "Political background worker failed." });
  }
};
/*! Open Historia — owner-name canonicalisation © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*!
 * Open Historia — save-aware polity identity resolver
 * v0.3.0 — lifecycle + map-reference aware
 *
 * ownerNames.js answers "what stock country name does this code mean?"
 * this answers the much more annoying question:
 * "which polity in THIS save does that name actually mean?"
 *
 * a polityOverride key is treated as the stable campaign identity/lineage key.
 * a rename changes its display/current name and aliases, not every key in the
 * save. that lets old/new regime names resolve back to one established actor.
 */
/*! Open Historia — background political pressure ledger (Continuum) */
/*! Open Historia — political actor runtime domain */
/*! Open Historia — canonical Political World v2 trait registry. */
/*! Open Historia — canonical Political Actor mutation operations */
/*! Open Historia — causal background political response engine (Continuum) */
/*! Open Historia — native political behavioral disposition engine (Continuum) */
/*! Open Historia — pure worker kernel for political background simulation (Continuum) */
/*! Open Historia — political background simulation worker (Continuum) */
