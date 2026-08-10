import { formatCollectionNumber } from "@/lib/collections/format-collection-number";

export type CollectionOption = {
  id: string;
  collectionNumber: number;
  name: string;
};

export function formatCollectionOptionLabel(option: CollectionOption): string {
  return `${formatCollectionNumber(option.collectionNumber)} — ${option.name}`;
}
