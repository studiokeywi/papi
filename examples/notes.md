# Notes

- Passing in a `life` value to the `.build` function creates a Temporary PAPITool (TAPITool). These are useful for situations where you may only want temporary access provided to an API. The TAPI will cease to function after the `life` duration has expired, enforced by a `Proxy.revocable`. The timer begins from TAPI creation and is refreshed everytime it is used to call any endpoint:

  ```typescript
  const tapi = new PAPIBuilder('https://jsonplaceholder.typicode.com')
    .path('dummy', path => path.endpoint($GET, [0]))
    .build({ life: 300_000 }); // 1_000ms * 60s * 5m = 300_000
  const ids = await tapi.dummy[$GET]();
  // etc
  ```

- The design of PAPI is flexible enough to allow you to pass custom shapes to a variety of builder functions. This is to allow more complex shapes to be defined while permitting the simplicity of generic object shapes. An example with optional response values from an endpoint is shown below:

  ```typescript
  const fooOptional: { foo?: string } = {};
  const response = await new PAPIBuilder('https://jsonplaceholder.typicode.com')
    .path('dummy', path => path.endpoint($GET, fooOptional))
    .build()
    .dummy[$GET]();
  // typeof response = { foo?: string }
  ```

  This is especially important to remember when defining API responses that are primitives -- If you say an endpoint will return a numeric/string value, PAPI will assume you mean the specific value that was provided. This can be bypassed by explicitly declaring the endpoint response type. Conversely, you can enforce specific values of the properties of an API response with `as const`. The entire shape can be marked, or individual properties (including on nested objects) can be marked as needed:

  ```typescript
  import { $GET, PAPIBuilder } from '@studiokeywi/papi';

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
  ```

  **NOTE:** Although PAPI allows you to define these shapes with guaranteed or expected values, PAPI does not guarantee the shape of the incoming data will match your definitions. PAPI wraps around the API calling process with minimal interaction with an API's response to provide a better IDE experience but is not concerned with security or validity of data

- When defining error shapes, the API responses can be narrowed through type guards or assertions within TypeScript. While not mandatory, they can make processing responses easier to deal with. An example `invariant` function is defined below, which can be used to throw errors based on input shapes:

  ```typescript
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
  ```

- BuilderFunctions can be separated for better composability. If defining BuilderFunctions separately in TypeScript, do not explicitly type the return value from your function and let PAPI infer the resulting shape for you:

  ```typescript
  import { $GET, PAPIBuilder } from '@studiokeywi/papi';

  const badPath = (path: PAPIBuilder): PAPIBuilder => path.endpoint($GET, [0]);
  const goodPath = (path: PAPIBuilder) => path.endpoint($GET, [0]);
  const papi = new PAPIBuilder('https://jsonplaceholder.typicode.com')
    .path('bad', badPath)
    .path('good', goodPath)
    .build();
  papi.bad; // {} -- no PAPI inference available
  papi.good; // { [$GET]: PAPICaller<{ [$GET]: number[] }, typeof $GET>}
  ```

- Using the `rootObj` property on the optional configuration for PAPIBuilder can be used to bypass the builder syntax, if preferred. The `$body`, `$error`, `$query`, and `$slug` magic key symbols are exported alongside the HTTP method symbols for this purpose:

  ```typescript
  import { $GET, $error, $query, $slug, PAPIBuilder } from '@studiokeywi/papi';

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
  ```
