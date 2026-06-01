import { post, get } from "../requestHelper.js";

export const startFight = async (fighter1Id, fighter2Id) => {
  return await post("fights", { fighter1Id, fighter2Id });
};

export const getFights = async (id = "") => {
  return await get("fights", id);
};

export default { startFight, getFights };
