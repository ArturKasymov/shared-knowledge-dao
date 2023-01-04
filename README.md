# shared-knowledge-dao

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup toolchain install nightly
rustup component add rust-src --toolchain nightly
rustup target add wasm32-unknown-unknown --toolchain nightly
rustup default nightly
sudo apt install binaryen
cargo install --git https://github.com/paritytech/cargo-contract.git --rev 4f831bc2e4b8f3fa5a6a4d1b3fa673e99807af8f
cd ./contracts/token && cargo test
```
