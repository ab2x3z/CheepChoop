async function getAuthToken() {
  try {
    const authUrl = `https://g6db25fb47e8e54-firstdb.adb.ca-montreal-1.oraclecloudapps.com/ords/admin/oauth/token`;

    const authString = Buffer.from(`${process.env.ORACLE_CLIENT_ID}:${process.env.ORACLE_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Failed to retrieve auth token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data.access_token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    console.error('Error details:', error.message, error.stack);
    throw error;
  }
}

export const handler = async (event, context) => {
  console.log('getHighScores function invoked');

  if (event.httpMethod !== 'GET') {
    console.log('Method Not Allowed:', event.httpMethod);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const authToken = await getAuthToken();

    const response = await fetch(`${process.env.ORACLE}getAll`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('High scores retrieved successfully');

    return {
      statusCode: 200,
      body: JSON.stringify(data.items)
    };

  } catch (error) {
    console.error('Error retrieving high scores:', error);
    console.error('Error details:', error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve high scores', details: error.message })
    };
  }
};
