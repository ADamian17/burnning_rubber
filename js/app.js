console.log('Hello Adonis!')
//------------- BURNNING RUBBER GAME------------------//


//------------- User Storie/Game Logic------------------//

//--- When the user click START, the user should see their car in the game window and the timer should start running.
//--- The user will have to avoid the cars coming in the opposite directtion.
//--- the user will control the car by using the A and D. 
//--- Everytime  he or she avoids an obstacle they get 1 point. 
//--- the obstacle and the speed will increase as the levels gets higher. 
//--- If the driver crashes the level, the scrore will reset and the game starts again.


//------------- Object and array ----------------//


const vechicles = {
    yellowTruck: "./image/truck1.png",
    camaro: "./image/camaro.png",
    police: "./image/police.png", 
    fireTruck: "./image/truck3.png", 
    greenTruck: "./image/truck2.png", 

}

const gameCars = [vechicles.fireTruck, vechicles.greenTruck, vechicles.police, vechicles.camaro, vechicles.yellowTruck];



//----intervalos y variables---//

let score = 0;
let interval1 = 0;
let interval2 = 0;
let $player1; 
let start = $('<button class="start">Start</button>');
let cardriving = document.getElementById('shift');




let lane = [400, 278, 160, 40];


//---- start button  ------ //

$(document).ready(startGame = ()  => {
     
   
    $("#gameArea").append(start);
    $(start).on('click', function (a) {
        $("#gameArea .player, #gameArea .cars").remove();
        createAuto();
        randomCars();
        makeObstacles();
        $(start).hide();
        $('#gameArea').addClass('animate');
        cardriving.play();
        cardriving.loop = true; 
    });
});


//-------- main car ------------------//

const createAuto = () => {

    $player1 = $('<div class="player"></div>'); 
     $($player1).css('bottom', '3%');
     $($player1).css('left', '45%');

    $("#gameArea").append($player1);
    ///https://api.jquery.com/category/events/keyboard-events/

    //key functions
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
    inteval1 = setInterval(randomCars,900); //Se crea un carro cada 3 segundos
    inteval2 = setInterval(moveCar, 50); //move cars
    
}


//-------cars ------------//
const randomCars = () => {

    let $gameCar = $('<div class="car"/>'); 
    let cars = Math.floor(Math.random() * gameCars.length);
        $gameCar.css("background-image", `url("${gameCars[cars]}")`);
    
    //car position in the he game area 
    let pos = Math.floor(Math.random() * 4);
    

    if (pos !== 4) {
        
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
        if (top > 550){
            score += 1; 
            console.log(score);
            $('h3').text(`scoreboard: ${score}`);
            $(this).remove();

        }else{
            top += 10;
            $(this).css('top', top + 'px');
        }

    });
}



//---------- reset the game ---------------//


const gameOver = () => {
    let audio2 = document.getElementById('crash');
    clearInterval(inteval2);
    clearInterval(inteval1);
    $('.player').addClass('explosion');
    cardriving.pause();
    audio2.play();
    $('.car').remove()
    $('#gameArea').removeClass('animate');
    score = 0;
    console.log(score);
    $('h3').text('scoreboard: 0')
    setTimeout(function () {
        $('.player').hide();
    },1000)

    
    $(start).show();
   
}


$('.howtoplay h4',).on('click', function() {
   $('li').slideToggle()
});