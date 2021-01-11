import cn from 'classnames';

import Container from './container';

type Props = {
  preview?: boolean;
  postPath?: string;
};

const Alert: React.FC<Props> = ({ preview, postPath }: Props) => {
  return (
    <div
      className={cn('border-b', {
        'bg-accent-7 border-accent-7 text-white': preview,
        'bg-accent-1 border-accent-2': !preview,
      })}
    >
      <Container>
        <div className="text-sm text-center py-2">
          {preview ? (
            <>
              This page is a preview.{' '}
              <a
                href="/api/exit-preview"
                className="underline hover:text-cyan duration-200 transition-colors"
              >
                Click here
              </a>{' '}
              to exit preview mode.
            </>
          ) : (
            <>
              The source code for this article is{' '}
              <a
                href={`https://github.com/kjmczk/${postPath}`}
                rel="noopener noreferrer"
                target="_blank"
                className="underline hover:text-success duration-200 transition-colors"
              >
                available on GitHub
              </a>
              .
            </>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Alert;
