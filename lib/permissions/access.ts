export interface AccessContext {
  userId: string | null;
  entitlements: {
    issues: Set<string>;
    issuePages: Set<string>;
  };
}

export function canAccessIssuePage(
  ctx: AccessContext,
  issueId: string,
  pageId: string,
  isFree: boolean,
): boolean {
  if (isFree) return true;
  if (!ctx.userId) return false;
  if (ctx.entitlements.issues.has(issueId)) return true;
  if (ctx.entitlements.issuePages.has(pageId)) return true;
  return false;
}

export function canAccessIssue(ctx: AccessContext, issueId: string): boolean {
  if (!ctx.userId) return false;
  return ctx.entitlements.issues.has(issueId);
}

export function canDownloadPdf(ctx: AccessContext, issueId: string): boolean {
  return canAccessIssue(ctx, issueId);
}
