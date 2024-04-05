import { PrismaClient } from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();

const COUPON_CODE_AMOUNT = 200;

async function main() {
  const fileName = path.join(__dirname, './coupons.csv');

  const items = Array.from({ length: COUPON_CODE_AMOUNT }).map(() => ({
    stripePriceId:
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      'STARTUP_LIFETIME',
  }));

  const codes = await prisma.$transaction(
    items.map((item) => prisma.couponCodes.create({ data: item })),
  );

  const csv = codes.map((code) => code.code).join('\n');

  await fs.writeFile(fileName, csv);

  console.log(`Wrote ${COUPON_CODE_AMOUNT} codes to ${fileName}`);
}

main();
