var arDrone = require('ar-drone');
var client = arDrone.createClient();
var Bacon = require('baconjs')
var droneUtil = require('./droneUtils')

droneUtil.logBattery(client)
          .enableEnemyDetection(client, 'blue', true)

process.on('SIGINT', function() {
console.log('Killing')
  client.stop()
  client.land()
  setTimeout(function() {
    process.exit()
  }, 500)
})

var fc = {
  rotateThrottle: 75 //ms
, rotateScale: 3
, vertThrottle: 200
, forwardThrottle: 200
}

var enable = {
  x: true,
  y: true,
  z: true,
  fly: true
}

//rotation: 25ms
//movement: 200ms

var u = {
  round: function(n, dp) {
    return parseFloat(n.toFixed(dp))
  }
}

if (enable.fly) { client.takeoff() }
setTimeout(function() {
  client.stop()
  client.land()
}, 60*1000)


var detections = new Bacon.Bus()
var detected = detections.map(true)


detected.throttle(1000).onValue(function() {
  client.animateLeds('blinkRed', 10, 1);
})

if (enable.x) {
  var xTimeout;
  var xPosition = detections.map(function(data) { return data.xc })
                            .throttle(fc.rotateThrottle*3)


  var xError = xPosition.map(function(x) { return 0.5 - x })
                        .map(function(dx) {
                          if (dx > 0 ) {
                            return ['counterClockwise', dx]
                          } else {
                            return ['clockwise', -1*dx]
                          }
                        })

  xError.onValue(function(dir) {
    var rotateSpeed = dir[1] * fc.rotateScale;
    if (rotateSpeed > 1) rotateSpeed = 1
    rotateSpeed = u.round(rotateSpeed, 2)

    console.log('Try to rotate', dir[0], rotateSpeed)

    client[dir[0]](rotateSpeed)

    clearTimeout(xTimeout)
    xTimeout = setTimeout(function() {
      client.clockwise(0)
    }, fc.rotateThrottle)
  })
}


if (enable.y) {
  var yPosition = detections.map(function(data) { return data.yc })
                            .throttle(fc.vertThrottle)


  var yError = yPosition.map(function(y) { return 0.7 - y })
                        .map(function(dy) {
                          if (dy > 0.1) {
                            return 'up'
                          } else if (dy < -0.1) {
                            return 'down'
                          } else {
                            return 'stop'
                          }
                        })

  var yTimeout;
  yError.onValue(function(dir) {
    console.log('y')
    if (dir === 'stop') {
      client.up(0)
      client.down(0)
    } else {
      client[dir](0.35)
    }


    clearTimeout(yTimeout)
    yTimeout = setTimeout(function() {
      client.up(0)
      client.down(0)
    }, fc.vertThrottle)
  })
}

if (enable.z) {
  var zPosition = detections.map(function(data) { return data.dist })
                            .throttle(fc.forwardThrottle)

  //zPosition.log()
  
  var zError = zPosition.map(function(dz) {
                          if (dz < 80) {
                            return 'back'
                          } else if (dz > 120) {
                            return 'front'
                          } else {
                            return 'stop'
                          }
                        })
  zError.log()
  var zTimeout;
  zError.onValue(function(dir) {
    if (dir === 'stop') {
      client.front(0)
      client.back(0)
    } else {
      client[dir](0.1)
    }
  })


  clearTimeout(zTimeout)
  zTimeout = setTimeout(function() {
    client.front(0)
    client.back(0)
  }, fc.forwardThrottle/2)
  zError.log()
}

                        
                      
//xError.onValue(function(errX) {
//  clearTimeout(startupTimer)
//  if (errX > 0) {
//    //console.log('Counter', errX)
//    client.counterClockwise(3*errX)
//  } else {
//    //console.log('Clock', errX)
//    client.clockwise(Math.abs(3*errX))
//  }
//
//  clearTimeout(nospin)
//  nospin = setTimeout(function() {
//    client.clockwise(0)
//  }, 200)
//
//  clearTimeout(shutdown)
//  shutdown = setTimeout(function() {
//    client.stop()
//    client.land()
//  }, 3000)
//
//})


//var _positionBus = detections.map(function(detectData) { return { x: detectData.xc, y: detectData.yc } })
//var _depthBus = detections.map(function(detectData) { return detectData.dist })
//
//detected.onValue(function() { console.log( new Date().valueOf()) })
//
//var movetimer;
//_depthBus.throttle(50).onValue(function(dist) {
//  if (dist < 35) {
//    //console.log("Backward")
//    client.back(0.5)
//  }
//  if (dist > 55) {
//    //console.log("Forward")
//    client.front(0.2)
//  }
//  clearTimeout(movetimer);
//  movetimer = setTimeout(function() {
//    //console.log('cancel move')
//    client.stop()
//  }, 100)
//})
//
//var startupTimer = setTimeout(function(){
//  client.stop()
//  client.land()
//}, 5000)
//
//
//
//positionBus = _positionBus.map(function(pos) {
//  return {
//    x: u.round(0.5 - pos.x, 4),
//    y: u.round(0.5 - pos.y, 4)
//  }
//}).throttle(100)
//
//positionBus.throttle(1000).onValue(function() {
//  //console.log('Blink Lights')
//  client.animateLeds('blinkRed', 10, 1);
//})
//
//
//xError = positionBus.map(function(v) { return v.x })
//
//var shutdown, nospin;
//
//
//xError.onValue(function(errX) {
//  clearTimeout(startupTimer)
//  if (errX > 0) {
//    //console.log('Counter', errX)
//    client.counterClockwise(3*errX)
//  } else {
//    //console.log('Clock', errX)
//    client.clockwise(Math.abs(3*errX))
//  }
//
//  clearTimeout(nospin)
//  nospin = setTimeout(function() {
//    client.clockwise(0)
//  }, 200)
//
//  clearTimeout(shutdown)
//  shutdown = setTimeout(function() {
//    client.stop()
//    client.land()
//  }, 3000)
//
//})
//
//
//
//client.config('general:navdata_demo', 'FALSE')

//client.takeoff();


client.on('navdata', function(data) {
  var d = data.visionDetect;
  if (d) {
    var data = {
      count: parseInt(d.nbDetected, 10),
      xc: d.xc[0] / 950,
      yc: d.yc[0] / 950,
      w: d.width[0],
      h: d.height[0],
      dist: d.dist[0],
      angle: d.orientationAngle[0]
    };

    if (data.count > 0) {
      detections.push(data)
    }
  } else {
    console.log('No data')
  }

})
