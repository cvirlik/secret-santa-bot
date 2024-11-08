import { MongoClient } from 'mongodb';
import type { Collection } from 'mongodb';

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

const dbName = 'secret-santa-base';

export async function connect() {
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  const collection = db.collection<User>('users');

  return { collection };
}

type UserGroup = {
  id: number | undefined;
  person: number | null;
};

export type User = {
  id: number;
  name: string;
  wishlist: string[];
  blocklist: string[];
  groups: UserGroup[];
};

export async function updateUser(
  collection: Collection<User>,
  ctx: { from: { first_name: string; id: number }; chatId: number | undefined },
) {
  const filter = {
    id: ctx.from.id,
  };

  const update = {
    $set: {
      name: ctx.from.first_name,
      groups: {
        $cond: {
          if: { $in: [ctx.chatId, { $ifNull: ['$groups.id', []] }] },
          then: '$groups',
          else: {
            $concatArrays: [
              { $ifNull: ['$groups', []] },
              [
                {
                  id: ctx.chatId,
                  person: null,
                },
              ],
            ],
          },
        },
      },
    },
  };

  const options = { upsert: true };

  const result = await collection.updateOne(filter, [update], options);

  if (result) {
    console.log('A new document was created with ID:', result);
  }
}
