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

    // Check if the response contains holders data
    if (data && (data.holders || data.holder_count || data.number_of_holders)) {
      const holders = data.holders || data.holder_count || data.number_of_holders;
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
      res.status(200).json({ holders: parseInt(holders) });
    } else {
      res.status(404).json({ error: 'Holders count not found in API response' });
    }
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Voyager API not available',
      details: error.message 
    });
  }
};
