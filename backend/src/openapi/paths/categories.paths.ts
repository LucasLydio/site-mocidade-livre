import { crudPaths } from "./path-helpers";

export const categoriesPaths = crudPaths(
  "/categories",
  "Categories",
  "Category",
  "CategoryInput"
);
