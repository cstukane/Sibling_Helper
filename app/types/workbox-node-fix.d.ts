// Minimal globals to satisfy vite-plugin-pwa/workbox types in node config builds.
// Avoids pulling in full WebWorker libs which conflict with DOM libs.
type Args = any[];

type WorkerType = "classic" | "module";

type RequestCredentials = "omit" | "same-origin" | "include";

interface ExtendableEvent extends Event {}

interface CacheQueryOptions {
  ignoreSearch?: boolean;
  ignoreMethod?: boolean;
  ignoreVary?: boolean;
}

interface WorkerOptions {
  name?: string;
  type?: WorkerType;
  credentials?: RequestCredentials;
}

interface Worker {}

declare var Worker: {
  prototype: Worker;
  new (scriptURL: string | URL, options?: WorkerOptions): Worker;
};
