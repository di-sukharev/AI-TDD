import { expect, test, mock } from "bun:test";

const random = mock((multiplier: number) => multiplier * Math.random());

test("random", async () => {
  const a = random(1);

  expect(random).toHaveBeenCalled();
  expect(random).toHaveBeenCalledTimes(3);
  expect(random.mock.results[0]).toEqual({ type: "return", value: a });
});
