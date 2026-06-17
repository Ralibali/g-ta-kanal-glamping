import type { LucideIcon } from "lucide-react";
import {
  Wind, Sparkles, Droplets, Bed, Sofa, Coffee, Milk, ShoppingBasket,
  Trash2, TreePine, Flame, Fan, Thermometer, ClipboardCheck, Search,
  CookingPot, Heater, Brush, ShowerHead,
} from "lucide-react";

export type TaskCondition =
  | "sofa"
  | "season_warm"
  | "season_cold"
  | "breakfast"
  | "fikapase";

export type TaskGroup =
  | "cleaning"
  | "beds"
  | "kitchen"
  | "trash"
  | "outdoor"
  | "climate";

export interface Task {
  id: string;
  group: TaskGroup;
  icon: LucideIcon;
  required: boolean;
  condition?: TaskCondition;
  text: { sv: string; en: string; si: string };
}

export const CLEANING_TASKS: Task[] = [
  // Städning
  { id: "damm_suga", group: "cleaning", icon: Wind, required: true, text: {
    sv: "Dammsug ordentligt, även bakom säng/bäddsoffa",
    en: "Vacuum thoroughly, also behind the bed/sofa bed",
    si: "හොඳින් වැකියම් කරන්න, ඇඳ/සෝෆා-ඇඳ පිටුපසත්",
  }},
  { id: "skaka_mattor", group: "cleaning", icon: Brush, required: true, text: {
    sv: "Skaka mattorna",
    en: "Shake out the rugs",
    si: "පලස් ගසා දූලි ඉවත් කරන්න",
  }},
  { id: "dammtorka", group: "cleaning", icon: Sparkles, required: true, text: {
    sv: "Dammtorka ytor",
    en: "Dust all surfaces",
    si: "සියලුම මතුපිට දූවිලි පිස දමන්න",
  }},
  { id: "vattorka_golv", group: "cleaning", icon: Droplets, required: true, text: {
    sv: "Våttorka golvet",
    en: "Wet-mop the floor",
    si: "තට්ටුව තෙත් රෙද්දෙන් පිස දමන්න",
  }},
  { id: "vattorka_ytor", group: "cleaning", icon: ShowerHead, required: true, text: {
    sv: "Våttorka bänk, kylskåp och övriga ytor där det behövs",
    en: "Wet-wipe counter, fridge and other surfaces where needed",
    si: "කවුන්ටරය, ශීතකරණය සහ අවශ්‍ය අනෙකුත් මතුපිට තෙත් රෙද්දෙන් පිස දමන්න",
  }},
  // Sängar
  { id: "baddning_huvudsang", group: "beds", icon: Bed, required: true, text: {
    sv: "Byt sängkläder i huvudsängen",
    en: "Change the linens on the main bed",
    si: "ප්‍රධාන ඇඳේ ඇඳ ඇතිරිලි මාරු කරන්න",
  }},
  { id: "baddsoffa", group: "beds", icon: Sofa, required: true, condition: "sofa", text: {
    sv: "Bädda bäddsoffan: 2 kuddar, 180-lakan och 2 täcken (ligger i vänstra skåpet)",
    en: "Make up the sofa bed: 2 pillows, 180 sheet and 2 duvets (in the left cupboard)",
    si: "සෝෆා-ඇඳ සකසන්න: කොට්ට 2, 180 ඇතිරිල්ල සහ රෙදි 2 (වම් අල්මාරියේ)",
  }},
  { id: "handdukar", group: "beds", icon: ShowerHead, required: true, text: {
    sv: "Lägg fram rena handdukar efter antal gäster",
    en: "Lay out clean towels according to the number of guests",
    si: "ආගන්තුකයන් සංඛ්‍යාවට අනුව පිරිසිදු තුවා තබන්න",
  }},
  // Kök
  { id: "diska", group: "kitchen", icon: CookingPot, required: true, text: {
    sv: "Diska (i servicehuset) – skriv en kommentar om du behövt diska och hur mycket",
    en: "Wash dishes (in the service house) – add a comment if you had to wash and how much",
    si: "භාජන සෝදන්න (සේවා ගෘහයේ) – සෝදන්න සිදුවුවහොත් කොපමණ දැයි අදහසක් ලියන්න",
  }},
  { id: "kaffe_socker", group: "kitchen", icon: Coffee, required: true, text: {
    sv: "Kontrollera kaffe och socker – fyll på från förrådet om det är slut",
    en: "Check coffee and sugar – refill from storage if empty",
    si: "කෝපි සහ සීනි පරීක්ෂා කරන්න – හිස්නම් ගබඩාවෙන් පුරවන්න",
  }},
  { id: "te_salt", group: "kitchen", icon: ShoppingBasket, required: true, text: {
    sv: "Kontrollera te, salt/peppar, diskmedel och disksvamp",
    en: "Check tea, salt/pepper, dish soap and sponge",
    si: "තේ, ලුණු/ගම්මිරිස්, භාජන සබන් සහ ස්පොන්ජය පරීක්ෂා කරන්න",
  }},
  { id: "kyl_vatten_mjolk", group: "kitchen", icon: Milk, required: true, text: {
    sv: "Ställ in i kylen: 1 vatten + 3 mjölk",
    en: "Stock the fridge: 1 water + 3 milk",
    si: "ශීතකරණයේ තබන්න: ජලය 1 + කිරි 3",
  }},
  { id: "vattenkokare", group: "kitchen", icon: CookingPot, required: true, text: {
    sv: "Ställ tillbaka vattenkokaren i skåpet",
    en: "Put the kettle back in the cupboard",
    si: "ජල කේතලය යළිත් අල්මාරියේ තබන්න",
  }},
  { id: "fikapase", group: "kitchen", icon: ShoppingBasket, required: false, condition: "fikapase", text: {
    sv: "Fikapåse bokad – lägg fram fikapåsen",
    en: "Fika bag booked – set out the fika bag",
    si: "ෆිකා බෑගය වෙන් කර ඇත – එය බෑගය තබන්න",
  }},
  // Sopor
  { id: "tomma_sopor", group: "trash", icon: Trash2, required: true, text: {
    sv: "Töm tältets sopor i den högra papperskorgen; ny påse + extra påsar i botten",
    en: "Empty the tent's trash into the right bin; new liner + spare liners underneath",
    si: "කූඩාරමේ කසළ දකුණු බඳුනට හිස් කරන්න; නව බෑගයක් + අමතර බෑග් යටින් තබන්න",
  }},
  // Utomhus
  { id: "ute_ordning", group: "outdoor", icon: TreePine, required: true, text: {
    sv: "Ställ iordning utomhus – möbler och entré, snyggt och välkomnande",
    en: "Set up outside – furniture and entrance, tidy and welcoming",
    si: "පිටත සකසන්න – ගෘහ භාණ්ඩ සහ ප්‍රවේශය පිළිවෙළට හා පිළිගැනීමට සුදුසු ලෙස",
  }},
  { id: "sopa_altan", group: "outdoor", icon: Brush, required: true, text: {
    sv: "Sopa altanen/entrén",
    en: "Sweep the deck/entrance",
    si: "තට්ටුව/ප්‍රවේශය අතුගා දමන්න",
  }},
  // Klimat & avslut
  { id: "flakt", group: "climate", icon: Fan, required: true, condition: "season_warm", text: {
    sv: "Sätt fläkten på Max",
    en: "Set the fan to Max",
    si: "පංකාව උපරිමයට සකසන්න",
  }},
  { id: "varme_vinter", group: "climate", icon: Heater, required: true, condition: "season_cold", text: {
    sv: "Ställ in värmen på en behaglig temperatur",
    en: "Set the heating to a comfortable temperature",
    si: "තාපය සුවපහසු උෂ්ණත්වයකට සකසන්න",
  }},
  { id: "glomda_saker", group: "climate", icon: Search, required: false, text: {
    sv: "Kolla efter kvarglömda saker och logga ev. hittegods",
    en: "Check for forgotten items and log any lost & found",
    si: "අමතක වූ දේවල් සොයා බලා සොයාගත් භාණ්ඩ සටහන් කරන්න",
  }},
  { id: "slutkoll", group: "climate", icon: ClipboardCheck, required: true, text: {
    sv: "Slutkoll: helhetsintryck, doft och att allt är på plats",
    en: "Final check: overall impression, smell, everything in place",
    si: "අවසන් පරීක්ෂාව: සමස්ත හැඟීම, සුවඳ සහ සියල්ල ස්ථානයේ ඇති බව",
  }},
];

export const GROUP_LABELS: Record<TaskGroup, { sv: string; en: string; si: string }> = {
  cleaning: { sv: "Städning", en: "Cleaning", si: "පිරිසිදු කිරීම" },
  beds: { sv: "Sängar & textil", en: "Beds & linens", si: "ඇඳන් සහ රෙදිපිළි" },
  kitchen: { sv: "Kök & förbrukning", en: "Kitchen & supplies", si: "කුස්සිය හා සැපයුම්" },
  trash: { sv: "Sopor", en: "Trash", si: "කසළ" },
  outdoor: { sv: "Utomhus", en: "Outdoor", si: "පිටත" },
  climate: { sv: "Klimat & avslut", en: "Climate & final", si: "දේශගුණය සහ අවසානය" },
};

export function shouldShowTask(
  task: Task,
  ctx: { sofa: boolean; winter: boolean; breakfast: boolean; fikapase: boolean },
): boolean {
  if (!task.condition) return true;
  switch (task.condition) {
    case "sofa": return ctx.sofa;
    case "season_warm": return !ctx.winter;
    case "season_cold": return ctx.winter;
    case "breakfast": return ctx.breakfast;
    case "fikapase": return ctx.fikapase;
  }
}
