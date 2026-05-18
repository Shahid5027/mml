"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
// Handle graceful shutdown of Prisma connection
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
});
