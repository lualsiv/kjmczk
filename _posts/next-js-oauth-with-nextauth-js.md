---
path: next-auth-app
coverImage: /assets/blog/next-auth-app/cover.jpg
date: '2020-07-20T05:34:03.436Z'
title: Next.js OAuth with NextAuth.js
description: Tutorial for implementing OAuth and email (passwordless)
  authentication using NextAuth.js.
author:
  name: Koji Mochizuki
  picture: /assets/blog/author/avatar.png
ogImage:
  url: /assets/blog/next-auth-app/cover.jpg
---

**NextAuth.js** is a library to easily and safely implement **OAuth** and **email / passwordless** authentication in **Next.js** apps. NextAuth.js v2 was released in June 2020, and currently v3 is under development. Frequent improvements are evidence of a good product.

Let's try NextAuth.js v2!

**What we will:**

* Create a new Next.js app
* Use NextAuth.js with **SQLite**
* Sign in with Google

## Create a Next.js App

Create a new Next.js app using `create-next-app`, which is named “next-auth-app” in this tutorial:

```bash
yarn create next-app next-auth-app
```

Start the `dev` server and see the result on your browser:

```bash
cd next-auth-app
yarn dev
```

Then, we'll build a simple foundation for implementing authentication.

Overwrite the `index.js` file in the `pages` directory as follows:

```jsx
// pages/index.js

import Layout from '../components/layout';

const Home = () => (
  <Layout>
    <h1>Next Auth App</h1>
    <p>
      This is a sample project that uses{' '}
      <a href={`https://github.com/iaincollins/next-auth`}>NextAuth.js</a> v2 to
      add authentication to <a href={`https://nextjs.org/`}>Next.js</a>.
    </p>
    <p>
      See <a href={`https://next-auth.js.org/`}>next-auth.js.org</a> for more
      information and documentation.
    </p>
  </Layout>
);

export default Home;
```

Create a **Layout** component which will be common across all pages:

```jsx
// components/layout.js

import Head from 'next/head';
import Header from '../components/header';

const Layout = ({ children }) => (
  <>
    <Head>
      <title>Next Auth App</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <Header />

    <main className="container">{children}</main>

    <style jsx global>{`
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          'Helvetica Neue', Arial, Noto Sans, sans-serif, 'Apple Color Emoji',
          'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
      }
      .container {
        max-width: 42rem;
        margin: 0 auto;
        padding: 2rem 1.25rem;
      }
    `}</style>
  </>
);

export default Layout;
```

Create a **Header** component:

```jsx
// components/header.js

import Link from 'next/link';

const Header = () => {
  return (
    <header>
      <nav>
        <Link href="/">
          <a className="logo">
            <span style={{ color: '#f06292' }}>N</span>
            <span style={{ color: '#29b6f6' }}>A</span>
            <span style={{ color: '#8bc34a' }}>A</span>
          </a>
        </Link>

        <p>
          <button className="signInButton">Sign in</button>
        </p>
      </nav>

      <style jsx>{`
        header {
          border-bottom: 1px solid #ccc;
        }

        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 42rem;
          margin: 0 auto;
          padding: 0.2rem 1.25rem;
        }

        .logo {
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .signInButton {
          background-color: #1eb1fc;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.5rem 1rem;
        }

        .signInButton:hover {
          background-color: #1b9fe2;
        }
      `}</style>
    </header>
  );
};

export default Header;
```

Let's take a look at the page:

![Next Auth App](/assets/blog/next-auth-app/screenshot-2020-07-15-17.44.35.png "Next Auth App")

## Use NextAuth.js

Let's add authentication with NextAuth.js to the Next.js app.

### Configuration

First, install `next-auth`:

```bash
yarn add next-auth
```

Next, add **API route**:

* Create a directory called `auth` in `pages/api`.
* Create a file called `[...nextauth].js` in `pages/api/auth`.

```javascript
// pages/api/auth/[...nextauth].js

import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';

const options = {
  site: process.env.SITE || 'http://localhost:3000',

  // Configure one or more authentication providers
  providers: [
    Providers.Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    Providers.Facebook({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    }),
    Providers.Twitter({
      clientId: process.env.TWITTER_ID,
      clientSecret: process.env.TWITTER_SECRET,
    }),
    Providers.GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Providers.Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],

  // A database is optional, but required to persist accounts in a database
  database: process.env.DATABASE_URL,
};

export default (req, res) => NextAuth(req, res, options);
```

Then, create a top-level file called `.env.local` and set up **environment variables**:

```ignore
SITE=http://localhost:3000
GOOGLE_ID=<YOUR GOOGLE ID>
GOOGLE_SECRET=<YOUR GOOGLE SECRET>
FACEBOOK_ID=
FACEBOOK_SECRET=
TWITTER_ID=
TWITTER_SECRET=
GITHUB_ID=
GITHUB_SECRET=
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=NextAuth <noreply@example.com>
DATABASE_URL=sqlite://localhost/:memory:?synchronize=true
```

In this tutorial, we'll sign in with Google as an example. Follow [Setting up OAuth 2.0](https://support.google.com/googleapi/answer/6158849?hl=en) to create an **OAuth 2.0 client ID**. The callback URL is set as `{server}/api/auth/callback/{provider}`. For Google OAuth, use `http://localhost:3000/api/auth/callback/google`.

If you use email sign-in, set `EMAIL_SERVER` and `EMAIL_FROM` correctly. For more information on configuring the SMTP server, check out [Email](https://next-auth.js.org/providers/email) in the [NextAuth.js documentation](https://next-auth.js.org/getting-started/introduction).

In addition, specifying a database is required to use email sign-in and persist user data. For SQLite, set `sqlite://localhost/:memory:?synchronize=true` as above.

Install `sqlite3`:

```bash
yarn add sqlite3
```

### Add Hook

Add the `useSession()` hook provided by NextAuth.js to `components/header.js`, and update it as follows:

```jsx
// components/header.js

import Link from 'next/link';
import { signin, signout, useSession } from 'next-auth/client';

const Header = () => {
  const [session, loading] = useSession();

  return (
    <header>
      <nav>
        <Link href="/">
          <a className="logo">
            <span style={{ color: '#f06292' }}>N</span>
            <span style={{ color: '#29b6f6' }}>A</span>
            <span style={{ color: '#8bc34a' }}>A</span>
          </a>
        </Link>

        <p>
          {!session && (
            <a
              href="/api/auth/signin"
              onClick={(e) => {
                e.preventDefault();
                signin();
              }}
            >
              <button className="signInButton">Sign in</button>
            </a>
          )}
          {session && (
            <>
              <Link href="/profile">
                <a>
                  <span
                    style={{ backgroundImage: `url(${session.user.image})` }}
                    className="avatar"
                  />
                </a>
              </Link>
              <span className="email">{session.user.email}</span>
              <a
                href="/api/auth/signout"
                onClick={(e) => {
                  e.preventDefault();
                  signout();
                }}
              >
                <button className="signOutButton">Sign out</button>
              </a>
            </>
          )}
        </p>
      </nav>

      <style jsx>{`
        header {
          border-bottom: 1px solid #ccc;
        }

        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 42rem;
          margin: 0 auto;
          padding: 0.2rem 1.25rem;
        }

        .logo {
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .avatar {
          border-radius: 2rem;
          float: left;
          height: 2.2rem;
          width: 2.2rem;
          background-color: white;
          background-size: cover;
          border: 2px solid #ddd;
        }

        .email {
          margin-right: 1rem;
          margin-left: 0.25rem;
          font-weight: 600;
        }

        .signInButton,
        .signOutButton {
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.5rem 1rem;
        }

        .signInButton {
          background-color: #1eb1fc;
        }
        .signInButton:hover {
          background-color: #1b9fe2;
        }

        .signOutButton {
          background-color: #333;
        }
        .signOutButton:hover {
          background-color: #555;
        }
      `}</style>
    </header>
  );
};

export default Header;
```

The display switches depending on whether the user is signed in or not.

The `signin()` and `signout()` methods are not required, but they allow the user to return to the page where they started after completing each flow.

Also create a **protected page** for the signed-in user:

```jsx
// pages/profile.js

import { useSession } from 'next-auth/client';
import Layout from '../components/layout';

const Profile = () => {
  const [session, loading] = useSession();

  if (loading) return <div>loading...</div>;
  if (!session) return <div>no session</div>;

  return (
    <Layout>
      {session && (
        <>
          <img src={session.user.image} className="avatar" />
          <h1>{session.user.name}</h1>
        </>
      )}

      <style jsx>{`
        .avatar {
          width: 220px;
          border-radius: 10px;
        }
      `}</style>
    </Layout>
  );
};

export default Profile;
```

### Add Provider

> Using the supplied React `<Provider>` allows instances of `useSession()` to share the session object across components, by using **React Context** under the hood.
>
> This improves performance, reduces network calls and avoids page flicker when rendering. It is highly recommended and can be easily added to all pages in Next.js apps by using `pages/_app.js`.

As noted in the [NextAuth.js documentation](https://next-auth.js.org/getting-started/client#provider). Follow this to create the `_app.js` page and add the `<Provider>`:

```jsx
// pages/_app.js

import { Provider } from 'next-auth/client';

const App = ({ Component, pageProps }) => {
  const { session } = pageProps;
  return (
    <Provider options={{ site: process.env.SITE }} session={session}>
      <Component {...pageProps} />
    </Provider>
  );
};

export default App;
```

That's it!

## Sign In with Google

Now, let's sign in with Google OAuth.

First, restart the `dev` server to load the environment variables. Then, go to `http://localhost:3000/` and click the `Sign in` button:

![Sign In with OAuth or Email](/assets/blog/next-auth-app/screenshot-2020-07-15-17.44.55.png "Sign In with OAuth or Email")

Try signing in with Google. After successful sign-in, you should see:

![Signed In with Google](/assets/blog/next-auth-app/screenshot-2020-07-15-17.47.55.png "Signed In with Google")

Click the avatar icon to go to the profile page:

![Profile Page](/assets/blog/next-auth-app/screenshot-2020-07-15-17.48.10.png "Profile Page")

Awesome! We were able to implement authentication with just a few lines of code.

**What else to check:**

* Sign out
* Sign in with email

By the way, if you try to sign in with Google (e.g. example@gmail.com) after signing in with email (e.g. example@gmail.com) and creating an account, the result will be as follows:

![Sign In Failed](/assets/blog/next-auth-app/screenshot-2020-07-15-17.59.22.png "Sign In Failed")

Conversely, if you sign in with Google first, and then sign in with the same email address next time, you will be signed in with Google. This will not create duplicate accounts. Nice!

## Conclusion

Implementing authentication is one of the most difficult tasks, especially for beginners in programming. In particular, you must pay close attention to security. NextAuth.js is security focused and super easy to use. It's really worth it!

You can find [the code for this tutorial on GitHub.](https://github.com/kjmczk/next-auth-app)