# PAPI

> The Proxy API tool from studioKeywi

## Installation

PAPI is available to install through NPM:

```sh
npm i @studiokeywi/papi
```

## Usage

PAPI is designed with a chainable builder approach to defining the shape of any API, combined with a chained property approach to calling the various API endpoints. The combination allows for a natural and expressive way to declare and request expected API responses

## Examples

Examples in this README are based on the API endpoints available through [JSONPlaceholder](https://jsonplaceholder.typicode.com). The GitHub repo also contains an [examples folder](https://github.com/studiokeywi/papi/blob/primary/examples/notes.md) showing the code snippets used in this README and other quick reference docs, as well as extra notes about PAPI usage and a fully expanded JSONPlaceholder definition with sample usage

### PAPI in 4 Lines

```typescript
import { $GET, PAPIBuilder } from '@studiokeywi/papi';

// 1. Define a base URL
const allAlbums = await new PAPIBuilder('https://jsonplaceholder.typicode.com')
  // 2. Define API endpoints
  .path('albums', p => p.endpoint($GET, [{ userId: 0, id: 0, title: '' }]))
  // 3. Create API caller
  .build()
  // 4. Make an API request
  .albums[$GET]();
// typeof allAlbums = { userId: number; id: number; title: string }[]
```

### PAPIBuilder

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

See the [PAPIBuilder](https://github.com/studiokeywi/papi/blob/primary/quickref/builder.md) quick reference for more

### PAPITool

The PAPITool allows arbitrary API endpoints to be called. Following from the example above:

```typescript
const data = {
  title: "studioKeywi's Loudest Hits!",
};
const newAlbum: Album | {} = await papi.albums[$POST]({ data });
if (!('id' in newAlbum)) throw new Error(`API Post failed and returned ${newAlbum}`);

const photos: Photo[] | {} = await papi.albums[newAlbum.id].photos[$GET]();
if (!('length' in photos)) throw new Error(`API Get failed and returned ${photos}`);

photos.forEach(photo => {
  // do something with each photo...
});
```

See the [PAPITool](https://github.com/studiokeywi/papi/blob/primary/quickref/tool.md) quick reference for more
