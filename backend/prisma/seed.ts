import { env } from "../src/config/env";
import { prisma } from "../src/infra/prisma/prisma.client";
import { hashPassword } from "../src/utils/hash";

async function main(): Promise<void> {
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
    await prisma.user.upsert({
      where: { email: env.ADMIN_EMAIL.toLowerCase() },
      update: { role: "admin", isActive: true },
      create: {
        name: "Mocidade Livre Admin",
        email: env.ADMIN_EMAIL.toLowerCase(),
        role: "admin",
        passwordHash
      }
    });
  } else {
    console.info("ADMIN_EMAIL/ADMIN_PASSWORD not set; admin seed skipped.");
  }

  const categories = [
    { name: "Camisetas", slug: "camisetas", description: "Camisetas da Mocidade Livre." },
    { name: "Acessórios", slug: "acessorios", description: "Acessórios e lembranças." }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
