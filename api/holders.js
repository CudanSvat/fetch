const https = require('https');

module.exports = async (req, res) => {
  const contract = req.query.address;
  if (!contract) {
    res.status(400).json({ error: 'Missing contract address' });
    return;
  }

  try {
    // Try Voyager's beta API
    const url = `https://api.voyager.online/beta/contract/${contract}`;
    
    const data = await new Promise((resolve, reject) => {
      https.get(url, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    // Return the full response so we can see what fields are available
    res.status(200).json({ 
      message: 'Full API response',
      data: data,
      keys: Object.keys(data || {})
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Voyager API not available',
      details: error.message 
    });
  }
};
