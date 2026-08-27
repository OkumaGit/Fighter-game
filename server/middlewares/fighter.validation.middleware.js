import { FIGHTER } from "../models/fighter.js";

const isStringMin = (val, len = 1) =>
  typeof val === "string" && val.trim().length >= len;
const isNumberInRange = (val, min, max) => {
  const num = Number(val);
  return !Number.isNaN(num) && num >= min && num <= max;
};

const sendError = (res, message) => {
  res.err = new Error(message);
};

const createFighterValid = (req, res, next) => {
  try {
    const body = req.body || {};

    if (Object.prototype.hasOwnProperty.call(body, "id")) {
      sendError(res, "Id must be absent in request body");
      return next();
    }

    const allowedKeys = Object.keys(FIGHTER);
    const requiredKeys = allowedKeys.filter(
      (k) => k !== "id" && k !== "health",
    );

    // No extra props
    const extra = Object.keys(body).filter((k) => !allowedKeys.includes(k));
    if (extra.length) {
      sendError(res, `Unexpected properties: ${extra.join(", ")}`);
      return next();
    }

    // Required present
    const missing = requiredKeys.filter(
      (k) => body[k] === undefined || body[k] === null || body[k] === "",
    );
    if (missing.length) {
      sendError(res, `Missing required properties: ${missing.join(", ")}`);
      return next();
    }

    if (!isStringMin(body.name)) {
      sendError(res, "Name must be a non-empty string");
      return next();
    }

    if (!isNumberInRange(body.power, 1, 100)) {
      sendError(res, "Power must be a number between 1 and 100");
      return next();
    }

    if (!isNumberInRange(body.defense, 1, 10)) {
      sendError(res, "Defense must be a number between 1 and 10");
      return next();
    }

    if (body.health !== undefined && !isNumberInRange(body.health, 80, 120)) {
      sendError(res, "Health must be a number between 80 and 120");
      return next();
    }

    return next();
  } catch (err) {
    sendError(res, "Fighter entity to create isn’t valid");
    return next();
  }
};

const updateFighterValid = (req, res, next) => {
  try {
    const body = req.body || {};

    if (Object.prototype.hasOwnProperty.call(body, "id")) {
      sendError(res, "Id must be absent in request body");
      return next();
    }

    const allowedKeys = Object.keys(FIGHTER).filter((k) => k !== "id");
    const keys = Object.keys(body);

    if (!keys.length) {
      sendError(res, "At least one property must be provided for update");
      return next();
    }

    const extra = keys.filter((k) => !allowedKeys.includes(k));
    if (extra.length) {
      sendError(res, `Unexpected properties: ${extra.join(", ")}`);
      return next();
    }

    if (body.name !== undefined && !isStringMin(body.name)) {
      sendError(res, "Name must be a non-empty string");
      return next();
    }

    if (body.power !== undefined && !isNumberInRange(body.power, 1, 100)) {
      sendError(res, "Power must be a number between 1 and 100");
      return next();
    }

    if (body.defense !== undefined && !isNumberInRange(body.defense, 1, 10)) {
      sendError(res, "Defense must be a number between 1 and 10");
      return next();
    }

    if (body.health !== undefined && !isNumberInRange(body.health, 80, 120)) {
      sendError(res, "Health must be a number between 80 and 120");
      return next();
    }

    return next();
  } catch (err) {
    sendError(res, "Fighter entity to update isn’t valid");
    return next();
  }
};

export { createFighterValid, updateFighterValid };
