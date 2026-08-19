import {
  defaultContributionPeriodFormValues,
  type ContributionPeriodFormValues,
} from "@/lib/distribution/schemas";
import { toDateInputValue } from "@/lib/collections/format-date";

export function periodToFormValues(period: {
  collectionId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: ContributionPeriodFormValues["status"];
}): ContributionPeriodFormValues {
  return {
    collectionId: period.collectionId,
    title: period.title,
    startDate: toDateInputValue(period.startDate),
    endDate: toDateInputValue(period.endDate),
    status: period.status,
  };
}

export function emptyPeriodFormValues(): ContributionPeriodFormValues {
  return { ...defaultContributionPeriodFormValues };
}
