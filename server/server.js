const express = require('express');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const validator = require('validator');
const app = express();
app.set('trust proxy', 1); // Trust first proxy for secure cookies in production
const port = 3000;

// Rate limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many attempts, please try again later' }
});

// Middleware
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(express.static(path.join(__dirname, '../public'), { index: 'index.html' }));

// Data file path
const dataFile = path.join(__dirname, 'data.json');

// Initialize data file synchronously before starting server
function initializeDataSync() {
    try {
        if (!fs.existsSync(dataFile)) {
            const initialData = {
                users: [],
                sellers: [],
                products: [],
                orders: [],
                forumPosts: []
            };
            fs.writeFileSync(dataFile, JSON.stringify(initialData));
            console.log('Initialized data.json');
        }
    } catch (err) {
        console.error('Initialization failed:', err);
    }
}

initializeDataSync();

// Helper function to load data with fallback
async function loadData() {
    try {
        const content = await fsPromises.readFile(dataFile);
        const data = JSON.parse(content);
        return data || { users: [], sellers: [], products: [], orders: [], forumPosts: [] };
    } catch (error) {
        console.error('Error loading data:', error);
        return { users: [], sellers: [], products: [], orders: [], forumPosts: [] };
    }
}

// Helper function to save data
async function saveData(data) {
    // Create a temporary file first
    const tempFile = `${dataFile}.tmp`;
    try {
        // Ensure the data object has all required arrays
        data = {
            users: data.users || [],
            sellers: data.sellers || [],
            products: data.products || [],
            orders: data.orders || [],
            forumPosts: data.forumPosts || []
        };
        
        // Ensure the directory exists
        await fsPromises.access(path.dirname(dataFile)).catch(async () => {
            await fsPromises.mkdir(path.dirname(dataFile), { recursive: true });
        });
        
        // Write data to temp file
        await fsPromises.writeFile(tempFile, JSON.stringify(data, null, 4));
        
        // Ensure the temp file was written successfully
        await fsPromises.access(tempFile);
        
        // Remove the old file if it exists to avoid issues on Windows
        await fsPromises.unlink(dataFile).catch(() => {});
        
        // Rename the temporary file to the actual file
        await fsPromises.rename(tempFile, dataFile);
        
        // Verify the file exists and is readable
        await fsPromises.access(dataFile);
        
        // console.log('Data saved successfully:', data);
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        // Clean up temp file if it exists
        await fsPromises.unlink(tempFile).catch(() => {});
        throw new Error(`Failed to save data: ${error.message}`);
    }
}

// Authentication Routes
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return res.status(400).json({ message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' });
        }

        const data = await loadData();
        
        // Ensure users array exists
        if (!data.users) data.users = [];
        
        // Check if user exists
        const userExists = data.users.some(user => user.email === email);
        if (userExists) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
            id: data.users.length + 1,
            name,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        data.users.push(newUser);
        // console.log('Attempting to save data:', data.users.length);
        const saved = await saveData(data);
        // console.log('Save result:', saved);
        // if (saved) {
        //     console.log('User registered:', { id: newUser.id, name: newUser.name, email: newUser.email });
        // }
        
        res.status(201).json({ 
            message: 'User registered successfully',
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await loadData();
        
        // Find user by email
        const user = data.users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Set user session
        req.session.user = { id: user.id, name: user.name, email: user.email };
        
        res.json({
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/auth/user', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.json({ user: null });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});