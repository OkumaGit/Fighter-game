import { userRepository } from "../repositories/userRepository.js";

class UserService {
  getAll() {
    return userRepository.getAll();
  }

  getOne(id) {
    return userRepository.getOne({ id });
  }

  create(data) {
    const list = userRepository.getAll();
    if (
      list.some(
        (u) =>
          u.email && u.email.toLowerCase() === String(data.email).toLowerCase(),
      )
    ) {
      throw new Error("User with same email already exists");
    }

    if (list.some((u) => u.phone === data.phone)) {
      throw new Error("User with same phone already exists");
    }

    return userRepository.create(data);
  }

  update(id, data) {
    const exists = this.getOne(id);
    if (!exists) return null;

    const list = userRepository.getAll();
    if (
      data.email !== undefined &&
      list.some(
        (u) =>
          u.id !== id &&
          u.email &&
          u.email.toLowerCase() === String(data.email).toLowerCase(),
      )
    ) {
      throw new Error("User with same email already exists");
    }

    if (
      data.phone !== undefined &&
      list.some((u) => u.id !== id && u.phone === data.phone)
    ) {
      throw new Error("User with same phone already exists");
    }

    return userRepository.update(id, data);
  }

  delete(id) {
    const exists = this.getOne(id);
    if (!exists) return null;
    return userRepository.delete(id);
  }

  search(search) {
    const item = userRepository.getOne(search);
    if (!item) return null;
    return item;
  }
}

const userService = new UserService();

export { userService };
