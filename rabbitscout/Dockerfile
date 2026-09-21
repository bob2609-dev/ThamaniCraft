FROM ghcr.io/ralve-org/rabbitscout:latest

USER root
WORKDIR /app

ENV TZ=Africa/Dar_es_Salaam
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER node

ENTRYPOINT ["/entrypoint.sh"]