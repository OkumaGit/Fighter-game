import { Router } from "express";
import { fighterService } from "../services/fighterService.js";
import { responseMiddleware } from "../middlewares/response.middleware.js";
import {
  createFighterValid,
  updateFighterValid,
} from "../middlewares/fighter.validation.middleware.js";

const router = Router();

router.get(
  "/",
  (req, res, next) => {
    try {
      res.data = fighterService.getAll();
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
      const item = fighterService.getOne(req.params.id);
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
  createFighterValid,
  (req, res, next) => {
    try {
      const created = fighterService.create(req.body);
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
  updateFighterValid,
  (req, res, next) => {
    try {
      const updated = fighterService.update(req.params.id, req.body);
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
      const deleted = fighterService.delete(req.params.id);
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
