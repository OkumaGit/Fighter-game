import { fighterRepository } from "../repositories/fighterRepository.js";

class FighterService {
  getAll() {
    return fighterRepository.getAll();
  }

  getOne(id) {
    return fighterRepository.getOne({ id });
  }

  create(data) {
    const list = fighterRepository.getAll();
    if (
      list.some(
        (f) =>
          f.name &&
          String(f.name).toLowerCase() === String(data.name).toLowerCase(),
      )
    ) {
      throw new Error("Fighter with same name already exists");
    }

    // default health
    if (data.health === undefined || data.health === null) data.health = 85;

    return fighterRepository.create(data);
  }

  update(id, data) {
    const exists = this.getOne(id);
    if (!exists) return null;

    const list = fighterRepository.getAll();
    if (
      data.name !== undefined &&
      list.some(
        (f) =>
          f.id !== id &&
          f.name &&
          String(f.name).toLowerCase() === String(data.name).toLowerCase(),
      )
    ) {
      throw new Error("Fighter with same name already exists");
    }

    return fighterRepository.update(id, data);
  }

  delete(id) {
    const exists = this.getOne(id);
    if (!exists) return null;
    return fighterRepository.delete(id);
  }
}

const fighterService = new FighterService();

export { fighterService };
