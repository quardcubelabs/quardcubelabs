import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy | QuardCubeLabs",
  description: "Cookie Policy for QuardCubeLabs - Learn about how we use cookies and similar technologies on our website.",
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-navy mb-8">Cookie Policy</h1>
          <p className="text-navy/70 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8 text-navy/80">
            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">1. What Are Cookies</h2>
              <p className="mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work, or work more efficiently, as well as to provide information to website owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">2. How We Use Cookies</h2>
              <p className="mb-4">
                QuardCubeLabs uses cookies for various purposes to enhance your experience on our website:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Essential website functionality</li>
                <li>User authentication and security</li>
                <li>Analytics and performance monitoring</li>
                <li>Personalization of content</li>
                <li>Marketing and advertising optimization</li>
                <li>Social media integration</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">3. Types of Cookies We Use</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Essential Cookies</h3>
                  <p className="mb-2">
                    These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Session management</li>
                    <li>Authentication tokens</li>
                    <li>Security preferences</li>
                    <li>Shopping cart functionality</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Analytics Cookies</h3>
                  <p className="mb-2">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Google Analytics</li>
                    <li>Page view tracking</li>
                    <li>User behavior analysis</li>
                    <li>Performance monitoring</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Functional Cookies</h3>
                  <p className="mb-2">
                    These cookies allow the website to remember choices you make and provide enhanced, more personal features.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Language preferences</li>
                    <li>Theme settings</li>
                    <li>Form data retention</li>
                    <li>User interface preferences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Marketing Cookies</h3>
                  <p className="mb-2">
                    These cookies track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Advertising preferences</li>
                    <li>Social media tracking</li>
                    <li>Conversion tracking</li>
                    <li>Remarketing pixels</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">4. Third-Party Cookies</h2>
              <p className="mb-4">
                We also use third-party services that may set cookies on your device. These include:
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Google Services</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Google Analytics for website analytics</li>
                    <li>Google Ads for advertising</li>
                    <li>Google Maps for location services</li>
                    <li>reCAPTCHA for security</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Social Media</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Facebook pixel for social media integration</li>
                    <li>LinkedIn tracking for professional networking</li>
                    <li>Twitter widgets for social sharing</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Other Services</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Payment processors for secure transactions</li>
                    <li>Customer support chat widgets</li>
                    <li>Content delivery networks</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">5. Cookie Duration</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Session Cookies</h3>
                  <p>These are temporary cookies that are deleted when you close your browser.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Persistent Cookies</h3>
                  <p>These cookies remain on your device for a set period or until you delete them. Typical durations:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Analytics cookies: Up to 2 years</li>
                    <li>Functional cookies: Up to 1 year</li>
                    <li>Marketing cookies: Up to 90 days</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">6. Managing Your Cookie Preferences</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Browser Settings</h3>
                  <p className="mb-2">You can control cookies through your browser settings:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Block all cookies</li>
                    <li>Allow only first-party cookies</li>
                    <li>Delete existing cookies</li>
                    <li>Get notified when cookies are set</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Cookie Consent</h3>
                  <p>
                    When you first visit our website, we will ask for your consent to use non-essential cookies. You can change your preferences at any time through our cookie consent banner.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">7. Impact of Disabling Cookies</h2>
              <p className="mb-4">
                If you disable cookies, some features of our website may not function properly:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You may need to re-enter information repeatedly</li>
                <li>Personalization features may not work</li>
                <li>Some pages may load more slowly</li>
                <li>Shopping cart functionality may be affected</li>
                <li>Login sessions may not persist</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">8. Updates to This Policy</h2>
              <p className="mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Please check this page regularly for updates.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">9. More Information</h2>
              <div className="space-y-4">
                <p>
                  For more information about cookies and how to manage them, visit:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><a href="https://www.aboutcookies.org" className="text-brand-red hover:underline" target="_blank" rel="noopener noreferrer">AboutCookies.org</a></li>
                  <li><a href="https://www.allaboutcookies.org" className="text-brand-red hover:underline" target="_blank" rel="noopener noreferrer">AllAboutCookies.org</a></li>
                  <li><a href="https://cookiepedia.co.uk" className="text-brand-red hover:underline" target="_blank" rel="noopener noreferrer">Cookiepedia</a></li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">10. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about our use of cookies, please contact us:
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
