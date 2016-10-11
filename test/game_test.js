const chai = require('chai');
const should = chai.should();
const expect = chai.expect;

const jsroot = '../js/';

const Player = require(jsroot + 'player.js');
const Game = require(jsroot + 'game.js');

const playerA = new Player('John');
const playerB = new Player('Jane');
const players = [playerA, playerB];

describe('Player', function() {
  it('Has a name', function() {
    const name = 'John';
    const sut = new Player(name);
    sut.name.should.equal(name);
  });

  it('Is provided a function for getting GameEvents', function() {
    const ballsOnTable = 15;
    const eventType = Game.GameEventType.MissedBall;

    const getGameEvent = function(player) {
      return new Game.GameEvent(player, ballsOnTable, eventType);
    };
    const sut = new Player('John', getGameEvent);

    const playerEvent = sut.getGameEvent();
    playerEvent.player.should.equal(sut);
    playerEvent.ballsOnTable.should.equal(ballsOnTable);
    playerEvent.eventType.should.equal(eventType);
  })
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
    const sut = new Game.PottingRule();

    it('Counts potted balls and counts points to a Scoreboard', function() {
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

    it('Recognizes new racks', function() {
      const events = [
        new Game.GameEvent(playerA, 12, Game.GameEventType.MissedBall),
        new Game.GameEvent(playerB, 15, Game.GameEventType.NewRack)
      ];

      const scoreboard = sut.apply(events);
      scoreboard.getScore(playerA).should.equal(3);
      scoreboard.getScore(playerB).should.equal(11);
    });

    it('There are always 15 balls after a new rack', function() {
        const events = [
          new Game.GameEvent(playerA, 12, Game.GameEventType.MissedBall),
          new Game.GameEvent(playerB, 10, Game.GameEventType.NewRack)
        ];

        const scoreboard = sut.apply(events);
        scoreboard.getScore(playerA).should.equal(3);
        scoreboard.getScore(playerB).should.equal(11);
    });
  });

  describe('Foul rule', function() {
    const sut = new Game.FoulRule();

    it('Reduces two points if fould is made after first shot', function() {
      const events = [new Game.GameEvent(playerA, 15, Game.GameEventType.Foul)];
      const scoreboard = sut.apply(events);
      scoreboard.getScore(playerA).should.equal(-2);
    });

    it('Reduces one point if foul is made later in the game', function() {
      const events = [
        new Game.GameEvent(playerA, 10, Game.GameEventType.MissedBall),
        new Game.GameEvent(playerB, 9, Game.GameEventType.Foul)
      ];
      const scoreboard = sut.apply(events);
      scoreboard.getScore(playerA).should.equal(0);
      scoreboard.getScore(playerB).should.equal(-1);
    });

    it('Reduces 15 points if three consecutive fouls are made', function() {
      const events = [
        new Game.GameEvent(playerA, 10, Game.GameEventType.MissedBall),
        new Game.GameEvent(playerB, 9, Game.GameEventType.Foul), // -1
        new Game.GameEvent(playerA, 10, Game.GameEventType.Safety),
        new Game.GameEvent(playerB, 9, Game.GameEventType.Foul), // -1
        new Game.GameEvent(playerA, 10, Game.GameEventType.Safety),
        new Game.GameEvent(playerB, 9, Game.GameEventType.Foul) // -15
      ];
      const scoreboard = sut.apply(events);
      scoreboard.getScore(playerA).should.equal(0);
      scoreboard.getScore(playerB).should.equal(-17);
    });
  });
});

describe('Game', function() {
  it('Accepts only an array of two players', function() {
    {
      const sut = new Game.Game( [playerA, playerB] );
      sut.players.length.should.equal(2);
      expect(sut.start).to.not.throw();
    }
    {
      const sut = new Game.Game( [playerA] );
      expect(sut.start).to.throw(Error);
    }
    {
      const sut = new Game.Game( ['John', 'Jane'] );
      expect(sut.start).to.throw(Error);
    }
  });

  it('Gets events from players in turns', function() {
    const sut = new Game.Game(players);
    sut.start();
  });

  it('Stops if an EndGame event is returned', function() {

  });

  it('Is played by the rules', function() {
    const rules = [
      new Game.PottingRule(),
      new Game.FoulRule()
    ];

    const sut = new Game.Game(rules);

  })
});
