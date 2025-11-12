const jwt = require('jsonwebtoken');
const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const port = 3000;

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(
	express.raw({
		type: [
			'image/*',
			'audio/*',
			'video/*',
			'application/octet-stream',
			'application/pdf',
			'application/zip',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		],
		limit: '100mb',
	})
); // for parsing raw bodies
app.use(
	express.text({
		type: ['text/plain', 'text/html', 'text/xml', 'application/javascript', 'text/css', 'application/xml'],
	})
); // for parsing text/plain

//multer setup for multipart/form-data
const upload = multer({ storage: multer.memoryStorage() });

// --- Reusable Handler & Logger ---
const logAndRespond = (req, res) => {
	console.log('--- New Request Received ---');
	console.log('Timestamp:', new Date().toISOString());
	console.log(`[${req.method}] ${req.originalUrl}`);

	console.log('\n--- Headers ---');
	console.log(req.headers);

	console.log('\n--- Route Params ---');
	console.log(req.params);

	console.log('\n--- Query Params ---');
	console.log(req.query);

	console.log('\n--- Body ---');
	console.log(req.body);

	if (req.files && req.files.length > 0) {
		console.log('\n--- Files (from multipart/form-data) ---');
		const fileInfo = req.files.map(f => ({
			fieldname: f.fieldname,
			originalname: f.originalname,
			encoding: f.encoding,
			mimetype: f.mimetype,
			size: f.size,
		}));
		console.log(fileInfo);
	}

	console.log('--------------------------\n\n');

	// Send a response back to the client
	const responsePayload = {
		message: 'Request received successfully',
		method: req.method,
		path: req.path,
		headers: req.headers,
		params: req.params,
		query: req.query,
		body: req.body,
		files: req.files || [],
	};

	if (req.method === 'POST') {
		res.status(201).json(responsePayload);
	} else if (req.method === 'DELETE') {
		res.status(204).send();
	} else {
		res.status(200).json(responsePayload);
	}
};

// --- Routes ---

// Catch-all route for simple testing
app.all('/', upload.any(), logAndRespond);

// More specific routes for different HTTP verbs
app.get('/items', logAndRespond);
app.post('/items', upload.any(), logAndRespond);
app.put('/items/:id', upload.any(), logAndRespond);
app.delete('/items/:id', logAndRespond);

app.post('/oauth/token', (req, res) => {
	const { grant_type, client_id, client_secret, scope } = req.body;

	if (grant_type === 'client_credentials') {
		// In a real application, you would validate the client_id and client_secret against a database
		if (client_id === 'test-client' && client_secret === 'test-secret') {
			const token = jwt.sign({ scope }, 'your-secret-key', { expiresIn: '1h' });
			res.json({ access_token: token, token_type: 'bearer', expires_in: 3600 });
		} else {
			res.status(401).json({ error: 'invalid_client' });
		}
	} else {
		res.status(400).json({ error: 'unsupported_grant_type' });
	}
});

// Protected route for testing authentication
app.get('/protected', (req, res) => {
	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith('Bearer ')) {
		const token = authHeader.substring(7);
		if (token === 'test-token') {
			res.status(200).json({ message: 'Access granted to protected route' });
		} else {
			res.status(401).json({ message: 'Invalid token' });
		}
	} else {
		res.status(401).json({ message: 'Authorization header missing or invalid' });
	}
});

// --- Start Server ---
app.listen(port, () => {
	console.log(`Enhanced test server listening at http://localhost:${port}`);
	console.log('Available endpoints:');
	console.log('  - [ANY] /');
	console.log('  - [GET] /items');
	console.log('  - [POST] /items');
	console.log('  - [PUT] /items/:id');
	console.log('  - [DELETE] /items/:id');
	console.log('  - [POST] /oauth/token (for OAuth2 client credentials)');
	console.log(`  - [GET] /protected (requires Bearer token 'test-token')`);
});

