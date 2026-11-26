"""Smoke test that deployed HTML and its JS import graph use one asset version."""
import re
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SiteBuildTest(unittest.TestCase):
    def test_asset_versioning_and_new_markets(self):
        subprocess.run([sys.executable, "scripts/build.py"], cwd=ROOT, check=True)
        html = (ROOT / "dist/index.html").read_text(encoding="utf-8")
        app = (ROOT / "dist/app.js").read_text(encoding="utf-8")
        theme = (ROOT / "dist/theme.js").read_text(encoding="utf-8")
        markets = (ROOT / "dist/markets.js").read_text(encoding="utf-8")
        match = re.search(r'src="app[.]js[?]v=([a-f0-9]{12})"', html)
        self.assertIsNotNone(match)
        version = match.group(1)
        self.assertIn(f'href="styles.css?v={version}"', html)
        self.assertIn(f"import './theme.js?v={version}'", app)
        self.assertIn(f"from './markets.js?v={version}'", theme)
        self.assertIn("College Towns", markets)
        self.assertIn("Upstate & Western New York", markets)
        self.assertIn('id="font-select"', html)
        self.assertIn('id="theme-select"', html)
        self.assertIn('id="mode-regional"', html)
        self.assertIn('id="mode-college"', html)
        self.assertIn('id="mode-affordable"', html)
        self.assertIn('id="affordable-finances"', html)
        self.assertIn('id="affordable-unverified"', html)
        self.assertIn('id="discovery-college-state"', html)
        self.assertIn('id="browse-regional"', html)
        self.assertIn('id="browse-college"', html)
        self.assertIn('<header id="site-header">', html)
        self.assertIn('<a href="#home" aria-label="Go to home">Home</a>', html)
        self.assertIn('id="home"', html)
        styles=(ROOT / 'dist/styles.css').read_text(encoding='utf-8')
        self.assertIn('header#site-header', styles)
        self.assertIn('position: sticky', styles)
        self.assertIn('scroll-padding-top: var(--sticky-header-height)', styles)
        controller=(ROOT / 'dist/discovery-ui.js').read_text(encoding='utf-8')
        self.assertIn("switchScope('regional'", controller)
        self.assertIn("switchScope('college'", controller)
        self.assertIn("switchScope('affordable'", controller)
        self.assertIn('computeCashflow', controller)
        self.assertIn("$('affordable-unverified').checked=scope==='affordable'", controller)
        self.assertIn('House type not confirmed', controller)
