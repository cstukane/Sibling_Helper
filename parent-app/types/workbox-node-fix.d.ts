// Minimal globals to satisfy vite-plugin-pwa/workbox types in node config builds.
// Avoids pulling in full WebWorker libs which conflict with DOM libs.
type Args = unknown[];

type WorkerType = "classic" | "module";

type RequestCredentials = "omit" | "same-origin" | "include";

interface ExtendableEvent extends Event {
  // Add a property to make the interface non-empty
  readonly type: string;
}

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

interface Worker {
  // Add a property to make the interface non-empty
  readonly name: string;
}

declare const Worker: {
  prototype: Worker;
  new (scriptURL: string | URL, options?: WorkerOptions): Worker;
};
