export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    const input = JSON.parse(event.body);
    try {
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GCLOUD}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "voice": {
                    "name": "en-GB-News-J",
                    "ssmlGender": "MALE",
                    "languageCode": "en-GB"
                },
                "input": {
                    "text": input
                },
                "audioConfig": {
                    "audioEncoding": "MP3"
                }
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate content' }),
        };
    }
};