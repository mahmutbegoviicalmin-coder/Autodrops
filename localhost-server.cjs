const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

console.log('🚀 Starting localhost server...');

app.get('/health', (req, res) => {
  console.log('📡 Health check requested');
  res.json({ 
    status: 'OK', 
    message: 'Localhost server is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint works!',
    success: true
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
  console.log(`📡 Test: http://localhost:${PORT}/health`);
});
