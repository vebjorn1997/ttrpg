import { loadCsv } from "./loadCsv";

const lawlevel = loadCsv("lawlevel.csv", import.meta.url).map((row) => ({
    lawlevel: Number(row.lawlevel),
    name: row.name,
    description: row.description,
}));

export default lawlevel;
