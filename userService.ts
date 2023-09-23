class UserService {
  static findById(id) {
    throw new Error('Not implemented');
  }
  static async findUser({ id }) {
    return this.findById(id);
  }
}

export default UserService;