import { test, mock } from "bun:test";

const random = mock((multiplier: number) => multiplier * Math.random());

test("random", async () => {
  const a = random(1);
  const b = random(2);
  const c = random(3);

  expect(random).toHaveBeenCalled();
  expect(random).toHaveBeenCalledTimes(3);
  expect(random.mock.args).toEqual([[1], [2], [3]]);
  expect(random.mock.results[0]).toEqual({ type: "return", value: a });
});
