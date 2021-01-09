import Link from 'next/link';

import Container from './container';
import { SITE_NAME } from '../utils/constants';

const Header: React.FC = () => {
  return (
    <Container>
      <nav className="tracking-tight leading-tight mt-8 mb-16">
        <a href="#" className="sr-only focus:not-sr-only">
          Skip to content
        </a>
        <div className="flex justify-between">
          <Link href="/">
            <a className="text-2xl md:text-4xl font-bold">{SITE_NAME}</a>
          </Link>
          <Link href="/blog">
            <a className="text-xl md:text-2xl">Blog</a>
          </Link>
        </div>
      </nav>
    </Container>
  );
};

export default Header;
