<h1>Welcome to P4rk - Find Parking Fast</h1>

<p>P4rk is an interactive parking application designed to eliminate the frustration of finding parking in urban areas and busy venues.</p>

<h2>DESCRIPTION</h2>

<p>P4rk provides an intuitive interactive map interface that allows users to find the best available parking at any time. Simply share your location, search for a destination, or browse for parking in your area to get immediate results.</p>

<p>Key features:</p>
<ul>
  <li><strong>Interactive Map</strong>: View parking spots in real-time with availability status</li>
  <li><strong>Detailed Information</strong>: Get pricing, operating hours, and capacity information for each parking location</li>
  <li><strong>Navigation</strong>: Get instant directions to your chosen parking spot</li>
  <li><strong>Animated UI</strong>: Enjoy a modern, responsive interface with smooth animations and transitions</li>
  <li><strong>Parking Details</strong>: View comprehensive information about each parking facility including payment methods, features, and walking distance</li>
</ul>

<p>P4rk uses the HERE API to provide accurate parking information and Google Maps for visualization and directions, creating a seamless experience for finding and navigating to parking spots.</p>

<h2>CONTRIBUTORS</h2>

<ul>
  <li>Timothy Bermon (<a href="https://github.com/timberman05">@timberman05</a>) - tibe9793@colorado.edu</li>
  <li>Sean Broderick (<a href="https://github.com/seandbroderick">@seandbroderick</a>) - sebr2861@colorado.edu</li>
  <li>Israt Jaman (<a href="https://github.com/israt-jaman">@israt-jaman</a>) - israt.jaman@colorado.edu</li>
  <li>Logan Kernan (<a href="https://github.com/loke1941">@loke1941</a>) - loke1941@colorado.edu</li>
  <li>Razvan Maioru (<a href="https://github.com/razvanmaioru9542">@razvanmaioru9542</a>) - rama9542@colorado.edu</li>
  <li>Ethan Meli (<a href="https://github.com/EthanMeli">@EthanMeli</a>) - etme6835@colorado.edu</li>
</ul>

<h2>TECHNOLOGY STACK</h2>

<p><strong>Frontend</strong>:</p>
<ul>
  <li>HTML5, CSS3, JavaScript</li>
  <li>Bootstrap 5 (UI framework)</li>
  <li>Bootstrap Icons (icon library)</li>
  <li>Handlebars (templating engine)</li>
</ul>

<p><strong>Backend</strong>:</p>
<ul>
  <li>Node.js</li>
  <li>Express.js (web framework)</li>
  <li>Express-Handlebars (view templating)</li>
  <li>Express-Session (user authentication)</li>
</ul>

<p><strong>APIs</strong>:</p>
<ul>
  <li>Google Maps API (map display, search functionality)</li>
  <li>HERE API (parking location data)</li>
</ul>

<p><strong>Database</strong>:</p>
<ul>
  <li>PostgreSQL (user account storage)</li>
  <li>pg-promise (PostgreSQL client)</li>
</ul>

<p><strong>Authentication</strong>:</p>
<ul>
  <li>bcryptjs (password hashing)</li>
  <li>Express-session (session management)</li>
</ul>

<p><strong>Development Tools</strong>:</p>
<ul>
  <li>Docker & Docker Compose (containerization)</li>
  <li>Nodemon (development server)</li>
  <li>Mocha & Chai (testing frameworks)</li>
</ul>

<h2>PREREQUISITES</h2>

<p>Before running this application, you'll need:</p>

<ol>
  <li>Docker and Docker Compose installed on your machine</li>
  <li>Node.js and npm (for local development)</li>
  <li>Google Maps API key with Places API enabled</li>
  <li>HERE API key with Discover API enabled</li>
  <li>PostgreSQL (handled by Docker setup)</li>
</ol>

<h2>HOW TO RUN ON YOUR LOCAL MACHINE</h2>

<ol>
  <li>Clone the repository:
    <pre><code>git clone https://github.com/seandbroderick/csci-3308-group-project.git
cd csci-3308-group-project/ProjectSourceCode</code></pre>
  </li>
  <li>Create a <code>.env</code> file in the <code>src</code> directory with the following content:
    <pre><code># Database credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=pwd
POSTGRES_DB=users_db
POSTGRES_HOST=db
PORT=5432

# API Keys
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
HERE_API_KEY=your_here_api_key
HERE_APP_ID=your_here_app_id

# Session secret
SESSION_SECRET=your_secret_key</code></pre>
  </li>
  <li>Start the application with Docker:
    <pre><code>cd src
docker compose up</code></pre>
  </li>
  <li>Access the application at <code>http://localhost:3000</code></li>
</ol>

<h2>HOW TO RUN TESTS</h2>

<p>The project includes a test suite using Mocha and Chai:</p>

<pre><code>npm run testandrun</code></pre>

<p>This will:</p>
<ol>
  <li>Install dependencies</li>
  <li>Run the test suite</li>
  <li>Start the application</li>
</ol>

<h2>LINK TO APPLICATION</h2>

<p>The P4rk application will be available at:
<a href="https://csci-3308-group-project.onrender.com" target="_blank">https://csci-3308-group-project.onrender.com</a></p>

<hr>

<p>For people who hate wasting time waiting around for parking spots, P4rk is an app that finds cheap parking nearby quickly. Unlike ParkMobile, P4rk searches for all parking lots in your area, not just sponsored lots.</p>
