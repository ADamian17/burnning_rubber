
let canvas = document.querySelector("#myCanvas");
let context = canvas.getContext("2d");



var deltaX = 0;
var deltaY = 0;

window.addEventListener("keydown", keysPressed, false);
window.addEventListener("keyup", keysReleased, false);
 
var keys = [];
 
function keysPressed(e) {
    // store an entry for every key pressed
    keys[e.keyCode] = true;
 
    // left
    if (keys[37]) {
      deltaX -= 2;
    }
 
    // right
    if (keys[39]) {
      deltaX += 2;
    }
 
    // down
    if (keys[38]) {
      deltaY -= 2;
    }
 
    // up
    if (keys[40]) {
      deltaY += 2;
    }
 
    e.preventDefault();
 
    rectangulo();
}
 
function keysReleased(e) {
    // mark keys that were released
    keys[e.keyCode] = false;
}       
 
function rectangulo() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  // the triangle
  context.beginPath();
  context.moveTo(200 + deltaX, 100 + deltaY);
  context.lineTo(170 + deltaX, 150 + deltaY);
  context.lineTo(230 + deltaX, 150 + deltaY);
  context.closePath();
 

  // the outline
  context.lineWidth = 20;
  context.strokeStyle = "rgba(102, 102, 102, 1)";
  context.stroke();
 
  // the fill color
  context.fillStyle = "";
  context.fill();

  var f1Car = document.getElementById("#raceCar");
  con.drawImage(f1Car 0, 0, 50, 50);
  var image2 = new Image();

}

rectangulo();