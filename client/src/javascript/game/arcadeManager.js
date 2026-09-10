import fighterService from '../services/fightersService';

const fighterDetailsMap = new Map();

export async function getFighterInfo(fighterId) {
    if (!fighterId) return null;

    if (fighterDetailsMap.has(fighterId)) {
        return fighterDetailsMap.get(fighterId);
    }

    const fighter = await fighterService.getFighterDetails(fighterId);

    if (fighter) {
        fighterDetailsMap.set(fighterId, fighter);
    }

    return fighter ?? null;
}

export const TOWER_LADDER_IDS = ['1', '2', '3', '4', '5', '6'];

export const TOWER_STAGE_PROFILES = [
    {
        stage: 1,
        difficultyName: 'Easy',
        reactionDelay: 600,
        attackProbability: 0.35,
        dodgeProbability: 0.0,
        movementJitter: 0.3,
        isBoss: false
    },
    {
        stage: 2,
        difficultyName: 'Normal-Low',
        reactionDelay: 450,
        attackProbability: 0.5,
        dodgeProbability: 0.1,
        movementJitter: 0.15,
        isBoss: false
    },
    {
        stage: 3,
        difficultyName: 'Medium',
        reactionDelay: 300,
        attackProbability: 0.65,
        dodgeProbability: 0.25,
        movementJitter: 0.08,
        isBoss: false
    },
    {
        stage: 4,
        difficultyName: 'Medium-High',
        reactionDelay: 200,
        attackProbability: 0.8,
        dodgeProbability: 0.4,
        movementJitter: 0.03,
        isBoss: false
    },
    {
        stage: 5,
        difficultyName: 'Hard',
        reactionDelay: 120,
        attackProbability: 0.9,
        dodgeProbability: 0.55,
        movementJitter: 0.0,
        isBoss: false
    },
    {
        stage: 6,
        difficultyName: 'Master (Boss)',
        reactionDelay: 60,
        attackProbability: 0.98,
        dodgeProbability: 0.75,
        movementJitter: 0.0,
        isBoss: true
    }
];

export function getStageProfile(stageIndex) {
    const clampedIndex = Math.max(0, Math.min(TOWER_STAGE_PROFILES.length - 1, stageIndex));
    return TOWER_STAGE_PROFILES[clampedIndex];
}

export function getStageOpponentId(stageIndex) {
    const clampedIndex = Math.max(0, Math.min(TOWER_LADDER_IDS.length - 1, stageIndex));
    return TOWER_LADDER_IDS[clampedIndex];
}

export function createTowerRun(champion) {
    return {
        champion,
        currentStageIndex: 0,
        totalStages: TOWER_LADDER_IDS.length,
        isFinished: false,
        isVictorious: false
    };
}
