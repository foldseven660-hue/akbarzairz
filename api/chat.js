export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    const { chatHistory, systemPrompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY; // Otomatis membaca kunci OpenAI dari Vercel

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key (OPENAI_API_KEY) belum dikonfigurasi di Environment Variables Vercel Anda.' });
    }

    try {
        const url = 'https://api.openai.com/v1/chat/completions';
        const openaiMessages = [];

        // 1. Masukkan Instruksi Karakter Utama (System Prompt)
        if (systemPrompt) {
            openaiMessages.push({ role: 'system', content: systemPrompt });
        }

        // 2. Cek apakah ini chat pertama kali atau lanjutan obrolan
        if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
            // Ambil maksimal 12 baris obrolan terakhir saja biar irit token & anti-error limit
            const limitedHistory = chatHistory.length > 12 ? chatHistory.slice(-12) : chatHistory;
            openaiMessages.push(...limitedHistory);
        } else {
            // JIKA KOSONG: Perintah rahasia ini otomatis memicu ChatGPT membuat kalimat pembuka
            openaiMessages.push({ 
                role: 'user', 
                content: 'Mulai roleplay! Langsung berikan sapaan, tindakan, atau dialog pembuka pertama kamu secara sepihak sesuai dengan karakter dan situasi yang diatur di system prompt.' 
            });
        }

        // 3. Tembak API OpenAI menggunakan model gpt-4o-mini (Super cepat, pintar, dan sangat murah)
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: openaiMessages,
                temperature: 0.85
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
