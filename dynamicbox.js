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
        this.currentFrame = 0;
        this.frames = new Map();
    }

    contentify() {
        this.box.html("<div class='dynamicbox_content' id=" + this.id + "_content0" + ">" + this.box.html() + "</div>");
        this.frames.set(0, $("#"+this.id + "_content0"));
        this.content = $("#"+this.id + "_content0");

        this.box.append("<span class='dynamicbox_tooltip' id=" + this.id + "_tooltip></span>");
        this.tooltip = $("#" + this.id + "_tooltip");

        this.assignDynamicParent(this.box[0]);
        this.sizeChanged();
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

    sizeChanged(frame=this.currentFrame) {
        if (this.autoResize == false) {
            return;
        }
        let element = this.frames.get(frame);
        let x = element[0].scrollWidth;
        let y = element[0].scrollHeight;
        let maxX = parseFloat(element.css("max-width"));
        let maxY = parseFloat(element.css("max-height"));
        if (!isNaN(maxX)) {
            x = Math.min(x, maxX);
        }
        if (!isNaN(maxY)) {
            y = Math.min(y, maxY);
        }
        document.getElementById(this.id).style.setProperty("--height", y + "px");
        document.getElementById(this.id).style.setProperty("--width", x + "px");

        this.frames.get(frame).css("margin-top", "0px");

        console.log(this.content.offset().top)
        this.tooltip.css("width", x);
        this.tooltip.css("left", this.box.offset().left + this.box.width() + ToolBox.em2px(1.5));
        this.tooltip.css("top", this.box.offset().top - this.tooltip.height()/2 - ToolBox.em2px(0.25));

        if (typeof this.dynamicparent != 'undefined') {
            this.dynamicparent.sizeChanged();
        }
    }

    finalize() {
        this.setTransitionSpeed(1);
    }

    createFrame(content, frameId) {
        $("<div></div>", {
            class: "dynamicbox_content",
            id: this.id + "_content" + frameId,
            style: 'visibility: hidden;'
        }).appendTo(document.body);
        this.frames.set(frameId, $("#"+this.id + "_content" + frameId));
        this.setContent(content, frameId);
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

    setContent(content, frame=this.currentFrame) {
        if (this.status != "ready" && frame == this.currentFrame) {
            this.queue(this.setContent, content, frame)
            return this;
        }

        if (typeof this.frames.get(frame) != 'undefined') {
            if (content[0] instanceof HTMLElement) {
                this.frames.get(frame).empty();
                this.frames.get(frame).append(content);
            } else {
                this.frames.get(frame).html(content);
            }
        } else {
            this.createFrame(content, frame);
        }
        if (frame == this.currentFrame) {
            this.sizeChanged();
        }

        return this;
    }

    getContent(frame=this.currentFrame) {
        return this.frames.get(frame);
    }

    setFrame(frame=this.currentFrame) {
        if (this.status != "ready") {
            this.queue(this.setFrame, frame);
            return this;
        }

        if(frame == this.currentFrame) {
            return this;
        }

        this.content.css("visibility", "hidden");
        this.content[0].style.setProperty("margin-top", "auto");
        this.content.appendTo(document.body);
        let border = parseFloat(this.box.css("border"));
        let topPadding = parseFloat(this.box.css("padding-top"));
        let botPadding = parseFloat(this.box.css("padding-bottom"));
        let topMargin = parseFloat(this.frames.get(frame).css("margin-top"));
        let botMargin = parseFloat(this.frames.get(frame).css("margin-bottom"));
        let newHeight = this.frames.get(frame).height() + topPadding + botPadding + topMargin + botMargin + (border*2);
        let sizeDiff = (newHeight - this.box.outerHeight())/2;
        this.frames.get(frame).css("margin-top", -sizeDiff + "px")
        this.frames.get(frame).prependTo(this.box);
        this.frames.get(frame).css("visibility", "visible");
        this.content = this.frames.get(frame);
        this.currentFrame = frame
        this.sizeChanged();

        return this;
    }

    removeFrame(frame) {
        if (this.status != "ready" && frame == this.currentFrame) {
            this.queue(this.removeFrame, frame)
            return this;
        }

        this.frames.get(frame).remove();
        this.frames.delete(frame);

        return this;
    }

    setAutoResize(bool) {
        if (this.status != "ready") {
            this.queue(this.setAutoResize, bool);
            return this;
        }

        this.autoResize = bool;

        return this;
    }

    toggleTooltip(bool) {
        if (this.status != "ready") {
            this.queue(this.toggleTooltip, bool);
            return this;
        }

        if (bool) {
            this.tooltip.css("visibility", "visible");
        } else {
            this.tooltip.css("visibility", "hidden")
        }

        return this;
    }

    setTooltip(string) {
        if (this.status != "ready") {
            this.queue(this.setTooltip, string);
            return this;
        }

        this.tooltip.html(string);
        this.sizeChanged();

        return this;
    }

    runFunction(func) {
        if (this.status != "ready") {
            this.queue(this.runFunction, func);
            return this;
        }

        func();
    }




    //Style

    setVPadding(padding) {
        document.getElementById(this.id).style.setProperty("--vpadding", padding + "em");

        return this
    }

    setHPadding(padding) {
        document.getElementById(this.id).style.setProperty("--hpadding", padding + "em");

        return this
    }

    setTransitionSpeed(speed) {
        document.getElementById(this.id).style.setProperty("--transitionspeed", speed + 's');

        return this
    }

    getTransitionSpeed() {
        let speed = getComputedStyle(this.box[0]).getPropertyValue("--transitionspeed");
        return parseFloat(speed);
    }

    setBorderWidth(width) {
        document.getElementById(this.id).style.setProperty("--borderwidth", width + "em");

        return this
    }

    setShadow(amount) {
        document.getElementById(this.id).style.setProperty("--shadow", amount + "em");

        return this
    }

    setShadowSpread(amount) {
        document.getElementById(this.id).style.setProperty("--shadowspread", amount + "em");

        return this
    }

    setRadius(amount) {
        document.getElementById(this.id).style.setProperty("--radius", amount + "em");

        return this
    }

    setMargin(value, type) {
        switch(type) {
            case "top":
                document.getElementById(this.id).style.setProperty("margin-top", value);
                this.topMargin = value;
                break;
            case "bottom":
                document.getElementById(this.id).style.setProperty("margin-bottom", value);
                this.bottomMargin = value;
                break;
            case "left":
                document.getElementById(this.id).style.setProperty("margin-left", value);
                this.leftMargin = value;
                break;
            case "right":
                document.getElementById(this.id).style.setProperty("margin-right", value);
                this.rightMargin = value;
                break;
        }

        return this
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
}

$(function(){
    DBox.init();
});
