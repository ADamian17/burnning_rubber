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
//-- 10 cars
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

    obstacles();
}

//--------------------------------------------------------//

let truck1 = $('<div class="cars yellow"></div>'); 
let camaro = $('<div class="cars camaro"></div>'); 
let police = $('<div class="cars police"></div>'); 
let fireTruck = $('<div class="cars fire"></div>'); 
let greenTruck = $('<div class="cars green"></div>'); 



const obstacles = () => {

    const $gameCars = [truck1, police, camaro, fireTruck, greenTruck];
       for (let i = 0; i < $gameCars.length; i++) {
         $($gameCars).css('top', '10%');
         $('#gameArea').prepend($gameCars);
       }
  
}



