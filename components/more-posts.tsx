import PostPreview from './post-preview';
import IPost from '../types/post';

type Props = {
  posts: IPost[];
};

const MorePosts: React.FC<Props> = ({ posts }: Props) => {
  return (
    <section>
      <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-8">
        More Posts
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 2xl:gap-x-32 gap-y-16 2xl:gap-y-32 mb-16 2xl:mb-32">
        {posts.map((post) => (
          <PostPreview
            key={post.slug}
            slug={post.slug}
            title={post.title}
            description={post.description}
            date={post.date}
            author={post.author}
            coverImage={post.coverImage}
          />
        ))}
      </div>
    </section>
  );
};

export default MorePosts;
