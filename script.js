document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initSpotlightEffect();
    fetchTelegramPosts();
});

/* =========================================
   1. Плавное появление элементов
========================================= */
function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal');
    const navbar = document.querySelector('.navbar');

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    reveals.forEach(el => observer.observe(el));
    setTimeout(() => document.querySelectorAll('#hero .reveal, nav.reveal').forEach(el => el.classList.add('active')), 50);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
}

/* =========================================
   2. Эффект Spotlight (Слежение мыши на карточках)
========================================= */
function initSpotlightEffect() {
    const handleMouseMove = (e) => {
        const cards = document.querySelectorAll('.glass-card');

        for (const card of cards) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        }
    };

    document.getElementById('cards-container').addEventListener('mousemove', handleMouseMove);
    document.getElementById('portfolio').addEventListener('mousemove', handleMouseMove);
}

/* =========================================
   3. Загрузка данных из posts.json (Jamstack)
========================================= */
async function fetchTelegramPosts() {
    const feedContainer = document.getElementById('tg-feed');

    try {
        const response = await fetch(`./posts.json?t=${new Date().getTime()}`);

        if (!response.ok) {
            throw new Error(`Файл не найден на сервере (Статус: ${response.status})`);
        }

        const posts = await response.json();

        // ЛОГ ДЛЯ ТЕБЯ: Посмотри в консоль, что там прилетает
        console.log("Данные из файла:", posts);

        feedContainer.innerHTML = '';

        if (!Array.isArray(posts) || posts.length === 0) {
            throw new Error('Массив постов пуст. Проверь парсер sync-tg.js');
        }

        feedContainer.innerHTML = '';

        posts.forEach((post, index) => {
            // Если в объекте поста нет поля text или date, подставляем стандартные значения
            const text = post.text || "Без описания";
            const dateStr = post.date ? new Date(post.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : "Недавно";

            const card = document.createElement('a');
            card.href = post.link || "#";
            card.target = "_blank";
            card.className = 'glass-card case-card reveal';
            card.style.transitionDelay = `${index * 0.1}s`;

            card.innerHTML = `
                ${post.img
                    ? `<img src="${post.img}" class="case-img" alt="Keks Design">`
                    : `<div class="case-img" style="display:flex; align-items:center; justify-content:center; background: var(--glass-bg); color: var(--text-muted);">UI/UX Case</div>`
                }
                <div class="card-content">
                    <div class="case-text">${text}</div>
                    <div class="case-date">${dateStr}</div>
                </div>
            `;
            feedContainer.appendChild(card);

            requestAnimationFrame(() => {
                setTimeout(() => card.classList.add('active'), 50);
            });
        });

    } catch (error) {
        console.error('Ошибка отрисовки портфолио:', error.message);
        // Тут остается твой красивый fallback
    }
}

let allPosts = [];
let displayedCount = 0;
const STEP = 6; // Сколько постов грузить за раз

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initSpotlightEffect();
    fetchTelegramPosts();
});

async function fetchTelegramPosts() {
    const feedContainer = document.getElementById('tg-feed');
    try {
        const response = await fetch(`./posts.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('404');

        allPosts = await response.json();
        feedContainer.innerHTML = ''; // Убираем лоадер

        if (allPosts.length === 0) throw new Error('Empty');

        renderBatch(); // Показываем первую порцию

    } catch (e) {
        feedContainer.innerHTML = '<div class="glass-card" style="padding:2rem;text-align:center;">Работы скоро появятся</div>';
    }
}

function renderBatch() {
    const feedContainer = document.getElementById('tg-feed');
    const btnContainer = document.getElementById('load-more-container');

    const nextBatch = allPosts.slice(displayedCount, displayedCount + STEP);

    nextBatch.forEach((post, i) => {
        const postDate = new Date(post.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        const card = document.createElement('a');
        card.href = post.link;
        card.target = "_blank";
        card.className = 'glass-card case-card reveal';

        // Премиальная SVG заглушка (иконка изображения)
        const svgPlaceholder = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.15"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;

        card.innerHTML = `
            <div class="case-img-wrapper" style="position:relative; height:220px; display:flex; align-items:center; justify-content:center; background:var(--glass-bg); overflow:hidden;">
                ${post.img ? `<img src="${post.img}" class="case-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                <div class="svg-fallback" style="display:${post.img ? 'none' : 'flex'}; align-items:center; justify-content:center;">${svgPlaceholder}</div>
            </div>
            <div class="card-content">
                <div class="case-text">${post.text || 'Дизайн-кейс'}</div>
                <div class="case-date">${postDate}</div>
            </div>
        `;

        feedContainer.appendChild(card);
        setTimeout(() => card.classList.add('active'), i * 100);
    });

    displayedCount += nextBatch.length;

    // Управляем кнопкой "Загрузить ещё"
    if (displayedCount < allPosts.length) {
        btnContainer.style.display = 'flex';
    } else {
        btnContainer.style.display = 'none';
    }
}

document.getElementById('load-more-btn')?.addEventListener('click', renderBatch);
