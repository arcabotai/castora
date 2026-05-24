import { createClient } from "contentful";
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, MARKS, INLINES } from '@contentful/rich-text-types';
import { BlogItem } from "../types";
import Image from "next/image";
import Footer from "@/components/Footer";
import { Metadata, ResolvingMetadata } from 'next'

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

const renderOptions = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node, children) => {
      return <p className="mb-6">{children}</p>
    },
    [BLOCKS.HEADING_1]: (node, children) => {
      return <h1 className="text-4xl font-bold mb-6">{children}</h1>
    },
    [BLOCKS.HEADING_2]: (node, children) => {
      return <h2 className="text-3xl font-bold mb-6">{children}</h2>
    },
    [BLOCKS.HEADING_3]: (node, children) => {
      return <h3 className="text-2xl font-bold mb-6">{children}</h3>
    },
    [BLOCKS.HEADING_4]: (node, children) => {
      return <h4 className="text-xl font-bold mb-6">{children}</h4>
    },
    [BLOCKS.HEADING_5]: (node, children) => {
      return <h5 className="text-lg font-bold mb-6">{children}</h5>
    },
    [BLOCKS.HEADING_6]: (node, children) => {
      return <h6 className="text-base font-bold mb-6">{children}</h6>
    },
    [BLOCKS.UL_LIST]: (node, children) => {
      return <ul className="mb-6">{children}</ul>
    },
    [BLOCKS.LIST_ITEM]: (node, children) => {
      return <li className="flex flex-row pl-4"><span className="mr-2">{'•'}</span>{children}</li>
    },
    [BLOCKS.HR]: (node, children) => {
      return <hr className="my-6" />
    },
    [BLOCKS.EMBEDDED_ASSET]: (node, children) => {
      return null;
    },
    [INLINES.HYPERLINK]: (node, children) => {
      return <a
        href={node.data.uri}
        className="text-blue-600 font-medium hover:underline"
      >{children}</a>
    },
    [BLOCKS.EMBEDDED_ENTRY]: (node, children) => {
      if (!node.data.target.fields.image.fields) {
        return null;
      }
      return (<Image
        src={`https:${node.data.target.fields.image.fields.file.url}`}
        height={node.data.target.fields.image.fields.file.details.image.height}
        width={node.data.target.fields.image.fields.file.details.image.width}
        alt={node.data.target.fields.image.fields.description}
        className="my-10 rounded-md shadow-lg border dark:border-gray-800 max-h-[400px] w-auto mx-auto"
      />)
    },
  },
  renderMark: {
    [MARKS.BOLD]: (text) => {
      return <span className="font-bold">{text}</span>
    },
    [MARKS.ITALIC]: (text) => {
      return <span className="italic">{text}</span>
    },
    [MARKS.UNDERLINE]: (text) => {
      return <span className="underline">{text}</span>
    },
    [MARKS.CODE]: (text) => {
      return <code className="bg-gray-100 p-1 rounded-md">{text}</code>
    },
  },
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const { slug } = params

  const article = await fetchBlogPost(slug);

  return {
    title: article.fields.title,
    openGraph: {
      images: [
        {
          url: `https:${article.fields.featuredImage.fields.file.url}`,
        }
      ],
      title: article.fields.title,
    },
  }
}

const fetchBlogPost = async (slug: string): Promise<BlogItem> => {
  const queryOptions = {
    content_type: "pageBlogPost",
    "fields.slug[match]": slug,
  };
  const queryResult = await client.getEntries(queryOptions);
  // @ts-ignore
  return queryResult.items[0];
};

type BlogPageProps = {
  params: {
    slug: string;
  };
};

const navigation = [
  { name: 'Product', href: '/#product' },
  { name: 'Pricing', href: '/#pricing' },
  { name: 'Blog', href: '/blog' },
]

export default async function BlogPage(props: BlogPageProps) {
  const { params } = props;
  const { slug } = params;

  const article = await fetchBlogPost(slug);

  const { title, publishedDate, featuredImage, content } = article.fields;

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
      <main className="min-h-screen pt-24 px-4 flex justify-center">
        <div className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl" aria-hidden="true">
          <div
            className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        <div className="max-w-[800px]">
          <div className="flex justify-center text-gray-500 text-sm mb-2">
            <span>
              Posted on{" "}
              {new Date(publishedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <Image
            src={`https:${featuredImage.fields.file.url}`}
            alt={`Featured image for ${title}`}
            width={1920}
            height={1080}
            className="rounded-lg max-h-[420px] w-full object-cover mb-6 shadow-md"
          />
          <div className="max-w-[620px] mx-auto pb-8">
            <h2 className="text-4xl font-bold mb-8">{title}</h2>
            <div className="">
              {documentToReactComponents(content, renderOptions)}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}