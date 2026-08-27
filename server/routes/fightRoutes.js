import { Router } from "express";
import { fightersService } from "../services/fightService.js";
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
      res.data = fightersService.getAll();
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
      const item = fightersService.getOne(req.params.id);
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
  (req, res, next) => {
    try {
      const { fighter1Id, fighter2Id } = req.body || {};
      const created = fightersService.create({ fighter1Id, fighter2Id });
      res.data = created;
    } catch (err) {
      res.err = err;
    } finally {
      next();
    }
  },
  responseMiddleware,
);

export { router };
