import { expect, test, mock } from "bun:test";

const random = mock((multiplier: number) => multiplier * Math.random());

test("random", async () => {
  const a = random(2);
random(2); // Second call
  random(2); // Third call

  expect(random).toHaveBeenCalled();
  expect(random).toHaveBeenCalledTimes(3);
  expect(random.mock.results[0]).toEqual({ type: "return", value: a });
});
