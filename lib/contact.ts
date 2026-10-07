import type { AppConfig } from '@/config/schema'

/** URLs derivadas de la config de contacto; un único lugar para armarlas. */
export function contactLinks(c: AppConfig) {
  return {
    whatsapp: `https://wa.me/${c.contact.whatsapp}`,
    email: `mailto:${c.contact.email}`,
    phone: `tel:${c.contact.phone}`,
    instagram: c.social.instagram ? `https://www.instagram.com/${c.social.instagram}/` : '',
  }
}
