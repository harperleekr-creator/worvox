const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Disable caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public/static')));

// Routes for prototypes
app.get('/prototype-courses', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/static/prototype-courses.html'));
});

app.get('/prototype-profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/static/prototype-profile.html'));
});

app.get('/prototype', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/static/dashboard-modern-prototype.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Prototype server running on http://0.0.0.0:${PORT}`);
});
