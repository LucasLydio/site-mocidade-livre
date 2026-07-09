import { crudPaths } from "./path-helpers";

export const eventsPaths = crudPaths("/events", "Events", "Event", "EventInput");
