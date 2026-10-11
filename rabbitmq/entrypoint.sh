#!/bin/sh
cat << "EOF"
 ██████╗ ██████╗  ██████╗ ██╗  ██╗███████╗██████╗ 
 ██╔══██╗██╔══██╗██╔═══██╗██║ ██╔╝██╔════╝██╔══██╗
 ██████╔╝██████╔╝██║   ██║█████╔╝ █████╗  ██████╔╝
 ██╔══██╗██╔══██╗██║   ██║██╔═██╗ ██╔══╝  ██╔══██╗
 ██████╔╝██║  ██║╚██████╔╝██║  ██╗███████╗██║  ██║
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
                        :: ThamaniCraft Broker ::
EOF

# Wait for RabbitMQ to start, then enable Firehose Tracer for RabbitScout
( sleep 15; rabbitmqctl trace_on ) &

# Pass execution to the default rabbitmq entrypoint
exec docker-entrypoint.sh "$@"
