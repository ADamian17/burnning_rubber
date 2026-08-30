/// <reference types="vite/client" />

/** Dev-only inspection seam for end-to-end tests. See main.ts. */
interface Window {
  __br?: {
    counting: boolean;
    crashed: boolean;
    distance: number;
    overlay: string | null;
    route: string;
    score: number;
  };
}
