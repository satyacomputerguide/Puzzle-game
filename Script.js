class BlockGame {
    constructor() {
        this.WIDTH = 10;
        this.HEIGHT = 20;
        this.SHAPES = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
        this.COLORS = {
            'I': '#00f0f0', 'O': '#f0f000', 'T': '#a000f0',
            'L': '#f0a000', 'J': '#0000f0', 'S': '#00f000',
            'Z': '#f00000'
        };
        
        this.grid = Array(this.HEIGHT).fill().map(() => Array(this.WIDTH).fill(null));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.initGame();
    }

    initGame() {
        this.createGrid();
        this.setupControls();
        this.spawnPiece();
        this.gameLoop();
    }

    createGrid() {
        const grid = document.getElementById('game-grid');
        grid.innerHTML = '';
        for (let y = 0; y < this.HEIGHT; y++) {
            for (let x = 0; x < this.WIDTH; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                grid.appendChild(cell);
            }
        }
    }

    spawnPiece() {
        const type = this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)];
        this.currentPiece = {
            shape: this.getShape(type),
            color: this.COLORS[type],
            x: Math.floor(this.WIDTH/2) - 2,
            y: 0
        };
        this.updateNextPreview();
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
                    if (y >= 0 && x >= 0 && x < this.WIDTH) {
                        const cellElem = document.querySelector(
                            `[data-x="${x}"][data-y="${y}"]`
                        );
                        if (cellElem) cellElem.style.backgroundColor = this.currentPiece.color;
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
                return nx < 0 || nx >= this.WIDTH || ny >= this.HEIGHT || 
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
        for (let y = this.HEIGHT - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.WIDTH).fill(null));
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

    updateNextPreview() {
        const preview = document.getElementById('next-preview');
        preview.innerHTML = '';
        this.currentPiece.shape.forEach(row => {
            row.forEach(cell => {
                const div = document.createElement('div');
                div.className = 'preview-cell';
                div.style.backgroundColor = cell ? this.currentPiece.color : '#2c3e50';
                preview.appendChild(div);
            });
        });
    }

    setupControls() {
        // Mobile controls
        const controls = {
            left: () => { if (!this.checkCollision(-1, 0)) this.currentPiece.x-- },
            right: () => { if (!this.checkCollision(1, 0)) this.currentPiece.x++ },
            rotate: () => {
                const rotated = this.currentPiece.shape[0]
                    .map((_, i) => this.currentPiece.shape.map(row => row[i]).reverse());
                const original = this.currentPiece.shape;
                this.currentPiece.shape = rotated;
                if (this.checkCollision(0, 0)) this.currentPiece.shape = original;
            },
            hardDrop: () => {
                while (!this.checkCollision(0, 1)) this.currentPiece.y++;
                this.lockPiece();
            }
        };

        // Button events
        document.getElementById('move-left').addEventListener('touchstart', (e) => {
            e.preventDefault();
            controls.left();
        });
        document.getElementById('move-right').addEventListener('touchstart', (e) => {
            e.preventDefault();
            controls.right();
        });
        document.getElementById('rotate-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            controls.rotate();
        });
        document.getElementById('hard-drop').addEventListener('touchstart', (e) => {
            e.preventDefault();
            controls.hardDrop();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            switch(e.key) {
                case 'ArrowLeft': controls.left(); break;
                case 'ArrowRight': controls.right(); break;
                case 'ArrowUp': controls.rotate(); break;
                case 'ArrowDown': controls.hardDrop(); break;
            }
        });

        // Swipe controls
        let touchStartX = null;
        document.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
        }, {passive: true});

        document.addEventListener('touchend', e => {
            if (!touchStartX) return;
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) > 30) {
                diff > 0 ? controls.right() : controls.left();
            }
            touchStartX = null;
        });
    }

    gameLoop() {
        if (this.gameOver) return;
        
        if (!this.checkCollision(0, 1)) {
            this.currentPiece.y++;
        } else {
            this.lockPiece();
            if (this.checkCollision(0, 0)) {
                this.gameOver = true;
                alert(`Game Over! Score: ${this.score}`);
                return;
            }
        }
        
        this.updateGrid();
        setTimeout(() => this.gameLoop(), 1000 / this.level);
    }
}

// Initialize game
new BlockGame();
