// Particle system
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
function resize(){
    canvas.width = window.innerWidth;
    canvas.height = document.getElementById('hero').offsetHeight;
}
window.addEventListener('resize', resize);
resize();
for (let i = 0; i < 100; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5),
        vy: (Math.random() - 0.5)
    });
}
function updateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    }
    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        ctx.fillStyle = 'cyan';
        ctx.fillRect(p1.x, p1.y, 2, 2);
        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (dist < 100) {
                ctx.strokeStyle = `rgba(0,255,255,${1 - dist / 100})`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(updateParticles);
}
updateParticles();

// Parallax layers
const layers = document.querySelectorAll('.parallax');
window.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    layers.forEach((layer, i) => {
        const speed = (i + 1) / 40;
        layer.style.transform = `translate3d(${x * speed * 50}px, ${y * speed * 50}px, 0)`;
    });
});

// Magnetic button
const mag = document.querySelector('.magnetic');
window.addEventListener('mousemove', e => {
    const rect = mag.getBoundingClientRect();
    const distX = e.clientX - (rect.left + rect.width / 2);
    const distY = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(distX, distY);
    const strength = Math.max(0, 150 - dist) / 150;
    mag.style.transform = `translate(${distX * strength * 0.3}px, ${distY * strength * 0.3}px)`;
});
mag.addEventListener('mouseleave', () => { mag.style.transform = ''; });

// Ripple effect
window.addEventListener('click', e => {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
});

// Split text scatter
const split = document.getElementById('tagline');
split.innerHTML = [...split.textContent].map(c => `<span>${c}</span>`).join('');
split.addEventListener('mouseenter', () => {
    split.querySelectorAll('span').forEach(span => {
        span.style.transform = `translate(${(Math.random() - 0.5) * 40}px, ${(Math.random() - 0.5) * 40}px)`;
    });
});
split.addEventListener('mouseleave', () => {
    split.querySelectorAll('span').forEach(span => { span.style.transform = ''; });
});

// Morphing shape
const path = document.querySelector('#morph path');
let toggled = false;
path.addEventListener('click', () => {
    if (!toggled) {
        path.setAttribute('d', 'M50,10 C80,20 80,80 50,90 C20,80 20,20 50,10 Z');
    } else {
        path.setAttribute('d', 'M10,10 L90,10 L90,90 L10,90 Z');
    }
    toggled = !toggled;
});

// Play sound on clicks
function beep() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}
window.addEventListener('click', beep);

// Progress bar
window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollTop / docHeight * 100;
    document.getElementById('progress').style.width = progress + '%';
});

// Konami code
const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let pos = 0;
window.addEventListener('keydown', e => {
    if (e.key === code[pos]) {
        pos++;
        if (pos === code.length) {
            document.body.classList.add('konami');
            pos = 0;
        }
    } else {
        pos = 0;
    }
});

// Hidden terminal
let termVisible = false;
let terminal;
window.addEventListener('keydown', e => {
    if (e.key === '`') {
        if (!termVisible) {
            terminal = document.createElement('div');
            terminal.contentEditable = true;
            Object.assign(terminal.style, {
                position: 'fixed',
                bottom: '0',
                left: '0',
                width: '100%',
                height: '200px',
                background: '#000',
                color: '#0f0',
                fontFamily: 'monospace'
            });
            document.body.appendChild(terminal);
            terminal.focus();
            termVisible = true;
        } else {
            terminal.remove();
            termVisible = false;
        }
    }
});

console.log('Welcome to the console!');
