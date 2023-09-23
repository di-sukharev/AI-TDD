// api.test.mjs
import { expect, test, mock } from "bun:test";
import UserService from "src/examples/userService";

const users = [{ id: 1, name: "John Doe", email: "john.doe@example.com" }];

UserService.findById = mock((id) => users.find((user) => user.id === id));

test("should find user in UserService", async () => {
  const user = await UserService.findUser({ id: 1 });

  expect(user).toHaveProperty("id", 1);
  expect(user).toHaveProperty("name", "John Doe");
  expect(user).toHaveProperty("email", "john.doe@example.com");
});

test("should find user in UserService by name", async () => {
  const user = await UserService.findUser({ name: "John Doe" });

  expect(user).toHaveProperty("id", 1);
  expect(user).toHaveProperty("name", "John Doe");
  expect(user).toHaveProperty("email", "john.doe@example.com");
});
