import { Composer, Keyboard } from 'grammy';

import { userService } from '../services/user.js';
import { uiService } from '../services/ui.js';
import type { CustomContext } from '..';

export const userController = new Composer<CustomContext>();
userController.chatType(['private']).command('start', async ctx => {
  const keyboard = new Keyboard().text('Giftee').text('My wishlist').text('My blacklist').resized();
  await ctx.reply('Welcome to Secret Santa Bot! Use keyboard to navigate.', {
    reply_markup: keyboard,
  });
});
userController.chatType(['private']).hears('Giftee', ctx => ctx.reply('TODO: send giftee list'));

userController.chatType(['private']).hears('My wishlist', async ctx => {
  ctx.session.action = 'wish';
  const { wishlist } = await userService.getWishlist(ctx.from.id, ctx.db);
  const { text, keyboard } = uiService.generateListMessage(wishlist, 'wishlist');

  await ctx.reply(text, {
    reply_markup: keyboard,
  });
});

userController.chatType(['private']).hears('My blacklist', async ctx => {
  ctx.session.action = 'black';
  const { blacklist } = await userService.getBlacklist(ctx.from.id, ctx.db);
  const { text, keyboard } = uiService.generateListMessage(blacklist, 'blacklist');

  await ctx.reply(text, {
    reply_markup: keyboard,
  });
});

userController.chatType(['private']).hears('Add item', async ctx => {
  let text = '';
  if (ctx.session.action === 'wish') {
    ctx.session.action = 'add_wish';
    text += 'Send a text message with your wish. Click on finish if you are done.';
  } else if (ctx.session.action === 'black') {
    ctx.session.action = 'add_black';
    text += 'Send a text message with thing you wish to blacklist. Click on finish if you are done.';
  }

  const keyboard = new Keyboard().text('Finish').resized();
  await ctx.reply(text, {
    reply_markup: keyboard,
  });
});

userController.chatType(['private']).hears(['Finish', 'Back'], async ctx => {
  ctx.session.action = null;
  const keyboard = new Keyboard().text('Giftee').text('My wishlist').text('My blacklist').resized();
  await ctx.reply('Use keyboard to navigate.', {
    reply_markup: keyboard,
  });
});
userController.chatType(['private']).hears(/\/delete_(\d+)/, async ctx => {
  let text;
  let keyboard;

  if (ctx.session.action === 'wish') {
    await userService.deleteWish(ctx.from.id, Number(ctx.match[1]), ctx.db);
    const { wishlist } = await userService.getWishlist(ctx.from.id, ctx.db);
    ({ text, keyboard } = await uiService.generateListMessage(wishlist, 'wishlist'));
  } else if (ctx.session.action === 'black') {
    await userService.deleteBlack(ctx.from.id, Number(ctx.match[1]), ctx.db);
    const { blacklist } = await userService.getBlacklist(ctx.from.id, ctx.db);
    ({ text, keyboard } = await uiService.generateListMessage(blacklist, 'blocklist'));
  } else {
    return;
  }

  await ctx.reply(text, {
    reply_markup: keyboard,
  });
});

userController.chatType(['private']).on(':text', async ctx => {
  let text = '';
  if (ctx.session.action === 'add_wish') {
    const result = await userService.addWish(ctx.from.id, ctx.message.text, ctx.db);
    if (result) {
      text += 'Your wish has been added! You can continue with sending other wish or press Finish button to finish';
    } else {
      text += 'Error occurred while adding. Please try again';
    }
  } else if (ctx.session.action === 'add_black') {
    const result = await userService.addBlack(ctx.from.id, ctx.message.text, ctx.db);
    if (result) {
      text += 'Your block has been added! You can continue with sending other block or press Finish button to finish';
    } else {
      text += 'Error occurred while adding. Please try again';
    }
  } else {
    return;
  }
  const keyboard = new Keyboard().text('Finish').resized();
  await ctx.reply(text, {
    reply_markup: keyboard,
  });
});
