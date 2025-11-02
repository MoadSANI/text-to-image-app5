const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your frontend files

// Environment variables for security
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt, model = 'black-forest-labs/flux-1-schnell' } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    width: 1024,
                    height: 1024
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Cloudflare API error: ${response.status}`);
        }

        // Get the image as buffer
        const imageBuffer = await response.buffer();
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'inline');
        
        // Send the image
        res.send(imageBuffer);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Failed to generate image',
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
