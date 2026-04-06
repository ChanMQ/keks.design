const fs = require('fs');
const https = require('https');

const CHANNEL_NAME = 'casebykeks';

function fetchTelegram() {
    const url = `https://t.me/s/${CHANNEL_NAME}`;

    https.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            parseAndSave(data);
        });
    }).on('error', (err) => {
        console.error('Error fetching Telegram:', err.message);
        process.exit(1);
    });
}

function parseAndSave(html) {
    const posts = [];
    // Регулярные выражения для поиска данных в HTML телеграма
    const messageBlockRegex = /<div class="tgme_widget_message_bubble">([\s\S]*?)<div class="tgme_widget_message_footer">/g;
    let match;

    while ((match = messageBlockRegex.exec(html)) !== null && posts.length < 9) {
        const block = match[1];

        // Извлекаем ссылку на пост
        const linkMatch = html.substring(match.index - 500, match.index).match(/href="(https:\/\/t\.me\/casebykeks\/\d+)"/);
        const link = linkMatch ? linkMatch[1] : `https://t.me/${CHANNEL_NAME}`;

        // Извлекаем картинку
        const imgMatch = block.match(/background-image:url\(['"](.*?)['"]\)/);
        const img = imgMatch ? imgMatch[1] : null;

        // Извлекаем текст
        const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
        let text = textMatch ? textMatch[1].replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '').trim() : '';
        if (text.length > 120) text = text.substring(0, 120) + '...';

        // Извлекаем дату
        const dateMatch = html.substring(match.index, match.index + 1000).match(/datetime="(.*?)"/);
        const date = dateMatch ? dateMatch[1] : new Error().toISOString();

        if (img || text) {
            posts.push({ img, text, link, date });
        }
    }

    fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
    console.log(`Successfully synced ${posts.length} posts to posts.json`);
}

fetchTelegram();