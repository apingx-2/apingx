import { formatCollectionNumber } from "@/lib/collections/format-collection-number";

type CollectionReferenceProps = {
  collectionNumber: number;
  name: string;
  className?: string;
};

export function CollectionReference({
  collectionNumber,
  name,
  className = "",
}: CollectionReferenceProps) {
  return (
    <p className={["type-archive-id", className].filter(Boolean).join(" ")}>
      {formatCollectionNumber(collectionNumber)} — {name}
    </p>
  );
}
