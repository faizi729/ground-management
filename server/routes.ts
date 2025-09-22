import type { Request, Response } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBookingSchema, insertBookingSlotSchema, insertPaymentSchema, insertCouponSchema, insertSportSchema, insertGroundSchema, insertPlanSchema, insertTimeSlotSchema, bookings, payments } from "@shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { ReceiptGenerator, type ReceiptData } from "./receipt";
import { SMSService, EmailService } from "./notifications";
import { nanoid } from "nanoid";
import "./types"; // Import the type declarations
import Razorpay from "razorpay";
import bcrypt from "bcrypt";
import { loggerMiddleware } from "@/loggerMiddleware";

// Helper function to generate receipt data from payment ID
async function generateReceiptData(paymentId: number): Promise<ReceiptData> {
  const payment = await storage.getPaymentById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  const booking = await storage.getBookingDetails(payment.bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  const user = await storage.getUserById(booking.userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Get all payments for this booking to calculate total paid before this payment
  const allPayments = await storage.getPayments(booking.id);
  const sortedPayments = allPayments.sort((a, b) => new Date(a.processedAt).getTime() - new Date(b.processedAt).getTime());

 
  
  // Find the index of current payment
  const currentPaymentIndex = sortedPayments.findIndex(p => p.id === payment.id);
  
  // Calculate total paid before this payment
  const totalPaidBeforeThis = sortedPayments
    .slice(0, currentPaymentIndex)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Get booking slots for time display
  const bookingSlots = await storage.getBookingSlots(booking.id);
  const firstSlot = bookingSlots[0];
  const lastSlot = bookingSlots[bookingSlots.length - 1];
  
  // Generate unique receipt ID
  const receiptId = `RCP-${Date.now()}-${nanoid(6).toUpperCase()}`;
  
  return {
    receiptId,
    bookingId: booking.id,
    paymentId: payment.id,
    customerName: `${user.firstName} ${user.lastName}`,
    customerEmail: user.email,
    customerPhone: user.phone || '',
    facilityName: booking.facilityName || 'Sports Facility',
    sportName: booking.facilityType || 'Sport',
    bookingDate: firstSlot?.slotDate || booking.startDate,
    startTime: firstSlot?.startTime || '00:00',
    endTime: lastSlot?.endTime || firstSlot?.endTime || '00:00',
    participants: booking.participantCount || 1,
    totalBookingAmount: Number(booking.totalAmount) + Number(booking.discountAmount || 0),
    totalAmount: Math.max(0, Number(booking.totalAmount) + Number(booking.discountAmount || 0) - Number(booking.discountAmount || 0) - totalPaidBeforeThis),
    paidAmount: Number(payment.amount),
    discountAmount: Number(booking.discountAmount || 0),
    totalPaidBeforeThis: totalPaidBeforeThis,
    paymentMethod: payment.paymentMethod || 'Online',
    transactionId: payment.transactionId || '',
    paymentDate: payment.processedAt?.toISOString() || new Date().toISOString(),
    balanceAmount: Math.max(0, Number(booking.totalAmount) - Number(booking.paidAmount || 0)),
    paymentStatus: payment.status
  };
}
 const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// Helper function to generate and send receipt

async function generateAndSendReceipt(paymentId: number, sendSMS: boolean = false, sendEmail: boolean = false): Promise<{ receiptId: string; sent: { sms: boolean; email: boolean } }> {
  const receiptData = await generateReceiptData(paymentId);
  
  const results = {
    receiptId: receiptData.receiptId,
    sent: { sms: false, email: false }
  };
  
  // Send SMS if requested
  if (sendSMS && receiptData.customerPhone) {
    const smsText = ReceiptGenerator.generateSMSText(receiptData);
    results.sent.sms = await SMSService.sendSMS(receiptData.customerPhone, smsText);
  }
  
  // Send Email if requested
  if (sendEmail && receiptData.customerEmail) {
    const htmlContent = ReceiptGenerator.generateReceiptHTML(receiptData);
    const pdfBuffer = ReceiptGenerator.generateReceiptPDF(receiptData);
    results.sent.email = await EmailService.sendReceiptEmail(
      receiptData.customerEmail,
      receiptData.customerName,
      receiptData.receiptId,
      htmlContent,
      pdfBuffer
    );
  }
  
  return results;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
app.use(loggerMiddleware);
  // Authentication routes
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Signup route for new users
  app.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await storage.createUser({
      id: `user-${Date.now()}`, // Generate unique ID
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,   // ✅ store the hashed password
      role: "client",
      isActive: true,
      createdAt: new Date(),
      modifiedAt: new Date()
    });

    // Auto-login the user after signup
    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging in after signup" });
      }
      res.json({ success: true, user: newUser });
    });
  } catch (error: any) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: error.message || "Failed to create account" });
  }
});

  // Sports Master routes
  app.get('/api/sports', async (req, res) => {
    try {
      const sports = await storage.getSports();
      res.json(sports);
    } catch (error) {
      console.error("Error fetching sports:", error);
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  // Grounds Master routes
  app.get('/api/grounds', async (req, res) => {
    try {
      const sportId = req.query.sportId ? parseInt(req.query.sportId as string) : undefined;
      const grounds = sportId ? await storage.getGroundsBySport(sportId) : await storage.getGrounds();
      res.json(grounds);
    } catch (error) {
      console.error("Error fetching grounds:", error);
      res.status(500).json({ message: "Failed to fetch grounds" });
    }
  });

  // Plans Master routes
  app.get('/api/plans', async (req, res) => {
    try {
      const groundId = req.query.groundId ? parseInt(req.query.groundId as string) : undefined;
      const plans = groundId ? await storage.getPlansByGround(groundId) : await storage.getPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });
  
  // Facility routes (using master tables exclusively)
  app.get('/api/facilities', async (req, res) => {
    try {
      const facilities = await storage.getFacilities();
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.get('/api/facilities/popular', async (req, res) => {
    try {
      const facilities = await storage.getPopularFacilities();
      res.json(facilities);
      console.log("Popular Facilities API response:", facilities);
    } catch (error) {
      console.error("Error fetching popular facilities:", error);
      res.status(500).json({ message: "Failed to fetch popular facilities" });
    }
  });

app.get('/api/facilities/:id/slots', async (req, res) => {
  try {
    const facilityId = parseInt(req.params.id);
    const date = req.query.date as string;
    const slots = await storage.getFacilitySlots(facilityId, date);
    res.json(slots);
    console.log("Slots API response:", slots);
  } catch (error) {
    console.error("Error fetching facility slots:", error);
    res.status(500).json({ message: "Failed to fetch facility slots" });
  }
});


 

  // Booking routes
  app.get("/api/bookings/user", isAuthenticated, async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const bookings = await storage.getUserBookings(req.user.id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
//
app.post("/api/payments/create-order",isAuthenticated, async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const options = {
      amount: amount * 100, // ₹1 = 100 paise
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
  // User's pending payments (confirmed bookings with outstanding payments)
  app.get("/api/bookings/pending-payments", isAuthenticated, async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const userPendingPayments = await storage.getPendingPayments(req.user.id);
      res.json(userPendingPayments);
    } catch (error) {
      console.error("Error fetching user pending payments:", error);
      res.status(500).json({ message: "Failed to fetch pending payments" });
    }
  });

  app.get("/api/bookings/all-payments", isAuthenticated, async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const allPayments = await storage.getAllUserPayments(req.user.id);
      res.json(allPayments);
    } catch (error) {
      console.error("Error fetching all payments:", error);
      res.status(500).json({ message: "Failed to fetch all payments" });
    }
  });

  app.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const bookingId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Validate bookingId is a number
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const booking = await storage.getBookingDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if user owns the booking or is admin
      if (booking.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });



  app.post("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      // Parse and validate booking data
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id,
        status: "confirmed", // Set as confirmed after validation per requirements
        paymentStatus: "pending", // Start with pending payment
      });
      
      const slots = req.body.slots || [];
      const validatedSlots = slots.map((slot: any) => {
        // Remove bookingId from slot data since it will be set during creation
        const { bookingId, ...slotData } = slot;
        return insertBookingSlotSchema.parse({
          ...slotData,
          participantCount: bookingData.participantCount || 1, // Add participant count to each slot
        });
      });

      // VALIDATION STEP 1: Comprehensive data validation
      if (!bookingData.groundId || !bookingData.bookingType || !bookingData.planType) {
        return res.status(400).json({ message: "Missing required booking information" });
      }
      
      if (!bookingData.participantCount || bookingData.participantCount <= 0) {
        return res.status(400).json({ message: "Valid participant count is required" });
      }
      
      if (!bookingData.totalAmount || bookingData.totalAmount <= 0) {
        return res.status(400).json({ message: "Valid total amount is required" });
      }
      
      if (validatedSlots.length === 0) {
        return res.status(400).json({ message: "At least one time slot must be selected" });
      }

      // Validate each slot has required data
      for (const slot of validatedSlots) {
        if (!slot.bookingDate || !slot.startTime || !slot.endTime) {
          return res.status(400).json({ message: "All slots must have complete date and time information" });
        }
      }

      // VALIDATION STEP 2: Get ground details for capacity validation
      const ground = await storage.getGroundById(bookingData.groundId);
      if (!ground) {
        return res.status(400).json({ message: "Invalid ground selected" });
      }

      // VALIDATION STEP 3: Capacity validation for per-person bookings
      if (bookingData.bookingType === "per-person") {
        const maxCapacity = ground.maxCapacity || 10;
        if (bookingData.participantCount > maxCapacity) {
          return res.status(400).json({ 
            message: `Participant count (${bookingData.participantCount}) exceeds ground capacity (${maxCapacity})` 
          });
        }
        
        // Check available capacity for each slot
        for (const slot of validatedSlots) {
          const existingBookings = await storage.getBookingsForSlot(
            bookingData.groundId, 
            slot.bookingDate, 
            slot.startTime
          );
          
          const bookedCapacity = existingBookings.reduce((total, booking) => {
            return total + (booking.participantCount || 0);
          }, 0);
          
          const availableCapacity = maxCapacity - bookedCapacity;
          
          if (bookingData.participantCount > availableCapacity) {
            return res.status(400).json({ 
              message: `Insufficient capacity for ${slot.startTime} on ${slot.bookingDate}. Available: ${availableCapacity}, Requested: ${bookingData.participantCount}` 
            });
          }
        }
      }

      // VALIDATION STEP 4: Check for duplicate bookings (only for full-ground bookings)
      // Per-person bookings rely on capacity checking instead
      if (bookingData.bookingType === 'full-ground') {
        for (const slot of validatedSlots) {
          const duplicateBookings = await storage.checkDuplicateBooking(
            req.user.id,
            bookingData.groundId,
            slot.bookingDate,
            slot.startTime
          );
          
          if (duplicateBookings.length > 0) {
            return res.status(400).json({ 
              message: `You already have a booking for ${slot.startTime} on ${slot.bookingDate}` 
            });
          }
        }
      }

      // VALIDATION STEP 5: Ensure booking date is current or future
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const slot of validatedSlots) {
        const slotDate = new Date(slot.bookingDate);
        if (slotDate < currentDate) {
          return res.status(400).json({ 
            message: `Cannot book for past date: ${slot.bookingDate}` 
          });
        }
      }

      // All validations passed - create the booking
      const result = await storage.createBooking(bookingData, validatedSlots);
      res.json(result);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid booking data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Payment routes
  app.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        userId: req.user.id,
        status: req.body.status || 'pending', // Default to pending if not specified
        processedAt: req.body.status === 'completed' ? new Date() : null,
      });
      
      // Create the payment record
      const payment = await storage.createPayment(paymentData);
      
      // If payment is completed and has a booking ID, update the booking's paid amount
      if (payment.status === 'completed' && payment.bookingId) {
        try {
          // Get the booking details
          const booking = await storage.getBookingDetails(payment.bookingId);
          if (booking) {
            // Get all completed payments for this booking
            const allPayments = await storage.getPayments(payment.bookingId);
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
            } else {
              paymentStatus = 'pending';
            }
            
            // Update booking with correct amounts and status
            await storage.updateBookingPayment(payment.bookingId, {
              paidAmount: totalPaid.toString(),
              paymentStatus: paymentStatus,
              status: bookingStatus
            });
          }
        } catch (updateError) {
          console.error("Error updating booking payment info:", updateError);
          // Don't fail the payment creation, but log the error
        }
      }
      
      // Generate and send receipt if payment is completed
      if (payment.status === 'completed' && payment.bookingId) {
        try {
          await generateAndSendReceipt(payment.id, req.body.sendSMS, req.body.sendEmail);
        } catch (receiptError) {
          console.error("Error generating receipt:", receiptError);
          // Don't fail the payment creation, but log the error
        }
      }
      
      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid payment data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/bookings", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const sortBy = req.query.sortBy as string;
      
      console.log('Route received sortBy:', sortBy);
      
      const result = await storage.getAdminBookings({ page, limit, status, search, sortBy });
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/bookings/:id/slots", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const bookingId = parseInt(req.params.id);
      const slots = await storage.getBookingSlots(bookingId);
      res.json(slots);
    } catch (error) {
      console.error("Error fetching booking slots:", error);
      res.status(500).json({ message: "Failed to fetch booking slots" });
    }
  });

  // Admin Master Table Management
  app.get("/api/admin/sports", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const sports = await storage.getAllSports();
      res.json(sports);
    } catch (error) {
      console.error("Error fetching sports:", error);
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  app.post("/api/admin/sports", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const sportData = insertSportSchema.parse(req.body);
      const sport = await storage.createSport(sportData);
      res.json(sport);
    } catch (error) {
      console.error("Error creating sport:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid sport data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create sport" });
    }
  });

  app.patch("/api/admin/sports/:id", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      const sport = await storage.updateSport(id, req.body);
      res.json(sport);
    } catch (error) {
      console.error("Error updating sport:", error);
      res.status(500).json({ message: "Failed to update sport" });
    }
  });

  app.get("/api/admin/grounds", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const grounds = await storage.getAllGrounds();
      res.json(grounds);
    } catch (error) {
      console.error("Error fetching grounds:", error);
      res.status(500).json({ message: "Failed to fetch grounds" });
    }
  });

  app.post("/api/admin/grounds", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const groundData = insertGroundSchema.parse(req.body);
      const ground = await storage.createGround(groundData);
      res.json(ground);
    } catch (error) {
      console.error("Error creating ground:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ground data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create ground" });
    }
  });

  app.get("/api/admin/plans", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const plans = await storage.getAllPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.patch("/api/admin/plans/update", isAuthenticated, async (req, res) => {
     res.set("Cache-Control", "no-store");
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
       const planData = req.body; // validate with Zod if you want

    let plan;
      plan = await storage.updatePlan(planData.id, planData);
      res.json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid plan data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create plan" });
    }
  });






  app.post("/api/admin/plans", isAuthenticated, async (req, res) => {
  
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const planData = req.body; // validate with Zod if you want

    let plan;

    if (planData.id) {
      // 🔹 If `id` is passed → update existing plan
      plan = await storage.updatePlan(planData.id, planData);

      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
    } else {
      // 🔹 If no `id` → create new plan
      plan = await storage.createPlan(planData);
    }

    res.json(plan);
  } catch (error) {
    console.error("Error saving plan:", error);
    res.status(500).json({ message: "Failed to save plan" });
  }
});

  // Admin time slots endpoints
  app.get("/api/admin/timeslots", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or manager access required" });
      }
      
      const timeSlots = await storage.getAllTimeSlots();
      res.json(timeSlots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });

  app.post("/api/admin/timeslots", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or manager access required" });
      }
      
      const timeSlotData = insertTimeSlotSchema.parse(req.body);
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.json(timeSlot);
    } catch (error) {
      console.error("Error creating time slot:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid time slot data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create time slot" });
    }
  });

  app.patch("/api/admin/timeslots/:id", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or manager access required" });
      }
      
      const id = parseInt(req.params.id);
      const timeSlotData = insertTimeSlotSchema.partial().parse(req.body);
      const updatedTimeSlot = await storage.updateTimeSlot(id, timeSlotData);
      res.json(updatedTimeSlot);
    } catch (error) {
      console.error("Error updating time slot:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid time slot data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to update time slot" });
    }
  });

  app.delete("/api/admin/timeslots/:id", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or manager access required" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteTimeSlot(id);
      res.json({ message: "Time slot deleted successfully" });
    } catch (error) {
      console.error("Error deleting time slot:", error);
      res.status(500).json({ message: "Failed to delete time slot" });
    }
  });

  // Admin facilities endpoint (using master tables)
  app.get('/api/admin/facilities', isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const facilities = await storage.getFacilities();
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching admin facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  // Admin facility statistics endpoint
  app.get('/api/admin/facility-stats', isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const facilities = await storage.getFacilities();
      const allBookings = await storage.getBookings(); // Use the correct method
      const allPayments = await storage.getAllPayments();
      
      // Calculate accurate facility statistics
      const totalFacilities = facilities.length;
      
      // Calculate total revenue from actual payments received (not booking amounts)
      const totalRevenue = allPayments.reduce((sum, payment) => {
        return sum + Number(payment.amount || 0);
      }, 0);
      
      // Calculate average capacity from actual facility capacities
      const avgCapacity = facilities.length > 0 
        ? facilities.reduce((sum, f) => sum + (f.capacity || 0), 0) / facilities.length 
        : 0;
      
      // Calculate total bookings
      const totalBookings = allBookings.length;
      
      // Calculate active facilities
      const activeFacilities = facilities.filter(f => f.isActive).length;
      
      // Calculate booking trends (last 30 days vs previous 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const recentBookings = allBookings.filter(b => new Date(b.createdAt) >= thirtyDaysAgo).length;
      const previousBookings = allBookings.filter(b => {
        const date = new Date(b.createdAt);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      }).length;
      
      const bookingTrend = previousBookings > 0 
        ? ((recentBookings - previousBookings) / previousBookings) * 100 
        : recentBookings > 0 ? 100 : 0;
      
      res.json({
        totalFacilities,
        totalRevenue,
        avgCapacity: Math.round(avgCapacity),
        totalBookings,
        activeFacilities,
        recentBookings,
        bookingTrend: Math.round(bookingTrend),
        avgBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0
      });
    } catch (error) {
      console.error("Error fetching facility stats:", error);
      res.status(500).json({ message: "Failed to fetch facility stats" });
    }
  });

  // Admin payment and collection routes
  app.get("/api/admin/payments", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching admin payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Admin pending bookings (only payment collection tasks - no approval delays)
  app.get("/api/admin/pending-payments", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const pendingBookings = await storage.getAllPendingBookings();
      res.json(pendingBookings);
    } catch (error) {
      console.error("Error fetching pending payment bookings:", error);
      res.status(500).json({ message: "Failed to fetch pending payment bookings" });
    }
  });

  app.post("/api/admin/collect-payment", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { 
        bookingId, 
        amount, 
        paymentMethod, 
        notes, 
        transactionId, 
        upiId, 
        bankName, 
        accountNumber, 
        paymentDate,
        discountAmount = 0,
        discountReason = ''
      } = req.body;
      
      if (!bookingId || !amount || !paymentMethod) {
        return res.status(400).json({ message: "Missing required payment information" });
      }
      
      // Get booking using storage method to avoid db reference issues
      const booking = await storage.getBooking(parseInt(bookingId));
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Generate transaction ID based on payment method
      let finalTransactionId = transactionId;
      if (!finalTransactionId) {
        const timestamp = Date.now();
        switch (paymentMethod) {
          case 'cash':
            finalTransactionId = `CASH-${timestamp}`;
            break;
          case 'upi':
            finalTransactionId = `UPI-${timestamp}`;
            break;
          case 'card':
            finalTransactionId = `CARD-${timestamp}`;
            break;
          case 'bank_transfer':
            finalTransactionId = `BANK-${timestamp}`;
            break;
          default:
            finalTransactionId = `ADMIN-${timestamp}`;
        }
      }

      // Create detailed payment gateway response with all transaction details
      const paymentGatewayResponse: any = {
        collectedBy: req.user.username,
        notes: notes || `Payment collected by admin ${req.user.username}`,
        collectionDate: paymentDate || new Date().toISOString(),
        paymentMethod: paymentMethod
      };

      // Add method-specific details
      if (paymentMethod === 'upi' && upiId) {
        paymentGatewayResponse.upiId = upiId;
        paymentGatewayResponse.upiTransactionId = transactionId;
      } else if (paymentMethod === 'bank_transfer') {
        if (bankName) paymentGatewayResponse.bankName = bankName;
        if (accountNumber) paymentGatewayResponse.accountNumber = accountNumber;
        if (transactionId) paymentGatewayResponse.bankReferenceNumber = transactionId;
      } else if (paymentMethod === 'card' && transactionId) {
        paymentGatewayResponse.cardTransactionId = transactionId;
      }

      // Create payment record with discount information
      const paymentData: any = {
        bookingId: parseInt(bookingId),
        userId: booking.userId,
        amount: Number(amount),
        paymentMethod: paymentMethod,
        transactionId: finalTransactionId,
        status: 'completed',
        processedAt: paymentDate ? new Date(paymentDate) : new Date(),
        paymentGatewayResponse: paymentGatewayResponse
      };
      
      // Calculate new amounts with discount support FIRST
      const currentPaidAmount = Number(booking.paidAmount || 0);
      const currentDiscountAmount = Number(booking.discountAmount || 0);
      const newDiscountAmount = Number(discountAmount || 0);
      const totalAmount = Number(booking.totalAmount);
      const newPaidAmount = currentPaidAmount + Number(amount);
      
      // Calculate final amount due after applying new discount
      const finalAmountDue = totalAmount - newDiscountAmount;
      const remainingBalance = Math.max(0, finalAmountDue - newPaidAmount);
      
      // Determine new payment status based on final amount due
      let newPaymentStatus;
      let newBookingStatus = booking.status;
      
      if (newPaidAmount >= finalAmountDue) {
        newPaymentStatus = 'completed';
        newBookingStatus = 'confirmed';
      } else if (newPaidAmount > 0) {
        newPaymentStatus = 'partial';
        // Keep booking status as is for partial payments
      } else {
        newPaymentStatus = 'pending';
      }
      
      console.log(`Admin collecting payment for booking ${bookingId}:`);
      console.log(`- Total Amount: ₹${totalAmount}`);
      console.log(`- Discount Applied: ₹${newDiscountAmount}`);
      console.log(`- Final Amount Due: ₹${finalAmountDue}`);
      console.log(`- Current Paid: ₹${currentPaidAmount}`);
      console.log(`- Payment Amount: ₹${amount}`);
      console.log(`- New Total Paid: ₹${newPaidAmount}`);
      console.log(`- Remaining Balance: ₹${remainingBalance}`);
      console.log(`- New Status: ${newPaymentStatus}`);
      
      // Add discount information to payment record if applicable
      if (newDiscountAmount > 0) {
        paymentData.discountAmount = newDiscountAmount;
        paymentData.discountReason = discountReason.trim() || 'Admin discount';
      }
      
      // Create payment record FIRST (before updating booking)
      const payment = await storage.createPayment(paymentData);
      
      // Update booking with discount information AFTER payment is created
      const bookingUpdates: any = {
        paidAmount: newPaidAmount.toString(),
        paymentStatus: newPaymentStatus,
        status: newBookingStatus
      };
      
      // Include discount information if provided
      if (newDiscountAmount > 0 && newDiscountAmount !== currentDiscountAmount) {
        bookingUpdates.discountAmount = newDiscountAmount.toString();
        if (discountReason.trim()) {
          bookingUpdates.discountReason = discountReason.trim();
        }
      }
      
      await storage.updateBookingPayment(parseInt(bookingId), bookingUpdates);

      // Generate receipt data without problematic ORM calls
      const receiptData = {
        paymentId: payment.id,
        bookingId: parseInt(bookingId),
        customerName: 'Customer',
        customerEmail: '',
        customerPhone: '',
        facility: 'Sports Facility',
        amount: Number(amount),
        paymentMethod: paymentMethod,
        transactionId: finalTransactionId,
        paymentDate: paymentDate || new Date().toISOString(),
        totalAmount: totalAmount,
        paidAmount: newPaidAmount,
        remainingBalance: Math.max(0, remainingBalance),
        isFullyPaid: newPaymentStatus === 'completed',
        notes: notes
      };

      console.log('Payment processed successfully. Receipt data:', receiptData);
      
      // Generate and send receipt for completed payment
      let receiptResult = null;
      try {
        receiptResult = await generateAndSendReceipt(payment.id, req.body.sendSMS, req.body.sendEmail);
      } catch (receiptError) {
        console.error("Error generating receipt:", receiptError);
        // Don't fail the payment collection, but log the error
      }
      
      res.json({ 
        success: true, 
        payment,
        remainingBalance: Math.max(0, remainingBalance),
        isFullyPaid: newPaymentStatus === 'completed',
        receipt: receiptResult,
        message: newPaymentStatus === 'completed' 
          ? `Payment completed successfully. Booking confirmed.`
          : `Partial payment of ₹${amount} collected. Remaining balance: ₹${remainingBalance.toFixed(2)}`
      });
    } catch (error) {
      console.error("Error collecting payment:", error);
      res.status(500).json({ message: "Failed to collect payment" });
    }
  });

  app.patch("/api/admin/payments/:paymentId", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const paymentId = parseInt(req.params.paymentId);
      const { status, notes } = req.body;
      
      // Update payment status (this will automatically sync booking data via syncBookingPaymentData)
      const updatedPayment = await storage.updatePaymentStatus(paymentId, status, notes);
      
      res.json({
        success: true,
        payment: updatedPayment,
        message: `Payment status updated to ${status}. Booking payment data synchronized.`
      });
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  // Reports routes
  app.get("/api/admin/reports/revenue", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { period = 'month', startDate, endDate } = req.query;
      const report = await storage.getRevenueReport(period as 'day' | 'week' | 'month', startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      console.error("Error fetching revenue report:", error);
      res.status(500).json({ message: "Failed to fetch revenue report" });
    }
  });

  app.get("/api/admin/reports/revenue-by-sport", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { period = 'month', startDate, endDate } = req.query;
      const report = await storage.getRevenueReportBySport(period as 'day' | 'week' | 'month', startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      console.error("Error fetching revenue by sport report:", error);
      res.status(500).json({ message: "Failed to fetch revenue by sport report" });
    }
  });

  app.get("/api/admin/reports/facility-usage", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { period = 'month', startDate, endDate } = req.query;
      const report = await storage.getFacilityUsageReport(period as 'day' | 'week' | 'month', startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      console.error("Error fetching facility usage report:", error);
      res.status(500).json({ message: "Failed to fetch facility usage report" });
    }
  });

  app.get("/api/admin/reports/member-bookings", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId, startDate, endDate } = req.query;
      const report = await storage.getMemberBookingReport(userId as string, startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      console.error("Error fetching member booking report:", error);
      res.status(500).json({ message: "Failed to fetch member booking report" });
    }
  });

  app.get("/api/admin/reports/member-payments", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId, startDate, endDate } = req.query;
      const report = await storage.getMemberPaymentReport(userId as string, startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      console.error("Error fetching member payment report:", error);
      res.status(500).json({ message: "Failed to fetch member payment report" });
    }
  });

  app.get("/api/admin/reports/coupon-usage", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { startDate, endDate } = req.query;
      const report = await storage.getCouponUsageReport(startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      console.error("Error fetching coupon usage report:", error);
      res.status(500).json({ message: "Failed to fetch coupon usage report" });
    }
  });

  // Admin - Get all users
  app.get("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const role = req.query.role as string;
      const search = req.query.search as string;
      
      const users = await storage.getUsers({ page, limit, role, search });
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin - Update user
  app.patch("/api/admin/users/:id", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }
      
      const userId = req.params.id;
      const updateData = req.body;
      
      // Validate that managers can't update admin users
      if (req.user.role === "manager") {
        const existingUser = await storage.getUser(userId);
        if (existingUser?.role === "admin") {
          return res.status(403).json({ message: "Managers cannot modify admin users" });
        }
        // Prevent managers from creating new admin users
        if (updateData.role === "admin") {
          return res.status(403).json({ message: "Managers cannot create admin users" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Update past bookings to completed status with payment validation
  app.post("/api/admin/update-past-bookings", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }
      
      const result = await storage.updatePastBookingsToCompleted();
      
      let message = '';
      if (result.updated > 0 && result.skipped === 0) {
        message = `✅ Updated ${result.updated} past confirmed bookings to completed status`;
      } else if (result.updated > 0 && result.skipped > 0) {
        message = `⚠️ Updated ${result.updated} bookings to completed. Skipped ${result.skipped} bookings with outstanding payments`;
      } else if (result.updated === 0 && result.skipped > 0) {
        message = `⚠️ No bookings updated. ${result.skipped} bookings have outstanding payments that need to be resolved first`;
      } else {
        message = `ℹ️ No past confirmed bookings found to update`;
      }

      res.json({ 
        message,
        updated: result.updated,
        skipped: result.skipped,
        paymentIssues: result.issues
      });
    } catch (error) {
      console.error("Error updating past bookings:", error);
      res.status(500).json({ message: "Failed to update past bookings" });
    }
  });

  // Get all upcoming bookings for admin dashboard
  app.get("/api/admin/upcoming-bookings", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }
      
      const upcomingBookings = await storage.getAllUpcomingBookings();
      res.json(upcomingBookings);
    } catch (error) {
      console.error("Error fetching admin upcoming bookings:", error);
      res.status(500).json({ message: "Failed to fetch upcoming bookings" });
    }
  });

  // Notification Management Routes
  
  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user.id;
      
      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  // Send booking reminder notifications
  app.post("/api/admin/send-booking-reminders", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }
      
      const result = await storage.sendBookingReminders();
      res.json({ 
        message: `Sent ${result.remindersSent} booking reminders`,
        details: result
      });
    } catch (error) {
      console.error("Error sending booking reminders:", error);
      res.status(500).json({ message: "Failed to send booking reminders" });
    }
  });
  
  // Send payment reminder notifications
  app.post("/api/admin/send-payment-reminders", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }
      
      const result = await storage.sendPaymentReminders();
      res.json({ 
        message: `Sent ${result.remindersSent} payment reminders`,
        details: result
      });
    } catch (error) {
      console.error("Error sending payment reminders:", error);
      res.status(500).json({ message: "Failed to send payment reminders" });
    }
  });
  
  // Auto-process expired bookings
  app.post("/api/admin/process-expired-bookings", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }
      
      const result = await storage.processExpiredBookings();
      res.json({ 
        message: `Processed ${result.cancelledBookings} expired bookings`,
        details: result
      });
    } catch (error) {
      console.error("Error processing expired bookings:", error);
      res.status(500).json({ message: "Failed to process expired bookings" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // PAYMENT ROUTES - MOCK IMPLEMENTATION FOR TESTING
  
  // Create payment intent for secure payment processing (Mock version for testing)
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { bookingId, amount, currency = "inr" } = req.body;
      
      // Validate input
      if (!bookingId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid booking ID or amount" });
      }
      
      // Verify booking belongs to user and get details
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized booking access" });
      }
      
      console.log(`Mock payment intent created for booking ${bookingId}, amount: ${amount}`);
      
      // Return mock client secret for testing
      res.json({ 
        clientSecret: `pi_mock_${bookingId}_${Date.now()}_secret`,
        paymentIntentId: `pi_mock_${bookingId}_${Date.now()}`
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Mock webhook endpoint for testing payment confirmation
  app.post("/api/stripe-webhook", async (req, res) => {
    console.log("Mock webhook received");
    res.json({received: true});
  });

  // Mock payment success endpoint for testing
  app.post("/api/test-payment-success", isAuthenticated, async (req, res) => {
    try {
      const { 
        bookingId, 
        amount, 
        paymentMethod = 'mock_card',
        discountAmount = 0,
        discountReason = ''
      } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID required" });
      }
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized booking access" });
      }
      
      // Calculate payment amounts with new discount
      const currentPaidAmount = Number(booking.paidAmount || 0);
      const currentDiscountAmount = Number(booking.discountAmount || 0);
      const newDiscountAmount = Number(discountAmount || 0);
      const totalAmount = Number(booking.totalAmount);
      const paymentAmount = amount ? Number(amount) : (totalAmount - currentPaidAmount - newDiscountAmount);
      const newPaidAmount = currentPaidAmount + paymentAmount;
      
      // Calculate the final amount due after applying discount
      const finalAmountDue = totalAmount - newDiscountAmount;
      
      // Determine new payment status based on final amount due
      let newPaymentStatus = 'pending';
      console.log(`Payment status calculation: newPaidAmount (${newPaidAmount}) >= finalAmountDue (${finalAmountDue}) = ${newPaidAmount >= finalAmountDue}`);
      
      if (newPaidAmount >= finalAmountDue) {
        newPaymentStatus = 'completed';
        console.log('Setting status to completed');
      } else if (newPaidAmount > 0) {
        newPaymentStatus = 'partial';
        console.log('Setting status to partial');
      } else {
        console.log('Setting status to pending');
      }
      
      console.log(`Processing payment for booking ${bookingId}:`);
      console.log(`- Total Amount: ₹${totalAmount}`);
      console.log(`- Discount Applied: ₹${newDiscountAmount}`);
      console.log(`- Final Amount Due: ₹${finalAmountDue}`);
      console.log(`- Current Paid: ₹${currentPaidAmount}`);
      console.log(`- Payment Amount: ₹${paymentAmount}`);
      console.log(`- New Total Paid: ₹${newPaidAmount}`);
      console.log(`- New Status: ${newPaymentStatus}`);
      
      // Update booking with new paid amount, discount, and status
      const bookingUpdates: any = { 
        paidAmount: newPaidAmount,
        paymentStatus: newPaymentStatus,
        status: 'confirmed' 
      };
      
      // Only update discount if it's provided and different from current
      if (newDiscountAmount > 0 && newDiscountAmount !== currentDiscountAmount) {
        bookingUpdates.discountAmount = newDiscountAmount;
        if (discountReason.trim()) {
          bookingUpdates.discountReason = discountReason.trim();
        }
      }
      
      // Create payment record FIRST (before updating booking status)
      const paymentData: any = {
        bookingId: bookingId,
        userId: req.user!.id,
        amount: paymentAmount,
        paymentMethod: paymentMethod,
        transactionId: `Razorpay_${bookingId}_${Date.now()}`,
        status: 'completed',
        processedAt: new Date(),
      };
      
      // Add discount information to payment record if applicable
      if (newDiscountAmount > 0) {
        paymentData.discountAmount = newDiscountAmount;
        paymentData.discountReason = discountReason.trim() || 'Admin discount';
      }
      
      console.log(`Creating payment record first...`);
      await storage.createPayment(paymentData);
      
      // Now update booking with payment status (validation will find the payment we just created)
      console.log(`Final booking updates:`, JSON.stringify(bookingUpdates, null, 2));
      await storage.updateBooking(bookingId, bookingUpdates);
      console.log(`Booking ${bookingId} updated successfully with status: ${newPaymentStatus}`);
      
      console.log(`Mock payment completed for booking ${bookingId} with discount: ₹${newDiscountAmount}`);
      
      // Get the updated booking and payment details for receipt generation
      const updatedBooking = await storage.getBookingDetails(bookingId);
      const latestPayment = await storage.getPayments(bookingId);
      const mostRecentPayment = latestPayment[0]; // First payment is most recent due to ordering
      
      console.log('Updated booking discount amount:', updatedBooking?.discountAmount);
      
      // Get time slot information from booking slots
      const firstSlot = updatedBooking?.slots?.[0];
      const timeSlot = firstSlot ? `${firstSlot.startTime}-${firstSlot.endTime}` : '00:00';
      const bookingDate = firstSlot ? firstSlot.bookingDate : updatedBooking?.startDate;
      
      res.json({ 
        success: true,
        message: "Payment completed successfully",
        payment: {
          id: mostRecentPayment?.id,
          amount: paymentAmount,
          paymentMethod: paymentMethod,
          status: 'completed',
          transactionId: paymentData.transactionId,
          processedAt: new Date().toISOString()
        },
        booking: {
          id: bookingId,
          groundName: updatedBooking?.facilityName || 'Sports Facility',
          sportName: updatedBooking?.facilityType || 'Sport Activity',
          startDate: bookingDate,
          bookingDate: bookingDate,
          timeSlot: timeSlot,
          participantCount: updatedBooking?.participantCount || 1,
          totalAmount: totalAmount,
          paidAmount: newPaidAmount,
          discountAmount: updatedBooking?.discountAmount || newDiscountAmount
        },
        bookingId: bookingId,
        amountPaid: paymentAmount,
        discountApplied: newDiscountAmount,
        newTotalPaid: newPaidAmount,
        finalAmountDue: finalAmountDue,
        paymentStatus: newPaymentStatus
      });
    } catch (error: any) {
      console.error("Error processing mock payment:", error);
      res.status(500).json({ 
        message: "Error processing payment",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get payment status for a booking
  app.get("/api/bookings/:bookingId/payment-status", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // Verify booking belongs to user
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized booking access" });
      }
      
      res.json({
        bookingId: bookingId,
        paymentStatus: booking.paymentStatus,
        totalAmount: booking.totalAmount,
        paidAmount: booking.paidAmount || 0,
        balanceDue: Number(booking.totalAmount) - Number(booking.paidAmount || 0)
      });
    } catch (error) {
      console.error("Error fetching payment status:", error);
      res.status(500).json({ message: "Failed to fetch payment status" });
    }
  });

  // Auto-cancel expired pending bookings
  const autoCancelExpiredBookings = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      const expiredBookings = await storage.getExpiredPendingBookings(today);
      
      if (expiredBookings.length > 0) {
        console.log(`Found ${expiredBookings.length} expired pending bookings to auto-cancel`);
        
        for (const booking of expiredBookings) {
          await storage.updateBookingStatus(booking.id, 'cancelled');
          console.log(`Auto-cancelled expired booking ID ${booking.id} (date: ${booking.bookingDate})`);
        }
        
        return expiredBookings.length;
      }
      return 0;
    } catch (error) {
      console.error('Error auto-cancelling expired bookings:', error);
      return 0;
    }
  };

  // Admin Bookings Management Routes
  app.get("/api/admin/bookings", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }

      // Auto-cancel expired pending bookings before fetching data
      const cancelledCount = await autoCancelExpiredBookings();
      if (cancelledCount > 0) {
        console.log(`Auto-cancelled ${cancelledCount} expired pending bookings`);
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const sortBy = req.query.sortBy as string || 'date_desc';
      
      console.log(`Admin bookings request - page: ${page}, limit: ${limit}, status: ${status || 'all'}, sortBy: ${sortBy}`);
      
      // Get bookings with status filtering and sorting
      const result = await storage.getAdminBookings({ page, limit, status, search, sortBy });
      
      console.log(`Found ${result.bookings.length} bookings (total: ${result.total})`);
      
      // Enhance with user and facility information
      const enhancedBookings = await Promise.all(
        result.bookings.map(async (booking) => {
          try {
            // Get user info
            const user = await storage.getUserById(booking.userId);
            
            // Get ground info
            const ground = await storage.getGroundById(booking.groundId);
            
            return {
              ...booking,
              userName: user?.username || 'Unknown User',
              userEmail: user?.email || 'No email',
              userPhone: user?.phone || '',
              facilityName: ground?.name || `Ground ${booking.groundId}`,
              facilityId: booking.groundId,
              sportName: ground?.sportName || 'Unknown Sport'
            };
          } catch (error) {
            console.error(`Error enhancing booking ${booking.id}:`, error);
            return {
              ...booking,
              userName: 'Unknown User',
              userEmail: 'No email',
              userPhone: '',
              facilityName: `Ground ${booking.groundId}`,
              facilityId: booking.groundId,
              sportName: 'Unknown Sport'
            };
          }
        })
      );
      
      res.json({
        bookings: enhancedBookings,
        total: result.total
      });
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/bookings/:id/slots", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }
      
      const bookingId = parseInt(req.params.id);
      const slots = await storage.getBookingSlots(bookingId);
      res.json(slots);
    } catch (error) {
      console.error("Error fetching booking slots:", error);
      res.status(500).json({ message: "Failed to fetch booking slots" });
    }
  });

  app.patch("/api/admin/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }
      
      const bookingId = parseInt(req.params.id);
      const { bookingStatus } = req.body;
      
      // Get current booking to check status
      const currentBooking = await storage.getBookingById(bookingId);
      if (!currentBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if booking is already in the target status
      if (currentBooking.status === bookingStatus) {
        return res.status(400).json({ 
          message: `Booking is already ${bookingStatus}`,
          currentStatus: currentBooking.status,
          paymentStatus: currentBooking.paymentStatus
        });
      }
      
      // Validate status transition
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['completed', 'cancelled'],
        'completed': [], // No transitions from completed
        'cancelled': [] // No transitions from cancelled
      };
      
      const allowedStatuses = validTransitions[currentBooking.status as keyof typeof validTransitions] || [];
      if (!allowedStatuses.includes(bookingStatus)) {
        return res.status(400).json({ 
          message: `Cannot change status from ${currentBooking.status} to ${bookingStatus}`,
          allowedStatuses
        });
      }
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, bookingStatus);
      res.json({
        ...updatedBooking,
        message: `Booking status updated from ${currentBooking.status} to ${bookingStatus}`
      });
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Manual endpoint to cancel expired bookings (for admin use)
  app.post("/api/admin/cancel-expired-bookings", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      const expiredBookings = await storage.getExpiredPendingBookings(today);
      let cancelledCount = 0;
      
      if (expiredBookings.length > 0) {
        console.log(`Found ${expiredBookings.length} expired pending bookings to cancel`);
        
        for (const booking of expiredBookings) {
          await storage.updateBookingStatus(booking.id, 'cancelled');
          
          // Create notification for cancelled booking
          await storage.createNotification({
            userId: booking.userId,
            bookingId: booking.id,
            type: 'booking_auto_cancelled',
            title: 'Booking Auto-Cancelled',
            message: `Your booking for ${booking.bookingDate} was automatically cancelled as the booking date has passed and payment was not completed.`,
            read: false
          });
          
          cancelledCount++;
          console.log(`Cancelled expired booking ID ${booking.id} and sent notification`);
        }
      }
      
      res.json({
        message: `Successfully cancelled ${cancelledCount} expired pending bookings and sent notifications`,
        cancelledCount,
        totalChecked: expiredBookings.length
      });
    } catch (error) {
      console.error("Error manually cancelling expired bookings:", error);
      res.status(500).json({ message: "Failed to cancel expired bookings" });
    }
  });

  // Notification System Routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const unreadOnly = req.query.unread === 'true';
      
      const notifications = await storage.getUserNotifications(userId, unreadOnly);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Send booking reminders (automated task)
  app.post("/api/admin/send-reminders", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }

      const bookingsNeedingReminders = await storage.getBookingsNeedingReminders();
      let remindersSent = 0;

      for (const booking of bookingsNeedingReminders) {
        // Check if reminder already sent
        const alreadySent = await storage.hasReminderBeenSent(booking.id);
        if (!alreadySent) {
          // Create notification
          await storage.createNotification({
            userId: booking.userId,
            bookingId: booking.id,
            type: 'booking_reminder',
            title: 'Booking Reminder',
            message: `Don't forget your booking tomorrow at ${booking.facilityName} (${booking.sportName}) from ${booking.startTime} to ${booking.endTime}. ${booking.participantCount} participants.`,
            read: false
          });
          
          remindersSent++;
          console.log(`Sent reminder for booking ${booking.id} to user ${booking.userId}`);
        }
      }

      res.json({
        message: `Sent ${remindersSent} booking reminders`,
        remindersSent,
        totalBookingsChecked: bookingsNeedingReminders.length
      });
    } catch (error) {
      console.error("Error sending booking reminders:", error);
      res.status(500).json({ message: "Failed to send booking reminders" });
    }
  });

  // User booking management routes
  app.get("/api/user/upcoming-bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const upcomingBookings = await storage.getUserUpcomingBookings(userId);
      res.json(upcomingBookings);
    } catch (error) {
      console.error("Error fetching upcoming bookings:", error);
      res.status(500).json({ message: "Failed to fetch upcoming bookings" });
    }
  });



  // Cancel booking with policy
  app.post("/api/user/cancel-booking/:id", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const userId = req.user.id;
      const { reason } = req.body;

      // Get booking details
      const booking = await storage.getBookingDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!['confirmed', 'pending'].includes(booking.status)) {
        return res.status(400).json({ message: "Cannot cancel this booking" });
      }

      // Check cancellation policy (24 hours before)
      const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
      const now = new Date();
      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      let refundAmount = 0;
      let cancellationFee = 0;
      
      if (hoursUntilBooking >= 24) {
        // Full refund if cancelled 24+ hours before
        refundAmount = parseFloat(booking.paidAmount || '0');
      } else if (hoursUntilBooking >= 2) {
        // 50% refund if cancelled 2-24 hours before
        const totalPaid = parseFloat(booking.paidAmount || '0');
        cancellationFee = totalPaid * 0.5;
        refundAmount = totalPaid - cancellationFee;
      } else {
        // No refund if cancelled less than 2 hours before
        cancellationFee = parseFloat(booking.paidAmount || '0');
      }

      // Update booking status
      await storage.updateBookingStatus(bookingId, 'cancelled');

      // Create notification
      await storage.createNotification({
        userId: userId,
        bookingId: bookingId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Your booking at ${booking.facilityName} on ${booking.bookingDate} has been cancelled. ${refundAmount > 0 ? `Refund amount: ₹${refundAmount}` : 'No refund applicable.'}`,
        read: false
      });

      res.json({
        message: "Booking cancelled successfully",
        refundAmount,
        cancellationFee,
        hoursUntilBooking: Math.round(hoursUntilBooking * 100) / 100
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Booking Queue Routes
  app.post("/api/queue/join", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const queueData = { ...req.body, userId };
      const queueEntry = await storage.addToQueue(queueData);
      
      res.json({
        success: true,
        queueEntry,
        message: `Added to waiting list (Position #${queueEntry.priority})`
      });
    } catch (error) {
      console.error("Error joining queue:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to join queue" 
      });
    }
  });

  app.get("/api/queue/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const queueRequests = await storage.getUserQueueRequests(userId);
      res.json(queueRequests);
    } catch (error) {
      console.error("Error fetching user queue requests:", error);
      res.status(500).json({ error: "Failed to fetch queue requests" });
    }
  });

  app.post("/api/queue/:queueId/book", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const queueId = parseInt(req.params.queueId);
      const booking = await storage.convertQueueToBooking(queueId);
      
      res.json({
        success: true,
        booking,
        message: "Booking confirmed from waiting list!"
      });
    } catch (error) {
      console.error("Error converting queue to booking:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to convert queue to booking" 
      });
    }
  });

  app.delete("/api/queue/:queueId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const queueId = parseInt(req.params.queueId);
      await storage.removeFromQueue(queueId);
      
      res.json({
        success: true,
        message: "Removed from waiting list"
      });
    } catch (error) {
      console.error("Error removing from queue:", error);
      res.status(500).json({ error: "Failed to remove from queue" });
    }
  });

  // Admin queue management
  app.get("/api/admin/queue", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }

      const { sportId, groundId, date, startTime, endTime } = req.query;
      
      if (sportId && groundId && date && startTime && endTime) {
        const queueEntries = await storage.getQueueBySlot(
          parseInt(sportId as string),
          parseInt(groundId as string),
          date as string,
          startTime as string,
          endTime as string
        );
        res.json(queueEntries);
      } else {
        // Return all active queue entries - implement later
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching queue entries:", error);
      res.status(500).json({ error: "Failed to fetch queue entries" });
    }
  });

  app.post("/api/admin/queue/:queueId/offer", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Admin or Manager access required" });
      }

      const queueId = parseInt(req.params.queueId);
      await storage.offerSlotToNextInQueue(queueId);
      
      res.json({
        success: true,
        message: "Slot offered to next in queue"
      });
    } catch (error) {
      console.error("Error offering slot:", error);
      res.status(500).json({ error: "Failed to offer slot" });
    }
  });

  // Receipt generation routes
  app.post("/api/receipts/generate", isAuthenticated, async (req, res) => {
    try {
      const { paymentId, sendSMS = false, sendEmail = false } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({ message: "Payment ID is required" });
      }
      
      // Verify payment exists and user has access
      const payment = await storage.getPaymentById(parseInt(paymentId));
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const booking = await storage.getBookingDetails(payment.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Associated booking not found" });
      }
      
      // Check if user owns the booking or is admin
      if (booking.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const receiptResult = await generateAndSendReceipt(parseInt(paymentId), sendSMS, sendEmail);
      res.json({
        success: true,
        receipt: receiptResult,
        message: "Receipt generated successfully"
      });
    } catch (error) {
      console.error("Error generating receipt:", error);
      res.status(500).json({ message: "Failed to generate receipt" });
    }
  });

  app.get("/api/receipts/:paymentId/preview", isAuthenticated, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.paymentId);
      
      // Verify payment exists and user has access
      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const booking = await storage.getBookingDetails(payment.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Associated booking not found" });
      }
      
      // Check if user owns the booking or is admin
      if (booking.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const receiptData = await generateReceiptData(paymentId);
      const htmlContent = ReceiptGenerator.generateReceiptHTML(receiptData);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (error) {
      console.error("Error generating receipt preview:", error);
      res.status(500).json({ message: "Failed to generate receipt preview" });
    }
  });

  // Get payment history for a booking
  app.get("/api/bookings/:bookingId/payment-history", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // Verify booking exists and user has access
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get all payments for this booking
      const payments = await storage.getPayments(bookingId);
      
      // Get booking details for context
      const bookingDetails = await storage.getBookingDetails(bookingId);
      
      // Calculate correct amounts considering discount
      const originalTotalAmount = Number(bookingDetails?.totalAmount || 0);
      const discountAmount = Number(bookingDetails?.discountAmount || 0);
      const paidAmount = Number(bookingDetails?.paidAmount || 0);
      
      // Total amount before discount (original booking amount)
      const totalAmountBeforeDiscount = originalTotalAmount + discountAmount;
      
      // Net amount after discount (amount customer needs to pay)
      const netAmount = originalTotalAmount;
      
      // Balance due (net amount - paid amount)
      const balanceDue = Math.max(0, netAmount - paidAmount);

      res.json({
        bookingId,
        bookingDetails: {
          facilityName: bookingDetails?.facilityName || 'Sports Facility',
          sportName: bookingDetails?.facilityType || 'Sport',
          totalAmount: totalAmountBeforeDiscount, // Original amount before discount
          discountAmount: discountAmount,
          paidAmount: paidAmount,
          netAmount: netAmount, // Amount after discount
          balanceDue: balanceDue, // Remaining balance
          paymentStatus: bookingDetails?.paymentStatus || 'pending'
        },
        payments
      });
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  app.get("/api/receipts/:paymentId/pdf", isAuthenticated, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.paymentId);
      
      // Verify payment exists and user has access
      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const booking = await storage.getBookingDetails(payment.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Associated booking not found" });
      }
      
      // Check if user owns the booking or is admin
      if (booking.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const receiptData = await generateReceiptData(paymentId);
      const pdfBuffer = ReceiptGenerator.generateReceiptPDF(receiptData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptData.receiptId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating receipt PDF:", error);
      res.status(500).json({ message: "Failed to generate receipt PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}