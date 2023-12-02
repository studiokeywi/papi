import type { BuilderRoot, EndpointData, PAPIBuilder, QueryParameters } from './builder.d.ts';
import type { $Body, $Error, $Query, $Slug, HTTPMethods } from './symbols.d.ts';
import { $DELETE, $GET, $PATCH, $POST, $PUT, $body, $error, $query, $slug, httpMethods } from './symbols.js';
import type { DeRead, Expand } from './utilities.d.ts';

/** Create a new PAPI tool
 * @param root Source builder object
 * @param config Optional configuration */
const buildPAPI = <Root extends BuilderRoot | PAPITool<{}>>(
  base: string,
  root: Root,
  cfg: PAPIConfig = {}
): PAPITool<Root> => {
  const auth = 'apiKey' in cfg ? { headers: { Authorization: `Bearer ${cfg.apiKey}` } } : {};
  const handleCurrentLevel = (cur: any, url: string) => {
    if ($slug in cur) return buildPAPI(url, Object.assign(caller(url, { ...auth }), Reflect.get(cur, $slug)));
    throw new Error("I don't know why this error occurred tbh");
  };
  const handleNextLevel = (target: any, url: string) => {
    const targetAvailable = target && typeof target === 'object';
    const next = {};
    if (targetAvailable && httpMethods.some($method => $method in target)) Object.assign(next, target);
    if (targetAvailable && $slug in target) Object.assign(next, target[$slug]);
    Object.assign(next, target);
    return buildPAPI(url, next);
  };
  return new Proxy<PAPITool<Root>>(<any>root, {
    get(cur, prop) {
      const target = Reflect.get(cur, prop);
      if (typeof prop === 'symbol') {
        const method = methodMaps[httpMethods.find($method => $method === prop)!];
        return method ? caller(base, { method, ...auth }) : target;
      }
      const url = `${base}/${prop}`;
      return target ? handleNextLevel(target, url) : handleCurrentLevel(cur, url);
    },
  });
};
/**
 * Create a Temporary {@link PAPITool}. Usage of the TAPI is identical to a {@link PAPITool} tool.
 *
 * Each interaction made through the tool will refresh it's lifetime by the provided duration (default 5 minutes)
 * @param root Source builder object
 * @param config Optional configuration */
const buildTAPI = <Root extends BuilderRoot>(
  url: string,
  root: Root,
  cfg: TAPIConfig = { life: 300_000 }
): PAPITool<Root> => {
  const { life } = cfg;
  const refreshTraps: ProxyHandler<PAPITool<Root>> = {
    apply: (target, thisArg, argArray) => (refreshTAPI(), Reflect.apply(<any>target, thisArg, argArray)),
  };
  const { proxy: tapi, revoke: revokeTAPI } = Proxy.revocable(buildPAPI(url, root, cfg), refreshTraps);
  const refreshTAPI = () => (clearTimeout(revokeTimeout), setTimeout(revokeTAPI, life));
  let revokeTimeout = setTimeout(revokeTAPI, life);
  return tapi;
};
/** {@link PAPICaller} definition */
const caller =
  <Src extends BuilderRoot>(url: string, init: Partial<PAPICallerConfig<Src>> = <PAPICallerConfig<Src>>{}) =>
  async (cfg: PAPICallerConfig<Src> = <PAPICallerConfig<Src>>{}) => {
    const query = Object.entries('query' in cfg ? cfg.query ?? {} : {})
      .map(param => param.join('='))
      .join('&');
    const body = 'data' in cfg ? { body: JSON.stringify(<EndpointData>cfg.data) } : {};
    const endpoint = `${url}${query ? `?${query}` : ''}`;
    const resp = await fetch(endpoint, { ...init, ...cfg, ...body });
    const parse = cfg.parse ?? 'json';
    const data = await resp[parse]();
    return data;
  };
/** Internal map to convert {@link HTTPMethods} to `fetch`-friendly HTTP `method` values */
const methodMaps = { [$DELETE]: 'DELETE', [$GET]: 'GET', [$PATCH]: 'PATCH', [$POST]: 'POST', [$PUT]: 'PUT' };

/** {@link BuilderRoot} shape that contains a {@link $Body} definition */
type BodyShape = { [$body]: EndpointData };
/** {@link BuilderRoot} shape that contains one or more {@link HTTPMethods} definition(s) */
type EndpointsShape = Partial<{ [Key in HTTPMethods]: EndpointData }>;
/** {@link BuilderRoot} shape that contains a {@link $Error} definition */
type ErrorShape = { [$error]: EndpointData };
/** Strips out only the {@link HTTPMethods} found in a given {@link EndpointsShape} */
type OnlyEndpoints<Src extends EndpointsShape> = {
  [Key in keyof Src as Key extends HTTPMethods ? Key : never]: Src[Key];
};
/** Shape for available body data in a {@link PAPICaller}'s {@link PAPICallerConfig} */
type PAPIBodyCfg<Src extends BuilderRoot> = Src extends BodyShape
  ? { data?: Partial<{ [Key in keyof Src[$Body] as Key extends string ? Key : never]: Src[$Body][Key] }> }
  : {};
/** Calls an endpoint and returns a JSON response */
type PAPICaller<Src extends BuilderRoot, Key extends HTTPMethods> = <Cfg extends PAPICallerConfig<Src>>(
  init?: Cfg
) => PAPICallerResponse<Src, Key, Cfg>;
/** Available configuration for calling API endpoints through a {@link PAPICaller} */
type PAPICallerConfig<Src extends BuilderRoot> = RequestInit &
  Expand<PAPIBodyCfg<Src> & PAPIQueryCfg<Src> & { parse?: 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text' }>;
/** API response from a specified {@link EndpointsShape}'s {@link PAPICaller} */
type PAPICallerResponse<Src extends BuilderRoot, Key extends HTTPMethods, Cfg = PAPICallerConfig<Src>> = Promise<
  | (Cfg extends { query: any }
      ? Src extends QueryableAltShape
        ?
            | DeRead<OnlyEndpoints<Src[$Query]>[keyof OnlyEndpoints<Src[$Query]>]>
            | (Src[$Query] extends ErrorShape ? Src[$Query][$Error] : never)
        : DeRead<Src[Key]>
      : DeRead<Src[Key]>)
  | (Src extends ErrorShape ? Src[$Error] : never)
>;

/** Map between available {@link HTTPMethods} on a given {@link EndpointsShape} to {@link PAPICaller}s */
type PAPICallers<Src extends BuilderRoot> = {
  [Key in keyof Src as Key extends HTTPMethods ? Key : never]: Key extends HTTPMethods ? PAPICaller<Src, Key> : never;
};
/** Available configuration for {@link PAPIBuilder#build} when creating a {@link PAPITool} tool */
type PAPIConfig = {
  /** API Key to automatically pass into requests as part of an Authorization `Bearer ${token}` header  */
  apiKey?: string;
  /** Lifetime of the {@link PAPITool} tool */
  life?: number;
};
/** Recursively processes "path" entries of a {@link BuilderRoot}, applying {@link Slug}s as needed */
type PAPIPaths<Src extends BuilderRoot> = {
  [Key in keyof Src as Key extends string ? Key : never]: Src[Key] extends BuilderRoot ? PAPITool<Src[Key]> : never;
} & PAPISlug<Src>;
/** Shape for available query parameters in a {@link PAPICaller}'s {@link PAPICallerConfig} */
type PAPIQueryCfg<Src extends BuilderRoot> = Src extends QueryableShape
  ? { query?: Partial<{ [Key in keyof Src[$Query] as Key extends string ? Key : never]: Src[$Query][Key] }> }
  : {};
/** Recursively processes "slug" entries of a {@link BuilderRoot} */
type PAPISlug<Src extends BuilderRoot> = Src extends Slug ? { [id: number | string]: PAPITool<Src[$Slug]> } : {};
/** A PAPI tool use a chainable syntax that matches the URL structure of an API endpoint, providing a natural method
 * for accessing API endpoints */
type PAPITool<Src extends BuilderRoot> = keyof Src extends string
  ? Expand<PAPIPaths<Src>>
  : Expand<PAPIPaths<Src> & PAPICallers<Src>>;
/** {@link BuilderRoot} shape that contains a {@link $Query} definition that leads to a different API response */
type QueryableAltShape = { [$query]: Partial<EndpointsShape> };
/** {@link BuilderRoot} shape that contains a {@link $Query} definition */
type QueryableShape = { [$query]: QueryParameters | Partial<EndpointsShape> };
/** {@link BuilderRoot} shape that contains a {@link $Slug} definition */
type Slug = { [$slug]: BuilderRoot };
/**  */
/** Available configuration for {@link PAPIBuilder#build} when creating a temporary {@link PAPITool} tool */
type TAPIConfig = {
  /** API Key to automatically pass into requests as part of an Authorization `Bearer ${token}` header */
  apiKey?: string;
  /** Lifetime of the {@link PAPITool} tool */
  life: number;
};

export { buildPAPI, buildTAPI };
export type {
  BodyShape,
  EndpointsShape,
  ErrorShape,
  OnlyEndpoints,
  PAPIBodyCfg,
  PAPICaller,
  PAPICallerConfig,
  PAPICallerResponse,
  PAPICallers,
  PAPIConfig,
  PAPIPaths,
  PAPIQueryCfg,
  PAPISlug,
  PAPITool,
  QueryableAltShape,
  QueryableShape,
  Slug,
  TAPIConfig,
};
