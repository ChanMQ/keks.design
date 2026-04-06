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
    // Слушаем движение мыши по всему контейнеру с карточками
    const handleMouseMove = (e) => {
        const cards = document.querySelectorAll('.glass-card');

        for (const card of cards) {
            const rect = card.getBoundingClientRect();
            // Вычисляем координаты мыши относительно карточки
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Передаем в CSS переменные
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        }
    };

    document.getElementById('cards-container').addEventListener('mousemove', handleMouseMove);
    // Также добавляем слушатель на контейнер портфолио
    document.getElementById('portfolio').addEventListener('mousemove', handleMouseMove);
}

/* =========================================
   3. Загрузка данных из posts.json (Jamstack)
========================================= */
async function fetchTelegramPosts() {
    const feedContainer = document.getElementById('tg-feed');

    try {
        const response = await fetch('./posts.json');
        if (!response.ok) throw new Error('Файл постов не найден');

        const posts = await response.json();
        feedContainer.innerHTML = '';

        if (posts.length === 0) throw new Error('Постов нет');

        posts.forEach((post, index) => {
            const postDate = new Date(post.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

            const card = document.createElement('a');
            card.href = post.link;
            card.target = "_blank";
            card.className = 'glass-card case-card reveal'; // Используем классы стекла и спотлайта
            card.style.transitionDelay = `${index * 0.1}s`;

            card.innerHTML = `
                ${post.img
                    ? `<img src="${post.img}" class="case-img" alt="Keks Design">`
                    : `<div class="case-img" style="display:flex;align-items:center;justify-content:center;background:var(--glass-bg)">UI/UX Кейс</div>`
                }
                <div class="card-content">
                    <div class="case-text">${post.text}</div>
                    <div class="case-date">${postDate}</div>
                </div>
            `;
            feedContainer.appendChild(card);
            setTimeout(() => card.classList.add('active'), 50);
        });

    } catch (error) {
        console.warn('Портфолио:', error.message);
        feedContainer.innerHTML = `
            <div class="glass-card" style="grid-column: 1/-1; text-align:center; padding: 3rem;">
                <div class="card-content">
                    <p class="bento-text" style="margin-bottom: 1rem;">Свежие работы и кейсы доступны в Telegram</p>
                    <a href="https://t.me/casebykeks" target="_blank" class="btn-primary">Смотреть @casebykeks</a>
                </div>
            </div>
        `;
    }
}