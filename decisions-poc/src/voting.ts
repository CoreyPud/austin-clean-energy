// Voting-record join (Socrata 3c89-i35a). Supplies per-member vote tallies for the
// PUBLIC items — the minutes give the disposition, this gives who voted how.
// Keyed by `${YYYYMMDD}-${itemNo}`. Note: the voting record omits whole meetings
// (e.g. all of 2026-05-21), so it enriches but never overrides the minutes.
export interface VoteRecord {
  actionTaken: string;
  tally: string | null;
  perMember: { name: string; vote: string }[];
}

const SODA = "https://data.austintexas.gov/resource/3c89-i35a.json";

export async function loadVotes(year: string): Promise<Map<string, VoteRecord>> {
  const url =
    `${SODA}?$select=meeting_date,meeting_item_number,item_id,voter_name,vote_cast,action_taken` +
    `&$where=meeting_date>='${year}-01-01' AND meeting_date<'${Number(year) + 1}-01-01'&$limit=50000`;
  const rows = (await (await fetch(url)).json()) as {
    meeting_date: string;
    meeting_item_number: string;
    voter_name: string;
    vote_cast: string;
    action_taken: string;
  }[];

  const byKey = new Map<string, VoteRecord>();
  for (const r of rows) {
    if (!r.meeting_item_number) continue;
    const key = `${r.meeting_date.slice(0, 10).replace(/-/g, "")}-${Number(r.meeting_item_number)}`;
    let rec = byKey.get(key);
    if (!rec) {
      rec = { actionTaken: r.action_taken, tally: null, perMember: [] };
      byKey.set(key, rec);
    }
    rec.perMember.push({ name: r.voter_name, vote: r.vote_cast });
  }
  // derive tally from per-member votes
  for (const rec of byKey.values()) {
    const yes = rec.perMember.filter((v) => /^yes$/i.test(v.vote)).length;
    const no = rec.perMember.filter((v) => /^no$/i.test(v.vote)).length;
    if (yes + no > 0) rec.tally = `${yes}-${no}`;
  }
  return byKey;
}

export const voteKey = (yyyymmdd: string, itemNo: string) => `${yyyymmdd}-${Number(itemNo)}`;
