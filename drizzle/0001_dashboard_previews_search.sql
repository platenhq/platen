ALTER TABLE "documents" ADD COLUMN "preview_html" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "page_size" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "page_margins" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("documents"."title", '')), 'A') || setweight(to_tsvector('english', left(coalesce("documents"."content_text", ''), 200000)), 'B')) STORED;--> statement-breakpoint
CREATE INDEX "documents_search_vector_idx" ON "documents" USING gin ("search_vector");