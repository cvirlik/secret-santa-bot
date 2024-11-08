import { Bot, InlineKeyboard } from 'grammy';

import 'dotenv/config';
import { connect, updateUser } from './database.js';

const token = process.env.TOKEN;
if (!token) {
  console.error("No token provided. Set the environment variable 'TOKEN'");
  process.exit(1);
}
const bot = new Bot(token);
const { collection } = await connect();

bot.command('start', ctx =>
  ctx.reply('Welcome! Secret Santa Bot. /wishlist for filling in wishlist. /groups to display groups'),
);
bot.chatType(['supergroup', 'group', 'private']).command('group', async ctx => {
  const keyboard = new InlineKeyboard().text('Join', 'join').text('Quit', 'quit');

  // Send the message with the inline keyboard
  await ctx.reply('Please choose an option and submit:', {
    reply_markup: keyboard,
  });
});

bot.callbackQuery('join', async ctx => {
  try {
    await updateUser(collection, {
      from: {
        first_name: ctx.from.first_name,
        id: ctx.from.id,
      },
      chatId: ctx.chatId,
    });
    await ctx.answerCallbackQuery(`Welcome to Secret Santa ${ctx.from.first_name}!`);
  } catch (error) {
    await ctx.answerCallbackQuery(`Oops, error occured`);
    console.error(`Oops, error occured`, error);
  }
});

bot.callbackQuery('quit', async ctx => {
  await ctx.answerCallbackQuery('You successfully leave a Secret Santa.');
});

bot.on('message', ctx => ctx.reply('Got another message!'));

void bot.start();
