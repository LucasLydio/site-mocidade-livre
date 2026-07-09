CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "user_role" AS ENUM ('admin', 'common');
CREATE TYPE "contact_interest_status" AS ENUM ('new', 'contacted', 'archived');
CREATE TYPE "cart_status" AS ENUM ('open', 'sent_to_whatsapp', 'abandoned');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL,
  "email" TEXT NOT NULL, "telephone" TEXT, "role" "user_role" NOT NULL DEFAULT 'common',
  "password_hash" TEXT NOT NULL, "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "areas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "description" TEXT, "cover_image_url" TEXT, "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "areas_slug_key" ON "areas"("slug");
CREATE INDEX "areas_is_active_idx" ON "areas"("is_active");

CREATE TABLE "events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "title" TEXT NOT NULL, "summary" TEXT,
  "description" TEXT, "starts_at" TIMESTAMPTZ(6) NOT NULL, "ends_at" TIMESTAMPTZ(6),
  "location_name" TEXT, "location_address" TEXT, "cover_image_url" TEXT,
  "is_published" BOOLEAN NOT NULL DEFAULT false, "created_by" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE INDEX "events_starts_at_idx" ON "events"("starts_at");
CREATE INDEX "events_is_published_starts_at_idx" ON "events"("is_published", "starts_at");

CREATE TABLE "contact_interests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "whatsapp" TEXT NOT NULL,
  "email" TEXT, "area_interest" TEXT NOT NULL, "message" TEXT,
  "status" "contact_interest_status" NOT NULL DEFAULT 'new',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_interests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "contact_interests_status_created_at_idx" ON "contact_interests"("status", "created_at");

CREATE TABLE "categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "description" TEXT, "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");

CREATE TABLE "products" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "category_id" UUID, "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL, "description" TEXT, "price_cents" INTEGER NOT NULL,
  "stock_qty" INTEGER NOT NULL DEFAULT 0, "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "products_price_cents_check" CHECK ("price_cents" >= 0),
  CONSTRAINT "products_stock_qty_check" CHECK ("stock_qty" >= 0),
  CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE INDEX "products_category_id_idx" ON "products"("category_id");
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

CREATE TABLE "product_images" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "product_id" UUID NOT NULL,
  "image_url" TEXT NOT NULL, "storage_path" TEXT, "alt_text" TEXT,
  "is_cover" BOOLEAN NOT NULL DEFAULT false, "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_images_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
);
CREATE INDEX "product_images_product_id_sort_order_idx" ON "product_images"("product_id", "sort_order");
CREATE UNIQUE INDEX "product_images_one_cover_per_product" ON "product_images"("product_id") WHERE "is_cover" = true;

CREATE TABLE "carts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID,
  "status" "cart_status" NOT NULL DEFAULT 'open', "customer_name" TEXT,
  "customer_whatsapp" TEXT, "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "carts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "carts_user_id_status_idx" ON "carts"("user_id", "status");

CREATE TABLE "cart_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "cart_id" UUID NOT NULL, "product_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL, "unit_price_cents" INTEGER NOT NULL, "product_name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cart_items_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "cart_items_unit_price_cents_check" CHECK ("unit_price_cents" >= 0),
  CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE,
  CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "cart_items"("cart_id", "product_id");
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");
