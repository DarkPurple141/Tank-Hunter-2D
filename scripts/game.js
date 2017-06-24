// setup
// 1.5

config = {
    TANK_WIDTH : 30,
    TANK_HEIGHT : Math.floor(30 * 1.5),
    MAX_HP: 5,
    MAX_DISTANCE: 2000,
    BULLET_LIFE: 60,
    MAX_SPEED : Math.floor(30/10) + 1,
    AI_ACCURACY : 5,
    score : 0,
    enemies : 0,
    kills : 0
};

function Smoke () {
    this.group = new Group();
    this.children = this.group.children;

    this.animate = function () {
        for (var i = 0; i< this.children.length; i++) {
            if (this.children[i].data.timeToDie <= 0) {
                this.children[i].remove();
                continue;
            }
            this.children[i].position += this.children[i].data.vector;
            this.children[i].scale(1.1);
            this.children[i].fillColor.gray+=0.025;
            this.children[i].data.timeToDie-=.9;
        }
    };

    this.addWafts = function (position, size, parent) {
        // size will be between 60 and 50
        var size = Math.floor(size/4);
        for (var i=0;i<8; i++) {
            var child = new Path.Circle({
                radius : Math.ceil(size/7),
                center : position,
                data : {
                    vector : new Point({
                        angle: Math.random()*360,
                        length: (config.TANK_WIDTH/40)*Math.random()
                    }),
                    timeToDie : size
                },
                fillColor: 'black'
            });
            this.group.addChild(child);
        }
    }
}

function Shell () {
    this.group = new Group();
    this.children = this.group.children;
    this.bg = new Path.Rectangle(
        new Rectangle(0,0,paper.view.size.width,paper.view.size.height));
    this.bg.fillColor = new Color(1,0); // white + alpha
    this.flash = 0;

    this.checkHits = function (bullet) {
        for (var t = 0; t<tanks.length; t++) {
            if (tanks[t].parts[0].bounds.intersects(bullet.bounds)) {
                var dmg = Math.ceil(bullet.data.timeToDie/20);
                tanks[t].health -= dmg;
                if (tanks[t] === user) {
                    // flash occurs if user is hit.
                    this.animateBackground(true);
                } else if (bullet.data.parent === user) {
                    // if user hits someone score increases.
                    config.score += 10;
                }
                if (tanks[t].health <= 0) {
                    blasts.add(tanks[t].parts[0].position.x,tanks[t].parts[0].position.y);
                    if (tanks[t] === user) {
                        gameover = true;
                    } else {
                        if (bullet.data.parent === user) {
                            if (tanks[t].team == user.team) {
                                config.score -= 50;
                            } else {
                                config.score += 30;
                                config.kills += 1;
                            }
                        }
                        if (tanks[t].team) {
                            config.enemies--;
                            if (!config.enemies) {
                                gameover = true;
                            }
                        }
                        tanks[t].remove();
                        tanks.splice(t,1);
                    }
                }
                updateScore();
                return true; // a collision occurred
            }
        }
    };

    this.animateBackground = function (state) {
        if (state) {
            this.flash = 4;
            this.bg.fillColor.alpha = 1;
        } else if (this.flash) {
            this.bg.fillColor.alpha -= 0.25;
            this.flash--;
        }
    };

    this.move = function () {
        this.animateBackground(false);
        for (var i = 0; i < this.children.length; i++) {
            var bullet = this.children[i];
            if (bullet.data.timeToDie == 0) {
                bullet.remove();
                continue;
            }
            bullet.position += bullet.data.vector;
            if (this.checkHits(bullet)) {
                smoke.addWafts(bullet.position,bullet.data.timeToDie);
                bullet.remove();
                continue;
            }
            bullet.data.timeToDie--;
            if (bullet.data.timeToDie > 56) {
                smoke.addWafts(bullet.position,bullet.data.timeToDie);
            }
        }
    };

    this.fire = function (position, vector, parent) {
        if (this.children.length >= tanks.length) {
            return;
        } else {
            var cent = new Point(position.point);
            this.group.addChild(
                new Path.Circle({
                    center : cent,
                    radius : config.TANK_WIDTH/30,
                    fillColor: 'black',
                    strokeColor: 'black',
                    strokeWidth: 0,
                    data : {
                        timeToDie : config.BULLET_LIFE,
                        vector : vector,
                        parent : parent
                    }
                })
            );
        }
    };

}

function VisionCone (x,y) {
    var cone = new Path([x,y+config.TANK_WIDTH/2], // 0
        [x,y], // 1
        [x,y - config.TANK_WIDTH/2], //2
        [x,y-4*config.TANK_WIDTH], // 3
        [x-5*config.TANK_HEIGHT,y-4*config.TANK_WIDTH], // 4
        [x-5*config.TANK_HEIGHT,y- config.TANK_WIDTH], // 5
        [x-5*config.TANK_HEIGHT,y - config.TANK_WIDTH/5], // 6
        [x-5*config.TANK_HEIGHT,y + config.TANK_WIDTH/5], // 7
        [x-5*config.TANK_HEIGHT,y+ config.TANK_WIDTH], // 8
        [x-5*config.TANK_HEIGHT,y+4*config.TANK_WIDTH], // 9
        [x,y+4*config.TANK_WIDTH] // 10
    );
    cone.closed = true;

    cone.right = new Path({
        segments : [
        cone.segments[1].point,
        cone.segments[2].point,
        cone.segments[4].point,
        cone.segments[5].point],
        closed : true});
    cone.left = new Path({
        segments : [
        cone.segments[1].point,
        cone.segments[8].point,
        cone.segments[9].point,
        cone.segments[0].point],
        closed : true
        });

    cone.cent = new Path({
        segments : [
        cone.segments[1].point,
        cone.segments[6].point,
        cone.segments[7].point],
        closed : true});

    cone.far_left = new Path({
        segments : [
        cone.segments[0].point,
        cone.segments[9].point,
        cone.segments[10].point],
        closed : true});

    cone.far_right = new Path({
        segments : [
        cone.segments[2].point,
        cone.segments[3].point,
        cone.segments[4].point],
        closed : true});

    cone.group = new Group(cone.cent,cone.right,cone.left,cone.far_right,cone.far_left);
    return cone;
}

function Blast () {
    var NUM_POINTS = 30
    this.group = new Group();
    this.children = this.group.children;

    this.add = function(x,y) {
        var temp = new Path.Star({
            center: [x,y],
            points : NUM_POINTS,
            radius1: 0.5,
            radius2: 1,
            fillColor: "red",
            strokeColor : "orange",
            strokeWidth : NUM_POINTS/12,
            timeToDie : 25,
        });

        var segs = temp.segments;
        var ang = 0;
        for (var i = 0; i<segs.length; i++) {
            ang += 360/(NUM_POINTS)
            segs[i].vector = new Point({
                angle: ang,
                length: Math.random()
            });
        }
        this.group.addChild(temp);
    };
    this.animate = function () {
        for (var i=0; i<this.children.length; i++) {
            var cloud = this.children[i];
            if (cloud.timeToDie <= 0) {
                cloud.remove();
            }
            var segs = cloud.segments;
            for (var i = 0; i<segs.length; i++) {
                segs[i].point += segs[i].vector * cloud.timeToDie/3;
            }
            if (cloud.timeToDie < 10) {
                cloud.timeToDie-=0.5;
            } else {
                cloud.timeToDie--;
            }
        }

    }
}

function Tank (x,y,color,base_color,team) {
    var x = x || config.TANK_WIDTH + 10;
    var y = y || paper.view.size.height/1.5;
    var color = color || "#bb8822";
    var base_color = base_color || "#333333";
    var team = team || false;

    var tankBase = new Path.Rectangle({
        point : [x,y],
        size : [config.TANK_WIDTH,config.TANK_HEIGHT],
        strokeColor : 'black',
        fillColor : color // #115511 or #444444
    });

    var turretBase = new Path.Rectangle({
        size : [config.TANK_WIDTH/1.5,config.TANK_HEIGHT/1.5],
        strokeColor : 'black',
        fillColor : color // #115511 or #444444
    });

    var turretCent = new Point(x+config.TANK_WIDTH/2,y+config.TANK_HEIGHT/2);
    turretBase.position = turretCent;
    var radius = config.TANK_WIDTH/2.5;
    var turret = new Path.Circle({
        center : turretCent,
        radius : radius,
        strokeColor : 'black',
        fillColor : base_color // #118855 or #333333
    });

    // set up tank turret
    turret.removeSegment(0);
    turret.insert(4,new Point(turretCent.x-radius,turretCent.y+config.TANK_WIDTH/8));
    turret.insert(5,new Point(turretCent.x-radius-radius/3,turretCent.y+config.TANK_WIDTH/8));
    turret.insert(6,new Point(turretCent.x-radius-radius/3,turretCent.y+config.TANK_WIDTH/10));
    turret.insert(7,new Point(turretCent.x-config.TANK_HEIGHT+config.TANK_WIDTH/6,turretCent.y+config.TANK_WIDTH/16));
    turret.insert(8,new Point(turretCent.x-config.TANK_HEIGHT+config.TANK_WIDTH/6,turretCent.y-config.TANK_WIDTH/16));
    turret.insert(9,new Point(turretCent.x-radius-radius/3,turretCent.y-config.TANK_WIDTH/10));
    turret.insert(10,new Point(turretCent.x-radius-radius/3,turretCent.y-config.TANK_WIDTH/8));
    turret.insert(11,new Point(turretCent.x-radius,turretCent.y-config.TANK_WIDTH/8));

    var parts = [];
    parts.push(tankBase);
    parts.push(turretBase);
    parts.push(turret);
    //parts.push(new Path(tankBase.segment[0],tankBase.))
    var vision = new VisionCone(parts[1].position.x,parts[1].position.y);
    parts.push(vision);
    parts.push(vision.group);
    return {
        parts : parts,
        turret : parts[2],
        angle : 90,
        velocity : 0,
        reload : 0,
        gun_angle : 180,
        health : config.MAX_HP,
        team : team,
        vision : vision,

        animate : function(dir) {
            var rotate = 1/3*dir;
            this.gun_angle = (this.gun_angle + rotate) % 360;
            this.turret.rotate(rotate, this.parts[1].position);
            this.vision.rotate(rotate, this.vision.segments[1].point);
            this.vision.group.rotate(rotate,this.vision.segments[1].point);
        },
        turretCorrection : function () {
            var diff = (this.angle - (this.gun_angle + 180) % 360);
            if (Math.abs(diff) > 1) {
                if (Math.abs(diff) < 180) {
                    if (diff > 1) {
                        this.animate(.5);
                    } else if (diff < -1) {
                        this.animate(-.5);
                    }
                } else {
                    if (diff > 1) {
                        this.animate(-.5);
                    } else if (diff < -1) {
                        this.animate(.5);
                    }
                }
            }
        },
        accelerate : function(v) {
            this.turretCorrection();
            this.velocity += v;
            if (this.velocity > config.MAX_SPEED) {
                this.velocity = config.MAX_SPEED;
            } else if (this.velocity < -config.MAX_SPEED) {
                this.velocity = -config.MAX_SPEED;
            }
        },
        move : function() {
            this.checkCollisions();
            this.checkOffMap();
            if (this.reload) {
                this.reload--;
            }

            var dir = new Point({length: this.velocity/2,
                                angle: this.velocity > 0 ?
                                this.angle : this.angle+180});
            for (var i=0;i<parts.length;i++) {
                this.parts[i].position += dir;
            }
        },
        checkOffMap : function () {
            if (this.parts[0].position.y > paper.view.size.height) {
                for (var i=0;i<parts.length;i++) {
                    this.parts[i].position.y -= paper.view.size.height - 10;
                }
            } else if (this.parts[0].position.y < 0) {
                for (var i=0;i<parts.length;i++) {
                    this.parts[i].position.y += paper.view.size.height - 10;
                }
            } else if (this.parts[0].position.x - config.TANK_WIDTH/2 < 0) {
                this.velocity = -this.velocity;
            } else if (this.parts[0].position.x + config.TANK_WIDTH/2 > paper.view.size.width) {
                this.velocity = -this.velocity;
            }
        },
        reset : function () {
            var p = Point.random()*400;
            return this.clone(p);
        },
        decelerate : function () {
            if (this.velocity >= 1) {
                this.velocity -= 1;
            } else if (this.velocity <= -1) {
                this.velocity += 1;
            };
        },
        rotate : function (angle) {
            for (var i=0;i<parts.length;i++) {
                if (i > 1) {
                    this.animate(angle);
                    break;
                }
                this.parts[i].rotate(angle);
            };
            this.angle = (this.angle + angle ) % 360;
        },
        checkCollisions : function () {
            for (var i = 0; i< tanks.length; i++) {
                if (this.parts[0].intersects(tanks[i].parts[0])) {
                    this.velocity = -this.velocity;
                    return;
                }
            }
        },
        fire : function () {
            if (!this.reload) {
                this.reload = 30;
                var vector = new Point({length : 6, angle: this.gun_angle});
                shells.fire(this.turret.segments[7],vector,this);
            }
        },
        // called by AI
        update : function () {
            for (var i=0; i<tanks.length; i++) {
                if (tanks[i] === this || tanks[i].team == this.team) continue;
                if (this.vision.intersects(tanks[i].parts[0])) {
                    // in vision cone bounds
                    if (tanks[i].turret.intersects(this.vision.cent))
                        this.fire();
                    else if (tanks[i].parts[0].intersects(this.vision.far_right))
                        this.rotate(1);
                    else if (tanks[i].parts[0].intersects(this.vision.right))
                        this.animate(2);
                    else if (tanks[i].parts[0].intersects(this.vision.left))
                        this.animate(-2);
                    else if (tanks[i].parts[0].intersects(this.vision.far_left))
                        this.rotate(-1);
                    else if (tanks[i].parts[0].position.getDistance(this.parts[0].position)
                        < config.TANK_WIDTH) {
                        this.accelerate(-1);
                    } else {
                        this.accelerate(1);
                    }
                    return;
                }

            }
            //
            // only occurs if nobody in line of sight
            this.search();
        },

        // makes the AI pretty strong.
        search : function () {
            var index = 0;
            var max = config.MAX_DISTANCE;
            for (var i=0; i < tanks.length; i++) {
                if (tanks[i] === this || tanks[i].team == this.team)
                    continue;
                var temp = tanks[i].parts[0].position.getDistance(this.parts[0].position);
                if (temp < max) {
                    index = i; max = temp;
                }
            }
            var vector = tanks[index].parts[0].position - this.parts[0].position;
            var normalised_angle = this.angle > 180 ? this.angle - 360 : this.angle;
            var diff = vector.angle - normalised_angle;
            console.log(vector.angle, normalised_angle, diff);
            if (Math.abs(diff) > 20) {
                if (Math.abs(diff) < 180) {
                    if (diff > 20) {
                        this.rotate(1);
                    } else if (diff < -20) {
                        this.rotate(-1);
                    }
                } else {
                    if (vector.angle < 0) {
                        this.rotate(1);
                    } else {
                        this.rotate(-1);
                    }
                }
            } else {
                this.accelerate(1);
            }

        },

        remove : function () {
            while (this.parts.length) {
                var temp = this.parts.shift();
                temp.remove();
            }
        },

        clone : function (p) {
            var copy = Object.assign({},this);
            var ar = [];
            for (var i=0; i<this.parts.length;i++) {
                var toAdd = this.parts[i].clone();
                toAdd.position += p;
                ar.push(toAdd);
            }
            copy.parts = ar;
            copy.turret = ar[2];
            copy.health = config.MAX_HP;
            copy.team = !this.team;
            return copy;
        }
    };

}

function gameOver () {
    running = false;
    var go = document.getElementById('gameover');
    if (config.enemies) {
        go.querySelector('p').innerHTML = "Game Over!";
    } else {
        go.querySelector('p').innerHTML = "Congratulations!!";
    }
    go.style.display = 'block';
}

function resetGame() {
    for (var i=1;i<tanks.length; i++) {
        tanks[i].remove();
    }
    shells.bg.remove();
    shells.group.remove();
    smoke.group.remove();
    blasts.group.remove();
    user.remove();
}
/*
Puts together the teams for the game.
*/
function buildTeam(startx, starty, team, num) {
    for (var i=0; i<num; i++) {
        var color = team ? "#115511" : "#444444";
        var color_secondary = team ? "#446611" : "#333333";
        var temp = new Tank(10 + startx,
                starty + Math.floor(40*Math.random()),
                color,color_secondary,team);
        team ? temp.animate(-270) : temp.rotate(180);
        if (!team) temp.animate(-270);
        tanks.push(temp);
        startx += paper.view.size.width/(num+1);
    }
}

function gameInit() {
    config.score = 0;
    config.kills = 0;
    document.getElementById('gameover').style.display="none";
    config.enemies = Math.ceil(Math.random()*2);
    var allies = Math.ceil(Math.random()*5);
    user = new Tank();
    updateScore();
    user.animate(270);
    blasts = new Blast();
    smoke = new Smoke();
    shells = new Shell();

    tanks = [user];
    //buildTeam(100,config.TANK_HEIGHT,true, config.enemies);
    //buildTeam(140,paper.view.size.height - config.TANK_HEIGHT * 2,false, allies);
    running = true;
    gameover = false;
}

function updateScore() {
    document.querySelector('div.stats span.score').innerHTML = config.score;
    document.querySelector('div.stats span.kills').innerHTML = config.kills;
    document.querySelector('div#inner').style.height = 100*(user.health/config.MAX_HP) + "%";
}

function newGame() {
    resetGame();
    gameInit();
}


//-----------------------------Main--------------------

// loads newGame into global scope.
window.newGame = newGame;

// instigates a new game on load
(function(){
    gameInit();
})();


//doesn't need to exist except to prevent scrolling
function onKeyDown(event) {
    // stops scrolling
    if (event.key == 'space') {
        user.fire();
    } else if (event.key == 'p') {
        running = !running;
    }
    return false;
}

// controls basic controls
function processEvents() {
    if (Key.isDown('up')) {
        user.accelerate(-1);
    }
    if (Key.isDown('down')) {
        user.accelerate(1);
    }
    if (Key.isDown('left')) {
        user.rotate(-1);
    }
    if (Key.isDown('right')) {
        user.rotate(1);
    }
    if (Key.isDown('a')) {
        user.animate(-1);
    }
    if (Key.isDown('d')) {
        user.animate(1);
    }
}

// controls frame rate -- this is the main loop
function onFrame(event) {
    smoke.animate();
    blasts.animate();
    shells.move();
    if (running) {
        processEvents();

        if (event.count % 2 == 0) {
            user.move();
            for (var i=1; i<tanks.length; i++) {
                tanks[i].update();
                tanks[i].move();
            }
        }

        if (event.count % 10 == 0) {
            for (var i=0; i<tanks.length; i++) {
                tanks[i].decelerate();
            }
        }

        if (gameover) {
            gameOver();
        }
    }

}
