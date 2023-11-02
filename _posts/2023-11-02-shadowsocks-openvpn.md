---
layout: post
title: "Setting Up Shadowsocks Server & Client for Routing OpenVPN Traffic"
description: "Bypass OpenVPN Blocks with Shadowsocks."
toc: true
tags:
  - Debian
  - Ubuntu
  - Linux
  - Shadowsocks
  - OpenVPN
  - VPN
  - Censorship
  - Privacy
  - Docker
  - UDP
  - shadowsocks-libev
---

## Dependencies

Assuming you're using Debian/Ubuntu. Package for both the server and client is the same:

```shell
sudo apt install shadowsocks-libev
```

## Setting Up Shadowsocks Server

To configure Shadowsocks server, create a `config.json` file with the following contents (replace placeholders in angle brackets with actual values):

```json
{
  "server_port": 443,
  "mode": "udp_only",
  "password": "<SHADOWSOCKS_PASSWORD>",
  "timeout": 60,
  "method": "chacha20-ietf-poly1305",
  "fast_open": true
}
```

If both your server and clients are running on Linux, you can optimize your setup for reduced latency by setting `"fast_open": true`. Be sure to enable it on both your server and client machines:

```shell
sudo echo "net.ipv4.tcp_fastopen = 3" >> /etc/sysctl.d/99-sysctl.conf
sudo sysctl -p
```

See [TCP fast open](https://github.com/shadowsocks/shadowsocks/wiki/TCP-Fast-Open) for details.

Run Shadowsocks server:

```shell
ss-server -a nobody -c config.json
```

### Shadowsocks Server Inside Docker Container

You may run it inside Docker container. Check out this [gist](https://gist.github.com/linuxgeek11/d481820174d6a99903a7001f100c653b) (don't forget to adjust settings in `config.json`):

<script src="https://gist.github.com/linuxgeek11/d481820174d6a99903a7001f100c653b.js"></script>

## Setting Up Shadowsocks Client

Disable server:

```shell
sudo systemctl disable --now shadowsocks-libev
```

Create `/etc/shadowsocks-libev/<SERVER>.json` (replace placeholders in angle brackets with actual values) and put the following contents there:

```json
{
  "server": "<SHADOWSOCKS_SERVER_HOST>",
  "server_port": 443,
  "local_address": "127.0.0.1",
  "local_port": 1080,
  "mode": "udp_only",
  "password": "<SHADOWSOCKS_PASSWORD>",
  "timeout": 60,
  "method": "chacha20-ietf-poly1305",
  "fast_open": true
}
```

Start client:

```shell
sudo systemctl enable --now shadowsocks-libev-local@<SERVER>
```

Check the logs:

```shell
sudo journalctl -t ss-local
```

You should find something like:

```text
ss-local[30443]:  2023-11-02 17:18:07 INFO: initializing ciphers... chacha20-ietf-poly1305
ss-local[30443]:  2023-11-02 17:18:07 INFO: listening at 127.0.0.1:1080
ss-local[30443]:  2023-11-02 17:18:07 INFO: udprelay enabled
```

## Routing OpenVPN Traffic Through Shadowsocks

```text
socks-proxy-retry
socks-proxy 127.0.0.1 1080
```

### Troubleshooting

If you're encountering connectivity issues in certain apps & you're seeing the following messages in the server or client logs:

```text
ERROR: [udp] remote_recv_sendto: Message too long
```

Client log:

```text
ERROR: [udp] server_recv_sendto: Message too long
```

You can try to resolve this by adjusting the Maximum Transmission Unit (MTU), typically set at `1500`. You can experiment with OpenVPN client options like `tun-mtu`, `mssfix`, and `tun-mtu-extra`. For example:

For instance:

```text
tun-mtu 1400
mssfix 1350
tun-mtu-extra 32
```

---

References:

* [TCP Fast Open](https://github.com/shadowsocks/shadowsocks/wiki/TCP-Fast-Open)
* [Optimizing Shadowsocks](https://github.com/shadowsocks/shadowsocks/wiki/Optimizing-Shadowsocks)
* [OpenVPN MTU: Finding The Correct Settings](https://www.thegeekpub.com/271035/openvpn-mtu-finding-the-correct-settings/)
