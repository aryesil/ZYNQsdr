# Release artifacts (LibreSDR, Zynq-7000 + AD9361)

Bitstreams, Vivado hardware exports and SD-card images built from this fork.
Everything here was built on 2026-10-17/18 and runs on the LibreSDR board.
Verify downloads against `SHA256SUMS` in this folder.

| Folder | What it is | Files |
|---|---|---|
| `gnss_r6/` | Newest GNSS image: FPGA GNSS signal engine (12 pipes, 250 MHz engine clock programmed from U-Boot), Tezuka firmware with `gnssctl` and the dashboard | `system_top_r6.bit` (bitstream), `r6_sdimg.zip` (SD-card boot files), `libre_gnss_r6.zip` (complete build output: SD-card files, `pluto.dfu`/`pluto.frm` firmware images, JTAG boot helpers) |
| `gnss_r4/` | Previous GNSS image (PAR bank merge, loader CE rework, WNS +0.057 ns at 250 MHz) | `system_top.bit`, `system_top.bin`, `system_top.xsa` (Vivado hardware export), `bs.bif` (bootgen description), `sdimg_gnss_r4full.zip` |
| `cs4/` | TX-only 4-bit-sample image used for the 30 Msps tests | `libre_0324_cs4_tx_top.bin`, `libre_cs4fix_tx_system_top.xsa`, `sdimg_0324_cs4.zip` |
| `cs8/` | TX-only 8-bit-sample image | `sdimg_cs8.zip` |

## Using an SD-card image

1. Format an SD card as FAT32.
2. Unzip `*_sdimg.zip` / `sdimg_*.zip` and copy the files (`BOOT.bin`, `uImage`, `devicetree.dtb`, `uramdisk.image.xz`, `uEnv.txt`, the `*.bin` bitstreams and the `overclock` file) to the card root.
3. Set the board's boot jumpers/switch for SD boot, insert the card and power up.

A bitstream `.bit` / `.bin` alone can also be loaded from a running Tezuka system
(see `update_bitstream.sh` in the repository root). The `.xsa` files are Vivado
hardware exports for rebuilding the boot image.

Transmit only into a cabled, shielded, attenuated setup.
