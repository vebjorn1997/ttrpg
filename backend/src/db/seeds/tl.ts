import { loadCsv } from "./loadCsv";

const tl = loadCsv("tl.csv", import.meta.url).map((row) => ({
    name: row.name,
    level: Number(row.level),
    description: row.description,
}));

export default tl;
