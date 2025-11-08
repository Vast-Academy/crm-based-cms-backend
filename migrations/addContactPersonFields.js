const mongoose = require('mongoose');
const Customer = require('../models/customerModel');
require('dotenv').config();

/**
 * Migration Script: Add Contact Person Fields to Existing Customers
 *
 * This script adds the following fields to all existing customers:
 * - contactPersonName: empty string
 * - contactPersonPhone: empty string
 * - showOwnerDetailsToTechnician: false (default)
 *
 * Run this script once after deploying the new customer model.
 */

async function migrateCustomers() {
  try {
    console.log('Starting migration: Adding contact person fields to existing customers...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all customers that don't have contact person fields
    const customersWithoutContactPerson = await Customer.find({
      $or: [
        { contactPersonName: { $exists: false } },
        { contactPersonPhone: { $exists: false } },
        { showOwnerDetailsToTechnician: { $exists: false } }
      ]
    });

    console.log(`Found ${customersWithoutContactPerson.length} customers to migrate`);

    if (customersWithoutContactPerson.length === 0) {
      console.log('No customers need migration. All customers already have contact person fields.');
      await mongoose.connection.close();
      return;
    }

    // Update all customers with empty contact person fields
    const result = await Customer.updateMany(
      {
        $or: [
          { contactPersonName: { $exists: false } },
          { contactPersonPhone: { $exists: false } },
          { showOwnerDetailsToTechnician: { $exists: false } }
        ]
      },
      {
        $set: {
          contactPersonName: '',
          contactPersonPhone: '',
          showOwnerDetailsToTechnician: false
        }
      }
    );

    console.log(`Migration completed successfully!`);
    console.log(`Modified ${result.modifiedCount} customers`);
    console.log(`Matched ${result.matchedCount} customers`);

    // Verify the migration
    const verifyCount = await Customer.countDocuments({
      contactPersonName: { $exists: true },
      contactPersonPhone: { $exists: true },
      showOwnerDetailsToTechnician: { $exists: true }
    });

    console.log(`Verification: ${verifyCount} customers now have contact person fields`);

    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    console.log('Migration completed!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateCustomers();
