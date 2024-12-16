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
      glow: 0, // 글로우 효과 강도
      baseColor: color(255), // 기본 색상 (흰색)
      shapeType: getShapeForRow(i), // 각 줄에 해당하는 도형 설정
    });
  }
}

function getShapeForRow(i) {
  // 각 줄에 해당하는 도형 타입 설정 (두 줄에 한 종류)
  if (i <= -2) {
    return 'circle'; // 첫 번째 줄은 동그라미
  } else if (i <= -1) {
    return 'triangle'; // 두 번째 줄은 삼각형
  } else if (i <= 0) {
    return 'square'; // 세 번째 줄은 네모
  } else if (i <= 1) {
    return 'ellipse'; // 네 번째 줄은 타원형
  } else if (i <= 2) {
    return 'star'; // 다섯 번째 줄은 별 모양
  } else {
    return 'arch'; // 여섯 번째 줄은 아치형 곡선
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

      // 진동 중일 때 줄 색상 변경
      stringColor = getPastelColor(i);
      string.glow = 255; // 글로우 효과 최대치
    } else {
      string.offset = 0;
      string.velocity = 0;

      // 글로우 효과 서서히 감소
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
  particles = particles.filter((p) => p.lifetime > 0); // 수명이 다한 파티클 제거
}

function createShapeForString(index, string) {
  const shapeType = string.shapeType; // 각 줄에 설정된 도형 타입 사용
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
      ellipse(shape.x, shape.y, shape.size * 1.5, shape.size); // 타원형
      break;
    case 'star':
      drawStar(shape.x, shape.y, shape.size / 2, shape.size, 5); // 별 모양
      break;
    case 'arch':
      drawArch(shape.x, shape.y, shape.size); // 아치형 곡선
      break;
  }
}

// 별 모양을 그리는 함수
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

// 아치형 곡선을 그리는 함수
function drawArch(x, y, size) {
  noFill();
  stroke(0, 255, 255); // 민트색으로 아치형 곡선 색상 설정
  strokeWeight(2);
  beginShape();
  for (let i = -size / 2; i <= size / 2; i++) {
    // 아치형 곡선 방정식
    let yOffset = sqrt(size * size - i * i); // 원의 방정식 사용
    vertex(x + i, y - yOffset);
  }
  endShape();
}

class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.lifetime = 3; // 파티클 수명 (초)
  }
  show() {
    this.lifetime -= deltaTime / 1000;
    noStroke();
    fill(255, 255 * (this.lifetime / 3));

    // 파티클 크기 줄이기 (기존 4에서 크기 변경)
    ellipse(this.pos.x, this.pos.y, 2); // 크기를 2로 줄임
  }
}

// 줄 및 도형에 사용할 파스텔 색상 생성
function getPastelColor(index) {
  const baseColors = [
    [255, 230, 150], // 노란색 계열
    [255, 180, 180], // 빨간색 계열
    [180, 180, 255], // 파란색 계열
    [180, 180, 255], // 보라색 계열
    [180, 255, 180], // 초록색 계열
    [0, 255, 255], // 민트색
  ];
  const base = baseColors[index % baseColors.length];

  // 6번째 줄일 경우 민트색 반환
  if (index === 3) {
    return color(0, 255, 255, 200); // 민트색 (RGB: 0, 255, 255)
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
