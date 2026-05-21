/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PASSCODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'pwa-install': {
        'manifest-url'?: string;
        'styles'?: string;
        'use-local-storage'?: string;
      };
    }
  }
}

