import Alert from './alert';
import Footer from './footer';
import Header from './header';
import Meta from './meta';

type Props = {
  pageTitle: string;
  hasAlert?: boolean;
  preview?: boolean;
  postPath?: string;
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({
  pageTitle,
  hasAlert,
  preview,
  postPath,
  children,
}: Props) => {
  return (
    <>
      <Meta pageTitle={pageTitle} />
      {hasAlert && <Alert preview={preview} postPath={postPath} />}
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
};

export default Layout;
