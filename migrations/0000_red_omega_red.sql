CREATE TABLE "booking_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"booking_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"duration" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"participant_count" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"sport_id" integer NOT NULL,
	"ground_id" integer NOT NULL,
	"booking_type" varchar NOT NULL,
	"plan_type" varchar NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"duration" integer,
	"participant_count" integer DEFAULT 1,
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"status" varchar DEFAULT 'confirmed' NOT NULL,
	"payment_status" varchar DEFAULT 'pending' NOT NULL,
	"payment_method" varchar,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_end_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar NOT NULL,
	"description" text,
	"discount_type" varchar NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_booking_amount" numeric(10, 2),
	"max_discount" numeric(10, 2),
	"usage_limit" integer,
	"used_count" integer DEFAULT 0,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp NOT NULL,
	"applicable_facilities" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "grounds_master" (
	"ground_id" serial PRIMARY KEY NOT NULL,
	"sport_id" integer NOT NULL,
	"ground_name" varchar(100) NOT NULL,
	"ground_code" varchar(20) NOT NULL,
	"location" varchar(255),
	"facilities" text,
	"max_capacity" integer,
	"image_url" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"modified_date" timestamp DEFAULT now(),
	CONSTRAINT "grounds_master_ground_code_unique" UNIQUE("ground_code")
);
--> statement-breakpoint
CREATE TABLE "maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"ground_id" integer NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"channels" jsonb DEFAULT '["app"]'::jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp,
	"scheduled_for" timestamp,
	"metadata" jsonb,
	"related_booking_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar NOT NULL,
	"transaction_id" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"payment_gateway_response" jsonb,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"discount_reason" varchar,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plans_master" (
	"plan_id" serial PRIMARY KEY NOT NULL,
	"ground_id" integer NOT NULL,
	"plan_name" varchar(100) NOT NULL,
	"plan_type" varchar(20) NOT NULL,
	"duration_days" integer DEFAULT 1 NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"peak_hour_multiplier" numeric(3, 2) DEFAULT '1.0',
	"weekend_multiplier" numeric(3, 2) DEFAULT '1.0',
	"description" text,
	"operating_hours" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"modified_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sports_master" (
	"sport_id" serial PRIMARY KEY NOT NULL,
	"sport_code" varchar(10) NOT NULL,
	"sport_name" varchar(100) NOT NULL,
	"booking_type" varchar(20) DEFAULT 'full-ground' NOT NULL,
	"description" text,
	"image_url" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"modified_date" timestamp DEFAULT now(),
	CONSTRAINT "sports_master_sport_code_unique" UNIQUE("sport_code")
);
--> statement-breakpoint
CREATE TABLE "time_slots_master" (
	"time_slot_id" serial PRIMARY KEY NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"slot_name" varchar(50) NOT NULL,
	"is_peak_hour" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"modified_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"favorites_facilities" jsonb DEFAULT '[]'::jsonb,
	"default_booking_type" varchar DEFAULT 'per-person',
	"reminder_preferences" jsonb DEFAULT '{"beforeBooking":60,"beforeSession":15,"afterSession":5}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"phone" varchar,
	"password" varchar,
	"role" varchar DEFAULT 'client' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" boolean DEFAULT false,
	"notification_preferences" jsonb DEFAULT '{"sms":true,"email":true,"marketing":false}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "booking_slots" ADD CONSTRAINT "booking_slots_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_sport_id_sports_master_sport_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports_master"("sport_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_ground_id_grounds_master_ground_id_fk" FOREIGN KEY ("ground_id") REFERENCES "public"."grounds_master"("ground_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grounds_master" ADD CONSTRAINT "grounds_master_sport_id_sports_master_sport_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports_master"("sport_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_ground_id_grounds_master_ground_id_fk" FOREIGN KEY ("ground_id") REFERENCES "public"."grounds_master"("ground_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_booking_id_bookings_id_fk" FOREIGN KEY ("related_booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans_master" ADD CONSTRAINT "plans_master_ground_id_grounds_master_ground_id_fk" FOREIGN KEY ("ground_id") REFERENCES "public"."grounds_master"("ground_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");