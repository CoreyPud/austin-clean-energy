// Validation — audit the LLM's structural claims against regex ground truth.
// Produces RawItems with per-field provenance and flags. This is what makes the
// dataset trustworthy: a dollar amount or vote tally the LLM asserts that does not
// appear in the harvested facts is kept but flagged for review, never silently trusted.
import type { HarvestedFacts, RawItem, SourceDoc, Vote } from "./schema.js";
import type { LlmDecisionItem } from "./classify.js";

export interface ValidateResult {
  items: RawItem[];
  review: { rawItemId: string; reason: string }[];
}

export function toRawItems(
  doc: SourceDoc,
  llmItems: LlmDecisionItem[],
  facts: HarvestedFacts,
): ValidateResult {
  const items: RawItem[] = [];
  const review: { rawItemId: string; reason: string }[] = [];
  let seq = 0;

  for (const li of llmItems) {
    seq++;
    const itemNo = li.item_no != null ? String(li.item_no) : null;
    const rawItemId = `${doc.docId}#${itemNo ?? seq}`;
    const flags: string[] = [];
    const fieldSources: RawItem["fieldSources"] = {};

    // --- dollar amount: prefer a regex-confirmed value ---
    let dollarAmount = li.dollar_amount;
    if (dollarAmount != null) {
      if (facts.dollarAmounts.includes(dollarAmount)) {
        fieldSources.dollarAmount = "regex"; // llm claim confirmed by source text
      } else {
        fieldSources.dollarAmount = "llm";
        flags.push("dollar_amount_unverified");
        review.push({ rawItemId, reason: `LLM dollar_amount ${dollarAmount} not found in source text` });
      }
    }

    // --- vote / tally / dissenters ---
    // Only recording documents (minutes, roll-call) carry a vote; agendas merely
    // propose an action, so an "approved" from an agenda item would be spurious.
    let vote: Vote | null = null;
    const isRecordDoc = doc.docType === "commission_minutes" || doc.docType === "socrata_vote";
    if (li.vote_tally || isRecordDoc) {
      const match = li.vote_tally ? facts.tallies.find((t) => t.tally === li.vote_tally) : undefined;
      const tally = li.vote_tally ?? null;
      let verified = false;
      let dissenters = li.dissenters ?? [];
      if (li.vote_tally) {
        if (match) {
          verified = true;
          // trust regex-parsed dissenters when available
          if (match.against.length) dissenters = match.against;
          // sanity: LLM dissenters should be a subset of regex dissenters
          const extra = (li.dissenters ?? []).filter((d) => match.against.length && !match.against.includes(d));
          if (extra.length) flags.push(`dissenters_extra:${extra.join("+")}`);
        } else {
          flags.push("vote_tally_unverified");
          review.push({ rawItemId, reason: `LLM vote_tally ${li.vote_tally} not found in source text` });
        }
      }
      vote = {
        body: doc.body,
        date: doc.meetingDate,
        result: li.result || (li.vote_tally ? "approved" : "pending"),
        tally,
        dissenters,
        isClosedSession: false,
        _source: verified ? "regex" : "llm",
        _verified: verified,
      };
    }

    items.push({
      rawItemId,
      docId: doc.docId,
      body: doc.body,
      meetingDate: doc.meetingDate,
      itemNo,
      title: li.title,
      postingLanguage: doc.docType.includes("agenda") ? li.title : undefined,
      decisionType: li.decision_type,
      topic: li.topic,
      isClimate: li.is_climate,
      significance: li.significance,
      dollarAmount,
      vote,
      summary: li.summary,
      crossRefs: (li.cross_refs ?? []).filter((r) => facts.crossRefs.includes(r) || /20\d{6}/.test(r)),
      flags,
      fieldSources,
    });
  }

  return { items, review };
}
