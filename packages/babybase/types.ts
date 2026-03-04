export interface BabybaseConfig {
  database: string;
  basePath?: string; // mount prefix for generating hrefs, default "/"
  migrationsDir?: string; // default "./migrations"
  storageDir?: string; // default "./storage"
}
