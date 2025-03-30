export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    const { geminiModel, input } = JSON.parse(event.body);

    try {
        const result = await generateContent(geminiModel, input);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(result),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate content' }),
        };
    }
};

async function generateContent(geminiModel, inputText) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI}`;
    const sysPrompt = `I am a sarcastic narrator of CheepChoop, a brutally difficult web platformer. Players climb to increasingly absurd heights, often failing spectacularly and returning to the start.

    Task: Upon reaching a new level, I will generate a single-sentence, sarcastically congratulatory message. The message must:
    - Include the level name.
    - Use playful, condescending humor.
    - If and only if the prompt includes the phrase "[ALREADY_REACHED]", acknowledge the player has reached the level before. Do not mention "[ALREADY_REACHED]" literally.
    - If and only if the prompt includes the phrase "[NUMBER OF FALLS: X]", Incorporate the number of falls (X) into the sarcastic congratulations. Do not mention "[NUMBER OF FALLS: X]" literally.`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    role: "model",
                    parts: [
                      { "text": sysPrompt }
                    ]
                  },
                  {
                    role: "user",
                    parts: [
                      { "text": inputText }
                    ]
                  }],
                generationConfig: {
                    temperature: 2,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "text/plain"
                }
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}