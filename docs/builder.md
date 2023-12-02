# PAPIBuilder

The PAPIBuilder allows arbitrary API endpoints to be defined. An expanded example of the JSONPlaceholder API's `/albums` endpoint is demonstrated below:

```typescript
import { $DELETE, $GET, $PATCH, $POST, $PUT, PAPIBuilder } from '@studiokeywi/papi';

// Commonly used shapes can be defined ahead of time if desired.
// PAPI infers the types inside an object, so placeholders like 0 and '' work
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

## Available Methods

### `new PAPIBuilder`

The PAPIBuilder constructor takes two arguments; the first is a string representing the base URL for an API, and the second is an optional shape used as the base shape of the builder. This second argument is an optional configuration object for the PAPIBuilder. It is primarily used for internally updating the state of the PAPIBuilder but is exposed for advanced/edge use cases as well as for possible feature enhancements in the future. The following configuration options are available:

| Property  | Use                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| `rootObj` | Shape considered as the "root" for the builder. The root object is used for defining the PAPITool when using `.build` |

The following methods are available to a builder instance:

### `.body`

The `.body` function is used to declare that an endpoint is capable of receiving a body of data. It accepts a single argument defining the shape of accepted data for the endpoint

[API docs: body](https://studiokeywi.github.io/papi/classes/builder.PAPIBuilder.html#body)

### `.build`

The `.build` function is used to create a PAPITool for calling API endpoints. It accepts a single optional argument providing configuration to the built PAPITool. The following configuration options are available:

| Property | Use                                                                        |
| -------- | -------------------------------------------------------------------------- |
| `apiKey` | Automatically attach `Bearer ${apiKey}` values to the Authorization header |
| `life`   | Convert the PAPITool into a Temporary PAPITool (see below)                 |

[API docs: build](https://studiokeywi.github.io/papi/classes/builder.PAPIBuilder.html#build)
[GitHub QuickRef: PAPITool](https://github.com/studiokeywi/papi/blob/primary/docs/tool.md)
[GitHub QuickRef: Notes on TAPI](https://github.com/studiokeywi/papi/blob/primary/docs/notes.md#tapi)

### `.endpoint`

The `.endpoint` function defines the shape of the responses for a given endpoint, associated with one of the 5 most common HTTP methods (DELETE, GET, PATCH, POST, and PUT). Multiple endpoints can be defined for different methods within the same level. It accepts two arguments; The first is the associated HTTP method symbol for the endpoint (eg `$GET`), and the second is the shape of the expected response when calling the endpoint with the given method

[API docs: endpoint](https://studiokeywi.github.io/papi/classes/builder.PAPIBuilder.html#endpoint)

### `.error`

The `.error` function defines the shape of the repsponse for a given endpoint's error. When provided, the built PAPITool will return the union of the endpoint shape and the error shape to indicate that error responses must be handled. It accepts a single argument defining the shape of error responses

[API docs: error](https://studiokeywi.github.io/papi/classes/builder.PAPIBuilder.html#error)

### `.path`

The `.path` function defines a subpath for the current level of the PAPIBuilder. Typically, the top level of a PAPIBuilder will include nothing but paths, and paths may be nested arbitrarily deep. It accepts two arguments; The first is a string of the path segment, and the second is a BuilderFunction which is used to define the shape of the path

[API docs: path](https://studiokeywi.github.io/papi/classes/builder.PAPIBuilder.html#path)  
[API docs: BuilderFunction](https://studiokeywi.github.io/papi/types/builder.BuilderFunction.html)

### `.query`

The `.query` function defines query parameters that may be appended to an endpoint request. It accepts two arguments; The first is the shape of query parameters that may be used when calling an endpoint, and the second is an optional BuilderFunction which is used to define alternate endpoint shapes when query parameters are used

[API docs: query](https://studiokeywi.github.io/papi/classes/builder.PAPIBuilder.html#query)  
[API docs: BuilderFunction](https://studiokeywi.github.io/papi/types/builder.BuilderFunction.html)

### `.slug`

The `.slug` function defines a subpath where the actual pathname is not fixed but may be replaced by a given value. Typically this is seen with ID values representing a path segment as opposed to using a query parameter to provide the ID. It accepts a single argument, which is a BuilderFunction that defines the shape of the path represented by the slug value

[API docs: slug](https://studiokeywi.github.io/papi/classes/builder.PAPIBuilder.html#slug)  
[API docs: BuilderFunction](https://studiokeywi.github.io/papi/types/builder.BuilderFunction.html)
