import { USER } from "../models/user.js";

const isGmail = (email) =>
  typeof email === "string" && /@gmail\.com$/i.test(email);
const isPhone = (phone) =>
  typeof phone === "string" && /^\+380\d{9}$/.test(phone);
const isStringMin = (val, len = 1) =>
  typeof val === "string" && val.trim().length >= len;

const sendError = (res, message) => {
  res.err = new Error(message);
};

const createUserValid = (req, res, next) => {
  try {
    const body = req.body || {};

    if (Object.prototype.hasOwnProperty.call(body, "id")) {
      sendError(res, "Id must be absent in request body");
      return next();
    }

    const allowedKeys = Object.keys(USER);
    const requiredKeys = allowedKeys.filter((k) => k !== "id");

    // No extra props
    const extra = Object.keys(body).filter((k) => !allowedKeys.includes(k));
    if (extra.length) {
      sendError(res, `Unexpected properties: ${extra.join(", ")}`);
      return next();
    }

    // All required present
    const missing = requiredKeys.filter(
      (k) => body[k] === undefined || body[k] === null || body[k] === "",
    );
    if (missing.length) {
      sendError(res, `Missing required properties: ${missing.join(", ")}`);
      return next();
    }

    // Field formats
    if (!isGmail(body.email)) {
      sendError(res, "Email must be a gmail address");
      return next();
    }

    if (!isPhone(body.phone)) {
      sendError(res, "Phone must match +380XXXXXXXXX format");
      return next();
    }

    if (!isStringMin(body.password, 3)) {
      sendError(res, "Password must be at least 3 characters");
      return next();
    }

    if (!isStringMin(body.firstName) || !isStringMin(body.lastName)) {
      sendError(res, "First and last name must be non-empty strings");
      return next();
    }

    return next();
  } catch (err) {
    sendError(res, "User entity to create isn’t valid");
    return next();
  }
};

const updateUserValid = (req, res, next) => {
  try {
    const body = req.body || {};

    if (Object.prototype.hasOwnProperty.call(body, "id")) {
      sendError(res, "Id must be absent in request body");
      return next();
    }

    const allowedKeys = Object.keys(USER).filter((k) => k !== "id");
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

    if (body.email !== undefined && !isGmail(body.email)) {
      sendError(res, "Email must be a gmail address");
      return next();
    }

    if (body.phone !== undefined && !isPhone(body.phone)) {
      sendError(res, "Phone must match +380XXXXXXXXX format");
      return next();
    }

    if (body.password !== undefined && !isStringMin(body.password, 3)) {
      sendError(res, "Password must be at least 3 characters");
      return next();
    }

    if (body.firstName !== undefined && !isStringMin(body.firstName)) {
      sendError(res, "First name must be a non-empty string");
      return next();
    }

    if (body.lastName !== undefined && !isStringMin(body.lastName)) {
      sendError(res, "Last name must be a non-empty string");
      return next();
    }

    return next();
  } catch (err) {
    sendError(res, "User entity to update isn’t valid");
    return next();
  }
};

export { createUserValid, updateUserValid };
