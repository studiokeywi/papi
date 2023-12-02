# PAPITool

The PAPITool allows arbitrary API endpoints to be called. Following from the example from the PAPIBuilder section above:

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

The types for PAPI assist with ensuring any calls you make match the shape defined in the builder. This includes:

- Knowing which HTTP methods should be available for a given endpoint
- Knowing whether an endpoint can receive a body of data
- Knowing whether an endpoint returns a different response when using query parameters
- Knowing whether an endpoint has a different error response shape

[API docs: PAPITool](https://studiokeywi.github.io/papi/types/papi.PAPITool.html)

## PAPITool Configuration

The PAPITool wraps around the `fetch` WebAPI implementation available to the JS runtime, and all of the standard configuration values for a `fetch` call can be passed.

Additionally, the following fields may be provided to alter the caller's behavior:

- `data`: may be used to provide JSON information used as the body of a request without manually converting to a string
- `parse`: set the automatic parsing mode for the request from one of `arrayBuffer`, `blob`, `formData`, `json`, or `text` (default: `json`)
- `query`: may be used to provide query parameter values in a `{ [key]: value }` syntax without manually converting to a string

[API docs: PAPITool Caller config](https://studiokeywi.github.io/papi/types/papi.PAPICallerConfig.html)  
[API docs: PAPITool Caller `body` config](https://studiokeywi.github.io/papi/types/papi.PAPIBodyCfg.html)  
[API docs: PAPITool Caller `query` config](https://studiokeywi.github.io/papi/types/papi.PAPIQueryCfg.html)