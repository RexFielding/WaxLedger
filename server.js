const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple JSON file database
const DB_PATH = path.join(__dirname, 'collection.json');

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch(e) {}
  return { records: [] };
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Collection API
app.get('/collection', (req, res) => {
  const db = loadDB();
  res.json(db.records);
});

app.post('/collection', (req, res) => {
  const db = loadDB();
  const record = { ...req.body, id: Date.now() };
  db.records.unshift(record);
  saveDB(db);
  res.json(record);
});

app.delete('/collection/:id', (req, res) => {
  const db = loadDB();
  db.records = db.records.filter(r => r.id !== parseInt(req.params.id));
  saveDB(db);
  res.json({ ok: true });
});

// Anthropic proxy
app.post('/api/identify', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'Missing API key' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Discogs proxy
app.use('/api/discogs', async (req, res) => {
  const token = req.headers['x-discogs-token'];
  const discogsPath = req.path;
  const query = req.url.split('?')[1] || '';
  const url = `https://api.discogs.com${discogsPath}${query ? '?' + query + '&' : '?'}token=${token}`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'WaxLedger/1.0' } });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Wax Ledger running on port ' + PORT));
