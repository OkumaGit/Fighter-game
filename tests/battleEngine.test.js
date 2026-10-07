import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createBattleState,
    startAttack,
    setBlocking,
    setCrouching,
    startDash,
    takeDamage,
    rectangularCollision,
    updateAttackBox,
    getHitPower,
    getBlockPower,
    getDamage
} from '../client/src/javascript/game/battleEngine.js';

const mockFighter1 = {
    _id: '1',
    name: 'Astra',
    health: 45,
    attack: 4,
    defense: 3
};

const mockFighter2 = {
    _id: '2',
    name: 'Kite',
    health: 60,
    attack: 3,
    defense: 1
};

test('createBattleState initializes two fighters correctly', () => {
    const battleState = createBattleState(mockFighter1, mockFighter2);

    assert.ok(battleState.left);
    assert.ok(battleState.right);
    assert.equal(battleState.left.name, 'Astra');
    assert.equal(battleState.right.name, 'Kite');
    assert.equal(battleState.left.health, 100);
    assert.equal(battleState.right.health, 100);
    assert.equal(battleState.left.state, 'idle');
    assert.equal(battleState.right.state, 'idle');
    assert.equal(battleState.left.superMeter, 0);
    assert.equal(battleState.right.superMeter, 0);
});

test('startAttack sets attack state and scales damage by attack stat', () => {
    const battleState = createBattleState(mockFighter1, mockFighter2);
    const updatedLeft = startAttack(battleState.left, 'jab');

    assert.equal(updatedLeft.isAttacking, true);
    assert.equal(updatedLeft.state, 'jab');
    assert.equal(updatedLeft.attackType, 'jab');
    // Base jab damage: 6.5. Astra attack: 4 -> multiplier: 1 + (4-3)*0.08 = 1.08 -> 6.5 * 1.08 = 7.02 -> 7.0
    assert.ok(updatedLeft.damage >= 6.5);

    const updatedRight = startAttack(battleState.right, 'kick');
    assert.equal(updatedRight.isAttacking, true);
    assert.equal(updatedRight.state, 'kick');
    // Base kick damage: 11.5. Kite attack: 3 -> multiplier: 1.0 -> 11.5
    assert.equal(updatedRight.damage, 11.5);
});

test('setBlocking transitions fighter to block state and prevents air block', () => {
    const battleState = createBattleState(mockFighter1, mockFighter2);
    battleState.left.isGrounded = true;

    const blockingFighter = setBlocking(battleState.left, true);
    assert.equal(blockingFighter.isBlocking, true);
    assert.equal(blockingFighter.state, 'block');

    const unblockingFighter = setBlocking(blockingFighter, false);
    assert.equal(unblockingFighter.isBlocking, false);
    assert.equal(unblockingFighter.state, 'idle');

    // Cannot block in air
    const airborneFighter = { ...battleState.left, isGrounded: false, isBlocking: false };
    const triedAirBlock = setBlocking(airborneFighter, true);
    assert.equal(triedAirBlock.isBlocking, false);
});

test('setCrouching toggles sweep pose and state', () => {
    const battleState = createBattleState(mockFighter1, mockFighter2);
    const crouchingFighter = setCrouching(battleState.left, true);

    assert.equal(crouchingFighter.isCrouching, true);
    assert.equal(crouchingFighter.state, 'sweep');

    const uncrouchedFighter = setCrouching(crouchingFighter, false);
    assert.equal(uncrouchedFighter.isCrouching, false);
    assert.equal(uncrouchedFighter.state, 'idle');
});

test('startDash sets dashTimer and velocity', () => {
    const battleState = createBattleState(mockFighter1, mockFighter2);
    battleState.left.isGrounded = true;

    const dashedFighter = startDash(battleState.left, 1);
    assert.equal(dashedFighter.isDashing, true);
    assert.ok(dashedFighter.dashTimer > 0);
    assert.ok(dashedFighter.velocity.x > 0);
});

test('takeDamage correctly reduces HP and never drops below zero', () => {
    const battleState = createBattleState(mockFighter1, mockFighter2);

    const damagedFighter = takeDamage(battleState.left, 20);
    assert.ok(damagedFighter.health < 100);
    assert.equal(damagedFighter.state, 'hit');

    // Overkill damage should clamp at exactly 0 HP
    const deadFighter = takeDamage(damagedFighter, 500);
    assert.equal(deadFighter.health, 0);
    assert.ok(deadFighter.health >= 0);
    assert.equal(deadFighter.state, 'fall'); // Knockdown on fatal
});

test('takeDamage applies block reduction', () => {
    const battleState = createBattleState(mockFighter1, mockFighter2);
    const regularHit = takeDamage(battleState.left, 20);

    const blockingFighter = { ...battleState.left, isBlocking: true };
    const blockedHit = takeDamage(blockingFighter, 20);

    assert.equal(blockedHit.wasBlocking, true);
    assert.ok(blockedHit.damageTaken < regularHit.damageTaken);
});

test('takeDamage takes defender defense stat into account', () => {
    const highDefFighter = { ...mockFighter1, health: 100, defense: 4, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } };
    const lowDefFighter = { ...mockFighter2, health: 100, defense: 1, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } };

    const highDefResult = takeDamage(highDefFighter, 20);
    const lowDefResult = takeDamage(lowDefFighter, 20);

    assert.ok(highDefResult.damageTaken < lowDefResult.damageTaken);
});

test('takeDamage recognizes unblockable attacks (throw)', () => {
    const blockingFighter = { ...mockFighter1, health: 100, isBlocking: true, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } };
    const throwResult = takeDamage(blockingFighter, 20, 0, { isUnblockable: true });

    assert.equal(throwResult.wasBlocking, false);
    assert.equal(throwResult.state, 'fall');
});

test('rectangularCollision detects overlapping rectangles', () => {
    const box1 = { position: { x: 100, y: 100 }, width: 50, height: 50 };
    const box2 = { position: { x: 120, y: 120 }, width: 50, height: 50 };
    const box3 = { position: { x: 300, y: 300 }, width: 50, height: 50 };

    assert.equal(rectangularCollision({ rectangle1: box1, rectangle2: box2 }), true);
    assert.equal(rectangularCollision({ rectangle1: box1, rectangle2: box3 }), false);
});

test('updateAttackBox updates box positions for left and right orientations', () => {
    const battleState = createBattleState(mockFighter1, mockFighter2);
    battleState.left.position = { x: 100, y: 200 };
    battleState.left.facingLeft = false;

    updateAttackBox(battleState.left);
    assert.ok(battleState.left.attackBox.position.x > battleState.left.position.x);

    battleState.left.facingLeft = true;
    updateAttackBox(battleState.left);
    assert.ok(battleState.left.attackBox.position.x < battleState.left.bodyBox.position.x + 15);
});

test('hitPower and blockPower return positive values', () => {
    const hitPower = getHitPower(mockFighter1);
    const blockPower = getBlockPower(mockFighter1);

    assert.ok(hitPower > 0);
    assert.ok(blockPower > 0);
});

test('getDamage computes positive or zero damage', () => {
    const damage = getDamage(mockFighter1, mockFighter2);
    assert.ok(damage >= 0);
});

