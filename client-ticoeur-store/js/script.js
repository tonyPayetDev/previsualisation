// ========================================
// CŒUR DE VELOURS - CHOCOLATIER D'EXCEPTION
// ========================================

// Animation d'entrée au chargement de la page
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.8s ease';
        document.body.style.opacity = '1';
    }, 100);

    // Animation des éléments au chargement
    animateOnScroll();
});

// Smooth scroll pour la navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Gestion du scroll pour la navbar
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
    }

    lastScroll = currentScroll;
});

// Gestion des boutons "Ajouter au Panier"
const addButtons = document.querySelectorAll('.btn-add');

addButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        const productName = productCard.querySelector('h3').textContent;
        const productPrice = productCard.querySelector('.price').textContent;

        // Animation du bouton
        const originalText = button.textContent;
        button.textContent = '✓ Ajouté!';
        button.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        button.disabled = true;

        // Effet de particules
        createParticles(e.pageX, e.pageY);

        // Animation de la carte
        productCard.style.transform = 'scale(0.98)';
        setTimeout(() => {
            productCard.style.transform = '';
        }, 200);

        // Notification
        showNotification(`${productName} ajoutée au panier pour ${productPrice}!`, 'success');

        // Réinitialiser le bouton après 2 secondes
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)';
            button.disabled = false;
        }, 2000);
    });
});

// Gestion du bouton hero principal
const btnPrimary = document.querySelector('.btn-primary');
if (btnPrimary) {
    btnPrimary.addEventListener('click', () => {
        const productsSection = document.getElementById('collection');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// Fonction pour créer des particules animées
function createParticles(x, y) {
    const symbols = ['❤️', '🌹', '🍫', '💝', '✨'];

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];

        particle.textContent = symbol;
        particle.style.position = 'fixed';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.fontSize = (15 + Math.random() * 15) + 'px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        particle.style.transition = 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        particle.style.userSelect = 'none';

        document.body.appendChild(particle);

        // Animation aléatoire
        setTimeout(() => {
            const angle = (Math.PI * 2 * i) / 12;
            const distance = 80 + Math.random() * 60;
            const randomX = Math.cos(angle) * distance;
            const randomY = Math.sin(angle) * distance - 50;

            particle.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${Math.random() * 360}deg)`;
            particle.style.opacity = '0';
        }, 50);

        // Supprimer l'élément après l'animation
        setTimeout(() => {
            particle.remove();
        }, 1250);
    }
}

// Fonction pour afficher une notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const icon = type === 'success' ? '✓' : 'ℹ';
    const bgColor = type === 'success'
        ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
        : 'linear-gradient(135deg, #8B4513 0%, #5D2E0F 100%)';

    notification.innerHTML = `<span style="margin-right: 10px; font-size: 1.2em;">${icon}</span>${message}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: -400px;
        background: ${bgColor};
        color: white;
        padding: 18px 28px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        z-index: 10000;
        font-size: 1em;
        font-weight: 500;
        display: flex;
        align-items: center;
        min-width: 300px;
        max-width: 400px;
        transition: right 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;

    document.body.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => {
        notification.style.right = '30px';
    }, 100);

    // Animation de sortie
    setTimeout(() => {
        notification.style.right = '-400px';
        setTimeout(() => notification.remove(), 500);
    }, 3500);
}

// Gestion du formulaire de contact
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = contactForm.querySelector('#name').value;
        const email = contactForm.querySelector('#email').value;
        const submitButton = contactForm.querySelector('.btn-submit');
        const originalText = submitButton.textContent;

        // Validation simple
        if (!name || !email) {
            showNotification('Veuillez remplir tous les champs requis', 'info');
            return;
        }

        // Animation du bouton
        submitButton.textContent = '✓ Message Envoyé!';
        submitButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        submitButton.disabled = true;

        // Effet de particules
        const rect = submitButton.getBoundingClientRect();
        createParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2 + window.scrollY
        );

        // Notification
        showNotification(`Merci ${name}! Nous vous répondrons rapidement.`, 'success');

        // Réinitialiser le formulaire après 2 secondes
        setTimeout(() => {
            contactForm.reset();
            submitButton.textContent = originalText;
            submitButton.style.background = 'linear-gradient(135deg, #8B4513 0%, #5D2E0F 100%)';
            submitButton.disabled = false;
        }, 2000);
    });
}

// Gestion de la newsletter
const newsletterForm = document.querySelector('.newsletter-form');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;

        if (email) {
            showNotification('Merci pour votre inscription à notre newsletter!', 'success');
            newsletterForm.reset();
        }
    });
}

// Animation au scroll avec Intersection Observer
function animateOnScroll() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observer les cartes produits
    document.querySelectorAll('.product-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Observer les éléments de galerie
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.9)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(item);
    });

    // Observer les feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Effet parallax sur le hero
window.addEventListener('scroll', () => {
    const heroImage = document.querySelector('.hero-image img');
    if (heroImage && window.innerWidth > 768) {
        const scrollPosition = window.pageYOffset;
        heroImage.style.transform = `translateY(${scrollPosition * 0.3}px)`;
    }
});

// Animation hover sur les cartes produits
const productCards = document.querySelectorAll('.product-card');

productCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        const badge = card.querySelector('.product-badge');
        if (badge) {
            badge.style.transition = 'transform 0.3s ease';
            badge.style.transform = 'scale(1.1) rotate(-5deg)';
        }
    });

    card.addEventListener('mouseleave', () => {
        const badge = card.querySelector('.product-badge');
        if (badge) {
            badge.style.transform = 'scale(1) rotate(0deg)';
        }
    });
});

// Animation hover sur les éléments de galerie
document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
        const img = item.querySelector('img');
        const imgSrc = img.src;

        // Créer une modale pour afficher l'image en grand
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            animation: fadeIn 0.3s ease;
        `;

        const modalImg = document.createElement('img');
        modalImg.src = imgSrc;
        modalImg.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            border-radius: 10px;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            animation: scaleIn 0.3s ease;
        `;

        modal.appendChild(modalImg);
        document.body.appendChild(modal);

        modal.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        });
    });
});

// Ajouter les animations CSS pour la modale
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    @keyframes scaleIn {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Compteur animé pour les statistiques
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + (element.textContent.includes('+') ? '+' : '') + (element.textContent.includes('%') ? '%' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + (element.textContent.includes('+') ? '+' : '') + (element.textContent.includes('%') ? '%' : '');
        }
    }, 16);
}

// Observer pour les statistiques
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            if (statNumber && !statNumber.classList.contains('animated')) {
                statNumber.classList.add('animated');
                const text = statNumber.textContent;
                const number = parseInt(text.replace(/\D/g, ''));
                animateCounter(statNumber, number);
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(stat => {
    statsObserver.observe(stat);
});

console.log('🍫❤️🌹 Cœur de Velours - Site chargé avec excellence!');
console.log('Design by: Cœur de Velours | Chocolatier d\'Exception');
