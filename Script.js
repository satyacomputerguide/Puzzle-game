const WIDTH = 10;
const HEIGHT = 20;
const SHAPES = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
const COLORS = {
    'I': '#00f0f0', 'O': '#f0f000', 'T': '#a000f0',
    'L': '#f0a000', 'J': '#0000f0', 'S': '#00f000',
    'Z': '#f00000'
};

class BlockGame {
    constructor() {
        this.grid = Array(HEIGHT).fill().map(() => Array(WIDTH).fill(null));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.initGrid();
        this.spawnPiece();
        this.setupControls();
        this.gameLoop();
        this.lastFrame = performance.now();
        this.deltaTime = 0;
    }

    initGrid() {
        const grid = document.getElementById('game-grid');
        grid.innerHTML = '';
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                grid.appendChild(cell);
            }
        }
    }

    createPiece() {
        const type = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        return {
            shape: this.getShape(type),
            color: COLORS[type],
            x: Math.floor(WIDTH/2) - 2,
            y: 0
        };
    }

    getShape(type) {
        const shapes = {
            'I': [[1,1,1,1]],
            'O': [[1,1],[1,1]],
            'T': [[0,1,0],[1,1,1]],
            'L': [[1,0],[1,0],[1,1]],
            'J': [[0,1],[0,1],[1,1]],
            'S': [[0,1,1],[1,1,0]],
            'Z': [[1,1,0],[0,1,1]]
        };
        return shapes[type];
    }

    spawnPiece() {
        this.currentPiece = this.createPiece();
        if (this.checkCollision(0, 0)) {
            this.gameOver = true;
            alert(`Game Over! Score: ${this.score}`);
        }
    }

    updateGrid() {
        document.querySelectorAll('.cell').forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            cell.style.backgroundColor = this.grid[y][x] || '#2c3e50';
        });

        this.currentPiece.shape.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (cell) {
                    const x = this.currentPiece.x + dx;
                    const y = this.currentPiece.y + dy;
                    if (y >= 0 && x >= 0 && x < WIDTH) {
                        const cellElem = document.querySelector(
                            `[data-x="${x}"][data-y="${y}"]`
                        );
                        if (cellElem) {
                            cellElem.style.backgroundColor = this.currentPiece.color;
                        }
                    }
                }
            });
        });
    }

    checkCollision(dx, dy) {
        return this.currentPiece.shape.some((row, y) =>
            row.some((cell, x) => {
                if (!cell) return false;
                const nx = this.currentPiece.x + x + dx;
                const ny = this.currentPiece.y + y + dy;
                return nx < 0 || nx >= WIDTH || ny >= HEIGHT || 
                       (ny >= 0 && this.grid[ny][nx]);
            })
        );
    }

    lockPiece() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const gy = this.currentPiece.y + y;
                    const gx = this.currentPiece.x + x;
                    if (gy >= 0) this.grid[gy][gx] = this.currentPiece.color;
                }
            });
        });
        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = HEIGHT - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(WIDTH).fill(null));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.score / 1000) + 1;
            document.getElementById('score').textContent = this.score;
            document.getElementById('level').textContent = this.level;
        }
    }

    setupControls() {
        const controls = {
            left: () => { if (!this.checkCollision(-1, 0)) this.currentPiece.x-- },
            right: () => { if (!this.checkCollision(1, 0)) this.currentPiece.x++ },
            down: () => { if (!this.checkCollision(0, 1)) this.currentPiece.y++ },
            rotate: () => {
                const rotated = this.currentPiece.shape[0]
                    .map((_, i) => this.currentPiece.shape
                    .map(row => row[i]).reverse());
                const original = this.currentPiece.shape;
                this.currentPiece.shape = rotated;
                if (this.checkCollision(0, 0)) {
                    this.currentPiece.shape = original;
                }
            },
            hardDrop: () => {
                while (!this.checkCollision(0, 1)) {
                    this.currentPiece.y++;
                }
                this.lockPiece();
            }
        };

        ['left', 'right', 'down', 'rotate'].forEach(action => {
            document.getElementById(`${action}-btn`).addEventListener(
                'mousedown', controls[action]);
            document.getElementById(`${action}-btn`).addEventListener(
                'touchstart', (e) => {
                    e.preventDefault();
                    controls[action]();
                });
        });

        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            switch(e.key) {
                case 'ArrowLeft': controls.left(); break;
                case 'ArrowRight': controls.right(); break;
                case 'ArrowDown': controls.down(); break;
                case 'ArrowUp': controls.rotate(); break;
                case ' ': controls.hardDrop(); break;
            }
        });

        let touchStart = null;
        document.addEventListener('touchstart', e => {
            touchStart = e.touches[0].clientX;
        }, {passive: true});

        document.addEventListener('touchend', e => {
            if (!touchStart) return;
            const touchEnd = e.changedTouches[0].clientX;
            const diff = touchEnd - touchStart;
            if (Math.abs(diff) > 50) {
                diff > 0 ? controls.right() : controls.left();
            }
            touchStart = null;
        });
    }

    gameLoop(currentTime) {
        if (this.gameOver) return;

        this.deltaTime += currentTime - this.lastFrame;
        this.lastFrame = currentTime;

        if (this.deltaTime > 1000 / this.level) {
            if (!this.checkCollision(0, 1)) {
                this.currentPiece.y++;
            } else {
                this.lockPiece();
            }
            this.deltaTime = 0;
        }

        this.updateGrid();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

new BlockGame();
