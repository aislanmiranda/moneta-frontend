/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin (e.g. "https://api.example.com"). Unset = same origin, proxied — see api/client.ts. */
  readonly VITE_API_ORIGIN?: string;
}
