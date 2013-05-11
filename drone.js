var arDrone = require('ar-drone');
var client = arDrone.createClient();
var Bacon = require('baconjs')

var u = {
  round: function(n, dp) {
    return parseFloat(n.toFixed(dp))
  }
}

var _positionBus = new Bacon.Bus()
var _depthBus = new Bacon.Bus()


var movetimer;
_depthBus.throttle(50).onValue(function(dist) {
  if (dist < 35) {
    console.log("Backward")
    client.back(0.5)
  }
  if (dist > 55) {
    console.log("Forward")
    client.front(0.2)
  }
  clearTimeout(movetimer);
  movetimer = setTimeout(function() {
    console.log('cancel move')
    client.stop()
  }, 100)
})

var startupTimer = setTimeout(function(){
  client.stop()
  client.land()
}, 5000)



positionBus = _positionBus.map(function(pos) {
  return {
    x: round(0.5 - pos.x, 4),
    y: round(0.5 - pos.y, 4)
  }
}).throttle(100)

positionBus.throttle(1000).onValue(function() {
  console.log('Blink Lights')
  client.animateLeds('blinkRed', 10, 1);
})


xError = positionBus.map(function(v) { return v.x })

var shutdown, nospin;


xError.onValue(function(errX) {
  clearTimeout(startupTimer)
  if (errX > 0) {
    console.log('Counter', errX)
    client.counterClockwise(3*errX)
  } else {
    console.log('Clock', errX)
    client.clockwise(Math.abs(3*errX))
  }

  clearTimeout(nospin)
  nospin = setTimeout(function() {
    client.clockwise(0)
  }, 200)

  clearTimeout(shutdown)
  shutdown = setTimeout(function() {
    client.stop()
    client.land()
  }, 3000)

})



client.config('detect:enemy_colors','3')
client.config('detect:detect_type','10')
client.config('detect:detections_select_h','32')
client.config('detect:enemy_without_shell','0')
client.config('general:navdata_demo', 'FALSE')

client.takeoff();


client.on('navdata', function(data) {
  if (data.droneState.lowBattery === 1) {
    console.log('Battery low?', data.droneState.lowBattery)
  }
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
      _positionBus.push({ x: data.xc, y: data.yc })
      _depthBus.push(data.dist)
    }
  } else {
    console.log('No data')
  }

})
