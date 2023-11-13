---
layout: post
title: "Sharing Bitcoin Core Blockchain Directory via NFS"
description: "Optimize Disk Space and Bandwidth by Sharing Bitcoin's Blocks Directory over NFS."
toc: false
tags:
  - Linux
  - Bitcoin
  - Bitcoin Core
  - bitcoind
  - Bitcoin Qt
  - Blockchain
  - NFS
---

Consider a scenario: you're running a Bitcoin Core daemon on a remote server, and you want your laptop's Bitcoin Core Qt app to utilize the same blocks directory, cutting down on disk space and bandwidth usage. Use NFS (over VPN, since NFS does not provide encryption by default). The downside is, each application requires an exclusive access to the directory, so running both `bitcoind` and Bitcoin Qt simultaneously becomes impossible. You'll have to pause Bitcoin Core daemon before firing up Bitcoin Qt.

## Adjusting the Bitcoin Directory Structure

Let's take a look at `~/.bitcoin` directory structure:

```text
├── blocks
│   ├── blk00000.dat
│   ├── ...
│   └── index
├── chainstate
├── wallets
└── ...
```

We're interested in `blocks`, `blocks/index` and `chainstate`. According to [Bitcoin data directory layout](https://github.com/bitcoin/bitcoin/blob/25.x/doc/files.md#data-directory-layout) `blocks` contains blockchain and this is what we want to share, `blocks/index` and `chainsate` contain volatile LevelDB files that we don't need to share.

We need to change that structure a bit. Let's move `blocks/index` directory to one level up (to `~/.bitcoin` root):

```shell
mv ~/.bitcoin/blocks/index ~/.bitcoin/index
```

And then create **relative** (it's important) symlink to top-level `index` directory inside `blocks`:

```shell
cd ~/.bitcoin/blocks/
ln -s ../index index
```

After completing the adjustments, your directory structure should now look like this:

```text
├── blocks
│   └── index -> ../index
├── chainstate
├── index
└── wallets
```

Additionally, copy the `index` & `chainstate` directories, along with all their contents, from the remote server to the machine where you want to mount the share. Ensure you preserve the directory layout, placing both `index` and `chainstate` at the root of `~/.bitcoin`.

## Create & Mount NFS Share

Let's assume our `bitcoind` server utilizes `/home/bitcoin/.bitcoin` to store its data, and its LAN IP address is `192.168.1.1`.

Install NFS server (Ubuntu/Debian):

```shell
sudo apt install nfs-kernel-server
```

Create an NFS share by adding the following line to `/etc/exports`:

```text
/home/bitcoin/.bitcoin/blocks 192.168.1.0/24(rw,sync,no_subtree_check)
```

Please note that we are only sharing the `blocks` directory, not the entire `~/.bitcoin`.

After updating the configuration, restart the NFS server:

```shell
sudo systemctl restart nfs-kernel-server.service
```

Now, let's mount the NFS share on your machine:

```shell
sudo mount -t nfs 192.168.1.1:/home/bitcoin/.bitcoin/blocks /home/user/.bitcoin/blocks
```

Remember, you must stop Bitcoin Core daemon on the server before launching Bitcoin Qt on the machine where you've mounted the `blocks` directory. Once done, you can start Bitcoin Qt, and it will seamlessly utilize the blocks from the NFS share.

---

References:

* [Bitcoin data directory layout](https://github.com/bitcoin/bitcoin/blob/25.x/doc/files.md#data-directory-layout)
* [Bitcoin core datadir over NFS](https://bitcoin.stackexchange.com/questions/97211/bitcoin-core-datadir-over-nfs/97227)
