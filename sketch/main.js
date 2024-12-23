// 종횡비를 고정하고 싶을 경우: 아래 두 변수를 0이 아닌 원하는 종, 횡 비율값으로 설정.
// 종횡비를 고정하고 싶지 않을 경우: 아래 두 변수 중 어느 하나라도 0으로 설정.
const aspectW = 4; // 가로 비율
const aspectH = 3; // 세로 비율

// html에서 클래스명이 container-canvas인 첫 엘리먼트: 컨테이너 가져오기.
const container = document.body.querySelector('.container-canvas');
// 필요에 따라 이하에 변수 생성.
let strings = [];
let shapes = [];
let particles = [];
let video;
let handPose;
// let connections;
let hands = [];

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();

  // 종횡비가 설정되지 않은 경우:
  // 컨테이너의 크기와 일치하도록 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  if (aspectW === 0 || aspectH === 0) {
    createCanvas(containerW, containerH).parent(container);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 클 경우:
  // 컨테이너의 세로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else if (containerW / containerH > aspectW / aspectH) {
    createCanvas((containerH * aspectW) / aspectH, containerH).parent(
      container
    );
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 작거나 같을 경우:
  // 컨테이너의 가로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else {
    createCanvas(containerW, (containerW * aspectH) / aspectW).parent(
      container
    );
  }

  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();

  handPose.detectStart(video, gotHands);
  painting = createGraphics(width, height);
  painting.background(0);
  // connections = bodyPose.getSkeleton();
  // console.log(connections);

  init(); // 초기화 함수 호출
  // createCanvas를 제외한 나머지 구문을 여기 혹은 init()에 작성.
}

// windowResized()에서 setup()에 준하는 구문을 실행해야할 경우를 대비해 init이라는 명칭의 함수를 만들어 둠.
function init() {
  const centerY = height / 2;
  const spacing = 65;
  strings = [];

  for (let i = -2.5; i <= 2.5; i++) {
    strings.push({
      x1: 0,
      y1: centerY + i * spacing,
      x2: width,
      y2: centerY + i * spacing,
      offset: 0,
      damping: 0,
      velocity: 0,
      glow: 0,
      baseColor: color(255),
      shapeType: shapeForString(i),
    });
  }
}

function shapeForString(i) {
  if (i <= -2) {
    return 'circle'; // 첫번째 줄 동그라미
  } else if (i <= -1) {
    return 'triangle'; // 두번째 줄 삼각형
  } else if (i <= 0) {
    return 'square'; // 세번째 줄 사각형
  } else if (i <= 1) {
    return 'ellipse'; // 네번째 줄 타원
  } else if (i <= 2) {
    return 'star'; // 다섯번째 줄 별
  } else {
    return 'arch'; // 여섯번째 줄 아치형 곡선
  }
}

function draw() {
  // console.log(`Frame rate: ${frameRate()}`); // 현재 프레임레이트 출력
  background(0);
  // image(video, 0, 0, width, height);

  painting.clear();

  //handpose 상호작용
  if (hands.length > 0) {
    let hand = hands[0];
    let index = hand.index_finger_tip;
    let thumb = hand.thumb_tip;

    painting.noStroke();
    // painting.fill(255, 0, 255);
    let d = dist(index.x, index.y, thumb.x, thumb.y);

    if (d < 20) {
      painting.fill(255);
    }
    let x = (index.x + thumb.x) * 0.5;
    let y = (index.y + thumb.y) * 0.5;

    //기타 피크
    let size = 30;
    let angle = TWO_PI / 3;
    let radius = size / sqrt(3);

    let points = [];
    for (let i = 0; i < 3; i++) {
      let px = x + radius * cos(angle * i);
      let py = y + radius * sin(angle * i);
      points.push(createVector(px, py));
    }

    painting.beginShape();
    for (let i = 0; i < 3; i++) {
      let p = points[i];
      painting.vertex(p.x, p.y);
    }
    painting.endShape(CLOSE);

    // painting.circle(x, y, 20);
    // painting.circle(index.x, index.y, 16);
    // painting.circle(thumb.x, thumb.y, 16);

    // 줄과 상호작용
    for (let i = 0; i < strings.length; i++) {
      let string = strings[i];
      let centerY = (string.y1 + string.y2) / 2;

      if (abs(x - centerY) < 40) {
        string.offset = y - centerY;
        string.velocity = (pmouseY - mouseY) * 0.3;
      }
    }
  }

  image(painting, 0, 0);

  // 줄 그리기
  for (let i = 0; i < strings.length; i++) {
    let string = strings[i];
    let stringColor = string.baseColor;

    if (abs(string.offset) > 0.1 || abs(string.velocity) > 0.1) {
      string.velocity += -string.offset * 0.25; // 복원력
      string.velocity *= 0.95; // 감쇠력
      string.offset += string.velocity;

      if (frameCount % 30 === 0 && abs(string.velocity) > 0.5) {
        createShapeForString(i, string);
      }

      stringColor = pastelColor(i);
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

  // 도형 그리기
  shapes = shapes.filter((shape) => {
    shape.lifetime -= deltaTime / 1000;
    if (shape.lifetime <= 0) return false;

    shape.x += shape.vx;
    shape.y += shape.vy;

    drawShape(shape);
    return true;
  });

  // 파티클 그리기
  particles.push(new Particle());
  for (let i = 0; i < particles.length; i++) {
    particles[i].show();
  }
  particles = particles.filter((p) => p.lifetime > 0);
}

function createShapeForString(index, string) {
  const shapeType = string.shapeType;
  const shapeColor = pastelColor(index);
  const size = random(10, 27);
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
  const alpha = map(shape.lifetime, 0, 2, 0, 255); // lifetime 범위에 따라 0~255로 변환
  fill(red(shape.color), green(shape.color), blue(shape.color), alpha); // 색상에 투명도 추가
  noStroke();
  drawingContext.shadowBlur = 50;
  drawingContext.shadowColor = color(
    red(shape.color),
    green(shape.color),
    blue(shape.color),
    alpha
  );

  // fill(shape.color);
  // noStroke();
  // drawingContext.shadowBlur = 50;
  // drawingContext.shadowColor = shape.color;

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
      star(shape.x, shape.y, shape.size / 2, shape.size, 5);
      break;
    case 'arch':
      arch(shape.x, shape.y, shape.size);
      break;
  }
}

// 별 그리기
function star(x, y, radius1, radius2, npoints) {
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
function arch(x, y, size) {
  noFill();
  stroke(0, 255, 255);
  strokeWeight(4);
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

// 도형 색상
function pastelColor(index) {
  const baseColors = [
    [255, 230, 150], // 노란색
    [255, 180, 180], // 빨간색
    [180, 180, 255], // 파란색
    [180, 180, 255], // 보라색
    [180, 255, 180], // 초록색
    [0, 255, 255], // 민트색
  ];
  const base = baseColors[index % baseColors.length];

  if (index === 3) {
    return color(0, 255, 255, 200);
  }

  return color(base[0], base[1], base[2], 200);
}

//마우스 상호작용
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
  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();

  // 종횡비가 설정되지 않은 경우:
  // 컨테이너의 크기와 일치하도록 캔버스 크기를 조정.
  if (aspectW === 0 || aspectH === 0) {
    resizeCanvas(containerW, containerH);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 클 경우:
  // 컨테이너의 세로길이에 맞춰 종횡비대로 캔버스 크기를 조정.
  else if (containerW / containerH > aspectW / aspectH) {
    resizeCanvas((containerH * aspectW) / aspectH, containerH);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 작거나 같을 경우:
  // 컨테이너의 가로길이에 맞춰 종횡비대로 캔버스 크기를 조정.
  else {
    resizeCanvas(containerW, (containerW * aspectH) / aspectW);
  }

  // 위 과정을 통해 캔버스 크기가 조정된 경우, 다시 처음부터 그려야할 수도 있다.
  // 이런 경우 setup()의 일부 구문을 init()에 작성해서 여기서 실행하는게 편리하다.
  // init();
}
