"use client";

/**
 * Lightweight i18n for Flamingo Pay merchant app.
 * - Supports SA's 11 official languages.
 * - State persisted to localStorage ("flamingo_lang").
 * - Translations are an in-memory dictionary for now.
 *   TODO: replace with professionally translated JSON files per locale
 *   before production. Current non-English strings are first-pass and
 *   need native-speaker review.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type LangCode =
  | "en"
  | "af"
  | "zu"
  | "xh"
  | "st"
  | "nso"
  | "tn"
  | "ts"
  | "ss"
  | "ve"
  | "nr";

export const LANGUAGES: {
  code: LangCode;
  name: string;      // English name
  native: string;    // Name in own language
}[] = [
  { code: "en",  name: "English",          native: "English"      },
  { code: "af",  name: "Afrikaans",        native: "Afrikaans"    },
  { code: "zu",  name: "Zulu",             native: "isiZulu"      },
  { code: "xh",  name: "Xhosa",            native: "isiXhosa"     },
  { code: "st",  name: "Southern Sotho",   native: "Sesotho"      },
  { code: "nso", name: "Sepedi",           native: "Sepedi"       },
  { code: "tn",  name: "Tswana",           native: "Setswana"     },
  { code: "ts",  name: "Tsonga",           native: "Xitsonga"     },
  { code: "ss",  name: "Swati",            native: "siSwati"      },
  { code: "ve",  name: "Venda",            native: "Tshivenḓa"    },
  { code: "nr",  name: "Ndebele",          native: "isiNdebele"   },
];

type Dict = Partial<Record<LangCode, string>>;

/** Translation dictionary. English is the source-of-truth fallback. */
const D: Record<string, Dict> = {
  // ---- Tab bar ----
  nav_home: {
    en: "Home", af: "Tuis", zu: "Ikhaya", xh: "Ikhaya",
    st: "Lehae", nso: "Gae", tn: "Legae", ts: "Kaya",
    ss: "Likhaya", ve: "Hayani", nr: "Ikhaya",
  },
  nav_sales: {
    en: "Sales", af: "Verkope", zu: "Ukudayisa", xh: "Intengiso",
    st: "Thekiso", nso: "Thekišo", tn: "Thekiso", ts: "Ku xavisa",
    ss: "Kutsengisa", ve: "U rengisa", nr: "Ukuthengisa",
  },
  nav_qr: {
    en: "QR", af: "QR", zu: "QR", xh: "QR",
    st: "QR", nso: "QR", tn: "QR", ts: "QR",
    ss: "QR", ve: "QR", nr: "QR",
  },
  nav_statements: {
    en: "Statements", af: "State", zu: "Izitatimende", xh: "Izitatimende",
    st: "Litatamente", nso: "Ditatamente", tn: "Ditatamente", ts: "Xitatimende",
    ss: "Titatimende", ve: "Tsitatimende", nr: "Izitatimende",
  },
  nav_payouts: {
    en: "Payouts", af: "Uitbetalings", zu: "Imali", xh: "Iintlawulo",
    st: "Ditefo", nso: "Ditefo", tn: "Ditefo", ts: "Tihakelo",
    ss: "Tinkhokhelo", ve: "Malipfo", nr: "Iimbadalo",
  },
  nav_profile: {
    en: "Profile", af: "Profiel", zu: "Iphrofayela", xh: "Iphrofayile",
    st: "Profaele", nso: "Profaele", tn: "Profaele", ts: "Profayili",
    ss: "Liphrofayela", ve: "Profilo", nr: "Iphrofayela",
  },

  // ---- Top bar subtitles ----
  tb_sales_sub: {
    en: "Your transactions",
    af: "Jou transaksies",
    zu: "Ukuthengisa kwakho",
    xh: "Iintengiso zakho",
    st: "Dithekiso tsa hao",
    nso: "Dithekišo tša gago",
    tn: "Dithekiso tsa gago",
    ts: "Mahakelo ya wena",
    ss: "Lokutsengiswa kwakho",
    ve: "U rengisa hanu",
    nr: "Ukuthengisa kwakho",
  },

  // ---- Dashboard ----
  dash_hi: {
    en: "Hi", af: "Hallo", zu: "Sawubona", xh: "Molo",
    st: "Dumela", nso: "Dumela", tn: "Dumela", ts: "Avuxeni",
    ss: "Sawubona", ve: "Ndaa", nr: "Lotjhani",
  },
  today_earnings: {
    en: "Today's earnings",
    af: "Vandag se inkomste",
    zu: "Imali yanamuhla",
    xh: "Imali yanamhlanje",
    st: "Chelete ya kajeno",
    nso: "Tšhelete ya lehono",
    tn: "Madi a gompieno",
    ts: "Mali ya namuntlha",
    ss: "Imali yalamuhla",
    ve: "Tshelede ya namusi",
    nr: "Imali yanamhlanje",
  },
  transactions_plural: {
    en: "transactions", af: "transaksies", zu: "izintengo",
    xh: "iintengiselwano", st: "dithekiso", nso: "dithekišo",
    tn: "dithekiso", ts: "mahakelo", ss: "tintengiselwano",
    ve: "u rengisa", nr: "iintengiselwano",
  },
  transaction_singular: {
    en: "transaction", af: "transaksie", zu: "ukuthengisa",
    xh: "intengiselwano", st: "thekiso", nso: "thekišo",
    tn: "thekiso", ts: "xihakelo", ss: "kutsengiswa",
    ve: "u rengisa", nr: "ukuthengisa",
  },
  avg: {
    en: "avg", af: "gem", zu: "okumaphakathi", xh: "umndilili",
    st: "karollano", nso: "magareng", tn: "magareng", ts: "avhareji",
    ss: "emkhatsini", ve: "vhukati", nr: "umlingana",
  },
  show_my_qr: {
    en: "Show my QR",
    af: "Wys my QR",
    zu: "Bonisa i-QR yami",
    xh: "Bonisa i-QR yam",
    st: "Bontša QR ya ka",
    nso: "Bontšha QR ya ka",
    tn: "Bontsha QR ya me",
    ts: "Komba QR ya mina",
    ss: "Khombisa i-QR yami",
    ve: "Sumbedza QR yanga",
    nr: "Tjengisa i-QR yami",
  },
  payouts: {
    en: "Payouts", af: "Uitbetalings", zu: "Iimali",
    xh: "Iintlawulo", st: "Ditefo", nso: "Ditefo",
    tn: "Ditefo", ts: "Tihakelo", ss: "Tinkhokhelo",
    ve: "Malipfo", nr: "Iimbadalo",
  },
  last_7_days: {
    en: "Last 7 days",
    af: "Laaste 7 dae",
    zu: "Izinsuku ezi-7 ezidlule",
    xh: "Iintsuku ezi-7 ezidlulileyo",
    st: "Matsatsi a 7 a fetileng",
    nso: "Matšatši a 7 a fetilego",
    tn: "Malatsi a 7 a a fetileng",
    ts: "Masiku ya 7 lama hundzeke",
    ss: "Emalanga ekugcina la-7",
    ve: "Maduvha a 7 o fhelaho",
    nr: "Iinsuku ezi-7 ezidlulileko",
  },
  total: {
    en: "Total", af: "Totaal", zu: "Isamba", xh: "Iyonke",
    st: "Kakaretso", nso: "Palomoka", tn: "Palogotlhe", ts: "Ntsena",
    ss: "Sesiphelele", ve: "Vhudalo", nr: "Isamba",
  },
  recent_sales: {
    en: "Recent sales",
    af: "Onlangse verkope",
    zu: "Ukudayisa kwamanje",
    xh: "Iintengiso zangoku",
    st: "Dithekiso tsa morao tjena",
    nso: "Dithekišo tša morago",
    tn: "Dithekiso tsa bosheng",
    ts: "Mahakelo ya sweswinyana",
    ss: "Kutsengiswa kwakamuva",
    ve: "U rengisa ha zwenezwino",
    nr: "Ukuthengisa kwanje",
  },
  see_all: {
    en: "See all", af: "Sien alles", zu: "Buka konke", xh: "Bona konke",
    st: "Bona tsohle", nso: "Bona tšohle", tn: "Bona tsotlhe", ts: "Vona hinkwaswo",
    ss: "Buka konkhe", ve: "Vhona zwothe", nr: "Bona koke",
  },
  fee_rate: {
    en: "Fee rate",
    af: "Fooitarief",
    zu: "Imali yesevisi",
    xh: "Umrhumo wenkonzo",
    st: "Lekeno la tefo",
    nso: "Tefelo ya tirelo",
    tn: "Tuelo ya tirelo",
    ts: "Xitsalwana xa ntirho",
    ss: "Inzalo yemali",
    ve: "Mbadelo ya tshumelo",
    nr: "Umrholo wemsebenzi",
  },
  verified: {
    en: "Verified", af: "Geverifieer", zu: "Kuqinisekisiwe",
    xh: "Kuqinisekisiwe", st: "E netefaditswe", nso: "E kgonthišiša",
    tn: "Go netefaditswe", ts: "Swi tiyisekile", ss: "Kucinisekisiwe",
    ve: "Zwo khwathisedzwa", nr: "Kuqinisekisiwe",
  },
  verified_yes: {
    en: "Yes ✓", af: "Ja ✓", zu: "Yebo ✓", xh: "Ewe ✓",
    st: "E ✓", nso: "Ee ✓", tn: "Ee ✓", ts: "Ina ✓",
    ss: "Yebo ✓", ve: "Ee ✓", nr: "Iye ✓",
  },
  verified_pending: {
    en: "Pending", af: "Hangende", zu: "Kulindile", xh: "Kulindile",
    st: "Ho emetswe", nso: "Go emetše", tn: "Go letetswe", ts: "Ku yimeriwe",
    ss: "Kumelwe", ve: "Zwi kho lindela", nr: "Kulindwe",
  },

  // ---- Status pills ----
  status_paid: {
    en: "Paid", af: "Betaal", zu: "Kukhokhelwe", xh: "Kuhlawulwe",
    st: "Ho lefilwe", nso: "Go lefilwe", tn: "Go duetswe", ts: "Ku hakeriwe",
    ss: "Kukhokhiwe", ve: "Zwo badelwa", nr: "Kukhokhelwe",
  },
  status_pending: {
    en: "Pending", af: "Hangende", zu: "Kulindile", xh: "Kulindile",
    st: "Ho emetswe", nso: "Go emetše", tn: "Go letetswe", ts: "Ku yimeriwe",
    ss: "Kumelwe", ve: "Zwi kho lindela", nr: "Kulindwe",
  },
  status_refunded: {
    en: "Refunded", af: "Terugbetaal", zu: "Kubuyiselwe",
    xh: "Kubuyiselwe", st: "Ho khutlisitswe", nso: "Go bušeditšwe",
    tn: "Go busitswe", ts: "Ku tlheriseriwe", ss: "Kubuyiselwe",
    ve: "Zwo vhuyiswa", nr: "Kubuyiselwe",
  },

  // ---- Login ----
  welcome_back: {
    en: "Welcome back",
    af: "Welkom terug",
    zu: "Siyakwamukela futhi",
    xh: "Wamkelekile kwakhona",
    st: "Rea u amohela",
    nso: "Re a go amogela",
    tn: "Re a go amogela gape",
    ts: "Ha ku amukela",
    ss: "Siyakwemukela futsi",
    ve: "Ri a vhuya ri ni tanganedza",
    nr: "Siyakwamukela godu",
  },
  sign_in_desc: {
    en: "Sign in to your Flamingo merchant account",
    af: "Teken in op jou Flamingo handelaarsrekening",
    zu: "Ngena ku-akhawunti yakho yomthengisi we-Flamingo",
    xh: "Ngena kwiakhawunti yakho yomrhwebi we-Flamingo",
    st: "Kena akhaonteng ya hao ya morekisi wa Flamingo",
    nso: "Tsena akhaonteng ya gago ya morekiši wa Flamingo",
    tn: "Tsena mo akhaontong ya gago ya morekisi wa Flamingo",
    ts: "Nghena eka akhawunti ya wena ya muxavisi wa Flamingo",
    ss: "Ngena ku-akhawunti yakho yemtsengisi weFlamingo",
    ve: "Dzhena akhanoni yau ya murengisi wa Flamingo",
    nr: "Ngena ku-akhawunti yakho yomthengisi weFlamingo",
  },
  phone_number: {
    en: "Phone number",
    af: "Foonnommer",
    zu: "Inombolo yefoni",
    xh: "Inombolo yefowuni",
    st: "Nomoro ya mohala",
    nso: "Nomoro ya mogala",
    tn: "Nomoro ya mogala",
    ts: "Nomboro ya riqingho",
    ss: "Inombolo yelucingo",
    ve: "Nomboro ya luṱingothendeleki",
    nr: "Inomboro yefowuni",
  },
  four_digit_pin: {
    en: "4-digit PIN",
    af: "4-syfer PIN",
    zu: "I-PIN yezinombolo ezi-4",
    xh: "I-PIN yeenombolo ezi-4",
    st: "PIN ya dinomoro tse 4",
    nso: "PIN ya dinomoro tše 4",
    tn: "PIN ya dinomoro tse 4",
    ts: "PIN ya tinomboro ta 4",
    ss: "PIN yetinombolo letine",
    ve: "PIN ya tshigidi ṋa",
    nr: "I-PIN yeenomboro ezi-4",
  },
  sign_in: {
    en: "Sign in", af: "Teken in", zu: "Ngena", xh: "Ngena",
    st: "Kena", nso: "Tsena", tn: "Tsena", ts: "Nghena",
    ss: "Ngena", ve: "Dzhena", nr: "Ngena",
  },
  signing_in: {
    en: "Signing in…", af: "Besig om in te teken…", zu: "Iyangena…",
    xh: "Iyangena…", st: "E kena…", nso: "E tsena…",
    tn: "Go tsena…", ts: "Ku nghena…", ss: "Iyangena…",
    ve: "Zwi khou dzhena…", nr: "Iyangena…",
  },

  // ---- Profile ----
  business_account: {
    en: "Business & account",
    af: "Besigheid & rekening",
    zu: "Ibhizinisi ne-akhawunti",
    xh: "Ishishini ne-akhawunti",
    st: "Khwebo le akhaonte",
    nso: "Kgwebo le akhaonte",
    tn: "Kgwebo le akhaonte",
    ts: "Bindzu na akhawunti",
    ss: "Libhizinisi ne-akhawunti",
    ve: "Mveledziso na akhanoni",
    nr: "Ibhizinisi ne-akhawunti",
  },
  language: {
    en: "Language", af: "Taal", zu: "Ulimi", xh: "Ulwimi",
    st: "Puo", nso: "Polelo", tn: "Puo", ts: "Ririmi",
    ss: "Lulwimi", ve: "Luambo", nr: "Ilimi",
  },
  language_desc: {
    en: "Change your app language",
    af: "Verander jou programtaal",
    zu: "Shintsha ulimi lohlelo lokusebenza",
    xh: "Tshintsha ulwimi lwe-app yakho",
    st: "Fetola puo ya sesebediswa sa hao",
    nso: "Fetola polelo ya sediriswa sa gago",
    tn: "Fetola puo ya sediriswa sa gago",
    ts: "Cinca ririmi ra app ya wena",
    ss: "Guculisa lulwimi lwe-app yakho",
    ve: "Shandukisa luambo lwa app yau",
    nr: "Tjhentjha ilimi le-app yakho",
  },
  sign_out: {
    en: "Sign out", af: "Teken uit", zu: "Phuma",
    xh: "Phuma", st: "Tswa", nso: "Tšwa",
    tn: "Tswa", ts: "Huma", ss: "Phuma",
    ve: "Buda", nr: "Phuma",
  },
  cancel: {
    en: "Cancel", af: "Kanselleer", zu: "Khansela",
    xh: "Rhoxisa", st: "Hlakola", nso: "Khansela",
    tn: "Khansela", ts: "Tshikisa", ss: "Khansela",
    ve: "Khansela", nr: "Rhoxisa",
  },
};

type Ctx = {
  lang: LangCode;
  t: (key: string) => string;
  setLang: (code: LangCode) => void;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    const stored = localStorage.getItem("flamingo_lang") as LangCode | null;
    if (stored && LANGUAGES.some(l => l.code === stored)) {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((code: LangCode) => {
    localStorage.setItem("flamingo_lang", code);
    setLangState(code);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = D[key];
      if (!entry) return key;
      return entry[lang] ?? entry.en ?? key;
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  // Safe fallback so components used outside the provider still render.
  if (!ctx) {
    return {
      lang: "en",
      t: (k: string) => D[k]?.en ?? k,
      setLang: () => {},
    };
  }
  return ctx;
}
