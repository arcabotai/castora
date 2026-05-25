import Link from "next/link"

const footerLinks = [
  { name: 'Blog', href: '/blog' },
  { name: 'Arca', href: 'https://arcabot.ai' },
  { name: 'Farcaster', href: 'https://warpcast.com/felirami' },
  { name: '𝕏', href: 'https://x.com/felirami' },
  { name: 'Privacy policy', href: '/legal/privacy-policy' },
  { name: 'Terms of service', href: '/legal/terms-of-service' },
]


export default function Footer() {

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <footer
        className="relative border-t border-gray-900/10 py-8"
      >
        <div className="w-full flex flex-row flex-wrap gap-x-4 gap-y-2">
          {footerLinks.map((link) => (
            <Link key={link.name} href={link.href} target='_blank' className="text-xs sm:text-sm leading-6 text-gray-500 hover:text-gray-900">
              {link.name}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
