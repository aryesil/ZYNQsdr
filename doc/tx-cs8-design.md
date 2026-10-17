# TX complex 8-bit (cs8) mode for the LibreSDR (Z7020) target

Status: implemented and verified on a LibreSDR (see `hdl/cs8-tx/`). The rest of this
note is the original design analysis, kept as written. It was written after reading `tezuka_fw`
(main, 62183a3) and the `F5OEO/maia-sdr` fork (branch `refactor`, 9c1cd64), which
holds the FPGA project that Tezuka's bitstream is built from.

## 1. Where the FPGA design lives

`tezuka_fw` only ships prebuilt bitstreams (`board/tezuka/libre/bitstream/tezuka.xsa`).
The sources are in `maia-sdr`, branch `refactor`:

- `maia-hdl/projects/tezuka/` – Makefile, `system_project.tcl`, `system_bd.tcl`
- `maia-hdl/projects/boards/libre/` – ps7, ports, constraints, VCTCXO, XO corrector
- `maia-hdl/projects/common/` – shared Tcl/Verilog (`xilinx_ad9361.tcl`, `cs12_cs8.tcl`, ...)
- submodule `maia-hdl/adi-hdl` (ADI HDL, pinned) – not fetched yet

The Makefile expects `PROJECT_NAME=libre make all` (ip_cores, Vivado project, `install`
copies the `.xsa`). `install` currently points `DEST` at a hard-coded Linux path and
must be changed before it is used here.

## 2. How the existing RX 8-bit mode works

Files: `common/cs12_cs8mux.v`, `common/cs12_cs8.tcl`, used from `tezuka/system_bd.tcl`.

The mode is selected only by which ADC channels the host enables on the IIO device
(`cf-ad9361-lpc`). `cs12_8mux` looks at `Enable0` / `Enable1` (I and Q enables):

| Enable0 / Enable1 | Behaviour |
|---|---|
| 1 / 1 | bypass, normal 16-bit I and Q words |
| 1 / 0 | **cs8**: 12-bit I/Q reduced to 8 bit with first-order error feedback (noise shaping), saturated, packed as one 16-bit word `{Q8, I8}` on channel 0 |
| 0 / 1 | cs12: 8 samples of 12 bit packed into 6 words, sync burst inserted by `cs12_sync_frame` |

`Enable_O1/O2` drive the downstream `util_ad9361_adc_pack`, so the DMA only moves the
single 16-bit stream. `plutorx.c -o 8` does exactly this: it enables the I channel and
disables Q. No kernel change is involved; the IIO scan format stays `S16` and the host
just reinterprets the little-endian word as two bytes, I first and Q second, which is
the usual `.cs8` byte order.

Result: 2 bytes per complex sample instead of 4, i.e. about 2x sample rate over the same
link (README: 14 MHz over USB, 45 MHz over GbE).

## 3. Proposed TX counterpart

The TX path in `common/xilinx_ad9361.tcl` is:

```
axi_ad9361_dac_dma (m_axis, 64 bit) -> util_ad9361_dac_upack (util_upack2)
  -> axi_ad9361_dac_fifo (util_rfifo, 16 bit x4, clock crossing) -> axi_ad9361 dac_data_i0/q0/i1/q1
```

Add one block, `cs8_12_demux`, between the `util_upack2` read data and the `util_rfifo`
`din_data` ports (the same cut point the RX mux uses on the other side of the pack):

- Selected by the same convention as RX: only TX channel 0 (I) enabled by the host
  means cs8 mode, both enabled means the unchanged 16-bit path.
- In cs8 mode each 16-bit word from the DMA is `{Q8, I8}`. The block outputs
  `I16 = {I8, 8'h00}` and `Q16 = {Q8, 8'h00}` and asserts the Q-side enable and valid
  internally. The AD9361 DAC uses the 12 most significant bits of the 16-bit word, so
  left-aligning the int8 sample is the correct scaling, no noise shaping is needed
  (the host already quantises to 8 bit).
- The `util_rfifo`/`axi_ad9361` core still needs both `dac_enable_i0` and
  `dac_enable_q0`. The Q enable that software cleared must be forced high inside the
  block, mirroring what `Enable_O1/O2` do on the RX side. Verify against the pinned
  `adi-hdl` `util_upack2`/`axi_ad9361` sources before finalising, this is the main
  open design question.
- Per-channel instantiation for the second TX channel (`dac_data_i1/q1`) like
  `cs12_8mux_chan0/chan1`, or leave TX2 on the 16-bit path for the first version.

Why not touch the kernel: the same IIO channel set and `S16` format are used on RX
already, so TX should need no `cf_axi_dds` change. To be confirmed on hardware.

### 3.1 Correction after reading the libre build flags

The `libre` project is built with `lvds vctcxo xo_corrector txfir dac_dds dvb`
(`tezuka/system_bd.tcl`), so the TX path is not the stock one above. `common/txfir.tcl`
cuts `util_ad9361_dac_upack/fifo_rd_data_0/1` away from `axi_ad9361_dac_fifo/din_data_0/1`
and inserts `tx_fir_interpolator` (x8, switched by `up_dac_gpio_out[0]`) between them.
`common/dvb.tcl` adds the DVB-S2 encoder, `switchsrc`/`switchdest` and the
`cs12_8mux_chan*` blocks on the same DAC side. The cs8 expander therefore belongs on
`util_ad9361_dac_upack/fifo_rd_data_0/1`, in front of `tx_fir_interpolator/data_in_0/1`,
so the interpolator and the DVB switches keep seeing ordinary 16-bit I/Q. The valid/enable
rewiring that `txfir.tcl` does (`dac_fifo_valid_or`) has to be checked against it.

Build status on this machine: `adi-hdl` (cf81ab1), `dvb_fpga` and `XilinxUnisimLibrary`
submodules are fetched; a venv at `D:\codes\maia-sdr\.venv` holds Amaranth 0.5.10 so
`maia_hdl` imports; no WSL, GNU make only as `mingw32-make`.

### 3.2 What was actually found while implementing (supersedes the open question in section 3)

Reading `axi_ad9361_tx_channel.v` and the Linux `cf_axi_dds` driver showed that forcing
the Q enable inside the demux is not enough:

- `cf_axi_dds_update_scan_mode()` sets `DATA_SEL_DMA` only for channels in the active scan
  mask; every other channel is set to `DATA_SEL_DDS`.
- In `axi_ad9361_tx_channel`, `dac_enable = (datasel == DMA)` and the output mux picks
  DDS or DMA data by the same datasel. With only `voltage0` enabled, the Q0 channel
  therefore outputs the DDS, whatever the FPGA puts on `dac_data_q0`.

Implemented fix (two parts, both opt-in at build time with `CS8TX=1`):

1. `axi_ad9361` patch (`maia-hdl/patches/adi-hdl-axi_ad9361-cs8-tx.patch`, applied to the
   `adi-hdl` working tree): a new input `dac_force_dma` on `axi_ad9361_tx_channel`, driven
   for the Q0 channel by `dac_enable_i0 & ~dac_enable_q0`. It only changes the data mux;
   `dac_enable` stays as the driver set it, so the unpacker still sees one channel.
2. `common/cs8_12_demux.v` + `common/cs8_tx.tcl`: combinational block between
   `util_ad9361_dac_upack/fifo_rd_data_{0,1}` and `tx_fir_interpolator/data_in_{0,1}`,
   mode taken from `axi_ad9361_dac_fifo/din_enable_{0,1}`. `{Q8,I8}` becomes
   `I16={I8,0x00}`, `Q16={Q8,0x00}`.

`util_rfifo` writes all channels on `din_valid_in_0` and ignores the enables, and the core
drives `dac_valid_q0` regardless of enable, so no valid forcing is needed.
Behavioural testbench: `common/tb/cs8_12_demux_tb.v` (xsim, passes, all 65536 words).

Side effect to keep in mind: with the patch, "I enabled, Q disabled" no longer gives
I + DDS on Q; it means cs8, same convention as on RX.

Build notes (Windows, Vivado 2023.2):
- Run from `projects/tezuka`: `PATH=<vivado>/bin:/c/msys64/usr/bin:$PATH`, env
  `PROJECT_NAME=libre`, then `mingw32-make -o ip_cores libre.sdk/system_top.xsa`.
  Do not pass `PROJECT_NAME=` on the make command line (ADI turns it into a directory name).
- `dvb_fpga` needs its own submodules (`git submodule update --init --recursive`).
- The `maia_sdr` IP (`maia_iio_lite`) must be generated/packaged first (Amaranth + Yosys).
- Library builds fail sporadically ("Failed to load feature ipservices"); rerun.
- Baseline libre build: timing met (WNS +0.50 ns); same 63 IP instances as the shipped xsa.

## 4. Host side (gps-sim)

`backend/rf/backends/ad9361.py` / `backend/rf/transmit.py` already produce `int8` IQ
files (`quantize.cpp`). For the new mode the backend would:

1. enable only `voltage0` on `cf-ad9361-dds-core-lpc`,
2. send the interleaved `int8` I,Q bytes as the raw buffer (view as `<i2`, no
   conversion),
3. skip the current "MSB-aligned 12 bit" scaling in `TxParams.tx_scale`, because the
   FPGA does the left alignment.

Link budget for the target: 8-bit complex = 2 B/sample. USB 2.0 realistically about
35-40 MB/s (about 14 Msps as in the Tezuka README), gigabit Ethernet about 125 MB/s
raw. The multi-GNSS cases (20-25 Msps) therefore need Ethernet even in cs8 mode.

## 5. Build and test plan

1. Fetch the `adi-hdl` submodule (size not checked yet).
2. Vivado here is 2023.2 (`D:\Programs\Xiliinx\Vivado\2023.2`, note the folder spelling);
   the project is set up for 2023.1 with `IGNORE_VERSION_CHECK`. The ADI makefiles are
   bash/GNU make based, so building on Windows needs msys2 or WSL.
3. Behavioural testbench for `cs8_12_demux` (the repo already has `tb/`).
4. Baseline: rebuild the unmodified `libre` project first and diff utilisation/timing
   against the shipped `tezuka.xsa` before adding the block.
5. On hardware: loop back TX to RX with the existing RX cs8 mode and compare spectra.

## 6. Open questions

- Is the shipped `libre/bitstream/tezuka.xsa` built from this branch, or from `main`?
- Should TX also get the 12-bit packed variant (cs12), or only cs8?
- Is there a spare board for hardware tests that tolerates a bad bitstream (the README
  recommends SD boot to avoid bricking)?
