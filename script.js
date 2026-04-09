document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initTypewriter();
    fetchTelegramPosts();
    initModal();
    applyLanguage();

    // Плавный скролл для якорных ссылок внутри app-wrapper
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const wrapper = document.getElementById('app-wrapper');
                if (wrapper) {
                    wrapper.scrollTo({
                        top: targetElement.offsetTop - 80, // Отступ под шапку
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});

/* =========================================
   ЛОКАЛИЗАЦИЯ (Мультиязычность)
========================================= */
let currentLang = localStorage.getItem('keks_lang') || 'ru';

const dict = {
    ru: {
        nav_about: "Обо мне", nav_cases: "Кейсы", nav_contact: "Связаться",
        hero_status: "Открыт к проектам", hero_title: "Создаю",
        hero_desc: "Разрабатываю премиальные интерфейсы и сложные Web3-продукты. Строгая эстетика, чистый код и фокус на конверсию.",
        hero_btn_discuss: "Обсудить проект ↗", hero_btn_cases: "Смотреть работы ↓",
        bento_01_badge: "✦ Опыт & Подход", bento_01_title: "Архитектура<br><span class=\"text-muted\">смыслов.</span>",
        bento_01_text: "Я не просто рисую картинки. Более 4 лет я создаю дизайн, который легко верстать и масштабировать. Глубокое понимание Frontend позволяет мне проектировать интерфейсы, которые в коде работают так же безупречно, как выглядят в Figma.",
        bento_02_title: "Тех-Стек", bento_03_title: "Направления & Стоимость",
        srv_1: "WEB Дизайн", srv_2: "Форумная Графика", srv_3: "Логотипы", srv_4: "Баннеры / Превью", srv_5: "Инфографика", srv_6: "Типографика", srv_7: "Аватарки", srv_8: "Отзывы",
        srv_footer: "// Итоговый бюджет рассчитывается индивидуально, исходя из сложности архитектуры и продуктовой логики.",
        cases_title: "Последние кейсы", cases_tg_link: "Telegram-канал ↗", cases_loading: "Идёт загрузка кейсов из Telegram...", cases_load_more: "Загрузить ещё",
        footer_title: "Давайте<br><span class=\"text-muted\">создавать.</span>", footer_desc: "Проектирование премиальных интерфейсов, Web3-систем и сложной продуктовой логики.", footer_btn: "Обсудить проект",
        footer_nav_title_1: "Навигация", footer_nav_title_2: "Контакты", footer_dm: "Личные сообщения ↗",
        modal_dm_btn: "Написать мне",
        err_title: "Архитектура<br><span class=\"text-muted\">дала сбой.</span>",
        err_desc: "Вы попали в тупик. Страница удалена, перенесена в другой блок, либо её здесь никогда не было. В любом случае, тут только чистый код и пустота.",
        err_btn: "Вернуться на базу ↗"
    },
    en: {
        nav_about: "About", nav_cases: "Cases", nav_contact: "Contact",
        hero_status: "Available for work", hero_title: "I create",
        hero_desc: "Designing premium interfaces and complex Web3 products. Strict aesthetics, clean code, and focus on conversion.",
        hero_btn_discuss: "Discuss project ↗", hero_btn_cases: "View works ↓",
        bento_01_badge: "✦ Experience & Approach", bento_01_title: "Architecture<br><span class=\"text-muted\">of meaning.</span>",
        bento_01_text: "I don't just draw pictures. For over 4 years I've been creating designs that are easy to code and scale. Deep understanding of Frontend allows me to design interfaces that work in code as flawlessly as they look in Figma.",
        bento_02_title: "Tech Stack", bento_03_title: "Services & Pricing",
        srv_1: "WEB Design", srv_2: "Forum Graphics", srv_3: "Logos", srv_4: "Banners / Previews", srv_5: "Infographics", srv_6: "Typography", srv_7: "Avatars", srv_8: "Reviews",
        srv_footer: "// The final budget is calculated individually, based on the complexity of architecture and product logic.",
        cases_title: "Recent cases", cases_tg_link: "Telegram Channel ↗", cases_loading: "Loading cases from Telegram...", cases_load_more: "Load more",
        footer_title: "Let's<br><span class=\"text-muted\">create.</span>", footer_desc: "Designing premium interfaces, Web3 systems, and complex product logic.", footer_btn: "Discuss project",
        footer_nav_title_1: "Navigation", footer_nav_title_2: "Contacts", footer_dm: "Direct Messages ↗",
        modal_dm_btn: "Message me",
        err_title: "Architecture<br><span class=\"text-muted\">failed.</span>",
        err_desc: "You've hit a dead end. The page was deleted, moved to another block, or it never existed here. Either way, there's only clean code and emptiness left.",
        err_btn: "Return to base ↗"
    }
};

const typewriterWords = {
    ru: ["премиальный UI.", "Web3-системы.", "чистый фронтенд.", "сложные дашборды."],
    en: ["premium UI.", "Web3 systems.", "clean frontend.", "complex dashboards."]
};

function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[currentLang][key]) {
            el.innerHTML = dict[currentLang][key];
        }
    });

    document.querySelectorAll('.lang-toggle').forEach(toggle => {
        if (currentLang === 'en') {
            toggle.classList.add('en-active');
        } else {
            toggle.classList.remove('en-active');
        }
    });
}

window.toggleLanguage = function() {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('keks_lang', currentLang);
    applyLanguage();
    initTypewriter();
};

/* =========================================
   ГЛОБАЛЬНЫЙ ЗАПРЕТ ЗУМА СТРАНИЦЫ
========================================= */
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        const inModalTrack = e.target.closest('#modal-slider-track');
        const inLightboxTrack = e.target.closest('#lightbox-track');
        if (!inModalTrack && !inLightboxTrack) e.preventDefault();
    }
}, { passive: false });

/* =========================================
   Анимация скролла
========================================= */
function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal');
    const navbarPill = document.getElementById('navbar');
    const appWrapper = document.getElementById('app-wrapper');

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    reveals.forEach(el => observer.observe(el));

    setTimeout(() => { document.querySelectorAll('#hero .reveal, header.reveal').forEach(el => el.classList.add('active')); }, 50);

    let ticking = false;
    (appWrapper || window).addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollTop = appWrapper ? appWrapper.scrollTop : window.scrollY;
                if (scrollTop > 50) navbarPill.classList.add('scrolled');
                else navbarPill.classList.remove('scrolled');
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

/* =========================================
   Эффект Печатной Машинки
========================================= */
let twTimeout;
function initTypewriter() {
    const typeWriterElement = document.getElementById('typewriter');
    if (!typeWriterElement) return;

    clearTimeout(twTimeout);
    let i = 0;
    let isDeleting = false;
    let text = '';

    function type() {
        const words = typewriterWords[currentLang];
        if(i >= words.length) i = 0;
        const currentWord = words[i];

        if (isDeleting) text = currentWord.substring(0, text.length - 1);
        else text = currentWord.substring(0, text.length + 1);

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
        twTimeout = setTimeout(type, typeSpeed);
    }
    type();
}

/* =========================================
   Загрузка Постов
========================================= */
let allPosts = [];
let displayedCount = 0;
const POSTS_PER_PAGE = 6;

function isVideoFile(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm');
}

async function fetchTelegramPosts() {
    const feedContainer = document.getElementById('tg-feed');
    if (!feedContainer) return;

    const statusContainer = document.getElementById('tg-status-container');
    const statusText = document.getElementById('tg-status-text');
    const spinner = document.querySelector('.loader-spinner');

    try {
        const response = await fetch(`/posts.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Ошибка загрузки JSON');

        allPosts = await response.json();

        if (allPosts && allPosts.length > 0) {
            statusContainer.style.display = 'none';
            feedContainer.style.display = 'grid';
            feedContainer.innerHTML = '';
            renderNextBatch();
        } else {
            throw new Error('Кейсов пока нет');
        }
    } catch (error) {
        console.error("Не удалось загрузить посты:", error);
        if (spinner) spinner.style.display = 'none';
        statusText.innerHTML = 'Кейсы временно недоступны.<br>Посмотрите их в <a href="https://t.me/casebykeks" target="_blank" style="color: var(--text-main);">Telegram ↗</a>.';
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
        const formattedDate = new Date(post.date).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', dateOptions);

        const tagsHTML = post.tags && post.tags.length > 0 ? `<div class="case-tags">${post.tags.map(t => `<span class="case-tag">${t}</span>`).join('')}</div>` : '';

        const isVid = isVideoFile(post.img);
        const mediaHTML = post.img ? `
            <div class="case-img-container">
                <div class="skeleton-loader"></div>
                ${isVid
                    ? `<video class="case-img" src="${post.img}" autoplay loop muted playsinline></video>`
                    : `<img class="case-img" alt="Case Image">`
                }
            </div>` : '';

        card.innerHTML = `
            ${mediaHTML}
            <div class="card-content">
                <div class="case-text"></div>
                ${tagsHTML}
                <div class="case-date">${formattedDate}</div>
            </div>
        `;

        card.querySelector('.case-text').innerText = post.text || '';

        card.addEventListener('click', (e) => { e.preventDefault(); openModal(post); });
        feedContainer.appendChild(card);

        if (post.img) {
            const mediaElement = card.querySelector('.case-img');
            const skeleton = card.querySelector('.skeleton-loader');

            if (isVid) {
                mediaElement.onloadeddata = () => {
                    mediaElement.classList.add('loaded');
                    setTimeout(() => { if(skeleton) skeleton.remove(); }, 300);
                };
            } else {
                const tempImg = new Image();
                tempImg.src = post.img;
                tempImg.onload = () => {
                    mediaElement.src = tempImg.src;
                    mediaElement.classList.add('loaded');
                    setTimeout(() => { if(skeleton) skeleton.remove(); }, 600);
                };
                tempImg.onerror = () => {
                    card.querySelector('.case-img-container').remove();
                    card.classList.add('no-image');
                };
            }
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
   Логика Модального Окна
========================================= */
let currentSlide = 0;
let slideImages = [];

function initModal() {
    const modal = document.getElementById('case-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('modal-close');
    const lightbox = document.getElementById('lightbox-overlay');
    const lightboxCloseBtn = document.getElementById('lightbox-close');

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    lightboxCloseBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-track')) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (lightbox.classList.contains('active')) closeLightbox();
            else if (modal.classList.contains('active')) closeModal();
        }
    });

    document.getElementById('slider-prev').addEventListener('click', () => changeSlide(-1));
    document.getElementById('slider-next').addEventListener('click', () => changeSlide(1));
}

function openModal(post) {
    document.body.classList.add('hide-dock');

    const modal = document.getElementById('case-modal');
    const track = document.getElementById('modal-slider-track');
    const dotsContainer = document.getElementById('slider-dots');

    document.getElementById('modal-text').innerText = post.text || '';

    const modalTags = document.getElementById('modal-tags');
    if (post.tags && post.tags.length > 0) {
        modalTags.innerHTML = post.tags.map(t => `<span class="case-tag">${t}</span>`).join('');
        modalTags.style.display = 'flex';
    } else modalTags.style.display = 'none';

    document.getElementById('modal-date').innerText = new Date(post.date).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    track.innerHTML = '';
    dotsContainer.innerHTML = '';
    currentSlide = 0;
    track.style.transform = `translateX(0%)`;

    slideImages = post.images && post.images.length > 0 ? post.images : (post.img ? [post.img] : []);

    if (slideImages.length === 0) {
        document.querySelector('.premium-split-modal').classList.add('no-media');
        document.getElementById('modal-slider-container').style.display = 'none';
    } else {
        document.querySelector('.premium-split-modal').classList.remove('no-media');

        slideImages.forEach((src, index) => {
            let el;
            if (isVideoFile(src)) {
                el = document.createElement('video');
                el.src = src;
                el.autoplay = true; el.loop = true; el.muted = true; el.playsInline = true;
            } else {
                el = document.createElement('img');
                el.src = src;
                el.setAttribute('draggable', 'false');
                el.ondragstart = () => false;
            }

            track.appendChild(el);

            if (slideImages.length > 1) {
                const dot = document.createElement('div');
                dot.className = `dot ${index === 0 ? 'active' : ''}`;
                dot.addEventListener('click', () => goToSlide(index));
                dotsContainer.appendChild(dot);
            }
        });

        document.getElementById('slider-prev').classList.toggle('hidden', slideImages.length <= 1);
        document.getElementById('slider-next').classList.toggle('hidden', slideImages.length <= 1);

        document.getElementById('modal-slider-container').style.display = 'flex';
        document.getElementById('canvas-controls').style.display = 'flex';
        resetCanvas();
    }

    const scrollArea = document.querySelector('.modal-scrollable');
    if (scrollArea) scrollArea.scrollTop = 0;

    modal.classList.add('active');
    document.getElementById('app-wrapper').classList.add('no-scroll');
}

function closeModal() {
    document.getElementById('case-modal').classList.remove('active');
    document.getElementById('app-wrapper').classList.remove('no-scroll');

    if (!document.getElementById('lightbox-overlay').classList.contains('active')) {
        document.body.classList.remove('hide-dock');
    }

    const track = document.getElementById('modal-slider-track');
    if(track) track.innerHTML = '';
}

function openLightbox(src) {
    document.body.classList.add('hide-dock');

    const track = document.getElementById('lightbox-track');
    track.innerHTML = '';

    if(isVideoFile(src)) {
        const vid = document.createElement('video');
        vid.src = src;
        vid.autoplay = true; vid.loop = true; vid.muted = true; vid.playsInline = true;
        vid.className = 'lightbox-img';
        vid.id = 'lightbox-media-el';
        track.appendChild(vid);
    } else {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'lightbox-img';
        img.id = 'lightbox-media-el';
        img.setAttribute('draggable', 'false');
        track.appendChild(img);
    }

    resetLbCanvas();
    document.getElementById('lightbox-overlay').classList.add('active');
}

function closeLightbox() {
    document.getElementById('lightbox-overlay').classList.remove('active');
    document.getElementById('lightbox-track').innerHTML = '';

    if (!document.getElementById('case-modal') || !document.getElementById('case-modal').classList.contains('active')) {
        document.body.classList.remove('hide-dock');
    }
}

function changeSlide(direction) {
    let newIndex = currentSlide + direction;
    if (newIndex < 0) newIndex = slideImages.length - 1;
    if (newIndex >= slideImages.length) newIndex = 0;
    goToSlide(newIndex);
}

function goToSlide(index) {
    resetCanvas();
    currentSlide = index;
    const track = document.getElementById('modal-slider-track');
    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    document.querySelectorAll('.slider-dots .dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

/* =========================================
   КАНВАС: Зум и Панорамирование
========================================= */
let currentScale = 1; let currentPanX = 0; let currentPanY = 0;
let isDragging = false; let dragStartX = 0; let dragStartY = 0;
let initialPinchDistance = null; let initialPinchScale = 1;

function resetCanvas() {
    currentScale = 1; currentPanX = 0; currentPanY = 0; initialPinchDistance = null;
    const zoomSlider = document.getElementById('zoom-slider');
    if (zoomSlider) zoomSlider.value = 1;
    applyTransformToActiveImage(true);
}

function applyTransformToActiveImage(smooth = false) {
    const track = document.getElementById('modal-slider-track');
    if (!track) return;
    const items = track.children;
    const activeItem = items[currentSlide];

    if (activeItem) {
        activeItem.style.transition = smooth ? 'transform 0.2s ease-out' : 'none';
        activeItem.style.transform = `translate(${currentPanX}px, ${currentPanY}px) scale(${currentScale})`;
    }

    Array.from(items).forEach((el, idx) => {
        if (idx !== currentSlide) el.style.transform = 'translate(0px, 0px) scale(1)';
    });
}

function updateZoom(newScale) {
    currentScale = Math.max(0.5, Math.min(newScale, 4));
    const zoomSlider = document.getElementById('zoom-slider');
    if (zoomSlider) zoomSlider.value = currentScale;
    applyTransformToActiveImage(false);
}

/* ЛАЙТБОКС */
let lbScale = 1; let lbPanX = 0; let lbPanY = 0;
let lbIsDragging = false; let lbDragStartX = 0; let lbDragStartY = 0;
let lbInitialPinchDistance = null; let lbInitialPinchScale = 1;

function resetLbCanvas() {
    lbScale = 1; lbPanX = 0; lbPanY = 0; lbInitialPinchDistance = null;
    const slider = document.getElementById('lb-zoom-slider');
    if (slider) slider.value = 1;
    applyLbTransform(true);
}

function applyLbTransform(smooth = false) {
    const el = document.getElementById('lightbox-media-el');
    if (!el) return;
    el.style.transition = smooth ? 'transform 0.2s ease-out' : 'none';
    el.style.transform = `translate(${lbPanX}px, ${lbPanY}px) scale(${lbScale})`;
}

function updateLbZoom(newScale) {
    lbScale = Math.max(0.5, Math.min(newScale, 5));
    const slider = document.getElementById('lb-zoom-slider');
    if (slider) slider.value = lbScale;
    applyLbTransform(false);
}

function getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/* ИНИЦИАЛИЗАЦИЯ ИВЕНТОВ КАНВАСА */
document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('modal-slider-track');
    const zoomSlider = document.getElementById('zoom-slider');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const resetBtn = document.getElementById('reset-btn');

    if (track) {
        if (zoomSlider) zoomSlider.addEventListener('input', (e) => { currentScale = parseFloat(e.target.value); applyTransformToActiveImage(true); });
        if (resetBtn) resetBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); resetCanvas(); });

        track.addEventListener('wheel', (e) => {
            e.preventDefault();
            updateZoom(currentScale + (e.deltaY < 0 ? 0.1 : -0.1));
        });

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                const activeSrc = slideImages[currentSlide];
                if (activeSrc) openLightbox(activeSrc);
            });
        }

        track.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                e.preventDefault();
                isDragging = true; dragStartX = e.clientX - currentPanX; dragStartY = e.clientY - currentPanY;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            currentPanX = e.clientX - dragStartX; currentPanY = e.clientY - dragStartY;
            applyTransformToActiveImage(false);
        });

        window.addEventListener('mouseup', () => isDragging = false);

        track.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                if (e.touches.length === 1) {
                    isDragging = true; dragStartX = e.touches[0].clientX - currentPanX; dragStartY = e.touches[0].clientY - currentPanY;
                } else if (e.touches.length === 2) {
                    isDragging = false; initialPinchDistance = getPinchDistance(e.touches); initialPinchScale = currentScale;
                }
            }
        }, { passive: false });

        track.addEventListener('touchmove', (e) => {
            if (e.target.tagName !== 'IMG' && e.target.tagName !== 'VIDEO') return;
            if (isDragging && e.touches.length === 1) {
                e.preventDefault(); currentPanX = e.touches[0].clientX - dragStartX; currentPanY = e.touches[0].clientY - dragStartY;
                applyTransformToActiveImage(false);
            } else if (e.touches.length === 2) {
                e.preventDefault();
                if (initialPinchDistance) updateZoom(initialPinchScale * (getPinchDistance(e.touches) / initialPinchDistance));
            }
        }, { passive: false });

        track.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) initialPinchDistance = null;
            if (e.touches.length === 0) isDragging = false;
            else if (e.touches.length === 1) { isDragging = true; dragStartX = e.touches[0].clientX - currentPanX; dragStartY = e.touches[0].clientY - currentPanY; }
        });
    }

    // ЛАЙТБОКС
    const lbTrack = document.getElementById('lightbox-track');
    const lbZoomSlider = document.getElementById('lb-zoom-slider');
    const lbResetBtn = document.getElementById('lb-reset-btn');

    if (lbTrack) {
        if (lbZoomSlider) lbZoomSlider.addEventListener('input', (e) => { lbScale = parseFloat(e.target.value); applyLbTransform(true); });
        if (lbResetBtn) lbResetBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); resetLbCanvas(); });

        lbTrack.addEventListener('wheel', (e) => {
            e.preventDefault();
            updateLbZoom(lbScale + (e.deltaY < 0 ? 0.1 : -0.1));
        });

        lbTrack.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                e.preventDefault(); lbIsDragging = true; lbDragStartX = e.clientX - lbPanX; lbDragStartY = e.clientY - lbPanY;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!lbIsDragging) return;
            lbPanX = e.clientX - lbDragStartX; lbPanY = e.clientY - lbDragStartY;
            applyLbTransform(false);
        });

        window.addEventListener('mouseup', () => lbIsDragging = false);

        lbTrack.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                if (e.touches.length === 1) { lbIsDragging = true; lbDragStartX = e.touches[0].clientX - lbPanX; lbDragStartY = e.touches[0].clientY - lbPanY; }
                else if (e.touches.length === 2) { lbIsDragging = false; lbInitialPinchDistance = getPinchDistance(e.touches); lbInitialPinchScale = lbScale; }
            }
        }, { passive: false });

        lbTrack.addEventListener('touchmove', (e) => {
            if (e.target.tagName !== 'IMG' && e.target.tagName !== 'VIDEO') return;
            if (lbIsDragging && e.touches.length === 1) {
                e.preventDefault(); lbPanX = e.touches[0].clientX - lbDragStartX; lbPanY = e.touches[0].clientY - lbDragStartY;
                applyLbTransform(false);
            } else if (e.touches.length === 2) {
                e.preventDefault();
                if (lbInitialPinchDistance) updateLbZoom(lbInitialPinchScale * (getPinchDistance(e.touches) / lbInitialPinchDistance));
            }
        }, { passive: false });

        lbTrack.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) lbInitialPinchDistance = null;
            if (e.touches.length === 0) lbIsDragging = false;
            else if (e.touches.length === 1) { lbIsDragging = true; lbDragStartX = e.touches[0].clientX - lbPanX; lbDragStartY = e.touches[0].clientY - lbPanY; }
        });
    }
});