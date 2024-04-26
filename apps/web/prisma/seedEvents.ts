import { PrismaClient, Prisma } from "@prisma/client"
import { AbbyEventType } from "@tryabby/core"

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: {},
    include: { projects: true },
  })

  if (!user) {
    throw new Error("User for email not found. Please create an account first.")
  }

  if (!user.projects[0]) {
    throw new Error("User has no projects. Please create a project first.")
  }

  const footerTest = await prisma.test.upsert({
    where: {
      projectId_name: {
        name: "Footer",
        projectId: user.projects[0].projectId,
      },
    },
    create: { name: "Footer", projectId: user.projects[0].projectId },
    update: {},
  })

  const ctaButtonTest = await prisma.test.upsert({
    where: {
      projectId_name: {
        name: "CTA Button",
        projectId: user.projects[0].projectId,
      },
    },
    create: { name: "CTA Button", projectId: user.projects[0].projectId },
    update: {},
  })

  await prisma.option.createMany({
    data: [
      {
        identifier: "oldFooter",
        chance: 0.5,
        testId: footerTest.id,
      },
      {
        identifier: "newFooter",
        chance: 0.5,
        testId: footerTest.id,
      },
      {
        identifier: "dark",
        chance: 0.33,
        testId: ctaButtonTest.id,
      },
      {
        identifier: "light",
        chance: 0.33,
        testId: ctaButtonTest.id,
      },
      {
        identifier: "cyperpunk",
        chance: 0.33,
        testId: ctaButtonTest.id,
      },
    ],
  })

  await prisma.event.createMany({
    data: [
      ...Array.from<Prisma.EventCreateManyInput>({
        length: Math.floor(Math.random() * 200),
      }).map(
        () =>
          ({
            selectedVariant: "oldFooter",
            testId: footerTest.id,
            type: AbbyEventType.PING,
          }) as Prisma.EventCreateManyInput
      ),
      ...Array.from<Prisma.EventCreateManyInput>({
        length: Math.floor(Math.random() * 200),
      }).map(
        () =>
          ({
            selectedVariant: "newFooter",
            testId: footerTest.id,
            type: AbbyEventType.PING,
          }) as Prisma.EventCreateManyInput
      ),
      ...Array.from<Prisma.EventCreateManyInput>({
        length: Math.floor(Math.random() * 200),
      }).map(
        () =>
          ({
            selectedVariant: "oldFooter",
            testId: footerTest.id,
            type: AbbyEventType.ACT,
          }) as Prisma.EventCreateManyInput
      ),
      ...Array.from<Prisma.EventCreateManyInput>({
        length: Math.floor(Math.random() * 200),
      }).map(
        () =>
          ({
            selectedVariant: "newFooter",
            testId: footerTest.id,
            type: AbbyEventType.ACT,
          }) as Prisma.EventCreateManyInput
      ),
    ],
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
