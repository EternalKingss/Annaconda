// Game state management
window.gameState = {
    canvas: null,
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
    particles: [],
    projects: new Map(),
    currentIslandId: null,
    
    // Initialize game state
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Bind resize event
        window.addEventListener('resize', () => this.resizeCanvas());
    },
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    update() {
        this.time = Date.now() * 0.001;
    }
};