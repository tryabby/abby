# Offical Abby CLI

The Abby CLI works with Node 10.x or higher.

## Installation

To get started make sure to install the packages using your favorite package manager.

```bash
npm i -g @tryabby/cli
```

## Usage

To get started with the CLI, you need to authenticate yourself. You can do this by running the `login` command.

You will need to obtain an API key from the [Abby Dashboard](https://www.tryabby.com/profile) first. After you have obtained your API key, run the following command:

```bash
abby login -t [YOUR_TOKEN]
```

When you have successfully authenticated yourself, you can start using the CLI.

## Commands

### `login`

Authenticate yourself with the Abby API.

#### Options

| Flag            | Description   | Default     | Required |
| --------------- | ------------- | ----------- | -------- |
| `-t`, `--token` | Your API key. | `undefined` | ✅       |

### `push`

Push the changes from your local config to the Abby API.
The updates in the cloud will happen follwing those rules

- If a new test is added, it will be created in the cloud
- If a new environment is added, it will be created in the cloud
- If a new flag is added, it will be created in the cloud

**Caveats:**

You will need to delete flags, tests and environments in the dashboard if you want to fully delete it.
You will then need to delete it manually from your local config. **We are working on a better solution for this.**

#### Options

| Flag             | Description                        | Default                                        | Required |
| ---------------- | ---------------------------------- | ---------------------------------------------- | -------- |
| `-h`, `--host`   | The API URL for the Abby instance. | `https://www.tryabby.com`                      | ❌       |
| `-c`, `--config` | The path to the config file.       | The nearest `abby.config.(ts,js,mjs,cjs)` file | ❌       |

### `pull`

Pull the changes from the Abby API to your local config. It will merge the changes from the cloud with your local config.

#### Options

| Flag             | Description                        | Default                                        | Required |
| ---------------- | ---------------------------------- | ---------------------------------------------- | -------- |
| `-h`, `--host`   | The API URL for the Abby instance. | `https://www.tryabby.com`                      | ❌       |
| `-c`, `--config` | The path to the config file.       | The nearest `abby.config.(ts,js,mjs,cjs)` file | ❌       |

### `check`

Check if your local config is in sync with the Abby API. It will return a list of changes that need to be pushed or pulled.

#### Options

| Flag             | Description                        | Default                                        | Required |
| ---------------- | ---------------------------------- | ---------------------------------------------- | -------- |
| `-h`, `--host`   | The API URL for the Abby instance. | `https://www.tryabby.com`                      | ❌       |
| `-c`, `--config` | The path to the config file.       | The nearest `abby.config.(ts,js,mjs,cjs)` file | ❌       |
