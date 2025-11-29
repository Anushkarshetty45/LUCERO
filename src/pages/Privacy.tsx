import { Link } from 'react-router-dom'
import luceroLogo from '../assets/lucero-logo.png'
import './LegalPages.css'

export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <div className="legal-logo-text">LUCERO</div>
        <Link to="/" className="back-home">← Back to Home</Link>
      </div>

      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to LUCERO ("we," "us," or "our"). We are committed to protecting your personal information
            and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you use our learning platform.
          </p>
          <p>
            Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy,
            please do not access the platform.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>

          <h3>2.1 Personal Information You Provide</h3>
          <p>We collect personal information that you voluntarily provide when you:</p>
          <ul>
            <li><strong>Register for an account:</strong> First name, last name, email address, password</li>
            <li><strong>Complete your profile:</strong> Profile picture, bio, educational background, interests</li>
            <li><strong>Make a purchase:</strong> Billing information, payment method details</li>
            <li><strong>Contact us:</strong> Email address, name, message content</li>
            <li><strong>Participate in surveys:</strong> Responses and feedback</li>
            <li><strong>Post content:</strong> Comments, forum posts, course submissions</li>
          </ul>

          <h3>2.2 Information Automatically Collected</h3>
          <p>When you access LUCERO, we automatically collect certain information, including:</p>
          <ul>
            <li><strong>Device Information:</strong> IP address, browser type, operating system, device type</li>
            <li><strong>Usage Data:</strong> Pages visited, time spent, courses accessed, learning progress</li>
            <li><strong>Cookies and Tracking:</strong> Session data, preferences, analytics information</li>
            <li><strong>Location Data:</strong> General geographic location based on IP address</li>
          </ul>

          <h3>2.3 Information from Third Parties</h3>
          <p>We may receive information from third-party services:</p>
          <ul>
            <li><strong>OAuth Providers:</strong> When you sign in with Google or GitHub, we receive your name,
              email, and profile picture</li>
            <li><strong>Payment Processors:</strong> Transaction details and payment status</li>
            <li><strong>Analytics Services:</strong> Aggregated usage statistics</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use your personal information for the following purposes:</p>

          <h3>3.1 Providing Services</h3>
          <ul>
            <li>Create and manage your account</li>
            <li>Deliver educational content and courses</li>
            <li>Track your learning progress</li>
            <li>Process payments and transactions</li>
            <li>Provide customer support</li>
            <li>Send service-related communications</li>
          </ul>

          <h3>3.2 Improving Our Platform</h3>
          <ul>
            <li>Analyze usage patterns and trends</li>
            <li>Conduct research and development</li>
            <li>Optimize user experience</li>
            <li>Test new features</li>
            <li>Fix bugs and technical issues</li>
          </ul>

          <h3>3.3 Marketing and Communications</h3>
          <ul>
            <li>Send promotional emails (with your consent)</li>
            <li>Notify you of new features and courses</li>
            <li>Provide personalized recommendations</li>
            <li>Conduct surveys and gather feedback</li>
          </ul>

          <h3>3.4 Security and Legal Compliance</h3>
          <ul>
            <li>Prevent fraud and abuse</li>
            <li>Enforce our Terms of Use</li>
            <li>Comply with legal obligations</li>
            <li>Protect our rights and property</li>
            <li>Respond to legal requests</li>
          </ul>
        </section>

        <section>
          <h2>4. How We Share Your Information</h2>
          <p>We may share your information in the following circumstances:</p>

          <h3>4.1 Service Providers</h3>
          <p>
            We share information with third-party vendors who perform services on our behalf:
          </p>
          <ul>
            <li><strong>Supabase:</strong> Database and authentication services</li>
            <li><strong>Payment Processors:</strong> Stripe, PayPal for payment processing</li>
            <li><strong>Email Services:</strong> SendGrid, Mailchimp for communications</li>
            <li><strong>Analytics:</strong> Google Analytics for usage analysis</li>
            <li><strong>Cloud Hosting:</strong> AWS, Vercel for infrastructure</li>
          </ul>

          <h3>4.2 Business Transfers</h3>
          <p>
            If we are involved in a merger, acquisition, or sale of assets, your information may be transferred
            as part of that transaction.
          </p>

          <h3>4.3 Legal Requirements</h3>
          <p>We may disclose your information if required to do so by law or in response to:</p>
          <ul>
            <li>Court orders or legal processes</li>
            <li>Government requests</li>
            <li>Investigations of potential violations</li>
            <li>Protection against legal liability</li>
          </ul>

          <h3>4.4 With Your Consent</h3>
          <p>
            We may share your information for any other purpose with your explicit consent.
          </p>
        </section>

        <section>
          <h2>5. Cookies and Tracking Technologies</h2>

          <h3>5.1 What Are Cookies?</h3>
          <p>
            Cookies are small data files placed on your device. We use cookies and similar tracking technologies
            to track activity on our platform and store certain information.
          </p>

          <h3>5.2 Types of Cookies We Use</h3>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for the platform to function (authentication, security)</li>
            <li><strong>Performance Cookies:</strong> Help us understand how visitors use LUCERO</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Advertising Cookies:</strong> Deliver relevant advertisements (with consent)</li>
          </ul>

          <h3>5.3 Managing Cookies</h3>
          <p>
            You can control cookies through your browser settings. Note that disabling certain cookies may
            affect the functionality of LUCERO.
          </p>
        </section>

        <section>
          <h2>6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal
            information:
          </p>
          <ul>
            <li><strong>Encryption:</strong> Data in transit is encrypted using SSL/TLS</li>
            <li><strong>Access Controls:</strong> Limited access to personal data on a need-to-know basis</li>
            <li><strong>Password Protection:</strong> Passwords are hashed and never stored in plain text</li>
            <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
            <li><strong>Secure Infrastructure:</strong> Hosted on secure, compliant platforms</li>
          </ul>
          <p>
            However, no method of transmission over the internet is 100% secure. While we strive to protect
            your data, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>
            We retain your personal information only for as long as necessary to fulfill the purposes outlined
            in this Privacy Policy:
          </p>
          <ul>
            <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
            <li><strong>Inactive Accounts:</strong> Data may be deleted after [X] years of inactivity</li>
            <li><strong>Legal Requirements:</strong> Some data retained longer for legal compliance</li>
            <li><strong>Deleted Accounts:</strong> Data permanently deleted within 90 days of account deletion</li>
          </ul>
        </section>

        <section>
          <h2>8. Your Privacy Rights</h2>
          <p>Depending on your location, you may have the following rights:</p>

          <h3>8.1 Access and Portability</h3>
          <ul>
            <li>Request a copy of your personal information</li>
            <li>Export your data in a structured, machine-readable format</li>
          </ul>

          <h3>8.2 Correction and Update</h3>
          <ul>
            <li>Update your profile information at any time</li>
            <li>Request correction of inaccurate data</li>
          </ul>

          <h3>8.3 Deletion</h3>
          <ul>
            <li>Delete your account and associated data</li>
            <li>Request deletion of specific information</li>
          </ul>

          <h3>8.4 Opt-Out</h3>
          <ul>
            <li>Unsubscribe from marketing emails</li>
            <li>Opt out of data collection for analytics</li>
            <li>Disable cookies through browser settings</li>
          </ul>

          <h3>8.5 How to Exercise Your Rights</h3>
          <p>
            To exercise any of these rights, please contact us at privacy@lucero.com. We will respond to your
            request within 30 days.
          </p>
        </section>

        <section>
          <h2>9. Children's Privacy</h2>
          <p>
            LUCERO is not intended for children under 13 years of age. We do not knowingly collect personal
            information from children under 13. If you are a parent or guardian and believe your child has
            provided us with personal information, please contact us at privacy@lucero.com.
          </p>
          <p>
            Users between 13 and 18 must have parental consent to use LUCERO.
          </p>
        </section>

        <section>
          <h2>10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and maintained on servers located outside of your country.
            Data protection laws may differ from those in your jurisdiction.
          </p>
          <p>
            By using LUCERO, you consent to the transfer of your information to countries that may not have
            the same data protection laws as your country. We ensure appropriate safeguards are in place.
          </p>
        </section>

        <section>
          <h2>11. Third-Party Services</h2>
          <p>
            LUCERO may contain links to third-party websites and services (e.g., Google, GitHub). We are not
            responsible for the privacy practices of these third parties. We encourage you to review their
            privacy policies.
          </p>

          <h3>Third-Party Services We Use:</h3>
          <ul>
            <li><strong>Supabase:</strong> <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong>Google OAuth:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong>GitHub OAuth:</strong> <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
          </ul>
        </section>

        <section>
          <h2>12. California Privacy Rights (CCPA)</h2>
          <p>
            If you are a California resident, you have specific rights regarding your personal information:
          </p>
          <ul>
            <li>Right to know what personal information is collected</li>
            <li>Right to know if personal information is sold or disclosed</li>
            <li>Right to say no to the sale of personal information</li>
            <li>Right to delete personal information</li>
            <li>Right to non-discrimination for exercising your rights</li>
          </ul>
          <p>
            <strong>Note:</strong> LUCERO does not sell your personal information.
          </p>
        </section>

        <section>
          <h2>13. European Privacy Rights (GDPR)</h2>
          <p>
            If you are in the European Economic Area (EEA), you have the following rights:
          </p>
          <ul>
            <li>Right to access your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure ("right to be forgotten")</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to withdraw consent</li>
            <li>Right to lodge a complaint with a supervisory authority</li>
          </ul>

          <h3>Legal Basis for Processing</h3>
          <p>We process your data based on:</p>
          <ul>
            <li><strong>Consent:</strong> You have given explicit consent</li>
            <li><strong>Contract:</strong> Processing is necessary to provide our services</li>
            <li><strong>Legal Obligation:</strong> We must comply with legal requirements</li>
            <li><strong>Legitimate Interests:</strong> Processing is in our legitimate business interests</li>
          </ul>
        </section>

        <section>
          <h2>14. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by:
          </p>
          <ul>
            <li>Posting the new Privacy Policy on this page</li>
            <li>Updating the "Last updated" date</li>
            <li>Sending an email notification to registered users</li>
            <li>Displaying a prominent notice on our platform</li>
          </ul>
          <p>
            Your continued use of LUCERO after changes constitutes acceptance of the updated Privacy Policy.
          </p>
        </section>

        <section>
          <h2>15. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or your personal
            information, please contact us:
          </p>
          <ul>
            <li><strong>Privacy Email:</strong> privacy@lucero.com</li>
            <li><strong>Data Protection Officer:</strong> dpo@lucero.com</li>
            <li><strong>General Support:</strong> support@lucero.com</li>
            <li><strong>Mailing Address:</strong> [Your Business Address]</li>
          </ul>
          <p>
            We will respond to your inquiry within 30 days.
          </p>
        </section>

        <div className="acceptance-notice">
          <p>
            <strong>By using LUCERO, you acknowledge that you have read and understood this Privacy Policy
              and agree to the collection, use, and disclosure of your information as described herein.</strong>
          </p>
        </div>
      </div>
    </div>
  )
}