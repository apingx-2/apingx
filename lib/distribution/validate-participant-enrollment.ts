import type { ParticipantEnrollmentValidationInput } from "@/lib/distribution/types";

export type ParticipantEnrollmentValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validateParticipantEnrollment(
  input: ParticipantEnrollmentValidationInput,
): ParticipantEnrollmentValidationResult {
  if (input.periodCollectionId !== input.credentialCollectionId) {
    return {
      valid: false,
      reason:
        "The selected Credential does not belong to the Contribution Period Collection.",
    };
  }

  if (!input.credentialContributorId) {
    return {
      valid: false,
      reason:
        "The selected Credential is not associated with a Contributor and cannot be enrolled.",
    };
  }

  if (input.credentialContributorId !== input.participantContributorId) {
    return {
      valid: false,
      reason:
        "The selected Credential is not associated with the enrolled Contributor.",
    };
  }

  return { valid: true };
}
