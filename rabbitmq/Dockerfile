FROM rabbitmq:3-management-alpine

ENV TZ=Africa/Dar_es_Salaam
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

COPY entrypoint.sh /docker-entrypoint-custom.sh
RUN chmod +x /docker-entrypoint-custom.sh

RUN rabbitmq-plugins enable --offline rabbitmq_tracing

ENTRYPOINT ["/docker-entrypoint-custom.sh"]
CMD ["rabbitmq-server"]
