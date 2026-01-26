import type { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogCard, { BlogPostMeta } from '@/components/Blog/BlogCard';
import FaviconLinks from '@/components/SEO/FaviconLinks';
import { getAllPosts } from '@/lib/blog';
import {
  getCanonicalUrl,
  getDefaultHreflangUrl,
  getHreflangLinks,
} from '@/lib/seo';

interface BlogListProps {
  posts: BlogPostMeta[];
}

const BlogList: NextPage<BlogListProps> = ({ posts }) => {
  const router = useRouter();
  const pagePath = '/blog';
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://avatar.leix.dev';
  const canonicalUrl = getCanonicalUrl(pagePath, router.locale);
  const hreflangLinks = getHreflangLinks(pagePath);
  const ogImage = `${baseUrl}/social.png`;

  return (
    <>
      <Head>
        <FaviconLinks />
        <title>Blog | Avatar Maker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        <meta
          name="description"
          content="Tips, tutorials, and updates about creating avatars."
        />
        <meta
          name="keywords"
          content="Avatar Blog, Avatar Design Tips, Hand-drawn Avatar, Avatar Tutorials"
        />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Blog | Avatar Maker" />
        <meta
          property="og:description"
          content="Tips, tutorials, and updates about creating avatars."
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Avatar Maker" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog | Avatar Maker" />
        <meta
          name="twitter:description"
          content="Tips, tutorials, and updates about creating avatars."
        />
        <meta name="twitter:image" content={ogImage} />

        <link rel="canonical" href={canonicalUrl} />
        {hreflangLinks.map((link) => (
          <link
            key={link.hrefLang}
            rel="alternate"
            hrefLang={link.hrefLang}
            href={link.href}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={getDefaultHreflangUrl(pagePath)}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Blog',
              name: 'Avatar Maker Blog',
              description:
                'Tips, tutorials, and updates about creating avatars.',
              url: canonicalUrl,
              publisher: {
                '@type': 'Organization',
                name: 'Avatar Maker',
                url: baseUrl,
              },
            }),
          }}
        />
      </Head>

      <Header />

      <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Blog
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tips, tutorials, and updates about creating avatars
            </p>
          </header>

          {posts.length > 0 ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                No posts yet
              </h2>
              <p className="text-gray-600">
                Check back soon for new articles and updates!
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export const getStaticProps: GetStaticProps<BlogListProps> = async ({
  locale,
}) => {
  const posts = getAllPosts();

  return {
    props: {
      posts,
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};

export default BlogList;
