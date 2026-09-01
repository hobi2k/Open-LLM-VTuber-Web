const submittingPermissionIds = new Set<string>();

export function claimPermissionSubmission(requestId?: string): boolean {
  if (!requestId || submittingPermissionIds.has(requestId)) return false;
  submittingPermissionIds.add(requestId);
  return true;
}

export function releasePermissionSubmission(requestId?: string): void {
  if (requestId) submittingPermissionIds.delete(requestId);
}

export function isPermissionSubmissionPending(requestId?: string): boolean {
  return Boolean(requestId && submittingPermissionIds.has(requestId));
}
