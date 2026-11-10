import { describe, expect, it } from 'vitest';
import { text } from '../../content/text';
import type { Message } from '../../engine/state';
import { newGame, tapThing } from '../../test/fixtures';
import { messageText } from './messageText';

const say = (message: Message, overrides = {}) =>
  messageText(newGame({ playerName: 'Ada', message, ...overrides }));

describe('messageText', () => {
  it('is empty when there is nothing to say, and says so while walking', () => {
    expect(messageText(newGame())).toBe('');
    expect(messageText(tapThing(newGame(), 'door'))).toBe(text.world.walking);
  });

  it('greets the player by name', () => {
    expect(say({ id: 'goodMorning' })).toBe('Good morning, Ada! Tap the door to go out.');
  });

  it('says where the baker has arrived', () => {
    expect(say({ id: 'arrived', place: 'market' })).toBe(text.messages.arrived.market);
    expect(say({ id: 'arrived', place: 'home' })).toBe('You are at home.');
  });

  it('names what is in the oven', () => {
    expect(say({ id: 'bakingStarted', recipeId: 'muffin' })).toContain('Muffins are in the oven');
    expect(say({ id: 'ovenBaking', recipeId: 'bread' })).toBe('Bread are still baking.');
    expect(say({ id: 'burnt', recipeId: 'cookie' })).toContain('the Cookies burnt');
    expect(say({ id: 'tookOut', recipeId: 'muffin' })).toBe('4 Muffins are on the shelf.');
  });

  it('says what was sold and for how much, or what is missing', () => {
    expect(say({ id: 'served', recipeId: 'muffin' })).toBe('You sold 1 Muffin for $2.00.');
    expect(say({ id: 'noStock', recipeId: 'bread' })).toBe(
      'There is no Bread on the shelf. Bake some!',
    );
  });

  it('lists what is on the shelf', () => {
    expect(say({ id: 'shelf' })).toBe(text.messages.shelfEmpty);
    expect(say({ id: 'shelf' }, { shelf: { cookie: 1, muffin: 0, bread: 2 } })).toBe(
      'On the shelf: 1 Cookie, 2 Bread.',
    );
  });

  it.each([
    'stallClosed',
    'nothingToBake',
    'shopOpened',
    'shopIsOpen',
    'shopClosed',
    'stayInShop',
    'ovenCold',
    'counterClosed',
    'nobodyWaiting',
    'customerGone',
    'closingTime',
    'tillLater',
    'countTillFirst',
    'goHome',
    'notBedtime',
  ] as const)('has plain words for %s', (id) => {
    expect(say({ id })).toBe(text.messages[id]);
    expect(text.messages[id].trim()).not.toBe('');
  });
});
