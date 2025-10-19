// Visual Effects Only - All Sound Effects Removed

// Placeholder functions for compatibility (no sound)
function playRandomZombieSound() {
    // Sound removed
}

function playRandomLevelUpSound() {
    // Sound removed
}

function playPowerUpSounds() {
    // Sound removed
}

// Animation Effects
function createLightningEffect(container) {
    setInterval(() => {
        const lightning = $('<div class="lightning"></div>');
        lightning.css({
            left: Math.random() * 100 + '%',
            top: '0%',
            height: Math.random() * 30 + 20 + 'px',
            transform: `rotate(${Math.random() * 30 - 15}deg)`
        });
        container.append(lightning);
        setTimeout(() => lightning.remove(), 1500);
    }, 300);
}

function createPowerOrbs(container) {
    setInterval(() => {
        const orb = $('<div class="power-orb"></div>');
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        orb.css({
            left: startX + '%',
            top: startY + '%',
            '--tx': (Math.random() * 200 - 100) + 'px',
            '--ty': (Math.random() * 200 - 100) + 'px'
        });
        container.append(orb);
        setTimeout(() => orb.remove(), 3000);
    }, 200);
}

function showLevelNumber(container, number) {
    const levelNum = $(`<div class="level-up-number">${number}</div>`);
    levelNum.css({
        left: Math.random() * 60 + 20 + '%',
        top: Math.random() * 60 + 20 + '%'
    });
    container.append(levelNum);
    setTimeout(() => levelNum.remove(), 500);
}

function createMagicEffects(container) {
    // Create magic circle
    const magicCircle = $('<div class="magic-circle"></div>');
    container.append(magicCircle);

    // Add rune symbols
    const runes = ['⚡', '✨', '🌟', '⭐', '💫'];
    for(let i = 0; i < 8; i++) {
        const rune = $(`<div class="rune">${runes[i % runes.length]}</div>`);
        rune.css({
            left: 50 + Math.cos(i * Math.PI/4) * 100 + '%',
            top: 50 + Math.sin(i * Math.PI/4) * 100 + '%',
            animationDelay: `${i * 0.5}s`
        });
        container.append(rune);
    }

    // Add energy particles
    setInterval(() => {
        const particle = $('<div class="energy-particle"></div>');
        particle.css({
            left: '50%',
            top: '50%',
            animationDelay: `${Math.random()}s`
        });
        container.append(particle);
        setTimeout(() => particle.remove(), 3000);
    }, 100);

    // Add dragon aura
    const dragon = $('<div class="dragon-aura">🐉</div>');
    container.append(dragon);

    // Visual waves only (no sound)
    setInterval(() => {
        const wave = $('<div class="sound-wave"></div>');
        wave.css({
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
        });
        container.append(wave);
        setTimeout(() => wave.remove(), 2000);
    }, 500);
}

function createParticles() {
    for(let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = Math.random() * 100 + 'vh';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.opacity = Math.random() * 0.5;
        document.body.appendChild(particle);
    }
}

// Removed hover sound - placeholder for compatibility
const hoverSound = null;
