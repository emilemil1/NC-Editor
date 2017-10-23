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
        this.transSpeed = this.getTransitionSpeed();
        document.getElementById(this.id).style.setProperty("--transitionspeed", 0 + 's');
        this.vPadding = this.getVPadding();
        this.hPadding = this.getHPadding();
        this.shadow = this.getShadow();
        this.shadowSpread = this.getShadowSpread();
        this.topMargin = this.getMarginTop;
        this.bottomMargin = this.getMarginBottom();
        this.leftMargin = this.getMarginLeft();
        this.rightMargin = this.getMarginRight();
        this.radius = this.getRadius();
        this.borderWidth = this.getBorderWidth();
        this.zoom = 1/devicePixelRatio;
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
        let x = element.innerWidth();
        let y = element.innerHeight();
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

        this.refreshTooltipPos();

        if (typeof this.dynamicparent != 'undefined') {
            this.dynamicparent.sizeChanged();
        }

        return this;
    }

    refreshTooltipPos() {
        this.tooltip.css("width", this.box.width());
        this.tooltip.css("left", this.box.offset().left + this.box.width() + ToolBox.em2px(1.5));
        this.tooltip.css("top", this.box.offset().top + parseFloat(this.content.css("padding-top")) - parseFloat(this.tooltip.css("padding-top")) - this.tooltip.height()/2 + this.content.height()/2 - $(window).scrollTop());
        console.log
    }

    finalize() {
        this.setTransitionSpeed(this.transSpeed);
        this.refreshTooltipPos();
    }

    createFrame(content, frameId) {
        $("<div></div>", {
            class: "dynamicbox_content",
            id: this.id + "_content" + frameId,
            style: 'visibility: hidden; position: fixed;'
        }).appendTo(this.box);
        this.frames.set(frameId, $("#"+this.id + "_content" + frameId));
        this.setContent(content, frameId);
    }

    onWindowResize() {
        this.zoom = 1/devicePixelRatio;

        this.setVPadding();
        this.setHPadding();
        this.setMargin();
        this.setShadow()
        this.setShadowSpread();
        this.setRadius();
        this.setBorderWidth();
    }

    onWindowResizePre() {
        document.getElementById(this.id).style.setProperty("--transitionspeed", 0 + 's');
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

    fitToFrame(frame=this.currentFrame) {
        if (this.status != "ready") {
            this.queue(this.fitToFrame, frame)
            return this;
        }

        let border = parseFloat(this.box.css("border"));
        let topPadding = parseFloat(this.box.css("padding-top"));
        let botPadding = parseFloat(this.box.css("padding-bottom"));
        let newHeight = this.frames.get(frame).height() + topPadding + botPadding + (border*2);
        let sizeDiff = (newHeight - this.box.outerHeight())/2;

        this.frames.get(frame).css("margin-top", -sizeDiff + "px");
        this.content.css("margin-top", 0 + "px");

        this.sizeChanged(frame)

        this.frames.get(frame).css("margin-top", 0 + "px");
        this.content.css("margin-top", sizeDiff + "px");


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
        if (frame==this.currentFrame) {
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
        this.content.css("position", "fixed");
        this.content.css("margin-top", "");

        this.frames.get(frame).css("visibility", "visible");
        this.frames.get(frame).css("position", "");
        this.content = this.frames.get(frame);
        this.currentFrame = frame;

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

        if (frame == this.currentFrame) {
            this.currentFrame = 'undefined';
            this.sizeChanged();
        }

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

    setVPadding(padding=this.vPadding) {
        this.vPadding = padding;
        document.getElementById(this.id).style.setProperty("--vpadding", padding * this.zoom + "em");

        return this
    }

    getVPadding() {
        let padding = getComputedStyle(this.box[0]).getPropertyValue("--vpadding");
        return parseFloat(padding);
    }

    setHPadding(padding=this.hPadding) {
        this.hPadding = padding;
        document.getElementById(this.id).style.setProperty("--hpadding", padding * this.zoom + "em");

        return this
    }

    getHPadding() {
        let padding = getComputedStyle(this.box[0]).getPropertyValue("--hpadding");
        return parseFloat(padding);
    }

    setTransitionSpeed(speed=this.transSpeed) {
        this.transSpeed = speed;
        document.getElementById(this.id).style.setProperty("--transitionspeed", this.transSpeed + 's');

        return this
    }

    getTransitionSpeed() {
        let speed = getComputedStyle(this.box[0]).getPropertyValue("--transitionspeed");
        return parseFloat(speed);
    }

    setBorderWidth(width=this.borderWidth) {
        this.borderWidth = width;
        document.getElementById(this.id).style.setProperty("--borderwidth", width + "em");

        return this
    }

    getBorderWidth() {
        let width = getComputedStyle(this.box[0]).getPropertyValue("--borderwidth");
        return parseFloat(width);
    }

    setShadow(amount=this.shadow) {
        this.shadow = amount;
        document.getElementById(this.id).style.setProperty("--shadow", amount * this.zoom + "em");

        return this
    }

    getShadow() {
        let shadow = getComputedStyle(this.box[0]).getPropertyValue("--shadow");
        return parseFloat(shadow);
    }

    setShadowSpread(amount=this.shadowSpread) {
        this.shadowSpread = amount;
        document.getElementById(this.id).style.setProperty("--shadowspread", amount * this.zoom + "em");

        return this
    }

    getShadowSpread() {
        let spread = getComputedStyle(this.box[0]).getPropertyValue("--shadowspread");
        return parseFloat(spread);
    }

    setRadius(amount=this.radius) {
        this.radius = amount;
        document.getElementById(this.id).style.setProperty("--radius", amount * this.zoom + "em");

        return this
    }

    getRadius() {
        let radius = getComputedStyle(this.box[0]).getPropertyValue("--radius");
        return parseFloat(radius);
    }

    setMargin(value, type) {
        switch(type) {
            case "top":
                document.getElementById(this.id).style.setProperty("margin-top", value * this.zoom + "em");
                this.topMargin = value;
                break;
            case "bottom":
                document.getElementById(this.id).style.setProperty("margin-bottom", value * this.zoom + "em");
                this.bottomMargin = value;
                break;
            case "left":
                document.getElementById(this.id).style.setProperty("margin-left", value * this.zoom + "em");
                this.leftMargin = value;
                break;
            case "right":
                document.getElementById(this.id).style.setProperty("margin-right", value * this.zoom + "em");
                this.rightMargin = value;
                break;
        }

        if (typeof value == 'undefined' && typeof type == 'undefined') {
            document.getElementById(this.id).style.setProperty("margin-top", this.topMargin * this.zoom + "em");
            document.getElementById(this.id).style.setProperty("margin-bottom", this.bottomMargin * this.zoom + "em");
            document.getElementById(this.id).style.setProperty("margin-left", this.leftMargin * this.zoom + "em");
            document.getElementById(this.id).style.setProperty("margin-right", this.rightMargin * this.zoom + "em");
        }

        return this
    }

    getMarginTop() {
        let margin = getComputedStyle(this.box[0]).getPropertyValue("--margin-top");
        return parseFloat(margin);
    }

    getMarginBottom() {
        let margin = getComputedStyle(this.box[0]).getPropertyValue("--margin-bottom");
        return parseFloat(margin);
    }

    getMarginLeft() {
        let margin = getComputedStyle(this.box[0]).getPropertyValue("--margin-left");
        return parseFloat(margin);
    }

    getMarginRight() {
        let margin = getComputedStyle(this.box[0]).getPropertyValue("--margin-right");
        return parseFloat(margin);
    }
}

class DBox {

    static init() {
        DBox.prototype.boxMap = new Map();
        $("dynamicbox").each(function() {
            DBox.createBox(this.getAttribute('id'));
        });
        $(window).resize(function() {
            DBox.toAll(Box.prototype.onWindowResizePre);
            DBox.toAll(Box.prototype.onWindowResize);
            DBox.toAll(Box.prototype.sizeChanged);
            DBox.toAll(Box.prototype.setTransitionSpeed);
        });
        $(window).scroll(function() {
            DBox.toAll(Box.prototype.refreshTooltipPos);
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
        newBox.onWindowResize();
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
