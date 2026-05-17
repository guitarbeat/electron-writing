/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PASSCODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
