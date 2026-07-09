export const usersPaths = {
  "/users": {
    get: {
      tags: ["Users"],
      operationId: "listUsers",
      security: [{ InternalBearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" }
      ],
      responses: {
        "200": {
          description: "Paginated users",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserListResponse" }
            }
          }
        }
      }
    },
    post: {
      tags: ["Users"],
      operationId: "createUser",
      security: [{ InternalBearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateUserRequest" }
          }
        }
      },
      responses: {
        "201": {
          description: "Created user",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserResponse" }
            }
          }
        }
      }
    }
  },
  "/users/me": {
    get: {
      tags: ["Users"],
      operationId: "getCurrentUser",
      security: [{ InternalBearerAuth: [] }],
      responses: {
        "200": {
          description: "Current authenticated internal user",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserResponse" }
            }
          }
        }
      }
    }
  },
  "/users/{id}": {
    parameters: [{ $ref: "#/components/parameters/Id" }],
    get: {
      tags: ["Users"],
      operationId: "getUser",
      security: [{ InternalBearerAuth: [] }],
      responses: {
        "200": {
          description: "User by id",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserResponse" }
            }
          }
        }
      }
    },
    patch: {
      tags: ["Users"],
      operationId: "patchUser",
      security: [{ InternalBearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUserRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Updated user",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserResponse" }
            }
          }
        }
      }
    },
    put: {
      tags: ["Users"],
      operationId: "putUser",
      security: [{ InternalBearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUserRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Updated user",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserResponse" }
            }
          }
        }
      }
    },
    delete: {
      tags: ["Users"],
      operationId: "deleteUser",
      security: [{ InternalBearerAuth: [] }],
      responses: {
        "204": {
          description: "Deleted user"
        }
      }
    }
  }
} as const;
