console.log('Hello Adonis!')
//------------- BURNNING RUBBER GAME------------------//


//------------- User Storie/Game Logic------------------//

//--- When the user click START, the user should see their car in the game window and the timer should start running.
//--- The user will have to avoid the cars coming in the opposite directtion.
//--- the user will control the car by using the A and D. 
//--- the User will get 5 points, everytime  he or she avoids an obstacle. 
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
    yellowTruck: "./image/truck1.png",
    camaro: "./image/camaro.png",
    police: "./image/police.png", 
    fireTruck: "./image/truck3.png", 
    greenTruck: "./image/truck3.png", 

}

const gameCars = [vechicles.fireTruck, vechicles.greenTruck, vechicles.police, vechicles.camaro, vechicles.yellowTruck];
//----------------------------------------//



//----intervalos y variables---//

let interval1 = 0;
let interval2 = 0;
let $player1; 
let start = $('<button class="start">Start</button>');

let lane = [400, 278, 160, 40];
//---------------------//


//---- start button  ------ //

$(document).ready(function () {
     
   
    $("#gameArea").append(start);
    $(start).on('click', function (a) {
        $("#gameArea .player, #gameArea .cars").remove();
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
           event.preventDefault(); 
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


//---- make cars sequencia----------//

const makeObstacles = () => {
    inteval1 = setInterval(randomCars,1000); //Se crea un carro cada 3 segundos
    inteval2 = setInterval(moveCar, 50); //move cars
    
}


//-------cars ------------//
const randomCars = () => {
    //other car
    let $gameCar = $('<div class="car"/>'); 
    let cars = Math.floor(Math.random() * gameCars.length);
    console.log(cars);
        $gameCar.css("background-image", `url("${gameCars[cars]}")`);
        
    
    // let widthCar = 50;
    let pos = Math.floor(Math.random() * 4);

    if (pos !== 4) {
        // pos *= widthCar;
        
        $($gameCar).css('top', '-60px');
        $($gameCar).css('left',lane[pos] + 'px');

         $('#gameArea').prepend($gameCar);
            
    }
  
};

//https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection// grabed from here 
const moveCar = () => {
    $("#gameArea .car").each(function (a) {

        //Calcular colission

        let yP1 = $($player1).position().top;
        let xP1 = $($player1).position().left;
        let widthP1 = $($player1).width();
        let heightP1 = $($player1).height();

        let widthCart = $(this).width();
        let heightCar = $(this).height();
        let yCar = $(this).position().top;
        let xCar = $(this).position().left;

        if (xP1 < xCar + widthCart &&
            xP1 + widthP1 > xCar &&
            yP1 < yCar + heightCar &&
            heightP1 + yP1 > yCar) {
            gameOver();
        }

        let top = $(this).position().top;
        if (top > 650){
            $(this).remove();
        }else{
            top += 10;
            $(this).css('top', top + 'px');
        }

    });
}



 gameOver = () => {
    clearInterval(inteval2);
    clearInterval(inteval1);
    $('.player').addClass('explosion');
    setTimeout(function () {
        $('.player').hide();
    },1000)

}

