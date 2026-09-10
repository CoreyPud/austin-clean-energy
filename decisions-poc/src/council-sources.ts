// Enumerate council regular meetings by probing Thursdays (independent of the voting
// record, which drops whole meetings), and read each meeting's Minutes EDIMS id from
// its agenda page. Handles both the new (/council/YYYY/) and old (/department/...) URLs.
export interface CouncilMeeting {
  date: string; // YYYY-MM-DD
  ymd: string; // YYYYMMDD
  agendaUrl: string;
  minutesId: string;
}

const UA = { "User-Agent": "Mozilla/5.0" };

async function tryGet(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: UA });
    if (!r.ok) return null;
    const t = await r.text();
    return t.includes("document.cfm") || /agenda/i.test(t) ? t : null;
  } catch {
    return null;
  }
}

function minutesIdFrom(html: string): string | null {
  for (const m of html.matchAll(/document\.cfm\?id=(\d+)[^>]*>(.*?)<\/a>/gis)) {
    const label = m[2]!.replace(/<[^>]+>/g, "").trim();
    if (/minute/i.test(label)) return m[1]!;
  }
  return null;
}

function* thursdays(year: number, throughMonth: number) {
  const d = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, throughMonth, 0));
  for (; d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() === 4) yield new Date(d);
  }
}

export async function discoverCouncilMeetings(year: number, throughMonth = 12): Promise<CouncilMeeting[]> {
  const out: CouncilMeeting[] = [];
  for (const d of thursdays(year, throughMonth)) {
    const iso = d.toISOString().slice(0, 10);
    const ymd = iso.replace(/-/g, "");
    const url = `https://www.austintexas.gov/council/${year}/${ymd}-reg`;
    const alt = `https://www.austintexas.gov/department/city-council/${year}/${ymd}-reg.htm`;
    const html = (await tryGet(url)) ?? (await tryGet(alt));
    if (!html) continue;
    const minutesId = minutesIdFrom(html);
    if (!minutesId) continue; // no minutes posted yet → skip (outcome not available)
    out.push({ date: iso, ymd, agendaUrl: url, minutesId });
  }
  return out;
}

export interface UpcomingMeeting {
  date: string; // YYYY-MM-DD
  ymd: string;
  agendaUrl: string;
  draftAgendaId: string;
  agendaBackupId: string | null;
}

function idFromLabel(html: string, labelRe: RegExp): string | null {
  for (const m of html.matchAll(/document\.cfm\?id=(\d+)[^>]*>(.*?)<\/a>/gis)) {
    const label = m[2]!.replace(/<[^>]+>/g, "").trim();
    if (labelRe.test(label)) return m[1]!;
  }
  return null;
}

// Only one meeting's Draft Agenda is ever posted at a time (~13 days out), so this walks
// forward Thursday by Thursday from today until it finds one, rather than a whole year.
export async function findUpcomingMeeting(maxWeeksAhead = 4): Promise<UpcomingMeeting | null> {
  const d = new Date();
  const daysToThursday = (4 - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + daysToThursday);
  for (let i = 0; i < maxWeeksAhead; i++) {
    const iso = d.toISOString().slice(0, 10);
    const ymd = iso.replace(/-/g, "");
    const year = d.getUTCFullYear();
    const url = `https://www.austintexas.gov/council/${year}/${ymd}-reg`;
    const alt = `https://www.austintexas.gov/department/city-council/${year}/${ymd}-reg.htm`;
    const html = (await tryGet(url)) ?? (await tryGet(alt));
    if (html) {
      const draftAgendaId = idFromLabel(html, /draft agenda/i);
      if (draftAgendaId) {
        return { date: iso, ymd, agendaUrl: url, draftAgendaId, agendaBackupId: idFromLabel(html, /agenda backup/i) };
      }
    }
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return null; // no Draft Agenda posted yet for any meeting within the window
}
