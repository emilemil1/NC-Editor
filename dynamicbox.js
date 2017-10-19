/*eslint-env es6, jquery, browser*/
/*eslint-disable no-console*/
/*global ToolBox*/

class DBAction {
    constructor(caller, func, ...args) {
        this.caller = caller;
        this.func = func;
        this.args = [...args];
    }
}

class Box {
    constructor(id) {
        this.id = id;
        this.box = $("#" + this.id);
        this.status = "ready";
        this.dbQueue = [];
        this.autoResize = true;
    }

    contentify() {
        this.box.html("<div class='dynamicbox_content' id=" + this.id + "_content" + ">" + this.box.html() + "</div>");
        this.content = $("#"+this.id + "_content");
        $("<div></div>", {
            class: "dynamicbox_shadowcontent",
            id: this.id + "_shadowcontent",
            style: 'visibility: hidden;'
        }).appendTo(document.body);
        this.shadowContent = $("#"+this.id + "_shadowcontent");

        this.box.append("<span class='dynamicbox_tooltip' id=" + this.id + "_tooltip></span>");
        this.tooltip = $("#" + this.id + "_tooltip");

        this.assignDynamicParent(this.box[0]);
        let x = this.content.width();
        let y = this.content.height();
        this.sizeChanged(x, y);
    }

    assignDynamicParent(element) {
        let parent = element.parentElement;
        while (parent.nodeName != "BODY") {
            if (parent.nodeName === "DYNAMICBOX") {
                this.dynamicparent = DBox.prototype.boxMap.get(parent.getAttribute('id'));
                return;
            } else {
                parent = parent.parentElement;
            }
        }
    }

    sizeChanged(x, y) {
        if (this.autoResize == false) {
            return;
        }
        let changeHeight = this.box.height() - y;
        let element;
        if (typeof this.shadowContent == 'undefined') {
            element = this.shadowContent;
        } else {
            element = this.content;
        }
        if (typeof x == 'undefined') {
            x = element.width();
        }
        if (typeof y == 'undefined') {
            y = element.height();
        }
        if (this.box.offset().top != 8) {
            document.getElementById(this.id).style.setProperty("--height", y + "px");
            document.getElementById(this.id).style.setProperty("--width", x + "px");
            document.getElementById(this.id+"_content").style.removeProperty("transition");
            document.getElementById(this.id+"_content").style.setProperty("margin-top", + changeHeight/2 + "px");
            document.getElementById(this.id+"_content").style.setProperty("transition", "margin-top " + this.getTransitionSpeed() + "s ease");
            document.getElementById(this.id+"_content").style.setProperty("margin-top", "0px");
        } else {
            document.getElementById(this.id).style.setProperty("--height", y + "px");
            document.getElementById(this.id).style.setProperty("--width", x + "px");
        }

        this.tooltip.css("width", this.box.width());
        this.tooltip.css("left", this.box.offset().left + this.box.width() + ToolBox.em2px(1.5));
        this.tooltip.css("top", this.box.offset().top - this.tooltip.height()/2 + this.content.height()/2 - ToolBox.em2px(0.5));

        if (typeof this.dynamicparent != 'undefined') {
            this.dynamicparent.sizeChanged();
        }
    }

    finalize() {
        this.setTransitionSpeed(1);
        document.getElementById(this.id).style.setProperty("width", "let(--width)");
        document.getElementById(this.id).style.setProperty("height", "let(--height)");
    }




    //Queue

    setStatus(status) {
        this.status = status;
    }

    queue(func, ...args) {
        this.dbQueue.unshift(new DBAction(this, func, ...args));
    }

    blockQueue() {
        this.setStatus("block");
        this.dbQueue.push(new DBAction(this, this.setStatus, "ready"));
    }

    executeQueue() {
        while (this.dbQueue.length != 0) {
            let action = this.dbQueue.pop();
            action.func.bind(action.caller)(...action.args);

            if (this.status != "ready") {
                break;
            }
        }
    }

    executeDelayed(time) {
        window.setTimeout(this.executeQueue.bind(this), time)
    }

    delay(delay){
        if (this.status != "ready") {
            this.queue(this.delay, delay)
            return this;
        }
        this.blockQueue();
        this.executeDelayed(delay);
        return this;
    }




    //Effects

    fade(value, speed = 600) {
        if (this.status != "ready") {
            this.queue(this.fade, value, speed)
            return this;
        }

        this.content.animate({opacity: value}, speed);
        return this;
    }

    setShadowContent(content) {
        if (this.status != "ready") {
            this.queue(this.setShadowContent, content)
            return this;
        }

        this.shadowContent.html(content);
        let x = this.shadowContent.width();
        let y = this.shadowContent.height();
        this.sizeChanged(x, y)
        return this;
    }

    applyShadowContent() {
        if (this.status != "ready") {
            this.queue(this.applyShadowContent)
            return this;
        }

        this.setContent(this.shadowContent.html());
        this.shadowContent.html("");
        return this;
    }

    getShadowContent() {
        return this.shadowContent;
    }

    clearShadowContent() {
        this.shadowContent.html("");
    }

    setContent(content) {
        if (this.status != "ready") {
            this.queue(this.setContent, content)
            return this;
        }

        this.content.html(content);
        this.sizeChanged()
        return this;
    }

    getContent() {
        return this.content;
    }

    setAutoResize(bool) {
        this.autoResize = bool;
    }

    toggleTooltip(bool) {
        if (bool) {
            this.tooltip.css("visibility", "visible");
        } else {
            this.tooltip.css("visibility", "hidden")
        }
    }

    setTooltip(string) {
        this.tooltip.html(string);
    }




    //Style

    setVPadding(padding) {
        document.getElementById(this.id).style.setProperty("--vpadding", padding + "em");
    }

    setHPadding(padding) {
        document.getElementById(this.id).style.setProperty("--hpadding", padding + "em");
    }

    setTransitionSpeed(speed) {
        document.getElementById(this.id).style.setProperty("--transitionspeed", speed + 's');
    }

    getTransitionSpeed() {
        let speed = getComputedStyle(this.box[0]).getPropertyValue("--transitionspeed");
        return parseFloat(speed);
    }

    setBorderWidth(width) {
        document.getElementById(this.id).style.setProperty("--borderwidth", width + "em");
    }

    setShadow(amount) {
        document.getElementById(this.id).style.setProperty("--shadow", amount + "em");
    }

    setShadowSpread(amount) {
        document.getElementById(this.id).style.setProperty("--shadowspread", amount + "em");
    }

    setRadius(amount) {
        document.getElementById(this.id).style.setProperty("--radius", amount + "em");
    }
}

class DBox {

    static init() {
        DBox.prototype.boxMap = new Map();
        $("dynamicbox").each(function() {
            DBox.createBox(this.getAttribute('id'));
        });
        $(window).resize(function() {
            DBox.toAllChildren(Box.prototype.sizeChanged);
        });
    }

    static start() {
        DBox.toAll(Box.prototype.finalize);
        for(let i=0; i<document.styleSheets.length; i++) {
            let sheet = document.styleSheets[i];
            if(sheet.title == "dbcss") {
                sheet.deleteRule("visibility");
            }
        }
    }

    static createBox(id) {
        let newBox = new Box(id);
        DBox.prototype.boxMap.set(newBox.id, newBox);
        newBox.contentify();
    }

    static get(id) {
        return DBox.prototype.boxMap.get(id);
    }

    static toAll(func, ...args) {
        DBox.prototype.boxMap.forEach(function(box) {
            func.bind(box)(...args);
        });
    }

    static toAllChildren(func, ...args) {
        let children = new Map(DBox.prototype.boxMap);

        DBox.prototype.boxMap.forEach(function(box) {
            let parent = box.dynamicparent;
            if (typeof parent != 'undefined') {
                children.delete(box.dynamicparent.id);
            }
        });

        children.forEach(function(box) {
            func.bind(box)(...args);
        });
    }

    needGrowth() {
        if(this.content.html() == "") {
            return true;
        }

        let contentWidth = $("#" + this.name + "_content")[0].offsetWidth;
        let contentHeight = $("#" + this.name + "_content")[0].offsetHeight;
        let boxWidth = $("#" + this.name)[0].offsetWidth;
        let boxHeight = $("#" + this.name)[0].offsetHeight;

        let diffWidth = boxWidth - contentWidth;
        let diffHeight = boxHeight - contentHeight;
        let em = parseFloat($("body").css("font-size"));
        diffWidth = diffWidth/em;
        diffHeight = diffHeight/em;

        let widthTolerance = parseFloat(getComputedStyle(document.getElementById(this.name)).getPropertyValue("--hpadding"));
        let heightTolerance = parseFloat(getComputedStyle(document.getElementById(this.name)).getPropertyValue("--vpadding"));

        if (Math.abs(diffWidth) < widthTolerance/1.5 || Math.abs(diffHeight) < heightTolerance/1.5 || Math.abs(diffWidth) > widthTolerance*2.5 || Math.abs(diffHeight) > heightTolerance*3) {
            return true;
        } else {
            return false;
        }
    }
}

$(function(){
    DBox.init();
});
