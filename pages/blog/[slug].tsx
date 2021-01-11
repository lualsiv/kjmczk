// import { GetStaticProps, GetStaticPaths, GetServerSideProps } from 'next';
import ErrorPage from 'next/error';
import Head from 'next/head';
import { useRouter } from 'next/router';

import Container from '../../components/container';
import Layout from '../../components/layout';
import PostBody from '../../components/post-body';
import PostHeader from '../../components/post-header';
import PostTitle from '../../components/post-title';
import IPost from '../../types/post';
import { getPostBySlug, getAllPosts } from '../../utils/api';
import markdownToHtml from '../../utils/markdownToHtml';

type Props = {
  post: IPost;
  preview?: boolean;
};

const Post: React.FC<Props> = ({ post, preview }: Props) => {
  const router = useRouter();

  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <Layout
      pageTitle={post.title}
      preview={preview}
      postPath={post.path}
      hasAlert
    >
      <Container>
        {router.isFallback ? (
          <PostTitle>Loading...</PostTitle>
        ) : (
          <article className="prose lg:prose-xl prose-purple mx-auto mb-16">
            <Head>
              <meta property="og:description" content={post.description} />
              <meta property="og:image" content={post.ogImage.url} />
            </Head>

            <PostHeader
              title={post.title}
              coverImage={post.coverImage}
              author={post.author}
              date={post.date}
            />

            <PostBody content={post.content} />
          </article>
        )}
      </Container>
    </Layout>
  );
};

export default Post;

type Params = {
  params: {
    slug: string;
  };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function getStaticProps({ params }: Params) {
  const post = getPostBySlug(params.slug, [
    'slug',
    'title',
    'description',
    'date',
    'author',
    'path',
    'ogImage',
    'coverImage',
    'content',
  ]);

  const content = await markdownToHtml(post.content || '');

  return {
    props: {
      post: {
        ...post,
        content,
      },
    },
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function getStaticPaths() {
  const posts = getAllPosts(['slug']);

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      };
    }),
    fallback: false,
  };
}
