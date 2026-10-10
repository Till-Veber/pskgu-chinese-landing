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

                [...svg.querySelectorAll('path')].forEach(path => {
                    let length = 0;
                    try { length = path.getTotalLength(); } catch (_) { /* пропускаем некорректный путь */ }

                    if (length < 12) {
                        path.classList.add('sketch-mark--static');
                        return;
                    }

                    path.style.setProperty('--path-length', `${length.toFixed(1)}px`);
                    const duration = Math.min(16, Math.max(8, 7 + length / 70));
                    // Отрицательная задержка распределяет штрихи по разным фазам уже при загрузке.
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