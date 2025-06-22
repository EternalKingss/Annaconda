const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const customCursor = document.getElementById('customCursor');

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
        maxSpeed: 4,
        size: 25,
        bobOffset: 0
    },
    keys: {},
    mouse: { x: 0, y: 0 },
    wake: [],
    nearestIsland: null,
    time: 0,
    waves: [],
    weather: {
        windSpeed: 2,
        windDirection: 0.5,
        depth: 150
    }
};

const projects = [];
const fileInput = document.getElementById('fileInput');
const projectFrame = document.getElementById('projectFrame');
const projectViewer = document.getElementById('projectViewer');

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        e.target.value = '';
    });
}

// Realistic Islands with natural shapes
const islands = [
    {
        id: 'jarvis',
        x: 300,
        y: 200,
        size: 120,
        name: 'Jarvis AI',
        description: 'Advanced AI assistant with voice recognition and smart home integration.',
        baseColor: '#228b22',
        beachColor: '#f5deb3',
        rockColor: '#696969',
        url: '#',
        shape: generateIslandShape(120, 8), // Natural coastline
        trees: generateTrees(300, 200, 120, 15)
    },
    {
        id: 'secureconfig',
        x: 700,
        y: 350,
        size: 100,
        name: 'SecureConfig Manager',
        description: 'Enterprise-grade configuration management with encryption and version control.',
        baseColor: '#2e8b57',
        beachColor: '#f5deb3',
        rockColor: '#708090',
        url: '#',
        shape: generateIslandShape(100, 6),
        trees: generateTrees(700, 350, 100, 12)
    },
    {
        id: 'demos',
        x: 450,
        y: 600,
        size: 140,
        name: 'Interactive Demos',
        description: 'Collection of experimental web technologies and creative coding projects.',
        baseColor: '#6b8e23',
        beachColor: '#f5deb3',
        rockColor: '#2f4f4f',
        url: '#',
        shape: generateIslandShape(140, 10),
        trees: generateTrees(450, 600, 140, 18)
    },
    {
        id: 'systempanel',
        x: 900,
        y: 150,
        size: 110,
        name: 'System Control Panel',
        description: 'Real-time system monitoring and control interface with cyberpunk aesthetics.',
        baseColor: '#556b2f',
        beachColor: '#f5deb3',
        rockColor: '#483d8b',
        url: '#',
        shape: generateIslandShape(110, 7),
        trees: generateTrees(900, 150, 110, 14)
    }
];

// Generate natural island coastline
function generateIslandShape(radius, points) {
    const shape = [];
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const variation = 0.7 + Math.random() * 0.6; // Natural variation
        const r = radius * variation;
        shape.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r
        });
    }
    return shape;
}

// Generate trees for islands
function generateTrees(centerX, centerY, islandSize, count) {
    const trees = [];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (islandSize * 0.6);
        trees.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            height: 15 + Math.random() * 25,
            type: Math.random() > 0.5 ? 'palm' : 'tree'
        });
    }
    return trees;
}

// Initialize water waves
for (let i = 0; i < 200; i++) {
    game.waves.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        amplitude: 2 + Math.random() * 4,
        frequency: 0.01 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2
    });
}

// Input handling
document.addEventListener('keydown', (e) => {
    game.keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'e' && game.nearestIsland) {
        showIslandPopup(game.nearestIsland);
    }
    if (e.key.toLowerCase() === 'u') {
        document.getElementById('fileInput').click();
    }
});

document.addEventListener('keyup', (e) => {
    game.keys[e.key.toLowerCase()] = false;
});

document.addEventListener('mousemove', (e) => {
    game.mouse.x = e.clientX;
    game.mouse.y = e.clientY;
    if (customCursor) {
        customCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }
});

// Realistic water rendering with depth and movement
function drawWater() {
    const time = Date.now() * 0.001;
    game.time = time;
    
    // Base water color with depth gradient
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, '#4682b4');
    gradient.addColorStop(0.5, '#1e3a5f');
    gradient.addColorStop(1, '#0f1f3f');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Animated wave patterns
    game.waves.forEach(wave => {
        const waveHeight = Math.sin(time * wave.frequency + wave.phase) * wave.amplitude;
        const opacity = 0.1 + Math.abs(waveHeight) * 0.05;
        
        ctx.fillStyle = `rgba(135, 206, 235, ${opacity})`;
        ctx.fillRect(wave.x - 20, wave.y + waveHeight, 40, 2);
        
        // Move waves
        wave.x += game.weather.windSpeed * Math.cos(game.weather.windDirection);
        wave.y += game.weather.windSpeed * Math.sin(game.weather.windDirection) * 0.3;
        
        // Wrap around screen
        if (wave.x < -50) wave.x = canvas.width + 50;
        if (wave.x > canvas.width + 50) wave.x = -50;
        if (wave.y < -50) wave.y = canvas.height + 50;
        if (wave.y > canvas.height + 50) wave.y = -50;
    });
    
    // Water foam effects near islands
    islands.forEach(island => {
        drawWaterFoam(island);
    });
}

// Water foam around islands
function drawWaterFoam(island) {
    const foamRadius = island.size + 15;
    const segments = 32;
    
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const foamX = island.x + Math.cos(angle) * foamRadius;
        const foamY = island.y + Math.sin(angle) * foamRadius;
        
        const foam = Math.sin(game.time * 3 + angle * 2) * 3;
        const opacity = 0.3 + Math.abs(foam) * 0.1;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(foamX + foam, foamY, 2 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw realistic islands with natural features
function drawIslands() {
    islands.forEach(island => {
        const distance = Math.hypot(
            game.boat.x - island.x,
            game.boat.y - island.y
        );
        
        // Draw island shadow (depth effect)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(island.x + island.shape[0].x + 3, island.y + island.shape[0].y + 3);
        island.shape.forEach(point => {
            ctx.lineTo(island.x + point.x + 3, island.y + point.y + 3);
        });
        ctx.closePath();
        ctx.fill();
        
        // Draw beach (sand)
        ctx.fillStyle = island.beachColor;
        ctx.beginPath();
        ctx.moveTo(island.x + island.shape[0].x, island.y + island.shape[0].y);
        island.shape.forEach(point => {
            ctx.lineTo(island.x + point.x, island.y + point.y);
        });
        ctx.closePath();
        ctx.fill();
        
        // Draw main island (vegetation)
        ctx.fillStyle = island.baseColor;
        ctx.beginPath();
        ctx.moveTo(island.x + island.shape[0].x * 0.7, island.y + island.shape[0].y * 0.7);
        island.shape.forEach(point => {
            ctx.lineTo(island.x + point.x * 0.7, island.y + point.y * 0.7);
        });
        ctx.closePath();
        ctx.fill();
        
        // Draw rocks and elevation
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const rockX = island.x + Math.cos(angle) * (island.size * 0.3);
            const rockY = island.y + Math.sin(angle) * (island.size * 0.3);
            
            ctx.fillStyle = island.rockColor;
            ctx.beginPath();
            ctx.arc(rockX, rockY, 3 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw trees
        island.trees.forEach(tree => {
            if (tree.type === 'palm') {
                drawPalmTree(tree.x, tree.y, tree.height);
            } else {
                drawRegularTree(tree.x, tree.y, tree.height);
            }
        });
        
        // Island name with natural styling
        ctx.fillStyle = '#2f4f4f';
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#f5deb3';
        ctx.lineWidth = 3;
        ctx.strokeText(island.name, island.x, island.y + island.size + 30);
        ctx.fillText(island.name, island.x, island.y + island.size + 30);
        
        // Interaction indicator
        if (distance < island.size + 60) {
            game.nearestIsland = island;
            
            // Glowing dock area
            ctx.strokeStyle = '#daa520';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.arc(island.x, island.y, island.size + 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Dock indicator
            ctx.fillStyle = '#daa520';
            ctx.font = 'bold 14px serif';
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 2;
            ctx.strokeText('Press E to dock', island.x, island.y - island.size - 30);
            ctx.fillText('Press E to dock', island.x, island.y - island.size - 30);
        }
    });
    
    // Clear nearest island if not close to any
    const anyClose = islands.some(island => 
        Math.hypot(game.boat.x - island.x, game.boat.y - island.y) < island.size + 60
    );
    if (!anyClose) game.nearestIsland = null;
}

// Draw palm tree
function drawPalmTree(x, y, height) {
    // Trunk
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2, y - height);
    ctx.stroke();
    
    // Palm fronds
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const frondLength = height * 0.6;
        ctx.strokeStyle = '#228b22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 2, y - height);
        ctx.lineTo(
            x + 2 + Math.cos(angle) * frondLength,
            y - height + Math.sin(angle) * frondLength * 0.3
        );
        ctx.stroke();
    }
}

// Draw regular tree
function drawRegularTree(x, y, height) {
    // Trunk
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - 2, y - height * 0.7, 4, height * 0.7);
    
    // Canopy
    ctx.fillStyle = '#228b22';
    ctx.beginPath();
    ctx.arc(x, y - height, height * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

// Draw realistic boat with bobbing motion
function drawBoat() {
    // Boat bobbing effect
    game.boat.bobOffset = Math.sin(game.time * 2) * 2;
    
    ctx.save();
    ctx.translate(game.boat.x, game.boat.y + game.boat.bobOffset);
    ctx.rotate(game.boat.angle);
    
    // Boat shadow in water
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-game.boat.size/2, -game.boat.size/4 + 5, game.boat.size, game.boat.size/2);
    
    // Boat hull
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-game.boat.size/2, -game.boat.size/4, game.boat.size, game.boat.size/2);
    
    // Boat deck
    ctx.fillStyle = '#daa520';
    ctx.fillRect(-game.boat.size/2 + 2, -game.boat.size/4 + 2, game.boat.size - 4, game.boat.size/2 - 4);
    
    // Mast
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -game.boat.size/4);
    ctx.lineTo(0, -game.boat.size);
    ctx.stroke();
    
    // Sail
    if (game.boat.speed > 0.5) {
        ctx.fillStyle = '#f5f5dc';
        ctx.beginPath();
        ctx.moveTo(0, -game.boat.size);
        ctx.lineTo(15, -game.boat.size * 0.8);
        ctx.lineTo(15, -game.boat.size * 0.4);
        ctx.lineTo(0, -game.boat.size/4);
        ctx.closePath();
        ctx.fill();
    }
    
    // Boat tip
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(game.boat.size/2, 0);
    ctx.lineTo(game.boat.size/2 + 8, 0);
    ctx.lineTo(game.boat.size/2, -4);
    ctx.lineTo(game.boat.size/2, 4);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // Realistic wake with foam
    if (game.boat.speed > 0.5) {
        for (let i = 0; i < 3; i++) {
            game.wake.push({
                x: game.boat.x - Math.cos(game.boat.angle) * (20 + i * 10),
                y: game.boat.y - Math.sin(game.boat.angle) * (20 + i * 10),
                life: 1.0,
                size: 3 + i
            });
        }
    }
    
    // Draw wake with realistic foam
    game.wake = game.wake.filter(w => w.life > 0);
    game.wake.forEach(w => {
        const alpha = w.life * 0.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.size, 0, Math.PI * 2);
        ctx.fill();
        w.life -= 0.015;
        w.size *= 1.02; // Expand foam
    });
}

// Enhanced boat physics with water resistance
function updateBoat() {
    const waterResistance = 0.98;
    
    // Movement with realistic water physics
    if (game.keys['w']) {
        game.boat.speed = Math.min(game.boat.maxSpeed, game.boat.speed + 0.15);
    }
    if (game.keys['s']) {
        game.boat.speed = Math.max(-game.boat.maxSpeed/2, game.boat.speed - 0.15);
    }
    if (game.keys['a'] && Math.abs(game.boat.speed) > 0.5) {
        game.boat.angle -= 0.04 * (game.boat.speed / game.boat.maxSpeed);
    }
    if (game.keys['d'] && Math.abs(game.boat.speed) > 0.5) {
        game.boat.angle += 0.04 * (game.boat.speed / game.boat.maxSpeed);
    }
    
    // Water resistance and wave effects
    game.boat.speed *= waterResistance;
    
    // Wave influence on boat movement
    const waveInfluence = Math.sin(game.time * 1.5) * 0.3;
    game.boat.x += Math.cos(game.boat.angle) * game.boat.speed + waveInfluence;
    game.boat.y += Math.sin(game.boat.angle) * game.boat.speed + Math.cos(game.time * 1.8) * 0.2;
    
    // World boundaries (wrap around)
    if (game.boat.x < -100) game.boat.x = canvas.width + 100;
    if (game.boat.x > canvas.width + 100) game.boat.x = -100;
    if (game.boat.y < -100) game.boat.y = canvas.height + 100;
    if (game.boat.y > canvas.height + 100) game.boat.y = -100;
    
    // Update UI
    document.getElementById('lat').textContent = Math.round(game.boat.y);
    document.getElementById('lon').textContent = Math.round(game.boat.x);
    document.getElementById('spd').textContent = Math.abs(game.boat.speed).toFixed(1);
    
    // Update depth based on distance from islands
    let minDistanceToIsland = Infinity;
    islands.forEach(island => {
        const dist = Math.hypot(game.boat.x - island.x, game.boat.y - island.y);
        minDistanceToIsland = Math.min(minDistanceToIsland, dist);
    });
    
    game.weather.depth = Math.max(5, Math.min(200, minDistanceToIsland - 50));
    
    // Update depth display if element exists
    const depthElement = document.getElementById('depth');
    if (depthElement) {
        depthElement.textContent = Math.round(game.weather.depth);
    }
}

// Show island popup
function showIslandPopup(island) {
    const popup = document.getElementById('islandPopup');
    document.getElementById('popupTitle').textContent = island.name;
    document.getElementById('popupDescription').textContent = island.description;
    
    popup.style.left = island.x + 'px';
    popup.style.top = (island.y - island.size - 20) + 'px';
    popup.classList.add('visible');
    
    popup.dataset.currentIsland = island.id;
}

// Hide popup
function hideIslandPopup() {
    document.getElementById('islandPopup').classList.remove('visible');
}

function handleFiles(files) {
    if (!files.length) return;
    const project = { html: '', css: '', js: '' };
    const reads = [];
    Array.from(files).forEach(f => {
        reads.push(f.text().then(t => {
            if (f.name.endsWith('.css')) project.css += '\n' + t;
            else if (f.name.endsWith('.js')) project.js += '\n' + t;
            else if (f.name.match(/\.html?$/)) project.html = t;
        }));
    });
    Promise.all(reads).then(() => {
        let html = project.html || '<!DOCTYPE html><html><head></head><body></body></html>';
        html = html.replace('</head>', `<style>${project.css}</style></head>`);
        html = html.replace('</body>', `<script>${project.js}</script></body>`);
        const blob = new Blob([html], { type: 'text/html' });
        project.url = URL.createObjectURL(blob);
        projects.push(project);
        document.getElementById('projectCount').textContent = projects.length;
        launchProject(projects.length - 1);
    });
}

function launchProject(index) {
    if (!projects[index]) return;
    projectFrame.src = projects[index].url;
    projectViewer.classList.remove('hidden');
}

function closeProject() {
    projectViewer.classList.add('hidden');
    projectFrame.src = '';
}

// Dock at island
function dockAtIsland() {
    const popup = document.getElementById('islandPopup');
    const islandId = popup.dataset.currentIsland;
    const island = islands.find(i => i.id === islandId);
    
    if (island) {
        alert(`Welcome to ${island.name}!\n\nLaunching project...`);
        // window.open(island.url, '_blank');
    }
    
    hideIslandPopup();
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawWater();
    drawIslands();
    drawBoat();
    updateBoat();
    
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
