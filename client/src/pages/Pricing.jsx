import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../App';
import API from '../utils/api';

const plans = [
  {
    name: 'Free',
    badge: 'Default',
    badgeColor: 'bg-gray-100 text-gray-600',
    price: 0,
    credits: 150,
    desc: 'Perfect for beginners starting interview preparation.',
    features: [
      '150 AI Interview Credits',
      'Basic Performance Report',
      'Voice Interview Access',
      'Limited History Tracking',
    ],
    highlight: true,
    disabled: true,
  },
  {
    name: 'Starter Pack',
    badge: 'Trending',
    badgeColor: 'bg-blue-100 text-blue-600',
    price: 99,
    credits: 600,
    desc: 'Great for focused practice and skill improvement.',
    features: [
      '600 AI Interview Credits',
      'Detailed Feedback',
      'Performance Analytics',
      'Full Interview History',
    ],
    highlight: false,
    disabled: false,
  },
  {
    name: 'Pro Pack',
    badge: 'Best Value',
    badgeColor: 'bg-emerald-100 text-emerald-600',
    price: 499,
    credits: 3500,
    desc: 'Best value for serious job preparation.',
    features: [
      '3500 AI Interview Credits',
      'Advanced AI Feedback',
      'Skill Trend Analysis',
      'Priority AI Processing',
    ],
    highlight: false,
    disabled: false,
  },
];

export default function Pricing() {
  const { updateCredits } = useAuth();
  const navigate = useNavigate();
  const [processingPlan, setProcessingPlan] = useState(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSelectPlan = async (plan) => {
    if (plan.disabled || plan.price === 0) return;

    setProcessingPlan(plan.name);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load Razorpay. Check your connection.');
        setProcessingPlan(null);
        return;
      }

      // Create order
      const { data } = await API.post('/payment/create-order', {
        amount: plan.price,
        credits: plan.credits,
      });

      // Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxxxx',
        amount: data.amount,
        currency: data.currency,
        name: 'InterviewIQ.AI',
        description: `${plan.name} — ${plan.credits} Credits`,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            const verifyRes = await API.post('/payment/verify', {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              credits: plan.credits,
            });

            updateCredits(verifyRes.data.credits);

            // Show success message then redirect
            setProcessingPlan('success');
            setTimeout(() => {
              navigate('/');
            }, 3000);
          } catch (err) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        theme: { color: '#10b981' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      alert('Failed to create payment order.');
    } finally {
      if (processingPlan !== 'success') {
        setProcessingPlan(null);
      }
    }
  };

  if (processingPlan === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-500">Credits added. Redirecting to Home...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-900 transition-colors"
            id="pricing-back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
          <p className="text-gray-500">Flexible pricing to match your interview preparation goals.</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white rounded-2xl p-7 shadow-sm relative flex flex-col ${
                plan.highlight
                  ? 'border-2 border-emerald-300'
                  : 'border border-gray-100 hover:border-emerald-200'
              } transition-colors`}
            >
              {/* Badge */}
              {plan.badge && (
                <span className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full ${plan.badgeColor}`}>
                  {plan.badge}
                </span>
              )}

              <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
              <p className="text-2xl font-bold text-emerald-500 mb-0.5">₹{plan.price}</p>
              <p className="text-sm text-gray-500 mb-3">{plan.credits} Credits</p>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">{plan.desc}</p>

              <ul className="space-y-2.5 mb-6 flex-grow">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {!plan.disabled ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={processingPlan === plan.name}
                  className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-emerald-400 hover:text-emerald-600 transition-colors disabled:opacity-50 mt-auto"
                  id={`pricing-select-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {processingPlan === plan.name ? 'Processing...' : 'Select Plan'}
                </motion.button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 rounded-xl border-2 border-emerald-100 bg-emerald-50 text-emerald-600 font-semibold cursor-not-allowed mt-auto"
                  id={`pricing-current-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  Current Plan
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
