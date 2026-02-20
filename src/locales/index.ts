import en from "./en";
import ko from "./ko";

export type Locale = "en" | "ko";

// Use a recursive DeepStringify to widen literal string types to string
type DeepStringify<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type Dictionary = DeepStringify<typeof en>;

export const dictionaries: Record<Locale, Dictionary> = { en, ko };
