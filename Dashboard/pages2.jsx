// pages2.jsx — Versions, Network, Calibrate, Diagnostic, Reboot, Operator, Kalibrate, Persistent, GPIO, Performance, GPS, Reference Clock
const { useState: useS2, useEffect: useE2, useRef: useR2 } = React;

function Versions({ ver }) {
  const rows = [
    ["Tezuka", ver.tezuka, "Application firmware", "ok"],
    ["Linux kernel", ver.linux, "armv7l GNU/Linux · 2 cores", "ok"],
    ["U-Boot", ver.uboot, "Bootloader", "ok"],
    ["FPGA bitstream", ver.fpga, "AD9363 RF fabric", "ok"],
    ["Root FS", ver.rootfs, "Read-only squashfs", "ok"],
    ["libiio", ver.iio, "IIO library", "neutral"],
  ];

  const [checkState, setCheckState] = useS2('idle'); // idle | checking | ok | error
  const [latestTag, setLatestTag] = useS2(null);
  const [checkError, setCheckError] = useS2('');
  const [lastChecked, setLastChecked] = useS2(null);

  // ver.tezuka is "tezuka-$(git describe --tags)" (see post-build.sh /
  // S23udc) — strip the prefix so it lines up with GitHub's tag_name
  // (e.g. "v0.3.141592653"). A build made after the last tag will carry a
  // "-N-gHASH" suffix from git describe, so an exact-match check correctly
  // reports "update available" for that case too (rather than falsely
  // claiming up to date), it just can't tell "ahead of" from "behind".
  const currentTag = (ver.tezuka || '').replace(/^tezuka-/, '');
  const isUpToDate = latestTag != null && currentTag === latestTag;

  const checkForUpdates = async () => {
    setCheckState('checking');
    setCheckError('');
    try {
      const res = await fetch('https://api.github.com/repos/F5OEO/tezuka_fw/releases/latest');
      if (!res.ok) throw new Error(`GitHub API returned HTTP ${res.status}`);
      const data = await res.json();
      setLatestTag(data.tag_name || null);
      setLastChecked(new Date());
      setCheckState('ok');
    } catch (e) {
      setCheckError(e.message || 'Network error');
      setCheckState('error');
    }
  };

  return (
    <div className="page">
      <div className="grid-12">
        <Card title="Platform" className="span-5">
          <div className="platform">
            <div className="plat-badge"><Icon name="chip" size={26} /></div>
            <div>
              <h3>{ver.model}</h3>
              <span className="mono dim">{ver.serial}</span>
            </div>
          </div>
        </Card>

        <Card title="Firmware components" sub="Each part carries its own version" className="span-7" pad={false}>
          <table className="ver-table">
            <thead><tr><th>Component</th><th>Version</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {rows.map(([n, v, note, tone]) => (
                <tr key={n}>
                  <td className="vt-name">{n}</td>
                  <td className="mono vt-ver">{v}</td>
                  <td className="dim">{note}</td>
                  <td><Pill tone={tone} dot>{tone === "ok" ? "current" : "info"}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Update" sub="Check github.com/F5OEO/tezuka_fw for a newer release" className="span-12">
          <div className="update-row">
            <div className="up-status">
              {checkState === 'idle' && <Pill tone="neutral" dot>Not checked yet</Pill>}
              {checkState === 'checking' && <Pill tone="neutral" dot>Checking…</Pill>}
              {checkState === 'error' && <Pill tone="warn" dot>Check failed</Pill>}
              {checkState === 'ok' && <Pill tone={isUpToDate ? 'ok' : 'warn'} dot>{isUpToDate ? 'Up to date' : 'Update available'}</Pill>}
              <span className="dim">
                {checkState === 'error' && checkError}
                {checkState === 'ok' && !isUpToDate && `Latest ${latestTag} · running ${currentTag || '—'}`}
                {checkState === 'ok' && isUpToDate && `Running ${currentTag}`}
                {checkState === 'ok' && lastChecked && ` · checked ${lastChecked.toLocaleTimeString()}`}
              </span>
            </div>
            <div className="ab-btns">
              <button className="btn ghost" onClick={checkForUpdates} disabled={checkState === 'checking'}>
                <Icon name="refresh" size={15} />{checkState === 'checking' ? 'Checking…' : 'Check for updates'}
              </button>
              <a className="btn ghost" href="https://github.com/F5OEO/tezuka_fw/releases/latest" target="_blank" rel="noopener noreferrer">
                <Icon name="upload" size={15} />View releases
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---- Network --------------------------------------------------------------
function Network({ d }) {
  const [tab, setTab] = useS2("usb");
  const net = d.net || {};
  const iface = tab === "usb" ? "usb0" : tab === "lan" ? "eth0" : null;
  const ip   = (iface && net[`${iface}/ip`])   || '—';
  const mask = (iface && net[`${iface}/mask`]) || '—';
  const mac  = (iface && net[`${iface}/mac`])  || '—';
  const gw   = net['gateway']  || '—';
  const dns  = net['dns']      || '—';
  const host = net['hostname'] || '—';

  // VPN (WireGuard) — vpnConf is a write-only local buffer: it is sent once
  // as base64 over cmd/vpn/config and cleared, and is never populated from
  // any state/ topic (the private key must never round-trip through MQTT).
  const [vpnOn, setVpnOn] = useS2(false);
  const [vpnConf, setVpnConf] = useS2('');
  useE2(() => { if (d.vpnEnabled != null) setVpnOn(d.vpnEnabled === 'on'); }, [d.vpnEnabled]);
  const vpnStatus = d.vpnStatus;

  return (
    <div className="page">
      <div className="grid-12">
        <Card title="Network interface" className="span-7">
          <div className="tabs">
            {[["lan", "LAN"], ["wifi", "Wi-Fi"], ["usb", "USB"]].map(([k, l]) => (
              <button key={k} className={tab === k ? "tab-on" : ""} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          <div className="form-grid mt">
            <Field label="IP address"><TextInput value={ip} onChange={() => {}} /></Field>
            <Field label="Subnet mask"><TextInput value={mask} onChange={() => {}} /></Field>
            <Field label="Gateway"><TextInput value={gw} onChange={() => {}} /></Field>
            <Field label="DNS"><TextInput value={dns} onChange={() => {}} /></Field>
            <Field label="MAC"><TextInput value={mac} onChange={() => {}} /></Field>
            <Field label="Hostname"><TextInput value={host} onChange={() => {}} /></Field>
          </div>
        </Card>

        <div className="span-5 tile-stack">
          <Card title="MQTT broker">
            <div className="form-grid">
              <Field label="Host"><TextInput value={ip !== '—' ? ip : '—'} onChange={() => {}} /></Field>
              <Field label="Port"><TextInput value="1883" onChange={() => {}} /></Field>
            </div>
            <Field label="Base topic"><TextInput value="state/#" onChange={() => {}} /></Field>
            <div className="mqtt-status"><Pill tone={d.mqtt ? "ok" : "warn"} dot>{d.mqtt ? "Connected" : "Offline"}</Pill><span className="dim mono">{d.mqttHost || '—'}</span></div>
          </Card>
        </div>

        <Card title="System &amp; throughput" sub="Load &amp; temperature (left) · data rate (right)" className="span-12"
          right={<div className="legend"><span><i style={{ background: "var(--accent)" }} />CPU %</span><span><i style={{ background: "var(--c-blue)" }} />Mem %</span><span><i style={{ background: "var(--ok)" }} />SoC °C</span><span><i style={{ background: "var(--c-coral)" }} />FPGA °C</span><span><i style={{ background: "var(--c-purple)" }} />RX B/s</span><span><i style={{ background: "var(--c-pink)" }} />TX B/s</span></div>}>
          <StreamChart maxY={100} rightMax={5000000} unit="" grid={5} height={260} fmt={(v) => v.toFixed(0)}
            series={[
              { data: d.cpuH, color: "var(--accent)", label: "CPU", unit: "%" },
              { data: d.memH, color: "var(--c-blue)", label: "Memory", unit: "%" },
              { data: d.tempH, color: "var(--ok)", label: "SoC temp", unit: "°C" },
              { data: d.fpgaH, color: "var(--c-coral)", label: "FPGA temp", unit: "°C" },
              { data: d.rxH, color: "var(--c-purple)", label: "RX rate", unit: " B/s", axis: "right" },
              { data: d.txH, color: "var(--c-pink)", label: "TX rate", unit: " B/s", axis: "right" },
            ]} />
        </Card>

        <Card title="VPN (WireGuard)" sub="Paste a wg-quick config to connect" className="span-12">
          <Field label="Enabled">
            <Toggle on={vpnOn} onChange={(on) => { setVpnOn(on); d.publish('vpn/enabled', on ? 'on' : 'off'); }} />
          </Field>
          <Field label="Config (wg-quick .conf)" hint="Sent once when you click Save & apply — never redisplayed afterward">
            <TextArea rows={10} value={vpnConf} onChange={setVpnConf}
              placeholder={"[Interface]\nPrivateKey = ...\nAddress = ...\n\n[Peer]\nPublicKey = ...\nEndpoint = ...\nAllowedIPs = ..."} />
            <button className="btn primary mt" disabled={!vpnConf.trim()}
              onClick={() => { d.publish('vpn/config', btoa(unescape(encodeURIComponent(vpnConf)))); setVpnConf(''); }}>
              Save &amp; apply
            </button>
          </Field>
          <Field label="Status">
            <Pill tone={vpnStatus?.up ? "ok" : "warn"} dot>{vpnStatus?.up ? "Connected" : "Disconnected"}</Pill>
            {vpnStatus && (
              <span className="dim mono">
                {' '}handshake {vpnStatus.latest_handshake ? new Date(vpnStatus.latest_handshake * 1000).toLocaleTimeString() : "never"}
                {' · rx '}{vpnStatus.rx_bytes ?? 0}{' · tx '}{vpnStatus.tx_bytes ?? 0}
                {vpnStatus.pubkey && <>{' · pubkey '}{vpnStatus.pubkey}</>}
              </span>
            )}
          </Field>
        </Card>
      </div>
    </div>
  );
}

// ---- Calibration ----------------------------------------------------------

const GAIN_CURVE = (() => {
  const pts = [];
  const f0 = 47, f1 = 6000, N = 56;
  for (let i = 0; i <= N; i++) {
    const f = f0 + ((f1 - f0) / N) * i;
    const norm = (f - f0) / (f1 - f0);
    const g = 13.5 - 4.2 * norm - 3.6 * norm * norm + 1.3 * Math.sin(norm * 8.5) + 0.7 * Math.sin(norm * 21) + (Math.random() - 0.5) * 0.35;
    pts.push({ x: f, y: g });
  }
  return pts;
})();

const DAC_CURVE = (() => {
  const pts = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const a = (100 / N) * i;          // amplitude, % of full scale
    const norm = a / 100;
    // near-linear gain that compresses as amplitude approaches full scale
    const g = 9.6 - 3.4 * Math.pow(norm, 3.2) - 0.6 * norm + 0.25 * Math.sin(norm * 16) + (Math.random() - 0.5) * 0.18;
    pts.push({ x: a, y: g });
  }
  return pts;
})();

const TCXO_HZ = 40000000;
const ppmToFreqCorr = (ppm) => Math.round(TCXO_HZ + ppm * TCXO_HZ / 1e6);
const freqCorrToPpm = (hz) => (hz - TCXO_HZ) / (TCXO_HZ / 1e6);

function Calibrate({ d, navigate }) {
  const [freqCalOn, setFreqCalOn] = useS2(true);
  const [ppm, setPpm] = useS2(0);
  const [ppmStr, setPpmStr] = useS2('0.00');
  const [curve, setCurve] = useS2(GAIN_CURVE);
  const [gainDirty, setGainDirty] = useS2(false);
  const [dac, setDac] = useS2(DAC_CURVE);
  useE2(() => {
    if (d.gainTableConfig && d.gainTableConfig.length) {
      setCurve(d.gainTableConfig.map(({ freq, gain }) => ({ x: freq, y: gain })));
      setGainDirty(false);
    }
  }, [d.gainTableConfig]);
  useE2(() => {
    if (d.ppbCorrection != null) {
      const v = parseFloat((d.ppbCorrection / 1000).toFixed(2));
      setPpm(v); setPpmStr(String(v));
    } else if (d.systemXoCorrection != null) {
      const v = parseFloat(freqCorrToPpm(d.systemXoCorrection).toFixed(2));
      setPpm(v); setPpmStr(String(v));
    } else if (d.freqCorrection != null) {
      const v = parseFloat(freqCorrToPpm(d.freqCorrection).toFixed(2));
      setPpm(v); setPpmStr(String(v));
    }
  }, [d.ppbCorrection, d.systemXoCorrection, d.freqCorrection]);

  const applyPpm = (v) => {
    const clamped = Math.max(-200, Math.min(200, v));
    setPpm(clamped); setPpmStr(String(clamped));
    d.publish('main/freq_correction', ppmToFreqCorr(clamped));
  };
  const commitPpmStr = (s) => {
    const v = parseFloat(s);
    if (!isNaN(v)) applyPpm(v);
    else setPpmStr(String(ppm));
  };
  const fmtMHz = (v) => (v >= 1000 ? (v / 1000).toFixed(2) + "G" : Math.round(v) + "M");
  const setPoint = (i, y) => { setCurve((c) => c.map((p, j) => (j === i ? { ...p, y } : p))); setGainDirty(true); };
  const setDacPoint = (i, y) => setDac((c) => c.map((p, j) => (j === i ? { ...p, y } : p)));
  const applyGain = () => {
    d.publish('main/gain_table_config', curve.map(p => `${Math.round(p.x)}:${Math.round(p.y)}`).join(','));
    setGainDirty(false);
  };
  return (
    <div className="page">
      <div className="datv-head">
        <div className="datv-title">
          <h1>Calibrate</h1>
          <span className="datv-sub mono">Frequency &amp; gain calibration · TCXO {ppm >= 0 ? "+" : ""}{ppm.toFixed(2)} ppm</span>
        </div>
        <button className="btn ghost" onClick={() => navigate('kalibrate')}>
          <Icon name="search" size={16} />
          Kalibrate from RF
        </button>
      </div>

      <div className="grid-12">
        <Card title="Frequency calibration" sub="Reference oscillator trim" className="span-12"
          right={<Toggle on={freqCalOn} onChange={setFreqCalOn} labels={["OFF", "ON"]} />}>
          <Field label="Oscillator PPM" hint="−200 to +200 ppm · TCXO offset against reference">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Slider value={ppm} min={-200} max={200} step={0.1}
                  onChange={(v) => { setPpm(v); setPpmStr(v.toFixed(1)); d.publish('main/freq_correction', ppmToFreqCorr(v)); }}
                  unit=" ppm" fmt={(v) => (v >= 0 ? "+" : "") + v.toFixed(1)} />
              </div>
              <TextInput value={ppmStr} suffix="ppm" style={{ width: 90 }}
                onChange={setPpmStr}
                onKeyDown={(e) => { if (e.key === 'Enter') commitPpmStr(ppmStr); }}
                onBlur={() => commitPpmStr(ppmStr)} />
              <button className="btn primary" onClick={() => d.publish('system/setenv/xo_correction', String(ppmToFreqCorr(ppm)))}>
                Save
              </button>
            </div>
          </Field>
          <div className={`cal-status ${freqCalOn ? "on" : ""}`} style={{ opacity: 0.35, pointerEvents: 'none' }}>
            <span className="cal-dot" />
            <span className="mono">{freqCalOn ? "Auto-discipline active · locked to 10 MHz ref" : "Manual trim · calibration paused"}</span>
          </div>
        </Card>

        <Card title="Gain vs frequency" sub={d.gainTableConfig ? "Live from IIO gain_table_config" : "Drag any point up or down to set its gain"} className="span-12"
          right={gainDirty && <button className="btn primary" onClick={applyGain}><Icon name="check" size={14} /> Apply</button>}>
          {(() => {
            const ys = curve.map(p => p.y);
            const yMin = ys.length ? Math.floor(Math.min(...ys) / 5) * 5 : 0;
            const yMax = ys.length ? Math.ceil(Math.max(...ys) / 5) * 5 : 20;
            return <XYChart points={curve} height={300} xUnit="MHz" editable onPointChange={setPoint}
              yMin={yMin} yMax={yMax} fmtX={fmtMHz} fmtY={(v) => v.toFixed(0)} yUnit=" dB" />;
          })()}
        </Card>

        <Card title="DAC gain vs amplitude" sub="Drag any point up or down to set its gain" className="span-12">
          <XYChart points={dac} height={300} xUnit="FS" editable onPointChange={setDacPoint}
            yMin={0} yMax={14} fmtX={(v) => Math.round(v) + "%"} fmtY={(v) => v.toFixed(0)} yUnit=" dB" />
        </Card>
      </div>
    </div>
  );
}

// ---- Diagnostic -----------------------------------------------------------
const clockStr = () => new Date().toTimeString().slice(0, 8);

function Diagnostic({ d }) {
  const [logs, setLogs] = useS2([]);
  const [waiting, setWaiting] = useS2(false);
  const [debugWaiting, setDebugWaiting] = useS2(false);
  const winRef = React.useRef(null);
  const seenRef = React.useRef(0);

  useE2(() => { const el = winRef.current; if (el) el.scrollTop = el.scrollHeight; }, [logs]);

  useE2(() => {
    const sysLog = d.systemLog || [];
    if (sysLog.length > seenRef.current) {
      const newLines = sysLog.slice(seenRef.current).map(msg => ({ t: clockStr(), msg }));
      setLogs(l => [...l, ...newLines]);
      seenRef.current = sysLog.length;
      setWaiting(false);
    }
  }, [(d.systemLog || []).length]);

  const debugCount = Object.keys(d.debugIio || {}).length;
  useE2(() => {
    if (debugCount > 0) setDebugWaiting(false);
  }, [debugCount]);

  const requestLog = () => {
    setWaiting(true);
    d.publish('system/logrequest', '1');
  };

  const clearLogs = () => {
    setLogs([]);
    seenRef.current = (d.systemLog || []).length;
  };

  const requestDebugIio = () => {
    d.clearDebugIio();
    setDebugWaiting(true);
    d.publish('system/getdebugiio', '1');
  };

  const debugEntries = Object.entries(d.debugIio || {}).sort(([a], [b]) => a.localeCompare(b));
  const showDebug = debugWaiting || debugEntries.length > 0;

  return (
    <div className="page">
      <div className="datv-head">
        <div className="datv-title">
          <h1>Diagnostic</h1>
          <span className="datv-sub mono">System log · dmesg from device</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5em' }}>
          <button className="btn ghost" onClick={requestDebugIio} disabled={debugWaiting}>
            <span className={debugWaiting ? "spin" : ""} style={{ display: "inline-flex" }}><Icon name={debugWaiting ? "refresh" : "chip"} size={16} /></span>
            {debugWaiting ? "Loading…" : "Show iio debug"}
          </button>
          <button className="btn primary" onClick={requestLog} disabled={waiting}>
            <span className={waiting ? "spin" : ""} style={{ display: "inline-flex" }}><Icon name={waiting ? "refresh" : "pulse"} size={16} /></span>
            {waiting ? "Waiting…" : "Provide log"}
          </button>
        </div>
      </div>

      <div className="grid-12">
        {showDebug && (
          <Card title="IIO debug" sub="/sys/kernel/debug/iio" className="span-12" pad={false}
            right={<button className="btn ghost btn-sm" onClick={() => { d.clearDebugIio(); setDebugWaiting(false); }}>Clear</button>}>
            <div className="logwin">
              {debugWaiting && debugEntries.length === 0
                ? <div className="logline log-empty mono">— fetching iio debug values… —</div>
                : debugEntries.map(([k, v]) => (
                    <div key={k} className="logline">
                      <span className="log-time mono">{k}</span>
                      <span className="log-msg mono">{v}</span>
                    </div>
                  ))
              }
            </div>
          </Card>
        )}
        <Card title="System log" sub="dmesg output" className="span-12" pad={false}
          right={<button className="btn ghost btn-sm" onClick={clearLogs}>Clear</button>}>
          <div className="logwin" ref={winRef}>
            {logs.length === 0 && <div className="logline log-empty mono">— press "Provide log" to fetch dmesg —</div>}
            {logs.map((l, i) => (
              <div key={i} className="logline">
                <span className="log-time mono">{l.t}</span>
                <span className="log-msg mono">{l.msg}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---- Reboot ---------------------------------------------------------------
function Reboot({ d, ver }) {
  const [mode, setMode] = useS2("Normal");
  const [pending, setPending] = useS2(null);   // null | "reboot" | "shutdown"
  const [phase, setPhase] = useS2("idle");      // idle | busy | waiting | done
  const [action, setAction] = useS2("reboot");
  const [secs, setSecs] = useS2(0);

  // Countdown tick
  useE2(() => {
    if (phase !== "busy") return;
    if (secs <= 0) {
      setPhase(action === "shutdown" ? "done" : "waiting");
      return;
    }
    const id = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secs, action]);

  // Wait for MQTT to reconnect after reboot
  useE2(() => {
    if (phase === "waiting" && d.mqtt) setPhase("done");
  }, [phase, d.mqtt]);

  const start = (kind) => {
    setPending(null); setAction(kind); setPhase("busy"); setSecs(kind === "shutdown" ? 6 : 30);
    d.publish('system/reboot', kind === "shutdown" ? "poweroff" : "reboot");
  };

  return (
    <div className="page">
      <div className="datv-head">
        <div className="datv-title">
          <h1>Reboot</h1>
          <span className="datv-sub mono">Uptime {fmtUptime(d.uptime)} · {mode} mode</span>
        </div>
      </div>

      <div className="grid-12">
        {phase === "idle" ? (
          <Card title="Restart device" sub="Active sessions will be disconnected" className="span-7">
            <Field label="Reboot mode" hint="Normal performs a clean restart of all services">
              <Select value={mode} onChange={setMode} options={["Normal", "Safe mode", "Bootloader"]} />
            </Field>
            <div className="warn-note">
              <Icon name="bell" size={16} />
              <p>Rebooting interrupts any active TX or IQ stream. The unit is unreachable for roughly 20 seconds.</p>
            </div>
            {pending ? (
              <div className="confirm-bar">
                <span className="mono">{`Reboot now in ${mode} mode?`}</span>
                <div className="ab-btns">
                  <button className="btn ghost" onClick={() => setPending(null)}>Cancel</button>
                  <button className="btn primary" onClick={() => start(pending)}>Confirm</button>
                </div>
              </div>
            ) : (
              <div className="ab-btns">
                <button className="btn primary" onClick={() => setPending("reboot")}><Icon name="refresh" size={16} />Reboot now</button>
              </div>
            )}
          </Card>
        ) : (
          <Card className="span-7">
            <div className="reboot-status">
              {phase === "busy" ? (
                <>
                  <span className="spin reboot-spin"><Icon name="refresh" size={30} /></span>
                  <h2>{action === "shutdown" ? "Shutting down…" : "Rebooting…"}</h2>
                  <p className="mono">{action === "shutdown" ? "Powering off subsystems" : `Reconnecting in ${secs}s`}</p>
                </>
              ) : phase === "waiting" ? (
                <>
                  <span className="spin reboot-spin"><Icon name="refresh" size={30} /></span>
                  <h2>Waiting for MQTT…</h2>
                  <p className="mono">Device booted · connecting to broker</p>
                </>
              ) : (
                <>
                  <span className="reboot-check"><Icon name="check" size={28} /></span>
                  <h2>{action === "shutdown" ? "Device powered off" : "Back online"}</h2>
                  <p className="mono">{action === "shutdown" ? "All subsystems halted" : "All services restarted · MQTT reconnected"}</p>
                  <button className="btn primary" onClick={() => setPhase("idle")}>{action === "shutdown" ? "Power on" : "Done"}</button>
                </>
              )}
            </div>
          </Card>
        )}

        <Card title="System" sub="Current image" className="span-5" pad={false}>
          <table className="ver-table compact">
            <tbody>
              <tr><td className="dim">Model</td><td className="vt-name">{ver.model}</td></tr>
              <tr><td className="dim">Firmware</td><td className="vt-ver">{ver.tezuka}</td></tr>
              <tr><td className="dim">Linux</td><td className="mono">{ver.linux}</td></tr>
              <tr><td className="dim">Uptime</td><td className="mono">{fmtUptime(d.uptime)}</td></tr>
              <tr><td className="dim">Serial</td><td className="mono">{ver.serial}</td></tr>
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ---- Operator -------------------------------------------------------------
function Operator({ d, operator }) {
  const [name, setName] = useS2(operator.name);
  const [callsign, setCallsign] = useS2(operator.callsign);
  const [locator, setLocator] = useS2(operator.locator);
  const [saved, setSaved] = useS2(false);
  const [rebootNeeded, setRebootNeeded] = useS2(false);
  const dirty = name !== operator.name || callsign !== operator.callsign || locator !== operator.locator;
  // Re-sync local edit fields whenever the device reports new values (first
  // connect — these arrive after mount, once MQTT retained state lands — or
  // a change made from elsewhere). Comparing against the *previous* synced
  // snapshot rather than the live `operator` prop matters: right after new
  // values arrive, the fields still hold the old ones, so they briefly look
  // "dirty" against the new prop even though the user never touched them —
  // that stale comparison would otherwise block the very sync that fixes it.
  const lastSyncedRef = useR2({ name: operator.name, callsign: operator.callsign, locator: operator.locator });
  useE2(() => {
    const untouched = name === lastSyncedRef.current.name && callsign === lastSyncedRef.current.callsign && locator === lastSyncedRef.current.locator;
    if (untouched) { setName(operator.name); setCallsign(operator.callsign); setLocator(operator.locator); }
    lastSyncedRef.current = { name: operator.name, callsign: operator.callsign, locator: operator.locator };
  }, [operator.name, operator.callsign, operator.locator]);
  const save = () => {
    const call = callsign.toUpperCase();
    if (name !== operator.name) d.publish('operator/name', name);
    if (call !== operator.callsign) {
      d.publish('operator/callsign', call);
      setRebootNeeded(true);
    }
    if (locator !== operator.locator) d.publish('operator/locator', locator);
    setCallsign(call);
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };
  const reset = () => { setName(operator.name); setCallsign(operator.callsign); setLocator(operator.locator); };

  return (
    <div className="page">
      <div className="datv-head">
        <div className="datv-title">
          <h1>Operator</h1>
          <span className="datv-sub mono">Station identity · used for logging &amp; beacon ID</span>
        </div>
      </div>

      <div className="grid-12">
        <Card title="Operator profile" sub="Edit your station details" className="span-7">
          <div className="form-grid">
            <Field label="Operator name"><TextInput value={name} onChange={setName} mono={false} /></Field>
            <Field label="Callsign" hint="Requires a device reboot to take effect · no &quot;/&quot; (MQTT topic separator)"><TextInput value={callsign} onChange={(v) => setCallsign(v.replace(/\//g, ''))} /></Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Grid locator" hint="Maidenhead locator · e.g. JN18cv">
                <TextInput value={locator} onChange={setLocator} />
              </Field>
            </div>
          </div>
          <div className="ab-btns" style={{ marginTop: 20 }}>
            <button className="btn primary" disabled={!dirty} onClick={save}>{saved ? "Saved" : "Save changes"}</button>
            <button className="btn ghost" disabled={!dirty} onClick={reset}>Reset</button>
          </div>
          {rebootNeeded && (
            <div style={{ marginTop: 12 }}>
              <Pill tone="warn" dot>Callsign changed — reboot the device for it to take effect</Pill>
            </div>
          )}
        </Card>

        <Card title="Identity" sub="As broadcast" className="span-5">
          <div className="op-card">
            <div className="op-avatar"><Icon name="user" size={28} /></div>
            <div className="op-id">
              <b>{operator.name}</b>
              <span className="mono">{operator.callsign || "SWL-Anonymous"}</span>
              <span className="mono dim">Locator {operator.locator}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---- Kalibrate from RF -----------------------------------------------------
const KAL_BANDS = ['GSM850', 'GSM-R', 'GSM900', 'EGSM', 'DCS'];

function Kalibrate({ d }) {
  const [calChan, setCalChan] = useS2(null);
  const [band, setBand] = useS2('GSM900');
  const logRef = React.useRef(null);
  const seenRef = React.useRef(0);
  const [logLines, setLogLines] = useS2([]);

  const status = d.kalibrateStatus || '';
  const channels = d.kalibrateChannels || [];
  const sorted = [...channels].sort((a, b) => b.power - a.power);
  const scanning = status === 'scanning';
  const calibrating = status === 'calibrating';


  useE2(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [logLines]);

  useE2(() => {
    const log = d.kalibrateLog || [];
    if (log.length > seenRef.current) {
      setLogLines(l => [...l, ...log.slice(seenRef.current)]);
      seenRef.current = log.length;
    }
  }, [(d.kalibrateLog || []).length]);

  const scan = () => { d.publish('system/kalibrate/scan', band); };
  const calibrate = (chan) => { setCalChan(chan); d.publish('system/kalibrate/run', String(chan)); };

  return (
    <div className="page">
      <div className="datv-head">
        <div className="datv-title">
          <h1>Kalibrate from RF</h1>
          <span className="datv-sub mono">Scan GSM channels · calibrate XO offset</span>
        </div>
        <div style={{ display: "flex", gap: "0.5em", alignItems: "center" }}>
          <Select value={band} onChange={setBand} options={KAL_BANDS} />
          <button className="btn primary" onClick={scan} disabled={scanning || calibrating}>
          <span className={scanning ? "spin" : ""} style={{ display: "inline-flex" }}><Icon name={scanning ? "refresh" : "search"} size={16} /></span>
          {scanning ? "Scanning…" : "Launch scan"}
        </button>
        </div>
      </div>

      <div className="grid-12">
        <Card title="XO correction" className="span-12">
          <div style={{ display: "flex", alignItems: "center", gap: "1.5em" }}>
            <Field label="Current correction">
              <span className="mono">{d.ppbCorrection != null ? (d.ppbCorrection / 1000).toFixed(2) + ' ppm' : d.freqCorrection != null ? freqCorrToPpm(d.freqCorrection).toFixed(2) + ' ppm' : '—'}</span>
            </Field>
            {d.kalibrateResultPpb != null && (
              <Field label="Kalibrate result">
                <span className="mono"><b>{d.kalibrateResultPpm != null ? d.kalibrateResultPpm.toFixed(3) + ' ppm' : ''}</b> ({d.kalibrateResultPpb.toFixed(1)} ppb)</span>
              </Field>
            )}
            {d.kalibrateResultPpb != null && status === 'done' && (
              <button className="btn primary btn-sm" style={{ marginLeft: "auto" }}
                onClick={() => {
                  const hz = ppmToFreqCorr(-d.kalibrateResultPpb / 1000);
                  d.publish('main/freq_correction', String(hz));
                }}>
                Apply to XO
              </button>
            )}
          </div>
        </Card>

        {status && (
          <Card title="Status" className="span-12">
            <Pill tone={status === 'done' ? 'ok' : status === 'error' ? 'warn' : 'info'} dot>{status}</Pill>
          </Card>
        )}

        {sorted.length > 0 ? (
          <Card title="GSM-900 channels" sub="Sorted by signal strength · click to calibrate" className="span-12" pad={false}>
            <table className="ver-table">
              <thead><tr><th>Chan</th><th>Freq (MHz)</th><th>Power (dBFS)</th><th></th></tr></thead>
              <tbody>
                {sorted.map(ch => {
                  const isCal = calChan === ch.chan;
                  const showResult = isCal && d.kalibrateResultPpm != null && status === 'done';
                  return (
                    <tr key={ch.chan}>
                      <td className="mono">{ch.chan}</td>
                      <td className="mono">{Number(ch.freq).toFixed(1)}</td>
                      <td className="mono">{Number(ch.power).toFixed(0)}</td>
                      <td>
                        <button className="btn ghost btn-sm" disabled={calibrating} onClick={() => calibrate(ch.chan)}>
                          {calibrating && isCal && <span className="spin" style={{ display: "inline-flex", marginRight: "4px" }}><Icon name="refresh" size={13} /></span>}
                          {showResult ? `${d.kalibrateResultPpm.toFixed(2)} ppm` : 'Kalibrate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        ) : (
          !scanning && <Card className="span-12"><div className="logline log-empty mono">— launch a scan to discover GSM-900 channels —</div></Card>
        )}

        <Card title="kal output" sub="Raw stdout from kalibrate" className="span-12" pad={false}
          right={<button className="btn ghost btn-sm" onClick={() => { setLogLines([]); seenRef.current = (d.kalibrateLog || []).length; }}>Clear</button>}>
          <div className="logwin" ref={logRef}>
            {logLines.length === 0
              ? <div className="logline log-empty mono">— no output yet —</div>
              : logLines.map((line, i) => (
                <div key={i} className="logline"><span className="log-msg mono">{line}</span></div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---- Persistent storage ---------------------------------------------------
function Persistent({ d }) {
  const [loading, setLoading] = useS2(false);
  const [edits, setEdits] = useS2({});
  const [saved, setSaved] = useS2({});
  const [filter, setFilter] = useS2('');
  const [newName, setNewName] = useS2('');
  const [newVal, setNewVal] = useS2('');
  const [newSaved, setNewSaved] = useS2(false);
  const envVars = d.envVars || {};
  const requestedRef = React.useRef(false);

  useE2(() => {
    if (!d.mqtt || requestedRef.current) return;
    requestedRef.current = true;
    d.clearEnvVars();
    setLoading(true);
    d.publish('system/getenv', 'all');
  }, [d.mqtt]);

  useE2(() => {
    if (d.envCount != null) setLoading(false);
  }, [d.envCount]);

  const setEdit = (name, val) => setEdits(e => ({ ...e, [name]: val }));

  const save = (name) => {
    d.publish('system/setenv/' + name, edits[name]);
    setEdits(e => { const n = { ...e }; delete n[name]; return n; });
    setSaved(s => ({ ...s, [name]: true }));
    setTimeout(() => setSaved(s => { const n = { ...s }; delete n[name]; return n; }), 2000);
  };

  const refresh = () => {
    d.clearEnvVars();
    setLoading(true);
    setEdits({});
    requestedRef.current = false;
    d.publish('system/getenv', 'all');
  };

  const saveNew = () => {
    if (!newName.trim() || !/^[a-zA-Z0-9_]+$/.test(newName)) return;
    d.publish('system/setenv/' + newName, newVal);
    setNewSaved(true);
    setNewName('');
    setNewVal('');
    setTimeout(() => setNewSaved(false), 2000);
  };

  const entries = Object.entries(envVars)
    .filter(([k, v]) => !filter ||
      k.toLowerCase().includes(filter.toLowerCase()) ||
      v.toLowerCase().includes(filter.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="page">
      <div className="datv-head">
        <div className="datv-title">
          <h1>Persistent storage</h1>
          <span className="datv-sub mono">U-Boot environment · fw_printenv / fw_setenv</span>
        </div>
        <button className="btn primary" onClick={refresh} disabled={loading}>
          <span className={loading ? "spin" : ""} style={{ display: "inline-flex" }}><Icon name="refresh" size={16} /></span>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="grid-12">
        <Card title="New variable" sub="Add or overwrite a U-Boot environment entry" className="span-12">
          <div style={{ display: 'flex', gap: '0.75em', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Field label="Name">
              <TextInput value={newName} onChange={setNewName} placeholder="variable_name"
                onKeyDown={(e) => e.key === 'Enter' && saveNew()} />
            </Field>
            <Field label="Value" style={{ flex: 1 }}>
              <TextInput value={newVal} onChange={setNewVal} placeholder="value"
                onKeyDown={(e) => e.key === 'Enter' && saveNew()} />
            </Field>
            <div style={{ paddingBottom: '2px' }}>
              {newSaved
                ? <Pill tone="ok" dot>saved</Pill>
                : <button className="btn primary" onClick={saveNew}
                    disabled={!/^[a-zA-Z0-9_]+$/.test(newName)}>
                    <Icon name="save" size={15} /> Save
                  </button>}
            </div>
          </div>
        </Card>

        <Card title="Environment variables" sub={`${entries.length} variable${entries.length !== 1 ? 's' : ''}`} className="span-12" pad={false}
          right={<TextInput value={filter} onChange={setFilter} mono={false} placeholder="Filter…" />}>
          {entries.length === 0 ? (
            <div className="logline log-empty mono">
              {loading ? "— loading environment variables…" : "— no variables · press Refresh —"}
            </div>
          ) : (
            <table className="ver-table">
              <thead><tr><th>Variable</th><th>Value</th><th></th></tr></thead>
              <tbody>
                {entries.map(([name, val]) => {
                  const editVal = edits[name] !== undefined ? edits[name] : val;
                  const dirty = edits[name] !== undefined && edits[name] !== val;
                  const multiline = editVal.includes('\n');
                  return (
                    <tr key={name}>
                      <td className="mono vt-name" style={{ whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: 10 }}>{name}</td>
                      <td style={{ width: '100%' }}>
                        {multiline
                          ? <textarea className="mono" rows={Math.min(editVal.split('\n').length, 10)}
                              value={editVal} onChange={(e) => setEdit(name, e.target.value)}
                              style={{ width: '100%', resize: 'vertical', background: 'var(--bg-2)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 6px', fontSize: 'inherit', fontFamily: 'inherit' }} />
                          : <TextInput value={editVal} onChange={(v) => setEdit(name, v)} />}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: 10 }}>
                        {dirty ? (
                          <div className="ab-btns">
                            <button className="btn primary btn-sm" onClick={() => save(name)}>
                              <Icon name="save" size={13} /> Save
                            </button>
                            <button className="btn ghost btn-sm" onClick={() => setEdit(name, val)}>Reset</button>
                          </div>
                        ) : saved[name] ? (
                          <Pill tone="ok" dot>saved</Pill>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

// ---- GPIO -----------------------------------------------------------------
// /sys/class/leds names look like "led0:green" (numbered board LED, kernel
// heartbeat trigger, color known from the label) or a bare functional name
// like "ptt"/"lnb_power"/"lnb_18v" (indicator LEDs, no color in sysfs) — see
// api_controller.sh's gpio/<label> publish + led_state() helper.
const GPIO_LED_COLORS = { green: '#3ddc73', red: '#ff5252', blue: '#4da3ff', yellow: '#ffd43b', orange: '#ff9f43', amber: '#ffb238', white: '#f2f2f2' };

const GPIO_LABEL_ACRONYMS = { ptt: 'PTT', lnb: 'LNB', rf: 'RF', tx: 'TX', rx: 'RX' };

function describeGpioLed(name) {
  const numbered = /^led(\d+):(\w+)$/i.exec(name);
  if (numbered) return { label: `LED ${numbered[1]}`, color: GPIO_LED_COLORS[numbered[2].toLowerCase()] || null };
  if (/^\d+$/.test(name)) return { label: `GPIO ${name}`, color: null };
  const label = name.split(/[_-]+/).map((w) => {
    const lw = w.toLowerCase();
    if (GPIO_LABEL_ACRONYMS[lw]) return GPIO_LABEL_ACRONYMS[lw];
    if (/^\d+v$/i.test(w)) return w.toUpperCase(); // e.g. "18v" -> "18V"
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
  return { label, color: null };
}

function GPIO({ d }) {
  const gpio = d.gpio || {};
  // Numbered board LEDs (led0, led1, …) first in index order, then any
  // named indicator LEDs (ptt, lnb_power, …) alphabetically.
  const pins = Object.keys(gpio).sort((a, b) => {
    const ma = /^led(\d+):/i.exec(a), mb = /^led(\d+):/i.exec(b);
    if (ma && mb) return +ma[1] - +mb[1];
    if (ma) return -1;
    if (mb) return 1;
    return a.localeCompare(b);
  });

  const toggle = (pin) => d.publish('gpio/' + pin, gpio[pin] ? '0' : '1');

  return (
    <div className="page">
      <div className="grid-12">
        <Card title="Board LEDs" sub={`/sys/class/leds · ${pins.length} LED${pins.length !== 1 ? 's' : ''} reported`} className="span-12">
          {pins.length === 0 ? (
            <div className="dim" style={{ padding: '12px 0', fontSize: 13 }}>No LED state received yet — waiting for <code>state/gpio/&lt;name&gt;</code> messages.</div>
          ) : (
            <div className="gpio-grid">
              {pins.map((pin) => {
                const on = gpio[pin];
                const { label, color } = describeGpioLed(pin);
                return (
                  <div key={pin} className={`gpio-pin ${on ? "gpio-on" : "gpio-off"}`} onClick={() => toggle(pin)} title={pin}>
                    <span className="gpio-num">{label}</span>
                    <span className={`gpio-dot ${on ? "on" : ""}`} style={on && color ? { background: color, boxShadow: `0 0 6px ${color}` } : undefined} />
                    <span className="gpio-state">{on ? "ON" : "OFF"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ---- Performance ----------------------------------------------------------
function Performance({ d }) {
  const requestedRef = React.useRef(false);

  useE2(() => {
    if (!d.mqtt || requestedRef.current) return;
    requestedRef.current = true;
    d.publish('system/overclock_cap', '1');
  }, [d.mqtt]);

  const caps = d.overclockCap || [];
  const options = caps.length
    ? caps.map(f => ({ v: f, l: f }))
    : [{ v: '', l: d.mqtt ? 'No profiles found' : 'Loading…' }];

  return (
    <div className="page">
      <div className="grid-12">
        <Card title="CPU" sub="ARM Cortex-A9 · Zynq-7020 processing system" className="span-6">
          <Field label="Overclock profile" hint="/boot/overclock · takes effect on next boot">
            <Select
              value={d.overclock || ''}
              onChange={(v) => { if (v) d.publish('system/overclock', v); }}
              options={options} />
          </Field>
        </Card>
      </div>
    </div>
  );
}

function GpsPage({ d }) {
  const fix = d.gpsfix || 'none';
  const locator = d.gpsLocator || '';

  const fixMeta = {
    '3D': { cls: 'ok',   label: '3D Fix',  desc: 'Full position + altitude' },
    '2D': { cls: 'warn', label: '2D Fix',  desc: 'Position — altitude unreliable' },
    'none': { cls: 'dim', label: 'No Fix', desc: 'Waiting for satellite fix' },
  };
  const meta = fixMeta[fix] || fixMeta['none'];

  return (
    <div className="page">
      <div className="grid-12">
        <Card title="GPS" sub="Fix status and Maidenhead locator via gpsd" className="span-12">
          <div className="gps-panel">
            <div className={`gps-fix gps-fix-${fix}`}>
              <Icon name="mappin" size={40} />
              <span className="gps-fix-label">{meta.label}</span>
              <span className="gps-fix-desc">{meta.desc}</span>
            </div>
            <div className="gps-sep" />
            <div className="gps-loc-wrap">
              <span className="gps-loc-cap">Maidenhead Locator</span>
              <span className="gps-loc mono">{locator || '—'}</span>
              {locator && <span className="gps-loc-hint">6-char grid square</span>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---- Clock reference -------------------------------------------------------
const CLKREF_SOURCE_LABELS = {
  '10mhz': '10 MHz reference (CLKIN)',
  pps: 'PPS (1 Hz)',
  none: 'No reference detected',
  internal: 'Internal TCXO',
  external: 'External reference',
};

function fmtClkrefFreq(freq) {
  const hz = parseFloat(freq);
  if (!(hz > 0)) return '—';
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(6)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(3)} kHz`;
  return `${hz} Hz`;
}

// ADF4001 boards (PlutoSky R2): the FPGA closes the loop only while a valid
// 10 MHz is detected and reports the chip's lock detect; see RefFix in the
// board documentation. The LED on the case shows the same lock state.
const CLKREF_STATE_LABELS = {
  absent:  ['No reference', 'neutral'],
  acquire: ['Acquiring',    'warn'],
  locked:  ['Locked',       'ok'],
  recheck: ['Re-checking',  'warn'],
};
const CLKREF_MODE_OPTIONS = [
  { v: 'auto',     l: 'Automatic (follow the detector)' },
  { v: 'external', l: 'External: loop always closed' },
  { v: 'internal', l: 'Internal: VCTCXO free-running' },
];

function ClockRefAdf4001({ d }) {
  const state = d.clkrefState || '';
  const [stateLabel, stateTone] = CLKREF_STATE_LABELS[state] || ['Unknown', 'neutral'];
  const present = d.clkrefPresent === '1';
  const cp = d.clkrefCp === '1';
  const mode = ['auto', 'external', 'internal'].includes(d.clkrefMode) ? d.clkrefMode : 'auto';
  const count = d.clkrefCount;
  const countHint = count == null ? '' : `${count} R-divider edges per 102.4 us window (1024 = 10.000 MHz; tens of thousands = open input)`;

  return (
    <div className="page">
      <div className="datv-head">
        <div className="datv-title">
          <h1>Reference Clock</h1>
          <span className="datv-sub mono">ADF4001 PLL locking the 40 MHz VCTCXO to the 10 MHz input (CLKIN)</span>
        </div>
      </div>

      <div className="grid-12">
        <Card title="Reference clock" sub="What the FPGA sees on the ADF4001" className="span-12">
          <div style={{ display: "flex", alignItems: "center", gap: "2em", flexWrap: "wrap" }}>
            <Field label="Lock status">
              <Pill tone={stateTone} dot>{stateLabel}</Pill>
            </Field>
            <Field label="10 MHz input" hint={countHint || undefined}>
              <Pill tone={present ? "ok" : "neutral"} dot>{present ? "Present" : "Not detected"}</Pill>
            </Field>
            <Field label="Charge pump" hint="Active = loop closed, VCTCXO steered by the reference">
              <span className="mono">{cp ? "active" : "three-state"}</span>
            </Field>
            <Field label="Mode" hint="Stored in the boot environment; applied at once, no reboot">
              <Select value={mode} onChange={(v) => d.publish('system/clkref/mode', v)} options={CLKREF_MODE_OPTIONS} />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Pill tone="neutral" dot>Yellow LED on the case: on = locked, off = not locked (no reference, or loop forced open)</Pill>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ClockRef({ d }) {
  if (d.clkrefHw === 'adf4001') return <ClockRefAdf4001 d={d} />;
  const source = d.clkrefSource || '';
  const locked = d.clkrefLock === '1';
  const freq = d.clkrefFrequency;
  const corr = d.clkrefCorrection;
  const hasFreq = freq && freq !== 'n/a';
  const hasCorr = corr && corr !== 'n/a';
  const sourceLabel = CLKREF_SOURCE_LABELS[source] || source || '—';

  return (
    <div className="page">
      <div className="datv-head">
        <div className="datv-title">
          <h1>Reference Clock</h1>
          <span className="datv-sub mono">VCTCXO reference-discipline loop status (vctcxo_lock)</span>
        </div>
      </div>

      <div className="grid-12">
        <Card title="Reference clock" sub="Lock state, source, and discipline status" className="span-12">
          <div style={{ display: "flex", alignItems: "center", gap: "2em", flexWrap: "wrap" }}>
            <Field label="Lock status">
              <Pill tone={locked ? "ok" : "warn"} dot>{locked ? "Locked" : "No lock"}</Pill>
            </Field>
            <Field label="Source" hint={hasCorr ? "Software-selected — the loop has no auto-detect for what's plugged in" : undefined}>
              {hasCorr ? (
                <Select
                  value={['10mhz', 'pps', 'none'].includes(source) ? source : '10mhz'}
                  onChange={(v) => d.publish('system/clkref/source', v)}
                  options={[
                    { v: '10mhz', l: CLKREF_SOURCE_LABELS['10mhz'] },
                    { v: 'pps',   l: CLKREF_SOURCE_LABELS['pps'] },
                    { v: 'none',  l: CLKREF_SOURCE_LABELS['none'] },
                  ]} />
              ) : (
                <span className="mono">{sourceLabel}</span>
              )}
            </Field>
            <Field label="Reference input frequency" hint="Nominal for the selected mode — not a live frequency measurement">
              <span className="mono">{hasFreq ? fmtClkrefFreq(freq) : '—'}</span>
            </Field>
            <Field label="Correction" hint="Live 16-bit VCTCXO DAC setpoint">
              <span className="mono">{hasCorr ? corr : '—'}</span>
            </Field>
          </div>
          {!hasCorr && (
            <div style={{ marginTop: 16 }}>
              <Pill tone="neutral" dot>No vctcxo_lock hardware detected on this board — reporting refclk_source only</Pill>
            </div>
          )}
        </Card>

        {hasCorr && (
          <Card title="DAC correction" sub="Live VCTCXO DAC setpoint over time (60-point history, 1 sample/poll)" className="span-12">
            <StreamChart fmt={(v) => v.toFixed(0)} series={[{ data: d.clkrefCorrH, color: "var(--c-purple)", label: "Correction" }]} />
          </Card>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Versions, Network, Calibrate, Diagnostic, Reboot, Operator, Kalibrate, Persistent, Performance, GPIO, GpsPage, ClockRef });
