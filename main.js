var App = angular.module('FarkleApp', []);

App.controller('FarkleController', function ($log, $scope, game) {
    $log.debug("Starting Farkle...")
    $scope.farkle = game;
    $scope.foo = function () {
        $log.info("FOOOOO!!!!");
    };
});

App.factory('game', function ($log, Player, Turn) {
    $log.debug("Loading Game...");
    var firstPlayer = new Player();
    var game = {
        goal: 10000,
        started: false,
        players: [firstPlayer],
        turns: [new Turn(firstPlayer)],
        turn: 0,
        currentPlayer: 0
    };

    game.addPlayer = function() {
        game.players.push(new Player());
        $log.info("Added new player!");
        $log.debug("Current players are", game.players);
    };

    game.start = function() {
        game.started = true;
    };

    game.rollAgain = function() {
        if (!game.getCurrentTurn().saved) {
            game.saveRoll();
        }
        game.getCurrentTurn().total = "-";
        game.getCurrentTurn().fixScore = false;
        game.turns.push(new Turn(game.getCurrentPlayer(), game.getCurrentTurn()));
        game.turn++;
    };

    game.nextTurn = function() {
        if (!game.getCurrentTurn().saved) {
            game.saveRoll();
        }
        game.getCurrentTurn().fixScore = false;
        game.getCurrentPlayer().score += game.getCurrentTurn().score;

        if (game.getCurrentPlayer().score >= game.goal) {
            alert("PLAYER " + game.getCurrentPlayer().name + " WINS!!");
        }
        game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
        game.turns.push(new Turn(game.getCurrentPlayer()));
        game.turn++;

        $log.debug("Turn " + game.turn + ": it's " + game.getCurrentPlayer().name + "'s turn!");
    };

    game.getCurrentPlayer = function() {
        return game.players[game.currentPlayer];
    };

    game.getCurrentTurn = function() {
        return game.turns[game.turn];
    };

    game.farkle = function() {
        if (!game.getCurrentTurn().saved) {
          game.saveRoll();
        }
        game.getCurrentTurn().fixScore = false;
        game.getCurrentTurn().score = 0;
        game.getCurrentTurn().total = 0;
        game.getCurrentTurn().messages = ["Farkle! :("];
        game.nextTurn();
    };

    game.saveRoll = function() {
        var turn = game.getCurrentTurn();
        var player = game.getCurrentPlayer();
        var messages = turn.messages;

        var rolls = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0
        };

        turn.dice.map(function(die) {
            rolls[die.roll]++;
        });

        var pairs = [];
        var triples = [];
        var quads = [];

        Object.keys(rolls).map(function(key) {
            if (rolls.hasOwnProperty(key)) {
                var roll = parseInt(key);
                var count = rolls[roll];

                /*
                 * 1's are worth 100 pts each
                 * 5's are worth 50 pts each
                 */
                if (count > 0 && count < 3) {
                    if (roll == 1) {
                        turn.score += 100 * count;
                        messages.push(count + " 1's!");
                    }
                    if (roll == 5) {
                        turn.score += 50 * count;
                        messages.push(count + " 5's");
                    }

                    /*
                     * Check for pairs:
                     */
                    if (count == 2) {
                        pairs.push(roll);
                    }
                }

                /*
                 * Three of a kind:
                 * 100 * die value
                 *
                 * i.e. three 3's = 3 * 100 = 300 pts
                 */
                if (count == 3) {
                    if (roll == 1) {
                        turn.score += 300;
                        messages.push("Three 1's!");
                    } else {
                        turn.score += 100 * roll;
                        messages.push("Three " + roll + "'s");
                    }

                    triples.push(roll);
                }

                /*
                 * Four of a kind: 1000 pts
                 * Five of a kind: 2000 pts
                 * Six  of a king: 3000 pts
                 */
                if (count > 3) {
                    turn.score += 1000 * (count - 3);
                    messages.push(count + " " + roll + "'s");
                    quads.push(roll);
                }
            }
        });

        // Check Straight 1500 pts
        if (rolls[1] && rolls[2] && rolls[3] && rolls[4] && rolls[5] && rolls[6]) {
            messages.push("Straight!");
            turn.score = 1500;
        }

        // Check three pairs 1500 pts
        if (pairs.length == 3) {
            messages.push("Three Pairs!");
            turn.score = 1500;
        }

        // Check two triples 2500 pts
        if (triples.length == 2) {
            messages.push("Two Triples!");
            turn.score = 2500;
        }

        // Check 4 of a kind + pair 1500pts
        if (quads.length && triples.length) {
            messages.push("Four of a kind plus one Pair!");
            turn.score = 1500;
        }

        turn.total = turn.score + player.score;
        turn.save();
    };

    return game;
});

App.factory('Player', function() {
    function Player() {
        this.name = undefined;
        this.score = 0;
    }

    return Player;
});

App.factory('Turn', function(Die) {
    var DICE_PER_TURN=6;
    function Turn(player, oldTurn) {
        this.player = player;
        this.dice = [];
        this.messages = [];
        this.score = 0;
        this.total = 0;
        this.saved = false;
        for (var i=0;i<DICE_PER_TURN;i++) {
            if (oldTurn) {
                var oldDie = oldTurn.dice[i];
            }
            var die = oldDie ? new Die(oldDie.roll, oldDie.setAside) : new Die();
            this.dice.push(die);
        }
    }

    Turn.prototype.save = function() {
        this.saved = true;
    };

    return Turn;
});

App.factory('Die', function() {
    function Die(roll, setAside) {
        this.roll = roll;
        this.setAside = setAside ? setAside : false;
    }
    return Die;
});