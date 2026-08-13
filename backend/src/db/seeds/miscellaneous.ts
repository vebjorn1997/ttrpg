const smuggling = [
    "Smuggling is a port procedure, not a single roll. It hangs on two values: **Law Level** (what the world will tolerate in the open) and **Cover** (the story you invent for whatever should not be there).",
    "**Law Level** is assigned to every station, planet, or other point of interest. **Cover** is produced when you try to walk restricted goods through customs — fake permits, a forged manifest, a plausible reason the crate is empty.",
    "**The loop:**",
    "- Compare the highest weapons classification in your cargo or on your person to the world's Law Level.",
    "- If that classification is at or below Law Level, the goods are legal. No smuggling check.",
    "- If it is above Law Level, the goods are restricted. You need a Cover Story.",
    "- Roll Admin (file legitimate-looking permits) or Deception (forgery) to set a Cover Story Rating.",
    "- If the rating is at or above Law Level, you clear customs. No inspection.",
    "- If the rating is below Law Level, inspection is triggered. **Bribery**, or Face the Consequences.",
    "**Cover Story Rating:**",
    "- **Crit Fail (0) — Flagged.** Customs knows something is wrong. Immediate inspection or detention.",
    "- **Fail (1) — Shaky.** The manifest has holes. Inspection is triggered.",
    "- **Success (2) — Plausible.** Looks fine at a glance.",
    "- **Crit Success (3) — Ironclad.** Stolen genuine credentials or a masterwork forgery.",
    "**Face the Consequences** (by Law Level):",
    "- **Frontier (1):** Fine equal to **20% of cargo value**. Restricted goods confiscated.",
    "- **Standard (2):** Fine equal to **50% of cargo value**. Confiscation. **1d6 days** detention. Advocate check (DM 8+) to avoid a record.",
    "- **Security State (3):** **Total confiscation.** **2d6 weeks** detention. Permanent criminal record in the system.",
    "- **Lockdown (4):** Immediate arrest. Interrogation. Indefinite detention or execution without outside intervention.",
].join("<br>")

const bribery = [
    "Travellers always need to bribe someone. Bribery is the fallback when a Cover Story fails inspection, and the tool you reach for whenever an official is standing between you and the outcome you want.",
    "**Finding the right person:** roll Streetwise or Broker against Cover Story DM — normally **DM 4 + Law Level**. Fail, and you Face the Consequences.",
    "**Making the offer:** once you have the person, roll Persuade or Carouse against **DM 6 + Law Level**. Success means they take the money and look the other way. Fail, and you Face the Consequences.",
    "**Cost** is always the higher of the flat fee or the cargo percentage:",
    "- **Frontier (LL 1):** 1000cr, or 10% of cargo value.",
    "- **Standard (LL 2):** 5000cr, or 20% of cargo value.",
    "- **Security State (LL 3):** 10000cr, or 50% of cargo value.",
    "- **Lockdown (LL 4):** 50000cr, or 75% of cargo value.",
].join("<br>")

const miscellaneous = [
    { name: "Smuggling", sort: 0, description: smuggling },
    { name: "Bribery", sort: 1, description: bribery },
]

export default miscellaneous
