'use strict';

const _ = require('lodash');

function Game(rules) {
  const mRules = rules;

  this.players = [1, 2];
}

const GameEventType = {
  MissedBall: 'MissedBall',
  Foul: 'Foul',
  Safety: 'Safety',
  NewRack: 'NewRack'
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
}

module.exports = {
  Scoreboard: Scoreboard,
  Game: Game,
  PottingRule: PottingRule,
  FoulRule: FoulRule,
  GameEvent: GameEvent,
  GameEventType: GameEventType
};
