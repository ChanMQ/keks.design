document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initTypewriter();
    fetchTelegramPosts();
    initModal();
});

/* =========================================
   Анимация скролла и шапки
========================================= */
function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal');
    const navbarPill = document.getElementById('navbar');

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    reveals.forEach(el => observer.observe(el));

    setTimeout(() => {
        document.querySelectorAll('#hero .reveal, header.reveal').forEach(el => el.classList.add('active'));
    }, 50);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbarPill.classList.add('scrolled');
        else navbarPill.classList.remove('scrolled');
    });
}

/* =========================================
   Эффект Печатной Машинки
========================================= */
function initTypewriter() {
    const words = ["премиальный UI.", "Web3-системы.", "чистый фронтенд.", "сложные дашборды."];
    let i = 0;
    let isDeleting = false;
    let text = '';
    const typeWriterElement = document.getElementById('typewriter');

    function type() {
        const currentWord = words[i];

        if (isDeleting) {
            text = currentWord.substring(0, text.length - 1);
        } else {
            text = currentWord.substring(0, text.length + 1);
        }

        typeWriterElement.innerText = text;

        let typeSpeed = isDeleting ? 40 : 100;

        if (!isDeleting && text === currentWord) {
            typeSpeed = 2500;
            isDeleting = true;
        } else if (isDeleting && text === '') {
            isDeleting = false;
            i = (i + 1) % words.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    type();
}

/* =========================================
   Загрузка Постов
========================================= */
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
        card.href = "#";
        card.className = `solid-card case-card reveal ${post.img ? '' : 'no-image'}`;

        const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        const formattedDate = new Date(post.date).toLocaleDateString('ru-RU', dateOptions);

        const tagsHTML = post.tags && post.tags.length > 0
            ? `<div class="case-tags">${post.tags.map(t => `<span class="case-tag">${t}</span>`).join('')}</div>`
            : '';

        card.innerHTML = `
            ${post.img ? `
            <div class="case-img-container">
                <div class="skeleton-loader"></div>
                <img class="case-img" alt="Case Image">
            </div>` : ''}
            <div class="card-content">
                <div class="case-text"></div>
                ${tagsHTML}
                <div class="case-date">${formattedDate}</div>
            </div>
        `;

        card.querySelector('.case-text').innerText = post.text || 'Без описания';

        card.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(post);
        });

        feedContainer.appendChild(card);

        if (post.img) {
            const imgElement = card.querySelector('.case-img');
            const skeleton = card.querySelector('.skeleton-loader');
            const imgContainer = card.querySelector('.case-img-container');

            const tempImg = new Image();
            tempImg.src = post.img;

            tempImg.onload = () => {
                imgElement.src = tempImg.src;
                imgElement.classList.add('loaded');
                setTimeout(() => { if(skeleton) skeleton.remove(); }, 600);
            };

            tempImg.onerror = () => {
                if(imgContainer) imgContainer.remove();
                card.classList.add('no-image');
            };
        }

        setTimeout(() => card.classList.add('active'), 100 * index);
    });

    displayedCount += nextBatch.length;
    loadMoreBtn.style.display = displayedCount >= allPosts.length ? 'none' : 'flex';
}

if(document.getElementById('load-more-btn')) {
    document.getElementById('load-more-btn').addEventListener('click', renderNextBatch);
}

/* =========================================
   Логика Модального Окна и Слайдера
========================================= */
let currentSlide = 0;
let slideImages = [];

function initModal() {
    const modal = document.getElementById('case-modal');
    const closeBtn = document.getElementById('modal-close');

    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    document.getElementById('slider-prev').addEventListener('click', () => changeSlide(-1));
    document.getElementById('slider-next').addEventListener('click', () => changeSlide(1));
}

function openModal(post) {
    const modal = document.getElementById('case-modal');
    const modalContent = document.querySelector('.premium-split-modal');
    const sliderContainer = document.getElementById('modal-slider-container');
    const modalBodyContainer = document.getElementById('modal-body-container');
    const track = document.getElementById('modal-slider-track');
    const dotsContainer = document.getElementById('slider-dots');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');

    document.getElementById('modal-text').innerText = post.text || 'Без описания';

    const modalTags = document.getElementById('modal-tags');
    if (post.tags && post.tags.length > 0) {
        modalTags.innerHTML = post.tags.map(t => `<span class="case-tag">${t}</span>`).join('');
        modalTags.style.display = 'flex';
    } else {
        modalTags.style.display = 'none';
    }

    const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    document.getElementById('modal-date').innerText = new Date(post.date).toLocaleDateString('ru-RU', dateOptions);

    document.getElementById('modal-link-tg').href = post.link;

    track.innerHTML = '';
    dotsContainer.innerHTML = '';
    currentSlide = 0;
    track.style.transform = `translateX(0%)`;

    slideImages = post.images && post.images.length > 0 ? post.images : (post.img ? [post.img] : []);

    // Проверяем наличие картинок для изменения ширины и отображения сетки
    if (slideImages.length === 0) {
        modalContent.classList.add('no-media'); // Прячет сетку и растягивает текст
        sliderContainer.style.display = 'none';
        modalBodyContainer.classList.add('no-image');
    } else {
        modalContent.classList.remove('no-media'); // Возвращает сетку и 55/45
        sliderContainer.style.display = 'flex';
        modalBodyContainer.classList.remove('no-image');

        slideImages.forEach((imgSrc, index) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            track.appendChild(img);

            if (slideImages.length > 1) {
                const dot = document.createElement('div');
                dot.className = `dot ${index === 0 ? 'active' : ''}`;
                dot.addEventListener('click', () => goToSlide(index));
                dotsContainer.appendChild(dot);
            }
        });

        if (slideImages.length > 1) {
            prevBtn.classList.remove('hidden');
            nextBtn.classList.remove('hidden');
        } else {
            prevBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
        }
    }

    // ВАЖНО: СБРАСЫВАЕМ СКРОЛЛ НА САМЫЙ ВЕРХ!
    const scrollableArea = document.querySelector('.modal-scrollable');
    if (scrollableArea) {
        scrollableArea.scrollTop = 0;
    }

    modal.classList.add('active');
    document.body.classList.add('no-scroll');
}

function closeModal() {
    const modal = document.getElementById('case-modal');
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

function changeSlide(direction) {
    let newIndex = currentSlide + direction;
    if (newIndex < 0) newIndex = slideImages.length - 1;
    if (newIndex >= slideImages.length) newIndex = 0;
    goToSlide(newIndex);
}

function goToSlide(index) {
    currentSlide = index;
    const track = document.getElementById('modal-slider-track');
    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    const dots = document.querySelectorAll('.slider-dots .dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}