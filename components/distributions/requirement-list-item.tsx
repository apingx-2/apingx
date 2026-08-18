"use client";

import { ContributionPeriodStatus } from "@prisma/client";
import { useState } from "react";
import { RequirementDeleteControl } from "@/components/distributions/requirement-delete-control";
import { RequirementEditForm } from "@/components/distributions/requirement-edit-form";
import type { EnrollmentContributorOption } from "@/lib/distribution/get-enrollment-options";
import {
  canEditRequirement,
  getRequirementLockMessage,
  getRequirementScopeLabel,
} from "@/lib/distribution/requirement-lifecycle";

type RequirementListItemProps = {
  requirement: {
    id: string;
    label: string;
    description: string | null;
    requiredVerificationCount: number;
    sortOrder: number;
    contributor: {
      id: string;
      displayName: string;
    } | null;
    evidenceCount: number;
  };
  contributionPeriodId: string;
  periodStatus: ContributionPeriodStatus;
  contributors: EnrollmentContributorOption[];
};

export function RequirementListItem({
  requirement,
  contributionPeriodId,
  periodStatus,
  contributors,
}: RequirementListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editable = canEditRequirement({
    periodStatus,
    evidenceCount: requirement.evidenceCount,
  });
  const lockMessage = getRequirementLockMessage({
    periodStatus,
    evidenceCount: requirement.evidenceCount,
  });

  return (
    <li className="rounded-sm border border-[var(--border-subtle)] px-4 py-4">
      <div className="space-y-2">
        <p className="type-body">{requirement.label}</p>
        {requirement.description ? (
          <p className="type-body text-[var(--text-secondary)]">
            {requirement.description}
          </p>
        ) : null}
        <p className="type-status">
          {requirement.requiredVerificationCount} verified submission
          {requirement.requiredVerificationCount === 1 ? "" : "s"} required ·{" "}
          {getRequirementScopeLabel(requirement.contributor)}
        </p>
        {lockMessage ? (
          <p className="type-status text-[var(--text-secondary)]">{lockMessage}</p>
        ) : null}
      </div>

      {editable && !isEditing ? (
        <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--border-subtle)] pt-4">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="focus-ring type-label rounded-sm border border-[var(--border-default)] px-4 py-2.5 text-[var(--accent-steel)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            Edit requirement
          </button>
          <RequirementDeleteControl
            requirementId={requirement.id}
            requirementLabel={requirement.label}
            contributionPeriodId={contributionPeriodId}
          />
        </div>
      ) : null}

      {editable && isEditing ? (
        <RequirementEditForm
          requirement={requirement}
          contributionPeriodId={contributionPeriodId}
          contributors={contributors}
          onCancel={() => setIsEditing(false)}
        />
      ) : null}
    </li>
  );
}
