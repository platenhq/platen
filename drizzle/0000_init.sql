CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"owner_email" text NOT NULL,
	"content_json" jsonb,
	"content_text" text,
	"content_html" text,
	"content_saved_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "documents_owner_email_idx" ON "documents" USING btree ("owner_email");