const serviceImageMap: Record<string, string> = {
  'custom-software-development': '/images/services/custom software.jpg',
  'web-design-development': '/images/services/web designing.jpg',
  'power-management-solutions': '/images/services/power management.png',
  'network-infrastructure': '/images/services/network infrastructure.jpg',
  'it-consulting-support': '/images/services/it consulting.jpg',
  'corporate-ai-automation': '/images/services/cooperate_ai.JPG',
  'personalized-ai-automations': '/images/services/personalized ai automation.jpg',
  'cctv-camera-installations': '/images/services/cctv camera installations.jpg',
  'graphic-design': '/images/services/graphic design.jpg',
  'graphic-designing': '/images/services/graphic design.jpg',
}

export function getServiceImage(slug?: string | null, fallback?: string | null): string {
  if (slug && serviceImageMap[slug]) {
    return serviceImageMap[slug]
  }
  return fallback || '/placeholder.svg'
}
