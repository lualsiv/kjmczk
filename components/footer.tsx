import Container from './container';
import { GITHUB_URL, TWITTER_URL } from '../utils/constants';

const Footer: React.FC = () => {
  return (
    <footer className="border-t">
      <Container>
        <div className="flex flex-col lg:flex-row items-center py-24">
          <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-center tracking-tight leading-tight mb-8 lg:mb-0 lg:pr-4 lg:w-1/2">
            This website is built with Next.js.
          </div>
          <div className="inline-flex justify-center items-center lg:pl-4 lg:w-1/2">
            <a href={GITHUB_URL} className="font-bold mx-4">
              GitHub
            </a>
            <a href={TWITTER_URL} className="font-bold mx-4">
              Twitter
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
