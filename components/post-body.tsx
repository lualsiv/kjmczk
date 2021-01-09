import markdownStyles from '../styles/markdown-styles.module.css';

type Props = {
  content: string;
};

const PostBody: React.FC<Props> = ({ content }: Props) => {
  return (
    <div
      className={markdownStyles['markdown']}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default PostBody;
