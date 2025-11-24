class AudioController {
    constructor() {
        this.sounds = {
            drop: new Audio('assets/drop.wav'),
            error: new Audio('assets/error.wav'),
            gameover: new Audio('assets/gameover.wav')
        };
        // Preload
        for (let key in this.sounds) {
            this.sounds[key].load();
            this.sounds[key].volume = 0.6;
        }
    }

    play(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log("Audio play failed", e));
        }
    }
}

class Block {
    constructor(x, y, width, depth, color, moveSpeed, direction) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.depth = depth; // Height of the block visually
        this.color = color;
        this.moveSpeed = moveSpeed;
        this.direction = direction; // 1 or -1
        this.stopped = false;
    }

    update(canvasWidth) {
        if (this.stopped) return;

        this.x += this.moveSpeed * this.direction;

        if (this.x + this.width > canvasWidth) {
            this.direction = -1;
        } else if (this.x < 0) {
            this.direction = 1;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        // Simple 3D effect
        ctx.fillRect(this.x, this.y, this.width, this.depth);

        // Top highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(this.x, this.y, this.width, this.depth * 0.2);

        // Side shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(this.x + this.width - 5, this.y, 5, this.depth);
    }
}

class Particle {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vy = 0;
        this.gravity = 0.5;
        this.alpha = 1;
    }

    update() {
        this.vy += this.gravity;
        this.y += this.vy;
        this.alpha -= 0.02;
    }

    draw(ctx) {
        if (this.alpha <= 0) return;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.globalAlpha = 1;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioController();

        this.state = 'MENU'; // MENU, PLAYING, GAMEOVER
        this.score = 0;
        this.blocks = [];
        this.particles = [];
        this.currentBlock = null;
        this.baseWidth = 200;
        this.blockHeight = 30;
        this.scrollOffset = 0;
        this.speed = 3;

        this.colors = ['#ff9a9e', '#fecfef', '#a18cd1', '#fbc2eb', '#8fd3f4', '#84fab0'];

        this.ui = {
            score: document.getElementById('score'),
            startScreen: document.getElementById('start-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            finalScore: document.getElementById('final-score'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn')
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input handling
        this.handleInput = this.handleInput.bind(this);
        this.canvas.addEventListener('mousedown', this.handleInput);
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            this.handleInput();
        }, { passive: false });

        this.ui.startBtn.addEventListener('click', () => this.start());
        this.ui.restartBtn.addEventListener('click', () => this.start());

        // Start loop
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Center base if game hasn't started or just reset
        if (this.state === 'MENU') {
            this.initBase();
        }
    }

    initBase() {
        this.blocks = [];
        this.particles = [];
        this.score = 0;
        this.scrollOffset = 0;
        this.speed = 3;
        this.ui.score.innerText = 0;

        // Initial base block
        const startX = (this.canvas.width - this.baseWidth) / 2;
        const startY = this.canvas.height - 100;

        const baseBlock = new Block(startX, startY, this.baseWidth, this.blockHeight, this.colors[0], 0, 0);
        baseBlock.stopped = true;
        this.blocks.push(baseBlock);
    }

    spawnBlock() {
        const prevBlock = this.blocks[this.blocks.length - 1];
        const y = prevBlock.y - this.blockHeight;
        const color = this.colors[this.score % this.colors.length];

        // Spawn from left or right randomly
        const direction = Math.random() > 0.5 ? 1 : -1;
        const x = direction === 1 ? -prevBlock.width : this.canvas.width;

        this.currentBlock = new Block(x, y, prevBlock.width, this.blockHeight, color, this.speed, direction);
    }

    start() {
        this.state = 'PLAYING';
        this.ui.startScreen.classList.remove('active');
        this.ui.gameOverScreen.classList.remove('active');
        this.initBase();
        this.spawnBlock();
    }

    handleInput() {
        if (this.state !== 'PLAYING') return;

        if (this.currentBlock) {
            this.placeBlock();
        }
    }

    placeBlock() {
        const current = this.currentBlock;
        const prev = this.blocks[this.blocks.length - 1];

        current.stopped = true;

        const dist = current.x - prev.x;
        const overlap = prev.width - Math.abs(dist);

        if (overlap > 0) {
            // Success
            this.audio.play('drop');
            this.score++;
            this.ui.score.innerText = this.score;
            this.ui.score.classList.remove('bump');
            void this.ui.score.offsetWidth; // trigger reflow
            this.ui.score.classList.add('bump');

            // Cut the block
            if (dist > 0) {
                // Overhanging right
                current.width = overlap;
                // Create debris for the right part
                this.createDebris(current.x + current.width, current.y, dist, current.depth, current.color);
            } else {
                // Overhanging left
                current.x = prev.x; // Snap to left edge of prev
                current.width = overlap;
                // Create debris for the left part
                this.createDebris(current.x - Math.abs(dist), current.y, Math.abs(dist), current.depth, current.color);
            }

            this.blocks.push(current);

            // Increase difficulty
            this.speed += 0.1;

            // Check minimum width
            if (current.width < 10) {
                this.gameOver();
                return;
            }

            // Scroll down if needed
            if (current.y < this.canvas.height / 2) {
                this.scrollOffset += this.blockHeight;
            }

            this.spawnBlock();
        } else {
            // Missed completely
            this.createDebris(current.x, current.y, current.width, current.depth, current.color);
            this.gameOver();
        }
    }

    createDebris(x, y, width, height, color) {
        const debris = new Particle(x, y, width, height, color);
        this.particles.push(debris);
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.audio.play('gameover');
        this.ui.finalScore.innerText = this.score;
        setTimeout(() => {
            this.ui.gameOverScreen.classList.add('active');
        }, 500);
    }

    update() {
        if (this.state === 'PLAYING' && this.currentBlock) {
            this.currentBlock.update(this.canvas.width);
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].y > this.canvas.height || this.particles[i].alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Smooth scroll
        if (this.scrollOffset > 0) {
            const move = this.scrollOffset * 0.1;
            this.scrollOffset -= move;
            this.ctx.translate(0, move);

            // Keep blocks in view logic could be here, but simple translate works for now
            // We need to track total translation to reset it or just move objects?
            // Better: Move objects down
            this.blocks.forEach(b => b.y += move);
            this.particles.forEach(p => p.y += move);
            if (this.currentBlock) this.currentBlock.y += move;

            // Reset context translate because we moved objects
            this.ctx.translate(0, -move);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.blocks.forEach(block => block.draw(this.ctx));
        if (this.currentBlock) this.currentBlock.draw(this.ctx);
        this.particles.forEach(p => p.draw(this.ctx));
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

// Initialize game when DOM is ready
window.onload = () => {
    const game = new Game();
};
