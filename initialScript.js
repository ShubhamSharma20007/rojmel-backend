const mongoose = require('mongoose');
const FinancialYear = require('./models/FinancialYear'); // Adjust paths as needed
const Subscription = require('./models/Subscription');
const SubscriptionUser = require('./models/SubscriptionUser');
const User = require('./models/User');
require('dotenv').config();

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // 1. Add entry to the FinancialYear table
    const financialYear = await FinancialYear.create({
      fy_start_date: new Date('2024-04-01'),
      fy_end_date: new Date('2025-03-31'),
      financial_tag: 'FY 2024-25',
    });
    console.log('Financial Year Created:', financialYear);

    // 2. Add a subscription
    const subscription = await Subscription.create({
      amount: 5000,
      description: 'Premium annual plan for FY 2024-25',
      plan_name: 'Premium Plan',
      financial_year_id: financialYear._id,
      plan_id: 'plan_xyz123', // Example Razorpay Plan ID
    });
    console.log('Subscription Created:', subscription);

    // 3. Add a user
    const user = await User.create({
      brc_full_name: 'John Doe',
      school_name: 'ABC High School',
      school_dice_code: '123456',
      rojmel_name: 'Rojmel ABC',
      cluster_name: 'Cluster 1',
      block_name: 'Block A',
      bank_name: 'Bank of XYZ',
      bank_branch_name: 'Main Branch',
      bank_account_no: '9876543210',
      address: '123 Main Street',
      sub_division: 'Sub-Division 1',
      district: 'District X',
      pincode: '123456',
      mobile_no: '9876543210',
      business_email: 'johndoe@example.com',
      password: '$2b$10$iZf40o.Le6KyEitd3fD/SO4x95lrZepvgp69UHioJwNOcLHdwXgiy', // Ensure you hash the password in a real application
      current_subscription_id: subscription._id,
    });
    console.log('User Created:', user);

    // 4. Add data to the SubscriptionUser table
    const subscriptionUser = await SubscriptionUser.create({
      user_id: user._id,
      subscription_id: subscription._id,
      payment_id: 'pay_xyz123', // Example Razorpay Payment ID
      status: 'completed', // Set status based on actual payment status
    });
    console.log('SubscriptionUser Created:', subscriptionUser);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
}

main();
