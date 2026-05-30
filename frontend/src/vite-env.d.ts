/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend public URL on Railway (no trailing slash). Empty locally → Vite proxy. */
  readonly VITE_API_URL?: string
  /** Public base URL for demo videos (Railway bucket). Empty → /videos/ locally. */
  readonly VITE_VIDEO_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
