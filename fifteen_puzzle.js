/**
 * Fifteen Sliding Puzzle Engine
 * Pure Vanilla JavaScript
 */

(function() {
    let p = setup.puzzle_fifteen;
    let freeslot = [];
    let size = [];
    let m = [];
    let o;
    let f = document.getElementById("fifteen");

    // Satisfying "Muted Pop" Sound Engine
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playClickSound() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const now = audioCtx.currentTime;
        const gain = audioCtx.createGain();
        const osc = audioCtx.createOscillator();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.06);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }

    function ceation_slots() {
        // Reset state and clear container
        f.innerHTML = "";
        m = [];
        p.internalWin = false;
        
        let cols = p.grid[0];
        let rows = p.grid[1];
        
        // Logical base sizing to keep aspect ratio but avoid huge dimensions
        let aspect = p.size[0] / p.size[1];
        let baseSize = 800; // Reference size for calculations
        let logicalWidth, logicalHeight;

        if (aspect > 1) { // Landscape
            logicalWidth = baseSize;
            logicalHeight = baseSize / aspect;
        } else { // Portrait or Square
            logicalHeight = baseSize;
            logicalWidth = baseSize * aspect;
        }
        
        f.style.width = Math.round(logicalWidth) + 'px';
        f.style.height = Math.round(logicalHeight) + 'px';
        f.style.position = 'relative';
        p.internalSize = [logicalWidth, logicalHeight];

        // Ensure single resize listener
        window.removeEventListener('resize', fifteen_resize);
        fifteen_resize();
        window.addEventListener('resize', fifteen_resize);

        // Instant number toggle listener
        window.removeEventListener('toggleNumbers', window._tnHandler);
        window._tnHandler = function(e) {
            p.number = e.detail;
            document.querySelectorAll('.slot').forEach((s, i) => {
                const existing = s.querySelector('.num-badge');
                if (p.number && !existing) {
                    const tag = s.getAttribute('data-id');
                    if (tag) {
                        const span = document.createElement('div');
                        span.className = 'num-badge';
                        span.innerText = tag;
                        s.appendChild(span);
                    }
                } else if (!p.number && existing) {
                    existing.remove();
                }
            });
        };
        window.addEventListener('toggleNumbers', window._tnHandler);

        o = 1;
        let emptySlotIndex = (p.emptySlot) ? p.emptySlot : cols * rows;

        for (let y = 0; y < rows; y++) {
            m[y] = [];
            for (let x = 0; x < cols; x++) {
                if (o !== emptySlotIndex) {
                    m[y][x] = o;
                    let e = document.createElement("div");
                    e.id = "slot" + o;
                    e.className = "slot";
                    e.addEventListener('click', (function(num) {
                        return function() { move_slot(num); };
                    })(o));
                    
                    if (p.number) {
                        e.innerHTML = "<div class='num-badge'>" + o + "</div>";
                    }
                    e.setAttribute('data-id', o);

                    e.style.position = 'absolute';
                    e.style.width = (100 / cols) + "%";
                    e.style.height = (100 / rows) + "%";
                    e.style.left = (100 / cols * x) + "%";
                    e.style.top = (100 / rows * y) + "%";
                    
                    e.style.backgroundImage = "url(" + p.art.url + ")";
                    // Using background-size properly with percentages
                    e.style.backgroundSize = (cols * 100) + "% " + (rows * 100) + "%";
                    
                    // Precise percentage mapping
                    let posX = (cols > 1) ? (100 / (cols - 1) * x) : 0;
                    let posY = (rows > 1) ? (100 / (rows - 1) * y) : 0;
                    e.style.backgroundPosition = posX + "% " + posY + "%";
                    
                    e.style.boxSizing = 'border-box';
                    e.style.border = '1px solid rgba(255,255,255,0.15)';
                    e.style.cursor = 'pointer';
                    e.style.userSelect = 'none';
                    e.style.WebkitUserSelect = 'none';
                    
                    if (p.style) {
                        e.style.cssText += p.style;
                    }
                    
                    if (p.time) {
                        e.style.transition = "all " + p.time + "s cubic-bezier(0.19, 1, 0.22, 1)";
                    }
                    
                    f.appendChild(e);
                } else {
                    m[y][x] = 0;
                    freeslot = [y, x];
                }
                o++;
            }
        }
        stir_slots();
    }

    function stir_slots() {
        for (let i = 0; i < p.diff; i++) {
            let possibleMoves = [];
            let y = freeslot[0];
            let x = freeslot[1];

            if (y > 0) possibleMoves.push([y - 1, x]);
            if (y < p.grid[1] - 1) possibleMoves.push([y + 1, x]);
            if (x > 0) possibleMoves.push([y, x - 1]);
            if (x < p.grid[0] - 1) possibleMoves.push([y, x + 1]);

            let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            let val = m[move[0]][move[1]];
            
            m[y][x] = val;
            m[move[0]][move[1]] = 0;
            freeslot = [move[0], move[1]];
        }
        
        // Update DOM positions after shuffle
        let cols = p.grid[0];
        let rows = p.grid[1];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (m[y][x]) {
                    let e = document.getElementById("slot" + m[y][x]);
                    e.style.left = (100 / cols * x) + "%";
                    e.style.top = (100 / rows * y) + "%";
                }
            }
        }
    }

    function move_slot(s) {
        if (p.internalWin) return;
        let piecePos = null;
        let cols = p.grid[0];
        let rows = p.grid[1];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (m[y][x] === s) {
                    piecePos = [y, x];
                    break;
                }
            }
            if (piecePos) break;
        }

        if (!piecePos) return;

        let [py, px] = piecePos;
        let [fy, fx] = freeslot;

        if (py === fy || px === fx) {
            let dy = Math.sign(fy - py);
            let dx = Math.sign(fx - px);
            
            let steps = Math.max(Math.abs(fy - py), Math.abs(fx - px));
            
            for (let i = 0; i < steps; i++) {
                let curY = fy - (i * dy);
                let curX = fx - (i * dx);
                let nextY = curY - dy;
                let nextX = curX - dx;
                
                let val = m[nextY][nextX];
                m[curY][curX] = val;
                
                let e = document.getElementById("slot" + val);
                e.style.left = (100 / cols * curX) + "%";
                e.style.top = (100 / rows * curY) + "%";
            }
            
            p.internalSize && playClickSound();
            m[py][px] = 0;
            freeslot = [py, px];
            check_slots();
        }
    }

    function check_slots() {
        let expected = 1;
        let win = true;
        let cols = p.grid[0];
        let rows = p.grid[1];
        let c = (p.emptySlot) ? p.emptySlot : cols * rows;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (expected === c) {
                    if (m[y][x] !== 0) {
                        win = false;
                        break;
                    }
                } else {
                    if (m[y][x] !== expected) {
                        win = false;
                        break;
                    }
                }
                expected++;
            }
            if (!win) break;
        }

        if (win) {
            // Prevent further moves
            p.internalWin = true;
            
            // Reveal the missing piece
            let lastPiece = document.createElement("div");
            lastPiece.className = "slot win-reveal";
            lastPiece.style.position = 'absolute';
            lastPiece.style.width = (100 / cols) + "%";
            lastPiece.style.height = (100 / rows) + "%";
            lastPiece.style.left = (100 / cols * freeslot[1]) + "%";
            lastPiece.style.top = (100 / rows * freeslot[0]) + "%";
            lastPiece.style.backgroundImage = "url(" + p.art.url + ")";
            lastPiece.style.backgroundSize = (cols * 100) + "% " + (rows * 100) + "%";
            
            let posX = (cols > 1) ? (100 / (cols - 1) * freeslot[1]) : 0;
            let posY = (rows > 1) ? (100 / (rows - 1) * freeslot[0]) : 0;
            lastPiece.style.backgroundPosition = posX + "% " + posY + "%";
            
            lastPiece.style.opacity = "0";
            lastPiece.style.transition = "opacity 0.6s ease-in";
            lastPiece.style.boxSizing = 'border-box';
            lastPiece.style.border = 'none';
            lastPiece.style.zIndex = "10";
            
            f.appendChild(lastPiece);
            
            // Trigger animation
            setTimeout(() => {
                lastPiece.style.opacity = "1";
                
                // Polish all other pieces
                document.querySelectorAll('.slot').forEach(s => {
                    s.style.border = "none";
                    s.style.boxShadow = "none";
                    const num = s.querySelector('span');
                    if (num) num.style.opacity = "0";
                });

                // Dispatch win event for UI
                const winEvent = new CustomEvent('puzzleWin');
                window.dispatchEvent(winEvent);
                
                // Play a success sound
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            }, 100);
        }
    }

    function fifteen_resize() {
        let parent = f.parentNode;
        let rect = parent.getBoundingClientRect();
        
        let padding = (window.innerWidth < 768) ? 24 : 64; 
        let availableWidth = rect.width - padding;
        let availableHeight = rect.height - padding;
        
        let baseWidth = p.internalSize ? p.internalSize[0] : p.size[0];
        let baseHeight = p.internalSize ? p.internalSize[1] : p.size[1];
        
        let scale = Math.min(availableWidth / baseWidth, availableHeight / baseHeight);
        
        if (scale > 1.2 && window.innerWidth > 768) scale = 1.2;
        if (scale < 0.05) scale = 0.05;

        f.style.transform = 'scale(' + scale + ')';
        f.style.transformOrigin = 'center center';
    }

    // Keyboard support
    if (p.keyBoard) {
        document.addEventListener("keydown", function(e) {
            let [y, x] = freeslot;
            let target = null;
            if (e.keyCode === 37 && x < p.grid[0] - 1) target = m[y][x + 1]; // Left key -> move right piece left
            if (e.keyCode === 39 && x > 0) target = m[y][x - 1]; // Right key -> move left piece right
            if (e.keyCode === 38 && y < p.grid[1] - 1) target = m[y + 1][x]; // Up key -> move bottom piece up
            if (e.keyCode === 40 && y > 0) target = m[y - 1][x]; // Down key -> move top piece down
            
            if (target) move_slot(target);
        });
    }

    // Gamepad support
    let gamepadPress = false;
    if (p.gamePad) {
        function updateGamepad() {
            let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            for (let i = 0; i < gamepads.length; i++) {
                let gp = gamepads[i];
                if (gp) {
                    let dpadUp = gp.buttons[12] && gp.buttons[12].pressed;
                    let dpadDown = gp.buttons[13] && gp.buttons[13].pressed;
                    let dpadLeft = gp.buttons[14] && gp.buttons[14].pressed;
                    let dpadRight = gp.buttons[15] && gp.buttons[15].pressed;

                    let anyPressed = dpadUp || dpadDown || dpadLeft || dpadRight;
                    
                    if (anyPressed && !gamepadPress) {
                        let [y, x] = freeslot;
                        let target = null;
                        if (dpadUp && y < p.grid[1] - 1) target = m[y + 1][x];
                        if (dpadDown && y > 0) target = m[y - 1][x];
                        if (dpadLeft && x < p.grid[0] - 1) target = m[y][x + 1];
                        if (dpadRight && x > 0) target = m[y][x - 1];
                        
                        if (target) move_slot(target);
                    }
                    gamepadPress = anyPressed;
                }
            }
            requestAnimationFrame(updateGamepad);
        }
        window.addEventListener("gamepadconnected", function() {
            updateGamepad();
        });
    }

    // Export some functions globally for the editor
    window.ceation_slots = ceation_slots;
    window.fifteen_resize = fifteen_resize;
    window.move_slot = move_slot;

    // Start
    ceation_slots();

})();
