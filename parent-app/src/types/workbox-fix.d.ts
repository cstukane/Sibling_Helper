// Workaround for workbox-core type errors
// ExtendableEvent is part of the Service Worker API but is not properly referenced in workbox types

// This is a temporary fix until the workbox types are corrected
declare type ExtendableEvent = Event;

// Workaround for unconfig type errors
// Args is not properly defined in the unconfig types
declare type Args = any[];