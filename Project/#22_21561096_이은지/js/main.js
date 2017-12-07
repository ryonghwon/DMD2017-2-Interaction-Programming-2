/**
 * Vars
 */
var points = [];
var rafID = null;

var guiVars = function() {
  this.totalPoints = 6;
  this.viscosity = 20;
  this.mouseDist = 80;
  this.damping = 0.15;
  this.showIndicators = false;
  this.leftColor = '#a8d0e6';
  this.rightColor = '#f76c6c';
}
var vars = new guiVars();

window.onload = function() {
  var gui = new dat.GUI();
  gui.add(vars, 'showIndicators');
  var controller = gui.add(vars, 'totalPoints', 2, 20).step(1);
  gui.add(vars, 'viscosity', 10, 500);
  gui.add(vars, 'mouseDist', 20, 400);
  gui.add(vars, 'damping', 0.01, 0.5);
  gui.addColor(vars, 'leftColor');
  gui.addColor(vars, 'rightColor');

  controller.onChange(function() {
    cancelAnimationFrame(rafID);
    initArticle();
  });
};

/**
 * Mouse handler
 */
var mouseX = 0,
  mouseY = 0,
  mouseLastX = 0,
  mouseLastY = 0,
  mouseDirectionX = 0,
  mouseDirectionY = 0,
  mouseSpeedX = 0,
  mouseSpeedY = 0;

// Get mouse direction
function mouseDirection(e) {
  if (mouseX < e.pageX)
    mouseDirectionX = 1;
  else if (mouseX > e.pageX)
    mouseDirectionX = -1;
  else
    mouseDirectionX = 0;

  if (mouseY < e.pageY)
    mouseDirectionY = 1;
  else if (mouseY > e.pageY)
    mouseDirectionY = -1;
  else
    mouseDirectionY = 0;

  mouseX = e.pageX;
  mouseY = e.pageY;
}
$(document).on('mousemove', mouseDirection);

// Get mouse speed
function mouseSpeed() {
  mouseSpeedX = mouseX - mouseLastX;
  mouseSpeedY = mouseY - mouseLastY;

  mouseLastX = mouseX;
  mouseLastY = mouseY;

  setTimeout(mouseSpeed, 50);
}
mouseSpeed();

/**
 * Point
 */
function Point(x, y, article) {
  this.x = x;
  this.ix = x;
  this.vx = 0;
  this.cx = 0;
  this.y = y;
  this.iy = y;
  this.cy = 0;
  this.article = article;
}

Point.prototype.move = function() {
  this.vx += (this.ix - this.x) / vars.viscosity;

  var dx = this.ix - mouseX,
    dy = this.y - mouseY;

  var gap = this.article.data('gap');

  // Move point only when leaving color block
  if ((mouseDirectionX > 0 && mouseX > this.x) || (mouseDirectionX < 0 && mouseX < this.x)) {
    if (Math.sqrt(dx * dx) < vars.mouseDist && Math.sqrt(dy * dy) < gap) {
      this.vx = mouseSpeedX / 8
    }
  }

  this.vx *= (1 - vars.damping);
  this.x += this.vx;
};

/**
 * Init 
 */
function initArticle() {
  var article = $('article');
  var context = article.get(0).getContext('2d');

  cancelAnimationFrame(rafID);

  // Resize 
  $('article').get(0).width = $(window).width();
  $('article').get(0).height = $(window).height();

  // Add points
  points = [];
  var gap = (article.height()) / (vars.totalPoints - 1);
  var pointX = $(window).width() / 2;

  for (var i = 0; i <= vars.totalPoints - 1; i++)
    points.push(new Point(pointX, i * gap, article));

  // Start render
  renderArticle();

  article.data('gap', gap);
}

/**
 * Render canvas
 */
function renderArticle() {
  var article = $('article');
  var context = article.get(0).getContext('2d');

  // rAF
  rafID = requestAnimationFrame(renderArticle);

  // Clear scene
  context.clearRect(0, 0, article.width(), article.height());
  context.fillStyle = vars.leftColor;
  context.fillRect(0, 0, article.width(), article.height());

  // Move points
  for (var i = 0; i <= vars.totalPoints - 1; i++)
    points[i].move();

  // Draw shape
  context.fillStyle = vars.rightColor;
  context.strokeStyle = vars.rightColor;
  context.lineWidth = 1;
  context.beginPath();

  context.moveTo($(window).width() / 2, 0);

  for (var i = 0; i <= vars.totalPoints - 1; i++) {
    var p = points[i];

    if (points[i + 1] != undefined) {
      p.cx = (p.x + points[i + 1].x) / 2 - 0.0001; // - 0.0001 hack to fix a 1px offset bug on Chrome...
      p.cy = (p.y + points[i + 1].y) / 2;
    } else {
      p.cx = p.ix;
      p.cy = p.iy;
    }
    
    context.bezierCurveTo(p.x, p.y, p.cx, p.cy, p.cx, p.cy);
  }

  context.lineTo($(window).width(), $(window).height());
  context.lineTo($(window).width(), 0);
  context.closePath();
  context.fill();

  if (vars.showIndicators) {
    // Draw points
    context.fillStyle = '#000';
    context.beginPath();
    for (var i = 0; i <= vars.totalPoints - 1; i++) {
      var p = points[i];

      context.rect(p.x - 2, p.y - 2, 4, 4);
    }
    context.fill();

    // Draw controls
    context.fillStyle = '#fff';
    context.beginPath();
    for (var i = 0; i <= vars.totalPoints - 1; i++) {
      var p = points[i];

      context.rect(p.cx - 1, p.cy - 1, 2, 2);
    }
    context.fill();
  }
}

/**
 * Resize handler
 */
function resizeHandler() {
  initArticle();
}
$(window).on('resize', resizeHandler).trigger('resize');