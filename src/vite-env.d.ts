/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*?url' {
  const content: string;
  export default content;
}

declare module '*?raw' {
  const content: string;
  export default content;
}

declare module '*?worker' {
  const content: new () => Worker;
  export default content;
}
