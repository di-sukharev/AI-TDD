<div align="center">
  <div>
    <img src=".github/logo-sexy.svg" alt="ai-tdd logo"/>
    <h1 align="center">AI + TDD</h1>
    <h4 align="center">Follow the bird <a href="https://twitter.com/io_Y_oi"><img src="https://img.shields.io/twitter/follow/io_Y_oi?style=flat&label=io_Y_oi&logo=twitter&color=0bf&logoColor=fff" align="center"></a>
    </h4>
  </div>
	<h2>
		GPT4 powered CLI for TDD</br>You write the test, GPT writes the code to pass it ✅
	</h2>
	<p>Prompting GPT with a test suite makes it write code impressively accurate</p>
	<a href="https://www.npmjs.com/package/ai-tdd"><img src="https://img.shields.io/npm/v/ai-tdd" alt="Current version"></a>
</div>

---

## Example

Here is a frontend test suite written in [Jest](https://jestjs.io/) + [Testing Library](https://testing-library.com/). Yes, AI-TDD easily passes frontend tests:

```typescript
import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Fetch from '../fetch';

const server = setupServer(
  rest.get('/greeting', (req, res, ctx) => {
    return res(ctx.json({ greeting: 'hello there' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('loads and displays greeting', async () => {
  render(<Fetch url="/greeting" />);

  fireEvent.click(screen.getByText('Load Greeting'));

  await waitFor(() => screen.getByRole('heading'));

  expect(screen.getByRole('heading')).toHaveTextContent('hello there');
  expect(screen.getByRole('button')).toBeDisabled();
});

test('handles server error', async () => {
  server.use(
    rest.get('/greeting', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );

  render(<Fetch url="/greeting" />);

  fireEvent.click(screen.getByText('Load Greeting'));

  await waitFor(() => screen.getByRole('alert'));

  expect(screen.getByRole('alert')).toHaveTextContent('Oops, failed to fetch!');
  expect(screen.getByRole('button')).not.toBeDisabled();
});
```

Ready? Here is the code generated by AI-TDD (GPT-4) to pass the test:

```jsx
import React, { useState } from 'react';

function Fetch({ url }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setData(data.greeting);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {data && <h1 role="heading">{data}</h1>}
      {error && <div role="alert">{error}</div>}
      <button onClick={fetchData} disabled={loading}>
        Load Greeting
      </button>
    </div>
  );
}

export default Fetch;
```

## Setup

1. Install AI-TDD globally to use in any repository:

   ```sh
   npm install -g ai-tdd
   ```

2. Get your API key from [OpenAI](https://platform.openai.com/account/api-keys). Make sure you add payment details, so API works.

3. Set the key to AI-TDD config:

   ```sh
   aitdd config set OPENAI_API_KEY=<your_api_key>
   ```

   Your api key is stored locally in `~/.ai-tdd` config file and is not stored anywhere in any other way.

## Usage

You can call AI-TDD like this:

```sh
aitdd <test suite filepath...>
```

You can also call it via `ait` or `tdd` shortcuts:

```sh
ait <test suite filepath...>
```

Or:

```sh
tdd <test suite filepath...>
```

## Payments

You pay for your own requests to OpenAI API. AI-TDD uses GPT-4 model by default, check it's [pricing](https://openai.com/pricing). Maximum response tokens are set to 2000, you can adjust it via `ait config set maxTokens=<number>`.

I couldn't manage ChatGPT model to solve the problem. I tried to few shot it with a response example, it doesn't understand what I want. If you want to try manage it via ChatGPT — test it and open a PR 🚀
