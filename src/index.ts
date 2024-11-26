import type { Collection } from 'mongodb';
import { Bot, session } from 'grammy';
import type { Context, SessionFlavor } from 'grammy';

import 'dotenv/config';
import { userService } from './services/user.js';
import { connect } from './database.js';
import type { User } from './database.js';
import { userController } from './controllers/user.js';
import { groupController } from './controllers/group.js';

const token = process.env.TOKEN;
if (!token) {
  console.error("No token provided. Set the environment variable 'TOKEN'");
  process.exit(1);
}

interface SessionData {
  action: 'wish' | 'block' | 'add_wish' | 'add_block' | null;
}

export type CustomContext = Context & { db: Collection<User>; user: User } & SessionFlavor<SessionData>;

const bot = new Bot<CustomContext>(token);
const { collection } = await connect();

bot.use(async (ctx, next) => {
  ctx.db = collection;
  if (ctx.from) {
    ctx.user = (await userService.ensureUser(ctx.from.id, ctx.from.first_name, collection))!;
  }
  await next();
});

function initial(): SessionData {
  return { action: null };
}
bot.use(session({ initial }));

// TODO: fix possibility to join or leave game after the start

bot.callbackQuery('noop', async ctx => {
  await ctx.answerCallbackQuery();
});
bot.use(groupController);
bot.use(userController);

void bot.start();
