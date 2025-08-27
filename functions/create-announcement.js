const faunadb = require('faunadb');
const q = faunadb.query;

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'POST') {
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
        const data = JSON.parse(event.body);

        const result = await client.query(
            q.Create(q.Collection('announcements'), {
                data: {
                    ...data,
                    createdAt: new Date().toISOString(),
                    createdBy: user.email,
                    isActive: true
                }
            })
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                id: result.ref.id,
                ...result.data
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create announcement' })
        };
    }
};