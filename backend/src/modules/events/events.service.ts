import { AppError } from "../../shared/errors/app-error";
import { paginationMeta } from "../../utils/pagination";
import { eventsRepository } from "./events.repository";
import type { CreateEventInput, UpdateEventInput } from "./events.schema";

export const eventsService = {
  async list(page: number, limit: number) {
    const { data, total } = await eventsRepository.list(page, limit);
    return { data, pagination: paginationMeta(page, limit, total) };
  },
  getById: (id: string) => eventsRepository.findById(id),
  create: (input: CreateEventInput, createdBy: string) => eventsRepository.create(input, createdBy),
  async update(id: string, input: UpdateEventInput) {
    if (input.startsAt && input.endsAt && input.endsAt < input.startsAt) {
      throw new AppError(400, "A data final deve ser posterior a data inicial.");
    }
    return eventsRepository.update(id, input);
  },
  delete: (id: string) => eventsRepository.delete(id)
};
