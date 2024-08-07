const pkg = require("./package.json");
const fs = require("node:fs");

const basePkgJson = {
  main: "index.js",
  types: "index.d.ts",
};

function main() {
  Object.keys(pkg.exports).forEach((key) => {
    if (key === ".") {
      return;
    }

    const newPath = key.replace("./", "dist/");

    fs.writeFileSync(
      `./${newPath}/package.json`,
      JSON.stringify(basePkgJson, null, 2)
    );
  });
}

main();
