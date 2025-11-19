const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

const state = {
    isDrawing: false,
    currentTool: 'brush',
    currentColor: '#000000',
    currentSize: 5,
    currentShape: null,
    startX: 0,
    startY: 0,
    history: [],
    historyStep: -1,
    maxHistory: 50
};

function initCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    canvas.width = Math.min(rect.width - 40, 1200);
    canvas.height = Math.min(rect.height - 40, 700);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    saveState();
}

function saveState() {
    state.history = state.history.slice(0, state.historyStep + 1);
    
    state.history.push(canvas.toDataURL());
    state.historyStep++;
    
    if (state.history.length > state.maxHistory) {
        state.history.shift();
        state.historyStep--;
    }
    
    updateActionButtons();
}

function undo() {
    if (state.historyStep > 0) {
        state.historyStep--;
        restoreState(state.history[state.historyStep]);
    }
}

function redo() {
    if (state.historyStep < state.history.length - 1) {
        state.historyStep++;
        restoreState(state.history[state.historyStep]);
    }
}

function restoreState(imageData) {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

function updateActionButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    undoBtn.disabled = state.historyStep <= 0;
    redoBtn.disabled = state.historyStep >= state.history.length - 1;
}

function startDrawing(e) {
    state.isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    state.startX = e.clientX - rect.left;
    state.startY = e.clientY - rect.top;
    
    if (state.currentTool === 'brush' || state.currentTool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(state.startX, state.startY);
        
        if (state.currentTool === 'eraser') {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = state.currentSize * 2;
        } else {
            ctx.strokeStyle = state.currentColor;
            ctx.lineWidth = state.currentSize;
        }
    } else if (state.currentShape) {
        state.canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}

function draw(e) {
    if (!state.isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    if (state.currentTool === 'brush' || state.currentTool === 'eraser') {
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    } else if (state.currentShape) {
        ctx.putImageData(state.canvasSnapshot, 0, 0);
        
        ctx.strokeStyle = state.currentColor;
        ctx.lineWidth = state.currentSize;
        ctx.fillStyle = state.currentColor;
        
        drawShape(state.startX, state.startY, currentX, currentY, state.currentShape);
    }
}

function stopDrawing() {
    if (state.isDrawing) {
        state.isDrawing = false;
        ctx.beginPath();
        saveState();
    }
}

function drawShape(startX, startY, endX, endY, shape) {
    ctx.beginPath();
    
    switch(shape) {
        case 'line':
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            break;
            
        case 'rectangle':
            const width = endX - startX;
            const height = endY - startY;
            ctx.strokeRect(startX, startY, width, height);
            break;
            
        case 'circle':
            const centerX = (startX + endX) / 2;
            const centerY = (startY + endY) / 2;
            const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            break;
            
        case 'triangle':
            const midX = (startX + endX) / 2;
            ctx.moveTo(midX, startY);
            ctx.lineTo(endX, endY);
            ctx.lineTo(startX, endY);
            ctx.closePath();
            ctx.stroke();
            break;
            
        case 'square':
            const size = Math.min(Math.abs(endX - startX), Math.abs(endY - startY));
            const squareEndX = startX + (endX > startX ? size : -size);
            const squareEndY = startY + (endY > startY ? size : -size);
            ctx.strokeRect(startX, startY, squareEndX - startX, squareEndY - startY);
            break;
            
        case 'pentagon':
            const pentCenterX = (startX + endX) / 2;
            const pentCenterY = (startY + endY) / 2;
            const pentRadius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                const x = pentCenterX + pentRadius * Math.cos(angle);
                const y = pentCenterY + pentRadius * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            break;
            
        case 'hexagon':
            const hexCenterX = (startX + endX) / 2;
            const hexCenterY = (startY + endY) / 2;
            const hexRadius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
            for (let i = 0; i < 6; i++) {
                const angle = (i * 2 * Math.PI / 6);
                const x = hexCenterX + hexRadius * Math.cos(angle);
                const y = hexCenterY + hexRadius * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            break;
            
        case 'star':
            const starCenterX = (startX + endX) / 2;
            const starCenterY = (startY + endY) / 2;
            const starRadius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
            const innerRadius = starRadius * 0.4;
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI / 5) - Math.PI / 2;
                const r = i % 2 === 0 ? starRadius : innerRadius;
                const x = starCenterX + r * Math.cos(angle);
                const y = starCenterY + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            break;
    }
}

function clearCanvas() {
    if (confirm('Are you sure you want to clear the canvas?')) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
    }
}

function downloadCanvas() {
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `drawing-${timestamp}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
});

const colorPicker = document.getElementById('color-picker');
const colorValue = document.querySelector('.color-value');

colorPicker.addEventListener('input', (e) => {
    state.currentColor = e.target.value;
    colorValue.textContent = e.target.value.toUpperCase();
});

const brushSize = document.getElementById('brush-size');
const brushSizeValue = document.getElementById('brush-size-value');

brushSize.addEventListener('input', (e) => {
    state.currentSize = parseInt(e.target.value);
    brushSizeValue.textContent = state.currentSize;
});

const toolButtons = document.querySelectorAll('[data-tool]');

toolButtons.forEach(button => {
    button.addEventListener('click', () => {
        toolButtons.forEach(btn => btn.classList.remove('active'));
        
        button.classList.add('active');
        
        state.currentTool = button.dataset.tool;
        state.currentShape = null;
        
        shapeButtons.forEach(btn => btn.classList.remove('active'));
    });
});

const shapeButtons = document.querySelectorAll('[data-shape]');

shapeButtons.forEach(button => {
    button.addEventListener('click', () => {
        shapeButtons.forEach(btn => btn.classList.remove('active'));
        
        button.classList.add('active');
        
        state.currentShape = button.dataset.shape;
        state.currentTool = 'shape';
        
        toolButtons.forEach(btn => btn.classList.remove('active'));
    });
});

const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const clearBtn = document.getElementById('clear-btn');
const downloadBtn = document.getElementById('download-btn');

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
clearBtn.addEventListener('click', clearCanvas);
downloadBtn.addEventListener('click', downloadCanvas);

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const imageData = canvas.toDataURL();
        
        initCanvas();
        
        const img = new Image();
        img.src = imageData;
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            saveState();
        };
    }, 250);
});

initCanvas();
console.log('Drawing Board initialized successfully! Canvas API is ready.');
