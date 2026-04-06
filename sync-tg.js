const fs = require('fs');
const https = require('https');
const path = require('path');
const { URL } = require('url');

const CHANNEL_NAME = 'casebykeks';
const IMG_DIR = path.join(__dirname, 'cases-img');

// Создаем папку, если ее нет
if (!fs.existsSync(IMG_DIR)) {
    fs.mkdirSync(IMG_DIR);
}

// Умная функция скачивания напрямую
function downloadImage(requestUrl, filepath) {
    return new Promise((resolve) => {
        https.get(requestUrl, {
            headers: {
                // Маскируемся под обычный браузер
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        }, (res) => {
            if (res.statusCode === 200) {
                const file = fs.createWriteStream(filepath);
                res.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve(true); // Успешно скачали
                });

                file.on('error', () => {
                    fs.unlink(filepath, () => {}); // Удаляем битый файл
                    resolve(false);
                });
            } else if ([301, 302, 307, 308].includes(res.statusCode)) {
                const redirectUrl = new URL(res.headers.location, requestUrl).href;
                downloadImage(redirectUrl, filepath).then(resolve);
            } else {
                console.warn(`\n⚠️ Ошибка Telegram CDN (статус ${res.statusCode}): ${requestUrl}`);
                resolve(false);
            }
        }).on('error', (err) => {
            console.error(`\n❌ Ошибка сети: ${err.message}`);
            resolve(false);
        });
    });
}

async function fetchTelegram() {
    const url = `https://t.me/s/${CHANNEL_NAME}`;
    console.log(`Запрашиваю данные с: ${url}`);

    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
            // Берем ОРИГИНАЛЬНУЮ ссылку Telegram, так как сервера GitHub не заблокированы
            const rawUrl = imgMatch[1];

            const fileName = `case_${new Date(date).getTime()}.jpg`;
            const filePath = path.join(IMG_DIR, fileName);

            console.log(`Скачиваю: ${fileName}...`);

            // Ждем завершения скачивания и проверяем статус
            const isSuccess = await downloadImage(rawUrl, filePath);

            if (isSuccess) {
                // Записываем путь только если файл реально сохранился на диск!
                localImgPath = `./cases-img/${fileName}`;
            } else {
                console.log(`❌ Пропуск: не удалось скачать ${fileName}`);
            }
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
        console.log(`\n✅ Успешно обработано: ${posts.length} постов.`);
    } catch (err) {
        console.error("Ошибка выполнения:", err);
        process.exit(1);
    }
}

run();