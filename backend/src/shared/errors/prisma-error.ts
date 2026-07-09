import { Prisma } from "@prisma/client";
import { errorMessages } from "./error-messages";

const unavailableCodes = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1008",
  "P1010",
  "P1011",
  "P1012",
  "P1013",
  "P1014",
  "P1015",
  "P1017"
]);

export type PrismaErrorResponse = {
  statusCode: number;
  message: string;
};

export function mapPrismaError(error: unknown): PrismaErrorResponse | null {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      statusCode: 503,
      message: errorMessages[503]
    };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      statusCode: 503,
      message: errorMessages[503]
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (unavailableCodes.has(error.code)) {
      return {
        statusCode: 503,
        message: errorMessages[503]
      };
    }

    if (error.code === "P2002") {
      return {
        statusCode: 409,
        message: errorMessages[409]
      };
    }

    if (error.code === "P2025") {
      return {
        statusCode: 404,
        message: errorMessages[404]
      };
    }

    if (["P2000", "P2003", "P2011", "P2012", "P2014"].includes(error.code)) {
      return {
        statusCode: 422,
        message: errorMessages[422]
      };
    }

    return {
      statusCode: 422,
      message: errorMessages[422]
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: 400,
      message: errorMessages[400]
    };
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      statusCode: 503,
      message: errorMessages[503]
    };
  }

  return null;
}

