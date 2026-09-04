import { bearerSecurity, resourceResponse } from "./path-helpers";

export const storagePaths = {
  "/storage/images": {
    post: {
      tags: ["Storage"],
      operationId: "uploadStorageImage",
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["file"],
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                  description: "WEBP, PNG, JPG or JPEG image up to 5 MB."
                },
                folder: {
                  type: "string",
                  enum: ["areas", "events", "products", "general"],
                  default: "general"
                }
              }
            }
          }
        }
      },
      responses: {
        "201": resourceResponse("StorageUpload", "Uploaded image")
      }
    }
  },
  "/storage/files": {
    get: {
      tags: ["Storage"],
      operationId: "listStorageFiles",
      security: bearerSecurity,
      responses: {
        "200": {
          description: "Storage files analyzed against database usage",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["success", "data"],
                properties: {
                  success: { const: true },
                  data: { $ref: "#/components/schemas/StorageFilesResponseData" }
                }
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ["Storage"],
      operationId: "deleteUnusedStorageFiles",
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/DeleteStorageFilesRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Deleted unused files and skipped protected files",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["success", "data"],
                properties: {
                  success: { const: true },
                  data: { $ref: "#/components/schemas/DeleteStorageFilesResponseData" }
                }
              }
            }
          }
        }
      }
    }
  }
} as const;
