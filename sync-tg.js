const fs = require('fs');
const https = require('https');
const path = require('path');

const CHANNEL_NAME = 'casebykeks';
const IMG_DIR = path.join(__dirname, 'cases-img');

if (!fs.existsSync(IMG_DIR)) {
    fs.mkdirSync(IMG_DIR);
}

// Улучшенная функция скачивания: умеет ходить по редиректам (301, 302)
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        }, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                   .on('error', reject)
                   .once('close', () => resolve(filepath));
            } else if (res.statusCode === 301 || res.statusCode === 302) {
                // Если прокси делает редирект — следуем по нему
                downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
            } else {
                console.warn(`Ошибка скачивания: статус ${res.statusCode} для ${url}`);
                res.resume();
                resolve(null);
            }
        }).on('error', reject);
    });
}

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

async function parsePosts(html) {
    const posts = [];
    const items = html.split('js-widget_message_wrap');

    for (let i = 1; i < items.length; i++) {
        const item = items[i];

        const textMatch = item.match(/js-message_text[^>]*>([\s\S]*?)<\/div>/);
        let text = textMatch ? textMatch[1].replace(/<[^>]*>/g, '').trim() : "";

        const linkMatch = item.match(/href="([^"]*?t\.me\/[^"]*?\/\d+)"/);
        const link = linkMatch ? linkMatch[1] : `https://t.me/${CHANNEL_NAME}`;

        const dateMatch = item.match(/datetime="([^"]*?)"/);
        const date = dateMatch ? dateMatch[1] : new Date().toISOString();

        let localImgPath = null;
        const imgMatch = item.match(/background-image:url\(['"]?([^'"]*?)['"]?\)/);

        if (imgMatch && imgMatch[1]) {
            const rawUrl = imgMatch[1];

            // Используем codetabs — он не режет картинки.
            // Альтернатива если и этот отвалится: `https://api.allorigins.win/raw?url=${encodeURIComponent(rawUrl)}`
            const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${rawUrl}`;

            const fileName = `case_${new Date(date).getTime()}.jpg`;
            const filePath = path.join(IMG_DIR, fileName);

            console.log(`Скачиваю: ${fileName}...`);
            await downloadImage(proxyUrl, filePath);

            localImgPath = `./cases-img/${fileName}`;
        }

        if (text || localImgPath) {
            posts.push({ text, link, img: localImgPath, date });
        }
    }

    return posts.reverse().slice(0, 30);
}

async function run() {
    try {
        const html = await fetchTelegram();
        const posts = await parsePosts(html);

        fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
        console.log(`Успешно спарсено: ${posts.length} постов.`);
        console.log("Проверь папку /cases-img/, там должны лежать загруженные картинки.");
    } catch (err) {
        console.error("Ошибка выполнения:", err);
        process.exit(1);
    }
}

run();