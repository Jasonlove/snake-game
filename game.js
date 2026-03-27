/**
 * 贪吃蛇小游戏 V2 - 抖音小游戏版
 * 康泰园主题 - 带方向键控制 + 蛇颜色进化
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
  rows: Math.floor((windowHeight - 320) / 22),  // 留出顶部和底部空间
  speed: 180,
  playAreaTop: 100,
  playAreaBottom: 180,  // 底部控制区高度
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
let foodEaten = 0;  // 吃了多少个食物
let currentEvolution = SNAKE_EVOLUTION[0];

// 背景图
let bgImage = null;
try {
  bgImage = tt.createImage();
  bgImage.src = 'assets/bg.png';
} catch (e) {}

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

// ============== 生成食物 ==============
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

// ============== 检查进化 ==============
function checkEvolution() {
  for (let i = SNAKE_EVOLUTION.length - 1; i >= 0; i--) {
    if (foodEaten >= SNAKE_EVOLUTION[i].threshold) {
      if (currentEvolution !== SNAKE_EVOLUTION[i]) {
        currentEvolution = SNAKE_EVOLUTION[i];
        // 进化提示
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
    
    // 加速
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

// 绘制背景
function drawBackground() {
  if (bgImage && bgImage.complete) {
    ctx.drawImage(bgImage, 0, 0, windowWidth, windowHeight);
  } else {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, windowHeight);
    gradient.addColorStop(0, '#e8f5e9');
    gradient.addColorStop(1, '#c8e6c9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, windowWidth, windowHeight);
  }
}

// 绘制游戏区域
function drawPlayArea() {
  // 半透明背景
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(PLAY_LEFT - 8, PLAY_TOP - 8, COLS * GRID_SIZE + 16, ROWS * GRID_SIZE + 16);
  
  // 边框
  ctx.strokeStyle = currentEvolution.color;
  ctx.lineWidth = 3;
  ctx.strokeRect(PLAY_LEFT - 5, PLAY_TOP - 5, COLS * GRID_SIZE + 10, ROWS * GRID_SIZE + 10);
  
  // 网格
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
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

// 绘制食物
function drawFood() {
  const x = PLAY_LEFT + food.x * GRID_SIZE + GRID_SIZE / 2;
  const y = PLAY_TOP + food.y * GRID_SIZE + GRID_SIZE / 2;
  const r = GRID_SIZE / 2 - 3;
  
  // 光晕
  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // 高光
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(x - r/3, y - r/3, r/3, 0, Math.PI * 2);
  ctx.fill();
}

// 绘制蛇
function drawSnake() {
  const { color, headColor, glow } = currentEvolution;
  
  snake.forEach((seg, index) => {
    const x = PLAY_LEFT + seg.x * GRID_SIZE + 2;
    const y = PLAY_TOP + seg.y * GRID_SIZE + 2;
    const w = GRID_SIZE - 4;
    const h = GRID_SIZE - 4;
    
    if (index === 0) {
      // 蛇头
      if (glow) {
        ctx.shadowColor = headColor;
        ctx.shadowBlur = 15;
      }
      ctx.fillStyle = headColor;
      roundRect(ctx, x, y, w, h, 7);
      ctx.shadowBlur = 0;
      
      // 眼睛
      ctx.fillStyle = '#fff';
      const eyeR = 3;
      let eye1X, eye1Y, eye2X, eye2Y;
      
      switch (direction) {
        case 'right':
          eye1X = x + w - 5; eye1Y = y + 5;
          eye2X = x + w - 5; eye2Y = y + h - 5;
          break;
        case 'left':
          eye1X = x + 5; eye1Y = y + 5;
          eye2X = x + 5; eye2Y = y + h - 5;
          break;
        case 'up':
          eye1X = x + 5; eye1Y = y + 5;
          eye2X = x + w - 5; eye2Y = y + 5;
          break;
        case 'down':
          eye1X = x + 5; eye1Y = y + h - 5;
          eye2X = x + w - 5; eye2Y = y + h - 5;
          break;
      }
      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, eyeR, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, eyeR, 0, Math.PI * 2);
      ctx.fill();
      
      // 瞳孔
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, 1.5, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 蛇身
      ctx.fillStyle = color;
      roundRect(ctx, x, y, w, h, 5);
      
      // 身体花纹
      if (index % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 3);
      }
    }
  });
}

// 绘制顶部信息栏
function drawTopBar() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(0, 0, windowWidth, 85);
  
  // 分数
  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`分数: ${score}`, 20, 30);
  
  ctx.font = '14px Arial';
  ctx.fillStyle = '#666';
  ctx.fillText(`最高: ${highScore}`, 20, 52);
  
  // 蛇形态
  ctx.fillStyle = currentEvolution.color;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(currentEvolution.name, windowWidth - 20, 30);
  
  ctx.font = '12px Arial';
  ctx.fillStyle = '#999';
  ctx.fillText(`已吃: ${foodEaten}`, windowWidth - 20, 52);
}

// ============== 方向键控制 ==============
const CONTROL_Y = windowHeight - 160;
const BTN_SIZE = 55;
const BTN_GAP = 5;

// 按钮位置
const BUTTONS = {
  up:    { x: windowWidth / 2 - BTN_SIZE / 2, y: CONTROL_Y },
  down:  { x: windowWidth / 2 - BTN_SIZE / 2, y: CONTROL_Y + BTN_SIZE * 2 + BTN_GAP },
  left:  { x: windowWidth / 2 - BTN_SIZE * 1.5 - BTN_GAP, y: CONTROL_Y + BTN_SIZE + BTN_GAP },
  right: { x: windowWidth / 2 + BTN_SIZE / 2 + BTN_GAP, y: CONTROL_Y + BTN_SIZE + BTN_GAP }
};

function drawControls() {
  // 控制区背景
  ctx.fillStyle = 'rgba(245, 245, 245, 0.95)';
  ctx.fillRect(0, CONTROL_Y - 20, windowWidth, 180);
  
  // 方向键
  Object.entries(BUTTONS).forEach(([dir, pos]) => {
    const isActive = direction === dir;
    
    // 按钮背景
    ctx.fillStyle = isActive ? currentEvolution.color : '#ddd';
    roundRect(ctx, pos.x, pos.y, BTN_SIZE, BTN_SIZE, 12);
    
    // 箭头
    ctx.fillStyle = isActive ? '#fff' : '#666';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const arrowMap = { up: '▲', down: '▼', left: '◀', right: '▶' };
    ctx.fillText(arrowMap[dir], pos.x + BTN_SIZE / 2, pos.y + BTN_SIZE / 2);
  });
  
  ctx.textBaseline = 'alphabetic';
}

// 检查按钮点击
function checkButtonPress(x, y) {
  for (const [dir, pos] of Object.entries(BUTTONS)) {
    if (x >= pos.x && x <= pos.x + BTN_SIZE &&
        y >= pos.y && y <= pos.y + BTN_SIZE) {
      // 防止反向移动
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
  drawBackground();
  drawPlayArea();
  drawFood();
  drawSnake();
  drawTopBar();
  drawControls();
}

function drawStartScreen() {
  drawBackground();
  
  // 标题
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(windowWidth / 2 - 140, windowHeight / 2 - 150, 280, 280, 20);
  
  ctx.fillStyle = currentEvolution.color;
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🐍 康泰园贪吃蛇', windowWidth / 2, windowHeight / 2 - 90);
  
  ctx.fillStyle = '#666';
  ctx.font = '14px Arial';
  ctx.fillText('点击方向键控制蛇移动', windowWidth / 2, windowHeight / 2 - 40);
  ctx.fillText('每吃10个食物，蛇会进化变色！', windowWidth / 2, windowHeight / 2 - 15);
  
  // 进化预览
  ctx.fillStyle = '#999';
  ctx.font = '12px Arial';
  ctx.fillText('进化路线:', windowWidth / 2, windowHeight / 2 + 20);
  ctx.font = '11px Arial';
  ctx.fillText('小青蛇 → 蓝蛇 → 紫蛇 → 金蛇', windowWidth / 2, windowHeight / 2 + 40);
  ctx.fillText('→ 玫瑰蛇 → 火焰蛇 → 金龙蛇', windowWidth / 2, windowHeight / 2 + 58);
  
  // 开始按钮
  ctx.fillStyle = '#4CAF50';
  roundRect(ctx, windowWidth / 2 - 60, windowHeight / 2 + 80, 120, 45, 10);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('开始游戏', windowWidth / 2, windowHeight / 2 + 108);
  
  // 最高分
  try {
    const savedHigh = tt.getStorageSync('snake_highscore');
    if (savedHigh) {
      highScore = savedHigh;
      ctx.fillStyle = '#ff9800';
      ctx.font = '14px Arial';
      ctx.fillText(`最高分: ${highScore}`, windowWidth / 2, windowHeight / 2 + 145);
    }
  } catch (e) {}
}

function drawGameOver() {
  draw();
  
  // 遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, windowWidth, windowHeight);
  
  // 面板
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  roundRect(ctx, windowWidth / 2 - 130, windowHeight / 2 - 120, 260, 240, 20);
  
  ctx.fillStyle = '#f44336';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('游戏结束', windowWidth / 2, windowHeight / 2 - 70);
  
  ctx.fillStyle = '#333';
  ctx.font = '22px Arial';
  ctx.fillText(`得分: ${score}`, windowWidth / 2, windowHeight / 2 - 25);
  
  ctx.fillStyle = currentEvolution.color;
  ctx.font = '16px Arial';
  ctx.fillText(`最终形态: ${currentEvolution.name}`, windowWidth / 2, windowHeight / 2 + 5);
  ctx.fillText(`吃了 ${foodEaten} 个食物`, windowWidth / 2, windowHeight / 2 + 30);
  
  if (score >= highScore && score > 0) {
    ctx.fillStyle = '#ff9800';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('🎉 新纪录！', windowWidth / 2, windowHeight / 2 + 60);
  }
  
  // 再来一局按钮
  ctx.fillStyle = '#4CAF50';
  roundRect(ctx, windowWidth / 2 - 60, windowHeight / 2 + 75, 120, 45, 10);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('再来一局', windowWidth / 2, windowHeight / 2 + 103);
}

// ============== 触摸事件 ==============
tt.onTouchStart((res) => {
  const touch = res.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;
  
  if (gameState === 'playing') {
    checkButtonPress(x, y);
  } else if (gameState === 'start') {
    // 开始按钮
    if (x >= windowWidth / 2 - 60 && x <= windowWidth / 2 + 60 &&
        y >= windowHeight / 2 + 80 && y <= windowHeight / 2 + 125) {
      startGame();
    }
  } else if (gameState === 'gameover') {
    // 再来一局按钮
    if (x >= windowWidth / 2 - 60 && x <= windowWidth / 2 + 60 &&
        y >= windowHeight / 2 + 75 && y <= windowHeight / 2 + 120) {
      startGame();
    }
  }
});

// 支持滑动（可选）
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
if (bgImage) {
  bgImage.onload = drawStartScreen;
  bgImage.onerror = drawStartScreen;
} else {
  drawStartScreen();
}

console.log('🐍 康泰园贪吃蛇 V2 - 已启动！');