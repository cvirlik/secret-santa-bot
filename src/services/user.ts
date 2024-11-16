import type { Collection } from 'mongodb';

import type { User } from '../database.js';

async function ensureUser(id: number, name: string, collection: Collection<User>) {
  return collection.findOneAndUpdate(
    { id },
    {
      $set: { name },
    },
    { upsert: true },
  );
}

async function joinGroup(id_user: number, id_group: number, group_name: string, collection: Collection<User>) {
  const result = await collection.updateOne(
    { 'id': id_user, 'groups.id': { $ne: id_group } },
    {
      $push: { groups: { id: id_group, person: null, ready: false, name: group_name } },
    },
  );
  return result.matchedCount !== 0;
}

async function quitGroup(id_user: number, id_group: number, collection: Collection<User>) {
  const result = await collection.updateOne(
    { id: id_user },
    {
      $pull: { groups: { id: id_group } },
    },
  );
  return result.modifiedCount !== 0;
}

async function setReady(id_user: number, id_group: number, collection: Collection<User>) {
  const result = await collection.updateOne(
    { 'id': id_user, 'groups.id': id_group },
    {
      $set: { 'groups.$.ready': true },
    },
  );
  return result.modifiedCount !== 0;
}

async function getWishlist(id_user: number, collection: Collection<User>) {
  const user = await collection.findOne({ id: id_user });
  return { wishlist: user?.wishlist };
}
async function getBlacklist(id_user: number, collection: Collection<User>) {
  const user = await collection.findOne({ id: id_user });
  return { blacklist: user?.blocklist };
}
async function addWish(id_user: number, wish: string, collection: Collection<User>) {
  const user = await collection.updateOne(
    { id: id_user },
    {
      $addToSet: { wishlist: wish },
    },
  );
  return user?.modifiedCount !== 0;
}

async function addBlack(id_user: number, nowish: string, collection: Collection<User>) {
  const user = await collection.updateOne(
    { id: id_user },
    {
      $addToSet: { blocklist: nowish },
    },
  );
  return user?.modifiedCount !== 0;
}

async function deleteWish(id_user: number, wish_idx: number, collection: Collection<User>) {
  await collection.bulkWrite([
    {
      updateOne: {
        filter: { id: id_user },
        update: {
          $unset: { [`wishlist.${wish_idx}`]: '' },
        } as any,
      },
    },
    {
      updateOne: {
        filter: { id: id_user },
        update: {
          $pull: { wishlist: null },
        },
      },
    },
  ]);
}

async function deleteBlack(id_user: number, wish_idx: number, collection: Collection<User>) {
  await collection.bulkWrite([
    {
      updateOne: {
        filter: { id: id_user },
        update: {
          $unset: { [`blocklist.${wish_idx}`]: '' },
        } as any,
      },
    },
    {
      updateOne: {
        filter: { id: id_user },
        update: {
          $pull: { blocklist: null },
        },
      },
    },
  ]);
}

export const userService = {
  ensureUser,
  joinGroup,
  quitGroup,
  setReady,
  getBlacklist,
  getWishlist,
  addWish,
  deleteWish,
  addBlack,
  deleteBlack,
};
