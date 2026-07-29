const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.post('/api/identify', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'Missing API key' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use('/api/discogs', async (req, res) => {
  const token = req.headers['x-discogs-token'];
  const discogsPath = req.path;
  const query = req.url.split('?')[1] || '';
  const url = `https://api.discogs.com${discogsPath}${query ? '?' + query + '&' : '?'}token=${token}`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'WaxLedger/1.0' } });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Wax Ledger running on port ' + PORT));
