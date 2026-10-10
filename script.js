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