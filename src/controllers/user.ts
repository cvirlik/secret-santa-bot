import { Composer, Keyboard } from 'grammy';

import { userService } from '../services/user.js';
import { uiService } from '../services/ui.js';
import type { CustomContext } from '..';

export const userController = new Composer<CustomContext>();
userController.chatType(['private']).command('start', async ctx => {
  const keyboard = new Keyboard().text('Giftee 🎁').text('My wishlist ❤️').text('My blocklist 💔').resized();
  await ctx.reply('Welcome to Secret Santa Bot! Use keyboard to navigate.', {
    reply_markup: keyboard,
  });
});
userController.chatType(['private']).hears('Giftee 🎁', async ctx => {
  const giftees = await userService.getGiftee(ctx.user, ctx.db);
  const data = ctx.user.groups
    .map(group => {
      const giftee = giftees.find(g => g.id === group.person);
      if (giftee) {
        let wishlist = giftee.wishlist?.map(wish => `· ${wish}`).join('\n');
        wishlist = wishlist ? `❤️ Wishlist:\n${wishlist}` : '';
        let blocklist = giftee.blocklist?.map(wish => `· ${wish}`).join('\n');
        blocklist = blocklist ? `💔 Blocklist:\n${blocklist}` : '';
        return `🎄 ${group.name}: ${giftee.name}\n\n${wishlist}\n\n${blocklist}`;
      } else {
        return `🌲 ${group.name}: Giftee not selected`;
      }
    })
    .join('\n\n\n');
  await ctx.reply(data);
});
userController.chatType(['private']).hears('My wishlist ❤️', async ctx => {
  ctx.session.action = 'wish';
  const { wishlist } = await userService.getWishlist(ctx.from.id, ctx.db);
  const { text, keyboard } = uiService.generateListMessage(wishlist, 'wishlist ❤️');

  await ctx.reply(text, {
    reply_markup: keyboard,
  });
});

userController.chatType(['private']).hears('My blocklist 💔', async ctx => {
  ctx.session.action = 'block';
  const { blocklist } = await userService.getBlocklist(ctx.from.id, ctx.db);
  const { text, keyboard } = uiService.generateListMessage(blocklist, 'blocklist 💔');

  await ctx.reply(text, {
    reply_markup: keyboard,
  });
});

userController.chatType(['private']).hears('Add item', async ctx => {
  let text = '';
  if (ctx.session.action === 'wish') {
    ctx.session.action = 'add_wish';
    text += 'Send a text message with your wish. Click on finish if you are done.';
  } else if (ctx.session.action === 'block') {
    ctx.session.action = 'add_block';
    text += 'Send a text message with thing you wish to blocklist. Click on finish if you are done.';
  }

  const keyboard = new Keyboard().text('Finish').resized();
  await ctx.reply(text, {
    reply_markup: keyboard,
  });
});

const commands = ['Finish', 'Back'];
userController.chatType(['private']).hears(commands, async ctx => {
  ctx.session.action = null;
  const keyboard = new Keyboard().text('Giftee 🎁').text('My wishlist ❤️').text('My blocklist 💔').resized();
  await ctx.reply('Use keyboard to navigate.', {
    reply_markup: keyboard,
  });
  if (ctx.message.text === commands[0]) {
    const santas = await userService.getSanta(ctx.from.id, ctx.db);
    for (const santa of santas) {
      await ctx.api.sendMessage(santa.id, `Your giftee ${ctx.from.first_name} has changed their wishes!`);
    }
  }
});

userController.chatType(['private']).hears(/\/delete_(\d+)/, async ctx => {
  let text;
  let keyboard;

  if (ctx.session.action === 'wish') {
    await userService.deleteWish(ctx.from.id, Number(ctx.match[1]), ctx.db);
    const { wishlist } = await userService.getWishlist(ctx.from.id, ctx.db);
    ({ text, keyboard } = await uiService.generateListMessage(wishlist, 'wishlist ❤️'));
  } else if (ctx.session.action === 'block') {
    await userService.deleteBlock(ctx.from.id, Number(ctx.match[1]), ctx.db);
    const { blocklist } = await userService.getBlocklist(ctx.from.id, ctx.db);
    ({ text, keyboard } = await uiService.generateListMessage(blocklist, 'blocklist ❤️'));
  } else {
    return;
  }

  await ctx.reply(text, {
    reply_markup: keyboard,
  });
  const santas = await userService.getSanta(ctx.from.id, ctx.db);
  for (const santa of santas) {
    await ctx.api.sendMessage(santa.id, `Your giftee ${ctx.from.first_name} has changed their wishes!`);
  }
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
  } else if (ctx.session.action === 'add_block') {
    const result = await userService.addBlock(ctx.from.id, ctx.message.text, ctx.db);
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
