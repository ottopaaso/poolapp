const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);

const should = chai.should();
const expect = chai.expect;

const jsroot = '../js/';

const Player = require(jsroot + 'player.js');
const Game = require(jsroot + 'game.js');

const eventGenerator = function(player) {
  return new Game.GameEvent(player, 15, Game.GameEventType.EndGame);
};

const playerA = new Player('John', eventGenerator.bind(this) );
const playerB = new Player('Jane', eventGenerator.bind(this) );
const players = [playerA, playerB];

describe('Player', function() {
  it('Has a name', function() {
    const name = 'John';
    const sut = new Player(name, function() { } );
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
  const sut = new Game.Scoreboard( [
    { player: playerA, score: 0 },
    { player: playerB, score: 50 }
  ]);

  it('Contains scores for players', function() {
    sut.getScore(playerA).should.equal(0);
    sut.getScore(playerB).should.equal(50);
    expect(sut.getScore(null)).to.be.undefined;
  });

  it('Can add other scoreboard to self and return a new one', function() {
    const other = new Game.Scoreboard( [ { player: playerA, score: 10 } ] );
    const result = sut.add(other);
    result.getScore(playerA).should.equal(10);
    result.getScore(playerB).should.equal(50);
  });
});

describe('Rules', function() {
  describe('PottingRule', function() {
    const sut = new Game.PottingRule();

    describe('Counts potted balls and counts points to a Scoreboard', function() {
      it('case 1', function() {
          const events = [new Game.GameEvent(playerA, 5)];
          const scoreboard = sut.apply(events);
          scoreboard.getScore(playerA).should.equal(10);
      });

      it('case 2', function() {;
          const events = [ new Game.GameEvent(playerA, 10, Game.GameEventType.MissedBall),
                           new Game.GameEvent(playerB, 2, Game.GameEventType.MissedBall)];
          const scoreboard = sut.apply(events);
          scoreboard.getScore(playerA).should.equal(5);
          scoreboard.getScore(playerB).should.equal(8);
      });
    });

    describe('Recognizes new racks', function() {
      it('case 1', function() {
        const events = [
          new Game.GameEvent(playerA, 12, Game.GameEventType.MissedBall),
          new Game.GameEvent(playerB, 15, Game.GameEventType.NewRack)
        ];

        const scoreboard = sut.apply(events);
        scoreboard.getScore(playerA).should.equal(3);
        scoreboard.getScore(playerB).should.equal(11);
      });

      it('case 2', function() {
        const events = [
          new Game.GameEvent(playerA, 14, Game.GameEventType.MissedBall),
          new Game.GameEvent(playerB, 5, Game.GameEventType.Safety),
          new Game.GameEvent(playerA, 5, Game.GameEventType.Foul),
          new Game.GameEvent(playerB, 15, Game.GameEventType.NewRack),
          new Game.GameEvent(playerB, 15, Game.GameEventType.NewRack),
          new Game.GameEvent(playerB, 12, Game.GameEventType.EndGame)
        ];

        const scoreboard = sut.apply(events);
        scoreboard.getScore(playerA).should.equal(1);
        scoreboard.getScore(playerB).should.equal(30);
      });
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
  describe('Creating a game', function() {
    it('Accepts an array of two players', function() {
      const sut = new Game.Game( [playerA, playerB] );
      sut.players.length.should.equal(2);
      expect(sut.start).to.not.throw();
    });

    it('Throws with only one player', function() {
      const sut = new Game.Game( [playerA] );
      expect(sut.start).to.throw(Error);
    });

    it('Requires players to be of type Player', function() {
      const sut = new Game.Game( ['John', 'Jane'] );
      expect(sut.start).to.throw(Error);
    });  
  });

  it('Gets events from players in turns until EndGame event is received', function() {
    var firstTime = true;
    const af = function(player) {
      if (firstTime) {
        firstTime = false;
        return new Game.GameEvent(player, 14, Game.GameEventType.MissedBall);
      }

      return new Game.GameEvent(player, 2, Game.GameEventType.EndGame);
    }
    const afSpy = chai.spy(af);
    const a = new Player('John', afSpy);

    const bf = function(player) {
      return new Game.GameEvent(player, 14, Game.GameEventType.MissedBall);
    }
    const bfSpy = chai.spy(bf);
    const b = new Player('Jane', bfSpy);

    const sut = new Game.Game([a, b]);
    sut.start();

    afSpy.should.have.been.called();
    bfSpy.should.have.been.called();
  });

  describe('Is played by all the rules', function() {
    const rules = [
      new Game.PottingRule(),
      new Game.FoulRule()
    ];
    const sut = new Game.Game(players, rules);

    it('case 1', function() {
      const events = [
        // +1 for playerA
        new Game.GameEvent(playerA, 14, Game.GameEventType.MissedBall),
        // +9 for playerB
        new Game.GameEvent(playerB, 5, Game.GameEventType.Safety),
        // -1 for playerA
        new Game.GameEvent(playerA, 5, Game.GameEventType.Foul),
        // +4 for playerB
        new Game.GameEvent(playerB, 15, Game.GameEventType.NewRack),
        // +14 for playerB
        new Game.GameEvent(playerB, 15, Game.GameEventType.NewRack),
        // +3 for playerB
        new Game.GameEvent(playerB, 12, Game.GameEventType.EndGame)
      ];
      const scoreboard = sut.calculateScore(events);
      scoreboard.getScore(playerA).should.equal(0);
      scoreboard.getScore(playerB).should.equal(30);
    });

    it('case 2', function() {
      const events = [
        // -2 for playerA
        new Game.GameEvent(playerA, 15, Game.GameEventType.Foul),
        // +9 for playerB
        new Game.GameEvent(playerB, 5, Game.GameEventType.Foul),
        // +4 for playerA
        new Game.GameEvent(playerA, 5, Game.GameEventType.NewRack),
        // +5 for playerA
        new Game.GameEvent(playerA, 10, Game.GameEventType.MissedBall),
        // +7 for playerB
        new Game.GameEvent(playerB, 3, Game.GameEventType.EndGame)
      ];
      const scoreboard = sut.calculateScore(events);
      scoreboard.getScore(playerA).should.equal(7);
      scoreboard.getScore(playerB).should.equal(16);
    });
  });
});
