---
layout: post
title: "Install Debian 12 Bookworm in Expert Mode via libvirt Text Console on Graphics-Less Server"
description: "Explore the process of installing Debian 12 Bookworm in expert mode on a machine without graphics, utilizing the libvirt text console."
toc: true
tags:
  - Debian
  - Debian 12 Bookworm
  - libvirt
  - serial console
---

## Installation

According to Debian installer [docs](https://www.debian.org/releases/bookworm/amd64/ch05s03.en.html#installer-args):

> If you are booting with a serial console, generally the kernel will autodetect this. If you have a videocard (framebuffer) and a keyboard also attached to the computer which you wish to boot via serial console, you may have to pass the console=device argument to the kernel, where device is a serial device of the target, which is usually something like ttyS0.

> When priority=low is used, all messages are shown (this is equivalent to the expert boot method).

Run the installation with `virt-install`:

```shell
sudo virt-install --name debian-virtual --extra-args="console=ttyS0 priority=low" --location debian-12.1.0-amd64-netinst.iso --accelerate --nographics --memory ... --disk ... --os-variant debiantesting --network network=default
```

You should pass these parameters to `virt-install`:

```text
--location ... --nographics
```

For `--location`, provide the path to your installation ISO, such as a net install ISO. Note that this won't work with a live CD ISO.

Additionally, you need to pass extra boot parameters to the installer when it boots:

```text
--extra-args "console=ttyS0 priority=low"
```

* `console=ttyS0` instructs the kernel to use the text console.
* `priority=low` is an option for enabling expert installation mode.

Remember to adjust the `network`, `location`, `disk`, and `memory` parameters according to your specific requirements.

## Boot Installed System in Text Mode

To boot in text mode and access the machine console, you'll need to change kernel boot parameters to the `GRUB_CMDLINE_LINUX` in `/etc/default/grub`. To boot into text mode, remove the `quiet` and `splash` options and add `text` as follows:

```text
GRUB_CMDLINE_LINUX="text"
```

After making this change, update GRUB by running:

```shell
sudo update-grub
```

## Connect To Serial Console

To determine which device is being used for the serial console, run the following command:

```shell
sudo virsh dumpxml debian-virtual | grep console
```

The output will resemble the following:

```text
<console type='pty' tty='/dev/pts/1'>
```

In this example, your console device is `/dev/pts/1`. You can connect to it using tools like `screen`, `minicom`, or any other appropriate terminal application.

---

References:

* [Debian Installer Parameters](https://www.debian.org/releases/bookworm/amd64/ch05s03.en.html#installer-args)
