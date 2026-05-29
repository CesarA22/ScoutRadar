/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend public URL on Railway (no trailing slash). Empty locally → Vite proxy. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
