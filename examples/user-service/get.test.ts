import { afterAll, beforeAll, expect, test } from "bun:test";
import UserService from "examples/user-service/userService";
import { unlink } from "fs/promises";
import * as fs from "fs";

const users = [{ id: 1, name: "John Doe", email: "john.doe@example.com" }];

beforeAll(async () => {
  await Bun.write("examples/user-service/user-db.json", JSON.stringify(users));
});

afterAll(async () => {
  await unlink("examples/user-service/user-db.json");
});

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
