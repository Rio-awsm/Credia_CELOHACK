// Debug script to check payment status for address 0xb12653F335f5C1B56A30afA840d394E90718633A
import { prisma } from "./src/database/connections.ts";

async function debugPayment() {
  try {
    console.log(
      "🔍 Checking payment status for wallet: 0xa0e793e7257c065b30c46ef6828f2b3c0de87a8e"
    );

    // Find user by wallet
    const user = await prisma.user.findUnique({
      where: { walletAddress: "0xa0e793e7257c065b30c46ef6828f2b3c0de87a8e" },
    });

    if (!user) {
      console.error("❌ User not found");
      return;
    }

    console.log(`\n✅ User found: ${user.id}`);

    // Find all submissions for this worker
    const submissions = await prisma.submission.findMany({
      where: { workerId: user.id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            paymentAmount: true,
            contractTaskId: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    console.log(`\n📝 Found ${submissions.length} submissions:`);

    for (const submission of submissions) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 Submission ID: ${submission.id}`);
      console.log(`   Task: ${submission.task.title}`);
      console.log(`   Verification Status: ${submission.verificationStatus}`);
      console.log(`   Task Status: ${submission.task.status}`);
      console.log(`   Contract Task ID: ${submission.task.contractTaskId}`);
      console.log(`   Amount: ${submission.task.paymentAmount} cUSD`);

      // Find payment record
      const payment = await prisma.payment.findFirst({
        where: {
          taskId: submission.taskId,
          workerId: user.id,
        },
      });

      if (payment) {
        console.log(`   💳 Payment Status: ${payment.status}`);
        console.log(`   💳 Transaction Hash: ${payment.transactionHash}`);
        console.log(`   💳 Amount: ${payment.amount}`);
      } else {
        console.log(`   ❌ No payment record found`);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPayment();
