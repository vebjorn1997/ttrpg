import { loadCsv } from './loadCsv';

const calledShots = loadCsv('calledShots.csv', import.meta.url).map((row) => ({
    location: row.location,
    cost: Number(row.cost),
    penalty: Number(row.penalty),
    description: row.description,
}));

export default calledShots;
