BEGIN;
CREATE TABLE "_new_albums" ("AlbumId" INTEGER PRIMARY KEY, "Title" NVARCHAR(160) NOT NULL, "ArtistId" INTEGER NOT NULL REFERENCES "customers" ("CustomerId"));
INSERT INTO "_new_albums" ("AlbumId", "Title", "ArtistId") SELECT "AlbumId", "Title", "ArtistId" FROM "albums";
DROP TABLE "albums";
ALTER TABLE "_new_albums" RENAME TO "albums";
COMMIT;