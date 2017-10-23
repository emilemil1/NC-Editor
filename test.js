/*eslint-env es6, jquery, browser*/
/*eslint-disable no-console*/
/*global DBox, Box, Loader*/

var fading = false;

$(function(){
    Loader.get("loader1").setStep(2,3, "Testing the progress meter and tooltip with a slightly too long string.");
    Loader.get("loader1").setPercentage(1/3, 1/3);
    Loader.get("loader1").showDisplay();
    DBox.get("btn_box1").setMargin("1.5", "top").setShadow(0.4);
    let box = DBox.get("dyn1");
    box.setContent("Frame 2", 1);
    box.setContent("Frame 3", 2);
    box.setContent("Frame 4", 3);

    DBox.start();
    DBox.toAll(Box.prototype.fade,1);
});

function buttonClicked(val){
    let box = DBox.get("dyn1");
    if(box.currentFrame != val && fading != true) {
        fading = true;
        box.fitToFrame(val).fade(0,400).delay(400).setFrame(val).fade(1,400).delay(600).runFunction(function(){fading = false});
    }
}
