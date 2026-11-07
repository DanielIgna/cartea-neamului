/** Forma unui catalog în altă limbă: aceleași chei ca în română, cu orice text. */
export type Widen<T> = { -readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
/** Doar ce diferă (engleza americană peste cea britanică). */
export type DeepPartial<T> = { [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]> };
