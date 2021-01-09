---
path: next-fauna-crud
coverImage: /assets/blog/nextjs-faunadb-crud/cover.jpg
date: '2020-07-30T02:52:31.340Z'
title: CRUD App with Next.js and FaunaDB
description: How to perform CRUD operations using FQL in a Next.js and FaunaDB app.
author:
  name: Koji Mochizuki
  picture: /assets/blog/author/avatar.png
ogImage:
  url: /assets/blog/nextjs-faunadb-crud/cover.jpg
---

**FaunaDB** is a global serverless database started by former Twitter engineers Evan Weaver and Matt Freels.

The following is written on the [Fauna company page](https://fauna.com/company):

> Fauna is the data layer for this new generation of client-serverless applications.
>
> FaunaDB provides a web-native interface, with support for GraphQL and custom business logic that integrates seamlessly with the rest of the serverless ecosystem. The underlying globally distributed storage and compute platform is fast, consistent, and reliable, with a modern security infrastructure. With Fauna there is no compromise.

It's fascinating! When I read this, I wanted to use it immediately.

In this tutorial, we'll build a simple application with **Next.js** and try creating, retrieving, updating and deleting (CRUD) documents in FaunaDB.

**What we will:**

* Sign up for a FaunaDB account
* Create a database in the **FaunaDB Console**
* Create a Next.js app
* Retrieve documents
* Retrieve a document
* Create a document
* Update a document
* Delete a document

Please note that this article is likely to be lengthy, so I will omit detailed explanations. For the same reason I will also omit all styles in the source code, but they are on [GitHub](https://github.com/kjmczk/next-fauna-crud).

## Sign Up for a FaunaDB Account

Go to the [Fauna sign-up page](https://dashboard.fauna.com/accounts/register) and create a FaunaDB account. If you already have your FaunaDB account, log in and go to the next section.

## Create a Database

Let's create a new database. Click the "NEW DATABASE" button in the FaunaDB Console.

![New Database](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-22-15.26.16.png "New Database")

In this tutorial we'll use demo data, so check "Pre-populate with demo data".

Click the "SAVE" button to create the database.

![Database named next-fauna-crud](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-22-15.27.09.png "Database named next-fauna-crud")

As you can see, the demo data is populated in the database. There are some documents in each collection, so we will use them.

### Create a Server Key

We need to create a server key to access the `next-fauna-crud` database.

Go to "SECURITY" in the left menu and click the "NEW KEY" button.

![New Server Key](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-22-15.32.59.png "New Server Key")

Select "Server" for Role and click the "SAVE" button.

After creating the key, you should see your **key's secret**. The secret won't be displayed again, so keep this page open or copy it somewhere.

## Create a Next.js App

Let's create a Next.js app and do some preparations for CRUD.

Create a new Next.js app using `create-next-app`, which is named “next-fauna-crud” in this tutorial:

```bash
yarn create next-app next-fauna-crud
```

Start the `dev` server and see the result on your browser:

```bash
cd next-fauna-crud
yarn dev
```

### Install Dependencies

Install the dependencies used in this tutorial in advance:

```bash
yarn add faunadb swr react-hook-form
```

* `faunadb`: A JavaScript driver required to interact with FaunaDB.
* `swr`: A React Hooks library for data fetching.
* `react-hook-form`: A form validation library for building forms easily with less code.

### Set Up Environment Variables

Create a new file called `.env.local` in the root of your project and set the following variable:

```ignore
FAUNA_SERVER_KEY=<YOUR KEY'S SECRET>
```

Set the secret of your server key created in the FaunaDB Console.

### Instantiate a client

Instantiate a client that uses the server key we just set up.

* Create a top-level directory called `utils`.
* Inside, create a file: `fauna-auth.js`.

```javascript
// utils/fauna-auth.js

import faunadb from 'faunadb';

export const serverClient = new faunadb.Client({
  secret: process.env.FAUNA_SERVER_KEY,
});
```

## Retrieve Documents

Now, let's try CRUD!

First, we'll try data fetching, getting all the documents in the "customers" collection and listing them in a table.

### Create an API Route

* Create a directory called `customers` in `pages/api`.
* Create a file called `index.js` in `pages/api/customers`.

```javascript
// pages/api/customers/index.js

import { query as q } from 'faunadb';
import { serverClient } from '../../../utils/fauna-auth';

export default async (req, res) => {
  try {
    const customers = await serverClient.query(
      q.Map(
        // iterate each item in result
        q.Paginate(
          // make paginatable
          q.Match(
            // query index
            q.Index('all_customers') // specify source
          )
        ),
        (ref) => q.Get(ref) // lookup each result by its reference
      )
    );
    // ok
    res.status(200).json(customers.data);
  } catch (e) {
    // something went wrong
    res.status(500).json({ error: e.message });
  }
};
```

FaunaDB offers its own function query language called **FQL** (Fauna Query Language). It provides many **built-in functions** that can be used to query or mutate FaunaDB databases. The `Map`, `Paginate`, `Match`, `Index`, and `Get` functions are some of them. For more information on each built-in function, check out the [FQL cheat sheet](https://docs.fauna.com/fauna/current/api/fql/cheat_sheet) page in the [Fauna Documentation](https://docs.fauna.com/fauna/current/).

The `all_customers` index was created automatically when you created the database, so you can find it in your FaunaDB Console.

### Create a List Page

We'll use our Home page to list the documents. Open `pages/index.js` and overwrite it as follows:

```jsx
// pages/index.js

import useSWR from 'swr';
import Layout from '../components/layout';
import DataRow from '../components/data-row';

const fetcher = (url) => fetch(url).then((r) => r.json());

const Home = () => {
  const { data, error } = useSWR('/api/customers', fetcher);

  if (error) return <div>failed to load</div>;

  return (
    <Layout>
      <h1>Next Fauna CRUD</h1>

      <div className="table">
        <h2>Customer Data</h2>
        <div className="headerRow">
          <h4>name</h4>
          <h4>telephone</h4>
          <h4 className="creditCard">credit card</h4>
        </div>
        {data ? (
          data.map((d) => (
            <DataRow
              key={d.ref['@ref'].id}
              id={d.ref['@ref'].id}
              firstName={d.data.firstName}
              lastName={d.data.lastName}
              telephone={d.data.telephone}
              creditCard={d.data.creditCard.number}
            />
          ))
        ) : (
          <>
            <DataRow loading />
            <DataRow loading />
            <DataRow loading />
          </>
        )}
      </div>
    </Layout>
  );
};

export default Home;
```

The basic usage of **SWR** is as above. With it, the logic of data fetching is so simplified. Amazing! [Learn more about SWR](https://swr.vercel.app/).

### Create a Table Component

* Create a top-level directory called `components`.
* Inside, create a file: `data-row.js`.

```jsx
// components/data-row.js

import Link from 'next/link';

const DataRow = ({
  id,
  firstName,
  lastName,
  telephone,
  creditCard,
  loading,
}) => (
  <div className="dataRow">
    <p className={loading ? 'loading' : ''}>
      <Link href="/customers/[id]" as={`/customers/${id}`}>
        <a>
          {firstName} {lastName}
        </a>
      </Link>
    </p>
    <p className={`num ${loading ? 'loading' : ''}`}>{telephone}</p>
    <p className={`creditCard num ${loading ? 'loading' : ''}`}>{creditCard}</p>
  </div>
);

export default DataRow;
```

### Create a Layout Component

Create a Layout component which will be common across all pages:

* Create a file called `layout.js` in the `components` directory.

```jsx
// components/layout.js

import Head from 'next/head';

const Layout = ({ children }) => (
  <>
    <Head>
      <title>Next Fauna CRUD</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <main>
      <div className="container">{children}</div>
    </main>
  </>
);

export default Layout;
```

Now we should be able to retrieve and display all customer data. Restart the `dev` server to load the environment variables, and then access `http://localhost:3000/`:

![Customer List](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-23-13.56.41.png "Customer List")

Good, we've successfully retrieved all customer data.

## Retrieve a Document

Next, we'll try getting a specific customer document.

### Create an API Route

* Create a directory called `[id]` in `pages/api/customers`.
* Create a file called `index.js` in `pages/api/customers/[id]`.

To create **dynamic routes** in Next.js apps, use the directory name (or file name) with brackets as above. If you're new to Next.js, check out the documentation [here](https://nextjs.org/docs/api-routes/dynamic-api-routes).

```javascript
// pages/api/customers/[id]/index.js

import { query as q } from 'faunadb';
import { serverClient } from '../../../../utils/fauna-auth';

export default async (req, res) => {
  const {
    query: { id },
  } = req;

  try {
    const customer = await serverClient.query(
      q.Get(q.Ref(q.Collection('customers'), id))
    );
    res.status(200).json(customer.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
```

To retrieve a specific document, you need its **ref value** (id), but you can get it as above.

### Create a Detail Page

* Create a directory called `customers` in the `pages` directory.
* Create a directory called `[id]` in `pages/customers`.
* Create a file called `index.js` in `pages/customers/[id]`.

```jsx
// pages/customers/[id]/index.js

import { useRouter } from 'next/router';
import useSWR from 'swr';
import Layout from '../../../components/layout';

const fetcher = (url) => fetch(url).then((r) => r.json());

const Customer = () => {
  const router = useRouter();
  const { id } = router.query;

  const { data, error } = useSWR(`/api/customers/${id}`, fetcher);

  if (error) return <div>failed to load</div>;

  return (
    <Layout>
      <h1>Customer</h1>
      <hr />
      {data ? (
        <div>
          <p className="name">
            {data.firstName} {data.lastName}
          </p>
          <p className="num">{data.telephone}</p>
          <p className="num">{data.creditCard.number}</p>
        </div>
      ) : (
        <div>loading...</div>
      )}
    </Layout>
  );
};

export default Customer;
```

Getting the **query object** is also easy. Just use the **useRouter** hook provided by Next.js.

* [Learn more about Dynamic Routes](https://nextjs.org/docs/routing/dynamic-routes)
* [Learn more about the useRouter hook](https://nextjs.org/docs/api-reference/next/router#userouter)

Let's take a look at the details page. Go to the Home page and click on any customer:

![Customer Details](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-23-15.57.34.png "Customer Details")

Okay, retrieving documents went well.

## Create a Document

Third, we'll try creating a new document.

### Create an API Route

Create a file called `create.js` in `pages/api/customers`:

```javascript
// pages/api/customers/create.js

import { query as q } from 'faunadb';
import { serverClient } from '../../../utils/fauna-auth';

export default async (req, res) => {
  const { firstName, lastName, telephone, creditCardNumber } = req.body;

  try {
    await serverClient.query(
      q.Create(q.Collection('customers'), {
        data: {
          firstName,
          lastName,
          telephone,
          creditCard: {
            number: creditCardNumber,
          },
        },
      })
    );
    res.status(200).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
```

We'll again use the "customers" collection. Just specify the collection and document data in the `Create` function. It's very simple.

### Create a Create Page

Create a page with a form for adding new customers:

* Create a file called `create.js` in `pages/customers`.

```jsx
// pages/customers/create.js

import { useState } from 'react';
import Router from 'next/router';
import { useForm } from 'react-hook-form';
import Layout from '../../components/layout';

const Create = () => {
  const [errorMessage, setErrorMessage] = useState('');

  const { handleSubmit, register, errors } = useForm();

  const onSubmit = handleSubmit(async (formData) => {
    if (errorMessage) setErrorMessage('');

    try {
      const res = await fetch('/api/customers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (res.status === 200) {
        Router.push('/');
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
      <h1>Create Customer</h1>

      <form onSubmit={onSubmit}>
        <div>
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            placeholder="e.g. John"
            ref={register({ required: 'First Name is required' })}
          />
          {errors.firstName && (
            <span role="alert" className="error">
              {errors.firstName.message}
            </span>
          )}
        </div>

        <div>
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            placeholder="e.g. Doe"
            ref={register({ required: 'Last Name is required' })}
          />
          {errors.lastName && (
            <span role="alert" className="error">
              {errors.lastName.message}
            </span>
          )}
        </div>

        <div>
          <label>Telephone</label>
          <input
            type="text"
            name="telephone"
            placeholder="e.g. 123-456-7890"
            ref={register}
          />
          {errors.telephone && (
            <span role="alert" className="error">
              {errors.telephone.message}
            </span>
          )}
        </div>

        <div>
          <label>Credit Card Number</label>
          <input
            type="text"
            name="creditCardNumber"
            placeholder="e.g. 1234567890123456"
            ref={register}
          />
          {errors.creditCardNumber && (
            <span role="alert" className="error">
              {errors.creditCardNumber.message}
            </span>
          )}
        </div>

        <div className="submit">
          <button type="submit" className="submitButton">
            Create
          </button>
        </div>
      </form>

      {errorMessage && (
        <p role="alert" className="errorMessage">
          {errorMessage}
        </p>
      )}
    </Layout>
  );
};

export default Create;
```

Sorry for the long code. This is because it includes error handling. The above form is built with **React Hook Form**, so it should have less code than usual. [Learn more about React Hook Form](https://react-hook-form.com/).

If a document is created successfully, you will be redirected to the Home page.

### Add a Create Link

Open `pages/index.js` and add a link to the Create page:

```jsx
// pages/index.js

import Link from 'next/link'; // add
...

const Home = () => {
  ...

  return (
    <Layout>
      <h1>Next Fauna CRUD</h1>
      {/* add */}
      <Link href="/customers/create">
        <a className="createNew">Create New Customer</a>
      </Link>

      ...
    </Layout>
  );
};

export default Home;
```

Now, we're ready to create a document. Go to the Home page and click the link that we just added.

![Create Customer](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-23-18.48.57.png "Create Customer")

Looks okay. Try pressing the "Create" button without entering anything.

![Validation Errors](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-23-18.52.10.png "Validation Errors")

Error handling is working well.

Then, enter the values to create a customer.

![New customer added](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-23-18.55.43.png "New customer added")

It worked! A new document has been created in the "customers" collection.

## Update a Document

Then, we'll try updating a document.

### Create an API Route

Create a file called `update.js` in `pages/api/customers/[id]`:

```javascript
// pages/api/customers/[id]/update.js

import { query as q } from 'faunadb';
import { serverClient } from '../../../../utils/fauna-auth';

export default async (req, res) => {
  const {
    query: { id },
  } = req;

  const { firstName, lastName, telephone, creditCardNumber } = req.body;

  try {
    await serverClient.query(
      q.Update(q.Ref(q.Collection('customers'), id), {
        data: {
          firstName,
          lastName,
          telephone,
          creditCard: {
            number: creditCardNumber,
          },
        },
      })
    );
    res.status(200).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
```

This is like a combination of the API route for creating a document and the API route for retrieving a document. The only new thing is that the `Update` function is used.

### Create an Update Page

Create a file called `update.js` in `pages/customers/[id]`:

```jsx
// pages/customers/[id]/update.js

import { useRouter } from 'next/router';
import useSWR from 'swr';
import Layout from '../../../components/layout';
import EditForm from '../../../components/edit-form';

const fetcher = (url) => fetch(url).then((r) => r.json());

const Update = () => {
  const router = useRouter();
  const { id } = router.query;

  const { data, error } = useSWR(`/api/customers/${id}`, fetcher);

  if (error) return <div>failed to load</div>;

  return (
    <Layout>
      {data ? <EditForm defaultValues={data} id={id} /> : <div>loading...</div>}
    </Layout>
  );
};

export default Update;
```

The Update page needs to get data as default values, so create the form separately. Pass the `defaultValues` and `id` props to the `EditForm` component that we will create next.

### Create a Form Component

Create a file called `edit-form.js` in the `components` directory:

```jsx
// components/edit-form.js

import { useState } from 'react';
import Router from 'next/router';
import { useForm } from 'react-hook-form';

const EditForm = ({ defaultValues, id }) => {
  const [errorMessage, setErrorMessage] = useState('');

  const { handleSubmit, register, errors } = useForm({
    defaultValues: {
      ...defaultValues,
      creditCardNumber: defaultValues.creditCard.number,
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    if (errorMessage) setErrorMessage('');

    try {
      const res = await fetch(`/api/customers/${id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (res.status === 200) {
        Router.push('/');
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  });

  return (
    // almost the same as the creation form
  );
};

export default EditForm;
```

I omitted the JSX part because it is almost the same as that of the Create page. You can find it on [GitHub](https://github.com/kjmczk/next-fauna-crud/blob/master/components/edit-form.js).

### Add a Edit Link

Open `pages/customers/[id]/index.js` and add a link to the Update page:

```jsx
// pages/customers/[id]/index.js

...
import Link from 'next/link'; // add
...

const Customer = () => {
  ...

  return (
    <Layout>
      ...
      {data ? (
        <div>
          ...

          {/* add */}
          <div className="buttons">
            <Link href="/customers/[id]/update" as={`/customers/${id}/update`}>
              <a className="editButton">Edit</a>
            </Link>
          </div>
        </div>
      ) : (
        ...
      )}
    </Layout>
  );
};

export default Customer;
```

Now, go to the details page of any customer and click the Edit link that we just added.

![Edit Customer](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-25-10.35.17.png "Edit Customer")

Good, the current data is rendered in each input field.

Let's edit any value and update the data. I'll change the name of this customer to "Taro Yamada".

![Customer data updated](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-25-10.38.20.png "Customer data updated")

The customer's name has updated. Perfect!

## Delete a Document

Finally, we'll try deleting a document.

### Create an API Route

Create a file called `delete.js` in `pages/api/customers/[id]`:

```javascript
// pages/api/customers/[id]/delete.js

import { query as q } from 'faunadb';
import { serverClient } from '../../../../utils/fauna-auth';

export default async (req, res) => {
  const {
    query: { id },
  } = req;

  try {
    await serverClient.query(q.Delete(q.Ref(q.Collection('customers'), id)));
    res.status(200).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
```

A document can be removed using the `Delete` function.

### Add a Delete Button

Open `pages/customers/[id]/index.js` and add a button to delete a document:

```jsx
// pages/customers/[id]/index.js

...

const Customer = () => {
  ...

  // add
  const onClick = async () => {
    try {
      const res = await fetch(`/api/customers/${id}/delete`, {
        method: 'DELETE',
      });
      if (res.status === 200) {
        router.push('/');
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error(error);
    }
  };

  ...

  return (
    <Layout>
      ...
      {data ? (
        <div>
          ...

          <div className="buttons">
            ...
            {/* add */}
            <button onClick={onClick} className="deleteButton">
              Delete
            </button>
          </div>
        </div>
      ) : (
        ...
      )}
    </Layout>
  );
};

export default Customer;
```

That's it. The code for the deletion operation is very simple. If a document is deleted successfully, you'll be redirected to the Home page.

Now, go to the details page of any customer and try deleting the document.

![Try deleting the document](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-25-11.14.54.png "Try deleting the document")

![One of the customer data has been deleted](/assets/blog/nextjs-faunadb-crud/screenshot-2020-07-23-13.56.41.png "One of the customer data has been deleted")

Yes! All the CRUD operations are complete.

## Conclusion

In this tutorial, I demonstrated how to perform CRUD operations in FaunaDB using the Fauna Query Language (FQL). Next time I'm going to write about how to use **GraphQL** instead of FQL. At this time, there are few examples of CRUD operations in FaunaDB using applications, so I hope this article is helpful.

You can find the code for this tutorial on [GitHub](https://github.com/kjmczk/next-fauna-crud).