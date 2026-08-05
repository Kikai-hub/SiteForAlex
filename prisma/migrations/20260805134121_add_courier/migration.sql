-- CreateTable
CREATE TABLE "Courier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessToken" TEXT NOT NULL,
    "customerId" TEXT,
    "guestName" TEXT NOT NULL,
    "guestPhone" TEXT NOT NULL,
    "fulfillmentType" TEXT NOT NULL,
    "addressCity" TEXT,
    "addressStreet" TEXT,
    "addressHouse" TEXT,
    "addressApartment" TEXT,
    "addressEntrance" TEXT,
    "addressFloor" TEXT,
    "addressComment" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "courierId" TEXT,
    "assignedAt" DATETIME,
    "deliveredAt" DATETIME,
    "subtotalMinor" INTEGER NOT NULL,
    "discountMinor" INTEGER NOT NULL DEFAULT 0,
    "totalMinor" INTEGER NOT NULL,
    "promoCodeId" TEXT,
    "promoCodeSnapshot" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("accessToken", "addressApartment", "addressCity", "addressComment", "addressEntrance", "addressFloor", "addressHouse", "addressStreet", "createdAt", "customerId", "discountMinor", "fulfillmentType", "guestName", "guestPhone", "id", "notes", "paymentMethod", "promoCodeId", "promoCodeSnapshot", "status", "subtotalMinor", "totalMinor", "updatedAt") SELECT "accessToken", "addressApartment", "addressCity", "addressComment", "addressEntrance", "addressFloor", "addressHouse", "addressStreet", "createdAt", "customerId", "discountMinor", "fulfillmentType", "guestName", "guestPhone", "id", "notes", "paymentMethod", "promoCodeId", "promoCodeSnapshot", "status", "subtotalMinor", "totalMinor", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Courier_username_key" ON "Courier"("username");
