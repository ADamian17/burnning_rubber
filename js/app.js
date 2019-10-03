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




//------------- Object and array ----------------//


const vechicles = {
    yellowTruck: "./image/yellow_truck.png",
    camaro: "./image/camaro.png",
    police: "./image/police.png", 
    fireTruck: "./image/red_truck.png", 
    greenTruck: "./image/green_truck.png", 

}

const gameCars = [vechicles.fireTruck, vechicles.greenTruck, vechicles.police, vechicles.camaro, vechicles.yellowTruck];
//----------------------------------------//



//----intervalos y variables---//

let interval1 = 0;
let interval2 = 0;
let $player1; 

//---------------------//


//---- start button  ------ //

$(document).ready(function () {
     
    let start = $('<button class="start">Start</button>');
    $("#gameArea").append(start);
    $(start).on('click', function (a) {
        $("#gameArea .player1, #gameArea .cars").remove();
        createAuto();
        randomCars();
        makeObstacles();
        $(start).hide();
        $('#gameArea').addClass('animate');
    });
});

//------------------------//

//-------- main car ------------------///

const createAuto = () => {

    $player1 = $('<div class="player"></div>'); 
     $($player1).css('bottom', '3%');
     $($player1).css('left', '45%');

    $("#gameArea").append($player1);

    $( "body" ).keypress(function( event ) {

        if ( event.which == 97 ) {
            let left = $($player1).position().left;
            if(left > 15){
                left -= 15;
                $($player1).css('left', left + "px");
            }
    
        }
        if ( event.which == 100 ) {
            let right = $($player1).position().left;
            if(right < 425){
                right += 15;
                $($player1).css('left', right + "px");
            }
        }
        
    });

    
}


//---- make cars obstacles----------//

const makeObstacles = () => {
    inteval1 = setInterval(randomCars,1000); //Se crea un carro cada 3 segundos
    
    
}

const randomCars = () => {
    //other car
    let $gameCar = $('<div class="car"/>'); 
    let cars = Math.ceil(Math.random() * 10);
        $gameCar.css("background-image", `url(${gameCars[cars]})`);
        
    //en posicion de 500
    let widthCar = 50;
    let pos = Math.ceil(Math.random() * 10);

    if (pos !== 10) {
        pos *= widthCar;

        $($gameCar).css('top', '-60px');
        $($gameCar).css('left', pos + 'px');

         $('#gameArea').prepend($gameCar);
            
    }
  
};

//---------------------------------------------------//