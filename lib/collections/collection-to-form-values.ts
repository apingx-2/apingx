import type { CollectionStatus } from "@prisma/client";
import { toDateInputValue } from "@/lib/collections/format-date";
import type { CollectionFormValues } from "@/lib/collections/schemas";

type CollectionFormSource = {
  name: string;
  slug: string;
  subtitle: string | null;
  story: string;
  status: CollectionStatus;
  launchDate: Date | null;
  coverImageUrl: string | null;
};

export function collectionToFormValues(
  collection: CollectionFormSource,
): Omit<CollectionFormValues, "collectionNumber"> {
  return {
    name: collection.name,
    slug: collection.slug,
    subtitle: collection.subtitle ?? "",
    story: collection.story,
    status: collection.status,
    launchDate: toDateInputValue(collection.launchDate),
    coverImageUrl: collection.coverImageUrl ?? "",
  };
}
