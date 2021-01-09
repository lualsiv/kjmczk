---
path: next-fauna-auth
coverImage: /assets/blog/nextjs-faunadb-authentication/cover.jpg
date: '2020-09-08T06:55:08.132Z'
title: Implement FaunaDB Authentication in Next.js and GraphQL App
description: How to implement cookie-based user authentication using FaunaDB
  built-in auth management in a Next.js, FaunaDB and GraphQL app.
author:
  name: Koji Mochizuki
  picture: /assets/blog/author/avatar.png
ogImage:
  url: /assets/blog/nextjs-faunadb-authentication/cover.jpg
---

Implementing user authentication in an application is the most sensitive part, and honestly I don't want to do it. However, it is unavoidable because user authentication is a necessary feature for many applications. **FaunaDB** offers built-in identity, authentication, and password management. Thanks to them, you don't have to use **JWT** or hash your password with **bcrypt**, which not only simplifies the process of implementing authentication, but also reduces the amount of code and makes your app slimmer.

In this tutorial, we'll use the FaunaDB features to implement **cookie-based** authentication in a **Next.js** app. You can use the app created in [the previous tutorial](https://kjmczk.dev/blog/crud-app-with-next-js-faunadb-and-graphql/) as a basis. The app mainly uses **GraphQL**, but for authentication, we will use **FQL** and Next.js basic **API Routes**.

**What we will:**

* Create an **index** to find user documents
* Create **roles** for guest and authenticated users
* Create an **access key** for guests
* Create functions to handle cookies
* Implement sign-up, login, and logout features
* Test authentication and access restrictions

Please note that this article is likely to be lengthy, so I will omit the CSS files, but they are on [GitHub](https://github.com/kjmczk/next-fauna-auth).

## Preparations

### Install Dependencies

If you copied the project with `git clone`, run `yarn install` to install all the dependencies listed in `package.json` into `node_modules`:

```bash
yarn install
```

### Update Env File

Open `.env.local` in the root of your project and update it as follows:

```ignore
NEXT_PUBLIC_FAUNA_GUEST_SECRET=
FAUNA_GUEST_SECRET=
```

If you don't have this file, create it in the root of your project.

### Update GraphQL Schema

Open `schema.gql` in the root of your project and update it as follows:

```graphql
type Todo {
  task: String!
  completed: Boolean!
  owner: User!
}

type User {
  email: String! @unique
  todos: [Todo!] @relation
}

type Query {
  allTodos: [Todo!]
}
```

A simple `User` type with only `email` and `todos` fields has been added. `User` and `Todo` have a [one-to-many](https://docs.fauna.com/fauna/current/api/graphql/relations#one2many) relationship.

## Create a Database

If you don't have a FaunaDB account, go to the [Fauna sign-up page](https://dashboard.fauna.com/accounts/register) and create your account.

Create a new database in the FaunaDB Console. I'll name it "next-fauna-auth". You don't have to use the same name.

### Import the GraphQL Schema

As before, import the schema on the GraphQL Playground screen. Collections and indexes are created automatically when you import the schema:

![Collections and Indexes](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-28-10.24.05.png "Collections and Indexes")

`todo_user_by_user` and `unique_User_email` are not used in this tutorial.

## Create a New Index

Indexes help you find the document(s) you want. Let's create an index called `user_by_email` to use when signing up and logging in:

* Go to "SHELL" in the left menu of the FaunaDB Console.
* Copy the following code, paste it into the Shell and run the query.

```sql
CreateIndex({
  name: "user_by_email",
  unique: true,
  serialized: true,
  source: Collection("User"),
  terms: [{ field: ["data", "email"], transform: "casefold" }]
})
```

![Create a New Index](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-28-17.33.32.png "Create a New Index")

If there are no errors, the result is returned as above. `unique_User_email` and `user_by_email` are very similar, but `user_by_email` has `transform: "casefold"` in the `terms` field. When querying the index, the `casefold` function converts the query terms to lowercase. At the time of this writing, updating the `terms` field of the index is not allowed, so if you need customization, you have no choice but to create a new index.

## Create a Guest Role

FaunaDB has built-in roles called "admin" and "server", but you can also create [user-defined roles](https://docs.fauna.com/fauna/current/security/roles). Many access is allowed to the built-in roles, so it is necessary to create user-defined roles to control access. First, we will create a "Guest" role:

* Go to "SECURITY" in the left menu of the FaunaDB Console.
* Click "MANAGE ROLES", then "NEW ROLE".
* Add the `User` collection and check the "Read" and "Create" actions.
* Add the `user_by_email` index, and check the "Read" action.
* Click the “SAVE” button.

![Guest Role](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-09-07-13.41.59.png "Guest Role")

Guests only need to be able to see if the user exists and create a user account.

## Create an Access Key

Let's create an [access key](https://docs.fauna.com/fauna/current/security/keys) using the Guest role we just created. Guests don't have access tokens, so they use the secret that corresponds to the key to access the FaunaDB API.

* Go to “SECURITY” and click “NEW KEY”.
* Select the Guest role and click the “SAVE” button.

![Create an access key for guests](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-28-10.50.48.png "Create an access key for guests")

After creating the key, you should see the **key’s secret**. Copy the secret and paste it into `.env.local` in your project:

```ignore
NEXT_PUBLIC_FAUNA_GUEST_SECRET=<YOUR KEY'S SECRET>
FAUNA_GUEST_SECRET=<YOUR KEY'S SECRET>
```

> **NOTE:** To load the environment variables, you need to restart the `dev` server.

## Instantiate a Client

* Create a new file called `fauna-client.js` in the `utils` directory.
* Instantiate two types of clients.

```javascript
// utils/fauna-client.js

import faunadb from 'faunadb';

export const guestClient = new faunadb.Client({
  secret: process.env.FAUNA_GUEST_SECRET,
});

export const authClient = (secret) =>
  new faunadb.Client({
    secret,
  });
```

As the name implies, `guestClient` is for guests and `authClient` is for authenticated users. `guestClient` is instantiated with the access key and used for sign-up and login. `authClient` is instantiated with an access token and used to get the user data and logout.

## Update the GraphQL Client

Open `utils/graphql-client.js` and update it as follows:

```javascript
// utils/graphql-client.js

import { GraphQLClient } from 'graphql-request';

const endpoint = 'https://graphql.fauna.com/graphql';

export const graphQLClient = (token) => {
  const secret = token || process.env.NEXT_PUBLIC_FAUNA_GUEST_SECRET;

  return new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${secret}`,
      // 'X-Schema-Preview': 'partial-update-mutation', // move to `pages/index.js`
    },
  });
};
```

If the user is logged in, send the `token` through the `authorization` header. Otherwise, send the key's secret.

Due to this update, some files need to be updated:

* `components/edit-form.js`
* `pages/index.js`
* `pages/new.js`
* `pages/todo/[id].js`

`graphQLClient` needs to take the `token` variable as an argument, so update it as follows:

```javascript
// await graphQLClient.request(...);
await graphQLClient(token).request(...);
```

In addition, move the following code in `pages/index.js` inside the `Home` function:

```javascript
// pages/index.js

const Home = () => {
  const fetcher = async (query) => await graphQLClient(token).request(query);
  ...
};
```

Also, a custom HTTP header `X-Schema-Preview` is moved from `utils/graphql-client.js` to `pages/index.js`. Set it in the `toggleTodo` function as follows:

```javascript
// pages/index.js

const toggleTodo = async (id, completed) => {
  ...
  try {
    await graphQLClient(token)
      .setHeader('X-Schema-Preview', 'partial-update-mutation')
      .request(mutation, variables);
    ...
  }
};
```

In **graphql-request**, I found out that to set headers after the GraphQLClient has been initialised, you can use `setHeader` (or `setHeaders`) function(s). This makes sense because the `X-Schema-Preview` header is not used anywhere else.

## Create Functions to Handle Cookies

We'll create three functions to set, get and remove auth cookies.

Create a new file called `auth-cookies.js` in the `utils` directory:

```javascript
// utils/auth-cookies.js

import { serialize, parse } from 'cookie';

const TOKEN_NAME = 'faunaToken';
const MAX_AGE = 60 * 60 * 8; // 8 hours

export function setAuthCookie(res, token) {
  const cookie = serialize(TOKEN_NAME, token, {
    httpOnly: true,
    maxAge: MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  res.setHeader('Set-Cookie', cookie);
}

export function removeAuthCookie(res) {
  const cookie = serialize(TOKEN_NAME, '', {
    maxAge: -1,
    path: '/',
  });

  res.setHeader('Set-Cookie', cookie);
}

export function getAuthCookie(req) {
  // for API Routes, we don't need to parse the cookies
  if (req.cookies) return req.cookies[TOKEN_NAME];

  // for pages, we do need to parse the cookies
  const cookies = parse(req.headers.cookie || '');
  return cookies[TOKEN_NAME];
}
```

There has been a lot of discussion about where to store secret data, but my personal opinion is that storing it in a cookie with the `httpOnly` and `secure` attributes is the most secure. However, that is just my opinion at the moment, and more research is needed.

Don't forget to install [cookie](https://github.com/jshttp/cookie):

```bash
yarn add cookie
```

## Use getServerSideProps to Get Cookies

From Next.js 9.3, one of the data fetching methods called [getServerSideProps](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering) is provided. `getServerSideProps` only runs on server-side. And you can write server-side code directly in `getServerSideProps` like this:

```javascript
// pages/index.js

import { getAuthCookie } from '../utils/auth-cookies';

const Home = ({ token }) => {
  ...
};

export async function getServerSideProps(ctx) {
  const token = getAuthCookie(ctx.req);
  return { props: { token: token || null } };
}

export default Home;
```

Note that `getServerSideProps` is used outside the default function of the page component. The `getServerSideProps` function takes an object that contains several keys, such as `req` and `res`. As above, the retrieved data is passed to the page component as props.

Let's update `pages/new.js` and `pages/todo/[id].js` in the same way. However, `pages/todo/[id].js` needs to pass the `token` to the `EditForm` component:

```jsx
// pages/todo/[id].js

<EditForm defaultValues={data.findTodoByID} id={id} token={token} />
```

Then, update `components/edit-form.js` as follows:

```javascript
// components/edit-form.js

const EditForm = ({ defaultValues, id, token }) => {
  ...
};
```

Now we're ready to start the main work.

## Implement Signup

First, implement the sign-up feature.

### Create a Signup API

* Create a directory called `api` in the `pages` directory (if you don't have it).
* Create a file called `signup.js` in `pages/api`.

```javascript
// pages/api/signup.js

import { query as q } from 'faunadb';
import { guestClient } from '../../utils/fauna-client';
import { setAuthCookie } from '../../utils/auth-cookies';

export default async function signup(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and Password not provided');
  }

  try {
    const existingEmail = await guestClient.query(
      // Exists returns boolean, Casefold returns normalize string
      q.Exists(q.Match(q.Index('user_by_email'), q.Casefold(email)))
    );

    if (existingEmail) {
      return res.status(400).send(`Email ${email} already exists`);
    }

    const user = await guestClient.query(
      q.Create(q.Collection('User'), {
        credentials: { password },
        data: { email },
      })
    );

    if (!user.ref) {
      return res.status(404).send('user ref is missing');
    }

    const auth = await guestClient.query(
      q.Login(user.ref, {
        password,
      })
    );

    if (!auth.secret) {
      return res.status(404).send('auth secret is missing');
    }

    setAuthCookie(res, auth.secret);

    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(error.requestResult.statusCode).send(error.message);
  }
}
```

FaunaDB provides its own query language called [Fauna Query Language (FQL)](https://docs.fauna.com/fauna/current/api/fql/). FQL provides many [built-in functions](https://docs.fauna.com/fauna/current/api/fql/functions) that you can use to query and modify your database. They can be used like `q.Create()` via the `query` module of FaunaDB's [JavaScript driver](https://docs.fauna.com/fauna/current/drivers/javascript). And they are used through the FaunaDB client.

I'll simply explain the sign-up flow: First, check if the requested email matches existing data. The `Exists` function simply returns a boolean value. Next, if no data with the email exists, a user document will be created. The requested password is set in the `credentials` field of the `Create` function. This will securely store the BCrypt hash of the password. Then, the `Login` function will create an authentication token for the user based on the `password`. Finally, the authentication token is stored in a cookie.

Recall that we set the `Casefold` function to the `terms` field of the `user_by_email` index. The values of the field (email) specified in `terms` are converted to lowercase, so the requested email address must also be converted to lowercase using the `Casefold` function. Essentially, this technique is useful for fields that require mixed case, such as Username. Email addresses don't need to be stored in uppercase, just convert them to lowercase when creating a user.

### Create a Signup Page

Create a new file called `signup.js` in the `pages` directory:

```jsx
// pages/signup.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Layout from '../components/layout';
import utilStyles from '../styles/utils.module.css';

const Signup = () => {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState('');

  const { handleSubmit, register, watch, errors } = useForm();

  const onSubmit = handleSubmit(async (formData) => {
    if (errorMessage) setErrorMessage('');

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/');
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  });

  return (
    <Layout>
      <h1>Sign Up</h1>

      <form onSubmit={onSubmit} className={utilStyles.form}>
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="e.g. john@example.com"
            ref={register({ required: 'Email is required' })}
          />
          {errors.email && (
            <span role="alert" className={utilStyles.error}>
              {errors.email.message}
            </span>
          )}
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="e.g. John-1234"
            ref={register({ required: 'Password is required' })}
          />
          {errors.password && (
            <span role="alert" className={utilStyles.error}>
              {errors.password.message}
            </span>
          )}
        </div>

        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            name="password2"
            placeholder="e.g. John-1234"
            ref={register({
              validate: (value) =>
                value === watch('password') || 'Passwords do not match',
            })}
          />
          {errors.password2 && (
            <span role="alert" className={utilStyles.error}>
              {errors.password2.message}
            </span>
          )}
        </div>

        <div className={utilStyles.submit}>
          <button type="submit">Sign up</button>
        </div>
      </form>

      {errorMessage && (
        <p role="alert" className={utilStyles.errorMessage}>
          {errorMessage}
        </p>
      )}
    </Layout>
  );
};

export default Signup;
```

The page sends a request using the Fetch API, and if the `ok` property of the returned Response instance is true, it takes you to the home page. It's very simple.

### Test Signup

Let's test the sign-up feature. Go to the Signup page (<http://localhost:3000/signup>) and create a user:

![Create a user on the Signup page](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-12.02.21.png "Create a user on the Signup page")

The user was successfully created and the auth cookie was set:

![Auth cookie set](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-12.08.16.png "Auth cookie set")

However, the page is displaying an error message. We haven't created a role for authenticated users yet.

## Create a Auth Role

Let's create a "Auth" role:

* Add the `Todo` and `User` collections.
* Check the "Read", "Write", "Create" and "Delete" actions of the `Todo` collection.
* Check the "Read" action of the `User` collection.
* Add the `allTodos` index and check the "Read" action.

![Auth Role](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-18.06.34.png "Auth Role")

This is the simplest setting, but it allows users to work with other users' documents. It's not good. Let's customize the value of each action:

![Customize the value of the `Read` action](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-12.51.01.png "Customize the value of the `Read` action")

To customize the values of the actions, create a lambda predicate function as above. Templates are prepared for each action in advance, so you can edit and use them. This time, all you have to do is uncomment.

Edit "Write", "Create" and "Delete" in the same way:

![Customize the value of the `Write` action](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-12.51.19.png "Customize the value of the `Write` action")

![Customize the value of the `Create` action](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-12.51.34.png "Customize the value of the `Create` action")

![Customize the value of the `Delete` action](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-12.51.44.png "Customize the value of the `Delete` action")

Now users can only work with their own documents.

Finally, you need to add the User collection to Membership of the Auth role:

* Move to "MEMBERSHIP" and add the User collection.
* Click the “SAVE” button.

![Add member collection](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-12.46.26.png "Add member collection")

This will apply the Auth role to authenticated users.

Now, go back to the home page again. The error should be gone.

Please remove the auth cookie from your browser manually before moving on to the next section.

## Implement Login & Logout

### Create a Login API

Create a file called `login.js` in `pages/api`:

```javascript
// pages/api/login.js

import { query as q } from 'faunadb';
import { guestClient } from '../../utils/fauna-client';
import { setAuthCookie } from '../../utils/auth-cookies';

export default async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and Password not provided');
  }

  try {
    const auth = await guestClient.query(
      q.Login(q.Match(q.Index('user_by_email'), q.Casefold(email)), {
        password,
      })
    );

    if (!auth.secret) {
      return res.status(404).send('auth secret is missing');
    }

    setAuthCookie(res, auth.secret);

    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(error.requestResult.statusCode).send(error.message);
  }
}
```

It's almost the same as the latter part of the Signup API. There is nothing new.

### Create a Logout API

Create a file called `logout.js` in `pages/api`:

```javascript
// pages/api/logout.js

import { query as q } from 'faunadb';
import { authClient } from '../../utils/fauna-client';
import { getAuthCookie, removeAuthCookie } from '../../utils/auth-cookies';

export default async function logout(req, res) {
  const token = getAuthCookie(req);

  // already logged out
  if (!token) return res.status(200).end();

  try {
    await authClient(token).query(q.Logout(false));
    removeAuthCookie(res);
    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(error.requestResult.statusCode).send(error.message);
  }
}
```

To log out, just use the `Logout` function. If its parameter is `false`, only the token used in this request is deleted. Otherwise, all tokens associated with the user ID are deleted. It means logging out of all devices of the user. After logging out, the auth cookie is removed.

### Create a User API

We'll also create an API route to retrieve the authenticated user's data.

Create a file called `user.js` in `pages/api`:

```javascript
// pages/api/user.js

import { query as q } from 'faunadb';
import { authClient } from '../../utils/fauna-client';
import { getAuthCookie } from '../../utils/auth-cookies';

export default async function user(req, res) {
  const token = getAuthCookie(req);

  if (!token) {
    return res.status(401).send('Auth cookie not found');
  }

  try {
    const { ref, data } = await authClient(token).query(q.Get(q.Identity()));
    res.status(200).json({ ...data, id: ref.id });
  } catch (error) {
    console.error(error);
    res.status(error.requestResult.statusCode).send(error.message);
  }
}
```

The `Identity` function returns the ref of the document associated with the `token`, and the `Get` function uses the ref to return the corresponding document. We also need the `id`, so include it in the response data.

### Create a Login Page

Create a file called `login.js` in the `pages` directory:

```jsx
// pages/login.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Layout from '../components/layout';
import utilStyles from '../styles/utils.module.css';

const Login = () => {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState('');

  const { handleSubmit, register, errors } = useForm();

  const onSubmit = handleSubmit(async (formData) => {
    if (errorMessage) setErrorMessage('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/');
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  });

  return (
    <Layout>
      <h1>Log In</h1>

      <form onSubmit={onSubmit} className={utilStyles.form}>
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            ref={register({ required: 'Email is required' })}
          />
          {errors.email && (
            <span role="alert" className={utilStyles.error}>
              {errors.email.message}
            </span>
          )}
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            ref={register({ required: 'Password is required' })}
          />
          {errors.password && (
            <span role="alert" className={utilStyles.error}>
              {errors.password.message}
            </span>
          )}
        </div>

        <div className={utilStyles.submit}>
          <button type="submit">Log in</button>
        </div>
      </form>

      {errorMessage && (
        <p role="alert" className={utilStyles.errorMessage}>
          {errorMessage}
        </p>
      )}
    </Layout>
  );
};

export default Login;
```

It's almost the same as the Signup page.

### Create a Header Component

Before testing login and logout, create a "header" component. It's important for user authentication.

Create a file called `header.js` in the `components` directory:

```jsx
// components/header.js

import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import styles from './header.module.css';

const Header = () => {
  const router = useRouter();
  
  const fetcher = (url) => fetch(url).then((r) => r.json());

  const { data: user, mutate: mutateUser } = useSWR('/api/user', fetcher);

  const logout = async () => {
    const res = await fetch('/api/logout');
    if (res.ok) {
      mutateUser(null);
      router.push('/login');
    }
  };

  return (
    <div className={styles.header}>
      <header>
        <nav>
          <Link href="/">
            <a>Home</a>
          </Link>

          <ul>
            {user ? (
              <>
                <li>
                  <Link href="/profile">
                    <a>{user.email}</a>
                  </Link>
                </li>
                <li>
                  <button onClick={logout}>Logout</button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login">
                    <a>Login</a>
                  </Link>
                </li>
                <li>
                  <Link href="/signup">
                    <a>Signup</a>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>
    </div>
  );
};

export default Header;
```

By specifying `null` in the `mutate` (which I named `mutateUser`) function returned by `useSWR`, the cached value of the user data will be updated to Null after logging out. If it is not set, the header display will not switch after logging out.

Don't forget to include the Header component in the Layout component:

```jsx
// components/layout.js

import Header from '../components/header';

const Layout = ({ children }) => (
  <>
    ...
    <Header />
    ...
  </>
);
```

Also, update the following code in `pages/index.js` to use the header:

```jsx
// pages/index.js

// if (error) return <div>failed to load</div>;
if (error)
  return (
    <Layout>
      <div>failed to load</div>
    </Layout>
  );
```

### Test Login & Logout

Let's test the login and logout features. Go to the Login page via the link in the header, then try logging in:

![Logged in](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-16.07.25.png "Logged in")

Good! An auth cookie should have been saved, just check it out.

Then try logging out. The auth cookie should be removed:

![Auth cookie removed](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-16.08.01.png "Auth cookie removed")

It worked! Implementing user authentication is now complete.

## Demonstrate the Effectiveness of the Permitted Actions

Let's create a Todo document. Before that, we need to update `pages/new.js` as follows:

```jsx
// pages/new.js

import useSWR from 'swr'; // add

const New = ({ token }) => {
  const { data: user } = useSWR('/api/user'); // add
  ...
  const onSubmit = handleSubmit(async ({ task }) => {
    ...
    // update
    const mutation = gql`
      mutation CreateATodo($task: String!, $owner: ID!) {
        createTodo(
          data: { task: $task, completed: false, owner: { connect: $owner } }
        ) {
          task
          completed
          owner {
            _id
          }
        }
      }
    `;
    
    // add
    const variables = {
      task,
      owner: user && user.id,
    };
    
    try {
      await graphQLClient(token).request(mutation, variables); // update
      ...
    }
  });
  ...
};
```

The Todo document created will have the current authenticated user as its owner.

After logging in, create a Todo:

![Create a Todo](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-16.36.58.png "Create a Todo")

The Todo you created should be displayed:

![The Todo created has been displayed](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-16.39.01.png "The Todo created has been displayed")

Alright. Then log out, create a new user and create a few Todos:

![Todos of another user](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-16.44.11.png "Todos of another user")

John's Todo is not displayed in the Jane's Todo list. Great!

Try out the other actions yourself. To retrieve the Todos of all users, clear and check the Read action of the Todo collection of the Auth role:

![Allow reading Todos of all users](/assets/blog/nextjs-faunadb-authentication/screenshot-2020-08-29-17.43.27.png "Allow reading Todos of all users")

If user "A" tries to update or delete a Todo owned by user "B", it should get an error.

## Conclusion

This tutorial covered only the basics of FaunaDB's authentication features. To build more sophisticated and complex authentication, we need to learn more about FQL and ABAC. In the near future, I would like to write articles for each subject such as Roles and Tokens.

You can find the code for this tutorial on [GitHub](https://github.com/kjmczk/next-fauna-auth).