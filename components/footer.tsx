"use client"

import Link from "next/link"
import Image from "next/image"
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
              <Image
                src="/footer-logo.png"
                alt="QuardCube Labs"
                width={200}
                height={80}
                className="h-auto w-[180px] sm:w-[200px]"
              />
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
                { name: "Corporate AI Automation", id: 7 },
                { name: "Personalized AI Automations", id: 8 },
                { name: "CCTV Camera Installations", id: 9 },
                { name: "Software Development", id: 1 },
                { name: "Web Designing", id: 2 },
                { name: "Connectivity & Networking", id: 5 },
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
              href="/return-policy"
              className="text-navy/100 hover:text-brand-red transition-colors text-xs sm:text-sm font-medium"
            >
              Return Policy
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

      {/* WhatsApp Button - Above scroll to top */}
      <a
        href="https://wa.me/255623893383?text=Hello%20QuardCubeLabs%2C%20I%20would%20like%20to%20inquire%20about%20your%20services"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 z-50 p-3 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#128C7E] hover:scale-110 transition-all duration-300"
        aria-label="Chat on WhatsApp"
        title="Message us on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 w-6"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Scroll to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-navy text-white shadow-lg hover:bg-brand-red transition-all duration-300"
        aria-label="Back to top"
        title="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </footer>
  )
}
