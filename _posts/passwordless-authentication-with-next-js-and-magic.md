---
path: nextjs-magic
coverImage: /assets/blog/nextjs-magic/cover.jpg
date: '2020-07-10T02:01:22.477Z'
title: Passwordless Authentication with Next.js and Magic
description: Implementing cookie-based, passwordless authentication with Magic
  in a Next.js app.
author:
  name: Koji Mochizuki
  picture: /assets/blog/author/avatar.png
ogImage:
  url: /assets/blog/nextjs-magic/cover.jpg
---

**Magic** is an SDK for developers using the **Tezos** blockchain. The Magic SDK makes it easy to implement passwordless authentication in your apps. The created user authentication data is stored securely on the Tezos blockchain. I've tried various ways to implement user authentication, but none is as useful as Magic. It's exactly magic!

In this tutorial, we'll build an app based on [with-magic](https://github.com/vercel/next.js/tree/canary/examples/with-magic) from the **Next.js** examples. Next.js is one of my favorite React frameworks right now, with lots of great features of its own, yet light and fast.

**What we will:**

* Create a Magic account
* Create a new Next.js app
* Set up environment variables using Magic API keys
* Create an auth backend using **@magic-sdk/admin**, **cookie** and **@hapi/iron**
* Create a login page, other pages and components

## Create a Magic Account

Go to the [Magic](https://magic.link/) website and create an account. By default, "Developer Plan" is set, but you can select "Free Plan". After creating an account, you will be taken to the Magic Dashboard:

![Magic Dashboard](/assets/blog/nextjs-magic/screenshot-2020-07-03-13.35.52.png "Magic Dashboard")

A Magic app and API keys are automatically generated.

You can change the app name in "Settings":

![Magic App Name](/assets/blog/nextjs-magic/screenshot-2020-07-03-13.39.57.png "Magic App Name")

This app name will be displayed as your app name in the confirmation email.

The authentication flow we are about to implement is the same as when we just created a Magic Account.

## Create a Next.js App

Create a new Next.js app using `create-next-app`, which is named "nextjs-magic" in this tutorial:

```bash
yarn create next-app nextjs-magic
```

The easiest way is to use the example as a template, but this time create a default app.

```bash
cd nextjs-magic
yarn dev
```

Start the dev server and see the result on your browser.

## Set Up Environment Variables

Create a new file named `.env.local` in the root directory and set the following environment variables:

```ignore
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=<YOUR MAGIC PUBLISHABLE KEY>
MAGIC_SECRET_KEY=<YOUR MAGIC SECRET KEY>
```

The keys can be obtained from the Magic Dashboard.

For more information on environment variables, see the [Environment Variables](https://nextjs.org/docs/basic-features/environment-variables) document in Next.js.

## Install Dependencies

Install the required dependencies in advance:

```bash
yarn add magic-sdk @magic-sdk/admin @hapi/iron cookie swr
```

* `magic-sdk`: Magic Authentication JavaScript SDK for web browsers.
* `@magic-sdk/admin`: Integrating a Node.js app with Magic will require this server-side package.
* `@hapi/iron`: A cryptographic utility for sealing a JSON object.
* `cookie`: Serialize a cookie name-value pair and an optional object. Parse a cookie header string and returning an object.
* `swr`: A React Hooks library for remote data fetching.

## Create an Auth Backend

First, we'll prepare some directories.

* Create a top-level directory named `src`.
* Inside it, create directories named `components` and `utils`.
* Move the existing `pages` directory to the same level as them.

The directory structure looks like this:

```
src/
├─ components/
├─ pages/
└─ utils/
```

The `src` directory is not required, but I prefer it.

### Magic Admin SDK Instance

Create a new file with the following inside the `utils` directory:

```javascript
// utils/magic.js

import { Magic } from '@magic-sdk/admin';

export const magic = new Magic(process.env.MAGIC_SECRET_KEY);
```

The Magic Admin SDK Instance will allow your app to interact with Magic admin APIs.

### Functions to Handle Cookies

We'll use **Cookies** to keep a user logged-in. Let's create some functions to store an auth cookie, remove it, or parse it.

Create a new file with the following inside the `utils` directory:

```javascript
// utils/auth-cookies.js

import { serialize, parse } from 'cookie';

const TOKEN_NAME = 'token';
const MAX_AGE = 60 * 60 * 8; // 8 hours

export function setTokenCookie(res, token) {
  const cookie = serialize(TOKEN_NAME, token, {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
  res.setHeader('Set-Cookie', cookie);
}

export function removeTokenCookie(res) {
  const cookie = serialize(TOKEN_NAME, '', {
    maxAge: -1,
    path: '/',
  });
  res.setHeader('Set-Cookie', cookie);
}

export function parseCookies(req) {
  // For API Routes we don't need to parse the cookies.
  if (req.cookies) return req.cookies;

  // For pages we do need to parse the cookies.
  const cookie = req.headers?.cookie;
  return parse(cookie || '');
}

export function getTokenCookie(req) {
  const cookies = parseCookies(req);
  return cookies[TOKEN_NAME];
}
```

A cookie with the `httpOnly` attribute is inaccessible to client-side scripts, which helps prevent **XSS** attacks.

Send a `Set-Cookie` header with the response using `res.setHeader('Set-Cookie', value)`.

### Functions using Iron

We'll use **Iron** to encrypt and decrypt user session data.

Create a new file with the following inside the `utils` directory:

```javascript
// utils/iron.js

import Iron from '@hapi/iron';
import { getTokenCookie } from './auth-cookies';

export function encryptSession(session) {
  return Iron.seal(session, process.env.TOKEN_SECRET, Iron.defaults);
}

export function getSession(req) {
  const token = getTokenCookie(req);
  return token && Iron.unseal(token, process.env.TOKEN_SECRET, Iron.defaults);
}
```

Add `TOKEN_SECRET` (password) used for encryption and decryption to `.env.local`:

```ignore
...
TOKEN_SECRET=some_not_random_password_that_is_at_least_32_characters
```

### Hook to Fetch User Data

Create a new file with the following inside the `utils` directory:

```javascript
// utils/hooks.js

import { useEffect } from 'react';
import Router from 'next/router';
import useSWR from 'swr';

const fetcher = (url) =>
  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      return { user: data.user || null };
    });

export function useUser({ redirectTo, redirectIfFound } = {}) {
  const { data, error } = useSWR('/api/user', fetcher);
  const user = data?.user;
  const finished = Boolean(data);
  const hasUser = Boolean(user);

  useEffect(() => {
    if (!redirectTo || !finished) return;
    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !hasUser) ||
      // If redirectIfFound is also set, redirect if the user was found.
      (redirectIfFound && hasUser)
    ) {
      Router.push(redirectTo);
    }
  }, [redirectTo, redirectIfFound, finished, hasUser]);

  return error ? null : user;
}
```

The `redirectTo` and `redirectIfFound` properties are used to redirect depending on the presence or absence of the user.

**SWR** is a React Hooks library made by **Vercel**. Check out the [SWR](https://swr.vercel.app/) documentation to learn more.

## Create APIs

Next.js comes with **API routes** to easily build your own **API**. Any file in `pages/api` will be treated as an API endpoint.

### Login API

Create a new file with the following inside the `pages/api` directory:

```javascript
// pages/api/login.js

import { magic } from '../../utils/magic';
import { encryptSession } from '../../utils/iron';
import { setTokenCookie } from '../../utils/auth-cookies';

export default async function login(req, res) {
  try {
    const didToken = req.headers.authorization.substring(7);
    const metadata = await magic.users.getMetadataByToken(didToken);
    const session = { ...metadata };
    // The token is a string with the encrypted session
    const token = await encryptSession(session);
    setTokenCookie(res, token);
    res.status(200).send({ done: true });
  } catch (error) {
    res.status(error.status || 500).end(error.message);
  }
}
```

Since we'll use **Bearer authentication**, use the `substring()` method and set the starting index to `7` to get only the **DID token** without the "Bearer " string. [Learn more about Decentralized ID (DID) tokens](https://docs.magic.link/decentralized-id).

Then, the user information is retrieved by the DID token, encrypted, and set in a cookie.

### Logout API

Create a new file with the following inside the `pages/api` directory:

```javascript
// pages/api/logout.js

import { magic } from '../../utils/magic';
import { getSession } from '../../utils/iron';
import { removeTokenCookie } from '../../utils/auth-cookies';

export default async function logout(req, res) {
  const session = await getSession(req);
  await magic.users.logoutByIssuer(session.issuer);
  removeTokenCookie(res);
  res.writeHead(302, { Location: '/' });
  res.end();
}
```

Logs the user out of all valid browser sessions, removes the cookie and redirects to the home page.

### User API

Create a new file with the following inside the `pages/api` directory:

```javascript
// pages/api/user.js

import { getSession } from '../../utils/iron';

export default async function user(req, res) {
  const session = await getSession(req);
  // After getting the session you may want to fetch for the user instead
  // of sending the session's payload directly, this example doesn't have a DB
  // so it won't matter in this case
  res.status(200).json({ user: session || null });
}
```

A simple API route that just handles the session.

## Create Pages and Components

Note that in Next.js, each page is associated with a route based on its filename.

### Home Page

First, let's create a **Home** page.

Overwrite the `index.js` file in the `pages` directory as follows:

```jsx
// pages/index.js

import Layout from '../components/layout';

const Home = () => {
  return (
    <Layout>
      <h1 className="title">Welcome to Next Magic!</h1>

      <p className="description">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>

      <style jsx>{`
        .title {
          margin: 0;
          font-size: 3rem;
        }
        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }
      `}</style>
    </Layout>
  );
};

export default Home;
```

### Layout Component

Next, we'll create a **Layout** component which will be common across all pages.

Create a new file with the following inside the `components` directory:

```jsx
// components/layout.js

import Head from 'next/head';
import Header from './header';

const Layout = ({ children }) => (
  <>
    <Head>
      <title>Next Magic</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <Header />

    <main>
      <div className="container">{children}</div>
    </main>

    <footer>2020 Next Magic</footer>

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
      footer {
        width: 100%;
        height: 100px;
        border-top: 1px solid #eaeaea;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `}</style>
  </>
);

export default Layout;
```

### Header Component

Also create a **Header** component.

Create a new file with the following inside the `components` directory:

```jsx
// components/header.js

import Link from 'next/link';
import { useUser } from '../utils/hooks';

const Header = () => {
  const user = useUser();

  return (
    <header>
      <nav>
        <Link href="/">
          <a>Next Magic</a>
        </Link>

        <ul>
          {user ? (
            <>
              <li>
                <Link href="/profile">
                  <a>Profile</a>
                </Link>
              </li>
              <li>
                <a href="/api/logout">Logout</a>
              </li>
            </>
          ) : (
            <li>
              <Link href="/login">
                <a>Login</a>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <style jsx>{`
        header {
          color: #fff;
          background-color: #333;
        }
        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 42rem;
          margin: 0 auto;
          padding: 0.2rem 1.25rem;
        }
        ul {
          display: flex;
          list-style: none;
          margin-left: 0;
          padding-left: 0;
        }
        li {
          margin-right: 1rem;
        }
        li:first-child {
          margin-left: auto;
        }
        a {
          color: #fff;
          text-decoration: none;
        }
      `}</style>
    </header>
  );
};

export default Header;
```

The navigation display will toggle each time the user logs in or out.

### Profile Page

Then, create a **Profile** page for the logged-in user.

Create a new file with the following inside the `pages` directory:

```jsx
// pages/profile.js

import Layout from '../components/layout';
import { useUser } from '../utils/hooks';

const Profile = () => {
  const user = useUser({ redirectTo: '/login' });

  return (
    <Layout>
      <h1>Profile</h1>

      {user && (
        <>
          <p>Your session:</p>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </>
      )}
    </Layout>
  );
};

export default Profile;
```

If the user is logged in, the session data will be displayed. If not, redirect to the login page.

### Login Page

Finally, create a **Login** page and a **LoginForm** component.

Create a new file with the following inside the `pages` directory:

```jsx
// pages/login.js

import Layout from '../components/layout';
import LoginForm from '../components/login-form';
import { useUser } from '../utils/hooks';

const Login = () => {
  useUser({ redirectTo: '/', redirectIfFound: true });

  return (
    <Layout>
      <div className="login">
        <LoginForm />
      </div>

      <style jsx>{`
        .login {
          max-width: 21rem;
          margin: 0 auto;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #fafafa;
        }
      `}</style>
    </Layout>
  );
};

export default Login;
```

If the user is logged in, redirect to the home page.

### LoginForm Component

Create a new file with the following inside the `components` directory:

```jsx
// components/login-form.js

import { useState } from 'react';
import Router from 'next/router';
import { Magic } from 'magic-sdk';
import { useForm } from 'react-hook-form';

const LoginForm = () => {
  const [errorMessage, setErrorMessage] = useState('');

  const { handleSubmit, register, errors } = useForm();

  const onSubmit = handleSubmit(async (formData) => {
    if (errorMessage) setErrorMessage('');

    try {
      const magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY);
      const didToken = await magic.auth.loginWithMagicLink({
        email: formData.email,
      });
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + didToken,
        },
        body: JSON.stringify(formData),
      });
      if (res.status === 200) {
        Router.push('/');
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
      setErrorMessage(error.message);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label>Email</label>
        <input
          type="email"
          name="email"
          placeholder="hello@example.com"
          ref={register({ required: 'Email is required' })}
        />
        {errors.email && (
          <div role="alert" className="error">
            {errors.email.message}
          </div>
        )}
        {errorMessage && (
          <div role="alert" className="error">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="submit">
        <button type="submit">Sign up / Log in</button>
      </div>

      <style jsx>{`
        label {
          font-weight: 600;
        }
        input {
          width: 100%;
          padding: 8px;
          margin: 0.3rem 0 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .submit > button {
          width: 100%;
          color: #fff;
          padding: 0.5rem 1rem;
          cursor: pointer;
          background: #3f51b5;
          border: none;
          border-radius: 4px;
        }
        .submit > button:hover {
          background: #5c6bc0;
        }
        .error {
          color: brown;
          margin-bottom: 1rem;
        }
      `}</style>
    </form>
  );
};

export default LoginForm;
```

**React Hook Form** is a form validation library and one of my recent favorites. The above form is so simple that it doesn't really need much, but we will use it experimentally.

Don't forget to install React Hook Form:

```bash
yarn add react-hook-form
```

[Learn more about React Hook Form](https://react-hook-form.com/).

## Log In

First, restart the dev server to load the environment variables.

Now, go to the login page:

![Login Page](/assets/blog/nextjs-magic/screenshot-2020-07-10-12.38.48.png "Login Page")

Wow, it's a very slim form without a password.

Sign up (and log in) with your valid email address. Follow the same procedure as when you created your Magic account.

Once you have successfully logged in, go to the profile page:

![Profile Page](/assets/blog/nextjs-magic/screenshot-2020-07-10-12.42.16.png "Profile Page")

Try reloading your browser. Your logged-in should be kept. That's because the token is stored in a cookie:

![Cookie](/assets/blog/nextjs-magic/screenshot-2020-07-10-12.50.37.png "Cookie")

Check it out with the dev tools in your browser.

**What else to check:**

* Go to the login page while logged in
* Log out
* Go to the profile page without being logged in
* Log in with an empty or invalid value

## Conclusion

In this tutorial, we built a Next.js app and implemented cookie-based, passwordless authentication using Magic.

I've tried various ways to implement user authentication, and found Magic to be the easiest and future-proof. I'm currently working on integrating **FaunaDB** into this app. I would like to publish the tutorial in the near future.

You can find [the code for this tutorial on GitHub](https://github.com/kjmczk/nextjs-magic) (based on [with-magic](https://github.com/vercel/next.js/tree/master/examples/with-magic)).