const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();

// This allows serving static files from the uploads directory
app.use('/resources', express.static(path.join(__dirname, 'resources')));

// database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST, // the database server
  port: process.env.PORTGRES_PORT, // the database port
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



app.engine('hbs', handlebars.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, '/views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Serve static files from resources directory
app.use(express.static(path.join(__dirname, 'resources')));

const username = undefined;

// Redirect root URL to /home
app.get('/', (req, res) => {
  res.redirect('/home');
});

app.post('/clear', async (req, res) => {
  try {
      const result = await db.one(
          'DROP TABLE users; CREATE TABLE users ( username VARCHAR(50) PRIMARY KEY, password VARCHAR(60) NOT NULL );'
      );
  } catch (error) {
      res.redirect('/register');
  }
});

app.get('/register', (req, res) => {
  const reason = req.query.reason || null;
  switch(reason) {
    case "account_already_exists":
      message = "This username is already taken. Choose another or log in.";
      break;
    default:
      message = null;
      break;
  }
  res.render('pages/register', { message });
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
        res.redirect('/register?reason=account_already_exists');
    }
});

app.get('/login', (req, res) => {
  const reason = req.query.reason || null;
  let message = null;
  switch(reason) {
    case "not_logged_in":
      message = "You must be logged in to access this page.";
      break;
    case "invalid_password":
      message = "Incorrect password. Please try again.";
      break;
    case "no_such_account":
      message = "Username not in database. Please register.";
      break;
    default:
      message = null;
      break;
  }
  res.render('pages/login', { message });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
      const result = await db.one(
          'SELECT * FROM users WHERE username = $1', [username]
      );
      const match = await bcrypt.compare(password, result.password);
      if (match) {
          // login
          req.session.username = username;
          req.session.save();
          res.redirect('/home');
      } else {
          res.redirect('/login?reason=invalid_password');
      }
  } catch (error) {
      res.redirect('/login?reason=no_such_account');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(function(err) {
    if(err) {
      console.error("Logout error:", err);
      return res.redirect('/parking');
    }
    res.render('pages/logout'); // Render the new logout page
  });
});

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.username) {
    // Default to login page.
    return res.redirect('/login?reason=not_logged_in');
  }
  next();
};

// Authentication Required
app.use(auth);

app.post('/changePassword', async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const username = req.session.username;

  if (!username) {
    return res.redirect('/login?reason=not_logged_in');
  }

  try {
    const user = await db.one('SELECT * FROM users WHERE username = $1', [username]);
    const match = await bcrypt.compare(currentPassword, user.password);

    if (match) {
      if (newPassword !== confirmPassword) {
        return res.redirect('/account?reason=passwords_do_not_match');
      } else if (newPassword == currentPassword) {
        return res.redirect('/account?reason=same_password');
      } else {
        const hash = await bcrypt.hash(newPassword, 10);
        await db.none('UPDATE users SET password = $1 WHERE username = $2', [hash, username]);
        res.redirect('/account?reason=password_changed');
      }
    } else {
      res.redirect('/account?reason=incorrect_old_password');
    }
  } catch (error) {
    console.error("Error changing password: ", error.message);
    res.redirect('/account?reason=error');
  }
});

app.get('/account', (req, res) => {
  const reason = req.query.reason || null;
  const username = req.session.username;
  let message = null;

  switch (reason) {
    case "passwords_do_not_match":
      message = "New passwords do not match. Please try again.";
      break;
    case "password_changed":
      message = "Password successfully changed.";
      break;
    case "incorrect_old_password":
      message = "Current password is incorrect. Please try again.";
      break;
    case "same_password":
      message = "New password cannot be the same as the old password.";
      break;
    case "error":
      message = "An error occurred while changing the password. Please try again.";
      break;
    default:
      message = null;
      break;
  }

  res.render('pages/account', { message, username });
});

app.get('/account', (req, res) => {
  const username = req.session.username;
  res.render('pages/account', { username });
});




app.get('/logout', (req, res) => {
  req.session.destroy(function(err) {
    if(err) {
      console.error("Logout error:", err);
      return res.redirect('/parking');
    }
    res.redirect('pages/logout'); // Render the new logout page
  });
});

// Home page route
app.get('/home', (req, res) => {
  res.render('pages/home', {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    hereApiKey: process.env.HERE_API_KEY,
    hereAppId: process.env.HERE_APP_ID
  });
});

app.get('/api/parking', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: { description: "Missing required parameters (lat, lng)" } 
      });
    }
    
    try {
      // First try the Discover API instead of Browse API - more reliable for points of interest
      const discoverUrl = `https://discover.search.hereapi.com/v1/discover?apiKey=${process.env.HERE_API_KEY}&q=parking&at=${lat},${lng}&limit=15`;
      
      console.log(`Using HERE Discover API URL: ${discoverUrl}`);
      
      const response = await axios.get(discoverUrl, { timeout: 5000 });
      console.log("HERE API response received");
      
      if (response.data.items && response.data.items.length > 0) {
        // Filter to only include actual parking locations
        const parkingResults = response.data.items.filter(item => {
          // Check if categories include parking or if title contains parking-related terms
          const hasParking = item.categories?.some(cat => 
            cat.name.toLowerCase().includes('parking') || 
            cat.id.includes('700-7600')
          );
          
          const titleHasParking = 
            item.title.toLowerCase().includes('parking') || 
            item.title.toLowerCase().includes('garage') ||
            item.title.toLowerCase().includes('lot');
            
          return hasParking || titleHasParking;
        });
        
        if (parkingResults.length > 0) {
          // Transform the response to match the expected format
          const transformedResults = parkingResults.map(item => {
            // Extract any payment information if available
            const paymentInfo = extractPaymentInfo(item);
            
            // Extract capacity information if available
            const capacityInfo = extractCapacityInfo(item);
            
            return {
              id: item.id,
              title: item.title,
              position: [item.position.lat, item.position.lng],
              vicinity: item.address?.label || 'Address not available',
              distance: item.distance,
              openingHours: { 
                text: item.openingHours?.text || extractOpeningHours(item) || 'N/A' 
              },
              paymentInfo: {
                rate: paymentInfo.rate,
                methods: paymentInfo.methods
              },
              totalSpaces: capacityInfo.totalSpaces,
              availableSpaces: capacityInfo.availableSpaces,
              operator: item.contacts?.length ? item.contacts[0].name : 'N/A',
              contacts: item.contacts || []
            };
          });
          
          return res.json({ results: transformedResults });
        }
      }
      
      // If we reach this point, the Discover API didn't return useful results
      console.log("No suitable parking locations found in Discover API, falling back to simulated data");
      res.json({ results: generateSimulatedParkingData(lat, lng) });
      
    } catch (apiError) {
      console.error("HERE API error:", apiError.message);
      
      // Fall back to simulated data since the API isn't working
      console.log("Falling back to simulated parking data");
      res.json({
        results: generateSimulatedParkingData(lat, lng)
      });
    }
  } catch (error) {
    console.error("Server error in /api/parking:", error.message);
    res.status(500).json({
      error: {
        description: "Internal server error, please try again later"
      }
    });
  }
});

// Helper function to extract payment information
function extractPaymentInfo(item) {
  // Try to extract payment information from various fields
  let rate = 'N/A';
  let methods = [];

  // Check if the API provides structured payment info
  if (item.paymentMethods) {
    methods = item.paymentMethods.map(method => method.type || method.name || 'Unknown');
  }
  
  // Try to extract rate from different possible fields
  if (item.additionalData) {
    const priceData = item.additionalData.find(data => 
      data.key && (data.key.includes('price') || data.key.includes('rate') || data.key.includes('fee'))
    );
    if (priceData && priceData.value) {
      rate = `${priceData.value}`;
    }
  }
  
  // Check categories for hints about payment options
  if (item.categories) {
    const payCategory = item.categories.find(cat => 
      cat.name.toLowerCase().includes('pay') || 
      cat.name.toLowerCase().includes('credit') ||
      cat.id.includes('payment')
    );
    
    if (payCategory && methods.length === 0) {
      methods.push(payCategory.name);
    }
  }
  
  return {
    rate: rate,
    methods: methods.length > 0 ? methods : ['Various payment methods']
  };
}

// Helper function to extract capacity information
function extractCapacityInfo(item) {
  let totalSpaces = 'N/A';
  let availableSpaces = 'N/A';
  
  // Check for capacity in the API response
  if (item.extended && item.extended.parkingFacility) {
    const facility = item.extended.parkingFacility;
    
    if (facility.totalCapacity) {
      totalSpaces = facility.totalCapacity.toString();
    }
    
    if (facility.availableSpots) {
      availableSpaces = facility.availableSpots.toString();
    }
  }
  
  return { totalSpaces, availableSpaces };
}

// Helper function to extract opening hours
function extractOpeningHours(item) {
  // Check various possible fields for opening hours
  if (item.extended && item.extended.openingHours) {
    return formatOpeningHours(item.extended.openingHours);
  }
  
  if (item.additionalData) {
    const hoursData = item.additionalData.find(data => 
      data.key && (data.key.includes('hours') || data.key.includes('open'))
    );
    if (hoursData && hoursData.value) {
      return hoursData.value;
    }
  }
  
  // Use a default value if no hours found
  return '24/7';
}

// Helper function to format opening hours from structured data
function formatOpeningHours(hoursObj) {
  if (!hoursObj) return '24/7';
  
  // Handle different structures of opening hours data
  if (hoursObj.text) return hoursObj.text;
  if (hoursObj.isOpen24Hours) return '24/7';
  
  // If there's a structured schedule, try to format it
  if (hoursObj.structured && hoursObj.structured.length > 0) {
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const todayHours = hoursObj.structured.find(day => day.weekday === today);
    
    if (todayHours) {
      if (todayHours.open && todayHours.close) {
        return `${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}`;
      }
    }
  }
  
  return 'N/A';
}

// Helper function to format time
function formatTime(timeString) {
  if (!timeString) return '';
  
  // Try to convert 24-hour format to 12-hour format
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes || '00'} ${suffix}`;
  } catch (e) {
    return timeString; // Return original if parsing fails
  }
}

// Function to generate simulated parking data for testing or fallback
function generateSimulatedParkingData(lat, lng) {
  const numSpots = Math.floor(Math.random() * 10) + 5; // 5-15 parking spots
  const spots = [];
  
  for (let i = 0; i < numSpots; i++) {
    // Generate a random offset from the central coordinates
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;
    
    const totalSpaces = Math.floor(Math.random() * 100) + 20;
    const availableSpaces = Math.floor(Math.random() * totalSpaces);
    
    spots.push({
      id: `parking-${i}-${Date.now()}`,
      title: `Parking ${i + 1}`,
      position: [parseFloat(lat) + latOffset, parseFloat(lng) + lngOffset],
      distance: Math.floor(Math.random() * 1000),
      vicinity: `${Math.floor(Math.random() * 1000) + 100} Main St, Boulder, CO`,
      totalSpaces: totalSpaces,
      availableSpaces: availableSpaces,
      openingHours: {
        text: Math.random() > 0.3 ? '24/7' : `${6 + Math.floor(Math.random() * 3)}:00 AM - ${6 + Math.floor(Math.random() * 6)}:00 PM`
      },
      paymentInfo: {
        rate: (Math.random() * 4 + 1).toFixed(2),
        methods: ['Credit Card', 'Cash']
      },
      operator: Math.random() > 0.5 ? 'City of Boulder' : 'Private Operator',
      contacts: [{
        phone: `303-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
      }]
    });
  }
  
  return spots;
}

module.exports = app.listen(3000);
