import { Link } from 'react-router-dom'
import luceroLogo from '../assets/lucero-logo.png'
import './LegalPages.css'

export default function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <div className="legal-logo-text">LUCERO</div>
        <Link to="/" className="back-home">← Back to Home</Link>
      </div>

      <div className="legal-content">
        <h1>Terms of Use</h1>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            Welcome to LUCERO. By accessing or using our platform, you agree to be bound by these Terms of Use
            and all applicable laws and regulations. If you do not agree with any of these terms, you are
            prohibited from using or accessing this site.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            LUCERO provides an online learning platform that enables users to access educational content,
            participate in courses, and track their learning progress. We reserve the right to modify, suspend,
            or discontinue any aspect of the service at any time without notice.
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <h3>3.1 Account Creation</h3>
          <p>
            To access certain features of LUCERO, you must create an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your password and account</li>
            <li>Accept all responsibility for activities that occur under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>

          <h3>3.2 Account Eligibility</h3>
          <p>
            Anyone who is willing to learn can create an account. If you are under 18, you must have
            parental or guardian consent to use LUCERO.
          </p>

          <h3>3.3 Account Termination</h3>
          <p>
            We reserve the right to terminate or suspend your account at any time for violations of these
            Terms, fraudulent activity, or any other reason at our sole discretion.
          </p>
        </section>

        <section>
          <h2>4. Use License</h2>
          <p>
            Permission is granted to temporarily access and use LUCERO for personal, non-commercial learning
            purposes. This license does not include:
          </p>
          <ul>
            <li>Modifying or copying the materials</li>
            <li>Using the materials for commercial purposes or public display</li>
            <li>Attempting to reverse engineer any software on LUCERO</li>
            <li>Removing copyright or proprietary notations from materials</li>
            <li>Transferring materials to another person or server</li>
          </ul>
          <p>
            This license shall automatically terminate if you violate any of these restrictions and may be
            terminated by LUCERO at any time.
          </p>
        </section>

        <section>
          <h2>5. User Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Upload or transmit viruses, malware, or malicious code</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Impersonate any person or entity</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Spam or send unsolicited communications to other users</li>
            <li>Collect or harvest personal information from other users</li>
            <li>Interfere with or disrupt the platform or servers</li>
            <li>Attempt to gain unauthorized access to any portion of LUCERO</li>
          </ul>
        </section>

        <section>
          <h2>6. Intellectual Property Rights</h2>
          <h3>6.1 LUCERO Content</h3>
          <p>
            All content on LUCERO, including but not limited to text, graphics, logos, images, audio clips,
            video, data compilations, and software, is the property of LUCERO or its content suppliers and is
            protected by international copyright laws.
          </p>

          <h3>6.2 User Content</h3>
          <p>
            By submitting content to LUCERO (comments, feedback, submissions), you grant us a worldwide,
            non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and distribute
            such content in connection with operating the platform.
          </p>

          <h3>6.3 Copyright Infringement</h3>
          <p>
            If you believe that content on LUCERO infringes your copyright, please contact us with:
          </p>
          <ul>
            <li>Description of the copyrighted work</li>
            <li>Location of the infringing material</li>
            <li>Your contact information</li>
            <li>A statement of good faith belief</li>
            <li>Your physical or electronic signature</li>
          </ul>
        </section>

        <section>
          <h2>7. Payment and Subscriptions</h2>
          <h3>7.1 Fees</h3>
          <p>
            Some features of LUCERO may require payment. All fees are stated in US dollars and are
            non-refundable except as required by law.
          </p>

          <h3>7.2 Billing</h3>
          <p>
            By providing payment information, you represent that you are authorized to use the payment method.
            You authorize us to charge the payment method for all fees incurred.
          </p>

          <h3>7.3 Automatic Renewal</h3>
          <p>
            Subscriptions automatically renew unless you cancel before the renewal date. You may cancel at any
            time through your account settings.
          </p>
        </section>

        <section>
          <h2>8. Privacy and Data Protection</h2>
          <p>
            Your use of LUCERO is also governed by our Privacy Policy. Please review our Privacy Policy to
            understand how we collect, use, and protect your personal information.
          </p>
        </section>

        <section>
          <h2>9. Disclaimers and Limitations of Liability</h2>
          <h3>9.1 No Warranties</h3>
          <p>
            LUCERO is provided "as is" without warranties of any kind, either express or implied, including
            but not limited to warranties of merchantability, fitness for a particular purpose, or
            non-infringement.
          </p>

          <h3>9.2 Limitation of Liability</h3>
          <p>
            To the maximum extent permitted by law, LUCERO shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred
            directly or indirectly.
          </p>

          <h3>9.3 Educational Content Disclaimer</h3>
          <p>
            While we strive to provide accurate and up-to-date educational content, we make no guarantees
            regarding the accuracy, completeness, or usefulness of the content. Learning outcomes may vary.
          </p>
        </section>

        <section>
          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless LUCERO, its affiliates, officers, directors, employees,
            and agents from any claims, damages, losses, liabilities, and expenses (including legal fees)
            arising from:
          </p>
          <ul>
            <li>Your use of the platform</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another person or entity</li>
            <li>Your content or submissions</li>
          </ul>
        </section>

        <section>
          <h2>11. Third-Party Links and Services</h2>
          <p>
            LUCERO may contain links to third-party websites or services. We are not responsible for the
            content, privacy policies, or practices of third-party sites. You access third-party sites at
            your own risk.
          </p>
        </section>

        <section>
          <h2>12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of material changes
            via email or platform notification. Your continued use of LUCERO after changes constitutes
            acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2>13. Termination</h2>
          <p>
            We may terminate or suspend your access immediately, without prior notice, for any reason,
            including breach of these Terms. Upon termination:
          </p>
          <ul>
            <li>Your right to use LUCERO will cease immediately</li>
            <li>You must destroy all copies of materials you obtained</li>
            <li>Provisions that should survive termination will remain in effect</li>
          </ul>
        </section>

        <section>
          <h2>14. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of [Your State/Country],
            without regard to its conflict of law provisions. Any disputes shall be resolved in the courts
            located in [Your Jurisdiction].
          </p>
        </section>

        <section>
          <h2>15. Dispute Resolution</h2>
          <h3>15.1 Informal Resolution</h3>
          <p>
            Before filing a claim, you agree to try to resolve the dispute informally by contacting us at
            support@lucero.com.
          </p>

          <h3>15.2 Arbitration</h3>
          <p>
            If informal resolution fails, disputes will be resolved through binding arbitration rather than
            in court, except that you may assert claims in small claims court if they qualify.
          </p>
        </section>

        <section>
          <h2>16. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision will be
            limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain
            in full force and effect.
          </p>
        </section>

        <section>
          <h2>17. Entire Agreement</h2>
          <p>
            These Terms constitute the entire agreement between you and LUCERO regarding the use of the
            platform and supersede all prior agreements and understandings.
          </p>
        </section>

        <section>
          <h2>18. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us:
          </p>
          <ul>
            <li><strong>Email:</strong> legal@lucero.com</li>
            <li><strong>Address:</strong> [Your Business Address]</li>
            <li><strong>Support:</strong> support@lucero.com</li>
          </ul>
        </section>

        <div className="acceptance-notice">
          <p>
            <strong>By using LUCERO, you acknowledge that you have read, understood, and agree to be bound
              by these Terms of Use.</strong>
          </p>
        </div>
      </div>
    </div>
  )
}