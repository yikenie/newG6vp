# Website for graphinsight

##################################### Builder ####################################
from docker.io/library/node:16 AS builder

COPY . /workspace/G6VP

# change the default shell to bash
SHELL ["/bin/bash", "-c"]

# install pnpm
RUN npm install -g pnpm@8

# download etcd
# see deatil in gi-httpservice/app/service/graphinsight/utils.ts
RUN cd /tmp && \
    curl -LO https://github.com/etcd-io/etcd/releases/download/v3.4.13/etcd-v3.4.13-linux-amd64.tar.gz && \
    tar zxvf etcd-v3.4.13-linux-amd64.tar.gz && \
    mv etcd-v3.4.13-linux-amd64/etcd /usr/bin/etcd && \
    mv etcd-v3.4.13-linux-amd64/etcdctl /usr/bin/etcdctl && \
    rm -fr etcd-v3.4.13-linux-amd64.tar.gz etcd-v3.4.13-linux-amd64

# gi-site, must be build before gi-httpservice
RUN cd /workspace/G6VP/packages/gi-site && pnpm install && npm run build:docker

# gi-httpservice
RUN cd /workspace/G6VP/packages/gi-httpservice && rm -fr node_modules && npm install && npm run build:docker

# copy gi-site files to gi-httpservice
RUN cp /workspace/G6VP/packages/gi-site/dist/index.html /workspace/G6VP/packages/gi-httpservice/app/view/ && \
    cp -r /workspace/G6VP/packages/gi-site/dist/* /workspace/G6VP/packages/gi-httpservice/app/public/


##################################### Runtime ####################################
from docker.io/library/node:16-alpine

COPY --from=builder /workspace/G6VP/packages/gi-httpservice /workspace/graphinsight
COPY --from=builder /workspace/G6VP/packages/gi-site/docker/docker-entrypoint.sh /workspace/docker-entrypoint.sh
COPY --from=builder /usr/bin/etcd /usr/bin/etcd
COPY --from=builder /usr/bin/etcdctl /usr/bin/etcdctl

RUN npm install -g npm@9.4.2

RUN mkdir -p /workspace/etcd

# entrypoint
ENTRYPOINT ["/workspace/docker-entrypoint.sh"]
