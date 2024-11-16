import { Composer } from 'grammy';

import { userService } from '../services/user.js';
import { uiService } from '../services/ui.js';
import { groupService } from '../services/group.js';
import type { CustomContext } from '..';

export const groupController = new Composer<CustomContext>();

groupController.chatType(['supergroup', 'group']).command('santa', async ctx => {
  const { text, keyboard } = await uiService.generateStatsTextMessage(ctx.chatId, ctx.db, `t.me/${ctx.me.username}`);
  await ctx.reply(text, {
    reply_markup: keyboard,
  });
});

groupController.chatType(['supergroup', 'group']).callbackQuery('ready', async ctx => {
  try {
    const isAdded = await userService.setReady(ctx.from.id, ctx.chatId, ctx.db);
    if (isAdded) {
      await ctx.answerCallbackQuery(`You successfully confirmed participation in Secret Santa ${ctx.from.first_name}!`);
      const { text, keyboard } = await uiService.generateStatsTextMessage(ctx.chatId, ctx.db);
      await ctx.editMessageText(text, {
        reply_markup: keyboard,
      });
    } else {
      await ctx.answerCallbackQuery('You are ready. 🎄');
    }
  } catch (error) {
    await ctx.answerCallbackQuery(`Oops, error occured`);
    console.error(`Oops, error occured`, error);
  }
});
groupController.chatType(['supergroup', 'group']).callbackQuery('join', async ctx => {
  try {
    const isAdded = await userService.joinGroup(ctx.from.id, ctx.chatId, ctx.chat.title, ctx.db);
    if (isAdded) {
      await ctx.answerCallbackQuery(`You successfully joined Secret Santa ${ctx.from.first_name}!`);
      const { text, keyboard } = await uiService.generateStatsTextMessage(ctx.chatId, ctx.db);
      await ctx.editMessageText(text, {
        reply_markup: keyboard,
      });
    } else {
      await ctx.answerCallbackQuery('You are already in a Secret Santa group.');
    }
  } catch (error) {
    await ctx.answerCallbackQuery(`Oops, error occured`);
    console.error(`Oops, error occured`, error);
  }
});
groupController.chatType(['supergroup', 'group']).callbackQuery('quit', async ctx => {
  const leaved = await userService.quitGroup(ctx.from.id, ctx.chatId, ctx.db);
  if (leaved) {
    await ctx.answerCallbackQuery(`You successfully left Secret Santa!`);
    const { text, keyboard } = await uiService.generateStatsTextMessage(ctx.chatId, ctx.db);
    await ctx.editMessageText(text, {
      reply_markup: keyboard,
    });
  } else {
    await ctx.answerCallbackQuery('You are not in a Secret Santa group.');
  }
});
groupController.chatType(['supergroup', 'group']).callbackQuery('game_start', async ctx => {
  await groupService.assignSecretSantas(ctx.chatId, ctx.db);
  const { text, keyboard } = await uiService.generateGameTextMessage(ctx.chatId, `t.me/${ctx.me.username}`);
  await ctx.editMessageText(text, {
    reply_markup: keyboard,
  });
});
