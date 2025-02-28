# Lesan's solution for how to communicate between the server and the client

The idea of connecting client-side nodes to the backend in Lesan is inspired by GraphQL, but in Lesan we tried to make this connection simpler and more practical so that we can solve the problems mentioned above.

We focused on three points to do this:

1.  We do not add any language to the client and server (such as GQL language in GraphQL).
2.  Instead of implementing complex logic to filter fields selected by the user, we use the logic implemented within databases (here Aggregation in MongoDB). Because algorithms implemented within databases have more scalability and efficiency due to direct data communication.
3.  We store all relationships in data as embedded to reduce the amount of requests sent to the database.
4.  Let’s create descriptive information for different types of data and how they are embedded in server-side logic so that we can create more efficient data models in the NoSQL style. We can also simplify data management in the database without changing the information.

## Proposed Method

In the first step, we tried to organize the data structure because we intended to use NoSQL databases and at the same time we needed to have structured data like SQL both at runtime and during development to simplify the management of embedded data as much as possible.

We divided the relationships into two types of simple (inrelation) and complex or impossible (outrelation) for embedding. We stored simple relationships completely and stored complex relationships only in the number that could be returned in the first request (first pagination).

We exactly left the data retrieval management to the client as MongoDB had defined it, that is, sending an object with a key (data name) and a value (0 or 1) to the client.

We found a creative way to produce Aggregation Pipelines in MongoDB so that fewer documents are requested when receiving data as much as possible.

We allowed the client to see all the models and functions written on each model and choose them in the same object sent.

We allowed the client to see the output of each function written for each model along with the exact depth of its relationships that had previously been determined by the server-side programmer in a type-safe manner to make it easier to create the sent object.

We created an ODM to simplify the process of receiving data along with its relationships and also to manage the repetitions created from embedded relationships within this ODM so that the server-side programmer writes less code.

We prioritized input data validation and created a process for the server-side programmer to create a validator for each function written on each model so that we can run that validator before executing the function. In this validator, recursive data management along with the depth of penetration into the relationships of each model must be explicitly specified.

Let us clarify the issue with an example:
Let’s consider a schema named country with the following fields:

```typescript
id;
name;
abb;
description;
geoLocation;
capital;
provinces;
cities;
```

And also a schema for the province with the following fields:

```typescript
id;
name;
abb;
description;
geoLocation;
center;
country;
cities;
```

And also a schema for the city with the following fields:

```typescript
id;
name;
abb;
description;
geoLocation;
country;
province;
```

The capital field in the country and the center field in the province are of type city and we completely embed them. This form of relationship is a simple relationship and we call it inrelation, which ultimately is a single object of the pure city fields (inrelations can also be multiple and be an array of objects) which is defined as follows:

```typescript
countryInrelations = {
  capital: { schemaName: "city", type: "one", optional: false },
};
```

All country relationships do not end here. This schema also has a relationship with the province and city. With one simple question, we can complete the country’s relationships:

Is the number of provinces that we are going to keep inside the country too high? (i.e., if it is an SQL database, do we store the province key inside the country?)

Answer: No, the number of provinces is limited and we can store all provinces inside the country schema. So this relationship is also inrelation. Therefore, the above object should be created in this way:

```typescript
countryInrelations = {
  capital: { schemaName: "city", type: "one", optional: false },
  provinces: { schemaName: "province", type: "many", optional: true },
};
```

Another relationship we have in the country is the city, how do we define it?

There are many cities in a country and we cannot store all the cities in a country schema.

So this is a complicated relationship with a large number, we define it as outrelation that the process of defining it requires more information to know exactly what amount and what data we are going to embed, we add that information in the sort key.

```typescript
countryOutrelation = {
  cities: {
    schemaName: "city",
    number: 50,
    sort: { field: "_id", order: "desc", type: "objectId" },
  },
};
```

We also define the remaining fields of the country that are specific to it and are not related to any relationship as pure fields.

```typescript
countryPure: { name: string(), abb: optional(string()), ... }
```

For the province, it is the same way:

```typescript
provinceInrelations = { center: { schemaName : "city", type: "one" }, country: { schemaName: "country", type: "one" }}
provinceOutrelation = { cities: { schemaName: "city", number: 50, sort: { field: " _id", order: "desc", type: "objectId"}}}
provincePure: { name: string(), abb: optional(string()), ... }
```

And for the city, it is the same way:

```typescript
cityInrelations = { country: { schemaName: "country", type: "one" }, province: { schemaName: "province", type: "one" } }
cityOutrelation = {}
cityPure: { name: string(), abb: string() , ... }
```

If you pay attention, every relation that is kept as inrelation in a schema, the related schema has also stored this schema as outrelation.

It is worth noting that we save this form of defining schemas in the integrated runtime in an object called Schemas. We will discuss its structure further. But what is stored in the database is the initial form that we showed earlier. It means for the country:

```typescript
id;
name;
abb;
description;
geoLocation;
capital;
provinces;
cities;
```

The amount of pure fields is known. And the value of the fields that are of the relation type of schemas will be in the form of objects of the pure type of that relation. That is, for example, for the country:

```typescript
{
id: "234fwee656",
name: "iran",
abb: "ir",
description: "a big country in asia",
geoLocation : [ [12,4], [32,45], ... ],
capital : {
	id: "234fwee656",
	name: "tehran",
	abb: "th",
	description: "the beautiful city in middle of iran",
	geoLocation : [ [12,4], [32,45], ... ]
},
provinces : [{
	id: "234fwee656",
	name: "tehran",
	abb: "th",
	description: "one of the irans provinces",
	geoLocation : [ [12,4], [32,45], ... ]
	},
	{

	id: "234fwee656",
	name: "hamedan",
	abb: "hm",
	description: "one of the irans provinces",
	geoLocation : [ [12,4], [32,45], ... ]
},
... til to end of the provinces
}],
cities :  [{
		id: "234fwee656",
	name: "tehran",
	abb: "th",
	description: "the beautiful city in middle of iran",
	geoLocation : [ [12,4], [32,45], ... ]
	},
	{
		Id: "234fwee656",
	name: "hamedan",
	abb: "hm",
	description: "one of the irans cities",
	geoLocation : [ [12,4], [32,45], ... ]
},
... til to end of the number limit for the first paginate
}],
```

Now the user can filter and receive all the fields of a schema along with the first depth of its relations by sending only one request to the database.

This request is performed based on the process of projection in MongoDB according to the values of fields being one or zero. Without our framework having any involvement in this process. And without us writing an additional layer to filter the requested fields in it. (The process and form of this request will be explained later.)

If the lower fields of a country’s schema are requested in a request, not only all the requested information will be received and returned to the user with one request to the server but also with one request to the database.

If the following fields are requested from the schema of a country in a request. Not only with a single request to the server but also with a single request to the database, all requested information will be received and returned to the user:

```typescript
getCountry → id: 1
              Name: 1
		  abb: 1
		  decsription: 1
		  capital → id: 1
                  name: 1
			abb : 1
		  provinces → id :1
                  name :
			description : 1
		  cities → id : 1
                  name : 1
			abb : 1
```

If a user penetrates more than one level of depth, what should be done? For example, if they request provinces for a country, they may also want its cities from within the provinces.

```typescript

```

Let’s examine what happens in SQL databases before we explain the Lisan framework solution:

- First of all, we run a query to find the country, because we have the country ID, we run an indexed query.

- After that, we run a query to find the capital, because we have its ID stored in the country, we run an indexed query.

- Then we send a query to find the first paginate of provinces. If we have stored the ID of all the provinces of a country inside it, we run an indexed query. Otherwise, we must send an unindexed query with the country ID filter found.

- Continuing with the example, if we had found 35 of the first paginate provinces. We should send a non-index query with a province ID filter for each one on each city and find the first paginated cities for each of the provinces. (For example, 50 for each province, which means 50 times 30)

- Finally, to find the first paginate cities for this country too, we need to send a non-index query with the ID filter of the found country on the city table

You saw that the process was very complicated in SQL, now let’s see how the same process is done in Lesan .

In the previous section, we mentioned that to get a country along with the first depth of its relationships (i.e., capital, states, and cities), we only send an indexed query to the schema of the country and receive all the information.

Now we only need to receive information about cities for each province.

To do this, while we have access to the information of the provinces, we send an indexed query to receive the provinces again.

Because of the concept of outrelation, we are sure that the information of cities is stored within provinces. Therefore, by receiving the provinces again, we will also receive the information of cities.

This will have two advantages for us. First, instead of sending a non-index query to the city, we send an index query to the province because we have received the province IDs in the first query.The second advantage is that instead of receiving a large number of cities, we have only received a few provinces. (For example, in SQL, the number of requested documents from the database is equal to 1 + 1 + (35 \* 50) + 50. But in the Lesan method, only 1 + 35 documents have been requested.)

Now imagine what would happen if more depth and relationships were requested? This is the Achilles' heel of projects written with GraphQL.

## Why duplicate data?

As you noticed in the above example, if we can store all the dependencies of a table inside it, we can significantly reduce the number of requests sent to the database. This number is remarkably large. For example, in one of the best cases, if we have a table with 10 dependencies, each dependency is related to 10 other tables and all relationships are many-to-many. If we want to receive a list of 50 items from that table along with 2 steps of penetration into its relationships with one request, in SQL we should send 50 _ 10 _ 50 _ 10 which is equivalent to 250000 (two hundred and fifty thousand) requests sent to the database. But in Lesan all this data is collected with only 50 _ 10 which is equivalent to 500 requests sent to the database.

## The Ratio Of Creation And Update To Data Retrieval

Imagine a news database. We need a table for the authors and another table for the news written. Usually, at the end of each news, the name and some information of the author of that news are also included. If we place the information we need for the author of that news inside the news at the time of creation, we will not need to send a separate request to the database to receive the information of the author of that news when reading each news. But the problem arises when the author updates their information. For example, if they change their name from Ali to Ali Akbar. In this case, we have to update all the news written by that author. If this author writes an average of 10 news per day and works on this news website for more than 5 years, at least 18250 documents in the database must be updated. Is this cost-effective? In general, and in most cases, it can be cost-effective because news can be read more than a few thousand times a day and on the other hand, each author only changes their information once a year. Therefore, updating 18250 documents once a year is much less expensive than reading information from two different tables millions of times a day. Moreover, we have created a different solution for updating these repetitions called QQ, which updates them based on the amount of hardware resources used by the server side in different time periods and based on the value of the data. This process will be fully explained below.
