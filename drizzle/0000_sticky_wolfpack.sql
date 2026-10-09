CREATE TABLE "blackout_dates" (
	"day" date PRIMARY KEY NOT NULL,
	"reason" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"key" varchar(48) PRIMARY KEY NOT NULL,
	"text_ru" text DEFAULT '' NOT NULL,
	"text_kk" text DEFAULT '' NOT NULL,
	"status" varchar(16) DEFAULT 'unconfirmed' NOT NULL,
	"source" varchar(16) DEFAULT 'none' NOT NULL,
	"question_ru" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"confirmed_by" text,
	"confirmed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(48) NOT NULL,
	"lead_id" integer,
	"session_id" varchar(64),
	"path" text,
	"props" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"width" integer DEFAULT 0 NOT NULL,
	"height" integer DEFAULT 0 NOT NULL,
	"before_url" text,
	"category" varchar(16) DEFAULT 'windows' NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"show_on_home" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"type" varchar(32) NOT NULL,
	"from_status" varchar(24),
	"to_status" varchar(24),
	"actor_type" varchar(16) DEFAULT 'system' NOT NULL,
	"actor_id" text,
	"actor_name" text,
	"channel" varchar(16),
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"mime" varchar(128) NOT NULL,
	"size" integer NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" varchar(64) NOT NULL,
	"segment" varchar(8) DEFAULT 'b2c' NOT NULL,
	"kind" varchar(16) DEFAULT 'other' NOT NULL,
	"form_kind" varchar(16) DEFAULT 'quick' NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"phone_normalized" varchar(16) NOT NULL,
	"email" text,
	"organization" text,
	"product_type" text,
	"calc_payload" jsonb,
	"district" text,
	"address" text,
	"comment" text,
	"preferred_contact" varchar(16) DEFAULT 'call' NOT NULL,
	"preferred_dates" text,
	"status" varchar(24) DEFAULT 'new' NOT NULL,
	"assignee_id" integer,
	"priority" varchar(8) DEFAULT 'normal' NOT NULL,
	"source" varchar(32) DEFAULT 'direct' NOT NULL,
	"utm" jsonb,
	"referrer" text,
	"landing_path" text,
	"page_path" text,
	"device" varchar(16),
	"lang" varchar(8) DEFAULT 'ru' NOT NULL,
	"consent_at" timestamp with time zone,
	"consent_version" varchar(16),
	"lost_reason" varchar(32),
	"lost_comment" text,
	"review_requested_at" timestamp with time zone,
	"first_response_at" timestamp with time zone,
	"status_token" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurement_rules" (
	"weekday" smallint NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"slot_minutes" integer DEFAULT 60 NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "measurement_rules_weekday_pk" PRIMARY KEY("weekday")
);
--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"district" text,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"assignee_id" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" varchar(16) NOT NULL,
	"dedupe_key" varchar(128) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"lead_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_price_per_m2" integer DEFAULT 0 NOT NULL,
	"kind_coef" jsonb,
	"option_coef" jsonb,
	"install_price" integer DEFAULT 0 NOT NULL,
	"delivery_price" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"note" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_code" varchar(32) NOT NULL,
	"code" varchar(64) NOT NULL,
	"title_ru" text NOT NULL,
	"type" varchar(16) NOT NULL,
	"choices" jsonb,
	"unit" varchar(16),
	"required" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"title_ru" text NOT NULL,
	"kind" varchar(16) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"bucket" varchar(128) PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews_curated" (
	"id" serial PRIMARY KEY NOT NULL,
	"author" text NOT NULL,
	"text" text NOT NULL,
	"source_url" text,
	"consent" boolean DEFAULT false NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" varchar(32) NOT NULL,
	"name" text NOT NULL,
	"role" varchar(16) DEFAULT 'manager' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_invites" (
	"code" varchar(32) PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"role" varchar(16) DEFAULT 'manager' NOT NULL,
	"used_by_telegram_id" varchar(32),
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(16) DEFAULT 'manager' NOT NULL,
	"totp_secret" text,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_files" ADD CONSTRAINT "lead_files_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "claims_status_idx" ON "claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_name_idx" ON "events" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX "gallery_category_idx" ON "gallery_items" USING btree ("category","sort");--> statement-breakpoint
CREATE INDEX "lead_events_lead_idx" ON "lead_events" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "lead_files_lead_idx" ON "lead_files" USING btree ("lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_submission_uq" ON "leads" USING btree ("submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_status_token_uq" ON "leads" USING btree ("status_token");--> statement-breakpoint
CREATE INDEX "leads_phone_idx" ON "leads" USING btree ("phone_normalized");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_created_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_assignee_idx" ON "leads" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "measurements_starts_idx" ON "measurements" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "measurements_lead_idx" ON "measurements" USING btree ("lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_jobs_dedupe_uq" ON "notification_jobs" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "notification_jobs_status_idx" ON "notification_jobs" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "price_rules_active_idx" ON "price_rules" USING btree ("active","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_options_uq" ON "product_options" USING btree ("product_code","code");--> statement-breakpoint
CREATE UNIQUE INDEX "products_code_uq" ON "products" USING btree ("code");--> statement-breakpoint
CREATE INDEX "rate_limits_window_idx" ON "rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_telegram_uq" ON "staff" USING btree ("telegram_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree (lower("email"));