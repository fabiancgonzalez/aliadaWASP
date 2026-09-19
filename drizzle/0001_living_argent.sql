ALTER TABLE "orders" ADD COLUMN "mercado_pago_preference_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status_detail" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_mercado_pago_preference_id_unique" UNIQUE("mercado_pago_preference_id");