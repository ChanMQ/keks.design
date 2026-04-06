const fs = require('fs');
const https = require('https');

// УБЕДИСЬ, ЧТО ЭТО ИМЯ ТВОЕГО ПУБЛИЧНОГО КАНАЛА (БЕЗ @)
const CHANNEL_NAME = 'casebykeks'; 

async function fetchTelegram() {
    const url = `https://t.me/s/${CHANNEL_NAME}`;
    console.log(`Запрашиваю данные с: ${url}`);

    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' 
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function parsePosts(html) {
    const posts = [];
    // Делим HTML на блоки сообщений
    const items = html.split('js-widget_message_wrap');
    console.log(`Всего блоков найдено: ${items.length}`);

    for (let i = 1; i < items.length; i++) {
        const item = items[i];
        
        // 1. Ищем текст
        const textMatch = item.match(/js-message_text[^>]*>([\s\S]*?)<\/div>/);
        let text = textMatch ? textMatch[1].replace(/<[^>]*>/g, '').trim() : "";

        // 2. Ищем ссылку
        const linkMatch = item.match(/href="([^"]*?t\.me\/[^"]*?\/\d+)"/);
        const link = linkMatch ? linkMatch[1] : `https://t.me/${CHANNEL_NAME}`;

        // 3. Ищем картинку (пробуем разные варианты оформления в TG)
        let img = null;
        const imgRegs = [
            /background-image:url\(['"]?([^'"]*?)['"]?\)/,
            /data-src="([^"]*?)"/,
            /src="([^"]*?)"/
        ];
        
        for (let reg of imgRegs) {
            const match = item.match(reg);
            if (match && match[1] && !match[1].includes('favicon')) {
                img = match[1];
                break;
            }
        }

        // 4. Ищем дату
        const dateMatch = item.match(/datetime="([^"]*?)"/);
        const date = dateMatch ? dateMatch[1] : new Date().toISOString();

        if (text || img) {
            posts.push({ text, link, img, date });
        }
    }

    return posts.reverse().slice(0, 10);
}

async function run() {
    try {
        const html = await fetchTelegram();
        if (html.includes('tgme_sidebar_column_user_description')) {
            console.log("Страница канала получена успешно.");
        } else {
            console.warn("Предупреждение: Структура страницы отличается от ожидаемой.");
        }

        const posts = parsePosts(html);
        console.log(`Успешно спарсено постов: ${posts.length}`);

        fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
        console.log("Результат записан в posts.json");
    } catch (err) {
        console.error("Ошибка выполнения:", err);
        process.exit(1);
    }
}

run();
