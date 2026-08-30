import { useEffect, useRef, useState } from "react";
import "./arena.css";
import { getFighterSource } from "../../constants/fighterAssets";

const controls = {
  PlayerOneAttack: "KeyA",
  PlayerOneBlock: "KeyD",
  PlayerTwoAttack: "KeyJ",
  PlayerTwoBlock: "KeyL",
  PlayerOneCriticalHitCombination: ["KeyQ", "KeyW", "KeyE"],
  PlayerTwoCriticalHitCombination: ["KeyU", "KeyI", "KeyO"],
};

function getSource(fighter, fallbackIndex = 0) {
  return getFighterSource(fighter, fallbackIndex);
}

function getHitPower(fighter) {
  return (fighter?.power ?? fighter?.attack ?? 0) * (Math.random() + 1);
}

function getBlockPower(fighter) {
  return (fighter?.defense ?? 0) * (Math.random() + 1);
}

function getDamage(attacker, defender) {
  const hitPower = getHitPower(attacker);
  const blockPower = getBlockPower(defender);

  if (blockPower >= hitPower) return 0;
  return Math.round(hitPower - blockPower);
}

export default function Arena({
  fighter1,
  fighter2,
  battleBackground,
  onFinish,
}) {
  const [health1, setHealth1] = useState(fighter1?.health ?? 85);
  const [health2, setHealth2] = useState(fighter2?.health ?? 85);
  const [status, setStatus] = useState(
    "Use A/J to attack, D/L to block, QWE/UIO for critical hits",
  );
  const [winner, setWinner] = useState(null);

  const leftFighterRef = useRef(null);
  const rightFighterRef = useRef(null);
  const stateRef = useRef({
    health1: fighter1?.health ?? 85,
    health2: fighter2?.health ?? 85,
    isBlocking: { left: false, right: false },
    criticalSequence: { left: [], right: [] },
    lastCriticalHit: { left: 0, right: 0 },
    finished: false,
  });

  useEffect(() => {
    if (!fighter1 || !fighter2) return;
    const state = stateRef.current;

    function applyAnimation(element, className, timeout) {
      element?.classList.remove(
        "arena___fighter--hit",
        "arena___fighter--block",
        "arena___fighter--critical",
      );
      element?.classList.add(className);
      window.setTimeout(() => element?.classList.remove(className), timeout);
    }

    const finishFight = (winningFighter) => {
      if (state.finished) return;
      state.finished = true;
      setWinner(winningFighter);
      setStatus(`${winningFighter.name} wins! Returning to start...`);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);

      window.setTimeout(() => {
        onFinish && onFinish({ winner: winningFighter });
      }, 1200);
    };

    const handleKeyDown = (event) => {
      if (state.finished) return;
      const pressedCode =
        event.code || `Key${String(event.key || "").toUpperCase()}`;
      const pressedKey = String(event.key || "").toUpperCase();
      const key = pressedCode;
      const isPlayerOneAttack =
        key === controls.PlayerOneAttack || pressedKey === "A";
      const isPlayerTwoAttack =
        key === controls.PlayerTwoAttack || pressedKey === "J";
      const isPlayerOneBlock =
        key === controls.PlayerOneBlock || pressedKey === "D";
      const isPlayerTwoBlock =
        key === controls.PlayerTwoBlock || pressedKey === "L";

      if (isPlayerOneBlock) {
        state.isBlocking.left = true;
        setStatus("Player 1 blocking");
        applyAnimation(leftFighterRef.current, "arena___fighter--block", 220);
        return;
      }

      if (isPlayerTwoBlock) {
        state.isBlocking.right = true;
        setStatus("Player 2 blocking");
        applyAnimation(rightFighterRef.current, "arena___fighter--block", 220);
        return;
      }

      if (isPlayerOneAttack || isPlayerTwoAttack) {
        const attacker = isPlayerOneAttack ? fighter1 : fighter2;
        const defender = isPlayerOneAttack ? fighter2 : fighter1;
        const defenderFighter = isPlayerOneAttack
          ? rightFighterRef.current
          : leftFighterRef.current;

        if (
          (isPlayerOneAttack && state.isBlocking.right) ||
          (isPlayerTwoAttack && state.isBlocking.left)
        ) {
          setStatus("Attack blocked");
          return;
        }

        const damage = getDamage(attacker, defender);
        if (isPlayerOneAttack) {
          state.health2 = Math.max(0, state.health2 - damage);
          setHealth2(state.health2);
        } else {
          state.health1 = Math.max(0, state.health1 - damage);
          setHealth1(state.health1);
        }

        setStatus(`${attacker.name} hit ${defender.name} for ${damage}`);
        applyAnimation(defenderFighter, "arena___fighter--hit", 260);

        if (state.health1 <= 0 || state.health2 <= 0) {
          finishFight(state.health1 > 0 ? fighter1 : fighter2);
        }
      }

      const oneCombo = controls.PlayerOneCriticalHitCombination;
      const twoCombo = controls.PlayerTwoCriticalHitCombination;
      let side = null;
      let combo = null;

      if (oneCombo.includes(key)) {
        side = "left";
        combo = oneCombo;
      } else if (twoCombo.includes(key)) {
        side = "right";
        combo = twoCombo;
      }

      if (side && combo) {
        state.criticalSequence[side].push(key);
        const sequence = state.criticalSequence[side];
        const isComboReady =
          sequence.length >= combo.length &&
          sequence
            .slice(-combo.length)
            .every((value, index) => value === combo[index]);

        if (isComboReady && Date.now() - state.lastCriticalHit[side] >= 10000) {
          const attacker = side === "left" ? fighter1 : fighter2;
          const defenderFighter =
            side === "left" ? rightFighterRef.current : leftFighterRef.current;
          const damage = 2 * (attacker.power ?? attacker.attack ?? 0);

          if (side === "left") {
            state.health2 = Math.max(0, state.health2 - damage);
            setHealth2(state.health2);
          } else {
            state.health1 = Math.max(0, state.health1 - damage);
            setHealth1(state.health1);
          }

          state.lastCriticalHit[side] = Date.now();
          state.criticalSequence[side] = [];
          setStatus(`${attacker.name} landed a critical hit!`);
          applyAnimation(defenderFighter, "arena___fighter--critical", 340);

          if (state.health1 <= 0 || state.health2 <= 0) {
            finishFight(state.health1 > 0 ? fighter1 : fighter2);
          }
        }
      }
    };

    const handleKeyUp = (event) => {
      const pressedCode =
        event.code || `Key${String(event.key || "").toUpperCase()}`;
      const pressedKey = String(event.key || "").toUpperCase();

      if (pressedCode === controls.PlayerOneBlock || pressedKey === "D") {
        state.isBlocking.left = false;
      }

      if (pressedCode === controls.PlayerTwoBlock || pressedKey === "L") {
        state.isBlocking.right = false;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [fighter1, fighter2, onFinish]);

  if (!fighter1 || !fighter2) {
    return null;
  }

  const maxHealth1 = fighter1?.health ?? 85;
  const maxHealth2 = fighter2?.health ?? 85;
  const healthPercent1 = Math.max(0, (health1 / maxHealth1) * 100);
  const healthPercent2 = Math.max(0, (health2 / maxHealth2) * 100);

  return (
    <div className="arena___root" data-background={battleBackground?.key}>
      {battleBackground && (
        <img
          className="arena___background-image"
          src={battleBackground.src}
          alt=""
          aria-hidden="true"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
      <div className="arena___fight-status">
        <div className="arena___fighter-indicator">
          <span className="arena___fighter-name">{fighter1.name}</span>
          <div className="arena___health-indicator">
            <div
              className="arena___health-bar"
              style={{ width: `${healthPercent1}%` }}
              id="left-fighter-indicator"
            />
          </div>
        </div>
        <div className="arena___versus-sign">VS</div>
        <div className="arena___fighter-indicator">
          <span className="arena___fighter-name">{fighter2.name}</span>
          <div className="arena___health-indicator">
            <div
              className="arena___health-bar"
              style={{ width: `${healthPercent2}%` }}
              id="right-fighter-indicator"
            />
          </div>
        </div>
      </div>

      <div className="arena___battlefield">
        <div
          className="arena___fighter arena___left-fighter"
          ref={leftFighterRef}
          data-position="left"
        >
          <div className="arena___fighter-image-wrapper">
            <img src={getSource(fighter1, 0)} alt={fighter1.name} />
          </div>
        </div>
        <div
          className="arena___fighter arena___right-fighter"
          ref={rightFighterRef}
          data-position="right"
        >
          <div className="arena___fighter-image-wrapper">
            <img src={getSource(fighter2, 1)} alt={fighter2.name} />
          </div>
        </div>
      </div>

      <div className="arena___controls">
        <div className="arena___control-item">
          <strong>Player 1</strong>
          <div>A — Attack</div>
          <div>D — Block</div>
          <div>Q → W → E — Critical</div>
        </div>
        <div className="arena___control-item">
          <strong>Player 2</strong>
          <div>J — Attack</div>
          <div>L — Block</div>
          <div>U → I → O — Critical</div>
        </div>
        <div className="arena___control-item">
          <strong>Status</strong>
          <div>{status}</div>
        </div>
      </div>

      {winner && (
        <div className="arena___winner-banner">{winner.name} wins!</div>
      )}
    </div>
  );
}
