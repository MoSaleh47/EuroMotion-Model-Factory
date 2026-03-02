/**
 * API Proxy Server for Mistral AI
 * 
 * This server keeps the API key secure on the server side
 * and proxies requests from the frontend to Mistral's API.
 */

import express from 'express';
import cors from 'cors';
import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PROXY_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Mistral client
const mistral = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', hasApiKey: !!process.env.MISTRAL_API_KEY });
});

// Chat completion endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { systemPrompt, userMessage, currentConfig, simulationResults } = req.body;

        if (!process.env.MISTRAL_API_KEY) {
            return res.status(500).json({
                error: 'MISTRAL_API_KEY not configured. Please add it to your .env file.'
            });
        }

        // Build the full system context
        const fullSystemPrompt = `${systemPrompt}

Current Model Configuration:
\`\`\`json
${JSON.stringify(currentConfig, null, 2)}
\`\`\`

${simulationResults ? `Current Simulation Results Summary:
- Final Market Share: ${simulationResults.market_share?.[simulationResults.market_share.length - 1]?.toFixed(1)}%
- Final Production Capacity: ${simulationResults.production_capacity?.[simulationResults.production_capacity.length - 1]?.toFixed(0)} units
- Cumulative Revenue: €${(simulationResults.cumulative_revenue?.[simulationResults.cumulative_revenue.length - 1] / 1000000)?.toFixed(1)}M
- Final Backlog: ${simulationResults.backlog?.[simulationResults.backlog.length - 1]?.toFixed(0)} units
` : ''}`;

        const response = await mistral.chat.complete({
            model: 'mistral-small-latest',
            messages: [
                { role: 'system', content: fullSystemPrompt },
                { role: 'user', content: userMessage }
            ],
            responseFormat: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;

        // Try to parse as JSON
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(content);
        } catch (parseError) {
            // If not valid JSON, wrap the response
            parsedResponse = {
                explanation: content,
                confidence: 0.5,
                changes: null,
                reasoning: 'Response was not in expected JSON format'
            };
        }

        res.json(parsedResponse);

    } catch (error) {
        console.error('Mistral API Error:', error);
        res.status(500).json({
            error: 'Failed to get AI response',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🤖 AI Proxy Server running on http://localhost:${PORT}`);
    console.log(`   API Key configured: ${!!process.env.MISTRAL_API_KEY}`);
});
