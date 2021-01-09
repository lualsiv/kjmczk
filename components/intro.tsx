import { SITE_NAME, SITE_TITLE } from '../utils/constants';

const Intro: React.FC = () => {
  return (
    <div className="max-w-prose mx-auto text-center my-16">
      <h1 className="text-6xl lg:text-8xl font-bold tracking-tight leading-tight mb-8">
        {SITE_TITLE}
      </h1>
      <h4 className="text-lg">
        {SITE_NAME} provides tutorials and tips for full-stack developers to
        build apps with TypeScript / JavaScript, React, React Native and more.
      </h4>
    </div>
  );
};

export default Intro;
