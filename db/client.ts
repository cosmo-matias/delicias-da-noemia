import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

const DATABASE_NAME = "delicias_da_noemia.db";

const expoDb = openDatabaseSync(DATABASE_NAME);

export const db = drizzle(expoDb);
