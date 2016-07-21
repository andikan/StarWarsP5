var bgImg, swLogo, dsImg, pbImg;
var configuation;
var computer;
var player;
var overAt;
var gs;

function preload() {
  bgImg = loadImage("assets/bg01.png");
  swLogo = loadImage("assets/starwars_logo.png");
  dsImg = loadImage("assets/bg02.png");
  pbImg = loadImage("assets/bg03.png");
}

function setup() {
	createCanvas(1000, 1000);
	configuration = new Configuration();
	computer = new Computer();
	player = new Player();
	gs = new GaussSense();
	// gs = new GaussSense('ws://192.168.170.191:5100');
}

function draw() {
	image(bgImg, 0, 0);

	switch(configuration.status) {
		case 0:
			loopMenu();
		break;

		case 1:
			loopGame();
		break;

		case 2:
			loopOver();
		break;
	}
}

function loopMenu() {
	image(swLogo, (width - swLogo.width/2)/2, (height - swLogo.height/2)/3, swLogo.width/2, swLogo.height/2);
	image(dsImg, (width - 150)/2, (height - 150)/2, 150, 150);

	textSize(40);
	fill(255);
	textAlign(CENTER);
	if(millis() % 200 > 100) {
    text("Start", width/2, height/2+20);
  }
}

function loopGame() {
	computer.draw();
	computer.update();

	player.draw();
	player.update(computer.getShots());
}

function loopOver() {
	player.protectBase.drawExplode();
	text("Press Space To Restart", width/3-20, height/2);
}

function mouseClicked() {
  switch(configuration.status) {
  	case 0:
  		configuration.restart();
  	break;

  	case 1:
  		player.newShot(mouseX, mouseY);
  	break;

  	case 2:
  	break;
  }

  // prevent default
  return false;
}

function touchStarted() {
	switch(configuration.status) {
  	case 0:
  		configuration.restart();
  	break;

  	case 1:
  		var diffX = touchX - width/2;
  		var diffY = touchY - height/2;
  		player.newShot(width/2 + diffX*2, height/2 + diffY*2);
  	break;

  	case 2:
  	break;
  }

  // prevent default
  return false;
}


/*
	Class: Configuration
*/
function Configuration() {
	/*
		status 0 : MENU
		status 1 : GAME
		status 2 : OVER
	*/
	this.status = 0;

	this.setStatus = function(_status) {
		this.status = _status;
	};

	this.restart = function() {
		computer.reset();
		player.reset();
		this.status = 1;
	}
}

/*
	Class: Computer
*/
function Computer() {
	this.shots = [];

	this.countShots = 0;

	this.lastMillis = millis();
	this.startAt = millis();

	this.MAX_SHOTS = 50;

	this.getShots = function() {
		return this.shots;
	}

	this.reset = function() {
		this.lastMillis = millis();
		this.countShots = 1;
		this.shots = [];

		for(var i=0; i<this.countShots; i++) {
			this.shots.push(this.newShot(random(random(3))));
		}

		this.startAt = millis();
	}


	this.newShot = function(multiplier) {
		var x, y;

		if (random(1) >= 0.5) {
			y = random(height);
			if (random(1) >= 0.5) {
        x = 0 - 50 / 2 * multiplier;
      } 
      else {
        x = width + 50 / 2 * multiplier;
      }
		}
		else {
			x = random(width);
			if (random(1) >= 0.5) {
        y = 0 - 50 / 2 * multiplier;
      } 
      else {
       y = height + 50 / 2 * multiplier;
      }
		}

		var position = new p5.Vector(x, y);
		var forceX = -(x - (width / 2)) / 500;
    var forceY = -(y - (height / 2)) / 500;
    var force = new p5.Vector(forceX, forceY);
    var shot = new Shot(1, force, position);

    return shot;
	}

	this.drawShots = function() {
		for(var i=0; i<this.shots.length; i++) {
			this.shots[i].draw();
		}
	}

	this.updateShots = function() {
		for(var i=0; i<this.shots.length; i++) {
			this.shots[i].update();

			if (!this.shots[i].getValid()) {
        this.shots[i] = this.newShot(random(3));
      }
		}
	}

	this.collisionThisShots = function() {
		for (var i = 0; i < this.countShots; ++i) {
      for (var j = i; j < this.countShots; ++j) {
        if (i != j) {
          this.shots[i].collision(this.shots[j]);
        }
      }
    }
	}

	this.update = function() {
		var currentMax = 2;
		if (this.countShots < currentMax && millis() > this.lastMillis + 1000) {
      this.shots.push(this.newShot(random(3)));
      this.countShots ++;
      this.lastMillis = millis();
    }
		this.updateShots();
		this.collisionThisShots();
	}

	this.draw = function() {
		if(configuration.status == 1) {
			this.drawShots();
		}
	};
}


/*
	Class: Shot
*/
function Shot(id, force, position) {
	this.id = id;
	this.oldPositions = [];
	this.oldPositions.push(new p5.Vector(position.x, position.y));
	this.indexPosition = 1;
	this.lastMillis = 0;

	this.size = 50;
	this.force = force;
	this.position = position;
	this.explosion = false;
	this.valid = true;

	this.getPosition = function() {
		return this.position;
	}

	this.getSize = function() {
		return this.size;
	}

	this.getValid = function() {
		return this.valid;
	}

	this.getExplosion = function() {
		return this.explosion;
	}

	this.setExplosion = function(explosion) {
		this.explosion = explosion;
	}

	this.update = function() {
		var lastOldPosition = (this.oldPositions.length + this.indexPosition - 1) % this.oldPositions.length;
		if ((millis() - this.lastMillis) > 10) {
      this.oldPositions.push(new p5.Vector(this.position.x, this.position.y));
      this.indexPosition++;

      if (this.indexPosition >= this.oldPositions.length) {
        this.indexPosition -= this.oldPositions.length;
      }

      if(this.oldPositions.length > 10) {
      	this.oldPositions.splice(0, 1);
      }
      this.lastMillis = millis();
    } else {
      this.oldPositions[this.indexPosition] = new p5.Vector(this.position.x, this.position.y);
    }

    if (this.explosion) {
      if (this.size < 100 / 2) {
        this.size += sqrt(this.size / 2);
      } else if (this.size < 100) {
        this.size += 10000 / pow(this.size, 2);
      } else {
        this.valid = false;
      }
      force.div(2);
    }

    this.position.add(this.force);
	}


	this.draw = function() {
		this.drawTail();
		noFill();
		strokeWeight(2);
		if (this.explosion) {
      stroke(255, 0, 0);
    } else {
      stroke(255);
    }
    ellipse(this.position.x, this.position.y, this.size, this.size);
	};


	this.drawTail = function() {
		var lastOld = null;
		for(var i=this.indexPosition; i < this.oldPositions.length + this.indexPosition; i++) {
			var index = i % this.oldPositions.length;
			var old = this.oldPositions[index];

			if(old != null) {
				if(lastOld != null) {
					var c = (i - this.indexPosition) * ((200 - 20) / this.oldPositions.length);

					if(id == 1) {
						stroke(20, c + 20, 20, 30);
			      strokeWeight(50 / 2);
			      line(lastOld.x, lastOld.y, old.x, old.y);

			      stroke(20, c + 20, 20);
			      strokeWeight(50 / 4);
			      line(lastOld.x, lastOld.y, old.x, old.y);
			    }
			    else {
			    	stroke(c + 20, 20, 20, 30);
			      strokeWeight(50 / 2);
			      line(lastOld.x, lastOld.y, old.x, old.y);

			      stroke(c + 20, 20, 20);
			      strokeWeight(50 / 4);
			      line(lastOld.x, lastOld.y, old.x, old.y);
			    }
		    }
		    else {
		    	lastOld = old;
		    }
	    }
		}
	}

	this.collision = function(shot) {
    var distance = this.position.dist(shot.getPosition());
    if (distance < (this.size + shot.getSize()) / 2) {
      this.explosion = true;
      shot.setExplosion(true);
      return true;
    }
    return false;
  }

  this.outScreen = function() {
  	return ((this.position.x + this.size < 0) && (this.force.x < 0)) ||
           ((this.position.x - this.size > width) && (this.force.x > 0)) ||
           ((this.position.y + this.size < 0) && (this.force.y < 0)) ||
           ((this.position.y - this.size > height) && (this.force.y > 0));
  }
}


/*
	Class: Base
*/
function Base(center) {
	this.size = 150;
	this.lastSize = 150;
	this.center = center;
	this.hp = 1;
	this.dsImg = dsImg;

	this.getCenter = function() {
		return this.center;
	}

	this.getSize = function() {
		return this.size;
	}

	this.update = function(enemies) {
		for(var i=0; i<enemies.length; i++) {
			if(enemies[i] != null) {
				this.collision(enemies[i]);
			}
		}

		if(this.hp < 0) {
			overAt = millis();
      configuration.setStatus(2);
    }
	}

	this.draw = function() {
		image(dsImg, (width - 150)/2, (height - 150)/2, 150, 150);
	}

	this.collision = function(enemy) {
		var distance = this.center.dist(enemy.getPosition());
		if((distance - this.size/2) <= (enemy.getSize()/2) && enemy.id == 1 && !enemy.getExplosion()) {
			this.hp -= 1;
			enemy.setExplosion(true);
		}
	}
}

/*
	Class: Base
*/
function ProtectBase(center) {
	this.size = 300;
	this.center = center;
	this.hp = 1;
	this.pbImg = pbImg;
	this.angles = [];
	this.angleTimers = [];
	this.angleNum = 10;

	for(var i=0; i<this.angleNum; i++) {
		this.angles.push(0);
		this.angleTimers.push(0);
	}

	this.update = function(enemies) {
		for(var i=0; i<enemies.length; i++) {
			if(enemies[i] != null) {
				this.collision(enemies[i]);
			}
		}
	}

	this.collision = function(enemy) {
		var distance = this.center.dist(enemy.getPosition());
    var angle = atan2(enemy.getPosition().y-this.center.y, enemy.getPosition().x-this.center.x) - atan2(0, 1);
    if(angle < 0) {
    	angle += 2*PI;
    }


    if ((distance - this.size / 2) <= (enemy.getSize() / 2)) {
    	var angleIndex = Math.floor((degrees(angle)%360)/(360/this.angleNum));
      var isProtectAngle = this.angles[angleIndex];
      if(isProtectAngle == 0) {
        this.angles[angleIndex] = 1;
        this.angleTimers[angleIndex] = millis();
        enemy.setExplosion(true);
      }
    }
	}

	this.draw = function() {
		image(pbImg, (width - 300)/2, (height - 300)/2, 300, 300);

		for(var i=0; i<this.angleNum; i++) {
			noFill();
			stroke(200);
			if(this.angles[i] == 1) {
				var elapsedTime = millis() - this.angleTimers[i];
				if(elapsedTime%200 > 50) {
          stroke(255, 0, 0);
        }
        else {
          stroke(150, 150, 150);
        }

        if(millis() - this.angleTimers[i] > 1000) {
          this.angles[i] = 2;
        }
			}

			if(this.angles[i] == 2) {
				noStroke();
			}

			strokeWeight(3);
      var start = i*radians(360/this.angleNum);
      var end = (i+1)*radians(360/this.angleNum);
      arc(this.center.x, this.center.y, this.size, this.size, start, end);
		}
	}

	this.drawExplode = function() {
		var eclapsedTime = millis() - overAt;
		if(eclapsedTime < 6000) {
			image(pbImg, (width - 300*(eclapsedTime/1000))/2, (height - 300*(eclapsedTime/1000))/2, 300*(eclapsedTime/1000), 300*(eclapsedTime/1000));
		}
	}
}

/*
	Class: CustomAngle
*/
function CustomAngle(angle, alpha, step) {
	this.angle = angle;
  this.alpha = alpha;
  this.step = step;
}

/*
	Class: LightsBar
*/
function LightsBar(center) {
	this.center = center;
	this.valid = false;
	this.status = 0;
	this.control = 0;
	this.previousControl = 0;
	this.size = 600;
	this.thld = 10;
	this.duration = 1000;
	this.angleList = [];

	this.lightsBarStartAt;
	this.lightsBarEndAt;
	this.startAt = millis();
	this.endAt = millis();
	this.currentAngle;
	this.previousAngle;

	this.update = function(enemies) {
		// console.log('LightsBar update');
		var midpoint = gs.getBipolarMidpoint();
		this.currentAngle = degrees(midpoint.angle + PI);
		var pos = new p5.Vector(this.center.x + 100*cos(midpoint.angle+PI), this.center.y + 100*sin(midpoint.angle+PI));
		
		var angleDiff = abs(this.currentAngle - this.previousAngle);
		if(angleDiff > this.thld && this.status == 0 && millis()-this.endAt > 200) {
			this.lightsBarStartAt = this.calculateAngle(pos.x, pos.y);
			// console.log('start: ' + this.lightsBarStartAt);
			this.angleList = [];
			this.angleList.push(new CustomAngle(this.lightsBarStartAt, 255, 1));
			this.status = 1;
			this.startAt = millis();
			this.valid = false;
		}
		else if(angleDiff <= 1 && this.status == 1 && millis()-this.startAt > 200) {
			this.lightsBarEndAt = this.calculateAngle(pos.x, pos.y);
			// console.log('end: ' + this.lightsBarEndAt);
			this.angleList.push(new CustomAngle(this.lightsBarEndAt, 255, 1));
			this.status = 0;
			this.endAt = millis();
			this.valid = true;
		}
		else if(angleDiff > 1 && this.status == 1) {
			this.angleList.push(new CustomAngle(this.calculateAngle(pos.x, pos.y), 255, 1));
		}
		
		if(this.valid || this.status == 1) {
			for(var i=0; i<enemies.length; i++) {
				if(enemies[i] != null) {
					this.collision(enemies[i]);
				}
			}

			if(millis - this.endAt > this.duration) {
				this.valid = true;
			}
		}

		this.previousAngle = this.currentAngle;
	}


	this.calculateAngle = function(x, y) {
		var angle = atan2(y-this.center.y, x-this.center.x) - atan2(0, 1) + PI;
		return angle;
	}

	this.draw = function() {
		for(var i=0; i<this.angleList.length-1; i++) {
			var angleStart = this.angleList[i];
			var angleNext = this.angleList[i+1];

			fill(255, 0, 0, angleStart.alpha);
			noStroke();

			if(abs(angleStart.angle - angleNext.angle) > PI) {
        if(angleStart.angle < angleNext.angle) {
          arc(this.center.x, this.center.y, this.size, this.size, angleNext.angle, angleStart.angle+2*PI);
        }
        else {
          arc(this.center.x, this.center.y, this.size, this.size, angleStart.angle, angleNext.angle+2*PI);
        }
      }
      else if(angleStart.angle < angleNext.angle) {
        arc(this.center.x, this.center.y, this.size, this.size, angleStart.angle, angleNext.angle);
      }
      else {
         arc(this.center.x, this.center.y, this.size, this.size, angleNext.angle, angleStart.angle);
      }

      angleStart.alpha -= angleStart.step;
      angleStart.step += 1;
      
      if(angleStart.alpha < 1) {
        this.angleList.splice(i, 1);
      }
		}
	}

	this.collision = function(enemy) {
		var distance = this.center.dist(enemy.getPosition());
    var angle = atan2(enemy.getPosition().y-this.center.y, enemy.getPosition().x-this.center.x) - atan2(0, 1);
    if(angle < 0) {
    	angle += 2*PI;
    }

    var isExplosion = false;
    if ((distance - this.size / 2) <= (enemy.getSize() / 2)) {
    	for(var i=0; i<this.angleList.length-1; i++) {
    		var angleStart = this.angleList[i];
    		var angleNext = this.angleList[i+1];

    		if(!isExplosion) {
    			if(abs(angleStart.angle - angleNext.angle) > PI) {
	    			if(angleStart.angle < angleNext.angle) {
	    				if((angle >= angleNext.angle && angle <= 2*PI) || (angle >= 0 && angle <= angleStart.angle)) {
	              enemy.setExplosion(true);
	              isExplosion = true;
	            }
	    			}
	    			else {
		          if((angle >= angleStart.angle && angle <= 2*PI) || (angle >= 0 && angle <= angleNext.angle)) {
		            enemy.setExplosion(true);
		            isExplosion = true;
		          }
		        }
		      }
		      else if(angleStart.angle < angleNext.angle) {
            if(angle >= angleStart.angle && angle <= angleNext.angle) {
              enemy.setExplosion(true);
              isExplosion = true;
            }
          }
          else {
            if(angle >= angleNext.angle && angle <= angleStart.angle) {
              enemy.setExplosion(true);
              isExplosion = true;
            }
          }
    		}
    	}
    }
	}
};


/*
	Class: Player
*/
function Player() {
	this.score = -1;
	this.shots = [];
	this.base;
	this.protectBase;
	this.lightsBar;

	this.getShots = function() {
		return this.shots;
	}


	this.reset = function() {
		this.score = 0;
		this.shots = [];
		this.base = new Base(new p5.Vector(width/2, height/2));
		this.protectBase = new ProtectBase(new p5.Vector(width/2, height/2));
		this.lightsBar = new LightsBar(new p5.Vector(width/2, height/2));
	}

	this.draw = function() {
		this.drawShots();
		if(configuration.status == 1) {
			this.base.draw();
			this.protectBase.draw();
			this.lightsBar.draw();
		}
	}

	this.drawShots = function() {
		for(var i=0; i<this.shots.length; i++) {
				this.shots[i].draw();
		}
	}

	this.update = function(enemies) {
		this.collisionShots(enemies);
		this.base.update(enemies);
		this.protectBase.update(enemies);
		this.lightsBar.update(enemies);
		this.updateShots();
	}

	this.updateShots = function() {
		for (var i = 0; i < this.shots.length; i++) {
      if (this.shots[i] != null) {
        this.shots[i].update();
        if (this.shots[i].outScreen()) {
          this.shots[i].setExplosion(true);
        }
        if (!this.shots[i].getValid()) {
          this.shots.splice(i, 1);
        }
      }
    }
	}

	this.newShot = function(x, y) {
		var force = new p5.Vector(x, y);
		force.sub(this.base.getCenter());
		force.div(10);
  
    var pos = this.calculateSight(x, y);

  	this.shots.push(new Shot(0, force, pos));
	}

	this.collisionShots = function(enemies) {
		this.collisionThisShots();
		this.collisionEnemiesShots(enemies);
	}

	this.collisionThisShots = function() {
		for (var i = 0; i < this.shots.length; i++) {
      for (var j = i; j < this.shots.length; j++) {
        if (i != j) {
          this.shots[i].collision(this.shots[j]);
        }
      }
    }
	}

	this.collisionEnemiesShots = function(enemies) {
    for (var i = 0; i < this.shots.length; i++) {
      for (var j = 0; j < enemies.length; j++) {
        if (enemies[j] != null && this.shots[i] != null) {
          var explosion = enemies[j].getExplosion();
          if (this.shots[i].collision(enemies[j]) && !explosion) {
            this.score++;
          }
        }
      }
    }
  }

  this.calculateSight = function(x, y) {
  	var pos = new p5.Vector(x - this.base.getCenter().x, y - this.base.getCenter().y);
    pos.normalize();
    pos.mult(this.base.getSize() / 2);
    return pos.add(this.base.getCenter());
  }
}




