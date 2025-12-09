FROM rustlang/rust:nightly AS builder

WORKDIR /app

# 安装 diesel_cli
RUN cargo install diesel_cli --no-default-features --features sqlite

# 利用 Docker 缓存层：先复制依赖文件
COPY Cargo.toml Cargo.lock* ./

# 创建占位文件以编译依赖（缓存优化）
RUN mkdir src && echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# 复制真实源码并构建
COPY src ./src
COPY migrations ./migrations
COPY diesel.toml ./
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    libsqlite3-0 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/backend /app/backend
COPY --from=builder /root/.cargo/bin/diesel /usr/local/bin/diesel
COPY migrations ./migrations
COPY diesel.toml ./

ENV RUST_LOG=info
ENV DATABASE_URL=/app/data/database.db

EXPOSE 8080

# 运行迁移后启动服务
CMD diesel migration run && ./backend
