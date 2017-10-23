/*eslint-env es6, jquery, browser*/
/*eslint-disable no-console*/
/*global DBox, Box, JobHandler, ToolBox*/

class LoaderTask {
    constructor(job, description, next, weight = 1) {
        this.job = job;
        this.description = description;
        this.weight = weight;
        this.next = next;
        this.caller = this;
    }
}

class Job {
    constructor(func, ...args) {
        this.func = func;
        this.args = [...args];
    }
}

class Loader {
    static init() {
        Loader.prototype.loadMap = new Map();
        $("loader").each(function() {
            Loader.createLoader(this.getAttribute('id'));
        });
    }

    static createLoader(id) {
        let newLoader = new Loader(id);
        Loader.prototype.loadMap.set(newLoader.id, newLoader);
        newLoader.contentify();
    }

    static toAll(func, ...args) {
        Loader.prototype.loadMap.forEach(function(loader) {
            func.bind(loader)(...args);
        });
    }




    //Object

    constructor(loader) {
        this.id = loader;
        this.loader = $("#" + loader);
        this.tasks = new Map()
        this.executing = [];
        this.workingTasks = 0;
        this.totalTasks = 0;
        this.totalWeight = 0;
        this.completedWeight = 0;
        this.currentWeight = 0;
        this.currentDescription = "";
        this.percentage = 0;
        this.progressOpacity = 150;
        this.progressOpacityUp = false;
        this.loaderWidth = ToolBox.em2px(10);
        this.textWidth = this.loaderWidth * 2;
        Box.prototype.assignDynamicParent.bind(this)(this.loader[0]);
    }

    static get(loader) {
        return Loader.prototype.loadMap.get(loader);
    }

    addTask(task, id) {
        this.totalTasks++;
        this.totalWeight += task.weight;
        this.tasks.set(id, task)
    }

    executeTask(id) {
        if (id == "final") {
            this.reset();
            task.job.func.bind(task.caller)(...task.job.args);
            return;
        }

        let task = this.tasks.get(id);
        this.workingTasks++;
        this.currentWeight = task.weight;
        this.currentDescription = task.description;
        this.setStep(this.workingTasks, this.totalTasks, this.currentDescription);
        this.progressChanged = true;
        if(JobHandler.hasJob(task.job)) {
            JobHandler.startJob(task.job, task.caller, this, id);
        } else {
            task.job.func.bind(task.caller)(...task.job.args);
            this.completeTask(task.id);
        }

    }

    completeTask(id) {
        let task = this.tasks.get(id);
        this.tasks.delete(id);
        this.completedWeight += this.currentWeight;
        if (typeof task.next == 'undefined') {
            this.currentWeight = 0;
            this.currentDescription = "";
            this.setProgress();
        } else {
            this.executeTask(task.next);
        }
    }

    reset() {
        this.workingTasks = 0;
        this.totalTasks = 0;
        this.totalWeight = 0;
        this.completedWeight = 0;
        this.currentWeight = 0;
        this.currentDescription = "";
        this.percentage = 0;
        this.progressOpacity = 100;
        this.progressOpacityUp = false;
        this.hideDisplay();
        this.progressChanged = false;
    }

    setPercentage(completed, current) {
        this.percentage = completed;
        this.percentageWorking = current;
        this.startArc = -Math.PI/2;
        this.progressArc = this.startArc + ((Math.PI*2) * this.percentage);
        this.greyArc = this.progressArc + ((Math.PI*2) * this.percentageWorking);
    }

    setStep(progress, completed, description) {
        let string = "Step " + progress + "/" + completed + ": " + description;
        this.task.setContent(string, "loader_temp");
        this.task.sizeChanged("loader_temp");
        this.task.setContent(string);
        if (this.task.getContent("loader_temp").width() > this.textWidth) {
            this.task.setTooltip(description);
            this.task.toggleTooltip(true);
        } else {
            this.task.toggleTooltip(false);
        }
        this.task.removeFrame("loader_temp");
    }

    hideDisplay() {
        clearInterval(this.refreshInterval);
    }

    showDisplay() {
        this.drawStaticProgress();
        this.refreshInterval = setInterval(this.drawProgress.bind(this), 25);

        if (typeof this.dynamicparent != 'undefined') {
            this.dynamicparent.sizeChanged();
        }
    }

    drawStaticProgress() {
        let radius = this.display[0].width/2;

        this.ctx.beginPath();
        this.ctx.moveTo(radius, radius);
        this.ctx.arc(radius,radius,radius*0.95,this.startArc, this.progressArc);
        this.ctx.closePath();
        this.ctx.fillStyle="black";
        this.ctx.fill();
        this.ctx.strokeStyle="black";
        this.ctx.strokeWidth=ToolBox.em2px(0.1);
        this.ctx.stroke();


        let greyColor = Math.floor(255 * 150/160)

        this.ctx.beginPath();
        this.ctx.moveTo(radius, radius);
        this.ctx.arc(radius,radius,radius*0.95,this.greyArc, this.startArc);
        this.ctx.closePath();
        this.ctx.fillStyle="rgba("+greyColor+", "+greyColor+", "+greyColor+", 1)";
        this.ctx.fill();
        this.ctx.strokeStyle="rgba("+greyColor+", "+greyColor+", "+greyColor+", 1)";
        this.ctx.strokeWidth=ToolBox.em2px(0.1);
        this.ctx.stroke();
    }

    drawProgress() {
        let radius = this.display[0].width/2;
        let brightness = Math.floor(255 * this.progressOpacity/160);

        this.ctx.beginPath();
        this.ctx.moveTo(radius, radius);
        this.ctx.arc(radius,radius,radius*0.95,this.progressArc, this.greyArc);
        this.ctx.closePath();
        this.ctx.fillStyle="rgba("+brightness+", "+brightness+", "+brightness+", 1)";
        this.ctx.fill();
        this.ctx.strokeStyle="rgba("+brightness+", "+brightness+", "+brightness+", 1)";
        this.ctx.strokeWidth=ToolBox.em2px(0.1);
        this.ctx.stroke();

        if (this.progressOpacityUp) {
            this.progressOpacity+=2
            if (this.progressOpacity == 150) {
                this.progressOpacityUp = false;
            }
        } else {
            this.progressOpacity-=2
            if (this.progressOpacity == 0) {
                if (this.progressChanged) {
                    this.progressChanged = false;
                    this.setPercentage(this.completedWeight/this.totalWeight, this.currentWeight/this.totalWeight);
                    this.drawStaticProgress();
                }
                this.progressOpacityUp = true;
            }
        }
    }

    setWidth(width) {
        this.loaderWidth = width;
        this.display.css("width", this.loaderWidth+"px");
        this.display.css("height", this.loaderWidth+"px");
        this.display[0].width = this.loaderWidth;
        this.display[0].height = this.loaderWidth;
    }

    contentify() {
        this.loader.append("<canvas width='"+this.loaderWidth*4+"' height='"+this.loaderWidth*4+"' style='width: "+this.loaderWidth+"px; height: "+this.loaderWidth+"px;' class='loader_display, loader_item' id=" + this.id + "_display>"+"</canvas>");
        this.display = $("#" + this.id + "_display");
        this.ctx = this.display[0].getContext("2d");
        this.loader.append("<dynamicbox class='loader_item, loader_task' id=" + this.loader.attr('id') + "_task" + "></dynamicbox>");
        DBox.createBox(this.id + "_task");
        this.task = DBox.get(this.id + "_task");
        this.task.setBorderWidth(0);
        this.task.setHPadding(0);
        this.task.setVPadding(0);
        this.task.setShadow(0);
        this.task.setShadowSpread(0);
        this.task.setRadius(0);
        this.task.content.css("max-width", this.textWidth);
    }
}

$(function(){
    Loader.init();
});
