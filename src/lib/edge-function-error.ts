/**
 * supabase.functions.invoke reports any non-2xx response as a generic "Edge Function returned a
 * non-2xx status code", discarding the JSON body our functions send with the real reason
 * ("Address not found", "Rate limit exceeded", ...). The raw Response is still on
 * error.context, so read the body back out and prefer its `error` field.
 */
export async function edgeFunctionErrorMessage(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : "Something went wrong.";
  const ctx = (error as { context?: unknown })?.context;
  if (!(ctx instanceof Response)) return fallback;
  try {
    const body = await ctx.clone().json();
    if (typeof body?.error === "string" && body.error) return body.error;
  } catch {
    // Body wasn't JSON (e.g. a gateway timeout page); keep the generic message.
  }
  return ctx.status === 504 || ctx.status === 546
    ? "The request timed out. Please try again."
    : fallback;
}
