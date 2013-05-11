var loggedBattery = false;

var utils = {

  logBattery: function(client) {
    console.log('Log battery')
    client.config('general:navdata_demo', 'FALSE')
    client.on('navdata', function(data) {
      if (!loggedBattery) {
        loggedBattery = true;
        if (data.droneState.lowBattery === 1) {
          console.log('Battery low?')
        } else {
          console.log('Battery ok!')
        }
      }
    });
    return utils;
  },

  enableEnemyDetection: function(client, color, sticker) {
    console.log('Enable enemy detection')
    // green: 1
    // yellow: 2
    // blue: 3
    var colMap = {
      green: '1',
      yellow: '2',
      blue: '3'
    }
    var withoutShell = '1'
    if (sticker) withoutShell = '0';

    client.config('detect:enemy_colors',colMap[color])
    client.config('detect:detect_type','10')
    client.config('detect:detections_select_h','32')
    client.config('detect:enemy_without_shell',sticker)
    console.log('Configure', colMap[color], sticker)
    return utils;
  }

}

module.exports = utils;
