import type { PAPIConfig, PAPITool, TAPIConfig } from './papi.d.ts';
import { buildPAPI, buildTAPI } from './papi.js';
import type { $Delete, $Get, $Patch, $Post, $Put, $Query, HTTPMethods, MagicKeys } from './symbols.d.ts';
import { $body, $error, $query, $slug } from './symbols.js';
import type { Expand } from './utilities.d.ts';

/**
 * Util function to provide the {@link Pair} type
 * @internal */
const pair = <Key extends string | symbol, Value>(key: Key, value?: Value) => <Pair<Key, Value>>{ [key]: value };

/**
 * Chainable builder to define an input shape to be converted into a {@link PAPITool} tool
 * @property {BuilderRoot} Root */
class PAPIBuilder<Root extends BuilderRoot = {}> {
  /** Create a new PAPIBuilder
   * @param {string} baseURL
   * @param {BuilderConfig<Root>} [config] */
  constructor(baseURL: string, { rootObj = <Root>{} }: BuilderConfig<Root> = {}) {
    this.#baseURL = baseURL;
    this.#rootObj = rootObj;
  }

  /** API base URL to pass to {@link PAPIBuilder.build} */
  #baseURL: string;
  /** Shape of the {@link PAPIBuilder} */
  #rootObj: Root;

  /** Update the shape of the builder with a new key/value pair
   * @param key
   * @param value  */
  #set<Key extends BuilderKeys, Value extends unknown>(key: Key, value: Value) {
    const rootObj: Expand<Root & Pair<Key, Value>> = { ...this.#rootObj, ...pair(key, value) };
    return new PAPIBuilder(this.#baseURL, { rootObj });
  }

  /** Adds information about a body that can be passed in a request to a given endpoint
   * @param value */
  body<Body extends EndpointData>(value: Body) {
    return this.#set($body, value);
  }
  /**
   * Create a new {@link PAPITool} tool
   *
   * PAPI tools provide a natural chainable syntax for accessing API endpoints
   * @param config Optional configuration */
  build(cfg: PAPIConfig | TAPIConfig = {}) {
    return 'life' in cfg
      ? buildTAPI(this.#baseURL, this.#rootObj, <TAPIConfig>cfg)
      : buildPAPI(this.#baseURL, this.#rootObj, <PAPIConfig>cfg);
  }
  /** Adds information about the response shape from an HTTP DELETE request
   * @param method
   * @param endpoint */
  endpoint<Endpoint extends EndpointData>(
    method: $Delete,
    endpoint: Endpoint
  ): PAPIBuilder<Expand<Root & Pair<$Delete, Endpoint>>>;
  /** Adds information about the response shape from an HTTP GET request
   * @param method
   * @param endpoint */
  endpoint<Endpoint extends EndpointData>(
    method: $Get,
    endpoint: Endpoint
  ): PAPIBuilder<Expand<Root & Pair<$Get, Endpoint>>>;
  /** Adds information about the response shape from an HTTP PATCH request
   * @param method
   * @param endpoint */
  endpoint<Endpoint extends EndpointData>(
    method: $Patch,
    endpoint: Endpoint
  ): PAPIBuilder<Expand<Root & Pair<$Patch, Endpoint>>>;
  /** Adds information about the response shape from an HTTP POST request
   * @param method
   * @param endpoint */
  endpoint<Endpoint extends EndpointData>(
    method: $Post,
    endpoint: Endpoint
  ): PAPIBuilder<Expand<Root & Pair<$Post, Endpoint>>>;
  /** Adds information about the response shape from an HTTP PUT request
   * @param method
   * @param endpoint */
  endpoint<Endpoint extends EndpointData>(
    method: $Put,
    endpoint: Endpoint
  ): PAPIBuilder<Expand<Root & Pair<$Put, Endpoint>>>;
  /**  Adds information about the response shape from a given HTTP request
   * @param method
   * @param endpoint */
  endpoint<Method extends HTTPMethods, Endpoint extends EndpointData>(method: Method, endpoint: Endpoint) {
    return this.#set(method, endpoint);
  }
  /** Adds information about the shape of an error response from a given endpoint
   * @param error */
  error<Err extends EndpointData>(error: Err) {
    return this.#set($error, error);
  }
  /** Adds information about a new path of the API
   * @param name
   * @param builder */
  path<Key extends BuilderKeys, BuildFn extends BuilderFunction>(name: Key, builder: BuildFn) {
    return this.#set(name, PAPIBuilder.#shape(builder));
  }
  /** Adds information about available query parameters for an API endpoint
   * @param query */
  query<Params extends QueryParameters>(query: Params): PAPIBuilder<Expand<Root & Pair<$Query, Params>>>;
  /**
   * Adds information about available query parameters for an API endpoint. An optional {@link BuilderFunction} can be provided
   * to add information about the endpoint's response if different when using query parameters
   * @param query
   * @param builder */
  query<Params extends QueryParameters, BuildFn extends BuilderFunction<Params>>(
    query: Params,
    builder: BuildFn
  ): PAPIBuilder<Expand<Root & Pair<$Query, BuilderReturn<BuildFn>>>>;
  /**
   * Adds information about available query parameters for an API endpoint. An optional {@link BuilderFunction} can be provided
   * to add information about the endpoint's response if different when using query parameters
   * @param query
   * @param builder */
  query<Params extends QueryParameters, BuildFn extends BuilderFunction<Params>>(query: Params, builder?: BuildFn) {
    return this.#set($query, !builder ? query : PAPIBuilder.#shape(builder, query));
  }
  /** Adds information about a slug portion of an API path. Slugs typically are represented as a portion of a path where you
   * can provide user values in the request, such as `users/:userId` or `blogs/[blog]`
   * @param builder */
  slug<BuildFn extends BuilderFunction>(builder: BuildFn) {
    return this.#set($slug, PAPIBuilder.#shape(builder));
  }

  /**
   * Expose the inner shape of a {@link PAPIBuilder}
   * @param builder */
  static #shape<Build extends PAPIBuilder>(builder: Build): Build extends PAPIBuilder<infer Root> ? Root : never;
  /**
   * Expose the inner shape of a {@link BuilderFunction}
   * @param builder
   * @param rootObj */
  static #shape<Input extends BuilderRoot, BuildFn extends BuilderFunction<Input>>(
    builder: BuildFn,
    rootObj?: Input
  ): BuildFn extends BuilderFunction<Input, infer Out> ? Out : never;
  /**
   * Expose the inner shape of a {@link PAPIBuilder} or {@link BuilderFunction}
   * @param builder
   * @param rootObj */
  static #shape<Build extends PAPIBuilder | BuilderFunction>(builder: Build, rootObj: BuilderRoot = {}) {
    if (typeof builder !== 'function') return builder.#rootObj;
    return builder(new PAPIBuilder('', { rootObj })).#rootObj;
  }
}

/**
 * Configuration for a {@link PAPIBuilder}
 * @property {BuilderRoot} Root */
type BuilderConfig<Root extends BuilderRoot> = { /** Shape of the root input object */ rootObj?: Root };
/**
 * A function that takes in and returns an instance of a {@link PAPIBuilder}. Used for buiding subshapes
 * @property {BuilderRoot} [In = {}]
 * @property {BuilderRoot} [Out = {}]
 * @param {PAPIBuilder<In>} builder
 * @returns {PAPIBuilder<Out>} */
type BuilderFunction<In extends BuilderRoot = {}, Out extends BuilderRoot = {}> = (
  builder: PAPIBuilder<In>
) => PAPIBuilder<Out>;
/** Valid keys for a {@link BuilderRoot}. Keys may be strings, {@link MagicKeys}, and/or {@link HTTPMethods} */
type BuilderKeys = string | HTTPMethods | MagicKeys;
/**
 * The shape inferred as the {@link BuilderRoot} of the {@link PAPIBuilder} returned by a {@link BuilderFunction}
 * @property {BuildFunction} BuildFn */
type BuilderReturn<BuildFn extends BuilderFunction<any, any>> = ReturnType<BuildFn> extends PAPIBuilder<infer Root>
  ? Root
  : never;
/** Base shape for a {@link PAPIBuilder}. Used to define a {@link PAPITool} tool */
type BuilderRoot = Partial<Record<BuilderKeys, {}>>;
/** Response types from an API Endpoint */
type EndpointData = QueryParameter | Record<string | number, any>;
/** Converts a key and value into a <key, value> pair
 * @internal */
type Pair<Key extends string | symbol, Value> = { [key in Key]: Value };
/** Valid types to pass as {@link QueryParameters} values */
type QueryParameter = boolean | number | string | (boolean | number | string)[];
/** Definition of query parameters */
type QueryParameters = { [param: string]: QueryParameter };

export { PAPIBuilder };
export type {
  BuilderConfig,
  BuilderFunction,
  BuilderKeys,
  BuilderReturn,
  BuilderRoot,
  EndpointData,
  Pair,
  QueryParameter,
  QueryParameters,
};
