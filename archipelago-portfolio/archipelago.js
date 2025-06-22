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
        
        // Project indicator
        if (island.hasProject) {
            const pulse = 0.8 + Math.sin(game.time * 3) * 0.2;
            ctx.fillStyle = `rgba(96, 165, 250, ${pulse})`;
            ctx.beginPath();
            ctx.arc(island.x, island.y - island.size - 20, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🚀', island.x, island.y - island.size - 15);
        }
        
        // Island name with natural styling
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(island.name, island.x, island.y + island.size + 25);
        ctx.fillText(island.name, island.x, island.y + island.size + 25);
        
        // Interaction indicator
        if (distance < island.size + 60) {
            game.nearestIsland = island;
            
            // Glowing dock area
            const pulse = 0.3 + Math.sin(game.time * 4) * 0.2;
            ctx.strokeStyle = `rgba(96, 165, 250, ${pulse})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.arc(island.x, island.y, island.size + 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Dock indicator
            ctx.fillStyle = '#60a5fa';
            ctx.font = 'bold 12px Inter';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText('Press E to dock', island.x, island.y - island.size - 40);
            ctx.fillText('Press E to dock', island.x, island.y - island.size - 40);
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
    document.getElementById('speed').textContent = (game.boat.speed * 2).toFixed(1);
    
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
    
    game.currentIslandId = island.id;
}

// Hide popup
function hideIslandPopup() {
    document.getElementById('islandPopup').classList.remove('visible');
    game.currentIslandId = null;
}

// Launch project
function launchProject() {
    const island = islands.find(i => i.id === game.currentIslandId);
    if (island && island.hasProject) {
        showProjectModal(island);
    } else {
        alert('No project deployed to this island yet. Upload a project first!');
    }
    hideIslandPopup();
}

// Upload to island
function uploadToIsland() {
    hideIslandPopup();
    showUploadModal();
}

// Modal functions
function showUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    
    // Reset form
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInputSingle').value = '';
    document.getElementById('fileExplorer').style.display = 'none';
    document.getElementById('deploySection').style.display = 'none';
    currentProjectFS = null;
}

function showProjectModal(island) {
    const modal = document.getElementById('projectModal');
    const frame = document.getElementById('projectFrame');
    document.getElementById('modalTitle').textContent = island.name;
    
    if (island.projectData) {
        // Create blob URL for the project
        const blob = new Blob([island.projectData.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        frame.src = url;
        
        // Store URL for cleanup
        frame.dataset.blobUrl = url;
    }
    
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('projectModal');
    const frame = document.getElementById('projectFrame');
    
    // Cleanup blob URL
    if (frame.dataset.blobUrl) {
        URL.revokeObjectURL(frame.dataset.blobUrl);
        delete frame.dataset.blobUrl;
    }
    
    frame.src = 'about:blank';
    modal.classList.remove('active');
}

function openInNewWindow() {
    const frame = document.getElementById('projectFrame');
    if (frame.src && frame.src !== 'about:blank') {
        window.open(frame.src, '_blank');
    }
}

function downloadProject() {
    const island = islands.find(i => i.id === game.currentIslandId);
    if (island && island.projectData) {
        const blob = new Blob([island.projectData.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${island.name.replace(/\s+/g, '_')}_project.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
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

// Initialize project count
updateProjectCount();

// Start the game
gameLoop();