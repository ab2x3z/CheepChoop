export const handler = async () => {

    return {
        statusCode: 200,
        body: JSON.stringify({ env: `${process.env.ENV}` })
    };
};
