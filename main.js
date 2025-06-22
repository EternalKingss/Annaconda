const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const game = {
    boat: { x: canvas.width/2, y: canvas.height/2, angle: 0, speed: 0 },
    keys: {},
    islands: [],
    nearestIsland: null,
    currentIsland: null,
    time: 0
};

const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];

function detectProjectType(files) {
    const detection = {
        type: 'Unknown',
        mainFile: null,
        confidence: 0,
        reason: '',
        runnable: false
    };
    
    // Check for HTML project
    const indexHtml = files.find(f => f.name === 'index.html');
    if (indexHtml) {
        detection.type = 'Web Application';
        detection.mainFile = indexHtml;
        detection.confidence = 95;
        detection.runnable = true;
        detection.reason = 'Found index.html - web entry point';
        return detection;
    }
    
    const htmlFiles = files.filter(f => f.name.endsWith('.html'));
    if (htmlFiles.length > 0) {
        detection.type = 'Web Application';
        detection.mainFile = htmlFiles[0];
        detection.confidence = 80;
        detection.runnable = true;
        detection.reason = 'Found HTML file: ' + htmlFiles[0].name;
        return detection;
    }
    
    // Check for Python project
    const pythonFiles = files.filter(f => f.name.endsWith('.py'));
    if (pythonFiles.length > 0) {
        detection.type = 'Python Project';
        detection.confidence = 85;
        
        // Look for main.py
        let mainPy = files.find(f => f.name === 'main.py');
        if (mainPy) {
            detection.mainFile = mainPy;
            detection.runnable = true;
            detection.reason = 'Found main.py - Python entry point';
            detection.confidence = 95;
            return detection;
        }
        
        // Look for app.py
        let appPy = files.find(f => f.name === 'app.py');
        if (appPy) {
            detection.mainFile = appPy;
            detection.runnable = true;
            detection.reason = 'Found app.py - Flask/Django entry';
            detection.confidence = 92;
            return detection;
        }
        
        // Look for run.py
        let runPy = files.find(f => f.name === 'run.py');
        if (runPy) {
            detection.mainFile = runPy;
            detection.runnable = true;
            detection.reason = 'Found run.py - execution script';
            detection.confidence = 90;
            return detection;
        }
        
        // Look for files with main execution block
        for (const file of pythonFiles) {
            if (file.content.includes("if __name__ == '__main__':") || 
                file.content.includes('if __name__ == "__main__":')) {
                detection.mainFile = file;
                detection.runnable = true;
                detection.reason = file.name + ' has main execution block';
                detection.confidence = 88;
                return detection;
            }
        }
        
        // Check for Flask/Django
        for (const file of pythonFiles) {
            if (file.content.includes('Flask') || file.content.includes('from flask')) {
                detection.mainFile = file;
                detection.runnable = true;
                detection.reason = 'Flask app detected in ' + file.name;
                detection.confidence = 92;
                return detection;
            }
        }
        
        // Use largest Python file
        const largestPy = pythonFiles.reduce((largest, current) =>
            current.size > largest.size ? current : largest
        );
        detection.mainFile = largestPy;
        detection.runnable = true;
        detection.reason = 'Largest Python file: ' + largestPy.name;
        detection.confidence = 60;
        return detection;
    }
    
    // Check for JavaScript
    const jsFiles = files.filter(f => f.name.endsWith('.js'));
    if (jsFiles.length > 0) {
        detection.type = 'JavaScript Project';

        let serverJs = files.find(f => f.name === 'server.js');
        if (serverJs) {
            detection.mainFile = serverJs;
            detection.runnable = true;
            detection.reason = 'Found server.js - Node.js server';
            detection.confidence = 90;
            return detection;
        }

        let indexJs = files.find(f => f.name === 'index.js');
        if (indexJs) {
            detection.mainFile = indexJs;
            detection.runnable = true;
            detection.reason = 'Found index.js - main entry';
            detection.confidence = 85;
            return detection;
        }

        // Fallback to first JavaScript file
        detection.mainFile = jsFiles[0];
        detection.runnable = true;
        detection.reason = 'Using first JavaScript file: ' + jsFiles[0].name;
        detection.confidence = 60;
        return detection;
    }
    
    // Check for README
    const readmeFile = files.find(f => 
        f.name.toLowerCase().includes('readme')
    );
    if (readmeFile) {
        detection.type = 'Documentation';
        detection.mainFile = readmeFile;
        detection.runnable = true;
        detection.reason = 'Documentation: ' + readmeFile.name;
        detection.confidence = 70;
        return detection;
    }
    
    // Default
    if (files.length > 0) {
        detection.mainFile = files[0];
        detection.reason = 'No clear entry found, showing ' + files[0].name;
        detection.confidence = 20;
    }
    
    return detection;
}

document.addEventListener('keydown', e => {
    game.keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'e' && game.nearestIsland) showPopup(game.nearestIsland);
    if (e.key.toLowerCase() === 'u') document.getElementById('folderInput').click();
});
document.addEventListener('keyup', e => game.keys[e.key.toLowerCase()] = false);

function uploadFolder() { document.getElementById('folderInput').click(); }
function uploadFiles() { document.getElementById('fileInput').click(); }

document.getElementById('folderInput').addEventListener('change', handleUpload);
document.getElementById('fileInput').addEventListener('change', handleUpload);

const uploadZone = document.getElementById('uploadZone');
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.background = 'rgba(0,255,255,0.2)'; });
uploadZone.addEventListener('dragleave', () => uploadZone.style.background = 'rgba(0,0,0,0.8)');
uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.style.background = 'rgba(0,0,0,0.8)';
    handleUpload({target: {files: e.dataTransfer.files}});
});

async function handleUpload(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    
    const fileData = [];
    for (const file of files) {
        try {
            const content = await readFile(file);
            fileData.push({
                name: file.name,
                path: file.webkitRelativePath || file.name,
                content: content,
                size: file.size
            });
        } catch (error) {
            console.warn('Failed to read:', file.name);
        }
    }
    
    let projectName = 'Project';
    if (files[0].webkitRelativePath) {
        projectName = files[0].webkitRelativePath.split('/')[0];
    }
    
    const detection = detectProjectType(fileData);
    
    const island = {
        id: Date.now(),
        x: 200 + Math.random() * (canvas.width - 400),
        y: 200 + Math.random() * (canvas.height - 400),
        size: 60 + Math.random() * 40,
        name: projectName,
        description: files.length + ' files • ' + detection.type,
        color: colors[game.islands.length % colors.length],
        files: fileData,
        detection: detection
    };
    
    game.islands.forEach(existing => {
        const dist = Math.hypot(island.x - existing.x, island.y - existing.y);
        if (dist < 200) {
            island.x = existing.x + 250;
            island.y = existing.y + 100;
        }
    });
    
    game.islands.push(island);
    updateUI();
    hideUploadZone();
    
    alert('Island created: ' + projectName + '\nDetected: ' + detection.reason + '\nConfidence: ' + detection.confidence + '%');
}

function readFile(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => resolve('[Binary file: ' + file.name + ']');
        reader.readAsText(file);
    });
}

function updateUI() {
    document.getElementById('count').textContent = game.islands.length;
}

function hideUploadZone() {
    if (game.islands.length > 0) {
        document.getElementById('uploadZone').style.display = 'none';
    }
}

function showPopup(island) {
    const popup = document.getElementById('popup');
    document.getElementById('popupTitle').textContent = island.name;
    document.getElementById('popupDesc').textContent = island.description;
    
    const detection = island.detection;
    document.getElementById('detectionInfo').innerHTML = 
        '<strong>Detection:</strong><br>' +
        'Type: ' + detection.type + '<br>' +
        'Main File: ' + (detection.mainFile ? detection.mainFile.name : 'None') + '<br>' +
        'Confidence: ' + detection.confidence + '%<br>' +
        '<small>' + detection.reason + '</small>';
    
    popup.style.left = island.x + 'px';
    popup.style.top = (island.y - 150) + 'px';
    popup.classList.add('visible');
    game.currentIsland = island;
}

function hidePopup() {
    document.getElementById('popup').classList.remove('visible');
    game.currentIsland = null;
}

function launchProject() {
    if (!game.currentIsland) return;
    
    const island = game.currentIsland;
    const detection = island.detection;
    
    if (!detection.mainFile) {
        alert('No runnable file detected!');
        return;
    }
    
    let content = '';
    
    if (detection.mainFile.name.endsWith('.html')) {
        content = detection.mainFile.content;
    } else if (detection.mainFile.name.endsWith('.js')) {
        content = `<!DOCTYPE html>
<html><head><title>${island.name}</title></head>
<body>
<script>${detection.mainFile.content.replace(/<\/(script)/gi, '<\\/$1')}</script>
</body></html>`;
    } else if (detection.mainFile.name.endsWith('.py')) {
        const py = detection.mainFile.content.replace(/`/g, '\\`');
        content = `<!DOCTYPE html>
<html><head><title>${island.name}</title>
<script src="https://cdn.jsdelivr.net/pyodide/v0.23.2/full/pyodide.js"></script>
</head><body>
<pre id="output"></pre>
<script>
async function run(){
  let pyodide = await loadPyodide();
  try {
    let result = await pyodide.runPythonAsync(`${py}`);
    if (result !== undefined) document.getElementById('output').textContent = result.toString();
  } catch(e) {
    document.getElementById('output').textContent = e;
  }
}
run();
</script>
</body></html>`;
    } else {
        const escapeHtml = (text) => {
            return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        content = `
<!DOCTYPE html>
<html><head><title>${island.name}</title>
<style>
body { font-family: monospace; margin: 20px; background: #1e1e1e; color: #fff; }
.header { background: #333; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
.code { background: #2d2d2d; padding: 20px; border-radius: 10px; white-space: pre-wrap; }
.stats { display: flex; gap: 20px; margin: 20px 0; }
.stat { background: #444; padding: 15px; border-radius: 5px; text-align: center; }
</style>
</head><body>
<div class="header">
<h1>${island.name}</h1>
<h2>${detection.type}</h2>
</div>
<div class="stats">
<div class="stat"><strong>${island.files.length}</strong><br>Files</div>
<div class="stat"><strong>${(island.files.reduce((s,f)=>s+f.size,0)/1024/1024).toFixed(1)}MB</strong><br>Size</div>
<div class="stat"><strong>${detection.confidence}%</strong><br>Confidence</div>
</div>
<h3>Main File: ${detection.mainFile.name}</h3>
<div class="code">${escapeHtml(detection.mainFile.content)}</div>
</body></html>`;
    }
    
    const modal = document.getElementById('projectModal');
    const frame = document.getElementById('projectFrame');
    document.getElementById('modalTitle').textContent = island.name;
    
    const blob = new Blob([content], {type: 'text/html'});
    frame.src = URL.createObjectURL(blob);
    modal.classList.add('active');
    
    hidePopup();
}

function closeModal() {
    document.getElementById('projectModal').classList.remove('active');
    document.getElementById('projectFrame').src = '';
}

function drawWater() {
    game.time = Date.now() * 0.001;
    
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height));
    gradient.addColorStop(0, '#4682b4');
    gradient.addColorStop(1, '#001122');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < 3; i++) {
        const y = canvas.height/4 * (i+1) + Math.sin(game.time + i) * 20;
        ctx.strokeStyle = 'rgba(135,206,235,' + (0.1 + Math.sin(game.time + i) * 0.05) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 10) {
            const wave = Math.sin(x * 0.01 + game.time + i) * 10;
            if (x === 0) ctx.moveTo(x, y + wave);
            else ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
    }
}

function drawIslands() {
    game.nearestIsland = null;
    let minDist = Infinity;
    
    game.islands.forEach(island => {
        const dist = Math.hypot(game.boat.x - island.x, game.boat.y - island.y);
        if (dist < minDist && dist < island.size + 80) {
            minDist = dist;
            game.nearestIsland = island;
        }
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(island.x + 3, island.y + 3, island.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = island.color;
        ctx.beginPath();
        ctx.arc(island.x, island.y, island.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f4a460';
        ctx.beginPath();
        ctx.arc(island.x, island.y, island.size + 5, 0, Math.PI * 2);
        ctx.fill();
        
        const confidence = island.detection ? island.detection.confidence : 0;
        const pulse = 0.8 + Math.sin(game.time * 3) * 0.2;
        const color = confidence > 80 ? '0,255,0' : confidence > 50 ? '255,255,0' : '255,100,100';
        ctx.fillStyle = 'rgba(' + color + ',' + pulse + ')';
        ctx.beginPath();
        ctx.arc(island.x, island.y - island.size - 15, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(confidence + '%', island.x, island.y - island.size - 25);
        ctx.fillText(confidence + '%', island.x, island.y - island.size - 25);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(island.name, island.x, island.y + island.size + 20);
        ctx.fillText(island.name, island.x, island.y + island.size + 20);
        
        if (game.nearestIsland === island) {
            ctx.strokeStyle = 'rgba(0,255,255,' + (0.5 + Math.sin(game.time * 4) * 0.3) + ')';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.arc(island.x, island.y, island.size + 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 12px Arial';
            ctx.strokeText('Press E to visit', island.x, island.y - island.size - 40);
            ctx.fillText('Press E to visit', island.x, island.y - island.size - 40);
        }
    });
}

function drawBoat() {
    const bob = Math.sin(game.time * 2) * 2;
    
    ctx.save();
    ctx.translate(game.boat.x, game.boat.y + bob);
    ctx.rotate(game.boat.angle);
    
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-12, -6, 24, 12);
    
    ctx.fillStyle = '#daa520';
    ctx.fillRect(-10, -4, 20, 8);
    
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -25);
    ctx.stroke();
    
    if (game.boat.speed > 0.5) {
        ctx.fillStyle = '#f5f5dc';
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(15, -20);
        ctx.lineTo(15, -10);
        ctx.lineTo(0, -6);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.restore();
}

function updateBoat() {
    if (game.keys['w']) game.boat.speed = Math.min(4, game.boat.speed + 0.15);
    if (game.keys['s']) game.boat.speed = Math.max(-2, game.boat.speed - 0.15);
    if (game.keys['a'] && Math.abs(game.boat.speed) > 0.5) game.boat.angle -= 0.04;
    if (game.keys['d'] && Math.abs(game.boat.speed) > 0.5) game.boat.angle += 0.04;
    
    game.boat.speed *= 0.98;
    
    game.boat.x += Math.cos(game.boat.angle) * game.boat.speed;
    game.boat.y += Math.sin(game.boat.angle) * game.boat.speed;
    
    if (game.boat.x < -50) game.boat.x = canvas.width + 50;
    if (game.boat.x > canvas.width + 50) game.boat.x = -50;
    if (game.boat.y < -50) game.boat.y = canvas.height + 50;
    if (game.boat.y > canvas.height + 50) game.boat.y = -50;
    
    document.getElementById('lat').textContent = Math.round(game.boat.y);
    document.getElementById('lon').textContent = Math.round(game.boat.x);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWater();
    drawIslands();
    drawBoat();
    updateBoat();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('click', e => {
    if (!document.getElementById('popup').contains(e.target)) hidePopup();
    if (e.target.classList.contains('modal')) closeModal();
});

updateUI();
gameLoop();


