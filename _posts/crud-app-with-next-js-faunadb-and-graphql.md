---
path: next-fauna-graphql-crud
coverImage: /assets/blog/nextjs-faunadb-graphql-crud/cover.jpg
date: '2020-08-15T00:44:48.944Z'
title: CRUD App with Next.js, FaunaDB and GraphQL
description: How to perform CRUD operations using GraphQL in a Next.js and FaunaDB app.
author:
  name: Koji Mochizuki
  picture: /assets/blog/author/avatar.png
ogImage:
  url: /assets/blog/nextjs-faunadb-graphql-crud/cover.jpg
---

In my last article, I wrote about how to use **FQL** in **FaunaDB** to perform CRUD operations. This time, I'll write about how to use **GraphQL** instead to perform CRUD operations.

Fauna provides the FaunaDB GraphQL API, a database service for defining schemas and querying and mutating data within FaunaDB. Also, **GraphQL Playground** is embedded into **FaunaDB Console**. It's nice for developers.

In this tutorial, we'll build a simple application with Next.js and try creating, retrieving, updating and deleting (CRUD) documents using GraphQL in FaunaDB.

**What we will:**

* Create a Next.js app
* Create a GraphQL schema
* Sign up for a FaunaDB account
* Create a GraphQL database
* Retrieve documents
* Create a document
* Update a document
* Delete a document

Please note that this article is likely to be lengthy, so I will omit detailed explanations. For the same reason I will also omit all styles in the source code, but they are on [GitHub](https://github.com/kjmczk/next-fauna-graphql-crud).

## Create a Next.js App

First, create a Next.js app using `create-next-app`. Name it “next-fauna-graphql-crud” in this tutorial:

```bash
yarn create next-app next-fauna-graphql-crud
```

Start the `dev` server and see the result on your browser:

```bash
cd next-fauna-graphql-crud
yarn dev
```

## Create a GraphQL Schema

Our goal is to perform basic CRUD operations, so we'll create a very simple schema here:

* Create a new file called `schema.gql` in the root of your project.

```graphql
type Todo {
  task: String!
  completed: Boolean!
}

type Query {
  allTodos: [Todo!]
}
```

Each "todo" item has only a task and a flag that indicates whether the item is complete. The schema also defines the kinds of queries that we want to execute.

## Sign Up for a FaunaDB Account

Go to the [Fauna sign-up page](https://dashboard.fauna.com/accounts/register) and create a FaunaDB account. If you already have your FaunaDB account, log in and go to the next section.

## Create a Database

Let's create a new database:

* Click the "NEW DATABASE" button in the FaunaDB Console.
* Enter the database name and click the "SAVE" button to create the database.

![New Database](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-07-20.55.47.png "New Database")

### Import the GraphQL Schema

Import the schema we created into FaunaDB. When we do this, the FaunaDB GraphQL API will automatically create the `Todo` collection and the `allTodos` index.

* Go to "GRAPHQL" in the left menu and click the "IMPORT SCHEMA" button.
* Specify the schema file to import.

![GraphQL Playground](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-11-15.59.12.png "GraphQL Playground")

As you can see by opening the "DOCS" tab on the right side of the GraphQL Playground screen, in addition to the `allTodos` query defined in the schema file, basic queries and mutations have been generated. Cool!

### Play with GraphQL Playground

Let's play with GraphQL Playground.

To create a document, enter the following GraphQL mutation query into the left panel of the GraphQL Playground screen and press the execute button in the center:

![Create a Todo with GraphQL Playground](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-11-16.04.51.png "Create a Todo with GraphQL Playground")

Try changing the task and creating another Todo.

Let’s run a query to fetch all documents. Click the "+" button in the GraphQL Playground screen to create a new tab. Then enter the following GraphQL query into the left panel and press the execute button:

![Fetch all documents with GraphQL Playground](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-07-21.20.12.png "Fetch all documents with GraphQL Playground")

Okay, we've seen the basics of using GraphQL Playground, so let's move on to the next section.

### Create a Server Key

We need to create a server key to access the `next-fauna-graphql-crud` database:

* Go to "SECURITY" in the left menu and click the "NEW KEY" button.
* Select "Server" for Role and click the "SAVE" button.

![New key](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-11-18.32.12.png "New key")

After creating the key, you should see your **key's secret**. The secret won't be displayed again, so keep this page open or copy it somewhere.

> **NOTE**
>
> Keys with the server role bypass all permission checks within the database they’re assigned to. Because they provide unrestricted access, they should be well protected and only used in trusted or server-side environments.

For more information about Access keys, check out the [FaunaDB key system](https://docs.fauna.com/fauna/current/security/keys) page in the [Fauna Documentation](https://docs.fauna.com/fauna/current/index.html).

## Preparations for CRUD

Now we'll go back to the Next.js app and make several preparations for CRUD.

### Install Dependencies

Install the dependencies used for the app:

```bash
yarn add faunadb swr graphql-request graphql react-hook-form
```

* `faunadb`: A JavaScript driver required to interact with FaunaDB.
* `swr`: A React Hooks library for data fetching.
* `graphql-request`: Most simple & lightweight GraphQL client supporting Node and browsers.
* `graphql`: Installing this package has been recommended since `graphql-request` **v3.0.0**.
* `react-hook-form`: A form validation library for building forms easily with less code.

### Set Up Environment Variables

* Create a new file called `.env.local` in the root of your project.
* Set the secret of your server key as the value for `NEXT_PUBLIC_FAUNA_SECRET`.

```ignore
NEXT_PUBLIC_FAUNA_SECRET=<YOUR KEY'S SECRET>
```

### Instantiate a client

Instantiate a client that uses the FaunaDB secret we just set up.

* Create a top-level directory called `utils`.
* Inside, create a file: `graphql-client.js`.

```javascript
// utils/graphql-client.js

import { GraphQLClient } from 'graphql-request';

const endpoint = 'https://graphql.fauna.com/graphql';

export const graphQLClient = new GraphQLClient(endpoint, {
  headers: {
    authorization: `Bearer ${process.env.NEXT_PUBLIC_FAUNA_SECRET}`,
  },
});
```

The endpoint requires authentication, so include the secret as a **Bearer** token in the `authorization` header. To learn more, check out [GraphQL endpoints](https://docs.fauna.com/fauna/current/api/graphql/endpoints) and [Authentication](https://docs.fauna.com/fauna/current/api/graphql/endpoints#authentication).

## Retrieve Documents

Now, let's try CRUD!

First, we'll try retrieving all the documents in the Todo collection. We created a few Todos with GraphQL Playground, so the documents should already exist in the database.

### Create a List Page

We'll use our Home page to list the documents. Open `pages/index.js` and overwrite it as follows:

```jsx
// pages/index.js

import useSWR from 'swr';
import { gql } from 'graphql-request';
import Layout from '../components/layout';
import styles from '../styles/Home.module.css';
import { graphQLClient } from '../utils/graphql-client';

const fetcher = async (query) => await graphQLClient.request(query);

const Home = () => {
  const { data, error } = useSWR(
    gql`
      {
        allTodos {
          data {
            _id
            task
            completed
          }
        }
      }
    `,
    fetcher
  );

  if (error) return <div>failed to load</div>;

  return (
    <Layout>
      <h1>Next Fauna GraphQL CRUD</h1>

      {data ? (
        <ul>
          {data.allTodos.data.map((todo) => (
            <li key={todo._id} className={styles.todo}>
              <span>{todo.task}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div>loading...</div>
      )}
    </Layout>
  );
};

export default Home;
```

With `SWR` and `graphql-request`, the logic of data fetching is so simplified. Awesome!

* Learn more about [SWR](https://swr.vercel.app/).
* Learn more about [graphql-request](https://github.com/prisma-labs/graphql-request).

### Create a Layout Component

Create a Layout component which will be common across all pages:

* Create a top-level directory called `components`.
* Inside, create a file: `layout.js`.

```jsx
// components/layout.js

import Head from 'next/head';
import styles from './layout.module.css';

const Layout = ({ children }) => (
  <>
    <Head>
      <title>Next Fauna GraphQL CRUD</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <main>
      <div className={styles.container}>{children}</div>
    </main>
  </>
);

export default Layout;
```

We should now be able to retrieve and display all Todo data. Restart the `dev` server to load the environment variables, and then access `http://localhost:3000/`:

![Retrieve Todos](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-07-22.34.26.png "Retrieve Todos")

The documents in the database have been successfully retrieved and displayed!

## Create a Document

Next, we'll try creating a new document.

### Create a Create Page

Create a page with a form to create a new Todo:

* Create a file called `new.js` in the `pages` directory.

```jsx
// pages/new.js

import { useState } from 'react';
import Router from 'next/router';
import { gql } from 'graphql-request';
import { useForm } from 'react-hook-form';
import Layout from '../components/layout';
import utilStyles from '../styles/utils.module.css';
import { graphQLClient } from '../utils/graphql-client';

const New = () => {
  const [errorMessage, setErrorMessage] = useState('');

  const { handleSubmit, register, errors } = useForm();

  const onSubmit = handleSubmit(async ({ task }) => {
    if (errorMessage) setErrorMessage('');

    const query = gql`
      mutation CreateATodo($task: String!) {
        createTodo(data: { task: $task, completed: false }) {
          task
          completed
        }
      }
    `;

    try {
      await graphQLClient.request(query, { task });
      Router.push('/');
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  });

  return (
    <Layout>
      <h1>Create New Todo</h1>

      <form onSubmit={onSubmit} className={utilStyles.form}>
        <div>
          <label>Task</label>
          <input
            type="text"
            name="task"
            placeholder="e.g. do something"
            ref={register({ required: 'Task is required' })}
          />
          {errors.task && (
            <span role="alert" className={utilStyles.error}>
              {errors.task.message}
            </span>
          )}
        </div>

        <div className={utilStyles.submit}>
          <button type="submit">Create</button>
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

export default New;
```

I've been using [React Hook Form](https://react-hook-form.com/) for my React projects lately. It reduces the amount of code, improves performance, and makes form validation easier.

Notice that the variable `$task` is used in the GraphQL mutation query above. When using variables, include object variables in the `request()` method.

Once a document is successfully created, you will be redirected to the Home page.

### Add a Create Link

Open `pages/index.js` and add a link to the Create page:

```jsx
// pages/index.js

import Link from 'next/link';
...
<Link href="/new">
  <a>Create New Todo</a>
</Link>
...
```

We're now ready to create a document. Go to the Create page by clicking the link we just added to the Home page:

![Creation Form](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-08-14.59.39.png "Creation Form")

First, press the "Create" button without entering anything and check if form validation works:

![Form Validation](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-08-15.00.06.png "Form Validation")

Then, enter something and create a Todo:

![New Todo added](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-08-15.41.15.png "New Todo added")

A new Todo has been added!

## Update a Document

Third, we'll try updating a document.

### Create an Edit Page

In Next.js, you can add square brackets to a page to create a dynamic route. This allows you to match named parameters.

* Create a new directory called `todo` in the `pages` directory.
* Create a file called `[id].js` in `pages/todo`.

```jsx
// pages/todo/[id].js

import { useRouter } from 'next/router';
import useSWR from 'swr';
import { gql } from 'graphql-request';
import Layout from '../../components/layout';
import EditForm from '../../components/edit-form';
import { graphQLClient } from '../../utils/graphql-client';

const Todo = () => {
  const router = useRouter();
  const { id } = router.query;

  const fetcher = async (query) => await graphQLClient.request(query, { id });

  const query = gql`
    query FindATodoByID($id: ID!) {
      findTodoByID(id: $id) {
        task
        completed
      }
    }
  `;

  const { data, error } = useSWR([query, id], fetcher);

  if (error) return <div>failed to load</div>;

  return (
    <Layout>
      <h1>Edit Todo</h1>

      {data ? (
        <EditForm defaultValues={data.findTodoByID} id={id} />
      ) : (
        <div>loading...</div>
      )}
    </Layout>
  );
};

export default Todo;
```

You can use the `useRouter` hook to access the router object. We learned how to pass variables to a GraphQL query in the previous section, but when passing multiple variables to the `useSWR` hook, you need to pass them in brackets like `[query, id]`.

Pass the retrieved data along with the query parameter to the `EditForm` component we will create next.

### Create a Form Component

Create a file called `edit-form.js` in the `components` directory:

```jsx
// components/edit-form.js

import { useState, useEffect } from 'react';
import Router from 'next/router';
import { gql } from 'graphql-request';
import { useForm } from 'react-hook-form';
import utilStyles from '../styles/utils.module.css';
import { graphQLClient } from '../utils/graphql-client';

const EditForm = ({ defaultValues, id }) => {
  const [errorMessage, setErrorMessage] = useState('');

  const { handleSubmit, register, reset, errors } = useForm({
    defaultValues: {
      ...defaultValues,
    },
  });

  const onSubmit = handleSubmit(async ({ task, completed }) => {
    if (errorMessage) setErrorMessage('');

    const query = gql`
      mutation UpdateATodo($id: ID!, $task: String!, $completed: Boolean!) {
        updateTodo(id: $id, data: { task: $task, completed: $completed }) {
          task
          completed
        }
      }
    `;

    const variables = {
      id,
      task,
      completed,
    };

    try {
      await graphQLClient.request(query, variables);
      Router.push('/');
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  });

  useEffect(() => {
    reset(defaultValues); // asynchronously reset your form values
  }, [reset, defaultValues]);

  return (
    <>
      <form onSubmit={onSubmit} className={utilStyles.form}>
        <div>
          <label>Task</label>
          <input
            type="text"
            name="task"
            ref={register({ required: 'Task is required' })}
          />
          {errors.task && (
            <span role="alert" className={utilStyles.error}>
              {errors.task.message}
            </span>
          )}
        </div>

        <div>
          <label>Completed</label>
          <input type="checkbox" name="completed" ref={register()} />
          {errors.completed && (
            <span role="alert" className={utilStyles.error}>
              {errors.completed.message}
            </span>
          )}
        </div>

        <div className={utilStyles.submit}>
          <button type="submit">Update</button>
        </div>
      </form>

      {errorMessage && (
        <p role="alert" className={utilStyles.errorMessage}>
          {errorMessage}
        </p>
      )}
    </>
  );
};

export default EditForm;
```

It's almost the same as the form built on the Create page. The `reset()` function provided by React Hook Form is used to reset the values and errors of the fields in the form. Why should we use this function?: `defaultValues` (input defaultValue) only works on initial load, so it doesn't update naturally after that. For example, if you update any data, jump to the home page, and then go to that data page again, the data before the update will be loaded. The `reset()` function solves this problem.

### Add a Edit Link

Open `pages/index.js` and add a link to the Edit page:

```jsx
// pages/index.js

...
<span className={styles.edit}>
  <Link href="/todo/[id]" as={`/todo/${todo._id}`}>
    <a>Edit</a>
  </Link>
</span>
...
```

Now go to the Home page and click the Edit link next to any Todo. The data values should be displayed in each input field:

![Edit Form](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-08-17.48.53.png "Edit Form")

I'll change the Todo's Task to "Build an awesome app!" and update the Todo:

![Todo updated](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-08-17.49.52.png "Todo updated")

The Todo has been updated!

However, you might want to update a Todo to "Completed" directly on the List page. Let's add a function for that. Open `pages/index.js` and add the following code:

**Function:**

```javascript
// pages/index.js

const { data, error, mutate } = useSWR( // add `mutate`
  ...
);

// add
const toggleTodo = async (id, completed) => {
  const query = gql`
    mutation PartialUpdateTodo($id: ID!, $completed: Boolean!) {
      partialUpdateTodo(id: $id, data: { completed: $completed }) {
        _id
        completed
      }
    }
  `;

  const variables = {
    id,
    completed: !completed,
  };

  try {
    await graphQLClient.request(query, variables);
    mutate();
  } catch (error) {
    console.error(error);
  }
};
```

**JSX:**

```jsx
// pages/index.js

...
// modify
<span
  onClick={() => toggleTodo(todo._id, todo.completed)}
  style={
    todo.completed
      ? { textDecorationLine: 'line-through' }
      : { textDecorationLine: 'none' }
  }
>
  {todo.task}
</span>
...
```

This is a simple feature that when you click on Todo's Task, the value of the `completed` field will be switched and a strikethrough will be added (or removed).

You can use the `mutate` function returned by the `useSWR` hook to mutate the cached data.

You might have noticed that a new mutation called `partialUpdateTodo` is used in the `toggleTodo` function. In the toggling function, we don't need the `task` field because we just want to toggle the value of the `completed` field. However, if you do this with the `updateTodo` mutation, you'll get the error `"Field 'TodoInput.task' of required type 'String!' was not provided"`. FaunaDB provides an approach called "Schema previews", its `partial-update-mutation` feature automatically generates an input type and mutation to support partial document updates.

To enable the feature, open `utils/graphql-client.js` and add the following code into the header:

```javascript
'X-Schema-Preview': 'partial-update-mutation',
```

Now, let's try the toggling feature. Go to the Home page and click any Todo:

![Todo switched to `Completed`](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-08-18.40.55.png "Todo switched to `Completed`")

It worked! Click again to see if the strikethrough is removed.

## Delete a Document

Finally, we'll try deleting a document.

### Add a Delete Function and Button

Open `pages/index.js` and add the following code:

**Function:**

```javascript
// pages/index.js

const deleteATodo = async (id) => {
  const query = gql`
    mutation DeleteATodo($id: ID!) {
      deleteTodo(id: $id) {
        _id
      }
    }
  `;

  try {
    await graphQLClient.request(query, { id });
    mutate();
  } catch (error) {
    console.error(error);
  }
};
```

**JSX:**

```jsx
// pages/index.js

...
<span onClick={() => deleteATodo(todo._id)} className={styles.delete}>
  Delete
</span>
...
```

That's it! Super easy, right?

![Delete Todo](/assets/blog/nextjs-faunadb-graphql-crud/screenshot-2020-08-08-19.39.27.png "Delete Todo")

Try deleting any Todo. It should work.

Congratulations! You have completed all of the CRUD operations.

## Conclusion

In this tutorial, we created an app with Next.js and performed the CRUD operations using GraphQL in FaunaDB. The more you use GraphQL, the more you realize its ease of use. FaunaDB also provides a native API, **Fauna Query Language (FQL)**, so it's a good idea to choose it if you want to do more complex operations.

You can find the code for this tutorial on [GitHub](https://github.com/kjmczk/next-fauna-graphql-crud).