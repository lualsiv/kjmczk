import Author from './author';

interface IPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: Author;
  path: string;
  coverImage: string;
  ogImage: {
    url: string;
  };
  content: string;
}

export default IPost;
