/* page.tsx */
import Link from "next/link";
import { BlogQueryResult } from "./types";
import { createClient } from "contentful";
import Image from "next/image";
import Footer from "@/components/Footer";

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

const getBlogEntries = async (): Promise<BlogQueryResult> => {
  const entries = await client.getEntries({ content_type: "pageBlogPost" });
  // @ts-ignore
  return entries;
};

const navigation = [
  { name: 'Product', href: '/#product' },
  { name: 'Pricing', href: '/#pricing' },
  { name: 'Blog', href: '/blog' },
]

export default async function Home() {
  const blogEntries = await getBlogEntries();
  return (
    <div>
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              <img
                className="h-8 w-auto"
                src="/supercast-logo-black.png"
                alt=""
              />
            </a>
          </div>
          <div className="flex gap-x-4 lg:gap-x-12">
            {navigation.map((item) => (
              <a key={item.name} href={item.href} className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100">
                {item.name}
              </a>
            ))}
          </div>
          <div className="lg:flex lg:flex-1 lg:justify-end">
          </div>
        </nav>
      </header>
      <main className="flex min-h-screen flex-col items-center pt-24 px-4">
        <div className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl" aria-hidden="true">
          <div
            className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        <div className="flex flex-col gap-y-2 items-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-center">What is happening on super?</h1>
          <p className="text-gray-500">Updates and tutorials from the super team</p>
        </div>
        <ul className="w-full max-w-[820px] grid grid-cols-1 md:grid-cols-2 gap-10 mx-auto">
          {blogEntries.items.map((singlePost) => {
            const { slug, title, publishedDate, featuredImage } = singlePost.fields;
            return (
              <li key={slug} className="hover:opacity-80 transition-opacity duration-300 mx-auto w-full">
                <Link href={`/blog/${slug}`}>
                  <Image
                    src={`https:${featuredImage.fields.file.url}`}
                    alt={`Featured image for ${title}`}
                    width={1092}
                    height={614}
                    className="rounded-lg max-h-[240px] w-full object-cover mb-2 shadow-md border-2 border-black dark:border-gray-800 bg-white dark:bg-black"
                  />
                  <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
      <Footer />
    </div>
  );
}