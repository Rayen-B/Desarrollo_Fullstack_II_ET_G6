#!/usr/bin/env python3
"""Convierte las imágenes de src/assets/images a WebP y reduce su tamaño.

Uso (desde la raíz del proyecto):
    pip install Pillow
    python3 scripts/optimizar_imagenes.py              # convierte y borra los originales
    python3 scripts/optimizar_imagenes.py --dry-run    # solo muestra lo que haría

Las claves de imagen del proyecto (ej. "menu/Torta_Trufa") no llevan extensión,
así que convertir a .webp no rompe ninguna referencia.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image, ImageOps

EXTENSIONES = {'.jpg', '.jpeg', '.jfif', '.png'}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--carpeta', default='src/assets/images')
    ap.add_argument('--calidad', type=int, default=80, help='calidad WebP 1-100 (por defecto 80)')
    ap.add_argument('--max-menu', type=int, default=1200, help='lado mayor máximo de las fotos de menu/ (px)')
    ap.add_argument('--max-otras', type=int, default=1920, help='lado mayor máximo del resto (portadas, etc.) (px)')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    base = Path(args.carpeta)
    if not base.is_dir():
        sys.exit(f'No existe la carpeta {base}')

    antes = despues = convertidas = 0
    for origen in sorted(p for p in base.rglob('*') if p.suffix.lower() in EXTENSIONES):
        destino = origen.with_suffix('.webp')
        if destino.exists():
            print(f'  salta (ya existe {destino.name}): {origen}')
            continue
        limite = args.max_menu if 'menu' in origen.relative_to(base).parts else args.max_otras
        with Image.open(origen) as im:
            im = ImageOps.exif_transpose(im)          # respeta la orientación de la cámara
            im.thumbnail((limite, limite), Image.LANCZOS)  # solo reduce, nunca agranda
            if im.mode not in ('RGB', 'RGBA'):
                im = im.convert('RGBA' if 'transparency' in im.info else 'RGB')
            peso_antes = origen.stat().st_size
            if args.dry_run:
                print(f'  convertiría {origen} ({peso_antes / 1024:.0f} KB) -> {im.size}')
                antes += peso_antes
                continue
            im.save(destino, 'WEBP', quality=args.calidad, method=6)
        peso_despues = destino.stat().st_size
        if peso_despues >= peso_antes:                # WebP no ayudó: se conserva el original
            destino.unlink()
            print(f'  conserva original (WebP no es más liviano): {origen}')
            continue
        origen.unlink()
        antes += peso_antes
        despues += peso_despues
        convertidas += 1

    if not args.dry_run:
        ahorro = (1 - despues / antes) * 100 if antes else 0
        print(f'{convertidas} imágenes convertidas: {antes / 1048576:.1f} MB -> {despues / 1048576:.1f} MB (-{ahorro:.0f}%)')


if __name__ == '__main__':
    main()
