import { MongoClient, type Collection } from "mongodb";

export type FeedbackInput = {
  email?: string | null;
  sentiment?: string | null;
  notes: string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

type FeedbackDocument = {
  _id?: never;
  email?: string | null;
  sentiment?: string | null;
  notes: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  submittedAt: Date;
};

export type FeedbackRecord = Omit<FeedbackDocument, "submittedAt"> & {
  submittedAt: string;
};

const DEFAULT_COLLECTION_NAME = "feedback";
const DEFAULT_DB_NAME = "perp_demo";

export class FeedbackStore {
  private client: MongoClient | null = null;
  private collection: Collection<FeedbackDocument> | null = null;
  private ready = false;
  private memory: FeedbackRecord[] = [];

  constructor(
    private readonly config: {
      mongoUri?: string;
      dbName?: string;
      collectionName?: string;
    }
  ) {}

  async init(): Promise<void> {
    const mongoUri = this.config.mongoUri;
    if (!mongoUri) {
      this.ready = false;
      console.warn("[feedback-store] MONGO_URI not provided; feedback will not be persisted.");
      return;
    }

    const dbName = this.config.dbName ?? DEFAULT_DB_NAME;
    const collectionName = this.config.collectionName ?? DEFAULT_COLLECTION_NAME;

    try {
      this.client = new MongoClient(mongoUri);
      await this.client.connect();
      this.collection = this.client.db(dbName).collection<FeedbackDocument>(collectionName);
      await this.collection.createIndex({ submittedAt: -1 });
      this.ready = true;
      console.log(
        `[feedback-store] Connected to MongoDB (db=${dbName}, collection=${collectionName}).`
      );
    } catch (error) {
      this.ready = false;
      console.error("[feedback-store] Failed to connect to MongoDB:", error);
      await this.client?.close().catch(() => undefined);
      this.client = null;
      this.collection = null;
    }
  }

  async close(): Promise<void> {
    await this.client?.close().catch(() => undefined);
    this.client = null;
    this.collection = null;
    this.ready = false;
  }

  isReady(): boolean {
    return this.ready && !!this.collection;
  }

  async insert(feedback: FeedbackInput): Promise<FeedbackRecord> {
    const doc: FeedbackDocument = {
      email: feedback.email ?? null,
      sentiment: feedback.sentiment ?? null,
      notes: feedback.notes,
      userAgent: feedback.userAgent ?? null,
      ipAddress: feedback.ipAddress ?? null,
      submittedAt: new Date()
    };

    const collection = this.collection;
    if (!collection) {
      const record = toRecord(doc);
      this.memory.unshift(record);
      return record;
    }

    const result = await collection.insertOne(doc);
    const inserted = await collection.findOne({ _id: result.insertedId });
    if (!inserted) {
      throw new Error("Failed to persist feedback.");
    }
    return toRecord(inserted);
  }
}

function toRecord(doc: FeedbackDocument): FeedbackRecord {
  return {
    email: doc.email ?? null,
    sentiment: doc.sentiment ?? null,
    notes: doc.notes,
    userAgent: doc.userAgent ?? null,
    ipAddress: doc.ipAddress ?? null,
    submittedAt: doc.submittedAt.toISOString()
  };
}
