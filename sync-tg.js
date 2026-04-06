const fs = require('fs');
const https = require('https');
const path = require('path');
const { URL } = require('url');

const CHANNEL_NAME = 'casebykeks';
const IMG_DIR = path.join(__dirname, 'cases-img');
const MAX_PAGES = 5; // Сколько страниц истории парсить (5 страниц ≈ 100 постов)

if (!fs.existsSync(IMG_DIR)) {
    fs.mkdirSync(IMG_DIR);
}

// Функция скачивания (без изменений)
function downloadImage(requestUrl, filepath) {
    return new Promise((resolve) => {
        https.get(requestUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        }, (res) => {
            if (res.statusCode === 200) {
                const file = fs.createWriteStream(filepath);
                res.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });

                file.on('error', () => {
                    fs.unlink(filepath, () => {});
                    resolve(false);
                });
            } else if ([301, 302, 307, 308].includes(res.statusCode)) {
                const redirectUrl = new URL(res.headers.location, requestUrl).href;
                downloadImage(redirectUrl, filepath).then(resolve);
            } else {
                console.warn(`\n⚠️ Ошибка CDN (статус ${res.statusCode}): ${requestUrl}`);
                resolve(false);
            }
        }).on('error', (err) => {
            console.error(`\n❌ Ошибка сети: ${err.message}`);
            resolve(false);
        });
    });
}

// Теперь функция принимает параметр before для загрузки прошлых постов
async function fetchTelegram(before = null) {
    const url = `https://t.me/s/${CHANNEL_NAME}${before ? '?before=' + before : ''}`;
    console.log(`Запрашиваю данные: ${url}`);

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

// Парсинг отдельной страницы
async function parsePage(html) {
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
            const fileName = `case_${new Date(date).getTime()}.jpg`;
            const filePath = path.join(IMG_DIR, fileName);

            // Если файл уже скачан в прошлые разы, просто берем путь
            if (fs.existsSync(filePath)) {
                localImgPath = `./cases-img/${fileName}`;
            } else {
                console.log(`Скачиваю новую картинку: ${fileName}...`);
                const isSuccess = await downloadImage(rawUrl, filePath);
                if (isSuccess) {
                    localImgPath = `./cases-img/${fileName}`;
                }
            }
        }

        if (text || localImgPath) {
            posts.push({ text, link, img: localImgPath, date });
        }
    }

    // Ищем параметр before для следующей страницы
    const moreMatch = html.match(/data-before="(\d+)"/);
    const nextBefore = moreMatch ? moreMatch[1] : null;

    return { posts, nextBefore };
}

async function run() {
    try {
        let allPosts = [];
        let before = null;

        // Листаем страницы канала
        for (let page = 1; page <= MAX_PAGES; page++) {
            console.log(`\n📄 Обработка страницы ${page}...`);
            const html = await fetchTelegram(before);

            const { posts, nextBefore } = await parsePage(html);
            allPosts.push(...posts);

            if (!nextBefore) {
                console.log("Достигнут конец доступной истории канала.");
                break;
            }
            before = nextBefore;

            // Задержка в 1 секунду, чтобы телеграм не выдал бан за частые запросы
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Чистим дубликаты (на случай пересечения страниц) и сортируем от новых к старым
        const uniquePosts = Array.from(new Map(allPosts.map(item => [item.link, item])).values());
        uniquePosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Оставляем последние 100 постов (можешь изменить число)
        const finalPosts = uniquePosts.slice(0, 100);

        fs.writeFileSync('posts.json', JSON.stringify(finalPosts, null, 2));
        console.log(`\n✅ Успешно обновлено! В портфолио теперь: ${finalPosts.length} кейсов.`);
    } catch (err) {
        console.error("Ошибка выполнения:", err);
        process.exit(1);
    }
}

run();