FROM node:24.15.0-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN pnpm install --offline --frozen-lockfile

ARG VITE_OIDC_AUTHORITY
ARG VITE_OIDC_CLIENT_ID
ARG VITE_OIDC_SCOPE
ARG VITE_DEMO_MODE
ARG VITE_SSO_BUTTON_LABEL
ARG VITE_SSO_BUTTON_LOGO_URL

ENV VITE_OIDC_AUTHORITY=${VITE_OIDC_AUTHORITY}
ENV VITE_OIDC_CLIENT_ID=${VITE_OIDC_CLIENT_ID}
ENV VITE_OIDC_SCOPE=${VITE_OIDC_SCOPE}
ENV VITE_DEMO_MODE=${VITE_DEMO_MODE}
ENV VITE_SSO_BUTTON_LABEL=${VITE_SSO_BUTTON_LABEL}
ENV VITE_SSO_BUTTON_LOGO_URL=${VITE_SSO_BUTTON_LOGO_URL}

RUN pnpm --filter web build

FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY infrastructure/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
