const Subscription = require("../models/Subscription");
const Razorpay = require("razorpay");
const SubscriptionUser = require("../models/SubscriptionUser");
const User = require("../models/User");

const razorpay = new Razorpay({
  key_id: "rzp_test_GLComtpgG1StCu", // Replace with your Razorpay Key ID
  key_secret: "xNHtyBpW4GrZisRQHQcDgUzA", // Replace with your Razorpay Key Secret
});
// Fetch Dashboard Data Service
exports.getSubscription = async (userId) => {
  // Find user by ID and exclude the password field
  const subscriptionUser = await SubscriptionUser.find({
    user_id: userId,
    status: 'completed'
  })
  let subscriptionIds = []
  subscriptionUser.forEach(sub => {
    subscriptionIds.push(sub.subscription_id)
  })
  
  const subscriptionList = await Subscription.find({
    _id: {
        $nin: subscriptionIds
    }
  });
  return subscriptionList;
};

exports.createOrder = async (user, data) => {
  let subscriptionData = await Subscription.findById(data.subscriptionId);
  const order = await razorpay.orders.create({
    amount: subscriptionData.amount * 100, // Convert INR to paisa (₹100 = 10000)
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
    payment_capture: 1, // Auto-capture payment
    notes: {
      user_id: user.id,
      subscriptionId: data.subscriptionId,
    },
  });
  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    user_id: user.id,
  };
};

exports.webhook = async (data) => {
  if (data.event == "order.paid") {
    if (data.payload.order.entity.status == "paid") {
      await SubscriptionUser.create({
        user_id: data.payload.order.entity.notes.user_id,
        subscription_id: data.payload.order.entity.notes.subscriptionId,
        status: "completed",
        payment_id: data.payload.order.entity.id,
        amount: data.payload.order.entity.amount / 100,
      });
      await User.findByIdAndUpdate(data.payload.order.entity.notes.user_id, {$set: { current_subscription_id:  data.payload.order.entity.notes.subscriptionId}})
    }
  }
  return;
};
