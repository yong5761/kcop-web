'use strict';

function parseBellData(hexOrBuffer) {
  let buf;
  try {
    if (Buffer.isBuffer(hexOrBuffer)) {
      buf = hexOrBuffer;
    } else {
      const hex = String(hexOrBuffer).trim();
      if (hex.length !== 40) {
        return { valid: false, error: 'hex string must be 40 characters' };
      }
      buf = Buffer.from(hex, 'hex');
    }
  } catch (e) {
    return { valid: false, error: 'hex parse failed: ' + e.message };
  }

  if (buf.length !== 20) {
    return { valid: false, error: 'payload must be exactly 20 bytes' };
  }

  const lng         = buf.readUInt8(0);
  const phonenumber = buf.readUInt32LE(1);
  const bellnumber  = buf.readUInt8(5);
  const seqnum      = buf.readUInt8(6);
  const voltage     = buf.readUInt8(7);
  const bellstatus  = buf.readUInt32LE(8);
  const machinenum  = buf.readUInt32LE(12);
  const rsv1        = buf.readUInt8(16);
  const rsv2        = buf.readUInt8(17);
  const fw_version  = buf.readUInt8(18);
  const chksum      = buf.readUInt8(19);

  let xor = 0;
  for (let i = 0; i < 19; i++) xor ^= buf[i];
  const checksumValid = xor === chksum;
  const valid = checksumValid;

  return { lng, phonenumber, bellnumber, seqnum, voltage, bellstatus, machinenum, rsv1, rsv2, fw_version, chksum, checksumValid, valid };
}

function topicToPhone(topic) {
  const m = String(topic).match(/^hk-multii\/MB_(\d+)\/log$/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

module.exports = { parseBellData, topicToPhone };

if (require.main === module) {
  const samples = [
    { hex: '149234D24A001900400800000008690700005A47', expectedPhone: 1255290002 },
    { hex: '14AE4DFE4A000100400801000009851A00005AC7', expectedPhone: 1258180014 },
    { hex: '149B7ECB4A000100400801000002EB1000005A9B', expectedPhone: 1254850203 },
    { hex: '1482A3014A00190040080000000D6DB000005AA5', expectedPhone: 1241621378 },
  ];

  const rows = samples.map(({ hex, expectedPhone }) => {
    const r = parseBellData(hex);
    return {
      hex: hex.slice(0, 8) + '...',
      phonenumber: r.phonenumber,
      expectedPhone,
      phoneMatch: r.phonenumber === expectedPhone,
      checksumValid: r.checksumValid,
      valid: r.valid,
    };
  });

  console.table(rows);
}
