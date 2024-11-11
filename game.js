// Postavljanje Canvas i context elementa
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Varijable za igricu
const paddleWidth = 120;
const paddleHeight = 20;
const paddleSpeed = 8;
const ballRadius = 10;

let bricks = [];
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let isGameOver = false;

// Objekt palice
const paddle = {
  x: canvas.width / 2 - paddleWidth / 2,
  y: canvas.height - 30,
  width: paddleWidth,
  height: paddleHeight,
  dx: 0
};

// objekt lopte
const ball = {
  x: canvas.width / 2,
  y: canvas.height - 40,
  radius: ballRadius,
  speed: 4,
  dx: 3 * (Math.random() > 0.5 ? 1 : -1),
  dy: -3
};

// Konfiguracija cigli
// Koliko redova, koliko cigli po redu, koliko je svaka cigla široka, visoka
// i koliko su cigle udaljene od vrha ekrana
const brickRowCount = 3;
const brickColumnCount = 7;
const brickWidth = 120;
const brickHeight = 40;
const brickPadding = 15;
const brickOffsetTop = 40;
const brickOffsetLeft = (canvas.width - (brickColumnCount * (brickWidth + brickPadding))) / 2;

// Stvori sve cigle i oboji ih u gradijentu
// kako se spuštamo niz redove, tako postaju tamnije
// Dvije petlje se vrte prvo po svakom retku potpom po svakom stupcu i postavljaju ciglu
// Lijevi offset svake cigle se računa tako što se zbroj širine i razmaka cigle pomnoži sa stupcem u kojem se cigla nalazi
// Gornji offset se računa tako što se red pomnoži sa zbrojem visine i razmaka cigle
function createBricks() {
  bricks = [];
  for (let row = 0; row < brickRowCount; row++) {
    bricks[row] = [];
    const rowColor = `rgb(${200 - row * 30}, ${200 - row * 30}, ${200 - row * 30})`;
    for (let col = 0; col < brickColumnCount; col++) {
      const x = brickOffsetLeft + col * (brickWidth + brickPadding);
      const y = brickOffsetTop + row * (brickHeight + brickPadding);
      bricks[row][col] = { x, y, width: brickWidth, height: brickHeight, color: rowColor, hit: false };
    }
  }
}

// Iscrtaj palicu
// Prvo palici damo sjenu koja je puna crna, sa 50% prozirnosti te sjenu pomaknemo za 3 piksela u x i y osi
// Onda iscrtamo palicu sa ctx.fillRect
// Nakon toga moramo resetirati sjene, budući da su one persistent i svi ostali elementi bi dobili istu sjenu,
// a to ne želimo
function drawPaddle() {
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";  
    ctx.shadowBlur = 10;                     
    ctx.shadowOffsetX = 3;                   
    ctx.shadowOffsetY = 3;                   
    ctx.fillStyle = "#FF0000";              
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  
    // Reset shadow for other elements
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

// Iscrtaj loptu
// BeginPath stvara novi put, koji neće biti spojen za ikakav objekt koji je već iscrtan na ekrtanu
// arc stvara krug, budući da kao parametre dobiva radijus kružnice i kao argumente za početni i krajnji kut dobiva 0 i 360 (u radijanima)
// fillstyle i fill poopune kružnicu bojom
// closePath zatvara put
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#00FF00";
  ctx.fill();
  ctx.closePath();
}

// Iscrtaj cigle
// Ponovno sa dcije petlje iscrtavamo cigle na ekran
// Cigla će biti iscrtana ako nije udarena
// Svakojh cigli dodajemo sjenu na isti način kao i palici, samo što ima veću prozirnost
function drawBricks() {
    bricks.forEach(row => {
      row.forEach(brick => {
        if (!brick.hit) {
          ctx.shadowColor = "rgba(0, 0, 0, 0.3)"; // Lighter shadow for bricks
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = brick.color;
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  
          // Reset shadow after each brick is drawn
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
      });
    });
  }

// Iscrtaj rezultat na ekran
// Ispisujemo na ekran trenutni rezultat i najveći rezultat
// Trenutni rezultat ispisujemo u gornjem lijevom kutu ekrana (canvasa)
// najveći dosadašnji rezultat ispisujemo u gornjem desnom kutu ekrana (canvasa)
function drawScore() {
  ctx.font = "20px Arial";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(`Score: ${score}`, 40, 40);
  ctx.fillText(`High Score: ${highScore}`, canvas.width - 165, 40);
}

// Detekcija kolizija
// Ovdje se pomoću x i y kooridnate lopte, te njenog polumjera provjerava da li je došlo do sudara
// Ako je pozicija lopte na skroz lijevoj strani ekrana onda joj x koordinata ne smije biti manja od polumjera
// Ako je pozicija lopte na srkoz desnoj strani ekrana, onda joj x koordinata u zbroju sa polumjerom ne smije biti veća od širine ekrana
// Ako je pozicija lopte na krajnje gornjem rubu ekrana, onda joj y koordinata od koje oduzmemo polumjer mora biti manja od 0
// Koliziju sa palicom detektiramo sa slično matematikom, samo što ne uzimamo širinu ekrana već poziciju i širinu ili visinu palice
// Kolizije sa ciglama detektiramo na isti način uz dodatak povećavanja rezultat za svaki udar s ciglom i podešavanja hit svojstva te cigle
function detectCollisions() {
  // Lopta i zidovi
  if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
    ball.dx *= -1;
  }
  if (ball.y - ball.radius < 0) {
    ball.dy *= -1;
  }

  // Lopta i palica
  if (ball.y + ball.radius > paddle.y &&
      ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
    ball.dy = -ball.dy;
    ball.y = paddle.y - ball.radius; // Ovo je dodano kako lopta ne bi "zapela" u palici
  }

  // Lopta i cigle
  bricks.forEach(row => {
    row.forEach(brick => {
      if (!brick.hit) {
        if (
          ball.x > brick.x &&
          ball.x < brick.x + brick.width &&
          ball.y > brick.y &&
          ball.y < brick.y + brick.height
        ) {
          ball.dy *= -1;
          brick.hit = true;
          score++;

          // Povećaj rezultat
          if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore);
          }

          // Provjeri jesu li sve cigle uništene
          if (score === brickRowCount * brickColumnCount) {
            alert("You Win!");
            isGameOver = true;
          }
        }
      }
    });
  });

  // uvijet za kraj igre (ako je y koordinata lopte+polumjer lopte veće od ukupne visine ekrana, to znači da je lopta udarila od donji rub)
  if (ball.y + ball.radius > canvas.height) {
    isGameOver = true;
    alert("GAME OVER");
  }
}

// Ažuriraj poziciju palice
function updatePaddle() {
  paddle.x += paddle.dx;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

// Ažuriraj poziciju lopte
function updateBall() {
  ball.x += ball.dx;
  ball.y += ball.dy;
}

// iscrtaj sve elemente
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPaddle();
  drawBall();
  drawBricks();
  drawScore();
}

// Glavna petlja
// Ovdje se pozivaju sve do sada definirane funkcije, uz dodatak requestAnimationFrame zakazuje sljedeći kadar, tako da imamo kretanje na ekranu
function update() {
  if (!isGameOver) {
    updatePaddle();
    updateBall();
    detectCollisions();
    draw();
    requestAnimationFrame(update);
  }
}

// Povezivanje kretanja palice sa tipkovnicom
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    paddle.dx = paddleSpeed;
  } else if (e.key === "ArrowLeft") {
    paddle.dx = -paddleSpeed;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    paddle.dx = 0;
  }
});

// Pali mašinu
createBricks();
update();
