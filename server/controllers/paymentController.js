import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
export const createOrder = async (req, res) => {
  try {
    const { amount, credits } = req.body;

    if (!amount || !credits) {
      return res.status(400).json({ message: 'Amount and credits are required' });
    }

    const options = {
      amount: amount * 100, // Convert to paisa
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user.userId,
        credits: credits,
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

// Verify Razorpay payment signature and add credits
export const verifyPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature, credits } = req.body;

    if (!order_id || !payment_id || !signature || !credits) {
      return res.status(400).json({ message: 'All payment fields are required' });
    }

    // Verify signature using HMAC SHA256
    // Never trust the client's "payment succeeded" claim alone
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Signature is valid — add credits to user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.credits += credits;
    await user.save();

    res.status(200).json({
      message: 'Payment verified and credits added successfully',
      credits: user.credits,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
};
