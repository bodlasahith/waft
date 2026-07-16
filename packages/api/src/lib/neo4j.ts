import neo4j, { Driver } from "neo4j-driver";

let driver: Driver;

export function getDriver(): Driver {
  if (!driver) {
    // NEO4J_USERNAME is the spelling in Aura's downloadable credentials
    // file — accept it so the file can be pasted into .env as-is.
    const user = process.env.NEO4J_USER ?? process.env.NEO4J_USERNAME ?? "neo4j";
    driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(user, process.env.NEO4J_PASSWORD!)
    );
  }
  return driver;
}

export async function closeDriver(): Promise<void> {
  if (driver) await driver.close();
}
