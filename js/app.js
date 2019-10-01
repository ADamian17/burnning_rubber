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
gameStart();
});

//----------- functions -----------//



const gameStart = (event) => {
    let canvas = document.getElementById("gameArea");
    var mainCar = canvas.getContext("2d");
    mainCar.fillStyle = "#FF0000";
    mainCar.fillRect(130, 100, 20, 20);
}


