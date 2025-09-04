import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

async function seedAdminUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/seek';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'clay@lunawise.net' },
        { role: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const adminUser = new User({
      email: 'clay@lunawise.net',
      password: 'TempPass123!', // Should be changed after first login
      firstName: 'Clay',
      lastName: 'Rector',
      role: 'admin',
      emailVerified: true, // Skip email verification for seeded admin
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔐 Temporary Password: TempPass123!');
    console.log('⚠️  IMPORTANT: Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedAdminUser();