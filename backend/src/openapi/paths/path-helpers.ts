export const bearerSecurity = [{ InternalBearerAuth: [] }] as const;

export const paginationParameters = [
  { $ref: "#/components/parameters/Page" },
  { $ref: "#/components/parameters/Limit" }
] as const;

export function resourceResponse(schema: string, description: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["success", "data"],
          properties: {
            success: { const: true },
            data: { $ref: `#/components/schemas/${schema}` }
          }
        }
      }
    }
  } as const;
}

export function resourceListResponse(schema: string) {
  return {
    description: `Paginated ${schema.toLowerCase()} list`,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["success", "data", "pagination"],
          properties: {
            success: { const: true },
            data: {
              type: "array",
              items: { $ref: `#/components/schemas/${schema}` }
            },
            pagination: { $ref: "#/components/schemas/Pagination" }
          }
        }
      }
    }
  } as const;
}

export function requestBody(schema: string) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: `#/components/schemas/${schema}` }
      }
    }
  } as const;
}

export function crudPaths(path: string, tag: string, schema: string, input: string) {
  return {
    [path]: {
      get: {
        tags: [tag],
        operationId: `list${tag}`,
        parameters: paginationParameters,
        responses: { "200": resourceListResponse(schema) }
      },
      post: {
        tags: [tag],
        operationId: `create${schema}`,
        security: bearerSecurity,
        requestBody: requestBody(input),
        responses: { "201": resourceResponse(schema, `Created ${schema.toLowerCase()}`) }
      }
    },
    [`${path}/{id}`]: {
      parameters: [{ $ref: "#/components/parameters/Id" }],
      get: {
        tags: [tag],
        operationId: `get${schema}`,
        responses: { "200": resourceResponse(schema, `${schema} by id`) }
      },
      patch: {
        tags: [tag],
        operationId: `update${schema}`,
        security: bearerSecurity,
        requestBody: requestBody(input),
        responses: { "200": resourceResponse(schema, `Updated ${schema.toLowerCase()}`) }
      },
      put: {
        tags: [tag],
        operationId: `replace${schema}`,
        security: bearerSecurity,
        requestBody: requestBody(input),
        responses: { "200": resourceResponse(schema, `Updated ${schema.toLowerCase()}`) }
      },
      delete: {
        tags: [tag],
        operationId: `delete${schema}`,
        security: bearerSecurity,
        responses: { "204": { description: `Deleted ${schema.toLowerCase()}` } }
      }
    }
  } as const;
}
