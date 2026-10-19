/** Langue de l'interface : Français par défaut, avec rétro-compatibilité des locales */
export type AppLocale = "fr" | "en" | "zh-CN";

export type TParams = Record<string, string | number | boolean | undefined>;

export type TFunction = (key: string, params?: TParams) => string;
