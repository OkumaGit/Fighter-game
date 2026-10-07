import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getTowerLadderForChampion,
    getStageProfile,
    getStageOpponentId,
    createTowerRun,
    TOWER_STAGE_PROFILES
} from '../client/src/javascript/game/arcadeManager.js';
import createBotController, { DIFFICULTY_PROFILES } from '../client/src/javascript/game/botController.js';
import {
    SPECIAL_MOVES,
    getFighterSpecialMove,
    startAttack,
    takeDamage,
    rectangularCollision
} from '../client/src/javascript/game/battleEngine.js';

test('arcadeManager: getTowerLadderForChampion places champion mirror match as final boss', () => {
    const ladder1 = getTowerLadderForChampion('1');
    assert.equal(ladder1.length, 6);
    assert.equal(ladder1[5], '1'); // Stage 6 is mirror match
    assert.deepEqual(new Set(ladder1).size, 6); // All 6 unique fighters

    const ladder3 = getTowerLadderForChampion('3');
    assert.equal(ladder3[5], '3');
    assert.ok(!ladder3.slice(0, 5).includes('3'));
});

test('arcadeManager: createTowerRun initializes new run correctly', () => {
    const champ = { _id: '3', name: 'Vex' };
    const run = createTowerRun(champ);

    assert.equal(run.currentStageIndex, 0);
    assert.equal(run.totalStages, 6);
    assert.equal(run.isFinished, false);
    assert.equal(run.isVictorious, false);
    assert.equal(run.champion.name, 'Vex');
});

test('arcadeManager: stage profiles ramp difficulty smoothly', () => {
    assert.equal(TOWER_STAGE_PROFILES.length, 6);
    for (let i = 0; i < TOWER_STAGE_PROFILES.length; i += 1) {
        const profile = getStageProfile(i);
        assert.ok(profile.reactionDelay > 0);
        assert.ok(profile.attackProbability > 0 && profile.attackProbability <= 1);
        if (i > 0) {
            const prev = getStageProfile(i - 1);
            // Reaction delay decreases (faster AI), attack probability increases
            assert.ok(profile.reactionDelay <= prev.reactionDelay);
            assert.ok(profile.attackProbability >= prev.attackProbability);
        }
    }
    assert.equal(getStageProfile(5).isBoss, true);
});

test('botController: initializes and resets cleanly', () => {
    const bot = createBotController('right', { difficulty: 'MEDIUM' });

    assert.equal(bot.getMovement(), 0);
    assert.equal(bot.isBlockingState(), false);
    assert.equal(bot.isCrouchingState(), false);

    bot.reset();
    assert.equal(bot.getMovement(), 0);
    assert.equal(bot.isBlockingState(), false);
});

test('botController: difficulty profiles are valid and ordered', () => {
    assert.ok(DIFFICULTY_PROFILES.EASY.reactionDelay > DIFFICULTY_PROFILES.MEDIUM.reactionDelay);
    assert.ok(DIFFICULTY_PROFILES.MEDIUM.reactionDelay > DIFFICULTY_PROFILES.HARD.reactionDelay);
    assert.ok(DIFFICULTY_PROFILES.EASY.attackProbability < DIFFICULTY_PROFILES.HARD.attackProbability);
});

test('battleEngine: SPECIAL_MOVES defined for all fighters', () => {
    const expected = ['Astra', 'Kite', 'Vex', 'Brute', 'Nova', 'Rift'];
    expected.forEach(name => {
        const move = getFighterSpecialMove({ name });
        assert.ok(move);
        assert.ok(move.name);
        assert.ok(move.damage > 0);
        assert.ok(move.cooldown > 0);
    });
});

test('battleEngine: super attack properties and damage', () => {
    const fighter = {
        position: { x: 100, y: 200 },
        velocity: { x: 0, y: 0 },
        isGrounded: true,
        health: 100,
        attack: 3,
        defense: 3,
        isAttacking: false,
        attackBox: { position: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, width: 100, height: 100 },
        bodyBox: { position: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, width: 100, height: 100 }
    };

    const superFighter = startAttack(fighter, 'super');
    assert.equal(superFighter.isAttacking, true);
    assert.equal(superFighter.state, 'super');
    assert.equal(superFighter.attackType, 'super');
    assert.equal(superFighter.damage, 24); // MK3 unblockable super strike damage
});

test('battleEngine: rectangularCollision corner boundaries', () => {
    const b1 = { position: { x: 0, y: 0 }, width: 50, height: 50 };
    const b2 = { position: { x: 50, y: 50 }, width: 50, height: 50 }; // Touching at corner
    assert.equal(rectangularCollision({ rectangle1: b1, rectangle2: b2 }), true);

    const b3 = { position: { x: 51, y: 50 }, width: 50, height: 50 }; // 1px outside
    assert.equal(rectangularCollision({ rectangle1: b1, rectangle2: b3 }), false);
});

import { getBattleSpriteConfig } from '../client/src/javascript/helpers/fighterAssets.js';

test('fighterAssets: getBattleSpriteConfig configures Vex super targetCenters', () => {
    const vexConfig = getBattleSpriteConfig({ _id: '3', name: 'Vex' });
    assert.ok(vexConfig.poses.super);
    assert.ok(Array.isArray(vexConfig.poses.super.targetCenters));
    assert.equal(vexConfig.poses.super.targetCenters.length, 12);
    vexConfig.poses.super.targetCenters.forEach(center => {
        assert.ok(typeof center === 'number');
        assert.ok(center > 0 && center < 820);
    });

    const novaConfig = getBattleSpriteConfig({ _id: '5', name: 'Nova' });
    assert.equal(novaConfig.poses.super.frameWidth, 1160);
    assert.equal(novaConfig.poses.super.targetCenterX, 510);
    assert.equal(novaConfig.poses.fall.frameWidth, 1000);
    assert.equal(novaConfig.poses.fall.targetCenterX, 500);
    assert.equal(novaConfig.poses.death.frameWidth, 1000);
    assert.equal(novaConfig.poses.death.targetCenterX, 500);

    const astraConfig = getBattleSpriteConfig({ _id: '1', name: 'Astra' });
    assert.equal(astraConfig.poses.super.frameWidth, 820);
    assert.equal(astraConfig.poses.super.targetCenterX, 410);
});



