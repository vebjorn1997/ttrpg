import type { FeatRequirement } from '../../lib/feat-requirements';
import { loadCsv } from './loadCsv';

/** Structured prerequisites keyed by feat name (canonical catalog spelling). */
const requirementsByName: Record<string, FeatRequirement> = {
  'Take Aim': { type: 'skill', skill: 'Gun Combat', minLevel: 1 },
  Disengage: { type: 'skill', skill: 'Melee', minLevel: 1 },
  Grapple: { type: 'skill', skill: 'Melee', minLevel: 1 },
  Disarm: {
    type: 'any',
    of: [
      { type: 'skill', skill: 'Melee', minLevel: 1 },
      { type: 'skill', skill: 'Gun Combat', minLevel: 2 },
    ],
  },
  Charge: { type: 'skill', skill: 'Melee', minLevel: 1 },
  'Called Shot': { type: 'skill', skill: 'Gun Combat', minLevel: 1 },
  'Called Shot (Adv.)': {
    type: 'all',
    of: [
      { type: 'feat', feat: 'Called Shot' },
      { type: 'skill', skill: 'Gun Combat', minLevel: 3 },
    ],
  },
  'Inspiring Speech': {
    type: 'any',
    of: [
      { type: 'skill', skill: 'Tactics', minLevel: 0 },
      { type: 'skill', skill: 'Leadership', minLevel: 0 },
    ],
  },
  'Sustained Fire': { type: 'skill', skill: 'Gun Combat', minLevel: 2 },
  Overwatch: { type: 'skill', skill: 'Gun Combat', minLevel: 2 },
  'Controlled Burst': { type: 'skill', skill: 'Gun Combat', minLevel: 2 },
  'Experienced Brawler': { type: 'totalSkills', min: 10 },
  Duelist: { type: 'skill', skill: 'Melee', minLevel: 1 },
  'Dive for Cover': { type: 'skill', skill: 'Athletics', minLevel: 1 },
  Opportunist: { type: 'skill', skill: 'Melee', minLevel: 1 },
  'Friendly Face': { type: 'skill', skill: 'Carouse', minLevel: 1 },
  Smuggler: {
    type: 'all',
    of: [
      { type: 'skill', skill: 'Broker', minLevel: 1 },
      { type: 'skill', skill: 'Deception', minLevel: 1 },
    ],
  },
  'Experienced Smuggler': {
    type: 'all',
    of: [
      { type: 'feat', feat: 'Smuggler' },
      { type: 'skill', skill: 'Deception', minLevel: 2 },
      { type: 'skill', skill: 'Broker', minLevel: 2 },
    ],
  },
  'Bureaucratic Shortcut': { type: 'skill', skill: 'Admin', minLevel: 1 },
  'Know a Guy': { type: 'skill', skill: 'Streetwise', minLevel: 1 },
  'Legal Objection': { type: 'skill', skill: 'Advocate', minLevel: 2 },
  Polyglot: { type: 'skill', skill: 'Language', minLevel: 0 },
  'Quick Hack': { type: 'skill', skill: 'Electronics', minLevel: 1 },
  'Combat Hack': { type: 'skill', skill: 'Electronics', minLevel: 2 },
  'Divide and Conquer': { type: 'skill', skill: 'Persuade', minLevel: 1 },
  'Diplomatic Gambit': { type: 'skill', skill: 'Diplomat', minLevel: 1 },
  'Keen Eye': {
    type: 'any',
    of: [
      { type: 'skill', skill: 'Recon', minLevel: 0 },
      { type: 'totalSkills', min: 10 },
    ],
  },
  'Combat Sprint': { type: 'skill', skill: 'Athletics', minLevel: 2 },
  'Count the Odds': { type: 'skill', skill: 'Gambling', minLevel: 1 },
  'Convincing Argument': { type: 'skill', skill: 'Persuade', minLevel: 2 },
}

const feats = loadCsv('feats.csv', import.meta.url).map((row) => ({
  name: row.name,
  type: row.type,
  prerequisites: row.prerequisites || null,
  requirements: requirementsByName[row.name] ?? null,
  cost: row.cost,
  description: row.description,
}))

export default feats
