import Footer from "@/components/Footer";

const navigation = [
  { name: "Product", href: "/#product" },
  { name: "Pricing", href: "/#pricing" },
  { name: "Blog", href: "/blog" },
];

export default function BlogIndex() {
  return (
    <div>
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Castora</span>
              <img className="h-8 w-auto" src="/castora-mark.svg" alt="Castora" />
            </a>
          </div>
          <div className="flex gap-x-4 lg:gap-x-12">
            {navigation.map((item) => (
              <a key={item.name} href={item.href} className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100">
                {item.name}
              </a>
            ))}
          </div>
          <div className="lg:flex lg:flex-1 lg:justify-end" />
        </nav>
      </header>
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Castora blog</h1>
        <p className="mt-4 max-w-xl text-gray-500">
          Blog content is disabled during the Castora bootstrap. CMS integration will be wired after first deploy.
        </p>
      </main>
      <Footer />
    </div>
  );
}
