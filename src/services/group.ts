import type { AnyBulkWriteOperation, Collection } from 'mongodb';

import type { User, UserGroup } from '../database';

async function getGroupMembers(id_group: number, collection: Collection<User>) {
  return collection
    .aggregate<Omit<User, 'groups'> & { groups: UserGroup }>([
      { $unwind: { path: '$groups' } }, //
      { $match: { 'groups.id': id_group } },
      { $sort: { 'groups.ready': -1 } },
    ])
    .toArray();
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

export const groupService = {
  getGroupMembers,
  assignSecretSantas,
};
