document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const gameMessage = document.querySelector('.game-message');
    const scoreDisplay = document.getElementById('score-display');
    const highScoreDisplay = document.getElementById('high-score-display');

    // Set canvas dimensions
    canvas.width = 320;
    canvas.height = 480;

    // Game variables
    let frames = 0;
    let score = 0;
    let highScore = localStorage.getItem('flappyBirdHighScore') || 0;
    let gameState = 'start'; // start, playing, over
    
    // Bird object
    const bird = {
        x: 50,
        y: 150,
        width: 34,
        height: 24,
        gravity: 0.5,
        velocity: 0,
        jump: 7,
        rotation: 0,
        
        draw: function() {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.rotation);
            
            // Draw bird body
            ctx.fillStyle = '#f8e71c'; // Yellow color
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw bird eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.width/4, -this.height/6, this.width/10, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw bird pupil
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(this.width/4 + 1, -this.height/6, this.width/20, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw bird beak
            ctx.fillStyle = '#ff6b6b'; // Red color
            ctx.beginPath();
            ctx.moveTo(this.width/2, 0);
            ctx.lineTo(this.width/2 + 10, -5);
            ctx.lineTo(this.width/2 + 10, 5);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        },
        
        flap: function() {
            this.velocity = -this.jump;
            this.rotation = -0.5; // Rotate up when flapping
        },
        
        update: function() {
            // If the game state is start, the bird just hovers
            if(gameState === "start") {
                this.y = 150 + Math.sin(frames/10) * 5;
                return;
            }
            
            // Bird rotation
            if(this.velocity < 0) {
                this.rotation = -0.5; // Point up when rising
            } else {
                this.rotation = Math.min(this.velocity * 0.05, Math.PI/2); // Point down when falling
            }
            
            // Bird movement with gravity
            this.velocity += this.gravity;
            this.y += this.velocity;
            
            // Bottom boundary
            if(this.y + this.height >= canvas.height - foreground.height) {
                this.y = canvas.height - foreground.height - this.height;
                if(gameState === "playing") {
                    gameState = "over";
                    gameMessage.style.display = "block";
                    gameMessage.querySelector('p').textContent = "Game Over! Press Space to Restart";
                }
            }
            
            // Top boundary
            if(this.y <= 0) {
                this.y = 0;
            }
        }
    };
    
    // Background object
    const background = {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height - 112,
        
        draw: function() {
            // Draw sky gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#70c5ce');
            gradient.addColorStop(1, '#b3e0e5');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw clouds
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(80, 80, 30, 0, Math.PI * 2);
            ctx.arc(120, 70, 40, 0, Math.PI * 2);
            ctx.arc(160, 85, 25, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(220, 120, 35, 0, Math.PI * 2);
            ctx.arc(260, 110, 45, 0, Math.PI * 2);
            ctx.arc(300, 125, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    };
    
    // Foreground object (ground)
    const foreground = {
        x: 0,
        y: canvas.height - 112,
        width: canvas.width,
        height: 112,
        dx: 2,
        
        draw: function() {
            // Draw ground
            ctx.fillStyle = '#ded895'; // Tan color for ground
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw grass on top of ground
            ctx.fillStyle = '#33a357'; // Green color for grass
            ctx.fillRect(this.x, this.y, this.width, 15);
            
            // Draw stripe pattern for ground
            ctx.fillStyle = '#c9b27d';
            for(let i = 0; i < canvas.width/20; i++) {
                ctx.fillRect(i * 20, this.y + 30, 10, 60);
            }
        },
        
        update: function() {
            if(gameState !== "playing") return;
            
            this.x = (this.x - this.dx) % (this.width);
        }
    };
    
    // Pipes
    const pipes = {
        position: [],
        width: 53,
        height: 400,
        gap: 130,
        maxYPos: -150,
        dx: 2,
        
        draw: function() {
            for(let i = 0; i < this.position.length; i++) {
                let p = this.position[i];
                
                let topYPos = p.y;
                let bottomYPos = p.y + this.height + this.gap;
                
                // Top pipe
                ctx.fillStyle = '#73bf2e'; // Green color for pipes
                ctx.fillRect(p.x, topYPos, this.width, this.height);
                
                // Bottom pipe
                ctx.fillRect(p.x, bottomYPos, this.width, this.height);
                
                // Pipe caps
                ctx.fillStyle = '#588c22'; // Darker green for pipe caps
                ctx.fillRect(p.x - 2, topYPos + this.height - 30, this.width + 4, 30);
                ctx.fillRect(p.x - 2, bottomYPos, this.width + 4, 30);
            }
        },
        
        update: function() {
            if(gameState !== "playing") return;
            
            // Add new pipe every 100 frames
            if(frames % 100 === 0) {
                this.position.push({
                    x: canvas.width,
                    y: this.maxYPos * (Math.random() + 1)
                });
            }
            
            // Loop through each pipe
            for(let i = 0; i < this.position.length; i++) {
                let p = this.position[i];
                
                // Move the pipe to the left
                p.x -= this.dx;
                
                // If pipe moves past the left edge of canvas, remove it
                if(p.x + this.width <= 0) {
                    this.position.shift();
                    // Add score when pipe passes
                    score++;
                    scoreDisplay.textContent = score;
                    
                    // Update high score
                    if(score > highScore) {
                        highScore = score;
                        localStorage.setItem('flappyBirdHighScore', highScore);
                        highScoreDisplay.textContent = highScore;
                    }
                }
                
                // Collision detection
                if(
                    bird.x + bird.width > p.x && 
                    bird.x < p.x + this.width && 
                    (
                        bird.y < p.y + this.height || 
                        bird.y + bird.height > p.y + this.height + this.gap
                    )
                ) {
                    gameState = "over";
                    gameMessage.style.display = "block";
                    gameMessage.querySelector('p').textContent = "Game Over! Press Space to Restart";
                }
            }
        }
    };
    
    // Draw all elements
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        background.draw();
        pipes.draw();
        foreground.draw();
        bird.draw();
        
        // Display score in game
        if(gameState === "playing") {
            ctx.fillStyle = "white";
            ctx.font = "bold 30px Arial";
            ctx.fillText(score, canvas.width/2 - 15, 50);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.strokeText(score, canvas.width/2 - 15, 50);
        }
    }
    
    // Update game elements
    function update() {
        bird.update();
        foreground.update();
        pipes.update();
    }
    
    // Game loop
    function loop() {
        update();
        draw();
        frames++;
        requestAnimationFrame(loop);
    }
    
    // Initialize high score
    highScoreDisplay.textContent = highScore;
    
    // Start the game
    loop();
    
    // Event Listeners
    document.addEventListener('keydown', function(e) {
        if(e.code === 'Space') {
            switch(gameState) {
                case "start":
                    gameState = "playing";
                    gameMessage.style.display = "none";
                    break;
                case "playing":
                    bird.flap();
                    break;
                case "over":
                    // Reset game
                    gameState = "start";
                    pipes.position = [];
                    score = 0;
                    scoreDisplay.textContent = score;
                    bird.velocity = 0;
                    bird.y = 150;
                    gameMessage.querySelector('p').textContent = "Press Space to Start";
                    break;
            }
        }
    });
    
    // Mobile support
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        
        switch(gameState) {
            case "start":
                gameState = "playing";
                gameMessage.style.display = "none";
                break;
            case "playing":
                bird.flap();
                break;
            case "over":
                // Reset game
                gameState = "start";
                pipes.position = [];
                score = 0;
                scoreDisplay.textContent = score;
                bird.velocity = 0;
                bird.y = 150;
                gameMessage.querySelector('p').textContent = "Press Space to Start";
                break;
        }
    });
});