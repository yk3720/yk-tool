const DRAFT_KEY = "flowchart-web:draft-v1";

export function saveDraft(jsonText: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, jsonText);
  } catch {
    /* quota exceeded — ignore */
  }
}

export function loadDraft(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}
