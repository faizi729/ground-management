import { db } from './db';
import { facilities, users } from '@shared/schema';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Seed demo users
    await db.insert(users).values([
      {
        id: 'demo-client-001',
        email: 'client@demo.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'client',
        phone: '+1234567890',
        notificationPreferences: {
          sms: true,
          email: true,
          marketing: false,
        },
      },
      {
        id: 'demo-admin-001',
        email: 'admin@demo.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+1234567891',
        notificationPreferences: {
          sms: true,
          email: true,
          marketing: false,
        },
      },
    ]).onConflictDoNothing();

    // Seed facilities
    await db.insert(facilities).values([
      {
        name: 'Badminton Court 1',
        description: 'Professional indoor badminton court with premium flooring and lighting',
        type: 'badminton',
        capacity: 4,
        hourlyRate: '25.00',
        monthlyRate: '600.00',
        yearlyRate: '6000.00',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
        amenities: ['Air Conditioning', 'Premium Flooring', 'Professional Net', 'Racket Rental'],
        operatingHours: {
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          wednesday: { open: '06:00', close: '22:00' },
          thursday: { open: '06:00', close: '22:00' },
          friday: { open: '06:00', close: '22:00' },
          saturday: { open: '06:00', close: '22:00' },
          sunday: { open: '06:00', close: '22:00' },
        },
      },
      {
        name: 'Soccer Field',
        description: 'Full-size outdoor soccer field with natural grass',
        type: 'soccer',
        capacity: 22,
        hourlyRate: '100.00',
        monthlyRate: '2400.00',
        yearlyRate: '24000.00',
        imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500',
        amenities: ['Natural Grass', 'Floodlights', 'Goal Posts', 'Changing Rooms'],
        operatingHours: {
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          wednesday: { open: '06:00', close: '22:00' },
          thursday: { open: '06:00', close: '22:00' },
          friday: { open: '06:00', close: '22:00' },
          saturday: { open: '06:00', close: '22:00' },
          sunday: { open: '06:00', close: '22:00' },
        },
      },
      {
        name: 'Basketball Court',
        description: 'Indoor basketball court with professional standards',
        type: 'basketball',
        capacity: 10,
        hourlyRate: '50.00',
        monthlyRate: '1200.00',
        yearlyRate: '12000.00',
        imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500',
        amenities: ['Wooden Floor', 'Professional Hoops', 'Air Conditioning', 'Sound System'],
        operatingHours: {
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          wednesday: { open: '06:00', close: '22:00' },
          thursday: { open: '06:00', close: '22:00' },
          friday: { open: '06:00', close: '22:00' },
          saturday: { open: '06:00', close: '22:00' },
          sunday: { open: '06:00', close: '22:00' },
        },
      },
      {
        name: 'Swimming Pool',
        description: 'Olympic-size swimming pool with lane dividers',
        type: 'swimming',
        capacity: 50,
        hourlyRate: '15.00',
        monthlyRate: '300.00',
        yearlyRate: '3000.00',
        imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=500',
        amenities: ['Olympic Size', 'Lane Dividers', 'Lifeguard', 'Changing Rooms', 'Lockers'],
        operatingHours: {
          monday: { open: '05:00', close: '21:00' },
          tuesday: { open: '05:00', close: '21:00' },
          wednesday: { open: '05:00', close: '21:00' },
          thursday: { open: '05:00', close: '21:00' },
          friday: { open: '05:00', close: '21:00' },
          saturday: { open: '06:00', close: '20:00' },
          sunday: { open: '06:00', close: '20:00' },
        },
      },
      {
        name: 'Tennis Court',
        description: 'Hard court tennis facility with professional net',
        type: 'tennis',
        capacity: 4,
        hourlyRate: '40.00',
        monthlyRate: '960.00',
        yearlyRate: '9600.00',
        imageUrl: 'https://images.unsplash.com/photo-1595435742656-5773e8473e3c?w=500',
        amenities: ['Hard Court', 'Professional Net', 'Floodlights', 'Ball Machine'],
        operatingHours: {
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          wednesday: { open: '06:00', close: '22:00' },
          thursday: { open: '06:00', close: '22:00' },
          friday: { open: '06:00', close: '22:00' },
          saturday: { open: '06:00', close: '22:00' },
          sunday: { open: '06:00', close: '22:00' },
        },
      },
      {
        name: 'Cricket Ground',
        description: 'Full-size cricket ground with professional pitch',
        type: 'cricket',
        capacity: 30,
        hourlyRate: '150.00',
        monthlyRate: '3600.00',
        yearlyRate: '36000.00',
        imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500',
        amenities: ['Natural Pitch', 'Boundary', 'Pavilion', 'Equipment Storage'],
        operatingHours: {
          monday: { open: '06:00', close: '18:00' },
          tuesday: { open: '06:00', close: '18:00' },
          wednesday: { open: '06:00', close: '18:00' },
          thursday: { open: '06:00', close: '18:00' },
          friday: { open: '06:00', close: '18:00' },
          saturday: { open: '06:00', close: '18:00' },
          sunday: { open: '06:00', close: '18:00' },
        },
      },
    ]).onConflictDoNothing();

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => process.exit(0));
}

export { seed };