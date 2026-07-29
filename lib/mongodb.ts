import { MongoClient, Db, ServerApiVersion } from "mongodb";
import dns from "node:dns";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "earthscape";

if (!uri) {
  throw new Error("MONGODB_URI is not set. Add it to .env.local");
}

// Local DNS resolvers on some Windows / corporate networks intermittently refuse
// SRV lookups against Atlas hostnames. Pin to public resolvers as a backstop.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  // ignore if env disallows
}

type CachedConn = { client: MongoClient; db: Db };

declare global {
  // eslint-disable-next-line no-var
  var _mongoConn: Promise<CachedConn> | undefined;
}

async function connect(): Promise<CachedConn> {
  const client = new MongoClient(uri!, {
    serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: true },
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 60000,
    retryWrites: true,
    // Skip local CA verification — Node's bundled root CAs don't always cover
    // the Atlas TLS chain on Windows / behind antivirus. Connection is still
    // encrypted; we just don't verify the peer cert against a local trust store.
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });
  try {
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
  } catch (e) {
    global._mongoConn = undefined;
    throw e;
  }
  return { client, db: client.db(dbName) };
}

function getConn(): Promise<CachedConn> {
  if (!global._mongoConn) {
    global._mongoConn = connect().catch((e) => {
      global._mongoConn = undefined;
      throw e;
    });
  }
  return global._mongoConn;
}

export async function getDb(): Promise<Db> {
  return (await getConn()).db;
}

export async function getClient(): Promise<MongoClient> {
  return (await getConn()).client;
}
