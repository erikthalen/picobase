BEGIN;
CREATE TABLE "_new_invoice_items" ("InvoiceLineId" INTEGER PRIMARY KEY, "InvoiceId" INTEGER NOT NULL REFERENCES "invoices" ("InvoiceId"), "TrackId" INTEGER NOT NULL REFERENCES "tracks" ("TrackId"), "UnitPrice" NUMERIC(10,2) NOT NULL REFERENCES "albums" ("AlbumId"), "Quantity" INTEGER NOT NULL);
INSERT INTO "_new_invoice_items" ("InvoiceLineId", "InvoiceId", "TrackId", "UnitPrice", "Quantity") SELECT "InvoiceLineId", "InvoiceId", "TrackId", "UnitPrice", "Quantity" FROM "invoice_items";
DROP TABLE "invoice_items";
ALTER TABLE "_new_invoice_items" RENAME TO "invoice_items";
COMMIT;