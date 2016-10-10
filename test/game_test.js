const should = require('chai').should();
const expect = require('chai').expect;

const jsroot = '../js/';

const Player = require(jsroot + 'player.js');
const Game = require(jsroot + 'game.js');

const playerA = new Player('John');
const playerB = new Player('Jane');

describe('Player', function() {
  it('Has a name', function() {
    const name = 'John';
    const sut = new Player(name);
    sut.name.should.equal(name);
  });
});

describe('GameEvent', function() {
  it('Knows how and why the turn ended', function() {
    const ballsOnTable = 4;
    const sut = new Game.GameEvent(playerA, ballsOnTable, Game.GameEventType.MissedBall);
    sut.player.should.equal(playerA);
    sut.ballsOnTable.should.equal(ballsOnTable);
    sut.eventType.should.equal(Game.GameEventType.MissedBall);
  });
});

describe('Scoreboard', function() {
  it('Contains scores for players', function() {
    const sut = new Game.Scoreboard( [
      { player: playerA, score: 0 },
      { player: playerB, score: 50 }
    ]);
    sut.getScore(playerA).should.equal(0);
    sut.getScore(playerB).should.equal(50);
    expect(sut.getScore(null)).to.be.undefined;
  });
});

describe('Rules', function() {
  describe('PottingRule', function() {
    it('Counts potted balls and adds points', function() {
      const sut = new Game.PottingRule();
      {
        const events = [new Game.GameEvent(playerA, 5)];
        const scoreboard = sut.apply(events);
        scoreboard.getScore(playerA).should.equal(10);
      }
      {
        const events = [ new Game.GameEvent(playerA, 10, Game.GameEventType.MissedBall),
                         new Game.GameEvent(playerB, 2, Game.GameEventType.MissedBall)];
        const scoreboard = sut.apply(events);
        scoreboard.getScore(playerA).should.equal(5);
        scoreboard.getScore(playerB).should.equal(8);
      }
    });
  });

  describe('Foul rule', function() {
    it('Reduces two points if fould is made after first shot', function() {
      const sut = new Game.FoulRule();
      const events = [new Game.GameEvent(playerA, 15, Game.GameEventType.Foul)];
      const scoreboard = sut.apply(events);
      scoreboard.getScore(playerA).should.equal(-2);
    });

    it('Reduces one point if foul is made later in the game', function() {
      const sut = new Game.FoulRule();
      const events = [
        new Game.GameEvent(playerA, 10, Game.GameEventType.MissedBall),
        new Game.GameEvent(playerB, 9, Game.GameEventType.Foul)
      ];
      const scoreboard = sut.apply(events);
      scoreboard.getScore(playerA).should.equal(0);
      scoreboard.getScore(playerB).should.equal(-1);
    });

    it('Reduces 15 points if three consecutive fouls are made', function() {
      const sut = new Game.FoulRule();
      const events = [
        new Game.GameEvent(playerA, 10, Game.GameEventType.MissedBall),
        new Game.GameEvent(playerB, 9, Game.GameEventType.Foul), // -1
        new Game.GameEvent(playerB, 9, Game.GameEventType.Foul), // -1
        new Game.GameEvent(playerB, 9, Game.GameEventType.Foul) // -15
      ];
      const scoreboard = sut.apply(events);
      scoreboard.getScore(playerA).should.equal(0);
      scoreboard.getScore(playerB).should.equal(-17);
    });
  });
});

describe('Game', function() {
  it('Has an array of two players', function() {
    const sut = new Game.Game();
    sut.players.length.should.equal(2);
  });

  it('Is played by the rules', function() {
    const rules = [];
    const sut = new Game.Game(rules);
  })
});
