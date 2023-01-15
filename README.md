# shared-knowledge-dao

### Setup

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup toolchain install nightly
rustup component add rust-src --toolchain nightly
rustup target add wasm32-unknown-unknown --toolchain nightly
rustup default nightly
sudo apt install binaryen
cargo install --git https://github.com/paritytech/cargo-contract.git --rev 4f831bc2e4b8f3fa5a6a4d1b3fa673e99807af8f
# Make sure Node.js v14+ is installed
cd frontend && npm install
```

### Contracts

`token`, `database` and `governor` under `contracts/`

Unit testing:
```bash
cd contracts/token && cargo test
```

### Deploy

```bash
./scripts/deploy.sh "<12-word seed of your polkadot account>"
```

In `contracts/addresses.json` one can find the addresses of the currently deployed contracts

Note: before redeploying the contract after code updates:
```bash
./scripts/terminate.sh "<12-word seed of your polkadot account>"
```

### Contracts CLI

Call functions on the contract
```bash
cd contracts/<contract_name> && cargo contract call \
	--url wss://ws.test.azero.dev \
	--suri <12-word seed | "//Alice"> \
	--contract <contract_address> \
	[--dry-run] \
	-m <method_name> \
		[--args arg1 arg2 ...]
```

### Frontend

```bash
cd frontend
./lint.sh
./start.sh
# Now you can modify the code, save the files, and the app will refresh automatically
npm run-script stop
```

To see the logs, open the app in `localhost:3000` and `Ctrl+Shift+I`
