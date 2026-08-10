import { loadCsv } from './loadCsv';

const criticalInjury = loadCsv('criticalInjury.csv', import.meta.url).map((row) => ({
    characteristic: row.characteristic,
    name: row.name,
    description: row.description,
}));

export default criticalInjury;
