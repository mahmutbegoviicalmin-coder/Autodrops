import React from 'react';

export function RefundPolicy() {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-6 lg:p-10 card-gradient relative overflow-hidden">
          <div className="absolute right-4 top-2 md:top-4">
            <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 animate-pulse">
              Last Updated: August 2025
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 text-center mt-10 md:mt-0">
            Refund & Cancellation Policy – AutoDrops
          </h1>

          <div className="prose lg:prose-lg dark:prose-invert max-w-none prose-headings:text-white prose-a:text-blue-400">
            <h2>Introduction</h2>
            <p>
              Thank you for choosing AutoDrops. We prioritize customer satisfaction and strive to deliver excellence
              in all our offerings. This policy explains how refunds and cancellations work so expectations are clear.
            </p>

            <h2>Money‑Back Guarantee</h2>
            <p>
              If you subscribe to a paid plan and AutoDrops doesn’t meet your expectations, you may request a
              <strong> full refund within 30 days</strong> of your initial purchase. This guarantee applies only to your
              most recent payment.
            </p>

            <h2>Refunds</h2>
            <p>
              Approved refunds are typically issued within <strong>24–48 hours</strong>. Depending on your card provider,
              it may take <strong>5–10 business days</strong> for funds to appear on your statement.
            </p>

            <h2>Cancellation</h2>
            <p>
              You can cancel your subscription at any time from account settings or by contacting our support team.
              After cancellation, you retain access until the end of your current billing period unless a refund is granted.
            </p>

            <h2>Payment Declines & Access</h2>
            <p>
              If a payment is declined (e.g., insufficient funds, expired card), your access to AutoDrops may be suspended
              until a successful payment occurs. AutoDrops is not responsible for any fees your bank may charge due to declines.
            </p>

            <h2>Contact Us</h2>
            <p>
              For questions about this policy, reach us at <a href="mailto:support@autodrops.io">support@autodrops.io</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RefundPolicy;
