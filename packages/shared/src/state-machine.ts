export enum ComplaintStatus {
  SUBMITTED = 'SUBMITTED',
  AI_ANALYSIS = 'AI_ANALYSIS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_INFO = 'NEEDS_INFO',
  POSTED = 'POSTED',
  AUTHORITY_ACKNOWLEDGED = 'AUTHORITY_ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REOPENED = 'REOPENED',
}

// Allowed transitions mapping
const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  [ComplaintStatus.SUBMITTED]: [ComplaintStatus.AI_ANALYSIS],
  [ComplaintStatus.AI_ANALYSIS]: [ComplaintStatus.UNDER_REVIEW],
  [ComplaintStatus.UNDER_REVIEW]: [
    ComplaintStatus.APPROVED,
    ComplaintStatus.REJECTED,
    ComplaintStatus.NEEDS_INFO
  ],
  [ComplaintStatus.NEEDS_INFO]: [ComplaintStatus.UNDER_REVIEW],
  [ComplaintStatus.APPROVED]: [ComplaintStatus.POSTED],
  [ComplaintStatus.POSTED]: [ComplaintStatus.AUTHORITY_ACKNOWLEDGED],
  [ComplaintStatus.AUTHORITY_ACKNOWLEDGED]: [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED],
  [ComplaintStatus.IN_PROGRESS]: [ComplaintStatus.RESOLVED],
  [ComplaintStatus.RESOLVED]: [ComplaintStatus.REOPENED],
  [ComplaintStatus.REOPENED]: [ComplaintStatus.UNDER_REVIEW, ComplaintStatus.IN_PROGRESS],
  [ComplaintStatus.REJECTED]: []
};

/**
 * Validates whether a state transition is legal according to the specification.
 * Throws an error if the transition is invalid.
 */
export function validateStateTransition(currentStatus: ComplaintStatus, nextStatus: ComplaintStatus): void {
  const validNextStates = ALLOWED_TRANSITIONS[currentStatus];
  
  if (!validNextStates || !validNextStates.includes(nextStatus)) {
    throw new Error(`Invalid state transition from ${currentStatus} to ${nextStatus}`);
  }
}
