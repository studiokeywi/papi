/** Identifier for the shape of data for an HTTP method that accepts uploaded data */
const $body = Symbol.for('body');
/** Identifier for an HTTP DELETE endpoint */
const $DELETE = Symbol.for('DELETE');
/** Identifier for the shape of an error response from an API request */
const $error = Symbol.for('error');
/** Identifier for an HTTP GET endpoint */
const $GET = Symbol.for('GET');
/** Identifier for an HTTP PATCH endpoint */
const $PATCH = Symbol.for('PATCH');
/** Identifier for an HTTP POST endpoint */
const $POST = Symbol.for('POST');
/** Identifier for an HTTP PUT endpoint */
const $PUT = Symbol.for('PUT');
/** Identifier for the shape of query parameters */
const $query = Symbol.for('query');
/** Identifier for the shape of a sluggable path/endpoint */
const $slug = Symbol.for('slug');
/** Valid HTTP endpoint identifiers */

const httpMethods = [$DELETE, $GET, $PATCH, $POST, $PUT] as const;
/** Valid "magic keys" for API shape -> PAPI conversion */
const magicKeys = [$body, $error, $query, $slug] as const;

/** Identifier type for the shape of data for an HTTP method that accepts uploaded data */
type $Body = typeof $body;
/** Identifier type for an HTTP DELETE endpoint */
type $Delete = typeof $DELETE;
/** Identifier type for the shape of an error response from an API request */
type $Error = typeof $error;
/** Identifier type for an HTTP GET endpoint */
type $Get = typeof $GET;
/** Identifier type for an HTTP PATCH endpoint */
type $Patch = typeof $PATCH;
/** Identifier type for an HTTP POST endpoint */
type $Post = typeof $POST;
/** Identifier type for an HTTP PUT endpoint */
type $Put = typeof $PUT;
/** Identifier type for the shape of query parameters */
type $Query = typeof $query;
/** Identifier type for the shape of a sluggable path/endpoint */
type $Slug = typeof $slug;

/** Valid HTTP methods identifier types */
type HTTPMethods = (typeof httpMethods)[number];
/** Valid "magic keys" identifier types for API shape -> PAPI conversion */
type MagicKeys = (typeof magicKeys)[number];

export { $DELETE, $GET, $PATCH, $POST, $PUT, $body, $error, $query, $slug, httpMethods, magicKeys };
export type { $Body, $Delete, $Error, $Get, $Patch, $Post, $Put, $Query, $Slug, HTTPMethods, MagicKeys };
