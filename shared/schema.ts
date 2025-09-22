import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  time,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone").unique(),
  password: varchar("password"), // For registered users (demo users don't need this)
  role: varchar("role").notNull().default("client"), // client, admin, manager
  isActive: boolean("is_active").notNull().default(true),
  emailVerified: boolean("email_verified").default(false), // For email verification
  notificationPreferences: jsonb("notification_preferences").default({
    sms: true,
    email: true,
    marketing: false,
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sports Master - Sport types and categories
export const sports = pgTable("sports_master", {
  id: serial("sport_id").primaryKey(),
  sportCode: varchar("sport_code", { length: 10 }).unique().notNull(),
  sportName: varchar("sport_name", { length: 100 }).notNull(),
  bookingType: varchar("booking_type", { length: 20 }).notNull().default("full-ground"), // per-person, full-ground, both
  description: text("description"),
  imageUrl: varchar("image_url", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  modifiedAt: timestamp("modified_date").defaultNow(),
});

// Grounds Master - Physical facilities/courts
export const grounds = pgTable("grounds_master", {
  id: serial("ground_id").primaryKey(),
  sportId: integer("sport_id").notNull().references(() => sports.id),
  groundName: varchar("ground_name", { length: 100 }).notNull(),
  groundCode: varchar("ground_code", { length: 20 }).unique().notNull(),
  location: varchar("location", { length: 255 }),
  facilities: text("facilities"),
  maxCapacity: integer("max_capacity"), // Only for per-person booking
  imageUrl: varchar("image_url", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  modifiedAt: timestamp("modified_date").defaultNow(),
});

// Plans Master - Pricing plans for different plan types
export const plans = pgTable("plans_master", {
  id: serial("plan_id").primaryKey(),
  groundId: integer("ground_id").notNull().references(() => grounds.id),
  planName: varchar("plan_name", { length: 100 }).notNull(),
  planType: varchar("plan_type", { length: 20 }).notNull(), // hourly, monthly, yearly
  durationDays: integer("duration_days").notNull().default(1), // 1 for hourly, 30 for monthly, 365 for yearly
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  peakHourMultiplier: decimal("peak_hour_multiplier", { precision: 3, scale: 2 }).default("1.0"),
  weekendMultiplier: decimal("weekend_multiplier", { precision: 3, scale: 2 }).default("1.0"),
  description: text("description"),
  operatingHours: jsonb("operating_hours"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  modifiedAt: timestamp("modified_date").defaultNow(),
});

// Time Slots Master - Standard time slot definitions
export const timeSlots = pgTable("time_slots_master", {
  id: serial("time_slot_id").primaryKey(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  slotName: varchar("slot_name", { length: 50 }).notNull(),
  isPeakHour: boolean("is_peak_hour").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  modifiedAt: timestamp("modified_date").defaultNow(),
});

// No legacy tables - only master tables are used



// Booking Master - Main booking record (uses sport_id and ground_id from master tables)
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sportId: integer("sport_id").notNull().references(() => sports.id),
  groundId: integer("ground_id").notNull().references(() => grounds.id),
  bookingType: varchar("booking_type").notNull(), // per-person, full-ground
  planType: varchar("plan_type").notNull(), // hourly, monthly, yearly
  startDate: date("start_date").notNull(), // Booking start date
  endDate: date("end_date").notNull(), // Booking end date (calculated from plan duration)
  duration: integer("duration"), // Duration in minutes (for hourly bookings)
  participantCount: integer("participant_count").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  status: varchar("status").notNull().default("confirmed"), // pending, confirmed, cancelled, completed
  paymentStatus: varchar("payment_status").notNull().default("pending"), // pending, partial, completed, failed, refunded
  paymentMethod: varchar("payment_method"), // credit_card, upi, cash
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringEndDate: date("recurring_end_date"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Booking Slots - Individual date/time combinations for a booking
export const bookingSlots = pgTable("booking_slots", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  bookingDate: date("booking_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  participantCount: integer("participant_count").default(1), // Store participants per slot
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(),
  transactionId: varchar("transaction_id"),
  status: varchar("status").notNull().default("pending"), // pending, completed, failed, refunded
  paymentGatewayResponse: jsonb("payment_gateway_response"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"), // Admin discount amount
  discountReason: varchar("discount_reason"), // Reason for discount (admin only)
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coupons
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code").notNull().unique(),
  description: text("description"),
  discountType: varchar("discount_type").notNull(), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minBookingAmount: decimal("min_booking_amount", { precision: 10, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  applicableFacilities: jsonb("applicable_facilities").default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});





// Notifications (enhanced for queue system)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // booking_confirmation, reminder, marketing, maintenance, queue_update
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  channels: jsonb("channels").default(["app"]), // app, sms, email
  isRead: boolean("is_read").notNull().default(false),
  sentAt: timestamp("sent_at"),
  scheduledFor: timestamp("scheduled_for"),
  metadata: jsonb("metadata"),
  relatedBookingId: integer("related_booking_id").references(() => bookings.id),
 
  createdAt: timestamp("created_at").defaultNow(),
});

// Maintenance schedules (now references grounds master table)
export const maintenance = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  groundId: integer("ground_id").notNull().references(() => grounds.id),
  title: varchar("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User preferences and settings
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  favoritesFacilities: jsonb("favorites_facilities").default([]),
  defaultBookingType: varchar("default_booking_type").default("per-person"),
  reminderPreferences: jsonb("reminder_preferences").default({
    beforeBooking: 60, // minutes
    beforeSession: 15, // minutes
    afterSession: 5, // minutes
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema exports for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// New Master Tables Insert Schemas
export const insertSportSchema = createInsertSchema(sports).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
});

export const insertGroundSchema = createInsertSchema(grounds).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
}).extend({
  basePrice: z.union([z.string(), z.number()]).transform(val => val.toString()),
  peakHourMultiplier: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === undefined || val === "" ? undefined : val.toString())),
  weekendMultiplier: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === undefined || val === "" ? undefined : val.toString())),
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
});


// Core booking and payment schemas

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  totalAmount: z.union([z.string(), z.number()]).transform(val => val.toString()),
  discountAmount: z.union([z.string(), z.number()]).transform(val => val.toString()),
  paidAmount: z.union([z.string(), z.number()]).transform(val => val.toString()).optional(),
  sportId: z.number().optional(), // Will be set from ground if not provided

});

export const insertBookingSlotSchema = createInsertSchema(bookingSlots).omit({
  id: true,
  bookingId: true, // Will be set during creation
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => val.toString()),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => val.toString()),
  discountAmount: z.union([z.string(), z.number()]).transform(val => val.toString()).optional(),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usedCount: true,
  createdAt: true,
}).extend({
  discountValue: z.union([z.string(), z.number()]).transform(val => val.toString()),
  minBookingAmount: z.union([z.string(), z.number()]).transform(val => val.toString()).optional(),
  maxDiscount: z.union([z.string(), z.number()]).transform(val => val.toString()).optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Master table schemas only

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Sport = typeof sports.$inferSelect;
export type InsertSport = z.infer<typeof insertSportSchema>;
export type Ground = typeof grounds.$inferSelect;
export type InsertGround = z.infer<typeof insertGroundSchema>;
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;

// Only master table types are used
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type BookingSlot = typeof bookingSlots.$inferSelect;
export type InsertBookingSlot = z.infer<typeof insertBookingSlotSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;


export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
// Time slots removed - using master tables only

