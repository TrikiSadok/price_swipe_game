// The photo being posted, kept in memory between the "choose photo" and "details" screens.
export type DraftPhoto = { uri: string; width: number; height: number };

let current: DraftPhoto | null = null;

export function setDraftPhoto(photo: DraftPhoto | null): void {
  current = photo;
}

export function getDraftPhoto(): DraftPhoto | null {
  return current;
}
