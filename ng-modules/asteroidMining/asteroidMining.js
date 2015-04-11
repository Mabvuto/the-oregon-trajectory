require('angular');
Howl = require('howler');    // for sounds (if you need them)
Nodule = require('nodule');  // for nodule helpers

var app = angular.module('asteroid-mining', []);

app.directive("asteroidMining", function() {
    return {
        restrict: 'E',
        templateUrl: "/ng-modules/asteroidMining/asteroidMining.html"
    };
});

app.controller("asteroidMiningController", ['data', '$scope', '$rootScope', function(data, $scope, $rootScope) {
    var vm = this;
    vm.nodule = new Nodule($rootScope, 'asteroid-mining', function(){
      vm.game = new Phaser.Game(800, 600, Phaser.CANVAS, 'asteroid-mining-content', {
        preload: vm.preload,
        create: vm.create,
        update: vm.update,
        render: vm.render
      });
    });

    vm.bulletTime = 0;

    vm.preload = function() {

      // vm.game.load.image('a1', '/assets/sprites/asteroids/0.png');
      // vm.game.load.image('a2', '/assets/sprites/asteroids/1.png');
      vm.game.load.image('a3', '/assets/sprites/asteroids/p0.png');
      vm.game.load.image('space', '/assets/backgrounds/milky_way_bg.png');
      vm.game.load.image('bullet', 'http://examples.phaser.io/assets/games/asteroids/bullets.png');
      vm.game.load.image('ship', '/assets/sprites/ship-nothrust.png');

    }

    vm.create = function() {
      var w=vm.game.width;
      var h=vm.game.height;
      var rnd=vm.game.rnd.integerInRange.bind(vm.game.rnd);

      //  This will run in Canvas mode, so let's gain a little speed and display
      vm.game.renderer.clearBeforeRender = false;
      vm.game.renderer.roundPixels = true;

      //  We need arcade physics
      vm.game.physics.startSystem(Phaser.Physics.ARCADE);

      //  A spacey background
      vm.game.add.tileSprite(0, 0, vm.game.width, vm.game.height, 'space');

      //  Our ships bullets
      vm.bullets = vm.game.add.group();
      vm.bullets.enableBody = true;
      vm.bullets.physicsBodyType = Phaser.Physics.ARCADE;

      //  All 40 of them
      vm.bullets.createMultiple(40, 'bullet');
      vm.bullets.setAll('anchor.x', 0.5);
      vm.bullets.setAll('anchor.y', 0.5);

      //  Our player ship
      vm.sprite = vm.game.add.sprite(
        rnd(w/10.0, w/3.0),
        rnd(h/10.0, h*9/10.0),
        'ship');
      vm.sprite.anchor.set(3.0/5.0, 0.5);
      vm.sprite.scale.set(0.25, 0.25);
      vm.game.physics.enable(vm.sprite, Phaser.Physics.ARCADE);
      vm.sprite.body.maxVelocity.set(200);
      vm.sprite.rotation = vm.game.physics.arcade.moveToXY(vm.sprite, w,
        rnd(h/10.0, h*9/10.00),
        rnd(w/60.0, w/90.0));

      // the asteroid
      vm.asteroid = vm.game.add.sprite(
        rnd(w*2/3.0, w*9/10.0),
        rnd(h/10.0, h*9/10.0),
        'a3');
      vm.asteroid.anchor.set(0.5, 0.5);
      vm.asteroid.scale.set(0.5, 0.5);
      vm.asteroid.rotateAngle = vm.game.rnd.integerInRange(-2, 2);
      vm.game.physics.enable(vm.asteroid, Phaser.Physics.ARCADE);
      vm.game.physics.arcade.moveToXY(vm.asteroid, 0,
        rnd(h/10.0, h*9/10.00),
        rnd(w/60.0, w/90.0));

      // asteroids
      vm.asteroids = vm.game.add.group();
      // vm.asteroids.enableBody = true;
      // vm.asteroids.physicsBodyType = Phaser.Physics.ARCADE;
      // vm.createAsteroids();

      //  Game input
      vm.cursors = vm.game.input.keyboard.createCursorKeys();
      vm.game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
    }

    vm.update = function() {
      if (vm.cursors.up.isDown) {
          vm.game.physics.arcade.accelerationFromRotation(vm.sprite.rotation, 200, vm.sprite.body.acceleration);
      } else {
          vm.sprite.body.acceleration.set(0);
      }

      if (vm.cursors.left.isDown) {
          vm.sprite.body.angularVelocity = -100;
      } else if (vm.cursors.right.isDown) {
          vm.sprite.body.angularVelocity = 100;
      } else {
          vm.sprite.body.angularVelocity = 0;
      }

      if (vm.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
          vm.fireBullet();
      }

      vm.screenWrap(vm.sprite);

      // vm.bullets.forEachExists(vm.screenWrap, this);

      (function (item) {
          item.angle += item.rotateAngle;
          vm.screenWrap(item);
      })(vm.asteroid);

      vm.game.physics.arcade.overlap(vm.bullets, vm.asteroids, null, function(bullet, asteroid){
          if (!bullet.alive || !asteroid.alive) return;
          bullet.kill();
          asteroid.kill();
      });
    }

    vm.createAsteroids = function() {
        for (var enemyIndex = 0; enemyIndex < 5; enemyIndex++) {
            var indexEntry = vm.game.rnd.integerInRange(0, 3),
                x, y;
            switch (indexEntry) {
                case 0:
                {
                    x = vm.game.world.randomX;
                    y = 0;
                }
                    break;
                case 1:
                {
                    x = vm.game.width;
                    y = vm.game.world.randomY;
                }
                    break;
                case 2:
                {
                    x = vm.game.world.randomX;
                    y = vm.game.height;
                }
                    break;
                case 3:
                {
                    x = 0;
                    y = vm.game.world.randomY;
                }
                    break;
            }

            var enemy = vm.asteroids.create(x, y, "a3");
            enemy.scale = { x: 0.5, y: 0.5 };
            enemy.moveX = vm.game.rnd.integerInRange(-2, 2);
            while (enemy.moveX == 0) {
                enemy.moveX = vm.game.rnd.integerInRange(-2, 2);
            }
            enemy.moveY = vm.game.rnd.integerInRange(-2, 2);
            while (enemy.moveY == 0) {
                enemy.moveY = vm.game.rnd.integerInRange(-2, 2);
            }
            enemy.rotateAngle = vm.game.rnd.integerInRange(-2, 2);
            while (enemy.rotateAngle == 0) {
                enemy.rotateAngle = vm.game.rnd.integerInRange(-2, 2);
            }
            enemy.asteroidSize = 2;

            vm.asteroids.add(enemy);
            vm.game.physics.enable(enemy, Phaser.Physics.ARCADE);
        }

        vm.asteroids.setAll("anchor.x", 0.5);
        vm.asteroids.setAll("anchor.y", 0.5);
    }

    vm.fireBullet = function() {

        if (vm.game.time.now > vm.bulletTime)
        {
            var bullet = vm.bullets.getFirstExists(false);

            if (bullet)
            {
                var pos = vm.sprite.toGlobal(vm.sprite.anchor);
                bullet.reset(pos.x, pos.y);
                bullet.lifespan = 2000;
                bullet.rotation = vm.sprite.rotation;
                vm.game.physics.arcade.velocityFromRotation(vm.sprite.rotation, 400, bullet.body.velocity);
                bulletTime = vm.game.time.now + 50;
            }
        }
    }

    vm.screenWrap = function(sprite) {

        if (sprite.x < 0)
        {
            sprite.x = vm.game.width;
        }
        else if (sprite.x > vm.game.width)
        {
            sprite.x = 0;
        }

        if (sprite.y < 0)
        {
            sprite.y = vm.game.height;
        }
        else if (sprite.y > vm.game.height)
        {
            sprite.y = 0;
        }

    }

    vm.render = function() {

    }
}]);

module.exports = angular.module('asteroid-mining').name;