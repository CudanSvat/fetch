const https = require('https');

module.exports = async (req, res) => {
  const contract = req.query.address;
  if (!contract) {
    res.status(400).json({ error: 'Missing contract address' });
    return;
  }

  try {
    // Try to fetch from Voyager's API if it exists
    const url = `https://voyager.online/api/contract/${contract}`;
    
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

    // If we get here, we found an API endpoint
    res.status(200).json(data);
    
  } catch (error) {
    // If API doesn't exist, return error
    res.status(500).json({ 
      error: 'No API endpoint found, need to use browser approach',
      details: error.message 
    });
  }
};
