import Head from 'next/head';
import Link from 'next/link';

import Container from '../components/container';
import Intro from '../components/intro';
import Layout from '../components/layout';
import { SITE_NAME, SITE_TITLE } from '../utils/constants';

const Home: React.FC = () => {
  return (
    <Layout pageTitle="Home">
      <Head>
        <title>
          {SITE_NAME}: {SITE_TITLE}
        </title>
      </Head>

      <Container>
        <Intro />
        <div className="text-center mb-16">
          <Link href="/blog">
            <a className="inline-flex items-center bg-gray-900 hover:bg-white text-white hover:text-gray-900 text-center uppercase rounded border border-gray-900 transition-colors duration-200 px-16 py-4">
              Go to Blog
            </a>
          </Link>
        </div>
      </Container>
    </Layout>
  );
};

export default Home;
