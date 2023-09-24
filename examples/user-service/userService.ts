import * as fs from "fs";
class UserService {
  static async loadUsers() {
    try {
      const data = await fs.promises.readFile(
        "examples/user-service/user-db.json",
        "utf8"
      );
      this.users = JSON.parse(data);
    } catch (error) {
      this.users = [];
    }
  }

static async loadUsers() {
    const data = await fs.promises.readFile('examples/user-service/user-db.json', 'utf-8');
    return JSON.parse(data);
  }

  static async findUser(query) {
    return this.users.find((user) => {
      for (let key in query) {
        if (user[key] !== query[key]) {
          return false;
        }
      }

      return true;
    });
  }
}

export default UserService;
