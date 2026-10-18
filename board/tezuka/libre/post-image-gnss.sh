#!/bin/sh
# GNSS image: the engine clock of gs_wrap is PS FCLK2 (250 MHz, IO PLL 1000 MHz / 2 / 2).
# The checked-in fsbl.elf (bitstream/fsbl.elf) predates the tezuka_gnss design and does
# not program FPGA2_CLK_CTRL (0xF8000190). Until the FSBL is regenerated from gnss.xsa
# (Vitis, create_fsbl_project.tcl), U-Boot sets it in pl_init, which runs before the
# kernel boots. Appended to uEnv.txt, imported by U-Boot on SD boot (last definition wins).
set -e
BIN_DIR="$1"
cat >> "$BIN_DIR/sdimg/uEnv.txt" <<'EOT'

pl_init=\
  echo "Initializing PL infrastructure..."; \
  mw 0xF8000008 0xDF0D; \
  mw 0xF8000900 0x0000000F; \
  mw 0xF8000240 0x00000000; \
  mw 0xF8000190 0x00200200; \
  mw 0xF8000004 0x767B; \
  echo "PL level shifters and clocks enabled (FCLK2 250 MHz)";
EOT
