import Link from "next/link"
import { ArrowUp } from "lucide-react"
import Logo from "@/components/logo"
import { Facebook, Linkedin, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react"
import { FaThreads } from "react-icons/fa6"

export default function Footer() {
  return (
    <footer className="border-t-2 border-navy/20 bg-white/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-6">
              <Logo size="lg" />
              <span className="font-bold text-xl tracking-tight text-navy">QUARDCUBELABS</span>
            </Link>

            <p className="text-navy/70 font-medium mb-6">
              Innovative IT solutions for the digital future. Empowering businesses through technology.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.facebook.com/share/1EZ4tcGJnw/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-teal-200 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="https://www.threads.com/@quardcubelabs?igshid=NTc4MTIwNjQ2YQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-teal-200 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                aria-label="Threads"
              >
                <FaThreads className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/quardcube-labs-13431241a/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="https://www.instagram.com/quardcubelabs?igsh=cjJ0bHViYW84anJp&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-teal-200 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="https://www.youtube.com/channel/UC4CN_47KDUc-ucmQR1xLkqA"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-teal-200 hover:bg-navy hover:text-white transition-all duration-300 text-navy"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6 text-navy">Services</h3>
            <ul className="space-y-4">
              {[
                { name: "Software Development", id: 1 },
                { name: "Web Designing", id: 2 },
                { name: "Power Solutions", id: 3 },
                { name: "Security Products", id: 4 },
                { name: "Connectivity & Networking", id: 5 },
                { name: "IT Products & Services", id: 6 },
              ].map((service) => (
                <li key={service.id}>
                  <Link href={`/services/${service.id}`} className="text-navy/70 hover:text-brand-red transition-colors font-medium">
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6 text-navy">Company</h3>
            <ul className="space-y-4">
              {[
                { name: "About Us", href: "/about" },
                { name: "Our Team", href: "/team" },
                { name: "Careers", href: "/careers" },
                { name: "Blog", href: "/blog" },
                { name: "Case Studies", href: "/case-studies" },
                { name: "Contact Us", href: "/contact" },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-navy/70 hover:text-brand-red transition-colors font-medium">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6 text-navy">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-red mt-0.5 flex-shrink-0" />
                <span className="text-navy/70 font-medium">
                  24 Ferry, Kigamboni
                  <br />
                  Kigamboni, Dar es Salaam 17101, Tanzania
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-brand-red mt-0.5 flex-shrink-0" />
                <span className="text-navy/70 font-medium">
                  +255 652540496
                  <br />
                  +255 623 893 383
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-brand-red mt-0.5 flex-shrink-0" />
                <span className="text-navy/70 font-medium">
                  info@quardcubelabs.com
                  <br />
                  support@quardcubelabs.com
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8  flex flex-col md:flex-row justify-between items-center">
          <p className="text-navy/100 text-xs sm:text-sm mb-4 md:mb-0 text-center md:text-left font-medium">
            © {new Date().getFullYear()} QuardCubeLabs. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link
              href="/privacy-policy"
              className="text-navy/100 hover:text-brand-red transition-colors text-xs sm:text-sm font-medium"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-navy/100 hover:text-brand-red transition-colors text-xs sm:text-sm font-medium"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookie-policy"
              className="text-navy/100 hover:text-brand-red transition-colors text-xs sm:text-sm font-medium"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>

      <a
        href="#"
        className="fixed bottom-6 right-6 p-3 rounded-full bg-navy text-white shadow-lg hover:bg-brand-red transition-all duration-300"
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </a>
    </footer>
  )
}
