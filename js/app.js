console.log('Hello Adonis!')
//------------- BURNNING RUBBER GAME------------------//


//------------- User Storie/Game Logic------------------//

//--- When the user click START, the user should see their car in the game window and the timer should start running.
//--- The user will have to avoid the cars coming in the opposite directtion.
//--- the user will control the car by using the A and D. 
//--- the User will get 5 points, everytime  he or she avoids an obstacle. 
//--- Each level is going last 40 sec. 
//--- the obstacle and the speed will increase as the levels gets higher. 
//--- If the driver crashes the level, timer and the scrore will reset and the game starts again.


//--- levels ----//

//--- level 1
//-- 10  cars
//--- level 2
//-- 20 cars
//--- level 3
//-- 30 cars
//--- level 4
//-- 40 cars
//--- level 5
//-- 50 cars 

//---- start button  ------ //

$(document).ready(function () {
     
    let start = $('<button class="start">Start</button>');
    $("#gameArea").append(start);
    $(start).on('click', function (a) {
        createAuto();
        $(start).hide();
    });
});

//------------------------//




//------------- Object ----------------//


const vechicles = {
    yellowTruck: "./image/yellow_truck.png",
    camaro: "./image/camaro.png",
    police: "./image/police.png", 
    fireTruck: "./image/red_truck.png", 
    greenTruck: "./image/green_truck.png", 

}

console.log(vechicles.camaro);
//----------------------------------------//



//-------- main car ------------------///

const createAuto = () => {
    let $player1 = $('<div class="player"></div>'); /* Utilices un objeto */
     $($player1).css('bottom', '3%');
     $($player1).css('left', '45%');



    $("#gameArea").append($player1);

    $( "body" ).keypress(function( event ) {

        if ( event.which == 97 ) {
            let left = $($player1).position().left;
            if(left > 15){
                left -= 5;
                $($player1).css('left', left + "px");
            }
    
        }
        if ( event.which == 100 ) {
            let right = $($player1).position().left;
            if(right < 425){
                right += 5;
                $($player1).css('left', right + "px");
            }
        }
        
    });

    makeObstacles(10);  
}

//--------------------------------------------------------//



//create a function the display obtacle cars
//display the cars in random positions
//animate the car so they go for top to bottom
//random position in the screen


//---- make cars obstacles----------//

const makeObstacles = (numeroDeCars) => {

     const $gameCars = $('.cars');
    for (let i = 0; i < numeroDeCars; i++) {
      const $gameCar = $('<div class="car"/>') 
      $gameCar.css("background-image", `url(${randomCars()})`);
         $gameCars.prepend($gameCar);
         
    
    }
  
}




const randomCars = () => {
    console.log("i work!")
    const gameCars = [vechicles.fireTruck, vechicles.greenTruck, vechicles.police, vechicles.camaro, vechicles.yellowTruck];
    const index = Math.floor(Math.random() * (gameCars.length));

   return gameCars[index];
};

//---------------------------------------------------//