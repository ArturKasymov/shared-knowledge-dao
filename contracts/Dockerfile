FROM rust:1.66

# rustup setup
RUN rustup toolchain install nightly
RUN rustup component add rust-src --toolchain nightly
RUN rustup target add wasm32-unknown-unknown --toolchain nightly

# binaryen setup
RUN apt-get update && apt install binaryen

# cargo setup
RUN cargo install dylint-link
RUN cargo install cargo-dylint
RUN cargo install --git https://github.com/paritytech/cargo-contract.git --rev 4f831bc2e4b8f3fa5a6a4d1b3fa673e99807af8f

# [Optional] cargo build cache setup
WORKDIR /workspace/
COPY . .
RUN cd token && cargo +nightly contract build --release
RUN cd database && cargo +nightly contract build --release
RUN cd governor && cargo +nightly contract build --release

