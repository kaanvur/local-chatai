import type { RequestHandler } from './$types';
import { API_URL, API_KEY  } from '$env/static/private';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
};

export const OPTIONS: RequestHandler = async () => {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
};
export const GET: RequestHandler = async () => {
    try {
        const response = await fetch(`${API_URL}/api/v1/auth`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify({ status: 'online', data }), {
            headers: CORS_HEADERS
        });
    } catch (error) {
        let errorMessage = 'Server is offline';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return new Response(JSON.stringify({ status: 'offline', error: errorMessage }), {
            headers: CORS_HEADERS
        });
    }
};

export const POST: RequestHandler = async ({ request }) => {
    const { message, sessionId } = await request.json();
    
    try {
        const response = await fetch(`${API_URL}/api/v1/workspace/deneme/stream-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'accept': 'text/event-stream'
            },
            body: JSON.stringify({
                message,
                sessionId,
                mode: 'query'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return new Response(response.body, {
            headers: {
                ...CORS_HEADERS,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });
    } catch (error) {
        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
};