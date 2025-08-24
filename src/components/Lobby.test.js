import { render, screen } from '@testing-library/react';
import { GameProvider } from '../context/GameContext';
import Lobby from './Lobby';

test('renders the lobby screen with the main title', () => {
  // Mock the props that Lobby expects
  const createGame = jest.fn();
  const joinGame = jest.fn();

  render(
    <GameProvider>
      <Lobby createGame={createGame} joinGame={joinGame} />
    </GameProvider>
  );

  // Check if the title "WePlay" is on the screen
  const titleElement = screen.getByText(/WePlay/i);
  expect(titleElement).toBeInTheDocument();

  // Check if the "Create Public Room" button is there
  const createButton = screen.getByText(/Create Public Room/i);
  expect(createButton).toBeInTheDocument();
});
