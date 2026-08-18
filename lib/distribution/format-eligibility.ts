import type { DerivedContributorEligibility } from "@/lib/distribution/types";

const ELIGIBILITY_COPY: Record<
  DerivedContributorEligibility,
  { label: string; description: string }
> = {
  PENDING: {
    label: "Pending",
    description: "Requirements not yet fully satisfied while the period is open",
  },
  QUALIFIED: {
    label: "Qualified",
    description: "All applicable requirements are satisfied",
  },
  NOT_QUALIFIED: {
    label: "Not qualified",
    description: "Requirements were not satisfied when the period closed",
  },
};

export function getEligibilityCopy(eligibility: DerivedContributorEligibility) {
  return ELIGIBILITY_COPY[eligibility];
}
