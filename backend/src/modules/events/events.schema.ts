import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";
import { idParamSchema } from "../users/users.schema";

const eventFields = {
  title: z.string().min(2).max(180),
  summary: z.string().max(500).nullable().optional(),
  description: z.string().max(10000).nullable().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable().optional(),
  locationName: z.string().max(180).nullable().optional(),
  locationAddress: z.string().max(500).nullable().optional(),
  coverImageUrl: z.string().url().max(2048).nullable().optional(),
  isPublished: z.boolean().optional()
};

const validDates = (value: { startsAt?: Date; endsAt?: Date | null }) =>
  !value.startsAt || !value.endsAt || value.endsAt >= value.startsAt;

export const eventIdParamSchema = idParamSchema;
export const listEventsSchema = paginationSchema;
export const createEventSchema = z.object(eventFields).refine(validDates, {
  message: "A data final deve ser posterior a data inicial.",
  path: ["endsAt"]
});
export const updateEventSchema = z.object(eventFields).partial().refine((value) => Object.keys(value).length > 0);
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
