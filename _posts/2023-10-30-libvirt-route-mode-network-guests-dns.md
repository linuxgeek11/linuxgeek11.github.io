---
layout: post
title: "Accessing libvirt Virtual Machines by DNS Names"
description: "Configure networking in libvirt for easy access to guests by DNS names."
toc: true
tags:
  - Linux
  - libvirt
  - Networking
  - DNS
  - dnsmasq
---

In this brief guide, I'll show the configuration of the routed mode network in libvirt that allows you to seamlessly access your virtual guests by DNS names. I'll cover libvirt network setup, firewall configurations, and dnsmasq integration.

## Configuration Defaults

For this guide, I'll be using the following settings. Please adapt them to match your specific requirements:

`virbr1`: host virtual bridge interface.

`192.168.144.0/24`: virtual network subnet.

`loc`: name of the virtual network.

`enp0s3`: host LAN interface, which routes traffic from guests to the Internet (if you use a VPN for Internet access, make sure to adjust it accordingly).

`192.168.144.2` & `guest.loc`: desired IP address and DNS name for your virtual guest.

This assumes that you already have a virtual machine (`guest`) connected to another network (e.g. `default`).

## Configuring the libvirt Network

First of all, you need to define a new routed network.

> With **routed** mode, the virtual switch is connected to the physical host LAN, passing guest network traffic back and forth without using NAT.

For more details on what `route` mode is and how it differs from other modes, you can refer to the [libvirt wiki](https://wiki.libvirt.org/VirtualNetworking.html#routed-mode).

Next, obtain the MAC address of your guest machine:

```shell
sudo virsh dumpxml guest | grep mac
```

You'll see an output similar to this:

```text
...
<mac address='1a:2b:3c:4d:5e:6f'/>
...
```

Now, add the guest MAC address, in this case, `1a:2b:3c:4d:5e:6f`, to the network configuration. This step will assign a static IP address to the guest and allow you to associate a DNS name with it:

```xml
<network>
  <name>loc</name>
  <forward mode='route'/>
  <bridge name='virbr1' stp='on' delay='0'/>
  <dns>
    <host ip='192.168.144.2'>
      <hostname>guest.loc</hostname>
    </host>
  </dns>
  <ip address='192.168.142.1' netmask='255.255.255.0'>
    <dhcp>
      <range start='192.168.144.2' end='192.168.142.254'/>
      <host mac='1a:2b:3c:4d:5e:6f' name='guest' ip='192.168.144.2'/>
    </dhcp>
  </ip>
</network>
```

Save the configuration to a file named `loc.xml` and run `virsh net-define`:

```shell
sudo virsh net-define loc.xml
```

Set the network to start automatically:

```shell
sudo virsh net-autostart loc
```

Start the network:

```shell
sudo virsh net-start loc
```

## Guest Config

Next, you'll need to include your network reference `<source network='loc'/>` in the guest's configuration:

```shell
sudo virsh edit guest
```

```xml
  <devices>
    ...
    <interface type='network'>
      <mac address='1a:2b:3c:4d:5e:6f'/>
      <source network='loc'/>
      <model type='virtio'/>
      <address type='pci' domain='0x0000' bus='0x01' slot='0x00' function='0x0'/>
    </interface>
    ...
  </devices>
```

Restart the guest.

## Host Config

To facilitate communication between the virtual bridge `virbr1` and the host LAN interface `enp0s3`, you'll need to enable forwarding:

```shell
sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -A FORWARD -i virbr1 -o enp0s3 -j ACCEPT
```

Additionally, you should masquerade traffic passing through the LAN interface to ensure proper routing:

```shell
sudo iptables -t nat -A POSTROUTING -s 192.168.144.0/24 -o enp3s0 -j MASQUERADE
```

This will enable your virtual guests to access the LAN and the internet through the LAN interface.

## Forwarding DNS Requests to the libvirt dnsmasq Server

In Linux host servers, libvirt utilizes a dedicated dnsmasq instance for each virtual network. For the `loc` network, DNS and DHCP servers operate from `192.168.144.1`.

With this setup, you can resolve DNS names like `guest.loc` using this server. You can verify this with an nslookup command:

```shell
nslookup guest.loc 192.168.144.1
```

Which will produce the following output:

```text
Server:         192.168.144.1
Address:        192.168.144.1#53

Name:   guest.loc
Address: 192.168.144.2
```

After setting up the libvirt dnsmasq server for the `loc` network, you can access it from both the host and guests connected to the `loc` network. **It rejects requests from other networks w/o any warning.**

To make guest domain name resolution available from the host, there are at least two methods you can choose from:

1. Directly add `192.168.144.1` to your host's `/etc/resolv.conf`;
2. If you're using a DNS server like dnsmasq on your host, you can configure it to resolve names related to the `.loc` top-level domain via `192.168.144.1`.

### Configuring Host dnsmasq to Resolve Names Related to Virtual TLD via libvirt dnsmasq

Add the following to the host's `/etc/dnsmasq.conf`:

```text
server=/loc/192.168.144.1
```

Restart the dnsmasq service:

```shell
sudo systemctl restart dnsmasq.service
```

Check the dnsmasq service status:

```shell
sudo systemctl status dnsmasq.service
```

You should find the following entry in the log:

```text
dnsmasq[4263]: using nameserver 192.168.144.1#53 for domain loc
```

Now you can resolve your guests DNS names via the host dnsmasq:

```shell
nslookup guest.loc
```

```text
Server:         127.0.0.1
Address:        127.0.0.1#53

Name:   guest.loc
Address: 192.168.144.2
```

In a further article, I'll explore how to connect to the libvirt routed mode network via VPN & gain access to the guests connected to that network by DNS names.

---

References:

* [KVM: Using dnsmasq for libvirt DNS resolution](https://fabianlee.org/2018/10/22/kvm-using-dnsmasq-for-libvirt-dns-resolution/)
* [libvirt NSS module](https://libvirt.org/nss.html)
* [libvirt Virtual Networking](https://wiki.libvirt.org/VirtualNetworking.html)
* [libvirt Networking Handbook: Routed network](https://jamielinux.com/docs/libvirt-networking-handbook/routed-network.html)
