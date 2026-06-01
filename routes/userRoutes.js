import { Router } from "express";
import { userService } from "../services/userService.js";
import {
  createUserValid,
  updateUserValid,
} from "../middlewares/user.validation.middleware.js";
import { responseMiddleware } from "../middlewares/response.middleware.js";

const router = Router();

router.get(
  "/",
  (req, res, next) => {
    try {
      res.data = userService.getAll();
    } catch (err) {
      res.err = err;
    } finally {
      next();
    }
  },
  responseMiddleware,
);

router.get(
  "/:id",
  (req, res, next) => {
    try {
      const item = userService.getOne(req.params.id);
      res.data = item === undefined ? null : item;
    } catch (err) {
      res.err = err;
    } finally {
      next();
    }
  },
  responseMiddleware,
);

router.post(
  "/",
  createUserValid,
  (req, res, next) => {
    try {
      const created = userService.create(req.body);
      res.data = created;
    } catch (err) {
      res.err = err;
    } finally {
      next();
    }
  },
  responseMiddleware,
);

router.patch(
  "/:id",
  updateUserValid,
  (req, res, next) => {
    try {
      const updated = userService.update(req.params.id, req.body);
      res.data = updated === undefined ? null : updated;
    } catch (err) {
      res.err = err;
    } finally {
      next();
    }
  },
  responseMiddleware,
);

router.delete(
  "/:id",
  (req, res, next) => {
    try {
      const deleted = userService.delete(req.params.id);
      res.data = deleted === undefined ? null : deleted;
    } catch (err) {
      res.err = err;
    } finally {
      next();
    }
  },
  responseMiddleware,
);

export { router };
