import { v4 as uuidv4 } from 'uuid';
import cookie from 'cookie';

async function getAuthToken() {
  try {
    const authString = Buffer.from(`${process.env.ORACLE_CLIENT_ID}:${process.env.ORACLE_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(process.env.AUTH_URL, {
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

async function checkPreviousScore(id, score) {
  try {
    const authToken = await getAuthToken();

    const response = await fetch(`${process.env.ORACLE}${id}`, {
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

    if (data.count === 0) {
      return { exists: false, higher: false };
    }

    return { exists: true, higher: data.items[0].score < score, existingScore: data.items[0].score };

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
    const validLevels = ['Ground', 'Wood', 'Brick', 'Sand', 'Marble', 'Obsidian', 'Sleep', '???', 'Trash'];
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
        secure: process.env.ENV === 'prod',
        maxAge: 60 * 60 * 24 * 365 // 1 year
      })
    };

    // Check for previous highscore
    const { exists: alreadyExists, higher: isHigher, existingScore: existingScore } = await checkPreviousScore(uniqueUserId, score);

    // Get auth token
    const authToken = await getAuthToken();

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
      response = await fetch(`${process.env.ORACLE}${uniqueUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });
    } else if (!alreadyExists) {
      // Make POST request to submit new highscore
      response = await fetch(`${process.env.ORACLE}${uniqueUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });
    } else {
      // Score exists and is not higher, return a specific status code
      return {
        statusCode: 409, // Conflict status code
        body: JSON.stringify({ error: `Already submitted a higher score : ${existingScore}m` }),
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      };
    }

    // This part is now only reached if a POST or PUT was successful
    if (!response.ok) {
      // Handle potential errors from the actual POST/PUT request
      const errorBody = await response.text(); // Try to get error details from backend
      console.error(`Backend error: ${response.status} and body : ${errorBody}`);
      throw new Error(`Backend error: ${response.status}`);
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
