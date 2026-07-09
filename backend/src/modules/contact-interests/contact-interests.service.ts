import { paginationMeta } from "../../utils/pagination";
import { contactInterestsRepository } from "./contact-interests.repository";
import type {
  ContactInterestStatus,
  CreateContactInterestInput
} from "./contact-interests.schema";

export const contactInterestsService = {
  async list(page: number, limit: number, status?: ContactInterestStatus) {
    const { data, total } = await contactInterestsRepository.list(page, limit, status);
    return { data, pagination: paginationMeta(page, limit, total) };
  },
  getById: (id: string) => contactInterestsRepository.findById(id),
  create: (input: CreateContactInterestInput) => contactInterestsRepository.create(input),
  updateStatus: (id: string, status: ContactInterestStatus) => contactInterestsRepository.updateStatus(id, status),
  delete: (id: string) => contactInterestsRepository.delete(id)
};
