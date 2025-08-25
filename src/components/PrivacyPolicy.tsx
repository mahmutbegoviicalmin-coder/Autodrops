import React from 'react';

export function PrivacyPolicy() {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-6 lg:p-10 card-gradient relative overflow-hidden">
          <div className="absolute right-4 top-4">
            <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 animate-pulse">
              Last Updated: August 2025
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 text-center">
            Privacy Policy – AutoDrops (autodrops.io)
          </h1>

          <div className="prose lg:prose-lg dark:prose-invert max-w-none prose-headings:text-white prose-a:text-blue-400">
            <p>
              Welcome to AutoDrops ("we", "our", "us"). This Privacy Policy ("Policy") explains who we are, what personal data we collect about you, how we use it, and your data protection rights when you use autodrops.io (the "Site") and related services (the "Services").
            </p>

            <h2>1. Information We Collect</h2>
            <p>We may collect and process the following categories of personal information:</p>
            <h3>Usage & Device Data</h3>
            <p>Information about how you use the site (e.g., pages visited, click interactions, timestamps) and your device details (e.g., IP address, browser type, language settings, location). This may involve cookies or similar technologies.</p>
            <h3>Contact & Communication Data</h3>
            <p>Personal details you provide when you interact with us (e.g., name, email, company details, message content via contact forms or emails).</p>
            <h3>Payment & Subscription Data</h3>
            <p>Data related to your subscription, billing, and payment (processed via secure third-party processors; we do not store full payment card data).</p>
            <h3>Third-Party Integration Data</h3>
            <p>Any information you choose to connect from third-party platforms (e.g., Shopify, WooCommerce) into AutoDrops.</p>

            <h2>2. How & Why We Use Your Data</h2>
            <p>We process your personal data for these purposes:</p>
            <h3>Contractual Necessity</h3>
            <p>To provide our Services, manage your account, and process transactions.</p>
            <h3>Consent-Based Processing</h3>
            <p>For optional cookies, marketing communications, or newsletters (only processed if you explicitly consent).</p>
            <h3>Legitimate Interests</h3>
            <p>For purposes like customer support, improving functionality, analytics, fraud prevention, and service optimization.</p>
            <h3>Legal Obligations & Claims</h3>
            <p>To comply with laws, respond to lawful requests, or defend legal claims.</p>

            <h2>3. Sharing Your Data</h2>
            <p>Your personal data may be shared with:</p>
            <ul>
              <li>Internal teams (e.g., support, technical, marketing)</li>
              <li>Trusted third-party service providers (e.g., analytics tools, email platforms, payment processors)</li>
              <li>Professional advisors (e.g., legal or financial consultants), if necessary</li>
            </ul>

            <h2>4. International Data Transfers</h2>
            <p>If you’re in the EU, be aware that your data may be transferred outside the EEA (e.g., to providers in the US). We use appropriate safeguards—such as Standard Contractual Clauses or similar mechanisms—to ensure your data remains protected.</p>

            <h2>5. Data Retention</h2>
            <p>We keep your personal data only as long as necessary:</p>
            <ul>
              <li>Usage & Device Data: For the duration of your session.</li>
              <li>Contact Data: Until inquiries are resolved or for a reasonable follow-up period.</li>
              <li>Marketing Data: Up to ~12 months or until you unsubscribe.</li>
              <li>Legal or Billing Data: As required by law or in connection with potential claims.</li>
            </ul>
            <p>Specific retention for job applications will follow a separate notice if applicable.</p>

            <h2>6. Your Rights</h2>
            <p>Depending on where you live, you may have the following rights:</p>
            <ul>
              <li>Access: Request access to the personal data we hold.</li>
              <li>Rectification: Ask us to correct inaccurate or incomplete data.</li>
              <li>Erasure ("Right to be Forgotten"): Request deletion in certain circumstances.</li>
              <li>Restriction or Objection: To certain types of processing.</li>
              <li>Withdraw Consent: Where processing is based on consent (e.g., cookies, marketing).</li>
              <li>Complain to a Supervisory Authority: If you believe your data is being mishandled.</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:privacy@autodrops.io">privacy@autodrops.io</a>.</p>

            <h2>7. Cookies & Tracking</h2>
            <p>We use cookies and similar tracking technologies to enhance functionality, analyze usage, and personalize your experience. Some are essential for the site to function; others require your consent. You can manage cookie preferences at any time.</p>

            <h2>8. Third-Party Links & Services</h2>
            <p>Our Site may include links or integrations with third-party sites and services. These entities will have their own privacy policies, and we are not responsible for their practices. We encourage you to read their respective privacy notices.</p>

            <h2>9. Updates to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Changes will be posted at autodrops.io/legal/privacy with an updated “Last Updated” date. Continued use after changes signifies acceptance of the updated terms.</p>

            <h2>10. Contact Us</h2>
            <p>If you have questions or concerns about this Policy, contact us at:
              <br />
              <a href="mailto:privacy@autodrops.io">privacy@autodrops.io</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


