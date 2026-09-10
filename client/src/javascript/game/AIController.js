/**
 * AI Controller alias module.
 * Provides offline deterministic/heuristic bot controller for Player 2.
 */

import createBotController, { DIFFICULTY_PROFILES } from './botController';

export { DIFFICULTY_PROFILES, createBotController };

export class AIController {
    constructor(side = 'right', options = {}) {
        this.controller = createBotController(side, options);
    }

    update(...args) {
        return this.controller.update(...args);
    }

    getMovement() {
        return this.controller.getMovement();
    }

    isBlockingState() {
        return this.controller.isBlockingState();
    }

    reset() {
        return this.controller.reset();
    }
}

export default createBotController;
