import { $DELETE, $GET, $PATCH, $POST, $PUT, $error, $query, $slug, PAPIBuilder } from '../../lib';

papiIn4Lines: {
  // 1. Define a base URL
  const allAlbums = await new PAPIBuilder('https://jsonplaceholder.typicode.com')
    // 2. Define API endpoints
    .path('albums', p => p.endpoint($GET, [{ userId: 0, id: 0, title: '' }]))
    // 3. Create API caller
    .build()
    // 4. Make an API request
    .albums[$GET]();
  // typeof allAlbums = { userId: number; id: number; title: string }[]
}

papiBasicsExpanded: {
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
}

notesOnTAPI: {
  const tapi = new PAPIBuilder('https://jsonplaceholder.typicode.com')
    .path('dummy', path => path.endpoint($GET, [0]))
    .build({ life: 300_000 }); // 1_000ms * 60s * 5m = 300_000
  const ids = await tapi.dummy[$GET]();
  // etc
}
notesOnShapeSpecificity: {
  const fooOptional: { foo?: string } = {};
  const response = await new PAPIBuilder('https://jsonplaceholder.typicode.com')
    .path('dummy', path => path.endpoint($GET, fooOptional))
    .build()
    .dummy[$GET]();
  // typeof response = { foo?: string }

  const builder = new PAPIBuilder('https://jsonplaceholder.typicode.com');
  const specificValue = await builder
    .path('dummy', path => path.endpoint($GET, 'foo'))
    .build()
    .dummy[$GET]();
  // typeof specificValue = 'foo';
  const primitive = await builder
    .path('dummy', path => path.endpoint<string>($GET, 'foo'))
    .build()
    .dummy[$GET]();
  // typeof primitive = string;
  const guaranteedValues = await builder
    .path('dummy', path =>
      path.endpoint($GET, {
        foo: [123, 456] as const,
        bar: 'abc',
        baz: { puz: true as const },
      })
    )
    .build()
    .dummy[$GET]();
  // typeof guaranteedValues = { foo: [123, 456]; bar: string; baz: { puz: true } }
  const exactShape = await builder
    .path('dummy', path =>
      path.endpoint($GET, {
        foo: [123, 456],
        bar: 'abc',
        baz: { puz: true },
      } as const)
    )
    .build()
    .dummy[$GET]();
  // typeof exactShape = { foo: [123, 456], bar: 'abc', baz: { puz: true } }
}

notesOnErrorShapes: {
  function invariant(condition: any, msg?: string): asserts condition {
    if (!condition) throw new Error(msg ?? 'Invariant failed');
  }
  // Example -- narrow shape down from success/error response
  type SuccessResponse = { data: string } | { data: number };
  type ErrorResponse = { error: { message: string } };
  type APIResponse = SuccessResponse | ErrorResponse;
  const resp = <APIResponse>{};
  invariant(!('error' in resp));
  resp; // SuccessResponse
}

notesOnBuilderFunctions: {
  const badPath = (path: PAPIBuilder): PAPIBuilder => path.endpoint($GET, [0]);
  const goodPath = (path: PAPIBuilder) => path.endpoint($GET, [0]);
  const papi = new PAPIBuilder('https://jsonplaceholder.typicode.com')
    .path('bad', badPath)
    .path('good', goodPath)
    .build();
  papi.bad; // {} -- no PAPI inference available
  papi.good; // { [$GET]: PAPICaller<{ [$GET]: number[] }, typeof $GET>}
}

notesOnAlternativeBuilding: {
  const canError = { [$error]: { error: '' } };
  const getsUser = { [$GET]: { id: 0, name: '' } };
  const rootObj = {
    foo: {
      [$GET]: [0],
      [$query]: { id: 0, ...getsUser },
      [$slug]: { ...canError, ...getsUser },
    },
  };
  const papi = new PAPIBuilder('https://jsonplaceholder.typicode.com', { rootObj }).build();
  const ids = await papi.foo[$GET](); // number[]
  const data = await Promise.all(ids.map(id => papi.foo[$GET]({ query: { id } }))); // { id: number; name: string }[]
  const user5 = await papi.foo[ids[4]][$GET]();
  if ('error' in user5) throw new Error(`Unable to retrieve user: ${user5.error}`);
  user5; // { id: number; name: string };
}
