import { en } from "./en";
import { fr } from "./fr";
import { es } from "./es";

export type Language = "en" | "fr" | "es";
export type Key = keyof typeof en;
export type Translations = { readonly [K in Key]: string };

const tables: Record<Language, Translations> = { en, fr, es };

export function t(lang: Language, key: Key): string {
  return tables[lang][key] ?? tables.en[key] ?? String(key);
}
