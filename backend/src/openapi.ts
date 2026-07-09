import { openApiComponents } from "./openapi/components";
import { authPaths } from "./openapi/paths/auth.paths";
import { areasPaths } from "./openapi/paths/areas.paths";
import { cartsPaths } from "./openapi/paths/carts.paths";
import { categoriesPaths } from "./openapi/paths/categories.paths";
import { contactInterestsPaths } from "./openapi/paths/contact-interests.paths";
import { eventsPaths } from "./openapi/paths/events.paths";
import { healthPaths } from "./openapi/paths/health.paths";
import { productsPaths } from "./openapi/paths/products.paths";
import { storagePaths } from "./openapi/paths/storage.paths";
import { usersPaths } from "./openapi/paths/users.paths";

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Mocidade Livre API",
    version: "0.1.0",
    description: "OpenAPI specification for the Mocidade Livre backend."
  },
  servers: [
    {
      url: "http://localhost:8888/api",
      description: "Local Netlify dev"
    },
    {
      url: "/api",
      description: "Same-origin API"
    }
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Users" },
    { name: "Areas" },
    { name: "Events" },
    { name: "Contact Interests" },
    { name: "Categories" },
    { name: "Products" },
    { name: "Storage" },
    { name: "Carts" }
  ],
  paths: {
    ...healthPaths,
    ...authPaths,
    ...usersPaths,
    ...areasPaths,
    ...eventsPaths,
    ...contactInterestsPaths,
    ...categoriesPaths,
    ...productsPaths,
    ...storagePaths,
    ...cartsPaths
  },
  components: openApiComponents
};
