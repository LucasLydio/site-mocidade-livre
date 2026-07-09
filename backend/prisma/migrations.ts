import { prisma } from "../src/infra/prisma/prisma.client";

const sql = `
create extension if not exists pgcrypto;

create unique index if not exists product_images_one_cover_per_product
  on public.product_images(product_id) where is_cover = true;

alter table public.products
  drop constraint if exists products_price_cents_check,
  add constraint products_price_cents_check check (price_cents >= 0),
  drop constraint if exists products_stock_qty_check,
  add constraint products_stock_qty_check check (stock_qty >= 0);

alter table public.cart_items
  drop constraint if exists cart_items_quantity_check,
  add constraint cart_items_quantity_check check (quantity > 0),
  drop constraint if exists cart_items_unit_price_cents_check,
  add constraint cart_items_unit_price_cents_check check (unit_price_cents >= 0);
`;

export async function applyDatabaseSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(sql);
}

if (require.main === module) {
  applyDatabaseSchema()
    .then(() => prisma.$disconnect())
    .catch(async (error: unknown) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
