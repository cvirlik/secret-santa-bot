import { Bot } from 'grammy';

import 'dotenv/config';
import { userService } from './services/user.js';
import { uiService } from './services/ui.js';
import { connect } from './database.js';

const token = process.env.TOKEN;
if (!token) {
  console.error("No token provided. Set the environment variable 'TOKEN'");
  process.exit(1);
}
const bot = new Bot(token);
const { collection } = await connect();

bot.use(async (ctx, next) => {
  if (ctx.from) {
    await userService.ensureUser(ctx.from.id, ctx.from.first_name, collection);
  }
  await next();
});

// TODO: fix possibility to join or leave game after the start

bot
  .chatType(['private'])
  .command('start', ctx =>
    ctx.reply('Welcome to Secret Santa Bot! /wishlist for filling in wishlist. /groups to display groups'),
  );
bot.chatType(['supergroup', 'group']).command('santa', async ctx => {
  const { text, keyboard } = await uiService.generateStatsTextMessage(
    ctx.chatId,
    collection,
    `t.me/${ctx.me.username}`,
  );
  await ctx.reply(text, {
    reply_markup: keyboard,
  });
});

bot.chatType(['supergroup', 'group']).callbackQuery('ready', async ctx => {
  try {
    const isAdded = await userService.setReady(ctx.from.id, ctx.chatId, collection);
    if (isAdded) {
      await ctx.answerCallbackQuery(`You successfully confirmed participation in Secret Santa ${ctx.from.first_name}!`);
      const { text, keyboard } = await uiService.generateStatsTextMessage(ctx.chatId, collection);
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
bot.chatType(['supergroup', 'group']).callbackQuery('join', async ctx => {
  try {
    const isAdded = await userService.joinGroup(ctx.from.id, ctx.chatId, collection);
    if (isAdded) {
      await ctx.answerCallbackQuery(`You successfully joined Secret Santa ${ctx.from.first_name}!`);
      const { text, keyboard } = await uiService.generateStatsTextMessage(ctx.chatId, collection);
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

bot.chatType(['supergroup', 'group']).callbackQuery('quit', async ctx => {
  const leaved = await userService.quitGroup(ctx.from.id, ctx.chatId, collection);
  if (leaved) {
    await ctx.answerCallbackQuery(`You successfully left Secret Santa!`);
    const { text, keyboard } = await uiService.generateStatsTextMessage(ctx.chatId, collection);
    await ctx.editMessageText(text, {
      reply_markup: keyboard,
    });
  } else {
    await ctx.answerCallbackQuery('You are not in a Secret Santa group.');
  }
});
bot.callbackQuery('noop', async ctx => {
  await ctx.answerCallbackQuery();
});
bot.chatType(['supergroup', 'group']).callbackQuery('game_start', async ctx => {
  await userService.assignSecretSantas(ctx.chatId, collection);
  const { text, keyboard } = await uiService.generateGameTextMessage(ctx.chatId, `t.me/${ctx.me.username}`);
  await ctx.editMessageText(text, {
    reply_markup: keyboard,
  });
});

void bot.start();
