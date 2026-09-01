import { beforeEach, describe, expect, it } from 'vitest';
import {
  claimPermissionSubmission,
  isPermissionSubmissionPending,
  releasePermissionSubmission,
} from './permission-submission';

describe('permission submission claim', () => {
  beforeEach(() => releasePermissionSubmission('permission-1'));

  it('allows exactly one response until the backend resolves it', () => {
    expect(claimPermissionSubmission('permission-1')).toBe(true);
    expect(isPermissionSubmissionPending('permission-1')).toBe(true);
    expect(claimPermissionSubmission('permission-1')).toBe(false);

    releasePermissionSubmission('permission-1');

    expect(isPermissionSubmissionPending('permission-1')).toBe(false);
    expect(claimPermissionSubmission('permission-1')).toBe(true);
  });

  it('does not submit an unidentified request', () => {
    expect(claimPermissionSubmission()).toBe(false);
  });
});
