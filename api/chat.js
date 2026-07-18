export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    const { chatHistory, systemPrompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY; // Menggunakan kunci OpenAI

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key (OPENAI_API_KEY) belum dikonfigurasi di Vercel.' });
    }

    try {
        const url = 'https://api.openai.com/v1/chat/completions';
        
        // 1. Set instruksi karakter (System Prompt)
        const openaiMessages = [];
        if (systemPrompt) {
            openaiMessages.push({ role: 'system', content: systemPrompt });
        }

        // 2. Ambil 10 chat terakhir & konversi format Gemini ke format OpenAI
        const limitedHistory = chatHistory && chatHistory.length > 10 
            ? chatHistory.slice(-10) 
            : chatHistory;

        if (limitedHistory && Array.isArray(limitedHistory)) {
            limitedHistory.forEach(msg => {
                let content = '';
                if (msg.content) content = msg.content;
                else if (msg.parts && msg.parts[0]) content = msg.parts[0].text;
                
                // Ubah role 'model' milik Gemini menjadi 'assistant' milik OpenAI
                let role = msg.role === 'model' ? 'assistant' : msg.role;
                
                openaiMessages.push({ role, content });
            });
        }

        // 3. Kirim data ke OpenAI menggunakan model gpt-4o-mini (paling murah & pintar)
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: openaiMessages
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: `Kesalahan API ChatGPT: ${errorText}` });
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        return res.status(200).json({ text: aiResponse });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
