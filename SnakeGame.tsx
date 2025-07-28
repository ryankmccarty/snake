import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 150;
const MAX_HIGH_SCORES = 5;

type Position = {
  x: number;
  y: number;
};

type Direction = {
  x: number;
  y: number;
};

type GameState = 'playing' | 'paused' | 'gameOver' | 'waiting';

type HighScore = {
  name: string;
  score: number;
  date: string;
};

export function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(INITIAL_FOOD);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState<HighScore[]>(() => {
    const saved = localStorage.getItem('snake-high-scores');
    return saved ? JSON.parse(saved) : [];
  });
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [newHighScore, setNewHighScore] = useState(0);

  const currentHighScore = highScores.length > 0 ? highScores[0].score : 0;

  const saveHighScores = useCallback((scores: HighScore[]) => {
    localStorage.setItem('snake-high-scores', JSON.stringify(scores));
  }, []);

  const checkForNewHighScore = useCallback((finalScore: number) => {
    if (finalScore === 0) return false;
    
    // Check if this score qualifies as a high score
    if (highScores.length < MAX_HIGH_SCORES || finalScore > highScores[highScores.length - 1].score) {
      setNewHighScore(finalScore);
      setShowNameDialog(true);
      return true;
    }
    return false;
  }, [highScores]);

  const savePlayerHighScore = useCallback(() => {
    if (playerName.trim() === '') return;

    const newScore: HighScore = {
      name: playerName.trim(),
      score: newHighScore,
      date: new Date().toLocaleDateString()
    };

    const updatedScores = [...highScores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_HIGH_SCORES);

    setHighScores(updatedScores);
    saveHighScores(updatedScores);
    setShowNameDialog(false);
    setPlayerName('');
  }, [playerName, newHighScore, highScores, saveHighScores]);

  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameState('waiting');
  }, []);

  const startGame = useCallback(() => {
    setGameState('playing');
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
  }, [gameState]);

  const moveSnake = useCallback(() => {
    if (gameState !== 'playing') return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      
      head.x += direction.x;
      head.y += direction.y;

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameState('gameOver');
        // Check for high score after a short delay to ensure state is updated
        setTimeout(() => checkForNewHighScore(score), 100);
        return prevSnake;
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameState('gameOver');
        // Check for high score after a short delay to ensure state is updated
        setTimeout(() => checkForNewHighScore(score), 100);
        return prevSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameState, generateFood, score, checkForNewHighScore]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameState === 'gameOver' || gameState === 'waiting') return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (direction.y === 0) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (direction.y === 0) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (direction.x === 0) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (direction.x === 0) setDirection({ x: 1, y: 0 });
        break;
      case ' ':
        e.preventDefault();
        pauseGame();
        break;
    }
  }, [direction, gameState, pauseGame]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePlayerHighScore();
  };

  useEffect(() => {
    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [moveSnake]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="flex flex-col items-center p-4 bg-zinc-900 min-h-screen">
      {/* Nokia-style header */}
      <div className="mb-4 text-center">
        <h1 className="text-2xl mb-2 text-green-400 font-mono">PRIMACY SNAKE GAME</h1>
        <div className="text-green-300 font-mono">
          <div>Score: {score.toString().padStart(4, '0')}</div>
          <div>Best: {currentHighScore.toString().padStart(4, '0')}</div>
        </div>
      </div>

      {/* Game board */}
      <div className="relative border-4 border-gray-600 bg-green-900 p-2">
        <div 
          className="grid gap-0 bg-green-800"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            width: '400px',
            height: '400px',
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);
            
            const isSnake = snake.some(segment => segment.x === x && segment.y === y);
            const isHead = snake[0]?.x === x && snake[0]?.y === y;
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={index}
                className={`
                  border border-green-700/30 flex items-center justify-center
                  ${isSnake ? (isHead ? 'bg-green-300' : 'bg-green-400') : ''}
                `}
                style={{ height: '20px', width: '20px' }}
              >
                {isFood && <span className="text-sm leading-none">🕐</span>}
              </div>
            );
          })}
        </div>

        {/* Game state overlay */}
        {gameState !== 'playing' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-green-300 font-mono">
              {gameState === 'waiting' && (
                <div>
                  <div className="mb-4">Track your time in OB</div>
                  <Button 
                    onClick={startGame}
                    className="mb-2 bg-green-600 hover:bg-green-500 text-green-100"
                  >
                    START GAME
                  </Button>
                  <div className="text-sm">Use arrow keys to play</div>
                </div>
              )}
              
              {gameState === 'paused' && (
                <div>
                  <div className="mb-4">PAUSED</div>
                  <div className="text-sm">Press SPACE to continue</div>
                </div>
              )}
              
              {gameState === 'gameOver' && (
                <div>
                  <div className="mb-3 text-2xl">☠️</div>
                  <div className="mb-2">You forgot to track your time!</div>
                  <div className="mb-4">Score: {score}</div>
                  <Button 
                    onClick={resetGame}
                    className="bg-green-600 hover:bg-green-500 text-green-100"
                  >
                    PLAY AGAIN
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 text-center text-green-300 font-mono text-sm">
        <div className="mb-2">Controls:</div>
        <div>Arrow Keys: Move</div>
        <div>Space: Pause/Resume</div>
      </div>

      {/* Mobile controls */}
      <div className="mt-4 grid grid-cols-3 gap-2 md:hidden">
        <div></div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDirection(prev => prev.y === 0 ? { x: 0, y: -1 } : prev)}
          disabled={gameState !== 'playing'}
          className="border-green-500 text-green-400"
        >
          ↑
        </Button>
        <div></div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDirection(prev => prev.x === 0 ? { x: -1, y: 0 } : prev)}
          disabled={gameState !== 'playing'}
          className="border-green-500 text-green-400"
        >
          ←
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={pauseGame}
          disabled={gameState === 'waiting' || gameState === 'gameOver'}
          className="border-green-500 text-green-400"
        >
          ⏸
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDirection(prev => prev.x === 0 ? { x: 1, y: 0 } : prev)}
          disabled={gameState !== 'playing'}
          className="border-green-500 text-green-400"
        >
          →
        </Button>
        
        <div></div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDirection(prev => prev.y === 0 ? { x: 0, y: 1 } : prev)}
          disabled={gameState !== 'playing'}
          className="border-green-500 text-green-400"
        >
          ↓
        </Button>
        <div></div>
      </div>

      {/* High Scores Leaderboard */}
      {highScores.length > 0 && (
        <div className="mt-8 w-full max-w-md">
          <div className="text-center text-green-400 font-mono text-lg mb-4">🏆 HIGH SCORES</div>
          <div className="bg-green-900/50 border-2 border-green-700 rounded p-4">
            {highScores.map((highScore, index) => (
              <div key={index} className="flex justify-between items-center text-green-300 font-mono text-sm py-1">
                <span className="flex items-center gap-2">
                  <span className="text-green-400">{index + 1}.</span>
                  <span className="truncate max-w-32">{highScore.name}</span>
                </span>
                <span>{highScore.score.toString().padStart(4, '0')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Name Entry Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="bg-zinc-800 border-green-500">
          <DialogHeader>
            <DialogTitle className="text-green-400 font-mono">🎉 NEW HIGH SCORE!</DialogTitle>
            <DialogDescription className="text-green-300 font-mono">
              You scored {newHighScore} points! Enter your name for the leaderboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <Label htmlFor="playerName" className="text-green-300 font-mono">
                Player Name
              </Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={15}
                className="bg-green-900/50 border-green-600 text-green-200 placeholder:text-green-500 font-mono mt-1"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNameDialog(false)}
                className="border-green-600 text-green-300 hover:bg-green-800"
              >
                Skip
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-500 text-green-100"
                disabled={playerName.trim() === ''}
              >
                Save Score
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}