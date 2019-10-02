console.log('Hello Adonis!')
//------------- BURNNING RUBBER GAME------------------//


//------------- User Storie/Game Logic------------------//

//--- When the user click START, the user should see their car in the game window and the timer should start running.
//--- The user will have to avoid the cars coming in the opposite directtion.
//--- the user will used the used the arrows to control the car 
//--- the User will get 5 points, everytime  he or she avoids an obstacle. 
//--- Each level is going last 40 sec. 
//--- the obstacle and the speed will increase as the levels gets higher. 
//--- If the driver crashes the level, timer and the scrore will reset and the game starts again.


//--- levels ----//

//--- level 1
//-- 10 cars
//--- level 2
//-- 20 cars
//--- level 3
//-- 30 cars
//--- level 4
//-- 40 cars
//--- level 5
//-- 50 cars 

//-------- event listener ---------//
 
$('#start').on('click', () => {
   console.log("I'm working!")
  
})
  
    
 


//----------- variables -----------//  
let canvas = document.getElementById("gameArea");
let ctx = canvas.getContext("2d");
let mainCarHeight = 10;
let mainCarWidth = 75;
let carX = (canvas.width-mainCarWidth) / 2;

//--keys variables--//-- They are false because the control buttons are not pressed//
// let rightPressed = false;
// let leftPressed = false;






//-------- function --------//


//----- main car start -------//

drawCar = () => {
    ctx.beginPath();
    // ctx.rect(carX, canvas.height-mainCarHeight, mainCarWidth, mainCarHeight);
    let img = new Image();
    img.src = "image/cars3.png";
    img.onload = () => {
        ctx.drawImage(img, 5, 40, 50, 50);
    }
    ctx.closePath();
}

//----- main car ends -------//

//----- other cars start ------// 
 obstacleCars = () => {
    ctx.beginPath();
    let yTruck = new Image();
    yTruck.src = "image/yellow_truck.png";
    yTruck.onload = () => {
        ctx.drawImage(yTruck, 80, 80, 50, 50);
    }
    ctx.closePath();

 }


//----- other cars end ------// 

obstacleCars();
drawCar();



