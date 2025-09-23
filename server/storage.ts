import {
  users,
  sports,
  grounds,
  plans,
  timeSlots,
  bookings,
  bookingSlots,
  payments,
  coupons,
  notifications,

  type User,
  type UpsertUser,
  type Sport,
  type InsertSport,
  type Ground,
  type InsertGround,
  type Plan,
  type InsertPlan,
  type TimeSlot,
  type InsertTimeSlot,
  type Booking,
  type InsertBooking,
  type BookingSlot,
  type InsertBookingSlot,
  type Payment,
  type InsertPayment,
  type Coupon,
  type InsertCoupon,
  type Notification,
  type InsertNotification,

} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, sql, or, count, sum, ne, lt, gt, inArray, like, ilike } from "drizzle-orm";
import { format } from "date-fns";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  getUsers(options: { page: number; limit: number; role?: string; search?: string }): Promise<{ users: User[]; total: number }>;

  // Sports Master operations
  getSports(): Promise<Sport[]>;
  getAllSports(): Promise<Sport[]>;
  getSport(id: number): Promise<Sport | undefined>;
  createSport(sport: InsertSport): Promise<Sport>;
  updateSport(id: number, data: Partial<InsertSport>): Promise<Sport>;
  deleteSport(id: number): Promise<void>;

  // Grounds Master operations
  getGrounds(): Promise<Ground[]>;
  getAllGrounds(): Promise<Ground[]>;
  getGround(id: number): Promise<Ground | undefined>;
  getGroundsBySport(sportId: number): Promise<Ground[]>;
  createGround(ground: InsertGround): Promise<Ground>;
  updateGround(id: number, data: Partial<InsertGround>): Promise<Ground>;
  deleteGround(id: number): Promise<void>;

  // Plans Master operations
  getPlans(): Promise<Plan[]>;
  getAllPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  getPlansByGround(groundId: number): Promise<Plan[]>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, data: Partial<InsertPlan>): Promise<Plan>;
  deletePlan(id: number): Promise<void>;

  // Facility operations (now use master tables exclusively)
  getFacilities(): Promise<any[]>;
  getFacility(id: number): Promise<any | undefined>;
  getPopularFacilities(): Promise<any[]>;
  getFacilitySlots(facilityId: number, date?: string): Promise<any[]>;

  // Booking operations
  getBookings(userId?: string, options?: { page?: number; limit?: number; status?: string }): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getGroundById(id: number): Promise<Ground | undefined>;
  getBookingDetails(id: number): Promise<any>;
  getUserBookings(userId: string): Promise<Booking[]>;
  getPendingPayments(userId: string): Promise<any[]>;
  getBookingsForSlot(groundId: number, bookingDate: string, startTime: string): Promise<Booking[]>;
  checkDuplicateBooking(userId: string, groundId: number, bookingDate: string, startTime: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking, slots: InsertBookingSlot[]): Promise<{ booking: Booking; slots: BookingSlot[] }>;
  updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking>;
  cancelBooking(id: number): Promise<Booking>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getAllPendingPayments(): Promise<any[]>;
  getPayments(bookingId?: number): Promise<Payment[]>;
  getAllPayments(): Promise<any[]>;
  getAllUserPayments(userId: string): Promise<any[]>;
  updatePaymentStatus(paymentId: number, status: string, notes?: string): Promise<Payment>;
  updateBookingPaymentStatus(bookingId: number, status: string, transactionId?: string): Promise<void>;

  // Coupon operations
  getCoupons(): Promise<Coupon[]>;
  getCoupon(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;

  // Admin operations
  getDashboardStats(): Promise<any>;
  getAdminBookings(options?: { page?: number; limit?: number; status?: string; search?: string; sortBy?: string }): Promise<{ bookings: any[]; total: number }>;
  getBookingSlots(bookingId: number): Promise<BookingSlot[]>;
  updateBookingStatus(id: number, status: string): Promise<Booking>;
  updateBookingPayment(bookingId: number, paymentData: { paidAmount: string; paymentStatus: string; status: string }): Promise<Booking>;
  
  // Reports operations
  getRevenueReport(period: 'day' | 'week' | 'month', startDate?: string, endDate?: string): Promise<any[]>;
  getRevenueReportBySport(period: 'day' | 'week' | 'month', startDate?: string, endDate?: string): Promise<any[]>;
  getFacilityUsageReport(period: 'day' | 'week' | 'month', startDate?: string, endDate?: string): Promise<any[]>;
  getMemberBookingReport(userId?: string, startDate?: string, endDate?: string): Promise<any[]>;
  getMemberPaymentReport(userId?: string, startDate?: string, endDate?: string): Promise<any[]>;
  getCouponUsageReport(startDate?: string, endDate?: string): Promise<any[]>;


  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number, userId: string): Promise<void>;
  sendBookingReminders(): Promise<{ remindersSent: number; details: any[] }>;
  sendPaymentReminders(): Promise<{ remindersSent: number; details: any[] }>;
  processExpiredBookings(): Promise<{ cancelledBookings: number; details: any[] }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(user: any): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existingUser = await this.getUser(user.id);
    if (existingUser) {
      return await this.updateUser(user.id, user);
    } else {
      return await this.createUser(user);
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getUsers(options: { page: number; limit: number; role?: string; search?: string }): Promise<{ users: any[]; total: number }> {
    const { page, limit, role, search } = options;
    const offset = (page - 1) * limit;

    // Use Drizzle ORM instead of raw SQL for better parameter handling
    let baseQuery = db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users);

    // Apply filters
    const conditions = [];
    if (role && role !== 'all') {
      conditions.push(eq(users.role, role));
    }
    if (search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      baseQuery = db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      }).from(users).where(and(...conditions));
    }

    // Get paginated results
    const usersList = await baseQuery
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    let countQuery = db.select({ count: sql`count(*)` }).from(users);
    if (conditions.length > 0) {
      countQuery = db.select({ count: sql`count(*)` }).from(users).where(and(...conditions));
    }
    const countResult = await countQuery;
    const total = parseInt(countResult[0].count as string) || 0;

    // Calculate booking and payment statistics for each user using proper SQL joins
    const userIds = usersList.map(user => user.id);
    
    // Get booking counts for all users at once
    const bookingStats = await db
      .select({
        userId: bookings.userId,
        count: sql`count(*)`
      })
      .from(bookings)
      .where(inArray(bookings.userId, userIds))
      .groupBy(bookings.userId);

    // Get payment totals for all users at once
    const paymentStats = await db
      .select({
        userId: payments.userId,
        total: sql`COALESCE(SUM(${payments.amount}), 0)`
      })
      .from(payments)
      .where(
        and(
          inArray(payments.userId, userIds),
          eq(payments.status, 'completed')
        )
      )
      .groupBy(payments.userId);

    // Create lookup maps for performance
    const bookingLookup = new Map(
      bookingStats.map(stat => [stat.userId, parseInt(stat.count as string) || 0])
    );
    const paymentLookup = new Map(
      paymentStats.map(stat => [stat.userId, parseFloat(stat.total as string) || 0])
    );

    // Map results with actual statistics
    const usersWithStats = usersList.map(user => ({
      ...user,
      lastLogin: null, // Remove since not in schema
      bookingsCount: bookingLookup.get(user.id) || 0,
      totalSpent: paymentLookup.get(user.id) || 0
    }));

    return { users: usersWithStats, total };
  }

  // Sports Master operations
  async getSports(): Promise<Sport[]> {
    return await db.select().from(sports).where(eq(sports.isActive, true)).orderBy(asc(sports.sportName));
  }

  async getAllSports(): Promise<Sport[]> {
    return await db.select({
      id: sports.id,
      sportId: sports.id,
      sportName: sports.sportName,
      sportCode: sports.sportCode,
      description: sports.description,
      bookingType: sports.bookingType,
      imageUrl: sports.imageUrl,
      isActive: sports.isActive,
      createdAt: sports.createdAt,
      modifiedAt: sports.modifiedAt
    }).from(sports).where(eq(sports.isActive, true)).orderBy(asc(sports.sportName));
  }

  async getSport(id: number): Promise<Sport | undefined> {
    const [sport] = await db.select().from(sports).where(eq(sports.id, id));
    return sport;
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    const [newSport] = await db.insert(sports).values(sport).returning();
    return newSport;
  }

  async updateSport(id: number, data: Partial<InsertSport>): Promise<Sport> {
    const [sport] = await db.update(sports).set(data).where(eq(sports.id, id)).returning();
    return sport;
  }

  async deleteSport(id: number): Promise<void> {
    await db.update(sports).set({ isActive: false }).where(eq(sports.id, id));
  }

  // Grounds Master operations
  async getGrounds(): Promise<Ground[]> {
    return await db.select().from(grounds).where(eq(grounds.isActive, true)).orderBy(asc(grounds.groundName));
  }

  async getAllGrounds(): Promise<Ground[]> {
    return await db.select({
      id: grounds.id,
      groundId: grounds.id,
      sportId: grounds.sportId,
      groundName: grounds.groundName,
      groundCode: grounds.groundCode,
      location: grounds.location,
      facilities: grounds.facilities,
      maxCapacity: grounds.maxCapacity,

      imageUrl: grounds.imageUrl,
      isActive: grounds.isActive,
      createdAt: grounds.createdAt,
      modifiedAt: grounds.modifiedAt
    }).from(grounds).where(eq(grounds.isActive, true)).orderBy(asc(grounds.groundName));
  }

  async getGround(id: number): Promise<Ground | undefined> {
    const [ground] = await db.select().from(grounds).where(eq(grounds.id, id));
    return ground;
  }

  async getGroundsBySport(sportId: number): Promise<Ground[]> {
    return await db.select().from(grounds)
      .where(and(eq(grounds.sportId, sportId), eq(grounds.isActive, true)))
      .orderBy(asc(grounds.groundName));
  }

  async createGround(ground: InsertGround): Promise<Ground> {
    const [newGround] = await db.insert(grounds).values(ground).returning();
    return newGround;
  }

  async updateGround(id: number, data: Partial<InsertGround>): Promise<Ground> {
    const [ground] = await db.update(grounds).set(data).where(eq(grounds.id, id)).returning();
    return ground;
  }

  async deleteGround(id: number): Promise<void> {
    await db.update(grounds).set({ isActive: false }).where(eq(grounds.id, id));
  }

  // Plans Master operations
  async getPlans(): Promise<Plan[]> {
    return await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(asc(plans.planName));
  }

  async getAllPlans(): Promise<Plan[]> {
    return await db.select({
      id: plans.id,
      planId: plans.id,
      groundId: plans.groundId,
      planName: plans.planName,
      planType: plans.planType,
      durationDays: plans.durationDays,
      basePrice: plans.basePrice,
      peakHourMultiplier: plans.peakHourMultiplier,
      weekendMultiplier: plans.weekendMultiplier,
      description: plans.description,
      operatingHours: plans.operatingHours,
      isActive: plans.isActive,
      createdAt: plans.createdAt,
      modifiedAt: plans.modifiedAt,
    }).from(plans).where(eq(plans.isActive, true)).orderBy(asc(plans.planName));
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async getPlansByGround(groundId: number): Promise<Plan[]> {
    return await db.select().from(plans)
      .where(and(eq(plans.groundId, groundId), eq(plans.isActive, true)))
      .orderBy(asc(plans.planName));
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [newPlan] = await db.insert(plans).values(plan).returning();
    return newPlan;
  }

  async updatePlan(id: number, data: Partial<InsertPlan>): Promise<Plan> {
    const [plan] = await db.update(plans).set(data).where(eq(plans.id, id)).returning();
    return plan;
  }

  async deletePlan(id: number): Promise<void> {
    await db.update(plans).set({ isActive: false }).where(eq(plans.id, id));
  }

  // Time Slots Master operations
  async getTimeSlots(): Promise<TimeSlot[]> {
    return await db.select().from(timeSlots).where(eq(timeSlots.isActive, true)).orderBy(asc(timeSlots.startTime));
  }

  async getAllTimeSlots(): Promise<TimeSlot[]> {
    return await db.select().from(timeSlots).orderBy(asc(timeSlots.startTime));
  }

  async getTimeSlot(id: number): Promise<TimeSlot | undefined> {
    const [timeSlot] = await db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return timeSlot;
  }

  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const [newTimeSlot] = await db.insert(timeSlots).values(timeSlot).returning();
    return newTimeSlot;
  }

  async updateTimeSlot(id: number, data: Partial<InsertTimeSlot>): Promise<TimeSlot> {
    const [timeSlot] = await db.update(timeSlots).set(data).where(eq(timeSlots.id, id)).returning();
    return timeSlot;
  }

  async deleteTimeSlot(id: number): Promise<void> {
    await db.update(timeSlots).set({ isActive: false }).where(eq(timeSlots.id, id));
  }

  // Facility operations using master tables
  async getFacilities(): Promise<any[]> {
    try {
      // Get raw data from database with proper column mapping
      const groundsResult = await db.select().from(grounds).where(eq(grounds.isActive, true));
      const sportsResult = await db.select().from(sports).where(eq(sports.isActive, true));
      const plansResult = await db.select().from(plans).where(eq(plans.isActive, true));
      
      const facilities = groundsResult.map(ground => {
        const sport = sportsResult.find(s => s.id === ground.sportId);
        const groundPlans = plansResult.filter(p => p.groundId === ground.id);

        const hourlyPlan = groundPlans.find(p => p.planType === 'hourly');
        const monthlyPlan = groundPlans.find(p => p.planType === 'monthly');
        const yearlyPlan = groundPlans.find(p => p.planType === 'yearly');

        const hourlyRate = hourlyPlan ? Number(hourlyPlan.basePrice) : 0;
        const monthlyRate = monthlyPlan
          ? Number(monthlyPlan.basePrice)
          : hourlyRate * 30;
        const yearlyRate = yearlyPlan
          ? Number(yearlyPlan.basePrice)
          : hourlyRate * 365;
        
        return {
          id: ground.id,
          facilityId: ground.id,
          groundId: ground.id,
          name: ground.groundName,
          type: sport?.sportName?.toLowerCase() || 'general',
          description: sport?.description || ground.groundName,
          capacity: ground.maxCapacity || 0,
          hourlyRate: hourlyRate.toString(),
          monthlyRate: monthlyRate.toString(),
          yearlyRate: yearlyRate.toString(),
          isActive: ground.isActive,
          location: ground.location || '',
          amenities: ground.facilities ? ground.facilities.split(',').map(a => a.trim()) : [],
          images: ground.imageUrl ? [ground.imageUrl] : [],
          createdAt: ground.createdAt,
          updatedAt: ground.modifiedAt,
          source: 'master',
          sportName: sport?.sportName,
          sportCode: sport?.sportCode,
          groundCode: ground.groundCode,
          bookingTypes: {
            perPerson: sport?.bookingType === 'per-person' || sport?.bookingType === 'both',
            fullGround: sport?.bookingType === 'full-ground' || sport?.bookingType === 'both'
          },
          plans: groundPlans.map(p => ({
            id: p.id,
            planId: p.id,
            planName: p.planName,
            planType: p.planType,
            durationDays: p.durationDays || 1,
            basePrice: Number(p.basePrice),
            peakHourMultiplier: Number(p.peakHourMultiplier || 1),
            weekendMultiplier: Number(p.weekendMultiplier || 1)
          }))
        };
      });
      
      return facilities;
    } catch (error) {
      console.error("Error in getFacilities:", error);
      return [];
    }
  }

  async getFacility(id: number): Promise<any | undefined> {
    const facilities = await this.getFacilities();
    return facilities.find(f => f.id === id || f.groundId === id || f.facilityId === id);
  }

  async getPopularFacilities(): Promise<any[]> {
    const facilities = await this.getFacilities();
    return facilities.slice(0, 6); // Return first 6 as popular
  }

async getFacilitySlots(facilityId: number, date?: string): Promise<any[]> {
  const targetDate = date || format(new Date(), 'yyyy-MM-dd');
  console.log(`=== getFacilitySlots called for facility ${facilityId} on ${targetDate} ===`);

  // Get facility/ground details
  const facilityResult = await db.select().from(grounds).where(eq(grounds.id, facilityId)).limit(1);
  if (!facilityResult.length) return [];
  const ground = facilityResult[0];
  const maxCapacity = ground.maxCapacity || 0;

  // Get sport details
  const sportResult = await db.select().from(sports).where(eq(sports.id, ground.sportId)).limit(1);
  const sport = sportResult[0];
  const supportsPerPerson = sport?.bookingType === 'per-person' || sport?.bookingType === 'both';

  // Fetch existing bookings (main bookings table)
  const existingBookingsFromMain = await db.select({
    participantCount: bookings.participantCount,
    bookingType: bookings.bookingType,
    status: bookings.status,
    planType: bookings.planType,
    startDate: bookings.startDate,
    endDate: bookings.endDate
  }).from(bookings)
    .where(and(
      eq(bookings.groundId, facilityId),
      ne(bookings.status, 'cancelled'),
      lte(bookings.startDate, targetDate),
      gte(bookings.endDate, targetDate)
    ));

  // Fetch existing hourly booking slots
  const existingBookingsFromSlots = await db.select({
    startTime: bookingSlots.startTime,
    endTime: bookingSlots.endTime,
    participantCount: bookingSlots.participantCount,
    bookingType: bookings.bookingType,
    status: bookings.status,
    planType: bookings.planType,
    bookingDate: bookingSlots.bookingDate
  }).from(bookingSlots)
    .innerJoin(bookings, eq(bookingSlots.bookingId, bookings.id))
    .where(and(
      eq(bookings.groundId, facilityId),
      eq(bookingSlots.bookingDate, targetDate),
      ne(bookings.status, 'cancelled')
    ));

  // Combine all bookings
  const existingBookings = [
  ...existingBookingsFromSlots,
  ...existingBookingsFromMain.map(b => ({
    ...b,
    startTime: b.startDate || "00:00:00",  // default to full day start
    endTime: b.endDate || "23:59:59",      // default to full day end
    bookingDate: targetDate
  }))
];

  console.log(`Total combined bookings: ${existingBookings.length}`);
  existingBookings.forEach((b, i) =>
    console.log(`  Booking ${i + 1}: ${b.startTime}-${b.endTime}, ${b.participantCount} participants, ${b.bookingType}, status=${b.status}`)
  );

  // Get master time slots for peak hours
  const timeSlotsMaster = await db.select().from(timeSlots).where(eq(timeSlots.isActive, true));

  // Generate hourly slots from 6 AM to 10 PM
  const slots = [];
  for (let hour = 6; hour < 22; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

    const masterSlot = timeSlotsMaster.find(ts => ts.startTime === startTime);

    let isAvailable = true;
    let bookedCount = 0;
    let availableCapacity = maxCapacity;

    const slotStartMinutes = hour * 60;
    const slotEndMinutes = (hour + 1) * 60;

    for (const booking of existingBookings) {
      const [bStartH, bStartM] = booking.startTime.split(':').map(Number);
      const [bEndH, bEndM] = booking.endTime.split(':').map(Number);
      const bookingStartMinutes = bStartH * 60 + bStartM;
      const bookingEndMinutes = bEndH * 60 + bEndM;

      const isFullGround = booking.bookingType === 'full-ground';
      const isPerPersonConflict = booking.bookingType === 'per-person' && !supportsPerPerson;

      // Check for overlap
      if (bookingStartMinutes < slotEndMinutes && bookingEndMinutes > slotStartMinutes) {
        console.log(`Overlap detected: booking ${booking.startTime}-${booking.endTime} overlaps with slot ${startTime}-${endTime}`);

        if (isFullGround || isPerPersonConflict) {
          isAvailable = false;
          availableCapacity = 0;
          bookedCount = maxCapacity;
          break;
        } else if (booking.bookingType === 'per-person' && supportsPerPerson) {
          bookedCount += booking.participantCount || 1;
        }
      }
    }

    // Update availability for per-person slots
    if (supportsPerPerson) {
      availableCapacity = Math.max(0, maxCapacity - bookedCount);
      isAvailable = availableCapacity > 0;
    }

    console.log(`Slot ${startTime}-${endTime}: bookedCount=${bookedCount}, availableCapacity=${availableCapacity}, isAvailable=${isAvailable}`);

    slots.push({
      id: `${facilityId}-${targetDate}-${hour}`,
      facilityId,
      groundId: ground.id,
      date: targetDate,
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      duration: 60,
      isAvailable,
      availableCapacity,
      maxCapacity,
      bookedCount,
      supportsPerPerson,
      peakHour: masterSlot?.isPeakHour || false,
      price: "100"
    });
  }

  return slots;
}



  // Booking operations
  async getBookings(userId?: string, options?: { page?: number; limit?: number; status?: string }): Promise<Booking[]> {
    let query = db.select().from(bookings);
    
    const conditions = [];
    if (userId) {
      conditions.push(eq(bookings.userId, userId));
    }
    
    if (options?.status) {
      conditions.push(eq(bookings.status, options.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(bookings.createdAt));
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingDetails(id: number): Promise<any> {
    const [booking] = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      sportId: bookings.sportId,
      groundId: bookings.groundId,
      bookingType: bookings.bookingType,
      planType: bookings.planType,
      participantCount: bookings.participantCount,
      totalAmount: bookings.totalAmount,
      paidAmount: bookings.paidAmount,
      discountAmount: bookings.discountAmount,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      notes: bookings.notes,
      duration: bookings.duration,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      isRecurring: bookings.isRecurring,
      recurringEndDate: bookings.recurringEndDate,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      // Ground and sport details from master tables
      facilityName: grounds.groundName,
      facilityType: sports.sportName,
      // User details
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone
    })
    .from(bookings)
    .leftJoin(grounds, eq(bookings.groundId, grounds.id))
    .leftJoin(sports, eq(bookings.sportId, sports.id))
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.id, id));
    
    if (booking) {
      // Get booking slots  
      const slots = await db.select().from(bookingSlots)
        .where(eq(bookingSlots.bookingId, id))
        .orderBy(asc(bookingSlots.bookingDate), asc(bookingSlots.startTime));
      
      return { ...booking, slots, participants: booking.participantCount };
    }
    
    return booking;
  }

  async getPendingPayments(userId: string): Promise<any[]> {
    const pendingBookingsData = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      sportId: bookings.sportId,
      groundId: bookings.groundId,
      bookingType: bookings.bookingType,
      planType: bookings.planType,
      participantCount: bookings.participantCount,
      totalAmount: bookings.totalAmount,
      paidAmount: bookings.paidAmount,
      discountAmount: bookings.discountAmount,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      duration: bookings.duration,
      createdAt: bookings.createdAt,
      
      facilityName: grounds.groundName,
      facilityType: sports.sportName,
      // User details
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone
    })
    .from(bookings)
    .leftJoin(grounds, eq(bookings.groundId, grounds.id))
    .leftJoin(sports, eq(bookings.sportId, sports.id))
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(and(
      eq(bookings.userId, userId),
      or(
        eq(bookings.paymentStatus, 'pending'),
        eq(bookings.paymentStatus, 'partial')
      )
    ))
    .orderBy(desc(bookings.createdAt));

    // Get slot details for each booking and format data for frontend
    const formattedBookings = [];
    
    for (const booking of pendingBookingsData) {
      // Get the first slot for display (for date/time info)
      const slots = await db.select({
        bookingDate: bookingSlots.bookingDate,
        startTime: bookingSlots.startTime,
        endTime: bookingSlots.endTime,
        duration: bookingSlots.duration
      })
      .from(bookingSlots)
      .where(eq(bookingSlots.bookingId, booking.id))
      .orderBy(bookingSlots.bookingDate, bookingSlots.startTime)
      .limit(1);

      const firstSlot = slots[0];
      const balanceDue = Number(booking.totalAmount) - Number(booking.paidAmount) - Number(booking.discountAmount);
      
      formattedBookings.push({
        ...booking,
        balanceDue,
        participants: booking.participantCount,
        // Add slot information for display
        bookingDate: firstSlot?.bookingDate || booking.startDate,
        startTime: firstSlot?.startTime || '00:00',
        endTime: firstSlot?.endTime || '00:00',
        duration: firstSlot?.duration || booking.duration || 0,
        user: {
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          phone: booking.phone
        }
      });
    }
    
    return formattedBookings;
  }

  async getAllUserPayments(userId: string): Promise<any[]> {
    const allBookingsData = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      sportId: bookings.sportId,
      groundId: bookings.groundId,
      bookingType: bookings.bookingType,
      planType: bookings.planType,
      participantCount: bookings.participantCount,
      totalAmount: bookings.totalAmount,
      paidAmount: bookings.paidAmount,
      discountAmount: bookings.discountAmount,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      duration: bookings.duration,
      createdAt: bookings.createdAt,
      // Ground and sport details from master tables
      facilityName: grounds.groundName,
      facilityType: sports.sportName,
      // User details
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone
    })
    .from(bookings)
    .leftJoin(grounds, eq(bookings.groundId, grounds.id))
    .leftJoin(sports, eq(bookings.sportId, sports.id))
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));

    // Get slot details for each booking and format data for frontend
    const formattedBookings = [];
    
    for (const booking of allBookingsData) {
      // Get the first slot for display (for date/time info)
      const slots = await db.select({
        bookingDate: bookingSlots.bookingDate,
        startTime: bookingSlots.startTime,
        endTime: bookingSlots.endTime,
        duration: bookingSlots.duration
      })
      .from(bookingSlots)
      .where(eq(bookingSlots.bookingId, booking.id))
      .orderBy(bookingSlots.bookingDate, bookingSlots.startTime)
      .limit(1);

      const firstSlot = slots[0];
      const balanceDue = Number(booking.totalAmount) - Number(booking.paidAmount) - Number(booking.discountAmount);
      
      formattedBookings.push({
        ...booking,
        balanceDue,
        participants: booking.participantCount,
        // Add slot information for display
        bookingDate: firstSlot?.bookingDate || booking.startDate,
        startTime: firstSlot?.startTime || '00:00',
        endTime: firstSlot?.endTime || '00:00',
        duration: firstSlot?.duration || booking.duration || 0,
        user: {
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          phone: booking.phone
        }
      });
    }
    
    return formattedBookings;
  }

  async getUserBookings(userId: string): Promise<any[]> {
    // Get bookings with joined data from sports, grounds, and slots
    const result = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      sportId: bookings.sportId,
      groundId: bookings.groundId,
      bookingType: bookings.bookingType,
      planType: bookings.planType,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      duration: bookings.duration,
      participantCount: bookings.participantCount,
      totalAmount: bookings.totalAmount,
      paidAmount: bookings.paidAmount,
      discountAmount: bookings.discountAmount,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      notes: bookings.notes,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      // Joined data
      sportName: sports.sportName,
      facilityName: grounds.groundName,
      groundName: grounds.groundName,
      // Get first slot data for display
      bookingDate: sql<string>`(
        SELECT booking_date::text 
        FROM booking_slots 
        WHERE booking_id = ${bookings.id} 
        ORDER BY booking_date ASC, start_time ASC 
        LIMIT 1
      )`,
      startTime: sql<string>`(
        SELECT start_time::text 
        FROM booking_slots 
        WHERE booking_id = ${bookings.id} 
        ORDER BY booking_date ASC, start_time ASC 
        LIMIT 1
      )`,
      endTime: sql<string>`(
        SELECT end_time::text 
        FROM booking_slots 
        WHERE booking_id = ${bookings.id} 
        ORDER BY booking_date ASC, start_time ASC 
        LIMIT 1
      )`,
    })
    .from(bookings)
    .innerJoin(sports, eq(bookings.sportId, sports.id))
    .innerJoin(grounds, eq(bookings.groundId, grounds.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));

    return result;
  }

  async getGroundById(id: number): Promise<Ground | undefined> {
    const [ground] = await db.select().from(grounds).where(eq(grounds.id, id));
    return ground;
  }

  async getBookingsForSlot(groundId: number, bookingDate: string, startTime: string): Promise<Booking[]> {
    // For hourly slots, check booking_slots table instead
    const bookingIds = await db.select({
      bookingId: bookingSlots.bookingId
    }).from(bookingSlots)
      .where(and(
        eq(bookingSlots.bookingDate, bookingDate),
        eq(bookingSlots.startTime, startTime)
      ));
    
    if (bookingIds.length === 0) return [];
    
    return await db.select().from(bookings)
      .where(and(
        eq(bookings.groundId, groundId),
        inArray(bookings.id, bookingIds.map(b => b.bookingId)),
        ne(bookings.status, 'cancelled'),
        ne(bookings.status, 'failed')
      ));
  }

  async checkDuplicateBooking(userId: string, groundId: number, bookingDate: string, startTime: string): Promise<Booking[]> {
    console.log(`=== CHECKING DUPLICATE BOOKING ===`);
    console.log(`User: ${userId}, Ground: ${groundId}, Date: ${bookingDate}, Time: ${startTime}`);
    
    // Check for duplicates in booking_slots table with detailed logging
    const bookingIds = await db.select({
      bookingId: bookingSlots.bookingId,
      bookingStatus: bookings.status,
      slotDate: bookingSlots.bookingDate,
      slotTime: bookingSlots.startTime
    }).from(bookingSlots)
      .innerJoin(bookings, eq(bookingSlots.bookingId, bookings.id))
      .where(and(
        eq(bookings.userId, userId),
        eq(bookings.groundId, groundId),
        eq(bookingSlots.bookingDate, bookingDate),
        eq(bookingSlots.startTime, startTime),
        ne(bookings.status, 'cancelled'),
        ne(bookings.status, 'failed')
      ));
    
    console.log(`Found ${bookingIds.length} potential duplicate bookings:`, bookingIds);
    
    if (bookingIds.length === 0) return [];
    
    const duplicateBookings = await db.select().from(bookings)
      .where(inArray(bookings.id, bookingIds.map(b => b.bookingId)));
    
    console.log(`Returning ${duplicateBookings.length} actual duplicate bookings`);
    return duplicateBookings;
  }



  async createBooking(booking: InsertBooking, slots: InsertBookingSlot[]): Promise<{ booking: Booking; slots: BookingSlot[] }> {
    const result = await db.transaction(async (tx) => {
      // Get ground details to determine sportId if not provided
      const ground = await tx.select().from(grounds).where(eq(grounds.id, booking.groundId)).limit(1);
      if (!ground.length) {
        throw new Error(`Ground with ID ${booking.groundId} not found`);
      }
      
      // Set sportId from ground if not provided
      const bookingWithSportId = {
        ...booking,
        sportId: booking.sportId || ground[0].sportId
      };
      
      // Get sport details to determine booking type
      const sportResult = await tx.select().from(sports).where(eq(sports.id, ground[0].sportId)).limit(1);
      const sport = sportResult[0];
      const supportsPerPerson = sport?.bookingType === 'per-person' || sport?.bookingType === 'both';
      const maxCapacity = ground[0].maxCapacity || 0;
      
      for (const slot of slots) {
        // Get existing bookings from booking_slots table (primary source of truth for capacity)
        const existingSlotBookings = await tx.select({
          participantCount: bookingSlots.participantCount,
          bookingType: bookings.bookingType,
          bookingId: bookings.id
        }).from(bookingSlots)
          .innerJoin(bookings, eq(bookingSlots.bookingId, bookings.id))
          .where(and(
            eq(bookings.groundId, booking.groundId),
            eq(bookingSlots.bookingDate, slot.bookingDate),
            eq(bookingSlots.startTime, slot.startTime),
            ne(bookings.status, 'cancelled')
          ));

        // Use only slot bookings to avoid double-counting
        const allExistingBookings = existingSlotBookings;

        if (booking.bookingType === 'full-ground') {
          // Full-ground booking: check if slot is already booked
          if (allExistingBookings.length > 0) {
            throw new Error(`Time slot ${slot.startTime} is already booked and unavailable for full-ground booking`);
          }
        } else if (booking.bookingType === 'per-person') {
          if (!supportsPerPerson) {
            // Ground doesn't support per-person, check if any booking exists
            if (allExistingBookings.length > 0) {
              throw new Error(`Time slot ${slot.startTime} is already booked and this ground only supports full-ground bookings`);
            }
          } else {
            // Per-person ground: check capacity
            let usedCapacity = 0;
            for (const existing of allExistingBookings) {
              if (existing.bookingType === 'full-ground') {
                throw new Error(`Time slot ${slot.startTime} is fully booked for full-ground`);
              }
              usedCapacity += existing.participantCount || 1;
            }
            
            const requestedCapacity = booking.participantCount || 1;
            const availableCapacity = Math.max(0, maxCapacity - usedCapacity);
            
            console.log(`Capacity check for ${slot.startTime}: used=${usedCapacity}, max=${maxCapacity}, available=${availableCapacity}, requested=${requestedCapacity}`);
            
            if (requestedCapacity > availableCapacity) {
              throw new Error(`Not enough capacity for ${slot.startTime}. Available: ${availableCapacity}, Requested: ${requestedCapacity}. Try booking fewer participants or choose a different time slot.`);
            }
          }
        }
      }
      
      // Create the main booking record
      const [newBooking] = await tx.insert(bookings).values(bookingWithSportId).returning();
      
      console.log(`=== CREATING BOOKING SLOTS ===`);
      console.log(`Created booking ID: ${newBooking.id}`);
      console.log(`Received ${slots.length} slots to create`);
      
      // Create booking slots with participant count
      const slotsWithBookingId = slots.map((slot, index) => ({
        ...slot,
        bookingId: newBooking.id,
        participantCount: booking.participantCount // Store participant count in each slot
      }));
      
      console.log(`Prepared ${slotsWithBookingId.length} slots with booking ID`);
      console.log(`First slot: ${JSON.stringify(slotsWithBookingId[0])}`);
      console.log(`Last slot: ${JSON.stringify(slotsWithBookingId[slotsWithBookingId.length - 1])}`);
      
      const newSlots = await tx.insert(bookingSlots).values(slotsWithBookingId).returning();
      
      console.log(`Successfully created ${newSlots.length} booking slots`);
      
      return { booking: newBooking, slots: newSlots };
    });
    
    return result;
  }

  async updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async cancelBooking(id: number): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    
    return booking;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    
    // CRITICAL: Sync booking payment data when new payment is created
    if (newPayment && newPayment.bookingId) {
      await this.syncBookingPaymentData(newPayment.bookingId);
    }
    
    return newPayment;
  }

  async getPayments(bookingId?: number): Promise<Payment[]> {
    if (bookingId) {
      return await db.select().from(payments)
        .where(eq(payments.bookingId, bookingId))
        .orderBy(desc(payments.createdAt));
    }
    
    return await db.select().from(payments)
      .orderBy(desc(payments.createdAt));
  }

  async getAllPendingPayments(): Promise<any[]> {
    const results = await db.select({
      id: payments.id,
      userId: payments.userId,
      bookingId: payments.bookingId,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      status: payments.status,
      createdAt: payments.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email
    })
    .from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .where(inArray(payments.status, ['pending', 'partial']))
    .orderBy(desc(payments.createdAt));

    return results;
  }

  async getAllPayments(): Promise<any[]> {
    const result = await db.select({
      id: payments.id,
      bookingId: payments.bookingId,
      userId: payments.userId,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      transactionId: payments.transactionId,
      status: payments.status,
      discountAmount: payments.discountAmount,
      discountReason: payments.discountReason,
      processedAt: payments.processedAt,
      createdAt: payments.createdAt,
      userName: users.firstName,
      userEmail: users.email,
      startDate: bookings.startDate,
      endDate: bookings.endDate
    })
    .from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .leftJoin(bookings, eq(payments.bookingId, bookings.id))
    .orderBy(desc(payments.createdAt));

    return result;
  }

  // Get all pending bookings (awaiting approval OR have outstanding payments)
  async getAllPendingBookings(): Promise<any[]> {
    const result = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      groundId: bookings.groundId,
      bookingType: bookings.bookingType,
      planType: bookings.planType,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      participantCount: bookings.participantCount,
      totalAmount: bookings.totalAmount,
      paidAmount: bookings.paidAmount,
      discountAmount: bookings.discountAmount,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      createdAt: bookings.createdAt,
      userName: users.firstName,
      userEmail: users.email,
      userPhone: users.phone,
      groundName: grounds.groundName,
      sportName: sports.sportName
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(grounds, eq(bookings.groundId, grounds.id))
    .leftJoin(sports, eq(grounds.sportId, sports.id))
    .where(
      // Only confirmed bookings with outstanding payments (no approval delays)
      and(
        eq(bookings.status, 'confirmed'),
        inArray(bookings.paymentStatus, ['pending', 'partial'])
      )
    )
    .orderBy(desc(bookings.createdAt));

    // Format data for frontend with facility name and balance calculations
    return result.map(booking => {
      const pendingAmount = Number(booking.totalAmount) - Number(booking.paidAmount) - Number(booking.discountAmount);
      return {
        ...booking,  
        facilityName: `${booking.sportName} - ${booking.groundName}`,
        pendingAmount, // Use pendingAmount to match frontend interface
        balanceDue: pendingAmount, // Keep balanceDue for backward compatibility
        participants: booking.participantCount,
        // Get first booking slot for date/time display
        bookingDate: booking.startDate, // Use startDate as primary booking date
        startTime: '06:00:00', // Default time - will be overridden by actual slot data
        endTime: '07:00:00', // Default time - will be overridden by actual slot data
        user: {
          firstName: booking.userName,
          lastName: '', // Only first name available from this query
          email: booking.userEmail,
          phone: booking.userPhone
        }
      };
    });
  }

  // Get pending payments only (confirmed bookings with outstanding payments)
  async getUserPendingPayments(userId?: string): Promise<any[]> {
    let query = db.select({
      id: bookings.id,
      userId: bookings.userId,
      groundId: bookings.groundId,
      sportId: bookings.sportId,
      bookingType: bookings.bookingType,
      planType: bookings.planType,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      participantCount: bookings.participantCount,
      totalAmount: bookings.totalAmount,
      paidAmount: bookings.paidAmount,
      discountAmount: bookings.discountAmount,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      createdAt: bookings.createdAt,
      userName: users.firstName,
      userEmail: users.email,
      userPhone: users.phone,
      groundName: grounds.groundName,
      sportName: sports.sportName
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(grounds, eq(bookings.groundId, grounds.id))
    .leftJoin(sports, eq(bookings.sportId, sports.id))
    .where(and(
      // Only confirmed bookings with payment issues
      eq(bookings.status, 'confirmed'),
      inArray(bookings.paymentStatus, ['pending', 'partial']),
      userId ? eq(bookings.userId, userId) : undefined
    ));

    const result = await query.orderBy(desc(bookings.createdAt));
    
    // Format data for frontend
    return result.map(booking => {
      const balanceDue = Number(booking.totalAmount) - Number(booking.paidAmount) - Number(booking.discountAmount);
      return {
        ...booking,  
        facilityName: `${booking.sportName} - ${booking.groundName}`,
        balanceDue,
        participants: booking.participantCount,
        user: {
          firstName: booking.userName,
          lastName: '', 
          email: booking.userEmail,
          phone: booking.userPhone
        }
      };
    });
  }

  async updatePaymentStatus(paymentId: number, status: string, notes?: string): Promise<Payment> {
    const updateData: any = { status };
    if (notes) {
      updateData.paymentGatewayResponse = { notes };
    }
    
    const [updatedPayment] = await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, paymentId))
      .returning();
    
    // CRITICAL: Sync booking payment data when payment status changes
    if (updatedPayment && updatedPayment.bookingId) {
      await this.syncBookingPaymentData(updatedPayment.bookingId);
    }
      
    return updatedPayment;
  }

  // Helper function to sync booking payment data with actual payments
  async syncBookingPaymentData(bookingId: number): Promise<void> {
    try {
      // Get booking details
      const booking = await this.getBookingDetails(bookingId);
      if (!booking) return;

      // Get all completed payments for this booking
      const allPayments = await this.getPayments(bookingId);
      const totalPaid = allPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      const totalAmount = Number(booking.totalAmount);
      
      // Determine payment status
      let paymentStatus;
      let bookingStatus = booking.status;
      
      if (totalPaid >= totalAmount) {
        paymentStatus = 'completed';
        bookingStatus = 'confirmed';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
        // Keep existing booking status for partial payments unless it's pending
        if (booking.status === 'pending') {
          bookingStatus = 'confirmed';
        }
      } else {
        paymentStatus = 'pending';
        // Set to pending only if no payments exist
        bookingStatus = 'pending';
      }
      
      // Update booking with correct amounts and status
      await this.updateBookingPayment(bookingId, {
        paidAmount: totalPaid.toString(),
        paymentStatus: paymentStatus,
        status: bookingStatus
      });
    } catch (error) {
      console.error(`Error syncing booking payment data for booking ${bookingId}:`, error);
      // Don't throw error - this is a sync operation that shouldn't break the main flow
    }
  }

  async updateBookingPaymentStatus(bookingId: number, status: string, transactionId?: string): Promise<void> {
    // CRITICAL FIX: Always sync payment data based on actual payment records
    // instead of blindly setting payment status
    console.log(`WARNING: updateBookingPaymentStatus called for booking ${bookingId} with status ${status}`);
    console.log('Using syncBookingPaymentData instead to maintain data integrity');
    
    // Use the safer sync method that calculates status from actual payments
    await this.syncBookingPaymentData(bookingId);
    
    // If transactionId is provided, we can update that separately
    if (transactionId) {
      await db.update(bookings)
        .set({ paymentMethod: transactionId }) // Store transaction ID as payment method reference
        .where(eq(bookings.id, bookingId));
      console.log(`Updated booking ${bookingId} with transaction reference: ${transactionId}`);
    }
  }

  // Coupon operations
  async getCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getCoupon(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
    return coupon;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [newCoupon] = await db.insert(coupons).values(coupon).returning();
    return newCoupon;
  }

  // Update past confirmed bookings to completed status with payment validation
  async updatePastBookingsToCompleted(): Promise<{ updated: number; skipped: number; issues: string[] }> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Find all confirmed bookings that are in the past with payment details
      const pastConfirmedBookings = await db
        .select({
          bookingId: bookings.id,
          bookingDate: bookingSlots.bookingDate,
          totalAmount: bookings.totalAmount,
          paidAmount: bookings.paidAmount,
          paymentStatus: bookings.paymentStatus,
          userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          userEmail: users.email
        })
        .from(bookings)
        .innerJoin(bookingSlots, eq(bookings.id, bookingSlots.bookingId))
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(and(
          eq(bookings.status, 'confirmed'),
          lt(bookingSlots.bookingDate, today)
        ));

      if (pastConfirmedBookings.length === 0) {
        return { updated: 0, skipped: 0, issues: [] };
      }

      // Get unique booking IDs and validate payments
      const uniqueBookings = Array.from(
        new Map(pastConfirmedBookings.map(b => [b.bookingId, b])).values()
      );

      const safeToComplete: number[] = [];
      const paymentIssues: string[] = [];
      let skippedCount = 0;

      for (const booking of uniqueBookings) {
        const totalAmount = Number(booking.totalAmount);
        const paidAmount = Number(booking.paidAmount);
        const paymentGap = totalAmount - paidAmount;

        if (paymentGap > 0) {
          // Has outstanding payment - skip this booking
          skippedCount++;
          paymentIssues.push(
            `Booking ID ${booking.bookingId} (${booking.userName}): ₹${paymentGap} outstanding (₹${paidAmount}/₹${totalAmount} paid)`
          );
          console.warn(`Skipping booking ${booking.bookingId} - Outstanding payment: ₹${paymentGap}`);
        } else {
          // Fully paid - safe to complete
          safeToComplete.push(booking.bookingId);
        }
      }

      let updatedCount = 0;
      if (safeToComplete.length > 0) {
        // Update only fully paid bookings to completed
        await db
          .update(bookings)
          .set({ 
            status: 'completed',
            updatedAt: new Date()
          })
          .where(inArray(bookings.id, safeToComplete));

        updatedCount = safeToComplete.length;
        console.log(`Updated ${updatedCount} fully paid past bookings to completed status`);
      }

      if (skippedCount > 0) {
        console.log(`Skipped ${skippedCount} bookings with outstanding payments`);
      }

      return {
        updated: updatedCount,
        skipped: skippedCount,
        issues: paymentIssues
      };
    } catch (error) {
      console.error('Error updating past bookings to completed:', error);
      return { updated: 0, skipped: 0, issues: [`Database error: ${(error as any).message}`] };
    }
  }

  // Get all upcoming bookings for admin dashboard (all users)
  async getAllUpcomingBookings(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get upcoming bookings from booking_slots table (more accurate)
    const upcomingBookings = await db
      .select({
        id: bookings.id,
        bookingDate: bookingSlots.bookingDate,
        startTime: bookingSlots.startTime,
        endTime: bookingSlots.endTime,
        status: bookings.status,
        totalAmount: bookings.totalAmount,
        paidAmount: bookings.paidAmount,
        paymentStatus: bookings.paymentStatus,
        participantCount: bookings.participantCount,
        // User information
        userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        userEmail: users.email,
        userPhone: users.phone,
        // Facility information
        facilityName: sql<string>`CONCAT(${sports.sportName}, ' - ', ${grounds.groundName})`,
        sportName: sports.sportName,
        groundName: grounds.groundName,
        createdAt: bookings.createdAt
      })
      .from(bookings)
      .innerJoin(bookingSlots, eq(bookings.id, bookingSlots.bookingId))
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(grounds, eq(bookings.groundId, grounds.id))
      .innerJoin(sports, eq(bookings.sportId, sports.id))
      .where(and(
        gte(bookingSlots.bookingDate, today),
        inArray(bookings.status, ['confirmed', 'pending'])
      ))
      .orderBy(asc(bookingSlots.bookingDate), asc(bookingSlots.startTime))
      .limit(20); // Limit to 20 upcoming bookings for dashboard

    return upcomingBookings;
  }

  // Admin operations
  async getDashboardStats(): Promise<any> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentTime = today.toTimeString().split(' ')[0]; // HH:MM:SS format
    
    const [
      todayBookingsResult,
      totalBookingsResult,
      todayRevenueResult,
      totalRevenueResult,
      activeUsersResult,
      activeGroundsResult,
      confirmedBookingsResult,
      pendingBookingsResult,
      cancelledBookingsResult,
      completedBookingsResult,
      liveSessionsResult
    ] = await Promise.all([
      db.select({ count: count() })
        .from(bookingSlots)
        .where(eq(bookingSlots.bookingDate, todayStr)),
      db.select({ count: count() }).from(bookings),
      db.select({ sum: sum(payments.amount) })
        .from(payments)
        .where(and(
          eq(payments.status, 'completed'),
          eq(sql`DATE(${payments.createdAt})`, todayStr)
        )),
      db.select({ sum: sum(payments.amount) })
        .from(payments)
        .where(eq(payments.status, 'completed')),
      db.select({ count: count() })
        .from(users)
        .where(eq(users.isActive, true)),
      db.select({ count: count() })
        .from(grounds)
        .where(eq(grounds.isActive, true)),
      db.select({ count: count() })
        .from(bookings)
        .where(eq(bookings.status, 'confirmed')),
      db.select({ count: count() })
        .from(bookings)
        .where(eq(bookings.status, 'pending')),
      db.select({ count: count() })
        .from(bookings)
        .where(eq(bookings.status, 'cancelled')),
      db.select({ count: count() })
        .from(bookings)
        .where(eq(bookings.status, 'completed')),
      // Live sessions: confirmed bookings happening right now
      db.select({ count: count() })
        .from(bookingSlots)
        .innerJoin(bookings, eq(bookingSlots.bookingId, bookings.id))
        .where(and(
          eq(bookingSlots.bookingDate, todayStr),
          eq(bookings.status, 'confirmed'),
          lte(bookingSlots.startTime, currentTime),
          gte(bookingSlots.endTime, currentTime)
        ))
    ]);

    return {
      todayBookings: todayBookingsResult[0]?.count || 0,
      totalBookings: totalBookingsResult[0]?.count || 0,
      todayRevenue: Number(todayRevenueResult[0]?.sum || 0),
      totalRevenue: Number(totalRevenueResult[0]?.sum || 0),
      activeUsers: activeUsersResult[0]?.count || 0,
      activeGrounds: activeGroundsResult[0]?.count || 0,
      confirmed: confirmedBookingsResult[0]?.count || 0,
      pending: pendingBookingsResult[0]?.count || 0,
      cancelled: cancelledBookingsResult[0]?.count || 0,
      completed: completedBookingsResult[0]?.count || 0,
      liveSessions: liveSessionsResult[0]?.count || 0
    };
  }

  async getAdminBookings(options?: { page?: number; limit?: number; status?: string; search?: string; sortBy?: string }): Promise<{ bookings: any[]; total: number }> {
    const { page = 1, limit = 10, status, search, sortBy = 'date_desc' } = options || {};
    const offset = (page - 1) * limit;

    console.log(`getAdminBookings called with options:`, { page, limit, status, search, sortBy });

    // Enhanced query with user and facility data joined
    let query = db.select({
      id: bookings.id,
      userId: bookings.userId,
      sportId: bookings.sportId,
      groundId: bookings.groundId,
      bookingType: bookings.bookingType,
      planType: bookings.planType,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      duration: bookings.duration,
      participantCount: bookings.participantCount,
      totalAmount: bookings.totalAmount,
      paidAmount: bookings.paidAmount,
      discountAmount: bookings.discountAmount,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      isRecurring: bookings.isRecurring,
      recurringEndDate: bookings.recurringEndDate,
      notes: bookings.notes,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      // User information mapped to expected field names
      firstName: users.firstName,
      lastName: users.lastName,
      userName: sql<string>`CONCAT(COALESCE(${users.firstName}, ''), ' ', COALESCE(${users.lastName}, ''))`,
      userEmail: users.email,
      userPhone: users.phone,
      // Facility information from joined tables
      sportName: sports.sportName,
      groundName: grounds.groundName,
      facilityName: grounds.groundName, // Map groundName to facilityName for frontend
      facilityId: grounds.id,
      capacity: grounds.maxCapacity,
      // Get first slot data for date/time display
      bookingDate: sql<string>`(
        SELECT booking_date::text 
        FROM booking_slots 
        WHERE booking_id = ${bookings.id} 
        ORDER BY booking_date ASC, start_time ASC 
        LIMIT 1
      )`,
      startTime: sql<string>`(
        SELECT start_time::text 
        FROM booking_slots 
        WHERE booking_id = ${bookings.id} 
        ORDER BY booking_date ASC, start_time ASC 
        LIMIT 1
      )`,
      endTime: sql<string>`(
        SELECT end_time::text 
        FROM booking_slots 
        WHERE booking_id = ${bookings.id} 
        ORDER BY booking_date ASC, start_time ASC 
        LIMIT 1
      )`,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(grounds, eq(bookings.groundId, grounds.id))
    .leftJoin(sports, eq(bookings.sportId, sports.id));

    let countQuery = db.select({ count: count() }).from(bookings);

    // Apply filters
    if (status && status !== 'all') {
      console.log(`Filtering by status: '${status}'`);
      query = query.where(eq(bookings.status, status));
      countQuery = countQuery.where(eq(bookings.status, status));
    } else {
      console.log('No status filter applied or status is "all"');
    }

    if (search) {
      console.log(`Applying search filter: '${search}'`);
      const searchCondition = or(
        like(users.email, `%${search}%`),
        like(sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`, `%${search}%`),
        like(sql<string>`CONCAT('BK', LPAD(CAST(${bookings.id} AS TEXT), 4, '0'))`, `%${search}%`)
      );
      query = query.where(searchCondition);
      countQuery = countQuery.leftJoin(users, eq(bookings.userId, users.id)).where(searchCondition);
    }

    // Apply sorting
    let orderByClause;
    switch (sortBy) {
      case 'date_asc':
        orderByClause = asc(bookings.startDate);
        break;
      case 'customer_asc':
        orderByClause = asc(sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`);
        break;
      case 'customer_desc':
        orderByClause = desc(sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`);
        break;
      case 'sport_asc':
        orderByClause = asc(sports.sportName);
        break;
      case 'sport_desc':
        orderByClause = desc(sports.sportName);
        break;
      case 'ground_asc':
        orderByClause = asc(grounds.groundName);
        break;
      case 'ground_desc':
        orderByClause = desc(grounds.groundName);
        break;
      case 'amount_asc':
        orderByClause = asc(bookings.totalAmount);
        break;
      case 'amount_desc':
        orderByClause = desc(bookings.totalAmount);
        break;
      case 'date_desc':
      default:
        orderByClause = desc(bookings.startDate);
        break;
    }

    const [bookingsResult, [{ count: total }]] = await Promise.all([
      query.limit(limit).offset(offset).orderBy(orderByClause),
      countQuery
    ]);

    console.log(`Query returned ${bookingsResult.length} bookings, total: ${total}`);
    if (bookingsResult.length > 0) {
      console.log('Sample booking with user/facility data:', {
        id: bookingsResult[0].id,
        status: bookingsResult[0].status,
        userName: bookingsResult[0].userName,
        facilityName: bookingsResult[0].facilityName
      });
    }

    return { bookings: bookingsResult, total };
  }

  async getBookingSlots(bookingId: number): Promise<BookingSlot[]> {
    return await db.select().from(bookingSlots)
      .where(eq(bookingSlots.bookingId, bookingId))
      .orderBy(asc(bookingSlots.bookingDate), asc(bookingSlots.startTime));
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    const [updatedBooking] = await db.update(bookings)
      .set({ status: status })
      .where(eq(bookings.id, id))
      .returning();
      
    return updatedBooking;
  }

  // Get expired pending bookings for auto-cancellation
  async getExpiredPendingBookings(currentDate: Date): Promise<Booking[]> {
    try {
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const expiredBookings = await db
        .select()
        .from(bookings)
        .where(and(
          eq(bookings.status, 'pending'),
          lt(bookingSlots.bookingDate, dateString)
        ));
      
      return expiredBookings;
    } catch (error) {
      console.error('Error fetching expired pending bookings:', error);
      return [];
    }
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    let query = db.select().from(notifications)
      .where(eq(notifications.userId, userId));
    
    if (unreadOnly) {
      query = db.select().from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
    }
    
    return await query.orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  // Additional methods for receipt generation
  async getPaymentById(paymentId: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
    return payment;
  }

  async getUserById(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  // Get bookings that need reminders (1 day before)
  async getBookingsNeedingReminders(): Promise<any[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    const bookingsNeedingReminders = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,

        facilityName: grounds.groundName,
        sportName: sports.sportName,
        userEmail: users.email,
        userName: sql`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
        totalAmount: bookings.totalAmount,
        participantCount: bookings.participantCount
      })
      .from(bookings)
      .innerJoin(grounds, eq(bookings.groundId, grounds.id))
      .innerJoin(sports, eq(bookings.sportId, sports.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.status, 'confirmed'));
    
    return bookingsNeedingReminders;
  }

  // Check if reminder already sent for a booking
  async hasReminderBeenSent(bookingId: number): Promise<boolean> {
    const existing = await db.select().from(notifications)
      .where(and(
        eq(notifications.relatedBookingId, bookingId),
        eq(notifications.type, 'booking_reminder')
      ))
      .limit(1);
    
    return existing.length > 0;
  }

  // Get user's upcoming bookings for cancellation/rescheduling
  async getUserUpcomingBookings(userId: string): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    
    // First, try to get bookings with slots data (newer approach)
    const bookingsWithSlots = await db
      .select({
        id: bookings.id,
        bookingDate: bookingSlots.bookingDate,
        startTime: bookingSlots.startTime,
        endTime: bookingSlots.endTime,
        status: bookings.status,
        totalAmount: bookings.totalAmount,
        paidAmount: bookings.paidAmount,
        paymentStatus: bookings.paymentStatus,
        facilityName: grounds.groundName,
        sportName: sports.sportName,
        participantCount: bookings.participantCount,
        createdAt: bookings.createdAt
      })
      .from(bookings)
      .innerJoin(bookingSlots, eq(bookings.id, bookingSlots.bookingId))
      .innerJoin(grounds, eq(bookings.groundId, grounds.id))
      .innerJoin(sports, eq(bookings.sportId, sports.id))
      .where(and(
        eq(bookings.userId, userId),
        gte(bookingSlots.bookingDate, today),
        inArray(bookings.status, ['confirmed', 'pending'])
      ))
      .orderBy(asc(bookingSlots.bookingDate), asc(bookingSlots.startTime));

    // No fallback needed - all bookings should have slots

    return bookingsWithSlots;
  }

  async updateBookingPayment(bookingId: number, paymentData: { paidAmount: string; paymentStatus: string; status: string }): Promise<Booking> {
    // SAFETY CHECK: Log all payment status updates for auditing
    console.log(`Updating booking ${bookingId} payment:`, {
      paidAmount: paymentData.paidAmount,
      paymentStatus: paymentData.paymentStatus,
      status: paymentData.status
    });
    
    // Validate that payment status aligns with actual payment records
    if (paymentData.paymentStatus === 'completed' || paymentData.paymentStatus === 'confirmed') {
      const actualPayments = await this.getPayments(bookingId);
      const actualPaidAmount = actualPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      if (actualPaidAmount === 0) {
        console.warn(`WARNING: Attempting to set payment status to ${paymentData.paymentStatus} for booking ${bookingId} but no completed payments exist!`);
        console.warn('This could create data integrity issues. Using actual payment data instead.');
        
        // Override with correct data based on actual payments
        paymentData.paidAmount = "0";
        paymentData.paymentStatus = "pending";
      }
    }
    
    const [updatedBooking] = await db.update(bookings)
      .set({
        paidAmount: paymentData.paidAmount,
        paymentStatus: paymentData.paymentStatus,
        status: paymentData.status,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId))
      .returning();
      
    return updatedBooking;
  }

  // Reports operations
  async getRevenueReport(period: 'day' | 'week' | 'month', startDate?: string, endDate?: string): Promise<any[]> {
    let dateFormat;
    let dateGrouping;
    
    switch (period) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        dateGrouping = 'DATE(p.created_at)';
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        dateGrouping = 'DATE_TRUNC(\'week\', p.created_at)';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        dateGrouping = 'DATE_TRUNC(\'month\', p.created_at)';
        break;
    }

    const query = `
      SELECT 
        ${dateGrouping} as period,
        TO_CHAR(${dateGrouping}, '${dateFormat}') as period_label,
        COUNT(p.id) as transaction_count,
        SUM(p.amount) as total_revenue,
        AVG(p.amount) as avg_transaction_value
      FROM payments p
      WHERE p.status = 'completed'
        ${startDate ? `AND p.created_at >= '${startDate}'::date` : ''}
        ${endDate ? `AND p.created_at <= '${endDate}'::date` : ''}
      GROUP BY ${dateGrouping}
      ORDER BY period DESC
    `;

    const result = await db.execute(sql.raw(query));
    return result.rows;
  }

  async getRevenueReportBySport(period: 'day' | 'week' | 'month', startDate?: string, endDate?: string): Promise<any[]> {
    let dateFormat;
    let dateGrouping;
    
    switch (period) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        dateGrouping = 'DATE(p.created_at)';
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        dateGrouping = 'DATE_TRUNC(\'week\', p.created_at)';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        dateGrouping = 'DATE_TRUNC(\'month\', p.created_at)';
        break;
    }

    const query = `
      SELECT 
        s.sport_name,
        ${dateGrouping} as period,
        TO_CHAR(${dateGrouping}, '${dateFormat}') as period_label,
        COUNT(p.id) as transaction_count,
        SUM(p.amount) as total_revenue,
        AVG(p.amount) as avg_transaction_value
      FROM payments p
      INNER JOIN bookings b ON p.booking_id = b.id
      INNER JOIN grounds_master g ON b.ground_id = g.ground_id
      INNER JOIN sports_master s ON g.sport_id = s.sport_id
      WHERE p.status = 'completed'
        ${startDate ? `AND p.created_at >= '${startDate}'::date` : ''}
        ${endDate ? `AND p.created_at <= '${endDate}'::date` : ''}
      GROUP BY s.sport_name, ${dateGrouping}
      ORDER BY period DESC, total_revenue DESC
    `;

    const result = await db.execute(sql.raw(query));
    return result.rows;
  }

  async getFacilityUsageReport(period: 'day' | 'week' | 'month', startDate?: string, endDate?: string): Promise<any[]> {
    let dateFormat;
    let dateGrouping;
    
    switch (period) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        dateGrouping = 'DATE(bs.booking_date)';
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        dateGrouping = 'DATE_TRUNC(\'week\', bs.booking_date)';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        dateGrouping = 'DATE_TRUNC(\'month\', bs.booking_date)';
        break;
    }

    const query = `
      SELECT 
        s.sport_name,
        g.ground_name,
        ${dateGrouping} as period,
        TO_CHAR(${dateGrouping}, '${dateFormat}') as period_label,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(bs.id) as total_slots_used,
        SUM(bs.participant_count) as total_participants,
        AVG(bs.participant_count) as avg_participants_per_slot,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id ELSE NULL END) as confirmed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id ELSE NULL END) as cancelled_bookings,
        ROUND(
          (COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id ELSE NULL END)::decimal / COUNT(DISTINCT b.id)) * 100, 2
        ) as utilization_rate
      FROM booking_slots bs
      INNER JOIN bookings b ON bs.booking_id = b.id
      INNER JOIN grounds_master g ON b.ground_id = g.ground_id
      INNER JOIN sports_master s ON g.sport_id = s.sport_id
      WHERE 1=1
        ${startDate ? `AND bs.booking_date >= '${startDate}'::date` : ''}
        ${endDate ? `AND bs.booking_date <= '${endDate}'::date` : ''}
      GROUP BY s.sport_name, g.ground_name, ${dateGrouping}
      ORDER BY period DESC, total_slots_used DESC
    `;

    const result = await db.execute(sql.raw(query));
    return result.rows;
  }

  async getMemberBookingReport(userId?: string, startDate?: string, endDate?: string): Promise<any[]> {
    const query = `
      SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        COUNT(b.id) as total_bookings,
        SUM(b.total_amount) as total_booking_value,
        SUM(b.participant_count) as total_participants,
        AVG(b.total_amount) as avg_booking_value,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        MIN(b.created_at) as first_booking_date,
        MAX(b.created_at) as latest_booking_date,
        STRING_AGG(DISTINCT s.sport_name, ', ') as sports_played
      FROM users u
      INNER JOIN bookings b ON u.id = b.user_id
      INNER JOIN grounds_master g ON b.ground_id = g.ground_id
      INNER JOIN sports_master s ON g.sport_id = s.sport_id
      WHERE 1=1
        ${userId ? `AND u.id = '${userId}'` : ''}
        ${startDate ? `AND b.created_at >= '${startDate}'::date` : ''}
        ${endDate ? `AND b.created_at <= '${endDate}'::date` : ''}
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone
      ORDER BY total_booking_value DESC
    `;

    const result = await db.execute(sql.raw(query));
    return result.rows;
  }

  async getMemberPaymentReport(userId?: string, startDate?: string, endDate?: string): Promise<any[]> {
    const query = `
      SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(p.id) as total_payments,
        SUM(p.amount) as total_paid,
        AVG(p.amount) as avg_payment_amount,
        SUM(CASE WHEN p.payment_method = 'cash' THEN p.amount ELSE 0 END) as cash_payments,
        SUM(CASE WHEN p.payment_method = 'upi' THEN p.amount ELSE 0 END) as upi_payments,
        SUM(CASE WHEN p.payment_method IN ('card', 'credit_card') THEN p.amount ELSE 0 END) as card_payments,
        SUM(CASE WHEN p.payment_method = 'bank_transfer' THEN p.amount ELSE 0 END) as bank_transfer_payments,
        MIN(p.created_at) as first_payment_date,
        MAX(p.created_at) as latest_payment_date,
        COUNT(DISTINCT p.booking_id) as unique_bookings_paid
      FROM users u
      INNER JOIN payments p ON u.id = p.user_id
      WHERE p.status = 'completed'
        ${userId ? `AND u.id = '${userId}'` : ''}
        ${startDate ? `AND p.created_at >= '${startDate}'::date` : ''}
        ${endDate ? `AND p.created_at <= '${endDate}'::date` : ''}
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY total_paid DESC
    `;

    const result = await db.execute(sql.raw(query));
    return result.rows;
  }

  async getCouponUsageReport(startDate?: string, endDate?: string): Promise<any[]> {
    // For now, return empty array since coupon functionality is not fully implemented
    // The bookings table doesn't have coupon_code column yet
    return [];
  }

  
  async sendBookingReminders(): Promise<{ remindersSent: number; details: any[] }> {
    // Find bookings that need reminders (next day bookings)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get bookings with slots for tomorrow
    const upcomingBookings = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      bookingDate: bookingSlots.bookingDate,
      startTime: bookingSlots.startTime,
      totalAmount: bookings.totalAmount,
      paymentStatus: bookings.paymentStatus,
      userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('userName'),
      userEmail: users.email
    })
    .from(bookings)
    .innerJoin(bookingSlots, eq(bookings.id, bookingSlots.bookingId))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(
      eq(bookingSlots.bookingDate, tomorrowStr),
      eq(bookings.status, 'confirmed')
    ));

    const remindersSent = [];
    
    for (const booking of upcomingBookings) {
      // Check if reminder already sent today
      const existingReminder = await db.select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, booking.userId),
          eq(notifications.type, 'booking_reminder'),
          eq(notifications.relatedBookingId, booking.id),
          gte(notifications.createdAt, new Date(new Date().setHours(0, 0, 0, 0)))
        ))
        .limit(1);

      if (existingReminder.length === 0) {
        const paymentMessage = booking.paymentStatus === 'pending' 
          ? ` Please complete your payment of ₹${booking.totalAmount}.`
          : '';

        await this.createNotification({
          userId: booking.userId,
          type: 'booking_reminder',
          title: 'Booking Reminder - Tomorrow',
          message: `Your booking is scheduled for tomorrow (${booking.bookingDate}) at ${booking.startTime}.${paymentMessage}`,
          channels: ['app'],
          relatedBookingId: booking.id,
          metadata: {
            bookingDate: booking.bookingDate,
            startTime: booking.startTime,
            reminderType: 'day_before'
          }
        });

        remindersSent.push({
          bookingId: booking.id,
          userName: booking.userName,
          email: booking.userEmail,
          bookingDate: booking.bookingDate,
          startTime: booking.startTime
        });
      }
    }

    return { 
      remindersSent: remindersSent.length,
      details: remindersSent
    };
  }

  async sendPaymentReminders(): Promise<{ remindersSent: number; details: any[] }> {
    // Find bookings with pending payments
    const pendingPaymentBookings = await db.select({
      bookingId: bookings.id,
      userId: bookings.userId,
      bookingDate: bookingSlots.bookingDate,
      startTime: bookingSlots.startTime,
      totalAmount: bookings.totalAmount,
      paidAmount: bookings.paidAmount,
      userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('userName'),
      userEmail: users.email
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(
      eq(bookings.status, 'confirmed'),
      inArray(bookings.paymentStatus, ['pending', 'partial'])
    ));

    const remindersSent = [];
    
    for (const booking of pendingPaymentBookings) {
      // Check if payment reminder already sent today
      const existingReminder = await db.select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, booking.userId),
          eq(notifications.type, 'payment_reminder'),
          eq(notifications.relatedBookingId, booking.bookingId),
          gte(notifications.createdAt, new Date(new Date().setHours(0, 0, 0, 0)))
        ))
        .limit(1);

      if (existingReminder.length === 0) {
        const balanceDue = parseFloat(booking.totalAmount) - (parseFloat(booking.paidAmount || '0'));
        
        await this.createNotification({
          userId: booking.userId,
          type: 'payment_reminder',
          title: 'Payment Reminder',
          message: `Please complete your payment of ₹${balanceDue} for your booking on ${booking.bookingDate} at ${booking.startTime}.`,
          channels: ['app'],
          relatedBookingId: booking.bookingId,
          metadata: {
            bookingDate: booking.bookingDate,
            startTime: booking.startTime,
            balanceDue: balanceDue,
            reminderType: 'payment_pending'
          }
        });

        remindersSent.push({
          bookingId: booking.bookingId,
          userName: booking.userName,
          email: booking.userEmail,
          bookingDate: booking.bookingDate,
          startTime: booking.startTime,
          balanceDue: balanceDue
        });
      }
    }

    return { 
      remindersSent: remindersSent.length,
      details: remindersSent
    };
  }

  // storage.ts or wherever your DatabaseStorage class is
async getBookingsByFacilityAndDate(facilityId: number, date: string) {
  // Convert the date string to Date objects for the day's range
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Use Drizzle query builder
  const result = await db
    .select()
    .from(bookings)
    .where(
      bookings.facilityId.eq(facilityId),
      bookings.startTime.gte(startOfDay),
      bookings.startTime.lte(endOfDay)
    );

  return result;
}


  async processExpiredBookings(): Promise<{ cancelledBookings: number; details: any[] }> {
    // Find bookings that are past due and still pending payment
    const currentDate = new Date();
    const expiredBookings = await db.select({
      bookingId: bookings.id,
      userId: bookings.userId,
      bookingDate: bookingSlots.bookingDate,
      startTime: bookingSlots.startTime,
      totalAmount: bookings.totalAmount,
      userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('userName'),
      userEmail: users.email
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(
      eq(bookings.status, 'confirmed'),
      eq(bookings.paymentStatus, 'pending'),
      lt(sql`CONCAT(${bookingSlots.bookingDate}, ' ', ${bookingSlots.startTime})::timestamp`, currentDate)
    ));

    const cancelledBookings = [];
    
    for (const booking of expiredBookings) {
      // Cancel the booking
      await db.update(bookings)
        .set({ 
          status: 'cancelled',
          notes: 'Auto-cancelled due to unpaid status past booking time'
        })
        .where(eq(bookings.id, booking.bookingId));

      // Send cancellation notification
      await this.createNotification({
        userId: booking.userId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled - Payment Overdue',
        message: `Your booking for ${booking.bookingDate} at ${booking.startTime} has been cancelled due to unpaid status.`,
        channels: ['app'],
        relatedBookingId: booking.bookingId,
        metadata: {
          bookingDate: booking.bookingDate,
          startTime: booking.startTime,
          cancellationReason: 'payment_overdue',
          amount: booking.totalAmount
        }
      });

      cancelledBookings.push({
        bookingId: booking.bookingId,
        userName: booking.userName,
        email: booking.userEmail,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        amount: booking.totalAmount
      });
    }

    return { 
      cancelledBookings: cancelledBookings.length,
      details: cancelledBookings
    };
  }
}

export const storage = new DatabaseStorage();