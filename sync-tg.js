const fs = require('fs');
const https = require('https');

// НАСТРОЙКИ: Замени на имя своего канала без @
const CHANNEL_NAME = 'casebykeks'; 

async function fetchTelegram() {
    const url = `https://t.me/s/${CHANNEL_NAME}`;

    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function parsePosts(html) {
    const posts = [];
    // Регулярка для поиска блоков сообщений
    const msgBlocks = html.split('js-widget_message_wrap');
    
    // Пропускаем первый кусок (там шапка сайта)
    for (let i = 1; i < msgBlocks.length; i++) {
        const block = msgBlocks[i];
        
        try {
            // Извлекаем текст поста
            const textMatch = block.match(/js-message_text[^>]*>([\s\S]*?)<\/div>/);
            let text = textMatch ? textMatch[1].replace(/<[^>]*>/g, '').trim() : "";

            // Извлекаем ссылку на пост
            const linkMatch = block.match(/href="([^"]*?t\.me\/[^"]*?\/\d+)"/);
            const link = linkMatch ? linkMatch[1] : `https://t.me/${CHANNEL_NAME}`;

            // Извлекаем картинку (background-image)
            const imgMatch = block.match(/background-image:url\(['"]?([^'"]*?)['"]?\)/);
            const img = imgMatch ? imgMatch[1] : null;

            // Извлекаем дату
            const dateMatch = block.match(/datetime="([^"]*?)"/);
            const date = dateMatch ? dateMatch[1] : new Date().toISOString();

            // Добавляем пост, только если есть хоть какой-то контент
            if (text || img) {
                posts.push({ text, link, img, date });
            }
        } catch (e) {
            console.error("Ошибка парсинга блока:", e);
        }
    }
    // Возвращаем последние 6-9 постов в обратном порядке (новые сверху)
    return posts.reverse().slice(0, 9);
}

async function run() {
    console.log(`Начинаю парсинг канала: ${CHANNEL_NAME}...`);
    try {
        const html = await fetchTelegram();
        const posts = parsePosts(html);
        
        console.log(`Найдено постов: ${posts.length}`);
        
        fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
        console.log('Файл posts.json успешно обновлен!');
    } catch (err) {
        console.error('Критическая ошибка:', err);
        process.exit(1);
    }
}

run();
