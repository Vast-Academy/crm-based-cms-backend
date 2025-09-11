// Script to fix duplicate key index issue
const mongoose = require('mongoose');
require('dotenv').config();

const fixIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/CRM-based-cms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('customers');

    // Drop the existing problematic index
    try {
      await collection.dropIndex('workOrders.orderId_1');
      console.log('✅ Dropped old index: workOrders.orderId_1');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️ Index workOrders.orderId_1 does not exist (already dropped)');
      } else {
        console.log('⚠️ Error dropping index:', err.message);
      }
    }

    // Create the new partial filter index
    try {
      await collection.createIndex(
        { 'workOrders.orderId': 1 },
        {
          unique: true,
          partialFilterExpression: {
            'workOrders.orderId': { $type: 'string' }
          },
          name: 'workOrders.orderId_partial_unique'
        }
      );
      console.log('✅ Created new partial filter index: workOrders.orderId_partial_unique');
    } catch (err) {
      console.log('⚠️ Error creating new index:', err.message);
    }

    // List all indexes to verify
    const indexes = await collection.listIndexes().toArray();
    console.log('\n📋 Current indexes on customers collection:');
    indexes.forEach(index => {
      console.log(`- ${index.name}:`, index.key);
      if (index.partialFilterExpression) {
        console.log(`  Partial filter:`, index.partialFilterExpression);
      }
    });

    console.log('\n🎉 Index fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing index:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the fix
fixIndex();