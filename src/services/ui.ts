import type { Collection } from 'mongodb';
import { InlineKeyboard } from 'grammy';

import type { User } from '../database.js';
import { userService } from './user.js';

async function generateStatsTextMessage(chatId: number, collection: Collection<User>, url: string = '') {
  const members = await userService.getGroupMembers(chatId, collection);
  if (members.length === 0) {
    return {
      text: 'No players in the group!',
      keyboard: new InlineKeyboard().text('Join', 'join').text('Quit', 'quit'),
    };
  }
  if (members[0].groups.person !== null) {
    return generateGameTextMessage(chatId, url);
  }
  const { ready, lines } = members.reduce(
    (accumulator, member) => {
      accumulator.ready += Number(member.groups.ready);
      accumulator.lines += `${member.groups.ready ? '🎄' : '🌲'} ${member.name}\n`;
      return accumulator;
    },
    {
      ready: 0,
      lines: '',
    },
  );
  const keyboard = new InlineKeyboard().text('Join', 'join').text('Quit', 'quit').row();
  if (members.length >= 3) {
    if (ready === members.length) keyboard.text(`🎄 Start the game!`, 'game_start');
    else keyboard.text(`🎄 I'm ready! (${ready}/${members.length})`, 'ready');
  } else {
    keyboard.text('Secret Santa requires a minimum of 3 players to play!', 'noop');
  }
  return { text: `${lines}\nAll players must be ready to start the game!`, keyboard };
}

async function generateGameTextMessage(chatId: number, url: string) {
  const keyboard = new InlineKeyboard().url('Go to chat with bot!', url);
  return {
    text: 'Game started! Please chat with bot in personal messages to find out your giftee.\nDon`t forget to will out your wishlists!',
    keyboard,
  };
}

export const uiService = { generateStatsTextMessage, generateGameTextMessage };
