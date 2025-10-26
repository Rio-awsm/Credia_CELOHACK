"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.disconnectDB = exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Singleton pattern for Prisma Client
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
// Graceful shutdown
const disconnectDB = async () => {
    await exports.prisma.$disconnect();
};
exports.disconnectDB = disconnectDB;
// Test connection
const testConnection = async () => {
    try {
        await exports.prisma.$connect();
        console.log('✅ Database connected successfully');
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};
exports.testConnection = testConnection;
