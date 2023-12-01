/** Expands an object's type for intellisense friendlieness
 *  TODO: maybe move this to utils lib
 * @internal */
type Expand<Source extends object> = { [Key in keyof Source]: Source[Key] } & {};

export type { Expand };
