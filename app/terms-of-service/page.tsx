import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | QuardCubeLabs",
  description: "Terms of Service for QuardCubeLabs - Our terms and conditions for using our IT services and products.",
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-navy mb-8">Terms of Service</h1>
          <p className="text-navy/70 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8 text-navy/80">
            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using QuardCubeLabs services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">2. Description of Service</h2>
              <p className="mb-4">
                QuardCubeLabs provides innovative IT solutions including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Web development and design services</li>
                <li>Mobile application development</li>
                <li>E-commerce solutions</li>
                <li>UI/UX design services</li>
                <li>IT consulting and support</li>
                <li>Software development and maintenance</li>
                <li>Digital products and solutions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">3. User Responsibilities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Account Security</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Maintain the confidentiality of your account credentials</li>
                    <li>Notify us immediately of any unauthorized use</li>
                    <li>Accept responsibility for all activities under your account</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Prohibited Activities</h3>
                  <p className="mb-2">You agree not to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Use our services for any illegal or unauthorized purpose</li>
                    <li>Violate any local, state, national, or international law</li>
                    <li>Transmit any harmful or malicious code</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Interfere with or disrupt our services</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">4. Payment Terms</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Service Fees</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Fees for services will be as quoted in your project agreement</li>
                    <li>Payment terms are typically 50% upfront, 50% upon completion</li>
                    <li>All prices are in USD unless otherwise specified</li>
                    <li>Prices may be subject to applicable taxes</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Refund Policy</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Refunds are considered on a case-by-case basis</li>
                    <li>Work completed cannot be refunded</li>
                    <li>Project cancellations may incur fees for work performed</li>
                    <li>Digital products sales are generally final</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">5. Intellectual Property</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Our Rights</h3>
                  <p className="mb-2">
                    QuardCubeLabs retains all rights to our proprietary methodologies, frameworks, and general business processes used in service delivery.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Client Rights</h3>
                  <p className="mb-2">
                    Upon full payment, clients receive ownership of custom-developed code and designs created specifically for their project, excluding our proprietary tools and frameworks.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">6. Service Level Agreements</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Project timelines will be agreed upon in writing before commencement</li>
                <li>We strive for 99% uptime for hosted services</li>
                <li>Support response times vary by service level agreement</li>
                <li>Maintenance windows will be scheduled with advance notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">7. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall QuardCubeLabs be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">8. Warranty Disclaimer</h2>
              <p className="mb-4">
                Our services are provided "as is" without warranty of any kind. We disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability and fitness for a particular purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">9. Termination</h2>
              <div className="space-y-4">
                <p>Either party may terminate services under the following conditions:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Breach of contract terms</li>
                  <li>Non-payment of fees</li>
                  <li>Mutual agreement</li>
                  <li>Completion of project scope</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">10. Confidentiality</h2>
              <p className="mb-4">
                We respect the confidentiality of your business information and will not disclose proprietary information to third parties without your consent, except as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">11. Governing Law</h2>
              <p className="mb-4">
                These terms shall be governed by and construed in accordance with the laws of Tanzania, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">12. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on our website. Continued use of our services constitutes acceptance of modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">13. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-navy/5 p-4 rounded-lg">
                <p><strong>QuardCubeLabs</strong></p>
                <p>Email: legal@quardcubelabs.com</p>
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
