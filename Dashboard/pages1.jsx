// pages1.jsx — Dashboard
const { useState: useS1, useEffect: useE1 } = React;

const fmtBytes = (b) => {
  if (b == null) return null;
  if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
  if (b >= 1024)    return (b / 1024).toFixed(1) + ' KB';
  return b + ' B';
};

function StatTile({ label, value, unit, spark, color, tone }) {
  return (
    <div className="stat-tile">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {tone && <Pill tone={tone} dot>{tone === "ok" ? "LOCK" : "—"}</Pill>}
      </div>
      <div className="stat-val mono">{value}<i>{unit}</i></div>
      {spark && <Sparkline data={spark} color={color} width={150} height={32} />}
    </div>);

}

function BigStat({ label, value, unit, options, onCycle, color }) {
  return (
    <div className={`bigstat ${options ? "switchable" : ""} ${color ? "active" : ""}`}
    style={color ? { "--ac": color } : undefined}
    onClick={options ? onCycle : undefined}>
      <div className="bigstat-label">{label}{options && <Icon name="refresh" size={13} />}</div>
      <div className="bigstat-val mono">{value}{unit && <i>{unit}</i>}</div>
    </div>);

}

function Led({ label, alarm }) {
  return (
    <div className="led-item">
      <span className={`led ${alarm ? "led-red" : "led-green"}`} />
      <span className="led-label">{label}</span>
    </div>
  );
}

const AGC_TO_UI = { manual: "manual", slow_attack: "slow", fast_attack: "fast", hybrid: "slow" };
const UI_TO_AGC = { manual: "manual", slow: "slow_attack", fast: "fast_attack" };

function Dashboard({ d, ver }) {
  const [rxFreqHz, setRxFreqHz] = useS1(null);
  const [txFreqHz, setTxFreqHz] = useS1(null);
  const [srHz, setSrHz] = useS1(null);
  const [bwHz, setBwHz] = useS1(null);
  const [bwAuto, setBwAuto] = useS1(true);
  const [input, setInput] = useS1(0);
  const [output, setOutput] = useS1(0);
  const [rxGain, setRxGain] = useS1(null);
  const [txGain, setTxGain] = useS1(null);
  const [agc, setAgc] = useS1("manual");

  useE1(() => { if (d.rxFreq     != null) setRxFreqHz(d.rxFreq); },     [d.rxFreq]);
  useE1(() => { if (d.txFreq     != null) setTxFreqHz(d.txFreq); },     [d.txFreq]);
  useE1(() => { if (d.rxSampling != null) setSrHz(d.rxSampling); },     [d.rxSampling]);
  useE1(() => { if (d.rxBandwidth!= null) setBwHz(d.rxBandwidth); },    [d.rxBandwidth]);
  useE1(() => { if (d.rxGain     != null) setRxGain(d.rxGain); },       [d.rxGain]);
  useE1(() => { if (d.txGain     != null) setTxGain(d.txGain); },       [d.txGain]);
  useE1(() => { if (d.rxGainMode)         setAgc(AGC_TO_UI[d.rxGainMode] || "manual"); }, [d.rxGainMode]);
  useE1(() => { if (d.rxRfinput != null)  setInput(d.rxRfinput - 1); },  [d.rxRfinput]);
  useE1(() => { if (d.txRfoutput != null)  setOutput(d.txRfoutput - 1); }, [d.txRfoutput]);

  const RX = ["RX1", "RX2"], TX = ["TX1", "TX2"];
  const mhz = (v) => (v / 1e6).toFixed(3) + " MHz", ms = (v) => (v / 1e6).toFixed(3) + " MS/s";
  const autoBw    = (sr) => Math.min(Math.round(sr * 1.5), 56000000);
  const bwShown   = bwAuto ? d.rxBandwidth : bwHz;

  const onRxFreq  = (v) => { setRxFreqHz(v); d.publish("rx/frequency", v); };
  const onTxFreq  = (v) => { setTxFreqHz(v); d.publish("tx/frequency", v); };
  const onSr      = (v) => {
    setSrHz(v); d.publish("rx/sampling", v); d.publish("tx/sampling", v);
    if (bwAuto) { const bw = autoBw(v); d.publish("rx/bandwidth", bw); d.publish("tx/bandwidth", bw); }
  };
  const onBw      = (v) => { setBwHz(v); d.publish("rx/bandwidth", v); d.publish("tx/bandwidth", v); };
  const onRxGain  = (v) => { setRxGain(v); d.publish("rx/gain", v); };
  const onTxGain  = (v) => { setTxGain(v); d.publish("tx/gain", v); };
  const onAgc     = (m) => { setAgc(m); d.publish("rx/gain_mode", UI_TO_AGC[m]); };
  return (
    <div className="page">
      <div className="grid-12">
        <Card className="span-12">
          <div className="ds-shared">
            <div className="ds-shared-head"><span className="bigstat-label" style={{ margin: 0 }}>Baseband</span><span className={`pill ${d.sys2r2t ? 'pill-ok' : 'pill-neutral'}`}>{d.sys2r2t ? '2R2T' : '1R1T'}</span></div>
            <div className="bw-grid">
              <div>
                <div className="bw-field-head"><span className="field-label">Sample rate</span></div>
                <div className="rate-row">
                  {srHz != null && <FreqTuner value={srHz} digits={9} min={520833} max={61440000} unit="S/s" onChange={onSr} />}
                </div>
              </div>
              <div>
                <div className="bw-field-head"><span className="field-label">Bandwidth</span><Checkbox checked={bwAuto} onChange={setBwAuto} label="Auto" /></div>
                <div className={bwAuto ? "ftuner-disabled" : ""}>
                  {bwShown != null && <FreqTuner value={bwShown} digits={8} min={200000} max={56000000} unit="Hz" onChange={bwAuto ? () => {} : onBw} />}
                </div>
              </div>
            </div>
          </div>
          <div className="rf-panels">
            <div className="rf-panel rx">
              <div className="rf-panel-head"><span className="rf-tag">RX</span>Receive path</div>
              <div className="ds-tuner"><span className="bigstat-label">Frequency</span>{rxFreqHz != null && <FreqTuner value={rxFreqHz} digits={12} min={47e6} max={6e9} unit="Hz" sub={mhz} onChange={onRxFreq} />}</div>
              <Field label="Gain control">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="seg">
                    {["manual", "slow", "fast"].map((m) =>
                    <button key={m} className={agc === m ? "seg-on" : ""} onClick={() => onAgc(m)}>{m === "manual" ? "Manual" : m === "slow" ? "Slow AGC" : "Fast AGC"}</button>
                    )}
                  </div>
                  <div className="rssi-panel">
                    <span className="field-label">RSSI</span>
                    <span className="mono" style={{ marginLeft: 6 }}>{d.rfLevel != null ? `${d.rfLevel.toFixed(1)} dB` : "—"}</span>
                  </div>
                </div>
              </Field>
              <Field label="RX gain" hint={agc !== "manual" ? "Set automatically by AGC" : undefined}>
                <div className={agc !== "manual" ? "ftuner-disabled" : ""}>
                  {rxGain != null && <Slider value={rxGain} min={0} max={73} step={1} onChange={agc !== "manual" ? () => {} : onRxGain} unit=" dB" />}
                </div>
              </Field>
              <div className="led-row">
                <Led label="Clipping" alarm={d.rxOverload} />
                <Led label="Underflow" alarm={d.rxUnderflow} />
                {d.rxBufferSize != null && <span className="mono" style={{fontSize:'0.75em',opacity:0.7}}>{fmtBytes(d.rxBufferSize)}</span>}
                {d.rxDmaTransfer != null && d.rxBufferSize != null && <HBarGauge value={d.rxDmaTransfer} max={500} color="var(--accent)" label="DMA" fmt={fmtBytes} />}
              </div>
              <div className="bigstat-grid">
                <BigStat label="Input" value={RX[input]} options color={d.rxDmaTransfer > 0 ? "var(--accent)" : undefined} onCycle={() => { const next = (input + 1) % 2; setInput(next); d.publish("rx/rfinput", next + 1); }} />
              </div>
            </div>
            <div className="rf-panel tx">
              <div className="rf-panel-head"><span className="rf-tag tx">TX</span>Transmit path</div>
              <div className="ds-tuner"><span className="bigstat-label">Frequency</span>{txFreqHz != null && <FreqTuner value={txFreqHz} digits={12} min={47e6} max={6e9} unit="Hz" sub={mhz} onChange={onTxFreq} />}</div>
              <div className="field" aria-hidden="true" style={{ visibility: "hidden" }}>
                <span className="field-label">Gain control</span>
                <div className="seg"><button>Manual</button></div>
              </div>
              <Field label="TX gain">{txGain != null && <Slider value={txGain} min={-89} max={0} step={0.25} onChange={onTxGain} unit=" dB" fmt={(v) => v.toFixed(2)} />}</Field>
              <div className="led-row">
                <Led label="Clipping" alarm={d.txOverload} />
                <Led label="Underflow" alarm={d.txUnderflow} />
                {d.txBufferSize != null && <span className="mono" style={{fontSize:'0.75em',opacity:0.7}}>{fmtBytes(d.txBufferSize)}</span>}
                {d.txDmaTransfer != null && d.txBufferSize != null && <HBarGauge value={d.txDmaTransfer} max={500} color="var(--c-pink)" label="DMA" fmt={fmtBytes} />}
              </div>
              <div className="bigstat-grid">
                <BigStat label="Output" value={TX[output]} options color={d.txDmaTransfer > 0 ? "var(--c-pink)" : undefined} onCycle={() => { const next = (output + 1) % 2; setOutput(next); d.publish("tx/rfoutput", next + 1); }} />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Temperature" sub="On-die sensors · live" className="span-12">
          <div className="gauge-row">
            <DialGauge value={d.fpgaTemp} max={65} label="FPGA" unit="°C" color="var(--ok)" />
            <DialGauge value={d.temp} max={65} label="AD9361" unit="°C" color="var(--ok)" />
          </div>
        </Card>

        <Card title="Device" className="span-12" pad={false}>
          <div className="device-strip">
            <div className="ds-item"><Icon name="chip" size={18} /><div><span>Model</span><b className="mono">{ver.model}</b></div></div>
            <div className="ds-item"><Icon name="clock" size={18} /><div><span>Uptime</span><b className="mono">{fmtUptime(d.uptime)}</b></div></div>
            <div className="ds-item"><Icon name="wave" size={18} /><div><span>Tezuka core</span><b className="mono">{ver.tezuka}</b></div></div>
            <div className="ds-item"><span className={`conn ${d.mqtt ? "up" : "down"}`} /><div><span>MQTT broker</span><b className="mono">{d.mqtt ? `connected · ${d.mqttHost}` : "offline"}</b></div></div>
          </div>
        </Card>
      </div>
    </div>);

}

Object.assign(window, { Dashboard });
