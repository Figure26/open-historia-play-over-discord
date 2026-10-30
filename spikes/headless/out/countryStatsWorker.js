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

// src/runtime/ownerNames.js
var toCountryName = (token) => {
  const raw = String(token ?? "").trim();
  if (!raw) return "";
  return countryNames_default[raw] || countryNames_default[raw.toUpperCase()] || raw;
};
var ownerIdentityKey = (value) => String(value ?? "").normalize("NFD").toLowerCase().replace(/[^a-z0-9]+/g, "");
var COUNTRY_NAME_KEYS = new Set(Object.values(countryNames_default).map(ownerIdentityKey));

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
  const add = (normalizedName, normalizedCode) => {
    if (!normalizedName || !normalizedCode) return;
    const list = out.get(normalizedName) || [];
    if (!list.includes(normalizedCode)) list.push(normalizedCode);
    out.set(normalizedName, list);
  };
  for (const [code, name] of Object.entries(countryNames_default)) {
    add(
      normalizeIdentityText(name),
      normalizeString(code).toUpperCase()
    );
  }
  for (const [normalizedName, code] of Object.entries(officialCountryAliases_default)) {
    add(
      normalizeIdentityText(normalizedName),
      normalizeString(code).toUpperCase()
    );
  }
  return out;
})();
var normalizeMapRefs = (value) => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const gadm0 = Array.isArray(source.gadm0) ? source.gadm0 : [];
  return {
    gadm0: [...new Set(
      gadm0.map((entry) => normalizeString(entry).toUpperCase()).filter((entry) => Boolean(countryNames_default[entry]))
    )]
  };
};
var stockCodesForToken = (rawToken, stockName) => {
  const raw = normalizeString(rawToken).toUpperCase();
  const direct = countryNames_default[raw] ? [raw] : [];
  const byName = STOCK_CODES_BY_NAME.get(normalizeIdentityText(stockName)) || [];
  return [.../* @__PURE__ */ new Set([...direct, ...byName])];
};
var isStockPolityName = (value) => STOCK_COUNTRY_NAMES.has(
  normalizeIdentityText(toCountryName(value))
);
var foldPolityCore = (value) => {
  let text2 = normalizeIdentityText(value);
  if (!text2) return "";
  text2 = text2.replace(/^the\s+/, "");
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
    if (text2.startsWith(prefix)) {
      text2 = text2.slice(prefix.length).trim();
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
    if (text2.endsWith(suffix)) {
      text2 = text2.slice(0, -suffix.length).trim();
      break;
    }
  }
  return text2;
};
var polityCore = memoizedFold(foldPolityCore);
var normalizeAliases = (value) => Array.isArray(value) ? value.map((entry) => normalizeString(entry)).filter(Boolean) : [];
var countOwnedRegions = (world) => {
  const counts = /* @__PURE__ */ new Map();
  for (const owner of Object.values(
    world?.regionOwnershipOverrides || {}
  )) {
    const name = normalizeString(owner);
    if (!name) continue;
    counts.set(
      name,
      (counts.get(name) || 0) + 1
    );
  }
  return counts;
};
var buildDeclaredPolities = (world) => {
  const ownershipCounts = countOwnedRegions(world);
  return Object.entries(
    world?.polityOverrides || {}
  ).map(([key, value]) => {
    const canonical = normalizeString(key);
    if (!canonical) return null;
    const names = [
      canonical,
      normalizeString(value?.code),
      normalizeString(value?.name),
      ...normalizeAliases(value?.aliases)
    ].filter(Boolean);
    const lifecycleStatus = normalizeString(value?.status).toLowerCase();
    const ownedRegions = ownershipCounts.get(canonical) || 0;
    return {
      canonical,
      names: [...new Set(names)],
      normalizedNames: [
        ...new Set(
          names.map(normalizeIdentityText).filter(Boolean)
        )
      ],
      cores: [
        ...new Set(
          names.map(polityCore).filter(Boolean)
        )
      ],
      mapRefs: normalizeMapRefs(value?.mapRefs),
      ownedRegions,
      lifecycleStatus,
      active: lifecycleStatus === "active" || ownedRegions > 0
    };
  }).filter(Boolean);
};
var chooseUnique = (candidates) => {
  if (candidates.length === 1) {
    return {
      candidate: candidates[0],
      ambiguous: false
    };
  }
  if (candidates.length === 0) {
    return {
      candidate: null,
      ambiguous: false
    };
  }
  const active = candidates.filter(
    (candidate) => candidate.active
  );
  if (active.length === 1) {
    return {
      candidate: active[0],
      ambiguous: false
    };
  }
  return {
    candidate: null,
    ambiguous: true
  };
};
var buildPolityIdentityIndex = (world) => ({
  declared: buildDeclaredPolities(world),
  ownershipCounts: countOwnedRegions(world)
});
var resolvePolityIdentity = (token, world, {
  allowUnknown = true,
  requireActive = false,
  allowCoreMatch = true,
  allowStockBase = true,
  allowMapRefs = true,
  identityIndex = null
} = {}) => {
  const stockName = toCountryName(normalizeString(token));
  if (!stockName) {
    return {
      input: normalizeString(token),
      normalizedInput: "",
      resolved: "",
      status: "empty",
      candidates: []
    };
  }
  const normalizedInput = normalizeIdentityText(stockName);
  const coreInput = polityCore(stockName);
  const index = identityIndex && Array.isArray(identityIndex?.declared) ? identityIndex : buildPolityIdentityIndex(world);
  const stockCodes = stockCodesForToken(token, stockName);
  const mapRefMatches = allowMapRefs && stockCodes.length ? index.declared.filter((candidate) => candidate.mapRefs.gadm0.some((code) => stockCodes.includes(code)) && (!requireActive || candidate.active)) : [];
  const declaredRelated = index.declared.filter(
    (candidate) => candidate.normalizedNames.includes(normalizedInput) || coreInput && candidate.cores.includes(coreInput) || allowMapRefs && candidate.mapRefs.gadm0.some((code) => stockCodes.includes(code))
  );
  const exact = index.declared.filter(
    (candidate) => candidate.normalizedNames.includes(
      normalizedInput
    ) && (!requireActive || candidate.active)
  );
  {
    const choice = chooseUnique(exact);
    if (choice.candidate) {
      return {
        input: normalizeString(token),
        normalizedInput,
        resolved: choice.candidate.canonical,
        status: "exact-declared",
        candidates: exact.map(
          (candidate) => candidate.canonical
        )
      };
    }
    if (choice.ambiguous) {
      return {
        input: normalizeString(token),
        normalizedInput,
        resolved: "",
        status: "ambiguous-exact",
        candidates: exact.map(
          (candidate) => candidate.canonical
        )
      };
    }
  }
  {
    const choice = chooseUnique(mapRefMatches);
    if (choice.candidate) {
      return {
        input: normalizeString(token),
        normalizedInput,
        resolved: choice.candidate.canonical,
        status: "map-ref",
        candidates: mapRefMatches.map((candidate) => candidate.canonical)
      };
    }
    if (choice.ambiguous) {
      return {
        input: normalizeString(token),
        normalizedInput,
        resolved: "",
        status: "ambiguous-map-ref",
        candidates: mapRefMatches.map((candidate) => candidate.canonical)
      };
    }
  }
  const coreMatches = allowCoreMatch && coreInput ? index.declared.filter(
    (candidate) => candidate.cores.includes(
      coreInput
    ) && (!requireActive || candidate.active)
  ) : [];
  {
    const choice = chooseUnique(coreMatches);
    if (choice.candidate) {
      return {
        input: normalizeString(token),
        normalizedInput,
        resolved: choice.candidate.canonical,
        status: "core-match",
        candidates: coreMatches.map(
          (candidate) => candidate.canonical
        )
      };
    }
    if (choice.ambiguous) {
      return {
        input: normalizeString(token),
        normalizedInput,
        resolved: "",
        status: "ambiguous-core",
        candidates: coreMatches.map(
          (candidate) => candidate.canonical
        )
      };
    }
  }
  if (allowStockBase && isStockPolityName(stockName) && declaredRelated.length === 0) {
    return {
      input: normalizeString(token),
      normalizedInput,
      resolved: stockName,
      status: "stock-base",
      candidates: []
    };
  }
  if (allowUnknown) {
    return {
      input: normalizeString(token),
      normalizedInput,
      resolved: stockName,
      status: "unknown-pass-through",
      candidates: []
    };
  }
  return {
    input: normalizeString(token),
    normalizedInput,
    resolved: "",
    status: "unresolved",
    candidates: declaredRelated.map(
      (candidate) => candidate.canonical
    )
  };
};

// src/runtime/gameDates.js
var DAY_MS = 864e5;
var MAX_ABS_YEAR = 999999;
var text = (value) => String(value ?? "").trim();
var astronomicalYear = (year) => year < 0 ? year + 1 : year;
var isLeap = (astronomical) => astronomical % 4 === 0 && (astronomical % 100 !== 0 || astronomical % 400 === 0);
var gameDateDaysInMonth = (year, month) => {
  const lengths = [31, isLeap(astronomicalYear(year)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1] ?? 0;
};
var utcMillis = ({ year, month, day }) => {
  const date = /* @__PURE__ */ new Date(0);
  date.setUTCFullYear(astronomicalYear(year), month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
};
var parseGameDate = (value) => {
  let raw = text(value);
  if (!raw) return null;
  let bc = false;
  const era = /\s*(BCE|BC|CE|AD)$/i.exec(raw);
  if (era) {
    bc = /^BC/i.test(era[1]);
    raw = raw.slice(0, era.index).trim();
  }
  const datePart = raw.split(/[T ]/, 1)[0];
  const match = /^([+-]?)(\d{1,6})-(\d{1,2})-(\d{1,2})$/.exec(datePart);
  if (!match) return null;
  let year = Number(match[2]);
  const month = Number(match[3]);
  const day = Number(match[4]);
  if (match[1] === "-" || bc) year = -year;
  if (year === 0 || Math.abs(year) > MAX_ABS_YEAR) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > gameDateDaysInMonth(year, month)) return null;
  return { year, month, day };
};
var isGameDate = (value) => parseGameDate(value) !== null;
var gameDateDayNumber = (value) => {
  const parts = parseGameDate(value);
  return parts ? Math.round(utcMillis(parts) / DAY_MS) : null;
};
var compareGameDates = (a, b) => {
  const left = gameDateDayNumber(a);
  const right = gameDateDayNumber(b);
  if (left !== null && right !== null) return left === right ? 0 : left < right ? -1 : 1;
  if (left !== null) return -1;
  if (right !== null) return 1;
  return text(a).localeCompare(text(b));
};

// src/runtime/statsBackend.js
var STATS_BACKEND_FIELD = "backend";
var STATS_BACKEND_KEYS = Object.freeze(["population", "gdp", "budgetBalance", "publicDebt"]);
var number = (value) => {
  if (value === null || value === void 0 || value === "") return NaN;
  const read = Number(value);
  return Number.isFinite(read) ? read : NaN;
};
var within = (value, least, most) => Math.min(most, Math.max(least, value));
var readStatsBackend = (value, { partial = false } = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const population = number(value.population);
  if (!(population >= 1) && !partial) return null;
  const backend = population >= 1 ? { population: Math.round(within(population, 1, 2e10)) } : {};
  const gdp = number(value.gdp);
  if (gdp > 0) backend.gdp = within(gdp, 1, 1e18);
  const balance = number(value.budgetBalance);
  if (!Number.isNaN(balance)) backend.budgetBalance = within(balance, -100, 100);
  const debt = number(value.publicDebt);
  if (!Number.isNaN(debt)) backend.publicDebt = within(debt, 0, 1e3);
  return Object.keys(backend).length > 0 ? backend : null;
};
var statsBackendPatch = (backend, options) => {
  const read = readStatsBackend(backend, options);
  if (!read) return {};
  const economy = {};
  if (read.gdp !== void 0) economy.gdp = read.gdp;
  if (read.budgetBalance !== void 0) economy.budgetBalance = read.budgetBalance;
  if (read.publicDebt !== void 0) economy.publicDebt = read.publicDebt;
  return { ...read.population !== void 0 ? { population: { total: read.population } } : {}, ...Object.keys(economy).length ? { economy } : {} };
};

// src/runtime/warSettings.js
var WAR_MECHANICS = Object.freeze(["fatigue", "weather", "terrain", "walls", "muster", "military", "air", "supply", "attrition"]);
var ERA_LABELS = Object.freeze(["Before 1500", "1500 to 1850", "1850 to 1945", "From 1945"]);
var MUSTER_DAYS_MOST = 3650;
var WARFARE_FORMS = Object.freeze(["front", "swarm"]);
var numberIn = (value, least, most) => {
  if (value === null || value === void 0 || value === "") return null;
  const number2 = Number(value);
  return Number.isFinite(number2) && number2 >= least && number2 <= most ? number2 : null;
};
var normalizeMusterPoints = (value) => {
  if (!Array.isArray(value) || value.length < 2) return null;
  const points = value.slice(0, 2).map((point) => [numberIn(Array.isArray(point) ? point[0] : NaN, 1e-3, 1), numberIn(Array.isArray(point) ? point[1] : NaN, 0.1, MUSTER_DAYS_MOST)]);
  if (points.some(([share, days]) => share === null || days === null)) return null;
  points.sort((a, b) => a[0] - b[0]);
  if (points[1][0] - points[0][0] < 1e-3 || points[1][1] <= points[0][1]) return null;
  return points.map(([share, days]) => [Math.round(share * 1e3) / 1e3, Math.round(days * 10) / 10]);
};

// src/runtime/militaryStats.js
var MILITARY_STAT_FIELDS = Object.freeze(["quality", "technology", "land", "sea", "air", "spending", "weariness", "manpowerShare", "cavalryShare", "siegeShare", "menPerCounter", "muster"]);
var RANGES = Object.freeze({
  quality: [0, 100, 1],
  technology: [0, 100, 1],
  land: [0, 100, 1],
  sea: [0, 100, 1],
  air: [0, 100, 1],
  spending: [0, 100, 1],
  weariness: [0, 100, 1],
  manpowerShare: [0.1, 100, 10],
  cavalryShare: [0, 1, 1e3],
  siegeShare: [0, 1, 1e3],
  menPerCounter: [1, 1e6, 1]
});
var isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
var normalizeMilitaryStats = (value) => {
  if (!isRecord(value)) return null;
  const out = {};
  for (const [key, [least, most, places]] of Object.entries(RANGES)) {
    const raw = value[key];
    if (raw === null || raw === void 0 || raw === "") continue;
    const number2 = Number(raw);
    if (!Number.isFinite(number2)) continue;
    const kept = number2 < least ? least : number2 > most ? most : number2;
    out[key] = Math.round(kept * places) / places;
  }
  const muster = normalizeMusterPoints(value.muster);
  if (muster) out.muster = muster;
  return Object.keys(out).length > 0 ? out : null;
};
var MILITARY_SHIFT_FIELDS = Object.freeze(["quality", "technology", "land", "sea", "air", "spending", "manpowerShare"]);

// src/runtime/statIndexDefinitions.js
var MAX_STAT_INDICES = 12;
var STAT_INDEX_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9]{0,39}$/;
var STAT_KINDS = Object.freeze(["index", "number", "percentage", "currency"]);
var DEFAULT_STAT_INDEX_ROWS = Object.freeze([
  Object.freeze({ key: "sovereignty", label: "Sovereignty", kind: "index", icon: "\u2691", color: "#f97316", description: "Practical political sovereignty and freedom of action." }),
  Object.freeze({ key: "foodAutonomy", label: "Food autonomy", kind: "index", icon: "\u{1F33E}", color: "#22c55e", description: "Ability to meet food needs without vulnerable external supply." }),
  Object.freeze({ key: "energyAutonomy", label: "Energy autonomy", kind: "index", icon: "\u26A1", color: "#eab308", description: "Ability to meet energy needs without vulnerable external supply." }),
  Object.freeze({ key: "economicIndependence", label: "Economic independence", kind: "index", icon: "\u{1F3E6}", color: "#06b6d4", description: "Economic resilience and freedom from external dependency." }),
  Object.freeze({ key: "internalSecurity", label: "Internal security", kind: "index", icon: "\u{1F6E1}", color: "#f43f5e", description: "Domestic security, institutional control, and resistance to internal disruption." }),
  Object.freeze({ key: "internationalReputation", label: "International reputation", kind: "index", icon: "\u{1F91D}", color: "#3b82f6", description: "International trust, legitimacy, and standing." })
]);
var DEFAULT_STAT_INDEX_KEYS = Object.freeze(DEFAULT_STAT_INDEX_ROWS.map((row) => row.key));
var DEFAULT_CUSTOM_STAT_SECTIONS = Object.freeze([
  Object.freeze({
    key: "national",
    label: "National",
    icon: "\u25C8",
    stats: Object.freeze([
      Object.freeze({ key: "nationalStability", label: "National stability", kind: "index", icon: "\u2696", color: "#22c55e", description: "Overall political and social stability." }),
      Object.freeze({ key: "intelligenceService", label: "Intelligence service", kind: "index", icon: "\u265F", color: "#38bdf8", description: "Capability of the polity's intelligence and counter-intelligence apparatus." })
    ])
  }),
  Object.freeze({ key: "strategic", label: "Strategic indices", icon: "\u2691", stats: DEFAULT_STAT_INDEX_ROWS }),
  Object.freeze({
    key: "population",
    label: "Population",
    icon: "\u265F",
    stats: Object.freeze([
      Object.freeze({ key: "totalPopulation", label: "Total population", kind: "number", icon: "\u265F", color: "#94a3b8", unit: "people", compact: true, decimals: 0, minimum: 0, description: "Population represented by this polity in the scenario's own accounting terms." })
    ])
  }),
  Object.freeze({
    key: "economy",
    label: "Economy",
    icon: "\u{1F4C8}",
    stats: Object.freeze([
      Object.freeze({ key: "gdp", label: "GDP", kind: "currency", icon: "\u{1F4B6}", color: "#34d399", prefix: "\u20AC", compact: true, decimals: 1, minimum: 0, description: "Scenario-appropriate total economic output. Change the label/unit for eras where GDP is not meaningful." }),
      Object.freeze({ key: "gdpPerCapita", label: "GDP/capita", kind: "currency", icon: "\u25EB", color: "#e5e7eb", prefix: "\u20AC", compact: true, decimals: 0, minimum: 0, description: "Scenario-appropriate output or income per person. Delete or repurpose when not meaningful." }),
      Object.freeze({ key: "inflation", label: "Inflation", kind: "percentage", icon: "\u2197", color: "#34d399", suffix: "%", decimals: 1, minimum: 0, maximum: 1e3, description: "Price inflation in percent." }),
      Object.freeze({ key: "unemployment", label: "Unemployment", kind: "percentage", icon: "\u265F", color: "#34d399", suffix: "%", decimals: 1, minimum: 0, maximum: 100, description: "Unemployment in percent." }),
      Object.freeze({ key: "publicDebt", label: "Public debt", kind: "percentage", icon: "\u25A5", color: "#34d399", suffix: "%", decimals: 1, minimum: 0, maximum: 1e3, description: "Public debt in the scenario's chosen percentage basis." }),
      Object.freeze({ key: "budgetBalance", label: "Budget balance", kind: "percentage", icon: "\xB1", color: "#34d399", suffix: "%", decimals: 1, minimum: -1e3, maximum: 1e3, description: "Budget balance in percent; negative values represent deficits." }),
      Object.freeze({ key: "agricultureShare", label: "Agriculture", kind: "percentage", icon: "\u{1F33E}", color: "#22c55e", suffix: "%", decimals: 0, minimum: 0, maximum: 100, description: "Agriculture share of output." }),
      Object.freeze({ key: "industryShare", label: "Industry", kind: "percentage", icon: "\u{1F3ED}", color: "#3b82f6", suffix: "%", decimals: 0, minimum: 0, maximum: 100, description: "Industry share of output." }),
      Object.freeze({ key: "servicesShare", label: "Services", kind: "percentage", icon: "\u25C6", color: "#f59e0b", suffix: "%", decimals: 0, minimum: 0, maximum: 100, description: "Services share of output." })
    ])
  })
]);

// src/runtime/countryStats.js
var COUNTRY_STATS_SCHEMA_VERSION = 1;
var COUNTRY_STATS_POPULATION_CALIBRATION_VERSION = 2;
var COUNTRY_STATS_HISTORY_VERSION = 1;
var COUNTRY_STATS_HISTORY_MAX_SAMPLES = 1200;
var COUNTRY_STATS_TRACKING_INTERVALS = Object.freeze([0, 3, 6, 12, 24]);
var COUNTRY_STATS_COMPONENT_GROUPS = Object.freeze([
  "core",
  "integrated",
  "overseas/dependent"
]);
var COUNTRY_STATS_TERRITORIAL_SCOPES = Object.freeze([
  "mapped",
  "nonterritorial"
]);
var COMPONENT_GROUP_SET = new Set(COUNTRY_STATS_COMPONENT_GROUPS);
var TERRITORIAL_SCOPE_SET = new Set(COUNTRY_STATS_TERRITORIAL_SCOPES);
var INDEX_KEYS = DEFAULT_STAT_INDEX_KEYS;
var ECONOMY_NUMERIC_KEYS = Object.freeze([
  "gdp",
  "gdpPerCapita",
  "coreGdpPerCapita",
  "otherGdpPerCapita",
  "gdpGrowth",
  "inflation",
  "unemployment",
  "publicDebt",
  "budgetBalance"
]);
var clean = (value) => String(value ?? "").trim();
var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
var finite = (value) => Number.isFinite(Number(value));
var MAX_CUSTOM_STATS_VALUES = 60;
var normalizeCustomCountryStats = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const out = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = clean(rawKey);
    if (!/^[A-Za-z][A-Za-z0-9]{0,39}$/.test(key)) continue;
    const number2 = parseStatNumber(rawValue);
    if (!Number.isFinite(number2)) continue;
    out[key] = Math.max(-1e18, Math.min(1e18, number2));
    if (Object.keys(out).length >= MAX_CUSTOM_STATS_VALUES) break;
  }
  return Object.keys(out).length ? out : void 0;
};
var STAT_SCALES = Object.freeze({
  trillion: 1e12,
  tn: 1e12,
  t: 1e12,
  billion: 1e9,
  bn: 1e9,
  b: 1e9,
  million: 1e6,
  mn: 1e6,
  m: 1e6,
  thousand: 1e3,
  k: 1e3
});
var STAT_SCALE_AFTER_NUMBER = /^\s*(trillion|tn|t|billion|bn|b|million|mn|m|thousand|k)(?![a-z])/;
var parseStatNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text2 = value.trim();
  if (!text2) return null;
  const normalized = text2.replace(/\u00a0/g, " ").replace(/,/g, "").replace(/−/g, "-").toLowerCase();
  const match = normalized.match(/[-+]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const scale = normalized.slice(match.index + match[0].length).match(STAT_SCALE_AFTER_NUMBER);
  const number2 = Number(match[0]) * (scale ? STAT_SCALES[scale[1]] : 1);
  return Number.isFinite(number2) ? number2 : null;
};
var normalizePercent = (value) => {
  const parsed = parseStatNumber(value);
  return parsed == null ? null : clamp(parsed, 0, 100);
};
var normalizeSignedPercent = (value) => {
  const parsed = parseStatNumber(value);
  return parsed == null ? null : clamp(parsed, -1e3, 1e3);
};
var componentKey = (value) => clean(value).toLocaleLowerCase();
var normalizeTerritorialComponents = (value) => {
  if (!Array.isArray(value)) return [];
  const byKey = /* @__PURE__ */ new Map();
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const geography = clean(item.geography);
    const group = clean(item.group).toLowerCase();
    const population = parseStatNumber(item.population);
    const gdpPerCapita = parseStatNumber(item.gdpPerCapita);
    if (!geography || !COMPONENT_GROUP_SET.has(group)) continue;
    if (!Number.isFinite(population) || population < 0) continue;
    if (!Number.isFinite(gdpPerCapita) || gdpPerCapita <= 0) continue;
    const normalized = {
      geography,
      group,
      population: Math.round(population),
      gdpPerCapita: Math.round(gdpPerCapita * 100) / 100
    };
    byKey.set(componentKey(geography), normalized);
  }
  return [...byKey.values()];
};
var aggregateTerritorialEconomy = (componentsInput) => {
  const components = normalizeTerritorialComponents(componentsInput);
  if (!components.length) return null;
  let population = 0;
  let gdp = 0;
  let corePopulation = 0;
  let otherPopulation = 0;
  let coreGdp = 0;
  let otherGdp = 0;
  for (const component of components) {
    const componentGdp = component.population * component.gdpPerCapita;
    population += component.population;
    gdp += componentGdp;
    if (component.group === "overseas/dependent") {
      otherPopulation += component.population;
      otherGdp += componentGdp;
    } else {
      corePopulation += component.population;
      coreGdp += componentGdp;
    }
  }
  if (!(population > 0) || !(gdp > 0)) return null;
  return {
    population: Math.round(population),
    gdp,
    gdpPerCapita: gdp / population,
    corePopulation: Math.round(corePopulation),
    otherPopulation: Math.round(otherPopulation),
    coreGdp,
    otherGdp,
    coreGdpPerCapita: corePopulation > 0 ? coreGdp / corePopulation : null,
    otherGdpPerCapita: otherPopulation > 0 ? otherGdp / otherPopulation : null
  };
};
var normalizeCountryStatIndices = (value, { allowedKeys = INDEX_KEYS } = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const allowed = Array.isArray(allowedKeys) ? new Set(allowedKeys.map((key) => clean(key)).filter((key) => STAT_INDEX_KEY_PATTERN.test(key))) : null;
  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    if (Object.keys(out).length >= MAX_STAT_INDICES) break;
    if (!STAT_INDEX_KEY_PATTERN.test(key) || allowed && !allowed.has(key)) continue;
    const normalized = normalizePercent(raw);
    if (normalized != null) out[key] = Math.round(normalized);
  }
  return Object.keys(out).length ? out : void 0;
};
var normalizeIndexKeys = (value) => {
  if (!Array.isArray(value)) return void 0;
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const raw of value) {
    const key = clean(raw);
    const token = key.toLowerCase();
    if (!STAT_INDEX_KEY_PATTERN.test(key) || seen.has(token)) continue;
    seen.add(token);
    out.push(key);
    if (out.length >= MAX_STAT_INDICES) break;
  }
  return out.length ? out : void 0;
};
var normalizeBreakdown = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const raw = ["agriculture", "industry", "services"].map((key) => normalizePercent(value[key]));
  if (raw.some((number2) => number2 == null)) return void 0;
  const total = raw.reduce((sum, number2) => sum + number2, 0);
  if (!(total > 0)) return void 0;
  const scaled = raw.map((number2) => number2 / total * 100);
  const floors = scaled.map((number2) => Math.floor(number2));
  let remainder = 100 - floors.reduce((sum, number2) => sum + number2, 0);
  const order = scaled.map((number2, index) => ({ index, fraction: number2 - floors[index] })).sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let i = 0; i < order.length && remainder > 0; i += 1, remainder -= 1) {
    floors[order[i].index] += 1;
  }
  return {
    agriculture: floors[0],
    industry: floors[1],
    services: floors[2]
  };
};
var normalizeEconomy = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const out = {};
  for (const key of ECONOMY_NUMERIC_KEYS) {
    let normalized = null;
    if (["gdpGrowth", "budgetBalance", "inflation"].includes(key)) normalized = normalizeSignedPercent(value[key]);
    else if (key === "unemployment") normalized = normalizePercent(value[key]);
    else if (key === "publicDebt") {
      const parsed = parseStatNumber(value[key]);
      normalized = parsed == null ? null : clamp(parsed, 0, 1e3);
    } else normalized = parseStatNumber(value[key]);
    if (normalized != null && Number.isFinite(normalized)) out[key] = normalized;
  }
  const currency = clean(value.currency);
  if (currency) out.currency = currency;
  return Object.keys(out).length ? out : void 0;
};
var normalizePopulation = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const out = {};
  for (const key of ["total", "coreIntegrated", "otherTerritories"]) {
    const number2 = parseStatNumber(value[key]);
    if (Number.isFinite(number2) && number2 >= 0) out[key] = Math.round(number2);
  }
  return Object.keys(out).length ? out : void 0;
};
var MAX_ACCOUNTED_ECONOMIC_EVENTS = 64;
var MAX_SEMANTIC_SPLIT_COMPONENTS = 64;
var normalizeCountryStatContinuity = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const out = {};
  const assessedDate = clean(value.assessedDate);
  const stateFingerprint = clean(value.stateFingerprint);
  const territorialFingerprint = clean(value.territorialFingerprint);
  const assessedRound = Number(value.assessedRound);
  const populationCalibrationVersion = Number(value.populationCalibrationVersion);
  if (assessedDate) out.assessedDate = assessedDate;
  if (Number.isFinite(assessedRound) && assessedRound >= 0) {
    out.assessedRound = Math.trunc(assessedRound);
  }
  if (stateFingerprint) out.stateFingerprint = stateFingerprint;
  if (territorialFingerprint) out.territorialFingerprint = territorialFingerprint;
  if (Number.isInteger(populationCalibrationVersion) && populationCalibrationVersion > 0) {
    out.populationCalibrationVersion = populationCalibrationVersion;
  }
  const accountedEventIds = [...new Set(
    (Array.isArray(value.accountedEventIds) ? value.accountedEventIds : []).map(clean).filter(Boolean)
  )].slice(-MAX_ACCOUNTED_ECONOMIC_EVENTS);
  if (accountedEventIds.length) out.accountedEventIds = accountedEventIds;
  if (Array.isArray(value.semanticSplitComponents)) {
    const byGeography = /* @__PURE__ */ new Map();
    for (const entry of value.semanticSplitComponents) {
      const geography = clean(entry?.geography);
      const regions = Number(entry?.regions);
      if (!geography || !Number.isInteger(regions) || regions < 0) continue;
      if (!byGeography.has(componentKey(geography))) byGeography.set(componentKey(geography), { geography, regions });
    }
    out.semanticSplitComponents = [...byGeography.values()].slice(0, MAX_SEMANTIC_SPLIT_COMPONENTS);
  }
  return Object.keys(out).length ? out : void 0;
};
var mergeCountryStatContinuity = (...values) => {
  let out = {};
  let eventIds = [];
  for (const value of values) {
    const normalized = normalizeCountryStatContinuity(value);
    if (!normalized) continue;
    eventIds = [...eventIds, ...normalized.accountedEventIds || []];
    out = { ...out, ...normalized };
  }
  eventIds = [...new Set(eventIds.map(clean).filter(Boolean))].slice(-MAX_ACCOUNTED_ECONOMIC_EVENTS);
  if (eventIds.length) out.accountedEventIds = eventIds;
  else delete out.accountedEventIds;
  return Object.keys(out).length ? out : void 0;
};
var copyTextField = (source, target, key) => {
  const text2 = clean(source?.[key]);
  if (text2) target[key] = text2;
};
var normalizeCountryStatSheet = (value, { indexKeys: expectedIndexKeys } = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const key of ["capital", "continent", "government", "leader"]) {
    copyTextField(value, out, key);
  }
  const stability = normalizePercent(value.stability);
  if (stability != null) out.stability = Math.round(stability);
  const customStats = normalizeCustomCountryStats(value.customStats);
  if (customStats) out.customStats = customStats;
  const indexKeys = normalizeIndexKeys(value.indexKeys);
  const indices = normalizeCountryStatIndices(value.indices, { allowedKeys: normalizeIndexKeys(expectedIndexKeys) || indexKeys || INDEX_KEYS });
  if (indices) out.indices = indices;
  if (indexKeys) out.indexKeys = indexKeys;
  const economy = normalizeEconomy(value.economy);
  if (economy) out.economy = economy;
  const population = normalizePopulation(value.population);
  if (population) out.population = population;
  const breakdown = normalizeBreakdown(value.gdpBreakdown);
  if (breakdown) out.gdpBreakdown = breakdown;
  const territorialScope = clean(value.territorialScope).toLowerCase();
  if (TERRITORIAL_SCOPE_SET.has(territorialScope)) out.territorialScope = territorialScope;
  const hasExplicitComponents = Array.isArray(value.territorialComponents);
  const components = normalizeTerritorialComponents(value.territorialComponents);
  if (components.length || hasExplicitComponents) out.territorialComponents = components;
  const continuity = normalizeCountryStatContinuity(value.continuity);
  if (continuity) out.continuity = continuity;
  const military = normalizeMilitaryStats(value.military);
  if (military) out.military = military;
  const declaredVersion = Number(value.statsSchemaVersion);
  out.statsSchemaVersion = Number.isInteger(declaredVersion) && declaredVersion > 0 ? declaredVersion : components.length || territorialScope === "nonterritorial" ? COUNTRY_STATS_SCHEMA_VERSION : 0;
  if (components.length) return finalizeCountryStatSheet(out);
  return out;
};
var finalizeCountryStatSheet = (value, { indexKeys: expectedIndexKeys } = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const out = {};
  for (const key of ["capital", "continent", "government", "leader"]) copyTextField(value, out, key);
  const stability = normalizePercent(value.stability);
  if (stability != null) out.stability = Math.round(stability);
  const customStats = normalizeCustomCountryStats(value.customStats);
  if (customStats) out.customStats = customStats;
  const indexKeys = normalizeIndexKeys(value.indexKeys);
  const indices = normalizeCountryStatIndices(value.indices, { allowedKeys: normalizeIndexKeys(expectedIndexKeys) || indexKeys || INDEX_KEYS });
  if (indices) out.indices = indices;
  if (indexKeys) out.indexKeys = indexKeys;
  const breakdown = normalizeBreakdown(value.gdpBreakdown);
  if (breakdown) out.gdpBreakdown = breakdown;
  const territorialScope = clean(value.territorialScope).toLowerCase();
  if (TERRITORIAL_SCOPE_SET.has(territorialScope)) out.territorialScope = territorialScope;
  const economy = normalizeEconomy(value.economy) || {};
  const hasExplicitComponents = Array.isArray(value.territorialComponents);
  const components = normalizeTerritorialComponents(value.territorialComponents);
  const aggregate = aggregateTerritorialEconomy(components);
  const continuity = normalizeCountryStatContinuity(value.continuity);
  if (components.length || hasExplicitComponents) out.territorialComponents = components;
  if (continuity) out.continuity = continuity;
  const military = normalizeMilitaryStats(value.military);
  if (military) out.military = military;
  if (aggregate) {
    out.population = {
      total: aggregate.population,
      coreIntegrated: aggregate.corePopulation,
      otherTerritories: aggregate.otherPopulation
    };
    out.economy = {
      ...economy,
      gdp: Math.round(aggregate.gdp),
      gdpPerCapita: Math.round(aggregate.gdpPerCapita * 100) / 100,
      ...aggregate.coreGdpPerCapita == null ? {} : { coreGdpPerCapita: Math.round(aggregate.coreGdpPerCapita * 100) / 100 },
      ...aggregate.otherGdpPerCapita == null ? {} : { otherGdpPerCapita: Math.round(aggregate.otherGdpPerCapita * 100) / 100 }
    };
    out.statsSchemaVersion = COUNTRY_STATS_SCHEMA_VERSION;
  } else {
    const population = normalizePopulation(value.population);
    if (population) out.population = population;
    if (Object.keys(economy).length) out.economy = economy;
    const declaredVersion = Number(value.statsSchemaVersion);
    out.statsSchemaVersion = Number.isInteger(declaredVersion) && declaredVersion > 0 ? declaredVersion : territorialScope === "nonterritorial" ? COUNTRY_STATS_SCHEMA_VERSION : 0;
  }
  return out;
};
var scaleComponentPopulation = (components, predicate, targetPopulation) => {
  const current = components.filter(predicate).reduce((sum, component) => sum + component.population, 0);
  if (!(current > 0) || !(targetPopulation >= 0)) return components;
  const ratio = targetPopulation / current;
  return components.map((component) => predicate(component) ? { ...component, population: Math.max(0, Math.round(component.population * ratio)) } : component);
};
var scaleComponentProductivity = (components, predicate, ratio) => {
  if (!Number.isFinite(ratio) || !(ratio > 0)) return components;
  return components.map((component) => predicate(component) ? { ...component, gdpPerCapita: Math.max(1, Math.round(component.gdpPerCapita * ratio * 100) / 100) } : component);
};
var mergeComponentsByGeography = (base, patch) => {
  const out = new Map(normalizeTerritorialComponents(base).map((component) => [componentKey(component.geography), component]));
  for (const component of normalizeTerritorialComponents(patch)) {
    out.set(componentKey(component.geography), component);
  }
  return [...out.values()];
};
var mergeCountryStatPatch = (baseValue, patchValue, { replaceComponents = false, continuity = null, maxAggregateRescale = 0 } = {}) => {
  const base = normalizeCountryStatSheet(baseValue) || {};
  const written = patchValue && typeof patchValue === "object" && !Array.isArray(patchValue) ? patchValue : {};
  const backend = written[STATS_BACKEND_FIELD] ? statsBackendPatch(written[STATS_BACKEND_FIELD], { partial: true }) : {};
  const patch = Object.keys(backend).length === 0 ? written : {
    ...written,
    ...backend.population ? { population: { ...backend.population, ...written.population && typeof written.population === "object" ? written.population : {} } } : {},
    ...backend.economy ? { economy: { ...backend.economy, ...written.economy && typeof written.economy === "object" ? written.economy : {} } } : {}
  };
  const merged = {
    ...base,
    ...Object.fromEntries(
      ["capital", "continent", "government", "leader"].map((key) => [key, clean(patch[key])]).filter(([, value]) => value)
    )
  };
  const mergedContinuity = mergeCountryStatContinuity(
    base.continuity,
    patch.continuity,
    continuity
  );
  if (mergedContinuity) merged.continuity = mergedContinuity;
  const stability = normalizePercent(patch.stability);
  if (stability != null) merged.stability = Math.round(stability);
  const customStatsPatch = normalizeCustomCountryStats(patch.customStats);
  if (customStatsPatch) {
    merged.customStats = {
      ...base.customStats || {},
      ...customStatsPatch
    };
  }
  const militaryPatch = normalizeMilitaryStats(patch.military);
  if (militaryPatch) merged.military = { ...base.military || {}, ...militaryPatch };
  const patchIndexKeys = normalizeIndexKeys(patch.indexKeys);
  const expectedIndexKeys = patchIndexKeys || normalizeIndexKeys(base.indexKeys) || INDEX_KEYS;
  if (patch.indices && typeof patch.indices === "object" && !Array.isArray(patch.indices)) {
    merged.indices = {
      ...base.indices || {},
      ...normalizeCountryStatIndices(patch.indices, { allowedKeys: expectedIndexKeys }) || {}
    };
  }
  if (patchIndexKeys) merged.indexKeys = patchIndexKeys;
  if (patch.gdpBreakdown && typeof patch.gdpBreakdown === "object" && !Array.isArray(patch.gdpBreakdown)) {
    merged.gdpBreakdown = normalizeBreakdown({
      ...base.gdpBreakdown || {},
      ...patch.gdpBreakdown
    }) || base.gdpBreakdown;
  }
  const economyPatch = normalizeEconomy(patch.economy) || {};
  merged.economy = {
    ...base.economy || {},
    ...economyPatch
  };
  const patchTerritorialScope = clean(patch.territorialScope).toLowerCase();
  if (TERRITORIAL_SCOPE_SET.has(patchTerritorialScope)) {
    merged.territorialScope = patchTerritorialScope;
  }
  const baseHasExplicitComponents = Array.isArray(base.territorialComponents);
  const patchHasExplicitComponents = Array.isArray(patch.territorialComponents);
  let preserveExplicitComponentLedger = baseHasExplicitComponents;
  let components = normalizeTerritorialComponents(base.territorialComponents);
  if (patchHasExplicitComponents) {
    components = replaceComponents ? normalizeTerritorialComponents(patch.territorialComponents) : mergeComponentsByGeography(components, patch.territorialComponents);
    if (replaceComponents) preserveExplicitComponentLedger = true;
  }
  const populationPatch = normalizePopulation(patch.population);
  if (components.length && populationPatch) {
    const corePredicate = (component) => component.group !== "overseas/dependent";
    const otherPredicate = (component) => component.group === "overseas/dependent";
    if (finite(populationPatch.coreIntegrated)) {
      components = scaleComponentPopulation(components, corePredicate, populationPatch.coreIntegrated);
    }
    if (finite(populationPatch.otherTerritories)) {
      components = scaleComponentPopulation(components, otherPredicate, populationPatch.otherTerritories);
    }
    if (finite(populationPatch.total) && !finite(populationPatch.coreIntegrated) && !finite(populationPatch.otherTerritories)) {
      components = scaleComponentPopulation(components, () => true, populationPatch.total);
    }
  } else if (populationPatch) {
    merged.population = {
      ...base.population || {},
      ...populationPatch
    };
  }
  if (components.length && patch.economy && typeof patch.economy === "object" && !Array.isArray(patch.economy)) {
    const before = aggregateTerritorialEconomy(components);
    const plausible = (requested, current) => {
      if (!Number.isFinite(requested) || !(requested > 0)) return null;
      const limit = Number(maxAggregateRescale);
      if (!(limit > 1) || !(Number(current) > 0)) return requested;
      const ratio = requested / Number(current);
      return ratio > limit || ratio < 1 / limit ? null : requested;
    };
    const requestedGdp = plausible(parseStatNumber(patch.economy.gdp), before?.gdp);
    const requestedWholePc = plausible(parseStatNumber(patch.economy.gdpPerCapita), before?.gdpPerCapita);
    const requestedCorePc = plausible(parseStatNumber(patch.economy.coreGdpPerCapita), before?.coreGdpPerCapita);
    const requestedOtherPc = plausible(parseStatNumber(patch.economy.otherGdpPerCapita), before?.otherGdpPerCapita);
    if (before && Number.isFinite(requestedGdp) && requestedGdp > 0) {
      components = scaleComponentProductivity(components, () => true, requestedGdp / before.gdp);
    } else if (before && Number.isFinite(requestedWholePc) && requestedWholePc > 0) {
      components = scaleComponentProductivity(components, () => true, requestedWholePc / before.gdpPerCapita);
    } else {
      if (before && Number.isFinite(requestedCorePc) && requestedCorePc > 0 && before.coreGdpPerCapita > 0) {
        components = scaleComponentProductivity(
          components,
          (component) => component.group !== "overseas/dependent",
          requestedCorePc / before.coreGdpPerCapita
        );
      }
      const afterCore = aggregateTerritorialEconomy(components);
      if (afterCore && Number.isFinite(requestedOtherPc) && requestedOtherPc > 0 && afterCore.otherGdpPerCapita > 0) {
        components = scaleComponentProductivity(
          components,
          (component) => component.group === "overseas/dependent",
          requestedOtherPc / afterCore.otherGdpPerCapita
        );
      }
    }
  }
  if (components.length || preserveExplicitComponentLedger) {
    merged.territorialComponents = components;
  }
  return finalizeCountryStatSheet(merged);
};
var HISTORY_INDEX_KEYS = Object.freeze([
  "sovereignty",
  "foodAutonomy",
  "energyAutonomy",
  "economicIndependence",
  "internalSecurity",
  "internationalReputation"
]);
var HISTORY_ECONOMY_KEYS = Object.freeze([
  "gdp",
  "gdpPerCapita",
  "gdpGrowth",
  "inflation",
  "unemployment",
  "publicDebt",
  "budgetBalance"
]);
var HISTORY_BREAKDOWN_KEYS = Object.freeze([
  "agriculture",
  "industry",
  "services"
]);
var normalizeHistoryDate = (value) => {
  const text2 = clean(value);
  return isGameDate(text2) ? text2 : "";
};
var historyNumber = (value) => {
  const number2 = parseStatNumber(value);
  return Number.isFinite(number2) ? number2 : null;
};
var normalizeCountryStatHistorySample = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const date = normalizeHistoryDate(value.date);
  if (!date) return null;
  const out = {
    date,
    historyVersion: COUNTRY_STATS_HISTORY_VERSION
  };
  const round = Number(value.round);
  if (Number.isFinite(round) && round >= 0) out.round = Math.trunc(round);
  const copyNumber = (key, source = value) => {
    const number2 = historyNumber(source?.[key]);
    if (number2 != null) out[key] = number2;
  };
  copyNumber("stability");
  for (const key of HISTORY_INDEX_KEYS) copyNumber(key);
  const indices = normalizeCountryStatIndices(value.indices, { allowedKeys: null });
  if (indices) out.indices = indices;
  copyNumber("population");
  copyNumber("corePopulation");
  copyNumber("otherPopulation");
  for (const key of HISTORY_ECONOMY_KEYS) copyNumber(key);
  for (const key of HISTORY_BREAKDOWN_KEYS) copyNumber(key);
  const customStats = normalizeCustomCountryStats(value.customStats);
  if (customStats) out.customStats = customStats;
  return Object.keys(out).length > 3 ? out : null;
};
var buildCountryStatHistorySample = (sheetInput, { date = "", round = 0 } = {}) => {
  const sheet = finalizeCountryStatSheet(sheetInput);
  if (!sheet || typeof sheet !== "object" || Array.isArray(sheet)) return null;
  const sampleDate = normalizeHistoryDate(date || sheet?.continuity?.assessedDate);
  if (!sampleDate) return null;
  return normalizeCountryStatHistorySample({
    date: sampleDate,
    round,
    stability: sheet.stability,
    indices: sheet.indices,
    sovereignty: sheet.indices?.sovereignty,
    foodAutonomy: sheet.indices?.foodAutonomy,
    energyAutonomy: sheet.indices?.energyAutonomy,
    economicIndependence: sheet.indices?.economicIndependence,
    internalSecurity: sheet.indices?.internalSecurity,
    internationalReputation: sheet.indices?.internationalReputation,
    population: sheet.population?.total,
    corePopulation: sheet.population?.coreIntegrated,
    otherPopulation: sheet.population?.otherTerritories,
    gdp: sheet.economy?.gdp,
    gdpPerCapita: sheet.economy?.gdpPerCapita,
    gdpGrowth: sheet.economy?.gdpGrowth,
    inflation: sheet.economy?.inflation,
    unemployment: sheet.economy?.unemployment,
    publicDebt: sheet.economy?.publicDebt,
    budgetBalance: sheet.economy?.budgetBalance,
    agriculture: sheet.gdpBreakdown?.agriculture,
    industry: sheet.gdpBreakdown?.industry,
    services: sheet.gdpBreakdown?.services,
    customStats: sheet.customStats
  });
};
var compareHistorySamples = (a, b) => compareGameDates(a.date, b.date) || Number(a.round || 0) - Number(b.round || 0);
var normalizeHistorySeries = (value) => {
  if (!Array.isArray(value)) return [];
  const byDate = /* @__PURE__ */ new Map();
  for (const item of value) {
    const sample = normalizeCountryStatHistorySample(item);
    if (sample) byDate.set(sample.date, sample);
  }
  return [...byDate.values()].sort(compareHistorySamples).slice(-COUNTRY_STATS_HISTORY_MAX_SAMPLES);
};
var historySampleValues = (sample) => {
  const { date: _date, round: _round, historyVersion: _version, ...values } = sample;
  return JSON.stringify(values);
};
var appendHistorySample = (series, sample) => {
  const sameDate = series.findIndex((entry) => entry.date === sample.date);
  if (sameDate >= 0) {
    const next2 = [...series];
    next2[sameDate] = sample;
    return next2;
  }
  const previous = series.filter((entry) => compareGameDates(entry.date, sample.date) < 0).at(-1);
  if (previous && historySampleValues(previous) === historySampleValues(sample)) return series;
  const last = series.at(-1);
  const next = !last || compareHistorySamples(last, sample) < 0 ? [...series, sample] : [...series, sample].sort(compareHistorySamples);
  return next.slice(-COUNTRY_STATS_HISTORY_MAX_SAMPLES);
};
var buildHistorySample = (sheetOrSample, options) => normalizeCountryStatHistorySample(sheetOrSample) || buildCountryStatHistorySample(sheetOrSample, options);
var normalizeCountryStatsHistory = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  for (const [polity, samples] of Object.entries(value)) {
    const key = clean(polity);
    if (!key) continue;
    const normalized = normalizeHistorySeries(samples);
    if (normalized.length) out[key] = normalized;
  }
  return out;
};
var appendCountryStatHistorySample = (historyInput, polity, sheetOrSample, { date = "", round = 0 } = {}) => {
  const key = clean(polity);
  if (!key) return normalizeCountryStatsHistory(historyInput);
  const history = normalizeCountryStatsHistory(historyInput);
  const sample = buildHistorySample(sheetOrSample, { date, round });
  if (!sample) return history;
  history[key] = appendHistorySample(history[key] || [], sample);
  return history;
};
var isCompleteCountryStatSheet = (value) => {
  const sheet = finalizeCountryStatSheet(value);
  if (!sheet || sheet.statsSchemaVersion !== COUNTRY_STATS_SCHEMA_VERSION) return false;
  if (!["capital", "continent", "government", "leader"].every((key) => clean(sheet[key]))) return false;
  if (!Number.isFinite(Number(sheet.stability))) return false;
  const expectedIndexKeys = normalizeIndexKeys(sheet.indexKeys) || INDEX_KEYS;
  if (!expectedIndexKeys.length || !expectedIndexKeys.every((key) => Number.isFinite(Number(sheet.indices?.[key])))) return false;
  if (!Array.isArray(sheet.territorialComponents)) return false;
  const nonterritorial = sheet.territorialScope === "nonterritorial";
  if (!nonterritorial && sheet.territorialComponents.length < 1) return false;
  if (!nonterritorial && !(Number(sheet.population?.total) > 0)) return false;
  if (!nonterritorial && (!(Number(sheet.economy?.gdp) > 0) || !(Number(sheet.economy?.gdpPerCapita) > 0))) return false;
  if (!["gdpGrowth", "inflation", "unemployment", "publicDebt", "budgetBalance"].every(
    (key) => Number.isFinite(Number(sheet.economy?.[key]))
  )) return false;
  if (!clean(sheet.economy?.currency)) return false;
  const breakdown = sheet.gdpBreakdown;
  if (!breakdown || breakdown.agriculture + breakdown.industry + breakdown.services !== 100) return false;
  return true;
};

// src/Game/AI/regionVocab.js
var norm = (value) => String(value ?? "").trim();
var regionOwnerName = (region, overrides) => {
  const override = norm(overrides?.[region?.id]);
  if (override) return toCountryName(override);
  return norm(region?.country) || toCountryName(norm(region?.countryCode));
};

// src/Game/AI/countryStatsWorkerKernel.js
var normalizeString2 = (value) => String(value ?? "").trim();
var normalizeArray = (value) => Array.isArray(value) ? value : [];
var canonicalStatsPolity = (token, world) => {
  const text2 = normalizeString2(token);
  if (!text2) return "";
  const resolved = resolvePolityIdentity(text2, world, {
    allowUnknown: true,
    requireActive: false,
    allowCoreMatch: true,
    allowStockBase: true
  });
  return normalizeString2(resolved?.resolved) || toCountryName(text2) || text2;
};
var stableStatsHash = (value) => {
  let hash = 2166136261;
  const text2 = String(value ?? "");
  for (let index = 0; index < text2.length; index += 1) {
    hash ^= text2.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};
var STATS_MACRO_MAX_BUCKETS = 12;
var STATS_MACRO_TARGET_COMPONENTS = 30;
var STATS_MACRO_SAMPLE_NAMES = 10;
var STATS_MACRO_PARTIAL_SAMPLE_REGIONS = 4;
var STATS_COMPONENT_SPLIT_MAX_COMPONENTS = 24;
var statsSphericalVector = (lng, lat) => {
  const lon = (Number(lng) || 0) * Math.PI / 180;
  const phi = (Number(lat) || 0) * Math.PI / 180;
  const cosPhi = Math.cos(phi);
  return [cosPhi * Math.cos(lon), cosPhi * Math.sin(lon), Math.sin(phi)];
};
var statsVectorDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
var statsVectorNormalize = (value) => {
  const length = Math.hypot(value[0], value[1], value[2]) || 1;
  return [value[0] / length, value[1] / length, value[2] / length];
};
var statsVectorLngLat = (value) => {
  const unit = statsVectorNormalize(value);
  return {
    lng: Math.atan2(unit[1], unit[0]) * 180 / Math.PI,
    lat: Math.asin(Math.max(-1, Math.min(1, unit[2]))) * 180 / Math.PI
  };
};
var coordinateOrNull = (value) => {
  if (value === null || value === void 0 || value === "") return null;
  const number2 = Number(value);
  return Number.isFinite(number2) ? number2 : null;
};
var ringCentroid = (ring) => {
  const points = normalizeArray(ring).filter((point) => Array.isArray(point) && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1])));
  if (!points.length) return null;
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [x0, y0] = points[index].map(Number);
    const [x1, y1] = points[(index + 1) % points.length].map(Number);
    const cross = x0 * y1 - x1 * y0;
    twiceArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  if (Math.abs(twiceArea) > 1e-12) {
    return { lng: cx / (3 * twiceArea), lat: cy / (3 * twiceArea), area: Math.abs(twiceArea) / 2 };
  }
  const sum = points.reduce((acc, point) => [acc[0] + Number(point[0]), acc[1] + Number(point[1])], [0, 0]);
  return { lng: sum[0] / points.length, lat: sum[1] / points.length, area: 0 };
};
var geometryCentroid = (geometry) => {
  if (!geometry || typeof geometry !== "object") return null;
  if (geometry.type === "Point") {
    const lng = coordinateOrNull(geometry.coordinates?.[0]);
    const lat = coordinateOrNull(geometry.coordinates?.[1]);
    return lng === null || lat === null ? null : { lng, lat };
  }
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? normalizeArray(geometry.coordinates) : [];
  let best = null;
  for (const polygon of polygons) {
    const centroid = ringCentroid(normalizeArray(polygon)[0]);
    if (centroid && (!best || centroid.area > best.area)) best = centroid;
  }
  return best ? { lng: best.lng, lat: best.lat } : null;
};
var statsRegionHeuristicWeight = ({ tags = [], type = "" } = {}) => {
  const lowered = new Set(normalizeArray(tags).map((tag) => normalizeString2(tag).toLowerCase()).filter(Boolean));
  const typeKey = normalizeString2(type).toLowerCase();
  let weight = 1;
  if ([...lowered].some((tag) => tag.includes("capital"))) weight *= 4;
  else if ([...lowered].some((tag) => tag.includes("metro") || tag.includes("city") || tag.includes("urban"))) weight *= 2.5;
  if ([...lowered].some((tag) => tag.includes("desert"))) weight *= 0.5;
  if ([...lowered].some((tag) => tag.includes("mountain") || tag.includes("hill"))) weight *= 0.8;
  if ([...lowered].some((tag) => tag.includes("jungle"))) weight *= 0.75;
  if (typeKey.includes("island")) weight *= 0.8;
  return Math.max(0.1, weight);
};
var buildStatsMacroPlan = (plannedRows = []) => {
  const rows = normalizeArray(plannedRows).map((row, index) => {
    const geography = normalizeString2(row?.geography || row?.baseGeography);
    if (!geography) return null;
    const hasLng = row?.lng !== null && row?.lng !== void 0 && row?.lng !== "";
    const hasLat = row?.lat !== null && row?.lat !== void 0 && row?.lat !== "";
    const lng = Number(row?.lng);
    const lat = Number(row?.lat);
    const hasPoint = hasLng && hasLat && Number.isFinite(lng) && Number.isFinite(lat);
    const held = normalizeArray(row?.regions);
    return {
      sourceIndex: index,
      index: Number(row?.index) || index + 1,
      geography,
      // How much of this base geography the polity actually holds. The prompt
      // must say so: "Ukraine" alone reads as all of Ukraine (see macroMemberLabel).
      heldRegions: held.length,
      totalRegions: Math.max(held.length, Math.trunc(Number(row?.total) || 0)),
      sampleRegionNames: [...held].sort((a, b) => (Number(b?.weight) || 1) - (Number(a?.weight) || 1) || normalizeString2(a?.name).localeCompare(normalizeString2(b?.name))).slice(0, STATS_MACRO_PARTIAL_SAMPLE_REGIONS).map((region) => normalizeString2(region?.name)).filter(Boolean),
      located: hasPoint,
      lng: hasPoint ? lng : index * 137.508 % 360 - 180,
      lat: hasPoint ? lat : 0,
      weight: Math.max(0.1, Number(row?.weight) || 1),
      vector: statsSphericalVector(hasPoint ? lng : index * 137.508 % 360 - 180, hasPoint ? lat : 0),
      regionIds: normalizeArray(row?.regions).map((region) => normalizeString2(region?.id)).filter(Boolean),
      adjacencyIds: normalizeArray(row?.regions).flatMap((region) => normalizeArray(region?.adjacencies).map(normalizeString2)).filter(Boolean)
    };
  }).filter(Boolean);
  if (!rows.length) return [];
  const anyLocated = rows.some((row) => row.located);
  const clusterSpatially = (subset, bucketCount) => {
    if (!subset.length) return [];
    const count = anyLocated ? Math.max(1, Math.min(bucketCount, subset.length)) : 1;
    if (count === 1) {
      const vector = subset.reduce((sum, row) => [
        sum[0] + row.vector[0] * row.weight,
        sum[1] + row.vector[1] * row.weight,
        sum[2] + row.vector[2] * row.weight
      ], [0, 0, 0]);
      return [{ members: subset, ...statsVectorLngLat(vector) }];
    }
    const centers = [];
    let first = subset[0];
    for (const row of subset) {
      if (row.weight > first.weight || row.weight === first.weight && row.geography.localeCompare(first.geography) < 0) first = row;
    }
    centers.push(first.vector);
    while (centers.length < count) {
      let choice = null;
      let choiceScore = -Infinity;
      for (const row of subset) {
        let nearestDistance = Infinity;
        for (const center of centers) {
          const distance = 1 - Math.max(-1, Math.min(1, statsVectorDot(row.vector, center)));
          if (distance < nearestDistance) nearestDistance = distance;
        }
        const score = nearestDistance * Math.sqrt(row.weight);
        if (score > choiceScore || score === choiceScore && row.geography.localeCompare(choice?.geography || "") < 0) {
          choice = row;
          choiceScore = score;
        }
      }
      centers.push(choice?.vector || subset[centers.length % subset.length].vector);
    }
    let assignments = new Array(subset.length).fill(0);
    for (let iteration = 0; iteration < 5; iteration += 1) {
      assignments = subset.map((row) => {
        let best = 0;
        let bestDot = -Infinity;
        for (let centerIndex = 0; centerIndex < centers.length; centerIndex += 1) {
          const similarity = statsVectorDot(row.vector, centers[centerIndex]);
          if (similarity > bestDot) {
            bestDot = similarity;
            best = centerIndex;
          }
        }
        return best;
      });
      for (let centerIndex = 0; centerIndex < centers.length; centerIndex += 1) {
        const members = subset.filter((_, rowIndex) => assignments[rowIndex] === centerIndex);
        if (!members.length) continue;
        const vector = members.reduce((sum, row) => [
          sum[0] + row.vector[0] * row.weight,
          sum[1] + row.vector[1] * row.weight,
          sum[2] + row.vector[2] * row.weight
        ], [0, 0, 0]);
        centers[centerIndex] = statsVectorNormalize(vector);
      }
    }
    return centers.map((center, centerIndex) => ({
      members: subset.filter((_, rowIndex) => assignments[rowIndex] === centerIndex),
      ...statsVectorLngLat(center)
    })).filter((bucket) => bucket.members.length);
  };
  const rowByRegionId = /* @__PURE__ */ new Map();
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    for (const id of rows[rowIndex].regionIds) rowByRegionId.set(id, rowIndex);
  }
  const graph = rows.map(() => /* @__PURE__ */ new Set());
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    for (const adjacentId of rows[rowIndex].adjacencyIds) {
      const other = rowByRegionId.get(adjacentId);
      if (other == null || other === rowIndex) continue;
      graph[rowIndex].add(other);
      graph[other].add(rowIndex);
    }
  }
  const visited = /* @__PURE__ */ new Set();
  const connected = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    if (visited.has(rowIndex)) continue;
    const queue = [rowIndex];
    visited.add(rowIndex);
    const memberIndexes = [];
    while (queue.length) {
      const current = queue.shift();
      memberIndexes.push(current);
      for (const next of graph[current]) {
        if (visited.has(next)) continue;
        visited.add(next);
        queue.push(next);
      }
    }
    connected.push(memberIndexes.map((index) => rows[index]));
  }
  const majorCandidates = connected.filter((component) => component.length >= 4).sort((a, b) => b.length - a.length);
  const originalTinyRows = connected.filter((component) => component.length < 4).flat();
  const reserveForTiny = originalTinyRows.length || majorCandidates.length > STATS_MACRO_MAX_BUCKETS ? 1 : 0;
  const majorLimit = Math.max(0, STATS_MACRO_MAX_BUCKETS - reserveForTiny);
  const major = majorCandidates.slice(0, majorLimit);
  const tinyRows = [
    ...originalTinyRows,
    ...majorCandidates.slice(majorLimit).flat()
  ];
  const baseDesired = Math.max(1, Math.min(STATS_MACRO_MAX_BUCKETS, Math.ceil(rows.length / STATS_MACRO_TARGET_COMPONENTS)));
  const tinyCapacity = Math.max(0, STATS_MACRO_MAX_BUCKETS - major.length);
  const tinyMinimum = tinyRows.length ? Math.min(tinyCapacity, 3, Math.ceil(tinyRows.length / 10)) : 0;
  const minimumForLandmasses = major.length + tinyMinimum;
  const desired = Math.max(1, Math.min(STATS_MACRO_MAX_BUCKETS, Math.max(baseDesired, minimumForLandmasses)));
  const allocations = major.map(() => 1);
  let tinyAllocation = tinyMinimum;
  let remaining = desired - allocations.reduce((sum, value) => sum + value, 0) - tinyAllocation;
  while (remaining > 0) {
    let bestType = "major";
    let bestIndex = -1;
    let bestPressure = tinyRows.length && tinyAllocation > 0 ? tinyRows.length / tinyAllocation : -1;
    for (let index = 0; index < major.length; index += 1) {
      const pressure = major[index].length / allocations[index];
      if (pressure > bestPressure) {
        bestPressure = pressure;
        bestIndex = index;
      }
    }
    if (bestIndex >= 0) allocations[bestIndex] += 1;
    else if (tinyRows.length) tinyAllocation += 1;
    else break;
    remaining -= 1;
  }
  const buckets = [];
  major.forEach((component, index) => buckets.push(...clusterSpatially(component, allocations[index])));
  if (tinyRows.length && tinyAllocation > 0) {
    buckets.push(...clusterSpatially(tinyRows, tinyAllocation));
  } else if (tinyRows.length && buckets.length) {
    for (const row of tinyRows) {
      let nearest = buckets[0];
      let best = -Infinity;
      for (const bucket of buckets) {
        const center = statsSphericalVector(bucket.lng, bucket.lat);
        const similarity = statsVectorDot(row.vector, center);
        if (similarity > best) {
          best = similarity;
          nearest = bucket;
        }
      }
      nearest.members.push(row);
    }
  }
  if (!buckets.length) buckets.push(...clusterSpatially(rows, desired));
  buckets.sort((a, b) => b.lat - a.lat || a.lng - b.lng || a.members[0].geography.localeCompare(b.members[0].geography));
  let componentNumber = 0;
  return buckets.map((bucket, index) => ({
    index: index + 1,
    ...bucket,
    members: orderMacroMembers(bucket.members).map((member) => ({ ...member, componentId: `C${componentNumber += 1}` }))
  }));
};
var macroMemberIsPartial = (member) => Number(member?.totalRegions) > 0 && Number(member?.heldRegions) < Number(member?.totalRegions);
var orderMacroMembers = (members) => {
  const byWeight = (a, b) => b.weight - a.weight || a.geography.localeCompare(b.geography);
  return [
    ...members.filter(macroMemberIsPartial).sort(byWeight),
    ...members.filter((member) => !macroMemberIsPartial(member)).sort(byWeight)
  ];
};
var macroMemberLabel = (member) => {
  const held = Number(member?.heldRegions) || 0;
  const total = Number(member?.totalRegions) || 0;
  if (!total) return member.geography;
  if (!macroMemberIsPartial(member)) return `${member.geography} (whole, ${total} region${total === 1 ? "" : "s"})`;
  const names = normalizeArray(member?.sampleRegionNames);
  const more = held - names.length;
  return `${member.geography} (PARTIAL: only ${held} of its ${total} regions${names.length ? ` \u2014 ${names.join(", ")}${more > 0 ? ` and ${more} more` : ""}` : ""}; count ONLY these, not all of ${member.geography})`;
};
var macroBucketCenterText = (members) => {
  const located = members.filter((member) => member.located);
  if (!located.length) return "";
  const center = statsVectorLngLat(located.reduce((sum, member) => [
    sum[0] + member.vector[0] * member.weight,
    sum[1] + member.vector[1] * member.weight,
    sum[2] + member.vector[2] * member.weight
  ], [0, 0, 0]));
  return `; center ${Math.abs(center.lat).toFixed(1)}\xB0${center.lat >= 0 ? "N" : "S"}, ${Math.abs(center.lng).toFixed(1)}\xB0${center.lng >= 0 ? "E" : "W"}`;
};
var buildStatsMacroContext = (macroPlan = [], { componentDetail = false } = {}) => normalizeArray(macroPlan).map((bucket) => {
  const members = orderMacroMembers(normalizeArray(bucket?.members));
  const head = `[M${bucket.index}] ${members.length} live component(s)${macroBucketCenterText(members)}`;
  if (componentDetail) {
    return `${head}; components: ${members.map((member) => `[${member.componentId}] ${macroMemberLabel(member)}`).join("; ")}`;
  }
  const partialCount = members.filter(macroMemberIsPartial).length;
  const shown = members.slice(0, Math.max(partialCount, STATS_MACRO_SAMPLE_NAMES));
  const unshown = members.length - shown.length;
  const places = shown.map(macroMemberLabel).join("; ") + (unshown > 0 ? `; and ${unshown} more whole component(s)` : "");
  return `${head}; representative places: ${places}`;
}).join("\n");
var statsPolityAliases = (world, canonicalName) => {
  const values = /* @__PURE__ */ new Set([normalizeString2(canonicalName)]);
  const target = normalizeString2(canonicalName).toLowerCase();
  for (const [key, polity] of Object.entries(world?.polityOverrides || {})) {
    const candidates = [key, polity?.code, polity?.name, ...normalizeArray(polity?.aliases)].map(normalizeString2).filter(Boolean);
    const belongs = candidates.some((candidate) => {
      const resolved = canonicalStatsPolity(candidate, world);
      return normalizeString2(resolved).toLowerCase() === target;
    });
    if (belongs) candidates.forEach((candidate) => values.add(candidate));
  }
  return [...values].filter(Boolean);
};
var STATS_ECONOMIC_EVENT_SCAN_LIMIT = 64;
var STATS_ECONOMIC_EVIDENCE_LIMIT = 12;
var STATS_ACCOUNTED_EVENT_LIMIT = 64;
var ECONOMIC_EVENT_PATTERN = /\b(?:tax|taxation|levy|budget|fiscal|deficit|surplus|debt|bond|loan|credit|bank|banking|currency|monetary|inflation|unemployment|recession|depression|boom|growth|trade|tariff|customs|sanction|blockade|shortage|harvest|famine|food|coal|oil|energy|industry|industrial|factory|rail|railway|infrastructure|subsid|spending|appropriation|finance|financial|wage|strike|mobiliz|war finance|occupation|annex|cession|reparat|investment|export|import)\b/i;
var STATS_GENERIC_POLITY_WORDS = /* @__PURE__ */ new Set([
  "empire",
  "kingdom",
  "republic",
  "state",
  "states",
  "federation",
  "federal",
  "union",
  "united",
  "people",
  "peoples",
  "grand",
  "duchy",
  "commonwealth"
]);
var statsTextMentionsTarget = (textValue, aliases) => {
  const text2 = normalizeString2(textValue).toLowerCase();
  if (!text2) return false;
  for (const alias of aliases) {
    const phrase = normalizeString2(alias).toLowerCase();
    if (phrase.length >= 4 && text2.includes(phrase)) return true;
    const tokens = phrase.replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/[\s-]+/).filter((token) => token.length >= 5 && !STATS_GENERIC_POLITY_WORDS.has(token));
    for (const token of tokens) {
      if (text2.includes(token)) return true;
      if (token.length >= 6 && text2.includes(token.slice(0, 5))) return true;
    }
  }
  return false;
};
var parseIsoDateKernel = (value) => parseGameDate(value);
var statsDateMillisKernel = (value) => {
  const dayNumber = gameDateDayNumber(value);
  return dayNumber === null ? null : dayNumber * 864e5;
};
var statsTerritorialPlanMatchesSheetKernel = (sheet, plan = []) => {
  const expected = normalizeArray(plan).map((entry) => normalizeString2(entry?.geography).toLowerCase()).filter(Boolean).sort();
  if (!expected.length) return true;
  const actual = normalizeArray(sheet?.territorialComponents).map((entry) => normalizeString2(entry?.geography).toLowerCase()).filter(Boolean).sort();
  if (actual.length !== expected.length) return false;
  return expected.every((geography, index) => actual[index] === geography);
};
var buildStatsPreviousMacroContextKernel = (previous, macroPlan = []) => {
  const byGeography = new Map(
    normalizeArray(previous?.territorialComponents).map((component) => [normalizeString2(component?.geography).toLowerCase(), component])
  );
  const lines = [];
  for (const bucket of normalizeArray(macroPlan)) {
    const components = normalizeArray(bucket?.members).map((member) => byGeography.get(normalizeString2(member?.geography).toLowerCase())).filter(Boolean);
    if (!components.length) continue;
    const population = components.reduce(
      (sum, component) => sum + Math.max(0, Number(component?.population) || 0),
      0
    );
    const gdp = components.reduce(
      (sum, component) => sum + Math.max(0, Number(component?.population) || 0) * Math.max(0, Number(component?.gdpPerCapita) || 0),
      0
    );
    const groups = /* @__PURE__ */ new Map();
    for (const component of components) {
      groups.set(
        component.group,
        (groups.get(component.group) || 0) + Math.max(0, Number(component.population) || 0)
      );
    }
    const group = [...groups.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "core";
    lines.push(
      `[M${bucket.index}] group=${group}; population=${Math.round(population)}; gdpPerCapita=${population > 0 ? Math.round(gdp / population) : 0}; matched=${components.length}/${normalizeArray(bucket.members).length}`
    );
  }
  return lines.join("\n");
};
var buildTargetEconomicEvidenceKernel = ({ bundle, statCode, previous, world }) => {
  const target = canonicalStatsPolity(statCode, world) || normalizeString2(statCode);
  const targetKey = target.toLowerCase();
  const aliases = statsPolityAliases(world, target);
  const accounted = new Set(
    normalizeArray(previous?.continuity?.accountedEventIds).map(normalizeString2).filter(Boolean)
  );
  const sameTarget = (token) => {
    const resolved = canonicalStatsPolity(token, world);
    return normalizeString2(resolved).toLowerCase() === targetKey;
  };
  const recent = normalizeArray(bundle?.events).slice(-STATS_ECONOMIC_EVENT_SCAN_LIMIT);
  const relevant = [];
  for (const event of recent) {
    const id = normalizeString2(event?.id);
    if (!id) continue;
    const prose = `${normalizeString2(event?.title)} ${normalizeString2(event?.description)}`;
    const impacts = event?.impacts && typeof event.impacts === "object" ? event.impacts : {};
    const statImpact = normalizeArray(impacts.polityChanges).some((change) => change?.stats && sameTarget(change?.code || change?.name));
    const legalTerritoryImpact = normalizeArray(impacts.regionTransfers).some((transfer) => sameTarget(transfer?.fromCode) || sameTarget(transfer?.toCode));
    const controlImpact = normalizeArray(impacts.regionControlOps).some((op) => sameTarget(op?.fromCode) || sameTarget(op?.toCode) || sameTarget(op?.actorCode) || sameTarget(op?.claimantCode));
    const combatant = normalizeArray(event?.combatants).some(sameTarget);
    const mentioned = statsTextMentionsTarget(prose, aliases);
    const economicCue = ECONOMIC_EVENT_PATTERN.test(prose);
    if (!(statImpact || legalTerritoryImpact || economicCue && (mentioned || controlImpact || combatant))) continue;
    relevant.push({
      id,
      date: normalizeString2(event?.date),
      title: normalizeString2(event?.title) || "Economic development",
      description: normalizeString2(event?.description),
      importance: normalizeString2(event?.importance),
      directStatImpact: statImpact,
      legalTerritoryImpact
    });
  }
  const unaccounted = relevant.filter((event) => !accounted.has(event.id));
  const selectedFresh = unaccounted.slice(-STATS_ECONOMIC_EVIDENCE_LIMIT);
  const deferredCount = Math.max(0, unaccounted.length - selectedFresh.length);
  const lines = selectedFresh.map((event) => {
    const detail = event.description.length > 360 ? `${event.description.slice(0, 359).trimEnd()}\u2026` : event.description;
    const flags = [
      event.directStatImpact ? "event carries explicit stats impact" : "",
      event.legalTerritoryImpact ? "legal-territory change" : ""
    ].filter(Boolean).join(", ");
    return `- [${event.id}] ${event.date || "undated"} \u2014 ${event.title}${flags ? ` [${flags}]` : ""}${detail ? `: ${detail}` : ""}`;
  });
  if (deferredCount > 0) {
    lines.unshift(`- ${deferredCount} earlier fresh relevant economic event(s) are intentionally deferred by the bounded evidence window; do not invent their details.`);
  }
  return {
    text: lines.join("\n"),
    relevantIds: relevant.map((event) => event.id).slice(-STATS_ACCOUNTED_EVENT_LIMIT),
    selectedFreshIds: selectedFresh.map((event) => event.id),
    unaccountedCount: unaccounted.length
  };
};
var STATS_CALIBRATION_STARTING_TEXT_LIMIT = 5e3;
var STATS_CALIBRATION_PREGAME_EVENT_LIMIT = 12;
var STATS_CALIBRATION_CAMPAIGN_EVENT_LIMIT = 16;
var STATS_CALIBRATION_HISTORY_LIMIT = 8;
var STATS_CALIBRATION_CONSOLIDATED_LIMIT = 10;
var STATS_DEMOGRAPHIC_CANON_PATTERN = /\b(?:war|battle|casualt|killed|deaths?|mortality|epidem|pandemic|disease|famine|starvation|refuge|migration|emigration|immigration|expulsion|deport|population|birth|annex|cession|partition|occupation|independence|secession|mobiliz|demobiliz|reconstruction|coloniz|settlement)\b/i;
var compactStatsCalibrationEventKernel = (event) => {
  const date = normalizeString2(event?.date) || "undated";
  const title = normalizeString2(event?.title) || "Untitled event";
  const description = normalizeString2(event?.description);
  const detail = description.length > 240 ? `${description.slice(0, 239).trimEnd()}\u2026` : description;
  return `- ${date} \u2014 ${title}${detail ? `: ${detail}` : ""}`;
};
var buildStatsPopulationCalibrationCanonKernel = ({ bundle, statCode, world }) => {
  const target = canonicalStatsPolity(statCode, world) || normalizeString2(statCode);
  const targetKey = target.toLowerCase();
  const aliases = statsPolityAliases(world, target);
  const startDate = normalizeString2(bundle?.game?.startDate || bundle?.game?.gameDate);
  const currentDate = normalizeString2(bundle?.game?.gameDate || startDate);
  const events = normalizeArray(bundle?.events);
  const sameTarget = (token) => {
    const resolved = canonicalStatsPolity(token, world);
    return normalizeString2(resolved).toLowerCase() === targetKey;
  };
  const isBeforeStart = (event) => {
    if (normalizeString2(event?.source).toLowerCase() === "pregame") return true;
    const eventDate = normalizeString2(event?.date);
    if (parseIsoDateKernel(eventDate) && parseIsoDateKernel(startDate)) {
      return statsDateMillisKernel(eventDate) < statsDateMillisKernel(startDate);
    }
    return false;
  };
  const pregame = events.filter(isBeforeStart).slice(-STATS_CALIBRATION_PREGAME_EVENT_LIMIT);
  const campaignRelevant = events.filter((event) => !isBeforeStart(event)).filter((event) => {
    const prose = `${normalizeString2(event?.title)} ${normalizeString2(event?.description)}`;
    const impacts = event?.impacts && typeof event.impacts === "object" ? event.impacts : {};
    const directStats = normalizeArray(impacts.polityChanges).some((change) => change?.stats && sameTarget(change?.code || change?.name));
    const territory = normalizeArray(impacts.regionTransfers).some((transfer) => sameTarget(transfer?.fromCode) || sameTarget(transfer?.toCode));
    const combatant = normalizeArray(event?.combatants).some(sameTarget);
    const mentioned = statsTextMentionsTarget(prose, aliases);
    return directStats || territory || combatant || mentioned && STATS_DEMOGRAPHIC_CANON_PATTERN.test(prose) || STATS_DEMOGRAPHIC_CANON_PATTERN.test(prose) && /\b(?:pandemic|epidemic|global|worldwide)\b/i.test(prose);
  }).slice(-STATS_CALIBRATION_CAMPAIGN_EVENT_LIMIT);
  const startingTimelineText = normalizeString2(world?.startingTimelineText);
  const historySummaries = normalizeArray(world?.simulationHistory).map((entry) => {
    const rawSummary = normalizeString2(entry?.summary);
    if (!rawSummary) return "";
    const summary = rawSummary.length > 600 ? `${rawSummary.slice(0, 599).trimEnd()}\u2026` : rawSummary;
    const fromDate = normalizeString2(entry?.fromDate);
    const toDate = normalizeString2(entry?.toDate || entry?.date);
    const mode = normalizeString2(entry?.mode);
    return `- ${fromDate || "?"}${toDate && toDate !== fromDate ? ` \u2192 ${toDate}` : ""}${mode ? ` [${mode}]` : ""}: ${summary}`;
  }).filter(Boolean).slice(-STATS_CALIBRATION_HISTORY_LIMIT);
  const consolidatedAll = normalizeArray(world?.consolidatedHistory).map((entry) => {
    const rawSummary = normalizeString2(entry?.summary);
    if (!rawSummary) return "";
    const summary = rawSummary.length > 700 ? `${rawSummary.slice(0, 699).trimEnd()}\u2026` : rawSummary;
    const throughDate = normalizeString2(entry?.throughDate);
    const round = Number(entry?.throughRound);
    return `- through ${throughDate || "?"}${Number.isFinite(round) ? ` (round ${Math.trunc(round)})` : ""}: ${summary}`;
  }).filter(Boolean);
  const consolidatedHistory = (() => {
    if (consolidatedAll.length <= STATS_CALIBRATION_CONSOLIDATED_LIMIT) return consolidatedAll;
    const selected = [];
    for (let index = 0; index < STATS_CALIBRATION_CONSOLIDATED_LIMIT; index += 1) {
      const sourceIndex = Math.round(
        index * (consolidatedAll.length - 1) / (STATS_CALIBRATION_CONSOLIDATED_LIMIT - 1)
      );
      selected.push(consolidatedAll[sourceIndex]);
    }
    return [...new Set(selected)];
  })();
  const blocks = [
    `Scenario start: ${startDate || "unknown"}. Current campaign date: ${currentDate || "unknown"}.`,
    "Use this canon to locate the latest genuinely shared historical frontier. A changed polity name, changed borders, a different war outcome, a surviving/dissolved regime, or any other supplied contradiction is evidence that later real-world history belongs to another timeline."
  ];
  if (startingTimelineText) {
    blocks.push(`SCENARIO AUTHOR'S WORLD-BEFORE-ROUND-ONE BRIEFING (highest-priority pre-start canon):
${startingTimelineText.slice(0, STATS_CALIBRATION_STARTING_TEXT_LIMIT)}`);
  }
  if (pregame.length) {
    blocks.push(`CANONICAL PRE-GAME EVENTS (${pregame.length} shown):
${pregame.map(compactStatsCalibrationEventKernel).join("\n")}`);
  }
  if (consolidatedHistory.length) {
    blocks.push(`LONG-CAMPAIGN CONSOLIDATED CANON (${consolidatedHistory.length} chronological coverage samples):
${consolidatedHistory.join("\n")}`);
  }
  if (historySummaries.length) {
    blocks.push(`RECENT CAMPAIGN HISTORY CHECKPOINTS (${historySummaries.length} shown):
${historySummaries.join("\n")}`);
  }
  if (campaignRelevant.length) {
    blocks.push(`TARGET/DEMOGRAPHIC CAMPAIGN EVENTS AFTER START (${campaignRelevant.length} shown):
${campaignRelevant.map(compactStatsCalibrationEventKernel).join("\n")}`);
  }
  if (!startingTimelineText && !pregame.length) {
    blocks.push("No explicit pre-start divergence text/events are available. Do NOT interpret that absence as proof that same-date real history is canonical: the live polity identity and authoritative territorial basis may themselves demonstrate an alternate scenario. If they materially conflict with real history, treat the divergence frontier as earlier/unknown and estimate forward from shared regional priors plus scenario state instead of copying a historical headline total.");
  }
  return blocks.join("\n\n");
};
var buildStatsWorkerMiddleContext = ({
  bundle,
  code,
  territorialBasis,
  forceReassess = false
}) => {
  const world = bundle?.world || {};
  const previous = normalizeCountryStatSheet(world?.countryStats?.[code]);
  const previousComplete = isCompleteCountryStatSheet(previous);
  const territorialPlan = normalizeArray(territorialBasis?.plan);
  const territorialMacroPlan = normalizeArray(territorialBasis?.macroPlan);
  const territorialFingerprint = normalizeString2(territorialBasis?.fingerprint);
  const previousTerritorialFingerprint = normalizeString2(previous?.continuity?.territorialFingerprint);
  const previousStateFingerprint = normalizeString2(previous?.continuity?.stateFingerprint);
  const territorialCoverageMatches = !previousComplete ? true : statsTerritorialPlanMatchesSheetKernel(previous, territorialPlan);
  const previousComponentCount = normalizeArray(previous?.territorialComponents).length;
  const previousPopulationCalibrationVersion = Math.max(
    0,
    Math.trunc(Number(previous?.continuity?.populationCalibrationVersion) || 0)
  );
  const currentDate = normalizeString2(bundle?.game?.gameDate || bundle?.game?.startDate);
  const campaignStartDate = normalizeString2(bundle?.game?.startDate) || currentDate;
  const currentRound = Math.max(0, Math.trunc(Number(bundle?.game?.round) || 0));
  const atScenarioStartState = Boolean(
    campaignStartDate && currentDate === campaignStartDate && currentRound <= 1
  );
  const legacyComponentCapPoison = Boolean(
    previousComplete && territorialPlan.length > 64 && previousComponentCount === 64 && previousTerritorialFingerprint && previousTerritorialFingerprint === territorialFingerprint && !territorialCoverageMatches
  );
  const startPopulationCalibrationUpgrade = Boolean(
    previousComplete && Boolean(territorialFingerprint) && atScenarioStartState && previousPopulationCalibrationVersion < COUNTRY_STATS_POPULATION_CALIBRATION_VERSION
  );
  const rebuildNumericBaseline = Boolean(
    forceReassess || legacyComponentCapPoison || startPopulationCalibrationUpgrade
  );
  const populationCalibrationRequested = Boolean(
    territorialFingerprint && (!previousComplete || rebuildNumericBaseline)
  );
  const legacyContinuityBootstrap = Boolean(previousComplete && !previousStateFingerprint);
  const legacyMappedTerritoryBootstrap = Boolean(
    legacyContinuityBootstrap && Boolean(territorialFingerprint)
  );
  const rawEconomicEvidence = buildTargetEconomicEvidenceKernel({
    bundle,
    statCode: code,
    previous,
    world
  });
  const previousContext = !rebuildNumericBaseline && previous ? (() => {
    const normalizedPrevious = normalizeCountryStatSheet(previous) || previous;
    const { territorialComponents: _previousComponents = [], ...previousSummary } = normalizedPrevious;
    const macroSummary = buildStatsPreviousMacroContextKernel(
      normalizedPrevious,
      territorialMacroPlan
    );
    return [
      "Previous whole-sheet metadata / derived aggregates:",
      JSON.stringify(previousSummary, null, 2),
      macroSummary ? `Previous bounded regional macro roll-up:
${macroSummary}` : ""
    ].filter(Boolean).join("\n");
  })() : "";
  const statsScenarioCalibrationCanon = populationCalibrationRequested ? buildStatsPopulationCalibrationCanonKernel({ bundle, statCode: code, world }) : "";
  return {
    prepared: true,
    rawEconomicEvidence,
    previousContext,
    statsScenarioCalibrationCanon
  };
};
var buildTargetStatsTerritorialBasisKernel = async ({
  bundle,
  code,
  scenarioCatalog = [],
  fallbackCatalog = [],
  pause = null,
  debug = false
} = {}) => {
  const world = bundle?.world || {};
  const target = canonicalStatsPolity(code, world);
  if (!target) {
    return {
      context: "No target polity was resolved.",
      plan: [],
      macroPlan: [],
      mode: "none",
      referenceContext: ""
    };
  }
  const liveScenarioCatalog = normalizeArray(scenarioCatalog);
  const renderedCatalog = [];
  for (const region of liveScenarioCatalog) {
    const id = normalizeString2(region?.id);
    const name = normalizeString2(region?.name) || id;
    if (id && name) {
      const countryCode = normalizeString2(region?.countryCode);
      const mappedCountryCode = countryCode ? normalizeString2(toCountryName(countryCode)) : "";
      const resolvedCodeGeography = mappedCountryCode && mappedCountryCode.toLowerCase() !== countryCode.toLowerCase() ? mappedCountryCode : "";
      const country = normalizeString2(region?.country);
      const baseGeography = country || resolvedCodeGeography || name || id;
      const baseOwner = country || resolvedCodeGeography || mappedCountryCode || "";
      renderedCatalog.push({
        id,
        name,
        countryCode,
        baseGeography,
        baseOwner,
        lng: coordinateOrNull(region?.lng),
        lat: coordinateOrNull(region?.lat),
        weight: statsRegionHeuristicWeight({ tags: region?.tags, type: region?.type }),
        adjacencies: normalizeArray(region?.adjacencies).map(normalizeString2).filter(Boolean)
      });
    }
    if (pause) await pause();
  }
  const mergedCatalog = renderedCatalog.length ? [] : normalizeArray(fallbackCatalog);
  const projectedFallbackCatalog = normalizeArray(mergedCatalog).map((region) => {
    const id = normalizeString2(region?.id);
    const name = normalizeString2(region?.name) || id;
    if (!id || !name) return null;
    const rawCountryCode = normalizeString2(region?.countryCode);
    const mappedCountryCode = rawCountryCode ? normalizeString2(toCountryName(rawCountryCode)) : "";
    const resolvedCodeGeography = mappedCountryCode && mappedCountryCode.toLowerCase() !== rawCountryCode.toLowerCase() ? mappedCountryCode : "";
    const country = normalizeString2(region?.country);
    const baseGeography = country || resolvedCodeGeography || name || id;
    const baseOwner = country || resolvedCodeGeography || mappedCountryCode || "";
    const centroid = region?.centroid?.coordinates;
    const lng = coordinateOrNull(Array.isArray(centroid) ? centroid[0] : region?.lng ?? region?.longitude);
    const lat = coordinateOrNull(Array.isArray(centroid) ? centroid[1] : region?.lat ?? region?.latitude);
    return {
      id,
      name,
      countryCode: rawCountryCode,
      baseGeography,
      baseOwner,
      lng,
      lat,
      weight: statsRegionHeuristicWeight({ tags: region?.tags, type: region?.type }),
      adjacencies: normalizeArray(region?.adjacencies).map(normalizeString2).filter(Boolean)
    };
  }).filter(Boolean);
  const catalog = renderedCatalog.length > 0 ? renderedCatalog : projectedFallbackCatalog;
  if (!catalog.length) {
    return {
      context: "No region catalog is available; use existing campaign records conservatively.",
      plan: [],
      macroPlan: [],
      mode: "none",
      referenceContext: ""
    };
  }
  const targetIdentityKeys = new Set([
    target,
    code,
    ...statsPolityAliases(world, target)
  ].map((value) => normalizeString2(value).toLowerCase()).filter(Boolean));
  const mappedTargetCode = normalizeString2(toCountryName(code));
  if (mappedTargetCode) targetIdentityKeys.add(mappedTargetCode.toLowerCase());
  const sameTarget = (value) => {
    const raw = normalizeString2(value);
    if (!raw) return false;
    const key = raw.toLowerCase();
    if (targetIdentityKeys.has(key)) return true;
    const mapped = normalizeString2(toCountryName(raw)).toLowerCase();
    return Boolean(mapped && targetIdentityKeys.has(mapped));
  };
  const canonicalCache = /* @__PURE__ */ new Map();
  const canonicalCached = (value) => {
    const raw = normalizeString2(value);
    if (!raw) return "";
    const key = raw.toLowerCase();
    if (canonicalCache.has(key)) return canonicalCache.get(key);
    const resolved = canonicalStatsPolity(raw, world);
    canonicalCache.set(key, resolved);
    return resolved;
  };
  const same = (a, b) => normalizeString2(canonicalCached(a)).toLowerCase() === normalizeString2(canonicalCached(b)).toLowerCase();
  const totalByBase = /* @__PURE__ */ new Map();
  const legalByBase = /* @__PURE__ */ new Map();
  const controlledByBase = /* @__PURE__ */ new Map();
  const displacedSovereigns = /* @__PURE__ */ new Set();
  let occupiedByTarget = 0;
  let targetOccupiedByOthers = 0;
  let nativeHomelandControlled = 0;
  const pushRegion = (map, baseGeography, region) => {
    if (!map.has(baseGeography)) map.set(baseGeography, []);
    map.get(baseGeography).push(region);
  };
  for (let catalogIndex = 0; catalogIndex < catalog.length; catalogIndex += 1) {
    if (pause) await pause();
    const region = catalog[catalogIndex];
    const regionId = normalizeString2(region?.id);
    const baseGeography = normalizeString2(region?.baseGeography) || normalizeString2(region?.name) || regionId;
    if (!regionId || !baseGeography) continue;
    totalByBase.set(baseGeography, (totalByBase.get(baseGeography) || 0) + 1);
    const baseOwner = normalizeString2(region?.baseOwner);
    const controller = normalizeString2(
      world.regionOwnershipOverrides?.[regionId] || baseOwner
    );
    const sovereign = normalizeString2(
      world.regionSovereigntyOverrides?.[regionId] || controller || baseOwner
    );
    const row = {
      id: regionId,
      name: normalizeString2(region?.name) || regionId,
      sovereign,
      lng: coordinateOrNull(region?.lng),
      lat: coordinateOrNull(region?.lat),
      weight: Math.max(0.1, Number(region?.weight) || 1),
      adjacencies: normalizeArray(region?.adjacencies).map(normalizeString2).filter(Boolean)
    };
    if (sameTarget(controller)) {
      pushRegion(controlledByBase, baseGeography, row);
      if (!sameTarget(sovereign)) {
        occupiedByTarget += 1;
        if (sovereign) displacedSovereigns.add(sovereign);
        if (sameTarget(baseGeography)) nativeHomelandControlled += 1;
      }
    }
    if (sameTarget(sovereign) && controller && !sameTarget(controller)) {
      targetOccupiedByOthers += 1;
    }
    if (sameTarget(sovereign)) pushRegion(legalByBase, baseGeography, row);
  }
  const targetOverrideEntry = Object.entries(world.polityOverrides || {}).find(([key, record]) => [
    key,
    record?.code,
    record?.name,
    ...normalizeArray(record?.aliases)
  ].some((value) => value && sameTarget(value)));
  const targetOverride = targetOverrideEntry?.[1] || null;
  const targetExplicitlyActive = normalizeString2(targetOverride?.status).toLowerCase() === "active";
  let lifecycleEstablished = false;
  let foundingTerritoryEstablished = false;
  for (const event of normalizeArray(bundle?.events)) {
    if (pause) await pause();
    const changes = normalizeArray(event?.impacts?.polityChanges);
    const establishesTarget = changes.some((change) => {
      const operation = normalizeString2(change?.operation).toLowerCase();
      return ["create", "restore"].includes(operation) && (sameTarget(change?.code) || sameTarget(change?.name));
    });
    if (!establishesTarget) continue;
    lifecycleEstablished = true;
    const grantsControl = normalizeArray(event?.impacts?.regionControlOps).some((operation) => ["control", "control_flip"].includes(normalizeString2(operation?.op).toLowerCase()) && sameTarget(operation?.toCode));
    const grantsSovereignty = normalizeArray(event?.impacts?.regionTransfers).some((transfer) => sameTarget(transfer?.toCode));
    if (grantsControl || grantsSovereignty) foundingTerritoryEstablished = true;
  }
  let opposedToDisplacedSovereign = false;
  for (const war of normalizeArray(world?.wars)) {
    if (!["active", "ceasefire"].includes(normalizeString2(war?.status).toLowerCase())) continue;
    const sideA = normalizeArray(war?.sideA);
    const sideB = normalizeArray(war?.sideB);
    const targetInA = sideA.some((party) => sameTarget(party));
    const targetInB = sideB.some((party) => sameTarget(party));
    if (!targetInA && !targetInB) continue;
    const opponents = targetInA ? sideB : sideA;
    if (opponents.some((party) => [...displacedSovereigns].some((sovereign) => same(party, sovereign)))) {
      opposedToDisplacedSovereign = true;
      break;
    }
  }
  const legalRegionCount = [...legalByBase.values()].reduce((sum, regions) => sum + regions.length, 0);
  const controlledRegionCount = [...controlledByBase.values()].reduce((sum, regions) => sum + regions.length, 0);
  const deFactoStatehoodEvidence = Boolean(
    nativeHomelandControlled > 0 || foundingTerritoryEstablished || lifecycleEstablished && opposedToDisplacedSovereign
  );
  const useDeFactoStateBasis = Boolean(
    legalRegionCount === 0 && controlledRegionCount > 0 && targetExplicitlyActive && deFactoStatehoodEvidence
  );
  const selectedByBase = useDeFactoStateBasis ? controlledByBase : legalByBase;
  const mode = useDeFactoStateBasis ? "de_facto_state" : "legal";
  if (useDeFactoStateBasis) {
    console.info(
      `[stats 8B.2.18.1] ${target}: DE-FACTO STATE ADMINISTRATION selected \u2014 ${controlledRegionCount} controlled region(s), 0 legal-sovereign region(s), rendered-geography=${renderedCatalog.length ? "yes" : "fallback"}, own-base=${nativeHomelandControlled}, lifecycle=${lifecycleEstablished ? "yes" : "no"}, founding-territory=${foundingTerritoryEstablished ? "yes" : "no"}, war-with-displaced-sovereign=${opposedToDisplacedSovereign ? "yes" : "no"}.`
    );
  } else if (legalRegionCount === 0 && controlledRegionCount > 0) {
    console.info(
      `[stats 8B.2.18.1] ${target}: ${controlledRegionCount} controlled region(s) excluded from national Stats; de-facto state qualification failed (active=${targetExplicitlyActive ? "yes" : "no"}, own-base=${nativeHomelandControlled}, lifecycle=${lifecycleEstablished ? "yes" : "no"}, founding-territory=${foundingTerritoryEstablished ? "yes" : "no"}, war-with-displaced-sovereign=${opposedToDisplacedSovereign ? "yes" : "no"}).`
    );
  }
  const rows = [...selectedByBase.entries()].map(([baseGeography, regions]) => ({
    baseGeography,
    regions,
    total: totalByBase.get(baseGeography) || regions.length
  })).sort((a, b) => b.regions.length - a.regions.length || a.baseGeography.localeCompare(b.baseGeography));
  if (!rows.length) {
    return {
      context: [
        `Target: ${target}`,
        "Accounting mode: NON-TERRITORIAL",
        "No legally sovereign national map regions were resolved for this polity.",
        controlledRegionCount > 0 ? `The polity controls ${controlledRegionCount} region(s), but native statehood safeguards did NOT classify those holdings as a de-facto national administrative basis. Ordinary occupation therefore remains excluded from national population/GDP.` : "No de-facto controlled mapped regions were resolved either.",
        "Do not silently substitute modern borders. This is an explicit NON-TERRITORIAL Stats basis: estimate a distributed/non-map population or economy only when campaign canon supports one; otherwise return no quantitative scope."
      ].join("\n"),
      plan: [],
      macroPlan: [],
      mode: "nonterritorial",
      referenceContext: ""
    };
  }
  const plannedRows = rows.map((row, index) => {
    const located = row.regions.filter(
      (region) => region?.lng !== null && region?.lng !== void 0 && region?.lng !== "" && region?.lat !== null && region?.lat !== void 0 && region?.lat !== "" && Number.isFinite(Number(region.lng)) && Number.isFinite(Number(region.lat))
    );
    const weight = row.regions.reduce((sum, region) => sum + Math.max(0.1, Number(region?.weight) || 1), 0);
    const vector = located.reduce((sum, region) => {
      const localWeight = Math.max(0.1, Number(region?.weight) || 1);
      const local = statsSphericalVector(region.lng, region.lat);
      return [sum[0] + local[0] * localWeight, sum[1] + local[1] * localWeight, sum[2] + local[2] * localWeight];
    }, [0, 0, 0]);
    const point = located.length ? statsVectorLngLat(vector) : { lng: null, lat: null };
    return {
      index: index + 1,
      geography: row.baseGeography,
      regions: row.regions,
      total: row.total,
      lng: point.lng,
      lat: point.lat,
      weight
    };
  });
  const macroPlan = buildStatsMacroPlan(plannedRows);
  const componentDetail = plannedRows.length <= STATS_COMPONENT_SPLIT_MAX_COMPONENTS;
  const macroContext = buildStatsMacroContext(macroPlan, { componentDetail });
  console.info(
    `[stats 8B.2.18.1] ${target}: ${plannedRows.length} authoritative live component(s) -> ${macroPlan.length} bounded demographic macro bucket(s) (${mode}); AI output no longer scales with province count.`
  );
  if (debug) {
    console.debug(
      `[stats 8B.2.18.1 debug] ${target}: full authoritative component plan`,
      plannedRows.map((row) => ({
        index: row.index,
        geography: row.geography,
        coverage: `${row.regions.length}/${row.total}`,
        regions: row.regions.map((region) => `${region.name} [${region.id}]`)
      }))
    );
    console.debug(`[stats 8B.2.18.1 debug] ${target}: macro plan`, macroPlan);
  }
  const lines = [
    `Target: ${target}`,
    `Accounting mode: ${useDeFactoStateBasis ? "DE-FACTO STATE ADMINISTRATION" : "LEGAL SOVEREIGNTY"}`,
    useDeFactoStateBasis ? `De-facto administered mapped regions: ${controlledRegionCount}. Legal-sovereign mapped regions: 0.` : `Legally sovereign mapped regions: ${legalRegionCount}.`,
    `Exact live-map accounting components held natively: ${plannedRows.length}.`,
    `Bounded demographic macro buckets for this AI assessment: ${macroPlan.length}.`,
    "The macro buckets below are native spatial groupings used only to bound demographic/economic estimation. They do NOT redefine sovereignty, province identity, or constitutional status.",
    macroContext
  ];
  if (useDeFactoStateBasis) {
    lines.push(
      "SPECIAL STATEHOOD RULE: native code selected controller-based Stats because this active polity has no usable legal-sovereign map basis but does administer territory as a state actor. Count ONLY the controlled territory represented by the macro buckets. This rule must NOT be generalized by the model to ordinary foreign occupation."
    );
    lines.push(
      `Native qualification evidence: own-base controlled regions=${nativeHomelandControlled}; lifecycle create/restore=${lifecycleEstablished ? "yes" : "no"}; founding event granted territory/control=${foundingTerritoryEstablished ? "yes" : "no"}; active/ceasefire conflict with displaced sovereign=${opposedToDisplacedSovereign ? "yes" : "no"}.`
    );
  }
  if (!useDeFactoStateBasis && occupiedByTarget > 0) {
    lines.push(
      `Temporary occupations held by ${target} but legally sovereign to others: ${occupiedByTarget} region(s) \u2014 DO NOT add these inhabitants/GDP to the national component total.`
    );
  }
  if (targetOccupiedByOthers > 0) {
    lines.push(
      `Legally sovereign ${target} regions under temporary foreign control: ${targetOccupiedByOthers} region(s) \u2014 keep them in legal population/GDP scope, but current occupation may economically depress/disrupt them if campaign evidence supports it.`
    );
  }
  const referenceLines = [];
  if (useDeFactoStateBasis) {
    for (const row of plannedRows) {
      const sourcePolities = [...new Set(
        row.regions.map((region) => canonicalCached(region?.sovereign)).filter((source) => source && !same(source, target))
      )];
      for (const source of sourcePolities) {
        const sourceSheet = normalizeCountryStatSheet(world?.countryStats?.[source]);
        const sourceComponents = normalizeArray(sourceSheet?.territorialComponents);
        const donor = sourceComponents.find((component) => normalizeString2(component?.geography).toLowerCase() === normalizeString2(row.geography).toLowerCase());
        const donorPopulation = Number(donor?.population);
        const donorGdpPerCapita = Number(donor?.gdpPerCapita);
        if (!donor || !Number.isFinite(donorPopulation) || donorPopulation < 0 || !Number.isFinite(donorGdpPerCapita) || donorGdpPerCapita <= 0) {
          continue;
        }
        const full = row.regions.length >= row.total;
        referenceLines.push(
          `[${row.index}] ${row.geography} \u2190 ${source}: canonical donor component population=${Math.round(donorPopulation)}, gdpPerCapita=${donorGdpPerCapita}. ${full ? "Current scope is FULL/NEAR-FULL for this base bucket; treat this as a strong pre-separation continuity anchor." : `Current scope is PARTIAL (${row.regions.length}/${row.total}); DO NOT copy the donor's whole population. Estimate ONLY the listed controlled subregions while using donor productivity/demography as context.`}`
        );
      }
    }
  }
  if (referenceLines.length) {
    console.info(`[stats 8B.2.18.1] ${target}: ${referenceLines.length} donor/reference component anchor(s) available.`);
    if (debug) {
      console.debug(`[stats 8B.2.18.1 debug] ${target}: donor/reference component anchors`, referenceLines);
    }
  }
  const fingerprintSource = [
    `mode=${mode}`,
    `geographySource=${renderedCatalog.length ? "rendered" : "fallback"}`,
    ...plannedRows.map((row) => [
      row.geography,
      row.total,
      row.regions.map((region) => region.id).sort().join(",")
    ].join("|"))
  ].join("\n");
  return {
    context: lines.join("\n"),
    plan: plannedRows.map((row) => ({ index: row.index, geography: row.geography })),
    macroPlan: macroPlan.map((bucket) => ({
      index: bucket.index,
      lng: bucket.lng,
      lat: bucket.lat,
      members: bucket.members.map((member) => ({
        componentId: member.componentId,
        geography: member.geography,
        // Which slice of the geography a stored split was made for (gameplay.js).
        heldRegions: member.heldRegions,
        weight: member.weight
      }))
    })),
    // Few enough components for the model to split each bucket between them
    // (gameplay.js decides WHEN a split is asked for).
    componentDetail,
    fingerprint: `territory-${stableStatsHash(fingerprintSource)}`,
    mode,
    referenceContext: referenceLines.slice(0, 24).join("\n") + (referenceLines.length > 24 ? `
(+${referenceLines.length - 24} more donor anchors retained natively but omitted from the bounded AI context)` : "")
  };
};
var DOSSIER_REGION_NAMES = 40;
var regionCount = (count) => count === 1 ? "1 region" : `${count} regions`;
var describeDossierTerritory = (world, code, catalog) => {
  const overrides = world?.regionOwnershipOverrides ?? {};
  const sovereignty = world?.regionSovereigntyOverrides ?? {};
  const target = toCountryName(code);
  const isTarget = (owner) => {
    const name = normalizeString2(owner);
    return Boolean(name) && (name === code || name === target || toCountryName(name) === target);
  };
  if (!catalog.length) {
    const held = Object.values(overrides).filter(isTarget).length;
    return [held ? `Territory: holds at least ${regionCount(held)} (the region catalog was unavailable, so only changed regions were counted).` : "Territory: the region catalog was unavailable, so its holdings could not be counted."];
  }
  let controlled = 0;
  let lawful = 0;
  let heldAsSovereign = 0;
  let lostToOthers = 0;
  const beyondStart = [];
  for (const region of catalog) {
    const regionId = normalizeString2(region?.id);
    if (!regionId) continue;
    const baseOwner = regionOwnerName(region, null);
    const controller = regionOwnerName(region, overrides);
    const sovereign = normalizeString2(sovereignty[regionId]) || controller;
    if (isTarget(controller)) {
      controlled += 1;
      if (!isTarget(baseOwner)) beyondStart.push(region);
      if (isTarget(sovereign)) heldAsSovereign += 1;
    } else if (isTarget(baseOwner)) {
      lostToOthers += 1;
    }
    if (isTarget(sovereign)) lawful += 1;
  }
  if (!controlled && !lawful) return [`Territory: holds no regions on the current map.`];
  const lines = [
    // Equal counts are not enough: one region occupied and another lost to an
    // occupier leave the two numbers equal over different regions.
    lawful === controlled && heldAsSovereign === controlled ? `Territory: holds ${regionCount(controlled)} on the current map, and is their lawful sovereign.` : `Territory: holds ${regionCount(controlled)} on the current map, and is the lawful sovereign of ${lawful}.`
  ];
  if (beyondStart.length) {
    const names = beyondStart.slice(0, DOSSIER_REGION_NAMES).map((region) => {
      const name = normalizeString2(region?.name) || normalizeString2(region?.id);
      return region?.country ? `${name} (${region.country})` : name;
    });
    const more = beyondStart.length > names.length;
    lines.push(`Held beyond its starting territory in this scenario: ${regionCount(beyondStart.length)}${more ? ", including" : ""}: ${names.join(", ")}${more ? ", \u2026" : ""}`);
  }
  if (lostToOthers) lines.push(`Of its starting territory in this scenario, ${regionCount(lostToOthers)} ${lostToOthers === 1 ? "is" : "are"} now held by others.`);
  return lines;
};
var buildTargetDossierKernel = ({ bundle, code, scenarioCatalog = [], fallbackCatalog = [] } = {}) => {
  const world = bundle?.world || {};
  const lines = [];
  const polity = code ? world.polityOverrides?.[code] : null;
  if (polity) {
    lines.push(
      `Polity: ${polity.name || code} (code ${code})${polity.aliases?.length > 0 ? ` \u2014 also known as ${polity.aliases.join(", ")}` : ""}`
    );
    if (polity.note) lines.push(`Notes: ${polity.note}`);
    if (Number(polity.population) > 0) lines.push(`Population when the scenario begins, as its author gives it: ${Math.round(Number(polity.population))}. Take that as given, and move it only by what has happened since.`);
  }
  if (code) {
    const catalog = normalizeArray(scenarioCatalog).length ? normalizeArray(scenarioCatalog) : normalizeArray(fallbackCatalog);
    lines.push(...describeDossierTerritory(world, code, catalog));
  }
  const units = normalizeArray(bundle?.world?.units).filter((unit) => unit?.ownerCode === code);
  if (units.length > 0) {
    const byType = /* @__PURE__ */ new Map();
    let strength = 0;
    for (const unit of units) {
      byType.set(unit.type, (byType.get(unit.type) || 0) + 1);
      strength += Number(unit.strength) || 0;
    }
    const composition = Array.from(byType.entries()).map(([type, count]) => `${count} ${type}`).join(", ");
    lines.push(`Deployed forces: ${units.length} units (${composition}), combined strength ${strength}.`);
  } else {
    lines.push("Deployed forces: none currently on the map.");
  }
  return lines.join("\n");
};
var projectCountryStatsScenarioCatalog = (geojson) => {
  const entries = [];
  for (const feature of geojson?.features || []) {
    const props = feature?.properties || {};
    const id = props?.id != null ? String(props.id) : props?.GID_1 != null ? String(props.GID_1) : "";
    if (!id) continue;
    const rawName = props?.name ?? props?.NAME_1 ?? props?.name_1;
    const name = normalizeString2(rawName) || id;
    const centroid = props?.centroid?.coordinates;
    let lng = coordinateOrNull(Array.isArray(centroid) ? centroid[0] : props?.lng ?? props?.longitude);
    let lat = coordinateOrNull(Array.isArray(centroid) ? centroid[1] : props?.lat ?? props?.latitude);
    if (lng === null || lat === null) {
      const fromShape = geometryCentroid(feature?.geometry);
      lng = fromShape?.lng ?? null;
      lat = fromShape?.lat ?? null;
    }
    entries.push({
      country: props?.country ? String(props.country) : "",
      countryCode: props?.gid0 != null ? String(props.gid0) : props?.GID_0 != null ? String(props.GID_0) : "",
      id,
      name,
      lng: Number.isFinite(lng) ? lng : null,
      lat: Number.isFinite(lat) ? lat : null,
      tags: Array.isArray(props?.tags) ? props.tags.map((value) => String(value)) : [],
      type: props?.type ? String(props.type) : "",
      adjacencies: Array.isArray(props?.adjacencies) ? props.adjacencies.map((value) => String(value)).filter(Boolean) : []
    });
  }
  return entries;
};
var prepareCountryStatsKernel = async (payload = {}) => {
  const common = {
    bundle: payload.bundle || {},
    code: payload.code || "",
    scenarioCatalog: payload.scenarioCatalog || [],
    fallbackCatalog: payload.fallbackCatalog || []
  };
  const territorialBasis = await buildTargetStatsTerritorialBasisKernel(common);
  return {
    territorialBasis,
    dossier: buildTargetDossierKernel(common),
    middle: buildStatsWorkerMiddleContext({
      bundle: common.bundle,
      code: common.code,
      territorialBasis,
      forceReassess: Boolean(payload.forceReassess)
    })
  };
};

// src/Game/AI/runtimeIoBridge.js
var IO_REQUEST = "io";
var IO_RESULT = "io-result";
var IO_CONFIG = "config";
var createWorkerIoClient = (post) => {
  let nextId = 1;
  const pending = /* @__PURE__ */ new Map();
  return {
    fetch: (url, init = {}) => new Promise((resolve, reject) => {
      const ioId = nextId;
      nextId += 1;
      pending.set(ioId, { resolve, reject });
      try {
        post({
          type: IO_REQUEST,
          ioId,
          url: String(url),
          method: String(init.method || "GET"),
          headers: init.headers && typeof init.headers === "object" ? { ...init.headers } : {},
          body: init.body == null ? null : String(init.body)
        });
      } catch (error) {
        pending.delete(ioId);
        reject(error);
      }
    }),
    // True when the message was an answer to one of ours (handled), false to
    // let the caller route it elsewhere.
    handle: (message) => {
      if (!message || message.type !== IO_RESULT) return false;
      const entry = pending.get(message.ioId);
      if (!entry) return true;
      pending.delete(message.ioId);
      if (message.failed) {
        entry.reject(new TypeError(String(message.text || "The page could not perform the request.")));
        return true;
      }
      const status = Number(message.status) || 0;
      const text2 = String(message.text ?? "");
      entry.resolve({
        ok: status >= 200 && status < 300,
        status,
        text: async () => text2,
        json: async () => text2 ? JSON.parse(text2) : null
      });
      return true;
    },
    pendingCount: () => pending.size
  };
};

// src/Game/AI/countryStatsWorker.js
var cachedRegionUrl = "";
var cachedScenarioCatalog = null;
var ioBridge = createWorkerIoClient((message) => self.postMessage(message));
var bridgeRuntimeIo = false;
var runtimeFetch = (url, init) => bridgeRuntimeIo ? ioBridge.fetch(url, init) : fetch(url, init);
var fetchRuntimeJson = async (url, { allowMissing = false } = {}) => {
  if (!url) {
    if (allowMissing) return null;
    throw new Error("Stats worker runtime URL is missing.");
  }
  const response = await runtimeFetch(url, {
    cache: "no-store",
    credentials: "same-origin"
  });
  if (!response.ok) {
    if (allowMissing) return null;
    throw new Error(`Stats worker failed to load ${url}: HTTP ${response.status}`);
  }
  return response.json();
};
var persistRuntimeJson = async (url, value) => {
  const serializeStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  const body = JSON.stringify(value);
  const serializedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  const response = await runtimeFetch(url, {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body
  });
  if (!response.ok) {
    throw new Error(`Stats worker failed to save ${url}: HTTP ${response.status}`);
  }
  const savedText = await response.text();
  const responseReadAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  const saved = savedText ? JSON.parse(savedText) : value;
  const parsedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  return {
    saved,
    timings: {
      stringify: Math.max(0, serializedAt - serializeStartedAt),
      putAndRead: Math.max(0, responseReadAt - serializedAt),
      echoParse: Math.max(0, parsedAt - responseReadAt),
      total: Math.max(0, parsedAt - serializeStartedAt)
    }
  };
};
var persistCountryStats = async (payload = {}) => {
  const urls = payload?.urls || {};
  const country = String(payload?.code || "").trim();
  if (!country) throw new Error("Stats worker persistence country is missing.");
  const world = await fetchRuntimeJson(urls.world);
  if (!world || typeof world !== "object") {
    throw new Error("Stats worker persistence could not load canonical world state.");
  }
  if (!world.countryStats || typeof world.countryStats !== "object") {
    world.countryStats = {};
  }
  const nextSheet = mergeCountryStatPatch(
    world.countryStats[country],
    payload?.sheet || {},
    {
      replaceComponents: true,
      continuity: payload?.continuity && typeof payload.continuity === "object" ? payload.continuity : null
    }
  );
  if (!nextSheet || typeof nextSheet !== "object") {
    throw new Error(`Stats worker could not merge the canonical sheet for ${country}.`);
  }
  world.countryStats[country] = nextSheet;
  world.countryStatsHistory = appendCountryStatHistorySample(
    world.countryStatsHistory,
    country,
    nextSheet,
    {
      date: String(payload?.date || ""),
      round: Math.max(0, Math.trunc(Number(payload?.round) || 0))
    }
  );
  const persisted = await persistRuntimeJson(urls.world, world);
  const savedWorld = persisted.saved && typeof persisted.saved === "object" ? persisted.saved : world;
  const savedSheet = savedWorld?.countryStats?.[country] && typeof savedWorld.countryStats[country] === "object" ? savedWorld.countryStats[country] : nextSheet;
  const historySeries = Array.isArray(savedWorld?.countryStatsHistory?.[country]) ? savedWorld.countryStatsHistory[country] : Array.isArray(world?.countryStatsHistory?.[country]) ? world.countryStatsHistory[country] : [];
  return {
    sheet: savedSheet,
    historySeries,
    timings: persisted.timings
  };
};
var loadScenarioCatalog = async (url) => {
  if (cachedScenarioCatalog && cachedRegionUrl === url) {
    return cachedScenarioCatalog;
  }
  const geojson = await fetchRuntimeJson(url, { allowMissing: true });
  if (!geojson || !Array.isArray(geojson?.features) || geojson.features.length === 0) {
    return null;
  }
  const catalog = projectCountryStatsScenarioCatalog(geojson);
  cachedRegionUrl = url;
  cachedScenarioCatalog = catalog;
  return catalog;
};
self.onmessage = async (event) => {
  const type = String(event?.data?.type || "");
  if (type === IO_CONFIG) {
    bridgeRuntimeIo = Boolean(event.data.bridgeRuntimeIo);
    return;
  }
  if (ioBridge.handle(event?.data)) return;
  const id = Number(event?.data?.id);
  if (!["prepare", "persist"].includes(type)) return;
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const payload = event?.data?.payload || {};
    if (type === "persist") {
      const result2 = await persistCountryStats(payload);
      const endedAt2 = typeof performance !== "undefined" ? performance.now() : Date.now();
      self.postMessage({
        id,
        result: result2,
        timings: {
          ...result2?.timings || {},
          totalWall: Math.max(0, endedAt2 - startedAt)
        }
      });
      return;
    }
    const urls = payload?.urls || {};
    const [world, events, game, scenarioCatalog] = await Promise.all([
      fetchRuntimeJson(urls.world),
      fetchRuntimeJson(urls.events),
      fetchRuntimeJson(urls.game),
      loadScenarioCatalog(urls.regionsGeojson)
    ]);
    if (!scenarioCatalog?.length) {
      const error = new Error(
        "Stats worker could not resolve the active scenario region catalog."
      );
      error.code = "STATS_WORKER_REGION_CATALOG_UNAVAILABLE";
      throw error;
    }
    const loadedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    const result = await prepareCountryStatsKernel({
      code: payload.code || "",
      bundle: {
        events: Array.isArray(events) ? events : [],
        game: game && typeof game === "object" ? game : {},
        world: world && typeof world === "object" ? world : {}
      },
      scenarioCatalog,
      fallbackCatalog: [],
      forceReassess: Boolean(payload.forceReassess)
    });
    const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    self.postMessage({
      id,
      result,
      timings: {
        load: Math.max(0, loadedAt - startedAt),
        compute: Math.max(0, endedAt - loadedAt),
        total: Math.max(0, endedAt - startedAt)
      }
    });
  } catch (error) {
    self.postMessage({
      id,
      error: String(error?.message || error || "Country Stats worker failed."),
      errorCode: String(error?.code || "")
    });
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
/*! Open Historia — the two layers of a country's statistics © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — wars meant to end one way © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — how a scenario's wars are fought (Wars and Fronts Pt.2) © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — a country's military figures, as a scenario and the game keep them © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — scenario-defined national Stats sheet definitions © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — native persistent country statistics and economic aggregation. */
/*! Open Historia — a territory named by its own name © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia — region ownership vocabulary for AI prompts © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
/*! Open Historia Continuum — R2.35 country Stats worker kernel.
 * Pure deterministic preparation only. No DOM, React, canonical writes, or AI calls.
 */
/*! Open Historia — a worker's runtime I/O, answered by the page © 2026 Nicholas Krol, AGPL-3.0-or-later (see LICENSE). */
