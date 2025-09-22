# Booking Status Logic Definition

## Pending Bookings Definition

A booking is considered "PENDING" when it meets this criteria:

### **Payment Status = "pending" OR "partial"**
- Confirmed bookings with zero payment (`paidAmount = 0`)
- Confirmed bookings with partial payment (`paidAmount < totalAmount`)
- **Business Logic**: Customer needs to complete payment

### **No Approval Delays:**
- All new bookings are automatically confirmed (`status = "confirmed"`)
- Users can pay immediately without waiting for admin approval
- Admin reviews bookings retroactively for quality control

### 3. **Future Confirmed Bookings with Payment Issues**
- `status = "confirmed"` AND `bookingDate >= today` AND `paymentStatus != "completed"`
- **Business Logic**: Upcoming bookings that still need payment resolution

## Clear Status Transitions

### Booking Status Flow:
```
pending → confirmed → completed (or cancelled at any point)
```

### Payment Status Flow:
```
pending → partial → completed (or failed/refunded)
```

## Pending Bookings Query Logic:

```sql
SELECT * FROM bookings WHERE (
  -- Only confirmed bookings with outstanding payments (instant booking flow)
  status = 'confirmed' AND paymentStatus IN ('pending', 'partial')
);
```

## Admin Dashboard "Pending" Count:
Should show total count of bookings requiring attention (approval OR payment collection)

## User "Pending Payments" Page:
Should show only confirmed bookings with outstanding payments (`paymentStatus IN ('pending', 'partial')`)

## Business Rules (Instant Booking):
1. **New Booking**: `status = 'confirmed'`, `paymentStatus = 'pending'` (instant confirmation)
2. **Payment Received**: `paymentStatus` updates based on amount paid
3. **Service Delivered**: `status = 'completed'` (only if fully paid)
4. **Admin Review**: Retroactive oversight, can cancel if needed