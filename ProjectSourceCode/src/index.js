const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// This allows serving static files from the uploads directory
app.use('/resources', express.static(path.join(__dirname, 'resources')));







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

  res.render('pages/account', { message });
});

app.get('/account', (req, res) => {
  res.render('pages/account');
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
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
  });
});

module.exports = app.listen(3000);
