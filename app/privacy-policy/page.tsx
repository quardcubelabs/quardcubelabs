import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | QuardCubeLabs",
  description: "Privacy Policy for QuardCubeLabs - Learn how we collect, use, and protect your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-navy mb-8">Privacy Policy</h1>
          <p className="text-navy/70 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8 text-navy/80">
            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">1. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Personal Information</h3>
                  <p className="mb-2">We may collect the following personal information:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Name and contact information (email, phone number, address)</li>
                    <li>Company name and job title</li>
                    <li>Payment information for services and products</li>
                    <li>Communication preferences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Usage Information</h3>
                  <p className="mb-2">We automatically collect information about how you use our services:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>IP address and browser information</li>
                    <li>Pages visited and time spent on our website</li>
                    <li>Device and operating system information</li>
                    <li>Referral sources</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use your information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Providing and improving our IT services and products</li>
                <li>Processing orders and handling customer support</li>
                <li>Sending important updates about our services</li>
                <li>Marketing communications (with your consent)</li>
                <li>Analytics to improve our website and services</li>
                <li>Compliance with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">3. Information Sharing</h2>
              <p className="mb-4">We do not sell your personal information. We may share your information in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With trusted service providers who assist in our operations</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or merger</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">4. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">5. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and review your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to processing of your personal information</li>
                <li>Request data portability</li>
                <li>Withdraw consent for marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">6. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar technologies to enhance your experience on our website. Please see our Cookie Policy for detailed information about our use of cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">7. Third-Party Services</h2>
              <p className="mb-4">
                Our website may contain links to third-party services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">8. Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">9. International Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than Tanzania. We ensure appropriate safeguards are in place to protect your information during such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">10. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our website and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">11. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-navy/5 p-4 rounded-lg">
                <p><strong>QuardCubeLabs</strong></p>
                <p>Email: privacy@quardcubelabs.com</p>
                <p>Phone: +255 XXX XXX XXX</p>
                <p>Address: Dar es Salaam, Tanzania</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
