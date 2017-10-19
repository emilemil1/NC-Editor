/*eslint-env es6, jquery, browser*/
/*eslint-disable no-console*/

class ToolBox {
    static px2em(px) {
        var emSize = parseFloat($("body").css("font-size"));
        return (px / emSize);
    }

    static em2px(em) {
        var emSize = parseFloat($("body").css("font-size"));
        return (emSize * em);
    }
}
