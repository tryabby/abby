import { createAbby } from "../src/index";

const testVariants = ["OldFooter", "NewFooter"] as const;
const test2Variants = ["SimonsText", "MatthiasText", "TomsText", "TimsText"] as const;

it("should work properly", async () => {
  const abby = createAbby({
    environments: [],
    projectId: "123",
    tests: {
      test: { variants: testVariants },
      test2: {
        variants: test2Variants,
      },
    },
    flags: ["flag1", "flag2"],
  });

  await abby.loadProjectData();

  expect(abby.getFeatureFlag("flag1")).toBe(true);
  expect(abby.getFeatureFlag("flag2")).toBe(false);
  expect(abby.getTestVariant("test")).to.be.oneOf(testVariants);
  expect(abby.getTestVariant("test2")).to.be.oneOf(test2Variants);
});
