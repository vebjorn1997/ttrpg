import { loadCsv } from "./loadCsv";

const languages = loadCsv("languages.csv", import.meta.url).map((row) => ({
    name: row.name,
    description: row.description,
}));

export default languages;
