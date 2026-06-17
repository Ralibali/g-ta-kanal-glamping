export type CleanLang = "sv" | "en" | "si";

export const CLEAN_LANGS: { code: CleanLang; label: string }[] = [
  { code: "sv", label: "Svenska" },
  { code: "en", label: "English" },
  { code: "si", label: "සිංහල" },
];

export const UI = {
  appTitle: { sv: "Städning – Bergs Slussar", en: "Cleaning – Bergs Slussar", si: "පිරිසිදු කිරීම – Bergs Slussar" },
  intro: {
    sv: "Gästerna betalar mycket för att bo hos oss – det ska vara ordning och reda.",
    en: "Our guests pay a lot to stay with us – everything must be neat and tidy.",
    si: "අපගේ ආගන්තුකයන් මෙහි නැවතීමට බොහෝ ගෙවති – සියල්ල පිළිවෙළට හා පිරිසිදුව තිබිය යුතුය.",
  },
  date: { sv: "Datum", en: "Date", si: "දිනය" },
  today: { sv: "Idag", en: "Today", si: "අද" },
  tomorrow: { sv: "Imorgon", en: "Tomorrow", si: "හෙට" },
  tentsToHandle: { sv: "tält att hantera", en: "tents to handle", si: "හසුරුවාලීමට කූඩාරම්" },
  noTentsToday: { sv: "Inga tält att städa det här datumet.", en: "No tents to clean on this date.", si: "මෙම දිනට පිරිසිදු කිරීමට කූඩාරම් නැත." },
  changeover: { sv: "Växling – klart innan incheckning", en: "Turnover – ready before check-in", si: "මාරු කිරීම – පැමිණීමට පෙර සූදානම්" },
  departure: { sv: "Avresa", en: "Departure", si: "පිටවීම" },
  arrivalOnly: { sv: "Endast ankomst", en: "Arrival only", si: "පැමිණීම පමණි" },
  lateCheckout: { sv: "Sen utcheckning", en: "Late check-out", si: "ප්‍රමාද පිටවීම" },
  sofaBed: { sv: "Bäddsoffa behövs", en: "Sofa bed needed", si: "සෝෆා-ඇඳ අවශ්‍යයි" },
  guests: { sv: "Gäster", en: "Guests", si: "ආගන්තුකයන්" },
  children: { sv: "Barn", en: "Children", si: "ළමයින්" },
  breakfast: { sv: "Frukost", en: "Breakfast", si: "උදෑසන ආහාරය" },
  fika: { sv: "Fikapåse", en: "Fika bag", si: "ෆිකා බෑගය" },
  notStarted: { sv: "Ej påbörjad", en: "Not started", si: "ආරම්භ නොකළ" },
  inProgress: { sv: "Pågår", en: "In progress", si: "ක්‍රියාත්මකයි" },
  done: { sv: "Klar", en: "Done", si: "අවසන්" },
  progress: { sv: "Klar", en: "Done", si: "අවසන්" },
  markComplete: { sv: "Markera tältet klart", en: "Mark tent as complete", si: "කූඩාරම අවසන් ලෙස සලකුණු කරන්න" },
  confirmTitle: { sv: "Markera klart?", en: "Mark as complete?", si: "අවසන් ලෙස සලකුණු කරන්නද?" },
  confirmBodyWithArrival: {
    sv: "Tältet markeras klart och ett SMS skickas till gästen som checkar in idag.",
    en: "The tent will be marked complete and an SMS sent to today's arriving guest.",
    si: "කූඩාරම අවසන් ලෙස සලකුණු කර, අද පැමිණෙන ආගන්තුකයාට SMS එකක් යවනු ලැබේ.",
  },
  confirmBodyNoArrival: {
    sv: "Tältet markeras klart. Ingen ankomst idag – inget SMS skickas.",
    en: "The tent will be marked complete. No arrival today – no SMS will be sent.",
    si: "කූඩාරම අවසන් ලෙස සලකුණු වේ. අද පැමිණීමක් නැත – SMS නොයවයි.",
  },
  cancel: { sv: "Avbryt", en: "Cancel", si: "අවලංගු කරන්න" },
  confirm: { sv: "Bekräfta", en: "Confirm", si: "තහවුරු කරන්න" },
  undo: { sv: "Ångra", en: "Undo", si: "අහෝසි කරන්න" },
  issuesTitle: { sv: "Något trasigt, saknas eller fel?", en: "Anything broken, missing or wrong?", si: "කිසියමක් කැඩී, අතුරුදන් හෝ වැරදිද?" },
  addIssue: { sv: "Lägg till fel", en: "Add issue", si: "දෝෂයක් එක් කරන්න" },
  issueDescPlaceholder: { sv: "Beskriv vad som är fel...", en: "Describe the issue...", si: "ගැටලුව විස්තර කරන්න..." },
  takePhoto: { sv: "Ta foto", en: "Take photo", si: "ඡායාරූපයක් ගන්න" },
  save: { sv: "Spara", en: "Save", si: "සුරකින්න" },
  back: { sv: "Tillbaka", en: "Back", si: "ආපසු" },
  signOut: { sv: "Logga ut", en: "Sign out", si: "පිටවීම" },
  loginTitle: { sv: "Logga in (städning)", en: "Sign in (cleaning)", si: "පුරනය වන්න (පිරිසිදු කිරීම)" },
  email: { sv: "E-post", en: "Email", si: "විද්‍යුත් තැපෑල" },
  password: { sv: "Lösenord", en: "Password", si: "මුරපදය" },
  signIn: { sv: "Logga in", en: "Sign in", si: "පුරනය වන්න" },
  loginFailed: { sv: "Inloggning misslyckades", en: "Sign-in failed", si: "පුරනය අසාර්ථකයි" },
  noAccess: { sv: "Du har inte städar-behörighet.", en: "You don't have cleaner access.", si: "ඔබට පිරිසිදු කිරීමේ අවසරය නැත." },
  language: { sv: "Språk", en: "Language", si: "භාෂාව" },
  saving: { sv: "Sparar...", en: "Saving...", si: "සුරකිමින්..." },
  completedAt: { sv: "Klart", en: "Completed", si: "අවසන්" },
} as const;

export function tr<K extends keyof typeof UI>(lang: CleanLang, key: K): string {
  return UI[key][lang];
}

const LS_KEY = "cleaning_lang";
export function getStoredLang(): CleanLang {
  if (typeof localStorage === "undefined") return "en";
  const v = localStorage.getItem(LS_KEY) as CleanLang | null;
  return v && ["sv", "en", "si"].includes(v) ? v : "en";
}
export function setStoredLang(l: CleanLang) {
  try { localStorage.setItem(LS_KEY, l); } catch { /* ignore */ }
}
