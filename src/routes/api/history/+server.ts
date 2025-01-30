import type { RequestHandler } from './$types';
import { VITE_API_URL, VITE_API_KEY } from '$env/static/private';

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
interface ChatMessage {
    content: string;
    role: string;
    sentAt: string;
    chatId: string;
}

interface TransformedMessage {
    text: string;
    isUser: boolean;
    timestamp: string;
    id: string;
    responded: boolean;
}

export const GET: RequestHandler = async ({ url }) => {
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
        return new Response(JSON.stringify({ error: 'Session ID is required' }), {
            status: 400,
            headers: CORS_HEADERS
        });
    }

    try {
        const response = await fetch(`${VITE_API_URL}/api/v1/workspace/deneme/chats?apiSessionId=${sessionId}&orderBy=asc`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${VITE_API_KEY}`,
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorStatus = response.status;
            let errorMessage = 'Failed to fetch chat history';
            
            switch (errorStatus) {
                case 401:
                    errorMessage = 'Unauthorized access';
                    break;
                case 404:
                    errorMessage = 'Chat history not found';
                    break;
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();


        const transformedData: TransformedMessage[] = data.history.map((msg: ChatMessage) => ({
            text: msg.content,
            isUser: msg.role === 'user',
            timestamp: msg.sentAt,
            id: msg.chatId,
            responded: true
        }));

        return new Response(JSON.stringify(transformedData), {
            headers: CORS_HEADERS
        });
    } catch (error) {
        let errorMessage = 'Failed to fetch chat history';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
};