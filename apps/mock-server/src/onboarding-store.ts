import { MongoClient, type Collection } from "mongodb";

export type OnboardingPlanInput = {
  walletAddress: string;
  platformId?: string;
  coinSymbol?: string;
  evaluationWindow: string;
  leverage: number;
  stake: number;
  predictionDirection: "long" | "short";
};

export type OnboardingPlanRecord = OnboardingPlanInput & {
  submittedAt: string;
  updatedAt: string;
};

type OnboardingPlanDocument = Omit<OnboardingPlanInput, "walletAddress"> & {
  walletAddress: string;
  submittedAt: Date;
  updatedAt: Date;
};

export type OnboardingStoreStatus = {
  ready: boolean;
  error?: string;
};

const DEFAULT_COLLECTION_NAME = "onboardingPlans";
const DEFAULT_DB_NAME = "perp_demo";

export class OnboardingStore {
  private client: MongoClient | null = null;
  private collection: Collection<OnboardingPlanDocument> | null = null;
  private ready = false;
  private error: string | undefined;

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
      this.error = "Missing MONGO_URI environment variable.";
      console.warn("[onboarding-store] MONGO_URI not provided; persistence disabled.");
      return;
    }

    const dbName = this.config.dbName ?? DEFAULT_DB_NAME;
    const collectionName = this.config.collectionName ?? DEFAULT_COLLECTION_NAME;

    try {
      this.client = new MongoClient(mongoUri);
      await this.client.connect();
      this.collection = this.client.db(dbName).collection<OnboardingPlanDocument>(collectionName);
      await this.collection.createIndex({ walletAddress: 1 }, { unique: true });
      this.ready = true;
      this.error = undefined;
      console.log(
        `[onboarding-store] Connected to MongoDB (db=${dbName}, collection=${collectionName}).`
      );
    } catch (error) {
      this.ready = false;
      this.error =
        error instanceof Error ? error.message : "Failed to initialise Mongo connection.";
      console.error("[onboarding-store] Failed to connect to MongoDB:", error);
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

  status(): OnboardingStoreStatus {
    return {
      ready: this.ready,
      error: this.error
    };
  }

  isReady(): boolean {
    return this.ready && !!this.collection;
  }

  async getPlan(walletAddress: string): Promise<OnboardingPlanRecord | null> {
    const collection = this.collection;
    if (!collection) {
      return null;
    }
    const normalizedWallet = normalizeWallet(walletAddress);
    const doc = await collection.findOne({ walletAddress: normalizedWallet });
    return doc ? toRecord(doc) : null;
  }

  async listPlans(limit = 50): Promise<OnboardingPlanRecord[]> {
    const collection = this.collection;
    if (!collection) {
      return [];
    }
    const cursor = collection
      .find({})
      .sort({ updatedAt: -1 })
      .limit(limit);
    const docs = await cursor.toArray();
    return docs.map((doc) => toRecord(doc));
  }

  async upsertPlan(plan: OnboardingPlanInput): Promise<OnboardingPlanRecord> {
    const collection = this.collection;
    if (!collection) {
      throw new Error("Onboarding persistence is not initialised.");
    }

    const timestamp = new Date();
    const normalizedWallet = normalizeWallet(plan.walletAddress);

    const updateDoc: OnboardingPlanDocument = {
      walletAddress: normalizedWallet,
      platformId: plan.platformId,
      coinSymbol: plan.coinSymbol,
      evaluationWindow: plan.evaluationWindow,
      leverage: plan.leverage,
      stake: plan.stake,
      predictionDirection: plan.predictionDirection,
      submittedAt: timestamp,
      updatedAt: timestamp
    };

    const updatedDoc = await collection.findOneAndUpdate(
      { walletAddress: normalizedWallet },
      { $set: updateDoc },
      { upsert: true, returnDocument: "after" }
    );

    if (updatedDoc) {
      return toRecord(updatedDoc);
    }

    const fallbackDoc = await collection.findOne({ walletAddress: normalizedWallet });
    if (!fallbackDoc) {
      throw new Error("Failed to persist onboarding plan.");
    }
    return toRecord(fallbackDoc);
  }
}

function normalizeWallet(wallet: string): string {
  return wallet.toLowerCase();
}

function toRecord(doc: OnboardingPlanDocument): OnboardingPlanRecord {
  return {
    walletAddress: doc.walletAddress,
    platformId: doc.platformId,
    coinSymbol: doc.coinSymbol,
    evaluationWindow: doc.evaluationWindow,
    leverage: doc.leverage,
    stake: doc.stake,
    predictionDirection: doc.predictionDirection,
    submittedAt: toIsoString(doc.submittedAt),
    updatedAt: toIsoString(doc.updatedAt)
  };
}

function toIsoString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
}

