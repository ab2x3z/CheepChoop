export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    const { geminiModel, conversation } = JSON.parse(event.body);

    try {
        const result = await generateContent(geminiModel, conversation);

        log(conversation.contents[conversation.contents.length - 1].parts[0].text, result.candidates[0].content.parts[0].text);

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

async function generateContent(geminiModel, conversation) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(conversation),
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

function log(prompt, response){
    const bold = "\x1b[1m"
    const reset = "\x1b[0m"
    const magenta = "\x1b[35m"
    const cyan = "\x1b[36m"

    console.log(`\n${bold}${magenta}Prompt:${reset} ${prompt}\n\n${bold}${cyan}Response:${reset} ${response}\n`);
}