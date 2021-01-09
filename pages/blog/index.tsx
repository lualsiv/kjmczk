import { GetStaticProps } from 'next';

import Container from '../../components/container';
import HeroPost from '../../components/hero-post';
import Layout from '../../components/layout';
import MorePosts from '../../components/more-posts';
import IPost from '../../types/post';
import { getAllPosts } from '../../utils/api';

type Props = {
  allPosts: IPost[];
};

const pageTitle = 'Blog';

const Blog: React.FC<Props> = ({ allPosts }: Props) => {
  const heroPost = allPosts[0];
  const morePosts = allPosts.slice(1);

  return (
    <Layout pageTitle={pageTitle}>
      <Container>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-tight mb-8 md:mb-16">
          {pageTitle}
        </h1>

        {heroPost && (
          <HeroPost
            slug={heroPost.slug}
            title={heroPost.title}
            description={heroPost.description}
            date={heroPost.date}
            author={heroPost.author}
            coverImage={heroPost.coverImage}
          />
        )}
        {morePosts.length > 0 && <MorePosts posts={morePosts} />}
      </Container>
    </Layout>
  );
};

export default Blog;

export const getStaticProps: GetStaticProps = async () => {
  const allPosts = getAllPosts([
    'slug',
    'title',
    'description',
    'date',
    'author',
    'coverImage',
  ]);

  return {
    props: { allPosts },
  };
};
