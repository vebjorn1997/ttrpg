import { loadCsv } from './loadCsv';

type ActionSeed = {
    name: string;
    cost: number;
    type: string;
    description: string;
    requiredFeatName?: string;
};

const actions: ActionSeed[] = loadCsv('actions.csv', import.meta.url).map((row) => {
    const action: ActionSeed = {
        name: row.action,
        cost: Number(row.cost),
        type: row.type,
        description: row.description,
    };

    if (row.requiredFeatName) {
        action.requiredFeatName = row.requiredFeatName;
    }

    return action;
});

export default actions;
