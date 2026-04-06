const fs = require('fs');
const https = require('https');
const path = require('path');
const { URL } = require('url');

const CHANNEL_NAME = 'casebykeks';
const IMG_DIR = path.join(__dirname, 'cases-img');
const MAX_PAGES = 5;

if (!fs.existsSync(IMG_DIR)) {
    fs.mkdirSync(IMG_DIR);
}

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

async function parsePage(html) {
    const posts = [];
    const items = html.split('js-widget_message_wrap');

    for (let i = 1; i < items.length; i++) {
        const item = items[i];

        if (item.includes('tgme_widget_message_service')) {
            continue;
        }

        // --- НОВЫЙ БЛОК ПАРСИНГА ТЕКСТА С СОХРАНЕНИЕМ АБЗАЦЕВ ---
        const textMatch = item.match(/js-message_text[^>]*>([\s\S]*?)<\/div>/);
        let text = "";

        if (textMatch) {
            let rawText = textMatch[1];
            // 1. Превращаем <br> в нормальные переносы строк \n
            rawText = rawText.replace(/<br\s*\/?>/gi, '\n');
            // 2. Вычищаем остальные теги
            text = rawText.replace(/<[^>]*>/g, '');
            // 3. Возвращаем нормальные символы
            text = text.replace(/&amp;/g, '&')
                       .replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>')
                       .replace(/&quot;/g, '"')
                       .replace(/&#39;/g, "'")
                       .trim();
        }

        if (
            text === 'Channel created' ||
            text === 'Channel photo updated' ||
            text.includes('pinned «') ||
            text.includes('pinned a message') ||
            text.includes('закрепил')
        ) {
            continue;
        }

        const linkMatch = item.match(/href="([^"]*?t\.me\/[^"]*?\/\d+)"/);
        const link = linkMatch ? linkMatch[1] : `https://t.me/${CHANNEL_NAME}`;

        const dateMatch = item.match(/datetime="([^"]*?)"/);
        const date = dateMatch ? dateMatch[1] : new Date().toISOString();

        const cleanItem = item.replace(/<a[^>]+tgme_widget_message_user_pic[^>]+>.*?<\/a>/gs, '');

        const imgRegex = /background-image:url\(['"]?([^'"]*?)['"]?\)/g;
        let match;
        const rawUrls = [];

        while ((match = imgRegex.exec(cleanItem)) !== null) {
            let rawUrl = match[1];

            if (!rawUrl.includes('/emoji/') && !rawUrl.includes('base64')) {
                if (rawUrl.startsWith('//')) rawUrl = 'https:' + rawUrl;
                rawUrl = rawUrl.replace(/&amp;/g, '&');

                if (!rawUrls.includes(rawUrl)) {
                    rawUrls.push(rawUrl);
                }
            }
        }

        const localImages = [];

        for (let idx = 0; idx < rawUrls.length; idx++) {
            const rawUrl = rawUrls[idx];
            const fileName = `case_${new Date(date).getTime()}_${idx}.jpg`;
            const filePath = path.join(IMG_DIR, fileName);

            if (fs.existsSync(filePath)) {
                localImages.push(`./cases-img/${fileName}`);
            } else {
                console.log(`Скачиваю картинку ${idx + 1} из ${rawUrls.length} для поста...`);
                const isSuccess = await downloadImage(rawUrl, filePath);
                if (isSuccess) {
                    localImages.push(`./cases-img/${fileName}`);
                }
            }
        }

        if (text || localImages.length > 0) {
            posts.push({
                text,
                link,
                img: localImages.length > 0 ? localImages[0] : null,
                images: localImages,
                date
            });
        }
    }

    const moreMatch = html.match(/data-before="(\d+)"/);
    const nextBefore = moreMatch ? moreMatch[1] : null;

    return { posts, nextBefore };
}

async function run() {
    try {
        let allPosts = [];
        let before = null;

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

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const uniquePosts = Array.from(new Map(allPosts.map(item => [item.link, item])).values());
        uniquePosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        const finalPosts = uniquePosts.slice(0, 100);

        fs.writeFileSync('posts.json', JSON.stringify(finalPosts, null, 2));
        console.log(`\n✅ Успешно обновлено! В портфолио теперь: ${finalPosts.length} кейсов.`);
    } catch (err) {
        console.error("Ошибка выполнения:", err);
        process.exit(1);
    }
}

run();