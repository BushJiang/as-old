CREATE TABLE "icebreakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"matched_user_id" uuid NOT NULL,
	"topics" jsonb NOT NULL,
	"favorite_topic_ids" jsonb DEFAULT '[]'::jsonb,
	"generation_status" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "match_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"history_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"matched_user_id" uuid NOT NULL,
	"match_type" varchar(20) NOT NULL,
	"similarity_score" jsonb,
	"match_reasons" jsonb DEFAULT '{"commonInterests":[],"complementaryNeeds":[],"otherReasons":[]}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"embedding_type" varchar(20) NOT NULL,
	"source_text" text NOT NULL,
	"source_index" integer NOT NULL,
	"embedding" vector(1024),
	"embedding_generated_at" timestamp,
	"embedding_generation_status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"age_range_min" integer DEFAULT 18,
	"age_range_max" integer DEFAULT 100,
	"preferred_cities" jsonb DEFAULT '[]'::jsonb,
	"preferred_interests" jsonb DEFAULT '[]'::jsonb,
	"show_me" varchar(20) DEFAULT 'everyone',
	"email_notifications" boolean DEFAULT true,
	"push_notifications" boolean DEFAULT false,
	"notification_frequency" varchar(20) DEFAULT 'realtime',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"age" integer NOT NULL,
	"city" varchar(100),
	"avatar_url" varchar(500) DEFAULT '/avatars/default.svg',
	"bio" text,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"needs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provide" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"embedding" vector(1024),
	"embedding_generated_at" timestamp,
	"embedding_generation_status" varchar(20) DEFAULT 'pending',
	"privacy_settings" jsonb DEFAULT '{"profileVisible":"public","showInterests":true,"showNeeds":true,"showProvide":true}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"image" varchar(255),
	"password" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "icebreakers" ADD CONSTRAINT "icebreakers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icebreakers" ADD CONSTRAINT "icebreakers_matched_user_id_users_id_fk" FOREIGN KEY ("matched_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_history" ADD CONSTRAINT "match_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_matched_user_id_users_id_fk" FOREIGN KEY ("matched_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_embeddings" ADD CONSTRAINT "user_embeddings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_icebreakers_pair" ON "icebreakers" USING btree ("user_id","matched_user_id");--> statement-breakpoint
CREATE INDEX "idx_icebreakers_user_id" ON "icebreakers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_icebreakers_created_at" ON "icebreakers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_match_history_user_id" ON "match_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_match_history_created_at" ON "match_history" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_matches_pair" ON "matches" USING btree ("user_id","matched_user_id");--> statement-breakpoint
CREATE INDEX "idx_matches_user_id" ON "matches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_matches_matched_user_id" ON "matches" USING btree ("matched_user_id");--> statement-breakpoint
CREATE INDEX "idx_matches_type" ON "matches" USING btree ("match_type");--> statement-breakpoint
CREATE INDEX "idx_matches_created_at" ON "matches" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_embeddings_type_index" ON "user_embeddings" USING btree ("user_id","embedding_type","source_index");--> statement-breakpoint
CREATE INDEX "idx_user_embeddings_user_id" ON "user_embeddings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_embeddings_type" ON "user_embeddings" USING btree ("embedding_type");--> statement-breakpoint
CREATE INDEX "idx_user_embeddings_status" ON "user_embeddings" USING btree ("embedding_generation_status");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_preferences_user_id" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_profiles_user_id" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_city" ON "user_profiles" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_age" ON "user_profiles" USING btree ("age");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_embedding_status" ON "user_profiles" USING btree ("embedding_generation_status");