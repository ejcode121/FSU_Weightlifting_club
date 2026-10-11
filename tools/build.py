#!/usr/bin/env python3
"""Build the single-file app: python3 tools/build.py  ->  index.html
Inlines src/styles.css, src/core.js + src/ui.js, and fonts/archivo-lim.woff2 (base64)."""
import base64, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
r = lambda p: (root / p).read_text(encoding="utf-8")
font = base64.b64encode((root / "fonts/archivo-lim.woff2").read_bytes()).decode()
css = r("src/styles.css").replace("{{FONT}}", "data:font/woff2;base64," + font)
js = r("src/core.js") + "\n" + r("src/ui.js")
html = r("src/template.html").replace("{{CSS}}", css).replace("{{JS}}", js.replace("</script", "<\\/script"))
(root / "index.html").write_text(html, encoding="utf-8")
print("index.html", len(html.encode()) // 1024, "KB")
