const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.INTERNAL_PORT || 8080;

// Serve static files (HTML, CSS, JS, etc.) from the app directory
app.use(express.static(path.join(__dirname)));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
