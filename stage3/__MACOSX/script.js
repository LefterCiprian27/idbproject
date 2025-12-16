class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isAudioInitialized = false;
        this.isMuted = false;
        this.volume = 0.5;
        this.backgroundMusic = null;
        this.isPlaying = false;
        
        this.sounds = {
            draw: { frequency: 440, type: 'sine', duration: 0.05 },
            click: { frequency: 600, type: 'square', duration: 0.1 },
            clear: { frequency: 200, type: 'sawtooth', duration: 0.3 },
            undo: { frequency: 350, type: 'triangle', duration: 0.15 },
            redo: { frequency: 450, type: 'triangle', duration: 0.15 },
            shapeComplete: { frequency: 800, type: 'sine', duration: 0.2 }
        };
    }

    init() {
        if (this.isAudioInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isAudioInitialized = true;
            console.log('Audio API initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Audio API:', error);
        }
    }

    playSound(soundName) {
        if (!this.isAudioInitialized || this.isMuted || !this.sounds[soundName]) return;

        const sound = this.sounds[soundName];
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = sound.type;
        oscillator.frequency.setValueAtTime(sound.frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + sound.duration);
    }

    playDrawingTone(y, canvasHeight) {
        if (!this.isAudioInitialized || this.isMuted) return;

        const minFreq = 200;
        const maxFreq = 800;
        const frequency = minFreq + ((canvasHeight - y) / canvasHeight) * (maxFreq - minFreq);

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    playMelody() {
        if (!this.isAudioInitialized || this.isMuted) return;

        const notes = [523.25, 659.25, 783.99, 1046.50];
        const duration = 0.15;

        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * duration);

            const startTime = this.audioContext.currentTime + index * duration;
            gainNode.gain.setValueAtTime(this.volume * 0.2, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }

    startMelodyLoop() {
        if (!this.isAudioInitialized) return;

        const melodyPattern = [
            { note: 523.25, duration: 0.4 },
            { note: 587.33, duration: 0.4 },
            { note: 659.25, duration: 0.6 },
            { note: 523.25, duration: 0.3 },
            { note: 783.99, duration: 0.5 },
            { note: 659.25, duration: 0.4 },
            { note: 587.33, duration: 0.6 },
            { note: 523.25, duration: 0.8 },
            { note: 392.00, duration: 0.4 },
            { note: 440.00, duration: 0.4 },
            { note: 523.25, duration: 0.6 },
            { note: 659.25, duration: 0.5 },
            { note: 587.33, duration: 0.4 },
            { note: 523.25, duration: 0.8 },
            { note: 0, duration: 0.5 },
        ];

        const totalDuration = melodyPattern.reduce((sum, n) => sum + n.duration, 0);
        
        const playMelody = () => {
            if (!this.isPlaying) return;
            
            let timeOffset = 0;
            
            melodyPattern.forEach(({ note, duration }) => {
                if (note === 0) {
                    timeOffset += duration;
                    return;
                }
                
                const osc = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note, this.audioContext.currentTime + timeOffset);
                
                osc.connect(gainNode);
                gainNode.connect(this.masterGain);
                
                const startTime = this.audioContext.currentTime + timeOffset;
                const attackTime = 0.02;
                const releaseTime = duration * 0.3;
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + attackTime);
                gainNode.gain.setValueAtTime(0.3, startTime + duration - releaseTime);
                gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
                
                osc.start(startTime);
                osc.stop(startTime + duration + 0.1);
                
                timeOffset += duration;
            });
            
            this.melodyTimeout = setTimeout(() => playMelody(), totalDuration * 1000);
        };

        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
        
        playMelody();
    }

    stopMelodyLoop() {
        if (this.melodyTimeout) {
            clearTimeout(this.melodyTimeout);
            this.melodyTimeout = null;
        }
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
        }
    }

    toggleBackgroundMusic() {
        if (!this.isAudioInitialized) return;

        if (this.isPlaying) {
            this.stopMelodyLoop();
            this.isPlaying = false;
        } else {
            this.isPlaying = true;
            this.startMelodyLoop();
        }

        return this.isPlaying;
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain && this.isPlaying) {
            this.masterGain.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.isPlaying) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.4, this.audioContext.currentTime);
        }
        return this.isMuted;
    }

    createAnalyser() {
        if (!this.isAudioInitialized) return null;
        
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        return analyser;
    }
}

class DrawingBoard {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.audioManager = new AudioManager();
        
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentShape = null;
        this.brushColor = '#000000';
        this.brushSize = 5;
        
        this.startX = 0;
        this.startY = 0;
        this.isDrawingShape = false;
        
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        
        this.lastAudioTime = 0;
        this.audioThrottleMs = 50;
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.saveState();
        
        document.addEventListener('click', () => this.audioManager.init(), { once: true });
        document.addEventListener('mousedown', () => this.audioManager.init(), { once: true });
    }

    resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        const rect = wrapper.getBoundingClientRect();
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        this.canvas.width = Math.min(rect.width - 20, 1200);
        this.canvas.height = Math.min(rect.height - 20, 800);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (imageData.width > 0) {
            this.ctx.putImageData(imageData, 0, 0);
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        window.addEventListener('resize', () => this.resizeCanvas());
        
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => this.setTool(btn.dataset.tool));
        });
        
        document.querySelectorAll('.tool-btn[data-shape]').forEach(btn => {
            btn.addEventListener('click', () => this.setShape(btn.dataset.shape));
        });
        
        const colorPicker = document.getElementById('color-picker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                this.brushColor = e.target.value;
                document.querySelector('.color-value').textContent = e.target.value;
            });
        }
        
        const brushSize = document.getElementById('brush-size');
        if (brushSize) {
            brushSize.addEventListener('input', (e) => {
                this.brushSize = parseInt(e.target.value);
                document.getElementById('brush-size-value').textContent = e.target.value;
            });
        }
        
        document.getElementById('undo-btn')?.addEventListener('click', () => this.undo());
        document.getElementById('redo-btn')?.addEventListener('click', () => this.redo());
        document.getElementById('clear-btn')?.addEventListener('click', () => this.clearCanvas());
        
        document.getElementById('toggle-sound')?.addEventListener('click', () => this.toggleSound());
        document.getElementById('toggle-music')?.addEventListener('click', () => this.toggleMusic());
        document.getElementById('volume-slider')?.addEventListener('input', (e) => {
            this.audioManager.setVolume(parseFloat(e.target.value) / 100);
            document.getElementById('volume-value').textContent = e.target.value;
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        this.audioManager.init();
        
        if (this.currentShape) {
            this.isDrawingShape = true;
            this.startX = pos.x;
            this.startY = pos.y;
            this.tempImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.isDrawing = true;
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
        }
        
        this.audioManager.playSound('click');
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        
        if (this.isDrawingShape && this.currentShape) {
            this.ctx.putImageData(this.tempImageData, 0, 0);
            this.drawShape(this.startX, this.startY, pos.x, pos.y);
        } else if (this.isDrawing) {
            this.draw(pos.x, pos.y);
            
            const now = Date.now();
            if (now - this.lastAudioTime > this.audioThrottleMs) {
                this.audioManager.playDrawingTone(pos.y, this.canvas.height);
                this.lastAudioTime = now;
            }
        }
    }

    handleMouseUp(e) {
        if (this.isDrawingShape && this.currentShape) {
            this.isDrawingShape = false;
            this.saveState();
            this.audioManager.playSound('shapeComplete');
        } else if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseDown(mouseEvent);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseMove(mouseEvent);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp(e);
    }

    draw(x, y) {
        this.ctx.lineTo(x, y);
        this.ctx.strokeStyle = this.currentTool === 'eraser' ? '#ffffff' : this.brushColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    }

    drawShape(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.brushColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        switch (this.currentShape) {
            case 'line':
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                break;
            case 'rectangle':
                this.ctx.rect(x1, y1, x2 - x1, y2 - y1);
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                this.ctx.arc(x1, y1, radius, 0, Math.PI * 2);
                break;
            case 'triangle':
                this.ctx.moveTo(x1, y2);
                this.ctx.lineTo((x1 + x2) / 2, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.closePath();
                break;
        }
        this.ctx.stroke();
    }

    setTool(tool) {
        this.currentTool = tool;
        this.currentShape = null;
        
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
        
        this.audioManager.playSound('click');
    }

    setShape(shape) {
        this.currentShape = shape;
        this.currentTool = null;
        
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-shape="${shape}"]`)?.classList.add('active');
        
        this.audioManager.playSound('click');
    }

    saveState() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        const imageData = this.canvas.toDataURL();
        this.history.push(imageData);
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateHistoryButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadState(this.history[this.historyIndex]);
            this.audioManager.playSound('undo');
        }
        this.updateHistoryButtons();
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadState(this.history[this.historyIndex]);
            this.audioManager.playSound('redo');
        }
        this.updateHistoryButtons();
    }

    loadState(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    }

    updateHistoryButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
        this.audioManager.playSound('clear');
        this.audioManager.playMelody();
    }

    toggleSound() {
        const isMuted = this.audioManager.toggleMute();
        const btn = document.getElementById('toggle-sound');
        if (btn) {
            btn.classList.toggle('active', !isMuted);
            btn.querySelector('.sound-status').textContent = isMuted ? 'Off' : 'On';
        }
    }

    toggleMusic() {
        const isPlaying = this.audioManager.toggleBackgroundMusic();
        const btn = document.getElementById('toggle-music');
        if (btn) {
            btn.classList.toggle('active', isPlaying);
            btn.querySelector('.music-status').textContent = isPlaying ? 'On' : 'Off';
        }
    }
}

class AudioVisualizer {
    constructor(canvasId, audioManager) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.audioManager = audioManager;
        this.isRunning = false;
        this.animationId = null;
    }

    start() {
        if (!this.canvas || this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    animate() {
        if (!this.isRunning) return;

        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.ctx.fillStyle = 'rgba(44, 62, 80, 0.1)';
        this.ctx.fillRect(0, 0, width, height);
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        
        const time = Date.now() / 1000;
        for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin(x * 0.02 + time * 2) * 20 + Math.sin(x * 0.01 + time) * 10;
            if (x === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();

        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const drawingBoard = new DrawingBoard('drawing-canvas');
    
    const visualizer = new AudioVisualizer('audio-visualizer', drawingBoard.audioManager);
    
    window.drawingBoard = drawingBoard;
    window.audioVisualizer = visualizer;
    
    console.log('Drawing Board initialized with Audio API support');
});
