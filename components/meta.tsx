import Head from 'next/head';

import { SITE_NAME } from '../utils/constants';

type Props = {
  pageTitle: string;
};

const Meta: React.FC<Props> = ({ pageTitle }: Props) => {
  const meta = {
    description:
      'Tutorials and tips for full-stack developers to build apps with TypeScript / JavaScript, React, React Native and more.',
    cardImage: '/assets/card-image.png',
    // ...pageMeta,
  };

  return (
    <Head>
      <title>{`${pageTitle} | ${SITE_NAME}`}</title>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/favicon/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon/favicon-16x16.png"
      />
      <link rel="manifest" href="/favicon/site.webmanifest" />
      <link
        rel="mask-icon"
        href="/favicon/safari-pinned-tab.svg"
        color="#5bbad5"
      />
      <link rel="shortcut icon" href="/favicon/favicon.ico" />
      <meta name="msapplication-TileColor" content="#ffc40d" />
      <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      <meta name="theme-color" content="#fff" />
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      <meta name="description" content={meta.description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={SITE_NAME} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={meta.cardImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@kjmczk" />
      <meta name="twitter:title" content={SITE_NAME} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={meta.cardImage} />
      <link
        href="https://unpkg.com/prismjs@0.0.1/themes/prism-okaidia.css"
        rel="stylesheet"
      />
    </Head>
  );
};

export default Meta;
