import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Return & Refund Policy | QuardCubeLabs",
  description: "Return and Refund Policy for QuardCubeLabs - Learn about our return process, refund eligibility, and product exchange policies.",
}

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-navy mb-8">Return & Refund Policy</h1>
          <p className="text-navy/70 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8 text-navy/80">
            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">1. Overview</h2>
              <p className="mb-4">
                At QuardCube Labs, we want you to be completely satisfied with your purchase. If you are not satisfied with a product you have purchased, you may return it in accordance with this Return & Refund Policy.
              </p>
              <p>
                This policy applies to all physical products, electronics, and accessories purchased through our website or in-store at our Dar es Salaam, Tanzania location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">2. Return Eligibility</h2>
              <p className="mb-4">To be eligible for a return, the following conditions must be met:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The item must be returned within <strong>30 days</strong> of the original purchase date</li>
                <li>The item must be in its original, unused condition</li>
                <li>The item must be in the original packaging with all accessories, manuals, and documentation included</li>
                <li>You must provide a valid proof of purchase (receipt or order confirmation)</li>
                <li>The item must not show signs of physical damage, misuse, or modification</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">3. Non-Returnable Items</h2>
              <p className="mb-4">The following items are not eligible for return:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Software licenses and digital products once activated or downloaded</li>
                <li>Gift cards and vouchers</li>
                <li>Custom-built or specially ordered products</li>
                <li>Items that have been physically damaged after delivery</li>
                <li>Consumable products that have been opened (e.g., ink cartridges, toners)</li>
                <li>Products with removed or tampered serial numbers</li>
                <li>Services that have already been rendered</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">4. Return Process</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Step 1: Contact Us</h3>
                  <p>
                    Initiate your return by contacting our customer service team via email at{" "}
                    <a href="mailto:info@quardcubelabs.com" className="text-brand-red hover:underline">
                      info@quardcubelabs.com
                    </a>{" "}
                    or by calling{" "}
                    <a href="tel:+255652540496" className="text-brand-red hover:underline">
                      +255 652 540 496
                    </a>
                    . Please include your order number and reason for the return.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Step 2: Receive Return Authorization</h3>
                  <p>
                    Our team will review your request and issue a Return Merchandise Authorization (RMA) number within 2 business days. Returns without an RMA number will not be accepted.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Step 3: Ship or Drop Off the Item</h3>
                  <p>
                    Pack the item securely in its original packaging and ship it to our address or drop it off at our location:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 mt-2">
                    <p className="font-medium">QuardCube Labs</p>
                    <p>Kigamboni-Ferry State</p>
                    <p>Dar es Salaam, Tanzania 17107</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Step 4: Inspection & Processing</h3>
                  <p>
                    Once we receive your returned item, we will inspect it within 3-5 business days. You will be notified via email of the status of your return.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">5. Refund Policy</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Approved Returns</h3>
                  <p>
                    If your return is approved, a refund will be processed to your original payment method within <strong>7-14 business days</strong>. Please note that it may take additional time for your bank or payment provider to reflect the refund in your account.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Partial Refunds</h3>
                  <p className="mb-2">Partial refunds may be granted in the following situations:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Items returned with minor signs of use</li>
                    <li>Items returned with missing accessories or packaging</li>
                    <li>Items returned after 30 days but within 45 days of purchase (subject to a 15% restocking fee)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Shipping Costs</h3>
                  <p>
                    Original shipping costs are non-refundable. The customer is responsible for return shipping costs unless the return is due to a defective product or an error on our part.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">6. Exchanges</h2>
              <p className="mb-4">
                We offer product exchanges within 30 days of purchase. To exchange an item:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Follow the same return process outlined above</li>
                <li>Indicate the product you would like to exchange for</li>
                <li>If the replacement item is of higher value, you will be charged the difference</li>
                <li>If the replacement item is of lower value, the difference will be refunded</li>
                <li>Exchange items are subject to availability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">7. Defective or Damaged Products</h2>
              <p className="mb-4">
                If you receive a defective or damaged product:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Contact us within <strong>48 hours</strong> of receiving the product</li>
                <li>Provide photos or videos of the damage or defect</li>
                <li>We will arrange a free pickup or provide a prepaid shipping label</li>
                <li>You may choose a full refund or a replacement product</li>
                <li>Defective products covered under manufacturer warranty will be handled according to the manufacturer&apos;s warranty terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">8. Warranty Claims</h2>
              <p className="mb-4">
                Many products we sell come with a manufacturer&apos;s warranty. For warranty claims:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Check the product documentation for warranty coverage details</li>
                <li>Contact us with your order number and a description of the issue</li>
                <li>We will coordinate with the manufacturer on your behalf when possible</li>
                <li>Warranty repairs or replacements are handled per the manufacturer&apos;s policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">9. Cancellations</h2>
              <p className="mb-4">
                Orders can be cancelled before they are shipped:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Contact us as soon as possible to cancel your order</li>
                <li>If the order has not been processed or shipped, a full refund will be issued</li>
                <li>If the order has already shipped, you will need to follow the standard return process</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">10. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about our Return & Refund Policy, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:info@quardcubelabs.com" className="text-brand-red hover:underline">
                    info@quardcubelabs.com
                  </a>
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  <a href="tel:+255652540496" className="text-brand-red hover:underline">
                    +255 652 540 496
                  </a>
                </p>
                <p>
                  <strong>WhatsApp:</strong>{" "}
                  <a href="https://wa.me/255652540496" className="text-brand-red hover:underline">
                    +255 652 540 496
                  </a>
                </p>
                <p>
                  <strong>Address:</strong> Kigamboni-Ferry State, Dar es Salaam, Tanzania 17107
                </p>
                <p>
                  <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM (EAT)
                </p>
              </div>
            </section>

            <section className="border-t pt-8">
              <p className="text-sm text-navy/60">
                This Return & Refund Policy is subject to change without prior notice. Please check this page regularly for updates.
                For more information, please also review our{" "}
                <Link href="/terms-of-service" className="text-brand-red hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="text-brand-red hover:underline">
                  Privacy Policy
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}