import Link from 'next/link';

import Avatar from './avatar';
import CoverImage from './cover-image';
import DateFormatter from './date-formatter';
import IAuthor from '../types/author';

type Props = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: IAuthor;
  coverImage: string;
};

const HeroPost: React.FC<Props> = ({
  slug,
  title,
  description,
  date,
  author,
  coverImage,
}: Props) => {
  return (
    <section>
      <div className="mb-8 md:mb-16">
        <CoverImage title={title} src={coverImage} slug={slug} />
      </div>
      <div className="md:grid md:grid-cols-2 md:gap-x-8 mb-16 md:mb-24">
        <div>
          <h3 className="text-4xl lg:text-6xl leading-tight mb-4">
            <Link as={`/blog/${slug}`} href="/blog/[slug]">
              <a>{title}</a>
            </Link>
          </h3>
        </div>
        <div>
          <div className="text-gray-500 mb-4">
            <DateFormatter dateString={date} />
          </div>
          <p className="text-lg leading-relaxed mb-4">{description}</p>
          <Avatar name={author.name} picture={author.picture} />
        </div>
      </div>
    </section>
  );
};

export default HeroPost;
