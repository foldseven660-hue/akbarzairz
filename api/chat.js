export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    const { chatHistory, systemPrompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // Otomatis membaca dari Vercel Environment

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key (GEMINI_API_KEY) belum dikonfigurasi di Environment Variables Vercel Anda.' });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const payload = { contents: chatHistory };
        if (systemPrompt) {
            payload.system_instruction = { parts: [{ text: systemPrompt }] };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: `Kesalahan API Gemini: ${errorText}` });
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        return res.status(200).json({ text: aiResponse });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
