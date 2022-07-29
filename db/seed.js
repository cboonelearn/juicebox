// grab our client with destructuring from the export in index.js
const { 
	client,
	getAllUsers,
	createUser,
	updateUser,
	createPost,
	updatePost,
	getAllPosts,
	getPostsByUser,
	getUserById
} = require('./index');

// this function should call a query which drops all tables from our database
async function dropTables() {
	try {
		console.log('Starting to drop tables...');

		await client.query(`
			DROP TABLE IF EXISTS posts;
			DROP TABLE IF EXISTS users;
		`);

		console.log('Finished dropping tables!');
	} catch (error) {
		console.error('Error dropping tables!');
		throw error; // we pass the error up to the function that calls dropTables
	}
}

// this function should call a query which creates all tables for our database
async function createTables() {
	try {
		console.log('Starting to build tables...');

		await client.query(`
			CREATE TABLE users (
				id SERIAL PRIMARY KEY,
				username varchar(255) UNIQUE NOT NULL,
				password varchar(255) NOT NULL,
				name VARCHAR(255) NOT NULL,
				location VARCHAR(255) NOT NULL,
				active BOOLEAN DEFAULT true
			);

			CREATE TABLE posts (
				id SERIAL PRIMARY KEY,
				"authorId" INTEGER REFERENCES users(id) NOT NULL,
				title VARCHAR(255) NOT NULL,
				content TEXT NOT NULL,
				active BOOLEAN DEFAULT true
			);
		`);

		console.log('Finished building tables!');
	} catch (error) {
		console.error('Error building tables!');
		throw error; // we pass the error up to the function that cals createTables
	}
}

async function createInitialUsers() {
	try {
		console.log('Starting to create users...');

		const albert = await createUser({ username: 'albert', password: 'bertie99', name: 'Al Bert', location: 'Sidney, Australia' });
		const sandra = await createUser({ username: 'sandra', password: '2sandy4me', name: 'Just Sandra', location: "Ain't tellin'" });
		const glamgal = await createUser({ username: 'glamgal', password: 'soglam', name: 'Joshua', location: 'Upper East Side' });

		// console.log(albert);

		console.log('Finished creating users!');
	} catch(error) {
		console.error('Error creating users!');
		throw error;
	}
}

async function createInitialPosts() {
	try{
		console.log('Starting to create posts...');
		const [albert, sandra, glamgal] = await getAllUsers();

		await createPost({
			authorId: albert.id,
			title: "First Post",
			content: "This is my first post. I hope I love writing blogs as much as I love reading them."
		});
		await createPost({
			authorId: sandra.id,
			title: "First Post",
			content: "This is my first post. I hope I love reading blogs as much as I love writing them."
		});
		await createPost({
			authorId: glamgal.id,
			title: "First Post",
			content: "This is my first post. I hate blogs."
		});
	} catch (error) {
		throw error;
	}
}

async function rebuildDB() {
	try {
		client.connect();

		await dropTables();
		await createTables();
		await createInitialUsers();
		await createInitialPosts();
	} catch (error) {
		throw error;
	}
}


async function testDB() {
	try {
		console.log('Starting to test database...');
		
		console.log('Calling getAllUsers');
		const users = await getAllUsers();
		console.log('Result:', users);

		console.log('Calling updateUser on users[0]');
		const updateUserResult = await updateUser(users[0].id, {
			name: "Newname Sogood",
			location: "Lesterville, KY"
		});
		console.log('Result:', updateUserResult);

		console.log("Calling getAllPosts");
		const posts = await getAllPosts();
		console.log("Result:", posts);

		console.log("Calling updatePost on posts[0]");
		const updatePostResult = await updatePost(posts[0].id, {
		title: "New Title",
		content: "Updated Content"
		});
		console.log("Result:", updatePostResult);

		console.log("Calling getPostsByUser");
		const test = await getPostsByUser(1);
		console.log("Result:", test);

		console.log("Calling getUserById with 1");
		const albert = await getUserById(1);
		console.log("Result:", albert);

		console.log("Calling getUserById with 3");
		const glamgal = await getUserById(3);
		console.log("Result:", glamgal);

		console.log('Finished database tests!');
	} catch (error) {
		console.error('Error testing database!');
		throw error;
	}
}

rebuildDB()
	.then(testDB)
	.catch(console.error)
	.finally(() => client.end());
