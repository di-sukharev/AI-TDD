class UserService {
  static async findUser(query) {
    const users = [{ id: 1, name: 'John Doe', email: 'john.doe@example.com' }];
    if (query.id) {
      return users.find(user => user.id === query.id);
    }
    if (query.name) {
      return users.find(user => user.name === query.name);
    }
  }
}

export default UserService;