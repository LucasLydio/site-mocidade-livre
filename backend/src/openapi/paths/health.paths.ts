export const healthPaths = {
  "/health": {
    get: {
      tags: ["Health"],
      operationId: "health",
      responses: {
        "200": {
          description: "API status",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HealthResponse" }
            }
          }
        }
      }
    }
  }
} as const;
