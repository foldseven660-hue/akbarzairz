export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    const { chatHistory, systemPrompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key (GEMINI_API_KEY) belum dikonfigurasi di Environment Variables Vercel Anda.' });
    }

    try {
        // PERBAIKAN FINAL 2026: Menggunakan v1beta + gemini-2.0-flash yang mendukung penuh fitur systemInstruction
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const payload = { contents: chatHistory };
        
        if (systemPrompt) {
            payload.systemInstruction = { 
                parts: [{ text: systemPrompt }] 
            };
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
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            return res.status(500).json({ error: 'Format balasan API tidak sesuai atau kosong.' });
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ text: aiResponse });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
