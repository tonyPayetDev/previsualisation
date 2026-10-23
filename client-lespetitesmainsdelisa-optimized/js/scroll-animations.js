// Intersection Observer for scroll reveals
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements with data-reveal attribute
document.querySelectorAll('[data-reveal]').forEach(el => {
    observer.observe(el);
});

// Stagger effect for grids
document.querySelectorAll('[data-stagger]').forEach(container => {
    const children = container.children;
    Array.from(children).forEach((child, index) => {
        child.style.setProperty('--stagger-delay', `${index * 100}ms`);
    });
});
