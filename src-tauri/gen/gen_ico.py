#!/usr/bin/env python3
"""Generate a Windows .ico from two PNG files.

Reads src-tauri/icons/icon-16x16.png and src-tauri/icons/icon-32x32.png,
builds a minimal ICO with two image entries (16x16 + 32x32), and writes
src-tauri/icons/icon.ico.

ICO layout:
  [reserved:2][type:2][count:2]     -> ICO header (6 bytes)
  [width:1][height:1][colors:1][reserved:1][planes:2][bpp:4][size:4][offset:4] x N -> 16 bytes/entry
  [image 1 bytes]
  [image 2 bytes]
  ...
"""
import struct, os, sys

SCRIPT = os.path.abspath(__file__)
REPO = os.path.dirname(os.path.dirname(SCRIPT))  # repo root (parent of gen/)
ICONDIR = os.path.join(REPO, "icons")  # gen/ -> src-tauri/ -> icons/
OUT = os.path.join(ICONDIR, "icon.ico")

PNG16 = os.path.join(ICONDIR, "icon-16x16.png")
PNG32 = os.path.join(ICONDIR, "icon-32x32.png")

if not os.path.exists(PNG16) or not os.path.exists(PNG32):
    print(f"missing inputs: {PNG16!r} or {PNG32!r}", file=sys.stderr)
    sys.exit(1)

b16 = open(PNG16, "rb").read()
b32 = open(PNG32, "rb").read()

# For each PNG, the embedded image is the full PNG bytes (after the 8-byte PNG sig,
# which we keep — ICO image data is just raw bytes the OS will hand to the decoder).
imgs = [b16, b32]

# Directory starts at offset 6; after N entries we start image data.
# 6 + 16*count.
data_off = 6 + 16 * len(imgs)

entries = []
for b in imgs:
    # PNG header: 8-byte sig + IHDR chunk.
    # IHDR: length(4) + type(4) + width(4) + height(4) + ...
    # So IHDR starts at offset 8.
    sig = b[:8]
    ihdr = b[8:8+8]
    # chunk length is at off 8
    length = struct.unpack(">I", b[8:12])[0]
    # chunk type at off 12
    ctype = b[12:16]
    # width/height at off 16 and 20
    w = struct.unpack(">I", b[16:20])[0]
    h = struct.unpack(">I", b[20:24])[0]
    # ICOICONDIR entry is exactly 16 bytes:
    #   BYTE  width, BYTE  height, BYTE  colorCount, BYTE  reserved,
    #   WORD  planes, WORD  bitCount (bpp),
    #   DWORD bytesInRes, DWORD imageOffset
    # Using 'H' (WORD) for bitCount, not 'I' (DWORD) — that is the bug
    # that produced a malformed "old DIB" error from rc.exe.
    entries.append(
        struct.pack("<BBBBHHII", w, h & 0xFF, 0, 0, 1, 0x20, len(b), data_off)
    )
    data_off += len(b)

with open(OUT, "wb") as f:
    f.write(struct.pack("<HHH", 0, 1, len(imgs)))
    for e in entries:
        f.write(e)
    for b in imgs:
        f.write(b)

print(f"wrote {OUT} ({os.path.getsize(OUT)} bytes)")
