#!/usr/bin/env python3
"""Render a deck with a task-local fontconfig, without editing system fonts."""
import argparse, os, subprocess
from pathlib import Path
from xml.sax.saxutils import escape

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('pptx', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--font-dir', type=Path, action='append', default=[])
    args = parser.parse_args()
    pptx, output = args.pptx.resolve(), args.output.resolve()
    if not pptx.is_file(): parser.error('PPTXが見つかりません')
    output.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    if args.font_dir:
        dirs = [p.resolve() for p in args.font_dir]
        if any(not p.is_dir() for p in dirs): parser.error('font-dirが見つかりません')
        cache = output / '.font-cache'; cache.mkdir(exist_ok=True)
        config = output / '.fontconfig.xml'
        config.write_text('<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig>' + ''.join(f'<dir>{escape(str(p))}</dir>' for p in dirs) + f'<cachedir>{escape(str(cache))}</cachedir>' + '<alias><family>Noto Sans JP</family><prefer><family>Noto Sans CJK JP</family></prefer></alias><alias><family>Noto Sans Mono</family><prefer><family>Menlo</family></prefer></alias></fontconfig>', encoding='utf-8')
        env['FONTCONFIG_FILE'] = str(config)
    subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', str(output), str(pptx)], env=env, check=True)
    pdf = output / (pptx.stem + '.pdf')
    if not pdf.is_file(): raise RuntimeError('PDF変換結果がありません')
    subprocess.run(['pdftoppm', '-png', '-r', '96', str(pdf), str(output / 'slide')], check=True)
    print(pdf)

if __name__ == '__main__': main()
