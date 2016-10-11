'use strict';

function Player(name, getGameEventFunction) {
  this.name = name;
  this.getGameEvent = function() {
    return getGameEventFunction(this);
  }
}

module.exports = Player;
