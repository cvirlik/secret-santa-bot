import type { AnyBulkWriteOperation, Collection } from 'mongodb';

import type { User, UserGroup } from '../database.js';

async function ensureUser(id: number, name: string, collection: Collection<User>) {
  return collection.findOneAndUpdate(
    { id },
    {
      $set: { name },
    },
    { upsert: true },
  );
}

async function joinGroup(id_user: number, id_group: number, collection: Collection<User>) {
  const result = await collection.updateOne(
    { 'id': id_user, 'groups.id': { $ne: id_group } },
    {
      $push: { groups: { id: id_group, person: null, ready: false } },
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

async function getGroupMembers(id_group: number, collection: Collection<User>) {
  return collection
    .aggregate<Omit<User, 'groups'> & { groups: UserGroup }>([
      { $unwind: { path: '$groups' } }, //
      { $match: { 'groups.id': id_group } },
      { $sort: { 'groups.ready': -1 } },
    ])
    .toArray();
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

async function assignSecretSantas(id_group: number, collection: Collection<User>) {
  const members = await getGroupMembers(id_group, collection);
  const matches = members.map(member => [Math.random(), member.id]).sort((a, b) => a[0] - b[0]);

  const bulk: AnyBulkWriteOperation<User>[] = [];

  for (const [index, [_, player]] of Object.entries(matches)) {
    const [__, match] = matches[Number(index) + 1] ?? matches[0];
    bulk.push({
      updateOne: {
        filter: { 'id': player, 'groups.id': id_group },
        update: { $set: { 'groups.$.person': match } },
      },
    });
  }

  await collection.bulkWrite(bulk);
}

export const userService = { ensureUser, joinGroup, quitGroup, getGroupMembers, setReady, assignSecretSantas };
