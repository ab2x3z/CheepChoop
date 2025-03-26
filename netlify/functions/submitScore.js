import { v4 as uuidv4 } from 'uuid';
import cookie from 'cookie';

async function getAuthToken() {
  try {
    const authUrl = `https://g6db25fb47e8e54-firstdb.adb.ca-montreal-1.oraclecloudapps.com/ords/admin/oauth/token`;

    if (!userId || !userSecret) {
      throw new Error("ORACLE_CLIENT_ID and ORACLE_CLIENT_SECRET environment variables must be set.");
    }

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
    return data.access_token;  // Assuming the response contains an access_token field
  } catch (error) {
    console.error('Error getting auth token:', error);
    console.error('Error details:', error.message, error.stack);
    throw error;
  }
}

async function checkPreviousScore(id, score) {
  try {
    const response = await fetch(process.env.ORACLE);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const entries = data.items;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      const decodedId = Buffer.from(entry.id, 'base64').toString('hex').toUpperCase();

      if (decodedId === id && entry.score < score) {
        return { exists: true, higher: true };
      } else if (decodedId === id && entry.score >= score) {
        return { exists: true, higher: false };
      }
    }

    return { exists: false, higher: false };

  } catch (error) {
    console.error('Error retrieving high scores:', error);
    console.error('Error details:', error.message, error.stack);
    return { exists: false, higher: false };
  }
}

export const handler = async (event, context) => {
  console.log('submitScore function invoked');

  // Check method
  if (event.httpMethod !== 'POST') {
    console.log('Method Not Allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Parse and validate input
    const { playerName, score, level } = JSON.parse(event.body);

    // Validate playerName
    if (!playerName || typeof playerName !== 'string' ||
      playerName.length > 50 ||
      !/^[a-zA-Z0-9-_. ]+$/.test(playerName)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid player name' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Validate score
    const numScore = Number(score);
    if (isNaN(numScore) || numScore <= 0 || numScore > 9999) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid score' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Validate level
    const validLevels = ['Ground', 'Wood', 'Brick', 'Sand', 'Marble', 'Obsidian', 'Sleep'];
    if (!validLevels.includes(level)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid level' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Sanitize playerName for XSS prevention
    const sanitizedName = playerName
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Generate or retrieve unique ID from cookies
    let uniqueUserId;
    const cookies = cookie.parse(event.headers.cookie || '');
    if (cookies.uniqueUserId) {
      uniqueUserId = cookies.uniqueUserId;
    } else {
      uniqueUserId = uuidv4().replace(/-/g, '').toUpperCase(); // Generate a 32-character ID
    }

    // Set the cookie if not already set
    const setCookieHeader = cookies.uniqueUserId ? {} : {
      'Set-Cookie': cookie.serialize('uniqueUserId', uniqueUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365 // 1 year
      })
    };

    // Check for previous highscore
    const { exists: alreadyExists, higher: isHigher } = await checkPreviousScore(uniqueUserId, score);

    console.log('alreadyExists:', alreadyExists);
    console.log('isHigher:', isHigher);


    // Prepare payload
    const payload = {
      id: uniqueUserId,
      player_name: sanitizedName,
      score: numScore.toString(),
      lastlevel: level
    };

    let response;
    if (alreadyExists && isHigher) {
      // Make PUT request to update existing highscore
      response = await fetch(`${process.env.ORACLE}/${uniqueUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } else if (!alreadyExists) {
      // Make POST request to submit new highscore
      response = await fetch(process.env.ORACLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } else {
      throw new Error('Already submitted a higher score!')
    }

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    let result;
    try {
      result = await response.json();
      console.log('Response parsed successfully:');
    } catch (parseError) {
      throw parseError;
    }

    // Return success
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Score submitted successfully' }),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...setCookieHeader
      }
    };

  } catch (error) {
    console.error('Error details:', error);
    // Return generic error to client
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
