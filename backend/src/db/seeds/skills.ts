import { loadCsv } from "./loadCsv";

const skills = loadCsv('skills.csv', import.meta.url).map((row) => ({
    name: row.name,
    description: row.description,
    primaryCharacteristic: row.primaryCharacteristic.toUpperCase(),
}));

export default skills;