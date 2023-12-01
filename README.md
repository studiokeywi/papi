# PAPI

> The Proxy API tool from studioKeywi

## Installation

PAPI is available to install through NPM:

```sh
npm i @studiokeywi/papi
```

## Usage

PAPI is designed with a chainable builder approach to defining the shape of any API, combined with a chained property approach to calling the various API endpoints. The combination allows for a natural and expressive way to declare and request expected API responses

### PAPI in 4 Lines

[JSONPlaceholder](https://jsonplaceholder.typicode.com/):

<!-- prettier-ignore -->
```typescript
import { $GET, PAPIBuilder } from '@studiokeywi/papi';

const allAlbums = await new PAPIBuilder('https://jsonplaceholder.typicode.com') // 1. Define a base URL
  .path('albums', p => p.endpoint($GET, [{ userId: 0, id: 0, title: '' }]))     // 2. Define API
  .build()                                                                      // 3. Create API caller
  .albums[$GET]();                                                              // 4. Call and receive response
```

### PAPIBuilder

The PAPIBuilder allows arbitrary API endpoints to be defined. An expanded example of the JSONPlaceholder API's `/albums` endpoint is demonstrated below:

```typescript
import { $DELETE, $GET, $PATCH, $POST, $PUT, PAPIBuilder } from '@studiokeywi/papi';

// Commonly used shapes can be defined ahead of time if desired
// PAPI infers the types from an object so using placeholders like 0 and '' work
const albumShape = { userId: 0, id: 0, title: '' };
const photoShape = { albumId: 0, id: 0, title: '', url: '', thumbnailUrl: '' };

// Likewise, types can be defined ahead of time if desired
type Album = typeof albumShape;
type Photo = typeof photoShape;

const papi = new PAPIBuilder('https://jsonplaceholder.typicode.com')
  // `.path` defines a subpath under the current level of builder
  .path('albums', albums =>
    albums
      // `.body` defines what may be sent to an API (eg via POST/DELETE)
      .body(albumShape)
      // `.endpoint` defines the HTTP method for accessing an API and the shape of its response
      .endpoint($GET, [albumShape])
      .endpoint($POST, albumShape)
      // `.error` defines the shape of an error response
      .error({})
      // `.query` defines what may be appended as query parameters to the endpoint
      .query(albumShape, album => album.endpoint($GET, [albumShape]).error({}))
      // `.slug` defines a path segment that can be filled in arbitrarily
      .slug(albumId =>
        albumId
          .body(albumShape)
          .endpoint($GET, albumShape)
          .endpoint($DELETE, {})
          .endpoint($PATCH, albumShape)
          .endpoint($PUT, albumShape)
          .error({})
          .path('photos', photos => photos.endpoint($GET, [photoShape]).error({}))
      )
  )
  // `.build` creates the PAPITool
  .build();
```

The following methods are available to a builder instance:

#### `.body`

The `.body` function is used to declare that an endpoint is capable of receiving a body of data. It accepts a single argument defining the shape of accepted data for the endpoint

[API docs: body](./classes/builder.PAPIBuilder.html#body)

#### `.build`

The `.build` function is used to create a PAPITool for calling API endpoints. It accepts a single optional argument providing configuration to the built PAPITool. The following configuration options are available:

| Property | Use                                                                        |
| -------- | -------------------------------------------------------------------------- |
| `apiKey` | Automatically attach `Bearer ${apiKey}` values to the Authorization header |
| `life`   | Convert the PAPITool into a Temporary PAPITool (see below)                 |

[API docs: build](./classes/builder.PAPIBuilder.html#build)

#### `.endpoint`

The `.endpoint` function defines the shape of the responses for a given endpoint, associated with one of the 5 most common HTTP methods (DELETE, GET, PATCH, POST, and PUT). Multiple endpoints can be defined for different methods within the same level. It accepts two arguments; The first is the associated HTTP method symbol for the endpoint (eg `$GET`), and the second is the shape of the expected response when calling the endpoint with the given method

[API docs: endpoint](./classes/builder.PAPIBuilder.html#endpoint)

#### `.error`

The `.error` function defines the shape of the repsponse for a given endpoint's error. When provided, the built PAPITool will return the union of the endpoint shape and the error shape to indicate that error responses must be handled. It accepts a single argument defining the shape of error responses

[API docs: error](./classes/builder.PAPIBuilder.html#error)

#### `.path`

The `.path` function defines a subpath for the current level of the PAPIBuilder. Typically, the top level of a PAPIBuilder will include nothing but paths, and paths may be nested arbitrarily deep. It accepts two arguments; The first is a string of the path segment, and the second is a BuilderFunction which is used to define the shape of the path

[API docs: path](./classes/builder.PAPIBuilder.html#path)  
[API docs: BuilderFunction](./classes/builder.BuilderFunction.html)

#### `.query`

The `.query` function defines query parameters that may be appended to an endpoint request. It accepts two arguments; The first is the shape of query parameters that may be used when calling an endpoint, and the second is an optional BuilderFunction which is used to define alternate endpoint shapes when query parameters are used

[API docs: query](./classes/builder.PAPIBuilder.html#query)  
[API docs: BuilderFunction](./classes/builder.BuilderFunction.html)

#### `.slug`

The `.slug` function defines a subpath where the actual pathname is not fixed but may be replaced by a given value. Typically this is seen with ID values representing a path segment as opposed to using a query parameter to provide the ID. It accepts a single argument, which is a BuilderFunction that defines the shape of the path represented by the slug value

[API docs: slug](./classes/builder.PAPIBuilder.html#slug)  
[API docs: BuilderFunction](./classes/builder.BuilderFunction.html)

### PAPITool

The PAPITool allows arbitrary API endpoints to be called. Following from the example from the PAPIBuilder section above:

```typescript
const newAlbum: Album | {} = await papi.albums[$POST]({ data: { title: "studioKeywi's Loudest Hits" } });
if (!('id' in newAlbum)) throw new Error(`API Post failed and returned ${newAlbum}`);

const photos: (Photo | {})[] = await papi.albums[newAlbum.id].photos[$GET]();
for (const photo of photos) {
  if ('url' in photo) console.log(photo.url);
  else console.warn('error response');
}
```

The types for PAPI assist with ensuring any calls you make match the shape defined in the builder. This includes:

- Knowing which HTTP methods should be available for a given endpoint
- Knowing whether an endpoint can receive a body of data
- Knowing whether an endpoint returns a different response when using query parameters
- Knowing whether an endpoint has a different error response shape

[API docs: PAPITool](./types/papi.PAPITool.html)

#### PAPITool Configuration

The PAPITool wraps around the `fetch` WebAPI implementation available to the JS runtime, and all of the standard configuration values for a `fetch` call can be passed.

Additionally, the following fields may be provided to alter the caller's behavior:

- `data`: may be used to provide JSON information used as the body of a request without manually converting to a string
- `parse`: set the automatic parsing mode for the request from one of `arrayBuffer`, `blob`, `formData`, `json`, or `text` (default: `json`)
- `query`: may be used to provide query parameter values in a `{ [key]: value }` syntax without manually converting to a string

[API docs: PAPITool Caller config](./types/papi.PAPICallerConfig.html)  
[API docs: PAPITool Caller `body` config](./types/papi.PAPIBodyCfg.html)  
[API docs: PAPITool Caller `query` config](./types/papi.PAPIQueryCfg.html)

## TAPI

Passing in a `life` value to the `.build` function creates a Temporary PAPITool (TAPITool). These are useful for situations where you may only want temporary access provided to an API. The TAPI will cease to function after the `life` duration has expired. Use of the TAPI object extends its lifetime by the `life` value.

## Notes

- The design of PAPI is flexible enough to allow you to pass custom shapes to a variety of builder functions. This is to allow more complex shapes to be defined while permitting the simplicity of generic object shapes. An example with optional response values from an endpoint is shown below:

  ```typescript
  const response = await new PAPIBuilder('')
    .endpoint($GET, <{ foo?: string }>{})
    .build()
    [$GET]();
  // typeof response = { foo?: string }
  ```

- When defining error shapes, the API responses can be narrowed through type guards or assertions within TypeScript. While not mandatory, they can make processing responses easier to deal with. An example `invariant` function is defined below, which can be used to throw errors based on input shapes:

  ```typescript
  function invariant(condition: any, msg?: string): asserts condition {
    if (!condition) throw new Error(msg ?? 'Invariant failed');
  }
  // Example -- narrow shape down from success/error response
  type SuccessResponse = { data: string } | { data: number };
  type ErrorResponse = { error: { message: string } };
  type APIResponse = SuccessResponse | ErrorResponse;
  declare const resp: APIResponse;
  invariant(!('error' in resp));
  resp; // SuccessResponse
  ```
