document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    fetchTelegramPosts();
});

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

let allPosts = [];
let displayedCount = 0;
const POSTS_PER_PAGE = 6;

async function fetchTelegramPosts() {
    try {
        const response = await fetch(`./posts.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Ошибка загрузки JSON');

        allPosts = await response.json();
        document.getElementById('tg-feed').innerHTML = '';
        renderNextBatch();
    } catch (error) {
        console.error("Не удалось загрузить посты:", error);
    }
}

function renderNextBatch() {
    const feedContainer = document.getElementById('tg-feed');
    const loadMoreBtn = document.getElementById('load-more-container');
    const nextBatch = allPosts.slice(displayedCount, displayedCount + POSTS_PER_PAGE);

    nextBatch.forEach((post, index) => {
        const card = document.createElement('a');
        card.href = post.link || "#";
        card.target = "_blank";
        card.className = 'solid-card case-card reveal';

        const hasImage = !!post.img;

        // Рендерим контейнер картинки ТОЛЬКО если картинка действительно есть
        card.innerHTML = `
            ${hasImage ? `
            <div class="case-img-container">
                <div class="skeleton-loader"></div>
                <img class="case-img" alt="Case Image">
            </div>` : ''}
            <div class="card-content">
                <div class="case-text">${post.text || 'Без описания'}</div>
                <div class="case-date">${new Date(post.date).toLocaleDateString('ru-RU', {day:'numeric', month:'short'})}</div>
            </div>
        `;

        feedContainer.appendChild(card);

        // Логика загрузки, если картинка присутствует
        if (hasImage) {
            const imgElement = card.querySelector('.case-img');
            const skeleton = card.querySelector('.skeleton-loader');
            const imgContainer = card.querySelector('.case-img-container');

            const tempImg = new Image();
            tempImg.src = post.img;

            // Плавное появление
            tempImg.onload = () => {
                imgElement.src = tempImg.src;
                imgElement.classList.add('loaded');
                setTimeout(() => { if(skeleton) skeleton.remove(); }, 600);
            };

            // Если картинка физически битая/недоступна — удаляем блок картинки целиком
            tempImg.onerror = () => {
                if(imgContainer) imgContainer.remove();
            };
        }

        setTimeout(() => card.classList.add('active'), 100 * index);
    });

    displayedCount += nextBatch.length;
    loadMoreBtn.style.display = displayedCount >= allPosts.length ? 'none' : 'flex';
}

document.getElementById('load-more-btn').addEventListener('click', renderNextBatch);