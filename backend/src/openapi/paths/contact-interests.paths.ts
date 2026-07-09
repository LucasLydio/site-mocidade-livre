import {
  bearerSecurity,
  paginationParameters,
  resourceListResponse,
  resourceResponse,
  requestBody
} from "./path-helpers";

const statusRequestBody = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["status"],
        properties: {
          status: { $ref: "#/components/schemas/ContactInterestStatus" }
        }
      }
    }
  }
} as const;

export const contactInterestsPaths = {
  "/contact-interests": {
    get: {
      tags: ["Contact Interests"],
      operationId: "listContactInterests",
      security: bearerSecurity,
      parameters: [
        ...paginationParameters,
        {
          name: "status",
          in: "query",
          schema: { $ref: "#/components/schemas/ContactInterestStatus" }
        }
      ],
      responses: { "200": resourceListResponse("ContactInterest") }
    },
    post: {
      tags: ["Contact Interests"],
      operationId: "createContactInterest",
      requestBody: requestBody("ContactInterestInput"),
      responses: {
        "201": resourceResponse("ContactInterest", "Created contact interest")
      }
    }
  },
  "/contact-interests/{id}": {
    parameters: [{ $ref: "#/components/parameters/Id" }],
    get: {
      tags: ["Contact Interests"],
      operationId: "getContactInterest",
      security: bearerSecurity,
      responses: {
        "200": resourceResponse("ContactInterest", "Contact interest by id")
      }
    },
    patch: {
      tags: ["Contact Interests"],
      operationId: "updateContactInterest",
      security: bearerSecurity,
      requestBody: statusRequestBody,
      responses: {
        "200": resourceResponse("ContactInterest", "Updated contact interest")
      }
    },
    put: {
      tags: ["Contact Interests"],
      operationId: "replaceContactInterest",
      security: bearerSecurity,
      requestBody: statusRequestBody,
      responses: {
        "200": resourceResponse("ContactInterest", "Updated contact interest")
      }
    },
    delete: {
      tags: ["Contact Interests"],
      operationId: "deleteContactInterest",
      security: bearerSecurity,
      responses: { "204": { description: "Deleted contact interest" } }
    }
  }
} as const;
