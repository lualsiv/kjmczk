import Link from 'next/link';
import { IconContext } from 'react-icons';
import { FaHome, FaTwitter, FaGithub } from 'react-icons/fa';

import Container from './container';
import { SITE_NAME, GITHUB_URL, TWITTER_URL } from '../utils/constants';

const Footer: React.FC = () => {
  return (
    <footer className="border-t">
      <Container>
        <div className="flex flex-col lg:flex-row items-center py-24">
          <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-center tracking-tight leading-tight mb-8 lg:mb-0 lg:pr-4 lg:w-1/2">
            This website is built with Next.js.
          </div>

          <div className="inline-flex justify-center items-center space-x-8 lg:pl-4 lg:w-1/2">
            <IconContext.Provider value={{ size: '2em' }}>
              <Link href="/">
                <a aria-label="Home">
                  <FaHome />
                </a>
              </Link>
              <a
                href={GITHUB_URL}
                aria-label={`${SITE_NAME} on GitHub`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <FaGithub />
              </a>
              <a
                href={TWITTER_URL}
                aria-label={`${SITE_NAME} on Twitter`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <FaTwitter />
              </a>
            </IconContext.Provider>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
