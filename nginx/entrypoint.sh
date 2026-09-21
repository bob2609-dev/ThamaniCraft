#!/bin/sh
cat << "EOF"
 ██████╗ ██████╗  ██████╗ ██╗  ██╗██╗   ██╗
 ██╔══██╗██╔══██╗██╔═══██╗╚██╗██╔╝╚██╗ ██╔╝
 ██████╔╝██████╔╝██║   ██║ ╚███╔╝  ╚████╔╝ 
 ██╔═══╝ ██╔══██╗██║   ██║ ██╔██╗   ╚██╔╝  
 ██║     ██║  ██║╚██████╔╝██╔╝ ██╗   ██║   
 ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
                        :: ThamaniCraft Proxy ::
EOF

# Pass execution to the default nginx entrypoint
exec /docker-entrypoint.sh nginx -g "daemon off;"
