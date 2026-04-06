const fs = require('fs');
const https = require('https');

const CHANNEL_NAME = 'casebykeks'; // Твой канал без @

async function fetchTelegram() {
    const url = `https://t.me/s/${CHANNEL_NAME}`;
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function parsePosts(html) {
    const posts = [];
    const items = html.split('js-widget_message_wrap');

    for (let i = 1; i < items.length; i++) {
        const item = items[i];

        const textMatch = item.match(/js-message_text[^>]*>([\s\S]*?)<\/div>/);
        let text = textMatch ? textMatch[1].replace(/<[^>]*>/g, '').trim() : "";

        const linkMatch = item.match(/href="([^"]*?t\.me\/[^"]*?\/\d+)"/);
        const link = linkMatch ? linkMatch[1] : `https://t.me/${CHANNEL_NAME}`;

        let img = null;
        // Ищем фоновое изображение сообщения
        const imgMatch = item.match(/background-image:url\(['"]?([^'"]*?)['"]?\)/);

        if (imgMatch && imgMatch[1]) {
            // ИСПОЛЬЗУЕМ ПРОКСИ GOOGLE ДЛЯ ОБХОДА БЛОКИРОВКИ В РФ
            // Это самый стабильный способ увидеть картинки Telegram без VPN
            const rawImg = imgMatch[1];
            img = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(rawImg)}`;
        }

        const dateMatch = item.match(/datetime="([^"]*?)"/);
        const date = dateMatch ? dateMatch[1] : new Date().toISOString();

        if (text || img) {
            posts.push({ text, link, img, date });
        }
    }
    // Берем последние 50 постов для пагинации
    return posts.reverse().slice(0, 50);
}

async function run() {
    try {
        const html = await fetchTelegram();
        const posts = parsePosts(html);
        fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
        console.log(`Успешно сохранено ${posts.length} постов.`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();