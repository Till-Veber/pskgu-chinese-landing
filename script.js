document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // -------- Прелоадер --------
    const loader = document.getElementById('pageLoader');
    const hideLoader = () => loader && loader.classList.add('page-loader--hidden');

    window.addEventListener('load', hideLoader);
    // Страховка, если load уже сработал или завис
    setTimeout(hideLoader, 1200);

    // -------- Аккордеон --------
    const accordionItems = document.querySelectorAll('.accordion__item');

    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion__header');
        header.addEventListener('click', () => {
            const isOpen = item.classList.contains('accordion__item--open');

            // Закрываем все остальные (поведение как у СПбГУ — по одному)
            accordionItems.forEach(other => {
                other.classList.remove('accordion__item--open');
                other.querySelector('.accordion__header').setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                item.classList.add('accordion__item--open');
                header.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // -------- Фоновые скетчи: SVG со штриховой анимацией --------

// Ограничение: не более N анимированных путей на скетч — иначе страница лагает
    const MAX_ANIMATED_PATHS = 50;
    const MIN_ANIMATED_LENGTH = 40; // пути короче 40px не анимируем — их всё равно не видно

// Проверяем, есть ли смысл вообще анимировать
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cores = navigator.hardwareConcurrency || 4;
    const SKETCH_ANIMATION_ENABLED = !prefersReducedMotion && cores >= 4;

    function initAnimatedSketch(hostId, svgUrl, readyClass, preserveAspectRatio) {
        const host = document.getElementById(hostId);
        if (!host) return;

        fetch(svgUrl)
            .then(response => {
                if (!response.ok) throw new Error(`Не удалось загрузить SVG: ${svgUrl}`);
                return response.text();
            })
            .then(markup => {
                const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
                const svg = parsed.documentElement;
                if (svg.tagName.toLowerCase() !== 'svg' || parsed.querySelector('parsererror')) return;

                svg.removeAttribute('role');
                svg.removeAttribute('aria-label');
                svg.setAttribute('aria-hidden', 'true');
                svg.setAttribute('preserveAspectRatio', preserveAspectRatio);
                svg.querySelectorAll('title, desc').forEach(node => node.remove());

                const paths = [...svg.querySelectorAll('path')];

                // Считаем длины всех путей один раз
                const pathData = paths.map((path, index) => {
                    let length = 0;
                    try { length = path.getTotalLength(); } catch (_) {}
                    return { path, length, index };
                });

                // Отбираем только самые длинные пути для анимации
                const candidates = pathData
                    .filter(p => p.length >= MIN_ANIMATED_LENGTH)
                    .sort((a, b) => b.length - a.length)
                    .slice(0, MAX_ANIMATED_PATHS);

                const animatedIndexes = new Set(candidates.map(p => p.index));

                pathData.forEach(({ path, length, index }) => {
                    // Если анимация отключена или путь не попал в топ — просто статика
                    if (!SKETCH_ANIMATION_ENABLED || !animatedIndexes.has(index)) {
                        path.classList.add('sketch-mark--static');
                        return;
                    }

                    // Предвычисляем всё в JS — браузер не тратит время на calc()
                    const dashVisible = (length * 0.6).toFixed(1);
                    const dashFull = length.toFixed(1);
                    const dashStart = (length * 0.35).toFixed(1);
                    const dashEnd = (-length).toFixed(1);

                    path.style.strokeDasharray = `${dashVisible}px ${dashFull}px`;
                    path.style.setProperty('--dash-start', `${dashStart}px`);
                    path.style.setProperty('--dash-end', `${dashEnd}px`);

                    // Длительность цикла: 10–20 секунд в зависимости от длины пути
                    const duration = Math.min(20, Math.max(10, 7 + length / 80));
                    const delay = -(Math.random() * duration);
                    path.style.setProperty('--draw-duration', `${duration.toFixed(2)}s`);
                    path.style.setProperty('--draw-delay', `${delay.toFixed(2)}s`);

                    path.classList.add('sketch-mark--animated');
                });

                host.replaceChildren(document.importNode(svg, true));
                host.classList.add(readyClass);
            })
            .catch(error => console.warn('Анимация скетча отключена:', error));
    }

    initAnimatedSketch('pagodaBackground', 'assets/illustrations/pagoda.svg',
        'pagoda-bg--ready', 'xMinYMax meet');
    initAnimatedSketch('sakuraBackground', 'assets/illustrations/sakura.svg',
        'sakura-bg--ready', 'xMaxYMax meet');

    // Пауза анимации, когда вкладка неактивна
    document.addEventListener('visibilitychange', () => {
        const paused = document.hidden;
        document.querySelectorAll('.pagoda-bg, .sakura-bg').forEach(el => {
            el.classList.toggle('is-paused', paused);
        });
    });

    // -------- Галерея (Swiper) с эффектом карточек --------
    const galleryEl = document.querySelector('.gallery__swiper');
    if (galleryEl && typeof Swiper !== 'undefined') {
        const gallerySwiper = new Swiper(galleryEl, {
            effect: 'cards',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 1,
            spaceBetween: 0,
            loop: false,          // ← вот это главное
            rewind: true,         // когда дошли до конца — следующий свайп возвращает в начало
            speed: 750,           // плавнее, чем было (по умолчанию 300)

            cardsEffect: {
                perSlideOffset: 18,
                perSlideRotate: 4,
                rotate: true,
                slideShadows: false,
            },

            navigation: {
                nextEl: '.gallery__swiper .swiper-button-next',
                prevEl: '.gallery__swiper .swiper-button-prev',
            },

            pagination: {
                el: '.gallery__swiper .swiper-pagination',
                clickable: true,
            },

            keyboard: {
                enabled: true,
                onlyInViewport: true,
            },

            a11y: {
                prevSlideMessage: 'Предыдущий слайд',
                nextSlideMessage: 'Следующий слайд',
            },
        });
    }

    // -------- Скелетон для фото в карусели --------
    document.querySelectorAll('.gallery__slide').forEach(slide => {
        const img = slide.querySelector('img');
        if (!img) {
            slide.classList.add('is-loaded');
            return;
        }

        // Если фото уже загружено из кэша
        if (img.complete && img.naturalWidth > 0) {
            slide.classList.add('is-loaded');
            return;
        }

        const onReady = () => slide.classList.add('is-loaded');
        img.addEventListener('load', onReady, { once: true });
        img.addEventListener('error', onReady, { once: true });
    });

    // -------- Появление элементов при скролле --------
    const revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal--visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    } else {
        // Фолбэк для очень старых браузеров
        revealElements.forEach(el => el.classList.add('reveal--visible'));
    }
});