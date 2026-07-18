export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode Tidak Diizinkan' });
    }

    const { chatHistory, systemPrompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY; 

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key (OPENAI_API_KEY) belum dikonfigurasi di Vercel.' });
    }

    try {
        const url = 'https://api.openai.com/v1/chat/completions';
        const openaiMessages = [];

        // 1. Masukkan instruksi karakter (System Prompt) di paling atas
        if (systemPrompt) {
            openaiMessages.push({ role: 'system', content: systemPrompt });
        }

        // 2. Cek apakah ini chat pertama kali atau sudah ada riwayatnya
        if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
            // Jika sudah ada riwayat, ambil 10 chat terakhir saja biar hemat kuota
            const limitedHistory = chatHistory.length > 10 ? chatHistory.slice(-10) : chatHistory;
            
            limitedHistory.forEach(msg => {
                let content = msg.content || (msg.parts && msg.parts[0]?.text) || '';
                let role = msg.role === 'model' ? 'assistant' : msg.role;
                openaiMessages.push({ role, content });
            });
        } else {
            // TRIK UTAMA: Jika chat masih kosong, berikan perintah tersembunyi
            // agar ChatGPT langsung memberikan teks pembuka/sapaan sesuai karakternya
            openaiMessages.push({ role: 'user', content: 'Mulai roleplay! Sapa saya pertama kali sesuai dengan karakter dan situasi kamu.' });
        }

        // 3. Panggil API ChatGPT (Menggunakan model gpt-4o-mini yang super cepat & murah)
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
