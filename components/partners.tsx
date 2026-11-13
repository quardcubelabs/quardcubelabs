"use client"

import Image from "next/image"

// Partner logos
const partners = [
  {
    name: "Poly",
    logo: "/poly.png",
    className: "h-14 sm:h-20 w-auto",
    width: 756,
    height: 330,
  },
  {
    name: "Dahua Technology",
    logo: "/dahua.png",
    className: "h-10 sm:h-14 w-auto",
    width: 435,
    height: 137,
  },
  {
    name: "Hikvision",
    logo: "/hikvision.png",
    className: "h-7 sm:h-10 w-auto",
    width: 500,
    height: 70,
  },
  {
    name: "ASUS",
    logo: "/asus.png",
    className: "h-8 sm:h-10 w-auto",
    width: 490,
    height: 110,
  },
  {
    name: "Dell",
    logo: "/dell.png",
    className: "h-11 sm:h-16 w-auto",
    width: 428,
    height: 426,
  },
  {
    name: "HP",
    logo: "/hp.png",
    className: "h-11 sm:h-16 w-auto",
    width: 174,
    height: 173,
  },
  {
    name: "TP-Link",
    logo: "/tp-link.png",
    className: "h-10 sm:h-14 w-auto",
    width: 1024,
    height: 395,
  },
  {
    name: "Lenovo",
    logo: "/lenovo.png",
    className: "h-8 sm:h-11 w-auto",
    width: 300,
    height: 100,
  },
]

export default function Partners() {
  const repeatedPartners = [...partners, ...partners]

  return (
    <section className="w-full overflow-hidden bg-teal py-5 sm:py-6">
      <div className="animate-marquee-rtl items-center">
        {[0, 1].map((groupIndex) => (
          <div
            key={groupIndex}
            className="flex shrink-0 items-center justify-around gap-12 sm:gap-20 md:gap-24 px-6 sm:px-10 md:px-12"
            aria-hidden={groupIndex === 1}
          >
            {repeatedPartners.map((partner, i) => (
              <div
                key={`${groupIndex}-${i}`}
                className="relative shrink-0 flex items-center justify-center transition-transform duration-300 hover:scale-105"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  unoptimized
                  className={`object-contain ${partner.className}`}
                  priority={groupIndex === 0 && i < 5}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
