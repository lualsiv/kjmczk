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

const PostPreview: React.FC<Props> = ({
  slug,
  title,
  description,
  date,
  author,
  coverImage,
}: Props) => {
  return (
    <div>
      <div className="mb-4">
        <CoverImage slug={slug} title={title} src={coverImage} />
      </div>

      <h3 className="text-4xl leading-snug mb-2">
        <Link as={`/blog/${slug}`} href="/blog/[slug]">
          <a>{title}</a>
        </Link>
      </h3>

      <div className="text-gray-500 mb-4">
        <DateFormatter dateString={date} />
      </div>

      <p className="text-lg leading-relaxed mb-4">{description}</p>
      <Avatar name={author.name} picture={author.picture} />
    </div>
  );
};

export default PostPreview;
