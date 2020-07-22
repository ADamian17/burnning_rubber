// Get the modal
const modal = $("#myModal");

// Get the button that opens the modal
const btn = $("#myBtn");

// Get the <span> element that closes the modal
const span = $(".close");

// When the user clicks on the button, open the modal
btn.on("click", () =>  {
    modal.css("display", "block");
});

// When the user clicks on <span> (x), close the modal
span.on('click', () => {
    modal.css("display", "none");
});

// When the user clicks anywhere outside of the modal, close it
// When the user clicks anywhere outside of the modal, close it
$(window).on("click", (event) => {
    if ( event.target.id == "myModal" ) {
        modal.css("display", "none");
    };
});
