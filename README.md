![tezuka banner](/doc/tezuka.png)

[![Tezuka](https://github.com/F5OEO/tezuka_fw/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/F5OEO/tezuka_fw/actions/workflows/main.yml)
[![GitHub Release](https://img.shields.io/github/release/F5OEO/tezuka_fw.svg)](https://github.com/F5OEO/tezuka_fw/releases/latest)  [![Github Releases](https://img.shields.io/github/downloads/F5OEO/tezuka_fw/total.svg)](https://github.com/F5OEO/tezuka_fw/releases/latest)

> **This is a fork.** It is based on [F5OEO/tezuka_fw](https://github.com/F5OEO/tezuka_fw) (Tezuka firmware by F5OEO) and keeps its code, licence and credits. The fork (GitHub `aryesil/ZYNQsdr`, branch `feat/gnss`) adds GNSS-related work for the **LibreSDR (Zynq-7020 + AD9361)**: an FPGA GNSS signal engine image, 8-bit and 4-bit TX modes, and prebuilt release artifacts. See [This fork: LibreSDR GNSS](#this-fork-libresdr-gnss). Everything not mentioned there is upstream behaviour.

## Table of contents

- [About tezuka firmware](#about-tezuka-firmware)
- [Key Features](#key-features)
- [Hardware Matrix](#hardware-matrix)
- [This fork: LibreSDR GNSS](#this-fork-libresdr-gnss)
- [Installation : Use the SD boot mode](#installation--use-the-sd-boot-mode)
- [Configuration & Software](#configuration--software)
- [For Developers](#for-developers)
- [Credits](#credits)

## About tezuka firmware

* **Universal firmware** builder designed to unlock the full potential of your PlutoSDR/clone. 

* Built entirely for the **SDR enthusiast** community—bringing new features, wider frequency ranges, and massive performance boosts to your existing device.

* **Quick addition** of new board (already 10 boards supported)

---

## Key Features

* **Frequency Extension:** Expanded tuning range from **47.5 MHz to 6 GHz**.
* **Seamless Input Switching:** Easily switch between RX1/RX2 and TX1/TX2.
* **Extended Bandwidth:** Complex 8-bit mode unlocks stable streaming up to **14 MHz over USB** and **45 MHz over GbE network**.
* **Risk-Free Booting:** Built-in **SD Card boot support** for effortless updates with zero risk of bricking your flash memory.
* **Integrated Apps:** MQTT status publishing, fast sweep and more. The GNSS variant (`./build.sh libre_gnss`) ships without Maia-SDR and DVB-S2; it adds the `gnssctl` helper for the gnss_synth PL block (see `board/tezuka/libre/overlay_gnss`).
* **Remote Access:** Built-in WireGuard VPN, configured from the Dashboard by pasting a `wg-quick` config — no SSH/CLI needed.
* **Signal Classifier (experimental):** Onboard PSD spectral-shape matching identifies signal types live, overlaid right on the Dashboard's spectrum view. Work in progress — not yet validated on real hardware.

---

## Support the Project

This firmware is developed entirely in my free time. Maintaining multiple boards, buying hardware for testing, and adding features takes significant time and resources. If **tezuka** supercharges your SDR experience, please consider supporting the project!

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github-sponsors)](https://github.com/sponsors/F5OEO)
[![PayPal](https://img.shields.io/badge/Donate-PayPal-00457C?style=for-the-badge&logo=paypal)](https://paypal.me/f5oeodev)

*No funds? You can still support by **starring the repository** or helping improve the documentation!*

---

## Hardware Matrix

| Device Platform | Architecture | SD card | Gbe | DATV | USB Type | GPIO | Trusted vendors |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| PlutoSDR | 7010 | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | micro | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | [digikey](https://www.digikey.com/) [mouser](https://mouser.com/)|
| PlutoPlus | 7010 | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | micro | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | [OpenSdrLab](https://opensourcesdrlab.com/products/opensourcesdr-lab-pluto-sdr-ad9363-2t2r-radio-sdr-transceiver-radio-70mhz-6ghz-software-defined-radio?DIST=RkVFGVU%3D)|
| Antsdr E200 | 7020 | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | usb-c | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | [CrowdSupply](https://www.crowdsupply.com/microphase-technology/antsdr-e200)|
| Antsdr E310 | 7020 | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | usb-c | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | [Microphase](https://www.microphase.cn/)|
| Fishball/PlutoSky | 7010 | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | usb-c | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | [OpenSDRLab obsolete -> 7020](https://opensourcesdrlab.com/products/new-7020-ad9363-plutosdr?DIST=RkVFGVU%3D) [OpenSDRLab with box](https://opensourcesdrlab.com/products/opensourcesdrlab-new-7020-sdr-ad9363-for-pluto-software-defined-radio-without-pa?DIST=RkVFGVU%3D)|
| Fishball/PlutoSky | 7020 | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | usb-c | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | [OpenSDRLab](https://opensourcesdrlab.com/products/new-7020-ad9363-plutosdr?DIST=RkVFGVU%3D) [OpenSDRLab with box](https://opensourcesdrlab.com/products/opensourcesdrlab-new-7020-sdr-ad9363-for-pluto-software-defined-radio-without-pa?DIST=RkVFGVU%3D) |
| SignalSDRPro | 7020 | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | usb-3 | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | [CrowdSupply](https://www.crowdsupply.com/signalens/signalsdr-pro)|
| LibreSDR/ZynqSDR | 7020 | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | usb-c | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | [OpenSDRLab](https://opensourcesdrlab.com/products/libresdr-zynqsdr-ad9363-zynq7020?DIST=RkVFGVU%3D)|
| PlutoSky R2 | 7020 | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | usb-c | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | [OpenSDRLab](https://opensourcesdrlab.com/products/plutosky-r2?DIST=RkVFGVU%3D)|
| Pluto Nano | 7010 | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | usb-c | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | AliExpress HamGeek ?|
| PCIe SDR 7010 | 7010 | <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | Via PCIe <span><img src="https://img.shields.io/badge/-%E2%9C%93-green" alt="Yes"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | usb-c | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | [OpenSDRLab](https://opensourcesdrlab.com/products/opensourcesdrlab-pcie-version-plutosdr-ad9363-xc7z010?DIST=RkVFGVU%3D)|
| OpenSDRLab 7010 Mini | 7010 | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | usb-c | <span><img src="https://img.shields.io/badge/-%E2%9C%97-red" alt="No"></span> | [OpenSDRLab](https://opensourcesdrlab.com/products/7010-ad9363-sdr-mini?DIST=RkVFGVU%3D)|


---

## This fork: LibreSDR GNSS

Companion project: [gps-sim](https://github.com/aryesil/gps-sim), a GNSS IQ simulator whose `tezuka_gnss` transmit path drives the image described here. Transmit only into a cabled, shielded and attenuated setup; never over the air.

### What the fork adds

| Item | Where | What it is |
|---|---|---|
| `libre_gnss` board | `configs/libre_gnss_defconfig`, `boards.json`, `board/tezuka/libre/{dts_gnss,overlay_gnss}` | GNSS-only firmware variant for the LibreSDR: no Maia-SDR, no DATV, dashboard served by BusyBox `httpd` on port 80 (live data over mosquitto WebSocket, port 9001) |
| GNSS bitstream | `board/tezuka/libre/bitstream/gnss.xsa` (r4); newer builds in `releases/` | PL design with the `gs_wrap` GNSS signal engine at AXI-Lite `0x43C10000`: 12 pipes, 250 MHz engine clock (PS `FCLK2`). Sources are in the gps-sim repository (`fpga/`) and the separate `maia-sdr` project, not in this tree |
| Engine clock | `board/tezuka/libre/post-image-gnss.sh` | The checked-in `fsbl.elf` predates this design and does not start `FCLK2`; the post-image step appends a `pl_init` to the SD `uEnv.txt` that writes `FPGA2_CLK_CTRL` (250 MHz) from U-Boot. Regenerating the FSBL from `gnss.xsa` is the proper fix |
| `gnssctl` | `board/tezuka/libre/overlay_gnss/usr/sbin/gnssctl` | BusyBox `devmem` helper: `gnssctl id \| status \| enable \| disable \| cmdmode on\|off \| soft_reset \| clear` (UIO node `gnss-synth`, falls back to `0x43C10000`; ID register `0x47530001`) |
| GNSS-only Dashboard | `Dashboard/` | Only the Dashboard, Architecture and System pages remain |
| TX cs8 mode | `hdl/cs8-tx/`, `doc/tx-cs8-design.md` | Patch for the `maia-sdr` FPGA project (`CS8TX=1`): 8-bit complex TX samples when only the I channel of TX1 is enabled; 16-bit path unchanged. Over a 1 Gbit libiio link about 27-30 Msps instead of about 14 Msps |
| TX cs4 mode | `releases/cs4/` | TX-only 4-bit-sample image (`CS4TX=1` build of the FPGA project, measured up to about 42.6 Msps with the Dashboard services stopped). Only the binaries are in this repository; there is no patch for it here |
| Kernel fix | `board/tezuka/common/patches/linux/adi-6.12.y` | Fix for a swallowed error code in the `cf_axi_adc_core` debugfs `reg_access` path |
| Prebuilt artifacts | `releases/` | See below |

### Releases folder

[`releases/`](releases/) holds the bitstreams, Vivado hardware exports (`.xsa`) and SD-card image zips built from this fork, with `SHA256SUMS`; [`releases/README.md`](releases/README.md) describes each file and lists the checksums.

| Folder | Content |
|---|---|
| `releases/gnss_r6/` | Newest GNSS image: `system_top_r6.bit`, `r6_sdimg.zip` (SD-card files), `libre_gnss_r6.zip` (complete build output) |
| `releases/gnss_r4/` | Previous GNSS image (`system_top.bit/.bin/.xsa`, `bs.bif`, `sdimg_gnss_r4full.zip`); `system_top.xsa` is the same file as the in-tree `gnss.xsa` |
| `releases/cs4/` | TX-only 4-bit-sample image |
| `releases/cs8/` | TX-only 8-bit-sample image |

Verify a download, from the `releases/` folder: `sha256sum -c SHA256SUMS`.

### Using the GNSS image

1. Copy the contents of the SD-card zip (`r6_sdimg.zip` for the newest image) to a FAT32 card as described in [Installation](#installation--use-the-sd-boot-mode); boot the board from it.
2. The firmware's default address is `192.168.2.1` (`ipaddr` in `uboot-env.txt`; gps-sim defaults to `ip:192.168.3.1`, so set its `DEVICE_URI` or the board's address to match); the root password is set to `analog` in the defconfig. Check the engine with `gnssctl id` (expects `0x47530001`) and `gnssctl status`.
3. gps-sim's `tezuka_gnss` kind reaches the engine with `ssh root@<board>` plus `devmem`; install your public key and run `device_persistent_keys` on the board so it survives a reboot (the root filesystem is a RAM disk, and a reflash removes the key).

Background services of the Dashboard (`api_controller.sh`, `mqtt_pubd`, `pluto_stream`) load the dual Cortex-A9 and lower the achievable libiio TX rate; stop them for link-rate tests (the Dashboard stops working while they are down).

### Frequency reference

* `gpsdo_boot.sh` (libre overlay, contributed upstream by SV1EIA) disciplines the VCTCXO to an external 10 MHz reference within seconds of boot. With a reference connected, the sender must not apply an `xo_correction` (gps-sim: `xo_ppm` = 0).
* Without a reference the uncalibrated TX crystal of the test board was about +3.5 ppm fast; gps-sim can correct this with its `xo_ppm` setting, which writes the AD9361 `xo_correction`.
* `libresdr-tx-nco` is the optional fixed-TCXO NCO controller, see [board/tezuka/libre/README-tx-nco.md](board/tezuka/libre/README-tx-nco.md).

### Building the fork's images

```bash
./getbuildroot.sh                    # once
./build.sh libre_gnss                # GNSS image -> output/libre_gnss/images, build/libre_gnss.zip
./build.sh libre                     # Maia-SDR image (libre_maiasdr_defconfig)
```

`libre_gnss` uses the `gnss` FPGA project, i.e. `board/tezuka/libre/bitstream/gnss.xsa`. To use a newer bitstream, replace that file and re-extract it; Buildroot's `board-fpga` package does not extract a changed `.xsa` again until `output/libre_gnss/build/board-fpga-1.0` is deleted. The GNSS bitstream is built outside this repository with `maia-sdr/build_gnss.sh`; the Vivado IP cache can reuse a stale `gs_wrap` synthesis, so check the run log after an RTL change.

### Known limitations

* The `libre_gnss` image has not been tested on boards other than the LibreSDR; `fsbl.elf` still lacks the `FCLK2` setup (handled by `uEnv.txt` for SD boot only).
* The r6 image in `releases/gnss_r6/` is not yet the bitstream in `board/tezuka/libre/bitstream/` (that is r4).
* In gps-sim the FPGA path does not support fading, and a constant 16-block engine underrun can appear early in a run at 30.72 Msps and above (cause open); see the gps-sim README.
* The classifier and the other Dashboard pages removed in the GNSS variant are not available in this fork's Dashboard.

---

## Installation : Use the SD boot mode

 **CRITICAL: DO NOT use the standard `frm` flashing method. To prevent bricking, always boot via SD card mode unless you know what you are doing.**

1. Go to the [Releases Section](https://github.com/F5OEO/tezuka_fw/releases) (upstream boards). For the LibreSDR GNSS images of this fork use the [`releases/`](releases/) folder instead.
2. Download and unzip the specific package matching your hardware configuration.
3. Format a fresh SD Card to **FAT32**.
4. Copy the entire contents of the **`sdimg`** folder onto the root of the SD Card.
5. Insert into your board and power on.

***Only for original PlutoSDR (No SD Slot):*** Follow the [official ADI flashing procedure](https://wiki.analog.com/university/tools/pluto/users/firmware) using the `pluto.frm` file.

---

## Configuration & Software

Once booted, the firmware exposes a USB drive containing `config.txt`. Modify this file to tweak your settings (based on standard [ADI customization parameters](https://wiki.analog.com/university/tools/pluto/users/customizing)).

### Compatible Software
Enjoy extra features out-of-the-box with custom-tailored software branches:
* [SatDump](https://github.com/F5OEO/SatDump)
* [SDR++](https://github.com/F5OEO/SDRPlusPlus)
* [SoapyPlutoPAPR](https://github.com/F5OEO/SoapyPlutoPAPR)
*(Standard apps like SDRConsole and SDRAngel are also compatible).*

### Remote Access (WireGuard VPN)

Connect your board to a remote WireGuard server for secure remote access, configured entirely from the Dashboard — no SSH/CLI needed:

* Open the Dashboard's **Network** tab and find the **VPN (WireGuard)** card.
* Paste a complete `wg-quick`-style config (`[Interface]`/`[Peer]` blocks, private key included) into the text box and click **Save & apply**.
* Toggle **Enabled** to bring the tunnel up. Live status (handshake time, transfer, peer public key) is shown on the same card.
* Routing follows whatever `AllowedIPs` your config specifies — a scoped value gives split-tunnel access to just that network, while `0.0.0.0/0` routes all device traffic through the tunnel.

**Security note:** the pasted config is sent once and never redisplayed or echoed back over MQTT. That said, the Dashboard's default MQTT channel (port 9001) is unauthenticated on the local network by design, same as every other Dashboard control — treat the WireGuard private key like any other credential on an open network segment, and avoid exposing the device's management interface to untrusted networks.

### Signal Classifier (experimental, work in progress)

> **Fork note:** the Dashboard sources in this fork were trimmed to the GNSS pages (commit `bcb72bb`; see `Dashboard/CLAUDE.md`), so the classifier page described here is not part of this fork's Dashboard. The text below is the upstream description.

> **Status:** experimental. The pipeline is cross-compiled and exercised under `qemu-arm-static`, and the correlation math is unit-tested directly, but it has not yet been run end-to-end against a real signal on real hardware — see [Known limitations](#known-limitations) below before relying on it for anything.

Onboard PSD spectral-shape matching — identifies signal *types* (OFDM, FSK, chirp, CW, etc.) live and overlays a label on the spectrum, right on the device, no host-side processing required.

**How it works:** a small daemon (`app/classifier/classifier.c`) connects as a WebSocket client to `maia-httpd`'s existing `/waterfall` feed — the same live FFT the Spectrum and Radio Astronomy pages already consume — and correlates each frame against a set of loaded templates roughly once a second, publishing the best match over MQTT. It never touches the raw-IQ path (`iio_ws_proxy`), so it adds no new consumer of the ADC and never competes with IQ Tape or the Signal Generator. This is spectral-*shape* matching (magnitude/PSD cosine similarity), not true cyclostationary SCF — it separates signal families well but won't reliably distinguish modulation order within a family (e.g. BPSK vs. QPSK), since that distinction lives in phase information this feed doesn't carry.

**Sample rate:** no special sample rate is required — the daemon adapts to whatever bin count `/waterfall` is currently emitting. One real caveat: matching is relative-bin shape correlation, not Hz-normalized, so a template captured (or synthesized) at one span will transfer poorly to classifying live at a very different span. Build templates at roughly the span you plan to classify at.

**Using it:**

* Open the Dashboard's **Signal Classifier** page (under RF) and toggle **Enabled** — it runs as a background service from then on.
* A matched signal gets a label chip (e.g. "OFDM · 92%") overlaid on its own live spectrum view, plus a "Reference match" panel and a scrolling log of recent classifications. Below the confidence threshold, or with no templates loaded, it reports "unknown" rather than forcing a guess.
* Ships with a small starter set out of the box (FM broadcast, DAB+, CW/beacon — synthesized canonical shapes, seeded on first boot) so there's something to test against immediately. Build your own with `tools/classifier_templates/` — either `capture_from_device.py` (pulls a shape straight off a live device, no GNU Radio/TorchSig required) or `synthesize_template.py` (idealized canonical shapes for classes you can't easily capture yet) — and push the result the same way a WireGuard config is sent: base64 over MQTT (`cmd/classifier/templates`), which replaces the starter set permanently.

The same page also shows a **band plan** — a color-coded strip under the spectrum marking known allocations (broadcast, cellular, aviation, maritime, etc.), independent of whether the classifier has actually matched anything there. Click a swatch (or a row in the editable table below it) to tune to that frequency. Entries are stored on the device (`/mnt/jffs2/bandplan.json`, seeded from a starting reference table) and edited directly from the Dashboard — add, edit, or remove entries and hit **Save**.

#### Known limitations

* **Not yet validated on real hardware.** Everything so far is cross-compiled and run under `qemu-arm-static`, plus unit tests on the correlation math — the full `/waterfall` → correlate → MQTT → Dashboard path hasn't had a live-signal pass yet.
* The "Reference match" panel currently shows the live captured shape only, labeled with the matched template's name — it doesn't overlay the stored template curve itself, since the raw template data lives only in the daemon's binary file and isn't published to the Dashboard.
* PSD shape matching won't distinguish modulation order within a family (see above).

---

## For Developers

### Setup Environment (Debian/Ubuntu)
```bash
# Install mandatory dependencies
sudo apt install pkg-config libssl-dev libclang-dev jq

# Clone the repository & pull Buildroot
git clone [https://github.com/F5OEO/tezuka_fw](https://github.com/F5OEO/tezuka_fw)
cd tezuka_fw
./getbuildroot.sh


```
### Build
```bash
# Build a single board (each board gets its own output directory):
./build.sh fishball

# Build multiple boards:
./build.sh pluto plutoplus fishball

# Build all boards:
./build.sh all

# Build with parallel jobs and clean output first:
./build.sh -j8 -c fishball
```

Or build manually using Buildroot directly:
```bash
source sourceme.first
cd buildroot
make pluto_maiasdr_defconfig && make
```

For a list all supported boards run:
```bash
./build.sh -h
```

### Building on WSL2 
Buildroot does not allow whitespaces in the PATH environment variable. On WSL several paths with whitespaces are added. The following script can be used to remove any path with whitespaces. It also deletes any leftover ':' at the end:
```bash
export PATH=$(echo $PATH | tr ':' '\n' | grep -v ' ' | tr '\n' ':' | sed 's/:$//')
```
### Compatibility with older build scripts

If you encounter errors related to CMAKE policy version, it's because newer versions of CMAKE (3.27+) have stricter policy requirements. Setting CMAKE_POLICY_VERSION_MINIMUM=3.5 tells CMAKE to use policies from version 3.5 or newer, which helps maintain compatibility with older build scripts and dependencies that may not be fully compatible with the latest CMAKE policies. This is particularly important when building packages that haven't been updated to support newer CMAKE versions.

Run the build with:

```bash
CMAKE_POLICY_VERSION_MINIMUM=3.5 make
```

### Result
All materials are in buildroot/output/images

# Credits
- F5OEO and contributors for the Tezuka firmware this fork is based on (https://github.com/F5OEO/tezuka_fw)
- Christos Nikolaou (SV1EIA) for the LibreSDR `gpsdo_boot.sh` external-reference acquisition
- Daniel Estévez for incredible maia-sdr project (https://maia-sdr.org/)
- Gwenhael Goavec-Merou for inspiration https://github.com/oscimp/PlutoSDR
- LamaBleu for helping me with buildroot and introduce me Plutosdr
- https://github.com/hz12opensource/libresdr for overclock and fpga inspiration
- All the opensource community !
