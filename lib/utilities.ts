/** Converts 'readonly' attributes from a shape into mutable properties
 * TODO: maybe move this to utils lib
 * @internal */
type DeRead<Src extends any> = {
  -readonly [Key in keyof Src]: Src[Key] extends readonly any[]
    ? [...Src[Key]]
    : Src[Key] extends Record<any, any>
    ? DeRead<Src[Key]>
    : Src[Key];
} & {};

/** Expands an object's type for intellisense friendlieness
 *  TODO: maybe move this to utils lib
 * @internal */
type Expand<Source extends object> = { [Key in keyof Source]: Source[Key] } & {};

export type { DeRead, Expand };
