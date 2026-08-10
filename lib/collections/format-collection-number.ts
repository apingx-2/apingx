export function formatCollectionNumber(collectionNumber: number): string {
  return `COLLECTION ${String(collectionNumber).padStart(3, "0")}`;
}
