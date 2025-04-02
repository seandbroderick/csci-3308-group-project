const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
require('dotenv').config();

const app = express();

app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
  //TODO (Authentication)
  //on sucessful registration, redirect to main/map page
  //on failure, redirect to register page
  //on username/email taken, redirect to login page
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post('/login', async (req, res) => {
  //TODO (Authentication)
  //on sucessful login, redirect to main/map page
  //on failure, redirect to login page
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

app.listen(3000, () => {
  console.log('Server running on port 3000');
});