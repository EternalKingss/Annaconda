const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game state
const game = {
    camera: { x: 0, y: 0 },
    boat: { 
        x: canvas.width / 2, 
        y: canvas.height / 2, 
        angle: 0, 
        speed: 0,
        maxSpeed: 3,
        size: 20
    },
    keys: {},
    mouse: { x: 0, y: 0 },
    wake: [],
    nearestIsland: null
};

// Islands (your projects)
const islands = [
    {
        id: 'jarvis',
        x: 200,
        y: 150,
        size: 80,
        name: 'Jarvis AI',
        description: 'Advanced AI assistant with voice recognition and smart home integration.',
        color: '#ff6b6b',
        url: '#'
    },
    {
        id: 'secureconfig',
        x: 600,
        y: 300,
        size: 70,
        name: 'SecureConfig Manager',
        description: 'Enterprise-grade configuration management with encryption and version control.',
        color: '#4ecdc4',
        url: '#'
    },
    {
        id: 'demos',
        x: 300,
        y: 500,
        size: 90,
        name: 'Interactive Demos',
        description: 'Collection of experimental web technologies and creative coding projects.',
        color: '#45b7d1',
        url: '#'
    },
    {
        id: 'systempanel',
        x: 800,
        y: 100,
        size: 75,
        name: 'System Control Panel',
        description: 'Real-time system monitoring and control interface with cyberpunk aesthetics.',
        color: '#96ceb4',
        url: '#'
    }
];

// Input handling
document.addEventListener('keydown', (e) => {
    game.keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'e' && game.nearestIsland) {
        showIslandPopup(game.nearestIsland);
    }
});

document.addEventListener('keyup', (e) => {
    game.keys[e.key.toLowerCase()] = false;
});

document.addEventListener('mousemove', (e) => {
    game.mouse.x = e.clientX;
    game.mouse.y = e.clientY;
});

// Water wave effect
function drawWater() {
    const time = Date.now() * 0.002;
    
    for (let x = 0; x < canvas.width + 50; x += 50) {
        for (let y = 0; y < canvas.height + 50; y += 50) {
            const wave = Math.sin((x + y) * 0.01 + time) * 10;
            ctx.fillStyle = `rgba(0, 100, 150, ${0.1 + Math.sin(time + x * 0.01) * 0.05})`;
            ctx.fillRect(x, y + wave, 40, 2);
        }
    }
}

// Draw islands
function drawIslands() {
    islands.forEach(island => {
        const distance = Math.hypot(
            game.boat.x - island.x,
            game.boat.y - island.y
        );
        
        // Island base
        ctx.fillStyle = island.color;
        ctx.beginPath();
        ctx.arc(island.x, island.y, island.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Island glow effect
        const glowIntensity = Math.max(0, 1 - distance / 200);
        if (glowIntensity > 0) {
            ctx.shadowBlur = 20 * glowIntensity;
            ctx.shadowColor = island.color;
            ctx.beginPath();
            ctx.arc(island.x, island.y, island.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Island name
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(island.name, island.x, island.y + island.size + 20);
        
        // Interaction indicator
        if (distance < island.size + 50) {
            game.nearestIsland = island;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(island.x, island.y, island.size + 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Press E indicator
            ctx.fillStyle = '#00ffff';
            ctx.font = '12px Courier New';
            ctx.fillText('Press E to dock', island.x, island.y - island.size - 20);
        }
    });
    
    // Clear nearest island if not close to any
    const anyClose = islands.some(island => 
        Math.hypot(game.boat.x - island.x, game.boat.y - island.y) < island.size + 50
    );
    if (!anyClose) game.nearestIsland = null;
}

// Draw boat
function drawBoat() {
    ctx.save();
    ctx.translate(game.boat.x, game.boat.y);
    ctx.rotate(game.boat.angle);
    
    // Boat body
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(-game.boat.size/2, -game.boat.size/4, game.boat.size, game.boat.size/2);
    
    // Boat tip
    ctx.beginPath();
    ctx.moveTo(game.boat.size/2, 0);
    ctx.lineTo(game.boat.size/2 + 10, 0);
    ctx.lineTo(game.boat.size/2, -5);
    ctx.lineTo(game.boat.size/2, 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // Wake effect
    if (game.boat.speed > 0.5) {
        game.wake.push({
            x: game.boat.x - Math.cos(game.boat.angle) * 15,
            y: game.boat.y - Math.sin(game.boat.angle) * 15,
            life: 1.0
        });
    }
    
    // Draw wake
    game.wake = game.wake.filter(w => w.life > 0);
    game.wake.forEach(w => {
        ctx.fillStyle = `rgba(255, 255, 255, ${w.life * 0.5})`;
        ctx.fillRect(w.x, w.y, 2, 2);
        w.life -= 0.02;
    });
}

// Update boat physics
function updateBoat() {
    // Movement
    if (game.keys['w']) game.boat.speed = Math.min(game.boat.maxSpeed, game.boat.speed + 0.2);
    if (game.keys['s']) game.boat.speed = Math.max(-game.boat.maxSpeed/2, game.boat.speed - 0.2);
    if (game.keys['a']) game.boat.angle -= 0.05 * (game.boat.speed / game.boat.maxSpeed);
    if (game.keys['d']) game.boat.angle += 0.05 * (game.boat.speed / game.boat.maxSpeed);
    
    // Friction
    game.boat.speed *= 0.95;
    
    // Move boat
    game.boat.x += Math.cos(game.boat.angle) * game.boat.speed;
    game.boat.y += Math.sin(game.boat.angle) * game.boat.speed;
    
    // Boundaries (wrap around)
    if (game.boat.x < -50) game.boat.x = canvas.width + 50;
    if (game.boat.x > canvas.width + 50) game.boat.x = -50;
    if (game.boat.y < -50) game.boat.y = canvas.height + 50;
    if (game.boat.y > canvas.height + 50) game.boat.y = -50;
    
    // Update coordinates display
    document.getElementById('lat').textContent = Math.round(game.boat.y);
    document.getElementById('lon').textContent = Math.round(game.boat.x);
}

// Show island popup
function showIslandPopup(island) {
    const popup = document.getElementById('islandPopup');
    document.getElementById('popupTitle').textContent = island.name;
    document.getElementById('popupDescription').textContent = island.description;
    
    popup.style.left = island.x + 'px';
    popup.style.top = (island.y - island.size - 20) + 'px';
    popup.classList.add('visible');
    
    // Store current island for docking
    popup.dataset.currentIsland = island.id;
}

// Hide popup
function hideIslandPopup() {
    document.getElementById('islandPopup').classList.remove('visible');
}

// Dock at island
function dockAtIsland() {
    const popup = document.getElementById('islandPopup');
    const islandId = popup.dataset.currentIsland;
    const island = islands.find(i => i.id === islandId);
    
    if (island) {
        // For now, just show an alert. Replace with actual project navigation
        alert(`Launching ${island.name}!\n\nURL: ${island.url}`);
        // window.open(island.url, '_blank');
    }
    
    hideIslandPopup();
}

// Add some ambient particles
const particles = [];
for (let i = 0; i < 50; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1
    });
}

function updateParticles() {
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    updateParticles();
    updateBoat();
    drawWater();
    drawIslands();
    drawBoat();
    
    requestAnimationFrame(gameLoop);
}

// Click outside popup to close
document.addEventListener('click', (e) => {
    const popup = document.getElementById('islandPopup');
    if (!popup.contains(e.target) && !e.target.closest('.dock-button')) {
        hideIslandPopup();
    }
});

// Start the game
gameLoop();