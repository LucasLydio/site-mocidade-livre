export const authPaths = {
  "/auth/register": {
    post: {
      tags: ["Auth"],
      operationId: "registerInternalUser",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterRequest" },
            example: {
              name: "Usuario Teste",
              email: "usuario@test.com",
              telephone: "11999999999",
              password: "12345678"
            }
          }
        }
      },
      responses: {
        "201": {
          description: "Created internal user with access token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthUserResponse" }
            }
          }
        }
      }
    }
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      operationId: "loginInternalUser",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
            examples: {
              email: {
                value: {
                  email: "usuario@test.com",
                  password: "12345678"
                }
              },
              login: {
                value: {
                  login: "usuario@test.com",
                  password: "12345678"
                }
              }
            }
          }
        }
      },
      responses: {
        "200": {
          description: "Authenticated internal user",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthUserResponse" }
            }
          }
        }
      }
    }
  },
  "/auth/recover-password": {
    post: {
      tags: ["Auth"],
      operationId: "recoverInternalUserPassword",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RecoverPasswordRequest" },
            example: {
              email: "usuario@test.com"
            }
          }
        }
      },
      responses: {
        "200": {
          description: "Password recovery request accepted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MessageResponse" }
            }
          }
        }
      }
    }
  },
  "/auth/me": {
    get: {
      tags: ["Auth"],
      operationId: "getCurrentInternalUser",
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
  "/auth/logout": {
    post: {
      tags: ["Auth"],
      operationId: "logoutInternalUser",
      responses: {
        "200": {
          description: "Internal user logout",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LogoutResponse" }
            }
          }
        }
      }
    }
  }
} as const;
