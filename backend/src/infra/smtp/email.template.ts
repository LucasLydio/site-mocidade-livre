import { env } from "../../config/env";

const brand = {
  name: "Mocidade Livre",
  primary: "#111827",
  accent: "#f5c84c",
  soft: "#fff7d6",
  surface: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280"
} as const;

type WelcomeTemplateInput = {
  name: string;
};

type RecoverPasswordTemplateInput = {
  name: string;
  temporaryPassword: string;
  loginUrl?: string;
};

export type ContactInterestTemplateInput = {
  name: string;
  whatsapp: string;
  areaInterest: string;
  email?: string | null;
  message?: string | null;
};

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character] ?? character
  );
}

function publicBaseUrl(): string {
  return (env.FRONTEND_URL || env.APP_URL).replace(/\/+$/, "");
}

function publicUrl(path: string): string {
  const base = publicBaseUrl();
  const normalizedPath = path.replace(/^\/+/, "");

  try {
    return new URL(normalizedPath, `${base}/`).toString();
  } catch {
    return `/${normalizedPath}`;
  }
}

function logoUrl(): string {
  return publicUrl("assets/images/logo-mocidade.webp");
}

function paragraph(text: string): string {
  return `<p style="margin: 0 0 16px; color: ${brand.text}; font-size: 15px; line-height: 1.7;">${escapeHtml(text)}</p>`;
}

function button(label: string, href: string): string {
  return `
    <a
      href="${escapeHtml(href)}"
      style="display: inline-block; padding: 13px 20px; border-radius: 999px; background: ${brand.primary}; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none;"
    >
      ${escapeHtml(label)}
    </a>
  `;
}

function infoRow(label: string, value: string | null | undefined): string {
  if (!value) return "";

  return `
    <tr>
      <td style="padding: 10px 0; color: ${brand.muted}; font-size: 13px; width: 120px; vertical-align: top;">${escapeHtml(label)}</td>
      <td style="padding: 10px 0; color: ${brand.text}; font-size: 14px; font-weight: 600;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function baseTemplate({
  title,
  preview,
  children
}: {
  title: string;
  preview: string;
  children: string;
}): string {
  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin: 0; padding: 0; background: #f4f1e8; font-family: Arial, Helvetica, sans-serif;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
          ${escapeHtml(preview)}
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f4f1e8; padding: 28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px;">
                <tr>
                  <td style="padding: 0 0 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle;">
                          <img
                            src="${escapeHtml(logoUrl())}"
                            width="56"
                            height="56"
                            alt="${brand.name}"
                            style="display: block; width: 56px; height: 56px; border-radius: 18px; background: #ffffff; object-fit: cover;"
                          />
                        </td>
                        <td style="padding-left: 14px; vertical-align: middle;">
                          <div style="color: ${brand.primary}; font-size: 18px; font-weight: 800;">${brand.name}</div>
                          <div style="color: ${brand.muted}; font-size: 13px;">Comunidade, cuidado e movimento.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="border-radius: 28px; overflow: hidden; background: ${brand.surface}; box-shadow: 0 20px 60px rgba(17, 24, 39, 0.10);">
                    <div style="background: linear-gradient(135deg, ${brand.primary} 0%, #2d2419 55%, ${brand.accent} 140%); padding: 30px 30px 24px;">
                      <div style="display: inline-block; padding: 7px 12px; border-radius: 999px; background: rgba(255,255,255,0.14); color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;">
                        ${brand.name}
                      </div>
                      <h1 style="margin: 18px 0 0; color: #ffffff; font-size: 28px; line-height: 1.2; font-weight: 800;">
                        ${escapeHtml(title)}
                      </h1>
                    </div>

                    <div style="padding: 30px;">
                      ${children}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding: 18px 10px 0; color: ${brand.muted}; font-size: 12px; line-height: 1.6;">
                    Esta mensagem foi enviada automaticamente pela ${brand.name}.<br />
                    Se você não esperava este email, pode ignorá-lo com tranquilidade.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function welcomeTemplate(input: WelcomeTemplateInput | string): string {
  const name = typeof input === "string" ? input : input.name;

  return baseTemplate({
    title: "Bem-vindo à Mocidade Livre",
    preview: "Sua conta foi criada com sucesso.",
    children: `
      ${paragraph(`Olá, ${name}!`)}
      ${paragraph("Sua conta foi criada com sucesso. Que alegria ter você caminhando com a gente.")}
      <div style="margin: 24px 0; padding: 18px; border-radius: 20px; background: ${brand.soft}; color: ${brand.primary}; font-size: 14px; line-height: 1.6;">
        Agora você pode acessar sua área, acompanhar novidades e participar mais de perto da Mocidade Livre.
      </div>
      ${button("Acessar minha conta", publicUrl("login.html"))}
    `
  });
}

export function recoverPasswordTemplate(input: RecoverPasswordTemplateInput): string {
  const loginUrl = input.loginUrl ?? publicUrl("login.html");

  return baseTemplate({
    title: "Recuperação de senha",
    preview: "Use sua senha temporária para acessar sua conta.",
    children: `
      ${paragraph(`Olá, ${input.name}!`)}
      ${paragraph("Recebemos uma solicitação para recuperar o acesso à sua conta. Use a senha temporária abaixo para entrar.")}
      <div style="margin: 22px 0; padding: 20px; border-radius: 20px; background: #111827; color: #ffffff;">
        <div style="font-size: 12px; color: #d1d5db; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em;">Senha temporária</div>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; letter-spacing: 0.08em;">${escapeHtml(input.temporaryPassword)}</div>
      </div>
      <div style="margin: 20px 0; padding: 16px; border-radius: 18px; background: #fef2f2; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
        Por segurança, entre com essa senha temporária e altere sua senha assim que possível.
      </div>
      ${button("Entrar agora", loginUrl)}
    `
  });
}

export function contactInterestAdminTemplate(input: ContactInterestTemplateInput): string {
  return baseTemplate({
    title: "Novo interesse recebido",
    preview: `${input.name} quer participar de ${input.areaInterest}.`,
    children: `
      ${paragraph("Um novo interesse de contato chegou pelo site.")}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 10px 0 22px;">
        ${infoRow("Nome", input.name)}
        ${infoRow("WhatsApp", input.whatsapp)}
        ${infoRow("Email", input.email)}
        ${infoRow("Área", input.areaInterest)}
        ${infoRow("Mensagem", input.message)}
      </table>
      ${button("Abrir painel", publicUrl("admin/contact-interests.html"))}
    `
  });
}

export function contactInterestConfirmationTemplate(input: ContactInterestTemplateInput): string {
  return baseTemplate({
    title: "Recebemos seu interesse",
    preview: "A Mocidade Livre recebeu sua mensagem.",
    children: `
      ${paragraph(`Olá, ${input.name}!`)}
      ${paragraph(`Recebemos seu interesse em ${input.areaInterest}. Nossa equipe vai olhar com carinho e entrar em contato pelo WhatsApp informado.`)}
      <div style="margin: 22px 0; padding: 18px; border-radius: 20px; background: ${brand.soft}; color: ${brand.primary}; font-size: 14px; line-height: 1.6;">
        Obrigado por querer caminhar mais perto. Tem espaço pra você aqui.
      </div>
      ${button("Conhecer mais", publicUrl("areas.html"))}
    `
  });
}
