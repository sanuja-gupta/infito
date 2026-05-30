// js/wiring-2d.js
export function render2DWiring(wiringText, containerId = 'wiring-2d-container') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    console.log('Parsing wiring text:', wiringText?.substring(0, 200));

    const connections = parseConnections(wiringText);
    console.log('Parsed connections:', connections.length, connections);

    if (connections.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;color:#666;padding:40px;">
                <p style="margin-bottom:10px;">Wiring diagram unavailable for this format.</p>
                <p style="font-size:11px;color:#444;">See text wiring guide below.</p>
            </div>
        `;
        return;
    }

    // Build component map
    const compPins = {};
    connections.forEach(c => {
        if (!compPins[c.fromComp]) compPins[c.fromComp] = new Set();
        if (!compPins[c.toComp]) compPins[c.toComp] = new Set();
        compPins[c.fromComp].add(c.fromPin);
        compPins[c.toComp].add(c.toPin);
    });

    Object.keys(compPins).forEach(k => compPins[k] = Array.from(compPins[k]));

    const compNames = Object.keys(compPins).sort((a, b) => compPins[b].length - compPins[a].length);
    const leftComp = compNames[0];
    const rightComps = compNames.slice(1);

    const svgW = 560;
    const svgH = Math.max(300, rightComps.length * 110 + 80);

    let html = `<div style="position:relative;width:100%;height:${svgH}px;overflow:auto;">`;
    html += `<svg style="width:${svgW}px;height:${svgH}px;" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;
    html += `<rect width="${svgW}" height="${svgH}" fill="#0a0806" rx="8"/>`;

    // Positions
    const positions = {};
    const leftX = 50, rightX = 360;

    positions[leftComp] = { x: leftX, y: svgH / 2 - 40 };
    rightComps.forEach((comp, i) => {
        positions[comp] = { x: rightX, y: 50 + i * 100 };
    });

    // Draw wires
    connections.forEach((conn, idx) => {
        const p1 = positions[conn.fromComp];
        const p2 = positions[conn.toComp];
        if (!p1 || !p2) {
            console.warn('Missing position for connection:', conn);
            return;
        }

        const color = getWireColor(conn.fromPin, conn.toPin);
        const pinH1 = 24 + compPins[conn.fromComp].indexOf(conn.fromPin) * 18;
        const pinH2 = 24 + compPins[conn.toComp].indexOf(conn.toPin) * 18;

        const x1 = p1.x + 130;
        const y1 = p1.y + pinH1;
        const x2 = p2.x;
        const y2 = p2.y + pinH2;

        const midX = (x1 + x2) / 2;
        const offset = (idx % 3) * 8 - 8;

        html += `<path d="M${x1},${y1} C${midX + offset},${y1} ${midX + offset},${y2} ${x2},${y2}" 
            fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>`;

        // Label
        const labelY = (y1 + y2) / 2;
        html += `<rect x="${midX - 24}" y="${labelY - 6}" width="48" height="12" rx="3" fill="#0a0806" opacity="0.95"/>`;
        html += `<text x="${midX}" y="${labelY + 3}" text-anchor="middle" font-size="7" fill="#fff" font-family="monospace">${conn.fromPin}→${conn.toPin}</text>`;
    });

    // Draw components
    compNames.forEach(comp => {
        const pos = positions[comp];
        if (!pos) return;

        const pins = compPins[comp];
        const boxH = Math.max(50, pins.length * 18 + 20);
        const emoji = getCompEmoji(comp);

        html += `<rect x="${pos.x}" y="${pos.y}" width="130" height="${boxH}" rx="6" fill="#1a1a2e" stroke="#444" stroke-width="1"/>`;
        html += `<rect x="${pos.x}" y="${pos.y}" width="130" height="18" rx="6" fill="#252540"/>`;
        html += `<text x="${pos.x + 6}" y="${pos.y + 13}" font-size="9" fill="#e8dcc8" font-weight="600">${emoji} ${truncate(comp, 13)}</text>`;

        pins.forEach((pin, i) => {
            const pinColor = getPinColor(pin);
            const py = pos.y + 24 + i * 18;
            html += `<circle cx="${pos.x + 10}" cy="${py}" r="3" fill="${pinColor}" stroke="${pinColor}" stroke-width="0.5"/>`;
            html += `<text x="${pos.x + 18}" y="${py + 3}" font-size="8" fill="#aaa" font-family="monospace">${pin}</text>`;
        });
    });

    html += `</svg></div>`;
    container.innerHTML = html;
}

function parseConnections(text) {
    if (!text) return [];
    const lines = text.split('\n');
    const connections = [];

    for (const line of lines) {
        const clean = line.trim();
        if (!clean) continue;

        // Remove "Step X:" prefix
        const noStep = clean.replace(/^Step\s*\d+[:.)]\s*/i, '');

        // Must contain connect keyword
        if (!noStep.match(/\bconnect\b/i)) continue;

        let m = null;

        // Pattern 1: "Connect VCC of DHT11 to 5V of Arduino"
        m = noStep.match(/Connect\s+(\S+(?:\s+\S+)?)\s+(?:of|on)\s+([\w\s-]+?)\s+to\s+(\S+(?:\s+\S+)?)\s+(?:of|on)\s+([\w\s-]+)/i);

        // Pattern 2: "Connect pin 9 on Arduino to Trig on HC-SR04"
        if (!m) {
            m = noStep.match(/Connect\s+pin\s+(\S+(?:\s+\S+)?)\s+(?:of|on)\s+([\w\s-]+?)\s+to\s+(?:pin\s+)?(\S+(?:\s+\S+)?)\s+(?:of|on)\s+([\w\s-]+)/i);
        }

        // Pattern 3: "Connect Arduino pin 9 to HC-SR04 Trig"
        if (!m) {
            m = noStep.match(/Connect\s+([\w\s-]+?)\s+pin\s+(\S+(?:\s+\S+)?)\s+to\s+([\w\s-]+?)\s+(\S+(?:\s+\S+)?)/i);
            if (m) {
                // Swap order: comp pin to comp pin
                connections.push({
                    fromComp: m[1].trim(),
                    fromPin: cleanPin(m[2]),
                    toComp: m[3].trim(),
                    toPin: cleanPin(m[4])
                });
                continue;
            }
        }

        // Pattern 4: "Connect 5V of Arduino to VCC of DHT11" (power first)
        if (!m) {
            m = noStep.match(/Connect\s+(\S+(?:\s+\S+)?)\s+(?:of|on)\s+([\w\s-]+?)\s+to\s+(\S+(?:\s+\S+)?)\s+(?:of|on)\s+([\w\s-]+)/i);
        }

        if (!m) {
            console.log('No match for line:', clean.substring(0, 60));
            continue;
        }

        connections.push({
            fromPin: cleanPin(m[1]),
            fromComp: m[2].trim(),
            toPin: cleanPin(m[3]),
            toComp: m[4].trim()
        });
    }

    return connections;
}

function cleanPin(pin) {
    if (!pin) return '';
    return pin.replace(/^pin\s+/i, '').replace(/\s*pin$/i, '').trim();
}

function getWireColor(fromPin, toPin) {
    const p = ((fromPin || '') + ' ' + (toPin || '')).toLowerCase();
    if (p.includes('5v') || p.includes('vcc') || p.includes('vin') || p.includes('vdd')) return '#e74c3c';
    if (p.includes('gnd')) return '#555555';
    if (p.includes('sda')) return '#27ae60';
    if (p.includes('scl')) return '#9b59b6';
    if (p.includes('trig') || p.includes('echo') || p.includes('in') || p.includes('out') || p.includes('ao') || p.includes('do')) return '#3498db';
    if (p.includes('sig') || p.includes('data') || p.includes('pwm')) return '#e8c840';
    return '#e8c840';
}

function getPinColor(pin) {
    const p = (pin || '').toLowerCase();
    if (p.includes('5v') || p.includes('vcc') || p.includes('vin')) return '#e74c3c';
    if (p.includes('gnd')) return '#555555';
    if (p.includes('sda')) return '#27ae60';
    if (p.includes('scl')) return '#9b59b6';
    if (p.match(/^d\d+/)) return '#e8c840';
    if (p.match(/^a\d+/)) return '#9b59b6';
    return '#888888';
}

function getCompEmoji(comp) {
    const c = (comp || '').toLowerCase();
    if (c.includes('arduino')) return '🟢';
    if (c.includes('esp32')) return '📶';
    if (c.includes('esp8266') || c.includes('nodemcu')) return '📡';
    if (c.includes('ultrasonic') || c.includes('hc-sr') || c.includes('hcsr')) return '👁️';
    if (c.includes('ir')) return '🔴';
    if (c.includes('dht')) return '🌡️';
    if (c.includes('ldr') || c.includes('light')) return '💡';
    if (c.includes('pir') || c.includes('motion')) return '🚶';
    if (c.includes('mq') || c.includes('gas')) return '💨';
    if (c.includes('soil') || c.includes('moisture')) return '💧';
    if (c.includes('mpu') || c.includes('gyro') || c.includes('accel')) return '📐';
    if (c.includes('rain')) return '🌧️';
    if (c.includes('flame') || c.includes('fire')) return '🔥';
    if (c.includes('motor driver') || c.includes('l298') || c.includes('l293')) return '🔋';
    if (c.includes('relay')) return '🔌';
    if (c.includes('servo')) return '🔧';
    if (c.includes('dc motor')) return '⚙️';
    if (c.includes('stepper')) return '🔄';
    if (c.includes('led')) return '💡';
    if (c.includes('buzzer')) return '🔔';
    if (c.includes('lcd')) return '📟';
    if (c.includes('oled')) return '📱';
    if (c.includes('battery')) return '🔋';
    return '🔌';
}

function truncate(str, n) {
    return str.length > n ? str.slice(0, n - 1) + '…' : str;
}