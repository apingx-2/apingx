import type { ContributionPeriodStatus } from "@prisma/client";
import { toDateInputValue } from "@/lib/collections/format-date";
import {
  distributableAmountToInput,
  type ContributionPeriodFormValues,
} from "@/lib/distribution/schemas";

type PeriodFormSource = {
  collectionId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: ContributionPeriodStatus;
  distributableAmountInPence: number | null;
};

export function periodToFormValues(
  period: PeriodFormSource,
): ContributionPeriodFormValues {
  return {
    collectionId: period.collectionId,
    title: period.title,
    startDate: toDateInputValue(period.startDate),
    endDate: toDateInputValue(period.endDate),
    status: period.status,
    distributableAmountGbp: distributableAmountToInput(
      period.distributableAmountInPence,
    ),
  };
}
