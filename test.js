/*eslint-env es6, jquery, browser*/
/*eslint-disable no-console*/
/*global DBox, Box, Loader*/

$(function(){
    Loader.get("loader1").setStep(2,3, "Testing the progress meter and tooltip with a slightly too long string.");
    Loader.get("loader1").setPercentage(1/3, 1/3);
    Loader.get("loader1").showDisplay();
    DBox.start();
    DBox.toAll(Box.prototype.fade,1);

});
