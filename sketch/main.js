const aspectW = 4; // 가로 비율
const aspectH = 3; // 세로 비율

// html에서 클래스명이 container-canvas인 첫 엘리먼트: 컨테이너 가져오기.
const container = document.body.querySelector('.container-canvas');
let strings = []; // 문자열들을 저장할 배열
let shapes = []; // 생성될 도형들을 저장할 배열
let particles = []; // 파티클 배열 초기화

function setup() {
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();

  if (aspectW === 0 || aspectH === 0) {
    createCanvas(containerW, containerH).parent(container);
  } else if (containerW / containerH > aspectW / aspectH) {
    createCanvas((containerH * aspectW) / aspectH, containerH).parent(
      container
    );
  } else {
    createCanvas(containerW, (containerW * aspectH) / aspectW).parent(
      container
    );
  }

  init();
}

function init() {
  const centerY = height / 2;
  const spacing = 60;
  strings = [];
  for (let i = -2.5; i <= 2.5; i++) {
    strings.push({
      x1: 0,
      y1: centerY + i * spacing,
      x2: width,
      y2: centerY + i * spacing,
      offset: 0,
      velocity: 0,
      glow: 0,
      baseColor: color(255),
      shapeType: getShapeForRow(i),
    });
  }
}

function getShapeForRow(i) {
  if (i <= -2) {
    return 'circle'; // 첫 번째 줄 동그라미
  } else if (i <= -1) {
    return 'triangle'; // 두 번째 줄 삼각형
  } else if (i <= 0) {
    return 'square'; // 세 번째 줄 네모
  } else if (i <= 1) {
    return 'ellipse'; // 네 번째 줄 타원
  } else if (i <= 2) {
    return 'star'; // 다섯 번째 줄 별
  } else {
    return 'arch'; // 여섯 번째 줄 아치형 곡선
  }
}

function draw() {
  background('black');

  // Draw strings
  for (let i = 0; i < strings.length; i++) {
    let string = strings[i];
    let stringColor = string.baseColor;

    if (abs(string.offset) > 0.1 || abs(string.velocity) > 0.1) {
      string.velocity += -string.offset * 0.35;
      string.velocity *= 0.95;
      string.offset += string.velocity;

      if (frameCount % 30 === 0 && abs(string.velocity) > 0.5) {
        createShapeForString(i, string);
      }

      stringColor = getPastelColor(i);
      string.glow = 255;
    } else {
      string.offset = 0;
      string.velocity = 0;

      string.glow = max(0, string.glow - 5);
    }

    let centerY = (string.y1 + string.y2) / 2;
    let controlY = centerY + string.offset;

    noFill();
    strokeWeight(4);
    stroke(stringColor);
    drawingContext.shadowBlur = string.glow;
    drawingContext.shadowColor = stringColor;
    beginShape();
    vertex(string.x1, string.y1);
    quadraticVertex(width / 2, controlY, string.x2, string.y2);
    endShape();
  }

  // Update and draw shapes
  shapes = shapes.filter((shape) => {
    shape.lifetime -= deltaTime / 1000;
    if (shape.lifetime <= 0) return false;

    shape.x += shape.vx;
    shape.y += shape.vy;

    drawShape(shape);
    return true;
  });

  // Update and draw particles
  particles.push(new Particle());
  for (let i = 0; i < particles.length; i++) {
    particles[i].show();
  }
  particles = particles.filter((p) => p.lifetime > 0);
}

function createShapeForString(index, string) {
  const shapeType = string.shapeType;
  const shapeColor = getPastelColor(index);
  const size = random(10, 30);
  const lifetime = random(2, 4);

  shapes.push({
    type: shapeType,
    x: width / 2,
    y: (string.y1 + string.y2) / 2 + string.offset,
    vx: random(-1, 1) * 2,
    vy: random(-1, 1) * 2,
    size: size,
    lifetime: lifetime,
    color: shapeColor,
  });
}

function drawShape(shape) {
  fill(shape.color);
  noStroke();
  drawingContext.shadowBlur = 50;
  drawingContext.shadowColor = shape.color;

  switch (shape.type) {
    case 'circle':
      ellipse(shape.x, shape.y, shape.size);
      break;
    case 'triangle':
      triangle(
        shape.x,
        shape.y - shape.size / 2,
        shape.x - shape.size / 2,
        shape.y + shape.size / 2,
        shape.x + shape.size / 2,
        shape.y + shape.size / 2
      );
      break;
    case 'square':
      rectMode(CENTER);
      rect(shape.x, shape.y, shape.size, shape.size);
      break;
    case 'ellipse':
      ellipse(shape.x, shape.y, shape.size * 1.5, shape.size);
      break;
    case 'star':
      drawStar(shape.x, shape.y, shape.size / 2, shape.size, 5);
      break;
    case 'arch':
      drawArch(shape.x, shape.y, shape.size);
      break;
  }
}

// 별 그리기기
function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = -PI / 2; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// 아치형 곡선 그리기
function drawArch(x, y, size) {
  noFill();
  stroke(0, 255, 255);
  strokeWeight(2);
  beginShape();
  for (let i = -size / 2; i <= size / 2; i++) {
    let yOffset = sqrt(size * size - i * i);
    vertex(x + i, y - yOffset);
  }
  endShape();
}

class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.lifetime = 3;
  }
  show() {
    this.lifetime -= deltaTime / 1000;
    noStroke();
    fill(255, 255 * (this.lifetime / 3));

    ellipse(this.pos.x, this.pos.y, 2);
  }
}

// 줄 및 도형에 사용할 파스텔 색상 생성
function getPastelColor(index) {
  const baseColors = [
    [255, 230, 150], // 노란색
    [255, 180, 180], // 빨간색
    [180, 180, 255], // 파란색
    [180, 180, 255], // 보라색
    [180, 255, 180], // 초록색
    [0, 255, 255], // 민트색
  ];
  const base = baseColors[index % baseColors.length];

  // 6번째 줄일 경우 민트색 반환
  if (index === 3) {
    return color(0, 255, 255, 200);
  }

  return color(base[0], base[1], base[2], 200);
}

function mouseDragged() {
  for (let i = 0; i < strings.length; i++) {
    let string = strings[i];
    let centerY = (string.y1 + string.y2) / 2;

    if (abs(mouseY - centerY) < 40) {
      string.offset = mouseY - centerY;
      string.velocity = (pmouseY - mouseY) * 0.3;
    }
  }
}

function windowResized() {
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();

  if (aspectW === 0 || aspectH === 0) {
    resizeCanvas(containerW, containerH);
  } else if (containerW / containerH > aspectW / aspectH) {
    resizeCanvas((containerH * aspectW) / aspectH, containerH);
  } else {
    resizeCanvas(containerW, (containerW * aspectH) / aspectW);
  }
}
