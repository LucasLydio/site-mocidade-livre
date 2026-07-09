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
  }
} as const;
