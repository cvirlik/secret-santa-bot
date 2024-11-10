import { MongoClient } from 'mongodb';

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

export type UserGroup = {
  id: number | undefined;
  person: number | null;
  ready: boolean;
};

export type User = {
  id: number;
  name: string;
  wishlist: string[];
  blocklist: string[];
  groups: UserGroup[];
};
