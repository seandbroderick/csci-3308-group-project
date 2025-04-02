const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
require('dotenv').config();

const app = express();






// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });










app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, '/views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials')
}));
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());



app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await db.none(
            'INSERT INTO users(username, password) VALUES($1, $2)', [username, hash]
        );
        res.redirect('/login');
    } catch (error){
        console.error("Error inserting user into the database: ", error.message);
        res.redirect('/register');
    }
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.one(
            `SELECT * FROM users WHERE username = '${username}'`
        );
        const match = await bcrypt.compare(password, result.password);
        if(match){
            // login
            req.session.username = username;
            req.session.save();
            res.redirect('/discover');
        } else {
            res.redirect('/login');
        }
    } catch (error){
        console.error("Error logging user into the database: ", error.message);
        res.redirect('/register');
    }
});

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.username) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

// Authentication Required
app.use(auth);

app.get('/logout', (req, res) => {
    req.session.username = null;
    res.render('pages/logout');
});






app.get('/parking', (req, res) => {
  // Sample parking data, this needs to be replaced with the actual API calls
  const parkingLocations = [
    { name: 'Downtown Parking', lat: 40.7128, lng: -74.0060, available: 15 },
    { name: 'Central Garage', lat: 40.7150, lng: -74.0080, available: 42 },
    { name: 'Riverfront Lot', lat: 40.7100, lng: -74.0030, available: 8 }
  ];
  
  res.render('parking-map', {
    defaultLat: 40.7128,
    defaultLng: -74.0060,
    defaultZoom: 14,
    parkingLocations,
    json: obj => JSON.stringify(obj),
    mapApiKey: process.env.GOOGLE_MAPS_API_KEY
  });
});






app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

module.exports = app.listen(3000);