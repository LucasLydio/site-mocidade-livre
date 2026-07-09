const timestamps = {
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" }
} as const;

const nullableString = { type: ["string", "null"] } as const;

export const openApiComponents = {
  securitySchemes: {
    InternalBearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "JWT returned by /auth/login or /auth/register."
    }
  },
  parameters: {
    Id: { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
    ProductId: { name: "productId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
    ImageId: { name: "imageId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
    CartId: { name: "cartId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
    ItemId: { name: "itemId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
    Page: { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
    Limit: { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } }
  },
  schemas: {
    ErrorResponse: {
      type: "object",
      required: ["success", "message"],
      properties: { success: { const: false }, message: { type: "string" } }
    },
    Pagination: {
      type: "object",
      required: ["page", "limit", "total", "totalPages", "hasNextPage", "hasPreviousPage"],
      properties: {
        page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" },
        totalPages: { type: "integer" }, hasNextPage: { type: "boolean" }, hasPreviousPage: { type: "boolean" }
      }
    },
    UserRole: { type: "string", enum: ["admin", "common"] },
    ContactInterestStatus: { type: "string", enum: ["new", "contacted", "archived"] },
    CartStatus: { type: "string", enum: ["open", "sent_to_whatsapp", "abandoned"] },
    User: {
      type: "object",
      required: ["id", "name", "email", "role", "isActive", "createdAt", "updatedAt"],
      properties: {
        id: { type: "string", format: "uuid" }, name: { type: "string" },
        email: { type: "string", format: "email" }, telephone: nullableString,
        role: { $ref: "#/components/schemas/UserRole" }, isActive: { type: "boolean" }, ...timestamps
      }
    },
    Area: {
      type: "object",
      required: ["id", "name", "slug", "isActive", "createdAt", "updatedAt"],
      properties: {
        id: { type: "string", format: "uuid" }, name: { type: "string" }, slug: { type: "string" },
        description: nullableString, coverImageUrl: nullableString, isActive: { type: "boolean" }, ...timestamps
      }
    },
    Event: {
      type: "object",
      required: ["id", "title", "startsAt", "isPublished", "createdAt", "updatedAt"],
      properties: {
        id: { type: "string", format: "uuid" }, title: { type: "string" }, summary: nullableString,
        description: nullableString, startsAt: { type: "string", format: "date-time" },
        endsAt: { type: ["string", "null"], format: "date-time" }, locationName: nullableString,
        locationAddress: nullableString, coverImageUrl: nullableString, isPublished: { type: "boolean" },
        createdBy: { type: ["string", "null"], format: "uuid" }, creator: { type: ["object", "null"] }, ...timestamps
      }
    },
    ContactInterest: {
      type: "object",
      required: ["id", "name", "whatsapp", "areaInterest", "status", "createdAt", "updatedAt"],
      properties: {
        id: { type: "string", format: "uuid" }, name: { type: "string" }, whatsapp: { type: "string" },
        email: { type: ["string", "null"], format: "email" }, areaInterest: { type: "string" },
        message: nullableString, status: { $ref: "#/components/schemas/ContactInterestStatus" }, ...timestamps
      }
    },
    Category: {
      type: "object",
      required: ["id", "name", "slug", "isActive", "createdAt", "updatedAt"],
      properties: {
        id: { type: "string", format: "uuid" }, name: { type: "string" }, slug: { type: "string" },
        description: nullableString, isActive: { type: "boolean" }, ...timestamps
      }
    },
    ProductImage: {
      type: "object",
      required: ["id", "productId", "imageUrl", "isCover", "sortOrder", "createdAt"],
      properties: {
        id: { type: "string", format: "uuid" }, productId: { type: "string", format: "uuid" },
        imageUrl: { type: "string", format: "uri" }, storagePath: nullableString, altText: nullableString,
        isCover: { type: "boolean" }, sortOrder: { type: "integer" }, createdAt: timestamps.createdAt
      }
    },
    Product: {
      type: "object",
      required: ["id", "name", "slug", "priceCents", "stockQty", "isActive", "images", "createdAt", "updatedAt"],
      properties: {
        id: { type: "string", format: "uuid" }, categoryId: { type: ["string", "null"], format: "uuid" },
        name: { type: "string" }, slug: { type: "string" }, description: nullableString,
        priceCents: { type: "integer", minimum: 0 }, stockQty: { type: "integer", minimum: 0 },
        isActive: { type: "boolean" }, category: { oneOf: [{ $ref: "#/components/schemas/Category" }, { type: "null" }] },
        images: { type: "array", items: { $ref: "#/components/schemas/ProductImage" } }, ...timestamps
      }
    },
    CartItem: {
      type: "object",
      required: ["id", "cartId", "productId", "quantity", "unitPriceCents", "productName", "createdAt", "updatedAt"],
      properties: {
        id: { type: "string", format: "uuid" }, cartId: { type: "string", format: "uuid" },
        productId: { type: "string", format: "uuid" }, quantity: { type: "integer", minimum: 1 },
        unitPriceCents: { type: "integer", minimum: 0 }, productName: { type: "string" }, ...timestamps
      }
    },
    Cart: {
      type: "object",
      required: ["id", "status", "items", "createdAt", "updatedAt"],
      properties: {
        id: { type: "string", format: "uuid" }, userId: { type: ["string", "null"], format: "uuid" },
        status: { $ref: "#/components/schemas/CartStatus" }, customerName: nullableString,
        customerWhatsapp: nullableString, notes: nullableString,
        items: { type: "array", items: { $ref: "#/components/schemas/CartItem" } }, ...timestamps
      }
    },
    LoginRequest: {
      type: "object", required: ["password"],
      properties: { login: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", format: "password" } },
      anyOf: [{ required: ["login"] }, { required: ["email"] }]
    },
    RegisterRequest: {
      type: "object", required: ["name", "email", "password"],
      properties: {
        name: { type: "string", minLength: 2, maxLength: 120 }, email: { type: "string", format: "email" },
        telephone: { type: "string", minLength: 8, maxLength: 30 }, role: { const: "common", default: "common" },
        password: { type: "string", format: "password", minLength: 8, maxLength: 100 }
      }
    },
    CreateUserRequest: {
      type: "object", required: ["name", "email", "password"],
      properties: {
        name: { type: "string" }, email: { type: "string", format: "email" }, telephone: { type: "string" },
        role: { $ref: "#/components/schemas/UserRole" }, password: { type: "string", format: "password", minLength: 8 }
      }
    },
    UpdateUserRequest: {
      type: "object",
      properties: {
        name: { type: "string" }, email: { type: "string", format: "email" }, telephone: nullableString,
        role: { $ref: "#/components/schemas/UserRole" }, isActive: { type: "boolean" },
        password: { type: "string", format: "password", minLength: 8 }
      }
    },
    AreaInput: {
      type: "object", required: ["name", "slug"],
      properties: { name: { type: "string" }, slug: { type: "string" }, description: nullableString, coverImageUrl: nullableString, isActive: { type: "boolean" } }
    },
    EventInput: {
      type: "object", required: ["title", "startsAt"],
      properties: {
        title: { type: "string" }, summary: nullableString, description: nullableString,
        startsAt: { type: "string", format: "date-time" }, endsAt: { type: ["string", "null"], format: "date-time" },
        locationName: nullableString, locationAddress: nullableString, coverImageUrl: nullableString, isPublished: { type: "boolean" }
      }
    },
    ContactInterestInput: {
      type: "object", required: ["name", "whatsapp", "areaInterest"],
      properties: { name: { type: "string" }, whatsapp: { type: "string" }, email: { type: ["string", "null"], format: "email" }, areaInterest: { type: "string" }, message: nullableString }
    },
    CategoryInput: {
      type: "object", required: ["name", "slug"],
      properties: { name: { type: "string" }, slug: { type: "string" }, description: nullableString, isActive: { type: "boolean" } }
    },
    ProductInput: {
      type: "object", required: ["name", "slug", "priceCents"],
      properties: {
        categoryId: { type: ["string", "null"], format: "uuid" }, name: { type: "string" }, slug: { type: "string" },
        description: nullableString, priceCents: { type: "integer", minimum: 0 }, stockQty: { type: "integer", minimum: 0 }, isActive: { type: "boolean" }
      }
    },
    ProductImageInput: {
      type: "object", required: ["imageUrl"],
      properties: { imageUrl: { type: "string", format: "uri" }, storagePath: nullableString, altText: nullableString, isCover: { type: "boolean" }, sortOrder: { type: "integer", minimum: 0 } }
    },
    CartInput: {
      type: "object",
      properties: { customerName: nullableString, customerWhatsapp: nullableString, notes: nullableString, status: { $ref: "#/components/schemas/CartStatus" } }
    },
    CartItemInput: {
      type: "object", required: ["productId", "quantity"],
      properties: { productId: { type: "string", format: "uuid" }, quantity: { type: "integer", minimum: 1 } }
    },
    UserResponse: {
      type: "object", required: ["success", "data"],
      properties: { success: { const: true }, data: { $ref: "#/components/schemas/User" } }
    },
    UserListResponse: {
      type: "object", required: ["success", "data", "pagination"],
      properties: {
        success: { const: true },
        data: { type: "array", items: { $ref: "#/components/schemas/User" } },
        pagination: { $ref: "#/components/schemas/Pagination" }
      }
    },
    AuthUserResponse: {
      type: "object", required: ["success", "data"],
      properties: { success: { const: true }, data: { type: "object", required: ["user", "token"], properties: { user: { $ref: "#/components/schemas/User" }, token: { type: "string" } } } }
    },
    LogoutResponse: {
      type: "object", required: ["success", "data"],
      properties: { success: { const: true }, data: { type: "object", properties: { loggedOut: { type: "boolean" } } } }
    },
    HealthResponse: {
      type: "object", required: ["success", "data"],
      properties: { success: { const: true }, data: { type: "object", properties: { status: { type: "string" }, service: { type: "string" } } } }
    }
  }
} as const;
