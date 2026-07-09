import { env } from "../../config/env";
import { sendEmail } from "../../infra/smtp/email.service";
import {
  contactInterestAdminTemplate,
  contactInterestConfirmationTemplate
} from "../../infra/smtp/email.template";
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
  async create(input: CreateContactInterestInput) {
    const contact = await contactInterestsRepository.create(input);

    if (env.ADMIN_EMAIL) {
      sendEmail({
        to: env.ADMIN_EMAIL,
        subject: `Novo interesse - ${contact.name}`,
        html: contactInterestAdminTemplate(contact),
        text: `Novo interesse recebido.\nNome: ${contact.name}\nWhatsApp: ${contact.whatsapp}\nEmail: ${contact.email ?? "-"}\nArea: ${contact.areaInterest}\nMensagem: ${contact.message ?? "-"}`
      }).catch((error: unknown) => console.error("contact interest admin email failed", error));
    }

    if (contact.email) {
      sendEmail({
        to: contact.email,
        subject: "Recebemos seu interesse - Mocidade Livre",
        html: contactInterestConfirmationTemplate(contact),
        text: `Ola, ${contact.name}. Recebemos seu interesse em ${contact.areaInterest}. Nossa equipe vai entrar em contato pelo WhatsApp informado.`
      }).catch((error: unknown) => console.error("contact interest confirmation email failed", error));
    }

    return contact;
  },
  updateStatus: (id: string, status: ContactInterestStatus) => contactInterestsRepository.updateStatus(id, status),
  delete: (id: string) => contactInterestsRepository.delete(id)
};
