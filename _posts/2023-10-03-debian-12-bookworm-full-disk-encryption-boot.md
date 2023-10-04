---
layout: post
title: "Full Disk Encryption in Debian 12 Bookworm, Including Boot with LVM"
tagline: "No-nonsense step-by-step guide to Debian 12 Bookworm full disk encryption with LVM."
toc: true
tags:
  - Debian
  - Debian 12 Bookworm
  - Encryption
  - LUKS
  - LVM
  - boot
  - UEFI
---

## What You Get In The End

* A fully encrypted drive (including `/boot`, except for the UEFI partition) with LVM set up.
* You will only need to enter your password **once** during boot to unlock your encrypted drive.

## Prerequisites

* A UEFI-ready system.
* Bootable Debian 12 Bookworm net installation media.
* An empty drive for installation.

## Base System Installation

1. Boot from the Debian net installation image.
2. Select 'Expert install' under the 'Advanced' menu item.

I won't describe all the installation steps since everything is quite self-explanatory. Proceed to the disk partition phase.

## Partition Disks

Detect disks:

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/01.png" class="lb"><img loading="lazy" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/01.png" alt="Detect disks"></a>

Open partition disks menu:

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/02.png" class="lb"><img loading="lazy" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/02.png" alt="Partition disks"></a>

Select 'Manual':

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/03.png" class="lb"><img loading="lazy" alt="Manual disks partition" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/03.png"></a>

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/04.png" class="lb"><img loading="lazy" alt="Disks partition menu" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/04.png"></a>

Let's suppose the disk we will use for installation is `/dev/sda`. If you are using a different disk, please replace `/dev/sda` with your actual drive.

Select `/dev/sda` and create a new `GPT` partition table on it.

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/05.png" class="lb"><img loading="lazy" alt="Create new partition table" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/05.png"></a>

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/06.png" class="lb"><img loading="lazy" alt="Create new partition table" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/06.png"></a>

Next, create a small EFI partition at the beginning of the drive, with a size of up to 500MB to support UEFI boot.

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/07.png" class="lb"><img loading="lazy" alt="EFI partition" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/07.png"></a>

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/08.png" class="lb"><img loading="lazy" alt="EFI partition" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/08.png"></a>

Now, let's create an encrypted volume using all the remaining free space. This includes encrypting `/boot`, which will also reside on LVM.

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/09.png" class="lb"><img loading="lazy" alt="Encrypted volume" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/09.png"></a>

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/10.png" class="lb"><img loading="lazy" alt="Encrypted volume selection" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/10.png"></a>

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/11.png" class="lb"><img loading="lazy" alt="Encrypted volume settings" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/11.png"></a>

Apply the changes and wait for a moment while the installer erases the drive before proceeding with encryption. You will be prompted to enter a passphrase during this process.

Time to configure LVM.

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/12.png" class="lb"><img loading="lazy" alt="LVM" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/12.png"></a>

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/13.png" class="lb"><img loading="lazy" alt="Create volume group" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/13.png"></a>

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/14-0.png" class="lb"><img loading="lazy" alt="Select encrypted partition for volume group" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/14-0.png"></a>

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/14-1.png" class="lb"><img loading="lazy" alt="Set volume group name" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/14-1.png"></a>

Create logical volumes.

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/15.png" class="lb"><img loading="lazy" alt="Set up logical volumes" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/15.png"></a>

You can customize the configuration to suit your specific needs. For my setup, I created the following logical volumes:

* `/boot`: Formatted with the ext2 filesystem.
* `/root`: Formatted with the ext4 filesystem.
* `/home`: Formatted with the ext4 filesystem.
* `/tmp`: Formatted with the ext2 filesystem.
* I didn't create a swap partition. If you require one, you can create another logical volume for it.

As a result, my disk configuration looks like this:

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/16.png" class="lb"><img loading="lazy" alt="Set up logical volumes" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/16.png"></a>

If everything appears to be in order, write the changes to the disk.

Proceed to install the base system, configure APT, and install the required packages.

## Bootloader Installation

**Do not** install GRUB from the installation menu. You will encounter an error in any case:

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/18.png" class="lb"><img loading="lazy" alt="GRUB installation error" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/18.png"></a>

Also, please note that installing GRUB may potentially lead to UEFI boot errors. To avoid this, simply skip the GRUB installation step and select 'Execute a shell' from the installer menu:

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/19.png" class="lb"><img loading="lazy" alt="Execute a shell" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/19.png"></a>

## Chroot into the Installed System

The new system root is located under `/target`. To continue, we need to chroot into it:

```shell
cd /target
mount --bind /dev dev/
mount --bind /sys sys/
mount --bind /proc proc/
mount --bind /dev/pts dev/pts
mount --bind /cdrom media/cdrom
chroot . bin/bash
```

Mount EFI partition `/dev/sda1`:

```shell
mount /dev/sda1 /boot/efi
```

## GRUB Installation

Install GRUB first (recall that we skipped this step previously):

```shell
apt install grub-efi
```

Retrieve the UUID of the encrypted drive (`/dev/sda2` in my case):

```shell
blkid -o value -s UUID /dev/sda2
```

Let's assume the UUID of our crypto disk is as follows (I will use this UUID in the instructions below):

```text
75f02227-8804-40d6-ad0b-7c0bc9125c49
```

Open GRUB configuration:

```shell
nano /etc/default/grub
```

And add the following:

```text
GRUB_CMDLINE_LINUX="cryptdevice=UUID=75f02227-8804-40d6-ad0b-7c0bc9125c49:lvm"
GRUB_ENABLE_CRYPTODISK=y
```

Generate GRUB config:

```shell
grub-mkconfig -o /boot/grub/grub.cfg
```

Install GRUB:

```shell
grub-install --target=x86_64-efi --boot-directory=/boot --efi-directory=/boot/efi --removable
```

If the installation was successful, the output should be as follows:

```text
Installing for x86_64-efi platform.
Installation finished. No error reported.
```

## Convert LUKS Key

I'm not entirely certain if this step is necessary, but I encountered some boot issues when omitting it.

```shell
cryptsetup luksConvertKey --pbkdf pbkdf2 /dev/sda2
```

Some people have suggested that LUKS v2 is not supported by the current version of GRUB and that it needs to be downgraded to LUKS v1 (see references in the end of the article). However, in my experience, this is not the case. I successfully booted the system from a LUKS v2 encrypted drive with no issues.

## Finish Installation

During the installation, the installer will prompt you about the bootloader. Select 'Continue without bootloader' and confirm this choice since you've already installed it.

<a href="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/20.png" class="lb"><img loading="lazy" alt="Continue without bootloader" src="/assets/images/posts/2023-10-03-debian-12-bookworm-full-disk-encryption-boot/20.png"></a>

Then reboot and load your freshly installed operating system. During the first boot, you will need to enter your password twice.

## Add Keyfile

To avoid entering your password twice, you can add a keyfile to a new LUKS key slot and instruct the system to use it for unlocking the encrypted disk during boot.

Generate a keyfile from random data:

```shell
sudo dd bs=512 count=8 if=/dev/urandom of=/keyfile iflag=fullblock
```

Add key to our crypto disk:

```shell
sudo cryptsetup luksAddKey /dev/sda2 /keyfile
```

Change permissions (even `root` doesn't need any permissions to access keyfile):

```shell
sudo chmod 000 /keyfile
sudo chmod -R g-rwx,o-rwx /boot
```

Additionally, you have the option to make `/boot` mounted as read-only at a later stage.

Now modify `/etc/crypttab` and replace `none` with the keyfile path (`/keyfile`) and specify the key slot it occupies (`key-slot=1`):

```text
sda2_crypt UUID=75f02227-8804-40d6-ad0b-7c0bc9125c49 /keyfile luks,discard,key-slot=1
```

## Initramfs

Modify `/etc/cryptsetup-initramfs/conf-hook`:

```shell
sudo nano /etc/cryptsetup-initramfs/conf-hook
```

With:

```text
KEYFILE_PATTERN="/keyfile"
```

In `/etc/initramfs-tools/initramfs.conf`, set `UMASK` to restrict access to root-only, preventing the key from being leaked:

```shell
echo UMASK=0077 | sudo tee --append /etc/initramfs-tools/initramfs.conf
```

Generate new initramfs image:

```shell
sudo update-initramfs -u -k all
```

Verify that the image has the restrictive permissions:

```shell
stat -L -c "%A  %n" /initrd.img
```

Output should be:

```text
-rw-------  /initrd.img
```

And includes the key:

```shell
sudo lsinitramfs /initrd.img | grep "^cryptroot/keyfiles/"
```

Output should be:

```text
cryptroot/keyfiles/sda2_crypt.key
```

That's it. After rebooting, you will only need to enter your password once.

---

References:

* [Full disk encryption with LUKS (including /boot)](https://www.pavelkogan.com/2014/05/23/luks-full-disk-encryption/)
* [Full disk encryption (including boot) on Debian Bookworm](https://www.dwarmstrong.org/fde-debian/)
* [Full disk encryption, including /boot: Unlocking LUKS devices from GRUB](https://cryptsetup-team.pages.debian.net/cryptsetup/encrypted-boot.html)
* [GRUB Bootloader with root LUKS encryption: only grub shell](https://superuser.com/questions/1536669/grub-bootloader-with-root-luks-encryption-only-grub-shell)
* [grub-probe: error: failed to get canonical path of /cow](https://unix.stackexchange.com/questions/96977/grub-probe-error-failed-to-get-canonical-path-of-cow)
