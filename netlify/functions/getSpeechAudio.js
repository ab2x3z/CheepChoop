export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    const { input, voice } = JSON.parse(event.body);
    try {
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GCLOUD}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "voice": voice,
                "input": {
                    "text": input
                },
                "audioConfig": {
                    "audioEncoding": "OGG_OPUS"
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