CREATE TABLE IF NOT EXISTS "sticker_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(160) NOT NULL,
	"phone" varchar(20) DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sticker_submissions" ADD COLUMN IF NOT EXISTS "phone" varchar(20) DEFAULT '' NOT NULL;

