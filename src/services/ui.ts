import type { Collection } from 'mongodb';
import { InlineKeyboard, Keyboard } from 'grammy';

import type { User } from '../database.js';
import { groupService } from './group.js';

async function generateStatsTextMessage(chatId: number, collection: Collection<User>, url: string = '') {
  const members = await groupService.getGroupMembers(chatId, collection);
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

function generateListMessage(list: string[] | undefined, type: string) {
  let text = '';
  if (list === undefined || list.length === 0) {
    text += `You currently have no ${type}!\n\n`;
  } else {
    text += `Your ${type}:\n`;
    for (let i = 0; i < list.length; i++) {
      text += `- ${list[i]} /delete_${i}\n`;
    }
  }
  const keyboard = new Keyboard().text('Add item').text('Back').resized();
  return {
    text,
    keyboard,
  };
}

export const uiService = { generateStatsTextMessage, generateGameTextMessage, generateListMessage };
