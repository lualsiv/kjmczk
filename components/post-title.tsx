type Props = {
  children?: React.ReactNode;
};

const PostTitle: React.FC<Props> = ({ children }: Props) => {
  return (
    <h1 className="text-center md:text-left tracking-tight leading-tight md:leading-none">
      {children}
    </h1>
  );
};

export default PostTitle;
