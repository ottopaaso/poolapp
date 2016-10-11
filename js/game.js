'use strict';

const _ = require('lodash');
const path = require('path');
const Player = require( path.resolve( __dirname, "./player.js" ) );

function Game(players, rules) {
  const mRules = rules;
  const mEvents = [];
  var mTurn = 0;
  this.players = players;

  this.start = function() {
    if (players.length != 2) {
      throw Error('2 players required!');
    } else if ( !(players[0] instanceof Player && players[1] instanceof Player) ) {
      throw Error('Players were not of Player type!');
    }

    while (1) {
      const player = players[mTurn % 2];
      const event = player.getGameEvent();
      mEvents.push( event );
      mTurn++;

      if ( _.isEqual(event.eventType, GameEventType.EndGame) ) {
        break;
      }
    }
  };

  this.calculateScore = function(events) {
    const scoreboards = _.map(mRules, function(rule) {
      return rule.apply(events);
    });

    return _.reduce(scoreboards, function(acc, val, {} ) {
      return acc.add(val);
    });
  }
}

const GameEventType = {
  MissedBall: 'MissedBall',
  Foul: 'Foul',
  Safety: 'Safety',
  NewRack: 'NewRack',
  EndGame: 'EndGame'
}

function GameEvent(player, ballsOnTable, eventType) {
  this.player = player;
  this.ballsOnTable = ballsOnTable;
  this.eventType = eventType;
}

function PottingRule() {
  this.apply = function(events) {
    const players = _.uniq(_.map(events, function(event) {
      return event.player;
    }));

    var scores = _.map(players, function(value) {
      return { player: value, score: 0};
    });

    var ballsOnTable = 15;
    _.forEach(events, function(event) {
      const scoreObject = _.find(scores, function(value) {
        return _.isEqual(value.player, event.player);
      });

      if ( _.isEqual(event.eventType, GameEventType.NewRack) ) {
        scoreObject.score += (ballsOnTable - 1);
        ballsOnTable = 15;
      } else {
        scoreObject.score += (ballsOnTable - event.ballsOnTable);
        ballsOnTable = event.ballsOnTable;
      }
    });

    return new Scoreboard(scores);
  }
}

function FoulRule() {
  this.apply = function(events) {
    if (_.isEmpty(events)) {
      return new Scoreboard( {} );
    }

    const players = _.uniq(_.map(events, function(event) {
      return event.player;
    }));

    var scores = _.map(players, function(value) {
      return { player: value, score: 0, consecutiveFoulCount: 0};
    });

    const firstEvent = _.first(events);

    _.forEach(events, function(event) {
      const scoreObject = _.find(scores, function(value) {
        return _.isEqual(value.player, event.player);
      });

      if ( !_.isEqual(event.eventType, GameEventType.Foul) ) {
        scoreObject.consecutiveFoulCount = 0;
        return;
      }

      scoreObject.consecutiveFoulCount++;
      if (scoreObject.consecutiveFoulCount >= 3) {
        scoreObject.score += -15;
      } else {
        scoreObject.score += (event === firstEvent ? -2 : -1);
      }
    });

    return new Scoreboard(scores);
  };
}

function Scoreboard(scores) {
  this.scores = scores;

  this.getScore = function(player) {
    const result = _.find(this.scores, function(score) {
      return _.isEqual(score.player, player);
    });

    return result ? result.score : undefined;
  };

  this.add = function(other) {
    var scoreObj = _.map(this.scores, function(score) { return score; });
    _.forEach(other.scores, function(otherScore) {
      var obj = _.find(scoreObj, function(score) {
        return score.player == otherScore.player;
      });

      if (obj) {
        obj.score += otherScore.score;
      } else {
        scoreObj.push(otherScore);
      }
    });

    return new Scoreboard(scoreObj);
  }
}

module.exports = {
  Scoreboard: Scoreboard,
  Game: Game,
  PottingRule: PottingRule,
  FoulRule: FoulRule,
  GameEvent: GameEvent,
  GameEventType: GameEventType
};
