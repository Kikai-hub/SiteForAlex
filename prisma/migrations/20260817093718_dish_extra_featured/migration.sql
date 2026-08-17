-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DishExtra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dishId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "maxQuantity" INTEGER NOT NULL DEFAULT 5,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DishExtra_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DishExtra" ("dishId", "id", "isActive", "maxQuantity", "name", "priceMinor", "sortOrder") SELECT "dishId", "id", "isActive", "maxQuantity", "name", "priceMinor", "sortOrder" FROM "DishExtra";
DROP TABLE "DishExtra";
ALTER TABLE "new_DishExtra" RENAME TO "DishExtra";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
