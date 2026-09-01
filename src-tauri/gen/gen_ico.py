#!/usr/bin/env python3
"""Generate a Windows multi-resolution .ico from PNG source images.

Reads every matching `icon-WxH.png` under `src-tauri/icons/` and packs them
into a valid ICO file at `src-tauri/icons/icon.ico`.

A Windows ICO file consists of:
  - ICONDIR header (6 bytes): reserved(2) = 0, type(2) = 1, count(2) = N
  - N * ICONDIRENTRY (16 bytes each)
  - N image blobs (raw bytes: for PNG-compressed entries, the full PNG
    including its 8-byte signature). Each entry records the byte length and
    file offset of its blob; offsets are computed so the directory sits
    first, then every image follows in order.

This is a generator, not a runtime artifact: it produces a checked-in
`icon.ico` that `tauri-build`/rc.exe embeds into the Windows resource.
"""
import os
import struct
import sys


def png_dim(data):
    """Return (width, height) from a PNG's IHDR chunk (bytes 16-23)."""
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG file")
    # IHDR: 4-byte length (big-endian) + "IHDR" + 13 bytes payload.
    # width at bytes 16-19, height at bytes 20-23 (both big-endian).
    width = int.from_bytes(data[16:20], "big")
    height = int.from_bytes(data[20:24], "big")
    if width <= 0 or height <= 0:
        raise ValueError(f"bad PNG dimensions {width}x{height}")
    return width, height


def main():
    script = os.path.abspath(__file__)
    repo = os.path.dirname(os.path.dirname(script))  # src-tauri/
    icondir = os.path.join(repo, "icons")

    # Only collect 16x16 / 32x32 / 48x48 / 64x64 / 128x128 / 256x256 PNG icons.
    want = {"16x16", "32x32", "48x48", "64x64", "128x128", "256x256"}
    found = []
    for name in sorted(os.listdir(icondir)):
        base, ext = os.path.splitext(name)
        if ext.lower() != ".png" or not base.startswith("icon-"):
            continue
        tag = base[len("icon-"):]
        if tag not in want:
            continue
        path = os.path.join(icondir, name)
        with open(path, "rb") as f:
            data = f.read()
        width, height = png_dim(data)
        found.append((width, height, data, path))

    if not found:
        print("no icon-WHxH.png sources found in", icondir, file=sys.stderr)
        return 1

    count = len(found)
    header_size = 6
    entry_size = 16
    data_start = header_size + entry_size * count

    out = os.path.join(icondir, "icon.ico")
    with open(out, "wb") as f:
        # ICONDIR
        f.write(bytes([0, 0, 1, 0]))  # reserved=0, type=1 (icon)
        f.write(count.to_bytes(2, "little"))
        # ICONDIRENTRY per image + image bytes
        offset = data_start
        for width, height, data, _path in found:
            w = min(width, 256)  # 0 means 256 per spec, but we have small icons
            h = min(height, 256)
            entry = struct.pack(
                "<BBBBHHII",
                w & 0xFF, h & 0xFF, 0, 0,  # width, height, color count, reserved
                1, 32,                       # planes, bits per pixel
                len(data),                   # bytes in this image's resource
                offset,                      # file offset to image data
            )
            f.write(entry)
            offset += len(data)
        for _width, _height, data, _path in found:
            f.write(data)

    print(f"wrote {out} ({os.path.getsize(out)} bytes, {count} images: "
          + ", ".join(f"{w}x{h}" for w, h, _d, _p in found) + ")")
    return 0


if __name__ == "__main__":
    sys.exit(main())
