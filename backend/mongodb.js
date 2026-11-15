const dns = require('dns');
// Set robust public DNS servers to resolve MongoDB Atlas SRV records cleanly on all Windows environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('DNS server override note:', e.message);
}

const { MongoClient } = require('mongodb');

const rawMongoUri = process.env.MONGODB_URI || 'mongodb+srv://shamamal622_db_user:qYSj6H1fp0fQSMHO@mycluster.ry1j7cx.mongodb.net/?retryWrites=true&w=majority&appName=mycluster';

// Ensure database name 'nextask' is specified
let mongoUri = rawMongoUri;
if (mongoUri.includes('mongodb.net/?')) {
  mongoUri = mongoUri.replace('mongodb.net/?', 'mongodb.net/nextask?');
} else if (mongoUri.endsWith('mongodb.net/')) {
  mongoUri = mongoUri + 'nextask?retryWrites=true&w=majority';
} else if (mongoUri.endsWith('mongodb.net')) {
  mongoUri = mongoUri + '/nextask?retryWrites=true&w=majority';
}

const isDbConfigured = Boolean(mongoUri);

let client = null;
let db = null;

if (isDbConfigured) {
  client = new MongoClient(mongoUri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 8000
  });
}

const getDb = () => db;

const getCollection = (name) => {
  if (!db) throw new Error('Database not connected');
  return db.collection(name);
};

// Seed default demo datasets if collections are empty
const seedInitialDataIfEmpty = async () => {
  if (!db) return;

  const usersCol = db.collection('users');
  const userCount = await usersCol.countDocuments();
  if (userCount === 0) {
    console.log('Seeding initial MongoDB demo users...');
    await usersCol.insertMany([
      { id: '1', email: 'admin@saas.com', password_hash: 'admin123', full_name: 'Rajesh Sharma', role: 'admin', department: 'Executive', designation: 'Managing Director', joins_date: '2025-01-10', status: 'active', phone: '9876543210', documents: [{ name: 'Offer_Letter.pdf' }], created_at: new Date().toISOString() },
      { id: '2', email: 'head@saas.com', password_hash: 'head123', full_name: 'Vikram Malhotra', role: 'project_head', department: 'Engineering', designation: 'Technical Architect', joins_date: '2025-03-15', status: 'active', phone: '9876543211', documents: [], created_at: new Date().toISOString() },
      { id: '3', email: 'member@saas.com', password_hash: 'member123', full_name: 'Aravind Kumar', role: 'team_member', department: 'Engineering', designation: 'Senior Developer', joins_date: '2025-06-01', status: 'active', phone: '9876543212', documents: [], created_at: new Date().toISOString() }
    ]);
  }

  const clientsCol = db.collection('clients');
  const clientCount = await clientsCol.countDocuments();
  if (clientCount === 0) {
    console.log('Seeding initial MongoDB demo clients...');
    await clientsCol.insertMany([
      { id: 'c1', name: 'Rohan Gupta', email: 'rohan@apexcorp.com', phone: '9123456780', company: 'Apex Corp', status: 'onboarded', follow_up_notes: [{ date: '2026-08-10', note: 'Agreed on initial specifications.' }], onboarded_at: '2026-08-10T12:00:00Z', created_at: new Date().toISOString() },
      { id: 'c2', name: 'Priya Patel', email: 'priya@zenith.in', phone: '9123456781', company: 'Zenith Retail', status: 'follow_up', follow_up_notes: [{ date: '2026-08-08', note: 'Sent proposal, waiting on budget feedback.' }], onboarded_at: null, created_at: new Date().toISOString() }
    ]);
  }

  const projectsCol = db.collection('projects');
  const projCount = await projectsCol.countDocuments();
  if (projCount === 0) {
    console.log('Seeding initial MongoDB demo projects...');
    await projectsCol.insertOne({
      id: 'p1', name: 'Apex Dashboard Refactoring', client_id: 'c1', description: 'Redesigning the primary admin dashboard interface for Apex Corp using dynamic charts.', status: 'active', start_date: '2026-08-01', end_date: '2026-10-30', budget: 1500000.00, project_head_id: '2', created_at: new Date().toISOString()
    });
  }

  const tasksCol = db.collection('tasks');
  const taskCount = await tasksCol.countDocuments();
  if (taskCount === 0) {
    console.log('Seeding initial MongoDB demo tasks...');
    await tasksCol.insertOne({
      id: 't1', project_id: 'p1', title: 'Setup Tailwind CSS System', description: 'Configure custom themes, colors, and layout guidelines based on instructions.', assigned_to: '3', status: 'in_progress', start_date: '2026-08-05', end_date: '2026-08-20', created_at: new Date().toISOString()
    });
  }
};

const initializeDatabase = async () => {
  if (!client) return;
  try {
    console.log('Connecting to MongoDB Atlas Cluster...');
    await client.connect();
    db = client.db('nextask');
    console.log('Successfully connected to MongoDB database: nextask');

    // Create unique indices
    await db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});
    await db.collection('attendance').createIndex({ user_id: 1, date: 1 }, { unique: true }).catch(() => {});

    await seedInitialDataIfEmpty();
    console.log('MongoDB initialization and indexing ready.');
  } catch (err) {
    console.error('MongoDB connection error:', err.message || err);
    throw err;
  }
};

module.exports = {
  client,
  getDb,
  getCollection,
  isDbConfigured,
  initializeDatabase
};

