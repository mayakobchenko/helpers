// server-token.js (Node / Express backend)
import fetch from 'node-fetch'; // or use global fetch if Node >= 18
import express from 'express';

const app = express();
const endpointURL = 'https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token';
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

app.get('/get-token', async (req, res) => {
  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'openid group roles email profile team'
    });

    // Prefer Basic auth for client credentials
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(endpointURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basic}`
      },
      body: params.toString()
    });

    const text = await response.text(); // read text first for better error logging
    let json;
    try { json = JSON.parse(text); } catch(e) { json = null; }

    if (!response.ok) {
      console.error('Token endpoint returned', response.status, text);
      return res.status(502).json({ error: 'token_endpoint_error', status: response.status, body: text });
    }

    return res.json(json);
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'request_failed', message: err.message });
  }
});

app.listen(3000);
