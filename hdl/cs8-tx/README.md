# TX complex 8-bit (cs8) FPGA mode for the LibreSDR

The Tezuka bitstream is built from `F5OEO/maia-sdr`, not from this tree (this tree only ships
the prebuilt `.xsa`). `0001-maia-sdr-tezuka-cs8-tx.patch` is the change that adds an opt-in
TX cs8 mode to that FPGA project. It is a `git format-patch` of one commit on top of
`F5OEO/maia-sdr` branch `refactor` (9c1cd64).

## What it does

When the host enables only the I channel of TX1 on the DDS core (`voltage0`), every 16-bit
DMA word is `{Q8, I8}` (I in the low byte, the usual `.cs8` order). A new module,
`cs8_12_demux`, sits between `util_ad9361_dac_upack` and the TX interpolator and expands it to
two 16-bit samples, left aligned (the AD9361 DAC uses the 12 MSBs). With both channels
enabled it is a bypass, so the stock 16-bit path is unchanged. The mode needs no kernel change.

The change has two parts:

- `maia-hdl/projects/common/cs8_12_demux.v`, `cs8_tx.tcl` and a testbench (`tb/`), wired in from
  `projects/tezuka/system_bd.tcl` and `common/xilinx_init.tcl`. It is only inserted when the
  project is built with `CS8TX=1`.
- `maia-hdl/patches/adi-hdl-axi_ad9361-cs8-tx.patch`, a patch to the pinned `adi-hdl` submodule
  (`axi_ad9361_tx.v`, `axi_ad9361_tx_channel.v`) that forces the Q0 channel to the DMA source
  when only I0 is enabled. Apply it inside `maia-hdl/adi-hdl` before building.

## Building

```sh
git clone -b refactor https://github.com/F5OEO/maia-sdr && cd maia-sdr
git am /path/to/0001-maia-sdr-tezuka-cs8-tx.patch
git -C maia-hdl/adi-hdl apply ../patches/adi-hdl-axi_ad9361-cs8-tx.patch
cd maia-hdl/projects/tezuka && CS8TX=1 PROJECT_NAME=libre make
```

No bitstream binary is committed here. The `libre` bitstream this tree ships is still the
stock 16-bit one; swap in the cs8 `.xsa` when building firmware for this mode.

## Results (LibreSDR, Z7020)

Used by the `gps-sim` GNSS simulator (`kind: tezuka`, 16-bit up to 10 Msps and cs8 above). Over a
1 Gbit libiio link the stock 16-bit path sustains about 14 Msps, cs8 about 27-30 Msps (both
limited by the dual Cortex-A9 handling TCP receive and `iiod`, not by the FPGA). The simulator
tracked GPS, Galileo and BeiDou satellites with a stable fix over cs8 at 20 Msps.
