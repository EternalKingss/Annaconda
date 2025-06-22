// Game state
const game = {
    canvas: document.getElementById('gameCanvas'),
    ctx: null,
    camera: { x: 0, y: 0 },
    boat: { 
        x: 400, 
        y: 300, 
        angle: 0, 
        speed: 0,
        maxSpeed: 6,
        size: 30,
        bobOffset: 0,
        trail: []
    },
    keys: {},
    mouse: { x: 0, y: 0 },
    islands: [],
    nearestIsland: null,
    time: 0,
    projects: new Map(),
    currentIslandId: null
};

// Initialize
function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    resizeCanvas();
    createIslands();
    createParticles();
    setupEventListeners();
    gameLoop();
}

function resizeCanvas() {
    game.canvas.width = window.innerWidth;
    game.canvas.height = window.innerHeight;
}

function createIslands() {
    const islandConfigs = [
        { name: 'Portfolio Hub', description: 'Your main portfolio and project showcase', x: 300, y: 200, color: '#10b981' },
        { name: 'Code Lab', description: 'Experimental coding projects and demos', x: 700, y: 150, color: '#3b82f6' },
        { name: 'Creative Studio', description: 'Art, design, and creative experiments', x: 500, y: 400, color: '#f59e0b' },
        { name: 'Data Isle', description: 'Analytics, visualizations, and data projects', x: 900, y: 350, color: '#ef4444' },
        { name: 'Tool Forge', description: 'Useful utilities and productivity tools', x: 200, y: 500, color: '#8b5cf6' }
    ];

    game.islands = islandConfigs.map((config, index) => ({
        id: `island_${index}`,
        ...config,
        size: 80 + Math.random() * 40,
        trees: generateTrees(config.x, config.y, 60),
        hasProject: false,
        projectData: null
    }));
}

function generateTrees(centerX, centerY, radius) {
    const trees = [];
    const treeCount = 8 + Math.random() * 12;
    for (let i = 0; i < treeCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius * 0.7;
        trees.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            height: 20 + Math.random() * 30,
            type: Math.random() > 0.6 ? 'palm' : 'pine'
        });
    }
    return trees;
}

function createParticles() {
    const particleContainer = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (4 + Math.random() * 4) + 's';
        particleContainer.appendChild(particle);
    }
}

function setupEventListeners() {
    window.addEventListener('resize', resizeCanvas);
    
    document.addEventListener('keydown', (e) => {
        game.keys[e.key.toLowerCase()] = true;
        if (e.key.toLowerCase() === 'e' && game.nearestIsland) {
            showIslandPopup(game.nearestIsland);
        }
        if (e.key.toLowerCase() === 'u') {
            showUploadModal();
        }
    });

    document.addEventListener('keyup', (e) => {
        game.keys[e.key.toLowerCase()] = false;
    });

    document.addEventListener('mousemove', (e) => {
        game.mouse.x = e.clientX;
        game.mouse.y = e.clientY;
        
        const cursor = document.querySelector('.custom-cursor');
        cursor.style.left = e.clientX - 10 + 'px';
        cursor.style.top = e.clientY - 10 + 'px';
    });

    // Upload functionality
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        const popup = document.getElementById('islandPopup');
        const uploadModal = document.getElementById('uploadModal');
        const projectModal = document.getElementById('projectModal');
        
        if (!popup.contains(e.target) && popup.classList.contains('visible')) {
            hideIslandPopup();
        }
        
        if (e.target === uploadModal) {
            closeUploadModal();
        }
        
        if (e.target === projectModal) {
            closeModal();
        }
    });
}

function drawWater() {
    const time = Date.now() * 0.001;
    game.time = time;

    // Animated water gradient
    const gradient = game.ctx.createRadialGradient(
        game.canvas.width / 2, game.canvas.height / 2, 0,
        game.canvas.width / 2, game.canvas.height / 2, Math.max(game.canvas.width, game.canvas.height)
    );
    
    const wave1 = 0.5 + Math.sin(time * 0.5) * 0.1;
    const wave2 = 0.3 + Math.cos(time * 0.3) * 0.1;
    
    gradient.addColorStop(0, `rgba(30, 58, 138, ${wave1})`);
    gradient.addColorStop(0.5, `rgba(15, 23, 42, ${wave2})`);
    gradient.addColorStop(1, '#0f172a');

    game.ctx.fillStyle = gradient;
    game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);

    // Draw animated waves
    for (let i = 0; i < 5; i++) {
        const waveY = (game.canvas.height / 6) * (i + 1) + Math.sin(time + i) * 20;
        const opacity = 0.05 + Math.sin(time + i) * 0.02;
        
        game.ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
        game.ctx.lineWidth = 2;
        game.ctx.beginPath();
        
        for (let x = 0; x < game.canvas.width; x += 5) {
            const waveHeight = Math.sin((x * 0.01) + time + i) * 10;
            if (x === 0) {
                game.ctx.moveTo(x, waveY + waveHeight);
            } else {
                game.ctx.lineTo(x, waveY + waveHeight);
            }
        }
        game.ctx.stroke();
    }
}

function drawIslands() {
    game.nearestIsland = null;
    let minDistance = Infinity;

    game.islands.forEach(island => {
        const distance = Math.hypot(game.boat.x - island.x, game.boat.y - island.y);
        
        if (distance < minDistance && distance < island.size + 100) {
            minDistance = distance;
            game.nearestIsland = island;
        }

        // Island shadow
        game.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        game.ctx.beginPath();
        game.ctx.arc(island.x + 5, island.y + 5, island.size, 0, Math.PI * 2);
        game.ctx.fill();

        // Main island with gradient
        const gradient = game.ctx.createRadialGradient(
            island.x, island.y, 0,
            island.x, island.y, island.size
        );
        gradient.addColorStop(0, island.color);
        gradient.addColorStop(0.7, island.color + '80');
        gradient.addColorStop(1, '#1f2937');

        game.ctx.fillStyle = gradient;
        game.ctx.beginPath();
        game.ctx.arc(island.x, island.y, island.size, 0, Math.PI * 2);
        game.ctx.fill();

        // Beach
        game.ctx.fillStyle = '#fbbf24';
        game.ctx.beginPath();
        game.ctx.arc(island.x, island.y, island.size + 8, 0, Math.PI * 2);
        game.ctx.fill();

        // Trees
        island.trees.forEach(tree => {
            drawTree(tree);
        });

        // Project indicator
        if (island.hasProject) {
            const pulse = 0.8 + Math.sin(game.time * 3) * 0.2;
            game.ctx.fillStyle = `rgba(96, 165, 250, ${pulse})`;
            game.ctx.beginPath();
            game.ctx.arc(island.x, island.y - island.size - 20, 8, 0, Math.PI * 2);
            game.ctx.fill();
            
            game.ctx.fillStyle = '#ffffff';
            game.ctx.font = '12px Arial';
            game.ctx.textAlign = 'center';
            game.ctx.fillText('🚀', island.x, island.y - island.size - 15);
        }

        // Island name
        game.ctx.fillStyle = '#ffffff';
        game.ctx.font = 'bold 14px Inter';
        game.ctx.textAlign = 'center';
        game.ctx.strokeStyle = '#000000';
        game.ctx.lineWidth = 3;
        game.ctx.strokeText(island.name, island.x, island.y + island.size + 25);
        game.ctx.fillText(island.name, island.x, island.y + island.size + 25);

        // Interaction indicator
        if (game.nearestIsland === island) {
            const pulse = 0.3 + Math.sin(game.time * 4) * 0.2;
            game.ctx.strokeStyle = `rgba(96, 165, 250, ${pulse})`;
            game.ctx.lineWidth = 3;
            game.ctx.setLineDash([10, 10]);
            game.ctx.beginPath();
            game.ctx.arc(island.x, island.y, island.size + 30, 0, Math.PI * 2);
            game.ctx.stroke();
            game.ctx.setLineDash([]);

            // Dock prompt
            game.ctx.fillStyle = '#60a5fa';
            game.ctx.font = 'bold 12px Inter';
            game.ctx.textAlign = 'center';
            game.ctx.fillText('Press E to dock', island.x, island.y - island.size - 40);
        }
    });
}

function drawTree(tree) {
    game.ctx.save();
    game.ctx.translate(tree.x, tree.y);

    if (tree.type === 'palm') {
        // Palm trunk
        game.ctx.fillStyle = '#8b4513';
        game.ctx.fillRect(-3, -tree.height, 6, tree.height);

        // Palm fronds
        game.ctx.strokeStyle = '#22c55e';
        game.ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            game.ctx.beginPath();
            game.ctx.moveTo(0, -tree.height);
            game.ctx.lineTo(
                Math.cos(angle) * 20,
                -tree.height + Math.sin(angle) * 10
            );
            game.ctx.stroke();
        }
    } else {
        // Pine trunk
        game.ctx.fillStyle = '#8b4513';
        game.ctx.fillRect(-2, -tree.height * 0.7, 4, tree.height * 0.7);

        // Pine needles
        game.ctx.fillStyle = '#16a34a';
        game.ctx.beginPath();
        game.ctx.moveTo(0, -tree.height);
        game.ctx.lineTo(-tree.height * 0.3, -tree.height * 0.5);
        game.ctx.lineTo(tree.height * 0.3, -tree.height * 0.5);
        game.ctx.closePath();
        game.ctx.fill();
    }

    game.ctx.restore();
}

function drawBoat() {
    game.boat.bobOffset = Math.sin(game.time * 2) * 3;
    
    game.ctx.save();
    game.ctx.translate(game.boat.x, game.boat.y + game.boat.bobOffset);
    game.ctx.rotate(game.boat.angle);

    // Boat shadow
    game.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    game.ctx.fillRect(-game.boat.size/2 + 2, -game.boat.size/4 + 2, game.boat.size, game.boat.size/2);

    // Hull gradient
    const hullGradient = game.ctx.createLinearGradient(0, -game.boat.size/4, 0, game.boat.size/4);
    hullGradient.addColorStop(0, '#8b4513');
    hullGradient.addColorStop(1, '#654321');
    
    game.ctx.fillStyle = hullGradient;
    game.ctx.fillRect(-game.boat.size/2, -game.boat.size/4, game.boat.size, game.boat.size/2);

    // Deck
    game.ctx.fillStyle = '#daa520';
    game.ctx.fillRect(-game.boat.size/2 + 3, -game.boat.size/4 + 3, game.boat.size - 6, game.boat.size/2 - 6);

    // Mast
    game.ctx.strokeStyle = '#8b4513';
    game.ctx.lineWidth = 4;
    game.ctx.beginPath();
    game.ctx.moveTo(0, -game.boat.size/4);
    game.ctx.lineTo(0, -game.boat.size * 1.2);
    game.ctx.stroke();

    // Sail (when moving)
    if (game.boat.speed > 0.5) {
        const sailGradient = game.ctx.createLinearGradient(0, -game.boat.size * 1.2, 20, -game.boat.size * 0.6);
        sailGradient.addColorStop(0, '#f8fafc');
        sailGradient.addColorStop(1, '#e2e8f0');
        
        game.ctx.fillStyle = sailGradient;
        game.ctx.beginPath();
        game.ctx.moveTo(0, -game.boat.size * 1.2);
        game.ctx.lineTo(20, -game.boat.size);
        game.ctx.lineTo(20, -game.boat.size * 0.6);
        game.ctx.lineTo(0, -game.boat.size/4);
        game.ctx.closePath();
        game.ctx.fill();

        game.ctx.strokeStyle = '#94a3b8';
        game.ctx.lineWidth = 1;
        game.ctx.stroke();
    }

    // Bow
    game.ctx.fillStyle = '#92400e';
    game.ctx.beginPath();
    game.ctx.moveTo(game.boat.size/2, 0);
    game.ctx.lineTo(game.boat.size/2 + 10, -3);
    game.ctx.lineTo(game.boat.size/2 + 10, 3);
    game.ctx.closePath();
    game.ctx.fill();

    game.ctx.restore();

    // Wake trail
    if (game.boat.speed > 0.5) {
        game.boat.trail.push({
            x: game.boat.x - Math.cos(game.boat.angle) * 25,
            y: game.boat.y - Math.sin(game.boat.angle) * 25,
            life: 1.0,
            size: 4
        });
    }

    // Draw wake
    game.boat.trail = game.boat.trail.filter(wake => wake.life > 0);
    game.boat.trail.forEach(wake => {
        const alpha = wake.life * 0.6;
        game.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        game.ctx.beginPath();
        game.ctx.arc(wake.x, wake.y, wake.size, 0, Math.PI * 2);
        game.ctx.fill();
        wake.life -= 0.02;
        wake.size *= 1.03;
    });
}

function updateBoat() {
    const acceleration = 0.2;
    const friction = 0.95;
    const turnSpeed = 0.05;

    // Input handling
    if (game.keys['w']) {
        game.boat.speed = Math.min(game.boat.maxSpeed, game.boat.speed + acceleration);
    }
    if (game.keys['s']) {
        game.boat.speed = Math.max(-game.boat.maxSpeed/2, game.boat.speed - acceleration);
    }
    if (game.keys['a'] && Math.abs(game.boat.speed) > 0.5) {
        game.boat.angle -= turnSpeed * (game.boat.speed / game.boat.maxSpeed);
    }
    if (game.keys['d'] && Math.abs(game.boat.speed) > 0.5) {
        game.boat.angle += turnSpeed * (game.boat.speed / game.boat.maxSpeed);
    }

    // Apply friction
    game.boat.speed *= friction;

    // Move boat
    game.boat.x += Math.cos(game.boat.angle) * game.boat.speed;
    game.boat.y += Math.sin(game.boat.angle) * game.boat.speed;

    // Boundary wrapping
    if (game.boat.x < -50) game.boat.x = game.canvas.width + 50;
    if (game.boat.x > game.canvas.width + 50) game.boat.x = -50;
    if (game.boat.y < -50) game.boat.y = game.canvas.height + 50;
    if (game.boat.y > game.canvas.height + 50) game.boat.y = -50;

    // Update UI
    updateUI();
}

function updateUI() {
    document.getElementById('lat').textContent = Math.round(game.boat.y) + '°N';
    document.getElementById('lon').textContent = Math.round(game.boat.x) + '°E';
    document.getElementById('speed').textContent = (game.boat.speed * 2).toFixed(1);
    
    const depth = Math.max(10, Math.min(200, 
        game.nearestIsland ? 
        Math.hypot(game.boat.x - game.nearestIsland.x, game.boat.y - game.nearestIsland.y) - 50 : 
        150
    ));
    document.getElementById('depth').textContent = Math.round(depth);
    
    document.getElementById('projectCount').textContent = game.projects.size;
}

// Island popup functions
function showIslandPopup(island) {
    const popup = document.getElementById('islandPopup');
    document.getElementById('popupTitle').textContent = island.name;
    document.getElementById('popupDescription').textContent = island.description;
    
    popup.style.left = island.x + 'px';
    popup.style.top = (island.y - island.size - 20) + 'px';
    popup.classList.add('visible');
    
    game.currentIslandId = island.id;
}

function hideIslandPopup() {
    document.getElementById('islandPopup').classList.remove('visible');
    game.currentIslandId = null;
}

function launchProject() {
    const island = game.islands.find(i => i.id === game.currentIslandId);
    if (island && island.hasProject) {
        showProjectModal(island);
    } else {
        alert('No project deployed to this island yet. Upload a project first!');
    }
    hideIslandPopup();
}

function uploadToIsland() {
    hideIslandPopup();
    showUploadModal();
}

function editIsland() {
    alert('Island configuration coming soon!');
    hideIslandPopup();
}

// Modal functions
function showUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('fileInput').value = '';
}

function showProjectModal(island) {
    const modal = document.getElementById('projectModal');
    const frame = document.getElementById('projectFrame');
    document.getElementById('modalTitle').textContent = island.name;
    
    if (island.projectData) {
        const blob = new Blob([island.projectData.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        frame.src = url;
    }
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('projectModal').classList.remove('active');
    document.getElementById('projectFrame').src = 'about:blank';
}

// File upload functions
function handleFiles(files) {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    Array.from(files).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">${getFileIcon(file.name)}</div>
                <div>
                    <div>${file.name}</div>
                    <div style="font-size: 12px; color: #94a3b8;">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="popup-button secondary" onclick="removeFile('${file.name}')">Remove</button>
        `;
        fileList.appendChild(fileItem);
    });

    window.uploadFiles = files;
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'html': '🌐',
        'css': '🎨',
        'js': '⚡',
        'json': '📋',
        'md': '📝',
        'txt': '📄'
    };
    return icons[ext] || '📄';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function removeFile(filename) {
    console.log('Remove file:', filename);
}

async function processUpload() {
    if (!window.uploadFiles || !game.currentIslandId) {
        alert('Please select files and choose an island first!');
        return;
    }

    document.getElementById('loadingOverlay').style.display = 'block';

    try {
        const projectData = await processProjectFiles(window.uploadFiles);
        const island = game.islands.find(i => i.id === game.currentIslandId);
        
        if (island) {
            island.hasProject = true;
            island.projectData = projectData;
            game.projects.set(island.id, projectData);
        }

        setTimeout(() => {
            document.getElementById('loadingOverlay').style.display = 'none';
            closeUploadModal();
            alert('Project deployed successfully! 🚀');
        }, 1500);

    } catch (error) {
        document.getElementById('loadingOverlay').style.display = 'none';
        alert('Error processing project: ' + error.message);
    }
}

async function processProjectFiles(files) {
    const projectData = {
        html: '',
        css: '',
        js: '',
        assets: {}
    };

    for (const file of files) {
        const content = await readFileContent(file);
        const ext = file.name.split('.').pop().toLowerCase();

        switch (ext) {
            case 'html':
                projectData.html = content;
                break;
            case 'css':
                projectData.css += content + '\n';
                break;
            case 'js':
                projectData.js += content + '\n';
                break;
            default:
                projectData.assets[file.name] = content;
        }
    }

    // If no HTML file, create a basic one
    if (!projectData.html) {
        projectData.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Project</title>
                <style>${projectData.css}</style>
            </head>
            <body>
                <h1>Your Project</h1>
                <p>This is your deployed project!</p>
                <script>${projectData.js}</script>
            </body>
            </html>
        `;
    } else {
        // Inject CSS and JS into existing HTML
        if (projectData.css) {
            projectData.html = projectData.html.replace(
                '</head>',
                `<style>${projectData.css}</style></head>`
            );
        }
        if (projectData.js) {
            projectData.html = projectData.html.replace(
                '</body>',
                `<script>${projectData.js}</script></body>`
            );
        }
    }

    return projectData;
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Game loop
function gameLoop() {
    game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    
    drawWater();
    drawIslands();
    drawBoat();
    updateBoat();
    
    requestAnimationFrame(gameLoop);
}

// Start the game
init();