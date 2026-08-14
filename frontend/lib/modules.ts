import {
  Activity,
  Award,
  BookOpen,
  Briefcase,
  ClipboardList,
  Crosshair,
  Cpu,
  Flag,
  Gavel,
  Globe2,
  HeartPulse,
  Languages,
  Rocket,
  ScrollText,
  Store,
  Skull,
  Swords,
  Tags,
  UserSquare,
  Users,
  type LucideIcon,
} from "lucide-react"

import type { ModuleId } from "@/lib/api-types"

/** Signal colour assigned to each subsystem, used for borders/badges/icons. */
export type Accent = "ochre" | "signal" | "oxide" | "viridian"

export type DataModule = {
  id: ModuleId
  /** Short designation shown in the console chrome, e.g. "ACT". */
  code: string
  title: string
  /** Frontend route. */
  href: string
  /** Backend route this page reads from. */
  endpoint: string
  /** One-line description for dashboard tiles. */
  synopsis: string
  /** Longer description for the page header. */
  detail: string
  /** Noun for a single row, e.g. "action". */
  unit: string
  /** Plural of `unit`; spelled out because several are irregular. */
  units: string
  icon: LucideIcon
  accent: Accent
  /**
   * Who can see this module in nav / dashboard.
   * - public: everyone
   * - authenticated: any signed-in user
   * - admin: admin role only
   */
  access: "public" | "authenticated" | "admin"
}

export const dataModules: DataModule[] = [
  {
    id: "actions",
    code: "ACT",
    title: "Actions & Reactions",
    href: "/actions",
    endpoint: "/actions",
    synopsis: "Turn economy: every action by cost, plus the reaction list.",
    detail:
      "Each combatant spends three action points per turn and may take a single reaction per round. Costs below are the action point price; reactions cost nothing but consume your one reaction.",
    unit: "action",
    units: "actions",
    icon: Swords,
    accent: "ochre",
    access: "public",
  },
  {
    id: "conditions",
    code: "CND",
    title: "Conditions",
    href: "/conditions",
    endpoint: "/conditions",
    synopsis: "Status effects, cover states and the rules they impose.",
    detail:
      "Conditions stack unless a description says otherwise. Values written with an X — Stunned X, Fatigued X — scale with whatever inflicted them.",
    unit: "condition",
    units: "conditions",
    icon: Activity,
    accent: "signal",
    access: "public",
  },
  {
    id: "called-shots",
    code: "CLS",
    title: "Called Shots",
    href: "/called-shots",
    endpoint: "/called-shots",
    synopsis: "Hit locations with their action cost and to-hit penalty.",
    detail:
      "Called shots trade accuracy for effect. Pay the action cost, accept the penalty to your attack roll, and apply the location effect on a hit.",
    unit: "location",
    units: "locations",
    icon: Crosshair,
    accent: "oxide",
    access: "public",
  },
  {
    id: "critical-injuries",
    code: "CRT",
    title: "Critical Injuries",
    href: "/critical-injuries",
    endpoint: "/critical-injury",
    synopsis: "Lasting wounds, grouped by the characteristic they cripple.",
    detail:
      "When a characteristic is driven to zero, roll a critical injury against it. These persist until properly treated — first aid will not clear them.",
    unit: "injury",
    units: "injuries",
    icon: Skull,
    accent: "oxide",
    access: "public",
  },
  {
    id: "healing",
    code: "MED",
    title: "Healing & Medical",
    href: "/healing",
    endpoint: "/healing",
    synopsis: "Recovery procedures and what each one costs in time or care.",
    detail:
      "Recovery methods do not combine: a patient under hospital care does not also gain natural healing for that day.",
    unit: "procedure",
    units: "procedures",
    icon: HeartPulse,
    accent: "viridian",
    access: "public",
  },
  {
    id: "feats",
    code: "FTS",
    title: "Feats",
    href: "/feats",
    endpoint: "/feats",
    synopsis: "Combat and general feats with their skill prerequisites.",
    detail:
      "Most combat feats unlock an action you otherwise cannot take. General feats grant out-of-combat leverage. Prerequisites list the minimum skill level required.",
    unit: "feat",
    units: "feats",
    icon: Award,
    accent: "ochre",
    access: "public",
  },
  {
    id: "skills",
    code: "SKL",
    title: "Skills",
    href: "/skills",
    endpoint: "/skills",
    synopsis: "Core skill list grouped by primary characteristic.",
    detail:
      "Each skill checks against a primary characteristic. Untrained use typically applies a penalty — Jack of All Trades softens that for skills you do not have.",
    unit: "skill",
    units: "skills",
    icon: BookOpen,
    accent: "viridian",
    access: "public",
  },
  {
    id: "tl",
    code: "TL",
    title: "Tech Levels",
    href: "/tl",
    endpoint: "/tl",
    synopsis: "Civilisation bands from primitive tools through late interstellar tech.",
    detail:
      "Tech level rates a world's industrial and scientific capability. Gear, ships, and infrastructure are tagged with the TL needed to build or maintain them.",
    unit: "tech level",
    units: "tech levels",
    icon: Cpu,
    accent: "signal",
    access: "public",
  },
  {
    id: "languages",
    code: "LNG",
    title: "Languages",
    href: "/languages",
    endpoint: "/languages",
    synopsis: "Trade tongues, high speech, and obscure ancient dialects.",
    detail:
      "Most travellers get by in Common. High Gothic, Vrang, and Ancient mark status, species, or specialist knowledge.",
    unit: "language",
    units: "languages",
    icon: Languages,
    accent: "viridian",
    access: "public",
  },
  {
    id: "lawlevel",
    code: "LAW",
    title: "Law Levels",
    href: "/lawlevel",
    endpoint: "/lawlevel",
    synopsis: "How tightly a port or world polices movement, cargo and arms.",
    detail:
      "Law level sets expectations for customs, checkpoints, and what you can openly carry. Higher bands mean more paperwork and less free travel.",
    unit: "law level",
    units: "law levels",
    icon: Gavel,
    accent: "oxide",
    access: "public",
  },
  {
    id: "miscellaneous",
    code: "MSC",
    title: "Miscellaneous Rules",
    href: "/miscellaneous",
    endpoint: "/miscellaneous",
    synopsis: "Port procedures and other loops that sit outside combat and the catalogs.",
    detail:
      "Rules that are a procedure more than a list: smuggling through customs, greasing an official, and similar out-of-combat loops. Open an entry for the full sequence; tables live inside the text as reference, not as the page.",
    unit: "rule",
    units: "rules",
    icon: ScrollText,
    accent: "oxide",
    access: "public",
  },
  {
    id: "equipment",
    code: "BLK",
    title: "Black Market Emporium",
    href: "/emporium",
    endpoint: "/equipment",
    synopsis: "Off-books wares: guns, drugs, drones, and whatever else fell off a pallet.",
    detail:
      "No receipts, no questions. Browse by type — pistols, rifles, drones, explosives, and the rest of the kit that does not go through customs. Cost, TL, damage, magazine and range sit on each listing. Lift what you need onto a character sheet.",
    unit: "listing",
    units: "wares",
    icon: Store,
    accent: "oxide",
    access: "public",
  },
  {
    id: "npcs",
    code: "NPC",
    title: "NPC Catalog",
    href: "/npcs",
    endpoint: "/npc-catalog",
    synopsis: "Ready-to-run stat blocks with movement, hits, armour and features.",
    detail:
      "Rank traits set expectations: Normal opponents carry one or two features, Elites up to five, Legendary any number.",
    unit: "NPC",
    units: "NPCs",
    icon: Users,
    accent: "signal",
    access: "admin",
  },
  {
    id: "traits",
    code: "TRT",
    title: "Traits Index",
    href: "/traits",
    endpoint: "/traits",
    synopsis: "Shared tag glossary typed for weapons, NPCs and planets.",
    detail:
      "Traits are the vocabulary the rest of the system reuses. Each trait is typed Weapon, NPC, or Planet so the right catalog can pull it.",
    unit: "trait",
    units: "traits",
    icon: Tags,
    accent: "viridian",
    access: "public",
  },
  {
    id: "systems",
    code: "SYS",
    title: "Systems Database",
    href: "/systems",
    endpoint: "/systems",
    synopsis: "Every charted world: hex, tech and law level, hooks and history.",
    detail:
      "The master registry of star systems. World profile — starport class, gravity, travel zone — is carried by traits rather than a UWP string. Each system keeps its own adventure hooks, traveller log, timeline, and the web of factions, people and ships tied to it.",
    unit: "system",
    units: "systems",
    icon: Globe2,
    accent: "signal",
    access: "public",
  },
  {
    id: "factions",
    code: "FAC",
    title: "Factions",
    href: "/factions",
    endpoint: "/factions",
    synopsis: "Governments, corporations, cults and gangs, with reach and goals.",
    detail:
      "Factions exist independently of any one world and can hold a presence in many systems at once. Tier rates reach, from a local gang at 1 to a sector-spanning power at 5.",
    unit: "faction",
    units: "factions",
    icon: Flag,
    accent: "oxide",
    access: "public",
  },
  {
    id: "campaign-npcs",
    code: "CST",
    title: "Cast",
    href: "/campaign-npcs",
    endpoint: "/campaign-npcs",
    synopsis: "Named campaign characters: who they serve and where they are now.",
    detail:
      "The people the crew actually deals with, as distinct from the NPC stat-block catalog. Each one tracks an occupation, allegiance and last known whereabouts; species and other tags live on traits.",
    unit: "character",
    units: "characters",
    icon: UserSquare,
    accent: "viridian",
    access: "public",
  },
  {
    id: "ships",
    code: "SHP",
    title: "Ship Registry",
    href: "/ships",
    endpoint: "/ships",
    synopsis: "Known vessels, their owners, and where they were last seen.",
    detail:
      "Named hulls with transponder codes and owners. A ship's visits to each system are logged on that system's Relationships tab.",
    unit: "ship",
    units: "ships",
    icon: Rocket,
    accent: "signal",
    access: "public",
  },
  {
    id: "patrons",
    code: "PTR",
    title: "Patrons",
    href: "/patrons",
    endpoint: "/patrons",
    synopsis: "Who is hiring, what they pay, and whether they pay at all.",
    detail:
      "A patron is a campaign character in a hiring role. Reputation runs from -5 for a proven backstabber to +5 for someone who has never once shorted a crew.",
    unit: "patron",
    units: "patrons",
    icon: Briefcase,
    accent: "ochre",
    access: "public",
  },
  {
    id: "characters",
    code: "CHR",
    title: "Character Sheets",
    href: "/characters",
    endpoint: "/characters",
    synopsis: "Player sheets: characteristics, skills, armour and gear.",
    detail:
      "Shared sheets for the table. Physical characteristics track current and max — damage lowers current, and a stat at zero means a critical injury.",
    unit: "character",
    units: "characters",
    icon: ClipboardList,
    accent: "ochre",
    access: "authenticated",
  },
]

export const moduleById = Object.fromEntries(
  dataModules.map((module) => [module.id, module])
) as Record<ModuleId, DataModule>

export function getModule(id: ModuleId): DataModule {
  return moduleById[id]
}

export function modulesVisibleTo(
  role: "admin" | "player" | null
): DataModule[] {
  return dataModules.filter((module) => {
    if (module.access === "public") return true
    if (module.access === "authenticated") return role != null
    return role === "admin"
  })
}

/** Tailwind class sets per accent, kept static so they survive purging. */
export const accentClasses: Record<
  Accent,
  {
    text: string
    border: string
    hoverBorder: string
    bg: string
    hoverBg: string
    dot: string
    glow: string
  }
> = {
  ochre: {
    text: "text-ochre",
    border: "border-ochre/45",
    hoverBorder: "hover:border-ochre/70",
    bg: "bg-ochre/10",
    hoverBg: "hover:bg-ochre/18 focus-visible:bg-ochre/18",
    dot: "bg-ochre",
    glow: "hover:shadow-[0_0_2.5rem_-1rem_var(--ochre)]",
  },
  signal: {
    text: "text-signal",
    border: "border-signal/45",
    hoverBorder: "hover:border-signal/70",
    bg: "bg-signal/10",
    hoverBg: "hover:bg-signal/18 focus-visible:bg-signal/18",
    dot: "bg-signal",
    glow: "hover:shadow-[0_0_2.5rem_-1rem_var(--signal)]",
  },
  oxide: {
    text: "text-oxide",
    border: "border-oxide/45",
    hoverBorder: "hover:border-oxide/70",
    bg: "bg-oxide/10",
    hoverBg: "hover:bg-oxide/18 focus-visible:bg-oxide/18",
    dot: "bg-oxide",
    glow: "hover:shadow-[0_0_2.5rem_-1rem_var(--oxide)]",
  },
  viridian: {
    text: "text-viridian",
    border: "border-viridian/45",
    hoverBorder: "hover:border-viridian/70",
    bg: "bg-viridian/10",
    hoverBg: "hover:bg-viridian/18 focus-visible:bg-viridian/18",
    dot: "bg-viridian",
    glow: "hover:shadow-[0_0_2.5rem_-1rem_var(--viridian)]",
  },
}
