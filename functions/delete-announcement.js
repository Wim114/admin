const faunadb = require('faunadb');
const q = faunadb.query;

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'DELETE') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    // Check authentication
    const { user } = context.clientContext;
    if (!user || !user.app_metadata?.roles?.includes('admin')) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

    const client = new faunadb.Client({
        secret: process.env.FAUNA_SECRET_KEY
    });

    try {
        const id = event.queryStringParameters.id;

        await client.query(
            q.Delete(q.Ref(q.Collection('announcements'), id))
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to delete announcement' })
        };
    }
};