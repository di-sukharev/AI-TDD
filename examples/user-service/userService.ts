import { readFile } from 'fs/promises';

export default class UserService {
  static async findUser(query) {
    const usersData = await readFile('examples/user-service/user-db.json', 'utf-8');
    const users = JSON.parse(usersData);
    if (query.id) {
      return users.find(user => user.id === query.id);
    } else if (query.name) {
      return users.find(user => user.name === query.name);
    }
  }
}