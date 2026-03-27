/**
 * 贪吃蛇小游戏 V3 - 抖音小游戏版
 * 康泰园主题 - 立体设计 + 优化控制
 */

const canvas = tt.createCanvas();
const ctx = canvas.getContext('2d');

const { windowWidth, windowHeight, pixelRatio } = tt.getSystemInfoSync();
canvas.width = windowWidth * pixelRatio;
canvas.height = windowHeight * pixelRatio;
ctx.scale(pixelRatio, pixelRatio);

// ============== 游戏配置 ==============
const CONFIG = {
  gridSize: 22,
  cols: Math.floor((windowWidth - 40) / 22),
  rows: Math.floor((windowHeight - 280) / 22),
  speed: 180,
  playAreaTop: 90,
};

const GRID_SIZE = CONFIG.gridSize;
const COLS = CONFIG.cols;
const ROWS = CONFIG.rows;
const PLAY_LEFT = (windowWidth - COLS * GRID_SIZE) / 2;
const PLAY_TOP = CONFIG.playAreaTop;

// ============== 蛇颜色进化系统 ==============
const SNAKE_EVOLUTION = [
  { threshold: 0,   color: '#4CAF50', headColor: '#8BC34A', name: '小青蛇' },
  { threshold: 10,  color: '#2196F3', headColor: '#64B5F6', name: '蓝蛇' },
  { threshold: 20,  color: '#9C27B0', headColor: '#CE93D8', name: '紫蛇' },
  { threshold: 35,  color: '#FF9800', headColor: '#FFB74D', name: '金蛇' },
  { threshold: 50,  color: '#E91E63', headColor: '#F48FB1', name: '玫瑰蛇' },
  { threshold: 70,  color: '#F44336', headColor: '#EF5350', name: '火焰蛇' },
  { threshold: 100, color: '#FFD700', headColor: '#FFEB3B', name: '金龙蛇', glow: true },
];

// ============== 游戏状态 ==============
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = 0;
let gameLoop = null;
let gameState = 'start';
let foodEaten = 0;
let currentEvolution = SNAKE_EVOLUTION[0];

// ============== 立体渐变背景 ==============
function drawGradientBackground() {
  // 主背景渐变 - 深蓝到紫
  const bgGrad = ctx.createLinearGradient(0, 0, 0, windowHeight);
  bgGrad.addColorStop(0, '#1a1a2e');
  bgGrad.addColorStop(0.5, '#16213e');
  bgGrad.addColorStop(1, '#0f0f23');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, windowWidth, windowHeight);
  
  // 装饰性光晕
  ctx.save();
  ctx.globalAlpha = 0.15;
  
  // 左上角光晕
  const glow1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
  glow1.addColorStop(0, '#667eea');
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, 400, 400);
  
  // 右下角光晕
  const glow2 = ctx.createRadialGradient(windowWidth, windowHeight, 0, windowWidth, windowHeight, 350);
  glow2.addColorStop(0, '#f093fb');
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(windowWidth - 400, windowHeight - 400, 400, 400);
  
  ctx.restore();
  
  // 装饰线条
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 60);
    ctx.lineTo(windowWidth, i * 60 + 100);
    ctx.stroke();
  }
}

// ============== 初始化 ==============
function initGame() {
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY }
  ];
  
  direction = 'right';
  nextDirection = 'right';
  score = 0;
  foodEaten = 0;
  CONFIG.speed = 180;
  currentEvolution = SNAKE_EVOLUTION[0];
  
  spawnFood();
}

function spawnFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS)
    };
  } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
  food = newFood;
}

function checkEvolution() {
  for (let i = SNAKE_EVOLUTION.length - 1; i >= 0; i--) {
    if (foodEaten >= SNAKE_EVOLUTION[i].threshold) {
      if (currentEvolution !== SNAKE_EVOLUTION[i]) {
        currentEvolution = SNAKE_EVOLUTION[i];
        tt.showToast && tt.showToast({
          title: `进化: ${currentEvolution.name}!`,
          icon: 'success',
          duration: 1500
        });
      }
      break;
    }
  }
}

// ============== 游戏更新 ==============
function update() {
  direction = nextDirection;
  const head = { ...snake[0] };
  
  switch (direction) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }
  
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    gameOver();
    return;
  }
  
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    gameOver();
    return;
  }
  
  snake.unshift(head);
  
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    foodEaten++;
    checkEvolution();
    spawnFood();
    if (CONFIG.speed > 100) {
      CONFIG.speed -= 3;
      clearInterval(gameLoop);
      gameLoop = setInterval(gameStep, CONFIG.speed);
    }
  } else {
    snake.pop();
  }
}

// ============== 绘制函数 ==============

function drawPlayArea() {
  // 网格背景（无边框）
  ctx.fillStyle = 'rgba(20,20,35,0.8)';
  ctx.fillRect(PLAY_LEFT - 5, PLAY_TOP - 5, COLS * GRID_SIZE + 10, ROWS * GRID_SIZE + 10);
  
  // 网格
  ctx.strokeStyle = 'rgba(100,100,120,0.12)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(PLAY_LEFT + i * GRID_SIZE, PLAY_TOP);
    ctx.lineTo(PLAY_LEFT + i * GRID_SIZE, PLAY_TOP + ROWS * GRID_SIZE);
    ctx.stroke();
  }
  for (let i = 0; i <= ROWS; i++) {
    ctx.beginPath();
    ctx.moveTo(PLAY_LEFT, PLAY_TOP + i * GRID_SIZE);
    ctx.lineTo(PLAY_LEFT + COLS * GRID_SIZE, PLAY_TOP + i * GRID_SIZE);
    ctx.stroke();
  }
}

function drawFood() {
  const x = PLAY_LEFT + food.x * GRID_SIZE + GRID_SIZE / 2;
  const y = PLAY_TOP + food.y * GRID_SIZE + GRID_SIZE / 2;
  const r = GRID_SIZE / 2 - 3;
  
  // 外发光
  ctx.save();
  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 20;
  
  // 食物主体渐变
  const foodGrad = ctx.createRadialGradient(x - r/3, y - r/3, 0, x, y, r);
  foodGrad.addColorStop(0, '#ff9a9a');
  foodGrad.addColorStop(0.7, '#ff6b6b');
  foodGrad.addColorStop(1, '#ee5a5a');
  
  ctx.fillStyle = foodGrad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(x - r/3, y - r/3, r/3, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake() {
  const { color, headColor, glow } = currentEvolution;
  
  snake.forEach((seg, index) => {
    const x = PLAY_LEFT + seg.x * GRID_SIZE + 2;
    const y = PLAY_TOP + seg.y * GRID_SIZE + 2;
    const w = GRID_SIZE - 4;
    const h = GRID_SIZE - 4;
    
    if (index === 0) {
      // 蛇头阴影
      ctx.save();
      ctx.shadowColor = headColor;
      ctx.shadowBlur = glow ? 20 : 12;
      ctx.shadowOffsetY = 3;
      
      // 蛇头渐变
      const headGrad = ctx.createLinearGradient(x, y, x + w, y + h);
      headGrad.addColorStop(0, headColor);
      headGrad.addColorStop(1, color);
      
      ctx.fillStyle = headGrad;
      roundRect(ctx, x, y, w, h, 8);
      ctx.restore();
      
      // 眼睛
      ctx.fillStyle = '#fff';
      const eyeR = 3;
      let eye1X, eye1Y, eye2X, eye2Y;
      
      switch (direction) {
        case 'right':
          eye1X = x + w - 6; eye1Y = y + 6;
          eye2X = x + w - 6; eye2Y = y + h - 6;
          break;
        case 'left':
          eye1X = x + 6; eye1Y = y + 6;
          eye2X = x + 6; eye2Y = y + h - 6;
          break;
        case 'up':
          eye1X = x + 6; eye1Y = y + 6;
          eye2X = x + w - 6; eye2Y = y + 6;
          break;
        case 'down':
          eye1X = x + 6; eye1Y = y + h - 6;
          eye2X = x + w - 6; eye2Y = y + h - 6;
          break;
      }
      
      // 眼睛光晕
      ctx.save();
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, eyeR, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // 瞳孔
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, 1.5, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 蛇身渐变
      const bodyGrad = ctx.createLinearGradient(x, y, x + w, y + h);
      bodyGrad.addColorStop(0, color);
      bodyGrad.addColorStop(1, adjustColor(color, -20));
      
      ctx.fillStyle = bodyGrad;
      roundRect(ctx, x, y, w, h, 6);
      
      // 身体花纹
      if (index % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 4);
      }
    }
  });
}

// 调整颜色亮度
function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function drawTopBar() {
  // 顶部栏背景 - 立体渐变
  const barGrad = ctx.createLinearGradient(0, 0, 0, 75);
  barGrad.addColorStop(0, 'rgba(30,30,50,0.98)');
  barGrad.addColorStop(1, 'rgba(20,20,40,0.95)');
  
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, windowWidth, 75);
  
  // 底部高光线
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 75);
  ctx.lineTo(windowWidth, 75);
  ctx.stroke();
  
  // 分数 - 立体文字
  ctx.save();
  ctx.shadowColor = 'rgba(255,200,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`分数: ${score}`, 20, 32);
  ctx.restore();
  
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '14px Arial';
  ctx.fillText(`最高: ${highScore}`, 20, 55);
  
  // 蛇形态
  ctx.save();
  ctx.shadowColor = currentEvolution.color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = currentEvolution.headColor;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(currentEvolution.name, windowWidth - 20, 32);
  ctx.restore();
  
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '12px Arial';
  ctx.fillText(`已吃: ${foodEaten}`, windowWidth - 20, 52);
}

// ============== 方向键控制 - 居中 ==============
const BTN_SIZE = 55;
const BTN_GAP = 6;
const CONTROL_HEIGHT = BTN_SIZE * 3 + BTN_GAP * 2 + 30;
const CONTROL_Y = PLAY_TOP + ROWS * GRID_SIZE - 20; // 方向键往上移动，部分重叠游戏区域

const BUTTONS = {
  up:    { x: windowWidth / 2 - BTN_SIZE / 2, y: CONTROL_Y },
  down:  { x: windowWidth / 2 - BTN_SIZE / 2, y: CONTROL_Y + BTN_SIZE * 2 + BTN_GAP },
  left:  { x: windowWidth / 2 - BTN_SIZE * 1.5 - BTN_GAP, y: CONTROL_Y + BTN_SIZE + BTN_GAP },
  right: { x: windowWidth / 2 + BTN_SIZE / 2 + BTN_GAP, y: CONTROL_Y + BTN_SIZE + BTN_GAP }
};

function drawControls() {
  // 控制区背景 - 立体感
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 5;
  
  const ctrlGrad = ctx.createLinearGradient(0, CONTROL_Y - 15, 0, CONTROL_Y + CONTROL_HEIGHT);
  ctrlGrad.addColorStop(0, 'rgba(35,35,55,0.95)');
  ctrlGrad.addColorStop(1, 'rgba(25,25,45,0.95)');
  
  ctx.fillStyle = ctrlGrad;
  roundRect(ctx, 10, CONTROL_Y - 15, windowWidth - 20, CONTROL_HEIGHT, 20);
  ctx.restore();
  
  // 方向键
  Object.entries(BUTTONS).forEach(([dir, pos]) => {
    const isActive = direction === dir;
    
    // 按钮阴影
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    
    // 按钮渐变
    const btnGrad = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + BTN_SIZE);
    if (isActive) {
      btnGrad.addColorStop(0, currentEvolution.headColor);
      btnGrad.addColorStop(1, currentEvolution.color);
    } else {
      btnGrad.addColorStop(0, 'rgba(80,80,100,0.9)');
      btnGrad.addColorStop(1, 'rgba(50,50,70,0.9)');
    }
    
    ctx.fillStyle = btnGrad;
    roundRect(ctx, pos.x, pos.y, BTN_SIZE, BTN_SIZE, 15);
    ctx.restore();
    
    // 按钮高光
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fff';
    roundRect(ctx, pos.x + 5, pos.y + 5, BTN_SIZE - 10, BTN_SIZE / 2 - 5, 10);
    ctx.restore();
    
    // 箭头
    ctx.fillStyle = isActive ? '#fff' : 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const arrowMap = { up: '▲', down: '▼', left: '◀', right: '▶' };
    ctx.fillText(arrowMap[dir], pos.x + BTN_SIZE / 2, pos.y + BTN_SIZE / 2);
  });
  
  ctx.textBaseline = 'alphabetic';
}

function checkButtonPress(x, y) {
  for (const [dir, pos] of Object.entries(BUTTONS)) {
    if (x >= pos.x && x <= pos.x + BTN_SIZE &&
        y >= pos.y && y <= pos.y + BTN_SIZE) {
      if ((dir === 'up' && direction !== 'down') ||
          (dir === 'down' && direction !== 'up') ||
          (dir === 'left' && direction !== 'right') ||
          (dir === 'right' && direction !== 'left')) {
        nextDirection = dir;
      }
      return true;
    }
  }
  return false;
}

// ============== 辅助函数 ==============
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function roundRectStroke(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.stroke();
}

// ============== 游戏流程 ==============
function gameStep() {
  update();
  if (gameState === 'playing') {
    draw();
  }
}

function startGame() {
  gameState = 'playing';
  initGame();
  draw();
  gameLoop = setInterval(gameStep, CONFIG.speed);
}

function gameOver() {
  gameState = 'gameover';
  clearInterval(gameLoop);
  
  if (score > highScore) {
    highScore = score;
    try { tt.setStorageSync('snake_highscore', highScore); } catch (e) {}
  }
  
  drawGameOver();
}

// ============== 绘制界面 ==============
function draw() {
  drawGradientBackground();
  drawPlayArea();
  drawFood();
  drawSnake();
  drawTopBar();
  drawControls();
}

function drawStartScreen() {
  // 渐变背景
  const bgGrad = ctx.createLinearGradient(0, 0, 0, windowHeight);
  bgGrad.addColorStop(0, '#1a1a2e');
  bgGrad.addColorStop(1, '#16213e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, windowWidth, windowHeight);
  
  // 装饰光晕
  ctx.save();
  ctx.globalAlpha = 0.1;
  const glow = ctx.createRadialGradient(windowWidth / 2, windowHeight / 2, 0, windowWidth / 2, windowHeight / 2, 300);
  glow.addColorStop(0, '#667eea');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, windowWidth, windowHeight);
  ctx.restore();
  
  // === 主面板（垂直居中） ===
  const panelW = windowWidth - 50;
  const panelH = 420;
  const panelX = (windowWidth - panelW) / 2;
  const panelY = (windowHeight - panelH) / 2;
  
  // 面板背景
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  
  ctx.fillStyle = 'rgba(30, 35, 50, 0.95)';
  roundRect(ctx, panelX, panelY, panelW, panelH, 25);
  ctx.restore();
  
  // 面板边框
  ctx.strokeStyle = 'rgba(100, 120, 180, 0.3)';
  ctx.lineWidth = 2;
  roundRectStroke(ctx, panelX, panelY, panelW, panelH, 25);
  
  // === 蛇图标（居中） ===
  const iconY = panelY + 50;
  ctx.save();
  ctx.shadowColor = 'rgba(76, 175, 80, 0.5)';
  ctx.shadowBlur = 15;
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🐍', windowWidth / 2, iconY + 20);
  ctx.restore();
  
  // === 标题（居中） ===
  ctx.save();
  ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('康泰园贪吃蛇', windowWidth / 2, panelY + 115);
  ctx.restore();
  
  // 副标题
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '14px Arial';
  ctx.fillText('经典游戏 · 全新体验', windowWidth / 2, panelY + 142);
  
  // === 分割线 ===
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(panelX + 30, panelY + 165);
  ctx.lineTo(panelX + panelW - 30, panelY + 165);
  ctx.stroke();
  
  // === 游戏说明（居中） ===
  const infoY = panelY + 195;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '14px Arial';
  ctx.fillText('🎯 点击方向键或滑动控制蛇移动', windowWidth / 2, infoY);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '13px Arial';
  ctx.fillText('每吃 10 个食物，蛇会进化变色！', windowWidth / 2, infoY + 25);
  
  // === 进化颜色条（居中） ===
  const evoY = panelY + 250;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '12px Arial';
  ctx.fillText('━━━  进化路线  ━━━', windowWidth / 2, evoY);
  
  const evoColors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63', '#F44336', '#FFD700'];
  const barW = 180;
  const barX = windowWidth / 2 - barW / 2;
  const segW = barW / evoColors.length;
  
  evoColors.forEach((c, i) => {
    ctx.fillStyle = c;
    roundRect(ctx, barX + i * segW, evoY + 12, segW - 2, 12, 3);
  });
  
  // 进化名称
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '11px Arial';
  ctx.fillText('小青蛇 → 蓝蛇 → 紫蛇 → 金蛇 → 玫瑰 → 火焰 → 金龙蛇', windowWidth / 2, evoY + 42);
  
  // === 开始按钮（居中） ===
  const btnW = 150;
  const btnH = 48;
  const btnX = windowWidth / 2 - btnW / 2;
  const btnY = panelY + 310;
  
  // 按钮阴影
  ctx.save();
  ctx.shadowColor = 'rgba(76, 175, 80, 0.5)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 5;
  
  // 按钮渐变
  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
  btnGrad.addColorStop(0, '#66BB6A');
  btnGrad.addColorStop(1, '#43A047');
  
  ctx.fillStyle = btnGrad;
  roundRect(ctx, btnX, btnY, btnW, btnH, 24);
  ctx.restore();
  
  // 按钮文字
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('🎮 开始游戏', windowWidth / 2, btnY + btnH / 2 + 6);
  
  // === 最高分（居中） ===
  try {
    const savedHigh = tt.getStorageSync('snake_highscore');
    if (savedHigh) {
      highScore = savedHigh;
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`🏆 最高分: ${highScore}`, windowWidth / 2, panelY + panelH - 25);
    }
  } catch (e) {}
  
  // 版本号
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '11px Arial';
  ctx.fillText('V3.0', windowWidth / 2, windowHeight - 20);
}

function drawGameOver() {
  draw();
  
  // 遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, windowWidth, windowHeight);
  
  // 面板
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 30;
  
  const panelGrad = ctx.createLinearGradient(windowWidth / 2 - 140, windowHeight / 2 - 130, windowWidth / 2 + 140, windowHeight / 2 + 130);
  panelGrad.addColorStop(0, 'rgba(40,40,60,0.98)');
  panelGrad.addColorStop(1, 'rgba(30,30,50,0.98)');
  
  ctx.fillStyle = panelGrad;
  roundRect(ctx, windowWidth / 2 - 140, windowHeight / 2 - 130, 280, 260, 20);
  ctx.restore();
  
  // 标题
  ctx.save();
  ctx.shadowColor = 'rgba(244,67,54,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#f44336';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('游戏结束', windowWidth / 2, windowHeight / 2 - 75);
  ctx.restore();
  
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.fillText(`得分: ${score}`, windowWidth / 2, windowHeight / 2 - 25);
  
  ctx.fillStyle = currentEvolution.headColor;
  ctx.font = '16px Arial';
  ctx.fillText(`最终形态: ${currentEvolution.name}`, windowWidth / 2, windowHeight / 2 + 5);
  ctx.fillText(`吃了 ${foodEaten} 个食物`, windowWidth / 2, windowHeight / 2 + 35);
  
  if (score >= highScore && score > 0) {
    ctx.save();
    ctx.shadowColor = 'rgba(255,152,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff9800';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('🎉 新纪录！', windowWidth / 2, windowHeight / 2 + 70);
    ctx.restore();
  }
  
  // 再来一局按钮
  ctx.save();
  ctx.shadowColor = 'rgba(76,175,80,0.5)';
  ctx.shadowBlur = 15;
  
  const btnGrad = ctx.createLinearGradient(windowWidth / 2 - 70, windowHeight / 2 + 85, windowWidth / 2 + 70, windowHeight / 2 + 135);
  btnGrad.addColorStop(0, '#66BB6A');
  btnGrad.addColorStop(1, '#43A047');
  
  ctx.fillStyle = btnGrad;
  roundRect(ctx, windowWidth / 2 - 70, windowHeight / 2 + 85, 140, 50, 15);
  ctx.restore();
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('再来一局', windowWidth / 2, windowHeight / 2 + 118);
}

// ============== 触摸事件 ==============
tt.onTouchStart((res) => {
  const touch = res.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;
  
  if (gameState === 'playing') {
    checkButtonPress(x, y);
  } else if (gameState === 'start') {
    if (x >= windowWidth / 2 - 70 && x <= windowWidth / 2 + 70 &&
        y >= windowHeight / 2 + 70 && y <= windowHeight / 2 + 120) {
      startGame();
    }
  } else if (gameState === 'gameover') {
    if (x >= windowWidth / 2 - 70 && x <= windowWidth / 2 + 70 &&
        y >= windowHeight / 2 + 85 && y <= windowHeight / 2 + 135) {
      startGame();
    }
  }
});

// 支持滑动
let touchStartX = 0, touchStartY = 0;
tt.onTouchStart((res) => {
  touchStartX = res.touches[0].clientX;
  touchStartY = res.touches[0].clientY;
});

tt.onTouchEnd((res) => {
  if (gameState !== 'playing') return;
  
  const dx = res.changedTouches[0].clientX - touchStartX;
  const dy = res.changedTouches[0].clientY - touchStartY;
  
  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30 && direction !== 'left') nextDirection = 'right';
    else if (dx < -30 && direction !== 'right') nextDirection = 'left';
  } else {
    if (dy > 30 && direction !== 'up') nextDirection = 'down';
    else if (dy < -30 && direction !== 'down') nextDirection = 'up';
  }
});

// 初始化
drawStartScreen();

console.log('🐍 康泰园贪吃蛇 V3 - 立体设计版已启动！');